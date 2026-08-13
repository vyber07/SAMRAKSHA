import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, BookOpen, TrendingUp, FileText, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { icon: BookOpen, label: 'BNS Section Equivalence', prompt: 'What is the BNS equivalent of IPC Section 420 (cheating)? Explain the key differences.' },
  { icon: FileText, label: 'Draft Bail Objection', prompt: 'Draft a bail objection outline for an accused in a robbery case under BNS §309 with prior criminal record.' },
  { icon: TrendingUp, label: 'Crime Pattern Analysis', prompt: 'Analyze the crime pattern for Satellite Ward based on recent FIR data. What preventive measures are recommended?' },
  { icon: Shield, label: 'Chargesheet Requirements', prompt: 'What are the mandatory requirements for filing a chargesheet under Section 193 of BNSS 2023?' },
];

const CANNED_RESPONSES: Record<string, string> = {
  default: `I'm **CrimeGPT**, your AI legal assistant for Indian criminal law under the new criminal justice framework — **BNS 2023, BNSS 2023, and BSA 2023**.

I can help you with:
• Section equivalences between old IPC/CrPC and the new BNS/BNSS/BSA
• Drafting legal documents (chargesheet outlines, bail objections, seizure memos)
• Crime pattern queries and case analysis
• Procedural guidance under BNSS 2023

What would you like to know today?`,

  bns420: `**BNS Section Equivalent for IPC §420 (Cheating):**

Under the **Bharatiya Nyaya Sanhita (BNS) 2023**, the equivalent provision is:

> **§ 318 — Cheating**
> Whoever, by deceiving any person, fraudulently or dishonestly induces the delivery of property or commission of any act leading to damage — punishment up to **7 years** + fine.

**Key changes from IPC §420:**
- BNS §318 consolidates cheating provisions (old §§415–420)
- Enhanced punishment: **3→7 years** imprisonment in aggravated cases
- Now includes digital/cyber-fraud scenarios explicitly
- Linked with **IT Act §66D** for impersonation via digital means

**Practical Note:** For cyber fraud FIRs, register under both **BNS §318** and **IT Act §66C/66D** for comprehensive coverage.`,

  bailobjection: `**Bail Objection Outline — Robbery Case (BNS §309)**

**IN THE COURT OF [MAGISTRATE/SESSIONS JUDGE], AHMEDABAD**

**FIR No.:** [Insert FIR Number]
**PS:** [Police Station]
**Sections:** BNS §309, §311

---

**GROUNDS OF OBJECTION TO BAIL:**

**1. Gravity of Offence**
The offence of robbery under BNS §309 carries a punishment of up to **10 years** rigorous imprisonment and fine. The severity of the offence warrants denial of bail.

**2. Criminal Antecedents**
The accused has prior criminal history — FIR No. [previous FIR] — demonstrating a pattern of recidivism. Bail would pose a risk to the community.

**3. Risk of Tampering with Evidence**
Witness statements are still being recorded. Release may allow the accused to intimidate witnesses (§195 BNSS).

**4. Flight Risk**
The accused has no fixed place of residence / has connections outside jurisdiction.

**5. Investigation Ongoing**
Chargesheet not yet filed. Custodial interrogation is necessary to recover stolen property.

**PRAYER:** It is respectfully prayed that the bail application be rejected in the interest of justice.

*Submitted by IO: [Name], [Designation], [PS Name]*`,

  chargesheet: `**Chargesheet Requirements under BNSS §193 (2023):**

A chargesheet (Complaint/Police Report) under **Section 193 BNSS** must contain:

**Mandatory Contents:**
1. **FIR details** — FIR number, date, police station, registering officer
2. **Nature of offence** — Specific sections of BNS/other Acts charged
3. **Accused particulars** — Name, parentage, age, address, occupation
4. **Victim/Complainant details**
5. **Brief facts** of the case
6. **List of witnesses** (prosecution witnesses — PW list)
7. **List of material objects** (exhibits list — MO)
8. **Medical examination report** (if applicable)
9. **FSL report reference** (if any)
10. **Arrest memo, remand orders**

**Timeline:** Must be filed within:
- **60 days** from arrest for offences punishable with imprisonment up to 7 years
- **90 days** for offences carrying more than 7 years (else bail by default under §187(2) BNSS)

**New BNSS requirement:** Chargesheet can now be submitted **electronically** to court with digital signatures of IO.`,
};

function getResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('420') || q.includes('cheating') || q.includes('equivalen')) return CANNED_RESPONSES.bns420;
  if (q.includes('bail') || q.includes('objection')) return CANNED_RESPONSES.bailobjection;
  if (q.includes('chargesheet') || q.includes('193') || q.includes('bnss')) return CANNED_RESPONSES.chargesheet;
  if (q.includes('pattern') || q.includes('satellite') || q.includes('crime trend')) {
    return `**Crime Pattern Analysis — Satellite Ward (Last 30 Days):**

📊 **Incident Summary:**
- Total FIRs: **23**
- Dominant type: **Theft (48%)**, followed by **Assault (22%)**
- Peak hours: **18:00 – 22:00 IST**
- Risk Score: **82/100** (ELEVATED)

🔍 **Pattern Observations:**
- Concentration near Shyamal Cross Rd and Satellite Road junction
- 3 theft cases linked to same MO (snatching from two-wheelers at signal)
- CCTV Node CAM-001 detected suspicious vehicle repeatedly

📋 **Recommended Actions:**
1. Deploy **PCR-14** for focused night patrolling (18:00–23:00)
2. Alert CCTV control room for vehicle pattern tracking
3. Conduct **nakabandi** at Satellite-Shyamal junction
4. Issue beat officer advisories for signal watch`;
  }
  return `Thank you for your query. Based on available case law and the new criminal justice framework (BNS/BNSS/BSA 2023):

${input.length > 30 ? `Regarding your question about "${input.substring(0, 60)}..." — ` : ''}

This requires reference to the applicable provisions under the **Bharatiya Nyaya Sanhita 2023**. The relevant sections would depend on the specific facts of the case. I recommend:

1. Consulting the official BNS/BNSS/BSA bare acts
2. Cross-referencing with the High Court's latest guidance on this matter
3. Consulting with the PP's office before proceeding

**Disclaimer:** This is an AI-assisted advisory only. Always verify with official court records and your PP before taking legal action.`;
}

const AIAssistant: React.FC = () => {
  const publishedPage = usePublishedPage('ai-assistant');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: CANNED_RESPONSES.default,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: ts };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));
    const response = getResponse(msg);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={idx} style={{ fontWeight: 700, marginBottom: '4px', color: textPrimary }}>{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.includes('**')) {
        const parts = line.split('**');
        return <div key={idx} style={{ marginBottom: '2px', color: textPrimary }}>
          {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p)}
        </div>;
      }
      if (line.startsWith('> ')) {
        return <div key={idx} style={{ marginBottom: '4px', paddingLeft: '12px', borderLeft: '3px solid #8B5CF6', color: isDark ? '#c4b5fd' : '#7c3aed', fontStyle: 'italic' }}>{line.replace('> ', '')}</div>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <div key={idx} style={{ marginBottom: '2px', paddingLeft: '12px', color: textPrimary }}>
          <span style={{ color: isDark ? '#A8CAFF' : '#004B87', marginRight: '6px' }}>•</span>{line.replace(/^[-•] /, '')}
        </div>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={idx} style={{ marginBottom: '2px', paddingLeft: '12px', color: textPrimary }}>{line}</div>;
      }
      if (line === '---') return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${cardBorder}`, margin: '8px 0' }} />;
      if (line === '') return <div key={idx} style={{ height: '6px' }} />;
      return <div key={idx} style={{ marginBottom: '2px', color: textPrimary }}>{line}</div>;
    });
  };

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: `1px solid ${cardBorder}`,
        background: cardBg, backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(139,92,246,0.35)',
          }}>
            <Bot size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '18px', color: textPrimary }}>CrimeGPT</h1>
            <p style={{ fontSize: '11px', color: textMuted }}>AI Legal Assistant · BNS / BNSS / BSA 2023</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>ONLINE</span>
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '12px 24px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.07)',
              border: `1px solid rgba(139,92,246,0.2)`, borderRadius: '20px',
              fontSize: '12px', fontWeight: 600, color: '#8B5CF6', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            <qp.icon size={13} />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #004B87, #0063B2)'
                : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '70%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #004B87, #0063B2)'
                : cardBg,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${msg.role === 'user' ? 'transparent' : cardBorder}`,
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: '12px 16px',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,75,135,0.1)',
            }}>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: msg.role === 'user' ? 'white' : textPrimary }}>
                {msg.role === 'user' ? msg.content : renderContent(msg.content)}
              </div>
              <div style={{ fontSize: '10px', color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : textMuted, marginTop: '6px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
              borderRadius: '4px 16px 16px 16px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Loader2 size={14} style={{ color: '#8B5CF6', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px', color: textMuted }}>CrimeGPT is analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px', color: textMuted,
        borderTop: `1px solid ${cardBorder}`,
        background: isDark ? 'rgba(6,13,26,0.5)' : 'rgba(240,244,248,0.5)',
      }}>
        <AlertCircle size={11} />
        AI answers are for officer review only. Always verify with official court records before legal action.
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        background: cardBg, backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${cardBorder}`,
        display: 'flex', gap: '10px', alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about BNS sections, draft legal documents, query crime patterns..."
            rows={1}
            style={{
              width: '100%', padding: '12px 16px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
              border: `1px solid ${cardBorder}`, borderRadius: '12px',
              color: textPrimary, fontSize: '14px', outline: 'none',
              resize: 'none', fontFamily: 'Plus Jakarta Sans',
              lineHeight: 1.5,
            }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: !input.trim() || loading ? 'rgba(0,75,135,0.3)' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0,
            boxShadow: !input.trim() || loading ? 'none' : '0 4px 15px rgba(139,92,246,0.4)',
          }}
        >
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
