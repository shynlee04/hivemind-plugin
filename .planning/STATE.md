---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
current_plan: Repair pass for Phases 22-23
status: unknown
stopped_at: Completed 24-01-PLAN.md — 6-NON Defence Tables removed from 18 skills, Iron Law repositioned in 16 skills. Ready for 24-02.
last_updated: "2026-04-23T14:50:36Z"
progress:
  total_phases: 24
  completed_phases: 8
  total_plans: 41
  completed_plans: 37
  percent: 90
---

# STATE: Harness Cleanup

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.
**Current focus:** Phase 24 — Fix 22 failed hm-* skills (3 plans, 3 waves, ready to execute)

## Forensic Truth (2026-04-14 Reset)

Previous STATE.md overstated completion. The authoritative reset remains `.planning/debug/phase-09-forensic-false-signals-2026-04-14.md`.

## Current Position

Phase: 21 — COMPLETE (descriptions rewritten for 7 Phase 20 skills)
Phase 19: PARTIAL — 19/21 skills renamed, 2 deferred to Phase 20, stale refs remain, IDE-dir constraint violated
Phase 20: PARTIAL — structural moves landed (1 merge, 1 split, 7 new skills), but acceptance incomplete (missing eval bundles, 6-NON tables)
Phase 21: COMPLETE — 7 differential cluster skills rewritten with pushy trigger pattern per V.7 template
Phase 22: NOT SUBSTANTIATED — no phase directory, commit scope doesn't match claims
Phase 23: PARTIAL — eval files expanded for some skills, but only 1/9 has stacked scenario
Phase 17: COMPLETE — Hivemind Skills Refactor (C1-C5 resolved, tech-stack synthesis integrated)
Phase 18: COMPLETE (approved) — Context & Research (Playbook Phase CR — 8/8 deliverables committed)
Phase 08: COMPLETE — verified corrective closure (2026-04-10)
Phase 14: COMPLETE — all 3 root causes fixed (event routing, fast-completion race, VALID_AGENTS→SDK discovery)
**Current plan:** Repair pass for Phases 22-23
**Progress:** [██████████░░] 89%

```
Phase 1: Baseline Cleanup ......... COMPLETE (10/10 items)
Phase 2: V3 Runtime Architecture .. VERIFIED (9/9 plans, 18/18 verified)
Phase 3: Schema Definition ........ Pending
Phase 4: Migration Gate ........... Pending
Phase 5: Integration Verification . Pending
Phase 6: Runtime Domain Separation  SUPERSEDED by Phase 11
Phase 7: Runtime Domain Restructuring SUPERSEDED by Phase 11
Phase 8: Repair Durable Parent Obs COMPLETE (corrective closure, 2026-04-10)
Phase 9: Sticky Delegation Corrective COMPLETE WITH CAVEATS (mock-verified only)
Phase 9.1: Critical Bug Fixes ..... COMPLETE WITH CAVEATS (test rewrites done, live verification pending)
Phase 9.2: Completion Detection .... PARTIAL — implementation exists, but 09.2-02/03 summaries are quarantined as non-authoritative runtime proof
Phase 9.3: Module Restructuring .... Pending (blocked by 9.2)
Phase 12: Start Semantics + Recon .. COMPLETE (truthful start repair + planning reconciliation)
Phase 17: Hivemind Skills Refactor . COMPLETE (C1-C5 resolved, tech-stack synthesis integrated)
Phase 18: Context & Research ....... COMPLETE (8/8 deliverables, user sign-off received)
Phase 19: Rename Sprint ............ COMPLETE (21/21 skills renamed, 368 files changed, all call-sites updated)
Phase 20: Structural Changes ........ COMPLETE (merge: session-context-manager→hm-planning-with-files; split: harness-delegation-inspection→2 skills; create: 7 differential cluster skills)
Phase 21: Description Rewrite ....... COMPLETE (7 differential cluster skills rewritten per V.7 template)
Phase 22: Script Hardening + 6-NON .. COMPLETE (6-NON defence tables added to 7 core skills)
Phase 23: PARTIAL — eval files expanded for some skills, but only 1/9 has stacked scenario
Phase 24: EXECUTING — Plan 01 complete (6-NON removed, Iron Law repositioned), Plans 02-03 pending
```

## Phase Completion Details

