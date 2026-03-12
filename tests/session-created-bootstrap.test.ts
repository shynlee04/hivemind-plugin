import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import type { Logger } from "../src/lib/logging.js"
import { createStateManager } from "../src/lib/persistence.js"
import { getEffectivePaths, getSessionPaths } from "../src/lib/paths.js"
import { createTree, saveTree } from "../src/lib/hierarchy-tree.js"
import { createConfig } from "../src/schemas/config.js"
import { createEventHandler } from "../src/hooks/event-handler.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"

const noopLogger: Logger = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
  debug: async () => {},
}

describe("session.created bootstrap ownership", () => {
  it("creates minimal canonical src bootstrap state when runtime state files are missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-session-created-bootstrap-"))
    const sessionId = "ses_created_bootstrap"

    try {
      const handler = createEventHandler(noopLogger, dir)
      await handler({
        event: {
          type: "session.created",
          properties: { info: { id: sessionId } },
        } as any,
      })

      const paths = getEffectivePaths(dir)
      const state = await createStateManager(dir).load()
      assert(state)
      assert.equal(state.session.opencode_session_id, sessionId)
      assert.equal(state.session.governance_status, "LOCKED")
      assert.equal(state.hierarchy.trajectory, "")

      const rawTree = JSON.parse(await readFile(paths.hierarchy, "utf-8"))
      assert.equal(rawTree.root, null)

      const profile = JSON.parse(await readFile(getSessionPaths(dir, sessionId).profile, "utf-8"))
      assert.equal(profile.session_id, sessionId)
      assert.equal(profile.agent, "unresolved")
      assert.equal(profile.lineage_scope, "unknown")
      assert.equal(profile.session_kind, "unresolved")
      assert.equal(profile.brain_session_id, state.session.id)
      assert.equal(typeof profile.created_at, "number")
      assert.equal(typeof profile.updated_at, "number")
      assert(profile.updated_at >= profile.created_at)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("does not replace an existing canonical brain session id during session.created bootstrap", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-session-created-preserve-"))
    const sessionId = "ses_existing_owner"

    try {
      const stateManager = createStateManager(dir)
      const existingState = await stateManager.initialize("canonical-session-id", createConfig())
      await saveTree(dir, createTree())

      const handler = createEventHandler(noopLogger, dir)
      await handler({
        event: {
          type: "session.created",
          properties: { info: { id: sessionId } },
        } as any,
      })

      const updatedState = await stateManager.load()
      assert(updatedState)
      assert.equal(updatedState.session.id, existingState.session.id)
      assert.equal(updatedState.session.opencode_session_id, sessionId)

      const profile = JSON.parse(await readFile(getSessionPaths(dir, sessionId).profile, "utf-8"))
      assert.equal(profile.session_id, sessionId)
      assert.equal(profile.agent, "unresolved")
      assert.equal(profile.lineage_scope, "unknown")
      assert.equal(profile.session_kind, "unresolved")
      assert.equal(profile.brain_session_id, existingState.session.id)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("manual bootstrap writes canonical runtime state that stateManager can load", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-bootstrap-tool-canonical-"))

    try {
      const sessionTool = createHivemindSessionTool(dir)
      const raw = await sessionTool.execute({ action: "bootstrap", force: false }, {} as any)
      const parsed = JSON.parse(raw as string)

      assert.equal(parsed.status, "success")

      const state = await createStateManager(dir).load()
      assert(state, "expected canonical BrainState to be loadable after bootstrap")
      assert.equal(state.session.governance_status, "LOCKED")
      assert.equal(typeof state.session.id, "string")
      assert.equal(state.session.id.length > 0, true)

      const profilePath = parsed.metadata?.stateFiles?.profile
      assert.equal(typeof profilePath, "string")

      const profile = JSON.parse(await readFile(profilePath, "utf-8"))
      assert.equal(profile.session_id, parsed.entity_id)
      assert.equal(profile.brain_session_id, state.session.id)
      assert.equal(profile.agent, "unresolved")
      assert.equal(profile.lineage_scope, "unknown")
      assert.equal(profile.session_kind, "unresolved")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
