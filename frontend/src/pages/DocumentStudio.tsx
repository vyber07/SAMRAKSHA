import React, { useState } from 'react';
import { FileText, Copy, Download, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CASES_DATA } from './Cases';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

const TEMPLATES: Record<string, { name: string; generate: (caseData: typeof CASES_DATA[0] | null) => string }> = {
  chargesheet: {
    name: 'Final Chargesheet (u/s 193 BNSS)',
    generate: (c) => `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, AHMEDABAD

POLICE REPORT (CHARGESHEET)
u/s 193 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023

FIR No.: ${c?.id || '[FIR NUMBER]'}
Police Station: ${c?.station || '[POLICE STATION]'}
Date of FIR: ${c?.date || '[DATE]'}
Investigating Officer: ${c?.io || '[IO NAME]'}

OFFENCE(S) CHARGED:
${c?.sections?.join('\n') || '[APPLICABLE SECTIONS]'}

DETAILS OF ACCUSED:
Name: ${c?.accused || '[ACCUSED NAME]'}
(Further details as per arrest memo)

DETAILS OF VICTIM/COMPLAINANT:
Name: ${c?.victim || '[VICTIM NAME]'}
Address: [As per FIR]

BRIEF FACTS OF THE CASE:
On ${c?.date || '[DATE]'} at approximately ${c?.time || '[TIME]'}, the complainant reported a ${c?.type || '[CRIME TYPE]'} at ${c?.ward || '[WARD]'}, Ahmedabad. The matter was registered as FIR No. ${c?.id || '[FIR]'} at ${c?.station || '[PS]'}.

During investigation, the following was established:
1. [Investigation finding 1]
2. [Investigation finding 2]
3. [Investigation finding 3]

EVIDENCE COLLECTED:
1. [Evidence Item 1] — Exhibit No. MO-01
2. [Evidence Item 2] — Exhibit No. MO-02
3. [Witness statement] — PW-01

LIST OF WITNESSES:
1. [Witness Name] — PW-01
2. [Witness Name] — PW-02

LIST OF MATERIAL OBJECTS:
1. [Object description] — MO-01

It is respectfully submitted that the chargesheet may be accepted and the accused be tried according to law.

Date: ___________          Signature: _______________
Place: Ahmedabad           ${c?.io || '[IO Name]'}
                           [Designation]
                           ${c?.station || '[PS Name]'}`,
  },

  firSummary: {
    name: 'FIR Summary Report',
    generate: (c) => `FIRST INFORMATION REPORT — SUMMARY
Ahmedabad City Police

═══════════════════════════════════════

FIR Number   : ${c?.id || 'FIR-2024/--/----'}
Date & Time  : ${c?.date || 'DD/MM/YYYY'} ${c?.time || 'HH:MM'} IST
Police Station: ${c?.station || '[Station Name]'}
Ward         : ${c?.ward || '[Ward]'}

TYPE OF OFFENCE: ${c?.type || '[Crime Type]'}
APPLICABLE SECTIONS: ${c?.sections?.join(', ') || '[Sections]'}

COMPLAINANT/VICTIM DETAILS:
Name: ${c?.victim || '[Victim Name]'}
Address: [As provided in original FIR]

ACCUSED DETAILS:
Name: ${c?.accused || '[Known / Unknown]'}

IO ASSIGNED: ${c?.io || '[IO Name]'}
CASE STATUS : ${c?.status || '[Status]'}

SUMMARY OF COMPLAINT:
[Brief description of the incident as stated by complainant]

PRELIMINARY ACTION TAKEN:
☑ FIR registered and numbered
☑ Scene of crime visited
☐ Medical examination conducted
☐ Witnesses identified
☐ Accused arrested

Generated on: ${new Date().toLocaleDateString('en-IN')}
System: SAMRAKSHA — Ahmedabad City Police Command`,
  },

  seizureMemo: {
    name: 'Seizure Memo',
    generate: (c) => `PANCHNAMA / SEIZURE MEMO
(u/s 105 BNSS, 2023)

FIR No.: ${c?.id || '[FIR NUMBER]'}
PS: ${c?.station || '[Police Station]'}
Date: _______________
Time: _______________
Place of Seizure: _________________________________

OFFICER CONDUCTING SEIZURE:
Name: ${c?.io || '[IO Name]'}
Designation: _______________
Badge No.: _______________

PANCH WITNESSES:
1. Name: _______________  Address: _______________
2. Name: _______________  Address: _______________

LIST OF ARTICLES SEIZED:

Sr. | Description               | Quantity | Condition | MO No.
----|---------------------------|----------|-----------|-------
 1  | ___________________       |          |           | MO-01
 2  | ___________________       |          |           | MO-02
 3  | ___________________       |          |           | MO-03

The above articles were seized in the presence of panch witnesses and sealed with seal No. ___

Signature of IO: _______________
Signature of Panch 1: _______________
Signature of Panch 2: _______________

This seizure memo is prepared in duplicate. One copy retained by IO and one given to person from whose possession articles were seized.`,
  },

  bailOpposition: {
    name: 'Bail Opposition Report',
    generate: (c) => `IN THE COURT OF [MAGISTRATE / SESSIONS JUDGE]
AHMEDABAD, GUJARAT

Bail Application No.: [BA No.]
FIR No.: ${c?.id || '[FIR NUMBER]'}
Offence: ${c?.type || '[Crime Type]'} — ${c?.sections?.join(', ') || '[Sections]'}

STATE OF GUJARAT
(Through: ${c?.io || '[IO Name]'}, ${c?.station || '[PS Name]'})
                                          ... RESPONDENT/COMPLAINANT

VERSUS

${c?.accused || '[ACCUSED NAME]'}
                                          ... APPLICANT/ACCUSED

REPLY TO BAIL APPLICATION / GROUNDS OF OPPOSITION

Respectfully submitted as follows:

1. NATURE AND GRAVITY OF OFFENCE:
The accused is charged with ${c?.type || '[crime type]'} under ${c?.sections?.join(', ') || '[sections]'}. The offence is cognizable and non-bailable. The maximum punishment prescribed is [X years] rigorous imprisonment.

2. CRIMINAL ANTECEDENTS:
[State prior FIRs if any, or "The accused has no prior criminal record" if clean]

3. INVESTIGATION STATUS:
The investigation is currently at [stage]. The following aspects are pending:
• Recovery of [stolen property / material evidence]
• Recording of [witness statements]
• [Other pending items]

4. RISK OF TAMPERING:
The accused, if released, is likely to tamper with evidence and intimidate prosecution witnesses, particularly PW-01 [name].

5. FLIGHT RISK:
[State grounds — no fixed address, connections outside jurisdiction, etc.]

6. PRAYER:
In view of the above circumstances, it is most humbly prayed that this Hon'ble Court may be pleased to REJECT the bail application in the interest of justice and to ensure fair trial.

Date: ___________      Respectfully submitted,
Place: Ahmedabad       ${c?.io || '[IO Name]'}
                       [Designation], ${c?.station || '[PS]'}`,
  },
};

