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
  const logs: string[] = []

  const logger = {
    debug: async (msg: string) => { logs.push(`DEBUG: ${msg}`) },
    info: async (msg: string) => { logs.push(`INFO: ${msg}`) },
    warn: async (msg: string) => { logs.push(`WARN: ${msg}`) },
    error: async (msg: string) => { logs.push(`ERROR: ${msg}`) },
  }

  try {
    const stateManager = createStateManager(dir, logger)
    const config = createConfig()
    const state = createBrainState("test-session", config)

    // First save creates the file
    await stateManager.save(state)

    // Manually create a stale lock
    const lockPath = join(dir, ".hivemind", "state", "brain.json.lock")
    await writeFile(lockPath, "stale")

    // Set mtime to 6 seconds ago (stale > 5s)
    const staleTimestamp = new Date(Date.now() - 6000)
    await utimes(lockPath, staleTimestamp, staleTimestamp)

    // Next save should detect stale lock, remove it, and proceed
    const updated = {
      ...state,
      metrics: {
        ...state.metrics,
        turn_count: state.metrics.turn_count + 1,
      },
    }
    await stateManager.save(updated)

    // Verify lock is released and warning logged
    assert(!existsSync(lockPath), "stale lock file is removed and lock released")

    const hasLog = logs.some((line) => line.includes("WARN: Removed stale lock file"))
    assert(hasLog, "stale lock recovery emits warning log")

    if (!hasLog) {
      console.log("Logs:", logs)
    }

  } catch (err) {
    console.error(err)
    failed_++
    process.stderr.write(`  FAIL: Exception during test: ${err}\n`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function testAsyncExclusiveLockContract(): void {
  process.stderr.write("\n--- persistence-locking: async exclusive lock contract ---\n")
  const source = readFileSync(join(process.cwd(), "src", "lib", "persistence.ts"), "utf-8")
  // Check for async open
  const hasAsyncOpen = source.includes('await open(this.lockPath, "wx")')
  assert(hasAsyncOpen, "file lock acquisition uses async+exclusive to preserve atomic lock semantics without blocking event loop")
}

async function main() {
  process.stderr.write("=== persistence-locking.test.ts ===\n")
  await testStaleLockRecoveryLogsWarning()
  testAsyncExclusiveLockContract()

  process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
  if (failed_ > 0) process.exit(1)
}

main()
