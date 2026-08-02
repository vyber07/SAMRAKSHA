/**
 * Test Harness Suite: M2 Empirical Verification
 */
import { testLutBoundsAndScaling } from './lut.test';
import { simulateLayerStateTransitions } from './layerVisibility.test';
import { simulateDarkModeMutationObserver } from './mutationObserver.test';
import { runChallengerM4Tests } from './challenger_m4_1.test';
import { runChallengerM42Tests } from './challenger_m4_2.test';

export async function runAllM2Tests() {
  console.log('=== RUNNING ALL EMPIRICAL TEST SUITES ===');

  const lutRes = testLutBoundsAndScaling();
  console.log('[PASS] LUT Calculation & Alpha Scaling:', lutRes);

  const layerRes = simulateLayerStateTransitions();
  console.log('[PASS] Layer Visibility State Machine & Stress:', layerRes);

  const modeRes = simulateDarkModeMutationObserver();
  console.log('[PASS] Dark Mode MutationObserver & Tile Switch:', modeRes);

  console.log('\n=== RUNNING CHALLENGER 1 M4 TESTS ===');
  await runChallengerM4Tests();

  console.log('\n=== RUNNING CHALLENGER 2 M4 TESTS ===');
  await runChallengerM42Tests();

  console.log('\n=== ALL EMPIRICAL TESTS PASSED SUCCESSFULLY ===');
  return { success: true };
}

runAllM2Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

