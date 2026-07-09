import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useRBAC } from '../hooks/useRBAC'
import {
  StatusBadge,
  Spinner,
  InfoCard,
  InfoRow,
  SectionGroup,
  PRIMARY_BTN,
  TH,
  TD
} from '../components/ui'
import { CaseDiary } from '../components/cases/CaseDiary'
import { DocumentPanel } from '../components/documents/DocumentPanel'
import { CaseAssistant } from '../components/assistant/CaseAssistant'

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const { can } = useRBAC()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview'|'diary'|'documents'|'assistant'>('overview')
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const loadCase = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      const res = await api.get(`/cases/${caseId}`)
      setCaseData(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert("Access Denied: You do not have permission to view this case file.")
        navigate('/cases')
      } else {
        console.error("Failed to load case", err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCase()
  }, [caseId])

  const handleStatusChange = async (newStatus: string) => {
    if (!caseId || updating) return
    setUpdating(true)
    try {
      await api.patch(`/cases/${caseId}`, { case_status: newStatus })
      // Reload case
      const res = await api.get(`/cases/${caseId}`)
      setCaseData(res.data)
    } catch (err) {
      alert("Failed to update status. Check permissions.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <Spinner />
  if (!caseData) return <div style={{ padding: '24px', color: '#B52A2A', fontWeight: 600 }}>Case file not found.</div>

  const formatDate = (tsStr: string) => {
    try {
      const d = new Date(tsStr)
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return tsStr
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Case Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: '13px',
            color: '#5A6A7E', marginBottom: '4px', fontWeight: 600
          }}>
            FIR NO: {caseData.fir_no}
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: 600,
            color: '#1C2B3A', margin: 0, textTransform: 'capitalize'
          }}>
            {caseData.crime_type.replace('_',' ')} — {caseData.crime_location}
          </h1>
          <div style={{
            fontSize: '13px', color: '#5A6A7E', marginTop: '6px'
          }}>
            Registered: {formatDate(caseData.crime_date)} · Ward: {caseData.ward}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#5A6A7E', fontWeight: 600 }}>Status:</span>
            {can('generate_docs') ? (
              <select
                value={caseData.case_status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={updating}
                style={{
                  padding: '4px 8px', border: '1px solid #D1D9E6', borderRadius: '4px',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                <option value="open">Open</option>
                <option value="arrested">Arrested</option>
                <option value="chargesheeted">Chargesheeted</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <StatusBadge status={caseData.case_status} />
            )}
          </div>
          {can('generate_docs') && (
            <button
              onClick={() => setActiveTab('documents')}
              style={PRIMARY_BTN}
            >
              Document Vault
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid #D1D9E6',
        marginBottom: '24px'
      }}>
        {[
          { key: 'overview',   label: 'Case Overview' },
          { key: 'diary',      label: 'Case Diary' },
          { key: 'documents',  label: 'Secure Documents' },
          { key: 'assistant',  label: 'AI Case Assistant' },
        ].map(tab => {
          const isAllowed = tab.key !== 'documents' || can('generate_docs')
          if (!isAllowed) return null
          
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.key
                  ? '2.5px solid #1A2B4A'
                  : '2.5px solid transparent',
                background: 'transparent',
                color: activeTab === tab.key ? '#1A2B4A' : '#5A6A7E',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '14px', cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content renderer */}
      <div style={{ background: '#FFFFFF', padding: '20px', border: '1px solid #D1D9E6', borderRadius: '6px' }}>
        {activeTab === 'overview'  && <CaseOverview data={caseData} />}
        {activeTab === 'diary'     && <CaseDiary caseId={caseId!} />}
        {activeTab === 'documents' && <DocumentPanel caseId={caseId!} />}
        {activeTab === 'assistant' && <CaseAssistant caseId={caseId!} />}
      </div>
    </div>
  )
}

function CaseOverview({ data }: { data: any }) {
  // Parse evidence items
  let evidence = []
  try {
    evidence = typeof data.evidence_items === 'string' ? JSON.parse(data.evidence_items) : (data.evidence_items || [])
  } catch {
    evidence = data.evidence_items || []
  }

  // Parse witnesses
  let witnesses = []
  try {
    witnesses = typeof data.witnesses === 'string' ? JSON.parse(data.witnesses) : (data.witnesses || [])
  } catch {
    witnesses = data.witnesses || []
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <InfoCard title="Complainant / Victim Details">
        <InfoRow label="Full Name"    value={data.victim_name} />
        <InfoRow label="Age / Phone"  value={`${data.victim_age || '—'} / ${data.victim_phone || '—'}`} />
        <InfoRow label="Gender"       value={data.victim_gender} />
        <InfoRow label="Address"      value={data.victim_address} />
        {data.victim_injury && (
          <div style={{
            marginTop: '8px', padding: '6px 12px',
            background: '#FFF3CD', borderRadius: '4px',
            fontSize: '12px', color: '#856404', fontWeight: 500,
            border: '1px solid #FFEEBA'
          }}>
            ⚠️ Warning: Victim required immediate medical treatment
          </div>
        )}
      </InfoCard>

      <InfoCard title="Accused Suspect Information">
        {data.accused_name ? (
          <>
            <InfoRow label="Suspect Name"    value={data.accused_name} />
            <InfoRow label="Approx. Age"     value={data.accused_age} />
            <InfoRow label="Description"     value={data.accused_address} />
            {data.arrest_date && (
              <div style={{
                marginTop: '8px', padding: '6px 12px',
                background: '#D1E7DD', borderRadius: '4px',
                fontSize: '12px', color: '#0A3622', fontWeight: 500
              }}>
                🔒 Apprehended: {new Date(data.arrest_date).toLocaleDateString()}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#5A6A7E', fontSize: '13px', fontStyle: 'italic' }}>
            No accused individuals identified or named at this stage.
          </div>
        )}
      </InfoCard>

      <InfoCard title="Applied Law Sections">
        <SectionGroup label="BNS (Bihari Nyaya Sanhita)"   codes={data.bns_sections}  color="#2E5F8A" />
        <SectionGroup label="BNSS (Procedural Guidelines)"  codes={data.bnss_sections} color="#2A7A4B" />
        <SectionGroup label="BSA (Evidentiary Code)"        codes={data.bsa_sections}  color="#5A6A7E" />
        {data.ipc_crossref?.length > 0 && (
          <SectionGroup
            label="IPC / CrPC Reference equivalents"
            codes={data.ipc_crossref}
            color="#C4922A"
          />
        )}
      </InfoCard>

      <InfoCard title="Exhibits & Evidence Locker">
        {evidence.length === 0 ? (
          <div style={{ color: '#5A6A7E', fontSize: '13px', fontStyle: 'italic' }}>
            No physical exhibits or digital evidence logged.
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F6F9' }}>
                <th style={TH}>Item</th>
                <th style={TH}>Description</th>
                <th style={TH}>Value (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e: any, i: number) => (
                <tr key={i}>
                  <td style={TD}>{e.item}</td>
                  <td style={TD}>{e.description}</td>
                  <td style={TD}>{e.value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </InfoCard>

      <div style={{ gridColumn: 'span 2' }}>
        <InfoCard title="FIR Incident Narrative Statement">
          <p style={{ margin: 0, fontSize: '14px', color: '#1C2B3A', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {data.crime_narrative}
          </p>
        </InfoCard>
      </div>
    </div>
  )
}
export default CaseDetailPage
