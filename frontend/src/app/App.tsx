import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import L from "leaflet";
import DashboardPage from "./pages/DashboardPage";
import CasesPage from "./pages/CasesPage";
import CCTVPage from "./pages/CCTVPage";
import ProfilePage from "./pages/ProfilePage";
import PatrolPage from "./pages/PatrolPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import FIREntryPage from "./pages/FIREntryPage";
import AnalyticsPage from "./pages/AnalyticsPage";

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
  FlameKindling, UserCheck, Navigation, Siren, TriangleAlert, Edit2, Save, Upload, Trash2,
  Grid, List, FileDown, LayoutGrid, SlidersHorizontal, ExternalLink, PlayCircle, Pause,
  Maximize2, Signal, ZoomIn, Sun, Moon, ShieldCheck, Users, Key, ShieldAlert, FileCode, UserPlus
} from "lucide-react";

// Fix Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── SAMRAKSHA Logo SVG ───────────────────────────────────────────────────────

function SamrakshaLogo({ size = 32 }: { size?: number }) {
  return <img src="/logo.svg" alt="Samraksha Logo" width={size} height={size} style={{ userSelect: 'none' }} />;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "constable" | "io" | "sho" | "dcp" | "admin";
type CaseStatus = "open" | "arrested" | "chargesheeted" | "closed";
type Page =
  | "login" | "dashboard" | "map" | "patrol" | "cases" | "case-detail"
  | "fir-entry" | "assistant" | "cctv" | "documents" | "analytics" | "profile" | "admin";

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

export const PREDICTIVE_HEATMAP_ZONES: any[] = [];

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
  themeMode: "dark" | "light";
  setThemeMode: (m: "dark" | "light") => void;
  toggleTheme: () => void;
  cases: Case[];
  patrols: PatrolUnit[];
  cctvAlerts: CCTVAlert[];
}

const Ctx = createContext<AppCtx>({} as AppCtx);
const useApp = () => useContext(Ctx);

// ─── Mock Data ────────────────────────────────────────────────────────────────





const CHART_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];



const AHMEDABAD_WARDS = [
  "Jamalpur","Kalupur","Dariapur","Shahpur","Saraspur","Gomtipur","Odhav","Vatva",
  "Behrampura","Maninagar","Sardarnagar","Nikol","Naroda","Thakkarbapa","Chandkheda",
  "Sabarmati","Ranip","Naranpura","Ghatlodia","Sola","Bodakdev","Vastrapur",
  "Satellite","Jodhpur","Ambawadi","Navrangpura","Paldi","Vejalpur","Vastral",
  "Isanpur","Khadia","Rakhial",
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
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--input)", ...style }}>
      {children}
    </span>
  );
}

