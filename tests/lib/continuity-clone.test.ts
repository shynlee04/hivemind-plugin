import { cloneContinuityRecord } from "../../src/lib/continuity-clone.js"
import { createDelegationPacket } from "../../src/lib/delegation-packet.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"
import { describe, expect, it } from "vitest"

function buildRecord(): SessionContinuityRecord {
  const packet = createDelegationPacket("Clone safely", ["root-session", "child-session"])
  packet.artifacts.push("docs/spec.md")
  packet.commits.push("abc123")

  return {
    sessionID: "child-session",
    toolProfile: {
      permissionRules: [{ permission: "read", pattern: "**/*", action: "allow" }],
      compatibleTools: ["read", "write"],
    },
    promptParams: {
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      temperature: 0,
      guidanceText: "keep it safe",
      tools: ["read", "write"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "model:gpt-5.4",
      },
      compactionCheckpoint: {
        agent: "builder",
        model: "gpt-5.4",
        tools: ["read"],
        delegationMeta: {
          rootID: "root-session",
          depth: 1,
          budgetUsed: 1,
          agent: "builder",
          category: "implementation",
          model: "gpt-5.4",
          queueKey: "model:gpt-5.4",
        },
        warnings: ["warning-1"],
        sessionStats: {
          total: 2,
          byTool: { read: 2 },
          loop: { signature: "read:spec", count: 2 },
        },
        capturedAt: 123,
      },
      delegationPacket: packet,
      title: "builder: Clone safely",
      description: "Clone safely",
      category: "implementation",
      route: {
        category: "implementation",
        effectiveAgent: "builder",
        effectiveModel: "gpt-5.4",
        temperature: 0,
        modelSource: "explicit",
        agentSource: "explicit",
        temperatureSource: "agent",
        warnings: ["route-warning"],
      },
      constraints: ["keep behavior"],
      runInBackground: false,
      status: "running",
      createdAt: 1,
      updatedAt: 1,
      lifecycle: {
        phase: "running",
        runMode: "sync",
        queueKey: "model:gpt-5.4",
        queue: {
          active: 1,
          pending: 0,
          limit: 3,
          acquiredAt: 10,
        },
        observation: {
          source: "dispatch",
          observedAt: 11,
          detail: "prompt-dispatched-sync",
        },
        cleanup: {
          scheduledAt: 12,
          reason: "done",
        },
      },
    },
  }
}

describe("cloneContinuityRecord", () => {
  it("deep clones nested continuity structures", () => {
    const original = buildRecord()

    const cloned = cloneContinuityRecord(original)
    cloned.toolProfile.permissionRules[0].pattern = "src/**/*"
    cloned.toolProfile.compatibleTools.push("edit")
    cloned.promptParams.tools.push("bash")
    cloned.metadata.constraints.push("new-constraint")
    cloned.metadata.route?.warnings.push("mutated-route-warning")
    cloned.metadata.delegationPacket?.artifacts.push("src/lib/continuity.ts")
    cloned.metadata.compactionCheckpoint?.warnings.push("mutated-checkpoint-warning")
    if (cloned.metadata.lifecycle?.queue) {
      cloned.metadata.lifecycle.queue.active = 99
    }

    expect(original.toolProfile.permissionRules[0]?.pattern).toBe("**/*")
    expect(original.toolProfile.compatibleTools).toEqual(["read", "write"])
    expect(original.promptParams.tools).toEqual(["read", "write"])
    expect(original.metadata.constraints).toEqual(["keep behavior"])
    expect(original.metadata.route?.warnings).toEqual(["route-warning"])
    expect(original.metadata.delegationPacket?.artifacts).toEqual(["docs/spec.md"])
    expect(original.metadata.compactionCheckpoint?.warnings).toEqual(["warning-1"])
    expect(original.metadata.lifecycle?.queue?.active).toBe(1)
  })
})
