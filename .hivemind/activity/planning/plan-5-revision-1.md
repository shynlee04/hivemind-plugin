# Plan #5 (Revision 1): Event Classifier

## Objective
Deliver a bounded revision of Planning #5 that keeps classifier ownership pure while adding an explicit adapter bridge from classifier-produced `EventEntry` records to the current writer-facing `SessionEventWriteInput` shape. Resolve HiveQ conditional blockers by defining delegation-returned evidence payload rules and concrete verification assertions.

## Scope Boundaries
### In Scope
- `src/features/event-tracker/event-classifier.ts` planning contract updates for `delegation_returned` evidence fields and fallback behavior.
- New adapter module planning target: `src/features/event-tracker/adapters/event-entry-to-session-event.ts`.
- New adapter tests planning target: `src/features/event-tracker/adapters/event-entry-to-session-event.test.ts`.
- Classifier tests in `src/features/event-tracker/event-classifier.test.ts` expanded for partial/blocked/complete delegation-returned outcomes with optional evidence present/absent.
- Verification commands and concrete pass/fail assertions for classifier + adapter bridge only.

### Out of Scope
- Any file-write orchestration from classifier logic.
- Changes to writer persistence internals in `src/features/event-tracker/writers/events-writer.ts`.
- Session-level orchestration, retention, diagnostics aggregation, or UI rendering.
- Parser redesign or expansion beyond additive optional classifier input channels.

