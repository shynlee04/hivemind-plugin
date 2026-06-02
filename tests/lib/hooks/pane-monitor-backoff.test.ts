import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { PaneCapturedEvent, TmuxEventObserver } from "../../../src/features/tmux/observers.js"

// ---------------------------------------------------------------------------
// Mock state (hoisted via vi.hoisted so the factory can close over it)
// ---------------------------------------------------------------------------

interface MockState {
  writeFile: ReturnType<typeof vi.fn>
  mkdir: ReturnType<typeof vi.fn>
  readdir: ReturnType<typeof vi.fn>
}

const mockState = vi.hoisted<MockState>(() => {
  return {
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
  }
})

vi.mock("node:fs/promises", () => ({
  mkdir: (...args: unknown[]) => mockState.mkdir(...args),
  writeFile: (...args: unknown[]) => mockState.writeFile(...args),
  readdir: (...args: unknown[]) => mockState.readdir(...args),
}))

// IMPORTANT: Import AFTER mocks are registered so the module sees the mocked fs/promises
const { createPaneMonitorHook } = await import("../../../src/hooks/pane-monitor.js")
const { createTmuxEventObserver } = await import("../../../src/features/tmux/observers.js")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePaneCapturedEvent(overrides: Partial<PaneCapturedEvent> = {}): PaneCapturedEvent {
  return {
    type: "pane-captured",
    sessionId: overrides.sessionId ?? "test-session",
    paneId: overrides.paneId ?? "%7",
    contentLength: overrides.contentLength ?? 2048,
    timestamp: overrides.timestamp ?? Date.parse("2026-06-02T12:34:56.789Z"),
  }
}

function makeObserver(): { observer: TmuxEventObserver; fire: (event: PaneCapturedEvent) => void } {
  // createTmuxEventObserver requires a ForkSessionManager; we pass a no-op
  const observer = createTmuxEventObserver({
    onSessionCreated: async () => {},
  })
  // Direct fire — bypasses the observer's discriminated dispatch and
  // invokes ALL registered pane-captured listeners. This mirrors the BATS
  // BLOCKER-1 fix: the observer is sync; the handler is sync; the write
  // is async (test seam awaits).
  const fire = (event: PaneCapturedEvent): void => {
    // We can't call observer({event}) directly because that triggers the
    // session.created enrichment path. Instead we call the listener
    // captured during onPaneCaptured registration. To do that, we re-use
    // observer's exposed main fn shape via the test firing pattern from
    // observers.test.ts — but here we directly invoke the registered
    // listener through the observer's main dispatch by passing a
    // pane-captured event object.
    // Easiest: invoke observer({event: pane-captured}) — the observer
    // routes pane-captured to its registered listeners and does NOT
    // forward to the SessionManager.
    void observer({ event })
  }
  return { observer, fire }
}

// ---------------------------------------------------------------------------
// Tests: P53 pane-monitor backoff (REQ-53-03)
// ---------------------------------------------------------------------------

describe("pane-monitor: exponential backoff 5s/10s/30s (REQ-53-03)", () => {
  let tmpDir: string

  beforeEach(() => {
    mockState.writeFile.mockReset()
    mockState.mkdir.mockReset()
    mockState.readdir.mockReset()
    // Default: mkdir succeeds, readdir returns [] (no prior files)
    mockState.mkdir.mockResolvedValue(undefined)
    mockState.readdir.mockResolvedValue([])
    tmpDir = mkdtempSync(join(tmpdir(), "pane-monitor-backoff-"))
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("retries on writeFile failure: 2 fails, then succeeds with retryCount=2", async () => {
    // Schedule: fail, fail, succeed → 2 retries consumed (5s + 10s = 15s elapsed)
    mockState.writeFile
      .mockRejectedValueOnce(new Error("disk full"))
      .mockRejectedValueOnce(new Error("EAGAIN"))
      .mockResolvedValueOnce(undefined)

    const { observer } = makeObserver()
    const hook = createPaneMonitorHook({
      sessionId: "test-session",
      observer,
      journalRoot: tmpDir,
    })

    const event = makePaneCapturedEvent({ timestamp: 1_700_000_000_000 })
    await observer({ event }) // fires the hook's listener

    // After initial write attempt, writeFile was called once
    expect(mockState.writeFile).toHaveBeenCalledTimes(1)

    // Advance 5s → 1st retry fires (still failing)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(mockState.writeFile).toHaveBeenCalledTimes(2)
    // After attempt-1 fails, counters.retried was incremented to 1 (1 retry consumed)
    // then attempt-2 starts and fails too, incrementing retried to 2.
    // We assert at the 2nd-write-moment: the 1st retry has incremented retried to 1.
    expect(hook.counters.retried).toBeGreaterThanOrEqual(1)

    // Advance 10s → 2nd retry fires (succeeds)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(mockState.writeFile).toHaveBeenCalledTimes(3)
    expect(hook.counters.written).toBe(1)
    // Total retries consumed: 2 (one after each of the 2 failures)
    expect(hook.counters.retried).toBe(2)

    // Wait for all in-flight work to settle
    await hook.__waitForPendingRetries?.()
    await hook.dispose()

    // Final state
    expect(hook.counters.written).toBe(1)
    expect(hook.counters.dropped).toBe(0)

    // The journal entry should have retryCount=2 (the successful attempt number)
    const writtenArg = mockState.writeFile.mock.calls[2]?.[1] as string
    const parsed = JSON.parse(writtenArg) as { retryCount: number; schemaVersion: number; eventType: string }
    expect(parsed.retryCount).toBe(2)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.eventType).toBe("pane-captured")
  })

  it("drops event silently after 4 consecutive failures (no throw)", async () => {
    // All 4 attempts fail — no resolved value
    mockState.writeFile.mockRejectedValue(new Error("persistent failure"))

    const { observer } = makeObserver()
    const hook = createPaneMonitorHook({
      sessionId: "test-session",
      observer,
      journalRoot: tmpDir,
    })

    const event = makePaneCapturedEvent({ timestamp: 1_700_000_001_000 })
    await observer({ event })

    // 1st attempt
    expect(mockState.writeFile).toHaveBeenCalledTimes(1)

    // Advance 5s → retry 1
    await vi.advanceTimersByTimeAsync(5_000)
    expect(mockState.writeFile).toHaveBeenCalledTimes(2)
    expect(hook.counters.retried).toBeGreaterThanOrEqual(1)

    // Advance 10s → retry 2
    await vi.advanceTimersByTimeAsync(10_000)
    expect(mockState.writeFile).toHaveBeenCalledTimes(3)
    expect(hook.counters.retried).toBeGreaterThanOrEqual(2)

    // Advance 30s → retry 3 (this is the 4th total attempt — drop)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(mockState.writeFile).toHaveBeenCalledTimes(4)
    expect(hook.counters.dropped).toBe(1)
    expect(hook.counters.written).toBe(0)
    // Total retries scheduled before the 4th failure: 3
    expect(hook.counters.retried).toBe(3)

    // Wait for all in-flight work to settle
    await hook.__waitForPendingRetries?.()
    await hook.dispose()

    // No throw was caught (test passes if no exception thrown)
    expect(hook.counters.dropped).toBe(1)
    expect(hook.counters.written).toBe(0)
  })
})
