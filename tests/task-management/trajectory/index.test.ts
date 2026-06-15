import { describe, expect, it } from "vitest"

import * as trajectoryIndex from "../../../src/task-management/trajectory/index.js"

describe("trajectory index re-exports", () => {
  it("re-exports types from types.ts", () => {
    expect(trajectoryIndex.TRAJECTORY_LEDGER_VERSION).toBe(1)
  })

  it("re-exports ledger functions from ledger.ts", () => {
    expect(typeof trajectoryIndex.getTrajectoryLedgerPath).toBe("function")
    expect(typeof trajectoryIndex.createEmptyTrajectoryLedger).toBe("function")
    expect(typeof trajectoryIndex.readTrajectoryLedger).toBe("function")
    expect(typeof trajectoryIndex.writeTrajectoryLedger).toBe("function")
  })

  it("re-exports store operations from store-operations.ts", () => {
    expect(typeof trajectoryIndex.inspectTrajectoryLedger).toBe("function")
    expect(typeof trajectoryIndex.attachTrajectoryEvidence).toBe("function")
    expect(typeof trajectoryIndex.eventTrajectory).toBe("function")
    expect(typeof trajectoryIndex.checkpointTrajectory).toBe("function")
    expect(typeof trajectoryIndex.closeTrajectory).toBe("function")
    expect(typeof trajectoryIndex.traverseTrajectory).toBe("function")
    expect(typeof trajectoryIndex.createTrajectoryLedger).toBe("function")
    expect(typeof trajectoryIndex.createPhaseTrajectory).toBe("function")
    expect(typeof trajectoryIndex.transitionTrajectory).toBe("function")
    expect(typeof trajectoryIndex.addTrajectoryEvent).toBe("function")
  })
})
