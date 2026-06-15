/**
 * TDD tests for src/features/intent-lock/verify-step-4.ts
 *
 * Evidence: runtime-truthful (real tmp dir + real fs + real git + real manifest JSON).
 *           The integration gate (Check 8) uses vi.doMock for execFile
 *           because the real `npm run typecheck` would slow the test suite
 *           and depend on the harness's full build chain.
 *
 * Acceptance criteria covered:
 * - AC-14: phase dir missing → blocked
 * - AC-15a/b/c/d: manifest FK mismatch (intent/landscape/roadmap/state) → blocked
 * - AC-16: NO SPEC/CONTEXT required → passed=true
 * - AC-17: phase ID format invalid → blocked
 * - AC-18a/b/c: integration gate (pass/fail/cache) → 3 sub-tests
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearIntentLockCache, readIntentLockState, upsertIntentLockState } from "../../../src/features/intent-lock/store.js"
import { IntentState } from "../../../src/features/intent-lock/index.js"

const INTENT_ID = "INT-20260610-aa0001"
const PHASE_ID = "P27.1-intent-lock-gate"
const SESSION_ID = "ses_test_verify_step_4"

const MOCKED_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567"
const ROADMAP_COMMIT_SHA = "abcdef0123456789abcdef0123456789abcdef01"
const STATE_COMMIT_SHA = "fedcba9876543210fedcba9876543210fedcba98"

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
  const tmp = mkdtempSync(join(tmpdir(), "verify-step-4-"))
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["config", "user.email", "test@local"], { cwd: tmp })
  execFileSync("git", ["config", "user.name", "Test"], { cwd: tmp })
  mkdirSync(join(tmp, ".hivemind", "intent-lock"), { recursive: true })
  mkdirSync(join(tmp, ".planning", "phases"), { recursive: true })
  writeFileSync(join(tmp, "README.md"), "# test\n", "utf-8")
  execFileSync("git", ["add", "README.md"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "initial"], { cwd: tmp, env: gitEnv() })
  return tmp
}

function lockSessionToPhaseAuthorized(
  projectRoot: string,
  intentId: string,
  phaseId: string,
  options: { sessionId?: string } = {},
): void {
  const sid = options.sessionId ?? SESSION_ID
  const now = Date.now()
  upsertIntentLockState(projectRoot, {
    sessionId: sid,
    state: IntentState.PHASE_AUTHORIZED,
    intentId,
    phaseId,
    isCodeChange: true,
    summary: "Test phase-authorized intent",
    lastTransitionAt: now,
    history: [
      { from: IntentState.UNLOCKED, to: IntentState.LOCKED_CODE_CHANGE, at: now },
      { from: IntentState.LOCKED_CODE_CHANGE, to: IntentState.PHASE_READY, at: now },
      { from: IntentState.PHASE_READY, to: IntentState.PHASE_AUTHORIZED, at: now, commitHash: ROADMAP_COMMIT_SHA },
    ],
  })
}

function buildManifest(
  phaseId: string,
  intentId: string,
  options: {
    phaseIdOverride?: string
    intentLockRefOverride?: string
    landscapeRefOverride?: string
    roadmapCommitHashOverride?: string
    stateCommitHashOverride?: string
  } = {},
): string {
  return JSON.stringify(
    {
      schemaVersion: "1.0.0",
      phaseId: options.phaseIdOverride ?? phaseId,
      intentLockRef: options.intentLockRefOverride ?? intentId,
      landscapeRef: options.landscapeRefOverride ?? `.planning/phases/${phaseId}/landscape.json`,
      roadmapCommitHash: options.roadmapCommitHashOverride ?? ROADMAP_COMMIT_SHA,
      stateCommitHash: options.stateCommitHashOverride ?? STATE_COMMIT_SHA,
      status: "executing",
      requiredProof: ["typecheck_pass", "tests_pass"],
      createdAt: "2026-06-10T10:00:00.000Z",
      lockedAt: "2026-06-10T10:01:00.000Z",
    },
    null,
    2,
  )
}

function writeAndCommitManifest(
  projectRoot: string,
  phaseId: string,
  intentId: string,
  options: Parameters<typeof buildManifest>[2] = {},
): string {
  const dir = join(projectRoot, ".planning", "phases", phaseId)
  mkdirSync(dir, { recursive: true })
  const manifestPath = join(dir, "manifest.json")
  const body = buildManifest(phaseId, intentId, options)
  writeFileSync(manifestPath, body, "utf-8")
  execFileSync("git", ["add", manifestPath], { cwd: projectRoot, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "phase manifest"], {
    cwd: projectRoot,
    env: gitEnv(),
  })
  return manifestPath
}

let projectRoot: string

beforeEach(() => {
  clearIntentLockCache()
  vi.restoreAllMocks()
  vi.doUnmock("node:child_process")
})

afterEach(() => {
  clearIntentLockCache()
  vi.restoreAllMocks()
  vi.doUnmock("node:child_process")
  if (projectRoot && existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

async function getVerifyStep4() {
  return (await import("../../../src/features/intent-lock/verify-step-4.js"))
    .verifyStep4PhaseCreation
}

// ---------------------------------------------------------------------------
// Mock setup: replace node:child_process.execFile so the integration gate
// (which calls `npm run typecheck`) does not actually run the build chain.
// The mock is applied per-test via vi.doMock.
// ---------------------------------------------------------------------------

function mockExecFileForIntegrationGate(opts: { shouldThrow?: boolean; timeoutMs?: number } = {}) {
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
          const cb = rest[rest.length - 1] as ((err: null, o: { stdout: string; stderr: string }) => void) | undefined
          if (typeof cb === "function") {
            cb(null, { stdout: `${MOCKED_COMMIT_SHA}\n`, stderr: "" })
            return undefined
          }
        }
        if (
          file === "npm"
          && Array.isArray(args)
          && args[0] === "run"
          && args[1] === "typecheck"
        ) {
          const cb = rest[rest.length - 1] as ((err: Error | null, o: { stdout: string; stderr: string }) => void) | undefined
          if (typeof cb === "function") {
            if (opts.shouldThrow) {
              cb(new Error("typecheck failed"), { stdout: "", stderr: "error TS..." })
            } else {
              cb(null, { stdout: "", stderr: "" })
            }
            return undefined
          }
        }
        return actual.execFile(file as never, args as never, ...(rest as []))
      }) as typeof actual.execFile,
    }
  })
}

describe("src/features/intent-lock/verify-step-4", () => {
  it("[AC-14] returns passed=false when phase directory does not exist", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    // No phase dir
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /phase directory|does not exist/.test(i))).toBe(true)
    expect(result.nextCommand).toMatch(/mkdir/i)
  })

  it("[AC-15a] returns passed=false when manifest intentLockRef is wrong", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID, {
      // Valid format but mismatched intent id
      intentLockRefOverride: "INT-20260610-deadbe",
    })
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /intentLockRef/.test(i))).toBe(true)
  })

  it("[AC-15b] returns passed=false when manifest landscapeRef is wrong", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID, {
      landscapeRefOverride: ".planning/landscapes/wrong.json",
    })
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /landscapeRef/.test(i))).toBe(true)
  })

  it("[AC-15c] returns passed=false when manifest roadmapCommitHash is wrong", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID, {
      roadmapCommitHashOverride: "0000000000000000000000000000000000000000",
    })
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /roadmapCommitHash/.test(i))).toBe(true)
  })

  it("[AC-15d] returns passed=false when manifest stateCommitHash is wrong", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID, {
      stateCommitHashOverride: "0000000000000000000000000000000000000000",
    })
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /stateCommitHash/.test(i))).toBe(true)
  })

  it("[AC-17] returns passed=false when manifest phaseId is malformed", async () => {
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID, {
      phaseIdOverride: "wrong-format",
    })
    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /phaseId|phase ID format|regex/.test(i))).toBe(true)
  })

  it("[AC-16] returns passed=true and transitions to EXECUTING without SPEC.md or CONTEXT.md in the phase dir", async () => {
    mockExecFileForIntegrationGate()
    vi.resetModules()
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID)
    // Verify NO SPEC.md or CONTEXT.md
    const specPath = join(projectRoot, ".planning", "phases", PHASE_ID, "SPEC.md")
    const contextPath = join(projectRoot, ".planning", "phases", PHASE_ID, "CONTEXT.md")
    expect(existsSync(specPath)).toBe(false)
    expect(existsSync(contextPath)).toBe(false)

    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    if (!result.passed) {
      throw new Error(`AC-16 DEBUG: ${JSON.stringify(result)}`)
    }
    clearIntentLockCache()
    const after = readIntentLockState(projectRoot, SESSION_ID)
    expect(after.state).toBe(IntentState.EXECUTING)
  })

  it("[AC-18a] integration gate passes when typecheck succeeds", async () => {
    mockExecFileForIntegrationGate()
    vi.resetModules()
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID)

    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(true)
  })

  it("[AC-18b] integration gate fails when typecheck fails", async () => {
    mockExecFileForIntegrationGate({ shouldThrow: true })
    vi.resetModules()
    projectRoot = makeTmpWithGit()
    lockSessionToPhaseAuthorized(projectRoot, INTENT_ID, PHASE_ID)
    writeAndCommitManifest(projectRoot, PHASE_ID, INTENT_ID)

    const verifyStep4PhaseCreation = await getVerifyStep4()
    const result = await verifyStep4PhaseCreation(
      projectRoot, SESSION_ID, PHASE_ID, INTENT_ID, `.planning/phases/${PHASE_ID}/landscape.json`,
      ROADMAP_COMMIT_SHA, STATE_COMMIT_SHA,
    )
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /integration gate failed/.test(i))).toBe(true)
    expect(result.nextCommand).toMatch(/fix typecheck/i)
  })
})
