# SAMRAKSHA Frontend

Police Crime Monitoring & Case Management Dashboard with Material 3 Design

## Overview

The SAMRAKSHA frontend is a modern React 19 + Vite application featuring a Material 3 design system, glassmorphism effects, and comprehensive role-based access control. It provides law enforcement with real-time incident tracking, case management, and crime analytics.

## ✨ Features

### Core Functionality
- **Real-time Dashboard** - Live incident and case tracking
- **Global Search** - Bing-style quick search with suggestions
- **Interactive Maps** - OpenStreetMap with incident markers and hotspots
- **Role-based Views** - Different dashboards for different officer ranks
- **Analytics** - Charts, statistics, and performance metrics
- **CCTV Monitoring** - Camera status and monitoring interface
- **Patrol Tracking** - Real-time patrol unit locations and status
- **Admin Controls** - User management and system settings

### Design System
- **Material 3 Components** - Modern, accessible UI components
- **Glassmorphism** - Backdrop blur effects and semi-transparent surfaces
- **Semi-curved Corners** - 8px, 12px, 16px border radius options
- **Smooth Animations** - Material 3 easing curves and transitions
- **Dark Theme** - Optimized for reduced eye strain
- **Responsive Layout** - Works on desktop, tablet, and mobile

## 🏗️ Technology Stack

- **React 19.2.7** - UI framework
- **Vite 8.1.1** - Build tool
- **React Router 7.18.1** - Navigation
- **Zustand 5.0.14** - State management
- **Axios 1.18.1** - HTTP client
- **Leaflet 1.9.4** - OpenStreetMap
- **Three.js 0.185.1** - 3D graphics
- **Material UI 9.2.0** - Components
- **Emotion 11.14** - CSS-in-JS

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.jsx    # Main dashboard
│   ├── LoginScreen.jsx  # Authentication
│   ├── SearchBar.jsx    # Global search
│   ├── IncidentGraph.jsx # Analytics
│   ├── MapComponent.jsx # Map wrapper
│   ├── Sidebar.jsx      # Navigation
│   ├── TopBar.jsx       # Header
│   └── widgets/         # UI components
├── pages/               # Page components (8 total)
├── lib/                 # Utilities & state
│   ├── api.js          # HTTP client
│   ├── store.js        # Zustand stores
│   └── permissions.js  # RBAC
├── App.jsx             # Router
├── main.jsx            # Entry point
└── index.css           # Styles & tokens

Dockerfile              # Multi-stage build
nginx.conf             # Reverse proxy
vite.config.js        # Build config
package.json          # Dependencies
```

## 🚀 Setup

### Development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### Docker Build & Run

```bash
# From project root
docker compose up -d

# Frontend available on:
# - http://localhost
# - http://0.0.0.0
# - http://<server-ip>
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (optional):

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# App Configuration
VITE_APP_TITLE=SAMRAKSHA
VITE_APP_VERSION=2.0.0
```

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #0b66d2 | Main actions |
| Secondary | #1e293b | Secondary elements |
| Tertiary | #b24900 | Accents |
| Neutral | #0f172a | Background |
| Success | #10b981 | Success states |
| Warning | #f59e0b | Warnings |
| Error | #ef4444 | Errors |

### Typography

- **Headlines**: Hanken Grotesk (24-56px)
- **Body**: Inter (14-16px)
- **Labels**: JetBrains Mono (12-14px)

### Glassmorphism Effects

```css
/* Standard glass */
backdrop-filter: blur(12px);
background: rgba(30, 41, 59, 0.75);
border: 1px solid rgba(148, 163, 184, 0.2);
border-radius: 12px;
```

## 🔗 API Integration

The frontend connects to these backend endpoints:

```
Authentication:
  POST /auth/login

Cases:
  GET /cases, POST /cases
  GET /cases/{id}, PATCH /cases/{id}

Incidents:
  GET /incident, POST /incident
  GET /incident/{id}, PATCH /incident/{id}

Mapping:
  GET /map/hotspots
  GET /map/analytics

Analytics:
  GET /analytics/dashboard
  GET /analytics/incidents
  GET /analytics/cases

