/**
 * Intent-lock gate — shared types, error classes, and runtime config defaults.
 *
 * The gate enforces a 4-step locked flow at the tool execution layer (see
 * `27.1-SPEC.md` §2). This file holds the data shapes consumed by the state
 * machine, the dual-layer store, and (in plan 02/03) the verify-step functions
 * and hook.
 *
 * Per `src/AGENTS.md` "Error Handling" rules, all thrown errors are subclasses
 * of `Error` and carry the `[Hivemind]` prefix for grep-ability.
 */

/**
 * 7-state lifecycle for a root session's intent-lock gate.
 *
 * State progression:
 * - `UNLOCKED` — entry state. No intent declared.
 * - `LOCKED_NON_CODE` — non-code intent declared (terminal for non-code work).
 * - `LOCKED_CODE_CHANGE` — code-change intent declared, awaiting Step 2.
 * - `PHASE_READY` — landscape artifact committed, awaiting Step 3.
 * - `PHASE_AUTHORIZED` — ROADMAP/STATE synced, awaiting Step 4.
 * - `EXECUTING` — phase manifest committed, full toolkit unlocked.
 * - `COMPLETED` — gate finished for this intent.
 */
export enum IntentState {
  UNLOCKED = "UNLOCKED",
  LOCKED_NON_CODE = "LOCKED_NON_CODE",
  LOCKED_CODE_CHANGE = "LOCKED_CODE_CHANGE",
  PHASE_READY = "PHASE_READY",
  PHASE_AUTHORIZED = "PHASE_AUTHORIZED",
  EXECUTING = "EXECUTING",
  COMPLETED = "COMPLETED",
}

/**
 * History entry for a single state transition.
 */
export interface IntentLockHistoryEntry {
  /** Source state before the transition. */
  from: IntentState
  /** Destination state after the transition. */
  to: IntentState
  /** Epoch milliseconds when the transition was applied. */
  at: number
  /** Optional commit hash that introduced the artifact driving this transition. */
  commitHash?: string
  /**
   * Worktree path for this transition (D-05).
   * Default `"main"` for backward compat with P27.1 entries.
   */
  worktree?: string
  /**
   * Trajectory ID if this transition created or modified a trajectory
   * (REQ-9).
   */
  trajectoryId?: string
}

/**
 * Structured guidance attached to every `IntentLockBlockedError` (AC-38, AC-48).
 *
 * Exposes the four canonical fields as typed properties so callers (agents,
 * toast handlers, the `hm-intent-checkpoint` tool) can read the required
 * evidence and suggested next steps WITHOUT parsing the error message string.
 */
export interface IntentLockGuidance {
  /** Human-readable description of the current gate state. */
  currentState: string
  /** What evidence the agent must provide to advance. */
  requiredEvidence: string[]
  /** Concrete next steps the agent should take. */
  suggestedActions: string[]
  /** Human-readable explanation of the current checkpoint. */
  checkpointDescription: string
  /** Actionable fix steps (1-indexed enumerated list). */
  fixSteps?: string[]
  /** Tool or evidence reference that unlocks the next step. */
  hint?: string
}

/**
 * Runtime state object persisted by the dual-layer store.
 */
export interface IntentLockState {
  checkpointEvidence?: Record<string, string[]>
  sessionId: string
  state: IntentState
  intentId?: string
  phaseId?: string
  isCodeChange?: boolean
  summary?: string
  allowedSurfaces?: string[]
  lastTransitionAt: number
  history: IntentLockHistoryEntry[]
  /**
   * Trajectory ID for the current phase (REQ-9).
   * Set when SL-2 → SL-3 transition creates a trajectory.
   */
  trajectoryId?: string
  /**
   * Session ID of the session from which this state was inherited (D-01).
   * Set when CONTINUITY "Resume" is chosen.
   */
  inheritedFrom?: string
}

/**
 * Context passed to `resolveToolPermission` (plan 02).
 */
export interface SessionContext {
  sessionId: string
  projectRoot: string
  classificationKind: "root" | "child" | "unknownSub"
  /** Undefined when the gate is disabled for this session. */
  intentLockState?: IntentLockState
}

