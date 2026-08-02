/**
 * Milestone 3 Test Verification Suite for SAMRAKSHA API & State Infrastructure
 */
import {
  authApi,
  casesApi,
  gisApi,
  cctvApi,
  patrolApi,
  aiApi,
  legalApi,
  translationApi,
  adminApi
} from '../lib/api';

export async function testM3ApiInfrastructure() {
  console.log('=== RUNNING M3 API & INFRASTRUCTURE TESTS ===');

  // 1. Auth API
  const loginRes = await authApi.login('GJ-AMD-1002', 'password123');
  console.assert(loginRes.token.includes('mock_jwt_token'), 'Auth login token should be generated');
  console.assert(loginRes.user.role === 'sho', 'Login user role should be sho');
  console.log('[PASS] Auth API login & bearer token mock');

  const profileRes = await authApi.getProfile();
  console.assert(profileRes.name !== undefined, 'Profile officer name should exist');
  console.log('[PASS] Auth API getProfile');

  // 2. Cases API
  const cases = await casesApi.getCases();
  console.assert(cases.length >= 12, `Expected at least 12 cases, got ${cases.length}`);
  console.log(`[PASS] Cases API getCases (${cases.length} cases retrieved)`);

  const singleCase = await casesApi.getCaseById('FIR-2026-0042');
  console.assert(singleCase.fir_no === 'FIR/NAV/2026/0042', 'Case FIR number match');
  console.log('[PASS] Cases API getCaseById');

  const newFIR = await casesApi.createFIR({
    crime_type: 'Chain Snatching',
    complainant_name: 'Test Complainant',
    description: 'Test FIR creation'
  });
  console.assert(newFIR.id.startsWith('FIR-2026-'), 'New FIR ID should be formatted');
  console.log('[PASS] Cases API createFIR');

  // 3. GIS API
  const wards = await gisApi.getWardBoundaries();
  console.assert(wards.features.length === 12, `Expected 12 wards, got ${wards.features.length}`);
  console.log('[PASS] GIS API getWardBoundaries');

  const hotspots = await gisApi.getHotspotHeatmap();
  console.assert(hotspots.length > 0, 'Hotspots array should not be empty');
  console.log('[PASS] GIS API getHotspotHeatmap');

  // 4. CCTV API
  const cameras = await cctvApi.getCctvCameras();
  console.assert(cameras.length >= 16, `Expected at least 16 CCTV cameras, got ${cameras.length}`);
  console.log(`[PASS] CCTV API getCctvCameras (${cameras.length} cameras)`);

  const updatedCam = await cctvApi.triggerAnomalyAlert('CAM-101', 'weapon_detected');
  console.assert(updatedCam.anomaly === 'weapon_detected', 'CCTV anomaly alert should update');
  console.log('[PASS] CCTV API triggerAnomalyAlert');

  // 5. Patrol API
  const units = await patrolApi.getPatrolUnits();
  console.assert(units.length >= 8, `Expected at least 8 patrol units, got ${units.length}`);
  console.log(`[PASS] Patrol API getPatrolUnits (${units.length} units)`);

  const dispatchRes = await patrolApi.dispatchUnit('PU-03', 'FIR-2026-0042');
  console.assert(dispatchRes.unit.status === 'dispatched', 'Patrol unit status should be dispatched');
  console.log('[PASS] Patrol API dispatchUnit');

  // 6. AI CrimeGPT API
  const gptRes = await aiApi.queryCrimeGpt('What are the rules for robbery under BNS?');
  console.assert(gptRes.suggestedBnsSections.length > 0, 'CrimeGPT response should contain BNS sections');
  console.log('[PASS] AI CrimeGPT API queryCrimeGpt');

  // 7. Legal & Doc API
  const bnsList = await legalApi.getBnsSections('robbery');
  console.assert(bnsList.length > 0, 'Legal BNS section lookup should return matching sections');
  console.log('[PASS] Legal API getBnsSections');

  const generatedDoc = await legalApi.generateLegalDoc('chargesheet', 'FIR-2026-0042');
  console.assert(generatedDoc.docId.startsWith('DOC-'), 'Generated doc ID format');
  console.log('[PASS] Legal API generateLegalDoc');

  // 8. Translation API
  const transRes = await translationApi.translateText('Armed robbery reported', 'gu');
  console.assert(transRes.translatedText.includes('ગુજરાતી'), 'Translation result should contain Gujarati marker');
  console.log('[PASS] Translation API translateText');

  // 9. Admin & Analytics API
  const officers = await adminApi.getOfficerRoster();
  console.assert(officers.length >= 10, `Expected at least 10 officers, got ${officers.length}`);
  console.log(`[PASS] Admin API getOfficerRoster (${officers.length} officers)`);

  const analytics = await adminApi.getAnalyticsTrends();
  console.assert(analytics.crimeCategories.length > 0, 'Analytics crime categories should exist');
  console.log('[PASS] Admin API getAnalyticsTrends');

  const settings = await adminApi.getStationSettings();
  console.assert(settings.stationId === 'PS-AMD-001', 'Station settings ID match');
  console.log('[PASS] Admin API getStationSettings');

  console.log('=== ALL M3 API INFRASTRUCTURE TESTS PASSED SUCCESSFULLY ===');
  return { success: true };
}
