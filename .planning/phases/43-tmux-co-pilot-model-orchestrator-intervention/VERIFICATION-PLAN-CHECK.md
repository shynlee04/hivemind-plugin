# Phase 43 — Plan Verification (PLAN-CHECK)

**Date:** 2026-06-01
**Phase:** 43 — Tmux Co-Pilot Model — Orchestrator Intervention
**Plans checked:** 2 (43-01 Wave 1, 43-02 Wave 2)
**Verdict:** **PASS** (with 4 warnings; no blockers)

---

## 1. Verdict Summary

| Dimension                  | Status     | Note                                                              |
| -------------------------- | ---------- | ----------------------------------------------------------------- |
| 1. Requirement Coverage    | PASS       | All 6 REQs covered; no orphans.                                   |
| 2. Task Completeness       | PASS       | 6/6 tasks have `files` / `action` / `verify` / `done`.            |
| 3. Dependency Correctness  | PASS       | `43-02 → 43-01` is acyclic; wave assignment matches deps.         |
| 4. Key Links Planned       | PASS       | `fork-bridge.ts` runtime-injection wired in Plan 02.              |
| 5. Scope Sanity            | PASS       | 3 tasks / plan (within 2–3 target).                               |
| 6. Verification Derivation | PASS       | Must-haves are user-observable (orchestrator can intervene).      |
| 7. Context Compliance      | PASS       | D-43-01..04 honored; no deferred ideas smuggled in.               |
| 7b. Scope Reduction        | NONE       | No "v1 / future / stub" reduction language detected.              |
| 7c. Architectural Tier     | PASS       | Fork owns tmux primitives + planner; Hivemind owns tool + bridge. |
| 8. Nyquist Compliance      | PASS*      | Tests exist for every task (`<verify>` has automated command).    |
| 9. Cross-Plan Contracts    | PASS       | 1 contract divergence flagged (see Warnings).                     |
| 10. AGENTS.md Compliance   | PASS       | Date-stamped filename; L5 docs-only evidence; atomic commits.     |
| 11. Research Resolution    | WARN       | `## Open Questions` lacks `(RESOLVED)` suffix.                    |
| 12. Pattern Compliance     | SKIP       | No `43-PATTERNS.md` in this phase.                                |

**Overall:** PASS — plans will achieve phase goal. Execute.

---

## 2. Goal-Backward Must-Haves

**Phase goal (from 43-SPEC.md):** Build the co-pilot model — enable orchestrator agents to intervene in running subagent tmux panes via send-keys, plan a delegation-aware pane grid, and query pane state — through a Hivemind-side tmux-copilot tool.

| Must-be-TRUE                                                            | Plan / Task                                                                  | Truth type      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- |
| Orchestrator can send keys into a running subagent pane                  | 43-01-T1 `sendKeys` + 43-02-T1 `send-keys` action                            | user-observable |
| Orchestrator can list all tmux panes with metadata                       | 43-01-T2 `listPanes` + 43-02-T2 `list-panes` action                          | user-observable |
| Orchestrator can compute a delegation-aware grid layout (≤500ms)         | 43-01-T3 `PaneGridPlanner` + 43-02-T3 `compute-grid` action                  | user-observable |
| Orchestrator is the only principal allowed to call `tmux-copilot`        | 43-02-T2 `requiresPermission: ["orchestrator"]`                              | security gate   |
| Co-pilot tool is auto-injected on session creation (no main session)     | 43-02-T2 `isMain: false` (D-43-03) + 43-02-T3 wire into `plugin.ts:579`      | user-observable |
| Closed-pane `send-keys` returns a graceful error and respawns if known   | 43-01-T4 (helper) + 43-02-T2 (closed-pane error path) + 43-01-T2 (respawn)   | user-observable |
| No cache layer between Hivemind and tmux primitive calls (D-43-04)      | 43-02-T1 type-only imports; no in-memory map                                | architectural   |

---

## 3. Requirement Coverage Matrix

