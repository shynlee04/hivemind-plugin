import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import { saveAnchors } from "../src/lib/anchors.js"
import { createNode, createTree, saveTree, setRoot, addChild, markComplete } from "../src/lib/hierarchy-tree.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

async function setupDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "hm-msg-transform-"))
  await initializePlanningDirectory(dir)
  return dir
}

async function test_injects_checklist_message() {
  process.stderr.write("\n--- messages-transform: inject checklist ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [{ role: "user", content: "hi" }],
  }

  await hook({}, output)

  const injected = output.messages[output.messages.length - 1]
  const part = Array.isArray(injected?.content) ? injected.content[0] : null
  const text = typeof part?.text === "string" ? part.text : ""

  assert(output.messages.length === 2, "adds one synthetic reminder message")
  assert(injected?.role === "system", "injected message role is system")
  assert(part?.synthetic === true, "injected part marked synthetic")
  assert(text.startsWith("<system-reminder>"), "checklist uses system-reminder wrapper")
  assert(text.includes("CHECKLIST BEFORE STOPPING"), "injected text includes checklist header")

  await rm(dir, { recursive: true, force: true })
}

async function test_generates_dynamic_checklist_items() {
  process.stderr.write("\n--- messages-transform: dynamic checklist items ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const baseState = unlockSession(createBrainState(generateSessionId(), config))
  const state = {
    ...baseState,
    pending_failure_ack: true,
    metrics: {
      ...baseState.metrics,
      files_touched: ["src/example.ts"],
      context_updates: 0,
    },
    hierarchy: {
      ...baseState.hierarchy,
      action: "",
    },
  }
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [{ role: "user", content: "hi" }],
  }

  await hook({}, output)

  const injected = output.messages[output.messages.length - 1]
  const part = Array.isArray(injected?.content) ? injected.content[0] : null
  const text = typeof part?.text === "string" ? part.text : ""

  assert(text.includes("Action-level focus is missing"), "includes hierarchy cursor checklist item")
  assert(text.includes("No map_context updates yet"), "includes map_context checklist item")
  assert(text.includes("Acknowledge pending subagent failure"), "includes pending_failure_ack checklist item")
  assert(text.includes("Create a git commit for touched files"), "includes git commit checklist item")

  await rm(dir, { recursive: true, force: true })
}

async function test_skips_permissive_mode() {
  process.stderr.write("\n--- messages-transform: skip permissive mode ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "permissive" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [{ role: "user", content: "hi" }],
  }

  await hook({}, output)

  assert(output.messages.length === 1, "does not inject reminder in permissive mode")
  await rm(dir, { recursive: true, force: true })
}

async function test_augments_latest_user_message_with_anchor_context() {
  process.stderr.write("\n--- messages-transform: anchor continuity injection ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await stateManager.save(state)

  await saveAnchors(dir, {
    version: "1.0.0",
    anchors: [
      { key: "k1", value: "v1", created_at: 1, session_id: "s" },
      { key: "k2", value: "v2", created_at: 2, session_id: "s" },
      { key: "k3", value: "v3", created_at: 3, session_id: "s" },
      { key: "k4", value: "v4", created_at: 4, session_id: "s" },
    ],
  })

  const trajectory = createNode("trajectory", "Phase B")
  const tactic = createNode("tactic", "Messages transform")
  const action = createNode("action", "Inject continuity context")
  let tree = setRoot(createTree(), trajectory)
  tree = addChild(tree, trajectory.id, tactic)
  tree = addChild(tree, tactic.id, action)
  await saveTree(dir, tree)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [
      { role: "user", content: "first" },
      { role: "assistant", content: "ack" },
      { role: "user", content: "latest" },
    ],
  }

  await hook({}, output)

  const latestUser = output.messages[2]
  const parts = Array.isArray(latestUser.content) ? latestUser.content : []
  const injected = parts[0]
  const injectedText = typeof injected?.text === "string" ? injected.text : ""
  const original = parts[1]
  const originalText = typeof original?.text === "string" ? original.text : ""

  assert(parts.length >= 2, "latest user message receives synthetic continuity part")
  assert(injected?.synthetic === true, "continuity part marked synthetic")
  assert(injectedText.includes("<focus>Phase B > Messages transform > Inject continuity context</focus>"), "continuity includes focus path")
  assert(injectedText.includes("<anchor-context>"), "continuity includes anchor-context block")
  assert(!injectedText.includes("k1"), "anchor context capped to top 3 anchors")
  assert(originalText === "latest", "original user text remains intact")

  await rm(dir, { recursive: true, force: true })
}

async function test_includes_session_boundary_checklist_item_when_recommended() {
  process.stderr.write("\n--- messages-transform: boundary checklist injection ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict", auto_compact_on_turns: 50 })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const baseState = unlockSession(createBrainState(generateSessionId(), config))
  const state = {
    ...baseState,
    metrics: {
      ...baseState.metrics,
      turn_count: 30,
      files_touched: [],
      context_updates: 1,
    },
    hierarchy: {
      ...baseState.hierarchy,
      action: "Boundary review",
    },
  }
  await stateManager.save(state)

  const trajectory = createNode("trajectory", "Phase B")
  const tactic = createNode("tactic", "Track D")
  const action = createNode("action", "Finalize Part 2")
  let tree = setRoot(createTree(), trajectory)
  tree = addChild(tree, trajectory.id, tactic)
  tree = addChild(tree, tactic.id, action)
  tree = markComplete(tree, action.id, Date.now())
  await saveTree(dir, tree)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [{ role: "user", content: "hi" }],
  }

  await hook({}, output)

  const injected = output.messages[output.messages.length - 1]
  const part = Array.isArray(injected?.content) ? injected.content[0] : null
  const text = typeof part?.text === "string" ? part.text : ""

  assert(
    text.includes("Session boundary reached:"),
    "includes boundary recommendation checklist item"
  )

  await rm(dir, { recursive: true, force: true })
}

async function main() {
  process.stderr.write("=== Messages Transform Tests ===\n")

  await test_injects_checklist_message()
  await test_generates_dynamic_checklist_items()
  await test_skips_permissive_mode()
  await test_augments_latest_user_message_with_anchor_context()
  await test_includes_session_boundary_checklist_item_when_recommended()

  process.stderr.write(`\n=== Messages Transform: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
