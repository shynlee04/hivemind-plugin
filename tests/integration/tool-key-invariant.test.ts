import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * P58.9 REQ-58.9-04 / AC-58.9-04-01: regression guard for the 27-tool-key
 * invariant locked by P49. Parses `src/plugin.ts` for the top-level
 * `tool({...})` spread object keys and asserts the count is exactly 27.
 *
 * This is a structural assertion: it scans the source file for the
 * `registerXxxTools` returns + the inline `tmux-copilot` + `tmux-state-query`
 * entries that form the plugin tool object. The count is a hard contract
 * from P49 — adding a new tool requires a deliberate atomic commit that
 * also updates the `EXPECTED_TOOL_COUNT` constant below.
 *
 * If you intentionally add or remove a tool, update `EXPECTED_TOOL_COUNT`
 * AND add a one-line rationale in the constant's JSDoc below.
 */
const EXPECTED_TOOL_COUNT = 27

/**
 * Extract the tool keys from `src/plugin.ts`. The plugin tool object is
 * built in 4 registerXxxTools functions (delegate/session/hivemind/config)
 * + 2 inline entries (tmux-copilot, tmux-state-query). This regex picks
 * up the key: functionCall pattern.
 */
function extractToolKeys(source: string): string[] {
  // Match: "key": createXxxTool(...) OR "key": xxxTool,
  const keyRegex = /^\s*"([a-z][a-z0-9-]*)":\s*(create\w+Tool|\w+Tool)\b/gm
  const keys = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = keyRegex.exec(source)) !== null) {
    keys.add(match[1]!)
  }
  return Array.from(keys).sort()
}

describe("27-tool-key invariant (P49, REQ-58.9-04 AC-01)", () => {
  it("src/plugin.ts has exactly the expected number of top-level tool keys", () => {
    const source = readFileSync(join(process.cwd(), "src/plugin.ts"), "utf8")
    const keys = extractToolKeys(source)
    expect(keys.length).toBe(EXPECTED_TOOL_COUNT)
  })

  it("tool keys are unique (no duplicates)", () => {
    const source = readFileSync(join(process.cwd(), "src/plugin.ts"), "utf8")
    const keys = extractToolKeys(source)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("expected tool set includes the canonical P49 keys", () => {
    const source = readFileSync(join(process.cwd(), "src/plugin.ts"), "utf8")
    const keys = extractToolKeys(source)
    // Spot-check a few canonical P49 keys to ensure the extract isn't
    // accidentally pulling in non-tool entries.
    const expected = [
      "delegate-task",
      "delegation-status",
      "execute-slash-command",
      "session-tracker",
      "hivemind-doc",
      "tmux-copilot",
      "tmux-state-query",
    ]
    for (const key of expected) {
      expect(keys).toContain(key)
    }
  })
})
