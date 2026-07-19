import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api';
import { useAuthStore } from '../lib/store';

export default function LoginScreen() {
  const [badgeNo, setBadgeNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(badgeNo.trim(), password);
      setAuth(res.data.access_token, res.data.officer);
      navigate('/');
    } catch (err) {
      setError(err.response?.status === 401 ? 'Invalid badge number or password' : 'Login failed — is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color var(--t-base) var(--ease)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-elevated) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient gradient orbs */}
      <div style={{
        position: 'absolute', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)',
        top: '-120px', left: '-100px', animation: 'orbFloat 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)',
        bottom: '-100px', right: '-80px', animation: 'orbFloat 11s ease-in-out infinite reverse',
      }} />

      <div className="glass fade-in-up" style={{
        width: 'min(420px, 92vw)',
        padding: '40px 36px',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 14px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          }}>🛡️</div>
          <h1 style={{ fontSize: 26, letterSpacing: '1px' }}>SAMRAKSHA</h1>
          <div className="label" style={{ marginTop: 6 }}>Crime Monitoring Dashboard</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Badge Number</div>
            <input
              style={inputStyle}
              value={badgeNo}
              onChange={(e) => setBadgeNo(e.target.value)}
              placeholder="e.g. admin"
              autoFocus
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Password</div>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5', fontSize: 13,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !badgeNo || !password}
            style={{
              padding: '14px',
              background: loading ? 'var(--secondary)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'var(--font-headline)',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all var(--t-base) var(--ease)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 22, padding: '12px 14px',
          background: 'var(--primary-container)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          Demo: admin / password123
        </div>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,20px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
