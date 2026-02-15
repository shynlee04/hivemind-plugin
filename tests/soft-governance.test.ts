/**
 * Soft Governance Hook tests — tool.execute.after tracking & compliance
 *
 * Tests the createSoftGovernanceHook which handles:
 *   - Turn count increment on every tool call
 *   - Drift detection (high turns + low drift score)
 *   - Violation detection (write/edit in LOCKED strict session)
 *   - Tool health tracking (total, successful, health score)
 *   - Chain break logging
 *   - Commit suggestion tracking
 *   - Long session detection
 *   - Error resilience (never crashes)
 */

import { createSoftGovernanceHook, resetToastCooldowns } from "../src/hooks/soft-governance.js"
import { initSdkContext, resetSdkContext } from "../src/hooks/sdk-context.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createNode, createTree, setRoot, addChild, markComplete, saveTree } from "../src/lib/hierarchy-tree.js"
import { getExportDir } from "../src/lib/planning-fs.js"
import { createConfig } from "../src/schemas/config.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  incrementTurnCount,
  updateHierarchy,
  addFileTouched,
  type BrainState,
} from "../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { noopLogger, type Logger } from "../src/lib/logging.js"
import { mkdtemp, readdir, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-softgov-"))
  await initializePlanningDirectory(tmpDir)
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

function makeInput(tool: string) {
  return { tool, sessionID: "test-session", callID: "call-1" }
}

function makeOutput() {
  return { title: "", output: "", metadata: {} }
}

// ─── Collecting logger for assertions ────────────────────────────────

function createCollectingLogger(): Logger & { warnings: string[]; errors: string[]; debugs: string[] } {
  const warnings: string[] = []
  const errors: string[] = []
  const debugs: string[] = []
  return {
    warnings,
    errors,
    debugs,
    debug: async (msg: string) => { debugs.push(msg) },
    info: async () => {},
    warn: async (msg: string) => { warnings.push(msg) },
    error: async (msg: string) => { errors.push(msg) },
  }
}

function createMockShell() {
  const commands: string[] = []
  const shell = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let command = strings[0] ?? ""
    for (let index = 0; index < values.length; index++) {
      command += String(values[index])
      command += strings[index + 1] ?? ""
    }
    commands.push(command.trim())
    return { stdout: "", stderr: "" }
  }

  return {
    shell: shell as any,
    commands,
  }
}

// ─── Turn count increment ────────────────────────────────────────────

async function test_increments_turn_count() {
  process.stderr.write("\n--- soft-governance: increments turn count ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("read"), makeOutput())
  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("bash"), makeOutput())

  const updated = await sm.load()
  assert(updated !== null, "state exists after hook calls")
  assert(updated!.metrics.turn_count === 3, "turn count incremented to 3")

  await cleanup()
}

// ─── Tool health tracking ────────────────────────────────────────────

async function test_tracks_tool_health() {
  process.stderr.write("\n--- soft-governance: tracks tool health ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.total_tool_calls === 2, "total tool calls is 2")
  assert(updated!.metrics.successful_tool_calls === 2, "successful tool calls is 2")
  assert(updated!.metrics.auto_health_score === 100, "health score is 100%")

  await cleanup()
}

// ─── Drift detection ─────────────────────────────────────────────────

async function test_drift_detection() {
  process.stderr.write("\n--- soft-governance: drift warning on high turns ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Pre-set high turn count and low drift to trigger warning
  state = {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: 4, // Will become 5 after hook increments
      drift_score: 40, // Below 50 threshold
    },
  }
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("Drift detected")),
    "drift warning logged when turns >= 5 and drift < 50"
  )

  await cleanup()
}

async function test_no_drift_warning_when_healthy() {
  process.stderr.write("\n--- soft-governance: no drift warning when healthy ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("Drift detected")),
    "no drift warning when turns low and drift high"
  )

  await cleanup()
}

// ─── Violation detection (strict mode) ───────────────────────────────

async function test_strict_violation_on_locked_write() {
  process.stderr.write("\n--- soft-governance: strict violation on LOCKED write ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  // strict mode starts LOCKED by default
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 1, "violation count incremented for write in LOCKED")
  assert(
    log.warnings.some(w => w.includes("Governance violation")),
    "violation warning logged"
  )

  await cleanup()
}

