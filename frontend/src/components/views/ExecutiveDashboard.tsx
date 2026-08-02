import React, { useState, useEffect, useMemo } from 'react';
import {
  GlassCard,
  GlassPanel,
  GlassModal,
  Badge,
  Button,
  Input,
  Select,
} from '../ui';
import { LeafletMap } from '../map/LeafletMap';
import {
  casesApi,
  cctvApi,
  patrolApi,
  withMockFallback,
} from '../../lib/api';
import {
  CaseFIR,
  CCTVCamera,
  PatrolUnit,
  ExecutiveKpiStats,
} from '../../lib/types';
import { mockExecutiveKpiStats } from '../../lib/mockData';
import {
  FileText,
  Activity,
  MapPin,
  Car,
  Camera,
  AlertTriangle,
  PlusCircle,
  Navigation,
  Grid,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Clock,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface ExecutiveDashboardProps {
  /** Callback to navigate between top-level platform views */
  onNavigateView?: (viewId: string, params?: Record<string, any>) => void;

  /** Callback when an officer selects a specific FIR case for detailed investigation modal */
  onSelectCase?: (caseId: string) => void;

  /** Callback when an officer selects a CCTV camera marker on the map or ticker */
  onSelectCamera?: (cameraId: string) => void;

  /** Callback when an officer selects a patrol unit marker for dispatch tracking */
  onSelectPatrol?: (patrolId: string) => void;

  /** Active tab indicator for Leaflet map staggered resize invalidation */
  activeTab?: string | number;

  /** Additional Tailwind CSS class overrides */
  className?: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateView,
  onSelectCase,
  onSelectCamera,
  onSelectPatrol,
  activeTab,
  className = '',
}) => {
  // State Management
  const [kpiStats, setKpiStats] = useState<ExecutiveKpiStats>(mockExecutiveKpiStats);
  const [cases, setCases] = useState<CaseFIR[]>([]);
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [patrols, setPatrols] = useState<PatrolUnit[]>([]);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuickCase, setSelectedQuickCase] = useState<CaseFIR | null>(null);
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);

  // Load Dashboard Data from API with Fallback
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [fetchedCases, fetchedCameras, fetchedPatrols] = await Promise.all([
          casesApi.getCases(),
          cctvApi.getCctvCameras(),
          patrolApi.getPatrolUnits(),
        ]);

        if (isMounted) {
          setCases(fetchedCases);
          setCameras(fetchedCameras);
          setPatrols(fetchedPatrols);

          // Compute KPI stats dynamically if data loaded
          const activeAnomalies = fetchedCameras.filter((c) => !!c.anomaly).length;
          const activePatrols = fetchedPatrols.filter((p) => p.status === 'patrolling' || p.status === 'dispatched').length;
          const pendingCases = fetchedCases.filter((c) => c.status === 'pending' || c.status === 'under_investigation').length;

          setKpiStats((prev) => ({
            ...prev,
            totalFirsToday: fetchedCases.length > 0 ? fetchedCases.length : prev.totalFirsToday,
            activeCctvAnomalies: activeAnomalies || prev.activeCctvAnomalies,
            activePatrolsCount: activePatrols || prev.activePatrolsCount,
            pendingInvestigations: pendingCases || prev.pendingInvestigations,
          }));
        }
      } catch (err) {
        console.warn('[ExecutiveDashboard] API load fallback engaged:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Emergency Broadcast Alerts Data
  const emergencyAlerts = useMemo(() => [
    {
      id: 'ALT-101',
      type: 'critical',
      text: 'CRITICAL: Robbery Attempt at C.G. Road Showroom (Navrangpura). Patrol Unit CHETAK-1 Dispatched.',
      timestamp: '2 mins ago',
      camId: 'CAM-101'
    },
    {
      id: 'ALT-102',
      type: 'warning',
      text: 'AI ANOMALY: Wanted Offender Face Match on CAM-104 (Kalupur Walled City Market Junction).',
      timestamp: '5 mins ago',
      camId: 'CAM-104'
    },
    {
      id: 'ALT-103',
      type: 'info',
      text: 'PATROL UPDATE: RANGER-4 responding to Crowd Surge alert near Paldi BRTS Corridor.',
      timestamp: '12 mins ago',
      camId: 'CAM-108'
    },
    {
      id: 'ALT-104',
      type: 'critical',
      text: 'ANPR ALERT: Stolen Vehicle Plate GJ-01-XX-9412 detected heading towards SG Highway.',
      timestamp: '18 mins ago',
      camId: 'CAM-112'
    }
  ], []);

  // Ticker Auto-Cycle Effect
  useEffect(() => {
    if (isTickerPaused) return;
    const interval = setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % emergencyAlerts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isTickerPaused, emergencyAlerts.length]);

  // Filtered FIR Cases List
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.fir_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.complainant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.crime_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesWard = !selectedWard || c.location.ward.toLowerCase().includes(selectedWard.toLowerCase());

      return matchesSearch && matchesStatus && matchesWard;
    });
  }, [cases, searchQuery, statusFilter, selectedWard]);

  const currentAlert = emergencyAlerts[activeAlertIndex];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Top Emergency Alert Ticker Broadcast Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-red-500 bg-red-500/10 dark:bg-red-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
          {/* Live Beacon Indicator */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>

          <div className="flex items-center gap-1.5 text-xs font-montserrat font-bold text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span className="uppercase tracking-wider">LIVE BROADCAST:</span>
          </div>

          {/* Ticker Content Banner */}
          <div className="overflow-hidden text-xs font-inter font-medium text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 transition-all duration-500">
              <Badge
                variant={currentAlert.type === 'critical' ? 'error' : currentAlert.type === 'warning' ? 'warning' : 'info'}
                size="sm"
                pulseDot
              >
                {currentAlert.type.toUpperCase()}
              </Badge>
              <span className="truncate max-w-xl">{currentAlert.text}</span>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">({currentAlert.timestamp})</span>
            </div>
          </div>
        </div>

        {/* Ticker Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsTickerPaused(!isTickerPaused)}
            className="p-1.5 rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs transition-colors flex items-center gap-1"
            title={isTickerPaused ? 'Resume Broadcast' : 'Pause Broadcast'}
          >
            {isTickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden md:inline text-[11px] font-semibold">{isTickerPaused ? 'Play' : 'Pause'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-1.5 rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs transition-colors flex items-center gap-1"
            title={isAudioMuted ? 'Unmute Audio Alert' : 'Mute Audio Alert'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-red-500 animate-bounce" />}
            <span className="hidden md:inline text-[11px] font-semibold">{isAudioMuted ? 'Muted' : 'Live Audio'}</span>
          </button>
          {currentAlert.camId && (
            <Button
              variant="glass"
              size="sm"
              className="text-[11px] h-7 px-2"
              onClick={() => onSelectCamera?.(currentAlert.camId)}
            >
              Inspect Cam
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top KPI Summary Cards Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total FIRs Today */}
        <GlassCard variant="raised" borderAccent="primary" hoverable className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-montserrat font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total FIRs Today
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-mono font-bold text-[#004B87] dark:text-[#A8CAFF]">
                {kpiStats.totalFirsToday}
              </span>
              <Badge variant="primary" size="sm">Live Sync</Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-inter">
            <span>Clearance Rate</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{kpiStats.clearanceRate}%</span>
          </div>
        </GlassCard>

        {/* Card 2: Active Investigations */}
        <GlassCard variant="raised" borderAccent="warning" hoverable className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-montserrat font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Cases
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">
                {kpiStats.pendingInvestigations}
              </span>
              <Badge variant="warning" size="sm" pulseDot>In Progress</Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-inter">
            <span>Critical Priority</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">12 Cases</span>
          </div>
        </GlassCard>

        {/* Card 3: Hotspot Wards */}
        <GlassCard variant="raised" borderAccent="error" hoverable className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-montserrat font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Hotspot Wards
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
                {kpiStats.highRiskWardsCount}
              </span>
              <Badge variant="error" size="sm" pulseDot>Risk ≥ 70</Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-inter">
            <span>Highest Risk</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Kalupur (88)</span>
          </div>
        </GlassCard>

        {/* Card 4: Patrol Units */}
        <GlassCard variant="raised" borderAccent="success" hoverable className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-montserrat font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patrol Units
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {kpiStats.activePatrolsCount}
              </span>
              <Badge variant="success" size="sm" dot>On Duty</Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-inter">
            <span>Avg Response</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">4.2 mins</span>
          </div>
        </GlassCard>

        {/* Card 5: Active CCTV Alerts */}
        <GlassCard variant="raised" borderAccent="info" hoverable className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-montserrat font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                CCTV Alerts
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-mono font-bold text-sky-600 dark:text-sky-400">
                {kpiStats.activeCctvAnomalies}
              </span>
              <Badge variant="info" size="sm" pulseDot>AI Flagged</Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-inter">
            <span>Face / ANPR</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">3 Face / 2 Plate</span>
          </div>
        </GlassCard>
      </div>

      {/* 3. Quick Action Shortcuts Bar */}
      <GlassPanel className="p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm font-montserrat font-bold text-slate-800 dark:text-slate-100">
          <Shield className="w-5 h-5 text-[#004B87] dark:text-[#A8CAFF]" />
          <span>Quick Tactical Operational Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button
            variant="primary"
            size="sm"
            leftIcon={PlusCircle}
            onClick={() => onNavigateView?.('cases', { action: 'create' })}
          >
            Create FIR
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={Navigation}
            onClick={() => onNavigateView?.('patrol', { action: 'dispatch' })}
          >
            Dispatch Patrol
          </Button>
          <Button
            variant="glass"
            size="sm"
            leftIcon={Grid}
            onClick={() => onNavigateView?.('cctv')}
          >
            View CCTV Grid
          </Button>
          <Button
            variant="glass"
            size="sm"
            leftIcon={Sparkles}
            onClick={() => onNavigateView?.('hotspots')}
          >
            Run AI Forecast
          </Button>
        </div>
      </GlassPanel>

      {/* 4. Embedded Live Command GIS Map & Recent FIRs Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): GIS Command Map */}
        <div className="lg:col-span-7 space-y-3">
          <GlassPanel className="p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 font-montserrat font-bold text-sm text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
              <span>Interactive GIS Command Map (Ahmedabad City)</span>
            </div>
            {selectedWard && (
              <Button
                variant="glass"
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setSelectedWard(null)}
              >
                Clear Ward Filter: <span className="font-semibold ml-1">{selectedWard}</span>
              </Button>
            )}
          </GlassPanel>

          {/* Leaflet Map Frame */}
          <div className="h-[480px] sm:h-[520px] rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-white/10 relative">
            <LeafletMap
              center={[23.0225, 72.5714]}
              zoom={13}
              showWards={true}
              showCctv={true}
              showPatrols={true}
              showRoutes={true}
              showHeatmaps={true}
              selectedWard={selectedWard}
              onWardSelect={(ward) => setSelectedWard(ward)}
              onCctvSelect={(cam) => onSelectCamera?.(cam.id)}
              onPatrolSelect={(patrol) => onSelectPatrol?.(patrol.id)}
              cctvData={cameras}
              patrolData={patrols}
              activeTab={activeTab}
            />
          </div>
        </div>

        {/* Right Column (5 cols): Recent FIRs Feed List */}
        <div className="lg:col-span-5 space-y-4">
          <GlassPanel className="p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
                <span>Recent FIRs Feed</span>
              </h3>
              <Badge variant="glass" size="sm">{filteredCases.length} Records</Badge>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Search FIR, Crime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                leftIcon={Search}
                inputSize="sm"
                variant="field"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                selectSize="sm"
                variant="field"
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'under_investigation', label: 'Under Investigation' },
                  { value: 'chargesheeted', label: 'Chargesheeted' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>

            {/* FIR Feed Scrollable List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 font-inter">Loading recent FIR records...</div>
              ) : filteredCases.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-inter">No FIR records found.</div>
              ) : (
                filteredCases.map((fir) => (
                  <div
                    key={fir.id}
                    className="p-3.5 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#004B87] dark:text-[#A8CAFF] fir-id">
                        {fir.fir_no}
                      </span>
                      <Badge
                        variant={
                          fir.status === 'chargesheeted'
                            ? 'secondary'
                            : fir.status === 'under_investigation'
                            ? 'info'
                            : fir.status === 'pending'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {fir.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{fir.crime_type}</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {fir.location.ward}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-inter line-clamp-2 leading-relaxed">
                      {fir.description}
                    </p>

                    {/* BNS Legal Badges */}
                    <div className="flex flex-wrap gap-1">
                      {fir.bns_sections?.map((bns, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                        >
                          {bns}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 font-inter flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(fir.reported_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button
                        variant="glass"
                        size="sm"
                        leftIcon={Eye}
                        onClick={() => {
                          setSelectedQuickCase(fir);
                          onSelectCase?.(fir.id);
                        }}
                        className="text-[11px] h-7 px-2"
                      >
                        Quick View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* 5. Quick FIR Detail Modal */}
      {selectedQuickCase && (
        <GlassModal
          isOpen={!!selectedQuickCase}
          onClose={() => setSelectedQuickCase(null)}
          title={`FIR Investigation Summary`}
          subtitle={selectedQuickCase.fir_no}
          size="lg"
        >
          <div className="space-y-4 text-xs font-inter">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Crime Category:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedQuickCase.crime_type}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Ward Location:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedQuickCase.location.ward}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Investigating Officer:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedQuickCase.io_name}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Complainant Name:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedQuickCase.complainant_name}</p>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Incident Address:</span>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">{selectedQuickCase.location.address}</p>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Complainant Narrative:</span>
              <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                {selectedQuickCase.description}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">BNS & IPC Legal Sections:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedQuickCase.bns_sections.map((bns, i) => (
                  <Badge key={i} variant="primary">{bns}</Badge>
                ))}
                {selectedQuickCase.ipc_sections.map((ipc, i) => (
                  <Badge key={i} variant="neutral">{ipc}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const caseId = selectedQuickCase.id;
                  setSelectedQuickCase(null);
                  onNavigateView?.('cases', { caseId });
                }}
              >
                Go to Full Case Management View
              </Button>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

export default ExecutiveDashboard;