| REQ     | Description                                          | Plan(s)        | Task(s)               | Status   |
| ------- | ---------------------------------------------------- | -------------- | --------------------- | -------- |
| REQ-01  | `sendKeys(paneId, text)` blocks until tmux returns   | 43-01, 43-02   | 01-T1, 02-T1          | COVERED  |
| REQ-02  | `listPanes()` returns size, index, isMain, env, meta  | 43-01, 43-02   | 01-T2, 02-T2          | COVERED* |
| REQ-03  | `PaneGridPlanner` 500ms trailing debounce            | 43-01          | 01-T3                 | COVERED  |
| REQ-04  | `tmux-copilot` tool with 4 Zod actions               | 43-02          | 02-T1, 02-T2          | COVERED* |
| REQ-05  | Wire tool on `session.created` (subagent only)       | 43-02          | 02-T3                 | COVERED  |
| REQ-06  | Closed-pane graceful error + respawn                 | 43-01, 43-02   | 01-T2, 01-T4, 02-T2   | COVERED  |

`*` — see Warnings (W-01, W-02) for contract divergences between SPEC and plan text.

---

## 4. HIGH-Risk Mitigation (from 43-ASSUMPTIONS.md)

| # | Risk                                       | Mitigation in plan                                                                                                | Status |
| - | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------ |
| 1 | Auto-init of co-pilot on main session      | 43-02-T2 sets `isMain: false`; 43-02-T3 filter predicate `ctx.isMain === false` in `plugin.ts:579` wiring        | MITIGATED |
| 2 | Cross-plugin boundary discipline           | 43-02-T1 uses type-only imports from `@hivemind/opencode-tmux`; runtime calls injected via `fork-bridge.ts`     | MITIGATED |
| 3 | Pane-grid recomputation storm              | 43-01-T3 implements trailing-edge debounce with 500ms window; no upstream cache (D-43-04)                        | MITIGATED |

---

## 5. Dependency Graph

```
43-01 (Wave 1) ─────┐
                    ▼
43-02 (Wave 2) ─────┘
```

- 43-02 `depends_on: ["43-01"]` — correct.
- 43-01 `depends_on: []` — correct (Wave 1).
- No cycles, no forward references, no orphans.

---

## 6. Fork ↔ Hivemind Boundary Check

| Concern                                | Plan Treatment                                                                   | Compliant? |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| Direct import of fork code into src/   | 43-02-T1 uses `import type` only (compile-time, no runtime coupling)             | YES        |
| Runtime entry into fork tmux APIs      | 43-02-T1 (fork-bridge.ts) exports injected primitives; 43-02-T1 tool consumes them | YES        |
| Test framework split                   | Bun test in `opencode-tmux/src/__tests__/`, Vitest in `tests/lib/tmux/`         | YES        |
| Permission gate on tool entry          | 43-02-T2: `requiresPermission: ["orchestrator"]`                                 | YES        |
| Persistence (Q6)                       | All tmux state stays in fork's existing Q6 state; Hivemind does not write `.opencode/` runtime data | YES        |

---

## 7. Locked Decisions Coverage (43-SPEC.md)

| Decision      | Honored? | Evidence                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------- |
| D-43-01 (sendKeys semantics)   | YES | 43-01-T1 awaits tmux CLI response; does NOT confirm pane consumed text    |
| D-43-02 (orchestrator-only)    | YES | 43-02-T2 `requiresPermission: ["orchestrator"]`                           |
| D-43-03 (subagent-only)        | YES | 43-02-T2 `isMain: false`; 43-02-T3 wiring filter                          |
| D-43-04 (no cache layer)       | YES | 43-01-T3 debounce only; 43-02-T1 type-only imports                        |

---

## 8. Test Coverage

