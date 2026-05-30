import { describe, it, expect } from "vitest"
import {
  isObject,
  getNestedValue,
  asString,
  unwrapData,
  stableStringify,
  makeToolSignature,
  getPromptToolCompatibility,
  buildPromptText,
  extractAssistantText,
} from "../../src/shared/helpers.js"
import type { PermissionRule } from "../../src/shared/types.js"

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject(new Date())).toBe(true)
  })

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false)
    expect(isObject([1, 2])).toBe(false)
  })

  it("returns false for strings", () => {
    expect(isObject("hello")).toBe(false)
    expect(isObject("")).toBe(false)
  })

  it("returns false for numbers and booleans", () => {
    expect(isObject(42)).toBe(false)
    expect(isObject(true)).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe("getNestedValue", () => {
  it("returns nested value for valid path", () => {
    const obj = { a: { b: { c: 42 } } }
    expect(getNestedValue(obj, ["a", "b", "c"])).toBe(42)
  })

  it("returns value at single-level path", () => {
    const obj = { name: "test" }
    expect(getNestedValue(obj, ["name"])).toBe("test")
  })

  it("returns undefined for missing path", () => {
    const obj = { a: { b: 1 } }
    expect(getNestedValue(obj, ["a", "c"])).toBeUndefined()
  })

  it("returns undefined for deeply missing path", () => {
    const obj = { a: 1 }
    expect(getNestedValue(obj, ["x", "y", "z"])).toBeUndefined()
  })

  it("returns undefined when intermediate value is not an object", () => {
    const obj = { a: 5 }
    expect(getNestedValue(obj, ["a", "b"])).toBeUndefined()
  })

  it("returns the input itself for empty path", () => {
    const obj = { a: 1 }
    expect(getNestedValue(obj, [])).toEqual({ a: 1 })
  })

  it("returns undefined for non-object input", () => {
    expect(getNestedValue(null, ["a"])).toBeUndefined()
    expect(getNestedValue("str", ["a"])).toBeUndefined()
  })
})

describe("asString", () => {
  it("returns string for string input", () => {
    expect(asString("hello")).toBe("hello")
  })

  it("returns undefined for non-string input", () => {
    expect(asString(42)).toBeUndefined()
    expect(asString(null)).toBeUndefined()
    expect(asString(undefined)).toBeUndefined()
    expect(asString(true)).toBeUndefined()
    expect(asString({})).toBeUndefined()
    expect(asString([])).toBeUndefined()
  })

  it("returns undefined for empty string", () => {
    expect(asString("")).toBeUndefined()
  })
})

describe("unwrapData", () => {
  it("unwraps data property from response", () => {
    expect(unwrapData({ data: { id: 1 } })).toEqual({ id: 1 })
    expect(unwrapData({ data: "value" })).toBe("value")
    expect(unwrapData({ data: 42 })).toBe(42)
  })

  it("throws on error property with string message", () => {
    expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
      "[Harness] Something went wrong"
    )
  })

  it("throws on error property with object message at top level", () => {
    expect(() =>
      unwrapData({ error: { message: "Detailed error" } })
    ).toThrow("[Harness] Detailed error")
  })

  it("extracts message from named error shape (data.message)", () => {
    expect(() =>
      unwrapData({ error: { name: "UnknownError", data: { message: "Session not found" } } })
    ).toThrow("[Harness] Session not found")
  })

  it("extracts message from MessageAbortedError shape", () => {
    expect(() =>
      unwrapData({ error: { name: "MessageAbortedError", data: { message: "Request aborted" } } })
    ).toThrow("[Harness] Request aborted")
  })

  it("extracts messages from BadRequestError errors array", () => {
    expect(() =>
      unwrapData({
        error: {
          errors: [
            { message: "Field required" },
            { reason: "Invalid format" },
          ],
        },
      })
    ).toThrow("[Harness] Field required; Invalid format")
  })

  it("extracts messages from SDK payloads that use the singular error array key", () => {
    expect(() =>
      unwrapData({
        error: {
          error: [
            { message: "Invalid session id" },
            { reason: "Expected value to start with 'ses'" },
          ],
        },
      })
    ).toThrow("[Harness] Invalid session id; Expected value to start with 'ses'")
  })

  it("falls back to error name + JSON for unrecognizable error shape", () => {
    expect(() => unwrapData({ error: { code: 500 } })).toThrow(
      "[Harness] Unknown SDK error: "
    )
  })

  it("returns response as-is when no data or error", () => {
    const response = { result: "ok" }
    expect(unwrapData(response)).toEqual({ result: "ok" })
  })

  it("returns data even if it is falsy but defined", () => {
    expect(unwrapData({ data: 0 })).toBe(0)
    expect(unwrapData({ data: false })).toBe(false)
    expect(unwrapData({ data: "" })).toBe("")
  })

  it("error takes precedence over data when both present", () => {
    expect(() =>
      unwrapData({ data: "ok", error: "fail" })
    ).toThrow("[Harness] fail")
  })
})

describe("stableStringify", () => {
  it("stringifies primitives", () => {
    expect(stableStringify(null)).toBe("null")
    expect(stableStringify(42)).toBe("42")
    expect(stableStringify("hello")).toBe('"hello"')
    expect(stableStringify(true)).toBe("true")
  })

  it("stringifies arrays preserving order", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]")
    expect(stableStringify([])).toBe("[]")
  })

  it("sorts object keys deterministically", () => {
    const obj = { z: 1, a: 2, m: 3 }
    expect(stableStringify(obj)).toBe('{"a":2,"m":3,"z":1}')
  })

  it("handles nested objects with sorted keys", () => {
    const obj = { b: { y: 1, x: 2 }, a: 3 }
    expect(stableStringify(obj)).toBe('{"a":3,"b":{"x":2,"y":1}}')
  })

  it("produces same output regardless of insertion order", () => {
    const obj1 = { z: 1, a: 2 }
    const obj2 = { a: 2, z: 1 }
    expect(stableStringify(obj1)).toBe(stableStringify(obj2))
  })

  it("handles arrays of objects", () => {
    const arr = [{ b: 1, a: 2 }, { d: 3, c: 4 }]
    expect(stableStringify(arr)).toBe('[{"a":2,"b":1},{"c":4,"d":3}]')
  })
})

