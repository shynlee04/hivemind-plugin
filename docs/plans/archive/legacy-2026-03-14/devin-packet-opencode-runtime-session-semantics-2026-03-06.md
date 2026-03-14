# Devin Packet: OpenCode Runtime and Session Semantics

Date: 2026-03-06
Status: ready-for-manual-carry
Type: external-synthesis-packet

## Purpose

This packet is for manual use with Devin.

Its purpose is to get a high-signal answer about OpenCode runtime and session semantics that affect long-haul continuity in this repository.

The answer should help us understand what the runtime guarantees, what is only inferred from implementation shape, and what must still be validated empirically before a later refactor plan is written.

## Settled Local Facts

These are already true in the current repository and must not be re-litigated as open work:

- `task_id` continuity is already implemented in the March 6 baseline.
- child-session prompt minimization is already active in the runtime hooks.
- `hivemind_inspect.traverse` v1 already exists and is intentionally tree-first.
- `brain.json` remains the canonical hot session metadata store.
- `hierarchy.json` remains the canonical tree-first navigation surface.
- runtime child linkage remains runtime-only and has not been promoted into a separate persisted registry.
- no fourth state store is acceptable in the proposed direction.
- direct GX-Pack fallback runtime coverage is still pending because the current direct test harness is not stable enough yet.

## Why This Packet Exists

The next long-haul problem is not merely prompt cleanup.

The deeper issue is that reset, init, session creation, session resumption, compaction, delegation, and runtime overlays shape the effective behavior of `.hivemind` and of long-haul continuity.

We need the runtime facts and safe integration patterns before writing the next architecture-grade implementation plan.

## Repo Slices To Inspect

Please inspect these repo surfaces when answering:

- `src/cli/init.ts`
- `src/hooks/event-handler.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `src/lib/runtime-session-lineage.ts`
- `src/lib/session-split.ts`
- `src/lib/compaction-engine.ts`
- `src/hooks/soft-governance.ts`
- `src/tools/hivemind-cycle.ts`
- `src/schemas/brain-state.ts`

If needed, compare those slices with OpenCode runtime behavior and documented integration patterns.

## Questions To Answer

### Q1. Reset, Init, and Bootstrap Semantics

From the perspective of OpenCode-native behavior plus this repo's integration points:

- what does reset actually discard vs preserve
- what does init deterministically seed
- what later gets shaped only by session lifecycle and runtime events
- where the clean boundary should be between bootstrap authority and later runtime overlays

### Q2. Session Creation, Parentage, and Resume

For main sessions, child sessions, and resumed sessions:

- what data is guaranteed to exist at creation time
- what runtime surfaces expose `parentID`, session kind, and resume context
- what hooks rerun on resumed work
- what is stable enough to drive continuity logic without another persisted store

### Q3. Compaction, Replay, and Continuity Safety

We need a precise answer for:

- how compaction interacts with resumed `task_id` work
- how synthetic or transformed context behaves across compaction and replay
- where duplication or drift risks actually arise
- what continuation fields should remain in persisted metadata vs be recomputed per turn

### Q4. Close, Reopen, and Parallel Session Patterns

From OpenCode-native semantics and safe architecture practice:

- how should a long-haul system decide when a session is safe to close
- how should it decide when a session should be reopened instead of creating a new one
- what runtime or continuity signals support parallel same-hierarchy work safely
- what signals should mark a session as dependent and blocked on another session first

### Q5. Minimum Runtime Signals for Orientation

We need to know the cheapest and most reliable runtime signals for:

- orienting a fresh session without flooding it
- distinguishing main vs child context needs
- identifying when downstream agents should ask clarifying questions instead of executing
- preserving long-haul continuity without converting prompt text into authority

### Q6. GX-Pack Fallback Harness Direction

Without changing the March 6 baseline:

- what is the safest way to expose a stable direct test harness for the fallback hook path
- what runtime seams or import seams should exist for that harness
- what should remain fallback-only instead of being promoted into canonical runtime ownership

## Constraints and Forbidden Recommendations

- do not recommend a fourth state store
- do not recommend a separate persisted child-session registry
- do not recommend treating prompt text as the primary continuity authority
- do not recommend replacing the current March 6 authority split
- do not answer with generic agent-framework advice unless it is tied directly to OpenCode runtime behavior or to these repo slices

## Required Answer Format

Please answer in this exact structure:

1. Documented or strongly evidenced OpenCode/runtime behavior
2. Repo-specific implications for the listed files
3. Safe design patterns that fit the locked March 6 baseline
4. Risks or false assumptions to avoid
5. Which questions still require direct empirical validation

## Quality Bar

- separate documented behavior from inference
- distinguish OpenCode-native guarantees from repo-local design choices
- optimize for long-haul continuity and bootstrap correctness
- do not reopen already completed March 6 work
