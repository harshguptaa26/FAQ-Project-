import os
import sys
import traceback
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Ensure local backend imports resolve correctly regardless of search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import scrape_faq
from database import init_db, index_faqs, search_faqs_vector, get_all_indexed_faqs
from ranking import calculate_hybrid_scores
from llm_grounding import generate_grounded_answer

app = FastAPI(
    title="Samagama FAQ Semantic Search API",
    description="FastAPI service for semantic search, scraping, and hybrid ranking of samagama.in FAQs.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class AskRequest(BaseModel):
    query: str = Field(..., description="The user's search query or question", min_length=1, max_length=500)

class RelatedQuestion(BaseModel):
    question: str
    answer_preview: str
    score: float
    url: str
    section_title: str

class AskResponse(BaseModel):
    answer: str
    related_questions: List[RelatedQuestion]

class StatusResponse(BaseModel):
    status: str
    faq_count: int
    version: str
    last_updated: str
    embedding_provider: str
    llm_provider: str

# In-memory status tracking
_indexing_status = {
    "is_indexing": False,
    "last_scraped_version": "Unknown",
    "last_scraped_date": "Unknown",
    "faq_count": 0
}

@app.on_event("startup")
def startup_event():
    """Startup routine to initialize collection and do a first-time scrape if empty."""
    init_db()
    try:
        faqs = get_all_indexed_faqs()
        if not faqs:
            print("Database is empty. Performing initial scrape...")
            faq_data = scrape_faq()
            index_faqs(faq_data)
            _indexing_status["faq_count"] = len(faq_data["faqs"])
            _indexing_status["last_scraped_version"] = faq_data["version"]
            _indexing_status["last_scraped_date"] = faq_data["last_updated"]
        else:
            _indexing_status["faq_count"] = len(faqs)
            # Fetch first item to read metadata version
            _indexing_status["last_scraped_version"] = faqs[0].get("version", "Unknown")
            _indexing_status["last_scraped_date"] = faqs[0].get("last_updated", "Unknown")
            print(f"Startup check complete. Found {_indexing_status['faq_count']} FAQs in DB.")
    except Exception as e:
        print(f"Error checking or indexing database during startup: {e}")
        # Don't crash startup if external APIs/DB fail, allow manual re-indexing later.

def run_scraper_task():
    """Background task to scrape and index FAQs."""
    global _indexing_status
    _indexing_status["is_indexing"] = True
    try:
        faq_data = scrape_faq()
        index_faqs(faq_data)
        _indexing_status["faq_count"] = len(faq_data["faqs"])
        _indexing_status["last_scraped_version"] = faq_data["version"]
        _indexing_status["last_scraped_date"] = faq_data["last_updated"]
        print("Background scrape and index completed.")
    except Exception as e:
        print(f"Background scrape failed: {e}")
        traceback.print_exc()
    finally:
        _indexing_status["is_indexing"] = False

@app.post("/scrape", summary="Trigger Scraper and Indexer")
def trigger_scrape(background_tasks: BackgroundTasks):
    """
    Manually triggers the BeautifulSoup scraper to re-fetch samagama.in/internship/faq
    and re-build the Qdrant vector database. Runs asynchronously in the background.
    """
    if _indexing_status["is_indexing"]:
        return {"message": "Indexing is already in progress."}
    
    background_tasks.add_task(run_scraper_task)
    return {"message": "Scrape and re-index triggered in background."}

@app.post("/ask", response_model=AskResponse, summary="Query the FAQ search bot")
def ask_bot(request: AskRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    faqs = get_all_indexed_faqs()
    if not faqs:
        raise HTTPException(status_code=404, detail="No FAQs indexed yet. Please run /scrape first.")

    q_terms = [t.lower() for t in query.split() if len(t) > 2]
    scored = []

    for faq in faqs:
        question = faq.get("question", "")
        answer = faq.get("answer", "")
        text = f"{question} {answer}".lower()

        score = 0
        for term in q_terms:
            if term in question.lower():
                score += 3
            if term in answer.lower():
                score += 1

        if query.lower() in question.lower():
            score += 10

        if score > 0:
            item = dict(faq)
            item["score"] = float(score)
            scored.append(item)

    if not scored:
        scored = faqs[:5]

    scored.sort(key=lambda x: x.get("score", 0), reverse=True)
    top = scored[0]

    related = []
    for item in scored[:5]:
        related.append({
            "question": item.get("question", ""),
            "answer_preview": item.get("answer", "")[:250],
            "score": float(item.get("score", 0)),
            "url": item.get("url", ""),
            "section_title": item.get("section_title", "")
        })

    return {
        "answer": top.get("answer", ""),
        "related_questions": related
    }

@app.get("/status", response_model=StatusResponse, summary="Get service status and statistics")
def get_status():
    """Returns general statistics and configurations of the FAQ system."""
    from embeddings import get_embedding_provider
    from llm_grounding import get_llm_provider
    
    try:
        # Ensure count is accurate
        faqs = get_all_indexed_faqs()
        count = len(faqs)
    except Exception:
        count = _indexing_status["faq_count"]
        
    return StatusResponse(
        status="indexing" if _indexing_status["is_indexing"] else "idle",
        faq_count=count,
        version=_indexing_status["last_scraped_version"],
        last_updated=_indexing_status["last_scraped_date"],
        embedding_provider=get_embedding_provider(),
        llm_provider=get_llm_provider()
    )

@app.get("/faqs", summary="List all indexed FAQs")
def list_faqs():
    """Lists all stored FAQ sections, questions, and answers in the database."""
    try:
        return get_all_indexed_faqs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
