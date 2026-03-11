import os
from openai import OpenAI
import hashlib

def get_llm_client_and_model():
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        return OpenAI(api_key=gemini_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/"), "gemini-2.5-flash"
        
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None, None
    return OpenAI(api_key=api_key), "gpt-3.5-turbo"

def generate_project_summary(repo_structure_str: str, sample_chunks_str: str) -> str:
    client, model_name = get_llm_client_and_model()
    if not client:
        return "API Key not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file."
        
    prompt = f"""
You are an expert software architect analyzing a codebase.
Explain the architecture of this repository based on the following code files and structure.
IMPORTANT: You must include an "Abstract" summarizing what this project is about, and a "Technology Stack" section listing the most important technologies, languages, and frameworks used. You must determine this generically by examining the file extensions and names in the Structure provided, supporting any project type (e.g. raw HTML/CSS/JS, Python, Java, React).
Describe modules, responsibilities, and workflow.

Structure:
{repo_structure_str}

Sample Code Context:
{sample_chunks_str}
"""
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a senior software architect."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def answer_question(repo_url: str, question: str, repo_structure_str: str = "") -> str:
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
        n_results=5
    )
    
    context_str = ""
    for i, doc in enumerate(results['documents'][0]):
        meta = results['metadatas'][0][i]
        context_str += f"\n--- File: {meta['file']} ({meta['type']} {meta['name']}) ---\n{doc}\n"
        
    prompt = f"""
You are a helpful coding assistant analyzing a user's repository. Use the following codebase context and repository structure to answer the user's question.
If the user asks if a specific file or folder is present, check the Repository Structure carefully to verify its true existence and state yes or no explicitly.
If the user asks for a structural UML diagram, architecture diagram, or flow diagram, ALWAYS output it using Mermaid.js syntax inside a markdown mermaid code block:
```mermaid
graph TD
  ...
```
If the answer is not in the context, say "I couldn't find the answer in the provided repository context."

Repository Structure:
{repo_structure_str}

Context Snippets:
{context_str}

Question: {question}
"""

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful coding assistant examining a repository."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error answering question: {str(e)}"