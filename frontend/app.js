// ============================================================
// APP LOGIC — wires mock data to the UI
// ============================================================

let readSections = new Set();
let currentSort = "urgency";
let activeFilter = "all";
let currentModalId = null;

const URGENCY_COLOR = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};
const URGENCY_COLOR_HEX = {
  critical: "#e85d4c",
  high: "#e8a23d",
  medium: "#3d7a8c",
  low: "#4a8577",
};

// ---------------------------------------------------------------
// VIEW TOGGLE
// ---------------------------------------------------------------
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");

    const isStudent = btn.dataset.view === "student";
    document.getElementById("studentView").hidden = !isStudent;
    document.getElementById("adminView").hidden = isStudent;

    if (!isStudent) renderAdmin();
  });
});

// ---------------------------------------------------------------
// FEATURE 1 + signature: PRIORITY HEATMAP (student cards)
// ---------------------------------------------------------------
function sortedFaqs() {
  let list = [...FAQS];
  if (activeFilter !== "all") list = list.filter((f) => f.category === activeFilter);

  if (currentSort === "urgency") {
    list.sort((a, b) => urgencyScore(b) - urgencyScore(a));
  } else if (currentSort === "trending") {
    list.sort((a, b) => b.searchesThisWeek - a.searchesThisWeek);
  } else if (currentSort === "category") {
    list.sort((a, b) => a.category.localeCompare(b.category));
  }
  return list;
}

function renderFaqList() {
  const container = document.getElementById("faqList");
  const list = sortedFaqs();
  container.innerHTML = list
    .map((f, i) => {
      const cat = CATEGORIES[f.category];
      const delay = Math.min(i * 0.04, 0.4);
      return `
      <article class="faq-card urgency-${f.urgency} fade-item" style="animation-delay:${delay}s" data-id="${f.id}" tabindex="0" role="button" aria-label="${f.question}">
        <div class="faq-card-main">
          <div class="faq-card-top">
            <span class="faq-badge urgency-${f.urgency}">${f.urgency}</span>
            <span class="faq-category-tag">${cat.label}</span>
            ${f.pinned ? `<span class="faq-pin-note">📌 ${f.pinNote || "Pinned by admin"}</span>` : ""}
          </div>
          <p class="faq-question">${f.question}</p>
        </div>
        <div class="faq-card-stats">
          <span><strong>${f.clicks}</strong> views</span>
          <span><strong>${f.searchesThisWeek}</strong> searches/wk</span>
        </div>
      </article>`;
    })
    .join("");

  container.querySelectorAll(".faq-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card.dataset.id);
      }
    });
  });
}

function renderCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  const cats = Object.keys(CATEGORIES);
  container.innerHTML =
    `<button class="filter-chip is-active" data-cat="all">All</button>` +
    cats.map((c) => `<button class="filter-chip" data-cat="${c}">${CATEGORIES[c].label}</button>`).join("");

  container.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeFilter = chip.dataset.cat;
      renderFaqList();
    });
  });
}

document.getElementById("sortSelect").addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderFaqList();
});

// ---------------------------------------------------------------
// FEATURE 3: LIVE SEARCH WITH INTENT DETECTION + DID YOU MEAN
// ---------------------------------------------------------------
const INTENT_PATTERNS = [
  { re: /\bwhen\b/i, label: "Intent: timing" },
  { re: /\bwho\b/i, label: "Intent: person/authority" },
  { re: /\bhow\b/i, label: "Intent: procedure" },
  { re: /\bwhat\b/i, label: "Intent: definition" },
  { re: /\bcan i\b|\bcan we\b/i, label: "Intent: permission" },
  { re: /\bwhy\b/i, label: "Intent: reasoning" },
];

