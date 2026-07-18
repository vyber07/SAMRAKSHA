import React, { useMemo, useRef, useEffect, useState } from 'react';

const StatusDistributionChart = ({ data = [] }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState(280);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setSize(Math.max(200, Math.min(300, width - 40)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SIZE = size;
  const RADIUS = size * 0.215;
  const CENTER_X = SIZE / 2;
  const CENTER_Y = SIZE / 2 - 20;

  const COLORS = {
    open: '#2563eb',
    inProgress: '#f97316',
    solved: '#16a34a',
    closed: '#64748b',
    textBright: '#f1f5f9',
    text: '#94a3b8',
  };

  const statusMap = {
    Open: COLORS.open,
    'In Progress': COLORS.inProgress,
    Solved: COLORS.solved,
    Closed: COLORS.closed,
  };

  const chartData = useMemo(() => {
    if (data.length > 0) return data;
    return [
      { status: 'Open', count: 45, percentage: 30 },
      { status: 'In Progress', count: 35, percentage: 23 },
      { status: 'Solved', count: 55, percentage: 37 },
      { status: 'Closed', count: 20, percentage: 10 },
    ];
  }, [data]);

  const total = chartData.reduce((sum, d) => sum + d.count, 0);
  const percentages = chartData.map(d => (d.count / total) * 100);

  const slices = [];
  let currentAngle = -Math.PI / 2;

  percentages.forEach((percent, i) => {
    const sliceAngle = (percent / 100) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;

    const startX = CENTER_X + RADIUS * Math.cos(currentAngle);
    const startY = CENTER_Y + RADIUS * Math.sin(currentAngle);
    const endX = CENTER_X + RADIUS * Math.cos(endAngle);
    const endY = CENTER_Y + RADIUS * Math.sin(endAngle);

    const largeArc = percent > 50 ? 1 : 0;

    const pathData = [
      `M ${CENTER_X} ${CENTER_Y}`,
      `L ${startX} ${startY}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}`,
      'Z',
    ].join(' ');

    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = RADIUS * 0.65;
    const labelX = CENTER_X + labelRadius * Math.cos(labelAngle);
    const labelY = CENTER_Y + labelRadius * Math.sin(labelAngle);

    slices.push({
      path: pathData,
      color: statusMap[chartData[i].status],
      percentage: Math.round(percent),
      status: chartData[i].status,
      labelX,
      labelY,
    });

    currentAngle = endAngle;
  });

  return (
    <div ref={containerRef} style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(148, 163, 184, 0.12)',
      borderRadius: '14px',
      padding: '20px',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '15px',
        fontWeight: '600',
        color: COLORS.textBright,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        🎯 Status Distribution
      </h3>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Pie Chart */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
          {slices.map((slice, i) => (
            <g
              key={`slice-${i}`}
              style={{
                animation: `pieReveal 0.8s ease-out ${i * 0.1}s both`,
              }}
            >
              {/* Slice */}
              <path
                d={slice.path}
                fill={slice.color}
                opacity="0.8"
                style={{
                  filter: `drop-shadow(0 2px 8px ${slice.color}40)`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.filter = `drop-shadow(0 4px 12px ${slice.color}60)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.filter = `drop-shadow(0 2px 8px ${slice.color}40)`;
                }}
              />

              {/* Percentage Label */}
              <text
                x={slice.labelX}
                y={slice.labelY}
                fontSize="12"
                fontWeight="600"
                fill={COLORS.textBright}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {slice.percentage}%
              </text>
            </g>
          ))}

          {/* Center Circle */}
          <circle cx={CENTER_X} cy={CENTER_Y} r="30" fill="rgba(15, 23, 42, 0.6)" />
          <text
            x={CENTER_X}
            y={CENTER_Y}
            fontSize="18"
            fontWeight="700"
            fill={COLORS.textBright}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {total}
          </text>
        </svg>

        {/* Legend */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {chartData.map((d, i) => (
            <div
              key={`legend-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: statusMap[d.status],
                  boxShadow: `0 2px 4px ${statusMap[d.status]}40`,
                }}
              />
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: COLORS.textBright,
              }}>
                {d.status}
              </div>
              <div style={{
                marginLeft: 'auto',
                fontSize: '12px',
                fontWeight: '600',
                color: COLORS.text,
              }}>
                {d.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pieReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StatusDistributionChart;
