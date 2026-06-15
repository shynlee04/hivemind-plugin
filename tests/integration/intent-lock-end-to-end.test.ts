/**
 * End-to-end integration test for the intent-lock gate.
 *
 * Walks the full UNLOCKED → EXECUTING flow using real FS + git, proving
 * all 4 verify-step functions, the store, the state machine, and the
 * tool resolver work together.
 *
 * Evidence label: runtime-truthful — real tmp dir + real git + real FS.
 * Step 1 uses transport-mocked git SHA (chicken-and-egg per verify-step-1 tests).
 * Test size: large — multi-step setup with real git operations.
 *
 * Uses `vi.doMock("node:child_process")` to intercept the async `execFile`
 * call that verify-step-1 uses for `git log --format=%H`. The mock returns
 * a deterministic SHA so the artifact's `commitHash` field matches check 5.
 * All other `execFile` calls (used by the test helper `git()`) go through
 * the real implementation via `execFileSync`.
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { IntentState, clearIntentLockCache, readIntentLockState } from "../../src/features/intent-lock/index.js"
import { resolveToolPermission } from "../../src/features/intent-lock/tool-resolver.js"
import { verifyStep2TrajectoryLandscape } from "../../src/features/intent-lock/verify-step-2.js"
import { verifyStep3RoadmapState } from "../../src/features/intent-lock/verify-step-3.js"
import { verifyStep4PhaseCreation } from "../../src/features/intent-lock/verify-step-4.js"

const SESSION_ID = "ses_e2e"
const INTENT_ID = "INT-20260609-e2e001"
const PHASE_ID = "P27.1-test"
const MOCKED_COMMIT_SHA = "aaaa0000bbbb1111cccc2222dddd3333eeee4444"

function gitEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_AUTHOR_NAME: "T",
    GIT_AUTHOR_EMAIL: "t@t.local",
    GIT_COMMITTER_NAME: "T",
    GIT_COMMITTER_EMAIL: "t@t.local",
  }
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, env: gitEnv(), encoding: "utf-8" }).trim()
}

/** Dynamic import of verifyStep1IntentLock — must be called AFTER vi.doMock. */
async function getVerifyStep1() {
  return (await import("../../src/features/intent-lock/verify-step-1.js")).verifyStep1IntentLock
}

/** Mock `execFile` to return MOCKED_COMMIT_SHA for git-log-SHA queries. */
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
          const callback = rest[rest.length - 1] as
            | ((err: null, out: { stdout: string; stderr: string }) => void)
            | undefined
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

let tmpRoot: string | undefined

afterEach(() => {
  vi.doUnmock("node:child_process")
  if (tmpRoot) {
    clearIntentLockCache()
    rmSync(tmpRoot, { recursive: true, force: true })
    tmpRoot = undefined
  }
})

