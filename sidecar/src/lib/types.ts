/**
 * SC-03 type definitions — mirrors SC-02 API response shapes.
 *
 * These types define the contract between the sidecar Next.js app and
 * the plugin HTTP server (SC-02). They enable typed access to all 17
 * endpoints exposed by the plugin.
 *
 * @module sidecar/lib/types
 */

// ── State types ──

/** Summary of a single active session. */
export interface SessionSummary {
  id: string
  status: string
  description: string
  agent?: string
  children: string[]
  createdAt: number
  updatedAt: number
  depth: number
  toolCallCount?: number
  messageCount?: number
}

/** Summary of a single delegation record. */
export interface DelegationSummary {
  id: string
  agent: string
  status: string
  parentSessionId: string
  depth: number
  createdAt: number
  updatedAt: number
  duration?: number
  error?: string
}

/** A single trajectory event entry. */
export interface TrajectoryEvent {
  phase: string
  checkpoint?: string
  summary: string
  timestamp: number
}

/** Complete state snapshot returned by GET /api/state/snapshot. */
export interface StateSnapshot {
  sessions: SessionSummary[]
  delegations: DelegationSummary[]
  trajectory: TrajectoryEvent[]
  pressure: {
    score: number
    tier: number
    timestamp: number
  }
  config: Partial<Record<string, unknown>>
  server: {
    uptime: number
    port: number
    version: string
    startedAt: number
  }
}

// ── Child session types ──

export interface ChildSession {
  id: string
  status: string
  delegatedBy?: string
  depth: number
  turnCount?: number
  createdAt: number
}

export interface SessionContext {
  [key: string]: unknown
}

// ── Delegation types ──

export interface DelegationRecord {
  id: string
  agent?: string
  status: string
  source: string
  error?: string
  duration?: number
}

// ── Doc chunk types ──

export interface DocChunk {
  id: string
  title: string
  content?: string
  mtime?: number
}

// ── Sidecar event types (mirrors src/sidecar/types.ts) ──

export type SidecarEventType =
  | "session.created"
  | "session.updated"
  | "session.idle"
  | "session.deleted"
  | "session.error"
  | "delegation.dispatched"
  | "delegation.completed"
  | "delegation.failed"
  | "delegation.timeout"
  | "invalidate.cache"
  | "heartbeat"

export interface SidecarEvent {
  type: SidecarEventType
  payload: Record<string, unknown>
  timestamp: number
}

// ── Tool types ──

export interface ToolResponse {
  ok: boolean
  data?: unknown
  error?: string
}

export interface ToolCatalogEntry {
  id: string
  name: string
  kind: "read" | "write"
  description: string
}

// ── Catalog types ──

export interface JsonRenderCatalog {
  components: Record<string, {
    type: string
    schema: unknown
    component: unknown
  }>
}

// ── Sidecar state store shape ──

export interface SidecarState {
  sessions: Record<string, SessionSummary>
  delegations: Record<string, DelegationSummary>
  trajectory: TrajectoryEvent[]
  pressure: { score: number; tier: number; timestamp: number }
  config: Partial<Record<string, unknown>>
  server: { uptime: number; port: number; version: string; startedAt: number }
  ui: {
    activePanel: "sessions" | "delegation" | "mems" | "control"
    selectedSessionId: string | null
    selectedDelegationId: string | null
    sseConnected: boolean
    lastUpdated: number
  }
}
