import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useRBAC } from '../hooks/useRBAC'
import { Spinner, PRIMARY_BTN, TH, TD, RiskBadge } from '../components/ui'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const FESTIVALS = [
  { key: 'rath_yatra',  label: 'Rath Yatra',
    zones: ['Jamalpur','Kalupur','Ambawadi'] },
  { key: 'navratri',    label: 'Navratri',
    zones: ['Ellisbridge','Bodakdev','Satellite'] },
  { key: 'diwali',      label: 'Diwali',
    zones: ['Maninagar','Vatwa','Gomtipur'] },
  { key: 'uttarayan',   label: 'Uttarayan',
    zones: ['Satellite','Navrangpura','Bodakdev'] },
]

export function AnalyticsPage() {
  const { can } = useRBAC()
  const [festival, setFestival] = useState('')
  const [crowd, setCrowd]       = useState(50000)
  const [simResult, setSimResult] = useState<any>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [trends, setTrends]     = useState<any>(null)
  const [loadingTrends, setLoadingTrends] = useState(true)

  useEffect(() => {
    setLoadingTrends(true)
    api.get('/analytics/trends')
      .then(r => setTrends(r.data))
      .catch(() => {
        // Fallback trends for offline demo stability
        setTrends({
          hourly: [
            { hour: 0, count: 12 }, { hour: 4, count: 5 }, { hour: 8, count: 8 },
            { hour: 12, count: 15 }, { hour: 16, count: 18 }, { hour: 20, count: 32 }
          ],
          weekly: [
            { day: 'Mon', count: 18 }, { day: 'Tue', count: 14 }, { day: 'Wed', count: 16 },
            { day: 'Thu', count: 15 }, { day: 'Fri', count: 28 }, { day: 'Sat', count: 34 }, { day: 'Sun', count: 22 }
          ],
          by_type: [
            { type: 'theft', count: 62 }, { type: 'snatching', count: 48 }, { type: 'fraud', count: 34 },
            { type: 'assault', count: 22 }, { type: 'robbery', count: 18 }
          ],
          monthly: [
            { month: 'Jan 26', count: 24 }, { month: 'Feb 26', count: 28 }, { month: 'Mar 26', count: 32 },
            { month: 'Apr 26', count: 26 }, { month: 'May 26', count: 40 }, { month: 'Jun 26', count: 45 }
          ]
        })
      })
      .finally(() => setLoadingTrends(false))
  }, [])

  const runSimulation = async () => {
    if (!festival) return
    setSimLoading(true)
    try {
      const res = await api.post('/analytics/simulate', {
        event: festival,
        crowd_size: crowd,
      })
      setSimResult(res.data)
    } catch {
      alert("Simulation failed.")
    } finally {
      setSimLoading(false)
    }
  }

  const chartHeadingStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5A6A7E',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '22px', fontWeight: 600,
        color: '#1C2B3A', marginBottom: '24px'
      }}>
        Decision Support Analytics
      </h2>

      {/* Crime trends section */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #D1D9E6',
        borderRadius: '6px', padding: '20px', marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ fontSize: '15px', color: '#1A2B4A', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #D1D9E6', paddingBottom: '8px' }}>
          Historical Crime Trends (90-Day Analytics Window)
        </h3>
        
        {loadingTrends ? (
          <Spinner />
        ) : trends && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            <div>
              <div style={chartHeadingStyle}>Crime Count by Hour of Day</div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={trends.hourly}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2E5F8A" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div style={chartHeadingStyle}>Crime Count by Day of Week</div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={trends.weekly}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C4922A" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div style={chartHeadingStyle}>Top Crime Categories</div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={trends.by_type}>
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1A2B4A" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div style={chartHeadingStyle}>Monthly Frequency Trend</div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={trends.monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count"
                          stroke="#2E5F8A" strokeWidth={2.5}
                          dot={{ fill: '#2E5F8A', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Festival simulation */}
      {can('view_analytics') && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #D1D9E6',
          borderRadius: '6px', padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '15px', color: '#1A2B4A', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #D1D9E6', paddingBottom: '8px' }}>
            Event & Festival Resource Planner Simulation
          </h3>
          <div style={{
            display: 'flex', gap: '20px',
            alignItems: 'flex-end', marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5A6A7E', marginBottom: '6px' }}>Select Public Event</label>
              <select
                value={festival}
                onChange={e => setFestival(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D9E6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minWidth: '180px'
                }}
              >
                <option value="">Choose event...</option>
                {FESTIVALS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5A6A7E', marginBottom: '6px' }}>
                Expected Crowd Size: {crowd.toLocaleString()}
              </label>
              <input
                type="range" min="10000" max="500000"
                step="10000" value={crowd}
                onChange={e => setCrowd(Number(e.target.value))}
                style={{ display: 'block', width: '220px', marginTop: '10px' }}
              />
            </div>
            <button
              onClick={runSimulation}
              disabled={!festival || simLoading}
              style={PRIMARY_BTN}
            >
              {simLoading ? 'Simulating Deployment...' : 'Run Simulation Model'}
            </button>
          </div>

          {simResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                padding: '12px 16px', background: '#F4F6F9',
                borderRadius: '6px', marginBottom: '20px',
                fontSize: '13.5px', border: '1px solid #D1D9E6',
                lineHeight: '1.4'
              }}>
                <strong>Simulation Recommendations:</strong> Deploy <strong>{simResult.total_units_needed} extra patrol vehicles</strong> to high-congestion spots. Prepare <strong>{simResult.doc_templates_needed} legal template packets</strong> pre-allocated to station desks in the affected sectors.
              </div>

              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1A2B4A', color: 'white' }}>
                    <th style={{ ...TH, color: 'white', background: '#1A2B4A' }}>Ward Sector</th>
                    <th style={{ ...TH, color: 'white', background: '#1A2B4A' }}>Simulated Risk Index</th>
                    <th style={{ ...TH, color: 'white', background: '#1A2B4A' }}>Recommended Patrol Units</th>
                    <th style={{ ...TH, color: 'white', background: '#1A2B4A' }}>Most Likely Threat</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult.hotspots.map((h: any, i: number) => (
                    <tr key={i} style={{
                      background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                      borderBottom: '1px solid #D1D9E6'
                    }}>
                      <td style={{ ...TD, fontWeight: 600 }}>{h.zone}</td>
                      <td style={TD}>
                        <RiskBadge score={h.sim_risk} />
                      </td>
                      <td style={TD}>{h.units_needed} units</td>
                      <td style={{ ...TD, textTransform: 'capitalize' }}>{h.likely_crime.replace('_',' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default AnalyticsPage