function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "glass-card p-4 sm:p-5 text-[var(--foreground)] overflow-hidden",
        className
      )}
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
    <Card className="flex flex-col gap-1.5 sm:gap-2 w-full cursor-default !p-3.5 border border-white/15 bg-slate-900/60 backdrop-blur-xl shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-300" style={{ borderRadius: 24 }}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: color + "22", border: `1px solid ${color}44` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {change !== undefined && (
          <span
            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10"
            style={{
              color: change >= 0 ? "#34D399" : "#F87171",
              backgroundColor: change >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
            }}
          >
            {change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-6 w-16 rounded-lg animate-pulse bg-white/10" />
      ) : (
        <div className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight font-display" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
      )}
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] truncate">{title}</div>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 cursor-pointer bg-[transparent] text-[var(--foreground)] border border-[var(--border)] shadow-sm"
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
          className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none transition-all bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] shadow-inner"
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
          <option key={o.value} value={o.value} className="bg-[transparent] text-[var(--foreground)]">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Button({ children, onClick, variant = "filled", size = "md", disabled, className, style, type = "button" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "filled" | "outlined" | "text" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean;
  className?: string; style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
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
      type={type}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col max-h-[85vh] overflow-hidden glass-card text-[var(--foreground)] border border-white/20 rounded-3xl shadow-2xl relative"
        style={{
          maxWidth: width,
          background: "rgba(10, 16, 31, 0.88)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-white/10">
          <h2 className="text-base font-bold text-[var(--foreground)] font-display tracking-wide">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 text-[var(--foreground)] hover:bg-white/20 cursor-pointer">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

interface GenerateDocumentModalProps {
  open: boolean;
  onClose: () => void;
  caseNo?: string;
  onDownload?: (docType: string, lang: string) => void;
}

function GenerateDocumentModal({
  open,
  onClose,
  caseNo: initialCaseNo = "FIR JAM/2026/0127",
  onDownload,
}: GenerateDocumentModalProps) {
  const { cases, token } = useApp();
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseNo);
  const [docType, setDocType] = useState("fir");
  const [docLang, setDocLang] = useState("en");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [docTypes, setDocTypes] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    setSelectedCaseId(initialCaseNo);
    if (open && docTypes.length === 0) {
      fetch("/api/v1/docs/templates", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDocTypes(data);
          if (!data.find(d => d.id === docType)) setDocType(data[0].id);
        }
      })
      .catch(console.error);
    }
  }, [initialCaseNo, open, token, docType, docTypes.length]);

  if (!open) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/v1/docs/generate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          case_id: selectedCaseId,
          doc_type: docType,
          language: docLang
        })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || "Generation failed");
      }
      
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `${docType}_${selectedCaseId}_${docLang}.docx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDownloaded(true);
      if (onDownload) {
        onDownload(docType, docLang);
      }
      setTimeout(() => {
        setDownloaded(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error("Document generation failed", e);
      alert(e instanceof Error ? e.message : "Document generation failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg, var(--card))",
          borderRadius: "var(--radius-xl, 16px)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "rgba(0, 0, 0, 0.5) 0px 24px 64px",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontFamily: "var(--font-headline, sans-serif)",
              color: "var(--text, var(--foreground))",
              fontWeight: 700,
            }}
          >
            📄 Generate Document
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              borderWidth: "medium",
              borderStyle: "none",
              borderColor: "currentcolor",
              borderImage: "none",
              color: "var(--text-muted, var(--muted-foreground))",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {downloaded ? (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} /> Document generated & download initiated!
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted, var(--muted-foreground))",
                  marginBottom: "4px"
                }}
              >
                Select Case Data:
              </div>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm, 8px)",
                  border: "1px solid var(--border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--text, var(--foreground))",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value={initialCaseNo} className="bg-[var(--card)] text-[var(--foreground)]">{initialCaseNo} (Default)</option>
                {cases?.map(c => (
                  <option key={c.fir_no} value={c.fir_no} className="bg-[var(--card)] text-[var(--foreground)]">{c.fir_no} - {c.crime_type}</option>
                ))}
              </select>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted, var(--muted-foreground))",
                    fontFamily: "var(--font-mono, monospace)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid var(--border)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--text, var(--foreground))",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {docTypes.map((type) => (
                    <option key={type.id} value={type.id} className="bg-[var(--card)] text-[var(--foreground)]">
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted, var(--muted-foreground))",
                    fontFamily: "var(--font-mono, monospace)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Language
                </label>
                <select
                  value={docLang}
                  onChange={(e) => setDocLang(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-sm, 8px)",
                    border: "1px solid var(--border)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--text, var(--foreground))",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="en" className="bg-[var(--card)] text-[var(--foreground)]">English</option>
                  <option value="hi" className="bg-[var(--card)] text-[var(--foreground)]">Hindi (हिन्दी)</option>
                  <option value="gu" className="bg-[var(--card)] text-[var(--foreground)]">Gujarati (ગુજરાતી)</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={downloading}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted, var(--muted-foreground))",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--radius-md, 8px)",
              borderWidth: "medium",
              borderStyle: "none",
              borderColor: "currentcolor",
              borderImage: "none",
              background: "var(--primary, #004b87)",
              color: "rgb(255, 255, 255)",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {downloading ? "Generating..." : "⬇ Download PDF / DocX"}
          </button>
        </div>
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
  const { navigate, cases, patrols, cctvAlerts } = useApp();
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
          <p className="text-xs text-[var(--muted-foreground)] font-mono">{caseData.crime_date}</p>
        </div>

        {/* Key Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-[var(--muted-foreground)]">Victim</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">{caseData.victim_name}</p>
            {caseData.victim_age && <p className="text-[10px] text-[var(--muted-foreground)]">{caseData.victim_age} yrs · {caseData.victim_gender || "N/A"}</p>}
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-[var(--muted-foreground)]">Accused</p>
            <p className="text-sm font-semibold text-amber-500 mt-0.5">{caseData.accused_name || "Unknown / Under Probe"}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-[var(--muted-foreground)]">Location</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">{caseData.crime_location}</p>
          </div>
        </div>

        {/* Legal Sections */}
        {((caseData.bns_sections && caseData.bns_sections.length > 0) || (caseData.bnss_sections && caseData.bnss_sections.length > 0)) && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-semibold text-blue-500 mb-1.5 flex items-center gap-1.5">
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
          <p className="text-xs font-semibold text-[var(--foreground)] mb-1 flex items-center gap-1.5">
            <FileText size={13} className="text-blue-500" /> Crime Narrative Summary
          </p>
          <p className="text-xs text-[var(--foreground)] leading-relaxed">{caseData.crime_narrative}</p>
        </div>

        {/* Case Diary Timeline */}
        {caseData.diary_entries && caseData.diary_entries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)] mb-2 flex items-center gap-1.5">
              <ClipboardList size={13} className="text-amber-500" /> Recent Case Diary Entries
            </p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {caseData.diary_entries.map((entry, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                  <div className="flex items-center justify-between text-[var(--muted-foreground)] text-[10px] mb-1">
                    <span className="font-semibold text-blue-500">{entry.entry_type}</span>
                    <span>{new Date(entry.ts).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[var(--foreground)]">{entry.description}</p>
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
  { id: "assistant", label: "AI Assistant", icon: Bot, roles: ["constable", "io", "sho", "dcp", "admin"] },
  { id: "map", label: "Crime Map", icon: Map, roles: ["constable", "io", "sho", "dcp", "admin"] },
  { id: "patrol", label: "Patrolling Units", icon: Siren, roles: ["constable", "io", "sho", "dcp", "admin"] },
  { id: "cases", label: "Cases", icon: FolderOpen, roles: ["io", "sho", "dcp", "admin"] },
  { id: "fir-entry", label: "New FIR", icon: Plus, roles: ["io", "sho", "admin"] },
  { id: "cctv", label: "CCTV", icon: Video, roles: ["sho", "dcp", "admin"] },
  
  { id: "analytics", label: "Analytics", icon: BarChart2, roles: ["dcp", "admin"] },
  { id: "admin", label: "Admin Controls", icon: ShieldCheck, roles: ["constable", "io", "sho", "dcp", "admin"] },
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
      onWheel={(e) => e.stopPropagation()}
      className="hidden md:flex flex-col h-screen fixed top-0 left-0 overflow-hidden select-none z-50 transition-all duration-300 ease-in-out shadow-2xl"
      style={{
        width: isHovered ? 240 : 72,
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid var(--sidebar-border)",
        color: "var(--sidebar-foreground)",
        flexShrink: 0,
        overscrollBehavior: "none",
      }}
    >
      {/* Logo Hover Trigger */}
      <div
        className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/5 shrink-0"
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
      <div className="flex flex-col gap-1.5 py-3 px-2 flex-1 overflow-hidden">
        {allowed.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                "flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all relative group cursor-pointer",
                active ? "bg-blue-600/30 border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] font-bold text-white" : "hover:bg-white/10 hover:text-white border border-transparent"
              )}
              style={{
                color: active ? "#FFFFFF" : "var(--sidebar-foreground)",
              }}
              title={!isHovered ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0 transition-transform group-hover:scale-110" />
              {isHovered ? (
                <div className="flex items-center justify-between w-full min-w-0 animate-fadeIn">
                  <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] shrink-0 ml-1.5" />
                  )}
                </div>
              ) : (
                <>
                  <span className="sr-only">{item.label}</span>
                  {active && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom officer info */}
      <div
        className="flex items-center justify-between gap-2 p-3 transition-colors shrink-0"
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
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">{officer.ps_id}</p>
            </div>
          )}
        </button>
        {isHovered && (
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-all hover:bg-red-500/20 text-red-500 hover:text-red-300 flex-shrink-0 cursor-pointer"
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
  const allowed = NAV_ITEMS.filter((i) => i.roles.includes(officer.role)).slice(0, 6);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around z-50 px-2 py-1.5 transition-colors bg-[var(--topbar-bg)] backdrop-blur-xl border-t border-[var(--sidebar-border)] shadow-2xl"
    >
      {allowed.map((item) => {
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition-all min-h-[44px] min-w-[44px]"
            style={{ color: active ? "var(--color-primary)" : "var(--sidebar-foreground)", backgroundColor: active ? "rgba(0,75,135,0.15)" : "transparent" }}
          >
            <item.icon size={18} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ wsConnected }: { wsConnected: boolean }) {
  const { officer, navigate, themeMode, toggleTheme, cases, language, setLanguage } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

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
            className="flex-1 bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
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
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[transparent] border border-[var(--border)] text-[var(--foreground)]"
            style={{
              backdropFilter: "blur(24px)",
            }}
          >
            {(() => {
              const q = searchQuery.toLowerCase();
              const caseResults = cases.filter((c) =>
                c.fir_no.toLowerCase().includes(q) ||
                c.victim_name.toLowerCase().includes(q) ||
                c.crime_type.toLowerCase().includes(q)
              ).slice(0, 4);
              const wardResults = Object.entries({}).filter(([name]) => name.toLowerCase().includes(q)).slice(0, 2);
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
                      {wardResults.map(([name, data]: [string, any]) => (
                        <button key={name} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-500/10 cursor-pointer">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: RISK_CONFIG[data.level]?.bg || "#000" }}>
                            <MapPin size={12} color={RISK_CONFIG[data.level]?.color || "#fff"} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--foreground)]">{name}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">Risk: {data.risk_score}</p>
                          </div>
                          <Badge color={RISK_CONFIG[data.level]?.color || "#fff"} bg={RISK_CONFIG[data.level]?.bg || "#000"}>{data.level}</Badge>
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
        {/* Language Switcher */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] text-xs font-semibold px-2 py-1.5 rounded-xl border outline-none cursor-pointer hidden md:block"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="gu">ગુજરાતી</option>
        </select>

        {/* Theme Switcher Toggle Button */}
        <button
          onClick={toggleTheme}
          title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]"
        >
          {themeMode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          <span className="text-xs font-semibold hidden md:inline">
            {themeMode === "dark" ? "Light" : "Dark"}
          </span>
        </button>

        {/* Mobile search icon */}
        <button
          className="sm:hidden p-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)]"
          onClick={() => {}}
          title="Search"
        >
          <Search size={15} />
        </button>

        {officer && (
          <HoverTooltip tip="Open Officer Profile">
            <button
              onClick={() => navigate("profile")}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all hover:bg-white/10 cursor-pointer border border-white/10"
              style={{ backgroundColor: "var(--input)" }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: ROLE_CONFIG[officer.role].color + "33", color: ROLE_CONFIG[officer.role].color }}>
                {officer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none" style={{ color: "var(--muted-foreground)" }}>{officer.name.split(" ")[0]}</p>
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const { token } = useApp();

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      setInterimText("Processing...");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          try {
            const res = await fetch("/api/v1/voice/transcribe", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              onTranscript(data.text || data.transcript || "");
            } else {
              console.error("Transcription failed", await res.text());
            }
          } catch (err) {
            console.error("Transcription error", err);
          }
          setInterimText("");
        };

        mediaRecorder.start();
        setIsListening(true);
        setInterimText("Listening...");
      } catch (err) {
        console.error("Microphone access denied", err);
        alert("Microphone permission required");
      }
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
              ? "bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse shadow-red-500/20"
              : "bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20"
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

// ─── Dashboard Page ───────────────────────────────────────────────────────────



// ─── Dashboard Page ───────────────────────────────────────────────────────────

function SegmentedChartCard({ title = "Incident Frequency Dynamics" }: { title?: string }) {
  const [timeSeg, setTimeSeg] = useState<"hourly" | "weekly" | "monthly">("hourly");
  const [chartType, setChartType] = useState<"bar" | "area" | "line">("bar");
  const [trends, setTrends] = useState({ hourly: [], weekly: [], monthly: [] });

  useEffect(() => {
    const token = localStorage.getItem("samraksha_token");
    fetch("/api/v1/analytics/trends", { 
      headers: token ? { Authorization: `Bearer ${token}` } : {} 
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.hourly) {
        setTrends({
          hourly: data.hourly.map((d: any) => ({ ...d, count: Number(d.count) })),
          weekly: data.weekly.map((d: any) => ({ ...d, count: Number(d.count) })),
          monthly: data.monthly.map((d: any) => ({ ...d, count: Number(d.count) })),
        });
      }
    })
    .catch(console.error);
  }, []);

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

  const keyMap = { hourly: "hour", weekly: "day", monthly: "month" };
  const data = trends[timeSeg] || [];
  const xKey = keyMap[timeSeg];

  return (
    <Card className=" rounded-2xl p-5 h-[360px] flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 border-b border-white/5 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="text-[11px] text-[var(--muted-foreground)]">Segmented multi-period analytics</p>
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
              <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 11 }} />
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
              <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 11 }} />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="url(#areaGrad)" strokeWidth={2.5} />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#64748B" }} interval={timeSeg === "hourly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 11 }} />
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
  cases = [],
  selectedWard,
  onSelectCase,
  showWards = true,
  showPatrols = true,
  patrols = [],
  showCCTV = true,
  cctvAlerts = [],
  showHeatmap: initialHeatmap = false,
  isDashboard = false,
  activeRoute,
  selectedUnit,
  height = "100%",
  className = "",
  onSelectAltPath,
  activeAltPathIndex = 0,
  wardsData = null,
}: {
  cases?: Case[];
  selectedWard?: string | null;
  onSelectCase?: (c: Case) => void;
  showWards?: boolean;
  showPatrols?: boolean;
  patrols?: PatrolUnit[];
  showCCTV?: boolean;
  cctvAlerts?: CCTVAlert[];
  showHeatmap?: boolean;
  isDashboard?: boolean;
  activeRoute?: PatrolRouteFull | null;
  selectedUnit?: PatrolUnitFull | null;
  height?: string;
  className?: string;
  onSelectAltPath?: (idx: number) => void;
  activeAltPathIndex?: number;
  wardsData?: Record<string, any> | null;
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

  useEffect(() => {
    setIsPredictiveMode(initialHeatmap);
  }, [initialHeatmap]);

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
      return ([] as any[]).find((r: any) => r.id === selectedUnit.route_id) || null;
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
        const realData = wardsData ? wardsData[name] : null;
        const level = realData?.level?.toUpperCase() || data.level;
        const score = realData?.score || data.score;
        const color =
          level === "HIGH"
            ? "#EA4335" // Google Red
            : level === "ELEVATED"
            ? "#FBBC04" // Google Yellow
            : level === "MEDIUM"
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
            ${score}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([data.lat, data.lon], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: 'Google Sans', Roboto, sans-serif; padding: 4px; color: #0f172a; min-width: 160px;">
            <div style="font-weight: 700; font-size: 13px; color: #1e293b;">📍 ${name} Ward</div>
            <div style="font-size: 11px; margin-top: 4px;">Risk Score: <strong style="color:${color}">${score}/100 (${level})</strong></div>
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
      (patrols || []).forEach((unit) => {
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
      cctvAlerts.forEach((cam) => {
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
            <div style="font-weight: 700; font-size: 12px; color: #0284c7;">📹 ${cam.camera_id}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">${cam.source}</div>
            <div style="font-size: 10px; color: #dc2626; margin-top: 3px; font-weight: 600;">⚠️ ${cam.alert_type}</div>
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

      const primaryCoords: [number, number][] = effectiveRoute.road_path || [
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

      {/* Dashboard Map Controls */}
      {isDashboard && (
        <div className="absolute top-2 left-2 z-[400] flex flex-col gap-1.5 max-w-[calc(100%-1rem)]">
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 p-1 rounded-xl flex-wrap shadow-xl">
            <button
              type="button"
              onClick={() => setIsPredictiveMode(!isPredictiveMode)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                isPredictiveMode
                  ? "bg-red-600 text-white shadow-lg animate-pulse"
                  : "bg-white/5 text-[var(--foreground)] hover:text-white"
              }`}
            >
              <span className="material-symbols-rounded text-xs">auto_graph</span>
              Heatmap {isPredictiveMode ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => setShowLegend(!showLegend)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                showLegend ? "bg-white/20 text-white" : "bg-white/5 text-[var(--foreground)] hover:text-white"
              }`}
            >
              📍 Legend
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5"></div>
            <button
              type="button"
              onClick={() => setMapStyle("google")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                mapStyle === "google" ? "bg-blue-600 text-white shadow" : "text-[var(--muted-foreground)] hover:text-white"
              }`}
            >
              Google Maps
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("satellite")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                mapStyle === "satellite" ? "bg-blue-600 text-white shadow" : "text-[var(--muted-foreground)] hover:text-white"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("dark")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                mapStyle === "dark" ? "bg-blue-600 text-white shadow" : "text-[var(--muted-foreground)] hover:text-white"
              }`}
            >
              Dark
            </button>
          </div>

          {showLegend && (
            <div className="p-2.5 rounded-xl text-[10px] font-medium backdrop-blur-md bg-black/85 text-white border border-white/20 flex flex-col gap-1.5 shadow-2xl animate-fadeIn w-fit">
              <div className="font-bold text-xs border-b border-white/10 pb-1 flex justify-between items-center gap-4">
                <span>Map Legend</span>
                <button type="button" onClick={() => setShowLegend(false)} className="text-white/60 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" /> High Risk Ward</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FBBC04]" /> Medium Risk Ward</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" /> Low Risk Ward</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500" /> AI Predictive Zone</div>
            </div>
          )}
        </div>
      )}

      {/* Floating Tactical Overlay Bar for Route & Path Control */}
      {effectiveRoute && (
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 max-w-[280px] md:max-w-xs bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Active Patrol Corridor</div>
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
            <div className="text-[9px] text-[var(--muted-foreground)] font-semibold uppercase">Select Patrol Route Path:</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleAltSwitch(0)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 0
                    ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400"
                    : "bg-white/5 text-[var(--foreground)] hover:bg-white/10"
                }`}
              >
                ⚡ Primary ({effectiveRoute.est_time_mins}m)
              </button>
              <button
                onClick={() => handleAltSwitch(1)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 1
                    ? "bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400"
                    : "bg-white/5 text-[var(--foreground)] hover:bg-white/10"
                }`}
              >
                Alt 1 (+3m)
              </button>
              <button
                onClick={() => handleAltSwitch(2)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currentAltIndex === 2
                    ? "bg-amber-600 text-white shadow-md ring-1 ring-amber-400"
                    : "bg-white/5 text-[var(--foreground)] hover:bg-white/10"
                }`}
              >
                Alt 2 (+5m)
              </button>
            </div>
          </div>
        </div>
      )}


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
    { id: "standard", label: "Standard Operations", icon: "shield", desc: "Default precinct patrol routes & surveillance" },
    { id: "festival", label: "Festival Surge Boost", icon: "celebration", desc: "High-density crowd simulation (+45% patrol)" },
    { id: "curfew", label: "Night Curfew Saturation", icon: "bedtime", desc: "High-risk zone lockdown & static posts" },
    { id: "monsoon", label: "Monsoon Flooding Reroute", icon: "rainy", desc: "Waterlogging bypass routing & emergency" },
  ];

  return (
    <Card className="rounded-xl p-4 border border-[var(--border)] bg-[var(--card)] shadow-sm text-[var(--foreground)]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
              AI Spatial Simulator
            </span>
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <span className="material-symbols-rounded text-blue-500 text-base">tune</span>
              Command Scenario Simulation
            </h3>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Simulate operational scenarios, patrol density scaling, and predictive threat responses on OpenStreetMap.
          </p>
        </div>

        {/* Live Metrics Feedback */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-center">
            <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-medium">Response Time</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">-3.8 mins</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-center">
            <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-medium">Coverage Index</p>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">94.2%</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-center">
            <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-medium">Simulated Units</p>
            <p className="text-xs font-bold text-[var(--foreground)] font-mono">{Math.round(18 * patrolMultiplier)} PCRs</p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePreset === p.id
                ? "bg-blue-500/10 border-blue-500/40 text-[var(--foreground)]"
                : "bg-[var(--input)] border-[var(--border)] hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`material-symbols-rounded text-base ${activePreset === p.id ? "text-blue-500" : "text-[var(--muted-foreground)]"}`}>
                {p.icon}
              </span>
              {activePreset === p.id && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-blue-600 text-white">Active</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">{p.label}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{p.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Fine-Tuning Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--foreground)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--muted-foreground)]">Patrol Multiplier:</span>
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.1}
            value={patrolMultiplier}
            onChange={(e) => setPatrolMultiplier(parseFloat(e.target.value))}
            className="w-24 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
          />
          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{patrolMultiplier.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[var(--muted-foreground)]">AI Sensitivity Threshold:</span>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
            className="w-24 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
          />
          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{riskThreshold}% Risk</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoReroute}
            onChange={(e) => setAutoReroute(e.target.checked)}
            className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-[var(--foreground)] text-xs">Auto-Reroute PCRs on Anomaly</span>
        </label>
      </div>
    </Card>
  );
}

