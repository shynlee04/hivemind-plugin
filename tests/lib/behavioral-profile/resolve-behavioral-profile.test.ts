/**
 * Unit tests for the behavioral-profile subsystem (CA-02, Wave 1).
 *
 * @module tests/lib/behavioral-profile
 * @description Tests the static lookup table, resolution logic,
 * caching behavior, and config-first merge strategy.
 *
 * Covers: REQ-CA02-01, REQ-CA02-02, REQ-CA02-03, REQ-CA02-04
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// Mock config-subscriber BEFORE importing resolution module
vi.mock("../../../src/config/subscriber.js", () => ({
  getConfig: vi.fn(),
  getFreshConfig: vi.fn(),
}))

// Mock profile-resolver
vi.mock("../../../src/routing/session-entry/profile-resolver.js", () => ({
  resolveProfile: vi.fn(),
}))

import { getConfig, getFreshConfig } from "../../../src/config/subscriber.js"
import { resolveProfile } from "../../../src/routing/session-entry/profile-resolver.js"
import { BehavioralProfiles } from "../../../src/routing/behavioral-profile/profiles.js"
import {
  resolveBehavioralProfile,
  mapLevelToExpertise,
} from "../../../src/routing/behavioral-profile/resolve-behavioral-profile.js"
import type {
  BehavioralProfile,
  ResolvedBehavioralProfile,
  BehavioralOverrides,
} from "../../../src/routing/behavioral-profile/types.js"

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockGetFreshConfig = vi.mocked(getFreshConfig)
const mockResolveProfile = vi.mocked(resolveProfile)

/** Creates a minimal mock config with sensible defaults. */
function createMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    conversation_language: "en" as const,
    documents_and_artifacts_language: "en" as const,
    mode: "expert-advisor" as const,
    user_expert_level: "intermediate-high-level" as const,
    delegation_systems: {
      native_task: true,
      delegate_task: true,
      background_delegation: false,
    },
    parallelization: true,
    atomic_commit: true,
    commit_docs: true,
    workflow: {
      research: true,
      cross_session_tasks_dependencies_validation: false,
      trajectory_control: false,
      advanced_continuity_validation: false,
      task_plus_enabled: false,
      plan_check: true,
      verifier: true,
      ui_phase: false,
      ui_safety_gate: false,
      ai_integration_phase: false,
      research_before_questions: true,
      discuss_mode: "sufficient-phase-discussion" as const,
      use_worktrees: false,
    },
    ...overrides,
  }
}

