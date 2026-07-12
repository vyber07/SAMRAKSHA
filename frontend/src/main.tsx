import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import axios from "axios";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("sam_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import Cases from "./Cases"
import Analytics from "./Analytics"
import Operations from "./Operations"
import Resources from "./Resources"
import Security from "./Security"
import Intelligence from "./Intelligence"
import Archive from "./Archive"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
        <Route path="/" element={<App />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/security" element={<Security />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/archive" element={<Archive />} />
      </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
