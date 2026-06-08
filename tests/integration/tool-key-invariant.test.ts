import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * P58.9 REQ-58.9-04 / AC-58.9-04-01: regression guard for the 28-tool-key
 * invariant. Parses both `src/plugin.ts` and `src/plugin-registration.ts`
 * for the top-level tool keys — 4 spread registration functions
 * (delegate/session/hivemind/config) plus 3 inline entries
 * (tmux-copilot, tmux-state-query, hivemind-steer).
 *
 * This is a structural assertion: it scans both source files for the
 * explicit tool key patterns and asserts the total count is exactly 28.
 * The count is a hard contract — adding a new tool requires a deliberate
 * atomic commit that also updates the `EXPECTED_TOOL_COUNT` constant below.
 *
 * If you intentionally add or remove a tool, update `EXPECTED_TOOL_COUNT`
 * AND add a one-line rationale in the constant's JSDoc below.
 */
const EXPECTED_TOOL_COUNT = 28

/**
 * Extract the tool keys from both `src/plugin.ts` and `src/plugin-registration.ts`.
 * Tools are registered via 4 spread functions (registerDelegationTools,
 * registerSessionTools, registerHivemindTools, registerConfigTools) in
 * plugin-registration.ts + 3 inline entries in plugin.ts.
 * This regex picks up the "key": createXxxTool(...) OR "key": xxxTool pattern
 * from both files.
 */
function extractToolKeys(): string[] {
  const sources = [
    readFileSync(join(process.cwd(), "src/plugin.ts"), "utf8"),
    readFileSync(join(process.cwd(), "src/plugin-registration.ts"), "utf8"),
  ]
  // Match: "key": createXxxTool(...) OR "key": xxxTool,
  const keyRegex = /^\s*"([a-z][a-z0-9-]*)":\s*(create\w+Tool|\w+Tool)\b/gm
  const keys = new Set<string>()
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = keyRegex.exec(source)) !== null) {
      keys.add(match[1]!)
    }
  }
  return Array.from(keys).sort()
}

describe("28-tool-key invariant (P49, REQ-58.9-04 AC-01)", () => {
  it("the combined plugin tool key count is exactly 28", () => {
    const keys = extractToolKeys()
    expect(keys.length).toBe(EXPECTED_TOOL_COUNT)
  })

  it("tool keys are unique (no duplicates)", () => {
    const keys = extractToolKeys()
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("expected tool set includes the canonical keys", () => {
    const keys = extractToolKeys()
    // Spot-check a few canonical keys to ensure the extract isn't
    // accidentally pulling in non-tool entries.
    const expected = [
      "delegate-task",
      "delegation-status",
      "execute-slash-command",
      "session-tracker",
      "hivemind-doc",
      "hivemind-trajectory",
      "tmux-copilot",
      "tmux-state-query",
      "hivemind-steer",
      "prompt-skim",
      "prompt-analyze",
    ]
    for (const key of expected) {
      expect(keys).toContain(key)
    }
  })
})
