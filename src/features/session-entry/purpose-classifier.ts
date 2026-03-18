import type { PurposeClass } from './start-work-types.js'

const PURPOSE_PATTERNS: Record<PurposeClass, string[]> = {
  discovery: ['what is', 'show me', 'list', 'explain', 'discover', 'explore'],
  brainstorming: ['brainstorm', 'ideate', 'compare', 'option', 'tradeoff', 'evaluate'],
  research: ['research', 'investigate', 'analyze', 'synthesize', 'study', 'survey'],
  planning: ['plan', 'roadmap', 'phase', 'architect', 'spec', 'design'],
  implementation: ['implement', 'build', 'create', 'add', 'refactor', 'wire'],
  gatekeeping: ['review', 'verify', 'validate', 'gate', 'audit', 'check'],
  tdd: ['tdd', 'test', 'failing test', 'red green', 'acceptance test'],
  'course-correction': ['fix direction', 'course correct', 'repair', 'recover', 'realign'],
}

const PURPOSE_ORDER: PurposeClass[] = [
  'course-correction',
  'tdd',
  'gatekeeping',
  'implementation',
  'planning',
  'research',
  'brainstorming',
  'discovery',
]

export interface PurposeClassification {
  purposeClass: PurposeClass
  confidence: number
  reasons: string[]
}

const SAFE_DISCOVERY_PURPOSES: PurposeClass[] = ['research', 'planning', 'brainstorming']
const EXECUTION_PURPOSES: PurposeClass[] = ['implementation', 'tdd', 'gatekeeping', 'course-correction']

function escapeKeyword(keyword: string): string {
  return keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
}

function matchesKeyword(input: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeKeyword(keyword)}\\b`, 'i')
  return pattern.test(input)
}

export function classifyPurpose(userMessage: string, attachments: string[] = []): PurposeClassification {
  const normalized = userMessage.toLowerCase()
  const matchedPurposes = PURPOSE_ORDER
    .map((purpose) => {
      const matches = PURPOSE_PATTERNS[purpose].filter((keyword) => matchesKeyword(normalized, keyword))
      if (attachments.length > 0 && purpose === 'research') {
        matches.push('attachment-context')
      }

      return {
        purpose,
        matches,
        score: matches.length,
      }
    })

  const safePurpose = matchedPurposes.find((entry) => SAFE_DISCOVERY_PURPOSES.includes(entry.purpose) && entry.score > 0)
  const executionPurpose = matchedPurposes.find((entry) => EXECUTION_PURPOSES.includes(entry.purpose) && entry.score > 0)

  if (safePurpose && executionPurpose) {
    return {
      purposeClass: safePurpose.purpose,
      confidence: 0.34,
      reasons: ['mixed-intent', ...safePurpose.matches, ...executionPurpose.matches],
    }
  }

  let bestPurpose: PurposeClass = 'discovery'
  let bestMatches: string[] = []

  for (const { purpose, matches } of matchedPurposes) {
    if (matches.length > bestMatches.length) {
      bestPurpose = purpose
      bestMatches = matches
    }
  }

  return {
    purposeClass: bestPurpose,
    confidence: Math.min(1, Math.max(0.2, bestMatches.length / 3)),
    reasons: bestMatches.length > 0 ? bestMatches : ['default-discovery'],
  }
}
