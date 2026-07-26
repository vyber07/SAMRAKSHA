import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import L from "leaflet";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from "recharts";
import {
  Shield, LayoutDashboard, Map, FolderOpen, Plus, Bot, Video,
  FileText, LogOut, Bell, Settings, Search, ChevronRight,
  AlertTriangle, Car, Camera, TrendingUp, TrendingDown,
  Eye, EyeOff, Send, RefreshCw, Download, Filter,
  Activity, Zap, Radio, CheckCircle, Clock, X, Menu,
  BarChart2, BadgeCheck, Phone, MapPin, Calendar, User,
  Gavel, Receipt, Building, ClipboardList, Scan, MessageCircle,
  ChevronLeft, Info, Globe, Wifi, WifiOff, Lock,
  ChevronDown, ChevronUp, Check, Layers, Cpu, Crosshair, AlertCircle,
  FlameKindling, UserCheck, Navigation, Siren, TriangleAlert, Edit2, Save, Upload,
  Grid, List, FileDown, LayoutGrid, SlidersHorizontal, ExternalLink, PlayCircle, Pause,
  Maximize2, Signal, ZoomIn
} from "lucide-react";

// Fix Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── SAMRAKSHA Logo SVG ───────────────────────────────────────────────────────

let _logoIdCounter = 0;
function SamrakshaLogo({ size = 32 }: { size?: number }) {
  const id = useRef(`sl${++_logoIdCounter}`).current;
  const gA = `${id}a`;
  const gB = `${id}b`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gA} x1="14" y1="6" x2="86" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D6FD8" />
          <stop offset="100%" stopColor="#0B4FAA" />
        </linearGradient>
        <linearGradient id={gB} x1="20" y1="14" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path d="M50 6L14 20v28c0 20.5 15.2 39.7 36 46 20.8-6.3 36-25.5 36-46V20L50 6z" fill={`url(#${gA})`} />
      <path d="M50 14L20 26v22c0 16.5 12.2 32 30 37.2C67.8 80 80 64.5 80 48V26L50 14z" fill={`url(#${gB})`} opacity="0.5" />
      <path
        d="M57.5 36.5c-1.5-2.8-4.2-4.5-7.5-4.5-5 0-9 3.5-9 8 0 4 2.8 6.5 7 8l3 1.2c2.8 1.1 4.5 2.5 4.5 5 0 3-2.5 5-5.5 5-3 0-5.5-1.8-6.5-4.5l-4 1.8c1.5 4 5.2 6.5 10.5 6.5 5.8 0 10-3.8 10-9 0-4.5-3-7-7.5-8.8l-3-1.1C37 43 35.5 41.5 35.5 39c0-2.5 2-4.2 4.5-4.2 2.2 0 3.8 1 4.8 2.8l2.7-1.1z"
        fill="white"
        transform="translate(7, 2)"
      />
    </svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "constable" | "io" | "sho" | "dcp" | "admin";
type CaseStatus = "open" | "arrested" | "chargesheeted" | "closed";
type Page =
  | "login" | "dashboard" | "map" | "patrol" | "cases" | "case-detail"
  | "fir-entry" | "assistant" | "cctv" | "documents" | "analytics" | "profile";

interface Officer {
  id: string; badge_no: string; name: string; role: Role; ps_id: string;
}
interface Case {
  case_id: string; fir_no: string; victim_name: string; accused_name?: string;
  crime_type: string; crime_date: string; crime_location: string;
  case_status: CaseStatus; crime_narrative: string; crime_lat: number; crime_lon: number;
  bns_sections?: string[]; bnss_sections?: string[]; io_name?: string; io_badge?: string;
  victim_age?: number; victim_gender?: string; victim_phone?: string; victim_address: string;
  victim_injury: boolean; accused_address?: string; accused_age?: number;
  diary_entries?: DiaryEntry[];
}
interface DiaryEntry {
  entry_type: string; description: string; ts: string; auto_generated: boolean;
}
interface CCTVAlert {
  id: string; camera_id: string; source: string; alert_type: string;
  confidence: number; person_count?: number; lat: number; lon: number;
  plate_no?: string; ts: string; matched_fir?: string;
}
interface WSMessage {
  type: "NEW_FIR" | "CCTV_ALERT" | "ANPR_MATCH" | "PCR_INCIDENT";
  payload: string; ts: string;
}
interface PatrolUnit {
  id: string; name: string; lat: number; lon: number;
  status: "active" | "idle" | "responding"; route_id: string;
}

// ─── Translations & Multilingual Context ─────────────────────────────────────

export type Language = "en" | "hi" | "gu";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    map: "Crime Map",
    patrol: "Patrolling Units",
    cases: "Cases",
    fir_entry: "New FIR",
    assistant: "AI Assistant",
    cctv: "CCTV",
    documents: "Documents",
    analytics: "Analytics",
    profile: "My Profile",
    quick_actions: "Quick Actions",
    recent_notifs: "Recent Notifications",
    search_placeholder: "Search cases, wards, officers…",
    active_cases: "Active Cases",
    solved_cases: "Cases Solved",
    high_risk_wards: "High Risk Wards",
    active_patrols: "Active Patrols",
    registered_firs: "Registered FIRs",
    shortcuts: "Shortcuts",
    language: "Language",
    logout: "Logout",
    command_center: "Police Command Center",
    live_map: "Live OpenStreetMap Patrol Corridors",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    map: "अपराध मानचित्र",
    patrol: "गश्ती इकाइयाँ",
    cases: "मामले",
    fir_entry: "नई प्राथमिकी (FIR)",
    assistant: "एआई सहायक",
    cctv: "सीसीटीवी निगरानी",
    documents: "दस्तावेज़",
    analytics: "पूर्वानुमान विश्लेषण",
    profile: "मेरी प्रोफ़ाइल",
    quick_actions: "त्वरित कार्रवाई",
    recent_notifs: "हाल की सूचनाएं",
    search_placeholder: "मामले, वार्ड, अधिकारी खोजें…",
    active_cases: "सक्रिय मामले",
    solved_cases: "हल किए गए मामले",
    high_risk_wards: "उच्च जोखिम वाले वार्ड",
    active_patrols: "सक्रिय गश्त",
    registered_firs: "पंजीकृत एफआईआर",
    shortcuts: "शॉर्टकट्स",
    language: "भाषा",
    logout: "लॉग आउट",
    command_center: "पुलिस कमान केंद्र",
    live_map: "लाइव ओपनस्ट्रीटमैप गश्ती गलियारे",
  },
  gu: {
    dashboard: "ડેશબોર્ડ",
    map: "ગુના નકશો",
    patrol: "પેટ્રોલિંગ યુનિટ્સ",
    cases: "કેસો",
    fir_entry: "નવી એફઆઈઆર (FIR)",
    assistant: "એઆઈ સહાયક",
    cctv: "સીસીટીવી નિરીક્ષણ",
    documents: "દસ્તાવેજો",
    analytics: "પૂર્વાનુમાન વિશ્લેષણ",
    profile: "મારી પ્રોફાઇલ",
    quick_actions: "ઝડપી ક્રિયાઓ",
    recent_notifs: "તાજેતરની સૂચનાઓ",
    search_placeholder: "કેસ, વોર્ડ, અધિકારીઓ શોધો…",
    active_cases: "સક્રિય કેસો",
    solved_cases: "ઉકેલાયેલા કેસો",
    high_risk_wards: "ઉચ્ચ જોખમ વોર્ડ",
    active_patrols: "સક્રિય પેટ્રોલિંગ",
    registered_firs: "નોંધાયેલ એફઆઈઆર",
    shortcuts: "શોર્ટકટ્સ",
    language: "ભાષા",
    logout: "લોગ આઉટ",
    command_center: "પોલીસ કમાન્ડ સેન્ટર",
    live_map: "લાઇવ ઓપનસ્ટ્રીટમેપ પેટ્રોલિંગ કોરિડોર",
  },
};

// ─── Predictive Risk Zones Data ──────────────────────────────────────────────

export const PREDICTIVE_HEATMAP_ZONES = [
  { name: "Satellite Market", lat: 23.0285, lon: 72.518, radius: 1200, color: "#EF4444", intensity: 0.88, forecast: "88% Snatching/Robbery spike during festival hours (20:00 - 02:00)" },
  { name: "Naranpura Crossing", lat: 23.055, lon: 72.548, radius: 950, color: "#F59E0B", intensity: 0.72, forecast: "72% Traffic bottleneck & vehicle theft risk" },
  { name: "SG Highway Corridor", lat: 23.035, lon: 72.505, radius: 1400, color: "#EF4444", intensity: 0.92, forecast: "92% High-speed reckless drag & night crime spike" },
  { name: "Kalupur Station Area", lat: 23.025, lon: 72.602, radius: 1100, color: "#F59E0B", intensity: 0.76, forecast: "76% Pickpocketing & baggage theft crowded risk" },
  { name: "Maninagar Junction", lat: 22.998, lon: 72.605, radius: 850, color: "#22C55E", intensity: 0.45, forecast: "45% Low-level loitering risk" },
];

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppCtx {
  officer: Officer | null;
  token: string | null;
  login: (badge: string, password: string) => Promise<void>;
  logout: () => void;
  page: Page;
  navigate: (p: Page, params?: Record<string, string>) => void;
  params: Record<string, string>;
  wsMessages: WSMessage[];
  wsConnected: boolean;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const Ctx = createContext<AppCtx>({} as AppCtx);
const useApp = () => useContext(Ctx);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_OFFICERS: Record<string, { officer: Officer; password: string }> = {
  DCP001: {
    password: "Demo@2026",
    officer: { id: "1", badge_no: "DCP001", name: "Rajesh Kumar Sharma", role: "dcp", ps_id: "HQ" },
  },
  SHO_ELL: {
    password: "Demo@2026",
    officer: { id: "2", badge_no: "SHO_ELL", name: "Priya Mehta", role: "sho", ps_id: "ELL" },
  },
  IO_ELL_1: {
    password: "Demo@2026",
    officer: { id: "3", badge_no: "IO_ELL_1", name: "Amit Patel", role: "io", ps_id: "ELL" },
  },
};

const MOCK_CASES: Case[] = [
  {
    case_id: "c001", fir_no: "FIR-2026-001", victim_name: "Ramesh Gupta",
    victim_address: "12, Satellite Road, Ahmedabad", victim_injury: false,
    accused_name: "Unknown", accused_address: "Unknown", crime_type: "Theft",
    crime_date: "2026-07-10T14:30:00Z", crime_location: "Satellite Market",
    crime_lat: 23.0342, crime_lon: 72.5168, case_status: "open",
    crime_narrative: "Victim reported theft of mobile phone and wallet near Satellite Market. CCTV footage shows a suspect in blue shirt.",
    bns_sections: ["BNS 303", "BNS 304"], bnss_sections: ["BNSS 173"],
    io_name: "Amit Patel", io_badge: "IO_ELL_1", victim_age: 42, victim_gender: "Male",
    victim_phone: "9876543210", diary_entries: [
      { entry_type: "fir", description: "FIR registered by victim Ramesh Gupta.", ts: "2026-07-10T15:00:00Z", auto_generated: true },
      { entry_type: "cctv", description: "CCTV footage retrieved from Market CCTV-07.", ts: "2026-07-10T16:30:00Z", auto_generated: false },
      { entry_type: "note", description: "Eyewitness statement recorded from shop owner.", ts: "2026-07-11T10:00:00Z", auto_generated: false },
    ],
  },
  {
    case_id: "c002", fir_no: "FIR-2026-002", victim_name: "Sunita Verma",
    victim_address: "45B, Naranpura, Ahmedabad", victim_injury: true,
    accused_name: "Prakash Joshi", accused_address: "77, Chandkheda", accused_age: 28,
    crime_type: "Assault", crime_date: "2026-07-09T20:15:00Z",
    crime_location: "Naranpura Crossing", crime_lat: 23.0607, crime_lon: 72.5554,
    case_status: "arrested", crime_narrative: "Victim Sunita Verma was assaulted near Naranpura crossing. Accused identified through CCTV. Medical report attached.",
    bns_sections: ["BNS 115", "BNS 116"], bnss_sections: ["BNSS 35"],
    io_name: "Priya Mehta", io_badge: "SHO_ELL", victim_age: 34, victim_gender: "Female",
    victim_phone: "9812345678", diary_entries: [
      { entry_type: "fir", description: "FIR registered at Naranpura PS.", ts: "2026-07-09T21:00:00Z", auto_generated: true },
      { entry_type: "arrest", description: "Accused Prakash Joshi arrested from Chandkheda residence.", ts: "2026-07-10T08:30:00Z", auto_generated: false },
      { entry_type: "document", description: "Medical report attached to case file.", ts: "2026-07-10T11:00:00Z", auto_generated: true },
    ],
  },
  {
    case_id: "c003", fir_no: "FIR-2026-003", victim_name: "TechnoSoft Solutions",
    victim_address: "SG Highway, Bodakdev", victim_injury: false,
    crime_type: "Cyber Crime", crime_date: "2026-07-08T11:00:00Z",
    crime_location: "Online / Bodakdev", crime_lat: 23.0346, crime_lon: 72.5143,
    case_status: "open", crime_narrative: "Company reported unauthorized access to internal systems. Ransomware detected on servers. Financial loss estimated at ₹15 lakhs.",
    bns_sections: ["BNS 316", "BNS 318"], bsa_sections: ["BSA 66", "BSA 66C"],
    io_name: "Amit Patel", io_badge: "IO_ELL_1", diary_entries: [
      { entry_type: "fir", description: "Cyber crime FIR registered.", ts: "2026-07-08T12:00:00Z", auto_generated: true },
      { entry_type: "seizure", description: "Servers seized for forensic analysis.", ts: "2026-07-08T15:00:00Z", auto_generated: false },
    ],
  },
  {
    case_id: "c004", fir_no: "FIR-2026-004", victim_name: "Harish Solanki",
    victim_address: "22, Maninagar, Ahmedabad", victim_injury: true,
    accused_name: "Group of 4 (identified)", crime_type: "Robbery",
    crime_date: "2026-07-07T22:45:00Z", crime_location: "Maninagar Station Road",
    crime_lat: 22.9921, crime_lon: 72.5940, case_status: "chargesheeted",
    crime_narrative: "Armed robbery at Maninagar. Victim severely injured. Accused identified and chargesheet filed.",
    bns_sections: ["BNS 309", "BNS 310"], io_name: "Priya Mehta", io_badge: "SHO_ELL",
    victim_age: 55, victim_gender: "Male", diary_entries: [
      { entry_type: "fir", description: "FIR registered.", ts: "2026-07-07T23:00:00Z", auto_generated: true },
      { entry_type: "arrest", description: "All 4 accused arrested.", ts: "2026-07-08T06:00:00Z", auto_generated: false },
      { entry_type: "document", description: "Chargesheet filed in court.", ts: "2026-07-12T09:00:00Z", auto_generated: false },
    ],
  },
  {
    case_id: "c005", fir_no: "FIR-2026-005", victim_name: "Meena Rajput",
    victim_address: "18, Ghatlodia, Ahmedabad", victim_injury: false,
    crime_type: "Stalking", crime_date: "2026-07-11T17:00:00Z",
    crime_location: "Ghatlodia Area", crime_lat: 23.0771, crime_lon: 72.5420,
    case_status: "open", crime_narrative: "Victim reports persistent stalking by ex-colleague. Multiple incidents over 2 weeks.",
    bns_sections: ["BNS 78"], io_name: "Amit Patel", io_badge: "IO_ELL_1",
    victim_age: 28, victim_gender: "Female", victim_phone: "9988776655", diary_entries: [
      { entry_type: "fir", description: "Stalking complaint registered.", ts: "2026-07-11T17:30:00Z", auto_generated: true },
    ],
  },
];

const MOCK_CCTV_ALERTS: CCTVAlert[] = [
  { id: "a1", camera_id: "CCTV-SAT-007", source: "Satellite Market", alert_type: "crowd_density", confidence: 0.87, person_count: 143, lat: 23.0342, lon: 72.5168, ts: "2026-07-13T14:23:00Z" },
  { id: "a2", camera_id: "CCTV-NAR-012", source: "Naranpura Crossing", alert_type: "loitering", confidence: 0.72, person_count: 3, lat: 23.0607, lon: 72.5554, ts: "2026-07-13T14:18:00Z" },
  { id: "a3", camera_id: "ANPR-SG-003", source: "SG Highway", alert_type: "anpr", confidence: 0.95, plate_no: "GJ01AA1234", lat: 23.0346, lon: 72.5143, ts: "2026-07-13T14:10:00Z", matched_fir: "FIR-2026-004" },
  { id: "a4", camera_id: "CCTV-MAN-019", source: "Maninagar Station", alert_type: "anomaly", confidence: 0.61, person_count: 1, lat: 22.9921, lon: 72.5940, ts: "2026-07-13T14:05:00Z" },
  { id: "a5", camera_id: "CCTV-GHT-004", source: "Ghatlodia Main", alert_type: "crowd_density", confidence: 0.79, person_count: 89, lat: 23.0771, lon: 72.5420, ts: "2026-07-13T13:55:00Z" },
  { id: "a6", camera_id: "CCTV-BOD-011", source: "Bodakdev Junction", alert_type: "loitering", confidence: 0.55, person_count: 2, lat: 23.0408, lon: 72.5088, ts: "2026-07-13T13:40:00Z" },
];

const MOCK_PATROL: PatrolUnit[] = [
  { id: "p1", name: "PCR-11", lat: 23.0225, lon: 72.5714, status: "active", route_id: "r1" },
  { id: "p2", name: "PCR-14", lat: 23.0450, lon: 72.5500, status: "responding", route_id: "r2" },
  { id: "p3", name: "PCR-07", lat: 22.9900, lon: 72.5850, status: "idle", route_id: "r3" },
  { id: "p4", name: "PCR-23", lat: 23.0700, lon: 72.5300, status: "active", route_id: "r4" },
];

const MOCK_WARDS: Record<string, { risk_score: number; level: string; festival_flag: boolean }> = {
  Satellite: { risk_score: 78, level: "HIGH", festival_flag: false },
  Naranpura: { risk_score: 65, level: "ELEVATED", festival_flag: false },
  Maninagar: { risk_score: 82, level: "HIGH", festival_flag: true },
  Ghatlodia: { risk_score: 45, level: "MEDIUM", festival_flag: false },
  Bodakdev: { risk_score: 30, level: "LOW", festival_flag: false },
  Chandkheda: { risk_score: 55, level: "ELEVATED", festival_flag: false },
  Naroda: { risk_score: 70, level: "HIGH", festival_flag: false },
  Vastrapur: { risk_score: 40, level: "MEDIUM", festival_flag: false },
  Nikol: { risk_score: 60, level: "ELEVATED", festival_flag: false },
  Paldi: { risk_score: 35, level: "LOW", festival_flag: false },
  Navrangpura: { risk_score: 50, level: "MEDIUM", festival_flag: false },
  Sabarmati: { risk_score: 48, level: "MEDIUM", festival_flag: false },
};

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  count: Math.floor(Math.random() * 18 + (i >= 20 || i <= 4 ? 12 : 3)),
}));

const WEEKLY_DATA = [
  { day: "Mon", count: 34 }, { day: "Tue", count: 28 }, { day: "Wed", count: 41 },
  { day: "Thu", count: 37 }, { day: "Fri", count: 52 }, { day: "Sat", count: 63 }, { day: "Sun", count: 48 },
];

const CRIME_TYPE_DATA = [
  { type: "Theft", count: 89 }, { type: "Assault", count: 42 }, { type: "Robbery", count: 31 },
  { type: "Cyber", count: 27 }, { type: "Stalking", count: 18 }, { type: "Drug", count: 15 },
  { type: "Murder", count: 8 }, { type: "Other", count: 22 },
];

const MONTHLY_DATA = [
  { month: "Jan", count: 142 }, { month: "Feb", count: 128 }, { month: "Mar", count: 156 },
  { month: "Apr", count: 134 }, { month: "May", count: 168 }, { month: "Jun", count: 145 },
  { month: "Jul", count: 112 },
];

const CHART_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

const DOC_TYPES = [
  { key: "chargesheet", label: "Chargesheet", icon: Gavel, desc: "Formal charge document for court submission" },
  { key: "medical_letter", label: "Medical Letter", icon: Activity, desc: "Request for medical examination of victim/accused" },
  { key: "remand_request", label: "Remand Request", icon: Clock, desc: "Application for accused custody extension" },
  { key: "seizure_receipt", label: "Seizure Receipt", icon: Receipt, desc: "Acknowledgment of seized evidence items" },
  { key: "court_custody", label: "Court Custody", icon: Building, desc: "Transfer of accused to court custody" },
  { key: "panchanama", label: "Panchanama", icon: ClipboardList, desc: "Witness-signed scene of crime document" },
  { key: "face_id", label: "Face ID Report", icon: Scan, desc: "Facial recognition analysis report" },
];

