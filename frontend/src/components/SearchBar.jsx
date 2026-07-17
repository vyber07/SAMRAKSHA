import React, { useState, useRef, useEffect } from 'react';
import { cases, incidents } from '../lib/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const filterOptions = [
    { id: 'all', label: 'All', icon: '🔍' },
    { id: 'cases', label: 'Cases', icon: '📋' },
    { id: 'incidents', label: 'Incidents', icon: '🚨' },
    { id: 'officers', label: 'Officers', icon: '👮' },
    { id: 'locations', label: 'Locations', icon: '📍' },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsExpanded(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const [casesRes, incidentsRes] = await Promise.all([
          cases.list(0, 5),
          incidents.list(0, 5),
        ]);

        const allSuggestions = [
          ...(casesRes.data.items || []).map((item) => ({
            id: item.id,
            title: `Case #${item.id}`,
            subtitle: item.title || 'Untitled Case',
            type: 'cases',
            icon: '📋',
          })),
          ...(incidentsRes.data.items || []).map((item) => ({
            id: item.id,
            title: `Incident #${item.id}`,
            subtitle: item.description || 'Incident',
            type: 'incidents',
            icon: '🚨',
          })),
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase())
        );

        setSuggestions(allSuggestions);
        filterResults(allSuggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filterResults = (results) => {
    if (activeFilter === 'all') {
      setFilteredSuggestions(results);
    } else {
      setFilteredSuggestions(results.filter((item) => item.type === activeFilter));
    }
    setSelectedIndex(-1);
  };

  useEffect(() => {
    filterResults(suggestions);
  }, [activeFilter, suggestions]);

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    const newRecent = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);

    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Implement actual search navigation here
    console.log('Search for:', searchQuery, 'Filter:', activeFilter);
    setQuery('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e) => {
    if (!isExpanded) {
      if (e.key === 'Enter') {
        setIsExpanded(true);
        inputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSearch(filteredSuggestions[selectedIndex].title);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsExpanded(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={searchRef}
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '24px',
      }}
    >
      {/* Search Container */}
      <div
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Main Search Input */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            border: isExpanded
              ? '2px solid rgba(11, 102, 210, 0.5)'
              : '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: isExpanded
              ? '0 8px 32px rgba(11, 102, 210, 0.2)'
              : '0 4px 16px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Search Icon */}
          <span
            style={{
              fontSize: '20px',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            🔍
          </span>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search cases, incidents, officers, locations..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f1f5f9',
              fontSize: '16px',
              fontFamily: 'var(--font-body)',
              fontWeight: '500',
            }}
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(148, 163, 184, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(148, 163, 184, 0.1)';
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filters */}
        {isExpanded && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              animation: 'slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background:
                    activeFilter === filter.id
                      ? 'rgba(11, 102, 210, 0.2)'
                      : 'rgba(148, 163, 184, 0.08)',
                  color:
                    activeFilter === filter.id ? '#0b66d2' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  border:
                    activeFilter === filter.id
                      ? '1px solid rgba(11, 102, 210, 0.3)'
                      : '1px solid rgba(148, 163, 184, 0.15)',
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter.id) {
                    e.target.style.background = 'rgba(148, 163, 184, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter.id) {
                    e.target.style.background = 'rgba(148, 163, 184, 0.08)';
                  }
                }}
              >
                <span style={{ fontSize: '14px' }}>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown Container */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            animation: 'slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Loading State */}
          {loading && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
              }}
            >
              <span style={{ animation: 'pulse 1.5s infinite' }}>⏳ Searching...</span>
            </div>
          )}

          {/* Suggestions */}
          {!loading && filteredSuggestions.length > 0 && (
            <div>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                Results
              </div>
              {filteredSuggestions.map((suggestion, idx) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSearch(suggestion.title)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background:
                      selectedIndex === idx
                        ? 'rgba(11, 102, 210, 0.15)'
                        : 'transparent',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'rgba(11, 102, 210, 0.15)';
                    setSelectedIndex(idx);
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIndex !== idx) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>
                    {suggestion.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#f1f5f9',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {suggestion.title}
                    </div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: '12px',
                        marginTop: '2px',
                      }}
                    >
                      {suggestion.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Results */}
          {!loading && query && filteredSuggestions.length === 0 && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔎</div>
              <div>No results found for "{query}"</div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
                Try a different search term
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                Recent Searches
              </div>
              {recentSearches.map((search, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background:
                      selectedIndex === idx
                        ? 'rgba(11, 102, 210, 0.15)'
                        : 'transparent',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'rgba(11, 102, 210, 0.15)';
                    setSelectedIndex(idx);
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIndex !== idx) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🕐</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#f1f5f9',
                        fontSize: '14px',
                        fontWeight: '400',
                      }}
                    >
                      {search}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Tips */}
          {!query && recentSearches.length === 0 && (
            <div
              style={{
                padding: '16px',
                color: '#64748b',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#cbd5e1' }}>
                💡 Quick Tips
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '16px',
                  listStyle: 'none',
                }}
              >
                <li>• Use filters to narrow your search</li>
                <li>• Arrow keys to navigate results</li>
                <li>• Press Enter to select</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
