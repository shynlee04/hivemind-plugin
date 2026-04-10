# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-10 (Phase 11: Clean Architecture restructuring — replaces Phase 6+7, consolidates Phase 10+12)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [x] **Phase 2: V3 Runtime Architecture** — 9/9 plans complete, 18/18 verified
- [ ] **Phase 3: Schema Definition** — 0/4
- [ ] **Phase 4: Migration Gate** — 0/4
- [ ] **Phase 5: Integration Verification** — 0/5
- [ ] **Phase 6: Runtime Domain Separation** — SUPERSEDED by Phase 11
- [ ] **Phase 7: Runtime Domain Restructuring Planning** — SUPERSEDED by Phase 11
- [x] **Phase 8: Repair Durable Parent Observability** — ✅ COMPLETE (corrective closure)
- [ ] **Phase 9: Sticky Delegation Corrective** — 5/5 plans executed, P0 gap fixed 2026-04-10
- [ ] **Phase 11: Clean Architecture Restructuring** — 0 plans (replaces Phase 6+7)

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

## Phase 6: Runtime Domain Separation — SUPERSEDED BY PHASE 11

**Superseded by:** Phase 11 (Clean Architecture Restructuring), which absorbs Phase 6 scope with actual execution authority. The 2026-04-10 architecture audit produced the domain boundary analysis Phase 6 was supposed to deliver.

## Phase 7: Runtime Domain Restructuring Planning — SUPERSEDED BY PHASE 11

**Superseded by:** Phase 11. The architecture audit and research conducted on 2026-04-10 produced the move maps, dependency rules, and domain definitions Phase 7 was supposed to create. Phase 11 executes the restructuring directly.

## Phase 8: Repair durable parent observability for delegated sessions

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

## Phase 9: Sticky Delegation Corrective

**Goal:** Fix the multi-layered architectural mismatches identified in the Phase 08 root-cause analysis — message-count stability detection, parent notification durability, sync mode reliability, and execution-mode clarity.

**Root cause:** The harness's completion detection lacks a second independent signal (message-count stability) that oh-my-openagent uses, causing false-positive completions on slow-starting child sessions.

**Depends on:** Phase 08 closure + delegation root-cause findings (`.planning/debug/delegation-root-cause-with-reference-2026-04-10.md`)

**Plans:** 5 plans (derived from root-cause priorities and locked Phase 09 decisions)

Plans:
- [x] 09-01-PLAN.md — Harden builtin-subsession completion with stable message/tool evidence and a 3-second poll loop
- [x] 09-02-PLAN.md — Replay durable pending notifications through `createCoreHooks` on parent create/resume
- [x] 09-03-PLAN.md — Preserve sync dispatch with a structured base64 output envelope instead of raw assistant text
- [x] 09-04-PLAN.md — Rename `run_in_background` to `async_dispatch` and add launch-time dispatch/tmux/poll config wiring
- [x] 09-05-PLAN.md — Implement the tmux visible-worker runner and re-verify delegated execution paths end-to-end

**P0 gap fixed (2026-04-10):** `normalizeMetadata()` in `continuity-normalizers.ts` was silently dropping `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` on process restart. Fixed — typecheck + 604 tests green.

**Root causes addressed:**

| # | Root Cause | Phase 9 Plan |
|---|-----------|--------------|
| 1 | OpenCode status model insufficient for completion detection | 09-01 (message-count stability) |
| 2 | `builtin-process` vs `builtin-subsession` diagnostic trap | Documented — no code change needed |
| 3 | Parent notification delivery not durable | 09-02 (wire replay on resume) |
| 4 | Sync mode crashes JSON parser | 09-03 (remove or wrap in structured format) |
| 5 | `background` naming collision | 09-04 (rename parameter) |
| 6 | No message-count stability gate | 09-01 (3+ consecutive polls, parity with oh-my-openagent) |
| 7 | Poll interval too long (15s vs 3s) | 09-01 (reduce to ~3s, match oh-my-openagent) |
| 8 | No tmux integration | Deferred — strategic decision, not a bug |

## Phase 11: Clean Architecture Restructuring

**Goal:** Restructure and refactor `src/` into a maintainable, extensible, pattern-driven architecture with Clean Architecture patterns, CQRS separation, modular decomposition into 8-10 focused modules (<350 LOC each), and explicit design patterns (Factory, Handler Composition, Strategy).

**Audit evidence (2026-04-10):**
- Architecture audit: 9 anti-patterns found (2 HIGH, 5 MEDIUM, 2 LOW)
- LOC analysis: src/ = 9,385 LOC across 56 files; src/lib/ = 37 flat files
- God object: `lifecycle-manager.ts` at 734 LOC with 14 imports
- Research: AI SDK v6 middleware chain, OpenAI Agents handoff pattern, DDD bounded contexts

**Depends on:** Phase 9 (complete with P0 fix)
**Plans:** 6 plans (phased execution)

**Scope — IN:**
- `src/lib/` — 31 files, flat namespace, mixed concerns
- `src/hooks/` — 5 files, functional grouping (CQRS read-side alignment)
- `src/tools/` — 11 files, best-organized (4 sub-dirs)
- `src/plugin.ts` — 57 LOC, composition root