/**
 * Decision returned by `resolveToolPermission` (plan 02).
 */
export interface ToolDecision {
  allowed: boolean
  reason: string
  nextCommand?: string
  alternatives?: string[]
}

/**
 * Hardcoded runtime config for the intent-lock gate.
 */
export interface IntentLockConfig {
  /** Master toggle read from `.hivemind/configs.json`. */
  enabled: boolean
  /** Purposes that require the full 4-step code-change gate. */
  codeChangePurposes: readonly ["implementation", "tdd", "course-correction"]
  /** Purposes that skip the gate at `LOCKED_NON_CODE` (terminal). */
  nonCodeChangePurposes: readonly [
    "research",
    "brainstorming",
    "discovery",
    "planning",
    "gatekeeping",
  ]
  bashModerateBlocklist: readonly string[]
  /** When true, resumed sessions inherit their previous intent-lock state. */
  resumeInheritsLock: boolean
  /** When true, only one main session can occupy `PHASE_READY` per phase. */
  parallelMainSessionIsolation: boolean
  /** When true, surface a resume toast to the user on session restore. */
  notifyResume: boolean
  /** Block message template identifier. v1 ships only `"guided"`. */
  blockMessageTemplate: "guided"
}

/**
 * Runtime source of truth for hardcoded intent-lock config defaults.
 */
export const DEFAULT_INTENT_LOCK_CONFIG: IntentLockConfig = {
  enabled: false,
  codeChangePurposes: ["implementation", "tdd", "course-correction"],
  nonCodeChangePurposes: ["research", "brainstorming", "discovery", "planning", "gatekeeping"],
  bashModerateBlocklist: [">", ">>", "sed -i", "tee ", "rm -rf", "mv ", "chmod "],
  resumeInheritsLock: true,
  parallelMainSessionIsolation: true,
  notifyResume: true,
  blockMessageTemplate: "guided",
}

/**
 * Read-only hm-* agents allowed for `task` delegation at SL-1/SL-2.
 *
 * Per P27.2 surface allowlist: these agents explore, research, analyze,
 * and clarify intent. Agents NOT in this list (hm-executor, hm-planner,
 * etc.) require SL-3+ (phase authorized) to execute.
 */
export const ALLOWED_READ_ONLY_AGENTS = [
  "hm-intent-loop",
  "hm-codebase-mapper",
  "hm-pattern-mapper",
  "hm-phase-researcher",
  "hm-project-researcher",
  "hm-platform-references",
  "hm-ecologist",
] as const satisfies readonly string[]

/** Agent name extracted from `ALLOWED_READ_ONLY_AGENTS`. */
export type AllowedReadOnlyAgent = typeof ALLOWED_READ_ONLY_AGENTS[number]

/**
 * Thrown when a tool call is blocked by the intent-lock gate.
 */
export class IntentLockBlockedError extends Error {
  public readonly toolName: string
  public readonly currentState: IntentState
  public readonly phaseId?: string
  public readonly intentLockRef?: string
  public readonly nextCommand?: string
  public readonly alternatives: string[]
  public readonly reason: string
  public readonly softStart?: boolean
  public readonly guidance: IntentLockGuidance

  constructor(params: {
    toolName: string
    currentState: IntentState
    phaseId?: string
    intentLockRef?: string
    nextCommand?: string
    alternatives?: string[]
    reason: string
    softStart?: boolean
    guidance: IntentLockGuidance
  }) {
    const blockMessage = IntentLockBlockedError.formatBlockMessage({
      toolName: params.toolName,
      currentState: params.currentState,
      phaseId: params.phaseId,
      intentLockRef: params.intentLockRef,
      nextCommand: params.nextCommand,
      alternatives: params.alternatives ?? [],
      reason: params.reason,
      guidance: params.guidance,
    })
    super(blockMessage)
    this.name = "IntentLockBlockedError"
    this.toolName = params.toolName
    this.currentState = params.currentState
    this.phaseId = params.phaseId
    this.intentLockRef = params.intentLockRef
    this.nextCommand = params.nextCommand
    this.alternatives = params.alternatives ?? []
    this.reason = params.reason
    this.softStart = params.softStart
    this.guidance = params.guidance
  }

