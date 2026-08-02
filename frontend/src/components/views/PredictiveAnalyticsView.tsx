import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  ShieldAlert,
  MapPin,
  Filter,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Download,
  RefreshCw,
  Clock,
  Activity,
  Compass,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Area,
} from 'recharts';
import { LeafletMap } from '../map/LeafletMap';
import { GlassCard } from '../ui/GlassCard';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { AlertCard } from '../ui/AlertCard';
import { gisApi } from '../../lib/api';
import { WardRiskSummary, HeatmapPoint } from '../../lib/types';
import { mockHeatmapPoints, mockWardRiskSummaries } from '../../lib/mockData';

// Extended Ward Risk Assessment Scorecard Interface
export interface ExtendedWardRisk extends WardRiskSummary {
  crimeDensity: number; // incidents per sq km
  riskLevel: 'HIGH' | 'MED' | 'LOW';
  peakRiskWindow: string; // e.g. "22:00 - 03:00"
  primaryIncidentType: string; // e.g. "Commercial Burglary"
  predictedIncidentDelta: number; // percentage change e.g. +14.5%
  recommendedPatrols: number;
}

// Mock Extended Scorecard Data for 12 Ahmedabad Wards
const initialExtendedWardRisks: ExtendedWardRisk[] = [
  {
    wardId: 'W01',
    wardName: 'Kalupur (Walled City)',
    riskScore: 88,
    activeIncidents: 9,
    activePatrols: 5,
    cctvCount: 24,
    crimeDensity: 28.4,
    riskLevel: 'HIGH',
    peakRiskWindow: '22:00 - 03:00',
    primaryIncidentType: 'Commercial Burglary',
    predictedIncidentDelta: 18.4,
    recommendedPatrols: 8,
  },
  {
    wardId: 'W02',
    wardName: 'Navrangpura',
    riskScore: 78,
    activeIncidents: 6,
    activePatrols: 4,
    cctvCount: 18,
    crimeDensity: 21.2,
    riskLevel: 'HIGH',
    peakRiskWindow: '20:00 - 01:00',
    primaryIncidentType: 'Robbery Attempt',
    predictedIncidentDelta: 12.1,
    recommendedPatrols: 6,
  },
  {
    wardId: 'W03',
    wardName: 'Ellisbridge',
    riskScore: 82,
    activeIncidents: 7,
    activePatrols: 4,
    cctvCount: 20,
    crimeDensity: 24.1,
    riskLevel: 'HIGH',
    peakRiskWindow: '21:00 - 02:00',
    primaryIncidentType: 'Chain Snatching',
    predictedIncidentDelta: 15.6,
    recommendedPatrols: 7,
  },
  {
    wardId: 'W04',
    wardName: 'Jamalpur',
    riskScore: 74,
    activeIncidents: 5,
    activePatrols: 3,
    cctvCount: 16,
    crimeDensity: 19.8,
    riskLevel: 'HIGH',
    peakRiskWindow: '23:00 - 04:00',
    primaryIncidentType: 'Physical Assault',
    predictedIncidentDelta: 8.5,
    recommendedPatrols: 5,
  },
  {
    wardId: 'W05',
    wardName: 'Paldi',
    riskScore: 58,
    activeIncidents: 4,
    activePatrols: 3,
    cctvCount: 14,
    crimeDensity: 14.5,
    riskLevel: 'MED',
    peakRiskWindow: '18:00 - 23:00',
    primaryIncidentType: 'Vehicle Theft',
    predictedIncidentDelta: -3.2,
    recommendedPatrols: 4,
  },
  {
    wardId: 'W06',
    wardName: 'Satellite',
    riskScore: 48,
    activeIncidents: 3,
    activePatrols: 3,
    cctvCount: 15,
    crimeDensity: 11.8,
    riskLevel: 'MED',
    peakRiskWindow: '19:00 - 00:00',
    primaryIncidentType: 'Cyber Fraud',
    predictedIncidentDelta: 4.2,
    recommendedPatrols: 3,
  },
  {
    wardId: 'W07',
    wardName: 'Maninagar',
    riskScore: 52,
    activeIncidents: 3,
    activePatrols: 2,
    cctvCount: 12,
    crimeDensity: 13.1,
    riskLevel: 'MED',
    peakRiskWindow: '21:00 - 02:00',
    primaryIncidentType: 'Vehicle Theft',
    predictedIncidentDelta: -1.5,
    recommendedPatrols: 3,
  },
  {
    wardId: 'W08',
    wardName: 'Nikol',
    riskScore: 62,
    activeIncidents: 4,
    activePatrols: 3,
    cctvCount: 10,
    crimeDensity: 16.0,
    riskLevel: 'MED',
    peakRiskWindow: '22:00 - 03:00',
    primaryIncidentType: 'Physical Assault',
    predictedIncidentDelta: 6.8,
    recommendedPatrols: 4,
  },
  {
    wardId: 'W09',
    wardName: 'Shahibaug',
    riskScore: 44,
    activeIncidents: 2,
    activePatrols: 2,
    cctvCount: 14,
    crimeDensity: 9.6,
    riskLevel: 'MED',
    peakRiskWindow: '20:00 - 01:00',
    primaryIncidentType: 'Extortion Demand',
    predictedIncidentDelta: -5.1,
    recommendedPatrols: 2,
  },
  {
    wardId: 'W10',
    wardName: 'Bodakdev',
    riskScore: 28,
    activeIncidents: 1,
    activePatrols: 2,
    cctvCount: 12,
    crimeDensity: 6.4,
    riskLevel: 'LOW',
    peakRiskWindow: '14:00 - 18:00',
    primaryIncidentType: 'Cyber Fraud',
    predictedIncidentDelta: -8.4,
    recommendedPatrols: 2,
  },
  {
    wardId: 'W11',
    wardName: 'Vastrapur',
    riskScore: 32,
    activeIncidents: 1,
    activePatrols: 2,
    cctvCount: 11,
    crimeDensity: 7.2,
    riskLevel: 'LOW',
    peakRiskWindow: '16:00 - 20:00',
    primaryIncidentType: 'Vehicle Theft',
    predictedIncidentDelta: -4.0,
    recommendedPatrols: 2,
  },
  {
    wardId: 'W12',
    wardName: 'Thaltej',
    riskScore: 22,
    activeIncidents: 1,
    activePatrols: 2,
    cctvCount: 10,
    crimeDensity: 5.1,
    riskLevel: 'LOW',
    peakRiskWindow: '12:00 - 16:00',
    primaryIncidentType: 'General Offence',
    predictedIncidentDelta: -11.2,
    recommendedPatrols: 1,
  },
];

