/**
 * Governance block builder.
 *
 * Produces a structured "--- Governance ---" block injected at position 0 of
 * every system prompt via `system.transform`. The block combines imperative
 * instructions from `HivemindConfigs` (mode, expertise, language) with
 * field:value context lines from the resolved behavioral profile.
 *
 * Format per D-06 (hybrid instruction + fields):
 * ```
 * --- Governance ---
 * You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and en for all documents.
 * communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high
 * ```
 *
 * @module governance-block
 * @see D-05, D-06, D-07 in CA-03-CONTEXT.md
 */

import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { ResolvedBehavioralProfile } from "../../routing/behavioral-profile/types.js"

// ---------------------------------------------------------------------------
// Mode instruction mapping
// ---------------------------------------------------------------------------

const MODE_INSTRUCTIONS: Record<string, string> = {
  "expert-advisor": "You are operating in expert-advisor mode.",
  "hivemind-powered": "You are operating in hivemind-powered mode with strict guardrails.",
  "free-style": "You are operating in free-style mode.",
}

// ---------------------------------------------------------------------------
// Expertise instruction mapping
// ---------------------------------------------------------------------------

const EXPERTISE_INSTRUCTIONS: Record<string, string> = {
  "clumsy-vibecoder": "Communicate at beginner level with detailed explanations.",
  "beginner-friendly": "Communicate at beginner-friendly level.",
  "intermediate-high-level": "Communicate at intermediate-high level.",
  "architecture-driven": "Communicate at architecture-driven level.",
  "absolute-expert": "Communicate at absolute expert level — skip basics.",
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the structured governance block string for system prompt injection.
 *
 * The output has three lines:
 * 1. `--- Governance ---` header
 * 2. Instruction line combining mode, expertise, and language directives
 * 3. Field:value context line (only when `profile` is provided)
 *
 * @param config  - Validated HivemindConfigs from the config subscriber.
 * @param profile - Optional resolved behavioral profile for field:value context.
 * @returns A single string with `\n` line breaks, ready for system array injection.
 *
 * @example
 * ```typescript
 * const config = HivemindConfigsSchema.parse({
 *   mode: "expert-advisor",
 *   user_expert_level: "intermediate-high-level",
 *   conversation_language: "en",
 *   documents_and_artifacts_language: "en",
 * })
 * const block = buildGovernanceBlock(config, profile)
 * // "--- Governance ---\nYou are operating in expert-advisor mode. ...\ncommunicationStyle: detailed | ..."
 * ```
 */
export function buildGovernanceBlock(
  config: HivemindConfigs,
  profile?: ResolvedBehavioralProfile | undefined,
): string {
  // --- Line 1: Header ---
  const header = "--- Governance ---"

  // --- Line 2: Instruction line ---
  const modeInstruction =
    MODE_INSTRUCTIONS[config.mode] ?? "You are operating in expert-advisor mode."
  const expertiseInstruction =
    EXPERTISE_INSTRUCTIONS[config.user_expert_level] ??
    "Communicate at intermediate-high level."
  const languageInstruction = `Use ${config.conversation_language} for all conversation and ${config.documents_and_artifacts_language} for all documents.`

  const instructionLine = `${modeInstruction} ${expertiseInstruction} ${languageInstruction}`

  // --- Line 3: Field:value context (optional) ---
  if (profile) {
    const m = profile.merged
    const fieldValues = [
      `communicationStyle: ${m.communicationStyle}`,
      `decisionSpeed: ${m.decisionSpeed}`,
      `expertise: ${m.expertise}`,
    ]
    const fieldsLine = fieldValues.join(" | ")

    return `${header}\n${instructionLine}\n${fieldsLine}`
  }

  return `${header}\n${instructionLine}`
}