async function test_strict_no_violation_on_locked_read() {
  process.stderr.write("\n--- soft-governance: no violation on LOCKED read ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "no violation for read in LOCKED strict")

  await cleanup()
}

async function test_strict_no_violation_when_unlocked() {
  process.stderr.write("\n--- soft-governance: no violation when OPEN ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "no violation for write in OPEN strict")

  await cleanup()
}

async function test_assisted_no_violation() {
  process.stderr.write("\n--- soft-governance: assisted mode never tracks violations ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  // Even without unlocking, assisted mode should not track violations
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "assisted mode does not track violations")

  await cleanup()
}

// ─── Chain break logging ─────────────────────────────────────────────

async function test_chain_break_logging() {
  process.stderr.write("\n--- soft-governance: chain break warning logged ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Set action without tactic to create a chain break
  state = updateHierarchy(state, { action: "Do something" })
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("Chain breaks")),
    "chain break warning logged when action has no parent tactic"
  )

  await cleanup()
}

async function test_no_chain_break_when_hierarchy_intact() {
  process.stderr.write("\n--- soft-governance: no chain break when hierarchy intact ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  state = updateHierarchy(state, { trajectory: "Build auth", tactic: "JWT setup", action: "Install deps" })
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("Chain breaks")),
    "no chain break warning when hierarchy is complete"
  )

  await cleanup()
}

// ─── Commit suggestion tracking ──────────────────────────────────────

async function test_commit_suggestion_tracking() {
  process.stderr.write("\n--- soft-governance: commit suggestion turn tracked ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", commit_suggestion_threshold: 2 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Add enough files to trigger commit suggestion
  state = addFileTouched(state, "file1.ts")
  state = addFileTouched(state, "file2.ts")
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(
    updated!.last_commit_suggestion_turn > 0,
    "last_commit_suggestion_turn updated when threshold met"
  )

  await cleanup()
}

// ─── Long session detection ──────────────────────────────────────────

async function test_long_session_warning() {
  process.stderr.write("\n--- soft-governance: long session warning ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_compact_on_turns: 5 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Pre-set turn count just below threshold, will be incremented to threshold
  state = {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: 4,
    },
  }
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("compact_session")),
    "long session warning suggests compact_session at threshold"
  )

  await cleanup()
}

async function test_no_long_session_warning_below_threshold() {
  process.stderr.write("\n--- soft-governance: no long session warning below threshold ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_compact_on_turns: 20 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("compact_session")),
    "no long session warning when below threshold"
  )

  await cleanup()
}

// ─── Error resilience ────────────────────────────────────────────────