### Genuinely Verified Phases

| Phase | Status | Evidence |
|-------|--------|----------|
| Phase 1 | COMPLETE | 10/10 items, typecheck/tests/build green, commit `42babee6` |
| Phase 2 | VERIFIED | 9/9 plans, 18/18 verification truths, re-verified after Phase 08 |
| Phase 8 | COMPLETE | 3/3 plans, corrective closure, Phase 02 re-verification passed |
| Phase 14 | COMPLETE | 3/3 plans, 4 root causes fixed (event routing, sync race, misleading notifications, VALID_AGENTS→SDK), 351 tests pass, typecheck clean |

### Phases With Caveats

| Phase | Status | Caveat |
|-------|--------|--------|
| Phase 9 | COMPLETE WITH CAVEATS | Code exists but UAT quarantined as "substantially false" — mock-verified only, never runtime-verified |
| Phase 9.1 | COMPLETE WITH CAVEATS | Bug fixes + test rewrites done (668 tests pass), but mock-heavy — never spawn real child sessions |
| Phase 12 | COMPLETE | False-start corridor fixed and 09-family planning truth reconciled |

### Phases Requiring Repair (Audit 2026-04-23)

| Phase | Status | Issue |
|-------|--------|-------|
| Phase 19 | PARTIAL | 19/21 renamed (2 deferred), stale refs remain, IDE-dir constraint violated (.windsurf/ touched) |
| Phase 20 | PARTIAL | Structural moves landed, but some new skills missing evals/6-NON tables |
| Phase 21 | COMPLETE | Descriptions rewritten for 7 Phase 20 skills with pushy trigger pattern |
| Phase 22 | NOT SUBSTANTIATED | No phase directory, commit scope doesn't match claims |
| Phase 23 | PARTIAL | Eval files expanded, but only 1/9 skills has stacked scenario |

### In-Progress Phases

| Phase | Status | Detail |
|-------|--------|--------|
| Phase 9.2 | PARTIAL | Implementation artifacts exist, but 09.2-02/03 completion summaries were quarantined after Phase 12 proved start semantics were still incomplete |
| Phase 16 | EXECUTING | 5/6 plans complete; queue-key truth and real message-stability completion landed with full test/typecheck/build verification, leaving Plan 06 as the remaining gap-closure step |
| Phase 16.2 | REMEDIATED | CR-01 and CR-03 resolved (26 new tests, gracePeriodExpiresAt fixed). WR-02 and WR-03 pending. 19 live-runtime tests remain. |
| Phase 19 | PARTIAL | Repair needed: stale refs, missing phase directory |
| Phase 20 | PARTIAL | Repair needed: acceptance criteria not met for new skills |
| Phase 22-23 | NOT SUBSTANTIATED | Need proper phase directories, planning, and execution |
| Phase 24 | EXECUTING | Plan 01 complete (6-NON removed from 18 skills, Iron Law repositioned in 16), Plans 02-03 pending |

## Known Issues

1. **Phase 09 UAT quarantined** — `.planning/debug/09-UAT-quarantined-2026-04-10.md` — 14/15 claims were code-existence checks, not runtime verification
2. **Phase 09 VALIDATION quarantined** — `.planning/debug/09-VALIDATION-quarantined-2026-04-10.md` — validation was mock-only
3. ~~**Background observability mostly blind**~~ — RESOLVED in Phase 14: canonical event extraction, status-aware notifications
4. ~~**668 tests pass but mock-heavy**~~ — RESOLVED in Phase 14: 351 tests pass, dead-module tests removed
5. ~~**9 debug sessions, 0 verified fixes**~~ — RESOLVED in Phase 14: session-264b debug closed with all root causes verified
6. ~~**Delegate-task runtime failure (8× Zod errors)**~~ — RESOLVED 2026-04-23: missing `pattern` field in `session-creator.ts` PermissionRule fixed, validated by independent Devin investigation
7. **Next runtime step still needs selection** — downstream planning must decide how to resume live runtime verification/re-planning from the corrected Phase 12 baseline

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test suite | Pass | 351 passed |
| Typecheck | Pass | Pass (0 errors) |
| Build | Pass | Pass |
| Runtime-verified delegation | Working | CORRECTED — event routing, sync race, notifications, VALID_AGENTS all fixed |
| Completion detection live | Working | CORRECTED — canonical event extraction via getEventSessionID |
| Phase 12 P02 | 9 min | 2 tasks | 7 files |
| Phase 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash P01 | 21h 46m | 3 tasks | 76 files |
| Phase 14 P02 | 5 min | 2 tasks | 4 files |
| Phase 14 P03 | 5 min | 3 tasks | 5 files |
| Phase 15 P01 | 8min | 3 tasks | 7 files |
| Phase 15 P02 | 5min | 3 tasks | 12 files |
| Phase 14 P02 | 5min | 2 tasks | 5 files |
| Phase 14 P03 | 425s | 1 tasks | 3 files |
| Phase 16-background-delegation-revamp-pty-integration-rebuild-backgro P02 | 5min | 2 tasks | 4 files |
| Phase 16-background-delegation-revamp-pty-integration-rebuild-backgro P04 | 8 min | 3 tasks | 11 files |
| Phase 16-background-delegation-revamp-pty-integration-rebuild-backgro P05 | 7 min | 2 tasks | 9 files |
| Delegate-task Wave A fix (PermissionRule pattern) | 5 min | 1 task | 2 files |

