import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { saveTasks } from "../src/lib/manifest.js"
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
  state.hierarchy.action = "Test Anchor"
  state.metrics.context_updates = 1 // Active
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

  // The first part (original user text) should be wrapped
  const originalPart = parts.find(p => !p.synthetic)
  const wrapperText = originalPart?.text || ""

  assert(wrapperText.includes("[SYSTEM ANCHOR: Phase Phase B | Active Task: Test Anchor | Hierarchy: Active]"), "user message wrapped with system anchor")
  assert(wrapperText.includes('User Intent: "latest"'), "user message wrapped with intent")

  // Checklist should be appended as synthetic part
  const syntheticPart = parts.find(p => p.synthetic)
  assert(syntheticPart?.text?.includes("CHECKLIST BEFORE STOPPING"), "checklist appended as synthetic part")

  await rm(dir, { recursive: true, force: true })
}
async function main() {
  process.stderr.write("=== Messages Transform Tests ===\n")

  await test_injects_checklist_message()
  await test_generates_dynamic_checklist_items()
  await test_includes_pending_tasks_checklist_item()
  await test_skips_permissive_mode()
  await test_wraps_user_message_with_system_anchor()
  await test_includes_session_boundary_checklist_item_when_recommended()
  await test_legacy_message_shape_fallback()
  await test_modern_shape_without_user_does_not_push_legacy_message()

  process.stderr.write(`\n=== Messages Transform: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
