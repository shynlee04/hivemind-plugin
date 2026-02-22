import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

type ScopedHookTarget = {
  label: string
  path: string
}

const scopedHookTargets: ScopedHookTarget[] = [
  { label: "soft-governance", path: "src/hooks/soft-governance.ts" },
  { label: "session-lifecycle", path: "src/hooks/session-lifecycle.ts" },
  { label: "event-handler", path: "src/hooks/event-handler.ts" },
]

function findExplicitAnyLines(source: string): string[] {
  return source
    .split("\n")
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => /:\s*any\b/.test(line))
    .map(({ line, lineNumber }) => `L${lineNumber}: ${line.trim()}`)
}

describe("HF-HARDEN-08 RED: scoped hooks should not contain explicit : any", () => {
  it("enforces explicit-any guardrails only for the three scoped hook files", () => {
    const offenders = scopedHookTargets.map((target) => {
      const source = readFileSync(target.path, "utf-8")
      return {
        ...target,
        explicitAnyLines: findExplicitAnyLines(source),
      }
    })

    const failing = offenders.filter((entry) => entry.explicitAnyLines.length > 0)
    const details = failing
      .map((entry) => `${entry.path} => ${entry.explicitAnyLines.join(" | ")}`)
      .join("\n")

    assert.equal(
      failing.length,
      0,
      `Scoped hooks contain explicit ': any' annotations:\n${details}`,
    )
  })
})
