/**
 * System prompt transform hook.
 *
 * Injects the prompt-enhance output contract (YAML frontmatter + XML body
 * structure) into every session's system prompt so agents receive structured
 * output requirements at the system level.
 */

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
 * @param systemPrompt - The current system prompt text
 * @returns The transformed system prompt with contract injection
 */
export function transformSystemPrompt(systemPrompt: string): string {
  return `${systemPrompt}\n\n${CONTRACT_TEMPLATE}`
}
