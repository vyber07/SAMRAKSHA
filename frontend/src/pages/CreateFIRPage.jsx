import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import { cases as casesApi } from '../lib/api';

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

export default function CreateFIRPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    victim_name:    '',
    victim_address: '',
    victim_phone:   '',
    victim_age:     '',
    victim_gender:  'Male',
    victim_injury:  false,
    crime_type:     'Theft',
    crime_narrative:'',
    crime_date:     new Date().toISOString().slice(0, 16),
    crime_location: '',
    crime_lat:      '23.0225',
    crime_lon:      '72.5714',
    ward:           'Ellisbridge',
    severity:       '3',
    accused_name:   '',
    accused_address:'',
    accused_age:    '',
    language:       'en',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        victim_age:  form.victim_age  ? parseInt(form.victim_age)  : null,
        accused_age: form.accused_age ? parseInt(form.accused_age) : null,
        crime_lat:   parseFloat(form.crime_lat),
        crime_lon:   parseFloat(form.crime_lon),
        severity:    parseInt(form.severity),
        crime_date:  new Date(form.crime_date).toISOString(),
      };
      await casesApi.create(payload);
      setSuccess(true);
      setTimeout(() => navigate('/cases'), 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create FIR';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const label = { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'block' };
  const field = { display: 'flex', flexDirection: 'column', gap: 4 };
  const sectionTitle = { fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, fontFamily: 'var(--font-mono)' };

  return (
    <PageShell title="Register New FIR">
      <div className="glass fade-in-up" style={{ padding: '32px', maxWidth: 840, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontFamily: 'var(--font-headline)', marginBottom: 6 }}>📝 First Information Report (FIR)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete all required fields below. AI will automatically suggest BNS sections based on your crime narrative.</p>
        </div>

        {success ? (
          <div style={{ padding: 24, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', textAlign: 'center', fontSize: 16, fontWeight: 600 }}>
            ✅ FIR Registered Successfully! Redirecting to Cases...
          </div>
        ) : (
          <form id="fir-page-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Section: Victim */}
            <div>
              <div style={{ ...sectionTitle, color: 'var(--primary)' }}>👤 Victim Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={field}><label style={label}>Name *</label><input required style={inp} value={form.victim_name} onChange={(e) => set('victim_name', e.target.value)} placeholder="Full name" /></div>
                <div style={field}><label style={label}>Phone</label><input style={inp} value={form.victim_phone} onChange={(e) => set('victim_phone', e.target.value)} placeholder="+91 XXXXX XXXXX" /></div>
                <div style={{ ...field, gridColumn: '1 / -1' }}><label style={label}>Address *</label><input required style={inp} value={form.victim_address} onChange={(e) => set('victim_address', e.target.value)} placeholder="Residential address" /></div>
                <div style={field}><label style={label}>Age</label><input type="number" style={inp} value={form.victim_age} onChange={(e) => set('victim_age', e.target.value)} placeholder="Age" min="1" max="120" /></div>
                <div style={field}><label style={label}>Gender</label><select style={inp} value={form.victim_gender} onChange={(e) => set('victim_gender', e.target.value)}>{['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}</select></div>
              </div>
            </div>

            {/* Section: Crime */}
            <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{ ...sectionTitle, color: 'var(--error)' }}>🚨 Crime Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={field}><label style={label}>Crime Type *</label><select required style={inp} value={form.crime_type} onChange={(e) => set('crime_type', e.target.value)}>{CRIME_TYPES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div style={field}><label style={label}>Severity (1–5) *</label><select required style={inp} value={form.severity} onChange={(e) => set('severity', e.target.value)}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} — {['Minimal','Low','Moderate','High','Critical'][n-1]}</option>)}</select></div>
                <div style={field}><label style={label}>Date & Time *</label><input required type="datetime-local" style={inp} value={form.crime_date} onChange={(e) => set('crime_date', e.target.value)} /></div>
                <div style={field}><label style={label}>Ward</label><select style={inp} value={form.ward} onChange={(e) => set('ward', e.target.value)}>{AHMEDABAD_WARDS.map((w) => <option key={w}>{w}</option>)}</select></div>
                <div style={{ ...field, gridColumn: '1 / -1' }}><label style={label}>Crime Location *</label><input required style={inp} value={form.crime_location} onChange={(e) => set('crime_location', e.target.value)} placeholder="Street / landmark / area" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, gridColumn: '1 / -1' }}>
                  <div style={field}><label style={label}>Latitude *</label><input required style={inp} value={form.crime_lat} onChange={(e) => set('crime_lat', e.target.value)} placeholder="23.XXXX" /></div>
                  <div style={field}><label style={label}>Longitude *</label><input required style={inp} value={form.crime_lon} onChange={(e) => set('crime_lon', e.target.value)} placeholder="72.XXXX" /></div>
                </div>
                <div style={{ ...field, gridColumn: '1 / -1' }}><label style={label}>Crime Narrative *</label><textarea required rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} value={form.crime_narrative} onChange={(e) => set('crime_narrative', e.target.value)} placeholder="Describe the incident in detail. BNS sections will be auto-suggested based on this narrative…" /></div>
              </div>
            </div>

            {/* Section: Accused */}
            <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{ ...sectionTitle, color: 'var(--warning)' }}>🎯 Accused Details (if known)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={field}><label style={label}>Accused Name</label><input style={inp} value={form.accused_name} onChange={(e) => set('accused_name', e.target.value)} placeholder="Full name or alias" /></div>
                <div style={field}><label style={label}>Accused Age</label><input type="number" style={inp} value={form.accused_age} onChange={(e) => set('accused_age', e.target.value)} placeholder="Age" min="1" max="120" /></div>
                <div style={{ ...field, gridColumn: '1 / -1' }}><label style={label}>Accused Address</label><input style={inp} value={form.accused_address} onChange={(e) => set('accused_address', e.target.value)} placeholder="Last known address" /></div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ paddingTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/cases')} disabled={loading} style={{
                padding: '12px 28px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" disabled={loading} style={{
                padding: '12px 32px', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--primary)', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(37,99,235,0.4)',
              }}>{loading ? 'Registering…' : '✅ Register FIR'}</button>
            </div>

          </form>
        )}
      </div>
    </PageShell>
  );
}
