import { useState, useCallback, useEffect } from 'react';
import { faqData, urgencyOrder } from '../data/faqData';

const STORAGE_KEY = 'samagama_faq_votes';
const PROGRESS_KEY = 'samagama_faq_progress';
const CLICKS_KEY = 'samagama_faq_clicks';

function loadStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useFAQState() {
  const [votes, setVotes] = useState(() => loadStorage(STORAGE_KEY, {}));
  const [readSections, setReadSections] = useState(() => loadStorage(PROGRESS_KEY, []));
  const [extraClicks, setExtraClicks] = useState(() => loadStorage(CLICKS_KEY, {}));

  useEffect(() => { saveStorage(STORAGE_KEY, votes); }, [votes]);
  useEffect(() => { saveStorage(PROGRESS_KEY, readSections); }, [readSections]);
  useEffect(() => { saveStorage(CLICKS_KEY, extraClicks); }, [extraClicks]);

  const vote = useCallback((questionId, type) => {
    setVotes(prev => {
      const existing = prev[questionId];
      if (existing === type) return prev; // toggle off not allowed, just ignore duplicate
      return { ...prev, [questionId]: type };
    });
  }, []);

  const markSectionRead = useCallback((sectionId) => {
    setReadSections(prev => prev.includes(sectionId) ? prev : [...prev, sectionId]);
  }, []);

  const trackClick = useCallback((questionId) => {
    setExtraClicks(prev => ({ ...prev, [questionId]: (prev[questionId] || 0) + 1 }));
  }, []);

  const getQuestionVote = useCallback((questionId) => votes[questionId] || null, [votes]);

  // Build enriched data with vote adjustments
  const enrichedData = faqData.map(cat => ({
    ...cat,
    questions: cat.questions
      .map(q => ({
        ...q,
        clicks: q.clicks + (extraClicks[q.id] || 0),
        thumbsUp: q.thumbsUp + (votes[q.id] === 'up' ? 1 : 0),
        thumbsDown: q.thumbsDown + (votes[q.id] === 'down' ? 1 : 0),
        urgency: votes[q.id] === 'down'
          ? escalateUrgency(q.urgency)
          : q.urgency,
        userVote: votes[q.id] || null,
      }))
      .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]),
  }));

  const totalSections = faqData.length;
  const readCount = readSections.length;

  return {
    enrichedData,
    vote,
    markSectionRead,
    trackClick,
    getQuestionVote,
    readSections,
    readCount,
    totalSections,
  };
}

function escalateUrgency(current) {
  const levels = ['low', 'medium', 'high', 'critical'];
  const idx = levels.indexOf(current);
  return levels[Math.min(idx + 1, levels.length - 1)];
}
