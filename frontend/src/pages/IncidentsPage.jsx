import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell, { EmptyState } from './PageShell';
import IncidentTile from '../components/widgets/IncidentTile';
import { hotspot } from '../lib/api';

const MOCK_INCIDENTS = [
  { type: 'Theft', location: 'Ellisbridge', severity: 'high', time: new Date().toISOString() },
  { type: 'Assault', location: 'Navrangpura', severity: 'critical', time: new Date(Date.now() - 36e5).toISOString() },
  { type: 'Vandalism', location: 'Maninagar', severity: 'medium', time: new Date(Date.now() - 72e5).toISOString() },
  { type: 'Fraud', location: 'Satellite', severity: 'low', time: new Date(Date.now() - 12e6).toISOString() },
  { type: 'Robbery', location: 'Vastrapur', severity: 'high', time: new Date(Date.now() - 15e6).toISOString() },
  { type: 'Cybercrime', location: 'Bodakdev', severity: 'medium', time: new Date(Date.now() - 20e6).toISOString() },
];

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

function ReportIncidentModal({ onClose, onReported }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'Theft',
    location: '',
    severity: 'Medium',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mocked API call for incident creation
      setTimeout(() => {
        onReported({
          type: form.type,
          location: form.location,
          severity: form.severity.toLowerCase(),
          time: new Date().toISOString(),
          description: form.description
        });
        setLoading(false);
        onClose();
      }, 600);
    } catch (err) {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const label = { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'block' };
  const field = { display: 'flex', flexDirection: 'column', gap: 4 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'var(--bg)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontFamily: 'var(--font-headline)' }}>🚨 Report Incident</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        
        <form id="incident-form" onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={field}>
            <label style={label}>Incident Type *</label>
            <select required style={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>Theft</option>
              <option>Assault</option>
              <option>Vandalism</option>
              <option>Fraud</option>
              <option>Robbery</option>
              <option>Cybercrime</option>
              <option>Other</option>
            </select>
          </div>
          <div style={field}>
            <label style={label}>Location / Area *</label>
            <input required style={inp} value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Navrangpura Cross Road" />
          </div>
          <div style={field}>
            <label style={label}>Severity *</label>
            <select style={inp} value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div style={field}>
            <label style={label}>Description (Optional)</label>
            <textarea style={{...inp, resize: 'vertical', minHeight: 80}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief details about the incident..." />
          </div>
        </form>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>Cancel</button>
          <button type="submit" form="incident-form" disabled={loading} style={{
            padding: '10px 28px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--error)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? 'Reporting…' : '🚨 Submit Report'}</button>
        </div>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const [items, setItems] = useState([]);
  const [severity, setSeverity] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();

  const load = useCallback(async () => {
    try {
      const res = await hotspot.incidents();
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(data.length ? data : MOCK_INCIDENTS);
    } catch {
      setItems(MOCK_INCIDENTS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = items.filter((inc) => {
    const sev = String(inc.severity || '').toLowerCase();
    const matchesSev = severity === 'All' || sev === severity.toLowerCase();
    const matchesQ = !q || JSON.stringify(inc).toLowerCase().includes(q);
    return matchesSev && matchesQ;
  });

  return (
    <PageShell 
      title="Incident Tracking" 
      onRefresh={load}
      headerAction={
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--error)', color: '#fff',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
          transition: 'all var(--t-fast) var(--ease)',
        }}>
          <span style={{ fontSize: 16 }}>+</span> Report Incident
        </button>
      }
    >
      {q && <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>Search results for “{q}”</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SEVERITIES.map((s) => (
          <button key={s} onClick={() => setSeverity(s)} style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${severity === s ? 'var(--tertiary)' : 'var(--border)'}`,
            background: severity === s ? 'var(--tertiary)' : 'var(--surface)',
            color: severity === s ? '#fff' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
            cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
          }}>{s}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="✅" text="No incidents — all systems operational" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {visible.map((inc, i) => (
            <div key={i} className="fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <IncidentTile incident={inc} />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReportIncidentModal 
          onClose={() => setShowModal(false)}
          onReported={(newIncident) => setItems([newIncident, ...items])}
        />
      )}
    </PageShell>
  );
}
