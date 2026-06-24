# 🚀 SAMAGAMA – AI-Powered Self-Learning FAQ & Student Intelligence Portal

> **An intelligent FAQ system that continuously learns from student interactions, identifies confusion hotspots, prioritizes critical information, and helps administrators improve communication automatically.**

https://faq-eta-six.vercel.app/

---

## 📖 Overview

**SAMAGAMA** transforms a traditional FAQ portal into a **living knowledge system**.

Instead of being a static list of questions, every student interaction—searches, clicks, votes, reading behavior, and navigation—becomes valuable data that helps the portal improve itself.

The platform combines **AI, semantic search, analytics, and community intelligence** to reduce duplicate questions, surface important information automatically, and provide administrators with actionable insights.

---

# 🌟 What Makes SAMAGAMA Different?

Traditional FAQ systems only answer questions.

**SAMAGAMA understands them.**

It continuously learns:

* Which questions confuse students
* Which answers are outdated
* Which topics create panic
* Which FAQs need improvement
* What students are likely to ask next

The result is an FAQ portal that **gets smarter every day.**

---

# ✨ Core Features

## 🔴 1. Priority Heatmap (Smart FAQ Ranking)

Every FAQ receives a **dynamic urgency score** based on real student interactions.

Signals include:

* Duplicate searches
* Click frequency
* Thumbs-down feedback
* Unresolved queries
* Search popularity

Priority Levels

| Level       | Color  | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| 🔴 Critical | Red    | Frequently asked, unresolved, or policy-critical |
| 🟠 High     | Orange | Common questions with increasing activity        |
| 🟡 Medium   | Yellow | Occasionally asked                               |
| 🟢 Low      | Green  | Rarely accessed                                  |

### UI Enhancements

* Left colored priority border
* Subtle background tint
* Priority badge
* Automatic sorting by urgency
* Admin sort toggle

The highest-priority FAQs automatically float to the top, ensuring students see the most important information first.

---

## 🔍 2. Smart Similar Questions

Whenever a student opens an FAQ, SAMAGAMA automatically recommends related questions.

Example:

**Opening**

> "When will NOC dates be announced?"

Suggested Questions

* NOC Document Requirements
* Deadline Extension Policy
* Internship Timeline
* Application Status Tracking

Recommendations are generated using:

* TF-IDF similarity
* Semantic embeddings
* Category matching
* User navigation history

Categories include:

* NOC
* ViBe
* Certificates
* Internship
* Rosetta
* Placements

This significantly reduces repeated searches and support tickets.

---

## ⚡ 3. Live Search with Intent Detection

The search bar provides real-time intelligent suggestions while the student types.

Features include:

* Instant search results
* Semantic search
* Fuzzy typo correction
* "Did you mean?" suggestions
* Intent detection

Recognized intents include:

* When
* How
* Who
* Where
* Why
* Deadline
* Eligibility
* Documents

Typing:

```
noc doc
```

Instantly surfaces:

* NOC Documents
* Required Certificates
* Application Checklist

before the student even finishes typing.

---

## 👍 4. Feedback & Unresolved Tracker

Each FAQ includes lightweight feedback.

```
👍 Helpful

👎 Didn't Help
```

Negative feedback automatically:

* increases urgency score
* flags weak answers
* updates admin analytics
* contributes to confusion detection

Administrators can instantly identify which FAQs require improvement.

---

# 💡 Additional Intelligence Features

## 🫧 Doubt Cluster Map

One of the platform's signature features.

A live interactive bubble chart visualizes the entire FAQ ecosystem.

Bubble Size

→ Number of questions asked

Bubble Color

* 🔴 Critical
* 🟠 High
* 🟡 Medium
* 🟢 Healthy

Bubble Position

→ FAQ category

Example

```
🔴 NOC

🟠 Internship

🟠 Certificates

🟢 Rosetta

🟢 ViBe
```

Within seconds, administrators understand where students are struggling most.

---

## 📈 Trending This Week

A rolling 7-day analytics engine automatically identifies the most searched FAQs.

Example

🔥 Trending This Week

1. NOC Dates
2. Internship Allocation
3. ViBe Registration
4. Certificate Submission
5. Hostel Allotment

This dynamic list updates automatically and helps students discover commonly discussed topics.

---

## 📚 Section Completion Tracker

Students see their reading progress across FAQ categories.

Example

```
You've completed

████████░░░░

8 / 14 FAQ Sections
```

Progress is stored locally using **localStorage** and encourages students to explore all critical information.

---

