import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Layers, Video, Shield, Navigation, Flame, Sun, Moon, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useLeafletResize } from '../../lib/useLeafletResize';
import {
  CCTVCamera,
  PatrolUnit,
  DispatchRoute,
  HeatmapPoint,
  LayerVisibilityState,
} from '../../lib/types';
import {
  ahmedabadWardsGeoJSON,
  mockCctvCameras,
  mockPatrolUnits,
  mockDispatchRoutes,
  mockHeatmapPoints,
} from '../../lib/mockData';
import { Toggle } from '../ui/Toggle';

// Safe default Leaflet icon fix for bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const OSM_LIGHT_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  showWards?: boolean;
  showCctv?: boolean;
  showPatrols?: boolean;
  showRoutes?: boolean;
  showHeatmaps?: boolean;
  selectedWard?: string | null;
  onWardSelect?: (wardName: string) => void;
  onCctvSelect?: (camera: CCTVCamera) => void;
  onPatrolSelect?: (unit: PatrolUnit) => void;
  selectedCctvId?: string | null;
  selectedPatrolId?: string | null;
  cctvData?: CCTVCamera[];
  patrolData?: PatrolUnit[];
  dispatchRoutes?: DispatchRoute[];
  heatmapPoints?: HeatmapPoint[];
  wardGeoJson?: unknown;
  activeTab?: string | number;
  className?: string;
  children?: React.ReactNode;
}

