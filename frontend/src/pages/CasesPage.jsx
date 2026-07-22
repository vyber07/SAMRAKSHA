import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageShell, { EmptyState, StatusBadge } from './PageShell';
import { cases as casesApi, documents as docsApi } from '../lib/api';

const MOCK_CASES = [
  { case_id: 'C-1201', fir_no: '2026/0341', victim_name: 'R. Shah',    accused_name: 'Unknown', crime_type: 'Theft',   case_status: 'open',          created_at: new Date().toISOString() },
  { case_id: 'C-1202', fir_no: '2026/0342', victim_name: 'M. Desai',   accused_name: 'K. Yadav', crime_type: 'Assault', case_status: 'investigating', created_at: new Date(Date.now() - 864e5).toISOString() },
  { case_id: 'C-1203', fir_no: '2026/0338', victim_name: 'P. Mehta',   accused_name: 'Unknown', crime_type: 'Fraud',   case_status: 'solved',        created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
  { case_id: 'C-1204', fir_no: '2026/0335', victim_name: 'A. Trivedi', accused_name: 'S. Rana',  crime_type: 'Robbery', case_status: 'pending',       created_at: new Date(Date.now() - 3 * 864e5).toISOString() },
];

const FILTERS = ['All', 'Open', 'Investigating', 'Pending', 'Solved', 'Closed'];

const CRIME_TYPES = [
  'Theft', 'Robbery', 'Assault', 'Murder', 'Kidnapping',
  'Fraud', 'Cybercrime', 'Rape', 'Eve Teasing', 'Vandalism',
  'Drug Possession', 'Extortion', 'Stalking', 'Other',
];

const AHMEDABAD_WARDS = [
  'Ellisbridge', 'Navrangpura', 'Maninagar', 'Satellite', 'Vastrapur',
  'Bodakdev', 'Ghatlodia', 'Chandkheda', 'Vastral', 'Jamalpur',
  'Kalupur', 'Bapunagar', 'Danilimda', 'Isanpur', 'Odhav',
];

// ─── Generate Document Modal ─────────────────────────────────
function GenerateDocModal({ caseItem, onClose }) {
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState('chargesheet');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await docsApi.generate(caseItem.case_id, docType, language);
      // Download the blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${caseItem.fir_no || caseItem.case_id}_${docType}_${language}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onClose();
    } catch (err) {
      setError('Failed to generate document. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontFamily: 'var(--font-headline)' }}>📄 Generate Document</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Generating document for Case: <strong style={{ color: 'var(--text)' }}>FIR {caseItem.fir_no || caseItem.case_id}</strong>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Document Type</label>
            <select style={inp} value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="fir">FIR (First Information Report)</option>
              <option value="chargesheet">Chargesheet (BNS/BNSS)</option>
              <option value="case_diary">Case Diary</option>
              <option value="closure_report">Closure Report</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Language</label>
            <select style={inp} value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="gu">Gujarati (ગુજરાતી)</option>
            </select>
          </div>
          {error && <div style={{ color: '#fca5a5', fontSize: 13, background: 'rgba(220,38,38,0.1)', padding: 12, borderRadius: 6 }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={handleGenerate} disabled={loading} style={{
            padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none',
            background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}>{loading ? 'Generating…' : '⬇ Download PDF / DocX'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CasesPage ──────────────────────────────────────────
export default function CasesPage() {
  const navigate = useNavigate();
  const [items,    setItems]    = useState([]);
  const [forbidden,setForbidden]= useState(false);
  const [filter,   setFilter]   = useState('All');
  const [showModal,setShowModal] = useState(false);
  const [docModalCase, setDocModalCase] = useState(null);
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();

  const load = useCallback(async () => {
    try {
      const res = await casesApi.list(1, 100);
      setItems(res.data?.items?.length ? res.data.items : MOCK_CASES);
      setForbidden(false);
    } catch (err) {
      if (err.response?.status === 403) setForbidden(true);
      else setItems(MOCK_CASES);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = items.filter((c) => {
    const matchesFilter = filter === 'All' || String(c.case_status || '').toLowerCase().includes(filter.toLowerCase());
    const matchesQ = !q || JSON.stringify(c).toLowerCase().includes(q);
    return matchesFilter && matchesQ;
  });

  const handleCreated = (data) => {
    load(); // Reload list
  };

  return (
    <PageShell
      title="Case Management"
      onRefresh={load}
      headerAction={
        !forbidden && (
          <button onClick={() => navigate('/cases/create')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--primary)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'all var(--t-fast) var(--ease)',
          }}>
            <span style={{ fontSize: 16 }}>+</span> Register FIR
          </button>
        )
      }
    >
      {forbidden ? (
        <EmptyState icon="🔒" text="Your role does not have permission to view cases. Contact your SHO." />
      ) : (
        <>
          {q && <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>Search results for "{q}"</div>}

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-xl)',
                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                background: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
              }}>{f}</button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {visible.length} case{visible.length !== 1 ? 's' : ''}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="📁" text="No cases match your filters" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {visible.map((c, i) => (
                <div
                  key={c.case_id || i}
                  className="glass fade-in-up"
                  style={{ padding: 20, animationDelay: `${i * 0.04}s`, cursor: 'pointer', transition: 'transform 0.2s ease', position: 'relative' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      FIR {c.fir_no || c.case_id}
                    </span>
                    <StatusBadge status={c.case_status} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-headline)', marginBottom: 10 }}>
                    {c.crime_type || 'Case'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'grid', gap: 5, marginBottom: 16 }}>
                    <div>👤 Victim: <span style={{ color: 'var(--text)' }}>{c.victim_name || '—'}</span></div>
                    <div>🎯 Accused: <span style={{ color: 'var(--text)' }}>{c.accused_name || 'Unknown'}</span></div>
                    <div>📅 {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => { e.stopPropagation(); setDocModalCase(c); }} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                      padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }} onMouseEnter={e => e.currentTarget.style.background='var(--primary)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                      📄 Generate Docs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {docModalCase && (
        <GenerateDocModal 
          caseItem={docModalCase}
          onClose={() => setDocModalCase(null)}
        />
      )}
    </PageShell>
  );
}
