# RICH Resource Rationale — hm-planning-with-files

## Scope

This package provides durable file-backed planning (`task_plan.md`, `findings.md`, `progress.md`) for complex work and cross-session recovery. It should not trigger for trivial one-step tasks.

## Third-Party / External Source Scorecard

| Source | Discovery method | Reviewed material | Bundled-resource result | Decision |
|---|---|---|---|---|
| `charon-fan/agent-playbook@planning-with-files` | `npx skills find "planning with files agent skill"` | File-backed planning concept and recovery style | Relevant top source; full local bundle diff unavailable in this closure pass. | ADAPT |
| `davila7/claude-code-templates@planning-with-files` | skills.sh metadata | Template-oriented durable planning pattern | Useful template lineage; no verified resource crawl in current workspace. | ADAPT |
| `mxyhi/ok-skills@planning-with-files` | skills.sh metadata | Similar three-file planning workflow | Useful corroborating lineage; no verified resource crawl in current workspace. | DEFER |

## Pattern Alternatives

1. **Three-file memory** — adopted: plan, findings, progress.
2. **Single mega-plan file** — rejected because it mixes facts, state, and todos.
3. **Chat-only planning** — rejected for multi-session or recovery-sensitive work.

## Bundled Resources

- `references/file-templates.md` — concrete file templates.
- `references/phase-schemas.md` — schema guidance for phase/state artifacts.
- `references/session-context-protocol.md` — recovery/handoff protocol.
- `references/rich-resource-rationale.md` — source scorecard and RICH closure evidence.
- `evals/evals.json` — trigger and recovery pressure scenarios.
- `scripts/validate-skill.sh` — static package validator.

## Independence Audit

PASS. The skill can run in arbitrary projects by creating local markdown state files in a user-approved working area. It has no dependency on `.planning/` unless the user/project already uses it.

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS WITH RATIONALE | Top-3 lineage selected and crawl limitations explicitly documented. |
| RICH-5 | PASS | Domain templates, phase schemas, session protocol, evals, and validator bundled. |
| RICH-8 | PASS | RICH scorecard now integrated into local package resources. |
