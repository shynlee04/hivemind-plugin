# Phase 25: Session Journal + Execution Lineage Bridge - Context

**Gathered:** 2026-04-25 (auto mode)
**Status:** Ready for execution after Phase 31 reconciliation

## Phase 31 Impact Reconciliation (2026-04-26)

Phase 31 refreshed core planning documents with locked Q1-Q6 validation decisions. Phase 25 is directly impacted by Q3 and Q6:

- **Q3 Session Journal:** Phase 25 must explicitly implement the Session Journal as an append-only event timeline that is independent of `continuity.ts`. It may consume continuity/delegation records as inputs for projections, but journal append/export must not mutate canonical runtime status.
- **Q3 Time-machine boundary:** Phase 25 seeds time-machine compatibility by making journal JSONL replayable/exportable and lineage rebuildable. A full historical replay engine remains outside this phase unless a later phase explicitly scopes it.
- **Q6 State Root:** Phase 25 writes its starter journal/lineage taxonomy under `.hivemind/`, the internal deep module state root. `.opencode/` remains only a compatibility input for legacy runtime state and OpenCode primitives; Phase 25 must not add new internal runtime state beneath `.opencode/`.
- **Q4 Memory categories:** Phase 25 contributes to MVP memory categories for episodic/session, workflow, delegation evidence, human-readable journal, and architecture-decision evidence through narrow journal/lineage read models only.

<domain>
## Phase Boundary

Build the first `.hivemind/`-aligned journal and execution-lineage bridge for the harness. This phase creates an append-only audit/projection layer that records session turns, execution lineage, delegation-relevant events, and resumable context without replacing existing runtime truth in current continuity/delegation stores.

In scope: the journal contract, execution-lineage projection contract, initial `.hivemind/` journal/lineage taxonomy categories, JSON + Markdown read/export surfaces, and guarded integration points that consume current continuity/delegation state as input.

Out of scope: full delegation manifest implementation, notification mediation replacement, full `.opencode/state` writer cutover, task/trajectory graph authority, agent-work-contract enforcement, sidecar/GUI implementation, vector memory, graph query stack, and wholesale product-detox code migration.

</domain>

<decisions>
## Implementation Decisions

### Architecture Position
- **D-01:** Phase 25 implements `Session Journal + Execution Lineage Bridge` as the first real implementation win after Phase 16.4.
- **D-02:** The bridge is audit/projection-first. It must not become a second runtime authority, terminal status writer, or replacement for continuity/delegation persistence.
- **D-03:** Current continuity/delegation persistence remains the implementation input and compatibility source during this phase; legacy `.opencode/state/opencode-harness/` may still be read through existing compatibility functions.
- **D-04:** `.hivemind/` is introduced as the structured internal state root for journal/lineage starter categories in this phase, not as a full continuity/delegation writer cutover.
- **D-04a:** No new internal runtime state may be introduced under `.opencode/`; `.opencode/` remains reserved for OpenCode primitives and legacy compatibility reads per Q6.

### Journal Contract
- **D-05:** Journal entries must support JSON + Markdown-compatible output shapes.
- **D-06:** Each journal entry must encode at minimum: session ID, turn ID or turn boundary, parent/child session relationship when available, actor, event type, timestamp, source, summary, and a marker for `canonical runtime state`, `audit trail`, or `derived projection`.
- **D-07:** Journal append semantics must be explicit, bounded, idempotency-aware, append-only, and documented by owner surface. Hooks may append projections only when platform contracts and recovery behavior make that safe.
- **D-07a:** Journal records must be replay/export friendly so a future time-machine module can reconstruct derived state from entries without treating the journal as terminal runtime authority.

### Execution Lineage Projection
- **D-08:** Execution lineage must represent plan/task/delegation relationships as rebuildable lineage, not as competing status truth.
- **D-09:** Lineage records may include optional `pipelineKey` for future grouping, but Phase 25 must not introduce a task/trajectory graph as workflow authority.
- **D-10:** Delegation evidence should be read from existing delegation records/status surfaces and journaled as audit/projection entries rather than rewritten as a new canonical manifest.

### Read Surface and Agent Consumption
- **D-11:** The phase must provide quick-read JSON + Markdown summaries for front-facing agents, future resume agents, and future sidecar/read-model views.
- **D-12:** Read surfaces must distinguish human-readable journal summaries from machine-readable lineage data so downstream agents can consume concise context without raw system-reminder firehose.
- **D-13:** Future sidecar compatibility is limited to read/query/render/request boundaries; this phase must not build GUI/runtime authority behavior.

### Migration and Product-Detox Boundaries
- **D-14:** Product-detox concepts may inform schemas/contracts only; no product-detox code is copied as-is.
- **D-15:** Candidate concepts relevant to Phase 25 are `event-tracker`, `session-journal`, `trajectory`, `runtime-entry`, and `session-entry`, but they must pass concept extraction and ownership gates before implementation.
- **D-16:** Every `.hivemind/` category introduced by this phase must declare owner, role, schema/index expectation, retention/rebuild behavior, and canonical-vs-projection marker.

### the agent's Discretion
- Planners may decide exact module/file names, provided they preserve the owner boundaries and keep new source under the hard harness (`src/`) rather than soft meta-concept directories.
- Planners may decide exact Markdown summary formatting, provided JSON remains the contract-bearing representation and Markdown is derived/read-oriented.
- Planners may decide whether journal append/export is implemented as a library-first module with a tool surface, hook integration, or both, as long as writes are bounded and do not replace current runtime state.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 25 source of truth
- `.planning/ROADMAP.md` — Phase 25 exists and depends on Phase 24; roadmap goal text is intentionally sparse and must be expanded from Phase 16.4 handoff artifacts.
- `.planning/STATE.md` — Current stopped-at marker identifies the next real work as `Session Journal + Execution Lineage Bridge`.

