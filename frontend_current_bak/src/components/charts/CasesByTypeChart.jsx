import { useMemo } from 'react';

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#0284c7', '#64748b', '#dc2626'];



const VB_W = 700;
const VB_H = 320;
const PAD = { top: 28, right: 20, bottom: 48, left: 44 };

export default function CasesByTypeChart({ data }) {
  const bars = useMemo(() => {
    const src = Array.isArray(data) && data.length ? data : [];
    return src
      .map((d) => ({
        type: d?.type ?? '—',
        count: Number.isFinite(+d?.count) ? +d.count : 0,
      }))
      .slice(0, 6);
  }, [data]);

  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;

  const slot = plotW / bars.length;
  const barW = Math.min(64, slot * 0.6);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD.top + plotH * t,
    value: Math.round(maxCount * (1 - t)),
  }));

  return (
    <div
      className="glass"
      style={{
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
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
        <span aria-hidden>📊</span> Cases by Type
      </h3>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label="Cases by type bar chart"
      >
        <defs>
          <style>{`
            @keyframes cbtGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
            @keyframes cbtFade { to { opacity: 1; } }
            .cbt-bar { transform-box: fill-box; transform-origin: bottom; animation: cbtGrow 800ms cubic-bezier(0.4,0,0.2,1) both; }
            .cbt-val { opacity: 0; animation: cbtFade 400ms ease forwards; }
          `}</style>
        </defs>

        {/* Grid */}
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

        {/* Bars */}
        {bars.map((b, i) => {
          const h = (plotH * b.count) / maxCount;
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + plotH - h;
          const color = PALETTE[i % PALETTE.length];
          return (
            <g key={i}>
              <rect
                className="cbt-bar"
                x={x}
                y={y}
                width={barW}
                height={Math.max(0.5, h)}
                rx="6"
                fill={color}
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <text
                className="cbt-val"
                x={x + barW / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                fill="var(--text)"
                style={{ animationDelay: `${400 + i * 100}ms` }}
              >
                {b.count}
              </text>
              <text
                x={x + barW / 2}
                y={VB_H - PAD.bottom + 22}
                textAnchor="middle"
                fontSize="12"
                fontFamily="var(--font-body)"
                fill="var(--text-muted)"
              >
                {b.type.length > 10 ? `${b.type.slice(0, 9)}…` : b.type}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
