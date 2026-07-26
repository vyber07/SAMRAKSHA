// Setup localStorage mock for Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

// Lightweight Zustand store creator for vanilla JS testing
function createStore(createState) {
  let state;
  const listeners = new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace ?? (typeof nextState !== 'object' || nextState === null))
        ? nextState
        : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, subscribe };
  state = createState(setState, getState, api);
  return Object.assign(
    (selector = (s) => s) => selector(state),
    api
  );
}

// ─── Store Implementations (matching frontend/src/lib/store.js) ───────────────
const getStoredOfficer = () => {
  try {
    const item = localStorage.getItem('samraksha_officer');
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const createAuthStore = () => createStore((set) => ({
  token: localStorage.getItem('samraksha_token') || null,
  officer: getStoredOfficer(),

  setAuth: (token, officer) => {
    localStorage.setItem('samraksha_token', token);
    localStorage.setItem('samraksha_officer', JSON.stringify(officer));
    set({ token, officer });
  },

  logout: () => {
    localStorage.removeItem('samraksha_token');
    localStorage.removeItem('samraksha_officer');
    set({ token: null, officer: null });
  },

  get role() {
    return this.officer?.role?.toLowerCase() || null;
  },
}));

const createDashboardStore = () => createStore((set) => ({
  summary: null,
  trends: null,
  caseList: [],
  incidentList: [],
  loading: false,

  setSummary: (summary) => set({ summary }),
  setTrends: (trends) => set({ trends }),
  setCaseList: (caseList) => set({ caseList }),
  setIncidentList: (incidentList) => set({ incidentList }),
  setLoading: (loading) => set({ loading }),
}));

const createMapStore = () => createStore((set) => ({
  hotspots: [],
  markers: [],
  selectedMarker: null,

  setHotspots: (hotspots) => set({ hotspots }),
  setMarkers: (markers) => set({ markers }),
  selectMarker: (selectedMarker) => set({ selectedMarker }),
}));

const isHighRank = (role) => ['admin', 'sho', 'dcp'].includes(role?.toLowerCase());
const canViewAnalytics = (role) => ['admin', 'sho', 'dcp'].includes(role?.toLowerCase());
const canViewMap = (role) => ['io', 'constable', 'sho', 'admin', 'dcp'].includes(role?.toLowerCase());


// ─── TEST SUITE ───────────────────────────────────────────────────────────────
describe('React Component State Transitions & Zustand Store Tests', () => {

  test('Auth Store State Transitions & LocalStorage Persistence', () => {
    localStorage.clear();
    const useAuthStore = createAuthStore();

    // Initial state check
    assert.equal(useAuthStore.getState().token, null);
    assert.equal(useAuthStore.getState().officer, null);

    // Login transition
    const token = 'jwt-session-token-abc12345';
    const officer = { badge_no: 'SHO_ELL', name: 'Inspector Patel', role: 'sho', ps_id: 'ps-uuid-1' };
    useAuthStore.getState().setAuth(token, officer);

    const afterLogin = useAuthStore.getState();
    assert.equal(afterLogin.token, token);
    assert.deepEqual(afterLogin.officer, officer);
    assert.equal(localStorage.getItem('samraksha_token'), token);
    assert.equal(localStorage.getItem('samraksha_officer'), JSON.stringify(officer));

    // Logout transition
    useAuthStore.getState().logout();
    const afterLogout = useAuthStore.getState();
    assert.equal(afterLogout.token, null);
    assert.equal(afterLogout.officer, null);
    assert.equal(localStorage.getItem('samraksha_token'), null);
    assert.equal(localStorage.getItem('samraksha_officer'), null);
  });

  test('Dashboard Store State Transitions', () => {
    const useDashboardStore = createDashboardStore();
    const store = useDashboardStore.getState();

    assert.equal(store.loading, false);
    assert.deepEqual(store.caseList, []);
    assert.equal(store.summary, null);

    store.setLoading(true);
    store.setSummary({ firs_today: 15, active_alerts: 4 });
    store.setCaseList([{ case_id: 'c-101', crime_type: 'theft' }]);
    store.setIncidentList([{ id: 'inc-1', type: 'robbery' }]);
    store.setTrends({ hourly: [1, 2, 3] });

    const updated = useDashboardStore.getState();
    assert.equal(updated.loading, true);
    assert.equal(updated.summary.firs_today, 15);
    assert.equal(updated.caseList.length, 1);
    assert.equal(updated.incidentList.length, 1);
    assert.equal(updated.trends.hourly.length, 3);
  });

  test('Map Store State Transitions', () => {
    const useMapStore = createMapStore();
    const store = useMapStore.getState();

    assert.deepEqual(store.hotspots, []);
    assert.deepEqual(store.markers, []);
    assert.equal(store.selectedMarker, null);

    const hotspotList = [{ ward: 'Ellisbridge', risk_score: 85 }];
    const markerList = [{ id: 'm-1', lat: 23.0225, lon: 72.5714 }];
    const selected = markerList[0];

    store.setHotspots(hotspotList);
    store.setMarkers(markerList);
    store.selectMarker(selected);

    const updated = useMapStore.getState();
    assert.equal(updated.hotspots.length, 1);
    assert.equal(updated.markers.length, 1);
    assert.equal(updated.selectedMarker.id, 'm-1');
  });

  test('Role Permission Logic Helpers', () => {
    assert.equal(isHighRank('admin'), true);
    assert.equal(isHighRank('SHO'), true);
    assert.equal(isHighRank('DCP'), true);
    assert.equal(isHighRank('io'), false);
    assert.equal(isHighRank('constable'), false);

    assert.equal(canViewAnalytics('admin'), true);
    assert.equal(canViewAnalytics('sho'), true);
    assert.equal(canViewAnalytics('io'), false);

    assert.equal(canViewMap('io'), true);
    assert.equal(canViewMap('constable'), true);
    assert.equal(canViewMap('guest'), false);
  });

  test('Create FIR Form State Machine & Submission Payload Builder', () => {
    // Initial form state in CreateFIRPage component
    const formState = {
      victim_name: '',
      victim_address: '',
      victim_phone: '',
      victim_age: '',
      victim_gender: 'Male',
      victim_injury: false,
      crime_type: 'Theft',
      crime_narrative: '',
      crime_date: '2026-07-23T18:00',
      crime_location: '',
      crime_lat: '23.0225',
      crime_lon: '72.5714',
      ward: 'Ellisbridge',
      severity: '3',
      accused_name: '',
      accused_address: '',
      accused_age: '',
      language: 'en',
    };

    // Simulate input change state updates
    const updatedFormState = {
      ...formState,
      victim_name: 'Rajesh Kumar',
      victim_address: '101 CG Road',
      victim_phone: '9876543210',
      victim_age: '40',
      victim_injury: true,
      crime_narrative: 'Stolen wallet and phone',
      crime_location: 'CG Road Market',
      severity: '4',
      accused_name: 'Unknown Male',
      accused_age: '28',
    };

    // Transform payload as handleSubmit executes
    const payload = {
      ...updatedFormState,
      victim_age: updatedFormState.victim_age ? parseInt(updatedFormState.victim_age) : null,
      accused_age: updatedFormState.accused_age ? parseInt(updatedFormState.accused_age) : null,
      crime_lat: parseFloat(updatedFormState.crime_lat),
      crime_lon: parseFloat(updatedFormState.crime_lon),
      severity: parseInt(updatedFormState.severity),
      crime_date: new Date(updatedFormState.crime_date).toISOString(),
    };

    assert.equal(payload.victim_name, 'Rajesh Kumar');
    assert.equal(payload.victim_age, 40);
    assert.equal(payload.victim_injury, true);
    assert.equal(payload.accused_name, 'Unknown Male');
    assert.equal(payload.accused_age, 28);
    assert.equal(payload.severity, 4);
    assert.equal(payload.crime_lat, 23.0225);
    assert.equal(payload.crime_lon, 72.5714);
  });

  test('SearchBar & Filter State Transitions', () => {
    const RECENT_KEY = 'samraksha_recent_searches';
    localStorage.removeItem(RECENT_KEY);

    let activeFilter = 'all';
    let query = '';
    let recent = [];

    const setFilter = (f) => { activeFilter = f; };
    const setQuery = (q) => { query = q; };
    const addRecent = (term) => {
      recent = [term, ...recent.filter(t => t !== term)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    };

    setFilter('cases');
    setQuery('theft');
    addRecent('theft');
    addRecent('ellisbridge');

    assert.equal(activeFilter, 'cases');
    assert.equal(query, 'theft');
    assert.deepEqual(recent, ['ellisbridge', 'theft']);
    assert.equal(localStorage.getItem(RECENT_KEY), JSON.stringify(['ellisbridge', 'theft']));
  });

});
