import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cases, incidents } from '../lib/api';

/**
 * Bing-style search bar for the Samraksha dashboard.
 *
 * A bright, prominent glassmorphic search surface (light "Bing" card) that sits
 * on top of the dark dashboard. Honors the requested palette:
 *   - Border:      #2563eb (primary)
 *   - Background:  rgba(37, 99, 235, 0.1) tint over a frosted light panel
 *   - Text:        #0f172a
 *   - Placeholder: #64748b
 *
 * Features: real-time debounced suggestions (cases + incidents), quick filters
 * (Cases / Incidents / Officers / Locations), recent searches persisted to
 * localStorage, optional voice search (Web Speech API, feature-detected),
 * clear button, and full keyboard navigation (arrows / enter / escape).
 */

const RECENT_KEY = 'samraksha.recentSearches';
const MAX_RECENT = 6;

// Palette (spec)
const C = {
  primary: '#2563eb',
  tint: 'rgba(37, 99, 235, 0.1)',
  text: '#0f172a',
  placeholder: '#64748b',
  surface: 'rgba(248, 250, 252, 0.85)', // light frosted panel
  surfaceSolid: 'rgba(255, 255, 255, 0.98)',
  divider: 'rgba(37, 99, 235, 0.12)',
  hover: 'rgba(37, 99, 235, 0.08)',
  selected: 'rgba(37, 99, 235, 0.15)',
};

// Quick filters. `route` is where a plain-text search navigates for that filter.
const FILTERS = [
  { id: 'all', label: 'All', icon: '🔍', route: '/dashboard' },
  { id: 'cases', label: 'Cases', icon: '📋', route: '/cases' },
  { id: 'incidents', label: 'Incidents', icon: '🚨', route: '/incidents' },
  { id: 'officers', label: 'Officers', icon: '👮', route: '/admin' },
  { id: 'locations', label: 'Locations', icon: '📍', route: '/map' },
];

