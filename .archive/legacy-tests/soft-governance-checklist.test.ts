import { describe, it, beforeEach, afterEach } from "node:test"
import { strict as assert } from "node:assert"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { createSoftGovernanceHook as createRawSoftGovernanceHook, resetToastCooldowns } from "../../src/hooks/soft-governance.js"
import { createStateManager, saveConfig } from "../../src/lib/persistence.js"
import { flushMutations } from "../../src/lib/state-mutation-queue.js"
import { createConfig } from "../../src/schemas/config.js"
import { createBrainState, generateSessionId, unlockSession } from "../../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../../src/lib/planning-fs.js"
import { noopLogger } from "../../src/lib/logging.js"
import { getEffectivePaths } from "../../src/lib/paths.js"
import { initSdkContext, resetSdkContext } from "../../src/hooks/sdk-context.js"

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "hm-softgov-checklist-"))
}

function makeInput(tool: string) {
  return { tool, sessionID: "test-session", callID: "call-1" }
}

function makeOutput() {
  return { title: "", output: "", metadata: {} }
}

function createSoftGovernanceHook(log: typeof noopLogger, dir: string, config: ReturnType<typeof createConfig>) {
  const hook = createRawSoftGovernanceHook(log, dir, config)
  const stateManager = createStateManager(dir)
  return async (input: ReturnType<typeof makeInput>, output: ReturnType<typeof makeOutput>) => {
    await hook(input, output)
    await flushMutations(stateManager)
  }
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function ensureChecklistFiles(dir: string): ReturnType<typeof getEffectivePaths> {
  const paths = getEffectivePaths(dir)
  writeJson(paths.hierarchy, { nodes: [{ id: "node-1" }] })
  writeJson(paths.anchors, { anchors: [{ key: "anchor-1", value: "ok" }] })
  writeJson(paths.mems, { mems: [{ id: "mem-1" }] })
  return paths
}

let tempDirs: string[] = []

beforeEach(() => {
  resetToastCooldowns()
  initSdkContext({
    client: null as any,
    $: null as any,
    serverUrl: null as any,
    project: null as any,
  })
  tempDirs = []
})

afterEach(() => {
  resetSdkContext()
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("soft-governance entity checklist counters", () => {
  it("entity checklist failure increments out_of_order for structural keys", async () => {
    const dir = createTempDir()
    tempDirs.push(dir)

    await initializePlanningDirectory(dir)
    const config = createConfig({ governance_mode: "strict" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    state.hierarchy.trajectory = "trajectory"
    state.hierarchy.tactic = "tactic"
    state.hierarchy.action = "action"
    await stateManager.save(state)

    const paths = ensureChecklistFiles(dir)
    rmSync(paths.hierarchy, { force: true })

    const hook = createSoftGovernanceHook(noopLogger, dir, config)
    await hook(makeInput("read"), makeOutput())

    const updated = await stateManager.load()
    assert.ok(updated, "state exists after hook")
    assert.equal(updated!.metrics.governance_counters.out_of_order, 1)
  })

  it("entity checklist failure increments evidence_pressure for evidence keys", async () => {
    const dir = createTempDir()
    tempDirs.push(dir)

    await initializePlanningDirectory(dir)
    const config = createConfig({ governance_mode: "strict" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    state.hierarchy.trajectory = "trajectory"
    state.hierarchy.tactic = "tactic"
    state.hierarchy.action = "action"
    await stateManager.save(state)

    const paths = ensureChecklistFiles(dir)
    rmSync(paths.anchors, { force: true })

    const hook = createSoftGovernanceHook(noopLogger, dir, config)
    await hook(makeInput("read"), makeOutput())

    const updated = await stateManager.load()
    assert.ok(updated, "state exists after hook")
    assert.equal(updated!.metrics.governance_counters.evidence_pressure, 1)
  })

  it("entity checklist pass does not increment any governance counter", async () => {
    const dir = createTempDir()
    tempDirs.push(dir)

    await initializePlanningDirectory(dir)
    const config = createConfig({ governance_mode: "strict" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    state.hierarchy.trajectory = "trajectory"
    state.hierarchy.tactic = "tactic"
    state.hierarchy.action = "action"
    await stateManager.save(state)

    ensureChecklistFiles(dir)

    const hook = createSoftGovernanceHook(noopLogger, dir, config)
    await hook(makeInput("read"), makeOutput())

    const updated = await stateManager.load()
    assert.ok(updated, "state exists after hook")
    assert.equal(updated!.metrics.governance_counters.out_of_order, 0)
    assert.equal(updated!.metrics.governance_counters.evidence_pressure, 0)
  })
})
