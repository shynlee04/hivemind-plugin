import { describe, expect, it } from "vitest"

import { getToolAuthority, inspectToolAuthorityCatalog } from "../../../src/features/runtime-pressure/index.js"

describe("runtime pressure authority matrix", () => {
  it("covers the currently registered plugin tools", () => {
    const tools = inspectToolAuthorityCatalog().map((entry) => entry.name).sort()

    expect(tools).toEqual([
      "bootstrap-init",
      "bootstrap-recover",
      "configure-primitive",
      "create-governance-session",
      "delegate-task",
      "delegation-status",
      "execute-slash-command",
      "hivemind-agent-work-create",
      "hivemind-agent-work-export",
      "hivemind-command-engine",
      "hivemind-doc",
      "hivemind-pressure",
      "hivemind-sdk-supervisor",
      "hivemind-session-view",
      "hivemind-trajectory",
      "prompt-analyze",
      "prompt-skim",
      "run-background-command",
      "session-context",
      "session-hierarchy",
      "session-journal-export",
      "session-patch",
      "session-tracker",
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