// Detect the browser Speech Recognition API once.
const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function SearchBar() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listening, setListening] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Apply the active filter to the raw suggestion set.
  const visibleSuggestions =
    filter === 'all'
      ? suggestions
      : suggestions.filter((s) => s.type === filter);

  // The rows the keyboard navigates: suggestions when typing, recent otherwise.
  const navRows = query.trim()
    ? visibleSuggestions
    : recent.map((r) => ({ recent: true, value: r }));

  // ---- Load recent searches from localStorage -----------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      // Corrupt/blocked storage — ignore and start fresh.
    }
  }, []);

  const persistRecent = useCallback((next) => {
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private mode); non-fatal.
    }
  }, []);

  // ---- Close dropdown on outside click ------------------------------------
  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ---- Debounced real-time suggestions ------------------------------------
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [casesRes, incidentsRes] = await Promise.all([
          cases.list(0, 8),
          incidents.list(0, 8),
        ]);
        if (cancelled) return;

        const merged = [
          ...(casesRes.data.items || []).map((item) => ({
            id: item.id,
            type: 'cases',
            icon: '📋',
            title: item.title || `Case #${item.id}`,
            subtitle: `Case #${item.id}`,
          })),
          ...(incidentsRes.data.items || []).map((item) => ({
            id: item.id,
            type: 'incidents',
            icon: '🚨',
            title: item.description || `Incident #${item.id}`,
            subtitle: `Incident #${item.id}`,
          })),
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q)
        );

        setSuggestions(merged);
        setActiveIndex(-1);
      } catch (err) {
        if (!cancelled) {
          console.error('Search suggestions failed:', err);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // ---- Navigation ----------------------------------------------------------
  const routeForFilter = (id) =>
    (FILTERS.find((f) => f.id === id) || FILTERS[0]).route;

  const commitRecent = (term) => {
    const t = term.trim();
    if (!t) return;
    persistRecent([t, ...recent.filter((r) => r !== t)].slice(0, MAX_RECENT));
  };

  // Run a full-text search for the current filter.
  const runSearch = (term = query) => {
    const t = term.trim();
    if (!t) return;
    commitRecent(t);
    const base = routeForFilter(filter);
    navigate(`${base}?q=${encodeURIComponent(t)}`);
    setOpen(false);
    setActiveIndex(-1);
  };

  // Open a specific suggested entity.
  const openSuggestion = (s) => {
    commitRecent(s.title);
    const path = s.type === 'incidents' ? `/incidents` : `/cases`;
    navigate(`${path}?focus=${encodeURIComponent(s.id)}`);
    setOpen(false);
    setActiveIndex(-1);
  };

  // ---- Keyboard navigation -------------------------------------------------
  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (i < navRows.length - 1 ? i + 1 : i));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : -1));
        break;
      case 'Enter': {
        e.preventDefault();
        const row = navRows[activeIndex];
        if (row && row.recent) {
          setQuery(row.value);
          runSearch(row.value);
        } else if (row) {
          openSuggestion(row);
        } else {
          runSearch();
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // ---- Voice search --------------------------------------------------------
  const toggleVoice = () => {
    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setOpen(true);
      inputRef.current?.focus();
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    setOpen(true);
    recognition.start();
  };

  // Clean up any active recognition on unmount.
  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  const clearRecent = () => persistRecent([]);

  // -------------------------------------------------------------------------
  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      {/* ---- Main input surface (light "Bing" glass card) ---- */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          background: `linear-gradient(${C.tint}, ${C.tint}), ${C.surface}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `2px solid ${open ? C.primary : 'rgba(37, 99, 235, 0.4)'}`,
          borderRadius: '22px',
          boxShadow: open
            ? '0 10px 34px rgba(37, 99, 235, 0.28)'
            : '0 4px 18px rgba(15, 23, 42, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Search icon (left) */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke={C.primary} strokeWidth="2" />
          <path
            d="M20 20l-3.5-3.5"
            stroke={C.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder="Search cases, incidents, officers, locations…"
          aria-label="Search"
          aria-expanded={open}
          role="combobox"
          aria-controls="searchbar-listbox"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: C.text,
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            style={iconBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke={C.placeholder}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Voice search (optional — only if the browser supports it) */}
        {SpeechRecognition && (
          <button
            type="button"
            aria-label={listening ? 'Stop voice search' : 'Search by voice'}
            onClick={toggleVoice}
            style={{
              ...iconBtnStyle,
              background: listening ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = listening
                ? 'rgba(220, 38, 38, 0.18)'
                : C.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = listening
                ? 'rgba(220, 38, 38, 0.12)'
                : 'transparent')
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect
                x="9"
                y="3"
                width="6"
                height="11"
                rx="3"
                stroke={listening ? '#dc2626' : C.primary}
                strokeWidth="2"
              />
              <path
                d="M5 11a7 7 0 0014 0M12 18v3"
                stroke={listening ? '#dc2626' : C.primary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ---- Quick filters ---- */}
      {open && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            animation: 'sb-slide-down 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: active ? '#ffffff' : '#e2e8f0',
                  background: active ? C.primary : 'rgba(148, 163, 184, 0.15)',
                  border: `1px solid ${active ? C.primary : 'rgba(148, 163, 184, 0.25)'}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.25)';
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)';
                }}
              >
                <span style={{ fontSize: '13px' }}>{f.icon}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Dropdown ---- */}
      {open && (
        <div
          id="searchbar-listbox"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: C.surfaceSolid,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${C.divider}`,
            borderRadius: '18px',
            maxHeight: '420px',
            overflowY: 'auto',
            boxShadow: '0 18px 44px rgba(15, 23, 42, 0.35)',
            animation: 'sb-slide-down 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Loading */}
          {loading && (
            <div style={infoRowStyle}>
              <span style={{ animation: 'sb-pulse 1.4s infinite' }}>
                Searching…
              </span>
            </div>
          )}

          {/* Suggestions (auto-complete results) */}
          {!loading && query.trim() && visibleSuggestions.length > 0 && (
            <>
              <div style={sectionLabelStyle}>Suggestions</div>
              {visibleSuggestions.map((s, idx) => (
                <div
                  key={`${s.type}-${s.id}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => openSuggestion(s)}
                  style={rowStyle(activeIndex === idx)}
                >
                  <span style={{ fontSize: '17px', flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={rowTitleStyle}>{s.title}</div>
                    <div style={rowSubtitleStyle}>{s.subtitle}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: C.placeholder }}>↵</span>
                </div>
              ))}
            </>
          )}

          {/* No results */}
          {!loading && query.trim() && visibleSuggestions.length === 0 && (
            <div style={{ ...infoRowStyle, padding: '28px 16px' }}>
              <div style={{ fontSize: '30px', marginBottom: '6px' }}>🔎</div>
              <div style={{ color: C.text, fontWeight: 500 }}>
                No results for “{query.trim()}”
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: C.placeholder }}>
                Press Enter to search all {filter === 'all' ? 'records' : filter}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {!query.trim() && recent.length > 0 && (
            <>
              <div
                style={{
                  ...sectionLabelStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Recent searches</span>
                <button
                  type="button"
                  onClick={clearRecent}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: C.primary,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Clear
                </button>
              </div>
              {recent.map((term, idx) => (
                <div
                  key={term}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    setQuery(term);
                    runSearch(term);
                  }}
                  style={rowStyle(activeIndex === idx)}
                >
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>🕐</span>
                  <div style={{ ...rowTitleStyle, flex: 1 }}>{term}</div>
                </div>
              ))}
            </>
          )}

          {/* Empty state / tips */}
          {!query.trim() && recent.length === 0 && (
            <div style={{ padding: '18px', color: C.placeholder, fontSize: '13px', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: C.text }}>
                💡 Quick tips
              </div>
              <div>• Pick a filter to scope your search</div>
              <div>• ↑ ↓ to navigate, Enter to open, Esc to close</div>
              {SpeechRecognition && <div>• Tap the mic to search by voice</div>}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes sb-slide-down {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes sb-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        #searchbar-listbox::-webkit-scrollbar { width: 8px; }
        #searchbar-listbox::-webkit-scrollbar-thumb {
          background: rgba(37, 99, 235, 0.25); border-radius: 8px;
        }
        input::placeholder { color: ${C.placeholder}; opacity: 1; }
      `}</style>
    </div>
  );
}

// ---- Shared inline style helpers -------------------------------------------
const iconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.2s',
};

const sectionLabelStyle = {
  padding: '10px 16px 6px',
  fontSize: '11px',
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const infoRowStyle = {
  padding: '16px',
  textAlign: 'center',
  color: '#334155',
  fontSize: '14px',
};

const rowStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '11px 16px',
  cursor: 'pointer',
  background: active ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
  borderBottom: '1px solid rgba(37, 99, 235, 0.06)',
  transition: 'background 0.15s',
});

const rowTitleStyle = {
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rowSubtitleStyle = {
  color: '#64748b',
  fontSize: '12px',
  marginTop: '2px',
};
