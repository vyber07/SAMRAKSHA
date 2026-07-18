# SAMRAKSHA RBAC - Quick Start Guide

## 🚀 What's Implemented?

Role-Based Dashboard Logic with TWO distinct dashboard layouts:

### For High-Rank Officers (Admin, SHO, DCP)
📊 **Analytics Dashboard** with:
- Incident trends (7-day line chart)
- Incident types (bar chart)
- Status distribution (pie chart)
- Statistics cards
- Quick map widget
- Recent incidents & priority cases

### For Low-Rank Officers (IO, Constable)
🗺️ **Field Dashboard** with:
- Full-screen OpenStreetMap
- Incident location markers
- Hotspot heatmap visualization
- Quick stats sidebar
- My Incidents list
- Report & Refresh buttons

---

## 📁 Files Changed

### Created
```
src/lib/permissions.js              → Permission management (180 lines)
src/components/IncidentGraph.jsx    → Charts & analytics (400 lines)
RBAC_IMPLEMENTATION.md              → Detailed technical guide
ROLE_MATRIX.md                      → Quick reference matrix
INTEGRATION_CHECKLIST.md            → Testing checklist
IMPLEMENTATION_SUMMARY.md           → Full summary
QUICK_START.md                      → This file
```

### Modified
```
src/lib/store.js                    → Added role state & methods
src/components/Dashboard.jsx        → Added role-based rendering
src/components/LoginScreen.jsx      → Added role assignment
```

---

## 🔐 Roles & Permissions

| Role | Level | Dashboard | Analytics | Map | Edit | Manage Users |
|------|:-----:|-----------|:---------:|:---:|:----:|:------------:|
| Admin | 3 | Analytics | ✅ | ✅ | ✅ | ✅ |
| SHO | 3 | Analytics | ✅ | ✅ | ✅ | ❌ |
| DCP | 2 | Analytics | ✅ | ✅ | ✅ | ❌ |
| IO | 1 | Field | ❌ | ✅ | ✅ | ❌ |
| Constable | 0 | Field | ❌ | ✅ | ❌ | ❌ |

---

## 💻 Quick Testing

### Test Admin Login
```bash
Badge: admin
Password: password123
Expected: Analytics dashboard with charts
```

### Test IO Login
```bash
Badge: io_user (or similar)
Password: password123
Expected: Field map dashboard
```

---

## 🛠️ Development Usage

### Check User Role in Components
```javascript
import { useAuthStore } from '../lib/store';

function MyComponent() {
  const userRole = useAuthStore((state) => state.userRole);
  
  if (userRole === 'admin') {
    return <AdminView />;
  }
  
  return <UserView />;
}
```

### Check Permissions
```javascript
import { hasPermission } from '../lib/permissions';

const canViewAnalytics = hasPermission(userRole, 'canViewAnalytics');

if (canViewAnalytics) {
  return <AnalyticsView />;
}
```

### Guard Components
```javascript
import { isHighRankOfficer } from '../lib/permissions';

{isHighRankOfficer(userRole) && <AnalyticsPanel />}
{!isHighRankOfficer(userRole) && <FieldPanel />}
```

---

## 📊 Dashboard Comparison

### High-Rank Dashboard
```
┌─────────────────────────────────────────┐
│ Role Badge: Admin Dashboard             │
├─────────────────────────────────────────┤
│ [Search Bar]                            │
├─────┬──────────┬──────────┬──────────┬──┤
│ 4 Statistics Cards in Grid            │
├─────────────────────────────────────────┤
│ INCIDENT ANALYTICS SECTION              │
│ ├─ Line Chart (7-day trends)           │
│ ├─ Bar Chart (incident types)          │
│ └─ Pie Chart (status distribution)     │
├────────────────┬──────────────┬────────┤
│ [Map Widget]   │ [Notifs]     │ [Cases]│
└────────────────┴──────────────┴────────┘
```

### Low-Rank Dashboard
```
┌────────────────────────────────────────┐
│ Role Badge: IO Dashboard (Field View) │
├───────────────────────────┬────────────┤
│                           │ Active: 35 │
│                           │ Resolved:43│
│   OpenStreetMap           ├────────────┤
│  (Incidents+Hotspots)     │My Incidents│
│   with Heatmap            │- Inc 1     │
│                           │- Inc 2     │
│                           │- Inc 3     │
│                           ├────────────┤
│                           │[Report]    │
│                           │[Refresh]   │
└───────────────────────────┴────────────┘
```

---

## 📊 Charts in IncidentGraph

### 1. Line Chart: 7-Day Trends
- Shows incident count per day
- Mon-Sun
- Smooth line with data points
- Grid lines for reference

### 2. Bar Chart: Incident Types
- Theft, Assault, Vandalism, Traffic, Other
- Color-coded bars
- Category labels
- Value indicators

