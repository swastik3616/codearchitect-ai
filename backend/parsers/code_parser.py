import os
import ast

ALLOWED_EXTENSIONS = {'.py', '.js', '.ts', '.tsx', '.java', '.go', '.rs', '.cpp', '.c'}
IGNORED_DIRS = {'node_modules', '.git', 'dist', 'build', 'images', 'bin', 'obj', 'venv', 'env'}

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
        chunks.append({"type": "file", "name": os.path.basename(filepath), "code": content[:2000], "file": filepath})
    return chunks

def parse_generic_file(filepath: str, content: str):
    chunks = []
    lines = content.splitlines()
    chunk_code = []
    chunk_start = 0
    for i, line in enumerate(lines):
        chunk_code.append(line)
        if len(chunk_code) > 50 and line.strip() == "}":
            chunks.append({"type": "block", "name": f"block_{chunk_start}", "code": "\n".join(chunk_code), "file": filepath})
            chunk_code = []
            chunk_start = i + 1
    if chunk_code:
        chunks.append({"type": "block", "name": f"block_{chunk_start}", "code": "\n".join(chunk_code), "file": filepath})
    return chunks

def process_file(filepath: str):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return []

    if filepath.endswith('.py'):
        return parse_python_file(filepath, content)
    else:
        return parse_generic_file(filepath, content)

def parse_repository(repo_dir: str):
    all_chunks = []
    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
        for file in files:
            if is_code_file(file):
                filepath = os.path.join(root, file)
                file_chunks = process_file(filepath)
                # Store relative path for cleaner output
                rel_path = os.path.relpath(filepath, repo_dir)
                for chunk in file_chunks:
                    chunk['file'] = rel_path
                all_chunks.extend(file_chunks)
    return all_chunks