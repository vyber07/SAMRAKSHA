import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { StatusBadge, Spinner, PRIMARY_BTN } from '../components/ui'

export function CasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadCases = async () => {
    setLoading(true)
    try {
      let res
      if (searchQuery.trim()) {
        res = await api.get(`/cases/search?q=${searchQuery}`)
      } else {
        res = await api.get('/cases')
      }
      setCases(res.data || [])
    } catch (err) {
      console.error("Failed to load cases", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [searchQuery])

  const formatDate = (tsStr: string) => {
    try {
      const d = new Date(tsStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return tsStr
    }
  }

  const exportCSV = () => {
    if (cases.length === 0) return
    const headers = ['FIR No.', 'Victim Name', 'Accused Name', 'Crime Type', 'Ward', 'Date', 'Status']
    const rows = cases.map(c => [
      c.fir_no,
      c.victim_name,
      c.accused_name || 'Not identified',
      c.crime_type,
      c.ward,
      c.crime_date,
      c.case_status
    ])
    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `samraksha_cases_export_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1C2B3A', margin: 0 }}>Registered Cases</h2>
          <p style={{ fontSize: '13px', color: '#5A6A7E', margin: '4px 0 0' }}>Forensic Case Files Directory</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} style={SECONDARY_BTN}>
            📥 Export CSV
          </button>
          <Link to="/fir/new" style={{ ...PRIMARY_BTN, textDecoration: 'none', display: 'inline-block' }}>
            + Register New FIR
          </Link>
        </div>
      </div>


      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by FIR number, victim/accused name, or narrative text..."
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '10px 14px',
            border: '1px solid #D1D9E6',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid #D1D9E6',
          borderRadius: '6px', overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1A2B4A', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>FIR No.</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Complainant / Victim</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Accused Suspect</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Crime Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Ward</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Occurrence Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr key={c.case_id} style={{
                  borderBottom: '1px solid #D1D9E6',
                  background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                }}>
                  <td style={{ padding: '12px', fontFamily: 'IBM Plex Mono', fontWeight: 600, color: '#2E5F8A' }}>
                    {c.fir_no}
                  </td>
                  <td style={{ padding: '12px', color: '#1C2B3A', fontWeight: 500 }}>
                    {c.victim_name}
                  </td>
                  <td style={{ padding: '12px', color: c.accused_name ? '#1C2B3A' : '#5A6A7E', fontStyle: c.accused_name ? 'normal' : 'italic' }}>
                    {c.accused_name || 'Not identified'}
                  </td>
                  <td style={{ padding: '12px', color: '#1C2B3A', textTransform: 'capitalize' }}>
                    {c.crime_type.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '12px', color: '#5A6A7E' }}>
                    {c.ward}
                  </td>
                  <td style={{ padding: '12px', color: '#5A6A7E' }}>
                    {formatDate(c.crime_date)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <StatusBadge status={c.case_status} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Link to={`/cases/${c.case_id}`} style={{
                      color: '#2E5F8A', textDecoration: 'none', fontWeight: 600, fontSize: '13px'
                    }}>
                      View File
                    </Link>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#5A6A7E', fontStyle: 'italic' }}>
                    No case records found matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default CasesPage
