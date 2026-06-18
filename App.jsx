import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  RefreshCw, 
  Search, 
  BookOpen, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Cpu, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Layers,
  Database
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SUGGESTIONS = [
  "can I take leave?",
  "how to upload NOC?",
  "vibe progress not 100",
  "is there a stipend?"
];

function App() {
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am Yaksha-mini, your FAQ-grounded assistant. Ask me anything about the Vicharanashala Internship!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  // Dashboard state
  const [status, setStatus] = useState({
    status: "idle",
    faq_count: 0,
    version: "Loading...",
    last_updated: "Loading...",
    embedding_provider: "Unknown",
    llm_provider: "Unknown"
  });
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  // Fetch status and FAQs on mount
  useEffect(() => {
    fetchStatus();
    fetchFaqs();
  }, []);

  // Filter FAQs when search or category changes
  useEffect(() => {
    let result = faqs;
    
    if (selectedCategory !== "all") {
      result = result.filter(faq => faq.section_title === selectedCategory);
    }
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(q) || 
        faq.answer.toLowerCase().includes(q)
      );
    }
    
    setFilteredFaqs(result);
  }, [searchQuery, selectedCategory, faqs]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Error fetching status:", e);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${API_BASE}/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
        setFilteredFaqs(data);
      }
    } catch (e) {
      console.error("Error fetching FAQs:", e);
    }
  };

  const triggerScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch(`${API_BASE}/scrape`, { method: "POST" });
      if (res.ok) {
        alert("Scraper triggered! Updating in background...");
        // Poll status to watch for completion
        setTimeout(async () => {
          await fetchStatus();
          await fetchFaqs();
          setIsScraping(false);
        }, 5000);
      } else {
        setIsScraping(false);
      }
    } catch (e) {
      console.error("Error triggering scrape:", e);
      setIsScraping(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    if (!textToSend) setChatInput("");

    // Add user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: "user", text, timestamp }]);
    
    setIsBotTyping(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: "bot",
          text: data.answer,
          sources: data.related_questions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: "bot",
          text: "I experienced an error connecting to the FAQ search server. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) {
      console.error("Error asking bot:", e);
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "Could not reach the server. Make sure the backend is running at http://localhost:8000.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // Group FAQs by categories for the sidebar
  const categories = Array.from(new Set(faqs.map(faq => faq.section_title)));

  const getScoreColorClass = (score) => {
    if (score >= 0.75) return "high";
    if (score >= 0.5) return "medium";
    return "low";
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-logo">Y</div>
          <div className="brand-text">
            <h1>Yaksha-mini FAQ Search</h1>
            <p>Applied AI · Open-source software engineering · IIT Ropar</p>
          </div>
        </div>

        <div className="status-pill">
          <div className={`status-dot ${status.status === 'indexing' || isScraping ? 'loading' : ''}`} />
          <span className="status-info">
            <span className="label">Index Status:</span>
            {status.status === 'indexing' || isScraping ? 'Scraping FAQ page...' : 'Active'}
          </span>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Column - Meta & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Index Details Card */}
          <div className="card-panel">
            <h2 className="card-title">
              <Database size={20} className="accent-text" /> Index Metadata
            </h2>
            
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-val">{status.faq_count}</div>
                <div className="stat-lbl">FAQs Cached</div>
              </div>
              <div className="stat-item">
                <div className="stat-val" style={{ fontSize: '1.1rem', padding: '0.2rem 0' }}>
                  {status.version}
                </div>
                <div className="stat-lbl">Doc Version</div>
              </div>
            </div>

            <div className="control-group">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Last Scraped Date:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{status.last_updated}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Embedding Provider:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500', textTransform: 'capitalize' }}>
                    {status.embedding_provider}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>LLM grounder:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500', textTransform: 'capitalize' }}>
                    {status.llm_provider}
                  </span>
                </div>
              </div>

              <button 
                className="btn-primary" 
                onClick={triggerScrape}
                disabled={isScraping || status.status === "indexing"}
              >
                <RefreshCw size={16} className={isScraping || status.status === "indexing" ? "spin" : ""} />
                {isScraping || status.status === "indexing" ? "Re-indexing..." : "Re-scrape samagama.in"}
              </button>
            </div>
          </div>

          {/* Categories Card */}
          <div className="card-panel">
            <h2 className="card-title">
              <Layers size={20} className="accent-text" /> FAQ Sections
            </h2>
            
            <div className="category-list">
              <div 
                className={`category-item ${selectedCategory === "all" ? "active" : ""}`}
                style={selectedCategory === "all" ? { borderColor: 'var(--accent-color)', background: 'var(--accent-light)' } : {}}
                onClick={() => setSelectedCategory("all")}
              >
                <div className="category-info">
                  <span className="category-name">All Sections</span>
                  <span className="category-qcount">{faqs.length} questions total</span>
                </div>
                <ChevronRight size={16} />
              </div>

              {categories.map((cat, idx) => {
                const count = faqs.filter(f => f.section_title === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <div 
                    key={idx}
                    className={`category-item ${isSelected ? "active" : ""}`}
                    style={isSelected ? { borderColor: 'var(--accent-color)', background: 'var(--accent-light)' } : {}}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="category-info">
                      <span className="category-name">{cat}</span>
                      <span className="category-qcount">{count} questions</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Search & Accordion FAQs */}
        <div className="card-panel" style={{ flex: 1 }}>
          <h2 className="card-title">
            <BookOpen size={20} className="accent-text" /> FAQ Library
          </h2>

          <div className="search-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search FAQs by question text or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="search-results-list">
            {filteredFaqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <HelpCircle size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                No FAQs matching your query or selected section.
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isExpanded = expandedFaqId === faq.url;
                return (
                  <div key={idx} className="faq-accordion-item">
                    <div 
                      className="faq-accordion-header"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.url)}
                    >
                      <span className="faq-accordion-title">{faq.question}</span>
                      <div className="faq-accordion-meta">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {faq.section_title.split('.')[0] || "Section"}
                        </span>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="faq-accordion-content">
                        {/* Raw rendering clean parsed answers */}
                        <div dangerouslySetInnerHTML={{ __html: faq.answer_html }} />
                        <a 
                          href={faq.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="faq-link-btn"
                        >
                          View on Site <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Floating Chat Widget Toggle */}
      {!isChatOpen && (
        <button className="chat-launcher-btn" onClick={() => setIsChatOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Widget Panel */}
      {isChatOpen && (
        <div className="chat-widget-panel">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <Cpu size={18} />
              </div>
              <div className="chat-title-wrapper">
                <span className="chat-title">Yaksha-mini</span>
                <span className="chat-subtitle">
                  <span className="chat-online-dot" />
                  Grounded in FAQ page
                </span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsChatOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-msg-row ${msg.sender}`}>
                <div className="chat-bubble">
                  {msg.text}
                  
                  {/* Sources display for bot response */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-card">
                      <div className="sources-title">Verified FAQ Links:</div>
                      {msg.sources.map((src, sidx) => (
                        <a 
                          key={sidx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="source-item-link"
                        >
                          <span className="source-name">{src.question}</span>
                          <span className={`score-badge ${getScoreColorClass(src.score)}`}>
                            {Math.round(src.score * 100)}%
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="chat-meta">{msg.timestamp}</span>
              </div>
            ))}
            
            {isBotTyping && (
              <div className="chat-msg-row bot">
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="chat-suggestions">
            {SUGGESTIONS.map((sug, idx) => (
              <button 
                key={idx} 
                className="suggestion-chip"
                onClick={() => handleSendMessage(sug)}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form 
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask about leave, NOC, vibe, etc..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isBotTyping}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={!chatInput.trim() || isBotTyping}
            >
              <Send size={18} />
            </button>
          </form>

          {/* Footnote */}
          <p className="chat-footer-note">
            For specific cases, log in to <a href="https://samagama.in" target="_blank" rel="noreferrer">samagama.in</a> and ask Yaksha.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
