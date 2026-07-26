import { useState } from 'react';
import { normalizeSeverity } from '../../utils/severity';

const SEVERITY_COLORS = {
  critical: 'var(--error)',
  high: 'var(--tertiary)',
  medium: 'var(--warning)',
  low: 'var(--secondary)',
};

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '⚪',
};

function formatTime(t) {
  if (!t) return '';
  try {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return String(t);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(t);
  }
}

export default function IncidentTile({ incident }) {
  const [hover, setHover] = useState(false);
  const data = incident || {};

  const severity = normalizeSeverity(data.severity);
  const accent = SEVERITY_COLORS[severity] || 'var(--secondary)';
  const icon = SEVERITY_ICONS[severity] || '⚪';

  const type = data.type || data.incident_type || data.crime_type || 'Incident';
  const location =
    data.location || data.address || data.ward || data.ps_name || 'Unknown location';
  const time = formatTime(data.time || data.timestamp || data.created_at || data.crime_date);

  return (
    <div
      className="glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        borderRadius: 'var(--radius-md)',
        borderLeft: `4px solid ${accent}`,
        padding: '14px 16px',
        transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 10px 26px rgba(0,0,0,0.32)'
          : '0 2px 6px rgba(0,0,0,0.12)',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {type}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: accent,
              flexShrink: 0,
            }}
          >
            {severity}
          </span>
        </div>

        <div
          style={{
            marginTop: '5px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</span>
        </div>

        {time && (
          <div
            style={{
              marginTop: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            🕐 {time}
          </div>
        )}
      </div>
    </div>
  );
}
