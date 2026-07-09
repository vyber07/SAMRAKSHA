import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { PRIMARY_BTN, SECONDARY_BTN } from '../ui'

const ENTRY_ICONS: Record<string, string> = {
  fir:      '📋',
  arrest:   '🔒',
  seizure:  '📦',
  witness:  '👤',
  document: '📄',
  court:    '⚖️',
  cctv:     '📷',
  patrol:   '🚔',
  note:     '📝',
}

const ENTRY_COLORS: Record<string, string> = {
  fir:      '#2E5F8A',
  arrest:   '#B52A2A',
  seizure:  '#C4922A',
  witness:  '#2A7A4B',
  document: '#5A6A7E',
  court:    '#1A2B4A',
  cctv:     '#8B5CF6',
  patrol:   '#2E5F8A',
  note:     '#5A6A7E',
}

interface DiaryEntry {
  id: string
  entry_type: string
  description: string
  officer_name?: string
  location?: string
  auto_generated: boolean
  ts: string
}

export function CaseDiary({ caseId }: { caseId: string }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchDiary = () => {
    api.get(`/cases/${caseId}/diary`)
      .then(r => setEntries(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchDiary()
  }, [caseId])

  const addNote = async () => {
    if (!newNote.trim()) return
    try {
      await api.post(`/cases/${caseId}/diary`, {
        entry_type: 'note',
        description: newNote,
      })
      fetchDiary()
      setNewNote('')
      setAdding(false)
    } catch (err) {
      alert("Failed to save investigative note")
    }
  }

  const formatDateTime = (tsStr: string) => {
    try {
      const d = new Date(tsStr)
      return d.toLocaleString()
    } catch {
      return tsStr
    }
  }

  return (
    <div style={{ maxWidth: '720px', padding: '12px' }}>
      {/* Add note button */}
      <div style={{ marginBottom: '20px' }}>
        {!adding ? (
          <button onClick={() => setAdding(true)} style={SECONDARY_BTN}>
            + Add Investigative Note
          </button>
        ) : (
          <div style={{
            background: '#FFFFFF', border: '1px solid #D1D9E6',
            borderRadius: '6px', padding: '16px'
          }}>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Record any phone trace, physical inspections, or statements here..."
              rows={3}
              style={{
                width: '100%', border: '1px solid #D1D9E6',
                borderRadius: '4px', padding: '8px',
                fontSize: '14px', resize: 'vertical',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              display: 'flex', gap: '8px', marginTop: '8px'
            }}>
              <button onClick={addNote} style={PRIMARY_BTN}>Save Note</button>
              <button
                onClick={() => { setAdding(false); setNewNote('') }}
                style={SECONDARY_BTN}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: '20px', top: '0', bottom: '0',
          width: '2px', background: '#D1D9E6'
        }} />

        {entries.map((entry) => (
          <div key={entry.id} style={{
            display: 'flex', gap: '16px',
            marginBottom: '20px', position: 'relative'
          }}>
            {/* Icon circle */}
            <div style={{
              width: '40px', height: '40px', flexShrink: 0,
              borderRadius: '50%',
              background: ENTRY_COLORS[entry.entry_type] || '#5A6A7E',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '16px',
              zIndex: 1, position: 'relative'
            }}>
              {ENTRY_ICONS[entry.entry_type] || '📌'}
            </div>

            {/* Content */}
            <div style={{
              flex: 1, background: '#FFFFFF',
              border: '1px solid #D1D9E6', borderRadius: '6px',
              padding: '12px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '6px', alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '12px', fontWeight: 600,
                  color: ENTRY_COLORS[entry.entry_type] || '#5A6A7E',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {entry.entry_type.replace('_',' ')}
                  {entry.auto_generated && (
                    <span style={{
                      marginLeft: '6px', fontSize: '10px',
                      background: '#F4F6F9', color: '#5A6A7E',
                      padding: '1px 5px', borderRadius: '3px',
                      border: '1px solid #D1D9E6'
                    }}>SYSTEM LOG</span>
                  )}
                </span>
                <span style={{
                  fontSize: '11px', color: '#5A6A7E',
                  fontFamily: 'IBM Plex Mono'
                }}>
                  {formatDateTime(entry.ts)}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#1C2B3A', lineHeight: '1.4' }}>
                {entry.description}
              </div>
              {entry.location && (
                <div style={{
                  fontSize: '12px', color: '#5A6A7E', marginTop: '6px'
                }}>
                  📍 Location: {entry.location}
                </div>
              )}
              {entry.officer_name && (
                <div style={{
                  fontSize: '12px', color: '#5A6A7E', marginTop: '2px'
                }}>
                  Officer: {entry.officer_name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default CaseDiary
