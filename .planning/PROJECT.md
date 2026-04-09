# Harness Runtime Composition Engine

## What This Is

HiveMind V3 in this worktree is a runtime composition engine for OpenCode. The repository currently contains completed Phase 01 cleanup work and implemented Phase 02 runtime architecture work, with Phase 02 standing at **17/18 verified truths** and one remaining runtime-policy override gap before full closure.

## Core Value

Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.

## Requirements

### Validated

- [x] **RUN-3a**: Background execution mode is classified in the live delegation entrypoint and owned-process work runs through the hardened background manager.
- [x] **RUN-3b**: Delegation lineage and execution metadata persist canonically in continuity and can be exported for audit/recovery.
- [x] **RUN-3c**: Queue acquisition resolves live per-key concurrency policy before acquire.
- [x] **RUN-3d**: Recovery and compaction checkpoint behavior remain verified after Phase 02 re-verification.
- [x] **RUN-3e**: Governance persistence, active blocking, and invocation-scoped metadata are live.
- [x] **RUN-3f**: Session-start and compaction injections are route-aware, conditional, and auditable.
- [x] **RUN-3g**: Specialist routing remains advisory and records rationale with safe fallback behavior.

### Active

- [ ] **RUN-3h gap**: Populate `runtimePolicyOverride` in live delegation metadata when trusted session override inputs exist.
- [ ] **RUN-3h gap**: Preserve `runtimePolicyOverride` through continuity normalization and hydration.
- [ ] **RUN-3h gap**: Add an end-to-end regression covering write → persist → reload → tool-guard enforcement for session overrides.
- [ ] **Phase 02 closure**: Re-run verification after the runtime-policy override seam is made real end-to-end.

### Out of Scope

- `src/**` and `tests/**` implementation changes — this reconciliation pass is documentation-only.
- Zombie cleanup and runtime-domain restructure work — excluded from this reconciliation.
- New feature expansion beyond the verified Phase 02 gap closure.

## Context

**Worktree**: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project**: hivemind-plugin (harness-experiment is a worktree for experimentation)

**Authoritative verification artifact**: `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`

**Current verified state**:
- Phase 01 is complete.
- Phase 02 implementation is complete across 9/9 plans.
- Phase 02 verification is **17/18** with one remaining `RUN-3h` runtime-policy override gap.
- Fresh bounded tests, full suite, typecheck, and build all passed during the latest Phase 02 verification run.

**Current state**: hold next-phase planning until the runtime-policy override seam is written, persisted, and re-verified.

## Constraints

- **Compatibility**: Keep continuity as the canonical store; delegation exports remain derived artifacts.
- **Verification boundary**: Reconcile planning docs only; do not treat excluded zombie cleanup or restructure work as part of current Phase 02 status.
- **Closure rule**: Do not mark Phase 02 complete until the `runtimePolicyOverride` producer/persistence seam is verified end-to-end.
- **Evidence standard**: Current status must match `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` rather than older audit or validation artifacts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep continuity as canonical state | Delegation packets/manifests must derive from continuity rather than become a second source of truth | Active and verified |
| Runtime policy supplements built-ins | Custom queue/budget controls fill gaps without replacing OpenCode-native session behavior | Verified except for session-specific override seam |
| Background execution uses classified runtime modes | Execution family/submode must be chosen from task characteristics and environment capabilities | Verified |
| Injection remains narrow and route-aware | Specialist guidance should derive from the effective route and active governance state only | Verified |
| Phase 02 closure requires end-to-end runtime-policy override persistence | Manual in-memory test injection is insufficient; live producer + reload path must exist | Open |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after Phase 02 verification reconciliation*