/** Creates a minimal mock ProfileMatch. */
function createMockProfileMatch(overrides: Record<string, unknown> = {}) {
  return {
    communicationStyle: "mixed" as const,
    decisionSpeed: "fast" as const,
    expertise: "mid" as const,
    matchConfidence: 0.45,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Static Lookup Table — BehavioralProfiles
// ---------------------------------------------------------------------------

describe("BehavioralProfiles (static lookup table)", () => {
  it("contains all three HivemindMode entries", () => {
    expect(BehavioralProfiles).toHaveProperty("expert-advisor")
    expect(BehavioralProfiles).toHaveProperty("hivemind-powered")
    expect(BehavioralProfiles).toHaveProperty("free-style")
  })

  it("expert-advisor has moderate guardrails, waiter delegation, full tools, all skills", () => {
    const profile = BehavioralProfiles["expert-advisor"]
    expect(profile.guardrailLevel).toBe("moderate")
    expect(profile.delegationMode).toBe("waiter")
    expect(profile.toolAccessPattern).toBe("full")
    expect(profile.skillFilter).toBe("all")
  })

  it("hivemind-powered has strict guardrails, waiter delegation, restricted tools, curated skills", () => {
    const profile = BehavioralProfiles["hivemind-powered"]
    expect(profile.guardrailLevel).toBe("strict")
    expect(profile.delegationMode).toBe("waiter")
    expect(profile.toolAccessPattern).toBe("restricted")
    expect(profile.skillFilter).toBe("curated")
  })

  it("free-style has minimal guardrails, disabled delegation, full tools, all skills", () => {
    const profile = BehavioralProfiles["free-style"]
    expect(profile.guardrailLevel).toBe("minimal")
    expect(profile.delegationMode).toBe("disabled")
    expect(profile.toolAccessPattern).toBe("full")
    expect(profile.skillFilter).toBe("all")
  })

  it("each profile has exactly 4 fields", () => {
    for (const mode of ["expert-advisor", "hivemind-powered", "free-style"] as const) {
      expect(Object.keys(BehavioralProfiles[mode])).toHaveLength(4)
    }
  })
})

// ---------------------------------------------------------------------------
// mapLevelToExpertise
// ---------------------------------------------------------------------------

describe("mapLevelToExpertise", () => {
  it("maps clumsy-vibecoder to junior", () => {
    expect(mapLevelToExpertise("clumsy-vibecoder")).toBe("junior")
  })

  it("maps beginner-friendly to junior", () => {
    expect(mapLevelToExpertise("beginner-friendly")).toBe("junior")
  })

  it("maps intermediate-high-level to mid", () => {
    expect(mapLevelToExpertise("intermediate-high-level")).toBe("mid")
  })

  it("maps architecture-driven to senior", () => {
    expect(mapLevelToExpertise("architecture-driven")).toBe("senior")
  })

  it("maps absolute-expert to senior", () => {
    expect(mapLevelToExpertise("absolute-expert")).toBe("senior")
  })
})

// ---------------------------------------------------------------------------
// resolveBehavioralProfile
// ---------------------------------------------------------------------------

describe("resolveBehavioralProfile", () => {
  beforeEach(() => {
    mockGetFreshConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
  })

  it("resolves a complete profile for expert-advisor mode", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-1", "/project")

    expect(result.mode).toBe("expert-advisor")
    expect(result.behavioralProfile.guardrailLevel).toBe("moderate")
    expect(result.behavioralProfile.delegationMode).toBe("waiter")
    expect(result.language.conversation).toBe("en")
    expect(result.language.documents).toBe("en")
    expect(result.userExpertLevel).toBe("intermediate-high-level")
    expect(result.discussMode).toBe("sufficient-phase-discussion")
  })

  it("resolves correct profile for hivemind-powered mode", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({ mode: "hivemind-powered" }),
    )
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-2", "/project")

    expect(result.mode).toBe("hivemind-powered")
    expect(result.behavioralProfile.guardrailLevel).toBe("strict")
    expect(result.behavioralProfile.skillFilter).toBe("curated")
  })

  it("resolves correct profile for free-style mode", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig({ mode: "free-style" }))
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-3", "/project")

    expect(result.mode).toBe("free-style")
    expect(result.behavioralProfile.guardrailLevel).toBe("minimal")
    expect(result.behavioralProfile.delegationMode).toBe("disabled")
  })

  it("applies config-first merge: user_expert_level overrides runtime expertise", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({ user_expert_level: "architecture-driven" }),
    )
    mockResolveProfile.mockReturnValue(
      createMockProfileMatch({ expertise: "junior" }),
    )

    const result = resolveBehavioralProfile("sess-4", "/project")

    // Config says architecture-driven → senior; runtime says junior → config wins
    expect(result.merged.expertise).toBe("senior")
  })

  it("populates runtimeProfile from resolveProfile output", () => {
    const runtimeData = createMockProfileMatch({
      communicationStyle: "detailed",
      decisionSpeed: "deliberate",
      expertise: "senior",
      matchConfidence: 0.68,
    })
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(runtimeData)

    const result = resolveBehavioralProfile("sess-5", "/project")

    expect(result.runtimeProfile).toEqual(runtimeData)
    expect(result.merged.communicationStyle).toBe("detailed")
    expect(result.merged.decisionSpeed).toBe("deliberate")
  })

  it("passes session context through to resolveProfile", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const ctx = { messageLength: 250, technicalTerms: ["tdd", "cqrs"] }
    resolveBehavioralProfile("sess-6", "/project", ctx)

    expect(mockResolveProfile).toHaveBeenCalledWith(ctx)
  })

  it("preserves non-English language config", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({
        conversation_language: "vi",
        documents_and_artifacts_language: "ja",
      }),
    )
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-7", "/project")

    expect(result.language.conversation).toBe("vi")
    expect(result.language.documents).toBe("ja")
  })
})

// ---------------------------------------------------------------------------
// Caching behavior
// ---------------------------------------------------------------------------

