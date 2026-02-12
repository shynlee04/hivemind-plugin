/**
 * HiveMind — Context-Aware Governance Layer for OpenCode
 *
 * A lightweight governance layer that prevents drift and manages session state.
 *
 * ## Architecture
 *
 * - **14 Tools**: declare_intent, map_context, compact_session, self_rate, scan_hierarchy, save_anchor, think_back, check_drift, save_mem, list_shelves, recall_mems, hierarchy_prune, hierarchy_migrate, export_cycle
 * - **4 Hooks**: system prompt injection, tool gate (before), soft governance (after), compaction preservation
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
  createScanHierarchyTool,
  createSaveAnchorTool,
  createThinkBackTool,
  createCheckDriftTool,
  createSaveMemTool,
  createListShelvesTool,
  createRecallMemsTool,
  createHierarchyPruneTool,
  createHierarchyMigrateTool,
  createExportCycleTool,
} from "./tools/index.js"
import {
  createSessionLifecycleHook,
  createSoftGovernanceHook,
  createToolGateHook,
  createCompactionHook,
  createEventHandler,
} from "./hooks/index.js"
import { createLogger } from "./lib/logging.js"
import { loadConfig } from "./lib/persistence.js"
import { initSdkContext } from "./hooks/sdk-context.js"

/**
 * HiveMind plugin entry point.
 *
 * Initializes governance layer with:
 *   - SDK context (client, BunShell, serverUrl, project)
 *   - Session lifecycle hook (system prompt injection)
 *   - Soft governance hook (tracking + violation detection)
 *   - 14 context management tools
 */
export const HiveMindPlugin: Plugin = async ({
  directory,
  worktree,
  client,
  $: shell,
  serverUrl,
  project,
}) => {
  const effectiveDir = worktree || directory

  // Store SDK refs in module singleton — NEVER call client.* here (deadlock risk)
  // Hooks and tools access via getClient() at execution time
  initSdkContext({ client, $: shell, serverUrl, project })

  const log = await createLogger(effectiveDir, "HiveMind")

   await log.info(`Initializing HiveMind in ${effectiveDir}`)

  // Load configuration for initial logging only
  // Hooks re-read config from disk each invocation (Rule 6: config persistence)
  const initConfig = await loadConfig(effectiveDir)

  await log.info(
    `HiveMind initialized: mode=${initConfig.governance_mode}, maxTurns=${initConfig.max_turns_before_warning}`
  )
  await log.info(
    `SDK context: client=${!!client}, shell=${!!shell}, serverUrl=${serverUrl?.href ?? 'none'}`
  )

  return {
    /**
     * Hook: Event-driven governance
     * Handles session.created, session.idle, session.compacted, file.edited, session.diff
     */
    event: createEventHandler(log, effectiveDir),

    /**
     * Custom tools for session governance
     */
    tool: {
      declare_intent: createDeclareIntentTool(effectiveDir),
      map_context: createMapContextTool(effectiveDir),
      compact_session: createCompactSessionTool(effectiveDir),
      self_rate: createSelfRateTool(effectiveDir),
      scan_hierarchy: createScanHierarchyTool(effectiveDir),
      save_anchor: createSaveAnchorTool(effectiveDir),
      think_back: createThinkBackTool(effectiveDir),
      check_drift: createCheckDriftTool(effectiveDir),
      save_mem: createSaveMemTool(effectiveDir),
      list_shelves: createListShelvesTool(effectiveDir),
      recall_mems: createRecallMemsTool(effectiveDir),
      hierarchy_prune: createHierarchyPruneTool(effectiveDir),
      hierarchy_migrate: createHierarchyMigrateTool(effectiveDir),
      export_cycle: createExportCycleTool(effectiveDir),
    },

    /**
     * Hook: System prompt transformation
     * Injects current session context + governance status
     */
    "experimental.chat.system.transform":
      createSessionLifecycleHook(log, effectiveDir, initConfig),

    /**
     * Hook: Tool execution tracking
     * Tracks violations, drift detection, metrics updates
     */
    "tool.execute.after":
      createSoftGovernanceHook(log, effectiveDir, initConfig),

    /**
     * Hook: Tool gate - governance enforcement
     * Logs warnings based on governance mode and session state. Cannot block (OpenCode v1.1+ limitation)
     */
    "tool.execute.before": createToolGateHook(log, effectiveDir, initConfig),

    /**
     * Hook: Session compaction - preserve hierarchy across context boundaries
     * Injects trajectory/tactic/action markers into compacted context
     */
    "experimental.session.compacting": createCompactionHook(log, effectiveDir),
  }
}

export default HiveMindPlugin