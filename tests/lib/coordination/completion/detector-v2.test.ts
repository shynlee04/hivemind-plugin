import { vi } from "vitest"

import { CompletionDetector } from "../../../../src/coordination/completion/detector.js"
import type { DelegationResult } from "../../../../src/coordination/delegation/types.js"

describe("CompletionDetector WaiterModel dual-signal", () => {
  it("fires callback exactly once after both completion event and terminal status arrive", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalCompletionEvent("dt-1")
    detector.signalTerminalStatus("dt-1", "completed")
    detector.signalCompletionEvent("dt-1")
    detector.signalTerminalStatus("dt-1", "completed")

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith({ delegationId: "dt-1", status: "completed" })
  })

  it("does not fire callback when only the completion event arrives", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalCompletionEvent("dt-1")

    expect(callback).not.toHaveBeenCalled()
  })

  it("does not fire callback when only terminal status arrives", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalTerminalStatus("dt-1", "completed")

    expect(callback).not.toHaveBeenCalled()
  })

  it("fires callback when the second signal arrives regardless of order", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalTerminalStatus("dt-1", "completed")
    detector.signalCompletionEvent("dt-1")

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith({ delegationId: "dt-1", status: "completed" })
  })

  it("handles ten concurrent delegations independently and fires each once", () => {
    const detector = new CompletionDetector()
    const callbacks = Array.from({ length: 10 }, () => vi.fn())

    callbacks.forEach((callback, index) => {
      detector.watchDualSignal(`dt-${index}`, `ses-${index}`, callback)
      detector.signalCompletionEvent(`dt-${index}`)
    })
    callbacks.forEach((_callback, index) => {
      detector.signalTerminalStatus(`dt-${index}`, "completed")
      detector.signalTerminalStatus(`dt-${index}`, "completed")
    })

    callbacks.forEach((callback, index) => {
      expect(callback).toHaveBeenCalledOnce()
      expect(callback).toHaveBeenCalledWith({ delegationId: `dt-${index}`, status: "completed" })
    })
  })

  it("clears pending dual-signal state when unwatch is called", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalCompletionEvent("dt-1")
    detector.unwatch("dt-1")
    detector.signalTerminalStatus("dt-1", "completed")

    expect(callback).not.toHaveBeenCalled()
  })

  it("tracks terminal status transitions and only completes on terminal status", () => {
    const detector = new CompletionDetector()
    const callback = vi.fn<(result: DelegationResult) => void>()

    detector.watchDualSignal("dt-1", "ses-1", callback)
    detector.signalCompletionEvent("dt-1")
    detector.signalTerminalStatus("dt-1", "dispatched")
    detector.signalTerminalStatus("dt-1", "running")

    expect(callback).not.toHaveBeenCalled()

    detector.signalTerminalStatus("dt-1", "completed")

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith({ delegationId: "dt-1", status: "completed" })
  })
})
