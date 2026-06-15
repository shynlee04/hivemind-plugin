/**
 * Shared type definitions for all SC-02 REST/SSE/WS endpoints.
 *
 * This module is the single source of truth for request/response shapes,
 * transport error codes, SSE filters, WebSocket message schemas, and
 * catalog types. It is imported by every route module, every tool handler,
 * and the W0 test scaffolds.
 *
 * @module sidecar/server/routes/types
 */

// ── Tool response envelope ───────────────────────────────────

/**
 * Standard response envelope for tool proxy endpoints.
 *
 * @typeParam T - The type of the `data` field on success.
 */
export interface ToolResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
  meta: { duration: number; tool: string }
}

// ── Request types (tool proxy) ───────────────────────────────

export interface DelegateTaskRequest {
  agent: string
  prompt: string
  context?: string
  stackOnSessionId?: string
}

export interface DelegationStatusRequest {
  delegationId?: string
  action?: "find-stackable" | "status" | "list"
}

export interface ExecuteSlashCommandRequest {
  command: string
  arguments?: string
  agent?: string
  subtask?: boolean
}

export interface HivemindTrajectoryRequest {
  action: string
  trajectoryId?: string
}

export interface HivemindSessionViewRequest {
  sessionId: string
}

export interface SessionPatchRequest {
  path: string
  content: string
}

export interface HivemindCommandEngineRequest {
  action: string
  commandName?: string
}

// ── Response types (state routes) ────────────────────────────

export interface SnapshotResponse {
  snapshot: Record<string, unknown>
}

export interface SessionSummary {
  id: string
  status: string
  childCount: number
  createdAt: number
}

export interface ChildSession {
  id: string
  parentId: string
  status: string
}

export interface SessionContext {
  context: Record<string, unknown>
}

export interface DelegationRecord {
  delegationId: string
  status: string
  agent: string
  createdAt: number
}

export interface DocChunk {
  name: string
  size: number
  mtime: number
  type: "file" | "directory"
}

// ── WebSocket message types ──────────────────────────────────

export type WsClientMessageType = "subscribe" | "unsubscribe" | "ping" | "event"

export interface WsClientMessage {
  type: WsClientMessageType
  delegationId?: string
  payload?: unknown
}

export interface WsServerMessage {
  type: "delegation.status" | "delegation.output" | "delegation.notification"
  delegationId: string
  status?: string
  output?: unknown
  timestamp: number
}

// ── SSE filter types ─────────────────────────────────────────

export type SseFilterCategory =
  | "session"
  | "delegation"
  | "trajectory"
  | "pressure"
  | "invalidate"
  | "heartbeat"

// ── Catalog types ────────────────────────────────────────────

export interface CatalogResponse {
  catalog: readonly unknown[]
}

export interface ToolCatalogEntry {
  id: string
  name: string
  kind: "read" | "write"
  description: string
}

export interface ToolCatalogResponse {
  tools: readonly ToolCatalogEntry[]
}

// ── Transport error codes ────────────────────────────────────

export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  BAD_FILTER: "BAD_FILTER",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  UNKNOWN_TOOL: "UNKNOWN_TOOL",
  INVALID_FILTER: "INVALID_FILTER",
  INVALID_ARGS: "INVALID_ARGS",
  INVALID_ACTION: "INVALID_ACTION",
  FORBIDDEN_PATH: "FORBIDDEN_PATH",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const

export type ErrorCode = keyof typeof ERROR_CODES
