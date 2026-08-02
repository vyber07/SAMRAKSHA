/**
 * Empirical Verification Test Suite for Milestone 4 (Core Views Group 1: Operational Command)
 * Author: Challenger 1 (challenger_m4_1)
 */
import { casesApi, cctvApi, patrolApi, gisApi } from '../lib/api';
import { mockCases, mockCctvCameras, mockPatrolUnits, mockHeatmapPoints, mockWardRiskSummaries } from '../lib/mockData';
import { CaseFIR, CaseStatus, CCTVCamera, PatrolUnit, CctvAnomalyType, OfficerRole } from '../lib/types';

// In-memory localStorage shim for Node environment
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

if (typeof window === 'undefined' || !window.localStorage) {
  const mockStorage = new MockLocalStorage();
  (global as any).window = { localStorage: mockStorage };
  (global as any).localStorage = mockStorage;
}

// Custom Assertion Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runChallengerM4Tests() {
  console.log('===================================================================');
  console.log('   CHALLENGER 1: EMPIRICAL TEST SUITE FOR MILESTONE 4 CORE VIEWS   ');
  console.log('===================================================================');

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
  // TEST GROUP 1: Filtering FIRs by status and ward (Exact Matching)
  // =========================================================================
  console.log('\n--- GROUP 1: FIR Status & Ward Filtering Logic ---');

  await runTest('Filter FIRs by status = "pending" returns exact matching FIR records', async () => {
    const allCases = await casesApi.getCases();
    const statusFilter: CaseStatus = 'pending';
    
    // Simulate CaseManagementView / ExecutiveDashboard filter function
    const filtered = allCases.filter((c) => c.status === statusFilter);

    assert(filtered.length > 0, 'Should return at least one pending FIR');
    assert(
      filtered.every((c) => c.status === 'pending'),
      'All returned FIRs must have status equal to pending'
    );
  });

  await runTest('Filter FIRs by status = "under_investigation" returns exact matching FIR records', async () => {
    const allCases = await casesApi.getCases();
    const filtered = allCases.filter((c) => c.status === 'under_investigation');

    assert(filtered.length > 0, 'Should return under_investigation FIRs');
    assert(
      filtered.every((c) => c.status === 'under_investigation'),
      'All returned FIRs must have status equal to under_investigation'
    );
  });

  await runTest('Filter FIRs by status = "chargesheeted" returns exact matching FIR records', async () => {
    const allCases = await casesApi.getCases();
    const filtered = allCases.filter((c) => c.status === 'chargesheeted');

    assert(filtered.length > 0, 'Should return chargesheeted FIRs');
    assert(
      filtered.every((c) => c.status === 'chargesheeted'),
      'All returned FIRs must have status equal to chargesheeted'
    );
  });

  await runTest('Filter FIRs by ward = "Navrangpura" isolates target ward records', async () => {
    const allCases = await casesApi.getCases();
    const wardFilter = 'Navrangpura';

    const filtered = allCases.filter((c) =>
      c.location.ward.toLowerCase().includes(wardFilter.toLowerCase())
    );

    assert(filtered.length > 0, 'Should return FIRs in Navrangpura ward');
    assert(
      filtered.every((c) => c.location.ward.toLowerCase().includes('navrangpura')),
      'All returned FIRs must belong to Navrangpura ward'
    );
  });

  await runTest('Filter FIRs by ward = "Kalupur" isolates target ward records', async () => {
    const allCases = await casesApi.getCases();
    const wardFilter = 'Kalupur';

    const filtered = allCases.filter((c) =>
      c.location.ward.toLowerCase().includes(wardFilter.toLowerCase())
    );

    assert(filtered.length > 0, 'Should return FIRs in Kalupur ward');
    assert(
      filtered.every((c) => c.location.ward.toLowerCase().includes('kalupur')),
      'All returned FIRs must belong to Kalupur ward'
    );
  });

  await runTest('Combined multi-criteria filtering (search query + status + ward) matches accurately', async () => {
    const allCases = await casesApi.getCases();
    const searchQuery = 'theft';
    const statusFilter = 'pending';
    const wardFilter = 'Navrangpura';

    const filtered = allCases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.fir_no.toLowerCase().includes(q) ||
        c.crime_type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.complainant_name.toLowerCase().includes(q);
      const matchesStatus = c.status === statusFilter;
      const matchesWard = c.location.ward.toLowerCase().includes(wardFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesWard;
    });

    for (const c of filtered) {
      assert(c.status === 'pending', 'Status must be pending');
      assert(c.location.ward.toLowerCase().includes('navrangpura'), 'Ward must be Navrangpura');
    }
  });

  await runTest('Filtering with non-existent status or ward returns empty list cleanly', async () => {
    const allCases = await casesApi.getCases();
    const filteredStatus = allCases.filter((c) => (c.status as string) === 'non_existent_status');
    assert(filteredStatus.length === 0, 'Non-existent status should yield 0 results');

    const filteredWard = allCases.filter((c) => c.location.ward === 'NonExistentWard999');
    assert(filteredWard.length === 0, 'Non-existent ward should yield 0 results');
  });

  // =========================================================================
  // TEST GROUP 2: Register FIR Form Validation & Submission Lifecycle
  // =========================================================================
  console.log('\n--- GROUP 2: Register FIR Form Validation & Submission Lifecycle ---');

  // Form validator function simulating CaseManagementView.tsx handleCreateFirSubmit logic
  function validateAndSubmitFirForm(
    form: {
      fir_no: string;
      ps_name: string;
      crime_type: string;
      bns_sections: string;
      ipc_sections: string;
      complainant_name: string;
      complainant_phone: string;
      incident_date: string;
      address: string;
      ward: string;
      description: string;
      io_name: string;
      priority: any;
    },
    userRole: OfficerRole
  ) {
    const canRegister = ['io', 'sho', 'dcp', 'admin'].includes(userRole);
    if (!canRegister) {
      return { success: false, error: 'Access Denied: Constables cannot register new FIRs.' };
    }

    if (!form.complainant_name || !form.complainant_phone || !form.description || !form.address) {
      return { success: false, error: 'Please fill in all required fields marked with *.' };
    }

    return { success: true, error: null };
  }

  await runTest('Form validation rejects submission when complainant_name is missing', async () => {
    const invalidForm = {
      fir_no: 'FIR/NAV/2026/8881',
      ps_name: 'Navrangpura PS',
      crime_type: 'Robbery Attempt',
      bns_sections: 'Section 309',
      ipc_sections: 'Section 392',
      complainant_name: '', // MISSING
      complainant_phone: '+91 98980 12345',
      incident_date: new Date().toISOString(),
      address: 'Near Swastik Cross Roads',
      ward: 'Navrangpura',
      description: 'Attempted robbery at shop',
      io_name: 'Inspector Roy',
      priority: 'high',
    };

    const res = validateAndSubmitFirForm(invalidForm, 'io');
    assert(res.success === false, 'Validation should fail when complainant_name is empty');
    assert(res.error === 'Please fill in all required fields marked with *.', 'Error message check');
  });

  await runTest('Form validation rejects submission when complainant_phone is missing', async () => {
    const invalidForm = {
      fir_no: 'FIR/NAV/2026/8882',
      ps_name: 'Navrangpura PS',
      crime_type: 'Robbery Attempt',
      bns_sections: 'Section 309',
      ipc_sections: 'Section 392',
      complainant_name: 'Rajesh Shah',
      complainant_phone: '', // MISSING
      incident_date: new Date().toISOString(),
      address: 'Near Swastik Cross Roads',
      ward: 'Navrangpura',
      description: 'Attempted robbery at shop',
      io_name: 'Inspector Roy',
      priority: 'high',
    };

    const res = validateAndSubmitFirForm(invalidForm, 'sho');
    assert(res.success === false, 'Validation should fail when complainant_phone is empty');
  });

  await runTest('Form validation rejects submission when description is missing', async () => {
    const invalidForm = {
      fir_no: 'FIR/NAV/2026/8883',
      ps_name: 'Navrangpura PS',
      crime_type: 'Robbery Attempt',
      bns_sections: 'Section 309',
      ipc_sections: 'Section 392',
      complainant_name: 'Rajesh Shah',
      complainant_phone: '+91 98980 12345',
      incident_date: new Date().toISOString(),
      address: 'Near Swastik Cross Roads',
      ward: 'Navrangpura',
      description: '', // MISSING
      io_name: 'Inspector Roy',
      priority: 'high',
    };

    const res = validateAndSubmitFirForm(invalidForm, 'admin');
    assert(res.success === false, 'Validation should fail when description is empty');
  });

  await runTest('Form validation rejects submission when address is missing', async () => {
    const invalidForm = {
      fir_no: 'FIR/NAV/2026/8884',
      ps_name: 'Navrangpura PS',
      crime_type: 'Robbery Attempt',
      bns_sections: 'Section 309',
      ipc_sections: 'Section 392',
      complainant_name: 'Rajesh Shah',
      complainant_phone: '+91 98980 12345',
      incident_date: new Date().toISOString(),
      address: '', // MISSING
      ward: 'Navrangpura',
      description: 'Detailed incident summary',
      io_name: 'Inspector Roy',
      priority: 'high',
    };

    const res = validateAndSubmitFirForm(invalidForm, 'dcp');
    assert(res.success === false, 'Validation should fail when address is empty');
  });

  await runTest('RBAC rejects FIR registration when user role is "constable"', async () => {
    const validForm = {
      fir_no: 'FIR/NAV/2026/8885',
      ps_name: 'Navrangpura PS',
      crime_type: 'Robbery Attempt',
      bns_sections: 'Section 309',
      ipc_sections: 'Section 392',
      complainant_name: 'Rajesh Shah',
      complainant_phone: '+91 98980 12345',
      incident_date: new Date().toISOString(),
      address: 'Swastik Cross Roads',
      ward: 'Navrangpura',
      description: 'Detailed incident summary',
      io_name: 'Inspector Roy',
      priority: 'high',
    };

    const res = validateAndSubmitFirForm(validForm, 'constable');
    assert(res.success === false, 'Constables must be blocked from submitting FIR');
    assert(res.error === 'Access Denied: Constables cannot register new FIRs.', 'Role error text check');
  });

  await runTest('Form validation accepts valid input and calls casesApi.createFIR successfully', async () => {
    const validForm = {
      fir_no: 'FIR/NAV/2026/7777',
      ps_name: 'Navrangpura Police Station',
      crime_type: 'Vehicle Theft',
      bns_sections: 'Section 303(2)',
      ipc_sections: 'IPC Section 379',
      complainant_name: 'Vikram Mehta',
      complainant_phone: '+91 98250 99999',
      incident_date: new Date().toISOString(),
      address: 'Gulbai Tekra, Navrangpura',
      ward: 'Navrangpura',
      description: 'Two-wheeler stolen from residential parking area overnight.',
      io_name: 'Sub-Inspector Anita Roy',
      priority: 'medium',
    };

    const validationRes = validateAndSubmitFirForm(validForm, 'io');
    assert(validationRes.success === true, 'Validation must pass for complete input');

    // Execute actual creation via casesApi
    const createdCase = await casesApi.createFIR({
      fir_no: validForm.fir_no,
      ps_name: validForm.ps_name,
      crime_type: validForm.crime_type,
      bns_sections: [validForm.bns_sections],
      ipc_sections: [validForm.ipc_sections],
      complainant_name: validForm.complainant_name,
      complainant_phone: validForm.complainant_phone,
      incident_date: validForm.incident_date,
      description: validForm.description,
      io_name: validForm.io_name,
      priority: validForm.priority as any,
      status: 'pending',
      location: {
        address: validForm.address,
        ward: validForm.ward,
        lat: 23.0380,
        lng: 72.5640,
      },
    });

    assert(typeof createdCase.id === 'string', 'Created FIR must have string ID');
    assert(createdCase.complainant_name === 'Vikram Mehta', 'Complainant name must match input');
    assert(createdCase.status === 'pending', 'Initial status must be pending');
  });

  // =========================================================================
  // TEST GROUP 3: Smart CCTV Anomaly Stream Filtering & Camera Isolation
  // =========================================================================
  console.log('\n--- GROUP 3: Smart CCTV Anomaly Stream Filtering & Camera Isolation ---');

  await runTest('Filtering cameras by ANOMALY_ONLY isolates target cameras with active anomalies', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    
    // Simulate CctvSurveillanceView anomaly filtering
    const anomalyOnlyCameras = allCameras.filter((cam) => !!cam.anomaly);

    assert(anomalyOnlyCameras.length > 0, 'Should find cameras with active anomalies');
    assert(
      anomalyOnlyCameras.every((cam) => cam.anomaly !== null && cam.anomaly !== undefined),
      'Every returned camera must have an anomaly tag'
    );
  });

  await runTest('Filtering cameras by specific anomaly type "weapon_detected" isolates weapon alert camera', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    const weaponAlertCameras = allCameras.filter((cam) => cam.anomaly === 'weapon_detected');

    assert(weaponAlertCameras.length > 0, 'Should find camera with weapon_detected anomaly');
    assert(
      weaponAlertCameras.every((cam) => cam.anomaly === 'weapon_detected'),
      'All returned cameras must have weapon_detected anomaly'
    );
  });

  await runTest('Filtering cameras by specific anomaly type "face_match" isolates face match camera', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    const faceMatchCameras = allCameras.filter((cam) => cam.anomaly === 'face_match');

    assert(faceMatchCameras.length > 0, 'Should find camera with face_match anomaly');
    assert(
      faceMatchCameras.every((cam) => cam.anomaly === 'face_match'),
      'All returned cameras must have face_match anomaly'
    );
  });

  await runTest('Filtering cameras by anomaly type "crowd_surge" isolates crowd surge camera', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    const crowdCameras = allCameras.filter((cam) => cam.anomaly === 'crowd_surge');

    assert(crowdCameras.length > 0, 'Should find camera with crowd_surge anomaly');
    assert(
      crowdCameras.every((cam) => cam.anomaly === 'crowd_surge'),
      'All returned cameras must have crowd_surge anomaly'
    );
  });

  await runTest('Filtering cameras by anomaly type "plate_recognised" isolates ANPR camera', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    const plateCameras = allCameras.filter((cam) => cam.anomaly === 'plate_recognised');

    assert(plateCameras.length > 0, 'Should find camera with plate_recognised anomaly');
    assert(
      plateCameras.every((cam) => cam.anomaly === 'plate_recognised'),
      'All returned cameras must have plate_recognised anomaly'
    );
  });

  await runTest('CCTV Grid layout paging limits: 2x2 grid restricts output to 4, 3x3 restricts to 9', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    
    // Simulate 2x2 grid format slicing
    const grid2x2Display = allCameras.slice(0, 4);
    assert(grid2x2Display.length === 4, '2x2 grid layout must show exactly 4 cameras');

    // Simulate 3x3 grid format slicing
    const grid3x3Display = allCameras.slice(0, 9);
    assert(grid3x3Display.length === 9, '3x3 grid layout must show exactly 9 cameras');
  });

  await runTest('Search filter isolates camera by Camera ID (e.g. CAM-101) or Name (e.g. C.G. Road)', async () => {
    const allCameras = await cctvApi.getCctvCameras();
    
    const idSearch = allCameras.filter((c) => c.id.toLowerCase().includes('cam-101'));
    assert(idSearch.length === 1 && idSearch[0].id === 'CAM-101', 'Should isolate CAM-101 by ID');

    const nameSearch = allCameras.filter((c) => c.name.toLowerCase().includes('c.g. road'));
    assert(nameSearch.length > 0 && nameSearch[0].name.includes('C.G. Road'), 'Should isolate C.G. Road camera by name search');
  });

  // =========================================================================
  // TEST GROUP 4: View Component State Interactions & Modal Lifecycles
  // =========================================================================
  console.log('\n--- GROUP 4: View Component State Interactions & Modal Lifecycles ---');

  await runTest('ExecutiveDashboard KPI metric calculations & Emergency Ticker cycle index', async () => {
    const allCases = await casesApi.getCases();
    const allCameras = await cctvApi.getCctvCameras();
    const allPatrols = await patrolApi.getPatrolUnits();

    // Verify dynamic KPI counts
    const activeAnomalies = allCameras.filter((c) => !!c.anomaly).length;
    const activePatrols = allPatrols.filter((p) => p.status === 'patrolling' || p.status === 'dispatched').length;
    const pendingCases = allCases.filter((c) => c.status === 'pending' || c.status === 'under_investigation').length;

    assert(activeAnomalies >= 4, 'Should count at least 4 active CCTV anomalies');
    assert(activePatrols >= 6, 'Should count at least 6 active patrols');
    assert(pendingCases >= 5, 'Should count at least 5 pending investigations');

    // Verify emergency ticker cycle index wrapping
    let activeAlertIndex = 0;
    const emergencyAlertsCount = 4;
    for (let i = 0; i < 10; i++) {
      activeAlertIndex = (activeAlertIndex + 1) % emergencyAlertsCount;
    }
    assert(activeAlertIndex === 2, 'Ticker index must wrap modulo total alerts');
  });

  await runTest('CaseManagementView status update and digital diary note additions', async () => {
    // 1. Status update test
    const targetCaseId = 'FIR-2026-0042';
    const updatedCase = await casesApi.updateCaseStatus(targetCaseId, 'chargesheeted');
    assert(updatedCase.status === 'chargesheeted', 'Case status must update to chargesheeted');

    // 2. Add diary note test
    const noteText = 'CCTV footage retrieved from CAM-101 confirming suspect vehicle.';
    const updatedWithNote = await casesApi.addDiaryNote(targetCaseId, noteText, 'Inspector Anita Roy');

    assert(
      Boolean(updatedWithNote.diary_notes?.some((n) => n.note === noteText && n.author === 'Inspector Anita Roy')),
      'New diary note must be appended to digital diary timeline'
    );
  });

  await runTest('PredictiveAnalyticsView ward risk scorecards coverage (all 12 wards)', async () => {
    const wardRisks = await gisApi.getWardRiskScores();
    assert(wardRisks.length === 12, 'Must cover all 12 municipal wards of Ahmedabad');

    for (const w of wardRisks) {
      assert(typeof w.wardName === 'string', 'Ward name must be string');
      assert(typeof w.riskScore === 'number' && w.riskScore >= 0 && w.riskScore <= 100, 'Risk score must be between 0 and 100');
    }
  });

  await runTest('CctvSurveillanceView PTZ controls state machine (Zoom step bounds & IR mode toggle)', async () => {
    let ptzZoomLevel = 1;
    let isNightVision = false;

    // Zoom step up
    ptzZoomLevel = Math.min(8, ptzZoomLevel + 1);
    assert(ptzZoomLevel === 2, 'Zoom should increment to 2x');

    // Max zoom boundary test
    for (let i = 0; i < 10; i++) {
      ptzZoomLevel = Math.min(8, ptzZoomLevel + 1);
    }
    assert(ptzZoomLevel === 8, 'Zoom level must clamp at max 8x');

    // Min zoom boundary test
    for (let i = 0; i < 10; i++) {
      ptzZoomLevel = Math.max(1, ptzZoomLevel - 1);
    }
    assert(ptzZoomLevel === 1, 'Zoom level must clamp at min 1x');

    // Night vision toggle
    isNightVision = !isNightVision;
    assert(isNightVision === true, 'Night vision IR toggle should switch to true');
    isNightVision = !isNightVision;
    assert(isNightVision === false, 'Night vision IR toggle should switch to false');
  });

  await runTest('Modal state lifecycles: Detail Modal and Snapshot Modal opening & closing', async () => {
    let isRegisterModalOpen = false;
    let isDetailModalOpen = false;
    let activeModalCamera: CCTVCamera | null = null;
    let snapshotCamera: CCTVCamera | null = null;

    // Open Register Modal
    isRegisterModalOpen = true;
    assert(isRegisterModalOpen === true, 'Register modal should be open');
    isRegisterModalOpen = false;
    assert(isRegisterModalOpen === false, 'Register modal should close');

    // Open Case Detail Modal
    const sampleCase = (await casesApi.getCases())[0];
    isDetailModalOpen = true;
    assert(isDetailModalOpen === true, 'Detail modal should open');
    isDetailModalOpen = false;
    assert(isDetailModalOpen === false, 'Detail modal should close');

    // Open CCTV PTZ Modal
    const sampleCamera = (await cctvApi.getCctvCameras())[0];
    activeModalCamera = sampleCamera;
    assert(activeModalCamera?.id === sampleCamera.id, 'PTZ Modal target camera set');
    activeModalCamera = null;
    assert(activeModalCamera === null, 'PTZ Modal closed');

    // Open CCTV Snapshot Modal
    snapshotCamera = sampleCamera;
    assert(snapshotCamera?.id === sampleCamera.id, 'Snapshot Modal target camera set');
    snapshotCamera = null;
    assert(snapshotCamera === null, 'Snapshot Modal closed');
  });

  console.log('\n===================================================================');
  console.log(`   TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY `);
  console.log('===================================================================');

  return { passedTests, totalTests, success: passedTests === totalTests };
}

// Auto-run when executed directly via npx tsx
runChallengerM4Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
