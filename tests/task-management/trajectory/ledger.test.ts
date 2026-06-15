import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createEmptyTrajectoryLedger,
  getTrajectoryLedgerPath,
  readTrajectoryLedger,
  writeTrajectoryLedger,
} from "../../../src/task-management/trajectory/ledger.js"

import { TRAJECTORY_LEDGER_VERSION } from "../../../src/task-management/trajectory/types.js"

describe("trajectory ledger", () => {
  let root: string

  beforeEach(() => {
    root = join(tmpdir(), `trajectory-ledger-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(root, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("getTrajectoryLedgerPath returns .hivemind/state/trajectory-ledger.json", () => {
    const path = getTrajectoryLedgerPath(root)
    expect(path).toBe(resolve(root, ".hivemind", "state", "trajectory-ledger.json"))
  })

  it("createEmptyTrajectoryLedger returns version 1, empty trajectories, current timestamp", () => {
    const before = Date.now()
    const ledger = createEmptyTrajectoryLedger()
    const after = Date.now()

    expect(ledger.version).toBe(TRAJECTORY_LEDGER_VERSION)
    expect(ledger.trajectories).toEqual({})
    expect(ledger.updatedAt).toBeGreaterThanOrEqual(before)
    expect(ledger.updatedAt).toBeLessThanOrEqual(after)
  })

  it("readTrajectoryLedger returns empty ledger when file doesn't exist", () => {
    const ledger = readTrajectoryLedger(root)
    expect(ledger.version).toBe(TRAJECTORY_LEDGER_VERSION)
    expect(ledger.trajectories).toEqual({})
  })

  it("writeTrajectoryLedger creates file and returns path", () => {
    const ledger = createEmptyTrajectoryLedger()
    const path = writeTrajectoryLedger(root, ledger)

    expect(existsSync(path)).toBe(true)
    expect(path).toContain("trajectory-ledger.json")
  })

  it("readTrajectoryLedger after write returns same data", () => {
    const ledger = createEmptyTrajectoryLedger()
    ledger.trajectories["test-id"] = {
      id: "test-id",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: ["ref-1"],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    writeTrajectoryLedger(root, ledger)
    const readBack = readTrajectoryLedger(root)

    expect(readBack.version).toBe(ledger.version)
    expect(readBack.trajectories["test-id"]!.id).toBe("test-id")
    expect(readBack.trajectories["test-id"]!.evidenceRefs).toEqual(["ref-1"])
  })

  it("readTrajectoryLedger throws on corrupt JSON", () => {
    const ledgerPath = getTrajectoryLedgerPath(root)
    mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
    writeFileSync(ledgerPath, "not valid json {{{", "utf-8")

    expect(() => readTrajectoryLedger(root)).toThrow("[Hivemind] Failed to parse trajectory ledger")
  })

  it("readTrajectoryLedger quarantines corrupt file before throwing", () => {
    const ledgerPath = getTrajectoryLedgerPath(root)
    mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
    writeFileSync(ledgerPath, "corrupt data", "utf-8")

    try {
      readTrajectoryLedger(root)
    } catch {
      // Expected to throw
    }

    // Original file should be renamed (quarantined)
    expect(existsSync(ledgerPath)).toBe(false)
    // A .corrupt- file should exist
    const stateDir = resolve(ledgerPath, "..")
    const files = require("node:fs").readdirSync(stateDir) as string[]
    const corruptFile = files.find((f: string) => f.includes(".corrupt-"))
    expect(corruptFile).toBeDefined()
  })

  it("readTrajectoryLedger normalizes missing updatedAt", () => {
    const ledgerPath = getTrajectoryLedgerPath(root)
    mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
    writeFileSync(ledgerPath, JSON.stringify({ version: TRAJECTORY_LEDGER_VERSION, trajectories: {} }), "utf-8")

    const ledger = readTrajectoryLedger(root)
    expect(typeof ledger.updatedAt).toBe("number")
    expect(ledger.updatedAt).toBeGreaterThan(0)
  })

  it("persists phase-level trajectory with traj-phase-{N} ID format", () => {
    const ledger = createEmptyTrajectoryLedger()
    ledger.trajectories["traj-phase-25.5"] = {
      id: "traj-phase-25.5",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeTrajectoryLedger(root, ledger)
    const readBack = readTrajectoryLedger(root)
    expect(readBack.trajectories["traj-phase-25.5"]).toBeDefined()
    expect(readBack.trajectories["traj-phase-25.5"]!.status).toBe("planning")
  })

  it("handles jump links in delegation:{childSessionID} format", () => {
    const ledger = createEmptyTrajectoryLedger()
    ledger.trajectories["traj-phase-25.5"] = {
      id: "traj-phase-25.5",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: ["delegation:ses_child_123"],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeTrajectoryLedger(root, ledger)
    const readBack = readTrajectoryLedger(root)
    const refs = readBack.trajectories["traj-phase-25.5"]!.evidenceRefs
    expect(refs).toContain("delegation:ses_child_123")
    expect(refs[0]).toMatch(/^delegation:/)
  })
})
