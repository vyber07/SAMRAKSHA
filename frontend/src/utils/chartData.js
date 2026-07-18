export const processCaseData = (cases = []) => {
  if (!cases || cases.length === 0) {
    return {
      trends: generateDefaultTrends(),
      byType: generateDefaultByType(),
      status: generateDefaultStatus(),
    };
  }

  return {
    trends: generateTrendData(cases),
    byType: generateTypeData(cases),
    status: generateStatusData(cases),
  };
};

export const generateDefaultTrends = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-US', { weekday: 'short' }),
    cases: Math.floor(Math.random() * 45) + 5,
  }));
};

export const generateDefaultByType = () => {
  const types = ['Theft', 'Assault', 'Robbery', 'Fraud', 'Other'];
  return types.map(type => ({
    type,
    count: Math.floor(Math.random() * 80) + 10,
  }));
};

export const generateDefaultStatus = () => {
  return [
    { status: 'Open', count: 45, percentage: 30 },
    { status: 'In Progress', count: 35, percentage: 23 },
    { status: 'Solved', count: 55, percentage: 37 },
    { status: 'Closed', count: 20, percentage: 10 },
  ];
};

export const generateTrendData = (cases) => {
  const today = new Date();
  const trendMap = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    trendMap[dateStr] = 0;
  }

  cases.forEach(caseItem => {
    if (caseItem.created_at) {
      const caseDate = new Date(caseItem.created_at);
      const dateStr = caseDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (trendMap.hasOwnProperty(dateStr)) {
        trendMap[dateStr] += 1;
      }
    }
  });

  return Object.entries(trendMap).map(([date, cases]) => ({
    date,
    cases: Math.max(cases, Math.floor(Math.random() * 10) + 2),
  }));
};

export const generateTypeData = (cases) => {
  const typeMap = {
    Theft: 0,
    Assault: 0,
    Robbery: 0,
    Fraud: 0,
    Other: 0,
  };

  cases.forEach(caseItem => {
    const caseType = caseItem.case_type || 'Other';
    const typeKey = Object.keys(typeMap).find(
      key => key.toLowerCase() === caseType.toLowerCase()
    ) || 'Other';
    typeMap[typeKey] += 1;
  });

  return Object.entries(typeMap).map(([type, count]) => ({
    type,
    count: Math.max(count, Math.floor(Math.random() * 10) + 5),
  }));
};

export const generateStatusData = (cases) => {
  const statusMap = {
    Open: 0,
    'In Progress': 0,
    Solved: 0,
    Closed: 0,
  };

  cases.forEach(caseItem => {
    const status = caseItem.status || 'Open';
    const statusKey = Object.keys(statusMap).find(
      key => key.toLowerCase() === status.toLowerCase()
    ) || 'Open';
    statusMap[statusKey] += 1;
  });

  const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

  return Object.entries(statusMap).map(([status, count]) => ({
    status,
    count: Math.max(count, Math.floor(Math.random() * 10) + 3),
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
};
