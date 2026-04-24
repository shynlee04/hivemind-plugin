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
} from "../lib/config-compiler.js"

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const ConfigurePrimitiveInputSchema = z.object({
  primitive: z.enum(["agent", "command", "skill"]).describe("Type of OpenCode primitive to configure"),
  spec: z.string().min(1).describe("JSON or YAML string describing the primitive configuration"),
  dryRun: z.boolean().default(false).describe("If true, compile without writing — return the would-be content"),
  validate: z.boolean().default(true).describe("If true, run schema validation before compilation"),
  scope: z.enum(["project", "global"]).default("project").describe("Target scope: project writes to .opencode/, global writes to ~/.config/opencode/"),
  overwrite: z.boolean().default(false).describe("If true, overwrite existing files. Default false — rejects if file exists"),
})

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createConfigurePrimitiveTool(): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "Configure an OpenCode primitive (agent, command, or skill) from JSON/YAML input. Validates against schemas, compiles to .md format. Use dryRun to preview without writing.",
    args: {
      primitive: s.string().describe("Type: agent, command, or skill"),
      spec: s.string().describe("JSON or YAML configuration string"),
      dryRun: s.boolean().describe("Preview mode — compile without writing"),
      validate: s.boolean().describe("Run schema validation before compilation"),
      scope: s.string().describe("project or global scope"),
      overwrite: s.boolean().describe("Overwrite existing files"),
    },
    async execute(rawArgs, _context): Promise<string> {
      // 1. Validate args
      const argsResult = ConfigurePrimitiveInputSchema.safeParse(rawArgs)
      if (!argsResult.success) {
        return renderToolResult(error("Invalid arguments", { issues: argsResult.error.issues }))
      }
      const args = argsResult.data

      // 2. Parse spec string
      let parsedSpec: Record<string, unknown>
      try {
        parsedSpec = parseSpec(args.spec)
      } catch (e) {
        return renderToolResult(error(`Failed to parse spec: ${e instanceof Error ? e.message : String(e)}`))
      }

      const body = typeof parsedSpec.body === "string" ? parsedSpec.body : ""
      const frontmatter = { ...parsedSpec }
      delete frontmatter.body

      // 3. Route to correct compiler
      let result: import("../lib/config-compiler.js").CompileResult
      const compileOptions = { scope: args.scope, skipValidation: !args.validate }

      function deriveName(desc: unknown): string {
        if (typeof desc === "string" && desc.length > 0) {
          return desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 64) || "unnamed"
        }
        return "unnamed"
      }

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

      // 4. Dry run: return content without writing
      if (args.dryRun) {
        return renderToolResult(success("Dry run complete", { content: result.content, filePath: result.filePath }))
      }

      // 5. Write file
      const filePath = result.filePath
      if (existsSync(filePath) && !args.overwrite) {
        return renderToolResult(error("File exists, use overwrite: true to replace", { filePath }))
      }

      mkdirSync(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, result.content, "utf-8")

      return renderToolResult(success("Primitive configured", { filePath, primitive: args.primitive }))
    },
  })
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
