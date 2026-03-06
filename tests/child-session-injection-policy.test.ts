import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { saveAnchors } from "../src/lib/anchors.js"
import { clearTurnInjectionLedger } from "../src/lib/injection-orchestrator.js"
import { saveTrajectory } from "../src/lib/graph-io.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { resolveRuntimeSessionLineage } from "../src/lib/runtime-session-lineage.js"
import { _resetSdkRefs, _setSdkRefs } from "../src/lib/sdk-access.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { clearRuntimeSessionLineageCache } from "../src/lib/runtime-session-lineage.js"
import { clearMutationQueue, flushMutations } from "../src/lib/state-mutation-queue.js"
import { initSdkContext, resetSdkContext } from "../src/hooks/sdk-context.js"
import { createBrainState, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

function createUserMessage(text: string, sessionID: string): MessageV2 {
  const messageID = `msg_${randomUUID()}`
  return {
    info: {
      id: messageID,
      sessionID,
      role: "user",
      time: { created: Date.now() },
      agent: "test",
      model: { providerID: "test", modelID: "test" },
    } as any,
    parts: [
      {
        id: `part_${randomUUID()}`,
        sessionID,
        messageID,
        type: "text",
        text,
      },
    ],
  }
}

function getSyntheticTextParts(message: MessageV2): string[] {
  if (!Array.isArray(message.parts)) {
    return []
  }

  return message.parts
    .filter((part) => part.type === "text" && (part as any).synthetic === true)
    .map((part) => String((part as any).text || ""))
}

function sumLengths(values: string[]): number {
  return values.reduce((total, value) => total + value.length, 0)
}

async function setupRuntimeDir(runtimeSessionId: string): Promise<{
  dir: string
  stateManager: ReturnType<typeof createStateManager>
}> {
  const dir = await mkdtemp(join(tmpdir(), "hm-child-session-"))
  await initializePlanningDirectory(dir)

  const config = createConfig({
    governance_mode: "assisted",
    agent_behavior: {
      constraints: {
        max_response_tokens: 4096,
      },
    },
  })
  await saveConfig(dir, config)

  const stateManager = createStateManager(dir)
  const state = unlockSession(createBrainState(randomUUID(), config, "plan_driven"))
  state.session.opencode_session_id = runtimeSessionId
  state.hierarchy.trajectory = "Trajectory Alpha"
  state.hierarchy.tactic = "Tactic Beta"
  state.hierarchy.action = "Action Gamma"
  state.metrics.turn_count = 0
  state.metrics.user_turn_count = 0
  state.metrics.context_updates = 1
  state.metrics.files_touched = ["src/example.ts"]
  state.first_turn_context_injected = false
  await stateManager.save(state)

  const now = new Date().toISOString()
  await saveTrajectory(dir, {
    version: "1.0",
    trajectory: {
      id: randomUUID(),
      session_id: state.session.id,
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent: "Trajectory Alpha",
      created_at: now,
      updated_at: now,
    },
  })
  await saveAnchors(dir, {
    version: "1.0.0",
    anchors: [
      {
        key: "phase",
        value: "Action Gamma",
        created_at: Date.now(),
        session_id: state.session.id,
      },
    ],
  })

  return { dir, stateManager }
}

async function runCoreScenario(runtimeSessionId: string, parentID: string | null): Promise<{
  systemText: string
  syntheticTexts: string[]
}> {
  clearTurnInjectionLedger()
  clearMutationQueue()
  clearRuntimeSessionLineageCache()

  const { dir, stateManager } = await setupRuntimeDir(runtimeSessionId)

  _setSdkRefs(
    {
      session: {
        get: async ({ sessionID }: { sessionID: string }) => ({
          id: sessionID,
          parentID: sessionID === runtimeSessionId ? parentID : null,
        }),
      },
    } as any,
    {} as any,
    new URL("http://localhost:4096"),
  )

  try {
    const config = createConfig({ governance_mode: "assisted" })
    const logger = {
      debug: async (_message: string) => {},
      info: async (_message: string) => {},
      warn: async (_message: string) => {},
      error: async (_message: string) => {},
    }

    const lifecycleHook = createSessionLifecycleHook(logger, dir, config)
    const lifecycleOutput = {
      system: [] as string[],
      messages: [createUserMessage("continue", runtimeSessionId)],
    }
    await lifecycleHook({ sessionID: runtimeSessionId }, lifecycleOutput)

    const messagesHook = createMessagesTransformHook({ warn: async () => {} }, dir)
    const messageOutput = { messages: [createUserMessage("continue", runtimeSessionId)] }
    await messagesHook({}, messageOutput)
    await flushMutations(stateManager)

    return {
      systemText: lifecycleOutput.system.join("\n"),
      syntheticTexts: getSyntheticTextParts(messageOutput.messages[0]),
    }
  } finally {
    resetSdkContext()
    clearRuntimeSessionLineageCache()
    clearTurnInjectionLedger()
    clearMutationQueue()
    await rm(dir, { recursive: true, force: true })
  }
}

async function seedPluginFallbackContext(dir: string): Promise<void> {
  const paths = getEffectivePaths(dir)

  await writeFile(
    join(paths.stateDir, "runtime-profile.json"),
    JSON.stringify({
      id: "profile-hivefiver",
      intent: "repair",
      constraints: ["keep scope tight", "verify before mutation"],
      capabilities: {
        paths: ["src/**", ".opencode/**"],
        depth_limit: 4,
        delegate_to: ["hivexplorer", "hiveq"],
      },
    }),
    "utf-8",
  )

  await writeFile(
    join(paths.stateDir, "context-recovery.json"),
    JSON.stringify({
      trajectory_summary: "Trajectory Alpha",
      active_todos: ["stabilize plugin fallback"],
      key_decisions: ["src owns context semantics"],
      recommended_next: "Continue bounded extraction",
    }),
    "utf-8",
  )

  await writeFile(
    join(paths.stateDir, "health-metrics.json"),
    JSON.stringify({
      composite: {
        score: 93,
        status: "healthy",
      },
      signals: {
        drift: { score: 88, velocity: 1 },
        evidence: { score: 91, velocity: 0 },
      },
      thresholds: {
        hard_block: {
          signals: ["drift"],
          below: 25,
        },
      },
    }),
    "utf-8",
  )
}

async function runPluginFallbackScenario(runtimeSessionId: string, parentID: string | null): Promise<{
  injectedText: string | null
}> {
  clearTurnInjectionLedger()
  clearRuntimeSessionLineageCache()

  const { dir } = await setupRuntimeDir(runtimeSessionId)
  await seedPluginFallbackContext(dir)

  initSdkContext({
    client: {
      session: {
        get: async ({ sessionID }: { sessionID: string }) => ({
          id: sessionID,
          parentID: sessionID === runtimeSessionId ? parentID : null,
        }),
      },
    } as any,
    $: {} as any,
    serverUrl: new URL("http://localhost:4096"),
    project: {} as any,
  })

  try {
    const lineage = await resolveRuntimeSessionLineage(runtimeSessionId)
    assert.equal(lineage.parentID, parentID)
    assert.equal(lineage.isChildSession, parentID !== null)

    const pluginModule = await import("../.opencode/plugins/hiveops-governance/hooks/context-injection.ts")
    const hookBuilder = pluginModule.buildContextInjectionHook as
      | ((state: { current: any; worktree: string }) => (input: any, output: any) => Promise<void>)
      | undefined
    assert.equal(typeof hookBuilder, "function")

    const hook = hookBuilder(
      {
        current: {
          sessionId: runtimeSessionId,
          agent: "hivefiver",
          delegationChain: [
            {
              from: "hivefiver",
              to: "hivexplorer",
              depth: 1,
              timestamp: Date.now(),
              objective: "inspect",
            },
          ],
          gatesPassed: [],
          scopeViolations: [],
          turnCount: 4,
          lastCheckpoint: Date.now(),
        },
        worktree: dir,
      },
      {
        resolveSessionLineage: async (sessionID?: string | null) => ({
          sessionID: sessionID ?? runtimeSessionId,
          parentID,
          isChildSession: parentID !== null,
          source: "sdk",
        }),
      },
    )

    const output = {
      system: [] as string[],
      messages: [createUserMessage("continue", runtimeSessionId)],
    }

    await hook({}, output)

    const first = output.messages[0] as any
    const injectedText = first?.parts?.[0]?.text ?? first?.info?.content ?? null

    return { injectedText }
  } finally {
    _resetSdkRefs()
    clearRuntimeSessionLineageCache()
    clearTurnInjectionLedger()
    await rm(dir, { recursive: true, force: true })
  }
}

async function runPluginCorePresenceScenario(runtimeSessionId: string): Promise<number> {
  clearTurnInjectionLedger()
  clearRuntimeSessionLineageCache()

  const { dir } = await setupRuntimeDir(runtimeSessionId)
  await seedPluginFallbackContext(dir)
  await mkdir(join(dir, "src/hooks"), { recursive: true })
  await writeFile(join(dir, "src/hooks/session-lifecycle.ts"), "// presence marker\n", "utf-8")
  await writeFile(join(dir, "src/hooks/messages-transform.ts"), "// presence marker\n", "utf-8")

  try {
    const pluginModule = await import("../.opencode/plugins/hiveops-governance/hooks/context-injection.ts")
    const hookBuilder = pluginModule.buildContextInjectionHook as
      | ((state: { current: any; worktree: string }) => (input: any, output: any) => Promise<void>)
      | undefined
    assert.equal(typeof hookBuilder, "function")

    const hook = hookBuilder({
      current: {
        sessionId: runtimeSessionId,
        agent: "hivefiver",
        delegationChain: [],
        gatesPassed: [],
        scopeViolations: [],
        turnCount: 2,
        lastCheckpoint: Date.now(),
      },
      worktree: dir,
    })

    const output = {
      system: [] as string[],
      messages: [createUserMessage("continue", runtimeSessionId)],
    }

    await hook({}, output)
    return output.messages.length
  } finally {
    clearRuntimeSessionLineageCache()
    clearTurnInjectionLedger()
    await rm(dir, { recursive: true, force: true })
  }
}

describe("child-session injection policy", () => {
  it("reduces core hook prompt surfaces for parent-linked child sessions", async () => {
    const main = await runCoreScenario("oc-main-session", null)
    const child = await runCoreScenario("oc-child-session", "oc-parent-session")

    assert.match(main.systemText, /<hivemind-bootstrap>/)
    assert.doesNotMatch(child.systemText, /<hivemind-bootstrap>/)

    assert(main.syntheticTexts.some((text) => text.includes("SESSION COHERENCE: Resuming from previous session context")))
    assert(child.syntheticTexts.every((text) => !text.includes("SESSION COHERENCE: Resuming from previous session context")))

    assert(child.syntheticTexts.some((text) => text.includes("<hivemind_state ")))
    assert(child.syntheticTexts.every((text) => !text.includes("CHECKLIST BEFORE STOPPING")))

    const mainTotal = main.systemText.length + sumLengths(main.syntheticTexts)
    const childTotal = child.systemText.length + sumLengths(child.syntheticTexts)
    assert(childTotal < mainTotal)
  })

  it("injects minimized GX-Pack fallback context for parent-linked child sessions", async () => {
    const child = await runPluginFallbackScenario("oc-plugin-child-session", "oc-plugin-parent")

    assert.equal(typeof child.injectedText, "string")
    assert.match(child.injectedText ?? "", /## GX-Pack Governance Context \(Auto-Injected\)/)
    assert.match(child.injectedText ?? "", /### Child Session Focus/)
    assert.doesNotMatch(child.injectedText ?? "", /### Active TODO/)
    assert.doesNotMatch(child.injectedText ?? "", /### Context Recovery \(auto-recovered\)/)
  })

  it("skips plugin fallback injection when core runtime hooks are present in the worktree", async () => {
    const messageCount = await runPluginCorePresenceScenario("oc-plugin-main-session")

    assert.equal(messageCount, 1)
  })
})
