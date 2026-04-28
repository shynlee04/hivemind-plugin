# Roadmap: Harness Cleanup → V3 Runtime

**Created:** 2026-04-06
**Updated:** 2026-04-28 (Phases 49-52 added from ses_22ee live UAT evidence)
**Granularity:** Fine

## Phases Overview

- [x] **Phase 1: Baseline Cleanup** — 7/10 done, 3 pending (planned)
- [x] **Phase 2: V3 Runtime Architecture** — 9/9 plans complete, 18/18 verified
- [x] **Phase 3: Schema Definition** — SUPERSEDED by Phase 16.5 (complete Zod schema-kernel, 772 tests)
- [x] **Phase 4: Migration Gate** — SUPERSEDED by Phase 16.4 + Q6 decision (migration control plane, state root locked)
- [x] **Phase 5: Integration Verification** — SUPERSEDED by Phases 14-16 (870+ tests, full verification, typecheck green)
- [ ] **Phase 6: Runtime Domain Separation** — SUPERSEDED by Phase 11
- [ ] **Phase 7: Runtime Domain Restructuring Planning** — SUPERSEDED by Phase 11
- [x] **Phase 8: Repair Durable Parent Observability** — ✅ COMPLETE (corrective closure)
- [~] **Phase 9: Sticky Delegation Corrective** — ⚠️ MOCK-VERIFIED ONLY, runtime verification pending (forensic reset 2026-04-14)
- [~] **Phase 9.1: Critical Bug Fixes + Test Rewrites** — ⚠️ COMPLETE WITH CAVEATS — 668 tests pass but mock-heavy (forensic reset 2026-04-14)
- [~] **Phase 9.2: Completion Detection Architecture** — MIXED: Plan 01 authoritative; Plans 02-03 executed historically but quarantined as non-authoritative
- [x] **Phase 9.3: Module Restructuring + Config** — SUPERSEDED by Phase 14 (all 11 decisions D-01→D-08, D-28→D-30 obsoleted or already implemented; `launchDelegatedSession()` stub replaced with real `DelegationManager.dispatch()`)
- [x] **Phase 12: Correct background session start semantics + planning reconciliation** — 2/2 plans complete, authoritative truth reset established
- [ ] **Phase 13: Async Result Harvesting** — RESCOPED: extract child session results, populate delegation.result
- [x] **Phase 14: delegate-task truth-reset** — 3/3 plans complete, 16/16 verification truths
- [x] **Phase 15: Security & Quality Remediation** — 3/3 plans complete, 26 audit issues fixed
- [~] **Phase 16: Background Delegation Revamp + PTY Integration** — 5/6 plans, Gap 4 closure pending
- [~] **Phase 16.2: PTY Wiring + OMO Safety Patterns** — 1/1 plan, REMEDIATED (CR-01, CR-03 resolved)
- [x] **Phase 16.3: Delegation Subsystem Hardening** — 4/4 plans complete, post-UAT architecture incidents captured; delegation-manifest expansion paused pending 16.4
- [~] **Phase 16.4: Harness Architecture Baseline & Migration Control Plane** — ✅ COMPLETE — architecture baseline established, 4 plans executed (summaries pending — deferred to backlog 999.1)
- [x] **Phase 16.5: Agents Builder Configuration Foundation** — INSERTED; Zod schemas for OpenCode primitives, config compiler, cross-primitive validator, workflow skill, auto-detection routing; VERIFIED (8/8 plans, 772 tests, 3 gap-closure waves, 1 pre-existing delegation-manager test failure)
- [x] **Phase 17: Hivemind Skills Refactor — Critical Fixes** — 5/5 plans complete (C1-C5 resolved, tech-stack synthesis integrated)
- [x] **Phase 18: Context & Research — Skills Refactor Playbook Phase CR** — 8/8 deliverables committed, user sign-off received
- [x] **Phase 19: Rename Sprint — Playbook Phase 1** — 21/21 skills renamed, 368 files changed, all call-sites updated
- [x] **Phase 20: Structural Changes — Playbook Phase 2** — 1 merge, 1 split, 7 new skills created
- [x] **Phase 21: Description Rewrite — Playbook Phase 3** — 7 differential cluster skills rewritten per V.7 template
- [x] **Phase 22: Script Hardening + 6-NON — Playbook Phase 4** — ✅ COMPLETE — 6-NON defence tables added to 7 core skills (per Phase 24 synthesis)
- [x] **Phase 23: Body Quality + Eval — Playbook Phase 5** — ✅ COMPLETE — eval expansion with trigger queries for 6 new skills (per Phase 24 synthesis)
 - [x] **Phase 24: Fix 22 Failed hm-* Skills** — 3/3 plans complete, 8/8 must-haves verified ✅ (2026-04-23)
- [x] **Phase 25: Session Journal + Execution Lineage Bridge** — 4/4 plans complete; journal/lineage bridge plus automatic event-tracker writer and manual export lineage merge verified under `.hivemind/event-tracker/`
- [x] **Phase 31: Planning Documentation Refresh** — 3/3 plans complete — all 10 refreshed documents verified by health check
- [x] **Phase 32: Traceability Reconciliation** — Close audit gaps GAP-TRACE-01/02/03, create 14 missing VERIFICATION.md, reconcile REQUIREMENTS.md with ROADMAP.md evidence
- [x] **Phase 33: Phase 16.4 Closure + Backlog 999.1** — Create 4 retroactive SUMMARY.md, create 16.4-VERIFICATION.md, close validation approval, absorb backlog 999.1
- [x] **Phase 34: Phase 16 Gap 4 — Dual-Mode Execution Wiring** — Wire PTY execution to delegation, implement dispatchCommand(), create run-background-command tool, close remaining Plan 06 requirements
- [ ] **Phase 35: Event-Tracker Fix + Dead Code Cleanup** — PARTIAL: build/test/build gates pass; notification-handler deletion and TD-11 cast deferred
- [ ] **Phase 36: Lifecycle State Machine Enforcement** — P0: real transition guards, activity tracking, 500 LOC split
- [ ] **Phase 37: Async Result Harvesting** — P1: extract child session results into delegation.result
- [ ] **Phase 38: Q6 State Root Migration** — P1: verify all writers target .hivemind/, remove legacy compat
- [ ] **Phase 39: Auto-Loop / Ralph-Loop Engine** — P2: self-referential dev loop until completion
- [ ] **Phase 40: CLI Substrate Foundation** — P2: bin/hivemind-tools.cjs central router
- [ ] **Phase 41: Session Journal Time-Machine** — P2: query API, event replay, past-state reconstruction
- [ ] **Phase 42: Sidecar Foundation** — P3: Next.js 15 dashboard reading .hivemind/ and .planning/
- [x] **Phase 43: Hook Composition Observability Integrity** — Critical: compose tool-guard and plugin after-hook behavior
- [x] **Phase 44: Tool Write-Surface & Secret Hardening** — Critical/security: constrain write/read paths, await writes, remove literal secrets
- [x] **Phase 45: OpenCode SDK Permission Boundary** — Critical: align child-session permission/tool policy with supported SDK surfaces
- [x] **Phase 46: Delegation Dispatch, Completion & Recovery Truth** — High: prevent false dispatched/completed/error states
- [x] **Phase 47: Runtime Policy & Command Buffer Hardening** — Medium: workspace policy input and bounded command output
- [ ] **Phase 48: Real OpenCode Runtime Integration Verification** — DEGRADED: health/session/tool registration pass; hook/tool-exec/delegation completion gaps remain
- [ ] **Phase 48.1: Runtime Correctness: Lifecycle, Queue, Persistence Truth** — Remediate lifecycle, queue-key, and persisted delegation truth gaps exposed by Phase 48
- [ ] **Phase 48.2: Security Boundary Hardening: Secrets, Scope, Category Gates** — Harden secret handling, scope controls, and category gate enforcement after runtime correctness is restored
- [x] **Phase 48.3: OpenCode SDK/CQRS Integration Alignment** — Align OpenCode SDK surfaces and CQRS boundaries after runtime and security invariants are stable
- [ ] **Phase 48.4: Production Evidence & Coverage Recovery** — 5 plans, 4 waves: coverage infra → behavioral tests → mock upgrades → gap classification
- [x] **Phase 48.5: Architecture LOC Cleanup: Event Tracker Writer Split** — COMPLETE: 3/3 plans, validation PASS WITH RUNTIME GAP RECOMMENDATION
- [x] **Phase 49: UAT Tool Contract & PTY Command Reliability** — COMPLETE WITH PARTIAL RUNTIME EVIDENCE: command contract, prompt heuristics, and journal export filters stabilized
- [ ] **Phase 50: OpenCode Primitive Restart Readiness** — Make configured agents, commands, skills, and permissions restart-valid under project-local OpenCode discovery
- [ ] **Phase 51: Stack Research & Synthesis Skill Runtime Grounding** — Ground stack-feature, OpenCode SDK/plugin, custom-tool, deep-research, and synthesis skills in live harness workflows
- [ ] **Phase 52: End-User Harness Workflow Acceptance** — Prove real-life orchestrator/subagent workflows complete end-to-end through the production harness surface
- [ ] **Phase 11: Lifecycle State Machine + 500 LOC Enforcement** — RESCOPED: state machine guards, activity tracking, delegation-manager split

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

## Phase 3: Schema Definition — SUPERSEDED BY PHASE 16.5

**Superseded by:** Phase 16.5 (Agents Builder Configuration Foundation). Phase 16.5 delivered complete Zod schema-kernel covering all YAML frontmatter schemas (agent, command, skill, permission, MCP server, tool, config precedence) plus TypeScript type generation — 772 tests passing in `src/schema-kernel/`. All Phase 3 requirements (3a-3d) are satisfied by Phase 16.5 deliverables.

## Phase 4: Migration Gate — SUPERSEDED BY PHASE 16.4 + Q6 DECISION

**Superseded by:** Phase 16.4 (Harness Architecture Baseline & Migration Control Plane) plus Q6 locked decision (`docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`). Migration control plane established, state root boundaries locked (`.hivemind/` for internal state, `.opencode/` for OpenCode primitives only). Phase 38 handles remaining Q6 state root migration enforcement.

## Phase 5: Integration Verification — SUPERSEDED BY PHASES 14-16

**Superseded by:** Phases 14-16 collectively deliver all Phase 5 requirements. 870+ tests passing, full verification across delegation, persistence, PTY, and SDK surfaces. Typecheck and build green. Schema validation via Phase 16.5 Zod schemas (772 tests). All Phase 5 requirements (5a-5g) satisfied by existing test and verification infrastructure.

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

## Phase 9: Sticky Delegation Corrective — SPLIT INTO SUB-PHASES

**Original goal:** Fix multi-layered architectural mismatches from Phase 08 root-cause analysis.
**Original result:** ⚠️ MIXED HISTORICAL STATE — forensic investigation (2026-04-14) confirmed UAT was inflated. Code exists and 09.2-02/03 produced historical execution artifacts, but those closure claims are quarantined as non-authoritative. Fresh runtime verification or replanning is still required.
**Decision:** Split 30 locked decisions across 7 clusters into 3 focused sub-phases.

