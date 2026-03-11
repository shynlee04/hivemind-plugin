import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, it } from "node:test"

import {
  classifyHivemindSurface,
  ensureHivemindIngressClassification,
} from "../src/lib/hivemind-ingress-policy.js"
import { readUnifiedStateSnapshot } from "../src/lib/state-snapshot.js"
import { createHiveOpsExportTool } from "../src/tools/hiveops-export.js"

const mockContext = {
  sessionID: "ingress-session",
  messageID: "ingress-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any

describe("hivemind ingress policy", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "hivemind-ingress-"))
    mockContext.directory = tmpDir
    await mkdir(join(tmpDir, ".hivemind", "state"), { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it("classifies authority, compatibility, quarantine, evidence, archive, and projection surfaces", async () => {
    const cases = [
      { path: join(tmpDir, ".hivemind", "state", "brain.json"), expected: "authority" },
      { path: join(tmpDir, ".hivemind", "state", "todo.json"), expected: "compatibility" },
      { path: join(tmpDir, ".hivemind", "graph", "orphans.json"), expected: "quarantine" },
      { path: join(tmpDir, ".hivemind", "handoffs", "handoff-01.json"), expected: "evidence" },
      { path: join(tmpDir, ".hivemind", "sessions", "archive", "old-session.md"), expected: "archive" },
      { path: join(tmpDir, ".hivemind", "INDEX.md"), expected: "projection" },
    ] as const

    for (const testCase of cases) {
      const entry = classifyHivemindSurface(tmpDir, testCase.path)
      assert.ok(entry, `expected policy entry for ${testCase.path}`)
      assert.equal(entry?.classification, testCase.expected)
    }
  })

  it("rejects compatibility surfaces when callers demand authority", async () => {
    assert.throws(
      () =>
        ensureHivemindIngressClassification(
          tmpDir,
          join(tmpDir, ".hivemind", "state", "todo.json"),
          ["authority"],
          "test authority read",
        ),
      /classified as compatibility/,
    )
  })

  it("reports compatibility reads in unified state snapshots", async () => {
    await writeFile(join(tmpDir, ".hivemind", "state", "runtime-profile.json"), JSON.stringify({ profile: "legacy" }))
    await writeFile(join(tmpDir, ".hivemind", "state", "context-recovery.json"), JSON.stringify({ source: "recovery" }))
    await writeFile(join(tmpDir, ".hivemind", "state", "health-metrics.json"), JSON.stringify({ score: 99 }))

    const snapshot = await readUnifiedStateSnapshot(tmpDir)
    assert.equal((snapshot.runtimeProfile as { profile: string }).profile, "legacy")
    assert.equal((snapshot.contextRecovery as { source: string }).source, "recovery")
    assert.equal((snapshot.healthMetrics as { score: number }).score, 99)

    assert.deepEqual(
      snapshot.ingressWarnings.map((warning) => `${warning.classification}:${warning.path}`).sort(),
      [
        "compatibility:state/context-recovery.json",
        "compatibility:state/health-metrics.json",
        "compatibility:state/runtime-profile.json",
      ],
    )
  })

  it("writes checkpoint artifacts onto evidence-classified surfaces", async () => {
    const toolDef = createHiveOpsExportTool(tmpDir)

    const result = await toolDef.execute({ action: "checkpoint", label: "ingress-ledger" }, mockContext)
    assert.match(String(result), /Checkpoint saved:/)

    const checkpointFiles = await readdir(join(tmpDir, ".hivemind", "checkpoints"))
    assert.equal(checkpointFiles.length, 1)

    const checkpointPath = join(tmpDir, ".hivemind", "checkpoints", checkpointFiles[0])
    const entry = classifyHivemindSurface(tmpDir, checkpointPath)
    assert.ok(entry)
    assert.equal(entry?.classification, "evidence")

    const checkpointRaw = await readFile(checkpointPath, "utf8")
    const checkpointParsed = JSON.parse(checkpointRaw) as { label: string }
    assert.equal(checkpointParsed.label, "ingress-ledger")
  })
})
