# SAMRAKSHA RBAC Integration Checklist

## Pre-Deployment Verification

### Backend Requirements
- [ ] `/auth/login` endpoint returns officer object with `role` field
- [ ] Officer roles are: `admin`, `sho`, `dcp`, `io`, or `constable`
- [ ] `/analytics/dashboard` endpoint available
- [ ] `/analytics/incidents` endpoint available
- [ ] `/map/hotspots` endpoint available
- [ ] API applies role-based filtering on responses
- [ ] Sensitive data excluded from low-rank officer responses

### Frontend Files Verification
- [ ] `src/lib/store.js` updated with role functions ✅
- [ ] `src/lib/permissions.js` created ✅
- [ ] `src/components/IncidentGraph.jsx` created ✅
- [ ] `src/components/Dashboard.jsx` updated ✅
- [ ] `src/components/LoginScreen.jsx` updated ✅
- [ ] Documentation files created ✅

### Browser Testing

#### Admin/SHO/DCP Login
- [ ] Navigate to `/login`
- [ ] Enter badge number and password for admin/sho/dcp user
- [ ] Click "Sign In"
- [ ] Verify redirect to `/dashboard`
- [ ] **Verify Dashboard Shows**:
  - [ ] "Admin Dashboard (Analytics View)" role badge
  - [ ] Quick Stats cards (4 cards displayed)
  - [ ] Incident Analytics section visible
  - [ ] Incident Trends line chart rendering
  - [ ] Incident Types bar chart rendering
  - [ ] Status Distribution pie chart rendering
  - [ ] Map widget visible (secondary)
  - [ ] Recent Incidents list populated
  - [ ] Priority Cases list populated

#### IO/Constable Login
- [ ] Navigate to `/login`
- [ ] Enter badge number and password for io/constable user
- [ ] Click "Sign In"
- [ ] Verify redirect to `/dashboard`
- [ ] **Verify Dashboard Shows**:
  - [ ] "IO Dashboard (Field View)" or "Constable Dashboard (Field View)" role badge
  - [ ] Full-screen OpenStreetMap on left (70% width)
  - [ ] Sidebar on right (30% width)
  - [ ] Incident markers visible on map with severity colors
  - [ ] Hotspot heatmap visible on map
  - [ ] Quick stats cards in sidebar (Active/Resolved)
  - [ ] "My Incidents" list populated
  - [ ] "Report Incident" button visible
  - [ ] "Refresh Map" button visible
  - [ ] NO analytics charts visible
  - [ ] NO statistics cards visible

### Permission Checks

#### View Analytics (High-Rank Only)
```javascript
// Should work for: admin, sho, dcp
// Should NOT work for: io, constable

import { hasPermission } from '../lib/permissions';
hasPermission('admin', 'canViewAnalytics') → true ✓
hasPermission('io', 'canViewAnalytics') → false ✓
```

#### View Map (All Roles)
```javascript
// Should work for: admin, sho, dcp, io, constable

hasPermission('admin', 'canViewMap') → true ✓
hasPermission('io', 'canViewMap') → true ✓
hasPermission('constable', 'canViewMap') → true ✓
```

#### Edit Incidents (High-Rank & IO)
```javascript
// Should work for: admin, sho, dcp, io
// Should NOT work for: constable

hasPermission('io', 'canEditIncidents') → true ✓
hasPermission('constable', 'canEditIncidents') → false ✓
```

#### Manage Users (Admin Only)
```javascript
// Should work for: admin
// Should NOT work for: others

hasPermission('admin', 'canManageUsers') → true ✓
hasPermission('sho', 'canManageUsers') → false ✓
```

### LocalStorage Verification

After successful login:
```javascript
// Check that role is persisted
localStorage.getItem('userRole')
// Should return: 'admin' | 'sho' | 'dcp' | 'io' | 'constable'

// Check that token is persisted
localStorage.getItem('token')
// Should return: valid JWT token
```

### Store State Verification

```javascript
import { useAuthStore } from '../lib/store';

const state = useAuthStore.getState();
console.log(state);
// {
//   token: 'jwt_token_string',
//   user: { id, name, role, ... },
//   userRole: 'admin|sho|dcp|io|constable',
//   setToken: function,
//   setUser: function,
//   setUserRole: function,
//   logout: function,
//   isHighRank: function,
//   hasPermission: function
// }
```

### Component Rendering Tests

#### Dashboard Conditional Rendering
```javascript
// Add console.log to verify role detection
console.log('userRole:', userRole);
console.log('isHighRank:', isHighRank);
console.log('isLowRank:', isLowRank);

// Should show:
// For admin: "Admin Dashboard" + IncidentGraph component
// For io: "IO Dashboard" + MapComponent component
```

#### IncidentGraph Component Tests
- [ ] Charts render without errors
- [ ] Mock data displays when API fails
- [ ] Real data populates correctly when API succeeds
- [ ] All three chart types render (line, bar, pie)
- [ ] Statistics cards show correct values
- [ ] Charts are responsive on different screen sizes

#### MapComponent Integration
- [ ] Map initializes without errors
- [ ] Incident markers appear on map
- [ ] Hotspot heatmap displays
- [ ] Markers show correct severity colors
- [ ] Popups display incident information
- [ ] Map controls function properly

### API Call Verification

