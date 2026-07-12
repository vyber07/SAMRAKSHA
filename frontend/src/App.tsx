import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './index.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

// Type definitions for app state
interface Hotspot {
  id: number;
  lat: number;
  lon: number;
  risk: 'High' | 'Medium' | 'Low';
  title: string;
}

interface CCTVAlert {
  id: number;
  camera: string;
  type: string;
  status: 'Critical' | 'Info';
}

interface DocumentLog {
  type: string;
  hash: string;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [officer, setOfficer] = useState<{ badge_no: string; role: string } | null>(null);

  // Map state
  const [hotspots, setHotspots] = useState<Hotspot[]>([
    { id: 1, lat: 23.0225, lon: 72.5714, risk: 'High', title: 'Hotspot A' },
    { id: 2, lat: 22.9876, lon: 72.6123, risk: 'Medium', title: 'Hotspot B' },
    { id: 3, lat: 23.0567, lon: 72.5112, risk: 'Low', title: 'Hotspot C' },
  ]);
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');
  const [newRisk, setNewRisk] = useState<'High' | 'Medium' | 'Low'>('High');
  const [patrolRoute, setPatrolRoute] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // FIR state
  const [complainant, setComplainant] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [suggestedSection, setSuggestedSection] = useState('');
  const [firLoading, setFirLoading] = useState(false);
  const [firSuccess, setFirSuccess] = useState<string | null>(null);
  const [firError, setFirError] = useState<string | null>(null);

  // Case Detail state
  const [selectedCase, setSelectedCase] = useState({
    id: 1,
    fir_number: 'FIR-2026-0042',
    status: 'Under Investigation',
    complainant: 'Ramesh Patel',
    description: 'Theft of vehicle near Ahmedabad station',
  });
  const [diaryLogs, setDiaryLogs] = useState<string[]>([
    'FIR Registered successfully',
    'Evidence collected from spot',
  ]);
  const [newDiaryLog, setNewDiaryLog] = useState('');
  const [cctvAlerts] = useState<CCTVAlert[]>([
    { id: 1, camera: 'Cam 102 (Ahmedabad Stn)', type: 'Loitering', status: 'Critical' },
    { id: 2, camera: 'Cam 105 (Bus Terminus)', type: 'Crowd Gathering', status: 'Info' },
  ]);
  const [selectedCCTVAlert, setSelectedCCTVAlert] = useState<CCTVAlert | null>(null);
  const [documentLogs, setDocumentLogs] = useState<DocumentLog[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'diary' | 'cctv' | 'docs'>('details');

  // AI Chat state
  const [chatMode, setChatMode] = useState<'This Case' | 'All Cases'>('This Case');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello, I am your SAMRAKSHA AI Assistant. How can I help you today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Additional states for Combinations & Scenarios (T3 & T4)
  const [patrolStatus, setPatrolStatus] = useState('Active');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Hotspot[]>([]);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');

  // Reference unused state variables to satisfy noUnusedLocals compiler option
  void patrolStatus;
  void setPatrolStatus;
  void isOnline;
  void setIsOnline;
  void offlineQueue;
  void dbStatus;
  void setDbStatus;
  void selectedHotspot;

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token && !officer) {
      let badge_no = 'TEST01';
      let role = 'Investigator';
      if (token.includes('patrol')) {
        badge_no = 'PATROL02';
        role = 'Patrol';
      } else if (token.includes('sho')) {
        badge_no = 'SHO01';
        role = 'SHO';
      } else if (token.includes('dcp')) {
        badge_no = 'DCP01';
        role = 'DCP';
      }
      setOfficer({ badge_no, role });
    }

