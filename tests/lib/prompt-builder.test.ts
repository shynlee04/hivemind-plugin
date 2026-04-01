import { describe, it, expect } from "vitest"
import { buildPromptText } from "../../src/lib/helpers.js"

describe("buildPromptText - 6-section format (CAT-009)", () => {
  it("should produce all 6 required sections separated by ---", () => {
    const result = buildPromptText({
      description: "Implement the feature",
      prompt: "Add the new endpoint to the API",
      category: "implementation",
      scope: "src/api/",
      constraints: ["Keep changes minimal", "Add tests"],
      guidanceText: "Prefer the smallest safe code change",
      agent: "builder",
    })

    const sections = result.split("\n---\n")

    expect(sections).toHaveLength(6)

    expect(sections[0].startsWith("TASK:")).toBe(true)
    expect(sections[1].startsWith("EXPECTED OUTCOME:")).toBe(true)
    expect(sections[2].startsWith("REQUIRED TOOLS:")).toBe(true)
    expect(sections[3].startsWith("MUST DO:")).toBe(true)
    expect(sections[4].startsWith("MUST NOT DO:")).toBe(true)
    expect(sections[5].startsWith("CONTEXT:")).toBe(true)
  })

  it("should include description and prompt in TASK section", () => {
    const result = buildPromptText({
      description: "Build feature X",
      prompt: "Create the endpoint",
      agent: "builder",
    })

    const sections = result.split("\n---\n")
    expect(sections[0]).toContain("Build feature X")
    expect(sections[0]).toContain("Create the endpoint")
  })

  it("should include guidanceText in EXPECTED OUTCOME section", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      guidanceText: "Verify correctness",
      agent: "builder",
    })

    const sections = result.split("\n---\n")
    expect(sections[1]).toContain("Verify correctness")
  })

  it("should include constraints in MUST DO section", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      constraints: ["Keep changes minimal"],
      agent: "builder",
    })

    const sections = result.split("\n---\n")
    expect(sections[3]).toContain("Keep changes minimal")
  })

  it("should include scope and category in CONTEXT section", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      scope: "src/lib/",
      category: "research",
      agent: "researcher",
    })

    const sections = result.split("\n---\n")
    expect(sections[5]).toContain("src/lib/")
    expect(sections[5]).toContain("research")
  })

  it("should list researcher tools as read, glob, grep, webfetch, websearch", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      agent: "researcher",
    })

    const sections = result.split("\n---\n")
    expect(sections[2]).toContain("read")
    expect(sections[2]).toContain("glob")
    expect(sections[2]).toContain("grep")
    expect(sections[2]).toContain("webfetch")
    expect(sections[2]).toContain("websearch")
  })

  it("should list builder tools as read, glob, grep, edit, write, bash", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      agent: "builder",
    })

    const sections = result.split("\n---\n")
    expect(sections[2]).toContain("edit")
    expect(sections[2]).toContain("write")
    expect(sections[2]).toContain("bash")
  })

  it("should list critic tools as read, glob, grep, bash", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      agent: "critic",
    })

    const sections = result.split("\n---\n")
    expect(sections[2]).toContain("bash")
    expect(sections[2]).toContain("read")
    expect(sections[2]).not.toContain("edit")
    expect(sections[2]).not.toContain("write")
  })

  it("should include agent restrictions in MUST NOT DO section for researcher", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      agent: "researcher",
    })

    const sections = result.split("\n---\n")
    expect(sections[4]).toContain("edit")
    expect(sections[4]).toContain("write")
    expect(sections[4]).toContain("bash")
  })

  it("should include agent restrictions in MUST NOT DO section for critic", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do something",
      agent: "critic",
    })

    const sections = result.split("\n---\n")
    expect(sections[4]).toContain("edit")
    expect(sections[4]).toContain("write")
    expect(sections[4]).not.toContain("bash")
  })
})
