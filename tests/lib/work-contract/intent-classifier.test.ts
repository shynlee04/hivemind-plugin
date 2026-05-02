import { describe, it, expect } from "vitest"
import { classifyIntent, type IntentCategory } from "../../../src/lib/work-contract/intent-classifier.js"

describe("intent-classifier", () => {
  it("classifies research intent", () => {
    expect(classifyIntent("research how to implement OAuth")).toBe("research")
    expect(classifyIntent("find articles about caching")).toBe("research")
  })

  it("classifies implementation intent", () => {
    expect(classifyIntent("implement the login feature")).toBe("implementation")
    expect(classifyIntent("build a new API endpoint")).toBe("implementation")
  })

  it("classifies review intent", () => {
    expect(classifyIntent("review this pull request")).toBe("review")
    expect(classifyIntent("code review for auth module")).toBe("review")
  })

  it("classifies debug intent", () => {
    expect(classifyIntent("fix the crash in production")).toBe("debug")
    expect(classifyIntent("debug failing tests")).toBe("debug")
  })

  it("classifies documentation intent", () => {
    expect(classifyIntent("write README for the module")).toBe("documentation")
    expect(classifyIntent("document the API")).toBe("documentation")
  })

  it("classifies delegation intent", () => {
    expect(classifyIntent("delegate this to a specialist")).toBe("delegation")
    expect(classifyIntent("spawn a sub-agent for UI")).toBe("delegation")
  })

  it("defaults to unknown for unrecognized text", () => {
    expect(classifyIntent("hello world")).toBe("unknown")
    expect(classifyIntent("random gibberish xyz")).toBe("unknown")
  })
})
