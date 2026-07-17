import React from 'react';

export default function CaseCard({ case: caseData }) {
  const statusColor = {
    open: '#10b981',
    active: '#6366f1',
    closed: '#94a3b8',
    archived: '#64748b',
  }[caseData.status || 'open'] || '#6366f1';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: '12px',
      padding: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)';
      e.currentTarget.style.borderColor = `${statusColor}60`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}>
        <div>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#f1f5f9',
            marginBottom: '4px',
          }}>
            {caseData.case_title || caseData.fir_number}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
          }}>
            Case #{caseData.id}
          </div>
        </div>
        <div style={{
          padding: '4px 8px',
          borderRadius: '6px',
          background: `${statusColor}20`,
          color: statusColor,
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
        }}>
          {caseData.status?.toUpperCase() || 'OPEN'}
        </div>
      </div>
      <div style={{
        fontSize: '12px',
        color: '#cbd5e1',
        marginBottom: '8px',
        lineHeight: '1.4',
      }}>
        {caseData.description?.substring(0, 60) || 'No description'}...
      </div>
      <div style={{
        fontSize: '11px',
        color: '#64748b',
      }}>
        Updated {new Date(caseData.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
