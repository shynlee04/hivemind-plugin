# Phase 02: V3 Runtime Architecture — Plan Verification Report

**Verified:** 2026-04-06
**Plans checked:** 8
**Overall status:** ❌ ISSUES FOUND — 3 blockers, 5 warnings, 2 info

---

## Per-Plan Assessment

### Plan 01 (02-01) — Concurrency Control (RUN-3c)
**Status:** ✅ PASS (with 1 warning)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3c AC#1–5 all covered by tasks |
| Task quality | ✅ | 2 tasks, specific actions, clear done criteria |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 1, no deps — correct |
| File correctness | ✅ | `concurrency.ts` exists (98 LOC), `types.ts` exists, `concurrency.test.ts` is new |
| Must-haves | ✅ | Truths are user-observable, artifacts map to truths |
| Threat model | ✅ | STRIDE covers tampering, DoS, EoP |
| Scope | ✅ | 2 tasks, 3 files — well within budget |
| Decision coverage | ⚠️ | Covers D-15 only. Does NOT cover D-16 (tool budgets use OpenCode built-in mechanisms) |

**Warning:** D-16 not referenced. Plan 01 adds concurrency config but D-16 says "custom concurrency only supplements what OpenCode doesn't provide natively." The plan should acknowledge this constraint in its action (e.g., note that the queue supplements OpenCode's lack of per-key concurrency, not replaces anything OpenCode already provides).

---

### Plan 02 (02-02) — Circuit Breaker (RUN-3h)
**Status:** ✅ PASS (with 1 warning)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3h AC#1–6 all covered |
| Task quality | ✅ | 2 tasks, specific: extract constants, wire into plugin, reset on compact |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 1, no deps — correct (builds on existing plugin.ts) |
| File correctness | ✅ | `budget-config.ts` (new), `plugin.ts` exists (468 LOC), `types.ts` exists |
| Must-haves | ✅ | Configurable thresholds, reset on compact, warning preservation |
| Threat model | ✅ | STRIDE covers DoS, EoP, Repudiation |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ✅ | Covers D-08, D-09, D-10, D-11 — all budget decisions |

**Warning:** `tests/plugin-budget.test.ts` is referenced in Task 2 but `tests/` directory currently has no `plugin-*.test.ts` files. This is a NEW file — acceptable, but the plan should explicitly note it's new (it does in `files_modified`). No issue.

---

### Plan 03 (02-03) — Background Agents (RUN-3a)
**Status:** ❌ BLOCK (scope reduction on D-13)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3a AC#1–6 all covered |
| Task quality | ✅ | 2 tasks, specific actions |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 2, depends on 02-01 (concurrency) — correct |
| File correctness | ✅ | `background-agent.ts` (new), `plugin.ts` exists |
| Must-haves | ✅ | Spawn, complete, cleanup, error context, status query |
| Threat model | ✅ | STRIDE covers injection, tampering, DoS, spoofing |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ❌ | Covers D-01, D-02, D-13, D-14 — BUT D-13 is REDUCED (see blocker) |

**BLOCKER — Scope Reduction on D-13:**
D-13 states: "Built-in mode auto-detects between OpenCode sub-session (interactive tasks) and subprocess stdio (research-based tasks, OMO-style orchestrator)."

Plan 03 Task 1 action says: *"Execution mode: use 'builtin-subsession' (D-13, tmux unavailable per D-02). Mode detection stubbed for future 'builtin-process' addition."*

This delivers only the sub-session half of D-13 and stubs the subprocess stdio half. D-13 is a LOCKED decision requiring both modes with auto-detection. The planner invented a "stubbed for future" versioning that doesn't exist in the user's decision.

**Fix:** Either (a) implement both builtin-subsession AND builtin-process modes with auto-detection logic in this plan, or (b) return a PHASE SPLIT recommendation where subprocess stdio mode belongs to a later phase.

---

### Plan 04 (02-04) — Delegation Chain (RUN-3b)
**Status:** ✅ PASS (with 1 warning)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3b AC#1–5 all covered |
| Task quality | ✅ | 2 tasks: CRUD module + continuity wiring |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 2, depends on 02-03 (background agents) — correct |
| File correctness | ✅ | `delegation-packet.ts` (new), `continuity.ts` exists (638 LOC), `types.ts` exists |
| Must-haves | ✅ | 8-field packets, parent-child linkage, manifest index |
| Threat model | ✅ | STRIDE covers tampering, race condition, EoP, info disclosure |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ✅ | Covers D-03, D-09, D-14 |

**Warning:** D-09 is referenced but D-09 is primarily a circuit-breaker decision (configurable thresholds). The plan references it for `budgetConfig` in delegation packets, which is a cross-cutting concern — acceptable but should note that the actual budget config loading is in Plan 02.

---

### Plan 05 (02-05) — Session Recovery (RUN-3d)
**Status:** ✅ PASS

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3d AC#1–5 all covered |
| Task quality | ✅ | 2 tasks: recovery module + lifecycle integration |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 3, depends on 02-02 (budget) + 02-04 (delegation) — correct |
| File correctness | ✅ | `session-recovery.ts` (new), `lifecycle-manager.ts` exists (705 LOC), `types.ts` exists |
| Must-haves | ✅ | Checkpoint, resume, governance re-apply, recovery log, staleness check |
| Threat model | ✅ | STRIDE covers tampering, DoS, spoofing, repudiation |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ✅ | Covers D-17, D-18 |

---

### Plan 06 (02-06) — Specialist Classification (RUN-3g)
**Status:** ✅ PASS (with 1 warning)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3g AC#1–5 all covered |
| Task quality | ✅ | 2 tasks: preset store + router with wiring |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 3, depends on 02-03 (agents) + 02-04 (packets) — correct |
| File correctness | ✅ | `specialist-router.ts` (new), `agent-presets.ts` (new), `types.ts` exists |
| Must-haves | ✅ | Routing, fallback, delegation recording, presets |
| Threat model | ⚠️ | Typo: "STRIFE" instead of "STRIDE" in threat register heading |
| Scope | ✅ | 2 tasks, 5 files — within budget |
| Decision coverage | ✅ | Covers D-07 |

**Warning:** Threat model heading says "STRIFE Threat Register" — cosmetic but unprofessional. Should be "STRIDE."

---

### Plan 07 (02-07) — Context Governance (RUN-3e)
**Status:** ✅ PASS

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3e AC#1–5 all covered |
| Task quality | ✅ | 2 tasks: engine + plugin wiring |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 4, depends on 02-02 (budget) + 02-05 (recovery) — correct |
| File correctness | ✅ | `governance-engine.ts` (new), `plugin.ts` exists, `types.ts` exists |
| Must-haves | ✅ | Rule evaluation, violation logging, runtime management, soft policy |
| Threat model | ✅ | STRIDE covers tampering, DoS, repudiation, EoP |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ✅ | Covers D-04, D-05 |

---

### Plan 08 (02-08) — Injection Engine (RUN-3f)
**Status:** ✅ PASS (with 1 warning)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements | ✅ | RUN-3f AC#1–5 all covered |
| Task quality | ✅ | 2 tasks: engine + session.compacting wiring |
| TDD compliance | ✅ | Both tasks `tdd="true"` |
| Dependencies | ✅ | Wave 5, depends on 02-06 (specialist) + 02-07 (governance) — correct |
| File correctness | ✅ | `injection-engine.ts` (new), `plugin.ts` exists, `types.ts` exists |
| Must-haves | ✅ | Per-session evaluation, conditional injection, governance filtering, audit log |
| Threat model | ✅ | STRIDE covers injection, spoofing, tampering, info disclosure |
| Scope | ✅ | 2 tasks, 4 files — within budget |
| Decision coverage | ✅ | Covers D-06 |

**Warning:** The plan wires injection into `experimental.session.compacting` hook. RESEARCH.md notes the injection engine should also evaluate during `system.transform` hook (session start), not just compaction. This is a valid concern — if injection should happen at session start AND compaction, the plan should address both. As-is, it only handles compaction-time injection.

---

## Cross-Cutting Issues

### BLOCKER 1: D-12 (Hybrid Background Execution) Not Covered by Any Plan

D-12: "Hybrid background execution — tmux mode for parallel-independent high-performance work, built-in mode for iterative/linear tasks. Auto-detect based on task characteristics."

**No plan references D-12.** Plan 03 acknowledges tmux is unavailable and falls back to builtin-subsession only, but D-12 requires auto-detect logic between execution modes. This decision is silently dropped.

**Fix:** Plan 03 must include the auto-detection logic (task classification → mode selection) even if tmux mode is a no-op on this machine. The decision says "Auto-detect based on task characteristics" — the classification + selection logic should exist even if one mode is currently unavailable.

### BLOCKER 2: D-16 (Tool Budgets Use OpenCode Built-in Mechanisms) Not Covered by Any Plan

D-16: "Tool budgets, loop detection, and retry resolution use built-in OpenCode mechanisms where available — custom concurrency only supplements what OpenCode doesn't provide."

**No plan references D-16.** Plan 01 adds custom concurrency config and Plan 02 adds custom budget config, but neither acknowledges D-16's constraint that OpenCode built-in mechanisms should be preferred where available.

**Fix:** At minimum, Plan 01 and Plan 02 should document which aspects OpenCode already provides natively and which are supplements. If OpenCode provides no built-in concurrency/budget mechanisms, this should be stated explicitly.

### BLOCKER 3: Plan 03 Scope Reduction on D-13 (detailed above)

D-13 requires auto-detect between sub-session AND subprocess stdio. Plan 03 only implements sub-session and stubs subprocess.

### WARNING 1: `src/plugin.ts` Modified by 5 Plans

Plans 02, 03, 06, 07, 08 all modify `src/plugin.ts`. The file is currently 468 LOC. After Plan 02 extracts budget logic (reducing LOC) and Plan 03 adds background agent wiring, then Plans 06/07/08 add more wiring — the net change is unclear.

**Risk:** Conflicting edits if plans execute sequentially in the wrong order. The wave structure partially addresses this (Plan 02 Wave 1, Plan 03 Wave 2, Plan 06 Wave 3, Plan 07 Wave 4, Plan 08 Wave 5), but each plan should note what it expects plugin.ts to look like when it starts.

**Mitigation:** The wave ordering is correct — each plan's plugin.ts changes build on the previous. However, the plan should explicitly note "expects plugin.ts to already have budget config extracted (Plan 02)" or similar.

### WARNING 2: `src/lib/types.ts` Modified by ALL 8 Plans

Every plan modifies `types.ts`. This is expected (each adds new types) but creates a merge bottleneck if plans are developed in parallel. Since the wave structure is sequential within shared types, this is manageable — but worth noting.

### WARNING 3: No Plan Addresses `lifecycle-manager.ts` LOC Reduction

AGENTS.md states max module size is 500 LOC. `lifecycle-manager.ts` is currently 705 LOC. Plan 05 Task 2 says "lifecycle-manager.ts LOC reduced (recovery logic extracted)" but no plan has the explicit objective of reducing it below 500.

**This is NOT a blocker for Phase 02** (it's a quality target, not a RUN-3x requirement), but it's a standing debt that the plans opportunistically mention without committing to resolve.

### INFO 1: Plan Ordering Differs from RESEARCH.md Recommendation

RESEARCH.md recommends: 2c→2h→2a→2b→2d→2e→2f→2g
Actual plan order: 01(2c)→02(2h)→03(2a)→04(2b)→05(2d)→07(2e)→08(2f)→06(2g)

Plans 06 (2g) and 07 (2e) are swapped relative to research. However, the dependency graph is valid — 2g only needs 2a+2b (Plans 03+04), and 2e needs 2d+2h (Plans 05+02). They could actually run in parallel if wave assignments allowed it. Currently 2e is Wave 4 and 2g is Wave 3 — 2g could start before 2e, which is fine.

### INFO 2: Deferred Ideas Correctly Excluded

No plan implements deferred ideas (config agent UI/UX, staleness threshold default numeric value, schema definition). ✅

---

## Coverage Matrices

### Decisions × Plans

| Decision | Description | Covered By | Status |
|----------|-------------|------------|--------|
| D-01 | Visible worker sessions | Plan 03 | ✅ |
| D-02 | Headless fallback | Plan 03 | ✅ |
| D-03 | Parent/child lineage | Plan 04 | ✅ |
| D-04 | Soft policy runtime | Plan 07 | ✅ |
| D-05 | Lighter-weight recovery | Plan 07 | ✅ |
| D-06 | Scoped injection ruleset | Plan 08 | ✅ |
| D-07 | Advisory specialist routing | Plan 06 | ✅ |
| D-08 | Keep warning-then-hard-stop | Plan 02 | ✅ |
| D-09 | Configurable thresholds | Plan 02, 04 | ✅ |
| D-10 | Defaults close to current | Plan 02 | ✅ |
| D-11 | Budget reset on compact | Plan 02 | ✅ |
| **D-12** | **Hybrid execution auto-detect** | **NONE** | **❌ BLOCKER** |
| D-13 | Built-in mode auto-detect | Plan 03 | ⚠️ REDUCED |
| **D-16** | **OpenCode built-in mechanisms first** | **NONE** | **❌ BLOCKER** |
| D-14 | Delegation packets as files | Plan 03, 04 | ✅ |
| D-15 | Hybrid concurrency config | Plan 01 | ✅ |
| D-17 | Task continuity recovery | Plan 05 | ✅ |
| D-18 | Staleness check + risk assessment | Plan 05 | ✅ |

**Coverage: 16/18 decisions covered. 2 blockers (D-12, D-16), 1 reduced (D-13).**

### Requirements × Plans

| Requirement | Plan | AC Coverage | Status |
|-------------|------|-------------|--------|
| RUN-3a (Background Agents) | 03 | AC#1–6 | ✅ |
| RUN-3b (Delegation Chain) | 04 | AC#1–5 | ✅ |
| RUN-3c (Concurrency Control) | 01 | AC#1–5 | ✅ |
| RUN-3d (Session Recovery) | 05 | AC#1–5 | ✅ |
| RUN-3e (Context Governance) | 07 | AC#1–5 | ✅ |
| RUN-3f (Injection Engine) | 08 | AC#1–5 | ✅ |
| RUN-3g (Specialist Classification) | 06 | AC#1–5 | ✅ |
| RUN-3h (Circuit Breaker) | 02 | AC#1–6 | ✅ |

**Coverage: 8/8 requirements covered. All acceptance criteria mapped.**

### tmux Unavailability Finding

RESEARCH.md clearly states tmux is NOT available on the target macOS machine. Plans correctly account for this:
- Plan 03 uses builtin-subsession mode (D-02 fallback) ✅
- No plan assumes tmux is present ✅
- However, D-12's auto-detect logic between modes is not implemented (BLOCKER 1 above) ✅

---

## Summary of Required Fixes

### Must Fix (Blockers — cannot execute until resolved)

1. **Plan 03: D-13 scope reduction** — Task 1 stubs "builtin-process" mode as "future addition." D-13 requires auto-detect between sub-session AND subprocess stdio. Either implement both modes or propose a phase split.

2. **All plans: D-12 missing** — No plan implements hybrid execution auto-detect logic. Plan 03 should include the classification → mode selection logic, even if tmux mode returns "unavailable."

3. **All plans: D-16 missing** — No plan acknowledges that OpenCode built-in mechanisms should be preferred for tool budgets/loop detection. Plan 01 and Plan 02 should document which capabilities are supplements vs. replacements.

### Should Fix (Warnings)

4. **Plan 06:** Fix "STRIFE" → "STRIDE" typo in threat model heading.
5. **Plan 08:** Consider whether injection should also happen at session start (`system.transform` hook) in addition to compaction time.
6. **Cross-plan:** Add explicit "expected state of plugin.ts" notes to Plans 03, 06, 07, 08 since all modify it sequentially.

### Suggestions (Info)

7. Consider if Plans 06 (2g) and 07 (2e) could be parallelized — their dependency graphs don't cross.
8. `lifecycle-manager.ts` LOC reduction (705 → <500) is mentioned opportunistically but not committed to. Consider adding as an explicit task in Plan 05.

---

## Recommendation

**3 blockers require revision before execution.** The planner should:

1. Revise Plan 03 to either (a) deliver D-13 fully (subsession + subprocess stdio with auto-detect) or (b) return a PHASE SPLIT recommendation
2. Add D-12 coverage to Plan 03 (auto-detect classification logic, tmux mode as "unavailable" path)
3. Add D-16 acknowledgment to Plans 01 and 02 (document OpenCode built-in mechanism usage)

After these fixes, re-run verification.
