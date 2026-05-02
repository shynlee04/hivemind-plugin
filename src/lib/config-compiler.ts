import { stringify as yamlStringify } from "yaml"
import matter from "gray-matter"
import { homedir } from "node:os"
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs"
import path from "node:path"
import {
  AgentFrontmatterSchema,
  AgentFrontmatterSchemaLenient,
  CommandFrontmatterSchema,
  CommandFrontmatterSchemaLenient,
  SkillFrontmatterSchema,
  SkillFrontmatterSchemaLenient,
  validateWithFallback,
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

export type MixedPrimitiveSpec = {
  type: "agent" | "command" | "skill"
  name: string
  spec: AgentSpec | CommandSpec | SkillSpec
}

export type MixedBatchResult = {
  success: boolean
  results: { type: string; name: string; result: CompileResult }[]
  errors: string[]
  warnings: string[]
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
  let validatedData = spec.frontmatter as Record<string, unknown>

  if (!options?.skipValidation) {
    const frontmatterResult = validateWithFallback(
      AgentFrontmatterSchema,
      AgentFrontmatterSchemaLenient,
      spec.frontmatter,
      `agent "${spec.name}" frontmatter`,
    )
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
    validatedData = frontmatterResult.data as unknown as Record<string, unknown>
  }

  const content = buildMarkdown(validatedData, spec.body)
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
  let validatedData = spec.frontmatter as Record<string, unknown>

  if (!options?.skipValidation) {
    const frontmatterResult = validateWithFallback(
      CommandFrontmatterSchema,
      CommandFrontmatterSchemaLenient,
      spec.frontmatter,
      `command "${spec.name}" frontmatter`,
    )
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
    validatedData = frontmatterResult.data as unknown as Record<string, unknown>
  }

  const content = buildMarkdown(validatedData, spec.body)
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
  let validatedData = spec.frontmatter as Record<string, unknown>

  if (!options?.skipValidation) {
    const frontmatterResult = validateWithFallback(
      SkillFrontmatterSchema,
      SkillFrontmatterSchemaLenient,
      spec.frontmatter,
      `skill "${spec.name}" frontmatter`,
    )
    if (!frontmatterResult.success) {
      return { success: false, content: "", filePath: "", errors: formatCompileError(frontmatterResult.error) }
    }
    validatedData = frontmatterResult.data as unknown as Record<string, unknown>
  }

  const content = buildMarkdown(validatedData, spec.body)
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
  const frontmatterResult = validateWithFallback(
    AgentFrontmatterSchema,
    AgentFrontmatterSchemaLenient,
    parsed.data,
    "decompile agent",
  )
  if (!frontmatterResult.success) {
    return { success: false, spec: null, body: parsed.content.trim(), warnings: formatCompileError(frontmatterResult.error) }
  }
  const body = parsed.content.trim()
  return {
    success: true,
    spec: { name: "unknown", frontmatter: frontmatterResult.data, body },
    body,
    warnings: frontmatterResult.warnings || [],
  }
}

export function decompileCommand(md: string): DecompileResult<CommandSpec> {
  const parsed = matter(md)
  const frontmatterResult = validateWithFallback(
    CommandFrontmatterSchema,
    CommandFrontmatterSchemaLenient,
    parsed.data,
    "decompile command",
  )
  if (!frontmatterResult.success) {
    const body = parsed.content.trim()
    return { success: false, spec: null, body, warnings: formatCompileError(frontmatterResult.error) }
  }
  const body = parsed.content.trim()
  return {
    success: true,
    spec: { name: "unknown", frontmatter: frontmatterResult.data, body },
    body,
    warnings: frontmatterResult.warnings || [],
  }
}

export function decompileSkill(md: string): DecompileResult<SkillSpec> {
  const parsed = matter(md)
  const frontmatterResult = validateWithFallback(
    SkillFrontmatterSchema,
    SkillFrontmatterSchemaLenient,
    parsed.data,
    "decompile skill",
  )
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
    warnings: frontmatterResult.warnings || [],
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
// Mixed-batch compile
// ---------------------------------------------------------------------------

export function mixedBatchCompile(
  specs: MixedPrimitiveSpec[],
  options?: { dryRun?: boolean; validate?: boolean; scope?: "project" | "global"; basePath?: string },
): MixedBatchResult {
  const warnings: string[] = []
  const compileOptions: CompileOptions = {
    scope: options?.scope,
    basePath: options?.basePath,
    skipValidation: options?.validate === false,
  }

  // 1. Cross-type conflict detection (fail fast)
  const nameMap = new Map<string, string[]>() // name -> types[]
  for (const s of specs) {
    const types = nameMap.get(s.name) || []
    types.push(s.type)
    nameMap.set(s.name, types)
  }
  const conflicts: string[] = []
  for (const [name, types] of nameMap) {
    if (types.length > 1) {
      conflicts.push(`Name "${name}" used by multiple primitives: ${types.join(", ")}`)
    }
  }
  if (conflicts.length > 0) {
    return { success: false, results: [], errors: conflicts, warnings }
  }

  // 2. Compile all specs (dry-run phase)
  const compiled: { type: string; name: string; result: CompileResult }[] = []
  for (const s of specs) {
    let result: CompileResult
    switch (s.type) {
      case "agent":
        result = compileAgent(s.spec as AgentSpec, compileOptions)
        break
      case "command":
        result = compileCommand(s.spec as CommandSpec, compileOptions)
        break
      case "skill":
        result = compileSkill(s.spec as SkillSpec, compileOptions)
        break
      default:
        result = { success: false, content: "", filePath: "", errors: ["Unknown primitive type"] }
    }
    compiled.push({ type: s.type, name: s.name, result })
  }

  const compileErrors = compiled.filter(c => !c.result.success).map(c =>
    `Compilation failed for ${c.type} "${c.name}": ${c.result.errors?.join("; ") || "unknown error"}`,
  )
  if (compileErrors.length > 0) {
    return { success: false, results: compiled, errors: compileErrors, warnings }
  }

  // 3. Atomic write (all-or-nothing)
  if (!options?.dryRun) {
    const written: string[] = []
    let writeError: string | null = null
    for (const c of compiled) {
      const fp = c.result.filePath
      try {
        const dir = path.dirname(fp)
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        writeFileSync(fp, c.result.content, "utf-8")
        written.push(fp)
      } catch (e) {
        writeError = `Failed to write ${fp}: ${e instanceof Error ? e.message : String(e)}`
        break
      }
    }
    if (writeError) {
      // Rollback
      for (const fp of written) {
        try {
          if (existsSync(fp)) unlinkSync(fp)
        } catch { /* ignore rollback errors */ }
      }
      return { success: false, results: compiled, errors: [writeError], warnings }
    }
  }

  return { success: true, results: compiled, errors: [], warnings }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = yamlStringify(frontmatter, { lineWidth: -1 })
  const yamlBlock = yaml.endsWith("\n") ? yaml : yaml + "\n"
  return `---\n${yamlBlock}---\n\n${body}\n`
}

function formatCompileError(zodError: import("zod").ZodError): string[] {
  return zodError.issues.map(issue => `${issue.path.join("")}: ${issue.message}`)
}

// ---------------------------------------------------------------------------
// Command bundle discovery (Phase 69 SUP-02)
// ---------------------------------------------------------------------------

export type DiscoveredCommandBundle = {
  name: string
  description: string
  sourcePath: string
}

export function listCommandBundles(results: MixedBatchResult): DiscoveredCommandBundle[] {
  const bundles: DiscoveredCommandBundle[] = []
  for (const item of results.results) {
    if (item.type !== "command") continue
    const result = item.result
    if (!result.success) continue
    const spec = result.content
      .split("---\n")
      .slice(1)
      .join("---\n")
    const desc = spec.split("\n")[0].slice(0, 120)
    bundles.push({
      name: item.name,
      description: desc || item.name,
      sourcePath: result.filePath,
    })
  }
  return bundles
}
