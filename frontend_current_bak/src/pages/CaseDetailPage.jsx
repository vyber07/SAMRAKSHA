import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import { cases as casesApi, documents as docsApi } from '../lib/api';
import { ChevronLeft, ChevronRight, User, Bot, Send, MapPin } from 'lucide-react';

function Badge({ children, color, bg }) {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: '11px', fontWeight: 600, color: color, backgroundColor: bg || `${color}22` 
    }}>
      {children}
    </span>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-variant)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text)' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Chat State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Diary State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState("note");
  const [newNote, setNewNote] = useState("");
  const [evidenceTag, setEvidenceTag] = useState("");
  const [localEntries, setLocalEntries] = useState([
    { step: 1, title: "Initial Complaint Filed", ts: new Date(Date.now() - 86400000 * 2).toISOString(), officer: "IO Amit Patel", status: "completed", description: "Received oral narrative from victim.", attachments: ["COMPLAINT.txt"] },
    { step: 2, title: "FIR Formally Registered", ts: new Date(Date.now() - 86400000).toISOString(), officer: "SHO Priya Mehta", status: "completed", description: "Registered FIR under BNS Sections.", attachments: ["FIR.pdf"] }
  ]);

  useEffect(() => {
    casesApi.get(id).then(res => {
      setCaseData(res.data);
      if (res.data.diary_entries) {
        setLocalEntries(res.data.diary_entries.map((d, i) => ({ step: i+1, title: d.entry_type, ts: d.ts, officer: "System", status: "completed", description: d.description, attachments: [] })));
      }
      setLoading(false);
    }).catch(e => setLoading(false));
  }, [id]);

  const generateDoc = async (type) => {
    try {
      const res = await docsApi.generate(id, type, 'en');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_${id}_${type}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate document');
    }
  };

  const docTypes = ['chargesheet', 'remand_request', 'seizure_receipt', 'panchanama', 'witness_statement', 'arrest_memo', 'case_diary'];

  if (loading) return <PageShell title="Loading..."><div className="glass" style={{padding: 24}}>Loading case...</div></PageShell>;
  if (!caseData) return <PageShell title="Case Detail"><div className="glass" style={{padding: 24}}>Case not found</div></PageShell>;

  const STATUS_CONFIG = {
    open: { label: "Open", color: "var(--info)", bg: "var(--info-container)" },
    arrested: { label: "Arrested", color: "var(--warning)", bg: "var(--warning-container)" },
    chargesheeted: { label: "Chargesheeted", color: "var(--primary)", bg: "var(--primary-container)" },
    closed: { label: "Closed", color: "var(--text-muted)", bg: "var(--surface-variant)" },
  };

  const sc = STATUS_CONFIG[caseData.case_status] || STATUS_CONFIG.open;

  function askAI() {
    if (!aiQuestion) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiAnswer(`Based on the case FIR ${caseData.fir_no || id}: The crime was reported at ${caseData.crime_location || 'Unknown'} on ${new Date(caseData.crime_date).toLocaleDateString()}. The applicable sections are ${caseData.crime_type}. The investigation is ongoing.`);
      setAiLoading(false);
    }, 1200);
  }

  const handleAddDiaryEntry = () => {
    if (!newNote) return;
    const newStep = {
      step: localEntries.length + 1,
      title: `Quick Log: ${newEntryType.toUpperCase()}`,
      ts: new Date().toISOString(),
      officer: "Logged User",
      status: "completed",
      description: newNote,
      attachments: evidenceTag ? [evidenceTag] : [],
    };
    setLocalEntries([...localEntries, newStep]);
    setNewNote("");
    setEvidenceTag("");
    setIsDrawerOpen(false);
  };

  return (
    <PageShell title={`Case Detail: ${caseData.fir_no || id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
        
        {/* Back + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/cases')} className="btn-glass" style={{ padding: '8px 12px', fontSize: '12px' }}>
              <ChevronLeft size={14} /> Back to Cases
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <ChevronRight size={14} />
              <span>{caseData.fir_no || id}</span>
            </div>
          </div>
          <button onClick={() => setIsDrawerOpen(true)} className="btn-alert" style={{ fontSize: '12px', padding: '8px 16px' }}>
            Quick-Log Case Diary
          </button>
        </div>

        {/* Header strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-mono)' }}>{caseData.fir_no || id}</h1>
          <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
          <Badge color="var(--primary)">{caseData.crime_type}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Victim Details */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={14} color="var(--primary)" /> Victim Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              {[
                { label: "Name", value: caseData.victim_name || "—" },
                { label: "Age", value: caseData.victim_age ? `${caseData.victim_age} years` : "—" },
                { label: "Gender", value: caseData.victim_gender || "—" },
                { label: "Phone", value: caseData.victim_phone || "—" },
                { label: "Address", value: caseData.victim_address || "—" },
                { label: "Injury", value: caseData.victim_injury ? "Yes" : "No" },
              ].map((field) => (
                <div key={field.label}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{field.label}</p>
                  <p style={{ color: field.label === "Injury" && caseData.victim_injury ? 'var(--error)' : 'var(--text)', margin: 0 }}>{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat With Me */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={14} color="var(--primary)" /> Chat With Me
            </h3>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {aiAnswer && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', backgroundColor: 'var(--primary-container)', color: 'var(--text)' }}>
                  {aiAnswer}
                </div>
              )}
              {aiLoading && <div style={{ marginTop: '8px', height: '12px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--surface-variant)' }} className="skeleton" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask about this case..."
                  className="input-glass"
                  onKeyDown={(e) => e.key === "Enter" && askAI()}
                />
                <button onClick={askAI} className="btn-primary" style={{ padding: '10px' }}>
                  <Send size={14} />
                </button>
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                AI answers are for review only. Verify with official records.
              </div>
            </div>
          </div>

          {/* Crime Details */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--warning)" /> Crime Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Crime Type</p><p style={{ margin: 0 }}>{caseData.crime_type}</p></div>
              <div><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date & Time</p><p style={{ margin: 0 }}>{caseData.crime_date ? new Date(caseData.crime_date).toLocaleString() : '—'}</p></div>
              <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</p><p style={{ margin: 0 }}>{caseData.crime_location || '—'}</p></div>
            </div>
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-variant)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Narrative</p>
              <p style={{ fontSize: '14px', margin: 0 }}>{caseData.crime_narrative || 'No narrative provided.'}</p>
            </div>
          </div>

          {/* Case Diary */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Case Diary
              </h3>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--warning-container)', color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
                {localEntries.length} Milestones
              </span>
            </div>
            <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {localEntries.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', left: '-30px', top: '2px', width: '20px', height: '20px', borderRadius: '50%', 
                    border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700,
                    backgroundColor: item.status === 'completed' ? 'var(--success)' : 'var(--primary)',
                    borderColor: item.status === 'completed' ? 'var(--success)' : 'var(--primary)',
                    color: '#000'
                  }}>
                    {item.step}
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{item.title}</p>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{new Date(item.ts).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', margin: 0, color: 'var(--text)' }}>{item.description}</p>
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Recorded by: <strong style={{ color: 'var(--primary)' }}>{item.officer}</strong></span>
                      {item.attachments && item.attachments.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {item.attachments.map((att, aIdx) => (
                            <span key={aIdx} style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--warning-container)', color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{att}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 7-Doc Generator (from live frontend) */}
          <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>7-Doc Generator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {docTypes.map(type => (
                <button key={type} onClick={() => generateDoc(type)} className="btn-glass" style={{ justifyContent: 'center' }}>
                  📄 Generate {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Modal open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Quick-Log Case Diary Entry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)' }}>Entry Category</label>
            <select
              value={newEntryType}
              onChange={(e) => setNewEntryType(e.target.value)}
              className="input-glass"
            >
              <option value="note">General Investigation Note</option>
              <option value="photo">Photo Evidence Tag</option>
              <option value="audio">Audio Interrogation Log</option>
              <option value="seizure">Property Seizure Record</option>
              <option value="arrest">Arrest & Panchanama Update</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)' }}>Officer Investigation Notes</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              placeholder="Type official diary observation..."
              className="input-glass"
              style={{ resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)' }}>Attachment File / Evidence Tag</label>
            <input
              type="text"
              value={evidenceTag}
              onChange={(e) => setEvidenceTag(e.target.value)}
              placeholder="e.g. EVID-GOLD-RECOVERY-04.jpg"
              className="input-glass"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setIsDrawerOpen(false)} className="btn-glass">Cancel</button>
            <button onClick={handleAddDiaryEntry} className="btn-alert">Append to Case</button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
