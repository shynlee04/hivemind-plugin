import { vi } from "vitest"

import { FailureCheckpointTracker } from "../../../../src/coordination/delegation/escalation-timer.js"

describe("FailureCheckpointTracker", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("initializes state with zero action count and level 0", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")

    const state = tracker.getState("dt-1")
    expect(state).toEqual({
      lastCheckpointActionCount: 0,
      failureLevel: 0,
      injectionStopped: false,
      completed: false,
    })
  })

  it("detects failure when action count unchanged at checkpoint", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 0, onFailure)

    expect(onFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        delegationId: "dt-1",
        level: 1,
        elapsedSeconds: 60,
        actionCountAtCheckpoint: 0,
        actionCountAtPreviousCheckpoint: 0,
        isFinal: false,
      }),
    )
  })

  it("does not fail when action count increased", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 5, onFailure)

    expect(onFailure).not.toHaveBeenCalled()
  })

  it("compares to previous checkpoint count at level 2", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 3, onFailure)
    tracker.check("dt-1", 120, 3, onFailure)

    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onFailure).toHaveBeenLastCalledWith(
      expect.objectContaining({
        level: 1,
        elapsedSeconds: 120,
        actionCountAtCheckpoint: 3,
        actionCountAtPreviousCheckpoint: 3,
      }),
    )
  })

  it("reaches level 4 and stops injection at 300s", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 0, onFailure)
    tracker.check("dt-1", 120, 0, onFailure)
    tracker.check("dt-1", 180, 0, onFailure)
    tracker.check("dt-1", 300, 0, onFailure)

    expect(onFailure).toHaveBeenCalledTimes(4)
    expect(onFailure).toHaveBeenLastCalledWith(
      expect.objectContaining({
        level: 4,
        elapsedSeconds: 300,
        isFinal: true,
      }),
    )
    expect(tracker.shouldInject("dt-1")).toBe(false)
  })

  it("increments failure level when actions stall at non-consecutive checkpoints", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 0, onFailure)
    tracker.check("dt-1", 120, 5, onFailure)
    tracker.check("dt-1", 180, 5, onFailure)

    expect(onFailure).toHaveBeenCalledTimes(2)
    expect(onFailure).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ level: 1, elapsedSeconds: 60 }),
    )
    expect(onFailure).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ level: 2, elapsedSeconds: 180 }),
    )
  })

  it("ignores non-checkpoint elapsed times", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 30, 0, onFailure)
    tracker.check("dt-1", 45, 0, onFailure)
    tracker.check("dt-1", 90, 0, onFailure)

    expect(onFailure).not.toHaveBeenCalled()
  })

  it("returns true for shouldInject when not stopped", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")

    expect(tracker.shouldInject("dt-1")).toBe(true)
  })

  it("returns true for shouldInject for unknown delegation", () => {
    const tracker = new FailureCheckpointTracker()

    expect(tracker.shouldInject("unknown")).toBe(true)
  })

  it("marks delegation completed on stop", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    tracker.stop("dt-1")

    const state = tracker.getState("dt-1")
    expect(state?.completed).toBe(true)
  })

  it("does not check after injection stopped", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 0, onFailure)
    tracker.check("dt-1", 120, 0, onFailure)
    tracker.check("dt-1", 180, 0, onFailure)
    tracker.check("dt-1", 300, 0, onFailure)

    expect(tracker.shouldInject("dt-1")).toBe(false)

    tracker.check("dt-1", 300, 0, onFailure)
    expect(onFailure).toHaveBeenCalledTimes(4)
  })

  it("does not check after completed", () => {
    const tracker = new FailureCheckpointTracker()
    tracker.start("dt-1")
    tracker.stop("dt-1")
    const onFailure = vi.fn()

    tracker.check("dt-1", 60, 0, onFailure)

    expect(onFailure).not.toHaveBeenCalled()
  })
})
