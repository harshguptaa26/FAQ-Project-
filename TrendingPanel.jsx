import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { trendingData } from '../data/faqData';

const categoryColors = {
  NOC:         'text-red-600',
  Internship:  'text-amber-600',
  Dates:       'text-blue-600',
  Certificate: 'text-yellow-700',
  ViBe:        'text-purple-600',
  Rosetta:     'text-teal-600',
};

export default function TrendingPanel({ onQuestionClick }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-slate-700" />
        <span className="text-sm font-bold text-slate-900">Trending this week</span>
        <span className="ml-auto text-[11px] text-slate-400">7-day window</span>
      </div>

      <div className="space-y-1">
        {trendingData.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onQuestionClick(item)}
            className="w-full text-left flex items-start gap-3 px-1 py-2 rounded-lg hover:bg-slate-50 group transition-colors"
          >
            <span className="text-sm font-bold text-slate-300 w-4 flex-shrink-0 mt-px">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-800 font-medium leading-snug line-clamp-2">{item.question}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[11px] font-semibold ${categoryColors[item.category] || 'text-slate-600'}`}>
                  {item.category}
                </span>
                <span className="text-[11px] text-green-600 font-semibold">{item.delta}</span>
              </div>
            </div>
            <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-600 flex-shrink-0 mt-1 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
