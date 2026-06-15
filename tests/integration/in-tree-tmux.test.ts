import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * P58.9 REQ-58.9-04 / AC-58.9-04-05: regression guard for the P51 in-tree
 * tmux single-source-of-truth invariant. Asserts no `import` of
 * `@opencode-tmux/...` or `opencode-tmux-...` exists in `src/` runtime code.
 *
 * The fork-pattern detection scans all .ts files under `src/` for runtime
 * import statements. `ORIGIN:` attribution comments (which document
 * 1:1 ports from `opencode-tmux/src/...` during the in-tree migration)
 * are allowed and are NOT imports.
 *
 * If a contributor reintroduces a runtime dependency on the legacy
 * `@opencode-tmux/*` package, this test fails. The single source of
 * truth is `src/features/tmux/` — `TmuxMultiplexer` + `SessionManager`.
 */

const FORBIDDEN_PATTERNS = [
  /from\s+["']@opencode-tmux\//,
  /from\s+["']opencode-tmux-/,
  /require\s*\(\s*["']@opencode-tmux\//,
  /require\s*\(\s*["']opencode-tmux-/,
]

function listTsFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (name.endsWith(".ts")) {
        out.push(full)
      }
    }
  }
  walk(root)
  return out
}

describe("P51 in-tree tmux single-source-of-truth (REQ-58.9-04 AC-05)", () => {
  const srcRoot = join(process.cwd(), "src")

  it("no @opencode-tmux/* runtime imports exist in src/", () => {
    const files = listTsFiles(srcRoot)
    const offenders: { file: string; line: number; match: string }[] = []
    for (const file of files) {
      const content = readFileSync(file, "utf8")
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        for (const pattern of FORBIDDEN_PATTERNS) {
          const match = line.match(pattern)
          if (match) {
            offenders.push({ file: file.replace(srcRoot, "src"), line: i + 1, match: match[0] })
          }
        }
      }
    }
    if (offenders.length > 0) {
      const summary = offenders.map((o) => `  ${o.file}:${o.line}  ${o.match}`).join("\n")
      throw new Error(`Forbidden @opencode-tmux imports found:\n${summary}`)
    }
    expect(offenders).toEqual([])
  })
})
