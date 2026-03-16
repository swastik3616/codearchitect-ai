import os
import ast
import re

ALLOWED_EXTENSIONS = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php', '.swift', '.kt', '.scala'}
IGNORED_DIRS = {
    'node_modules', '.git', 'dist', 'build', 'images', 'bin', 'obj',
    'venv', 'env', '.venv', '__pycache__', 'coverage', '.pytest_cache',
    'tmp', '.cache', 'logs', '.next', 'out', '.turbo', 'vendor'
}

MAX_FILE_SIZE = 200 * 1024  # 200 KB
MAX_FILES = 1500
MAX_CHUNK_LINES = 80

def is_code_file(filename: str) -> bool:
    return os.path.splitext(filename)[1] in ALLOWED_EXTENSIONS

def should_ignore_dir(dirname: str) -> bool:
    return any(ignored in dirname for ignored in IGNORED_DIRS)

def parse_python_file(filepath: str, content: str):
    chunks = []
    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                start_line = node.lineno - 1
                end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line + 10
                chunk_code = "\n".join(content.splitlines()[start_line:end_line])
                chunks.append({
                    "type": type(node).__name__,
                    "name": node.name,
                    "code": chunk_code,
                    "file": filepath
                })
        if not chunks:
            chunks.append({"type": "module", "name": os.path.basename(filepath), "code": content, "file": filepath})
    except SyntaxError:
        chunks.append({"type": "file", "name": os.path.basename(filepath), "code": content[:3000], "file": filepath})
    return chunks

def parse_js_ts_file(filepath: str, content: str):
    """Function-level chunking for JS/TS/JSX/TSX files using regex."""
    chunks = []
    lines = content.splitlines()

    # Match named functions, arrow functions assigned to const, class declarations
    patterns = [
        r'^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)',     # function declaration
        r'^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(',  # arrow function
        r'^\s*(?:export\s+)?class\s+(\w+)',                                      # class
    ]
    
    func_starts = []
    for i, line in enumerate(lines):
        for pattern in patterns:
            m = re.match(pattern, line)
            if m:
                func_starts.append((i, m.group(1)))
                break

    if not func_starts:
        # Fall back to block chunking
        return parse_generic_file(filepath, content)

    for idx, (start_line, name) in enumerate(func_starts):
        end_line = func_starts[idx + 1][0] if idx + 1 < len(func_starts) else len(lines)
        end_line = min(end_line, start_line + MAX_CHUNK_LINES)
        chunk_code = "\n".join(lines[start_line:end_line])
        chunks.append({
            "type": "function",
            "name": name,
            "code": chunk_code,
            "file": filepath
        })
    return chunks

def parse_generic_file(filepath: str, content: str):
    chunks = []
    lines = content.splitlines()
    chunk_code = []
    chunk_start = 0
    for i, line in enumerate(lines):
        chunk_code.append(line)
        if (len(chunk_code) > MAX_CHUNK_LINES and line.strip() in ("}", "};", "end")) or len(chunk_code) >= MAX_CHUNK_LINES * 2:
            chunks.append({"type": "block", "name": f"block_{chunk_start}", "code": "\n".join(chunk_code), "file": filepath})
            chunk_code = []
            chunk_start = i + 1
    if chunk_code:
        chunks.append({"type": "block", "name": f"block_{chunk_start}", "code": "\n".join(chunk_code), "file": filepath})
    return chunks

def process_file(filepath: str):
    try:
        size = os.path.getsize(filepath)
        if size > MAX_FILE_SIZE:
            return []
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return []

    ext = os.path.splitext(filepath)[1]
    if ext == '.py':
        return parse_python_file(filepath, content)
    elif ext in ('.js', '.ts', '.tsx', '.jsx'):
        return parse_js_ts_file(filepath, content)
    else:
        return parse_generic_file(filepath, content)

def parse_repository(repo_dir: str):
    all_chunks = []
    file_count = 0
    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
        for file in files:
            if not is_code_file(file):
                continue
            if file_count >= MAX_FILES:
                break
            filepath = os.path.join(root, file)
            file_chunks = process_file(filepath)
            rel_path = os.path.relpath(filepath, repo_dir)
            for chunk in file_chunks:
                chunk['file'] = rel_path.replace("\\", "/")
            all_chunks.extend(file_chunks)
            file_count += 1
    return all_chunks