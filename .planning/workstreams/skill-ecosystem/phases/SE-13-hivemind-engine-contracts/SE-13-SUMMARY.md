---
phase: SE-13
plan: SE-13
subsystem: .hivefiver-meta-builder/skills-lab
tags: [hivemind, engine-contracts, state-reference, L3-skills, reference]
requires: [SE-12]
provides: [hm-l3-hivemind-state-reference, hm-l3-hivemind-engine-contracts]
affects: [SE-14, AS-10]
tech-stack:
  added: []
  patterns: [P2-reference-skills, RICH-8-scoring]
key-files:
  created:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-state-reference/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-state-reference/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-state-reference/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-engine-contracts/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-engine-contracts/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-hivemind-engine-contracts/evals/evals.json
  modified:
    - .planning/workstreams/skill-ecosystem/STATE.md
decisions:
  - "SE-13 deliverables: hm-l3-hivemind-state-reference + hm-l3-hivemind-engine-contracts (renamed from hm-hivemind-state-reference + hf-hivemind-state-reference per CONTEXT.md to align with L3-naming convention and user's explicit prompt)"
  - "Both skills follow P2 reference pattern (read-only consumption, context-bomb flag) consistent with existing L3 reference skills"
  - "Engine contracts and state reference separated into two skills: contracts = how engines work (src/lib/), state = what engines produce (.hivemind/)"
metrics:
  duration: "~30min"
  completed: 2026-04-30
  plans_executed: 1
  tasks_completed: 1
  files_created: 6
  files_modified: 1
  active_skills: 53
---

# Phase SE-13: Hivemind Engine Contracts — Summary

Two L3 reference skills documenting the Hivemind runtime engine contracts and `.hivemind/` state structure created from `src/lib/` source code verification.

## Deliverables

### 1. hm-l3-hivemind-state-reference (8/8 RICH-8, B+ grade — 96/120)

Complete reference for the `.hivemind/` state root defined by Q6 State Root Separation (locked 2026-04-25). Documents:

- **Directory structure:** 8 `.hivemind/` subdirectories (archive, cycle2, daily-notes, event-tracker, journal, lineage, research, state)
- **6 core state file contracts** with full TypeScript schema definitions:
  - `session-continuity.json` — ContinuityStoreFile (versioned, cross-session state)
  - `delegations.json` — Delegation record array (active/completed delegation tracking)
  - `event-tracker/` — Session event journals (JSON + Markdown per session)
  - `config-workflows.json` — Workflow configuration state (batch-config turn tracking)
  - `planning/` — Task persistence via hm-planning-persistence (task_plan.md, findings.md, progress.md)
  - `SESSION-STATE.md` — WAL-protocol session state (write-before-respond, survives compaction)
- **Read/write contracts:** Deep-clone-on-read for continuity, best-effort write for event tracker and workflow persistence
- **Recovery paths:** hydrateFromContinuity(), recoverPending(), replayPendingNotificationsForEvent()
- **Agent access boundaries:** L0 full read + conditional write, L1 read + tool-proxied write, L2 read-only, L3 read-only
- **5 anti-patterns** with detection + correction: The Direct Muter, The Stale Reader, The Path Guesser, The Notification Ignorer, The Nesting Violator
- **5 self-correction modes:** Missing State Files, Stale State, Delegation/Session Conflict, Recovery Failure, User Contradiction
- **3 scenario evals:** session status check, pending notification discovery, session journal lookup

### 2. hm-l3-hivemind-engine-contracts (8/8 RICH-8, B+ grade — 99/120)

Complete reference for Hivemind engine integration contracts verified against `src/plugin.ts` and all `src/lib/` modules. Documents:

- **10-step plugin load order** (must-never-deviate sequence from runtime policy → PTY → delegation → lifecycle → hooks → tools)
- **9 custom tool registration contracts** with factory injection patterns (delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart)
- **5 hook categories** with composition rules: core hooks, session hooks, tool guard hooks, event observers, tool.execute.after
- **Session lifecycle phases:** created → queued → dispatching → running → completed/failed (6-phase state machine with `isValidTransition()` guard)
- **Dual-signal completion detection:** session.idle event + 10-second stability timer (both must fire)
- **Keyed semaphore concurrency:** default 3 concurrent per key, FIFO queue with high/normal priority, optional acquire timeout
- **Budget policy defaults:** maxToolCallsPerSession=400, repeatedSignatureThreshold=16, warningCap=25
- **13 session API wrappers** with `[Harness]` error prefix and session ID validation
- **Task status transitions:** 8-value type (pending, queued, running, completed, failed, error, cancelled, interrupt)
- **Delegation limits:** max depth=3, max before prune=50, prune age=30min, cleanup delay=10min
- **6 anti-patterns** with detection + correction covering tool registration, hook mutation, init order, sync blocking, budget busting, depth violation
- **6 self-correction modes:** Tool Registration Failure, Lifecycle Rejection, Completion Hang, Concurrency Hang, Budget Exceeded, User Tool Addition
- **3 scenario evals:** plugin init order, completion hang diagnosis, concurrency limit explanation

