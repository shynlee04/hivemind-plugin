import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  addArtifact,
  addCommit,
  buildDelegationPacketParentChain,
  createDelegationPacket,
  setPlan,
  updatePacketStatus,
} from "../../src/lib/delegation-packet.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-continuity-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadContinuityModule(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()
  return import("../../src/lib/continuity.js")
}

function buildRecord(): SessionContinuityRecord {
  const packet = createDelegationPacket(
    "Persist delegation packet through continuity",
    buildDelegationPacketParentChain({
      rootSessionID: "root-session",
      parentSessionID: "parent-session",
      sessionID: "child-session",
    }),
  )

  addArtifact(packet, "docs/spec.md")
  addCommit(packet, "abc123")
  setPlan(packet, "1. Persist packet\n2. Verify roundtrip")
  updatePacketStatus(packet, "running")

  return {
    sessionID: "child-session",
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read", "write"],
    },
    promptParams: {
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      temperature: 0,
      guidanceText: "do the work",
      tools: ["read", "write"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      delegationPacket: packet,
      title: "builder: Persist delegation packet through continuity",
      description: "Persist delegation packet through continuity",
      category: "implementation",
      constraints: ["keep it incremental"],
      runInBackground: false,
      status: "running",
      createdAt: 1,
      updatedAt: 1,
    },
  }
}

afterEach(() => {
  const continuityFile = process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  if (continuityFile) {
    rmSync(dirname(continuityFile), { recursive: true, force: true })
  }

  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  vi.resetModules()
})

describe("continuity delegation packet persistence", () => {
  it("roundtrips delegation packet fields through continuity storage", async () => {
    const continuityFile = makeTempContinuityFile()
    const continuity = await loadContinuityModule(continuityFile)
    const record = buildRecord()

    continuity.recordSessionContinuity(record)

    const reloaded = await loadContinuityModule(continuityFile)
    const restored = reloaded.getSessionContinuity("child-session")

    expect(restored?.metadata.delegationPacket).toMatchObject({
      spec: record.metadata.delegationPacket?.spec,
      plan: record.metadata.delegationPacket?.plan,
      artifacts: record.metadata.delegationPacket?.artifacts,
      commits: record.metadata.delegationPacket?.commits,
      parentChain: record.metadata.delegationPacket?.parentChain,
      status: record.metadata.delegationPacket?.status,
    })
  })

  it("patches delegation packet fields without losing immutable identity fields", async () => {
    const continuityFile = makeTempContinuityFile()
    const continuity = await loadContinuityModule(continuityFile)
    const record = buildRecord()

    continuity.recordSessionContinuity(record)

    const before = continuity.getSessionContinuity("child-session")?.metadata.delegationPacket
    continuity.patchSessionDelegationPacket("child-session", {
      artifacts: ["docs/spec.md", "src/lib/delegation-packet.ts"],
      commits: ["abc123", "def456"],
      plan: "updated plan",
      parentChain: ["root-session", "review-session", "child-session"],
      status: "completed",
    })

    const after = continuity.getSessionContinuity("child-session")?.metadata.delegationPacket

    expect(after).toMatchObject({
      id: before?.id,
      createdAt: before?.createdAt,
      artifacts: ["docs/spec.md", "src/lib/delegation-packet.ts"],
      commits: ["abc123", "def456"],
      plan: "updated plan",
      parentChain: ["root-session", "review-session", "child-session"],
      status: "completed",
    })
    expect(after?.updatedAt).toBeGreaterThanOrEqual(before?.updatedAt ?? 0)
  })

  it("roundtrips compaction checkpoint metadata through continuity storage", async () => {
    const continuityFile = makeTempContinuityFile()
    const continuity = await loadContinuityModule(continuityFile)
    const record = buildRecord()

    continuity.recordSessionContinuity({
      ...record,
      metadata: {
        ...record.metadata,
        compactionCheckpoint: {
          agent: "builder",
          model: "gpt-5.4",
          tools: ["read", "write"],
          delegationMeta: record.metadata.delegation,
          warnings: ["checkpoint-warning"],
          sessionStats: {
            total: 3,
            byTool: { read: 2, write: 1 },
            loop: { signature: "read:/tmp/demo", count: 2 },
          },
          capturedAt: 123,
        },
      },
    })

    const reloaded = await loadContinuityModule(continuityFile)
    const restored = reloaded.getSessionContinuity("child-session")

    expect(restored?.metadata.compactionCheckpoint).toEqual({
      agent: "builder",
      model: "gpt-5.4",
      tools: ["read", "write"],
      delegationMeta: record.metadata.delegation,
      warnings: ["checkpoint-warning"],
      sessionStats: {
        total: 3,
        byTool: { read: 2, write: 1 },
        loop: { signature: "read:/tmp/demo", count: 2 },
      },
      capturedAt: 123,
    })
  })
})
