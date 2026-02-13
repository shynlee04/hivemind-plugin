/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Reads all detection counters from brain.json
 *   - Reads timestamp gaps from hierarchy.json
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped (2500 chars, lowest priority dropped)
 *   - Handles stale session auto-archival
 *
 * This is the PROMPT engine. It reads detection state written by
 * soft-governance.ts (tool.execute.after) and compiles into warnings
 * that reshape the agent's next decision.
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import { existsSync } from "node:fs"
import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { generateAgentBehaviorPrompt } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { getEffectivePaths, isLegacyStructure } from "../lib/paths.js"
import { migrateIfNeeded } from "../lib/migrate.js"
import {
  createBrainState,
  generateSessionId,
} from "../schemas/brain-state.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"
import {
  detectFrameworkContext,
  buildFrameworkSelectionMenu,
} from "../lib/framework-context.js"
import {
  collectProjectSnapshot,
  generateSetupGuidanceBlock,
  generateProjectBackboneBlock,
  getNextStepHint,
  generateBootstrapBlock,
  generateEvidenceDisciplineBlock,
  generateTeamBehaviorBlock,
  compileFirstTurnContext,
  handleStaleSession,
  getHierarchySection,
  compileWarningsAndSignals,
  getAnchorsSection,
  localized,
} from "./session-lifecycle-helpers.js"

