/**
 * Intent-lock gate — Step 2 verifier.
 *
 * Performs the 6 SPEC §5.3 checks on the trajectory ledger + landscape
 * artifact, and on success transitions the session from `LOCKED_CODE_CHANGE`
 * to `PHASE_READY`. The transition is delegated to `state-machine.ts`;
 * persistence goes through the dual-layer store.
 *
 * @see 27.1-SPEC.md §5.3
 */

import { execFile } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

import { z } from "zod"

import { LandscapeSchema } from "../../schema-kernel/landscape.schema.js"
import type { StepVerification } from "../../schema-kernel/intent-lock.schema.js"
import { readIntentLockState, upsertIntentLockState } from "./store.js"
import { transitionToPhaseReady } from "./state-machine.js"
import { IntentState } from "./types.js"

const execFileAsync = promisify(execFile)

// Minimal TrajectoryEvent shape — keep this verifier decoupled from the
// full trajectory module (plan: read trajectory.json directly).
const TrajectoryEventSchema = z.object({
  eventType: z.string(),
  evidenceRefs: z.array(z.string()).optional(),
})
const TrajectoryRecordSchema = z.object({
  events: z.array(TrajectoryEventSchema).default([]),
  evidenceRefs: z.array(z.string()).default([]),
})
const TrajectoryLedgerSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).optional(),
  trajectories: z.record(z.string(), TrajectoryRecordSchema).default({}),
})

/**
 * Step 2 verifier: 6 SPEC §5.3 checks + state transition.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Root session ID.
 * @param intentId - The intent identifier locked in Step 1.
 * @param phaseId - The phase identifier for the landscape.
 */
export async function verifyStep2TrajectoryLandscape(
  projectRoot: string,
  sessionId: string,
  intentId: string,
  phaseId: string,
): Promise<StepVerification> {
  // Check 1: state precondition
  const currentState = readIntentLockState(projectRoot, sessionId)
  if (currentState.state !== IntentState.LOCKED_CODE_CHANGE) {
    return fail(
      `state must be LOCKED_CODE_CHANGE, got ${currentState.state}`,
      "complete step 1 first (lock intent for code change)",
    )
  }

  // Check 2: TRAJECTORY_INIT event exists
  const initResult = readTrajectoryInit(projectRoot, phaseId, intentId)
  if (!initResult.ok) return initResult.verification

  // Check 4: landscape.json exists
  const landscapePath = resolve(projectRoot, ".planning", "phases", phaseId, "landscape.json")
  if (!existsSync(landscapePath)) {
    return fail(`landscape.json not found at ${landscapePath}`,
      `create landscape.json per LandscapeSchema at .planning/phases/${phaseId}/landscape.json`)
  }

  // Check 5: landscape schema parse
  const landscapeParse = readAndParseLandscape(landscapePath)
  if (!landscapeParse.ok) return landscapeParse.verification
  void landscapeParse.data // (downstream consumers will read via store/state)

  // Check 6: atomic git commit for landscape
  const relativeLandscapePath = `.planning/phases/${phaseId}/landscape.json`
  const commitResult = await getLastCommitSha(projectRoot, relativeLandscapePath)
  if (!commitResult.sha) {
    return fail(`no git commit for ${relativeLandscapePath}`,
      `git add ${relativeLandscapePath} && git commit -m 'landscape: ${phaseId}'`)
  }

  // All 6 checks passed — transition and persist
  const next = transitionToPhaseReady(currentState, phaseId, commitResult.sha)
  upsertIntentLockState(projectRoot, next)
  return { passed: true, issues: [], nextCommand: undefined, alternatives: [] }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fail(issue: string, nextCommand: string): StepVerification {
  return { passed: false, issues: [issue], nextCommand, alternatives: [] }
}

/**
 * Read the trajectory ledger and find a TRAJECTORY_INIT event whose
 * evidenceRefs include `intent-lock:<intentId>`. Returns a discriminated
 * `StepVerification` so the caller can early-return on failure.
 */
function readTrajectoryInit(
  projectRoot: string,
  phaseId: string,
  intentId: string,
): { ok: true; trajectoryId: string } | { ok: false; verification: StepVerification } {
  const path = resolve(projectRoot, ".hivemind", "state", "trajectory-ledger.json")
  if (!existsSync(path)) {
    return {
      ok: false,
      verification: fail(
        `no TRAJECTORY_INIT event for ${phaseId}: trajectory ledger missing at ${path}`,
        `hivemind-trajectory event TRAJECTORY_INIT --phase ${phaseId} --evidence-ref intent-lock:${intentId}`,
      ),
    }
  }
  let ledger: z.infer<typeof TrajectoryLedgerSchema>
  try {
    const parsed = TrajectoryLedgerSchema.safeParse(JSON.parse(readFileSync(path, "utf-8")))
    if (!parsed.success) {
      return {
        ok: false,
        verification: fail(
          `trajectory ledger parse failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          "regenerate .hivemind/state/trajectory-ledger.json via hivemind-trajectory",
        ),
      }
    }
    ledger = parsed.data
  } catch (e) {
    return {
      ok: false,
      verification: fail(
        `trajectory ledger read failed: ${e instanceof Error ? e.message : String(e)}`,
        "fix .hivemind/state/trajectory-ledger.json",
      ),
    }
  }
  for (const [trajectoryId, traj] of Object.entries(ledger.trajectories)) {
    for (const event of traj.events) {
      if (event.eventType !== "TRAJECTORY_INIT") continue
      const refs = event.evidenceRefs ?? traj.evidenceRefs ?? []
      const expected = `intent-lock:${intentId}`
      if (refs.includes(expected)) {
        return { ok: true, trajectoryId }
      }
      return {
        ok: false,
        verification: fail(
          `intentLockRef mismatch: TRAJECTORY_INIT refs [${refs.join(", ")}], expected to include ${expected}`,
          `re-emit TRAJECTORY_INIT with evidence-ref ${expected}`,
        ),
      }
    }
  }
  return {
    ok: false,
    verification: fail(
      `no TRAJECTORY_INIT event for ${phaseId} in trajectory ledger`,
      `hivemind-trajectory event TRAJECTORY_INIT --phase ${phaseId} --evidence-ref intent-lock:${intentId}`,
    ),
  }
}

function readAndParseLandscape(
  landscapePath: string,
): { ok: true; data: z.infer<typeof LandscapeSchema> } | { ok: false; verification: StepVerification } {
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(landscapePath, "utf-8"))
  } catch (e) {
    return {
      ok: false,
      verification: fail(
        `landscape.json parse failed: ${e instanceof Error ? e.message : String(e)}`,
        "fix landscape.json syntax",
      ),
    }
  }
  const result = LandscapeSchema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      verification: fail(
        result.error.issues.map((i) => i.message).join("; "),
        "fix landscape.json per LandscapeSchema",
      ),
    }
  }
  return { ok: true, data: result.data }
}

async function getLastCommitSha(
  projectRoot: string,
  relativePath: string,
): Promise<{ sha: string }> {
  try {
    const r = await execFileAsync("git", [
      "log",
      "--format=%H",
      "-1",
      "--",
      relativePath,
    ], { cwd: projectRoot })
    return { sha: r.stdout.toString().trim() }
  } catch {
    return { sha: "" }
  }
}