async function test_no_crash_without_state() {
  process.stderr.write("\n--- soft-governance: does not crash without brain state ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  // Do NOT save brain state

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  // Should not throw
  await hook(makeInput("write"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("no brain state")),
    "warns about missing brain state"
  )
  assert(true, "hook did not crash without brain state")

  await cleanup()
}

async function test_no_crash_without_sessionID() {
  process.stderr.write("\n--- soft-governance: skips when no sessionID ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  // Should not throw — early return when no sessionID
  await hook({ tool: "write", sessionID: "", callID: "call-1" }, makeOutput())

  assert(true, "hook skips gracefully when sessionID is empty")

  await cleanup()
}

// ─── Last activity timestamp ─────────────────────────────────────────

async function test_last_activity_updated() {
  process.stderr.write("\n--- soft-governance: last_activity timestamp updated ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  const originalActivity = state.session.last_activity
  await sm.save(state)

  // Small delay to ensure timestamp differs
  await new Promise(r => setTimeout(r, 10))

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(
    updated!.session.last_activity >= originalActivity,
    "last_activity timestamp updated"
  )

  await cleanup()
}

// ─── Multiple violations accumulate ──────────────────────────────────

async function test_multiple_violations_accumulate() {
  process.stderr.write("\n--- soft-governance: multiple violations accumulate ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config) // LOCKED
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())
  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 3, "3 violations accumulated for 3 write/edit calls in LOCKED")

  await cleanup()
}

// ─── Debug logging ───────────────────────────────────────────────────

async function test_debug_logging() {
  process.stderr.write("\n--- soft-governance: debug logging output ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  assert(
    log.debugs.some(d => d.includes("Soft governance: tracked write")),
    "debug log includes tool name"
  )
  assert(
    log.debugs.some(d => d.includes("turns=")),
    "debug log includes turn count"
  )

  await cleanup()
}

// ─── Permissive mode ─────────────────────────────────────────────────

async function test_permissive_still_tracks() {
  process.stderr.write("\n--- soft-governance: permissive mode still tracks ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "permissive" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.turn_count === 2, "permissive mode still increments turns")
  assert(updated!.metrics.total_tool_calls === 2, "permissive mode still tracks tool calls")
  assert(updated!.metrics.violation_count === 0, "permissive mode does not track violations")

  await cleanup()
}

// ─── Toast adapter: severity progression + triage ─────────────────────

async function test_outOfOrderToastSeverityProgression() {
  process.stderr.write("\n--- soft-governance: out-of-order toast severity progression ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config) // LOCKED
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
    $: (() => {}) as any,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("write"), makeOutput())

  assert(toasts.some(t => t.variant === "info"), "first out-of-order toast is info")
  assert(toasts.some(t => t.variant === "warning"), "second out-of-order toast is warning")
  assert(toasts.some(t => t.variant === "error"), "repeated out-of-order toast escalates to error")

  resetSdkContext()
  await cleanup()
}

async function test_evidencePressureEscalatesWarningToError() {
  process.stderr.write("\n--- soft-governance: evidence-pressure escalation ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
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
    $: (() => {}) as any,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  const output = { title: "", output: "still stuck and retry", metadata: {} }
  await hook(makeInput("read"), output)
  await hook(makeInput("read"), output)

  assert(
    toasts.some(t => t.variant === "warning" && t.message.includes("Evidence pressure")),
    "first evidence-pressure toast is warning"
  )
  assert(
    toasts.some(t => t.variant === "error" && t.message.includes("Evidence pressure")),
    "repeated evidence-pressure toast escalates to error"
  )

  resetSdkContext()
  await cleanup()
}

async function test_ignoredToastUsesErrorTriageFormat() {
  process.stderr.write("\n--- soft-governance: ignored triage toast format ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  state.metrics.governance_counters.out_of_order = 9
  state.hierarchy.action = "Review governance routing"
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
    $: (() => {}) as any,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)
  await hook(makeInput("write"), makeOutput())

  const triageToast = toasts.find(t => t.message.includes("Reason:") && t.message.includes("Current phase/action:") && t.message.includes("Suggested fix:"))
  assert(!!triageToast, "ignored toast includes triage reason/action/fix format")
  assert(triageToast?.variant === "error", "ignored toast variant is error")
  assert(
    log.warnings.some((entry) => entry.includes("[SEQ]") && entry.includes("[PLAN]") && entry.includes("[HIER]")),
    "ignored escalation logs compact tri-evidence block"
  )

  resetSdkContext()
  await cleanup()
}

async function test_ignored_downgrades_after_acknowledgement() {
  process.stderr.write("\n--- soft-governance: ignored downgrade after acknowledgement ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  state.metrics.governance_counters = {
    out_of_order: 2,
    drift: 2,
    compaction: 0,
    evidence_pressure: 2,
    ignored: 4,
    acknowledged: true,
    prerequisites_completed: false,
  }
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.governance_counters.ignored === 3, "acknowledgement downgrades ignored counter when prerequisites incomplete")
  assert(updated!.metrics.governance_counters.acknowledged === false, "acknowledgement consumed after downgrade")

  await cleanup()
}

async function test_ignored_full_reset_when_prerequisites_complete() {
  process.stderr.write("\n--- soft-governance: ignored full reset when prerequisites complete ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  state.hierarchy.trajectory = "T"
  state.hierarchy.tactic = "K"
  state.hierarchy.action = "A"
  state.metrics.governance_counters = {
    out_of_order: 1,
    drift: 0,
    compaction: 0,
    evidence_pressure: 0,
    ignored: 5,
    acknowledged: true,
    prerequisites_completed: true,
  }
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.governance_counters.ignored === 0, "ignored counter fully resets after prerequisites complete")
  assert(updated!.metrics.governance_counters.prerequisites_completed === true, "prerequisites flag remains true after reset")

  await cleanup()
}

// ─── Auto-commit integration ─────────────────────────────────────────

async function test_auto_commit_runs_when_enabled_and_files_modified() {
  process.stderr.write("\n--- soft-governance: auto-commit runs when enabled ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_commit: true })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const { shell, commands } = createMockShell()
  initSdkContext({
    client: null as any,
    $: shell,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)
  await hook(makeInput("write"), {
    title: "Write",
    output: "updated files",
    metadata: { modifiedFiles: ["src/example.ts"] },
  })

  assert(commands.some((command) => command.startsWith("git -C") && command.includes("add -A")), "auto-commit runs git add when enabled")
  assert(commands.some((command) => command.startsWith("git -C") && command.includes("commit -m")), "auto-commit runs git commit when enabled")
  assert(log.debugs.some((entry) => entry.includes("Auto-commit succeeded")), "auto-commit success logged at debug level")

  resetSdkContext()
  await cleanup()
}

async function test_auto_commit_skips_when_no_modified_files() {
  process.stderr.write("\n--- soft-governance: auto-commit skips with no modified files ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_commit: true })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const { shell, commands } = createMockShell()
  initSdkContext({
    client: null as any,
    $: shell,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)
  await hook(makeInput("write"), {
    title: "Write",
    output: "no file metadata",
    metadata: {},
  })

  assert(commands.length === 0, "auto-commit does not run git commands without modified files")
  assert(log.debugs.some((entry) => entry.includes("no modified files")), "auto-commit skip reason logged at debug level")

  resetSdkContext()
  await cleanup()
}

async function test_auto_split_creates_continuation_session_and_resets_metrics() {
  process.stderr.write("\n--- soft-governance: auto split creates continuation session ---\n")
  const dir = await setup()
  const config = createConfig({
    governance_mode: "assisted",
    automation_level: "full",
    auto_compact_on_turns: 50,
  })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.session.role = "main"
  state.metrics.turn_count = 30
  state.metrics.files_touched = ["src/a.ts"]
  await sm.save(state)

  const trajectory = createNode("trajectory", "Phase B")
  const tactic = createNode("tactic", "Session lifecycle")
  const action = createNode("action", "Boundary split")
  let tree = setRoot(createTree(), trajectory)
  tree = addChild(tree, trajectory.id, tactic)
  tree = addChild(tree, tactic.id, action)
  tree = markComplete(tree, action.id, Date.now())
  await saveTree(dir, tree)

  const createCalls: Array<{ directory: string; title: string; parentID?: string }> = []
  const toastMessages: string[] = []
  initSdkContext({
    client: {
      session: {
        create: async (args: any) => {
          createCalls.push(args)
          return { id: "ses_split_1" }
        },
      },
      tui: {
        showToast: async ({ body }: any) => {
          toastMessages.push(String(body?.message ?? ""))
        },
      },
    } as any,
    $: (() => {}) as any,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("map_context"), makeOutput())

  const updated = await sm.load()
  const exportDir = getExportDir(dir)
  const exportFiles = await readdir(exportDir)

  assert(createCalls.length === 1, "auto split calls session.create once")
  assert(createCalls[0].parentID === "test-session", "auto split links parentID to current session")
  assert(createCalls[0].title.includes("Boundary split"), "auto split title uses active hierarchy focus")
  assert((updated?.metrics.turn_count ?? -1) === 0, "auto split resets turn count")
  assert((updated?.metrics.files_touched.length ?? -1) === 0, "auto split clears files_touched")
  assert((updated?.metrics.drift_score ?? -1) === 100, "auto split restores drift score")
  assert(exportFiles.some((name) => name.includes("_autosplit") && name.endsWith(".json")), "auto split writes autosplit JSON export")
  assert(exportFiles.some((name) => name.includes("_autosplit") && name.endsWith(".md")), "auto split writes autosplit markdown export")
  assert(toastMessages.some((msg) => msg.includes("Boundary reached.")), "auto split emits continuation toast")

  resetSdkContext()
  await cleanup()
}

async function test_auto_split_skips_when_context_is_high() {
  process.stderr.write("\n--- soft-governance: auto split skips at high context ---\n")
  const dir = await setup()
  const config = createConfig({
    governance_mode: "assisted",
    automation_level: "full",
    auto_compact_on_turns: 50,
  })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.session.role = "main"
  state.metrics.turn_count = 80
  await sm.save(state)

  const createCalls: Array<Record<string, unknown>> = []
  initSdkContext({
    client: {
      session: {
        create: async (args: any) => {
          createCalls.push(args)
          return { id: "ses_split_should_not_happen" }
        },
      },
    } as any,
    $: (() => {}) as any,
    serverUrl: new URL("http://localhost:3000"),
    project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
  })

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("map_context"), makeOutput())

  const updated = await sm.load()
  assert(createCalls.length === 0, "auto split does not run when context is >=80%")
  assert((updated?.metrics.turn_count ?? 0) > 0, "normal turn tracking still applies when split is skipped")

  resetSdkContext()
  await cleanup()
}

// ─── Runner ──────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Soft Governance Tests ===\n")

  await test_increments_turn_count()
  await test_tracks_tool_health()
  await test_drift_detection()
  await test_no_drift_warning_when_healthy()
  await test_strict_violation_on_locked_write()
  await test_strict_no_violation_on_locked_read()
  await test_strict_no_violation_when_unlocked()
  await test_assisted_no_violation()
  await test_chain_break_logging()
  await test_no_chain_break_when_hierarchy_intact()
  await test_commit_suggestion_tracking()
  await test_long_session_warning()
  await test_no_long_session_warning_below_threshold()
  await test_no_crash_without_state()
  await test_no_crash_without_sessionID()
  await test_last_activity_updated()
  await test_multiple_violations_accumulate()
  await test_debug_logging()
  await test_permissive_still_tracks()
  await test_outOfOrderToastSeverityProgression()
  await test_evidencePressureEscalatesWarningToError()
  await test_ignoredToastUsesErrorTriageFormat()
  await test_ignored_downgrades_after_acknowledgement()
  await test_ignored_full_reset_when_prerequisites_complete()
  await test_auto_commit_runs_when_enabled_and_files_modified()
  await test_auto_commit_skips_when_no_modified_files()
  await test_auto_split_creates_continuation_session_and_resets_metrics()
  await test_auto_split_skips_when_context_is_high()

  process.stderr.write(`\n=== Soft Governance: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
