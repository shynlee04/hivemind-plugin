# Phase 60: Harness → Hivemind Rename — Specification

**Created:** 2026-06-07
**Ambiguity score:** 0.17 (gate: ≤ 0.20)
**Requirements:** 6 locked

## Goal

All public API symbols, error infrastructure, log prefixes, documentation, and internal references use "Hivemind" instead of "Harness" as the project name, while preserving generic uses of "harness" (e.g., test harness, harness architecture concept).

## Background

The project's canonical identity is **Hivemind** (per P0-ID, `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`). The codebase retains "Harness" in multiple locations from a prior naming convention. Specifically:

- **Public API** (`src/plugin.ts`, `src/index.ts`): `HarnessControlPlane` is the Plugin export — 37 occurrences
- **Lifecycle manager** (`src/task-management/lifecycle/index.ts`): `HarnessLifecycleManager` class + `createHarnessLifecycleManager` factory — 27 occurrences
- **Error infrastructure** (`src/shared/errors/harness-error.ts`): `HarnessError` class + `isHarnessError` helper — file rename + 12 occurrences
- **Error message prefix**: 374 `[Harness]` string literals in `src/` across 105 files + 161 in `tests/`
- **Capability-gate source tag**: `source: "harness"` in `src/features/capability-gate/index.ts:21-46` (26 tool entries)
- **Documentation**: `.planning/` and `src/` `.md` files referring to "the Harness"

Phase 35 (C8) already removed `HarnessStatus` type and `delegationStatusToHarnessStatus` — those are confirmed absent.

## Requirements

1. **Public API rename**: Export symbols use "Hivemind" instead of "Harness".
   - Current: `HarnessControlPlane` exported from `src/plugin.ts:117` and `src/index.ts:1-2`
   - Target: `HivemindControlPlane` exported from `src/plugin.ts:500` and `src/index.ts:1-2` (with backward-compatible deprecated alias for breaking-change cadence)
   - Acceptance: `grep -rn "HarnessControlPlane" src/` returns 0 matches in non-comment code; `grep -rn "HivemindControlPlane" src/plugin.ts src/index.ts` returns the renamed symbol; `npm run typecheck` passes

2. **Lifecycle manager rename**: Class and factory use "Hivemind" instead of "Harness".
   - Current: `HarnessLifecycleManager` class (line 71) + `HarnessLifecycleManagerOptions` type (line 20) + `createHarnessLifecycleManager` factory (line 238) in `src/task-management/lifecycle/index.ts`
   - Target: `HivemindLifecycleManager`, `HivemindLifecycleManagerOptions`, `createHivemindLifecycleManager` — all consumers updated (6 import sites in src/)
   - Acceptance: `grep -rn "HarnessLifecycleManager\|createHarnessLifecycleManager" src/` returns 0 matches; all imports updated; `npm run typecheck` passes

3. **Error infrastructure rename**: File, class, and helper functions use "Hivemind" instead of "Harness".
   - Current: `src/shared/errors/harness-error.ts` contains `HarnessError` class (line 18) with `name = "HarnessError"` (line 36) and prepends `[Harness]` prefix (line 34); `src/shared/session-api.ts:333` exports `isHarnessError()` — consumed by `commands.ts` (6 subclasses) and `session-api.ts:344`
   - Target: File renamed to `src/shared/errors/hivemind-error.ts`, class renamed to `HivemindError`, helper renamed to `isHivemindError`, error name set to `"HivemendError"`, all imports updated
   - Acceptance: `grep -rn "harness-error\|HarnessError\|isHarnessError" src/` returns 0 matches; `grep -rn "hivemind-error\|HivemindError\|isHivemindError" src/` shows renamed symbols; `npm run typecheck && npm test` passes

4. **Error message prefix replacement**: All `[Harness]` error/log strings replaced with `[Hivemind]`.
   - Current: 374 `[Harness]` occurrences in `src/` (105 files) and 161 in `tests/` (assertions on the prefix)
   - Target: All non-comment `[Harness]` string literals changed to `[Hivemind]`; test assertions updated to match
   - Acceptance: `grep -rn '\[Harness\]' src/ tests/ --include="*.ts" | grep -v node_modules | grep -v "^\s*//" | grep -v "^\s*\*"` returns 0 matches; `npm test` passes with no regression

5. **Capability-gate source tag**: `source: "harness"` changed to `source: "hivemind"` in the tool authority matrix.
   - Current: 26 tool entries in `src/features/capability-gate/index.ts:21-46` have `source: "harness"`; the union type in `src/features/capability-gate/types.ts:13` is `readonly source: "built-in" | "harness"`
   - Target: All 26 entries changed to `source: "hivemind"`; union type changed to `"built-in" | "hivemind"`
   - Acceptance: `grep -rn 'source: "harness"' src/features/capability-gate/` returns 0 matches; `grep -rn 'source: "hivemind"' src/features/capability-gate/` shows 26 entries; `npm run typecheck` passes

