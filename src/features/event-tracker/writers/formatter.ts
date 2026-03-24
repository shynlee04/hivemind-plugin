/**
 * Formatter utilities for event-tracker writers.
 *
 * Provides deterministic markdown formatting for turns and compaction events,
 * with built-in truncation for display and indexing purposes.
 *
 * @module event-tracker/writers/formatter
 */

import type { ParsedTurn } from '../parser/types.js'

// ---------------------------------------------------------------------------
// Truncation Utilities
// ---------------------------------------------------------------------------

/**
 * Truncates text for display output, defaulting to 500 characters.
 *
 * The result is exactly `maxChars` long — including the trailing ellipsis.
 *
 * @param text - The text to truncate
 * @param maxChars - Maximum characters in the result, including ellipsis (default: 500)
 * @returns Original text if within limit, or first `maxChars - 1` chars + ellipsis
 *
 * @example
 * truncateForDisplay('a'.repeat(600)) // => 499 chars + '…' (500 total)
 * truncateForDisplay('short') // => 'short'
 */
export function truncateForDisplay(text: string, maxChars: number = 500): string {
  if (text.length <= maxChars) {
    return text
  }
  return text.slice(0, maxChars - 1) + '…'
}

/**
 * Truncates text for indexing, defaulting to 200 characters.
 *
 * The result is exactly `maxChars` long — including the trailing ellipsis.
 *
 * @param text - The text to truncate
 * @param maxChars - Maximum characters in the result, including ellipsis (default: 200)
 * @returns Original text if within limit, or first `maxChars - 1` chars + ellipsis
 *
 * @example
 * truncateForIndex('b'.repeat(300)) // => 199 chars + '…' (200 total)
 * truncateForIndex('short') // => 'short'
 */
export function truncateForIndex(text: string, maxChars: number = 200): string {
  if (text.length <= maxChars) {
    return text
  }
  return text.slice(0, maxChars - 1) + '…'
}

// ---------------------------------------------------------------------------
// Section Formatters
// ---------------------------------------------------------------------------

/**
 * Renders a Delegations section from delegation targets.
 *
 * @param delegationTargets - Array of delegation entries
 * @returns Markdown delegation section, or empty string if no delegations
 */
function renderDelegationSection(
  delegationTargets: ParsedTurn['delegationTargets']
): string {
  if (delegationTargets.length === 0) {
    return ''
  }
  const lines = delegationTargets.map((d) => {
    const parts = [`**${d.delegatedTo}**`]
    if (d.description) {
      parts.push(`— ${d.description}`)
    }
    if (d.subagentType) {
      parts.push(`(${d.subagentType})`)
    }
    return `- ${parts.join(' ')}`
  })
  return `\n### Delegations\n${lines.join('\n')}`
}

/**
 * Formats a parsed turn into a deterministic markdown block.
 *
 * @param turn - The parsed turn to format
 * @returns Grep-friendly markdown block with turn header, agent, duration, user, and assistant sections
 *
 * @example
 * formatTurnSection({ turnNumber: 1, agentName: 'Hiveminder', ... })
 * // => "## Turn 1\n**Agent:** Hiveminder · model\n..."
 */
export function formatTurnSection(turn: ParsedTurn): string {
  const durationStr = turn.duration !== null ? `${turn.duration}ms` : 'N/A'
  const userMessage = truncateForIndex(turn.userMessage, 200)
  const assistantContent = truncateForDisplay(turn.assistantContent, 500)
  const delegationStr = renderDelegationSection(turn.delegationTargets)

  return `## Turn ${turn.turnNumber}
**Agent:** ${turn.agentName} · ${turn.model}
**Duration:** ${durationStr}

**User:**
${userMessage}

**Assistant:**
${assistantContent}${delegationStr}`
}

/**
 * Formats a compaction event into a deterministic markdown block.
 *
 * Includes timestamp, beforeSummary, and afterSummary fields.
 * Missing fields fall back to 'N/A' / empty string.
 *
 * @param turn - The parsed turn representing a compaction event
 * @returns Grep-friendly markdown block with compaction header and summary sections
 *
 * @example
 * formatCompactionEvent({ turnNumber: 5, isCompaction: true, timestamp: '2026-03-24', ... })
 * // => "## Compaction\n**Timestamp:** 2026-03-24\n..."
 */
export function formatCompactionEvent(turn: ParsedTurn): string {
  const durationStr = turn.duration !== null ? `${turn.duration}ms` : 'N/A'
  const timestamp = turn.timestamp ?? 'N/A'
  const beforeSummary = turn.beforeSummary ?? ''
  const afterSummary = turn.afterSummary ?? ''

  let beforeSection = ''
  if (beforeSummary) {
    beforeSection = `\n**Before:**\n${beforeSummary}`
  }

  let afterSection = ''
  if (afterSummary) {
    afterSection = `\n**After:**\n${afterSummary}`
  }

  return `## Compaction
**Agent:** ${turn.agentName} · ${turn.model}
**Duration:** ${durationStr}
**Timestamp:** ${timestamp}${beforeSection}${afterSection}`
}
