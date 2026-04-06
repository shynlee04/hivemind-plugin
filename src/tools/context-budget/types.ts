/**
 * Type definitions for the context-budget tool.
 * @module tools/context-budget/types
 */

import type { ContextBudgetRecord } from "../../schema-kernel/prompt-enhance.schema.js"

/** Supported actions for the context-budget tool. */
export type ContextBudgetAction = "execute"

/** Tool arguments schema shape (inferred from tool.schema definition). */
export type ContextBudgetArgs = {
  sessionFilePath: string
}

/** Re-export record type from schema-kernel. */
export type { ContextBudgetRecord }
