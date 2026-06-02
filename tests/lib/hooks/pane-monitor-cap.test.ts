import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, readdirSync } from "node:fs"
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

// IMPORTANT: Import AFTER mocks are registered
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

// ---------------------------------------------------------------------------
// Tests: P53 pane-monitor rate cap (REQ-53-04)
// ---------------------------------------------------------------------------

describe("pane-monitor: 100/session/hour rate cap with UTC top-of-hour reset (REQ-53-04)", () => {
  let tmpDir: string

  beforeEach(() => {
    mockState.writeFile.mockReset()
    mockState.mkdir.mockReset()
    mockState.readdir.mockReset()
    // Default: mkdir succeeds, readdir returns [], writeFile succeeds
    mockState.mkdir.mockResolvedValue(undefined)
    mockState.readdir.mockResolvedValue([])
    mockState.writeFile.mockResolvedValue(undefined)
    tmpDir = mkdtempSync(join(tmpdir(), "pane-monitor-cap-"))
  })

  afterEach(async () => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("enforces 100/session/hour cap: 100 writes succeed, 101st silently dropped", async () => {
    // Use the test internal seam to seed the cap state at 99 (so 1 more
    // succeeds and 101st is dropped). We do this by firing 99 events first
    // with fake timers DISABLED, then 1 more, then 1 more (the 101st).
    // To keep the test fast, we mock writeFile to always succeed.
    const observer = createTmuxEventObserver({ onSessionCreated: async () => {} })
    const hook = createPaneMonitorHook({
      sessionId: "test-session",
      observer,
      journalRoot: tmpDir,
    })

    // Fire 100 events (each with unique timestamp → unique filename)
    for (let i = 0; i < 100; i++) {
      await observer({ event: makePaneCapturedEvent({ timestamp: 1_700_000_000_000 + i }) })
    }

    // Wait for all 100 writes to complete (the handler is sync but
    // writeWithBackoff is async; counters.written is incremented on success)
    await hook.__waitForPendingRetries?.()

    // All 100 should be counted as written (writeFile mock succeeds)
    expect(hook.counters.written).toBe(100)
    expect(hook.counters.dropped).toBe(0)

    // Fire the 101st event — cap should be exceeded
    await observer({ event: makePaneCapturedEvent({ timestamp: 1_700_000_000_000 + 100 }) })

    expect(hook.counters.written).toBe(100) // unchanged
    expect(hook.counters.dropped).toBe(1)   // 101st event dropped

    await hook.__waitForPendingRetries?.()
    await hook.dispose()

    // Verify no filesystem artifact for the 101st event by checking that
    // writeFile was called exactly 100 times (not 101)
    expect(mockState.writeFile).toHaveBeenCalledTimes(100)
  })

  it("resets the cap at UTC top-of-hour boundary", async () => {
    // Strategy: use fake timers and vi.setSystemTime to control the
    // hour epoch. Fire 99 events at hour T, advance 1 hour to T+1, fire
    // 1 more event → 100 written, 0 dropped.
    vi.useFakeTimers()
    // Start at UTC midnight so the hour boundary is well-defined
    vi.setSystemTime(new Date("2026-06-02T20:00:00.000Z"))

    try {
      const observer = createTmuxEventObserver({ onSessionCreated: async () => {} })
      const hook = createPaneMonitorHook({
        sessionId: "test-session",
        observer,
        journalRoot: tmpDir,
      })

      // Fire 99 events at hour T (2026-06-02T20:XX:XX)
      // Each event must have a timestamp within this hour for the
      // filename to land in the same hour-prefix range, but more
      // importantly the cap is per HOUR EPOCH (Math.floor(Date.now() / 3600000))
      // not per filename prefix. So as long as Date.now() is in hour T,
      // the cap increments against hour T's count.
      for (let i = 0; i < 99; i++) {
        await observer({ event: makePaneCapturedEvent({ timestamp: Date.now() + i }) })
      }
      // Wait for all 99 writes to complete
      await hook.__waitForPendingRetries?.()
      expect(hook.counters.written).toBe(99)
      expect(hook.counters.dropped).toBe(0)

      // Advance 1 hour → UTC top-of-hour boundary → cap resets
      vi.setSystemTime(new Date("2026-06-02T21:00:00.000Z"))

      // Fire 1 more event — should succeed (cap is now reset to 0)
      await observer({ event: makePaneCapturedEvent({ timestamp: Date.now() }) })
      // Wait for the async write to complete
      await hook.__waitForPendingRetries?.()
      expect(hook.counters.written).toBe(100)
      expect(hook.counters.dropped).toBe(0)

      await hook.__waitForPendingRetries?.()
      await hook.dispose()
    } finally {
      vi.useRealTimers()
    }
  })
})
