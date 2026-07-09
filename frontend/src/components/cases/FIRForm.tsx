import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedCallback } from 'use-debounce'
import { api } from '../../api/client'
import { PRIMARY_BTN, SECONDARY_BTN } from '../ui'

const CRIME_TYPES = [
  { code: 303, label: 'theft' },
  { code: 309, label: 'snatching' },
  { code: 115, label: 'assault' },
  { code: 310, label: 'robbery' },
  { code: 318, label: 'fraud' },
  { code: 318, label: 'cyber' },
  { code: 303, label: 'vehicle_theft' },
  { code: 303, label: 'burglary' },
]

const WARD_OPTIONS = [
  'Satellite', 'Bodakdev', 'Vastrapur', 'Ambawadi', 'Navrangpura',
  'Maninagar', 'Vatwa', 'Gomtipur', 'Jamalpur', 'Kalupur',
  'Shahibaug', 'Chandkheda', 'Bopal', 'Ghatlodiya', 'Naranpura', 'Ellisbridge'
]

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Low Risk',
  2: 'Minor Incident',
  3: 'Moderate Risk',
  4: 'Serious Threat',
  5: 'Critical Emergency',
}

interface FIRFormData {
  victim_name: string
  victim_address: string
  victim_phone: string
  victim_age: number
  victim_gender: string
  victim_injury: boolean
  crime_type: string
  crime_code: number
  crime_narrative: string
  crime_date: string
  crime_location: string
  crime_lat: number
  crime_lon: number
  ward: string
  severity: number
  accused_name: string
  accused_address: string
  accused_age: number
}

const EMPTY_FIR: FIRFormData = {
  victim_name: '',
  victim_address: '',
  victim_phone: '',
  victim_age: 30,
  victim_gender: 'male',
  victim_injury: false,
  crime_type: 'theft',
  crime_code: 303,
  crime_narrative: '',
  crime_date: new Date().toISOString().slice(0, 16),
  crime_location: '',
  crime_lat: 23.0225,
  crime_lon: 72.5714,
  ward: 'Ellisbridge',
  severity: 3,
  accused_name: '',
  accused_address: '',
  accused_age: 25,
}

