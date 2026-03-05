import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { initProject } from "../src/cli/init.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { createHivemindInspectTool } from "../src/tools/hivemind-inspect.js"

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any

describe("hivemind_inspect introspect action", () => {
  it("returns schema population and contamination summary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-introspect-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      const sessionTool = createHivemindSessionTool(dir)
      await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Introspect test" }, mockContext)
      await sessionTool.execute({ action: "update", level: "tactic", content: "Inspect hierarchy" }, mockContext)

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute({ action: "introspect" }, mockContext)
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(Array.isArray(parsed.metadata?.schema_fields), true)
      assert.equal(parsed.metadata?.schema_fields.includes("trajectory"), true)
      assert.equal(typeof parsed.metadata?.populated?.tasks, "number")
      assert.equal(typeof parsed.metadata?.stale_count, "number")
      assert.equal(typeof parsed.metadata?.contaminated_count, "number")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
