import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useApp, Officer, Case, CCTVAlert, PatrolUnit, CaseStatus, Role, DiaryEntry, Button, Card, Input, Select, Modal, Badge, Chip, QuickViewModal, CrimeGPTDocumentStudio, STATUS_CONFIG, RISK_CONFIG, ROLE_CONFIG, PREDICTIVE_HEATMAP_ZONES, downloadCasesCSV, AppCtx, cn, WS_COLOR, CreatedDocument, NAV_ITEMS, CAMERA_FEEDS, RolePermission, formatDateTime, SegmentedChartCard, HoverTooltip, WSMessage, GenerateDocumentModalProps, PageHeader, Page, createGoogleTeardropPin, ChatMsg, ALERT_COLOR, AdminUser, CCTV_LOCATIONS, LiveCameraGrid, ScenarioSimulationControlDeck, AHMEDABAD_WARD_LOCATIONS, StatCard, TRANSLATIONS, Ctx, Sidebar, RealAhmedabadOpenStreetMap, TopBar, BottomNav, VoiceInputWidget, IAMPolicy, CHART_COLORS, PatrolUnitFull, AICoPilotWidget, NavItem, AHMEDABAD_WARDS, formatTime, formatDate, GenerateDocumentModal, PatrolRouteFull, AppShell, INITIAL_ADMIN_USERS, INITIAL_AUDIT_LOGS, INITIAL_PERMISSIONS, INITIAL_IAM_POLICIES, AuditLog, timeAgo } from '../App';
export default function CCTVPage() {
  const { cctvAlerts } = useApp();
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());
  const [quickCase, setQuickCase] = useState<Case | null>(null);

  const filtered = cctvAlerts.filter((a) => filter === "all" || a.alert_type === filter);

  const alertTypeConf: Record<string, { color: string; label: string }> = {
    crowd_density: { color: "#EF4444", label: "Crowd" },
    loitering: { color: "#F59E0B", label: "Loitering" },
    anomaly: { color: "#8B5CF6", label: "Anomaly" },
    anpr: { color: "#3B82F6", label: "ANPR" },
  };

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 justify-between gap-2 sm:gap-3 overflow-hidden">
      {/* Header Row: Title + Refresh + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-pulse" />
            CCTV Monitoring
          </h1>
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
            Live Stream Feeds · Refreshed {formatTime(lastRefresh)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter chips */}
          <div className="flex gap-1 overflow-x-auto max-w-full py-0.5 no-scrollbar">
            {["all", "crowd_density", "loitering", "anomaly", "anpr"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: filter === f ? "#3B82F6" : "rgba(255,255,255,0.05)",
                  color: filter === f ? "#fff" : "#94A3B8",
                  border: filter === f ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {f === "all" ? "All" : alertTypeConf[f]?.label || f}
              </button>
            ))}
          </div>

          <Button onClick={() => setLastRefresh(new Date().toISOString())} variant="outlined" size="sm" className="!py-1 !px-2.5 text-xs">
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal caseData={quickCase} onClose={() => setQuickCase(null)} />

      {/* Main Grid: 2 columns on lg, stacked on smaller screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Column (lg:col-span-7): Live Camera Feed + Stat Cards */}
        <div className="lg:col-span-7 flex flex-col gap-2 sm:gap-3 min-h-0 overflow-hidden">
          {/* Camera Feed */}
          <div className="flex-1 min-h-[150px] max-h-[55vh] flex flex-col min-w-0 overflow-hidden border border-[var(--border)] rounded-2xl bg-[var(--input)]/20 relative">
            <video src="/cctv_feed.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
            {Object.entries(alertTypeConf).map(([type, conf]) => (
              <StatCard
                key={type}
                title={conf.label}
                value={cctvAlerts.filter((a) => a.alert_type === type).length}
                icon={Camera}
                color={conf.color}
              />
            ))}
          </div>
        </div>

        {/* Right Column (lg:col-span-5): Alert Feed + Camera Map */}
        <div className="lg:col-span-5 flex flex-col gap-2 sm:gap-3 min-h-0 overflow-hidden">
          {/* Alert Feed - Internal Scrolling */}
          <div className="flex-1 min-h-[120px] overflow-y-auto pr-1 flex flex-col gap-2">
            {filtered.map((alert) => {
              const conf = alertTypeConf[alert.alert_type];
              const confPct = Math.round(alert.confidence * 100);
              const matchedCase = alert.matched_fir
                ? [].find((c) => c.fir_no === alert.matched_fir)
                : null;

              return (
                <Card key={alert.id} className="rounded-xl p-2.5 sm:p-3 shrink-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground)", fontFamily: "JetBrains Mono, monospace" }}>{alert.camera_id}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{alert.source} · {timeAgo(alert.ts)}</p>
                    </div>
                    <Badge color={conf?.color} bg={conf?.color + "22"}>{conf?.label || alert.alert_type}</Badge>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span style={{ color: "var(--muted-foreground)" }}>Confidence</span>
                      <span style={{ color: confPct >= 50 ? "#22C55E" : "#F59E0B" }}>{confPct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${confPct}%`, backgroundColor: confPct >= 50 ? "#22C55E" : "#F59E0B" }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex flex-wrap gap-1 items-center text-[10px]">
                      {alert.person_count && (
                        <Chip><User size={10} className="mr-0.5" />{alert.person_count}</Chip>
                      )}
                      {alert.plate_no && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#93C5FD" }}>
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
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn size={10} /> Quick View
                        </button>
                      </HoverTooltip>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Camera Map */}
          <div className="h-[clamp(110px,22vh,200px)] shrink-0 rounded-xl overflow-hidden relative border border-white/10">
            <RealAhmedabadOpenStreetMap 
               showWards={false} 
               showPatrols={false} 
               showCCTV={true} 
               cctvAlerts={cctvAlerts}
               cases={[]}
               height="100%"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium pointer-events-none z-[1000] bg-slate-900/80 text-slate-300 border border-white/10">
              Camera Coverage Map
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
