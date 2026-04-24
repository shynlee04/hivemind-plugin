import type {
  AgentFile, CommandFile, SkillFile, ToolFile,
  MCPServerConfig, OpenCodeConfig,
} from "../schema-kernel/index.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationSeverity = "block" | "warn" | "info"

export type ValidationCategory =
  | "agent-command-binding"
  | "permission-deadlock"
  | "role-overlap"
  | "missing-skill-dependency"
  | "mcp-server-gap"
  | "rule-file-gap"
  | "missing-model"
  | "command-skill-ref"

export type ValidationIssue = {
  severity: ValidationSeverity
  category: ValidationCategory
  message: string
  source: { type: string; name: string }
  target?: { type: string; name: string }
}

export type ValidationReport = {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  info: ValidationIssue[]
}

export type PrimitiveMap = {
  agents: Map<string, AgentFile>
  commands: Map<string, CommandFile>
  skills: Map<string, SkillFile>
  tools: Map<string, ToolFile>
  mcpServers: Map<string, MCPServerConfig>
  config: OpenCodeConfig
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export function validateCrossPrimitive(primitives: PrimitiveMap): ValidationReport {
  const issues: ValidationIssue[] = [
    ...detectMissingAgentBindings(primitives.commands, primitives.agents),
    ...detectPermissionDeadlocks(primitives.agents, primitives.commands),
    ...detectRoleOverlaps(primitives.agents),
    ...detectMissingSkillDependencies(primitives.agents, primitives.skills),
    ...detectMCPServerGaps(primitives.tools, primitives.mcpServers),
    ...detectRuleFileGaps(primitives.config),
  ]

  const { errors, warnings, info } = partitionBySeverity(issues)
  return { valid: errors.length === 0, errors, warnings, info }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectMissingAgentBindings(
  commands: Map<string, CommandFile>,
  agents: Map<string, AgentFile>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const [name, cmd] of commands) {
    const agentName = cmd.frontmatter.agent
    if (agentName && !agents.has(agentName)) {
      issues.push({
        severity: "block",
        category: "agent-command-binding",
        message: `Command "${name}" references non-existent agent "${agentName}"`,
        source: { type: "command", name },
        target: { type: "agent", name: agentName },
      })
    }
  }
  return issues
}

function detectPermissionDeadlocks(
  agents: Map<string, AgentFile>,
  commands: Map<string, CommandFile>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const [agentName, agent] of agents) {
    const perms = agent.frontmatter.permission
    if (!perms || typeof perms !== "object") continue

    const deniedTools = Object.entries(perms)
      .filter(([, v]) => v === "deny")
      .map(([k]) => k)

    if (deniedTools.length === 0) continue

    for (const [cmdName, cmd] of commands) {
      if (cmd.frontmatter.agent !== agentName) continue
      for (const tool of deniedTools) {
        if (cmd.body.includes(tool)) {
          issues.push({
            severity: "warn",
            category: "permission-deadlock",
            message: `Agent "${agentName}" denies tool "${tool}" but command "${cmdName}" uses it`,
            source: { type: "agent", name: agentName },
            target: { type: "command", name: cmdName },
          })
        }
      }
    }
  }
  return issues
}

function detectRoleOverlaps(agents: Map<string, AgentFile>): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const primaries: Array<{ name: string; words: Set<string> }> = []

  for (const [name, agent] of agents) {
    if (agent.frontmatter.mode === "primary") {
      const text = `${agent.frontmatter.description ?? ""} ${agent.body}`
      const words = new Set(
        text.toLowerCase().split(/\W+/).filter(w => w.length > 2),
      )
      primaries.push({ name, words })
    }
  }

  for (let i = 0; i < primaries.length; i++) {
    for (let j = i + 1; j < primaries.length; j++) {
      const a = primaries[i]
      const b = primaries[j]
      const intersection = new Set([...a.words].filter(w => b.words.has(w)))
      const minSize = Math.min(a.words.size, b.words.size)
      if (minSize > 0 && intersection.size / minSize >= 0.5) {
        issues.push({
          severity: "warn",
          category: "role-overlap",
          message: `Primary agents "${a.name}" and "${b.name}" have similar descriptions (>50% keyword overlap)`,
          source: { type: "agent", name: a.name },
          target: { type: "agent", name: b.name },
        })
      }
    }
  }

  return issues
}

function detectMissingSkillDependencies(
  agents: Map<string, AgentFile>,
  skills: Map<string, SkillFile>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const skillRefPattern = /skill\s*\(\s*["']([^"']+)["']\s*\)/g

  for (const [name, agent] of agents) {
    let match: RegExpExecArray | null
    while ((match = skillRefPattern.exec(agent.body)) !== null) {
      const skillName = match[1]
      if (!skills.has(skillName)) {
        issues.push({
          severity: "warn",
          category: "missing-skill-dependency",
          message: `Agent "${name}" references non-existent skill "${skillName}"`,
          source: { type: "agent", name },
          target: { type: "skill", name: skillName },
        })
      }
    }
  }

  return issues
}

function detectMCPServerGaps(
  tools: Map<string, ToolFile>,
  mcpServers: Map<string, MCPServerConfig>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const [name, tool] of tools) {
    const isMcpRelated = tool.definition.name.toLowerCase().includes("mcp")
    const argsStr = JSON.stringify(tool.definition.args).toLowerCase()
    const hasMcpRef = argsStr.includes("mcp") || argsStr.includes("server")

    if (isMcpRelated || hasMcpRef) {
      // Check if any referenced server names in args exist in mcpServers
      const serverNames = extractServerNames(tool.definition.args)
      for (const serverName of serverNames) {
        if (!mcpServers.has(serverName)) {
          issues.push({
            severity: "warn",
            category: "mcp-server-gap",
            message: `Tool "${name}" references unconfigured MCP server "${serverName}"`,
            source: { type: "tool", name },
            target: { type: "mcp-server", name: serverName },
          })
        }
      }
      // If no specific server name found but MCP-related, emit generic warning
      if (serverNames.length === 0 && mcpServers.size === 0) {
        issues.push({
          severity: "warn",
          category: "mcp-server-gap",
          message: `Tool "${name}" is MCP-related but no MCP servers are configured`,
          source: { type: "tool", name },
        })
      }
    }
  }

  return issues
}

function extractServerNames(args: Record<string, unknown>): string[] {
  const names: string[] = []
  const str = JSON.stringify(args)
  // Look for "server": "value" or "serverName": "value" patterns
  const patterns = [
    /"server"\s*:\s*"([^"]+)"/g,
    /"serverName"\s*:\s*"([^"]+)"/g,
    /"name"\s*:\s*"([^"]+)"/g,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(str)) !== null) {
      names.push(match[1])
    }
  }
  return [...new Set(names)]
}

function detectRuleFileGaps(config: OpenCodeConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const instructions = config.instructions
  if (!Array.isArray(instructions)) return issues

  for (let i = 0; i < instructions.length; i++) {
    const path = instructions[i]
    if (typeof path !== "string" || path.trim().length === 0) {
      issues.push({
        severity: "block",
        category: "rule-file-gap",
        message: `Config instructions[${i}] is not a valid path`,
        source: { type: "config", name: "instructions" },
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function partitionBySeverity(issues: ValidationIssue[]) {
  return {
    errors: issues.filter(i => i.severity === "block"),
    warnings: issues.filter(i => i.severity === "warn"),
    info: issues.filter(i => i.severity === "info"),
  }
}
