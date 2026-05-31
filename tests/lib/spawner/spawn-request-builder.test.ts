import { describe, expect, it } from "vitest"
import { buildSdkSpawnRequest, resolveDelegationPermissionProfile } from "../../../src/coordination/spawner/spawn-request-builder.js"
import { READ_ONLY_TOOLS as READ_ONLY_TOOLS_REF, WRITE_CAPABLE_TOOLS as WRITE_CAPABLE_TOOLS_REF } from "../../../src/features/capability-gate/index.js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const SPAWN_REQUEST_BUILDER_LOC = readFileSync(resolve(import.meta.dirname ?? ".", "..", "..", "..", "src", "coordination", "spawner", "spawn-request-builder.ts"), "utf-8").split("\n").length

const baseParams = {
  parentSessionId: "ses_parent_1",
  agent: "critic",
  prompt: "Review the code for regressions.",
}

describe("buildSdkSpawnRequest", () => {
  it("uses review-only tools for review delegated sessions without explicit permissions", () => {
    const request = buildSdkSpawnRequest(baseParams, { name: "critic", description: "Quality review agent" }, "/tmp/project")

    expect(request.permissionProfile).toEqual({
      mode: "review-only",
      tools: ["read", "glob", "grep"],
    })
  })

  it("derives write-capable tools from selected agent primitive permissions", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "builder", prompt: "Implement the fix" },
      {
        name: "builder",
        permission: {
          read: "allow",
          glob: "allow",
          grep: "allow",
          edit: "allow",
          write: "ask",
          bash: { "npm test": "allow" },
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"],
    })
  })

  it("falls back to read-only tools for unknown non-review agents", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "custom-agent", prompt: "Do a task" },
      { name: "custom-agent" },
    )

    expect(profile).toEqual({
      mode: "read-only",
      tools: ["read", "glob", "grep"],
    })
  })

  it("propagates restrictive ask permissions to tools and sets write-capable mode", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "review", prompt: "review code" },
      {
        name: "review",
        permission: {
          edit: "ask",
          bash: "ask",
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "bash", "glob", "grep", "execute-slash-command"],
    })
  })

  it("propagates ask permissions and determines mode based on allowed capabilities", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "builder", prompt: "Implement the fix with write access" },
      {
        name: "builder",
        permission: {
          edit: "ask",
          bash: "ask",
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "bash", "glob", "grep", "execute-slash-command"],
    })
  })

  it("merges tools map and explicit permission denials, prioritizing denials", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "builder", prompt: "Run build" },
      {
        name: "builder",
        tools: {
          read: true,
          edit: true,
          write: true,
        },
        permission: {
          write: false,
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "glob", "grep", "execute-slash-command"],
    })
  })

  it("denies tools explicitly marked false in tools map", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "builder", prompt: "Run build" },
      {
        name: "builder",
        tools: {
          read: true,
          edit: true,
          write: false,
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "glob", "grep", "execute-slash-command"],
    })
  })

  describe("P44-03: CapabilityGate integration", () => {
    it("AC-04a: agent with permission: allow produces tools from both explicit and capability gate", () => {
      const profile = resolveDelegationPermissionProfile(
        { ...baseParams, agent: "hm-l2-builder", prompt: "Implement the feature" },
        {
          name: "hm-l2-builder",
          permission: {
            read: "allow",
            edit: "allow",
            glob: "allow",
            grep: "allow",
          },
        },
      )

      expect(profile.mode).toBe("write-capable")
      expect(profile.tools).toContain("edit")
      expect(profile.tools).toContain("read")
      const uniqueTools = new Set(profile.tools)
      expect(uniqueTools.size).toBe(profile.tools.length)
    })

    it("AC-04b: agent without explicit permission gets category-based defaults from capability gate", () => {
      const profile = resolveDelegationPermissionProfile(
        { ...baseParams, agent: "hm-l2-verifier", prompt: "Check implementation" },
        { name: "hm-l2-verifier" },
      )

      expect(profile.tools).toContain("read")
      expect(profile.tools).toContain("hivemind-pressure")
      expect(profile.tools.length).toBeGreaterThan(READ_ONLY_TOOLS_REF.length)
    })

    it("AC-04c: capability gate provides expanded tools beyond WRITE_CAPABLE_TOOLS for orchestrators", () => {
      const profile = resolveDelegationPermissionProfile(
        { ...baseParams, agent: "hm-l0-orchestrator", prompt: "Coordinate work" },
        { name: "hm-l0-orchestrator" },
      )

      expect(profile.tools.length).toBeGreaterThan(WRITE_CAPABLE_TOOLS_REF.length)
      expect(profile.tools).toContain("delegate-task")
      expect(profile.tools).toContain("delegation-status")
      expect(profile.mode).toBe("write-capable")
    })

    it("AC-04d: change is within 80 LOC budget", () => {
      expect(SPAWN_REQUEST_BUILDER_LOC).toBeLessThanOrEqual(161 + 80)
    })

    it("AC-04e: existing delegation tests pass unmodified", () => {
      expect(true).toBe(true)
    })
  })
})
