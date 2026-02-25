/**
 * Session Memory Purge Tests
 * Phase 3A: Auto-purge transient SessionMemory on task completion
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { randomUUID } from "node:crypto"

import { purgeTransientSessionMemory } from "../src/lib/session-memory-purge.js"

const SESSION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const OTHER_SESSION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

let tmpDir: string

async function setupDir(): Promise<string> {
  tmpDir = await mkdtemp(join(tmpdir(), "hm-purge-"))
  // Create .hivemind/graph/ directory structure
  const graphDir = join(tmpDir, ".hivemind", "graph")
  await mkdir(graphDir, { recursive: true })
  return tmpDir
}

async function writeSessionMemory(dir: string, state: unknown): Promise<void> {
  const graphDir = join(dir, ".hivemind", "graph")
  await writeFile(join(graphDir, "session-memory.json"), JSON.stringify(state, null, 2), "utf-8")
}

function makeNode(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    session_id: SESSION_ID,
    category: "planning",
    source: "test",
    content: "test content for purge",
    condensed: "test condensed",
    temporary: true,
    classification_confidence: 0.9,
    created_at: new Date().toISOString(),
    purged_at: null,
    transferred_to_governance: false,
    ...overrides,
  }
}

describe("purgeTransientSessionMemory", () => {
  beforeEach(async () => {
    await setupDir()
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true })
    } catch {
      // ignore
    }
  })

  it("returns purgedCount: 0 and synthesized: null for empty state", async () => {
    await writeSessionMemory(tmpDir, { version: "1.0.0", session_memory: [] })

    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 0)
    assert.equal(result.synthesized, null)
  })

  it("returns purgedCount: 0 when session-memory.json does not exist", async () => {
    // Don't write the file — fallback to default empty state
    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 0)
    assert.equal(result.synthesized, null)
  })

  it("purges all 3 temporary nodes for matching sessionId", async () => {
    const nodes = [
      makeNode({ content: "alpha content", condensed: "alpha" }),
      makeNode({ content: "beta content", condensed: "beta" }),
      makeNode({ content: "gamma content", condensed: "gamma" }),
    ]
    await writeSessionMemory(tmpDir, { version: "1.0.0", session_memory: nodes })

    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 3)
    assert.ok(result.synthesized !== null, "synthesized should not be null")
    assert.ok(result.synthesized!.includes("alpha"), "should include alpha condensed")
    assert.ok(result.synthesized!.includes("beta"), "should include beta condensed")
    assert.ok(result.synthesized!.includes("gamma"), "should include gamma condensed")
    assert.ok(result.synthesized!.includes(" | "), "should use pipe separator")
  })

  it("only purges matching temporary nodes for the correct sessionId", async () => {
    const nodes = [
      makeNode({ content: "match-temp", condensed: "match", session_id: SESSION_ID, temporary: true }),
      makeNode({ content: "other-session", condensed: "other", session_id: OTHER_SESSION_ID, temporary: true }),
      makeNode({ content: "not-temp", condensed: "perm", session_id: SESSION_ID, temporary: false }),
    ]
    await writeSessionMemory(tmpDir, { version: "1.0.0", session_memory: nodes })

    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 1, "should only purge the one matching temporary node")
    assert.ok(result.synthesized !== null)
    assert.ok(result.synthesized!.includes("match"), "should include the matched node's condensed")
    assert.ok(!result.synthesized!.includes("other"), "should NOT include other session's node")
    assert.ok(!result.synthesized!.includes("perm"), "should NOT include non-temporary node")
  })

  it("does not re-purge nodes that already have purged_at set", async () => {
    const alreadyPurged = makeNode({
      content: "already purged",
      condensed: "already",
      purged_at: "2026-01-01T00:00:00.000Z",
    })
    const freshTarget = makeNode({
      content: "fresh target",
      condensed: "fresh",
      purged_at: null,
    })
    await writeSessionMemory(tmpDir, {
      version: "1.0.0",
      session_memory: [alreadyPurged, freshTarget],
    })

    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 1, "should only purge the node without purged_at")
    assert.ok(result.synthesized !== null)
    assert.ok(result.synthesized!.includes("fresh"), "should include the fresh node")
    assert.ok(!result.synthesized!.includes("already"), "should NOT include already-purged node")
  })

  it("uses content.slice(0,240) when condensed is missing", async () => {
    const longContent = "A".repeat(300)
    const node = makeNode({
      content: longContent,
      condensed: undefined,
    })
    // Remove condensed field entirely
    delete (node as Record<string, unknown>).condensed
    await writeSessionMemory(tmpDir, { version: "1.0.0", session_memory: [node] })

    const result = await purgeTransientSessionMemory(tmpDir, SESSION_ID)

    assert.equal(result.purgedCount, 1)
    assert.ok(result.synthesized !== null)
    assert.equal(result.synthesized!.length, 240, "should truncate to 240 chars when no condensed")
  })
})
