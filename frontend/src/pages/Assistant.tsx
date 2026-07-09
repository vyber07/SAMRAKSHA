import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { PRIMARY_BTN } from '../components/ui'

interface Message {
  sender: 'officer' | 'assistant'
  text: string
  source?: string
}

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: "Welcome to SAMRAKSHA Command Intelligence Assistant. I have loaded recent case files in your jurisdiction. You can ask me to summarize trends, search across multiple cases, or identify repeating suspect vehicle descriptions." }
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
        mode: 'all_cases',
        question: text
      })
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: res.data.answer,
        source: res.data.source
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: err.response?.status === 403 
          ? "Access Denied: Constables are not authorized to run cross-case queries."
          : "Error connecting to AI service. Fallback logic failed."
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ alignSelf: 'flex-start', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1C2B3A', margin: 0 }}>Cross-Case AI Intelligence</h2>
        <p style={{ fontSize: '13px', color: '#5A6A7E', margin: '4px 0 0' }}>Multi-file case index scanning and citation-based analysis</p>
      </div>

      <div style={{
        background: '#FFFFFF', border: '1px solid #D1D9E6',
        borderRadius: '6px', height: '520px', display: 'flex',
        flexDirection: 'column', overflow: 'hidden', width: '100%', maxWidth: '800px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {/* Header */}
        <div style={{
          background: '#1A2B4A', color: '#FFFFFF',
          padding: '14px 20px', fontSize: '13px', fontWeight: 600,
          letterSpacing: '0.5px', textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>Cross-Case Analysis Module</span>
          <span style={{ fontSize: '11px', color: '#C4922A' }}>Mode: Multi-file Search</span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, padding: '20px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '14px',
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
                  padding: '12px 16px', borderRadius: '6px',
                  fontSize: '13.5px', lineHeight: '1.5',
                  boxShadow: isOfficer ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap'
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
              Assistant is analyzing and cross-referencing case records...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '14px', borderTop: '1px solid #D1D9E6',
          display: 'flex', gap: '10px', background: '#FFFFFF'
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Search patterns (e.g. 'Summarize recent snatching trends in Jamalpur')"
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px',
              border: '1px solid #D1D9E6', borderRadius: '4px',
              fontSize: '14px', outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={PRIMARY_BTN}
          >
            Query index
          </button>
        </div>
      </div>
    </div>
  )
}
export default AssistantPage
