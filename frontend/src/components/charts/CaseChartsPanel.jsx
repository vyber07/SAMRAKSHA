import React, { useState, useEffect } from 'react';
import CaseTrendsChart from './CaseTrendsChart';
import CasesByTypeChart from './CasesByTypeChart';
import StatusDistributionChart from './StatusDistributionChart';
import { processCaseData } from '../../utils/chartData';

const CaseChartsPanel = ({ cases = [] }) => {
  const [chartStates, setChartStates] = useState({
    trends: [],
    byType: [],
    status: [],
  });

  useEffect(() => {
    const processedData = processCaseData(cases);
    setChartStates(processedData);
  }, [cases]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      animation: 'fadeInUp 0.6s ease-out',
    }} className="case-charts-panel">
      {/* Row 1: Line Chart (Full Width) */}
      <div style={{
        animation: 'fadeInUp 0.6s ease-out 0.1s both',
      }}>
        <CaseTrendsChart data={chartStates.trends} />
      </div>

      {/* Row 2: Bar Chart & Pie Chart Side by Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        width: '100%',
      }} className="charts-row">
        <div style={{
          animation: 'fadeInUp 0.6s ease-out 0.2s both',
        }}>
          <CasesByTypeChart data={chartStates.byType} />
        </div>
        <div style={{
          animation: 'fadeInUp 0.6s ease-out 0.3s both',
        }}>
          <StatusDistributionChart data={chartStates.status} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
        }

        @media (max-width: 1200px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .case-charts-panel {
            gap: 12px;
          }

          .charts-row {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseChartsPanel;
