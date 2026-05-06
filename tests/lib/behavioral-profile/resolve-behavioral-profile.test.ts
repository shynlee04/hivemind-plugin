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
vi.mock("../../../src/lib/config-subscriber.js", () => ({
  getConfig: vi.fn(),
}))

// Mock profile-resolver
vi.mock("../../../src/lib/session-entry/profile-resolver.js", () => ({
  resolveProfile: vi.fn(),
}))

import { getConfig } from "../../../src/lib/config-subscriber.js"
import { resolveProfile } from "../../../src/lib/session-entry/profile-resolver.js"
import { BehavioralProfiles } from "../../../src/lib/behavioral-profile/profiles.js"
import {
  resolveBehavioralProfile,
  invalidateBehavioralProfile,
  clearAllBehavioralProfiles,
  mapLevelToExpertise,
} from "../../../src/lib/behavioral-profile/resolve-behavioral-profile.js"
import type {
  BehavioralProfile,
  ResolvedBehavioralProfile,
  BehavioralOverrides,
} from "../../../src/lib/behavioral-profile/types.js"

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockGetConfig = vi.mocked(getConfig)
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
    clearAllBehavioralProfiles()
    mockGetConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
    clearAllBehavioralProfiles()
  })

  it("resolves a complete profile for expert-advisor mode", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
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
    mockGetConfig.mockReturnValue(
      createMockConfig({ mode: "hivemind-powered" }),
    )
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-2", "/project")

    expect(result.mode).toBe("hivemind-powered")
    expect(result.behavioralProfile.guardrailLevel).toBe("strict")
    expect(result.behavioralProfile.skillFilter).toBe("curated")
  })

  it("resolves correct profile for free-style mode", () => {
    mockGetConfig.mockReturnValue(createMockConfig({ mode: "free-style" }))
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const result = resolveBehavioralProfile("sess-3", "/project")

    expect(result.mode).toBe("free-style")
    expect(result.behavioralProfile.guardrailLevel).toBe("minimal")
    expect(result.behavioralProfile.delegationMode).toBe("disabled")
  })

  it("applies config-first merge: user_expert_level overrides runtime expertise", () => {
    mockGetConfig.mockReturnValue(
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
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(runtimeData)

    const result = resolveBehavioralProfile("sess-5", "/project")

    expect(result.runtimeProfile).toEqual(runtimeData)
    expect(result.merged.communicationStyle).toBe("detailed")
    expect(result.merged.decisionSpeed).toBe("deliberate")
  })

  it("passes session context through to resolveProfile", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const ctx = { messageLength: 250, technicalTerms: ["tdd", "cqrs"] }
    resolveBehavioralProfile("sess-6", "/project", ctx)

    expect(mockResolveProfile).toHaveBeenCalledWith(ctx)
  })

  it("preserves non-English language config", () => {
    mockGetConfig.mockReturnValue(
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
    clearAllBehavioralProfiles()
    mockGetConfig.mockReset()
    mockResolveProfile.mockReset()
  })

  afterEach(() => {
    clearAllBehavioralProfiles()
  })

  it("caches by sessionId — second call does not read config", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    const first = resolveBehavioralProfile("sess-c1", "/project")
    const second = resolveBehavioralProfile("sess-c1", "/project")

    expect(first).toBe(second) // Same reference
    expect(mockGetConfig).toHaveBeenCalledTimes(1)
  })

  it("different sessionIds produce independent cache entries", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    resolveBehavioralProfile("sess-c2a", "/project")
    resolveBehavioralProfile("sess-c2b", "/project")

    expect(mockGetConfig).toHaveBeenCalledTimes(2)
  })

  it("invalidateBehavioralProfile clears a specific session", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    resolveBehavioralProfile("sess-c3", "/project")
    expect(mockGetConfig).toHaveBeenCalledTimes(1)

    invalidateBehavioralProfile("sess-c3")
    resolveBehavioralProfile("sess-c3", "/project")
    expect(mockGetConfig).toHaveBeenCalledTimes(2)
  })

  it("clearAllBehavioralProfiles resets entire cache", () => {
    mockGetConfig.mockReturnValue(createMockConfig())
    mockResolveProfile.mockReturnValue(createMockProfileMatch())

    resolveBehavioralProfile("sess-c4a", "/project")
    resolveBehavioralProfile("sess-c4b", "/project")
    expect(mockGetConfig).toHaveBeenCalledTimes(2)

    clearAllBehavioralProfiles()

    resolveBehavioralProfile("sess-c4a", "/project")
    resolveBehavioralProfile("sess-c4b", "/project")
    expect(mockGetConfig).toHaveBeenCalledTimes(4)
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
    mockGetConfig.mockReturnValue(createMockConfig())
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

    clearAllBehavioralProfiles()
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