// ─── Map Page ─────────────────────────────────────────────────────────────────

function MapPage() {
  const { navigate, cases, patrols, cctvAlerts, token } = useApp();
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState(7);
  const [selectedCrimeType, setSelectedCrimeType] = useState<string>("");
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [showAIHeatmap, setShowAIHeatmap] = useState(false);

  const [wardsData, setWardsData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    fetch("/api/v1/map/wards", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setWardsData(data);
        } else if (Array.isArray(data)) {
          const wMap: Record<string, any> = {};
          data.forEach(w => wMap[w.name || w.ward_name] = w);
          setWardsData(wMap);
        }
      })
      .catch(console.error);
  }, []);

  const wards = Object.entries(wardsData);
  const highRiskCount = wards.filter(([_, w]) => w.level === "high").length;
  const activePatrols = patrols.filter((p) => p.status === "active").length;

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchCrime = !selectedCrimeType || c.crime_type === selectedCrimeType;
      const daysAgo = (new Date().getTime() - new Date(c.crime_date).getTime()) / (1000 * 3600 * 24);
      const matchDays = daysAgo <= filterDays;
      return matchCrime && matchDays;
    });
  }, [selectedCrimeType, filterDays]);

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 justify-between gap-2 sm:gap-3 overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            Crime & Risk Heatmap
          </h1>
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
            Ahmedabad Precinct Spatial Intelligence · {filteredCases.length} incidents shown
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAIHeatmap(!showAIHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAIHeatmap 
                ? "bg-red-600/90 text-white border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse" 
                : "bg-slate-800/80 text-slate-200 border-white/10 hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-rounded text-[14px]">auto_graph</span>
            AI Heatmap {showAIHeatmap ? "ON" : "OFF"}
          </button>

          {/* Quick Metrics Badges */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
            <Badge color="#EF4444" bg="rgba(239,68,68,0.12)">{highRiskCount} High Risk Wards</Badge>
            <Badge color="#22C55E" bg="rgba(34,197,94,0.12)">{activePatrols} Active Patrols</Badge>
            <Badge color="#F97316" bg="rgba(249,115,22,0.12)">{[].length} Alerts</Badge>
          </div>

          {/* Toggle sidebar button for mobile */}
          <button
            onClick={() => setShowSidebarMobile((v) => !v)}
            className="lg:hidden px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10 bg-slate-800/80 text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            {showSidebarMobile ? "Hide Panel" : "Filters & Wards"}
          </button>
        </div>
      </div>

      {/* Main Container: Split View on Desktop, Map-First on Mobile */}
      <div className="flex-1 flex gap-2 sm:gap-3 min-h-0 overflow-hidden relative">
        {/* Sidebar Panel (Desktop & Mobile Slide-Over) */}
        <div
          className={`
            lg:w-72 xl:w-80 shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1 transition-all duration-300 z-30
            ${showSidebarMobile ? "absolute inset-0 bg-slate-950/95 p-3 rounded-xl border border-white/10 z-40" : "hidden lg:flex"}
          `}
        >
          {showSidebarMobile && (
            <div className="flex items-center justify-between pb-2 border-b border-white/10 lg:hidden">
              <span className="text-xs font-bold text-slate-100">Ward Risk & Analytics Panel</span>
              <button onClick={() => setShowSidebarMobile(false)} className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5">
                Close ✕
              </button>
            </div>
          )}

          {/* Ward Risk Scores */}
          <Card className="!p-0 overflow-hidden shrink-0">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">Ward Risk Scores</h3>
              {selectedWard && (
                <button
                  onClick={() => setSelectedWard(null)}
                  className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
              {wards.map(([name, data]) => {
                const conf = RISK_CONFIG[data.level];
                const isSelected = selectedWard === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedWard(isSelected ? null : name);
                      if (showSidebarMobile) setShowSidebarMobile(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 transition-all text-left cursor-pointer hover:bg-white/[0.03]"
                    style={{ backgroundColor: isSelected ? "rgba(59,130,246,0.15)" : "transparent" }}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conf.dot }} />
                      <span className="text-xs text-slate-200 truncate">{name}</span>
                      {data.festival_flag && <span className="text-[10px]" title="Festival active">🎉</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono font-semibold" style={{ color: conf.color }}>{data.risk_score}</span>
                      <Badge color={conf.color} bg={conf.bg}>{data.level}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Filters Card */}
          <Card className="p-2.5 sm:p-3 shrink-0">
            <h3 className="text-xs font-semibold mb-2 text-[var(--muted-foreground)]">Heatmap Filters</h3>
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--muted-foreground)]">Time Window</span>
                  <span className="font-mono text-blue-400 font-semibold">{filterDays} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={90}
                  value={filterDays}
                  onChange={(e) => setFilterDays(+e.target.value)}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
                />
              </div>

              <div>
                <label className="text-[11px] mb-1 block text-[var(--muted-foreground)]">Crime Category</label>
                <select
                  value={selectedCrimeType}
                  onChange={(e) => setSelectedCrimeType(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none bg-slate-900 border border-white/10 text-slate-200"
                >
                  <option value="">All Crime Categories</option>
                  {["Theft", "Assault", "Robbery", "Cyber Crime", "Stalking", "Murder"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Patrol Units */}
          <Card className="p-2.5 sm:p-3 shrink-0">
            <h3 className="text-xs font-semibold mb-2 text-[var(--muted-foreground)]">Active PCR Units</h3>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {patrols.map((unit) => (
                <div key={unit.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Car size={12} style={{ color: unit.status === "active" ? "#22C55E" : unit.status === "responding" ? "#EF4444" : "#64748B" }} />
                    <span className="text-xs font-medium text-slate-200">{unit.name}</span>
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
        </div>

        {/* Map Container */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 min-h-0 flex flex-col bg-slate-950">
          <RealAhmedabadOpenStreetMap
            cases={filteredCases}
            selectedWard={selectedWard}
            showWards={true}
            showPatrols={true}
            patrols={patrols}
            showCCTV={false}
            showHeatmap={showAIHeatmap}
            wardsData={wardsData}
            height="100%"
          />

          {/* Ward selection banner overlay */}
          {selectedWard && (
            <div className="absolute top-2 left-2 z-[1000] px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/90 text-white shadow-xl flex items-center gap-2 backdrop-blur-md">
              <span>Ward Active: {selectedWard}</span>
              <button
                onClick={() => setSelectedWard(null)}
                className="ml-1 text-white/80 hover:text-white hover:bg-white/20 px-1.5 py-0.5 rounded text-[10px]"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute bottom-2 right-2 z-[1000] px-2.5 py-1 rounded-xl text-[10px] font-medium backdrop-blur-md bg-slate-900/80 text-white border border-white/15 flex items-center gap-2.5 shadow-lg">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EA4335]" /> High</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FBBC04]" /> Med</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#34A853]" /> Low</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cases Page ───────────────────────────────────────────────────────────────


// ─── Case Detail Page ─────────────────────────────────────────────────────────


// ─── AI Co-Pilot Widget for FIR Entry ──────────────────────────────────────────

function AICoPilotWidget({ form, update }: { form: any; update: (k: string, v: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Greetings Officer. I am your AI Co-Pilot trained on BNS (Bharatiya Nyaya Sanhita) and BNSS statutory provisions. Ask me to analyze the narrative, suggest applicable sections, or verify FIR details.",
    },
  ]);

  const { token } = useApp();

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim()) return;

    const userMsg = { role: "user" as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: q, case_data: form })
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "Analysis complete.";
      setMessages((prev) => [...prev, { role: "ai" as const, text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai" as const, text: "Error connecting to AI backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outlined"
        size="sm"
        className={isOpen ? "bg-[var(--accent)]" : ""}
      >
        <Bot size={13} /> AI Co-Pilot
      </Button>

      {isOpen && (
        <div className="p-3.5 rounded-2xl bg-[var(--popover)] border border-[var(--border)] shadow-lg flex flex-col gap-3 animate-fadeIn mt-1 w-full col-span-full">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            <span className="flex items-center gap-1.5 text-[var(--primary)]">
              <Bot size={16} /> AI Co-Pilot Assistant
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl text-[11px] font-medium leading-relaxed max-w-[88%] ${
                  m.role === "user"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] ml-auto"
                    : "bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] mr-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[11px] text-[var(--primary)] animate-pulse mr-auto">
                AI Co-Pilot analyzing...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSend())}
              placeholder="Ask AI Co-Pilot to analyze narrative or suggest sections..."
              className="flex-1 bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="p-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer transition-all shadow-md"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FIR Entry Page ───────────────────────────────────────────────────────────


// ─── AI Assistant Page ────────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "assistant"; content: string; source?: string; ts: string };

function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const { token } = useApp();

  async function sendMessage(textOverride?: string) {
    const textToUse = textOverride || input;
    if (!textToUse.trim()) return;
    
    const userMsg: ChatMsg = { role: "user", content: textToUse, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: textToUse })
      });
      const data = await res.json();
      const aiMsg: ChatMsg = {
        role: "assistant",
        content: data.response || "No response.",
        source: "CrimeGPT",
        ts: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Error connecting to CrimeGPT assistant.", ts: new Date().toISOString() }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Chat panel */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden border bg-[var(--card)] border-[var(--border)] shadow-2xl relative z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-4 border-[var(--border)] bg-gradient-to-r from-blue-900/40 to-[var(--card)] backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">CrimeGPT Assistant</p>
            <p className="text-xs font-medium text-blue-200/60">Advanced Legal & Case Intelligence</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-bold text-emerald-400">Online</span>
             </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-[var(--foreground)] scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center mt-10">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-2xl">
                <Bot size={40} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">How can I assist your investigation?</p>
              <p className="text-sm max-w-md text-[var(--muted-foreground)] leading-relaxed">
                CrimeGPT has access to BNS sections, past FIRs, and cross-district criminal records. 
                Use voice or text to query evidence.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-2xl">
                {["Suggest applicable BNS sections for robbery with injury", "Summarize the recent SG Highway accident", "List modus operandi for chain snatching in West Zone", "Draft a legal notice for absconding suspect"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); sendMessage(q); }}
                    className="p-4 rounded-xl text-sm text-left font-medium transition-all bg-[var(--input)] hover:bg-blue-500/10 hover:border-blue-500/50 text-[var(--foreground)] border border-[var(--border)] shadow-sm hover:shadow-md flex items-start gap-3 group"
                  >
                    <Search size={16} className="text-blue-500 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto", msg.role === "user" ? "bg-slate-700" : "bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]")}>
                  {msg.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                    msg.role === "user"
                      ? "bg-blue-600 text-white border-blue-500 rounded-br-sm"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] rounded-bl-sm"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-xs font-bold", msg.role === "user" ? "text-blue-100" : "text-blue-400")}>
                      {msg.role === "user" ? "Officer" : "CrimeGPT"}
                    </span>
                    {msg.source && (
                      <Badge color={msg.source === "CrimeGPT" ? "#3B82F6" : "#F59E0B"}>{msg.source}</Badge>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start w-full">
              <div className="flex gap-3 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    <Bot size={14} className="text-white" />
                 </div>
                 <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] rounded-bl-sm flex items-center h-[52px]">
                   <div className="flex gap-1.5 items-center">
                     {[0, 1, 2].map((d) => (
                       <div key={d} className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] z-20">
          <div className="relative flex items-end gap-2 bg-[var(--input)] border border-[var(--border)] rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner">
            <div className="pb-1.5 pl-1">
              <VoiceInputWidget compact onTranscript={(t) => setInput(prev => prev + " " + t)} />
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask CrimeGPT about cases, laws, or patterns... (Press Enter to send)"
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-2 text-sm outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              rows={1}
            />
            <div className="pb-1 pr-1 flex gap-2">
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className={loading ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-[var(--muted-foreground)] mt-3 font-medium">
            AI generated responses are for investigative reference only and must be verified with official legal documents.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CCTV Page ────────────────────────────────────────────────────────────────

const CAMERA_FEEDS: any[] = [];

const ALERT_COLOR: Record<string, string> = { crowd: "#EF4444", loitering: "#F59E0B", anpr: "#3B82F6" };

function LiveCameraGrid() {
  const [active, setActive] = useState("CCTV-SAT-007");
  const [tick, setTick] = useState(0);
  const [nightVision, setNightVision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [snapshotToast, setSnapshotToast] = useState(false);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 2000); return () => clearInterval(t); }, []);

  const activeCam = CAMERA_FEEDS.find((c) => c.id === active) || CAMERA_FEEDS[0] || { id: "fallback", name: "No Feeds Available", status: "offline", alert: null };
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
    <Card className="!p-0 overflow-hidden rounded-2xl flex flex-col h-full max-h-full min-h-0 border border-white/10" style={{ borderRadius: 16 }}>
      {/* Live Controls Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-wrap gap-1.5 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-none">{activeCam.name}</span>
          <Badge color="#EF4444">{CAMERA_FEEDS.filter((c) => c.status === "live").length} Online</Badge>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <HoverTooltip tip={nightVision ? "Switch to Standard View" : "Enable IR Night-Vision"}>
            <button
              onClick={() => setNightVision((v) => !v)}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-pointer flex items-center gap-1"
              style={{
                backgroundColor: nightVision ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                color: nightVision ? "#4ADE80" : "#94A3B8",
                borderColor: nightVision ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)",
              }}
            >
              <Eye size={10} /> {nightVision ? "IR ON" : "IR OFF"}
            </button>
          </HoverTooltip>

          <HoverTooltip tip="Capture HD Evidence Frame">
            <button
              onClick={captureSnapshot}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer flex items-center gap-1"
            >
              <Camera size={10} /> Snapshot
            </button>
          </HoverTooltip>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] ml-1">
            <Signal size={10} className="text-emerald-500" /> Live Stream
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Main feed viewport */}
        <div className="flex-1 relative overflow-hidden min-h-[140px]" style={{ backgroundColor: nightVision ? "#03170c" : "#050810" }}>
          {/* Snapshot Flash & Toast Notification */}
          {snapshotToast && (
            <div className="absolute top-2 right-2 z-30 px-2.5 py-1 rounded-xl bg-emerald-600/90 text-white text-[10px] font-semibold shadow-xl flex items-center gap-1.5 animate-bounce">
              <CheckCircle size={12} /> Captured to Vault!
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
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20">
                  <Video size={18} className="text-red-500" />
                </div>
                <p className="text-xs font-medium text-red-500">FEED OFFLINE</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Signal lost — maintenance unit dispatched</p>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Faux IR grid */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: nightVision
                      ? "linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)"
                      : "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />

                {/* AI Detection Bounding Boxes */}
                {[{ x: "28%", y: "35%", label: "PERSON 98%" }, { x: "58%", y: "50%", label: "VEHICLE GJ-01" }, { x: "75%", y: "30%", label: "PERSON 94%" }].map((pos, i) => (
                  <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                    <div
                      className="border-2 rounded transition-all"
                      style={{
                        width: 20 + (tick % 3) * 2,
                        height: 36 + (tick % 2) * 2,
                        borderColor: nightVision ? "#4ADE80" : "#3B82F6",
                        boxShadow: nightVision ? "0 0 8px rgba(74,222,128,0.6)" : "0 0 8px rgba(59,130,246,0.5)",
                      }}
                    />
                    <div className="text-[7px] sm:text-[8px] mt-0.5 text-center font-mono font-bold" style={{ color: nightVision ? "#4ADE80" : "#60A5FA" }}>
                      {pos.label}
                    </div>
                  </div>
                ))}

                {/* Alert banner overlay */}
                {activeCam.alert && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse shadow-lg"
                    style={{
                      backgroundColor: ALERT_COLOR[activeCam.alert] + "33",
                      color: ALERT_COLOR[activeCam.alert],
                      border: `1px solid ${ALERT_COLOR[activeCam.alert]}66`,
                    }}
                  >
                    <AlertTriangle size={10} />
                    {activeCam.alert === "crowd" ? "HIGH DENSITY CROWD DETECTED" : activeCam.alert === "loitering" ? "LOITERING ANOMALY" : "ANPR MATCH"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive PTZ Controls overlay */}
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-0.5 bg-slate-900/80 p-1 rounded-full border border-white/10 backdrop-blur-md scale-90 sm:scale-100">
            <HoverTooltip tip="Pan Left">
              <button onClick={() => setPanOffset((p) => ({ ...p, x: p.x + 15 }))} className="p-0.5 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronLeft size={12} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Up">
              <button onClick={() => setPanOffset((p) => ({ ...p, y: p.y + 15 }))} className="p-0.5 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronUp size={12} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Down">
              <button onClick={() => setPanOffset((p) => ({ ...p, y: p.y - 15 }))} className="p-0.5 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronDown size={12} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Pan Right">
              <button onClick={() => setPanOffset((p) => ({ ...p, x: p.x - 15 }))} className="p-0.5 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ChevronRight size={12} />
              </button>
            </HoverTooltip>

            <span className="w-px h-3 bg-white/15 mx-0.5" />

            <HoverTooltip tip="Zoom In">
              <button onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))} className="p-0.5 text-slate-300 hover:text-white transition-all cursor-pointer">
                <ZoomIn size={12} />
              </button>
            </HoverTooltip>
            <HoverTooltip tip="Reset PTZ View">
              <button onClick={resetPTZ} className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer">
                {Math.round(zoomLevel * 100)}%
              </button>
            </HoverTooltip>
          </div>

          {/* HUD Info */}
          <div className="absolute bottom-2 left-2 z-20 flex flex-col gap-0.5 font-mono text-[9px]" style={{ color: nightVision ? "#4ADE80" : "#94A3B8" }}>
            <div>{activeCam.id} · 23.0225° N, 72.5714° E</div>
          </div>
        </div>

        {/* Feeds Sidebar / Bottom thumbnail list on mobile */}
        <div className="flex sm:flex-col gap-2 p-2 overflow-x-auto sm:overflow-y-auto sm:w-40 md:w-48 bg-slate-900/50 border-t sm:border-t-0 sm:border-l border-white/10 shrink-0">
          <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] mb-0.5 hidden sm:block">Available Feeds</p>
          {CAMERA_FEEDS.map((cam) => (
            <button
              key={cam.id}
              onClick={() => { setActive(cam.id); resetPTZ(); }}
              className="shrink-0 rounded-xl overflow-hidden text-left transition-all relative cursor-pointer"
              style={{
                width: 140, height: 78,
                backgroundColor: "rgba(0,0,0,0.4)",
                border: active === cam.id ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ height: "100%", background: "radial-gradient(rgba(16, 185, 129, 0.2) 0%, rgba(0, 50, 0, 0.6) 100%)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", left: "0px", right: "0px", top: "8%", height: "2px", background: "rgba(16, 185, 129, 0.4)", transition: "none" }}></div>
                <div style={{ position: "absolute", top: "15px", left: "10px", border: "1px solid rgb(16, 185, 129)", borderRadius: "3px", padding: "2px 6px", fontSize: "9px", fontWeight: 700, fontFamily: "\"JetBrains Mono\"", color: "rgb(16, 185, 129)", background: "rgba(16, 185, 129, 0.1)" }}>PERSON x5</div>
                <div style={{ position: "absolute", bottom: "10px", right: "6px", border: "1px solid rgb(245, 158, 11)", borderRadius: "3px", padding: "2px 6px", fontSize: "9px", fontWeight: 700, fontFamily: "\"JetBrains Mono\"", color: "rgb(245, 158, 11)", background: "rgba(245, 158, 11, 0.1)" }}>GJ01MN2222</div>
              </div>
              {cam.status === "offline" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-10">
                  <span className="text-[8px] font-bold text-red-500">OFFLINE</span>
                </div>
              )}
              {cam.alert && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse z-10" style={{ backgroundColor: ALERT_COLOR[cam.alert] }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
                <p className="text-[8px] font-semibold text-slate-100 truncate">{cam.name}</p>
                <p className="text-[7px] font-mono text-slate-400">{cam.id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}



// ─── CrimeGPT Document Studio ──────────────────────────────────────────────────

export function CrimeGPTDocumentStudio({ selectedCase, form }: { selectedCase?: Case | null; form?: any }) {
  const { token } = useApp();
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
  const [showGenModal, setShowGenModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  const c = selectedCase || null;

  useEffect(() => {
    if (!c && (!form || (!form.crime_type && !form.crime_narrative))) {
      setEditableDraft(
        `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, AHMEDABAD\n` +
        `FINAL REPORT / CHARGESHEET UNDER SECTION 193 BNSS, 2023\n\n` +
        `POLICE STATION: Satellite Police Station (HQ-ELL)\n` +
        `DATE OF INCIDENT: ${new Date().toISOString().split("T")[0]}\n` +
        `OFFENCE CATEGORY: LEGAL STATUTORY DRAFT\n` +
        `APPLICABLE SECTIONS: BNSS Statutory Provisions\n\n` +
        `1. CASE DETAILS:\n` +
        `   Select a registered case or prompt CrimeGPT to generate custom statutory documents.\n\n` +
        `PRAYER:\n` +
        `It is humbly prayed that this Hon'ble Court may take cognizance.`
      );
      return;
    }

    const firNo = c?.fir_no || "FIR DRAFT / " + (form?.crime_type ? form.crime_type.toUpperCase() : "STATUTORY");
    const ps = "Satellite Police Station (HQ-ELL)";
    const incDate = c?.crime_date ? c.crime_date.split("T")[0] : (form?.crime_date ? form.crime_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    const crimeType = (c?.crime_type || form?.crime_type || "THEFT").toUpperCase();
    const narrative = c?.crime_narrative || form?.crime_narrative || "Describe the crime incident in detail or use voice input...";
    const location = c?.crime_location || form?.crime_location || "Satellite, Ahmedabad";
    const victim = c?.victim_name || form?.victim_name || "Complainant";
    const victimAddr = c?.victim_address || form?.victim_address || "Ahmedabad";
    const accused = c?.accused_name || form?.accused_name || "Prakash Joshi";
    const accusedAddr = c?.accused_address || form?.accused_address || "77, Chandkheda, Ahmedabad";
    const accusedAge = c?.accused_age || form?.accused_age || "28";
    const bnsSections = c?.bns_sections ? c.bns_sections.join(", ") : "BNS Statutory Provisions";

    if (activeDocType === "chargesheet") {
      setEditableDraft(
        `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, AHMEDABAD\n` +
        `FINAL REPORT / CHARGESHEET UNDER SECTION 193 BNSS, 2023\n\n` +
        `POLICE STATION: ${ps}\n` +
        `DATE OF INCIDENT: ${incDate}\n` +
        `OFFENCE CATEGORY: ${crimeType}\n` +
        `APPLICABLE SECTIONS: ${bnsSections}\n\n` +
        `1. ACCUSED DETAILS:\n` +
        `   Name: ${accused} (Age: ${accusedAge})\n` +
        `   Address: ${accusedAddr}\n\n` +
        `2. VICTIM / COMPLAINANT:\n` +
        `   Name: ${victim}\n` +
        `   Address: ${victimAddr}\n\n` +
        `3. BRIEF FACTS OF THE CASE:\n` +
        `   ${narrative}\n\n` +
        `4. EVIDENCE RECOVERED:\n` +
        `   - CCTV footage from ${location}\n` +
        `   - Stolen personal effects recovered during Panch arrest memo\n` +
        `   - Eyewitness Panch statement under Sec 180 BNSS\n\n` +
        `PRAYER:\n` +
        `It is humbly prayed that this Hon'ble Court may take cognizance.`
      );
    } else if (activeDocType === "remand") {
      setEditableDraft(
        `APPLICATION FOR POLICE CUSTODY REMAND UNDER SECTION 187 BNSS, 2023\n\n` +
        `FIR NO: ${firNo} | POLICE STATION: ${ps}\n` +
        `ACCUSED: ${accused}\n\n` +
        `GROUNDS FOR CUSTODY REMAND:\n` +
        `1. Further recovery of stolen property is pending.\n` +
        `2. Accomplices named during interrogation need to be apprehended.\n` +
        `3. Interrogation required for verification of crime scene trail at ${location}.\n\n` +
        `PRAYER: Request 7 days Police Custody Remand.`
      );
    } else {
      setEditableDraft(
        `SEIZURE MEMO (PANCHANAMA) UNDER SECTION 185 BNSS, 2023\n\n` +
        `FIR NO: ${firNo}\n` +
        `SEIZURE LOCATION: Near ${location}\n` +
        `SEIZED ARTICLES: Articles recovered from suspect / crime scene.\n` +
        `PANCH WITNESS 1: Ramesh Patel\n` +
        `PANCH WITNESS 2: Suresh Shah\n` +
        `INVESTIGATING OFFICER: IO Amit Patel (Badge #IO_ELL_1)`
      );
    }
  }, [c, form?.crime_type, form?.crime_narrative, form?.crime_date, form?.crime_location, form?.victim_name, form?.accused_name, activeDocType]);

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
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-blue-500/40 bg-[var(--card)] shadow-xl rounded-2xl w-full h-full min-h-[310px] animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold">
            <span className="material-symbols-rounded text-base">view_timeline</span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              AI Co-Pilot Document Studio
            </h4>
          </div>
        </div>

        {/* AI Co-Pilot Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              showChatDrawer ? "bg-purple-600 text-white border-purple-500" : "bg-[var(--input)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            <Bot size={13} /> AI Co-Pilot
          </button>
        </div>
      </div>

      {/* Expandable CrimeGPT Chat Assistant Drawer */}
      {showChatDrawer && (
        <div className="my-2 p-3 rounded-xl bg-[var(--popover)] border border-[var(--border)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-1.5">
            <span className="flex items-center gap-1 text-blue-400"><Bot size={14} /> CrimeGPT Legal Assistant</span>
            <button type="button" onClick={() => setShowChatDrawer(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X size={14} />
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto flex flex-col gap-2 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl text-[11px] font-medium leading-relaxed max-w-[90%] ${
                  m.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] mr-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSendPrompt())}
              placeholder="Ask CrimeGPT to update statutory draft..."
              className="flex-1 bg-[var(--input)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendPrompt()}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Editable Document Draft Pane */}
      <div className="my-3 flex-1 bg-slate-950/90 border border-[var(--border)] rounded-xl p-3.5 font-mono text-xs font-bold text-slate-100 leading-relaxed shadow-inner flex flex-col min-h-[160px]">
        <textarea
          value={editableDraft}
          onChange={(e) => setEditableDraft(e.target.value)}
          className="w-full h-full min-h-[160px] flex-1 bg-transparent outline-none resize-none font-mono text-[11px] sm:text-xs font-semibold text-slate-100 leading-relaxed overflow-y-auto"
        />
      </div>

      {/* Document Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] font-mono font-bold">
          <span className="material-symbols-rounded text-xs text-emerald-500">verified</span>
          BNSS Statutory Compliant
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-2.5 py-1 rounded-lg bg-[var(--input)] hover:bg-[var(--accent)] text-[var(--foreground)] text-[11px] font-bold border border-[var(--border)] flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-rounded text-xs">{isCopied ? "check" : "content_copy"}</span>
            {isCopied ? "Copied!" : "Copy Text"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1 rounded-lg bg-[var(--input)] hover:bg-[var(--accent)] text-[var(--foreground)] text-[11px] font-bold border border-[var(--border)] flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-rounded text-xs">print</span>
            Print Draft
          </button>
          <button
            type="button"
            onClick={() => setShowGenModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all"
          >
            <span className="material-symbols-rounded text-xs">description</span> Generate
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!c) { alert("Select a case first"); return; }
              const docRes = await fetch("/api/v1/docs/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ case_id: c.case_id, doc_type: activeDocType === "chargesheet" ? "chargesheet" : (activeDocType === "remand" ? "remand_request" : "panchanama"), language: "en" })
              });
              if (docRes.ok) {
                const blob = await docRes.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${activeDocType}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else { alert("Failed to generate document"); }
            }}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all"
          >
            <Download size={12} /> Export .docx
          </button>
        </div>
      </div>

      <GenerateDocumentModal
        open={showGenModal}
        onClose={() => setShowGenModal(false)}
        caseNo={c?.fir_no || "FIR-STATUTORY-DRAFT"}
      />
    </Card>
  );
}

// ─── Documents Page ───────────────────────────────────────────────────────────

type CreatedDocument = {
  id: string;
  title: string;
  type: string;
  language: string;
  targetLanguage?: string;
  createdAt: string;
  status: "Draft" | "Final" | "Signed";
  content: string;
};


function DocumentsPage() {
  const { cases, token } = useApp();
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>([][0] || null);
  const [searchResults, setSearchResults] = useState<Case[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);

  // New states for managing created documents
  const [createdDocs, setCreatedDocs] = useState<CreatedDocument[]>([]);
  const [editDoc, setEditDoc] = useState<CreatedDocument | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [translateDoc, setTranslateDoc] = useState<CreatedDocument | null>(null);
  const [selectedTargetLang, setSelectedTargetLang] = useState("Hindi");

  function doSearch() {
    setSearchResults(cases.filter((c) =>
      c.fir_no.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.crime_type.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.victim_name.toLowerCase().includes(caseSearch.toLowerCase())
    ));
  }

  const handleDownload = (doc: CreatedDocument, format: string) => {
    alert(`Downloading ${doc.title} as ${format}...`);
  };

  const handleReDownload = (doc: CreatedDocument) => {
    alert(`Re-fetching and downloading ${doc.title}...`);
  };

  const handleEditOpen = (doc: CreatedDocument) => {
    setEditDoc(doc);
    setEditingContent(doc.content);
  };

  const handleEditSave = () => {
    if (editDoc) {
      setCreatedDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, content: editingContent, status: d.status === "Signed" ? "Draft" : d.status } : d));
      setEditDoc(null);
    }
  };

  const handleTranslateOpen = (doc: CreatedDocument) => {
    setTranslateDoc(doc);
    setSelectedTargetLang("Hindi");
  };

  const handleTranslateSubmit = () => {
    if (translateDoc) {
      setCreatedDocs(prev => prev.map(d => d.id === translateDoc.id ? { ...d, targetLanguage: selectedTargetLang } : d));
      setTranslateDoc(null);
      alert(`Translated to ${selectedTargetLang} and starting download...`);
    }
  };

  const handleDelete = (id: string) => {
    setCreatedDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document Studio & Intelligence"
        subtitle="Official statutory document exporter & legal templates"
        action={
          <button
            onClick={() => setShowGenModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-rounded text-sm">description</span> 📄 Generate Document Modal
          </button>
        }
      />

      <div className="flex flex-col gap-6 animate-fade-in-up">
        {/* Case search */}
        <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-foreground)" }}>Select Case Context</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} color="#64748B" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  placeholder="Search by FIR number, victim name, or crime type..."
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
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
                    className="flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer hover:bg-[var(--accent)]"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-sm font-mono" style={{ color: "#38BDF8" }}>{c.fir_no}</span>
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
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] glass-panel">
              <FileText size={16} color="#38BDF8" />
              <span className="text-sm font-mono font-medium" style={{ color: "#38BDF8" }}>{selectedCase.fir_no}</span>
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>·</span>
              <Badge color="#3B82F6">{selectedCase.crime_type}</Badge>
              <Badge color={STATUS_CONFIG[selectedCase.case_status].color}>{STATUS_CONFIG[selectedCase.case_status].label}</Badge>
              <button onClick={() => setSelectedCase(null)} className="ml-auto cursor-pointer p-1 hover:bg-white/10 rounded-md transition-colors">
                <X size={14} color="#94A3B8" />
              </button>
            </div>
          )}

          {/* Created Documents Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--foreground)] font-display tracking-wide">Created Documents</h3>
              <Badge color="#3B82F6">{createdDocs.length} Total</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {createdDocs.map((doc) => {
                return (
                  <Card key={doc.id} className="flex flex-col gap-4 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 border border-blue-500/20">
                          <FileText size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--foreground)] truncate pr-2">{doc.title}</p>
                          <p className="text-xs mt-0.5 text-[var(--muted-foreground)]">{doc.type}</p>
                        </div>
                      </div>
                      <Badge color={doc.status === "Final" ? "#10B981" : doc.status === "Signed" ? "#8B5CF6" : "#F59E0B"}>
                        {doc.status}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-2">
                        <Globe size={12} /> 
                        <span>
                          <span className="text-[var(--foreground)] font-medium">{doc.language}</span>
                          {doc.targetLanguage && (
                            <> <span className="opacity-60">→</span> <span className="text-blue-400 font-medium">{doc.targetLanguage}</span></>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{formatDateTime(doc.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-[var(--border)] flex-wrap">
                      <Button 
                        onClick={() => handleDownload(doc, "PDF")} 
                        variant="filled" 
                        size="sm" 
                        className="flex-1 cursor-pointer justify-center"
                      >
                        <Download size={14} /> PDF
                      </Button>
                      <button 
                        onClick={() => handleReDownload(doc)} 
                        className="p-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] cursor-pointer transition-colors tooltip-trigger"
                        title="Re-fetch / Re-download"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={() => handleTranslateOpen(doc)} 
                        className="p-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] hover:text-blue-400 cursor-pointer transition-colors tooltip-trigger"
                        title="Translate & Download"
                      >
                        <Globe size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditOpen(doc)} 
                        className="p-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] hover:text-amber-400 cursor-pointer transition-colors tooltip-trigger"
                        title="Edit Document"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)} 
                        className="p-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors tooltip-trigger"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                );
              })}
              {createdDocs.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--muted-foreground)] glass-card">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">No documents created yet.</p>
                  <p className="text-xs opacity-70">Use the Generate Document Modal to create a new one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      <GenerateDocumentModal
        open={showGenModal}
        onClose={() => setShowGenModal(false)}
        caseNo={selectedCase?.fir_no || "FIR JAM/2026/0127"}
      />

      {/* Edit Document Modal */}
      <Modal open={!!editDoc} onClose={() => setEditDoc(null)} title="Edit Document Content" width={600}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{editDoc?.title}</span>
            <span>({editDoc?.type})</span>
          </div>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full h-64 p-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-blue-500 resize-none font-mono"
            placeholder="Edit document content..."
          />
          <div className="flex items-center gap-2 justify-end mt-2">
            <Button onClick={() => setEditDoc(null)} variant="outlined">Cancel</Button>
            <Button onClick={handleEditSave} variant="filled" className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Translate Document Modal */}
      <Modal open={!!translateDoc} onClose={() => setTranslateDoc(null)} title="Translate & Download" width={400}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Select a target language to translate <span className="font-semibold text-[var(--foreground)]">{translateDoc?.title}</span>.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Target Language</label>
            <select
              value={selectedTargetLang}
              onChange={(e) => setSelectedTargetLang(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Hindi">Hindi</option>
              <option value="Gujarati">Gujarati</option>
              <option value="Marathi">Marathi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="English">English</option>
            </select>
          </div>
          <div className="flex items-center gap-2 justify-end mt-4">
            <Button onClick={() => setTranslateDoc(null)} variant="outlined">Cancel</Button>
            <Button onClick={handleTranslateSubmit} variant="filled" className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
              <Globe size={16} /> Translate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────



// ─── Profile Page ─────────────────────────────────────────────────────────────


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
  road_path?: [number, number][];
}

const []: PatrolUnitFull[] = [
  { id: "p2", name: "PCR Unit 04", vehicle_no: "GJ-01-CD-5678", officer_in_charge: "SI Amit Patel", phone: "+91 98250 22222", status: "responding", ward: "Naranpura", lat: 23.0607, lon: 72.5554, speed_kmh: 65, fuel_percent: 74, route_id: "r2", type: "Patrol Sedan", last_ping: "1m ago" },
  { id: "p3", name: "PCR Unit 09", vehicle_no: "GJ-01-EF-9012", officer_in_charge: "Ct. Suresh Kumar", phone: "+91 98250 33333", status: "active", ward: "Maninagar", lat: 22.9921, lon: 72.5940, speed_kmh: 35, fuel_percent: 92, route_id: "r3", type: "Quick Response Bike", last_ping: "Just now" },
  { id: "p4", name: "PCR Unit 12", vehicle_no: "GJ-01-GH-3456", officer_in_charge: "SI Rajesh Sharma", phone: "+91 98250 44444", status: "idle", ward: "Ghatlodia", lat: 23.0771, lon: 72.5420, speed_kmh: 0, fuel_percent: 95, route_id: "r1", type: "Interceptor SUV", last_ping: "5m ago" },
  { id: "p5", name: "PCR Unit 15", vehicle_no: "GJ-01-IJ-7890", officer_in_charge: "Insp. Neha Joshi", phone: "+91 98250 55555", status: "active", ward: "Bodakdev", lat: 23.0380, lon: 72.5120, speed_kmh: 38, fuel_percent: 81, route_id: "r2", type: "Patrol Sedan", last_ping: "3m ago" },
  { id: "p6", name: "PCR Unit 18", vehicle_no: "GJ-01-KL-2345", officer_in_charge: "SI Sanjay Varma", phone: "+91 98250 66666", status: "active", ward: "Chandkheda", lat: 23.1100, lon: 72.5800, speed_kmh: 40, fuel_percent: 90, route_id: "r3", type: "Interceptor SUV", last_ping: "1m ago" },
];

const []: PatrolRouteFull[] = [
  {
    id: "r1",
    name: "Satellite - Vastrapur High-Threat Loop",
    ward: "Satellite",
    distance_km: 12.4,
    est_time_mins: 35,
    risk_level: "HIGH",
    color: "#EF4444",
    checkpoints: [
      { name: "Satellite Market Gate #1", lat: 23.0285, lon: 72.5180, done: true, time: "10:15 AM" },
      { name: "Vastrapur Lake Junction", lat: 23.0380, lon: 72.5250, done: true, time: "10:28 AM" },
      { name: "ISCON Cross Roads", lat: 23.0250, lon: 72.5080, done: false },
      { name: "Fun Republic Mall Road", lat: 23.0310, lon: 72.5150, done: false },
    ],
  },
  {
    id: "r2",
    name: "Naranpura - Sola Precinct Surveillance Loop",
    ward: "Naranpura",
    distance_km: 8.7,
    est_time_mins: 24,
    risk_level: "ELEVATED",
    color: "#F97316",
    checkpoints: [
      { name: "Naranpura Police Station", lat: 23.0550, lon: 72.5480, done: true, time: "09:40 AM" },
      { name: "Ankur Cross Roads", lat: 23.0610, lon: 72.5520, done: true, time: "09:55 AM" },
      { name: "Sola Bridge Circle", lat: 23.0700, lon: 72.5350, done: false },
    ],
  },
  {
    id: "r3",
    name: "Maninagar Station Patrol Corridor",
    ward: "Maninagar",
    distance_km: 6.2,
    est_time_mins: 18,
    risk_level: "MEDIUM",
    color: "#F59E0B",
    checkpoints: [
      { name: "Maninagar Railway Station Gate 2", lat: 22.9921, lon: 72.5940, done: true, time: "10:02 AM" },
      { name: "Kankaria Lake Gate 3", lat: 22.9980, lon: 72.6010, done: false },
    ],
  },
];


// ─── App Shell ────────────────────────────────────────────────────────────────


function FloatingChatbot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { token } = useApp();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: input, ts: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: input })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.response || "No response.", source: "CrimeGPT", ts: new Date().toISOString() }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Error connecting to CrimeGPT.", ts: new Date().toISOString() }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="w-[340px] h-[480px] max-h-[70vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-200 pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-3.5 text-white flex justify-between items-center shadow-md">
            <span className="font-bold flex items-center gap-2 text-sm tracking-wide">
               <Bot size={18}/> CrimeGPT Copilot
            </span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors"><X size={18}/></button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-sm bg-[var(--background)]">
            {messages.length === 0 && (
              <div className="text-center text-[var(--muted-foreground)] mt-10 text-xs font-medium">
                I'm your AI Copilot. Ask me anything about ongoing cases, suspect records, or legal codes.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("p-3 rounded-2xl max-w-[85%] shadow-sm", m.role === 'user' ? 'bg-blue-600 text-white ml-auto rounded-br-sm' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] mr-auto rounded-bl-sm')}>
                <div className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</div>
              </div>
            ))}
            {loading && (
               <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-2xl rounded-bl-sm mr-auto max-w-[85%] flex gap-1">
                 {[0, 1, 2].map((d) => (
                   <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                 ))}
               </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] flex gap-2 items-center">
            <input 
              value={input} onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] px-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-[var(--muted-foreground)]" 
              placeholder="Message CrimeGPT..." 
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-blue-600 text-white h-9 w-9 flex items-center justify-center rounded-xl hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"><Send size={14}/></button>
          </div>
        </div>
      )}
      
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(59,130,246,0.5)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.8)] hover:scale-105 transition-all pointer-events-auto border-2 border-white/10 group"
      >
        <Bot size={28} className="group-hover:animate-pulse" />
      </button>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { wsConnected, page } = useApp();
  const isCCTV = page === "cctv";
  const isMap = page === "map";
  const isFitViewport = isCCTV || isMap;

  return (
    <div className={`flex ${isFitViewport ? "h-dvh max-h-dvh min-h-dvh overflow-hidden" : "min-h-dvh"} transition-colors duration-300 text-[var(--foreground)] relative overflow-x-hidden w-full`} style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar wsConnected={wsConnected} />
      {/* Permanent non-moving layout spacer for fixed sidebar */}
      <div className="hidden md:block w-[72px] shrink-0 h-dvh pointer-events-none" />
      <div className={`flex-1 flex flex-col min-w-0 w-full ${isFitViewport ? "h-dvh max-h-dvh overflow-hidden" : "min-h-dvh"}`}>
        <TopBar wsConnected={wsConnected} />
        <main className={`flex-1 w-full ${isFitViewport ? "p-2 sm:p-3 md:p-4 pb-16 md:pb-3 h-full max-h-full min-h-0 overflow-hidden flex flex-col" : "p-2 sm:p-4 md:p-6 pb-20 md:pb-6 flex flex-col"} max-w-7xl 2xl:max-w-[1750px] mx-auto animate-fadeIn`}>
          <div className={`glass-container w-full flex-1 ${isFitViewport ? "p-2 sm:p-3 md:p-4 h-full max-h-full min-h-0 overflow-hidden flex flex-col justify-between" : "p-3 sm:p-5 md:p-8 flex flex-col min-h-[calc(100dvh-6.5rem)]"} shadow-2xl`}>
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <FloatingChatbot />
    </div>
  );
}

// ─── Admin Controls & User Management Page ─────────────────────────────────
interface AdminUser {
  badge: string;
  name: string;
  role: Role;
  status: "Active" | "Inactive";
  station: string;
}

const INITIAL_ADMIN_USERS: AdminUser[] = [];

interface RolePermission {
  key: string;
  label: string;
  category: string;
  matrix: Record<Role, boolean>;
}

const INITIAL_PERMISSIONS: RolePermission[] = [
  { key: "case_read", label: "View Cases", category: "Core Operations", matrix: { constable: true, io: true, sho: true, dcp: true, admin: true } },
  { key: "case_write", label: "Register/Edit FIR", category: "Core Operations", matrix: { constable: false, io: true, sho: true, dcp: true, admin: true } },
  { key: "cctv_view", label: "Access Live CCTV", category: "Surveillance", matrix: { constable: true, io: true, sho: true, dcp: true, admin: true } },
  { key: "patrol_dispatch", label: "Reroute Patrols", category: "Operations", matrix: { constable: false, io: false, sho: true, dcp: true, admin: true } },
  { key: "sys_config", label: "System Configuration", category: "Admin", matrix: { constable: false, io: false, sho: false, dcp: false, admin: true } },
];

interface IAMPolicy {
  id: string;
  name: string;
  description: string;
  level: "Critical" | "High" | "Medium";
  enabled: boolean;
  target: string;
}

const INITIAL_IAM_POLICIES: IAMPolicy[] = [
  { id: "IAM-01", name: "Strict Password Complexity", description: "Require 12+ chars, uppercase, lowercase, numbers, and symbols.", level: "High", enabled: true, target: "All Users" },
  { id: "IAM-02", name: "MFA Enforcement", description: "Mandatory Multi-Factor Authentication for IO, SHO, DCP, and Admin roles.", level: "Critical", enabled: true, target: "IO, SHO, DCP, Admin" },
  { id: "IAM-03", name: "Session Timeout (15m)", description: "Auto-logout users after 15 minutes of inactivity.", level: "Medium", enabled: true, target: "All Users" },
  { id: "IAM-04", name: "Geo-fenced Access", description: "Restrict system access to approved IP ranges and police station networks.", level: "High", enabled: false, target: "All Users" },
];

interface AuditLog {
  id: string;
  ts: string;
  badge: string;
  name: string;
  action: string;
  module: string;
  ip: string;
  status: "Success" | "Warning" | "Denied";
}

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "AL-1", ts: new Date().toISOString(), badge: "ADMIN-001", name: "Supreme Commander", action: "Updated Role Permissions", module: "Admin Settings", ip: "10.0.0.45", status: "Success" },
  { id: "AL-2", ts: new Date().toISOString(), badge: "IO-101", name: "Inspector Mehta", action: "Registered FIR-2026-042", module: "Cases", ip: "192.168.1.12", status: "Success" },
  { id: "AL-3", ts: new Date().toISOString(), badge: "CON-22", name: "Constable Patel", action: "Failed Login Attempt", module: "Authentication", ip: "192.168.1.44", status: "Warning" },
];


// ─── Root Provider & Router ───────────────────────────────────────────────────

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [patrols, setPatrols] = useState<PatrolUnit[]>([]);
  const [cctvAlerts, setCctvAlerts] = useState<CCTVAlert[]>([]);

  const [officer, setOfficer] = useState<Officer | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("samraksha_officer");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          localStorage.removeItem("samraksha_officer");
          return null;
        }
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("samraksha_token");
    }
    return null;
  });
  const [page, setPage] = useState<Page>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "");
      if (path && path !== "login") return path as Page;
    }
    return "dashboard";
  });
  const [params, setParams] = useState<Record<string, string>>({});
  const [wsMessages, setWsMessages] = useState<WSMessage[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("samraksha_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });
  const wsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token || !officer) return;
    async function fetchData() {
      try {
        const headers = { "Authorization": `Bearer ${token}` };
        const [casesRes, patrolsRes, cctvRes] = await Promise.all([
          fetch("/api/v1/cases", { headers }).catch(() => null),
          fetch("/api/v1/patrol/units", { headers }).catch(() => null),
          fetch("/api/v1/cctv", { headers }).catch(() => null)
        ]);
        if (casesRes?.status === 401 || patrolsRes?.status === 401 || cctvRes?.status === 401) {
          logout();
          return;
        }
        if (casesRes?.ok) {
          const c = await casesRes.json();
          setCases(Array.isArray(c) ? c : (c.cases || c.items || []));
        }
        if (patrolsRes?.ok) {
          const p = await patrolsRes.json();
          setPatrols(Array.isArray(p) ? p : p.patrols || []);
        }
        if (cctvRes?.ok) {
          const cc = await cctvRes.json();
          setCctvAlerts(Array.isArray(cc) ? cc : cc.alerts || []);
        }
      } catch (err) {}
    }
    fetchData();
    // Poll every 10s
    const intv = setInterval(fetchData, 10000);
    return () => clearInterval(intv);
  }, [token, officer]);


  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("samraksha_theme", themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || key;
  }, [language]);

  // Real WebSocket events
  useEffect(() => {
    if (!officer || !token) return;
    setWsConnected(false);
    
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Remove token from query parameters per P1-02
    const ws = new WebSocket(`${wsProto}//${window.location.host}/api/v1/ws/dashboard`);
    
    ws.onopen = () => {
      // Send token immediately upon connection
      ws.send(token);
      setWsConnected(true);
    };
    
    ws.onclose = () => setWsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "INIT") return;
        setWsMessages(prev => [data, ...prev].slice(0, 10));
      } catch (e) {}
    };

    return () => {
      ws.close();
      setWsConnected(false);
    };
  }, [officer, token]);

  const navigate = useCallback((p: Page, newParams?: Record<string, string>) => {
    setPage(p);
    setParams(newParams || {});
    if (typeof window !== "undefined") {
      const url = p === "dashboard" ? "/" : `/${p}`;
      const search = newParams && Object.keys(newParams).length ? "?" + new URLSearchParams(newParams).toString() : "";
      window.history.pushState({ page: p, params: newParams }, "", url + search);
    }
  }, []);

  useEffect(() => {
    // Ensure the initial history entry has state so back-navigation works perfectly
    if (typeof window !== "undefined" && (!window.history.state || !window.history.state.page)) {
      window.history.replaceState({ page, params }, "", window.location.pathname + window.location.search);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setPage(e.state.page);
        setParams(e.state.params || {});
      } else {
        const path = window.location.pathname.replace(/^\//, "").split("/")[0];
        setPage(path ? (path as Page) : "dashboard");
        setParams(Object.fromEntries(new URLSearchParams(window.location.search).entries()));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [page, params]);

  async function login(badge_no: string, password: string) {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_no, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Invalid credentials.");
    }
    const data = await res.json();
    setOfficer(data.officer);
    setToken(data.access_token);
    localStorage.setItem("samraksha_officer", JSON.stringify(data.officer));
    localStorage.setItem("samraksha_token", data.access_token);
    const allowed = NAV_ITEMS.find((i) => i.roles.includes(data.officer.role));
    navigate(allowed?.id || "dashboard");
  }

  async function logout() {
    if (token) {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).catch(() => {});
    }
    setOfficer(null);
    setToken(null);
    localStorage.removeItem("samraksha_officer");
    localStorage.removeItem("samraksha_token");
    setWsMessages([]);
    navigate("login");
  }

  const ctx: AppCtx = {
    cases,
    patrols,
    cctvAlerts,
    officer,
    token,
    login,
    logout,
    page,
    navigate,
    params,
    wsMessages,
    wsConnected,
    language,
    setLanguage,
    t,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

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
      case "admin": return <AdminPage />;
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

export {
  timeAgo, MapPage, cn, WS_COLOR, Chip, QuickViewModal, Select, NAV_ITEMS, LoginPage, CAMERA_FEEDS, Modal, formatDateTime, SegmentedChartCard, HoverTooltip, AnalyticsPage, Button, PageHeader, AssistantPage, createGoogleTeardropPin, ALERT_COLOR, Card, CCTV_LOCATIONS, ROLE_CONFIG, LiveCameraGrid, DocumentsPage, ScenarioSimulationControlDeck, AHMEDABAD_WARD_LOCATIONS, FIREntryPage, StatCard, Badge, Ctx, Sidebar, RealAhmedabadOpenStreetMap, CaseDetailPage, STATUS_CONFIG, TopBar, BottomNav, VoiceInputWidget, CHART_COLORS, AICoPilotWidget, AHMEDABAD_WARDS, formatTime, formatDate, GenerateDocumentModal, Input, RISK_CONFIG, AppShell, INITIAL_ADMIN_USERS, useApp, downloadCasesCSV, INITIAL_AUDIT_LOGS, INITIAL_PERMISSIONS, INITIAL_IAM_POLICIES
};
export type { DiaryEntry, AuditLog, AppCtx, CreatedDocument, RolePermission, Officer, WSMessage, GenerateDocumentModalProps, Page, ChatMsg, AdminUser, CCTVAlert, Case, IAMPolicy, Role, PatrolUnitFull, NavItem, PatrolRouteFull, PatrolUnit, CaseStatus };
