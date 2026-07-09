import { useState, useRef, useEffect } from 'react'
import { api } from '../../api/client'
import { PRIMARY_BTN } from '../ui'

interface Message {
  sender: 'officer' | 'assistant'
  text: string
  source?: string
}

export function CaseAssistant({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: "Hello. I am your SAMRAKSHA Case Assistant. I have loaded this specific case record. Ask me about witness statements, seized items, suspect description, or suggest BNS sections." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    setMessages(prev => [...prev, { sender: 'officer', text }])
    setLoading(true)

    try {
      const res = await api.post('/assistant/query', {
        mode: 'this_case',
        question: text,
        case_id: caseId
      })
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: res.data.answer,
        source: res.data.source
      }])
    } catch {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "Error connecting to AI service. Fallback matching could not resolve query."
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #D1D9E6',
      borderRadius: '6px', height: '480px', display: 'flex',
      flexDirection: 'column', overflow: 'hidden', maxWidth: '720px'
    }}>
      {/* Header */}
      <div style={{
        background: '#1A2B4A', color: '#FFFFFF',
        padding: '12px 16px', fontSize: '13px', fontWeight: 600,
        letterSpacing: '0.5px', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between'
      }}>
        <span>Case Intelligence AI Assistant</span>
        <span style={{ fontSize: '11px', color: '#8FA3BF' }}>Mode: This Case File</span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, padding: '16px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '12px',
        background: '#F8FAFC'
      }}>
        {messages.map((m, i) => {
          const isOfficer = m.sender === 'officer'
          return (
            <div key={i} style={{
              alignSelf: isOfficer ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              <div style={{
                background: isOfficer ? '#2E5F8A' : '#FFFFFF',
                color: isOfficer ? '#FFFFFF' : '#1C2B3A',
                border: isOfficer ? 'none' : '1px solid #D1D9E6',
                padding: '10px 14px', borderRadius: '6px',
                fontSize: '13px', lineHeight: '1.4',
                boxShadow: isOfficer ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {m.text}
              </div>
              {!isOfficer && m.source && (
                <div style={{
                  fontSize: '9px', color: '#5A6A7E',
                  marginTop: '4px', textAlign: 'left',
                  textTransform: 'uppercase', fontFamily: 'IBM Plex Mono'
                }}>
                  Source: {m.source}
                </div>
              )}
            </div>
          )
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#FFFFFF', border: '1px solid #D1D9E6', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#5A6A7E' }}>
            Assistant is reviewing case records...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px', borderTop: '1px solid #D1D9E6',
        display: 'flex', gap: '8px', background: '#FFFFFF'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question (e.g. 'What was the stolen vehicle details?')"
          disabled={loading}
          style={{
            flex: 1, padding: '8px 12px',
            border: '1px solid #D1D9E6', borderRadius: '4px',
            fontSize: '14px', outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={PRIMARY_BTN}
        >
          Send
        </button>
      </div>
    </div>
  )
}
export default CaseAssistant
