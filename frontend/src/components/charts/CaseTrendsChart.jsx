import React, { useMemo, useRef, useEffect, useState } from 'react';

const CaseTrendsChart = ({ data = [] }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({
          width: Math.max(300, width - 40),
          height: 280,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const WIDTH = dimensions.width;
  const HEIGHT = dimensions.height;
  const PADDING = 40;
  const CHART_WIDTH = WIDTH - PADDING * 2;
  const CHART_HEIGHT = HEIGHT - PADDING * 2;

  const COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    tertiary: '#f97316',
    success: '#16a34a',
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
    textBright: '#f1f5f9',
  };

  const chartData = useMemo(() => {
    if (data.length > 0) return data;

    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { weekday: 'short' }),
      cases: Math.floor(Math.random() * 45) + 5,
    }));
  }, [data]);

  const maxCases = useMemo(() => Math.max(...chartData.map(d => d.cases), 50), [chartData]);

  const points = chartData.map((d, i) => ({
    x: PADDING + (i / (chartData.length - 1)) * CHART_WIDTH,
    y: HEIGHT - PADDING - (d.cases / maxCases) * CHART_HEIGHT,
    value: d.cases,
    label: d.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPathD = `${pathD} L ${points[points.length - 1].x} ${HEIGHT - PADDING} L ${PADDING} ${HEIGHT - PADDING} Z`;

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
        📈 Case Trends (7 Days)
      </h3>

      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block' }}>
        {/* Grid Lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PADDING + (i / 4) * CHART_HEIGHT;
          return (
            <g key={`grid-${i}`}>
              <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke={COLORS.grid} strokeWidth="1" />
              <text x={PADDING - 10} y={y + 4} fontSize="11" fill={COLORS.text} textAnchor="end">
                {Math.round(maxCases - (i / 4) * maxCases)}
              </text>
            </g>
          );
        })}

        {/* Axis Lines */}
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke={COLORS.text} strokeWidth="1.5" />
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke={COLORS.text} strokeWidth="1.5" />

        {/* Area under curve */}
        <path d={areaPathD} fill={COLORS.primary} opacity="0.1" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2.5"
          style={{
            filter: `drop-shadow(0 4px 12px ${COLORS.primary}40)`,
            animation: 'strokeDraw 1.2s ease-in-out forwards',
          }}
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={`point-${i}`} style={{
            animation: `pointFade 0.8s ease-out ${i * 0.1}s both`,
          }}>
            <circle cx={p.x} cy={p.y} r="4" fill={COLORS.primary} opacity="0.3" />
            <circle cx={p.x} cy={p.y} r="2.5" fill={COLORS.primary} />
            <text x={p.x} y={HEIGHT - PADDING + 20} fontSize="11" fill={COLORS.text} textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes strokeDraw {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
        }
        @keyframes pointFade {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CaseTrendsChart;
