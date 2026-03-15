import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdtemp, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { initProject } from "../src/cli/init.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { createHivemindInspectTool } from "../src/tools/hivemind-inspect.js"
import { getEffectivePaths } from "../src/lib/paths.js"

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
}

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

describe("hivemind_inspect introspect failure paths", () => {
  it("returns inactive payload when no state exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-introspect-empty-"))
    try {
      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute({ action: "introspect" }, mockContext)
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata?.active, false)
      assert.equal(parsed.metadata?.error, "no session")
      assert.equal(typeof parsed.metadata?.stale_count, "number")
      assert.equal(typeof parsed.metadata?.contaminated_count, "number")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("degrades safely when graph artifacts are malformed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-introspect-corrupt-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      const sessionTool = createHivemindSessionTool(dir)
      await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Corrupt graph test" }, mockContext)

      const paths = getEffectivePaths(dir)
      await writeFile(paths.graphMems, "{ not-valid-json", "utf8")
      await writeFile(paths.graphTasks, "{ also-not-valid-json", "utf8")

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute({ action: "introspect" }, mockContext)
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata?.active, true)
      assert.equal(typeof parsed.metadata?.populated?.tasks, "number")
      assert.equal(typeof parsed.metadata?.contaminated_count, "number")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
