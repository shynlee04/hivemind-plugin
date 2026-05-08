/**
 * @module purpose-classifier
 * @description SEI-01 — Classifies user input into one of 8 purpose classes
 * using keyword matching with confidence scoring.
 *
 * Purpose classes represent the high-level intent of a session entry,
 * enabling the intake gate to route to the appropriate specialist agent.
 */

/** The 8 purpose classes for session intake classification */
export type PurposeClass =
  | "discovery"
  | "brainstorming"
  | "research"
  | "planning"
  | "implementation"
  | "gatekeeping"
  | "tdd"
  | "course-correction"

/** Ordered list of all valid purpose classes */
export const PURPOSE_CLASSES: readonly PurposeClass[] = [
  "discovery",
  "brainstorming",
  "research",
  "planning",
  "implementation",
  "gatekeeping",
  "tdd",
  "course-correction",
] as const

/** Result of purpose classification */
export interface ClassificationResult {
  /** The top-scoring purpose class */
  purpose: PurposeClass
  /** Confidence score between 0 and 1 */
  confidence: number
  /** Alternative purpose classes sorted by descending confidence */
  alternatives: PurposeClass[]
}

/**
 * Keyword definition with explicit weight.
 * Multi-word phrases get higher weight because they are more specific.
 * Weight determines how strongly a match contributes to the class score.
 */
interface KeywordDef {
  readonly keyword: string
  readonly weight: number
}

/**
 * Keywords mapped to each purpose class with explicit weights.
 * More specific phrases (multi-word) get higher weight to disambiguate
 * from overlapping single-word keywords in other classes.
 */
const PURPOSE_KEYWORDS: Record<PurposeClass, readonly KeywordDef[]> = {
  discovery: [
    { keyword: "explore", weight: 1 },
    { keyword: "what is", weight: 1.5 },
    { keyword: "how does", weight: 1.5 },
    { keyword: "what are", weight: 1.5 },
    { keyword: "show me", weight: 1.5 },
    { keyword: "explain", weight: 1 },
    { keyword: "describe", weight: 1 },
    { keyword: "understand", weight: 1 },
  ],
  brainstorming: [
    { keyword: "let's brainstorm", weight: 2.5 },
    { keyword: "brainstorm", weight: 2 },
    { keyword: "ideate", weight: 2 },
    { keyword: "think through", weight: 2 },
    { keyword: "come up with", weight: 2 },
    { keyword: "ideas for", weight: 2 },
    { keyword: "generate ideas", weight: 2 },
  ],
  research: [
    { keyword: "research", weight: 2 },
    { keyword: "investigate", weight: 2 },
    { keyword: "analyze", weight: 2 },
    { keyword: "compare", weight: 1.5 },
    { keyword: "evaluate", weight: 1.5 },
    { keyword: "look into", weight: 2 },
    { keyword: "find out", weight: 1.5 },
    { keyword: "deep dive", weight: 2 },
  ],
  planning: [
    { keyword: "plan", weight: 2 },
    { keyword: "break down", weight: 2 },
    { keyword: "roadmap", weight: 2 },
    { keyword: "strategy", weight: 1.5 },
    { keyword: "milestone", weight: 1.5 },
    { keyword: "phase", weight: 1 },
    { keyword: "organize", weight: 1 },
    { keyword: "structure", weight: 1 },
    { keyword: "scope", weight: 1 },
  ],
  implementation: [
    { keyword: "implement", weight: 2 },
    { keyword: "build", weight: 1.5 },
    { keyword: "create", weight: 1.5 },
    { keyword: "fix the", weight: 2 },
    { keyword: "add", weight: 1 },
    { keyword: "develop", weight: 1.5 },
    { keyword: "code", weight: 0.8 },
  ],
  gatekeeping: [
    { keyword: "verify", weight: 2.5 },
    { keyword: "validate", weight: 2.5 },
    { keyword: "review", weight: 2.5 },
    { keyword: "gate check", weight: 3 },
    { keyword: "gate keep", weight: 3 },
    { keyword: "gatekeeping", weight: 3 },
    { keyword: "audit", weight: 2 },
    { keyword: "inspect", weight: 2 },
    { keyword: "approve", weight: 2 },
    { keyword: "ensure", weight: 2 },
    { keyword: " check", weight: 2 },
  ],
  tdd: [
    { keyword: "tests", weight: 2.5 },
    { keyword: "test", weight: 2 },
    { keyword: "tdd", weight: 3 },
    { keyword: "red-green", weight: 3 },
    { keyword: "red green refactor", weight: 3.5 },
    { keyword: "test-driven", weight: 3 },
    { keyword: "unit test", weight: 2.5 },
    { keyword: "spec test", weight: 2.5 },
  ],
  "course-correction": [
    { keyword: "wrong", weight: 2.5 },
    { keyword: "bug", weight: 2.5 },
    { keyword: "broken", weight: 2.5 },
    { keyword: "error", weight: 2.5 },
    { keyword: "regression", weight: 3 },
    { keyword: "fail", weight: 2 },
    { keyword: "crash", weight: 2.5 },
    { keyword: "issue", weight: 1.5 },
    { keyword: "problem", weight: 1.5 },
    { keyword: "not working", weight: 3 },
    { keyword: "doesn't work", weight: 3 },
  ],
}

/**
 * Classifies user input into a purpose class using keyword matching.
 *
 * @param input - The raw user input string to classify
 * @returns ClassificationResult with top purpose, confidence, and alternatives
 *
 * @example
 * ```typescript
 * const result = classifyPurpose("implement the caching layer")
 * // { purpose: "implementation", confidence: 0.85, alternatives: ["planning", "tdd"] }
 * ```
 */
export function classifyPurpose(input: string): ClassificationResult {
  const normalized = input.toLowerCase().trim()

  if (normalized.length === 0) {
    return {
      purpose: "discovery",
      confidence: 0,
      alternatives: [],
    }
  }

  const scores = new Map<PurposeClass, number>()

  for (const cls of PURPOSE_CLASSES) {
    const keywordDefs = PURPOSE_KEYWORDS[cls]
    let score = 0

    for (const def of keywordDefs) {
      if (normalized.includes(def.keyword)) {
        score += def.weight
      }
    }

    scores.set(cls, score)
  }

  const sorted = [...PURPOSE_CLASSES].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
  const topScore = scores.get(sorted[0]) ?? 0
  const totalScore = [...scores.values()].reduce((sum, s) => sum + s, 0)

  const confidence = totalScore > 0 ? Math.min(topScore / totalScore, 1) : 0

  return {
    purpose: sorted[0],
    confidence: Math.round(confidence * 100) / 100,
    alternatives: sorted.slice(1).filter((cls) => (scores.get(cls) ?? 0) > 0),
  }
}
