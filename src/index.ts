/**
 * HiveMind — Context-Aware Governance Layer for OpenCode
 *
 * A lightweight governance layer that prevents drift and manages session state.
 *
 * ## Architecture
 *
 * - **6 Canonical Tools** (HC5 compliant):
 *   - hivemind_session   — session lifecycle: start, update, close, status, resume
 *   - hivemind_inspect   — inspection: scan, deep, drift
 *   - hivemind_memory    — memory: save, recall, list
 *   - hivemind_anchor    — anchors: save, list, get
 *   - hivemind_hierarchy — tree: prune, migrate, status
 *   - hivemind_cycle     — export: export, list, prune
 * - **6 Hooks**: system transform, messages transform, tool gate (before), soft governance (after), compaction preservation, event handling
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
import { existsSync } from "fs"
import { join } from "path"
import {
  createHivemindSessionTool,
  createHivemindInspectTool,
  createHivemindMemoryTool,
  createHivemindAnchorTool,
  createHivemindHierarchyTool,
  createHivemindCycleTool,
} from "./tools/index.js"
import {
  createSessionLifecycleHook,
  createSoftGovernanceHook,
  createToolGateHook,
  createCompactionHook,
  createEventHandler,
} from "./hooks/index.js"
import { createMessagesTransformHook } from "./hooks/messages-transform.js"
import { createLogger } from "./lib/logging.js"
import { loadConfig } from "./lib/persistence.js"
import { initSdkContext } from "./hooks/sdk-context.js"
import { regenerateManifests } from "./lib/planning-fs.js"

/**
 * HiveMind plugin entry point.
 *
 * Initializes governance layer with:
 *   - SDK context (client, BunShell, serverUrl, project)
 *   - Session lifecycle hook (system prompt injection)
 *   - Soft governance hook (tracking + violation detection)
 *   - 6 canonical context management tools (HC5 compliant)
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

  const configPath = join(effectiveDir, ".hivemind", "config.json")
  const logDir = existsSync(configPath)
    ? join(effectiveDir, ".hivemind", "logs")
    : effectiveDir
  const log = await createLogger(logDir, "HiveMind")

   await log.info(`Initializing HiveMind in ${effectiveDir}`)

  // Load configuration for initial logging only
  // Hooks re-read config from disk each invocation (Rule 6: config persistence)
  const initConfig = await loadConfig(effectiveDir)
  // Ensure manifests are up to date
  await regenerateManifests(effectiveDir).catch(err => log.error(`Manifest regeneration failed: ${err}`))

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
     * 6 Canonical tools for session governance (HC5 compliant)
     */
    tool: {
      hivemind_session: createHivemindSessionTool(effectiveDir),
      hivemind_inspect: createHivemindInspectTool(effectiveDir),
      hivemind_memory: createHivemindMemoryTool(effectiveDir),
      hivemind_anchor: createHivemindAnchorTool(effectiveDir),
      hivemind_hierarchy: createHivemindHierarchyTool(effectiveDir),
      hivemind_cycle: createHivemindCycleTool(effectiveDir),
    },

    /**
     * Hook: System prompt transformation
     * Injects current session context + governance status
     */
    "experimental.chat.system.transform":
      createSessionLifecycleHook(log, effectiveDir, initConfig),

    /**
     * Hook: Message transformation
     * Injects stop-decision checklist and continuity context
     * Also handles first-turn prompt transformation (session_coherence)
     */
    "experimental.chat.messages.transform": createMessagesTransformHook(log, effectiveDir),

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