import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import type { Logger } from "../src/lib/logging.js"
import { createStateManager } from "../src/lib/persistence.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { createTree, saveTree } from "../src/lib/hierarchy-tree.js"
import { createConfig } from "../src/schemas/config.js"
import { createEventHandler } from "../src/hooks/event-handler.js"

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

      const profile = JSON.parse(
        await readFile(join(paths.activeDir, sessionId, "profile.json"), "utf-8"),
      )
      assert.equal(profile.session_id, sessionId)
      assert.equal(profile.agent, "unresolved")
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

      const profile = JSON.parse(
        await readFile(join(getEffectivePaths(dir).activeDir, sessionId, "profile.json"), "utf-8"),
      )
      assert.equal(profile.session_id, sessionId)
      assert.equal(profile.agent, "unresolved")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
