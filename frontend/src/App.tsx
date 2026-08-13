import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrimeMap from './pages/CrimeMap';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CCTV from './pages/CCTV';
import Patrol from './pages/Patrol';
import AIAssistant from './pages/AIAssistant';
import DocumentStudio from './pages/DocumentStudio';
import Admin from './pages/Admin';
import EditorPage from './editor/EditorPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* ── Visual Editor (standalone, no app sidebar) ────────────── */}
            <Route
              path="/admin/editor"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />

            {/* ── Main application (with sidebar Layout) ────────────────── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="map" element={<CrimeMap />} />
              <Route path="cases" element={<Cases />} />
              <Route path="case-detail" element={<CaseDetail />} />
              <Route path="case-detail/:id" element={<CaseDetail />} />
              <Route path="cctv" element={<CCTV />} />
              <Route path="patrol" element={<Patrol />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="document-studio" element={<DocumentStudio />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

