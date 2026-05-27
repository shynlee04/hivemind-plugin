---
description: "Quality Gate Triad workflow: Lifecycle Integration → Spec Compliance → Evidence Truth. Routes through hm-nyquist-auditor and triad gate skills."
---

# hm-gate

## Goal
Enforce standard L3 quality gate triad (lifecycle, spec, evidence) before phase completion or shipping.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Triad Orchestration | hm-nyquist-auditor | Sequences the gates, evaluates results, runs checks |

## Execution Phases
1. **Lifecycle Integration Gate**:
   - Check file locations, CQRS boundaries, and SDK signatures.
   - Run `gate-l3-lifecycle-integration` checks.
   - If FAIL, stop and report.
2. **Spec Compliance Gate**:
   - Check trace mapping, gaps (stubs/TODOs), and EARS criteria.
   - Run `gate-l3-spec-compliance` checks.
   - If FAIL, stop and report.
3. **Evidence Truth Gate**:
   - Verify test suite runs, confirm evidence level, detect mocks/stubs.
   - Run `gate-l3-evidence-truth` checks.
   - If FAIL, stop and report.
4. **Compile Report**: Output all results to `GATE-REPORT.md`.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Choose whether to override non-blocking warnings |
| `human-verify` | Review gate check report |

## Exit Criteria
- Triad quality gates (lifecycle, spec compliance, evidence truth) all resolve to `passed`.
- `GATE-REPORT.md` written containing proof.
