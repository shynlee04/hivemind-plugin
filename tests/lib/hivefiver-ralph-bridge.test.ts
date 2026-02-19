import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { getEffectivePaths } from "../../src/lib/paths.js"
import { buildRalphTaskGraphSnapshot } from "../../src/lib/graph-io.js"
import { validateRalphPrdJsonShape } from "../../src/schemas/graph-nodes.js"

describe("HiveFiver Ralph bridge helpers", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-ralph-"))
    const paths = getEffectivePaths(dir)
    await mkdir(join(dir, ".hivemind", "state"), { recursive: true })
    await mkdir(join(dir, ".hivemind", "graph"), { recursive: true })

    await writeFile(
      paths.tasks,
      JSON.stringify(
        {
          session_id: "session-a",
          updated_at: Date.now(),
          tasks: [
            {
              id: "story-1",
              text: "Create onboarding flow\n- [ ] Intake wizard\n- [ ] Persona scoring",
              status: "pending",
              dependencies: [],
            },
            {
              id: "story-2",
              text: "Add MCP research pack",
              status: "in_progress",
              depends_on: ["story-1"],
              acceptanceCriteria: ["Context7 included", "DeepWiki included"],
            },
          ],
        },
        null,
        2,
      ),
    )
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("builds flat-root PRD JSON from state tasks", async () => {
    const snapshot = await buildRalphTaskGraphSnapshot(dir, {
      name: "HiveFiver Export",
      description: "from tasks",
    })

    assert.equal(snapshot.source, "state.tasks")
    assert.equal(snapshot.prd.name, "HiveFiver Export")
    assert.equal(snapshot.prd.userStories.length, 2)

    const first = snapshot.prd.userStories[0]
    assert.equal(first?.id, "story-1")
    assert.equal(first?.acceptanceCriteria.length, 2)

    const second = snapshot.prd.userStories[1]
    assert.equal(second?.status, "in_progress")
    assert.deepEqual(second?.dependencies, ["story-1"])

    const shape = validateRalphPrdJsonShape(snapshot.prd)
    assert.equal(shape.valid, true)
    assert.equal(shape.errors.length, 0)
  })

  it("flags anti-pattern wrappers and wrong root keys", () => {
    const invalid = {
      prd: {
        name: "bad",
        tasks: [],
      },
    }

    const result = validateRalphPrdJsonShape(invalid)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((line) => line.includes("wrapper key 'prd'")))
    assert.ok(
      result.errors.some((line) => line.includes("userStories")) ||
      result.errors.some((line) => line.includes("missing root key: userStories"))
    )
  })
})
