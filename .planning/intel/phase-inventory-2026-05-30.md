# Phase Inventory — P39 Integration Completion & Hardening

**Generated:** 2026-05-30  
**Methodology:** File-system audit of 105 directories under `.planning/phases/`. Cross-referenced ROADMAP.md + `src/` code.

**Total unique phases:** 82 (40 COMPLETE, 23 PARTIAL, 19 NOT_STARTED)

---

## Baseline

| Gate | Status |
|------|--------|
| `npm run build` | ✅ PASS |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ⚠️ 2934 pass, 19 fail, 2 skip |
| Failing areas | bootstrap-init (6), bootstrap-recover (4), doctor (8), configure-primitive (1) |

**All 19 failures are 5000ms timeouts** on macOS filesystem-heavy tests, not logic errors.

---

## P39 Strategy

| Wave | Action | Scope |
|------|--------|-------|
| **1 — VERIFY** | Regression check | 45 phases: run tests, check typecheck, confirm build |
| **2 — COMPLETE** | Delivery closure | 20 phases: deliver remaining plans, close gaps |
| **3 — MERGE** | Absorb into P39 | 9 phases: P36-P38, P26-26.2, P30, CP-PTY-01 |
| **4 — FIX** | Unblock blockers | CP-DT-01 Wave 6 runtime gaps |
| **DEFER** | Explicit postpone | 17 phases: P27-P29, P31-P35, P40, PTY series, gap gates |

---

## ✅ COMPLETE (40 — VERIFY)

`P11` `P12` `P13` `P17` `P18` `P19` `P21` `P21.1` `P22` `P23` `P23.1` `P23.2`
`P24` `P24.5` `P24.6` `P24.7` `P24.8` `P24.9` `P25` `P25.2` `P25.3` `P25.5`
`P23.5` `P23.7` `BOOT-02/02R` `BOOT-03` `BOOT-04` `BOOT-05` `BOOT-06`
`BOOT-07` `BOOT-08` `CP-ST-01` `CP-ST-02` `CP-ST-03` `CP-ST-04`
`CP-ST-05` `CP-PTY-00` `SR-10` `MCM-01` `MCM-02`

All have PLANS + SUMMARYs. Most have code in `src/`. P39 just runs regression.

---

## 🟡 PARTIAL (23 — Need COMPLETE or FIX)

| Phase | Name | Evidence | P39 Action |
|-------|------|----------|------------|
| **P14** | Wire Monitor/Notification | 4 PLANS + SPEC | Complete plan 04 |
| **P15** | Delegate-Task Gaps | 5 PLANS + SPEC | Execute all 5 plans |
| **P16** | Tool Intelligence | 7 PLANS + SPEC | Complete plan 03 (aggregate) |
| **P21.2** | Front-Agent Switch | 2 PLANS + prototype | L1 live UAT |
| **24.1** | Agent Hierarchy | 3 PLANS + summaries | Final verification |
| **24.2** | Agent Profile Quality | 8 PLANS + SPEC | Execute gap plans |
| **24.3.1** | Gov Session Prototype | 10 PLANS | Live UAT |
| **24.3.2** | Execute-Slash-Command | PLANS + SPEC | Complete waves 2-3 |
| **24.3.3** | Namespace Routing | 2 PLANS + VERIFICATION | Final verification |
| **25.1** | Task Tool Integration | 1 PLAN + SPEC | Deliver code |
| **BOOT-09** | Config Schema | 3 PLANS | Complete plan 02 |
| **CP-ST-06** | Root Cause Rewrite | 5 PLANS + summaries | Verify 6 RC fixes |
| **CP-DT-01** | Delegate-Task Revamp | 7 PLANS + SPEC | **FIX**: Wave 6 runtime gaps |
| **C4** | Performance | 3 PLANS + VALIDATION | Deliver to code |
| **C5** | Error Handling | 3 PLANS + SPEC | Deliver to code |
| **C6** | Architectural Refactoring | 5 PLANS + VERIFICATION | Deliver to code |
| **C7** | Test Coverage | 1 PLAN + SPEC | Generate more plans |
| **24.4** | References & Templates | 1 PLAN + SPEC | AUDIT — CANCELLED |
| **P23.4** | D→A Gate | 1 VERIFICATION | AUDIT |
| **P23.6** | P25→P26→B Gate | 1 CONTEXT | AUDIT — BLOCKED |
| **01-C1** | ChildBackfiller | 1 REVIEW | AUDIT — legacy |
| **BOOT-02R** | Gov Reconciliation | PLAN + SUMMARY | VERIFY |
| **SR-04** | Features Plane | 1 continue.md | VERIFY |

