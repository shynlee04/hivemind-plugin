# Project State

## Current Position

The March 6 runtime hardening tranche is complete. The active work is now a strategic resynchronization of the framework around three questions:

1. How reset/init and later automatic mechanisms form `.hivemind`.
2. How readable planning and governance SOT should be organized under `.hivemind/project/planning`.
3. How local repo truth and manual external synthesis should combine without contaminating the next long-haul plan.

## Active Blockers

- Direct GX-Pack fallback runtime coverage is still blocked by an unstable direct import/test surface.
- Some framework-aware consumers still assume legacy `.planning/` inputs.
- The readable planning root exists but still has thin population and weak operational contracts.
- Existing external research packet files are mixed prompt-plus-reply evidence and must not be reused as fresh outbound packets.

## Recent Decisions

- Keep the March 6 authority split hard-locked:
  - injection authority = `cognitive-packer`
  - navigation authority = `hierarchy-tree` + `hierarchy.json`
  - session metadata authority = `brain-state` + `brain.json`
- Keep child-session lineage runtime-only for now.
- Treat `.hivemind/project/planning` as the canonical readable planning root.
- Use JSON for deterministic runtime state and markdown for readable planning/governance SOT.
- Use fresh dated manual Devin packets rather than live DeepWiki loops or mixed stale packet reuse.

## Session History

- [2026-03-06] Rebased the implementation baseline after child-session minimization and state-authority rationalization.
- [2026-03-06] Packed a long-haul resync checkpoint and handoff to separate completed runtime work from external synthesis inputs.
- [2026-03-06] Pivoted from immediate runtime continuation to a deeper architectural resync on `.hivemind` composition, planning-root hierarchy, and workflow orchestration.
