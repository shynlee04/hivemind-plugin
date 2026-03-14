# Dashboard-v2 Phase 8 W3.3 TimeTravel Surface Contract

> Date: 2026-02-26
> Wave: `W3.3` (TimeTravel surface contract)
> Status: contract published (docs-only, not implemented)
> Scope lock: `TimeTravelDebuggerView`

---

## 1) Objective

Publish a deterministic contract for `TimeTravelDebuggerView` before implementation so W3.3 can execute with unambiguous timeline semantics, state navigation behavior, and degraded-mode handling.

---

## 2) Surface Scope

In scope:
- Contract for timeline rendering, session/state navigation, snapshot inspection, and bounded diff affordances for `TimeTravelDebuggerView`.
- Contract for how session events and snapshot metadata are consumed and correlated for historical inspection.
- Contract alignment inputs for W3.4 ownership/event map adjudication.

Out of scope:
- Any source-code implementation changes.
- Any W4/W5 resilience or release-readiness execution.
- Any mutation of canonical session state, graph records, or history archives.

---

## 3) Evidence-Backed Current State

Current state is contract-only and implementation remains pending:
- `src/dashboard/views/TimeTravelDebuggerView.tsx:15` declares TODO `[US-046]` for timeline and state-diff viewer.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:140` marks `TimeTravelDebuggerView` as skeleton.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:207` lists `tool.started/completed` event channels available for correlated historical context.
- `docs/plans/dashboard-v2-phase8-w3-execution-packet-2026-02-26.md:107` defines W3.3 as contract-first lane for `TimeTravelDebuggerView`.

Interpretation:
- W3.3 is a docs-first gate. This artifact defines obligations and boundaries only.

---

## 4) Timeline and State Navigation Contract

Timeline contract:
- Timeline index is ordered by descending event time with deterministic tie-break (`event_id`).
- Time slices support bounded scope (`last_15m`, `last_1h`, `last_24h`, `custom_range`) and must resolve to stable cursor windows.
- Selection model is explicit: exactly one active cursor entry plus optional compare target.

State navigation contract:
- Primary navigation path: timeline cursor -> snapshot metadata -> state summary card.
- Optional compare path: active snapshot vs selected comparison snapshot, both within same session boundary by default.
- Cross-session comparison is informational only and must be labeled as non-authoritative until W3.4 ownership map confirms safety.

Navigation invariants:
- Cursor movement must not mutate canonical history.
- Selection survives tab switch round-trip in-session.
- Missing snapshot payload must degrade to metadata-only mode without hard failure.

---

## 5) Event and Snapshot Contract Table

| Channel | Producer | Consumer | Required Fields | Contract Use |
|---------|----------|----------|-----------------|--------------|
| `session.timeline.entry` | Session lifecycle/history source | `TimeTravelDebuggerView` | `event_id`, `session_id`, `action_id`, `event_type`, `timestamp`, `status` | Timeline rows and cursor anchors |
| `state.snapshot.available` | State persistence/snapshot source | `TimeTravelDebuggerView` | `snapshot_id`, `session_id`, `action_id`, `captured_at`, `state_ref`, `summary_hash` | Snapshot availability and selection metadata |
| `state.snapshot.diff` | Diff computation layer | `TimeTravelDebuggerView` | `diff_id`, `snapshot_id_a`, `snapshot_id_b`, `session_id`, `change_count`, `diff_ref` | Bounded diff summary for compare mode |
| `timeline.cursor.changed` | UI interaction layer | `TimeTravelDebuggerView` (internal) | `cursor_id`, `session_id`, `action_id`, `changed_at`, `origin` | Deterministic cursor transition telemetry and replay |

Contract rules:
- Correlation key is `session_id + action_id + event_id|snapshot_id` depending on channel.
- `state_ref` and `diff_ref` are opaque references; view layer must not assume internal schema expansion.
- Invalid payloads are dropped with validation markers while preserving valid row rendering.

---

