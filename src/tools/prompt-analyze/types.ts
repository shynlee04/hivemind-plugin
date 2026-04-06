/**
 * Type definitions for the prompt-analyze tool.
 * @module tools/prompt-analyze/types
 */

import type { PromptAnalysisFinding, PromptAnalysisResult } from "../../schema-kernel/prompt-enhance.schema.js"

/** Supported actions for the prompt-analyze tool. */
export type PromptAnalyzeAction = "execute"

/** Tool arguments schema shape (inferred from tool.schema definition). */
export type PromptAnalyzeArgs = {
  content: string
}

/** Re-export finding and result types from schema-kernel. */
export type { PromptAnalysisFinding, PromptAnalysisResult }
