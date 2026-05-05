# Lane B: Governance Documentation Drift Audit

**Audit Date:** 2026-05-05  
**Auditor:** HER-0 Lane B Governance Auditor (hm-l2-general, delegated)  
**Skills Loaded:** `hm-l3-detective`, `hm-l2-requirements-analysis`, `gate-l3-spec-compliance`  
**Phase:** HER-0 — Ecosystem Re-map & Reality Audit  
**Requirement:** HER-0-B — Governance drift report with per-claim verification against source files

---

## Executive Summary

Seven governance documentation claims were verified against live source code and filesystem state. **4 claims are DRIFTED** (mismatch between documentation and reality), **3 are CONFIRMED**. No claims are UNVERIFIABLE. The most critical drifts are: (1) ARCHITECTURE.md claims 9 tools but 16 are actually registered in plugin.ts — a 78% undercount that misrepresents the plugin surface area; (2) AGENTS.md claims 97 agents but only 89 exist on disk — both ARCHITECTURE.md (claims 57) and AGENTS.md (claims 97) disagree with each other AND with reality; and (3) AGENTS.md claims 51 skills but 58 exist — a drift acknowledged in GAP-MATRIX but not yet reflected in AGENTS.md. The `src/lib/AGENTS.md` still flags notification-handler as "DEPRECATED: Dead code" despite it being actively used since Phase 16.2 — CONCERNS.md already documented this but no remediation has occurred. Q6 state root separation compliance across .planning/ artifacts is solidly CONFIRMED.

---

## Claim-by-Claim Verification Table

