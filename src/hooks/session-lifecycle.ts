/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped (2500 chars, lowest priority dropped)
 *   - Handles stale session auto-archival
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
import { createBrainState, generateSessionId } from "../schemas/brain-state.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"
import { isSessionStale } from "../lib/staleness.js"
import { detectBrownfield, generateReadFirstBlock, isCleanSession, handleStaleSession } from "../lib/onboarding.js"
import { buildGovernanceSignals } from "../lib/session-governance.js"
import {
  generateBootstrapBlock,
  generateEvidenceDisciplineBlock,
  generateTeamBehaviorBlock,
  compileFirstTurnContext,
  generateSetupGuidanceBlock,
  getNextStepHint,
} from "./session-lifecycle-helpers.js"
import { HIVE_MASTER_GOVERNANCE_INSTRUCTION } from "../lib/governance-instruction.js"

const GOVERNANCE_MARKER = "[🛡️ HIVE-MASTER governance active]"

/**
 * Inject HiveMaster strict governance instruction (prepends, deduplicated)
 */
function injectGovernanceInstruction(output: { system: string[] }): void {
  // Check if already injected (deduplication)
  const alreadyInjected = output.system.some(s => s.includes(GOVERNANCE_MARKER))
  if (!alreadyInjected) {
    output.system.unshift(HIVE_MASTER_GOVERNANCE_INSTRUCTION)
  }
}

/**
 * Creates the session lifecycle hook (system prompt transform).
 */
export function createSessionLifecycleHook(log: Logger, directory: string, _initConfig: HiveMindConfig) {
  const stateManager = createStateManager(directory, log)

  return async (input: { sessionID?: string; model?: unknown }, output: { system: string[] }): Promise<void> => {
    try {
      // Inject HiveMaster governance instruction FIRST (prepend, deduplicated)
      injectGovernanceInstruction(output)

      if (!input.sessionID) return
      if (isLegacyStructure(directory)) await migrateIfNeeded(directory, log)

      const config = await loadConfig(directory)
      const configPath = getEffectivePaths(directory).config

      if (!existsSync(configPath)) {
        output.system.push(await generateSetupGuidanceBlock(directory))
        await log.info("HiveMind not configured — injected setup guidance")
        return
      }

      let state = await stateManager.load()
      if (!state) {
        await initializePlanningDirectory(directory)
        state = createBrainState(generateSessionId(), config)
        await stateManager.save(state)
      }

      if (state && isSessionStale(state, config.stale_session_days)) {
        const result = await handleStaleSession(state, directory, log, stateManager, config)
        state = result.state
        if (result.errorMessage) {
          output.system.push(result.errorMessage)
        }
      }

      const isBootstrapActive = state.metrics.turn_count <= 2
      const BUDGET_CHARS = isBootstrapActive ? 4500 : 2500

      // Phase 1: Cognitive State is now injected via messages-transform.ts (canonical location)

      // Phase 2: Governance Signals
      const { warningLines, ignoredLines, frameworkLines, onboardingLines } = await buildGovernanceSignals(directory, state, config)

      // Phase 3: Bootstrap & First-Turn Context
      const { bootstrapLines, evidenceLines, teamLines, firstTurnContextLines, readFirstLines } = await buildBootstrapContext(directory, state, config)

      // Phase 4: Anchors are now injected via messages-transform.ts (canonical location)

      // Assemble by priority
      const finalLines = assembleSections([
        readFirstLines, bootstrapLines, firstTurnContextLines, evidenceLines, teamLines,
        onboardingLines, frameworkLines, buildStatusBlock(state, config), buildTaskBlock(), ignoredLines,
        warningLines, buildMetricsBlock(state), buildConfigBlock(config),
      ], BUDGET_CHARS, log)

      output.system.push(finalLines)
      await log.debug(`Session lifecycle: injected ${finalLines.length} chars`)
    } catch (error) {
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}

async function buildBootstrapContext(directory: string, state: { metrics: { turn_count: number }; hierarchy: { trajectory: string; tactic: string; action: string } }, config: HiveMindConfig) {
  const bootstrapLines: string[] = []
  const evidenceLines: string[] = []
  const teamLines: string[] = []
  const firstTurnContextLines: string[] = []
  const readFirstLines: string[] = []

  const isBootstrapActive = state.metrics.turn_count <= 2
  const cleanSession = isCleanSession(state.metrics.turn_count, state.hierarchy)

  if (cleanSession) readFirstLines.push(generateReadFirstBlock(await detectBrownfield(directory), config.language))
  if (isBootstrapActive) {
    bootstrapLines.push(generateBootstrapBlock(config.governance_mode, config.language))
    evidenceLines.push(generateEvidenceDisciplineBlock(config.language))
    teamLines.push(generateTeamBehaviorBlock(config.language))
    const ftContext = await compileFirstTurnContext(directory, state as any)
    if (ftContext) firstTurnContextLines.push(ftContext)
  }

  return { bootstrapLines, evidenceLines, teamLines, firstTurnContextLines, readFirstLines }
}

function buildTaskBlock(): string[] {
  return ["[TASKS]", "- Remember to track your work. Use `todoread` to check pending tasks and `todowrite` to update status."]
}

function buildStatusBlock(state: { session: { governance_status: string; mode: string; governance_mode: string }; hierarchy: { trajectory: string; tactic: string; action: string } }, config: HiveMindConfig): string[] {
  return [
    `Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`,
    getNextStepHint(config.language, state.hierarchy),
  ]
}

function buildMetricsBlock(state: { metrics: { turn_count: number; drift_score: number; files_touched: string[] } }): string[] {
  return [`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`]
}

function buildConfigBlock(config: HiveMindConfig): string[] {
  return [generateAgentBehaviorPrompt(config.agent_behavior)]
}

function assembleSections(sections: string[][], budget: number, log: Logger): string {
  const finalLines: string[] = ["<hivemind>"]
  for (const section of sections) {
    if (section.length === 0) continue
    const candidate = [...finalLines, ...section, "</hivemind>"].join("\n")
    if (candidate.length <= budget) finalLines.push(...section)
    else log.debug(`Section dropped due to budget: ${section[0]?.slice(0, 40)}...`)
  }
  finalLines.push("</hivemind>")
  return finalLines.join("\n")
}
