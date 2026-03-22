# Root Skill Transfer Index

## Purpose
- Snapshot the user-pinned root HiveMind skill packages into audit space without changing runtime authority.
- Keep the copied set bounded to the packages the user said will be moved straight into `.opencode` later.

## Transfer Output
- Snapshot root: `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/`

## Copied Packages
| Skill | Snapshot Path | Workspace Status | Notes |
| --- | --- | --- | --- |
| `agent-role-boundary` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/agent-role-boundary/` | root snapshot only | has `references/`, `templates/` |
| `context-entry-verify` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/context-entry-verify/` | audited + isolated refactor exists | root package also has `scripts/`, `tests/` |
| `context-intelligence-entry` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/context-intelligence-entry/` | audited + isolated refactor exists | root package has `references/`, `schemas/`, `scripts/` |
| `git-atomic-memory` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/git-atomic-memory/` | root snapshot only | has `references/`, `tests/` |
| `hivemind-delegation-write` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/hivemind-delegation-write/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |
| `hivemind-skill-write` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/hivemind-skill-write/` | root snapshot only | has `references/` |
| `spec-distillation` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/spec-distillation/` | audited + isolated refactor exists | root package also has `scripts/`, `templates/`, `tests/` |
| `use-hivemind` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind/` | root snapshot only | markdown-only entry package |
| `use-hivemind-context-integrity` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-context-integrity/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |
| `use-hivemind-context-verify` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-context-verify/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |
| `use-hivemind-delegation` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-delegation/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |
| `use-hivemind-detox-refactor` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-detox-refactor/` | root snapshot only | markdown-first router package |
| `use-hivemind-git-memory` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-git-memory/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |
| `use-hivemind-hierarchy` | `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-hierarchy/` | root snapshot only | has `references/`, `schemas/`, `scripts/`, `templates/` |

## Runtime Truth
- These audit-space copies do not change runtime behavior.
- Runtime discovery still reads only from root `skills/`.
- Runtime projection still mirrors markdown surfaces only into `.opencode/skills/**`.

## Follow-On Use
- Use this snapshot set for isolated audit, diffing, pruning, and package-local refactor planning.
- Upstream only from verified isolated/refactored package surfaces, not from raw snapshot copies.
