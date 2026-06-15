/**
 * Intent-lock gate — Step 4 verifier.
 *
 * Performs the 8 SPEC §7.3 checks on the phase directory + manifest and
 * (on success) transitions the session from `PHASE_AUTHORIZED` to
 * `EXECUTING`. The integration gate (Check 8) is the canonical typecheck
 * pipeline per SPEC §7.3.
 *
 * **Critical: SPEC.md and CONTEXT.md are NOT required by this verifier.**
 * The phase directory + manifest is the only artifact required to unlock
 * EXECUTING. This is the binding behavior of the intent-lock gate; the
 * caller can opt to add SPEC/CONTEXT inside the phase dir for downstream
 * consumers without breaking the gate.
 *
 * @see 27.1-SPEC.md §7.3
 */

import { execFile } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

import {
  PhaseIdSchema,
  type StepVerification,
} from "../../schema-kernel/intent-lock.schema.js"
import { PhaseManifestSchema } from "../../schema-kernel/phase-manifest.schema.js"
import { readIntentLockState, upsertIntentLockState } from "./store.js"
import { transitionToExecuting } from "./state-machine.js"
import { IntentState } from "./types.js"

const execFileAsync = promisify(execFile)

/** Per-session cache for the integration gate (Check 8). 60-second TTL. */
interface IntegrationGateCacheEntry {
  passed: boolean
  checkedAt: number
}
const integrationGateCache = new Map<string, IntegrationGateCacheEntry>()
const INTEGRATION_GATE_TTL_MS = 60_000
const INTEGRATION_GATE_TIMEOUT_MS = 60_000

/**
 * Clear the integration gate cache. Exported for test isolation — the
 * vitest suite calls this in `beforeEach` so each test gets a fresh
 * integration-gate result. The cache is invalidated on any state
 * transition triggered by this verifier (see below).
 */
export function _clearIntegrationGateCache(): void {
  integrationGateCache.clear()
}

/**
 * Step 4 verifier: 8 SPEC §7.3 checks + state transition.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Root session ID.
 * @param phaseId - The phase identifier (must match the manifest's phaseId).
 * @param intentId - The intent identifier locked in Step 1.
 * @param landscapeRef - The relative path to the landscape.json (must match the manifest's landscapeRef).
 * @param roadmapCommitHash - The SHA committed during Step 3 (must match the manifest's roadmapCommitHash).
 * @param stateCommitHash - The SHA committed during Step 3 (must match the manifest's stateCommitHash).
 */
