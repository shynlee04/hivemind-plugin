import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  getConfig,
  getCachedConfig,
  invalidateConfigCache,
} from "../../src/config/subscriber.js"
import { getDefaultConfigs } from "../../src/schema-kernel/hivemind-configs.schema.js"

// ===========================================================================
// Config Subscriber — lazy-load + cache + fallback
// ===========================================================================

describe("ConfigSubscriber", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `config-sub-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(join(tmpDir, ".hivemind"), { recursive: true })
    // Always start with clean cache
    invalidateConfigCache()
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    invalidateConfigCache()
  })

  it("getConfig returns valid HivemindConfigs when configs.json exists", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({
        conversation_language: "vi",
        mode: "hivemind-powered",
        user_expert_level: "absolute-expert",
      }),
    )
    const config = getConfig(tmpDir)
    expect(config.conversation_language).toBe("vi")
    expect(config.mode).toBe("hivemind-powered")
    expect(config.user_expert_level).toBe("absolute-expert")
    // Defaults applied for missing fields
    expect(config.parallelization).toBe(true)
    expect(config.workflow.research).toBe(true)
  })

  it("getConfig returns defaults when configs.json is missing", () => {
    const config = getConfig(tmpDir)
    expect(config).toEqual(getDefaultConfigs())
  })

  it("getConfig returns defaults when configs.json has invalid JSON", () => {
    writeFileSync(join(tmpDir, ".hivemind", "configs.json"), "not json {{{")
    const config = getConfig(tmpDir)
    expect(config).toEqual(getDefaultConfigs())
  })

  it("getCachedConfig returns cached config without re-reading from disk", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ conversation_language: "ja" }),
    )
    // First call reads from disk
    getConfig(tmpDir)
    // Modify file on disk
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ conversation_language: "ko" }),
    )
    // getCachedConfig should return the CACHED version (ja), not the new disk version (ko)
    const cached = getCachedConfig()
    expect(cached.conversation_language).toBe("ja")
  })

  it("invalidateConfigCache clears the cache, next getConfig reads from disk", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ conversation_language: "ja" }),
    )
    getConfig(tmpDir)
    // Update file
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ conversation_language: "ko" }),
    )
    // Invalidate cache
    invalidateConfigCache()
    // Now getConfig should read fresh from disk
    const fresh = getConfig(tmpDir)
    expect(fresh.conversation_language).toBe("ko")
  })

  it("getConfig called multiple times returns same object (cache hit)", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ mode: "free-style" }),
    )
    const first = getConfig(tmpDir)
    const second = getConfig(tmpDir)
    expect(first).toBe(second) // Same reference
  })

  it("after invalidateConfigCache, getConfig returns fresh config from disk", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ mode: "expert-advisor" }),
    )
    const before = getConfig(tmpDir)
    expect(before.mode).toBe("expert-advisor")

    // Change on disk
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ mode: "hivemind-powered" }),
    )

    // Still cached
    expect(getConfig(tmpDir).mode).toBe("expert-advisor")

    // Invalidate + re-read
    invalidateConfigCache()
    const after = getConfig(tmpDir)
    expect(after.mode).toBe("hivemind-powered")
    expect(after).not.toBe(before) // New object
  })

  it("getConfig is callable with project root and returns valid config shape", () => {
    const config = getConfig(tmpDir)
    // Verify it has all expected top-level keys
    expect(config).toHaveProperty("conversation_language")
    expect(config).toHaveProperty("documents_and_artifacts_language")
    expect(config).toHaveProperty("mode")
    expect(config).toHaveProperty("user_expert_level")
    expect(config).toHaveProperty("delegation_systems")
    expect(config).toHaveProperty("parallelization")
    expect(config).toHaveProperty("atomic_commit")
    expect(config).toHaveProperty("commit_docs")
    expect(config).toHaveProperty("workflow")
  })
})
