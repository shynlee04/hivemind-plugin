import assert from "node:assert/strict"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"
import { parse } from "yaml"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import {
  applyPendingStateMutations,
  clearMutationQueue,
  queueStateMutation,
  restoreStateFromCheckpoint,
} from "../src/lib/state-mutation-queue.js"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { validateSessionState } from "../src/lib/gatekeeper.js"
import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { noopLogger } from "../src/lib/logging.js"

describe("governance hardening", () => {
  it("flags pending mandatory governance tools in gatekeeper", () => {
    const config = createConfig({ governance_mode: "assisted" })
    const base = unlockSession(createBrainState(generateSessionId(), config))
    const state = {
      ...base,
      hierarchy: {
        ...base.hierarchy,
        action: "Validate pending tools",
      },
      pending_mandatory_tools: ["hivemind_cycle"],
    }

    const result = validateSessionState(state)
    assert.equal(result.passed, true)
    assert.equal(
      result.violations.some((v) => v.code === "MANDATORY_TOOLS_PENDING" && v.severity === "warning"),
      true,
    )
  })

  it("restores checkpoint snapshots deterministically", () => {
    const config = createConfig({ governance_mode: "assisted" })
    const sessionId = "checkpoint-session"
    const base = unlockSession(createBrainState(generateSessionId(), config))

    clearMutationQueue(sessionId)
    queueStateMutation(
      {
        type: "CHECKPOINT",
        payload: {},
        source: "test:checkpoint",
      },
      sessionId,
    )
    queueStateMutation(
      {
        type: "UPDATE_STATE",
        payload: {
          hierarchy: {
            action: "Post-checkpoint action",
          },
        },
        source: "test:after-checkpoint",
      },
      sessionId,
    )

    const projected = applyPendingStateMutations(base, sessionId)
    const checkpointId = projected.checkpoints.at(-1)?.id
    assert.ok(checkpointId)

    const restored = restoreStateFromCheckpoint(projected, checkpointId!)
    assert.ok(restored)
    assert.notEqual(restored!.hierarchy.action, projected.hierarchy.action)
    assert.equal(restored!.hierarchy.action, "")

    clearMutationQueue(sessionId)
  })

  it("emits advisory signal when role violates tool governance policy", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-governance-role-"))
    try {
      await initializePlanningDirectory(dir)
      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const base = unlockSession(createBrainState(generateSessionId(), config))
      const state = {
        ...base,
        session: {
          ...base.session,
          role: "hivefiver",
        },
        first_turn_confirmation: {
          ...base.first_turn_confirmation,
          required: false,
          confirmed: true,
        },
      }
      await stateManager.save(state)

      const hook = createToolGateHookInternal(noopLogger, dir, config)
      const result = await hook({ sessionID: "policy-role", tool: "write" })

      assert.equal(result.allowed, true)
      assert.equal(result.signal?.severity, "advisory")
      assert.equal(result.warning?.includes("outside policy"), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("validates composed workflow gate contract", async () => {
    const raw = await readFile(join(process.cwd(), "workflows/composed-workflow.yaml"), "utf8")
    const parsed = parse(raw) as {
      compose?: Array<{ workflow?: string; phase?: string; gate?: string }>
      target_agent?: string
      guards?: Array<{ check?: string }>
    }

    assert.equal(parsed.target_agent, "hiveminder")
    assert.equal(Array.isArray(parsed.compose), true)
    assert.equal(parsed.compose?.length, 2)
    assert.equal(parsed.compose?.[0]?.workflow, "hivefiver-enterprise.yaml")
    assert.equal(parsed.compose?.[1]?.workflow, "sequential-delegation-workflow.yaml")
    assert.equal(typeof parsed.compose?.[0]?.gate, "string")
    assert.equal(typeof parsed.compose?.[1]?.gate, "string")
    assert.equal(parsed.guards?.some((guard) => guard.check === "composed_workflow_entries_present"), true)
  })
})
