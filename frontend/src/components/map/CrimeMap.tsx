import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../api/client'
import { useWebSocket } from '../../hooks/useWebSocket'
import { RiskBadge, StatusBadge } from '../ui'

const MAP_BOUNDS = [[22.8, 72.3], [23.3, 72.8]] // Extended Ahmedabad bbox
const MAP_CENTER: [number, number] = [23.0225, 72.5714]

// Custom icons using Inline SVGs to avoid Vite asset URL path resolution issues
const SHIELD_ICON = L.divIcon({
  html: `<div style="background:#2E5F8A;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
  className: 'custom-map-icon-iccc',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

const EYE_ICON = L.divIcon({
  html: `<div style="background:#C4922A;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>`,
  className: 'custom-map-icon-model',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

const INCIDENT_ICON = L.divIcon({
  html: `<div style="background:#B52A2A;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
  className: 'custom-map-icon-incident',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

const PATROL_ICON = L.divIcon({
  html: `<div style="background:#1A2B4A;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"/><path d="M4 16v4"/><path d="M20 16v4"/><path d="M9 16h6"/></svg></div>`,
  className: 'custom-map-icon-patrol',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

export function CrimeMap() {
  const [layers, setLayers] = useState<Record<string, boolean>>({
    incidents: true,
    patrol: true,
    cctv_iccc: true,
    cctv_model: true,
  })

  const [activeWard, setActiveWard] = useState<string | null>(null)
  const [wardRiskData, setWardRiskData] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [patrolUnits, setPatrolUnits] = useState<any[]>([])
  const [cctvAlerts, setCCTVAlerts] = useState<any[]>([])

  useEffect(() => {
    // Load initial map markers
    api.get('/map/incidents?hours=72').then(res => setIncidents(res.data)).catch(() => {})
    api.get('/map/alerts?limit=30').then(res => setCCTVAlerts(res.data)).catch(() => {})
    
    // Use fallback patrol unit list
    setPatrolUnits([
      { id: '1', name: 'PCR Mobile 1', lat: 23.0300, lon: 72.5100, status: 'available' },
      { id: '2', name: 'PCR Mobile 2', lat: 23.0470, lon: 72.5060, status: 'deployed' },
      { id: '3', name: 'PCR Mobile 3', lat: 22.9890, lon: 72.6030, status: 'available' }
    ])
  }, [])

  // Web socket listener for real time updates
  useWebSocket((event) => {
    if (event.type === 'NEW_FIR') {
      const newInc = {
        id: event.case_id,
        crime_type: event.crime_type,
        lat: event.lat,
        lon: event.lon,
        severity: 3,
        source: 'fir',
        case_id: event.case_id,
        ward: event.ward
      }
      setIncidents(prev => [newInc, ...prev])
    }
    if (event.type === 'CCTV_ALERT' && event.alert) {
      setCCTVAlerts(prev => [event.alert, ...prev])
    }
  })

  const handleWardClick = (wardName: string, riskInfo: any) => {
    setActiveWard(wardName)
    setWardRiskData(riskInfo)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 60px)' }}>
      {/* Ward detail panel */}
      {activeWard && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          background: '#FFFFFF', border: '1px solid #D1D9E6',
          borderRadius: '6px', padding: '16px', minWidth: '220px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#1A2B4A' }}>{activeWard} Ward</h4>
            <button 
              onClick={() => setActiveWard(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#5A6A7E' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              Risk Index: <RiskBadge score={wardRiskData?.risk_score || 30} />
            </div>
            <div style={{ fontSize: '12px', color: '#5A6A7E' }}>
              Level: {wardRiskData?.level || 'LOW'}
            </div>
            <div style={{ fontSize: '11px', color: '#C4922A', fontWeight: 500 }}>
              {wardRiskData?.festival_flag ? "⚠️ Festival Risk Multiplier Active" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Layer toggle panel */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        background: '#FFFFFF', border: '1px solid #D1D9E6',
        borderRadius: '6px', padding: '12px', minWidth: '180px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '11px', fontWeight: 600,
          color: '#5A6A7E', marginBottom: '8px',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Map Layers
        </div>
        {Object.entries(layers).map(([key, active]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', margin: '6px 0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={active}
              onChange={e => setLayers(p => ({...p, [key]: e.target.checked}))}
            />
            {key === 'incidents' && "Recent Crimes (72h)"}
            {key === 'patrol' && "Patrol Units"}
            {key === 'cctv_iccc' && "ICCC Cameras"}
            {key === 'cctv_model' && "AI Model Cameras"}
          </label>
        ))}
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={13}
        maxBounds={MAP_BOUNDS as any}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          maxZoom={19}
        />
        
        <WardLayer onWardClick={handleWardClick} />
        
        {/* Render Incidents */}
        {layers.incidents && incidents.map((inc) => (
          inc.lat && inc.lon && (
            <Marker key={inc.id} position={[inc.lat, inc.lon]} icon={INCIDENT_ICON}>
              <Popup>
                <div style={{ fontSize: '12px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 600, color: '#B52A2A', marginBottom: '2px' }}>
                    {inc.crime_type.toUpperCase()}
                  </div>
                  <div>Source: {inc.source.toUpperCase()}</div>
                  <div>Severity: {inc.severity}/5</div>
                  <div>Ward: {inc.ward}</div>
                  {inc.case_id && (
                    <a href={`/cases/${inc.case_id}`} style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', color: '#2E5F8A', textDecoration: 'none', fontWeight: 600 }}>
                      View Case Details →
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Render Patrol Units */}
        {layers.patrol && patrolUnits.map((u) => (
          u.lat && u.lon && (
            <Marker key={u.id} position={[u.lat, u.lon]} icon={PATROL_ICON}>
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#1A2B4A', marginBottom: '2px' }}>
                    {u.name}
                  </div>
                  <div>Status: <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{u.status}</span></div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Render CCTV alerts (ICCC or AI model) */}
        {cctvAlerts.map((al) => {
          if (!al.lat || !al.lon) return null
          const isICCC = al.source === 'iccc'
          if (isICCC && !layers.cctv_iccc) return null
          if (!isICCC && !layers.cctv_model) return null

          return (
            <Marker key={al.id} position={[al.lat, al.lon]} icon={isICCC ? SHIELD_ICON : EYE_ICON}>
              <Popup>
                <div style={{ fontSize: '12px', minWidth: '160px' }}>
                  <div style={{ fontWeight: 600, color: isICCC ? '#2E5F8A' : '#C4922A', marginBottom: '2px' }}>
                    CCTV: {al.alert_type.replace('_',' ').toUpperCase()}
                  </div>
                  <div>Camera ID: {al.camera_id}</div>
                  <div>Source: {isICCC ? 'ICCC (Command Centre)' : 'SAMRAKSHA AI'}</div>
                  <div>Confidence: {Math.round(al.confidence * 100)}%</div>
                  {al.person_count && <div>People Count: {al.person_count}</div>}
                  {al.plate_no && <div style={{ fontFamily: 'IBM Plex Mono', background: '#F4F6F9', padding: '3px', marginTop: '4px', fontWeight: 600 }}>Plate: {al.plate_no}</div>}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

interface WardLayerProps {
  onWardClick: (wardName: string, riskInfo: any) => void
}

function WardLayer({ onWardClick }: WardLayerProps) {
  const [wards, setWards] = useState<any>(null)
  const [risks, setRisks] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/data/ahmedabad_wards_2024.geojson')
      .then(r => r.json())
      .then(setWards)
      .catch(() => {})

    api.get('/map/wards')
      .then(r => setRisks(r.data))
      .catch(() => {})
  }, [])

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#B52A2A'
    if (score >= 60) return '#C4922A'
    if (score >= 30) return '#C47A1A'
    return '#2A7A4B'
  }

  if (!wards) return null

  return (
    <GeoJSON
      data={wards}
      style={(feature: any) => {
        const name = feature?.properties?.ward_name
        const rInfo = risks[name] || { risk_score: 30 }
        return {
          fillColor: getRiskColor(rInfo.risk_score),
          fillOpacity: 0.25,
          color: '#1A2B4A',
          weight: 1.5,
          opacity: 0.8
        }
      }}
      onEachFeature={(feature: any, layer: any) => {
        const name = feature?.properties?.ward_name
        layer.on('click', () => {
          const rInfo = risks[name] || { risk_score: 30, level: 'LOW' }
          onWardClick(name, rInfo)
        })
      }}
    />
  )
}
