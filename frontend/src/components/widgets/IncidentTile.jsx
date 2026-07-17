import React from 'react';

export default function IncidentTile({ incident }) {
  const severityColor = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#ec4899',
    low: '#10b981',
  }[incident.severity || 'medium'] || '#6366f1';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${severityColor}30`,
      borderRadius: '12px',
      padding: '12px',
      display: 'flex',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
      e.currentTarget.style.borderColor = `${severityColor}60`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
      e.currentTarget.style.borderColor = `${severityColor}30`;
    }}>
      <div style={{
        width: '4px',
        borderRadius: '2px',
        background: severityColor,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#f1f5f9',
          marginBottom: '4px',
        }}>
          {incident.title || `Incident #${incident.id}`}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#cbd5e1',
          marginBottom: '6px',
        }}>
          {incident.description || 'No description'}
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          fontSize: '11px',
          color: '#94a3b8',
        }}>
          <span>📍 {incident.location || 'Unknown'}</span>
          <span>🕐 {new Date(incident.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '8px',
        background: `${severityColor}20`,
        color: severityColor,
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {incident.severity?.toUpperCase() || 'MEDIUM'}
      </div>
    </div>
  );
}
