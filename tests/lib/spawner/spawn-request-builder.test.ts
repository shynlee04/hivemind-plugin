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
          write: "deny",
          bash: { "npm test": "allow" },
        },
      },
    )

    expect(profile).toEqual({
      mode: "write-capable",
      tools: ["read", "edit", "bash", "glob", "grep"],
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

  it("fails closed when restrictive ask and deny permission records do not explicitly allow tools", () => {
    const profile = resolveDelegationPermissionProfile(
      { ...baseParams, agent: "review", prompt: "review code" },
      {
        name: "review",
        permission: {
          edit: "deny",
          bash: "ask",
        },
      },
    )

    expect(profile).toEqual({
      mode: "review-only",
      tools: ["read", "glob", "grep"],
    })
  })

  it("does not escalate task intent when an ambiguous restrictive permission record is present", () => {
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
      mode: "read-only",
      tools: ["read", "glob", "grep"],
    })
  })
})
