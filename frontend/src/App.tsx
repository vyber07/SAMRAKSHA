import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'

// Pages
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { MapPage } from './pages/Map'
import { CasesPage } from './pages/Cases'
import { NewFIRPage } from './pages/NewFIR'
import { CaseDetailPage } from './pages/CaseDetail'
import { PatrolPage } from './pages/Patrol'
import { CCTVPage } from './pages/CCTV'
import { AssistantPage } from './pages/Assistant'
import { AnalyticsPage } from './pages/Analytics'

// Private route guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized, restoreSession } = useAuth()

  useEffect(() => {
    if (!initialized) {
      restoreSession()
    }
  }, [initialized, restoreSession])

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{
          border: '3px solid #D1D9E6',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          borderLeftColor: '#1A2B4A',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

// Public route guard (e.g. login page)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized, restoreSession } = useAuth()

  useEffect(() => {
    if (!initialized) {
      restoreSession()
    }
  }, [initialized, restoreSession])

  if (!initialized) {
    return null
  }

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/map" element={
          <PrivateRoute>
            <MapPage />
          </PrivateRoute>
        } />
        
        <Route path="/fir/new" element={
          <PrivateRoute>
            <NewFIRPage />
          </PrivateRoute>
        } />
        
        <Route path="/cases" element={
          <PrivateRoute>
            <CasesPage />
          </PrivateRoute>
        } />
        
        <Route path="/cases/:caseId" element={
          <PrivateRoute>
            <CaseDetailPage />
          </PrivateRoute>
        } />
        
        <Route path="/patrol" element={
          <PrivateRoute>
            <PatrolPage />
          </PrivateRoute>
        } />
        
        <Route path="/cctv" element={
          <PrivateRoute>
            <CCTVPage />
          </PrivateRoute>
        } />
        
        <Route path="/assistant" element={
          <PrivateRoute>
            <AssistantPage />
          </PrivateRoute>
        } />
        
        <Route path="/analytics" element={
          <PrivateRoute>
            <AnalyticsPage />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
