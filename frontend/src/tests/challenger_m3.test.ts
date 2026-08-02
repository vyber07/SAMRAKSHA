/**
 * Challenger 1 Stress Test Suite for Milestone 3 (API Infrastructure & State Management)
 * Empirical verification of types, withMockFallback, auth token injection, state management, and edge cases.
 */
import { apiClient, withMockFallback, authApi, casesApi, gisApi, cctvApi, patrolApi, aiApi, legalApi, translationApi, adminApi } from '../lib/api';
import { mockOfficers, mockCases, mockCctvCameras, mockPatrolUnits, mockLegalSections, ahmedabadWardsGeoJSON } from '../lib/mockData';
import { OfficerRole, CaseFIR, CCTVCamera, PatrolUnit, DispatchRoute, LegalSection, AuditLog, StationSettings, AnalyticsData } from '../lib/types';

// Simple assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// In-memory localStorage shim for Node testing environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Attach mock localStorage to global if window/localStorage is undefined
if (typeof window === 'undefined' || !window.localStorage) {
  const mockStorage = new MockLocalStorage();
  (global as any).window = { localStorage: mockStorage };
  (global as any).localStorage = mockStorage;
}

export async function runChallengerM3Tests() {
  console.log('===============================================================');
  console.log('   CHALLENGER 1: EMPIRICAL STRESS TEST SUITE FOR MILESTONE 3   ');
  console.log('===============================================================');

  let passedTests = 0;
  let totalTests = 0;

  async function runTest(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // =========================================================================
  // TEST GROUP 1: Verification of `withMockFallback`
  // =========================================================================
  console.log('\n--- GROUP 1: withMockFallback Behavior & Resilience ---');

  await runTest('withMockFallback returns API result when API call succeeds', async () => {
    const apiCall = async () => 'REAL_API_DATA';
    const res = await withMockFallback(apiCall, 'MOCK_DATA');
    assert(res === 'REAL_API_DATA', 'Should return real API data on success');
  });

  await runTest('withMockFallback falls back to static mock data on 500 error', async () => {
    const apiCall = async () => { throw { response: { status: 500, data: 'Internal Error' } }; };
    const res = await withMockFallback(apiCall, 'STATIC_MOCK_FALLBACK');
    assert(res === 'STATIC_MOCK_FALLBACK', 'Should fallback to static mock data on 500 error');
  });

  await runTest('withMockFallback falls back using sync fallback function on network error', async () => {
    const apiCall = async () => { throw new Error('Network Error / ECONNREFUSED'); };
    const res = await withMockFallback(apiCall, () => 'SYNC_FUNC_FALLBACK');
    assert(res === 'SYNC_FUNC_FALLBACK', 'Should execute sync fallback function on network error');
  });

  await runTest('withMockFallback falls back using async fallback function on timeout', async () => {
    const apiCall = async () => { throw new Error('timeout of 10000ms exceeded'); };
    const res = await withMockFallback(apiCall, async () => 'ASYNC_FUNC_FALLBACK');
    assert(res === 'ASYNC_FUNC_FALLBACK', 'Should await async fallback function on timeout');
  });

  await runTest('withMockFallback propagates error if fallback function itself throws error', async () => {
    const apiCall = async () => { throw new Error('API down'); };
    let errorCaught = false;
    try {
      await withMockFallback(apiCall, () => { throw new Error('Fallback failed'); });
    } catch (e: any) {
      errorCaught = true;
      assert(e.message === 'Fallback failed', 'Should throw fallback error');
    }
    assert(errorCaught, 'Error should be caught');
  });

  // =========================================================================
  // TEST GROUP 2: Auth Token Injection in Axios Request Interceptors
  // =========================================================================
  console.log('\n--- GROUP 2: Axios Request Interceptor Auth Token Injection ---');

  await runTest('Axios request interceptor injects Bearer token from samraksha_auth_token', async () => {
    localStorage.clear();
    localStorage.setItem('samraksha_auth_token', 'test_jwt_bearer_token_sho_999');

    // Retrieve request interceptor handler directly from apiClient
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const dummyConfig: any = { headers: {} };
    const resultConfig = interceptor(dummyConfig);

    assert(resultConfig.headers.Authorization === 'Bearer test_jwt_bearer_token_sho_999',
      `Expected 'Bearer test_jwt_bearer_token_sho_999', got '${resultConfig.headers.Authorization}'`);
  });

  await runTest('Axios request interceptor falls back to samraksha_token if auth_token is absent', async () => {
    localStorage.clear();
    localStorage.setItem('samraksha_token', 'legacy_token_888');

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const dummyConfig: any = { headers: {} };
    const resultConfig = interceptor(dummyConfig);

    assert(resultConfig.headers.Authorization === 'Bearer legacy_token_888',
      `Expected 'Bearer legacy_token_888', got '${resultConfig.headers.Authorization}'`);
  });

  await runTest('Axios request interceptor prioritizes samraksha_auth_token over samraksha_token', async () => {
    localStorage.clear();
    localStorage.setItem('samraksha_auth_token', 'primary_token_111');
    localStorage.setItem('samraksha_token', 'secondary_token_222');

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const dummyConfig: any = { headers: {} };
    const resultConfig = interceptor(dummyConfig);

    assert(resultConfig.headers.Authorization === 'Bearer primary_token_111',
      `Expected 'Bearer primary_token_111', got '${resultConfig.headers.Authorization}'`);
  });

  await runTest('Axios request interceptor does not set Authorization header when token is absent', async () => {
    localStorage.clear();

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const dummyConfig: any = { headers: {} };
    const resultConfig = interceptor(dummyConfig);

    assert(resultConfig.headers.Authorization === undefined, 'Authorization header should be undefined when no token stored');
  });

  // =========================================================================
  // TEST GROUP 3: Schema & Data Structure Integrity of All 9 API Helpers
  // =========================================================================
  console.log('\n--- GROUP 3: Data Structure & Schema Verification of 9 API Helper Objects ---');

  // 1. Auth API
  await runTest('authApi.login returns valid token and user structure', async () => {
    const res = await authApi.login('GJ-AMD-1002', 'password123');
    assert(typeof res.token === 'string' && res.token.length > 0, 'Token must be non-empty string');
    assert(typeof res.user.id === 'string', 'User id must be string');
    assert(typeof res.user.name === 'string', 'User name must be string');
    assert(['constable', 'io', 'sho', 'dcp', 'admin'].includes(res.user.role), `User role ${res.user.role} must be valid OfficerRole`);
  });

  await runTest('authApi.logout returns success flag', async () => {
    const res = await authApi.logout();
    assert(res.success === true, 'Logout should return success: true');
  });

  await runTest('authApi.getProfile returns valid Officer profile', async () => {
    const user = await authApi.getProfile();
    assert(typeof user.badge_no === 'string', 'Badge number must exist');
    assert(typeof user.ps_id === 'string', 'Station ID must exist');
  });

  // 2. Cases API
  await runTest('casesApi.getCases returns valid CaseFIR array matching schema', async () => {
    const cases = await casesApi.getCases();
    assert(Array.isArray(cases) && cases.length >= 12, `Expected >= 12 cases, got ${cases.length}`);
    for (const c of cases) {
      assert(typeof c.id === 'string', 'Case ID must be string');
      assert(typeof c.fir_no === 'string', 'FIR no must be string');
      assert(Array.isArray(c.bns_sections), 'bns_sections must be array');
      assert(Array.isArray(c.ipc_sections), 'ipc_sections must be array');
      assert(['pending', 'under_investigation', 'chargesheeted', 'closed'].includes(c.status), `Invalid status ${c.status}`);
      assert(typeof c.location.lat === 'number' && typeof c.location.lng === 'number', 'Location lat/lng must be numbers');
      assert(typeof c.location.ward === 'string', 'Location ward must be string');
    }
  });

  await runTest('casesApi.getCases filtering parameters work correctly', async () => {
    const pendingCases = await casesApi.getCases({ status: 'pending' });
    assert(pendingCases.every(c => c.status === 'pending'), 'All returned cases must have status pending');

    const navCases = await casesApi.getCases({ ward: 'Navrangpura' });
    assert(navCases.every(c => c.location.ward.toLowerCase().includes('navrangpura')), 'All returned cases must be in Navrangpura ward');

    const searchCases = await casesApi.getCases({ search: 'theft' });
    assert(searchCases.length > 0, 'Should find cases matching search "theft"');
  });

  await runTest('casesApi.getCaseById returns single case and throws on invalid ID', async () => {
    const c = await casesApi.getCaseById('FIR-2026-0042');
    assert(c.id === 'FIR-2026-0042' || c.fir_no === 'FIR-2026-0042', 'Found case ID must match requested ID');

    let thrown = false;
    try {
      await casesApi.getCaseById('INVALID-NONEXISTENT-CASE');
    } catch (e: any) {
      thrown = true;
      assert(e.message.includes('not found'), `Expected 'not found' error, got: ${e.message}`);
    }
    assert(thrown, 'Should throw error when case not found');
  });

  await runTest('casesApi.createFIR creates new FIR with diary note', async () => {
    const initialCount = (await casesApi.getCases()).length;
    const newFIR = await casesApi.createFIR({
      crime_type: 'Vehicle Theft',
      complainant_name: 'Harish Patel',
      description: 'Stolen motorcycle outside Alpha One Mall'
    });
    assert(newFIR.id.startsWith('FIR-2026-'), 'Generated ID must match FIR-2026 format');
    assert(newFIR.diary_notes !== undefined && newFIR.diary_notes.length > 0, 'New FIR must have initial diary note');

    const updatedCount = (await casesApi.getCases()).length;
    assert(updatedCount === initialCount + 1, 'Total case count should increase by 1');
  });

  await runTest('casesApi.updateCaseStatus and addDiaryNote work correctly', async () => {
    const updated = await casesApi.updateCaseStatus('FIR-2026-0042', 'closed');
    assert(updated.status === 'closed', 'Case status must update to closed');

    const noteAdded = await casesApi.addDiaryNote('FIR-2026-0042', 'Investigation concluded.', 'Inspector Jadeja');
    assert(Boolean(noteAdded.diary_notes?.some(n => n.note === 'Investigation concluded.')), 'New diary note must exist');
  });

  // 3. GIS API
  await runTest('gisApi functions return valid GeoJSON, heatmaps, and ward risk scores', async () => {
    const wards = await gisApi.getWardBoundaries();
    assert(wards.type === 'FeatureCollection', 'GeoJSON type must be FeatureCollection');
    assert(Array.isArray(wards.features) && wards.features.length === 12, 'Must have 12 ward features');
    for (const f of wards.features) {
      assert(typeof f.properties.name === 'string', 'Ward feature property name must be string');
      assert(typeof f.properties.riskScore === 'number', 'Ward riskScore must be number');
    }

    const heatmaps = await gisApi.getHotspotHeatmap();
    assert(Array.isArray(heatmaps) && heatmaps.length > 0, 'Heatmaps must be non-empty array');
    assert(typeof heatmaps[0].lat === 'number' && typeof heatmaps[0].intensity === 'number', 'Heatmap point lat and intensity must be numbers');

    const riskScores = await gisApi.getWardRiskScores();
    assert(Array.isArray(riskScores) && riskScores.length > 0, 'Ward risk scores must be non-empty array');
  });

  // 4. CCTV API
  await runTest('cctvApi functions return valid camera data and handle anomaly triggers', async () => {
    const cameras = await cctvApi.getCctvCameras();
    assert(Array.isArray(cameras) && cameras.length >= 16, `Expected >= 16 cameras, got ${cameras.length}`);
    for (const cam of cameras) {
      assert(typeof cam.id === 'string' && typeof cam.name === 'string', 'Camera ID and name must be strings');
      assert(['online', 'offline', 'warning'].includes(cam.status), `Invalid camera status ${cam.status}`);
    }

    const navCam = await cctvApi.getCctvCameras('Navrangpura');
    assert(navCam.every(c => c.ward.toLowerCase().includes('navrangpura')), 'Filtered cameras must match ward');

    const camera = await cctvApi.getCameraById('CAM-101');
    assert(camera.id === 'CAM-101', 'Retrieved camera ID must match');

    const anomalyUpdated = await cctvApi.triggerAnomalyAlert('CAM-101', 'face_match');
    assert(anomalyUpdated.anomaly === 'face_match', 'Camera anomaly must be updated to face_match');
  });

  // 5. Patrol API
  await runTest('patrolApi functions return valid units, support status update, dispatch and OSRM routes', async () => {
    const units = await patrolApi.getPatrolUnits();
    assert(Array.isArray(units) && units.length >= 8, `Expected >= 8 patrol units, got ${units.length}`);
    for (const u of units) {
      assert(typeof u.callsign === 'string', 'Patrol unit callsign must be string');
      assert(['car', 'bike', 'van'].includes(u.vehicle_type), `Invalid vehicle_type ${u.vehicle_type}`);
      assert(['patrolling', 'dispatched', 'at_station', 'busy'].includes(u.status), `Invalid status ${u.status}`);
    }

    const updatedUnit = await patrolApi.updateUnitStatus('PU-01', 'busy');
    assert(updatedUnit.status === 'busy', 'Unit status should be updated to busy');

    const dispatch = await patrolApi.dispatchUnit('PU-02', 'FIR-2026-0042', 23.03, 72.56);
    assert(dispatch.unit.status === 'dispatched', 'Dispatched unit status should be dispatched');
    assert(dispatch.route.unitId === 'PU-02', 'Dispatch route unitId should match PU-02');
    assert(Array.isArray(dispatch.route.coordinates) && dispatch.route.coordinates.length >= 2, 'Route coordinates must have at least 2 points');

    const osrm = await patrolApi.getOsrmRoute([23.03, 72.56], [23.05, 72.58]);
    assert(osrm.etaMinutes > 0 && osrm.distanceKm > 0, 'OSRM route must return positive ETA and distance');
  });

  // 6. AI CrimeGPT API
  await runTest('aiApi.queryCrimeGpt returns contextual answer, BNS sections, and actions', async () => {
    const theftRes = await aiApi.queryCrimeGpt('theft in a house');
    assert(theftRes.answer.includes('BNS Section 303(2)'), 'Theft answer should reference BNS 303(2)');
    assert(theftRes.confidenceScore > 0.8, 'Confidence score should be > 0.8');

    const robberyRes = await aiApi.queryCrimeGpt('armed robbery at bank');
    assert(robberyRes.suggestedBnsSections.includes('BNS Section 309'), 'Robbery answer should suggest BNS Section 309');

    const cyberRes = await aiApi.queryCrimeGpt('online cyber fraud');
    assert(cyberRes.suggestedBnsSections.includes('BNS Section 318(4)'), 'Cyber fraud should suggest BNS Section 318(4)');
  });

  // 7. Legal & Auto Document Generator API
  await runTest('legalApi returns BNS sections, search matches, and document generation results', async () => {
    const bnsList = await legalApi.getBnsSections();
    assert(Array.isArray(bnsList) && bnsList.length > 0, 'BNS list must be non-empty array');

    const filteredBns = await legalApi.getBnsSections('robbery');
    assert(filteredBns.length > 0, 'Filtered BNS list for robbery should be non-empty');

    const searchRes = await legalApi.searchLegalRef('theft');
    assert(searchRes.length > 0 && typeof searchRes[0].matchScore === 'number', 'Search legal ref should return match score');

    const doc = await legalApi.generateLegalDoc('fir_copy', 'FIR-2026-0042');
    assert(doc.docId.startsWith('DOC-'), 'Doc ID format check');
    assert(doc.fileUrl.endsWith('.pdf'), 'Generated doc fileUrl should end with .pdf');
  });

  // 8. Multilingual Translation API
  await runTest('translationApi handles Gujarati, Hindi, and English translation requests', async () => {
    const gu = await translationApi.translateText('Emergency alert', 'gu');
    assert(gu.targetLang === 'gu' && gu.translatedText.includes('ગુજરાતી'), 'Gujarati translation format check');

    const hi = await translationApi.translateText('Emergency alert', 'hi');
    assert(hi.targetLang === 'hi' && hi.translatedText.includes('हिंदी'), 'Hindi translation format check');

    const en = await translationApi.translateText('પોલીસ સ્ટેશન', 'en');
    assert(en.targetLang === 'en' && en.translatedText.includes('English'), 'English translation format check');
  });

  // 9. Admin Console & Analytics API
  await runTest('adminApi returns officer roster, updates roles, station settings, and audit logs', async () => {
    const roster = await adminApi.getOfficerRoster();
    assert(Array.isArray(roster) && roster.length >= 10, `Expected >= 10 officers, got ${roster.length}`);

    const updatedOfficer = await adminApi.updateOfficerRole('OFF-006', 'sho');
    assert(updatedOfficer.role === 'sho', 'Officer role must be updated to sho');

    const analytics = await adminApi.getAnalyticsTrends();
    assert(Array.isArray(analytics.crimeCategories) && analytics.crimeCategories.length > 0, 'Crime categories array must be present');
    assert(Array.isArray(analytics.timeOfDayTrends) && analytics.timeOfDayTrends.length > 0, 'Time of day trends must be present');
    assert(Array.isArray(analytics.monthlyTrends) && analytics.monthlyTrends.length > 0, 'Monthly trends must be present');

    const station = await adminApi.getStationSettings();
    assert(typeof station.stationId === 'string', 'Station ID must exist');
    assert(typeof station.totalOfficers === 'number', 'Total officers must be number');

    const logs = await adminApi.getAuditLogs();
    assert(Array.isArray(logs) && logs.length > 0, 'Audit logs must be non-empty array');
  });

  // =========================================================================
  // TEST GROUP 4: Simulated Axios Backend Responses using Axios Custom Adapter
  // =========================================================================
  console.log('\n--- GROUP 4: Simulated HTTP Responses via Custom Axios Adapter ---');

  const originalAdapter = apiClient.defaults.adapter;

  await runTest('withMockFallback engages fallback when Axios adapter yields 500 Internal Server Error', async () => {
    apiClient.defaults.adapter = async (config) => {
      const error: any = new Error('Request failed with status code 500');
      error.response = { status: 500, statusText: 'Internal Server Error', config, headers: {}, data: {} };
      throw error;
    };

    const cases = await casesApi.getCases();
    assert(Array.isArray(cases) && cases.length >= 12, 'Should fallback to mock cases when backend yields 500');
  });

  await runTest('withMockFallback engages fallback when Axios adapter yields 404 Not Found', async () => {
    apiClient.defaults.adapter = async (config) => {
      const error: any = new Error('Request failed with status code 404');
      error.response = { status: 404, statusText: 'Not Found', config, headers: {}, data: {} };
      throw error;
    };

    const cameras = await cctvApi.getCctvCameras();
    assert(Array.isArray(cameras) && cameras.length >= 16, 'Should fallback to mock cameras when backend yields 404');
  });

  await runTest('withMockFallback engages fallback when Axios adapter yields Network Connection Error', async () => {
    apiClient.defaults.adapter = async () => {
      const error: any = new Error('Network Error');
      error.code = 'ERR_NETWORK';
      throw error;
    };

    const wards = await gisApi.getWardBoundaries();
    assert(wards.type === 'FeatureCollection', 'Should fallback to mock GeoJSON on network error');
  });

  await runTest('withMockFallback returns real response when Axios adapter succeeds (200 OK)', async () => {
    apiClient.defaults.adapter = async (config) => {
      return {
        data: [{ id: 'REAL-001', fir_no: 'FIR/REAL/001', ps_id: 'PS-REAL', ps_name: 'Real Station', incident_date: '2026-07-30', reported_date: '2026-07-30', crime_type: 'Real Crime', bns_sections: [], ipc_sections: [], status: 'pending', io_name: 'IO Real', complainant_name: 'Real User', complainant_phone: '123', description: 'Real Case', location: { lat: 23.0, lng: 72.0, address: 'Real Addr', ward: 'Real Ward' } }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    };

    const cases = await casesApi.getCases();
    assert(cases.length === 1 && cases[0].id === 'REAL-001', 'Should return real API response data when adapter returns 200');
  });

  // Restore original adapter
  apiClient.defaults.adapter = originalAdapter;

  console.log('\n===============================================================');
  console.log(`   TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY `);
  console.log('===============================================================');

  return { passedTests, totalTests, success: passedTests === totalTests };
}

// Auto-run when executed via vite-node
runChallengerM3Tests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
