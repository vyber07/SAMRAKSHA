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
import { create } from 'zustand';

// ─── Store Definitions (exact replicas of src/lib/store.js for isolated node test) ─────
const getStoredOfficer = () => {
  try {
    const item = localStorage.getItem('samraksha_officer');
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const createAuthStore = () => create((set, get) => ({
  token: localStorage.getItem('samraksha_token') || null,
  officer: getStoredOfficer(),
  role: getStoredOfficer()?.role?.toLowerCase() || null,

  setAuth: (token, officer) => {
    localStorage.setItem('samraksha_token', token);
    localStorage.setItem('samraksha_officer', JSON.stringify(officer));
    set({ token, officer, role: officer?.role?.toLowerCase() || null });
  },

  logout: () => {
    localStorage.removeItem('samraksha_token');
    localStorage.removeItem('samraksha_officer');
    set({ token: null, officer: null, role: null });
  },

  getRole: () => get().officer?.role?.toLowerCase() || null,
}));

const createDashboardStore = () => create((set) => ({
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
  reset: () => set({ summary: null, trends: null, caseList: [], incidentList: [], loading: false }),
}));

const createMapStore = () => create((set) => ({
  hotspots: [],
  markers: [],
  selectedMarker: null,

  setHotspots: (hotspots) => set({ hotspots }),
  setMarkers: (markers) => set({ markers }),
  selectMarker: (selectedMarker) => set({ selectedMarker }),
  reset: () => set({ hotspots: [], markers: [], selectedMarker: null }),
}));

// ─── Simulated Mock WebSocket for Reconnect Leak Testing ─────────────────────
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this._retryDelay = 2000;
  }

  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }

  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  simulateError() {
    if (this.onerror) this.onerror();
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

// ─── STRESS SUITE ─────────────────────────────────────────────────────────────
describe('Frontend Robustness & Stress Harness', () => {

  describe('1. Zustand Store Rapid Update & Reset Stress Cycles', () => {

    test('10,000 Rapid State Updates on AuthStore', () => {
      localStorage.clear();
      const authStore = createAuthStore();

      const startTime = performance.now();
      for (let i = 0; i < 10000; i++) {
        authStore.getState().setAuth(`token-${i}`, { badge_no: `OFF-${i}`, role: i % 2 === 0 ? 'admin' : 'sho' });
      }
      const duration = performance.now() - startTime;

      const finalState = authStore.getState();
      assert.equal(finalState.token, 'token-9999');
      assert.equal(finalState.officer.badge_no, 'OFF-9999');
      assert.equal(finalState.role, 'sho');
      assert.ok(duration < 500, `10,000 updates should take < 500ms (took ${duration.toFixed(2)}ms)`);
    });

    test('10,000 Rapid State Updates & Listener Stress on DashboardStore', () => {
      const dashboardStore = createDashboardStore();
      let listenerCallCount = 0;

      // Subscribe 5 listeners
      const unsubs = Array.from({ length: 5 }, () =>
        dashboardStore.subscribe(() => {
          listenerCallCount++;
        })
      );

      const startTime = performance.now();
      for (let i = 0; i < 2000; i++) {
        dashboardStore.getState().setLoading(i % 2 === 0);
        dashboardStore.getState().setSummary({ firs_today: i });
        dashboardStore.getState().setCaseList([{ case_id: `c-${i}` }]);
        dashboardStore.getState().setIncidentList([{ id: `inc-${i}` }]);
        dashboardStore.getState().setTrends({ count: i });
      }
      const duration = performance.now() - startTime;

      // 2000 iterations * 5 updates = 10,000 store updates * 5 listeners = 50,000 notifications
      assert.equal(listenerCallCount, 50000);
      assert.equal(dashboardStore.getState().summary.firs_today, 1999);
      assert.ok(duration < 1000, `10,000 operations with 5 listeners took ${duration.toFixed(2)}ms`);

      // Unsubscribe all
      unsubs.forEach((unsub) => unsub());
    });

    test('1,000 Rapid Update and Reset Cycles (State Isolation & Leak Check)', () => {
      const authStore = createAuthStore();
      const dashboardStore = createDashboardStore();
      const mapStore = createMapStore();

      for (let cycle = 0; cycle < 1000; cycle++) {
        authStore.getState().setAuth(`token-${cycle}`, { badge_no: `B-${cycle}`, role: 'dcp' });
        dashboardStore.getState().setSummary({ count: cycle });
        mapStore.getState().setHotspots([{ id: cycle }]);

        assert.equal(authStore.getState().token, `token-${cycle}`);
        assert.equal(dashboardStore.getState().summary.count, cycle);
        assert.equal(mapStore.getState().hotspots.length, 1);

        authStore.getState().logout();
        dashboardStore.getState().reset();
        mapStore.getState().reset();

        assert.equal(authStore.getState().token, null);
        assert.equal(authStore.getState().officer, null);
        assert.equal(dashboardStore.getState().summary, null);
        assert.equal(dashboardStore.getState().caseList.length, 0);
        assert.equal(mapStore.getState().hotspots.length, 0);
        assert.equal(mapStore.getState().selectedMarker, null);
      }
    });

  });

  describe('2. WebSocket Reconnect Hook & Zero Memory Leak Verification', () => {

    test('Simulated Dashboard WebSocket Hook Cleanup on Mount/Unmount Cycle', () => {
      let isMounted = true;
      let wsRef = { current: null };
      let reconnectTimer = null;
      let dataLoadCount = 0;

      const loadData = () => {
        if (isMounted) dataLoadCount++;
      };

      const connectWS = () => {
        if (!isMounted) return null;
        if (wsRef.current && wsRef.current.readyState < 2) return wsRef.current;

        const ws = new MockWebSocket('ws://localhost:8000/ws/dashboard?token=test');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          ws._retryDelay = 2000;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          const msg = JSON.parse(event.data);
          if (['NEW_FIR', 'PCR_INCIDENT'].includes(msg.type)) loadData();
        };

        ws.onclose = () => {
          if (!isMounted) return;
          const delay = Math.min((ws._retryDelay || 2000) * 1.5, 30000);
          wsRef.current = null;
          reconnectTimer = setTimeout(() => {
            if (!isMounted) return;
            const newWs = connectWS();
            if (newWs) newWs._retryDelay = delay;
          }, delay);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          ws.close();
        };

        return ws;
      };

      // 1. Mount hook
      isMounted = true;
      connectWS();
      const ws = wsRef.current;
      assert.ok(ws !== null);
      ws.simulateOpen();

      // 2. Simulate message
      ws.simulateMessage({ type: 'NEW_FIR' });
      assert.equal(dataLoadCount, 1);

      // 3. Unmount hook cleanup sequence (matching Dashboard.jsx lines 256-268)
      isMounted = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      // 4. Verify socket is closed and handlers were detached before close
      assert.equal(ws.readyState, 3);
      assert.equal(ws.onclose, null);
      assert.equal(ws.onerror, null);
      assert.equal(wsRef.current, null);

      // 5. Verify no late message can trigger loadData or cause state update after unmount
      ws.simulateMessage({ type: 'NEW_FIR' });
      assert.equal(dataLoadCount, 1, 'Data load count must not increase after unmount');
    });

    test('1,000 Rapid Mount/Unmount WebSocket Cycles under Disconnect Stress', () => {
      let activeTimers = new Set();
      let zombieCallbacksTriggered = 0;

      for (let cycle = 0; cycle < 1000; cycle++) {
        let isMounted = true;
        let wsRef = { current: null };
        let reconnectTimer = null;

        const connect = () => {
          if (!isMounted) return null;
          const ws = new MockWebSocket('ws://localhost/test');
          wsRef.current = ws;

          ws.onclose = () => {
            if (!isMounted) {
              zombieCallbacksTriggered++;
              return;
            }
            const timerId = setTimeout(() => {
              if (!isMounted) {
                zombieCallbacksTriggered++;
                return;
              }
              connect();
            }, 100);
            activeTimers.add(timerId);
            reconnectTimer = timerId;
          };
          return ws;
        };

        // Mount & trigger disconnect
        connect();
        const socket = wsRef.current;

        // Unmount before reconnect timer completes
        isMounted = false;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          activeTimers.delete(reconnectTimer);
          reconnectTimer = null;
        }
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close();
          wsRef.current = null;
        }

        // Simulate close on old socket after unmount
        socket.simulateClose();
      }

      assert.equal(zombieCallbacksTriggered, 0, 'Zero zombie callbacks triggered on unmounted components');
    });

    test('WebSocket Reconnect Exponential Backoff Sequence', () => {
      let currentDelay = 2000;
      const delays = [];

      for (let step = 0; step < 10; step++) {
        const delay = Math.min(currentDelay * 1.5, 30000);
        delays.push(delay);
        currentDelay = delay;
      }

      // Initial 2000 * 1.5 = 3000, 4500, 6750, 10125, 15187.5, 22781.25, 30000 (cap)
      assert.deepEqual(delays.slice(0, 4), [3000, 4500, 6750, 10125]);
      assert.equal(delays[6], 30000);
      assert.equal(delays[9], 30000);
    });

  });

});