| # | Claim | Source | Expected | Actual | Status | Evidence |
|---|-------|--------|----------|--------|--------|----------|
| 1 | "9 tools" registered in plugin.ts | `.planning/codebase/ARCHITECTURE.md:20` ("registers 9 tools"), `ARCHITECTURE.md:86-101` (lists 9 by name) | 9 | **16** | **DRIFT** | `src/plugin.ts:108-125` — `tool:` block registers 16 entries: `delegate-task`, `delegation-status`, `run-background-command`, `prompt-skim`, `prompt-analyze`, `session-patch`, `session-journal-export`, `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `configure-primitive`, `validate-restart`. GAP-MATRIX-2026-05-05.md F-03c (line 47) already notes "All 23 tool files confirmed registered" — consistent with 16 wired tools. **ARCHITECTURE.md listed only 9 of 16, missing all 7 hivemind-* tools.** |
| 2 | `notification-handler` flagged DEPRECATED in `src/lib/AGENTS.md` | `.planning/codebase/CONCERNS.md:31-35` — "Documentation drift — notification-handler status" | Marked as re-activated | Still marked **DEPRECATED** | **DRIFT** | CONCERNS.md correctly identified this drift. `src/lib/AGENTS.md:13`: "DEPRECATED: Dead code. WaiterModel polling replaces push notifications." But `src/lib/notification-handler.ts:4-8`: "Re-activated in Phase 16.2 for terminal-state delegation notifications." AND it is actively imported by `src/lib/delegation-state-machine.ts:22` (`notifyDelegationTerminal`) and `src/lib/lifecycle-manager.ts:9` (`replayPendingNotifications`). **CONCERNS.md is correct; the drift is in src/lib/AGENTS.md, which has NOT been updated since CONCERNS was written.** |
| 3 | Q6 state-root separation: `.hivemind/` for state, `.opencode/` for primitives | `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md:230` (Q6 decision locked), `.planning/PROJECT.md:137` | All .planning/ artifacts reference correct paths | All correct | **CONFIRMED** | `.planning/PROJECT.md:18,80,137,166` — consistently states `.hivemind/` = state, `.opencode/` = primitives. `.planning/workstreams/milestone/STATE.md:163` — Phase 38 COMPLETE, verified all 7 writers target `.hivemind/state/*`. `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` — references Q6 compliance. GAP-MATRIX references `.hivemind/` correctly throughout. **No drift detected — Q6 is fully propagated through .planning/ artifacts.** |
| 4 | Agent count: 97 agents in `.opencode/agents/` | `AGENTS.md:303` — "97 agents in `.opencode/agents/`" (33 GSD + 30 hm-* + 6 hivefiver + 10 hf-* + 18 core) | 97 | **89** | **DRIFT** | `ls .opencode/agents/*.md | wc -l` → **89**. Breakdown: 33 gsd-*, 45 hm-* (includes "30 hm-*" + "18 core" both use hm- prefix, actual combined = 45 vs claimed 48), 11 hf-*. **Additionally, `ARCHITECTURE.md:28,175` claims "57 agents" — this is 35% lower than actual (89), and both documents contradict each other: one says 57, one says 97, reality is 89.** GAP-MATRIX line 45 states "90 agent files in `.opencode/agents/`" — also slightly off (89 actual). **Three different counts across three documents.** |
| 5 | Skill count: 51 skills in `.opencode/skills/` | `AGENTS.md:304` — "51 skills" (30 hm-* + 11 hf-* + 3 gate-* + 6 stack-* + 1 unprefixed + 1 disabled) | 51 | **58** | **DRIFT** | `ls .opencode/skills/*/SKILL.md | wc -l` → **58**. `ARCHITECTURE.md:29,175` claims "50 skills" — also wrong. GAP-MATRIX line 46 states "58 skill directories" — matches actual. **AGENTS.md has not been updated despite GAP-MATRIX correctly identifying 58.** AGENTS.md footnote line 397 claims "Last synced: 2026-04-30 — SE-9 final verification: skill/agent counts synced to reality (51 active skills, 97 agents, 30 hm-* skills)" — this sync date predates the GAP-MATRIX discovery and is now stale. |
| 6 | Command count: 18 commands in `.opencode/commands/` | `AGENTS.md:305` — "18 commands" (7 core + 7 extended + 1 sync + 3 test) | 18 | **18** | **CONFIRMED** | `ls .opencode/commands/*.md | wc -l` → **18**: `deep-init.md`, `deep-research-synthesis-repomix.md`, `harness-audit.md`, `harness-doctor.md`, `hf-absorb.md`, `hf-audit.md`, `hf-configure.md`, `hf-create.md`, `hf-prompt-enhance-to-plan.md`, `hf-prompt-enhance.md`, `hf-stack.md`, `plan.md`, `start-work.md`, `sync-agents-md.md`, `test-echo.md`, `test-list.md`, `test-status.md`, `ultrawork.md`. **NOTE: `ARCHITECTURE.md:30,175` claims "20 commands" — that document is wrong (20 vs actual 18).** |
| 7 | Phase HER-0 status: "Planning" with all plans unchecked | `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md:17,23-29` | All 6 plans unchecked, status "Planning" | All unchecked, status "Planning" | **CONFIRMED** | ROADMAP.md:17: "Status: Planning". ROADMAP.md:24-29: All 6 plans unchecked (`- [ ]`). Requirements HER-0-A through HER-0-G all marked "Open" (ROADMAP.md:37-43). **Internally consistent — the workstream is in planning state as claimed.** |

---

## Drift Summary

| Status | Count | Percentage |
|--------|-------|------------|
| CONFIRMED | 3 | 42.9% |
| DRIFT | 4 | 57.1% |
| UNVERIFIABLE | 0 | 0.0% |
| **Total** | **7** | **100%** |

---

## Critical Drifts (Blocking Downstream Phases)

### C-1: ARCHITECTURE.md Tool Count — Underestimates by 78%
**Severity:** HIGH  
**Impact on downstream phases:** Phase HER-0-C (Module Ownership Matrix) and HER-0-D (OpenCode Runtime Verify) rely on accurate tool counts for surface mapping. The 7 unlisted hivemind-* tools (`hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-agent-work-create`, `hivemind-agent-work-export`) represent 44% of the tool surface. Any ownership matrix that uses ARCHITECTURE.md as source will be missing these modules. Fix: Update ARCHITECTURE.md:20 (text), ARCHITECTURE.md:86-101 (tool table), and ARCHITECTURE.md:188 (entry point description).

### C-2: Agent Count — Three Conflicting Numbers Across Three Documents
**Severity:** HIGH  
**Impact on downstream phases:** Phase HER-0-C (Module Ownership) and HER-0-E (Legacy Pattern Validation) need accurate agent enumerations. Three documents cite three different numbers: ARCHITECTURE.md says 57, AGENTS.md says 97, GAP-MATRIX says 90, actual is 89. Any agent-based analysis that trusts these counts will be incorrect. Fix: Run a definitive count (89), update all three documents to match. Identify the 8 agents claimed but not existing (97→89 delta).

### C-3: src/lib/AGENTS.md Still Marks notification-handler as DEPRECATED
**Severity:** MEDIUM  
**Impact on downstream phases:** Phase HER-0-E (Legacy Pattern Validation) could incorrectly treat notification-handler as dead code and recommend removal. It is actively imported by delegation-state-machine.ts and lifecycle-manager.ts. Fix: Update `src/lib/AGENTS.md:13` to reflect re-activated status per Phase 16.2.

### C-4: AGENTS.md Skill Count Stale — 58 Actual vs 51 Claimed
**Severity:** MEDIUM  
**Impact on downstream phases:** Phase HER-0-C (Module Ownership) and HER-0-E (Legacy Pattern) need accurate skill counts. GAP-MATRIX already identified 58. AGENTS.md has not been updated. The footnote claiming "synced to reality (51 active skills)" on 2026-04-30 is now falsified. Fix: Update AGENTS.md:304 to 58 active skills (52 shipped + 1 disabled + undiscovered skills).

---

## Evidence References

| Evidence Ref | File | Lines / Detail |
|-------------|------|----------------|
| E-01 | `src/plugin.ts` | Lines 108-125 — 16 tool registrations in `tool:` block |
| E-02 | `src/lib/AGENTS.md` | Line 13 — still says "DEPRECATED: Dead code" for notification-handler |
| E-03 | `src/lib/notification-handler.ts` | Lines 1-8 — "Re-activated in Phase 16.2" |
| E-04 | `src/lib/delegation-state-machine.ts` | Line 22 — imports `notifyDelegationTerminal` from notification-handler |
| E-05 | `src/lib/lifecycle-manager.ts` | Line 9 — imports `replayPendingNotifications` from notification-handler |
| E-06 | `ls .opencode/agents/*.md` | 89 files (shell command) — actual agent count |
| E-07 | `ls .opencode/skills/*/SKILL.md` | 58 files (shell command) — actual skill count |
| E-08 | `ls .opencode/commands/*.md` | 18 files (shell command) — actual command count |
| E-09 | `.planning/codebase/ARCHITECTURE.md:20,86-101,28,175` | Claims 9 tools (wrong), 57 agents (wrong), 50 skills (wrong), 20 commands (wrong) |
| E-10 | `AGENTS.md:303-305` | Claims 97 agents (wrong), 51 skills (wrong), 18 commands (correct) |
| E-11 | `.planning/codebase/CONCERNS.md:31-35` | Correctly identified notification-handler drift |
| E-12 | `.planning/research/GAP-MATRIX-2026-05-05.md:45-46` | States 90 agents, 58 skills — partial match to reality |
| E-13 | `.planning/workstreams/milestone/STATE.md:163` | Phase 38 Q6 migration verified COMPLETE |
| E-14 | `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md:17,23-43` | HER-0 status "Planning", all plans unchecked |

---

## Source Files Read

| File | Mode | Lines Read |
|------|------|-----------|
| `.planning/codebase/ARCHITECTURE.md` | DEEP | 319 |
| `.planning/codebase/CONCERNS.md` | DEEP | 237 |
| `.planning/PROJECT.md` | DEEP | 186 |
| `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` | SCAN | 100 (Q6 section confirmed) |
| `.planning/research/GAP-MATRIX-2026-05-05.md` | SCAN | 100 (F-03c, F-03a, F-03b verified) |
| `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` | DEEP | 43 |
| `AGENTS.md` | DEEP | 397 |
| `src/plugin.ts` | DEEP | 165 |
| `src/lib/notification-handler.ts` | SCAN | 30 (header + imports) |
| `src/lib/AGENTS.md` | (system-reminder fragment) | Line 13 |
| `src/lib/delegation-state-machine.ts` | (grep) | Line 22 |
| `src/lib/lifecycle-manager.ts` | (grep) | Line 9 |

---

## Evidence Tags Used

| Tag | Count | Explanation |
|-----|-------|-------------|
| `CONFIRMED` | 3 | Claims 3, 6, 7 verified against live sources |
| `DRIFT` | 4 | Claims 1, 2, 4, 5 contradict live sources |
| `UNVERIFIABLE` | 0 | All claims were verifiable with available evidence |

---

## LANE B COMPLETE

**Files written:**  
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md`

**Files created (mkdir):**  
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/`

**Status:** LANE B COMPLETE — All 7 governance claims verified with file:line evidence. 4 drifts detected, 3 critical. Recommendation: Update ARCHITECTURE.md (tools+agents+skills+commands), AGENTS.md (agents+skills counts), and src/lib/AGENTS.md (notification-handler status) before HER-0-C/D/E lanes proceed.
