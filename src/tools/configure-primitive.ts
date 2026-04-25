import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { parse as yamlParse } from "yaml"
import { promises as fs, existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { renderToolResult } from "../shared/tool-helpers.js"
import { success, error } from "../shared/tool-response.js"
import {
  compileAgent,
  compileCommand,
  compileSkill,
  decompileAgent,
  decompileCommand,
  decompileSkill,
  mixedBatchCompile,
} from "../lib/config-compiler.js"
import { loadPrimitives, loadPrimitive } from "../lib/primitive-loader.js"
import {
  canAdvanceTurn,
  getTurnName,
  isWorkflowComplete,
  readWorkflow,
  validateTurnPrecondition,
  TOTAL_TURNS,
} from "../lib/config-workflow/index.js"
import type { WorkflowResumeResult } from "../lib/config-workflow/workflow-types.js"

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const PrimitiveBatchItemSchema = z.object({
  type: z.enum(["agent", "command", "skill"]),
  name: z.string(),
  spec: z.string(),
})

export const ConfigurePrimitiveInputSchema = z.object({
  action: z.enum(["compile", "decompile", "read", "list", "inspect", "resume"]).default("compile").describe("Operation to perform"),
  primitive: z.enum(["agent", "command", "skill"]).optional().describe("Type of OpenCode primitive to configure"),
  spec: z.string().optional().describe("JSON or YAML string describing the primitive configuration (required for compile/decompile)"),
  name: z.string().optional().describe("Primitive identifier (required for read/inspect)"),
  primitives: z.array(PrimitiveBatchItemSchema).optional().describe("Batch of mixed primitives to compile atomically"),
  dryRun: z.boolean().default(false).describe("If true, compile without writing — return the would-be content"),
  validate: z.boolean().default(true).describe("If true, run schema validation before compilation"),
  scope: z.enum(["project", "global"]).default("project").describe("Target scope: project writes to .opencode/, global writes to ~/.config/opencode/"),
  overwrite: z.boolean().default(false).describe("If true, overwrite existing files. Default false — rejects if file exists"),
  workflowTurn: z.number().min(0).max(7).optional()
    .describe("Workflow turn number (0-7). When provided, validates turn order before executing."),
  workflowId: z.string().optional()
    .describe("Workflow state ID for turn-order enforcement and auto-persistence."),
}).refine(
  (data) => {
    if (data.action === "compile" || data.action === "decompile") {
      if (data.primitives && data.primitives.length > 0) return true
      return !!data.spec && data.spec.length > 0
    }
    if (data.action === "read" || data.action === "inspect") {
      return !!data.name && data.name.length > 0
    }
    return true
  },
  { message: "spec is required for compile/decompile (or use primitives array for batch); name is required for read/inspect" },
)

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createConfigurePrimitiveTool(): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "Configure, read, list, or inspect OpenCode primitives (agent, command, skill). Supports compile/decompile from JSON/YAML, read back existing files, list all primitives, and inspect with validation details. Use dryRun to preview without writing.",
    args: {
      action: s.string().describe("compile, decompile, read, list, or inspect"),
      primitive: s.string().describe("Type: agent, command, or skill"),
      spec: s.string().describe("JSON or YAML configuration string (compile/decompile only)"),
      name: s.string().describe("Primitive name identifier (read/inspect only)"),
      primitives: s.array(s.object({ type: s.string(), name: s.string(), spec: s.string() })).describe("Batch of mixed primitives to compile atomically"),
      dryRun: s.boolean().describe("Preview mode — compile without writing"),
      validate: s.boolean().describe("Run schema validation before compilation"),
      scope: s.string().describe("project or global scope"),
      overwrite: s.boolean().describe("Overwrite existing files"),
      workflowTurn: s.number().describe("Workflow turn (0-7) for turn-order enforcement"),
      workflowId: s.string().describe("Workflow state ID for turn-order enforcement and auto-persistence"),
    },
    async execute(rawArgs, context): Promise<string> {
      // 1. Validate args
      const argsResult = ConfigurePrimitiveInputSchema.safeParse(rawArgs)
      if (!argsResult.success) {
        return renderToolResult(error("Invalid arguments", { issues: argsResult.error.issues }))
      }
      const args = argsResult.data

      // 2. Route by action
      switch (args.action) {
        case "compile":
          return handleCompile(args, context)
        case "decompile":
          return handleDecompile(args)
        case "read":
          return handleRead(args)
        case "list":
          return handleList(args, context)
        case "inspect":
          return handleInspect(args, context)
        case "resume":
          return handleResume(args)
        default:
          return renderToolResult(error(`Unknown action: ${args.action}`))
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handleCompile(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
  _context: unknown,
): Promise<string> | string {
  // Workflow turn enforcement — validate turn order if workflow params present
  if (args.workflowTurn !== undefined && args.workflowId) {
    const workflow = readWorkflow(args.workflowId)
    if (!workflow) {
      return renderToolResult(error(`Workflow ${args.workflowId} not found`))
    }
    if (!canAdvanceTurn(workflow, args.workflowTurn)) {
      return renderToolResult(error(
        `Invalid turn transition: cannot advance to turn ${args.workflowTurn}. ` +
        `Current turn is ${workflow.currentTurn} (${getTurnName(workflow.currentTurn)}). ` +
        `Expected turn ${workflow.currentTurn + 1} or any turn <= ${workflow.currentTurn}.`,
      ))
    }
    const guard = validateTurnPrecondition(workflow, args.workflowTurn)
    if (!guard.valid) {
      return renderToolResult(error(`Turn precondition failed: ${guard.errors.join("; ")}`))
    }
  }

  // Batch mode: primitives array provided
  if (args.primitives && args.primitives.length > 0) {
    return handleBatchCompile(args)
  }

  // Single primitive mode (backward compatible)
  if (!args.spec) {
    return renderToolResult(error("spec is required for compile (or use primitives array for batch)"))
  }

  // Parse spec string
  let parsedSpec: Record<string, unknown>
  try {
    parsedSpec = parseSpec(args.spec)
  } catch (e) {
    return renderToolResult(error(`Failed to parse spec: ${e instanceof Error ? e.message : String(e)}`))
  }

  const body = typeof parsedSpec.body === "string" ? parsedSpec.body : ""
  const frontmatter = { ...parsedSpec }
  delete frontmatter.body

  // Route to correct compiler
  let result: import("../lib/config-compiler.js").CompileResult
  const compileOptions = { scope: args.scope, skipValidation: !args.validate }

  switch (args.primitive) {
    case "agent": {
      const name = (frontmatter.name as string) || deriveName(frontmatter.description)
      result = compileAgent({ name, frontmatter: frontmatter as import("../lib/config-compiler.js").AgentSpec["frontmatter"], body }, compileOptions)
      break
    }
    case "command": {
      const name = (frontmatter.name as string) || deriveName(frontmatter.description)
      result = compileCommand({ name, frontmatter: frontmatter as import("../lib/config-compiler.js").CommandSpec["frontmatter"], body }, compileOptions)
      break
    }
    case "skill": {
      const name = (frontmatter.name as string) || deriveName(frontmatter.description)
      result = compileSkill({ name, frontmatter: frontmatter as import("../lib/config-compiler.js").SkillSpec["frontmatter"], body }, compileOptions)
      break
    }
    default:
      return renderToolResult(error(`Unknown primitive type: ${args.primitive}`))
  }

  if (!result.success) {
    return renderToolResult(error("Compilation failed", { errors: result.errors }))
  }

  // Dry run: return content without writing
  if (args.dryRun) {
    return renderToolResult(success("Dry run complete", { content: result.content, filePath: result.filePath }))
  }

  // Write file
  const filePath = result.filePath
  if (existsSync(filePath) && !args.overwrite) {
    return renderToolResult(error("File exists, use overwrite: true to replace", { filePath }))
  }

  mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFile(filePath, result.content, "utf-8")

  return renderToolResult(success("Primitive configured", { filePath, primitive: args.primitive }))
}

function handleBatchCompile(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
): string {
  const specs: import("../lib/config-compiler.js").MixedPrimitiveSpec[] = []

  for (const item of args.primitives!) {
    let parsedSpec: Record<string, unknown>
    try {
      parsedSpec = parseSpec(item.spec)
    } catch (e) {
      return renderToolResult(error(`Failed to parse spec for ${item.type} "${item.name}": ${e instanceof Error ? e.message : String(e)}`))
    }

    const body = typeof parsedSpec.body === "string" ? parsedSpec.body : ""
    const frontmatter = { ...parsedSpec }
    delete frontmatter.body

    specs.push({
      type: item.type,
      name: item.name,
      spec: { name: item.name, frontmatter: frontmatter as any, body },
    })
  }

  const result = mixedBatchCompile(specs, {
    dryRun: args.dryRun,
    validate: args.validate,
    scope: args.scope,
  })

  if (!result.success) {
    return renderToolResult(error("Batch compilation failed", {
      errors: result.errors,
      warnings: result.warnings,
      results: result.results,
    }))
  }

  return renderToolResult(success("Batch compilation complete", {
    results: result.results,
    warnings: result.warnings,
  }))
}

async function handleDecompile(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
): Promise<string> {
  const mdContent = args.spec!
  let result: import("../lib/config-compiler.js").DecompileResult<unknown>

  switch (args.primitive) {
    case "agent":
      result = decompileAgent(mdContent)
      break
    case "command":
      result = decompileCommand(mdContent)
      break
    case "skill":
      result = decompileSkill(mdContent)
      break
    default:
      return renderToolResult(error(`Unknown primitive type: ${args.primitive}`))
  }

  if (!result.success) {
    return renderToolResult(error("Decompilation failed", { warnings: result.warnings }))
  }

  return renderToolResult(success("Decompilation complete", {
    spec: result.spec,
    body: result.body,
    warnings: result.warnings,
  }))
}

async function handleRead(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
): Promise<string> {
  const primitive = args.primitive!
  const filePath = resolvePrimitivePath(primitive, args.name!, args.scope)
  const result = await loadPrimitive(filePath, primitive)

  if (!result.success) {
    return renderToolResult(error(`Failed to read ${primitive} "${args.name}": ${result.error}`))
  }

  return renderToolResult(success("Primitive read", {
    name: args.name,
    type: primitive,
    filePath,
    frontmatter: result.data.frontmatter,
    body: result.data.body,
  }))
}

async function handleList(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
  context: unknown,
): Promise<string> {
  const ctx = context as { directory?: string; worktree?: string }
  const projectRoot = ctx?.worktree || ctx?.directory || process.cwd()
  const result = await loadPrimitives({ projectRoot })

  const items: Array<{ name: string; type: string; filePath: string }> = []

  if (!args.primitive || args.primitive === "agent") {
    for (const [name, agent] of result.agents) {
      items.push({ name, type: "agent", filePath: agent.filePath })
    }
  }
  if (!args.primitive || args.primitive === "command") {
    for (const [name, cmd] of result.commands) {
      items.push({ name, type: "command", filePath: cmd.filePath })
    }
  }
  if (!args.primitive || args.primitive === "skill") {
    for (const [name, skill] of result.skills) {
      items.push({ name, type: "skill", filePath: skill.skillPath })
    }
  }

  return renderToolResult(success("Primitive list", {
    count: items.length,
    items,
    warnings: result.warnings,
  }))
}

async function handleInspect(
  args: z.infer<typeof ConfigurePrimitiveInputSchema>,
  context: unknown,
): Promise<string> {
  const primitive = args.primitive!
  const filePath = resolvePrimitivePath(primitive, args.name!, args.scope)
  const readResult = await loadPrimitive(filePath, primitive)

  if (!readResult.success) {
    return renderToolResult(error(`Failed to inspect ${primitive} "${args.name}": ${readResult.error}`))
  }

  const ctx = context as { directory?: string; worktree?: string }
  const projectRoot = ctx?.worktree || ctx?.directory || process.cwd()
  const loadResult = await loadPrimitives({ projectRoot })

  // Determine cross-reference status
  let crossRefStatus = "unknown"
  const collection = primitive === "agent" ? loadResult.agents
    : primitive === "command" ? loadResult.commands
    : loadResult.skills
  const existsInConfig = collection.has(args.name!)
  const existsOnDisk = existsSync(filePath)

  if (existsOnDisk && !existsInConfig) {
    crossRefStatus = "orphaned"
  } else if (existsOnDisk && existsInConfig) {
    crossRefStatus = "valid"
  } else if (!existsOnDisk) {
    crossRefStatus = "missing"
  }

  return renderToolResult(success("Primitive inspection", {
    name: args.name,
    type: primitive,
    filePath,
    frontmatter: readResult.data.frontmatter,
    body: readResult.data.body,
    crossRefStatus,
    warnings: loadResult.warnings.filter(w => w.includes(args.name!)),
  }))
}

// ---------------------------------------------------------------------------
// Resume handler (workflow state recovery)
// ---------------------------------------------------------------------------

/**
 * Handle the "resume" action — return current workflow state for the caller
 * to resume from the correct turn.
 *
 * @param args - Validated tool arguments (must include workflowId).
 * @returns Tool result with resume context or error.
 */
function handleResume(args: z.infer<typeof ConfigurePrimitiveInputSchema>): string {
  if (!args.workflowId) {
    return renderToolResult(error("workflowId is required for resume action"))
  }
  const workflow = readWorkflow(args.workflowId)
  if (!workflow) {
    return renderToolResult(error(`Workflow ${args.workflowId} not found`))
  }
  const result: WorkflowResumeResult = {
    workflowId: workflow.id,
    currentTurn: workflow.currentTurn,
    currentTurnName: getTurnName(workflow.currentTurn),
    completedTurns: Object.values(workflow.turns).filter(t => t.status === "complete").length,
    totalTurns: TOTAL_TURNS,
    lastOutput: workflow.turns[workflow.currentTurn - 1]?.output ?? null,
    canContinue: !isWorkflowComplete(workflow),
  }
  return renderToolResult(success("Workflow resume", { resume: result }))
}

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

function resolvePrimitivePath(
  primitive: "agent" | "command" | "skill",
  name: string,
  scope: "project" | "global",
): string {
  const base = scope === "global"
    ? (process.env.OPENCODE_CONFIG_DIR || `${process.env.HOME || "/tmp"}/.config/opencode`)
    : ".opencode"

  switch (primitive) {
    case "agent":
      return path.join(base, "agents", `${name}.md`)
    case "command":
      return path.join(base, "commands", `${name}.md`)
    case "skill":
      return path.join(base, "skills", name, "SKILL.md")
    default:
      return path.join(base, `${name}.md`)
  }
}

// ---------------------------------------------------------------------------
// Spec parsing helper
// ---------------------------------------------------------------------------

function parseSpec(specStr: string): Record<string, unknown> {
  // Try JSON first
  try {
    return JSON.parse(specStr) as Record<string, unknown>
  } catch {
    // Fall back to YAML
    return yamlParse(specStr) as Record<string, unknown>
  }
}

function deriveName(desc: unknown): string {
  if (typeof desc === "string" && desc.length > 0) {
    return desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 64) || "unnamed"
  }
  return "unnamed"
}
