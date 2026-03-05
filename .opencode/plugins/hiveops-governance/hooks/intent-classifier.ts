/**
 * HiveMind Governance Plugin — Intent Classification Hook
 *
 * Fires on first user message seen by experimental.chat.messages.transform.
 * Runs scripts/classify-intent.sh, persists lineage to brain.json,
 * and updates enforcement state routing.
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { EnforcementState } from "../types"

type Lineage = "hivefiver" | "hiveminder" | "unresolved"

const CLASSIFY_INTENT_SCRIPT = "scripts/classify-intent.sh"
const BRAIN_FILE = ".hivemind/state/brain.json"

function resolveBash(): string {
  if (process.platform === "win32") {
    const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe"
    if (existsSync(gitBash)) return gitBash
    return "bash"
  }
  return "bash"
}

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
  const scriptPath = join(worktree, CLASSIFY_INTENT_SCRIPT)
  if (!existsSync(scriptPath)) return "unresolved"

  try {
    const stdout = execFileSync(resolveBash(), [scriptPath, message], {
      cwd: worktree,
      timeout: 8000,
      encoding: "utf-8",
      env: { ...process.env, GX_NON_INTERACTIVE: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    })
    return normalizeLineage((stdout || "").trim())
  } catch (error) {
    console.warn("[hiveops][intent-classifier] classify-intent.sh failed", error)
    return "unresolved"
  }
}

function persistLineageToBrain(worktree: string, lineage: Lineage): boolean {
  const brainPath = join(worktree, BRAIN_FILE)

  try {
    mkdirSync(dirname(brainPath), { recursive: true })

    let current: Record<string, unknown> = {}
    if (existsSync(brainPath)) {
      const raw = readFileSync(brainPath, "utf-8")
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
      updated_at: Date.now(),
    }

    writeFileSync(brainPath, `${JSON.stringify(next, null, 2)}\n`, "utf-8")
    return true
  } catch (error) {
    console.warn("[hiveops][intent-classifier] Failed to persist lineage to brain.json", error)
    return false
  }
}

export function buildIntentClassifierHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async (_input: any, output: any) => {
    if (state.current.classificationDone) return
    if (!output?.messages || !Array.isArray(output.messages)) return

    const firstUserMessage = findFirstUserMessage(output.messages)
    if (!firstUserMessage) return

    const lineage = classifyIntent(state.worktree, firstUserMessage)
    const persisted = persistLineageToBrain(state.worktree, lineage)

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
        persisted_to_brain: persisted,
      },
      lastCheckpoint: Date.now(),
    }

    state.save(state.current)

    console.info(
      `[hiveops][intent-classifier] lineage=${lineage} persisted=${persisted ? "yes" : "no"}`,
    )
  }
}
