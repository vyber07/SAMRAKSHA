import React, { useState } from 'react';
import { Bot, Send, Sparkles, Gavel, Shield, HelpCircle, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { GlassCard, GlassPanel, Button, Input, Textarea, Badge } from '../ui';
import { aiApi } from '../../lib/api';

export const CrimeGptAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; bns?: string[]; actions?: string[] }>>([
    {
      sender: 'assistant',
      text: 'Greetings Officer. I am CrimeGPT — your specialized Bharatiya Nyaya Sanhita (BNS 2023) Legal Assistant and Case Intelligence Copilot. How may I assist your investigation today?',
      bns: ['BNS Section 303(2)', 'BNS Section 309'],
      actions: ['Look up Section penal provisions', 'Verify FIR mandatory chargesheet timelines'],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputQuery.trim() || loading) return;
    const userText = inputQuery;
    setInputQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await aiApi.queryCrimeGpt(userText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: response.answer,
          bns: response.suggestedBnsSections,
          actions: response.recommendedActions,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Under BNS Section 303(2) (Theft) and Section 309 (Robbery), the statutory requirements mandate immediate registration of FIR and forensic evidence logging.',
          bns: ['BNS Section 303(2)', 'BNS Section 309'],
          actions: ['Deploy forensic evidence team', 'Check CCTV footage within 500m radius'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold font-montserrat text-on-surface flex items-center gap-2">
          <Bot className="text-primary" size={28} />
          CrimeGPT — AI Legal & Case Intelligence Copilot
        </h2>
        <p className="text-sm text-on-surface-variant font-inter mt-1">
          Bharatiya Nyaya Sanhita (BNS 2023) legal lookup, procedural suggestions, and investigative AI reasoning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat History Panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassPanel title="Interactive AI Copilot Session" className="flex flex-col h-[560px]">
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-2 pr-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-2 max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-variant/50 text-on-surface border border-outline-variant/40 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm font-inter leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {msg.bns && msg.bns.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/30 flex flex-wrap gap-1.5">
                        {msg.bns.map((sec, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs font-mono bg-primary-container text-on-primary-container font-semibold">
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-xs font-semibold text-secondary flex items-center gap-1">
                          <CheckCircle2 size={12} /> Recommended SOP Actions:
                        </p>
                        {msg.actions.map((act, i) => (
                          <p key={i} className="text-xs text-on-surface-variant flex items-center gap-1.5 pl-2">
                            • {act}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant px-1">
                    {msg.sender === 'user' ? 'Officer' : 'CrimeGPT AI'}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="self-start p-4 rounded-2xl bg-surface-variant/50 border border-outline-variant/40 animate-pulse text-sm text-on-surface-variant flex items-center gap-2">
                  <Sparkles size={16} className="animate-spin text-primary" /> CrimeGPT is consulting BNS 2023 legal database...
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="mt-3 pt-3 border-t border-outline-variant/30 flex gap-2">
              <Input
                placeholder="Ask CrimeGPT about BNS sections, FIR procedure, or chargesheet rules..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button variant="primary" onClick={handleSend} disabled={loading}>
                <Send size={16} /> Send
              </Button>
            </div>
          </GlassPanel>
        </div>

        {/* Suggested Queries Sidebar */}
        <div className="flex flex-col gap-4">
          <GlassPanel title="Quick Legal Queries" subtitle="Click to run BNS inquiry">
            <div className="flex flex-col gap-2.5">
              {[
                'What are BNS Section 303(2) penal provisions for theft?',
                'What is the mandatory chargesheet timeline under BNSS Section 193?',
                'How to handle electronic evidence collection under BSA Section 61?',
                'What sections apply for armed robbery under BNS?',
              ].map((query, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInputQuery(query);
                  }}
                  className="p-3 rounded-xl bg-surface-variant/30 border border-outline-variant/40 hover:border-primary/50 cursor-pointer transition-all text-xs text-on-surface flex items-center justify-between group"
                >
                  <span>{query}</span>
                  <ChevronRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
