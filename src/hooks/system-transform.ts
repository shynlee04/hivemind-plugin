/**
 * System prompt transform hook.
 *
 * Injects the prompt-enhance output contract (YAML frontmatter + XML body
 * structure) into sessions that have delegation metadata. Normal sessions
 * receive their system prompt unchanged.
 */

import { getDelegationMeta } from "../lib/state.js"

const CONTRACT_TEMPLATE = [
  "## Prompt-Enhance Output Contract",
  "",
  "When producing enhanced prompts, you MUST follow this structure:",
  "",
  "```yaml",
  "---",
  'version: "1.0.0"',
  "enhanced_at: <ISO-8601 datetime>",
  "complexity_before: <1-10>",
  "complexity_after: <1-10>",
  "confidence: <0.0-1.0>",
  "phases_completed: [<phase names>]",
  "warnings: [<optional warning strings>]",
  "---",
  "```",
  "",
  "Followed by an XML body section containing the enhanced prompt content.",
  "",
  "**Validation rules:**",
  "- `version` must be a valid semver string",
  "- `enhanced_at` must be a valid ISO-8601 datetime",
  "- `complexity_before` and `complexity_after` must be integers 1-10",
  "- `confidence` must be a float between 0.0 and 1.0",
  "- `phases_completed` must list phases from: skim, bridge, investigation, clarification, repackage, report",
  "- The XML body must be non-empty and contain the enhanced prompt content",
  "",
].join("\n")

/**
 * Transforms the system prompt by injecting the prompt-enhance output contract.
 *
 * Only injects the contract for sessions that have delegation metadata.
 * Normal sessions (no delegation) receive their system prompt unchanged.
 *
 * @param systemPrompt - The current system prompt text
 * @param sessionID - Optional session ID for delegation lookup
 * @returns The transformed system prompt (with contract injection if delegated)
 */
export function transformSystemPrompt(systemPrompt: string, sessionID?: string): string {
  if (!sessionID) {
    return systemPrompt
  }

  try {
    const delegation = getDelegationMeta(sessionID)
    if (!delegation || !delegation.agent) {
      return systemPrompt
    }
  } catch {
    // Continuity not initialized yet — skip injection
    return systemPrompt
  }

  return `${systemPrompt}\n\n${CONTRACT_TEMPLATE}`
}
