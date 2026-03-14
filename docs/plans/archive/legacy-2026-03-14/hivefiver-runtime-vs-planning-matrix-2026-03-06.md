# Hivefiver Runtime Vs Planning Matrix

Date: 2026-03-06
Status: active-matrix
Type: runtime-planning-separation

## Purpose

Make the shared mismatch boundary explicit so later lane plans stop overstating what is already true in code.

## Matrix

| Area | Current Runtime Truth | Current Planning Target | Required Discipline |
|---|---|---|---|
| Lane taxonomy | Runtime routes by action families in `src/lib/hivefiver-integration.ts` | Planning uses a reconciled five-lane model | Map, do not relabel runtime as already five-lane |
| Persona routing | Persona selection is heuristic keyword-based | Awareness adaptation should become more stage-aware and stronger | Keep current runtime described as heuristic |
| Workflow selection | Runtime selects one of the existing workflow YAML files by persona | Later plans may enrich awareness behavior and disclosure depth | Treat enriched model as future-facing until implemented |
| Topology handling | No explicit `topology` field exists in current runtime routing | Singular, paired, stacked, and chained remain accepted planning dimensions | Do not claim topology routing is already landed |
| Delegation topology | Plugin enforcement blocks out-of-topology delegation | Planning wants clearer lineage and bridge rules | Use plugin enforcement as truth; mark broader bridge rules as planning policy |
| Scope boundaries | Plugin scope boundaries are strict and path-based | Planning wants cleaner narrative alignment with lineage docs | Do not use older profile wording to override enforcement |
| Framework conflict | Tool gate warns/advises on unresolved conflict | Planning wants stronger cross-lane diagnosis-first discipline | Keep wording explicit: advisory runtime, stronger planning target |
| Validation gates | Gatekeeper validates focus, failure-ack, pending tools, files touched, drift, long session | Later lanes need a common validation constitution | Build later lane gates on top of current checks, not instead of them |
| Continuity precedence | Canonical planning root is preferred in code, legacy `.planning/` remains fallback | Planning wants one stable resume hierarchy | Treat fallback as compatibility, not equal authority |

## Accepted Planning-Only Items

These remain accepted planning dimensions, but not yet runtime truth:

- five-lane operating model as the direct runtime taxonomy
- explicit package topology routing field
- richer diagnosis-first hard-block model across all lanes
- fully aligned lineage narrative between profile docs and runtime enforcement

## Must-Stay-Landed Truth

- March 6 authority split
- advisory-only persisted-write posture in `tool-gate`
- plugin-level delegation and scope enforcement
- heuristic persona routing
- canonical planning-root preference with legacy fallback

## Use In Later Lanes

Every later lane-local plan must include:

1. one section for landed runtime truth
2. one section for planning-target guidance
3. one section for promotion conditions if the plan wants runtime and planning to converge later
