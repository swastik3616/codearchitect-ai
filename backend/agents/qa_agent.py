import os
import hashlib

def get_llm_client_and_model():
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        from openai import OpenAI
        return OpenAI(api_key=gemini_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/"), "gemini-2.5-flash"
        
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None, None
    from openai import OpenAI
    return OpenAI(api_key=api_key), "gpt-4o-mini"

def _call_llm(prompt: str, system: str, max_tokens: int = 1200) -> str:
    client, model_name = get_llm_client_and_model()
    if not client:
        return "API Key not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file."
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error from LLM: {str(e)}"

# ─────────────────────────────────────────────────────────────────────────────
# Feature 1 — Intelligent Architecture Analysis
# ─────────────────────────────────────────────────────────────────────────────
def generate_project_summary(repo_structure_str: str, sample_chunks_str: str) -> str:
    prompt = f"""You are an expert software architect analyzing a codebase.
Based on the repository structure and sample code below, produce a comprehensive analysis using EXACTLY these four markdown sections:

## Abstract
Write 2-3 sentences explaining what this project does and its primary purpose.

## Core Technologies
List all detected technologies, frameworks, languages, and tools as a bullet list.
Detect these from: file extensions, directory names, dependency files (package.json, requirements.txt, Cargo.toml, go.mod, pom.xml, Gemfile, Dockerfile, docker-compose.yml, .env), and configuration files.
Examples of technologies to detect: React, Next.js, Vue, Angular, FastAPI, Flask, Django, Express, Node.js, Python, TypeScript, JavaScript, Java, Go, Rust, PostgreSQL, MySQL, MongoDB, Redis, Docker, Kubernetes, Tailwind, GraphQL, REST, gRPC, Celery, etc.

## Main System Components
Describe the main modules, directories, or subsystems (3-8 bullet points).
For each, describe its responsibility in 1 sentence.

## Architecture Style
Identify the overall architecture pattern (e.g. Monolith, MVC, Microservices, Serverless, Event-driven, Layered, Hexagonal).
Briefly explain why the codebase matches this pattern.

Repository Structure:
{repo_structure_str}

Sample Code Context:
{sample_chunks_str}
"""
    return _call_llm(
        prompt=prompt,
        system="You are a senior software architect producing clear, structured repository analysis.",
        max_tokens=1500
    )

# ─────────────────────────────────────────────────────────────────────────────
# Feature 2 + Chat — Answer Questions with Repo Tree Context
# ─────────────────────────────────────────────────────────────────────────────
def answer_question(repo_url: str, question: str, repo_structure_str: str = "", repo_tree: str = "") -> str:
    from embeddings.embedder import get_chroma_client, model as embed_model
    
    client, model_name = get_llm_client_and_model()
    if not client:
        return "API Key not configured."
        
    chroma_client = get_chroma_client()
    collection_name = hashlib.sha256(repo_url.encode('utf-8')).hexdigest()
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
    except Exception:
        return "Repository not found or not analyzed yet. Please analyze the repository first."
        
    if not embed_model:
        return "SentenceTransformer model not loaded correctly."
        
    question_embedding = embed_model.encode([question]).tolist()
    
    results = collection.query(
        query_embeddings=question_embedding,
        n_results=8
    )
    
    context_str = ""
    for i, doc in enumerate(results['documents'][0]):
        meta = results['metadatas'][0][i]
        context_str += f"\n--- File: {meta['file']} ({meta['type']} `{meta['name']}`) ---\n{doc}\n"

    tree_section = f"\nFull Repository File Tree:\n{repo_tree}\n" if repo_tree else ""
    
    prompt = f"""You are a helpful coding assistant analyzing a user's GitHub repository.

Use the repository file tree and code snippets below to answer the question accurately.

IMPORTANT RULES:
1. If asked whether a file or folder EXISTS, check the Repository File Tree precisely and answer YES or NO clearly.
2. If asked to explain a file or function, use the Code Snippets.
3. If asked for any architecture, flow, component, module, data flow, or UML diagram, ALWAYS respond using Mermaid.js syntax in a markdown code block:
```mermaid
flowchart TD
  A --> B
```
4. Use `flowchart TD` for most diagrams. Use `classDiagram` for class relationships, `sequenceDiagram` for sequences.
5. If the answer is not in the context, say "I couldn't find that in the provided repository context."
{tree_section}
Code Snippets (most relevant to the question):
{context_str}

Question: {question}
"""
    return _call_llm(
        prompt=prompt,
        system="You are a helpful, accurate coding assistant examining a repository. Never hallucinate file names or structures.",
        max_tokens=1400
    )

# ─────────────────────────────────────────────────────────────────────────────
# Feature 3 — Explain Any File
# ─────────────────────────────────────────────────────────────────────────────
def explain_file(file_path: str, file_content: str, repo_tree: str = "") -> str:
    tree_context = f"\nRepository structure for context:\n{repo_tree[:3000]}\n" if repo_tree else ""
    prompt = f"""You are a senior software engineer. Analyze the following file and produce a structured explanation.

File: {file_path}
{tree_context}

File Content:
```
{file_content[:6000]}
```

Respond with these sections:
## Purpose
What this file does and why it exists.

## Main Functions / Classes
List each major function or class with a 1-line description.

## Dependencies & Imports
What external libraries or internal modules does this file depend on?

## Potential Issues
Any code smells, security concerns, missing error handling, or areas to improve.

## Role in System Architecture
How does this file fit into the broader system? What calls it? What does it call?
"""
    return _call_llm(
        prompt=prompt,
        system="You are a senior software engineer producing precise, structured file analysis.",
        max_tokens=1400
    )

# ─────────────────────────────────────────────────────────────────────────────
# Feature 6 — Semantic Code Search
# ─────────────────────────────────────────────────────────────────────────────
def search_code(repo_url: str, query: str, top_k: int = 6) -> list:
    from embeddings.embedder import get_chroma_client, model as embed_model
    
    if not embed_model:
        return []
    
    chroma_client = get_chroma_client()
    collection_name = hashlib.sha256(repo_url.encode('utf-8')).hexdigest()
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
    except Exception:
        return []
    
    query_embedding = embed_model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )
    
    items = []
    for i, doc in enumerate(results['documents'][0]):
        meta = results['metadatas'][0][i]
        # Provide a short snippet (first 300 chars)
        snippet = doc[:300].strip()
        items.append({
            "file": meta.get("file", ""),
            "type": meta.get("type", ""),
            "name": meta.get("name", ""),
            "snippet": snippet
        })
    return items

