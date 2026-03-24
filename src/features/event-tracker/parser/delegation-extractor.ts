/**
 * Delegation extractor — scans turn text for `**Tool: task**` blocks
 * and extracts ParsedDelegation records from the JSON input.
 *
 * @module event-tracker/parser/delegation-extractor
 */

import type { ParsedDelegation } from './types.js'

export function extractDelegations(turnText: string): ParsedDelegation[] {
  const results: ParsedDelegation[] = []

  // Match **Tool: task** blocks
  const toolBlockRegex = /\*\*Tool:\s*task\*\*[\s\S]*?\*\*Input:\*\*\s*\n```json\s*\n([\s\S]*?)\n```/g

  let match: RegExpExecArray | null
  while ((match = toolBlockRegex.exec(turnText)) !== null) {
    const jsonStr = match[1]
    try {
      const parsed = JSON.parse(jsonStr)
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.agent === 'string') {
        results.push({
          delegatedTo: parsed.agent,
          description: typeof parsed.description === 'string' ? parsed.description : '',
          subagentType: typeof parsed.subagent_type === 'string' ? parsed.subagent_type : parsed.agent,
          packetId: typeof parsed.packet_id === 'string' ? parsed.packet_id : null,
        })
      }
    } catch {
      // Malformed JSON block skipped (not valid delegation)
    }
  }

  return results
}
