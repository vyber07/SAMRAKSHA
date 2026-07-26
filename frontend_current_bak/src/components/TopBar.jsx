import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';

// One UI large header: big low-set title, floating pill controls
export default function TopBar({ title = 'Dashboard', onRefresh, headerAction }) {
  const officer = useAuthStore((s) => s.officer);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      padding: '28px 28px 18px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      {/* One UI big title block */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 6 }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {headerAction && headerAction}
        {onRefresh && (
          <button className="oui-pill" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span> Refresh
          </button>
        )}
        {officer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px',
            background: 'var(--surface)',
            backdropFilter: 'blur(var(--blur))',
            WebkitBackdropFilter: 'blur(var(--blur))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--success)', animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{officer.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tertiary)', textTransform: 'uppercase' }}>{officer.role}</span>
          </div>
        )}
      </div>
    </header>
  );
}
