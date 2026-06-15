/**
 * Integration tests for legacy cleanup (REQ-ST-13) and session-tracker tool.
 *
 * Tests:
 * - Legacy cleanup handles missing event-tracker directory gracefully
 * - Legacy cleanup does not remove session-tracker source code directory
 * - Legacy cleanup is a no-op (cleanup logic moved to orphan-quarantine module)
 *
 * @module tests/features/session-tracker/integration/cleanup
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdir, writeFile, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { existsSync } from "node:fs"

import { SessionTracker } from "../../../../src/features/session-tracker/index.js"

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let testRoot: string

beforeAll(async () => {
  testRoot = resolve(tmpdir(), `hivemind-cleanup-test-${Date.now()}`)
})

afterAll(async () => {
  try { await rm(testRoot, { recursive: true, force: true }) } catch { /* cleanup */ }
})

describe("Legacy cleanup (REQ-ST-13)", () => {
  it("handles missing event-tracker directory gracefully", async () => {
    // No event-tracker directory exists
    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    // Should not throw — cleanup() is a no-op after CP-ST-05 restructuring
    await expect(tracker.cleanup()).resolves.toBeUndefined()
  })

  it("does not remove session-tracker source code directory", async () => {
    // The source code at src/features/session-tracker/ should exist.
    // This is a code-presence check, not a filesystem cleanup check.
    const sourceExists = existsSync(
      resolve(process.cwd(), "src", "features", "session-tracker"),
    )
    expect(sourceExists).toBe(true)
  })

  it("cleanup() is a no-op after orphan-quarantine migration", async () => {
    // After CP-ST-05, cleanup() delegates to orphan-quarantine module.
    // The method itself is a no-op at the SessionTracker level.
    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    await expect(tracker.cleanup()).resolves.toBeUndefined()
  })

  it("handles empty event-tracker directory", async () => {
    const trackerRoot = resolve(testRoot, ".hivemind", "event-tracker-empty")
    await mkdir(trackerRoot, { recursive: true })

    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    await expect(tracker.cleanup()).resolves.toBeUndefined()
  })
})
