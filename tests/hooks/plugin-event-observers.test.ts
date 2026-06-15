import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { createDelegationEventObserver, createSessionEntryEventObserver } from "../../src/hooks/observers/event-observers.js"

describe("plugin event observers", () => {
  it("extracts delegation lifecycle facts without write-capable dependencies", async () => {
    const observer = createDelegationEventObserver()

    await expect(observer({ event: { type: "session.idle", properties: { sessionID: "ses_child" } } })).resolves.toEqual({
      kind: "delegation-session-idle",
      sessionId: "ses_child",
    })
  })

  it("extracts session entry intake facts without write-capable dependencies", async () => {
    const { observer } = createSessionEntryEventObserver()

    await expect(observer({ event: { type: "session.created", properties: { sessionID: "ses_main" }, messages: [{ role: "user", content: "hello" }] } })).resolves.toMatchObject({
      kind: "session-created",
      sessionId: "ses_main",
    })
  })

  it("does not import durable writers or managers", () => {
    const source = readFileSync("src/hooks/observers/event-observers.ts", "utf-8")

    expect(source).not.toMatch(/createEventTrackerArtifactsFromHook|continuity|delegation-persistence|DelegationManager/)
  })
})
