import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { saveAnchors } from "../src/lib/anchors.js"
import { clearTurnInjectionLedger } from "../src/lib/injection-orchestrator.js"
import { saveTrajectory } from "../src/lib/graph-io.js"
import { packCognitiveState } from "../src/lib/cognitive-packer.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { clearMutationQueue, flushMutations } from "../src/lib/state-mutation-queue.js"
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

describe("injection surface ownership baseline", () => {
  it("keeps next-step guidance in system while removing duplicate status and anchor surfaces when packer context is present", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-injection-ownership-"))
    const sessionId = randomUUID()

    try {
      await initializePlanningDirectory(dir)
      clearTurnInjectionLedger()
      clearMutationQueue()

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
      const state = unlockSession(createBrainState(sessionId, config, "plan_driven"))
      state.session.opencode_session_id = sessionId
      state.session.governance_status = "active"
      state.session.mode = "plan_driven"
      state.hierarchy.trajectory = "Trajectory Alpha"
      state.hierarchy.tactic = "Tactic Beta"
      state.hierarchy.action = "Action Gamma"
      state.metrics.turn_count = 3
      state.metrics.user_turn_count = 3
      state.metrics.context_updates = 1
      state.metrics.drift_score = 7
      state.metrics.files_touched = ["src/one.ts", "src/two.ts"]
      state.first_turn_context_injected = true
      await stateManager.save(state)

      const now = new Date().toISOString()
      await saveTrajectory(dir, {
        version: "1.0",
        trajectory: {
          id: randomUUID(),
          session_id: sessionId,
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
            session_id: sessionId,
          },
        ],
      })

      const logger = {
        debug: async (_message: string) => {},
        info: async (_message: string) => {},
        warn: async (_message: string) => {},
        error: async (_message: string) => {},
      }

      const lifecycleHook = createSessionLifecycleHook(logger, dir, config)
      const lifecycleOutput = {
        system: [] as string[],
        messages: [createUserMessage("status baseline", sessionId)],
      }
      await lifecycleHook({ sessionID: sessionId }, lifecycleOutput)

      const messagesHook = createMessagesTransformHook({ warn: async () => {} }, dir)
      const messageOutput = { messages: [createUserMessage("anchor baseline", sessionId)] }
      await messagesHook({}, messageOutput)
      await flushMutations(stateManager)

      const lifecycleText = lifecycleOutput.system.join("\n")
      const syntheticTexts = getSyntheticTextParts(messageOutput.messages[0])

      assert.doesNotMatch(
        lifecycleText,
        /Session: active \| Mode: plan_driven \| Governance: assisted/,
      )
      assert.match(lifecycleText, /continue execution/i)
      assert(syntheticTexts.some((text) => text.includes("<hivemind_state ")))
      assert(syntheticTexts.every((text) => !text.includes("[SYSTEM ANCHOR:")))
    } finally {
      clearTurnInjectionLedger()
      clearMutationQueue()
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("confirms the cognitive packer already carries overlapping anchor and summary structure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-injection-packer-"))
    const sessionId = randomUUID()

    try {
      await initializePlanningDirectory(dir)
      clearMutationQueue()

      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState(sessionId, config, "plan_driven"))
      state.metrics.drift_score = 7
      state.metrics.files_touched = ["src/one.ts", "src/two.ts"]
      await stateManager.save(state)

      const now = new Date().toISOString()
      await saveTrajectory(dir, {
        version: "1.0",
        trajectory: {
          id: randomUUID(),
          session_id: sessionId,
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
            session_id: sessionId,
          },
        ],
      })

      const packed = packCognitiveState(dir, { sessionId })

      assert.match(packed, /<hivemind_state /)
      assert.match(packed, /intent="Trajectory Alpha"/)
      assert.match(packed, /<anchors>/)
      assert.match(packed, /<anchor key="phase" value="Action Gamma" \/>/)
      assert.match(packed, /<anchors count="1" \/>/)
      assert.match(packed, /<files_touched count="\d+" \/>/)
      assert.match(packed, /<drift_score value="7" \/>/)
    } finally {
      clearMutationQueue()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
