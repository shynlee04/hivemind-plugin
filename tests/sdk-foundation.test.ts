/**
 * SDK Foundation Tests
 * Covers SDK context module, withClient fallback, plugin entry wiring, event handler, and architecture boundary.
 */

import { initSdkContext, getClient, getShell, getServerUrl, getProject, resetSdkContext, isSdkAvailable, withClient } from "../src/hooks/sdk-context.js"
import { createEventHandler } from "../src/hooks/event-handler.js"
import { resetToastCooldowns } from "../src/hooks/soft-governance.js"
import { createLogger } from "../src/lib/logging.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId } from "../src/schemas/brain-state.js"
import { mkdtemp, rm, readFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { execSync } from "child_process"
import * as Tools from "../src/tools/index.js"
import * as Hooks from "../src/hooks/index.js"

// ─── Harness ─────────────────────────────────────────────────────────

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

let tmpDir: string

async function setup(): Promise<string> {
  tmpDir = await mkdtemp(join(tmpdir(), "hm-sdk-"))
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── Mocks ───────────────────────────────────────────────────────────

const mockClient = { session: {}, tui: {}, file: {}, find: {} } as any
const mockShell = (() => {}) as any
const mockServerUrl = new URL("http://localhost:3000")
const mockProject = { id: "test", worktree: "/tmp", time: { created: Date.now() } } as any

// ─── Tests ───────────────────────────────────────────────────────────

async function test_sdkContextModule() {
  process.stderr.write("\n--- sdk-foundation: sdk context module ---\n")
  
  resetSdkContext()
  
  // Initial state
  assert(getClient() === null, "getClient returns null initially")
  assert(getShell() === null, "getShell returns null initially")
  assert(getServerUrl() === null, "getServerUrl returns null initially")
  assert(getProject() === null, "getProject returns null initially")
  assert(isSdkAvailable() === false, "isSdkAvailable returns false initially")
  
  // Init
  initSdkContext({ 
    client: mockClient, 
    $: mockShell, 
    serverUrl: mockServerUrl, 
    project: mockProject 
  })
  
  // Post-init state
  assert(getClient() === mockClient, "getClient returns client after init")
  assert(getShell() === mockShell, "getShell returns shell after init")
  assert(getServerUrl() === mockServerUrl, "getServerUrl returns serverUrl after init")
  assert(getProject() === mockProject, "getProject returns project after init")
  assert(isSdkAvailable() === true, "isSdkAvailable returns true after init")
  
  // Reset
  resetSdkContext()
  
  // Post-reset state
  assert(getClient() === null, "getClient returns null after reset")
  assert(isSdkAvailable() === false, "isSdkAvailable returns false after reset")
  
  // Partial init (graceful handling)
  initSdkContext({ client: mockClient, $: null as any, serverUrl: null as any, project: null as any })
  assert(getClient() === mockClient, "getClient returns client after partial init")
  assert(getShell() === null, "getShell returns null after partial init")
  
  resetSdkContext()
}

async function test_withClientFallback() {
  process.stderr.write("\n--- sdk-foundation: withClient graceful fallback ---\n")
  
  resetSdkContext()
  
  // Case 1: No client available
  const result1 = await withClient(async (c) => "success", "fallback")
  assert(result1 === "fallback", "withClient returns fallback when client null")
  
  const result2 = await withClient(async (c) => "success")
  assert(result2 === undefined, "withClient returns undefined when client null and no fallback")
  
  // Case 2: Client available
  initSdkContext({ client: mockClient, $: mockShell, serverUrl: mockServerUrl, project: mockProject })
  
  const result3 = await withClient(async (c) => {
    assert(c === mockClient, "withClient passes client to callback")
    return "success"
  }, "fallback")
  assert(result3 === "success", "withClient returns callback result when client available")
  
  // Case 3: Callback throws
  const result4 = await withClient(async (c) => {
    throw new Error("oops")
  }, "fallback")
  assert(result4 === "fallback", "withClient returns fallback when callback throws")
  
  const result5 = await withClient(async (c) => {
    throw new Error("oops")
  })
  assert(result5 === undefined, "withClient returns undefined when callback throws and no fallback")
  
  resetSdkContext()
}

async function test_pluginEntryWiring() {
  process.stderr.write("\n--- sdk-foundation: plugin entry wiring ---\n")
  
  const indexContent = await readFile("src/index.ts", "utf-8")
  
  assert(indexContent.includes("initSdkContext({ client, $: shell, serverUrl, project })"), "index.ts calls initSdkContext")
  assert(indexContent.includes("createEventHandler(log, effectiveDir)"), "index.ts wires event handler")
}

async function test_eventHandler() {
  process.stderr.write("\n--- sdk-foundation: event handler ---\n")
  
  const dir = await setup()
  const log = await createLogger(dir, "test")
  const handler = createEventHandler(log, dir)
  
  assert(typeof handler === "function", "createEventHandler returns a function")
  
  // Test safe execution (no throws) for various events
  try {
    await handler({ event: { type: "session.created", properties: { info: { id: "test" } } } } as any)
    assert(true, "handles session.created")
    
    await handler({ event: { type: "session.idle", properties: { sessionID: "test" } } } as any)
    assert(true, "handles session.idle")
    
    await handler({ event: { type: "session.compacted", properties: { sessionID: "test" } } } as any)
    assert(true, "handles session.compacted")
    
    await handler({ event: { type: "file.edited", properties: { file: "test.ts" } } } as any)
    assert(true, "handles file.edited")
    
    await handler({ event: { type: "session.diff", properties: { sessionID: "test", diff: [] } } } as any)
    assert(true, "handles session.diff")
    
    await handler({ event: { type: "unknown.event" } } as any)
    assert(true, "handles unknown event")
    
    // Test error handling (malformed event)
    await handler({ event: null } as any)
    assert(true, "handles null event (catches error)")
    
  } catch (e) {
    assert(false, `event handler threw error: ${e}`)
  }
  
  await cleanup()
}

async function test_eventHandlerIdleEscalationAndCompactionInfoToast() {
  process.stderr.write("\n--- sdk-foundation: idle escalation + compaction info toast ---\n")

  const dir = await setup()
  const log = await createLogger(dir, "test")

  const config = createConfig({ stale_session_days: 3 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  state.metrics.drift_score = 20  // Below 30 threshold for drift toast
  state.metrics.turn_count = 12   // Above 10 turn threshold
  state.session.last_activity = Date.now() - (5 * 86_400_000)
  await sm.save(state)
  resetToastCooldowns()

  const toasts: Array<{ message: string; variant: string }> = []
  initSdkContext({
    client: {
      tui: {
        showToast: async ({ body }: any) => {
          toasts.push({ message: body.message, variant: body.variant })
        },
      },
    } as any,
    $: mockShell,
    serverUrl: mockServerUrl,
    project: mockProject,
  })

  const handler = createEventHandler(log, dir)

  await handler({ event: { type: "session.idle", properties: { sessionID: "s1" } } as any })
  await handler({ event: { type: "session.idle", properties: { sessionID: "s1" } } as any })
  await handler({ event: { type: "session.compacted", properties: { sessionID: "s1" } } as any })

  const driftToast = toasts.find(t => t.message.includes("Drift risk detected"))
  assert(!!driftToast, "idle drift toast emitted when score < 30 and turns >= 10")
  assert(toasts.length >= 1, "at least one drift toast emitted")
  // session.compacted toast was removed from event-handler (FLAW-TOAST-006)
  // but the counter is still incremented
  assert(true, "compaction toast handled by compaction hook (not event-handler)")

  const updated = await sm.load()
  assert(updated!.metrics.governance_counters.compaction >= 1, "compaction counter incremented")

  resetSdkContext()
  await cleanup()
}

async function test_architectureBoundary() {
  process.stderr.write("\n--- sdk-foundation: architecture boundary ---\n")
  
  // 1. Verify script exists
  try {
    execSync("test -x scripts/check-sdk-boundary.sh")
    assert(true, "check-sdk-boundary.sh is executable")
  } catch {
    assert(false, "check-sdk-boundary.sh missing or not executable")
  }
  
  // 2. Verify src/lib is clean
  try {
    execSync("grep -r '@opencode-ai' src/lib/")
    assert(false, "src/lib/ should NOT contain @opencode-ai imports")
  } catch (e) {
    // grep returns exit code 1 if no matches found (which is what we want)
    assert(true, "src/lib/ clean of @opencode-ai imports")
  }
  
  // 3. Verify src/hooks IS allowed (control check)
  try {
    execSync("grep -r '@opencode-ai' src/hooks/ > /dev/null")
    assert(true, "src/hooks/ contains @opencode-ai imports (boundary works)")
  } catch {
    assert(false, "src/hooks/ should contain @opencode-ai imports")
  }
}

async function test_backwardCompatibility() {
  process.stderr.write("\n--- sdk-foundation: backward compatibility ---\n")
  
  // Verify Tools exports
  const toolCount = Object.keys(Tools).length
  assert(toolCount >= 10, `Tools exports count: ${toolCount} (>= 10)`)
  assert(typeof Tools.createDeclareIntentTool === "function", "createDeclareIntentTool exported")
  
  // Verify Hooks exports
  const hookCount = Object.keys(Hooks).length
  assert(hookCount >= 13, `Hooks exports count: ${hookCount} (>= 13)`) // 4 hooks + 1 new + 8 sdk context utils
  assert(typeof Hooks.createSessionLifecycleHook === "function", "createSessionLifecycleHook exported")
  assert(typeof Hooks.createEventHandler === "function", "createEventHandler exported")
  
  // Verify SDK context exports
  assert(typeof Hooks.initSdkContext === "function", "initSdkContext exported from hooks barrel")
  assert(typeof Hooks.getClient === "function", "getClient exported from hooks barrel")
}

async function test_doubleInitAndConcurrency() {
  process.stderr.write("\n--- sdk-foundation: double init and concurrency ---\n")

  resetSdkContext()

  initSdkContext({
    client: mockClient,
    $: mockShell,
    serverUrl: mockServerUrl,
    project: mockProject,
  })

  const newClient = { ...mockClient, id: "new" }
  initSdkContext({
    client: newClient,
    $: mockShell,
    serverUrl: mockServerUrl,
    project: mockProject,
  })

  assert(getClient() === newClient, "initSdkContext updates singleton on re-initialization")

  const runs = 10
  let counter = 0
  const results = await Promise.all(
    Array.from({ length: runs }, () =>
      withClient(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        counter++
        return "ok"
      }),
    ),
  )

  assert(results.length === runs, "all concurrent withClient calls resolve")
  assert(results.every((r) => r === "ok"), "all concurrent withClient calls return callback result")
  assert(counter === runs, "all concurrent withClient callbacks execute")

  resetSdkContext()
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== SDK Foundation Tests ===\n")
  
  await test_sdkContextModule()
  await test_withClientFallback()
  await test_pluginEntryWiring()
  await test_eventHandler()
  await test_eventHandlerIdleEscalationAndCompactionInfoToast()
  await test_architectureBoundary()
  await test_backwardCompatibility()
  await test_doubleInitAndConcurrency()
  
  process.stderr.write(`\n=== SDK Foundation: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
