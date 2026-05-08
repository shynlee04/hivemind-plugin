/**
 * @fileoverview Tests for failure classification module (REC-01).
 *
 * Validates the 9 failure classes and the classifyFailure function
 * that maps errors and error messages to the correct FailureClass.
 */
import { describe, expect, it } from "vitest"

describe("failure-classes", () => {
  describe("FailureClass type", () => {
    it("should enumerate exactly 9 failure classes", async () => {
      const { FAILURE_CLASSES } = await import("../../../src/task-management/recovery/failure-classes.js")
      expect(FAILURE_CLASSES).toHaveLength(9)
    })

    it("should include all required failure classes", async () => {
      const { FAILURE_CLASSES } = await import("../../../src/task-management/recovery/failure-classes.js")
      const expected = [
        "delegation-timeout",
        "delegation-crash",
        "state-corruption",
        "pty-unrecoverable",
        "continuity-write-failure",
        "sdk-session-lost",
        "permission-denied",
        "queue-deadlock",
        "unknown",
      ] as const
      for (const fc of expected) {
        expect(FAILURE_CLASSES).toContain(fc)
      }
    })
  })

  describe("classifyFailure", () => {
    it("should classify delegation timeout errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] Delegation timed out after 30000ms"))
      expect(result).toBe("delegation-timeout")
    })

    it("should classify delegation timeout from string message", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure("Delegation timed out: no response within budget")
      expect(result).toBe("delegation-timeout")
    })

    it("should classify delegation crash errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] Delegation crashed: child process exited with code 1"))
      expect(result).toBe("delegation-crash")
    })

    it("should classify state corruption errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] State corruption detected: invalid JSON in session-continuity.json"))
      expect(result).toBe("state-corruption")
    })

    it("should classify PTY unrecoverable errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] PTY session unrecoverable: slave process killed"))
      expect(result).toBe("pty-unrecoverable")
    })

    it("should classify continuity write failures", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] Continuity write failed: EACCES permission denied"))
      expect(result).toBe("continuity-write-failure")
    })

    it("should classify SDK session lost errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] SDK session lost: session ID not found"))
      expect(result).toBe("sdk-session-lost")
    })

    it("should classify permission denied errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("EACCES: permission denied, open '/path/to/file'"))
      expect(result).toBe("permission-denied")
    })

    it("should classify queue deadlock errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("[Harness] Queue deadlock detected: circular wait on semaphore"))
      expect(result).toBe("queue-deadlock")
    })

    it("should return 'unknown' for unrecognised errors", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("Something completely unexpected happened"))
      expect(result).toBe("unknown")
    })

    it("should return 'unknown' for empty string", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure("")
      expect(result).toBe("unknown")
    })

    it("should classify from string messages", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure("timeout exceeded for delegation 12345")
      expect(result).toBe("delegation-timeout")
    })

    it("should classify PTY errors without Harness prefix", async () => {
      const { classifyFailure } = await import("../../../src/task-management/recovery/failure-classes.js")
      const result = classifyFailure(new Error("pty slave process exited unexpectedly"))
      expect(result).toBe("pty-unrecoverable")
    })
  })
})
