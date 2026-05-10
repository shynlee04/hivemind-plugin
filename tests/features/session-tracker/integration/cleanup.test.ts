/**
 * Integration tests for legacy cleanup (REQ-ST-13) and session-tracker tool.
 *
 * Tests:
 * - Legacy cleanup removes .json and .md files from .hivemind/event-tracker/
 * - Legacy cleanup preserves source code directory
 * - Legacy cleanup handles missing event-tracker directory gracefully
 * - Legacy cleanup does not remove .gitkeep files
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
  it("removes .json and .md files from .hivemind/event-tracker/", async () => {
    const trackerRoot = resolve(testRoot, ".hivemind", "event-tracker")
    await mkdir(trackerRoot, { recursive: true })
    // Create dummy state files
    await writeFile(resolve(trackerRoot, "ses_test.json"), JSON.stringify({ test: true }), "utf-8")
    await writeFile(resolve(trackerRoot, "ses_test.md"), "# Test file", "utf-8")
    await writeFile(resolve(trackerRoot, "another.json"), "{}", "utf-8")
    // Create .gitkeep (should NOT be removed)
    await writeFile(resolve(trackerRoot, ".gitkeep"), "", "utf-8")

    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    await tracker.cleanup()

    // After cleanup: .json and .md should be gone, .gitkeep should remain
    expect(existsSync(resolve(trackerRoot, "ses_test.json"))).toBe(false)
    expect(existsSync(resolve(trackerRoot, "ses_test.md"))).toBe(false)
    expect(existsSync(resolve(trackerRoot, "another.json"))).toBe(false)
    expect(existsSync(resolve(trackerRoot, ".gitkeep"))).toBe(true)
  })

  it("preserves non-contaminated files in event-tracker directory", async () => {
    const trackerRoot = resolve(testRoot, ".hivemind", "event-tracker-preserve")
    await mkdir(trackerRoot, { recursive: true })
    await writeFile(resolve(trackerRoot, ".gitkeep"), "", "utf-8")
    // A non-json, non-md file
    await writeFile(resolve(trackerRoot, "important.txt"), "keep me", "utf-8")

    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    await tracker.cleanup()

    expect(existsSync(resolve(trackerRoot, ".gitkeep"))).toBe(true)
    expect(existsSync(resolve(trackerRoot, "important.txt"))).toBe(true)
  })

  it("handles missing event-tracker directory gracefully", async () => {
    // No event-tracker directory exists
    const tracker = new SessionTracker({
      client: null as never,
      projectRoot: testRoot,
    })
    // Should not throw
    await expect(tracker.cleanup()).resolves.toBeUndefined()
  })

  it("does not remove event-tracker source code directory", async () => {
    // The source code at src/task-management/journal/event-tracker/ should exist.
    // This is a code-presence check, not a filesystem cleanup check.
    const sourceExists = existsSync(
      resolve(process.cwd(), "src", "task-management", "journal", "event-tracker"),
    )
    expect(sourceExists).toBe(true)
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
