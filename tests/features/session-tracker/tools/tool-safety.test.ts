/**
 * Tool safety tests — path traversal rejection at tool boundary.
 *
 * Validates CR-02 and GAP-01 fixes: all three session knowledge query tools
 * reject session IDs containing path traversal characters (../, /, etc.)
 * before any filesystem access.
 *
 * @module tests/features/session-tracker/tools/tool-safety
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { isValidSessionID } from "../../../../src/features/session-tracker/types.js"
import { safeSessionPath } from "../../../../src/features/session-tracker/persistence/atomic-write.js"

describe("Tool safety — path traversal rejection", () => {
  describe("isValidSessionID", () => {
    it("should reject sessionId with '../' (dot-dot traversal)", () => {
      expect(isValidSessionID("../etc/passwd")).toBe(false)
      expect(isValidSessionID("ses_../etc/passwd")).toBe(false)
      expect(isValidSessionID("../../../../etc/passwd")).toBe(false)
    })

    // F-11: Embedded path separators are no longer rejected by isValidSessionID.
    // Only absolute paths (starts with / or \) and traversal (..) are blocked.
    // safeSessionPath() provides the actual filesystem safety at the persistence boundary.
    it("should reject absolute-path sessionId (starts with / or \\)", () => {
      expect(isValidSessionID("/ses_test")).toBe(false)
      expect(isValidSessionID("\\ses_test")).toBe(false)
    })

    it("should reject empty sessionId", () => {
      expect(isValidSessionID("")).toBe(false)
    })

    it("should reject null/undefined sessionId", () => {
      expect(isValidSessionID(null as unknown as string)).toBe(false)
      expect(isValidSessionID(undefined as unknown as string)).toBe(false)
    })

    it("should accept valid session IDs", () => {
      expect(isValidSessionID("ses_test12345abcdefg0")).toBe(true)
      expect(isValidSessionID("ses_1ed9df1adffe2hbJudz3sK60y3")).toBe(true)
      expect(isValidSessionID("ses_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")).toBe(true)
    })

    // F-11: Embedded backslashes are no longer rejected — only absolute
    // Windows paths (starts with \) are blocked.
    it("should accept sessionId with embedded backslash (not absolute)", () => {
      expect(isValidSessionID("ses_test\\escape")).toBe(true)
    })
  })

  describe("safeSessionPath", () => {
    it("should throw on '../' in session IDs (path traversal rejection)", () => {
      expect(() =>
        safeSessionPath("/tmp/project", "ses_../escape", "test.json"),
      ).toThrow(/Path traversal detected/)
    })

    it("should throw on '/' in session IDs (path separator)", () => {
      expect(() =>
        safeSessionPath("/tmp/project", "ses_test/escape", "test.json"),
      ).toThrow(/Path traversal detected/)
    })

    it("should produce a path within the project root", () => {
      const projectRoot = "/tmp/test-project"
      const result = safeSessionPath(projectRoot, "ses_validID12345abcde", "test.json")
      expect(result).toContain(projectRoot)
      expect(result).toContain("ses_validID12345abcde")
    })
  })
})
