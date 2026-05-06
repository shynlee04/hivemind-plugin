---
status: investigating
trigger: "Fix current TypeScript compile blocker: unused CANONICAL_STATE_DIR/LEGACY_STATE_DIR and missing DEFAULT_STATE_DIR in src/lib/continuity.ts after Q6 state-root migration."
created: 2026-04-26T00:00:00Z
updated: 2026-04-26T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

reasoning_checkpoint:
  hypothesis: "The original continuity.ts compile blocker was caused by a partial Q6 migration that renamed DEFAULT_STATE_DIR into canonical/legacy constants but left stale references in one edit state; the current working tree already contains the intended continuity fix."
  confirming_evidence:
    - "git diff shows src/lib/continuity.ts changed from DEFAULT_STATE_DIR=.opencode/state/opencode-harness to CANONICAL_STATE_DIR=.hivemind/state plus LEGACY_STATE_DIR=.opencode/state/opencode-harness."
    - "resolveContinuityFilePath now returns explicit file, explicit state dir, existing canonical file, existing legacy file, then canonical file for new writes."
    - "npm run typecheck now passes after the transient lifecycle-manager.ts missing-phase state was no longer present in the file."
  falsification_test: "npm run build or relevant tests would still report the original unused constants or missing DEFAULT_STATE_DIR errors."
  fix_rationale: "Commit only the continuity.ts Q6 path-resolution change already present in the working tree; it makes .hivemind/state the default write root while keeping legacy read compatibility."
  blind_spots: "There are many unrelated dirty files in the worktree; staging must be path-specific to avoid including unrelated work."
next_action: Return handoff with root cause, committed fix 0aaf79d7, and fresh verification output.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: npm run typecheck && npm run build should pass on branch feature/harness-implementation.
actual: TypeScript compilation fails in src/lib/continuity.ts due to unused constants and missing DEFAULT_STATE_DIR.
errors: |
  src/lib/continuity.ts(17,7): error TS6133: 'CANONICAL_STATE_DIR' is declared but its value is never read.
  src/lib/continuity.ts(18,7): error TS6133: 'LEGACY_STATE_DIR' is declared but its value is never read.
  src/lib/continuity.ts(34,67): error TS2304: Cannot find name 'DEFAULT_STATE_DIR'.
reproduction: Run npm run typecheck && npm run build.
started: After prior Q6 state-root migration edit.

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-26T00:00:00Z
  checked: src/lib/continuity.ts lines 16-52 and 409-419
  found: CANONICAL_STATE_DIR and LEGACY_STATE_DIR are used by resolveContinuityFilePath and exported via getCanonicalStateDir/getLegacyStateDir; no DEFAULT_STATE_DIR reference appears in the read source.
  implication: The reported compile errors may come from stale source state or a partially applied edit that is not present in the current working tree; run typecheck to get current evidence.

- timestamp: 2026-04-26T00:00:00Z
  checked: src/lib/delegation-persistence.ts lines 23-28
  found: Delegation persistence derives its directory from getContinuityStoragePath(), so it follows the same canonical/legacy continuity path resolution.
  implication: A continuity path fix also governs delegation persistence path behavior; no separate default path constant exists there.

- timestamp: 2026-04-26T00:00:00Z
  checked: npm run typecheck
  found: Reported continuity.ts errors did not reproduce; current compiler error is src/lib/lifecycle-manager.ts(104,7) missing required property phase in SessionLifecycleState.
  implication: Current working tree has advanced past the reported continuity blocker, but repository typecheck remains blocked by a nearby lifecycle typing issue.

- timestamp: 2026-04-26T00:00:00Z
  checked: src/lib/types.ts lines 241-248 and src/lib/lifecycle-manager.ts lines 101-106
  found: SessionLifecycleState requires phase, while noteObservedActivity passes lifecycle: { observation: ... } to patchSessionContinuity.
  implication: Current compile blocker root cause is a complete-vs-partial lifecycle patch mismatch.

- timestamp: 2026-04-26T00:00:00Z
  checked: src/lib/lifecycle-manager.ts lines 60-99 after failed patch context
  found: Latest file contents show noteObservedActivity as a no-op stub, and cancelDelegatedSession includes phase: "failed" in lifecycle.
  implication: The lifecycle missing-phase error may have been from transient/uncommitted content; rerun typecheck before changing source.

- timestamp: 2026-04-26T00:00:00Z
  checked: npm run typecheck rerun
  found: TypeScript typecheck passed with no errors.
  implication: Current source compiles at typecheck stage; proceed to build and relevant tests.

- timestamp: 2026-04-26T00:00:00Z
  checked: npm run build
  found: Build completed successfully with tsc emit after clean.
  implication: The compile blocker is cleared for production build.

- timestamp: 2026-04-26T00:00:00Z
  checked: npx vitest run tests/lib/delegation-manager.test.ts tests/plugins/plugin-lifecycle.test.ts
  found: 2 test files passed; 102 tests passed.
  implication: Delegation/continuity-adjacent persistence behavior remains covered after the Q6 state-root path fix.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Partial Q6 state-root migration in continuity persistence left the intended canonical/legacy state path change uncommitted; the corrected implementation must default new writes to .hivemind/state while preserving legacy .opencode/state/opencode-harness read compatibility.
fix: Use CANONICAL_STATE_DIR=.hivemind/state as the default continuity store root, use LEGACY_STATE_DIR only when an existing legacy continuity file is present, and expose both directories for state-root verification.
verification: Fresh post-commit verification passed: npm run typecheck; npm run build; npx vitest run tests/lib/delegation-manager.test.ts tests/plugins/plugin-lifecycle.test.ts (2 files, 102 tests). Fix committed as 0aaf79d7. A later lifecycle commit 01566710 is now HEAD and also included in the same fresh verification run.
files_changed: [src/lib/continuity.ts]
