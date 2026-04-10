# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-10 (added durable parent observability repair phase)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [x] **Phase 2: V3 Runtime Architecture** — 9/9 plans complete, 18/18 verified
- [ ] **Phase 3: Schema Definition** — 0/4
- [ ] **Phase 4: Migration Gate** — 0/4
- [ ] **Phase 5: Integration Verification** — 0/5
- [ ] **Phase 6: Runtime Domain Separation** — 0/6
- [ ] **Phase 7: Runtime Domain Restructuring Planning** — 0/5
- [ ] **Phase 8: Repair Durable Parent Observability** — ✅ COMPLETE (corrective closure)
- [ ] **Phase 9: Sticky Delegation Corrective** — 0/5

## Phase 1: Baseline Cleanup

### Already Done ✅ (verified against source)

1. ✅ Double-compaction avoided — `src/plugins/prompt-enhance.ts` records compaction in event hook, single increment
2. ✅ Heading regex anchored — `src/tools/session-patch/tools.ts` uses `match[1]` exact match
3. ✅ Cross-line contradiction detection — `src/tools/prompt-analyze/tools.ts` nested loop comparison
4. ✅ System-transform gating — `src/hooks/system-transform.ts` checks delegation metadata
5. ✅ `recommended_lanes` removed — `src/tools/prompt-skim/tools.ts` output has no such field
6. ✅ `.opencode/tools/*.ts` deleted — only `.gitkeep` remains
7. ✅ Test files canonical form — `tests/tools/*.test.ts` all import from `src/tools/`

### Still Pending 🔄

8. 🔄 Remove `system.transform` wiring from `src/plugin.ts` (lines 38-39 import, lines 315-320 wiring)
9. 🔄 Fix `hivefiver-orchestrator.md` expecting `recommended_lanes` (lines 102, 163)
10. 🔄 Replace heuristic context-budget with real OpenCode compaction data

### Plans
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Execute 3 remaining cleanup items (remove system.transform wiring, fix orchestrator phantoms, remove context-budget tool)

## Phase 2: V3 Runtime Architecture

Executable recovery plan set replacing the stale reference-only Phase 02 plans. These plans are grounded in current V3 runtime code reality and preserve the still-locked Phase 02 decisions.

**Authoritative current status (2026-04-10):** implementation is complete across all 9 Phase 02 plans and authoritative re-verification now records `18/18` truths verified in `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`.

**Corrective closure:** Phase 08 repaired the live `runtimePolicyOverride` writer/persistence seam and hardened durable parent-visible delegated-session truth across async boundaries.

Recovery plan structure:
- 2c/2h. Runtime policy foundation — configurable concurrency + budgets that supplement OpenCode built-ins
- 2a. Hybrid background execution — full D-12/D-13 auto-detect across execution family and built-in submodes
- 2b/2g. Delegation lineage + advisory specialist routing — continuity canonical, exports optional
- 2d. Session recovery — staleness check, risk framing, CQRS-safe checkpoint/resume
- 2e. Context governance — soft-policy rules with runtime mutation and violation logging
- 2f. Injection engine — conditional session-start and compaction-time injection with governance filtering

**Plans:** 9 plans

Plans:
- [x] 02-01-PLAN.md — Runtime policy foundation: configurable concurrency and budgets that explicitly supplement OpenCode built-ins (Wave 1)
- [x] 02-02-PLAN.md — Hybrid background execution: D-12/D-13 auto-detect plus hardened owned-process fallback (Wave 2)
- [x] 02-03-PLAN.md — Delegation lineage and specialist routing: continuity-first persistence with optional packet/manifest exports (Wave 3)
- [x] 02-04-PLAN.md — Session recovery and hook repair: staleness/risk framing, CQRS-safe compaction, compact/reset restoration (Wave 4)
- [x] 02-05-PLAN.md — Context governance: durable soft-policy rules, runtime mutation, violation logging (Wave 5)
- [x] 02-06-PLAN.md — Injection engine: conditional session-start and compaction-time injection with governance filtering (Wave 6)
- [x] 02-07-PLAN.md — Runtime-policy production wiring: live queue and hook budget resolution from trusted policy state (Wave 7)
- [x] 02-08-PLAN.md — Execution-mode wiring: classifier-driven live delegation runtime with owned-process background execution (Wave 8)
- [x] 02-09-PLAN.md — Injection and governance correctness: route-aware payloads, active-rule suppression, and overlapping metadata correlation (Wave 8)

