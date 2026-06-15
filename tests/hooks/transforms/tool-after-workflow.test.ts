import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the dynamic import for config/workflow/index.js
vi.mock("../../../src/config/workflow/index.js", () => ({
  readWorkflow: vi.fn(),
  persistWorkflow: vi.fn(),
  advanceTurn: vi.fn(),
  completeCurrentTurn: vi.fn(),
}))

import { createToolAfterWorkflow } from "../../../src/hooks/transforms/tool-after-workflow.js"
import * as workflow from "../../../src/config/workflow/index.js"

describe("createToolAfterWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const wf = createToolAfterWorkflow({})
    expect(typeof wf).toBe("function")
  })

  it("skips non-configure-primitive tools (returns early)", async () => {
    const wf = createToolAfterWorkflow({})
    await wf({ tool: "read" })
    // No calls to workflow module expected
    expect(vi.mocked(workflow.readWorkflow)).not.toHaveBeenCalled()
  })

  it("skips when workflowId is missing", async () => {
    const wf = createToolAfterWorkflow({})
    await wf({ tool: "configure-primitive", args: { workflowTurn: 1 } })
    expect(vi.mocked(workflow.readWorkflow)).not.toHaveBeenCalled()
  })

  it("skips when workflowTurn is missing", async () => {
    const wf = createToolAfterWorkflow({})
    await wf({ tool: "configure-primitive", args: { workflowId: "wf_1" } })
    expect(vi.mocked(workflow.readWorkflow)).not.toHaveBeenCalled()
  })

  it("calls workflow persistence for configure-primitive with valid args", async () => {
    vi.mocked(workflow.readWorkflow).mockReturnValue({ id: "wf_1", turns: [] } as any)
    vi.mocked(workflow.advanceTurn).mockReturnValue({ id: "wf_1", turns: [{ number: 3 }] } as any)
    vi.mocked(workflow.completeCurrentTurn).mockReturnValue({ id: "wf_1", turns: [{ number: 3, status: "complete" }] } as any)

    const wf = createToolAfterWorkflow({})
    await wf({
      tool: "configure-primitive",
      args: { workflowId: "wf_1", workflowTurn: 3 },
    })

    expect(vi.mocked(workflow.readWorkflow)).toHaveBeenCalledWith("wf_1")
    expect(vi.mocked(workflow.advanceTurn)).toHaveBeenCalled()
    expect(vi.mocked(workflow.completeCurrentTurn)).toHaveBeenCalled()
    expect(vi.mocked(workflow.persistWorkflow)).toHaveBeenCalled()
  })

  it("catches workflow errors — does not throw", async () => {
    vi.mocked(workflow.readWorkflow).mockImplementation(() => {
      throw new Error("boom")
    })

    const wf = createToolAfterWorkflow({})
    await expect(wf({
      tool: "configure-primitive",
      args: { workflowId: "wf_1", workflowTurn: 1 },
    })).resolves.toBeUndefined()
  })

  it("returns early when workflow not found by readWorkflow", async () => {
    vi.mocked(workflow.readWorkflow).mockReturnValue(null)

    const wf = createToolAfterWorkflow({})
    await wf({
      tool: "configure-primitive",
      args: { workflowId: "wf_1", workflowTurn: 1 },
    })

    expect(vi.mocked(workflow.persistWorkflow)).not.toHaveBeenCalled()
  })
})
