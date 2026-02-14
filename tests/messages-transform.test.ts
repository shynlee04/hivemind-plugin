import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

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
  assert(text.includes("CHECKLIST BEFORE STOPPING"), "injected text includes checklist header")

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

async function main() {
  process.stderr.write("=== Messages Transform Tests ===\n")

  await test_injects_checklist_message()
  await test_skips_permissive_mode()

  process.stderr.write(`\n=== Messages Transform: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
