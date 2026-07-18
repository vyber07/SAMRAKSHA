import React, { useState } from 'react';
import { useAuthStore } from '../lib/store';

export default function TopBar({ onRefresh }) {
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0',
          background: 'linear-gradient(135deg, #2563eb, #64748b)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Crime Monitoring Dashboard
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#cbd5e1',
          margin: '4px 0 0 0',
        }}>
          Real-time incident and case management
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#cbd5e1',
            fontSize: '14px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            opacity: isRefreshing ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) e.target.style.background = 'rgba(37, 99, 235, 0.2)';
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) e.target.style.background = 'rgba(99, 102, 241, 0.1)';
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          }}>
            🔄
          </span>
          Refresh
        </button>

        <div style={{
          width: '1px',
          height: '24px',
          background: 'rgba(148, 163, 184, 0.2)',
        }} />

        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#16a34a',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
            {user?.name || 'Admin'} • Online
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
