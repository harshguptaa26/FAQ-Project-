// State Variables
let faqData = [];
let suggestions = [];
let currentTheme = 'light'; // Default to light warm cream
let currentView = 'student';
let activeCategory = 'all';
let searchQuery = '';
let panicMode = false;
let readSections = new Set();
let chatbotHistory = [];
let chatWindowOpen = false;
let currentSubNav = 'faq';
let voiceIssuesData = [];
let urgencyOverrides = {}; // Map of faqId -> { level: 'critical'|'high'|'medium'|'low'|'auto', note: '...' }

// Intent patterns for Search Intent Detection
const INTENT_PATTERNS = [
  { keyword: 'when', label: 'Timeline / Date' },
  { keyword: 'date', label: 'Timeline / Date' },
  { keyword: 'deadline', label: 'Timeline / Date' },
  { keyword: 'how', label: 'Process / Guide' },
  { keyword: 'register', label: 'Process / Guide' },
  { keyword: 'request', label: 'Process / Guide' },
  { keyword: 'who', label: 'Authority / Contact' },
  { keyword: 'where', label: 'Location / Link' },
  { keyword: 'link', label: 'Location / Link' },
  { keyword: 'what', label: 'Information' },
  { keyword: 'why', label: 'Reasoning' }
];

// Typo fuzzy suggestions mapping
const TYPO_MAP = {
  'ncc': { correct: 'NOC', query: 'noc' },
  'nod': { correct: 'NOC', query: 'noc' },
  'intren': { correct: 'Internship', query: 'internship' },
  'internshpi': { correct: 'Internship', query: 'internship' },
  'vibe': { correct: 'ViBe', query: 'vibe' },
  'viba': { correct: 'ViBe', query: 'vibe' },
  'roseta': { correct: 'Rosetta', query: 'rosetta' },
  'rosetea': { correct: 'Rosetta', query: 'rosetta' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  setupEventListeners();
  renderAll();
  switchSubNav(currentSubNav);
  
  // Show initial bot greeting if history is empty
  if (chatbotHistory.length === 0) {
    addBotMessage("Greetings! I am **Yaksha Mini**, your AI FAQ assistant. Ask me anything about VINS onboarding, NOC dates, Spurti calculations, or ViBe logins!");
    updateChatbotUnread(true);
  } else {
    renderChatHistory();
  }
});

// Load state from localStorage or use initial presets
function loadState() {
  const savedFaq = localStorage.getItem('samagama_faq');
  const savedSuggestions = localStorage.getItem('samagama_suggestions');
  const savedTheme = localStorage.getItem('samagama_theme');
  const savedView = localStorage.getItem('samagama_view');
  const savedRead = localStorage.getItem('samagama_read');
  const savedHistory = localStorage.getItem('samagama_chat_history');
  const savedPanic = localStorage.getItem('samagama_panic');
  const savedVoice = localStorage.getItem('samagama_voice_issues');
  const savedOverrides = localStorage.getItem('samagama_overrides');

  faqData = savedFaq ? JSON.parse(savedFaq) : [...INITIAL_FAQ_DATA];
  suggestions = savedSuggestions ? JSON.parse(savedSuggestions) : [...INITIAL_SELF_HEALING_SUGGESTIONS];
  currentTheme = savedTheme || 'light'; // Default to light mode (warm cream)
  currentView = savedView || 'student';
  panicMode = savedPanic === 'true';
  urgencyOverrides = savedOverrides ? JSON.parse(savedOverrides) : {};
  
  if (savedRead) {
    readSections = new Set(JSON.parse(savedRead));
  } else {
    readSections = new Set();
  }

  chatbotHistory = savedHistory ? JSON.parse(savedHistory) : [];
  
  voiceIssuesData = savedVoice ? JSON.parse(savedVoice) : [
    { id: 'v-1', text: "Unable to submit Zoom session polls (Error 100035000)", upvotes: 142, category: 'vibe', upvoted: false },
    { id: 'v-2', text: "Video loading issues on Vibe LMS platform", upvotes: 85, category: 'coursework', upvoted: false },
    { id: 'v-3', text: "Delay in NOC verifications from local university placement cells", upvotes: 60, category: 'noc', upvoted: false },
    { id: 'v-4', text: "Spurti Points not synchronizing after Git commits to private repos", upvotes: 32, category: 'spurti', upvoted: false }
  ];

  // Inject and enforce exact trending stats to match screenshot
  const trendingEnforcements = [
    { id: 'noc-announce', question: 'When will NOC dates be announced?', answer: 'The official dates for the Vicharanashala internship cohorts are announced in the onboarding handbook. Typically, NOC submission verification starts from June 20, and all approvals must be completed by July 10, 2026.', section: 'NOC Section', sectionCode: 'noc', searches: 258, weeklySearches: 258, trendDelta: 230, urgencyScore: 92 },
    { id: 'noc-1', searches: 96, weeklySearches: 96, trendDelta: 74 },
    { id: 'noc-6', searches: 73, weeklySearches: 73, trendDelta: 54 },
    { id: 'vibe-2', searches: 58, weeklySearches: 58, trendDelta: 46 },
    { id: 'noc-2', searches: 41, weeklySearches: 41, trendDelta: 3 }
  ];

  // Cap all other search values to a maximum of 35 so enforced ones are the top 5
  faqData.forEach(faq => {
    if (!['noc-announce', 'noc-1', 'noc-6', 'vibe-2', 'noc-2'].includes(faq.id)) {
      faq.searches = Math.min(faq.searches, 35);
    }
  });

  // Apply or inject enforcements
  trendingEnforcements.forEach(enforce => {
    let faq = faqData.find(f => f.id === enforce.id);
    if (!faq) {
      faq = {
        id: enforce.id,
        section: enforce.section,
        sectionCode: enforce.sectionCode,
        question: enforce.question,
        answer: enforce.answer,
        urgencyScore: enforce.urgencyScore || 30,
        thumbsUp: 10,
        thumbsDown: 0,
        views: enforce.searches * 1.5,
        similarIds: ['noc-1', 'noc-2'],
        nextDoubtIds: ['noc-2']
      };
      faqData.push(faq);
    }
    faq.searches = enforce.searches;
    faq.weeklySearches = enforce.weeklySearches;
    faq.trendDelta = enforce.trendDelta;
    if (enforce.urgencyScore) faq.urgencyScore = enforce.urgencyScore;
  });

  // Parse session and apply role-based configuration
  const sessionStr = localStorage.getItem('samagama_session');
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    const displayEmail = document.getElementById('user-display-email');
    if (displayEmail) {
      displayEmail.innerText = `${session.role.toUpperCase()}: ${session.email}`;
      displayEmail.style.display = 'inline-block';
    }
    
    if (session.role === 'student') {
      currentView = 'student';
      const adminBtn = document.getElementById('view-admin-btn');
      if (adminBtn) {
        adminBtn.style.display = 'none';
      }
    }
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem('samagama_faq', JSON.stringify(faqData));
  localStorage.setItem('samagama_suggestions', JSON.stringify(suggestions));
  localStorage.setItem('samagama_theme', currentTheme);
  localStorage.setItem('samagama_view', currentView);
  localStorage.setItem('samagama_read', JSON.stringify([...readSections]));
  localStorage.setItem('samagama_chat_history', JSON.stringify(chatbotHistory));
  localStorage.setItem('samagama_panic', panicMode);
  localStorage.setItem('samagama_voice_issues', JSON.stringify(voiceIssuesData));
  localStorage.setItem('samagama_overrides', JSON.stringify(urgencyOverrides));
}

