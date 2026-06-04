[LANGUAGE: Write this file in en per Language Governance.]
# Phase 58 Gap-Fix Resume — End-to-End Task Landscape

**Session:** `ses-p58-73-parent` (resumed)
**Plan:** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-08-GAP-FIX.md` (52079 bytes, 2026-06-04 04:01)
**Date-stamped:** `landscape-2026-06-04.md`
**L0 owner:** `hm-l0-orchestrator`
**Evidence level:** L5 planning landscape (NOT runtime readiness; awaiting L1-L3 from delegated execution)

---

## 1. Task Summary

Phase 58 was originally CLOSED 2026-06-04 with G1–G6 closed (6/6), 13/13 ACs verified, 3,310/3,310 vitest pass, 5/5 P55 regression pass — `58-CLOSE.md` status `SHIPPED`. Post-ship UAT (commit `5cc12672`) revealed 2/6 PASS, 4/6 PARTIAL → 4 root causes (S1–S4) were diagnosed (commit `aea2c2e8`). SPEC and CONTEXT were extended with 5 new REQs (REQ-58-07..10 + REQ-58-META) and the gap-fix plan (`PLAN-08`) was authored with 29 atomic commits across 4 waves.

An external platform agent executed Wave 1 (4 RED BATS) and Wave 2A (3 of 5 S1 implementation commits) but did NOT record progress in our session-tracker. The local branch is **12+ commits ahead of `origin/feature/harness-implementation`** and the working tree has **30+ uncommitted `.hivemind/session-tracker/*.json` auto-save files** + `.planning/STATE.md` 6-line counter drift.

**Goal of THIS session:** Resume execution of the remaining 18 atomic commits (5+3+4+5+5-1+1+3+5) → integration verification (5 gates) → META process changes (4 docs) → REAL UAT gate (META-04, human-driven). Total: **28 atomic commits** + 1 REAL UAT gate.

---

## 2. Domain Breakdown (16 hm-* domains → this plan touches 4)

| Domain | Why it applies | Specialist route |
|---|---|---|
| **Implementation** | 17 atomic commits across `src/**` (5+3+4+5) | `hm-l2-executor` (singleton specialists per wave) |
| **Testing / TDD** | 4 RED BATS (DONE) + BATS 64/65 regression guard | `hm-l2-executor` + `hm-l2-validator` |
| **Documentation** | 4 docs-only META commits + 1 REAL UAT doc | `hm-l2-writer` (Wave 4) |
| **Quality / Verification** | 5 integration gates (BATS 62-70 regression, 27-tool-key, AC#10/AC#11, 3,310 vitest, tsc) | `hm-l2-validator` + `hm-l2-verifier` |

**Not in scope** (delegation boundaries):
- ❌ `hf-*` meta-concept work (no new agents/skills/commands this phase)
- ❌ Plugin decomposition (deferred to P32 per locked decision)
- ❌ Async I/O + typed errors (deferred to P33 per locked decision)
- ❌ `.hivemind/**` runtime state mutation (typed owner modules only — hook-driven auto-saves are not L0 work)

---

## 3. Wave Ordering & Dependency DAG

```
W1: RED BATS 71-74                    [DONE — 4 commits]
W2A: S1 impl I1-I5                    [3/5 DONE — I1,I2,I3 via 0cd8bff0/498992fc/bd8b07e1]
            ├── I4: pre-send validation
            └── I5: wire startPolling into manager-runtime.ts dispatch()  ← FAST-PATH DISPATCH
W2B: S2 impl I6-I8                    [SEQUENTIAL — touches tmux-copilot.ts]
W2C: S3 impl I9-I12                   [SEQUENTIAL — touches delegate-task.ts + manager-runtime.ts]
W2D: S4 impl I13-I17                  [SEQUENTIAL — touches manager-runtime.ts + coordinator.ts + new child-event-stream.ts]
W3: Integration verification          [3 docs commits + 5 verification gates]
W4: META docs                         [4 commits M1-M4 PARALLEL → M5 REAL UAT BLOCKING]
META-04: REAL UAT                     [HUMAN-DRIVEN, BLOCKING per D-58-36]
```

**Sequential constraints (file-share dependencies):**
- S2 + S3 both touch `src/tools/tmux-copilot.ts` and `src/coordination/delegation/manager-runtime.ts` → S2 THEN S3
- S3 + S4 both touch `src/coordination/delegation/coordinator.ts` → S3 THEN S4
- S1 + S4 both touch `src/tools/delegation/delegation-status.ts` → S1 DONE before S4
- S1-I5 (manager-runtime.ts wire) is the **last S1 task** — must complete before S3/S4 begin
- Wave 4 (META) is docs-only and CAN run in parallel with Wave 1 — but Wave 1 is already DONE

---

## 4. Specialist Assignments per Sub-Task

| Sub-task | Path | Target specialist | Rationale |
|---|---|---|---|
| S1-I5 (wire startPolling) | **fast-path** | `hm-l2-executor` | Single specialist, known route, 1 commit, exact file `manager-runtime.ts:dispatch()` |
| Wave 2B (S2, 3 commits) | coordinated | `hm-coordinator` (impl wave) | 3 sequential commits touching 1 file (tmux-copilot.ts) |
| Wave 2C (S3, 4 commits) | coordinated | `hm-coordinator` (impl wave) | 4 sequential commits touching delegate-task.ts + manager-runtime.ts |
| Wave 2D (S4, 5 commits) | coordinated | `hm-coordinator` (impl wave) | 5 sequential commits including NEW child-event-stream.ts |
| Wave 3 (5 verification gates) | coordinated | `hm-l2-validator` + `hm-l2-verifier` | 3 docs commits + 5 gate runs (BATS, 27-tool-key, AC#10/AC#11, vitest, tsc) |
| Wave 4 M1-M4 (4 docs) | coordinated | `hm-l2-writer` (docs wave) | 4 docs-only commits — can run in parallel within docs wave |
| META-04 REAL UAT | **HUMAN-DRIVEN** | front-facing operator (NOT `gsd-verifier` or `gsd-executor` per D-58-36) | 4 UAT steps in actual TUI; verdict recorded in `58-VERIFICATION-EXTEND.md` |

---

## 5. Path Decisions (recorded for audit)

| Decision ID | Decision | Criteria |
|---|---|---|
| **PATH-S1-I5 = fast-path** | Direct dispatch to `hm-l2-executor` | Single specialist, known routing, immediate execution, depth = 1 |
| **PATH-W2B-2D = coordinated** | Dispatch to `hm-coordinator` (implementation wave) | Multi-specialist (S2/S3/S4 may need different specialists), dependent waves, depth grows to 2 |
| **PATH-W3 = coordinated** | Dispatch to `hm-l2-validator` + `hm-l2-verifier` | 5 sequential verification gates, dual-signal completion per Q5 |
| **PATH-W4-M1-M4 = coordinated** | Dispatch to `hm-l2-writer` (docs wave) | 4 docs-only commits; M1-M4 can be parallel within docs wave |
| **PATH-META-04 = HUMAN** | Operator runs 4-step REAL UAT | D-58-36 LOCKED; FAIL = HARD FAIL (phase does not ship) |

**Anti-pattern guards:**
- ❌ No L0→L2 dispatch for multi-specialist tasks (would lose coordination context)
- ❌ No skipping the quality gate triad on Wave 2/3 returns
- ❌ No `git add .` or `git add -A` (would mix `.hivemind/session-tracker/*.json` auto-saves into implementation commits) — executor MUST use `git add <specific-files>` per commit

---

## 6. Artifact Expectations per Sub-Task

| Sub-task | Expected artifact | Classification | L-level |
|---|---|---|---|
| S1-I5 | `src/coordination/delegation/manager-runtime.ts` modified (startPolling call in dispatch()) + 1 atomic commit | implementation | L1 (BATS 71 green) |
| Wave 2B-2D | 12 atomic commits across 4 source files + BATS 71-74 GREEN | implementation | L1 |
| Wave 3 | 3 docs commits to `58-VERIFICATION.md` + 5 gate outputs (BATS, vitest, tsc) | verification | L1 |
| Wave 4 M1 | `.planning/USER-PAIN-BACKLOG.md` (new file, S1-S4 entries) | documentation | L5 |
| Wave 4 M2 | `.opencode/get-shit-done/templates/spec.md` (+ User-Pain Coverage section) | documentation | L5 |
| Wave 4 M3 | `.opencode/get-shit-done/templates/verification.md` (+ Human-Driven UAT section) | documentation | L5 |
| Wave 4 M4 | `.planning/ROADMAP.md` (+ Symptom Coverage Matrix) | documentation | L5 |
| META-04 | `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md` (Human-Driven UAT section, operator's name) | verification | L1 (operator-run) |

**All artifacts MUST be disk-written before any "done" claim.** No in-memory or conversational-only outputs.

---

## 7. Quality Gate Expectations

**Gate triad per return:**
1. **gate-lifecycle-integration** — does the impl touch the right surface (CQRS boundary, src/ vs .opencode/ vs .hivemind/)?
2. **gate-spec-compliance** — does the impl satisfy the relevant REQ-58-XX acceptance criteria?
3. **gate-evidence-truth** — is there live runtime proof (BATS exit 0, vitest pass, tsc clean, 27-tool-key invariant)?

**Per-wave gate:**
- Wave 1: BATS 71-74 RED (committed) — DONE, gate PASS
- Wave 2A: BATS 71 GREEN — pending I5
- Wave 2B: BATS 72 GREEN + BATS 64/65 REGRESSION (AC#10/AC#11 manualOverride) — pending
- Wave 2C: BATS 73 GREEN + `grep -c 'true-fire-and-forget WaiterModel (P58.3)'` ≥ 1 AND old string absent — pending
- Wave 2D: BATS 74 GREEN — pending
- Wave 3: 5/5 verification gates PASS — pending
- Wave 4 M1-M4: 4 grep checks pass (spec.md, verification.md, ROADMAP.md, USER-PAIN-BACKLOG.md) — pending
- META-04: REAL UAT verdict recorded by human operator in `58-VERIFICATION-EXTEND.md` — BLOCKING

**Hard fails (per D-58-36):**
- ❌ FAIL or missing section in META-04 = phase does NOT ship
- ❌ AC#10/AC#11 regression (BATS 64/65 fail) = D-58-24 REGRESSION GUARD tripped
- ❌ 27-tool-key drift = D-58-XX preserved invariant violated
- ❌ `any` in new types (`ChildEvent`, `ChildEventStream`, `DelegationEventBase`) = type discipline violation

---

## 8. Pre-conditions and Blockers

**Pre-conditions (satisfied):**
- ✅ Phase 58 originally SHIPPED (`58-CLOSE.md`)
- ✅ Debug report committed (`aea2c2e8`)
- ✅ SPEC extended with REQ-58-07..10 + REQ-58-META (`34a24fce`)
- ✅ CONTEXT extension captured (`0057fec8`)
- ✅ Single-pass `--auto` re-validation (`26dd930c`)
- ✅ PLAN-08 authored (52079 bytes, 4 waves, 29 atomic commits)
- ✅ D-58-21 LOCKED (BATS slot 67 = G1 grep-guard, new slots = 71-74)
- ✅ D-58-36 LOCKED (REAL UAT human-driven, META-04 BLOCKING)
- ✅ D-58-38 LOCKED (RED-FIRST discipline)
- ✅ Wave 1 RED BATS committed (4 commits: `4bfd1532`, `0f3b2b45`, `7d216809`, `8d06186a`)
- ✅ Wave 2A I1-I3 committed (`0cd8bff0`, `498992fc`, `bd8b07e1`)

**Blockers:**
- ⚠️ `.hivemind/session-tracker/*.json` (30+ auto-saves) + `.planning/STATE.md` (6-line counter drift) are uncommitted — MUST NOT be mixed into implementation commits. Executor uses `git add <specific-files>`. May batch as single housekeeping commit at end of session.
- ⚠️ `ses-child-73-21710` is in error state (delegated by `hm-l2-researcher`, "Failed to send prompt to child session", depth 1, 0 turns, recoveryGuarantee: resumable). For S1-I5 dispatch: do NOT stack onto this failed child — start fresh child via `task_id` (no stackable sessions found per delegation-status).
- ⚠️ Working tree is dirty: `git status` shows 30+ `.hivemind/session-tracker/*.json` files + `.planning/STATE.md`. Executor MUST verify with `git status` before each commit and use `git add <specific-files>` only.

**NOT blockers (acceptable):**
- Pre-existing BATS 61 failure (`tests/scripts/tmux/61-stress-test-real-world-workflow.bats`) is documented as NOT a P58 regression per `58-VERIFICATION.md:9-10` (`dist/plugin.js:368`).

---

## 9. Success Metrics (Goal-Backward)

After this session completes, the following must be true:
1. ✅ 28 atomic commits landed with correct `(red)/(green)/(docs)/(verification)` markers per D-58-38
2. ✅ 4 new BATS scenarios (71-74) all exit 0 (≤115s total per D-58-39)
3. ✅ 6 original P58 BATS (62-66) + 4 P55 BATS (57-60) still exit 0 (regression check)
4. ✅ BATS 64 (`64-forward-prompt.bats`) exit 0 (AC#11 REGRESSION GUARD)
5. ✅ BATS 65 (`65-takeover-release.bats`) exit 0 (AC#10 REGRESSION GUARD)
6. ✅ `tests/integration/hook-registration.test.ts:86-103` 6/6 PASS (27-tool-key invariant)
7. ✅ 3,310 vitest full suite PASS
8. ✅ `npx tsc --noEmit` exit 0, no `any` in new types
9. ✅ `src/tools/delegation/delegation-status.ts` action count = 8 (peek + progress added)
10. ✅ `src/tools/tmux-copilot.ts` action count = 8 (peek added)
11. ✅ `src/plugin.ts` tool registration count = 27 (UNCHANGED)
12. ✅ `.planning/USER-PAIN-BACKLOG.md` exists with S1-S4 entries
13. ✅ `.opencode/get-shit-done/templates/spec.md` contains `## User-Pain Coverage` section
14. ✅ `.opencode/get-shit-done/templates/verification.md` contains `## Human-Driven UAT` section
15. ✅ `.planning/ROADMAP.md` contains `## Symptom Coverage Matrix` section
16. ✅ `src/tools/delegation/delegate-task.ts:32` contains `"true-fire-and-forget WaiterModel (P58.3)"` AND old `"always-background WaiterModel"` is absent
17. ✅ `58-VERIFICATION-EXTEND.md` has `## Human-Driven UAT` section authored by human front-facing operator (post-execution META-04 gate)
18. ✅ Verdict in `58-VERIFICATION-EXTEND.md` is PASS or PARTIAL-with-explicit-follow-up

**Phase ships only when 1-18 all PASS.** Any FAIL or missing = HARD FAIL per D-58-36.

---

## 10. Risk Register

| Risk ID | Risk | Mitigation |
|---|---|---|
| R-58-R01 | Executor bundles multiple logical changes into one commit (violates atomic commit rule) | Inspector verifies `git log -p` between commits; per-commit `npm run typecheck` + `npm test` MUST pass independently |
| R-58-R02 | Executor mixes `.hivemind/session-tracker/*.json` into implementation commits | Executor MUST use `git add <specific-files>`; L0 spot-checks first 3 commits of each wave |
| R-58-R03 | AC#10/AC#11 manualOverride regression (BATS 64/65 fail) | REGRESSION GUARD test run AFTER S2 implementation, BEFORE S3/S4 begin |
| R-58-R04 | 27-tool-key drift | Wave 3 V2 gate runs `hook-registration.test.ts:86-103` |
| R-58-R05 | REAL UAT verdict missing or operator name = "gsd-verifier" / "gsd-executor" | D-58-36; META-04 is BLOCKING; HARD FAIL if violated |
| R-58-R06 | External platform agent commits not discoverable | L0 read git log + BATS slot status to reconstruct state; documented in `next_steps` |
| R-58-R07 | `ses-child-73-21710` recovers with stale context | Per Iron Law #6/#7: do NOT stack onto failed child; start fresh child via `task_id` (no stackable sessions found) |

---

## 11. Delegation Log (L0 will record here)

To be populated as dispatches execute. Each entry: dispatch #, target, task summary, session ID, status, artifacts, gate verdict, evidence.

### Dispatch 1: S1-I5 (fast-path)
- **Target:** `hm-l2-executor` (single specialist, known route)
- **Task:** Wire `startPolling` into `src/coordination/delegation/manager-runtime.ts` `dispatch()` lifecycle — single atomic commit, must turn BATS 71 from RED to GREEN
- **Scope boundaries:** Only `manager-runtime.ts:dispatch()` may be modified. No new files. No new dependencies (D-58). Max 500 LOC.
- **Output format:** 1 atomic commit with message `phase-58-gap-fix(S1): wire startPolling into manager-runtime.ts dispatch lifecycle`. Commit body explains WHY (post-spawn delegated session capture-pane polling).
- **Artifact:** `src/coordination/delegation/manager-runtime.ts` modified + BATS 71 exit 0
- **Gate expectation:** lifecycle PASS (src/ surface), spec PASS (REQ-58-07 AC met), evidence PASS (BATS 71 exit 0)

### Dispatch 2: Wave 2B (S2) — coordinated (PENDING Dispatch 1)
### Dispatch 3: Wave 2C (S3) — coordinated (PENDING Dispatch 2)
### Dispatch 4: Wave 2D (S4) — coordinated (PENDING Dispatch 3)
### Dispatch 5: Wave 3 (5 verification gates) — coordinated (PENDING Dispatch 4)
### Dispatch 6: Wave 4 M1-M4 (4 docs) — coordinated docs wave (can run with Wave 3)
### Dispatch 7: META-04 REAL UAT — HUMAN-DRIVEN BLOCKING (PENDING Dispatch 5 + 6)

---

## 12. Reference

- **Plan:** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-08-GAP-FIX.md`
- **SPEC (extended):** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SPEC.md:184-290` (REQ-58-07..10 + REQ-58-META)
- **CONTEXT (extended):** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-CONTEXT.md:139-275` (D-58-18..36 LOCKED)
- **Debug diagnosis:** `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17` (S1-S4 symptom definitions)
- **META analysis:** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-META-ANALYSIS.md:120-214` (3 process changes verbatim)
- **Original close:** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-CLOSE.md`
- **Session tracker:** `.hivemind/session-tracker/ses-p58-73-parent/` (parent + 1 error child)
- **Continuity:** `.hivemind/session-tracker/project-continuity.json` (cross-session index, 70179 bytes)
- **Governance:** `.hivemind/AGENTS.md`, `.planning/AGENTS.md`, `.opencode/AGENTS.md`

---

**L0 governance statement:** This landscape is a planning artifact (L5). It authorizes future work in scope; it does NOT claim runtime readiness. Phase 58 gap-fix ships ONLY after META-04 REAL UAT verdict is recorded in `58-VERIFICATION-EXTEND.md` by the human front-facing operator (D-58-36 LOCKED).
