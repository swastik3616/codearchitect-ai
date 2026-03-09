import os
import shutil
import hashlib
from git import Repo

MAX_FILES = 1000
MAX_FILE_SIZE = 1 * 1024 * 1024 # 1MB

def get_repo_hash(url: str) -> str:
    return hashlib.sha256(url.encode('utf-8')).hexdigest()

def clone_repository(url: str, storage_path: str) -> str:
    repo_hash = get_repo_hash(url)
    repo_dir = os.path.join(storage_path, repo_hash)
    
    if os.path.exists(repo_dir):
        print(f"Repo already cached at {repo_dir}")
        return repo_dir

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