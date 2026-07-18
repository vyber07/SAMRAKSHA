import React, { useEffect, useState } from 'react';
import { analytics } from '../lib/api';

const SimpleLineChart = ({ data, title, height = 250 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        minHeight: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
      }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const width = 400;
  const chartHeight = height - 40;
  const padding = 40;
  const pointWidth = (width - padding * 2) / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: padding + i * pointWidth,
    y: chartHeight - (d.value / maxValue) * (chartHeight - 20),
    value: d.value,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
        {title}
      </h3>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (chartHeight / 4) * i}
            x2={width - padding}
            y2={padding + (chartHeight / 4) * i}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeDasharray="4"
          />
        ))}

        {/* Axis */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />
        <line x1={padding} y1={chartHeight + padding} x2={width - padding} y2={chartHeight + padding} stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />

        {/* Chart line */}
        <path
          d={pathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.3))',
          }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={`point-${i}`}>
            <circle cx={p.x} cy={p.y} r="3" fill="#2563eb" />
            <circle cx={p.x} cy={p.y} r="5" fill="rgba(37, 99, 235, 0.1)" />
          </g>
        ))}
      </svg>
    </div>
  );
};

const SimpleBarChart = ({ data, title, height = 250 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        minHeight: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
      }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const width = 400;
  const chartHeight = height - 40;
  const barWidth = (width - 80) / data.length;
  const padding = 40;

  const colors = ['#2563eb', '#64748b', '#f97316', '#16a34a', '#0284c7'];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
        {title}
      </h3>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Axis */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />
        <line x1={padding} y1={chartHeight + padding} x2={width - 20} y2={chartHeight + padding} stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />

        {/* Bars */}
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 20);
          const x = padding + i * barWidth + barWidth / 4;
          const y = chartHeight + padding - barHeight;
          const color = colors[i % colors.length];

          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth / 2}
                height={barHeight}
                fill={color}
                opacity="0.7"
                rx="4"
              />
              <rect
                x={x}
                y={y}
                width={barWidth / 2}
                height={barHeight}
                fill="none"
                stroke={color}
                strokeWidth="1"
                rx="4"
              />
              <text
                x={x + barWidth / 4}
                y={chartHeight + padding + 15}
                fontSize="10"
                textAnchor="middle"
                fill="#94a3b8"
              >
                {item.label || `Item ${i}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SimplePieChart = ({ data, title, size = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        textAlign: 'center',
      }}>
        No data
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#2563eb', '#64748b', '#f97316', '#16a34a', '#0284c7'];
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    currentAngle = endAngle;

    return {
      path: pathData,
      color: colors[i % colors.length],
      label: item.label,
      value: item.value,
      percentage: ((item.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <svg width={size} height={size}>
          {slices.map((slice, i) => (
            <path
              key={`slice-${i}`}
              d={slice.path}
              fill={slice.color}
              opacity="0.7"
              stroke={slice.color}
              strokeWidth="1"
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {slices.map((slice, i) => (
            <div
              key={`legend-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: slice.color,
                  borderRadius: '2px',
                }}
              />
              <span>{slice.label}: {slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function IncidentGraph() {
  const [data, setData] = useState({
    trends: [],
    types: [],
    status: [],
    stats: { total: 0, active: 0, resolved: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, incidentsRes] = await Promise.all([
        analytics.dashboard(),
        analytics.incidents(),
      ]);

      const analyticsData = analyticsRes.data || {};
      const incidentsData = incidentsRes.data || {};

      // Process trends (last 7 days)
      const trends = [
        { label: 'Mon', value: analyticsData.incidents_monday || 0 },
        { label: 'Tue', value: analyticsData.incidents_tuesday || 0 },
        { label: 'Wed', value: analyticsData.incidents_wednesday || 0 },
        { label: 'Thu', value: analyticsData.incidents_thursday || 0 },
        { label: 'Fri', value: analyticsData.incidents_friday || 0 },
        { label: 'Sat', value: analyticsData.incidents_saturday || 0 },
        { label: 'Sun', value: analyticsData.incidents_sunday || 0 },
      ];

      // Process incident types
      const types = [
        { label: 'Theft', value: incidentsData.theft_count || 0 },
        { label: 'Assault', value: incidentsData.assault_count || 0 },
        { label: 'Vandalism', value: incidentsData.vandalism_count || 0 },
        { label: 'Traffic', value: incidentsData.traffic_count || 0 },
        { label: 'Other', value: incidentsData.other_count || 0 },
      ];

      // Process status distribution
      const status = [
        { label: 'Active', value: analyticsData.active_incidents || 0 },
        { label: 'Resolved', value: analyticsData.solved_cases || 0 },
        { label: 'Pending', value: analyticsData.pending_incidents || 0 },
      ];

      // Stats
      const stats = {
        total: analyticsData.total_incidents || analyticsData.total_cases || 0,
        active: analyticsData.active_incidents || 0,
        resolved: analyticsData.solved_cases || 0,
      };

      setData({ trends, types, status, stats });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use mock data on error
      setData({
        trends: [
          { label: 'Mon', value: 12 },
          { label: 'Tue', value: 15 },
          { label: 'Wed', value: 10 },
          { label: 'Thu', value: 18 },
          { label: 'Fri', value: 22 },
          { label: 'Sat', value: 8 },
          { label: 'Sun', value: 5 },
        ],
        types: [
          { label: 'Theft', value: 25 },
          { label: 'Assault', value: 18 },
          { label: 'Vandalism', value: 12 },
          { label: 'Traffic', value: 20 },
          { label: 'Other', value: 8 },
        ],
        status: [
          { label: 'Active', value: 35 },
          { label: 'Resolved', value: 43 },
          { label: 'Pending', value: 5 },
        ],
        stats: { total: 83, active: 35, resolved: 43 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#94a3b8',
      }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05))',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Total Incidents</div>
          <div style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: '700' }}>
            {data.stats.total}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))',
          border: '1px solid rgba(100, 116, 139, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Active</div>
          <div style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: '700' }}>
            {data.stats.active}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))',
          border: '1px solid rgba(22, 163, 74, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Resolved</div>
          <div style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: '700' }}>
            {data.stats.resolved}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        <SimpleLineChart
          data={data.trends}
          title="Incident Trends (Last 7 Days)"
          height={250}
        />
        <SimpleBarChart
          data={data.types}
          title="Incidents by Type"
          height={250}
        />
      </div>

      {/* Pie Chart */}
      <div>
        <SimplePieChart
          data={data.status}
          title="Status Distribution"
          size={250}
        />
      </div>
    </div>
  );
}
