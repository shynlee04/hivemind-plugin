# Gate Definitions

## Layer 1: Project Reality Gates (Hard - Block on Fail, official-boundary-facing)

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `project contracts` | package.json has name, version, main fields | All three present |
| `project dependencies` | npm ls --json shows no missing/invalid deps | 0 missing, 0 invalid |
| `project sdk-surface` | @opencode-ai/sdk and @opencode-ai/plugin importable | Both installed |
| `project build` | tsc --noEmit passes | 0 errors |
| `project tests` | npm test passes | 0 failures |

## Layer 2: Planning Integrity Gates (Project-Specific internal convention)

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `planning exists` | .planning/ directory exists | true |
| `planning health` | STATE.md, ROADMAP.md, REQUIREMENTS.md exist | All present |
| `planning consistency` | Phase dirs match ROADMAP.md | 0 missing dirs |

> These gates assume the project uses the `.planning/` convention. In projects without that convention, treat these results as internal policy diagnostics rather than universal blockers or SDK/API proof.

## Layer 3: Git Evidence Gates (Hard - Block on Fail)

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `git branch-state` | git status --porcelain is empty | Clean tree |
| `git last-commit` | git log -1 returns valid data | Hash, message, author present |
| `git diff-stat [ref]` | git diff --stat returns output | Valid stat output |

## Layer 4: Architecture Gates (Soft - Always Pass, Warnings Only)

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `arch src-domains` | LOC, files, exports per src/ domain | Always passes |
| `arch dead-exports` | Exported symbols with <2 consumers | Always passes (warning) |
| `arch circular-deps` | Circular import chains | Always passes (warning) |

## Compound Commands

| Command | Behavior | Blocks? |
|---------|----------|----------|
| `gate-chain` | Sequential fail-fast through official-boundary project gates, `git branch-state`, and project-specific planning checks | YES, but planning failures may be internal-policy-specific |
| `landscape` | Runs all gates, returns unified verdict | NO |
