# Plan #6 Revision 1: Session Writer
## Objective
Define and implement the Session Writer slice for `src/features/event-tracker/` so per-session artifacts are durably written to local disk with append-only semantics, idempotent initialization behavior, and clear integration boundaries with existing writer modules. Session Writer consumes parser/classifier outputs and does not perform classification logic.

## Blocker Resolution (HiveQ Conditional)
- This revision removes path-helper creation from Plan #6 scope.
- Session Writer must explicitly reuse canonical path builders that already exist in `src/features/event-tracker/paths.ts`:
  - `getSessionMetadataPath` for `session.json`
  - `getSessionDelegationPath` for `delegation.md`
  - `getSessionInjectionPath` for `injection.md`
- No new duplicate path helpers are allowed in this plan scope.

## Scope Boundaries
### In Scope
- Session metadata lifecycle for `session.json`: creation on first write and safe update on subsequent writes.
- Append contract for `delegation.md` with deterministic section framing and grep/search-friendly content layout.
- Append contract for `injection.md` with deterministic section framing and grep/search-friendly content layout.
- Session Writer API boundary that composes with existing writer modules.
- Append-only behavior rules and idempotency rules for init/update flows.
- Node test coverage for Session Writer behavior using `node:test` and `node:assert/strict`.

### Out of Scope
- Any parser changes under `src/features/event-tracker/parser/*.ts`.
- Any classifier changes under `src/features/event-tracker/classifier/*.ts`.
- Creation of new path helper functions for session artifacts.
- Refactors to existing event or diagnostics payload schemas not required by Session Writer contract wiring.
- Cross-feature persistence outside `src/features/event-tracker/`.
- Non-local persistence backends (DB, remote storage, API sync).

## File Artifacts
- Modify: `src/features/event-tracker/types.ts`
  - Add Session Writer contract types for `session.json`, delegation entry, and injection entry.
  - Keep interface decomposition and avoid monolithic record types.
  - Estimated delta: <=120 LOC.
- Create: `src/features/event-tracker/writers/session-writer.ts`
  - Implement Session Writer orchestration for init/update and append operations.
  - Reuse canonical path builders from `paths.ts` (`getSessionMetadataPath`, `getSessionDelegationPath`, `getSessionInjectionPath`).
  - Compose with shared/base writer primitives; no classification logic.
  - Estimated size: <=300 LOC.
- Modify: `src/features/event-tracker/writers/base-writer.ts`
  - Add minimal reusable append helper support if required for markdown append contracts.
  - Preserve backward compatibility for existing writers.
  - Estimated delta: <=120 LOC.
- Modify: `src/features/event-tracker/writers/events-writer.ts`
  - Add integration boundary call points for session metadata/delegation flow (if applicable).
  - Keep writer ownership boundaries unchanged.
  - Estimated delta: <=120 LOC.
- Modify: `src/features/event-tracker/writers/diagnostics-writer.ts`
  - Add integration boundary call points for session metadata/injection flow (if applicable).
  - Keep writer ownership boundaries unchanged.
  - Estimated delta: <=120 LOC.
- Create: `tests/features/event-tracker/writers/session-writer.test.ts`
  - Unit tests for initialization, metadata updates, append-only behavior, idempotency, and integration boundaries.
  - Use `node:test` and `node:assert/strict` only.
  - Estimated size: <=300 LOC.
- Modify: `tests/features/event-tracker/writers/events-writer.test.ts` (if present)
  - Add boundary assertions for handoff to Session Writer (no re-testing Session Writer internals).
  - Estimated delta: <=120 LOC.
- Modify: `tests/features/event-tracker/writers/diagnostics-writer.test.ts` (if present)
  - Add boundary assertions for handoff to Session Writer (no re-testing Session Writer internals).
  - Estimated delta: <=120 LOC.

## Dependencies
- Existing contracts and writers:
  - `src/features/event-tracker/types.ts`
  - `src/features/event-tracker/writers/base-writer.ts`
  - `src/features/event-tracker/writers/events-writer.ts`
  - `src/features/event-tracker/writers/diagnostics-writer.ts`
- Canonical path authority (reuse only, no additions):
  - `src/features/event-tracker/paths.ts`
  - `getSessionMetadataPath`
  - `getSessionDelegationPath`
  - `getSessionInjectionPath`
