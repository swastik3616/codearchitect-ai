from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import os
import uuid

from services.repo_service import clone_repository, get_repo_hash, get_repo_tree, check_embedding_exists, get_file_content
from parsers.code_parser import parse_repository
from embeddings.embedder import store_chunks
from services.graph_service import generate_dependency_graph
from agents.qa_agent import generate_project_summary, answer_question, explain_file, search_code, analyze_code_quality

router = APIRouter()

# Simple in-memory task status tracker
tasks = {}

class RepoRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    url: str
    question: str

class ExplainFileRequest(BaseModel):
    url: str
    file_path: str

class SearchRequest(BaseModel):
    url: str
    query: str

# ─────────────────────────────────────────────────────────────────────────────
# Background repository processing (Feature 7, 8, 9)
# ─────────────────────────────────────────────────────────────────────────────
def process_repository(task_id: str, url: str):
    try:
        storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
        os.makedirs(storage_path, exist_ok=True)
        
        repo_hash = get_repo_hash(url)
        repo_dir = os.path.join(storage_path, repo_hash)

        # Feature 9 — Repository Caching: skip re-embedding if already stored
        embedding_exists = check_embedding_exists(url)
        
        if embedding_exists and os.path.exists(repo_dir):
            tasks[task_id] = {"status": "using_cache"}
            print(f"Cache hit for {url} — reusing existing embeddings")
            # Re-generate graph + summary from cached repo (cheap operation)
            tree = get_repo_tree(repo_dir)
            graph = generate_dependency_graph(repo_dir)
            summary = generate_project_summary(tree[:4000], "")
            tasks[task_id] = {
                "status": "completed",
                "summary": summary,
                "graph": graph,
                "chunks_processed": "cached",
                "tree": tree
            }
            return

        # Full processing path
        tasks[task_id] = {"status": "cloning"}
        repo_dir = clone_repository(url, storage_path)
        
        tasks[task_id] = {"status": "parsing"}
        chunks = parse_repository(repo_dir)
        
        tasks[task_id] = {"status": "embedding"}
        num_chunks = store_chunks(url, chunks)
        
        tasks[task_id] = {"status": "generating_architecture"}
        tree = get_repo_tree(repo_dir)
        # Use more diverse samples — first 10 chunks from different files
        seen_files = set()
        sample_chunks = []
        for c in chunks:
            if c['file'] not in seen_files:
                seen_files.add(c['file'])
                sample_chunks.append(c)
            if len(sample_chunks) >= 10:
                break
        sample_code = "\n".join([c['code'][:300] for c in sample_chunks])
        
        graph = generate_dependency_graph(repo_dir)
        summary = generate_project_summary(tree[:4000], sample_code)
        
        tasks[task_id] = {
            "status": "completed",
            "summary": summary,
            "graph": graph,
            "chunks_processed": num_chunks,
            "tree": tree
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        tasks[task_id] = {"status": "failed", "error": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
# Core endpoints
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/analyze-repo")
async def analyze_repo(request: RepoRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending"}
    background_tasks.add_task(process_repository, task_id, request.url)
    return {"message": "Repository analysis started", "task_id": task_id}

@router.get("/analyze-status/{task_id}")
async def analyze_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

# Feature 2 — Repo Structure + Chat
@router.post("/ask-question")
async def ask_question_api(request: QuestionRequest):
    storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
    repo_hash = get_repo_hash(request.url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    repo_tree = ""
    graph_str = ""
    if os.path.exists(repo_dir):
        try:
            repo_tree = get_repo_tree(repo_dir)
            graph = generate_dependency_graph(repo_dir)
            graph_str = str(graph)
        except Exception:
            pass
            
    answer = answer_question(request.url, request.question, graph_str, repo_tree)
    return {"answer": answer}

# Feature 3 — Explain Any File
@router.post("/explain-file")
async def explain_file_api(request: ExplainFileRequest):
    storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
    repo_hash = get_repo_hash(request.url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    if not os.path.exists(repo_dir):
        raise HTTPException(status_code=404, detail="Repository not found. Please analyze it first.")
    
    try:
        content = get_file_content(repo_dir, request.file_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    repo_tree = get_repo_tree(repo_dir)
    explanation = explain_file(request.file_path, content, repo_tree)
    return {"explanation": explanation, "file_path": request.file_path}

# Feature 6 — Semantic Code Search
@router.post("/search")
async def search_repo(request: SearchRequest):
    results = search_code(request.url, request.query)
    return {"results": results, "query": request.query}

# Feature 10 — Code Quality Insights
@router.post("/code-quality")
async def code_quality_api(request: RepoRequest):
    storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
    repo_hash = get_repo_hash(request.url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    repo_tree = ""
    if os.path.exists(repo_dir):
        try:
            repo_tree = get_repo_tree(repo_dir)
        except Exception:
            pass
    
    report = analyze_code_quality(request.url, repo_tree)
    return {"report": report}
