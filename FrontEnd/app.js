// State Variables
let faqData = [];
let suggestions = [];
let currentTheme = 'dark';
let currentView = 'student';
let activeCategory = 'all';
let searchQuery = '';
let panicMode = false;
let readSections = new Set();
let chatbotHistory = [];
let chatWindowOpen = false;
let currentSubNav = 'faq';
let voiceIssuesData = [];

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

  faqData = savedFaq ? JSON.parse(savedFaq) : [...INITIAL_FAQ_DATA];
  suggestions = savedSuggestions ? JSON.parse(savedSuggestions) : [...INITIAL_SELF_HEALING_SUGGESTIONS];
  currentTheme = savedTheme || 'dark';
  currentView = savedView || 'student';
  panicMode = savedPanic === 'true';
  
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
    // Re-render graphs since they were hidden
    renderAdminHeatmap();
    renderDoubtClusterMap();
  }
  updateViewToggleUI();
}

function updateViewToggleUI() {
  document.getElementById('view-student-btn').classList.toggle('active', currentView === 'student');
  document.getElementById('view-admin-btn').classList.toggle('active', currentView === 'admin');
  
  // Show / Hide the header action bar appropriately
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
  
  // Redraw graphs in new theme colors if in admin view
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

// Dismiss Panic alert manually (turns off banner but doesn't resolve simulation state unless clicked)
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
    // Count items matching
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
// In our engine, base score is affected by searches, views, and thumbsDown votes.
function getComputedUrgency(faq) {
  let score = faq.urgencyScore;
  
  // NOC gets a panic bump if panicMode is active
  if (panicMode && faq.sectionCode === 'noc') {
    score = Math.max(score, 98); // Force high critical urgency
  }
  
  // Custom formula: Thumbs down significantly elevates urgency
  const votePenalty = faq.thumbsDown * 15;
  const searchWeight = Math.floor(faq.searches / 15);
  
  return Math.min(100, Math.max(0, score + votePenalty + searchWeight));
}

// Render the FAQ list based on filters
function renderFaqGrid() {
  const faqGrid = document.getElementById('faq-grid');
  if (!faqGrid) return;
  
  // Filter by category
  let list = faqData;
  if (activeCategory !== 'all') {
    list = faqData.filter(faq => faq.sectionCode === activeCategory);
  }
  
  // Filter by search query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    list = list.filter(faq => 
      faq.question.toLowerCase().includes(q) || 
      faq.answer.toLowerCase().includes(q) || 
      faq.section.toLowerCase().includes(q)
    );
  }
  
  // Sort by urgency descending
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
      priorityLabel = 'High Urgency';
    } else if (urgency >= 30) {
      priorityClass = 'medium';
      priorityLabel = 'Medium Urgency';
    }
    
    const readIndicator = readSections.has(faq.id) ? '✓ Read' : 'Unread';
    
    html += `
      <div class="faq-card ${priorityClass}" onclick="openFaqPopup('${faq.id}')">
        <div class="faq-card-content">
          <div class="faq-card-meta">
            <span class="faq-card-badge">${priorityLabel}</span>
            <span>${faq.section}</span>
            <span>•</span>
            <span style="color: ${readSections.has(faq.id) ? 'var(--neon-green)' : 'var(--text-muted)'}">${readIndicator}</span>
          </div>
          <div class="faq-card-title">${faq.question}</div>
          <div class="faq-card-meta" style="margin-top: 0.25rem;">
            <span>👁 ${faq.views} views</span>
            <span>👍 ${faq.thumbsUp}</span>
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

// Render Trending This Week (top 5 by search count)
function renderTrendingList() {
  const container = document.getElementById('trending-list');
  if (!container) return;
  
  // Sort copy by searches/views descending
  const sorted = [...faqData].sort((a, b) => b.searches - a.searches).slice(0, 5);
  
  let html = '';
  sorted.forEach((faq, index) => {
    html += `
      <div class="trending-item" onclick="openFaqPopup('${faq.id}')">
        <div class="trending-number">${index + 1}</div>
        <div class="trending-text">${faq.question}</div>
        <div class="trending-badge">${faq.section}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Setup Event Listeners
function setupEventListeners() {
  // Search bar input parsing
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

  // Chat window open trigger
  const chatBubble = document.getElementById('chatbot-bubble');
  if (chatBubble) {
    chatBubble.addEventListener('click', toggleChatbotWindow);
  }

  // Chat window close trigger
  const chatClose = document.getElementById('chat-close');
  if (chatClose) {
    chatClose.addEventListener('click', toggleChatbotWindow);
  }

  // Chat input submit
  const chatForm = document.getElementById('chat-input-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleChatSubmit();
    });
  }

  // Close modal when clicking overlay
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