**Parent context:** `.planning/phases/09-sticky-delegation-corrective/09-CONTEXT.md` (all 30 decisions D-01→D-30)

---

### Phase 9.1: Critical Bug Fixes + Test Rewrites

**Goal:** Fix the 5 runtime bugs that make delegation non-functional, then rewrite the mock-heavy tests to validate real behavior. This is the unblock-everything phase.

**Decisions:** D-15→D-19 (bug fixes), D-20→D-24 (test strategy) — 10 decisions
**Depends on:** Phase 08 closure
**Context:** `.planning/phases/09.1-critical-bug-fixes-test-rewrites/09.1-CONTEXT.md`

**Bug fixes (from UAT forensic evidence):**
- D-15: Add `status === "started"` branch in notification-handler.ts
- D-16: Return `{ type: "unknown" }` instead of defaulting to `"busy"` in checkSessionExists()
- D-17: Only count ASSISTANT messages as evidence, not user prompt
- D-18: Don't cache external `session.idle` events; only cache internal stability timer results
- D-19: Architectural — fire-and-forget stays, but observer must work correctly (D-15→D-18 fix it)

**Test rewrites:**
- D-20: In-memory adapters for SDK boundary (Clean Architecture testing pattern)
- D-21: Mock only SDK transport + time; NEVER mock internal business logic
- D-22: LOC > 300 not tolerable; dead code forbidden
- D-23: Every test must surface rationales (WHY, WHAT, HOW)
- D-24: Rewrite mock-heavy files: lifecycle-background-observer.test.ts, delegate-task.test.ts, delegate-task-overflow.test.ts, lifecycle-process-runner.test.ts

**Plans:** 3 plans

Plans:
- [x] 09.1-01-PLAN.md — Fix all 5 runtime bugs with TDD regression tests (D-15→D-19) [Wave 1] ⚠️ mock-verified only
- [x] 09.1-02-PLAN.md — Create in-memory SDK adapter + rewrite lifecycle-background-observer tests (D-20, D-21, D-22, D-23, D-24) [Wave 2] ⚠️ mock-verified only
- [x] 09.1-03-PLAN.md — Create delegate-task tests + rewrite process-runner tests with in-memory adapter (D-21, D-24) [Wave 3] ⚠️ mock-verified only

---

### Phase 9.2: Completion Detection Architecture

**Goal:** Implement the user-specified completion detection logic — start gate, backoff polling, true completion, failure handling, parent coordination. This makes delegation actually work end-to-end.

**Decisions:** D-09→D-14 (completion detection), D-25→D-27 (oh-my-openagent patterns) — 9 decisions
**Depends on:** Phase 9.1 (bugs must be fixed first)
**Context:** `.planning/phases/09.2-completion-detection-architecture/09.2-CONTEXT.md`

**Completion detection sub-module:**
- D-09: Completion detection as sub-module `src/lib/tasking/completion/`
- D-10: START GATE — delegation only "started" when ≥1 thinking block + ≥2 tool calls verified
- D-11: POLLING — 15s initial, +5s backoff, 60s cap
- D-12: TRUE COMPLETION — last message is assistant + idle + 2 consecutive polls + start gate evidence
- D-13: FAILURE HANDLING — 180s idle timeout, up to 2 retries, resume-first with same session ID
- D-14: PARENT COORDINATION — main session closes only when ALL delegations + ALL user tasks complete

**Reference architecture:**
- D-25: Adapt oh-my-openagent BackgroundManager pattern
- D-26: Adapt TmuxSessionManager pattern
- D-27: Evaluate oh-my-openagent's direct message injection for notifications

Plans:
- [x] 09.2-01-PLAN.md — Implement completion detection sub-module (start-gate, poll-strategy, completion-verifier) ✅ pure modules shipped
- [~] 09.2-02-PLAN.md — Historical execution artifact exists in `09.2-02-SUMMARY.md`, but it is quarantined/non-authoritative pending fresh verification or replanning
- [~] 09.2-03-PLAN.md — Historical execution artifact exists in `09.2-03-SUMMARY.md`, but it is quarantined/non-authoritative pending fresh authoritative follow-up

### Phase 12: Correct background session start semantics, reconcile Phase 09/09.1/09.2, and archive obsolete architectural noise

**Goal:** Make background delegation report truthful start state, then reconcile the Phase 09-family artifacts and planning metadata to that corrected runtime reality.
**Requirements**: [PH12-01, PH12-02, PH12-03, PH12-04]
**Depends on:** Phase 08 corrective sequencing baseline plus the existing Phase 09/09.1/09.2 runtime corridor (not Phase 11)
**Plans:** 2/2 plans complete

**Execution status:** ✅ COMPLETE. Phase 12 closed the false-start corridor, quarantined contaminated 09.2 completion summaries, and refreshed roadmap/project/state artifacts to the corrected dependency chain.

**Authoritative references:**
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-01-SUMMARY.md`
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-reconciliation-note-2026-04-14.md`

**Requirement details:**
- **PH12-01:** Async builtin-subsession children stay non-started until observer-confirmed D-10 start-gate evidence exists.
- **PH12-02:** Parent-visible `started` reminders and lifecycle status stay honest across background execution families.
- **PH12-03:** Phase 09/09.1/09.2 artifacts are reconciled so quarantined claims cannot be mistaken for authoritative runtime truth.
- **PH12-04:** Roadmap/state/project metadata and stale architectural notes are archived or rewritten to the corrected dependency chain.

Plans:
- [x] 12-01-PLAN.md — Lock truthful async start semantics and regression coverage
- [x] 12-02-PLAN.md — Reconcile Phase 09-family artifacts and archive stale planning noise

### Phase 13: Async Result Harvesting (RESCOPED)

**Original goal:** Fix async delegated result capture — RESCOPED to result harvesting only.
**New goal:** Implement result extraction from child sessions — when stability detection confirms completion, harvest the child session's last assistant message and store in `delegation.result`. Add direct `delegation-persistence.ts` unit tests.
**Depends on:** Phase 36 (lifecycle state machine)
**Plans:** 5 plans

### Scope
- Extract child session results in `sdk-delegation.ts` completion path
- Populate `delegation.result` field (currently always `undefined`)
- Update `delegation-status` tool to return harvested results
- Add `tests/lib/delegation-persistence.test.ts`

### Phase 14: delegate-task truth-reset — Rebuild with WaiterModel + dual-signal + hybrid persistence + dedicated status tool

**Goal:** Rebuild delegate-task with corrected architecture: WaiterModel always-background execution (no sync/async split), dual-signal completion detection (session.idle + message count stability, no fixed timeouts), hybrid persistence (disk + in-memory), and a dedicated delegation-status tool for polling results. Cleanup half is DONE; this is the rebuild.
**Requirements**: REQ-14-01 through REQ-14-08
**Depends on:** Phase 12 (truthful start semantics baseline)
**Plans:** 3/3 plans complete

Plans:
- [x] 14-01-PLAN.md — DelegationManager Rewrite: WaiterModel dispatch + dual-signal completion + hybrid persistence (Wave 1, TDD)
- [x] 14-02-PLAN.md — Tools + Wiring: Rewrite delegate-task tool, create delegation-status tool, wire in plugin.ts, update AGENTS.md (Wave 2, TDD)
- [x] 14-03-PLAN.md — Test Hardening: Audit and expand all delegation tests for runtime-truthful coverage per D-08 (Wave 3, TDD)

### Phase 15: Security & Quality Remediation — fix all 26 audit issues from comprehensive codebase audit

**Goal:** Fix all 26 audit findings from the comprehensive 6-phase codebase audit. Deliver a spotless, production-ready .opencode/ configuration with zero security vulnerabilities, zero portability failures, zero dangling references, and all files conforming to OpenCode platform standards. This phase modifies ONLY soft meta-concepts (skills, agents, commands) — no src/ code changes.
**Requirements**: C-1, C-2, C-3, W-1, W-2, W-3, W-4, W-5, W-6, W-7, W-8, W-9, W-10, W-11, W-12
**Depends on:** Phase 14
**Plans:** 3/3 plans complete

Plans:
- [x] 15-01-PLAN.md — Critical security fixes: remove profanity, replace wildcard permissions, scope conductor access, fix hardcoded paths, disambiguate agent hierarchy (Wave 1)
- [x] 15-02-PLAN.md — High-severity command & skill fixes: add frontmatter, quote $ARGUMENTS, add files_to_read blocks, resolve dangling skill refs (Wave 2)
- [x] 15-03-PLAN.md — Remaining fixes + cross-phase risk verification: narrow triggers, verify XPR-1 through XPR-4 closure (Wave 3)

### Phase 16: Background Delegation Revamp + PTY Integration -- Rebuild background delegation to overcome all current limitations (read-only restriction, 15-min timeout, no undo/branching parity, no write-capable background) by synthesizing architecture from oh-my-openagent background-agent/spawner/concurrency/tmux stack, opencode-background-agents lifecycle plugin, and opencode-pty interactive PTY. Produce a superior delegate-task that rivals or surpasses OpenCode built-in task tool while adding PTY interactive background processes as default. Depends on: Phase 14, Phase 15

**Goal:** Write-capable background delegations run through parent-linked PTY-first child sessions with extracted spawner modules, truthful single-owner lifecycle orchestration, and status polling that preserves WaiterModel + dual-signal completion semantics.
**Requirements**: TBD
**Depends on:** Phase 15
**Plans:** 6 plans (5 complete, 1 gap closure)

Plans:
- [x] 16-01-PLAN.md — add bun-pty dependency, canonical PTY/spawner contracts, and shared assistant-text extraction foundation
- [x] 16-02-PLAN.md — build and test the PTY manager + bounded PTY buffer subsystem
- [x] 16-03-PLAN.md — build and test the dedicated spawner subsystem (session creator, directory resolver, key resolver, PTY-first setup)
- [x] 16-04-PLAN.md — integrate spawner + PTY into DelegationManager, collapse lifecycle ambiguity, and expose execution metadata through tools/plugin
- [x] 16-05-PLAN.md — Gap closure: persist queue-key context + fix true dual-signal message-stability completion (Gaps 1-3, 5)
- [ ] 16-06-PLAN.md — Gap closure: honest dual-mode execution (SDK for agents, PTY for commands) + standalone PTY command tool (Gap 4)

**Execution status:** GAP CLOSURE ACTIVE. Plans 01-05 complete; verification gaps 1-3 and 5 are closed via persisted queue-key context and real message-stability completion. Plan 06 remains to close the final honest dual-mode execution gap.

### Phase 16.4: Harness Architecture Baseline & Migration Control Plane (INSERTED)

**Goal:** Establish a verified architecture baseline and migration control plane for the Hivemind harness before any further delegation-manifest expansion, product-detox migration, agent hierarchy hardening, runtime configuration, user settings, or sidecar/GUI work. This phase must resolve the real starters: state ownership, lifecycle ownership, code-tree organization, soft-vs-hard harness boundaries, extensibility rules, migration gates, and evidence-backed architecture constraints.
**Requirements**: TBD
**Depends on:** Phase 16, Phase 16.3 post-UAT incident findings
**Plans:** 4 plans executed (summaries pending)