export async function verifyStep4PhaseCreation(
  projectRoot: string,
  sessionId: string,
  phaseId: string,
  intentId: string,
  landscapeRef: string,
  roadmapCommitHash: string,
  stateCommitHash: string,
): Promise<StepVerification> {
  // Check 1: state precondition
  const currentState = readIntentLockState(projectRoot, sessionId)
  if (currentState.state !== IntentState.PHASE_AUTHORIZED) {
    return fail(
      `state must be PHASE_AUTHORIZED, got ${currentState.state}`,
      "complete step 3 first (sync ROADMAP/STATE)",
    )
  }

  // Check 2: phase directory exists
  const phaseDir = resolve(projectRoot, ".planning", "phases", phaseId)
  if (!existsSync(phaseDir) || !statSync(phaseDir).isDirectory()) {
    return fail(`phase directory does not exist: ${phaseDir}`,
      `mkdir -p ${phaseDir}`)
  }

  // Check 3: manifest.json exists
  const manifestPath = resolve(phaseDir, "manifest.json")
  if (!existsSync(manifestPath)) {
    return fail(`manifest.json not found at ${manifestPath}`,
      `create manifest.json per PhaseManifestSchema at ${manifestPath}`)
  }

  // Check 4: manifest schema parse
  let manifestRaw: unknown
  try {
    manifestRaw = JSON.parse(readFileSync(manifestPath, "utf-8"))
  } catch (e) {
    return fail(
      `manifest.json parse failed: ${e instanceof Error ? e.message : String(e)}`,
      "fix manifest.json syntax",
    )
  }
  const manifestResult = PhaseManifestSchema.safeParse(manifestRaw)
  if (!manifestResult.success) {
    return fail(
      manifestResult.error.issues.map((i) => i.message).join("; "),
      "fix manifest.json per PhaseManifestSchema",
    )
  }
  const manifest = manifestResult.data

  // Check 5: all 4 FK fields match
  if (manifest.phaseId !== phaseId) {
    return fail(`manifest.phaseId mismatch: ${manifest.phaseId} (expected ${phaseId})`,
      "fix manifest.phaseId to match the verifier phaseId argument")
  }
  if (manifest.intentLockRef !== intentId) {
    return fail(`manifest.intentLockRef mismatch: ${manifest.intentLockRef} (expected ${intentId})`,
      "fix manifest.intentLockRef to match the locked intent id")
  }
  if (manifest.landscapeRef !== landscapeRef) {
    return fail(`manifest.landscapeRef mismatch: ${manifest.landscapeRef} (expected ${landscapeRef})`,
      "fix manifest.landscapeRef to point to .planning/phases/<phaseId>/landscape.json")
  }
  if (manifest.roadmapCommitHash !== roadmapCommitHash) {
    return fail(`manifest.roadmapCommitHash mismatch: ${manifest.roadmapCommitHash} (expected ${roadmapCommitHash})`,
      "fix manifest.roadmapCommitHash to match the ROADMAP.md commit SHA")
  }
  if (manifest.stateCommitHash !== stateCommitHash) {
    return fail(`manifest.stateCommitHash mismatch: ${manifest.stateCommitHash} (expected ${stateCommitHash})`,
      "fix manifest.stateCommitHash to match the STATE.md commit SHA")
  }

  // Check 6: phase ID format valid
  if (!PhaseIdSchema.safeParse(phaseId).success) {
    return fail(`phase ID format invalid: ${phaseId}`,
      "rename phase to match P{digits}{.optional}-{kebab-name}")
  }

  // Check 7: atomic commit for manifest.json
  const relativeManifestPath = `.planning/phases/${phaseId}/manifest.json`
  let manifestSha = ""
  try {
    const r = await execFileAsync("git", [
      "log",
      "--format=%H",
      "-1",
      "--",
      relativeManifestPath,
    ], { cwd: projectRoot })
    manifestSha = r.stdout.toString().trim()
  } catch {
    manifestSha = ""
  }
  if (!manifestSha) {
    return fail(`no git commit for ${relativeManifestPath}`,
      `git add ${relativeManifestPath} && git commit -m 'phase manifest: ${phaseId}'`)
  }

  // Check 8: integration gate — runs the canonical typecheck pipeline. Result
  // is cached per session for 60s to avoid repeated full builds within a
  // single session's tool burst. The cache is invalidated on each
  // transition triggered by this verifier (we re-validate after every call).
  const gateResult = await runIntegrationGate(sessionId, projectRoot)
  if (!gateResult.passed) {
    return fail(gateResult.issue ?? "integration gate failed",
      gateResult.nextCommand ?? "fix typecheck errors before transitioning to EXECUTING")
  }

  // All 8 checks passed — transition and persist. Invalidate the cache so
  // the next call re-verifies (a state transition invalidates prior gate
  // results per SPEC §7.3).
  const next = transitionToExecuting(currentState, manifestSha)
  upsertIntentLockState(projectRoot, next)
  integrationGateCache.delete(sessionId)

  return { passed: true, issues: [], nextCommand: undefined, alternatives: [] }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fail(issue: string, nextCommand: string): StepVerification {
  return { passed: false, issues: [issue], nextCommand, alternatives: [] }
}

interface IntegrationGateResult {
  passed: boolean
  issue?: string
  nextCommand?: string
}

async function runIntegrationGate(
  sessionId: string,
  projectRoot: string,
): Promise<IntegrationGateResult> {
  const cached = integrationGateCache.get(sessionId)
  if (cached && Date.now() - cached.checkedAt < INTEGRATION_GATE_TTL_MS) {
    return cached.passed
      ? { passed: true }
      : { passed: false, issue: "integration gate cached failure (within TTL)", nextCommand: "fix the cached failure and re-run" }
  }

  try {
    await execFileAsync("npm", ["run", "typecheck"], {
      cwd: projectRoot,
      timeout: INTEGRATION_GATE_TIMEOUT_MS,
    })
    integrationGateCache.set(sessionId, { passed: true, checkedAt: Date.now() })
    return { passed: true }
  } catch (e) {
    const err = e as { code?: string; message?: string }
    if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
      integrationGateCache.set(sessionId, { passed: false, checkedAt: Date.now() })
      return {
        passed: false,
        issue: `integration gate timeout after ${INTEGRATION_GATE_TIMEOUT_MS}ms`,
        nextCommand: "increase tsc performance or split phase",
      }
    }
    integrationGateCache.set(sessionId, { passed: false, checkedAt: Date.now() })
    return {
      passed: false,
      issue: `integration gate failed: typecheck exit code ${err.code ?? "nonzero"}`,
      nextCommand: "fix typecheck errors before transitioning to EXECUTING",
    }
  }
}
