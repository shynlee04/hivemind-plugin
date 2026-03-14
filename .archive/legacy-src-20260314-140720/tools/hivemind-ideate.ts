/**
 * hivemind_ideate — Q.U.A.N.T. Ideation Matrix Gate
 *
 * Evaluates drafted specifications against the Q.U.A.N.T. Matrix.
 * Specs must pass all 5 dimensions before entering the task graph.
 *
 * Actions: evaluate (run full matrix), validate_schema (Zod check only)
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"

import { getEffectivePaths } from "../lib/paths.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { measureIdeationClarity } from "../lib/ideation-engine.js"
import { IdeationSpecSchema } from "../schemas/ideation-state.js"
import type { CompressedCodemap } from "../lib/code-intel/compressed-codemap.js"

export function createHivemindIdeateTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Evaluates a drafted specification against the Q.U.A.N.T. Ideation Matrix. " +
      "Specs must pass all 5 dimensions (QAI, UPS, AGS, NR, TDD-M) before writing code. " +
      "Actions: evaluate (full matrix gate), validate_schema (Zod check only).",
    args: {
      action: tool.schema
        .enum(["evaluate", "validate_schema"])
        .describe("What to do: evaluate | validate_schema"),
      spec_json: tool.schema
        .string()
        .describe("JSON string of the IdeationSpec to evaluate"),
    },
    async execute(args, _context) {
      switch (args.action) {
        case "evaluate":
          return handleEvaluate(directory, args)
        case "validate_schema":
          return handleValidateSchema(args)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// ─── Handlers ─────────────────────────────────────────────────────────────

async function handleEvaluate(
  directory: string,
  args: { spec_json?: string }
): Promise<string> {
  if (!args.spec_json?.trim()) {
    return toErrorOutput("spec_json is required", "Provide a JSON string of the IdeationSpec")
  }

  // Parse JSON
  let spec: Record<string, unknown>
  try {
    spec = JSON.parse(args.spec_json)
  } catch (err) {
    return toErrorOutput(
      `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
      "Ensure spec_json is valid JSON"
    )
  }

  // Load known codebase symbols from compressed codemap (if available)
  let knownSymbols: string[] = []
  const paths = getEffectivePaths(directory)
  if (existsSync(paths.compressedCodemapJson)) {
    try {
      const raw = await readFile(paths.compressedCodemapJson, "utf-8")
      const compressed = JSON.parse(raw) as CompressedCodemap
      // Extract all signature names as known symbols
      knownSymbols = compressed.files.flatMap(f =>
        f.signatures.map(s => s.name)
      )
    } catch {
      // Compressed codemap not available — NR check will be lenient
    }
  }

  // Run Q.U.A.N.T. evaluation
  const result = measureIdeationClarity(spec, knownSymbols)

  if (!result.passed) {
    return toErrorOutput(
      `Ideation REJECTED by Q.U.A.N.T. Matrix (score: ${result.overallScore}/100). Fix the following gaps:`,
      result.warnings.join(" | ")
    )
  }

  return toSuccessOutput(
    `Spec passed Q.U.A.N.T. Matrix (score: ${result.overallScore}/100). You may now proceed to task creation.`,
    (spec as { id?: string }).id,
    {
      overallScore: result.overallScore,
      dimensions: result.dimensions.map(d => ({
        dimension: d.dimension,
        score: d.score,
        passed: d.passed,
      })),
    }
  )
}

async function handleValidateSchema(
  args: { spec_json?: string }
): Promise<string> {
  if (!args.spec_json?.trim()) {
    return toErrorOutput("spec_json is required", "Provide a JSON string to validate")
  }

  let raw: unknown
  try {
    raw = JSON.parse(args.spec_json)
  } catch (err) {
    return toErrorOutput(
      `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
      "Ensure spec_json is valid JSON"
    )
  }

  const parsed = IdeationSpecSchema.safeParse(raw)

  if (!parsed.success) {
    const issues = parsed.error.issues.map(i =>
      `${i.path.join(".")}: ${i.message}`
    )
    return toErrorOutput(
      `Schema validation failed (${issues.length} issues):`,
      issues.join(" | ")
    )
  }

  return toSuccessOutput(
    "Schema validation passed. All fields conform to IdeationSpecSchema.",
    parsed.data.id,
    {
      requirementCount: parsed.data.requirements.length,
      stackSize: parsed.data.proposed_stack.length,
      mcpRefCount: parsed.data.mcp_research_refs.length,
    }
  )
}