## Phase 3: Schema Definition

- 3a. YAML schema for Agent frontmatter
- 3b. YAML schema for Command frontmatter
- 3c. YAML schema for Skill frontmatter
- 3d. TypeScript types + event emitters from schemas

## Phase 4: Migration Gate

- 4a. Inventory product-detox (excluding .env, tool config pollution)
- 4b. Match against proven harness-experiment baseline
- 4c. Selective migration list with user approval
- 4d. Item-by-item migration with validation

## Phase 5: Integration Verification

- 5a. Full test suite green
- 5b. Plugin loads and wires all tools + hooks
- 5c. Background agents spawn, report, clean up
- 5d. Delegation chains persist across sessions
- 5e. Injection engine applies rules conditionally
- 5f. Specialist routing correct
- 5g. Schema validation catches malformed definitions

## Phase 6: Runtime Domain Separation

- 6a. Define stable `src/lib` domain boundaries for runtime, continuity, lifecycle, delegation, governance, and integration seams
- 6b. Split runtime execution concerns behind a dedicated runtime domain surface
- 6c. Split continuity and recovery concerns behind continuity-specific modules and interfaces
- 6d. Split lifecycle and delegation orchestration into dedicated domain modules with explicit contracts
- 6e. Split governance and policy evaluation into dedicated modules with narrow dependencies
- 6f. Establish integration seams so plugin/composition code depends on domain contracts instead of cross-domain internals

## Phase 7: Runtime Domain Restructuring Planning

**Gate:** Do not start until Phase 02 verification reaches **18/18** and the runtime-policy override seam is closed end-to-end.

**Scope:** Roadmap/planning artifacts only. No `src/**` or `tests/**` changes in this phase.

**Execution posture:** Path-first and behavior-neutral. This phase plans how `src/lib/` will be restructured before any logic redesign is considered.

- 7a. Define the target `src/lib/` runtime domains: lifecycle, continuity, governance, execution, routing, and state
- 7b. Produce a path-first move map that assigns current modules to the target domains without changing runtime behavior
- 7c. Define import and dependency boundary rules for each target domain plus allowed integration seams
- 7d. Sequence the restructuring work into behavior-neutral follow-on plans with explicit verification gates for each move set
- 7e. Record exclusions and invariants: no logic redesign, no feature expansion, and no execution until Phase 02 is fully verified at 18/18

## Progress Table

| Phase | Items Complete | Status |
|-------|---------------|--------|
| 1. Baseline Cleanup | 7/10 | Plan created (1 plan, Wave 1) |
| 2. V3 Runtime Architecture | 9/9 plans, 18/18 truths | Verified after Phase 08 corrective closure |
| 3. Schema Definition | 0/4 | Not started |
| 4. Migration Gate | 0/4 | Not started |
| 5. Integration Verification | 0/5 | Not started |
| 6. Runtime Domain Separation | 0/6 | Not started |
| 7. Runtime Domain Restructuring Planning | 0/5 | Future planning phase; gated on Phase 02 reaching 18/18 verified ✅ |
| 8. Repair Durable Parent Observability | 3/3 plans | ✅ COMPLETE — corrective closure, 2026-04-10 |
| 9. Sticky Delegation Corrective | 0/5 | New corrective phase — based on delegation root-cause analysis |

## Dependencies

