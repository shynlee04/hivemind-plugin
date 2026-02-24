import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { packCognitiveState } from "../../src/lib/cognitive-packer.js"
import { getEffectivePaths } from "../../src/lib/paths.js"

const tempDirs: string[] = []

const SESSION_ID = "11111111-1111-4111-8111-111111111111"
const TRAJECTORY_ID = "22222222-2222-4222-8222-222222222222"
const FIXED_ISO = "2026-02-24T00:00:00.000Z"

async function makeTempProject(): Promise<string> {
  const projectRoot = await mkdtemp(join(tmpdir(), "hm-cognitive-digest-"))
  tempDirs.push(projectRoot)
  return projectRoot
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

async function seedNonEmptyState(projectRoot: string): Promise<void> {
  const paths = getEffectivePaths(projectRoot)

  await writeJson(paths.graphTrajectory, {
    version: "1.0.0",
    trajectory: {
      id: TRAJECTORY_ID,
      session_id: SESSION_ID,
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent: "digest-test",
      created_at: FIXED_ISO,
      updated_at: FIXED_ISO,
    },
  })

  await writeJson(paths.config, { governance_mode: "strict" })
  await writeJson(paths.plansManifest, { plans: [], version: "1.0.0" })
  await writeJson(paths.hierarchy, { nodes: [{ id: "n1" }] })
  await writeJson(paths.anchors, { anchors: [{ key: "k", value: "v" }] })
  await writeJson(paths.mems, { mems: [] })
  await writeJson(paths.brain, { session_id: SESSION_ID, metrics: { drift_score: 70 } })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
})

describe("cognitive packer checklist digest", () => {
  it("includes checklist_passed in context_summary", async () => {
    const projectRoot = await makeTempProject()
    await seedNonEmptyState(projectRoot)

    const xml = packCognitiveState(projectRoot, { sessionId: SESSION_ID })

    assert.ok(xml.includes('<checklist_passed value="true" />'))
  })

  it("includes checklist_fail_count in context_summary", async () => {
    const projectRoot = await makeTempProject()
    await seedNonEmptyState(projectRoot)

    const xml = packCognitiveState(projectRoot, { sessionId: SESSION_ID })

    assert.ok(xml.includes('<checklist_fail_count value="0" />'))
  })

  it("includes checklist_missing_keys in context_summary", async () => {
    const projectRoot = await makeTempProject()
    await seedNonEmptyState(projectRoot)

    const xml = packCognitiveState(projectRoot, { sessionId: SESSION_ID })

    assert.ok(xml.includes('<checklist_missing_keys value="" />'))
  })

  it("includes checklist digest fields in empty-state XML", async () => {
    const projectRoot = await makeTempProject()

    const xml = packCognitiveState(projectRoot, { sessionId: SESSION_ID })

    assert.ok(xml.includes('<checklist_passed value="false" />'))
    assert.ok(xml.includes('<checklist_fail_count value="7" />'))
    assert.ok(xml.includes('<checklist_warn_count value="0" />'))
    assert.ok(xml.includes('<checklist_missing_keys value="all" />'))
  })

  it("produces deterministic digest output for identical snapshot", async () => {
    const projectRoot = await makeTempProject()
    await seedNonEmptyState(projectRoot)

    const xmlA = packCognitiveState(projectRoot, { sessionId: SESSION_ID })
    const xmlB = packCognitiveState(projectRoot, { sessionId: SESSION_ID })

    assert.equal(xmlA, xmlB)
  })
})