  /**
   * Format the guided block message per P27.2 error feedback pattern.
   *
   * Produces the 4-field pattern: State / Reason / Fix / Hint.
   * - State:  currentState — one-line why blocked
   * - Reason: 2-3 sentence explanation
   * - Fix:    1. action → 2. action → 3. action
   * - Hint:   tool or evidence that unlocks the next step
   */
  static formatBlockMessage(p: {
    toolName: string
    currentState: IntentState
    phaseId?: string
    intentLockRef?: string
    nextCommand?: string
    alternatives: string[]
    reason: string
    guidance?: IntentLockGuidance
  }): string {
    const stateStr = p.guidance?.currentState ?? String(p.currentState)
    const lines: string[] = [
      `[Hivemind] ${p.toolName} blocked.`,
      `State:  ${stateStr} — ${p.reason}`,
      `Reason: Tool '${p.toolName}' blocked in state ${stateStr}.`,
    ]

    // Only add phase/intent context when available
    if (p.phaseId || p.intentLockRef) {
      const parts: string[] = []
      if (p.phaseId) parts.push(`Phase: ${p.phaseId}`)
      if (p.intentLockRef) parts.push(`Intent: ${p.intentLockRef}`)
      lines[2] = `Reason: Tool '${p.toolName}' blocked in state ${stateStr}. ${parts.join(". ")}.`
    }

    // Fix steps from guidance or fallback
    const fixSteps = p.guidance?.fixSteps
    if (fixSteps && fixSteps.length > 0) {
      lines.push(`Fix:    ${fixSteps[0]}`)
      for (let i = 1; i < fixSteps.length; i++) {
        lines.push(`        ${fixSteps[i]}`)
      }
    } else {
      lines.push(`Fix:    1. ${p.nextCommand ?? "complete current step"}`)
    }

    // Hint
    lines.push(`Hint:   ${p.guidance?.hint ?? "Provide required evidence to advance the gate state."}`)

    return "```\n" + lines.join("\n") + "\n```"
  }
}

/**
 * Thrown when a `.planning/intent-locks/{intentId}.md` artifact fails Zod parse.
 */
export class IntentLockSchemaError extends Error {
  public readonly artifactPath: string
  public readonly issues: string[]

  constructor(params: { artifactPath: string; issues: string[] }) {
    super(`[Hivemind] IntentLock schema validation failed: ${params.artifactPath} — ${params.issues.join("; ")}`)
    this.name = "IntentLockSchemaError"
    this.artifactPath = params.artifactPath
    this.issues = params.issues
  }
}

/**
 * Thrown when a state-machine transition is invalid.
 */
export class IntentLockStateTransitionError extends Error {
  public readonly from: IntentState
  public readonly to: IntentState
  public readonly sessionId: string

  constructor(params: { from: IntentState; to: IntentState; sessionId: string }) {
    super(
      `[Hivemind] invalid intent-lock transition: ${params.from}→${params.to} (session ${params.sessionId})`,
    )
    this.name = "IntentLockStateTransitionError"
    this.from = params.from
    this.to = params.to
    this.sessionId = params.sessionId
  }
}

/**
 * Thrown when a session has no intent-lock state and one is required.
 */
export class IntentLockNotFoundError extends Error {
  public readonly sessionId: string

  constructor(params: { sessionId: string }) {
    super(`[Hivemind] intent-lock state not found for session ${params.sessionId}`)
    this.name = "IntentLockNotFoundError"
    this.sessionId = params.sessionId
  }
}

/**
 * Thrown when a precondition is violated (P27.2 T18, REQ-22).
 *
 * Used by `completeIntentWithUnblock` to enforce D-02 Layer 2 precondition:
 * gate must be disabled (enabled: false) before completing the intent.
 */
export class HarnessStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HarnessStateError"
  }
}
