import { useState } from 'react';

const COLOR_MAP = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  tertiary: 'var(--tertiary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
};

function resolveColor(color) {
  if (!color) return 'var(--primary)';
  return COLOR_MAP[color] || color;
}

export default function StatCard({ icon, label, value, delta, color = 'primary' }) {
  const [hover, setHover] = useState(false);
  const accent = resolveColor(color);

  // delta may be a number or string like "+12%" or "-3"
  let deltaNum = null;
  if (delta !== undefined && delta !== null && delta !== '') {
    const parsed = parseFloat(String(delta).replace(/[^0-9.-]/g, ''));
    deltaNum = Number.isNaN(parsed) ? null : parsed;
  }
  const isUp = deltaNum !== null ? deltaNum >= 0 : null;
  const deltaColor = isUp ? 'var(--success)' : 'var(--error)';

  return (
    <div
      className="glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        minWidth: 0,
        transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 12px 32px rgba(0,0,0,0.35)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'default',
      }}
    >
      {/* Top colored accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: accent,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
        {icon != null && (
          <span
            style={{
              fontSize: '22px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, ' + accent + ' 16%, transparent)',
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '34px',
          fontWeight: 700,
          lineHeight: 1.05,
          color: 'var(--text)',
        }}
      >
        {value != null ? value : '—'}
      </div>

      {deltaNum !== null && (
        <div
          style={{
            marginTop: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            color: deltaColor,
          }}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>{isUp ? '▲' : '▼'}</span>
          <span>{String(delta)}</span>
        </div>
      )}
    </div>
  );
}
