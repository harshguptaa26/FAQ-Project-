import React, { useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, ThumbsDown, Pin, CheckCircle } from 'lucide-react';
import { heatmapData, faqData, trendingData } from '../data/faqData';

const confusionColor = (score) => {
  if (score >= 80) return { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' };
  if (score >= 60) return { bar: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' };
  if (score >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
  return { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' };
};

const unresolvedSuggestions = [
  { type: 'rewrite', question: 'NOC Dates - answer received 28 thumbs-downs this week', action: 'Rewrite answer' },
  { type: 'create', query: '"deadline extension" — 41 searches, no matching FAQ', action: 'Create new FAQ' },
  { type: 'rewrite', question: 'Internship allocation — unclear language flagged', action: 'Rewrite answer' },
];

export default function AdminPage({ enrichedData }) {
  const [pinnedAlerts, setPinnedAlerts] = useState([]);
  const [pinInput, setPinInput] = useState('');
  const [pinNote, setPinNote] = useState('');

  // Aggregate stats
  const allQuestions = enrichedData.flatMap(c => c.questions);
  const totalVotes = allQuestions.reduce((a, q) => a + q.thumbsUp + q.thumbsDown, 0);
  const totalNegative = allQuestions.reduce((a, q) => a + q.thumbsDown, 0);
  const totalViews = allQuestions.reduce((a, q) => a + q.clicks, 0);
  const criticalCount = allQuestions.filter(q => q.urgency === 'critical').length;

  const addPinAlert = () => {
    if (!pinInput.trim()) return;
    setPinnedAlerts(prev => [...prev, { id: Date.now(), message: pinInput, note: pinNote }]);
    setPinInput('');
    setPinNote('');
  };

  return (
    <div className="min-h-screen pt-14 px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h2>
        <p className="text-sm text-slate-500">Confusion analytics, urgency overrides, and self-healing suggestions</p>
      </div>

      {/* Pinned alerts */}
      {pinnedAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {pinnedAlerts.map(alert => (
            <div key={alert.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <Pin size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-300">📌 Admin Alert: {alert.message}</p>
                {alert.note && <p className="text-xs text-yellow-400/70 mt-0.5">{alert.note}</p>}
              </div>
              <button
                onClick={() => setPinnedAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="text-yellow-600 hover:text-yellow-400 text-xs"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Heatmap + Self-healing */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: <BarChart3 size={14} />, color: 'text-brand-400' },
              { label: 'Critical Items', value: criticalCount, icon: <AlertTriangle size={14} />, color: 'text-red-400' },
              { label: 'Total Votes', value: totalVotes, icon: <TrendingUp size={14} />, color: 'text-green-400' },
              { label: 'Thumbs Down', value: totalNegative, icon: <ThumbsDown size={14} />, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="glass-card p-3">
                <div className={`${s.color} mb-1.5`}>{s.icon}</div>
                <p className="text-xl font-display font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Confusion heatmap */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-900">Confusion Heatmap</h3>
              <span className="ml-auto text-xs text-slate-500">higher = more confused students</span>
            </div>

            <div className="space-y-3">
              {heatmapData.map(row => {
                const c = confusionColor(row.score);
                return (
                  <div key={row.section}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 w-24">{row.section}</span>
                        {row.unresolved > 0 && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                            {row.unresolved} unresolved
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${c.text}`}>{row.score}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${row.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Self-healing suggestions */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔧</span>
              <h3 className="text-sm font-semibold text-slate-900">Self-Healing Suggestions</h3>
            </div>
            <div className="space-y-3">
              {unresolvedSuggestions.map((s, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {s.type === 'create' ? `🔍 ${s.query}` : `👎 ${s.question}`}
                    </p>
                    <p className="text-xs text-brand-400 mt-1 font-medium">
                      → Suggested action: {s.action}
                    </p>
                  </div>
                  <button className="text-xs text-slate-900 font-medium bg-brand-600/20 border border-brand-500/40 px-2.5 py-1 rounded-lg hover:bg-brand-600/30 transition-colors flex-shrink-0">
                    {s.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Urgency override + Trending */}
        <div className="space-y-4">
          {/* Urgency override */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Pin size={15} className="text-yellow-400" />
              <h3 className="text-sm font-semibold text-slate-900">Admin Urgency Override</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">Pin a critical message to the top of the FAQ portal</p>
            <input
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Alert message (e.g. 'NOC deadline extended')"
              className="w-full bg-white/60 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500/50 transition-colors mb-2"
            />
            <input
              value={pinNote}
              onChange={e => setPinNote(e.target.value)}
              placeholder="Optional note for students"
              className="w-full bg-white/60 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500/50 transition-colors mb-3"
            />
            <button
              onClick={addPinAlert}
              disabled={!pinInput.trim()}
              className="w-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs py-2 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              📌 Pin Alert to Portal
            </button>
          </div>

          {/* Trending table */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-900">Top Searches</h3>
            </div>
            <div className="space-y-2">
              {trendingData.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-4">{item.rank}</span>
                    <span className="text-xs text-slate-700 truncate">{item.question}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-500">{item.searches}</span>
                    <span className="text-xs text-green-500">{item.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panic mode detector */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-red-400" />
              <h3 className="text-sm font-semibold text-slate-900">Panic Mode</h3>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-300 font-semibold mb-1">🚨 NOC Panic Detected</p>
              <p className="text-xs text-red-400/70">NOC searches spiked 10× in 24 hours</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Yesterday: 20</span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-xs text-red-400 font-bold">Today: 250</span>
              </div>
            </div>
            <div className="mt-3 bg-green-500/8 border border-green-500/15 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle size={13} className="text-green-500" />
              <p className="text-xs text-green-400">NOC FAQs auto-promoted to top</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
