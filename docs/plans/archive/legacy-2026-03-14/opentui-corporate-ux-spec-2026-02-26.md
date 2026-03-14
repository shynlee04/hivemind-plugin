# OpenTUI Corporate UX Specification (Phase 7)

Date: 2026-02-26
Scope: `src/dashboard-v2` sidecar UX for HiveMind governance, pipeline observability, hierarchy tracing, and code-intel visibility.

## Product Intent
- Deliver a keyboard-first, read-mostly terminal sidecar that surfaces live operational context without mutating runtime state.
- Replace placeholder telemetry with artifact-backed panels from `.hivemind/state/*`, `.hivemind/graph/*`, and code-intel stores.
- Keep governance-safe boundaries: operators observe and decide in sidecar; mutations remain explicit in `hivemind_*` tools.

## Information Architecture (Tabs)
- `Overview`: Session identity, mode, governance status, drift, turn count, and freshness timestamp.
- `Pipeline`: Task status distribution, active trajectory-task bindings, delegation lane/persona/action context.
- `Hierarchy`: Real tree rendering from `state/hierarchy.json` with cursor indication.
- `Incidents`: Operational risk signals (evidence pressure, flagged keywords, degradation indicators).
- `Code-Intel`: Summary source, token/file metrics, indexed entity count, and discovered `src/lib/code-intel` modules.
- `Governance`: Checklist checks (including mems presence), anchors, memory shelf distribution, recent messages.
- `Settings`: Sidecar boundaries, supported keyboard controls, and explicit read-only contract.

## Prototype Phased Roadmap
- `P0 Foundation`: OpenTUI shell, tab navigation, periodic refresh loop, fallback-safe file reading.
- `P1 Core Integrations`: Wire overview/pipeline/hierarchy/governance tabs to real `.hivemind` artifacts.
- `P2 Incident + Code-Intel Surfaces`: Add operational alert synthesis and deeper code-intel module surface.
- `P3 Hardening`: Add parser/unit tests for dashboard snapshot helpers and bounded degradation behavior.
- `P4 Operator UX Enhancements`: Add focus shortcuts, compact/full density modes, and richer filtering (non-mutating).

## User Journeys
### Developer Journey
- Open dashboard sidecar while implementing a feature.
- Check `Pipeline` for active task linkage and delegation lane drift.
- Inspect `Hierarchy` to confirm trajectory/tactic/action continuity.
- Validate `Code-Intel` freshness before using precision tooling.

### Operator Journey
- Use `Overview` + `Incidents` for session health triage.
- Validate governance checklist in `Governance` (mems presence, anchors, drift, pending changes).
- Use `Settings` to confirm sidecar limits and avoid accidental state mutations.

## KPIs / Success Metrics
- Orientation speed: p90 time-to-first-signal <= 30s from dashboard start.
- Pipeline clarity: active task linkage visible in <= 2 keypresses.
- Incident triage: MTTA improvement target >= 25% vs current text-only workflow.
- Governance safety: 0 dashboard-initiated state mutations in normal operation.
- Reliability: panel load fallback success >= 99% when one or more artifact files are missing.

## Edge Cases and Drift Mitigations
- Missing files (`memory/mems.json`, code-intel summary): show explicit fail/warn checks and fallback rows.
- Stale/partial JSON: parse defensively and continue rendering unaffected tabs.
- Empty hierarchy/task state: show deterministic empty states, never blank panels.
- High evidence pressure / keyword flags: promote to `Incidents` with severity level.
- Long messages/anchors: truncate safely to keep terminal layout stable.

## Governance and Action Boundaries
- Dashboard-v2 is sidecar-only, read-mostly, and does not invoke write/mutation tools.
- Any execution action stays in explicit `hivemind_*` tool invocations.
- Keyboard-first controls remain mandatory (`Tab`, `Shift+Tab`, `j/k`, `1-7`, `r`, `q`).