6. **Documentation + comments**: `.planning/` and `src/` `.md` files updated to use "Hivemind" where "Harness" refers to the project name.
   - Current: `.planning/` phase docs and `src/` `*.md` files reference "the Harness" in project-name context
   - Target: Project-name references changed to "Hivemind"; generic "harness" (architecture concept, test harness) left unchanged
   - Acceptance: Key docs scanned for project-name "Harness" → changed to "Hivemind"; grep for common patterns confirms no project-name misspellings remain

## Boundaries

**In scope:**
- Public API rename: `HarnessControlPlane` → `HivemindControlPlane` in `src/plugin.ts` + `src/index.ts` (exports + import)
- Lifecycle manager rename: `HarnessLifecycleManager` → `HivemindLifecycleManager` in `src/task-management/lifecycle/index.ts` + all 6 consumer import sites
- Error infrastructure: `harness-error.ts` → `hivemind-error.ts`, `HarnessError` → `HivemindError`, `isHarnessError` → `isHivemindError`
- Error prefix: 374 `[Harness]` → `[Hivemind]` in `src/` (across 105 files)
- Test assertions: 161 `[Harness]` → `[Hivemind]` in `tests/`
- Capability-gate source tag: 26 entries + 1 type definition
- Documentation (`*.md`) in `.planning/` and `src/` — project-name "Harness" → "Hivemind"
- Renamed file: `src/shared/errors/harness-error.ts` → `src/shared/errors/hivemird-error.ts`

**Out of scope:**
- `HarnessStatus` type and `delegationStatusToHarnessStatus` — already removed in Phase 35 (C8)
- Variables like `harnessDir`, `harnessConfig` that refer to directory paths or generic concepts — not project-name references
- Third-party SDK references — not our code to rename
- The `src/task-management/lifecycle/` directory name — directory is about lifecycle, not "Harness"
- `src/features/tmux/` generic "harness" concept references — only if they refer to project name
- Phase 22 SPEC.md references to `HarnessStatus` — those are historical and the type was removed in Phase 35

## Constraints

- **Backward-compatible export**: `HivemindControlPlane` must be the primary export; if a breaking-change minor bump is acceptable, keep no deprecated alias. If semver policy requires backward compat, add `HarnessControlPlane` as a deprecated re-export with a `@deprecated` JSDoc tag. (Discussed in CONTEXT.md Item 1 — decision pending for discuss-phase.)
- **Module size cap**: The `lifecycle/index.ts` file is already at 241 LOC — adding alias patterns must not push it over 500 LOC.
- **Test evidence**: `npm run typecheck` and `npm test` must both pass after rename — no regression allowed.
- **File rename safety**: Renaming `harness-error.ts` → `hivemind-error.ts` requires updating the import chain: `commands.ts → harness-error.ts`, `session-api.ts → harness-error.ts` (indirect via `isHarnessError`).

## Acceptance Criteria

- [ ] `grep -rn "HarnessControlPlane" src/` returns 0 matches in executable code
- [ ] `grep -rn "HarnessLifecycleManager\|createHarnessLifecycleManager" src/` returns 0 matches
- [ ] `src/shared/errors/harness-error.ts` no longer exists; `src/shared/errors/hivemind-error.ts` exists with `HivemindError` class
- [ ] `grep -rn "isHarnessError" src/` returns 0 matches; `grep -rn "isHivemindError" src/` returns references
- [ ] `grep -rn '\[Harness\]' src/ tests/ --include="*.ts" | grep -v node_modules` returns 0 matches
- [ ] `grep -rn 'source: "harness"' src/features/capability-gate/` returns 0 matches
- [ ] `grep -rn 'source: "hivemind"' src/features/capability-gate/ | wc -l` returns 26 (or the correct count of tool entries)
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes with same pass/fail ratio as before rename (no regressions)
- [ ] Key `.planning/` and `src/` `.md` files scanned for project-name "Harness" changed to "Hivemind"

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                      |
|--------------------|-------|------|--------|--------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | 6 concrete items, each measurable          |
| Boundary Clarity   | 0.82  | 0.70 | ✓      | Explicit non-goals, but doc scope is broad |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Backward-compat decision deferred to discuss |
| Acceptance Criteria| 0.73  | 0.70 | ✓      | 10 pass/fail criteria, grep-verifiable     |
| **Ambiguity**      | 0.17  | ≤0.20| ✓      | Gate passed in --auto mode                 |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1     | Researcher  | Codebase scout confirmed 374 [Harness] src/ matches in 105 files, 161 in tests/ | Scope: Item 1-6 as defined in P60-CONTEXT.md |
| —     | —           | `--auto` mode: ambiguity (0.17) ≤ 0.20 — skipped interactive interview | SPEC.md derived directly from CONTEXT.md + codebase audit |

---

*Phase: 60-harness-to-hivemind-rename*
*Spec created: 2026-06-07*
*Next step: /hm-discuss-phase 60 — implementation decisions (batch strategy, backward-compat policy, commit sequencing)*
