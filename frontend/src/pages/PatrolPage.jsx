import React, { useEffect, useState, useCallback, useRef } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { patrol } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

const STATUS_COLORS = {
  available: 'var(--success)',
  deployed: 'var(--info)',
  responding: 'var(--tertiary)',
  offline: 'var(--error)',
};



function DispatchModal({ onClose, onDispatched }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    unit_no: '',
    officer_name: '',
    vehicle: '',
    status: 'deployed',
    location: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
    try {
      const res = await patrol.createUnit(form);
      onDispatched(res.data.unit || form);
      setLoading(false);
      onClose();
    } catch (err) {
      alert("Failed to dispatch unit");
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const label = { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'block' };
  const field = { display: 'flex', flexDirection: 'column', gap: 4 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'var(--bg)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontFamily: 'var(--font-headline)' }}>🚔 Dispatch Patrol Unit</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        
        <form id="dispatch-form" onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={field}>
            <label style={label}>Unit Number *</label>
            <input required style={inp} value={form.unit_no} onChange={e => setForm({...form, unit_no: e.target.value})} placeholder="e.g. PU-106" />
          </div>
          <div style={field}>
            <label style={label}>Officer Name *</label>
            <input required style={inp} value={form.officer_name} onChange={e => setForm({...form, officer_name: e.target.value})} placeholder="e.g. Const. Patel" />
          </div>
          <div style={field}>
            <label style={label}>Vehicle Number</label>
            <input style={inp} value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} placeholder="e.g. GJ-01-PA-XXXX" />
          </div>
          <div style={field}>
            <label style={label}>Destination / Area *</label>
            <input required style={inp} value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Bapunagar Circle" />
          </div>
          <div style={field}>
            <label style={label}>Status</label>
            <select style={inp} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="available">Available</option>
              <option value="deployed">Deployed</option>
              <option value="responding">Responding</option>
            </select>
          </div>
        </form>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>Cancel</button>
          <button type="submit" form="dispatch-form" disabled={loading} style={{
            padding: '10px 28px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--info)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? 'Dispatching…' : '🚀 Dispatch Unit'}</button>
        </div>
      </div>
    </div>
  );
}

function UnitDetailsModal({ routeData, onClose, onReroute, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(routeData.unit);
  const [manualWaypoints, setManualWaypoints] = useState(routeData.unit.manual_waypoints || []);
  const [newWaypoint, setNewWaypoint] = useState('');

  const { unit, route, road_path } = routeData;
  const positions = (route || []).map(r => [r.lat || r.current_lat || 23.0225, r.lon || r.current_lon || 72.5714]);
  const center = positions.length > 0 ? positions[0] : [23.0225, 72.5714];
  
  // Use dense road geometry if available, otherwise fallback to straight lines between waypoints
  const mapPolyline = (road_path && road_path.length > 0) ? road_path : positions;

  const handleViewOnMap = () => {
    if (positions.length === 0) return alert("No active route coordinates to display.");
    const origin = `${positions[0][0]},${positions[0][1]}`;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}`;
    if (positions.length > 1) {
      const dest = `${positions[positions.length-1][0]},${positions[positions.length-1][1]}`;
      url += `&destination=${dest}`;
      if (positions.length > 2) {
        const waypoints = positions.slice(1, positions.length-1).map(p => `${p[0]},${p[1]}`).join('|');
        url += `&waypoints=${waypoints}`;
      }
    }
    window.open(url, '_blank');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 1000, height: '80vh',
        background: 'var(--bg)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', display: 'flex',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        
        {/* LEFT: MAP */}
        <div style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border)' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {mapPolyline.length > 0 && <Polyline positions={mapPolyline} color="var(--info)" weight={5} opacity={0.8} />}
            {positions.map((pos, idx) => (
              <Marker key={idx} position={pos}>
                <Popup>{idx === 0 ? "Current Location" : `Waypoint ${idx}`}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* RIGHT: DETAILS & ACTIONS */}
        <div style={{ width: 350, display: 'flex', flexDirection: 'column', padding: 24, background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontFamily: 'var(--font-headline)' }}>{unit.unit_no || unit.unit_name || 'Unit'}</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Officer</div>
              <div style={{ fontSize: 14 }}>{unit.officer_name || unit.officer || 'Unknown'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Vehicle</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)' }}>{unit.vehicle || unit.vehicle_number || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 14, color: STATUS_COLORS[unit.status] || 'var(--text)', fontWeight: 700, textTransform: 'uppercase' }}>
                {unit.status}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Waypoints</div>
              <div style={{ fontSize: 14 }}>{positions.length} stops</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <button onClick={onReroute} style={{
              padding: '12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--info)',
              color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8
            }}>
              <span>🔄</span> Auto Re-route (AI/ML)
            </button>
            <button onClick={handleViewOnMap} style={{
              padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8
            }}>
              <span>🗺️</span> View on map
            </button>
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} style={{
                  padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8
                }}>
                  <span>✏️</span> Edit / Modify Unit
                </button>
                <button onClick={() => onDelete(unit.id)} style={{
                  padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--error)', background: 'rgba(239,68,68,0.1)',
                  color: 'var(--error)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8
                }}>
                  <span>⚠️</span> Delete / Unassign Team
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Modify Unit Details</h4>
                <input value={editForm.unit_name || editForm.unit_no || ''} onChange={e => setEditForm({...editForm, unit_no: e.target.value})} placeholder="Unit Name" style={{ padding: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff' }} />
                <input value={editForm.officer_name || ''} onChange={e => setEditForm({...editForm, officer_name: e.target.value})} placeholder="Officer Name" style={{ padding: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff' }} />
                <input value={editForm.vehicle || ''} onChange={e => setEditForm({...editForm, vehicle: e.target.value})} placeholder="Vehicle Number" style={{ padding: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff' }} />
                
                <h4 style={{ margin: '10px 0 0 0' }}>Manual Route Destinations</h4>
                {manualWaypoints.map((mw, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 12 }}>📍 {mw.name || 'Custom Area'}</span>
                    <button onClick={() => setManualWaypoints(manualWaypoints.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 5 }}>
                  <input value={newWaypoint} onChange={e => setNewWaypoint(e.target.value)} placeholder="Add Location (e.g. Navrangpura)" style={{ flex: 1, padding: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff' }} />
                  <button onClick={() => {
                    if(!newWaypoint) return;
                    setManualWaypoints([...manualWaypoints, { name: newWaypoint, lat: 23.02 + Math.random()*0.03, lon: 72.55 + Math.random()*0.03 }]);
                    setNewWaypoint('');
                  }} style={{ padding: '0 12px', background: 'var(--info)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>+</button>
                </div>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: 8, background: 'transparent', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => {
                    onUpdate(unit.id, { ...editForm, manual_waypoints: manualWaypoints });
                    setIsEditing(false);
                  }} style={{ flex: 1, padding: 8, background: 'var(--success)', border: 'none', color: '#fff', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatrolPage() {
  const [routesData, setRoutesData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const officer = useAuthStore(s => s.officer);
  const canDispatch = ['admin', 'sho', 'dcp'].includes(officer?.role);

  const load = useCallback(async () => {
    try {
      const res = await patrol.list();
      const data = res.data?.routes || res.data || [];
      setRoutesData(data);
    } catch {
      setRoutesData([]);
    }
  }, []);

  const handleReroute = async () => {
    await load();
    if (selectedUnit) {
      setSelectedUnit(prev => routesData.find(r => (r.unit?.id || r.unit_no) === (prev.unit?.id || prev.unit_no)) || prev);
    }
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm("Are you sure you want to delete this patrol unit?")) return;
    try {
      await patrol.deleteUnit(id);
      setSelectedUnit(null);
      load();
    } catch (e) {
      alert("Failed to delete unit.");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await patrol.updateUnit(id, data);
      await load(); // Reload to get new AI routes
      // Maintain selected unit open, updating its data
      setSelectedUnit(prev => {
        // Find newly loaded route for this unit
        // We'll let `load()` finish, but since React state updates asynchronously, 
        // we handle it in a separate effect or just close the modal for simplicity.
        return null; // Close modal on save so user sees new route animate in
      });
    } catch (e) {
      alert("Failed to update unit details.");
    }
  };

  useEffect(() => { load(); }, [load]);

  return (
    <PageShell 
      title="Patrol Units" 
      onRefresh={load}
      headerAction={
        canDispatch && (
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--info)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(6,182,212,0.3)',
            transition: 'all var(--t-fast) var(--ease)',
          }}>
            <span style={{ fontSize: 16 }}>+</span> Dispatch Unit
          </button>
        )
      }
    >
      {routesData.length === 0 ? (
        <EmptyState icon="🚔" text="No patrol units available" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {routesData.map((routeItem, i) => {
            const u = routeItem.unit || routeItem;
            const status = String(u.status || 'available').toLowerCase();
            const color = STATUS_COLORS[status] || 'var(--secondary)';
            return (
              <div 
                key={u.unit_no || u.id || i} 
                onClick={() => setSelectedUnit(routeItem)}
                className="glass fade-in-up" 
                style={{ padding: 20, animationDelay: `${i * 0.04}s`, borderTop: `3px solid ${color}`, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 17 }}>
                    🚔 {u.unit_no || u.unit_number || `Unit ${i + 1}`}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: '50%', background: color,
                      animation: status !== 'offline' ? 'pulse 2s infinite' : 'none',
                    }} />
                    <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      {status}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  <div>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Officer</div>
                    <span style={{ color: 'var(--text)' }}>{u.officer_name || u.officer || '—'}</span>
                  </div>
                  <div>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Vehicle</div>
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.vehicle || u.vehicle_number || '—'}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Location</div>
                    <span style={{ color: 'var(--text)' }}>📍 {u.location || u.current_location || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DispatchModal 
          onClose={() => setShowModal(false)} 
          onDispatched={(unit) => setRoutesData([{unit}, ...routesData])} 
        />
      )}

      {selectedUnit && (
        <UnitDetailsModal
          routeData={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onReroute={handleReroute}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </PageShell>
  );
}
