/**
 * HiveMind — Context-Aware Governance Layer for OpenCode
 *
 * A lightweight governance layer that prevents drift and manages session state.
 *
 * ## Architecture
 *
 * - **4 Tools**: declare_intent, map_context, compact_session, self_rate
 * - **2 Hooks**: session-lifecycle (system prompt), soft-governance (tracking)
 * - **Soft Governance**: Cannot block, only guide through prompts + tracking
 *
 * ## Governance Modes
 *
 * | Mode       | Behavior                                      |
 * | ---------- | --------------------------------------------- |
 * | strict     | Session starts LOCKED. Warns on drift.        |
 * | assisted   | Session starts OPEN. Warns on drift.          |
 * | permissive | Session always OPEN. Silent tracking only.   |
 *
 * ## Usage
 *
 * ```typescript
 * import { HiveMindPlugin } from "@hivemind-plugin/core"
 *
 * export const HiveMind: Plugin = HiveMindPlugin
 * ```
 */

import type { Plugin } from "@opencode-ai/plugin"
import {
  createDeclareIntentTool,
  createMapContextTool,
  createCompactSessionTool,
  createSelfRateTool,
} from "./tools/index.js"
import {
  createSessionLifecycleHook,
  createSoftGovernanceHook,
  createToolGateHook,
  createCompactionHook,
} from "./hooks/index.js"
import { createLogger } from "./lib/logging.js"
import { loadConfig } from "./lib/persistence.js"

/**
 * HiveMind plugin entry point.
 *
 * Initializes governance layer with:
 *   - Session lifecycle hook (system prompt injection)
 *   - Soft governance hook (tracking + violation detection)
 *   - 4 context management tools
 */
export const HiveMindPlugin: Plugin = async ({
  directory,
  worktree,
}) => {
  const effectiveDir = worktree || directory
  const log = await createLogger(effectiveDir, "HiveMind")

  await log.info(`Initializing HiveMind in ${effectiveDir}`)

  // Load configuration (with defaults)
  const config = await loadConfig(effectiveDir)

  await log.info(
    `HiveMind initialized: mode=${config.governance_mode}, maxTurns=${config.max_turns_before_warning}`
  )

  return {
    /**
     * Custom tools for session governance
     */
    tool: [
      createDeclareIntentTool(effectiveDir),
      createMapContextTool(effectiveDir),
      createCompactSessionTool(effectiveDir),
      createSelfRateTool(effectiveDir),
    ],

    /**
     * Hook: System prompt transformation
     * Injects current session context + governance status
     */
    "experimental.chat.system.transform":
      createSessionLifecycleHook(log, effectiveDir, config),

    /**
     * Hook: Tool execution tracking
     * Tracks violations, drift detection, metrics updates
     */
    "tool.execute.after":
      createSoftGovernanceHook(log, effectiveDir, config),

    /**
     * Hook: Tool gate - governance enforcement
     * Logs warnings based on governance mode and session state. Cannot block (OpenCode v1.1+ limitation)
     */
    "tool.execute.before": createToolGateHook(log, effectiveDir, config),

    /**
     * Hook: Session compaction - preserve hierarchy across context boundaries
     * Injects trajectory/tactic/action markers into compacted context
     */
    "experimental.session.compacting": createCompactionHook(log, effectiveDir),
  }
}

export default HiveMindPlugin