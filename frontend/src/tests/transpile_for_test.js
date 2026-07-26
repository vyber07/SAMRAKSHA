import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

// Transpile IncidentFrequencyChart.jsx to .js for Node ES module importing
const chartJsxPath = path.resolve('src/components/charts/IncidentFrequencyChart.jsx');
const chartCompiledPath = path.resolve('src/tests/IncidentFrequencyChart.compiled.js');

const jsxCode = fs.readFileSync(chartJsxPath, 'utf8');
const result = esbuild.transformSync(jsxCode, {
  loader: 'jsx',
  jsx: 'automatic',
  target: 'es2022',
  format: 'esm',
});

fs.writeFileSync(chartCompiledPath, result.code);
console.log('Successfully transpiled IncidentFrequencyChart.jsx to IncidentFrequencyChart.compiled.js');
