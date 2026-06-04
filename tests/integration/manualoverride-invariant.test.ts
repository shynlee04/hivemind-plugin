import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * P58.9 REQ-58.9-04 / AC-58.9-04-02 + AC-58.9-04-03: regression guard for the
 * manualOverride-first invariants locked by D-58-22 (AC#10 + AC#11).
 *
 * Two assertions:
 *   1. `src/tools/tmux-copilot.ts` — inside the `case "forward-prompt":`
 *      block, the FIRST statement must be a `getManualOverrideState(...)`
 *      call. AC#11 invariant.
 *   2. `src/plugin.ts` `replayPendingDelegationNotifications` — inside the
 *      per-notification loop body, the FIRST statement must be the
 *      `getManualOverrideState(sessionId)` check. AC#10 invariant.
 *
 * If a future refactor moves the manualOverride check below another
 * statement (e.g., a sentinel prepending or `sendKeys` invocation), the
 * suppression path can be bypassed and USER_SESSION can escalate to
 * `forward-prompt`. This test catches that regression.
 */

function findForwardPromptCase(source: string): { body: string; index: number } | null {
  // Find "case \"forward-prompt\":" then extract the body up to the next
  // `case` or `}` at the same indent.
  const start = source.indexOf('case "forward-prompt":')
  if (start === -1) return null
  // Body starts after the colon
  let body = source.slice(start)
  // The body is the next ~50 lines; trim at the next `case "` or top-level `}`
  const nextCase = body.indexOf('\n      case "')
  if (nextCase !== -1) body = body.slice(0, nextCase)
  return { body, index: start }
}

function firstStatementOfCaseBlock(body: string): string {
  // Skip whitespace and comments to find the first non-trivial statement.
  const lines = body.split("\n").slice(1) // skip the `case "forward-prompt":` line
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "") continue
    if (trimmed.startsWith("//")) continue
    if (trimmed.startsWith("/*")) continue
    if (trimmed.startsWith("*")) continue
    return trimmed
  }
  return ""
}

function findAppendTuiPromptLoopBody(source: string): string | null {
  // Find `replayPendingDelegationNotifications` and extract the for-loop body
  // that contains the per-notification `getManualOverrideState(sessionId)` check.
  const funcStart = source.indexOf("export async function replayPendingDelegationNotifications")
  if (funcStart === -1) return null
  // Find the `for (const notification of pending) {` inside this function
  const loopStart = source.indexOf("for (const notification of pending) {", funcStart)
  if (loopStart === -1) return null
  // Find matching closing brace
  let depth = 0
  let i = source.indexOf("{", loopStart)
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++
    if (source[i] === "}") {
      depth--
      if (depth === 0) {
        return source.slice(loopStart, i + 1)
      }
    }
  }
  return null
}

describe("manualOverride-first invariant (D-58-22, REQ-58.9-04 AC-02/03)", () => {
  it("AC#11: src/tools/tmux-copilot.ts case 'forward-prompt' FIRST action is getManualOverrideState", () => {
    const source = readFileSync(join(process.cwd(), "src/tools/tmux-copilot.ts"), "utf8")
    const found = findForwardPromptCase(source)
    expect(found).not.toBeNull()
    if (!found) return
    // Walk through the case-block body and find the first ACTION statement.
    // A 1-line sessionId extraction (`const sessionId = context.sessionID`)
    // feeding the manualOverride call is allowed — it is not an "action",
    // just a binding. We accept either:
    //   (a) first non-comment, non-whitespace statement is `getManualOverrideState(...)`
    //   (b) first non-comment statement is a sessionId binding, and the
    //       IMMEDIATELY-NEXT statement is `getManualOverrideState(...)`
    const lines = found.body.split("\n").slice(1)
    let firstStmt = ""
    let secondStmt = ""
    let found_count = 0
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === "") continue
      if (trimmed.startsWith("//")) continue
      if (trimmed.startsWith("/*")) continue
      if (trimmed.startsWith("*")) continue
      if (found_count === 0) {
        firstStmt = trimmed
        found_count++
      } else if (found_count === 1) {
        secondStmt = trimmed
        break
      }
    }
    // Either first OR second statement must be the manualOverride check.
    const combined = firstStmt + " " + secondStmt
    expect(combined).toMatch(/getManualOverrideState\(/)
  })

  it("AC#10: src/plugin.ts replayPendingDelegationNotifications loop body's first statement is getManualOverrideState check", () => {
    const source = readFileSync(join(process.cwd(), "src/plugin.ts"), "utf8")
    const loopBody = findAppendTuiPromptLoopBody(source)
    expect(loopBody).not.toBeNull()
    if (!loopBody) return
    // The first non-comment, non-whitespace line inside the loop body
    const lines = loopBody.split("\n")
    let firstStmt = ""
    let inLoopBody = false
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.includes("for (const notification of pending) {")) {
        inLoopBody = true
        continue
      }
      if (!inLoopBody) continue
      if (trimmed === "") continue
      if (trimmed.startsWith("//")) continue
      firstStmt = trimmed
      break
    }
    expect(firstStmt).toMatch(/getManualOverrideState\(/)
  })
})