describe("intent-lock end-to-end", () => {
  it("walks the full UNLOCKED → EXECUTING flow on a real tmp project", async () => {
    // ── Mock execFile for the git-log SHA chicken-and-egg ──
    mockExecFileForGitLog()
    const verifyStep1IntentLock = await getVerifyStep1()

    // ── Setup: tmp dir + git init + directory structure ──
    tmpRoot = mkdtempSync(join(tmpdir(), "intent-lock-e2e-"))
    git(["init", "-q", "-b", "main"], tmpRoot)
    git(["config", "user.email", "test@local"], tmpRoot)
    git(["config", "user.name", "Test"], tmpRoot)

    mkdirSync(join(tmpRoot, ".hivemind", "intent-lock"), { recursive: true })
    mkdirSync(join(tmpRoot, ".hivemind", "state"), { recursive: true })
    mkdirSync(join(tmpRoot, ".planning", "intent-locks"), { recursive: true })
    mkdirSync(join(tmpRoot, ".planning", "phases", PHASE_ID), { recursive: true })

    // Initial commit so branch is not empty
    writeFileSync(join(tmpRoot, "README.md"), "# test\n", "utf-8")
    // Minimal package.json + tsconfig.json so Check 8 (npm run typecheck) passes
    writeFileSync(join(tmpRoot, "package.json"), JSON.stringify({
      name: "intent-lock-e2e-fixture",
      scripts: { typecheck: "echo ok" },
    }, null, 2), "utf-8")
    writeFileSync(join(tmpRoot, "tsconfig.json"), JSON.stringify({
      compilerOptions: { strict: true, noEmit: true },
      include: [],
    }, null, 2), "utf-8")
    git(["add", "README.md", "package.json", "tsconfig.json"], tmpRoot)
    git(["commit", "-q", "-m", "initial"], tmpRoot)

    // ── Step 1: Intent Lock artifact ──
    // Use MOCKED_COMMIT_SHA for the commitHash field (mock returns this for git log)
    const intentArtifact = join(tmpRoot, ".planning", "intent-locks", `${INTENT_ID}.md`)
    writeFileSync(intentArtifact, [
      "---",
      "schemaVersion: \"1.0.0\"",
      `intentId: "${INTENT_ID}"`,
      `sessionId: "${SESSION_ID}"`,
      "purpose: implementation",
      "isCodeChange: true",
      "summary: \"E2E integration test — full 4-step intent-lock flow verification\"",
      `allowedSurfaces: ["src/", "tests/"]`,
      "dependencies: []",
      `successCriteria: ["All 4 verify steps pass", "Tool resolver allows write in EXECUTING"]`,
      `createdAt: ${Date.now()}`,
      `commitHash: "${MOCKED_COMMIT_SHA}"`,
      `phaseId: "${PHASE_ID}"`,
      "---",
      "",
      "# Intent Lock Artifact",
      "",
      "Test intent for E2E integration test verifying full 4-step flow.",
    ].join("\n"), "utf-8")
    git(["add", `.planning/intent-locks/${INTENT_ID}.md`], tmpRoot)
    git(["commit", "-q", "-m", "intent lock artifact"], tmpRoot)

    const step1 = await verifyStep1IntentLock(tmpRoot, SESSION_ID)
    expect(step1.passed).toBe(true)

    const state1 = readIntentLockState(tmpRoot, SESSION_ID)
    expect(state1?.state).toBe(IntentState.LOCKED_CODE_CHANGE)

    // ── Step 2: Trajectory + Landscape ──
    // Create trajectory-ledger.json with TRAJECTORY_INIT event
    // verify-step-2 reads .hivemind/state/trajectory-ledger.json (TrajectoryLedger format)
    const now = Date.now()
    const trajectoryLedger = {
      version: 1,
      updatedAt: now,
      trajectories: {
        "traj-phase-test": {
          id: "traj-phase-test",
          rootSessionId: SESSION_ID,
          sessionId: SESSION_ID,
          parentTrajectoryId: null,
          status: "active",
          evidenceRefs: [],
          checkpoints: [],
          events: [
            {
              eventId: "evt-init-001",
              eventType: "TRAJECTORY_INIT",
              summary: "Phase trajectory init for E2E test",
              evidenceRefs: [`intent-lock:${INTENT_ID}`],
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      },
    }
    writeFileSync(join(tmpRoot, ".hivemind/state/trajectory-ledger.json"), JSON.stringify(trajectoryLedger, null, 2), "utf-8")

    // Create landscape.json matching LandscapeSchema
    const landscape = {
      schemaVersion: "1.0.0",
      phaseId: PHASE_ID,
      intentLockRef: INTENT_ID,
      scope: {
        filesAffected: ["src/foo.ts"],
        modulesTouched: ["intent-lock"],
      },
      risks: [
        { severity: "low" as const, description: "E2E test risk", mitigation: "None needed" },
      ],
      estimatedEffort: "trivial" as const,
      createdAt: new Date().toISOString(),
      commitHash: MOCKED_COMMIT_SHA,
    }
    writeFileSync(join(tmpRoot, `.planning/phases/${PHASE_ID}/landscape.json`), JSON.stringify(landscape, null, 2), "utf-8")
    git(["add", `.planning/phases/${PHASE_ID}/landscape.json`], tmpRoot)
    git(["commit", "-q", "-m", "landscape artifact"], tmpRoot)

    const step2 = await verifyStep2TrajectoryLandscape(tmpRoot, SESSION_ID, INTENT_ID, PHASE_ID)
    expect(step2.passed).toBe(true)

    const state2 = readIntentLockState(tmpRoot, SESSION_ID)
    expect(state2?.state).toBe(IntentState.PHASE_READY)

    // ── Step 3: ROADMAP + STATE ──
    // verify-step-3 expects checkbox format: `- [ ] **<phaseId>** (Name) [intent: <id>]`
    const roadmap = [
      "# Roadmap",
      "",
      "## Active Milestone",
      "",
      `- [ ] **${PHASE_ID}** (E2E test phase) [intent: ${INTENT_ID}]`,
    ].join("\n")
    writeFileSync(join(tmpRoot, ".planning/ROADMAP.md"), roadmap, "utf-8")

    // STATE.md must contain `**Active phase:** <phaseId>`
    const stateMd = [
      "# State",
      "",
      `**Active phase:** ${PHASE_ID}`,
      "",
      "## Progress",
      "",
      "Overall: 0%",
    ].join("\n")
    writeFileSync(join(tmpRoot, ".planning/STATE.md"), stateMd, "utf-8")

    git(["add", ".planning/ROADMAP.md", ".planning/STATE.md"], tmpRoot)
    git(["commit", "-q", "-m", "roadmap + state sync"], tmpRoot)
    // Note: step 4's verify uses execFile (mocked) for SHA checks, so we
    // use MOCKED_COMMIT_SHA for the manifest and for the step-4 parameters.
    // The actual commit SHA from execFileSync is not used by verify-step-4.

    const step3 = await verifyStep3RoadmapState(tmpRoot, SESSION_ID, PHASE_ID, INTENT_ID)
    expect(step3.passed).toBe(true)

    const state3 = readIntentLockState(tmpRoot, SESSION_ID)
    expect(state3?.state).toBe(IntentState.PHASE_AUTHORIZED)

    // ── Step 4: Phase Manifest ──
    // PhaseManifestSchema requires status, requiredProof, createdAt
    const manifest = {
      schemaVersion: "1.0.0",
      phaseId: PHASE_ID,
      intentLockRef: INTENT_ID,
      landscapeRef: `.planning/phases/${PHASE_ID}/landscape.json`,
      roadmapCommitHash: MOCKED_COMMIT_SHA,
      stateCommitHash: MOCKED_COMMIT_SHA,
      status: "planned",
      requiredProof: [],
      createdAt: new Date().toISOString(),
    }
    writeFileSync(join(tmpRoot, `.planning/phases/${PHASE_ID}/manifest.json`), JSON.stringify(manifest, null, 2), "utf-8")
    git(["add", `.planning/phases/${PHASE_ID}/manifest.json`], tmpRoot)
    git(["commit", "-q", "-m", "phase manifest"], tmpRoot)

    const step4 = await verifyStep4PhaseCreation(
      tmpRoot, SESSION_ID, PHASE_ID, INTENT_ID,
      `.planning/phases/${PHASE_ID}/landscape.json`,
      MOCKED_COMMIT_SHA, MOCKED_COMMIT_SHA,
    )
    expect(step4.passed).toBe(true)

    const state4 = readIntentLockState(tmpRoot, SESSION_ID)
    expect(state4?.state).toBe(IntentState.EXECUTING)

    // ── Post-flow: Tool resolver allows write ──
    const decision = await resolveToolPermission(
      "write",
      { filePath: "/src/foo.ts" },
      {
        sessionId: SESSION_ID,
        projectRoot: tmpRoot,
        classificationKind: "root",
        intentLockState: readIntentLockState(tmpRoot, SESSION_ID),
      },
    )
    expect(decision.allowed).toBe(true)
  })
})
