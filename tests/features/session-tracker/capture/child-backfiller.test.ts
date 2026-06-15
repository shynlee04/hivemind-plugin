/**
 * Tests for ChildBackfiller.forceBackfillAllChildren().
 *
 * Verifies the 6th layer of defense for child session capture resilience:
 * after a delegation cycle ends, force-backfill ALL children of the parent
 * session from SDK messages. Discovers children from disk (not in-memory
 * index which may be incomplete), handles per-child errors gracefully.
 *
 * Evidence label: runtime-truthful — uses real temp directories, real fs
 * scan via `readdir`, real ChildBackfiller instance. The internal SDK-call
 * collaborator (`backfillChildTurnsFromSdk`) is mocked because this test
 * exercises the orchestration logic (discovery + aggregation + per-child
 * error containment), not the SDK message extraction (covered by separate
 * tests on `backfillChildTurnsFromSdk`).
 *
 * @module tests/features/session-tracker/capture/child-backfiller
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { ChildBackfiller } from "../../../../src/features/session-tracker/capture/child-backfiller.js"
import type { OpenCodeClient } from "../../../../src/shared/session-api.js"
import type { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockClient(): OpenCodeClient {
  return {
    app: { log: vi.fn() },
    // Provide session.messages so getSessionMessages() returns one
    // assistant message — exercises the full backfill path through
    // backfillChildTurnsFromSdk → getSessionMessages → childWriter.backfillChildTurns.
    session: {
      messages: vi.fn().mockResolvedValue([
        {
          info: { role: "assistant" },
          parts: [{ type: "text", text: "Hello from child" }],
        },
      ]),
    },
  } as unknown as OpenCodeClient
}

function createMockChildWriter(backfillImpl?: (parent: string, child: string) => Promise<void>): ChildWriter {
  return {
    backfillChildTurns: vi.fn().mockImplementation(backfillImpl ?? (async () => undefined)),
  } as unknown as ChildWriter
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("ChildBackfiller.forceBackfillAllChildren", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "cb-force-backfill-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  /**
   * Helper: writes a fake child .json file at
   * `.hivemind/session-tracker/{parentID}/{childID}.json`.
   */
  function writeChildFile(parentID: string, childID: string, data: unknown = {}): void {
    const dir = join(projectRoot, ".hivemind", "session-tracker", parentID)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, `${childID}.json`), JSON.stringify(data))
  }

  // -------------------------------------------------------------------------
  // Test 1: empty result when no children exist
  // -------------------------------------------------------------------------
  it("returns zero summary when no children exist on disk", async () => {
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: createMockChildWriter(),
      projectRoot,
    })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result).toEqual({ total: 0, succeeded: 0, failed: 0, errors: [] })
  })

  // -------------------------------------------------------------------------
  // Test 2: discovers children from disk and backfills each
  // -------------------------------------------------------------------------
  it("discovers children from disk and backfills each one", async () => {
    writeChildFile("ses_parent1", "ses_child1", { sessionID: "ses_child1" })
    writeChildFile("ses_parent1", "ses_child2", { sessionID: "ses_child2" })
    writeChildFile("ses_parent1", "ses_child3", { sessionID: "ses_child3" })

    const backfillSpy = vi.fn().mockResolvedValue(undefined)
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: {
        backfillChildTurns: backfillSpy,
      } as unknown as ChildWriter,
      projectRoot,
    })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result.total).toBe(3)
    expect(result.succeeded).toBe(3)
    expect(result.failed).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(backfillSpy).toHaveBeenCalledTimes(3)
    // Verify all 3 children were backfilled
    const calledWith = backfillSpy.mock.calls.map(([p, c]) => `${String(p)}/${String(c)}`)
    expect(calledWith).toContain("ses_parent1/ses_child1")
    expect(calledWith).toContain("ses_parent1/ses_child2")
    expect(calledWith).toContain("ses_parent1/ses_child3")
  })

  // -------------------------------------------------------------------------
  // Test 3: per-child errors are caught and aggregated
  // -------------------------------------------------------------------------
  it("per-child error is caught and aggregated (one failure does not abort)", async () => {
    writeChildFile("ses_parent1", "ses_child1", { sessionID: "ses_child1" })
    writeChildFile("ses_parent1", "ses_child2", { sessionID: "ses_child2" })
    writeChildFile("ses_parent1", "ses_child3", { sessionID: "ses_child3" })

    // backfillChildTurnsFromSdk catches all errors internally and returns
    // normally — it does NOT throw. To simulate a hard failure that
    // propagates to forceBackfillAllChildren's per-child try/catch, we
    // must spy on backfillChildTurnsFromSdk itself and make IT throw.
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: createMockChildWriter(),
      projectRoot,
    })

    const backfillSpy = vi
      .spyOn(backfiller, "backfillChildTurnsFromSdk")
      .mockImplementation(async (_parent: string, childID: string) => {
        if (childID === "ses_child2") {
          throw new Error("SDK unavailable")
        }
        // Other children succeed
      })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result.total).toBe(3)
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.childID).toBe("ses_child2")
    expect(result.errors[0]?.error).toBe("SDK unavailable")
    // All 3 backfill attempts were made — failure did not abort the loop
    expect(backfillSpy).toHaveBeenCalledTimes(3)
  })

  // -------------------------------------------------------------------------
  // Test 4: only counts .json files (ignores hierarchy-manifest, continuity, etc.)
  // -------------------------------------------------------------------------
  it("only counts .json child files (ignores manifest, continuity, non-json)", async () => {
    const dir = join(projectRoot, ".hivemind", "session-tracker", "ses_parent1")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "ses_child1.json"), "{}")
    writeFileSync(join(dir, "hierarchy-manifest.json"), "{}")  // ignored
    writeFileSync(join(dir, "session-continuity.json"), "{}")    // ignored
    writeFileSync(join(dir, "README.md"), "# not a child")       // ignored

    const backfillSpy = vi.fn().mockResolvedValue(undefined)
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: {
        backfillChildTurns: backfillSpy,
      } as unknown as ChildWriter,
      projectRoot,
    })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result.total).toBe(1)
    expect(result.succeeded).toBe(1)
    expect(backfillSpy).toHaveBeenCalledTimes(1)
    // Verify parent+child were passed (backfillChildTurns takes 3 args:
    // parentID, childID, turns — we only assert on the first two)
    expect(backfillSpy.mock.calls[0]?.[0]).toBe("ses_parent1")
    expect(backfillSpy.mock.calls[0]?.[1]).toBe("ses_child1")
  })

  // -------------------------------------------------------------------------
  // Test 5: returns empty summary when projectRoot is not provided
  // -------------------------------------------------------------------------
  it("returns empty summary when projectRoot is not provided", async () => {
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: createMockChildWriter(),
    })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result).toEqual({ total: 0, succeeded: 0, failed: 0, errors: [] })
  })

  // -------------------------------------------------------------------------
  // Test 6: invalid child IDs (non-ses_ prefix) are filtered out
  // -------------------------------------------------------------------------
  it("filters out non-session-id files (defensive: only ses_* IDs pass)", async () => {
    const dir = join(projectRoot, ".hivemind", "session-tracker", "ses_parent1")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "ses_child1.json"), "{}")
    writeFileSync(join(dir, "random_name.json"), "{}")  // Should be filtered

    const backfillSpy = vi.fn().mockResolvedValue(undefined)
    const backfiller = new ChildBackfiller({
      client: createMockClient(),
      childWriter: {
        backfillChildTurns: backfillSpy,
      } as unknown as ChildWriter,
      projectRoot,
    })

    const result = await backfiller.forceBackfillAllChildren("ses_parent1")

    expect(result.total).toBe(1)
    expect(backfillSpy.mock.calls[0]?.[0]).toBe("ses_parent1")
    expect(backfillSpy.mock.calls[0]?.[1]).toBe("ses_child1")
  })
})
