import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Officer,
  OfficerRole,
  CaseFIR,
  CCTVCamera,
  PatrolUnit,
  DispatchRoute,
  HeatmapPoint,
  LegalSection,
  AuditLog,
  AnalyticsData,
  StationSettings,
  CrimeGptResponse,
  GeneratedDocResult,
  TranslationResult,
  WardRiskSummary
} from './types';
import {
  ahmedabadWardsGeoJSON,
  mockCases,
  mockCctvCameras,
  mockPatrolUnits,
  mockDispatchRoutes,
  mockHeatmapPoints,
  mockLegalSections,
  mockOfficers,
  mockAnalyticsData,
  mockStationSettings,
  mockAuditLogs,
  mockWardRiskSummaries
} from './mockData';

const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || '/api/v1';

// Helper for safe localStorage access in SSR/Node environments
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

// Axios Instance Configured with 10s Timeout and Default Headers
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token from LocalStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStorageItem('samraksha_auth_token') || getStorageItem('samraksha_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Diagnostic Logging for Offline Fallback
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('[API Interceptor] 401 Unauthorized detected.');
    } else if (!error.response) {
      console.info('[API Interceptor] Network error or backend server unavailable. Fallback engaged.');
    } else {
      console.info(`[API Interceptor] Server returned ${error.response.status}. Fallback engaged.`);
    }
    return Promise.reject(error);
  }
);

/**
 * Universal Mock Fallback Wrapper
 * Executes an API call. If the backend API call fails (network error, 404, 5xx, or offline),
 * seamlessly returns mock data to ensure full UI preview functionality.
 */
export async function withMockFallback<T>(apiCall: () => Promise<T>, _fallbackValue?: T | (() => T | Promise<T>)): Promise<T> {
  return apiCall();
}

// Mutable in-memory stores for mock dynamic mutations
let localCases: CaseFIR[] = [...mockCases];
let localCameras: CCTVCamera[] = [...mockCctvCameras];
let localPatrolUnits: PatrolUnit[] = [...mockPatrolUnits];
let localOfficers: Officer[] = [...mockOfficers];
let localAuditLogs: AuditLog[] = [...mockAuditLogs];
let localStationSettings: StationSettings = { ...mockStationSettings };

// ==========================================
// 1. Auth Services
// ==========================================
export const authApi = {
  login: async (badge_no: string, password: string): Promise<{ token: string; user: Officer }> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post("/auth/login", { badge_no, password });
        const { access_token, officer } = res.data;
        setStorageItem("samraksha_auth_token", access_token);
        setStorageItem("samraksha_officer_role", officer.role);
        return { token: access_token, user: officer };
      },
      () => {
        const matched = localOfficers.find(o => o.badge_no === badge_no) || localOfficers[1]; // default SHO
        const token = `mock_jwt_token_${badge_no}_${Date.now()}`;
        setStorageItem('samraksha_auth_token', token);
        setStorageItem('samraksha_officer_role', matched.role);
        return { token, user: matched };
      }
    );
  },

  logout: async (): Promise<{ success: boolean }> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/auth/logout');
        removeStorageItem('samraksha_auth_token');
        removeStorageItem('samraksha_officer_role');
        return { success: res.status === 200 };
      },
      () => {
        removeStorageItem('samraksha_auth_token');
        removeStorageItem('samraksha_officer_role');
        return { success: true };
      }
    );
  },

  getProfile: async (): Promise<Officer> => {
    return withMockFallback(
      async () => {
        throw new Error('Profile endpoint is not exposed by the backend');
      },
      () => {
        const savedRole = (getStorageItem('samraksha_officer_role') as OfficerRole) || 'sho';
        return localOfficers.find(o => o.role === savedRole) || localOfficers[1];
      }
    );
  }
};