// 24-Hour Incident Risk Curve Mock Data
const mock24hForecastData = [
  { hour: '00:00', historical: 4, predicted: 6, riskScore: 72 },
  { hour: '02:00', historical: 7, predicted: 9, riskScore: 88 },
  { hour: '04:00', historical: 5, predicted: 4, riskScore: 45 },
  { hour: '06:00', historical: 2, predicted: 2, riskScore: 20 },
  { hour: '08:00', historical: 3, predicted: 4, riskScore: 35 },
  { hour: '10:00', historical: 6, predicted: 5, riskScore: 50 },
  { hour: '12:00', historical: 5, predicted: 6, riskScore: 58 },
  { hour: '14:00', historical: 4, predicted: 5, riskScore: 48 },
  { hour: '16:00', historical: 6, predicted: 7, riskScore: 65 },
  { hour: '18:00', historical: 8, predicted: 11, riskScore: 82 },
  { hour: '20:00', historical: 10, predicted: 13, riskScore: 91 },
  { hour: '22:00', historical: 9, predicted: 12, riskScore: 89 },
];

// 7-Day Category Prediction Breakdown Mock Data
const mock7dPredictionData = [
  { day: 'Mon', Burglary: 4, Robbery: 2, Snatching: 6, CyberFraud: 8 },
  { day: 'Tue', Burglary: 3, Robbery: 1, Snatching: 5, CyberFraud: 9 },
  { day: 'Wed', Burglary: 5, Robbery: 3, Snatching: 7, CyberFraud: 6 },
  { day: 'Thu', Burglary: 6, Robbery: 2, Snatching: 8, CyberFraud: 10 },
  { day: 'Fri', Burglary: 8, Robbery: 4, Snatching: 11, CyberFraud: 7 },
  { day: 'Sat', Burglary: 11, Robbery: 6, Snatching: 14, CyberFraud: 5 },
  { day: 'Sun', Burglary: 9, Robbery: 5, Snatching: 12, CyberFraud: 4 },
];

