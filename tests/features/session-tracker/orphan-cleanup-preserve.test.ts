/**
 * Regression tests for orphan child directory cleanup preserving hierarchy data.
 *
 * @module tests/features/session-tracker/orphan-cleanup-preserve
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdir, rm, writeFile, readFile, access } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { OrphanCleanup } from "../../../src/features/session-tracker/orphan-cleanup.js"
import { HierarchyIndex } from "../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { OrphanQuarantine } from "../../../src/features/session-tracker/persistence/orphan-quarantine.js"

describe("OrphanCleanup preserves child records before quarantine", () => {
  let projectRoot: string
  let trackerRoot: string

  beforeEach(async () => {
    projectRoot = join(tmpdir(), `orphan-preserve-test-${Date.now()}`)
    trackerRoot = join(projectRoot, ".hivemind", "session-tracker")
    await mkdir(trackerRoot, { recursive: true })
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it("moves L2 json from orphan L1 dir into root main and preserves nested hierarchy", async () => {
    const rootID = "ses_rootPreserve001"
    const l1ID = "ses_l1Preserve001"
    const l2ID = "ses_l2Preserve001"
    const rootDir = join(trackerRoot, rootID)
    const l1Dir = join(trackerRoot, l1ID)
    await mkdir(rootDir, { recursive: true })
    await mkdir(l1Dir, { recursive: true })

    await writeFile(
      join(rootDir, "session-continuity.json"),
      JSON.stringify({
        version: "2.0",
        sessionID: rootID,
        lastUpdated: "2026-05-16T00:00:00.000Z",
        hierarchy: {
          root: rootID,
          children: {
            [l1ID]: {
              file: `${l1ID}.json`,
              depth: 1,
              status: "active",
              delegatedBy: "l1-agent",
              children: {},
            },
          },
        },
        turnCount: 1,
        toolSummary: {},
      }),
    )
    await writeFile(
      join(rootDir, "hierarchy-manifest.json"),
      JSON.stringify({
        version: "1.0",
        rootMainSessionID: rootID,
        lastUpdated: "2026-05-16T00:00:00.000Z",
        children: {
          [l1ID]: {
            sessionID: l1ID,
            parentSessionID: rootID,
            rootMainSessionID: rootID,
            delegationDepth: 1,
            delegatedBy: "l1-agent",
            subagentType: "l1-agent",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
            status: "active",
            turnCount: 0,
            childFile: `${l1ID}.json`,
          },
        },
        totalChildren: 1,
        maxDepth: 1,
      }),
    )
    await writeFile(join(rootDir, `${l1ID}.json`), JSON.stringify({ sessionID: l1ID }))

    await writeFile(
      join(l1Dir, "session-continuity.json"),
      JSON.stringify({
        version: "2.0",
        sessionID: l1ID,
        lastUpdated: "2026-05-16T00:00:01.000Z",
        hierarchy: {
          root: l1ID,
          children: {
            [l2ID]: {
              file: `${l2ID}.json`,
              depth: 1,
              status: "active",
              delegatedBy: "l2-agent",
              children: {},
            },
          },
        },
        turnCount: 0,
        toolSummary: {},
      }),
    )
    await writeFile(
      join(l1Dir, `${l2ID}.json`),
      JSON.stringify({ sessionID: l2ID, parentSessionID: l1ID, delegationDepth: 2 }),
    )

    const hierarchyIndex = new HierarchyIndex({ projectRoot })
    await hierarchyIndex.buildFromDisk()
    const cleanup = new OrphanCleanup({
      client: { app: { log: vi.fn() } } as never,
      projectRoot,
      hierarchyIndex,
      quarantine: new OrphanQuarantine({ trackerRoot }),
    })

    await cleanup.cleanupOrphanDirectories()

    await expect(access(join(rootDir, `${l2ID}.json`))).resolves.toBeUndefined()
    await expect(access(join(trackerRoot, "quarantine", l1ID))).resolves.toBeUndefined()

    const rootIndex = JSON.parse(await readFile(join(rootDir, "session-continuity.json"), "utf-8"))
    expect(rootIndex.hierarchy.children[l1ID].children[l2ID]).toEqual(
      expect.objectContaining({ file: `${l2ID}.json`, depth: 2, delegatedBy: "l2-agent" }),
    )

    const manifest = JSON.parse(await readFile(join(rootDir, "hierarchy-manifest.json"), "utf-8"))
    expect(manifest.children[l2ID]).toEqual(
      expect.objectContaining({
        sessionID: l2ID,
        parentSessionID: l1ID,
        rootMainSessionID: rootID,
        delegationDepth: 2,
        childFile: `${l2ID}.json`,
      }),
    )
  })
})
