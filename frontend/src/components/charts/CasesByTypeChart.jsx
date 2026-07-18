import React, { useMemo, useRef, useEffect, useState } from 'react';

const CasesByTypeChart = ({ data = [] }) => {
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
    theft: '#2563eb',
    assault: '#dc2626',
    robbery: '#ea580c',
    fraud: '#f97316',
    other: '#64748b',
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
    textBright: '#f1f5f9',
  };

  const caseTypes = ['Theft', 'Assault', 'Robbery', 'Fraud', 'Other'];
  const typeColors = {
    Theft: COLORS.theft,
    Assault: COLORS.assault,
    Robbery: COLORS.robbery,
    Fraud: COLORS.fraud,
    Other: COLORS.other,
  };

  const chartData = useMemo(() => {
    if (data.length > 0) return data;
    return caseTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * 80) + 10,
    }));
  }, [data]);

  const maxCount = useMemo(() => Math.max(...chartData.map(d => d.count), 100), [chartData]);

  const barWidth = CHART_WIDTH / (caseTypes.length * 1.5);
  const barGap = barWidth * 0.5;

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
        📊 Cases by Type
      </h3>

      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block' }}>
        {/* Grid Lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PADDING + (i / 4) * CHART_HEIGHT;
          return (
            <g key={`grid-${i}`}>
              <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke={COLORS.grid} strokeWidth="1" />
              <text x={PADDING - 10} y={y + 4} fontSize="11" fill={COLORS.text} textAnchor="end">
                {Math.round(maxCount - (i / 4) * maxCount)}
              </text>
            </g>
          );
        })}

        {/* Axis Lines */}
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke={COLORS.text} strokeWidth="1.5" />
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke={COLORS.text} strokeWidth="1.5" />

        {/* Bars */}
        {chartData.map((d, i) => {
          const x = PADDING + (i * (barWidth + barGap)) + barGap;
          const barHeight = (d.count / maxCount) * CHART_HEIGHT;
          const y = HEIGHT - PADDING - barHeight;
          const color = typeColors[d.type] || COLORS.other;

          return (
            <g key={`bar-${i}`} style={{
              animation: `barGrow 0.8s ease-out ${i * 0.1}s both`,
            }}>
              {/* Bar background */}
              <rect
                x={x}
                y={PADDING}
                width={barWidth}
                height={CHART_HEIGHT}
                fill={COLORS.grid}
                rx="4"
              />

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                style={{
                  filter: `drop-shadow(0 4px 8px ${color}40)`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 6px 12px ${color}60)`;
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 4px 8px ${color}40)`;
                  e.currentTarget.style.opacity = '1';
                }}
              />

              {/* Value Label */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                fontSize="11"
                fill={color}
                fontWeight="600"
                textAnchor="middle"
              >
                {d.count}
              </text>

              {/* Type Label */}
              <text
                x={x + barWidth / 2}
                y={HEIGHT - PADDING + 20}
                fontSize="11"
                fill={COLORS.text}
                textAnchor="middle"
              >
                {d.type}
              </text>
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes barGrow {
          from { transform: scaleY(0); transform-origin: center bottom; }
          to { transform: scaleY(1); transform-origin: center bottom; }
        }
      `}</style>
    </div>
  );
};

export default CasesByTypeChart;