// Initialize Theme UI
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButtonIcon();
}

// Update Theme Toggle icon based on state
function updateThemeButtonIcon() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

// Main Render Function
function renderAll() {
  renderPanicBanner();
  renderFaqGrid();
  renderCategorySidebar();
  renderProgressStrip();
  renderTrendingList();
  renderAdminHeatmap();
  renderDoubtClusterMap();
  renderAdminSuggestions();
  renderSimulationState();
  populateOverrideFaqSelect();
  updateViewToggleUI();
}

// Toggle View (Student / Admin)
function toggleView(view) {
  currentView = view;
  saveState();
  
  const studentView = document.getElementById('student-view-container');
  const adminView = document.getElementById('admin-view-container');
  
  if (view === 'student') {
    studentView.style.display = 'block';
    adminView.style.display = 'none';
  } else {
    studentView.style.display = 'none';
    adminView.style.display = 'block';
    renderAdminHeatmap();
    renderDoubtClusterMap();
    populateOverrideFaqSelect();
  }
  updateViewToggleUI();
}

function updateViewToggleUI() {
  const studentBtn = document.getElementById('view-student-btn');
  const adminBtn = document.getElementById('view-admin-btn');
  if (studentBtn && adminBtn) {
    studentBtn.classList.toggle('active', currentView === 'student');
    adminBtn.classList.toggle('active', currentView === 'admin');
  }
  
  const studentView = document.getElementById('student-view-container');
  const adminView = document.getElementById('admin-view-container');
  if (currentView === 'student') {
    studentView.style.display = 'block';
    adminView.style.display = 'none';
  } else {
    studentView.style.display = 'none';
    adminView.style.display = 'block';
  }
}

// Theme Toggle trigger
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  saveState();
  updateThemeButtonIcon();
  
  if (currentView === 'admin') {
    renderDoubtClusterMap();
  }
}