const AHMEDABAD_WARDS = [
  "Jamalpur","Kalupur","Dariapur","Shahpur","Saraspur","Gomtipur","Odhav","Vatva",
  "Behrampura","Maninagar","Sardarnagar","Nikol","Naroda","Thakkarbapa","Chandkheda",
  "Sabarmati","Ranip","Naranpura","Ghatlodia","Sola","Bodakdev","Vastrapur",
  "Satellite","Jodhpur","Ambawadi","Navrangpura","Paldi","Vejalpur","Vastral",
  "Isanpur","Khadia","Rakhial",
];

const WS_MESSAGE_TEMPLATES: WSMessage[] = [
  { type: "NEW_FIR", payload: "New FIR registered: Theft at Vastrapur", ts: "" },
  { type: "CCTV_ALERT", payload: "Crowd density alert: CCTV-SAT-007 — 143 persons", ts: "" },
  { type: "ANPR_MATCH", payload: "ANPR match: GJ01BB9876 — linked to FIR-2026-004", ts: "" },
  { type: "PCR_INCIDENT", payload: "PCR-11 responding to assault near Navrangpura", ts: "" },
  { type: "NEW_FIR", payload: "New FIR: Snatching reported at Maninagar Market", ts: "" },
  { type: "CCTV_ALERT", payload: "Loitering alert: CCTV-NAR-012 — 3 individuals, 22 min", ts: "" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "#60A5FA", bg: "rgba(59,130,246,0.15)" },
  arrested: { label: "Arrested", color: "#FBBF24", bg: "rgba(245,158,11,0.15)" },
  chargesheeted: { label: "Chargesheeted", color: "#A78BFA", bg: "rgba(139,92,246,0.15)" },
  closed: { label: "Closed", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
};

const RISK_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  HIGH: { color: "#EF4444", bg: "rgba(239,68,68,0.15)", dot: "#EF4444" },
  ELEVATED: { color: "#F97316", bg: "rgba(249,115,22,0.15)", dot: "#F97316" },
  MEDIUM: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", dot: "#F59E0B" },
  LOW: { color: "#22C55E", bg: "rgba(34,197,94,0.15)", dot: "#22C55E" },
};

const ROLE_CONFIG: Record<Role, { color: string; label: string }> = {
  constable: { color: "#6B7280", label: "Constable" },
  io: { color: "#3B82F6", label: "IO" },
  sho: { color: "#8B5CF6", label: "SHO" },
  dcp: { color: "#EF4444", label: "DCP" },
  admin: { color: "#F59E0B", label: "Admin" },
};

const WS_COLOR: Record<string, string> = {
  NEW_FIR: "#3B82F6",
  CCTV_ALERT: "#F97316",
  ANPR_MATCH: "#EF4444",
  PCR_INCIDENT: "#F59E0B",
};

// ─── Common Components ────────────────────────────────────────────────────────

function Badge({ children, color = "#3B82F6", bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color, backgroundColor: bg || color + "22" }}
    >
      {children}
    </span>
  );
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#CBD5E1", backgroundColor: "rgba(255,255,255,0.06)", ...style }}>
      {children}
    </span>
  );
}

function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-2xl border p-4 transition-colors duration-200 bg-[var(--card)] text-[var(--card-foreground)] border-[var(--border)] shadow-sm", className)}
      style={{ ...style }}
    >
      {children}
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color, loading, tooltip }: {
  title: string; value: string | number; change?: number;
  icon: React.ElementType; color: string; loading?: boolean; tooltip?: string;
}) {
  const inner = (
    <Card className="flex flex-col gap-3 w-full cursor-default" style={{ borderRadius: 20 }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + "22" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change !== undefined && (
          <span
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: change >= 0 ? "#22C55E" : "#EF4444",
              backgroundColor: change >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            }}
          >
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-xl animate-pulse bg-slate-500/10" />
      ) : (
        <div className="text-3xl font-bold text-[var(--foreground)]" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
      )}
      <div className="text-sm font-medium capitalize text-[var(--muted-foreground)]">{title}</div>
    </Card>
  );
  if (tooltip) return <HoverTooltip tip={tooltip} side="bottom"><div className="w-full">{inner}</div></HoverTooltip>;
  return inner;
}

