import type { SessionMemoryCategory } from "../schemas/brain-state.js"

export const SESSION_MEMORY_CATEGORIES: SessionMemoryCategory[] = [
  "discovery_brainstorming_discuss",
  "research_synthesis",
  "codebase_investigation",
  "planning",
  "implementing",
  "debug",
  "test_validation_gatekeeping",
]

export interface SessionMemoryArtifact {
  content: string
  source?: string
  tool?: string
}

export interface ClassifiedSessionMemory {
  category: SessionMemoryCategory
  confidence: number
  reasons: string[]
}

const CATEGORY_KEYWORDS: Record<SessionMemoryCategory, string[]> = {
  discovery_brainstorming_discuss: ["brainstorm", "ideate", "discuss", "explore option", "hypothesis"],
  research_synthesis: ["research", "synthesis", "source", "compare", "analysis"],
  codebase_investigation: ["trace", "inspect", "grep", "scan", "codebase", "where is"],
  planning: ["plan", "roadmap", "milestone", "task breakdown", "acceptance criteria"],
  implementing: ["implement", "patch", "refactor", "add function", "wire up"],
  debug: ["bug", "failure", "error", "exception", "root cause", "repro"],
  test_validation_gatekeeping: ["test", "validation", "verify", "gate", "assert", "tsc", "lint"],
}

function scoreCategory(text: string, category: SessionMemoryCategory): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  for (const keyword of CATEGORY_KEYWORDS[category]) {
    if (text.includes(keyword)) {
      score += 1
      reasons.push(`keyword:${keyword}`)
    }
  }
  return { score, reasons }
}

export function classifySessionMemoryArtifact(
  artifact: SessionMemoryArtifact
): ClassifiedSessionMemory {
  const normalizedText = artifact.content.toLowerCase()
  let winner: SessionMemoryCategory = "planning"
  let winnerScore = -1
  let winnerReasons: string[] = []

  for (const category of SESSION_MEMORY_CATEGORIES) {
    const { score, reasons } = scoreCategory(normalizedText, category)
    if (score > winnerScore) {
      winner = category
      winnerScore = score
      winnerReasons = reasons
    }
  }

  if (winnerScore <= 0) {
    if (artifact.tool === "read" || artifact.tool === "grep") {
      winner = "codebase_investigation"
      winnerReasons = ["tool:read-path"]
    } else if (artifact.tool === "write" || artifact.tool === "edit") {
      winner = "implementing"
      winnerReasons = ["tool:write-path"]
    } else {
      winner = "planning"
      winnerReasons = ["fallback:planning"]
    }
  }

  return {
    category: winner,
    confidence: Math.min(1, Math.max(0.2, winnerScore / 4)),
    reasons: winnerReasons,
  }
}

export function summarizeMemoryCategories(
  artifacts: SessionMemoryArtifact[]
): Record<SessionMemoryCategory, number> {
  const summary: Record<SessionMemoryCategory, number> = {
    discovery_brainstorming_discuss: 0,
    research_synthesis: 0,
    codebase_investigation: 0,
    planning: 0,
    implementing: 0,
    debug: 0,
    test_validation_gatekeeping: 0,
  }

  for (const artifact of artifacts) {
    const classified = classifySessionMemoryArtifact(artifact)
    summary[classified.category] += 1
  }

  return summary
}