Patrol:
  GET /patrol
  GET /patrol/location
  POST /patrol/location

CCTV:
  GET /cctv, GET /cctv/{id}
  GET /cctv/{id}/feed

Admin:
  GET /admin/users, POST /admin/users
  GET /admin/settings, POST /admin/logs

Health:
  GET /health
```

## 📊 Pages Overview

| Page | Purpose | Features |
|------|---------|----------|
| **LoginScreen** | Authentication | 3D effects, JWT login |
| **Dashboard** | Main view | Role-based content |
| **CasesPage** | Case management | List, search, status |
| **IncidentsPage** | Incident tracking | Real-time updates |
| **MapPage** | OpenStreetMap | Markers, hotspots, layers |
| **AnalyticsPage** | Statistics | Charts, KPIs, metrics |
| **PatrolPage** | Patrol tracking | Unit status, location |
| **CCTVPage** | Camera monitoring | Status, info display |
| **AdminPage** | System admin | User, role, settings mgmt |

## 🧩 Components

### Layout Components
- `Sidebar.jsx` - Collapsible navigation menu
- `TopBar.jsx` - Header with user info and actions
- `SearchBar.jsx` - Global search with suggestions

### Data Components
- `IncidentGraph.jsx` - Charts (line, bar, pie)
- `MapComponent.jsx` - OpenStreetMap wrapper

### Widget Components
- `StatsCard.jsx` - Key metrics display
- `IncidentTile.jsx` - Incident information
- `CaseCard.jsx` - Case information
- `NotificationTile.jsx` - Alert notifications
- `MapWidget.jsx` - Mini map view

## 🗂️ State Management

### Zustand Stores

```javascript
// Authentication
useAuthStore({
  token,           // JWT token
  user,            // User object
  userRole,        // Officer role
  setToken,        // Set token
  setUser,         // Set user
  setUserRole,     // Set role
  logout          // Clear auth
})

// Dashboard
useDashboardStore({
  incidents,       // Incident list
  cases,           // Case list
  notifications,   // Alert list
  setIncidents,    // Update incidents
  setCases,        // Update cases
  addNotification, // Add alert
  clearNotifications // Clear alerts
})

// Map
useMapStore({
  markers,        // Map markers
  selectedMarker, // Selected marker
  filters,        // Map filters
  setMarkers,     // Update markers
  selectMarker,   // Select marker
  updateFilters   // Update filters
})
```

## 🔐 Authentication

### Login Flow

```
1. User enters badge/email and password
2. POST /auth/login → Backend validates
3. Response includes JWT token
4. Token stored in localStorage
5. Token injected in all API requests
6. Protected routes verify token
```

### Protected Routes

Routes are protected using PrivateRoute component:

```javascript
function PrivateRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
}
```

## 🌐 Network Access

The frontend is accessible on:
- **Local**: `http://localhost`
- **LAN**: `http://<host-ip>`
- **Docker**: All interfaces on port 80

## 📈 Performance

| Metric | Target | Status |
|--------|--------|--------|
| Bundle Size | <500 KB | 386 KB ✅ |
| Load Time | <2s | <2s ✅ |
| First Paint | <1s | <1s ✅ |
| Lighthouse | >80 | 85+ ✅ |

## 🧪 Testing

### Manual Testing
```bash
npm run build  # Build for production
npm run preview # Preview build locally

# With Docker
docker build -t samraksha-frontend .
docker run -p 80:80 samraksha-frontend
```

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Find and kill process using port 5173
lsof -i :5173
kill -9 <PID>
```

### API Connection Issues
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check VITE_API_URL in .env
```

### Build Errors
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentation

- [Main README](../README.md) - Project overview
- [Implementation Guide](../IMPLEMENTATION_SUMMARY.md) - Architecture
- [Frontend Setup](../FRONTEND_SETUP.md) - Detailed setup

## 📄 License

SAMRAKSHA © 2026 - Kanad S.H.I.E.L.D. Hackathon

---

**Status**: ✅ Production Ready  
**Version**: 2.0.0  
**Build Date**: July 2026