describe("caching behavior", () => {
  beforeEach(() => {
    mockGetFreshConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
  })

  it("always reads fresh config — each call produces a new profile", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const first = resolveBehavioralProfile("sess-c1", "/project")
    const second = resolveBehavioralProfile("sess-c1", "/project")

    // No longer cached — each call reads fresh config and produces new object
    expect(first).not.toBe(second)
    expect(mockGetFreshConfig).toHaveBeenCalledTimes(2)
  })

  it("different sessionIds each trigger fresh config reads", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    resolveBehavioralProfile("sess-c2a", "/project")
    resolveBehavioralProfile("sess-c2b", "/project")

    expect(mockGetFreshConfig).toHaveBeenCalledTimes(2)
  })

})

// ---------------------------------------------------------------------------
// Type shape contracts (compile-time + runtime)
// ---------------------------------------------------------------------------

describe("type shape contracts", () => {
  it("BehavioralProfile has required fields", () => {
    const profile: BehavioralProfile = {
      guardrailLevel: "moderate",
      delegationMode: "waiter",
      toolAccessPattern: "full",
      skillFilter: "all",
    }
    expect(profile).toBeDefined()
  })

  it("ResolvedBehavioralProfile satisfies full shape", () => {
    mockGetFreshConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result: ResolvedBehavioralProfile = resolveBehavioralProfile(
      "sess-shape",
      "/project",
    )

    expect(result).toHaveProperty("mode")
    expect(result).toHaveProperty("behavioralProfile")
    expect(result).toHaveProperty("language")
    expect(result).toHaveProperty("userExpertLevel")
    expect(result).toHaveProperty("discussMode")
    expect(result).toHaveProperty("runtimeProfile")
    expect(result).toHaveProperty("merged")
    expect(result.merged).toHaveProperty("expertise")
    expect(result.merged).toHaveProperty("communicationStyle")
    expect(result.merged).toHaveProperty("decisionSpeed")

  })

  it("BehavioralOverrides has required fields", () => {
    const overrides: BehavioralOverrides = {
      guardrailLevel: "strict",
      delegationMode: "waiter",
    }
    expect(overrides.guardrailLevel).toBe("strict")
    expect(overrides.delegationMode).toBe("waiter")
  })
})

// ---------------------------------------------------------------------------
// Feature Evaluation: Language Pipeline (D-04, D-05, REQ-CA02-02)
//
// The harness serves multilingual projects. Each of the 10 SupportedLanguage
// codes must flow through resolveBehavioralProfile() without error and appear
// in the resolved language fields. These are real-life harness features —
// not mere type exercise tests.
// ---------------------------------------------------------------------------

describe("language pipeline feature evaluation", () => {
  beforeEach(() => {
    mockGetFreshConfig.mockReset()
    mockResolveProfile.mockReset()
    mockResolveProfile.mockReturnValue(createMockProfileMatch())
  })

  afterEach(() => {
  })

  const supportedLanguages = ["en", "vi", "zh", "fr", "ja", "ko", "de", "es", "th", "id"] as const

  for (const lang of supportedLanguages) {
    it(`resolves conversation_language: "${lang}" correctly`, () => {
      mockGetFreshConfig.mockReturnValue(
        createMockConfig({ conversation_language: lang }),
      )

      const result = resolveBehavioralProfile(`sess-lang-${lang}`, "/project")
      expect(result.language.conversation).toBe(lang)
    })
  }

  for (const lang of supportedLanguages) {
    it(`resolves documents_and_artifacts_language: "${lang}" correctly`, () => {
      mockGetFreshConfig.mockReturnValue(
        createMockConfig({ documents_and_artifacts_language: lang }),
      )

      const result = resolveBehavioralProfile(`sess-doc-${lang}`, "/project")
      expect(result.language.documents).toBe(lang)
    })
  }

  it("resolves mixed language pair (vi/en) matching real user config", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({
        conversation_language: "vi",
        documents_and_artifacts_language: "en",
      }),
    )

    const result = resolveBehavioralProfile("sess-reallife", "/project")

    expect(result.language.conversation).toBe("vi")
    expect(result.language.documents).toBe("en")
    expect(result.mode).toBe("expert-advisor")
    expect(result.userExpertLevel).toBe("intermediate-high-level")
  })

  it("resolves CJK language pair (ja/zh)", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({
        conversation_language: "ja",
        documents_and_artifacts_language: "zh",
      }),
    )

    const result = resolveBehavioralProfile("sess-cjk", "/project")

    expect(result.language.conversation).toBe("ja")
    expect(result.language.documents).toBe("zh")
  })
})

