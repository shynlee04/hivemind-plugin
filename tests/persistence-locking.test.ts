/**
 * Persistence Locking Regression Tests
 *
 * Ensures stale lock recovery is observable and locking contracts remain safe.
 */

import { existsSync, readFileSync } from "fs"
import { mkdtemp, rm, utimes, writeFile } from "fs/promises"
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

async function testStaleLockRecoveryLogsWarning(): Promise<void> {
  process.stderr.write("\n--- persistence-locking: stale lock recovery logging ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-persist-lock-"))

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

    const lockPath = join(dir, ".hivemind", "state", "brain.json.lock")
    await writeFile(lockPath, "stale")
    const staleTimestamp = new Date(Date.now() - 6_000)
    await utimes(lockPath, staleTimestamp, staleTimestamp)

    const updated = {
      ...state,
      metrics: {
        ...state.metrics,
        turn_count: state.metrics.turn_count + 1,
      },
    }
    await stateManager.save(updated)

    assert(!existsSync(lockPath), "stale lock file is removed and lock released")
    assert(
      logs.some((line) => line.includes("WARN: Removed stale lock file")),
      "stale lock recovery emits warning log",
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function testSyncExclusiveLockContract(): void {
  process.stderr.write("\n--- persistence-locking: sync exclusive lock contract ---\n")
  const source = readFileSync(join(process.cwd(), "src", "lib", "persistence.ts"), "utf-8")
  assert(
    source.includes('openSync(this.lockPath, "wx")'),
    "file lock acquisition remains sync+exclusive to preserve atomic lock semantics",
  )
}

process.stderr.write("=== persistence-locking.test.ts ===\n")
await testStaleLockRecoveryLogsWarning()
testSyncExclusiveLockContract()

process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
