import { describe, expect, it } from "vitest"

import { assertHookWriteBoundary, classifyHookEffect } from "../../src/hooks/composition/cqrs-boundary.js"

describe("hook CQRS boundary", () => {
  it("classifies messages and shell hooks as response shaping", () => {
    expect(classifyHookEffect("messages.transform")).toMatchObject({ kind: "response-shaping", durableWriteAllowed: false })
    expect(classifyHookEffect("shell.env")).toMatchObject({ kind: "response-shaping", durableWriteAllowed: false })
  })

  it("classifies tool before hooks as guard decisions", () => {
    expect(classifyHookEffect("tool.execute.before")).toMatchObject({ kind: "guard-decision", durableWriteAllowed: false })
  })

  it("rejects durable writes from hook contexts", () => {
    expect(() => assertHookWriteBoundary({ hook: "event", operation: "durable-write" })).toThrow(
      "[Harness] Hook event cannot perform durable-write operations.",
    )
  })
})
