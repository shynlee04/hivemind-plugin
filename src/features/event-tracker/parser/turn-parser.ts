/**
 * Turn parser — composes splitter, meta-parser, delegation-extractor,
 * header-parser, and counter into a full session parsing pipeline.
 *
 * @module event-tracker/parser/turn-parser
 */

import type { ParsedSession, ParsedTurn } from './types.js'
import { createEmptyHeader } from './types.js'
import { parseSessionHeader } from './header-parser.js'
import { splitTurns } from './splitter.js'
import { parseAssistantMeta, isCompactionTurn } from './meta-parser.js'
import { extractDelegations } from './delegation-extractor.js'
import { countTurns } from './counter.js'

export function parseSession(markdown: string): ParsedSession {
  const header = markdown ? parseSessionHeader(markdown) : createEmptyHeader()

  const turnBlocks = splitTurns(markdown)
  const turns: ParsedTurn[] = []
  const allDelegations: ReturnType<typeof extractDelegations> = []

  for (let i = 0; i < turnBlocks.length; i++) {
    const block = turnBlocks[i]

    // Extract user message: text between `## User` and next `## Assistant` or `---`
    const userMatch = block.match(/##\s+User\s*\n([\s\S]*?)(?=\n---|\n##\s+Assistant)/)
    const userMessage = userMatch ? userMatch[1].trim() : ''

    // Extract assistant header (with or without parentheses)
    const assistantMatch = block.match(/##\s+Assistant\s*\([^)]+\)/)
    const assistantNoParensMatch = !assistantMatch ? block.match(/##\s+Assistant(?:\s*$|\s*\n)/) : null
    const assistantHeader = assistantMatch ? assistantMatch[0] : ''

    // Extract assistant content: everything after the assistant header
    const contentMatch = assistantMatch
      ? block.match(/##\s+Assistant\s*\([^)]+\)\s*\n([\s\S]*)/)
      : assistantNoParensMatch
        ? block.match(/##\s+Assistant\s*\n([\s\S]*)/)
        : null
    const assistantContent = contentMatch ? contentMatch[1].trim() : ''

    // Parse metadata
    const meta = parseAssistantMeta(assistantHeader)
    const compaction = isCompactionTurn(assistantHeader)

    // Extract thinking — try multiple formats as fallback
    const thinkingPatterns = [
      /_Thinking:_\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/,
      /\*\*Thinking:\*\*\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/,
      /###\s*Thinking\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/,
      /Thinking:\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/,
    ]
    let thinking: string | null = null
    for (const pattern of thinkingPatterns) {
      const match = assistantContent.match(pattern)
      if (match) {
        thinking = match[1].trim()
        break
      }
    }

    // Extract delegations
    const delegations = extractDelegations(block)
    allDelegations.push(...delegations)

    const turn: ParsedTurn = {
      turnNumber: i + 1,
      userMessage,
      assistantContent,
      thinking,
      agentName: meta.agentName,
      model: meta.model,
      duration: meta.duration,
      isCompaction: compaction,
      delegationTargets: delegations,
    }

    turns.push(turn)
  }

  const counters = countTurns(turns)

  return {
    header,
    turns,
    counters,
    delegations: allDelegations,
  }
}
