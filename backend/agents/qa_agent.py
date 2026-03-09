import os
from openai import OpenAI
import hashlib

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)

def generate_project_summary(repo_structure_str: str, sample_chunks_str: str) -> str:
    client = get_openai_client()
    if not client:
        return "OpenAI API Key not configured. Please add OPENAI_API_KEY to your .env file."
        
    prompt = f"""
You are an expert software architect analyzing a codebase.
Explain the architecture of this repository based on the following code files and structure.
Describe modules, responsibilities, and workflow.

Structure:
{repo_structure_str}

Sample Code Context:
{sample_chunks_str}
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a senior software architect."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def answer_question(repo_url: str, question: str) -> str:
    from embeddings.embedder import get_chroma_client, model as embed_model
    
    client = get_openai_client()
    if not client:
        return "OpenAI API Key not configured."
        
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
You are a helpful coding assistant analyzing a user's repository. Use the following snippets from the codebase to answer the user's question. If the answer is not in the context, say "I couldn't find the answer in the provided repository context."

Context:
{context_str}

Question: {question}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful coding assistant examining a repository."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error answering question: {str(e)}"