## Accumulated Context

### Decisions

- **2026-04-06**: Delete `.opencode/tools/` entirely — src/tools/ is superior
- **2026-04-06**: Keep all `src/tools/` components — all contribute to AI agent workflows
- **2026-04-06**: Keep EnhancedPromptOutputSchema and PipelineStateSchema — contracts, not dead code
- **2026-04-06**: Keep tool-helpers.ts — 5 LOC convention anchor
- **2026-04-06**: Fine granularity — 5 phases derived from bug severity and natural delivery boundaries
- **2026-04-06**: ContextBudgetRecordSchema preserved as future contract placeholder
- **2026-04-06**: system.transform hook removed — prompt-enhance output contract gated correctly
- [Phase 02]: All Phase 02 decisions preserved — see previous STATE.md versions
- [Phase 08]: runtimePolicyOverride values inherit only from harness-owned parent runtime metadata
- [Phase 08]: Parent-visible async delegated-session status is derived from continuity-backed lifecycle truth
- [Phase 08]: Phase 08 closed — runtime policy override seam restored, Phase 02 re-verification green at 18/18
- [Phase 09]: Completion detection as sub-module — start gate, backoff polling, true completion, failure handling
- [Phase 09]: Count combined evidence as messages plus tool-call parts before accepting idle completion
- [Phase 09]: Reuse CompletionDetector as the stable-idle gate
- [Phase 09]: Base64-encode sync assistant output inside a JSON envelope
- **2026-04-14**: Forensic truth reset — STATE.md rewritten to reflect actual project state, not inflated claims
- **2026-04-14**: Phase 12 reconciled 09-family artifacts; 09.2-02/03 summaries are historical evidence only, not authoritative runtime closure
- [Phase 12]: Quarantine contaminated 09.2 summaries instead of deleting them so forensic history remains auditable.
- [Phase 12]: Use the Phase 12 reconciliation note as the authoritative bridge between forensic findings and future planning metadata.
- [Phase 14]: Keep runtime-policy.ts as surviving baseline infrastructure while removing 09-13 regression modules around it.
- [Phase 14]: Delete failing tests that exercised removed 09-13 behaviors instead of preserving mock-heavy coverage for dead modules.
- [Phase 14]: Use a temporary compile-safe lifecycle-manager shell as the clean-slate boundary until 14-02 rebuilds delegation behavior.
- [Phase 14]: Use continuity storage for delegations.json so delegation durability stays in the canonical harness state directory.
- [Phase 14]: Persist delegation status before resolving callbacks or async notifications to avoid recovery races.
- [Phase 14]: Return delegate-task results through the standard JSON tool-response envelope so the plugin tool contract stays string-based while preserving structured sync/async payloads.
- [Phase 14]: Route session.idle and session.deleted to DelegationManager through plugin event observers instead of reworking the existing hook factories.
- [Phase 15]: Replaced profanity with professional language in build.md
- [Phase 15]: Wildcard skill permissions replaced with explicit allowlists across agents
- [Phase 15]: Coordinator asserted as sole primary orchestrator; all other agents are specialists
- [Phase 15]: files_to_read blocks reference only actually-existing files — plan suggested nonexistent GSD reference paths — Plan listed files that don't exist on disk; used ls to find real files in each skill's references/ and scripts/ directories
- [Phase 14]: safetyCeilingMs range set to 60000-3600000 (1-60 min) replacing 1000-1800000 — Plan spec requires 1-60 min range for WaiterModel architecture
- [Phase 14]: delegation-status tool supports both single-delegation lookup and list-with-filter in one tool — Keeps tool surface minimal while covering D-14 requirement for dedicated status polling
- [Phase 14]: D-08 runtime-truthful tests complete: 372→407 tests, transport-boundary-only mocking, timer precision fixes
- [Phase 16]: PTY buffers use global character offsets so truncated readers can resume deterministically
- [Phase 16]: PtyManager preserves exitCode until explicit terminate() cleanup
- [Phase 16]: PTY support detection requires both bun-pty and Bun runtime presence
- Validated agent metadata now feeds one canonical queue-key context, and DelegationManager hard-fails on queue-key drift between acquire and spawn paths.
- Delegation persistence moved into a dedicated helper that normalizes older records so new execution metadata does not break recovery.
- HarnessLifecycleManager now acts as a DelegationManager facade, while lazy PTY loading preserves truthful fallback metadata without breaking Node-based verification.
- Persist the canonical queue key on each delegation record so dispatch and status surfaces report the same runtime concurrency context used at acquire time.
- Use a session-api message-count wrapper that returns null on transient failures so stability polling never invents progress.
- **2026-04-23:** Delegate-task 8× Zod error root cause is `session-creator.ts` local `PermissionRule` missing required `pattern` field — NOT `validateAgent()` or SDK/server schema drift. 8 rules × 1 missing field = 8 errors. Fix: import canonical `PermissionRule` from `types.ts` + add `pattern: "*"` to all 8 rules.
- **2026-04-23:** Independent Devin investigation reached identical conclusion by inspecting OpenCode server source (`Permission.Rule` requires `pattern: Schema.String`) and oh-my-openagent reference (16+ call sites all include `pattern`). Third-party validation confirms root cause.
- **2026-04-23:** R-AGENT-01 shim in `delegation-manager.ts` was masking the symptom (treating `app.agents()` as the source) but not the cause (`session.create` permission payload). Shim should be reverted in Wave B once runtime verified.

