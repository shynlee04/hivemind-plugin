import { describe, expect, it } from "vitest"
import { selectAgent } from "../../src/tools/session/semantic-agent-selector.js"

describe("semantic-agent-selector", () => {
  const mockAgents = [
    { name: "gsd-executor", description: "Executes plans atomically" },
    { name: "gsd-reviewer", description: "Reviews code changes" },
    { name: "hm-architect", description: "Designs runtime composition" },
  ]

  it("selects agent by keyword match in name with prefix filtering", async () => {
    const result = await selectAgent("gsd-executor run the executor", mockAgents)
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

  it("returns fallback when no matching agent is found", async () => {
    const result = await selectAgent("unknown intent", mockAgents)
    expect(result.agent).toBeNull()
    expect(result.fallback).toBe(true)
    expect(result.userSpecified).toBe(false)
  })

  it("returns fallback when agent list is empty", async () => {
    const result = await selectAgent("anything", [])
    expect(result.agent).toBeNull()
    expect(result.fallback).toBe(true)
  })

  it("splits hyphenated command names for keyword matching", async () => {
    const result = await selectAgent("gsd-stats", mockAgents)
    expect(result.agent).toBe("gsd-executor")
    expect(result.fallback).toBe(false)
  })

  it("prefers prefix-lineage matching for hyphenated commands", async () => {
    const result = await selectAgent("hm-architect-task", mockAgents)
    expect(result.agent).toBe("hm-architect")
  })
})
