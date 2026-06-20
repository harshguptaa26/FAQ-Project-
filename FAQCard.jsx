import React, { useState } from 'react';
import { ChevronDown, ThumbsUp, ThumbsDown, Tag } from 'lucide-react';
import { urgencyColors, getRelatedQuestions } from '../data/faqData';

const urgencyDotClass = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-yellow-400',
  low:      'bg-green-500',
};

const urgencyBadge = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low:      'bg-green-100 text-green-700 border border-green-200',
};

export default function FAQCard({ question, onVote, onRelatedClick, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const related = getRelatedQuestions ? getRelatedQuestions(question.id) : [];

  const handleToggle = () => {
    if (!expanded) onOpen?.(question.id);
    setExpanded(prev => !prev);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md font-sans">
      <div
        className="px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-[7px] w-2 h-2 rounded-full flex-shrink-0 ${urgencyDotClass[question.urgency] || 'bg-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 leading-snug">{question.question}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${urgencyBadge[question.urgency] || urgencyBadge.low}`}>
                  {question.urgency}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] text-slate-500 font-normal">{question.clicks?.toLocaleString()} views</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-green-600 font-normal">👍 {question.thumbsUp}</span>
              <span className="text-[11px] text-red-500 font-normal">👎 {question.thumbsDown}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="ml-5 pt-3">
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{question.answer}</p>

            {question.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {question.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-normal">
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-slate-500 font-medium">Was this helpful?</span>
              <button
                onClick={() => onVote(question.id, 'up')}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                  question.userVote === 'up'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'text-slate-600 border-slate-300 hover:border-green-400 hover:text-green-700 bg-white'
                }`}
              >
                <ThumbsUp size={11} />
                Yes {question.userVote === 'up' ? '✓' : ''}
              </button>
              <button
                onClick={() => onVote(question.id, 'down')}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                  question.userVote === 'down'
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'text-slate-600 border-slate-300 hover:border-red-400 hover:text-red-700 bg-white'
                }`}
              >
                <ThumbsDown size={11} />
                No {question.userVote === 'down' ? '(flagged)' : ''}
              </button>
            </div>

            {related.length > 0 && (
              <div className="border-t border-slate-200 pt-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">You may also need:</p>
                <div className="space-y-1.5">
                  {related.map(r => (
                    <button
                      key={r.id}
                      onClick={() => onRelatedClick(r)}
                      className="w-full text-left flex items-center gap-2 text-xs text-slate-600 hover:text-amber-700 transition-colors group"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDotClass[r.urgency] || 'bg-slate-400'}`} />
                      <span className="truncate group-hover:underline underline-offset-2 font-normal">{r.question}</span>
                      <span className="text-slate-400 flex-shrink-0 text-[11px] font-normal">{r.categoryLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
