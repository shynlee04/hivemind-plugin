# Phase 2: Unified Runtime Operations - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning
**Source:** User decision + 2026-03-18 research refresh

<domain>
## Phase Boundary

Phase 2 should still deliver a single backend-owned runtime operations seam for status, bootstrap, doctor, harness, workflow inspection, and event inspection. However, the first slice inside this phase must be TUI infrastructure, not richer operator panels. The phase should establish the real app boundary and shared contracts that let a Bun/OpenTUI client consume backend truth without turning the UI into a second source of truth.

This phase does not complete the full operator UI product. It creates the infrastructure and backend seams required so later slices can safely add richer UI behavior and broader feature ownership without reviving the current orphan `src/tui` spike.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- TUI infrastructure comes first in Phase 2.
- The first plan in this phase must be an infrastructure slice (`02-00`) before the existing `02-01`, `02-02`, and `02-03` work.
- Do not add richer TUI panels first; first make the dashboard a real app/runtime boundary.
- Keep the shipped core package on Node/TypeScript.
- Move the OpenTUI surface toward a real Bun/OpenTUI app boundary instead of growing `src/tui` inside the Node package.
- The TUI must consume backend-owned truth through shared contracts; it must not become a second authority surface.
- Shared runtime status/read-model contracts should be established before broader runtime-entry consolidation work in this phase.

### Claude's Discretion
- Exact package/workspace structure for the Bun/OpenTUI app boundary, as long as it is clearly separated from the Node-shipped package surface.
- Exact names and file layout for the shared runtime-status/read-model contract files.
- Exact order of the remaining Phase 2 backend plans after `02-00`, as long as they still satisfy `CTRL-03`, `CTRL-04`, and `INSP-03`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and roadmap authority
- `.planning/PROJECT.md` — brownfield goals, runtime truth constraints, and the requirement that frontend and backend stay bound to one control-plane truth.
- `.planning/REQUIREMENTS.md` — Phase 2 requirements (`CTRL-03`, `CTRL-04`, `INSP-03`) and later TUI requirements that should remain backend-truth consumers.
- `.planning/ROADMAP.md` — current Phase 2 goal and existing plan breakdown that needs the new `02-00` infrastructure slice inserted ahead of execution.
- `.planning/STATE.md` — current project position after Phase 1 completion.
- `.planning/config.json` — workflow defaults and verification expectations.

### Research authority for the TUI-first rebaseline
- `.planning/research/SUMMARY.md` — explicit recommendation to do TUI infrastructure first and keep OpenTUI as a Bun app boundary over backend truth.
- `.planning/research/ARCHITECTURE.md` — modular-monolith and feature ownership guidance for runtime operations.
- `.planning/research/STACK.md` — Node core package plus Bun/OpenTUI app boundary recommendation.
- `.planning/research/PITFALLS.md` — warnings about orphan TUI code, Bun/Node confusion, and fragmented runtime truth.
- `.planning/phases/01-runtime-authority-baseline/01-01-SUMMARY.md` — the managed runtime authority seam already established in Phase 1.
- `.planning/phases/01-runtime-authority-baseline/01-02-SUMMARY.md` — attach-aware routing and narrow live sanity lane already established in Phase 1.

### Existing code seams to plan against
- `package.json` — current Node package exports, bins, scripts, and OpenTUI dev dependencies.
- `src/cli.ts` — current CLI entrypoint with no TUI route.
- `src/tui/index.ts` — current orphan OpenTUI entrypoint.
- `src/tui/client.ts` — current OpenTUI renderer/bootstrap spike.
- `src/tui/Dashboard.tsx` — current mock-heavy dashboard implementation.
- `src/sdk-supervisor/runtime-status.ts` — current backend runtime-status projection seam.
- `src/tools/runtime/tools.ts` — authoritative runtime status tool surface.
- `src/tools/runtime/types.ts` — current runtime status payload typing seam.

</canonical_refs>

<specifics>
## Specific Ideas

- The user explicitly chose the research-backed TUI-first path.
- The immediate next planning target should be `02-00: TUI Infrastructure Foundation`.
- `02-00` should focus on app boundary, Bun execution model, shared runtime-status contracts, backend wiring, and a minimal real runtime-status view.
- `02-00` should avoid pretending the operator UI is finished.
- Remaining Phase 2 plans should continue unifying runtime operations behind one backend-owned seam so the TUI can consume that seam later without special-case logic.

</specifics>

<deferred>
## Deferred Ideas

- Richer dashboard panels and advanced operator workflows.
- Large workflow/trajectory ownership refactors beyond what Phase 2 needs for unified runtime inspection.
- Full completion of `TUI-01`, `TUI-02`, and `TUI-03` as user-facing product requirements if the necessary backend seams are not yet ready.

</deferred>

---

*Phase: 02-unified-runtime-operations*
*Context gathered: 2026-03-18*
