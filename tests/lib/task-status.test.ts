import { describe, it, expect } from "vitest"

describe("task-status", () => {
  describe("VALID_TASK_STATUSES", () => {
    it("should contain all 8 statuses", async () => {
      const { VALID_TASK_STATUSES } = await import("../../src/lib/task-status.js")
      expect(VALID_TASK_STATUSES).toHaveLength(8)
      expect(VALID_TASK_STATUSES).toContain("pending")
      expect(VALID_TASK_STATUSES).toContain("queued")
      expect(VALID_TASK_STATUSES).toContain("running")
      expect(VALID_TASK_STATUSES).toContain("completed")
      expect(VALID_TASK_STATUSES).toContain("failed")
      expect(VALID_TASK_STATUSES).toContain("error")
      expect(VALID_TASK_STATUSES).toContain("cancelled")
      expect(VALID_TASK_STATUSES).toContain("interrupt")
    })
  })

  describe("VALID_TRANSITIONS", () => {
    it("should have all 8 statuses as keys", async () => {
      const { VALID_TRANSITIONS, VALID_TASK_STATUSES } = await import("../../src/lib/task-status.js")
      for (const status of VALID_TASK_STATUSES) {
        expect(VALID_TRANSITIONS).toHaveProperty(status)
      }
      expect(Object.keys(VALID_TRANSITIONS)).toHaveLength(8)
    })

    it("pending should transition to queued and cancelled", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.pending).toEqual(["queued", "cancelled"])
    })

    it("queued should transition to running, failed, and cancelled", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.queued).toEqual(["running", "failed", "cancelled"])
    })

    it("running should transition to completed, failed, error, cancelled, interrupt", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.running).toEqual(["completed", "failed", "error", "cancelled", "interrupt"])
    })

    it("completed should have no transitions", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.completed).toEqual([])
    })

    it("error should have no transitions", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.error).toEqual([])
    })

    it("failed should have no transitions", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.failed).toEqual([])
    })

    it("cancelled should have no transitions", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.cancelled).toEqual([])
    })

    it("interrupt should transition to running and queued", async () => {
      const { VALID_TRANSITIONS } = await import("../../src/lib/task-status.js")
      expect(VALID_TRANSITIONS.interrupt).toEqual(["running", "queued"])
    })
  })

  describe("canTransition", () => {
    it("should allow pending -> queued", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("pending", "queued")).toBe(true)
    })

    it("should allow pending -> cancelled", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("pending", "cancelled")).toBe(true)
    })

    it("should allow queued -> running", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("queued", "running")).toBe(true)
    })

    it("should reject queued -> completed because queued work has no completion evidence", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("queued", "completed")).toBe(false)
    })

    it("should allow running -> completed", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("running", "completed")).toBe(true)
    })

    it("should allow running -> error", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("running", "error")).toBe(true)
    })

    it("should allow queued -> failed", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("queued", "failed")).toBe(true)
    })

    it("should allow running -> failed", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("running", "failed")).toBe(true)
    })

    it("should allow interrupt -> running", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("interrupt", "running")).toBe(true)
    })

    it("should allow interrupt -> queued", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("interrupt", "queued")).toBe(true)
    })

    it("should reject completed -> pending", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("completed", "pending")).toBe(false)
    })

    it("should reject error -> running", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("error", "running")).toBe(false)
    })

    it("should reject failed -> running", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("failed", "running")).toBe(false)
    })

    it("should reject cancelled -> queued", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("cancelled", "queued")).toBe(false)
    })

    it("should reject pending -> running (not directly allowed)", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("pending", "running")).toBe(false)
    })

    it("should reject running -> pending", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("running", "pending")).toBe(false)
    })

    it("should return false for same-status transitions when not explicitly listed", async () => {
      const { canTransition } = await import("../../src/lib/task-status.js")
      expect(canTransition("pending", "pending")).toBe(false)
      expect(canTransition("queued", "queued")).toBe(false)
      expect(canTransition("running", "running")).toBe(false)
      expect(canTransition("completed", "completed")).toBe(false)
      expect(canTransition("failed", "failed")).toBe(false)
      expect(canTransition("error", "error")).toBe(false)
      expect(canTransition("cancelled", "cancelled")).toBe(false)
      expect(canTransition("interrupt", "interrupt")).toBe(false)
    })
  })

  describe("isTerminal", () => {
    it("should return true for completed", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("completed")).toBe(true)
    })

    it("should return true for error", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("error")).toBe(true)
    })

    it("should return true for cancelled", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("cancelled")).toBe(true)
    })

    it("should return true for failed", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("failed")).toBe(true)
    })

    it("should return false for pending", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("pending")).toBe(false)
    })

    it("should return false for queued", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("queued")).toBe(false)
    })

    it("should return false for running", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("running")).toBe(false)
    })

    it("should return false for interrupt", async () => {
      const { isTerminal } = await import("../../src/lib/task-status.js")
      expect(isTerminal("interrupt")).toBe(false)
    })
  })
})
