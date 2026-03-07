import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { describe, it } from "node:test"

import type { MessageV2 } from "../src/hooks/messages-transform.js"

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

async function setupIntentClassifierDir(sessionId: string): Promise<{
  dir: string
  profilePath: string
}> {
  const dir = await mkdtemp(join(tmpdir(), "hm-intent-boundary-"))
  const profileDir = join(dir, ".hivemind", "sessions", "active", sessionId)
  await mkdir(profileDir, { recursive: true })
  const profilePath = join(profileDir, "profile.json")
  await writeFile(
    profilePath,
    JSON.stringify({
      session_id: sessionId,
      agent: "unresolved",
      updated_at: 0,
    }, null, 2),
    "utf-8",
  )
  return { dir, profilePath }
}

describe("plugin intent-classifier boundary", () => {
  it("does not classify or persist profile changes when core runtime hooks are present", async () => {
    const sessionId = "intent-core-present"
    const { dir, profilePath } = await setupIntentClassifierDir(sessionId)
    await mkdir(join(dir, "src", "hooks"), { recursive: true })
    await writeFile(join(dir, "src", "hooks", "session-lifecycle.ts"), "// presence marker\n", "utf-8")
    await writeFile(join(dir, "src", "hooks", "messages-transform.ts"), "// presence marker\n", "utf-8")

    const savedStates: unknown[] = []
    const state = {
      current: {
        sessionId,
        agent: "unresolved",
        delegationChain: [],
        gatesPassed: [],
        scopeViolations: [],
        turnCount: 0,
        lastCheckpoint: 0,
        classificationPending: false,
        classificationDone: false,
      },
      save: (next: unknown) => {
        savedStates.push(next)
      },
      worktree: dir,
    }

    try {
      const pluginModule = await import("../.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts")
      const hookBuilder = pluginModule.buildIntentClassifierHook as
        | ((state: any) => (input: any, output: any) => Promise<void>)
        | undefined
      assert.equal(typeof hookBuilder, "function")
      const hook = hookBuilder(state as any)
      await hook({}, { messages: [createUserMessage("please refactor this", sessionId)] })

      const profileAfter = JSON.parse(await readFile(profilePath, "utf-8"))
      assert.equal(state.current.classificationDone, false)
      assert.equal(savedStates.length, 0)
      assert.deepEqual(profileAfter, {
        session_id: sessionId,
        agent: "unresolved",
        updated_at: 0,
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("classifies and persists lineage when core runtime hooks are absent", async () => {
    const sessionId = "intent-core-absent"
    const { dir, profilePath } = await setupIntentClassifierDir(sessionId)
    await mkdir(join(dir, "scripts"), { recursive: true })
    await writeFile(
      join(dir, "scripts", "classify-intent.sh"),
      "#!/usr/bin/env bash\necho hivefiver\n",
      "utf-8",
    )

    const state = {
      current: {
        sessionId,
        agent: "unresolved",
        delegationChain: [],
        gatesPassed: [],
        scopeViolations: [],
        turnCount: 0,
        lastCheckpoint: 0,
        classificationPending: false,
        classificationDone: false,
      },
      save: (next: any) => {
        state.current = next
      },
      worktree: dir,
    }

    try {
      const pluginModule = await import("../.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts")
      const hookBuilder = pluginModule.buildIntentClassifierHook as
        | ((state: any) => (input: any, output: any) => Promise<void>)
        | undefined
      assert.equal(typeof hookBuilder, "function")
      const hook = hookBuilder(state as any)
      await hook({}, { messages: [createUserMessage("please refactor this", sessionId)] })

      const profileAfter = JSON.parse(await readFile(profilePath, "utf-8"))
      assert.equal(state.current.classificationDone, true)
      assert.equal(state.current.intentClassification?.lineage, "hivefiver")
      assert.equal(profileAfter.lineage, "hivefiver")
      assert.equal(profileAfter.agent, "hivefiver")
      assert.equal(typeof profileAfter.updated_at, "number")
      assert(profileAfter.updated_at > 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
