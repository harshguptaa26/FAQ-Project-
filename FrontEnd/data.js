// ============================================================
// MOCK DATA LAYER — FAQ Intelligence Engine
// Simulates backend signals: clicks, votes, search frequency,
// urgency scores. In a real build this is replaced by API calls.
// ============================================================

const CATEGORIES = {
  noc: { label: "NOC", color: "#e85d4c" },
  dates: { label: "Dates", color: "#e8a23d" },
  vibe: { label: "ViBe", color: "#3d7a8c" },
  rosetta: { label: "Rosetta", color: "#4a8577" },
  team: { label: "Team Formation", color: "#8c6db5" },
  certificate: { label: "Certificate", color: "#c9a13b" },
};

// urgency: critical | high | medium | low
const FAQS = [
  {
    id: "noc-1",
    category: "noc",
    question: "What dates do I put on the NOC?",
    answer:
      "Use your chosen start date through start + 2 months (with up to 1 month grace), ending on or before 31 Dec 2026. Pick the earliest start date you can realistically make.",
    urgency: "critical",
    clicks: 412,
    thumbsUp: 58,
    thumbsDown: 31,
    searchesThisWeek: 96,
    searchesLastWeek: 22,
    pinned: false,
  },
  {
    id: "noc-2",
    category: "noc",
    question: "Who can sign the NOC?",
    answer:
      "Any authorised signatory at your college: HOD, Acting HOD, Principal, Dean, Director, or Training & Placement Officer.",
    urgency: "high",
    clicks: 301,
    thumbsUp: 64,
    thumbsDown: 9,
    searchesThisWeek: 41,
    searchesLastWeek: 38,
    pinned: false,
  },
  {
    id: "noc-3",
    category: "noc",
    question: "Does it need to be signed by hand?",
    answer:
      "Yes. The signatory's handwritten signature, the institutional rubber stamp, and a verifiable email address are all required. Digital signatures are not accepted.",
    urgency: "critical",
    clicks: 389,
    thumbsUp: 40,
    thumbsDown: 28,
    searchesThisWeek: 73,
    searchesLastWeek: 19,
    pinned: false,
  },
  {
    id: "noc-4",
    category: "noc",
    question: "Can my HOD email the NOC instead of uploading it?",
    answer:
      "No. NOCs must be uploaded by the student from the dashboard. The email-forward path has been retired.",
    urgency: "high",
    clicks: 210,
    thumbsUp: 22,
    thumbsDown: 19,
    searchesThisWeek: 35,
    searchesLastWeek: 30,
    pinned: false,
  },
  {
    id: "noc-5",
    category: "noc",
    question: "What if my NOC is not formally verified?",
    answer:
      "Verification typically takes an hour to one full working day from upload. The offer letter is issued automatically once validated.",
    urgency: "medium",
    clicks: 140,
    thumbsUp: 30,
    thumbsDown: 6,
    searchesThisWeek: 18,
    searchesLastWeek: 15,
    pinned: false,
  },
  {
    id: "dates-1",
    category: "dates",
    question: "When will NOC dates be announced?",
    answer:
      "There is no fixed announcement date — your NOC dates are whatever you choose, as long as the internship ends on or before 31 December 2026.",
    urgency: "critical",
    clicks: 520,
    thumbsUp: 45,
    thumbsDown: 52,
    searchesThisWeek: 250,
    searchesLastWeek: 20,
    pinned: false,
  },
  {
    id: "dates-2",
    category: "dates",
    question: "Can I change my internship dates after the offer letter?",
    answer: "No. Once the offer letter is issued, confirmed dates are final.",
    urgency: "high",
    clicks: 180,
    thumbsUp: 33,
    thumbsDown: 14,
    searchesThisWeek: 29,
    searchesLastWeek: 25,
    pinned: false,
  },
  {
    id: "dates-3",
    category: "dates",
    question: "How long is the internship?",
    answer:
      "Two months from your chosen start date, with an optional one-month grace period, ending on or before 31 December 2026.",
    urgency: "low",
    clicks: 95,
    thumbsUp: 40,
    thumbsDown: 2,
    searchesThisWeek: 8,
    searchesLastWeek: 9,
    pinned: false,
  },
  {
    id: "vibe-1",
    category: "vibe",
    question: "Invite accepted but shows 'No course enrolled'?",
    answer:
      "Confirm you used the correct registered email, try personal wifi over college wifi, and clear cookies. Detailed DNS fix steps are in the full FAQ.",
    urgency: "high",
    clicks: 266,
    thumbsUp: 21,
    thumbsDown: 35,
    searchesThisWeek: 58,
    searchesLastWeek: 12,
    pinned: false,
  },
  {
    id: "vibe-2",
    category: "vibe",
    question: "Why are videos stuck or repeating?",
    answer:
      "Videos must be watched fully and in sequence. Keep your camera on, stay on the tab, and ensure good lighting — ViBe's monitored learning system needs all of this.",
    urgency: "medium",
    clicks: 175,
    thumbsUp: 19,
    thumbsDown: 17,
    searchesThisWeek: 22,
    searchesLastWeek: 24,
    pinned: false,
  },
  {
    id: "vibe-3",
    category: "vibe",
    question: "Can I use a mobile or tablet for ViBe?",
    answer: "No, only desktop or laptop is supported.",
    urgency: "low",
    clicks: 60,
    thumbsUp: 28,
    thumbsDown: 1,
    searchesThisWeek: 5,
    searchesLastWeek: 6,
    pinned: false,
  },
  {
    id: "rosetta-1",
    category: "rosetta",
    question: "What is Rosetta?",
    answer:
      "Rosetta is your internship journal — a 65-day document, one entry per day, submitted at the end as a completion requirement.",
    urgency: "low",
    clicks: 88,
    thumbsUp: 51,
    thumbsDown: 2,
    searchesThisWeek: 6,
    searchesLastWeek: 7,
    pinned: false,
  },
  {
    id: "rosetta-2",
    category: "rosetta",
    question: "Can I use ChatGPT or any AI tool to write my Rosetta entries?",
    answer:
      "No. Entries that read as AI-generated will not be counted toward your completion requirement.",
    urgency: "medium",
    clicks: 130,
    thumbsUp: 38,
    thumbsDown: 5,
    searchesThisWeek: 14,
    searchesLastWeek: 11,
    pinned: false,
  },
  {
    id: "team-1",
    category: "team",
    question: "What is the size of a team?",
    answer: "Fixed at four members. This is mandatory at the time of final formation.",
    urgency: "low",
    clicks: 70,
    thumbsUp: 25,
    thumbsDown: 3,
    searchesThisWeek: 9,
    searchesLastWeek: 10,
    pinned: false,
  },
  {
    id: "team-2",
    category: "team",
    question: "We selected Project X but were assigned Project Y. Can we change it?",
    answer: "No. Project assignments are final to ensure balanced distribution across projects.",
    urgency: "medium",
    clicks: 112,
    thumbsUp: 14,
    thumbsDown: 22,
    searchesThisWeek: 17,
    searchesLastWeek: 13,
    pinned: false,
  },
  {
    id: "cert-1",
    category: "certificate",
    question: "Will the completion certificate be a hardcopy or e-certificate?",
    answer:
      "E-certificate only, downloaded from the dashboard. It is digitally signed and verifiable from the database.",
    urgency: "low",
    clicks: 54,
    thumbsUp: 30,
    thumbsDown: 1,
    searchesThisWeek: 4,
    searchesLastWeek: 5,
    pinned: false,
  },
];

// Questions students searched for that have NO matching FAQ yet —
// powers the "Self-Healing Suggestions" admin feature.
const UNANSWERED_SEARCHES = [
  { query: "deadline extension", count: 41, category: "dates" },
  { query: "NOC rejected what next", count: 27, category: "noc" },
  { query: "lost zoom id reset", count: 15, category: "vibe" },
  { query: "rosetta late submit penalty", count: 9, category: "rosetta" },
];

const URGENCY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };
const URGENCY_ORDER = ["critical", "high", "medium", "low"];

function urgencyScore(faq) {
  // Composite score driving the heatmap + sort + auto-escalation.
  const base = URGENCY_WEIGHT[faq.urgency] * 25;
  const downvotePenalty = faq.thumbsDown * 1.4;
  const searchSpike = Math.max(0, faq.searchesThisWeek - faq.searchesLastWeek) * 0.6;
  return Math.round(base + downvotePenalty + searchSpike);
}

function confusionScoreForCategory(catKey) {
  const items = FAQS.filter((f) => f.category === catKey);
  if (!items.length) return 0;
  const total = items.reduce((sum, f) => sum + urgencyScore(f), 0);
  return Math.round(total / items.length);
}
