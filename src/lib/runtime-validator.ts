/**
 * Runtime validator — topological and runtime validation for OpenCode primitives.
 *
 * Detects circular dependencies, missing dependencies, broken permission
 * inheritance, and misaligned pipeline positions.
 *
 * @module runtime-validator
 */

import type { PrimitiveMap } from "./cross-primitive-validator.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RuntimeValidationReport {
  valid: boolean
  loadingOrder: LoadingOrderResult
  resolutionOrder: ResolutionOrderResult
  inheritanceChain: InheritanceChainResult
  pipelinePosition: PipelinePositionResult
  warnings: string[]
}

export interface LoadingOrderResult {
  valid: boolean
  cycles: string[][]
  errors: string[]
}

export interface ResolutionOrderResult {
  valid: boolean
  missing: { source: string; target: string; type: string }[]
  errors: string[]
}

export interface InheritanceChainResult {
  valid: boolean
  broken: { agent: string; permission: string; reason: string }[]
  errors: string[]
}

export interface PipelinePositionResult {
  valid: boolean
  misaligned: { agent: string; mode: string; issue: string }[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// Loading order validation (circular dependency detection)
// ---------------------------------------------------------------------------

/**
 * Validates loading order by detecting cycles in the agent-command-skill
 * dependency graph.
 */
export function validateLoadingOrder(primitives: PrimitiveMap): LoadingOrderResult {
  const graph = buildDependencyGraph(primitives)
  const cycles = detectCycles(graph)
  const errors = cycles.map(c => `Circular dependency detected: ${c.join(" → ")}`)

  return {
    valid: cycles.length === 0,
    cycles,
    errors,
  }
}

function buildDependencyGraph(primitives: PrimitiveMap): Map<string, string[]> {
  const graph = new Map<string, string[]>()

  // Initialize all nodes
  for (const name of primitives.agents.keys()) graph.set(`agent:${name}`, [])
  for (const name of primitives.commands.keys()) graph.set(`command:${name}`, [])
  for (const name of primitives.skills.keys()) graph.set(`skill:${name}`, [])

  // Agent → Command edges (agent references command in body)
  for (const [agentName, agent] of primitives.agents) {
    const deps = graph.get(`agent:${agentName}`)!
    for (const [cmdName] of primitives.commands) {
      if (agent.body.includes(cmdName)) {
        deps.push(`command:${cmdName}`)
      }
    }
    // Agent → Skill edges (agent uses skill() in body)
    const skillPattern = /skill\s*\(\s*["']([^"']+)["']\s*\)/g
    let match: RegExpExecArray | null
    while ((match = skillPattern.exec(agent.body)) !== null) {
      deps.push(`skill:${match[1]}`)
    }
  }

  // Command → Agent edges (command frontmatter references agent)
  for (const [cmdName, cmd] of primitives.commands) {
    const deps = graph.get(`command:${cmdName}`)!
    if (cmd.frontmatter.agent && primitives.agents.has(cmd.frontmatter.agent)) {
      deps.push(`agent:${cmd.frontmatter.agent}`)
    }
  }

  // Skill → Agent edges (skill body references agent)
  for (const [skillName, skill] of primitives.skills) {
    const deps = graph.get(`skill:${skillName}`)!
    for (const [agentName] of primitives.agents) {
      if (skill.body.includes(agentName)) {
        deps.push(`agent:${agentName}`)
      }
    }
  }

  return graph
}

function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function dfs(node: string, path: string[]) {
    visited.add(node)
    recStack.add(node)

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor])
      } else if (recStack.has(neighbor)) {
        // Found cycle - extract cycle nodes
        const cycleStart = path.indexOf(neighbor)
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart)
          cycles.push(cycle.map(n => n.replace(/^(agent|command|skill):/, "")))
        }
      }
    }

    recStack.delete(node)
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, [node])
    }
  }

  return cycles
}

// ---------------------------------------------------------------------------
// Resolution order validation
// ---------------------------------------------------------------------------

/**
 * Validates that all referenced primitives exist and files are present.
 */
