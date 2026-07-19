import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';

export default function TopBar({ title = 'Dashboard', onRefresh }) {
  const officer = useAuthStore((s) => s.officer);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 28px',
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 15,
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {time.toLocaleTimeString('en-IN')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              padding: '9px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >⟳ Refresh</button>
        )}
        {officer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 14px',
            background: 'var(--primary-container)',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--success)',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{officer.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tertiary)', textTransform: 'uppercase' }}>{officer.role}</span>
          </div>
        )}
      </div>
    </header>
  );
}
