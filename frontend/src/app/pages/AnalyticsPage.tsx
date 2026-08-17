import React, { useState, useEffect } from "react";
import { Activity, Zap, BadgeCheck, CheckCircle, ShieldAlert, Cpu } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useApp, PageHeader, StatCard, SegmentedChartCard, Card } from "../App";

function AnalyticsPage() {
  const { token } = useApp();
  const [stats, setStats] = useState([
    { title: "FIRs Today", value: "-", icon: Activity, color: "#EF4444", change: 0 },
    { title: "Active Alerts", value: "-", icon: Zap, color: "#22C55E", change: 0 },
    { title: "Patrol Active", value: "-", icon: BadgeCheck, color: "#3B82F6", change: 0 },
    { title: "High Risk Zones", value: "-", icon: CheckCircle, color: "#8B5CF6", change: 0 },
  ]);

  const [resourceStatus, setResourceStatus] = useState<any>(null);
  const [surges, setSurges] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch("/api/v1/analytics/summary", { credentials: "include", headers })
      .then(r => r.json())
      .then(data => {
        if (data && data.firs_today !== undefined) {
          setStats([
            { title: "FIRs Today", value: String(data.firs_today), icon: Activity, color: "#EF4444", change: data.firs_today_change ?? 0 },
            { title: "Active Alerts", value: String(data.active_alerts ?? "-"), icon: Zap, color: "#22C55E", change: 0 },
            { title: "Patrol Active", value: String(data.patrol_active ?? "-"), icon: BadgeCheck, color: "#3B82F6", change: 0 },
            { title: "High Risk Zones", value: String(data.high_risk_zones ?? "-"), icon: CheckCircle, color: "#8B5CF6", change: 0 },
          ]);
        }
      })
      .catch(console.error);

    fetch("/api/v1/analytics/resource_status", { credentials: "include", headers })
      .then(r => r.json())
      .then(data => setResourceStatus(data))
      .catch(console.error);

    fetch("/api/v1/analytics/hotspot_surge", { credentials: "include", headers })
      .then(r => r.json())
      .then(data => {
        if (data && data.surges) setSurges(data.surges);
      })
      .catch(console.error);

    fetch("/api/v1/analytics/pattern_matches", { credentials: "include", headers })
      .then(r => r.json())
      .then(data => {
        if (data && data.patterns) setPatterns(data.patterns);
      })
      .catch(console.error);
  }, [token]);

  const COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B'];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Predictive Analytics" subtitle="Real-time foresight and threat mitigation data" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} change={s.change} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SegmentedChartCard title="Incident Frequency Tracking" />
        </div>
        
        <Card>
          <h3 className="text-sm font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
            <BadgeCheck size={16} className="text-blue-500" />
            Resource Allocation Status
          </h3>
          {resourceStatus ? (
            <div className="flex flex-col items-center justify-center h-full pb-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={resourceStatus.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {resourceStatus.breakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 12 }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around w-full mt-2 text-xs">
                <div className="text-center">
                  <span className="block text-[var(--muted-foreground)]">Engaged</span>
                  <span className="font-bold text-lg">{resourceStatus.engaged_pct}%</span>
                </div>
                <div className="text-center">
                  <span className="block text-[var(--muted-foreground)]">Available</span>
                  <span className="font-bold text-lg">{resourceStatus.available_pct}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-[var(--muted-foreground)]">Loading...</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            Immediate Hotspot Surges
          </h3>
          <div className="space-y-3">
            {surges.length > 0 ? surges.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div>
                  <div className="font-semibold text-sm">{s.ward}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Hour Slot: {s.hour_slot}:00</div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                  Risk: {s.risk_score}
                </div>
              </div>
            )) : (
              <div className="text-sm text-[var(--muted-foreground)] text-center py-8">No immediate surges predicted.</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
            <Cpu size={16} className="text-purple-500" />
            AI Pattern Matches (CCTV & Telecom)
          </h3>
          <div className="space-y-3">
            {patterns.length > 0 ? patterns.map((p, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold text-sm capitalize">{p.type.replace('_', ' ')}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(p.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{p.description}</div>
              </div>
            )) : (
              <div className="text-sm text-[var(--muted-foreground)] text-center py-8">No critical AI patterns detected.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
