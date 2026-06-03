/**
 * Custom SSE client hook — connects to the plugin server's SSE endpoint
 * and dispatches events to the StateStore.
 *
 * Features exponential backoff reconnection (1s→2s→4s→8s→16s→30s max),
 * heartbeat timeout detection (90s), and cleanup on unmount.
 *
 * @module sidecar/lib/use-sse
 */

"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getPluginClient } from "./plugin-client"
import {
  SSE_RECONNECT_BASE_MS,
  SSE_MAX_BACKOFF_MS,
  HEARTBEAT_TIMEOUT_MS,
} from "./constants"
import type { SidecarEvent, SidecarEventType } from "./types"

export interface UseSseOptions {
  /** Callback invoked when an SSE event is received. */
  onEvent?: (event: SidecarEvent) => void
  /** Callback invoked when connection state changes. */
  onConnectionChange?: (connected: boolean) => void
  /** Heartbeat timeout in ms (default: 90000). */
  heartbeatTimeoutMs?: number
}

export interface UseSseResult {
  /** Whether the SSE connection is currently active. */
  connected: boolean
  /** The last received event type, or null if none. */
  lastEvent: SidecarEventType | null
  /** Manually reconnect the SSE connection. */
  reconnect: () => void
}

/**
 * React hook that connects to the plugin server's SSE endpoint
 * and provides real-time event streaming.
 *
 * @param options - Configuration options.
 * @returns Connection state and control methods.
 */
export function useSse(options: UseSseOptions = {}): UseSseResult {
  const { onEvent, onConnectionChange, heartbeatTimeoutMs = HEARTBEAT_TIMEOUT_MS } = options
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SidecarEventType | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  /** Calculate the current backoff delay. */
  const getBackoffMs = useCallback((): number => {
    const delay = SSE_RECONNECT_BASE_MS * Math.pow(2, reconnectAttemptRef.current)
    return Math.min(delay, SSE_MAX_BACKOFF_MS)
  }, [])

  /** Record a failed attempt (increment attempt counter). */
  const recordFailedAttempt = useCallback((): void => {
    reconnectAttemptRef.current++
  }, [])

  /** Clear heartbeat timer. */
  const clearHeartbeat = useCallback((): void => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  /** Start heartbeat timeout detection. */
  const startHeartbeat = useCallback((): void => {
    clearHeartbeat()
    heartbeatTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        setConnected(false)
        onConnectionChange?.(false)
      }
    }, heartbeatTimeoutMs)
  }, [clearHeartbeat, heartbeatTimeoutMs, onConnectionChange])

  /** Connect (or reconnect) the EventSource. */
  const connect = useCallback((): void => {
    if (!mountedRef.current) return

    // Cleanup previous connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    try {
      const client = getPluginClient()
      const url = client.getEventsUrl()
      const es = new EventSource(url)

      es.onopen = () => {
        if (!mountedRef.current) {
          es.close()
          return
        }
        setConnected(true)
        onConnectionChange?.(true)
        reconnectAttemptRef.current = 0
        startHeartbeat()
      }

      es.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return
        try {
          const parsed = JSON.parse(event.data) as SidecarEvent
          setLastEvent(parsed.type)
          onEvent?.(parsed)
          // Reset heartbeat on any event
          startHeartbeat()
        } catch {
          // Ignore malformed events
        }
      }

      es.onerror = () => {
        if (!mountedRef.current) return
        es.close()
        setConnected(false)
        onConnectionChange?.(false)
        clearHeartbeat()

        // Exponential backoff reconnection
        const delay = getBackoffMs()
        recordFailedAttempt()
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      eventSourceRef.current = es
    } catch {
      // Connection failed — retry with backoff
      const delay = getBackoffMs()
      recordFailedAttempt()
      reconnectTimerRef.current = setTimeout(() => {
        connect()
      }, delay)
    }
  }, [onEvent, onConnectionChange, getBackoffMs, recordFailedAttempt, clearHeartbeat, startHeartbeat])

  /** Exposed reconnect method. */
  const reconnect = useCallback((): void => {
    reconnectAttemptRef.current = 0
    connect()
  }, [connect])

  // Lifecycle: connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearHeartbeat()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect, clearHeartbeat])

  return { connected, lastEvent, reconnect }
}
