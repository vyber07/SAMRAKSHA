import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import IncidentFrequencyChart from './IncidentFrequencyChart.compiled.js';

describe('Milestone 1 Challenger — IncidentFrequencyChart Empirical Tests', () => {

  // Helper function to render component to static HTML string
  function renderChart(props = {}) {
    return renderToString(React.createElement(IncidentFrequencyChart, props));
  }

  // Helper to assert that rendered SVG contains no NaN, undefined, or Infinity in attributes
  function assertCleanSVG(html, contextDescription = '') {
    assert.ok(html, `HTML output should not be empty for ${contextDescription}`);
    assert.ok(html.includes('<svg'), `Output should contain <svg> element for ${contextDescription}`);
    
    // Check for NaN in SVG paths and coordinates
    const nanMatches = html.match(/(?:d|x|y|width|height|cx|cy|r|stroke-dasharray|opacity)="[^"]*NaN[^"]*"/g);
    assert.equal(
      nanMatches,
      null,
      `SVG contains NaN attributes in ${contextDescription}: ${JSON.stringify(nanMatches)}`
    );

    // Check for undefined in SVG attributes
    const undefinedMatches = html.match(/(?:d|x|y|width|height|cx|cy|r)="[^"]*undefined[^"]*"/g);
    assert.equal(
      undefinedMatches,
      null,
      `SVG contains undefined attributes in ${contextDescription}: ${JSON.stringify(undefinedMatches)}`
    );

    // Check for Infinity in SVG attributes
    const infinityMatches = html.match(/(?:d|x|y|width|height|cx|cy|r)="[^"]*Infinity[^"]*"/g);
    assert.equal(
      infinityMatches,
      null,
      `SVG contains Infinity attributes in ${contextDescription}: ${JSON.stringify(infinityMatches)}`
    );
  }

  // ─── 1. TOGGLE CONTROLS & RENDERING MODES ─────────────────────────────────────
  test('Render with all Chart Type toggles (Bar, Area, Line)', () => {
    ['bar', 'area', 'line'].forEach((chartType) => {
      const html = renderChart({ defaultChartType: chartType });
      assertCleanSVG(html, `chartType=${chartType}`);

      if (chartType === 'bar') {
        assert.ok(html.includes('class="inc-bar-rect'), 'Bar view should render inc-bar-rect elements');
      } else if (chartType === 'area') {
        assert.ok(html.includes('class="inc-area-path"'), 'Area view should render inc-area-path element');
        assert.ok(html.includes('class="inc-line-path"'), 'Area view should render inc-line-path element');
      } else if (chartType === 'line') {
        assert.ok(html.includes('class="inc-line-path"'), 'Line view should render inc-line-path element');
        assert.ok(!html.includes('class="inc-area-path"'), 'Line view should NOT render inc-area-path element');
      }
    });
  });

  test('Render with all Time Granularity toggles (Hourly, Weekly, Monthly)', () => {
    ['hourly', 'weekly', 'monthly'].forEach((granularity) => {
      const html = renderChart({ defaultGranularity: granularity });
      assertCleanSVG(html, `granularity=${granularity}`);

      if (granularity === 'hourly') {
        assert.ok(html.includes('24-Hour Incident Velocity'), 'Hourly should display hourly subtitle');
      } else if (granularity === 'weekly') {
        assert.ok(html.includes('7-Day Comparative Trend'), 'Weekly should display weekly subtitle');
      } else if (granularity === 'monthly') {
        assert.ok(html.includes('12-Month Historical Dynamics'), 'Monthly should display monthly subtitle');
      }
    });
  });

  // ─── 2. EDGE CASE DATASETS ───────────────────────────────────────────────────
  test('Edge Case: Empty Datasets (Null, Undefined, Empty Objects/Arrays)', () => {
    const emptyPayloads = [
      { trends: null },
      { trends: undefined },
      { trends: {} },
      { trends: { hourly: [], weekly: [], monthly: [] } },
      { data: null },
      { data: {} },
      { data: [] },
    ];

    emptyPayloads.forEach((props, i) => {
      ['hourly', 'weekly', 'monthly'].forEach((g) => {
        ['bar', 'area', 'line'].forEach((t) => {
          const html = renderChart({ ...props, defaultGranularity: g, defaultChartType: t });
          assertCleanSVG(html, `empty payload #${i} (g=${g}, t=${t})`);
        });
      });
    });
  });

  test('Edge Case: Zero Values (All counts = 0)', () => {
    const zeroTrends = {
      hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      weekly: [{ day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }],
      monthly: [{ month: 'Jan', count: 0 }, { month: 'Feb', count: 0 }],
    };

    ['hourly', 'weekly', 'monthly'].forEach((g) => {
      ['bar', 'area', 'line'].forEach((t) => {
        const html = renderChart({ trends: zeroTrends, defaultGranularity: g, defaultChartType: t });
        assertCleanSVG(html, `zero values (g=${g}, t=${t})`);
      });
    });
  });

  test('Edge Case: Max Values (Extremely large integer counts)', () => {
    const maxTrends = {
      hourly: [{ hour: 12, count: 999999999 }],
      weekly: [{ day: 'Fri', count: Number.MAX_SAFE_INTEGER }],
      monthly: [{ month: 'Dec', count: 1000000 }],
    };

    ['hourly', 'weekly', 'monthly'].forEach((g) => {
      ['bar', 'area', 'line'].forEach((t) => {
        const html = renderChart({ trends: maxTrends, defaultGranularity: g, defaultChartType: t });
        assertCleanSVG(html, `max values (g=${g}, t=${t})`);
      });
    });
  });

  test('Edge Case: Single Data Point', () => {
    const singlePointTrends = {
      hourly: [{ hour: 12, count: 42 }],
      weekly: [{ day: 'Wed', count: 88 }],
      monthly: [{ month: 'Jul', count: 500 }],
    };

    ['hourly', 'weekly', 'monthly'].forEach((g) => {
      ['bar', 'area', 'line'].forEach((t) => {
        const html = renderChart({ trends: singlePointTrends, defaultGranularity: g, defaultChartType: t });
        assertCleanSVG(html, `single point (g=${g}, t=${t})`);
      });
    });
  });

  // ─── 3. MALFORMED TRENDS OBJECTS ─────────────────────────────────────────────
  test('Edge Case: Malformed Trends Objects (Invalid types, bad values, out-of-range hours)', () => {
    const malformedPayloads = [
      { trends: 'invalid string' },
      { trends: 12345 },
      { trends: { hourly: 'invalid hourly type' } },
      { trends: { hourly: [null, undefined, {}, { hour: -5 }, { hour: 99 }] } },
      { trends: { weekly: [{ day: 'InvalidDayName', count: 50 }] } },
      { trends: { monthly: [{ month: 'InvalidMonth', count: 100 }] } },
      { trends: { hourly: [{ hour: 0, count: -100 }] } }, // Negative count
    ];

    malformedPayloads.forEach((props, i) => {
      ['hourly', 'weekly', 'monthly'].forEach((g) => {
        ['bar', 'area', 'line'].forEach((t) => {
          const html = renderChart({ ...props, defaultGranularity: g, defaultChartType: t });
          assertCleanSVG(html, `malformed payload #${i} (g=${g}, t=${t})`);
        });
      });
    });
  });

  test('Edge Case: Invalid Non-Numeric String / NaN Counts in Trends', () => {
    const nanTrends = {
      hourly: [{ hour: 0, count: 'invalid_count_string' }, { hour: 1, count: NaN }],
      weekly: [{ day: 'Mon', count: 'abc' }],
      monthly: [{ month: 'Jan', count: 'not_a_number' }],
    };

    ['hourly', 'weekly', 'monthly'].forEach((g) => {
      ['bar', 'area', 'line'].forEach((t) => {
        const html = renderChart({ trends: nanTrends, defaultGranularity: g, defaultChartType: t });
        // This will test if NaN in count pollutes SVG coordinates!
        assertCleanSVG(html, `nan/non-numeric counts (g=${g}, t=${t})`);
      });
    });
  });

  // ─── 4. SVG PATH GENERATION ACCURACY ────────────────────────────────────────
  test('Dynamic SVG Smooth Path Monotone Cubic Bezier Generation', () => {
    const sampleTrends = {
      weekly: [
        { day: 'Mon', count: 10 },
        { day: 'Tue', count: 50 },
        { day: 'Wed', count: 20 },
        { day: 'Thu', count: 80 },
        { day: 'Fri', count: 40 },
        { day: 'Sat', count: 90 },
        { day: 'Sun', count: 30 },
      ],
    };

    const htmlArea = renderChart({ trends: sampleTrends, defaultGranularity: 'weekly', defaultChartType: 'area' });
    assertCleanSVG(htmlArea, 'smooth path cubic Bezier area');

    // Extract d attribute from inc-line-path
    const linePathMatch = htmlArea.match(/class="inc-line-path"[^>]*d="([^"]+)"/);
    assert.ok(linePathMatch, 'inc-line-path should have a d attribute');
    const pathD = linePathMatch[1];
    
    // Path should start with M and contain C (Cubic Bezier curve control points)
    assert.ok(pathD.startsWith('M'), 'Path string should start with M command');
    assert.ok(pathD.includes('C'), 'Path string should contain C command for cubic Bezier smooth curves');

    // Extract d attribute from inc-area-path
    const areaPathMatch = htmlArea.match(/class="inc-area-path"[^>]*d="([^"]+)"/);
    assert.ok(areaPathMatch, 'inc-area-path should have a d attribute');
    const areaD = areaPathMatch[1];
    assert.ok(areaD.endsWith('Z'), 'Area path string should close with Z command');
  });

});
