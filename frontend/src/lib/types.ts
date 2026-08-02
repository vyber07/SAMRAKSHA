export type OfficerRole = 'constable' | 'io' | 'sho' | 'dcp' | 'admin';

export interface Officer {
  id: string;
  badge_no: string;
  name: string;
  role: OfficerRole;
  ps_id: string;
  ps_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'on_duty' | 'leave' | 'suspended';
  rank?: string;
  avatar_url?: string;
}

export interface DiaryNote {
  id: string;
  timestamp: string;
  author: string;
  note: string;
}

export type CaseStatus = 'pending' | 'under_investigation' | 'chargesheeted' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface CaseFIR {
  id: string;
  fir_no: string;
  ps_id: string;
  ps_name: string;
  incident_date: string;
  reported_date: string;
  crime_type: string;
  bns_sections: string[];
  ipc_sections: string[];
  status: CaseStatus;
  io_name: string;
  complainant_name: string;
  complainant_phone: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
  };
  diary_notes?: DiaryNote[];
  evidence_count?: number;
  priority?: CasePriority;
}

export type CameraStatus = 'online' | 'offline' | 'warning';
export type CctvAnomalyType = 'face_match' | 'plate_recognised' | 'crowd_surge' | 'weapon_detected' | null;

export interface CCTVCamera {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  status: CameraStatus;
  anomaly?: CctvAnomalyType;
  stream_url?: string;
  last_ping?: string;
  resolution?: string;
  camera_type?: 'ptz' | 'fixed' | 'thermal' | 'anpr';
}

export type PatrolVehicleType = 'car' | 'bike' | 'van';
export type PatrolStatus = 'patrolling' | 'dispatched' | 'at_station' | 'busy';

export interface PatrolUnit {
  id: string;
  callsign: string;
  vehicle_type: PatrolVehicleType;
  status: PatrolStatus;
  lat: number;
  lng: number;
  speed: number;
  assigned_ward: string;
  assigned_case_id?: string;
  officers: string[];
  fuel_level?: number;
  contact_number?: string;
}

export interface DispatchRoute {
  id: string;
  unitId: string;
  unitCallsign: string;
  incidentId: string;
  incidentTitle: string;
  etaMinutes: number;
  distanceKm: number;
  coordinates: [number, number][];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export type HotspotPoint = HeatmapPoint;

export interface WardFeatureProperties {
  id: string;
  name: string;
  riskScore: number;
  activeIncidents: number;
  activePatrols: number;
  cctvCount: number;
  populationDensity?: string;
  crimeCategoryBreakdown?: Record<string, number>;
  trendScore?: number;
}

export interface WardBoundary {
  type: 'Feature';
  properties: WardFeatureProperties;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

export interface WardRiskSummary {
  wardId: string;
  wardName: string;
  riskScore: number;
  activeIncidents: number;
  activePatrols: number;
  cctvCount: number;
}

export interface LayerVisibilityState {
  wards: boolean;
  cctv: boolean;
  patrolUnits: boolean;
  routes: boolean;
  heatmaps: boolean;
}

export interface LegalSection {
  id: string;
  bns_section: string;
  bns_code?: string;
  bns_title: string;
  ipc_section: string;
  ipc_equivalent?: string;
  ipc_title?: string;
  category: string;
  description: string;
  punishment: string;
  penalty?: string;
  bailable: boolean;
  cognizable: boolean;
  compoundable?: boolean;
}

export type BnsSection = LegalSection;

export interface LegalSearchResult {
  section: LegalSection;
  matchScore: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  officer_id: string;
  officer_name: string;
  action: string;
  target: string;
  ip_address: string;
  status: 'success' | 'failed' | 'flagged';
  details?: string;
}

export interface CrimeCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  monthlyChange?: number;
}

export interface TimeOfDayDistribution {
  hour: string;
  incidentCount: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface MonthlyTrendPoint {
  month: string;
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  chargesheeted: number;
}

export interface AnalyticsData {
  crimeCategories: CrimeCategoryDistribution[];
  timeOfDayTrends: TimeOfDayDistribution[];
  monthlyTrends: MonthlyTrendPoint[];
  wardDistribution?: { wardName: string; count: number }[];
  totalIncidentsThisMonth?: number;
  clearanceRatePercentage?: number;
  avgResponseTimeMinutes?: number;
}

export interface StationSettings {
  stationId: string;
  stationName: string;
  name?: string;
  district: string;
  stationCode: string;
  shoName: string;
  shoContact?: string;
  email?: string;
  totalOfficers: number;
  activeVehicles: number;
  cctvCount: number;
  cctnsSyncStatus: 'synced' | 'pending' | 'error';
  lastCctnsSync: string;
  emergencyAlertsEnabled: boolean;
  darkThemeDefault?: boolean;
  autoDispatchRadiusKm?: number;
  jurisdictionWards?: string[];
  activeUnitsCount?: number;
  cctvOnlineCount?: number;
  emergencyMode?: boolean;
  cctnsSyncEnabled?: boolean;
  lastSyncTimestamp?: string;
}

export interface CrimeGptMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citedSections?: string[];
  suggestedActions?: string[];
}

export interface CrimeGptResponse {
  answer: string;
  suggestedBnsSections: string[];
  recommendedActions: string[];
  confidenceScore: number;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  type: 'fir_copy' | 'chargesheet' | 'remand_application' | 'search_warrant' | 'bail_objection';
  description: string;
}

export interface GeneratedDocResult {
  docId: string;
  docType: string;
  caseId: string;
  title: string;
  fileUrl: string;
  generatedAt: string;
  fileSizeBytes: number;
}

export interface TranslationItem {
  id: string;
  originalText: string;
  sourceLang: 'gu' | 'hi' | 'en';
  translatedText: string;
  targetLang: 'gu' | 'hi' | 'en';
  confidence: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: 'gu' | 'hi' | 'en';
}

export interface ExecutiveKpiStats {
  totalFirsToday: number;
  activePatrolsCount: number;
  highRiskWardsCount: number;
  activeCctvAnomalies: number;
  pendingInvestigations: number;
  clearanceRate: number;
}
