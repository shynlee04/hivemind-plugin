import { describe, expect, it } from "vitest"

import { getToolAuthority, inspectToolAuthorityCatalog } from "../../../src/lib/runtime-pressure/index.js"

describe("runtime pressure authority matrix", () => {
  it("covers the currently registered plugin tools", () => {
    const tools = inspectToolAuthorityCatalog().map((entry) => entry.name).sort()

    expect(tools).toEqual([
      "configure-primitive",
      "delegate-task",
      "delegation-status",
      "hivemind-agent-work-create",
      "hivemind-agent-work-export",
      "hivemind-doc",
      "hivemind-pressure",
      "hivemind-trajectory",
      "prompt-analyze",
      "prompt-skim",
      "run-background-command",
      "session-journal-export",
      "session-patch",
      "validate-restart",
    ])
  })

  it("marks execution and trajectory tools with conservative authority", () => {
    expect(getToolAuthority("delegate-task")).toMatchObject({ authority: "execute", mutatesState: true, canExecute: true })
    expect(getToolAuthority("hivemind-trajectory")).toMatchObject({ authority: "state", mutatesState: true, canExecute: false })
    expect(getToolAuthority("hivemind-agent-work-create")).toMatchObject({ authority: "state", mutatesState: true, canExecute: false })
    expect(getToolAuthority("hivemind-agent-work-export")).toMatchObject({ authority: "read", mutatesState: false, canExecute: false })
  })
})
