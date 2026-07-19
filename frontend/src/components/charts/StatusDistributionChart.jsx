import { useMemo } from 'react';

const STATUS_COLORS = {
  Open: '#2563eb',
  'In Progress': '#f97316',
  Solved: '#16a34a',
  Closed: '#64748b',
};

const MOCK = [
  { status: 'Open', count: 34 },
  { status: 'In Progress', count: 21 },
  { status: 'Solved', count: 48 },
  { status: 'Closed', count: 17 },
];

const SIZE = 220;
const R_OUTER = 96;
const R_INNER = 58;
const CX = SIZE / 2;
const CY = SIZE / 2;

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// Build a donut segment path between two angles.
function arcPath(startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const oStart = polar(CX, CY, R_OUTER, startAngle);
  const oEnd = polar(CX, CY, R_OUTER, endAngle);
  const iEnd = polar(CX, CY, R_INNER, endAngle);
  const iStart = polar(CX, CY, R_INNER, startAngle);
  return [
    `M ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${oEnd.x.toFixed(2)} ${oEnd.y.toFixed(2)}`,
    `L ${iEnd.x.toFixed(2)} ${iEnd.y.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${iStart.x.toFixed(2)} ${iStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export default function StatusDistributionChart({ data }) {
  const segments = useMemo(() => {
    const src = Array.isArray(data) && data.length ? data : MOCK;
    const clean = src.map((d) => ({
      status: d?.status ?? '—',
      count: Number.isFinite(+d?.count) ? +d.count : 0,
      color: STATUS_COLORS[d?.status] ?? '#0284c7',
    }));
    const total = clean.reduce((s, d) => s + d.count, 0) || 1;
    let angle = 0;
    return {
      total,
      items: clean.map((d) => {
        const sweep = (d.count / total) * 360;
        const seg = { ...d, start: angle, end: angle + sweep, pct: (d.count / total) * 100 };
        angle += sweep;
        return seg;
      }),
    };
  }, [data]);

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
        <span aria-hidden>🎯</span> Status Distribution
      </h3>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flex: 1,
        }}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: 200, maxWidth: '100%', height: 'auto', flexShrink: 0 }}
          role="img"
          aria-label="Case status distribution donut chart"
        >
          <defs>
            <style>{`
              @keyframes sdFade { from { opacity: 0; } to { opacity: 1; } }
              .sd-seg { opacity: 0; animation: sdFade 500ms ease forwards; transition: transform 300ms cubic-bezier(0.4,0,0.2,1); transform-box: fill-box; transform-origin: center; }
              .sd-seg:hover { transform: scale(1.04); }
            `}</style>
          </defs>

          {segments.items.map((s, i) =>
            s.count > 0 ? (
              <path
                key={i}
                className="sd-seg"
                d={arcPath(s.start, s.end)}
                fill={s.color}
                stroke="var(--bg-elevated)"
                strokeWidth="2"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <title>{`${s.status}: ${s.count} (${s.pct.toFixed(1)}%)`}</title>
              </path>
            ) : null
          )}

          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fontSize="30"
            fontWeight="700"
            fontFamily="var(--font-headline)"
            fill="var(--text)"
          >
            {segments.total}
          </text>
          <text
            x={CX}
            y={CY + 18}
            textAnchor="middle"
            fontSize="12"
            fontFamily="var(--font-body)"
            fill="var(--text-muted)"
          >
            Total Cases
          </text>
        </svg>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minWidth: 160,
          }}
        >
          {segments.items.map((s, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text)', flex: 1 }}>{s.status}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {s.count}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 44, textAlign: 'right' }}>
                {s.pct.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
