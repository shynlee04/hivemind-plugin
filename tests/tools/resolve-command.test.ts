import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  resolveCommand,
  extractEntities,
  getCacheStats,
  resetDiscoveryCache
} from "../../src/tools/session/resolve-command.js"
import { CommandNotFoundError } from "../../src/shared/errors/commands.js"

describe("resolve-command", () => {
  let projectRoot: string

  beforeEach(() => {
    resetDiscoveryCache()
    projectRoot = mkdtempSync(join(tmpdir(), "resolve-command-test-"))
    mkdirSync(join(projectRoot, ".opencode", "commands"), { recursive: true })
    
    // Create mock command files
    writeFileSync(
      join(projectRoot, ".opencode", "commands", "unique-gsd-stats.md"),
      "---\ndescription: Show statistics\n---\nBody"
    )
    writeFileSync(
      join(projectRoot, ".opencode", "commands", "unique-gsd-plan-phase.md"),
      "---\ndescription: Plan a roadmap phase\n---\nBody"
    )
    writeFileSync(
      join(projectRoot, ".opencode", "commands", "unique-test-spike-command.md"),
      "---\ndescription: Run a test spike\n---\nBody"
    )
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("extracts entities and filters stop words", () => {
    expect(extractEntities("plan the refactor")).toEqual(["plan", "refactor"])
    expect(extractEntities("gsd command for testing")).toEqual(["gsd", "testing"])
    expect(extractEntities("/gsd-stats")).toEqual(["gsd-stats"])
  })

  it("resolves exact matches", async () => {
    const result = await resolveCommand({ commandName: "unique-gsd-stats", projectRoot })
    expect(result.success).toBe(true)
    expect(result.commandBundle!.name).toBe("unique-gsd-stats")
  })

  it("resolves fuzzy matches with hyphen/underscore differences", async () => {
    const result = await resolveCommand({ commandName: "unique_gsd_stats", projectRoot })
    expect(result.success).toBe(true)
    expect(result.commandBundle!.name).toBe("unique-gsd-stats")
  })

  it("resolves substring matches", async () => {
    const result = await resolveCommand({ commandName: "unique-test-spike", projectRoot })
    expect(result.success).toBe(true)
    expect(result.commandBundle!.name).toBe("unique-test-spike-command")
  })

  it("returns suggestions when no match is found", async () => {
    const result = await resolveCommand({ commandName: "unique-gsd", projectRoot })
    expect(result.success).toBe(false)
    expect(result.suggestions).toContain("unique-gsd-stats")
    expect(result.suggestions).toContain("unique-gsd-plan-phase")
  })

  it("throws CommandNotFoundError if no suggestions are possible", async () => {
    await expect(
      resolveCommand({ commandName: "xyz-non-existent-matching-string", projectRoot })
    ).rejects.toThrow(CommandNotFoundError)
  })

  it("caches discovery results and tracks statistics", async () => {
    // First call (miss)
    await resolveCommand({ commandName: "unique-gsd-stats", projectRoot })
    let stats = getCacheStats(projectRoot)
    expect(stats.hits).toBe(0)
    expect(stats.misses).toBe(1)

    // Second call within 5s (hit)
    await resolveCommand({ commandName: "unique-gsd-stats", projectRoot })
    stats = getCacheStats(projectRoot)
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
  })
})
