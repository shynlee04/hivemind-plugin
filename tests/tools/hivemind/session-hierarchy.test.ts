/**
 * Session-hierarchy tool unit tests.
 *
 * Tests Zod schema validation, discriminated union routing,
 * and safeSessionId refinement for the session-hierarchy tool.
 *
 * @module tests/tools/hivemind/session-hierarchy
 */

import { describe, it, expect } from "vitest"
import { SessionHierarchyInputSchema } from "../../../src/schema-kernel/session-tracker.schema.js"

describe("SessionHierarchyInputSchema", () => {
  describe("get-children", () => {
    it("accepts valid sessionId", () => {
      const result = SessionHierarchyInputSchema.parse({
        action: "get-children",
        sessionId: "ses_abc123def",
      })
      expect(result.action).toBe("get-children")
      expect(result.sessionId).toBe("ses_abc123def")
      expect(result.includeStatus).toBe(true)
    })

    it("rejects path traversal in sessionId", () => {
      expect(() =>
        SessionHierarchyInputSchema.parse({
          action: "get-children",
          sessionId: "ses_/etc/passwd",
        }),
      ).toThrow()
    })

    it("rejects dot-dot traversal", () => {
      expect(() =>
        SessionHierarchyInputSchema.parse({
          action: "get-children",
          sessionId: "ses_../escape",
        }),
      ).toThrow()
    })
  })

  describe("get-parent-chain", () => {
    it("accepts valid sessionId", () => {
      const result = SessionHierarchyInputSchema.parse({
        action: "get-parent-chain",
        sessionId: "ses_xyz789",
      })
      expect(result.action).toBe("get-parent-chain")
      expect(result.sessionId).toBe("ses_xyz789")
    })

    it("rejects empty sessionId", () => {
      expect(() =>
        SessionHierarchyInputSchema.parse({
          action: "get-parent-chain",
          sessionId: "",
        }),
      ).toThrow()
    })
  })

  describe("get-delegation-depth", () => {
    it("accepts valid sessionId", () => {
      const result = SessionHierarchyInputSchema.parse({
        action: "get-delegation-depth",
        sessionId: "ses_depth_test",
      })
      expect(result.action).toBe("get-delegation-depth")
      expect(result.sessionId).toBe("ses_depth_test")
    })
  })

  it("rejects unknown action", () => {
    expect(() =>
      SessionHierarchyInputSchema.parse({
        action: "invalid-action",
        sessionId: "ses_test",
      }),
    ).toThrow()
  })
})
