# Dashboard-v2 Phase 8 W3.2 ToolRegistry Surface Contract

> Date: 2026-02-26
> Wave: `W3.2` (ToolRegistry surface contract)
> Status: contract published (docs-only, not implemented)
> Scope lock: `ToolRegistryView`

---

## 1) Objective

Publish a deterministic contract for `ToolRegistryView` before implementation so W3.2 can proceed without ambiguity on ownership, rendering obligations, and event semantics.

---

## 2) Surface Scope

In scope:
- Contract for tool catalog visibility, schema summary rendering, execution activity strip, and panel-level state transitions for `ToolRegistryView`.
- Contract for how `tool.started` and `tool.completed` events are consumed for operator visibility.
- Contract alignment inputs for W3.3 and W3.4 hand-off.

Out of scope:
- Any source-code implementation changes.
- Any W4/W5 resilience/release-readiness execution.
- Any mutation of canonical tool/session state.

---

## 3) Evidence-Backed Current State

Current state is contract-only and implementation remains pending:
- `src/dashboard/views/ToolRegistryView.tsx:15` declares TODO `[US-047]` for tool catalog and schema viewer.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:141` marks `ToolRegistryView` as skeleton.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:207` lists `tool.started/completed` SSE events that can drive real-time observability state.
- `docs/plans/dashboard-v2-phase8-w3-execution-packet-2026-02-26.md:100` defines W3.2 as contract-first lane for `ToolRegistryView`.

Interpretation:
- W3.2 is a docs-first gate. This artifact defines obligations and boundaries only.

---

## 4) API / Event Contract Table

| Channel | Producer | Consumer | Required Fields | Contract Use |
|---------|----------|----------|-----------------|--------------|
| `tool.catalog.snapshot` | Tool/session layer | `ToolRegistryView` | `tool_id`, `tool_name`, `category`, `availability`, `schema_version` | Baseline searchable catalog and schema summary rows |
| `tool.started` | Tool execution runtime | `ToolRegistryView` | `event_id`, `tool_id`, `run_id`, `session_id`, `action_id`, `started_at`, `status=running` | Start execution strip item; mark tool as active |
| `tool.completed` | Tool execution runtime | `ToolRegistryView` | `event_id`, `tool_id`, `run_id`, `session_id`, `action_id`, `completed_at`, `status`, `duration_ms?`, `error_code?` | Resolve execution strip item with terminal status |
| `tool.schema.metadata` | Registry metadata source | `ToolRegistryView` | `tool_id`, `input_schema_ref`, `output_schema_ref`, `updated_at` | Schema panel details and staleness indicator |

Contract rules:
- `ToolRegistryView` is read-only with respect to canonical tool state.
- Event correlation key is `run_id` plus `session_id` to bind start/completion pairs.
- Unknown/missing optional fields must degrade deterministically, not fail panel rendering.

---

## 5) Panel Layout Contract

Required panel regions:
- Catalog region: searchable list/table keyed by stable `tool_id`.
- Schema summary region: selected-tool metadata and schema references.
- Execution strip region: most-recent execution lifecycle rows (`running|completed|failed|blocked`).
- Health/status region: feed freshness and registry availability indicator.

Layout invariants:
- Stable ordering for catalog rows (default by `tool_name`, then `tool_id`).
- Execution strip sorted by descending event time with deterministic tie-breaker (`run_id`).
- No hidden region-level ownership overlap with W3.1 or W3.3 surfaces.

---

## 6) Tab and Viewport Behavior Contract

Tab behavior:
- `tool-registry` tab activation must preserve active filter/query state in-session.
- Tab switch away/back must retain latest resolved catalog snapshot and last known execution strip state.

Viewport behavior:
- Desktop: show all four regions concurrently where viewport allows.
- Constrained viewport: catalog is primary, schema and execution regions collapse behind deterministic toggles; health/status remains always visible.
- Scroll and focus behavior must keep selected tool context stable across re-renders.

---

## 7) Error and Loading State Contract

Loading states:
- Initial catalog load: show explicit loading state and prevent empty-state misclassification.
- Incremental event updates: show non-blocking activity indicator without resetting selected tool context.

Error/degraded states:
1. Catalog unavailable
- Show unavailable banner with last successful update timestamp.
- Retain last known snapshot if present.

2. Schema metadata missing for selected tool
- Show bounded fallback text (`schema unavailable`) while retaining tool selection.

3. Event feed stale or disconnected
- Mark execution strip as stale, freeze last known state, and expose stale-age indicator.

4. Malformed event payload
- Ignore invalid row with validation marker; panel continues rendering valid rows.

---

## 8) Telemetry Hooks Contract

Panel-level telemetry obligations:
- `tool_registry.view_loaded` with viewport mode and initial data availability.
- `tool_registry.filter_applied` with filter hash and result count.
- `tool_registry.tool_selected` with `tool_id` and schema availability state.
- `tool_registry.event_strip_updated` with `run_id`, `status`, and latency bucket.
- `tool_registry.degraded_state` with reason (`catalog_unavailable|event_stale|schema_missing|payload_invalid`).

Telemetry constraints:
- No telemetry event may include secret payload values.
- Correlation fields must allow cross-panel traceability (`session_id`, `action_id`, `run_id` where applicable).

---

## 9) Non-Goals

- Implementing `ToolRegistryView` source code in this lane.
- Defining final cross-surface producer/consumer adjudication (W3.4 scope).
- Closing W3 wave gates in this lane.

---

## 10) Dependencies and Hand-Off

Upstream dependencies:
- W3.1 state vocabulary alignment for execution statuses and stale/degraded semantics.
- Registry metadata source contract availability (`tool.catalog.snapshot`, `tool.schema.metadata`).

Downstream dependencies:
- W3.3 consumes shared status/event vocabulary for timeline consistency.
- W3.4 consumes ownership boundaries and channel contract for conflict scan.

Blocking rule:
- W3.2 implementation lane must not claim closeout until W3.4 confirms no ownership/event conflict.

---

## 11) Verification Checklist (Docs Gate)

- [x] Objective stated and scoped to W3.2 contract lane.
- [x] Surface scope explicitly lists in/out boundaries.
- [x] API/event contract table published with required fields and ownership.
- [x] Panel layout contract published with stable invariants.
- [x] Tab/viewport behavior published for desktop and constrained viewports.
- [x] Error/loading states published with deterministic fallbacks.
- [x] Telemetry hook contract published with constraints.
- [x] Non-goals and dependencies documented.
- [x] No implementation-complete claim present.

Implementation-gate verification (future lane, not executed here):
- `npx tsc --noEmit`
- `npm test`

---

### Mandatory Anti-Subdelegation Footer

`ABSOLUTE BAN: delegated sub-sessions may NOT delegate further. No sub-of-sub delegation allowed. All delegated outputs (including review/research/context prep) must return directly to main orchestrator session.`
