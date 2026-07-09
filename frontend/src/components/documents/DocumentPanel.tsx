import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { PRIMARY_BTN, SECONDARY_BTN } from '../ui'

const DOC_TYPES = [
  { key: 'chargesheet',    label: 'Purvani Chargesheet' },
  { key: 'medical_letter', label: 'Medical Treatment Letter' },
  { key: 'remand_request', label: 'Remand Request (Police Custody)' },
  { key: 'seizure_receipt',label: 'Seizure Receipt' },
  { key: 'court_custody',  label: 'Court Custody Letter' },
  { key: 'panchanama',     label: 'Accused Panchanama' },
  { key: 'face_id',        label: 'Face Identification Form' },
]

interface DocRecord {
  id: number
  doc_type: string
  sha256: string
  language: string
  generated_at: string
  generated_by_name?: string
}

export function DocumentPanel({ caseId }: { caseId: string }) {
  const [lang, setLang]         = useState<'en'|'hi'|'gu'>('en')
  const [generating, setGen]    = useState<string | null>(null)
  const [generated, setGenerated] = useState<DocRecord[]>([])

  const fetchDocs = () => {
    api.get(`/docs?case_id=${caseId}`)
       .then(r => setGenerated(r.data))
       .catch(() => {})
  }

  useEffect(() => {
    fetchDocs()
  }, [caseId])

  const generateDoc = async (docType: string) => {
    setGen(docType)
    try {
      const res = await api.post('/docs/generate', {
        case_id: caseId,
        doc_type: docType,
        language: lang,
      }, { responseType: 'blob' })

      // Download file in browser securely
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docType}_${caseId}_${lang}.docx`
      a.click()

      // Refresh list
      fetchDocs()
    } catch (err: any) {
      alert('Document generation failed. Please verify that case details are complete.')
    } finally {
      setGen(null)
    }
  }

  const downloadDoc = async (doc: DocRecord) => {
    try {
      const res = await api.get(`/docs/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.doc_type}_${caseId}_${doc.language}.docx`
      a.click()
    } catch {
      alert("Failed to download document file.")
    }
  }

  const generateAll = async () => {
    for (const doc of DOC_TYPES) {
      // Avoid medical letter if victim_injury is not set, to prevent errors in API
      if (doc.key === 'medical_letter') {
        try {
          const caseDetails = await api.get(`/cases/${caseId}`)
          if (!caseDetails.data.victim_injury) {
            continue; // Skip silently
          }
        } catch {
          continue;
        }
      }
      await generateDoc(doc.key)
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
    <div style={{ padding: '12px' }}>
      {/* Controls */}
      <div style={{
        display: 'flex', gap: '16px',
        alignItems: 'center', marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5A6A7E', marginBottom: '6px' }}>Target Language</label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D9E6',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
        </div>
        <button
          onClick={generateAll}
          disabled={!!generating}
          style={{ ...PRIMARY_BTN, marginTop: '20px' }}
        >
          Generate All Documents
        </button>
      </div>

      {/* Document grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {DOC_TYPES.map(doc => {
          const existing = generated.find(g => g.doc_type === doc.key)
          const isGenerating = generating === doc.key

          return (
            <div key={doc.key} style={{
              background: '#FFFFFF', border: '1px solid #D1D9E6',
              borderRadius: '6px', padding: '16px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: '140px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{
                  fontSize: '14px', fontWeight: 600,
                  color: '#1C2B3A', marginBottom: '4px'
                }}>
                  {doc.label}
                </div>

                {existing ? (
                  <div style={{
                    fontSize: '11px', color: '#5A6A7E', marginBottom: '8px',
                    fontFamily: 'IBM Plex Mono', lineHeight: '1.4'
                  }}>
                    SHA-256: {existing.sha256.slice(0, 16)}...
                    <br />
                    Generated: {formatDateTime(existing.generated_at)}
                    {existing.generated_by_name && (
                      <><br />By: {existing.generated_by_name}</>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#5A6A7E', fontStyle: 'italic', marginBottom: '8px' }}>
                    Not yet generated for this case file.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => generateDoc(doc.key)}
                  disabled={!!generating}
                  style={{
                    ...PRIMARY_BTN,
                    fontSize: '12px', padding: '6px 12px'
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                {existing && (
                  <button
                    onClick={() => downloadDoc(existing)}
                    style={{
                      ...SECONDARY_BTN,
                      fontSize: '12px', padding: '6px 12px'
                    }}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Integrity notice */}
      <div style={{
        marginTop: '24px', padding: '12px 16px',
        background: '#F4F6F9', border: '1px solid #D1D9E6',
        borderRadius: '6px', fontSize: '12px', color: '#5A6A7E',
        lineHeight: '1.4'
      }}>
        <strong>Document Verification Notice:</strong> Every document generated is timestamped and SHA-256 hashed immediately in the database registry. Any post-generation local alterations will trigger hash validation mismatches, ensuring full forensic audit trail compliance under BSA guidelines. All document text formats are verified against BNS/BNSS 2024 standards.
      </div>
    </div>
  )
}
export default DocumentPanel