// Opens FAQ Detail Popup (Modals)
function openFaqPopup(id) {
  const faq = faqData.find(f => f.id === id);
  if (!faq) return;
  
  // Track read progress & view stats
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
  title.innerText = faq.question;
  body.innerText = faq.answer;
  
  votesUpSpan.innerText = faq.thumbsUp;
  votesDownSpan.innerText = faq.thumbsDown;
  
  // Setup voting button bindings
  const upBtn = document.getElementById('vote-up-btn');
  const downBtn = document.getElementById('vote-down-btn');
  
  upBtn.onclick = () => castVote(faq.id, 'up');
  downBtn.onclick = () => castVote(faq.id, 'down');
  
  // Render recommendations inside popup
  renderPopupRecommendations(faq);
  
  overlay.className = 'modal-overlay active';
}

// Close FAQ detail popup
function closeFaqPopup() {
  const overlay = document.getElementById('modal-overlay');
  overlay.className = 'modal-overlay';
}

// Render related recommendations inside popup ("Ask Before Asking" + "You May Also Need")
function renderPopupRecommendations(faq) {
  const container = document.getElementById('recommendations-container');
  if (!container) return;
  
  let html = '';
  
  // Merge similarIds and nextDoubtIds, unique list
  const recIds = Array.from(new Set([...(faq.similarIds || []), ...(faq.nextDoubtIds || [])])).slice(0, 3);
  
  if (recIds.length > 0) {
    html += `<div class="recommendations-title">Ask Before Asking (Recommended next)</div>`;
    recIds.forEach(rid => {
      const ref = faqData.find(f => f.id === rid);
      if (ref) {
        html += `
          <div class="recommendation-item" onclick="navigateFaqPopup('${ref.id}')">
            ${ref.question}
          </div>
        `;
      }
    });
  } else {
    html = `<div style="font-size: 0.85rem; color: var(--text-muted);">No further suggestions.</div>`;
  }
  
  container.innerHTML = html;
}

// Navigate FAQ detail content within the open popup itself
function navigateFaqPopup(id) {
  // First update contents in view
  const faq = faqData.find(f => f.id === id);
  if (!faq) return;
  
  // Track state
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
  title.innerText = faq.question;
  body.innerText = faq.answer;
  
  votesUpSpan.innerText = faq.thumbsUp;
  votesDownSpan.innerText = faq.thumbsDown;
  
  const upBtn = document.getElementById('vote-up-btn');
  const downBtn = document.getElementById('vote-down-btn');
  upBtn.onclick = () => castVote(faq.id, 'up');
  downBtn.onclick = () => castVote(faq.id, 'down');
  
  renderPopupRecommendations(faq);
  
  // Scroll modal content back to top smoothly
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
    // Notify or increment urgency immediately
    faq.urgencyScore = Math.min(100, faq.urgencyScore + 5);
  }
  
  saveState();
  
  // Update popup numbers in view
  document.getElementById('votes-up-count').innerText = faq.thumbsUp;
  document.getElementById('votes-down-count').innerText = faq.thumbsDown;
  
  // Notify with minor inline badge animations
  const vbtn = document.getElementById(`vote-${direction}-btn`);
  vbtn.style.transform = 'scale(1.2)';
  setTimeout(() => { vbtn.style.transform = 'none'; }, 200);
  
  // Re-render student views & admin metrics
  renderFaqGrid();
  renderAdminHeatmap();
  renderDoubtClusterMap();
}