## 6) Viewport and Panel Behavior Contract

Desktop behavior:
- Show timeline rail, snapshot summary pane, and diff/inspection pane concurrently where viewport allows.
- Preserve selected snapshot context while scrolling timeline.

Constrained viewport behavior:
- Timeline remains primary region; snapshot and diff regions switch via deterministic segmented controls.
- Active cursor indicator remains visible when panes switch.
- Compare mode entry requires explicit user action and never auto-opens on small viewports.

Layout invariants:
- Timeline ordering is stable and repeatable.
- Snapshot detail pane always reflects active cursor selection.
- No ownership overlap with W3.1 or W3.2 surfaces.

---

## 7) Error, Loading, and Degraded State Contract

Loading states:
- Initial timeline load uses explicit loading skeleton and never renders empty-state messaging until first fetch resolves.
- Incremental snapshot metadata fetch shows non-blocking progress indicator.

Error/degraded states:
1. Timeline source unavailable
- Show unavailable banner and last successful refresh timestamp.
- Retain last known timeline window when available.

2. Snapshot reference missing/expired
- Show bounded fallback (`snapshot unavailable`) and keep cursor active for metadata context.

3. Diff compute unavailable
- Keep compare mode open, show degraded notice, and expose retry affordance without resetting selection.

4. Cross-session mismatch
- Mark comparison as informational/degraded and suppress authoritative diff claims.

5. Malformed event payload
- Drop invalid entry, mark validation warning counter, continue rendering valid entries.

---

## 8) Telemetry Hooks Contract

Panel-level telemetry obligations:
- `time_travel.view_loaded` with viewport mode and initial timeline depth.
- `time_travel.cursor_changed` with `session_id`, `action_id`, `event_id`, and navigation origin.
- `time_travel.snapshot_selected` with `snapshot_id` and metadata availability state.
- `time_travel.compare_requested` with compare mode (`in_session|cross_session`) and readiness flag.
- `time_travel.degraded_state` with reason (`timeline_unavailable|snapshot_missing|diff_unavailable|cross_session_mismatch|payload_invalid`).

Telemetry constraints:
- No telemetry event includes raw secret values or full state payload dumps.
- Correlation fields are required for cross-panel traceability (`session_id`, `action_id`, `event_id|snapshot_id`).

---

## 9) Non-Goals

- Implementing `TimeTravelDebuggerView` source code in this lane.
- Finalizing cross-surface producer/consumer ownership adjudication (W3.4 scope).
- Claiming W3 wave closeout in this lane.

---

## 10) Dependencies and Hand-Off

Upstream dependencies:
- W3.1 and W3.2 status vocabulary alignment for timeline/status consistency.
- Session history and snapshot metadata source contracts available.

Downstream dependencies:
- W3.4 consumes this channel/ownership contract for conflict scan and ownership lock.
- W3.5 gate adjudication consumes this checklist plus W3.4 outcomes.

Blocking rule:
- W3.3 implementation lane must not claim closeout until W3.4 confirms ownership/event-map conflict-free adjudication.

---

## 11) Verification Checklist (Docs Gate)

- [x] Objective stated and scoped to W3.3 contract lane.
- [x] Surface scope explicitly lists in/out boundaries.
- [x] Timeline/state navigation contract published with invariants.
- [x] Event/snapshot contract table published with required fields and ownership.
- [x] Viewport behavior contract published for desktop and constrained modes.
- [x] Error/loading/degraded states published with deterministic fallbacks.
- [x] Telemetry hook contract published with constraints.
- [x] Non-goals and dependencies documented.
- [x] No implementation-complete claim present.

Implementation-gate verification (future lane, not executed here):
- `npx tsc --noEmit`
- `npm test`

---

### Mandatory Anti-Subdelegation Footer

`ABSOLUTE BAN: delegated sub-sessions may NOT delegate further. No sub-of-sub delegation allowed. All delegated outputs (including review/research/context prep) must return directly to main orchestrator session.`
