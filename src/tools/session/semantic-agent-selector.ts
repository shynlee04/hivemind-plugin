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
 * Selects an agent based on natural language intent.
 * Keyword + similarity matching (no LLM).
 * If no matches, prompts the user to input the exact agent name via interactive prompt.
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

  // Determine command prefix (lineage) for targeted agent matching
  const commandPrefix = intent.startsWith("gsd-") ? "gsd" :
    intent.startsWith("hm-") ? "hm" :
    intent.startsWith("hf-") ? "hf" : null

  // Filter agents by keyword + prefix/lineage matching
  const matches = normalizedAgents.filter((agent) => {
    const nameLower = agent.name.toLowerCase()
    const keywordMatch = keywords.some((keyword) => nameLower.includes(keyword))
    const prefixMatch = commandPrefix ? nameLower.startsWith(commandPrefix) : true
    return keywordMatch && prefixMatch
  })

  // If still no matches, try keyword-only (broader search)
  const broadMatches = matches.length === 0 ? normalizedAgents.filter((agent) => {
    const nameLower = agent.name.toLowerCase()
    return keywords.some((keyword) => nameLower.includes(keyword))
  }) : matches

  const finalMatches = broadMatches.length > 0 ? broadMatches : normalizedAgents.filter((agent) => {
    const descLower = agent.description?.toLowerCase() ?? ""
    return keywords.some((keyword) => descLower.includes(keyword))
  })

  // No matches → return clean fallback, no interactive prompt
  if (finalMatches.length === 0) {
    return { agent: null, score: 0, fallback: true, userSpecified: false }
  }

  // Sort by similarity score (fuzzy matching)
  const matchesWithScores = finalMatches.map((agent) => ({
    agent,
    score: calculateSimilarityScore(keywords, agent),
  }))

  matchesWithScores.sort((a, b) => b.score - a.score)

  return {
    agent: matchesWithScores[0].agent.name,
    score: matchesWithScores[0].score,
    fallback: false,
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
  keywords.forEach((keyword) => {
    if (nameLower.includes(keyword)) {
      score += 1.0
      if (nameLower === keyword) score += 1.0
    }
  })

  if (agent.description) {
    const descLower = agent.description.toLowerCase()
    keywords.forEach((keyword) => {
      if (descLower.includes(keyword)) score += 0.5
    })
  }

  return score
}