describe("makeToolSignature", () => {
  it("produces consistent signature string", () => {
    const sig = makeToolSignature("read", { path: "/tmp/file.txt" })
    expect(sig).toBe('read:{"path":"/tmp/file.txt"}')
  })

  it("is deterministic regardless of arg key order", () => {
    const sig1 = makeToolSignature("edit", { b: 2, a: 1 })
    const sig2 = makeToolSignature("edit", { a: 1, b: 2 })
    expect(sig1).toBe(sig2)
  })

  it("handles unserializable args gracefully", () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const sig = makeToolSignature("bash", circular)
    expect(sig).toBe("bash:<unserializable>")
  })

  it("handles null args", () => {
    expect(makeToolSignature("read", null)).toBe("read:null")
  })

  it("handles undefined args", () => {
    expect(makeToolSignature("read", undefined)).toBe("read:undefined")
  })
})

describe("getPromptToolCompatibility", () => {
  it("maps ask rules to {permission: false}", () => {
    const rules: PermissionRule[] = [
      { permission: "edit", pattern: "*", action: "ask" },
      { permission: "write", pattern: "*", action: "ask" },
    ]
    const result = getPromptToolCompatibility(rules)
    expect(result).toEqual({ edit: false, write: false })
  })

  it("ignores allow rules", () => {
    const rules: PermissionRule[] = [
      { permission: "read", pattern: "*", action: "allow" },
      { permission: "edit", pattern: "*", action: "ask" },
    ]
    const result = getPromptToolCompatibility(rules)
    expect(result).toEqual({ edit: false })
  })

  it("returns undefined when no ask rules exist", () => {
    const rules: PermissionRule[] = [
      { permission: "read", pattern: "*", action: "allow" },
    ]
    expect(getPromptToolCompatibility(rules)).toBeUndefined()
  })

  it("returns undefined for empty rules array", () => {
    expect(getPromptToolCompatibility([])).toBeUndefined()
  })
})

describe("buildPromptText", () => {
  const baseArgs = {
    description: "Fix the bug",
    prompt: "Update the handler to validate input",
  }

  it("produces structured prompt with all sections", () => {
    const result = buildPromptText(baseArgs)
    expect(result).toContain("TASK: Fix the bug")
    expect(result).toContain("Update the handler to validate input")
    expect(result).toContain("EXPECTED OUTCOME:")
    expect(result).toContain("REQUIRED TOOLS:")
    expect(result).toContain("MUST DO:")
    expect(result).toContain("MUST NOT DO:")
    expect(result).toContain("CONTEXT:")
  })

  it("uses default expected outcome when guidanceText not provided", () => {
    const result = buildPromptText(baseArgs)
    expect(result).toContain(
      "EXPECTED OUTCOME: Complete the task as described"
    )
  })

  it("uses custom guidanceText when provided", () => {
    const result = buildPromptText({
      ...baseArgs,
      guidanceText: "All tests must pass",
    })
    expect(result).toContain("EXPECTED OUTCOME: All tests must pass")
  })

  it("includes requiredTools when provided", () => {
    const result = buildPromptText({
      ...baseArgs,
      requiredTools: ["read", "glob", "grep"],
    })
    expect(result).toContain("REQUIRED TOOLS: read, glob, grep")
  })

  it("defaults requiredTools to empty when not provided", () => {
    const result = buildPromptText(baseArgs)
    expect(result).toContain("REQUIRED TOOLS: ")
  })

  it("includes mustNotDo items when provided", () => {
    const result = buildPromptText({
      ...baseArgs,
      mustNotDo: ["edit", "write"],
    })
    expect(result).toContain("MUST NOT DO:")
    expect(result).toContain("- edit")
    expect(result).toContain("- write")
  })

  it("shows 'None specified' when mustNotDo is empty", () => {
    const result = buildPromptText({
      ...baseArgs,
      mustNotDo: [],
    })
    expect(result).toContain("MUST NOT DO: None specified")
  })

  it("includes constraints in MUST DO section", () => {
    const result = buildPromptText({
      ...baseArgs,
      constraints: ["Use TypeScript strict mode", "Add error handling"],
    })
    expect(result).toContain("MUST DO:")
    expect(result).toContain("- Use TypeScript strict mode")
    expect(result).toContain("- Add error handling")
  })

  it("uses default MUST DO when no constraints provided", () => {
    const result = buildPromptText(baseArgs)
    expect(result).toContain(
      "MUST DO: Follow the task instructions precisely"
    )
  })

  it("includes scope and category in context", () => {
    const result = buildPromptText({
      ...baseArgs,
      scope: "src/lib/",
      category: "implementation",
    })
    expect(result).toContain("CONTEXT:")
    expect(result).toContain("scope: src/lib/")
    expect(result).toContain("category: implementation")
  })

  it("includes agent in context", () => {
    const result = buildPromptText({
      ...baseArgs,
      agent: "researcher",
    })
    expect(result).toContain("agent: researcher")
  })

  it("defaults agent to builder when not provided", () => {
    const result = buildPromptText(baseArgs)
    expect(result).toContain("agent: builder")
  })

  it("sections are separated by ---", () => {
    const result = buildPromptText(baseArgs)
    const parts = result.split("\n---\n")
    expect(parts.length).toBe(6)
  })
})

