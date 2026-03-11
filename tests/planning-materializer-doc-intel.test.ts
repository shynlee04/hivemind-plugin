import { afterEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { materializeProjectMd, materializeStateMd } from "../src/lib/planning-materializer.js"
import { initializePlanningProjectDir } from "../src/lib/fs/planning-ops.js"
import { normalizeToolAlias } from "../src/lib/tool-names.js"
import { createHivemindDocWeaverTool } from "../src/tools/hivemind-doc-weaver.js"

let tempRoot = ""

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true })
    tempRoot = ""
  }
})

async function makeProjectRoot(): Promise<string> {
  tempRoot = await mkdtemp(join(tmpdir(), "planning-doc-intel-"))
  return tempRoot
}

describe("planning materializer doc-intel migration", () => {
  it("dedupes repeated state-history appends while using section upserts", async () => {
    const projectRoot = await makeProjectRoot()

    await materializeStateMd(projectRoot, {
      currentPosition: "Trajectory -> Tactic",
      activeBlockers: ["Blocker A"],
      recentDecisions: [{ decision: "Freeze ingress", date: "2026-03-11", session_id: "ses_main" }],
      sessionEntry: { session_id: "ses_main", summary: "Started reroute", date: "2026-03-11" },
    })

    await materializeStateMd(projectRoot, {
      recentDecisions: [{ decision: "Freeze ingress", date: "2026-03-11", session_id: "ses_main" }],
      sessionEntry: { session_id: "ses_main", summary: "Started reroute", date: "2026-03-11" },
    })

    const content = await readFile(join(projectRoot, ".hivemind", "project", "planning", "STATE.md"), "utf-8")

    assert.ok(content.includes("## Current Position"))
    assert.ok(content.includes("Trajectory -> Tactic"))
    assert.equal(content.match(/Freeze ingress/g)?.length ?? 0, 1)
    assert.equal(content.match(/Started reroute/g)?.length ?? 0, 1)
  })

  it("recreates a missing project section through the canonical doc-intel path", async () => {
    const projectRoot = await makeProjectRoot()
    await initializePlanningProjectDir(join(projectRoot, ".hivemind"))

    const projectFile = join(projectRoot, ".hivemind", "project", "planning", "PROJECT.md")
    await writeFile(projectFile, "# Project Vision\n\n## Purpose\n\nExisting purpose.\n", "utf-8")

    await materializeProjectMd(projectRoot, {
      scope: "- manifest-first planning\n- registry-led startup",
    })

    const content = await readFile(projectFile, "utf-8")
    assert.ok(content.includes("## Scope"))
    assert.ok(content.includes("manifest-first planning"))
    assert.ok(content.includes("registry-led startup"))
  })
})

describe("document compatibility lane", () => {
  it("normalizes the legacy doc weaver alias to hivemind_doc", () => {
    assert.equal(normalizeToolAlias("hivemind_doc_weaver"), "hivemind_doc")
  })

  it("routes the legacy doc weaver wrapper through canonical section writes", async () => {
    const projectRoot = await makeProjectRoot()
    const docPath = join(projectRoot, "notes.md")
    await writeFile(docPath, "# Intro\n\nOld body.\n", "utf-8")

    const tool = createHivemindDocWeaverTool(projectRoot)
    const output = await tool.execute(
      {
        file_path: "notes.md",
        heading: "Intro",
        new_content: "New body.",
      },
      {} as never,
    )

    const content = await readFile(docPath, "utf-8")
    assert.ok(output.includes("\"canonical_tool\""))
    assert.ok(output.includes("hivemind_doc"))
    assert.ok(content.includes("New body."))
    assert.ok(!content.includes("Old body."))
  })
})
