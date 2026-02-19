import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { createSoftGovernanceHook } from "../src/hooks/soft-governance.js"
import { createHivemindCycleTool } from "../src/tools/hivemind-cycle.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { flushMutations } from "../src/lib/state-mutation-queue.js"
import { noopLogger } from "../src/lib/logging.js"
import { maybeCreateNonDisruptiveSessionSplit } from "../src/lib/session-split.js"
import { createNode, createTree, markComplete, saveTree, setRoot } from "../src/lib/hierarchy-tree.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

describe("Phase 5 RED: canonical governance compatibility gaps", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-phase5-canonical-red-"))
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("treats hivemind_session update action as canonical governance acknowledgement", async () => {
    const config = createConfig()
    const stateManager = createStateManager(dir)
    const rawHook = createSoftGovernanceHook(noopLogger, dir, config)

    const state = await stateManager.load()
    assert.ok(state, "brain state should exist")

    await stateManager.save({
      ...state!,
      metrics: {
        ...state!.metrics,
        governance_counters: {
          ...state!.metrics.governance_counters,
          out_of_order: 2,
          acknowledged: false,
        },
      },
    })

    await rawHook(
      { tool: "hivemind_session", sessionID: "test-session", callID: "call-0" },
      {
        title: "hivemind_session",
        output: JSON.stringify({ action: "status" }),
        metadata: { action: "status" },
      },
    )
    await flushMutations(stateManager)

    let updated = await stateManager.load()
    assert.equal(
      updated?.metrics.governance_counters.acknowledged,
      false,
      "status action should not acknowledge governance cycles",
    )

    await rawHook(
      { tool: "hivemind_session", sessionID: "test-session", callID: "call-1" },
      {
        title: "hivemind_session",
        output: JSON.stringify({ action: "update", level: "action", content: "continue" }),
        metadata: { action: "update", level: "action" },
      },
    )
    await flushMutations(stateManager)

    updated = await stateManager.load()
    assert.equal(
      updated?.metrics.governance_counters.acknowledged,
      true,
      "expected hivemind_session update to acknowledge pending governance failure cycles",
    )
  })

  it("clears pending_failure_ack through canonical hivemind_cycle export path", async () => {
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    assert.ok(state, "brain state should exist")

    await stateManager.save({
      ...state!,
      pending_failure_ack: true,
      session: {
        ...state!.session,
        governance_status: "OPEN",
      },
    })

    const cycleTool = createHivemindCycleTool(dir)
    const exportResult = await cycleTool.execute({ action: "export" }, {} as any)
    const parsed = JSON.parse(exportResult as string)
    assert.equal(parsed.status, "success", "export should succeed so canonical ack path is exercised")

    const updated = await stateManager.load()
    assert.equal(
      updated?.pending_failure_ack,
      false,
      "expected hivemind_cycle export to clear pending_failure_ack",
    )
  })

  it("clears pending_failure_ack through blocked canonical hivemind_session update path", async () => {
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    assert.ok(state, "brain state should exist")

    await stateManager.save({
      ...state!,
      pending_failure_ack: true,
      session: {
        ...state!.session,
        governance_status: "OPEN",
      },
    })

    const sessionTool = createHivemindSessionTool(dir)
    const updateResult = await sessionTool.execute(
      {
        action: "update",
        level: "action",
        content: "Blocked on remediation sign-off",
        status: "blocked",
      } as any,
      {} as any,
    )
    const parsed = JSON.parse(updateResult as string)
    assert.equal(parsed.status, "success", "update should succeed so blocked canonical ack path is exercised")

    const updated = await stateManager.load()
    assert.equal(
      updated?.pending_failure_ack,
      false,
      "expected blocked hivemind_session update to clear pending_failure_ack",
    )
  })

  it("accepts canonical auto-split trigger tools (hivemind_session/hivemind_cycle/hivemind_inspect)", async () => {
    const config = createConfig({
      governance_mode: "assisted",
      automation_level: "full",
      auto_compact_on_turns: 50,
    })
    await saveConfig(dir, config)

    const brain = unlockSession(createBrainState(generateSessionId(), config))
    brain.session.role = "main"
    brain.metrics.turn_count = 30
    brain.metrics.user_turn_count = 35
    brain.compaction_count = 2
    brain.cycle_log = []

    const root = createNode("trajectory", "Canonical split trigger coverage")
    let tree = setRoot(createTree(), root)
    tree = markComplete(tree, root.id, Date.now())
    await saveTree(dir, tree)

    const createCalls: string[] = []
    const client = {
      session: {
        create: async () => {
          createCalls.push("create")
          return { id: "ses_canonical_trigger" }
        },
      },
    }

    for (const triggerTool of ["hivemind_session", "hivemind_cycle", "hivemind_inspect"]) {
      const split = await maybeCreateNonDisruptiveSessionSplit(dir, brain, {
        log: noopLogger,
        hiveMindConfig: config,
        sessionID: "test-session",
        triggerTool,
        client,
        emitToast: async () => true,
      })

      assert.ok(split, `expected split trigger compatibility for canonical tool '${triggerTool}'`)
    }

    assert.equal(createCalls.length > 0, true, "expected canonical trigger path to invoke session creation")
  })
})
