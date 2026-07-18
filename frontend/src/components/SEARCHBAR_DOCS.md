# SearchBar Component Documentation

## Overview
A Bing-style search bar component for the SAMRAKSHA dashboard with advanced search capabilities, auto-suggestions, filters, and recent search history.

## Component Location
- **Component**: `/src/components/SearchBar.jsx`
- **Export**: `/src/components/index.jsx`
- **Usage**: Integrated in `/src/components/Dashboard.jsx`

---

## Features

### 1. **Large, Prominent Search Input**
- Bing-style design with clear visual hierarchy
- Material 3 design with glassmorphic effect
- Large padding (16px vertical, 20px horizontal)
- Smooth expand/collapse animation on focus
- Scale animation (1.02x) when expanded
- Primary color (#0b66d2) focus indicator

### 2. **Auto-Suggestions Dropdown**
- Real-time search results from API
- Supports searching Cases and Incidents
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Filterable by type
- Visual feedback on hover/selection
- Mouse and keyboard selection sync

### 3. **Recent Searches History**
- Stores up to 5 most recent searches
- Persists in localStorage as `recentSearches`
- Displayed when search box is empty
- Click to re-run previous search
- Automatic deduplication

### 4. **Quick Filters**
- Filter by: All, Cases, Incidents, Officers, Locations
- Semi-curved corners (12-16px border radius)
- Material 3 elevation on hover
- Active state styling with primary color (#0b66d2)
- Smooth filter transitions
- Positioned below search input

### 5. **Keyboard Navigation**
- `Escape`: Close dropdown
- `Arrow Up/Down`: Navigate suggestions
- `Enter`: Select highlighted suggestion or search
- Tab-friendly focus management

### 6. **Loading & Empty States**
- Loading indicator with pulse animation
- "No results" message with helpful tips
- Quick tips section for new users
- Graceful fallback for empty results

---

## Design Specifications

### Color Palette
- **Primary**: #0b66d2 (Bing Blue)
- **Background**: rgba(30, 41, 59, 0.7) - Glassmorphic
- **Border**: rgba(148, 163, 184, 0.2) - Slate
- **Text**: #f1f5f9 - Light text
- **Secondary Text**: #cbd5e1 - Muted text
- **Success**: #10b981
- **Icon**: Various emojis (🔍, 📋, 🚨, 👮, 📍, 🕐, etc.)

### Typography
- **Input**: Inter, 16px, 500 weight
- **Filters**: JetBrains Mono, 12px, 600 weight, uppercase
- **Suggestions**: Inter, 14px
- **Labels**: JetBrains Mono, 12px, uppercase, letter-spacing 0.05em

### Spacing
- **Input padding**: 16px vertical, 20px horizontal
- **Border radius**: 12-16px (semi-curved)
- **Gap between elements**: 12px (search icon), 8px (filters)
- **Dropdown offset**: 8px from input

### Effects
- **Glassmorphism**: backdrop-filter: blur(12px)
- **Elevation**: box-shadow with 0.2 opacity at #0b66d2 when focused
- **Animations**:
  - expand/collapse: 300ms cubic-bezier(0.4, 0, 0.2, 1)
  - slide-down (dropdown): 300ms cubic-bezier(0.4, 0, 0.2, 1)
  - pulse (loading): 1.5s infinite
  - scale: 1.02x when expanded

---

## Props
Currently, the SearchBar component does not accept props. All state is managed internally. To customize behavior, edit the component directly.

---

## API Integration

### Endpoints Used
```javascript
// Cases suggestions
cases.list(0, 5)  // Skip 0, limit 5 results

// Incidents suggestions
incidents.list(0, 5)  // Skip 0, limit 5 results
```

### Expected Response Format
```javascript
{
  data: {
    items: [
      {
        id: "case-id",
        title: "Case title",
        description: "Case description"
      },
      ...
    ]
  }
}
```

### Adding More Search Types
To add Officers or Locations:

1. **Extend the API calls** in `lib/api.js` (if not already present)
2. **Update fetchSuggestions** in SearchBar.jsx:
```javascript
const officersRes = await officers.list(0, 5);
const locationsRes = await locations.list(0, 5);

const allSuggestions = [
  // ... existing cases/incidents
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
    subtitle: item.location || 'Location',
    type: 'locations',
    icon: '📍',
  })),
];
```

---

## Usage

### Basic Import
```javascript
import SearchBar from './components/SearchBar';
// or
import { SearchBar } from './components';
```

### Basic Usage (Already Integrated)
```javascript
export default function Dashboard() {
  return (
    <div>
      <TopBar />
      <div>
        <SearchBar />
        {/* Rest of dashboard content */}
      </div>
    </div>
  );
}
```

### Customization

#### Change Primary Color
Update in `SearchBar.jsx`, line where `#0b66d2` is used:
```javascript
// Change all instances of:
// 'rgba(11, 102, 210, ...)'  // RGB version
// '#0b66d2'                   // Hex version

// To your custom color, e.g. #6366f1
```

#### Modify Search Debounce
Line ~85 in SearchBar.jsx:
```javascript
const timer = setTimeout(fetchSuggestions, 300); // Change 300 to desired ms
```

#### Adjust Max Recent Searches
Line ~124 in SearchBar.jsx:
```javascript
.slice(0, 5)  // Change 5 to desired limit
```

#### Change Filter Options
Line ~35-41 in SearchBar.jsx:
```javascript
const filterOptions = [
  { id: 'all', label: 'All', icon: '🔍' },
  // Add more filters here
];
```

---

## State Management

### Internal State
- `query`: Current search input value
- `isExpanded`: Dropdown visibility state
- `suggestions`: Filtered suggestions from API
- `recentSearches`: Array of recent search queries
- `activeFilter`: Current filter selection
- `filteredSuggestions`: Suggestions after filter applied
- `loading`: API loading state
- `selectedIndex`: Currently highlighted suggestion (keyboard nav)

### localStorage
- **Key**: `recentSearches`
- **Format**: JSON stringified array of search queries
- **Example**: `["Case #2024-001", "Incident #456"]`

---

## Event Handlers

### `handleSearch(searchQuery)`
Executes search, saves to recent searches, clears input, closes dropdown.

### `handleKeyDown(e)`
Manages keyboard navigation and shortcuts.

### `filterResults(results)`
Filters suggestions based on active filter type.

### `handleClickOutside(e)`
Closes dropdown when clicking outside SearchBar.

---

## Performance Considerations

1. **Debounced API Calls**: 300ms delay prevents excessive requests
2. **Limited Results**: Only 5 results per type fetched (cases + incidents)
3. **Memoization**: Consider wrapping in `React.memo()` if used in large lists
4. **Lazy Suggestions**: Dropdown only renders when expanded

---

## Accessibility

✅ **Keyboard Navigation**: Full support
- Arrow keys for navigation
- Enter to select
- Escape to close

✅ **Semantic HTML**: Uses proper input and button elements

✅ **Focus Management**: Click-outside detection, focus state styling

⚠️ **ARIA Labels**: Consider adding for screen readers:
```javascript
<input
  aria-label="Search cases, incidents, officers, and locations"
  aria-expanded={isExpanded}
  aria-autocomplete="list"
  aria-controls="search-dropdown"
  // ...
/>
```

---

## Browser Support

- ✅ Chrome/Edge (88+)
- ✅ Firefox (87+)
- ✅ Safari (14+)
- ✅ Mobile browsers (iOS 14+, Android 11+)

---

## Future Enhancements

1. **Advanced Filters**
   - Date range filtering
   - Status filtering
   - Priority filtering
   - Custom filter builder

2. **Search History**
   - Search analytics
   - Popular searches
   - Search suggestions based on behavior

3. **Search Results Page**
   - Paginated results
   - Sorting options
   - Column customization

4. **Voice Search**
   - Web Speech API integration
   - Voice-to-text suggestions

5. **Smart Suggestions**
   - ML-based relevance ranking
   - Search auto-complete
   - Did-you-mean suggestions

6. **Performance**
   - IndexedDB for local caching
   - Service Worker for offline search
   - Virtual scrolling for large result sets

---

## Troubleshooting

### Suggestions Not Showing
- Check API endpoints in `lib/api.js`
- Verify auth token is being sent (check Network tab)
- Check browser console for errors
- Verify API response format matches expected structure

### Keyboard Navigation Not Working
- Ensure SearchBar has focus
- Check browser DevTools for event listener attachment
- Verify `handleKeyDown` is properly bound

### Recent Searches Not Persisting
- Check if localStorage is enabled
- Verify browser privacy settings
- Check console for storage quota errors

### Styling Issues
- Verify `index.css` is imported in `main.jsx`
- Check for CSS conflicts with other libraries
- Verify CSS custom properties (--primary, --font-body, etc.) are defined

---

## Testing Checklist

- [ ] Search input accepts text
- [ ] Dropdown expands/collapses on focus/blur
- [ ] API suggestions appear after typing
- [ ] Filters change suggestion list
- [ ] Keyboard navigation works (arrow keys)
- [ ] Enter key selects suggestion
- [ ] Escape closes dropdown
- [ ] Recent searches persist
- [ ] Clear button works
- [ ] Click outside closes dropdown
- [ ] Styling matches Material 3 design
- [ ] Glassmorphic effect visible
- [ ] Animations are smooth
- [ ] No console errors
- [ ] Mobile responsive

---

## Integration Checklist

- [x] SearchBar.jsx created
- [x] Imported in Dashboard.jsx
- [x] Positioned above stats section
- [x] index.jsx exports created
- [x] Styling uses design tokens
- [x] API integration ready
- [x] localStorage for recent searches
- [x] Keyboard navigation implemented
- [x] Mobile responsive
- [x] No breaking changes to Dashboard

---

## Files Modified

1. **Created**:
   - `/src/components/SearchBar.jsx` (Main component)
   - `/src/components/index.jsx` (Exports)
   - `/src/components/SEARCHBAR_DOCS.md` (This file)

2. **Modified**:
   - `/src/components/Dashboard.jsx` (Added SearchBar import and integration)

---

## Support & Contribution

For issues or feature requests:
1. Check troubleshooting section
2. Review API responses in Network tab
3. Check browser console for errors
4. Consult design system in `index.css`