### Phase 16.4 locked upstream decisions
- `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/16.4-RESULT-TO-REAL-WORK-2026-04-25.md` — Defines Phase 25 goal, minimum real-work scope, guarded integration, and explicit deferrals.
- `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/16.4-FIRST-BIG-WIN-SCORECARD.md` — Selects session journal + execution lineage bridge as first-big-win and explains why other candidates remain deferred.
- `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/16.4-ARCHITECTURE-BASELINE.md` — Defines mutation authority, state ownership, runtime classification, lifecycle ownership, Hiveminder/Hivefiver boundaries, memory taxonomy, and sidecar boundaries.
- `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/16.4-MIGRATION-CONTROL-PLANE.md` — Defines `.opencode/state` → `.hivemind` transition rules and product-detox concept gates.
- `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/16.4-DECISION-REGISTER.md` — Defines reusable/stale/rejected architecture claims and replacement rules.

### Project and architecture baseline
- `.planning/PROJECT.md` — Current project purpose, constraints, and key decisions: continuity remains canonical state and docs must not outrank verified runtime truth.
- `.planning/REQUIREMENTS.md` — Existing runtime/delegation requirements, especially continuity, delegation chain persistence, and tool/plugin integration constraints.
- `.planning/codebase/ARCHITECTURE.md` — Current runtime composition architecture, delegation flow, event routing, and state management overview.
- `.planning/codebase/STRUCTURE.md` — Current source tree and where new hard-harness modules, tools, hooks, and tests belong.
- `.planning/codebase/CONVENTIONS.md` — Naming, error handling, strict TypeScript, import, JSDoc/TSDoc, and module design conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/continuity.ts` — Current canonical continuity store input for Phase 25; provides session continuity records, metadata patching, pending notifications, governance persistence, atomic writes, and current storage path resolution.
- `src/lib/delegation-persistence.ts` — Current delegation record persistence helper; Phase 25 lineage should consume these records as input rather than replacing them.
- `src/lib/types.ts` — Existing continuity, delegation, notification, lifecycle, and persistence types; journal/lineage types should align with these contracts and avoid `any`.
- `src/lib/delegation-manager.ts` — Owns delegation dispatch, terminal transitions, recovery, persistence, queue keys, nesting depth, and terminal notifications. Phase 25 must not duplicate terminal authority.
- `src/lib/notification-handler.ts` — Active pending notification and terminal notification behavior; journal/lineage may record notification-relevant events but must not silently replace delivery behavior.
- `src/tools/delegation-status.ts` — Existing read/status surface for delegation records; useful model for JSON tool-response envelopes and agent-readable status summaries.

### Established Patterns
- Plugin composition remains thin in `src/plugin.ts`; new behavior should live in library modules, hook/tool factories, or focused subsystems, not in the composition root.
- Persistence currently uses durable JSON with atomic temp-file rename and compatibility normalization (`src/lib/continuity.ts`, `src/lib/delegation-persistence.ts`). Journal writes should follow the same safety posture.
- Event integration already routes OpenCode events through core/session hooks and explicit observers (`src/plugin.ts`, `src/hooks/create-core-hooks.ts`, `src/hooks/create-session-hooks.ts`). Journal append integration should be bounded and idempotent if implemented through hooks.
- Delegation completion uses owner-routed terminal transitions in `DelegationManager.transitionToTerminal()` and handler callbacks from `src/lib/sdk-delegation.ts` and `src/lib/command-delegation.ts`. Lineage projection must read/derive from these events, not own them.
- Tool outputs use structured JSON envelopes via `src/shared/tool-response.ts` and `src/shared/tool-helpers.ts`; Phase 25 read/export surfaces should preserve this agent-friendly pattern.

### Integration Points
- `src/plugin.ts` — Potential registration point only after the journal/lineage library and any hook/tool factory boundaries are designed.
- `src/hooks/create-core-hooks.ts` — Existing event hook surface and pending-notification replay path; possible bounded journal append source for session events.
- `src/hooks/create-session-hooks.ts` — Existing session idle and compaction context surface; possible source for turn/session snapshots or quick-read context, but not terminal authority.
- `src/lib/continuity.ts` / `src/lib/delegation-persistence.ts` — Source data for read models and projections.
- `src/tools/` — Location for any explicit read/export tool if planners decide Phase 25 needs a callable surface.

</code_context>

<specifics>
## Specific Ideas

- Use Phase 16.4's wording: journal/lineage entries must help future agents see which lineage/workflow produced evidence without flattening Hiveminder and Hivefiver modules.
- The bridge should reduce raw system-reminder firehose by producing mediated quick-read summaries.
- The bridge should be reversible: projections can be discarded and rebuilt from current continuity/delegation records plus append-only journal entries.
- The first `.hivemind/` taxonomy slice should be narrow: journal and lineage only.

</specifics>

<deferred>
## Deferred Ideas

- Full delegation manifest and notification mediation implementation — deferred until journal/lineage decisions and state ownership are stable.
- Full `.opencode/state` writer cutover to `.hivemind/` — deferred to a later explicit migration/writer authority gate.
- Task/trajectory graph as workflow authority — deferred because it risks competing with GSD/planning truth.
- Agent-work-contract schema/runtime enforcement — deferred until journal entries and delegation evidence define minimum contract fields.
- GUI/Hivefive sidecar — deferred until stable read models exist.
- Vector memory and graph query stack — deferred as optional future retrieval layers, never sole truth.

</deferred>

---

*Phase: 25-session-journal-execution-lineage-bridge*
*Context gathered: 2026-04-25*
