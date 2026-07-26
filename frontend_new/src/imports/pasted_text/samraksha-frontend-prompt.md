SAMRAKSHA Frontend — Complete Build Prompt
  
  You are building a complete, production-ready frontend for SAMRAKSHA — a Unified Predictive
  Policing & AI Case Intelligence Platform built for the Ahmedabad City Police. The frontend must
  strictly follow Material Design 3 (M3) spec.
  
  ══════════════════════════════════════════════════════
  STACK
  ══════════════════════════════════════════════════════
  - Vite + React 18 + TypeScript
  - MUI v5 (@mui/material, @mui/icons-material, @mui/x-charts, @mui/x-data-grid)
  - Emotion (already bundled with MUI v5)
  - react-leaflet v4 + leaflet (maps)
  - react-router-dom v6 (routing)
  - axios (HTTP)
  - zustand (state management)
  - Folder: /frontend inside the project root
  
  ══════════════════════════════════════════════════════
  MATERIAL DESIGN 3 REQUIREMENTS (NON-NEGOTIABLE)
  ══════════════════════════════════════════════════════
  1. Use createTheme() with a full M3 color scheme:
     - Primary: #1565C0 (blue800) / onPrimary: #FFFFFF
     - Secondary: #F57F17 (amber darken-4) / onSecondary: #FFFFFF
     - Error: #B71C1C
     - Surface, SurfaceVariant, Background tokens defined
     - Both light and dark theme variants exported
  
  2. Typography must follow the M3 type scale:
     displayLarge (57px), headlineMedium (28px), titleLarge (22px),
     titleMedium (16px), bodyLarge (16px), bodyMedium (14px), labelLarge (14px)
  
  3. Navigation:
     - Desktop (≥900px): M3 Navigation Rail (left side, 80px wide, icons + labels)
     - Mobile (<900px): M3 Bottom Navigation Bar
     - Active state: M3 active indicator pill (full-width background behind icon)
  
  4. Cards: Use MUI Card with M3 elevation levels:
     - Level 0: flat surface (no shadow)
     - Level 1: subtle shadow (tonal surface)
     - Level 2: medium shadow (elevated card)
     Use sx={{ borderRadius: 3 }} on all cards
  
  5. Buttons follow M3 variants:
     - Filled button (primary actions)
     - Outlined button (secondary actions)
     - Text button (tertiary/inline)
     - FAB (Floating Action Button) for primary page actions
  
  6. Use M3 Chip components for: status tags, filter chips, legal section badges
  7. Use LinearProgress for confidence bars
  8. Top App Bar: MUI AppBar with M3 styling, title on left, actions on right
  
  ══════════════════════════════════════════════════════
  BACKEND API (FastAPI at http://localhost:8000)
  ══════════════════════════════════════════════════════
  ALL endpoints require: Authorization: Bearer <JWT token>
  JWT obtained from POST /auth/login → { access_token, token_type, officer: { id, badge_no, name,
  role, ps_id } }
  Roles: constable | io | sho | dcp | admin
  
  ENDPOINTS:
    POST   /auth/login          body: { badge_no, password }
    POST   /auth/logout
  
    GET    /cases               ?page=&limit=   → { items: Case[], page, limit }
    POST   /cases/create        body: FIRCreateRequest → { case_id, fir_no, suggested_sections }
    GET    /cases/search        ?q=             → Case[]
    GET    /cases/:case_id      → Case (full with diary_entries, io_name)
  
    POST   /docs/generate       body: { case_id, doc_type, language } → .docx blob (download)
    GET    /docs                ?case_id=       → DocLog[]
  
    GET    /patrol/routes       → { routes: PatrolRoute[], units, hotspots, computed_at }
    PATCH  /patrol/units/:id    body: { current_lat, current_lon, status }
  
    GET    /map/hotspots        ?days=&crime_type= → { heatmap: [{lat,lon,intensity}], clusters:
  [{cluster_id,center_lat,center_lon,point_count}], total, period_days }
    GET    /map/wards           → { [ward_name]: { risk_score, level: HIGH|ELEVATED|MEDIUM|LOW,
  festival_flag } }
    GET    /map/incidents       ?lat_min=&lat_max=&lon_min=&lon_max=&hours= → Incident[]
    GET    /map/alerts          ?limit= → CCTVAlert[]
    GET    /map/cybercrime      ?days= → CybercrimeCluster[]
  
    POST   /cctv/alert          body: CCTVAlertRequest
  
    POST   /assistant/query     body: { mode: 'this_case'|'all_cases', question, case_id? } → {
  answer, mode, source }
  
    GET    /analytics/summary   → { firs_today, firs_today_change, active_alerts, patrol_active,
  high_risk_zones }
    GET    /analytics/trends    → { hourly: [{hour,count}], weekly: [{day,count}], by_type:
  [{type,count}], monthly: [{month,count}] }
    POST   /analytics/simulate  body: { event, crowd_size } → { event, crowd_size,
  total_units_needed, hotspots: [{zone,sim_risk,units_needed,likely_crime}] }
  
    POST   /legal/suggest       body: { narrative } → { bns_sections, bnss_sections, bsa_sections,
  other_sections, ipc_crossref, case_law, disclaimer }
    GET    /legal/search        ?q= → { results, query }
  
    POST   /translate/          body: { text, target_lang, source_lang } → { original, translated,
  source_lang, target_lang }
    GET    /translate/languages → { languages: [{code, flores_code}] }
  
    WS     ws://localhost:8000/ws/dashboard   → events: NEW_FIR | CCTV_ALERT | ANPR_MATCH |
  PCR_INCIDENT
  
  DATA MODELS:
    Case: { case_id, fir_no, ps_id, io_id, victim_name, victim_address, victim_phone?, victim_age?,
  victim_gender?, victim_injury, accused_name?, accused_address?, accused_age?, crime_type,
  crime_code?, crime_narrative, crime_date, crime_location, crime_lat, crime_lon, bns_sections?,
  bnss_sections?, bsa_sections?, case_status: 'open'|'arrested'|'chargesheeted'|'closed',
  evidence_items?, witnesses?, created_at, io_name?, io_badge?, diary_entries? }
    FIRCreateRequest: { victim_name, victim_address, victim_phone?, victim_age?, victim_gender?,
  victim_injury, crime_type, crime_code?, crime_narrative, crime_date (ISO string), crime_location,
  crime_lat (22.5–23.5), crime_lon (72.0–73.2), ward?, severity (1–5), accused_name?,
  accused_address?, accused_age?, language: 'en'|'hi'|'gu' }
    DocLog: { id, doc_type, sha256, language, generated_at, generated_by_name }
    DiaryEntry: { entry_type, description, ts, auto_generated }
    CCTVAlert: { id, camera_id, source, alert_type, confidence, person_count?, lat, lon, plate_no?,
  ts, matched_fir? }
    7 doc types: chargesheet | medical_letter | remand_request | seizure_receipt | court_custody |
  panchanama | face_id
  
  DEMO CREDENTIALS:
    DCP001 / Demo@2026     (role: dcp)
    SHO_ELL / Demo@2026   (role: sho)
    IO_ELL_1 / Demo@2026  (role: io)
  
  ROLE PERMISSIONS:
    constable: nothing
    io:        create FIR, view own PS cases, patrol view
    sho:       view all PS cases, generate docs, dispatch patrol, CCTV
    dcp:       view all cases, analytics
    admin:     analytics, permissions management
  
  MAP BOUNDS: Ahmedabad lat 22.5–23.5, lon 72.0–73.2, center [23.0225, 72.5714] zoom 12
  
  ══════════════════════════════════════════════════════
  FILE STRUCTURE TO CREATE
  ══════════════════════════════════════════════════════
  frontend/
  ├── Dockerfile                        # multi-stage: node:20-alpine build → nginx:alpine serve
  ├── nginx.conf                        # SPA fallback + /api/ proxy to samraksha-api:8000
  ├── package.json
  ├── tsconfig.json
  ├── tsconfig.node.json
  ├── vite.config.ts                    # dev proxy:
  /auth,/cases,/docs,/patrol,/map,/cctv,/assistant,/analytics,/legal,/translate,/incident,/ws →
  http://localhost:8000
  ├── index.html
  └── src/
      ├── main.tsx                      # BrowserRouter + ThemeProvider + CssBaseline + App
      ├── App.tsx                       # Routes + ProtectedRoute + AppLayout wrapper
      ├── theme/
      │   └── theme.ts                  # Full M3 createTheme (light + dark)
      ├── types/
      │   └── index.ts                  # All TypeScript interfaces (Officer, Case, etc.)
      ├── store/
      │   ├── authStore.ts              # Zustand: token, officer, login(), logout(),
  initFromStorage()
      │   └── wsStore.ts                # Zustand: WebSocket connection, messages[], connect(),
  disconnect()
      ├── api/
      │   ├── client.ts                 # Axios instance + interceptors (attach token, handle 401)
      │   ├── auth.ts
      │   ├── cases.ts
      │   ├── documents.ts
      │   ├── patrol.ts
      │   ├── map.ts
      │   ├── assistant.ts
      │   ├── analytics.ts
      │   ├── legal.ts
      │   └── translate.ts
      ├── components/
      │   ├── layout/
      │   │   └── AppLayout.tsx         # Nav Rail + Bottom Nav + Top App Bar + Outlet
      │   └── common/
      │       ├── StatCard.tsx          # M3 metric card with icon, value, change %
      │       ├── PageHeader.tsx        # Reusable page title + subtitle + action slot
      │       ├── RoleBadge.tsx         # Chip showing officer role with color
      │       ├── LoadingOverlay.tsx    # Centered CircularProgress
      │       ├── ErrorBoundary.tsx     # React error boundary
      │       └── ConfirmDialog.tsx     # M3 Dialog for destructive actions
      └── pages/
          ├── LoginPage.tsx             # Centered M3 Card login form
          ├── DashboardPage.tsx         # 4 stat cards + charts + WS feed + event simulator
          ├── MapPage.tsx               # Split: left panel (wards/patrol) + Leaflet map
  (heatmap/clusters/incidents/CCTV)
          ├── CasesPage.tsx             # DataGrid case list + search + FAB
          ├── CaseDetailPage.tsx        # Full case view: victim, accused, legal sections, diary,
  docs
          ├── FIREntryPage.tsx          # 3-step Stepper form with Leaflet location picker
          ├── AssistantPage.tsx         # Chat UI: case selector + scrollable message thread
          ├── CCTVPage.tsx              # Alert feed + map + filter chips
          └── DocumentsPage.tsx        # Case search + 7 doc type cards + download history
  
  ══════════════════════════════════════════════════════
  PAGE-BY-PAGE SPECIFICATIONS
  ══════════════════════════════════════════════════════
  
  ─── LoginPage ───
  - Full-screen centered layout with subtle background gradient (primary color, low opacity)
  - M3 Card (elevation 2, borderRadius: 3) containing:
    - Shield icon + "SAMRAKSHA" headline + subtitle "Ahmedabad City Police"
    - Badge Number: outlined TextField
    - Password: outlined TextField with InputAdornment toggle (Visibility / VisibilityOff)
    - "Sign In" filled Button (full width, loading state)
    - Divider + demo credentials table (3 rows, small typography, monospace font for credentials)
  - On success: store token + officer in authStore → navigate to /dashboard
  - On error: show Snackbar with error message
  
  ─── AppLayout ───
  - Left Navigation Rail (desktop):
    - Width 80px, full height, M3 surface color
    - Logo/shield icon at top
    - Nav items: Dashboard, Crime Map, Cases, New FIR, AI Assistant, CCTV, Documents
    - Each item: icon + label beneath, M3 active indicator (pill-shaped background)
    - Role-based filtering: constable sees only Map; io sees Map+Cases+NewFIR+Docs; sho+ sees all;
  dcp sees Map+Cases+Assistant+Dashboard
    - Bottom: officer name + badge + role chip + logout IconButton
    - Green pulsing dot when WS connected
  - Bottom Navigation (mobile):
    - Same items, condensed, icons only with labels
  - Main content area: scrollable, padding 16px, takes remaining width
  
  ─── DashboardPage ───
  - Grid of 4 StatCards (responsive: 4-col desktop, 2-col tablet, 1-col mobile)
    1. FIRs Today — Assignment icon — blue — shows firs_today_change % chip
    2. CCTV Alerts — Videocam icon — orange — active_alerts
    3. Patrol Units — DirectionsCar icon — green — patrol_active
    4. High Risk Zones — Warning icon — red — high_risk_zones
  - Analytics section (2 columns):
    Left: BarChart "Crime by Hour" (hourly data, 24 bars, x=hour, y=count)
    Right: PieChart "Crime Types" (by_type data, top 8)
  - Full-width LineChart "Monthly Trend" (monthly data)
  - Live Events Feed: Paper component, last 10 WS messages, each as a list item with colored dot by
  type (NEW_FIR=blue, CCTV_ALERT=orange, ANPR_MATCH=red, PCR_INCIDENT=yellow)
  - Festival Simulation Card (sho/dcp/admin only):
    - Select dropdown: Rath Yatra | Navratri | Diwali | New Year | Uttarayan
    - Slider: crowd_size 10,000–200,000 with marks
    - "Run Simulation" filled button → POST /analytics/simulate → show results in Table
    - Results table: Zone | Sim Risk (colored Chip) | Units Needed | Likely Crime
  - Auto-refresh every 30s
  
  ─── MapPage ───
  - Layout: flex row, full height (calc(100vh - 64px))
  - Left panel (320px, scrollable, M3 surface):
    - "Ward Risk Scores" section heading
    - List of wards: each row has ward name + risk level Chip (HIGH=red, ELEVATED=orange,
  MEDIUM=amber, LOW=green) + risk score number
    - Festival flag icon (🎉) if festival_flag true
    - Divider
    - Filters: "Days" Slider 1–90 + "Crime Type" Select (auto-populated from distinct types)
    - "Patrol Routes" section: list of routes with unit name + waypoint count + "Refresh" button
    - "CCTV Alerts" count badge
  - Main Leaflet map:
    - TileLayer: OpenStreetMap
    - Heatmap: CircleMarkers (radius 12, color interpolated red→yellow by intensity 0→1,
  fillOpacity=intensity, stroke=false)
    - Clusters: CircleMarkers (radius 18, purple, opacity 0.7) with DivIcon showing point count
    - Incidents: CircleMarkers colored by severity (1=green, 2=cyan, 3=yellow, 4=orange, 5=red),
  Popup showing crime_type + timestamp + ward
    - Patrol routes: Polyline (blue, dashed, weight 3) for each route's waypoints
    - CCTV alerts: Marker with camera emoji, Popup showing camera_id + alert_type + confidence%
    - Cybercrime: CircleMarkers (purple diamond shape via DivIcon)
  - Legend (top-right corner, absolute-positioned Paper):
    - Color swatches for each layer
  - FAB (bottom-right, primary color): refresh icon → re-fetch all map data
  
  ─── CasesPage ───
  - PageHeader: "Cases" + search TextField (live search via GET /cases/search)
  - MUI DataGrid with columns:
    FIR No (link → /cases/:id), Victim, Accused (or "—"), Crime Type, Date, Status Chip, Actions
  (View IconButton)
  - Status Chips: open=info, arrested=warning, chargesheeted=secondary, closed=default
  - Server-side pagination (page/limit params)
  - FAB (bottom-right, extended): + New FIR → /cases/new
  - Role guard: constable sees empty with access-denied message
  
  ─── CaseDetailPage ───
  - Breadcrumb: Cases > FIR No
  - Top strip: FIR number (headline), status Chip, crime type Chip
  - Two-column grid (lg: 8/4, sm: 12/12):
    Left column (stacked cards):
      1. Victim Details Card: name, address, phone, age, gender, injury badge
      2. Crime Details Card: type, narrative (expandable), date, location, lat/lon
      3. Legal Sections Card: chips for each BNS/BNSS/BSA section; IPC cross-reference chips in
  secondary color
      4. Accused Details Card (if exists): name, address, age
    Right column (stacked cards):
      1. Documents Card:
         - List of existing docs (GET /docs?case_id=): doc_type label + language + date + SHA256
  truncated + Download button
         - "Generate Document" section: doc_type Select + language Select (EN/HI/GU) + Generate
  button → POST /docs/generate → trigger blob download
      2. AI Quick-Query Card: small TextField + Ask button → POST /assistant/query mode=this_case →
  show answer in Card body
      3. Case Diary Timeline: vertical list with colored icon per entry_type (fir=blue, arrest=red,
  seizure=yellow, document=purple, cctv=orange, note=grey)
  - AI disclaimer banner at top of right column
  
  ─── FIREntryPage ───
  - PageHeader: "Register New FIR"
  - MUI Stepper (3 steps, horizontal on desktop, vertical on mobile):
    Step 1 — Victim Details:
      Full Name*, Address*, Phone, Age, Gender (Male/Female/Other Select), Injury (Checkbox with red
  label if checked)
    Step 2 — Crime Details:
      Crime Type* (Select: Theft|Robbery|Snatching|Assault|Murder|Rape|Kidnapping|Cyber Crime|Drug
  Offense|Stalking|Extortion|Riot|Other)
      Crime Code (number, optional)
      Narrative* (multiline 6 rows) — with "Suggest Legal Sections" Button → POST /legal/suggest →
  show chips in a Paper below
      Crime Date & Time* (datetime-local input)
      Crime Location* (text)
      Location Picker (mini Leaflet map 300px tall, Ahmedabad bounds, click to set marker + fill
  lat/lon fields)
      Ward (Select: list of Ahmedabad wards)
      Severity* (RadioGroup 1–5 with labels: 1=Minor … 5=Critical)
      Language (EN/HI/GU toggle)
    Step 3 — Accused & Review:
      Accused Name, Address, Age (all optional, clearly marked "If known")
      Divider
      Review Summary: all entered values in a read-only list
      Suggestion panel: show BNS sections from legal/suggest if fetched
  - Navigation: Back / Next buttons; Submit on step 3
  - Form validation: required fields must not be empty before Next
  - On submit: POST /cases/create → success Snackbar "FIR Registered: {fir_no}" + navigate to
  /cases/{case_id}
  - Show error Snackbar with backend message on failure
  
  ─── AssistantPage ───
  - PageHeader: "AI Case Assistant" + disclaimer Chip ("For review only")
  - Two-panel layout (flex row, gap):
    Left panel (320px, scrollable):
      - Mode ToggleButtonGroup: "This Case" | "All Cases"
      - If "This Case":
        TextField to search cases → list of matching cases → click to select
        Selected case info card: FIR No, crime type, status
      - If "All Cases": info text about scope
      - Disclaimer Alert (MUI Alert severity="warning"): AI answers from case data only
    Right panel (flex-grow, flex column):
      - Chat message list (flex-grow, overflow-y auto, padding):
        User messages: right-aligned, Paper with primary.light bg, "You" label
        Assistant messages: left-aligned, Paper with surface bg, "SAMRAKSHA AI" label + source badge
  (LLM=success Chip, Fallback=warning Chip)
      - Input row (sticky bottom): TextField + Send IconButton (primary)
      - Loading: Skeleton 3 lines while awaiting response
  - Empty state: centered illustration text "Ask a question about case evidence, sections, or
  patterns"
  
  ─── CCTVPage ───
  - PageHeader: "CCTV Monitoring" + last-refresh timestamp
  - Stats row: 4 mini StatCards (crowd_density count | loitering count | anomaly count | anpr count)
  for last 24h
  - Filter Chips row: All | Crowd Density | Loitering | Anomaly | ANPR
  - Two-column layout (7/5):
    Left — Alert Feed (scrollable list):
      Each alert is a Card:
        - Header: camera_id (bold) + alert_type Chip (crowd_density=error, loitering=warning,
  anomaly=secondary, anpr=info) + timestamp
        - Confidence LinearProgress (0–1, colored by value: <0.5=warning, ≥0.5=success)
        - Person count if present
        - Plate No if present (monospace Chip)
        - Matched FIR Chip (red) if matched_fir exists
    Right — Map:
      Leaflet map, camera markers (📷 emoji DivIcon), CircleMarker heatmap layer from alerts
  - Auto-refresh every 10 seconds + WebSocket subscription for CCTV_ALERT events
  
  ─── DocumentsPage ───
  - PageHeader: "Document Generation"
  - Case search: TextField + search button → GET /cases/search → show results in a List → click to
  select
  - Selected case banner: FIR No | Crime Type | Status
  - 7 Document Type Cards in 2-column grid, each card:
    - Icon (use relevant MUI icon: Gavel, LocalHospital, Gavel, Receipt, AccountBalance, Assignment,
  Face)
    - Doc type label (human readable: "Chargesheet", "Medical Letter", etc.)
    - Description (1 line)
    - Language chip group (EN / HI / GU)
    - "Generate" filled Button → POST /docs/generate → trigger download as .docx
    - Note: medical_letter card shows warning if victim_injury is false
  - Download History Table (GET /docs?case_id=):
    Columns: Doc Type | Language | Generated At | Generated By | SHA-256 (first 12 chars) | Download
  
  ══════════════════════════════════════════════════════
  REUSABLE COMPONENTS
  ══════════════════════════════════════════════════════
  
  StatCard:
    Props: title, value, change? (number %), icon (ReactNode), color, loading?
    M3 Card, elevation 1, icon in colored Avatar (primary/secondary/error/warning/success),
    large Typography for value, small Chip for change (green if +, red if -, grey if 0)
  
  PageHeader:
    Props: title, subtitle?, action? (ReactNode)
    Stack with title (headlineMedium), subtitle (bodyMedium, grey), optional action aligned right
  
  RoleBadge:
    Maps role → color: constable=default, io=primary, sho=secondary, dcp=error, admin=warning
    MUI Chip with appropriate icon
  
  LoadingOverlay:
    Box with display:flex, justifyContent:center, alignItems:center, minHeight:200px +
  CircularProgress
  
  ErrorBoundary:
    Standard React class-based error boundary, shows error Card with title + message + "Reload"
  button
  
  ConfirmDialog:
    Props: open, title, message, confirmLabel, onConfirm, onCancel
    MUI Dialog with DialogTitle, DialogContent, DialogActions (Cancel + Confirm filled)
  
  ══════════════════════════════════════════════════════
  STATE MANAGEMENT (Zustand)
  ══════════════════════════════════════════════════════
  
  authStore:
    State: { token: string|null, officer: Officer|null, isAuthenticated: boolean }
    Actions:
      login(badge_no, password): calls POST /auth/login, stores token in localStorage + state
      logout(): clears localStorage + state + navigates to /login
      initFromStorage(): reads token from localStorage on app start, validates by checking officer
  state
  
  wsStore:
    State: { connected: boolean, messages: WSMessage[] }
    Actions:
      connect(token?): opens WebSocket to ws://{location.host}/ws/dashboard, sets connected=true on
  open
      disconnect(): closes WS, sets connected=false
      On message: parse JSON, push to messages[] (keep last 50 only)
  
  ══════════════════════════════════════════════════════
  API LAYER (axios)
  ══════════════════════════════════════════════════════
  
  api/client.ts:
    - Create axios instance, baseURL = import.meta.env.VITE_API_URL ?? '/'
    - Request interceptor: read token from localStorage, set Authorization: Bearer {token}
    - Response interceptor: if 401, call authStore.logout()
  
  api/documents.ts — generateDocument:
    Use axios with responseType: 'blob', then:
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  
  ══════════════════════════════════════════════════════
  VITE CONFIG
  ══════════════════════════════════════════════════════
  Dev server proxy: all of /auth /cases /docs /patrol /map /cctv /assistant /analytics /legal
  /translate /incident /ws → target: 'http://localhost:8000', ws: true for /ws
  
  ══════════════════════════════════════════════════════
  DOCKERFILE (multi-stage)
  ══════════════════════════════════════════════════════
  Stage 1 (build):
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY package.json .
    RUN npm install
    COPY . .
    RUN npm run build
  
  Stage 2 (serve):
    FROM nginx:alpine
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80
  
  nginx.conf:
    server {
      listen 80;
      root /usr/share/nginx/html;
      index index.html;
      location / { try_files $uri $uri/ /index.html; }
      location /api/ { proxy_pass http://samraksha-api:8000/; proxy_set_header ... }
      location /ws/ { proxy_pass http://samraksha-api:8000/ws/; proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
    }
  
  ══════════════════════════════════════════════════════
  IMPORTANT IMPLEMENTATION NOTES
  ══════════════════════════════════════════════════════
  1. Import leaflet CSS in main.tsx: import 'leaflet/dist/leaflet.css'
  2. Fix leaflet default marker icons (Webpack/Vite asset issue):
     import L from 'leaflet'; delete (L.Icon.Default.prototype as any)._getIconUrl;
     L.Icon.Default.mergeOptions({ iconUrl: ..., shadowUrl: ... }) — use CDN URLs
  3. All pages using react-leaflet must use dynamic import or wrap MapContainer in a div with
  explicit height
  4. ProtectedRoute: if !isAuthenticated, redirect to /login
  5. AppLayout should call wsStore.connect() on mount and wsStore.disconnect() on unmount
  6. All API calls should be in try/catch, show Snackbar on error
  7. Use React.lazy + Suspense for page-level code splitting
  8. The /docs/generate response is a binary blob (.docx file) — use axios responseType: 'blob'
  9. FIR dates must be sent as ISO 8601 strings
  10. Ahmedabad ward list (use these exact names for the Select): Jamalpur, Kalupur, Dariapur,
  Shahpur, Saraspur, Gomtipur, Odhav, Vatva, Behrampura, Maninagar, Sardarnagar, Nikol, Naroda,
  Thakkarbapa, Chandkheda, Sabarmati, Ranip, Naranpura, Ghatlodia, Sola, Bodakdev, Vastrapur,
  Satellite, Jodhpur, Ambawadi, Navrangpura, Paldi, Vejalpur, Vastral, Isanpur, Khadia, Rakhial
  
  ══════════════════════════════════════════════════════
  WHAT TO BUILD
  ══════════════════════════════════════════════════════
  Generate ALL files listed in the file structure above with complete, working implementation code.
  Do not use placeholder comments like "// TODO" — every function must be fully implemented. Every
  page must be functional against the real API.