// Generate 256-pixel gradient Lookup Table (LUT) for Canvas heatmap colorization
function createGradientLUT(): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8ClampedArray(1024);

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.0, 'rgba(0, 0, 255, 0)'); // Transparent base
  grad.addColorStop(0.2, 'rgba(2, 136, 209, 0.65)'); // Low Risk Blue (#0288D1)
  grad.addColorStop(0.45, 'rgba(46, 125, 50, 0.85)'); // Medium Emerald Green (#2E7D32)
  grad.addColorStop(0.72, 'rgba(245, 124, 0, 0.92)'); // High Amber Orange (#F57C00)
  grad.addColorStop(1.0, 'rgba(198, 40, 40, 0.98)'); // Critical Red (#C62828)

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [23.0225, 72.5714], // Default Ahmedabad City coordinates
  zoom = 13,
  showWards: propShowWards = true,
  showCctv: propShowCctv = true,
  showPatrols: propShowPatrols = true,
  showRoutes: propShowRoutes = true,
  showHeatmaps: propShowHeatmaps = true,
  selectedWard,
  onWardSelect,
  onCctvSelect,
  onPatrolSelect,
  selectedCctvId,
  selectedPatrolId,
  cctvData = mockCctvCameras,
  patrolData = mockPatrolUnits,
  dispatchRoutes = mockDispatchRoutes,
  heatmapPoints = mockHeatmapPoints,
  wardGeoJson = ahmedabadWardsGeoJSON,
  activeTab,
  className = '',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState<L.Map | null>(null);

  // Layer Visibility State
  const [layers, setLayers] = useState<LayerVisibilityState>({
    wards: propShowWards,
    cctv: propShowCctv,
    patrolUnits: propShowPatrols,
    routes: propShowRoutes,
    heatmaps: propShowHeatmaps,
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(true);

  // Layer Group Refs
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const cctvLayerRef = useRef<L.LayerGroup | null>(null);
  const patrolLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // Canvas Heatmap Refs
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lutRef = useRef<Uint8ClampedArray | null>(null);

  // Sync prop changes into layer visibility state
  useEffect(() => {
    setLayers((prev) => ({
      ...prev,
      wards: propShowWards,
      cctv: propShowCctv,
      patrolUnits: propShowPatrols,
      routes: propShowRoutes,
      heatmaps: propShowHeatmaps,
    }));
  }, [propShowWards, propShowCctv, propShowPatrols, propShowRoutes, propShowHeatmaps]);

  // Hook for multi-frame staggered map.invalidateSize() (0ms, rAF, 100ms, 300ms, 500ms)
  const { triggerResize } = useLeafletResize({
    mapInstance: mapReady,
    containerRef,
    activeTab,
    triggerDeps: [layers],
  });

  // Listen for Dark / Light theme class changes on <html> element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDarkMode(dark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize Map Instance (React 18 Strict Mode double-mount safe)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if ((container as unknown as Record<string, unknown>)._leaflet_id) {
      delete (container as unknown as Record<string, unknown>)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      const isDark = document.documentElement.classList.contains('dark');
      const initialTileUrl = isDark ? CARTO_DARK_URL : OSM_LIGHT_URL;

      const map = L.map(container, {
        center,
        zoom,
        zoomControl: false, // Custom zoom control positioned at bottomright
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tileLayer = L.tileLayer(initialTileUrl, {
        maxZoom: 19,
        subdomains: isDark ? 'abcd' : 'abc',
        attribution: isDark
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Layer groups initialization
      cctvLayerRef.current = L.layerGroup().addTo(map);
      patrolLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      setMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        setMapReady(null);
      }
    };
  }, []); // Run once on mount

  // Seamless Tile Layer Switching (Light vs Dark) without re-instantiating map
  useEffect(() => {
    if (!tileLayerRef.current) return;

    const targetUrl = isDarkMode ? CARTO_DARK_URL : OSM_LIGHT_URL;
    tileLayerRef.current.setUrl(targetUrl);
  }, [isDarkMode]);

  // Ward Boundaries GeoJSON Layer Rendering Effect
  useEffect(() => {
    const map = mapReady;
    if (!map) return;

    if (wardLayerRef.current) {
      map.removeLayer(wardLayerRef.current);
      wardLayerRef.current = null;
    }

    if (!layers.wards || !wardGeoJson) return;

    const geoJsonLayer = L.geoJSON(wardGeoJson as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const props = feature?.properties || {};
        const riskScore = props.riskScore || 0;
        const wardName = props.name || '';
        const isSelected =
          selectedWard && wardName.toLowerCase() === selectedWard.toLowerCase();

        let color = isDarkMode ? '#81C784' : '#2E7D32';
        let fillOpacity = 0.30;
        let weight = 2;
        let dashArray: string | undefined = undefined;

        if (riskScore >= 80) {
          color = isDarkMode ? '#EF5350' : '#C62828';
          fillOpacity = 0.55;
          weight = 3;
          dashArray = '4,4';
        } else if (riskScore >= 60) {
          color = isDarkMode ? '#FFB74D' : '#F57C00';
          fillOpacity = 0.45;
          weight = 2.5;
        } else if (riskScore >= 30) {
          color = isDarkMode ? '#64B5F6' : '#0288D1';
          fillOpacity = 0.38;
          weight = 2;
        }

        if (isSelected) {
          fillOpacity = 0.70;
          stroke: true;
          color = '#FFFFFF';
          weight = 4;
        }

        return {
          fillColor: color,
          fillOpacity,
          color: isSelected ? '#FFFFFF' : color,
          weight,
          dashArray,
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const riskScore = props.riskScore || 0;

        const badgeClass =
          riskScore >= 80
            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
            : riskScore >= 60
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            : riskScore >= 30
            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';

        const tooltipHtml = `
          <div class="p-2 font-sans min-w-[170px]">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="font-montserrat font-bold text-sm text-slate-900 dark:text-slate-100">${props.name || 'Ward'}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">Score: ${riskScore}</span>
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div class="flex justify-between"><span>Active Incidents:</span> <strong class="text-slate-800 dark:text-slate-100 font-mono">${props.activeIncidents ?? 0}</strong></div>
              <div class="flex justify-between"><span>Patrol Units:</span> <strong class="text-slate-800 dark:text-slate-100 font-mono">${props.activePatrols ?? 0}</strong></div>
              <div class="flex justify-between"><span>CCTV Coverage:</span> <strong class="text-slate-800 dark:text-slate-100 font-mono">${props.cctvCount ?? 0} units</strong></div>
            </div>
          </div>
        `;

        layer.bindTooltip(tooltipHtml, {
          sticky: true,
          className: 'leaflet-popup-content-wrapper shadow-xl border border-white/20',
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.72, weight: 4, color: '#FFFFFF' });
            l.bringToFront();
          },
          mouseout: (e) => {
            if (wardLayerRef.current) {
              wardLayerRef.current.resetStyle(e.target);
            }
          },
          click: () => {
            if (onWardSelect && props.name) {
              onWardSelect(props.name);
            }
          },
        });
      },
    }).addTo(map);

    wardLayerRef.current = geoJsonLayer;
  }, [mapReady, layers.wards, wardGeoJson, selectedWard, isDarkMode, onWardSelect]);

  // CCTV Camera Markers Layer Effect
  useEffect(() => {
    const cctvGroup = cctvLayerRef.current;
    if (!cctvGroup) return;

    cctvGroup.clearLayers();
    if (!layers.cctv) return;

    cctvData.forEach((cam) => {
      const hasAnomaly = !!cam.anomaly;
      const isWarning = cam.status === 'warning';
      const isSelected = selectedCctvId === cam.id;

      const ringStyle = hasAnomaly
        ? 'border-red-500 bg-red-500/30 animate-ping'
        : isWarning
        ? 'border-amber-500 bg-amber-500/20 animate-pulse'
        : 'border-emerald-500/50 bg-emerald-500/10';

      const iconStyle = hasAnomaly
        ? 'bg-red-600 text-white border-red-400 ring-2 ring-red-300'
        : isWarning
        ? 'bg-amber-500 text-white border-amber-300'
        : cam.status === 'offline'
        ? 'bg-slate-700 text-slate-400 border-slate-600'
        : 'bg-slate-900/90 text-emerald-400 border-emerald-500/60';

      const divHtml = `
        <div class="relative flex items-center justify-center group ${isSelected ? 'scale-125' : ''}" style="width:36px; height:36px;">
          <span class="absolute inline-flex h-full w-full rounded-full ${ringStyle}"></span>
          <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${iconStyle} border shadow-lg backdrop-blur-md transition-transform group-hover:scale-110">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            ${hasAnomaly ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-bounce"></span>' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: divHtml,
        className: 'cctv-div-icon bg-transparent border-0',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon });

      const anomalyLabel = cam.anomaly
        ? cam.anomaly.replace('_', ' ').toUpperCase()
        : null;

      const popupHtml = `
        <div class="p-3 font-sans min-w-[210px]">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-montserrat font-bold text-sm text-slate-900 dark:text-slate-100">${cam.name}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${cam.id}</span>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Ward: <strong>${cam.ward}</strong></div>
          ${
            hasAnomaly
              ? `<div class="px-2 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 font-bold text-xs mb-2.5 flex items-center gap-1.5 animate-pulse">
                  <span class="w-2 h-2 rounded-full bg-red-500"></span> ALERT: ${anomalyLabel}
                </div>`
              : `<div class="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mb-2.5 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> STATUS: ${cam.status.toUpperCase()}
                </div>`
          }
          <button id="stream-btn-${cam.id}" class="w-full py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            View Live Stream Preview
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'leaflet-popup-content-wrapper' });

      marker.on('click', () => {
        if (onCctvSelect) onCctvSelect(cam);
      });

      cctvGroup.addLayer(marker);
    });
  }, [layers.cctv, cctvData, selectedCctvId, onCctvSelect]);

  // Patrol Unit Markers Layer Effect
  useEffect(() => {
    const patrolGroup = patrolLayerRef.current;
    if (!patrolGroup) return;

    patrolGroup.clearLayers();
    if (!layers.patrolUnits) return;

    patrolData.forEach((unit) => {
      const isDispatched = unit.status === 'dispatched';
      const isSelected = selectedPatrolId === unit.id;

      const badgeStyle = isDispatched
        ? 'bg-red-600 text-white ring-1 ring-red-400'
        : 'bg-slate-900/90 text-emerald-400 border border-emerald-500/40';

      const vehicleSvg =
        unit.vehicle_type === 'bike'
          ? '<path d="M5.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 6h2l1.5 4.5M12 17l-3-7h4l2.5 3.5"/>'
          : unit.vehicle_type === 'van'
          ? '<path d="M19 17h2c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1h-3V7c0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'
          : '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>';

      const divHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer ${isSelected ? 'scale-110' : ''}" style="width:80px; height:44px;">
          <!-- Callsign Pill -->
          <div class="z-10 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-tight whitespace-nowrap shadow-md backdrop-blur-md ${badgeStyle}">
            ${unit.callsign}
          </div>
          <!-- Vehicle Sphere -->
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full shadow-md mt-0.5 bg-slate-900/90 border border-slate-700 text-sky-400">
            ${isDispatched ? '<span class="absolute inline-flex h-full w-full rounded-full bg-amber-400/50 animate-ping"></span>' : ''}
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${vehicleSvg}
            </svg>
          </div>
          <!-- Speed Badge -->
          <div class="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-1 rounded -mt-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            ${unit.speed} km/h
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: divHtml,
        className: 'patrol-div-icon bg-transparent border-0',
        iconSize: [80, 44],
        iconAnchor: [40, 22],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([unit.lat, unit.lng], { icon: customIcon });

      const officersList = unit.officers ? unit.officers.join(', ') : 'Patrol Team';

      const popupHtml = `
        <div class="p-3 font-sans min-w-[210px]">
          <div class="font-montserrat font-bold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>${unit.callsign}</span>
            <span class="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${unit.vehicle_type}</span>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned Ward: <strong>${unit.assigned_ward}</strong></div>
          <div class="text-xs text-slate-600 dark:text-slate-300 mb-2">Officers: <strong class="text-slate-800 dark:text-slate-200">${officersList}</strong></div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
            <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">Speed: ${unit.speed} km/h</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              isDispatched
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }">STATUS: ${unit.status.toUpperCase()}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'leaflet-popup-content-wrapper' });

      marker.on('click', () => {
        if (onPatrolSelect) onPatrolSelect(unit);
      });

      patrolGroup.addLayer(marker);
    });
  }, [layers.patrolUnits, patrolData, selectedPatrolId, onPatrolSelect]);

  // Active OSRM Dispatch Route Polylines Layer Effect
  useEffect(() => {
    const routeGroup = routeLayerRef.current;
    if (!routeGroup) return;

    routeGroup.clearLayers();
    if (!layers.routes) return;

    dispatchRoutes.forEach((route) => {
      if (!route.coordinates || route.coordinates.length < 2) return;

      // Outer Glow Polyline
      const glowPolyline = L.polyline(route.coordinates, {
        color: isDarkMode ? '#FFB74D' : '#F57C00',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Inner Core Animated Polyline
      const corePolyline = L.polyline(route.coordinates, {
        color: '#FFD166',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '8, 12',
        className: 'animated-dispatch-line',
      });

      const tooltipText = `ETA: ${route.etaMinutes} mins (${route.distanceKm} km) | ${route.unitCallsign} -> ${route.incidentTitle}`;
      corePolyline.bindTooltip(tooltipText, {
        sticky: true,
        className: 'leaflet-popup-content-wrapper font-mono text-xs',
      });

      // Pulsing Destination Target Marker
      const destCoords = route.coordinates[route.coordinates.length - 1];
      if (destCoords) {
        const targetHtml = `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex h-full w-full rounded-full bg-red-500/60 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border-2 border-white shadow-md"></span>
          </div>
        `;
        const targetIcon = L.divIcon({
          html: targetHtml,
          className: 'dispatch-target-icon bg-transparent border-0',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const targetMarker = L.marker(destCoords, { icon: targetIcon });
        routeGroup.addLayer(targetMarker);
      }

      routeGroup.addLayer(glowPolyline);
      routeGroup.addLayer(corePolyline);
    });
  }, [layers.routes, dispatchRoutes, isDarkMode]);

  // HTML5 Canvas Crime Hotspot Heatmap Engine Effect
  const renderHeatmapCanvas = useCallback(() => {
    const map = mapReady;
    if (!map || !layers.heatmaps || !heatmapPoints || heatmapPoints.length === 0) {
      if (heatmapCanvasRef.current && heatmapCanvasRef.current.parentNode) {
        heatmapCanvasRef.current.parentNode.removeChild(heatmapCanvasRef.current);
        heatmapCanvasRef.current = null;
      }
      return;
    }

    const overlayPane = map.getPanes().overlayPane;
    let canvas = heatmapCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'leaflet-heatmap-layer pointer-events-none absolute left-0 top-0 z-[200]';
      overlayPane.appendChild(canvas);
      heatmapCanvasRef.current = canvas;
    }

    // Match canvas pixel dimensions to map pane size
    const size = map.getSize();
    const bounds = map.getBounds();
    const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());

    L.DomUtil.setPosition(canvas, topLeft);

    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size.x, size.y);

    // Create offscreen canvas for radial spot accumulation
    const offscreen = document.createElement('canvas');
    offscreen.width = size.x;
    offscreen.height = size.y;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Dynamic spot radius scaled with zoom level
    const currentZoom = map.getZoom();
    const spotRadius = Math.max(15, 24 * Math.pow(1.18, currentZoom - 12));

    // Step 1: Draw radial grayscale intensity spots onto offscreen canvas
    heatmapPoints.forEach((pt) => {
      const latLng = L.latLng(pt.lat, pt.lng);
      const point = map.latLngToLayerPoint(latLng).subtract(topLeft);

      const grad = offCtx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        spotRadius
      );
      const alpha = Math.min(1.0, Math.max(0.1, pt.intensity * 0.75));
      grad.addColorStop(0.0, `rgba(0, 0, 0, ${alpha})`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(point.x, point.y, spotRadius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // Step 2: Colorize offscreen image data via 256-pixel LUT
    if (!lutRef.current) {
      lutRef.current = createGradientLUT();
    }
    const lut = lutRef.current;

    const imgData = offCtx.getImageData(0, 0, size.x, size.y);
    const pixels = imgData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a > 0) {
        const offset = a * 4;
        pixels[i] = lut[offset]; // R
        pixels[i + 1] = lut[offset + 1]; // G
        pixels[i + 2] = lut[offset + 2]; // B
        pixels[i + 3] = Math.min(240, Math.round(lut[offset + 3] * (a / 255))); // Scaled Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [mapReady, layers.heatmaps, heatmapPoints]);

  // Synchronize Heatmap Canvas on Map Move/Zoom/Resize
  useEffect(() => {
    const map = mapReady;
    if (!map) return;

    renderHeatmapCanvas();

    const handleMapEvent = () => {
      renderHeatmapCanvas();
    };

    map.on('move zoomend resize viewreset', handleMapEvent);

    return () => {
      map.off('move zoomend resize viewreset', handleMapEvent);
      if (heatmapCanvasRef.current && heatmapCanvasRef.current.parentNode) {
        heatmapCanvasRef.current.parentNode.removeChild(heatmapCanvasRef.current);
        heatmapCanvasRef.current = null;
      }
    };
  }, [mapReady, renderHeatmapCanvas]);

  // Reset map view center helper
  const handleResetView = () => {
    if (mapReady) {
      mapReady.setView(center, zoom, { animate: true });
    }
  };

  const toggleLayerKey = (key: keyof LayerVisibilityState, val: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      className={`relative w-full h-full min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900 ${className}`}
    >
      {/* Leaflet Map DOM Container */}
      <div ref={containerRef} className="leaflet-container w-full h-full" />

      {/* Floating Samsung OneUI 8.5 Glass Layer Control Widget */}
      <div className="absolute top-3 right-3 z-[999]">
        {isControlPanelOpen ? (
          <div className="glass-card p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/30 dark:border-white/10 w-64 text-slate-800 dark:text-slate-100 transition-all">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-montserrat font-bold tracking-wider uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> GIS Map Layers
              </h3>
              <button
                onClick={() => setIsControlPanelOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                title="Minimize Layer Control"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-inter">
              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Hotspot Heatmap
                </span>
                <Toggle
                  size="sm"
                  checked={layers.heatmaps}
                  onChange={(val) => toggleLayerKey('heatmaps', val)}
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Video className="w-3.5 h-3.5 text-sky-500" /> Smart CCTV Nodes
                </span>
                <Toggle
                  size="sm"
                  checked={layers.cctv}
                  onChange={(val) => toggleLayerKey('cctv', val)}
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> Patrol Units
                </span>
                <Toggle
                  size="sm"
                  checked={layers.patrolUnits}
                  onChange={(val) => toggleLayerKey('patrolUnits', val)}
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-amber-500" /> Dispatch Routes
                </span>
                <Toggle
                  size="sm"
                  checked={layers.routes}
                  onChange={(val) => toggleLayerKey('routes', val)}
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Layers className="w-3.5 h-3.5 text-purple-500" /> Ward Polygons
                </span>
                <Toggle
                  size="sm"
                  checked={layers.wards}
                  onChange={(val) => toggleLayerKey('wards', val)}
                />
              </div>
            </div>

            {/* Quick Action Map Tools */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors p-1"
                title="Reset View to Ahmedabad Center"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Center Map
              </button>

              <span className="text-[10px] font-mono text-slate-400">
                {isDarkMode ? 'CartoDB Dark' : 'OSM Light'}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsControlPanelOpen(true)}
            className="glass-card p-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/30 dark:border-white/10 text-primary hover:scale-105 transition-all"
            title="Open Layer Visibility Controls"
          >
            <Layers className="w-5 h-5" />
          </button>
        )}
      </div>

      {children}
    </div>
  );
};
