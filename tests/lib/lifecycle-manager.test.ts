import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getSessionContinuity, recordSessionContinuity } from "../../src/task-management/continuity/index.js"
import { createHarnessLifecycleManager, isTerminalPhase, isValidTransition } from "../../src/task-management/lifecycle/index.js"
import type { SessionLifecyclePhase } from "../../src/shared/types.js"

function createMockClient() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-session" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      abort: vi.fn().mockResolvedValue(undefined),
      messages: vi.fn().mockResolvedValue({ data: [] }),
    },
    app: {
      agents: vi.fn().mockResolvedValue({ data: [] }),
    },
  }
}

describe("isValidTransition", () => {
  it("allows created → queued", () => {
    expect(isValidTransition("created", "queued")).toBe(true)
  })

  it("allows created → dispatching", () => {
    expect(isValidTransition("created", "dispatching")).toBe(true)
  })

  it("allows created → running (skip-queue fast path)", () => {
    expect(isValidTransition("created", "running")).toBe(true)
  })

  it("allows created → failed (early failure)", () => {
    expect(isValidTransition("created", "failed")).toBe(true)
  })

  it("rejects created → completed (must go through running)", () => {
    expect(isValidTransition("created", "completed")).toBe(false)
  })

  it("allows queued → dispatching", () => {
    expect(isValidTransition("queued", "dispatching")).toBe(true)
  })

  it("allows queued → running", () => {
    expect(isValidTransition("queued", "running")).toBe(true)
  })

  it("rejects queued → completed because completion requires running evidence", () => {
    expect(isValidTransition("queued", "completed")).toBe(false)
  })

  it("allows queued → failed", () => {
    expect(isValidTransition("queued", "failed")).toBe(true)
  })

  it("rejects queued → created (no backwards)", () => {
    expect(isValidTransition("queued", "created")).toBe(false)
  })

  it("allows dispatching → running", () => {
    expect(isValidTransition("dispatching", "running")).toBe(true)
  })

  it("allows dispatching → failed", () => {
    expect(isValidTransition("dispatching", "failed")).toBe(true)
  })

  it("rejects dispatching → created", () => {
    expect(isValidTransition("dispatching", "created")).toBe(false)
  })

  it("allows running → completed", () => {
    expect(isValidTransition("running", "completed")).toBe(true)
  })

  it("allows running → failed", () => {
    expect(isValidTransition("running", "failed")).toBe(true)
  })

  it("rejects running → created (no backwards)", () => {
    expect(isValidTransition("running", "created")).toBe(false)
  })

  it("rejects running → queued (no backwards)", () => {
    expect(isValidTransition("running", "queued")).toBe(false)
  })

  it("completed is terminal — rejects all transitions", () => {
    const phases: SessionLifecyclePhase[] = ["created", "queued", "dispatching", "running", "completed", "failed"]
    for (const to of phases) {
      expect(isValidTransition("completed", to)).toBe(false)
    }
  })

  it("failed is terminal — rejects all transitions", () => {
    const phases: SessionLifecyclePhase[] = ["created", "queued", "dispatching", "running", "completed", "failed"]
    for (const to of phases) {
      expect(isValidTransition("failed", to)).toBe(false)
    }
  })
})

describe("isTerminalPhase", () => {
  it("returns true for completed", () => {
    expect(isTerminalPhase("completed")).toBe(true)
  })

  it("returns true for failed", () => {
    expect(isTerminalPhase("failed")).toBe(true)
  })

  it("returns false for running", () => {
    expect(isTerminalPhase("running")).toBe(false)
  })

  it("returns false for created", () => {
    expect(isTerminalPhase("created")).toBe(false)
  })
})

describe("HarnessLifecycleManager", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "lifecycle-test-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  describe("noteObservedActivity", () => {
    it("updates lastToolActivityAt and lifecycle observation on continuity store", () => {
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      recordSessionContinuity({
        sessionID: "ses-activity-test",
        promptParams: {},
        metadata: {
          status: "running",
          description: "test",
          delegation: null,
          constraints: [],
          updatedAt: Date.now(),
        },
      })

      manager.noteObservedActivity("ses-activity-test", "tool-call")

      const record = getSessionContinuity("ses-activity-test")
      expect(record?.metadata.lastToolActivityAt).toBeTypeOf("number")
      expect(record?.metadata.lastToolActivityAt).toBeGreaterThan(0)
      expect(record?.metadata.lifecycle?.observation?.source).toBe("tool-call")
      expect(record?.metadata.lifecycle?.observation?.observedAt).toBeGreaterThan(0)
    })

    it("updates activity timestamp for multiple sequential calls", () => {
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      recordSessionContinuity({
        sessionID: "ses-activity-multi",
        promptParams: {},
        metadata: {
          status: "running",
          description: "multi",
          delegation: null,
          constraints: [],
          updatedAt: Date.now(),
        },
      })

      manager.noteObservedActivity("ses-activity-multi", "source-a")
      const first = getSessionContinuity("ses-activity-multi")?.metadata.lastToolActivityAt

      // Small delay to ensure timestamp changes
      const start = Date.now()
      while (Date.now() === start) { /* spin */ }

      manager.noteObservedActivity("ses-activity-multi", "source-b")
      const second = getSessionContinuity("ses-activity-multi")?.metadata.lastToolActivityAt

      expect(second).toBeGreaterThanOrEqual(first!)
    })
  })

  describe("getLifecycleSnapshot", () => {
    it("returns lifecycle state from continuity store", () => {
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      recordSessionContinuity({
        sessionID: "ses-snapshot",
        promptParams: {},
        metadata: {
          status: "running",
          description: "snapshot test",
          delegation: null,
          constraints: [],
          lifecycle: { phase: "running" },
          updatedAt: Date.now(),
        },
      })

      const snapshot = manager.getLifecycleSnapshot("ses-snapshot")
      expect(snapshot?.phase).toBe("running")
    })

    it("returns undefined for unknown session", () => {
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      expect(manager.getLifecycleSnapshot("unknown")).toBeUndefined()
    })
  })

  describe("handleEvent completion routing", () => {
    it("feeds session.idle to CompletionDetector by event type and session ID", async () => {
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      const resultPromise = manager.getCompletionDetector().watch("ses-idle-order", 500)
      manager.handleEvent({
        event: { type: "session.idle" },
        eventType: "session.idle",
        sessionID: "ses-idle-order",
      })

      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses-idle-order",
      })
    })

    it("does not resolve a watcher for non-terminal lifecycle events", async () => {
      vi.useFakeTimers()
      const manager = createHarnessLifecycleManager({
        client: createMockClient() as never,
        pollTimeoutMs: 180_000,
      })

      const resultPromise = manager.getCompletionDetector().watch("ses-non-terminal", 50)
      manager.handleEvent({
        event: { type: "session.updated" },
        eventType: "session.updated",
        sessionID: "ses-non-terminal",
      })

      vi.advanceTimersByTime(60)
      await expect(resultPromise).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses-non-terminal",
      })
      vi.useRealTimers()
    })
  })
})
