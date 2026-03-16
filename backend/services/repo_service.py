import os
import shutil
import hashlib
import threading
from git import Repo

from parsers.code_parser import should_ignore_dir

MAX_FILES = 1500
MAX_FILE_SIZE = 200 * 1024  # 200 KB

_locks_dict = {}
_dict_lock = threading.Lock()

def _get_repo_lock(repo_hash: str) -> threading.Lock:
    with _dict_lock:
        if repo_hash not in _locks_dict:
            _locks_dict[repo_hash] = threading.Lock()
        return _locks_dict[repo_hash]

def get_repo_hash(url: str) -> str:
    return hashlib.sha256(url.encode('utf-8')).hexdigest()

def clone_repository(url: str, storage_path: str) -> str:
    repo_hash = get_repo_hash(url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    repo_lock = _get_repo_lock(repo_hash)
    
    with repo_lock:
        if os.path.exists(repo_dir):
            if os.path.exists(os.path.join(repo_dir, '.git')):
                print(f"Repo already cached at {repo_dir}")
                return repo_dir
            else:
                print(f"Cleaning up incomplete cache at {repo_dir}")
                shutil.rmtree(repo_dir, ignore_errors=True)

        print(f"Cloning {url} into {repo_dir}")
        try:
            Repo.clone_from(url, repo_dir, depth=1)
        except Exception as e:
            if os.path.exists(repo_dir):
                shutil.rmtree(repo_dir, ignore_errors=True)
            raise Exception(f"Failed to clone repository: {str(e)}")
        
    file_count = 0
    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if d != '.git']
        for file in files:
            file_count += 1
            if file_count > MAX_FILES:
                # Too many files — don't abort, just warn; parser will cap
                break
            file_path = os.path.join(root, file)
            if os.path.islink(file_path):
                continue

    return repo_dir

def get_repo_tree(repo_dir: str, max_entries: int = 2000) -> str:
    """Build an indented tree string of repository folder/file structure."""
    lines = []
    count = 0
    repo_name = os.path.basename(os.path.normpath(repo_dir))
    lines.append(f"{repo_name}/")

    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = sorted([d for d in dirs if not should_ignore_dir(d)])
        rel_root = os.path.relpath(root, repo_dir).replace("\\", "/")
        if rel_root == ".":
            depth = 0
        else:
            depth = rel_root.count("/") + 1
        indent = "  " * depth

        for d in dirs:
            lines.append(f"{indent}{d}/")
            count += 1
            if count >= max_entries:
                lines.append(f"{indent}... (truncated)")
                return "\n".join(lines)

        for f in files:
            lines.append(f"{indent}{f}")
            count += 1
            if count >= max_entries:
                lines.append(f"{indent}... (truncated)")
                return "\n".join(lines)

    return "\n".join(lines)

def check_embedding_exists(repo_url: str) -> bool:
    """Return True if the ChromaDB collection for this repo already has embeddings."""
    try:
        from embeddings.embedder import get_chroma_client
        client = get_chroma_client()
        collection_name = get_repo_hash(repo_url)
        try:
            collection = client.get_collection(name=collection_name)
            return collection.count() > 0
        except Exception:
            return False
    except Exception:
        return False

def get_file_content(repo_dir: str, file_path: str) -> str:
    """Safely read a file within the repo directory."""
    # Normalize and ensure path stays within repo
    safe_path = os.path.normpath(os.path.join(repo_dir, file_path.lstrip("/").lstrip("\\")))
    if not safe_path.startswith(os.path.normpath(repo_dir)):
        raise ValueError("Path traversal attempt detected")
    if not os.path.isfile(safe_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    with open(safe_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()