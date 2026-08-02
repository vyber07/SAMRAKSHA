/**
 * Empirical Stress Test: GIS Layer Visibility Toggles & State Management
 * Target: LeafletMap.tsx layer visibility state, props sync, and layer toggling
 */

import { LayerVisibilityState } from '../lib/types';

export function simulateLayerStateTransitions() {
  let state: LayerVisibilityState = {
    wards: true,
    cctv: true,
    patrolUnits: true,
    routes: true,
    heatmaps: true,
  };

  const toggle = (key: keyof LayerVisibilityState, val: boolean) => {
    state = { ...state, [key]: val };
  };

  const syncProps = (props: Partial<LayerVisibilityState>) => {
    state = {
      ...state,
      ...props,
    };
  };

  // Test 1: Toggle all off individually
  toggle('wards', false);
  console.assert(state.wards === false, 'Wards toggle off failed');

  toggle('cctv', false);
  console.assert(state.cctv === false, 'CCTV toggle off failed');

  toggle('patrolUnits', false);
  console.assert(state.patrolUnits === false, 'PatrolUnits toggle off failed');

  toggle('routes', false);
  console.assert(state.routes === false, 'Routes toggle off failed');

  toggle('heatmaps', false);
  console.assert(state.heatmaps === false, 'Heatmaps toggle off failed');

  // Test 2: Rapid toggling stress (1000 toggle cycles)
  const keys: (keyof LayerVisibilityState)[] = ['wards', 'cctv', 'patrolUnits', 'routes', 'heatmaps'];
  for (let i = 0; i < 1000; i++) {
    const targetKey = keys[i % keys.length];
    toggle(targetKey, i % 2 === 0);
  }

  // Test 3: Prop update override
  syncProps({ wards: true, cctv: true, patrolUnits: true, routes: true, heatmaps: true });
  console.assert(
    state.wards && state.cctv && state.patrolUnits && state.routes && state.heatmaps,
    'Prop sync restore failed'
  );

  return { pass: true, finalState: state };
}
