# Recovery Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/recovery/` owns session recovery on plugin init and state repair. Phase 66 deliverables: `failure-classes.ts` (REC-01 — `FAILURE_CLASSES`, `classifyFailure()`), `assess-state.ts` (REC-02 — `RecoveryAssessment`, `RecoveryAction`, `assessRecoveryState()`), `create-checkpoint.ts` (REC-03 — `RecoveryCheckpoint`, `createRecoveryCheckpoint()`), and `repair-state.ts` (REC-04 — `RepairOptions`, `RepairResult`, `repairRecoveryState()`). The barrel `index.ts` re-exports all recovery surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- Recovery may classify failures (`FAILURE_CLASSES` lookup) and assess recovery severity/action. Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- May create recovery checkpoints as named `RecoveryCheckpoint` structures with evidence refs.
- May repair recovery state through `repairRecoveryState()` with bounded `RepairOptions` and `RepairResult`.
- May reconstruct session state from durable continuity files at startup.

## 3. Forbidden mutations / explicit no-go boundaries

- Recovery SHALL NOT dispatch or spawn sessions; that is `src/coordination/`'s role. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Recovery SHALL NOT mutate continuity records directly — it assesses and repairs, but persistence flows through `continuity/`.
- Recovery SHALL NOT register tools or hooks; `src/plugin.ts` owns registration.
- Recovery SHALL NOT store state in `.opencode/`; `.hivemind/` is canonical. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/lifecycle/` | Assesses recovery state before lifecycle transitions | Lifecycle owns state machine; recovery diagnoses |
| `src/task-management/continuity/` | Provides durable state for recovery reconstruction | Continuity owns storage; recovery repairs |
| `src/plugin.ts` | Triggers recovery on harness init (`recoverPending()`) | Composition root initiates; recovery executes |
| Tests | Validate failure classification, assessment, checkpoint, repair | Must test each Phase 66 deliverable |

## 5. Naming and placement conventions

- `index.ts` — barrel re-exports: `FailureClass`, `FAILURE_CLASSES`, `classifyFailure`, `RecoveryAssessment`, `RecoveryAction`, `RecoverySeverity`, `assessRecoveryState`, `RecoveryCheckpoint`, `createRecoveryCheckpoint`, `RepairOptions`, `RepairResult`, `RepairSource`, `RepairStatus`, `repairRecoveryState`.
- Phase 66 deliverables: REC-01 through REC-04, each in dedicated file.
- Tests mirror under `tests/lib/task-management/recovery/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/recovery/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Recovery logic must verify all failure classes and repair outcomes with state reconstruction evidence.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
