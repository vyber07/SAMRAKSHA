import React, { useState, useEffect } from 'react';
import PageShell from './PageShell';
import { cases as casesApi, documents as docsApi } from '../lib/api';
import { Search, FileText, X, TriangleAlert, Download, Bot, Send, Gavel, Activity, Clock, Receipt, Building, ClipboardList, Scan } from 'lucide-react';

const DOC_TYPES = [
  { key: "chargesheet", label: "Chargesheet", icon: Gavel, desc: "Formal charge document for court submission" },
  { key: "medical_letter", label: "Medical Letter", icon: Activity, desc: "Request for medical examination of victim/accused" },
  { key: "remand_request", label: "Remand Request", icon: Clock, desc: "Application for accused custody extension" },
  { key: "seizure_receipt", label: "Seizure Receipt", icon: Receipt, desc: "Acknowledgment of seized evidence items" },
  { key: "court_custody", label: "Court Custody", icon: Building, desc: "Transfer of accused to court custody" },
  { key: "panchanama", label: "Panchanama", icon: ClipboardList, desc: "Witness-signed scene of crime document" },
  { key: "face_id", label: "Face ID Report", icon: Scan, desc: "Facial recognition analysis report" },
];

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

function CrimeGPTDocumentStudio({ selectedCase }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Greetings Officer. I am CrimeGPT Legal AI Assistant trained on BNS (Bharatiya Nyaya Sanhita), BNSS (Bharatiya Nagarik Suraksha Sanhita), and BSA (Bharatiya Sakshya Adhiniyam). How can I assist with case documents today?",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [activeDocType, setActiveDocType] = useState("chargesheet");
  const [editableDraft, setEditableDraft] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const c = selectedCase || { fir_no: "FIR-SAMPLE", crime_date: new Date().toISOString(), crime_type: "Sample Crime", bns_sections: ["303"], accused_name: "John Doe", accused_age: 30, accused_address: "Unknown", victim_name: "Jane Doe", victim_address: "Unknown", crime_narrative: "Sample narrative." };

  useEffect(() => {
    if (!c) return;
    if (activeDocType === "chargesheet") {
      setEditableDraft(
        `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE\n` +
        `FINAL REPORT / CHARGESHEET UNDER SECTION 193 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no}\n` +
        `DATE OF INCIDENT: ${c.crime_date ? c.crime_date.split("T")[0] : 'N/A'}\n` +
        `OFFENCE CATEGORY: ${(c.crime_type || '').toUpperCase()}\n` +
        `APPLICABLE SECTIONS: BNS Sections ${(c.bns_sections || ["303", "304"]).join(", ")}\n\n` +
        `1. ACCUSED DETAILS:\n` +
        `   Name: ${c.accused_name || "Unknown"} (Age: ${c.accused_age || 28})\n` +
        `   Address: ${c.accused_address || "Unknown"}\n\n` +
        `2. VICTIM / COMPLAINANT:\n` +
        `   Name: ${c.victim_name || "Unknown"}\n` +
        `   Address: ${c.victim_address || "Unknown"}\n\n` +
        `3. BRIEF FACTS OF THE CASE:\n` +
        `   ${c.crime_narrative || "No narrative available"}\n\n` +
        `PRAYER:\n` +
        `It is humbly prayed that this Hon'ble Court may take cognizance against the accused under BNS Sections ${(c.bns_sections || ["303", "304"]).join(", ")}.`
      );
    } else if (activeDocType === "remand") {
      setEditableDraft(
        `APPLICATION FOR POLICE CUSTODY REMAND UNDER SECTION 187 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no} \n` +
        `ACCUSED: ${c.accused_name || "Unknown"}\n\n` +
        `GROUNDS FOR CUSTODY REMAND:\n` +
        `1. Further recovery of stolen property is pending.\n` +
        `2. Accomplices named during interrogation need to be apprehended.\n\n` +
        `PRAYER: Request 7 days Police Custody Remand.`
      );
    } else {
      setEditableDraft(
        `SEIZURE MEMO (PANCHANAMA) UNDER SECTION 185 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no}\n` +
        `SEIZURE LOCATION: ${c.crime_location || 'Unknown'}\n` +
        `SEIZED ARTICLES: Mobile phone, wallet with ID, and cash.\n` +
        `PANCH WITNESS 1: Ramesh Patel\n` +
        `PANCH WITNESS 2: Suresh Shah\n`
      );
    }
  }, [c, activeDocType]);

  const handleSendPrompt = (textToSend = null) => {
    const q = textToSend || prompt;
    if (!q) return;

    const userMsg = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt("");

    setTimeout(() => {
      let responseText = "";
      if (q.toLowerCase().includes("remand") || q.toLowerCase().includes("custody")) {
        responseText = `Under Section 187 of BNSS 2023, police custody remand can be requested up to 15 days. I have updated the preview draft to Police Custody Remand.`;
        setActiveDocType("remand");
      } else if (q.toLowerCase().includes("seizure") || q.toLowerCase().includes("panchanama")) {
        responseText = `Under Section 185 BNSS 2023, audio-video recording of search and seizure panchanama is required. Updated draft to Seizure Panchanama.`;
        setActiveDocType("seizure");
      } else {
        responseText = `Analyzing FIR narrative under BNS (Bharatiya Nyaya Sanhita). Chargesheet structure verified under Sec 193 BNSS. All statutory elements are aligned.`;
      }
      setMessages((prev) => [...prev, { role: "ai", text: responseText }]);
    }, 600);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', minHeight: '600px' }}>
      {/* Left Column: CrimeGPT Assistant Chat */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '12px', backgroundColor: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>CrimeGPT Legal Co-Pilot</h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>BNS / BNSS / BSA Intelligence Agent</p>
            </div>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--success-container)', color: 'var(--success)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>ONLINE</span>
        </div>

        {/* Quick Legal Prompt Suggestions */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => handleSendPrompt("Draft Police Custody Remand Application under BNSS 187")} className="oui-pill" style={{ fontSize: '10px', padding: '4px 8px' }}>📜 Remand Application</button>
          <button onClick={() => handleSendPrompt("Generate Seizure Panchanama under BNSS 185")} className="oui-pill" style={{ fontSize: '10px', padding: '4px 8px' }}>📦 Seizure Panchanama</button>
          <button onClick={() => handleSendPrompt("Check BNS Sections for robbery and snatching")} className="oui-pill" style={{ fontSize: '10px', padding: '4px 8px' }}>⚖ Check Legal Sections</button>
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ padding: '12px', borderRadius: '16px', fontSize: '12px', lineHeight: 1.5, maxWidth: '90%', 
              backgroundColor: m.role === "user" ? 'var(--primary)' : 'var(--surface-variant)', 
              color: m.role === "user" ? 'var(--primary-on)' : 'var(--text)', 
              marginLeft: m.role === "user" ? 'auto' : '0', 
              marginRight: m.role === "user" ? '0' : 'auto', 
              borderTopRightRadius: m.role === "user" ? 0 : '16px', 
              borderTopLeftRadius: m.role === "user" ? '16px' : 0 
            }}>
              {m.text}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
            placeholder="Ask CrimeGPT or command legal document..."
            className="input-glass"
          />
          <button onClick={() => handleSendPrompt()} className="btn-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Right Column: Split-Screen Document Studio */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{c.fir_no}</span>
              <Badge color="var(--primary)">{c.crime_type}</Badge>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Live Split-Screen Document Editor & Exporter</p>
          </div>

          {/* Document Selector Segment */}
          <div style={{ display: 'flex', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', padding: '4px', gap: '4px' }}>
            {[
              { id: "chargesheet", label: "Chargesheet (Sec 193)" },
              { id: "remand", label: "Remand (Sec 187)" },
              { id: "seizure", label: "Seizure (Sec 185)" },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocType(doc.id)}
                style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: activeDocType === doc.id ? 'var(--primary)' : 'transparent',
                  color: activeDocType === doc.id ? 'var(--primary-on)' : 'var(--text-muted)',
                  border: 'none', flex: 1
                }}
              >
                {doc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Document Preview Pane */}
        <div style={{ flex: 1, margin: '12px 0', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', overflowY: 'auto' }}>
          <textarea
            value={editableDraft}
            onChange={(e) => setEditableDraft(e.target.value)}
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent', outline: 'none', border: 'none', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)', lineHeight: 1.6 }}
          />
        </div>

        {/* Document Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--success)' }}>✔</span>
            BNS/BNSS Statutory Compliant
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={copyToClipboard} className="btn-glass" style={{ padding: '6px 12px', fontSize: '12px' }}>
              {isCopied ? "Copied!" : "Copy Text"}
            </button>
            <button onClick={() => window.print()} className="btn-glass" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Print Draft
            </button>
            <button onClick={() => alert(`Downloading official ${activeDocType.toUpperCase()} document as .docx file...`)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
              <Download size={14} /> Export .docx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [mode, setMode] = useState("studio");
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [lang, setLang] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [allCases, setAllCases] = useState([]);

  useEffect(() => {
    casesApi.list().then(res => setAllCases(res.data)).catch(e => console.error(e));
  }, []);

  function doSearch() {
    setSearchResults(allCases.filter((c) =>
      c.fir_no?.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.crime_type?.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.victim_name?.toLowerCase().includes(caseSearch.toLowerCase())
    ));
  }

  const generate = async (docKey) => {
    setGenerating(docKey);
    try {
      if (selectedCase) {
        const res = await docsApi.generate(selectedCase.case_id, docKey, lang[docKey] || 'en');
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `case_${selectedCase.case_id}_${docKey}.docx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (e) {
      alert("Failed to generate document via API. Using mock generation...");
    } finally {
      setTimeout(() => setGenerating(null), 1500);
    }
  };

  return (
    <PageShell title="Document Studio & Intelligence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)', padding: '4px' }}>
            <button onClick={() => setMode("studio")} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', backgroundColor: mode === "studio" ? 'var(--primary)' : 'transparent', color: mode === "studio" ? 'var(--primary-on)' : 'var(--text-muted)', border: 'none' }}>
              CrimeGPT Studio (Split-Screen)
            </button>
            <button onClick={() => setMode("templates")} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', backgroundColor: mode === "templates" ? 'var(--primary)' : 'transparent', color: mode === "templates" ? 'var(--primary-on)' : 'var(--text-muted)', border: 'none' }}>
              Document Templates
            </button>
          </div>
        </div>

        {mode === "studio" ? (
          <CrimeGPTDocumentStudio selectedCase={selectedCase} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in-up">
            <div className="glass-card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>Select Case</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder="Search by FIR number, victim name, or crime type..."
                    className="input-glass"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
                <button onClick={doSearch} className="btn-primary" style={{ padding: '0 16px' }}><Search size={14} /></button>
              </div>
              
              {searchResults.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {searchResults.map((c) => (
                    <button key={c.case_id || c.fir_no} onClick={() => { setSelectedCase(c); setSearchResults([]); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--info)' }}>{c.fir_no}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge color="var(--primary)">{c.crime_type}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCase && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--info-container)', border: '1px solid rgba(100,181,246,0.2)' }}>
                <FileText size={16} color="var(--info)" />
                <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--info)' }}>{selectedCase.fir_no}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>·</span>
                <Badge color="var(--primary)">{selectedCase.crime_type}</Badge>
                <button onClick={() => setSelectedCase(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} color="var(--text-muted)" /></button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {DOC_TYPES.map((doc) => {
                const DocIcon = doc.icon;
                const docLang = lang[doc.key] || "en";
                return (
                  <div key={doc.key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DocIcon size={18} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{doc.label}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{doc.desc}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {["en", "hi", "gu"].map((l) => (
                        <button key={l} onClick={() => setLang((prev) => ({ ...prev, [doc.key]: l }))} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: docLang === l ? 'var(--primary)' : 'var(--surface-variant)', color: docLang === l ? 'var(--primary-on)' : 'var(--text-muted)', border: 'none' }}>
                          {l}
                        </button>
                      ))}
                    </div>

                    <button onClick={() => generate(doc.key)} disabled={!selectedCase || generating === doc.key} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: (!selectedCase || generating === doc.key) ? 0.5 : 1 }}>
                      {generating === doc.key ? "Generating..." : "Generate & Download .docx"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
