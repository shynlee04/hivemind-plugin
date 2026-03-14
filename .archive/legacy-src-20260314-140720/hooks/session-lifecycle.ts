/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Consolidated from: session-lifecycle.ts + onboarding.ts
 * Date: 2026-03-12
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped via the shared per-turn injection ledger
 *   - Handles stale session auto-archival
 *   - Onboarding: brownfield detection, read-first block, clean-session detection
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import { existsSync } from "node:fs"
import { readdir } from "fs/promises"
import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import { createBrainState, generateSessionId } from "../schemas/brain-state.js"
import type { BrainState } from "../schemas/brain-state.js"
import {
  clearTurnInjectionLedger,
  createTurnInjectionKey,
  createTurnInjectionLedger,
  detectInjectionPresence,
  getTurnInjectionLedger,
  reserveInjectionBudget,
} from "../lib/injection-orchestrator.js"
import {
  computeSharedInjectionCapChars,
  estimateContextWindowChars,
} from "../lib/budget.js"
import { resolveRuntimeSessionLineage } from "../lib/runtime-session-lineage.js"

import { isSessionStale } from "../lib/staleness.js"
import { archiveSession, readActiveMd, resetActiveMd, updateIndexMd } from "../lib/planning-fs.js"
import { createTree, saveTree } from "../lib/hierarchy-tree.js"
import { buildGovernanceSignals } from "../lib/session-governance.js"
import {
  generateBootstrapBlock,
  generateEvidenceDisciplineBlock,
  generateSetupGuidanceBlock,
  generateTeamBehaviorBlock,
  compileFirstTurnContext,
  generateFirstTurnConfirmationBlock,
  getV29OutputStyleDirective,
  getNextStepHint,
} from "./session-lifecycle-helpers.js"
import { compileDefaultGovernance, GOVERNANCE_MARKER, STATE_BOOTSTRAP_STOP_DIRECTIVE } from "../lib/governance-instruction.js"
import { evaluateEntityChecklist, renderChecklistSummary } from "../lib/entity-checklist.js"
import type { EntityChecklist } from "../schemas/governance-constitution.js"
import { applyPendingStateMutations, queueStateMutation } from "../lib/state-mutation-queue.js"
import { dedupeContextLines } from "../lib/context-purifier.js"
import { shouldSuppressHumanFacingGovernance } from "../lib/session-role.js"
import { resolveSkillsForIntent, type SkillLoadContext } from "../lib/skill-loader.js"

/**
 * Inject HiveMaster strict governance instruction (prepends, deduplicated)
 */
async function injectGovernanceInstruction(
  output: { system: string[]; messages?: unknown[] },
  directory: string,
  sessionId: string,
): Promise<EntityChecklist | undefined> {
  // Shared channel-detection contract (system/message/plugin) for dedupe.
  const presence = detectInjectionPresence({
    system: output.system,
    messages: output.messages,
  })
  const alreadyInjected = presence.core_system
    || presence.core_message
    || output.system.some(s => s.includes(GOVERNANCE_MARKER))
  if (alreadyInjected) {
    return undefined
  }

  let checklist: EntityChecklist | undefined
  try {
    checklist = await evaluateEntityChecklist(directory, sessionId, `turn-${Date.now()}`)
  } catch {
    // Checklist evaluation failure is non-fatal; compile without it
  }

  const compiled = compileDefaultGovernance(checklist)
  output.system.unshift(compiled)
  return checklist
}

function appendChecklistFailureReminder(output: { system: string[] }, checklist: EntityChecklist | undefined): void {
  if (checklist && !checklist.passed) {
    const reminder = `<system-reminder>\nCHECKLIST BEFORE STOPPING (Pre-Stop Conditional):\nYou are about to complete your turn. BEFORE you output your final message, you MUST verify:\n${renderChecklistSummary(checklist)}\nIf NO, you must execute these tools now. Do not stop your turn.\n</system-reminder>`
    output.system.push(reminder)
  }
}

/**
 * Create the session lifecycle hook (system prompt transform).
 *
 * @param log Logger used for lifecycle diagnostics.
 * @param directory Project directory for state/config resolution.
 * @param _initConfig Initial hook config snapshot; runtime config is reloaded on each turn.
 * @returns A hook that injects shared-budgeted HiveMind system context with child-session suppression.
 */
