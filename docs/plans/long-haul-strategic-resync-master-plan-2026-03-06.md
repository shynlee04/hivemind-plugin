# Long-Haul Strategic Resync Master Plan

Date: 2026-03-06
Status: active-strategic-resync
Type: orchestration-guide
Scope: repo-truth preservation, `.hivemind` composition analysis, manual external synthesis preparation

## Purpose

This document is the active orchestration guide for the next long-haul wave.

It does not reopen the completed March 6 implementation tranche.
It preserves that tranche as the floor, then pivots the next planning wave toward the bigger-frame problem:

- how reset and init form `.hivemind`
- how later runtime automation reshapes it
- how readable planning source-of-truth should coexist with deterministic runtime state
- how lineage, delegation, and continuity should be composed without poisoning later sessions

This is a multi-round guide.
Each cycle requires explicit user authorization before moving to the next cycle.

## Locked March 6 Baseline

The following are settled current facts and must be carried forward as fixed assumptions unless the repository itself disproves them:

- `task_id` continuity is implemented and already part of the completed baseline.
- `hivemind_inspect.traverse` v1 exists and remains tree-first.
- prompt-surface ownership coverage exists and remains part of the regression floor.
- the first prompt de-duplication slice is complete.
- `tool-gate` is advisory-only for persisted writes.
- child-session prompt minimization is complete in the current runtime hooks.
- `brain.json` remains the canonical hot session metadata store.
- `graph/*.json` remains the canonical structured task, trajectory, and memory source for packed injected context.
- `hierarchy.json` remains the canonical tree-first navigation surface.
- runtime child linkage remains runtime-only and must not become a separate persisted registry in this wave.
- no fourth state store is allowed in this strategy.
- direct GX-Pack fallback runtime coverage is still pending a stable test harness and remains open, not complete.

## Strategic Problem Frame

The current long-haul issue is larger than prompt deduplication alone.

The live system still makes it too easy for agents and sessions to lose orientation around:

- what a fresh session should read first
- what role it is operating in
- whether a task is independent, dependent, reopened, or safe to run in parallel
- how readable planning artifacts relate to deterministic runtime state
- how `.hivemind` should be formed, consumed, and evolved without poisoning context

The user’s observed failure mode is not only bad prompting. It is weak composition architecture across init, planning roots, session continuity, lineage boundaries, and delegation envelopes.

## Three Progression Routes

### Route 1: Documentation-First Stabilization

Focus:

- rewrite planning and handoff docs first
- clarify boundaries before another runtime change

Advantages:

- lowest execution risk
- fastest path to cleaner operator guidance

Limit:

- risks describing the wrong system if bootstrap and runtime formation remain under-audited

### Route 2: Bootstrap-and-Composition-First Strategic Resync

Focus:

- audit how reset/init and later automation actually form `.hivemind`
- map deterministic state, readable planning source-of-truth, and delegation continuity as one composition system

Advantages:

- attacks the current root cause instead of another symptom
- gives later implementation waves a stable architecture target
- matches the user’s stated concern that the composition of automatic mechanisms is the real issue

Limit:

- requires a slower synthesis pass before implementation resumes

### Route 3: Runtime-Authority-Refactor-First

Focus:

- resume direct runtime cleanup immediately
- continue reducing hook overlap and session ambiguity in code first

Advantages:

- may improve short-term runtime behavior quickly

Limit:

- highest risk of optimizing the wrong local surfaces before the planning and continuity model is corrected

## Recommended Route

Choose Route 2: bootstrap-and-composition-first strategic resync.

This route is the best fit because the next architectural decision cannot be made safely from prompt-surface symptoms alone. March 6 already delivered the safe baseline for hook ownership, child-session minimization, and state-authority discipline. The unresolved problem is now system formation: what init creates, what runtime mutates, what planning roots should store, what sessions should consume, and how delegation should carry continuity without creating another authority family.

The other two routes remain useful as supporting tactics, not as the lead strategy. Documentation-first stabilization is too shallow if it does not start from the deterministic formation path. Runtime-authority-refactor-first is too aggressive because it re-enters restricted runtime work before the larger `.hivemind` composition contract is restated cleanly.

## Orchestration Rules

