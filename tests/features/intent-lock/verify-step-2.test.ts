/**
 * TDD tests for src/features/intent-lock/verify-step-2.ts
 *
 * Evidence: runtime-truthful (real tmp dir + real fs + real git + real ledger JSON).
 *
 * Acceptance criteria covered:
 * - AC-08a: state precondition fail (UNLOCKED)
 * - AC-08b: no TRAJECTORY_INIT event in trajectory ledger
 * - AC-08c: trajectory intentLockRef FK mismatch
 * - AC-08d: landscape.json missing
 * - AC-08e: landscape schema invalid (phaseId format)
 * - AC-08f: no atomic commit for landscape.json
 * - AC-09: full success → state becomes PHASE_READY with phaseId set
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearIntentLockCache, readIntentLockState, upsertIntentLockState } from "../../../src/features/intent-lock/store.js"
import { lockIntentCodeChange } from "../../../src/features/intent-lock/state-machine.js"
import { IntentState } from "../../../src/features/intent-lock/index.js"

const INTENT_ID = "INT-20260610-aa0001"
const PHASE_ID = "P27.1-intent-lock-gate"
const SESSION_ID = "ses_test_verify_step_2"

const MOCKED_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567"

function gitEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_AUTHOR_NAME: "T",
    GIT_AUTHOR_EMAIL: "t@t.local",
    GIT_COMMITTER_NAME: "T",
    GIT_COMMITTER_EMAIL: "t@t.local",
  }
}

function makeTmpWithGit(): string {
  const tmp = mkdtempSync(join(tmpdir(), "verify-step-2-"))
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["config", "user.email", "test@local"], { cwd: tmp })
  execFileSync("git", ["config", "user.name", "Test"], { cwd: tmp })
  mkdirSync(join(tmp, ".planning", "phases", PHASE_ID), { recursive: true })
  mkdirSync(join(tmp, ".hivemind", "state"), { recursive: true })
  writeFileSync(join(tmp, "README.md"), "# test\n", "utf-8")
  execFileSync("git", ["add", "README.md"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "initial"], { cwd: tmp, env: gitEnv() })
  return tmp
}

/**
 * Lock the session in LOCKED_CODE_CHANGE state (precondition for step 2).
 * Returns the projectRoot (caller passes it to verifyStep2).
 */
function lockSessionToCodeChange(projectRoot: string, intentId: string): void {
  // Use the store to upsert a LOCKED_CODE_CHANGE state directly.
  const now = Date.now()
  upsertIntentLockState(projectRoot, {
    sessionId: SESSION_ID,
    state: IntentState.LOCKED_CODE_CHANGE,
    intentId,
    isCodeChange: true,
    summary: "Test code-change intent",
    lastTransitionAt: now,
    history: [
      { from: IntentState.UNLOCKED, to: IntentState.LOCKED_CODE_CHANGE, at: now },
    ],
  })
}

/**
 * Write a TRAJECTORY_INIT event to .hivemind/state/trajectory-ledger.json
 * and commit it. The event includes an evidenceRef of the form
 * `intent-lock:<intentId>` so the FK check in Check 3 can match.
 */