// crude fuzzy match: token overlap + simple typo tolerance via substring
function fuzzyScore(query, text) {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 100;
  const qTokens = q.split(/\s+/).filter(Boolean);
  let hits = 0;
  qTokens.forEach((tok) => {
    if (t.includes(tok)) hits++;
    else {
      // light typo tolerance: check if a close substring exists
      for (let i = 0; i < t.length - tok.length + 1; i++) {
        const seg = t.substr(i, tok.length);
        if (levenshtein(seg, tok) <= 1 && tok.length > 3) {
          hits += 0.6;
          break;
        }
      }
    }
  });
  return (hits / qTokens.length) * 80;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function closestQuestion(query) {
  let best = null, bestScore = -1;
  FAQS.forEach((f) => {
    const s = fuzzyScore(query, f.question);
    if (s > bestScore) { bestScore = s; best = f; }
  });
  return bestScore > 15 ? best : null;
}

const searchInput = document.getElementById("searchInput");
const intentChip = document.getElementById("intentChip");
const didYouMean = document.getElementById("didYouMean");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim();

  if (!q) {
    intentChip.hidden = true;
    didYouMean.hidden = true;
    searchResults.hidden = true;
    return;
  }

  // intent detection
  const matchedIntent = INTENT_PATTERNS.find((p) => p.re.test(q));
  if (matchedIntent) {
    intentChip.textContent = matchedIntent.label;
    intentChip.hidden = false;
  } else {
    intentChip.hidden = true;
  }

  // scored matches
  const scored = FAQS.map((f) => ({ f, score: fuzzyScore(q, f.question) }))
    .filter((x) => x.score > 12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (scored.length === 0) {
    const close = closestQuestion(q);
    if (close) {
      didYouMean.hidden = false;
      didYouMean.innerHTML = `Did you mean: <button data-id="${close.id}">${close.question}</button>?`;
      didYouMean.querySelector("button").addEventListener("click", () => {
        searchInput.value = close.question;
        openModal(close.id);
        searchResults.hidden = true;
        didYouMean.hidden = true;
      });
    } else {
      didYouMean.hidden = true;
    }
    searchResults.hidden = false;
    searchResults.innerHTML = `<div class="search-result-empty">No matching FAQs yet. This search is being logged to flag a content gap.</div>`;
    return;
  }

  didYouMean.hidden = true;
  searchResults.hidden = false;
  searchResults.innerHTML = scored
    .map(({ f }) => `
      <button class="search-result-item" data-id="${f.id}">
        <span class="urgency-dot" style="background:${URGENCY_COLOR_HEX[f.urgency]}"></span>
        ${f.question}
      </button>`)
    .join("");

  searchResults.querySelectorAll(".search-result-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal(btn.dataset.id);
      searchResults.hidden = true;
    });
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-section")) {
    searchResults.hidden = true;
  }
});