// Render Admin Confusion Heatmap (Dials & Bar Gauges)
function renderAdminHeatmap() {
  const container = document.getElementById('heatmap-gauges');
  if (!container) return;
  
  const sections = [
    { name: 'NOC', code: 'noc', color: 'var(--neon-red)' },
    { name: 'Internship', code: 'internship', color: 'var(--neon-orange)' },
    { name: 'ViBe Viva', code: 'vibe', color: 'var(--neon-yellow)' },
    { name: 'Rosetta Labs', code: 'rosetta', color: 'var(--neon-green)' }
  ];
  
  let html = '';
  
  sections.forEach(sec => {
    // Calculate Confusion Score:
    // Formula = weighted average of urgency, searches, and thumbsDown votes of the section's questions.
    const faqs = faqData.filter(f => f.sectionCode === sec.code);
    let totalScore = 0;
    
    if (faqs.length > 0) {
      faqs.forEach(f => {
        const computed = getComputedUrgency(f);
        totalScore += computed;
      });
      totalScore = Math.round(totalScore / faqs.length);
    }
    
    // Hard code spike values if panicMode is active for visual feedback
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
  
  // Calculate aggregate doubts for each section
  // Size = number of doubts (views/15 + searches/5 + thumbsDown*3)
  // Color = urgency (based on max urgency in category)
  // NOC, Internship, ViBe, Rosetta coordinates:
  const sectionLayout = [
    { code: 'noc', name: 'NOC', cx: 120, cy: 130, colorVar: '--neon-red' },
    { code: 'internship', name: 'Internship', cx: 280, cy: 180, colorVar: '--neon-orange' },
    { code: 'vibe', name: 'ViBe', cx: 220, cy: 70, colorVar: '--neon-yellow' },
    { code: 'rosetta', name: 'Rosetta', cx: 410, cy: 110, colorVar: '--neon-green' }
  ];
  
  let svgContent = `<svg width="100%" height="100%" viewBox="0 0 520 280" style="background: transparent;">`;
  
  sectionLayout.forEach(sec => {
    const faqs = faqData.filter(f => f.sectionCode === sec.code);
    
    let totalDoubts = 0;
    let maxUrgency = 0;
    
    faqs.forEach(f => {
      const urg = getComputedUrgency(f);
      if (urg > maxUrgency) maxUrgency = urg;
      
      // Compute doubts signal
      totalDoubts += (f.thumbsDown * 8) + (f.searches / 4) + (f.views / 20);
    });
    
    if (panicMode && sec.code === 'noc') {
      totalDoubts = Math.max(totalDoubts, 280);
      maxUrgency = 98;
    }
    
    // Scale radius: range between 25 and 70
    let radius = 25 + Math.min(50, totalDoubts / 3);
    
    // Colors based on theme and urgency
    let fillGlow = 'rgba(0, 243, 255, 0.4)';
    if (maxUrgency >= 85) fillGlow = 'rgba(255, 49, 49, 0.4)';
    else if (maxUrgency >= 60) fillGlow = 'rgba(255, 108, 0, 0.4)';
    else if (maxUrgency >= 30) fillGlow = 'rgba(255, 230, 0, 0.4)';
    else fillGlow = 'rgba(57, 255, 20, 0.4)';
    
    const neonColor = getComputedStyle(document.documentElement).getPropertyValue(sec.colorVar).trim();
    
    svgContent += `
      <g class="bubble-node" transform="translate(0, 0)" 
         onmouseenter="showBubbleTooltip(event, '${sec.name}', ${Math.round(totalDoubts)}, ${Math.round(maxUrgency)})"
         onmouseleave="hideBubbleTooltip()"
         onclick="setCategory('${sec.code}'); toggleView('student');">
        <circle cx="${sec.cx}" cy="${sec.cy}" r="${radius}" 
                fill="${neonColor}15" 
                stroke="${neonColor}" 
                stroke-width="2.5" 
                style="filter: drop-shadow(0 0 8px ${neonColor}); transition: r 0.3s ease;"></circle>
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
  
  // Position tooltip relative to container wrapper bounds
  const wrapper = document.getElementById('bubble-chart-container');
  const rect = wrapper.getBoundingClientRect();
  
  // Calculate relative coordinates
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
  
  let html = '';
  
  suggestions.forEach(sug => {
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
  const sug = suggestions.find(s => s.id === id);
  if (!sug || sug.completed) return;
  
  sug.completed = true;
  
  if (sug.type === 'low-rating') {
    // Rewrite answer action: reduce thumbsDown to reset tension, update answer text
    const faq = faqData.find(f => f.id === sug.targetId);
    if (faq) {
      faq.thumbsDown = 0;
      faq.answer += " [Answer updated with detailed Dean Office instructions].";
    }
  } else if (sug.type === 'missing-faq') {
    // Add the new missing FAQ card to the database
    const payload = sug.suggestionPayload;
    const exists = faqData.some(f => f.id === 'cgpa-exemption');
    if (!exists) {
      faqData.push({
        id: "cgpa-exemption",
        section: payload.section,
        sectionCode: payload.sectionCode,
        question: payload.question,
        answer: payload.answer,
        urgencyScore: 40,
        thumbsUp: 10,
        thumbsDown: 0,
        views: 41,
        searches: 41,
        similarIds: ["intern-register", "intern-timeline"],
        nextDoubtIds: ["intern-register"]
      });
    }
  } else if (sug.type === 'panic-prevention') {
    // Modify priority of specific target
    const faq = faqData.find(f => f.id === sug.targetId);
    if (faq) {
      faq.urgencyScore = 88;
    }
  }
  
  saveState();
  renderAll();
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
    // Spike search stats of NOC questions
    faqData.forEach(f => {
      if (f.sectionCode === 'noc') {
        f.searches += 200;
        f.views += 100;
      }
    });
  } else {
    // Reset search spike counts slightly
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
    // Focus chatbot field
    setTimeout(() => {
      document.getElementById('chat-input-field').focus();
    }, 300);
  }
}

// Unread notification glow control
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
    // Simple markdown link conversion for text links e.g. [text](link) or formatting
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
  // Scroll to bottom
  feed.scrollTop = feed.scrollHeight;
}

// Handle manual input submits
function handleChatSubmit() {
  const input = document.getElementById('chat-input-field');
  if (!input) return;
  
  const text = input.value.trim();
  if (text === '') return;
  
  input.value = '';
  
  // Add to stream
  addUserMessage(text);
  
  // Simulate AI typing delay
  setTimeout(() => {
    processChatResponse(text);
  }, 600);
}

// Dialog intelligence engine (Keyword & Intent matcher + suggestions)
function processChatResponse(text) {
  const query = text.toLowerCase();
  let response = '';
  
  // Search state database first for exact matching titles
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
  
  // Try mapping preset keywords
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
    
    // Provide relevant suggestions based on topic
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
    // Default fallback response
    response = "I couldn't find an exact answer for that query. I have logged this for our admin team as a missing search query. In the meantime, try asking about 'NOC dates', 'Internship registration', or 'ViBe portal'.";
    addBotMessage(response);
    
    // Save to suggestions if no close result (simulating self-healing loop!)
    logMissingQueryAdmin(text);
    
    showDefaultChips();
  }
}

// Log missing queries into admin self-healing recommendations dynamically!
function logMissingQueryAdmin(text) {
  // Check if suggestion already exists
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
  
  // Attach functions
  chips.forEach((ch, idx) => {
    document.getElementById(`chat-chip-${idx}`).onclick = ch.action;
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

// Log out user, clear session storage, and redirect
function handleLogout() {
  localStorage.removeItem('samagama_session');
  window.location.href = 'login.html';
}

// Switch between sub-nav panels (Overview, FAQ, Voice)
function switchSubNav(panelId) {
  currentSubNav = panelId;
  
  // Hide all panels
  document.getElementById('panel-overview').style.display = 'none';
  document.getElementById('panel-faq').style.display = 'none';
  document.getElementById('panel-voice').style.display = 'none';
  
  // Show active panel
  document.getElementById(`panel-${panelId}`).style.display = 'block';
  
  // Toggle tab states
  document.getElementById('sub-nav-overview').classList.toggle('active', panelId === 'overview');
  document.getElementById('sub-nav-faq').classList.toggle('active', panelId === 'faq');
  document.getElementById('sub-nav-voice').classList.toggle('active', panelId === 'voice');
  
  // Perform page renders if relevant
  if (panelId === 'voice') {
    renderVoiceBoard();
  }
}

// Render student voice issues board
function renderVoiceBoard() {
  const container = document.getElementById('voice-issues-list');
  if (!container) return;
  
  // Sort by upvotes descending
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
  
  // Add to admin self-healing recommendations dynamically if upvotes cross a threshold!
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
  
  // Push concern
  const newIssue = {
    id: `v-${Date.now()}`,
    text: textVal,
    upvotes: 1,
    category: catVal,
    upvoted: true
  };
  
  voiceIssuesData.push(newIssue);
  saveState();
  
  // Clear input
  document.getElementById('voice-issue-text').value = '';
  
  // Re-render Voice Board
  renderVoiceBoard();
  
  // Minor toast notification logic simulation
  const formCard = document.querySelector('.voice-form-card');
  const alertToast = document.createElement('div');
  alertToast.innerText = "Concern posted successfully to board!";
  alertToast.style.cssText = "margin-top: 1rem; color: var(--neon-green); font-family: var(--font-mono); font-size: 0.8rem; text-align: center; animation: slide-message 0.3s ease;";
  formCard.appendChild(alertToast);
  setTimeout(() => { alertToast.remove(); }, 3000);
}
