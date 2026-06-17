"""
Samagama FAQ backend — FastAPI app.

Implements (so far):
  GET /api/faqs           -> all FAQs, sorted by priority_score desc
  GET /api/faqs/{id}      -> single FAQ, increments priority_score by 1 (click tracking)

Run locally:
  pip install fastapi uvicorn
  uvicorn main:app --reload --port 8000
  docs at http://localhost:8000/docs
"""

import json
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Samagama FAQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths relative to this file, so it works no matter where uvicorn is launched from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAQS_PATH = os.path.join(BASE_DIR, "..", "data", "faqs.json")
EVENTS_PATH = os.path.join(BASE_DIR, "..", "data", "events.json")


def load_faqs():
    with open(FAQS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_faqs(faqs):
    with open(FAQS_PATH, "w", encoding="utf-8") as f:
        json.dump(faqs, f, indent=2, ensure_ascii=False)


def log_event(event: dict):
    """Append a click/vote event to events.json. Creates the file if missing."""
    if os.path.exists(EVENTS_PATH):
        with open(EVENTS_PATH, "r", encoding="utf-8") as f:
            events = json.load(f)
    else:
        events = []

    events.append(event)

    with open(EVENTS_PATH, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)


@app.get("/api/faqs")
def get_faqs():
    """Return all FAQs, sorted by priority_score descending."""
    faqs = load_faqs()
    return sorted(faqs, key=lambda x: x["priority_score"], reverse=True)


@app.get("/api/faqs/{faq_id}")
def get_faq(faq_id: str):
    """Return a single FAQ and bump its priority_score by 1 (click tracking)."""
    faqs = load_faqs()

    target = next((f for f in faqs if f["id"] == faq_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail="FAQ not found")

    target["priority_score"] += 1
    save_faqs(faqs)

    log_event({
        "type": "click",
        "faq_id": faq_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return target


@app.get("/")
def root():
    return {"status": "ok", "service": "samagama-faq-api"}