import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

// Shared page layout: Sidebar + TopBar + scrollable content
export default function PageShell({ title, onRefresh, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} onRefresh={onRefresh} />
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', text = 'No data available' }) {
  return (
    <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const color =
    s.includes('solved') || s.includes('closed') ? 'var(--success)' :
    s.includes('progress') || s.includes('investigat') ? 'var(--info)' :
    s.includes('pending') ? 'var(--warning)' :
    'var(--tertiary)';
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 'var(--radius-sm)',
      background: `color-mix(in srgb, ${color} 15%, transparent)`,
      color, fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>{status || 'registered'}</span>
  );
}
