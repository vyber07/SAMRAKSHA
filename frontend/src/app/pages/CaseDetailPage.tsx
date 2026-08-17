import React, { useState } from "react";
import { ShieldAlert, Info, MapPin, ChevronLeft, ChevronRight, Map, Clock, Zap, Target, LayoutGrid, CheckCircle, FlameKindling, Building, Plus, AlertCircle, FileText, Share2, Printer, Activity, Briefcase, Camera, Video, Navigation, Shield, User, Bot, Send } from "lucide-react";
import { useApp, PageHeader, Card, Badge, cn, Button, Modal, GenerateDocumentModal, VoiceInputWidget, STATUS_CONFIG, formatDate, formatDateTime, getCsrfToken } from "../App";


function CaseDetailPage() {
  const { params, navigate, cases, officer } = useApp();
  const c = cases.find((x: any) => x.case_id === params.case_id);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [docType, setDocType] = useState("chargesheet");
  const [docLang, setDocLang] = useState("en");
  const [showGenDocModal, setShowGenDocModal] = useState(false);

  // Module 2 State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState("note");
  const [newNote, setNewNote] = useState("");
  const [evidenceTag, setEvidenceTag] = useState("");
  const [localEntries, setLocalEntries] = useState<any[]>([]);

  if (!c) return <div className="text-center py-20" style={{ color: "var(--muted-foreground)" }}>Case not found</div>;

  const sc = STATUS_CONFIG[c.case_status];

  function askAI() {
    if (!aiQuestion) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiAnswer(`Based on the case FIR ${c.fir_no}: The crime was reported at ${c.crime_location} on ${formatDate(c.crime_date)}. The applicable sections are ${[...(c.bns_sections || []), ...(c.bnss_sections || [])].join(", ")}. The investigation is ongoing with ${c.diary_entries?.length || 0} diary entries recorded.`);
      setAiLoading(false);
    }, 1200);
  }

  const handleAddDiaryEntry = async () => {
    if (!newNote) return;
    try {
      const res = await fetch(`/api/v1/cases/${c.case_id}/diary`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        body: JSON.stringify({ entry_type: "note", description: newNote }),
      });
      if (!res.ok) throw new Error("Unable to save diary entry");
      const created = await res.json();
      setLocalEntries((prev) => [created, ...prev]);
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
            <Card className="flex-1 flex flex-col h-full min-h-[220px]">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 shrink-0" style={{ color: "var(--muted-foreground)" }}>
                <Bot size={14} color="#3B82F6" /> Chat With Me
              </h3>
              
              <div className="flex-1 overflow-y-auto mb-3 flex flex-col justify-end">
                {aiAnswer && (
                  <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "var(--muted-foreground)" }}>
                    {aiAnswer}
                  </div>
                )}
                {aiLoading && <div className="mt-2 h-3 w-full rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />}
              </div>

              <div className="flex flex-col gap-2 shrink-0 mt-auto">
                <div className="flex gap-2">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about this case..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                  />
                  <button onClick={askAI} className="p-2 rounded-lg cursor-pointer" style={{ backgroundColor: "var(--color-primary)" }}>
                    <Send size={14} color="#fff" />
                  </button>
                </div>
                <div className="text-[10px] text-center text-[var(--muted-foreground)]">
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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Crime Type</p><p style={{ color: "var(--muted-foreground)" }}>{c.crime_type}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Date & Time</p><p style={{ color: "var(--muted-foreground)" }}>{formatDateTime(c.crime_date)}</p></div>
                <div className="col-span-2"><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Location</p><p style={{ color: "var(--muted-foreground)" }}>{c.crime_location}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Coordinates</p><p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{c.crime_lat?.toFixed(4) || "N/A"}, {c.crime_lon?.toFixed(4) || "N/A"}</p></div>
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Narrative</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.crime_narrative}</p>
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
