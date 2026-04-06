import { z } from "zod"

// ---------------------------------------------------------------------------
// 1. Prompt Skim Result — output of the prompt-skim tool
// ---------------------------------------------------------------------------

/**
 * Result shape from the prompt-skim tool. Captures quantitative metrics
 * (word/token counts), structural markers (urls, paths), and qualitative
 * assessments (complexity, flooding risk) for triage decisions.
 */
export const PromptSkimResultSchema = z
  .object({
    word_count: z.number().int().nonnegative(),
    line_count: z.number().int().nonnegative(),
    token_estimate: z.number().int().nonnegative(),
    url_count: z.number().int().nonnegative(),
    urls: z.array(z.string().url()),
    path_count: z.number().int().nonnegative(),
    paths: z.array(
      z.object({
        path: z.string(),
        exists: z.boolean(),
      }),
    ),
    absolute_claim_count: z.number().int().nonnegative(),
    complexity_score: z.number().int().min(1).max(10),
    flooding_risk: z.enum(["low", "medium", "high"]),
    recommended_lanes: z.array(z.string()),
    verdict: z.enum(["simple", "complex", "unclear"]),
  })
  .strict()

export type PromptSkimResult = z.infer<typeof PromptSkimResultSchema>

// ---------------------------------------------------------------------------
// 2. Prompt Analysis — output of the prompt-analyze tool
// ---------------------------------------------------------------------------

/**
 * A single finding from prompt-analyze: a line-level issue with type,
 * severity, and an actionable suggestion.
 */
export const PromptAnalysisFindingSchema = z
  .object({
    line: z.number().int().positive(),
    text: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["absolute_claim", "vagueness", "missing_scope", "contradiction"]),
    severity: z.enum(["critical", "important", "minor"]),
    suggestion: z.string().min(1),
  })
  .strict()

export type PromptAnalysisFinding = z.infer<typeof PromptAnalysisFindingSchema>

/**
 * Aggregated result of prompt-analyze: collection of findings with
 * severity breakdown and overall clarity score.
 */
export const PromptAnalysisResultSchema = z
  .object({
    findings: z.array(PromptAnalysisFindingSchema),
    finding_count: z.number().int().nonnegative(),
    by_severity: z.object({
      critical: z.number(),
      important: z.number(),
      minor: z.number(),
    }),
    clarity_score: z.number().int().min(0).max(100),
  })
  .strict()

export type PromptAnalysisResult = z.infer<typeof PromptAnalysisResultSchema>

// ---------------------------------------------------------------------------
// 3. Context Budget Record — output of the context-budget tool
// ---------------------------------------------------------------------------

/**
 * Context budget snapshot: how much of the context window has been
 * consumed, compaction count, and risk assessment.
 */
export const ContextBudgetRecordSchema = z
  .object({
    budget_pct: z.number().min(0).max(100),
    compaction_count: z.number().int().nonnegative(),
    status: z.enum(["ok", "warning", "critical"]),
    remaining_estimate: z.number().int().nonnegative().optional(),
    risk_level: z.enum(["low", "medium", "high"]).optional(),
  })
  .strict()

export type ContextBudgetRecord = z.infer<typeof ContextBudgetRecordSchema>

// ---------------------------------------------------------------------------
// 4. Session Patch Record — output of the session-patch tool
// ---------------------------------------------------------------------------

/**
 * A single patch applied to the session state file. Tracks before/after
 * values, backup location, and application status.
 */
export const SessionPatchRecordSchema = z
  .object({
    section: z.string().min(1),
    old_value: z.string(),
    new_value: z.string().min(1),
    backup_path: z.string(),
    timestamp: z.string().datetime(),
    status: z.enum(["ok", "error"]),
    error: z.string().optional(),
  })
  .strict()

export type SessionPatchRecord = z.infer<typeof SessionPatchRecordSchema>

// ---------------------------------------------------------------------------
// 5. Enhanced Prompt Output — final pipeline output
// ---------------------------------------------------------------------------

/**
 * The final output contract for the prompt-enhance pipeline. Combines
 * YAML frontmatter metadata with the XML body content.
 */
export const EnhancedPromptOutputSchema = z
  .object({
    frontmatter: z.object({
      version: z.string(),
      enhanced_at: z.string().datetime(),
      complexity_before: z.number().int().min(1).max(10),
      complexity_after: z.number().int().min(1).max(10),
      confidence: z.number().min(0).max(1),
      phases_completed: z.array(z.string()),
      warnings: z.array(z.string()).optional(),
    }),
    body_xml: z.string().min(1),
  })
  .strict()

export type EnhancedPromptOutput = z.infer<typeof EnhancedPromptOutputSchema>

// ---------------------------------------------------------------------------
// 6. Pipeline State — tracks execution progress across phases
// ---------------------------------------------------------------------------

/**
 * Tracks pipeline execution state: current phase, accumulated results,
 * blockers, and readiness to advance.
 */
export const PipelineStateSchema = z
  .object({
    current_phase: z.enum([
      "skim",
      "bridge",
      "investigation",
      "clarification",
      "repackage",
      "report",
    ]),
    phase_results: z.array(z.unknown()),
    blockers: z.array(z.string()),
    ready_for_next_phase: z.boolean(),
    session_id: z.string(),
    started_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict()

export type PipelineState = z.infer<typeof PipelineStateSchema>