// ---------------------------------------------------------------
// "Trending this week" — rolling window, top 5 by searches
// ---------------------------------------------------------------
function renderTrending() {
  const top = [...FAQS].sort((a, b) => b.searchesThisWeek - a.searchesThisWeek).slice(0, 5);
  const row = document.getElementById("trendingRow");
  row.innerHTML = top
    .map((f, i) => {
      const up = f.searchesThisWeek - f.searchesLastWeek;
      return `
      <div class="trending-card fade-item" style="animation-delay:${i * 0.06}s" data-id="${f.id}">
        <span class="trending-rank">${String(i + 1).padStart(2, "0")}</span>
        <p class="trending-q">${f.question}</p>
        <span class="trending-meta">${f.searchesThisWeek}/wk ${up > 0 ? `<span class="up">▲ +${up}</span>` : ""}</span>
      </div>`;
    })
    .join("");

  row.querySelectorAll(".trending-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

// ---------------------------------------------------------------
// Section progress tracker
// ---------------------------------------------------------------
function renderProgress() {
  const total = FAQS.length;
  document.getElementById("progressTotal").textContent = total;
  document.getElementById("progressDone").textContent = readSections.size;
  const pct = total ? (readSections.size / total) * 100 : 0;
  document.getElementById("progressFill").style.width = pct + "%";
}

// ---------------------------------------------------------------
// FEATURE 2: SMART SIMILAR QUESTIONS ("You may also need")
// ---------------------------------------------------------------
function relatedQuestions(faq) {
  return FAQS.filter((f) => f.id !== faq.id && f.category === faq.category)
    .sort((a, b) => urgencyScore(b) - urgencyScore(a))
    .slice(0, 4);
}

// ---------------------------------------------------------------
// FEATURE 4: FEEDBACK + UNRESOLVED TRACKER (modal voting)
// ---------------------------------------------------------------
function openModal(id) {
  const faq = FAQS.find((f) => f.id === id);
  if (!faq) return;
  currentModalId = id;
  readSections.add(id);
  renderProgress();

  document.getElementById("modalCategory").textContent = CATEGORIES[faq.category].label;
  document.getElementById("modalQuestion").textContent = faq.question;
  document.getElementById("modalAnswer").textContent = faq.answer;
  document.getElementById("voteUpCount").textContent = faq.thumbsUp;
  document.getElementById("voteDownCount").textContent = faq.thumbsDown;
  document.getElementById("voteFeedback").textContent = "";
  document.getElementById("voteUp").classList.remove("is-selected");
  document.getElementById("voteDown").classList.remove("is-selected");

  const related = relatedQuestions(faq);
  document.getElementById("relatedList").innerHTML = related
    .map(
      (r) => `
      <button class="related-item" data-id="${r.id}">
        <span class="urgency-dot" style="background:${URGENCY_COLOR_HEX[r.urgency]}"></span>
        ${r.question}
      </button>`
    )
    .join("") || `<span style="font-size:13px;color:var(--text-faint)">No related questions in this category yet.</span>`;

  document.getElementById("relatedList").querySelectorAll(".related-item").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });

  document.getElementById("modalBackdrop").hidden = false;
  faq.clicks++;
  renderFaqList();
}

function closeModal() {
  document.getElementById("modalBackdrop").hidden = true;
  currentModalId = null;
}
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

document.getElementById("voteUp").addEventListener("click", () => {
  const faq = FAQS.find((f) => f.id === currentModalId);
  if (!faq) return;
  faq.thumbsUp++;
  document.getElementById("voteUpCount").textContent = faq.thumbsUp;
  document.getElementById("voteUp").classList.add("is-selected");
  document.getElementById("voteDown").classList.remove("is-selected");
  document.getElementById("voteFeedback").textContent = "Thanks — glad this helped.";
  renderFaqList();
});

document.getElementById("voteDown").addEventListener("click", () => {
  const faq = FAQS.find((f) => f.id === currentModalId);
  if (!faq) return;
  faq.thumbsDown++;
  document.getElementById("voteDownCount").textContent = faq.thumbsDown;
  document.getElementById("voteDown").classList.add("is-selected");
  document.getElementById("voteUp").classList.remove("is-selected");

  // auto-escalate urgency score
  const oldUrgency = faq.urgency;
  if (faq.thumbsDown >= 25 && faq.urgency !== "critical") faq.urgency = "critical";
  else if (faq.thumbsDown >= 12 && URGENCY_WEIGHT[faq.urgency] < URGENCY_WEIGHT.high) faq.urgency = "high";

  document.getElementById("voteFeedback").textContent =
    faq.urgency !== oldUrgency
      ? `Logged. Urgency auto-escalated to "${faq.urgency}".`
      : "Logged — this helps admins prioritize.";
  renderFaqList();
});

// ---------------------------------------------------------------
// ADMIN: CONFUSION HEATMAP
// ---------------------------------------------------------------
function renderHeatmap() {
  const table = document.getElementById("heatmapTable");
  const cats = Object.keys(CATEGORIES)
    .map((c) => ({ key: c, label: CATEGORIES[c].label, score: confusionScoreForCategory(c) }))
    .sort((a, b) => b.score - a.score);
  const max = Math.max(...cats.map((c) => c.score), 1);

  table.innerHTML = cats
    .map((c) => {
      const pct = (c.score / max) * 100;
      const color =
        c.score > 70 ? "var(--critical)" : c.score > 45 ? "var(--high)" : c.score > 25 ? "var(--medium)" : "var(--low)";
      return `
      <div class="heatmap-row">
        <span class="heatmap-label">${c.label}</span>
        <div class="heatmap-bar-track"><div class="heatmap-bar-fill" data-pct="${pct}" style="width:0%;background:${color}"></div></div>
        <span class="heatmap-score" style="color:${color}">${c.score}</span>
      </div>`;
    })
    .join("");

  // grow bars in on next frame so the width transition actually animates
  requestAnimationFrame(() => {
    table.querySelectorAll(".heatmap-bar-fill").forEach((bar) => {
      bar.style.width = bar.dataset.pct + "%";
    });
  });
}

