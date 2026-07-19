import { useState } from 'react';

const PRIORITY_COLORS = {
  critical: 'var(--error)',
  urgent: 'var(--error)',
  high: 'var(--tertiary)',
  medium: 'var(--warning)',
  normal: 'var(--primary)',
  low: 'var(--secondary)',
};

function priorityColor(p) {
  const key = String(p || 'normal').toLowerCase().trim();
  return PRIORITY_COLORS[key] || 'var(--secondary)';
}

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

export default function NotificationTile({ notification }) {
  const [hover, setHover] = useState(false);
  const data = notification || {};

  const title = data.title || 'Notification';
  const message = data.message || data.body || data.description || '';
  const time = formatTime(data.time || data.timestamp || data.created_at);
  const dot = priorityColor(data.priority || data.severity);

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
        padding: '14px 16px',
        transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 10px 24px rgba(0,0,0,0.3)'
          : '0 2px 6px rgba(0,0,0,0.12)',
        cursor: 'default',
      }}
    >
      {/* Priority dot */}
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: dot,
          marginTop: '6px',
          flexShrink: 0,
          boxShadow: `0 0 0 4px color-mix(in srgb, ${dot} 20%, transparent)`,
        }}
      />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {time && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {time}
            </span>
          )}
        </div>

        {message && (
          <div
            style={{
              marginTop: '5px',
              fontSize: '13px',
              lineHeight: 1.45,
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