- This is a multi-cycle master plan, not an implementation specification.
- Each cycle requires explicit user authorization before proceeding.
- Current repo truth outranks older planning artifacts and any external answer.
- External answers are synthesis inputs only and must be validated locally before they affect the next plan.
- The next wave must not reopen completed March 6 work unless a verified regression appears.

## Non-Negotiable Guardrails

- do not create a fourth state store
- do not demote `brain.json` from hot session metadata authority
- do not replace tree-first traversal with graph-first traversal in this wave
- do not convert runtime child linkage into a new persisted registry
- do not treat older mixed evidence packets as active outbound packets
- do not let prompts become the primary architecture
- do not flatten `hivefiver` and `hiveminder` responsibilities into one continuity model

## Cycle Plan

## Cycle 1: Strategic Resync Audit

Purpose:

- freeze the verified March 6 baseline
- restate the current bigger-frame problem
- separate deterministic runtime formation from readable planning/governance surfaces

Outputs:

- `docs/plans/strategic-resync-synthesis-index-2026-03-06.md`
- this master plan
- the three manual Devin packets

Questions to settle locally before any external synthesis is trusted:

- what reset and init deterministically create
- what runtime hooks and tools later derive or mutate
- what belongs in markdown planning hierarchy vs JSON runtime state
- what continuity failures are caused by composition, not merely by prompts

Approval gate:

- user approves carrying the fresh packets outward and confirms the local framing is accurate enough to query against

## Cycle 2: Manual Devin Packet Wave

Purpose:

- get bounded architecture and implementation-interface synthesis without letting external analysis override repo truth

Packets to carry manually:

- `docs/plans/devin-packet-opencode-runtime-session-semantics-2026-03-06.md`
- `docs/plans/devin-packet-planning-root-hivemind-composition-2026-03-06.md`
- `docs/plans/devin-packet-lineage-delegation-continuity-2026-03-06.md`

Rules:

- external replies are synthesis inputs, not authority
- returned answers must separate documented behavior, repo-specific inference, and design recommendations
- recommendations that violate the locked March 6 baseline are rejected

Approval gate:

- user chooses when enough external synthesis has been collected and returned for local validation

## Cycle 3: Resynthesized Architecture Pass

Purpose:

- merge the verified repo baseline with the returned external synthesis
- turn the result into a coherent bigger-frame architecture direction

Expected outputs:

- a revised long-haul architecture direction for `.hivemind` composition
- a planning-root hierarchy direction
- a continuity and delegation direction
- a new contradiction register showing what remains unresolved

Decision routes:

- if external replies confirm the current direction, keep the March 6 baseline and narrow the next implementation tranche
- if external replies surface better structure without violating current invariants, adapt the plan
- if external replies conflict with repo truth or the March 6 baseline, discard those claims and document why

Approval gate:

- user explicitly authorizes transition from synthesis to implementation planning

## Cycle 4: Implementation Planning Only

Purpose:

- convert the resynthesized architecture direction into the next implementation roadmap without mutating code yet

Expected planning themes:

- planning-root normalization
- `.hivemind` composition and hierarchy normalization
- lineage-safe continuity envelope design
- workflow and validation document flow
- direct GX-Pack fallback runtime coverage only after a stable harness exists

Approval gate:

- user authorizes actual implementation after reviewing the new roadmap

## Active Evidence Roots

These remain the primary local planning anchors for this strategy:

- `docs/plans/2026-03-06-state-authority-rationalization-pass.md`
- `docs/plans/2026-03-06-next-iteration-implementation-plan.md`
- `docs/plans/2026-03-06-external-replies-reconciled-execution-plan.md`
- `.hivemind/project/planning/research/milestone-01-audit-prompt-standard-2026-03-06.md`
- `.hivemind/project/planning/debug/active/milestone-01-enhanced-systematic-synthesis-prompt-2026-03-06.md`
- `.hivemind/project/planning/debug/active/milestone-01-current-state-audit-launch-2026-03-06.md`

## What This Strategy Explicitly Does Not Reopen

- the completed March 6 hook and test tranche
- the current state-authority split
- the runtime-only child-linkage decision
- the completed traversal v1 landing
- already-implemented `task_id` continuity

## Success Condition

This strategy succeeds when the repository has:

- one coherent bigger-frame resync narrative
- three clean manual external synthesis packets
- a clear separation between repo truth and external guidance
- a user-approved path from audit to synthesis to later implementation planning

No code mutation is part of this document set.
