import React, { useState } from 'react';
import PageShell from './PageShell';
import MapComponent from '../components/MapComponent';

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const LEGEND = [
  { label: 'Critical', color: '#dc2626' },
  { label: 'High', color: '#f97316' },
  { label: 'Medium', color: '#ea580c' },
  { label: 'Low', color: '#64748b' },
];

export default function MapPage() {
  const [severity, setSeverity] = useState('All');

  return (
    <PageShell title="Crime Map — Ahmedabad">
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, height: 'calc(100vh - 140px)' }}>
        {/* Filter sidebar */}
        <div className="glass" style={{ padding: 20, alignSelf: 'start' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>🗺️ Map Filters</h3>

          <div className="label" style={{ marginBottom: 10 }}>Severity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
            {SEVERITIES.map((s) => (
              <button key={s} onClick={() => setSeverity(s)} style={{
                padding: '9px 14px', textAlign: 'left',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${severity === s ? 'var(--primary)' : 'var(--border)'}`,
                background: severity === s ? 'var(--primary-container)' : 'transparent',
                color: severity === s ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all var(--t-fast) var(--ease)',
              }}>{s}</button>
            ))}
          </div>

          <div className="label" style={{ marginBottom: 10 }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEGEND.map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <MapComponent height="100%" filterSeverity={severity} />
      </div>
    </PageShell>
  );
}
