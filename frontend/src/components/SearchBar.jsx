import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cases, incidents } from '../lib/api';

const RECENT_KEY = 'samraksha.recent';

const FILTERS = [
  { id: 'all', label: 'All', route: '/cases' },
  { id: 'cases', label: 'Cases', route: '/cases' },
  { id: 'incidents', label: 'Incidents', route: '/incidents' },
  { id: 'officers', label: 'Officers', route: '/admin' },
  { id: 'locations', label: 'Locations', route: '/incidents' },
];

const STATIC_SUGGESTIONS = [
  { type: 'case', label: 'Recent FIRs today', value: 'FIR today' },
  { type: 'case', label: 'Theft cases', value: 'theft' },
  { type: 'case', label: 'Assault cases', value: 'assault' },
  { type: 'incident', label: 'Active incidents', value: 'active' },
  { type: 'location', label: 'High-risk zones', value: 'high risk' },
];

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function writeRecent(query) {
  try {
    const q = String(query || '').trim();
    if (!q) return readRecent();
    const existing = readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase());
    const next = [q, ...existing].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readRecent();
  }
}

const TYPE_ICON = {
  case: '📁',
  incident: '🚨',
  officer: '👮',
  location: '📍',
  suggestion: '✨',
};

export default function SearchBar() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState(() => readRecent());
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // Build a flat, navigable list of dropdown rows for keyboard nav.
  const rows = [];
  suggestions.forEach((s) => rows.push({ kind: 'suggestion', data: s }));
  recent.forEach((r) => rows.push({ kind: 'recent', data: r }));

  // ---- Live suggestions (debounced 300ms) ----
  const fetchSuggestions = useCallback(async (q) => {
    const term = q.trim();
    if (!term) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = [];
    try {
      const caseRes = await cases.search(term);
      const caseItems = caseRes?.data?.items || caseRes?.data || [];
      (Array.isArray(caseItems) ? caseItems : []).slice(0, 4).forEach((c) => {
        results.push({
          type: 'case',
          label: c.fir_no ? `${c.fir_no} — ${c.crime_type || 'Case'}` : (c.crime_type || 'Case'),
          sub: c.victim_name || c.accused_name || '',
          value: c.fir_no || c.crime_type || term,
        });
      });
    } catch {
      /* fall through to static fallback below */
    }
    try {
      const incRes = await incidents.listMap();
      const incItems = incRes?.data?.items || incRes?.data || [];
      (Array.isArray(incItems) ? incItems : [])
        .filter((i) => {
          const hay = `${i.type || ''} ${i.title || ''} ${i.location || ''}`.toLowerCase();
          return hay.includes(term.toLowerCase());
        })
        .slice(0, 3)
        .forEach((i) => {
          results.push({
            type: 'incident',
            label: i.title || i.type || 'Incident',
            sub: i.location || '',
            value: i.title || i.type || term,
          });
        });
    } catch {
      /* ignore */
    }

    if (results.length === 0) {
      // Static demo fallback so the UI never looks broken.
      STATIC_SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(term.toLowerCase()) ||
        s.value.toLowerCase().includes(term.toLowerCase()),
      )
        .slice(0, 5)
        .forEach((s) => results.push({ type: s.type, label: s.label, sub: '', value: s.value }));
      if (results.length === 0) {
        results.push({ type: 'suggestion', label: `Search “${term}”`, sub: '', value: term });
      }
    }

    setSuggestions(results.slice(0, 7));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // ---- Click outside to close ----
  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // ---- Navigation / selection ----
  const go = useCallback(
    (term) => {
      const q = String(term || '').trim();
      if (!q) return;
      setRecent(writeRecent(q));
      const filter = FILTERS.find((f) => f.id === activeFilter) || FILTERS[0];
      navigate(`${filter.route}?q=${encodeURIComponent(q)}`);
      setOpen(false);
      setHighlight(-1);
    },
    [activeFilter, navigate],
  );

  const selectRow = useCallback(
    (row) => {
      if (!row) return go(query);
      if (row.kind === 'suggestion') return go(row.data.value);
      if (row.kind === 'recent') return go(row.data);
      return go(query);
    },
    [go, query],
  );

  // ---- Keyboard nav ----
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => (rows.length ? (h + 1) % rows.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (rows.length ? (h - 1 + rows.length) % rows.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && highlight < rows.length) selectRow(rows[highlight]);
      else go(query);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
      inputRef.current?.blur();
    }
  };

  const clearInput = () => {
    setQuery('');
    setSuggestions([]);
    setHighlight(-1);
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  };

  const showDropdown = open && (query.trim() || recent.length > 0 || loading);

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', maxWidth: 760, margin: '0 auto' }}>
      {/* ---- Search input ---- */}
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 56,
          padding: '0 16px',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--primary)',
          background: 'rgba(30, 41, 59, 0.55)',
          boxShadow: open
            ? '0 8px 32px rgba(37, 99, 235, 0.28), 0 0 0 3px rgba(37, 99, 235, 0.15)'
            : '0 4px 20px rgba(0, 0, 0, 0.25)',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }} aria-hidden>
          🔍
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search cases, incidents, officers, locations…"
          aria-label="Quick search"
          style={{
            flex: 1,
            minWidth: 0,
            height: 54,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 17,
            fontFamily: 'var(--font-body)',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="Clear search"
            style={iconBtnStyle}
          >
            ✕
          </button>
        )}
        <span aria-hidden style={{ width: 1, height: 26, background: 'var(--border)', flexShrink: 0 }} />
        <button type="button" onClick={() => setOpen(true)} aria-label="Filters" style={{ ...iconBtnStyle, color: 'var(--tertiary)' }}>
          ⚙️
        </button>
        <button type="button" aria-label="Voice search" style={{ ...iconBtnStyle, color: 'var(--primary)' }}>
          🎙️
        </button>
      </div>

      {/* ---- Quick filter chips ---- */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {FILTERS.map((f) => {
          const active = f.id === activeFilter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFilter(f.id);
                inputRef.current?.focus();
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                letterSpacing: '0.02em',
                padding: '7px 16px',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: active ? 'var(--primary)' : 'rgba(30, 41, 59, 0.5)',
                color: active ? '#fff' : 'var(--text-muted)',
                fontWeight: active ? 600 : 500,
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ---- Dropdown panel ---- */}
      {showDropdown && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 56px)',
            left: 0,
            right: 0,
            zIndex: 50,
            padding: 8,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'rgba(15, 23, 42, 0.92)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(12px)',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {/* Live suggestions */}
          {query.trim() && (
            <div>
              <div style={sectionLabelStyle}>
                {loading ? 'Searching…' : 'Suggestions'}
              </div>
              {suggestions.length === 0 && !loading && (
                <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 14 }}>
                  No matches — press Enter to search.
                </div>
              )}
              {suggestions.map((s, i) => {
                const idx = i;
                const isHi = highlight === idx;
                return (
                  <button
                    key={`s-${i}`}
                    type="button"
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => go(s.value)}
                    style={{ ...rowStyle, background: isHi ? 'rgba(37, 99, 235, 0.22)' : 'transparent' }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden>
                      {TYPE_ICON[s.type] || '✨'}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                      <span style={{ color: 'var(--text)', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                      {s.sub && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.sub}
                        </span>
                      )}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                      {s.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div style={{ marginTop: query.trim() ? 6 : 0 }}>
              <div style={{ ...sectionLabelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Recent</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={clearRecent}
                  onKeyDown={(e) => e.key === 'Enter' && clearRecent()}
                  style={{ cursor: 'pointer', color: 'var(--primary)', fontFamily: 'var(--font-body)', fontSize: 12, textTransform: 'none', letterSpacing: 0 }}
                >
                  Clear
                </span>
              </div>
              {recent.map((r, i) => {
                const idx = suggestions.length + i;
                const isHi = highlight === idx;
                return (
                  <button
                    key={`r-${i}`}
                    type="button"
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => go(r)}
                    style={{ ...rowStyle, background: isHi ? 'rgba(37, 99, 235, 0.22)' : 'transparent' }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }} aria-hidden>
                      🕘
                    </span>
                    <span style={{ color: 'var(--text)', fontSize: 14.5, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 15,
  flexShrink: 0,
  transition: 'background 300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

const sectionLabelStyle = {
  padding: '8px 12px 4px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '10px 12px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  background: 'transparent',
  transition: 'background 200ms cubic-bezier(0.4, 0, 0.2, 1)',
};
