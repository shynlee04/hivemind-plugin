# Deferred Items

## 2026-03-17 - Plan 01-01 verification blockers

- `npx tsc --noEmit` fails in pre-existing, unrelated surfaces outside the 01-01 scope.
- Current blockers include repo-wide `@opencode-ai/plugin` typing mismatches in untouched tool modules (`src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, `src/tools/trajectory/tools.ts`) and missing OpenTUI module/types across `src/tui/**`.
- These failures were not introduced by the managed-runtime authority changes in 01-01, so they were not auto-fixed under the current plan scope.
