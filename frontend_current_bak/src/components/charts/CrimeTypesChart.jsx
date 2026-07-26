import { useMemo } from 'react';

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#0284c7', '#64748b', '#dc2626'];

export default function CrimeTypesChart({ data = [] }) {
  const rows = useMemo(() => {
    const src = Array.isArray(data) && data.length ? data : [];
    const clean = src
      .map((d) => ({
        type: d?.type ?? '—',
        count: Number.isFinite(+d?.count) ? +d.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const total = clean.reduce((s, d) => s + d.count, 0) || 1;
    const max = Math.max(1, ...clean.map((d) => d.count));
    return clean.map((d, i) => ({
      ...d,
      pct: (d.count / total) * 100,
      widthPct: (d.count / max) * 100,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [data]);

  return (
    <div
      className="glass"
      style={{
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
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
        <span aria-hidden>📊</span> Crime Types
      </h3>

      <style>{`
        @keyframes ctcGrow { from { width: 0; } }
        .ctc-fill { animation: ctcGrow 900ms cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.type}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {r.count}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.pct.toFixed(1)}%
                </span>
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                height: 10,
                borderRadius: 999,
                background: 'var(--surface)',
                overflow: 'hidden',
              }}
            >
              <div
                className="ctc-fill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${r.widthPct}%`,
                  background: r.color,
                  borderRadius: 999,
                  animationDelay: `${i * 90}ms`,
                  transition: 'filter 300ms cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
