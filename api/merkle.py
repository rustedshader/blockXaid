import hashlib
from typing import List

def hash_leaf(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def hash_nodes(left: str, right: str) -> str:
    combined = left + right
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()

def build_merkle_tree(leaves: List[str]) -> List[str]:
    if not leaves:
        return ['']
    
    current_level = [hash_leaf(leaf) for leaf in leaves]
    
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else current_level[i]
            parent_hash = hash_nodes(left, right)
            next_level.append(parent_hash)
        current_level = next_level
    
    return current_level[0]  


if __name__ == '__main__':
    leaves = ['a', 'b', 'c', 'd']
    print(build_merkle_tree(leaves))