// ---------------------------------------------------------------
// SIGNATURE: DOUBT CLUSTER BUBBLE CHART (admin)
// ---------------------------------------------------------------
function renderBubbleChart() {
  const svg = document.getElementById("bubbleSvg");
  const tooltip = document.getElementById("bubbleTooltip");
  const cats = Object.keys(CATEGORIES);

  // position categories across the width, sized by total clicks, colored by avg urgency
  const W = 800, H = 440;
  const positions = {
    noc: { x: 150, y: 150 },
    dates: { x: 380, y: 100 },
    vibe: { x: 600, y: 220 },
    rosetta: { x: 250, y: 320 },
    team: { x: 500, y: 340 },
    certificate: { x: 680, y: 360 },
  };

  const bubbleData = cats.map((c) => {
    const items = FAQS.filter((f) => f.category === c);
    const totalDoubts = items.reduce((s, f) => s + f.clicks, 0);
    const score = confusionScoreForCategory(c);
    const color =
      score > 70 ? URGENCY_COLOR_HEX.critical : score > 45 ? URGENCY_COLOR_HEX.high : score > 25 ? URGENCY_COLOR_HEX.medium : URGENCY_COLOR_HEX.low;
    return { key: c, label: CATEGORIES[c].label, totalDoubts, score, color, pos: positions[c] };
  });

  const maxDoubts = Math.max(...bubbleData.map((b) => b.totalDoubts), 1);
  const minR = 34, maxR = 92;

  let svgContent = "";
  bubbleData.forEach((b) => {
    const r = minR + (b.totalDoubts / maxDoubts) * (maxR - minR);
    svgContent += `
      <g class="bubble-node" data-key="${b.key}" data-label="${b.label}" data-doubts="${b.totalDoubts}" data-score="${b.score}" style="cursor:pointer">
        <circle cx="${b.pos.x}" cy="${b.pos.y}" r="${r}" fill="${b.color}" opacity="0.82">
          <animate attributeName="r" from="0" to="${r}" dur="0.6s" fill="freeze" />
        </circle>
        <circle cx="${b.pos.x}" cy="${b.pos.y}" r="${r}" fill="none" stroke="${b.color}" stroke-width="1.5" opacity="0.4" />
        <text x="${b.pos.x}" y="${b.pos.y - 4}" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif" font-weight="600" font-size="${Math.max(12, r / 5.5)}">${b.label}</text>
        <text x="${b.pos.x}" y="${b.pos.y + 14}" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-size="${Math.max(10, r / 7)}" opacity="0.85">${b.totalDoubts}</text>
      </g>`;
  });

  svg.innerHTML = svgContent;

  svg.querySelectorAll(".bubble-node").forEach((node) => {
    node.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const stageRect = document.getElementById("bubbleStage").getBoundingClientRect();
      tooltip.hidden = false;
      tooltip.style.left = (e.clientX - stageRect.left) + "px";
      tooltip.style.top = (e.clientY - stageRect.top) + "px";
      tooltip.innerHTML = `<strong>${node.dataset.label}</strong>${node.dataset.doubts} doubts logged · confusion score ${node.dataset.score}`;
    });
    node.addEventListener("mouseleave", () => { tooltip.hidden = true; });
    node.addEventListener("click", () => {
      activeFilter = node.dataset.key;
      document.querySelector('[data-view="student"]').click();
      renderCategoryFilters();
      document.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.toggle("is-active", c.dataset.cat === node.dataset.key);
      });
      renderFaqList();
    });
  });
}

