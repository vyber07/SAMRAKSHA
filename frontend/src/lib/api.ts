import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('samraksha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('samraksha_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (badge_no: string, password: string) => {
    const res = await api.post('/auth/login', { badge_no, password });
    if (res.data?.access_token) {
      localStorage.setItem('samraksha_token', res.data.access_token);
    }
    return res.data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('samraksha_token');
    }
  }
};

// Cases API
export const casesApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get('/cases', { params: { page, limit } });
    return res.data;
  },
  create: async (firData: any) => {
    const res = await api.post('/cases/create', firData);
    return res.data;
  },
  get: async (caseId: string) => {
    const res = await api.get(`/cases/${caseId}`);
    return res.data;
  },
  addDiaryEntry: async (caseId: string, entry: { entry_type: string; description: string; location?: string }) => {
    const res = await api.post(`/cases/${caseId}/diary`, entry);
    return res.data;
  },
  search: async (query: string) => {
    const res = await api.get('/cases/search', { params: { q: query } });
    return res.data;
  }
};

// CCTV API
export const cctvApi = {
  alerts: async () => {
    const res = await api.get('/cctv/cameras');
    return res.data;
  },
  anomalies: async () => {
    const res = await api.get('/cctv/anomalies');
    return res.data;
  }
};

// Patrol API
export const patrolApi = {
  units: async () => {
    const res = await api.get('/patrol/units');
    return res.data;
  },
  routes: async () => {
    const res = await api.get('/patrol/routes');
    return res.data;
  },
  updateUnit: async (unitId: string, data: any) => {
    const res = await api.patch(`/patrol/units/${unitId}`, data);
    return res.data;
  },
  createUnit: async (data: any) => {
    const res = await api.post('/patrol/units', data);
    return res.data;
  },
  deleteUnit: async (unitId: string) => {
    const res = await api.delete(`/patrol/units/${unitId}`);
    return res.data;
  }
};

// Assistant API (CrimeGPT)
export const assistantApi = {
  query: async (data: { mode: 'this_case' | 'all_cases'; question: string; case_id?: string }) => {
    const res = await api.post('/assistant/query', data);
    return res.data;
  }
};

// Legal API
export const legalApi = {
  search: async (query: string) => {
    const res = await api.get('/legal/search', { params: { q: query } });
    return res.data;
  },
  suggest: async (narrative: string, language = 'en') => {
    const res = await api.post('/legal/suggest', { narrative, language });
    return res.data;
  }
};

// Documents API
export const documentsApi = {
  generate: async (data: { case_id: string; doc_type: string; language?: string }) => {
    const res = await api.post('/documents/generate', data, {
      responseType: 'blob'
    });
    return res.data;
  },
  list: async (caseId: string) => {
    const res = await api.get('/documents', { params: { case_id: caseId } });
    return res.data;
  }
};

// Admin API
export const adminApi = {
  listUsers: async () => {
    const res = await api.get('/admin/officers');
    return res.data;
  },
  createUser: async (userData: any) => {
    const res = await api.post('/admin/officers', userData);
    return res.data;
  },
  updateUser: async (badgeNo: string, userData: any) => {
    const res = await api.patch(`/admin/officers/${badgeNo}`, userData);
    return res.data;
  },
  deleteUser: async (badgeNo: string) => {
    const res = await api.delete(`/admin/officers/${badgeNo}`);
    return res.data;
  },
  getAuditLogs: async (params?: any) => {
    const res = await api.get('/admin/audit', { params });
    return res.data;
  },
  getPermissions: async () => {
    const res = await api.get('/admin/permissions');
    return res.data;
  }
};

// Analytics / Hotspot API
export const analyticsApi = {
  getSummary: async () => {
    const res = await api.get('/analytics/summary');
    return res.data;
  },
  getTrends: async (params?: any) => {
    const res = await api.get('/analytics/trends', { params });
    return res.data;
  },
  getWards: async () => {
    const res = await api.get('/hotspot/wards');
    return res.data;
  },
  getZones: async () => {
    const res = await api.get('/hotspot/zones');
    return res.data;
  }
};
