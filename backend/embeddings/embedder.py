import os
import chromadb
from sentence_transformers import SentenceTransformer

# Load embedding model (runs locally)
# Using all-MiniLM-L6-v2 as it's fast and suitable for code text representations
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Failed to load sentence-transformer: {e}")
    model = None

def get_chroma_client():
    db_path = os.getenv('CHROMA_DB_PATH', './vector_db')
    os.makedirs(db_path, exist_ok=True)
    return chromadb.PersistentClient(path=db_path)

def store_chunks(repo_url: str, chunks: list):
    if not model:
        raise Exception("Embedding model not loaded")
        
    client = get_chroma_client()
    collection_name = hashlib.sha256(repo_url.encode('utf-8')).hexdigest()
    
    # Get or create collection
    collection = client.get_or_create_collection(name=collection_name)
    
    docs = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        docs.append(chunk['code'])
        metadatas.append({'file': chunk['file'], 'type': chunk['type'], 'name': chunk['name']})
        ids.append(f"chunk_{i}")
        
    if not docs:
        return 0
        
    # Generate embeddings
    embeddings = model.encode(docs).tolist()
    
    # Upsert to Chroma DB (batching if needed, but for MVP doing directly)
    collection.upsert(
        documents=docs,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    
    return len(docs)
import hashlib