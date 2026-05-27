import { createTuiPrompt } from "../../cli/ui/prompts.js"

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
  agents: any[] = []
): Promise<AgentMatchResult> {
  // Normalize agents to Agent object
  const normalizedAgents: Agent[] = agents.map((a) => {
    if (typeof a === "string") {
      return { name: a, description: "" }
    }
    return {
      name: a.name || a.id || "",
      description: a.description || "",
    }
  }).filter((a) => a.name.length > 0)

  if (normalizedAgents.length === 0) {
    return { agent: null, score: 0, fallback: true, userSpecified: false }
  }

  // Extract keywords from intent
  const keywords = extractKeywords(intent)

  // Filter agents by keyword in name/description
  const matches = normalizedAgents.filter((agent) => {
    const nameMatch = keywords.some((keyword) =>
      agent.name.toLowerCase().includes(keyword)
    )
    const descMatch = keywords.some((keyword) =>
      agent.description?.toLowerCase().includes(keyword)
    )
    return nameMatch || descMatch
  })

  // If no matches → ask user to specify exact name (per D-26)
  if (matches.length === 0) {
    const agentNames = normalizedAgents.map((a) => a.name).join(", ")
    const userChoice = await createTuiPrompt({
      type: "text",
      message: "No matching agent found. Please specify exact agent name:",
      hint: `Available agents: ${agentNames}`,
    })

    if (userChoice) {
      const specifiedAgent = normalizedAgents.find(
        (a) => a.name.toLowerCase() === userChoice.trim().toLowerCase()
      )
      if (specifiedAgent) {
        return { agent: specifiedAgent.name, score: 1.0, fallback: false, userSpecified: true }
      }
    }
    return { agent: null, score: 0, fallback: true, userSpecified: false }
  }

  // Sort by similarity score (fuzzy matching)
  const matchesWithScores = matches.map((agent) => ({
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

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 0)
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
