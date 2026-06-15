/**
 * TDD tests for src/features/intent-lock/verify-step-1.ts
 *
 * Evidence: runtime-truthful (real tmp dir + real fs.existsSync + real git CLI).
 *
 * Acceptance criteria covered:
 * - AC-01: no artifact → blocked with nextCommand=/hm-discuss
 * - AC-02: schema invalid → blocked with issue details
 * - AC-03: no atomic commit → blocked with git command
 * - AC-04: commitHash mismatch → blocked
 * - AC-05: research intent → LOCKED_NON_CODE (uses mock for git SHA determinism)
 * - AC-06: impl intent → LOCKED_CODE_CHANGE (uses mock for git SHA determinism)
 * - AC-07: child session → skip (passed=true, state remains UNLOCKED)
 *
 * Note on AC-05/AC-06: the artifact's `commitHash` field must match the SHA
 * of the commit that introduces the file. Since the SHA depends on the
 * file's content (chicken-and-egg), we mock `execFile` for the specific
 * `git log --format=%H -1 -- <file>` invocation to return a deterministic
 * SHA. The verify function is called with the file's `commitHash` field
 * equal to that mocked SHA, so check 5 passes. This is `transport-mocked`
 * evidence (per the harness's evidence hierarchy) — the implementation is
 * real, only the git CLI output is mocked for the self-referential SHA.
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { Mock } from "vitest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearIntentLockCache, readIntentLockState } from "../../../src/features/intent-lock/store.js"
import { IntentState } from "../../../src/features/intent-lock/index.js"

const SAFE_INTENT_ID = "INT-20260610-aa0001"
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
  const tmp = mkdtempSync(join(tmpdir(), "verify-step-1-"))
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["config", "user.email", "test@local"], { cwd: tmp })
  execFileSync("git", ["config", "user.name", "Test"], { cwd: tmp })
  mkdirSync(join(tmp, ".planning", "intent-locks"), { recursive: true })
  // Create an initial commit so the branch is not empty (git log fails on empty branch).
  writeFileSync(join(tmp, "README.md"), "# test\n", "utf-8")
  execFileSync("git", ["add", "README.md"], { cwd: tmp, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "initial"], { cwd: tmp, env: gitEnv() })
  return tmp
}

function buildIntentLockFrontmatter(
  intentId: string,
  sha: string,
  options: {
    isCodeChange?: boolean
    phaseId?: string
    summary?: string
  } = {},
): string {
  const { isCodeChange = false, phaseId = "P27.2-intent-lock-lifecycle-redesign", summary = "Test summary that satisfies the 20-character minimum length" } = options
  return [
    "---",
    `intentId: "${intentId}"`,
    `phaseId: "${phaseId}"`,
    `sessionId: "ses_test"`,
    `summary: "${summary}"`,
    `isCodeChange: ${isCodeChange}`,
    `allowedSurfaces:`,
    `  - ".planning/**"`,
    `successCriteria:`,
    `  - "criterion one"`,
    `createdAt: 1718000000000`,
    `commitHash: "${sha}"`,
    "---",
    "",
    `# Intent ${intentId}`,
    "",
  ].join("\n")
}

/**
 * Write a valid IntentLock artifact and commit it. The caller is responsible
 * for ensuring the file's `commitHash` field matches what the verify
 * function will see (see `MOCKED_COMMIT_SHA` and the mock setup in AC-05/06).
 */
function writeAndCommitIntentLock(
  projectRoot: string,
  intentId: string,
  options: {
    isCodeChange?: boolean
    phaseId?: string
    summary?: string
    commitHashOverride?: string
  } = {},
): string {
  const filePath = join(projectRoot, ".planning", "intent-locks", `${intentId}.md`)
  const sha = options.commitHashOverride ?? MOCKED_COMMIT_SHA
  const body = buildIntentLockFrontmatter(intentId, sha, options)
  writeFileSync(filePath, body, "utf-8")
  execFileSync("git", ["add", filePath], { cwd: projectRoot, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "intent: frontmatter"], {
    cwd: projectRoot,
    env: gitEnv(),
  })
  return filePath
}

function writeInvalidIntentLock(projectRoot: string, intentId: string): string {
  const filePath = join(projectRoot, ".planning", "intent-locks", `${intentId}.md`)
  const body = [
    "---",
    `intentId: "INT-bad"`, // not matching regex
    `phaseId: "bad-phase-id"`, // not matching phase regex
    `sessionId: "ses_test"`,
    `summary: "summary here at least 20 chars long..."`,
    `isCodeChange: false`,
    `allowedSurfaces:`,
    `  - ".planning/**"`,
    `successCriteria:`,
    `  - "criterion"`,
    `createdAt: "wrong-type-string"`, // should be number
    `commitHash: "0000000000000000000000000000000000000000"`,
    "---",
    "",
  ].join("\n")
  writeFileSync(filePath, body, "utf-8")
  execFileSync("git", ["add", filePath], { cwd: projectRoot, env: gitEnv() })
  execFileSync("git", ["commit", "-q", "-m", "intent bad"], { cwd: projectRoot, env: gitEnv() })
  return filePath
}

let projectRoot: string
const SESSION_ID = "ses_test_verify_step_1"

beforeEach(() => {
  clearIntentLockCache()
  // Reset all spies from previous tests; restoreAllMocks calls .mockRestore()
  // on every spy, which removes the spy entirely (restoring the original).
  vi.restoreAllMocks()
})

