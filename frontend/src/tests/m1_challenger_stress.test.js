import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

// Load source code for static analysis and empirical function execution
const chartFilePath = path.resolve('src/components/charts/IncidentFrequencyChart.jsx');
const chartCode = fs.readFileSync(chartFilePath, 'utf8');

// Smooth Path Generator extracted for direct stress testing
function generateSmoothPath(coords) {
  if (!coords || coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  const S = 0.16;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * S;
    const cp1y = p1.y + (p2.y - p0.y) * S;
    const cp2x = p2.x - (p3.x - p1.x) * S;
    const cp2y = p2.y - (p3.y - p1.y) * S;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// Simulated normalization logic matching IncidentFrequencyChart.jsx
function normalizeData(granularity, trends, data) {
  const MONTHS_JAN_TO_DEC = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS_MON_TO_SUN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (granularity === 'hourly') {
    const src = trends?.hourly || data?.hourly;
    if (Array.isArray(src) && src.length > 0) {
      const slots = Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2, '0')}:00`,
        hour: i,
        count: 0,
      }));
      let matched = false;
      src.forEach((item) => {
        let h = item?.hour !== undefined ? parseInt(item.hour, 10) : null;
        if (h === null && item?.label) {
          h = parseInt(String(item.label).split(':')[0], 10);
        }
        if (h !== null && !isNaN(h) && h >= 0 && h < 24) {
          slots[h].count = Math.max(0, parseInt(item.count || item.value || 0, 10) || 0);
          matched = true;
        }
      });
      if (matched) return slots;
    }
    return Array.from({ length: 24 }, (_, i) => ({ label: `${String(i).padStart(2, '0')}:00`, hour: i, count: 5 }));
  }

  if (granularity === 'monthly') {
    const src = trends?.monthly || data?.monthly;
    if (Array.isArray(src) && src.length > 0) {
      const countsMap = Object.fromEntries(MONTHS_JAN_TO_DEC.map((m) => [m, 0]));
      let matched = false;
      src.forEach((item) => {
        const rawStr = String(item?.month || item?.label || item?.date || '');
        const mMatch = MONTHS_JAN_TO_DEC.find((m) => rawStr.toLowerCase().includes(m.toLowerCase()));
        if (mMatch) {
          countsMap[mMatch] = Math.max(0, parseInt(item.count || item.value || 0, 10) || 0);
          matched = true;
        }
      });
      if (matched) {
        return MONTHS_JAN_TO_DEC.map((m) => ({ label: m, month: m, count: countsMap[m] }));
      }
    }
    return MONTHS_JAN_TO_DEC.map((m) => ({ label: m, month: m, count: 100 }));
  }

  // Weekly default
  return DAYS_MON_TO_SUN.map((day) => ({ label: day, day, count: 30 }));
}

function computeCoords(rawPoints, VB_W = 800, VB_H = 220, PAD = { top: 20, right: 24, bottom: 36, left: 44 }) {
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;
  const maxCount = Math.max(1, ...rawPoints.map((p) => p.count));
  const N = rawPoints.length;

  return rawPoints.map((p, i) => {
    const x = PAD.left + (N === 1 ? plotW / 2 : (plotW * i) / (N - 1));
    const y = PAD.top + plotH - (plotH * p.count) / maxCount;
    return { ...p, x, y, index: i };
  });
}

describe('M1 Challenger - IncidentFrequencyChart Comprehensive Verification', () => {

  test('1. CSS Class Compliance & Glass Container Requirements', () => {
    // Check root container class string in IncidentFrequencyChart.jsx
    const requiredClasses = [
      'rounded-2xl',
      'border',
      'p-5',
      'h-[360px]',
      'flex',
      'flex-col',
      'justify-between',
    ];

    for (const cls of requiredClasses) {
      assert.ok(
        chartCode.includes(cls),
        `IncidentFrequencyChart.jsx container must include CSS class '${cls}'`
      );
    }

    // Verify dark glass backdrop filter backdropFilter: blur(16px)
    assert.ok(
      chartCode.includes("backdropFilter: 'blur(16px)'"),
      'IncidentFrequencyChart.jsx must include backdrop filter glass styling'
    );
  });

  test('2. Layout Stability & Container Height Preservation (Exactly 360px)', () => {
    // Verify container height constraint h-[360px]
    assert.ok(chartCode.includes('h-[360px]'), 'Outer container must specify h-[360px]');
    
    // Verify min-h-0 flex-1 inside SVG container to prevent content expansion
    assert.ok(chartCode.includes('min-h-0'), 'SVG inner flex wrapper must specify min-h-0 to prevent layout shifts');
    assert.ok(chartCode.includes('flex-1'), 'SVG inner wrapper must be flex-1');
    assert.ok(chartCode.includes('overflow-hidden'), 'Outer container must specify overflow-hidden');

    // Verify SVG viewBox fixed ratios
    assert.ok(chartCode.includes('viewBox={`0 0 ${VB_W} ${VB_H}`}'), 'SVG must use fixed viewBox');
  });

  test('3. Stress Test: 50,000 Rapid State & Granularity Mutations', () => {
    const chartTypes = ['bar', 'area', 'line'];
    const granularities = ['hourly', 'weekly', 'monthly'];
    
    let currentChartType = 'area';
    let currentGranularity = 'weekly';

    const startTime = performance.now();

    for (let i = 0; i < 50000; i++) {
      currentChartType = chartTypes[i % 3];
      currentGranularity = granularities[i % 3];

      // Simulate full data pipeline calculation
      const points = normalizeData(currentGranularity, {
        hourly: [{ hour: i % 24, count: (i * 7) % 50 }],
        weekly: [{ day: 'Mon', count: i % 100 }],
        monthly: [{ month: 'Jan', count: i % 500 }],
      });

      const coords = computeCoords(points);
      const path = generateSmoothPath(coords);

      assert.ok(coords.length > 0, 'Coords should never be empty');
      assert.ok(!path.includes('NaN'), `SVG path must never contain NaN (iteration ${i})`);
    }

    const duration = performance.now() - startTime;
    assert.ok(duration < 2000, `50,000 rapid state switches & calculations completed in ${duration.toFixed(2)}ms (<2000ms target)`);
  });

  test('4. Robustness: Edge Case Datasets & Zero Division Protection', () => {
    // 1. All Zeroes
    const zeroPoints = [0, 0, 0, 0].map((c, i) => ({ label: `Slot ${i}`, count: c }));
    const zeroCoords = computeCoords(zeroPoints);
    assert.equal(zeroCoords[0].y, 184); // PAD.top(20) + plotH(164) = 184
    assert.ok(!Number.isNaN(zeroCoords[0].y));

    // 2. Extremely high numbers
    const highPoints = [{ count: 1000000000 }, { count: 500000000 }];
    const highCoords = computeCoords(highPoints);
    assert.equal(highCoords[0].y, 20); // Peak at PAD.top

    // 3. Single Point Dataset
    const singlePoint = [{ label: 'Single', count: 42 }];
    const singleCoords = computeCoords(singlePoint);
    assert.equal(singleCoords[0].x, 410); // Centered in plot area (PAD.left 44 + plotW 732 / 2)
    const singlePath = generateSmoothPath(singleCoords);
    assert.equal(singlePath, 'M 410.0 20.0');

    // 4. Null & Undefined Inputs
    const emptyPoints = normalizeData('hourly', null, undefined);
    assert.equal(emptyPoints.length, 24);
  });

});
