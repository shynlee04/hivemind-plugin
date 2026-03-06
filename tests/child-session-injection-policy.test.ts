import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { saveAnchors } from "../src/lib/anchors.js"
import { clearTurnInjectionLedger } from "../src/lib/injection-orchestrator.js"
import { saveTrajectory } from "../src/lib/graph-io.js"
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

  it.todo(
    "adds direct GX-Pack fallback runtime coverage once .opencode hook modules expose a stable test import surface",
  )
})
