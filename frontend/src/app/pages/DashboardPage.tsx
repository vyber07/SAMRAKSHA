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
export default function DashboardPage() {
  const { wsMessages, navigate, cases, patrols, cctvAlerts, t } = useApp();
  const [quickCase, setQuickCase] = useState<Case | null>(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem("samraksha_token");
    fetch("/api/v1/analytics/summary", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(console.error);
  }, []);

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
        <StatCard title={t("registered_firs")} value={summary.firs_today || 0} change={summary.firs_today_change || 0} icon={FileText} color="#004B87" tooltip="Total new cases registered today across all police stations" />
        <StatCard title={t("active_cases")} value={cases.filter((c) => c.case_status === "open").length} change={4} icon={Activity} color="#006B5E" tooltip="Cases currently under active investigation" />
        <StatCard title="Predictive Score" value={`${summary.predictive_score || 0}/100`} change={3} icon={Cpu} color="#8B5CF6" tooltip="AI predictive threat score index" />
        <StatCard title={t("high_risk_wards")} value={summary.high_risk_zones || 0} icon={TriangleAlert} color="#EF4444" tooltip="Wards with high risk score — requiring immediate attention" />
        <StatCard title="Open Cases" value={cases.filter((c) => c.case_status === "open").length} change={-5} icon={Clock} color="#D97300" tooltip="Cases awaiting final disposition" />
        <StatCard title={t("solved_cases")} value={cases.filter((c) => c.case_status === "closed").length} change={18} icon={CheckCircle} color="#006B5E" tooltip="Successfully resolved or chargesheeted cases" />
      </div>

      {/* Row 2: Separated {t("recent_notifs")} & {t("quick_actions")} Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* {t("recent_notifs")} Card */}
        <Card className="p-5 animate-fade-in-up flex flex-col justify-between h-[280px]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="type-title font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-lg">notifications</span>
              {t("recent_notifs")}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)] font-medium bg-[var(--input)] px-2 py-0.5 rounded-full border border-[var(--border)]">{wsMessages.length} received</span>
          </div>
          <div className="quick-notif-list flex-1 overflow-y-auto mt-2">
            {wsMessages.length === 0 ? (
              <div className="type-body quick-empty text-[var(--muted-foreground)] py-8 text-center text-xs flex flex-col items-center gap-1">
                <span className="material-symbols-rounded text-2xl opacity-40">notifications_off</span>
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2 pr-1">
                {wsMessages.slice(0, 6).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs bg-[var(--input)] border border-[var(--border)] shadow-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: WS_COLOR[m.type] || "#3B82F6" }} />
                    <span className="truncate flex-1 text-[var(--foreground)] font-medium">{m.payload}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] flex-shrink-0">{timeAgo(m.ts)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* {t("quick_actions")} Card */}
        <Card className="p-5 animate-fade-in-up flex flex-col justify-between h-[280px]">
          <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
            <span className="type-title font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="material-symbols-rounded text-amber-500 text-lg">bolt</span>
              {t("quick_actions")}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">{t("shortcuts")}</span>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 pt-3">
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all cursor-pointer group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("fir-entry")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" style={{ fontSize: "28px" }}>add_circle</span>
              <span className="font-semibold text-xs text-[var(--foreground)]">New FIR</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 transition-all cursor-pointer group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("patrol")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-teal-600 dark:text-teal-400" style={{ fontSize: "28px" }}>local_police</span>
              <span className="font-semibold text-xs text-[var(--foreground)]">Patrol Units</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-all cursor-pointer group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("assistant")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400" style={{ fontSize: "28px" }}>smart_toy</span>
              <span className="font-semibold text-xs text-[var(--foreground)]">AI Assistant</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all cursor-pointer group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("documents")}
            >
              <span className="material-symbols-rounded group-hover:scale-110 transition-transform text-amber-600 dark:text-amber-400" style={{ fontSize: "28px" }}>description</span>
              <span className="font-semibold text-xs text-[var(--foreground)]">Documents</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Segmented Chart & Ward Hotspot Map Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[360px] flex flex-col">
          <SegmentedChartCard />
        </div>

        {/* Ward Hotspot Map Widget */}
        <Card className="h-[360px] flex flex-col justify-between p-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" />
              <span className="font-semibold text-sm text-[var(--foreground)]">Ward Hotspot Map</span>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-[var(--input)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              aria-label="Refresh map"
              onClick={() => setMapRefreshKey((k) => k + 1)}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="flex-1 relative mt-2 overflow-hidden rounded-xl border border-[var(--border)]">
            <RealAhmedabadOpenStreetMap
              key={mapRefreshKey}
              cases={cases}
              onSelectCase={(c) => setQuickCase(c)}
              showWards={true}
              showPatrols={true}
              patrols={patrols}
              showCCTV={false}
              isDashboard={true}
              height="100%"
            />
            <div className="absolute bottom-2 right-2 z-[400] px-3 py-1.5 rounded-xl text-[10px] font-medium backdrop-blur-md bg-black/70 text-white border border-white/20 flex items-center gap-3 shadow-lg">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EA4335]" /> High</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FBBC04]" /> Medium</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#34A853]" /> Low</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Event Feed (Half Width) & Camera Alerts Card (Half Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Events Feed */}
        <Card className=" animate-fade-in-up p-5 flex flex-col justify-between h-[380px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>Live Events Feed</h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#22C55E" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              WebSocket Live
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 mt-2">
            {wsMessages.length === 0 ? (
              <p className="text-sm text-center py-12 text-[var(--muted-foreground)]">Awaiting events...</p>
            ) : (
              wsMessages.slice(0, 10).map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: WS_COLOR[m.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--foreground)] font-medium">{m.payload}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{timeAgo(m.ts)} · {m.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Camera Alerts Panel */}
        <Card className="animate-fade-in-up p-5 flex flex-col justify-between h-[380px]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-red-500" />
              <span className="font-semibold text-sm text-[var(--foreground)]">Camera Alerts</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </span>
            </div>
            <button className="text-xs text-blue-500 hover:underline font-medium cursor-pointer" onClick={() => navigate("cctv")}>
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 mt-2">
            {cctvAlerts.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted-foreground)] py-8">No live alerts</div>
            ) : (
              cctvAlerts.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--input)]/20 hover:bg-[var(--input)]/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: alert.alert_type === "critical" ? "#EF4444" : "#F97316" }} />
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground)]">{alert.camera_id} · {alert.source}</div>
                      <div className="text-xs text-[var(--foreground)]/80 mt-0.5">{alert.alert_type} ({Math.round(alert.confidence * 100)}%)</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                        <span>{alert.id}</span>
                        <span>·</span>
                        <span>{timeAgo(alert.ts)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-[var(--input)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    onClick={() => navigate("cctv")}
                    title="Open CCTV View"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
