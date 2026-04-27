import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { resolveWorkspaceRuntimePolicy } from "../../src/lib/workspace-runtime-policy.js"

describe("resolveWorkspaceRuntimePolicy", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync("policy-test-")
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("returns parsed policy when valid file exists", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      JSON.stringify({ maxDelegations: 5, safetyCeilingMs: 60000 })
    )

    const result = resolveWorkspaceRuntimePolicy(tempDir)

    expect(result).toBeDefined()
    expect(result!.maxDelegations).toBe(5)
    expect(result!.safetyCeilingMs).toBe(60000)
  })

  it("returns undefined when policy file does not exist", () => {
    const result = resolveWorkspaceRuntimePolicy(tempDir)
    expect(result).toBeUndefined()
  })

  it("throws when policy file is malformed JSON", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      "not valid json {{{"
    )

    expect(() => resolveWorkspaceRuntimePolicy(tempDir)).toThrow()
  })

  it("throws when policy file contains an array", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      JSON.stringify([1, 2, 3])
    )

    expect(() => resolveWorkspaceRuntimePolicy(tempDir)).toThrow(/must contain a JSON object/)
  })

  it("throws when policy file contains null", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      "null"
    )

    expect(() => resolveWorkspaceRuntimePolicy(tempDir)).toThrow(/must contain a JSON object/)
  })

  it("returns empty object when policy file contains empty JSON object", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      JSON.stringify({})
    )

    const result = resolveWorkspaceRuntimePolicy(tempDir)
    expect(result).toEqual({})
  })

  it("returns partial policy with only some fields", () => {
    const stateDir = join(tempDir, ".hivemind", "state")
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, "hivemind.runtime-policy.json"),
      JSON.stringify({ maxDelegations: 3 })
    )

    const result = resolveWorkspaceRuntimePolicy(tempDir)
    expect(result).toMatchObject({ maxDelegations: 3 })
  })
})
