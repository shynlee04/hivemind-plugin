import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

type ScopedHookTarget = {
  label: string
  path: string
}

type AnyOffense = {
  lineNumber: number
  line: string
  kind: "explicit-any" | "as-any"
}

const scopedHookTargets: ScopedHookTarget[] = [
  { label: "soft-governance", path: "src/hooks/soft-governance.ts" },
  { label: "session-lifecycle", path: "src/hooks/session-lifecycle.ts" },
  { label: "tool-gate", path: "src/hooks/tool-gate.ts" },
]

function collectAnyOffenses(source: string): AnyOffense[] {
  return source
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .flatMap(({ line, lineNumber }) => {
      const content = line.replace(/\/\/.*$/, "")
      const offenses: AnyOffense[] = []
      if (/:\s*any\b/.test(content)) {
        offenses.push({
          lineNumber,
          line: line.trim(),
          kind: "explicit-any",
        })
      }
      if (/\bas\s+any\b/.test(content)) {
        offenses.push({
          lineNumber,
          line: line.trim(),
          kind: "as-any",
        })
      }
      return offenses
    })
}

describe("HF-HARDEN-09 RED: scoped hooks should not contain : any or as any", () => {
  it("fails line-oriented for soft-governance, session-lifecycle, and tool-gate", () => {
    const offenders = scopedHookTargets.map((target) => {
      const source = readFileSync(target.path, "utf-8")
      return {
        ...target,
        offenses: collectAnyOffenses(source),
      }
    })

    const failing = offenders.filter((entry) => entry.offenses.length > 0)
    const details = failing
      .map((entry) => {
        const lines = entry.offenses
          .map((offense) => `L${offense.lineNumber} [${offense.kind}] ${offense.line}`)
          .join(" | ")
        return `${entry.path} => ${lines}`
      })
      .join("\n")

    assert.equal(
      failing.length,
      0,
      `Scoped hooks contain banned any usage (': any' or 'as any'):\n${details}`,
    )
  })
})
