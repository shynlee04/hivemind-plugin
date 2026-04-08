/**
 * Execution-mode classifier — hybrid execution-family and built-in submode
 * classification for delegated tasks.
 *
 * RESEARCH D-12: Auto-detect execution family (visible-worker vs built-in)
 * based on task characteristics and runtime capabilities.
 *
 * RESEARCH D-13: Within built-in family, auto-detect submode between OpenCode
 * sub-session (interactive) and owned-process stdio (research/headless).
 *
 * RESEARCH D-16: OpenCode-native sessions remain the primary built-in path;
 * owned-process execution only fills the gap for headless/research work.
 *
 * Threat mitigations:
 *  - T-02-04: Classifier rationale and chosen path are recorded in returned
 *    metadata for parent verification (repudiation).
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Characteristics of a task that influence execution-family selection. */
export type TaskCharacteristics = {
  /** Whether the task can run in parallel with other independent tasks. */
  isParallel: boolean
  /** Whether the task requires interactive tool use (edits, file ops). */
  isInteractive: boolean
  /** Whether the task is a read-only research/investigation task. */
  isResearch: boolean
  /** Whether the task runs in a headless/non-interactive context. */
  isHeadless: boolean
  /** Whether the caller explicitly requested background execution. */
  runInBackground: boolean
}

/** Runtime environment capabilities probed by the classifier. */
export type RuntimeCapabilities = {
  /** Whether tmux is available in the execution environment. */
  hasTmux: boolean
  /** Project root directory (used for cwd constraints). */
  projectRoot: string
}

/** The execution family chosen by the classifier. */
export type ExecutionFamily = "visible-worker" | "built-in"

/** The submode within a chosen execution family. */
export type ExecutionSubmode =
  | "tmux-pane"
  | "builtin-subsession"
  | "builtin-process"

/** Snapshot of capability evidence for audit/recovery context. */
export type CapabilityEvidence = {
  hasTmux: boolean
  projectRoot: string
}

/** The full classification result returned to callers. */
export type ExecutionModeResult = {
  /** The chosen execution family. */
  family: ExecutionFamily
  /** The submode within the chosen family. */
  submode: ExecutionSubmode
  /** Human-readable rationale for the classification decision. */
  rationale: string
  /** The task characteristics that drove the decision. */
  characteristics: TaskCharacteristics
  /** Snapshot of runtime capabilities for auditing. */
  capabilityEvidence: CapabilityEvidence
}

// ---------------------------------------------------------------------------
// Default allowed commands (aligned with schema draft security section)
// ---------------------------------------------------------------------------

/**
 * Commands allowed for owned-process execution.
 *
 * Aligns with `security.allowed_background_commands` from the runtime config
 * schema draft: node, npm, npx, pnpm, vitest.
 */
export const DEFAULT_ALLOWED_COMMANDS: readonly string[] = [
  "node",
  "npm",
  "npx",
  "pnpm",
  "vitest",
] as const

// ---------------------------------------------------------------------------
// classifyExecutionMode — top-level classifier (RESEARCH D-12)
// ---------------------------------------------------------------------------

/**
 * Classify the execution mode for a delegated task based on its
 * characteristics and the current runtime capabilities.
 *
 * Decision logic:
 *  1. If task is parallel + background AND tmux is available → visible-worker
 *  2. Otherwise → built-in (with submode resolved by resolveBuiltInMode)
 *
 * The classifier always records why it chose or fell back, so parent sessions
 * can audit the decision (threat T-02-04).
 */
export function classifyExecutionMode(
  characteristics: TaskCharacteristics,
  capabilities: RuntimeCapabilities,
): ExecutionModeResult {
  const capabilityEvidence: CapabilityEvidence = {
    hasTmux: capabilities.hasTmux,
    projectRoot: capabilities.projectRoot,
  }

  // D-12: Parallel + background + tmux available → visible-worker family
  if (characteristics.isParallel && characteristics.runInBackground && capabilities.hasTmux) {
    return {
      family: "visible-worker",
      submode: "tmux-pane",
      rationale: `Parallel background task with tmux available: selected visible-worker family (tmux-pane).`,
      characteristics,
      capabilityEvidence,
    }
  }

  // D-12 fallback: no tmux for parallel task → built-in with rationale
  if (characteristics.isParallel && characteristics.runInBackground && !capabilities.hasTmux) {
    const builtIn = resolveBuiltInMode(characteristics)
    return {
      family: "built-in",
      submode: builtIn.submode,
      rationale: `Parallel background task but tmux unavailable: fallback to built-in family (${builtIn.submode}). ${builtIn.rationale}`,
      characteristics,
      capabilityEvidence,
    }
  }

  // Default: built-in family (D-13 submode auto-detection)
  const builtIn = resolveBuiltInMode(characteristics)
  return {
    family: "built-in",
    submode: builtIn.submode,
    rationale: `Non-parallel task: built-in family (${builtIn.submode}). ${builtIn.rationale}`,
    characteristics,
    capabilityEvidence,
  }
}

// ---------------------------------------------------------------------------
// resolveBuiltInMode — submode auto-detection (RESEARCH D-13)
// ---------------------------------------------------------------------------

/**
 * Within the built-in family, resolve which submode to use.
 *
 * Decision logic:
 *  - isInteractive → builtin-subsession (OpenCode child session)
 *  - isResearch or isHeadless → builtin-process (owned-process stdio)
 *  - default → builtin-subsession (D-16: prefer OpenCode sessions)
 *
 * @returns The chosen submode and a rationale string.
 */
export function resolveBuiltInMode(
  characteristics: TaskCharacteristics,
): { submode: ExecutionSubmode; rationale: string } {
  // D-13: Interactive tasks need OpenCode child sessions (D-16 preference)
  if (characteristics.isInteractive) {
    return {
      submode: "builtin-subsession",
      rationale: "Interactive task requires OpenCode child session for tool access.",
    }
  }

  // D-13: Research/headless tasks use owned-process stdio
  if (characteristics.isResearch) {
    return {
      submode: "builtin-process",
      rationale: "Research task: owned-process stdio is sufficient (read-only work).",
    }
  }

  if (characteristics.isHeadless) {
    return {
      submode: "builtin-process",
      rationale: "Headless task: owned-process stdio for non-interactive execution.",
    }
  }

  // D-16 default: prefer OpenCode sessions where they already fit the task
  return {
    submode: "builtin-subsession",
    rationale: "Default: OpenCode child session preferred for general delegation.",
  }
}
