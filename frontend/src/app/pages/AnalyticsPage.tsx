import React, { useState, useEffect } from "react";
import { Activity, Zap, BadgeCheck, CheckCircle } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApp, PageHeader, StatCard, SegmentedChartCard, Card } from "../App";

function AnalyticsPage() {
  const { token } = useApp();
  const [stats, setStats] = useState([
    { title: "FIRs Today", value: "-", icon: Activity, color: "#EF4444", change: 0 },
    { title: "Active Alerts", value: "-", icon: Zap, color: "#22C55E", change: 0 },
    { title: "Patrol Active", value: "-", icon: BadgeCheck, color: "#3B82F6", change: 0 },
    { title: "High Risk Zones", value: "-", icon: CheckCircle, color: "#8B5CF6", change: 0 },
  ]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    fetch("/api/v1/analytics/summary", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
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

    fetch("/api/v1/analytics/trends", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.weekly)) setWeeklyData(data.weekly);
      })
      .catch(console.error);
  }, [token]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Predictive Analytics" subtitle="Real-time foresight and threat mitigation data" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} change={s.change} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SegmentedChartCard title="Incident Frequency Tracking" />
      </div>

      {weeklyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--muted-foreground)" }}>Weekly Incident Pattern</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 11 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((_, i) => <Cell key={i} fill={i === 5 || i === 6 ? "#EF4444" : "#3B82F6"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
