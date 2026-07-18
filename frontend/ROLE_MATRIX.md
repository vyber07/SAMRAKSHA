# SAMRAKSHA Role Matrix - Quick Reference

## Visual Role Hierarchy

```
                    ┌─────────────┐
                    │   ADMIN     │
                    │  (Level 3)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐    ┌─────▼─────┐    ┌──▼────────┐
      │   SHO   │    │    DCP    │    │ (Reserved)│
      │(Level 3)│    │ (Level 2) │    │           │
      └────┬────┘    └─────┬─────┘    └───────────┘
           │               │
           └───────────────┼───────────────┐
                           │               │
                      ┌────▼────┐    ┌────▼────────┐
                      │    IO   │    │  CONSTABLE  │
                      │(Level 1)│    │  (Level 0)  │
                      └─────────┘    └─────────────┘

Level 3: Full Access (Admin, SHO)
Level 2: Extended Access (DCP)
Level 1: Field Access (IO)
Level 0: Limited Field Access (Constable)
```

## Dashboard Assignment

| Role | Level | Dashboard Type | Primary Use |
|------|:-----:|---|---|
| Admin | 3 | **Analytics** | System management, statistics |
| SHO | 3 | **Analytics** | Station oversight, analytics |
| DCP | 2 | **Analytics** | Deputy oversight, analytics |
| IO | 1 | **Field Map** | Investigation, field operations |
| Constable | 0 | **Field Map** | Patrol, field operations |

## Detailed Permissions

### Administrative Permissions
| Permission | Admin | SHO | DCP | IO | Constable |
|---|:---:|:---:|:---:|:---:|:---:|
| **canViewAnalytics** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **canViewReports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **canManageUsers** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **canDeleteIncidents** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Operational Permissions
| Permission | Admin | SHO | DCP | IO | Constable |
|---|:---:|:---:|:---:|:---:|:---:|
| **canViewMap** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **canEditIncidents** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **canAssignCases** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **canViewSensitiveData** | ✅ | ✅ | ✅ | ❌ | ❌ |

## Component Visibility

### High-Rank Dashboard (Admin, SHO, DCP)
```
┌─ Search Bar
├─ Quick Stats (4 cards)
├─ Incident Analytics
│  ├─ Statistics Cards (Total, Active, Resolved)
│  ├─ 7-Day Trends Line Chart
│  ├─ Incident Types Bar Chart
│  └─ Status Distribution Pie Chart
├─ Map Widget (Secondary)
├─ Quick Notifications
├─ Recent Incidents List
└─ Priority Cases List
```

### Low-Rank Dashboard (IO, Constable)
```
┌─ Full-Screen OpenStreetMap
│  ├─ Incident Location Markers
│  ├─ Hotspot Heatmap
│  └─ Severity-Based Colors
│
└─ Right Sidebar
   ├─ Quick Stats (Active/Resolved)
   ├─ My Incidents List
   └─ Action Buttons
      ├─ Report Incident
      └─ Refresh Map
```

## Data Flow

### Login Process
```
1. User enters badge number & password
2. POST /auth/login
3. Response includes officer.role
4. setUser() saves officer object
5. setUserRole() stores role in localStorage
6. Dashboard component reads userRole from store
7. Role-based conditional rendering applied
```

### Dashboard Initialization
```
1. Dashboard component mounts
2. Read userRole from useAuthStore
3. Determine isHighRank or isLowRank
4. Fetch appropriate data:
   - High-rank: analytics + incidents + cases
   - Low-rank: incidents + cases + hotspots
5. Render corresponding dashboard layout
```

## API Response Filtering

### High-Rank Officer Request
```
GET /analytics/dashboard → Full analytics data
GET /analytics/incidents → All incident statistics
GET /incident → All incidents with sensitive fields
GET /cases → All cases with priority data
Response: Complete dataset for analysis
```

### Low-Rank Officer Request
```
GET /analytics/dashboard → FILTERED (no sensitive metrics)
GET /incident → Only assigned incidents
GET /cases → Only visible cases
GET /map/hotspots → Location data for map
Response: Field-relevant data only
```

## Styling & Colors

### Role Badge Colors
- **Admin**: #6366f1 (Indigo)
- **SHO**: #8b5cf6 (Purple)
- **DCP**: #06b6d4 (Cyan)
- **IO**: #10b981 (Emerald)
- **Constable**: #f59e0b (Amber)

### Dashboard Indicator Styles
```javascript
High-Rank Dashboard:
  Background: rgba(99, 102, 241, 0.1)    // Indigo
  Border: 1px solid rgba(99, 102, 241, 0.3)
  Text: "#c7d2fe"
  Label: "Admin Dashboard (Analytics View)"

Low-Rank Dashboard:
  Background: rgba(16, 185, 129, 0.1)     // Emerald
  Border: 1px solid rgba(16, 185, 129, 0.3)
  Text: "#a7f3d0"
  Label: "IO Dashboard (Field View)"
```

## Implementation Files

### Core Implementation
- **`src/lib/store.js`** - Zustand store with auth & role state
- **`src/lib/permissions.js`** - Permission utility functions
- **`src/components/Dashboard.jsx`** - Main dashboard with role-based rendering
- **`src/components/IncidentGraph.jsx`** - Charts component for high-rank
- **`src/components/LoginScreen.jsx`** - Updated login with role setting

### Documentation
- **`RBAC_IMPLEMENTATION.md`** - Detailed implementation guide
- **`ROLE_MATRIX.md`** - This file (quick reference)

## Feature Access Map

```javascript
// In src/lib/permissions.js

const roleAccessMatrix = {
  // Analytics Features (High-Rank Only)
  analytics: ['admin', 'sho', 'dcp'],
  fullReports: ['admin', 'sho', 'dcp'],
  incidentGraphs: ['admin', 'sho', 'dcp'],
  
  // Field Features (All Roles)
  fieldMap: ['admin', 'sho', 'dcp', 'io', 'constable'],
  patrolTracking: ['admin', 'sho', 'dcp', 'io'],
  
  // Administrative (Admin Only)
  userManagement: ['admin'],
  systemSettings: ['admin'],
  
  // Sensitive Data (High-Rank Only)
  sensitiveIncidents: ['admin', 'sho', 'dcp'],
}
```

## Testing Scenarios

### Test Case 1: Admin Login
```
Expected:
✅ See analytics dashboard
✅ View incident graphs & charts
✅ Access all statistics
✅ View user management (future)
✅ See all incidents
```

### Test Case 2: IO Login
```
Expected:
✅ See field map dashboard
✅ View incident locations
✅ See hotspots
❌ No analytics graphs
❌ No sensitive reports
✅ Can edit incidents
```

### Test Case 3: Constable Login
```
Expected:
✅ See field map dashboard
✅ View incident locations
❌ Cannot edit incidents
❌ No sensitive data
✅ Can view map only
```

## Quick Integration Check

```javascript
// 1. Store imports work
import { useAuthStore } from '../lib/store'  // ✅

// 2. Permission functions available
import { isHighRankOfficer, hasPermission } from '../lib/permissions'  // ✅

// 3. Components render by role
{isHighRank && <IncidentGraph />}  // ✅
{isLowRank && <MapComponent />}   // ✅

// 4. Role persists in localStorage
localStorage.getItem('userRole')  // ✅

// 5. API integration ready
// - Backend must return officer.role in login response
// - Backend must filter data per role
```

---

**Last Updated**: 2026-07-17  
**Implementation Status**: ✅ Complete  
**Testing Status**: Ready for QA
