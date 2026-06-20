import React, { useState } from 'react';

const categoryData = [
  { id: 'noc', label: 'NOC', questions: 5, urgency: 'critical', x: 28, y: 35, size: 80 },
  { id: 'internship', label: 'Internship', questions: 4, urgency: 'high', x: 68, y: 25, size: 68 },
  { id: 'dates', label: 'Dates', questions: 3, urgency: 'high', x: 50, y: 65, size: 60 },
  { id: 'certificate', label: 'Certificate', questions: 3, urgency: 'medium', x: 20, y: 72, size: 55 },
  { id: 'vibe', label: 'ViBe', questions: 3, urgency: 'low', x: 78, y: 65, size: 50 },
  { id: 'rosetta', label: 'Rosetta', questions: 3, urgency: 'low', x: 82, y: 40, size: 44 },
];

const urgencyBubbleColors = {
  critical: { fill: 'rgba(239,68,68,0.25)', stroke: 'rgba(239,68,68,0.6)', text: '#b91c1c' },
  high: { fill: 'rgba(249,115,22,0.2)', stroke: 'rgba(249,115,22,0.5)', text: '#c2410c' },
  medium: { fill: 'rgba(234,179,8,0.15)', stroke: 'rgba(234,179,8,0.4)', text: '#a16207' },
  low: { fill: 'rgba(34,197,94,0.12)', stroke: 'rgba(34,197,94,0.35)', text: '#15803d' },
};

export default function BubbleChart({ onCategoryClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Doubt Cluster Map</h3>
        <span className="text-xs text-slate-500">bubble size = volume</span>
      </div>

      <div className="relative w-full" style={{ paddingBottom: '62%' }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 250"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines */}
          {[50, 100, 150, 200].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(30,41,59,0.08)" strokeWidth="1" />
          ))}
          {[100, 200, 300].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="250" stroke="rgba(30,41,59,0.08)" strokeWidth="1" />
          ))}

          {/* Bubbles */}
          {categoryData.map(cat => {
            const cx = (cat.x / 100) * 400;
            const cy = (cat.y / 100) * 250;
            const r = cat.size * 0.38;
            const colors = urgencyBubbleColors[cat.urgency];
            const isHov = hovered === cat.id;

            return (
              <g
                key={cat.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onCategoryClick(cat.id)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHov ? r * 1.08 : r}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHov ? 2 : 1.5}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={colors.text}
                  fontFamily="Inter, sans-serif"
                >
                  {cat.label}
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(30,41,59,0.55)"
                  fontFamily="Inter, sans-serif"
                >
                  {cat.questions} Q
                </text>

                {/* Pulse ring for critical */}
                {cat.urgency === 'critical' && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 6}
                    fill="none"
                    stroke="rgba(239,68,68,0.3)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {Object.entries(urgencyBubbleColors).map(([level, colors]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: colors.fill, borderColor: colors.stroke }} />
            <span className="text-xs text-slate-500 capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
