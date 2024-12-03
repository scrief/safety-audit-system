import os
from pathlib import Path

def generate_file_tree(start_path: str, exclude_dirs: list = None, exclude_files: list = None) -> str:
    """
    Generate a file tree structure starting from the given path.
    
    Args:
        start_path (str): The root directory to start from
        exclude_dirs (list): List of directory names to exclude
        exclude_files (list): List of file patterns to exclude
    
    Returns:
        str: A string representation of the file tree
    """
    if exclude_dirs is None:
        exclude_dirs = ['.git', 'node_modules', '__pycache__', '.venv', 'venv']
    if exclude_files is None:
        exclude_files = ['.pyc', '.pyo', '.pyd', '.DS_Store']
        
    tree = []
    start_path = os.path.abspath(start_path)
    
    def should_exclude(path, is_dir=True):
        name = os.path.basename(path)
        if is_dir:
            return name in exclude_dirs
        return any(name.endswith(ext) for ext in exclude_files)
    
    def add_to_tree(current_path, prefix=""):
        entries = sorted(os.scandir(current_path), key=lambda e: (not e.is_file(), e.name.lower()))
        
        for i, entry in enumerate(entries):
            is_last = i == len(entries) - 1
            
            if should_exclude(entry.path, entry.is_dir()):
                continue
                
            connector = "└── " if is_last else "├── "
            tree.append(f"{prefix}{connector}{entry.name}")
            
            if entry.is_dir():
                extension = "    " if is_last else "│   "
                add_to_tree(entry.path, prefix + extension)
    
    root_name = os.path.basename(start_path)
    tree.append(root_name)
    add_to_tree(start_path)
    
    return "\n".join(tree)

def save_tree_to_file(start_path: str, output_file: str = "file_tree.txt"):
    """
    Generate a file tree and save it to a file.
    
    Args:
        start_path (str): The root directory to start from
        output_file (str): The name of the output file
    """
    tree = generate_file_tree(start_path)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(tree)
    print(f"File tree has been saved to {output_file}")

# Example usage:
if __name__ == "__main__":
    # Generate and print tree
    current_dir = "."  # Use current directory
    tree = generate_file_tree(current_dir)
    print(tree)
    
    # Or save to file
    save_tree_to_file(current_dir)