/**
 * Creates the session lifecycle hook (system prompt transform).
 *
 * Injects current session context into the system prompt:
 *   - Hierarchy state (trajectory/tactic/action)
 *   - Governance status (LOCKED/OPEN)
 *   - Session metrics (drift score, turn count)
 *   - Behavioral bootstrap (when LOCKED, first 2 turns)
 *   - First-turn context (anchors, mems, prior session — turns 0-1)
 *
 * Budget: ≤2500 chars normally, ≤4500 chars when bootstrap active.
 * Sections assembled by priority, lowest dropped if over budget. ADD, not REPLACE.
 */
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory, log)

  return async (
    input: { sessionID?: string; model?: any },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      if (isLegacyStructure(directory)) {
        await migrateIfNeeded(directory, log)
      }

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // FIRST-RUN DETECTION: If config.json doesn't exist, the user
      // never ran `hivemind init`. Inject setup guidance instead of
      // full governance — teach them how to configure.
      const configPath = getEffectivePaths(directory).config
      if (!existsSync(configPath)) {
        const setupBlock = await generateSetupGuidanceBlock(directory)
        output.system.push(setupBlock)
        await log.info("HiveMind not configured — injected setup guidance")
        return
      }

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        // First session — initialize
        await initializePlanningDirectory(directory)
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config)
        await stateManager.save(state)
      }

      // Time-to-Stale: auto-archive if session idle > configured days
      state = await handleStaleSession(directory, state, config, log, stateManager)

      // Build sections in priority order
      const statusLines: string[] = []
      const frameworkLines: string[] = []
      const onboardingLines: string[] = []
      const metricsLines: string[] = []
      const configLines: string[] = []

      const frameworkContext = await detectFrameworkContext(directory)
      const projectSnapshot = await collectProjectSnapshot(directory)

      if (!state.hierarchy.trajectory && state.metrics.turn_count <= 1) {
        onboardingLines.push(
          generateProjectBackboneBlock(config.language, projectSnapshot, frameworkContext.mode)
        )
      }

      if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal) {
        frameworkLines.push(`GSD Phase Goal: ${frameworkContext.gsdPhaseGoal}`)
      }

      if (frameworkContext.mode === "both") {
        const menu = buildFrameworkSelectionMenu(frameworkContext)
        const selection = state.framework_selection
        const hasFrameworkChoice = selection.choice === "gsd" || selection.choice === "spec-kit"
        const hasGsdMetadata = selection.choice === "gsd" && selection.active_phase.trim().length > 0
        const hasSpecMetadata = selection.choice === "spec-kit" && selection.active_spec_path.trim().length > 0
        const hasValidSelection = hasFrameworkChoice && (hasGsdMetadata || hasSpecMetadata)

        frameworkLines.push("[FRAMEWORK CONFLICT] Both .planning and .spec-kit detected.")
        frameworkLines.push("Request consolidation first, then choose one framework before implementation.")

        if (selection.acceptance_note.trim().length > 0 && !hasValidSelection) {
          frameworkLines.push(
            "Override note captured, but framework selection is still required before implementation."
          )
        }

        if (frameworkContext.gsdPhaseGoal) {
          frameworkLines.push(`Pinned GSD goal: ${frameworkContext.gsdPhaseGoal}`)
        }

        frameworkLines.push("Locked menu:")
        for (const option of menu.options) {
          const required = option.requiredMetadata.length > 0
            ? ` (metadata: ${option.requiredMetadata.join(", ")})`
            : ""
          frameworkLines.push(`- ${option.label}${required}`)
        }
      }

      // STATUS (always shown)
      statusLines.push(`Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`)
      statusLines.push(getNextStepHint(config.language, state.hierarchy))

      // HIERARCHY
      const hierarchyLines = await getHierarchySection(directory, state)

      // WARNINGS (shown if present)
      const { warningLines, ignoredLines } = await compileWarningsAndSignals(directory, state, config, frameworkContext)

      // No hierarchy = prompt to declare intent (Logic extracted slightly but mostly handled by signals/hints)
      // Actually, this specific warning was inline:
      if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
        if (config.governance_mode === "strict") {
          warningLines.push(localized(config.language, "No intent declared. Use declare_intent to unlock the session before writing.", "Chua khai bao intent. Dung declare_intent de mo khoa session truoc khi ghi file."))
        } else {
          warningLines.push(localized(config.language, "Tip: Use declare_intent to set your work focus for better tracking.", "Meo: dung declare_intent de dat focus cong viec va theo doi tot hon."))
        }
      }

      // ANCHORS
      const anchorLines = await getAnchorsSection(directory)

      // METRICS (shown if space)
      metricsLines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`)

      // AGENT CONFIG (shown if space)
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      configLines.push(agentConfigPrompt)

      // BEHAVIORAL BOOTSTRAP — inject teaching block when session is LOCKED
      // This is the ZERO-cooperation activation path (L7 fix)
      const bootstrapLines: string[] = []
      const firstTurnContextLines: string[] = []
      const evidenceLines: string[] = []
      const teamLines: string[] = []
      const isBootstrapActive = state.metrics.turn_count <= 2
      if (isBootstrapActive) {
        bootstrapLines.push(generateBootstrapBlock(config.governance_mode, config.language))
        evidenceLines.push(generateEvidenceDisciplineBlock(config.language))
        teamLines.push(generateTeamBehaviorBlock(config.language))

        // First-turn context: anchors, mems, prior session (agent never starts blind)
        const ftContext = await compileFirstTurnContext(directory, state)
        if (ftContext) {
          firstTurnContextLines.push(ftContext)
        }
      }

      // Assemble by priority — drop lowest priority sections if over budget
      // Budget expands to 4500 when bootstrap is active (first turns need teaching + context)
      const BUDGET_CHARS = isBootstrapActive ? 4500 : 2500
      const sections = [
        bootstrapLines, // P0: behavioral bootstrap (only when LOCKED, first 2 turns)
        firstTurnContextLines, // P0.3: first-turn context (anchors, mems, prior session)
        evidenceLines,  // P0.5: evidence discipline from turn 0
        teamLines,      // P0.6: team behavior from turn 0
        onboardingLines, // P0.7: first-run project backbone guidance
        frameworkLines, // P0.8: framework context and conflict routing
        statusLines,    // P1: always
        hierarchyLines, // P2: always
        ignoredLines,   // P2.5: IGNORED tri-evidence is non-negotiable
        warningLines,   // P3: if present
        anchorLines,    // P4: if present
        metricsLines,   // P5: if space
        configLines,    // P6: if space (agent config is lowest priority per-turn)
      ]

      const finalLines: string[] = ['<hivemind>']
      for (const section of sections) {
        if (section.length === 0) continue
        const candidate = [...finalLines, ...section, '</hivemind>'].join('\n')
        if (candidate.length <= BUDGET_CHARS) {
          finalLines.push(...section)
        } else {
          await log.debug(`Section dropped due to budget: ${section[0]?.slice(0, 40)}...`)
        }
      }
      finalLines.push('</hivemind>')

      const injection = finalLines.join('\n')

      output.system.push(injection)

      await log.debug(
        `Session lifecycle: injected ${injection.length} chars`
      )
    } catch (error) {
      // P3: Never break session lifecycle
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}
