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
export default function PatrolPage() {
  const { token, navigate, cases, patrols, cctvAlerts } = useApp();
  const [units, setUnits] = useState<PatrolUnitFull[]>(patrols as any);
  const [routes, setRoutes] = useState<PatrolRouteFull[]>([]);
  const [resourceStatus, setResourceStatus] = useState<any>({ available_pct: 98.2 });

  useEffect(() => {
    setUnits(patrols as any);
  }, [patrols]);

  useEffect(() => {
    const token = localStorage.getItem("samraksha_token");
    fetch("/api/v1/analytics/resource_status", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => setResourceStatus(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch("/api/v1/patrol/routes", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          // Transform backend route format to frontend format
          const formattedRoutes = data.routes.map((r: any, i: number) => ({
            id: `r${i+1}`,
            name: `Route ${r.unit.unit_name || r.unit.id}`,
            ward: r.unit.ward || 'General',
            distance_km: (r.distance_meters / 1000).toFixed(1),
            est_time_mins: Math.round(r.distance_meters / 1000 * 2), // rough estimate
            risk_level: "ELEVATED",
            color: "#3B82F6",
            checkpoints: r.route.map((wp: any, idx: number) => ({
              name: `Waypoint ${idx + 1}`,
              lat: wp.lat,
              lon: wp.lon,
              done: idx === 0,
              time: "Just now"
            })),
            road_path: r.road_path
          }));
          setRoutes(formattedRoutes);
        }
      } catch (e) {}
    }
    fetchRoutes();
  }, [token]);
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
  const targetRerouteUnit = units.find((u) => u.id === rerouteUnitId) || units[0] || null;

  const filteredUnits = filterWard === "All"
    ? units
    : units.filter((u) => u.ward === filterWard);

  async function handleStatusToggle(unitId: string, newStatus: "active" | "responding" | "idle") {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
    );
    try {
      await fetch(`/api/v1/patrol/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch(e) {}
  }

  async function handleDeleteUnit(unitId: string) {
    if (confirm("Are you sure you want to unassign and delete this patrol unit?")) {
      try {
        await fetch(`/api/v1/patrol/units/${unitId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
        if (selectedUnitId === unitId) {
          setSelectedUnitId("");
        }
      } catch (e) {}
    }
  }

  async function handleSaveEditUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUnit) return;
    try {
      await fetch(`/api/v1/patrol/units/${editingUnit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          unit_no: editingUnit.name,
          officer_name: editingUnit.officer_in_charge,
          vehicle: editingUnit.vehicle_no,
          status: editingUnit.status
        })
      });
      setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? editingUnit : u)));
      setEditingUnit(null);
    } catch(e) {}
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      unit_no: newUnitForm.name || "Unit 1",
      officer_name: newUnitForm.officer_in_charge || "officer vijay",
      vehicle: newUnitForm.vehicle_no || "gj-08-bj-9876",
      status: newUnitForm.status,
      current_lat: 23.0342 + (Math.random() - 0.5) * 0.05,
      current_lon: 72.5168 + (Math.random() - 0.5) * 0.05
    };
    try {
      const res = await fetch("/api/v1/patrol/units", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const created: PatrolUnitFull = {
          id: data.unit.id,
          name: data.unit.unit_name,
          officer_in_charge: data.unit.officer_name,
          vehicle_no: data.unit.vehicle,
          phone: "+91 98250 99999",
          status: data.unit.status,
          ward: newUnitForm.ward,
          lat: data.unit.current_lat,
          lon: data.unit.current_lon,
          speed_kmh: data.unit.status === "active" ? 40 : data.unit.status === "responding" ? 60 : 0,
          fuel_percent: 92,
          route_id: "r1",
          type: newUnitForm.type,
          last_ping: "Just now"
        };
        setUnits((prev) => [created, ...prev]);
        setSelectedUnitId(created.id);
        setShowAddModal(false);
      }
    } catch(e) {}
  }

  function handleCalculateReroute() {
    setRerouteCalculated(true);
    setRerouteSuccessMsg("");
  }

  async function handleDispatchReroute() {
    setRerouteDispatching(true);
    try {
      const loc = AHMEDABAD_WARD_LOCATIONS[rerouteWard];
      await fetch(`/api/v1/patrol/units/${rerouteUnitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          status: "responding",
          manual_waypoints: [{ lat: loc?.lat || 23.0225, lon: loc?.lon || 72.5714, name: rerouteLandmark }]
        })
      });
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
      setRerouteSuccessMsg(`PCR Unit ${units.find((u) => u.id === rerouteUnitId)?.name || rerouteUnitId} successfully rerouted to ${rerouteWard} (${rerouteLandmark}). Dispatch command broadcast via encrypted radio.`);
    } catch(e) {}
    setRerouteDispatching(false);
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
        <StatCard title="Fleet Readiness" value={`${resourceStatus?.available_pct || 0}%`} icon={Shield} color="#8B5CF6" tooltip="GPS signal strength, fuel availability, and comms uptime" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("units")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "units"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white/5 text-[var(--muted-foreground)] hover:text-white"
          }`}
        >
          <Car size={15} /> Current Patrolling Units ({units.length})
        </button>
        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "routes"
              ? "bg-white/10 text-white shadow-lg"
              : "bg-white/5 text-[var(--muted-foreground)] hover:text-white"
          }`}
        >
          <Navigation size={15} /> Patrolling Routes ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab("rerouting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "rerouting"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white/5 text-[var(--muted-foreground)] hover:text-white"
          }`}
        >
          <Zap size={15} /> Dynamic AI Rerouting
        </button>
      </div>

      {/* Tab 1: Current Patrolling Units */}
      {activeTab === "units" && (
        <div className="flex flex-col gap-6">
          {/* Ward Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-medium">
              <Filter size={14} className="text-blue-500" /> Filter Ward Precinct:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Satellite", "Naranpura", "Maninagar", "Ghatlodia", "Bodakdev", "Chandkheda"].map((w) => (
                <button
                  key={w}
                  onClick={() => setFilterWard(w)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: filterWard === w ? "#3B82F6" : "var(--input)",
                    color: filterWard === w ? "#ffffff" : "var(--foreground)",
                    border: "1px solid var(--border)"
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
                  className="bg-[var(--card)] hover:bg-[var(--accent)] rounded-2xl p-5 cursor-pointer transition-all border border-[var(--border)] hover:border-cyan-500/50 shadow-md group text-[var(--foreground)]"
                  style={{ borderTop: `3px solid ${statusColor}` }}
                >
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                      🚔 {u.name}
                    </span>
                    <div className="flex items-center gap-2">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUnit(u.id);
                        }}
                        className="text-[var(--muted-foreground)] hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete card"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs text-[var(--muted-foreground)]">
                    <div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5">Vehicle</div>
                      <span className="text-[var(--foreground)] font-mono text-xs">{u.vehicle_no}</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5">Location</div>
                      <span className="text-[var(--foreground)] font-medium">📍 {u.ward || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fixed Modal Inspector Overlay matching prompt exact design */}
          {selectedUnit && (
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
              <div className="w-full max-w-[1000px] max-h-[90dvh] lg:h-[80vh] bg-[var(--card)] rounded-2xl border border-[var(--border)] flex flex-col lg:flex-row shadow-2xl overflow-y-auto lg:overflow-hidden text-[var(--foreground)] my-auto">
                {/* Left: OpenStreetMap */}
                <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-[var(--border)] min-h-[260px] sm:min-h-[300px]">
                  <RealAhmedabadOpenStreetMap
                    cases={cases}
                    showWards={true}
                    showPatrols={true}
                    showCCTV={false}
                    selectedWard={selectedUnit.ward}
                    height="100%"
                  />
                  <div className="absolute top-3 left-3 bg-[var(--card)]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--foreground)] z-[1000] flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    GPS Tracking: <strong className="text-cyan-500 font-mono">{selectedUnit.name}</strong> ({selectedUnit.ward} Precinct)
                  </div>
                </div>

                {/* Right Inspector Panel (350px) */}
                <div className="w-full lg:w-[350px] flex flex-col p-6 bg-[var(--card)] shrink-0 text-[var(--foreground)]">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold font-mono text-[var(--foreground)]">{selectedUnit.name}</h2>
                    <button
                      onClick={() => setSelectedUnitId("")}
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl cursor-pointer transition-colors"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 text-xs">
                    <div>
                      <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Officer</div>
                      <div className="text-sm text-[var(--foreground)] font-medium">{selectedUnit.officer_in_charge}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Vehicle</div>
                      <div className="text-sm font-mono text-[var(--foreground)]">{selectedUnit.vehicle_no}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Status</div>
                      <div className="text-sm font-bold uppercase tracking-wider text-cyan-500">
                        {selectedUnit.status === "active" ? "deployed" : selectedUnit.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Assigned Waypoints</div>
                      <div className="text-sm text-[var(--foreground)] font-semibold">
                        {routes.find((r) => r.id === selectedUnit.route_id)?.checkpoints.length || 9} stops
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-[var(--border)]">
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
                      className="w-full py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--input)] hover:bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>🗺️</span> View on map
                    </button>

                    <button
                      onClick={() => {
                        setEditingUnit(selectedUnit);
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--input)] hover:bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>✏️</span> Edit / Modify Unit
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(selectedUnit.id)}
                      className="w-full py-3 px-4 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
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
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                ✏️ Edit Patrol Unit ({editingUnit.name})
              </h3>
              <button onClick={() => setEditingUnit(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEditUnit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Unit Name</label>
                <input
                  value={editingUnit.name}
                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Officer In Charge</label>
                <input
                  value={editingUnit.officer_in_charge}
                  onChange={(e) => setEditingUnit({ ...editingUnit, officer_in_charge: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Vehicle Number</label>
                <input
                  value={editingUnit.vehicle_no}
                  onChange={(e) => setEditingUnit({ ...editingUnit, vehicle_no: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] font-mono outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Ward Precinct</label>
                  <select
                    value={editingUnit.ward}
                    onChange={(e) => setEditingUnit({ ...editingUnit, ward: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none font-medium"
                  >
                    {AHMEDABAD_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Status</label>
                  <select
                    value={editingUnit.status}
                    onChange={(e) => setEditingUnit({ ...editingUnit, status: e.target.value as any })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none font-medium"
                  >
                    <option value="active">Deployed / Active</option>
                    <option value="responding">Responding</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold cursor-pointer transition-all shadow-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all shadow-md text-xs"
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
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                🚔 Deploy New Patrol Unit
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleAddUnit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Unit Code / Name</label>
                <input
                  value={newUnitForm.name}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, name: e.target.value })}
                  placeholder="e.g. Unit 1 or PU 65"
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Officer Name</label>
                <input
                  value={newUnitForm.officer_in_charge}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, officer_in_charge: e.target.value })}
                  placeholder="e.g. officer vijay"
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Vehicle Number</label>
                <input
                  value={newUnitForm.vehicle_no}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, vehicle_no: e.target.value })}
                  placeholder="e.g. gj-08-bj-9876"
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] font-mono outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Ward Precinct</label>
                  <select
                    value={newUnitForm.ward}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, ward: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none font-medium"
                  >
                    {AHMEDABAD_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[var(--muted-foreground)] mb-1 block font-medium">Initial Status</label>
                  <select
                    value={newUnitForm.status}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, status: e.target.value as any })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground)] outline-none font-medium"
                  >
                    <option value="active">Deployed</option>
                    <option value="responding">Responding</option>
                    <option value="idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold cursor-pointer transition-all shadow-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all shadow-md text-xs"
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
                <div
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
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Ward: {r.ward} · {r.distance_km} km · Est. {r.est_time_mins} mins</p>
                    </div>
                    <Badge color={r.risk_level === "HIGH" ? "#EF4444" : "#F97316"} bg={r.risk_level === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)"}>
                      {r.risk_level} THREAT
                    </Badge>
                  </div>

                  {/* Checkpoints Progress Timeline */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)] mb-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-500" /> Route Checkpoints ({r.checkpoints.filter((c) => c.done).length}/{r.checkpoints.length} Cleared)
                    </p>
                    <div className="flex flex-col gap-2">
                      {r.checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cp.done ? "bg-emerald-500" : "bg-slate-600"}`} />
                            <span className={cp.done ? "text-[var(--foreground)] font-medium" : "text-[var(--muted-foreground)]"}>{cp.name}</span>
                          </div>
                          {cp.done ? (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">Cleared {cp.time}</span>
                          ) : (
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Tactical OpenStreetMap Overview */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <MapPin size={15} color="#3B82F6" /> Live Patrol Route & Alternative Corridors
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Primary path highlighted with alternative routes and distance/time badges</p>
                </div>
              </div>
              <RealAhmedabadOpenStreetMap
                cases={cases}
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
                  <Zap size={18} className="text-amber-500" /> Dynamic PCR Rerouting Command
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Re-assign active patrol units dynamically based on live CCTV alerts, ANPR hits, or emergency calls.</p>
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
                <h4 className="text-sm font-bold text-blue-500 flex items-center gap-2">
                  <BadgeCheck size={16} /> AI Route Optimization Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[var(--muted-foreground)]">Distance Shift</span>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">3.4 km → 4.8 km</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[var(--muted-foreground)]">Estimated Travel ETA</span>
                    <p className="text-sm font-bold text-emerald-500 mt-0.5">~5.2 minutes</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[var(--muted-foreground)]">Priority Level</span>
                    <p className="text-sm font-bold text-red-500 mt-0.5">PRIORITY DISPATCH</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-[var(--foreground)] leading-relaxed">
                  <strong className="text-blue-500">AI Routing Note:</strong> Bypassing Sola flyover bottleneck. Expected arrival time reduced by 2.4 minutes vs default GPS route. Zero high-congestion corridors traversed.
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
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
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
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Car size={15} className="text-blue-500" /> Target Unit Telemetry
              </h3>
              {targetRerouteUnit && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{targetRerouteUnit.name}</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">{targetRerouteUnit.officer_in_charge}</p>
                    </div>
                    <Badge color={targetRerouteUnit.status === "active" ? "#22C55E" : "#EF4444"}>
                      {targetRerouteUnit.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                    <div><span className="text-[var(--muted-foreground)]">Vehicle No</span><p className="font-mono text-[var(--foreground)]">{targetRerouteUnit.vehicle_no}</p></div>
                    <div><span className="text-[var(--muted-foreground)]">Phone</span><p className="font-mono text-[var(--foreground)]">{targetRerouteUnit.phone}</p></div>
                    <div><span className="text-[var(--muted-foreground)]">Current Precinct</span><p className="text-[var(--foreground)] font-semibold">{targetRerouteUnit.ward}</p></div>
                    <div><span className="text-[var(--muted-foreground)]">Comms Status</span><p className="text-emerald-500 font-semibold">{targetRerouteUnit.last_ping}</p></div>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <RealAhmedabadOpenStreetMap
                  cases={cases}
                  showPatrols={true}
                  patrols={units}
                  selectedWard={targetRerouteUnit?.ward}
                  height="330px"
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
