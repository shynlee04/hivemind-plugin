/**
 * Persistence Logging Regression Tests
 *
 * Ensures backup failures in withState are observable (non-fatal but logged).
 */

import { mkdtemp, mkdir, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { createStateManager } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId } from "../src/schemas/brain-state.js"
import type { Logger } from "../src/lib/logging.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

async function testWithStateLogsBackupRenameFailure(): Promise<void> {
  process.stderr.write("\n--- persistence-logging: withState backup failure ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-persist-log-"))
  try {
    const logs: string[] = []
    const logger: Logger = {
      debug: async (msg) => { logs.push(`DEBUG: ${msg}`) },
      info: async (msg) => { logs.push(`INFO: ${msg}`) },
      warn: async (msg) => { logs.push(`WARN: ${msg}`) },
      error: async (msg) => { logs.push(`ERROR: ${msg}`) },
    }

    const stateManager = createStateManager(dir, logger)
    const config = createConfig()
    const state = createBrainState(generateSessionId(), config)
    await stateManager.save(state)

    // Force rename(brainPath, bakPath) to fail inside withState:
    // making bakPath an existing directory yields an EISDIR rename error.
    const bakPath = join(dir, ".hivemind", "state", "brain.json.bak")
    await mkdir(bakPath, { recursive: true })

    const updated = await stateManager.withState((current) => ({
      ...current,
      metrics: {
        ...current.metrics,
        turn_count: current.metrics.turn_count + 1,
      },
    }))

    assert(updated !== null, "withState still succeeds despite backup failure")
    assert(
      logs.some((line) => line.includes("ERROR: Failed to create backup")),
      "withState emits error log when backup rename fails",
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testSaveLogsBackupCleanupDeletionFailures(): Promise<void> {
  process.stderr.write("\n--- persistence-logging: backup cleanup deletion failure ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-persist-log-"))
  try {
    const logs: string[] = []
    const logger: Logger = {
      debug: async (msg) => { logs.push(`DEBUG: ${msg}`) },
      info: async (msg) => { logs.push(`INFO: ${msg}`) },
      warn: async (msg) => { logs.push(`WARN: ${msg}`) },
      error: async (msg) => { logs.push(`ERROR: ${msg}`) },
    }

    const stateManager = createStateManager(dir, logger)
    const config = createConfig()
    const state = createBrainState(generateSessionId(), config)
    await stateManager.save(state)

    const brainDir = join(dir, ".hivemind", "state")
    const syntheticBackupNames = [
      "brain.json.bak.2026-02-13T00-00-00",
      "brain.json.bak.2026-02-13T00-00-01",
      "brain.json.bak.2026-02-13T00-00-02",
      "brain.json.bak.2026-02-13T00-00-03",
      "brain.json.bak.2026-02-13T00-00-04",
      "brain.json.bak.2026-02-13T00-00-05",
    ]

    // Force cleanup deletion errors by creating directories with backup-like names.
    // cleanupOldBackups uses unlink(), which fails on directories.
    for (const fileName of syntheticBackupNames) {
      await mkdir(join(brainDir, fileName), { recursive: true })
    }

    const updatedState = {
      ...state,
      metrics: {
        ...state.metrics,
        turn_count: state.metrics.turn_count + 1,
      },
    }
    await stateManager.save(updatedState)

    assert(
      logs.some((line) => line.includes("ERROR: Failed to delete old backup")),
      "save emits error log when old backup deletion fails",
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

process.stderr.write("=== persistence-logging.test.ts ===\n")
await testWithStateLogsBackupRenameFailure()
await testSaveLogsBackupCleanupDeletionFailures()

process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