```javascript
// In browser DevTools Network tab, verify:

1. POST /auth/login
   Response: {
     access_token: "...",
     officer: {
       id: "...",
       name: "...",
       role: "admin|sho|dcp|io|constable",  ← Must have role
       ...
     }
   }

2. GET /analytics/dashboard (High-rank only)
   Response: {
     total_cases: number,
     active_incidents: number,
     solved_cases: number,
     hotspots: number,
     ...
   }

3. GET /analytics/incidents (High-rank only)
   Response: {
     theft_count: number,
     assault_count: number,
     ...
   }

4. GET /incident
   Response: {
     data: {
       items: [incident_objects]
     }
   }

5. GET /map/hotspots (Low-rank)
   Response: {
     data: [hotspot_objects]
   }
```

### Error Handling Tests

- [ ] Login fails with invalid credentials → Error message displayed
- [ ] API timeout → Charts show mock data
- [ ] Missing role in response → Fallback to guest behavior
- [ ] Logout clears localStorage and state
- [ ] Page refresh maintains role state
- [ ] Session expiry → Redirect to login

### Responsive Design Tests

#### High-Rank Dashboard
- [ ] Desktop (1920x1080) → Full layout with all components
- [ ] Tablet (768x1024) → Stats cards stack, sidebar hidden
- [ ] Mobile (375x667) → Vertical stacking, reduced chart sizes

#### Low-Rank Dashboard
- [ ] Desktop (1920x1080) → Map 70% + Sidebar 30%
- [ ] Tablet (768x1024) → Map full width, sidebar below
- [ ] Mobile (375x667) → Map full screen, overlay sidebar

### Accessibility Tests

- [ ] Role badge has appropriate color contrast
- [ ] Chart labels readable
- [ ] Buttons have focus states
- [ ] Keyboard navigation works
- [ ] Screen reader announces role/dashboard type
- [ ] ARIA labels present where needed

### Performance Tests

- [ ] Dashboard loads within 2 seconds
- [ ] Charts render smoothly without lag
- [ ] Map initializes without hanging
- [ ] No memory leaks on component unmount
- [ ] Bundle size acceptable (check build output)

### Security Verification

- [ ] Role not editable in localStorage
- [ ] Sensitive API calls only made by authorized roles
- [ ] Token properly included in Authorization header
- [ ] No sensitive data logged in console
- [ ] CORS headers properly configured

---

## Deployment Steps

### 1. Code Review
- [ ] All file changes reviewed
- [ ] No debugging code left
- [ ] No console.logs for production
- [ ] Error handling complete

### 2. Build Verification
```bash
cd /home/ubuntu/sa/frontend
npm run build
# ✅ Build completes without errors
# ✅ No build warnings
```

### 3. Lint Check
```bash
npm run lint
# ✅ All files pass linting
```

### 4. Documentation
- [ ] RBAC_IMPLEMENTATION.md complete
- [ ] ROLE_MATRIX.md complete
- [ ] INTEGRATION_CHECKLIST.md complete
- [ ] Code comments clear

### 5. Deployment
- [ ] Build artifacts uploaded
- [ ] Environment variables configured
- [ ] Backend API URLs correct
- [ ] CORS whitelist updated

### 6. Post-Deployment Verification
- [ ] App loads without errors
- [ ] Login works for all roles
- [ ] Dashboards render correctly
- [ ] Analytics graphs display
- [ ] Maps load and function
- [ ] No console errors

---

## Rollback Procedure

If issues occur:

1. **Revert Files**
   ```bash
   git revert <commit-hash>
   npm run build
   ```

2. **Clear Cache**
   ```
   - Clear browser localStorage
   - Clear browser cache
   - Refresh page
   ```

3. **Verify Revert**
   - Test login for each role
   - Verify old dashboard renders
   - Check console for errors

---

## Support & Debugging

### Common Issues

**Issue**: Role not persisting after refresh
```
Solution:
1. Check localStorage has 'userRole' key
2. Verify setUserRole() called in LoginScreen
3. Check auth store initialization
```

**Issue**: Dashboard shows wrong view for role
```
Solution:
1. Verify userRole value in store
2. Check isHighRank/isLowRank logic
3. Console.log role during render
```

**Issue**: Charts not rendering
```
Solution:
1. Check analytics API is reachable
2. Verify data format in API response
3. Check mock data displays on API error
4. Check browser console for errors
```

**Issue**: Map not loading
```
Solution:
1. Check Leaflet library loaded
2. Verify map container has size
3. Check hotspots data format
4. Verify coordinates are valid
```

### Debug Mode

Add to Dashboard.jsx:
```javascript
useEffect(() => {
  console.log('Dashboard Debug Info:');
  console.log('User Role:', userRole);
  console.log('Is High Rank:', isHighRank);
  console.log('Is Low Rank:', isLowRank);
  console.log('Store State:', useAuthStore.getState());
}, [userRole, isHighRank, isLowRank]);
```

---

## Handoff Notes

### For QA Team
- [ ] Test each role's dashboard thoroughly
- [ ] Verify all buttons and interactions
- [ ] Check performance with 1000+ incidents
- [ ] Test on various devices/browsers

### For Backend Team
- [ ] Ensure role filtering implemented
- [ ] Add audit logging for sensitive operations
- [ ] Validate all permission checks server-side

### For DevOps
- [ ] Configure CDN caching appropriately
- [ ] Set up monitoring for role-related errors
- [ ] Prepare rollback plan

---

**Status**: Ready for Testing ✅  
**Last Updated**: 2026-07-17  
**Prepared By**: Implementation Team
