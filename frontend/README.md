# SAMRAKSHA Frontend

Modern Material 3 design police crime monitoring and case management dashboard with glassmorphism effects and 3D UI elements.

## Features

✨ **Modern UI Design**
- Material 3 design system
- Glassmorphism effect with backdrop blur
- Dark theme optimized for long-hour operations
- Smooth animations and transitions

🎨 **Interactive Components**
- 3D rotating cube animation on login screen
- Crime hotspot map visualization
- Real-time incident and case cards
- Quick notification tiles
- Statistics dashboard with progress indicators

📊 **Dashboard Features**
- Quick access statistics (Cases, Incidents, Solved Cases, Hotspots)
- Recent incidents display
- Priority cases view
- Quick notifications panel
- Crime hotspots map
- Responsive grid layout

🔐 **Security**
- JWT-based authentication
- Protected routes
- Token persistence
- Axios request interceptors for auth headers

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Three.js & React Three Fiber** - 3D graphics
- **@react-three/drei** - 3D utilities
- **Material-UI** - UI components

## Setup

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

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

## API Integration

The frontend connects to the backend API endpoints:

- `/auth/login` - User authentication
- `/cases` - Case management
- `/incident` - Incident tracking
- `/map/hotspots` - Crime hotspots data
- `/analytics/dashboard` - Dashboard statistics
- `/patrol` - Patrol unit tracking
- `/cctv` - CCTV management
- `/admin` - Admin functions

## Styling

### Color Palette

- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#ec4899` (Pink)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Glassmorphism

Uses `backdrop-filter: blur(10px)` with semi-transparent backgrounds:

```css
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(10px);
border: 1px solid rgba(148, 163, 184, 0.2);
```

## Components

### Pages
- **LoginScreen** - Authentication with 3D effects
- **Dashboard** - Main monitoring dashboard

### Sidebar & Navigation
- **Sidebar** - Collapsible menu with quick access
- **TopBar** - Header with user info and refresh

### Widgets
- **StatsCard** - Quick statistics display
- **IncidentTile** - Individual incident view
- **CaseCard** - Case information card
- **NotificationTile** - Alert notification display
- **MapWidget** - Interactive crime hotspot map

## State Management

Zustand stores:

```javascript
useAuthStore    // Token, user, logout
useDashboardStore // Incidents, cases, notifications
useMapStore    // Hotspots, patrols, selections
```

## Network Access

The frontend is accessible on all network interfaces:
- **localhost**: `http://localhost`
- **LAN**: `http://<host-ip>`
- **Docker**: Bound to `0.0.0.0:80`

## Default Credentials

```
Username: admin
Password: password123
```

## License

SAMRAKSHA © 2024