## File Artifacts
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/features/event-tracker/event-classifier.ts` | Pure classifier logic producing `EventEntry[]`, including revised delegation-returned payload assembly with explicit fallback values | 200-280 |
| `src/features/event-tracker/event-classifier.test.ts` | `node:test` coverage for all supported events plus new delegation-returned partial/blocked/complete evidence branches | 220-300 |
| `src/features/event-tracker/adapters/event-entry-to-session-event.ts` | Pure mapping layer from classifier `EventEntry` to writer-compatible `SessionEventWriteInput` | 120-220 |
| `src/features/event-tracker/adapters/event-entry-to-session-event.test.ts` | Mapping tests proving writer-compatible output shape and fallback handling | 140-240 |

## Dependencies
- `src/features/event-tracker/types.ts` provides `EventEntry`, `EventType`, and event authority.
- `src/features/event-tracker/parser/types.ts` provides `ParsedTurn` and `ParsedDelegation` base shape constraints.
- `src/features/event-tracker/writers/events-writer.ts` provides authoritative writer input contract `SessionEventWriteInput`.
- Test stack must remain `node:test` + `node:assert/strict` with ESM `.js` imports only.

## Implementation Steps
1. Update the planning contract for `event-classifier.ts` to accept an additive, optional classifier evidence input channel for delegation returns (for example, per-turn optional evidence metadata object). Keep the channel optional and internal to classifier inputs; no parser authority replacement.

2. Define `delegation_returned` payload assembly rules in classifier scope:
   - Always include canonical linkage fields when available (`packetId`, delegated target, subagent type).
   - Include optional evidence fields: evidence snapshot, status detail, blocked reason, completion metadata.
   - Apply explicit `N/A` fallback for every unavailable optional evidence field.

3. Add a dedicated adapter module in `src/features/event-tracker/adapters/` with pure mapper functions that translate `EventEntry` into `SessionEventWriteInput` without performing writes.

4. Establish ownership boundary documentation in module-level JSDoc and tests:
   - Classifier owns event classification and structured payload creation only.
   - Adapter owns output projection into writer input shape only.
   - Writer remains sole owner of persistence and markdown append behavior.

5. Expand classifier tests for delegation-returned variants:
   - `partial` case with evidence present and absent.
   - `blocked` case with evidence present and absent.
   - `complete` case with evidence present and absent.
   Each case must assert explicit `N/A` fallback for missing optional fields.

6. Add adapter mapping tests that prove writer-compatible outputs:
   - `sessionId`, `timestamp`, and `type` are always populated.
   - `actor`, `title`, `summary`, and `details` are produced deterministically from `EventEntry.type` and `EventEntry.data`.
   - Delegation-returned mapped output includes status/evidence/blocked/completion information in `details` with `N/A` fallback when missing.

7. Maintain bounded implementation footprint: each touched file must stay at or under 300 LOC.

## Test Requirements
- Classifier tests must include `delegation_returned` for all three outcome variants (`partial`, `blocked`, `complete`) with two evidence states each (present/absent).
- Each delegation-returned test must assert the payload keys for:
  - `evidenceSnapshot`
  - `statusDetail`
  - `blockedReason`
  - `completionMetadata`
  and must assert `N/A` when each optional field is absent.
- Adapter tests must prove one-to-one compatibility with `SessionEventWriteInput` expectations from `writers/events-writer.ts`:
  - Structural compatibility (`sessionId`, `timestamp`, `type` required).
  - Optional projected strings are present or omitted exactly as adapter contract defines.
  - Delegation-returned details formatting contains status/evidence/blocked/completion segments with stable labels.
- Integration-style seam test must verify classifier output can be passed through adapter mapper into a writer-compatible object without shape errors.

## Verification Criteria
- Command: `npx tsx --test src/features/event-tracker/event-classifier.test.ts`
  - Required assertion: test output contains passing cases for `delegation_returned partial`, `delegation_returned blocked`, and `delegation_returned complete` with both evidence states.
- Command: `npx tsx --test src/features/event-tracker/adapters/event-entry-to-session-event.test.ts`
  - Required assertion: all mapper tests pass and include explicit checks for writer-compatible required keys plus delegation-returned fallback behavior.
- Command: `npx tsc --noEmit`
  - Required assertion: no TypeScript errors for classifier types, adapter signatures, and ESM imports.
- Command: `wc -l src/features/event-tracker/event-classifier.ts src/features/event-tracker/event-classifier.test.ts src/features/event-tracker/adapters/event-entry-to-session-event.ts src/features/event-tracker/adapters/event-entry-to-session-event.test.ts`
  - Required assertion: each listed file reports `<= 300` lines.
- Command: `rg "from '\./|from '\.\./" src/features/event-tracker/event-classifier.ts src/features/event-tracker/event-classifier.test.ts src/features/event-tracker/adapters/event-entry-to-session-event.ts src/features/event-tracker/adapters/event-entry-to-session-event.test.ts`
  - Required assertion: every local import specifier ends with `.js`.

## Adapter Contract
- Module: `src/features/event-tracker/adapters/event-entry-to-session-event.ts`
- Exported pure API (planned):
  - `mapEventEntryToSessionEventInput(event: EventEntry): SessionEventWriteInput`
  - `mapEventEntriesToSessionEventInputs(events: EventEntry[]): SessionEventWriteInput[]`
- Input authority: classifier-produced `EventEntry` objects only.
- Output authority: writer-compatible `SessionEventWriteInput` only.
- Non-responsibilities:
  - No filesystem access.
  - No path resolution.
  - No markdown append calls.
- Mapping rules:
  - `sessionId <- event.sessionId`
  - `timestamp <- event.timestamp`
  - `type <- event.type`
  - `actor/title/summary/details` derived deterministically from `event.data` and event type.
  - Missing optional data projected as `N/A` in composed textual fields where required for readability.

## Delegation Returned Evidence Contract
- Applies only to classifier `delegation_returned` event payload in `EventEntry.data`.
- Baseline fields (from parsed delegation when available):
  - `packetId: string | 'N/A'`
  - `delegatedTo: string | 'N/A'`
  - `subagentType: string | 'N/A'`
  - `description: string | 'N/A'`
- Optional evidence fields (new, additive, classifier-side):
  - `evidenceSnapshot: string | 'N/A'`
  - `statusDetail: 'partial' | 'blocked' | 'complete' | 'N/A'`
  - `blockedReason: string | 'N/A'`
  - `completionMetadata: string | 'N/A'`
- Fallback rule:
  - Any missing optional evidence field MUST be set to literal `N/A` before event emission.
  - Tests must assert this fallback across present/absent evidence states for each status variant.
