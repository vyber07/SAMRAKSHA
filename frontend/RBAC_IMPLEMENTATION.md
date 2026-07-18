# SAMRAKSHA Role-Based Dashboard Implementation

## Overview
This document outlines the role-based access control (RBAC) implementation for the SAMRAKSHA crime monitoring and case management system.

---

## Role Hierarchy & Dashboard Types

### High-Rank Officers (Analytics View)
- **Roles**: Admin, SHO (Station House Officer), DCP (Deputy Commissioner)
- **Dashboard Type**: Analytics & Incident Graph
- **Primary Focus**: Statistical analysis, trends, and incident patterns
- **Key Components**:
  - Incident Trends Chart (7-day line graph)
  - Incident Types Bar Chart
  - Status Distribution Pie Chart
  - Statistics Cards (Total, Active, Resolved)
  - Quick Stats Overview
  - Map Widget (secondary)
  - Recent Incidents List
  - Priority Cases List

### Low-Rank Officers (Field View)
- **Roles**: IO (Investigation Officer), Constable
- **Dashboard Type**: Field Map View
- **Primary Focus**: On-field incident management and location tracking
- **Key Components**:
  - Full-screen OpenStreetMap with incident locations
  - Incident markers with severity levels
  - Hotspot visualization with heatmap
  - Quick stats sidebar (Active/Resolved counts)
  - My Incidents list
  - Action buttons (Report Incident, Refresh Map)

---

## Permission Matrix

| Feature | Admin | SHO | DCP | IO | Constable |
|---------|:-----:|:---:|:---:|:--:|:---------:|
| View Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Map | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Incidents | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Incidents | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Cases | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Sensitive Data | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## File Structure

### Core Files
```
src/
├── lib/
│   ├── store.js                 # Zustand auth store with role management
│   ├── permissions.js           # Permission utility functions and matrices
│   └── api.js                   # API endpoints (existing)
├── components/
│   ├── Dashboard.jsx            # Main dashboard with conditional rendering
│   ├── IncidentGraph.jsx        # NEW: Charts and analytics for high-rank
│   ├── MapComponent.jsx         # Map view (enhanced for low-rank)
│   ├── LoginScreen.jsx          # Updated with role setting
│   └── ...
└── pages/
    └── ...
```

---

## Implementation Details

### 1. Store Updates (`src/lib/store.js`)

#### Auth Store Structure
```javascript
useAuthStore {
  token: string
  user: object
  userRole: string
  setToken: (token) => void
  setUser: (user) => void
  setUserRole: (role) => void
  logout: () => void
  isHighRank: () => boolean
  hasPermission: (permission) => boolean
}
```

#### Role Constants
- `ROLE_HIERARCHY`: Maps roles to access levels (admin/sho/dcp = 3, dcp = 2, io = 1, constable = 0)
- `ROLE_PERMISSIONS`: Permission definitions for each role
- `isHighRankOfficer()`: Checks if user is admin, sho, or dcp
- `isLowRankOfficer()`: Checks if user is io or constable
- `hasPermission()`: Checks specific permissions

### 2. Permissions Module (`src/lib/permissions.js`)

Centralized permission management with:
- Role definitions and hierarchy
- Permission matrix
- Feature access control
- Helper functions for authorization checks
- UI styling utilities for role badges

Key Functions:
- `hasPermission(role, permission)`: Check single permission
- `canAccess(userRole, feature)`: Check feature access
- `isHighRankOfficer(role)`: Check rank
- `getRoleColor(role)`: Get role-specific colors
- `isAuthorizedToView(userRole, resource)`: Resource-level access

### 3. Dashboard Component (`src/components/Dashboard.jsx`)

#### High-Rank Dashboard Features
```javascript
// High-rank officers see:
- Role badge indicator
- Analytics-focused layout
- IncidentGraph component with:
  - 7-day incident trends line chart
  - Incident types bar chart
  - Status distribution pie chart
  - Statistics cards
- Quick stats grid
- Map widget (secondary)
- Recent incidents sidebar
- Priority cases sidebar
- Quick notifications
```

#### Low-Rank Dashboard Features
```javascript
// Low-rank officers see:
- Role badge indicator (Field View)
- Split layout with:
  - Full-screen map (70%)
  - Sidebar with quick access (30%)
- Map component with:
  - Incident location markers
  - Hotspot visualization
  - Severity-based color coding
- Sidebar contains:
  - Active/Resolved stats
  - My Incidents list
  - Action buttons
```

### 4. IncidentGraph Component (`src/components/IncidentGraph.jsx`)

Custom charting solution with:
- **SimpleLineChart**: 7-day incident trends
- **SimpleBarChart**: Incident types distribution
- **SimplePieChart**: Status breakdown
- **Statistics Cards**: Key metrics display

Features:
- No external charting library dependency
- SVG-based rendering for performance
- Responsive design
- Mock data fallback
- Real-time data from analytics API

### 5. Login Enhancement (`src/components/LoginScreen.jsx`)

Updates:
- Captures `role` from officer object
- Calls `setUserRole()` to persist role
- Role stored in localStorage for persistence
- Ensures role is available on app startup

---

## API Integration

