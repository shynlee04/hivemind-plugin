import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createMessagesTransformHook as createRawMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { saveTasks } from "../src/lib/manifest.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import { saveAnchors } from "../src/lib/anchors.js"
import { createNode, createTree, saveTree, setRoot, addChild, markComplete } from "../src/lib/hierarchy-tree.js"
import { flushMutations } from "../src/lib/state-mutation-queue.js"

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

function createAssistantMessage(text: string, id: string): MessageV2 {
  return {
    info: {
      id,
      sessionID: "ses_test",
      role: "assistant",
      time: { created: Date.now() },
      parentID: "msg_user_1",
      modelID: "test",
      providerID: "test",
      mode: "primary",
      path: { cwd: ".", root: "." },
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
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

function getSyntheticTextParts(message: MessageV2): string[] {
  if (!("parts" in message) || !Array.isArray(message.parts)) return []
  return message.parts
    .filter((part) => part.type === "text" && (part as any).synthetic === true)
    .map((part) => String((part as any).text || ""))
}

function getTextParts(message: MessageV2): Array<{ text: string; synthetic: boolean }> {
  if (!("parts" in message) || !Array.isArray(message.parts)) return []
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ({
      text: String((part as any).text || ""),
      synthetic: (part as any).synthetic === true,
    }))
}

function createMessagesTransformHook(log: { warn: (message: string) => Promise<void> }, dir: string) {
  const hook = createRawMessagesTransformHook(log, dir)
  const stateManager = createStateManager(dir)
  return async (input: {}, output: { messages: MessageV2[] }) => {
    await hook(input, output)
    await flushMutations(stateManager)
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
  state.first_turn_context_injected = true
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createUserMessage("hi", "msg_user_1")],
  }

  await hook({}, output)

  const updatedUser = output.messages[0]
  const syntheticTexts = getSyntheticTextParts(updatedUser)
  const checklistText = syntheticTexts.find((text) => text.includes("CHECKLIST BEFORE STOPPING")) || ""

  assert(output.messages.length === 1, "does not append malformed standalone message")
  assert(syntheticTexts.length > 0, "injects synthetic reminder into user message parts")
  assert(checklistText.startsWith("<system-reminder>"), "checklist uses system-reminder wrapper")
  assert(checklistText.includes("CHECKLIST BEFORE STOPPING"), "injected text includes checklist header")

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
    first_turn_context_injected: true,
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
    messages: [createUserMessage("hi", "msg_user_1")],
  }

  await hook({}, output)

  const updatedUser = output.messages[0]
  const syntheticTexts = getSyntheticTextParts(updatedUser)
  const checklistText = syntheticTexts.find((text) => text.includes("CHECKLIST BEFORE STOPPING")) || ""

  assert(checklistText.includes("Action-level focus is missing"), "includes hierarchy cursor checklist item")
  assert(checklistText.includes("Is the file tree updated?"), "includes file tree updated check")
  assert(checklistText.includes("Have you forced an atomic git commit"), "includes atomic commit check")

  await rm(dir, { recursive: true, force: true })
}

async function test_includes_pending_tasks_checklist_item() {
  process.stderr.write("\n--- messages-transform: pending tasks checklist injection ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_context_injected = true
  await stateManager.save(state)
  await saveTasks(dir, {
    session_id: state.session.id,
    updated_at: Date.now(),
    tasks: [
      { id: "t1", text: "Implement split validation", status: "pending" },
      { id: "t2", text: "Already done", status: "completed" },
    ],
  })

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createUserMessage("continue", "msg_user_1")],
  }

  await hook({}, output)

  const updatedUser = output.messages[0]
  const syntheticTexts = getSyntheticTextParts(updatedUser)
  const checklistText = syntheticTexts.find((text) => text.includes("CHECKLIST BEFORE STOPPING")) || ""

  assert(checklistText.includes("Review 1 pending task(s)"), "includes pending tasks checklist item")
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
    messages: [createUserMessage("hi", "msg_user_1")],
  }

  await hook({}, output)

  assert(output.messages.length === 1, "does not inject reminder in permissive mode")
  await rm(dir, { recursive: true, force: true })
}


