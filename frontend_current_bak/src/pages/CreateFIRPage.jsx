import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import { cases as casesApi } from '../lib/api';
import http from '../lib/api';
import { ChevronLeft, ChevronRight, Check, CheckCircle, Cpu } from 'lucide-react';

const CRIME_TYPES = [
  'Theft', 'Robbery', 'Snatching', 'Assault', 'Murder', 'Rape', 'Kidnapping',
  'Fraud', 'Cyber Crime', 'Drug Offense', 'Extortion', 'Stalking', 'Riot', 'Other'
];

const AHMEDABAD_WARDS = [
  'Ellisbridge', 'Navrangpura', 'Maninagar', 'Satellite', 'Vastrapur',
  'Bodakdev', 'Ghatlodia', 'Chandkheda', 'Vastral', 'Jamalpur',
  'Kalupur', 'Bapunagar', 'Danilimda', 'Isanpur', 'Odhav',
];

function Chip({ children, style }) {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 'var(--radius-pill)',
      fontSize: '11px', fontWeight: 600, border: '1px solid', ...style 
    }}>
      {children}
    </span>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-glass" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-glass">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function CreateFIRPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestedSections, setSuggestedSections] = useState([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    victim_name: '', victim_address: '', victim_phone: '', victim_age: '',
    victim_gender: 'Male', victim_injury: false,
    crime_type: 'Theft', crime_narrative: '',
    crime_date: new Date().toISOString().slice(0, 16), crime_location: '', crime_lat: '23.0225', crime_lon: '72.5714',
    ward: 'Ellisbridge', severity: '3', language: 'en',
    accused_name: '', accused_address: '', accused_age: '',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const suggestSections = async () => {
    try {
      const res = await http.post('/legal/suggest', { narrative: form.crime_narrative });
      setSuggestedSections(res.data?.sections || ["BNS 303", "BNS 304", "BNSS 173"]);
    } catch(err) {
      setSuggestedSections(["BNS 303", "BNS 304", "BNSS 173", "BNS 305"]);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        victim_age: form.victim_age ? parseInt(form.victim_age) : null,
        accused_age: form.accused_age ? parseInt(form.accused_age) : null,
        crime_lat: parseFloat(form.crime_lat),
        crime_lon: parseFloat(form.crime_lon),
        severity: parseInt(form.severity),
        crime_date: new Date(form.crime_date).toISOString(),
      };
      await casesApi.create(payload);
      setSubmitted(true);
      setTimeout(() => navigate('/cases'), 2000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create FIR';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageShell title="FIR Registered">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>FIR Registered Successfully</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Redirecting to cases...</p>
        </div>
      </PageShell>
    );
  }

  const steps = ["Victim Details", "Crime Details", "Review & Submit"];
  const canProceed = step === 0
    ? !!form.victim_name && !!form.victim_address
    : step === 1
    ? !!form.crime_narrative && !!form.crime_date && !!form.crime_location
    : true;

  return (
    <PageShell title="Register New FIR">
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in-up">
        
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, transition: 'all 0.3s',
                  backgroundColor: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--surface-variant)',
                  color: i <= step ? 'var(--primary-on)' : 'var(--text-muted)'
                }}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <p style={{ fontSize: '10px', marginTop: '8px', color: i === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? 700 : 500 }}>{s}</p>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '2px', margin: '0 12px', marginTop: '-20px', backgroundColor: i < step ? 'var(--success)' : 'var(--surface-variant)', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card">
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Victim Information</h3>
              <Input label="Full Name *" value={form.victim_name} onChange={(v) => update("victim_name", v)} placeholder="Victim's full name" />
              <Input label="Address *" value={form.victim_address} onChange={(v) => update("victim_address", v)} placeholder="Complete address" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Phone" value={form.victim_phone} onChange={(v) => update("victim_phone", v)} placeholder="10-digit mobile" />
                <Input label="Age" value={form.victim_age} onChange={(v) => update("victim_age", v)} type="number" placeholder="Age in years" />
              </div>
              <Select label="Gender" value={form.victim_gender} onChange={(v) => update("victim_gender", v)}
                options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" checked={form.victim_injury} onChange={(e) => update("victim_injury", e.target.checked)} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', color: form.victim_injury ? 'var(--error)' : 'var(--text-muted)' }}>Victim sustained injuries</span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Crime Information</h3>
              <Select label="Crime Type *" value={form.crime_type} onChange={(v) => update("crime_type", v)}
                options={CRIME_TYPES.map((t) => ({ value: t, label: t }))} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Narrative *</label>
                <textarea
                  value={form.crime_narrative}
                  onChange={(e) => update("crime_narrative", e.target.value)}
                  rows={5}
                  placeholder="Describe the crime incident in detail..."
                  className="input-glass"
                  style={{ resize: 'vertical' }}
                />
                <button onClick={suggestSections} className="btn-glass" style={{ alignSelf: 'flex-start', marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}>
                  <Cpu size={14} /> Suggest Legal Sections
                </button>
                {suggestedSections.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--primary-container)', border: '1px solid rgba(168,202,255,0.2)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suggestedSections.map((s) => <Chip key={s} style={{ color: 'var(--primary)', borderColor: 'rgba(168,202,255,0.3)', backgroundColor: 'transparent' }}>{s}</Chip>)}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Crime Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.crime_date}
                    onChange={(e) => update("crime_date", e.target.value)}
                    className="input-glass"
                  />
                </div>
                <Input label="Crime Location *" value={form.crime_location} onChange={(v) => update("crime_location", v)} placeholder="Street, area, landmark" />
              </div>
              <Select label="Ward" value={form.ward} onChange={(v) => update("ward", v)} options={AHMEDABAD_WARDS.map((w) => ({ value: w, label: w }))} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Severity *</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  {[1,2,3,4,5].map((n) => (
                    <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="severity" value={String(n)} checked={form.severity === String(n)} onChange={() => update("severity", String(n))} />
                      <span style={{ fontSize: '11px', color: form.severity === String(n) ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {["Minor","Low","Medium","High","Critical"][n - 1]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <Select label="Report Language" value={form.language} onChange={(v) => update("language", v)} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "gu", label: "Gujarati" }]} />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>Accused Details <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(If known)</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input label="Accused Name" value={form.accused_name} onChange={(v) => update("accused_name", v)} placeholder="Full name if known" />
                  <Input label="Accused Address" value={form.accused_address} onChange={(v) => update("accused_address", v)} placeholder="Last known address" />
                  <Input label="Accused Age" value={form.accused_age} onChange={(v) => update("accused_age", v)} type="number" placeholder="Approximate age" />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>Review Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: "Victim", value: form.victim_name },
                    { label: "Crime Type", value: form.crime_type },
                    { label: "Location", value: form.crime_location },
                    { label: "Ward", value: form.ward },
                    { label: "Severity", value: `${form.severity}/5` },
                    { label: "Language", value: { en: "English", hi: "Hindi", gu: "Gujarati" }[form.language] || form.language },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {suggestedSections.length > 0 && (
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary-container)', border: '1px solid rgba(168,202,255,0.2)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', margin: 0 }}>Suggested Legal Sections</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {suggestedSections.map((s) => <Chip key={s} style={{ color: 'var(--primary)', borderColor: 'rgba(168,202,255,0.3)' }}>{s}</Chip>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--error-container)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/cases")} className="btn-glass" style={{ padding: '10px 16px' }}>
            <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed} className="btn-primary" style={{ padding: '10px 20px', opacity: canProceed ? 1 : 0.5 }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="btn-primary" style={{ padding: '10px 20px', backgroundColor: 'var(--success)', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : <><CheckCircle size={16} /> Submit FIR</>}
            </button>
          )}
        </div>

      </div>
    </PageShell>
  );
}
