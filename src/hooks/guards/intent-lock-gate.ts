/**
 * Intent-lock gate hook factory — Step 1.7 in the `tool.execute.before` chain.
 *
 * Wires between session-tracker (Step 1.5) and contract enforcement (Step 2).
 * Follows the D-23 hard block pattern from `contract-enforcement.ts`:
 * throws `IntentLockBlockedError` on violation, never swallows.
 *
 * Fast paths (skip all state lookups):
 * 1. Gate disabled (`enabled: false`) — immediate return.
 * 2. Read-only tools (`read`/`glob`/`grep`) — immediate return.
 * 3. Non-root sessions (child/unknownSub) — immediate return.
 *
 * @see 27.1-SPEC.md §9 for wire order, §11 for block message format
 */

import { existsSync } from "node:fs"

import {
  IntentLockBlockedError,
  IntentState,
  type IntentLockGuidance,
  type IntentLockState,
} from "../../features/intent-lock/types.js"
import {
  en as enErrorTemplates,
  vi as viErrorTemplates,
} from "../../features/intent-lock/locales/error-templates.js"
import { READ_ONLY_TOOLS, resolveToolPermission } from "../../features/intent-lock/tool-resolver.js"
import {
  type ResumeDeps,
  resolveContinuedSession,
} from "../../features/intent-lock/resume.js"
import { getIntentLockFilePath } from "../../features/intent-lock/store.js"
import { runSessionStartFlow, isContinuityExplicit } from "../../features/intent-lock/session-start.js"
import { sessionStartObserved } from "../../hooks/handlers/session-start.js"
import { isPathAllowed, extractFilePaths } from "../../hooks/transforms/contract-enforcement.js"
import type { ClassificationResult } from "../../features/session-tracker/classification.js"

/** Sessions that have already received a soft-start warning. */
const softStartIssued = new Set<string>()

/**
 * Sessions that have requested a question-based override (D-04).
 * When added, the gate bypasses all checks for these sessions.
 */
const sessionOverrideRequested = new Set<string>()

/**
 * Register a session for question-based override (D-04).
 * Once added, the gate allows all tool calls for that session.
 *
 * @param sessionId - The session to override.
 */
export function addSessionOverride(sessionId: string): void {
  sessionOverrideRequested.add(sessionId)
}

/**
 * State-to-guidance map (AC-38, AC-39).
 *
 * Each gated state maps to the structured guidance that the hook attaches
 * to the `IntentLockBlockedError` it throws. The `currentState` field is
 * injected at the call site; the rest is keyed by `IntentState` here.
 *
 * Adding a new gated state? Add an entry below — the gate emits a sensible
 * fallback if you forget, but state-specific guidance gives the agent the
 * best chance of self-recovery.
 */
const GATE_GUIDANCE_MAP: Partial<Record<IntentState, Omit<IntentLockGuidance, "currentState">>> = {
  [IntentState.UNLOCKED]: {
    requiredEvidence: [
      "Phase identifier (e.g., P27-routing)",
      "Purpose of the intent",
    ],
    suggestedActions: [
      "Call hm-intent-checkpoint with action='submit' and checkpoint='intent_locked' to declare intent",
      "Provide evidence: the phase ID and purpose of the intent",
      "After submission, state auto-advances to LOCKED_CODE_CHANGE for code-change intents",
      "If stuck, use the question tool to request a gate override from the user",
    ],
    checkpointDescription:
      "No intent declared. Lock the session to a specific phase and purpose before making code changes.",
  },
  [IntentState.LOCKED_CODE_CHANGE]: {
    requiredEvidence: [
      "Committed landscape artifact",
      "Phase ROADMAP/STATE alignment",
    ],
    suggestedActions: [
      "Run hm-phase-researcher to gather landscape",
      "Commit landscape artifact",
      "Call hm-intent-checkpoint tool with action='submit' to provide evidence",
    ],
    checkpointDescription:
      "Intent declared and locked. Provide landscape evidence and phase readiness artifacts.",
  },
  [IntentState.PHASE_READY]: {
    requiredEvidence: ["ROADMAP.md sync", "STATE.md sync"],
    suggestedActions: [
      "Sync ROADMAP.md with phase plan",
      "Update STATE.md to reflect active phase",
      "Call hm-intent-checkpoint tool with action='submit' to provide evidence",
    ],
    checkpointDescription:
      "Landscape committed. Sync planning documents to authorize execution.",
  },
  [IntentState.PHASE_AUTHORIZED]: {
    requiredEvidence: ["Committed phase manifest"],
    suggestedActions: [
      "Commit phase manifest artifact",
      "Verify manifest references correct phase",
      "Call hm-intent-checkpoint tool with action='submit' to provide evidence",
    ],
    checkpointDescription:
      "Phase authorized. Commit the manifest to unlock full toolkit.",
  },
  [IntentState.EXECUTING]: {
    requiredEvidence: ["Verification evidence", "Test results"],
    suggestedActions: [
      "Run test suite",
      "Collect verification artifacts",
      "Call hm-intent-checkpoint tool with action='confirm' for user confirmation at critical transitions",
    ],
    checkpointDescription:
      "Execution in progress. Gather verification evidence before transitioning to SHIPPED.",
  },
}

