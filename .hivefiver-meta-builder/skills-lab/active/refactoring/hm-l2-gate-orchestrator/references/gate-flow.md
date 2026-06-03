# Gate Flow Diagram

## Overview

This reference documents the complete gate flow pipeline with decision points for the quality gate triad orchestrated by `hm-gate-orchestrator`.

## Gate Pipeline

```
INPUT: Target artifacts + Gate context
  │
  ▼
┌─────────────────────────────────────┐
│  GATE 1: gate-lifecycle-integration │
│  9-surface mutation authority        │
│  CQRS boundaries                     │
│  Actor hierarchy                     │
│  Event-driven wiring                │
│  Classification fit                 │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┐
     │  PASS?    │
     └─────┬─────┘
       No  │  Yes
       ┌───┘   └──────────┐
       ▼                   ▼
  ┌─────────┐    ┌─────────────────────────────┐
  │  HALT   │    │  GATE 2: gate-spec-compliance │
  │  Report │    │  Bidirectional traceability    │
  └─────────┘    │  Gap detection (4 types)       │
                 │  EARS acceptance criteria       │
                 └──────────┬──────────────────────┘
                            │
                      ┌─────┴─────┐
                      │  PASS?    │
                      └─────┬─────┘
                        No  │  Yes
                        ┌───┘   └──────────┐
                        ▼                   ▼
                   ┌─────────┐    ┌──────────────────────────────┐
                   │  HALT   │    │  GATE 3: gate-evidence-truth   │
                   │  Report │    │  L1-L5 evidence hierarchy       │
                   └─────────┘    │  Mock detection                 │
                                  │  Runtime proof verification     │
                                  └──────────┬───────────────────────┘
                                             │
                                       ┌─────┴─────┐
                                       │  PASS?    │
                                       └─────┬─────┘
                                         No  │  Yes
                                         ┌───┘   └──────┐
                                         ▼               ▼
                                    ┌─────────┐    ┌──────────┐
                                    │  HALT   │    │  UNIFIED  │
                                    │  Report │    │  PASS ✅  │
                                    └─────────┘    └──────────┘
```

## Decision Points

### DP-1: Gate 1 Failure

- **Condition:** Lifecycle integration check fails
- **Action:** HALT. Produce remediation report.
- **Common failures:** Wrong file classification, missing CQRS boundary, unauthorized surface mutation

### DP-2: Gate 2 Failure

- **Condition:** Spec compliance check fails
- **Action:** HALT. Produce gap report with gap type classification.
- **Common failures:** Missing traceability (spec→code), untestable acceptance criteria, spec drift from implementation

### DP-3: Gate 3 Failure

- **Condition:** Evidence truth check fails
- **Action:** HALT. Produce evidence gap report.
- **Common failures:** L4/L5 evidence only (documentation summaries), mocked integration tests, no runtime proof

## Gate Context Types

| Context | Gate Emphasis | Typical Artifacts |
|---------|--------------|-------------------|
| code-review | Gate 1 + 2 focus on changed files | PR diff, changed files, PLAN.md |
| phase-audit | All 3 gates on phase output | Phase directory, SUMMARY.md, implementation files |
| milestone-verification | All 3 gates on milestone artifacts | ROADMAP.md, REQUIREMENTS.md, phase summaries |
| deployment-readiness | Gate 3 emphasis on L1 runtime proof | Test results, staging logs, deployment manifests |

## Resume Protocol

If a gate run was interrupted or a failed gate was fixed:

1. Re-run the full pipeline from Gate 1 (not just the failed gate)
2. Prior results are informational only — they do not satisfy the ordering requirement
3. Document the re-run reason in the verdict report