---

## 🔴 NOT_STARTED/NOT_IN_DIR (19 phases)

### MERGE into P39 (9)

| Phase | Name | Why |
|-------|------|-----|
| **P36** | Integration Verification | Natural fit for P39 |
| **P37** | Fix sync-oss.yml | CRITICAL — prevents GSD leak to OSS |
| **P38** | Package .opencode/ primitives | Required for P40 |
| **P26** | Pressure + Notification | Declared in P39 scope |
| **P26.1** | Artifact Naming | Declared in P39 scope |
| **P26.2** | Artifact Gatekeeping | Declared in P39 scope |
| **P30** | Schema Kernel Cleanup | Quick win |
| **CP-PTY-01** | Background Shell MVP | PLAN exists; execute if BOOT deps met |
| **P00.5** | Dead Code Sweep | May be subsumed by P19 |

### SR phases — VERIFY structure only (11)

`SR-00` through `SR-09` (all empty dirs). ROADMAP says ✅ COMPLETE. Code restructuring was done directly; `src/` structure exists. P39 just verifies.

### DEFER to post-P39 (17)

| Phase | Name | Rationale |
|-------|------|-----------|
| **P27** | Routing + Intent Loop | Group 2 — design-first |
| **P28** | Hook Injection Plane | Group 2 — depends on routing |
| **P29** | Auto-looping + PTY | Group 2 — complex |
| **P31** | Config Plane Redesign | Group 3 |
| **P32** | Shipped Primitives Wire | Group 3 |
| **P33** | Plugin Decomposition | Group 4 — structural |
| **P34** | Async I/O + Typed Errors | Group 4 — cross-cutting |
| **P35** | Module Splits | Group 4 |
| **P40** | Public Ship Readiness | Depends on P39 |
| **CP-PTY-02/03/04** | PTY series | Upstream not started |
| **P23.8/P23.9/P23.10** | Gap gates | Upstream not started |
| **SC-PTY-01** | Terminal Projection | Awaits Q2 decision |
| **CP-DT-02** | DT Remediation | Depends on CP-DT-01 |

### IGNORE duplicates (3)

`P25-trajectory-redesign/` `P39-integration-completion-hardening/` `CP-ST-04-hierarchy-manifest/`

---

## P39 Must-Do Items (ranked)

| # | Item | Phase | Effort | Risk |
|---|------|-------|--------|------|
| 1 | Fix sync-oss.yml — add GSD filtering | P37 merge | 2-3 hrs | HIGH — GSD leak to OSS |
| 2 | Fix 19 timeout test failures | All | 1 hr | MEDIUM — may hide bugs |
| 3 | Unblock CP-DT-01 Wave 6 | CP-DT-01 | 4-8 hrs | HIGH — runtime gap |
| 4 | Package .opencode/ primitives | P38 merge | 2-4 hrs | HIGH — blocks P40 |
| 5 | Deliver C4-C7 (~12 plans) | C4-C7 | 12-24 hrs | MEDIUM — well planned |
| 6 | Complete BOOT-09 Plan 02 | BOOT-09 | 2-4 hrs | LOW |
| 7 | Complete P21.2 live UAT | P21.2 | 2-4 hrs | LOW |
| 8 | Complete CP-ST-06 verification | CP-ST-06 | 2-3 hrs | MEDIUM |
| 9 | Deliver P14/P15/P16 remaining | P14-P16 | 4-8 hrs | LOW |
| 10 | Complete 24.x series | 24.1-24.3.3 | 8-12 hrs | MEDIUM |

---

## Current Project Health

| Metric | Value |
|--------|-------|
| Source files | ~40,993 LOC across `src/` |
| Test files | 245 files, 2955 tests |
| Failing tests | 19 (all timeouts) |
| Files >500 LOC | 7 (delegation-status 734, plugin.ts 664, child-writer 658, execute-slash-command 631, session-tracker index 626, coordinator 556, tool-capture 502) |
| GSD agents in .opencode/ | 33 files (will leak to OSS branch) |
| GSD files in .opencode/get-shit-done/ | 309 files (will leak to OSS branch) |
| Language governance | Already wired: vi/en in `.hivemind/configs.json` |
