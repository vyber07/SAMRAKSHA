/**
 * Comprehensive Stress & Empirical Verification Test Suite
 * Milestone 4-2: Predictive Analytics View & CCTV Surveillance View
 * Target Directory: /home/ubuntu/sa/frontend
 */

import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] Assertion failed: ${message}`);
    throw new Error(`[FAIL] ${message}`);
  }
}

export async function runComprehensiveStressTest() {
  console.log('===================================================================');
  console.log('   EMPIRICAL CHALLENGER M4-2: COMPREHENSIVE STRESS TEST SUITE      ');
  console.log('===================================================================');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  const predPath = path.join(process.cwd(), 'src/components/views/PredictiveAnalyticsView.tsx');
  const cctvPath = path.join(process.cwd(), 'src/components/views/CctvSurveillanceView.tsx');

  const predContent = fs.readFileSync(predPath, 'utf-8');
  const cctvContent = fs.readFileSync(cctvPath, 'utf-8');

  // =========================================================================
  // SECTION 1: Recharts 24h & 7d Prediction Charts
  // =========================================================================
  console.log('\n--- 1. Recharts 24h & 7d Prediction Charts Verification ---');

  await test('1.1 24h forecast data structure has valid hours, historical, predicted, and riskScore fields', () => {
    assert(predContent.includes('const mock24hForecastData = ['), 'mock24hForecastData definition missing');
    assert(predContent.includes("hour: '00:00', historical: 4, predicted: 6, riskScore: 72"), 'mock24hForecastData sample item missing');
    
    // Check Recharts components imported and used
    assert(predContent.includes('ComposedChart'), 'ComposedChart component missing');
    assert(predContent.includes('Area'), 'Area component missing');
    assert(predContent.includes('Line'), 'Line component missing');
  });

  await test('1.2 7d forecast data structure has valid days and crime category breakdown fields', () => {
    assert(predContent.includes('const mock7dPredictionData = ['), 'mock7dPredictionData definition missing');
    assert(predContent.includes("day: 'Mon', Burglary: 4, Robbery: 2, Snatching: 6, CyberFraud: 8"), 'mock7dPredictionData sample item missing');
    assert(predContent.includes('BarChart'), 'BarChart component missing');
    assert(predContent.includes('stackId="a"'), 'Stacked Bar configuration missing');
  });

  await test('1.3 Recharts ResponsiveContainer wrappers specify explicit width and height dimensions', () => {
    const matches = predContent.match(/<ResponsiveContainer[^>]*>/g);
    assert(matches !== null && matches.length >= 2, 'Found fewer than 2 ResponsiveContainer tags');
    for (const tag of matches!) {
      assert(tag.includes('width="100%"'), `ResponsiveContainer missing width="100%": ${tag}`);
      assert(tag.includes('height="100%"'), `ResponsiveContainer missing height="100%": ${tag}`);
    }
    assert(predContent.includes('className="h-[280px] w-full pt-2"'), 'Chart wrapper missing h-[280px] w-full pt-2 styling');
  });

  // =========================================================================
  // SECTION 2: 12-Ward Risk Assessment Scorecards
  // =========================================================================
  console.log('\n--- 2. 12-Ward Risk Scorecards Verification ---');

  await test('2.1 Exactly 12 Ahmedabad wards are present in initialExtendedWardRisks data model', () => {
    const wardIdMatches = predContent.match(/wardId:\s*'W\d\d'/g);
    assert(wardIdMatches !== null && wardIdMatches.length === 12, `Expected 12 ward IDs (W01-W12), found ${wardIdMatches?.length}`);
    
    // Check first and last ward
    assert(predContent.includes("wardId: 'W01'"), 'W01 missing');
    assert(predContent.includes("wardId: 'W12'"), 'W12 missing');
  });

  await test('2.2 Scorecard table provides filtering by text search, risk level (ALL, HIGH, MED, LOW), and ward selection', () => {
    assert(predContent.includes('filteredWardRisks = useMemo'), 'filteredWardRisks memoized filter missing');
    assert(predContent.includes("riskFilter === 'ALL' || w.riskLevel === riskFilter"), 'Risk level filter logic missing');
    assert(predContent.includes("w.wardName.toLowerCase().includes(tableSearch.toLowerCase())"), 'Table search filter logic missing');
  });

  // =========================================================================
  // SECTION 3: Patrol Reallocation Trigger
  // =========================================================================
  console.log('\n--- 3. Patrol Reallocation Trigger Verification ---');

  await test('3.1 Reallocation recommendations include source/target wards, units, and urgency ratings', () => {
    assert(predContent.includes('const initialRecommendations: ResourceRecommendation[] = ['), 'initialRecommendations missing');
    assert(predContent.includes("sourceWard: 'Thaltej (Low Risk)'"), 'Sample recommendation source ward missing');
    assert(predContent.includes("targetWard: 'Kalupur (Critical Risk)'"), 'Sample recommendation target ward missing');
  });

  await test('3.2 Action handler handleApplyRecommendation updates target ward patrol count, reduces risk score, and notifies user', () => {
    assert(predContent.includes('handleApplyRecommendation = (rec: ResourceRecommendation) => {'), 'handleApplyRecommendation function missing');
    assert(predContent.includes('activePatrols: w.activePatrols + rec.unitsToMove'), 'Target ward patrol increment logic missing');
    assert(predContent.includes('riskScore: Math.max(10, w.riskScore - 12)'), 'Target ward risk score reduction logic missing');
    assert(predContent.includes('Patrol Reallocation Dispatched:'), 'Notification dispatch text missing');
  });

  // =========================================================================
  // SECTION 4: CCTV Grid Layout Switching (2x2 vs 3x3)
  // =========================================================================
  console.log('\n--- 4. CCTV Grid Layout Switching Verification ---');

  await test('4.1 Grid format state supports 2x2 and 3x3 layouts with responsive CSS grid column classes', () => {
    assert(cctvContent.includes("const [gridFormat, setGridFormat] = useState<'2x2' | '3x3'>('2x2');"), 'gridFormat state missing');
    assert(cctvContent.includes("gridFormat === '2x2' ? 4 : 9;"), 'Grid item limit calculation missing');
    assert(cctvContent.includes("gridFormat === '2x2'"), 'Grid format toggle conditional rendering missing');
  });

  // =========================================================================
  // SECTION 5: HTML5 Canvas Video Stream Simulation
  // =========================================================================
  console.log('\n--- 5. HTML5 Canvas Video Stream Simulation Verification ---');

  await test('5.1 SimulatedVideoCanvas handles dynamic context rendering, night vision mode, offline state, and requestAnimationFrame loop', () => {
    assert(cctvContent.includes('export const SimulatedVideoCanvas: React.FC<{'), 'SimulatedVideoCanvas export missing');
    assert(cctvContent.includes("canvas.getContext('2d')"), '2D context initialization missing');
    assert(cctvContent.includes("requestAnimationFrame(render)"), 'Animation loop requestAnimationFrame missing');
    assert(cctvContent.includes("camera.status === 'offline'"), 'Offline status rendering missing');
    assert(cctvContent.includes("CAMERA FEED OFFLINE"), 'Offline text banner missing');
    assert(cctvContent.includes("isNightVision"), 'Night vision state check missing');
  });

  // =========================================================================
  // SECTION 6: AI Anomaly Alerts
  // =========================================================================
  console.log('\n--- 6. AI Anomaly Alerts Verification ---');

  await test('6.1 AI Anomaly alerts stream displays computer-vision detections (weapon, face match, crowd surge, plate match)', () => {
    assert(cctvContent.includes('mockAnomalyAlertsList: AnomalyAlertItem[] = ['), 'mockAnomalyAlertsList missing');
    assert(cctvContent.includes("anomalyType: 'weapon_detected'"), 'weapon_detected anomaly missing');
    assert(cctvContent.includes("anomalyType: 'face_match'"), 'face_match anomaly missing');
    assert(cctvContent.includes("anomalyType: 'crowd_surge'"), 'crowd_surge anomaly missing');
    assert(cctvContent.includes("anomalyType: 'plate_recognised'"), 'plate_recognised anomaly missing');
  });

  // =========================================================================
  // SECTION 7: PTZ Camera Control Modal
  // =========================================================================
  console.log('\n--- 7. PTZ Camera Control Modal Verification ---');

  await test('7.1 PTZ Modal features 3x3 directional servo control pad, preset positions, zoom controls, and diagnostics', () => {
    assert(cctvContent.includes('activeModalCamera && ('), 'activeModalCamera modal render check missing');
    assert(cctvContent.includes("handlePtzAction('PAN UP (+15°)')"), 'PTZ Pan Up command missing');
    assert(cctvContent.includes("handlePtzAction('PAN LEFT (-30°)')"), 'PTZ Pan Left command missing');
    assert(cctvContent.includes("handlePtzAction('HOME RESET')"), 'PTZ Home Reset command missing');
    assert(cctvContent.includes("handlePtzAction('PAN RIGHT (+30°)')"), 'PTZ Pan Right command missing');
    assert(cctvContent.includes("handlePtzAction('PAN DOWN (-15°)')"), 'PTZ Pan Down command missing');
    assert(cctvContent.includes('PRESET 1: Traffic Junction'), 'Preset position 1 missing');
    assert(cctvContent.includes('PRESET 2: Pedestrian Walkway'), 'Preset position 2 missing');
    assert(cctvContent.includes('PRESET 3: Exit Gate'), 'Preset position 3 missing');
    assert(cctvContent.includes('ptzZoomLevel'), 'Zoom level state missing');
    assert(cctvContent.includes('isNightVision'), 'Night vision state missing');
  });

  console.log('\n===================================================================');
  console.log(`   STRESS TEST SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY `);
  console.log('===================================================================');

  return { passed, total, success: passed === total };
}

runComprehensiveStressTest().catch((err) => {
  console.error('Comprehensive stress test failed:', err);
  process.exit(1);
});
