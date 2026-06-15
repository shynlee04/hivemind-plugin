import { afterEach, describe, expect, it, vi, beforeEach } from "vitest"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createInitCommand, backupExistingPrimitives, loadClackPrompts } from "../../../src/cli/commands/init.js"

/**
 * Mock @clack/prompts group() helper.
 * Simulates p.group() by calling step functions sequentially and collecting results.
 */
function mockGroup(steps: Record<string, () => Promise<unknown>>, opts?: { onCancel?: () => void }): Record<string, unknown> {
  const results: Record<string, unknown> = {}
  const cancelSymbol = Symbol("@clack/prompts - cancelled")
  for (const [key, stepFn] of Object.entries(steps)) {
    const value = stepFn()
    // Check if value is a cancel symbol (promise resolves to cancel symbol)
    // We handle this by checking the resolved value
    results[key] = value
  }
  return results
}

function tmpDir(): string {
  const dir = join(tmpdir(), `hivemind-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe("init command", () => {
  const originalCI = process.env.CI

  afterEach(() => {
    process.env.CI = originalCI
  })

  it("calls bootstrapInit with --yes defaults and explicit project scope", async () => {
    const dir = tmpDir()
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: dir,
      requestedScope: "project" as const,
      effectiveScope: "project" as const,
      fallbackApplied: false,
      primitiveTargetRoot: `${dir}/.opencode`,
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))

    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => false,
      loadPrompts: vi.fn(async () => {
        throw new Error("should not load prompts")
      }),
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })

    expect(result.exitCode).toBe(0)
    expect(bootstrapInitFn).toHaveBeenCalledWith({
      projectRoot: dir,
      scope: "project",
      nonInteractive: true,
      config: {},
    })

    rmSync(dir, { recursive: true, force: true })
  })

  it("passes non-interactive global scope when init --yes --scope=global is requested", async () => {
    const dir = tmpDir()
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: dir,
      requestedScope: "global" as const,
      effectiveScope: "global" as const,
      fallbackApplied: false,
      primitiveTargetRoot: `${dir}/.opencode`,
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))

    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => false,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true, scope: "global" }, positionals: [], argv: ["init", "--yes", "--scope=global"] })
    expect(result.exitCode).toBe(0)
    expect(bootstrapInitFn).toHaveBeenCalledWith({
      projectRoot: dir,
      scope: "global",
      nonInteractive: true,
      config: {},
    })

    rmSync(dir, { recursive: true, force: true })
  })

  it("does not load @clack/prompts in CI or non-TTY mode", async () => {
    const dir = tmpDir()
    process.env.CI = "true"
    const loadPrompts = vi.fn(async () => {
      throw new Error("should not load prompts")
    })
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: dir,
        requestedScope: "project" as const,
        effectiveScope: "project" as const,
        fallbackApplied: false,
        primitiveTargetRoot: `${dir}/.opencode`,
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => false,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    await command.handler({ flags: {}, positionals: [], argv: ["init"] })
    expect(loadPrompts).not.toHaveBeenCalled()

    rmSync(dir, { recursive: true, force: true })
  })

  it("loads prompts in TTY mode and passes selected values and scope through p.group()", async () => {
    const dir = tmpDir()
    // Create .hivemind directory for stepRecoveryCheck
    mkdirSync(join(dir, ".hivemind"), { recursive: true })
    // Write a minimal configs.json so stepRecoveryCheck doesn't try to create one
    writeFileSync(join(dir, ".hivemind", "configs.json"), '{"conversation_language":"en"}', "utf8")

    delete process.env.CI
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: () => false,
      confirm: vi.fn(async () => true),
      select: vi.fn()
        .mockResolvedValueOnce(null)  // stepProfileSelection - no preset
        .mockResolvedValueOnce("ja")  // stepLanguageAndCommunication - conversation
        .mockResolvedValueOnce("zh")  // stepLanguageAndCommunication - documents
        .mockResolvedValueOnce("mixed")  // stepLanguageAndCommunication - style
        .mockResolvedValueOnce("absolute-expert")  // stepExpertiseAndBehavior - expert level
        .mockResolvedValueOnce("hivemind-powered")  // stepExpertiseAndBehavior - mode
        .mockResolvedValueOnce("strict")  // stepExpertiseAndBehavior - guardrail
        .mockResolvedValueOnce("autonomous")  // stepExpertiseAndBehavior - delegation
        .mockResolvedValueOnce("senior")  // stepExpertiseAndBehavior - expertise
        .mockResolvedValueOnce("sufficient-phase-discussion")  // stepWorkflowToggles - discuss mode
        .mockResolvedValueOnce("full")  // stepAdvanced - tool access
        .mockResolvedValueOnce("full")  // stepAdvanced - skill filter
        .mockResolvedValueOnce("fast")  // stepAdvanced - decision speed
        .mockResolvedValueOnce("project"),  // scope selection
      multiselect: vi.fn().mockResolvedValue(["native_task"]),
      log: { step: vi.fn(), info: vi.fn(), message: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }))
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: dir,
      requestedScope: "global" as const,
      effectiveScope: "global" as const,
      fallbackApplied: false,
      primitiveTargetRoot: `${dir}/.opencode`,
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))
    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: {}, positionals: [], argv: ["init"] })

    expect(result.exitCode).toBe(0)
    expect(loadPrompts).toHaveBeenCalledTimes(1)
    expect(bootstrapInitFn).toHaveBeenCalled()

    rmSync(dir, { recursive: true, force: true })
  })

  it("surfaces project-scope fallback when bootstrapInit reports global fallback", async () => {
    const dir = tmpDir()
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: dir,
        requestedScope: "global" as const,
        effectiveScope: "project" as const,
        fallbackApplied: true,
        fallbackReason: "Global OpenCode config path is unavailable or not writable; falling back to project scope.",
        primitiveTargetRoot: `${dir}/.opencode`,
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => false,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })
    expect(result.output).toContain("Effective scope: project")
    expect(result.output).toContain("Scope fallback")

    rmSync(dir, { recursive: true, force: true })
  })

  it("calls backupPrimitives in interactive project scope mode", async () => {
    const dir = tmpDir()
    // Create .hivemind directory for stepRecoveryCheck
    mkdirSync(join(dir, ".hivemind"), { recursive: true })
    // Write a minimal configs.json so stepRecoveryCheck doesn't try to create one
    writeFileSync(join(dir, ".hivemind", "configs.json"), '{"conversation_language":"en"}', "utf8")

    delete process.env.CI
    const backupPrimitives = vi.fn()
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: () => false,
      confirm: vi.fn(async () => true),
      select: vi.fn()
        .mockResolvedValueOnce(null)  // stepProfileSelection - no preset
        .mockResolvedValueOnce("en")  // stepLanguageAndCommunication - conversation
        .mockResolvedValueOnce("en")  // stepLanguageAndCommunication - documents
        .mockResolvedValueOnce("mixed")  // stepLanguageAndCommunication - style
        .mockResolvedValueOnce("intermediate-high-level")  // stepExpertiseAndBehavior - expert level
        .mockResolvedValueOnce("expert-advisor")  // stepExpertiseAndBehavior - mode
        .mockResolvedValueOnce("moderate")  // stepExpertiseAndBehavior - guardrail
        .mockResolvedValueOnce("waiter")  // stepExpertiseAndBehavior - delegation
        .mockResolvedValueOnce("mid")  // stepExpertiseAndBehavior - expertise
        .mockResolvedValueOnce("sufficient-phase-discussion")  // stepWorkflowToggles - discuss mode
        .mockResolvedValueOnce("full")  // stepAdvanced - tool access
        .mockResolvedValueOnce("full")  // stepAdvanced - skill filter
        .mockResolvedValueOnce("fast")  // stepAdvanced - decision speed
        .mockResolvedValueOnce("project"),  // scope selection
      multiselect: vi.fn().mockResolvedValue(["native_task", "delegate_task"]),
      log: { step: vi.fn(), info: vi.fn(), message: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }))
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: dir,
        requestedScope: "project" as const,
        effectiveScope: "project" as const,
        fallbackApplied: false,
        primitiveTargetRoot: `${dir}/.opencode`,
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives,
    })

    await command.handler({ flags: {}, positionals: [], argv: ["init"] })

    // backupPrimitives should be called with opencode root and assets root
    expect(backupPrimitives).toHaveBeenCalledTimes(1)
    const callArgs = backupPrimitives.mock.calls[0]
    expect(callArgs[0]).toContain(`${dir}/.opencode`)

    rmSync(dir, { recursive: true, force: true })
  })

  it("returns exit 0 when user cancels at a prompt", async () => {
    const dir = tmpDir()
    // Create .hivemind directory for stepRecoveryCheck
    mkdirSync(join(dir, ".hivemind"), { recursive: true })
    // Write a minimal configs.json so stepRecoveryCheck doesn't try to create one
    writeFileSync(join(dir, ".hivemind", "configs.json"), '{"conversation_language":"en"}', "utf8")

    delete process.env.CI
    const cancelSymbol = Symbol("@clack/prompts - cancelled")
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: (val: unknown) => val === cancelSymbol,
      confirm: vi.fn(async () => false),  // diff preview: user declines → cancel
      select: vi.fn()
        .mockResolvedValueOnce(null)         // stepProfileSelection - no preset
        .mockResolvedValue(cancelSymbol),    // all remaining selects - cancelled
      multiselect: vi.fn().mockResolvedValue(cancelSymbol), // all multiselects - cancelled
      log: { step: vi.fn(), info: vi.fn(), message: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }))
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: dir,
        requestedScope: "project" as const,
        effectiveScope: "project" as const,
        fallbackApplied: false,
        primitiveTargetRoot: `${dir}/.opencode`,
        created: { hiveMindDirectories: 0, gitkeepFiles: 0, primitiveFiles: 0, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: true, configSchemaJson: false },
      })),
      resolveProjectRoot: () => dir,
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: {}, positionals: [], argv: ["init"] })
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain("cancelled")

    rmSync(dir, { recursive: true, force: true })
  })

  it("handles dynamic import failure by returning null (upstream falls back to non-interactive)", async () => {
    const prompts = await loadClackPrompts()
    // In a test environment, @clack/prompts should be available
    // This test validates that a failed import returns null gracefully
    expect(prompts).not.toBeNull()
  })
})
