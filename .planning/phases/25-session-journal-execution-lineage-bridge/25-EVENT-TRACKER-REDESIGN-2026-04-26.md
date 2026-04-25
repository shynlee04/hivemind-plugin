# Phase 25 Event-Tracker Redesign Contract — 2026-04-26

## Category

- **Group:** `.planning/phases/25-session-journal-execution-lineage-bridge/`
- **Artifact type:** Redesign / debug contract
- **Debug artifact:** `.planning/debug/phase-25-event-tracker-failure.md`

## Problem Statement

The Phase 25 event tracker must be a bounded context time-machine, not a runtime event/action dump. Current evidence showed `.hivemind/event-tracker/` expanding into hundreds of `ses_*` artifacts for one live workflow lineage, including message-derived roots and 100-row `message.part.delta` artifacts. This violates the expected one-root-pair lineage model.

## Root Cause

1. `src/plugin.ts` sent every OpenCode event to `createEventTrackerArtifactsFromHook()`.
2. `src/lib/event-tracker/writer.ts` mapped every unknown event type to `session_event`.
3. `src/lib/session-api.ts:getEventSessionID()` accepts `properties.info.id` for all event types; for `message.*` events this is a message ID, not a session ID.
4. The persisted schema lacked the needed bounded `toolsUsed` and `delegations` read-model fields.

## Redesign Contract

### A. Root aggregation

- Determine the root tracking key from explicit root/main metadata, parent metadata, known existing root documents, or manual export metadata.
- A real conversation/session lineage produces exactly one root pair: `.hivemind/event-tracker/<rootStem>.json` and `.md`.
- Subsessions are appended as nested entries inside the root artifact.
- Unknown-root non-start events do not create arbitrary per-session artifacts.

### B. Selective observer filters

Record only meaningful lifecycle/delegation/tool-summary/manual-export context events. Ignore message firehose events such as `message.updated`, `message.part.delta`, `message.part.updated`, `session.diff`, and `session.status`.

### C. Selective meta schema

Persist bounded `_schema`, root/session IDs, compact counters/timestamps, actors/roles, nested subsessions, delegations, toolsUsed names/status/summary, bounded lastMessageOutput, TOC, and selected context events only.

Never persist raw hook payloads, full tool outputs, full tool inputs, full transcript turns, or streaming deltas.

### D. Regression test contract

1. Many sub/main/tool/message events for one root create only one root artifact pair.
2. Unknown-root events do not create arbitrary artifacts.
3. Tool outputs are not persisted verbatim.
4. Manual export parse captures actors, subsessions, last output, tool names, and delegation relationships into the root artifact.
5. Cleanup removes generated litter and preserves intended root artifacts.

### E. Cleanup contract

Generated `.hivemind/event-tracker/ses_*.{json,md}` litter may be removed after before/after counts are documented. Do not delete source, planning files, unrelated `.hivemind` state, or non-event-tracker runtime state.

## Selected Design

Use a two-stage pipeline: classify/filter hook events into a narrow `SessionJourneyEvent | null`, then write root-aggregated read-model updates. This directly blocks message-derived fake roots and keeps the persisted artifact a context time-machine instead of an event/action dump.
