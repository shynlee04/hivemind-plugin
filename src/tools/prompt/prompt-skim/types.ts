/**
 * Type definitions for the prompt-skim tool.
 * @module tools/prompt-skim/types
 */

import type { PromptSkimResult } from "../../../schema-kernel/prompt-enhance.schema.js"

/** Supported actions for the prompt-skim tool. */
export type PromptSkimAction = "execute"

/** Tool arguments schema shape (inferred from tool.schema definition). */
export type PromptSkimArgs = {
  content: string
  workspaceRoot: string
}

/** Result shape validated against the schema-kernel Zod contract. */
export type { PromptSkimResult }
