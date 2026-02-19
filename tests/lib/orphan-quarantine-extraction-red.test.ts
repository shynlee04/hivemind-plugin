import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { getEffectivePaths } from "../../src/lib/paths.js"
import { validateTasksWithFKValidation, type OrphanRecord } from "../../src/lib/graph-io.js"

type OrphanQuarantineModule = {
  loadOrphansFile: (orphanPath: string) => Promise<{ version: string; orphans: OrphanRecord[] }>
  quarantineOrphan: (orphanPath: string, record: OrphanRecord) => Promise<void>
}

async function loadExtractionModule(): Promise<OrphanQuarantineModule> {
  try {
    const module = await import("../../src/lib/orphan-quarantine.js")
    if (typeof module.loadOrphansFile !== "function") {
      assert.fail("RED contract missing: expected loadOrphansFile export in src/lib/orphan-quarantine.ts")
    }
    if (typeof module.quarantineOrphan !== "function") {
      assert.fail("RED contract missing: expected quarantineOrphan export in src/lib/orphan-quarantine.ts")
    }
    return module as OrphanQuarantineModule
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : ""
    const message = error instanceof Error ? error.message : String(error)
    const isTargetModuleNotFound =
      code === "ERR_MODULE_NOT_FOUND" &&
      /cannot find module/i.test(message) &&
      /src[\\/]lib[\\/]orphan-quarantine\.js|src[\\/]lib[\\/]orphan-quarantine\.ts|orphan-quarantine\.js|orphan-quarantine\.ts/i.test(
        message,
      )

    if (isTargetModuleNotFound) {
      assert.fail(
        `RED contract missing: expected extracted orphan quarantine module at src/lib/orphan-quarantine.ts (${String(error)})`,
      )
    }

    throw error
  }
}

describe("Phase 6.1 RED: orphan quarantine extraction safety", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-orphan-red-"))
    await mkdir(join(dir, ".hivemind", "graph"), { recursive: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("loads empty orphans state when orphan file is missing", async () => {
    const orphanPath = getEffectivePaths(dir).graphOrphans
    const module = await loadExtractionModule()

    const state = await module.loadOrphansFile(orphanPath)
    assert.deepEqual(state, { version: "1.0.0", orphans: [] })
  })

  it("appends quarantine records without clobbering existing data", async () => {
    const orphanPath = getEffectivePaths(dir).graphOrphans
    const module = await loadExtractionModule()

    const firstRecord: OrphanRecord = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      type: "task",
      reason: "test reason one",
      original_data: { source: "test-1" },
      quarantined_at: new Date().toISOString(),
    }
    const secondRecord: OrphanRecord = {
      id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
      type: "mem",
      reason: "test reason two",
      original_data: { source: "test-2" },
      quarantined_at: new Date().toISOString(),
    }

    await module.quarantineOrphan(orphanPath, firstRecord)
    await module.quarantineOrphan(orphanPath, secondRecord)

    const raw = await readFile(orphanPath, "utf-8")
    const saved = JSON.parse(raw) as { version: string; orphans: OrphanRecord[] }

    assert.equal(saved.version, "1.0.0")
    assert.equal(saved.orphans.length, 2)
    assert.equal(saved.orphans[0]?.id, firstRecord.id)
    assert.equal(saved.orphans[1]?.id, secondRecord.id)
  })

  it("stays compatible with existing graph-io FK quarantine path", async () => {
    const paths = getEffectivePaths(dir)
    const module = await loadExtractionModule()

    await writeFile(
      paths.graphTasks,
      JSON.stringify({
        version: "1.0.0",
        tasks: [
          {
            id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
            parent_phase_id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
            title: "orphan task",
            status: "pending",
            file_locks: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    )

    await validateTasksWithFKValidation(paths.graphTasks, new Set<string>(), paths.graphOrphans)

    const loaded = await module.loadOrphansFile(paths.graphOrphans)
    assert.equal(loaded.orphans.length, 1)
    assert.equal(loaded.orphans[0]?.id, "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13")
    assert.equal(loaded.orphans[0]?.type, "task")
  })
})
