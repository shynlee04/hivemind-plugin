import {
  buildLifecycleState,
  isValidLifecycleTransition,
  mapPhaseToDelegationPacketStatus,
  mapStatusToLifecyclePhase,
} from "../../src/lib/lifecycle-state.js"
import { describe, expect, it } from "vitest"

describe("lifecycle-state helpers", () => {
  it("maps continuity status to lifecycle phase using previous queued states", () => {
    expect(mapStatusToLifecyclePhase("pending")).toBe("created")
    expect(mapStatusToLifecyclePhase("queued")).toBe("queued")
    expect(mapStatusToLifecyclePhase("running", "queued")).toBe("queued")
    expect(mapStatusToLifecyclePhase("running", "dispatching")).toBe("running")
    expect(mapStatusToLifecyclePhase("interrupt", "queued")).toBe("queued")
    expect(mapStatusToLifecyclePhase("completed", "running")).toBe("completed")
    expect(mapStatusToLifecyclePhase("failed", "running")).toBe("failed")
    expect(mapStatusToLifecyclePhase("error", "running")).toBe("failed")
  })

  it("builds lifecycle state by preserving previous timestamps and nested state", () => {
    const previous = {
      phase: "dispatching",
      runMode: "sync",
      queueKey: "model:gpt-5.4",
      launchedAt: 10,
      queue: {
        active: 1,
        pending: 0,
        limit: 3,
      },
      observation: {
        source: "queue",
        observedAt: 20,
      },
    } as const

    expect(
      buildLifecycleState({
        phase: "running",
        runMode: "sync",
        queueKey: "model:gpt-5.4",
        previous,
      }),
    ).toEqual({
      phase: "running",
      runMode: "sync",
      queueKey: "model:gpt-5.4",
      launchedAt: 10,
      completedAt: undefined,
      queue: {
        active: 1,
        pending: 0,
        limit: 3,
      },
      observation: {
        source: "queue",
        observedAt: 20,
      },
      cleanup: undefined,
    })
  })

  it("maps lifecycle phases to delegation packet status and enforces transition rules", () => {
    expect(mapPhaseToDelegationPacketStatus("created")).toBe("pending")
    expect(mapPhaseToDelegationPacketStatus("dispatching")).toBe("pending")
    expect(mapPhaseToDelegationPacketStatus("completed")).toBe("completed")
    expect(mapPhaseToDelegationPacketStatus("failed")).toBe("failed")
    expect(isValidLifecycleTransition("created", "queued")).toBe(true)
    expect(isValidLifecycleTransition("running", "completed")).toBe(true)
    expect(isValidLifecycleTransition("completed", "running")).toBe(false)
    expect(isValidLifecycleTransition("running", "running")).toBe(false)
  })
})
