# Plan #9 Revision 1 — Delta

**Base:** plan-9.md (2026-03-24)
**Revision:** 1
**Trigger:** HiveQ verification (plan-9-hiveq-verify.md) — scope inconsistency flagged
**Date:** 2026-03-24

---

## Changes Summary

| # | Section | Change | Reason |
|---|---------|--------|--------|
| 1 | Scope Boundaries — In Scope | Remove "Wire handlers into `src/plugin/opencode-plugin.ts` hook registration" | Conflicts with Out of Scope claim. Plugin wiring is Plan 10 territory. |
| 2 | Scope Boundaries — Out of Scope | Add "Plugin wiring in `opencode-plugin.ts` (deferred to Plan 10)" | Explicit deferral clarifies scope. |
| 3 | File Artifacts table | Remove `src/plugin/opencode-plugin.ts` (edit) row | No longer in scope. |
| 4 | Steps | Remove Step 7 (plugin wiring) entirely | HiveQ blocker — scope inconsistency. |
| 5 | Steps | Renumber Step 8 → Step 7 (verification), Step 9 → Step 8 (commit) | Gap after Step 6 removed. |
| 6 | Step 7 (was 8) verification | Remove `opencode-plugin.ts` from commit `git add` list | No longer modified. |
| 7 | Step 8 (was 9) commit | Update commit message to exclude plugin reference | `feat(hook-handlers): create session journal handler modules` |
| 8 | Test Requirements | Remove 3 plugin wiring test rows | No plugin tests in this plan. |
| 9 | Verification Criteria | Remove "opencode-plugin.ts still ≤ 300 LOC" | Not modified. |
| 10 | Verification Criteria | Remove "Existing test suite passes (no regressions from plugin edits)" | No plugin edits. |
| 11 | Risks | Remove "Plugin LOC exceeds 300 after wiring" row | Not applicable. |
| 12 | text-complete-handler.ts | Fix `as any` cast on purposeClass | HiveQ flagged LOW severity. Use `PURPOSE_CLASS_VALUES.includes()` type guard for proper narrowing. |
| 13 | Note | Add scope note: "Plugin wiring deferred to Plan 10 (Migration + Plugin Wiring)" | Clarifies handoff to next plan. |

## No-Change Sections

- Objective (minor reword only — "bridge the gap" stays)
- Dependencies (unchanged)
- Architecture Decisions A–E (unchanged)
- Steps 1–6 (unchanged except `as any` fix in Step 4)

## Verification

- HiveQ scope inconsistency blocker → **RESOLVED** (Step 7 removed)
- `as any` type-safety gap → **RESOLVED** (type guard in implementation)
- AGENTS.md charter gap → **NOT IN SCOPE** (pre-existing, separate action)
