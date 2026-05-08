import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { createDelegationEventObserver, createSessionJourneyEventObserver } from "../../src/hooks/observers/event-observers.js"

describe("plugin event observers", () => {
  it("extracts delegation lifecycle facts without write-capable dependencies", async () => {
    const observer = createDelegationEventObserver()

    await expect(observer({ event: { type: "session.idle", properties: { sessionID: "ses_child" } } })).resolves.toEqual({
      kind: "delegation-session-idle",
      sessionId: "ses_child",
    })
  })

  it("extracts session journey projection facts through an injected predicate", async () => {
    const observer = createSessionJourneyEventObserver(() => true)

    await expect(observer({ event: { type: "session.created" } })).resolves.toEqual({
      kind: "session-journey-event",
      event: { type: "session.created" },
      source: "plugin.event",
    })
  })

  it("does not import durable writers or managers", () => {
    const source = readFileSync("src/hooks/observers/event-observers.ts", "utf-8")

    expect(source).not.toMatch(/createEventTrackerArtifactsFromHook|continuity|delegation-persistence|DelegationManager/)
  })
})