/**
 * Resolve locale from gate deps or fallback to English.
 * Returns "en" or "vi" based on an optional config parameter.
 *
 * @param config - Optional config with conversation_language field.
 * @returns The resolved locale, defaulting to "en".
 */
export function resolveLocaleForGate(config?: { conversation_language?: string }): "en" | "vi" {
  if (config?.conversation_language === "vi") return "vi"
  return "en"
}

/**
 * Build locale-keyed guidance using error templates (T24).
 *
 * Falls back to the hardcoded GATE_GUIDANCE_MAP when no locale
 * template exists for the given state.
 */
function buildGateGuidance(state: IntentState, localeConfig?: { conversation_language?: string }): IntentLockGuidance {
  const locale = resolveLocaleForGate(localeConfig)
  const templateMap = locale === "vi" ? viErrorTemplates : enErrorTemplates
  const template = templateMap[state]

  if (template) {
    return {
      // currentState MUST be the enum value string (tests verify exact match).
      currentState: state,
      requiredEvidence: GATE_GUIDANCE_MAP[state]?.requiredEvidence ?? ["Complete current step"],
      suggestedActions: [
        template.fix,
        ...(GATE_GUIDANCE_MAP[state]?.suggestedActions ?? []),
      ],
      // Use the locale-keyed reason as the human-readable description.
      checkpointDescription: template.reason,
      fixSteps: template.fix.split("\n"),
      hint: template.hint,
    }
  }

  // Fallback to the in-code guidance map for unknown states.
  const data = GATE_GUIDANCE_MAP[state]
  if (data) {
    return { currentState: state, ...data }
  }
  return {
    currentState: String(state),
    requiredEvidence: ["Complete current step"],
    suggestedActions: ["Follow guided recovery in error message"],
    checkpointDescription: `Gate is in state ${state}.`,
  }
}

/**
 * Clear the soft-start tracking set.
 *
 * Test-isolation helper so test cases don't leak state into each other.
 */
export function resetSoftStartTracking(): void {
  softStartIssued.clear()
}

/**
 * Dependencies injected from `plugin.ts` at composition time.
 *
 * All I/O is behind function interfaces so the hook is pure-unit testable
 * without real filesystem, git, or SDK.
 */
export interface IntentLockGateDeps {
  /** Project root directory. */
  projectRoot: string
  /** Read the current intent_lock config. Returns `{ enabled: boolean }` and optional conversation_language. */
  getConfig: () => { enabled: boolean; conversation_language?: string }
  /** Read the current intent-lock state for a session. Returns `undefined` when no state file exists. */
  readIntentLockState: (
    projectRoot: string,
    sessionId: string,
  ) => { state: IntentState; phaseId?: string; intentId?: string; summary?: string } | undefined
  /** Session classifier for root/child check. */
  classifier: {
    classify(sessionID: string, getSessionSafely: (id: string) => Promise<unknown>): Promise<ClassificationResult>
  }
  /** Async function to fetch a session from SDK. Used by classifier. */
  getSessionSafely: (id: string) => Promise<unknown>
  /** Check if a state file exists on disk for the given session. Defaults to real `existsSync`. */
  stateFileExists?: (projectRoot: string, sessionId: string) => boolean
  /** Read a session-scoped override file. If present with disabled: true, bypass ALL checks. */
  readSessionOverride?: (
    projectRoot: string,
    sessionId: string,
  ) => { disabled: boolean; createdAt: number } | undefined
  /** Optional logging callback for non-critical failures. */
  logWarn?: (message: string, error?: unknown) => void
}

