import { describe, expect, it } from "vitest"

import { getToolAuthority } from "../../../src/lib/runtime-pressure/index.js"

describe("Phase 59 authority matrix entries", () => {
  it("registers supervisor and command engine as non-executing read surfaces", () => {
    expect(getToolAuthority("hivemind-sdk-supervisor")).toEqual(expect.objectContaining({
      authority: "read",
      mutatesState: false,
      canExecute: false,
    }))
    expect(getToolAuthority("hivemind-command-engine")).toEqual(expect.objectContaining({
      authority: "read",
      mutatesState: false,
      canExecute: false,
    }))
  })
})
