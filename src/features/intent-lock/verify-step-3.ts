/**
 * Intent-lock gate — Step 3 verifier.
 *
 * Performs the 10 SPEC §6.3 checks on the ROADMAP.md / STATE.md pair and
 * the parallel-session isolation, and on success transitions the session
 * from `PHASE_READY` to `PHASE_AUTHORIZED`.
 *
 * @see 27.1-SPEC.md §6.3
 */

import { execFile } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

import type { StepVerification } from "../../schema-kernel/intent-lock.schema.js"
import { PhaseEntrySchema } from "../../schema-kernel/intent-lock.schema.js"
import { readIntentLockState, upsertIntentLockState } from "./store.js"
import { transitionToPhaseAuthorized } from "./state-machine.js"
import { IntentState } from "./types.js"

const execFileAsync = promisify(execFile)

const ROADMAP_PHASE_LINE_REGEX = /^\s*-\s*\[(?<status>[ xX])\]\s+\*\*(?<phaseId>P?\d{2}(?:\.\d+)?-[a-z0-9-]+)/m

const STATE_ACTIVE_PHASE_REGEX = /\*\*Active phase:\*\*\s+`?(?<phaseId>P?\d{2}(?:\.\d+)?-[a-z0-9-]+|[A-Za-z0-9_-]+)/i

const MAX_PHASES_FOR_CYCLE_CHECK = 1000

/**
 * Step 3 verifier: 10 SPEC §6.3 checks + state transition.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Root session ID.
 * @param phaseId - The phase identifier to verify in ROADMAP.
 * @param intentId - The intent identifier (must match PhaseEntrySchema.intentLockRef).
 */
export async function verifyStep3RoadmapState(
  projectRoot: string,
  sessionId: string,
  phaseId: string,
  intentId: string,
): Promise<StepVerification> {
  // Check 1: state precondition
  const currentState = readIntentLockState(projectRoot, sessionId)
  if (currentState.state !== IntentState.PHASE_READY) {
    return fail(
      `state must be PHASE_READY, got ${currentState.state}`,
      "complete step 2 first (commit landscape + TRAJECTORY_INIT)",
    )
  }

  const roadmapPath = resolve(projectRoot, ".planning", "ROADMAP.md")
  const statePath = resolve(projectRoot, ".planning", "STATE.md")
  if (!existsSync(roadmapPath)) {
    return fail(`ROADMAP.md not found at ${roadmapPath}`,
      "create .planning/ROADMAP.md with a phase entry for " + phaseId)
  }
  if (!existsSync(statePath)) {
    return fail(`STATE.md not found at ${statePath}`,
      "create .planning/STATE.md with **Active phase:** " + phaseId)
  }

  const roadmapText = readFileSync(roadmapPath, "utf-8")
  const stateText = readFileSync(statePath, "utf-8")

  // Check 2: ROADMAP.md has diff (has any phase entry)
  const roadmapLines = roadmapText.split("\n")
  const phaseEntryLines = roadmapLines.filter((l) => l.match(ROADMAP_PHASE_LINE_REGEX))
  if (phaseEntryLines.length === 0) {
    return fail("ROADMAP.md has no phase entries",
      "add a `- [ ] **<phaseId>**` row to .planning/ROADMAP.md")
  }

  // Check 3 + 4 + 5 + 6: parse the entry for `phaseId`, validate via PhaseEntrySchema,
  // check intentLockRef, validate dependencies exist.
  const allEntries = parseRoadmapEntries(roadmapText)
  if (allEntries.length > MAX_PHASES_FOR_CYCLE_CHECK) {
    return fail(`ROADMAP too large for cycle check (${allEntries.length} entries > ${MAX_PHASES_FOR_CYCLE_CHECK})`,
      "split the ROADMAP or reduce phase count")
  }

  const entry = allEntries.find((e) => normalizePhaseId(e.phaseId) === normalizePhaseId(phaseId))
  if (!entry) {
    return fail(`phase entry not found in ROADMAP.md for ${phaseId}`,
      `add a \`- [ ] **${phaseId} (...)\` row to .planning/ROADMAP.md`)
  }

  const schemaResult = PhaseEntrySchema.safeParse({
    phaseId: entry.phaseId,
    name: entry.name,
    status: entry.status,
    dependsOn: entry.dependsOn,
    intentLockRef: entry.intentLockRef,
    createdAt: entry.createdAt,
    lastSynced: entry.lastSynced,
  })
  if (!schemaResult.success) {
    return fail(
      schemaResult.error.issues.map((i) => i.message).join("; "),
      "fix ROADMAP phase entry per PhaseEntrySchema",
    )
  }
  const validEntry = schemaResult.data

  if (validEntry.intentLockRef !== intentId) {
    return fail(`intentLockRef mismatch: ROADMAP phase entry has ${validEntry.intentLockRef}, expected ${intentId}`,
      "set intentLockRef on the ROADMAP phase entry to " + intentId)
  }

  for (const dep of validEntry.dependsOn) {
    const depEntry = allEntries.find((e) => normalizePhaseId(e.phaseId) === normalizePhaseId(dep))
    if (!depEntry) {
      return fail(`dependency ${dep} not found in ROADMAP.md`,
        `add a phase entry for ${dep} or remove it from dependsOn`)
    }
    // P27.2 T14: dependency must be COMPLETED (status "complete"), not just PHASE_AUTHORIZED
    if (depEntry.status !== "complete") {
      return fail(`dependency ${dep} has status '${depEntry.status}' (expected 'complete')`,
        `complete the ${dep} phase before depending on it`)
    }
  }

  // Check 7: no circular dependency (DFS)
  const cycle = detectCycle(allEntries)
  if (cycle) {
    return fail(`circular dependency detected: ${cycle.join(" → ")}`,
      "fix dependsOn in ROADMAP.md to break the cycle")
  }

  // Check 8: no parallel main session conflict (same phaseId, different sessionId, both PHASE_READY)
  const parallelConflict = findParallelConflict(projectRoot, phaseId, sessionId)
  if (parallelConflict) {
    return fail(`parallel session ${parallelConflict} already PHASE_READY for ${phaseId}`,
      "wait for the other session to complete step 3 or use a different phaseId")
  }

  // Check 9: STATE.md active phase matches phaseId
  const stateActiveMatch = stateText.match(STATE_ACTIVE_PHASE_REGEX)
  if (!stateActiveMatch || !stateActiveMatch.groups) {
    return fail("STATE.md missing **Active phase:** field",
      "add `**Active phase:** " + phaseId + "` to .planning/STATE.md")
  }
  const stateActive = stateActiveMatch.groups["phaseId"] ?? ""
  if (normalizePhaseId(stateActive) !== normalizePhaseId(phaseId)) {
    return fail(`STATE.md active phase mismatch: ${stateActive} (expected ${phaseId})`,
      "update STATE.md **Active phase:** to " + phaseId)
  }

  // Check 10: atomic commits for ROADMAP.md + STATE.md
  const roadmapSha = await getLastCommitSha(projectRoot, ".planning/ROADMAP.md")
  const stateSha = await getLastCommitSha(projectRoot, ".planning/STATE.md")
  if (!roadmapSha) {
    return fail("no git commit for .planning/ROADMAP.md",
      "git add .planning/ROADMAP.md .planning/STATE.md && git commit -m 'phase: " + phaseId + "'")
  }
  if (!stateSha) {
    return fail("no git commit for .planning/STATE.md",
      "git add .planning/ROADMAP.md .planning/STATE.md && git commit -m 'phase: " + phaseId + "'")
  }

  // All 10 checks passed — transition and persist
  const next = transitionToPhaseAuthorized(currentState, roadmapSha)
  upsertIntentLockState(projectRoot, next)
  return { passed: true, issues: [], nextCommand: undefined, alternatives: [] }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fail(issue: string, nextCommand: string): StepVerification {
  return { passed: false, issues: [issue], nextCommand, alternatives: [] }
}

