import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { BackgroundManager } from "../../src/lib/background-manager.js"
import type { BackgroundTask, BackgroundResult } from "../../src/lib/background-manager.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait until `predicate` returns true, polling every `intervalMs`. */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 20,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error("[Harness] waitFor timed out")
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

// ---------------------------------------------------------------------------
// BackgroundManager
// ---------------------------------------------------------------------------

describe("BackgroundManager", () => {
  let manager: BackgroundManager

  beforeEach(() => {
    manager = new BackgroundManager()
  })

  afterEach(async () => {
    // Kill any lingering tasks to avoid leaking processes across tests
    for (const task of manager.listTasks()) {
      if (task.status === "running") {
        manager.kill(task.id)
      }
    }
    // Short drain to allow SIGTERM to land
    await new Promise((r) => setTimeout(r, 50))
  })

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe("Lifecycle", () => {
    it("spawn() returns a BackgroundTask with running status", () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      expect(task.status).toBe("running")
    })

    it("spawn() assigns unique task ID", () => {
      const t1 = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })
      const t2 = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      expect(t1.id).not.toBe(t2.id)
    })

    it("getTask() returns task by ID", () => {
      const spawned = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      const found = manager.getTask(spawned.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(spawned.id)
    })

    it("getTask() returns undefined for unknown ID", () => {
      const result = manager.getTask("bg_does_not_exist")
      expect(result).toBeUndefined()
    })

    it("listTasks() returns all active tasks", () => {
      manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_a",
      })
      manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_b",
      })

      expect(manager.listTasks()).toHaveLength(2)
    })

    it("listTasks() can filter by parent session ID", () => {
      manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_a",
      })
      manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_b",
      })

      const filtered = manager.listTasks("ses_a")

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.parentSessionID).toBe("ses_a")
    })
  })

  // -------------------------------------------------------------------------
  // Output capture
  // -------------------------------------------------------------------------

  describe("Output capture", () => {
    it("captures stdout in ring buffer", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.stdout.write('hello stdout')"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await manager.onComplete(task.id)
      const updated = manager.getTask(task.id)!
      expect(updated.stdout).toContain("hello stdout")
    })

    it("captures stderr in ring buffer", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.stderr.write('hello stderr')"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await manager.onComplete(task.id)
      const updated = manager.getTask(task.id)!
      expect(updated.stderr).toContain("hello stderr")
    })

    it("ring buffer truncates stdout at limit", async () => {
      // Use a very small limit (32 bytes) so we can trigger truncation easily
      const smallManager = new BackgroundManager(32)

      // Write 100 chars — well above the 32-byte ring limit
      const task = smallManager.spawn({
        command: "node",
        args: ["-e", "process.stdout.write('A'.repeat(100))"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await smallManager.onComplete(task.id)
      const updated = smallManager.getTask(task.id)!
      expect(updated.stdout.length).toBeLessThanOrEqual(32)
    })

    it("ring buffer truncates stderr at limit", async () => {
      const smallManager = new BackgroundManager(32)

      const task = smallManager.spawn({
        command: "node",
        args: ["-e", "process.stderr.write('B'.repeat(100))"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await smallManager.onComplete(task.id)
      const updated = smallManager.getTask(task.id)!
      expect(updated.stderr.length).toBeLessThanOrEqual(32)
    })
  })

  // -------------------------------------------------------------------------
  // Termination
  // -------------------------------------------------------------------------

  describe("Termination", () => {
    it("kill() sets status to killed", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      manager.kill(task.id)
      // Status is set synchronously before the process dies
      const updated = manager.getTask(task.id)!
      expect(updated.status).toBe("killed")
    })

    it("kill() calls process.kill on the pid", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      const pid = manager.getTask(task.id)!.pid
      expect(pid).toBeGreaterThan(0)

      manager.kill(task.id)
      // Wait for the process to actually die
      await waitFor(() => {
        try {
          process.kill(pid, 0)
          return false
        } catch {
          return true
        }
      })
    })

    it("onComplete() resolves when process exits", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.exit(0)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      const result = await manager.onComplete(task.id)
      expect(result.status).toBe("completed")
    })

    it("onComplete() includes exit code in result", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.exit(42)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      const result: BackgroundResult = await manager.onComplete(task.id)
      expect(result.exitCode).toBe(42)
    })

    it("timeout kills process after configured duration", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
        timeout: 200, // 200ms timeout
      })

      // Wait for timeout to fire and process to be killed
      await waitFor(() => manager.getTask(task.id)?.status === "killed", 3000)
      const updated = manager.getTask(task.id)!
      expect(updated.status).toBe("killed")
    })
  })

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe("Cleanup", () => {
    it("completed tasks are retrievable but marked completed", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.exit(0)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await manager.onComplete(task.id)
      const updated = manager.getTask(task.id)!
      expect(updated.status).toBe("completed")
    })

    it("failed tasks include error message", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.exit(1)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      await manager.onComplete(task.id)
      const updated = manager.getTask(task.id)!
      expect(updated.status).toBe("failed")
      expect(updated.error).toContain("1")
    })
  })

  // -------------------------------------------------------------------------
  // onComplete edge cases
  // -------------------------------------------------------------------------

  describe("onComplete edge cases", () => {
    it("onComplete() rejects with error for unknown task ID", async () => {
      await expect(manager.onComplete("bg_unknown_id")).rejects.toThrow(
        "[Harness] Unknown task ID",
      )
    })

    it("onComplete() resolves immediately when task already completed", async () => {
      const task = manager.spawn({
        command: "node",
        args: ["-e", "process.exit(0)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      // First call — waits for completion
      await manager.onComplete(task.id)

      // Second call — already completed, resolves immediately
      const result = await manager.onComplete(task.id)
      expect(result.status).toBe("completed")
    })
  })

  // -------------------------------------------------------------------------
  // Spawn returned snapshot
  // -------------------------------------------------------------------------

  describe("Spawn snapshot", () => {
    it("spawned task has a positive pid", () => {
      const task: BackgroundTask = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })

      expect(task.pid).toBeGreaterThan(0)
    })

    it("spawned task has a startedAt timestamp", () => {
      const before = Date.now()
      const task = manager.spawn({
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      })
      const after = Date.now()

      expect(task.startedAt).toBeGreaterThanOrEqual(before)
      expect(task.startedAt).toBeLessThanOrEqual(after)
    })
  })
})
