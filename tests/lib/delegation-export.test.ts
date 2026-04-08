import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createDelegationPacket, setPlan } from "../../src/lib/delegation-packet.js"
import { buildDelegationManifest, exportDelegationArtifacts } from "../../src/lib/delegation-export.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

function createRecord(sessionID: string, status: "running" | "completed"): SessionContinuityRecord {
  const packet = createDelegationPacket(`packet:${sessionID}`, ["root-session", sessionID])
  setPlan(packet, "1. export\n2. verify")
  packet.status = status

  return {
    sessionID,
    toolProfile: { permissionRules: [], compatibleTools: ["read"] },
    promptParams: {
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      temperature: 0.1,
      guidanceText: "focused",
      tools: ["read"],
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
        queueKey: "gpt-5.4:builder:implementation",
      },
      delegationPacket: packet,
      title: `builder: ${sessionID}`,
      description: sessionID,
      category: "implementation",
      route: {
        requestedCategory: "implementation",
        category: "implementation",
        effectiveAgent: "builder",
        presetKey: "generalist-builder",
        effectiveModel: "gpt-5.4",
        temperature: 0.1,
        fallbackUsed: true,
        rationale: "fallback",
        guidanceText: "generalist",
        modelSource: "category",
        agentSource: "category",
        temperatureSource: "category",
        warnings: [],
      },
      constraints: [],
      runInBackground: status === "running",
      status,
      createdAt: 1,
      updatedAt: status === "running" ? 2 : 3,
    },
  }
}

async function loadContinuityModule(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()
  return import("../../src/lib/continuity.js")
}

let tempDir: string | undefined

afterEach(() => {
  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  delete process.env.OPENCODE_HARNESS_DELEGATION_EXPORTS
  delete process.env.OPENCODE_HARNESS_DELEGATION_EXPORT_DIR
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true })
  }
  tempDir = undefined
  vi.resetModules()
})

describe("delegation export derivation", () => {
  it("indexes active and terminal packets deterministically in the manifest", () => {
    const manifest = buildDelegationManifest([
      createRecord("session-b", "completed"),
      createRecord("session-a", "running"),
    ])

    expect(manifest.active).toEqual(["session-a"])
    expect(manifest.terminal).toEqual(["session-b"])
    expect(manifest.packets).toEqual(["session-a", "session-b"])
  })

  it("skips packet and manifest file emission when export policy disables artifacts", () => {
    tempDir = mkdtempSync(join(tmpdir(), "delegation-export-test-"))

    const result = exportDelegationArtifacts({
      records: [createRecord("session-a", "running")],
      policy: { enabled: false, outputDir: tempDir },
    })

    expect(result.enabled).toBe(false)
    expect(() => readFileSync(join(tempDir!, "manifest.json"), "utf8")).toThrow()
  })

  it("writes packet and manifest artifacts when continuity persistence enables exports", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "delegation-export-test-"))
    const continuityFile = join(tempDir, "session-continuity.json")
    process.env.OPENCODE_HARNESS_DELEGATION_EXPORTS = "true"
    process.env.OPENCODE_HARNESS_DELEGATION_EXPORT_DIR = tempDir

    const continuity = await loadContinuityModule(continuityFile)
    continuity.recordSessionContinuity(createRecord("session-a", "running"))

    const manifest = JSON.parse(readFileSync(join(tempDir, "manifest.json"), "utf8")) as {
      active: string[]
    }
    const packet = JSON.parse(readFileSync(join(tempDir, "session-a.json"), "utf8")) as {
      specialist: { presetKey: string }
    }

    expect(manifest.active).toEqual(["session-a"])
    expect(packet.specialist.presetKey).toBe("generalist-builder")
  })
})
