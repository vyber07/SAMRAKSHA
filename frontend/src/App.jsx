import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CasesPage from './pages/CasesPage';
import IncidentsPage from './pages/IncidentsPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PatrolPage from './pages/PatrolPage';
import CCTVPage from './pages/CCTVPage';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/cases" element={<PrivateRoute><CasesPage /></PrivateRoute>} />
      <Route path="/incidents" element={<PrivateRoute><IncidentsPage /></PrivateRoute>} />
      <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/patrol" element={<PrivateRoute><PatrolPage /></PrivateRoute>} />
      <Route path="/cctv" element={<PrivateRoute><CCTVPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
