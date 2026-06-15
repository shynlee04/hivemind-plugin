/**
 * Session-tracker tool unit tests.
 *
 * Tests Zod schema validation (GAP-05), discriminated union routing,
 * safeSessionId refinement, and path-traversal rejection at the schema boundary.
 *
 * @module tests/tools/hivemind/session-tracker
 */

import { describe, it, expect } from "vitest"
import { SessionTrackerInputSchema } from "../../../src/schema-kernel/session-tracker.schema.js"

describe("SessionTrackerInputSchema", () => {
  // ---------------------------------------------------------------------------
  // export-session
  // ---------------------------------------------------------------------------

  describe("export-session", () => {
    it("accepts a valid sessionId", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "export-session",
        sessionId: "ses_abc123def",
      })
      expect(result.action).toBe("export-session")
      expect(result.sessionId).toBe("ses_abc123def")
    })

    it("rejects a sessionId with forward slash (path traversal)", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "export-session",
          sessionId: "ses_/etc/passwd",
        }),
      ).toThrow()
    })

    it("rejects a sessionId with dot-dot traversal", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "export-session",
          sessionId: "ses_../escape",
        }),
      ).toThrow()
    })

    it("rejects a sessionId with backslash", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "export-session",
          sessionId: "ses_\\windows\\path",
        }),
      ).toThrow()
    })

    it("rejects an empty sessionId", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "export-session",
          sessionId: "",
        }),
      ).toThrow()
    })

    it("defaults format to markdown", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "export-session",
        sessionId: "ses_test",
      })
      expect(result.format).toBe("markdown")
    })
  })

  // ---------------------------------------------------------------------------
  // get-status
  // ---------------------------------------------------------------------------

  describe("get-status", () => {
    it("accepts a valid sessionId", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "get-status",
        sessionId: "ses_status_test",
      })
      expect(result.action).toBe("get-status")
    })

    it("rejects path traversal", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "get-status",
          sessionId: "../malicious",
        }),
      ).toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // get-summary
  // ---------------------------------------------------------------------------

  describe("get-summary", () => {
    it("accepts a valid sessionId", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "get-summary",
        sessionId: "ses_summary_test",
      })
      expect(result.action).toBe("get-summary")
    })

    it("rejects path traversal", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "get-summary",
          sessionId: "/etc/hosts",
        }),
      ).toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // list-sessions
  // ---------------------------------------------------------------------------

  describe("list-sessions", () => {
    it("accepts without sessionId", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "list-sessions",
      })
      expect(result.action).toBe("list-sessions")
      expect(result.limit).toBe(20)
    })

    it("accepts a custom limit", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "list-sessions",
        limit: 5,
      })
      expect(result.limit).toBe(5)
    })

    it("rejects limit over 100", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "list-sessions",
          limit: 101,
        }),
      ).toThrow()
    })

    it("rejects limit under 1", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "list-sessions",
          limit: 0,
        }),
      ).toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // search-sessions
  // ---------------------------------------------------------------------------

  describe("search-sessions", () => {
    it("accepts a valid query", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "search-sessions",
        query: "investigator",
      })
      expect(result.action).toBe("search-sessions")
      expect(result.query).toBe("investigator")
    })

    it("rejects empty query", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "search-sessions",
          query: "",
        }),
      ).toThrow()
    })

    it("accepts a custom limit", () => {
      const result = SessionTrackerInputSchema.parse({
        action: "search-sessions",
        query: "agent",
        limit: 10,
      })
      expect(result.limit).toBe(10)
    })
  })

  // ---------------------------------------------------------------------------
  // Invalid actions
  // ---------------------------------------------------------------------------

  describe("invalid action", () => {
    it("rejects unknown action", () => {
      expect(() =>
        SessionTrackerInputSchema.parse({
          action: "delete-everything",
          sessionId: "ses_test",
        }),
      ).toThrow()
    })
  })
})
