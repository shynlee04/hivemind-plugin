/**
 * Assistant metadata parser — extracts agent name, model, duration,
 * and detects compaction turns.
 *
 * @module event-tracker/parser/meta-parser
 */

export interface AssistantMeta {
  agentName: string
  model: string
  duration: number | null
}

export function parseAssistantMeta(header: string): AssistantMeta {
  // Pattern: ## Assistant (AgentName · model · duration)
  const match = header.match(/##\s+Assistant\s*\((.+?)\)/)
  if (!match) {
    return { agentName: '', model: '', duration: null }
  }

  const parts = match[1].split('·').map((s) => s.trim())
  const agentName = parts[0] ?? ''
  const model = parts[1] ?? ''
  const durationStr = parts[2] ?? ''
  const duration = parseDuration(durationStr)

  return { agentName, model, duration }
}

export function isCompactionTurn(header: string): boolean {
  return /##\s+Assistant\s*\([^)]*Compaction[^)]*\)/i.test(header)
}

export function parseDuration(durationStr: string): number | null {
  if (!durationStr) return null

  // "22.5s" or "0.5s"
  const secMatch = durationStr.match(/^([\d.]+)s$/)
  if (secMatch) {
    return Math.round(parseFloat(secMatch[1]) * 1000)
  }

  // "500ms"
  const msMatch = durationStr.match(/^(\d+)ms$/)
  if (msMatch) {
    return parseInt(msMatch[1], 10)
  }

  return null
}
