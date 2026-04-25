/**
 * validate-restart tool — post-restart validation for OpenCode primitives.
 *
 * Simulates OpenCode discovery by loading all primitives and running
 * runtime validation to detect issues that would prevent successful restart.
 *
 * @module validate-restart
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { renderToolResult } from "../shared/tool-helpers.js"
import { success, error } from "../shared/tool-response.js"
import { loadPrimitives } from "../lib/primitive-loader.js"
import { validateRuntime } from "../lib/runtime-validator.js"
import { validateCrossPrimitive } from "../lib/cross-primitive-validator.js"
import { detectFrameworks } from "../lib/framework-detector.js"

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const ValidateRestartInputSchema = z.object({
  projectRoot: z.string().optional().describe("Absolute or relative path to project root (defaults to current directory)"),
  verbose: z.boolean().default(false).describe("Include detailed validation output"),
})

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createValidateRestartTool(): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "Validate that compiled OpenCode primitives are discoverable and free of runtime issues after a restart. Simulates OpenCode discovery, checks for circular dependencies, missing references, permission inheritance breaks, and framework boundary conflicts.",
    args: {
      projectRoot: s.string().describe("Project root path (optional, defaults to cwd)"),
      verbose: s.boolean().describe("Include detailed output"),
    },
    async execute(rawArgs, _context): Promise<string> {
      const argsResult = ValidateRestartInputSchema.safeParse(rawArgs)
      if (!argsResult.success) {
        return renderToolResult(error("Invalid arguments", { issues: argsResult.error.issues }))
      }
      const args = argsResult.data
      const projectRoot = args.projectRoot || process.cwd()

      // 1. Simulate OpenCode discovery
      const loadResult = await loadPrimitives({ projectRoot })
      if (!loadResult.config) {
        return renderToolResult(error("No opencode.json found — cannot validate restart", { projectRoot }))
      }

      // 2. Build PrimitiveMap (tools are not loaded by loadPrimitives, so use empty)
      const primitiveMap = {
        agents: loadResult.agents,
        commands: loadResult.commands,
        skills: loadResult.skills,
        tools: new Map(),
        mcpServers: loadResult.mcpServers,
        config: loadResult.config,
      }

      // 3. Cross-primitive validation
      const crossPrimitiveReport = validateCrossPrimitive(primitiveMap)

      // 4. Runtime validation
      const runtimeReport = validateRuntime(primitiveMap)

      // 5. Framework detection
      const frameworkResult = await detectFrameworks(projectRoot)

      // 6. Compile summary
      const issues = [
        ...crossPrimitiveReport.errors.map(e => `[CROSS-PRIMITIVE] ${e.message}`),
        ...crossPrimitiveReport.warnings.map(w => `[CROSS-PRIMITIVE] ${w.message}`),
        ...runtimeReport.loadingOrder.errors.map(e => `[RUNTIME] ${e}`),
        ...runtimeReport.resolutionOrder.errors.map(e => `[RUNTIME] ${e}`),
        ...runtimeReport.inheritanceChain.errors.map(e => `[RUNTIME] ${e}`),
        ...runtimeReport.pipelinePosition.errors.map(e => `[RUNTIME] ${e}`),
        ...frameworkResult.conflicts.map(c => `[FRAMEWORK] ${c}`),
        ...frameworkResult.warnings.map(w => `[FRAMEWORK] ${w}`),
        ...loadResult.warnings.map(w => `[LOAD] ${w}`),
      ]

      const isValid = crossPrimitiveReport.valid && runtimeReport.valid &&
        frameworkResult.conflicts.length === 0

      if (isValid) {
        const details = args.verbose ? { frameworks: frameworkResult.frameworks.map(f => f.marker.name) } : {}
        return renderToolResult(success("Restart validation passed", {
          projectRoot,
          agents: loadResult.agents.size,
          commands: loadResult.commands.size,
          skills: loadResult.skills.size,
          ...details,
        }))
      }

      return renderToolResult(error("Restart validation failed", {
        projectRoot,
        issues,
        summary: {
          crossPrimitiveErrors: crossPrimitiveReport.errors.length,
          crossPrimitiveWarnings: crossPrimitiveReport.warnings.length,
          runtimeErrors: runtimeReport.loadingOrder.errors.length +
            runtimeReport.resolutionOrder.errors.length +
            runtimeReport.inheritanceChain.errors.length +
            runtimeReport.pipelinePosition.errors.length,
          frameworkConflicts: frameworkResult.conflicts.length,
          loadWarnings: loadResult.warnings.length,
        },
      }))
    },
  })
}
