import { promises as fs, existsSync } from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import {
  AgentFrontmatterSchemaLenient,
  CommandFrontmatterSchemaLenient,
  SkillFrontmatterSchemaLenient,
  OpenCodeConfigSchemaLenient,
  MCPServerConfigSchemaLenient,
} from "../schema-kernel/index.js"
import type {
  AgentFile,
  CommandFile,
  SkillFile,
  ToolFile,
  MCPServerConfig,
  OpenCodeConfig,
} from "../schema-kernel/index.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrimitiveType = "agent" | "command" | "skill" | "tool" | "mcp"

export interface LoaderOptions {
  /** Absolute or relative path to the project root. */
  projectRoot: string
  /** Optional path to global config directory (~/.config/opencode/). */
  globalConfigPath?: string
  /** Optional path to opencode.json (defaults to projectRoot/opencode.json). */
  opencodeJsonPath?: string
}

export interface LoadResult {
  agents: Map<string, AgentFile>
  commands: Map<string, CommandFile>
  skills: Map<string, SkillFile>
  mcpServers: Map<string, MCPServerConfig>
  config: OpenCodeConfig | null
  warnings: string[]
}

export type PrimitiveMap = {
  agents: Map<string, AgentFile>
  commands: Map<string, CommandFile>
  skills: Map<string, SkillFile>
  tools: Map<string, ToolFile>
  mcpServers: Map<string, MCPServerConfig>
  config: OpenCodeConfig
}

export type SingleLoadResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Directory scanner
// ---------------------------------------------------------------------------

/**
 * Scans the `.opencode/` directory tree for agents, commands, skills, and
 * tools; reads `opencode.json`; validates all found files against lenient
 * schemas; and returns a populated {@link LoadResult} with cross-reference
 * warnings.
 */
export async function loadPrimitives(options: LoaderOptions): Promise<LoadResult> {
  const root = path.resolve(options.projectRoot)
  const opencodeJsonPath = options.opencodeJsonPath || path.join(root, "opencode.json")

  const result: LoadResult = {
    agents: new Map(),
    commands: new Map(),
    skills: new Map(),
    mcpServers: new Map(),
    config: null,
    warnings: [],
  }

  // Scan directories
  await scanAgents(root, result)
  await scanCommands(root, result)
  await scanSkills(root, result)

  // Read opencode.json
  const configResult = await readOpencodeJson(opencodeJsonPath, result)
  if (configResult) {
    result.config = configResult
  }

  // Cross-reference validation
  await crossReference(root, result, opencodeJsonPath)

  return result
}

// ---------------------------------------------------------------------------
// Single-file loader
// ---------------------------------------------------------------------------

/**
 * Reads and parses a single primitive file from disk.
 *
 * @param filePath - Absolute path to the .md file
 * @param type     - Primitive type determines which schema to use
 */
