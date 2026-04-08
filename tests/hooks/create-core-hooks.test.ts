import { describe, expect, it, vi } from "vitest"
import { createCoreHooks } from "../../src/hooks/create-core-hooks.js"

function makeEvent(sessionID: string, type = "session.idle") {
  return {
    type,
    properties: {
      info: {
        id: sessionID,
      },
    },
  }
}

describe("createCoreHooks", () => {
  it("fans out event handling so lifecycle and session observers both run", async () => {
    const handleEvent = vi.fn()
    const sessionObserver = vi.fn().mockResolvedValue(undefined)
    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent } as any,
      client: {} as any,
      stateManager: {} as any,
      eventObservers: [sessionObserver],
    } as any)

    const event = makeEvent("sess-core")
    await hooks.event({ event })

    expect(handleEvent).toHaveBeenCalledWith({
      event,
      eventType: "session.idle",
      sessionID: "sess-core",
    })
    expect(sessionObserver).toHaveBeenCalledWith({ event })
  })
})
