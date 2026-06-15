import { describe, expect, it } from "vitest"
import { buildSdkSpawnRequest, resolveDelegationPermissionProfile } from "../../../src/coordination/spawner/spawn-request-builder.js"

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

  it("filters invalid tool names from agent.tools metadata (post-consolidation)", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "builder", prompt: "Build" },
      {
        name: "builder",
        tools: {
          read: true,
          edit: true,
          "nonexistent-tool": true,
          "another-fake-tool": true,
        },
      },
    )

    // agent.tools is filtered against WRITE_CAPABLE_TOOLS, so unknown names are dropped
    expect(profile.tools).not.toContain("nonexistent-tool")
    expect(profile.tools).not.toContain("another-fake-tool")
    expect(profile.tools).toContain("read")
    expect(profile.tools).toContain("edit")
  })

  it("agent without tools/permission metadata falls back to read-only (post-consolidation)", () => {
    // After tool-governance consolidation, agents without explicit metadata
    // get read-only tools. The CapabilityGate layer was removed.
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "hm-l0-orchestrator", prompt: "Coordinate work" },
      { name: "hm-l0-orchestrator" },
    )

    expect(profile.mode).toBe("read-only")
    expect(profile.tools).toEqual(["read", "glob", "grep"])
  })

  it("unknown agent falls back to read-only baseline (post-consolidation)", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "totally-unknown-agent", prompt: "Do something" },
      { name: "totally-unknown-agent" },
    )

    expect(profile.mode).toBe("read-only")
    expect(profile.tools).toEqual(["read", "glob", "grep"])
  })
})