# ─────────────────────────────────────────────────────────────────────────────
# Feature 10 — AI Code Quality Insights
# ─────────────────────────────────────────────────────────────────────────────
def analyze_code_quality(repo_url: str, repo_tree: str = "") -> str:
    from embeddings.embedder import get_chroma_client, model as embed_model
    
    client, model_name = get_llm_client_and_model()
    if not client:
        return "API Key not configured."
    
    chroma_client = get_chroma_client()
    collection_name = hashlib.sha256(repo_url.encode('utf-8')).hexdigest()
    
    try:
        collection = chroma_client.get_collection(name=collection_name)
    except Exception:
        return "Repository not analyzed yet. Please analyze the repository first."
    
    # Use a broad quality-focused query to retrieve representative code
    if embed_model:
        queries = ["error handling exception", "authentication security", "database query", "function logic business"]
        all_docs = []
        seen_names = set()
        for q in queries:
            qe = embed_model.encode([q]).tolist()
            res = collection.query(query_embeddings=qe, n_results=5)
            for i, doc in enumerate(res['documents'][0]):
                meta = res['metadatas'][0][i]
                key = f"{meta.get('file','')}/{meta.get('name','')}"
                if key not in seen_names:
                    seen_names.add(key)
                    all_docs.append(f"# {meta.get('file','')} — {meta.get('type','')} `{meta.get('name','')}`\n{doc[:400]}")
        code_context = "\n\n".join(all_docs[:20])
    else:
        # Fallback: peek at first 20 items
        all_items = collection.peek(limit=20)
        code_context = "\n\n".join(
            f"# {meta.get('file','')} — {doc[:400]}"
            for meta, doc in zip(all_items['metadatas'], all_items['documents'])
        )

    tree_section = f"\nRepository Structure:\n{repo_tree[:2000]}\n" if repo_tree else ""
    
    prompt = f"""You are a senior code reviewer performing a comprehensive code quality audit.

Analyze the following code samples from this repository and produce a structured quality report.
{tree_section}

Sampled Code:
{code_context}

Produce your analysis using these exact sections:

## 🔒 Security Risks
List any potential security vulnerabilities (injection, hardcoded secrets, missing auth, etc.)

## 🐛 Potential Bugs
List any logic errors, missing null checks, exception handling gaps, or race conditions.

## 🏗️ Code Smells
List any design issues: long functions, poor naming, duplicated logic, tight coupling, etc.

## ⚡ Performance Issues
Identify any inefficient algorithms, N+1 query patterns, blocking I/O, unnecessary re-computation.

## ✅ Recommendations
Top 3-5 actionable improvements the team should prioritize.
"""
    return _call_llm(
        prompt=prompt,
        system="You are a senior code reviewer performing an honest, objective code quality audit.",
        max_tokens=1600
    )