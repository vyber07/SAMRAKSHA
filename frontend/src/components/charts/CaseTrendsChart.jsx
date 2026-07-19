import { useMemo } from 'react';

const MOCK = [
  { date: 'Mon', count: 12 },
  { date: 'Tue', count: 19 },
  { date: 'Wed', count: 8 },
  { date: 'Thu', count: 22 },
  { date: 'Fri', count: 16 },
  { date: 'Sat', count: 27 },
  { date: 'Sun', count: 14 },
];

// Responsive line + area chart drawn in a fixed viewBox coordinate space.
const VB_W = 700;
const VB_H = 300;
const PAD = { top: 24, right: 24, bottom: 40, left: 44 };

function shortLabel(d) {
  if (!d) return '';
  // Accept "Mon", ISO dates, or arbitrary strings — trim to something compact.
  const s = String(d);
  if (s.length <= 3) return s;
  // ISO date like 2026-07-18 -> 07/18
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[2]}/${iso[3]}`;
  return s.slice(0, 3);
}

export default function CaseTrendsChart({ data }) {
  const points = useMemo(() => {
    const src = Array.isArray(data) && data.length ? data.slice(0, 7) : MOCK;
    // Normalize to exactly what we render; guard counts.
    const clean = src.map((d) => ({
      date: d?.date ?? '',
      count: Number.isFinite(+d?.count) ? +d.count : 0,
    }));
    while (clean.length < 7) clean.push({ date: '', count: 0 });
    return clean.slice(0, 7);
  }, [data]);

  const maxCount = Math.max(1, ...points.map((p) => p.count));
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;

  const coords = points.map((p, i) => {
    const x = PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
    const y = PAD.top + plotH - (plotH * p.count) / maxCount;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `M ${coords[0].x.toFixed(1)} ${(PAD.top + plotH).toFixed(1)} ` +
    coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') +
    ` L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`;

  // Horizontal grid lines (4 divisions).
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const y = PAD.top + plotH * t;
    const value = Math.round(maxCount * (1 - t));
    return { y, value };
  });

  return (
    <div
      className="glass"
      style={{
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-headline)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span aria-hidden>📈</span> Case Trends
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-muted)',
          }}
        >
          Last 7 days
        </span>
      </h3>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label="Case trends line chart"
      >
        <defs>
          <linearGradient id="caseTrendsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <style>{`
            @keyframes caseTrendsDraw { to { stroke-dashoffset: 0; } }
            @keyframes caseTrendsFade { to { opacity: 1; } }
            .ct-line {
              stroke-dasharray: 2000;
              stroke-dashoffset: 2000;
              animation: caseTrendsDraw 1400ms cubic-bezier(0.4,0,0.2,1) forwards;
            }
            .ct-area { opacity: 0; animation: caseTrendsFade 900ms 600ms ease forwards; }
            .ct-dot { opacity: 0; animation: caseTrendsFade 400ms ease forwards; }
          `}</style>
        </defs>

        {/* Grid lines + y labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={g.y}
              x2={VB_W - PAD.right}
              y2={g.y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <text
              x={PAD.left - 10}
              y={g.y + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {g.value}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path className="ct-area" d={areaPath} fill="url(#caseTrendsArea)" />

        {/* Line */}
        <path
          className="ct-line"
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + x labels */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle
              className="ct-dot"
              cx={c.x}
              cy={c.y}
              r="4.5"
              fill="var(--bg-elevated)"
              stroke="var(--primary)"
              strokeWidth="2.5"
              style={{ animationDelay: `${900 + i * 90}ms` }}
            />
            <text
              x={c.x}
              y={VB_H - PAD.bottom + 22}
              textAnchor="middle"
              fontSize="12"
              fontFamily="var(--font-body)"
              fill="var(--text-muted)"
            >
              {shortLabel(c.date)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
