/**
 * Sidecar-specific type definitions for the Hivemind GUI control plane.
 *
 * This module defines the core event and data types used across all
 * sidecar modules: the event dispatch system (SidecarEvent /
 * SidecarEventType), the directory listing contract (DirectoryEntry),
 * and supporting type helpers.
 *
 * @module sidecar/types
 */

/**
 * All valid sidecar event type strings as a const array.
 * Provides both runtime access (length, iteration) and the
 * derived {@link SidecarEventType} union.
 */
export const SIDECAR_EVENT_TYPES = [
  "session.created",
  "session.updated",
  "session.idle",
  "session.deleted",
  "session.error",
  "delegation.dispatched",
  "delegation.completed",
  "delegation.failed",
  "delegation.timeout",
  "invalidate.cache",
  "heartbeat",
] as const

/** Union type of all valid sidecar event type strings. */
export type SidecarEventType = (typeof SIDECAR_EVENT_TYPES)[number]

/**
 * A sidecar event carrying a typed name, an unstructured payload,
 * and a creation timestamp.
 */
export interface SidecarEvent {
  type: SidecarEventType
  payload: Record<string, unknown>
  timestamp: number
}

/**
 * A single entry returned by {@link listCanonicalDirectory}.
 * Models the `fs.Dirent` shape exposed by the sidecar state API.
 */
export interface DirectoryEntry {
  name: string
  type: "file" | "directory"
  size: number
  mtime: number
}
