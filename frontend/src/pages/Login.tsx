import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react'

export function Login() {
  const [badge, setbadge]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleLogin = async () => {
    if (!badge || !password) {
      setError('Please enter badge number and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(badge, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid badge number or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A2B4A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D1D9E6',
        borderRadius: '8px',
        padding: '40px',
        width: '360px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '12px', marginBottom: '32px'
        }}>
          <div style={{
            background: '#1A2B4A', borderRadius: '8px',
            padding: '8px', display: 'flex'
          }}>
            <Shield size={24} color="#C4922A" />
          </div>
          <div>
            <div style={{
              fontSize: '20px', fontWeight: 700,
              color: '#1A2B4A'
            }}>
              SAMRAKSHA
            </div>
            <div style={{
              fontSize: '11px', color: '#5A6A7E',
              marginTop: '1px'
            }}>
              Ahmedabad City Police
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '12px',
            fontWeight: 500, color: '#5A6A7E',
            marginBottom: '6px'
          }}>
            Badge Number
          </label>
          <input
            value={badge}
            onChange={e => setbadge(e.target.value)}
            placeholder="e.g. IO_ELL_1"
            autoComplete="username"
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D9E6', borderRadius: '4px',
              fontSize: '14px', color: '#1C2B3A',
              boxSizing: 'border-box',
              fontFamily: 'IBM Plex Mono, monospace'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '12px',
            fontWeight: 500, color: '#5A6A7E',
            marginBottom: '6px'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="current-password"
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D9E6', borderRadius: '4px',
              fontSize: '14px', boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA',
            borderRadius: '4px', padding: '10px 12px',
            fontSize: '13px', color: '#B52A2A',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '11px',
            background: loading ? '#5A6A7E' : '#1A2B4A',
            color: '#FFFFFF', border: 'none',
            borderRadius: '4px', fontSize: '14px',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{
          marginTop: '24px', paddingTop: '16px',
          borderTop: '1px solid #D1D9E6',
          fontSize: '11px', color: '#5A6A7E',
          textAlign: 'center'
        }}>
          Kanad S.H.I.E.L.D. Cybersecurity Hackathon 2026
        </div>
      </div>
    </div>
  )
}
export default Login