### 3. Pie Chart: Status Distribution
- Active, Resolved, Pending
- Percentage breakdown
- Color legend
- Interactive segments

### 4. Statistics Cards
- Total Incidents (big number)
- Active (current incidents)
- Resolved (closed cases)

---

## 🔄 Data Flow

```
Login Screen
    ↓
POST /auth/login → { token, officer { role } }
    ↓
setToken() + setUser() + setUserRole()
    ↓
localStorage.userRole = role
    ↓
Navigate to Dashboard
    ↓
Read userRole from store
    ↓
High-Rank? → Analytics Dashboard + Charts
Low-Rank?  → Field Dashboard + Map
    ↓
Fetch appropriate data
    ↓
Render components
```

---

## 🧪 Testing Checklist

### Basic Tests (5 min)
- [ ] Admin sees analytics dashboard
- [ ] IO sees field map dashboard
- [ ] Role badge shows correctly
- [ ] Charts render

### Intermediate Tests (15 min)
- [ ] All 5 roles work correctly
- [ ] Logout clears role
- [ ] Page refresh keeps role
- [ ] Map markers display

### Advanced Tests (30 min)
- [ ] Permission checks work
- [ ] API data displays correctly
- [ ] Mock data works on API error
- [ ] Mobile responsive

---

## 🔗 API Integration

### Required Backend Response (Login)
```json
{
  "access_token": "jwt_token",
  "officer": {
    "id": "12345",
    "name": "John Doe",
    "role": "admin",        // MUST HAVE THIS
    "badge_no": "ADM-001",
    "department": "Admin"
  }
}
```

### Required Endpoints
- `POST /auth/login` (must include role)
- `GET /analytics/dashboard` (high-rank only)
- `GET /analytics/incidents` (high-rank only)
- `GET /incident` (all roles)
- `GET /cases` (all roles)
- `GET /map/hotspots` (for map)

---

## ⚠️ Important Notes

1. **Backend Must Validate Roles**
   - Client-side checks are for UX only
   - Always validate on backend
   - Filter API responses by role

2. **Role Persistence**
   - Role stored in localStorage
   - Cleared on logout
   - Restored on app restart

3. **Permission Hierarchy**
   - Admin/SHO (Level 3) > DCP (Level 2) > IO (Level 1) > Constable (Level 0)
   - Used for access control

4. **Charts**
   - No external library required (uses SVG)
   - Mock data on API failure
   - Responsive grid layout

5. **Map Component**
   - Uses Leaflet (existing dependency)
   - Low-rank officers see full-screen map
   - Markers show severity colors

---

## 📚 Documentation Files

Read these in order:
1. **QUICK_START.md** (this file) - Overview
2. **ROLE_MATRIX.md** - Permission matrix
3. **RBAC_IMPLEMENTATION.md** - Technical details
4. **INTEGRATION_CHECKLIST.md** - Testing guide
5. **IMPLEMENTATION_SUMMARY.md** - Complete summary

---

## 🐛 Common Issues & Fixes

### Role not showing after login
```
✓ Check localStorage has 'userRole'
✓ Verify setUserRole() called in LoginScreen
✓ Check officer.role in API response
```

### Charts not rendering
```
✓ Check /analytics/dashboard API is working
✓ Verify response has correct fields
✓ Check mock data displays if API fails
```

### Wrong dashboard showing
```
✓ Verify userRole value in store
✓ Check isHighRank/isLowRank logic
✓ Inspect role in browser DevTools
```

### Map not loading
```
✓ Check Leaflet library is loaded
✓ Verify map container has size
✓ Check /map/hotspots API responds
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Implementation complete
2. ⏳ Run testing checklist
3. ⏳ Verify all 5 roles work
4. ⏳ Check APIs return correct data

### Before Production
1. ⏳ Backend role filtering
2. ⏳ Audit logging
3. ⏳ Security review
4. ⏳ Load testing

### Future Enhancements
- Recharts library for advanced charts
- Real-time WebSocket updates
- Advanced filtering UI
- Custom role creation
- Permission management dashboard

---

## 📞 Need Help?

1. **For technical details**: Read RBAC_IMPLEMENTATION.md
2. **For testing**: Use INTEGRATION_CHECKLIST.md
3. **For quick reference**: Check ROLE_MATRIX.md
4. **For overview**: This file (QUICK_START.md)

---

## ✅ Implementation Checklist

- [x] Auth store updated with role state
- [x] Permissions module created
- [x] Dashboard conditional rendering done
- [x] IncidentGraph component created
- [x] LoginScreen enhanced with role setting
- [x] Charts with fallback data
- [x] Map component integration
- [x] Comprehensive documentation
- [x] Testing guide provided

**Status**: ✅ READY FOR TESTING

---

*Last Updated: 2026-07-17*  
*Implementation: Complete*  
*Ready for: QA Testing*