describe("buildPromptText with session context", () => {
  it("appends session context section when provided", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do the thing",
      sessionContext: "## What Happened\nSession started.",
    })

    expect(result).toContain("## Session Context")
    expect(result).toContain("## What Happened")
    expect(result).toContain("Session started.")
  })

  it("omits session context section when not provided", () => {
    const result = buildPromptText({
      description: "Test task",
      prompt: "Do the thing",
    })

    expect(result).not.toContain("## Session Context")
  })

  it("places session context after all other sections", () => {
    const result = buildPromptText({
      description: "Task",
      prompt: "Do it",
      scope: "src/",
      sessionContext: "## Session State\nActive",
    })

    const sessionIndex = result.indexOf("## Session Context")
    const contextIndex = result.indexOf("CONTEXT:")
    expect(sessionIndex).toBeGreaterThan(contextIndex)
  })

  it("passes session content through constraints", () => {
    const result = buildPromptText({
      description: "Patch session",
      prompt: "Update the file",
      constraints: [
        "session context: ## What Happened\nSession initialized.\n## Risks\nNone yet.",
      ],
    })

    expect(result).toContain("MUST DO:")
    expect(result).toContain("session context:")
    expect(result).toContain("## What Happened")
    expect(result).toContain("Session initialized.")
  })

  it("combines sessionContext param with other constraints", () => {
    const result = buildPromptText({
      description: "Lane analysis",
      prompt: "Analyze the prompt",
      constraints: ["Read-only analysis", "No file writes"],
      sessionContext: "## What Happened\nSkim complete.",
    })

    expect(result).toContain("Read-only analysis")
    expect(result).toContain("No file writes")
    expect(result).toContain("## Session Context")
    expect(result).toContain("Skim complete.")

    // Verify ordering: constraints in MUST DO, session context at end
    const mustDoIndex = result.indexOf("MUST DO:")
    const sessionIndex = result.indexOf("## Session Context")
    expect(sessionIndex).toBeGreaterThan(mustDoIndex)
  })
})

describe("extractAssistantText", () => {
  it("returns the last assistant message text when info.role === 'assistant'", () => {
    const messages = [
      { role: "user", parts: [{ type: "text", text: "hello" }] },
      { info: { role: "assistant" }, parts: [{ type: "text", text: "first response" }] },
      { info: { role: "assistant" }, parts: [{ type: "text", text: "last response" }] },
    ]
    expect(extractAssistantText(messages)).toBe("last response")
  })

  it("falls back to top-level role when info.role is missing", () => {
    const messages = [
      { role: "user", parts: [{ type: "text", text: "hello" }] },
      { role: "assistant", parts: [{ type: "text", text: "fallback response" }] },
    ]
    expect(extractAssistantText(messages)).toBe("fallback response")
  })

  it("joins only type=text parts and trims the final string", () => {
    const messages = [
      {
        info: { role: "assistant" },
        parts: [
          { type: "text", text: "hello " },
          { type: "tool-use", text: "ignored" },
          { type: "text", text: " world " },
        ],
      },
    ]
    expect(extractAssistantText(messages)).toBe("hello  world")
  })

  it("returns an empty string when no assistant message exists", () => {
    const messages = [
      { role: "user", parts: [{ type: "text", text: "hello" }] },
      { role: "system", parts: [{ type: "text", text: "system msg" }] },
    ]
    expect(extractAssistantText(messages)).toBe("")
  })

  it("returns empty string for empty messages array", () => {
    expect(extractAssistantText([])).toBe("")
  })

  it("returns empty string when assistant message has no parts array", () => {
    const messages = [
      { info: { role: "assistant" } },
    ]
    expect(extractAssistantText(messages)).toBe("")
  })
})
