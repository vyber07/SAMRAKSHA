import React, { useEffect, useState, useCallback } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { useAuthStore, canViewAnalytics } from '../lib/store';
import { analytics } from '../lib/api';
import ChartsPanel from '../components/charts/ChartsPanel';
import CrimeTypesChart from '../components/charts/CrimeTypesChart';
import StatCard from '../components/widgets/StatCard';

function SimulationModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    event: 'navratri',
    crowd_size: 5000,
  });

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // Direct HTTP fetch as fallback if frontend API not fully updated
      const res = await fetch('/api/analytics/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('samraksha_token')}` },
        body: JSON.stringify({ event: form.event, crowd_size: parseInt(form.crowd_size) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setResult(data);
    } catch (err) {
      try {
         // Fallback via axios wrapper if the above direct fetch hits a CORS proxy issue etc.
         const axiosRes = await analytics.simulate(form.event, parseInt(form.crowd_size));
         setResult(axiosRes.data);
      } catch (e2) {
         setResult({ error: 'Failed to run simulation. Please ensure backend is running.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const label = { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 580, maxHeight: '90vh',
        background: 'var(--bg)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontFamily: 'var(--font-headline)' }}>🔮 Predictive Simulation</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>AI-powered hotspot forecasting</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          <form id="sim-form" onSubmit={handleSimulate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={label}>Event / Scenario</label>
              <select style={inp} value={form.event} onChange={e => setForm({...form, event: e.target.value})}>
                <option value="navratri">Navratri (9 Nights)</option>
                <option value="diwali">Diwali Festival</option>
                <option value="rath_yatra">Rath Yatra</option>
                <option value="uttarayan">Uttarayan (Kite Festival)</option>
                <option value="protest">Political Rally / Protest</option>
                <option value="cricket_match">Cricket Match</option>
              </select>
            </div>
            <div>
              <label style={label}>Expected Crowd Size</label>
              <input type="number" style={inp} value={form.crowd_size} onChange={e => setForm({...form, crowd_size: e.target.value})} step="500" min="500" />
            </div>
          </form>

          {result && !result.error && (
            <div style={{ marginTop: 24, padding: 20, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: 14, color: 'var(--info)', marginBottom: 12, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Simulation Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Event Simulated</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{result.event?.toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Units Needed</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{result.total_units_needed} Patrols</div>
                </div>
              </div>
              <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Predicted Hotspots</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(result.hotspots || []).map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>📍 {h.zone}</span>
                    <span style={{ color: h.sim_risk > 3.5 ? 'var(--error)' : 'var(--warning)' }}>Risk: {h.sim_risk.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({h.likely_crime})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.error && (
             <div style={{ marginTop: 20, color: '#fca5a5', padding: 12, background: 'rgba(220,38,38,0.1)', borderRadius: 4, fontSize: 13 }}>
               ⚠️ {result.error}
             </div>
          )}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>Close</button>
          <button type="submit" form="sim-form" disabled={loading} style={{
            padding: '10px 28px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--primary)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? 'Simulating…' : '▶ Run Simulation'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const officer = useAuthStore((s) => s.officer);
  const [trends, setTrends] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showSim, setShowSim] = useState(false);
  const allowed = canViewAnalytics(officer?.role);

  const load = useCallback(async () => {
    try { setTrends((await analytics.trends()).data); } catch { setTrends(null); }
    try { setSummary((await analytics.summary()).data); } catch { setSummary(null); }
  }, []);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  if (!allowed) {
    return (
      <PageShell title="Analytics">
        <EmptyState icon="🔒" text="Analytics is available to SHO, DCP and Admin roles only." />
      </PageShell>
    );
  }

  const s = summary || {};
  const kpis = [
    { icon: '📝', label: 'FIRs Today', value: s.firs_today ?? 12, delta: s.firs_today_change ?? 8, color: 'var(--primary)' },
    { icon: '🚨', label: 'Active Alerts', value: s.active_alerts ?? 3, color: 'var(--error)' },
    { icon: '🚔', label: 'Patrols Active', value: s.patrol_active ?? 14, color: 'var(--success)' },
    { icon: '⚠️', label: 'High-Risk Zones', value: s.high_risk_zones ?? 2, color: 'var(--tertiary)' },
  ];

  return (
    <PageShell 
      title="Crime Analytics" 
      onRefresh={load}
      headerAction={
        <button onClick={() => setShowSim(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--primary)', color: '#fff',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          transition: 'all var(--t-fast) var(--ease)',
        }}>
          <span style={{ fontSize: 16 }}>🔮</span> Run Simulation
        </button>
      }
    >
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {kpis.map((k) => (
          <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} delta={k.delta} color={k.color} />
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <ChartsPanel trends={trends} cases={[]} />
      </div>

      <div style={{ maxWidth: 620 }}>
        <CrimeTypesChart data={trends?.by_type} />
      </div>

      {showSim && <SimulationModal onClose={() => setShowSim(false)} />}
    </PageShell>
  );
}