// Render the Critical Panic Mode Banner if active
function renderPanicBanner() {
  const banner = document.getElementById('panic-banner');
  if (panicMode) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

// Dismiss Panic alert manually
function dismissPanic() {
  document.getElementById('panic-banner').style.display = 'none';
}

// Render category filtering sidebar
function renderCategorySidebar() {
  const sidebar = document.getElementById('category-sidebar');
  if (!sidebar) return;
  
  const categories = [
    { code: 'all', name: 'All Topics' },
    { code: 'noc', name: 'NOC Section' },
    { code: 'internship', name: 'Internship Allocation' },
    { code: 'vibe', name: 'ViBe Viva-Voce' },
    { code: 'rosetta', name: 'Rosetta Academy' }
  ];
  
  let html = '';
  categories.forEach(cat => {
    let count = 0;
    if (cat.code === 'all') {
      count = faqData.length;
    } else {
      count = faqData.filter(faq => faq.sectionCode === cat.code).length;
    }
    
    const isActive = activeCategory === cat.code ? 'active' : '';
    html += `
      <button class="category-btn ${isActive}" onclick="setCategory('${cat.code}')">
        <span>${cat.name}</span>
        <span class="category-count">${count}</span>
      </button>
    `;
  });
  
  sidebar.innerHTML = html;
}

// Set Active Category filter
function setCategory(catCode) {
  activeCategory = catCode;
  renderFaqGrid();
  renderCategorySidebar();
}

// Compute urgency score for FAQs dynamically
function getComputedUrgency(faq) {
  // 1. Check for manual override first
  if (urgencyOverrides[faq.id] && urgencyOverrides[faq.id].level !== 'auto') {
    const level = urgencyOverrides[faq.id].level;
    if (level === 'critical') return 100;
    if (level === 'high') return 80;
    if (level === 'medium') return 50;
    if (level === 'low') return 20;
  }

  let score = faq.urgencyScore;
  
  // NOC gets a panic bump if panicMode is active
  if (panicMode && faq.sectionCode === 'noc') {
    score = Math.max(score, 98); // Force high critical urgency
  }
  
  const votePenalty = faq.thumbsDown * 15;
  const searchWeight = Math.floor(faq.searches / 15);
  
  return Math.min(100, Math.max(0, score + votePenalty + searchWeight));
}

// Populate the FAQ select list inside Admin urgency override console
function populateOverrideFaqSelect() {
  const select = document.getElementById('override-faq-select');
  if (!select) return;
  
  let html = '<option value="">-- Choose an FAQ Question --</option>';
  // Sort alphabetically
  const sortedFaqs = [...faqData].sort((a, b) => a.question.localeCompare(b.question));
  sortedFaqs.forEach(faq => {
    html += `<option value="${faq.id}">${faq.question.substring(0, 70)}${faq.question.length > 70 ? '...' : ''}</option>`;
  });
  select.innerHTML = html;
}

// Handle override form submits
function handleUrgencyOverride(event) {
  event.preventDefault();
  const select = document.getElementById('override-faq-select');
  const levelSelect = document.getElementById('override-level');
  const noteInput = document.getElementById('override-note');
  
  if (!select || !levelSelect || !noteInput) return;
  
  const faqId = select.value;
  const level = levelSelect.value;
  const note = noteInput.value.trim();
  
  if (!faqId) {
    alert("Please select an FAQ to override.");
    return;
  }
  
  if (level === 'auto') {
    delete urgencyOverrides[faqId];
  } else {
    urgencyOverrides[faqId] = {
      level: level,
      note: note || (level === 'critical' ? 'Updated policy — read before applying' : '')
    };
  }
  
  saveState();
  renderAll();
  
  // Show confirmation alert
  alert("Urgency override applied successfully!");
  noteInput.value = '';
  select.value = '';
  levelSelect.value = 'auto';
}

// Render the FAQ list based on filters
function renderFaqGrid() {
  const faqGrid = document.getElementById('faq-grid');
  if (!faqGrid) return;
  
  let list = faqData;
  if (activeCategory !== 'all') {
    list = faqData.filter(faq => faq.sectionCode === activeCategory);
  }
  
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    list = list.filter(faq => 
      faq.question.toLowerCase().includes(q) || 
      faq.answer.toLowerCase().includes(q) || 
      faq.section.toLowerCase().includes(q)
    );
  }
  
  // Sort by urgency descending (Critical/overrides float to top automatically)
  list.sort((a, b) => getComputedUrgency(b) - getComputedUrgency(a));
  
  if (list.length === 0) {
    faqGrid.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">🕵️ No results found</p>
        <p style="font-size: 0.9rem;">Try matching key phrases like "NOC status" or "ViBe registration".</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  list.forEach(faq => {
    const urgency = getComputedUrgency(faq);
    let priorityClass = 'low';
    let priorityLabel = 'Low Urgency';
    
    if (urgency >= 85) {
      priorityClass = 'critical';
      priorityLabel = 'Critical';
    } else if (urgency >= 60) {
      priorityClass = 'high';
      priorityLabel = 'High';
    } else if (urgency >= 30) {
      priorityClass = 'medium';
      priorityLabel = 'Medium';
    }
    
    const readIndicator = readSections.has(faq.id) ? '✓ Read' : 'Unread';
    const override = urgencyOverrides[faq.id];
    let overrideBannerHtml = '';
    
    if (override && override.level !== 'auto' && override.note) {
      overrideBannerHtml = `
        <div class="faq-override-banner">
          <span>🚨</span> <strong>Note:</strong> ${override.note}
        </div>
      `;
    }
    
    html += `
      <div class="faq-card ${priorityClass}" onclick="openFaqPopup('${faq.id}')">
        <div class="faq-card-content">
          <div class="faq-card-meta">
            <span class="faq-card-badge">${priorityLabel}</span>
            <span>${faq.section}</span>
            <span>&bull;</span>
            <span style="color: ${readSections.has(faq.id) ? 'var(--urgency-low)' : 'var(--text-muted)'}; font-weight: 500;">${readIndicator}</span>
          </div>
          <div class="faq-card-title">${faq.question}</div>
          ${overrideBannerHtml}
          <div class="faq-card-metrics">
            <span>👁 ${faq.views} views</span>
            <span>👍 ${faq.thumbsUp} votes</span>
            <span>👎 ${faq.thumbsDown}</span>
          </div>
        </div>
        <div class="faq-card-arrow">➜</div>
      </div>
    `;
  });
  
  faqGrid.innerHTML = html;
}

// Render Progress Strip of student read stats
function renderProgressStrip() {
  const label = document.getElementById('progress-label');
  const bar = document.getElementById('progress-bar-fill');
  const percentLabel = document.getElementById('progress-percentage');
  
  if (!label || !bar || !percentLabel) return;
  
  const total = faqData.length;
  const readCount = Array.from(readSections).filter(id => faqData.some(faq => faq.id === id)).length;
  
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;
  
  label.innerText = `You've covered ${readCount} of ${total} FAQ sections`;
  percentLabel.innerText = `${percent}% Completed`;
  bar.style.width = `${percent}%`;
}

// Render Trending doubts this week (top 5 by searches, styled as horizontal cards)
function renderTrendingList() {
  const container = document.getElementById('trending-list');
  if (!container) return;
  
  const sorted = [...faqData].sort((a, b) => b.searches - a.searches).slice(0, 5);
  
  let html = '';
  sorted.forEach((faq, index) => {
    const searches = faq.weeklySearches || Math.floor(faq.searches);
    const delta = faq.trendDelta || Math.floor(faq.searches * 0.8);
    html += `
      <div class="trending-card" onclick="openFaqPopup('${faq.id}')">
        <div class="trending-num-label">${String(index + 1).padStart(2, '0')}</div>
        <div class="trending-card-title">${faq.question}</div>
        <div class="trending-card-stats">
          <span>${searches}/wk</span>
          <span class="trending-stats-badge">▲ +${delta}</span>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      searchQuery = val;
      
      detectIntent(val);
      checkTypoSuggestion(val);
      renderFaqGrid();
    });
  }

  const chatBubble = document.getElementById('chatbot-bubble');
  if (chatBubble) {
    chatBubble.addEventListener('click', toggleChatbotWindow);
  }

  const chatClose = document.getElementById('chat-close');
  if (chatClose) {
    chatClose.addEventListener('click', toggleChatbotWindow);
  }

  const chatForm = document.getElementById('chat-input-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleChatSubmit();
    });
  }

  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeFaqPopup();
      }
    });
  }
}

// Intent Detection Parser
function detectIntent(val) {
  const badge = document.getElementById('intent-badge');
  if (!badge) return;
  
  const cleanVal = val.toLowerCase().trim();
  if (cleanVal.length < 3) {
    badge.className = 'intent-badge';
    return;
  }
  
  let found = null;
  for (let pattern of INTENT_PATTERNS) {
    if (cleanVal.includes(pattern.keyword)) {
      found = pattern.label;
      break;
    }
  }
  
  if (found) {
    badge.innerText = found;
    badge.className = 'intent-badge visible';
  } else {
    badge.className = 'intent-badge';
  }
}

// Typo checking logic
function checkTypoSuggestion(val) {
  const container = document.getElementById('did-you-mean-container');
  const suggestionSpan = document.getElementById('did-you-mean-suggestion');
  if (!container || !suggestionSpan) return;
  
  const words = val.toLowerCase().trim().split(/\s+/);
  let match = null;
  
  for (let word of words) {
    if (TYPO_MAP[word]) {
      match = TYPO_MAP[word];
      break;
    }
  }
  
  if (match) {
    suggestionSpan.innerText = match.correct;
    suggestionSpan.onclick = () => {
      const searchInput = document.getElementById('search-input');
      searchInput.value = match.query;
      searchQuery = match.query;
      detectIntent(match.query);
      container.className = 'did-you-mean';
      renderFaqGrid();
    };
    container.className = 'did-you-mean visible';
  } else {
    container.className = 'did-you-mean';
  }
}

// Cosine TF-IDF similarity engine
function computeTfidfSimilarity(targetFaq) {
  const stopwords = new Set([
    'what', 'is', 'the', 'how', 'when', 'who', 'where', 'to', 'a', 'an', 'and', 'for', 'of', 'in', 'on', 'at', 
    'with', 'my', 'i', 'can', 'you', 'do', 'it', 'this', 'that', 'from', 'by', 'but', 'are', 'we', 'our', 
    'be', 'or', 'if', 'your', 'will', 'do', 'does', 'did', 'should', 'would', 'could', 'get', 'got', 'put'
  ]);
  
  function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(token => token && !stopwords.has(token));
  }

  // Filter corpus to the same category/section code, excluding the target itself
  const categoryFaqs = faqData.filter(f => f.sectionCode === targetFaq.sectionCode && f.id !== targetFaq.id);
  if (categoryFaqs.length === 0) return [];
  
  const corpus = [targetFaq, ...categoryFaqs];
  
  // Compute Document Frequency
  const df = {};
  const docsTokens = corpus.map(doc => {
    const tokens = tokenize(doc.question + ' ' + doc.answer);
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(t => {
      df[t] = (df[t] || 0) + 1;
    });
    return tokens;
  });

  const N = corpus.length;
  const idf = {};
  for (let term in df) {
    idf[term] = Math.log(N / df[term]);
  }

  function getTfidfVector(tokens) {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    
    const vector = {};
    for (let term in tf) {
      vector[term] = (tf[term] / tokens.length) * (idf[term] || 0);
    }
    return vector;
  }

  const targetVector = getTfidfVector(docsTokens[0]);
  let targetNorm = 0;
  for (let term in targetVector) {
    targetNorm += targetVector[term] * targetVector[term];
  }
  targetNorm = Math.sqrt(targetNorm);

  const similarities = [];
  for (let i = 1; i < corpus.length; i++) {
    const doc = corpus[i];
    const docVector = getTfidfVector(docsTokens[i]);
    
    let dot = 0;
    for (let term in targetVector) {
      if (docVector[term]) {
        dot += targetVector[term] * docVector[term];
      }
    }
    
    let docNorm = 0;
    for (let term in docVector) {
      docNorm += docVector[term] * docVector[term];
    }
    docNorm = Math.sqrt(docNorm);
    
    const score = (targetNorm && docNorm) ? (dot / (targetNorm * docNorm)) : 0;
    similarities.push({ faq: doc, score: score });
  }

  // Sort by cosine similarity descending
  similarities.sort((a, b) => b.score - a.score);
  return similarities.map(item => item.faq);
}

// Opens FAQ Detail Popup
function openFaqPopup(id) {
  const faq = faqData.find(f => f.id === id);
  if (!faq) return;
  
  readSections.add(faq.id);
  faq.views++;
  saveState();
  renderProgressStrip();
  renderTrendingList();
  renderFaqGrid();
  
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const categoryBadge = document.getElementById('modal-category-badge');
  const votesUpSpan = document.getElementById('votes-up-count');
  const votesDownSpan = document.getElementById('votes-down-count');
  
  categoryBadge.innerText = faq.section;
  
  // Show manual override notice inside popup if active
  const override = urgencyOverrides[faq.id];
  if (override && override.level !== 'auto' && override.note) {
    title.innerHTML = `
      <div class="faq-override-banner" style="display: flex; margin-bottom: 0.5rem;">
        <span>🚨</span> <strong>Note:</strong> ${override.note}
      </div>
      <div>${faq.question}</div>
    `;
  } else {
    title.innerText = faq.question;
  }
  
  body.innerText = faq.answer;
  votesUpSpan.innerText = faq.thumbsUp;
  votesDownSpan.innerText = faq.thumbsDown;
  
  const upBtn = document.getElementById('vote-up-btn');
  const downBtn = document.getElementById('vote-down-btn');
  
  upBtn.onclick = () => castVote(faq.id, 'up');
  downBtn.onclick = () => castVote(faq.id, 'down');
  
  renderPopupRecommendations(faq);
  
  overlay.className = 'modal-overlay active';
}

// Close FAQ detail popup
function closeFaqPopup() {
  const overlay = document.getElementById('modal-overlay');
  overlay.className = 'modal-overlay';
}

// Render recommendations inside popup ("Ask Before Asking" + TF-IDF similarity)
function renderPopupRecommendations(faq) {
  const container = document.getElementById('recommendations-container');
  if (!container) return;
  
  let html = '';
  
  // Retrieve similar questions using TF-IDF Engine!
  const similarFaqs = computeTfidfSimilarity(faq).slice(0, 3);
  
  if (similarFaqs.length > 0) {
    html += `<div class="recommendations-title">Ask Before Asking (Recommended next)</div>`;
    similarFaqs.forEach(ref => {
      html += `
        <div class="recommendation-item" onclick="navigateFaqPopup('${ref.id}')">
          ${ref.question}
        </div>
      `;
    });
  } else {
    html = `<div style="font-size: 0.85rem; color: var(--text-muted);">No further suggestions.</div>`;
  }
  
  container.innerHTML = html;
}

// Navigate FAQ detail content within the open popup itself
function navigateFaqPopup(id) {
  const faq = faqData.find(f => f.id === id);
  if (!faq) return;
  
  readSections.add(faq.id);
  faq.views++;
  saveState();
  renderProgressStrip();
  renderTrendingList();
  renderFaqGrid();
  
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const categoryBadge = document.getElementById('modal-category-badge');
  const votesUpSpan = document.getElementById('votes-up-count');
  const votesDownSpan = document.getElementById('votes-down-count');
  
  categoryBadge.innerText = faq.section;
  
  const override = urgencyOverrides[faq.id];
  if (override && override.level !== 'auto' && override.note) {
    title.innerHTML = `
      <div class="faq-override-banner" style="display: flex; margin-bottom: 0.5rem;">
        <span>🚨</span> <strong>Note:</strong> ${override.note}
      </div>
      <div>${faq.question}</div>
    `;
  } else {
    title.innerText = faq.question;
  }
  
  body.innerText = faq.answer;
  votesUpSpan.innerText = faq.thumbsUp;
  votesDownSpan.innerText = faq.thumbsDown;
  
  const upBtn = document.getElementById('vote-up-btn');
  const downBtn = document.getElementById('vote-down-btn');
  upBtn.onclick = () => castVote(faq.id, 'up');
  downBtn.onclick = () => castVote(faq.id, 'down');
  
  renderPopupRecommendations(faq);
  
  document.getElementById('modal-content').scrollTop = 0;
}

// Handle Thumbs up/down feedback micro-voting
function castVote(faqId, direction) {
  const faq = faqData.find(f => f.id === faqId);
  if (!faq) return;
  
  if (direction === 'up') {
    faq.thumbsUp++;
  } else {
    faq.thumbsDown++;
    faq.urgencyScore = Math.min(100, faq.urgencyScore + 5);
  }
  
  saveState();
  
  document.getElementById('votes-up-count').innerText = faq.thumbsUp;
  document.getElementById('votes-down-count').innerText = faq.thumbsDown;
  
  const vbtn = document.getElementById(`vote-${direction}-btn`);
  vbtn.style.transform = 'scale(1.1)';
  setTimeout(() => { vbtn.style.transform = 'none'; }, 200);
  
  renderFaqGrid();
  renderAdminHeatmap();
  renderDoubtClusterMap();
  renderAdminSuggestions(); // Refresh self-healing suggestions
}

// Render Admin Confusion Heatmap (Dials & Bar Gauges)
function renderAdminHeatmap() {
  const container = document.getElementById('heatmap-gauges');
  if (!container) return;
  
  const sections = [
    { name: 'NOC', code: 'noc', color: 'var(--urgency-critical)' },
    { name: 'Internship', code: 'internship', color: 'var(--urgency-high)' },
    { name: 'ViBe Viva', code: 'vibe', color: 'var(--urgency-medium)' },
    { name: 'Rosetta Labs', code: 'rosetta', color: 'var(--urgency-low)' }
  ];
  
  let html = '';
  
  sections.forEach(sec => {
    const faqs = faqData.filter(f => f.sectionCode === sec.code);
    let totalScore = 0;
    
    if (faqs.length > 0) {
      faqs.forEach(f => {
        const computed = getComputedUrgency(f);
        totalScore += computed;
      });
      totalScore = Math.round(totalScore / faqs.length);
    }
    
    if (panicMode && sec.code === 'noc') {
      totalScore = 95;
    }
    
    html += `
      <div class="gauge-item">
        <div class="gauge-labels">
          <span class="gauge-section">${sec.name}</span>
          <span class="gauge-score" style="color: ${sec.color}">${totalScore}% Confusion</span>
        </div>
        <div class="gauge-bar-bg">
          <div class="gauge-bar-fill" style="width: ${totalScore}%; background-color: ${sec.color}"></div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Generate the interactive SVG Bubble Chart (Doubt Cluster Map)
function renderDoubtClusterMap() {
  const wrapper = document.getElementById('bubble-chart-container');
  if (!wrapper) return;
  
  const sectionLayout = [
    { code: 'noc', name: 'NOC', cx: 120, cy: 130, colorVar: '--urgency-critical' },
    { code: 'internship', name: 'Internship', cx: 280, cy: 180, colorVar: '--urgency-high' },
    { code: 'vibe', name: 'ViBe', cx: 220, cy: 70, colorVar: '--urgency-medium' },
    { code: 'rosetta', name: 'Rosetta', cx: 410, cy: 110, colorVar: '--urgency-low' }
  ];
  
  let svgContent = `<svg width="100%" height="100%" viewBox="0 0 520 280" style="background: transparent;">`;
  
  sectionLayout.forEach(sec => {
    const faqs = faqData.filter(f => f.sectionCode === sec.code);
    
    let totalDoubts = 0;
    let maxUrgency = 0;
    
    faqs.forEach(f => {
      const urg = getComputedUrgency(f);
      if (urg > maxUrgency) maxUrgency = urg;
      totalDoubts += (f.thumbsDown * 8) + (f.searches / 4) + (f.views / 20);
    });
    
    if (panicMode && sec.code === 'noc') {
      totalDoubts = Math.max(totalDoubts, 280);
      maxUrgency = 98;
    }
    
    let radius = 25 + Math.min(50, totalDoubts / 3);
    const colorHex = getComputedStyle(document.documentElement).getPropertyValue(sec.colorVar).trim() || '#c29545';
    
    svgContent += `
      <g class="bubble-node" transform="translate(0, 0)" 
         onmouseenter="showBubbleTooltip(event, '${sec.name}', ${Math.round(totalDoubts)}, ${Math.round(maxUrgency)})"
         onmouseleave="hideBubbleTooltip()"
         onclick="setCategory('${sec.code}'); toggleView('student');">
        <circle cx="${sec.cx}" cy="${sec.cy}" r="${radius}" 
                fill="${colorHex}20" 
                stroke="${colorHex}" 
                stroke-width="2.5" 
                style="filter: drop-shadow(0 2px 6px ${colorHex}15); transition: r 0.3s ease;"></circle>
        <text x="${sec.cx}" y="${sec.cy}" class="bubble-text" style="font-size: ${Math.max(10, radius/3.5)}px">${sec.name}</text>
      </g>
    `;
  });
  
  svgContent += `</svg>`;
  wrapper.innerHTML = svgContent + `<div id="bubble-tooltip" class="bubble-tooltip"></div>`;
}

// Tooltip helpers for SVG chart
window.showBubbleTooltip = function(event, name, doubts, urgency) {
  const tooltip = document.getElementById('bubble-tooltip');
  if (!tooltip) return;
  
  tooltip.innerHTML = `
    <strong>${name} Category</strong><br/>
    Doubt Signals: ${doubts}<br/>
    Peak Urgency: ${urgency}%
  `;
  
  tooltip.style.opacity = '1';
  
  const wrapper = document.getElementById('bubble-chart-container');
  const rect = wrapper.getBoundingClientRect();
  const x = event.clientX - rect.left + 15;
  const y = event.clientY - rect.top + 15;
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
};

window.hideBubbleTooltip = function() {
  const tooltip = document.getElementById('bubble-tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
};

// Render Self-Healing suggestions on Admin Dashboard
function renderAdminSuggestions() {
  const container = document.getElementById('admin-suggestions-list');
  if (!container) return;
  
  // Dynamically populate based on rating alerts
  const dynamicSuggestions = [...suggestions];
  
  // Find faqs with more than 3 thumbs-downs to self-heal
  faqData.forEach(faq => {
    if (faq.thumbsDown >= 3) {
      const alreadyPresent = dynamicSuggestions.some(s => s.targetId === faq.id);
      if (!alreadyPresent) {
        dynamicSuggestions.unshift({
          id: `dynamic-sh-${faq.id}`,
          type: 'low-rating',
          details: `FAQ '${faq.question.substring(0, 30)}...' has received ${faq.thumbsDown} thumbs-downs.`,
          action: "Rewrite/Elaborate this answer to clarify.",
          targetId: faq.id,
          completed: false
        });
      }
    }
  });

  let html = '';
  dynamicSuggestions.forEach(sug => {
    const isCompleted = sug.completed;
    const completedClass = isCompleted ? 'completed' : '';
    
    html += `
      <div class="suggestion-card ${completedClass}">
        <div class="suggestion-type">${sug.type.replace('-', ' ')}</div>
        <div class="suggestion-desc">${sug.details}</div>
        <div class="suggestion-action-box">
          <div class="suggestion-action-text">Action: ${sug.action}</div>
          <button class="suggestion-btn" onclick="applySelfHealing('${sug.id}')" ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? 'Applied' : 'Resolve'}
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Execute simulated action from self-healing panel
function applySelfHealing(id) {
  let sug = suggestions.find(s => s.id === id);
  if (!sug) {
    // Check if it's dynamic
    const match = faqData.find(f => `dynamic-sh-${f.id}` === id);
    if (match) {
      sug = {
        id: id,
        type: 'low-rating',
        targetId: match.id,
        completed: false
      };
      suggestions.push(sug);
    }
  }
  
  if (!sug || sug.completed) return;
  sug.completed = true;
  
  if (sug.type === 'low-rating') {
    const faq = faqData.find(f => f.id === sug.targetId);
    if (faq) {
      faq.thumbsDown = 0;
      faq.thumbsUp += 10;
      faq.answer += " [Revised & updated with HOD feedback].";
    }
  } else if (sug.type === 'missing-faq') {
    const payload = sug.suggestionPayload;
    const exists = faqData.some(f => f.id === 'stipend-scale');
    if (!exists) {
      faqData.push({
        id: "stipend-scale",
        section: payload.section,
        sectionCode: payload.sectionCode,
        question: payload.question,
        answer: payload.answer,
        urgencyScore: 40,
        thumbsUp: 10,
        thumbsDown: 0,
        views: 41,
        searches: 41,
        similarIds: ["work-4", "work-1"],
        nextDoubtIds: ["work-4"]
      });
    }
  } else if (sug.type === 'panic-prevention') {
    const faq = faqData.find(f => f.id === sug.targetId);
    if (faq) {
      faq.urgencyScore = 88;
    }
  }
  
  saveState();
  renderAll();
  alert("Self-healing action applied successfully!");
}

// Render Simulation State Buttons on Admin
function renderSimulationState() {
  const panicBtn = document.getElementById('sim-panic-btn');
  if (!panicBtn) return;
  
  panicBtn.className = panicMode ? 'sim-btn panic-active' : 'sim-btn';
  panicBtn.innerHTML = `
    <span>Simulate NOC Search Spike (${panicMode ? '250' : '20'} reqs)</span>
    <span class="sim-indicator"></span>
  `;
}

// Trigger simulated NOC Search Spike (Panic Mode)
function toggleSimulatedPanic() {
  panicMode = !panicMode;
  
  if (panicMode) {
    faqData.forEach(f => {
      if (f.sectionCode === 'noc') {
        f.searches += 200;
        f.views += 100;
      }
    });
  } else {
    faqData.forEach(f => {
      if (f.sectionCode === 'noc') {
        f.searches = Math.max(10, f.searches - 200);
      }
    });
  }
  
  saveState();
  renderAll();
}

// --- AI Chatbot Yaksha Mini logic ---

// Toggle chatbot drawer visible state
function toggleChatbotWindow() {
  chatWindowOpen = !chatWindowOpen;
  const chatWindow = document.getElementById('chat-window');
  chatWindow.classList.toggle('active', chatWindowOpen);
  
  if (chatWindowOpen) {
    updateChatbotUnread(false);
    setTimeout(() => {
      document.getElementById('chat-input-field').focus();
    }, 300);
  }
}

// Unread notification badge control
function updateChatbotUnread(hasUnread) {
  const unreadDot = document.getElementById('chatbot-badge-unread');
  if (unreadDot) {
    unreadDot.style.display = hasUnread ? 'block' : 'none';
  }
}

// Add user dialogue message bubbles
function addUserMessage(text) {
  chatbotHistory.push({ sender: 'user', text: text });
  saveState();
  renderChatHistory();
}

// Add bot dialogue response bubbles
function addBotMessage(text) {
  chatbotHistory.push({ sender: 'bot', text: text });
  saveState();
  renderChatHistory();
}

// Render the chatbot conversation stream
function renderChatHistory() {
  const feed = document.getElementById('chat-messages');
  if (!feed) return;
  
  let html = '';
  chatbotHistory.forEach(msg => {
    let formattedText = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
      
    html += `
      <div class="chat-bubble-msg ${msg.sender}">
        ${formattedText}
      </div>
    `;
  });
  
  feed.innerHTML = html;
  feed.scrollTop = feed.scrollHeight;
}

// Handle manual input submits
function handleChatSubmit() {
  const input = document.getElementById('chat-input-field');
  if (!input) return;
  
  const text = input.value.trim();
  if (text === '') return;
  
  input.value = '';
  addUserMessage(text);
  
  setTimeout(() => {
    processChatResponse(text);
  }, 600);
}

// Dialog intelligence engine (Keyword & Intent matcher + suggestions)
function processChatResponse(text) {
  const query = text.toLowerCase();
  let response = '';
  
  let faqMatch = faqData.find(f => f.question.toLowerCase().includes(query) || query.includes(f.question.toLowerCase()));
  
  if (faqMatch) {
    response = `Here is what I found for **"${faqMatch.question}"**:\n\n${faqMatch.answer.slice(0, 180)}...\n\nWould you like me to open the full FAQ card details for you?`;
    addBotMessage(response);
    renderChatChips([
      { text: `Open "${faqMatch.section}" FAQ`, action: () => { openFaqPopup(faqMatch.id); toggleChatbotWindow(); } },
      { text: "Ask something else", action: () => sendPremadeQuery("Hello") }
    ]);
    return;
  }
  
  let presetFound = null;
  for (let pr of YAKSHA_CHAT_PRESETS) {
    const match = pr.keywords.some(kw => query.includes(kw));
    if (match) {
      presetFound = pr;
      break;
    }
  }
  
  if (presetFound) {
    addBotMessage(presetFound.reply);
    
    if (query.includes('noc')) {
      renderChatChips([
        { text: "NOC requirements", action: () => sendPremadeQuery("What are NOC requirements?") },
        { text: "NOC dates", action: () => sendPremadeQuery("When open NOC dates?") },
        { text: "Show NOC list", action: () => { setCategory('noc'); toggleChatbotWindow(); } }
      ]);
    } else if (query.includes('intern')) {
      renderChatChips([
        { text: "Timeline & Dates", action: () => sendPremadeQuery("Internship dates timeline") },
        { text: "External internship?", action: () => sendPremadeQuery("Can I do external internship?") }
      ]);
    } else if (query.includes('vibe')) {
      renderChatChips([
        { text: "Viva guidelines", action: () => sendPremadeQuery("Viva guidelines pattern") },
        { text: "ViBe link", action: () => sendPremadeQuery("ViBe registration link") }
      ]);
    } else if (query.includes('rosetta')) {
      renderChatChips([
        { text: "Request Access", action: () => sendPremadeQuery("Request Rosetta Access") },
        { text: "Troubleshoot login", action: () => sendPremadeQuery("Rosetta login issues") }
      ]);
    } else {
      showDefaultChips();
    }
  } else {
    response = "I couldn't find an exact answer for that query. I have logged this for our admin team as a missing search query. In the meantime, try asking about 'NOC dates', 'Internship registration', or 'ViBe portal'.";
    addBotMessage(response);
    logMissingQueryAdmin(text);
    showDefaultChips();
  }
}

// Log missing queries into admin self-healing recommendations dynamically!
function logMissingQueryAdmin(text) {
  const existing = suggestions.some(s => s.details.includes(text));
  if (existing || text.length < 5) return;
  
  suggestions.unshift({
    id: `sh-${Date.now()}`,
    type: 'missing-faq',
    details: `Multiple students searched for "${text}" but no direct FAQ exists.`,
    action: `Create a new FAQ matching query: "${text}"`,
    suggestionPayload: {
      section: "NOC",
      sectionCode: "noc",
      question: `Guidelines for ${text}`,
      answer: `This FAQ has been generated automatically to address the query: "${text}". Standard guidelines follow the departmental regulatory committee standards. Please contact student counseling for case-specific queries.`
    },
    completed: false
  });
  
  saveState();
  if (currentView === 'admin') {
    renderAdminSuggestions();
  }
}

// Chat action chips rendering
function renderChatChips(chips) {
  const chipsContainer = document.getElementById('chat-chips');
  if (!chipsContainer) return;
  
  let html = '';
  chips.forEach((ch, idx) => {
    html += `<button class="chat-chip" id="chat-chip-${idx}">${ch.text}</button>`;
  });
  
  chipsContainer.innerHTML = html;
  
  chips.forEach((ch, idx) => {
    const btn = document.getElementById(`chat-chip-${idx}`);
    if (btn) btn.onclick = ch.action;
  });
}

function showDefaultChips() {
  renderChatChips([
    { text: "📅 Dates & Deadlines", action: () => sendPremadeQuery("Show dates deadlines") },
    { text: "📋 NOC requirements", action: () => sendPremadeQuery("NOC document requirements") },
    { text: "🎙️ ViBe Guide", action: () => sendPremadeQuery("Viva guidelines pattern") }
  ]);
}

// Send pre-made queries from recommendation chips
function sendPremadeQuery(text) {
  addUserMessage(text);
  setTimeout(() => {
    processChatResponse(text);
  }, 600);
}

// Log out user
function handleLogout() {
  localStorage.removeItem('samagama_session');
  window.location.href = 'login.html';
}

// Switch between sub-nav panels (Overview, FAQ, Voice)
function switchSubNav(panelId) {
  currentSubNav = panelId;
  
  document.getElementById('panel-overview').style.display = 'none';
  document.getElementById('panel-faq').style.display = 'none';
  document.getElementById('panel-voice').style.display = 'none';
  
  document.getElementById(`panel-${panelId}`).style.display = 'block';
  
  document.getElementById('sub-nav-overview').classList.toggle('active', panelId === 'overview');
  document.getElementById('sub-nav-faq').classList.toggle('active', panelId === 'faq');
  document.getElementById('sub-nav-voice').classList.toggle('active', panelId === 'voice');
  
  if (panelId === 'voice') {
    renderVoiceBoard();
  }
}

// Render student voice issues board
function renderVoiceBoard() {
  const container = document.getElementById('voice-issues-list');
  if (!container) return;
  
  const list = [...voiceIssuesData].sort((a, b) => b.upvotes - a.upvotes);
  
  let html = '';
  list.forEach(issue => {
    html += `
      <div class="voice-issue-item">
        <div class="voice-issue-content">
          <span class="voice-issue-tag">#${issue.category}</span>
          <span class="voice-issue-desc">${issue.text}</span>
        </div>
        <div class="voice-issue-action">
          <span class="voice-issue-upvotes">${issue.upvotes} votes</span>
          <button class="btn-voice-upvote" onclick="upvoteVoiceIssue('${issue.id}')" ${issue.upvoted ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
            <span>${issue.upvoted ? 'Upvoted' : 'Upvote'}</span>
            <span>👍</span>
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Upvote a student concern issue
function upvoteVoiceIssue(id) {
  const issue = voiceIssuesData.find(i => i.id === id);
  if (!issue || issue.upvoted) return;
  
  issue.upvotes++;
  issue.upvoted = true;
  saveState();
  renderVoiceBoard();
  
  if (issue.upvotes >= 100) {
    const existing = suggestions.some(s => s.details.includes(issue.text));
    if (!existing) {
      suggestions.unshift({
        id: `sh-voice-${Date.now()}`,
        type: 'low-rating',
        details: `Community issue "${issue.text}" has crossed 100 upvotes!`,
        action: `Contact engineering to resolve "${issue.category}" and update related FAQs.`,
        completed: false
      });
      saveState();
      if (currentView === 'admin') {
        renderAdminSuggestions();
      }
    }
  }
}

// Handle voice concern form submits
function handleVoiceSubmit(event) {
  event.preventDefault();
  const textVal = document.getElementById('voice-issue-text').value.trim();
  const catVal = document.getElementById('voice-category').value;
  
  if (textVal === '') return;
  
  const newIssue = {
    id: `v-${Date.now()}`,
    text: textVal,
    upvotes: 1,
    category: catVal,
    upvoted: true
  };
  
  voiceIssuesData.push(newIssue);
  saveState();
  
  document.getElementById('voice-issue-text').value = '';
  renderVoiceBoard();
  
  const formCard = document.querySelector('.voice-form-card');
  const alertToast = document.createElement('div');
  alertToast.innerText = "Concern posted successfully to board!";
  alertToast.style.cssText = "margin-top: 1rem; color: var(--urgency-low); font-size: 0.8rem; text-align: center;";
  formCard.appendChild(alertToast);
  setTimeout(() => { alertToast.remove(); }, 3000);
}