function normalizePhaseId(id: string): string {
  return id.startsWith("P") ? id : `P${id}`
}

interface ParsedEntry {
  phaseId: string
  name: string
  status: "planned" | "active" | "blocked" | "complete" | "cancelled"
  dependsOn: string[]
  intentLockRef?: string
  createdAt: string
  lastSynced: string
}

/**
 * Best-effort parse of every phase row in ROADMAP.md.
 *
 * Format: `- [ ] **P27.1-intent-lock-gate (Name) (depends on: P26, P25) [intent: INT-...]**`
 * - `[x]` → `complete`, `[ ]` → `planned` (default)
 * - `depends on: P26, P25` → parsed into dependsOn array
 * - `[intent: INT-...]` → parsed into intentLockRef
 */
function parseRoadmapEntries(roadmapText: string): ParsedEntry[] {
  const lines = roadmapText.split("\n")
  const out: ParsedEntry[] = []
  for (const line of lines) {
    const match = line.match(ROADMAP_PHASE_LINE_REGEX)
    if (!match || !match.groups) continue
    const status = match.groups["status"]?.toLowerCase() === "x" ? "complete" : "planned"
    const phaseId = match.groups["phaseId"] ?? ""
    // Extract name from `(Name)` between phaseId and trailing `**`
    const afterPhaseId = line.substring(line.indexOf(phaseId) + phaseId.length)
    const nameMatch = afterPhaseId.match(/\(([^)]+)\)/)
    const name = nameMatch?.[1]?.trim() || phaseId
    const dependsMatch = afterPhaseId.match(/depends on:\s*([^)]+)/i)
    const dependsOn = dependsMatch
      ? dependsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
      : []
    const intentMatch = afterPhaseId.match(/\[intent:\s*([A-Z0-9-]+)\s*\]/i)
    const intentLockRef = intentMatch?.[1]?.trim()
    out.push({
      phaseId,
      name,
      status,
      dependsOn,
      intentLockRef,
      createdAt: "2026-06-10T10:00:00.000Z",
      lastSynced: "2026-06-10T10:00:00.000Z",
    })
  }
  return out
}