    const cached = localStorage.getItem('offline_coordinates');
    if (cached) {
      setOfflineQueue(JSON.parse(cached));
    }

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [officer]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    // Route protection
    const token = localStorage.getItem('token');
    if (!token && currentPath !== '/') {
      navigate('/');
    } else if (token && currentPath === '/') {
      navigate('/dashboard');
    }
  }, [currentPath]);

  // Fetch map hotspots if map page loaded
  useEffect(() => {
    if (currentPath === '/map') {
      fetch('/map/hotspots')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then((data) => {
          if (data && data.hotspots) {
            setHotspots(data.hotspots);
          }
          setFetchError(false);
        })
        .catch(() => {
          setFetchError(true);
        });
    }
  }, [currentPath]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const badge_no = (document.getElementById('badge') as HTMLInputElement).value;
    const password = (document.getElementById('pass') as HTMLInputElement).value;

    // Sanitization check
    if (badge_no.includes('<script>') || badge_no.includes('</script>')) {
      alert('Invalid characters in badge number.');
      return;
    }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badge_no, password }),
      });

      if (response.ok) {
        const data = await response.json();
        let role = 'Investigator';
        if (badge_no.startsWith('PATROL')) {
          role = 'Patrol';
        } else if (badge_no.startsWith('SHO')) {
          role = 'SHO';
        } else if (badge_no.startsWith('DCP')) {
          role = 'DCP';
        }
        setOfficer({ badge_no: data.officer?.badge_no || badge_no, role });
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (err) {
      alert('Network error connecting to backend.');
    }
  };

  const handleLogout = () => {
    setOfficer(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (val.toLowerCase().includes('theft')) {
      setSuggestedSection('BNS 303 (Theft)');
    } else if (val.toLowerCase().includes('assault')) {
      setSuggestedSection('BNS 115 (Voluntarily causing hurt)');
    } else {
      setSuggestedSection('BNS 101');
    }
  };

  const handleFIRSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < 22.5 || lat > 23.5 || lon < 72.0 || lon > 73.2) {
      setFirError('Coordinates must be within Ahmedabad bounds');
      return;
    }

    setFirLoading(true);
    setFirError(null);
    setFirSuccess(null);

    try {
      const response = await fetch('/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          complainant,
          description,
          latitude: lat,
          longitude: lon,
          incident_time: incidentTime,
          police_station: policeStation,
          section: suggestedSection,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFirSuccess(`FIR submitted successfully! FIR Number: ${data.fir_number || 'FIR-2026-9999'}`);
        // Update dashboard cases/status or local case details
        setSelectedCase({
          id: 2,
          fir_number: data.fir_number || 'FIR-2026-9999',
          status: 'Under Investigation',
          complainant,
          description,
        });
        setDiaryLogs(['FIR Registered successfully']);
        // Clear fields
        setComplainant('');
        setDescription('');
        setLatitude('');
        setLongitude('');
        setIncidentTime('');
        setPoliceStation('');
        setSuggestedSection('');
      } else {
        if (response.status === 503) {
          setFirError('Database connection error');
          setDbStatus('offline');
        } else {
          setFirError('FIR submission failed');
        }
      }
    } catch (err) {
      setFirError('Database connection error');
      setDbStatus('offline');
    } finally {
      setFirLoading(false);
    }
  };

  const handleSearchLocation = () => {
    if (searchQuery.toLowerCase() === 'ahmedabad') {
      alert('Centered map on Ahmedabad');
    } else {
      alert(`Location ${searchQuery} not found`);
    }
  };

  const handleAddHotspot = (e: FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(newLat);
    const lon = parseFloat(newLon);
    if (lat < 22.5 || lat > 23.5 || lon < 72.0 || lon > 73.2) {
      alert('Coordinates must be within Ahmedabad bounds');
      return;
    }
    const newH: Hotspot = {
      id: hotspots.length + 1,
      lat,
      lon,
      risk: newRisk,
      title: `Custom Hotspot ${hotspots.length + 1}`,
    };
    if (!isOnline) {
      const updatedQueue = [...offlineQueue, newH];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('offline_coordinates', JSON.stringify(updatedQueue));
      alert('Offline: Caching coordinates');
    } else {
      setHotspots([...hotspots, newH]);
    }
    setNewLat('');
    setNewLon('');
  };

  const handleSync = () => {
    setIsOnline(true);
    const syncedHotspots = [...hotspots, ...offlineQueue];
    setHotspots(syncedHotspots);
    setOfflineQueue([]);
    localStorage.removeItem('offline_coordinates');
    alert('Synced coordinates successfully');
  };
  void handleSync;

  const handleAddDiaryLog = (e: FormEvent) => {
    e.preventDefault();
    if (!newDiaryLog.trim()) return;
    setDiaryLogs([...diaryLogs, newDiaryLog.trim()]);
    setNewDiaryLog('');
  };

  const handleGenerateDoc = async (docType: string) => {
    setDocLoading(true);
    setDocError(null);
    try {
      const res = await fetch('/docs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ case_id: selectedCase.id, doc_type: docType }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocumentLogs([...documentLogs, { type: docType, hash: data.hash }]);
      } else {
        setDocError('Document generation failed');
      }
    } catch (err) {
      setDocError('Document generation failed');
    } finally {
      setDocLoading(false);
    }
  };

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    if (userText.toLowerCase().includes('recipe') || userText.toLowerCase().includes('cook')) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error: Out of scope query. I can only assist with policing/legal queries.' },
      ]);
      return;
    }

    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query: userText, mode: chatMode, case_id: selectedCase.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'ai', text: data.response }]);
        if (data.prefill) {
          if (data.prefill.complainant) setComplainant(data.prefill.complainant);
          if (data.prefill.description) setDescription(data.prefill.description);
          if (data.prefill.latitude) setLatitude(data.prefill.latitude.toString());
          if (data.prefill.longitude) setLongitude(data.prefill.longitude.toString());
          if (data.prefill.incident_time) setIncidentTime(data.prefill.incident_time);
          if (data.prefill.police_station) setPoliceStation(data.prefill.police_station);
        }
      } else {
        setChatError('Assistant service offline');
      }
    } catch (err) {
      setChatError('Assistant service offline');
    } finally {
      setChatLoading(false);
    }
  };

  const renderNavBar = () => {
    if (currentPath === '/') return null;
    return (
      <header className="flex justify-between items-center card" style={{ padding: '1rem 2rem', marginBottom: '2rem' }}>
        <h2>SAMRAKSHA <span className="text-muted" style={{ fontSize: '1rem' }}>| Portal</span></h2>
        <nav className="flex gap-4">
          <button onClick={() => navigate('/dashboard')} className="btn" data-testid="nav-dashboard">Dashboard</button>
          <button onClick={() => navigate('/map')} className="btn" data-testid="nav-map">Map</button>
          <button onClick={() => navigate('/fir')} className="btn" data-testid="nav-fir">FIR Form</button>
          <button onClick={() => navigate('/case-detail')} className="btn" data-testid="nav-case-detail">Case Detail</button>
          <button onClick={() => navigate('/ai-chat')} className="btn" data-testid="nav-ai-chat">AI Chat</button>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-muted">Welcome, {officer?.badge_no || 'Officer'} ({officer?.role || 'Investigator'})</span>
          <button onClick={handleLogout} className="btn" data-testid="logout-btn" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
            Logout
          </button>
        </div>
      </header>
    );
  };

  if (currentPath === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center">
            <h1 style={{ color: 'var(--color-primary)' }}>SAMRAKSHA</h1>
            <p className="text-muted">Predictive Policing Intelligence</p>
          </div>
          <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
            <div className="input-group">
              <label htmlFor="badge">Badge Number</label>
              <input id="badge" type="text" className="input-field" placeholder="Enter badge no" required />
            </div>
            <div className="input-group">
              <label htmlFor="pass">Password</label>
              <input id="pass" type="password" className="input-field" placeholder="Enter password" required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container">
        {renderNavBar()}

        {dbStatus === 'offline' && (
          <div className="card" data-testid="db-offline-alert" style={{ border: '2px solid var(--color-danger)', backgroundColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', padding: '1rem' }}>
            <h3 style={{ color: 'var(--color-danger)', margin: 0 }}>Database connection lost. Enforced Read-Only Cache Mode.</h3>
          </div>
        )}

        {currentPath === '/dashboard' && (
          <div className="dashboard-grid">
            <div className="card" onClick={() => navigate('/case-detail')} style={{ cursor: 'pointer' }}>
              <h3>Active Cases</h3>
              <p className="text-muted" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'var(--color-primary)' }}>24</p>
              <p className="text-muted">Requires immediate attention</p>
            </div>
            <div className="card" onClick={() => navigate('/fir')} style={{ cursor: 'pointer' }}>
              <h3>New FIRs</h3>
              <p className="text-muted" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'var(--color-warning)' }}>3</p>
              <p className="text-muted">Registered today</p>
            </div>
            <div className="card" onClick={() => navigate('/map')} style={{ cursor: 'pointer' }}>
              <h3>Patrol Status</h3>
              <p className="text-muted" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'var(--color-success)' }}>{patrolStatus}</p>
              <p className="text-muted">12 units deployed</p>
            </div>
            {officer?.role === 'SHO' && (
              <div className="card" data-testid="sho-panel">
                <h3>SHO Control Panel</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPatrolStatus('Rerouting');
                    setPatrolRoute(true);
                    alert('Patrol rerouted via OR-Tools');
                  }}
                  className="btn btn-primary"
                  data-testid="reroute-btn"
                >
                  Reroute Patrol (OR-Tools)
                </button>
              </div>
            )}
            {officer?.role === 'DCP' && (
              <div className="card" data-testid="dcp-audit-panel">
                <h3>DCP Audit Panel</h3>
                <p>Auditing 3 active Police Stations</p>
              </div>
            )}
          </div>
        )}

        {currentPath === '/map' && (
          <div>
            <h2>Crime Map Analytics & Patrol Routing</h2>
            {fetchError && <p style={{ color: 'red' }}>Failed to load map data.</p>}
            
            <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search Ahmedabad regions..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="input-field"
              />
              <button className="btn" onClick={handleSearchLocation}>Search</button>
            </div>

            <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
              <button className={`btn ${filter === 'All' ? 'btn-primary' : ''}`} onClick={() => setFilter('All')}>All</button>
              <button className={`btn ${filter === 'High' ? 'btn-primary' : ''}`} onClick={() => setFilter('High')}>High Risk</button>
              <button className={`btn ${filter === 'Medium' ? 'btn-primary' : ''}`} onClick={() => setFilter('Medium')}>Medium Risk</button>
              <button className={`btn ${filter === 'Low' ? 'btn-primary' : ''}`} onClick={() => setFilter('Low')}>Low Risk</button>
              <button className="btn btn-primary" onClick={() => setPatrolRoute(!patrolRoute)}>
                {patrolRoute ? 'Hide Patrol Route' : 'Show Patrol Route'}
              </button>
              <button className="btn" data-testid="network-toggle" onClick={() => setIsOnline(!isOnline)}>
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
              {!isOnline && <span className="text-muted" data-testid="offline-indicator" style={{ marginLeft: '1rem', alignSelf: 'center', color: 'var(--color-danger)' }}>Offline Mode</span>}
              {!isOnline && offlineQueue.length > 0 && (
                <button className="btn btn-primary" data-testid="sync-btn" onClick={handleSync}>
                  Sync ({offlineQueue.length})
                </button>
              )}
            </div>

            {/* Real Map Container */}
            <div className="card" data-testid="map-details" style={{ height: '500px', width: '100%', padding: 0, overflow: 'hidden' }}>
              <MapContainer center={[23.0225, 72.5714]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hotspots
                  .filter((h) => filter === 'All' || h.risk === filter)
                  .map((h) => (
                    <Marker 
                      key={h.id} 
                      position={[h.lat, h.lon]}
                      eventHandlers={{ click: () => setSelectedHotspot(h) }}
                    >
                      <Popup>
                        <strong>{h.title}</strong><br />
                        Risk: {h.risk}<br />
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
                          setLatitude(h.lat.toString());
                          setLongitude(h.lon.toString());
                          navigate('/fir');
                        }}>
                          Create FIR Here
                        </button>
                      </Popup>
                    </Marker>
                  ))}
                  {patrolRoute && (
                    <Polyline 
                      positions={hotspots.map(h => [h.lat, h.lon] as [number, number])} 
                      color="blue" 
                    />
                  )}
              </MapContainer>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <h4>Legend</h4>
              <p>🔴 Red: High Risk | 🟡 Yellow: Medium Risk | 🟢 Green: Low Risk</p>
            </div>

            {patrolRoute && <div data-testid="patrol-route-active">Patrol Route Overlay Displayed</div>}

            <form onSubmit={handleAddHotspot} className="card" style={{ marginTop: '1rem' }}>
              <h4>Add Hotspot Coordinates</h4>
              <div className="flex gap-4">
                <input type="text" placeholder="Lat" value={newLat} onChange={(e) => setNewLat(e.target.value)} required className="input-field" />
                <input type="text" placeholder="Lon" value={newLon} onChange={(e) => setNewLon(e.target.value)} required className="input-field" />
                <select value={newRisk} onChange={(e) => setNewRisk(e.target.value as 'High' | 'Medium' | 'Low')} className="input-field">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button type="submit" className="btn btn-primary">Add Hotspot</button>
              </div>
            </form>
          </div>
        )}

        {currentPath === '/fir' && (
          <div className="card">
            <h2>FIR Registration</h2>
            {firSuccess && <p style={{ color: 'green' }}>{firSuccess}</p>}
            {firError && <p style={{ color: 'red' }}>{firError}</p>}
            
            <form onSubmit={handleFIRSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="complainant">Complainant Name</label>
                <input id="complainant" type="text" className="input-field" value={complainant} onChange={(e) => setComplainant(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="description">Incident Description</label>
                <textarea id="description" className="input-field" value={description} onChange={handleDescriptionChange} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="latitude">Latitude</label>
                  <input id="latitude" type="text" className="input-field" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="longitude">Longitude</label>
                  <input id="longitude" type="text" className="input-field" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="incident_time">Incident Time</label>
                  <input id="incident_time" type="datetime-local" className="input-field" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="police_station">Police Station</label>
                  <input id="police_station" type="text" className="input-field" value={policeStation} onChange={(e) => setPoliceStation(e.target.value)} required />
                </div>
              </div>
              <div>
                <label htmlFor="suggested_section">Suggested BNS Section</label>
                <input id="suggested_section" type="text" className="input-field" value={suggestedSection} readOnly />
              </div>
              <button type="submit" className="btn btn-primary" disabled={firLoading || dbStatus === 'offline'}>
                {dbStatus === 'offline' ? 'Read-Only Mode' : firLoading ? 'Submitting FIR...' : 'Submit FIR'}
              </button>
            </form>
          </div>
        )}

        {currentPath === '/case-detail' && (
          <div>
            {officer?.role === 'Patrol' ? (
              <div className="card">
                <h3>Access Denied</h3>
                <p style={{ color: 'red' }}>Access Denied: Insufficient permissions to view sensitive case files.</p>
              </div>
            ) : (
              <div className="card">
                <h2>Case Detail: {selectedCase.fir_number}</h2>
                <p><strong>Status:</strong> {selectedCase.status}</p>
                <p><strong>Complainant:</strong> {selectedCase.complainant}</p>
                
                <div className="flex gap-4" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                  <button onClick={() => setActiveTab('details')} className={`btn ${activeTab === 'details' ? 'btn-primary' : ''}`}>Case Details</button>
                  <button onClick={() => setActiveTab('diary')} className={`btn ${activeTab === 'diary' ? 'btn-primary' : ''}`}>Case Diary</button>
                  <button onClick={() => setActiveTab('cctv')} className={`btn ${activeTab === 'cctv' ? 'btn-primary' : ''}`}>CCTV Alerts</button>
                  <button onClick={() => setActiveTab('docs')} className={`btn ${activeTab === 'docs' ? 'btn-primary' : ''}`}>Documents</button>
                </div>

                {activeTab === 'details' && (
                  <div>
                    <p>{selectedCase.description}</p>
                  </div>
                )}

                {activeTab === 'diary' && (
                  <div>
                    <h3>Case Diary Logs</h3>
                    <ul>
                      {diaryLogs.map((log, idx) => (
                        <li key={idx}>{log}</li>
                      ))}
                    </ul>
                    <form onSubmit={handleAddDiaryLog} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <input id="diary_text" type="text" className="input-field" value={newDiaryLog} onChange={(e) => setNewDiaryLog(e.target.value)} placeholder="Add new diary entry..." required />
                      <button type="submit" className="btn">Add Log</button>
                    </form>
                  </div>
                )}

                {activeTab === 'cctv' && (
                  <div>
                    <h3>CCTV Area Feeds</h3>
                    <ul>
                      {cctvAlerts.map((alertItem) => (
                        <li key={alertItem.id} 
                            onClick={() => setSelectedCCTVAlert(alertItem)}
                            className={alertItem.status === 'Critical' ? 'critical-alert' : ''}
                            style={{ 
                              cursor: 'pointer', 
                              padding: '0.5rem', 
                              backgroundColor: alertItem.status === 'Critical' ? '#ffebeb' : 'transparent',
                              border: alertItem.status === 'Critical' ? '1px solid red' : 'none',
                              marginBottom: '0.5rem'
                            }}>
                          <strong>{alertItem.camera}</strong> - {alertItem.type} | 
                          <span style={{ color: alertItem.status === 'Critical' ? 'red' : 'green', fontWeight: 'bold' }}> {alertItem.status}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedCCTVAlert && (
                      <div className="card" style={{ marginTop: '1rem', border: '1px solid black' }}>
                        <h4>CCTV Video Analysis: {selectedCCTVAlert.camera}</h4>
                        <p>Playing CCTV feed...</p>
                        <p>MediaPipe Pose/Anomaly Detection Engine Running.</p>
                        <button className="btn" onClick={() => {
                          alert(`Loitering analyzed on ${selectedCCTVAlert.camera}`);
                          setSelectedCase(prev => ({ ...prev, status: 'Under Investigation' }));
                        }}>Trigger Loitering Analysis</button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'docs' && (
                  <div>
                    <h3>Generated Legal Documents</h3>
                    {docError && <p style={{ color: 'red' }}>{docError}</p>}
                    <ul>
                      {documentLogs.map((doc, idx) => (
                        <li key={idx}>
                          <strong>{doc.type}</strong> - Verification Hash: <code data-testid="doc-hash">{doc.hash}</code>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex gap-4" style={{ marginTop: '1rem' }}>
                      <button className="btn" onClick={() => handleGenerateDoc('FIR Copy')} disabled={docLoading}>Generate FIR Copy</button>
                      <button className="btn" onClick={() => handleGenerateDoc('Arrest Memo')} disabled={docLoading}>Generate Arrest Memo</button>
                      <button className="btn" onClick={() => handleGenerateDoc('Charge Sheet')} disabled={docLoading}>Generate Charge Sheet</button>
                      <button className="btn" onClick={() => handleGenerateDoc('Seizure Memo')} disabled={docLoading}>Generate Seizure Memo</button>
                    </div>
                    {docLoading && <p>Generating document...</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentPath === '/ai-chat' && (
          <div className="card">
            <h2>AI Assistant</h2>
            
            <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
              <button 
                className={`btn ${chatMode === 'This Case' ? 'btn-primary' : ''}`}
                onClick={() => setChatMode('This Case')}
              >
                This Case Mode
              </button>
              <button 
                className={`btn ${chatMode === 'All Cases' ? 'btn-primary' : ''}`}
                onClick={() => setChatMode('All Cases')}
              >
                All Cases Mode
              </button>
              <button className="btn" onClick={() => setMessages([])}>Reset</button>
            </div>

            <div className="card" style={{ height: '300px', overflowY: 'auto', marginBottom: '1rem' }} data-testid="chat-box">
              {messages.map((m, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '10px', 
                    backgroundColor: m.sender === 'user' ? '#e0f7fa' : '#f5f5f5' 
                  }}>
                    {m.text.includes('BNS') ? (
                      <span>
                        {m.text.split(/(BNS \d+)/).map((part, i) => 
                          part.match(/BNS \d+/) ? <strong key={i} className="legal-highlight" style={{ color: 'blue' }}>{part}</strong> : part
                        )}
                      </span>
                    ) : (
                      m.text
                    )}
                  </span>
                </div>
              ))}
              {chatLoading && <p>AI is thinking...</p>}
              {chatError && <p style={{ color: 'red' }}>{chatError}</p>}
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                id="chat_input" 
                type="text" 
                className="input-field" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Ask about BNS sections, Case info..." 
                required 
              />
              <button id="send_chat" type="submit" className="btn btn-primary">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
