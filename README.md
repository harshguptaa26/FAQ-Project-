# Samagama FAQ Intelligence Engine

## Team

| Role | Owns |
|---|---|
| Project lead | repo setup, `data/`, this README, backend skeleton, `frontend/src/api/faq.js` |
| Frontend | React components, pages, UI logic — imports only from `src/api/faq.js` |
| Backend | FastAPI routes, search logic, scoring, similarity engine |

**Rule:** No one pushes directly to `main`. Work on your own branch, open a PR, lead reviews and merges.

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI + Uvicorn |
| Data | `data/faqs.json` (flat file, no DB yet) |
| HTTP client | Axios (frontend only) |

---

## Folder structure

```
samagama-faq/
  data/
    faqs.json          ← source of truth, do not rename fields
    events.json        ← starts as [], tracks clicks/votes
  frontend/
    src/
      api/
        faq.js         ← ALL axios calls live here, nowhere else
      components/      ← FAQCard, SearchBar, SimilarPanel, etc.
      hooks/           ← useFAQ, useSearch, etc.
    index.html
    vite.config.js
  backend/
    main.py            ← FastAPI app entry point
    routes/
      faqs.py
      search.py
      vote.py
      trending.py
      similar.py
    services/
      search.py        ← fuzzy match + intent detection logic
      scoring.py       ← priority score algorithm
      similarity.py    ← TF-IDF / tag-based similarity
  README.md
```

---

## Data shape — `faqs.json`

Every FAQ object has exactly these fields. Do not add or rename anything without updating this README and telling the team.

```json
{
  "id": "3.4",
  "question": "what format should i use? do i need to design it myself?",
  "answer": "no — we provide a printable noc format...",
  "category": "noc",
  "tags": ["noc", "format", "download", "upload", "dashboard"],
  "priority_score": 0
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Section number from original FAQ, e.g. `"3.4"` |
| `question` | string | Clean question text, no number prefix |
| `answer` | string | Full answer text |
| `category` | string | One of the 14 category slugs below |
| `tags` | string[] | Keywords for similarity matching |
| `priority_score` | number | Starts at 0, incremented by backend on clicks/votes |

### Category slugs

```
about-vins
dates-and-timeline
noc
selection-and-offer
project-and-work
communication
interview
certificate
rosetta
orientation-and-vibe
spurti-points
samagama-platform
vibe-platform
teams
```

---

## API contract

Base URL (local dev): `http://localhost:8000/api`

Frontend **must** call only through `src/api/faq.js`. Backend **must** return exactly the shapes below.

---

### GET `/api/faqs`

Returns all FAQs, sorted by `priority_score` descending.

**Response**
```json
[
  {
    "id": "3.4",
    "question": "what format should i use?",
    "answer": "...",
    "category": "noc",
    "tags": ["noc", "format", "download", "upload", "dashboard"],
    "priority_score": 42
  }
]
```

---

### GET `/api/faqs/{id}`

Returns a single FAQ and increments its `priority_score` by 1 (click tracking).

**Params**
- `id` — FAQ id, e.g. `3.4`

**Response** — same shape as a single FAQ object above.

**Error**
```json
{ "detail": "FAQ not found" }   // 404
```

---

### GET `/api/search?q=`

Returns FAQs matching the query. Fuzzy match on `question`, `answer`, and `tags`. Supports intent detection (`when`, `who`, `how`, `what`, `where`).

**Params**
- `q` — search string (required, min 2 chars)
- `category` — optional filter, e.g. `?q=noc&category=noc`
- `limit` — max results, default 10

**Response**
```json
{
  "results": [ /* FAQ objects */ ],
  "intent": "when",
  "did_you_mean": "noc deadline"
}
```

- `intent` — detected question intent or `null`
- `did_you_mean` — typo correction suggestion or `null`

---

### POST `/api/vote`

Records a thumbs up or thumbs down. Thumbs down increments `priority_score` by 2 (escalates urgency). Thumbs up decrements by 1.

**Body**
```json
{
  "faq_id": "3.4",
  "type": "down"
}
```

- `type` must be `"up"` or `"down"`

**Response**
```json
{
  "faq_id": "3.4",
  "new_priority_score": 44,
  "message": "vote recorded"
}
```

---

### GET `/api/trending`

Returns the top 5 most-clicked FAQs in the last 7 days, based on `events.json`.

**Response**
```json
{
  "window_days": 7,
  "trending": [ /* up to 5 FAQ objects, in click-count order */ ]
}
```

---

### GET `/api/similar/{id}`

Returns 3–4 semantically similar FAQs based on shared tags and category. Excludes the FAQ itself.

**Params**
- `id` — FAQ id to find similar for

**Response**
```json
{
  "faq_id": "3.4",
  "similar": [ /* 3-4 FAQ objects */ ]
}
```

---

## Events log — `events.json`

Every click and vote is appended here. Backend reads this for trending and scoring. Starts as `[]`.

```json
[
  {
    "type": "click",
    "faq_id": "3.4",
    "timestamp": "2026-05-20T10:32:00Z"
  },
  {
    "type": "vote",
    "faq_id": "3.4",
    "vote": "down",
    "timestamp": "2026-05-20T10:35:00Z"
  }
]
```

---

## Local dev setup

### Backend
```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm create vite@latest . -- --template react
npm install tailwindcss @tailwindcss/vite axios
npm run dev
# Runs at http://localhost:5173
```

### CORS
Backend must allow `http://localhost:5173`. Already included in the skeleton `main.py`.

---

## Claude prompt template (for all teammates)

When asking Claude to build any feature, paste this at the top of your prompt:

```
Project: Samagama FAQ Intelligence Engine
Stack: React + Vite + Tailwind (frontend), FastAPI + Python (backend)
Data shape:
{
  "id": "3.4",
  "question": "...",
  "answer": "...",
  "category": "noc",
  "tags": ["noc", "format", "download"],
  "priority_score": 42
}

API base URL: http://localhost:8000/api
Frontend axios calls go only in src/api/faq.js

My task: [DESCRIBE YOUR SPECIFIC FEATURE HERE]
```

---

## Feature build order

| # | Feature | Frontend task | Backend task |
|---|---|---|---|
| 1 | FAQ list with priority badges | `FAQCard` component, priority color system | `GET /api/faqs` sorted by score |
| 2 | Live search | `SearchBar` with debounce, results dropdown | `GET /api/search` with fuzzy match |
| 3 | Priority scores + voting | Thumbs up/down on each card, color heatmap | `POST /api/vote`, scoring algorithm |
| 4 | Similar questions panel | `SimilarPanel` shown on FAQ open | `GET /api/similar/{id}` with tag matching |
| 5 | Trending this week | `TrendingStrip` at top of page | `GET /api/trending` 7-day window |

Build in this order. Do not start feature 2 until feature 1 is merged.
