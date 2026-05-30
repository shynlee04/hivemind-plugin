import { afterEach, describe, expect, it, vi } from "vitest"

import { createInitCommand } from "../../../src/cli/commands/init.js"

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
    })

    await command.handler({ flags: {}, positionals: [], argv: ["init"] })
    expect(loadPrompts).not.toHaveBeenCalled()
  })

  it("loads prompts in TTY mode and passes selected D-02 values and scope", async () => {
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
    })

    const result = await command.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })
    expect(result.output).toContain("Effective scope: project")
    expect(result.output).toContain("Scope fallback")
  })
})
