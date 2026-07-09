import React from 'react'

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    open:          { bg: '#FFF3CD', text: '#856404', label: 'Open' },
    arrested:      { bg: '#D1E7DD', text: '#0A3622', label: 'Arrested' },
    chargesheeted: { bg: '#CFE2FF', text: '#084298', label: 'Chargesheeted' },
    closed:        { bg: '#F8F9FA', text: '#5A6A7E', label: 'Closed' },
  }
  const s = styles[status] || styles['open']
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px',
      background: s.bg, color: s.text,
      borderRadius: '4px', fontSize: '12px', fontWeight: 500,
      border: `1px solid ${s.text}22`
    }}>
      {s.label}
    </span>
  )
}

// Risk indicator badge
export function RiskBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#B52A2A'
              : score >= 60 ? '#C4922A'
              : score >= 30 ? '#C47A1A'
              : '#2A7A4B'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '13px', fontWeight: 600, color
    }}>
      <span style={{
        display: 'inline-block', width: '8px', height: '8px',
        borderRadius: '50%', background: color
      }} />
      {score.toFixed(0)}%
    </span>
  )
}

// Info card panel
export function InfoCard({
  title, children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #D1D9E6',
      borderRadius: '6px', padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: '#5A6A7E',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: '14px', paddingBottom: '10px',
        borderBottom: '1px solid #D1D9E6'
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// Info row grid
export function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{
      display: 'flex', gap: '8px',
      marginBottom: '8px', fontSize: '13px'
    }}>
      <span style={{ color: '#5A6A7E', minWidth: '100px', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: '#1C2B3A', fontWeight: 500 }}>
        {value || '—'}
      </span>
    </div>
  )
}

// Section chips for laws
export function SectionGroup({
  label, codes, color
}: {
  label: string; codes?: string[]; color: string
}) {
  if (!codes || codes.length === 0) return null
  return (
    <div style={{ marginBottom: '8px' }}>
      <span style={{
        fontSize: '11px', color: '#5A6A7E',
        fontWeight: 600, marginRight: '8px'
      }}>
        {label}:
      </span>
      {codes.map(code => (
        <span key={code} style={{
          display: 'inline-block', marginRight: '4px', marginBottom: '4px',
          padding: '2px 8px', background: `${color}18`,
          border: `1px solid ${color}40`, borderRadius: '4px',
          fontSize: '12px', fontWeight: 500, color
        }}>
          {code}
        </span>
      ))}
    </div>
  )
}

// Global buttons
export const PRIMARY_BTN: React.CSSProperties = {
  padding: '8px 18px',
  background: '#1A2B4A', color: '#FFFFFF',
  border: '1px solid #1A2B4A', borderRadius: '4px',
  fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
}

export const SECONDARY_BTN: React.CSSProperties = {
  padding: '8px 18px',
  background: '#FFFFFF', color: '#1C2B3A',
  border: '1px solid #D1D9E6', borderRadius: '4px',
  fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
}

export const TH: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: '#5A6A7E',
  background: '#F4F6F9',
  borderBottom: '1px solid #D1D9E6'
}

export const TD: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #E5EBE5',
  color: '#1C2B3A'
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div className="spinner" style={{
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
