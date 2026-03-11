import os
from dotenv import load_dotenv

load_dotenv()
try:
    from embeddings.embedder import get_chroma_client
    print("Trying to get chroma client...")
    client = get_chroma_client()
    print("Success:", client)
except Exception as e:
    print("Error:", repr(e))