**Scope — OUT:**
- `.opencode/` — client-side concern
- `tests/` — separate from source restructuring
- `dist/` — build artifact
- `docs/` — documentation

**Scope — AS-IS (preserve):**
- `src/cli/` — install/user runtime scaffolding

**Scope — UNCERTAIN (analyze before deciding):**
- `src/shared/`, `src/schema-kernel/`, `src/kernel/`, `src/harness/`

**Target Module Structure:**
```
src/
├── plugin/              # Assembly root (<100 LOC)
├── tools/               # 5 tools (~500 LOC, write-side CQRS)
├── hooks/               # Event handlers (~800 LOC, read-side CQRS)
├── lifecycle/           # Session state machine (~400 LOC)
├── delegation/          # Delegation chain logic (~400 LOC)
├── continuity/          # State persistence, JSON durability (~400 LOC)
├── cli/                 # CLI substrate (~500 LOC, AS-IS)
├── control-plane/       # Control primitives (~400 LOC)
└── shared/              # Utilities (~800 LOC, leaf module)
```

**Dependency Rules (non-negotiable):**
- `shared/` is leaf — depends on nothing
- `plugin/` depends on everything (assembly root)
- `tools/`, `hooks/`, `cli/`, `control-plane/` depend on `lifecycle/`, `delegation/`, `continuity/`, `shared/`
- `lifecycle/`, `delegation/`, `continuity/` depend on `shared/` only
- No circular dependencies

**File Size Rule:** No file exceeds 350 LOC

**Design Patterns:**

| Pattern | Application |
|---------|-------------|
| Factory | `createTool()`, `createHook()`, `createHandler()` factories for extensible construction |
| Handler Composition | Chain `before/after` hooks via composition, not inheritance |
| Strategy | Pluggable continuity store, notification handlers |
| Command/Query Separation | tools/ = write-side, hooks/ = read-side |

**Execution Plan:**

Plans:
- [ ] 11-01-PLAN.md — Analyze and Map: Audit current src/lib/ 31 files, classify by concern, document cross-dependencies, produce REFACTOR-MAP.md
- [ ] 11-02-PLAN.md — Shared Leaf First: Extract utilities to src/shared/, ensure zero dependencies
- [ ] 11-03-PLAN.md — Core Domain Modules: Create lifecycle/, delegation/, continuity/ with clean internal APIs
- [ ] 11-04-PLAN.md — CQRS Separation: Move tools to src/tools/, hooks to src/hooks/, wire via plugin
- [ ] 11-05-PLAN.md — Plugin Assembly: Compose all modules in src/plugin/ as root (<100 LOC)
- [ ] 11-06-PLAN.md — Validation: npm run typecheck, npm test, verify <350 LOC per file, dependency rules

**Verification Gate:**
- [ ] `npm run build` — compiles without errors
- [ ] `npm test` — all tests pass
- [ ] `npm run typecheck` — zero type errors
- [ ] `src/plugin/` composition root <100 LOC
- [ ] No file in `src/` exceeds 350 LOC
- [ ] `src/shared/` has zero imports from other `src/` modules (leaf verification)

**Identified Risks:**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Flat-folder consolidation causes import breakage | CRITICAL | Dry-run output before executing file moves; phased commits per plan |
| No rollback plan | CRITICAL | Phase commits after each of 6 plans; git history enables revert |
| Vague patterns ("apply architecture patterns") | HIGH | Explicit pattern list: Factory, Handler Composition, Strategy, CQRS |
| Scope creep into uncertain directories | HIGH | AS-IS flag on src/cli/; UNCERTAIN set deferred to Plan 11-01 analysis |
| No validation gate | HIGH | Explicit gate: npm run typecheck && npm test must pass |

## Progress Table

| Phase | Items Complete | Status |
|-------|---------------|--------|
| 1. Baseline Cleanup | 7/10 | Plan created (1 plan, Wave 1) |
| 2. V3 Runtime Architecture | 9/9 plans, 18/18 truths | Verified after Phase 08 corrective closure |
| 3. Schema Definition | 0/4 | Not started |
| 4. Migration Gate | 0/4 | Not started |
| 5. Integration Verification | 0/5 | Not started |
| 6. Runtime Domain Separation | — | SUPERSEDED by Phase 11 |
| 7. Runtime Domain Restructuring Planning | — | SUPERSEDED by Phase 11 |
| 8. Repair Durable Parent Observability | 3/3 plans | ✅ COMPLETE — corrective closure, 2026-04-10 |
| 9. Sticky Delegation Corrective | 5/5 + P0 fix | ✅ COMPLETE — 2026-04-10 |
| 11. Clean Architecture Restructuring | 0/6 | Ready for planning |

## Dependencies

```
Phase 1 (7 done, 3 pending — planned)
  └─→ Phase 2: V3 Runtime baseline
       └─→ Phase 8: Corrective closure for delegated-session durability ✅
            └─→ Phase 2: Authoritative re-verification (18/18) ✅
                 └─→ Phase 9: Sticky Delegation Corrective ✅
                      └─→ Phase 11: Clean Architecture Restructuring (CURRENT)
                           └─→ Phase 3: Schema Definition
                                └─→ Phase 4: Migration Gate
                                     └─→ Phase 5: Integration Verification
```