### Todos

- [x] Fix 3 typecheck errors from partial merge — RESOLVED 2026-04-22 (W1 types + constants landed in 16.2)
- [x] Fix delegate-task runtime 8× Zod validation error — RESOLVED 2026-04-23 (Wave A: canonical PermissionRule import + pattern: "*" on all 8 rules)
- [ ] Runtime verify delegate-task in fresh OpenCode session (awaiting user)
- [ ] Revert R-AGENT-01 shim in delegation-manager.ts once runtime verified (Wave B cleanup)
- [ ] Plan Phase 16.2 via /gsd-plan-phase 16.2
- [ ] Decide the next corrected runtime step for the 09-family corridor (fresh verification, targeted re-plan, or both)
- [ ] Live verification: spawn real child sessions and confirm end-to-end delegation works from the Phase 12 baseline
- [ ] Plan Phase 11: Clean Architecture Restructuring
- [ ] Plan Phase 03: Schema Definition & Runtime Configurability

### Roadmap Evolution

- Phase 13 added: fix async delegated result capture and persist child session outputs, transcripts, and evidence so completion is backed by recoverable work product
- Phase 14 added: delegate-task truth-reset — archive phases 09-13, remove trash artifacts, refactor codebase to stop confusing agents about delegation
- Phase 15 added: Security & Quality Remediation — fix all 26 audit issues (3 critical, 8 high, 7 medium, 8 low) from comprehensive codebase audit
- Phase 16 added: Background Delegation Revamp + PTY Integration — rebuild background delegation to overcome all current limitations (read-only restriction, 15-min timeout, no undo/branching parity, no write-capable background) by synthesizing architecture from oh-my-openagent, opencode-background-agents, and opencode-pty
- Phase 16.2 added: PTY Execution Wiring + OMO Safety Patterns — close verification gaps, add grace periods, parent notifications, adaptive polling, nesting depth limits (SPEC validated, 24 requirements, 6 already implemented)
- Phase 17 added: Hivemind Skills Refactor — Critical Fixes (Playbook Phase 0) — first of 6 continuation phases mapping HIVEMIND-SKILLS-REFACTOR-PLAYBOOK into GSD phases 17–22. Covers C1–C5 critical issues, hm-* rename mandate, soft→hard bridge model, runtime compilation model. Specification: .hivemind/state/session-context-prompt-v4.md
- Phase 18 added: Context & Research — Skills Refactor Playbook Phase CR. Mandatory research/audit phase before any structural skill work. Per HIVEMIND-SKILLS-REFACTOR-PLAYBOOK v2.0 §VI.CR. Continuation mapping renumbered: old Phase 18→19, 19→20, 20→21, 21→22, 22→23.
- 2026-04-22: Learnings extracted from Phases 14 (40 items), 15 (28 items), 16 (49 items) — total 117 structured learnings across decisions/lessons/patterns/surprises

