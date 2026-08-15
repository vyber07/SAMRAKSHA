import React, { useState } from "react";
import { User, FileText, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Mic, HelpCircle, Save, Plus, X, Check, Cpu } from "lucide-react";
import { useApp, PageHeader, Card, Input, Select, Button, cn, Chip, Badge, Modal, VoiceInputWidget, AICoPilotWidget, AHMEDABAD_WARDS } from "../App";


function FIREntryPage() {
  const { navigate, token } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestedSections, setSuggestedSections] = useState<Array<{section: string, reason: string}>>([]);

  const [form, setForm] = useState({
    victim_name: "", victim_address: "", victim_phone: "", victim_age: "",
    victim_gender: "Male", victim_injury: false,
    crime_type: "Theft", crime_code: "", crime_narrative: "",
    crime_date: "", crime_location: "", crime_lat: "23.0225", crime_lon: "72.5714",
    ward: "Satellite", severity: "3", language: "en",
    accused_name: "", accused_address: "", accused_age: "",
  });

  function update(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function suggestSections() {
    if (!form.crime_narrative) return;
    try {
      const res = await fetch(`/api/v1/legal/search?q=${encodeURIComponent(form.crime_narrative.slice(0, 50))}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setSuggestedSections(data.map(d => ({ section: d.section || d.title, reason: d.description || d.reason || "Matched from database" })).slice(0, 4));
      else setSuggestedSections([{ section: "BNS 303", reason: "Fallback suggestion" }]);
    } catch { setSuggestedSections([{ section: "BNS 303", reason: "Fallback suggestion" }]); }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, bns_sections: suggestedSections.map(s => s.section) })
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setTimeout(() => navigate("cases"), 2000);
    } catch { alert("Submission failed"); }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>FIR Registered Successfully</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>FIR-2026-{String([].length + 1).padStart(3, "0")} · Redirecting to cases...</p>
      </div>
    );
  }

  const steps = ["Victim Details", "Crime Details", "Review & Submit"];

  const canProceed = step === 0
    ? !!form.victim_name && !!form.victim_address
    : step === 1
    ? !!form.crime_narrative && !!form.crime_date && !!form.crime_location
    : true;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <PageHeader title="Register New FIR" subtitle="Complete all sections to submit" />

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: i < step ? "#22C55E" : i === step ? "#3B82F6" : "rgba(255,255,255,0.08)",
                  color: i <= step ? "#fff" : "#64748B",
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <p className="text-[10px] mt-1 text-center" style={{ color: i === step ? "#3B82F6" : "#64748B" }}>{s}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 -mt-5" style={{ backgroundColor: i < step ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>Victim Information</h3>
            <Input label="Full Name *" value={form.victim_name} onChange={(v) => update("victim_name", v)} placeholder="Victim's full name" />
            <Input label="Address *" value={form.victim_address} onChange={(v) => update("victim_address", v)} placeholder="Complete address" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={form.victim_phone} onChange={(v) => update("victim_phone", v)} placeholder="10-digit mobile" />
              <Input label="Age" value={form.victim_age} onChange={(v) => update("victim_age", v)} type="number" placeholder="Age in years" />
            </div>
            <Select label="Gender" value={form.victim_gender} onChange={(v) => update("victim_gender", v)}
              options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.victim_injury} onChange={(e) => update("victim_injury", e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "#EF4444" }} />
              <span className="text-sm" style={{ color: form.victim_injury ? "#EF4444" : "#CBD5E1" }}>
                Victim sustained injuries
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>Crime Information</h3>
            
            <Select label="Crime Type *" value={form.crime_type} onChange={(v) => update("crime_type", v)}
              options={["Theft","Robbery","Snatching","Assault","Murder","Rape","Kidnapping","Cyber Crime","Drug Offense","Stalking","Extortion","Riot","Other"]
                .map((t) => ({ value: t, label: t }))} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium block" style={{ color: "var(--muted-foreground)" }}>Narrative *</label>
                <VoiceInputWidget onTranscript={(txt) => update("crime_narrative", form.crime_narrative + " " + txt)} />
              </div>
              <textarea
                value={form.crime_narrative}
                onChange={(e) => update("crime_narrative", e.target.value)}
                rows={5}
                placeholder="Describe the crime incident in detail or use voice input..."
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Button onClick={suggestSections} variant="outlined" size="sm">
                  <Cpu size={13} /> Suggest Legal Sections BNS
                </Button>
                <AICoPilotWidget form={form} update={update} />
              </div>
              {suggestedSections.length > 0 && (
                <div className="mt-2 p-3 rounded-xl flex flex-col gap-2 bg-[var(--popover)] border border-[var(--border)] shadow-sm">
                  {suggestedSections.map((s, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <span className="inline-flex w-max items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-[var(--border)] text-[var(--primary)] bg-[var(--input)]">
                        {s.section}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] pl-1">{s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Crime Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.crime_date}
                  onChange={(e) => update("crime_date", e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <Input label="Crime Location *" value={form.crime_location} onChange={(v) => update("crime_location", v)} placeholder="Enter exact location of incident" />
            </div>

            <Select label="Police Station *" value={form.ward} onChange={(v) => update("ward", v)}
              options={AHMEDABAD_WARDS.map((w) => ({ value: w, label: w }))} />

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Severity *</label>
              <div className="flex gap-3">
                {[1,2,3,4,5].map((n) => (
                  <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                    <input type="radio" name="severity" value={String(n)} checked={form.severity === String(n)} onChange={() => update("severity", String(n))} style={{ accentColor: "#3B82F6" }} />
                    <span className="text-xs" style={{ color: form.severity === String(n) ? "#3B82F6" : "#64748B" }}>
                      {["Minor","Low","Medium","High","Critical"][n - 1]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Select label="Report Language" value={form.language} onChange={(v) => update("language", v)}
              options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "gu", label: "Gujarati" }]} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>Accused Details <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(If known)</span></h3>
              <div className="flex flex-col gap-3">
                <Input label="Accused Name" value={form.accused_name} onChange={(v) => update("accused_name", v)} placeholder="Full name if known" />
                <Input label="Accused Address" value={form.accused_address} onChange={(v) => update("accused_address", v)} placeholder="Last known address" />
                <Input label="Accused Age" value={form.accused_age} onChange={(v) => update("accused_age", v)} type="number" placeholder="Approximate age" />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>Review Summary</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Victim", value: form.victim_name },
                  { label: "Crime Type", value: form.crime_type },
                  { label: "Location", value: form.crime_location },
                  { label: "Ward", value: form.ward },
                  { label: "Severity", value: `${form.severity}/5` },
                  { label: "Language", value: { en: "English", hi: "Hindi", gu: "Gujarati" }[form.language] || form.language },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>{row.label}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {suggestedSections.length > 0 && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p className="text-xs mb-2" style={{ color: "#A78BFA" }}>Suggested Legal Sections</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSections.map((s) => <Chip key={s.section} style={{ color: "#C4B5FD", borderColor: "rgba(139,92,246,0.3)" }}>{s.section}</Chip>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate("cases")} size="md">
          <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed} size="md">
            Next <ChevronRight size={14} />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} size="md">
            {submitting ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle size={14} />}
            Submit FIR
          </Button>
        )}
      </div>
    </div>
  );
}

export default FIREntryPage;