// ---------------------------------------------------------------------------
// Feature Evaluation: Multi-Level Expertise Merge (D-06, REQ-CA02-03)
//
// The config-first merge must correctly map ALL five UserExpertLevel values
// to expertise levels, and fall back to runtime when no mapping exists.
// ---------------------------------------------------------------------------

describe("multi-level expertise merge feature evaluation", () => {
  beforeEach(() => {
    mockGetFreshConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
  })

  it("clumsy-vibecoder maps to junior, overriding runtime senior", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({ user_expert_level: "clumsy-vibecoder" }),
    )
    mockResolveProfile.mockReturnValue(
      createMockProfileMatch({ expertise: "senior" }),
    )

    const result = resolveBehavioralProfile("sess-clumsy", "/project")
    expect(result.merged.expertise).toBe("junior")
  })

  it("beginner-friendly maps to junior, overriding runtime mid", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({ user_expert_level: "beginner-friendly" }),
    )
    mockResolveProfile.mockReturnValue(
      createMockProfileMatch({ expertise: "mid" }),
    )

    const result = resolveBehavioralProfile("sess-beginner", "/project")
    expect(result.merged.expertise).toBe("junior")
  })

  it("absolute-expert maps to senior, overriding runtime junior", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({ user_expert_level: "absolute-expert" }),
    )
    mockResolveProfile.mockReturnValue(
      createMockProfileMatch({ expertise: "junior" }),
    )

    const result = resolveBehavioralProfile("sess-absolute", "/project")
    expect(result.merged.expertise).toBe("senior")
  })
})

// ---------------------------------------------------------------------------
// Feature Evaluation: Real-Life Config Scenario (CA-01→CA-02 Integration)
//
// This mirrors the ACTUAL .hivemind/configs.json: vi/en, expert-advisor,
// intermediate-high-level, sufficient-phase-discussion. Validates the full
// CA-01 schema → CA-02 profile resolution pipeline.
// ---------------------------------------------------------------------------

describe("real-life config scenario (CA-01→CA-02 integration)", () => {
  beforeEach(() => {
    mockGetFreshConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
  })

  it("produces correct resolved profile for actual configs.json values", () => {
    mockGetFreshConfig.mockReturnValue(
      createMockConfig({
        conversation_language: "vi",
        documents_and_artifacts_language: "en",
        mode: "expert-advisor",
        user_expert_level: "intermediate-high-level",
        workflow: {
          research: true,
          cross_session_tasks_dependencies_validation: false,
          trajectory_control: true,
          advanced_continuity_validation: false,
          task_plus_enabled: false,
          plan_check: true,
          verifier: true,
          ui_phase: false,
          ui_safety_gate: false,
          ai_integration_phase: false,
          research_before_questions: true,
          discuss_mode: "sufficient-phase-discussion" as const,
          use_worktrees: false,
        },
      }),
    )
    mockResolveProfile.mockReturnValue(
      createMockProfileMatch({
        communicationStyle: "mixed",
        decisionSpeed: "fast",
        expertise: "mid",
        matchConfidence: 0.5,
      }),
    )

    const result = resolveBehavioralProfile("sess-real", "/project")

    // Mode + behavioral profile
    expect(result.mode).toBe("expert-advisor")
    expect(result.behavioralProfile.guardrailLevel).toBe("moderate")
    expect(result.behavioralProfile.delegationMode).toBe("waiter")
    expect(result.behavioralProfile.toolAccessPattern).toBe("full")
    expect(result.behavioralProfile.skillFilter).toBe("all")

    // Language — the key feature
    expect(result.language.conversation).toBe("vi")
    expect(result.language.documents).toBe("en")

    // Expert level + discuss mode
    expect(result.userExpertLevel).toBe("intermediate-high-level")
    expect(result.discussMode).toBe("sufficient-phase-discussion")

    // Config-first merge: intermediate → mid
    expect(result.merged.expertise).toBe("mid")
    expect(result.merged.communicationStyle).toBe("mixed")
    expect(result.merged.decisionSpeed).toBe("fast")
  })
})