## Acceptance Criteria Verification

- [x] `hm-l3-hivemind-state-reference` SKILL.md created, passes RICH-8 scorecard (8/8, B+ grade)
- [x] `hm-l3-hivemind-engine-contracts` SKILL.md created, passes RICH-8 scorecard (8/8, B+ grade)
- [x] `.hivemind/` directory structure fully documented with file descriptions
- [x] Delegation protocol reference complete: WaiterModel, dual-signal completion, delegation-status polling
- [x] Task queue reference complete: concurrency model, queue-key validation, task status transitions
- [x] Custom engine APIs documented: completion-detector, lifecycle-manager, runtime-policy
- [x] Session API wrappers documented (session-api.ts — all 13 functions)
- [x] Read/write access boundaries documented per agent depth (L0-L3)
- [x] Bidirectional cross-reference between both skills
- [x] Source-verified against `src/lib/` code (2026-04-30)

## Deviations from Plan

### Planned-vs-Delivered Adjustment

**1. [Rule 4 — Architectural] Renamed deliverables from CONTEXT.md to align with L3 naming convention**
- **Found during:** Task planning
- **Issue:** SE-13-CONTEXT.md specified `hm-hivemind-state-reference` + `hf-hivemind-state-reference` but all skills were renamed to depth-qualified format in SE-11. User's prompt specified `hm-l3-hivemind-state-reference` + `hm-l3-hivemind-engine-contracts`.
- **Fix:** Created `hm-l3-hivemind-state-reference` (L3 depth, hm-* lineage) and `hm-l3-hivemind-engine-contracts` (L3 depth, hm-* lineage) aligned with user's explicit prompt. The CONTEXT.md's original hf-* cross-lineage variant was consolidated into the hm-* reference since both lineages consume the same state.
- **Files modified:** N/A (naming decision at creation time)
- **Rationale:** User's instructions take precedence. L3 depth naming is now the standard across all skills. State/engine contracts are shared reference — no benefit from duplicate hf-* variant when content is identical.

## Known Stubs

None. Both skills are complete references with verified source code contracts.

## Threat Flags

None. Both skills are read-only references documenting existing engine behavior. No new attack surface introduced.

## RICH-8 Scores

| Skill | Score | Grade | Gates |
|-------|-------|-------|-------|
| hm-l3-hivemind-state-reference | 96/120 | B+ | 8/8 PASS |
| hm-l3-hivemind-engine-contracts | 99/120 | B+ | 8/8 PASS |

**Combined threshold:** Both skills pass RICH-8 ≥6/8. Both at B+ grade. Eval coverage (D7) is minimum viable at 3 scenarios each — could expand to 5+ in future hardening.

## Key Decisions

1. **Renamed from CONTEXT.md:** `hm-hivemind-state-reference` → `hm-l3-hivemind-state-reference`, `hf-hivemind-state-reference` → `hm-l3-hivemind-engine-contracts`. User's prompt alignment + L3 depth naming convention.
2. **Two-skill split:** State reference focuses on `.hivemind/` file structure and access patterns. Engine contracts focus on runtime wiring, initialization order, and API contracts. Each serves different agent need.
3. **Cross-reference:** Both skills bidirectional-reference each other. State reference says "see engine contracts for how engines produce this state." Engine contracts say "see state reference for what engines produce."
4. **Source-verified:** All contracts verified against `src/lib/` source code at time of creation. All constants and function signatures match.

## Dependency Impact

- **SE-14 (next phase)** — UNBLOCKED: integration contracts can now reference engine contracts
- **AS-10** — UNBLOCKED: engine contracts are now available for agent-synthesis integration
- **State updated:** SE-13 → COMPLETE, 15/17 phases complete
