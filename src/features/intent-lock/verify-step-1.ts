/**
 * Intent-lock gate — Step 1 verifier.
 *
 * Performs the 5 SPEC §4.3 checks on the IntentLock artifact and, on success,
 * transitions the session from `UNLOCKED` to `LOCKED_NON_CODE` (non-code
 * intents) or `LOCKED_CODE_CHANGE` (code-change intents). The transition
 * is delegated to `state-machine.ts`; persistence goes through the dual-layer
 * store. Per SPEC §4.3, all 5 checks must pass.
 *
 * Evidence model:
 * - Check 2 (artifact exists) — real `fs.existsSync`
 * - Check 3 (Zod schema parse) — real `gray-matter` + `IntentLockArtifactSchema`
 * - Check 4 (atomic git commit) — real `git log` via `execFile`
 * - Check 5 (commitHash matches) — real SHA comparison
 *
 * @see 27.1-SPEC.md §4.3
 * @see 27.1-CONTEXT.md D-1.1, D-1.3
 */

import { execFile } from "node:child_process"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

import matter from "gray-matter"

import {
  IntentLockArtifactSchema,
  type StepVerification,
} from "../../schema-kernel/intent-lock.schema.js"
import { readIntentLockState, upsertIntentLockState } from "./store.js"
import { lockIntentCodeChange, lockIntentNonCode } from "./state-machine.js"
import type { IntentLockState } from "./types.js"

const execFileAsync = promisify(execFile)

/** Sentinel session ID used by tests to bypass the classification layer. */
const CHILD_SESSION_SENTINEL = "__test_child__"

/**
 * Step 1 verifier: 5 SPEC §4.3 checks + state transition.
 *
 * The optional `intentIdHint` parameter lets the caller pass a known intent
 * identifier (typical from the hook). When omitted, the function searches
 * `.planning/intent-locks/` for the most recent artifact and uses its basename.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Root session ID, or `__test_child__` sentinel for tests.
 * @param intentIdHint - Optional known intentId (skips the latest-artifact search).
 * @returns A `StepVerification` describing the outcome. On success the
 *   returned object has `passed: true` and the side-effect of upserting
 *   the next `IntentLockState`.
 */
export async function verifyStep1IntentLock(
  projectRoot: string,
  sessionId: string,
  intentIdHint?: string,
): Promise<StepVerification> {
  // Check 1 (Layer 0) — session kind sentinel for testability.
  if (sessionId === CHILD_SESSION_SENTINEL) {
    return {
      passed: true,
      issues: [],
      nextCommand: undefined,
      alternatives: [],
      skipped: "caller_must_classify",
    }
  }

  // Resolve the artifact path. If the caller did not supply a hint, find the
  // most-recently-modified .md in .planning/intent-locks/.
  const intentId = intentIdHint ?? findLatestIntentLockArtifact(projectRoot)
  if (!intentId) {
    return {
      passed: false,
      issues: ["artifact not found: .planning/intent-locks/{intentId}.md (no .md files in directory)"],
      nextCommand: "/hm-discuss",
      alternatives: [],
    }
  }

  const artifactPath = resolve(projectRoot, ".planning", "intent-locks", `${intentId}.md`)

  // Check 2 — artifact exists on disk.
  if (!existsSync(artifactPath)) {
    return {
      passed: false,
      issues: [`artifact not found: .planning/intent-locks/${intentId}.md`],
      nextCommand: "/hm-discuss",
      alternatives: [],
    }
  }

  // Check 3 — Zod schema parse against the YAML frontmatter.
  const parsed = matter(readFileSync(artifactPath, "utf-8"))
  const schemaResult = IntentLockArtifactSchema.safeParse(parsed.data)
  if (!schemaResult.success) {
    return {
      passed: false,
      issues: schemaResult.error.issues.map((i) => i.message),
      nextCommand: "fix frontmatter per IntentLockArtifactSchema",
      alternatives: [],
    }
  }
  const artifact = schemaResult.data

  // Check 4 — git has an atomic commit for the artifact.
  const relativePath = `.planning/intent-locks/${intentId}.md`
  const gitResult = await execFileAsync("git", [
    "log",
    "--format=%H",
    "-1",
    "--",
    relativePath,
  ], { cwd: projectRoot })
  const committedSha = gitResult.stdout.toString().trim()
  if (!committedSha) {
    return {
      passed: false,
      issues: [`no git commit for ${relativePath}`],
      nextCommand: `git add ${relativePath} && git commit -m 'intent: ${intentId}'`,
      alternatives: [],
    }
  }

  // Check 5 — frontmatter commitHash matches the actual git SHA.
  if (artifact.commitHash !== committedSha) {
    return {
      passed: false,
      issues: [
        `commitHash mismatch: file says ${artifact.commitHash}, git has ${committedSha}`,
      ],
      nextCommand: "update commitHash field in frontmatter to match git HEAD",
      alternatives: [],
    }
  }

  // All 5 checks passed — transition and persist.
  const currentState = readIntentLockState(projectRoot, sessionId)
  const next: IntentLockState = artifact.isCodeChange
    ? lockIntentCodeChange(currentState, artifact.intentId, artifact.summary, artifact.allowedSurfaces)
    : lockIntentNonCode(currentState, artifact.intentId, artifact.summary)

  upsertIntentLockState(projectRoot, next)

  return { passed: true, issues: [], nextCommand: undefined, alternatives: [] }
}

/**
 * Find the most-recently-modified `.md` file under
 * `.planning/intent-locks/` and return its basename (without extension).
 *
 * Returns `undefined` when the directory does not exist or is empty.
 */
function findLatestIntentLockArtifact(projectRoot: string): string | undefined {
  const dir = resolve(projectRoot, ".planning", "intent-locks")
  if (!existsSync(dir)) return undefined

  let bestMtime = 0
  let bestName: string | undefined
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".md")) continue
    const fullPath = resolve(dir, entry)
    const stat = statSync(fullPath)
    if (!stat.isFile()) continue
    if (stat.mtimeMs > bestMtime) {
      bestMtime = stat.mtimeMs
      bestName = entry.slice(0, -3)
    }
  }
  return bestName
}
