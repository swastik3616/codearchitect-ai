from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import os
import uuid

from services.repo_service import clone_repository
from parsers.code_parser import parse_repository
from embeddings.embedder import store_chunks
from services.graph_service import generate_dependency_graph
from agents.qa_agent import generate_project_summary, answer_question

router = APIRouter()

# Simple in-memory task status tracker for MVP
tasks = {}

class RepoRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    url: str
    question: str

def process_repository(task_id: str, url: str):
    try:
        tasks[task_id] = {"status": "cloning"}
        storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
        os.makedirs(storage_path, exist_ok=True)
        
        repo_dir = clone_repository(url, storage_path)
        
        tasks[task_id] = {"status": "parsing"}
        chunks = parse_repository(repo_dir)
        
        tasks[task_id] = {"status": "embedding"}
        num_chunks = store_chunks(url, chunks)
        
        tasks[task_id] = {"status": "generating_architecture"}
        # Sample code for summary (taking first 5 chunks)
        sample_code = "\n".join([c['code'][:200] for c in chunks[:5]])
        graph = generate_dependency_graph(repo_dir)
        summary = generate_project_summary(str(graph), sample_code)
        
        tasks[task_id] = {
            "status": "completed",
            "summary": summary,
            "graph": graph,
            "chunks_processed": num_chunks
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        tasks[task_id] = {"status": "failed", "error": str(e)}

@router.post("/analyze-repo")
async def analyze_repo(request: RepoRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending"}
    background_tasks.add_task(process_repository, task_id, request.url)
    return {"message": "Repository analysis started in background", "task_id": task_id}

@router.get("/analyze-status/{task_id}")
async def analyze_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

@router.post("/ask-question")
async def ask_question_api(request: QuestionRequest):
    from services.repo_service import get_repo_hash
    
    storage_path = os.path.abspath(os.getenv("REPO_STORAGE_PATH", "./repos"))
    repo_hash = get_repo_hash(request.url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    graph_str = ""
    if os.path.exists(repo_dir):
        try:
            graph = generate_dependency_graph(repo_dir)
            graph_str = str(graph)
        except Exception:
            pass
            
    answer = answer_question(request.url, request.question, graph_str)
    return {"answer": answer}
