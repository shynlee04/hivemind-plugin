/**
 * Intent Classifier
 * Detect user intent from prompts (≤200 LOC)
 */

import { log } from '../../shared/logging.js'

export type IntentType = 
  | 'implementation'
  | 'research'
  | 'planning'
  | 'debugging'
  | 'exploration'
  | 'governance'
  | 'maintenance'
  | 'unknown'

export interface IntentResult {
  type: IntentType
  confidence: number
  keywords: string[]
  routing?: string
}

const INTENT_PATTERNS: Record<IntentType, string[]> = {
  implementation: ['implement', 'build', 'create', 'add', 'fix', 'refactor', 'update'],
  research: ['research', 'analyze', 'investigate', 'explore', 'find', 'search'],
  planning: ['plan', 'design', 'architect', 'propose', 'roadmap', 'strategy'],
  debugging: ['debug', 'fix', 'error', 'bug', 'issue', 'problem', 'fail'],
  exploration: ['explore', 'show', 'list', 'what', 'how', 'explain'],
  governance: ['session', 'state', 'plan', 'governance', 'checkpoint', 'gate'],
  maintenance: ['init', 'doctor', 'clean', 'archive', 'compact', 'setup'],
  unknown: [],
}

export function classifyIntent(prompt: string): IntentResult {
  const lowerPrompt = prompt.toLowerCase()
  const matches: { type: IntentType; count: number; keywords: string[] }[] = []
  
  for (const [type, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (type === 'unknown') continue
    
    const matchedKeywords = keywords.filter(kw => lowerPrompt.includes(kw))
    if (matchedKeywords.length > 0) {
      matches.push({
        type: type as IntentType,
        count: matchedKeywords.length,
        keywords: matchedKeywords,
      })
    }
  }
  
  if (matches.length === 0) {
    return { type: 'unknown', confidence: 0, keywords: [] }
  }
  
  matches.sort((a, b) => b.count - a.count)
  const best = matches[0]
  
  const result: IntentResult = {
    type: best.type,
    confidence: Math.min(best.count / 3, 1),
    keywords: best.keywords,
    routing: getRouting(best.type),
  }
  
  log.debug('Intent classified', result.type, result.confidence)
  return result
}

function getRouting(type: IntentType): string {
  const routing: Record<IntentType, string> = {
    implementation: 'hivemake',
    research: 'hiverd',
    planning: 'hiveplanner',
    debugging: 'hivehealer',
    exploration: 'hivexplorer',
    governance: 'hiveminder',
    maintenance: 'hivefiver',
    unknown: 'hiveminder',
  }
  return routing[type]
}
