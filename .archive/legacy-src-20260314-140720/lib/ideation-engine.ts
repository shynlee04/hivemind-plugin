/**
 * Q.U.A.N.T. Ideation Clarity Engine — deterministic spec evaluation.
 *
 * Five dimensions:
 *   Q - Quantifiable Ambiguity Index (QAI): No weasel words
 *   U - Unhappy Path Saturation (UPS): 5-state MECE matrix complete
 *   A - Architectural Grounding Score (AGS): MCP research citations exist
 *   N - Noun Resolution (NR): All entities map to known symbols or declare new schemas
 *   T - TDD Materialization (TDD-M): Given/When/Then vectors exist
 */

// The banned weasel words list
const WEASEL_WORDS = [
  "fast", "scalable", "robust", "user-friendly", "seamless",
  "high-performance", "real-time", "lightweight", "secure",
  "modern", "efficient", "clean", "simple", "intuitive",
  "flexible", "powerful", "elegant", "smart", "optimized",
]

const MECE_STATES = ["ideal", "empty", "latency", "partial_failure", "destructive"] as const

export interface ClarityDimension {
  dimension: string
  passed: boolean
  score: number  // 0-100
  warnings: string[]
}

export interface ClarityResult {
  passed: boolean
  overallScore: number  // 0-100
  dimensions: ClarityDimension[]
  warnings: string[]
}

/**
 * Evaluate a spec against the Q.U.A.N.T. Matrix.
 *
 * @param spec - The ideation spec (parsed or raw object)
 * @param knownSymbols - Array of known codebase symbol names (from compressed codemap signatures)
 * @returns ClarityResult with per-dimension scoring
 */
export function measureIdeationClarity(
  spec: Record<string, unknown>,
  knownSymbols: string[] = [],
): ClarityResult {
  const dimensions: ClarityDimension[] = []
  const allWarnings: string[] = []
  const textPayload = JSON.stringify(spec).toLowerCase()

  // ─── Q: Quantifiable Ambiguity Index (QAI) ───
  const foundWeasels = WEASEL_WORDS.filter(w => textPayload.includes(w))
  const qaiPassed = foundWeasels.length === 0
  const qaiWarnings = qaiPassed ? [] : [
    `[QAI FAILED] Remove subjective words: [${foundWeasels.join(", ")}]. Replace with quantifiable SLAs.`
  ]
  dimensions.push({
    dimension: "QAI",
    passed: qaiPassed,
    score: qaiPassed ? 100 : Math.max(0, 100 - foundWeasels.length * 20),
    warnings: qaiWarnings,
  })
  allWarnings.push(...qaiWarnings)

  // ─── U: Unhappy Path Saturation (UPS) ───
  const requirements = (spec as any).requirements as any[] | undefined
  const upsWarnings: string[] = []
  let upsMissing = 0
  let upsTotal = 0
  if (requirements && Array.isArray(requirements)) {
    for (const req of requirements) {
      const states = req.state_matrix || {}
      const missing = MECE_STATES.filter(s => !states[s] || (typeof states[s] === "string" && states[s].trim().length < 10))
      upsMissing += missing.length
      upsTotal += MECE_STATES.length
      if (missing.length > 0) {
        upsWarnings.push(`[UPS FAILED] Feature '${req.feature_name || "unknown"}' missing/insufficient states: ${missing.join(", ")}`)
      }
    }
  } else {
    upsWarnings.push("[UPS FAILED] No requirements array found in spec")
    upsTotal = 1
    upsMissing = 1
  }
  const upsPassed = upsWarnings.length === 0
  dimensions.push({
    dimension: "UPS",
    passed: upsPassed,
    score: upsTotal > 0 ? Math.round(((upsTotal - upsMissing) / upsTotal) * 100) : 0,
    warnings: upsWarnings,
  })
  allWarnings.push(...upsWarnings)

  // ─── A: Architectural Grounding Score (AGS) ───
  const mcpRefs = (spec as any).mcp_research_refs as string[] | undefined
  const agsHasRefs = Array.isArray(mcpRefs) && mcpRefs.length > 0
  const agsWarnings = agsHasRefs ? [] : [
    "[AGS FAILED] No MCP research citations found. Use deepwiki or git MCP to validate stack compatibility."
  ]
  dimensions.push({
    dimension: "AGS",
    passed: agsHasRefs,
    score: agsHasRefs ? 100 : 0,
    warnings: agsWarnings,
  })
  allWarnings.push(...agsWarnings)

  // ─── N: Noun Resolution (NR) ───
  // Extract capitalized words (potential entity names) from the text
  const rawText = JSON.stringify(spec)
  const potentialEntities = rawText.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []
  // Filter out common non-entity words
  const COMMON_WORDS = new Set(["Given", "When", "Then", "The", "This", "That", "JSON", "HTTP", "API", "URL", "UUID", "String", "Array", "Boolean", "Number", "Error", "Promise", "Date", "Object", "Record", "Map", "Set", "Null", "True", "False", "Function"])
  const uniqueEntities = [...new Set(potentialEntities)].filter(e => !COMMON_WORDS.has(e))
  const unresolvedEntities = uniqueEntities.filter(e => !knownSymbols.some(s => s.includes(e)))
  const nrThreshold = 5  // Allow some tolerance for generic words
  const nrPassed = unresolvedEntities.length <= nrThreshold
  const nrWarnings = nrPassed ? [] : [
    `[NR FAILED] ${unresolvedEntities.length} entities not grounded in codebase: ${unresolvedEntities.slice(0, 5).join(", ")}. Map to existing AST symbols or declare new schemas.`
  ]
  dimensions.push({
    dimension: "NR",
    passed: nrPassed,
    score: uniqueEntities.length > 0 ? Math.round(((uniqueEntities.length - Math.max(0, unresolvedEntities.length - nrThreshold)) / uniqueEntities.length) * 100) : 100,
    warnings: nrWarnings,
  })
  allWarnings.push(...nrWarnings)

  // ─── T: TDD Materialization (TDD-M) ───
  const tddWarnings: string[] = []
  let tddTotal = 0
  let tddValid = 0
  if (requirements && Array.isArray(requirements)) {
    for (const req of requirements) {
      const vectors = req.tdd_vectors as string[] | undefined
      tddTotal++
      if (!Array.isArray(vectors) || vectors.length === 0) {
        tddWarnings.push(`[TDD-M FAILED] Feature '${req.feature_name || "unknown"}' has no Given/When/Then test vectors`)
      } else {
        const validVectors = vectors.filter((v: string) => /^(Given|When|Then)/i.test(v))
        if (validVectors.length === vectors.length) {
          tddValid++
        } else {
          tddWarnings.push(`[TDD-M FAILED] Feature '${req.feature_name || "unknown"}' has ${vectors.length - validVectors.length} vectors not starting with Given/When/Then`)
        }
      }
    }
  } else {
    tddWarnings.push("[TDD-M FAILED] No requirements array found")
    tddTotal = 1
  }
  const tddPassed = tddWarnings.length === 0
  dimensions.push({
    dimension: "TDD-M",
    passed: tddPassed,
    score: tddTotal > 0 ? Math.round((tddValid / tddTotal) * 100) : 0,
    warnings: tddWarnings,
  })
  allWarnings.push(...tddWarnings)

  // ─── Overall ───
  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)

  return {
    passed: dimensions.every(d => d.passed),
    overallScore,
    dimensions,
    warnings: allWarnings,
  }
}
