import hashlib
import math
import re
from typing import List

DIM = 768

def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9]+", (text or "").lower())

def _hash_embedding(text: str) -> List[float]:
    vec = [0.0] * DIM
    tokens = _tokenize(text)

    if not tokens:
        return vec

    for tok in tokens:
        h = int(hashlib.sha256(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % DIM
        sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
        vec[idx] += sign

    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]

def get_embedding(text: str, is_query: bool = False) -> List[float]:
    return _hash_embedding(text)

def get_embeddings_batch(texts: List[str], is_query: bool = False) -> List[List[float]]:
    return [_hash_embedding(t) for t in texts]

def get_embedding_dim() -> int:
    return DIM

def get_embedding_provider() -> str:
    return "local"
