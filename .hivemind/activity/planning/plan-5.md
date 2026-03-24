# Plan #5: Event Classifier

## Objective
Build a pure event-classification module that converts parsed session turns and tool/delegation evidence into `EventEntry` records using the current event authority in `src/features/event-tracker/types.ts`. Keep the cycle bounded to classification only: no file I/O, no session writer integration, and no schema expansion outside the existing `EventEntry` shape.

## Scope Boundaries
### In Scope
- Create `src/features/event-tracker/event-classifier.ts` as a pure-function classifier layer.
- Use the existing parser outputs (`ParsedSession`, `ParsedTurn`, `ParsedDelegation`) plus current `EventEntry` / `EventType` definitions.
- Classify confirmed event categories supported by the current codebase: `user_message`, `assistant_output`, `tool_invocation`, `delegation_created`, `delegation_returned`, and `compaction`.
- Generate stable event IDs and populate `EventEntry.data` with classification-specific payload details.
- Add focused `node:test` coverage for normal turns, compaction turns, delegation dispatch/return patterns, and event ordering.

### Out of Scope
- Writing events to disk or touching `writers/` and `paths.ts`.
- Changing `src/features/event-tracker/types.ts` unless tests prove a hard mismatch with the already-shipped contract.
- Parsing raw markdown directly; the classifier consumes already-parsed values or explicit payload objects.
- Session lifecycle events not present in the current authority surface (`session_start`, `session_end`, `injection`, `error`).
- Cross-session aggregation, retention policy, diagnostics logging, or timeline rendering.

## File Artifacts
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/features/event-tracker/event-classifier.ts` | Pure classifiers, event builders, ID generation helpers, and a small orchestration entry point for turn-level event emission | 180-240 |
| `src/features/event-tracker/event-classifier.test.ts` | Unit and small integration-style tests for all supported event classifications and ordering guarantees | 180-240 |

## Dependencies
- `src/features/event-tracker/types.ts` - source of truth for `EventEntry`, `EventType`, and `Importance`.
- `src/features/event-tracker/parser/types.ts` - parsed turn/session inputs the classifier should accept.
- `src/features/event-tracker/parser/turn-parser.ts` - upstream producer used by tests to prove classifier compatibility with real parsed shapes.
- `src/features/event-tracker/parser/meta-parser.ts` and `src/features/event-tracker/parser/delegation-extractor.ts` - behavioral context for compaction and delegation patterns already recognized upstream.
- `node:test` and `node:assert/strict` - only allowed test framework.

## Implementation Steps
1. Define the classifier surface in `src/features/event-tracker/event-classifier.ts` around the existing type authority, with one small exported entry point that accepts `sessionId`, parsed turn context, and optional tool/delegation payload evidence. Keep every helper pure and local, and do not import any legacy task/start-work types.

2. Write RED tests in `src/features/event-tracker/event-classifier.test.ts` for the six supported event categories, using parser-shaped fixtures that mirror the observed `## User`, `## Assistant (...)`, `**Tool: ...**`, and compaction structures. Include at least one case that proves delegation dispatch maps to `delegation_created` and one case that proves a returned/completed delegation maps to `delegation_returned`.

3. Implement focused helper classifiers matching the architect packet: `classifyUserMessage`, `classifyAssistantOutput`, `classifyToolInvocation`, `classifyDelegationCreated`, `classifyDelegationReturned`, and `classifyCompaction`. Each helper should either return a complete `EventEntry` or `null`, so the top-level builder can filter absent events without branching complexity.

4. Add deterministic event ID generation and event ordering rules inside the classifier module. IDs should encode enough local context to stay stable within a session/turn sequence, and emitted events should preserve the natural flow: user message first, assistant output/tool/delegation events next, compaction only for compaction turns.

5. Keep `EventEntry.data` minimal but useful, storing only classification-specific facts already available from parsed inputs such as agent name, model, tool name, delegation target, packet ID, duration, and compaction markers. Choose `importance` deterministically per event type and document the mapping in test names so future changes stay explicit.

6. Finish with a small orchestration test that parses a representative session snippet through `parseSession()` and then classifies one or more returned turns, proving the new module works with the existing parser seam without adding I/O or mutating parser output. Keep the whole cycle bounded to this module and its tests.

## Test Requirements
| Test Scenario | Expected Behavior |
|---------------|-------------------|
| User turn with non-empty `userMessage` | Emits one `user_message` event with session ID, turn number, stable ID, and message text in `data` |
| Non-compaction assistant turn with content | Emits one `assistant_output` event with agent/model/duration details and no compaction event |
| Tool evidence for a non-task tool block | Emits one `tool_invocation` event with tool name and summarized payload metadata |
| Delegation dispatch evidence (`task` tool invocation) | Emits `delegation_created` with delegated agent, subagent type, description, and packet/task identifier when present |
| Delegation return/completion evidence | Emits `delegation_returned` with outcome/status details and preserves linkage back to the originating delegation context |
| Compaction assistant turn | Emits `compaction` and suppresses normal `assistant_output` for that turn |
| Turn with multiple applicable signals | Returns events in deterministic order and with unique IDs |
| Parsed session integration fixture | Classifier accepts real `parseSession()` output shapes without extra adaptation layers |
| Empty or incomplete inputs | Returns an empty list or skips unsupported events without throwing |

## Verification Criteria
- `npx tsx --test src/features/event-tracker/event-classifier.test.ts` passes with all classifier scenarios green.
- `npx tsc --noEmit` passes after adding the classifier module and tests.
- Manual check: `src/features/event-tracker/event-classifier.ts` and `src/features/event-tracker/event-classifier.test.ts` each remain at or under 300 LOC.
- Manual check: all imports use ESM `.js` suffixes and no file imports legacy types such as `start-work-types.ts`.
- Manual check: emitted objects conform to the existing `EventEntry` fields from `src/features/event-tracker/types.ts` and do not introduce ad hoc shape drift.