function PageHeader({ title, subtitle, action, showBack }: { title: string; subtitle?: string; action?: React.ReactNode; showBack?: boolean }) {
  const { page, navigate } = useApp();
  const needsBack = showBack !== undefined ? showBack : (page !== "dashboard" && page !== "login");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
      <div className="flex items-center gap-3">
        {needsBack && (
          <HoverTooltip tip="Return to Command Center">
            <button
              onClick={() => navigate("dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 cursor-pointer bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-sm"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </HoverTooltip>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] font-display">{title}</h1>
          {subtitle && <p className="text-sm mt-0.5 text-[var(--muted-foreground)]">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, className, rightElement, ...props }: {
  label?: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; rightElement?: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none transition-all bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-slate-400 focus:border-[var(--primary)] shadow-inner"
          style={{
            paddingRight: rightElement ? "2.5rem" : undefined,
          }}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, className }: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl px-3 py-2.5 text-sm outline-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] shadow-inner"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--card)] text-[var(--foreground)]">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Button({ children, onClick, variant = "filled", size = "md", disabled, className, style }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "filled" | "outlined" | "text" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean;
  className?: string; style?: React.CSSProperties;
}) {
  const sizeClasses = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-2.5 text-base" };
  const variants = {
    filled: { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)", border: "none" },
    outlined: { backgroundColor: "transparent", color: "var(--color-primary)", border: "1px solid var(--color-primary)" },
    text: { backgroundColor: "transparent", color: "var(--color-primary)", border: "none" },
    danger: { backgroundColor: "var(--color-error)", color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("rounded-2xl font-medium transition-all flex items-center gap-2", sizeClasses[size], disabled && "opacity-50 cursor-not-allowed", className)}
      style={{ ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function HoverTooltip({ children, tip, side = "top" }: { children: React.ReactNode; tip: string; side?: "top" | "bottom" | "left" | "right" }) {
  const [show, setShow] = useState(false);
  const posMap = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  };
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          className="absolute z-50 px-2.5 py-1.5 rounded-xl text-xs font-medium pointer-events-none whitespace-nowrap bg-[var(--popover)] border border-[var(--border)] text-[var(--popover-foreground)] shadow-lg"
          style={{
            ...posMap[side],
            backdropFilter: "blur(16px)",
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 560 }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col max-h-[85vh] overflow-hidden bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] rounded-3xl shadow-2xl"
        style={{
          maxWidth: width,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--foreground)] font-display">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[var(--input)] text-[var(--foreground)] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function downloadCasesCSV(cases: Case[]) {
  const headers = ["FIR No", "Victim Name", "Accused Name", "Crime Type", "Date", "Location", "Status", "IO Name"];
  const rows = cases.map((c) => [
    `"${c.fir_no}"`,
    `"${c.victim_name}"`,
    `"${c.accused_name || "Unknown"}"`,
    `"${c.crime_type}"`,
    `"${c.crime_date}"`,
    `"${c.crime_location}"`,
    `"${c.case_status.toUpperCase()}"`,
    `"${c.io_name || "Unassigned"}"`,
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `samraksha_cases_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function QuickViewModal({ caseData, onClose }: { caseData: Case | null; onClose: () => void }) {
  const { navigate } = useApp();
  if (!caseData) return null;

  const statusConf = STATUS_CONFIG[caseData.case_status];

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <Modal open={!!caseData} onClose={onClose} title={`Quick View: ${caseData.fir_no}`} width={680}>
      <div className="flex flex-col gap-4 printable-area">
        {/* Printable Official Header */}
        <div className="hidden print-only mb-4 border-b pb-4 border-black">
          <h1 className="text-xl font-bold uppercase text-black">AHMEDABAD CITY POLICE — OFFICIAL CASE SUMMARY</h1>
          <p className="text-xs text-gray-600">Generated via SAMRAKSHA AI Case Intelligence Platform · {new Date().toLocaleString()}</p>
        </div>

        {/* Top Badges */}
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10 no-print">
          <div className="flex items-center gap-2">
            <Badge color={statusConf.color} bg={statusConf.bg}>
              {statusConf.label}
            </Badge>
            <Chip><Shield size={12} className="mr-1" /> {caseData.crime_type}</Chip>
          </div>
          <p className="text-xs text-slate-400 font-mono">{caseData.crime_date}</p>
        </div>

        {/* Key Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-slate-400">Victim</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">{caseData.victim_name}</p>
            {caseData.victim_age && <p className="text-[10px] text-slate-400">{caseData.victim_age} yrs · {caseData.victim_gender || "N/A"}</p>}
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-slate-400">Accused</p>
            <p className="text-sm font-semibold text-amber-400 mt-0.5">{caseData.accused_name || "Unknown / Under Probe"}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-slate-400">Location</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">{caseData.crime_location}</p>
          </div>
        </div>

        {/* Legal Sections */}
        {((caseData.bns_sections && caseData.bns_sections.length > 0) || (caseData.bnss_sections && caseData.bnss_sections.length > 0)) && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5">
              <Gavel size={13} /> Legal Charges &amp; Sections (BNS / BNSS)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {caseData.bns_sections?.map((sec) => (
                <span key={sec} className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  BNS {sec}
                </span>
              ))}
              {caseData.bnss_sections?.map((sec) => (
                <span key={sec} className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  BNSS {sec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Narrative Summary */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <FileText size={13} className="text-blue-400" /> Crime Narrative Summary
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{caseData.crime_narrative}</p>
        </div>

        {/* Case Diary Timeline */}
        {caseData.diary_entries && caseData.diary_entries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <ClipboardList size={13} className="text-amber-400" /> Recent Case Diary Entries
            </p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {caseData.diary_entries.map((entry, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold text-blue-400">{entry.entry_type}</span>
                    <span>{new Date(entry.ts).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-200">{entry.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 no-print">
          <div className="flex items-center gap-2">
            <HoverTooltip tip="Export CSV data for this case file">
              <Button size="sm" variant="outlined" onClick={() => downloadCasesCSV([caseData])} className="rounded-full">
                <Download size={13} /> Export CSV
              </Button>
            </HoverTooltip>
            <HoverTooltip tip="Print or save official PDF case sheet">
              <Button size="sm" variant="outlined" onClick={handlePrintPDF} className="rounded-full">
                <FileDown size={13} /> Print PDF
              </Button>
            </HoverTooltip>
          </div>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              navigate("case-detail", { case_id: caseData.case_id });
            }}
            className="rounded-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            Full Case File <ChevronRight size={13} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

interface NavItem { id: Page; label: string; icon: React.ElementType; roles: Role[] }

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["sho", "dcp", "admin"] },
  { id: "map", label: "Crime Map", icon: Map, roles: ["constable", "io", "sho", "dcp", "admin"] },
  { id: "patrol", label: "Patrolling Units", icon: Siren, roles: ["constable", "io", "sho", "dcp", "admin"] },
  { id: "cases", label: "Cases", icon: FolderOpen, roles: ["io", "sho", "dcp", "admin"] },
  { id: "fir-entry", label: "New FIR", icon: Plus, roles: ["io", "sho", "admin"] },
  { id: "assistant", label: "AI Assistant", icon: Bot, roles: ["sho", "dcp", "admin"] },
  { id: "cctv", label: "CCTV", icon: Video, roles: ["sho", "dcp", "admin"] },
  { id: "documents", label: "Documents", icon: FileText, roles: ["io", "sho", "dcp", "admin"] },
  { id: "analytics", label: "Analytics", icon: BarChart2, roles: ["dcp", "admin"] },
];

function Sidebar({ wsConnected }: { wsConnected: boolean }) {
  const { officer, logout, page, navigate } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  if (!officer) return null;

  const allowed = NAV_ITEMS.filter((i) => i.roles.includes(officer.role));
  const roleConf = ROLE_CONFIG[officer.role];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:flex flex-col h-screen sticky top-0 select-none z-50 transition-all duration-300 ease-in-out shadow-2xl"
      style={{
        width: isHovered ? 240 : 72,
        background: "var(--sidebar)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid var(--sidebar-border)",
        color: "var(--sidebar-foreground)",
        flexShrink: 0,
      }}
    >
      {/* Logo Hover Trigger */}
      <div
        className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        onClick={() => navigate("dashboard")}
      >
        <div className="flex-shrink-0">
          <SamrakshaLogo size={36} />
        </div>
        {isHovered && (
          <div className="flex flex-col min-w-0 overflow-hidden animate-fadeIn whitespace-nowrap">
            <span className="text-sm font-bold tracking-tight font-display text-[var(--sidebar-foreground)]">SAMRAKSHA</span>
            <span className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase">Law Enforcement</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1.5 py-3 px-2 flex-1 overflow-y-auto overflow-x-hidden">
        {allowed.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all relative group cursor-pointer"
              style={{
                color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                background: active ? "var(--sidebar-accent)" : "transparent",
                border: active ? "1px solid rgba(128,247,235,0.25)" : "1px solid transparent",
              }}
              title={!isHovered ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-[#80F7EB]" />
              )}
              <item.icon size={20} className="flex-shrink-0 transition-transform group-hover:scale-110" />
              {isHovered ? (
                <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis animate-fadeIn">
                  {item.label}
                </span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom officer info */}
      <div
        className="flex items-center justify-between gap-2 p-3 transition-colors"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          onClick={() => navigate("profile")}
          className="flex items-center gap-3 w-full text-left cursor-pointer group min-w-0"
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
              style={{ backgroundColor: roleConf.color + "33", color: roleConf.color }}
            >
              {officer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ backgroundColor: wsConnected ? "#22C55E" : "#6B7280", borderColor: "#0A0E1A" }}
            />
          </div>
          {isHovered && (
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden animate-fadeIn">
              <p className="text-xs font-bold text-[var(--sidebar-foreground)] truncate group-hover:opacity-100 opacity-90">{officer.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{officer.ps_id}</p>
            </div>
          )}
        </button>
        {isHovered && (
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-all hover:bg-red-500/20 text-red-400 hover:text-red-300 flex-shrink-0 cursor-pointer"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function BottomNav() {
  const { officer, page, navigate } = useApp();
  if (!officer) return null;
  const allowed = NAV_ITEMS.filter((i) => i.roles.includes(officer.role)).slice(0, 5);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around z-50 px-2 pb-2 transition-colors"
      style={{ backgroundColor: "var(--sidebar)", borderTop: "1px solid var(--sidebar-border)", paddingTop: 8 }}
    >
      {allowed.map((item) => {
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
            style={{ color: active ? "var(--color-primary)" : "var(--sidebar-foreground)", backgroundColor: active ? "rgba(0,75,135,0.15)" : "transparent" }}
          >
            <item.icon size={18} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ wsConnected }: { wsConnected: boolean }) {
  const { officer, navigate, wsMessages, language, setLanguage } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const recentCount = wsMessages.filter((m) => Date.now() - new Date(m.ts).getTime() < 300000).length;

  return (
    <div
      className="h-14 flex items-center justify-between px-4 sticky top-0 z-40 gap-3 transition-colors duration-300"
      style={{
        background: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)"
      }}
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 md:hidden">
          <SamrakshaLogo size={26} />
          <span className="font-bold text-sm font-display text-[var(--foreground)]">SAMRAKSHA</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="font-bold text-sm font-display text-[var(--foreground)]">SAMRAKSHA</span>
          <span className="text-xs text-[var(--muted-foreground)]">Ahmedabad City Police</span>
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-sm hidden sm:block relative">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all"
          style={{
            backgroundColor: searchFocused ? "rgba(0,75,135,0.08)" : "var(--input)",
            border: `1px solid ${searchFocused ? "var(--color-primary)" : "var(--border)"}`,
          }}
        >
          <Search size={13} className={searchFocused ? "text-[var(--color-primary)]" : "text-[var(--muted-foreground)]"} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search cases, wards, officers…"
            className="flex-1 bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="opacity-50 hover:opacity-100 text-[var(--foreground)]">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchFocused && searchQuery.length >= 2 && (
          <div
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
            style={{
              backdropFilter: "blur(24px)",
            }}
          >
            {(() => {
              const q = searchQuery.toLowerCase();
              const caseResults = MOCK_CASES.filter((c) =>
                c.fir_no.toLowerCase().includes(q) ||
                c.victim_name.toLowerCase().includes(q) ||
                c.crime_type.toLowerCase().includes(q)
              ).slice(0, 4);
              const wardResults = Object.entries(MOCK_WARDS).filter(([name]) => name.toLowerCase().includes(q)).slice(0, 2);
              const total = caseResults.length + wardResults.length;
              if (total === 0) return (
                <div className="px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">No results for "{searchQuery}"</div>
              );
              return (
                <div className="py-2">
                  {caseResults.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Cases</div>
                      {caseResults.map((c) => (
                        <button
                          key={c.case_id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-500/10 cursor-pointer"
                          onMouseDown={() => { navigate("case-detail", { case_id: c.case_id }); }}
                        >
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/15">
                            <FolderOpen size={12} className="text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium font-mono text-[var(--foreground)]">{c.fir_no}</p>
                            <p className="text-[10px] truncate text-[var(--muted-foreground)]">{c.victim_name} · {c.crime_type}</p>
                          </div>
                          <Badge color={STATUS_CONFIG[c.case_status].color} bg={STATUS_CONFIG[c.case_status].bg}>{STATUS_CONFIG[c.case_status].label}</Badge>
                        </button>
                      ))}
                    </>
                  )}
                  {wardResults.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Wards</div>
                      {wardResults.map(([name, data]) => (
                        <button key={name} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-500/10 cursor-pointer">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: RISK_CONFIG[data.level].bg }}>
                            <MapPin size={12} color={RISK_CONFIG[data.level].color} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{name}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">Risk: {data.risk_score}</p>
                          </div>
                          <Badge color={RISK_CONFIG[data.level].color} bg={RISK_CONFIG[data.level].bg}>{data.level}</Badge>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Global Language Switcher */}
        <div className="relative">
          <div className="flex items-center gap-1.5 bg-[var(--input)] border border-[var(--border)] rounded-xl px-2.5 py-1 shadow-inner">
            <Globe size={14} className="text-[var(--color-primary)] flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-[var(--card)] text-[var(--foreground)]">English</option>
              <option value="hi" className="bg-[var(--card)] text-[var(--foreground)]">हिंदी (Hindi)</option>
              <option value="gu" className="bg-[var(--card)] text-[var(--foreground)]">ગુજરાતી (Gujarati)</option>
            </select>
          </div>
        </div>

        {/* Mobile search icon */}
        <button
          className="sm:hidden p-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)]"
          onClick={() => {}}
          title="Search"
        >
          <Search size={15} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl transition-all hover:opacity-80 cursor-pointer bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)]"
          >
            <Bell size={16} />
            {recentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-red-600 text-white shadow">
                {recentCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div
              className="absolute right-0 top-10 w-72 rounded-2xl border z-50 overflow-hidden shadow-2xl bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-xs font-semibold" style={{ color: "#CBD5E1" }}>Recent Alerts</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {wsMessages.slice(0, 6).map((m, i) => (
                  <div key={i} className="px-3 py-2 flex gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: WS_COLOR[m.type] }} />
                    <div>
                      <p className="text-xs" style={{ color: "#CBD5E1" }}>{m.payload}</p>
                      <p className="text-[10px]" style={{ color: "#64748B" }}>{timeAgo(m.ts)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {officer && (
          <HoverTooltip tip="Open Officer Profile">
            <button
              onClick={() => navigate("profile")}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all hover:bg-white/10 cursor-pointer border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: ROLE_CONFIG[officer.role].color + "33", color: ROLE_CONFIG[officer.role].color }}>
                {officer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none" style={{ color: "#CBD5E1" }}>{officer.name.split(" ")[0]}</p>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: ROLE_CONFIG[officer.role].color }}>
                  {ROLE_CONFIG[officer.role].label}
                </p>
              </div>
            </button>
          </HoverTooltip>
        )}
      </div>
    </div>
  );
}

// ─── Voice Input Widget (Module 3) ───────────────────────────────────────────

function VoiceInputWidget({
  onTranscript,
  label = "Voice Input",
  compact = false,
}: {
  onTranscript: (text: string) => void;
  label?: string;
  compact?: boolean;
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");

  const samplePhrases = [
    "Suspect forcibly snatched gold chain worth 1.2 Lakhs and fled towards SG Highway on unregistered motorcycle.",
    "Victim sustained severe head injury due to assault with dangerous iron rod during robbery.",
    "Unlawful assembly of 4 suspects near Satellite Market causing public obstruction and theft.",
    "Witness states two masked individuals threatened victim with deadly weapon before escaping.",
  ];

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setInterimText("");
    } else {
      setIsListening(true);
      setInterimText("Listening to audio stream...");
      let step = 0;
      const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      const words = phrase.split(" ");
      const interval = setInterval(() => {
        step += 1;
        const current = words.slice(0, step * 2).join(" ");
        setInterimText(current + "...");
        if (step * 2 >= words.length) {
          clearInterval(interval);
          setTimeout(() => {
            onTranscript(phrase);
            setIsListening(false);
            setInterimText("");
          }, 500);
        }
      }, 350);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <HoverTooltip tip={isListening ? "Stop Voice Dictation" : "Voice Input (Speech-to-Text Dictation)"}>
        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
            isListening
              ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shadow-red-500/20"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
          }`}
        >
          <span className="material-symbols-rounded text-base">{isListening ? "mic_off" : "mic"}</span>
          {!compact && <span>{isListening ? "Recording..." : label}</span>}
        </button>
      </HoverTooltip>

      {/* Animated Audio Equalizer Waveform */}
      {isListening && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-red-500/30 shadow-lg">
          {[0.4, 0.9, 0.3, 0.8, 0.5, 1.0, 0.4, 0.7].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${14 * h}px`,
                animationDuration: `${0.25 + (i % 4) * 0.12}s`,
              }}
            />
          ))}
          <span className="text-[10px] text-red-300 font-mono ml-1.5 truncate max-w-[150px]">{interimText}</span>
        </div>
      )}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage() {
  const { login } = useApp();
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!badge || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try { await login(badge, password); }
    catch (e: unknown) { setError((e as Error).message || "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "linear-gradient(135deg, #0A0E1A 0%, #0D1117 50%, #0F172A 100%)" }}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "#3B82F6" }} />

        <div className="rounded-2xl border p-8 relative shadow-2xl" style={{ backgroundColor: "#161D2D", borderColor: "rgba(255,255,255,0.1)" }}>
          {/* Header */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <div className="relative">
              <SamrakshaLogo size={56} />
              <div className="absolute inset-0 rounded-2xl animate-pulse opacity-20 blur-md" style={{ backgroundColor: "#3B82F6" }} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-wider" style={{ color: "#F1F5F9" }}>SAMRAKSHA</h1>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Ahmedabad City Police — AI Case Intelligence</p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-4">
            <Input label="Badge Number" value={badge} onChange={setBadge} placeholder="e.g. DCP001" />
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              rightElement={
                <button onClick={() => setShowPass(!showPass)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {error && (
              <div className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button onClick={handleLogin} disabled={loading} size="lg" className="w-full justify-center mt-2">
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><Lock size={14} /> Sign In</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function SegmentedChartCard() {
  const [timeSeg, setTimeSeg] = useState<"hourly" | "weekly" | "monthly">("hourly");
  const [chartType, setChartType] = useState<"bar" | "area" | "line">("bar");

  const timeSegments: { key: "hourly" | "weekly" | "monthly"; label: string }[] = [
    { key: "hourly", label: "Hourly" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  const chartSegments: { key: "bar" | "area" | "line"; label: string }[] = [
    { key: "bar", label: "Bar" },
    { key: "area", label: "Area" },
    { key: "line", label: "Line" },
  ];

  const dataMap = { hourly: HOURLY_DATA, weekly: WEEKLY_DATA, monthly: MONTHLY_DATA };
  const keyMap = { hourly: "hour", weekly: "day", monthly: "month" };
  const data = dataMap[timeSeg];
  const xKey = keyMap[timeSeg];

  return (
    <Card className="glass rounded-2xl p-5 h-[360px] flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 border-b border-white/5 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Incident Frequency Dynamics</h3>
          <p className="text-[11px] text-slate-500">Segmented multi-period analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Segment */}
          <div className="flex rounded-full overflow-hidden p-0.5 gap-0.5 bg-white/5 border border-white/10">
            {chartSegments.map((s) => (
              <HoverTooltip key={s.key} tip={`View as ${s.label} Chart`}>
                <button
                  onClick={() => setChartType(s.key)}
                  className="px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor: chartType === s.key ? "#3B82F6" : "transparent",
                    color: chartType === s.key ? "#fff" : "#94A3B8",
                  }}
                >
                  {s.label}
                </button>
              </HoverTooltip>
            ))}
          </div>

          {/* Time Segment */}
          <div className="flex rounded-full overflow-hidden p-0.5 gap-0.5 bg-white/5 border border-white/10">
            {timeSegments.map((s) => (
              <HoverTooltip key={s.key} tip={`Show ${s.label} trend`}>
                <button
                  onClick={() => setTimeSeg(s.key)}
                  className="px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor: timeSeg === s.key ? "rgba(59,130,246,0.3)" : "transparent",
                    color: timeSeg === s.key ? "#60A5FA" : "#94A3B8",
                  }}
                >
                  {s.label}
                </button>
              </HoverTooltip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} barSize={timeSeg === "hourly" ? 6 : 20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#64748B" }} interval={timeSeg === "hourly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#64748B" }} interval={timeSeg === "hourly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }} />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="url(#areaGrad)" strokeWidth={2.5} />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#64748B" }} interval={timeSeg === "hourly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke="#60A5FA" strokeWidth={3} dot={{ r: 3, fill: "#3B82F6" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const AHMEDABAD_WARD_LOCATIONS: Record<string, { lat: number; lon: number; level: string; score: number }> = {
  Satellite: { lat: 23.0270, lon: 72.5220, level: "HIGH", score: 78 },
  Naranpura: { lat: 23.0600, lon: 72.5450, level: "ELEVATED", score: 65 },
  Maninagar: { lat: 22.9980, lon: 72.6050, level: "HIGH", score: 82 },
  Ghatlodia: { lat: 23.0700, lon: 72.5350, level: "MEDIUM", score: 45 },
  Bodakdev: { lat: 23.0380, lon: 72.5120, level: "LOW", score: 30 },
  Chandkheda: { lat: 23.1120, lon: 72.5850, level: "ELEVATED", score: 55 },
  Naroda: { lat: 23.0680, lon: 72.6500, level: "HIGH", score: 70 },
  Vastrapur: { lat: 23.0350, lon: 72.5280, level: "MEDIUM", score: 40 },
  Nikol: { lat: 23.0450, lon: 72.6650, level: "ELEVATED", score: 60 },
  Paldi: { lat: 23.0120, lon: 72.5620, level: "LOW", score: 35 },
  Navrangpura: { lat: 23.0360, lon: 72.5610, level: "MEDIUM", score: 50 },
  Sabarmati: { lat: 23.0850, lon: 72.5800, level: "MEDIUM", score: 48 },
  Isanpur: { lat: 22.9750, lon: 72.5920, level: "HIGH", score: 72 },
  Vatva: { lat: 22.9550, lon: 72.6200, level: "ELEVATED", score: 62 },
};

const CCTV_LOCATIONS = [
  { id: "CCTV-SAT-007", name: "Satellite Crossing", lat: 23.0280, lon: 72.5230, alert: "Crowd density (143 persons)" },
  { id: "CCTV-NAR-012", name: "Naranpura Junction", lat: 23.0610, lon: 72.5460, alert: "Loitering detected" },
  { id: "CCTV-MAN-003", name: "Maninagar Railway Stn", lat: 22.9990, lon: 72.6060, alert: "Suspicious vehicle" },
  { id: "CCTV-BOD-019", name: "SG Highway Bodakdev", lat: 23.0390, lon: 72.5130, alert: "Traffic congestion" },
];

function createGoogleTeardropPin(
  color: string,
  innerHtml: string = "",
  size: [number, number] = [32, 42]
) {
  return `<div style="
    position: relative;
    width: ${size[0]}px;
    height: ${size[1]}px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.5));
    transition: transform 0.15s ease;
  ">
    <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="15" r="7.5" fill="#FFFFFF"/>
    </svg>
    <div style="
      position: absolute;
      top: 5px;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: #0F172A;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      ${innerHtml}
    </div>
  </div>`;
}

function RealAhmedabadOpenStreetMap({
  cases = MOCK_CASES,
  selectedWard,
  onSelectCase,
  showWards = true,
  showPatrols = true,
  showCCTV = true,
  showHeatmap: initialHeatmap = false,
  activeRoute,
  selectedUnit,
  height = "100%",
  className = "",
  onSelectAltPath,
  activeAltPathIndex = 0,
}: {
  cases?: Case[];
  selectedWard?: string | null;
  onSelectCase?: (c: Case) => void;
  showWards?: boolean;
  showPatrols?: boolean;
  showCCTV?: boolean;
  showHeatmap?: boolean;
  activeRoute?: PatrolRouteFull | null;
  selectedUnit?: PatrolUnitFull | null;
  height?: string;
  className?: string;
  onSelectAltPath?: (idx: number) => void;
  activeAltPathIndex?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<"google" | "satellite" | "dark" | "osm">("google");
  const [isPredictiveMode, setIsPredictiveMode] = useState(initialHeatmap);
  const [internalAltIndex, setInternalAltIndex] = useState(activeAltPathIndex);
  const [showLegend, setShowLegend] = useState(false);

  const currentAltIndex = onSelectAltPath !== undefined ? activeAltPathIndex : internalAltIndex;

  const handleAltSwitch = (idx: number) => {
    setInternalAltIndex(idx);
    if (onSelectAltPath) {
      onSelectAltPath(idx);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [23.0225, 72.5714], // Ahmedabad City Center
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const initialTile = L.tileLayer(
      mapStyle === "google"
        ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        : mapStyle === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : mapStyle === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://maps.google.com">Google Maps</a> &copy; OpenStreetMap',
        maxZoom: 20,
      }
    ).addTo(map);

    tileLayerRef.current = initialTile;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const url =
      mapStyle === "google"
        ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        : mapStyle === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : mapStyle === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current.setUrl(url);
  }, [mapStyle]);

  // Determine current active route data
  const effectiveRoute = useMemo(() => {
    if (activeRoute) return activeRoute;
    if (selectedUnit) {
      return MOCK_PATROL_ROUTES.find((r) => r.id === selectedUnit.route_id) || MOCK_PATROL_ROUTES[0];
    }
    return null;
  }, [activeRoute, selectedUnit]);

  // Fit bounds helper to frame route overview
  const fitRouteOverview = useCallback(() => {
    if (!mapRef.current || !effectiveRoute) return;
    const pts: [number, number][] = [];
    if (selectedUnit) {
      pts.push([selectedUnit.lat, selectedUnit.lon]);
    }
    effectiveRoute.checkpoints.forEach((cp) => pts.push([cp.lat, cp.lon]));
    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      mapRef.current.fitBounds(bounds, { padding: [55, 55], maxZoom: 15, animate: true });
    }
  }, [effectiveRoute, selectedUnit]);

  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Ward risk centers
    if (showWards) {
      Object.entries(AHMEDABAD_WARD_LOCATIONS).forEach(([name, data]) => {
        const color =
          data.level === "HIGH"
            ? "#EA4335" // Google Red
            : data.level === "ELEVATED"
            ? "#FBBC04" // Google Yellow
            : data.level === "MEDIUM"
            ? "#F97316"
            : "#34A853"; // Google Green

        const customIcon = L.divIcon({
          className: "custom-leaflet-ward-dot",
          html: `<div style="
            width: 28px;
            height: 28px;
            background-color: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, sans-serif;
            cursor: pointer;
          ">
            ${data.score}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([data.lat, data.lon], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; padding: 4px; color: #0f172a; min-width: 160px;">
            <div style="font-weight: 700; font-size: 13px; color: #1e293b;">📍 ${name} Ward</div>
            <div style="font-size: 11px; margin-top: 4px;">Risk Score: <strong style="color:${color}">${data.score}/100 (${data.level})</strong></div>
            <div style="font-size: 10px; color: #64748B; margin-top: 3px;">Ahmedabad Police Precinct</div>
          </div>
        `);

        layerGroup.addLayer(marker);
      });
    }

    // 2. Incident Cases (Google Maps Teardrop Pins: Red=High, Yellow=Medium, Green=Low)
    cases.forEach((c) => {
      if (!c.crime_lat || !c.crime_lon) return;

      const pinColor =
        c.crime_type === "Assault" || c.crime_type === "Robbery"
          ? "#EA4335" // Google Red
          : c.crime_type === "Theft" || c.crime_type === "Cyber Crime"
          ? "#FBBC04" // Google Yellow
          : "#34A853"; // Google Green

      const pinIcon = L.divIcon({
        className: "custom-gmap-case-pin",
        html: createGoogleTeardropPin(pinColor, pinColor === "#EA4335" ? "!" : "•"),
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([c.crime_lat, c.crime_lon], { icon: pinIcon });

      marker.bindPopup(`
        <div style="font-family: 'Google Sans', Roboto, sans-serif; min-width: 180px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; color: #1a73e8;">${c.fir_no}</div>
          <div style="font-size: 12px; font-weight: 600; margin-top: 2px; color: ${pinColor};">${c.crime_type}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 3px;">📍 ${c.crime_location}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Victim: ${c.victim_name}</div>
        </div>
      `);

      if (onSelectCase) {
        marker.on("click", () => onSelectCase(c));
      }

      layerGroup.addLayer(marker);
    });

    // 3. Patrol Fleet (Google Maps Teardrop Pins: Green=Deployed, Red=Responding, Gray=Idle)
    if (showPatrols) {
      MOCK_PATROL.forEach((unit) => {
        const isCurrentSelected = selectedUnit?.id === unit.id;
        const color =
          unit.status === "active"
            ? "#34A853" // Google Green
            : unit.status === "responding"
            ? "#EA4335" // Google Red
            : "#5F6368"; // Slate

        const customIcon = L.divIcon({
          className: "custom-gmap-patrol-pin",
          html: createGoogleTeardropPin(color, "🚓", isCurrentSelected ? [36, 46] : [32, 42]),
          iconSize: isCurrentSelected ? [36, 46] : [32, 42],
          iconAnchor: isCurrentSelected ? [18, 46] : [16, 42],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([unit.lat, unit.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; color: #0f172a; padding: 2px;">
            <div style="font-weight: 700; font-size: 12px; color: #1a73e8;">🚓 ${unit.name} Patrol Unit</div>
            <div style="font-size: 11px; color: ${color}; font-weight: bold; text-transform: uppercase; margin-top: 3px;">Status: ${unit.status}</div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 4. CCTV Cameras (Google Maps Teardrop Pins: Cyan with camera icon)
    if (showCCTV) {
      CCTV_LOCATIONS.forEach((cam) => {
        const customIcon = L.divIcon({
          className: "custom-gmap-cctv-pin",
          html: createGoogleTeardropPin("#06B6D4", "📹"),
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([cam.lat, cam.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; color: #0f172a; padding: 2px;">
            <div style="font-weight: 700; font-size: 12px; color: #0284c7;">📹 ${cam.id}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">${cam.name}</div>
            <div style="font-size: 10px; color: #dc2626; margin-top: 3px; font-weight: 600;">⚠️ ${cam.alert}</div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 5. Render Patrol Route Corridor (Primary + 2 Alternative Paths)
    if (effectiveRoute) {
      const checkpoints = effectiveRoute.checkpoints;
      const startPoint: [number, number] = selectedUnit
        ? [selectedUnit.lat, selectedUnit.lon]
        : [checkpoints[0].lat, checkpoints[0].lon];

      const primaryCoords: [number, number][] = [
        startPoint,
        ...checkpoints.map((cp) => [cp.lat, cp.lon] as [number, number]),
      ];

      // Calculate Alternative Route 1 (Detour via Highway / Outer Corridor)
      const alt1Coords: [number, number][] = primaryCoords.map((pt, i) => {
        if (i === 0 || i === primaryCoords.length - 1) return pt;
        return [pt[0] + 0.0055, pt[1] - 0.0075];
      });

      // Calculate Alternative Route 2 (Detour via Ring Road / Service Loop)
      const alt2Coords: [number, number][] = primaryCoords.map((pt, i) => {
        if (i === 0 || i === primaryCoords.length - 1) return pt;
        return [pt[0] - 0.0045, pt[1] + 0.0065];
      });

      const alt1Tag = `Alt 1: +3 mins (${(effectiveRoute.distance_km + 0.8).toFixed(1)} km)`;
      const alt2Tag = `Alt 2: +5 mins (${(effectiveRoute.distance_km + 1.4).toFixed(1)} km)`;

      // Render Checkpoint Waypoint Pins (Google Maps Teardrop Pins: Blue=Pending, Green=Cleared, Red=Destination)
      checkpoints.forEach((cp, idx) => {
        const isDone = cp.done;
        const isFinal = idx === checkpoints.length - 1;
        const pinColor = isFinal ? "#EA4335" : isDone ? "#34A853" : "#1A73E8";
        const label = isFinal ? "🏁" : isDone ? "✓" : `${idx + 1}`;

        const cpIcon = L.divIcon({
          className: "custom-gmap-cp-pin",
          html: createGoogleTeardropPin(pinColor, label, [30, 40]),
          iconSize: [30, 40],
          iconAnchor: [15, 40],
          popupAnchor: [0, -36],
        });

        const cpMarker = L.marker([cp.lat, cp.lon], { icon: cpIcon });
        cpMarker.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; color: #0f172a; padding: 3px;">
            <div style="font-weight: 800; font-size: 12px; color: ${pinColor};">
              ${isFinal ? "🏁 FINAL DESTINATION" : `📍 CHECKPOINT #${idx + 1}`}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 2px;">${cp.name}</div>
            <div style="font-size: 11px; color: ${isDone ? "#16a34a" : "#2563eb"}; margin-top: 3px;">
              ${isDone ? `Cleared at ${cp.time}` : "Status: Patrol En Route"}
            </div>
          </div>
        `);
        layerGroup.addLayer(cpMarker);
      });

      // Render Alt Route 2 Path (Muted or Active)
      const isAlt2Active = currentAltIndex === 2;
      const alt2Polyline = L.polyline(alt2Coords, {
        color: isAlt2Active ? "#F59E0B" : "#64748B",
        weight: isAlt2Active ? 6 : 4,
        opacity: isAlt2Active ? 0.95 : 0.55,
        dashArray: isAlt2Active ? undefined : "6, 8",
        lineCap: "round",
        lineJoin: "round",
      });
      alt2Polyline.on("click", () => handleAltSwitch(2));
      layerGroup.addLayer(alt2Polyline);

      // Render Alt Route 1 Path (Muted or Active)
      const isAlt1Active = currentAltIndex === 1;
      const alt1Polyline = L.polyline(alt1Coords, {
        color: isAlt1Active ? "#06B6D4" : "#94A3B8",
        weight: isAlt1Active ? 6 : 4,
        opacity: isAlt1Active ? 0.95 : 0.65,
        dashArray: isAlt1Active ? undefined : "6, 8",
        lineCap: "round",
        lineJoin: "round",
      });
      alt1Polyline.on("click", () => handleAltSwitch(1));
      layerGroup.addLayer(alt1Polyline);

      // Render Primary Route Path (Highlighted)
      const isPrimaryActive = currentAltIndex === 0;
      if (isPrimaryActive) {
        // Outer Glow
        const primaryGlow = L.polyline(primaryCoords, {
          color: "#3B82F6",
          weight: 10,
          opacity: 0.35,
          lineCap: "round",
        });
        layerGroup.addLayer(primaryGlow);

        // Core Line
        const primaryCore = L.polyline(primaryCoords, {
          color: "#2563EB",
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        });
        primaryCore.on("click", () => handleAltSwitch(0));
        layerGroup.addLayer(primaryCore);

        // Directional Dashed Accent
        const primaryDash = L.polyline(primaryCoords, {
          color: "#FFFFFF",
          weight: 2,
          opacity: 0.8,
          dashArray: "8, 12",
        });
        layerGroup.addLayer(primaryDash);
      } else {
        const primaryMuted = L.polyline(primaryCoords, {
          color: "#475569",
          weight: 4,
          opacity: 0.5,
          dashArray: "6, 8",
          lineCap: "round",
        });
        primaryMuted.on("click", () => handleAltSwitch(0));
        layerGroup.addLayer(primaryMuted);
      }

      // Add Interactive Midpoint Route Travel Time & Distance Tags
      const midIdx = Math.floor(primaryCoords.length / 2);

      // Primary Tag
      const primaryMid = primaryCoords[midIdx];
      const primaryBadgeIcon = L.divIcon({
        className: "route-badge-primary",
        html: `<div style="
          background: ${isPrimaryActive ? "#1D4ED8" : "#334155"};
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
          font-family: system-ui, sans-serif;
          border: 1.5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          white-space: nowrap;
          cursor: pointer;
        ">⚡ Primary: ${effectiveRoute.est_time_mins}m (${effectiveRoute.distance_km}km)</div>`,
        iconAnchor: [40, 10],
      });
      const primaryTagMarker = L.marker(primaryMid, { icon: primaryBadgeIcon });
      primaryTagMarker.on("click", () => handleAltSwitch(0));
      layerGroup.addLayer(primaryTagMarker);

      // Alt 1 Tag
      const alt1Mid = alt1Coords[midIdx];
      const alt1BadgeIcon = L.divIcon({
        className: "route-badge-alt1",
        html: `<div style="
          background: ${isAlt1Active ? "#0891B2" : "rgba(15, 23, 42, 0.9)"};
          color: ${isAlt1Active ? "#FFFFFF" : "#CBD5E1"};
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          border: 1.5px solid ${isAlt1Active ? "#06B6D4" : "rgba(255,255,255,0.2)"};
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          white-space: nowrap;
          cursor: pointer;
        ">${alt1Tag}</div>`,
        iconAnchor: [40, 10],
      });
      const alt1TagMarker = L.marker(alt1Mid, { icon: alt1BadgeIcon });
      alt1TagMarker.on("click", () => handleAltSwitch(1));
      layerGroup.addLayer(alt1TagMarker);

      // Alt 2 Tag
      const alt2Mid = alt2Coords[midIdx];
      const alt2BadgeIcon = L.divIcon({
        className: "route-badge-alt2",
        html: `<div style="
          background: ${isAlt2Active ? "#D97706" : "rgba(15, 23, 42, 0.9)"};
          color: ${isAlt2Active ? "#FFFFFF" : "#CBD5E1"};
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          border: 1.5px solid ${isAlt2Active ? "#F59E0B" : "rgba(255,255,255,0.2)"};
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          white-space: nowrap;
          cursor: pointer;
        ">${alt2Tag}</div>`,
        iconAnchor: [40, 10],
      });
      const alt2TagMarker = L.marker(alt2Mid, { icon: alt2BadgeIcon });
      alt2TagMarker.on("click", () => handleAltSwitch(2));
      layerGroup.addLayer(alt2TagMarker);

      // Frame Route Overview automatically
      fitRouteOverview();
    }

    // Predictive Risk Heatmap Overlays
    if (isPredictiveMode) {
      PREDICTIVE_HEATMAP_ZONES.forEach((zone) => {
        const circle = L.circle([zone.lat, zone.lon], {
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: zone.intensity * 0.45,
          radius: zone.radius,
          weight: 2,
        });

        circle.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; padding: 6px; color: #0f172a; max-width: 200px;">
            <div style="font-weight: 800; font-size: 12px; color: ${zone.color}; display: flex; items-center: center; gap: 4px;">
              🔥 AI PREDICTIVE RISK ZONE
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #1e293b; margin-top: 2px;">${zone.name}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 4px;">Predicted Density: <strong>${Math.round(zone.intensity * 100)}% Risk Spike</strong></div>
            <div style="font-size: 10px; color: #64748B; margin-top: 4px; border-top: 1px solid #e2e8f0; pt: 3px;">
              ${zone.forecast}
            </div>
          </div>
        `);

        layerGroup.addLayer(circle);
      });
    }
  }, [
    cases,
    showWards,
    showPatrols,
    showCCTV,
    isPredictiveMode,
    effectiveRoute,
    selectedUnit,
    currentAltIndex,
    onSelectCase,
    fitRouteOverview,
  ]);

  useEffect(() => {
    if (!selectedWard || !mapRef.current) return;
    const loc = AHMEDABAD_WARD_LOCATIONS[selectedWard];
    if (loc) {
      mapRef.current.flyTo([loc.lat, loc.lon], 14, { duration: 1.2 });
    }
  }, [selectedWard]);

  return (
    <div className={cn("w-full relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F1621]", className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Tactical Overlay Bar for Route & Path Control */}
      {effectiveRoute && (
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 max-w-[280px] md:max-w-xs bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Active Patrol Corridor</div>
              <div className="text-xs font-bold text-slate-100 truncate max-w-[180px]">{effectiveRoute.name}</div>
            </div>
            <button
              onClick={fitRouteOverview}
              title="Fit Route Overview"
              className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Navigation size={12} /> Frame Overview
            </button>
          </div>

          {/* Alternative Route Switcher Pills */}
          <div className="flex flex-col gap-1">
            <div className="text-[9px] text-slate-400 font-semibold uppercase">Select Patrol Route Path:</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleAltSwitch(0)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 0
                    ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                ⚡ Primary ({effectiveRoute.est_time_mins}m)
              </button>
              <button
                onClick={() => handleAltSwitch(1)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 1
                    ? "bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Alt 1 (+3m)
              </button>
              <button
                onClick={() => handleAltSwitch(2)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 2
                    ? "bg-amber-600 text-white shadow-md ring-1 ring-amber-400"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Alt 2 (+5m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Right Controls: Tiles, Heatmap & Pin Legend */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setIsPredictiveMode(!isPredictiveMode)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              isPredictiveMode ? "bg-red-600 text-white shadow-lg animate-pulse" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            }`}
          >
            <span className="material-symbols-rounded text-xs">auto_graph</span>
            {isPredictiveMode ? "Heatmap ON" : "AI Heatmap"}
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              showLegend ? "bg-emerald-600 text-white shadow" : "bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            📍 Legend
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            onClick={() => setMapStyle("google")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
              mapStyle === "google" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Google Maps
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
              mapStyle === "satellite" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
              mapStyle === "dark" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Dark
          </button>
        </div>

        {/* Teardrop Pin Legend Drawer */}
        {showLegend && (
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-white/10 text-[10px] flex flex-col gap-1.5 animate-fadeIn mt-1">
            <div className="font-bold text-slate-200 border-b border-white/10 pb-1 flex items-center justify-between">
              <span>Google Maps Pin Legend</span>
              <span className="text-slate-500 text-[9px]">Precise GPS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" /> Red: High Risk / Emergency</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FBBC04]" /> Yellow: Medium Risk / Alert</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" /> Green: Active Patrol / Low</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8]" /> Blue: Checkpoints (#)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardGeographicMapCard({ onSelectCase }: { onSelectCase: (c: Case) => void }) {
  const [selectedCrime, setSelectedCrime] = useState<string>("All");

  const crimeTypes = ["All", "Theft", "Assault", "Robbery", "Cyber Crime", "Stalking"];

  const filteredCases = selectedCrime === "All"
    ? MOCK_CASES
    : MOCK_CASES.filter((c) => c.crime_type === selectedCrime);

  return (
    <Card className="rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <MapPin size={15} className="text-blue-400" /> OpenStreetMap Ahmedabad — Live Crimes
          </h3>
          <p className="text-[11px] text-slate-500">Real open source map of Ahmedabad with live case overlays</p>
        </div>

        {/* Crime Type Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {crimeTypes.map((type) => (
            <HoverTooltip key={type} tip={`View map pin locations for ${type}`}>
              <button
                onClick={() => setSelectedCrime(type)}
                className="px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer"
                style={{
                  backgroundColor: selectedCrime === type ? "#3B82F6" : "transparent",
                  color: selectedCrime === type ? "#ffffff" : "#94A3B8",
                }}
              >
                {type}
              </button>
            </HoverTooltip>
          ))}
        </div>
      </div>

      <RealAhmedabadOpenStreetMap
        cases={filteredCases}
        onSelectCase={onSelectCase}
        showWards={true}
        showPatrols={true}
        showCCTV={false}
        height="280px"
      />
    </Card>
  );
}

function DashboardPage() {
  const { wsMessages, navigate } = useApp();
  const [quickCase, setQuickCase] = useState<Case | null>(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Command Center"
        subtitle="Real-time overview — Ahmedabad City Police"
      />

      {/* Quick View Modal */}
      <QuickViewModal caseData={quickCase} onClose={() => setQuickCase(null)} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="New Cases" value={142} change={12} icon={FileText} color="#004B87" tooltip="Total new cases registered today across all police stations" />
        <StatCard title="Active Cases" value={MOCK_CASES.filter((c) => c.case_status === "registered" || c.case_status === "investigating").length} change={4} icon={Activity} color="#006B5E" tooltip="Cases currently under active investigation" />
        <StatCard title="Predictive Score" value="84/100" change={3} icon={Cpu} color="#8B5CF6" tooltip="AI predictive threat score index" />
        <StatCard title="High Risk Zone" value={Object.values(MOCK_WARDS).filter((w) => w.level === "HIGH").length} icon={TriangleAlert} color="#EF4444" tooltip="Wards with high risk score — requiring immediate attention" />
        <StatCard title="Open Cases" value={MOCK_CASES.filter((c) => c.case_status !== "closed" && c.case_status !== "chargesheeted").length} change={-5} icon={Clock} color="#D97300" tooltip="Cases awaiting final disposition" />
        <StatCard title="Closed Cases" value={MOCK_CASES.filter((c) => c.case_status === "closed" || c.case_status === "chargesheeted").length} change={18} icon={CheckCircle} color="#006B5E" tooltip="Successfully resolved or chargesheeted cases" />
      </div>

      {/* Row 2: Separated Recent Notifications & Quick Actions Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Notifications Card */}
        <div className="glass p-5 rounded-2xl animate-fade-in-up flex flex-col justify-between h-[280px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="type-title font-bold text-slate-200">Recent Notifications</span>
            <span className="text-[11px] text-slate-400 font-medium">{wsMessages.length} received</span>
          </div>
          <div className="quick-notif-list flex-1 overflow-y-auto mt-2">
            {wsMessages.length === 0 ? (
              <div className="type-body quick-empty text-slate-500 py-6 text-center text-xs">No notifications yet.</div>
            ) : (
              <div className="flex flex-col gap-2 pr-1">
                {wsMessages.slice(0, 6).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: WS_COLOR[m.type] || "#3B82F6" }} />
                    <span className="truncate flex-1 text-slate-200 font-medium">{m.payload}</span>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(m.ts)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="glass p-5 rounded-2xl animate-fade-in-up flex flex-col justify-between h-[280px]">
          <div className="border-b border-white/5 pb-2 flex items-center justify-between">
            <span className="type-title font-bold text-slate-200">Quick Actions</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 pt-3">
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-all cursor-pointer group shadow-inner"
              onClick={() => navigate("fir-entry")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-teal-400" style={{ fontSize: "30px" }}>add_circle</span>
              <span className="font-semibold text-xs text-slate-200 group-hover:text-white">New FIR</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-all cursor-pointer group shadow-inner"
              onClick={() => navigate("patrol")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-teal-400" style={{ fontSize: "30px" }}>local_police</span>
              <span className="font-semibold text-xs text-slate-200 group-hover:text-white">Patrol Units</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-all cursor-pointer group shadow-inner"
              onClick={() => navigate("assistant")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-teal-400" style={{ fontSize: "30px" }}>smart_toy</span>
              <span className="font-semibold text-xs text-slate-200 group-hover:text-white">AI Assistant</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-all cursor-pointer group shadow-inner"
              onClick={() => navigate("documents")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-teal-400" style={{ fontSize: "30px" }}>description</span>
              <span className="font-semibold text-xs text-slate-200 group-hover:text-white">Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Chart & Ward Hotspot Map Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[360px] flex flex-col">
          <SegmentedChartCard />
        </div>

        {/* Ward Hotspot Map Widget */}
        <div className="map-widget glass h-[360px] flex flex-col justify-between p-5 rounded-2xl">
          <div className="map-widget-header flex items-center justify-between pb-2 border-b border-white/5">
            <span className="type-title">Ward Hotspot Map</span>
            <button className="map-refresh-btn" aria-label="Refresh map" onClick={() => setMapRefreshKey((k) => k + 1)}>
              <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>refresh</span>
            </button>
          </div>
          <div className="map-widget-body flex-1 relative mt-2 overflow-hidden rounded-xl">
            <RealAhmedabadOpenStreetMap
              key={mapRefreshKey}
              cases={MOCK_CASES}
              onSelectCase={(c) => setQuickCase(c)}
              showWards={true}
              showPatrols={true}
              showCCTV={false}
              height="100%"
            />
            <div className="map-legend glass absolute bottom-2 right-2 z-[400] px-2.5 py-1.5 rounded-lg text-[10px]">
              <div className="legend-row flex items-center gap-1.5"><span className="legend-dot w-2 h-2 rounded-full" style={{ background: "#EA4335" }}></span> High</div>
              <div className="legend-row flex items-center gap-1.5"><span className="legend-dot w-2 h-2 rounded-full" style={{ background: "#FBBC04" }}></span> Medium</div>
              <div className="legend-row flex items-center gap-1.5"><span className="legend-dot w-2 h-2 rounded-full" style={{ background: "#34A853" }}></span> Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Feed (Half Width) & Camera Alerts Card (Half Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Events Feed */}
        <Card className="glass animate-fade-in-up p-5 flex flex-col justify-between h-[380px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold" style={{ color: "#CBD5E1" }}>Live Events Feed</h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#22C55E" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              WebSocket Live
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 mt-2">
            {wsMessages.length === 0 ? (
              <p className="text-sm text-center py-12 text-slate-500">Awaiting events...</p>
            ) : (
              wsMessages.slice(0, 10).map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: WS_COLOR[m.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-medium">{m.payload}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(m.ts)} · {m.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Camera Alerts Panel */}
        <div className="glass animate-fade-in-up p-5 flex flex-col justify-between h-[380px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: "20px", color: "var(--color-error, #EF4444)" }}>videocam</span>
              <span className="type-title">Camera Alerts</span>
              <span className="camera-live-badge">● LIVE</span>
            </div>
            <button className="text-link-btn text-xs text-blue-400 font-medium" onClick={() => navigate("cctv")}>View all</button>
          </div>
          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 mt-2">
            <div className="cctv-alert-tile sev-high">
              <div className="cctv-alert-left">
                <span className="cctv-sev-dot sev-dot-high"></span>
                <div className="cctv-alert-body">
                  <div className="cctv-alert-camera">CAM-04 · CG Road Junction</div>
                  <div className="cctv-alert-msg">Suspicious loitering detected</div>
                  <div className="cctv-alert-meta"><span>SESSION/2026/041</span><span className="cctv-dot-sep">·</span><span>8m ago</span></div>
                </div>
              </div>
              <button className="cctv-view-btn" onClick={() => navigate("cctv")} title="Open CCTV View">
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>open_in_new</span>
              </button>
            </div>

            <div className="cctv-alert-tile sev-critical">
              <div className="cctv-alert-left">
                <span className="cctv-sev-dot sev-dot-critical"></span>
                <div className="cctv-alert-body">
                  <div className="cctv-alert-camera">CAM-11 · Railway Station Gate 2</div>
                  <div className="cctv-alert-msg">Unattended object flagged</div>
                  <div className="cctv-alert-meta"><span>SESSION/2026/039</span><span className="cctv-dot-sep">·</span><span>20m ago</span></div>
                </div>
              </div>
              <button className="cctv-view-btn" onClick={() => navigate("cctv")} title="Open CCTV View">
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>open_in_new</span>
              </button>
            </div>

            <div className="cctv-alert-tile sev-medium">
              <div className="cctv-alert-left">
                <span className="cctv-sev-dot sev-dot-medium"></span>
                <div className="cctv-alert-body">
                  <div className="cctv-alert-camera">CAM-07 · Maninagar Circle</div>
                  <div className="cctv-alert-msg">Crowd anomaly — density spike</div>
                  <div className="cctv-alert-meta"><span>SESSION/2026/036</span><span className="cctv-dot-sep">·</span><span>45m ago</span></div>
                </div>
              </div>
              <button className="cctv-view-btn" onClick={() => navigate("cctv")} title="Open CCTV View">
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>open_in_new</span>
              </button>
            </div>

            <div className="cctv-alert-tile sev-high">
              <div className="cctv-alert-left">
                <span className="cctv-sev-dot sev-dot-high"></span>
                <div className="cctv-alert-body">
                  <div className="cctv-alert-camera">CAM-02 · SG Highway Flyover</div>
                  <div className="cctv-alert-msg">Vehicle moving against traffic</div>
                  <div className="cctv-alert-meta"><span>SESSION/2026/033</span><span className="cctv-dot-sep">·</span><span>1h ago</span></div>
                </div>
              </div>
              <button className="cctv-view-btn" onClick={() => navigate("cctv")} title="Open CCTV View">
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>open_in_new</span>
              </button>
            </div>

            <div className="cctv-alert-tile sev-critical">
              <div className="cctv-alert-left">
                <span className="cctv-sev-dot sev-dot-critical"></span>
                <div className="cctv-alert-body">
                  <div className="cctv-alert-camera">CAM-15 · Navrangpura Market</div>
                  <div className="cctv-alert-msg">Face match — wanted list</div>
                  <div className="cctv-alert-meta"><span>SESSION/2026/029</span><span className="cctv-dot-sep">·</span><span>2h ago</span></div>
                </div>
              </div>
              <button className="cctv-view-btn" onClick={() => navigate("cctv")} title="Open CCTV View">
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>open_in_new</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-3xl p-5 flex flex-col justify-between h-[260px]">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#CBD5E1" }}>Crime Types Distribution</h3>
          <div className="flex gap-4 items-center flex-1">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={CRIME_TYPE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" strokeWidth={0}>
                  {CRIME_TYPE_DATA.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 justify-center flex-1">
              {CRIME_TYPE_DATA.map((d, i) => (
                <div key={d.type} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs flex-1" style={{ color: "#94A3B8" }}>{d.type}</span>
                  <span className="text-xs font-medium" style={{ color: "#CBD5E1" }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl p-5 flex flex-col justify-between h-[260px]">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#CBD5E1" }}>Monthly FIR Trend (2026)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="url(#blueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


// ─── Scenario Simulation Control Deck (Module 4) ────────────────────────────────

function ScenarioSimulationControlDeck() {
  const [activePreset, setActivePreset] = useState<"standard" | "festival" | "curfew" | "monsoon">("standard");
  const [patrolMultiplier, setPatrolMultiplier] = useState(1.5);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [autoReroute, setAutoReroute] = useState(true);

  const presets = [
    { id: "standard", label: "Standard Operations", icon: "shield", desc: "Default precinct patrol routes & CCTV surveillance" },
    { id: "festival", label: "Festival Surge Boost", icon: "celebration", desc: "Navratri/Diwali high-density crowd simulation (+45% patrol)" },
    { id: "curfew", label: "Night Curfew Saturation", icon: "bedtime", desc: "22:00 - 05:00 high-risk zone lockdown and static PCR posts" },
    { id: "monsoon", label: "Monsoon Flooding Reroute", icon: "rainy", desc: "Underpass waterlogging bypass routing & emergency response" },
  ];

  return (
    <Card className="rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              AI SPATIAL SIMULATOR
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-rounded text-amber-400">tune</span>
              Command Scenario Simulation Deck
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-world police operational scenarios, dynamic patrol density scaling, and predictive threat responses on OpenStreetMap.
          </p>
        </div>

        {/* Live Metrics Feedback */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Response Time</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">-3.8 mins</p>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Coverage Index</p>
            <p className="text-sm font-bold text-blue-400 font-mono">94.2%</p>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Simulated Units</p>
            <p className="text-sm font-bold text-amber-400 font-mono">{Math.round(18 * patrolMultiplier)} PCRs</p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActivePreset(p.id as any);
              if (p.id === "festival") { setPatrolMultiplier(2.2); setRiskThreshold(80); }
              else if (p.id === "curfew") { setPatrolMultiplier(1.8); setRiskThreshold(60); }
              else if (p.id === "monsoon") { setPatrolMultiplier(1.2); setRiskThreshold(75); }
              else { setPatrolMultiplier(1.5); setRiskThreshold(70); }
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePreset === p.id
                ? "bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10 text-slate-100"
                : "bg-white/5 border-white/5 hover:border-white/20 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="material-symbols-rounded text-lg text-amber-400">{p.icon}</span>
              {activePreset === p.id && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950">ACTIVE</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">{p.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{p.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Fine-Tuning Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-400">Patrol Multiplier:</span>
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.1}
            value={patrolMultiplier}
            onChange={(e) => setPatrolMultiplier(parseFloat(e.target.value))}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-400 font-bold">{patrolMultiplier.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-400">AI Sensitivity Threshold:</span>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-400 font-bold">{riskThreshold}% Risk</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoReroute}
            onChange={(e) => setAutoReroute(e.target.checked)}
            className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-slate-300">Auto-Reroute PCRs on Anomaly Hit</span>
        </label>
      </div>
    </Card>
  );
}

// ─── Map Page ─────────────────────────────────────────────────────────────────

function MapPage() {
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState(7);

  const wards = Object.entries(MOCK_WARDS);

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
      <div className="flex gap-4 flex-1 h-[650px]">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto flex flex-col gap-4 hidden lg:flex">
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#CBD5E1" }}>Ward Risk Scores</h3>
          </div>
          <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
            {wards.map(([name, data]) => {
              const conf = RISK_CONFIG[data.level];
              return (
                <button
                  key={name}
                  onClick={() => setSelectedWard(selectedWard === name ? null : name)}
                  className="w-full flex items-center justify-between px-4 py-2.5 transition-all text-left"
                  style={{ backgroundColor: selectedWard === name ? "rgba(59,130,246,0.08)" : "transparent" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.dot }} />
                    <span className="text-sm" style={{ color: "#CBD5E1" }}>{name}</span>
                    {data.festival_flag && <span title="Festival active">🎉</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: conf.color }}>{data.risk_score}</span>
                    <Badge color={conf.color} bg={conf.bg}>{data.level}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#CBD5E1" }}>Filters</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#64748B" }}>Days: <span style={{ color: "#3B82F6" }}>{filterDays}</span></label>
              <input type="range" min={1} max={90} value={filterDays} onChange={(e) => setFilterDays(+e.target.value)} className="w-full" style={{ accentColor: "#3B82F6" }} />
            </div>
            <Select label="Crime Type" value="" onChange={() => {}} options={[{ value: "", label: "All Types" }, ...["Theft","Assault","Robbery","Cyber Crime","Stalking","Murder"].map((t) => ({ value: t, label: t }))]} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#CBD5E1" }}>Patrol Units</h3>
          <div className="flex flex-col gap-2">
            {MOCK_PATROL.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2">
                  <Car size={14} style={{ color: unit.status === "active" ? "#22C55E" : unit.status === "responding" ? "#EF4444" : "#64748B" }} />
                  <span className="text-sm font-medium" style={{ color: "#CBD5E1" }}>{unit.name}</span>
                </div>
                <Badge
                  color={unit.status === "active" ? "#22C55E" : unit.status === "responding" ? "#EF4444" : "#64748B"}
                >
                  {unit.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold" style={{ color: "#CBD5E1" }}>CCTV Alerts</h3>
            <Badge color="#F97316">{MOCK_CCTV_ALERTS.length}</Badge>
          </div>
          <p className="text-xs" style={{ color: "#64748B" }}>Active camera alerts in the last 24 hours</p>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden relative border border-white/10" style={{ backgroundColor: "#0F1621" }}>
        <RealAhmedabadOpenStreetMap
          cases={MOCK_CASES}
          selectedWard={selectedWard}
          showWards={true}
          showPatrols={true}
          showCCTV={true}
          height="100%"
        />
      </div>
      </div>

      {/* Module 4 Scenario Simulation Control Deck (At Bottom of Page) */}
      <ScenarioSimulationControlDeck />
    </div>
  );
}

// ─── Cases Page ───────────────────────────────────────────────────────────────

function CasesPage() {
  const { navigate, officer } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crimeFilter, setCrimeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [quickCase, setQuickCase] = useState<Case | null>(null);

  const crimeTypes = Array.from(new Set(MOCK_CASES.map((c) => c.crime_type)));

  const filtered = MOCK_CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !search || c.fir_no.toLowerCase().includes(q) || c.victim_name.toLowerCase().includes(q) || c.crime_type.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || c.case_status === statusFilter;
    const matchC = crimeFilter === "all" || c.crime_type === crimeFilter;
    return matchQ && matchS && matchC;
  });

  function exportCSV() {
    const header = ["FIR No", "Victim", "Crime Type", "Date", "Status", "IO", "Location"];
    const rows = filtered.map((c) => [c.fir_no, c.victim_name, c.crime_type, formatDate(c.crime_date), c.case_status, c.io_badge || "", c.crime_location]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cases_export.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (officer?.role === "constable") {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Lock size={32} color="#64748B" />
        <p className="mt-3 text-sm" style={{ color: "#64748B" }}>You do not have access to case management</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="FIR Directory"
        subtitle={`${filtered.length} cases found`}
        action={
          <div className="flex items-center gap-2">
            <HoverTooltip tip="Export as CSV">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium" style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                <FileDown size={13} /> CSV
              </button>
            </HoverTooltip>
            <Button onClick={() => navigate("fir-entry")} size="sm">
              <Plus size={14} /> New FIR
            </Button>
          </div>
        }
      />

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0 relative">
          <Search size={14} color="#64748B" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by FIR, victim, crime type..."
            className="w-full rounded-2xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
          />
        </div>

        {/* Advanced filters toggle */}
        <HoverTooltip tip="Advanced filters">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: showFilters ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
              color: showFilters ? "#3B82F6" : "#CBD5E1",
              border: showFilters ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <SlidersHorizontal size={15} /> Advanced Filters
          </button>
        </HoverTooltip>

        {/* View option toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <HoverTooltip tip="List view">
            <button
              onClick={() => setViewMode("list")}
              className="p-2.5 transition-all cursor-pointer"
              style={{ backgroundColor: viewMode === "list" ? "#3B82F6" : "transparent", color: viewMode === "list" ? "#fff" : "#64748B" }}
            >
              <List size={15} />
            </button>
          </HoverTooltip>
          <HoverTooltip tip="Grid view">
            <button
              onClick={() => setViewMode("grid")}
              className="p-2.5 transition-all cursor-pointer"
              style={{ backgroundColor: viewMode === "grid" ? "#3B82F6" : "transparent", color: viewMode === "grid" ? "#fff" : "#64748B" }}
            >
              <LayoutGrid size={15} />
            </button>
          </HoverTooltip>
        </div>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <Card style={{ borderRadius: 20 }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Status Filter:</span>
              <div className="flex gap-1 flex-wrap">
                {["all", "open", "arrested", "chargesheeted", "closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize cursor-pointer"
                    style={{
                      backgroundColor: statusFilter === s ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: statusFilter === s ? "#60A5FA" : "#64748B",
                      border: statusFilter === s ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap border-t border-white/5 pt-3">
              <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Crime Type:</span>
              <div className="flex gap-1 flex-wrap">
                {["all", ...crimeTypes].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCrimeFilter(t)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize cursor-pointer"
                    style={{
                      backgroundColor: crimeFilter === t ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: crimeFilter === t ? "#A78BFA" : "#64748B",
                      border: crimeFilter === t ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                    }}
                  >
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <Card className="!p-0 overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["FIR No", "Victim", "Accused", "Crime Type", "Date", "Status", "IO", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sc = STATUS_CONFIG[c.case_status];
                  return (
                    <tr
                      key={c.case_id}
                      className="border-b transition-all cursor-pointer hover:bg-white/[0.02]"
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}
                      onClick={() => navigate("case-detail", { case_id: c.case_id })}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: "#60A5FA", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#CBD5E1" }}>{c.victim_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94A3B8" }}>{c.accused_name || "—"}</td>
                      <td className="px-4 py-3"><Badge color="#3B82F6">{c.crime_type}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{formatDate(c.crime_date)}</td>
                      <td className="px-4 py-3"><Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{c.io_badge || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <HoverTooltip tip="Quick view">
                            <button
                              className="p-1.5 rounded-xl transition-all"
                              style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA" }}
                              onClick={(e) => { e.stopPropagation(); setQuickCase(c); }}
                            >
                              <ZoomIn size={13} />
                            </button>
                          </HoverTooltip>
                          <HoverTooltip tip="Open detail">
                            <button
                              className="p-1.5 rounded-xl transition-all"
                              style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
                              onClick={(e) => { e.stopPropagation(); navigate("case-detail", { case_id: c.case_id }); }}
                            >
                              <Eye size={13} />
                            </button>
                          </HoverTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: "#64748B" }}>
                <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No cases match your filters</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const sc = STATUS_CONFIG[c.case_status];
            return (
              <Card
                key={c.case_id}
                className="flex flex-col gap-3 cursor-pointer transition-all hover:border-blue-500/30"
                style={{ borderRadius: 20 }}
                onClick={() => navigate("case-detail", { case_id: c.case_id })}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-bold" style={{ color: "#60A5FA", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</span>
                  <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{c.victim_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{c.crime_location}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="#3B82F6">{c.crime_type}</Badge>
                  <span className="text-xs" style={{ color: "#64748B" }}>{formatDate(c.crime_date)}</span>
                </div>
                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs" style={{ color: "#64748B" }}>{c.io_badge || "Unassigned"}</span>
                  <button
                    className="p-1.5 rounded-xl"
                    style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA" }}
                    onClick={(e) => { e.stopPropagation(); setQuickCase(c); }}
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: "#64748B" }}>
              <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No cases match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Quick View Modal */}
      {quickCase && (
        <Modal open={!!quickCase} onClose={() => setQuickCase(null)} title={`Quick View — ${quickCase.fir_no}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge color={STATUS_CONFIG[quickCase.case_status].color} bg={STATUS_CONFIG[quickCase.case_status].bg}>{STATUS_CONFIG[quickCase.case_status].label}</Badge>
            <Badge color="#3B82F6">{quickCase.crime_type}</Badge>
            <span className="text-xs" style={{ color: "#64748B" }}>{formatDate(quickCase.crime_date)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Victim", value: quickCase.victim_name },
              { label: "Age", value: quickCase.victim_age ? `${quickCase.victim_age} years` : "—" },
              { label: "Phone", value: quickCase.victim_phone || "—" },
              { label: "Injury", value: quickCase.victim_injury ? "Yes" : "No" },
              { label: "Location", value: quickCase.crime_location },
              { label: "Accused", value: quickCase.accused_name || "Unknown" },
              { label: "IO", value: quickCase.io_name || "—" },
              { label: "Badge", value: quickCase.io_badge || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>{label}</p>
                <p style={{ color: label === "Injury" && quickCase.victim_injury ? "#EF4444" : "#CBD5E1" }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <p className="text-xs mb-1" style={{ color: "#64748B" }}>Narrative</p>
            <p className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>{quickCase.crime_narrative}</p>
          </div>
          <button
            onClick={() => { navigate("case-detail", { case_id: quickCase.case_id }); setQuickCase(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium w-full justify-center"
            style={{ backgroundColor: "#3B82F6", color: "#fff" }}
          >
            <ExternalLink size={14} /> Open Full Detail
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─── Case Detail Page ─────────────────────────────────────────────────────────

function CaseDetailPage() {
  const { params, navigate } = useApp();
  const c = MOCK_CASES.find((x) => x.case_id === params.case_id);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [docType, setDocType] = useState("chargesheet");
  const [docLang, setDocLang] = useState("en");

  // Module 2 State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState("note");
  const [newNote, setNewNote] = useState("");
  const [evidenceTag, setEvidenceTag] = useState("");
  const [localEntries, setLocalEntries] = useState([
    {
      step: 1,
      title: "Initial Complaint Filed",
      ts: "2026-10-14T22:30:00Z",
      officer: "IO Amit Patel (BADGE #IO042)",
      status: "completed",
      description: "Received oral narrative from victim near Satellite PS.",
      attachments: ["COMPLAINT-NARRATIVE-01.txt"],
    },
    {
      step: 2,
      title: "FIR Formally Registered",
      ts: "2026-10-14T22:50:00Z",
      officer: "SHO Priya Mehta (BADGE #SHO01)",
      status: "completed",
      description: "Registered FIR under BNS Sections 309(2) and 117(2).",
      attachments: ["FIR-2026-SAT-0089.pdf"],
    },
    {
      step: 3,
      title: "Physical Evidence & Weapon Seized",
      ts: "2026-10-15T01:15:00Z",
      officer: "IO Amit Patel (BADGE #IO042)",
      status: "completed",
      description: "Seized iron rod with bloodstain tags and 22K gold chain fragments.",
      attachments: ["EVID-IRON-ROD-01.jpg", "SEIZURE-MEMO-44.pdf"],
    },
    {
      step: 4,
      title: "Witness Interrogated",
      ts: "2026-10-15T04:30:00Z",
      officer: "IO Amit Patel (BADGE #IO042)",
      status: "completed",
      description: "Interrogated Panch witness Suresh Patel; statement recorded.",
      attachments: ["WITNESS-STATEMENT-SP.wav"],
    },
    {
      step: 5,
      title: "Suspect Arrested & Panchanama",
      ts: "2026-10-15T09:00:00Z",
      officer: "IO Amit Patel (BADGE #IO042)",
      status: "in_progress",
      description: "Suspect apprehend near SG Highway; spot panchanama executed.",
      attachments: ["ARREST-PANCHANAMA-02.pdf"],
    },
  ]);

  if (!c) return <div className="text-center py-20" style={{ color: "#64748B" }}>Case not found</div>;

  const sc = STATUS_CONFIG[c.case_status];

  function askAI() {
    if (!aiQuestion) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiAnswer(`Based on the case FIR ${c.fir_no}: The crime was reported at ${c.crime_location} on ${formatDate(c.crime_date)}. The applicable sections are ${[...(c.bns_sections || []), ...(c.bnss_sections || [])].join(", ")}. The investigation is ongoing with ${c.diary_entries?.length || 0} diary entries recorded.`);
      setAiLoading(false);
    }, 1200);
  }

  const handleAddDiaryEntry = () => {
    if (!newNote) return;
    const newStep = {
      step: localEntries.length + 1,
      title: `Quick Log: ${newEntryType.toUpperCase()}`,
      ts: new Date().toISOString(),
      officer: "IO Amit Patel (BADGE #IO042)",
      status: "completed",
      description: newNote,
      attachments: evidenceTag ? [evidenceTag] : [],
    };
    setLocalEntries([...localEntries, newStep]);
    setNewNote("");
    setEvidenceTag("");
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back + breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("cases")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium transition-all cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft size={14} /> Back to Cases
          </button>
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight size={14} color="#64748B" />
            <span style={{ color: "#64748B" }}>{c.fir_no}</span>
          </div>
        </div>

        {/* Quick Log Action Trigger Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-rounded text-base">edit_calendar</span>
          Quick-Log Case Diary
        </button>
      </div>

      {/* Header strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: "#F1F5F9", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</h1>
        <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
        <Badge color="#3B82F6">{c.crime_type}</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Left */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#CBD5E1" }}>
                <User size={14} color="#3B82F6" /> Victim Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Name", value: c.victim_name },
                  { label: "Age", value: c.victim_age ? `${c.victim_age} years` : "—" },
                  { label: "Gender", value: c.victim_gender || "—" },
                  { label: "Phone", value: c.victim_phone || "—" },
                  { label: "Address", value: c.victim_address },
                  { label: "Injury", value: c.victim_injury ? "Yes" : "No" },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>{field.label}</p>
                    <p style={{ color: field.label === "Injury" && c.victim_injury ? "#EF4444" : "#CBD5E1" }}>{field.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Right */}
          <div className="flex flex-col h-full">
            {/* Chat With Me */}
            <Card className="flex-1 flex flex-col h-full min-h-[220px]">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 shrink-0" style={{ color: "#CBD5E1" }}>
                <Bot size={14} color="#3B82F6" /> Chat With Me
              </h3>
              
              <div className="flex-1 overflow-y-auto mb-3 flex flex-col justify-end">
                {aiAnswer && (
                  <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "#CBD5E1" }}>
                    {aiAnswer}
                  </div>
                )}
                {aiLoading && <div className="mt-2 h-3 w-full rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />}
              </div>

              <div className="flex flex-col gap-2 shrink-0 mt-auto">
                <div className="flex gap-2">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about this case..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                  />
                  <button onClick={askAI} className="p-2 rounded-lg cursor-pointer" style={{ backgroundColor: "#3B82F6" }}>
                    <Send size={14} color="#fff" />
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-500">
                  AI answers are for review only. Verify with official records.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#CBD5E1" }}>
                <MapPin size={14} color="#F97316" /> Crime Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Crime Type</p><p style={{ color: "#CBD5E1" }}>{c.crime_type}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Date & Time</p><p style={{ color: "#CBD5E1" }}>{formatDateTime(c.crime_date)}</p></div>
                <div className="col-span-2"><p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Location</p><p style={{ color: "#CBD5E1" }}>{c.crime_location}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Coordinates</p><p className="text-xs font-mono" style={{ color: "#94A3B8" }}>{c.crime_lat.toFixed(4)}, {c.crime_lon.toFixed(4)}</p></div>
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-1" style={{ color: "#64748B" }}>Narrative</p>
                <p className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>{c.crime_narrative}</p>
              </div>
            </Card>
          </div>

          <div>
            {/* Module 2: Interactive Case Diary Timeline */}
            <Card className="h-full flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 shrink-0">
                <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                  <span className="material-symbols-rounded text-lg">route</span>
                  Case Diary
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                  {localEntries.length} Investigation Milestones
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 flex-1 overflow-y-auto">
                {localEntries.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Step Marker Circle */}
                    <div className={`absolute -left-[30px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      item.status === "completed"
                        ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                        : "bg-blue-600 border-blue-400 text-white animate-pulse"
                    }`}>
                      {item.step}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-100">{item.title}</p>
                        <span className="text-[10px] font-mono text-slate-400">{formatDateTime(item.ts)}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Recorded by: <strong className="text-blue-300">{item.officer}</strong></span>
                        {item.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.attachments.map((att, aIdx) => (
                              <span key={aIdx} className="px-2 py-0.5 rounded bg-white/5 text-amber-300 font-mono text-[9px] border border-white/10 flex items-center gap-1">
                                <span className="material-symbols-rounded text-[10px]">attach_file</span>
                                {att}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Module 2: Quick-Log Action Drawer Modal */}
      {isDrawerOpen && (
        <Modal open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Quick-Log Case Diary Entry">
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Entry Category</label>
              <select
                value={newEntryType}
                onChange={(e) => setNewEntryType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
              >
                <option value="note">General Investigation Note</option>
                <option value="photo">Photo Evidence Tag</option>
                <option value="audio">Audio Interrogation Log</option>
                <option value="seizure">Property Seizure Record</option>
                <option value="arrest">Arrest & Panchanama Update</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Officer Investigation Notes</label>
                <VoiceInputWidget onTranscript={(txt) => setNewNote((prev) => prev + " " + txt)} />
              </div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                placeholder="Type or dictate official diary observation..."
                className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Attachment File / Evidence Tag</label>
              <input
                type="text"
                value={evidenceTag}
                onChange={(e) => setEvidenceTag(e.target.value)}
                placeholder="e.g. EVID-GOLD-RECOVERY-04.jpg"
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDiaryEntry}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
              >
                Append to Case Journey Tree
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── FIR Entry Page ───────────────────────────────────────────────────────────

function FIREntryPage() {
  const { navigate } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestedSections, setSuggestedSections] = useState<string[]>([]);

  const [form, setForm] = useState({
    victim_name: "", victim_address: "", victim_phone: "", victim_age: "",
    victim_gender: "Male", victim_injury: false,
    crime_type: "Theft", crime_code: "", crime_narrative: "",
    crime_date: "", crime_location: "", crime_lat: "23.0225", crime_lon: "72.5714",
    ward: "Satellite", severity: "3", language: "en",
    accused_name: "", accused_address: "", accused_age: "",
  });

  function update(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function suggestSections() {
    setTimeout(() => setSuggestedSections(["BNS 303", "BNS 304", "BNSS 173", "BNS 305"]), 800);
  }

  async function submit() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => navigate("cases"), 2000);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>FIR Registered Successfully</h2>
        <p className="text-sm" style={{ color: "#64748B" }}>FIR-2026-{String(MOCK_CASES.length + 1).padStart(3, "0")} · Redirecting to cases...</p>
      </div>
    );
  }

  const steps = ["Victim Details", "Crime Details", "Review & Submit"];

  const canProceed = step === 0
    ? !!form.victim_name && !!form.victim_address
    : step === 1
    ? !!form.crime_narrative && !!form.crime_date && !!form.crime_location
    : true;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <PageHeader title="Register New FIR" subtitle="Complete all sections to submit" />

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: i < step ? "#22C55E" : i === step ? "#3B82F6" : "rgba(255,255,255,0.08)",
                  color: i <= step ? "#fff" : "#64748B",
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <p className="text-[10px] mt-1 text-center" style={{ color: i === step ? "#3B82F6" : "#64748B" }}>{s}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 -mt-5" style={{ backgroundColor: i < step ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold" style={{ color: "#CBD5E1" }}>Victim Information</h3>
            <Input label="Full Name *" value={form.victim_name} onChange={(v) => update("victim_name", v)} placeholder="Victim's full name" />
            <Input label="Address *" value={form.victim_address} onChange={(v) => update("victim_address", v)} placeholder="Complete address" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={form.victim_phone} onChange={(v) => update("victim_phone", v)} placeholder="10-digit mobile" />
              <Input label="Age" value={form.victim_age} onChange={(v) => update("victim_age", v)} type="number" placeholder="Age in years" />
            </div>
            <Select label="Gender" value={form.victim_gender} onChange={(v) => update("victim_gender", v)}
              options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.victim_injury} onChange={(e) => update("victim_injury", e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "#EF4444" }} />
              <span className="text-sm" style={{ color: form.victim_injury ? "#EF4444" : "#CBD5E1" }}>
                Victim sustained injuries
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold" style={{ color: "#CBD5E1" }}>Crime Information</h3>
            <Select label="Crime Type *" value={form.crime_type} onChange={(v) => update("crime_type", v)}
              options={["Theft","Robbery","Snatching","Assault","Murder","Rape","Kidnapping","Cyber Crime","Drug Offense","Stalking","Extortion","Riot","Other"]
                .map((t) => ({ value: t, label: t }))} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium block" style={{ color: "#CBD5E1" }}>Narrative *</label>
                <VoiceInputWidget onTranscript={(txt) => update("crime_narrative", form.crime_narrative + " " + txt)} />
              </div>
              <textarea
                value={form.crime_narrative}
                onChange={(e) => update("crime_narrative", e.target.value)}
                rows={5}
                placeholder="Describe the crime incident in detail or use voice input..."
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
              />
              <Button onClick={suggestSections} variant="outlined" size="sm" className="mt-2">
                <Cpu size={13} /> Suggest Legal Sections
              </Button>
              {suggestedSections.length > 0 && (
                <div className="mt-2 p-3 rounded-lg flex flex-wrap gap-2" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {suggestedSections.map((s) => <Chip key={s} style={{ color: "#C4B5FD", borderColor: "rgba(139,92,246,0.3)" }}>{s}</Chip>)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#CBD5E1" }}>Crime Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.crime_date}
                  onChange={(e) => update("crime_date", e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
                />
              </div>
              <Input label="Crime Location *" value={form.crime_location} onChange={(v) => update("crime_location", v)} placeholder="Street, area, landmark" />
            </div>
            <Select label="Ward" value={form.ward} onChange={(v) => update("ward", v)}
              options={AHMEDABAD_WARDS.map((w) => ({ value: w, label: w }))} />
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: "#CBD5E1" }}>Severity *</label>
              <div className="flex gap-3">
                {[1,2,3,4,5].map((n) => (
                  <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                    <input type="radio" name="severity" value={String(n)} checked={form.severity === String(n)} onChange={() => update("severity", String(n))} style={{ accentColor: "#3B82F6" }} />
                    <span className="text-xs" style={{ color: form.severity === String(n) ? "#3B82F6" : "#64748B" }}>
                      {["Minor","Low","Medium","High","Critical"][n - 1]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Select label="Report Language" value={form.language} onChange={(v) => update("language", v)}
              options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "gu", label: "Gujarati" }]} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#CBD5E1" }}>Accused Details <span style={{ color: "#64748B", fontWeight: 400 }}>(If known)</span></h3>
              <div className="flex flex-col gap-3">
                <Input label="Accused Name" value={form.accused_name} onChange={(v) => update("accused_name", v)} placeholder="Full name if known" />
                <Input label="Accused Address" value={form.accused_address} onChange={(v) => update("accused_address", v)} placeholder="Last known address" />
                <Input label="Accused Age" value={form.accused_age} onChange={(v) => update("accused_age", v)} type="number" placeholder="Approximate age" />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#CBD5E1" }}>Review Summary</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Victim", value: form.victim_name },
                  { label: "Crime Type", value: form.crime_type },
                  { label: "Location", value: form.crime_location },
                  { label: "Ward", value: form.ward },
                  { label: "Severity", value: `${form.severity}/5` },
                  { label: "Language", value: { en: "English", hi: "Hindi", gu: "Gujarati" }[form.language] || form.language },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span style={{ color: "#64748B" }}>{row.label}</span>
                    <span style={{ color: "#CBD5E1" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {suggestedSections.length > 0 && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p className="text-xs mb-2" style={{ color: "#A78BFA" }}>Suggested Legal Sections</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSections.map((s) => <Chip key={s} style={{ color: "#C4B5FD", borderColor: "rgba(139,92,246,0.3)" }}>{s}</Chip>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate("cases")} size="md">
          <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed} size="md">
            Next <ChevronRight size={14} />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} size="md">
            {submitting ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle size={14} />}
            Submit FIR
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── AI Assistant Page ────────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "assistant"; content: string; source?: string; ts: string };

function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: input, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1400));

    const answers: Record<string, string> = {
      default: `Based on all cases in the system: I analyzed the available case data across all registered FIR records. The query relates to ${input.split(" ").slice(0, 4).join(" ")}... Based on case narratives and legal sections, relevant information points to active crime trends. For official disposition, please consult the IO and legal department.`,
    };

    const aiMsg: ChatMsg = {
      role: "assistant",
      content: answers.default,
      source: "LLM",
      ts: new Date().toISOString(),
    };
    setMessages((m) => [...m, aiMsg]);
    setLoading(false);
  }

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 hidden lg:flex">
        <div className="p-4 rounded-xl border flex flex-col gap-4" style={{ backgroundColor: "#161D2D", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="p-3.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Info size={14} className="inline mr-1.5 text-blue-400" />
            Querying across all {MOCK_CASES.length} FIR cases in the precinct database.
          </div>

          <div className="p-3.5 rounded-xl text-xs" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#FDE68A" }}>
            <TriangleAlert size={14} className="inline mr-1.5 text-amber-400" />
            AI answers are for officer review only. Always verify with official court records before legal action.
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden border" style={{ backgroundColor: "#161D2D", borderColor: "rgba(255,255,255,0.08)" }}>
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
            <Bot size={16} color="#3B82F6" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>SAMRAKSHA AI</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Case Intelligence Assistant</p>
          </div>
          <div className="ml-auto">
            <Badge color="#22C55E">Active</Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
                <Bot size={24} color="#3B82F6" />
              </div>
              <p className="text-sm font-medium" style={{ color: "#CBD5E1" }}>AI Case Assistant</p>
              <p className="text-xs max-w-xs" style={{ color: "#64748B" }}>
                Ask about case evidence, applicable legal sections, crime patterns, or investigation progress.
              </p>
              <div className="flex flex-col gap-2 mt-2">
                {["What sections apply to this case?", "Summarize the crime narrative", "List all open cases by type"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-2 rounded-lg text-xs text-left transition-all"
                    style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className="max-w-[75%] p-3 rounded-xl text-sm leading-relaxed"
                style={{
                  backgroundColor: msg.role === "user" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${msg.role === "user" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                  color: "#CBD5E1",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: msg.role === "user" ? "#60A5FA" : "#22C55E" }}>
                    {msg.role === "user" ? "You" : "SAMRAKSHA AI"}
                  </span>
                  {msg.source && (
                    <Badge color={msg.source === "LLM" ? "#22C55E" : "#F59E0B"}>{msg.source}</Badge>
                  )}
                </div>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((d) => (
                    <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#3B82F6", animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about cases, sections, patterns..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: input.trim() ? "#3B82F6" : "rgba(59,130,246,0.2)" }}
          >
            <Send size={16} color={input.trim() ? "#fff" : "#64748B"} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CCTV Page ────────────────────────────────────────────────────────────────

const CAMERA_FEEDS = [
  { id: "CCTV-SAT-007", name: "Satellite Market", status: "live", alert: "crowd" },
  { id: "CCTV-NAR-012", name: "Naranpura Crossing", status: "live", alert: "loitering" },
  { id: "ANPR-SG-003", name: "SG Highway ANPR", status: "live", alert: "anpr" },
  { id: "CCTV-MAN-019", name: "Maninagar Station", status: "live", alert: null },
  { id: "CCTV-GHT-004", name: "Ghatlodia Main", status: "offline", alert: null },
  { id: "CCTV-BOD-011", name: "Bodakdev Junction", status: "live", alert: null },
];

const ALERT_COLOR: Record<string, string> = { crowd: "#EF4444", loitering: "#F59E0B", anpr: "#3B82F6" };

function LiveCameraGrid() {
  const [active, setActive] = useState("CCTV-SAT-007");
  const [tick, setTick] = useState(0);
  const [nightVision, setNightVision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [snapshotToast, setSnapshotToast] = useState(false);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 2000); return () => clearInterval(t); }, []);

  const activeCam = CAMERA_FEEDS.find((c) => c.id === active) || CAMERA_FEEDS[0];
  const noiseLines = Array.from({ length: 12 }, (_, i) => i);

  function captureSnapshot() {
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 3000);
  }

  function resetPTZ() {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }

  return (
    <Card className="!p-0 overflow-hidden rounded-3xl" style={{ borderRadius: 24 }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-wrap gap-2 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-100">{activeCam.name}</span>
          <Badge color="#EF4444">{CAMERA_FEEDS.filter((c) => c.status === "live").length} Feeds Online</Badge>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <HoverTooltip tip={nightVision ? "Switch to Standard View" : "Enable IR Night-Vision"}>
            <button
              onClick={() => setNightVision((v) => !v)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1"
              style={{
                backgroundColor: nightVision ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                color: nightVision ? "#4ADE80" : "#94A3B8",
                borderColor: nightVision ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)",
              }}
            >
              <Eye size={12} /> {nightVision ? "IR ON" : "IR OFF"}
            </button>
          </HoverTooltip>

          <HoverTooltip tip="Capture HD Evidence Frame">
            <button
              onClick={captureSnapshot}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer flex items-center gap-1"
            >
              <Camera size={12} /> Snapshot
            </button>
          </HoverTooltip>

          <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
            <Signal size={12} className="text-green-400" /> Live Stream · {new Date().toLocaleTimeString("en-IN")}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 320 }}>
        {/* Main feed viewport */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: nightVision ? "#03170c" : "#050810", minHeight: 280 }}>
          {/* Snapshot Flash & Toast Notification */}
          {snapshotToast && (
            <div className="absolute top-4 right-4 z-30 px-3 py-2 rounded-2xl bg-emerald-600/90 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
              <CheckCircle size={14} /> Frame Captured to Vault!
            </div>
          )}

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)", backgroundSize: "100% 3px" }} />

          {/* Noise lines */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
            {noiseLines.map((i) => (
              <line
                key={i}
                x1={Math.random() * 100 + "%"} y1="0"
                x2={Math.random() * 100 + "%"} y2="100%"
                stroke={nightVision ? "#22c55e" : "white"}
                strokeWidth={Math.random() * 2 + 0.5}
                opacity={Math.random()}
              />
            ))}
          </svg>

          {/* Main Feed Content with PTZ transform */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            {activeCam.status === "offline" ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20">
                  <Video size={20} className="text-red-500" />
                </div>
                <p className="text-xs font-medium text-red-400">FEED OFFLINE</p>
                <p className="text-xs text-slate-500">Signal lost — maintenance unit dispatched</p>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center min-h-[220px]">
                {/* Faux IR grid */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: nightVision
                      ? "linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)"
                      : "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* AI Detection Bounding Boxes */}
                {[{ x: "28%", y: "35%", label: "PERSON 98%" }, { x: "58%", y: "50%", label: "VEHICLE GJ-01" }, { x: "75%", y: "30%", label: "PERSON 94%" }].map((pos, i) => (
                  <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                    <div
                      className="border-2 rounded transition-all"
                      style={{
                        width: 24 + (tick % 3) * 2,
                        height: 42 + (tick % 2) * 2,
                        borderColor: nightVision ? "#4ADE80" : "#3B82F6",
                        boxShadow: nightVision ? "0 0 10px rgba(74,222,128,0.6)" : "0 0 10px rgba(59,130,246,0.5)",
                      }}
                    />
                    <div className="text-[8px] mt-0.5 text-center font-mono font-bold" style={{ color: nightVision ? "#4ADE80" : "#60A5FA" }}>
                      {pos.label}
                    </div>
                  </div>
                ))}

                {/* Alert banner overlay */}
                {activeCam.alert && (
                  <div
                    className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-lg"
                    style={{
                      backgroundColor: ALERT_COLOR[activeCam.alert] + "33",
                      color: ALERT_COLOR[activeCam.alert],
                      border: `1px solid ${ALERT_COLOR[activeCam.alert]}66`,
                    }}
                  >
                    <AlertTriangle size={12} />
                    {activeCam.alert === "crowd" ? "HIGH DENSITY CROWD DETECTED" : activeCam.alert === "loitering" ? "LOITERING ANOMALY" : "ANPR AUTOMATIC MATCH"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive PTZ Controls overlay */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <HoverTooltip tip="Pan Left">
              <button onClick={() => setPanOffset((p) => ({ ...p, x: p.x + 15 }))} className="p-1 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronLeft size={14} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Up">
              <button onClick={() => setPanOffset((p) => ({ ...p, y: p.y + 15 }))} className="p-1 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronUp size={14} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Down">
              <button onClick={() => setPanOffset((p) => ({ ...p, y: p.y - 15 }))} className="p-1 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronDown size={14} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Right">
              <button onClick={() => setPanOffset((p) => ({ ...p, x: p.x - 15 }))} className="p-1 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </HoverTooltip>

            <span className="w-px h-4 bg-white/15 mx-1" />

            <HoverTooltip tip="Zoom In">
              <button onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))} className="p-1 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ZoomIn size={14} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Reset PTZ View">
              <button onClick={resetPTZ} className="px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer">
                {Math.round(zoomLevel * 100)}%
              </button>
            </HoverTooltip>
          </div>

          {/* HUD Info */}
          <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-0.5 font-mono text-[10px]" style={{ color: nightVision ? "#4ADE80" : "#94A3B8" }}>
            <div>{activeCam.id} · LAT 23.0225° / LON 72.5714°</div>
            <div>STATUS: {activeCam.status.toUpperCase()} {nightVision ? "[IR SPECTRAL ACTIVE]" : ""}</div>
          </div>
        </div>

        {/* Feeds Sidebar */}
        <div className="flex lg:flex-col gap-2 p-3 overflow-x-auto lg:overflow-y-auto lg:w-48 bg-slate-900/40 border-l border-white/10 shrink-0">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 hidden lg:block">Available Feeds</p>
          {CAMERA_FEEDS.map((cam) => (
            <button
              key={cam.id}
              onClick={() => { setActive(cam.id); resetPTZ(); }}
              className="shrink-0 rounded-2xl overflow-hidden text-left transition-all relative cursor-pointer"
              style={{
                width: 130, height: 75,
                backgroundColor: "#050810",
                border: active === cam.id ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)", backgroundSize: "100% 2px" }} />
              {cam.status === "offline" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <span className="text-[9px] font-bold text-red-500">OFFLINE</span>
                </div>
              )}
              {cam.alert && (
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: ALERT_COLOR[cam.alert] }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-[9px] font-semibold text-slate-200 truncate">{cam.name}</p>
                <p className="text-[8px] font-mono text-slate-400">{cam.id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CCTVPage() {
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());
  const [quickCase, setQuickCase] = useState<Case | null>(null);

  const filtered = MOCK_CCTV_ALERTS.filter((a) => filter === "all" || a.alert_type === filter);

  const alertTypeConf: Record<string, { color: string; label: string }> = {
    crowd_density: { color: "#EF4444", label: "Crowd" },
    loitering: { color: "#F59E0B", label: "Loitering" },
    anomaly: { color: "#8B5CF6", label: "Anomaly" },
    anpr: { color: "#3B82F6", label: "ANPR" },
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CCTV Monitoring"
        subtitle={`Last refreshed: ${formatTime(lastRefresh)}`}
        action={
          <Button onClick={() => setLastRefresh(new Date().toISOString())} variant="outlined" size="sm">
            <RefreshCw size={13} /> Refresh
          </Button>
        }
      />

      {/* Quick View Modal */}
      <QuickViewModal caseData={quickCase} onClose={() => setQuickCase(null)} />

      {/* Live Camera Grid */}
      <LiveCameraGrid />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(alertTypeConf).map(([type, conf]) => (
          <StatCard
            key={type}
            title={conf.label + " Alerts"}
            value={MOCK_CCTV_ALERTS.filter((a) => a.alert_type === type).length}
            icon={Camera}
            color={conf.color}
          />
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {["all", "crowd_density", "loitering", "anomaly", "anpr"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer"
            style={{
              backgroundColor: filter === f ? "#3B82F6" : "rgba(255,255,255,0.05)",
              color: filter === f ? "#fff" : "#64748B",
            }}
          >
            {f === "all" ? "All" : alertTypeConf[f]?.label || f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Alert Feed */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((alert) => {
            const conf = alertTypeConf[alert.alert_type];
            const confPct = Math.round(alert.confidence * 100);
            const matchedCase = alert.matched_fir
              ? MOCK_CASES.find((c) => c.fir_no === alert.matched_fir)
              : null;

            return (
              <Card key={alert.id} className="rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#F1F5F9", fontFamily: "JetBrains Mono, monospace" }}>{alert.camera_id}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{alert.source} · {timeAgo(alert.ts)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={conf?.color} bg={conf?.color + "22"}>{conf?.label || alert.alert_type}</Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#64748B" }}>Confidence</span>
                    <span style={{ color: confPct >= 50 ? "#22C55E" : "#F59E0B" }}>{confPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${confPct}%`, backgroundColor: confPct >= 50 ? "#22C55E" : "#F59E0B" }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    {alert.person_count && (
                      <Chip><User size={10} className="mr-0.5" />{alert.person_count} persons</Chip>
                    )}
                    {alert.plate_no && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#93C5FD" }}>
                        {alert.plate_no}
                      </span>
                    )}
                    {alert.matched_fir && (
                      <Badge color="#EF4444">⚠ {alert.matched_fir}</Badge>
                    )}
                  </div>

                  {matchedCase && (
                    <HoverTooltip tip="Quick view matched case details">
                      <button
                        onClick={() => setQuickCase(matchedCase)}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn size={12} /> Quick View Case
                      </button>
                    </HoverTooltip>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden relative" style={{ backgroundColor: "#0F1621", border: "1px solid rgba(255,255,255,0.08)", minHeight: 400 }}>
          <RealAhmedabadOpenStreetMap 
             showWards={false} 
             showPatrols={false} 
             showCCTV={true} 
             cases={[]}
             height="100%"
          />
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs pointer-events-none z-[1000]" style={{ backgroundColor: "rgba(22,29,45,0.9)", color: "#64748B" }}>
            Camera Coverage Map
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── CrimeGPT Document Studio ──────────────────────────────────────────────────

function CrimeGPTDocumentStudio({ selectedCase }: { selectedCase: Case | null }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Greetings Officer. I am CrimeGPT Legal AI Assistant trained on BNS (Bharatiya Nyaya Sanhita), BNSS (Bharatiya Nagarik Suraksha Sanhita), and BSA (Bharatiya Sakshya Adhiniyam). How can I assist with case documents today?",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [activeDocType, setActiveDocType] = useState<string>("chargesheet");
  const [editableDraft, setEditableDraft] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const c = selectedCase || MOCK_CASES[0];

  useEffect(() => {
    if (!c) return;
    if (activeDocType === "chargesheet") {
      setEditableDraft(
        `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, AHMEDABAD\n` +
        `FINAL REPORT / CHARGESHEET UNDER SECTION 193 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no}\n` +
        `POLICE STATION: Satellite Police Station (HQ-ELL)\n` +
        `DATE OF INCIDENT: ${c.crime_date.split("T")[0]}\n` +
        `OFFENCE CATEGORY: ${c.crime_type.toUpperCase()}\n` +
        `APPLICABLE SECTIONS: BNS Sections ${(c.bns_sections || ["303", "304"]).join(", ")}\n\n` +
        `1. ACCUSED DETAILS:\n` +
        `   Name: ${c.accused_name || "Prakash Joshi"} (Age: ${c.accused_age || 28})\n` +
        `   Address: ${c.accused_address || "77, Chandkheda, Ahmedabad"}\n\n` +
        `2. VICTIM / COMPLAINANT:\n` +
        `   Name: ${c.victim_name}\n` +
        `   Address: ${c.victim_address}\n\n` +
        `3. BRIEF FACTS OF THE CASE:\n` +
        `   ${c.crime_narrative}\n\n` +
        `4. EVIDENCE RECOVERED:\n` +
        `   - CCTV footage from Satellite Market (CAM-07)\n` +
        `   - Stolen personal effects recovered during Panch arrest memo\n` +
        `   - Eyewitness Panch statement under Sec 180 BNSS\n\n` +
        `PRAYER:\n` +
        `It is humbly prayed that this Hon'ble Court may take cognizance against the accused under BNS Sections ${(c.bns_sections || ["303", "304"]).join(", ")}.`
      );
    } else if (activeDocType === "remand") {
      setEditableDraft(
        `APPLICATION FOR POLICE CUSTODY REMAND UNDER SECTION 187 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no} | POLICE STATION: Satellite PS\n` +
        `ACCUSED: ${c.accused_name || "Prakash Joshi"}\n\n` +
        `GROUNDS FOR CUSTODY REMAND:\n` +
        `1. Further recovery of stolen property worth ₹1.25 Lakhs is pending.\n` +
        `2. Accomplices named during interrogation need to be apprehended.\n` +
        `3. Interrogation required for verification of crime scene trail.\n\n` +
        `PRAYER: Request 7 days Police Custody Remand.`
      );
    } else {
      setEditableDraft(
        `SEIZURE MEMO (PANCHANAMA) UNDER SECTION 185 BNSS, 2023\n\n` +
        `FIR NO: ${c.fir_no}\n` +
        `SEIZURE LOCATION: Near ${c.crime_location}, Ahmedabad\n` +
        `SEIZED ARTICLES: Mobile phone, wallet with ID, and cash.\n` +
        `PANCH WITNESS 1: Ramesh Patel\n` +
        `PANCH WITNESS 2: Suresh Shah\n` +
        `INVESTIGATING OFFICER: IO Amit Patel (Badge #IO_ELL_1)`
      );
    }
  }, [c, activeDocType]);

  const handleSendPrompt = (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q) return;

    const userMsg = { role: "user" as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt("");

    setTimeout(() => {
      let responseText = "";
      if (q.toLowerCase().includes("remand") || q.toLowerCase().includes("custody")) {
        responseText = `Under Section 187 of BNSS 2023 (corresponding to Sec 167 CrPC), police custody remand can be requested up to 15 days in tranches. Ensure grounds mention recovery of stolen material or identification of co-conspirators. I have updated the preview draft to Police Custody Remand.`;
        setActiveDocType("remand");
      } else if (q.toLowerCase().includes("seizure") || q.toLowerCase().includes("panchanama")) {
        responseText = `Under Section 185 BNSS 2023, audio-video recording of search and seizure panchanama is required. Ensure Panch witness signatures and digital hash logs are appended. Updated draft to Seizure Panchanama.`;
        setActiveDocType("seizure");
      } else {
        responseText = `Analyzing FIR narrative under BNS (Bharatiya Nyaya Sanhita). Chargesheet structure verified under Sec 193 BNSS. All statutory elements are aligned.`;
      }
      setMessages((prev) => [...prev, { role: "ai", text: responseText }]);
    }, 600);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] animate-fade-in-up">
      {/* Left Column: CrimeGPT Assistant Chat */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <Card className="flex flex-col h-[620px] p-4 border border-blue-500/20">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  CrimeGPT Legal Co-Pilot
                </h3>
                <p className="text-[10px] text-slate-400">BNS / BNSS / BSA Intelligence Agent</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              ONLINE
            </span>
          </div>

          {/* Quick Legal Prompt Suggestions */}
          <div className="flex gap-1.5 overflow-x-auto py-2.5 border-b border-white/5 scrollbar-none">
            <button
              onClick={() => handleSendPrompt("Draft Police Custody Remand Application under BNSS 187")}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-blue-300 shrink-0 border border-white/10 transition-all cursor-pointer"
            >
              📜 Remand Application
            </button>
            <button
              onClick={() => handleSendPrompt("Generate Seizure Panchanama under BNSS 185")}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 shrink-0 border border-white/10 transition-all cursor-pointer"
            >
              📦 Seizure Panchanama
            </button>
            <button
              onClick={() => handleSendPrompt("Check BNS Sections for robbery and snatching")}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-purple-300 shrink-0 border border-white/10 transition-all cursor-pointer"
            >
              ⚖ Check Legal Sections
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto my-3 flex flex-col gap-3 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-auto rounded-tr-none"
                    : "bg-slate-900 border border-white/10 text-slate-200 mr-auto rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <VoiceInputWidget onTranscript={(txt) => setPrompt((prev) => prev + " " + txt)} compact />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
              placeholder="Ask CrimeGPT or command legal document..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            />
            <button
              onClick={() => handleSendPrompt()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              <Send size={14} />
            </button>
          </div>
        </Card>
      </div>

      {/* Right Column: Split-Screen Document Studio */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <Card className="p-5 flex flex-col h-[620px] border border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100 font-mono">{c.fir_no}</span>
                <Badge color="#3B82F6">{c.crime_type}</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Live Split-Screen Document Editor & Exporter</p>
            </div>

            {/* Document Selector Segment */}
            <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
              {[
                { id: "chargesheet", label: "Chargesheet (Sec 193)" },
                { id: "remand", label: "Remand (Sec 187)" },
                { id: "seizure", label: "Seizure (Sec 185)" },
              ].map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocType(doc.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeDocType === doc.id ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Document Preview Pane */}
          <div className="flex-1 my-3 bg-slate-950 border border-white/10 rounded-2xl p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
            <textarea
              value={editableDraft}
              onChange={(e) => setEditableDraft(e.target.value)}
              className="w-full h-full bg-transparent outline-none resize-none font-mono text-xs text-slate-200 leading-relaxed"
            />
          </div>

          {/* Document Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="material-symbols-rounded text-sm text-emerald-400">verified</span>
              BNS/BNSS Statutory Compliant
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">{isCopied ? "check" : "content_copy"}</span>
                {isCopied ? "Copied!" : "Copy Text"}
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">print</span>
                Print Draft
              </button>
              <button
                onClick={() => alert(`Downloading official ${activeDocType.toUpperCase()} document as .docx file...`)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Export .docx
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Documents Page ───────────────────────────────────────────────────────────

function DocumentsPage() {
  const [mode, setMode] = useState<"studio" | "templates">("studio");
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(MOCK_CASES[0] || null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [lang, setLang] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Case[]>([]);

  function doSearch() {
    setSearchResults(MOCK_CASES.filter((c) =>
      c.fir_no.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.crime_type.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.victim_name.toLowerCase().includes(caseSearch.toLowerCase())
    ));
  }

  function generate(docKey: string) {
    setGenerating(docKey);
    setTimeout(() => setGenerating(null), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document Studio & Intelligence"
        subtitle="CrimeGPT Legal AI, split-screen studio, and official document exporter"
        action={
          <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
            <button
              onClick={() => setMode("studio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "studio" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-rounded text-sm">view_timeline</span>
              CrimeGPT Studio (Split-Screen)
            </button>
            <button
              onClick={() => setMode("templates")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "templates" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-rounded text-sm">folder</span>
              Document Templates
            </button>
          </div>
        }
      />

      {/* Workspace View Mode Switch */}
      {mode === "studio" ? (
        <CrimeGPTDocumentStudio selectedCase={selectedCase} />
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Case search */}
          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#CBD5E1" }}>Select Case</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} color="#64748B" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  placeholder="Search by FIR number, victim name, or crime type..."
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }}
                />
              </div>
              <Button onClick={doSearch} size="md"><Search size={14} /></Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {searchResults.map((c) => (
                  <button
                    key={c.case_id}
                    onClick={() => { setSelectedCase(c); setSearchResults([]); }}
                    className="flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-sm font-mono" style={{ color: "#60A5FA" }}>{c.fir_no}</span>
                    <div className="flex items-center gap-2">
                      <Badge color="#3B82F6">{c.crime_type}</Badge>
                      <Badge color={STATUS_CONFIG[c.case_status].color}>{STATUS_CONFIG[c.case_status].label}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {selectedCase && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <FileText size={16} color="#3B82F6" />
              <span className="text-sm font-mono font-medium" style={{ color: "#60A5FA" }}>{selectedCase.fir_no}</span>
              <span className="text-sm" style={{ color: "#94A3B8" }}>·</span>
              <Badge color="#3B82F6">{selectedCase.crime_type}</Badge>
              <Badge color={STATUS_CONFIG[selectedCase.case_status].color}>{STATUS_CONFIG[selectedCase.case_status].label}</Badge>
              <button onClick={() => setSelectedCase(null)} className="ml-auto cursor-pointer">
                <X size={14} color="#64748B" />
              </button>
            </div>
          )}

          {/* Doc Type Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {DOC_TYPES.map((doc) => {
              const DocIcon = doc.icon;
              const docLang = lang[doc.key] || "en";
              return (
                <Card key={doc.key} className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>
                      <DocIcon size={18} color="#3B82F6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{doc.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{doc.desc}</p>
                    </div>
                  </div>

                  {doc.key === "medical_letter" && selectedCase && !selectedCase.victim_injury && (
                    <div className="px-2 py-1.5 rounded-lg text-xs flex items-center gap-1" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#FDE68A" }}>
                      <TriangleAlert size={11} /> Victim has no reported injury
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    {["en", "hi", "gu"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang((prev) => ({ ...prev, [doc.key]: l }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all uppercase cursor-pointer"
                        style={{
                          backgroundColor: docLang === l ? "#3B82F6" : "rgba(255,255,255,0.05)",
                          color: docLang === l ? "#fff" : "#64748B",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => generate(doc.key)}
                    disabled={!selectedCase || generating === doc.key}
                    variant="filled"
                    size="sm"
                    className="w-full justify-center cursor-pointer"
                  >
                    {generating === doc.key ? "Generating..." : "Generate & Download .docx"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Download History */}
      {selectedCase && (
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#CBD5E1" }}>Download History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "#64748B", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Doc Type", "Language", "Generated At", "Generated By", "SHA-256", ""].map((h) => (
                    <th key={h} className="text-left pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { type: "Chargesheet", lang: "English", at: "2026-07-12T09:30:00Z", by: "SHO Priya Mehta", sha: "3a8f2e91b7c4" },
                  { type: "Panchanama", lang: "Gujarati", at: "2026-07-10T14:00:00Z", by: "IO Amit Patel", sha: "9c1d5a83fe27" },
                ].map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="py-2 pr-4" style={{ color: "#CBD5E1" }}>{row.type}</td>
                    <td className="py-2 pr-4" style={{ color: "#94A3B8" }}>{row.lang}</td>
                    <td className="py-2 pr-4" style={{ color: "#64748B" }}>{formatDateTime(row.at)}</td>
                    <td className="py-2 pr-4" style={{ color: "#64748B" }}>{row.by}</td>
                    <td className="py-2 pr-4 font-mono" style={{ color: "#64748B" }}>{row.sha}</td>
                    <td className="py-2">
                      <button className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                        <Download size={11} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Predictive Analytics" subtitle="Real-time foresight and threat mitigation data" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Threat Index", value: "7.4", icon: Activity, color: "#EF4444", change: 8 },
          { title: "Response Efficiency", value: "82%", icon: Zap, color: "#22C55E", change: 3 },
          { title: "Active Personnel", value: 47, icon: BadgeCheck, color: "#3B82F6" },
          { title: "Incidents Resolved", value: 128, icon: CheckCircle, color: "#8B5CF6", change: 15 },
        ].map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} change={s.change} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#CBD5E1" }}>Incident Frequency Tracking</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEKLY_DATA.concat(WEEKLY_DATA)}>
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }} />
              <Area type="monotone" dataKey="count" stroke="#EF4444" fill="url(#threatGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#CBD5E1" }}>High-Risk Zone Intensity</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(MOCK_WARDS).filter(([, d]) => d.level !== "LOW").map(([name, data]) => {
              const conf = RISK_CONFIG[data.level];
              return (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: conf.dot }} />
                  <span className="text-xs flex-1" style={{ color: "#94A3B8" }}>{name}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${data.risk_score}%`, backgroundColor: conf.dot }} />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ color: conf.color }}>{data.risk_score}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#CBD5E1" }}>Weekly Incident Pattern</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEKLY_DATA} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E2A40", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {WEEKLY_DATA.map((_, i) => <Cell key={i} fill={i === 5 || i === 6 ? "#EF4444" : "#3B82F6"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#CBD5E1" }}>Personnel Real-time Status</h3>
          <div className="flex flex-col gap-2">
            {[
              { name: "Sgt. David Chen", rank: "SGT", status: "on-patrol", zone: "Zone A" },
              { name: "Ofc. Gina Rodriguez", rank: "OFC", status: "responding", zone: "Zone C" },
              { name: "Lt. Marcus Thomas", rank: "LT", status: "available", zone: "Central" },
              { name: "Ofc. Priya Shah", rank: "OFC", status: "on-patrol", zone: "Zone B" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#3B82F622", color: "#3B82F6" }}>
                    {p.rank}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#CBD5E1" }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: "#64748B" }}>{p.zone}</p>
                  </div>
                </div>
                <Badge
                  color={p.status === "on-patrol" ? "#22C55E" : p.status === "responding" ? "#EF4444" : "#64748B"}
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage() {
  const { officer } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const roleConf = ROLE_CONFIG[officer!.role];
  const initials = officer!.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const [form, setForm] = useState({
    firstName: officer!.name.split(" ")[0] || "",
    lastName: officer!.name.split(" ").slice(1).join(" ") || "",
    email: `${officer!.badge_no.toLowerCase()}@ahmedabadpolice.gov.in`,
    phone: "+91 98765 43210",
    bio: `Serving with the Ahmedabad City Police since 2018. Assigned to ${officer!.ps_id} Police Station. Committed to upholding law and public safety.`,
    password: "",
    confirmPassword: "",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const glassCard = {
    background: "rgba(22,29,45,0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
  } as React.CSSProperties;

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#F1F5F9",
    padding: "10px 14px",
    width: "100%",
    fontSize: 14,
    outline: "none",
    transition: "border-color 150ms",
  } as React.CSSProperties;

  return (
    <div className="max-w-2xl mx-auto py-6 px-2 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>
            {editMode ? "Edit Profile" : "My Profile"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
            {editMode ? "Update your personal information" : "View your account details"}
          </p>
        </div>
      </div>

      {/* Avatar + identity card */}
      <div style={glassCard} className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${roleConf.color}44 0%, ${roleConf.color}22 100%)`, border: `2px solid ${roleConf.color}55` }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              : <span style={{ color: roleConf.color }}>{initials}</span>
            }
          </div>
          {/* Glassy ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 0 3px rgba(59,130,246,0.15), 0 0 20px ${roleConf.color}33` }}
          />
          {editMode && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.9)", backdropFilter: "blur(8px)", border: "2px solid rgba(13,17,23,0.8)" }}
            >
              <Upload size={13} color="#fff" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Identity */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>{officer!.name}</h2>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${roleConf.color}22`, color: roleConf.color, border: `1px solid ${roleConf.color}44` }}
            >
              {roleConf.label}
            </span>
            <span className="text-xs" style={{ color: "#64748B" }}>Badge #{officer!.badge_no}</span>
          </div>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{form.bio}</p>

          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(59,130,246,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#93C5FD",
              }}
            >
              <Edit2 size={14} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* View Mode: contact details */}
      {!editMode && (
        <div style={glassCard} className="p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
            Contact &amp; Assignment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Email", value: form.email, icon: <Globe size={14} /> },
              { label: "Phone", value: form.phone, icon: <Phone size={14} /> },
              { label: "Police Station", value: officer!.ps_id, icon: <Building size={14} /> },
              { label: "Officer ID", value: officer!.id, icon: <BadgeCheck size={14} /> },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ color: "#3B82F6", marginTop: 2 }}>{icon}</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#64748B" }}>{label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#CBD5E1" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Mode: form */}
      {editMode && (
        <div style={glassCard} className="p-6 flex flex-col gap-5">
          <h3 className="text-sm font-semibold" style={{ color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>First Name</label>
              <input
                style={inputStyle}
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Last Name</label>
              <input
                style={inputStyle}
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Email Address</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Phone Number</label>
            <input
              style={inputStyle}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Bio</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              value={form.bio}
              onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div
            className="pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>New Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Confirm Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94A3B8",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 100%)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(59,130,246,0.5)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Patrolling Unit Page ───────────────────────────────────────────────────────

interface PatrolUnitFull {
  id: string;
  name: string;
  vehicle_no: string;
  officer_in_charge: string;
  phone: string;
  status: "active" | "responding" | "idle";
  ward: string;
  lat: number;
  lon: number;
  speed_kmh: number;
  fuel_percent: number;
  route_id: string;
  type: string;
  last_ping: string;
}

interface PatrolRouteFull {
  id: string;
  name: string;
  ward: string;
  distance_km: number;
  est_time_mins: number;
  risk_level: "HIGH" | "ELEVATED" | "MEDIUM" | "LOW";
  color: string;
  checkpoints: { name: string; lat: number; lon: number; done: boolean; time?: string }[];
}

const MOCK_PATROL_FULL: PatrolUnitFull[] = [
  {
    id: "p1", name: "PCR-11", vehicle_no: "GJ-01-PA-1011",
    officer_in_charge: "Inspector J.V. Jadeja", phone: "+91 98250 11011",
    status: "active", ward: "Satellite", lat: 23.0342, lon: 72.5168,
    speed_kmh: 38, fuel_percent: 84, route_id: "r1", type: "Interceptor SUV",
    last_ping: "30s ago"
  },
  {
    id: "p2", name: "PCR-14", vehicle_no: "GJ-01-PA-1014",
    officer_in_charge: "Sub-Inspector R.K. Solanki", phone: "+91 98250 11014",
    status: "responding", ward: "Naranpura", lat: 23.0607, lon: 72.5554,
    speed_kmh: 58, fuel_percent: 62, route_id: "r2", type: "Quick Response Van",
    last_ping: "12s ago"
  },
  {
    id: "p3", name: "PCR-07", vehicle_no: "GJ-01-PA-1007",
    officer_in_charge: "Constable M.P. Sharma", phone: "+91 98250 11007",
    status: "idle", ward: "Maninagar", lat: 22.9921, lon: 72.5940,
    speed_kmh: 0, fuel_percent: 91, route_id: "r3", type: "Standard Patrol Van",
    last_ping: "2m ago"
  },
  {
    id: "p4", name: "PCR-23", vehicle_no: "GJ-01-PA-1023",
    officer_in_charge: "Inspector A.B. Patel", phone: "+91 98250 11023",
    status: "active", ward: "Ghatlodia", lat: 23.0771, lon: 72.5420,
    speed_kmh: 32, fuel_percent: 78, route_id: "r2", type: "Interceptor SUV",
    last_ping: "45s ago"
  },
  {
    id: "p5", name: "PCR-35", vehicle_no: "GJ-01-PA-1035",
    officer_in_charge: "Constable V.S. Gohil", phone: "+91 98250 11035",
    status: "active", ward: "Bodakdev", lat: 23.0408, lon: 72.5088,
    speed_kmh: 44, fuel_percent: 70, route_id: "r4", type: "Highway Interceptor",
    last_ping: "18s ago"
  },
  {
    id: "p6", name: "PCR-09", vehicle_no: "GJ-01-PA-1009",
    officer_in_charge: "Sub-Inspector D.N. Zala", phone: "+91 98250 11009",
    status: "responding", ward: "Chandkheda", lat: 23.1100, lon: 72.5800,
    speed_kmh: 52, fuel_percent: 88, route_id: "r2", type: "Quick Response Van",
    last_ping: "5s ago"
  },
];

const MOCK_PATROL_ROUTES: PatrolRouteFull[] = [
  {
    id: "r1", name: "Route Alpha — Satellite to Vastrapur High-Risk Loop", ward: "Satellite",
    distance_km: 5.4, est_time_mins: 14, risk_level: "HIGH", color: "#3B82F6",
    checkpoints: [
      { name: "Satellite Market Gate #1", lat: 23.0342, lon: 72.5168, done: true, time: "14:15" },
      { name: "ISKCON Crossroad Precinct", lat: 23.0280, lon: 72.5070, done: true, time: "14:28" },
      { name: "Vastrapur Lake East Bank", lat: 23.0380, lon: 72.5280, done: false },
      { name: "IIM Ahmedabad Main Gate", lat: 23.0320, lon: 72.5320, done: false },
    ],
  },
  {
    id: "r2", name: "Route Beta — Naranpura to Ghatlodia Sector Patrol", ward: "Naranpura",
    distance_km: 6.8, est_time_mins: 18, risk_level: "ELEVATED", color: "#10B981",
    checkpoints: [
      { name: "Naranpura Crossing Signal", lat: 23.0607, lon: 72.5554, done: true, time: "14:10" },
      { name: "Gujarat College Road", lat: 23.0520, lon: 72.5580, done: true, time: "14:32" },
      { name: "Ghatlodia Main Market", lat: 23.0771, lon: 72.5420, done: true, time: "14:45" },
      { name: "Sola Road Flyover Underpass", lat: 23.0700, lon: 72.5350, done: false },
    ],
  },
  {
    id: "r3", name: "Route Gamma — Maninagar Railway & Market Loop", ward: "Maninagar",
    distance_km: 4.2, est_time_mins: 11, risk_level: "HIGH", color: "#8B5CF6",
    checkpoints: [
      { name: "Maninagar Railway Station", lat: 22.9921, lon: 72.5940, done: true, time: "14:20" },
      { name: "Kankaria Lake Gate 3", lat: 22.9980, lon: 72.6020, done: false },
      { name: "Geeta Mandir Bus Terminal", lat: 23.0080, lon: 72.5900, done: false },
    ],
  },
  {
    id: "r4", name: "Route Delta — SG Highway High-Speed Patrol Corridor", ward: "Bodakdev",
    distance_km: 8.5, est_time_mins: 15, risk_level: "MEDIUM", color: "#F59E0B",
    checkpoints: [
      { name: "Thaltej Underpass Circle", lat: 23.0500, lon: 72.5100, done: true, time: "14:05" },
      { name: "Bodakdev Junction", lat: 23.0408, lon: 72.5088, done: true, time: "14:25" },
      { name: "YMCA Club Crossroad", lat: 23.0150, lon: 72.5020, done: false },
    ],
  },
];

function PatrolPage() {
  const { navigate } = useApp();
  const [units, setUnits] = useState<PatrolUnitFull[]>(MOCK_PATROL_FULL);
  const [routes] = useState<PatrolRouteFull[]>(MOCK_PATROL_ROUTES);
  const [activeTab, setActiveTab] = useState<"units" | "routes" | "rerouting">("units");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("r1");
  const [filterWard, setFilterWard] = useState<string>("All");

  // Editing & Adding state
  const [editingUnit, setEditingUnit] = useState<PatrolUnitFull | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUnitForm, setNewUnitForm] = useState({
    name: "Unit 1",
    officer_in_charge: "officer vijay",
    vehicle_no: "gj-08-bj-9876",
    ward: "Satellite",
    status: "active" as "active" | "responding" | "idle",
    type: "Interceptor SUV"
  });

  // Rerouting form states
  const [rerouteUnitId, setRerouteUnitId] = useState<string>("p1");
  const [rerouteReason, setRerouteReason] = useState<string>("CCTV High Crowd Alert");
  const [rerouteWard, setRerouteWard] = useState<string>("Satellite");
  const [rerouteLandmark, setRerouteLandmark] = useState<string>("Satellite Market Gate #2");
  const [rerouteCalculated, setRerouteCalculated] = useState<boolean>(false);
  const [rerouteDispatching, setRerouteDispatching] = useState<boolean>(false);
  const [rerouteSuccessMsg, setRerouteSuccessMsg] = useState<string>("");

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;
  const targetRerouteUnit = units.find((u) => u.id === rerouteUnitId) || units[0];

  const filteredUnits = filterWard === "All"
    ? units
    : units.filter((u) => u.ward === filterWard);

  function handleStatusToggle(unitId: string, newStatus: "active" | "responding" | "idle") {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
    );
  }

  function handleDeleteUnit(unitId: string) {
    if (confirm("Are you sure you want to unassign and delete this patrol unit?")) {
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      if (selectedUnitId === unitId) {
        setSelectedUnitId("");
      }
    }
  }

  function handleSaveEditUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUnit) return;
    setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? editingUnit : u)));
    setEditingUnit(null);
  }

  function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    const created: PatrolUnitFull = {
      id: `p_${Date.now()}`,
      name: newUnitForm.name || "Unit 1",
      officer_in_charge: newUnitForm.officer_in_charge || "officer vijay",
      vehicle_no: newUnitForm.vehicle_no || "gj-08-bj-9876",
      phone: "+91 98250 99999",
      status: newUnitForm.status,
      ward: newUnitForm.ward,
      lat: 23.0342 + (Math.random() - 0.5) * 0.05,
      lon: 72.5168 + (Math.random() - 0.5) * 0.05,
      speed_kmh: newUnitForm.status === "active" ? 40 : newUnitForm.status === "responding" ? 60 : 0,
      fuel_percent: 92,
      route_id: "r1",
      type: newUnitForm.type,
      last_ping: "Just now"
    };
    setUnits((prev) => [created, ...prev]);
    setSelectedUnitId(created.id);
    setShowAddModal(false);
  }

  function handleCalculateReroute() {
    setRerouteCalculated(true);
    setRerouteSuccessMsg("");
  }

  function handleDispatchReroute() {
    setRerouteDispatching(true);
    setTimeout(() => {
      setUnits((prev) =>
        prev.map((u) => {
          if (u.id === rerouteUnitId) {
            return {
              ...u,
              status: "responding",
              ward: rerouteWard,
              speed_kmh: 52,
              last_ping: "just now",
            };
          }
          return u;
        })
      );
      setRerouteDispatching(false);
      setRerouteSuccessMsg(`PCR Unit ${units.find((u) => u.id === rerouteUnitId)?.name || rerouteUnitId} successfully rerouted to ${rerouteWard} (${rerouteLandmark}). Dispatch command broadcast via encrypted radio.`);
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patrolling Units & Tactical Operations"
        subtitle="Real-time fleet tracking, active patrol route monitoring, and dynamic AI rerouting dispatch"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddModal(true)} className="rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10">
              + Add Patrol Unit
            </Button>
            <Button onClick={() => { setActiveTab("rerouting"); }} className="rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
              <Radio size={14} /> Quick Reroute Dispatch
            </Button>
          </div>
        }
      />

      {/* Top Stat Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active PCR Units" value={`${units.filter((u) => u.status === "active").length} Units`} icon={Car} color="#3B82F6" tooltip="Units currently patrolling assigned corridors" />
        <StatCard title="Responding Units" value={`${units.filter((u) => u.status === "responding").length} Units`} icon={Siren} color="#EF4444" tooltip="Units en route to active alerts or emergency calls" />
        <StatCard title="Active Patrol Routes" value={`${routes.length} Corridors`} icon={Navigation} color="#10B981" tooltip="Monitored high-density and high-threat precinct loops" />
        <StatCard title="Fleet Readiness" value="98.2%" icon={Shield} color="#8B5CF6" tooltip="GPS signal strength, fuel availability, and comms uptime" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("units")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "units"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Car size={15} /> Current Patrolling Units ({units.length})
        </button>
        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "routes"
              ? "bg-white/10 text-white shadow-lg"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Navigation size={15} /> Patrolling Routes ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab("rerouting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "rerouting"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          <Zap size={15} /> Dynamic AI Rerouting
        </button>
      </div>

      {/* Tab 1: Current Patrolling Units */}
      {activeTab === "units" && (
        <div className="flex flex-col gap-6">
          {/* Ward Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Filter size={14} className="text-blue-400" /> Filter Ward Precinct:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Satellite", "Naranpura", "Maninagar", "Ghatlodia", "Bodakdev", "Chandkheda"].map((w) => (
                <button
                  key={w}
                  onClick={() => setFilterWard(w)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: filterWard === w ? "#3B82F6" : "rgba(255,255,255,0.06)",
                    color: filterWard === w ? "#ffffff" : "#CBD5E1",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Units Cards Grid matching prompt style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((u) => {
              const statusColor = u.status === "active" ? "#06B6D4" : u.status === "responding" ? "#EF4444" : "#64748B";
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUnitId(u.id)}
                  className="bg-slate-900/80 hover:bg-slate-800/90 rounded-2xl p-5 cursor-pointer transition-all border border-white/10 hover:border-cyan-500/50 shadow-lg group"
                  style={{ borderTop: `3px solid ${statusColor}` }}
                >
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                      🚔 {u.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: statusColor }}
                      />
                      <span
                        className="text-[11px] font-mono font-bold uppercase tracking-wider"
                        style={{ color: statusColor }}
                      >
                        {u.status === "active" ? "deployed" : u.status}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-400">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">Officer</div>
                      <span className="text-slate-200 font-medium">{u.officer_in_charge}</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">Vehicle</div>
                      <span className="text-slate-200 font-mono text-xs">{u.vehicle_no}</span>
                    </div>
                    <div className="col-span-2 pt-1">
                      <div className="text-[10px] text-slate-500 mb-0.5">Location</div>
                      <span className="text-slate-200 font-medium">📍 {u.ward || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fixed Modal Inspector Overlay matching prompt exact design */}
          {selectedUnit && (
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in">
              <div className="w-full max-w-[1000px] h-[80vh] bg-slate-900 rounded-2xl border border-white/10 flex flex-col lg:flex-row shadow-2xl overflow-hidden">
                {/* Left: OpenStreetMap */}
                <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/10 min-h-[300px]">
                  <RealAhmedabadOpenStreetMap
                    cases={MOCK_CASES}
                    showWards={true}
                    showPatrols={true}
                    showCCTV={false}
                    selectedWard={selectedUnit.ward}
                    height="100%"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-200 z-[1000] flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    GPS Tracking: <strong className="text-cyan-400 font-mono">{selectedUnit.name}</strong> ({selectedUnit.ward} Precinct)
                  </div>
                </div>

                {/* Right Inspector Panel (350px) */}
                <div className="w-full lg:w-[350px] flex flex-col p-6 bg-slate-900 shrink-0 text-slate-200">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold font-mono lowercase text-slate-100">{selectedUnit.name}</h2>
                    <button
                      onClick={() => setSelectedUnitId("")}
                      className="text-slate-400 hover:text-white text-2xl cursor-pointer transition-colors"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Officer</div>
                      <div className="text-sm text-slate-200 font-medium">{selectedUnit.officer_in_charge}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Vehicle</div>
                      <div className="text-sm font-mono text-slate-200">{selectedUnit.vehicle_no}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Status</div>
                      <div className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                        {selectedUnit.status === "active" ? "deployed" : selectedUnit.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Assigned Waypoints</div>
                      <div className="text-sm text-slate-200 font-semibold">
                        {routes.find((r) => r.id === selectedUnit.route_id)?.checkpoints.length || 9} stops
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setRerouteUnitId(selectedUnit.id);
                        setRerouteWard(selectedUnit.ward);
                        setActiveTab("rerouting");
                        setSelectedUnitId("");
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                    >
                      <span>🔄</span> Auto Re-route (AI/ML)
                    </button>

                    <button
                      onClick={() => setSelectedUnitId("")}
                      className="w-full py-3 px-4 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>🗺️</span> View on map
                    </button>

                    <button
                      onClick={() => {
                        setEditingUnit(selectedUnit);
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>✏️</span> Edit / Modify Unit
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(selectedUnit.id)}
                      className="w-full py-3 px-4 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>⚠️</span> Delete / Unassign Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Edit Unit */}
      {editingUnit && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                ✏️ Edit Patrol Unit ({editingUnit.name})
              </h3>
              <button onClick={() => setEditingUnit(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditUnit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">Unit Name</label>
                <input
                  value={editingUnit.name}
                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Officer In Charge</label>
                <input
                  value={editingUnit.officer_in_charge}
                  onChange={(e) => setEditingUnit({ ...editingUnit, officer_in_charge: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Vehicle Number</label>
                <input
                  value={editingUnit.vehicle_no}
                  onChange={(e) => setEditingUnit({ ...editingUnit, vehicle_no: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Ward Precinct</label>
                  <select
                    value={editingUnit.ward}
                    onChange={(e) => setEditingUnit({ ...editingUnit, ward: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    {AHMEDABAD_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Status</label>
                  <select
                    value={editingUnit.status}
                    onChange={(e) => setEditingUnit({ ...editingUnit, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="active">Deployed / Active</option>
                    <option value="responding">Responding</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Unit */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                🚔 Deploy New Patrol Unit
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddUnit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">Unit Code / Name</label>
                <input
                  value={newUnitForm.name}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, name: e.target.value })}
                  placeholder="e.g. Unit 1 or PU 65"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Officer Name</label>
                <input
                  value={newUnitForm.officer_in_charge}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, officer_in_charge: e.target.value })}
                  placeholder="e.g. officer vijay"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Vehicle Number</label>
                <input
                  value={newUnitForm.vehicle_no}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, vehicle_no: e.target.value })}
                  placeholder="e.g. gj-08-bj-9876"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Ward Precinct</label>
                  <select
                    value={newUnitForm.ward}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, ward: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    {AHMEDABAD_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Initial Status</label>
                  <select
                    value={newUnitForm.status}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="active">Deployed</option>
                    <option value="responding">Responding</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Deploy Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Patrolling Routes */}
      {activeTab === "routes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Route Cards */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {routes.map((r) => {
              const isSelected = (selectedRouteId || "r1") === r.id;
              return (
                <Card
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`flex flex-col gap-4 p-5 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 shadow-lg ring-1 ring-blue-500/50"
                      : "border-white/10 hover:border-blue-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-blue-400 animate-pulse" : "bg-slate-600"}`} />
                        <h3 className="text-sm font-bold text-slate-100">{r.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Ward: {r.ward} · {r.distance_km} km · Est. {r.est_time_mins} mins</p>
                    </div>
                    <Badge color={r.risk_level === "HIGH" ? "#EF4444" : "#F97316"} bg={r.risk_level === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)"}>
                      {r.risk_level} THREAT
                    </Badge>
                  </div>

                  {/* Checkpoints Progress Timeline */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-400" /> Route Checkpoints ({r.checkpoints.filter((c) => c.done).length}/{r.checkpoints.length} Cleared)
                    </p>
                    <div className="flex flex-col gap-2">
                      {r.checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cp.done ? "bg-emerald-500" : "bg-slate-600"}`} />
                            <span className={cp.done ? "text-slate-200 font-medium" : "text-slate-400"}>{cp.name}</span>
                          </div>
                          {cp.done ? (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Cleared {cp.time}</span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right Column: Tactical OpenStreetMap Overview */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <MapPin size={15} color="#3B82F6" /> Live Patrol Route & Alternative Corridors
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Primary path highlighted with alternative routes and distance/time badges</p>
                </div>
              </div>
              <RealAhmedabadOpenStreetMap
                cases={MOCK_CASES}
                showWards={true}
                showPatrols={true}
                showCCTV={false}
                activeRoute={routes.find((r) => r.id === (selectedRouteId || "r1"))}
                height="480px"
              />
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic AI Rerouting Engine */}
      {activeTab === "rerouting" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
          {/* Left: Dispatch Form */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="p-6 flex flex-col gap-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Zap size={18} className="text-amber-400" /> Dynamic PCR Rerouting Command
                </h3>
                <p className="text-xs text-slate-400 mt-1">Re-assign active patrol units dynamically based on live CCTV alerts, ANPR hits, or emergency calls.</p>
              </div>

              {/* Form Controls */}
              <div className="flex flex-col gap-4">
                <Select
                  label="Select Patrol Unit to Reroute *"
                  value={rerouteUnitId}
                  onChange={setRerouteUnitId}
                  options={units.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.officer_in_charge} · Current: ${u.ward} Ward)`,
                  }))}
                />

                <Select
                  label="Reroute Trigger / Incident Reason *"
                  value={rerouteReason}
                  onChange={setRerouteReason}
                  options={[
                    { value: "CCTV High Crowd Alert", label: "CCTV High Crowd Density Anomaly" },
                    { value: "ANPR Stolen Vehicle Match", label: "ANPR Hit: Stolen / High Threat Vehicle" },
                    { value: "Emergency Crime FIR Incident", label: "Emergency FIR Crime Reported" },
                    { value: "Traffic Congestion Bypass", label: "Traffic Congestion & Bottleneck Bypass" },
                    { value: "VIP Escort Request", label: "VIP Escort & High-Security Movement" },
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Target Destination Ward Precinct *"
                    value={rerouteWard}
                    onChange={setRerouteWard}
                    options={AHMEDABAD_WARDS.map((w) => ({ value: w, label: `${w} Ward` }))}
                  />
                  <Input
                    label="Target Landmark / Location *"
                    value={rerouteLandmark}
                    onChange={setRerouteLandmark}
                    placeholder="Specific street or landmark"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleCalculateReroute}
                    className="flex-1 justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5"
                  >
                    <Cpu size={15} /> Calculate Optimized Route
                  </Button>
                </div>
              </div>
            </Card>

            {/* AI Optimization Calculation Results */}
            {rerouteCalculated && (
              <Card className="p-6 flex flex-col gap-4 border-blue-500/30 bg-blue-500/5 animate-fadeIn">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <BadgeCheck size={16} /> AI Route Optimization Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400">Distance Shift</span>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">3.4 km → 4.8 km</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400">Estimated Travel ETA</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">~5.2 minutes</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400">Priority Level</span>
                    <p className="text-sm font-bold text-red-400 mt-0.5">PRIORITY DISPATCH</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-blue-400">AI Routing Note:</strong> Bypassing Sola flyover bottleneck. Expected arrival time reduced by 2.4 minutes vs default GPS route. Zero high-congestion corridors traversed.
                </div>

                <Button
                  onClick={handleDispatchReroute}
                  disabled={rerouteDispatching}
                  className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm shadow-lg"
                >
                  {rerouteDispatching ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Broadcasting Encrypted Dispatch Order...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Radio size={16} /> Confirm & Dispatch Reroute Order
                    </div>
                  )}
                </Button>
              </Card>
            )}

            {/* Success Banner */}
            {rerouteSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-200">Dispatch Order Confirmed</p>
                  <p className="mt-1 font-normal text-emerald-300/90 leading-relaxed">{rerouteSuccessMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Unit State Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Car size={15} className="text-blue-400" /> Target Unit Telemetry
              </h3>
              {targetRerouteUnit && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{targetRerouteUnit.name}</h4>
                      <p className="text-xs text-slate-400">{targetRerouteUnit.officer_in_charge}</p>
                    </div>
                    <Badge color={targetRerouteUnit.status === "active" ? "#22C55E" : "#EF4444"}>
                      {targetRerouteUnit.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                    <div><span className="text-slate-500">Vehicle No</span><p className="font-mono text-slate-200">{targetRerouteUnit.vehicle_no}</p></div>
                    <div><span className="text-slate-500">Phone</span><p className="font-mono text-slate-200">{targetRerouteUnit.phone}</p></div>
                    <div><span className="text-slate-500">Current Precinct</span><p className="text-slate-200 font-semibold">{targetRerouteUnit.ward}</p></div>
                    <div><span className="text-slate-500">Comms Status</span><p className="text-emerald-400 font-semibold">{targetRerouteUnit.last_ping}</p></div>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <RealAhmedabadOpenStreetMap
                  cases={MOCK_CASES}
                  showPatrols={true}
                  selectedWard={targetRerouteUnit?.ward}
                  height="220px"
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell({ children }: { children: React.ReactNode }) {
  const { wsConnected } = useApp();
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#0D1117" }}>
      <Sidebar wsConnected={wsConnected} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar wsConnected={wsConnected} />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Root Provider & Router ───────────────────────────────────────────────────

export default function App() {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("login");
  const [params, setParams] = useState<Record<string, string>>({});
  const [wsMessages, setWsMessages] = useState<WSMessage[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const wsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || key;
  }, [language]);

  // Simulate WebSocket events
  useEffect(() => {
    if (!officer) return;
    setWsConnected(true);
    const pushMessage = () => {
      const template = WS_MESSAGE_TEMPLATES[Math.floor(Math.random() * WS_MESSAGE_TEMPLATES.length)];
      const msg: WSMessage = { ...template, ts: new Date().toISOString() };
      setWsMessages((prev) => [msg, ...prev].slice(0, 50));
    };
    pushMessage();
    wsIntervalRef.current = setInterval(pushMessage, 8000);
    return () => {
      if (wsIntervalRef.current) clearInterval(wsIntervalRef.current);
      setWsConnected(false);
    };
  }, [officer]);

  const navigate = useCallback((p: Page, newParams?: Record<string, string>) => {
    setPage(p);
    setParams(newParams || {});
  }, []);

  async function login(badge_no: string, password: string) {
    const entry = MOCK_OFFICERS[badge_no];
    if (!entry || entry.password !== password) throw new Error("Invalid credentials. Check badge number and password.");
    await new Promise((r) => setTimeout(r, 600));
    setOfficer(entry.officer);
    setToken("mock-jwt-" + badge_no);
    // Navigate to first allowed page
    const allowed = NAV_ITEMS.find((i) => i.roles.includes(entry.officer.role));
    navigate(allowed?.id || "dashboard");
  }

  function logout() {
    setOfficer(null);
    setToken(null);
    setWsMessages([]);
    navigate("login");
  }

  const ctx: AppCtx = { officer, token, login, logout, page, navigate, params, wsMessages, wsConnected, language, setLanguage, t };

  function renderPage() {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "map": return <MapPage />;
      case "patrol": return <PatrolPage />;
      case "cases": return <CasesPage />;
      case "case-detail": return <CaseDetailPage />;
      case "fir-entry": return <FIREntryPage />;
      case "assistant": return <AssistantPage />;
      case "cctv": return <CCTVPage />;
      case "documents": return <DocumentsPage />;
      case "analytics": return <AnalyticsPage />;
      case "profile": return <ProfilePage />;
      default: return <DashboardPage />;
    }
  }

  return (
    <Ctx.Provider value={ctx}>
      <div style={{ fontFamily: "Inter, sans-serif" }}>
        {!officer ? (
          <LoginPage />
        ) : (
          <AppShell>{renderPage()}</AppShell>
        )}
      </div>
    </Ctx.Provider>
  );
}
