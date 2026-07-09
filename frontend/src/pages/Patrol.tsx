import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Spinner, TH, TD, PRIMARY_BTN } from '../components/ui'

export function PatrolPage() {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  const loadRoutes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/patrol/routes')
      setRoutes(res.data.routes || [])
    } catch (err) {
      console.error("Failed to load patrol routes", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      await loadRoutes()
    } finally {
      setRecalculating(false)
    }
  }

  useEffect(() => {
    loadRoutes()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1C2B3A', margin: 0 }}>Patrol Dispatch & Routing</h2>
          <p style={{ fontSize: '13px', color: '#5A6A7E', margin: '4px 0 0' }}>OR-Tools Multi-Vehicle Vehicle Routing Solver (VRP)</p>
        </div>
        <button 
          onClick={handleRecalculate} 
          disabled={loading || recalculating} 
          style={PRIMARY_BTN}
        >
          {recalculating ? "Optimizing Routes..." : "Recalculate Patrol Routes"}
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {routes.length === 0 ? (
            <div style={{
              background: '#FFFFFF', border: '1px solid #D1D9E6',
              borderRadius: '6px', padding: '30px', textAlign: 'center', color: '#5A6A7E'
            }}>
              No active patrol routes calculated. Ensure patrol units are available.
            </div>
          ) : (
            routes.map((r, i) => (
              <div key={r.unit_id || i} style={{
                background: '#FFFFFF', border: '1px solid #D1D9E6',
                borderRadius: '6px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', borderBottom: '1px solid #D1D9E6',
                  paddingBottom: '12px', marginBottom: '16px'
                }}>
                  <h3 style={{ fontSize: '15px', color: '#1A2B4A', margin: 0 }}>
                    🚨 Route: {r.unit_name}
                  </h3>
                  <span style={{
                    fontSize: '11px', color: '#5A6A7E',
                    fontFamily: 'IBM Plex Mono'
                  }}>
                    ID: {r.unit_id.slice(0, 8)}...
                  </span>
                </div>

                {r.route.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#5A6A7E', fontStyle: 'italic' }}>
                    No patrol stops assigned. Unit is stationary at base.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Seq.</th>
                        <th style={TH}>Ward Sector</th>
                        <th style={TH}>Coordinates</th>
                        <th style={TH}>Sector Risk</th>
                        <th style={TH}>Estimated Arrival (ETA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.route.map((stop: any, idx: number) => (
                        <tr key={idx}>
                          <td style={TD}>{idx + 1}</td>
                          <td style={{ ...TD, fontWeight: 600 }}>{stop.ward}</td>
                          <td style={{ ...TD, fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                            {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                          </td>
                          <td style={TD}>
                            <span style={{
                              fontWeight: 600,
                              color: stop.risk >= 80 ? '#B52A2A' : stop.risk >= 60 ? '#C4922A' : '#2A7A4B'
                            }}>
                              {stop.risk.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ ...TD, fontWeight: 500 }}>
                            {stop.eta_min === 0 ? "Depot / Current Position" : `+ ${stop.eta_min} mins`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
export default PatrolPage