// AI Resource Reallocation Recommendations Structure
export interface ResourceRecommendation {
  id: string;
  sourceWard: string;
  targetWard: string;
  unitsToMove: number;
  vehicleType: 'car' | 'bike';
  reason: string;
  expectedRiskReduction: string;
  urgency: 'HIGH' | 'MEDIUM';
}

const initialRecommendations: ResourceRecommendation[] = [
  {
    id: 'REC-1',
    sourceWard: 'Thaltej (Low Risk)',
    targetWard: 'Kalupur (Critical Risk)',
    unitsToMove: 2,
    vehicleType: 'car',
    reason: 'Predicted 35% surge in commercial burglary between 01:00 - 04:00.',
    expectedRiskReduction: '-22% Risk Score',
    urgency: 'HIGH',
  },
  {
    id: 'REC-2',
    sourceWard: 'Bodakdev (Low Risk)',
    targetWard: 'Navrangpura (High Risk)',
    unitsToMove: 1,
    vehicleType: 'bike',
    reason: 'High density robbery prediction near C.G. Road commercial corridor.',
    expectedRiskReduction: '-15% Risk Score',
    urgency: 'HIGH',
  },
  {
    id: 'REC-3',
    sourceWard: 'Vastrapur (Low Risk)',
    targetWard: 'Ellisbridge (High Risk)',
    unitsToMove: 2,
    vehicleType: 'car',
    reason: 'Spike in chain snatching incidents forecasted during evening rush hour.',
    expectedRiskReduction: '-18% Risk Score',
    urgency: 'MEDIUM',
  },
];

export interface PredictiveAnalyticsViewProps {
  className?: string;
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({
  className = '',
}) => {
  // State Variables
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [selectedMapWard, setSelectedMapWard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>(mockHeatmapPoints);
  const [wardRisks, setWardRisks] = useState<ExtendedWardRisk[]>(initialExtendedWardRisks);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>(initialRecommendations);
  const [appliedRecs, setAppliedRecs] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Load GIS Data Effect
  const loadGisData = async () => {
    try {
      setLoading(true);
      const points = await gisApi.getHotspotHeatmap();
      if (points && points.length > 0) {
        setHeatmapPoints(points);
      }
    } catch (err) {
      console.warn('[PredictiveAnalyticsView] Error loading heatmap points:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGisData();
  }, []);

  // Filtered Scorecard Wards List
  const filteredWardRisks = useMemo(() => {
    return wardRisks.filter((w) => {
      const matchesSearch =
        tableSearch === '' ||
        w.wardName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        w.primaryIncidentType.toLowerCase().includes(tableSearch.toLowerCase());

      const matchesRisk = riskFilter === 'ALL' || w.riskLevel === riskFilter;
      const matchesWardFilter =
        selectedWardFilter === 'ALL' || w.wardName.toLowerCase().includes(selectedWardFilter.toLowerCase());

      return matchesSearch && matchesRisk && matchesWardFilter;
    });
  }, [wardRisks, tableSearch, riskFilter, selectedWardFilter]);

  // Handle Reallocation Action
  const handleApplyRecommendation = (rec: ResourceRecommendation) => {
    setAppliedRecs((prev) => ({ ...prev, [rec.id]: true }));
    setNotification(
      `Patrol Reallocation Dispatched: ${rec.unitsToMove} unit(s) shifted from ${rec.sourceWard} to ${rec.targetWard}.`
    );

    // Update target ward patrol count
    setWardRisks((prev) =>
      prev.map((w) => {
        if (rec.targetWard.toLowerCase().includes(w.wardName.toLowerCase())) {
          return { ...w, activePatrols: w.activePatrols + rec.unitsToMove, riskScore: Math.max(10, w.riskScore - 12) };
        }
        return w;
      })
    );
  };

  return (
    <div className={`space-y-6 pb-12 ${className}`}>
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              AI Hotspot Analytics & GIS Forecasting
            </h1>
            <Badge variant="warning" size="md" icon={<Flame className="w-3.5 h-3.5" />}>
              Predictive AI v2.4
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-inter mt-1">
            Spatio-temporal risk modeling, ward density heatmaps, and proactive resource reallocation recommendations
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['24h', '7d', '30d'] as const).map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTimeRange(tr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  timeRange === tr
                    ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tr === '24h' ? 'Next 24h' : tr === '7d' ? 'Next 7 Days' : 'Next 30 Days'}
              </button>
            ))}
          </div>

