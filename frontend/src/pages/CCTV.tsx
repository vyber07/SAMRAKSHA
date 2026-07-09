import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { Spinner, TH, TD, PRIMARY_BTN } from '../components/ui'

export function CCTVPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/map/alerts?limit=20')
      setAlerts(res.data || [])
    } catch (err) {
      console.error("Failed to load CCTV alerts", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  useWebSocket((event) => {
    if (event.type === 'CCTV_ALERT' && event.alert) {
      setAlerts(prev => [event.alert, ...prev])
    }
  })

  const triggerMockAlert = async (type: string) => {
    setSimulating(true)
    try {
      const payloads: Record<string, any> = {
        'loitering': {
          camera_id: "CAM_JAM_01",
          camera_name: "Jamalpur Main Road Circle",
          source: "samraksha_model",
          alert_type: "loitering",
          confidence: 0.89,
          person_count: 3,
          lat: 23.0370,
          lon: 72.6050
        },
        'crowd': {
          camera_id: "CAM_ELL_02",
          camera_name: "Ellisbridge Town Hall Circle",
          source: "iccc",
          alert_type: "crowd_density",
          confidence: 0.94,
          person_count: 55,
          lat: 23.0225,
          lon: 72.5714
        },
        'anpr': {
          camera_id: "CAM_SAT_03",
          camera_name: "Satellite Crossing Camera",
          source: "samraksha_model",
          alert_type: "anpr",
          confidence: 0.98,
          plate_no: "GJ01AB1234",
          lat: 23.0300,
          lon: 72.5100
        }
      }
      
      const payload = payloads[type]
      await api.post('/cctv/alert', payload)
    } catch (err) {
      alert("Simulation failed.")
    } finally {
      setSimulating(false)
    }
  }

  const formatDateTime = (tsStr: string) => {
    try {
      const d = new Date(tsStr)
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
    } catch {
      return tsStr
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1C2B3A', margin: 0 }}>CCTV Stream & Vision Analytics</h2>
          <p style={{ fontSize: '13px', color: '#5A6A7E', margin: '4px 0 0' }}>MediaPipe CPU loitering detection and ICCC alert feeds</p>
        </div>

        {/* Mock alert triggers for live demo */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => triggerMockAlert('loitering')} 
            disabled={simulating}
            style={{ ...PRIMARY_BTN, background: '#C47A1A', borderColor: '#C47A1A' }}
          >
            Trigger Loitering Alert
          </button>
          <button 
            onClick={() => triggerMockAlert('crowd')} 
            disabled={simulating}
            style={{ ...PRIMARY_BTN, background: '#B52A2A', borderColor: '#B52A2A' }}
          >
            Trigger Crowd Alert
          </button>
          <button 
            onClick={() => triggerMockAlert('anpr')} 
            disabled={simulating}
            style={{ ...PRIMARY_BTN, background: '#2E5F8A', borderColor: '#2E5F8A' }}
          >
            Trigger ANPR plate alert
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        
        {/* Mock Feed Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { id: "CAM_ELL_01", name: "Ellisbridge Circle Feed", status: "Active (2fps)" },
            { id: "CAM_SAT_01", name: "Satellite Crossing Feed", status: "Active (2fps)" },
            { id: "CAM_JAM_01", name: "Jamalpur Circle Feed", status: "Active (2fps)" },
            { id: "CAM_BOD_01", name: "Bodakdev Highway Feed", status: "Active (2fps)" },
          ].map(feed => (
            <div key={feed.id} style={{
              background: '#0F1E35', border: '1px solid #1A2B4A',
              borderRadius: '6px', overflow: 'hidden', height: '200px',
              position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              {/* Header */}
              <div style={{ background: 'rgba(26, 43, 74, 0.8)', color: 'white', padding: '8px 12px', fontSize: '12px', zIndex: 10 }}>
                {feed.name}
              </div>
              
              {/* CCTV mockup image */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>

              {/* Status footer */}
              <div style={{
                background: 'rgba(0,0,0,0.6)', color: '#D1D9E6', padding: '6px 12px',
                fontSize: '11px', display: 'flex', justifyContent: 'space-between', zIndex: 10
              }}>
                <span>ID: {feed.id}</span>
                <span style={{ color: '#2A7A4B', fontWeight: 600 }}>● {feed.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent alerts panel */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D1D9E6', borderRadius: '6px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#1A2B4A', margin: '0 0 16px 0' }}>Recent Vision Alerts Log</h3>
          
          {loading ? (
            <Spinner />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {alerts.map((al, idx) => {
                const isICCC = al.source === 'iccc'
                return (
                  <div key={al.id || idx} style={{
                    background: isICCC ? '#F0F4F8' : '#FFF9F2',
                    border: `1px solid ${isICCC ? '#D1D9E6' : '#FFEBAA'}`,
                    borderRadius: '6px', padding: '10px', fontSize: '12px'
                  }}>
                    <div style={{ fontWeight: 600, color: isICCC ? '#2E5F8A' : '#C47A1A', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🚨 {al.alert_type.replace('_',' ').toUpperCase()}</span>
                      <span>{formatDateTime(al.ts)}</span>
                    </div>
                    <div style={{ marginTop: '4px', color: '#1C2B3A' }}>
                      Camera: {al.camera_name || al.camera_id}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5A6A7E', marginTop: '2px' }}>
                      Confidence: {Math.round(al.confidence * 100)}% {al.person_count ? `| Count: ${al.person_count}` : ''}
                    </div>
                    {al.plate_no && (
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', fontWeight: 600, color: '#2E5F8A', marginTop: '4px' }}>
                        Vehicle Plate: {al.plate_no}
                      </div>
                    )}
                  </div>
                )
              })}
              {alerts.length === 0 && (
                <div style={{ textAlign: 'center', color: '#5A6A7E', fontStyle: 'italic', padding: '20px 0' }}>
                  No alerts recorded.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
export default CCTVPage
