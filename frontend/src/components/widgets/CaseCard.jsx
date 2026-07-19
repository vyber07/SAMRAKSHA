import { useState } from 'react';

const STATUS_COLORS = {
  open: 'var(--primary)',
  active: 'var(--primary)',
  investigating: 'var(--tertiary)',
  'under investigation': 'var(--tertiary)',
  pending: 'var(--warning)',
  closed: 'var(--success)',
  resolved: 'var(--success)',
  disposed: 'var(--success)',
  rejected: 'var(--error)',
  cancelled: 'var(--error)',
};

function statusColor(status) {
  const key = String(status || '').toLowerCase().trim();
  return STATUS_COLORS[key] || 'var(--secondary)';
}

function formatDate(t) {
  if (!t) return '';
  try {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return String(t);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(t);
  }
}

export default function CaseCard({ case: caseData }) {
  const [hover, setHover] = useState(false);
  const data = caseData || {};

  const firNo = data.fir_no || data.case_id || '—';
  const crimeType = data.crime_type || 'Unknown';
  const victim = data.victim_name || 'Unknown';
  const status = data.case_status || 'Unknown';
  const created = formatDate(data.created_at || data.crime_date);
  const accent = statusColor(status);

  return (
    <div
      className="glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '18px',
        transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 12px 30px rgba(0,0,0,0.34)'
          : '0 2px 8px rgba(0,0,0,0.14)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--text)',
          }}
        >
          {firNo}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: accent,
            background: 'color-mix(in srgb, ' + accent + ' 16%, transparent)',
            border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
            borderRadius: '999px',
            padding: '4px 10px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {crimeType}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: created ? '8px' : 0,
        }}
      >
        <span style={{ flexShrink: 0 }}>👤</span>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {victim}
        </span>
      </div>

      {created && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          🗓️ {created}
        </div>
      )}
    </div>
  );
}
