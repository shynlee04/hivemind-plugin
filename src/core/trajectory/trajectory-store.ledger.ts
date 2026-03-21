import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type {
  TrajectoryLedger,
  TrajectoryLedgerInspection,
} from './trajectory-types.js'
import {
  TRAJECTORY_LEDGER_VERSION,
  getTrajectoryLedgerPath,
} from './trajectory-store.types.js'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false)
}

function fileExistsSync(filePath: string): boolean {
  return fsSync.existsSync(filePath)
}

// ---------------------------------------------------------------------------
// Ledger lifecycle
// ---------------------------------------------------------------------------

/**
 * Creates a new empty trajectory ledger with default values.
 * @returns An empty TrajectoryLedger
 */
export function createEmptyLedger(): TrajectoryLedger {
  return {
    version: TRAJECTORY_LEDGER_VERSION,
    activeTrajectoryId: null,
    lastClosedTrajectoryId: null,
    trajectories: [],
    checkpoints: [],
    recoveryLog: [],
  }
}

/**
 * Normalizes a ledger by providing defaults for optional fields.
 * @param ledger - The raw ledger from JSON
 * @returns A normalized TrajectoryLedger
 */
export function normalizeLedger(ledger: TrajectoryLedger): TrajectoryLedger {
  return {
    version: ledger.version ?? TRAJECTORY_LEDGER_VERSION,
    activeTrajectoryId: ledger.activeTrajectoryId ?? null,
    lastClosedTrajectoryId: ledger.lastClosedTrajectoryId ?? null,
    trajectories: (ledger.trajectories ?? []).map((trajectory) => ({
      ...trajectory,
      checkpointIds: trajectory.checkpointIds ?? [],
      nextAllowedTransitions: trajectory.nextAllowedTransitions ?? [],
      branchNotes: trajectory.branchNotes ?? [],
    })),
    checkpoints: ledger.checkpoints ?? [],
    recoveryLog: ledger.recoveryLog ?? [],
  }
}

/**
 * Persists the ledger to disk.
 * @param projectRoot - The project root directory
 * @param ledger - The ledger to save
 * @returns The saved ledger
 */
export async function saveTrajectoryLedger(
  projectRoot: string,
  ledger: TrajectoryLedger,
): Promise<TrajectoryLedger> {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true })
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2))
  return ledger
}

// ---------------------------------------------------------------------------
// Load / inspect
// ---------------------------------------------------------------------------

/**
 * Loads the trajectory ledger from disk, or returns an empty ledger if none exists.
 * @param projectRoot - The project root directory
 * @returns The loaded or empty TrajectoryLedger
 */
export async function loadTrajectoryLedger(projectRoot: string): Promise<TrajectoryLedger> {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  if (!(await fileExists(ledgerPath))) {
    return createEmptyLedger()
  }

  try {
    const raw = await fs.readFile(ledgerPath, 'utf-8')
    return normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
  } catch {
    return createEmptyLedger()
  }
}

/**
 * Synchronously loads the trajectory ledger from disk.
 * @param projectRoot - The project root directory
 * @returns The loaded or empty TrajectoryLedger
 */
export function loadTrajectoryLedgerSync(projectRoot: string): TrajectoryLedger {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  if (!fileExistsSync(ledgerPath)) {
    return createEmptyLedger()
  }

  try {
    const raw = fsSync.readFileSync(ledgerPath, 'utf-8')
    return normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
  } catch {
    return createEmptyLedger()
  }
}

/**
 * Inspects the trajectory ledger for existence and health.
 * @param projectRoot - The project root directory
 * @returns A TrajectoryLedgerInspection with health status
 */
export function inspectTrajectoryLedger(projectRoot: string): TrajectoryLedgerInspection {
  const filePath = getTrajectoryLedgerPath(projectRoot)
  if (!fileExistsSync(filePath)) {
    return {
      exists: false,
      healthy: false,
      filePath,
      issues: ['missing-trajectory-ledger'],
    }
  }

  try {
    const raw = fsSync.readFileSync(filePath, 'utf-8')
    const parsed = normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
    if (parsed.version !== TRAJECTORY_LEDGER_VERSION) {
      return {
        exists: true,
        healthy: true,
        filePath,
        issues: ['trajectory-ledger-version-drift'],
      }
    }

    return {
      exists: true,
      healthy: true,
      filePath,
      issues: [],
    }
  } catch {
    return {
      exists: true,
      healthy: false,
      filePath,
      issues: ['corrupt-trajectory-ledger'],
    }
  }
}

/**
 * Ensures a healthy ledger exists, creating one if missing or corrupted.
 * @param projectRoot - The project root directory
 * @returns A healthy TrajectoryLedger
 */
export async function ensureTrajectoryLedger(projectRoot: string): Promise<TrajectoryLedger> {
  const inspection = inspectTrajectoryLedger(projectRoot)
  if (!inspection.exists) {
    return saveTrajectoryLedger(projectRoot, createEmptyLedger())
  }

  if (!inspection.healthy && inspection.issues.includes('corrupt-trajectory-ledger')) {
    return saveTrajectoryLedger(projectRoot, createEmptyLedger())
  }

  return loadTrajectoryLedger(projectRoot)
}
