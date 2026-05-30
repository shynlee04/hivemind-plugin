import { describe, expect, it } from "vitest"
import { selectAgent, getWordStems } from "../../src/tools/session/semantic-agent-selector.js"

describe("semantic-agent-selector", () => {
  const mockAgents = [
    { name: "gsd-executor", description: "Executes plans atomically" },
    { name: "gsd-reviewer", description: "Reviews code changes" },
    { name: "hm-architect", description: "Designs runtime composition" },
    { name: "build", description: "Primary build agent" },
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

  it("returns build agent as ultimate fallback when no matching agent is found", async () => {
    const result = await selectAgent("unknown intent", mockAgents)
    expect(result.agent).toBe("build")
    expect(result.fallback).toBe(true)
    expect(result.userSpecified).toBe(false)
  })

  it("returns null fallback when agent list is empty", async () => {
    const result = await selectAgent("anything", [])
    expect(result.agent).toBeNull()
    expect(result.fallback).toBe(true)
  })

  it("splits hyphenated command names for keyword matching and applies lineage fallback", async () => {
    const result = await selectAgent("gsd-stats", mockAgents)
    expect(result.agent).toBe("gsd-executor")
    expect(result.fallback).toBe(true)
  })

  it("prefers prefix-lineage matching for hyphenated commands", async () => {
    const result = await selectAgent("hm-architect-task", mockAgents)
    expect(result.agent).toBe("hm-architect")
    expect(result.fallback).toBe(false)
  })

  // New features test coverage
  describe("suffix and synonym stemming matching", () => {
    const stemmingAgents = [
      { name: "gsd-verifier", description: "Verifies test compliance" },
      { name: "gsd-planner", description: "Plans strategic milestones" },
      { name: "hm-architect", description: "System architect" },
    ]

    it("should stem verify to verifier", async () => {
      const result = await selectAgent("gsd-verify-phase", stemmingAgents)
      expect(result.agent).toBe("gsd-verifier")
    })

    it("should stem plan to planner", async () => {
      const result = await selectAgent("gsd-plan-phase", stemmingAgents)
      expect(result.agent).toBe("gsd-planner")
    })

    it("should map synonyms: validate -> verifier", async () => {
      const result = await selectAgent("validate-code", stemmingAgents)
      expect(result.agent).toBe("gsd-verifier")
    })
  })

  describe("dynamic custom prefix/lineage matching", () => {
    const customAgents = [
      { name: "foo-runner", description: "Runs custom foo commands" },
      { name: "foo-planner", description: "Plans foo operations" },
      { name: "bar-runner", description: "Runs bar commands" },
      { name: "build", description: "Universal build agent" },
    ]

    it("should pair foo-* command with foo-* agent dynamically", async () => {
      const result = await selectAgent("foo-run-test", customAgents)
      expect(result.agent).toBe("foo-runner")
      expect(result.fallback).toBe(false)
    })

    it("should fall back to lineage-aware fallback (foo-planner) if no functional keyword matches but prefix matches", async () => {
      const result = await selectAgent("foo-unknown-action", customAgents)
      expect(result.agent).toBe("foo-planner")
      expect(result.fallback).toBe(true)
    })

    it("should fall back to build agent if lineage prefix has no agents registered", async () => {
      const result = await selectAgent("baz-run", customAgents)
      expect(result.agent).toBe("build")
      expect(result.fallback).toBe(true)
    })
  })
})
