/**
 * Type definitions for the session-patch tool.
 * @module tools/session-patch/types
 */

import type { SessionPatchRecord } from "../../../schema-kernel/prompt-enhance.schema.js"

/** Supported actions for the session-patch tool. */
export type SessionPatchAction = "execute"

/** Tool arguments schema shape (inferred from tool.schema definition). */
export type SessionPatchArgs = {
  sessionFilePath: string
  section: string
  newContent: string
}

/** Re-export record type from schema-kernel. */
export type { SessionPatchRecord }
