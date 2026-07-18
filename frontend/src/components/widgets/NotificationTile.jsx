import React from 'react';

export default function NotificationTile({ title, desc, severity = 'medium' }) {
  const colors = {
    high: { bg: '#dc2626', icon: '🔴' },
    medium: { bg: '#f97316', icon: '🟠' },
    low: { bg: '#16a34a', icon: '🟢' },
  };

  const color = colors[severity] || colors.medium;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${color.bg}30`,
      borderRadius: '12px',
      padding: '12px',
      display: 'flex',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
      e.currentTarget.style.boxShadow = `0 4px 12px ${color.bg}20`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <span style={{ fontSize: '16px' }}>{color.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#f1f5f9',
          marginBottom: '2px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#cbd5e1',
        }}>
          {desc}
        </div>
      </div>
      <button
        style={{
          padding: '4px 8px',
          borderRadius: '6px',
          border: `1px solid ${color.bg}40`,
          background: 'transparent',
          color: color.bg,
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600',
          whiteSpace: 'nowrap',
        }}
      >
        View
      </button>
    </div>
  );
}