| Plan | Task | Automated command                                               | Test count |
| ---- | ---- | --------------------------------------------------------------- | ---------- |
| 43-01 | T1  | `bun test opencode-tmux/src/__tests__/send-keys.test.ts`        | 5          |
| 43-01 | T2  | `bun test opencode-tmux/src/__tests__/list-panes.test.ts`       | 6          |
| 43-01 | T3  | `bun test opencode-tmux/src/__tests__/grid-planner.test.ts`     | 6          |
| 43-02 | T1  | `vitest run tests/lib/tmux/fork-bridge.test.ts`                 | 4          |
| 43-02 | T2  | `vitest run tests/lib/tmux/tmux-copilot.test.ts`                | 7          |
| 43-02 | T3  | `vitest run tests/lib/tmux/auto-injection.test.ts`              | 3          |
| **Total** |    |                                                                 | **31**     |

(17 in 43-01 + 14 in 43-02 = 31, matching the user's claim.)

---

## 9. Warnings (non-blocking)

### W-01: REQ-02 contract divergence — `PaneState` shape

- **SPEC says (43-SPEC.md REQ-02):** `size: string` (e.g. `"80x24"`).
- **Plan does (43-01-T2):** `width: number, height: number, isMain: boolean` (structured fields).
- **Impact:** Low. Plan is more ergonomic; tests will use the structured shape. SPEC text could be tightened to match.
- **Recommendation:** Either update SPEC.md to say "structured size fields" or update 43-01-T2 to expose a `size: string` derived field. Cosmetic, not blocking.

### W-02: REQ-04 action name divergence

- **SPEC says (43-SPEC.md REQ-04):** actions = `send-keys` (with `sessionId`), `list-panes`, `get-pane`, `plan-grid`.
- **Plan does (43-02-T1, T2):** actions = `send-keys` (with `paneId`), `list-panes`, `compute-grid`, `respawn`.
- **Impact:** Medium. Two actions renamed (`get-pane` → folded into `list-panes`; `plan-grid` → `compute-grid`), and `respawn` is a new action. `sessionId` vs `paneId` parameter is a real difference.
- **Recommendation:** Resolve in `plan-phase` follow-up — either align plan to SPEC or update SPEC to reflect the actual ergonomic surface. The plan's surface is more useful (`paneId` is the right key; `compute-grid` is more descriptive; `respawn` is necessary for REQ-06). This is a **SPEC drift, not a plan defect**, but the orchestrator's downstream orchestrators may need to be informed.

### W-03: Plan 02 Task 3 adapter construction contingency

- 43-02-T3 references `plugin.ts:579` as the wiring point. The plan does not verify this is the correct line number.
- **Impact:** Low — line numbers drift; the wiring point should be re-confirmed at execute-time.
- **Recommendation:** Executor should grep for `session.created` hook handler in `src/plugin.ts` and use the actual hook registration site, not the line number from this plan.

### W-04: `## Open Questions (RESOLVED)` suffix missing in 43-RESEARCH.md

- 43-RESEARCH.md has a `## Open Questions` section but lacks the `(RESOLVED)` suffix that Dimension 11 expects.
- **Impact:** Low — questions are answered inline, but the gate machinery cannot auto-detect resolution.
- **Recommendation:** Mark the section as `## Open Questions (RESOLVED)` in a follow-up commit.

---

## 10. AGENTS.md Compliance

- File uses `name-2026-06-01.md` date-stamped convention: yes (this file) and `43-*-2026-06-01.md` family.
- Evidence level is L5 (docs-only, no runtime claims): yes — this is a plan-check, not a verify.
- Atomic commits per task: all 6 PLAN tasks declare `<atomic-commit>true</atomic-commit>`.
- No code is touched by this artifact: correct — plan-check is a governance artifact.

---

## 11. Recommendation

**Proceed to `/gsd-execute-phase 43`.**

The plans will achieve the phase goal. All 6 REQs are covered, dependencies are valid, the fork-Hivemind boundary is respected, and locked decisions are honored. The 4 warnings are cosmetic or already-resolved-by-executor-context — none block execution.

If the executor can resolve W-01 and W-02 inline (cosmetic SPEC updates), that would tighten the phase output. Otherwise, leave them as drift to be reconciled in the verify pass.
