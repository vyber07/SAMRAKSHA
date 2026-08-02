/**
 * M4 Challenger Verification Test Suite Runner
 */
// Polyfill import.meta.env for standard Node / tsx runners
if (typeof import.meta !== 'undefined' && !import.meta.env) {
  (import.meta as any).env = { VITE_API_BASE_URL: '/api/v1' };
}

async function main() {
  const { runChallengerM4Tests } = await import('./challenger_m4_1.test');
  const result = await runChallengerM4Tests();
  if (!result.success) {
    console.error('M4 Challenger test suite failed!');
    process.exit(1);
  }
  console.log('M4 Challenger empirical verification completed with 100% success.');
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
