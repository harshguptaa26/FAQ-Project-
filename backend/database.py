import os
from typing import List, Dict, Any, Tuple
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from embeddings import get_embedding, get_embedding_dim, get_embeddings_batch

COLLECTION_NAME = "samagama_faqs"

# Use local storage by default
DB_PATH = os.getenv("QDRANT_PATH", "./qdrant_db")
# If using remote host (e.g., in docker-compose)
DB_HOST = os.getenv("QDRANT_HOST", None)
DB_PORT = int(os.getenv("QDRANT_PORT", "6333"))

_CLIENT = None

def get_db_client() -> QdrantClient:
    """Returns a single shared Qdrant client connection."""
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT

    if DB_HOST:
        _CLIENT = QdrantClient(host=DB_HOST, port=DB_PORT)
    else:
        _CLIENT = QdrantClient(":memory:")

    return _CLIENT

def init_db(force_recreate: bool = False):
    """Initializes the Qdrant FAQ collection with named vectors."""
    client = get_db_client()
    dim = get_embedding_dim()
    
    # Check if collection exists
    exists = False
    try:
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
    except Exception:
        pass

    if exists and force_recreate:
        client.delete_collection(collection_name=COLLECTION_NAME)
        exists = False
        
    if not exists:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "question": VectorParams(size=dim, distance=Distance.COSINE),
                "answer": VectorParams(size=dim, distance=Distance.COSINE),
                "combined": VectorParams(size=dim, distance=Distance.COSINE),
            }
        )
        print(f"Collection '{COLLECTION_NAME}' initialized with vector dimension {dim}.")
    else:
        print(f"Collection '{COLLECTION_NAME}' already exists.")

def index_faqs(faq_data: dict):
    """
    Clears current index and stores scraped FAQ items with generated embeddings.
    """
    client = get_db_client()
    init_db(force_recreate=True)
    
    faqs = faq_data.get("faqs", [])
    if not faqs:
        print("No FAQs to index.")
        return

    print(f"Generating embeddings and indexing {len(faqs)} FAQs...")
    
    # Extract texts to embed in batch for optimization
    questions = [faq["question"] for faq in faqs]
    answers = [faq["answer"] for faq in faqs]
    combined_texts = [f"Question: {faq['question']}\nAnswer: {faq['answer']}" for faq in faqs]
    
    print("Generating question embeddings...")
    q_embeddings = get_embeddings_batch(questions)
    
    print("Generating answer embeddings...")
    a_embeddings = get_embeddings_batch(answers)
    
    print("Generating combined embeddings...")
    c_embeddings = get_embeddings_batch(combined_texts)
    
    points = []
    for idx, faq in enumerate(faqs):
        # Store metadata along with the 3 vectors
        payload = {
            "section_id": faq.get("section_id", ""),
            "section_title": faq.get("section_title", ""),
            "faq_id": faq.get("id", ""),
            "question": faq.get("question", ""),
            "answer": faq.get("answer", ""),
            "answer_html": faq.get("answer_html", ""),
            "url": faq.get("url", ""),
            "version": faq_data.get("version", "Unknown"),
            "last_updated": faq_data.get("last_updated", "Unknown")
        }
        
        points.append(
            PointStruct(
                id=idx,
                vector={
                    "question": q_embeddings[idx],
                    "answer": a_embeddings[idx],
                    "combined": c_embeddings[idx]
                },
                payload=payload
            )
        )
        
    # Batch upsert points
    client.upsert(
        collection_name=COLLECTION_NAME,
        wait=True,
        points=points
    )
    print("Indexing completed successfully.")

def get_all_indexed_faqs() -> List[Dict[str, Any]]:
    """Retrieves all stored FAQ entries from the database (including payload metadata)."""
    client = get_db_client()
    
    # Retrieve all points (limit to 1000 since there are ~150-200 FAQs maximum)
    results = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=1000,
        with_payload=True,
        with_vectors=False
    )
    
    points = results[0]
    return [p.payload for p in points]

def search_faqs_vector(query: str, limit: int = 15):
    """Simple reliable keyword search over indexed FAQs."""
    faqs = get_all_indexed_faqs()
    q_terms = set(query.lower().split())
    results = []

    for faq in faqs:
        text = f"{faq.get('question','')} {faq.get('answer','')}".lower()
        score = sum(1 for term in q_terms if term in text)
        if score > 0:
            item = dict(faq)
            item["score"] = float(score)
            results.append(item)

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]