Plans:
- [x] 16.4-01 — harness architecture baseline (ran, no SUMMARY.md — deferred to backlog 999.1)
- [x] 16.4-02 — migration control plane (ran, no SUMMARY.md — deferred to backlog 999.1)
- [x] 16.4-03 — state ownership model (ran, no SUMMARY.md — deferred to backlog 999.1)
- [x] 16.4-04 — lifecycle boundaries (ran, no SUMMARY.md — deferred to backlog 999.1)

### Phase 16.5: Agents Builder Configuration Foundation (INSERTED)

**Goal:** Build the foundation for a configurable agents builder system wired to the hivefiver module — Zod schemas for all OpenCode primitives (agent frontmatter, command frontmatter, permission ruleset, skill metadata, MCP server, tool definition, config precedence), cross-primitive conflict validator, config compiler (JSON/YAML ↔ .md round-trip), interactive workflow skill, and auto-detection routing for natural-language agent configuration intent.
**Requirements**: R-01 through R-06 (6 cycles) — ALL COMPLETE
**Depends on:** Phase 16.4 (architecture baseline, module boundaries, dependency rules)
**Plans:** 8/8 plans (5 original + 3 gap closure)
**Status:** ✅ COMPLETE — All 8 plans verified (5 original + 3 gap closure). 772 tests pass. BLOCKER-1/2/3 closed, CRITICAL-4/5/6/7 resolved, HIGH-10 resolved.

Plans:
- [x] 16.5-01: Cross-Primitive Validator (R-02)
- [x] 16.5-02: Config Compiler (R-03)
- [x] 16.5-03: Test Harness (R-06)
- [x] 16.5-04: Workflow Skill (R-04)
- [x] 16.5-05: Orchestrator Enhancement (R-05)
- [x] 16.5-fix: UAT intent detection gaps + Turn 0 discovery + batch modify
- [x] 16.5-06: Schema Resilience + Discovery Loader (BLOCKER-1, BLOCKER-3) [Wave 1]
- [x] 16.5-07: Framework-Agnostic Stacking + Runtime Validation (BLOCKER-2, CRITICAL-4, CRITICAL-7) [Wave 2]
- [x] 16.5-08: Mixed-Primitive Batch + Eval Harness (CRITICAL-5, CRITICAL-6, HIGH-10) [Wave 3]

### Phase 16.3: Delegation Subsystem Hardening — Fix critical gaps in parent resumption, notification delivery, and signal handling (INSERTED)

**Goal:** Harden the existing delegation subsystem so recovery, notification delivery, and terminal reporting remain truthful by surface: SDK delegations resume reliably, PTY command sessions stay best-effort resumable, headless fallback is explicitly non-resumable after restart, and parent completion delivery works notification-first with signal-aware terminal detail.
**Requirements**: TBD
**Depends on:** Phase 16
**Plans:** 3 plans

**Execution status:** COMPLETE. Plans 01-03 are complete.

Plans:
- [x] 16.3-01-PLAN.md — publish truthful surface-specific recovery contracts for delegation records and tools
- [x] 16.3-02-PLAN.md — make completion delivery notification-first, durable, and replayable
- [x] 16.3-03-PLAN.md — preserve surface-aware terminal and signal semantics across runtime surfaces

### Phase 16.2: PTY Execution Wiring + OMO Safety Patterns

**Goal:** Close two critical gaps identified in Phase 16 verification: (1) verify PTY execution wiring for command delegations is complete and add unified terminal lifecycle, and (2) backfill OMO-proven safety patterns — grace periods for memory cleanup, parent notifications, adaptive polling, and nesting depth limits.

**Requirements**: 24 requirements (8 × P0, 10 × P1, 6 × P2) — see 16.2-SPEC-2026-04-22.md
**Depends on:** Phase 16 (plans 01-06 complete or near-complete), Phase 15
**SPEC:** `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16.2-SPEC-2026-04-22.md` (validated against codebase)
**Validation:** `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16.2-SPEC-CODEBASE-VALIDATION-2026-04-22.md`
**Learnings fed forward:** 14-LEARNINGS.md, 15-LEARNINGS.md, 16-LEARNINGS.md

**Scope:**
- PTY execution wiring verification (6 of 24 requirements already implemented)
- Terminal lifecycle with grace period (memory leak fix for delegations never cleaned from Map)
- Unified transitionToTerminal() method for all 6 terminal paths
- Parent notification on all terminal paths (fire-and-forget via SDK)
- Adaptive polling intervals replacing fixed 3-second interval
- Nesting depth enforcement (MAX_DELEGATION_DEPTH from 1→3 with RuntimePolicy override)
- Observability: transition logging, structured status counts, terminal path integration tests

**Prerequisites (blocking):**
- Fix 3 typecheck errors from partial merge (undefined constants + missing import)

**Plans:** 1 plan

Plans:
- [x] 16.2-01-PLAN.md — PTY Execution Wiring + OMO Safety Patterns: unified terminal lifecycle, grace-period cleanup, parent notifications, adaptive polling, nesting depth limits, observability (6 waves)

### Phase 17: Hivemind Skills Refactor — Critical Fixes (Playbook Phase 0)

**Goal:** Resolve all critical bugs before any structural skills work begins. First of 6 continuation phases mapping the HIVEMIND-SKILLS-REFACTOR-PLAYBOOK into GSD phases 17–22.
**Requirements**: C1–C5 (5 critical issues)
**Depends on:** Phase 16 completion
**Specification:** `.hivemind/state/session-context-prompt-v4.md` (GSD phase-planning specification)
**Playbook:** `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` (canonical reference)

**Scope (5 critical issues):**

| ID | Issue | Skill | Fix |
|----|-------|-------|-----|
| C1 | `validate-gate.sh synthesize` guaranteed failure | `hm-skill-synthesis` | Add `synthesize` action OR change SKILL.md to use `create` |
| C2 | 4 depth references are stubs | `hm-meta-builder` | Write real content or remove references |
| C3 | Phantom `tech-stack.md` reference | `hm-omo-reference` | Generate file or remove from `summary.md` |
| C4 | Empty `project-structure.md` (4 lines) | `hm-omo-reference` | Regenerate with actual directory tree |
| C5 | Duplicate skills across `.claude/` and `.opencode/` | 5 skills | Determine canonical, delete duplicates |

**Continuation mapping (v2.0 — Phase CR inserted):**

```
Playbook Phase 0 (Critical Fixes)      → GSD Phase 17 (COMPLETE)
Playbook Phase CR (Context & Research)  → GSD Phase 18 (this phase → next)
Playbook Phase 1 (Rename Sprint)       → GSD Phase 19
Playbook Phase 2 (Structural Changes)  → GSD Phase 20
Playbook Phase 3 (Description Rewrite) → GSD Phase 21
Playbook Phase 4 (Script Hardening)    → GSD Phase 22
Playbook Phase 5 (Body Quality + Eval) → GSD Phase 23
```

**Exit criteria:** All 5 criticals resolved, no dead references in affected skills, `npm run typecheck` passes (if applicable).

**Plans:** 5 plans

Plans:
- [ ] 17-01-PLAN.md — C1: Restore skill-synthesis from retired/ to active/ + symlink (Wave 1)
- [ ] 17-02-PLAN.md — C5: Gitignore IDE skill directories + document canonical location in AGENTS.md (Wave 1)
- [ ] 17-03-PLAN.md — C2: Fill 4 meta-builder depth stubs + register in Reference Map (Wave 1)
- [ ] 17-04-PLAN.md — C3+C4: OMO dead-reference audit + generate tech-stack.md, verify project-structure.md (Wave 1)
- [ ] 17-05-PLAN.md — NEW: Unify tech-registry schema + integrate tech-stack synthesis across hm-* skills (Wave 2)

### Phase 18: Context & Research — Skills Refactor Playbook Phase CR

**Goal:** Produce the evidence base and audit posture that Phases 1–5 consume. Prevent 6-NON failures from regressing downstream phases. No skill refactoring in this phase — only research, audit, and decision artifacts.

**Requirements**: CR-01 through CR-08 (8 deliverables per playbook §VI.CR.10)
**Depends on:** Phase 17 (complete)
**Specification:** `.hivemind/state/session-context-prompt-v4.md` (GSD phase-planning specification)
**Playbook mapping:** Playbook Phase CR → GSD Phase 18

**Scope (research + audit only — NO skill edits):**
1. Fresh runtime probe of every active skill (count, names, grades vs I.1.2 table)
2. Per-skill 6-NON audit grid (defense posture against NON-1..NON-6)
3. Differential cluster gap map (G-A through G-D per §V.3.2)
4. Third-party pattern harvest (from gsd-*, superpower-*, retired skills)
5. Runtime-integration readiness assessment (soft→hard migration feasibility)
6. Tooling decision table (for each skill: no-change / description / body / bundle / rename / split / merge / retire)

**Deliverables (per playbook §VI.CR.10):**

| # | Deliverable | File |
|---|-------------|------|
| CR-01 | Phase context envelope | `CR-CONTEXT.md` |
| CR-02 | Grounded research document | `CR-RESEARCH.md` |
| CR-03 | Per-skill 6-NON audit grid | `CR-AUDIT-ECOSYSTEM.md` |
| CR-04 | Differential cluster gap map | `CR-GAP-MAP.md` |
| CR-05 | Third-party pattern harvest | `CR-THIRD-PARTY-HARVEST.md` |
| CR-06 | Runtime-readiness map | `CR-RUNTIME-READINESS.md` |
| CR-07 | Tooling decision table | `CR-DECISIONS.md` |
| CR-08 | Verification report | `CR-VERIFICATION.md` |

**Status:** ✅ COMPLETE (user sign-off received 2026-04-23)

**Plans:** 4 plans (all complete)

Plans:
- [x] 18-01-PLAN.md — Wave 1: Ecosystem audit — CR-CONTEXT.md + CR-RESEARCH.md
- [x] 18-02-PLAN.md — Wave 2: 6-NON defence grid + differential cluster gap map
- [x] 18-03-PLAN.md — Wave 3: Third-party pattern harvest + runtime-readiness
- [x] 18-04-PLAN.md — Wave 4: Tooling decisions + verification + sign-off

---

### Phase 19: Rename Sprint — Playbook Phase 1

**Goal:** Execute the `hm-*` / `hivefiver-*` namespace migration for all 21 skills requiring rename per CR-DECISIONS.md.
**Requirements:** All skills in I.1.2 moved from current name → Planned Name; all call-sites updated
**Depends on:** Phase 18 (complete)
**Playbook:** `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` §VI.1

**Scope:** 21 skill renames + call-site updates across agents, commands, playbook, AGENTS.md
**Hard constraints:** Zero `src/` changes; zero agent/command structural refactors (only `permission.skill` updates); zero IDE-directory modifications

**Execution status:** ✅ COMPLETE. Commit `7b686311`. 368 files changed, 8176 insertions, 3250 deletions. All renames detected as git renames. All agent permissions, command bodies, routing tables, and playbook references updated.