export function createSessionLifecycleHook(log: Logger, directory: string, _initConfig: HiveMindConfig) {
  const stateManager = createStateManager(directory, log)
  const effectiveDir = directory

  return async (
    input: { sessionID?: string; model?: unknown },
    output: { system: string[]; messages?: unknown[] },
  ): Promise<void> => {
    try {
      // Inject HiveMaster governance instruction FIRST (prepend, deduplicated)
      const checklist = await injectGovernanceInstruction(output, effectiveDir, input.sessionID || "unknown")

      if (!input.sessionID) {
        appendChecklistFailureReminder(output, checklist)
        return
      }
      const configPath = getEffectivePaths(directory).config

      if (!existsSync(configPath)) {
        // First-run setup guidance: do not initialize state until configured.
        output.system.length = 0
        output.system.push(await generateSetupGuidanceBlock(directory))
        output.system.push(STATE_BOOTSTRAP_STOP_DIRECTIVE)
        return
      }

      const config = await loadConfig(directory)

      let state = await stateManager.load()
      if (state) {
        state = applyPendingStateMutations(state)
      }
      if (!state) {
        state = createBrainState(generateSessionId(), config)
        state.session.opencode_session_id = input.sessionID
        // CQRS: Queue mutation instead of direct save (hooks are read-only)
        queueStateMutation({
          type: "UPDATE_STATE",
          payload: state,
          source: "session-lifecycle-hook:init",
        }, input.sessionID)
      } else if (!state.session.opencode_session_id && input.sessionID) {
        // Knot 2: Correlate OpenCode sessionID with HiveMind session (first invocation)
        state = {
          ...state,
          session: { ...state.session, opencode_session_id: input.sessionID },
        }
        queueStateMutation({
          type: "UPDATE_STATE",
          payload: state,
          source: "session-lifecycle-hook:correlate-session-id",
        }, input.sessionID)
      }

      if (state && isSessionStale(state, config.stale_session_days)) {
        const result = await handleStaleSession(state, directory, log, config)
        state = result.state
        if (result.errorMessage) {
          output.system.push(result.errorMessage)
        }
      }

      const maxResponseTokens = config.agent_behavior?.constraints?.max_response_tokens
      const approxContextWindowChars = estimateContextWindowChars(maxResponseTokens)
      const sharedInjectionCapChars = computeSharedInjectionCapChars(maxResponseTokens)
      const resolvedSessionId = state.session.id || input.sessionID || "unknown-session"
      const runtimeSessionLineage = await resolveRuntimeSessionLineage(
        input.sessionID ?? state.session.opencode_session_id,
      )
      const suppressHumanFacing =
        shouldSuppressHumanFacingGovernance(state) || runtimeSessionLineage.isChildSession
      const turnKey = createTurnInjectionKey(resolvedSessionId, state.metrics.turn_count)
      let ledger = createTurnInjectionLedger({
        sessionId: resolvedSessionId,
        turnCount: state.metrics.turn_count,
        contextWindowChars: approxContextWindowChars,
        capCharsOverride: sharedInjectionCapChars,
      })
      const existingUsage = getTurnInjectionLedger(turnKey)?.usage_by_channel
      if (
        existingUsage &&
        existingUsage["core-system"] > 0 &&
        existingUsage["core-message"] === 0
      ) {
        clearTurnInjectionLedger(turnKey)
        ledger = createTurnInjectionLedger({
          sessionId: resolvedSessionId,
          turnCount: state.metrics.turn_count,
          contextWindowChars: approxContextWindowChars,
          capCharsOverride: sharedInjectionCapChars,
        })
      }
      const provisionalBudget = ledger.cap_chars

      // Phase 1: Cognitive State is now injected via messages-transform.ts (canonical location)

      // Phase 2: Governance Signals
      const { warningLines, ignoredLines, frameworkLines, onboardingLines } = await buildGovernanceSignals(directory, state, config)
      const { critical: criticalWarningLines, advisory: advisoryWarningLines } = splitWarningPriority(warningLines)

      // Phase 3: Bootstrap & First-Turn Context
      const { bootstrapLines, evidenceLines, teamLines, firstTurnContextLines, firstTurnContractLines, outputStyleLines, readFirstLines, skillLines } = await buildBootstrapContext(directory, state, config, suppressHumanFacing)

      // Phase 4: Anchors are now injected via messages-transform.ts (canonical location)

      // Assemble by priority
      const assembled = assembleSections([
        bootstrapLines,
        frameworkLines,
        criticalWarningLines,
        evidenceLines,
        teamLines,
        buildStatusBlock(state, config),
        firstTurnContractLines,
        outputStyleLines,
        advisoryWarningLines,
        readFirstLines,
        skillLines,
        firstTurnContextLines,
        onboardingLines,
        suppressHumanFacing ? [] : buildTaskBlock(),
        ignoredLines,
      ], provisionalBudget, log)
      const grantedBudget = reserveInjectionBudget({
        turnKey,
        channel: "core-system",
        requestedChars: assembled.length,
      })

      if (grantedBudget <= 0) {
        appendChecklistFailureReminder(output, checklist)
        await log.debug("Session lifecycle: skipped injection (shared budget exhausted)")
        return
      }

      const finalLines = assembled.length <= grantedBudget
        ? assembled
        : `${assembled.slice(0, Math.max(0, grantedBudget - 32))}\n...[truncated by shared budget]`

      appendChecklistFailureReminder(output, checklist)
      output.system.push(finalLines)
      await log.debug(`Session lifecycle: injected ${finalLines.length} chars`)
    } catch (error) {
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}

async function buildBootstrapContext(
  directory: string,
  state: BrainState,
  config: HiveMindConfig,
  suppressHumanFacing: boolean,
) {
  const bootstrapLines: string[] = []
  const evidenceLines: string[] = []
  const teamLines: string[] = []
  const firstTurnContextLines: string[] = []
  const firstTurnContractLines: string[] = []
  const outputStyleLines: string[] = []
  const readFirstLines: string[] = []
  const skillLines: string[] = []

  const isBootstrapActive = state.metrics.turn_count <= 2
  const cleanSession = isCleanSession(state.metrics.turn_count, state.hierarchy)

  if (!suppressHumanFacing && cleanSession) {
    readFirstLines.push(generateReadFirstBlock(await detectBrownfield(directory), config.language))
  }
  if (!suppressHumanFacing && isBootstrapActive) {
    bootstrapLines.push(generateBootstrapBlock(config.governance_mode, config.language))
    evidenceLines.push(generateEvidenceDisciplineBlock(config.language))
    teamLines.push(generateTeamBehaviorBlock(config.language))
    const ftContext = await compileFirstTurnContext(directory, state)
    if (ftContext) firstTurnContextLines.push(ftContext)
    if (state.first_turn_confirmation.required) {
      firstTurnContractLines.push(generateFirstTurnConfirmationBlock(config.language))
    }
  }

  if (!suppressHumanFacing) {
    outputStyleLines.push(
      getV29OutputStyleDirective(
        state.selected_output_style_v29 ?? config.agent_behavior.output_style_v29 ?? null
      )
    )
  }

  // Intelligent skill loading — resolve skills for this session's intent
  if (!suppressHumanFacing && isBootstrapActive) {
    const intentHint = mapGovernanceModeToIntent(config.governance_mode)
    const skillCtx: SkillLoadContext = {
      intent: intentHint,
      isFirstSession: cleanSession,
      isPostCompaction: state.metrics.turn_count === 0 && !cleanSession,
      platform: "opencode",
      delegationNeeded: false,
      nonEnglishInput: config.language !== "en",
    }
    const resolved = resolveSkillsForIntent(skillCtx)
    skillLines.push(
      "[SKILLS]",
      `Required: ${resolved.required.join(", ")}`,
      `Conditional: ${resolved.conditional.length > 0 ? resolved.conditional.join(", ") : "(none)"}`,
      `Deferred: ${resolved.deferred.length > 0 ? resolved.deferred.join(", ") : "(none)"}`,
    )
  }

  return {
    bootstrapLines,
    evidenceLines,
    teamLines,
    firstTurnContextLines,
    firstTurnContractLines,
    outputStyleLines,
    readFirstLines,
    skillLines,
  }
}

function buildTaskBlock(): string[] {
  return [
    "[TASKS]",
    "- Track work with `todoread` and `todowrite`.",
    "- If user skips or misuses commands, auto-realign to HiveFiver flow (`hivefiver init` -> `hivefiver spec` -> `hivefiver research`).",
    "- Use skills to continue execution when commands are absent (persona-routing, spec-distillation, mcp-research-loop, ralph-tasking, domain-pack-router).",
  ]
}

function buildStatusBlock(state: { session: { governance_status: string; mode: string; governance_mode: string }; hierarchy: { trajectory: string; tactic: string; action: string } }, config: HiveMindConfig): string[] {
  return [
    getNextStepHint(config.language, state.hierarchy),
  ]
}

function assembleSections(sections: string[][], budget: number, log: Logger): string {
  const finalLines: string[] = ["<hivemind>"]
  for (const section of sections) {
    if (section.length === 0) continue
    const deduped = dedupeContextLines(section).lines
    if (deduped.length === 0) continue
    const candidate = [...finalLines, ...deduped, "</hivemind>"].join("\n")
    if (candidate.length <= budget) finalLines.push(...deduped)
    else log.debug(`Section dropped due to budget: ${section[0]?.slice(0, 40)}...`)
  }
  finalLines.push("</hivemind>")
  return finalLines.join("\n")
}

function splitWarningPriority(lines: string[]): { critical: string[]; advisory: string[] } {
  const criticalPatterns = [
    "Chain breaks",
    "Natural boundary",
    "Run /hivemind-compact",
    "SUBAGENT REPORTED FAILURE",
    "[CRITICAL]",
  ]

  const critical: string[] = []
  const advisory: string[] = []

  for (const line of lines) {
    if (criticalPatterns.some((pattern) => line.includes(pattern))) {
      critical.push(line)
      continue
    }
    advisory.push(line)
  }

  return { critical, advisory }
}

/**
 * Map governance mode to a classified intent hint.
 * Used as a lightweight proxy until full intent classification is wired.
 */
function mapGovernanceModeToIntent(
  governanceMode: string,
): "framework-meta" | "product-impl" | "research" | "ambiguous" {
  switch (governanceMode) {
    case "strict":
      return "framework-meta"
    case "assisted":
      return "product-impl"
    case "permissive":
      return "product-impl"
    default:
      return "ambiguous"
  }
}

// ─── Onboarding Logic (absorbed from onboarding.ts, 2026-03-12) ─────────────

/**
 * Detect if the project is brownfield (has existing files) or greenfield (new project).
 */
export async function detectBrownfield(directory: string): Promise<boolean> {
  try {
    const files = await readdir(directory)
    const visibleFiles = files.filter(
      f => !f.startsWith(".") && f !== "hivemind" && f !== "node_modules" && f !== "bun.lockb" && f !== "package-lock.json"
    )
    return visibleFiles.length > 0
  } catch {
    return false
  }
}

/**
 * Generate the read-first block for clean state sessions.
 * Teaches the agent to scan before writing on new projects.
 */
export function generateReadFirstBlock(isBrownfield: boolean, _language: "en" | "vi"): string {
  const lines: string[] = []
  lines.push("<read-first>")

  if (isBrownfield) {
    lines.push("## EXPERT PROTOCOL: BROWNFIELD DETECTED")
    lines.push("")
    lines.push("I detect existing code in this directory. Based on SOT:")
    lines.push("1. **SCAN**: Run `scan_hierarchy({ action: \"analyze\" })` immediately to map the codebase.")
    lines.push("2. **INTEGRATE**: Identify where HiveMind fits (e.g., `docs/plans/`).")
    lines.push("3. **ADOPT**: Do not overwrite without reading. Use `read_file` to explore.")
    lines.push("4. **REALIGN**: If user flow is messy/no-command, route to `/hivefiver init` then `/hivefiver audit`.")
  } else {
    lines.push("## STATE: NEW PROJECT / GREENFIELD")
    lines.push("")
    lines.push("This is a clean state. Before ANY work:")
    lines.push("1. **SCAN**: Confirm environment.")
    lines.push("2. **PLAN**: Check `docs/plans/` or create one.")
    lines.push("3. **DECIDE**: Call `declare_intent({ mode, focus })`.")
    lines.push("4. **BOOTSTRAP**: Route to `/hivefiver init` when user does not provide a command.")
  }

  lines.push("")
  lines.push("Do NOT start writing code until you understand the structure.")
  lines.push("</read-first>")

  return lines.join("\n")
}

/**
 * Check if the session is in a clean state (new project, no hierarchy).
 */
export function isCleanSession(
  turnCount: number,
  hierarchy: { trajectory: string; tactic: string; action: string }
): boolean {
  return turnCount === 0 && !hierarchy.trajectory && !hierarchy.tactic && !hierarchy.action
}

/**
 * Handle stale session archival.
 * Returns { state, errorMessage } where errorMessage is set if archival failed.
 */
export async function handleStaleSession(
  state: BrainState,
  directory: string,
  log: Logger,
  config: HiveMindConfig
): Promise<{ state: BrainState; errorMessage?: string }> {
  try {
    const activeMd = await readActiveMd(directory)
    const archiveContent = [
      `# Auto-Archived (Stale): ${state.session.id}`,
      `**Reason**: Session idle > ${config.stale_session_days} days`,
      `**Mode**: ${state.session.mode}`,
      `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
      `**Archived**: ${new Date().toISOString()}`,
      `**Turns**: ${state.metrics.turn_count}`,
      "## Session Content",
      activeMd.body,
    ].filter(Boolean).join("\n")

    await archiveSession(directory, state.session.id, archiveContent)
    await updateIndexMd(directory, `[auto-archived: stale] ${state.session.id}`)
    await resetActiveMd(directory)

    const newState = createBrainState(generateSessionId(), config)
    queueStateMutation({
      type: "UPDATE_STATE",
      payload: newState,
      source: "session-lifecycle-hook:stale-auto-archive",
    })
    await saveTree(directory, createTree())

    await log.info(`Auto-archived stale session ${state.session.id}`)
    return { state: newState }
  } catch (archiveError) {
    await log.error(`Failed to auto-archive stale session: ${archiveError}`)
    return {
      state,
      errorMessage: `[HIVEMIND][AUTO-ARCHIVE FAILED] Stale session archival failed; session remains active. Reason: ${archiveError}`
    }
  }
}
