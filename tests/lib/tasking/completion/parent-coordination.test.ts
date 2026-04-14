import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-parent-coordinator-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadModules(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()

  const [{ ParentCoordinator }, { recordSessionContinuity }] = await Promise.all([
    import("../../../../src/lib/tasking/completion/parent-coordinator.js"),
    import("../../../../src/lib/continuity.js"),
  ])

  return { ParentCoordinator, recordSessionContinuity }
}

function buildContinuityRecord(sessionID: string, phase: "created" | "queued" | "dispatching" | "running" | "completed" | "failed") {
  return {
    sessionID,
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read"],
    },
    promptParams: {
      agent: "builder" as const,
      category: "implementation" as const,
      model: "gpt-5.4",
      tools: ["read"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 1,
        agent: "builder" as const,
        category: "implementation" as const,
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      title: `child ${sessionID}`,
      description: `child ${sessionID}`,
      constraints: [],
      runInBackground: true,
      status: phase === "failed" ? ("failed" as const) : ("running" as const),
      createdAt: 1,
      updatedAt: 1,
      lifecycle: {
        phase,
        runMode: "async" as const,
        queueKey: "gpt-5.4:builder:implementation",
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
})

describe("ParentCoordinator (D-14)", () => {
  let continuityFile: string

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
  })

  it("reports active delegations when any child lifecycle is still running", async () => {
    // WHY: D-14 must not close the parent while any registered child remains non-terminal.
    const { ParentCoordinator, recordSessionContinuity } = await loadModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("child-complete-1", "completed"))
    recordSessionContinuity(buildContinuityRecord("child-complete-2", "completed"))
    recordSessionContinuity(buildContinuityRecord("child-running", "running"))

    const coordinator = new ParentCoordinator()
    coordinator.registerChild("child-complete-1")
    coordinator.registerChild("child-complete-2")
    coordinator.registerChild("child-running")

    const snapshot = coordinator.snapshotDelegationStatus()

    expect(snapshot.totalDelegations).toBe(3)
    expect(snapshot.completedDelegations).toEqual(new Set(["child-complete-1", "child-complete-2"]))
    expect(snapshot.activeDelegations).toEqual(new Set(["child-running"]))
    expect(snapshot.failedDelegations.size).toBe(0)
    expect(snapshot.allComplete).toBe(false)
  })

  it("treats all-completed delegations as terminal", async () => {
    const { ParentCoordinator, recordSessionContinuity } = await loadModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("child-a", "completed"))
    recordSessionContinuity(buildContinuityRecord("child-b", "completed"))

    const coordinator = new ParentCoordinator()
    coordinator.registerChild("child-a")
    coordinator.registerChild("child-b")

    const snapshot = coordinator.snapshotDelegationStatus()

    expect(snapshot.activeDelegations.size).toBe(0)
    expect(snapshot.completedDelegations).toEqual(new Set(["child-a", "child-b"]))
    expect(snapshot.allComplete).toBe(true)
  })

  it("treats failed delegations as terminal alongside completed ones", async () => {
    // WHY: Failed children are terminal for parent coordination even though synthesis may mention them.
    const { ParentCoordinator, recordSessionContinuity } = await loadModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("child-complete", "completed"))
    recordSessionContinuity(buildContinuityRecord("child-failed", "failed"))

    const coordinator = new ParentCoordinator()
    coordinator.registerChild("child-complete")
    coordinator.registerChild("child-failed")

    const snapshot = coordinator.snapshotDelegationStatus()

    expect(snapshot.failedDelegations).toEqual(new Set(["child-failed"]))
    expect(snapshot.completedDelegations).toEqual(new Set(["child-complete"]))
    expect(snapshot.activeDelegations.size).toBe(0)
    expect(snapshot.allComplete).toBe(true)
  })

  it("treats an empty delegation set as already complete", async () => {
    const { ParentCoordinator } = await loadModules(continuityFile)
    const coordinator = new ParentCoordinator()

    const snapshot = coordinator.snapshotDelegationStatus()

    expect(snapshot.totalDelegations).toBe(0)
    expect(snapshot.allComplete).toBe(true)
  })

  it("canCloseMainSession returns false while active delegations remain", async () => {
    const { ParentCoordinator, recordSessionContinuity } = await loadModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("child-running", "running"))

    const coordinator = new ParentCoordinator()
    coordinator.registerChild("child-running")

    expect(
      coordinator.canCloseMainSession({
        parentRequiresAnotherPass: false,
      }),
    ).toBe(false)
  })

  it("canCloseMainSession returns true only when all delegations are terminal and no further pass is required", async () => {
    const { ParentCoordinator, recordSessionContinuity } = await loadModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("child-complete", "completed"))
    recordSessionContinuity(buildContinuityRecord("child-failed", "failed"))

    const coordinator = new ParentCoordinator()
    coordinator.registerChild("child-complete")
    coordinator.registerChild("child-failed")

    expect(
      coordinator.canCloseMainSession({
        parentRequiresAnotherPass: true,
      }),
    ).toBe(false)
    expect(
      coordinator.canCloseMainSession({
        parentRequiresAnotherPass: false,
      }),
    ).toBe(true)
  })
})