/**
 * Creates the intent-lock gate hook for the `tool.execute.before` chain.
 *
 * Per SPEC §9.3: read-only tools bypass the gate entirely.
 * Per SPEC §4.3 Check 1: child sessions are NEVER gated.
 * Per D-23: throws `IntentLockBlockedError` on violation — never swallows.
 *
 * @param deps - Typed dependencies injected from plugin.ts.
 * @returns An async hook function receiving `(input, output)`.
 */
export function createIntentLockGateHook(
  deps: IntentLockGateDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input: unknown, output: unknown) => {
    // Fast path 1: gate disabled — single line, no I/O
    const config = deps.getConfig()
    const localeConfig = { conversation_language: config.conversation_language }
    if (!config.enabled) return

    // D-02 Layer 2 advisory: log when enabled === true (REQ-22 violation).
    // This is advisory only — the gate still proceeds for backward compat
    // with test setups that use enabled: true.
    if (config.enabled === true) {
      console.warn("[Hivemind] config violation: intent_lock.enabled === true (expected false per P27.2-SPEC). See REQ-22.")
    }

    // Extract tool name and session ID using defensive cast (Pitfall 6)
    const inputRecord = input as Record<string, unknown>
    const toolName = inputRecord.tool as string
    const sessionID = (inputRecord.sessionID as string) || ""

    // Session override: if active, bypass ALL checks (same as enabled: false)
    const override = deps.readSessionOverride?.(deps.projectRoot, sessionID)
    if (override?.disabled) return

    // Fast path 2: read-only tools bypass the gate entirely (SPEC §9.3)
    if (READ_ONLY_TOOLS.has(toolName)) return

    // Layer 0: session kind check — child sessions are NEVER gated (SPEC §4.3)
    const classification = await deps.classifier.classify(sessionID, deps.getSessionSafely)
    if (classification.kind !== "root") return

    // P27.2 T7: PostToolUse proxy fallback (D-11).
    // If the session.created event handler hasn't fired for this session,
    // run the session-start flow inline on the first blockable tool call.
    // This covers SDK-created sessions that may not fire the event.
    if (!sessionStartObserved.has(sessionID)) {
      sessionStartObserved.add(sessionID)
      runSessionStartFlow(deps.projectRoot, sessionID)
    }

    // State lookup — no state file on disk means no gate (session not yet locked)
    // The store always returns a default UNLOCKED object, so we check disk
    // independently to detect truly fresh sessions.
    const hasStateFile = deps.stateFileExists
      ? deps.stateFileExists(deps.projectRoot, sessionID)
      : existsSync(getIntentLockFilePath(deps.projectRoot, sessionID))
    if (!hasStateFile) return

    const rawState = deps.readIntentLockState(deps.projectRoot, sessionID)
    if (!rawState) return

    // Build the IntentLockState shape expected by resolveToolPermission
    const intentLockState: IntentLockState = {
      sessionId: sessionID,
      state: rawState.state,
      phaseId: rawState.phaseId,
      intentId: rawState.intentId,
      summary: rawState.summary,
      lastTransitionAt: 0,
      history: [],
    }

    // Build SessionContext for the resolver
    const sessionContext = {
      sessionId: sessionID,
      projectRoot: deps.projectRoot,
      classificationKind: classification.kind as "root",
      intentLockState,
    }

    // P27.2 T16: allowedSurfaces enforcement for EXECUTING state.
    // When the session is EXECUTING with a non-empty allowedSurfaces list,
    // check the tool's file paths against the allowed surfaces.
    const surfaces: string[] | undefined = (rawState as Record<string, unknown>).allowedSurfaces as string[] | undefined
    if (rawState.state === IntentState.EXECUTING && surfaces?.length) {
      const outputRecord = output as Record<string, unknown> | undefined
      const paths = extractFilePaths(toolName, outputRecord?.args)
      for (const filePath of paths) {
        if (!isPathAllowed(filePath, surfaces)) {
          throw new IntentLockBlockedError({
            toolName,
            currentState: rawState.state,
            phaseId: rawState.phaseId,
            intentLockRef: rawState.intentId,
            nextCommand: "stay within allowed surfaces: " + surfaces.join(", "),
            alternatives: [],
            reason: `Path ${filePath} outside allowed surfaces ${JSON.stringify(surfaces)}`,
            guidance: buildGateGuidance(rawState.state, localeConfig),
          })
        }
      }
    }

    // Resolve tool permission against the state machine matrix
    const outputRecord = output as Record<string, unknown> | undefined
    const args = (outputRecord?.args ?? {}) as Record<string, unknown>
    const decision = await resolveToolPermission(toolName, args, sessionContext)

    // If allowed, return — tool invocation proceeds
    if (decision.allowed) return

    // D-04: question-based override — bypass all checks for overridden sessions
    if (sessionOverrideRequested.has(sessionID)) {
      return
    }

    // D-05: --bypass-gate flag for execute-slash-command
    if (toolName === "execute-slash-command") {
      const commandArgs =
        (outputRecord?.args ?? {}) as Record<string, unknown>
      if (typeof commandArgs.command === "string" && commandArgs.command.includes("--bypass-gate")) {
        return
      }
    }

    // Soft-start: first block in a fresh UNLOCKED session gets a guided warning
    // P27.2 T11 (D-15): skip the soft-start when the user explicitly chose
    // "Resume" — they already know the gate is active. TIMEOUT-default
    // "Resume" applies soft-start normally.
    const isSoftStart = rawState.state === IntentState.UNLOCKED
      && !softStartIssued.has(sessionID)
      && !isContinuityExplicit(sessionID)
    if (isSoftStart) {
      softStartIssued.add(sessionID)
    }

    // D-23 hard block: throw with guided recovery message (SPEC §11)
    // Build structured guidance from the state-to-guidance map (AC-38, AC-39)
    const guidance = buildGateGuidance(rawState.state, localeConfig)

    throw new IntentLockBlockedError({
      toolName,
      currentState: rawState.state,
      phaseId: rawState.phaseId,
      intentLockRef: rawState.intentId,
      nextCommand: isSoftStart ? "hm-spec-phase" : decision.nextCommand,
      alternatives: decision.alternatives ?? [],
      reason: decision.reason,
      softStart: isSoftStart || undefined,
      guidance,
    })
  }
}

