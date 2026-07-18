import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({
  incidents = [],
  patrols = [],
  hotspots = [],
  showIncidents = true,
  showPatrols = true,
  showHotspots = true,
  onMarkerClick = null,
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const layerGroupsRef = useRef({});
  const heatmapLayerRef = useRef(null);

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f97316',
    low: '#16a34a',
  };

  const getSeverityColor = (severity) => {
    return severityColors[severity?.toLowerCase()] || '#6b7280';
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map centered on India (default)
    mapInstance.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Create layer groups
    layerGroupsRef.current.incidents = L.layerGroup().addTo(mapInstance.current);
    layerGroupsRef.current.patrols = L.layerGroup().addTo(mapInstance.current);
    layerGroupsRef.current.hotspots = L.layerGroup().addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update incident markers
  useEffect(() => {
    if (!mapInstance.current || !layerGroupsRef.current.incidents) return;

    layerGroupsRef.current.incidents.clearLayers();

    if (showIncidents && incidents.length > 0) {
      incidents.forEach((incident) => {
        if (!incident.latitude || !incident.longitude) return;

        const icon = L.divIcon({
          className: 'incident-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: ${getSeverityColor(incident.severity)};
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 8px ${getSeverityColor(incident.severity)}80;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">
              <span style="font-size: 16px; color: white;">⚠️</span>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15],
        });

        const marker = L.marker([incident.latitude, incident.longitude], { icon })
          .bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #2563eb;">${incident.title || 'Incident'}</h4>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Type:</strong> ${incident.type || 'Unknown'}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Severity:</strong>
                <span style="
                  padding: 2px 8px;
                  border-radius: 4px;
                  background: ${getSeverityColor(incident.severity)}20;
                  color: ${getSeverityColor(incident.severity)};
                  font-weight: 600;
                ">
                  ${incident.severity || 'N/A'}
                </span>
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Status:</strong> ${incident.status || 'Open'}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Time:</strong> ${incident.timestamp ? new Date(incident.timestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          `)
          .addTo(layerGroupsRef.current.incidents);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick({ type: 'incident', data: incident });
        });
      });
    }
  }, [incidents, showIncidents, onMarkerClick]);

  // Update patrol markers
  useEffect(() => {
    if (!mapInstance.current || !layerGroupsRef.current.patrols) return;

    layerGroupsRef.current.patrols.clearLayers();

    if (showPatrols && patrols.length > 0) {
      patrols.forEach((patrol) => {
        if (!patrol.latitude || !patrol.longitude) return;

        const icon = L.divIcon({
          className: 'patrol-marker',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              background: #2563eb;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 6px #2563eb80;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="font-size: 14px; color: white;">🚗</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([patrol.latitude, patrol.longitude], { icon })
          .bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: #2563eb;">${patrol.name || 'Patrol Unit'}</h4>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>ID:</strong> ${patrol.id || 'N/A'}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Status:</strong>
                <span style="
                  padding: 2px 8px;
                  border-radius: 4px;
                  background: ${patrol.status === 'active' ? '#16a34a80' : '#dc262680'};
                  color: ${patrol.status === 'active' ? '#16a34a' : '#dc2626'};
                  font-weight: 600;
                ">
                  ${patrol.status || 'Idle'}
                </span>
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Last Update:</strong> ${patrol.lastUpdate ? new Date(patrol.lastUpdate).toLocaleString() : 'N/A'}
              </p>
            </div>
          `)
          .addTo(layerGroupsRef.current.patrols);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick({ type: 'patrol', data: patrol });
        });
      });
    }
  }, [patrols, showPatrols, onMarkerClick]);

  // Update hotspot heatmap
  useEffect(() => {
    if (!mapInstance.current || !layerGroupsRef.current.hotspots) return;

    if (heatmapLayerRef.current) {
      mapInstance.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (showHotspots && hotspots.length > 0) {
      const heatmapData = hotspots
        .filter(spot => spot.latitude && spot.longitude)
        .map(spot => ({
          lat: spot.latitude,
          lng: spot.longitude,
          value: spot.incidents || spot.density || 1,
        }));

      if (heatmapData.length > 0) {
        heatmapLayerRef.current = L.heatLayer(
          heatmapData.map(d => [d.lat, d.lng, d.value / 100]),
          {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            minOpacity: 0.3,
            gradient: {
              0.0: '#16a34a',
              0.25: '#f97316',
              0.5: '#ea580c',
              1.0: '#dc2626',
            },
          }
        ).addTo(mapInstance.current);
      }

      // Add hotspot markers
      hotspots.forEach((spot) => {
        if (!spot.latitude || !spot.longitude) return;

        const icon = L.divIcon({
          className: 'hotspot-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: rgba(220, 38, 38, 0.2);
              border: 2px solid #dc2626;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: #dc2626;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        L.marker([spot.latitude, spot.longitude], { icon })
          .bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 160px;">
              <h4 style="margin: 0 0 8px 0; color: #f97316;">${spot.area || 'Hotspot'}</h4>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Incidents:</strong> ${spot.incidents || 0}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Risk Level:</strong> ${spot.risk_level || 'Medium'}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Density:</strong> ${spot.density || 'N/A'}
              </p>
            </div>
          `)
          .addTo(layerGroupsRef.current.hotspots);
      });
    }
  }, [hotspots, showHotspots]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        .leaflet-container {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }

        .incident-marker, .patrol-marker, .hotspot-marker {
          cursor: pointer;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 8px currentColor;
            opacity: 1;
          }
          50% {
            box-shadow: 0 0 16px currentColor;
            opacity: 0.7;
          }
        }

        .leaflet-control-layers-toggle {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          backdrop-filter: blur(10px);
          border-radius: 8px !important;
        }

        .leaflet-control-zoom {
          background-color: transparent !important;
          border: none !important;
        }

        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          backdrop-filter: blur(10px);
          border-radius: 8px !important;
          color: #f1f5f9 !important;
          margin-bottom: 8px;
        }

        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
