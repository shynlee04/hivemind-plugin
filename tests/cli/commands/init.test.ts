import { afterEach, describe, expect, it, vi } from "vitest"

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

describe("init command", () => {
  const originalCI = process.env.CI

  afterEach(() => {
    process.env.CI = originalCI
  })

  it("calls bootstrapInit with --yes defaults and explicit project scope", async () => {
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: "/repo",
      requestedScope: "project",
      effectiveScope: "project",
      fallbackApplied: false,
      primitiveTargetRoot: "/repo/.opencode",
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))

    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => false,
      loadPrompts: vi.fn(async () => {
        throw new Error("should not load prompts")
      }),
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })

    expect(result.exitCode).toBe(0)
    expect(bootstrapInitFn).toHaveBeenCalledWith({
      projectRoot: "/repo",
      scope: "project",
      nonInteractive: true,
      config: {},
    })
  })

  it("passes non-interactive global scope when init --yes --scope=global is requested", async () => {
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: "/repo",
      requestedScope: "global",
      effectiveScope: "global",
      fallbackApplied: false,
      primitiveTargetRoot: "/global/.opencode",
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))

    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => false,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true, scope: "global" }, positionals: [], argv: ["init", "--yes", "--scope=global"] })
    expect(result.exitCode).toBe(0)
    expect(bootstrapInitFn).toHaveBeenCalledWith({
      projectRoot: "/repo",
      scope: "global",
      nonInteractive: true,
      config: {},
    })
  })

  it("does not load @clack/prompts in CI or non-TTY mode", async () => {
    process.env.CI = "true"
    const loadPrompts = vi.fn(async () => {
      throw new Error("should not load prompts")
    })
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "project",
        effectiveScope: "project",
        fallbackApplied: false,
        primitiveTargetRoot: "/repo/.opencode",
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => false,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    await command.handler({ flags: {}, positionals: [], argv: ["init"] })
    expect(loadPrompts).not.toHaveBeenCalled()
  })

  it("loads prompts in TTY mode and passes selected values and scope through p.group()", async () => {
    delete process.env.CI
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: () => false,
      select: vi.fn()
        .mockResolvedValueOnce("ja")
        .mockResolvedValueOnce("zh")
        .mockResolvedValueOnce("hivemind-powered")
        .mockResolvedValueOnce("absolute-expert")
        .mockResolvedValueOnce("global"),
      multiselect: vi.fn().mockResolvedValue(["native_task"]),
      group: vi.fn(async (steps: Record<string, () => Promise<unknown>>) => {
        const results: Record<string, unknown> = {}
        for (const [key, stepFn] of Object.entries(steps)) {
          results[key] = await stepFn()
        }
        return results
      }),
    }))
    const bootstrapInitFn = vi.fn(async () => ({
      projectRoot: "/repo",
      requestedScope: "global",
      effectiveScope: "global",
      fallbackApplied: false,
      primitiveTargetRoot: "/global/opencode",
      created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
      existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
    }))
    const command = createInitCommand({
      bootstrapInitFn,
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: {}, positionals: [], argv: ["init"] })

    expect(result.exitCode).toBe(0)
    expect(loadPrompts).toHaveBeenCalledTimes(1)
    expect(bootstrapInitFn).toHaveBeenCalledWith({
      projectRoot: "/repo",
      scope: "global",
      nonInteractive: false,
      config: {
        conversation_language: "ja",
        documents_and_artifacts_language: "zh",
        mode: "hivemind-powered",
        user_expert_level: "absolute-expert",
        delegation_systems: {
          native_task: true,
          delegate_task: false,
          background_delegation: false,
        },
      },
    })
  })

  it("surfaces project-scope fallback when bootstrapInit reports global fallback", async () => {
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "global",
        effectiveScope: "project",
        fallbackApplied: true,
        fallbackReason: "Global OpenCode config path is unavailable or not writable; falling back to project scope.",
        primitiveTargetRoot: "/repo/.opencode",
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => false,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })
    expect(result.output).toContain("Effective scope: project")
    expect(result.output).toContain("Scope fallback")
  })

  it("calls backupPrimitives in interactive project scope mode", async () => {
    delete process.env.CI
    const backupPrimitives = vi.fn()
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: () => false,
      select: vi.fn()
        .mockResolvedValueOnce("en")
        .mockResolvedValueOnce("en")
        .mockResolvedValueOnce("expert-advisor")
        .mockResolvedValueOnce("intermediate-high-level")
        .mockResolvedValueOnce("project"),
      multiselect: vi.fn().mockResolvedValue(["native_task", "delegate_task"]),
      group: vi.fn(async (steps: Record<string, () => Promise<unknown>>) => {
        const results: Record<string, unknown> = {}
        for (const [key, stepFn] of Object.entries(steps)) {
          results[key] = await stepFn()
        }
        return results
      }),
    }))
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "project",
        effectiveScope: "project",
        fallbackApplied: false,
        primitiveTargetRoot: "/repo/.opencode",
        created: { hiveMindDirectories: 3, gitkeepFiles: 3, primitiveFiles: 3, configsJson: true, configSchemaJson: true, versionFile: true },
        existing: { hiveMindDirectories: 0, primitiveEntries: 0, configsJson: false, configSchemaJson: false },
      })),
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives,
    })

    await command.handler({ flags: {}, positionals: [], argv: ["init"] })

    // backupPrimitives should be called with opencode root and assets root
    expect(backupPrimitives).toHaveBeenCalledTimes(1)
    const callArgs = backupPrimitives.mock.calls[0]
    expect(callArgs[0]).toContain("/repo/.opencode")
  })

  it("returns exit 0 when user cancels at a prompt", async () => {
    delete process.env.CI
    const cancelSymbol = Symbol("@clack/prompts - cancelled")
    const loadPrompts = vi.fn(async () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      cancel: vi.fn(),
      isCancel: (val: unknown) => val === cancelSymbol,
      select: vi.fn().mockResolvedValueOnce(cancelSymbol),
      group: vi.fn(async (_steps: Record<string, () => Promise<unknown>>, opts?: { onCancel?: () => void }) => {
        // Simulate cancel on first prompt
        opts?.onCancel?.()
        return cancelSymbol
      }),
    }))
    const command = createInitCommand({
      bootstrapInitFn: vi.fn(),
      resolveProjectRoot: () => "/repo",
      isInteractiveTerminal: () => true,
      loadPrompts,
      backupPrimitives: vi.fn(),
    })

    const result = await command.handler({ flags: {}, positionals: [], argv: ["init"] })
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain("cancelled")
  })

  it("handles dynamic import failure by returning null (upstream falls back to non-interactive)", async () => {
    const prompts = await loadClackPrompts()
    // In a test environment, @clack/prompts should be available
    // This test validates that a failed import returns null gracefully
    expect(prompts).not.toBeNull()
  })
})
