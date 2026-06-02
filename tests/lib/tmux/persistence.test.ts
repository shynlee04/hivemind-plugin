/**
 * Phase 54 vitest cases for src/features/tmux/persistence.ts.
 *
 * Covers REQ-54-01..04 acceptance:
 * - REQ-54-04: UUIDv7 regex + 0 collisions + temporal monotonicity
 * - REQ-54-02: persist writes 9-field JSON with schemaVersion: 1 (numeric)
 * - REQ-54-02: D-04 silent-fallback on EACCES (mkdir/read failure)
 * - REQ-54-03: restoreAll filters to paused + detached, sorts by spawnTime
 * - REQ-54-03: empty stateRoot returns [] (fresh project)
 * - REQ-54-03: malformed records are skipped with logWarn
 *
 * Each test uses a hermetic temp dir (mkdtemp) so test order is
 * independent and there is no cross-test pollution.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtemp, rm, readFile, mkdir, writeFile, chmod } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createSessionPersistence } from "../../../src/features/tmux/persistence.js"

describe("createSessionPersistence", () => {
  let projectDir: string

  beforeEach(async () => {
    projectDir = await mkdtemp(join(tmpdir(), "p54-persistence-"))
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true })
  })

  // ---------------------------------------------------------------------------
  // Test 1 (REQ-54-04 acceptance)
  // ---------------------------------------------------------------------------
  it("generateId() returns valid UUIDv7 (regex + 1000 generations, 0 collisions)", () => {
    const p = createSessionPersistence({ projectDirectory: projectDir })
    const ids = new Set<string>()
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    const now = Date.now()
    for (let i = 0; i < 1000; i++) {
      const id = p.generateId()
      expect(id).toMatch(regex)
      ids.add(id)
    }
    expect(ids.size).toBe(1000) // 0 collisions (birthday bound: 1000^2 / 2^74 ≈ 5.4e-17)
    // Lexicographic sort of UUIDv7 prefix matches Date.now() numeric sort.
    // The 12-char timestamp prefix spans positions 0-7 + 9-12 (skipping the dash at pos 8).
    const sorted = Array.from(ids).sort()
    const firstTs = parseInt(sorted[0]!.slice(0, 8) + sorted[0]!.slice(9, 13), 16)
    expect(firstTs).toBeGreaterThanOrEqual(now - 10)
    expect(firstTs).toBeLessThanOrEqual(Date.now() + 10)
  })

  // ---------------------------------------------------------------------------
  // Test 2 (REQ-54-02 acceptance)
  // ---------------------------------------------------------------------------
  it("persist() writes 9-field JSON with schemaVersion: 1 (numeric)", async () => {
    const p = createSessionPersistence({ projectDirectory: projectDir })
    const sid = p.generateId()
    const record = {
      schemaVersion: 1 as const,
      sessionId: sid,
      agent: "test-agent",
      delegationId: "del-1",
      directory: projectDir,
      paneId: "%5",
      spawnTime: Date.now(),
      state: "ready" as const,
      lastTransitionAt: Date.now(),
    }
    await p.persist(record)
    const filePath = join(projectDir, ".hivemind", "state", "tmux-sessions", `${sid}.json`)
    const raw = await readFile(filePath, "utf-8")
    const parsed: Record<string, unknown> = JSON.parse(raw)
    expect(Object.keys(parsed).length).toBe(9)
    expect(parsed["state"]).toBe("ready")
    expect(parsed["schemaVersion"]).toBe(1) // numeric, NOT "1.0" string
    expect(parsed["sessionId"]).toBe(sid)
  })

  // ---------------------------------------------------------------------------
  // Test 3 (REQ-54-03 acceptance) — restoreAll filter
  // ---------------------------------------------------------------------------
  it("restoreAll() returns only paused + detached, sorted by spawnTime", async () => {
    const p = createSessionPersistence({ projectDirectory: projectDir })
    const stateDir = join(projectDir, ".hivemind", "state", "tmux-sessions")
    await mkdir(stateDir, { recursive: true })
    const baseTime = Date.now()
    // Seed 5 records: paused, detached, active, ready, failed.
    // restoreAll must return only paused + detached.
    const records = [
      { sessionId: "s1", state: "paused" as const, spawnTime: baseTime + 100 },
      { sessionId: "s2", state: "detached" as const, spawnTime: baseTime + 200 },
      { sessionId: "s3", state: "active" as const, spawnTime: baseTime + 300 },
      { sessionId: "s4", state: "ready" as const, spawnTime: baseTime + 400 },
      { sessionId: "s5", state: "failed" as const, spawnTime: baseTime + 500 },
    ]
    for (const r of records) {
      await writeFile(
        join(stateDir, `${r.sessionId}.json`),
        JSON.stringify({
          schemaVersion: 1,
          sessionId: r.sessionId,
          agent: "a",
          delegationId: "d",
          directory: projectDir,
          paneId: "%1",
          spawnTime: r.spawnTime,
          state: r.state,
          lastTransitionAt: Date.now(),
        }),
      )
    }
    const restored = await p.restoreAll()
    expect(restored).toHaveLength(2)
    expect(restored.map((r) => r.sessionId).sort()).toEqual(["s1", "s2"])
    expect(restored.map((r) => r.state).sort()).toEqual(["detached", "paused"])
    // Sorted by spawnTime ascending (UUIDv7 sortable prefix)
    expect(restored[0]!.spawnTime).toBeLessThanOrEqual(restored[1]!.spawnTime)
  })

  // ---------------------------------------------------------------------------
  // Test 4 (REQ-54-02 / D-54-09 D-04 silent-fallback)
  // ---------------------------------------------------------------------------
  it("persist() silently fails (no throw) when stateRoot is read-only", async () => {
    const warnLogs: string[] = []
    const p = createSessionPersistence({
      projectDirectory: projectDir,
      logWarn: (msg) => warnLogs.push(msg),
    })
    // Pre-create the stateRoot so the chmod actually applies.
    const stateRoot = join(projectDir, ".hivemind", "state", "tmux-sessions")
    await mkdir(stateRoot, { recursive: true })
    // read+execute only — write blocked (POSIX EACCES on write).
    await chmod(stateRoot, 0o555)
    try {
      // This must NOT throw (D-04 silent-fallback)
      await p.persist({
        schemaVersion: 1,
        sessionId: "should-not-persist",
        agent: "a",
        delegationId: "d",
        directory: projectDir,
        paneId: "%1",
        spawnTime: Date.now(),
        state: "ready",
        lastTransitionAt: Date.now(),
      })
      // If we reach here, no throw (good)
      expect(warnLogs.length).toBeGreaterThan(0) // logWarn was called
      expect(warnLogs[0]).toMatch(/persist|EACCES|EISDIR|read-only|operation not permitted/i)
    } finally {
      await chmod(stateRoot, 0o755) // restore for cleanup
    }
  })

  // ---------------------------------------------------------------------------
  // Test 5 (REQ-54-03 acceptance) — empty stateRoot returns [] without throwing
  // ---------------------------------------------------------------------------
  it("restoreAll() returns [] when stateRoot is missing (fresh project)", async () => {
    // projectDir is empty — no .hivemind dir created yet.
    const p = createSessionPersistence({ projectDirectory: projectDir })
    const records = await p.restoreAll()
    expect(records).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // Test 6 (REQ-54-03 acceptance) — malformed records are skipped with logWarn
  // ---------------------------------------------------------------------------
  it("restoreAll() skips malformed records and continues", async () => {
    const warnLogs: string[] = []
    const p = createSessionPersistence({
      projectDirectory: projectDir,
      logWarn: (msg) => warnLogs.push(msg),
    })
    const stateDir = join(projectDir, ".hivemind", "state", "tmux-sessions")
    await mkdir(stateDir, { recursive: true })
    // Malformed JSON
    await writeFile(join(stateDir, "bad1.json"), "not-valid-json{")
    // Valid JSON but missing fields
    await writeFile(join(stateDir, "bad2.json"), JSON.stringify({ sessionId: "x" }))
    // Valid paused record
    await writeFile(
      join(stateDir, "good.json"),
      JSON.stringify({
        schemaVersion: 1,
        sessionId: "good",
        agent: "a",
        delegationId: "d",
        directory: projectDir,
        paneId: "%1",
        spawnTime: Date.now(),
        state: "paused",
        lastTransitionAt: Date.now(),
      }),
    )
    const records = await p.restoreAll()
    expect(records).toHaveLength(1)
    expect(records[0]!.sessionId).toBe("good")
    expect(warnLogs.length).toBeGreaterThan(0) // logWarn called for the 2 bad records
  })
})