```
Phase 1 (7 done, 3 pending — planned)
  └─→ Phase 2: V3 Runtime baseline
       └─→ Phase 8: Corrective closure for delegated-session durability ✅
            └─→ Phase 2: Authoritative re-verification (18/18) ✅
                 └─→ Phase 9: Sticky Delegation Corrective (new)
                      └─→ Phase 3: Schema Definition
                           └─→ Phase 4: Migration Gate
                                └─→ Phase 5: Integration Verification
                                     └─→ Phase 6: Runtime Domain Separation
                                          └─→ Phase 7: Runtime Domain Restructuring Planning
```

### Phase 8: Repair durable parent observability for delegated sessions

**Goal:** Restore durable parent-visible delegated-session truth and close the live runtimePolicyOverride seam so Phase 02 can be re-verified.
**Requirements**: RUN-3h
**Depends on:** Phase 02 corrective closure baseline (not Phase 07)
**Plans:** 3 plans

Plans:
- [x] 08-01-PLAN.md — restore the live runtimePolicyOverride writer/persistence seam
- [x] 08-02-PLAN.md — reconcile durable parent-visible started/completed/failed truth
- [x] 08-03-PLAN.md — re-run Phase 02 verification and correct roadmap/state sequencing

**Execution status:** ✅ COMPLETE. Phase 08 closed 2026-04-10. Runtime policy override seam restored, parent-visible truth hardened, Phase 02 re-verification green at 18/18. Roadmap and STATE.md reconciled.

**Closure reference:** `.planning/debug/delegation-root-cause-with-reference-2026-04-10.md` — canonical root-cause analysis that informed Phase 09 corrective planning.

### Phase 9: Sticky Delegation Corrective

**Goal:** Fix the multi-layered architectural mismatches identified in the Phase 08 root-cause analysis — message-count stability detection, parent notification durability, sync mode reliability, and execution-mode clarity.

**Root cause:** The harness's completion detection lacks a second independent signal (message-count stability) that oh-my-openagent uses, causing false-positive completions on slow-starting child sessions.

**Depends on:** Phase 08 closure + delegation root-cause findings (`.planning/debug/delegation-root-cause-with-reference-2026-04-10.md`)

**Plans:** 5 plans (derived from root-cause priorities and locked Phase 09 decisions)

Plans:
- [ ] 09-01-PLAN.md — Harden builtin-subsession completion with stable message/tool evidence and a 3-second poll loop
- [ ] 09-02-PLAN.md — Replay durable pending notifications through `createCoreHooks` on parent create/resume
- [ ] 09-03-PLAN.md — Preserve sync dispatch with a structured base64 output envelope instead of raw assistant text
- [ ] 09-04-PLAN.md — Rename `run_in_background` to `async_dispatch` and add launch-time dispatch/tmux/poll config wiring
- [ ] 09-05-PLAN.md — Implement the tmux visible-worker runner and re-verify delegated execution paths end-to-end

**Root causes addressed:**

| # | Root Cause | Phase 9 Plan |
|---|-----------|--------------|
| 1 | OpenCode status model insufficient for completion detection | 09-01 (message-count stability) |
| 2 | `builtin-process` vs `builtin-subsession` diagnostic trap | Documented — no code change needed (classifier works correctly) |
| 3 | Parent notification delivery not durable | 09-02 (wire replay on resume) |
| 4 | Sync mode crashes JSON parser | 09-03 (remove or wrap in structured format) |
| 5 | `background` naming collision | 09-04 (rename parameter) |
| 6 | No message-count stability gate | 09-01 (3+ consecutive polls, parity with oh-my-openagent) |
| 7 | Poll interval too long (15s vs 3s) | 09-01 (reduce to ~3s, match oh-my-openagent) |
| 8 | No tmux integration | Deferred — strategic decision, not a bug |

**oh-my-openagent parity gaps to close:**
- ✅ Task lifecycle state machine — already has explicit `pending/running/completed/error` in lifecycle-manager
- ❌ Message-count stability detection — **missing** (Priority 1)
- ❌ Poll interval (15s → 3s) — **needs reduction** (Priority 1)
- ❌ Parent notification durability — **persistence wired but replay missing** (Priority 2)
- ❌ Sync mode output format — **crashes on large responses** (Priority 3)