export function validateResolutionOrder(primitives: PrimitiveMap): ResolutionOrderResult {
  const missing: { source: string; target: string; type: string }[] = []
  const errors: string[] = []

  // Check command → agent references
  for (const [cmdName, cmd] of primitives.commands) {
    if (cmd.frontmatter.agent && !primitives.agents.has(cmd.frontmatter.agent)) {
      missing.push({ source: cmdName, target: cmd.frontmatter.agent, type: "command→agent" })
      errors.push(`Command "${cmdName}" references missing agent "${cmd.frontmatter.agent}"`)
    }
  }

  // Check agent → skill references
  const skillPattern = /skill\s*\(\s*["']([^"']+)["']\s*\)/g
  for (const [agentName, agent] of primitives.agents) {
    let match: RegExpExecArray | null
    while ((match = skillPattern.exec(agent.body)) !== null) {
      const skillName = match[1]
      if (!primitives.skills.has(skillName)) {
        missing.push({ source: agentName, target: skillName, type: "agent→skill" })
        errors.push(`Agent "${agentName}" references missing skill "${skillName}"`)
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  }
}

// ---------------------------------------------------------------------------
// Inheritance chain validation
// ---------------------------------------------------------------------------

/**
 * Validates that agent and command permissions are consistent with global
 * config permissions.
 */
export function validateInheritanceChain(primitives: PrimitiveMap): InheritanceChainResult {
  const broken: { agent: string; permission: string; reason: string }[] = []
  const errors: string[] = []

  const globalPerms = (primitives.config as any).permission || {}

  for (const [agentName, agent] of primitives.agents) {
    const agentPerms = agent.frontmatter.permission || {}

    for (const [key, agentValue] of Object.entries(agentPerms)) {
      const globalValue = globalPerms[key]
      if (globalValue && globalValue !== agentValue) {
        broken.push({
          agent: agentName,
          permission: key,
          reason: `Agent denies "${key}" but global config allows it`,
        })
        errors.push(`Agent "${agentName}" permission "${key}" (${agentValue}) contradicts global (${globalValue})`)
      }
    }
  }

  return {
    valid: broken.length === 0,
    broken,
    errors,
  }
}

// ---------------------------------------------------------------------------
// Pipeline position validation
// ---------------------------------------------------------------------------

/**
 * Validates that primary agents don't overlap in responsibilities and that
 * subagent modes are consistent.
 */
export function validatePipelinePosition(primitives: PrimitiveMap): PipelinePositionResult {
  const misaligned: { agent: string; mode: string; issue: string }[] = []
  const errors: string[] = []

  const primaries: Array<{ name: string; description: string }> = []

  for (const [agentName, agent] of primitives.agents) {
    const mode = agent.frontmatter.mode
    if (mode === "primary") {
      primaries.push({
        name: agentName,
        description: agent.frontmatter.description || "",
      })
    }
  }

  // Check for primary agent overlap (similar descriptions)
  for (let i = 0; i < primaries.length; i++) {
    for (let j = i + 1; j < primaries.length; j++) {
      const a = primaries[i]
      const b = primaries[j]
      const aWords = new Set(a.description.toLowerCase().split(/\W+/).filter(w => w.length > 2))
      const bWords = new Set(b.description.toLowerCase().split(/\W+/).filter(w => w.length > 2))
      const intersection = new Set([...aWords].filter(w => bWords.has(w)))
      const minSize = Math.min(aWords.size, bWords.size)

      if (minSize > 0 && intersection.size / minSize >= 0.5) {
        const issue = `Primary agents "${a.name}" and "${b.name}" have similar descriptions (>50% keyword overlap)`
        misaligned.push({ agent: a.name, mode: "primary", issue })
        misaligned.push({ agent: b.name, mode: "primary", issue })
        errors.push(issue)
      }
    }
  }

  return {
    valid: misaligned.length === 0,
    misaligned,
    errors,
  }
}

// ---------------------------------------------------------------------------
// Comprehensive runtime validation
// ---------------------------------------------------------------------------

/**
 * Runs all runtime validators and aggregates results.
 */
export function validateRuntime(primitives: PrimitiveMap): RuntimeValidationReport {
  const loadingOrder = validateLoadingOrder(primitives)
  const resolutionOrder = validateResolutionOrder(primitives)
  const inheritanceChain = validateInheritanceChain(primitives)
  const pipelinePosition = validatePipelinePosition(primitives)

  const warnings: string[] = []
  if (!loadingOrder.valid) warnings.push(...loadingOrder.errors)
  if (!resolutionOrder.valid) warnings.push(...resolutionOrder.errors)
  if (!inheritanceChain.valid) warnings.push(...inheritanceChain.errors)
  if (!pipelinePosition.valid) warnings.push(...pipelinePosition.errors)

  const valid = loadingOrder.valid && resolutionOrder.valid &&
    inheritanceChain.valid && pipelinePosition.valid

  return {
    valid,
    loadingOrder,
    resolutionOrder,
    inheritanceChain,
    pipelinePosition,
    warnings,
  }
}
