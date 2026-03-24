# Plan #6: Session Writer
## Objective
Define and implement the Session Writer slice for `src/features/event-tracker/` so per-session artifacts are durably written to local disk with append-only semantics, idempotent initialization behavior, and clear integration boundaries with existing writer modules. Session Writer consumes parser/classifier outputs and does not perform classification logic.

## Scope Boundaries
### In Scope
- Session metadata lifecycle for `session.json`: creation on first write and safe update on subsequent writes.
- Append contract for `delegation.md` with deterministic section framing and grep/search-friendly content layout.
- Append contract for `injection.md` with deterministic section framing and grep/search-friendly content layout.
- Session Writer API boundary that composes with existing `writers/events-writer.ts` and `writers/diagnostics-writer.ts`.
- Append-only behavior rules and idempotency rules for init/update flows.
- Node test coverage for Session Writer behavior using `node:test` and `node:assert/strict`.

### Out of Scope
- Any parser changes under `src/features/event-tracker/parser/*.ts`.
- Any classifier changes under `src/features/event-tracker/classifier/*.ts`.
- Refactors to existing event or diagnostics payload schemas not required by Session Writer contract wiring.
- Cross-feature persistence outside `src/features/event-tracker/`.
- Non-local persistence backends (DB, remote storage, API sync).

## File Artifacts
- Modify: `src/features/event-tracker/types.ts`
  - Add Session Writer contract types for `session.json`, delegation entry, and injection entry.
  - Keep interface decomposition and avoid monolithic record types.
  - Estimated delta: <=120 LOC.
- Modify: `src/features/event-tracker/paths.ts`
  - Add canonical path resolvers for `session.json`, `delegation.md`, `injection.md`.
  - Ensure path helpers remain single-source authority for artifact paths.
  - Estimated delta: <=80 LOC.
- Create: `src/features/event-tracker/writers/session-writer.ts`
  - Implement Session Writer orchestration for init/update and append operations.
  - Compose with shared/base writer primitives; no classification logic.
  - Estimated size: <=300 LOC.
- Modify: `src/features/event-tracker/writers/base-writer.ts`
  - Add minimal reusable append helper support if required for markdown append contracts.
  - Preserve backward compatibility for existing writers.
  - Estimated delta: <=120 LOC.
- Modify: `src/features/event-tracker/writers/events-writer.ts`
  - Add integration boundary call points for session metadata and delegation append flow (if applicable).
  - No payload classification added here.
  - Estimated delta: <=120 LOC.
- Modify: `src/features/event-tracker/writers/diagnostics-writer.ts`
  - Add integration boundary call points for session metadata and injection append flow (if applicable).
  - No payload classification added here.
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
- Existing:
  - `src/features/event-tracker/types.ts`
  - `src/features/event-tracker/paths.ts`
  - `src/features/event-tracker/writers/base-writer.ts`
  - `src/features/event-tracker/writers/events-writer.ts`
  - `src/features/event-tracker/writers/diagnostics-writer.ts`
  - Completed parser/classifier outputs consumed as input only.
- Tooling/runtime constraints:
  - ESM `.js` imports in source and test files.
  - `node:test` and `node:assert/strict` test framework.
  - Append-oriented local-disk artifacts must remain grep/search-friendly.

## Implementation Steps
1. Define Session Writer contracts in `types.ts`.
   - Add explicit types for `session.json` lifecycle state, delegation append entry, and injection append entry.
   - Mark ownership: Session Writer consumes parser/classifier outputs, does not classify.

2. Extend canonical path helpers in `paths.ts`.
   - Add path functions for `session.json`, `delegation.md`, and `injection.md` under the per-session artifact directory.
   - Keep path decisions centralized and reusable across all writers.

3. Implement Session Writer module (`session-writer.ts`).
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
     - Append operations only append the current event block once per explicit write call context.

4. Integrate Session Writer at writer boundaries.
   - Update `events-writer.ts` integration points so session metadata/delegation records are routed to Session Writer.
   - Update `diagnostics-writer.ts` integration points so session metadata/injection records are routed to Session Writer.
   - Keep event/diagnostic writer responsibilities unchanged outside boundary calls.

5. Add and update tests.
   - Add Session Writer focused tests for:
     - `session.json` create/update behavior.
     - append-only `delegation.md` contract.
     - append-only `injection.md` contract.
     - idempotent init behavior.
   - Add boundary tests in event/diagnostic writer suites to verify integration handoff and ownership boundaries.

6. Run verification commands.
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
- All added/modified files stay within <=300 LOC targets.
- Required tests and type-check pass with no regressions in the event-tracker writer slice.
