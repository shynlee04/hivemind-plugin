# Hivemind Session Journal Category

## Owner

`src/lib/session-journal.ts`

## Role

append-only human/agent audit trail under `.hivemind/`; `.opencode/` is not used for new internal runtime state.

## Schema

SessionJournalEntry JSONL plus derived Markdown.

## Index

sessionId, turnId, parentSessionId, childSessionId, eventType, timestamp.

## Retention

append-only until explicit archive gate.

## Rebuild

not terminal runtime status; can be replayed/exported from JSONL for future time-machine reconstruction.

## Marker

audit trail
