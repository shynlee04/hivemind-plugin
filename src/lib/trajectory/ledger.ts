import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { assertPathWithinRoot } from "../../shared/security/path-scope.js"
import { TRAJECTORY_LEDGER_VERSION, type TrajectoryLedger } from "./types.js"

/**
 * Resolve the canonical trajectory ledger path for a project root.
 *
 * @param projectRoot - Project root that owns `.hivemind/state`.
 * @returns Absolute path to `.hivemind/state/trajectory-ledger.json`.
 *
 * @example
 * ```typescript
 * const ledgerPath = getTrajectoryLedgerPath('/repo')
 * ```
 */
export function getTrajectoryLedgerPath(projectRoot: string): string {
  const stateRoot = resolve(projectRoot, ".hivemind", "state")
  return assertPathWithinRoot(stateRoot, "trajectory-ledger.json", "trajectory ledger")
}

/**
 * Create an empty in-memory trajectory ledger.
 *
 * @param now - Timestamp to stamp onto the new ledger.
 * @returns Empty versioned trajectory ledger.
 */
export function createEmptyTrajectoryLedger(now = Date.now()): TrajectoryLedger {
  return { version: TRAJECTORY_LEDGER_VERSION, updatedAt: now, trajectories: {} }
}

/**
 * Read the trajectory ledger from disk, quarantining corrupt JSON before throwing.
 *
 * @param projectRoot - Project root that owns `.hivemind/state`.
 * @returns Existing ledger or an empty ledger when no ledger exists yet.
 * @throws {Error} When a persisted ledger exists but cannot be parsed or normalized.
 */
export function readTrajectoryLedger(projectRoot: string): TrajectoryLedger {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  if (!existsSync(ledgerPath)) {
    return createEmptyTrajectoryLedger()
  }

  try {
    const parsed = JSON.parse(readFileSync(ledgerPath, "utf-8")) as unknown
    if (!isTrajectoryLedger(parsed)) {
      throw new Error("invalid schema")
    }
    return normalizeTrajectoryLedger(parsed)
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    quarantineCorruptLedger(ledgerPath)
    throw new Error(`[Harness] Failed to parse trajectory ledger: ${message}`)
  }
}

/**
 * Persist a complete trajectory ledger to the canonical `.hivemind/state` path.
 *
 * @param projectRoot - Project root that owns `.hivemind/state`.
 * @param ledger - Ledger to serialize.
 * @returns The persisted ledger path.
 */
export function writeTrajectoryLedger(projectRoot: string, ledger: TrajectoryLedger): string {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf-8")
  return ledgerPath
}

function quarantineCorruptLedger(ledgerPath: string): string {
  const quarantinePath = `${ledgerPath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(ledgerPath, quarantinePath)
  return quarantinePath
}

function isTrajectoryLedger(value: unknown): value is TrajectoryLedger {
  return typeof value === "object" && value !== null
    && (value as { version?: unknown }).version === TRAJECTORY_LEDGER_VERSION
    && typeof (value as { trajectories?: unknown }).trajectories === "object"
    && (value as { trajectories?: unknown }).trajectories !== null
}

function normalizeTrajectoryLedger(ledger: TrajectoryLedger): TrajectoryLedger {
  return {
    version: TRAJECTORY_LEDGER_VERSION,
    updatedAt: typeof ledger.updatedAt === "number" ? ledger.updatedAt : Date.now(),
    trajectories: ledger.trajectories,
  }
}
