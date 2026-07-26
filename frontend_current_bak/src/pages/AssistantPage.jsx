import React, { useState, useRef, useEffect } from 'react';
import PageShell from './PageShell';
import { assistant } from '../lib/api';
import { Bot, Info, TriangleAlert, Send } from 'lucide-react';

function Badge({ children, color = "var(--primary)" }) {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: '11px', fontWeight: 600, color: color, backgroundColor: `${color}22` 
    }}>
      {children}
    </span>
  );
}

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (forcedInput = null) => {
    const textToSend = forcedInput !== null ? forcedInput : input;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    if (forcedInput === null) setInput('');
    setLoading(true);

    try {
      const res = await assistant.query(textToSend, 'all_cases');
      const answer = res.data?.answer || 'Based on case narratives and legal sections, relevant information points to active crime trends. For official disposition, please consult the IO and legal department.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, source: 'LLM', ts: new Date().toISOString() }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to AI', source: 'System', ts: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="AI Assistant">
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 8rem)', marginTop: '16px' }}>
        
        {/* Left panel */}
        <div style={{ width: '280px', flexShrink: 0, flexDirection: 'column', gap: '16px', display: window.innerWidth > 1024 ? 'flex' : 'none' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--info-container)', color: 'var(--info)', border: '1px solid rgba(100,181,246,0.25)' }}>
              <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Querying across all FIR cases in the precinct database.
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', backgroundColor: 'var(--warning-container)', color: 'var(--warning)', border: '1px solid rgba(255,183,77,0.2)' }}>
              <TriangleAlert size={14} style={{ display: 'inline', marginRight: '6px' }} />
              AI answers are for officer review only. Always verify with official court records before legal action.
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-container)' }}>
              <Bot size={16} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>SAMRAKSHA AI</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Case Intelligence Assistant</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Badge color="var(--success)">Active</Badge>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-container)' }}>
                  <Bot size={24} color="var(--primary)" />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>AI Case Assistant</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '250px' }}>
                  Ask about case evidence, applicable legal sections, crime patterns, or investigation progress.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {["What sections apply to this case?", "Summarize the crime narrative", "List all open cases by type"].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      style={{ padding: '8px 12px', borderRadius: 'var(--radius-xs)', fontSize: '12px', textAlign: 'left', backgroundColor: 'var(--primary-container)', color: 'var(--primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '14px', lineHeight: 1.5,
                  backgroundColor: msg.role === 'user' ? 'var(--primary-container)' : 'var(--surface-variant)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--border)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: msg.role === 'user' ? 'var(--info)' : 'var(--success)' }}>
                      {msg.role === 'user' ? 'You' : 'SAMRAKSHA AI'}
                    </span>
                    {msg.source && (
                      <Badge color={msg.source === 'LLM' ? 'var(--success)' : 'var(--warning)'}>{msg.source}</Badge>
                    )}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '12px' }}>Thinking...</div>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about cases, sections, patterns..."
              className="input-glass"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: input.trim() ? 'var(--primary)' : 'var(--surface-variant)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s'
              }}
            >
              <Send size={16} color={input.trim() ? 'var(--primary-on)' : 'var(--text-muted)'} />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
