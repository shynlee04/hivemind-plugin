Here's the design for a deterministic validation script bundle, modeled after GSD's `gsd-tools.cjs verify` suite but adapted for your context-entry skill.

## The Pattern to Follow: GSD's `verify.cjs`

GSD already solved the "hard proof, not made-up artifacts" problem. Its verification suite is a single `.cjs` file with atomic commands that each return JSON verdicts: [4-cite-0](#4-cite-0) 

The key design: every command reads real filesystem/git state, returns machine-parseable JSON with `passed: true|false`, and the agent can't fake the output because it's a **script the agent calls**, not text the agent generates. [4-cite-1](#4-cite-1) 

## Your Script: `hm-verify.cjs`

A single CommonJS script (no dependencies, runs anywhere Node exists) with this command surface:

```
Usage: node hm-verify.cjs <command> [args] [--raw]

Project Reality Gates (Layer 1 — hard proof):
  project contracts              Check package.json contracts: name, version, main, types, exports, engines
  project dependencies           Verify installed deps match package.json (npm ls --json)
  project sdk-surface            Verify @opencode-ai/sdk and @opencode-ai/plugin are installed + importable
  project build                  Run npx tsc --noEmit, capture exit code + error count
  project tests                  Run npm test, capture exit code + pass/fail count

Planning Integrity Gates (Layer 2 — artifact vs reality):
  planning exists                Check .planning/ or configured planning root exists
  planning health                Check STATE.md, ROADMAP.md, REQUIREMENTS.md, config.json
  planning consistency           Check roadmap phases match disk directories
  planning spec-gate <path>      Verify PLAN.md has required frontmatter + tasks
  planning references <path>     Check all @-refs and backtick paths resolve to real files
  planning artifacts <plan>      Check must_haves.artifacts exist with min_lines/contains/exports

Git Evidence Gates (Layer 3 — commit proof):
  git commits <h1> [h2] ...     Verify commit hashes exist in repo
  git branch-state               Report working tree status (clean/dirty/conflicts)
  git last-commit                Return last commit hash, message, author, files changed
  git diff-stat [ref]            Return diff stat against ref (default: HEAD~1)

Architecture Gates (Layer 4 — domain boundary + landscape):
  arch src-domains               Scan src/ top-level dirs, report LOC, export count, import graph
  arch dead-exports              Find exported symbols with zero consumers
  arch circular-deps             Detect circular import chains
  arch boundary-check <domain>   Verify domain only imports from allowed peers

Full Landscape (chains all above):
  landscape                      Run all Layer 1-4 gates, return unified verdict
  landscape --gate-chain         Sequential: stop at first failure, report which gate blocked
```

### How Each Gate Produces Hard Proof

**Layer 1: Project Reality** — These call real commands and parse real output:

```javascript
// project contracts — reads package.json, checks required fields
function cmdProjectContracts(cwd, raw) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    return output({ passed: false, error: 'package.json not found' }, raw)
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const checks = {
    has_name: !!pkg.name,
    has_version: !!pkg.version,
    has_main: !!pkg.main,
    has_types: !!pkg.types,
    has_exports: !!pkg.exports || !!pkg.main,
    has_engines: !!pkg.engines,
    dependencies_count: Object.keys(pkg.dependencies || {}).length,
    devDependencies_count: Object.keys(pkg.devDependencies || {}).length,
    scripts: Object.keys(pkg.scripts || {}),
  }
  const passed = checks.has_name && checks.has_version && checks.has_main
  output({ passed, checks, pkg_name: pkg.name, pkg_version: pkg.version }, raw)
}

// project dependencies — runs npm ls --json, parses real output
function cmdProjectDependencies(cwd, raw) {
  const result = execSync('npm ls --json --depth=0 2>&1', { cwd, encoding: 'utf-8' })
  const parsed = JSON.parse(result)
  const problems = parsed.problems || []
  const missing = problems.filter(p => p.startsWith('missing:'))
  const invalid = problems.filter(p => p.startsWith('invalid:'))
  output({
    passed: missing.length === 0,
    missing,
    invalid,
    total_deps: Object.keys(parsed.dependencies || {}).length,
  }, raw)
}

// project sdk-surface — checks the actual SDK is importable
function cmdProjectSdkSurface(cwd, raw) {
  const checks = []
  for (const pkg of ['@opencode-ai/sdk', '@opencode-ai/plugin']) {
    try {
      const resolved = require.resolve(pkg, { paths: [cwd] })
      checks.push({ package: pkg, installed: true, path: resolved })
    } catch {
      checks.push({ package: pkg, installed: false, path: null })
    }
  }
  output({
    passed: checks.every(c => c.installed),
    checks,
  }, raw)
}
```

This is inspired by how GSD's `cmdVerifyCommits` calls `git cat-file -t` to prove commits exist: [4-cite-2](#4-cite-2) 

**Layer 2: Planning Integrity** — Directly adapted from GSD's `validate consistency` and `validate health`: [4-cite-3](#4-cite-3) [4-cite-4](#4-cite-4) 

And GSD's `verify artifacts` which checks `must_haves.artifacts` exist with `min_lines`, `contains`, `exports`: [4-cite-5](#4-cite-5) 

**Layer 3: Git Evidence** — Adapted from GSD's `verify commits`: [4-cite-2](#4-cite-2) 

Plus `git status --porcelain`, `git log -1 --format=json`, `git diff --stat`.

**Layer 4: Architecture** — New, not in GSD. Uses `grep` and `fs` to scan:

```javascript
// arch src-domains — scan src/ top-level dirs
function cmdArchSrcDomains(cwd, raw) {
  const srcDir = path.join(cwd, 'src')
  const domains = fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const domainPath = path.join(srcDir, e.name)
      const files = execSync(
        `find "${domainPath}" -name "*.ts" -not -name "*.test.ts" | wc -l`,
        { encoding: 'utf-8' }
      ).trim()
      const loc = execSync(
        `find "${domainPath}" -name "*.ts" -not -name "*.test.ts" -exec cat {} + | wc -l`,
        { encoding: 'utf-8' }
      ).trim()
      const exports = execSync(
        `grep -r "^export " "${domainPath}" --include="*.ts" | wc -l`,
        { encoding: 'utf-8' }
      ).trim()
      return { domain: e.name, files: parseInt(files), loc: parseInt(loc), exports: parseInt(exports) }
    })
  output({ domains, total_domains: domains.length }, raw)
}
```

### The Gate Chain: Sequential Hard Stops

The `--gate-chain` flag is the key innovation. It runs gates in order and **stops at the first failure**:

```javascript
function cmdLandscapeGateChain(cwd, raw) {
  const gates = [
    { id: 'project-contracts', fn: () => cmdProjectContracts(cwd, true) },
    { id: 'project-dependencies', fn: () => cmdProjectDependencies(cwd, true) },
    { id: 'project-sdk-surface', fn: () => cmdProjectSdkSurface(cwd, true) },
    { id: 'project-build', fn: () => cmdProjectBuild(cwd, true) },
    { id: 'planning-exists', fn: () => cmdPlanningExists(cwd, true) },
    { id: 'planning-health', fn: () => cmdPlanningHealth(cwd, true) },
    { id: 'planning-consistency', fn: () => cmdPlanningConsistency(cwd, true) },
    { id: 'git-branch-state', fn: () => cmdGitBranchState(cwd, true) },
    { id: 'arch-src-domains', fn: () => cmdArchSrcDomains(cwd, true) },
  ]

  const results = []
  for (const gate of gates) {
    const result = JSON.parse(gate.fn())
    results.push({ gate: gate.id, ...result })
    if (!result.passed) {
      output({
        passed: false,
        blocked_at: gate.id,
        gates_passed: results.length - 1,
        gates_total: gates.length,
        results,
      }, raw)
      return
    }
  }
  output({ passed: true, gates_passed: gates.length, gates_total: gates.length, results }, raw)
}
```

This is the "can't execute unless the previous gate resolves" pattern you described. The agent sees:

```json
{
  "passed": false,
  "blocked_at": "project-dependencies",
  "gates_passed": 1,
  "gates_total": 9,
  "results": [
    { "gate": "project-contracts", "passed": true, "pkg_name": "hivemind-context-governance" },
    { "gate": "project-dependencies", "passed": false, "missing": ["@opencode-ai/sdk@0.2.0"] }
  ]
}
```

No amount of "I think it's fine" can override this. The script ran `npm ls --json` and the dependency is missing.

### How It Integrates as a Context-Entry Skill

The skill structure:

```
skills/context-entry-verify/
├── SKILL.md                    # Skill definition + triggers
├── scripts/
│   └── hm-verify.cjs          # The single script (zero deps, CommonJS)
├── references/
│   ├── gate-definitions.md     # What each gate checks
│   └── gate-chain-order.md     # Why this order matters
└── templates/
    └── gate-report.md          # Template for gate verdict output
```

The SKILL.md triggers:

```yaml
---
name: "context-entry-verify"
description: "Use when starting work, before execution, at gate checkpoints, or when verifying completion claims. Runs deterministic scripts that produce hard proof from real project state."
---
```

The agent calls it via OpenCode's `bash` tool: [4-cite-6](#4-cite-6) 

```bash
node skills/context-entry-verify/scripts/hm-verify.cjs landscape --gate-chain --raw
```

### How It Chains for the Full Landscape

The `landscape` command chains all gates and produces a unified report:

```json
{
  "passed": true,
  "timestamp": "2026-03-19T10:30:00Z",
  "project": {
    "name": "hivemind-context-governance",
    "version": "2.9.5",
    "sdk_installed": true,
    "build_clean": true,
    "tests_pass": true
  },
  "planning": {
    "exists": true,
    "health": "healthy",
    "consistency": "passed",
    "phase_count": 3,
    "active_phase": 2
  },
  "git": {
    "branch": "2.9.5-harness-dev",
    "clean": false,
    "uncommitted_files": 4,
    "last_commit": "abc1234"
  },
  "architecture": {
    "src_domains": 18,
    "total_loc": 12500,
    "dead_exports": 23,
    "circular_deps": 2
  },
  "verdict": "DEGRADED",
  "blockers": ["git.clean=false", "architecture.circular_deps=2"]
}
```

This is the "bigger picture" — the agent sees the full landscape in one JSON blob and knows exactly what's real and what's broken.

### What Makes This Different from the Existing Gate Concepts

Your repo already has extensive gate documentation: [4-cite-7](#4-cite-7) [4-cite-8](#4-cite-8) [4-cite-9](#4-cite-9) 

But these are **markdown instructions telling the agent what to check**. The agent can read them and then hallucinate "tests pass" without running anything. Your `hm-verify.cjs` is the opposite — it's a **script that runs the checks and returns JSON**. The agent can't fake the output because it comes from `bash` tool execution, not from the agent's own text generation.

GSD proved this works. Their `gsd-plan-checker` agent calls `gsd-tools.cjs verify plan-structure` and gets back hard JSON: [4-cite-10](#4-cite-10) [4-cite-11](#4-cite-11) 

The plan-checker **cannot approve a plan** unless the script says `valid: true`. That's the pattern.