          {/* Ward Select */}
          <Select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            selectSize="sm"
            variant="field"
            options={[
              { value: 'ALL', label: 'All City Wards' },
              ...initialExtendedWardRisks.map((w) => ({ value: w.wardName, label: w.wardName })),
            ]}
            className="w-44"
          />

          {/* Refresh Data */}
          <Button variant="glass" size="md" onClick={loadGisData} isLoading={loading} title="Refresh Predictions">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Intelligence Report */}
          <Button
            variant="secondary"
            size="md"
            leftIcon={Download}
            onClick={() => setNotification('AI Predictive Intelligence Briefing exported to PDF format.')}
          >
            Export Briefing
          </Button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <AlertCard
          variant="success"
          title="Operational Action Triggered"
          onClose={() => setNotification(null)}
        >
          {notification}
        </AlertCard>
      )}

      {/* 2. GIS Hotspot Map & Summary Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Interactive Leaflet GIS Hotspot Heatmap */}
        <div className="lg:col-span-8 space-y-3">
          <GlassPanel className="p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 font-montserrat font-bold text-sm text-slate-900 dark:text-white">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Interactive GIS Hotspot Heatmap Canvas (Ahmedabad)</span>
            </div>
            {selectedMapWard && (
              <Button
                variant="glass"
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setSelectedMapWard(null)}
              >
                Clear Ward: <span className="font-semibold ml-1">{selectedMapWard}</span>
              </Button>
            )}
          </GlassPanel>

          {/* Leaflet Map Frame */}
          <div className="h-[480px] rounded-2xl overflow-hidden shadow-lg border border-white/20 dark:border-white/10 relative">
            <LeafletMap
              center={[23.0225, 72.5714]}
              zoom={13}
              showWards={true}
              showHeatmaps={true}
              showCctv={false}
              showPatrols={false}
              showRoutes={false}
              selectedWard={selectedMapWard}
              onWardSelect={(ward) => {
                setSelectedMapWard(ward);
                setSelectedWardFilter(ward);
              }}
              heatmapPoints={heatmapPoints}
            />
          </div>
        </div>

        {/* Right Column (4 cols): AI Resource Reallocation Panel & Risk Summaries */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top 3 Summary Mini KPI GlassCards */}
          <div className="grid grid-cols-3 gap-2">
            <GlassCard variant="raised" padding="sm" className="text-center p-2.5">
              <span className="text-[10px] font-montserrat font-semibold text-slate-500 dark:text-slate-400 uppercase">
                High Risk Wards
              </span>
              <div className="text-xl font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">4</div>
              <Badge variant="error" size="sm" className="mt-1 text-[9px]">Critical</Badge>
            </GlassCard>

            <GlassCard variant="raised" padding="sm" className="text-center p-2.5">
              <span className="text-[10px] font-montserrat font-semibold text-slate-500 dark:text-slate-400 uppercase">
                City Density
              </span>
              <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">16.4</div>
              <span className="text-[9px] text-slate-400 font-inter">Incidents/km²</span>
            </GlassCard>

            <GlassCard variant="raised" padding="sm" className="text-center p-2.5">
              <span className="text-[10px] font-montserrat font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Peak Spike
              </span>
              <div className="text-xl font-mono font-bold text-[#004B87] dark:text-[#A8CAFF] mt-0.5">22:00</div>
              <span className="text-[9px] text-slate-400 font-inter">to 03:00 hrs</span>
            </GlassCard>
          </div>

          {/* AI Resource Reallocation Panel */}
          <GlassPanel className="p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
                <span>AI Reallocation Tactical Panel</span>
              </h3>
              <Badge variant="warning" size="sm">{recommendations.length} Recs</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-inter">
              Automated resource optimization based on 24-hour predictive crime density spikes:
            </p>

            {/* Recommendation Cards List */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-xl border transition-all space-y-2 font-inter text-xs ${
                    appliedRecs[rec.id]
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/60 dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Shift {rec.unitsToMove} Patrol Unit(s)
                    </span>
                    <Badge variant={rec.urgency === 'HIGH' ? 'error' : 'warning'} size="sm">
                      {rec.expectedRiskReduction}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{rec.sourceWard}</span> ➔ <span className="font-semibold text-red-600 dark:text-red-400">{rec.targetWard}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    "{rec.reason}"
                  </p>

                  <div className="flex justify-end pt-1">
                    {appliedRecs[rec.id] ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reallocation Dispatched
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[11px] h-7 px-2.5"
                        onClick={() => handleApplyRecommendation(rec)}
                      >
                        Reallocate Patrol
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* 3. Predictive Trend Forecast Charts Panel (Dual Recharts) */}
      <GlassPanel className="p-5 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#004B87] dark:text-[#A8CAFF]" />
              <span>Predictive Spatio-Temporal Crime Trend Forecast</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-inter mt-0.5">
              Historical baseline vs. machine learning 24-hour risk curve and 7-day category breakdown
            </p>
          </div>
          <Badge variant="glass" size="md">Model Confidence: 92.4%</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: 24-Hour Incident Risk Curve */}
          <div className="lg:col-span-7 space-y-2">
            <h4 className="text-xs font-montserrat font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              24-Hour Incident Risk Curve (Predicted vs Historical)
            </h4>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mock24hForecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F57C00" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F57C00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'Inter',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }} />
                  <Area type="monotone" dataKey="riskScore" name="Risk Index (0-100)" fill="url(#riskScoreGrad)" stroke="#F57C00" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" name="Predicted Incidents" stroke="#004B87" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="historical" name="Historical Baseline" stroke="#006B5E" strokeWidth={2} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 7-Day Forward Crime Category Breakdown */}
          <div className="lg:col-span-5 space-y-2">
            <h4 className="text-xs font-montserrat font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              7-Day Forward Prediction by Category
            </h4>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mock7dPredictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }} />
                  <Bar dataKey="Burglary" stackId="a" fill="#D97300" />
                  <Bar dataKey="Robbery" stackId="a" fill="#C62828" />
                  <Bar dataKey="Snatching" stackId="a" fill="#F57C00" />
                  <Bar dataKey="CyberFraud" stackId="a" fill="#004B87" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* 4. Ward Risk Assessment Scorecards Table */}
      <GlassPanel className="p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Ward Risk Assessment Scorecards (Ahmedabad 12 Wards)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-inter mt-0.5">
              Comprehensive threat scoring, incident density per km², and high-vulnerability time windows
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Filter by ward or crime..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              onClear={() => setTableSearch('')}
              leftIcon={Search}
              inputSize="sm"
              variant="field"
              className="w-48"
            />
            {/* Risk Filter Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['ALL', 'HIGH', 'MED', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    riskFilter === lvl
                      ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scorecard Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-montserrat font-semibold text-slate-700 dark:text-slate-300">
                <th className="py-3 px-4">Municipal Ward</th>
                <th className="py-3 px-4">Crime Density</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Peak Risk Time Window</th>
                <th className="py-3 px-4">Primary Incident Type</th>
                <th className="py-3 px-4">Predicted Trend</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredWardRisks.map((w) => (
                <tr
                  key={w.wardId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{w.wardName}</span>
                    <span className="text-[10px] font-mono text-slate-400">({w.wardId})</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {w.crimeDensity} / km²
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={w.riskLevel === 'HIGH' ? 'error' : w.riskLevel === 'MED' ? 'warning' : 'success'}
                      size="sm"
                      pulseDot={w.riskLevel === 'HIGH'}
                    >
                      {w.riskLevel} RISK ({w.riskScore})
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-4">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{w.peakRiskWindow}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {w.primaryIncidentType}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-mono font-bold text-xs">
                      {w.predictedIncidentDelta > 0 ? (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                          <ArrowUpRight className="w-4 h-4" /> +{w.predictedIncidentDelta}%
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ArrowDownRight className="w-4 h-4" /> {w.predictedIncidentDelta}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => {
                        setSelectedMapWard(w.wardName);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="text-[11px] h-7 px-2"
                    >
                      Inspect GIS
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
};

export default PredictiveAnalyticsView;
