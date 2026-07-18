import React, { useEffect, useState } from 'react';
import { hotspot } from '../lib/api';
import MapComponent from '../components/MapComponent';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function MapPage() {
  const [hotspots, setHotspots] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    showIncidents: true,
    showPatrols: true,
    showHotspots: true,
    incidentType: 'all',
    incidentStatus: 'all',
    severityLevel: 'all',
    dateRange: 'all',
  });

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const res = await hotspot.list();
      setHotspots(res.data || []);

      const mockIncidents = (res.data || []).flatMap((spot, idx) =>
        Array(Math.floor(Math.random() * 3) + 1)
          .fill(null)
          .map((_, i) => ({
            id: `incident-${idx}-${i}`,
            title: `Incident at ${spot.area}`,
            type: ['theft', 'assault', 'robbery', 'vandalism'][Math.floor(Math.random() * 4)],
            severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
            status: ['open', 'investigating', 'resolved'][Math.floor(Math.random() * 3)],
            latitude: spot.latitude + (Math.random() - 0.5) * 0.01,
            longitude: spot.longitude + (Math.random() - 0.5) * 0.01,
            timestamp: new Date(Date.now() - Math.random() * 86400000),
          }))
      );
      setIncidents(mockIncidents);

      const mockPatrols = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `patrol-${i}`,
          name: `Unit ${String.fromCharCode(65 + i)}${i + 1}`,
          status: Math.random() > 0.3 ? 'active' : 'idle',
          latitude: 20.5937 + (Math.random() - 0.5) * 2,
          longitude: 78.9629 + (Math.random() - 0.5) * 2,
          lastUpdate: new Date(),
        }));
      setPatrols(mockPatrols);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    return incidents.filter((incident) => {
      if (filters.incidentType !== 'all' && incident.type !== filters.incidentType) return false;
      if (filters.incidentStatus !== 'all' && incident.status !== filters.incidentStatus) return false;
      if (filters.severityLevel !== 'all' && incident.severity !== filters.severityLevel) return false;
      return true;
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredIncidents = filterIncidents();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadMapData} />
        <div style={{ flex: 1, overflow: 'hidden', padding: '24px', display: 'flex', gap: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          {/* Filter Sidebar */}
          <div style={{
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }} className="fade-in">
            {/* Map Layers */}
            <div className="glass" style={{ padding: '20px' }}>
              <h3 className="heading-sm" style={{ margin: '0 0 16px 0' }}>
                Map Layers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'showIncidents', label: '⚠️ Incidents', count: filteredIncidents.length },
                  { key: 'showPatrols', label: '🚗 Patrol Units', count: patrols.length },
                  { key: 'showHotspots', label: '🔥 Hotspots', count: hotspots.length },
                ].map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => handleFilterChange(layer.key, !filters[layer.key])}
                    className="transition-short"
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-12)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      background: filters[layer.key] ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: filters[layer.key] ? '#2563eb' : 'var(--light-text-secondary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: filters[layer.key] ? '600' : '500',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!filters[layer.key]) {
                        e.target.style.background = 'rgba(148, 163, 184, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters[layer.key]) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{layer.label}</span>
                    <span className="label-sm" style={{ color: 'inherit', margin: 0 }}>({layer.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="glass" style={{ padding: '20px' }}>
              <h3 className="heading-sm" style={{ margin: '0 0 16px 0' }}>
                Filters
              </h3>

              {[
                { label: 'Incident Type', key: 'incidentType', options: [{ value: 'all', label: 'All Types' }, { value: 'theft', label: 'Theft' }, { value: 'assault', label: 'Assault' }, { value: 'robbery', label: 'Robbery' }, { value: 'vandalism', label: 'Vandalism' }] },
                { label: 'Status', key: 'incidentStatus', options: [{ value: 'all', label: 'All Status' }, { value: 'open', label: 'Open' }, { value: 'investigating', label: 'Investigating' }, { value: 'resolved', label: 'Resolved' }] },
                { label: 'Severity', key: 'severityLevel', options: [{ value: 'all', label: 'All Levels' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] },
                { label: 'Date Range', key: 'dateRange', options: [{ value: 'all', label: 'All Time' }, { value: 'today', label: 'Today' }, { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }] },
              ].map((filter) => (
                <div key={filter.key} style={{ marginBottom: '16px' }}>
                  <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px', display: 'block' }}>
                    {filter.label}
                  </div>
                  <select
                    value={filters[filter.key]}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-12)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      background: 'rgba(15, 23, 42, 0.5)',
                      color: 'var(--light-text)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Selected Marker Info */}
            {selectedMarker && (
              <div className="glass" style={{ padding: '20px' }}>
                <h3 className="heading-sm" style={{ margin: '0 0 12px 0' }}>
                  Selected {selectedMarker.type}
                </h3>
                <div className="body-md" style={{ color: 'var(--light-text-secondary)', lineHeight: '1.6' }}>
                  {selectedMarker.type === 'incident' ? (
                    <>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--light-text)', fontWeight: '600' }}>
                        {selectedMarker.data.title}
                      </p>
                      <p style={{ margin: '4px 0' }}>Type: {selectedMarker.data.type}</p>
                      <p style={{ margin: '4px 0' }}>Severity: {selectedMarker.data.severity}</p>
                      <p style={{ margin: '4px 0' }}>Status: {selectedMarker.data.status}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--light-text)', fontWeight: '600' }}>
                        {selectedMarker.data.name}
                      </p>
                      <p style={{ margin: '4px 0' }}>ID: {selectedMarker.data.id}</p>
                      <p style={{ margin: '4px 0' }}>Status: {selectedMarker.data.status}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="glass" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--light-text-secondary)',
                }}>
                  <div className="pulse">Loading map...</div>
                </div>
              ) : (
                <MapComponent
                  incidents={filters.showIncidents ? filteredIncidents : []}
                  patrols={filters.showPatrols ? patrols : []}
                  hotspots={filters.showHotspots ? hotspots : []}
                  showIncidents={filters.showIncidents}
                  showPatrols={filters.showPatrols}
                  showHotspots={filters.showHotspots}
                  onMarkerClick={setSelectedMarker}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