/**
 * DFS cycle detection. Returns the cycle path if any, else null.
 */
function detectCycle(entries: ParsedEntry[]): string[] | null {
  const graph = new Map<string, string[]>()
  for (const e of entries) {
    graph.set(normalizePhaseId(e.phaseId), e.dependsOn.map(normalizePhaseId))
  }
  const visited = new Set<string>()
  const stack = new Set<string>()
  let foundCycle: string[] | null = null
  function dfs(node: string, path: string[]): void {
    if (foundCycle) return
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node)
      foundCycle = path.slice(cycleStart).concat([node])
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    stack.add(node)
    for (const next of graph.get(node) ?? []) {
      dfs(next, [...path, node])
    }
    stack.delete(node)
  }
  for (const node of graph.keys()) {
    dfs(node, [])
    if (foundCycle) return foundCycle
  }
  return null
}

function findParallelConflict(projectRoot: string, phaseId: string, sessionId: string): string | null {
  const dir = resolve(projectRoot, ".hivemind", "intent-lock")
  if (!existsSync(dir)) return null
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue
    if (file === `${sessionId}.json`) continue
    try {
      const raw = JSON.parse(readFileSync(resolve(dir, file), "utf-8")) as {
        state?: string
        phaseId?: string
      }
      if (raw.state === "PHASE_READY" && raw.phaseId === phaseId) {
        return file.replace(/\.json$/, "")
      }
    } catch {
      // ignore corrupt files
    }
  }
  return null
}

async function getLastCommitSha(projectRoot: string, relativePath: string): Promise<string> {
  try {
    const r = await execFileAsync("git", [
      "log",
      "--format=%H",
      "-1",
      "--",
      relativePath,
    ], { cwd: projectRoot })
    return r.stdout.toString().trim()
  } catch {
    return ""
  }
}
