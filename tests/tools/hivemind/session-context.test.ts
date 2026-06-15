/**
 * Session-context tool unit tests.
 *
 * Tests Zod schema validation, discriminated union routing,
 * and safeSessionId refinement for the session-context tool.
 *
 * @module tests/tools/hivemind/session-context
 */

import { describe, it, expect } from "vitest"
import { SessionContextInputSchema } from "../../../src/schema-kernel/session-tracker.schema.js"

describe("SessionContextInputSchema", () => {
  describe("find-related", () => {
    it("accepts valid sessionId with defaults", () => {
      const result = SessionContextInputSchema.parse({
        action: "find-related",
        sessionId: "ses_abc123def",
      })
      expect(result.action).toBe("find-related")
      expect(result.sessionId).toBe("ses_abc123def")
      expect(result.maxRelated).toBe(10)
    })

    it("rejects path traversal in sessionId", () => {
      expect(() =>
        SessionContextInputSchema.parse({
          action: "find-related",
          sessionId: "ses_/etc/passwd",
        }),
      ).toThrow()
    })
  })

  describe("cross-reference", () => {
    it("accepts sessionId with optional query", () => {
      const result = SessionContextInputSchema.parse({
        action: "cross-reference",
        sessionId: "ses_test",
      })
      expect(result.action).toBe("cross-reference")
      expect(result.query).toBeUndefined()
    })

    it("accepts sessionId with query", () => {
      const result = SessionContextInputSchema.parse({
        action: "cross-reference",
        sessionId: "ses_test",
        query: "readFile",
      })
      expect(result.query).toBe("readFile")
    })
  })

  describe("synthesize-context", () => {
    it("accepts valid sessionId", () => {
      const result = SessionContextInputSchema.parse({
        action: "synthesize-context",
        sessionId: "ses_synth_test",
      })
      expect(result.action).toBe("synthesize-context")
    })

    it("rejects empty sessionId", () => {
      expect(() =>
        SessionContextInputSchema.parse({
          action: "synthesize-context",
          sessionId: "",
        }),
      ).toThrow()
    })
  })

  describe("maxRelated bounds", () => {
    it("rejects maxRelated below 1", () => {
      expect(() =>
        SessionContextInputSchema.parse({
          action: "find-related",
          sessionId: "ses_test",
          maxRelated: 0,
        }),
      ).toThrow()
    })

    it("rejects maxRelated above 50", () => {
      expect(() =>
        SessionContextInputSchema.parse({
          action: "find-related",
          sessionId: "ses_test",
          maxRelated: 51,
        }),
      ).toThrow()
    })
  })

  it("rejects unknown action", () => {
    expect(() =>
      SessionContextInputSchema.parse({
        action: "invalid",
        sessionId: "ses_test",
      }),
    ).toThrow()
  })
})
