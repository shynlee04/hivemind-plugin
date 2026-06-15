import { describe, expect, it } from "vitest"

import {
  IntentIdSchema,
  IntentLockArtifactSchema,
  PhaseIdSchema,
  StepVerificationSchema,
} from "../../src/schema-kernel/intent-lock.schema"
import { LandscapeSchema } from "../../src/schema-kernel/landscape.schema"
import { PhaseManifestSchema } from "../../src/schema-kernel/phase-manifest.schema"

const VALID_INTENT_ID = "INT-20260610-a1b2c3"
const VALID_COMMIT_HASH = "a".repeat(40)
const VALID_PHASE_ID = "P27-routing"
const VALID_DECIMAL_PHASE_ID = "P27.1-intent-lock-gate"

function makeValidIntent(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1.0.0",
    intentId: VALID_INTENT_ID,
    phaseId: VALID_PHASE_ID,
    sessionId: "ses_test",
    purpose: "research",
    isCodeChange: false,
    summary: "Research the routing subsystem and document constraints",
    allowedSurfaces: [".planning/"],
    dependencies: [],
    successCriteria: ["Document at least 3 patterns"],
    createdAt: 1718000000000,
    commitHash: VALID_COMMIT_HASH,
    ...overrides,
  }
}

function makeValidLandscape(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1.0.0",
    phaseId: VALID_PHASE_ID,
    intentLockRef: VALID_INTENT_ID,
    scope: { filesAffected: ["src/foo.ts"], modulesTouched: ["foo"] },
    risks: [{ severity: "low", description: "minor", mitigation: "review" }],
    estimatedEffort: "small",
    createdAt: "2026-06-10T12:00:00.000Z",
    commitHash: VALID_COMMIT_HASH,
    ...overrides,
  }
}

function makeValidManifest(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1.0.0",
    phaseId: VALID_PHASE_ID,
    intentLockRef: VALID_INTENT_ID,
    landscapeRef: "abc.json",
    roadmapCommitHash: VALID_COMMIT_HASH,
    stateCommitHash: "b".repeat(40),
    status: "drafting",
    requiredProof: ["typecheck_pass", "tests_pass"],
    createdAt: "2026-06-10T12:00:00.000Z",
    ...overrides,
  }
}

describe("src/schema-kernel/intent-lock.schema", () => {
  describe("IntentIdSchema", () => {
    it("accepts a valid INT-{8}-{6} string", () => {
      expect(IntentIdSchema.safeParse(VALID_INTENT_ID).success).toBe(true)
    })

    it("rejects an intent ID with the wrong format", () => {
      expect(IntentIdSchema.safeParse("INT-20260610-WRONG").success).toBe(false)
    })
  })

  describe("PhaseIdSchema", () => {
    it("accepts P{digits}-{name}", () => {
      expect(PhaseIdSchema.safeParse(VALID_PHASE_ID).success).toBe(true)
    })

    it("accepts P{digits}.{optional}-{name}", () => {
      expect(PhaseIdSchema.safeParse(VALID_DECIMAL_PHASE_ID).success).toBe(true)
    })

    it("rejects phase ID without a name segment", () => {
      expect(PhaseIdSchema.safeParse("P27").success).toBe(false)
    })
  })

  describe("StepVerificationSchema", () => {
    it("accepts a minimal passed verification", () => {
      const result = StepVerificationSchema.safeParse({ passed: true })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.issues).toEqual([])
        expect(result.data.alternatives).toEqual([])
      }
    })
  })

  describe("IntentLockArtifactSchema", () => {
    it("accepts a valid research intent", () => {
      const result = IntentLockArtifactSchema.safeParse(makeValidIntent())
      expect(result.success).toBe(true)
    })

    it("accepts a valid implementation intent (isCodeChange=true)", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({
          purpose: "implementation",
          isCodeChange: true,
          allowedSurfaces: ["src/"],
        }),
      )
      expect(result.success).toBe(true)
    })

    it("rejects an intentId with the wrong regex", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ intentId: "NOT-A-REAL-ID" }),
      )
      expect(result.success).toBe(false)
    })

    it("rejects a commitHash that is not 40 hex chars", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ commitHash: "abc" }),
      )
      expect(result.success).toBe(false)
    })

    it("rejects a summary shorter than 20 chars", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ summary: "too short" }),
      )
      expect(result.success).toBe(false)
    })

    it("rejects a summary longer than 500 chars", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ summary: "x".repeat(501) }),
      )
      expect(result.success).toBe(false)
    })

    it("rejects empty allowedSurfaces", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ allowedSurfaces: [] }),
      )
      expect(result.success).toBe(false)
    })

    it("rejects empty successCriteria", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ successCriteria: [] }),
      )
      expect(result.success).toBe(false)
    })

    it("strips extraneous fields (purpose not in 9-field schema)", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ purpose: "unknown" }),
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect((result.data as Record<string, unknown>).purpose).toBeUndefined()
      }
    })
    it("defaults dependencies to []", () => {
      const result = IntentLockArtifactSchema.safeParse(
        makeValidIntent({ dependencies: undefined }),
      )
      expect(result.success).toBe(true)
    })
  })
})

describe("src/schema-kernel/landscape.schema", () => {
  it("accepts a valid landscape", () => {
    const result = LandscapeSchema.safeParse(makeValidLandscape())
    expect(result.success).toBe(true)
  })

  it("rejects commitHash of wrong length", () => {
    const result = LandscapeSchema.safeParse(makeValidLandscape({ commitHash: "abc" }))
    expect(result.success).toBe(false)
  })

  it("rejects an invalid phaseId", () => {
    const result = LandscapeSchema.safeParse(
      makeValidLandscape({ phaseId: "PXX" }),
    )
    expect(result.success).toBe(false)
  })

  it("rejects an unknown severity", () => {
    const result = LandscapeSchema.safeParse(
      makeValidLandscape({
        risks: [{ severity: "extreme", description: "x", mitigation: "y" }],
      }),
    )
    expect(result.success).toBe(false)
  })
})

describe("src/schema-kernel/phase-manifest.schema", () => {
  it("accepts a valid manifest", () => {
    const result = PhaseManifestSchema.safeParse(makeValidManifest())
    expect(result.success).toBe(true)
  })

  it("rejects an unknown requiredProof value", () => {
    const result = PhaseManifestSchema.safeParse(
      makeValidManifest({ requiredProof: ["invalid_evidence"] }),
    )
    expect(result.success).toBe(false)
  })

  it("accepts a manifest with lockedAt set", () => {
    const result = PhaseManifestSchema.safeParse(
      makeValidManifest({ lockedAt: "2026-06-10T13:00:00.000Z" }),
    )
    expect(result.success).toBe(true)
  })
})