// ---------------------------------------------------------------
// SELF-HEALING SUGGESTIONS
// ---------------------------------------------------------------
function renderSuggestions() {
  const list = document.getElementById("suggestionList");
  const cards = [];

  // flag high-downvote FAQs for rewrite
  FAQS.filter((f) => f.thumbsDown >= 20)
    .sort((a, b) => b.thumbsDown - a.thumbsDown)
    .slice(0, 3)
    .forEach((f) => {
      cards.push(`
        <div class="suggestion-card">
          <span class="suggestion-flag">⚠ ${f.thumbsDown} thumbs-down this week</span>
          <p class="suggestion-body">"${f.question}" is failing students.</p>
          <span class="suggestion-action">Suggested: Rewrite answer</span>
        </div>`);
    });

  // flag unanswered searches for new content
  UNANSWERED_SEARCHES.slice(0, 3).forEach((u) => {
    cards.push(`
      <div class="suggestion-card">
        <span class="suggestion-flag">⚠ ${u.count} searches, no match</span>
        <p class="suggestion-body">Students searched "${u.query}" but no FAQ exists in ${CATEGORIES[u.category].label}.</p>
        <span class="suggestion-action">Suggested: Create new FAQ</span>
      </div>`);
  });

  list.innerHTML = cards.join("") || `<p style="font-size:13px;color:var(--text-faint)">No flags right now.</p>`;
}

// ---------------------------------------------------------------
// UNRESOLVED CLUSTERS
// ---------------------------------------------------------------
function renderUnresolved() {
  const list = document.getElementById("unresolvedList");
  const unresolved = [...FAQS]
    .sort((a, b) => b.thumbsDown - a.thumbsDown)
    .slice(0, 5);

  list.innerHTML = unresolved
    .map(
      (f) => `
      <div class="unresolved-card">
        <div>
          <div class="unresolved-q">${f.question}</div>
          <div class="unresolved-meta">${CATEGORIES[f.category].label} · ${f.thumbsUp} 👍 / ${f.thumbsDown} 👎</div>
        </div>
        <span class="unresolved-score">${urgencyScore(f)}</span>
      </div>`
    )
    .join("");
}

// ---------------------------------------------------------------
// ADMIN URGENCY OVERRIDE
// ---------------------------------------------------------------
function renderOverrideSelect() {
  const select = document.getElementById("overrideSelect");
  select.innerHTML = FAQS.map((f) => `<option value="${f.id}">${f.question}</option>`).join("");
}

function renderPinned() {
  const container = document.getElementById("overridePinned");
  const pinned = FAQS.filter((f) => f.pinned);
  container.innerHTML = pinned
    .map(
      (f) => `
      <div class="pinned-card">
        <span><strong>${f.question}</strong> — <span class="pinned-card-note">${f.pinNote}</span></span>
        <button class="btn-primary" data-unpin="${f.id}" style="background:var(--text-faint);padding:5px 12px;font-size:11.5px;">Unpin</button>
      </div>`
    )
    .join("");

  container.querySelectorAll("[data-unpin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = FAQS.find((x) => x.id === btn.dataset.unpin);
      if (f) { f.pinned = false; f.pinNote = ""; }
      renderPinned();
      renderFaqList();
    });
  });
}

document.getElementById("overrideApply").addEventListener("click", () => {
  const id = document.getElementById("overrideSelect").value;
  const note = document.getElementById("overrideNote").value.trim() || "Updated policy — read before applying";
  const f = FAQS.find((x) => x.id === id);
  if (f) {
    f.pinned = true;
    f.pinNote = note;
    f.urgency = "critical";
  }
  document.getElementById("overrideNote").value = "";
  renderPinned();
  renderFaqList();
  renderHeatmap();
});