async function test_includes_session_boundary_checklist_item_when_recommended() {
  process.stderr.write("\n--- messages-transform: boundary checklist injection ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict", auto_compact_on_turns: 50 })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const baseState = unlockSession(createBrainState(generateSessionId(), config))
  // V3.0: Need user_turn_count >= 30 AND (compactionCount >= 2 OR hierarchyComplete)
  const state = {
    ...baseState,
    first_turn_context_injected: true,
    metrics: {
      ...baseState.metrics,
      turn_count: 30,
      user_turn_count: 35, // V3.0: User response cycles
      files_touched: [],
      context_updates: 1,
    },
    hierarchy: {
      ...baseState.hierarchy,
      action: "Boundary review",
    },
    compaction_count: 2, // V3.0: Trigger condition
  }
  await stateManager.save(state)

  const trajectory = createNode("trajectory", "Phase B")
  const tactic = createNode("tactic", "Track D")
  const action = createNode("action", "Finalize Part 2")
  let tree = setRoot(createTree(), trajectory)
  const tacticResult = addChild(tree, trajectory.id, tactic)
  if (tacticResult.success) {
    tree = tacticResult.tree
  }
  const actionResult = addChild(tree, tactic.id, action)
  if (actionResult.success) {
    tree = actionResult.tree
  }
  tree = markComplete(tree, action.id, Date.now())
  await saveTree(dir, tree)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createUserMessage("hi", "msg_user_1")],
  }

  await hook({}, output)

  const updatedUser = output.messages[0]
  const syntheticTexts = getSyntheticTextParts(updatedUser)
  const checklistText = syntheticTexts.find((text) => text.includes("Session boundary reached:")) || ""

  assert(
    checklistText.includes("Session boundary reached:"),
    "includes boundary recommendation checklist item"
  )

  await rm(dir, { recursive: true, force: true })
}

async function test_legacy_message_shape_fallback() {
  process.stderr.write("\n--- messages-transform: legacy shape fallback ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_context_injected = true
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [{ role: "user", content: "legacy user message" }],
  }

  await hook({}, output)

  const legacy = output.messages[0] as { content?: unknown }
  const content = Array.isArray(legacy.content) ? legacy.content : []
  const checklist = content.find(
    (part) => typeof part === "object" && part !== null && String((part as any).text || "").includes("CHECKLIST BEFORE STOPPING")
  )

  assert(output.messages.length === 1, "legacy shape does not append extra system message")
  assert(Boolean(checklist), "legacy shape receives checklist as synthetic text part")
  await rm(dir, { recursive: true, force: true })
}

async function test_modern_shape_without_user_does_not_push_legacy_message() {
  process.stderr.write("\n--- messages-transform: modern no-user fallback safety ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_context_injected = true
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createAssistantMessage("assistant-only history", "msg_assistant_1")],
  }

  await hook({}, output)

  assert(output.messages.length === 1, "modern shape without user does not append legacy system message")
  assert("info" in output.messages[0], "existing modern message shape is preserved")
  await rm(dir, { recursive: true, force: true })
}

async function test_wraps_user_message_with_system_anchor() {
  process.stderr.write("\n--- messages-transform: system anchor wrapping ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.hierarchy.trajectory = "Phase B"
  state.first_turn_context_injected = true
  // V3.0: Don't set action - this will trigger "Action-level focus is missing" checklist item
  state.metrics.context_updates = 1 // Active
  state.metrics.user_turn_count = 1  // V3.0: Initialize user_turn_count
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [
      createUserMessage("latest", "msg_user_2"),
    ],
  }

  await hook({}, output)

  const latestUser = output.messages[0]
  const parts = getTextParts(latestUser)

  // V3.0: The anchor is now a PREPENDED SYNTHETIC part (no mutation of user text)
  const syntheticParts = parts.filter(p => p.synthetic)
  const anchorPart = syntheticParts.find(p => p.text?.includes("[SYSTEM ANCHOR:"))
  
  assert(anchorPart?.text?.includes("[SYSTEM ANCHOR: Phase B") === true, "anchor is prepended as synthetic part")

  // V3.0: The user's original text should remain UNTOUCHED (not wrapped)
  const originalPart = parts.find(p => !p.synthetic)
  assert(originalPart?.text === "latest", "user text remains untouched (no wrapping)")

  // Checklist should be appended as synthetic part (there are items to show - action is missing)
  const checklistPart = syntheticParts.find(p => p.text?.includes("CHECKLIST BEFORE STOPPING"))
  assert(checklistPart?.text?.includes("CHECKLIST BEFORE STOPPING") === true, "checklist appended as synthetic part")

  await rm(dir, { recursive: true, force: true })
}

