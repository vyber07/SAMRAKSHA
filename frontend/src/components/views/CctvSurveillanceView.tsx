import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  ShieldAlert,
  Grid2X2,
  Grid3X3,
  Search,
  Maximize2,
  Camera,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Clock,
  MapPin,
  Sparkles,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  Home,
  Sliders,
  Layers,
  Radio,
  Download,
  Share2,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassPanel } from '../ui/GlassPanel';
import { GlassModal } from '../ui/GlassModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { AlertCard } from '../ui/AlertCard';
import { cctvApi } from '../../lib/api';
import { CCTVCamera, CctvAnomalyType, CameraStatus } from '../../lib/types';


// Simulated Video Feed Canvas Component
export const SimulatedVideoCanvas: React.FC<{
  camera: CCTVCamera;
  isNightVision?: boolean;
  zoomLevel?: number;
  height?: string;
  showOverlayControls?: boolean;
  onSnapshot?: () => void;
}> = ({
  camera,
  isNightVision = false,
  zoomLevel = 1,
  height = 'h-48',
  showOverlayControls = true,
  onSnapshot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanLineY = 0;
    let targetX = 120;
    let targetDirection = 1;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Background Fill (Night vision green vs standard dark blue)
      if (isNightVision) {
        ctx.fillStyle = '#062006';
      } else {
        ctx.fillStyle = '#0a1120';
      }
      ctx.fillRect(0, 0, width, height);

      // 2. Offline Overlay
      if (camera.status === 'offline') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA FEED OFFLINE', width / 2, height / 2 - 10);
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('NO RTSP SIGNAL RECEIVED', width / 2, height / 2 + 10);
        return;
      }

      // 3. Grid Lines
      ctx.strokeStyle = isNightVision ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4. Moving Target Simulation (Simulated vehicle / person object)
      targetX += targetDirection * 0.8 * zoomLevel;
      if (targetX > width - 40 || targetX < 40) {
        targetDirection *= -1;
      }

      // Render Target Object Box
      const boxWidth = 50 * zoomLevel;
      const boxHeight = 35 * zoomLevel;
      const boxY = height / 2 - 15;

      if (camera.anomaly) {
        // Red Bounding Box for AI Anomaly Detection
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(targetX - boxWidth / 2, boxY, boxWidth, boxHeight);

        // Alert Tag Label
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(targetX - boxWidth / 2, boxY - 18, boxWidth + 40, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `[${camera.anomaly.toUpperCase()} 96%]`,
          targetX - boxWidth / 2 + 4,
          boxY - 6
        );
      } else {
        // Normal Tracking Box
        ctx.strokeStyle = isNightVision ? '#22c55e' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(targetX - boxWidth / 2, boxY, boxWidth, boxHeight);
      }

      // 5. Radar / Laser Scan Sweep Line
      scanLineY = (scanLineY + 1.5) % height;
      ctx.strokeStyle = isNightVision ? 'rgba(34, 197, 94, 0.5)' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(width, scanLineY);
      ctx.stroke();

      // 6. Live Timestamp Ticker (YYYY-MM-DD HH:mm:ss.SSS)
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').replace('Z', '');
      ctx.fillStyle = isNightVision ? '#4ade80' : '#f8fafc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, width - 10, 18);

      // 7. Camera Name & Resolution Overlay
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Montserrat, sans-serif';
      ctx.fillText(camera.name, 10, 18);

      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = isNightVision ? '#86efac' : '#94a3b8';
      ctx.fillText(`${camera.resolution || '4K UHD'} • 60 FPS • ${camera.ward}`, 10, 32);

      // 8. REC Red Dot Pulse
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width - 15, 30, 4, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, isNightVision, zoomLevel]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-950 ${height}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={240}
        className="w-full h-full object-cover"
      />
      {showOverlayControls && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {onSnapshot && (
            <button
              type="button"
              onClick={onSnapshot}
              className="p-1 rounded bg-black/60 hover:bg-black/80 text-white text-[10px] backdrop-blur transition-all"
              title="Capture Snapshot"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// AI Anomaly Alert Item Model
export interface AnomalyAlertItem {
  id: string;
  cameraId: string;
  cameraName: string;
  ward: string;
  anomalyType: CctvAnomalyType;
  timestamp: string;
  confidence: number;
  details: string;
}

const mockAnomalyAlertsList: AnomalyAlertItem[] = [
  {
    id: 'ALT-CCTV-01',
    cameraId: 'CAM-101',
    cameraName: 'C.G. Road Cross Roads',
    ward: 'Navrangpura',
    anomalyType: 'weapon_detected',
    timestamp: '1 min ago',
    confidence: 0.96,
    details: 'Object match: Firearm detected in public space.',
  },
  {
    id: 'ALT-CCTV-02',
    cameraId: 'CAM-104',
    cameraName: 'Walled City Gate #3',
    ward: 'Kalupur (Walled City)',
    anomalyType: 'face_match',
    timestamp: '4 mins ago',
    confidence: 0.94,
    details: 'Match profile: Wanted Suspect #HO-441 (Ramesh Varma).',
  },
  {
    id: 'ALT-CCTV-03',
    cameraId: 'CAM-108',
    cameraName: 'Paldi BRTS Station',
    ward: 'Paldi',
    anomalyType: 'crowd_surge',
    timestamp: '8 mins ago',
    confidence: 0.88,
    details: 'Density threshold breach: >45 persons/100m².',
  },
  {
    id: 'ALT-CCTV-04',
    cameraId: 'CAM-112',
    cameraName: 'SG Highway Flyover',
    ward: 'Satellite',
    anomalyType: 'plate_recognised',
    timestamp: '14 mins ago',
    confidence: 0.98,
    details: 'ANPR match: Stolen Vehicle Plate GJ-01-XX-9412.',
  },
];

export interface CctvSurveillanceViewProps {
  onSelectCamera?: (cameraId: string) => void;
  className?: string;
}

export const CctvSurveillanceView: React.FC<CctvSurveillanceViewProps> = ({
  onSelectCamera,
  className = '',
}) => {
  // State Management
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [gridFormat, setGridFormat] = useState<'2x2' | '3x3'>('2x2');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');
  const [anomalyStatusFilter, setAnomalyStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalCamera, setActiveModalCamera] = useState<CCTVCamera | null>(null);
  const [snapshotCamera, setSnapshotCamera] = useState<CCTVCamera | null>(null);

  // PTZ Control States inside Modal
  const [ptzZoomLevel, setPtzZoomLevel] = useState<number>(1);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [ptzMessage, setPtzMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load CCTV Cameras Data
  useEffect(() => {
    async function loadCameras() {
      try {
        setLoading(true);
        const data = await cctvApi.getCctvCameras();
        if (data) {
          setCameras(data);
        }
      } catch (err) {
        console.warn('[CctvSurveillanceView] Failed to load cameras from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCameras();
  }, []);

  // Filtered Cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const matchesSearch =
        searchQuery === '' ||
        cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.ward.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWard =
        selectedWardFilter === 'ALL' || cam.ward.toLowerCase().includes(selectedWardFilter.toLowerCase());

      let matchesAnomaly = true;
      if (anomalyStatusFilter === 'ANOMALY_ONLY') {
        matchesAnomaly = !!cam.anomaly;
      } else if (anomalyStatusFilter === 'ONLINE_ONLY') {
        matchesAnomaly = cam.status === 'online';
      } else if (anomalyStatusFilter === 'OFFLINE_ONLY') {
        matchesAnomaly = cam.status === 'offline';
      }

      return matchesSearch && matchesWard && matchesAnomaly;
    });
  }, [cameras, searchQuery, selectedWardFilter, anomalyStatusFilter]);

  // Display Limit based on Grid Format
  const displayedCameras = useMemo(() => {
    const limit = gridFormat === '2x2' ? 4 : 9;
    return filteredCameras.slice(0, limit);
  }, [filteredCameras, gridFormat]);

  // Anomaly Counts Summary
  const anomalyStats = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter((c) => c.status === 'online').length;
    const offline = cameras.filter((c) => c.status === 'offline').length;
    const anomalies = cameras.filter((c) => !!c.anomaly).length;
    return { total, online, offline, anomalies };
  }, [cameras]);

  // Helper for Status Badge Variant
  const getCameraStatusBadge = (status: CameraStatus) => {
    switch (status) {
      case 'online':
        return <Badge variant="success" size="sm" pulseDot>ONLINE</Badge>;
      case 'warning':
        return <Badge variant="warning" size="sm" dot>WARNING</Badge>;
      case 'offline':
        return <Badge variant="error" size="sm">OFFLINE</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  // PTZ Action Simulation
  const handlePtzAction = (action: string) => {
    setPtzMessage(`PTZ Action Executed: ${action}`);
    setTimeout(() => setPtzMessage(null), 3000);
  };

  return (
    <div className={`space-y-6 pb-12 ${className}`}>
      {/* 1. Header Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              Smart CCTV & AI Surveillance Command
            </h1>
            <Badge variant="error" size="md" pulseDot icon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Live Stream Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-inter mt-1">
            Real-time IP camera grid simulation, automated computer-vision anomaly detection alerts, and PTZ control
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Grid Format Switcher (2x2 vs 3x3) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setGridFormat('2x2')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                gridFormat === '2x2'
                  ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="2x2 Grid Layout"
            >
              <Grid2X2 className="w-4 h-4" />
              <span className="hidden sm:inline">2x2 Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setGridFormat('3x3')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                gridFormat === '3x3'
                  ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="3x3 Grid Layout"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">3x3 Grid</span>
            </button>
          </div>

          {/* Ward Filter */}
          <Select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            selectSize="sm"
            variant="field"
            options={[
              { value: 'ALL', label: 'All Municipal Wards' },
              { value: 'Navrangpura', label: 'Navrangpura' },
              { value: 'Kalupur', label: 'Kalupur (Walled City)' },
              { value: 'Ellisbridge', label: 'Ellisbridge' },
              { value: 'Paldi', label: 'Paldi' },
              { value: 'Satellite', label: 'Satellite' },
              { value: 'Bodakdev', label: 'Bodakdev' },
              { value: 'Maninagar', label: 'Maninagar' },
            ]}
            className="w-44"
          />

          {/* Anomaly Status Filter */}
          <Select
            value={anomalyStatusFilter}
            onChange={(e) => setAnomalyStatusFilter(e.target.value)}
            selectSize="sm"
            variant="field"
            options={[
              { value: 'ALL', label: 'All Camera Statuses' },
              { value: 'ANOMALY_ONLY', label: 'AI Anomalies Only' },
              { value: 'ONLINE_ONLY', label: 'Online Only' },
              { value: 'OFFLINE_ONLY', label: 'Offline Only' },
            ]}
            className="w-44"
          />

          {/* Search Bar */}
          <Input
            placeholder="Search Camera ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            leftIcon={Search}
            inputSize="sm"
            variant="field"
            className="w-40"
          />
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#004B87] dark:border-l-[#A8CAFF]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Total Cameras</div>
          <div className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white mt-1">{anomalyStats.total}</div>
        </GlassCard>
        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-emerald-500">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Online Feeds</div>
          <div className="text-2xl font-montserrat font-bold text-emerald-600 dark:text-emerald-400 mt-1">{anomalyStats.online}</div>
        </GlassCard>
        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-red-500">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">AI Anomalies</div>
          <div className="text-2xl font-montserrat font-bold text-red-600 dark:text-red-400 mt-1">{anomalyStats.anomalies}</div>
        </GlassCard>
        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-slate-400">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Offline Nodes</div>
          <div className="text-2xl font-montserrat font-bold text-slate-500 dark:text-slate-400 mt-1">{anomalyStats.offline}</div>
        </GlassCard>
      </div>

      {/* 2. Main Content Grid & AI Anomaly Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Responsive Multi-Camera Video Grid */}
        <div className="lg:col-span-8 space-y-4">
          <GlassPanel className="p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 font-montserrat font-bold text-sm text-slate-900 dark:text-white">
              <Video className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
              <span>Multi-Camera Video Surveillance Matrix ({gridFormat} Grid)</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Showing {displayedCameras.length} of {filteredCameras.length} Feeds
            </span>
          </GlassPanel>

          {/* Camera Grid Layout */}
          <div
            className={`grid gap-4 ${
              gridFormat === '2x2'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayedCameras.map((cam) => (
              <GlassCard
                key={cam.id}
                variant="raised"
                className={`p-3.5 space-y-2.5 transition-all ${
                  cam.anomaly
                    ? 'border-2 border-red-500/80 shadow-lg shadow-red-500/20 bg-red-500/5'
                    : 'border border-slate-200/60 dark:border-white/10'
                }`}
              >
                {/* Feed Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#004B87] dark:text-[#A8CAFF]">
                      {cam.id}
                    </span>
                    <h4 className="font-montserrat font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                      {cam.name}
                    </h4>
                  </div>
                  {getCameraStatusBadge(cam.status)}
                </div>

                {/* Simulated Canvas Stream */}
                <SimulatedVideoCanvas
                  camera={cam}
                  height={gridFormat === '2x2' ? 'h-52' : 'h-40'}
                  onSnapshot={() => setSnapshotCamera(cam)}
                />

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-1 font-inter">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {cam.ward}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="glass"
                      size="sm"
                      leftIcon={Camera}
                      onClick={() => setSnapshotCamera(cam)}
                      className="text-[10px] h-6 px-2"
                    >
                      Snapshot
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Maximize2}
                      onClick={() => {
                        setActiveModalCamera(cam);
                        onSelectCamera?.(cam.id);
                      }}
                      className="text-[10px] h-6 px-2"
                    >
                      PTZ Controls
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right Column (4 cols): Real-Time AI Anomaly Detection Alert Panel */}
        <div className="lg:col-span-4 space-y-4">
          <GlassPanel className="p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                <span>AI Anomaly Alerts Stream</span>
              </h3>
              <Badge variant="error" size="sm" pulseDot>LIVE AI</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-inter">
              Automated computer-vision detections (Face Match, ANPR, Crowd Surge, Weapon):
            </p>

            {/* Scrollable Anomaly Alert Feed */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 font-inter text-xs">
              {mockAnomalyAlertsList.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 dark:bg-red-500/15 space-y-2 relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        alert.anomalyType === 'weapon_detected'
                          ? 'error'
                          : alert.anomalyType === 'face_match'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                      pulseDot
                    >
                      {alert.anomalyType?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                  </div>

                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{alert.cameraName} ({alert.cameraId})</span>
                    <span className="text-red-600 dark:text-red-400 font-mono font-bold text-[11px]">
                      {(alert.confidence * 100).toFixed(0)}% Match
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {alert.details}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-red-500/20">
                    <span className="text-[10px] text-slate-500">{alert.ward}</span>
                    <Button
                      variant="glass"
                      size="sm"
                      leftIcon={Eye}
                      onClick={() => {
                        const targetCam = cameras.find((c) => c.id === alert.cameraId) || cameras[0];
                        setSnapshotCamera(targetCam);
                      }}
                      className="text-[10px] h-6 px-2 text-red-600 dark:text-red-400"
                    >
                      View Frame
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* 3. MODAL 1: CAMERA DETAIL & PTZ CONTROL DIALOG */}
      {activeModalCamera && (
        <GlassModal
          isOpen={!!activeModalCamera}
          onClose={() => setActiveModalCamera(null)}
          title={
            <div className="flex items-center gap-3">
              <span>{activeModalCamera.name} ({activeModalCamera.id})</span>
              {getCameraStatusBadge(activeModalCamera.status)}
            </div>
          }
          subtitle={`RTSP Stream Engine • ${activeModalCamera.ward} Ward`}
          size="xl"
        >
          <div className="space-y-6 font-inter">
            {ptzMessage && (
              <AlertCard variant="info" title="PTZ Command Sent" onClose={() => setPtzMessage(null)}>
                {ptzMessage}
              </AlertCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left HD Video Canvas (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <SimulatedVideoCanvas
                  camera={activeModalCamera}
                  isNightVision={isNightVision}
                  zoomLevel={ptzZoomLevel}
                  height="h-72"
                  showOverlayControls={false}
                />

                {/* Canvas Toolbar Controls */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNightVision(!isNightVision)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isNightVision
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isNightVision ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      {isNightVision ? 'Night IR ON' : 'IR Mode'}
                    </button>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">Zoom:</span>
                      <span className="font-bold font-mono text-primary">{ptzZoomLevel}x</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setPtzZoomLevel((z) => Math.max(1, z - 1))}
                      disabled={ptzZoomLevel <= 1}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setPtzZoomLevel((z) => Math.min(8, z + 1))}
                      disabled={ptzZoomLevel >= 8}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right PTZ Control Pad & Stream Diagnostics (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* 3x3 PTZ Keypad Container */}
                <GlassPanel variant="subtle" padding="md" className="space-y-3">
                  <h4 className="font-montserrat font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-primary" />
                    PTZ Directional Servo Controls
                  </h4>

                  <div className="grid grid-cols-3 gap-2 w-48 mx-auto py-2">
                    <div></div>
                    <button
                      type="button"
                      onClick={() => handlePtzAction('PAN UP (+15°)')}
                      className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Tilt Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <div></div>

                    <button
                      type="button"
                      onClick={() => handlePtzAction('PAN LEFT (-30°)')}
                      className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Pan Left"
                    >
                      <MoveLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePtzAction('HOME RESET')}
                      className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/80 transition-all flex items-center justify-center"
                      title="Reset Home Position"
                    >
                      <Home className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePtzAction('PAN RIGHT (+30°)')}
                      className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Pan Right"
                    >
                      <MoveRight className="w-4 h-4" />
                    </button>

                    <div></div>
                    <button
                      type="button"
                      onClick={() => handlePtzAction('PAN DOWN (-15°)')}
                      className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Tilt Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <div></div>
                  </div>
                </GlassPanel>

                {/* Preset Shortcuts */}
                <div className="space-y-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Preset Positions:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button variant="glass" size="sm" className="text-[10px]" onClick={() => handlePtzAction('PRESET 1: Traffic Junction')}>
                      Junction
                    </Button>
                    <Button variant="glass" size="sm" className="text-[10px]" onClick={() => handlePtzAction('PRESET 2: Pedestrian Walkway')}>
                      Walkway
                    </Button>
                    <Button variant="glass" size="sm" className="text-[10px]" onClick={() => handlePtzAction('PRESET 3: Exit Gate')}>
                      Exit Gate
                    </Button>
                  </div>
                </div>

                {/* Diagnostics */}
                <GlassPanel variant="subtle" padding="sm" className="text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Protocol:</span> <span className="font-mono">RTSP / WebRTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bitrate:</span> <span className="font-mono">8.4 Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span> <span className="font-mono text-emerald-600 dark:text-emerald-400">42 ms</span>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        </GlassModal>
      )}

      {/* 4. MODAL 2: CAMERA SNAPSHOT MODAL */}
      {snapshotCamera && (
        <GlassModal
          isOpen={!!snapshotCamera}
          onClose={() => setSnapshotCamera(null)}
          title={`Snapshot Frame - ${snapshotCamera.name}`}
          subtitle={`Captured on ${new Date().toLocaleString()}`}
          size="lg"
        >
          <div className="space-y-4 font-inter text-xs">
            <SimulatedVideoCanvas
              camera={snapshotCamera}
              height="h-64"
              showOverlayControls={false}
            />

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{snapshotCamera.id}</span>
                <p className="text-slate-500">{snapshotCamera.ward} Ward Location</p>
              </div>
              <Badge variant="primary">High Res PNG</Badge>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="glass" size="sm" onClick={() => setSnapshotCamera(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Download}
                onClick={() => {
                  alert(`Snapshot downloaded for camera ${snapshotCamera.id}`);
                  setSnapshotCamera(null);
                }}
              >
                Download Evidence Frame
              </Button>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

export default CctvSurveillanceView;