// ---------------------------------------------------------------
// PANIC MODE DETECTION
// ---------------------------------------------------------------
function checkPanicMode() {
  const spike = FAQS.find((f) => f.searchesLastWeek > 0 && f.searchesThisWeek / f.searchesLastWeek >= 4);
  if (spike) {
    document.getElementById("panicBanner").hidden = false;
  }
}
document.getElementById("panicDismiss").addEventListener("click", () => {
  document.getElementById("panicBanner").hidden = true;
});

// ---------------------------------------------------------------
// YAKSHA-MINI — floating chat widget, answers from FAQS data
// ---------------------------------------------------------------
const yakshaLauncher = document.getElementById("yakshaLauncher");
const yakshaPanel = document.getElementById("yakshaPanel");
const yakshaClose = document.getElementById("yakshaClose");
const yakshaMessages = document.getElementById("yakshaMessages");
const yakshaInput = document.getElementById("yakshaInput");
const yakshaSend = document.getElementById("yakshaSend");
const yakshaPing = document.getElementById("yakshaPing");

function openYaksha() {
  yakshaPanel.hidden = false;
  yakshaLauncher.hidden = true;
  if (yakshaPing) yakshaPing.hidden = true;
  yakshaInput.focus();
}
function closeYaksha() {
  yakshaPanel.hidden = true;
  yakshaLauncher.hidden = false;
}
yakshaLauncher.addEventListener("click", openYaksha);
yakshaClose.addEventListener("click", closeYaksha);

function yakshaAppend(role, html) {
  // clear the empty-state placeholder on first message
  const empty = yakshaMessages.querySelector(".yaksha-empty");
  if (empty) empty.remove();

  const row = document.createElement("div");
  row.className = `yaksha-msg ${role}`;
  row.innerHTML = `<div class="yaksha-msg-bubble">${html}</div>`;
  yakshaMessages.appendChild(row);
  yakshaMessages.scrollTop = yakshaMessages.scrollHeight;
  return row;
}

function yakshaTyping() {
  const row = document.createElement("div");
  row.className = "yaksha-msg bot";
  row.innerHTML = `<div class="yaksha-msg-bubble"><div class="yaksha-typing"><span></span><span></span><span></span></div></div>`;
  yakshaMessages.appendChild(row);
  yakshaMessages.scrollTop = yakshaMessages.scrollHeight;
  return row;
}

function yakshaAnswer(query) {
  const scored = FAQS.map((f) => ({ f, score: fuzzyScore(query, f.question) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];

  const typingRow = yakshaTyping();

  setTimeout(() => {
    typingRow.remove();
    if (!best || best.score < 15) {
      yakshaAppend(
        "bot",
        `I couldn't find that in the FAQ yet — this looks like a content gap, and I've logged it for the admins. Try rephrasing, or log in at <a href="https://samagama.in" target="_blank" rel="noopener">samagama.in</a> to ask the full Yaksha for your specific case.`
      );
      return;
    }
    const cat = CATEGORIES[best.f.category];
    const bubble = yakshaAppend(
      "bot",
      `${best.f.answer}<button class="yaksha-msg-source" data-id="${best.f.id}">↳ View full answer in ${cat.label}</button>`
    );
    bubble.querySelector(".yaksha-msg-source").addEventListener("click", () => {
      closeYaksha();
      document.querySelector('[data-view="student"]').click();
      openModal(best.f.id);
    });
  }, 550 + Math.random() * 350);
}

function yakshaSubmit() {
  const q = yakshaInput.value.trim();
  if (!q) return;
  yakshaAppend("user", q);
  yakshaInput.value = "";
  yakshaAnswer(q);
}
yakshaSend.addEventListener("click", yakshaSubmit);
yakshaInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") yakshaSubmit();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !yakshaPanel.hidden) closeYaksha();
});

// ---------------------------------------------------------------
// RENDER ORCHESTRATION
// ---------------------------------------------------------------
function renderAdmin() {
  renderHeatmap();
  renderBubbleChart();
  renderSuggestions();
  renderUnresolved();
  renderOverrideSelect();
  renderPinned();
}

function init() {
  renderCategoryFilters();
  renderFaqList();
  renderTrending();
  renderProgress();
  checkPanicMode();
}

init();
