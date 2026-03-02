---
id: "META02-SUB01"
parent: "META02"
status: "completed"
priority: "high"
scope: "meta"
type: "sub"
tags: ["plugin-cleanup", "path-migration", "stale-deletion"]
symlink_context: ".hivemind/context/META02-SUB01-synthesis.md"
validation_log: ".hivemind/plans/VALIDATION-META02-SUB01.md"
created: "2026-03-03T05:26:48Z"
last_sync: "2026-03-03T05:26:48Z"
completion_criteria:
  - "All 28 'plugins/' references updated to 'plugin/' across 10 files."
  - ".opencode/plugins/ directory deleted."
  - "No broken path references remain (grep verification)."
  - "Validation artifact has evidence (grep output)."
---

# META02-SUB01 — Stale Plugin Path Cleanup

## Context Summary
<!-- SECTION: CONTEXT_SUMMARY -->
`.opencode/plugins/hiveops-governance/` (plural) is a stale copy of `.opencode/plugin/hiveops-governance/` (singular). The singular version is SDK-aligned v2 with bug fixes. 28 path references across 10 files still point to the stale plural path.

## Files to Update
<!-- SECTION: EXECUTION_BLOCK -->

| # | File | Lines | Action |
|---|------|-------|--------|
| 1 | `.opencode/agents/hivefiver.md` | 517-523 | `plugins/` → `plugin/` |
| 2 | `agents/hivefiver.md` | 517-523 | `plugins/` → `plugin/` (parity mirror) |
| 3 | `.opencode/agents/hiveplanner.md` | 301 | `plugins/` → `plugin/` |
| 4 | `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md` | 113, 225 | `plugins/` → `plugin/` |
| 5 | `docs/plans/2026-03-02-hiveops-tdd-plan.md` | 157 | `plugins/` → `plugin/` |
| 6 | `docs/plans/2026-03-02-gx-pack-R2-fix-state-persistence-plan.md` | 391, 392, 430 | `plugins/` → `plugin/` |
| 7 | `docs/plans/2026-03-02-gx-pack-R1-fix-measurement-plan.md` | 420, 437, 467 | `plugins/` → `plugin/` |
| 8 | `.hivemind/hive-modules/gx-pack/STATE.md` | 151, 152 | `plugins/` → `plugin/` |
| 9 | `.opencode/skills/gx-context-engine/tests/test-r2-integration.sh` | 191 | `plugins/` → `plugin/` |
| 10 | `.opencode/skills/gx-context-engine/tests/test-r2-06-compaction-hook.sh` | 58 | `plugins/` → `plugin/` |

## Verification
<!-- SECTION: VERIFICATION -->
After all updates: `grep -r "plugins/hiveops-governance" --include="*.md" --include="*.sh" --include="*.ts" .` must return 0 results (excluding .git, node_modules, docs/research, session logs).

## Notes Footer
<!-- SECTION: NOTES_FOOTER -->
- Non-critical matches in session logs, research docs, and specs left as-is (historical).
- Canonical evidence: plugin/ version has "SDK-ALIGNED v2" header, smoke tests, documented bug fixes.