async function test_auto_realign_injects_menu_and_permission_gate_for_build_intent() {
  process.stderr.write("\n--- messages-transform: auto-realign menu + permission gate ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_context_injected = true
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createUserMessage("please build this app now", "msg_user_build_1")],
  }

  await hook({}, output)

  const syntheticTexts = getSyntheticTextParts(output.messages[0])
  const realignText = syntheticTexts.find((text) => text.includes("[AUTO-REALIGN]")) || ""

  assert(realignText.includes("[NEXT-STEP MENU]"), "auto-realign includes next-step menu")
  assert(realignText.includes("/hivefiver build"), "auto-realign menu includes build command")
  assert(realignText.includes("Permission required before execution"), "build intent is permission-gated")

  await rm(dir, { recursive: true, force: true })
}

async function test_auto_realign_injects_auto_init_for_safe_actions() {
  process.stderr.write("\n--- messages-transform: auto-realign auto-init guidance ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_context_injected = true
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [createUserMessage("help me do mcp research", "msg_user_research_1")],
  }

  await hook({}, output)

  const syntheticTexts = getSyntheticTextParts(output.messages[0])
  const realignText = syntheticTexts.find((text) => text.includes("[AUTO-REALIGN]")) || ""

  assert(realignText.includes("/hivefiver research"), "research intent routes to hivefiver research")
  assert(realignText.includes("Auto-init allowed"), "safe action includes auto-init guidance")

  await rm(dir, { recursive: true, force: true })
}

async function test_first_turn_injection_sets_marker_and_prevents_duplicate_on_counter_reset() {
  process.stderr.write("\n--- messages-transform: first-turn marker prevents duplicate injection ---\n")
  const dir = await setupDir()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await stateManager.save(state)

  const hook = createMessagesTransformHook({ warn: async () => {} }, dir)
  const output: { messages: MessageV2[] } = {
    messages: [
      createUserMessage("first turn", "msg_user_2"),
    ],
  }

  await hook({}, output)

  const firstPassParts = getTextParts(output.messages[0])
  const firstTurnParts = firstPassParts.filter(p => p.synthetic && p.text.includes("<first_turn_context>"))
  assert(firstTurnParts.length === 1, "injects first-turn context exactly once on first pass")

  const persistedAfterFirst = await stateManager.load()
  assert(persistedAfterFirst?.first_turn_context_injected === true, "persists first-turn marker after injection")

  // Simulate counter reset bug scenario; marker should still block first-turn reinjection.
  if (persistedAfterFirst) {
    persistedAfterFirst.metrics.turn_count = 0
    persistedAfterFirst.metrics.user_turn_count = 0
    await stateManager.save(persistedAfterFirst)
  }

  const outputSecond: { messages: MessageV2[] } = {
    messages: [createUserMessage("second turn", "msg_user_3")],
  }
  await hook({}, outputSecond)

  const secondPassParts = getTextParts(outputSecond.messages[0])
  const repeatedFirstTurn = secondPassParts.filter(p => p.synthetic && p.text.includes("<first_turn_context>"))
  assert(repeatedFirstTurn.length === 0, "does not reinject first-turn context when counters reset")

  await rm(dir, { recursive: true, force: true })
}
async function main() {
  process.stderr.write("=== Messages Transform Tests ===\n")

  await test_injects_checklist_message()
  await test_generates_dynamic_checklist_items()
  await test_includes_pending_tasks_checklist_item()
  await test_skips_permissive_mode()
  await test_wraps_user_message_with_system_anchor()
  await test_auto_realign_injects_menu_and_permission_gate_for_build_intent()
  await test_auto_realign_injects_auto_init_for_safe_actions()
  await test_first_turn_injection_sets_marker_and_prevents_duplicate_on_counter_reset()
  await test_includes_session_boundary_checklist_item_when_recommended()
  await test_legacy_message_shape_fallback()
  await test_modern_shape_without_user_does_not_push_legacy_message()

  process.stderr.write(`\n=== Messages Transform: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
