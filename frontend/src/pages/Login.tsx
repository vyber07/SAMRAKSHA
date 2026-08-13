import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Badge, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const [badge, setBadge] = useState('ADMIN');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 1200));
    const success = login(badge, password);
    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid badge number or password. Please try again.');
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #060d1a 0%, #0a1628 40%, #0d1e38 100%)'
          : 'linear-gradient(135deg, #e8f0fb 0%, #dce9f7 40%, #cce0f5 100%)',
      }}
    >
      {/* Background geometric decorations */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, ${isDark ? 'rgba(0,75,135,0.15)' : 'rgba(0,75,135,0.08)'} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${isDark ? 'rgba(168,202,255,0.08)' : 'rgba(0,75,135,0.05)'} 0%, transparent 50%)`,
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,75,135,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,75,135,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          background: isDark ? 'rgba(13,27,46,0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(168,202,255,0.15)' : '1px solid rgba(255,255,255,0.8)',
          boxShadow: isDark
            ? '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,202,255,0.05)'
            : '0 25px 80px rgba(0,75,135,0.15), 0 0 0 1px rgba(255,255,255,0.5)',
          padding: '40px',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {/* Shield badge */}
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #004B87 0%, #0063B2 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,75,135,0.4)',
              marginBottom: '16px',
            }}
          >
            <Shield size={36} color="white" strokeWidth={1.5} />
          </div>

          <h1
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 800,
              fontSize: '26px',
              color: isDark ? '#e8f0fe' : '#0f172a',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            SAMRAKSHA
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: isDark ? '#7a9cc8' : '#64748b',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Ahmedabad City Police Command
          </p>
          <div
            style={{
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #004B87, #A8CAFF)',
              borderRadius: '2px',
              marginTop: '12px',
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Badge Number */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#7a9cc8' : '#64748b',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Badge Number
            </label>
            <div style={{ position: 'relative' }}>
              <Badge
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#7a9cc8' : '#94a3b8',
                }}
              />
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="Enter badge number"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
                  border: `1px solid ${isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.2)'}`,
                  borderRadius: '10px',
                  color: isDark ? '#e8f0fe' : '#0f172a',
                  fontSize: '14px',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#004B87';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,75,135,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#7a9cc8' : '#64748b',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#7a9cc8' : '#94a3b8',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 42px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
                  border: `1px solid ${isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.2)'}`,
                  borderRadius: '10px',
                  color: isDark ? '#e8f0fe' : '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#004B87';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,75,135,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#7a9cc8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              background: loading ? 'rgba(0,75,135,0.6)' : 'linear-gradient(135deg, #004B87 0%, #0063B2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'Montserrat',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(0,75,135,0.35)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign in to Command Center'
            )}
          </button>
        </form>

        {/* Demo credentials box */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: isDark ? 'rgba(168,202,255,0.06)' : 'rgba(0,75,135,0.05)',
            border: `1px solid ${isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.15)'}`,
            borderRadius: '10px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: isDark ? '#A8CAFF' : '#004B87',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Demo Credentials
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { badge: 'ADMIN', pass: 'admin', role: 'Administrator' },
              { badge: 'IO001', pass: 'io001', role: 'Investigation Officer' },
              { badge: 'DESK01', pass: 'desk01', role: 'Desk Officer' },
            ].map(cred => (
              <div
                key={cred.badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: isDark ? '#b8cef8' : '#334155',
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 600,
                    color: isDark ? '#A8CAFF' : '#004B87',
                    minWidth: '60px',
                  }}
                >
                  {cred.badge}
                </span>
                <span style={{ color: isDark ? '#7a9cc8' : '#94a3b8' }}>/</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{cred.pass}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: isDark ? '#7a9cc8' : '#94a3b8' }}>
                  {cred.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '10px',
            color: isDark ? '#4a6a8a' : '#94a3b8',
            letterSpacing: '0.05em',
          }}
        >
          Ahmedabad City Police · Cyber Cell & Command Intelligence Division
        </p>
      </div>
    </div>
  );
};

export default Login;
