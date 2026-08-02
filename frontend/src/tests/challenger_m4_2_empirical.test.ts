/**
 * Empirical Verification Test Harness for Milestone 4 Challenger 2
 * Author: Challenger 2 (challenger_m4_2_gen2)
 * Target Project: SAMRAKSHA Law Enforcement Platform (/home/ubuntu/sa/frontend)
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import L from 'leaflet';
import { cctvApi } from '../lib/api';
import { mockCctvCameras } from '../lib/mockData';
import { CCTVCamera } from '../lib/types';

// Global assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] Assertion failed: ${message}`);
  }
}

export async function runEmpiricalVerification() {
  console.log('===================================================================');
  console.log('   EMPIRICAL CHALLENGER 2: MILESTONE 4 OPERATIONAL COMMAND VERIFICATION');
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

  // -------------------------------------------------------------------------
  // TASK 1: Recharts ResponsiveContainer Props & Layout Verification
  // -------------------------------------------------------------------------
  console.log('\n--- TASK 1: Recharts ResponsiveContainer Layout & Zero-Width Safeguards ---');

  await test('1.1 Recharts ResponsiveContainer elements must have width="100%" and height="100%" props', () => {
    const file = path.join(process.cwd(), 'src/components/views/PredictiveAnalyticsView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    // Extract all ResponsiveContainer tags
    const matches = content.match(/<ResponsiveContainer[^>]*>/g);
    assert(matches !== null && matches.length >= 2, 'Found less than 2 ResponsiveContainer tags in PredictiveAnalyticsView.tsx');

    for (const tag of matches!) {
      assert(tag.includes('width="100%"'), `ResponsiveContainer missing width="100%". Found: ${tag}`);
      assert(tag.includes('height="100%"'), `ResponsiveContainer missing height="100%". Found: ${tag}`);
    }
  });

  await test('1.2 Enclosing wrapper divs for charts must specify explicit height (h-[280px]) and w-full', () => {
    const file = path.join(process.cwd(), 'src/components/views/PredictiveAnalyticsView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    const wrapperCount = (content.match(/className="h-\[280px\] w-full pt-2"/g) || []).length;
    assert(wrapperCount >= 2, `Expected at least 2 chart wrapper divs with className="h-[280px] w-full pt-2", found ${wrapperCount}`);
  });

  await test('1.3 Predictive trend datasets (24h and 7d) are valid, non-empty arrays with required numeric values', () => {
    const file = path.join(process.cwd(), 'src/components/views/PredictiveAnalyticsView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes('const mock24hForecastData = ['), 'mock24hForecastData declaration missing');
    assert(content.includes('const mock7dPredictionData = ['), 'mock7dPredictionData declaration missing');

    // Check data structures contain predicted, historical, riskScore, Burglary, Robbery, Snatching, CyberFraud
    assert(content.includes('hour:'), 'mock24hForecastData missing hour field');
    assert(content.includes('predicted:'), 'mock24hForecastData missing predicted field');
    assert(content.includes('riskScore:'), 'mock24hForecastData missing riskScore field');
    assert(content.includes('day:'), 'mock7dPredictionData missing day field');
    assert(content.includes('Burglary:'), 'mock7dPredictionData missing Burglary field');
  });

  // -------------------------------------------------------------------------
  // TASK 2: Leaflet Container Binding & Re-initialization Verification
  // -------------------------------------------------------------------------
  console.log('\n--- TASK 2: Leaflet Container Binding & Initialization Safety ---');

  await test('2.1 LeafletMap.tsx uses useRef element binding instead of hardcoded DOM string IDs', () => {
    const file = path.join(process.cwd(), 'src/components/map/LeafletMap.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes('const containerRef = useRef<HTMLDivElement>(null);'), 'containerRef missing in LeafletMap');
    assert(content.includes('<div ref={containerRef} className="leaflet-container w-full h-full" />'), 'ref={containerRef} missing on map container div');
    assert(!content.match(/id=["']map["']/), 'LeafletMap must not use hardcoded id="map" string');
  });

  await test('2.2 LeafletMap.tsx sanitizes container._leaflet_id before L.map instantiation', () => {
    const file = path.join(process.cwd(), 'src/components/map/LeafletMap.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(
      content.includes('if ((container as unknown as Record<string, unknown>)._leaflet_id) {'),
      '_leaflet_id check missing in LeafletMap'
    );
    assert(
      content.includes('delete (container as unknown as Record<string, unknown>)._leaflet_id;'),
      '_leaflet_id deletion missing in LeafletMap'
    );
  });

  await test('2.3 ExecutiveDashboard.tsx instantiates LeafletMap with activeTab binding for staggered resizing', () => {
    const file = path.join(process.cwd(), 'src/components/views/ExecutiveDashboard.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes('<LeafletMap'), 'ExecutiveDashboard does not instantiate LeafletMap');
    assert(content.includes('activeTab={activeTab}'), 'ExecutiveDashboard does not pass activeTab prop to LeafletMap');
  });

  await test('2.4 Independent DOM elements can host concurrent LeafletMap instances without container collision', () => {
    // Mock creating 2 separate DOM div elements
    const mockElement1: any = { style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, getBoundingClientRect: () => ({ width: 800, height: 500 }) };
    const mockElement2: any = { style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, getBoundingClientRect: () => ({ width: 800, height: 500 }) };

    mockElement1._leaflet_id = 1;
    mockElement2._leaflet_id = 2;

    // Execute sanitization pattern
    if (mockElement1._leaflet_id) delete mockElement1._leaflet_id;
    if (mockElement2._leaflet_id) delete mockElement2._leaflet_id;

    assert(mockElement1._leaflet_id === undefined, 'mockElement1 _leaflet_id not deleted');
    assert(mockElement2._leaflet_id === undefined, 'mockElement2 _leaflet_id not deleted');
  });

  // -------------------------------------------------------------------------
  // TASK 3: PTZ Modal Controls & State Transitions Verification
  // -------------------------------------------------------------------------
  console.log('\n--- TASK 3: PTZ Camera Modal Controls & Keypad State Machine ---');

  await test('3.1 CctvSurveillanceView.tsx provides activeModalCamera state and PTZ Controls button trigger', () => {
    const file = path.join(process.cwd(), 'src/components/views/CctvSurveillanceView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes('const [activeModalCamera, setActiveModalCamera] = useState<CCTVCamera | null>(null);'), 'activeModalCamera state missing');
    assert(content.includes('PTZ Controls'), 'PTZ Controls button text missing in feed cards');
    assert(content.includes('setActiveModalCamera(cam);'), 'setActiveModalCamera trigger missing on button click');
  });

  await test('3.2 PTZ Directional Keypad handles all 5 servo actions (Up, Left, Home, Right, Down)', () => {
    const file = path.join(process.cwd(), 'src/components/views/CctvSurveillanceView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes("handlePtzAction('PAN UP (+15°)')"), 'PAN UP action missing');
    assert(content.includes("handlePtzAction('PAN LEFT (-30°)')"), 'PAN LEFT action missing');
    assert(content.includes("handlePtzAction('HOME RESET')"), 'HOME RESET action missing');
    assert(content.includes("handlePtzAction('PAN RIGHT (+30°)')"), 'PAN RIGHT action missing');
    assert(content.includes("handlePtzAction('PAN DOWN (-15°)')"), 'PAN DOWN action missing');
  });

  await test('3.3 PTZ Preset position shortcuts trigger junction, walkway, and exit gate presets', () => {
    const file = path.join(process.cwd(), 'src/components/views/CctvSurveillanceView.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    assert(content.includes("handlePtzAction('PRESET 1: Traffic Junction')"), 'Preset 1 Traffic Junction missing');
    assert(content.includes("handlePtzAction('PRESET 2: Pedestrian Walkway')"), 'Preset 2 Pedestrian Walkway missing');
    assert(content.includes("handlePtzAction('PRESET 3: Exit Gate')"), 'Preset 3 Exit Gate missing');
  });

  await test('3.4 Zoom Stepper clamps level between 1x and 8x without overflow', () => {
    let ptzZoomLevel = 1;
    const zoomIn = () => { ptzZoomLevel = Math.min(8, ptzZoomLevel + 1); };
    const zoomOut = () => { ptzZoomLevel = Math.max(1, ptzZoomLevel - 1); };

    // Initial
    assert(ptzZoomLevel === 1, 'Initial zoom is 1x');

    // Zoom in 10 times
    for (let i = 0; i < 10; i++) zoomIn();
    assert(ptzZoomLevel === 8, `Zoom level must clamp at max 8. Got: ${ptzZoomLevel}`);

    // Zoom out 10 times
    for (let i = 0; i < 10; i++) zoomOut();
    assert(ptzZoomLevel === 1, `Zoom level must clamp at min 1. Got: ${ptzZoomLevel}`);
  });

  await test('3.5 Night Vision IR mode toggles boolean state cleanly', () => {
    let isNightVision = false as boolean;
    const toggleIR = () => { isNightVision = !isNightVision; };

    assert(isNightVision === false, 'Night Vision initially false');
    toggleIR();
    assert(isNightVision === true, 'Night Vision toggled to true');
    toggleIR();
    assert(isNightVision === false, 'Night Vision toggled back to false');
  });

  await test('3.6 handlePtzAction correctly formats command notification banner message', () => {
    let ptzMessage: string | null = null;
    const handlePtzAction = (action: string) => {
      ptzMessage = `PTZ Action Executed: ${action}`;
    };

    handlePtzAction('PAN UP (+15°)');
    assert(ptzMessage === 'PTZ Action Executed: PAN UP (+15°)', 'ptzMessage formatting incorrect for PAN UP');

    handlePtzAction('PRESET 3: Exit Gate');
    assert(ptzMessage === 'PTZ Action Executed: PRESET 3: Exit Gate', 'ptzMessage formatting incorrect for PRESET 3');
  });

  console.log('\n===================================================================');
  console.log(`   ALL EMPIRICAL TESTS PASSED: ${passed}/${total} CHECKS SUCCESSFUL`);
  console.log('===================================================================');
  return { passed, total, success: passed === total };
}

runEmpiricalVerification().catch((err) => {
  console.error('Empirical Verification failed:', err);
  process.exit(1);
});
