/**
 * @deprecated DISABLED 2026-03-08 — This plugin is disabled in opencode.json.
 * Reason: References nonexistent GX-Pack scripts, deep cross-layer imports,
 * and duplicates governance already handled by canonical src/hooks/*.
 * Canonical replacement: src/hooks/ (session-lifecycle, soft-governance,
 * tool-gate, compaction, event-handler, messages-transform).
 * See AGENTS.md §Dual-Injection Systems for context.
 *
 * --- Original description ---
 * HiveMind Governance Plugin — Intent Classification Hook
 *
 * Fires on first user message seen by experimental.chat.messages.transform.
 * Runs scripts/classify-intent.sh, persists lineage to session profile,
 * and updates enforcement state routing when the plugin prompt path is
 * acting as the active fallback owner.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { EnforcementState } from "../types"
import { runNonInteractiveScript } from "../utils"
import { coreRuntimeHooksPresent } from "./context-injection"

type Lineage = "hivefiver" | "hiveminder" | "unresolved"

const CLASSIFY_INTENT_SCRIPT = "scripts/classify-intent.sh"
const ACTIVE_SESSIONS_DIR = ".hivemind/sessions/active"

function extractMessageText(msg: any): string {
  if (!msg) return ""

  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => (typeof part.text === "string" ? part.text : ""))
      .join(" ")
      .trim()
  }

  if (typeof msg.content === "string") return msg.content.trim()
  if (msg.info && typeof msg.info.content === "string") return msg.info.content.trim()

  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((part: any) => part.type === "text")
      .map((part: any) => (typeof part.text === "string" ? part.text : ""))
      .join(" ")
      .trim()
  }

  return ""
}

function findFirstUserMessage(messages: any[]): string {
  for (const msg of messages) {
    const role = msg?.info?.role || msg?.role
    if (role !== "user") continue

    const text = extractMessageText(msg)
    if (text.length > 0) return text
  }
  return ""
}

function normalizeLineage(value: string): Lineage {
  if (value === "hivefiver" || value === "hiveminder") return value
  return "unresolved"
}

function classifyIntent(worktree: string, message: string): Lineage {
  const stdout = runNonInteractiveScript(worktree, CLASSIFY_INTENT_SCRIPT, [message], 8000)
  if (stdout === null) {
    console.warn("[hiveops][intent-classifier] classify-intent.sh failed")
    return "unresolved"
  }

  return normalizeLineage(stdout.trim())
}

function resolveProfilePath(worktree: string, sessionId: string): string | null {
  const activeDir = join(worktree, ACTIVE_SESSIONS_DIR)
  if (!existsSync(activeDir)) return null

  const directCandidate = join(activeDir, sessionId, "profile.json")
  if (sessionId.trim().length > 0 && existsSync(directCandidate)) {
    return directCandidate
  }

  try {
    const profileCandidates = readdirSync(activeDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(activeDir, entry.name, "profile.json"))
      .filter((path) => existsSync(path))
      .map((path) => ({ path, mtime: statSync(path).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
    return profileCandidates[0]?.path ?? null
  } catch {
    return null
  }
}

function persistLineageToProfile(worktree: string, lineage: Lineage, sessionId: string): boolean {
  const profilePath = resolveProfilePath(worktree, sessionId)
  if (!profilePath) return false
  try {
    let current: Record<string, unknown> = {}
    if (existsSync(profilePath)) {
      const raw = readFileSync(profilePath, "utf-8")
      if (raw.trim().length > 0) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          current = parsed as Record<string, unknown>
        }
      }
    }

    const next = {
      ...current,
      lineage,
      agent: lineage !== "unresolved" ? lineage : current.agent ?? "unresolved",
      updated_at: Date.now(),
    }

    writeFileSync(profilePath, `${JSON.stringify(next, null, 2)}\n`, "utf-8")
    return true
  } catch (error) {
    console.warn("[hiveops][intent-classifier] Failed to persist lineage to session profile", error)
    return false
  }
}

export function buildIntentClassifierHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async (_input: any, output: any) => {
    if (coreRuntimeHooksPresent(state.worktree)) return
    if (state.current.classificationDone) return
    if (!output?.messages || !Array.isArray(output.messages)) return

    const firstUserMessage = findFirstUserMessage(output.messages)
    if (!firstUserMessage) return

    const lineage = classifyIntent(state.worktree, firstUserMessage)
    const persisted = persistLineageToProfile(state.worktree, lineage, state.current.sessionId)

    state.current = {
      ...state.current,
      agent: lineage !== "unresolved" ? lineage : state.current.agent,
      classificationPending: lineage === "unresolved",
      classificationDone: true,
      intentClassification: {
        lineage,
        classified_at: Date.now(),
        source: "classify-intent.sh",
        input_excerpt: firstUserMessage.slice(0, 200),
        persisted_to_profile: persisted,
      },
      lastCheckpoint: Date.now(),
    }

    state.save(state.current)

    console.info(
      `[hiveops][intent-classifier] lineage=${lineage} persisted=${persisted ? "yes" : "no"}`,
    )
  }
}