const DocumentStudio: React.FC = () => {
  const publishedPage = usePublishedPage('document-studio');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('chargesheet');
  const [copied, setCopied] = useState(false);

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  const caseData = CASES_DATA.find(c => c.id === selectedCase) || null;
  const docContent = TEMPLATES[selectedTemplate]?.generate(caseData) || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(docContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}_${selectedCase || 'template'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', borderBottom: `1px solid ${cardBorder}`,
        background: cardBg, backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #004B87, #0063B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '18px', color: textPrimary }}>Document Studio</h1>
            <p style={{ fontSize: '11px', color: textMuted }}>CrimeGPT Legal Drafting · AI-powered document generation</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: copied ? 'rgba(16,185,129,0.15)' : cardBg,
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : cardBorder}`,
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: copied ? '#10B981' : textPrimary,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: '#004B87', color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,75,135,0.3)',
            }}
          >
            <Download size={14} /> Export .txt
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        padding: '14px 24px', borderBottom: `1px solid ${cardBorder}`,
        background: isDark ? 'rgba(6,13,26,0.5)' : 'rgba(240,244,248,0.5)',
        display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Case selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case Pre-fill:</label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCase}
              onChange={e => setSelectedCase(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px', appearance: 'none',
                background: cardBg, border: `1px solid ${cardBorder}`,
                borderRadius: '8px', color: textPrimary, fontSize: '13px',
                fontFamily: 'JetBrains Mono', outline: 'none', cursor: 'pointer',
                minWidth: '220px',
              }}
            >
              <option value="">— Select FIR to auto-fill —</option>
              {CASES_DATA.map(c => (
                <option key={c.id} value={c.id}>{c.id} ({c.type})</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Template selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Template:</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key)}
                style={{
                  padding: '7px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: selectedTemplate === key ? '#004B87' : 'transparent',
                  color: selectedTemplate === key ? 'white' : textMuted,
                  border: `1px solid ${selectedTemplate === key ? '#004B87' : cardBorder}`,
                  transition: 'all 0.15s',
                }}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {selectedCase && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981' }}>
            <Sparkles size={13} />
            Auto-filled from {selectedCase}
          </div>
        )}
      </div>

      {/* Split-screen editor */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* Left: Case info sidebar */}
        <div style={{
          borderRight: `1px solid ${cardBorder}`, overflow: 'y-auto',
          padding: '20px', background: isDark ? 'rgba(6,13,26,0.3)' : 'rgba(240,244,248,0.5)',
        }}>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Case Data Reference
          </h3>

          {caseData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'FIR Number', value: caseData.id, mono: true },
                { label: 'Station', value: caseData.station },
                { label: 'Date & Time', value: `${caseData.date} ${caseData.time}`, mono: true },
                { label: 'Crime Type', value: caseData.type },
                { label: 'Status', value: caseData.status },
                { label: 'Victim', value: caseData.victim },
                { label: 'Accused', value: caseData.accused },
                { label: 'IO', value: caseData.io },
                { label: 'Ward', value: caseData.ward },
              ].map(item => (
                <div key={item.label} style={{ padding: '10px 12px', borderRadius: '8px', background: cardBg, backdropFilter: 'blur(8px)', border: `1px solid ${cardBorder}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, fontFamily: item.mono ? 'JetBrains Mono' : undefined }}>{item.value}</div>
                </div>
              ))}

              <div style={{ padding: '10px 12px', borderRadius: '8px', background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sections</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {caseData.sections.map(s => (
                    <span key={s} style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted }}>
              <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>Select a FIR from the dropdown above to auto-populate case data into the document.</p>
            </div>
          )}
        </div>

        {/* Right: Document editor */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '10px 20px', borderBottom: `1px solid ${cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: isDark ? 'rgba(13,27,46,0.5)' : 'rgba(255,255,255,0.5)',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {TEMPLATES[selectedTemplate]?.name}
            </span>
            <span style={{ fontSize: '11px', color: textMuted, fontFamily: 'JetBrains Mono' }}>
              {docContent.split('\n').length} lines
            </span>
          </div>
          <textarea
            value={docContent}
            onChange={() => {}} // read-only preview — would be editable in production
            style={{
              flex: 1, padding: '20px', resize: 'none', outline: 'none',
              background: isDark ? 'rgba(4,10,22,0.8)' : 'rgba(248,250,252,0.9)',
              border: 'none', color: textPrimary,
              fontFamily: 'JetBrains Mono', fontSize: '12px', lineHeight: 1.8,
            }}
            readOnly={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentStudio;