afterEach(() => {
  clearIntentLockCache()
  vi.restoreAllMocks()
  if (projectRoot && existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

/**
 * Mock `node:child_process.execFile` to return `MOCKED_COMMIT_SHA` for any
 * `git log --format=%H -1 -- <path>` invocation, leaving other execFile
 * calls untouched.
 *
 * Uses `vi.doMock` (NOT `vi.mock`) so the mock is per-test. Apply via
 * `vi.hoisted` is also possible but `doMock` is clearer here.
 */
function mockExecFileForGitLog() {
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
}

// Per-test dynamic import of verifyStep1IntentLock (to allow vi.doMock to
// affect the promisified execFile).
async function getVerifyStep1() {
  return (await import("../../../src/features/intent-lock/verify-step-1.js"))
    .verifyStep1IntentLock
}

describe("src/features/intent-lock/verify-step-1", () => {
  // AC-01: no artifact at .planning/intent-locks/{intentId}.md
  it("[AC-01] returns passed=false with /hm-discuss nextCommand when artifact missing", async () => {
    projectRoot = makeTmpWithGit()
    const verifyStep1IntentLock = await getVerifyStep1(); const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, SAFE_INTENT_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /artifact not found/i.test(i))).toBe(true)
    expect(result.nextCommand).toBe("/hm-discuss")
  })

  // AC-02: schema invalid (wrong intentId format)
  it("[AC-02] returns passed=false with schema issues when frontmatter is invalid", async () => {
    projectRoot = makeTmpWithGit()
    writeInvalidIntentLock(projectRoot, "INT-bad")
    const verifyStep1IntentLock = await getVerifyStep1(); const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, "INT-bad")
    expect(result.passed).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.some((i: string) => /intentId|regex/i.test(i))).toBe(true)
  })

  // AC-03: no atomic commit
  it("[AC-03] returns passed=false with git add nextCommand when file is uncommitted", async () => {
    projectRoot = makeTmpWithGit()
    const filePath = join(projectRoot, ".planning", "intent-locks", `${SAFE_INTENT_ID}.md`)
    const body = buildIntentLockFrontmatter(SAFE_INTENT_ID, MOCKED_COMMIT_SHA)
    writeFileSync(filePath, body, "utf-8")
    // NOTE: do NOT commit

    const verifyStep1IntentLock = await getVerifyStep1(); const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, SAFE_INTENT_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /no git commit/i.test(i))).toBe(true)
    expect(result.nextCommand).toMatch(/git add/i)
  })

  // AC-04: commitHash mismatch
  it("[AC-04] returns passed=false with commitHash mismatch issue when SHAs differ", async () => {
    projectRoot = makeTmpWithGit()
    writeAndCommitIntentLock(projectRoot, SAFE_INTENT_ID, {
      commitHashOverride: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    })
    const verifyStep1IntentLock = await getVerifyStep1(); const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, SAFE_INTENT_ID)
    expect(result.passed).toBe(false)
    expect(result.issues.some((i: string) => /commitHash mismatch/i.test(i))).toBe(true)
  })

  // AC-05: research intent → LOCKED_NON_CODE
  it("[AC-05] returns passed=true and transitions to LOCKED_NON_CODE for research intent", async () => {
    mockExecFileForGitLog()
    vi.resetModules()
    projectRoot = makeTmpWithGit()
    writeAndCommitIntentLock(projectRoot, SAFE_INTENT_ID, {
      isCodeChange: false,
      summary: "Research intent summary that is at least 20 chars",
    })

    const verifyStep1IntentLock = await getVerifyStep1()
    const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, SAFE_INTENT_ID)
    if (!result.passed) {
      throw new Error(`AC-05 DEBUG: ${JSON.stringify(result)}`)
    }
    expect(result.issues).toEqual([])
    expect(result.nextCommand).toBeUndefined()

    const after = readIntentLockState(projectRoot, SESSION_ID)
    expect(after.state).toBe(IntentState.LOCKED_NON_CODE)
    expect(after.intentId).toBe(SAFE_INTENT_ID)
    expect(after.isCodeChange).toBe(false)
  })

  // AC-06: implementation intent → LOCKED_CODE_CHANGE
  it("[AC-06] returns passed=true and transitions to LOCKED_CODE_CHANGE for implementation intent", async () => {
    mockExecFileForGitLog()
    vi.resetModules()
    projectRoot = makeTmpWithGit()
    writeAndCommitIntentLock(projectRoot, SAFE_INTENT_ID, {
      isCodeChange: true,
      summary: "Implement feature X for the gate; needs many chars.",
    })

    const verifyStep1IntentLock = await getVerifyStep1()
    const result = await verifyStep1IntentLock(projectRoot, SESSION_ID, SAFE_INTENT_ID)
    if (!result.passed) {
      throw new Error(`AC-06 DEBUG: ${JSON.stringify(result)}`)
    }

    const after = readIntentLockState(projectRoot, SESSION_ID)
    expect(after.state).toBe(IntentState.LOCKED_CODE_CHANGE)
    expect(after.intentId).toBe(SAFE_INTENT_ID)
    expect(after.isCodeChange).toBe(true)
  })

  // AC-07: child session sentinel → skip
  it("[AC-07] returns passed=true with skipped flag for child session sentinel and does not mutate state", async () => {
    projectRoot = makeTmpWithGit()
    const before = readIntentLockState(projectRoot, SESSION_ID)
    expect(before.state).toBe(IntentState.UNLOCKED)

    const verifyStep1IntentLock = await getVerifyStep1(); const result = await verifyStep1IntentLock(projectRoot, "__test_child__", SAFE_INTENT_ID)
    expect(result.passed).toBe(true)
    expect(result.skipped).toBe("caller_must_classify")

    const after = readIntentLockState(projectRoot, SESSION_ID)
    expect(after.state).toBe(IntentState.UNLOCKED)
  })
})