### Blockers

- ~~**Phase 16.2 prerequisite:** Codebase is broken — 3 typecheck errors~~ — RESOLVED 2026-04-22
- **Runtime verification pending:** Delegate-task fix applied but needs live OpenCode session test

### Third-Party Validation

- **2026-04-23:** Devin investigation session `3ac1654154854ed7a7d05c711c8d67ac` independently discovered the identical root cause (`session-creator.ts` local `PermissionRule` missing `pattern`). Validated against OpenCode server source (`Permission.Rule` requires `pattern: Schema.String`) and oh-my-openagent reference (16+ call sites all include `pattern`). Full report: `.planning/reports/2026-04-23-delegate-task-remediation-findings-devin.md`.

### Technical Debt (from Learnings Extraction 2026-04-22)

| Source | Debt Item | Impact | Phase |
|--------|-----------|--------|-------|
| 14-LEARNINGS | Stale Phase 02 verification truths referencing deleted APIs | False confidence in runtime behavior | 11 |
| 14-LEARNINGS | Plan-suggested file paths were fabricated — executor must always verify against disk | Plans may reference non-existent files | All |
| 14-LEARNINGS | Phase 02 baseline had 80% of needed infrastructure but was never recognized | Redundant re-implementation risk | 11 |
| 15-LEARNINGS | Git/symlink worktree dual-path structure affects commit staging | Commits may land in wrong tree | All |
| 16-LEARNINGS | D-04A dual-mode architecture discovered through verification, not planning | Future dual-path decisions need verification-first approach | 16.2 |
| 16-LEARNINGS | Partial merge left codebase broken (3 undefined constants) | Blocks Phase 16.2 start | 16.2 |
| 16-LEARNINGS | notification-handler.ts deprecated but still the only viable notification path | Module marked dead but needed for 16.2 | 16.2 |
| 16-LEARNINGS | 6 of 24 Phase 16.2 requirements already implemented | PTY wiring section is verification-only, not new code | 16.2 |

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260421-u9n | Update AGENTS.md files to match current codebase state | 2026-04-21 | 82572ba9 | [260421-u9n-update-agents-md-files-to-match-current-](./quick/260421-u9n-update-agents-md-files-to-match-current-/) |
| 260421-x8j | Create agents-md-sync skill + sync-agents-md command | 2026-04-21 | 25e2aa7a | [260421-x8j-create-agents-md-sync-skill-for-routine-](./quick/260421-x8j-create-agents-md-sync-skill-for-routine-/) |

## Session Continuity

**Worktree:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project:** `/Users/apple/hivemind-plugin`
**Branch:** feature/harness-implementation
**Commits on branch:** 19+

**Stopped At:** Phase 20 PARTIAL — structural changes landed but acceptance incomplete. Phase 19 partial (19/21 renamed, stale refs remain). Phases 21-23 NOT substantiated (no phase dirs, commit scopes mismatch claims). Repair pass in progress.

**Key files:** `.planning/debug/phase-09-forensic-false-signals-2026-04-14.md`, `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-reconciliation-note-2026-04-14.md`, `src/plugin.ts`

---
*State initialized: 2026-04-06*
*Forensic reset + reconciliation: 2026-04-14 — false-start corridor corrected and 09-family truth quarantined where needed*

**Planned Phase:** Repair Phases 19-23 — audit revealed incomplete acceptance, stale refs, missing phase dirs
