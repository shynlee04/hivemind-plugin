import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId } from "../src/schemas/brain-state.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createSoftGovernanceHook, resetToastCooldowns } from "../src/hooks/soft-governance.js"
import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { createEventHandler } from "../src/hooks/event-handler.js"
import { initSdkContext, resetSdkContext } from "../src/hooks/sdk-context.js"
import { noopLogger } from "../src/lib/logging.js"
import { compileIgnoredTier, formatIgnoredEvidence } from "../src/lib/detection.js"

let passed = 0
let failed_ = 0

function check(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

async function setup(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "hm-gov-stress-"))
  await initializePlanningDirectory(dir)
  return dir
}

async function testStressConditions() {
  process.stderr.write("=== Governance Stress Tests ===\n")

  const dir = await setup()
  try {
    await mkdir(join(dir, ".planning"), { recursive: true })
    await mkdir(join(dir, ".spec-kit"), { recursive: true })
    await writeFile(
      join(dir, ".planning", "STATE.md"),
      "# Project State\n\n## Current Position\n\nPhase 2 of 6 | Plan 4 of 4 complete | Status: In Progress\n",
      "utf-8"
    )
    await writeFile(
      join(dir, ".planning", "ROADMAP.md"),
      "# Roadmap\n\n## Phase 2: Auto-Hooks\n**Goal:** Governance fires from turn 0 in every mode\n",
      "utf-8"
    )

    const permissive = createConfig({ governance_mode: "permissive" })
    await saveConfig(dir, permissive)
    const stateManager = createStateManager(dir)
    const permissiveState = createBrainState(generateSessionId(), permissive)
    permissiveState.metrics.turn_count = 1
    await stateManager.save(permissiveState)

    const promptHook = createSessionLifecycleHook(noopLogger, dir, permissive)
    const output = { system: [] as string[] }
    await promptHook({ sessionID: "stress" }, output)
    const prompt = output.system.join("\n")

    check(prompt.includes("<hivemind-bootstrap>"), "GOV-01 bootstrap appears in permissive mode turn window")
    check(prompt.includes("<hivemind-evidence>") && prompt.includes("<hivemind-team>"), "GOV-02 evidence and team blocks inject from turn 0")
    check(!prompt.includes("[ALERTS]"), "GOV-03 permissive mode suppresses detection warning block")

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
      project: { id: "stress", worktree: dir, time: { created: Date.now() } } as any,
    })

    const strict = createConfig({ governance_mode: "strict" })
    await saveConfig(dir, strict)
    const strictState = createBrainState(generateSessionId(), strict)
    await stateManager.save(strictState)

    resetToastCooldowns()
    const softHook = createSoftGovernanceHook(noopLogger, dir, strict)
    await softHook({ tool: "write", sessionID: "stress", callID: "1" }, { title: "", output: "", metadata: {} })
    await softHook({ tool: "write", sessionID: "stress", callID: "2" }, { title: "", output: "", metadata: {} })
    await softHook({ tool: "write", sessionID: "stress", callID: "3" }, { title: "", output: "", metadata: {} })

    check(toasts.some((t) => t.variant === "info"), "GOV-04 out-of-order starts with info toast")
    check(toasts.some((t) => t.variant === "warning") && toasts.some((t) => t.variant === "error"), "GOV-04 severity escalates warning to error")

    const staleState = await stateManager.load()
    if (staleState) {
      staleState.metrics.drift_score = 20  // Below 30 threshold
      staleState.metrics.turn_count = 12   // Above 10 turn threshold
      staleState.session.last_activity = Date.now() - 5 * 86_400_000
      await stateManager.save(staleState)
    }
    resetToastCooldowns()
    const eventHandler = createEventHandler(noopLogger, dir)
    await eventHandler({ event: { type: "session.idle", properties: { sessionID: "stress" } } as any })
    check(toasts.some((t) => t.message.includes("Drift risk detected")), "GOV-05 session.idle emits drift toast when score < 30")

    const strictPromptOut = { system: [] as string[] }
    const strictPromptHook = createSessionLifecycleHook(noopLogger, dir, strict)
    const loaded = await stateManager.load()
    if (loaded) {
      loaded.metrics.turn_count = 6
      loaded.metrics.governance_counters.out_of_order = 5
      loaded.metrics.governance_counters.drift = 3
      loaded.metrics.governance_counters.evidence_pressure = 2
      loaded.metrics.governance_counters.acknowledged = false
      await stateManager.save(loaded)
    }
    await strictPromptHook({ sessionID: "stress" }, strictPromptOut)
    const strictPromptText = strictPromptOut.system.join("\n")

    check(
      strictPromptText.includes("[FRAMEWORK CONFLICT]") && strictPromptText.includes("Use GSD") && strictPromptText.includes("Use Spec-kit"),
      "GOV-06 framework conflict routing renders locked selection menu"
    )
    check(strictPromptText.includes("Pinned GSD goal:"), "GOV-07 prompt pins active GSD phase goal")

    const limitedConfig = createConfig({ governance_mode: "strict", automation_level: "assisted" })
    await saveConfig(dir, limitedConfig)
    const gateLimited = createToolGateHookInternal(noopLogger, dir, limitedConfig)
    const limitedResult = await gateLimited({ sessionID: "stress", tool: "write" })
    check(limitedResult.allowed && (limitedResult.warning?.includes("Governance advisory") === true || limitedResult.warning?.includes("Framework conflict") === true), "Limited-mode conflict path is advisory, not hard deny")

    const pauseConfig = createConfig({ governance_mode: "strict", automation_level: "retard" })
    await saveConfig(dir, pauseConfig)
    const gatePause = createToolGateHookInternal(noopLogger, dir, pauseConfig)
    const pauseResult = await gatePause({ sessionID: "stress", tool: "edit" })
    check(pauseResult.allowed && (pauseResult.warning?.includes("Governance advisory") === true || pauseResult.warning?.includes("Framework conflict") === true), "Simulated-pause path includes framework advisory without hard denial")

    const sessionLifecycleHelperSource = await readFile(join(process.cwd(), "src/hooks/session-lifecycle-helpers.ts"), "utf-8")
    check(
      sessionLifecycleHelperSource.includes("compileIgnoredTier(") &&
      sessionLifecycleHelperSource.includes("formatIgnoredEvidence("),
      "GOV-08 ignored block includes compact tri-evidence"
    )

    const ignored = compileIgnoredTier({
      counters: {
        out_of_order: 4,
        drift: 3,
        compaction: 0,
        evidence_pressure: 3,
        ignored: 0,
        acknowledged: false,
        prerequisites_completed: false,
      },
      governanceMode: "strict",
      expertLevel: "beginner",
      evidence: {
        declaredOrder: "declare_intent -> map_context -> execute",
        actualOrder: "execute -> execute -> map_context",
        missingPrerequisites: ["trajectory"],
        expectedHierarchy: "trajectory -> tactic -> action",
        actualHierarchy: "trajectory=(empty), tactic=(empty), action=patch",
      },
    })
    check(ignored?.tone === "direct corrective", "IGNORED tone adapts to strict/beginner posture")
    check(formatIgnoredEvidence(ignored!.evidence).includes("[SEQ]") && formatIgnoredEvidence(ignored!.evidence).includes("[PLAN]") && formatIgnoredEvidence(ignored!.evidence).includes("[HIER]"), "Tri-evidence formatter always renders SEQ/PLAN/HIER in one block")

    resetSdkContext()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }

  process.stderr.write(`\n=== Governance Stress: ${passed} passed, ${failed_} failed ===\n`)
  process.stderr.write(`13-condition result: ${passed}/13 PASS\n`)
  if (failed_ > 0 || passed !== 13) {
    process.exit(1)
  }
}

testStressConditions()
