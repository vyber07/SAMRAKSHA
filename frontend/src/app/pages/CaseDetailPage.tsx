import React, { useState } from "react";
import { ShieldAlert, Info, MapPin, ChevronLeft, ChevronRight, Map, Clock, Zap, Target, LayoutGrid, CheckCircle, FlameKindling, Building, Plus, AlertCircle, FileText, Share2, Printer, Activity, Briefcase, Camera, Video, Navigation, Shield, User, Bot, Send } from "lucide-react";
import { useApp, PageHeader, Card, Badge, cn, Button, Modal, GenerateDocumentModal, VoiceInputWidget, STATUS_CONFIG, formatDate, formatDateTime, getCsrfToken } from "../App";


function CaseDetailPage() {
  const { params, navigate, cases, officer } = useApp();
  const c = cases.find((x: any) => x.case_id === params.case_id);
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [docType, setDocType] = useState("chargesheet");
  const [docLang, setDocLang] = useState("en");
  const [showGenDocModal, setShowGenDocModal] = useState(false);

  // Module 2 State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState("note");
  const [newNote, setNewNote] = useState("");
  const [evidenceTag, setEvidenceTag] = useState("");
  const [localEntries, setLocalEntries] = useState<any[]>(() => {
    return c?.diary_entries?.map((e: any, i: number) => ({
      step: (c.diary_entries?.length || 0) - i,
      status: "completed",
      title: (e.entry_type || "NOTE").toUpperCase(),
      ts: e.ts,
      description: e.description,
      officer: e.officer_name || "Investigating Officer",
      attachments: e.location ? [e.location] : []
    })) || [];
  });

  if (!c) return <div className="text-center py-20" style={{ color: "var(--muted-foreground)" }}>Case not found</div>;

  const sc = STATUS_CONFIG[c.case_status];

  async function askAI() {
    if (!aiQuestion.trim()) return;
    const q = aiQuestion;
    setAiQuestion("");
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);
    
    try {
      const res = await fetch("/api/v1/assistant/query", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        body: JSON.stringify({ mode: "this_case", query: q, case_id: c.case_id, language: "en" })
      });
      if (!res.ok) throw new Error("Assistant request failed");
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'ai', text: data.response }]);
    } catch (e: any) {
      setChatHistory((prev) => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setAiLoading(false);
    }
  }

  const handleAddDiaryEntry = async () => {
    if (!newNote) return;
    try {
      const res = await fetch(`/api/v1/cases/${c.case_id}/diary`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        body: JSON.stringify({ entry_type: newEntryType, description: newNote, location: evidenceTag }),
      });
      if (!res.ok) throw new Error("Unable to save diary entry");
      const created = await res.json();
      const newLocal = {
        step: localEntries.length + 1,
        status: "completed",
        title: (created.entry_type || newEntryType || "NOTE").toUpperCase(),
        ts: created.ts || new Date().toISOString(),
        description: created.description || newNote,
        officer: "Investigating Officer",
        attachments: created.location ? [created.location] : evidenceTag ? [evidenceTag] : []
      };
      setLocalEntries((prev) => [newLocal, ...prev]);
      setNewNote("");
      setEvidenceTag("");
      setIsDrawerOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back + breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("cases")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium transition-all cursor-pointer"
            style={{ backgroundColor: "var(--input)", color: "var(--muted-foreground)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft size={14} /> Back to Cases
          </button>
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight size={14} color="#64748B" />
            <span style={{ color: "var(--muted-foreground)" }}>{c.fir_no}</span>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenDocModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-rounded text-base">description</span>
            Generate Document
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-rounded text-base">edit_calendar</span>
            Quick-Log Case Diary
          </button>
        </div>
      </div>

      {/* Header strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</h1>
        <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
        <Badge color="#3B82F6">{c.crime_type}</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Left */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                <User size={14} color="#3B82F6" /> Victim Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Name", value: c.victim_name },
                  { label: "Age", value: c.victim_age ? `${c.victim_age} years` : "—" },
                  { label: "Gender", value: c.victim_gender || "—" },
                  { label: "Phone", value: c.victim_phone || "—" },
                  { label: "Address", value: c.victim_address },
                  { label: "Injury", value: c.victim_injury ? "Yes" : "No" },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{field.label}</p>
                    <p style={{ color: field.label === "Injury" && c.victim_injury ? "#EF4444" : "#CBD5E1" }}>{field.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Right */}
          <div className="flex flex-col h-full">
            {/* Chat With Me */}
            <Card className="flex-1 flex flex-col h-full min-h-[300px] !p-0 overflow-hidden bg-slate-900 border border-white/5">
              <div className="px-4 py-3 border-b border-white/5 bg-slate-800/50 flex items-center justify-between shadow-sm shrink-0">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                  <Bot size={16} className="text-blue-500" /> Case AI Assistant
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Online</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <Bot size={32} className="text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400 max-w-[200px]">Ask me to summarize the incident, extract suspect details, or cross-reference evidence.</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900 border-t border-white/5 shrink-0">
                <div className="flex items-end gap-2 bg-slate-800 rounded-2xl border border-white/10 p-1.5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-inner">
                  <textarea
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Message AI Assistant..."
                    className="flex-1 max-h-24 min-h-[36px] bg-transparent resize-none px-2 py-1.5 text-[13px] text-slate-200 placeholder:text-slate-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        askAI();
                      }
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0 pb-0.5">
                    <VoiceInputWidget 
                      onTranscript={(txt) => setAiQuestion((prev) => prev + (prev ? " " : "") + txt)} 
                      compact={true} 
                    />
                    <button 
                      onClick={askAI}
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-[9px] text-center text-slate-500 mt-2">
                  AI answers are for review only. Verify with official records.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                <MapPin size={14} color="#F97316" /> Crime Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Crime Type</p><p style={{ color: "var(--muted-foreground)" }}>{c.crime_type}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Date & Time</p><p style={{ color: "var(--muted-foreground)" }}>{formatDateTime(c.crime_date)}</p></div>
                <div className="col-span-2"><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Location</p><p style={{ color: "var(--muted-foreground)" }}>{c.crime_location}</p></div>
                
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Accused Name</p><p style={{ color: "var(--muted-foreground)" }}>{c.accused_name || "Unknown/Pending"}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Coordinates</p><p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{c.crime_lat?.toFixed(4) || "N/A"}, {c.crime_lon?.toFixed(4) || "N/A"}</p></div>
                <div className="col-span-2"><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Applied Law Sections (BNS/BNSS)</p><p style={{ color: "var(--muted-foreground)" }}>
                  {c.bns_sections?.length || c.bnss_sections?.length 
                    ? [...(c.bns_sections || []), ...(c.bnss_sections || [])].join(", ") 
                    : "Not specified"}
                </p></div>
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Narrative</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.crime_narrative}</p>
              </div>

              <h3 className="text-sm font-semibold mt-6 mb-4 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                <User size={14} color="#3B82F6" /> Victim Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Name</p><p style={{ color: "var(--muted-foreground)" }}>{c.victim_name}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Phone</p><p style={{ color: "var(--muted-foreground)" }}>{c.victim_phone || "—"}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Age/Gender</p><p style={{ color: "var(--muted-foreground)" }}>{c.victim_age ? `${c.victim_age} yrs` : "—"} / {c.victim_gender || "—"}</p></div>
                <div className="col-span-2"><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Address</p><p style={{ color: "var(--muted-foreground)" }}>{c.victim_address}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Injury</p><p style={{ color: c.victim_injury ? "#EF4444" : "#CBD5E1" }}>{c.victim_injury ? "Yes" : "No"}</p></div>
              </div>
            </Card>
          </div>

          <div>
            {/* Module 2: Interactive Case Diary Timeline */}
            <Card className="h-full flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 shrink-0">
                <h3 className="text-sm font-bold flex items-center gap-2 text-amber-500">
                  <span className="material-symbols-rounded text-lg">route</span>
                  Case Diary
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                  {localEntries.length} Investigation Milestones
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 flex-1 overflow-y-auto">
                {localEntries.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Step Marker Circle */}
                    <div className={`absolute -left-[30px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      item.status === "completed"
                        ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                        : "bg-blue-600 border-blue-400 text-white animate-pulse"
                    }`}>
                      {item.step}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-100">{item.title}</p>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{formatDateTime(item.ts)}</span>
                      </div>
                      <p className="text-xs text-[var(--foreground)] leading-relaxed">{item.description}</p>
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-[var(--muted-foreground)] font-medium">Recorded by: <strong className="text-blue-300">{item.officer}</strong></span>
                        {item.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.attachments.map((att, aIdx) => (
                              <span key={aIdx} className="px-2 py-0.5 rounded bg-white/5 text-amber-300 font-mono text-[9px] border border-white/10 flex items-center gap-1">
                                <span className="material-symbols-rounded text-[10px]">attach_file</span>
                                {att}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Module 2: Quick-Log Action Drawer Modal */}
      {isDrawerOpen && (
        <Modal open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Quick-Log Case Diary Entry">
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[var(--foreground)]">Entry Category</label>
              <select
                value={newEntryType}
                onChange={(e) => setNewEntryType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-[var(--foreground)] outline-none"
              >
                <option value="note">General Investigation Note</option>
                <option value="photo">Photo Evidence Tag</option>
                <option value="audio">Audio Interrogation Log</option>
                <option value="seizure">Property Seizure Record</option>
                <option value="arrest">Arrest & Panchanama Update</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--foreground)]">Officer Investigation Notes</label>
                <VoiceInputWidget onTranscript={(txt) => setNewNote((prev) => prev + " " + txt)} />
              </div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                placeholder="Type or dictate official diary observation..."
                className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-[var(--foreground)] outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[var(--foreground)]">Attachment File / Evidence Tag</label>
              <input
                type="text"
                value={evidenceTag}
                onChange={(e) => setEvidenceTag(e.target.value)}
                placeholder="e.g. EVID-GOLD-RECOVERY-04.jpg"
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-[var(--foreground)] outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--foreground)] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDiaryEntry}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
              >
                Append to Case Journey Tree
              </button>
            </div>
          </div>
        </Modal>
      )}

      <GenerateDocumentModal
        open={showGenDocModal}
        onClose={() => setShowGenDocModal(false)}
        caseNo={c.fir_no}
      />
    </div>
  );
}

export default CaseDetailPage;