- Tooling/runtime constraints:
  - ESM `.js` imports in source and test files.
  - `node:test` and `node:assert/strict` test framework.
  - Append-oriented local-disk artifacts remain grep/search-friendly.

## Implementation Steps
1. Define Session Writer contracts in `types.ts`.
   - Add explicit types for `session.json` lifecycle state, delegation append entry, and injection append entry.
   - Mark ownership: Session Writer consumes parser/classifier outputs and does not classify.

2. Implement Session Writer module (`session-writer.ts`) using existing path builders.
   - Import and reuse `getSessionMetadataPath`, `getSessionDelegationPath`, and `getSessionInjectionPath` from `paths.ts`.
   - Do not add, shadow, or duplicate helper functions for these artifacts.
   - Implement `session.json` init strategy: create if absent with stable base metadata.
   - Implement `session.json` update strategy: merge/update only approved mutable fields without destructive overwrite.
   - Implement `delegation.md` append contract:
     - Append-only entries with stable delimiter/header format.
     - Preserve existing content exactly; no rewrite of prior blocks.
   - Implement `injection.md` append contract:
     - Append-only entries with stable delimiter/header format.
     - Preserve existing content exactly; no rewrite of prior blocks.
   - Implement idempotency controls where applicable:
     - Repeated init calls do not duplicate baseline metadata.
     - Append operations append exactly one block per explicit write call context.

3. Integrate Session Writer at writer boundaries.
   - Update `events-writer.ts` integration points so session metadata/delegation records are routed to Session Writer.
   - Update `diagnostics-writer.ts` integration points so session metadata/injection records are routed to Session Writer.
   - Keep event/diagnostic writer responsibilities unchanged outside boundary calls.

4. Add and update tests.
   - Add Session Writer focused tests for:
     - `session.json` create/update behavior.
     - append-only `delegation.md` contract.
     - append-only `injection.md` contract.
     - idempotent init behavior.
     - explicit reuse of canonical path builders (no duplicate helper creation in scope).
   - Add boundary tests in event/diagnostic writer suites to verify integration handoff and ownership boundaries.

5. Run verification commands.
   - Run Session Writer test file(s) first.
   - Run related writer tests.
   - Run repo type-check gate.

## Test Requirements
- Framework: `node:test` with assertions from `node:assert/strict`.
- Import style: ESM `.js` import paths.
- Required cases:
  - `session.json` is created when missing with expected metadata scaffold.
  - `session.json` updates mutate allowed fields only and preserve immutable baseline fields.
  - `delegation.md` appends new block(s) without modifying prior content.
  - `injection.md` appends new block(s) without modifying prior content.
  - Re-running initialization is idempotent (no duplicate base state side effects).
  - Existing `events-writer` and `diagnostics-writer` integrations call Session Writer boundaries correctly.
  - Session Writer uses `getSessionMetadataPath`, `getSessionDelegationPath`, and `getSessionInjectionPath` instead of introducing duplicate path helpers.
  - Artifact content remains grep/search-friendly (headers/labels stable and human-readable).
- Gate commands:
  - `npx tsx --test tests/features/event-tracker/writers/session-writer.test.ts`
  - `npx tsx --test tests/features/event-tracker/writers/events-writer.test.ts` (if present)
  - `npx tsx --test tests/features/event-tracker/writers/diagnostics-writer.test.ts` (if present)
  - `npx tsc --noEmit`

## Verification Criteria
- Session Writer exists and is bounded to durable per-session artifact writes only.
- `session.json` has documented and tested init/update strategy with non-destructive updates.
- `delegation.md` and `injection.md` both follow append-only contracts with deterministic block formatting.
- Integration boundaries with `events-writer` and `diagnostics-writer` are explicit, tested, and do not introduce classification logic into writer layer.
- Idempotency behavior is validated for initialization and applicable write paths.
- Canonical path authority is reused via existing helpers (`getSessionMetadataPath`, `getSessionDelegationPath`, `getSessionInjectionPath`) with no duplicate helper creation in Plan #6 scope.
- All added/modified files stay within <=300 LOC targets.
- Required tests and type-check pass with no regressions in the event-tracker writer slice.
