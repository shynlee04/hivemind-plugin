# Phase 25: Session Journal + Execution Lineage Bridge - Research

**Researched:** 2026-04-25
**Status:** Ready for planning

## Research Question

What does the executor need to know to plan Phase 25 well while honoring the Phase 25 locked decisions and Phase 16.4 architecture baseline?

## Standard Stack

- TypeScript strict mode with NodeNext ESM imports and explicit `.js` extensions.
- Vitest for unit/tool verification.
- Existing durable state inputs remain `src/lib/continuity.ts` and `src/lib/delegation-persistence.ts`.
- Tool responses use `src/shared/tool-response.ts` plus `src/shared/tool-helpers.ts`.

## Architecture Patterns

1. **Audit/projection-first state bridge** — existing continuity/delegation stores remain canonical runtime inputs. `.hivemind/` receives journal/lineage audit/projection categories only, and `.opencode/` is not used for new internal runtime state per Q6.
2. **Library-first implementation** — contracts and pure builders belong in `src/lib/`; plugin assembly remains thin.
3. **Explicit read/export surface** — agent-facing output should be callable through a focused tool that returns JSON envelopes and supports Markdown summaries as derived output.
4. **Rebuildable lineage** — lineage is rebuilt from continuity/delegation records and journal entries; it must never write delegation terminal status.

## Do Not Hand Roll / Do Not Copy

- Do not copy product-detox source code. Extract only schema ideas from `event-tracker`, `session-journal`, `trajectory`, `runtime-entry`, and `session-entry` concepts per D-14/D-15.
- Do not introduce a task/trajectory graph as workflow authority.
- Do not replace or redirect canonical continuity/delegation writers.
- Do not move business logic into `src/plugin.ts`.

## Common Pitfalls

- Treating journal or lineage output as canonical runtime status violates D-02, D-03, D-08, D-10, and Q3.
- Building Markdown-only summaries violates D-05 and D-11; JSON must carry the contract.
- Writing `.hivemind/` categories without owner/schema/index/retention/rebuild metadata violates D-16.
- Writing new internal runtime state under `.opencode/` violates Q6; use `.hivemind/` for Phase 25 journal/lineage categories and only read legacy stores through existing compatibility APIs.
- Implementing a full time-machine replay engine in Phase 25 would exceed scope; this phase must provide replay/export-friendly records and rebuildable lineage only.
- Adding hook writes without idempotency/duplicate-event behavior violates D-07 and Phase 16.4 mutation authority.

## Recommended Implementation Shape

1. `src/lib/session-journal.ts`
   - Defines journal entry marker union: `canonical runtime state`, `audit trail`, `derived projection`.
   - Defines journal entry fields from D-06.
   - Provides deterministic ID/idempotency helpers, JSON serialization, Markdown rendering, and bounded append-only semantics with replay/export-friendly fields.
2. `.hivemind/journal/README.md` and `.hivemind/lineage/README.md`
   - Declare owner, role, schema/index expectation, retention/rebuild behavior, and canonical-vs-projection marker.
3. `src/lib/execution-lineage.ts`
   - Reads `SessionContinuityRecord[]` and `Delegation[]` inputs.
   - Produces plan/task/delegation relationship records with optional `pipelineKey` and source evidence links.
4. `src/tools/session-journal-export.ts`
   - Returns JSON and Markdown summaries through `ToolResponse` envelope.
   - Separates human-readable summary from machine-readable lineage data.
5. `src/plugin.ts` and `src/index.ts`
   - Register the tool and public exports only after library/tool contracts exist.

## Validation Architecture

| Dimension | Required Verification |
|---|---|
| Contract completeness | `tests/lib/session-journal.test.ts` verifies all D-06 fields, marker values, JSON shape, Markdown rendering, idempotency key behavior, and taxonomy metadata. |
| Lineage correctness | `tests/lib/execution-lineage.test.ts` verifies parent/child session links, delegation evidence, optional `pipelineKey`, and rebuildability from supplied inputs. |
| Tool/read surface | `tests/tools/session-journal-export.test.ts` verifies JSON and Markdown outputs, error envelopes, and no canonical writer replacement. |
| Integration | `npm run typecheck` verifies strict TypeScript, import type usage, and plugin/index exports. |

## Architectural Responsibility Map

| Responsibility | Owner Tier | Files |
|---|---|---|
| Journal contract and append semantics | Library | `src/lib/session-journal.ts` |
| Execution lineage projection | Library | `src/lib/execution-lineage.ts` |
| Agent-facing read/export surface | Tool | `src/tools/session-journal-export.ts` |
| Plugin registration | Composition root only | `src/plugin.ts` |
| Public package exports | Barrel only | `src/index.ts` |
| Taxonomy declaration | State category docs | `.hivemind/journal/README.md`, `.hivemind/lineage/README.md` |

## Source Coverage

- Covers GOAL from Phase 16.4 handoff: build the session journal + execution lineage bridge.
- Covers CONTEXT D-01 through D-16.
- Roadmap requirements are `TBD`; plans use `ROADMAP-25` plus context decision IDs for traceability.
- Excludes all deferred ideas listed in Phase 25 CONTEXT.md.
