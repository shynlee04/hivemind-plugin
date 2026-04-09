# Harness Runtime Composition Engine

## What This Is

HiveMind V3 in this worktree is a runtime composition engine for OpenCode. The repository currently contains completed Phase 01 cleanup work and fully re-verified Phase 02 runtime architecture work, with Phase 08 serving as the corrective closure phase that repaired delegated-session durability and unblocked the final verification pass.

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
- [x] **RUN-3h**: Trusted session-level runtime policy overrides now write through live delegation metadata, survive continuity reload, and drive tool-budget enforcement.
- [x] **Phase 02 closure**: Authoritative re-verification completed after Phase 08 corrective closure.

### Active

- [ ] **Phase 08 closure**: Finalize Phase 08 execution summaries/state updates after the corrected verification evidence is recorded.

### Out of Scope

- Broad redesign of delegation behavior beyond the corrective Phase 08 corridor.
- Zombie cleanup and runtime-domain restructure work — excluded from this reconciliation.
- New feature expansion beyond the verified Phase 02 gap closure.

## Context

**Worktree**: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project**: hivemind-plugin (harness-experiment is a worktree for experimentation)

**Authoritative verification artifact**: `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`

**Current verified state**:
- Phase 01 is complete.
- Phase 02 implementation is complete across 9/9 plans.
- Phase 08 repaired the live runtime-policy override seam and durable parent-visible delegated-session status corridor.
- Phase 02 verification is now **18/18** verified in `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md`.
- Fresh bounded tests, full suite, and typecheck all passed during the latest corrective closure run.

**Current state**: Phase 02 is re-verified; later planning work can proceed from the corrected dependency chain once Phase 08 execution metadata is finalized.

## Constraints

- **Compatibility**: Keep continuity as the canonical store; delegation exports remain derived artifacts.
- **Verification boundary**: Treat Phase 08 as a bounded corrective closure phase, not a general delegation redesign.
- **Closure rule**: Later planning work depends on the corrected sequence `Phase 02 baseline → Phase 08 corrective closure → Phase 02 re-verification`.
- **Evidence standard**: Current status must match `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` rather than older audit or validation artifacts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep continuity as canonical state | Delegation packets/manifests must derive from continuity rather than become a second source of truth | Active and verified |
| Runtime policy supplements built-ins | Custom queue/budget controls fill gaps without replacing OpenCode-native session behavior | Verified |
| Background execution uses classified runtime modes | Execution family/submode must be chosen from task characteristics and environment capabilities | Verified |
| Injection remains narrow and route-aware | Specialist guidance should derive from the effective route and active governance state only | Verified |
| Phase 02 closure requires end-to-end runtime-policy override persistence | Manual in-memory test injection is insufficient; live producer + reload path must exist | Satisfied by Phase 08 corrective closure |

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
*Last updated: 2026-04-10 after Phase 08 corrective re-verification*
