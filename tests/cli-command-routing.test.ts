import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { resolveCliInvocation } from "../src/cli/command-routing.js"

describe("cli command routing", () => {
  it("routes hm-init binary to init when no explicit command is provided", () => {
    const resolved = resolveCliInvocation("/tmp/hm-init", [])
    assert.equal(resolved.command, "init")
    assert.deepEqual(resolved.remainingArgs, [])
  })

  it("routes hm-doctor binary to doctor while preserving remaining args", () => {
    const resolved = resolveCliInvocation("/tmp/hm-doctor", ["--dry-run"])
    assert.equal(resolved.command, "doctor")
    assert.deepEqual(resolved.remainingArgs, ["--dry-run"])
  })

  it("prefers explicit positional commands over binary aliases", () => {
    const resolved = resolveCliInvocation("/tmp/hm-init", ["settings", "--lang", "vi"])
    assert.equal(resolved.command, "settings")
    assert.deepEqual(resolved.remainingArgs, ["--lang", "vi"])
  })
})