export function FIRForm() {
  const [form, setForm] = useState<FIRFormData>(EMPTY_FIR)
  const [sections, setSections] = useState<any | null>(null)
  const [lang, setLang] = useState<'en'|'hi'|'gu'>('en')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  
  // Auto-suggest legal sections when narrative changes
  const handleNarrativeChange = useDebouncedCallback(
    async (narrative: string) => {
      if (narrative.length < 15) return
      try {
        const res = await api.post('/legal/suggest', { narrative, lang })
        setSections(res.data)
      } catch (err) {
        console.error("Legal sections suggestion failed", err)
      }
    }, 800
  )
  
  const handleCrimeTypeChange = (typeName: string) => {
    const selected = CRIME_TYPES.find(ct => ct.label === typeName)
    setForm(p => ({
      ...p,
      crime_type: typeName,
      crime_code: selected ? selected.code : 303
    }))
  }

  const handleWardChange = (wardName: string) => {
    // Lookup ward centroid to keep coordinates realistic
    const centroids: Record<string, [number, number]> = {
      'Satellite':   [23.0300, 72.5100],
      'Bodakdev':    [23.0470, 72.5060],
      'Vastrapur':   [23.0370, 72.5290],
      'Ambawadi':    [23.0200, 72.5510],
      'Navrangpura': [23.0270, 72.5620],
      'Maninagar':   [22.9890, 72.6030],
      'Vatwa':       [22.9720, 72.6380],
      'Gomtipur':    [23.0380, 72.6260],
      'Jamalpur':    [23.0370, 72.6050],
      'Kalupur':     [23.0240, 72.5990],
      'Shahibaug':   [23.0600, 72.5900],
      'Chandkheda':  [23.1010, 72.5870],
      'Bopal':       [23.0170, 72.4680],
      'Ghatlodiya':  [23.0670, 72.5540],
      'Naranpura':   [23.0530, 72.5550],
      'Ellisbridge': [23.0225, 72.5714],
    }
    const coords = centroids[wardName] || [23.0225, 72.5714]
    setForm(p => ({
      ...p,
      ward: wardName,
      crime_lat: coords[0] + (Math.random() - 0.5) * 0.005,
      crime_lon: coords[1] + (Math.random() - 0.5) * 0.005,
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const payload = {
        ...form,
        victim_age: Number(form.victim_age),
        accused_age: form.accused_name ? Number(form.accused_age) : null,
        accused_name: form.accused_name || null,
        accused_address: form.accused_address || null,
        language: lang
      }
      const res = await api.post('/fir/create', payload)
      navigate(`/cases/${res.data.case_id}`)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create FIR. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#5A6A7E',
    marginBottom: '6px'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D9E6',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontSize: '22px', color: '#1A2B4A', marginTop: 0, marginBottom: '20px' }}>Register New FIR File</h2>
      
      {/* Language Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['en','hi','gu'] as const).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              padding: '6px 16px',
              border: `1px solid ${lang===l ? '#1A2B4A' : '#D1D9E6'}`,
              borderRadius: '4px',
              background: lang===l ? '#1A2B4A' : '#FFFFFF',
              color: lang===l ? '#FFFFFF' : '#1C2B3A',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B52A2A', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}

      {/* Victim Section */}
      <fieldset style={{ border: '1px solid #D1D9E6', borderRadius: '6px', padding: '16px', marginBottom: '20px', background: 'white' }}>
        <legend style={{ color: '#1A2B4A', fontWeight: 600, padding: '0 8px' }}>Victim Information</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Complainant/Victim Name *</label>
            <input required style={inputStyle} value={form.victim_name} onChange={e => setForm(p => ({ ...p, victim_name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input type="number" style={inputStyle} value={form.victim_age} onChange={e => setForm(p => ({ ...p, victim_age: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={inputStyle} value={form.victim_gender} onChange={e => setForm(p => ({ ...p, victim_gender: e.target.value }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} value={form.victim_phone} onChange={e => setForm(p => ({ ...p, victim_phone: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Medical Care Required?</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.victim_injury} onChange={e => setForm(p => ({ ...p, victim_injury: e.target.checked }))} />
              Yes, victim injured during incident
            </label>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Full Postal Address *</label>
          <textarea required style={{ ...inputStyle, height: '60px' }} value={form.victim_address} onChange={e => setForm(p => ({ ...p, victim_address: e.target.value }))} />
        </div>
      </fieldset>

      {/* Crime Details Section */}
      <fieldset style={{ border: '1px solid #D1D9E6', borderRadius: '6px', padding: '16px', marginBottom: '20px', background: 'white' }}>
        <legend style={{ color: '#1A2B4A', fontWeight: 600, padding: '0 8px' }}>Crime Details</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Crime Type *</label>
            <select style={inputStyle} value={form.crime_type} onChange={e => handleCrimeTypeChange(e.target.value)}>
              {CRIME_TYPES.map(ct => (
                <option key={ct.label} value={ct.label}>{ct.label.toUpperCase().replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ward Jurisdiction *</label>
            <select style={inputStyle} value={form.ward} onChange={e => handleWardChange(e.target.value)}>
              {WARD_OPTIONS.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Incident Severity *</label>
            <select style={inputStyle} value={form.severity} onChange={e => setForm(p => ({ ...p, severity: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} - {SEVERITY_LABELS[n]}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Date & Time of Occurrence *</label>
            <input type="datetime-local" required style={inputStyle} value={form.crime_date} onChange={e => setForm(p => ({ ...p, crime_date: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Precise Landmark/Location *</label>
            <input required style={inputStyle} placeholder="e.g. Near Ambawadi market circle" value={form.crime_location} onChange={e => setForm(p => ({ ...p, crime_location: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>FIR Incident Narrative *</label>
          <textarea
            required
            rows={5}
            style={inputStyle}
            placeholder="Provide a detailed statement describing the event, property snatched/stolen, weapons used, and suspect features..."
            value={form.crime_narrative}
            onChange={e => {
              setForm(p => ({ ...p, crime_narrative: e.target.value }))
              handleNarrativeChange(e.target.value)
            }}
          />
        </div>

        {/* Legal Section Suggestions Panel */}
        {sections && (
          <div style={{
            background: '#F4F6F9', border: '1px solid #D1D9E6',
            borderRadius: '6px', padding: '12px', marginTop: '12px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B4A', marginBottom: '8px' }}>
              Suggested BNS / BNSS Sections (Auto-analyzed)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              {sections.bns_sections?.length > 0 && (
                <div><strong>BNS:</strong> {sections.bns_sections.join(', ')}</div>
              )}
              {sections.bnss_sections?.length > 0 && (
                <div><strong>BNSS:</strong> {sections.bnss_sections.join(', ')}</div>
              )}
              {sections.ipc_crossref?.length > 0 && (
                <div style={{ color: '#8F6A2E' }}><strong>IPC Cross-Ref:</strong> {sections.ipc_crossref.join(', ')}</div>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#5A6A7E', marginTop: '6px', fontStyle: 'italic' }}>
              Sections automatically suggested for Investigating Officer review.
            </div>
          </div>
        )}
      </fieldset>

      {/* Suspect Section */}
      <fieldset style={{ border: '1px solid #D1D9E6', borderRadius: '6px', padding: '16px', marginBottom: '24px', background: 'white' }}>
        <legend style={{ color: '#1A2B4A', fontWeight: 600, padding: '0 8px' }}>Accused/Suspect Details (Optional)</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Accused Name</label>
            <input style={inputStyle} placeholder="Leave blank if unknown" value={form.accused_name} onChange={e => setForm(p => ({ ...p, accused_name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Approximate Age</label>
            <input type="number" style={inputStyle} value={form.accused_age} onChange={e => setForm(p => ({ ...p, accused_age: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Last Known Address / Physical Description</label>
          <textarea style={{ ...inputStyle, height: '44px' }} placeholder="Address or clothing markers, vehicle registration details..." value={form.accused_address} onChange={e => setForm(p => ({ ...p, accused_address: e.target.value }))} />
        </div>
      </fieldset>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="button" onClick={() => navigate(-1)} style={SECONDARY_BTN}>Cancel</button>
        <button type="submit" disabled={loading} style={PRIMARY_BTN}>
          {loading ? 'Submitting File...' : 'Register FIR Case Record'}
        </button>
      </div>
    </form>
  )
}
