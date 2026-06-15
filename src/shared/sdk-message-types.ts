/**
 * SDK message type definitions and extraction utilities.
 *
 * Extracted from `coordinator.ts` to decouple SDK message handling from
 * coordination logic (T4.3). The SDK has evolved its message format —
 * messages may carry metadata in a nested `info` wrapper or directly on
 * the top-level object. These types and helpers capture both shapes
 * without relying on `any`.
 *
 * @module shared/sdk-message-types
 */

import { z } from "zod"

/**
 * Minimal SDK message info shape.
 * Captures metadata nested inside an `info` wrapper.
 */
export interface SdkMessageInfo {
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}

/**
 * Minimal SDK message shape used by the coordinator.
 * The SDK has evolved its message format — messages may carry metadata in a
 * nested `info` wrapper or directly on the top-level object. This type
 * captures both shapes without relying on `any`.
 */
export interface SdkMessage {
  info?: SdkMessageInfo
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}

/**
 * Zod-validated SDK message shape covering both `info.*` wrapper and
 * top-level field positions. Used by the typed extraction functions below
 * to avoid inline type assertions (`as SdkMessage`, `as Record`).
 */
export const sdkMessageSchema = z.object({
  role: z.string().optional(),
  info: z.object({
    role: z.string().optional(),
    error: z.unknown().optional(),
  }).optional(),
  error: z.unknown().optional(),
})

/** Inferred body type from the Zod schema. */
export type SdkMessageShape = z.infer<typeof sdkMessageSchema>

/**
 * Extract the role field from an SDK message, preferring `info.role` over
 * the top-level `role` (the nested wrapper is the newer SDK format).
 *
 * @param msg - A parsed SDK message body (Zod-validated).
 * @returns The role string, or `undefined` if neither field is present.
 */
export function extractSdkMessageRole(msg: SdkMessageShape): string | undefined {
  return msg?.info?.role ?? msg?.role
}

/**
 * Extract a concise error string from an SDK message. Searches `info.error`
 * first, then falls back to top-level `error`. For object errors, extracts
 * the `.message` property if available; otherwise returns `String(errorField)`.
 *
 * This function deliberately does NOT use `JSON.stringify()` on the error
 * field — JSON.stringify produces unreadable long strings for complex objects.
 *
 * @param msg - A parsed SDK message body (Zod-validated).
 * @returns A concise error string, or `undefined` if no error field is present.
 */
export function extractSdkMessageError(msg: SdkMessageShape): string | undefined {
  const errorField = msg?.info?.error ?? msg?.error
  if (errorField === undefined) return undefined
  if (typeof errorField === "object" && errorField !== null) {
    const message = (errorField as Record<string, unknown>)?.message
    return typeof message === "string" && message.length > 0
      ? message
      : String(errorField)
  }
  return String(errorField)
}