/**
 * Parameters for `startSessionGate` — the per-session bootstrap entry.
 *
 * The `resumeDeps` are injected so the hook can be unit-tested without
 * a real continuity store. Production wiring (in `plugin.ts`) injects
 * the real `readContinuityStore` reader and the real
 * `upsertIntentLockState` writer.
 */
export interface StartSessionGateParams {
  /** Trusted project root. */
  projectRoot: string
  /** Session identifier for the new session being bootstrapped. */
  newSessionId: string
  /** Dependencies consumed by `resolveContinuedSession` (see `resume.ts`). */
  resumeDeps: ResumeDeps
}

/**
 * Bootstrap a new root session by inheriting its intent-lock state from
 * the most recent prior root session (SPEC §10).
 *
 * Wires `resume.ts` into the public gate API so `plugin.ts` can call
 * this once per session start. The function delegates to
 * `resolveContinuedSession`, which:
 * - Skips inheritance when the most recent root has `kind: "unknownSub"`.
 * - Only inherits states in `[LOCKED_CODE_CHANGE, EXECUTING]`.
 * - Best-effort fires a toast when `notifyResume` is enabled.
 *
 * @param params - Per-call parameters (see {@link StartSessionGateParams}).
 * @returns The result of `resolveContinuedSession` so callers can log
 *   inheritance for observability.
 */
export async function startSessionGate(
  params: StartSessionGateParams,
): Promise<{ state: IntentState; inheritedFrom?: string }> {
  return await resolveContinuedSession(params.newSessionId, params.projectRoot, params.resumeDeps)
}
