/**
 * Turn counter — computes userMessageCount, agentOutputCount,
 * and delegationCount from parsed turns.
 *
 * @module event-tracker/parser/counter
 */

import type { ParsedTurn, TurnCounters } from './types.js'

export function countTurns(turns: ParsedTurn[]): TurnCounters {
  let userMessageCount = 0
  let agentOutputCount = 0
  let delegationCount = 0

  for (const turn of turns) {
    // User message: non-empty, non-whitespace-only
    if (turn.userMessage && turn.userMessage.trim().length > 0) {
      userMessageCount++
    }

    // Agent output: non-compaction only
    if (!turn.isCompaction) {
      agentOutputCount++
    }

    // Delegation count: sum of delegation targets
    delegationCount += turn.delegationTargets.length
  }

  return { userMessageCount, agentOutputCount, delegationCount }
}
