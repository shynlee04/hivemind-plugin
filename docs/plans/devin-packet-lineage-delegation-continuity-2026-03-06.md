# Devin Packet: Lineage, Delegation, and Continuity Design

Date: 2026-03-06
Status: ready-for-manual-carry
Type: external-synthesis-packet

## Purpose

This packet is for manual use with Devin.

Its purpose is to get architecture and implementation-interface guidance on the continuity problem that remains after the March 6 baseline work:

- agents still need better orientation at session start
- delegation boundaries still need clearer structured continuity
- lineage separation must remain explicit
- close, reopen, dependent, and parallel session behavior still need a stronger strategic model

The goal is to improve the long-haul continuity envelope without adding a new state store or flattening lineages into one stream.

## Settled Local Facts

These local facts are already true and must be preserved:

- `hivefiver` and `hiveminder` must stay explicitly separated before any overlap is synthesized
- `task_id` continuity is already implemented in the current baseline
- runtime child-session minimization is already active
- runtime child linkage remains runtime-only
- `brain.json` remains the hot session metadata store
- `hierarchy.json` remains the tree-first navigation authority
- no fourth state store is allowed
- direct GX-Pack fallback runtime coverage is still pending a stable harness and is not part of this continuity design packet

## Problem Frame

The main continuity failures observed locally are:

- fresh sessions do not always know how to orient themselves cleanly
- delegated sessions can inherit too little structure or the wrong structure
- downstream agents may not know whether to clarify, inspect, execute, wait, or stop
- lineages can be mixed conceptually even when they should remain separate
- `.hivemind` continuity artifacts can become a burden if they are treated as raw context instead of structured handoff and state surfaces

We want a stronger continuity model that works with the current authorities instead of escaping them.

## Repo Slices To Inspect

Please inspect these repo surfaces when answering:

- `src/lib/runtime-session-lineage.ts`
- `src/lib/session-split.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/hooks/soft-governance.ts`
- `src/tools/hivemind-cycle.ts`
- `src/schemas/brain-state.ts`
- `src/lib/hierarchy-tree.ts`
- `.hivemind/sessions/manifest.json`
- `.hivemind/handoffs/`
- `.hivemind/project/planning/debug/active/milestone-01-current-state-audit-launch-2026-03-06.md`
- `.hivemind/project/planning/debug/active/milestone-01-enhanced-systematic-synthesis-prompt-2026-03-06.md`
- `.hivemind/project/planning/research/milestone-01-audit-prompt-standard-2026-03-06.md`

## Questions To Answer

### Q1. Session-Start Orientation

Within current constraints, what minimum structured continuity packet should a fresh session receive so it can:

- understand its role
- understand its task hierarchy position
- know what to inspect first
- know what is settled vs open
- know when clarification is required before execution

### Q2. Delegation Envelope

What should the normalized delegation envelope look like if it must fit the current authorities and not create a new state store?

We need a repo-specific answer for:

- which fields belong in persisted session metadata
- which fields belong in handoff artifacts
- which fields belong in planning artifacts
- which fields should stay runtime-only

### Q3. Close, Reopen, Dependent, and Parallel States

How should the system model:

- safe-to-close
- should-reopen
- independent parallel session
- same-hierarchy parallel session
- dependent blocked session

Please focus on the smallest structure that can support reliable workflow orchestration without expanding storage sprawl.

### Q4. Lineage Separation and Compatibility

How should the continuity design keep `hivefiver` and `hiveminder` separate while still allowing future compatibility?

We need:

- what must remain lineage-specific
- what can be shared safely
- what must be explicit at handoff boundaries
- what should never be inferred from broad context alone

### Q5. Context Consumption Order

What should downstream agents consume first, second, and only-if-needed when resuming work?

We need a design for:

- compact intake
- progressive disclosure
- handoff packet minimums
- anomaly evidence handling
- when the system should ask questions instead of acting

### Q6. Continuity Safety Against Compaction and Drift

Given current runtime and session behavior:

- what continuity information must survive compaction safely
- what can be reconstructed from runtime state or hierarchy state
- what should never rely on prompt replay alone
- how to prevent continuity artifacts from becoming polluted pseudo-authority

## Constraints and Forbidden Recommendations

- do not recommend a fourth state store
- do not recommend flattening lineages into one continuity stream
- do not recommend solving continuity with larger prompt dumps
- do not recommend replacing the current March 6 baseline instead of building on top of it
- do not recommend a design that depends on old mixed evidence packets as the active continuation layer

## Required Answer Format

Please answer in this exact structure:

1. Current continuity problem map
2. Recommended minimum continuity envelope
3. Layer ownership for runtime, metadata, planning, and handoff surfaces
4. Safe workflow states for close, reopen, dependent, and parallel work
5. Lineage-separation rules
6. Risks, false assumptions, and migration cautions

## Quality Bar

- keep the answer repo-specific
- preserve the current authority split
- preserve runtime-only child linkage
- optimize for long-haul orientation, delegation clarity, and continuity discipline