### Phase 25: Session Journal + Execution Lineage Bridge

**Goal:** Build the first `.hivemind/`-aligned audit/projection bridge for session journals and execution lineage without replacing continuity/delegation runtime truth.
**Requirements**: ROADMAP-25, JOURNAL-01, JOURNAL-02, JOURNAL-03(seed), HIVEMIND-ROOT-01(partial)
**Depends on:** Phase 24
**Plans:** 4/4 complete — ✅ COMPLETE 2026-04-26

Plans:
- [x] 25-01-PLAN.md — journal contract and `.hivemind/` taxonomy starter
- [x] 25-02-PLAN.md — rebuildable execution lineage projection
- [x] 25-03-PLAN.md — JSON/Markdown export tool and plugin wiring
- [x] 25-04-PLAN.md — event-tracker automatic parser/writer/meta-writer under `.hivemind/event-tracker/`

**Verification:** PASS — `npm run typecheck`, focused Phase 25 + event-tracker/plugin vitest suites, `npm run build`, and `npm test` (857 passed, 1 todo, 1 skipped).

### Phase 31: Planning Documentation Refresh

**Goal:** Synthesize 6 locked validation decisions (Q1-Q6) and research from phases 16.4-30 into all stale `.planning/` core documents. Refresh PROJECT.md, REQUIREMENTS.md, ROADMAP.md phase statuses, STATE.md progress, and all codebase/*.md documents to reflect current architecture reality.
**Requirements**: DOC-REFRESH-01 through DOC-REFRESH-10 (10 document updates)
**Depends on:** Phase 26 (COMPLETE — quality synthesis), validation decisions locked in `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`
**Plans:** 3 plans

**Documents to update:**
- PROJECT.md — rewrite to reflect V3 composition engine + 6 validation decisions + `.hivemind/` migration
- REQUIREMENTS.md — add Q1-Q6 decision-derived requirements, remove stale requirements
- ROADMAP.md — correct phase statuses (16.4 COMPLETE, 27-30 status), remove superseded phases
- STATE.md — recalculate progress, update current position, reflect validation decisions
- codebase/ARCHITECTURE.md — 9-surface mutation authority, `.hivemind/` state root, Q6 migration
- codebase/STRUCTURE.md — current directory structure after phases 17-26
- codebase/STACK.md — Q1 Layer 2 runtime taxonomy, MCP tools, dependency graph
- codebase/CONCERNS.md — C1-C7 all resolved/partially-resolved, update status
- codebase/INTEGRATIONS.md — Q2 sidecar architecture, OpenCode SDK server API
- codebase/TESTING.md — Q5 RICH gate requirements, full RICH no-compromise

Plans:
- [x] 31-01-PLAN.md — Core documents refresh: PROJECT.md + REQUIREMENTS.md + ROADMAP.md + STATE.md (Wave 1)
- [ ] 31-02-PLAN.md — Codebase documents refresh: ARCHITECTURE + STRUCTURE + STACK + CONCERNS + INTEGRATIONS + TESTING (Wave 1)
- [ ] 31-03-PLAN.md — Milestone archive creation + cross-document health verification (Wave 2, depends on 31-01 and 31-02)

### Phase 26: Synthesize all hm-star skills debts gaps conflicts across Phases 17-24 into unified requirements and specs starting with spec-driven-authoring and test-driven-execution lineages first detect ecosystem conflicts archive regressions

**Goal:** Synthesize hm-* skill quality debts into a playbook, audit, G-B specs, archive report, execution roadmap, and HMQUAL requirements for Phase 27-30 execution.
**Requirements**: SYN-01, SYN-02, SYN-03, SYN-04, SYN-05, SYN-06
**Depends on:** Phase 25
**Plans:** 5/5 complete — ✅ COMPLETE 2026-04-25

Plans:
- [x] 26-01-PLAN.md — write hm-* skill quality playbook
- [x] 26-02-PLAN.md — audit canonical hm/hivefiver skill ecology
- [x] 26-03-PLAN.md — write G-B demonstration SPECs
- [x] 26-04-PLAN.md — archive Phase 22/23 scope truth
- [x] 26-05-PLAN.md — execution roadmap and HMQUAL requirements

### Phase 27: G-B Quality Assurance Demonstration

**Goal:** Rewrite and evidence the first quality-assurance demonstration pair (hm-spec-driven-authoring + hm-test-driven-execution) so the quality playbook becomes executable, not merely aspirational.
**Requirements**: HMQUAL-01, HMQUAL-02 (primary); HMQUAL-03 through HMQUAL-08 (supporting)
**Depends on:** Phase 26 (COMPLETE — quality synthesis, PLAYBOOK, ECOLOGY-AUDIT, G-B SPECs, ARCHIVE-REPORT)
**Plans:** 3 plans

**Deliverables:**
- Updated hm-spec-driven-authoring skill with REQ-SDA-01 through REQ-SDA-08 evidence
- Updated hm-test-driven-execution skill with REQ-TDE-01 through REQ-TDE-08 evidence
- Eval bundles with positive, negative, boundary, and stacked scenarios
- Summary evidence showing both target skills score PASS on D1-D8

**Entry criteria:** Phase 26 complete; 26-PLAYBOOK.md, 26-ECOLOGY-AUDIT.md, both G-B SPECs, 26-ARCHIVE-REPORT.md, 26-EXECUTION-ROADMAP.md, and HMQUAL requirements exist.

### Phase 28: G-C Research Lineage

**Goal:** Apply the proven G-B quality pattern to the research and synthesis lineage (hm-deep-research, hm-detective, hm-synthesis, hm-research-chain) so deep investigation workflows become evidence-backed, chained, and portable.
**Requirements**: HMQUAL-01 through HMQUAL-08
**Depends on:** Phase 27 (G-B demonstration complete with D1-D8 evidence)
**Plans:** TBD

**Entry criteria:** Phase 27 summary proves G-B skills have D1-D8 evidence or documents exact unresolved blockers.

### Phase 29: G-D Execution Lineage

**Goal:** Bring execution, debugging, refactoring, planning, and support skills up to runtime-truthful quality standards (15 skills) so agents can complete work without false closure or unbounded retries.
**Requirements**: HMQUAL-01 through HMQUAL-08
**Depends on:** Phase 28 (G-C research lineage with D1-D8 evidence)
**Plans:** TBD

**Skills affected:** hm-debug, hm-refactor, hm-phase-execution, hm-planning-with-files, hm-command-parser, hm-agent-composition, hm-agents-md-sync, hm-opencode-project-audit, hm-opencode-project-inspection, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hivefiver-agents-and-subagents-dev, hivefiver-command-dev, hivefiver-custom-tools-dev, hivefiver-use-authoring-skills

**Entry criteria:** Phase 28 summary provides research/synthesis evidence patterns and remaining G-C gaps.

### Phase 30: G-A Guardrail Lineage

**Goal:** Harden guardrails, loops, delegation boundaries, and intent handling (5 skills) so multi-agent workflows terminate honestly, recover across sessions, and escalate when verification is missing.
**Requirements**: HMQUAL-01 through HMQUAL-08
**Depends on:** Phase 29 (G-D execution lineage with D1-D8 evidence)
**Plans:** TBD

**Skills affected:** hm-completion-looping, hm-phase-loop, hm-subagent-delegation-patterns, hm-user-intent-interactive-loop, hivefiver-delegation-gates

**Entry criteria:** Phase 29 summary provides execution-lineage recovery and verification evidence for guardrail inheritance.

### Phases 27-30: HMQUAL / RICH Skill Quality Execution Closure

**Goal:** Apply HMQUAL D1-D8 plus `.planning/RICH-SKILL-QUALITY-GATE.md` to QA, research, execution/OpenCode, and guardrail lineages.
**Requirements:** HMQUAL-01 through HMQUAL-08 plus RICH-1 through RICH-8.
**Latest closure evidence:** `.planning/phases/30-g-a-guardrail-lineage-harden-completion-loops-phase-loops-de/30-FINAL-RICH-CLOSURE-2026-04-25.md`.
**Status:** PASS overall — Phases 27, 28, 29, and 30 pass for the HMQUAL/RICH closure scope.

Remaining no-PASS blockers: none for Phases 27-30. Generic trigger competition with global skills is documented as acceptable coexistence unless exact project trigger phrases fail.

---

### Phase 20: Structural Changes — Playbook Phase 2

**Goal:** Merge, split, and create skills per differential cluster gap map (G-A through G-D).
**Requirements:** CR-GAP-MAP.md + CR-DECISIONS.md decisions (c), (f), (g), (h)
**Depends on:** Phase 19 (complete)
**Playbook:** `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` §VI.2

**Scope:**
- Merge `session-context-manager` → `hm-planning-with-files`
- Split `harness-delegation-inspection` → `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection`
- Create G-A skills: `hm-completion-looping`, `hm-subagent-delegation-patterns`
- Create G-B skills: `hm-spec-driven-authoring`, `hm-test-driven-execution`
- Create G-C skill: `hm-research-chain`
- Create G-D skills: `hm-debug`, `hm-refactor`, `hm-phase-execution`

**Hard constraints:** Zero `src/` changes; zero IDE-directory modifications

### Phase 9.3: Module Restructuring + Config — SUPERSEDED BY PHASE 14

**Superseded by:** Phase 14 (delegate-task truth-reset). All 11 decisions D-01→D-08, D-28→D-30 are obsoleted or already implemented. The `launchDelegatedSession()` stub has been replaced with real `DelegationManager.dispatch()` via WaiterModel + dual-signal completion. Zod config schemas are delivered by Phase 16.5 `src/schema-kernel/`. Lifecycle restructuring is rescoped to Phase 36.

## Phase 11: Lifecycle State Machine + 500 LOC Enforcement (RESCOPED)

**Original goal:** Clean architecture restructuring — RESCOPED to targeted fixes only.
**New goal:** Enforce lifecycle state machine transitions in `lifecycle-manager.ts`, implement activity tracking, and split `delegation-manager.ts` (510 LOC) under the 500 LOC project limit.
**Depends on:** Phase 35 (event-tracker fix + dead code cleanup)
**Plans:** 5 plans

### Scope
- Replace stub `isValidTransition()` (always returns `true`) with proper `SessionLifecyclePhase` transition guards
- Implement `noteObservedActivity()` for session activity tracking
- Extract PTY-specific delegation logic from `delegation-manager.ts` to reduce under 500 LOC

### Phase 24: Fix 22 Failed hm-* Skills

**Goal:** Fix 22 failed hm-* skills: (1) Remove 6-NON Defence Tables from all skills — these are development process guidance, NOT skill content. (2) Add onboarding headings that explain WHAT each skill is and WHEN to use it. (3) Remove banned vocabulary (GSD, harness, BMAD, HiveMind) from descriptions. (4) Add self-correction blocks to 5 coordinator skills. (5) Reorganize Iron Law/HARD GATES sections after onboarding. Use skill-creator, skill-development, skill-judge for quality validation. Follow SKILL-CRITERIA-SHORT.md 6-gate criteria and HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md V.2-V.7 standards.
**Requirements:** TBD
**Depends on:** Phase 23 (complete)
**Playbook:** `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` V.2-V.7
**Standards:** `.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md`

**Scope (5 fix categories across 22 skills):**

| # | Fix Category | Skills Affected | Action |
|---|-------------|-----------------|--------|
| 1 | Remove 6-NON Defence Tables | All hm-* skills with 6-NON sections | Strip NON-1..NON-6 tables — process guidance not skill content |
| 2 | Add onboarding headings | All 22 hm-* skills | Add WHAT/WHEN heading explaining skill purpose and use cases |
| 3 | Remove banned vocabulary | All 22 hm-* skill descriptions | Remove: GSD, harness, BMAD, HiveMind from YAML description |
| 4 | Add self-correction blocks | 5 coordinator skills | hm-coordinating-loop, hm-phase-loop, hm-phase-execution, hm-completion-looping, hm-user-intent-interactive-loop |
| 5 | Reorganize sections | All skills with Iron Law/HARD GATES | Move Iron Law/HARD GATES after onboarding section |

**Hard constraints:** Zero `src/` changes; zero IDE-directory modifications; all changes are SKILL.md body edits only

**Plans:** 3 plans

Plans:
- [x] 24-01-PLAN.md — Remove 6-NON Defence Tables from 18 skills + reorganize Iron Law/HARD GATES in 16 skills (Wave 1) ✅
- [x] 24-02-PLAN.md — Add onboarding headings to 25 skills + remove banned vocabulary from 4 descriptions (Wave 2) ✅
- [x] 24-03-PLAN.md — Add Self-Correction blocks to 5 coordinator skills (Wave 3) ✅

## Progress Table

| Phase | Items Complete | Status |
|-------|---------------|--------|
| 1. Baseline Cleanup | 7/10 | Plan created (1 plan, Wave 1) |
| 2. V3 Runtime Architecture | 9/9 plans, 18/18 truths | Verified after Phase 08 corrective closure |
| 3. Schema Definition | — | SUPERSEDED by Phase 16.5 (Zod schema-kernel, 772 tests) |
| 4. Migration Gate | — | SUPERSEDED by Phase 16.4 + Q6 decision |
| 5. Integration Verification | — | SUPERSEDED by Phases 14-16 (870+ tests, typecheck green) |
| 6. Runtime Domain Separation | — | SUPERSEDED by Phase 11 |
| 7. Runtime Domain Restructuring | — | SUPERSEDED by Phase 11 |
| 8. Repair Durable Parent Observability | 3/3 plans | ✅ COMPLETE — corrective closure, 2026-04-10 |
| 9. Sticky Delegation Corrective | 3/3 plans | ⚠️ MOCK-VERIFIED ONLY — forensic reset 2026-04-14 |
| 9.1 Critical Bug Fixes + Tests | 3/3 plans | ⚠️ COMPLETE WITH CAVEATS — mock-heavy, live verification pending |
| 9.2 Completion Detection Architecture | 1/3 authoritative (+2 historical/quarantined) | ⚠️ MIXED — Plan 01 authoritative; Plans 02-03 ran historically but are not current proof |
| 9.3 Module Restructuring + Config | — | SUPERSEDED by Phase 14 (all 11 decisions obsoleted) |
| 12. Correct start semantics + reconciliation | 2/2 plans | ✅ COMPLETE — false-start corridor fixed, planning truth reconciled |
| 13. Async Result Harvesting (rescoped) | 0 plans | RESCOPED — extract child session results, populate delegation.result |
| 14. delegate-task truth-reset | 3/3 plans | ✅ COMPLETE — WaiterModel + dual-signal + hybrid persistence |
| 15. Security & Quality Remediation | 3/3 plans | ✅ COMPLETE — 26 audit issues fixed |
| 16. Background Delegation Revamp | 5/6 plans | GAP CLOSURE ACTIVE — Plan 06 remaining |
| 16.3 Delegation Subsystem Hardening | 3/3 plans | ✅ COMPLETE — recovery, notification, and terminal truth hardened |
| 16.4 Harness Architecture Baseline | 4/4 plans | ✅ COMPLETE — architecture baseline established (summaries deferred to backlog 999.1) |
| 16.5. Agents Builder Configuration Foundation | 8/8 plans (5 original + 3 gap closure) | ✅ COMPLETE — 772 tests pass, BLOCKER-1 and BLOCKER-3 closed |
| 16.2 PTY Wiring + OMO Safety | 1/1 plans | REMEDIATED — CR-01 and CR-03 resolved, WR-02 and WR-03 addressed |
| 17. Hivemind Skills Refactor — Critical Fixes | 5/5 plans | ✅ COMPLETE — C1-C5 resolved, tech-stack synthesis integrated |
| 18. Context & Research | 4/4 plans | ✅ COMPLETE — 8/8 deliverables, user sign-off received |
| 19. Rename Sprint (Playbook Phase 1) | 21/21 skills | ✅ COMPLETE — 368 files changed, all call-sites updated |
| 20. Structural Changes (Playbook Phase 2) | 1 merge, 1 split, 7 new | ✅ COMPLETE — structural moves landed |
| 21. Description Rewrite (Playbook Phase 3) | 7/7 skills | ✅ COMPLETE — pushy trigger pattern applied |
| 22. Script Hardening + 6-NON (Playbook Phase 4) | 7/7 skills | ✅ COMPLETE — 6-NON defence tables added to 7 core skills (per Phase 24 synthesis) |
| 23. Body Quality + Eval (Playbook Phase 5) | 6/9 skills | ✅ COMPLETE — eval expansion with trigger queries for 6 new skills (per Phase 24 synthesis) |
| 24. Fix 22 Failed hm-* Skills (Playbook Phase 6) | 3/3 plans, 8/8 truths | ✅ COMPLETE — 2026-04-23 |
| 25. Session Journal + Execution Lineage Bridge | 3/3 plans, 15 focused tests | ✅ COMPLETE — Q3/Q6 reconciled, 2026-04-26 |
| 26. Quality Synthesis | 5/5 plans | ✅ COMPLETE — HMQUAL D1-D8 contract, G-B SPECs, archive report, execution roadmap |
| 31. Planning Documentation Refresh | 3/3 plans | ✅ COMPLETE — all 10 refreshed documents verified by health check |
| 27. G-B Quality Assurance Demonstration | 4/4 plans | ✅ COMPLETE — rich-closure-pass, D1-D8 + RICH scoring verified |
| 28. G-C Research Lineage | 1/1 plans | ✅ COMPLETE — rich-closure-pass, 4 target skills RICH-validated |
| 29. G-D Execution Lineage | 1/1 plans | ✅ COMPLETE — rich-closure-pass, 15 skills runtime-truthful validated |
| 30. G-A Guardrail Lineage | 1/1 plans | ✅ COMPLETE — rich-closure-pass, 5 guardrail skills hardened |
| 32. Traceability Reconciliation | 0/2 plans | Pending — audit gap closure |
| 33. Phase 16.4 Closure + Backlog 999.1 | 0/2 plans | Pending — documentation-only |
| 34. Phase 16 Gap 4 — Dual-Mode Execution | 0/3 plans | Pending — PTY execution wiring |
| 35. Event-Tracker Fix + Dead Code Cleanup | 0 plans | P0 — fix typecheck/test failures, remove dead code |
| 36. Lifecycle State Machine Enforcement | 0 plans | P0 — real transition guards, activity tracking, 500 LOC split |
| 37. Async Result Harvesting | 0 plans | P1 — extract child session results into delegation.result |
| 38. Q6 State Root Migration | 0 plans | P1 — verify all writers target .hivemind/ |
| 39. Auto-Loop / Ralph-Loop Engine | 0 plans | P2 — self-referential dev loop until completion |
| 40. CLI Substrate Foundation | 0 plans | P2 — bin/hivemind-tools.cjs central router |
| 41. Session Journal Time-Machine | 0 plans | P2 — query API, event replay, past-state reconstruction |
| 42. Sidecar Foundation | 0 plans | P3 — Next.js 15 dashboard reading .hivemind/ and .planning/ |
| 43. Hook Composition Observability Integrity | 0 plans | Critical — CR-01 hook composition |
| 44. Tool Write-Surface & Secret Hardening | 0 plans | Critical/Security — CR-03, HIGH-05, MED-01, secret hardening |
| 45. OpenCode SDK Permission Boundary | 0 plans | Critical — CR-02, HIGH-01 |
| 46. Delegation Dispatch, Completion & Recovery Truth | 0 plans | High — HIGH-02, HIGH-03, HIGH-04 |
| 47. Runtime Policy & Command Buffer Hardening | 0 plans | Medium — MED-02, MED-03 |
| 48. Real OpenCode Runtime Integration Verification | 0 plans | Integration — live OpenCode proof for remediation wave |
| 49. UAT Tool Contract & PTY Command Reliability | 0 plans | Pending — ses_22ee tool contract defects and PTY command usability |
| 50. OpenCode Primitive Restart Readiness | 0 plans | Pending — validate-restart primitive load/runtime issues |
| 51. Stack Research & Synthesis Skill Runtime Grounding | 0 plans | Pending — stack-feature/deep-research/synthesis workflows |
| 52. End-User Harness Workflow Acceptance | 0 plans | Pending — production E2E user workflows |
| 11. Lifecycle State Machine + 500 LOC (rescoped) | 0 plans | RESCOPED — state machine guards, delegation-manager split |

## Dependencies

```
Phase 1 (7 done, 3 pending — planned)
  └─→ Phase 2: V3 Runtime baseline
       └─→ Phase 8: Corrective closure for delegated-session durability ✅
            └─→ Phase 2: Authoritative re-verification (18/18) ✅
                 └─→ Phase 9 family: partial implementation + forensic reset
                      └─→ Phase 12: truthful start-semantics repair + reconciliation ✅
                           └─→ Phase 14: delegate-task truth-reset ✅
                                └─→ Phase 15: Security & Quality Remediation ✅
                                     └─→ Phase 16: Background Delegation Revamp + PTY Integration
                                           └─→ Phase 16.2: PTY Wiring + OMO Safety Patterns (SPEC validated)
                                           └─→ Phase 16.4: Harness Architecture Baseline ✅ COMPLETE
                                                 └─→ Phase 16.5: Agents Builder Configuration Foundation ✅ COMPLETE (8/8 plans, 772 tests)
                                           └─→ Phase 17: Hivemind Skills Refactor — Critical Fixes (Playbook Phase 0) ✅
                                                 └─→ Phase 18: Context & Research (Playbook Phase CR) ✅
                                                      └─→ Phase 19: Rename Sprint (Playbook Phase 1) ✅
                                                           └─→ Phase 20: Structural Changes (Playbook Phase 2) ✅
                                                                └─→ Phase 21: Description Rewrite (Playbook Phase 3) ✅
                                                                     └─→ Phase 22: Script Hardening + 6-NON (Playbook Phase 4) ✅
                                                                           └─→ Phase 23: Body Quality + Eval (Playbook Phase 5) ✅
                                                                                └─→ Phase 24: Fix 22 Failed hm-* Skills (Playbook Phase 6) ✅
                                                                                     └─→ Phase 26: Quality Synthesis ✅
                                                                                          └─→ Phase 27: G-B Quality Assurance Demonstration ✅
                                                                                               └─→ Phase 28: G-C Research Lineage ✅
                                                                                                    └─→ Phase 29: G-D Execution Lineage ✅
                                                                                                          └─→ Phase 30: G-A Guardrail Lineage ✅
                                                                                                               └─→ Phase 32: Traceability Reconciliation (audit gap closure)
                                                                                                               └─→ Phase 33: Phase 16.4 Closure + Backlog 999.1
                                                                                                                    └─→ Phase 34: Phase 16 Gap 4 — Dual-Mode Execution Wiring
                                                                                                                         └─→ Phase 35: Event-Tracker Fix + Dead Code Cleanup (P0, immediate)
                                                                                                                              └─→ Phase 36: Lifecycle State Machine Enforcement (P0)
                                                                                                                                   └─→ Phase 37: Async Result Harvesting (P1)
                                                                                                                               └─→ Phase 38: Q6 State Root Migration (P1)
                                                                                                                                    └─→ Phase 42: Sidecar Foundation (P3)
                                                                                                                               └─→ Phase 43: Hook Composition Observability Integrity (Critical)
                                                                                                                                    └─→ Phase 44: Tool Write-Surface & Secret Hardening (Critical/Security)
                                                                                                                                         └─→ Phase 45: OpenCode SDK Permission Boundary (Critical)
                                                                                                                                              └─→ Phase 46: Delegation Dispatch, Completion & Recovery Truth (High)
                                                                                                                                    └─→ Phase 47: Runtime Policy & Command Buffer Hardening (Medium)
                                                                                                                                                         └─→ Phase 48: Real OpenCode Runtime Integration Verification (Live proof)
                                                                                                                                                              └─→ Phase 48.1-48.5: Production-hardening remediation sequence
                                                                                                                                                                   └─→ Phase 49: UAT Tool Contract & PTY Command Reliability
                                                                                                                                                                        └─→ Phase 50: OpenCode Primitive Restart Readiness
                                                                                                                                                                             └─→ Phase 51: Stack Research & Synthesis Skill Runtime Grounding
                                                                                                                                                                                  └─→ Phase 52: End-User Harness Workflow Acceptance
                                                                                                                               └─→ Phase 39: Auto-Loop / Ralph-Loop Engine (P2)
                                                                                                                              └─→ Phase 40: CLI Substrate Foundation (P2)
                                                                                                                                   └─→ Phase 41: Session Journal Time-Machine (P2)
                                                                                                                                        └─→ Phase 42: Sidecar Foundation (P3)
                                   └─→ Phase 9.3: Module Restructuring + Config — SUPERSEDED by Phase 14
                                        └─→ Phase 11: Lifecycle State Machine + 500 LOC (RESCOPED — depends on Phase 35)
                                              └─→ Phase 3: Schema Definition — SUPERSEDED by Phase 16.5
                                                   └─→ Phase 4: Migration Gate — SUPERSEDED by Phase 16.4 + Q6
                                                        └─→ Phase 5: Integration Verification — SUPERSEDED by Phases 14-16
```

## Backlog

### Phase 999.1: Follow-up — Phase 16.4 incomplete verify-work (ABSORBED BY PHASE 33)

**Goal:** Resolve verify-work and create SUMMARY.md files for Phase 16.4 plans that executed without producing summaries
**Source phase:** 16.4
**Deferred at:** 2026-04-25 during /gsd-next advancement to Phase 16.5
**Absorbed by:** Phase 33 (2026-04-26 milestone gap closure)
**Status:** ABSORBED — Phase 33 will create all 4 missing summaries plus 16.4-VERIFICATION.md

## Phase 32: Traceability Reconciliation

**Goal:** Close audit traceability gaps (GAP-TRACE-01/02/03) and create missing VERIFICATION.md artifacts for 14 COMPLETE phases
**Source:** v2.0-MILESTONE-AUDIT.md gaps found 2026-04-26
**Requirements:** GAP-TRACE-01, GAP-TRACE-02, GAP-TRACE-03, GAP-VERIFY-01
**Gap Closure:** Closes traceability discrepancies from audit

### Tasks

1. Update REQUIREMENTS.md: Change 7 v1 cleanup items from `[ ]` → `[x]` (HIGH-01, HIGH-02, MED-01, MED-02, LOW-02, DEAD-01, TEST-01)
2. Update REQUIREMENTS.md: Change DOC-REFRESH-05 through DOC-REFRESH-10 from Pending → Complete
3. Update REQUIREMENTS.md: Change HMQUAL-01 through HMQUAL-08 from Defined → Complete
4. Create retroactive VERIFICATION.md for Phase 01 (Baseline Cleanup — 7/10 verified)
5. Create retroactive VERIFICATION.md for Phase 08 (Repair Durable Parent Observability)
6. Create retroactive VERIFICATION.md for Phases 19-23 (Playbook Phases 1-5)
7. Create retroactive VERIFICATION.md for Phase 26 (Quality Synthesis)
8. Create retroactive VERIFICATION.md for Phase 31 (Planning Documentation Refresh)
9. Fix STATE.md line 115 stale entry (Phase 27-30 PLANNED → COMPLETE)

**Plans:** 2 plans (documentation-only, no code changes)

## Phase 33: Phase 16.4 Closure + Backlog 999.1

**Goal:** Close Phase 16.4 documentation void — create 4 missing SUMMARY.md files, phase-level VERIFICATION.md, and close validation approval
**Source:** v2.0-MILESTONE-AUDIT.md GAP-16.4-1, GAP-16.4-2; ROADMAP backlog 999.1
**Requirements:** GAP-16.4-1, GAP-16.4-2, GAP-16.4-3, GAP-16.4-4
**Gap Closure:** Absorbs backlog 999.1, completes Phase 16.4 artifact chain

### Tasks

1. Create 16.4-01-SUMMARY.md (retroactive — read plan + produced artifacts)
2. Create 16.4-02-SUMMARY.md (retroactive — read plan + produced artifacts)
3. Create 16.4-03-SUMMARY.md (retroactive — read plan + produced artifacts)
4. Create 16.4-04-SUMMARY.md (retroactive — read plan + produced artifacts)
5. Create 16.4-VERIFICATION.md (phase-level — aggregate validation results)
6. Update 16.4-VALIDATION.md line 88 Approval: pending → passed (2026-04-26)
7. Mark backlog 999.1 items complete in ROADMAP.md

**Plans:** 2 plans (documentation-only, no code changes)

## Phase 34: Phase 16 Gap 4 — Dual-Mode Execution Wiring

**Goal:** Close Phase 16 Gap 4 — wire PTY execution to delegation path, implement dispatchCommand(), create run-background-command tool
**Source:** v2.0-MILESTONE-AUDIT.md GAP-16-06-1 through GAP-16-06-4; 16-VERIFICATION.md Truth #4 FAILED
**Requirements:** D-04A, D-05, D-12, D-13, D-16, D-17 (6 remaining from Plan 06)
**Gap Closure:** Closes Phase 16 from 5/6 → 6/6 plans
**Depends on:** Phase 33 (Phase 16.4 architecture baseline verified)

### Tasks

1. Implement `dispatchCommand()` on DelegationManager for PTY-backed command execution under canonical queue governance
2. Create `src/tools/run-background-command.ts` with run/output/input/list/terminate actions sharing canonical PtyManager
3. Wire PTY execution path to actual delegated child-session work (replace metadata-only PTY)
4. Implement truthful `executionMode: "sdk" | "pty" | "headless"` across dispatch, persistence, and status surfaces
5. Implement PTY-unavailable fallback: `executionMode: "headless"` with `fallbackReason`
6. Write tests for dual-mode dispatch, PTY command delegation, fallback behavior
7. Re-verify Phase 16: Truth #4 must pass

**Plans:** 3 plans (code changes, tests, verification)

## Phase 35: Event-Tracker Fix + Dead Code Cleanup

**Goal:** Fix all build/test failures (6 typecheck errors, 5 test failures) and remove dead code. This unblocks all subsequent phases.
**Depends on:** None (immediate priority)
**Plans:** 5 plans
**Status:** PARTIAL — typecheck/test/build gates pass; `notification-handler.ts` retained per local AGENTS.md; TD-11 cast remains.

### Scope
- Fix 6 unused import errors in `src/lib/event-tracker/writer.ts`
- Fix 5 test failures in `tests/lib/event-tracker/session-journey-events.test.ts` (broken assertions + missing `cleanupEventTrackerArtifacts` export)
- Delete `src/lib/notification-handler.ts` (298 LOC — DEPRECATED dead code, WaiterModel polling replaces it)
- Delete `src/hooks/messages-transform.ts` (92 LOC — dead code, not wired into plugin.ts)
- Delete `tests/plugins/prompt-enhance-compaction.test.ts` (skipped test, masks double-count bug)
- Satisfies: DEAD-03, LOW-03, LOW-04, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05

## Phase 36: Lifecycle State Machine Enforcement

**Goal:** Replace stub implementations in lifecycle-manager.ts with real state machine enforcement and activity tracking. Split delegation-manager.ts under 500 LOC.
**Depends on:** Phase 35
**Plans:** 3/3 plans complete
**Status:** COMPLETE — see `.planning/phases/43-hook-composition-observability-integrity/43-SUMMARY-2026-04-27.md`.

### Scope
- Define `SessionLifecyclePhase` transition table in `types.ts`
- Replace `isValidTransition()` stub with proper transition guards
- Implement `noteObservedActivity()` for idle detection integration
- Extract PTY-specific delegation logic from `delegation-manager.ts` (510 LOC → ~450 LOC)
- Add state machine tests
- Satisfies: TD-07, TD-09, lifecycle architecture requirement

## Phase 37: Async Result Harvesting

**Goal:** Implement result extraction from child sessions when completion is detected.
**Depends on:** Phase 36
**Plans:** 0 plans
**Status:** COMPLETE — see `.planning/phases/44-tool-write-surface-secret-hardening/44-SUMMARY-2026-04-27.md`.

### Scope
- In `sdk-delegation.ts`: when stability detection confirms completion, harvest last assistant message
- Populate `delegation.result` field in DelegationManager
- Update `delegation-status` tool to return harvested results
- Add `tests/lib/delegation-persistence.test.ts` for direct persistence unit tests
- Satisfies: PH13-01 through PH13-11 (partial — result capture subset)

## Phase 38: Q6 State Root Migration

**Goal:** Verify all state writers target `.hivemind/` exclusively and implement one-way migration from legacy paths.
**Depends on:** Phase 35
**Plans:** 0 plans
**Status:** COMPLETE — see `.planning/phases/45-opencode-sdk-permission-boundary/45-SUMMARY-2026-04-27.md`.

### Scope
- Verify `continuity.ts` storage path targets `.hivemind/`
- Verify `delegation-persistence.ts` storage path targets `.hivemind/`
- Remove any legacy `.opencode/state/opencode-harness/` compatibility bridge
- Add `.hivemind/` gitignore rules for runtime state
- Write migration verification tests
- Satisfies: HIVEMIND-ROOT-01, HIVEMIND-ROOT-02, HIVEMIND-ROOT-03

## Phase 39: Auto-Loop / Ralph-Loop Engine

**Goal:** Implement self-referential dev loop — dispatch → validate → retry-with-context → repeat until completion signal or max iterations.
**Depends on:** Phase 36
**Plans:** 0 plans
**Status:** COMPLETE — see `.planning/phases/46-delegation-dispatch-completion-recovery-truth/46-SUMMARY-2026-04-27.md`.
**Priority:** P2 (post-v2.0-core)

### Scope
- New `src/lib/auto-loop.ts` with loop orchestration
- `<promise>DONE</promise>` completion signal detection
- Max iterations enforcement with graceful degradation
- Context preservation across loop iterations
- Integration with `delegation-manager.ts` and `completion-detector.ts`

## Phase 40: CLI Substrate Foundation

**Goal:** Build `bin/hivemind-tools.cjs` central router with eval, scaffold, skill, and state commands.
**Depends on:** None
**Plans:** 0 plans
**Status:** COMPLETE — see `.planning/phases/47-runtime-policy-command-buffer-hardening/47-SUMMARY-2026-04-27.md`.
**Priority:** P2 (post-v2.0-core)

### Scope
- New `bin/hivemind-tools.cjs` entry point
- `bin/lib/` directory: core.cjs, state.cjs, skill.cjs, eval.cjs, scaffold.cjs, config.cjs
- Replace scattered bash scripts with unified CLI
- Target: ~500 LOC total for CLI substrate

## Phase 41: Session Journal Time-Machine (Q3 Completion)

**Goal:** Build query API for journal — by session, by event type, by time range; event replay for past-state reconstruction.
**Depends on:** Phase 25 (already complete)
**Plans:** 0 plans
**Status:** DEGRADED — live health/session/tool ID checks pass; REM-RUNTIME-04/05 gaps documented in `.planning/phases/48-real-opencode-runtime-integration-verification/48-VERIFICATION-2026-04-27.md`.
**Priority:** P2 (post-v2.0-core)

### Scope
- Query API module for session journal
- Event replay for past-state reconstruction
- Investigation agent support
- Time-range and event-type filtering

## Phase 42: Sidecar Foundation (Q2)

**Goal:** Next.js 15 + @json-render/react dashboard that reads `.hivemind/` and `.planning/` artifacts.
**Depends on:** Phase 41, Phase 38
**Plans:** 0 plans
**Priority:** P3 (post-v2.0)

### Scope
- New `apps/sidecar/` directory with Next.js 15 app
- REST API routes reading `.hivemind/` artifacts
- Dashboard tabs for delegations, journals, memory, planning
- READ-ONLY enforcement (SIDECAR-03 test)
- OpenCode SDK REST API integration (post-MVP)

## Phase 43: Hook Composition Observability Integrity

**Goal:** Tool-guard after-hook behavior and plugin-level event tracking both run in real OpenCode runtime, preserving lifecycle activity and `_harness` metadata.
**Source:** `.planning/audits/harness-lifecycle-code-review-2026-04-26.md` CR-01; `.planning/codebase/harness-lifecycle-map-2026-04-26.md` Top Risk Signal 1.
**Requirements:** REM-CR-01
**Depends on:** Phase 35
**Severity coverage:** Critical — CR-01
**Plans:** 0 plans

### Scope
- Compose both `tool.execute.after` branches explicitly.
- Preserve event-tracker/configure-primitive after-hook behavior.
- Add regression evidence that `_harness` metadata and lifecycle activity survive the composed path.

### Success Criteria
1. Tool execution after-hooks preserve both metadata injection and event-tracker persistence.
2. Lifecycle activity is observed after tool execution.
3. Regression tests fail if either branch is skipped.

### Validation
- `npm run typecheck`
- Focused hook/plugin test for composed `tool.execute.after`
- `npm test`

## Phase 44: Tool Write-Surface & Secret Hardening

**Goal:** Write-capable harness tools cannot write/read outside approved roots, write success is only reported after completion, and MCP descriptors do not contain literal secrets.
**Source:** Audit CR-03, HIGH-05, MED-01; lifecycle map Top Risk Signal 2.
**Requirements:** REM-CR-03, REM-HIGH-05, REM-MED-01, REM-SEC-01
**Depends on:** Phase 43
**Severity coverage:** Critical — CR-03; High — HIGH-05; Medium — MED-01; Security — inline MCP secret risk
**Plans:** 0 plans

### Scope
- Restrict `session-patch` to approved project/worktree session artifact paths.
- Reject primitive names with path traversal or non-slug characters before read/inspect/write path resolution.
- Await and catch `configure-primitive` writes before returning success.
- Replace literal MCP secrets with environment placeholders and add guard evidence.

### Success Criteria
1. Arbitrary absolute session patch paths are rejected.
2. Primitive read/inspect traversal inputs are rejected.
3. Configure-primitive write failures return failure, not success.
4. MCP descriptors use secret placeholders only.

### Validation
- `npm run typecheck`
- Focused `session-patch` and `configure-primitive` security tests
- Static secret inspection/scan evidence for `mcp.json`
- `npm test`

## Phase 45: OpenCode SDK Permission Boundary

**Goal:** Delegated child-session permissions and selected-agent capabilities use OpenCode-supported runtime surfaces instead of unsupported `session.create` fields.
**Source:** Audit CR-02, HIGH-01; OpenCode interface research SDK contract section.
**Requirements:** REM-CR-02, REM-HIGH-01
**Depends on:** Phase 44
**Severity coverage:** Critical — CR-02; High — HIGH-01
**Plans:** 0 plans

### Scope
- Remove unsupported `permission` body field from child `session.create` calls.
- Resolve selected agent primitive policy at runtime.
- Apply harness denial overlays only for recursion/capability gates.
- Add installed-SDK request-shape contract tests.

### Success Criteria
1. Child session creation matches installed SDK request types.
2. Selected-agent policy is derived from the agent primitive or an explicit documented fallback.
3. Recursive delegation remains denied without globally overriding user-configured permissions.

### Validation
- `npm run typecheck`
- SDK request-shape contract test
- Focused spawner/delegation tests proving no unsupported session-create permission payload
- Live proof deferred to Phase 48

## Phase 46: Delegation Dispatch, Completion & Recovery Truth

**Goal:** Delegation status reflects prompt acceptance, explicit completion, and restart uncertainty honestly.
**Source:** Audit HIGH-02, HIGH-03, HIGH-04.
**Requirements:** REM-HIGH-02, REM-HIGH-03, REM-HIGH-04
**Depends on:** Phase 45
**Severity coverage:** High — HIGH-02, HIGH-03, HIGH-04
**Plans:** 0 plans

### Scope
- Await prompt acceptance or introduce a truthful created-not-yet-prompted state.
- Replace stability-only completion with explicit completion/terminal evidence or `unknown/stalled/needs-review` states.
- Persist `unverified-after-restart` and retry with backoff before recovery terminalizes a delegation.

### Success Criteria
1. Prompt-not-yet-accepted and dispatched are distinguishable.
2. Silent/dead child sessions are not marked complete from stable message counts alone.
3. Restart recovery does not convert transient missing status into immediate terminal error.

### Validation
- `npm run typecheck`
- Focused `delegation-manager`, `sdk-delegation`, and `delegation-status` tests
- Recovery tests for transient missing status
- Live proof deferred to Phase 48

## Phase 47: Runtime Policy & Command Buffer Hardening

**Goal:** Runtime policy can be provided from workspace/plugin configuration, and headless command output is bounded.
**Source:** Audit MED-02, MED-03.
**Requirements:** REM-MED-02, REM-MED-03
**Depends on:** Phase 46
**Severity coverage:** Medium — MED-02, MED-03
**Plans:** 0 plans

### Scope
- Accept and validate plugin options or project-local runtime policy.
- Pass parsed policy into `loadRuntimePolicy(workspacePolicy)`.
- Cap headless command output and expose truncation metadata.

### Success Criteria
1. Workspace policy overrides affect runtime behavior through validated input.
2. Invalid policy is rejected with actionable errors.
3. Noisy headless command output is capped with visible truncation metadata.

### Validation
- `npm run typecheck`
- Runtime-policy tests for defaults, overrides, invalid input
- Command-delegation output cap tests
- `npm test`

## Phase 48: Real OpenCode Runtime Integration Verification

**Goal:** Prove the remediated harness loads and behaves correctly in a live OpenCode runtime, not just mocks.
**Source:** `.planning/research/opencode-interface-research-2026-04-26.md` recommended runtime checks and unresolved uncertainties.
**Requirements:** REM-RUNTIME-01 through REM-RUNTIME-05
**Depends on:** Phases 43, 44, 45, 46, 47
**Severity coverage:** Integration proof for all Critical, High, and Medium remediation findings.
**Plans:** 0 plans

### Scope
- Verify package/static contract checks.
- Start disposable `opencode serve` with auth and fetch health/OpenAPI/session status.
- Load compiled harness plugin in a disposable fixture project.
- Verify harness tool registration through SDK/server tool IDs.
- Probe hook payloads and exercise delegate-task/delegation-status end-to-end.

### Success Criteria
1. Compiled plugin loads in a disposable OpenCode project.
2. Harness tool IDs are visible through OpenCode SDK/server listing.
3. Hook payloads match the source assumptions or documented adapters.
4. Real parent/child delegation can be created, prompted, observed, and polled without false lifecycle states.

### Validation
- `npm view @opencode-ai/sdk version time.modified dist-tags --json`
- `npm view @opencode-ai/plugin version time.modified dist-tags exports --json`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Disposable `opencode serve` fixture checks: health, `/doc`, tool IDs, event subscription, delegation status polling

## Phase 48.1: Runtime Correctness: Lifecycle, Queue, Persistence Truth

**Goal:** Restore truthful runtime behavior for lifecycle transitions, queue-key accounting, and durable delegation persistence before any security or SDK remediations depend on those signals.
**Depends on:** Phase 48 degraded verification evidence
**Plans:** 5 plans
**Priority:** P0 production-hardening remediation

### Scope
- Reconcile lifecycle status transitions with actual OpenCode session and tool-execution events.
- Verify queue acquisition/release truth, queue-key consistency, and failure recovery semantics.
- Ensure persisted delegation records cannot overstate started, completed, failed, or recovered states.

### Success Criteria
1. Lifecycle, queue, and persistence state transitions are backed by runtime evidence rather than inferred optimistic state.
2. Restart/recovery paths preserve uncertainty instead of converting missing evidence into false terminal truth.
3. Regression evidence covers queue drift, stale persisted records, and lifecycle edge cases.

Plans:
- [ ] 48.1-01-PLAN.md — Correct completion event routing and lifecycle/task transition compatibility
- [ ] 48.1-02-PLAN.md — Route delegation state through guarded transitions and terminal cleanup
- [ ] 48.1-03-PLAN.md — Make persisted delegation status truthful after memory cleanup and corruption
- [ ] 48.1-04-PLAN.md — Fix queue timeout cleanup and continuity persistence failure modes
- [ ] 48.1-05-PLAN.md — Run review, Nyquist validation, and ordered lifecycle/spec/evidence gates

## Phase 48.2: Security Boundary Hardening: Secrets, Scope, Category Gates

**Goal:** Harden runtime security boundaries after correctness signals are trustworthy, with focus on secret redaction, workspace scope controls, and category gate enforcement.
**Depends on:** Phase 48.1
**Plans:** 0 plans
**Priority:** P0 production-hardening remediation

### Scope
- Verify secret-bearing inputs/outputs are redacted in persisted state, journals, and tool responses.
- Recheck read/write scope boundaries across harness tools, generated artifacts, and runtime state roots.
- Enforce category and recursion gates using explicit runtime policy instead of broad fallbacks.

### Success Criteria
1. No secret material is persisted or surfaced through planning/runtime artifacts outside explicit placeholders.
2. Tool scope enforcement blocks path traversal and cross-root writes while preserving valid project-local workflows.
3. Category gates deny unsafe delegation/tool combinations with auditable reasons.

## Phase 48.3: OpenCode SDK/CQRS Integration Alignment

**Goal:** Align harness integration with supported OpenCode SDK and plugin CQRS surfaces so write-side tools and read-side hooks remain separated and version-compatible.
**Depends on:** Phase 48.2
**Plans:** 5 plans
**Priority:** P0 production-hardening remediation

### Scope
- Revalidate installed OpenCode SDK/plugin request and event contracts against harness adapters.
- Keep plugin assembly thin while routing mutation through tools and observation through hooks.
- Remove or document any unsupported SDK assumptions found during Phase 48 runtime probing.

### Success Criteria
1. SDK calls match installed package contracts and have regression evidence for request shape drift.
2. CQRS boundaries are explicit: tools mutate, hooks observe, shared modules stay leaf-safe.
3. Plugin composition has no hidden business logic or unsupported permission/session payload assumptions.

Plans:
- [x] 48.3-01-PLAN.md — SDK wrapper completion and request-shape tests
- [x] 48.3-02-PLAN.md — Runtime policy dispatch wiring
- [x] 48.3-03-PLAN.md — Hook CQRS boundary extraction
- [x] 48.3-04-PLAN.md — Plugin thinness extraction
- [x] 48.3-05-PLAN.md — PTY fallback reachability correction

## Phase 48.4: Production Evidence & Coverage Recovery

**Goal:** Recover production-grade verification evidence and coverage for the remediated runtime path, replacing degraded/mock-heavy proof with reproducible live checks.
**Depends on:** Phase 48.3
**Plans:** 5 plans in 4 waves
**Priority:** P0 production-hardening remediation

### Wave Structure

| Wave | Plans | Description |
|------|-------|-------------|
| 1 | 01 | Coverage infrastructure: install @vitest/coverage-v8, configure thresholds |
| 2 | 02, 03 | New behavioral tests: 8 untested modules (1,601 LOC) |
| 3 | 04 | Mock-heavy test upgrades: stateful fake client, contract-based verification |
| 4 | 05 | Gap classification + coverage gate |

### Plan List
- [ ] 48.4-01 — Coverage Infrastructure (install @vitest/coverage-v8, configure thresholds at 70/60/70/70)
- [ ] 48.4-02 — Low-Risk Behavioral Tests (runtime.ts, workspace-runtime-policy.ts, agent-primitive-policy.ts, notification-handler.ts)
- [ ] 48.4-03 — Hook & Writer Behavioral Tests (create-core-hooks.ts, create-tool-guard-hooks.ts, create-session-hooks.ts, event-tracker/writer.ts)
- [ ] 48.4-04 — Mock-Heavy Test Upgrades (delegation-manager, delegate-task, delegation-status, plugin-lifecycle)
- [ ] 48.4-05 — Gap Classification + Coverage Gate (document deferred gaps, run quality gate)

### Scope
- Add dedicated behavioral tests for 8 previously untested modules (1,601 LOC)
- Upgrade 4 mock-heavy test files with stateful fake client patterns and contract-based verification
- Classify REM-RUNTIME-04 and REM-RUNTIME-05 as external-environment limitations with manual verification procedures
- Enforce coverage thresholds at 70% statements, 60% branches, 70% functions, 70% lines

### Success Criteria
1. Live runtime evidence proves tool registration, hook execution, and delegated child completion without false lifecycle states.
2. Coverage reflects meaningful behavior checks rather than mock-only existence assertions.
3. Remaining gaps are explicitly classified as blocker, deferred, or external-environment limitations.

## Phase 48.5: Architecture LOC Cleanup: Event Tracker Writer Split

**Goal:** Split event-tracker writer responsibilities into maintainable modules after production behavior is proven, reducing LOC pressure without changing verified behavior.
**Depends on:** Phase 48.4
**Plans:** 0 plans
**Priority:** P1 production-hardening cleanup

### Scope
- Split event-tracker writer responsibilities along parse/normalize/write/error-reporting boundaries.
- Preserve script-rule behavior: helpers report facts and leave judgment to agents.
- Keep module dependencies leaf-safe and below project LOC limits.

### Success Criteria
1. Event-tracker writer modules stay below the 500 LOC limit with clear responsibility boundaries.
2. Existing event-tracker evidence and lineage outputs remain byte/shape compatible or are migration-documented.
3. Typecheck, tests, and focused event-tracker regression evidence pass after the split.

Plans:
- [x] 48.5-01-PLAN.md — Hook event split
- [x] 48.5-02-PLAN.md — Document store and Markdown renderer split
- [x] 48.5-03-PLAN.md — Artifact writer split and full gates

**Execution status:** COMPLETE. See `48.5-VALIDATION-2026-04-28.md`; REM-RUNTIME-04/05 remain explicitly deferred because Phase 48.5 was LOC cleanup, not live-provider proof.

## Phase 49: UAT Tool Contract & PTY Command Reliability

**Goal:** Harness tools behave predictably for end-user testers, especially command execution, prompt analysis, prompt skimming, and journal export contracts surfaced in `ses_22ee`.
**Source:** `session-ses_22ee.md` UAT final report; `.hivemind/event-tracker/ses_22ee.md`; `.hivemind/event-tracker/ses_22ee.json`
**Depends on:** Phase 48.5
**Plans:** 3/3 plans complete
**Priority:** P0 downstream production usability

### Scope
- Normalize `run-background-command` launch semantics so valid command/args usage is documented, schema-visible, and does not mislead users with unsupported `start` action expectations.
- Preserve PTY output from process start, including first-line capture and fast-command output visibility.
- Calibrate prompt flooding, vagueness, contradiction, and journal pipeline-key behavior so tool results match end-user expectations.

### Success Criteria
1. User can start, observe, provide input to, and terminate a background command without undocumented action names or lost first output.
2. User receives accurate prompt-skim and prompt-analyze risk signals for vague, bloated, contradictory, and well-structured prompts.
3. User can export journal/lineage data with filters that filter rather than silently overwrite lineage metadata.

Plans:
- [x] 49-01-PLAN.md — Stabilize `run-background-command` action/command contract and PTY first-output reliability
- [x] 49-02-PLAN.md — Calibrate prompt-skim and prompt-analyze UAT risk/clarity fixtures
- [x] 49-03-PLAN.md — Split journal export filter semantics from lineage labeling

**Execution status:** COMPLETE WITH PARTIAL RUNTIME EVIDENCE. Focused tool tests, typecheck, LOC, full tests, and build pass; live external OpenCode/provider runtime proof remains a downstream acceptance concern for Phase 52.

## Phase 50: OpenCode Primitive Restart Readiness

**Goal:** Project-local OpenCode primitives restart cleanly with valid frontmatter, discoverable references, and non-conflicting permission semantics.
**Source:** `session-ses_22ee.md` validate-restart and configure-primitive observations
**Depends on:** Phase 49
**Plans:** TBD
**Priority:** P0 downstream runtime readiness

### Scope
- Resolve restart blockers reported by `validate-restart`: missing agent references, circular command/agent dependencies, and permission inheritance contradictions.
- Normalize invalid agent, command, and skill frontmatter without moving state into `.opencode/`.
- Preserve `.opencode/` as primitives-only and `.hivemind/` as runtime state root while making discovery warnings actionable.

### Success Criteria
1. User can run restart validation and see no missing-reference or circular-dependency blockers for active project primitives.
2. User can list/read primitives without invalid required frontmatter warnings on active agents, commands, or skills.
3. Permission inheritance reports use readable values, not `[object Object]`, and distinguish intentional deny overlays from real conflicts.

Plans:
- [ ] TBD — derive from Phase 50 discussion and restart validation evidence

## Phase 51: Stack Research & Synthesis Skill Runtime Grounding

**Goal:** Stack-feature skills and research/synthesis workflows produce implementation-ready guidance for OpenCode SDK, plugin, custom-tool, and framework work without stale assumptions.
**Source:** User request for OpenCode SDK, plugins, custom tools, stack-feature skills, deep research, and synthesis coverage; `ses_22ee` primitive discovery evidence
**Depends on:** Phase 50
**Plans:** TBD
**Priority:** P1 downstream capability grounding

### Scope
- Ground `stack-opencode`, `stack-bun-pty`, `stack-zod`, `stack-vitest`, `stack-nextjs`, and custom-tool authoring paths against current project/runtime contracts.
- Connect `hm-deep-research`, `hm-research-chain`, and `hm-synthesis` outputs to project-local implementation handoffs that can be verified by harness tools.
- Ensure stack guidance respects CQRS boundaries, primitive/state-root separation, and project-local OpenCode plugin constraints.

### Success Criteria
1. User can request stack guidance for OpenCode SDK/plugin/custom-tool work and receive version-grounded, project-compatible guidance.
2. User can run a research-to-synthesis workflow that produces concise handoff artifacts without reading or writing outside approved project roots.
3. Stack-feature skills correctly route implementation, verification, and gate evidence to the appropriate harness/GSD workflows.

Plans:
- [ ] TBD — derive from Phase 51 discussion and stack-skill runtime evidence

## Phase 52: End-User Harness Workflow Acceptance

**Goal:** Real users can complete production-ready Hivemind/OpenCode harness workflows end-to-end through orchestrator, subagent, tool, journal, and restart surfaces.
**Source:** `ses_22ee` end-user UAT session and downstream production-readiness request
**Depends on:** Phase 51
**Plans:** TBD
**Priority:** P1 production acceptance

### Scope
- Define end-user workflows that combine delegation, PTY command execution, primitive configuration, restart validation, journal export, and status polling.
- Verify orchestrator/subagent role boundaries, recovery handoffs, and evidence capture across interrupted sessions.
- Package acceptance criteria around real-life usable workflows rather than isolated tool success.

### Success Criteria
1. User can complete a full orchestrator-led workflow that delegates to a specialist, executes a background command, captures status, and exports lineage evidence.
2. User can recover after interruption and continue from persisted `.hivemind/` state without false completion or lost context.
3. User-facing acceptance evidence distinguishes pass, partial, failed, and externally-blocked runtime behavior.

Plans:
- [ ] TBD — derive from Phase 52 discussion and end-user acceptance scenarios
