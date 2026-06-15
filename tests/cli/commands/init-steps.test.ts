import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  stepRecoveryCheck,
  stepDiffPreview,
  stepAtomicWrite,
} from "../../../src/cli/commands/init-steps.js"
import { HivemindConfigsSchema } from "../../../src/schema-kernel/hivemind-configs.schema.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  const dir = join(tmpdir(), `hivemind-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function mockPrompts(overrides: Record<string, unknown> = {}) {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    step: vi.fn(),
    log: {
      step: vi.fn(),
      info: vi.fn(),
      message: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    confirm: vi.fn(async () => true),
    select: vi.fn(async () => "default"),
    cancel: vi.fn(),
    isCancel: vi.fn((val: unknown) => val === Symbol("@clack/prompts - cancelled")),
    ...overrides,
  } as any
}

// ---------------------------------------------------------------------------
// stepRecoveryCheck
// ---------------------------------------------------------------------------

describe("stepRecoveryCheck", () => {
  let dir: string

  beforeEach(() => {
    dir = tmpDir()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("does nothing when configs.json already exists", async () => {
    const configsPath = join(dir, "configs.json")
    writeFileSync(configsPath, '{"conversation_language":"en"}', "utf8")
    const prompts = mockPrompts()

    await stepRecoveryCheck(configsPath, prompts)

    expect(prompts.log.info).not.toHaveBeenCalled()
    expect(readFileSync(configsPath, "utf8")).toContain("en")
  })

  it("creates default configs.json when missing", async () => {
    const configsPath = join(dir, ".hivemind", "configs.json")
    const prompts = mockPrompts()

    await stepRecoveryCheck(configsPath, prompts)

    expect(existsSync(configsPath)).toBe(true)
    const content = JSON.parse(readFileSync(configsPath, "utf8"))
    // Verify full default config is written (not just $schema)
    expect(content).toHaveProperty("conversation_language", "en")
    expect(content).toHaveProperty("mode", "expert-advisor")
    expect(content).toHaveProperty("workflow")
    expect(content).toHaveProperty("governance")
  })
})

// ---------------------------------------------------------------------------
// stepDiffPreview
// ---------------------------------------------------------------------------

describe("stepDiffPreview", () => {
  it("returns true when user confirms", async () => {
    const prompts = mockPrompts({ confirm: vi.fn(async () => true) })

    const result = await stepDiffPreview(
      prompts,
      '{"a":1}',
      '{"a":2}',
    )

    expect(result).toBe(true)
    expect(prompts.confirm).toHaveBeenCalled()
  })

  it("returns false when user cancels", async () => {
    const prompts = mockPrompts({
      confirm: vi.fn(async () => Symbol("@clack/prompts - cancelled")),
    })

    const result = await stepDiffPreview(
      prompts,
      '{"a":1}',
      '{"a":2}',
    )

    expect(result).toBe(false)
  })

  it("shows no-changes message when configs are identical", async () => {
    const prompts = mockPrompts({ confirm: vi.fn(async () => true) })

    await stepDiffPreview(prompts, '{"a":1}', '{"a":1}')

    expect(prompts.log.info).toHaveBeenCalledWith("No changes to configuration.")
  })
})

// ---------------------------------------------------------------------------
// stepAtomicWrite
// ---------------------------------------------------------------------------

describe("stepAtomicWrite", () => {
  let dir: string

  beforeEach(() => {
    dir = tmpDir()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("writes valid config to disk", async () => {
    const configsPath = join(dir, "configs.json")
    const config = HivemindConfigsSchema.parse({})

    await stepAtomicWrite(configsPath, config)

    expect(existsSync(configsPath)).toBe(true)
    const written = JSON.parse(readFileSync(configsPath, "utf8"))
    expect(written).toHaveProperty("conversation_language", "en")
  })

  it("creates parent directories if missing", async () => {
    const configsPath = join(dir, ".hivemind", "nested", "configs.json")
    const config = HivemindConfigsSchema.parse({})

    await stepAtomicWrite(configsPath, config)

    expect(existsSync(configsPath)).toBe(true)
  })

  it("throws on invalid config", async () => {
    const configsPath = join(dir, "configs.json")
    const badConfig = { conversation_language: "INVALID_LANGUAGE" } as any

    await expect(stepAtomicWrite(configsPath, badConfig)).rejects.toThrow()
  })
})
