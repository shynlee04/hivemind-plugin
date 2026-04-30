---
research_chain_id: 2026-04-26-phase-25-event-tracker-migration
detect_artifact: current Phase 25 plans plus session-journal/execution-lineage implementation
research_artifact: product-detox event-tracker parser/classifier/writer source and journey-events examples
synthesis_artifact: this file
sources_reviewed:
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/turn-parser.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/header-parser.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/delegation-extractor.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/classifier/event-classifier.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/classifier/event-id.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/classifier/writer-adapter.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/index-writer.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/formatter.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/synthesizer.ts
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2c42.json
  - /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2c42.md
blocked_sources: []
contradictions: resolved
next_action: implement
---

# Phase 25 Migration Research: Event-Tracker-Style Automatic Writer

## Correction Applied

The product-detox paths are a migration source, not the target branch. Phase 25 on `feature/harness-implementation` should not be interpreted as a tool-call-wrapper feature. The corrected target is an automatic parser/writer/meta-writer capability that records selective session journey metadata under `.hivemind/` from runtime events and parseable session artifacts.

## Current Phase 25 Before

Phase 25 already shipped three useful pieces:

1. `src/lib/session-journal.ts` — append-only JSONL journal contract.
2. `src/lib/execution-lineage.ts` — rebuildable projection from continuity and delegations.
3. `src/tools/session-journal-export.ts` — explicit quick-read export tool.

That implementation is valid but incomplete under the corrected interpretation because it requires an explicit tool call and does not automatically write session journey metadata at event/session-start level.

## Product-Detox Findings

Product-detox's event tracker separates the concern into three reusable shapes:

| Source area | Behavior to adapt | What not to copy |
|---|---|---|
| Parser (`splitter`, `header-parser`, `meta-parser`, `turn-parser`, `delegation-extractor`) | Parse markdown session artifacts into bounded header, turn, tool, and delegation metadata. | Product-detox-specific lineage names, single transcript format assumptions, and raw output-heavy markdown. |
| Classifier (`event-classifier`, `event-id`, `writer-adapter`) | Build deterministic event IDs and map parsed/runtime facts into writer-safe event records. | Product-detox event taxonomy as-is; harness should use `session_start`, `session_updated`, `session_idle`, `session_end`, and generic bounded session events. |
| Writers (`markdown-writer`, `formatter`, `index-writer`, `synthesizer`) | Maintain paired JSON and Markdown read models under `.hivemind/sessions/journey-events/` with table-of-contents style summaries. | Full sidecar/session dashboard implementation and any writer that stores raw transcript firehose by default. |

The journey-events examples confirm the desired output shape: a compact JSON session metadata document with counters and a Markdown file with session header plus table of contents. The examples also show why harness output must be bounded: raw tool outputs can become extremely large in Markdown, so harness should write selective event metadata and summaries only.

## OpenCode Plugin API Validation

Context7 `/websites/opencode_ai_plugins` confirms the plugin API supports:

- `event: async ({ event }) => { ... }` for session events such as `session.idle`.
- `tool.execute.before/after` hooks for tool lifecycle callbacks.
- custom tool registration via the `tool` object.

For this migration, the correct automatic seam is the existing plugin `event` observer chain in `src/plugin.ts`, not a new callable tool. The existing export tool may remain as a read surface, but writer authority belongs to a best-effort event observer that writes audit projections only.

## Migration Decision

Implement a small harness-native migration slice:

1. Add a parser module for markdown session artifacts: `src/lib/session-artifact-parser.ts`.
2. Add a journey event writer/classifier module: `src/lib/session-journey-events.ts`.
3. Wire a best-effort `sessionJourneyEventObserver` in `src/plugin.ts` so OpenCode session events automatically write `.hivemind/sessions/journey-events/{sessionId}.json` and `.md`.
4. Export parser/writer modules from `src/index.ts`.
5. Keep existing `session-journal-export` as a read-only quick-read surface; do not expand Phase 25 into a tool-call wrapper feature.

## Guardrails

- `.hivemind/` remains the state root; no new `.opencode/state` writes.
- Automatic writes are audit projections and must never block canonical event handling.
- Markdown output must not render raw hook payloads or raw transcript/tool firehose.
- Parser must produce bounded metadata and delegation evidence; full replay/time-machine remains deferred.
