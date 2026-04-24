import { stringify as yamlStringify } from "yaml"
import matter from "gray-matter"
import { homedir } from "node:os"
import {
  AgentFrontmatterSchema,
  CommandFrontmatterSchema,
  SkillFrontmatterSchema,
} from "../schema-kernel/index.js"
import type {
  AgentFrontmatter,
  CommandFrontmatter,
  SkillFrontmatter,
} from "../schema-kernel/index.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompileResult = {
  success: boolean
  content: string
  filePath: string
  errors?: string[]
}

export type DecompileResult<T> = {
  success: boolean
  spec: T | null
  body: string
  warnings: string[]
}

export type AgentSpec = { name: string; frontmatter: AgentFrontmatter; body: string }
export type CommandSpec = { name: string; frontmatter: CommandFrontmatter; body: string }
export type SkillSpec = { name: string; frontmatter: SkillFrontmatter; body: string }

export type CompileOptions = { scope?: "project" | "global"; basePath?: string; skipValidation?: boolean }

export type BatchCompileResult = {
  results: CompileResult[]
  allSucceeded: boolean
  failureReport?: CompileResult
}

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

export function resolveBasePath(options?: CompileOptions): string {
  if (options?.basePath) {
    return options.basePath
  }
  if (options?.scope === "global") {
    return process.env.OPENCODE_CONFIG_DIR || `${homedir()}/.config/opencode`
  }
  return ".opencode"
}

export function validateOutputPath(filePath: string, _basePath: string): string | null {
  if (filePath.includes("..")) {
    return `Path traversal detected in "${filePath}"`
  }
  return null
}

// ---------------------------------------------------------------------------
// Compile functions
// ---------------------------------------------------------------------------

export function compileAgent(spec: AgentSpec, options?: CompileOptions): CompileResult {
  if (!options?.skipValidation) {
    const frontmatterResult = validateFrontmatter(AgentFrontmatterSchema, spec.frontmatter, "agent frontmatter")
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
  }

  const content = buildMarkdown(spec.frontmatter as Record<string, unknown>, spec.body)
  const basePath = resolveBasePath(options)
  const relativePath = `agents/${spec.name}.md`
  const pathError = validateOutputPath(relativePath, basePath)
  if (pathError) {
    return { success: false, content: "", filePath: "", errors: [pathError] }
  }

  const filePath = `${basePath}/${relativePath}`
  return { success: true, content, filePath }
}

export function compileCommand(spec: CommandSpec, options?: CompileOptions): CompileResult {
  if (!options?.skipValidation) {
    const frontmatterResult = validateFrontmatter(CommandFrontmatterSchema, spec.frontmatter, "command frontmatter")
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
  }

  const content = buildMarkdown(spec.frontmatter as Record<string, unknown>, spec.body)
  const basePath = resolveBasePath(options)
  const relativePath = `commands/${spec.name}.md`
  const pathError = validateOutputPath(relativePath, basePath)
  if (pathError) {
    return { success: false, content: "", filePath: "", errors: [pathError] }
  }

  const filePath = `${basePath}/${relativePath}`
  return { success: true, content, filePath }
}

export function compileSkill(spec: SkillSpec, options?: CompileOptions): CompileResult {
  if (!options?.skipValidation) {
    const frontmatterResult = validateFrontmatter(SkillFrontmatterSchema, spec.frontmatter, "skill frontmatter")
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
  }

  const content = buildMarkdown(spec.frontmatter as Record<string, unknown>, spec.body)
  const basePath = resolveBasePath(options)
  const relativePath = `skills/${spec.name}/SKILL.md`
  const pathError = validateOutputPath(relativePath, basePath)
  if (pathError) {
    return { success: false, content: "", filePath: "", errors: [pathError] }
  }

  const filePath = `${basePath}/${relativePath}`
  return { success: true, content, filePath }
}

// ---------------------------------------------------------------------------
// Decompile functions
// ---------------------------------------------------------------------------

export function decompileAgent(md: string): DecompileResult<AgentSpec> {
  const parsed = matter(md)
  const frontmatterResult = validateFrontmatter(AgentFrontmatterSchema, parsed.data, "decompile agent")
  if (!frontmatterResult.success) {
    return { success: false, spec: null, body: parsed.content, warnings: formatCompileError(frontmatterResult.error) }
  }
  const body = parsed.content.trim()
  return {
    success: true,
    spec: { name: "unknown", frontmatter: frontmatterResult.data, body },
    body,
    warnings: [],
  }
}

export function decompileCommand(md: string): DecompileResult<CommandSpec> {
  const parsed = matter(md)
  const frontmatterResult = validateFrontmatter(CommandFrontmatterSchema, parsed.data, "decompile command")
  if (!frontmatterResult.success) {
    const body = parsed.content.trim()
    return { success: false, spec: null, body, warnings: formatCompileError(frontmatterResult.error) }
  }
  const body = parsed.content.trim()
  return {
    success: true,
    spec: { name: "unknown", frontmatter: frontmatterResult.data, body },
    body,
    warnings: [],
  }
}

export function decompileSkill(md: string): DecompileResult<SkillSpec> {
  const parsed = matter(md)
  const frontmatterResult = validateFrontmatter(SkillFrontmatterSchema, parsed.data, "decompile skill")
  if (!frontmatterResult.success) {
    const body = parsed.content.trim()
    return { success: false, spec: null, body, warnings: formatCompileError(frontmatterResult.error) }
  }
  const name = frontmatterResult.data.name ?? "unknown"
  const body = parsed.content.trim()
  return {
    success: true,
    spec: { name, frontmatter: frontmatterResult.data, body },
    body,
    warnings: [],
  }
}

// ---------------------------------------------------------------------------
// Batch compile
// ---------------------------------------------------------------------------

export function batchCompile(
  specs: Array<{ type: "agent" | "command" | "skill"; spec: AgentSpec | CommandSpec | SkillSpec }>,
  options?: { atomic?: boolean; compileOptions?: CompileOptions },
): BatchCompileResult {
  const results: CompileResult[] = []

  for (const item of specs) {
    let result: CompileResult
    switch (item.type) {
      case "agent":
        result = compileAgent(item.spec as AgentSpec, options?.compileOptions)
        break
      case "command":
        result = compileCommand(item.spec as CommandSpec, options?.compileOptions)
        break
      case "skill":
        result = compileSkill(item.spec as SkillSpec, options?.compileOptions)
        break
      default:
        result = { success: false, content: "", filePath: "", errors: ["Unknown primitive type"] }
    }
    results.push(result)
  }

  const hasFailure = results.some(r => !r.success)
  if (options?.atomic && hasFailure) {
    const firstFailure = results.find(r => !r.success)
    return { results, allSucceeded: false, failureReport: firstFailure }
  }

  return { results, allSucceeded: !hasFailure }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = yamlStringify(frontmatter, { lineWidth: -1 })
  const yamlBlock = yaml.endsWith("\n") ? yaml : yaml + "\n"
  return `---\n${yamlBlock}---\n\n${body}\n`
}

function validateFrontmatter<T>(
  schema: import("zod").ZodSchema<T>,
  data: unknown,
  _context: string,
): { success: true; data: T } | { success: false; error: import("zod").ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

function formatCompileError(zodError: import("zod").ZodError): string[] {
  return zodError.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`)
}
