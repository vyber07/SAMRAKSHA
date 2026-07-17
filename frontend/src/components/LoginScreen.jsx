import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function RotatingCube() {
  const meshRef = React.useRef();
  const groupRef = React.useRef();

  React.useEffect(() => {
    let frameId;
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.x += 0.002;
        groupRef.current.rotation.y += 0.003;
        groupRef.current.rotation.z += 0.001;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <group ref={groupRef} scale={1.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 4]} />
        <meshPhongMaterial
          color="#6366f1"
          emissive="#4f46e5"
          shininess={100}
          wireframe={false}
        />
      </mesh>
      <pointLight position={[10, 10, 10]} intensity={1} color="#ec4899" />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#8b5cf6" />
    </group>
  );
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setUserRole = useAuthStore((state) => state.setUserRole);
  const [badgeNo, setBadgeNo] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await auth.login(badgeNo, password);
      setToken(response.data.access_token);
      const officer = response.data.officer;
      setUser(officer);

      // Ensure role is set from officer data
      if (officer && officer.role) {
        setUserRole(officer.role);
      }

      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail;
      setError(
        typeof errorMsg === 'string' ? errorMsg :
        Array.isArray(errorMsg) ? errorMsg[0]?.msg || 'Login failed' :
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background 3D canvas */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}>
        <Canvas>
          <PerspectiveCamera position={[0, 0, 2.5]} fov={75} />
          <RotatingCube />
          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      {/* Login card with glassmorphism */}
      <div style={{
        position: 'relative',
        zIndex: 10,
      }}>
        <form
          onSubmit={handleLogin}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            width: '420px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: '#f1f5f9',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              SAMRAKSHA
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#cbd5e1',
              margin: 0,
            }}>
              Crime Monitoring & Case Management
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#cbd5e1',
            }}>
              Badge Number
            </label>
            <input
              type="text"
              value={badgeNo}
              onChange={(e) => setBadgeNo(e.target.value)}
              placeholder="e.g., admin or badge123"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#f1f5f9',
                fontSize: '14px',
                transition: 'all 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#cbd5e1',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#f1f5f9',
                fontSize: '14px',
                transition: 'all 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            }}
            onHover={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.4)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            margin: 0,
          }}>
            Demo: Badge "admin" with password "password123"
          </p>
        </form>
      </div>
    </div>
  );
}
