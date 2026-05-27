import { describe, expect, it, vi } from "vitest"
import { selectAgent } from "../../src/tools/session/semantic-agent-selector.js"

// Mock the prompts module so it doesn't try to open stdin/stdout in tests
vi.mock("../../src/cli/ui/prompts.js", () => {
  return {
    createTuiPrompt: vi.fn(),
  }
})

import { createTuiPrompt } from "../../src/cli/ui/prompts.js"

describe("semantic-agent-selector", () => {
  const mockAgents = [
    { name: "gsd-executor", description: "Executes plans atomically" },
    { name: "gsd-reviewer", description: "Reviews code changes" },
    { name: "hm-architect", description: "Designs runtime composition" },
  ]

  it("selects agent by keyword match in name", async () => {
    const result = await selectAgent("run the executor agent", mockAgents)
    expect(result.agent).toBe("gsd-executor")
    expect(result.fallback).toBe(false)
    expect(result.userSpecified).toBe(false)
  })

  it("selects agent by keyword match in description", async () => {
    const result = await selectAgent("find someone who reviews changes", mockAgents)
    expect(result.agent).toBe("gsd-reviewer")
    expect(result.fallback).toBe(false)
  })

  it("scores better matches higher", async () => {
    const result = await selectAgent("gsd reviewer review code", mockAgents)
    expect(result.agent).toBe("gsd-reviewer")
  })

  it("prompts the user if no matching agent is found", async () => {
    const mockedPrompt = vi.mocked(createTuiPrompt)
    mockedPrompt.mockResolvedValueOnce("hm-architect")

    const result = await selectAgent("unknown intent", mockAgents)
    expect(mockedPrompt).toHaveBeenCalled()
    expect(result.agent).toBe("hm-architect")
    expect(result.fallback).toBe(false)
    expect(result.userSpecified).toBe(true)
  })

  it("falls back when user cancels the prompt", async () => {
    const mockedPrompt = vi.mocked(createTuiPrompt)
    mockedPrompt.mockResolvedValueOnce(null)

    const result = await selectAgent("another unknown intent", mockAgents)
    expect(result.agent).toBeNull()
    expect(result.fallback).toBe(true)
    expect(result.userSpecified).toBe(false)
  })
})