function writeTrajectoryInit(projectRoot: string, intentId: string, options: { intentIdOverride?: string } = {}): void {
  const refIntentId = options.intentIdOverride ?? intentId
  const ledger = {
    version: 1,
    updatedAt: Date.now(),
    trajectories: {
      "traj-phase-27.1": {
        id: "traj-phase-27.1",
        rootSessionId: SESSION_ID,
        sessionId: null,
        parentTrajectoryId: null,
        status: "planning",
        evidenceRefs: [`intent-lock:${refIntentId}`],
        checkpoints: [],
        events: [
          {
            id: "evt-1",
            eventType: "TRAJECTORY_INIT",
            summary: `Phase ${PHASE_ID} landscape created`,
            at: Date.now(),
            evidenceRefs: [`intent-lock:${refIntentId}`],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  }
  const path = join(projectRoot, ".hivemind", "state", "trajectory-ledger.json")
  writeFileSync(path, JSON.stringify(ledger, null, 2), "utf-8")
  execFileSync("git", ["add", path], { cwd: projectRoot, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "trajectory init"], {
    cwd: projectRoot,
    env: gitEnv(),
  })
}

function buildLandscape(phaseId: string, intentId: string, commitHash: string): string {
  return JSON.stringify(
    {
      schemaVersion: "1.0.0",
      phaseId,
      intentLockRef: intentId,
      scope: {
        filesAffected: ["src/features/intent-lock/verify-step-2.ts"],
        modulesTouched: ["features/intent-lock"],
      },
      risks: [
        {
          severity: "low",
          description: "small risk",
          mitigation: "covered by tests",
        },
      ],
      estimatedEffort: "small",
      createdAt: "2026-06-10T10:00:00.000Z",
      commitHash,
    },
    null,
    2,
  )
}

function writeAndCommitLandscape(
  projectRoot: string,
  phaseId: string,
  intentId: string,
  options: { commitHashOverride?: string; phaseIdOverride?: string; skipCommit?: boolean } = {},
): string {
  const effectivePhaseId = options.phaseIdOverride ?? phaseId
  const commitHash = options.commitHashOverride ?? MOCKED_COMMIT_SHA
  const path = join(projectRoot, ".planning", "phases", phaseId, "landscape.json")
  // writeFileSync also creates the parent dir (recursive mkdir) via Node's
  // own writeFile which throws on missing parent — so mkdirSync first.
  mkdirSync(join(projectRoot, ".planning", "phases", phaseId), { recursive: true })
  const body = buildLandscape(effectivePhaseId, intentId, commitHash)
  writeFileSync(path, body, "utf-8")
  if (!options.skipCommit) {
    execFileSync("git", ["add", path], { cwd: projectRoot, env: gitEnv() })
    execFileSync("git", ["commit", "-q", "-m", "landscape"], {
      cwd: projectRoot,
      env: gitEnv(),
    })
  }
  return path
}

let projectRoot: string

beforeEach(() => {
  clearIntentLockCache()
  vi.restoreAllMocks()
})

afterEach(() => {
  clearIntentLockCache()
  vi.restoreAllMocks()
  if (projectRoot && existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

// Dynamic import for vi.resetModules compatibility
async function getVerifyStep2() {
  return (await import("../../../src/features/intent-lock/verify-step-2.js"))
    .verifyStep2TrajectoryLandscape
}

describe("src/features/intent-lock/verify-step-2", () => {
  // AC-08a: state precondition fail
  it("[AC-08a] returns passed=false with state precondition issue when not LOCKED_CODE_CHANGE", async () => {
    projectRoot = makeTmpWithGit()
    // No state setup → state is UNLOCKED
    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /state must be LOCKED_CODE_CHANGE/.test(i))).toBe(true)
  })

  // AC-08b: no TRAJECTORY_INIT
  it("[AC-08b] returns passed=false with TRAJECTORY_INIT issue when ledger is empty", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    // No trajectory ledger written
    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /TRAJECTORY_INIT/.test(i))).toBe(true)
    expect(result.nextCommand).toMatch(/hivemind-trajectory/i)
  })

  // AC-08c: trajectory FK mismatch
  it("[AC-08c] returns passed=false with intentLockRef FK issue when ledger refs wrong intent", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    writeTrajectoryInit(projectRoot, INTENT_ID, { intentIdOverride: "INT-OTHER123456-zzzzzz" })
    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /intentLockRef|INT-OTHER123456-zzzzzz/.test(i))).toBe(true)
  })

  // AC-08d: landscape.json missing
  it("[AC-08d] returns passed=false with landscape.json missing issue when trajectory OK but no file", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    writeTrajectoryInit(projectRoot, INTENT_ID)
    // No landscape.json
    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /landscape.json not found/.test(i))).toBe(true)
  })

  // AC-08e: landscape schema invalid
  it("[AC-08e] returns passed=false with schema issues when landscape phaseId is malformed", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    writeTrajectoryInit(projectRoot, INTENT_ID)
    writeAndCommitLandscape(projectRoot, PHASE_ID, INTENT_ID, {
      phaseIdOverride: "XX-test", // invalid format
    })
    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /phaseId|regex/.test(i))).toBe(true)
  })

  // AC-08f: no atomic commit for landscape
  it("[AC-08f] returns passed=false with git add nextCommand when landscape uncommitted", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    writeTrajectoryInit(projectRoot, INTENT_ID)
    // Write landscape but DO NOT commit it.
    writeAndCommitLandscape(projectRoot, PHASE_ID, INTENT_ID, { skipCommit: true })

    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    if (result.passed) {
      throw new Error(`AC-08f DEBUG: ${JSON.stringify(result)}`)
    }
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /no git commit|landscape/.test(i))).toBe(true)
    expect(result.nextCommand).toMatch(/git add/i)
  })

  // AC-09: full success → PHASE_READY
  it("[AC-09] returns passed=true and transitions to PHASE_READY with phaseId set on full success", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToCodeChange(projectRoot, INTENT_ID)
    writeTrajectoryInit(projectRoot, INTENT_ID)
    writeAndCommitLandscape(projectRoot, PHASE_ID, INTENT_ID)

    // Mock execFile for self-referential SHA determinism
    vi.doMock("node:child_process", async () => {
      const actual = await vi.importActual<typeof import("node:child_process")>("node:child_process")
      return {
        ...actual,
        execFile: ((file: string, args: readonly string[] | undefined, ...rest: unknown[]) => {
          if (
            file === "git"
            && Array.isArray(args)
            && args[0] === "log"
            && args.includes("--format=%H")
          ) {
            const callback = rest[rest.length - 1] as ((err: null, out: { stdout: string; stderr: string }) => void) | undefined
            if (typeof callback === "function") {
              callback(null, { stdout: `${MOCKED_COMMIT_SHA}\n`, stderr: "" })
              return undefined
            }
          }
          return actual.execFile(file as never, args as never, ...(rest as []))
        }) as typeof actual.execFile,
      }
    })
    vi.resetModules()

    const verifyStep2TrajectoryLandscape = await getVerifyStep2()
    const result = await verifyStep2TrajectoryLandscape(projectRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    if (!result.passed) {
      throw new Error(`AC-09 DEBUG: ${JSON.stringify(result)}`)
    }
    void result

    // Re-read after clearIntentLockCache to ensure we see the latest persisted state.
    clearIntentLockCache()
    const after = readIntentLockState(projectRoot, SESSION_ID)
    if (after.state !== IntentState.PHASE_READY) {
      throw new Error(`AC-09 after.state = ${after.state} expected PHASE_READY; history=${JSON.stringify(after.history)}`)
    }
    expect(after.state).toBe(IntentState.PHASE_READY)
    expect(after.phaseId).toBe(PHASE_ID)
  })
})

// Suppress unused import warning
void lockIntentCodeChange
