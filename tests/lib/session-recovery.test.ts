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

/* -------------------------------------------------------------------------- */
/* Task 4: Parent retrieval from continuity                                    */
/* -------------------------------------------------------------------------- */
describe("Task 4: parent retrieves child results from continuity", () => {
  let continuityFile: string
  const fixedNow = new Date("2026-04-08T16:00:00.000Z").getTime()

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  async function loadModules() {
    return loadRecoveryModules(continuityFile)
  }

  function buildCompletedChild(
    sessionID: string,
    parentID: string,
    resultText: string,
    artifacts: string[],
    commits: string[],
  ): SessionContinuityRecord {
    return {
      sessionID,
      toolProfile: { permissionRules: [], compatibleTools: ["read", "write"] },
      promptParams: { agent: "builder" as const, tools: ["read", "write"] },
      metadata: {
        parentSessionID: parentID,
        rootSessionID: "root-session",
        delegation: {
          rootID: "root-session",
          depth: 1,
          budgetUsed: 2,
          agent: "builder" as const,
          queueKey: "gpt-5.4:builder:implementation",
        },
        title: `child: ${sessionID}`,
        description: `task for ${sessionID}`,
        constraints: [],
        runInBackground: true,
        status: "completed" as const,
        createdAt: fixedNow - 120_000,
        updatedAt: fixedNow - 60_000,
        lifecycle: {
          phase: "completed" as const,
          runMode: "async" as const,
          queueKey: "gpt-5.4:builder:implementation",
          launchedAt: fixedNow - 120_000,
          completedAt: fixedNow - 60_000,
        },
        resultCapture: {
          resultText,
          artifactPaths: artifacts,
          gitCommits: commits,
          toolCallSummary: [{ tool: "Write", args: "{}" }],
          messageCount: 5,
          capturedAt: fixedNow - 60_000,
        },
      },
    }
  }

  /* WHY: Requirement 3 — resumed parent must read results directly from continuity.
   * WHAT: getChildResultPreviews returns preview text, artifact paths, commit SHAs.
   * CONNECTS TO: Task 4 requirement 3 */
  it("returns result preview text from continuity for completed children", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()
    const child = buildCompletedChild(
      "child-1", "parent-1",
      "Implemented feature X in /src/feature.ts",
      ["/src/feature.ts"],
      ["a1b2c3d"],
    )
    recordSessionContinuity(child)

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    const record = getSessionContinuity("child-1")!
    store.set("child-1", record)

    const previews = getChildResultPreviews(store, "parent-1")

    expect(previews).toHaveLength(1)
    expect(previews[0].resultPreview).toBe("Implemented feature X in /src/feature.ts")
  })

  /* WHY: Requirement 3 — artifact paths from continuity, not live session.
   * CONNECTS TO: Task 4 requirement 3 */
  it("returns artifact paths from continuity resultCapture", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()
    const child = buildCompletedChild(
      "child-2", "parent-1",
      "done", ["/src/a.ts", "/src/b.ts"], [],
    )
    recordSessionContinuity(child)

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("child-2", getSessionContinuity("child-2")!)

    const previews = getChildResultPreviews(store, "parent-1")

    expect(previews).toHaveLength(1)
    expect(previews[0].artifacts).toEqual(["/src/a.ts", "/src/b.ts"])
  })

  /* WHY: Requirement 3 — commit SHAs from continuity.
   * CONNECTS TO: Task 4 requirement 3 */
  it("returns commit SHAs from continuity resultCapture", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()
    const child = buildCompletedChild(
      "child-3", "parent-1",
      "done", [], ["deadbeef", "cafef00d"],
    )
    recordSessionContinuity(child)

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("child-3", getSessionContinuity("child-3")!)

    const previews = getChildResultPreviews(store, "parent-1")

    expect(previews).toHaveLength(1)
    expect(previews[0].commits).toEqual(["deadbeef", "cafef00d"])
  })

  /* WHY: Requirement 3 — completed children with no resultCapture are excluded.
   * CONNECTS TO: Task 4 requirement 3 */
  it("excludes completed children without resultCapture from previews", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()
    const child: SessionContinuityRecord = {
      sessionID: "child-no-capture",
      toolProfile: { permissionRules: [], compatibleTools: ["read"] },
      promptParams: { agent: "builder" as const, tools: ["read"] },
      metadata: {
        parentSessionID: "parent-1",
        rootSessionID: "root-session",
        delegation: {
          rootID: "root-session", depth: 1, budgetUsed: 1,
          agent: "builder" as const, queueKey: "key",
        },
        title: "no capture",
        description: "no capture",
        constraints: [],
        runInBackground: true,
        status: "completed" as const,
        createdAt: fixedNow - 60_000,
        updatedAt: fixedNow - 30_000,
      },
    }
    recordSessionContinuity(child)

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("child-no-capture", getSessionContinuity("child-no-capture")!)

    const previews = getChildResultPreviews(store, "parent-1")
    expect(previews).toHaveLength(0)
  })

  /* WHY: Requirement 3 — only completed children show results, not running/failed.
   * CONNECTS TO: Task 4 requirement 3 */
  it("does not return previews for non-completed children", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()

    const runningChild: SessionContinuityRecord = {
      sessionID: "child-running",
      toolProfile: { permissionRules: [], compatibleTools: ["read"] },
      promptParams: { agent: "builder" as const, tools: ["read"] },
      metadata: {
        parentSessionID: "parent-1",
        rootSessionID: "root-session",
        delegation: {
          rootID: "root-session", depth: 1, budgetUsed: 1,
          agent: "builder" as const, queueKey: "key",
        },
        title: "running",
        description: "running",
        constraints: [],
        runInBackground: true,
        status: "running" as const,
        createdAt: fixedNow - 60_000,
        updatedAt: fixedNow - 30_000,
        resultCapture: {
          resultText: "partial",
          artifactPaths: [],
          gitCommits: [],
          toolCallSummary: [],
          messageCount: 2,
          capturedAt: fixedNow,
          partial: true,
        },
      },
    }
    recordSessionContinuity(runningChild)

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("child-running", getSessionContinuity("child-running")!)

    const previews = getChildResultPreviews(store, "parent-1")
    expect(previews).toHaveLength(0)
  })

  /* WHY: Requirement 3 — parent can see all completed children results in one call.
   * CONNECTS TO: Task 4 requirement 3 */
  it("returns multiple completed child results for the same parent", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()

    recordSessionContinuity(buildCompletedChild("c1", "p1", "result 1", ["/a.ts"], []))
    recordSessionContinuity(buildCompletedChild("c2", "p1", "result 2", ["/b.ts"], ["sha1"]))
    recordSessionContinuity(buildCompletedChild("c3", "other-parent", "result 3", [], []))

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("c1", getSessionContinuity("c1")!)
    store.set("c2", getSessionContinuity("c2")!)
    store.set("c3", getSessionContinuity("c3")!)

    const previews = getChildResultPreviews(store, "p1")

    expect(previews).toHaveLength(2)
    expect(previews.map((p) => p.sessionId).sort()).toEqual(["c1", "c2"])
  })

  /* WHY: Requirement 3 — completedAt from lifecycle is preserved in result preview.
   * CONNECTS TO: Task 4 requirement 3 */
  it("includes completedAt timestamp from lifecycle in result previews", async () => {
    const { recordSessionContinuity, getSessionContinuity } = await loadModules()
    recordSessionContinuity(buildCompletedChild("c-time", "p-time", "result", [], []))

    const { getChildResultPreviews } = await import("../../src/lib/session-recovery.js")
    const store = new Map<string, SessionContinuityRecord>()
    store.set("c-time", getSessionContinuity("c-time")!)

    const previews = getChildResultPreviews(store, "p-time")

    expect(previews[0].completedAt).toBe(fixedNow - 60_000)
  })
})
