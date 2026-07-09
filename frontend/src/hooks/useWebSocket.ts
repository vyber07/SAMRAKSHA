import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

export interface DashboardEvent {
  type: string
  incident?: any
  alert?: any
  routes?: any
  case_id?: string
  fir_no?: string
  ward?: string
  crime_type?: string
  lat?: number
  lon?: number
  plate?: string
  camera?: string
}

export function useWebSocket(
  onMessage: (event: DashboardEvent) => void
) {
  const { token } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(
      `${wsUrl}/ws/dashboard?token=${token}`
    )

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        onMessage(event)
      } catch (err) {
        console.error("Failed to parse WebSocket message", err)
      }
    }

    ws.onclose = (e) => {
      console.log("WebSocket closed", e.reason)
      // Reconnect after 5 seconds
      setTimeout(() => {
        // Trigger effect again by checking token
      }, 5000)
    }

    ws.onerror = (err) => {
      console.error("WebSocket error", err)
    }

    wsRef.current = ws
    return () => {
      ws.close()
    }
  }, [token, onMessage])
}
