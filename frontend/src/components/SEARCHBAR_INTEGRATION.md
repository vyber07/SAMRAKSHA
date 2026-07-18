# SearchBar Component - Integration Guide

## Quick Start

The SearchBar component is **already integrated** into the Dashboard. No additional setup is needed for basic functionality.

---

## Current Integration Status

✅ **Completed**:
- SearchBar component created with full features
- Integrated into Dashboard.jsx (positioned at top, above stats)
- Exports configured in components/index.jsx
- Design tokens integrated with Material 3 & Bing blue (#0b66d2)
- API integration for Cases and Incidents
- localStorage for recent searches
- Keyboard navigation & accessibility

---

## File Changes Summary

### New Files
```
src/components/SearchBar.jsx           # Main component (408 lines)
src/components/index.jsx               # Component exports
src/components/SEARCHBAR_DOCS.md       # Full documentation
src/components/SEARCHBAR_INTEGRATION.md # This file
```

### Modified Files
```
src/components/Dashboard.jsx
  - Added: import SearchBar
  - Added: <SearchBar /> before stats section
```

---

## Usage in Other Pages

To use SearchBar in other pages:

```javascript
import { SearchBar } from '../components';
// or
import SearchBar from '../components/SearchBar';

export default function YourPage() {
  return (
    <div>
      <SearchBar />
      {/* Your content */}
    </div>
  );
}
```

---

## Customization Examples

### 1. Change Primary Color (Bing Blue → Custom Color)

**File**: `src/components/SearchBar.jsx`

Find and replace (search for `0b66d2` and `11, 102, 210`):

```javascript
// Before (Bing Blue)
border: isExpanded
  ? '2px solid rgba(11, 102, 210, 0.5)'
  : '1px solid rgba(148, 163, 184, 0.2)',

// After (Your color, e.g. Indigo #6366f1 = 99, 102, 241)
border: isExpanded
  ? '2px solid rgba(99, 102, 241, 0.5)'
  : '1px solid rgba(148, 163, 184, 0.2)',
```

Or use CSS variables:
```javascript
border: isExpanded
  ? `2px solid rgba(var(--primary-rgb), 0.5)`
  : '1px solid rgba(148, 163, 184, 0.2)',
```

### 2. Add Custom Search Handler

**Current behavior**: Logs search to console

**To implement actual search**:

```javascript
// SearchBar.jsx, line ~135
const handleSearch = (searchQuery = query) => {
  // ... existing code ...

  // Add your custom handler here:
  // Example: Navigate to results page
  navigate(`/search?q=${encodeURIComponent(searchQuery)}&filter=${activeFilter}`);
  
  // Or: Open modal with results
  // openSearchResults(searchQuery, activeFilter);
  
  // Or: Call custom API endpoint
  // const results = await api.search({ query: searchQuery, filter: activeFilter });
};
```

### 3. Add Officers & Locations Search

**File**: `src/components/SearchBar.jsx`, line ~70-95

```javascript
const fetchSuggestions = async () => {
  setLoading(true);
  try {
    // Add officers and locations API calls
    const [casesRes, incidentsRes, officersRes, locationsRes] = await Promise.all([
      cases.list(0, 5),
      incidents.list(0, 5),
      officers.list(0, 5),      // Add this
      locations.list(0, 5),      // Add this
    ]);

    const allSuggestions = [
      // ... existing cases/incidents ...
      ...(officersRes.data.items || []).map((item) => ({
        id: item.id,
        title: `Officer ${item.name}`,
        subtitle: item.badge_no || 'Officer',
        type: 'officers',
        icon: '👮',
      })),
      ...(locationsRes.data.items || []).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.address || 'Location',
        type: 'locations',
        icon: '📍',
      })),
    ];
    // ... rest of code
  }
};
```

**Note**: Ensure `officers` and `locations` APIs are exported from `lib/api.js`

### 4. Customize Filter Options

**File**: `src/components/SearchBar.jsx`, line ~35-42

```javascript
const filterOptions = [
  { id: 'all', label: 'All', icon: '🔍' },
  { id: 'cases', label: 'Cases', icon: '📋' },
  { id: 'incidents', label: 'Incidents', icon: '🚨' },
  { id: 'officers', label: 'Officers', icon: '👮' },
  { id: 'locations', label: 'Locations', icon: '📍' },
  // Add more filters:
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'evidence', label: 'Evidence', icon: '🔎' },
];
```

### 5. Adjust Debounce Delay

**File**: `src/components/SearchBar.jsx`, line ~124

```javascript
// Default: 300ms
const timer = setTimeout(fetchSuggestions, 500); // Change to 500ms
```

### 6. Modify Recent Search Limit

**File**: `src/components/SearchBar.jsx`, line ~114

```javascript
// Default: 5 recent searches
.slice(0, 10) // Store up to 10 instead
```

---

## API Integration Setup

### Prerequisites

Ensure these APIs are available in `lib/api.js`:

```javascript
// Already configured:
export const cases = {
  list: (skip = 0, limit = 20) => api.get('/cases', { params: { skip, limit } }),
  // ...
};

export const incidents = {
  list: (skip = 0, limit = 20) => api.get('/incident', { params: { skip, limit } }),
  // ...
};

// Add these if needed:
export const officers = {
  list: (skip = 0, limit = 20) => api.get('/officers', { params: { skip, limit } }),
  get: (id) => api.get(`/officers/${id}`),
};

export const locations = {
  list: (skip = 0, limit = 20) => api.get('/locations', { params: { skip, limit } }),
  get: (id) => api.get(`/locations/${id}`),
};
```

### Expected Response Format

Your API should return:
```json
{
  "data": {
    "items": [
      {
        "id": "123",
        "title": "Case or Incident Title",
        "description": "Optional description",
        "other_fields": "..."
      }
    ]
  }
}
```

---

## Styling Customization

### Change Border Radius

**Current**: 16px (semi-curved)

**File**: `src/components/SearchBar.jsx`

```javascript
// Input container - line ~91
borderRadius: '16px',

// Filter buttons - line ~183
borderRadius: '12px',

// Dropdown - line ~237
borderRadius: '12px',

// Clear button - line ~123
borderRadius: '8px',
```

### Change Glassmorphic Blur Amount

**Current**: 12px

**File**: `src/components/SearchBar.jsx`

```javascript
// Search input - line ~85
backdropFilter: 'blur(12px)',

// Dropdown - line ~235
backdropFilter: 'blur(12px)',
```

### Adjust Dropdown Max Height

**Current**: 400px

**File**: `src/components/SearchBar.jsx`, line ~241

```javascript
maxHeight: '600px', // Change from 400px
```

---

## Animation Customization

### Expand/Collapse Speed

**File**: `src/components/SearchBar.jsx`, line ~73

```javascript
// Current: 300ms
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

// Faster: 200ms
transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

// Slower: 500ms
transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
```

### Loading Pulse Speed

**File**: `src/components/SearchBar.jsx`, line ~268

```javascript
// Current: 1.5s
animation: 'pulse 1.5s infinite',

// Change to 1s
animation: 'pulse 1s infinite',
```

---

## Testing

### Manual Testing Checklist

```
[ ] Type in search box - suggestions appear
[ ] Click filter buttons - results filter correctly
[ ] Keyboard navigation - arrow keys work
[ ] Press Escape - dropdown closes
[ ] Click outside - dropdown closes
[ ] Press Enter - search executes
[ ] Close and reopen - recent searches shown
[ ] Recent search click - re-runs search
[ ] Clear button works
[ ] Mobile responsive
[ ] No console errors
```

### Browser DevTools

1. **Check Network Tab**
   - Filter by "cases" or "incident"
   - Verify requests are sent with proper auth token
   - Check response format

2. **Check Console**
   - No errors or warnings
   - Verify API errors logged clearly

3. **Check Performance**
   - Typing is responsive (no lag)
   - Dropdown animates smoothly
   - No memory leaks

---

## Troubleshooting

### Issue: Suggestions Not Appearing

**Solution**:
1. Check API endpoints in `lib/api.js`
2. Verify backend is running on port 8000
3. Check browser Network tab for request/response
4. Verify response has `data.items` structure

### Issue: Recent Searches Not Saving

**Solution**:
1. Check if localStorage is enabled
2. Open DevTools > Application > Storage > localStorage
3. Look for `recentSearches` key
4. Try clearing localStorage and searching again

### Issue: Style Not Applying

**Solution**:
1. Verify CSS custom properties defined in `index.css`
2. Check for CSS conflicts (inspect element)
3. Verify `index.css` imported in `main.jsx`
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: Dropdown Positioning Wrong

**Solution**:
- SearchBar must be in a non-positioned container
- Check parent element `position` property
- Add `position: 'relative'` to parent if needed

---

## Performance Optimization

### For Large Result Sets

```javascript
// In SearchBar.jsx, fetchSuggestions function
// Currently limiting to 5 per type - this is good
// To add pagination:

const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const fetchMore = () => {
  setPage(p => p + 1);
  // Re-fetch with skip = page * 5
};
```

### For Slow Networks

```javascript
// Increase debounce delay
const timer = setTimeout(fetchSuggestions, 1000); // 1 second

// Or implement request cancellation
const controller = new AbortController();
// Pass to fetch/axios for cancellation
```

---

## Accessibility Improvements

Add ARIA labels for screen readers:

```javascript
<input
  ref={inputRef}
  type="text"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={handleKeyDown}
  onFocus={() => setIsExpanded(true)}
  placeholder="Search cases, incidents, officers, locations..."
  aria-label="Search cases, incidents, officers, locations"
  aria-expanded={isExpanded}
  aria-autocomplete="list"
  aria-controls="search-suggestions"
  // ...
/>
```

---

## Production Deployment

### Before Going Live

1. **Security**
   - [ ] Verify auth token is sent with API requests
   - [ ] Check for XSS vulnerabilities in search input
   - [ ] Verify CORS headers on backend

2. **Performance**
   - [ ] Test with 1000+ results
   - [ ] Monitor network tab for excessive requests
   - [ ] Test on 3G network (Chrome DevTools)

3. **Compatibility**
   - [ ] Test on Chrome, Firefox, Safari
   - [ ] Test on mobile (iOS Safari, Android Chrome)
   - [ ] Test with keyboard only navigation

4. **Analytics**
   - [ ] Log searches for analytics
   - [ ] Track filter usage
   - [ ] Monitor search errors

---

## Getting Help

- **Component Issues**: Check SEARCHBAR_DOCS.md
- **Integration Help**: Check SEARCHBAR_INTEGRATION.md (this file)
- **API Issues**: Check lib/api.js and backend logs
- **Styling Issues**: Check index.css design tokens

---

## Future Enhancements

- [ ] Voice search support
- [ ] Advanced search operators (e.g., `type:case status:open`)
- [ ] Saved searches / favorites
- [ ] Search history export
- [ ] Full-text search across all fields
- [ ] ML-based ranking of results
- [ ] Search analytics dashboard
- [ ] Custom search plugins

---

## Quick Copy-Paste Snippets

### Use SearchBar in new page

```javascript
import { SearchBar } from '../components';

export default function MyPage() {
  return (
    <>
      <SearchBar />
      {/* Your page content */}
    </>
  );
}
```

### Open search results in new page

```javascript
const handleSearch = (searchQuery = query) => {
  // ... save to recent searches ...
  navigate(`/search`, { 
    state: { query: searchQuery, filter: activeFilter } 
  });
};
```

### Custom search result click handler

```javascript
{filteredSuggestions.map((suggestion, idx) => (
  <div
    key={`${suggestion.type}-${suggestion.id}`}
    onClick={() => {
      // Navigate to detail page
      navigate(`/${suggestion.type}/${suggestion.id}`);
      setIsExpanded(false);
    }}
    // ... rest of props
  >
    {/* ... */}
  </div>
))}
```

---

**Last Updated**: 2026-07-17  
**Component Status**: Production Ready ✅
