import { describe, expect, it, vi } from "vitest"

import { createRecoverCommand } from "../../../src/cli/commands/recover.js"

describe("recover command", () => {
  it("reports repaired counts for project scope", async () => {
    const command = createRecoverCommand({
      resolveProjectRoot: () => "/repo",
      bootstrapRecoverFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "project",
        effectiveScope: "project",
        fallbackApplied: false,
        primitiveTargetRoot: "/repo/.opencode",
        warnings: [],
        counts: {
          agents: { ok: 0, missing: 3, broken: 0, file: 0, repaired: 3 },
          skills: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          commands: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          workflows: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          references: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          templates: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
        },
      })),
    })
    const result = await command.handler({ flags: {}, positionals: [], argv: ["recover"] })
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain("REPAIRED 3")
  })

  it("supports explicit global scope and surfaces the effective scope", async () => {
    const command = createRecoverCommand({
      resolveProjectRoot: () => "/repo",
      bootstrapRecoverFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "global",
        effectiveScope: "global",
        fallbackApplied: false,
        primitiveTargetRoot: "/global/opencode",
        warnings: [],
        counts: {
          agents: { ok: 1, missing: 0, broken: 0, file: 0, repaired: 0 },
          skills: { ok: 1, missing: 0, broken: 0, file: 0, repaired: 0 },
          commands: { ok: 1, missing: 0, broken: 0, file: 0, repaired: 0 },
          workflows: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          references: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          templates: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
        },
      })),
    })
    const result = await command.handler({ flags: { scope: "global" }, positionals: [], argv: ["recover", "--scope=global"] })
    expect(result.output).toContain("Effective scope: global")
  })

  it("is idempotent on a second run", async () => {
    const command = createRecoverCommand({
      resolveProjectRoot: () => "/repo",
      bootstrapRecoverFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "project",
        effectiveScope: "project",
        fallbackApplied: false,
        primitiveTargetRoot: "/repo/.opencode",
        warnings: [],
        counts: {
          agents: { ok: 3, missing: 0, broken: 0, file: 0, repaired: 0 },
          skills: { ok: 3, missing: 0, broken: 0, file: 0, repaired: 0 },
          commands: { ok: 3, missing: 0, broken: 0, file: 0, repaired: 0 },
          workflows: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          references: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          templates: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
        },
      })),
    })
    const result = await command.handler({ flags: {}, positionals: [], argv: ["recover"] })
    expect(result.output).toContain("REPAIRED 0")
  })

  it("reports real-file conflicts as skipped and still exits 0", async () => {
    const command = createRecoverCommand({
      resolveProjectRoot: () => "/repo",
      bootstrapRecoverFn: vi.fn(async () => ({
        projectRoot: "/repo",
        requestedScope: "project",
        effectiveScope: "project",
        fallbackApplied: false,
        primitiveTargetRoot: "/repo/.opencode",
        warnings: ["skills:hm-skill"],
        counts: {
          agents: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          skills: { ok: 0, missing: 0, broken: 0, file: 1, repaired: 0 },
          commands: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          workflows: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          references: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
          templates: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
        },
      })),
    })
    const result = await command.handler({ flags: {}, positionals: [], argv: ["recover"] })
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain("SKIPPED 1")
  })
})