// ==========================================
// 2. Cases & FIR Management Services
// ==========================================
export const casesApi = {
  getCases: async (filters?: { status?: string; search?: string; ward?: string; crime_type?: string }): Promise<CaseFIR[]> => {
    const res = await apiClient.get("/cases", { params: { page: 1, limit: 100 } });
    const rows = res.data.items || [];
    return rows.map((c: any): CaseFIR => ({ id: String(c.case_id), fir_no: c.fir_no, ps_id: "", ps_name: "", incident_date: c.crime_date, reported_date: c.created_at, crime_type: c.crime_type || "Unknown", bns_sections: [], ipc_sections: [], status: c.case_status === "open" ? "pending" : c.case_status, io_name: "", complainant_name: c.victim_name || "", complainant_phone: "", description: "", location: { lat: 0, lng: 0, address: "", ward: "" } }));
  },
  getCaseById: async (id: string): Promise<CaseFIR> => {
    const res = await apiClient.get(`/cases/${id}`);
    const c = res.data;
    return { id: String(c.case_id), fir_no: c.fir_no, ps_id: String(c.ps_id || ""), ps_name: "", incident_date: c.crime_date, reported_date: c.created_at, crime_type: c.crime_type || "Unknown", bns_sections: c.bns_sections || [], ipc_sections: c.ipc_crossref || [], status: c.case_status === "open" ? "pending" : c.case_status, io_name: c.io_name || "", complainant_name: c.victim_name || "", complainant_phone: c.victim_phone || "", description: c.crime_narrative || "", location: { lat: c.crime_lat || 0, lng: c.crime_lon || 0, address: c.crime_location || "", ward: c.ward || "" }, diary_notes: (c.diary_entries || []).map((entry: any) => ({ id: String(entry.id || entry.ts), timestamp: entry.ts, author: entry.auto_generated ? "System" : "Officer", note: entry.description })) };
  },
  createFIR: async (data: Partial<CaseFIR>): Promise<CaseFIR> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/cases/create', { victim_name: data.complainant_name || 'Anonymous', victim_address: data.location?.address || 'Unknown', victim_phone: data.complainant_phone, crime_type: data.crime_type || 'General Offence', crime_narrative: data.description || 'Reported incident', crime_date: data.incident_date || new Date().toISOString(), crime_location: data.location?.address || 'Ahmedabad', crime_lat: data.location?.lat || 23.0225, crime_lon: data.location?.lng || 72.5714, ward: data.location?.ward || null, severity: data.priority === 'high' ? 5 : data.priority === 'medium' ? 3 : 2 });
        return res.data.results || res.data;
      },
      () => {
        const newId = `FIR-2026-${String(localCases.length + 1).padStart(4, '0')}`;
        const newFIR: CaseFIR = {
          id: newId,
          fir_no: `FIR/NAV/2026/${String(localCases.length + 1).padStart(4, '0')}`,
          ps_id: data.ps_id || "PS-NAV-01",
          ps_name: data.ps_name || "Navrangpura Police Station",
          incident_date: data.incident_date || new Date().toISOString(),
          reported_date: new Date().toISOString(),
          crime_type: data.crime_type || "General Offence",
          bns_sections: data.bns_sections || ["Section 303(2)"],
          ipc_sections: data.ipc_sections || ["IPC Section 379"],
          status: data.status || "pending",
          io_name: data.io_name || "Sub-Inspector Anita Roy",
          complainant_name: data.complainant_name || "Anonymous Complainant",
          complainant_phone: data.complainant_phone || "+91 98000 00000",
          description: data.description || "Reported incident description",
          location: data.location || {
            lat: 23.0380,
            lng: 72.5640,
            address: "C.G. Road, Navrangpura, Ahmedabad",
            ward: "Navrangpura"
          },
          priority: data.priority || "medium",
          evidence_count: 1,
          diary_notes: [
            {
              id: `DN-${Date.now()}`,
              timestamp: new Date().toISOString(),
              author: data.io_name || "Sub-Inspector Anita Roy",
              note: "FIR created and logged in platform database."
            }
          ]
        };
        localCases = [newFIR, ...localCases];
        return newFIR;
      }
    );
  },

  updateCaseStatus: async (id: string, status: CaseFIR['status']): Promise<CaseFIR> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.patch(`/cases/${id}/status`, { status });
        return res.data.results || res.data;
      },
      () => {
        const index = localCases.findIndex(c => c.id === id || c.fir_no === id);
        if (index !== -1) {
          localCases[index] = { ...localCases[index], status };
          return localCases[index];
        }
        throw new Error(`Case ${id} not found`);
      }
    );
  },

  addDiaryNote: async (caseId: string, note: string, author: string): Promise<CaseFIR> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post(`/cases/${caseId}/diary`, { entry_type: 'note', description: note });
        return res.data.results || res.data;
      },
      () => {
        const index = localCases.findIndex(c => c.id === caseId || c.fir_no === caseId);
        if (index !== -1) {
          const newNote = {
            id: `DN-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author,
            note
          };
          const updatedNotes = [...(localCases[index].diary_notes || []), newNote];
          localCases[index] = { ...localCases[index], diary_notes: updatedNotes };
          return localCases[index];
        }
        throw new Error(`Case ${caseId} not found`);
      }
    );
  }
};

// ==========================================
// 3. GIS & Crime Hotspot Services
// ==========================================
export const gisApi = {
  getWardBoundaries: async () => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/map/wards');
        return res.data.results || res.data;
      },
      () => ahmedabadWardsGeoJSON
    );
  },

  getHotspotHeatmap: async (): Promise<HeatmapPoint[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/map/hotspots');
        return res.data.results || res.data;
      },
      () => mockHeatmapPoints
    );
  },

  getWardRiskScores: async (): Promise<WardRiskSummary[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/map/wards');
        return res.data.results || res.data;
      },
      () => mockWardRiskSummaries
    );
  }
};

// ==========================================
// 4. CCTV Surveillance Services
// ==========================================
export const cctvApi = {
  getCctvCameras: async (ward?: string): Promise<CCTVCamera[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/cctv/cameras');
        return (res.data || []).filter((row: any) => !ward || String(row.ward || row.location || '').toLowerCase().includes(ward.toLowerCase())).map((row: any): CCTVCamera => ({ id: String(row.camera_id || row.id), name: row.location || row.camera_id || row.id, ward: row.ward || row.location || 'Ahmedabad', lat: Number(row.lat || 0), lng: Number(row.lon || row.lng || 0), status: row.status || 'online', last_ping: row.last_alert_at, camera_type: String(row.camera_type || 'fixed').toLowerCase() as CCTVCamera['camera_type'] }));
      },
      () => {
        if (ward) {
          return localCameras.filter(c => c.ward.toLowerCase().includes(ward.toLowerCase()));
        }
        return localCameras;
      }
    );
  },

  getCameraById: async (id: string): Promise<CCTVCamera> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get(`/cctv/cameras/${id}`);
        return res.data.results || res.data;
      },
      () => {
        const found = localCameras.find(c => c.id === id);
        if (!found) throw new Error(`Camera ${id} not found`);
        return found;
      }
    );
  },

  triggerAnomalyAlert: async (cameraId: string, anomalyType: CCTVCamera['anomaly']): Promise<CCTVCamera> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post(`/cctv/cameras/${cameraId}/anomaly`, { anomalyType });
        return res.data.results || res.data;
      },
      () => {
        const index = localCameras.findIndex(c => c.id === cameraId);
        if (index !== -1) {
          localCameras[index] = { ...localCameras[index], anomaly: anomalyType };
          return localCameras[index];
        }
        throw new Error(`Camera ${cameraId} not found`);
      }
    );
  }
};

// ==========================================
// 5. Patrol & Beat Management Services
// ==========================================
export const patrolApi = {
  getPatrolUnits: async (ward?: string): Promise<PatrolUnit[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/patrol/units');
        return (res.data || []).map((row: any): PatrolUnit => ({ id: String(row.id), callsign: row.name || row.unit_name || String(row.id), vehicle_type: String(row.vehicle || 'car').toLowerCase() as PatrolUnit['vehicle_type'], status: row.status === 'available' ? 'at_station' : row.status === 'responding' ? 'dispatched' : 'patrolling', lat: Number(row.lat || 0), lng: Number(row.lon || row.lng || 0), speed: 0, assigned_ward: row.ward || 'Ahmedabad', officers: row.officer_name ? [row.officer_name] : [] }));
      },
      () => {
        if (ward) {
          return localPatrolUnits.filter(p => p.assigned_ward.toLowerCase().includes(ward.toLowerCase()));
        }
        return localPatrolUnits;
      }
    );
  },

  updateUnitStatus: async (unitId: string, status: PatrolUnit['status']): Promise<PatrolUnit> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.patch(`/patrol/units/${unitId}`, { status: status === 'at_station' ? 'available' : status === 'dispatched' ? 'responding' : 'active' });
        return res.data.results || res.data;
      },
      () => {
        const index = localPatrolUnits.findIndex(u => u.id === unitId);
        if (index !== -1) {
          localPatrolUnits[index] = { ...localPatrolUnits[index], status };
          return localPatrolUnits[index];
        }
        throw new Error(`Patrol unit ${unitId} not found`);
      }
    );
  },

  dispatchUnit: async (
    unitId: string,
    caseId: string,
    targetLat?: number,
    targetLng?: number
  ): Promise<{ unit: PatrolUnit; route: DispatchRoute }> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/patrol/dispatch', { unitId, caseId, targetLat, targetLng });
        return res.data.results || res.data;
      },
      () => {
        const index = localPatrolUnits.findIndex(u => u.id === unitId);
        if (index === -1) throw new Error(`Patrol unit ${unitId} not found`);

        localPatrolUnits[index] = {
          ...localPatrolUnits[index],
          status: 'dispatched',
          assigned_case_id: caseId
        };

        const unit = localPatrolUnits[index];
        const route: DispatchRoute = mockDispatchRoutes.find(r => r.unitId === unitId) || {
          id: `ROUTE-${Date.now()}`,
          unitId: unit.id,
          unitCallsign: unit.callsign,
          incidentId: caseId,
          incidentTitle: `Dispatch Case ${caseId}`,
          etaMinutes: 3,
          distanceKm: 1.5,
          coordinates: [
            [unit.lat, unit.lng],
            [targetLat || unit.lat + 0.005, targetLng || unit.lng + 0.005]
          ]
        };

        return { unit, route };
      }
    );
  },

  getOsrmRoute: async (origin: [number, number], destination: [number, number]): Promise<DispatchRoute> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/patrol/osrm-route', {
          params: {
            origin_lat: origin[0],
            origin_lng: origin[1],
            dest_lat: destination[0],
            dest_lng: destination[1]
          }
        });
        return res.data.results || res.data;
      },
      () => {
        return {
          id: `ROUTE-${Date.now()}`,
          unitId: "PU-01",
          unitCallsign: "CHETAK-1",
          incidentId: "INC-DISPATCH",
          incidentTitle: "OSRM Dispatched Route",
          etaMinutes: 4,
          distanceKm: 1.8,
          coordinates: [
            origin,
            [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2],
            destination
          ]
        };
      }
    );
  }
};

// ==========================================
// 6. AI & CrimeGPT Assistant Services
// ==========================================
export const aiApi = {
  queryCrimeGpt: async (prompt: string, contextCaseId?: string): Promise<CrimeGptResponse> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/assistant/query', { mode: contextCaseId ? 'this_case' : 'all_cases', question: prompt, case_id: contextCaseId });
        return res.data.results || res.data;
      },
      () => {
        const lower = prompt.toLowerCase();
        let answer = "Based on Bharatiya Nyaya Sanhita (BNS) 2023 guidelines and historical incident data for Ahmedabad City Police:";
        let bns: string[] = ["BNS Section 303(2)", "BNS Section 309"];
        let actions: string[] = ["Dispatch nearest PCR unit via Command Center", "Search ANPR CCTV feed for suspect vehicle"];

        if (lower.includes("theft") || lower.includes("stolen")) {
          answer += "\n\nTheft is governed under BNS Section 303(2) (IPC 379 equivalent). Theft in a dwelling house or building is under BNS Section 305 (IPC 380).";
          bns = ["BNS Section 303(2)", "BNS Section 305"];
          actions = ["Record complainant details and CCTV timestamp", "Issue stolen property alert to scrap dealers & pawn brokers"];
        } else if (lower.includes("robbery") || lower.includes("armed")) {
          answer += "\n\nArmed robbery is covered under BNS Section 309 (IPC 392 equivalent). It is a cognizable, non-bailable offence carrying up to 10 years rigorous imprisonment.";
          bns = ["BNS Section 309", "BNS Section 311"];
          actions = ["Set up perimeter checkpoints at ward boundaries", "Deploy Forensic Team for evidence collection"];
        } else if (lower.includes("cyber") || lower.includes("fraud") || lower.includes("money")) {
          answer += "\n\nFinancial cyber fraud falls under BNS Section 318(4) (IPC 420 equivalent) alongside IT Act Section 66D.";
          bns = ["BNS Section 318(4)", "BNS Section 319"];
          actions = ["Freeze beneficiary bank accounts via National Cyber Helpline 1930", "Log CDR & IP address trace"];
        }

        return {
          answer,
          suggestedBnsSections: bns,
          recommendedActions: actions,
          confidenceScore: 0.94
        };
      }
    );
  }
};

// ==========================================
// 7. Legal Reference & Auto Document Generator Services
// ==========================================
export const legalApi = {
  getBnsSections: async (search?: string): Promise<LegalSection[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/legal/sections', { params: { q: search || '' } });
        return res.data.results || res.data;
      },
      () => {
        if (search) {
          const q = search.toLowerCase();
          return mockLegalSections.filter(
            s =>
              s.bns_section.toLowerCase().includes(q) ||
              s.bns_title.toLowerCase().includes(q) ||
              s.ipc_section.toLowerCase().includes(q) ||
              s.category.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q)
          );
        }
        return mockLegalSections;
      }
    );
  },

  searchLegalRef: async (query: string) => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/legal/search', { params: { q: query } });
        return res.data.results || res.data;
      },
      () => {
        const q = query.toLowerCase();
        const results = mockLegalSections
          .filter(s => s.bns_section.toLowerCase().includes(q) || s.bns_title.toLowerCase().includes(q) || s.ipc_section.toLowerCase().includes(q))
          .map(section => ({ section, matchScore: 0.95 }));
        return results;
      }
    );
  },

  generateLegalDoc: async (docType: string, caseId: string, params?: Record<string, any>): Promise<GeneratedDocResult> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/docs/generate', { doc_type: docType, case_id: caseId, language: params?.language || 'en' });
        return res.data.results || res.data;
      },
      () => {
        return {
          docId: `DOC-${Date.now()}`,
          docType,
          caseId,
          title: `Official SAMRAKSHA Legal Document (${docType.toUpperCase()}) - ${caseId}`,
          fileUrl: `/docs/generated_${docType}_${caseId}.pdf`,
          generatedAt: new Date().toISOString(),
          fileSizeBytes: 485200
        };
      }
    );
  }
};

// ==========================================
// 8. Multilingual Translation Services
// ==========================================
export const translationApi = {
  translateText: async (
    text: string,
    targetLang: 'gu' | 'hi' | 'en',
    sourceLang?: string
  ): Promise<TranslationResult> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.post('/translate/', { text, target_lang: targetLang, source_lang: sourceLang || 'en' });
        return res.data.results || res.data;
      },
      () => {
        let translatedText = text;
        if (targetLang === 'gu') {
          translatedText = `[ગુજરાતી અનુવાદ]: ${text}`;
        } else if (targetLang === 'hi') {
          translatedText = `[हिंदी अनुवाद]: ${text}`;
        } else if (targetLang === 'en') {
          translatedText = `[English Translation]: ${text}`;
        }
        return {
          originalText: text,
          translatedText,
          sourceLang: sourceLang || 'auto',
          targetLang
        };
      }
    );
  }
};

// ==========================================
// 9. Admin Console & Analytics Services
// ==========================================
export const adminApi = {
  getOfficerRoster: async (psId?: string): Promise<Officer[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/admin/officers', { params: { ps_id: psId } });
        return res.data.results || res.data;
      },
      () => {
        if (psId) {
          return localOfficers.filter(o => o.ps_id === psId);
        }
        return localOfficers;
      }
    );
  },

  updateOfficerRole: async (officerId: string, role: OfficerRole): Promise<Officer> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.put(`/admin/officers/${officerId}/role`, { role });
        return res.data.results || res.data;
      },
      () => {
        const index = localOfficers.findIndex(o => o.id === officerId);
        if (index !== -1) {
          localOfficers[index] = { ...localOfficers[index], role };
          return localOfficers[index];
        }
        throw new Error(`Officer ${officerId} not found`);
      }
    );
  },

  getAnalyticsTrends: async (period?: string): Promise<AnalyticsData> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/analytics/trends', { params: { period } });
        return res.data.results || res.data;
      },
      () => mockAnalyticsData
    );
  },

  getStationSettings: async (psId?: string): Promise<StationSettings> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/admin/station-settings', { params: { ps_id: psId } });
        return res.data.results || res.data;
      },
      () => localStationSettings
    );
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    return withMockFallback(
      async () => {
        const res = await apiClient.get('/admin/audit');
        return res.data.results || res.data;
      },
      () => localAuditLogs
    );
  }
};
