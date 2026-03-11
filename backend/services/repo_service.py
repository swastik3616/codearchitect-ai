import os
import shutil
import hashlib
import threading
from git import Repo

MAX_FILES = 1000
MAX_FILE_SIZE = 1 * 1024 * 1024 # 1MB

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
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            file_count += 1
            if file_count > MAX_FILES:
                shutil.rmtree(repo_dir, ignore_errors=True)
                raise Exception(f"Repository exceeds max file limit of {MAX_FILES}")
                
            file_path = os.path.join(root, file)
            if os.path.islink(file_path):
                 continue
            if os.path.getsize(file_path) > MAX_FILE_SIZE:
                 shutil.rmtree(repo_dir, ignore_errors=True)
                 raise Exception(f"File {file} exceeds max file size of 1MB")

    return repo_dir