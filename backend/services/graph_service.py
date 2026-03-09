import os
import networkx as nx

def generate_dependency_graph(repo_dir: str):
    # For the MVP, we create a simplified graph of the directory structure
    # True code dependency tracing requires complex AST cross-referencing per language
    # We will represent folders and modules as nodes
    
    G = nx.DiGraph()
    root_name = os.path.basename(os.path.normpath(repo_dir))
    G.add_node(root_name, type="root")
    
    from parsers.code_parser import is_code_file, should_ignore_dir
    
    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
        
        current_node_path = os.path.relpath(root, repo_dir)
        if current_node_path == ".":
            current_node_path = root_name
            
        for d in dirs:
            dir_path = current_node_path + "/" + d if current_node_path != root_name else d
            G.add_node(dir_path, type="dir")
            G.add_edge(current_node_path, dir_path)
            
        for f in files:
            if is_code_file(f):
                file_path = current_node_path + "/" + f if current_node_path != root_name else f
                G.add_node(file_path, type="file")
                G.add_edge(current_node_path, file_path)
                
    # Convert to a format easily readable by the frontend (like edges and nodes for d3/cytoscape/react-flow)
    nodes = [{"id": node, "type": G.nodes[node].get("type", "unknown")} for node in G.nodes]
    edges = [{"source": u, "target": v} for u, v in G.edges]
    
    return {"nodes": nodes, "edges": edges}