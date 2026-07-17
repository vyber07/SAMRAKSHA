import React from 'react';

export default function StatsCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${color}20`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <span style={{
        fontSize: '12px',
        color: '#cbd5e1',
        fontWeight: '500',
      }}>
        {label}
      </span>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: color,
      }}>
        {value || 0}
      </div>
      <div style={{
        height: '4px',
        borderRadius: '2px',
        background: `${color}20`,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: color,
          width: '60%',
          borderRadius: '2px',
        }} />
      </div>
    </div>
  );
}
