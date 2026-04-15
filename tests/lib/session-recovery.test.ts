import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-session-recovery-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadRecoveryModules(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()

    const [{ recordSessionContinuity, patchSessionContinuity, getSessionContinuity }, recoveryModule] =
      await Promise.all([
        import("../../src/lib/continuity.js"),
        import("../../src/lib/session-recovery.js"),
    ])

    return {
      recordSessionContinuity,
      patchSessionContinuity,
      getSessionContinuity,
      listSessionContinuity: (await import("../../src/lib/continuity.js")).listSessionContinuity,
      assessRecoveryRisk: recoveryModule.assessRecoveryRisk,
      buildRecoveryResumeState: recoveryModule.buildRecoveryResumeState,
      getUnresolvedChildren: recoveryModule.getUnresolvedChildren,
    }
}

function buildContinuityRecord(
  sessionID: string,
  now: number,
  updatedAt = now - 60_000,
): SessionContinuityRecord {
  return {
    sessionID,
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read", "write"],
    },
    promptParams: {
      agent: "builder" as const,
      category: "implementation" as const,
      model: "gpt-5.4",
      temperature: 0,
      guidanceText: "keep going until done",
      tools: ["read", "write"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 2,
        agent: "builder" as const,
        category: "implementation" as const,
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      title: "builder: continue feature",
      description: "continue feature",
      category: "implementation" as const,
      constraints: ["keep tests green"],
      runInBackground: true,
      status: "running" as const,
      createdAt: now - 120_000,
      updatedAt,
      lastObservedAt: updatedAt,
      lifecycle: {
        phase: "running" as const,
        runMode: "async" as const,
        queueKey: "gpt-5.4:builder:implementation",
      },
      delegationPacket: {
        id: `packet-${sessionID}`,
        spec: "v1",
        plan: "02-04",
        artifacts: [],
        commits: [],
        parentChain: ["root-session", "parent-session", sessionID],
        status: "running" as const,
        createdAt: now - 120_000,
        updatedAt,
      },
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
  vi.useRealTimers()
})

describe("session recovery", () => {
  let continuityFile: string
  const fixedNow = new Date("2026-04-08T16:00:00.000Z").getTime()

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  it("treats a recently active session as low risk", async () => {
    const { recordSessionContinuity, assessRecoveryRisk } = await loadRecoveryModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("fresh-session", fixedNow, fixedNow - 45_000))

    const record = buildContinuityRecord("fresh-session", fixedNow, fixedNow - 45_000)
    const assessment = assessRecoveryRisk(record, {
      now: fixedNow,
      staleAfterMs: 15 * 60_000,
    })

    expect(assessment.level).toBe("low")
    expect(assessment.recommendedAction).toBe("resume")
    expect(assessment.reasons).toEqual([])
    expect(assessment.stale).toBe(false)
  })

  it("flags stale sessions with warnings and active delegations as elevated risk", async () => {
    const { assessRecoveryRisk } = await loadRecoveryModules(continuityFile)
    const staleRecord = buildContinuityRecord("stale-session", fixedNow, fixedNow - 4 * 60 * 60_000)
    staleRecord.metadata.delegationPacket = {
      ...staleRecord.metadata.delegationPacket!,
      status: "running",
    }
    staleRecord.metadata.compactionCheckpoint = {
      agent: "builder",
      model: "gpt-5.4",
      tools: ["read", "write"],
      delegationMeta: staleRecord.metadata.delegation,
      warnings: ["loop warning", "budget warning"],
      sessionStats: {
        total: 33,
        byTool: { read: 18, write: 5 },
        loop: { signature: "read:src/plugin.ts", count: 12 },
      },
      capturedAt: fixedNow - 3 * 60 * 60_000,
    }

    const assessment = assessRecoveryRisk(staleRecord, {
      now: fixedNow,
      staleAfterMs: 30 * 60_000,
    })

    expect(assessment.level).toBe("high")
    expect(assessment.stale).toBe(true)
    expect(assessment.activeDelegations).toBe(1)
    expect(assessment.warnings).toEqual(["loop warning", "budget warning"])
    expect(assessment.recommendedAction).toBe("review")
    expect(assessment.reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("stale"),
        expect.stringContaining("delegation"),
        expect.stringContaining("warning"),
      ]),
    )
  })

  it("preserves warning snapshots from compaction into resumed recovery state", async () => {
    const { recordSessionContinuity, patchSessionContinuity, getSessionContinuity, buildRecoveryResumeState } =
      await loadRecoveryModules(continuityFile)

    recordSessionContinuity(buildContinuityRecord("resume-session", fixedNow, fixedNow - 2 * 60 * 60_000))
    patchSessionContinuity("resume-session", {
      compactionCheckpoint: {
        agent: "builder",
        model: "gpt-5.4",
        tools: ["read", "write"],
        delegationMeta: {
          rootID: "root-session",
          depth: 1,
          budgetUsed: 2,
          agent: "builder",
          category: "implementation",
          model: "gpt-5.4",
          queueKey: "gpt-5.4:builder:implementation",
        },
        warnings: ["warning-a", "warning-b"],
        sessionStats: {
          total: 21,
          byTool: { read: 12, write: 3 },
          loop: { signature: "read:src/lib/continuity.ts", count: 6 },
        },
        capturedAt: fixedNow - 90 * 60_000,
      },
    })

    const persisted = getSessionContinuity("resume-session")
    expect(persisted?.metadata.compactionCheckpoint?.warnings).toEqual(["warning-a", "warning-b"])

    const resumeState = buildRecoveryResumeState(persisted!, {
      now: fixedNow,
      staleAfterMs: 30 * 60_000,
    })

    expect(resumeState.warningSnapshot).toEqual(["warning-a", "warning-b"])
    expect(resumeState.checkpoint?.sessionStats.total).toBe(21)
    expect(resumeState.assessment.reasons).toEqual(expect.arrayContaining([expect.stringContaining("warning")]))
  })

  it("treats queued children as unresolved from continuity truth even if packet transport looks stale", async () => {
    const { recordSessionContinuity, getUnresolvedChildren } = await loadRecoveryModules(continuityFile)

    recordSessionContinuity({
      ...buildContinuityRecord("queued-child", fixedNow, fixedNow - 10_000),
      metadata: {
        ...buildContinuityRecord("queued-child", fixedNow, fixedNow - 10_000).metadata,
        status: "queued",
        lifecycle: {
          phase: "queued",
          runMode: "async",
          queueKey: "gpt-5.4:builder:implementation",
          launchedAt: fixedNow - 30_000,
        },
        delegationPacket: {
          ...buildContinuityRecord("queued-child", fixedNow, fixedNow - 10_000).metadata.delegationPacket!,
          status: "running",
        },
      },
    })

    const unresolved = getUnresolvedChildren(
      new Map([["queued-child", (await loadRecoveryModules(continuityFile)).getSessionContinuity("queued-child")!]]),
      "parent-session",
    )

    expect(unresolved).toEqual([
      expect.objectContaining({
        sessionId: "queued-child",
        status: "queued",
      }),
    ])
  })

  it("normalizes legacy pending and error continuity records into queued and failed truth on load", async () => {
    const legacyStore = {
      version: 1,
      updatedAt: fixedNow,
      sessions: {
        "legacy-pending": {
          sessionID: "legacy-pending",
          toolProfile: { permissionRules: [], compatibleTools: ["read"] },
          promptParams: { agent: "builder", tools: ["read"] },
          metadata: {
            parentSessionID: "parent-session",
            rootSessionID: "root-session",
            delegation: {
              rootID: "root-session",
              depth: 1,
              budgetUsed: 1,
              agent: "builder",
              queueKey: "gpt-5.4:builder:implementation",
            },
            title: "legacy pending",
            description: "legacy pending",
            constraints: [],
            runInBackground: true,
            status: "pending",
            createdAt: fixedNow - 120_000,
            updatedAt: fixedNow - 90_000,
            route: {
              category: "implementation",
              effectiveAgent: "builder",
              presetKey: "builder",
              temperature: 0,
              fallbackUsed: false,
              rationale: "legacy",
              modelSource: "none",
              agentSource: "explicit",
              temperatureSource: "agent",
              warnings: [],
            },
          },
        },
        "legacy-error": {
          sessionID: "legacy-error",
          toolProfile: { permissionRules: [], compatibleTools: ["read"] },
          promptParams: { agent: "builder", tools: ["read"] },
          metadata: {
            parentSessionID: "parent-session",
            rootSessionID: "root-session",
            delegation: {
              rootID: "root-session",
              depth: 1,
              budgetUsed: 1,
              agent: "builder",
              queueKey: "gpt-5.4:builder:implementation",
            },
            title: "legacy error",
            description: "legacy error",
            constraints: [],
            runInBackground: true,
            status: "error",
            lastError: "transport failure",
            createdAt: fixedNow - 120_000,
            updatedAt: fixedNow - 60_000,
          },
        },
      },
    }

    writeFileSync(continuityFile, `${JSON.stringify(legacyStore, null, 2)}\n`, "utf8")

    const { listSessionContinuity } = await loadRecoveryModules(continuityFile)
    const records = listSessionContinuity()
    const pending = records.find((record) => record.sessionID === "legacy-pending")
    const failed = records.find((record) => record.sessionID === "legacy-error")

    expect(pending?.metadata.status).toBe("queued")
    expect(pending?.metadata.lifecycle?.phase).toBe("queued")
    expect(failed?.metadata.status).toBe("failed")
    expect(failed?.metadata.lifecycle?.phase).toBe("failed")
    expect(failed?.metadata.lastError).toBe("transport failure")
  })
})
