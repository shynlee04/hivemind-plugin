import { describe, it, expect } from "vitest"
import { HivemindConfigsSchema } from "../../src/schema-kernel/hivemind-configs.schema.js"
import type { HivemindConfigs } from "../../src/schema-kernel/hivemind-configs.schema.js"
import type { ResolvedBehavioralProfile } from "../../src/lib/behavioral-profile/types.js"
import { buildGovernanceBlock } from "../../src/hooks/governance-block.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createConfig(overrides?: Partial<Record<string, unknown>>): HivemindConfigs {
  const base: Record<string, unknown> = {
    mode: "expert-advisor",
    user_expert_level: "intermediate-high-level",
    conversation_language: "en",
    documents_and_artifacts_language: "en",
  }
  return HivemindConfigsSchema.parse({ ...base, ...overrides })
}

function createProfile(
  overrides?: Partial<ResolvedBehavioralProfile>,
): ResolvedBehavioralProfile {
  return {
    mode: "expert-advisor",
    behavioralProfile: {
      guardrailLevel: "strict",
      delegationMode: "waiter",
      toolAccessPattern: "restricted",
      skillFilter: "curated",
    },
    language: { conversation: "en", documents: "en" },
    userExpertLevel: "intermediate-high-level",
    discussMode: "sufficient-phase-discussion",
    runtimeProfile: {
      communicationStyle: "detailed",
      decisionSpeed: "fast",
      expertise: "mid",
      matchConfidence: 0.8,
    },
    merged: {
      communicationStyle: "detailed",
      decisionSpeed: "deliberate",
      expertise: "intermediate-high",
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildGovernanceBlock", () => {
  it("Test 1: mode=expert-advisor, expertise=intermediate-high-level, language=en", () => {
    const config = createConfig({
      mode: "expert-advisor",
      user_expert_level: "intermediate-high-level",
      conversation_language: "en",
      documents_and_artifacts_language: "en",
    })
    const profile = createProfile({
      merged: {
        communicationStyle: "detailed",
        decisionSpeed: "deliberate",
        expertise: "intermediate-high",
      },
    })

    const result = buildGovernanceBlock(config, profile)

    expect(result).toContain("You are operating in expert-advisor mode.")
    expect(result).toContain("Communicate at intermediate-high level.")
    expect(result).toContain("Use en for all conversation and en for all documents.")
  })

  it("Test 2: mode=hivemind-powered → contains 'strict guardrails'", () => {
    const config = createConfig({ mode: "hivemind-powered" })
    const profile = createProfile()

    const result = buildGovernanceBlock(config, profile)

    expect(result).toContain("You are operating in hivemind-powered mode with strict guardrails.")
  })

  it("Test 3: mode=free-style → contains 'free-style mode'", () => {
    const config = createConfig({ mode: "free-style" })
    const profile = createProfile()

    const result = buildGovernanceBlock(config, profile)

    expect(result).toContain("You are operating in free-style mode.")
  })

  it("Test 4: all expertise levels produce correct instruction text", () => {
    const expertiseMap: Record<string, string> = {
      "clumsy-vibecoder": "Communicate at beginner level with detailed explanations.",
      "beginner-friendly": "Communicate at beginner-friendly level.",
      "intermediate-high-level": "Communicate at intermediate-high level.",
      "architecture-driven": "Communicate at architecture-driven level.",
      "absolute-expert": "Communicate at absolute expert level — skip basics.",
    }

    for (const [level, expected] of Object.entries(expertiseMap)) {
      const config = createConfig({ user_expert_level: level })
      const profile = createProfile()
      const result = buildGovernanceBlock(config, profile)
      expect(result).toContain(expected)
    }
  })

  it("Test 5: different languages (vi for conversation, en for documents)", () => {
    const config = createConfig({
      conversation_language: "vi",
      documents_and_artifacts_language: "en",
    })
    const profile = createProfile()

    const result = buildGovernanceBlock(config, profile)

    expect(result).toContain(
      "Use vi for all conversation and en for all documents.",
    )
  })

  it("Test 6: output starts with '--- Governance ---' and ends with field:value lines", () => {
    const config = createConfig()
    const profile = createProfile({
      merged: {
        communicationStyle: "detailed",
        decisionSpeed: "deliberate",
        expertise: "intermediate-high",
      },
    })

    const result = buildGovernanceBlock(config, profile)

    expect(result.startsWith("--- Governance ---")).toBe(true)
    expect(result).toContain("communicationStyle:")
    expect(result).toContain("decisionSpeed:")
    expect(result).toContain("expertise:")
  })

  it("Test 7: undefined behavioralProfile → governance block but no field:value lines", () => {
    const config = createConfig()

    const result = buildGovernanceBlock(config, undefined)

    // Still has governance header and instruction line
    expect(result.startsWith("--- Governance ---")).toBe(true)
    expect(result).toContain("You are operating in expert-advisor mode.")
    expect(result).toContain("Communicate at intermediate-high level.")
    // But NO field:value line
    expect(result).not.toContain("communicationStyle:")
    expect(result).not.toContain("decisionSpeed:")
    expect(result).not.toContain("expertise:")
  })

  it("Test 8: output is a single string with line breaks as \\n", () => {
    const config = createConfig()
    const profile = createProfile()

    const result = buildGovernanceBlock(config, profile)

    expect(typeof result).toBe("string")
    expect(Array.isArray(result)).toBe(false)
    expect(result).toContain("\n")
    // Verify there are exactly 2 newlines (3 lines: header, instruction, fields)
    const lines = result.split("\n").filter((l) => l.length > 0)
    expect(lines.length).toBe(3)
    expect(lines[0]).toBe("--- Governance ---")
  })
})