## 📢 Admin Urgency Override

Administrators can manually promote important announcements.

Example

```
🚨 Updated Policy

NOC submission deadline revised.

Please read before applying.
```

Features

* Manual Critical badge
* Banner announcement
* Priority override
* Admin notes
* Expiration support

Ideal for sudden policy changes or urgent announcements.

---

# 🧠 FAQ Intelligence Engine

The heart of SAMAGAMA.

Instead of static content, the portal continuously learns from user behavior.

Every interaction becomes a learning signal.

Collected Signals

* Search queries
* FAQ views
* Clicks
* Reading time
* Thumbs up
* Thumbs down
* Related FAQ navigation
* Duplicate questions
* Search failures

These signals power every intelligent feature within the system.

---

# 👨‍🎓 Student Experience

## Smart Priority FAQs

Important questions automatically rise to the top.

Students immediately know what deserves attention.

---

## Related Question Graph

Reading one FAQ reveals the next logical questions.

Students naturally discover complete information without repeated searching.

---

## Trending Questions

Students gain confidence knowing their concerns are shared by others.

---

## Progress Tracker

Students know exactly which sections they've completed and which remain unread.

---

# 👨‍💼 Admin Experience

## 🔥 Confusion Heatmap Dashboard

Instead of manually reviewing hundreds of questions, administrators receive an instant overview.

| Section      | Confusion Score |
| ------------ | --------------: |
| NOC          |              92 |
| Internship   |              77 |
| Certificates |              48 |
| ViBe         |              31 |
| Rosetta      |              12 |

Higher scores indicate greater confusion and higher priority.

---

## 🫧 Doubt Cluster Visualization

Interactive bubble chart displaying:

* Bubble size → question volume
* Bubble color → urgency
* Bubble position → FAQ category

This visualization immediately highlights communication gaps and is one of the project's most impactful demonstrations.

---

## 🤖 Self-Healing FAQ Suggestions

The system proactively recommends improvements.

Examples

> Question 3.4 received 28 thumbs-downs this week.

Suggested Action

→ Rewrite the answer.

---

> 41 students searched for "deadline extension", but no FAQ exists.

Suggested Action

→ Create a new FAQ.

The portal continuously evolves without requiring constant manual analysis.

---

## 🚨 Panic Mode Detection

Detects sudden spikes in student activity.

Example

Yesterday

```
NOC Searches

20
```

Today

```
250
```

The system automatically:

* creates a Panic Alert
* increases NOC priority
* moves related FAQs to the top
* notifies administrators

This enables rapid response during critical periods.

---

## 🔮 Ask Before Asking Predictor

Using navigation patterns, SAMAGAMA predicts what a student is likely to ask next.

Example

Opening:

> How do I apply for NOC?

Automatically recommends:

* Required Documents
* Last Date
* Approval Timeline
* Application Status

Inspired by recommendation systems used by major e-commerce platforms, this dramatically reduces repetitive support requests.

---

# 🏗 Technical Architecture

### Frontend

* React
* TypeScript
* Tailwind CSS
* Framer Motion
* React Router
* Recharts
* LocalStorage

### Backend

* Node.js
* Express
* TypeScript
* MongoDB Atlas
* JWT Authentication

### Intelligence Layer

* MongoDB Atlas Vector Search
* TF-IDF Similarity
* Semantic Embeddings
* Click Analytics
* Trending Engine
* Priority Scoring Algorithm
* Recommendation Engine

---

# 👥 Team Structure (10 Members)

## 🎨 UI / Frontend (4)

* Priority color system & badges
* Live search & instant results
* Smart similar questions panel
* Bubble chart & cluster visualization

---

## ⚙ Backend / Data (4)

* Click & vote tracking APIs
* Dynamic priority scoring algorithm
* TF-IDF similarity engine
* Trending window analytics

---

## 📊 Admin Dashboard (2)

* Urgency override interface
* Unresolved cluster dashboard
* Analytics graphs
* Confusion heatmap
* Self-healing recommendations

---

# 🚀 Impact

SAMAGAMA is more than an FAQ portal.

It is a **self-learning knowledge platform** that continuously improves based on real student behavior.

By combining **AI-powered recommendations, intelligent search, behavioral analytics, semantic similarity, real-time trend detection, and administrator insights**, SAMAGAMA reduces repetitive support requests, surfaces the most important information automatically, and ensures students always have access to the knowledge they need.

Instead of maintaining a static FAQ, institutions gain an **adaptive FAQ Intelligence Engine** that evolves alongside their community.