### Required API Endpoints
```
GET  /auth/login
Response: { access_token, officer: { id, name, role, ... } }

GET  /analytics/dashboard
Response: { total_cases, active_incidents, solved_cases, hotspots, ... }

GET  /analytics/incidents
Response: { theft_count, assault_count, vandalism_count, ... }

GET  /incident
Response: { data: { items: [...incidents] } }

GET  /cases
Response: { data: { items: [...cases] } }

GET  /map/hotspots
Response: { data: [...hotspots] }
```

### Expected Officer Object
```json
{
  "id": "string",
  "name": "string",
  "role": "admin|sho|dcp|io|constable",
  "badge_no": "string",
  "department": "string"
}
```

---

## Usage Examples

### Checking Permissions in Components

```javascript
import { useAuthStore } from '../lib/store';
import { isHighRankOfficer, hasPermission } from '../lib/permissions';

function MyComponent() {
  const userRole = useAuthStore((state) => state.userRole);
  
  // Check if high-rank
  if (isHighRankOfficer(userRole)) {
    return <AnalyticsView />;
  }
  
  // Check specific permission
  if (hasPermission(userRole, 'canViewAnalytics')) {
    return <ReportsView />;
  }
  
  return <AccessDenied />;
}
```

### Using Permission Guards

```javascript
import { canAccess, isAuthorizedToView } from '../lib/permissions';

// Feature access
if (canAccess(userRole, 'analytics')) {
  // Show analytics
}

// Resource access
if (isAuthorizedToView(userRole, 'sensitiveIncidents')) {
  // Show sensitive data
}
```

### Store Methods

```javascript
import { useAuthStore } from '../lib/store';

function ProtectedComponent() {
  const isHighRank = useAuthStore((state) => state.isHighRank());
  const hasEditPerm = useAuthStore((state) => 
    state.hasPermission('canEditIncidents')
  );
  
  return (
    <div>
      {isHighRank && <AdminPanel />}
      {hasEditPerm && <EditButton />}
    </div>
  );
}
```

---

## Dashboard Layouts

### High-Rank Officer (Admin/SHO/DCP) Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ SAMRAKSHA Dashboard | Admin Dashboard (Analytics View) │
├─────────────────────────────────────────────────────────┤
│ Search Bar                                              │
├──────────────┬──────────────┬──────────────┬────────────┤
│ Total Cases  │ Active       │ Solved Cases │ Hotspots   │
│ (6366f1)     │ (ec4899)     │ (10b981)     │ (f59e0b)   │
└──────────────┴──────────────┴──────────────┴────────────┘
┌─────────────────────────────────────────────────────────┐
│                  INCIDENT ANALYTICS                     │
├───────────────────────────┬────────────────────────────┤
│ Incident Trends           │ Incidents by Type          │
│ (7-day line chart)        │ (bar chart)                │
├───────────────────────────┴────────────────────────────┤
│ Status Distribution (Pie Chart)                        │
└──────────────┬───────────────────────┬────────────────┘
│ Map Widget   │ Quick Notifications  │ Recent Incidents │
│              │                       │ Priority Cases   │
```

### Low-Rank Officer (IO/Constable) Dashboard
```
┌──────────────────────────────────────────────────────────┐
│ SAMRAKSHA Dashboard | IO Dashboard (Field View)         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────┬─────────────────┐ │
│  │                                  │ Active: 35      │ │
│  │                                  │ Resolved: 43    │ │
│  │                                  ├─────────────────┤ │
│  │      OpenStreetMap               │ My Incidents    │ │
│  │      (Incidents + Hotspots)      │ - Incident 1    │ │
│  │                                  │ - Incident 2    │ │
│  │                                  │ - Incident 3    │ │
│  │                                  ├─────────────────┤ │
│  │                                  │ [Report Incident]│ │
│  │                                  │ [Refresh Map]   │ │
│  └──────────────────────────────────┴─────────────────┘ │
```

---

## Security Considerations

1. **Server-Side Validation**: Always validate permissions on backend
2. **Token Persistence**: User role stored in localStorage, cleared on logout
3. **Permission Checks**: All sensitive features should check permissions client-side
4. **Data Filtering**: API responses should be role-filtered by backend
5. **Audit Logging**: Track permission changes and sensitive data access

---

## Future Enhancements

1. **Dynamic Permissions**: Load permissions from backend per user
2. **Custom Roles**: Allow administrators to create custom roles
3. **Time-Based Access**: Implement temporal access control
4. **Resource-Level RBAC**: Fine-grained control per incident/case
5. **Audit Trail**: Track all permission-based actions
6. **Advanced Charts**: Integrate Recharts library for more chart types
7. **Real-time Updates**: WebSocket support for live incident updates
8. **Offline Support**: Cache role permissions for offline access

---

## Testing Checklist

- [ ] Admin login shows analytics dashboard
- [ ] SHO login shows analytics dashboard
- [ ] DCP login shows analytics dashboard
- [ ] IO login shows field map dashboard
- [ ] Constable login shows field map dashboard
- [ ] Analytics not visible to low-rank officers
- [ ] Map visible to all roles
- [ ] Edit buttons shown based on permissions
- [ ] Sensitive data filtered per role
- [ ] Charts load with mock data on API failure
- [ ] Role badge displays correctly
- [ ] Logout clears role from localStorage
- [ ] Page refresh maintains role state

---

## Deployment Notes

1. Ensure backend returns `role` field in officer object during login
2. Backend should validate all permission checks server-side
3. Update API documentation with role filtering expectations
4. Add role-based data filtering in backend responses
5. Implement audit logging for permission-sensitive operations
