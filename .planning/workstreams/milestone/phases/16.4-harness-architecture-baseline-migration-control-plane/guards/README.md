# Phase 16.4 Guard Manifest

These guards validate architecture-control artifacts for Phase 16.4. They are intentionally narrow: they report whether required files, headings, evidence markers, and locked vocabulary exist. They do not decide architecture policy and do not mutate runtime state.

| Guard | Classification | Purpose | Input | Output | Failure Behavior | SPEC Requirement | Decision Trace |
|---|---|---|---|---|---|---|---|
| `architecture-facts.mjs` | fact-reporting | Validate Phase 16.4 architecture artifacts contain locked fields and evidence markers | `16.4-DECISION-REGISTER.md`; `16.4-ARCHITECTURE-BASELINE.md`; `16.4-MIGRATION-CONTROL-PLANE.md`; `16.4-FIRST-BIG-WIN-SCORECARD.md`; `16.4-VALIDATION.md` | JSON summary to stdout | exit 1 with missing checks; no runtime state mutation | P16.4-14 | D-01, D-04, D-05 |

## Supported Checks

- `--check-guard-manifest`
- `--check-register`
- `--check-mutation-authority`
- `--check-state-taxonomy`
- `--check-lifecycle-owners`
- `--check-move-map`
- `--check-platform-evidence`
- `--check-migration-gates`
- `--check-first-big-win`
- `--check-source-coverage`

## Runtime State Safety

The guard reads only Phase 16.4 planning artifacts and selected repository source/documentation paths. It must never write files, update `.opencode/state`, or mutate `.hivemind` runtime state. Missing fields produce a non-zero exit so the executor can revise the relevant artifact before claiming the phase is ready for verification.
