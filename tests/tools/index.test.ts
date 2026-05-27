import { describe, expect, it } from "vitest"
import * as sessionTools from "../../src/tools/session/index.js"

describe("session tools barrel index", () => {
  it("exports all public tools and helpers", () => {
    expect(sessionTools.createExecuteSlashCommandTool).toBeDefined()
    expect(sessionTools.resolveCommand).toBeDefined()
    expect(sessionTools.extractEntities).toBeDefined()
    expect(sessionTools.dispatchCommand).toBeDefined()
    expect(sessionTools.validateAgentFormat).toBeDefined()
    expect(sessionTools.validateAgentExists).toBeDefined()
    expect(sessionTools.validateCommandContract).toBeDefined()
    expect(sessionTools.selectAgent).toBeDefined()
    expect(sessionTools.parseWorkflowFile).toBeDefined()
    expect(sessionTools.validateWorkflow).toBeDefined()
  })
})
