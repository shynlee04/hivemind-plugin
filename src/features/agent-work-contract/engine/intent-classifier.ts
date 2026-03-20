/**
 * Intent Classifier
 *
 * Regex-based purpose classification with confidence scoring.
 * Determines user intent purpose class, response mode, and governance requirements.
 *
 * @module agent-work-contract/engine/intent-classifier
 */

import type { PurposeClass } from '../schema/index.js'
import type { IntentClassification } from '../schema/index.js'
import { resolveResponseMode } from './response-mode-resolver.js'
import { matchesKeyword } from '../../../shared/keyword-matcher.js'

/**
 * Keyword patterns for each purpose class.
 * Keywords are matched as whole words to avoid false positives.
 */
const PURPOSE_PATTERNS: Record<PurposeClass, string[]> = {
  'quick-action': [
    'fix', 'fixing', 'update', 'refactor', 'rename', 'move', 'delete',
    'change', 'modify', 'edit', 'correct', 'adjust', 'tweak',
    'small', 'quick', 'simple', 'just', 'only', 'single',
    'typo', 'bug', 'bug fix', 'minor', 'clean up', 'cleanup',
    'add comment', 'comment', 'file change', 'hotfix',
  ],
  'research-brainstorm': [
    'research', 'brainstorm', 'explore', 'investigate', 'analyze',
    'compare', 'evaluate', 'option', 'alternatives', 'tradeoffs',
    'what is', 'how does', 'why', 'explain', 'understand',
    'discover', 'learn', 'survey', 'assess', 'consider',
    'ideas', 'pros and cons', 'overview', 'summary',
  ],
  'project-driven': [
    'implement', 'build', 'create', 'develop', 'design',
    'architect', 'construct', 'establish', 'forge', 'craft',
    'module', 'system', 'feature', 'application', 'service',
    'end-to-end', 'complete', 'full', 'entire', 'comprehensive',
    'milestone', 'phase', 'roadmap', 'epic', 'story',
  ],
}

/**
 * Priority order for purpose classification.
 * When multiple patterns match, use this order to resolve conflicts.
 * Project-driven takes precedence as it indicates significant work.
 */
const PURPOSE_PRIORITY: PurposeClass[] = [
  'project-driven',
  'quick-action',
  'research-brainstorm',
]

/**
 * Indicates whether a purpose class requires a plan.
 * Project-driven work always requires planning.
 */
const REQUIRES_PLAN: Record<PurposeClass, boolean> = {
  'quick-action': false,
  'research-brainstorm': false,
  'project-driven': true,
}

/**
 * Indicates whether a purpose class requires governance.
 * Project-driven work requires governance oversight.
 */
const REQUIRES_GOVERNANCE: Record<PurposeClass, boolean> = {
  'quick-action': false,
  'research-brainstorm': false,
  'project-driven': true,
}



/**
 * Classify the purpose of a user's intent based on keyword patterns.
 *
 * @param rawIntent - The raw user input text
 * @returns Intent classification with purpose class, confidence, and metadata
 *
 * @example
 * ```typescript
 * const result = await classifyIntent('implement the authentication feature')
 * // Returns:
 * // {
 * //   intent: {
 * //     raw: 'implement the authentication feature',
 * //     confidence: 0.9,
 * //     purposeClass: 'project-driven',
 * //     requiresPlan: true,
 * //     requiresGovernance: true,
 * //   },
 * //   reasoning: ['matched: implement', 'matched: feature'],
 * //   suggestedResponseMode: 'broad-search-execute',
 * // }
 * ```
 */
export async function classifyIntent(rawIntent: string): Promise<IntentClassification> {
  const normalized = rawIntent.toLowerCase()
  const reasoning: string[] = []
  
  // Find all matching patterns for each purpose class
  const matchResults = PURPOSE_PRIORITY.map((purposeClass) => {
    const keywords = PURPOSE_PATTERNS[purposeClass]
    const matchedKeywords = keywords.filter((keyword) => matchesKeyword(normalized, keyword))
    
    return {
      purposeClass,
      matchedKeywords,
      matchCount: matchedKeywords.length,
    }
  })
  
  // Sort by match count (descending) then by priority
  matchResults.sort((a, b) => {
    const countDiff = b.matchCount - a.matchCount
    if (countDiff !== 0) return countDiff
    
    // Use priority order for tie-breaker
    const aPriority = PURPOSE_PRIORITY.indexOf(a.purposeClass)
    const bPriority = PURPOSE_PRIORITY.indexOf(b.purposeClass)
    return aPriority - bPriority
  })
  
  // Get the best match
  const bestMatch = matchResults[0]
  
  // Calculate confidence based on match count and specificity
  // More matches = higher confidence, capped at 1.0
  // Minimum 0.3 confidence to avoid very low scores
  const baseConfidence = Math.min(1.0, bestMatch.matchCount / 3)
  const confidence = Math.max(0.3, baseConfidence)
  
  // Build reasoning list
  if (bestMatch.matchedKeywords.length > 0) {
    reasoning.push(...bestMatch.matchedKeywords.map((k) => `matched: ${k}`))
  } else {
    reasoning.push('default-classification')
  }
  
  // Add conflict resolution to reasoning if needed
  if (matchResults.length > 1 && matchResults[1].matchCount > 0) {
    reasoning.push(`priority-resolved: ${bestMatch.purposeClass} over ${matchResults[1].purposeClass}`)
  }
  
  return {
    intent: {
      raw: rawIntent,
      confidence,
      purposeClass: bestMatch.purposeClass,
      requiresPlan: REQUIRES_PLAN[bestMatch.purposeClass],
      requiresGovernance: REQUIRES_GOVERNANCE[bestMatch.purposeClass],
    },
    reasoning,
    suggestedResponseMode: resolveResponseMode(bestMatch.purposeClass),
  }
}