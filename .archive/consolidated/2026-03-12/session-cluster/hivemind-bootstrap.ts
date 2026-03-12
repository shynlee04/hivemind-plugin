import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { getEffectivePaths } from "../lib/paths.js"
import { ensureSessionRuntimeBootstrap } from "../lib/session-runtime.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

/**
 * Create the `hivemind_bootstrap` tool.
 *
 * The runtime bootstrap owner now lives in `src/lib/session-runtime.ts`. This
 * tool is recovery-only: it should repair or recreate the canonical runtime
 * bootstrap surfaces when they are missing or corrupted, without reintroducing
 * a parallel bootstrap contract inside the tool layer itself.
 *
 * @param directory - Project root directory resolved by the OpenCode runtime.
 * @returns Tool definition for manual HiveMind bootstrap and recovery.
 *
 * @example
 * ```typescript
 * const bootstrap = createHivemindBootstrapTool(process.cwd())
 * ```
 */
export function createHivemindBootstrapTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Repair or recreate the canonical HiveMind runtime bootstrap state. " +
      "Recovery-only fallback when session bootstrap surfaces are missing.",
    args: {
      force: tool.schema
        .boolean()
        .optional()
        .default(false)
        .describe("Force recreation of runtime bootstrap state and profile shims"),
    },
    async execute({ force }) {
      try {
        const stateManager = createStateManager(directory)
        const config = await loadConfig(directory)
        const paths = getEffectivePaths(directory)
        const result = await ensureSessionRuntimeBootstrap(directory, stateManager, config, {
          force,
          role: "unresolved",
          lineageScope: "unknown",
          sessionKind: "unresolved",
          mode: "exploration",
        })

        return toSuccessOutput("HiveMind runtime bootstrap completed", result.runtimeSessionId, {
          force,
          runtimeSessionId: result.runtimeSessionId,
          brainSessionId: result.state.session.id,
          createdState: result.createdState,
          rewroteState: result.rewroteState,
          rewroteHierarchy: result.rewroteHierarchy,
          stateFiles: {
            brain: paths.brain,
            hierarchy: paths.hierarchy,
            profile: result.profilePath,
          },
          profile: result.profile,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return toErrorOutput(`Bootstrap failed: ${message}`)
      }
    },
  })
}
