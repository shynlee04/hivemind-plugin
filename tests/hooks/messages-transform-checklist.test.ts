import { describe, it } from "node:test"
import { strict as assert } from "node:assert"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createMessagesTransformHook, type MessageV2 } from "../../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../../src/lib/persistence.js"
import { createBrainState, generateSessionId, unlockSession } from "../../src/schemas/brain-state.js"
import { createConfig } from "../../src/schemas/config.js"
import { flushMutations } from "../../src/lib/state-mutation-queue.js"

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "hm-msg-checklist-"))
}

function createUserMessage(text: string, id: string): MessageV2 {
  return {
    info: {
      id,
      sessionID: "ses_test",
      role: "user",
      time: { created: Date.now() },
      agent: "test",
      model: { providerID: "test", modelID: "test" },
    } as any,
    parts: [
      {
        id: `${id}_part_1`,
        sessionID: "ses_test",
        messageID: id,
        type: "text",
        text,
      },
    ],
  }
}

function getSyntheticTexts(message: MessageV2): string[] {
  if (!("parts" in message) || !Array.isArray(message.parts)) return []
  return message.parts
    .filter((part) => part.type === "text" && (part as any).synthetic === true)
    .map((part) => String((part as any).text || ""))
}

async function setupHook(dir: string) {
  const log = { warn: async (_msg: string) => {} }
  const hook = createMessagesTransformHook(log, dir)
  const stateManager = createStateManager(dir)
  return {
    call: async (input: {}, output: { messages: MessageV2[] }) => {
      await hook(input, output)
      await flushMutations(stateManager)
    },
    stateManager,
  }
}

describe("messages-transform entity checklist integration", () => {
  it("entity checklist failures appear in pre-stop checklist", async () => {
    const dir = createTempDir()
    try {
      await initializePlanningDirectory(dir)
      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState(generateSessionId(), config))
      state.first_turn_context_injected = true
      await stateManager.save(state)

      // Delete config.json so entity checklist fails for hivemind_config
      const configPath = join(dir, ".hivemind", "config.json")
      try { rmSync(configPath) } catch {}

      const { call } = await setupHook(dir)
      // Need to re-save config OUTSIDE .hivemind so loadConfig still works
      // Actually loadConfig reads from .hivemind/config.json, so we need it for the hook to work
      // Instead, delete a different file that entity checklist checks
      // Let's delete the plans manifest
      const manifestPath = join(dir, ".hivemind", "plans", "manifest.json")
      try { rmSync(manifestPath) } catch {}

      // Re-save config so hook can load it
      await saveConfig(dir, config)

      const output = { messages: [createUserMessage("test", "msg_1")] }
      await call({}, output)

      const syntheticTexts = getSyntheticTexts(output.messages[0])
      const checklistText = syntheticTexts.find(t => t.includes("CHECKLIST BEFORE STOPPING")) || ""

      assert.ok(
        checklistText.includes("Entity check failed: planning_sot"),
        "checklist includes entity failure for planning_sot"
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("entity checklist pass does not add entity failure items", async () => {
    const dir = createTempDir()
    try {
      await initializePlanningDirectory(dir)
      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState(generateSessionId(), config))
      state.first_turn_context_injected = true
      state.hierarchy.action = "test action"
      state.metrics.context_updates = 1
      await stateManager.save(state)

      // Ensure all entity files exist
      const hivemindDir = join(dir, ".hivemind")
      const stateDir = join(hivemindDir, "state")
      mkdirSync(stateDir, { recursive: true })
      const memoryDir = join(hivemindDir, "memory")
      mkdirSync(memoryDir, { recursive: true })
      const plansDir = join(hivemindDir, "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "manifest.json"), JSON.stringify({ plans: [] }))
      writeFileSync(join(stateDir, "hierarchy.json"), JSON.stringify({ nodes: [{ id: "n1" }] }))
      writeFileSync(join(stateDir, "anchors.json"), JSON.stringify({ anchors: [] }))
      writeFileSync(join(memoryDir, "mems.json"), JSON.stringify({ mems: [] }))

      const { call } = await setupHook(dir)
      const output = { messages: [createUserMessage("test", "msg_2")] }
      await call({}, output)

      const syntheticTexts = getSyntheticTexts(output.messages[0])
      const checklistText = syntheticTexts.find(t => t.includes("CHECKLIST BEFORE STOPPING")) || ""

      assert.ok(
        !checklistText.includes("Entity check failed"),
        "checklist does not include entity failure items when all pass"
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("phase execution produces anchor before checklist in parts", async () => {
    const dir = createTempDir()
    try {
      await initializePlanningDirectory(dir)
      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState(generateSessionId(), config))
      state.first_turn_context_injected = true
      state.hierarchy.trajectory = "Test Phase"
      state.metrics.context_updates = 1
      await stateManager.save(state)

      const { call } = await setupHook(dir)
      const output = { messages: [createUserMessage("test ordering", "msg_3")] }
      await call({}, output)

      const syntheticTexts = getSyntheticTexts(output.messages[0])
      const anchorIdx = syntheticTexts.findIndex(t => t.includes("[SYSTEM ANCHOR:"))
      const checklistIdx = syntheticTexts.findIndex(t => t.includes("CHECKLIST BEFORE STOPPING"))

      assert.ok(anchorIdx >= 0, "anchor synthetic part exists")
      assert.ok(checklistIdx >= 0, "checklist synthetic part exists")
      // Anchor is prepended (earlier in parts), checklist is appended (later)
      assert.ok(anchorIdx < checklistIdx, "anchor appears before checklist in parts order")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