export async function loadPrimitive(
  filePath: string,
  type: PrimitiveType,
): Promise<SingleLoadResult<AgentFile | CommandFile | SkillFile>> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const parsed = matter(content)
    const body = parsed.content.trim()

    switch (type) {
      case "agent": {
        const fmResult = AgentFrontmatterSchemaLenient.safeParse(parsed.data)
        if (!fmResult.success) {
          return { success: false, error: formatZodError(fmResult.error) }
        }
        const data: AgentFile = {
          frontmatter: fmResult.data,
          body,
          filePath,
        }
        return { success: true, data }
      }
      case "command": {
        const fmResult = CommandFrontmatterSchemaLenient.safeParse(parsed.data)
        if (!fmResult.success) {
          return { success: false, error: formatZodError(fmResult.error) }
        }
        const data: CommandFile = {
          frontmatter: fmResult.data,
          body,
          filePath,
        }
        return { success: true, data }
      }
      case "skill": {
        const fmResult = SkillFrontmatterSchemaLenient.safeParse(parsed.data)
        if (!fmResult.success) {
          return { success: false, error: formatZodError(fmResult.error) }
        }
        const dirName = path.basename(path.dirname(filePath))
        const data: SkillFile = {
          frontmatter: fmResult.data,
          body,
          directoryName: dirName,
          skillPath: filePath,
        }
        return { success: true, data }
      }
      default:
        return { success: false, error: `Unsupported primitive type for single-file load: ${type}` }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------------------------------------------------------------------------
// Scanners
// ---------------------------------------------------------------------------

async function scanAgents(root: string, result: LoadResult): Promise<void> {
  const agentsDir = path.join(root, ".opencode", "agents")
  if (!existsSync(agentsDir)) return

  const files = await fs.readdir(agentsDir)
  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const filePath = path.join(agentsDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const loadResult = await loadPrimitive(filePath, "agent")
    if (loadResult.success) {
      const name = file.replace(/\.md$/, "")
      result.agents.set(name, loadResult.data as AgentFile)
    } else {
      result.warnings.push(`Invalid agent frontmatter in ${filePath}: ${loadResult.error}`)
    }
  }
}

async function scanCommands(root: string, result: LoadResult): Promise<void> {
  const commandsDir = path.join(root, ".opencode", "commands")
  if (!existsSync(commandsDir)) return

  const files = await fs.readdir(commandsDir)
  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const filePath = path.join(commandsDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const loadResult = await loadPrimitive(filePath, "command")
    if (loadResult.success) {
      const name = file.replace(/\.md$/, "")
      result.commands.set(name, loadResult.data as CommandFile)
    } else {
      result.warnings.push(`Invalid command frontmatter in ${filePath}: ${loadResult.error}`)
    }
  }
}

async function scanSkills(root: string, result: LoadResult): Promise<void> {
  const skillsDir = path.join(root, ".opencode", "skills")
  if (!existsSync(skillsDir)) return

  const entries = await fs.readdir(skillsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md")
    if (!existsSync(skillPath)) continue

    const loadResult = await loadPrimitive(skillPath, "skill")
    if (loadResult.success) {
      result.skills.set(entry.name, loadResult.data as SkillFile)
    } else {
      result.warnings.push(`Invalid skill frontmatter in ${skillPath}: ${loadResult.error}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Config reader
// ---------------------------------------------------------------------------

async function readOpencodeJson(
  opencodeJsonPath: string,
  result: LoadResult,
): Promise<OpenCodeConfig | null> {
  if (!existsSync(opencodeJsonPath)) return null

  try {
    const content = await fs.readFile(opencodeJsonPath, "utf-8")
    const raw = JSON.parse(content)
    const parsed = OpenCodeConfigSchemaLenient.safeParse(raw)
    if (!parsed.success) {
      result.warnings.push(`Invalid opencode.json: ${formatZodError(parsed.error)}`)
      return null
    }

    // Extract MCP servers if present
    if (raw.mcp && typeof raw.mcp === "object") {
      for (const [name, cfg] of Object.entries(raw.mcp)) {
        const mcpResult = MCPServerConfigSchemaLenient.safeParse(cfg)
        if (mcpResult.success) {
          result.mcpServers.set(name, mcpResult.data)
        } else {
          result.warnings.push(`Invalid MCP server config "${name}": ${formatZodError(mcpResult.error)}`)
        }
      }
    }

    return parsed.data
  } catch (err) {
    result.warnings.push(`Failed to read opencode.json: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Cross-reference validation
// ---------------------------------------------------------------------------

async function crossReference(
  _root: string,
  result: LoadResult,
  opencodeJsonPath: string,
): Promise<void> {
  if (!existsSync(opencodeJsonPath)) return

  let raw: Record<string, unknown> | null = null
  try {
    const content = await fs.readFile(opencodeJsonPath, "utf-8")
    raw = JSON.parse(content) as Record<string, unknown>
  } catch {
    return
  }

  if (raw.agent && typeof raw.agent === "object") {
    const configAgents = new Set(Object.keys(raw.agent))
    for (const [name] of result.agents) {
      if (!configAgents.has(name)) {
        result.warnings.push(`Orphaned agent "${name}": exists on disk but not referenced in opencode.json`)
      }
    }
  }

  if (raw.command && typeof raw.command === "object") {
    const configCommands = new Set(Object.keys(raw.command))
    for (const [name] of result.commands) {
      if (!configCommands.has(name)) {
        result.warnings.push(`Orphaned command "${name}": exists on disk but not referenced in opencode.json`)
      }
    }
  }

  if (raw.skill && typeof raw.skill === "object") {
    const configSkills = new Set(Object.keys(raw.skill))
    for (const [name] of result.skills) {
      if (!configSkills.has(name)) {
        result.warnings.push(`Orphaned skill "${name}": exists on disk but not referenced in opencode.json`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatZodError(error: import("zod").ZodError): string {
  return error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")
}
