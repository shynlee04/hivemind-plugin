export interface AgentMatchResult {
  agent: string | null
  score: number
  fallback: boolean
  userSpecified: boolean
}

interface Agent {
  name: string
  description?: string
}

/**
 * Normalizes words to common stems and synonyms to improve matching robustness.
 * Helps map action verbs to agent endings (e.g. verify -> verifier, plan -> planner).
 */
export function getWordStems(word: string): string[] {
  const stems = [word]
  const lower = word.toLowerCase()

  // Suffix mappings (action verbs to agent endings)
  if (lower.endsWith("er") || lower.endsWith("or")) {
    stems.push(lower.slice(0, -2))
  }
  if (lower.endsWith("ier")) {
    stems.push(lower.slice(0, -3) + "y")
  }
  if (lower.endsWith("y")) {
    stems.push(lower.slice(0, -1) + "ier")
    stems.push(lower.slice(0, -1) + "icat")
  }
  if (lower.endsWith("e")) {
    stems.push(lower.slice(0, -1) + "er")
    stems.push(lower.slice(0, -1) + "or")
    stems.push(lower.slice(0, -1) + "ion")
  }
  if (lower.endsWith("or")) {
    stems.push(lower.slice(0, -2) + "e")
  }
  if (lower.endsWith("er")) {
    stems.push(lower.slice(0, -2) + "e")
  }

  // Synonym mappings for resilient matching
  const synonymMap: Record<string, string[]> = {
    plan: ["planner", "conduct", "conductor"],
    verify: ["verifier", "verification", "check", "checker"],
    validate: ["verifier", "validator", "validation", "check", "checker"],
    audit: ["auditor", "checker", "reviewer"],
    review: ["reviewer", "auditor"],
    debug: ["debugger", "fixer"],
    fix: ["fixer", "debugger"],
    spec: ["specifier", "specification"],
    write: ["writer", "synthesizer", "doc"],
    doc: ["writer", "synthesizer", "doc"],
    research: ["researcher", "advisor"],
  }

  const synonyms = synonymMap[lower]
  if (synonyms) {
    stems.push(...synonyms)
  }

  return Array.from(new Set(stems))
}

/**
 * Selects an agent based on natural language intent.
 * Keyword + similarity matching with suffix stemming and lineage constraints (no LLM).
 */
export async function selectAgent(
  intent: string,
  agents: Array<{ name: string; id?: string; description?: string }> = []
): Promise<AgentMatchResult> {
  // Normalize agents to Agent object
  const normalizedAgents: Agent[] = agents
    .map((a) => ({
      name: a.name || a.id || "",
      description: a.description || "",
    }))
    .filter((a) => a.name.length > 0)

  if (normalizedAgents.length === 0) {
    return { agent: null, score: 0, fallback: true, userSpecified: false }
  }

  // Extract keywords from intent — split on whitespace AND hyphens
  const keywords = extractKeywords(intent)

  // Dynamic extraction of command prefix/lineage (e.g., "gsd-stats" -> "gsd", "hm-plan" -> "hm", "custom-run" -> "custom")
  const prefixMatch = intent.trim().replace(/^\//, "").match(/^([a-zA-Z0-9]+)-/)
  const commandPrefix = prefixMatch ? prefixMatch[1].toLowerCase() : null

  // Define common functional verbs/keywords that should not be treated as lineage prefixes
  const FUNCTIONAL_VERBS = new Set([
    "plan", "verify", "validate", "audit", "review", "debug", "fix", "spec", "write", "doc", "research", "run"
  ])

  const isLineagePrefix = commandPrefix && !FUNCTIONAL_VERBS.has(commandPrefix)

  // Remove the command prefix itself from keywords to focus matching on functional concepts
  const functionalKeywords = isLineagePrefix
    ? keywords.filter((kw) => kw !== commandPrefix)
    : keywords

  const matchKeywords = functionalKeywords.length > 0 ? functionalKeywords : keywords

  // Filter agents by lineage/prefix matching first
  const prefixCandidates = isLineagePrefix
    ? normalizedAgents.filter((agent) => {
        const nameLower = agent.name.toLowerCase()
        return nameLower.startsWith(commandPrefix + "-") || nameLower === commandPrefix
      })
    : normalizedAgents

  if (prefixCandidates.length > 0) {
    // Score prefix-aligned candidates
    const scored = prefixCandidates.map((agent) => ({
      agent,
      score: calculateSimilarityScore(matchKeywords, agent),
    }))

    scored.sort((a, b) => b.score - a.score)

    if (scored[0].score > 0) {
      return {
        agent: scored[0].agent.name,
        score: scored[0].score,
        fallback: false,
        userSpecified: false,
      }
    }

    // Lineage-aware fallback: if prefix matches, try finding a core orchestrator/executor agent within that lineage
    if (commandPrefix) {
      const fallbackKeywords = ["orchestrator", "coordinator", "executor", "planner"]
      for (const kw of fallbackKeywords) {
        const fallbackAgent = prefixCandidates.find((agent) => agent.name.toLowerCase().includes(kw))
        if (fallbackAgent) {
          return {
            agent: fallbackAgent.name,
            score: 0,
            fallback: true,
            userSpecified: false,
          }
        }
      }
    }
  }

  // Ultimate fallback to "build" agent if available
  const buildAgentExists = normalizedAgents.some((agent) => agent.name.toLowerCase() === "build")
  if (buildAgentExists) {
    return {
      agent: "build",
      score: 0,
      fallback: true,
      userSpecified: false,
    }
  }

  // Fallback to first prefix candidate if any exists
  if (prefixCandidates.length > 0) {
    return {
      agent: prefixCandidates[0].name,
      score: 0,
      fallback: true,
      userSpecified: false,
    }
  }

  // Final fallback
  return {
    agent: null,
    score: 0,
    fallback: true,
    userSpecified: false,
  }
}

const STOP_WORDS = new Set([
  "the", "a", "an", "for", "to", "in", "on", "of", "with", "by", "at", "from", "command"
])

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .flatMap((word) => word.split("-"))
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
}

function calculateSimilarityScore(keywords: string[], agent: Agent): number {
  let score = 0
  const nameLower = agent.name.toLowerCase()
  // Strip lineage prefix (e.g., "gsd-" or "hm-") for exact match checks
  const nameWithoutPrefix = nameLower.replace(/^[a-z0-9]+-/, "")
  
  keywords.forEach((keyword) => {
    const stems = getWordStems(keyword)
    for (const stem of stems) {
      if (nameLower.includes(stem)) {
        score += 1.0
        if (nameLower === stem || nameWithoutPrefix === stem) {
          score += 1.0
        }
        break
      }
    }
  })

  if (agent.description) {
    const descLower = agent.description.toLowerCase()
    keywords.forEach((keyword) => {
      const stems = getWordStems(keyword)
      for (const stem of stems) {
        if (descLower.includes(stem)) {
          score += 0.5
          break
        }
      }
    })
  }

  return score
}

