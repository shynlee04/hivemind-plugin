# Cross-Skill Routing — Detailed Reference

Extracted from SKILL.md for progressive disclosure. Contains triad flow, evidence collection handoff, and remediation routing details.

---

## Evidence Collection Handoff: hm-production-readiness

`hm-production-readiness` is the primary evidence COLLECTOR that feeds this gate. Production readiness verification produces structured L1-L5 evidence reports that this gate CONSUMES:

```
hm-production-readiness (COLLECTS evidence)
    ↓ produces evidence report
gate-evidence-truth (CONSUMES evidence)
    ↓ classifies → evaluates → renders PASS/FAIL
```

**Handoff contract:**

| From hm-production-readiness | To gate-evidence-truth |
|------------------------------|------------------------|
| Evidence report with L1-L5 classified artifacts | Consumes via STEP 1: GATHER — the evidence report IS an artifact |
| Gate-specific minimum checks (deployment = L1, merge = L2, etc.) | Validates via STEP 3: CHECK MINIMUM |
| Changelog completeness, migration validation, rollback plans, monitoring setup, smoke test results, backward compatibility | Maps to appropriate evidence levels, runs mock detection, checks completion honesty |
| Verdict: PASS/FAIL per dimension | Combined with anti-pattern scan and regression check for final verdict |

**When evidence comes from production-readiness vs. direct collection:**
- If `hm-production-readiness` has already run → consume its evidence report directly, skip redundant collection
- If `hm-production-readiness` has NOT run → this gate must still collect evidence directly (STEPS 1-2) but will have less structured evidence
- Prefer routing through `hm-production-readiness` for deployment gates (it produces the most structured evidence)

---

## Remediation Routing (on FAIL)

When this gate renders FAIL, route to the appropriate skill based on the failure type:

| Failure Type | Root Cause | Route To | Expected Action |
|-------------|------------|----------|-----------------|
| **Missing evidence** | No L3+ evidence exists for the gate type; evidence was never collected | `hm-production-readiness` | Collect L1-L5 evidence across all dimensions using the production readiness protocol |
| **Mock-only evidence** | Tests claim integration but mock all external boundaries; deception detected | `hm-cross-cutting-change` | Red-first rework with mock honesty enforcement — replace mocked boundaries with real integration tests |
| **Insufficient evidence level** | Evidence exists but at too low a level (e.g., L4-only for deployment gate requiring L1) | `hm-debug` | Investigate why higher-level evidence cannot be produced — is there an infrastructure gap? Is the feature not testable in a real environment? |
| **Anti-pattern detected** | Documentation-only claims, LLM-as-judge, one-sided evaluations | Return to implementor with anti-pattern report | Fix the specific anti-pattern (e.g., add error-path tests, replace LLM review with runtime verification) |
| **Regression risk** | Cross-phase dependency changes without regression tests | `hm-coordinating-loop` | Orchestrate re-dispatch to add regression tests for affected modules |

**Remediation flow:**

```
gate-evidence-truth FAIL
    ↓
Identify failure type from verdict report
    ↓
Route to appropriate remediation skill (above table)
    ↓
Fix → re-collect evidence → re-run this gate
    ↓
PASS → proceed to merge/release
```

---

## Triad Backward References

| Gate | Position | Relationship to this gate | Verified by |
|------|----------|--------------------------|-------------|
| `gate-lifecycle-integration` | Entry (upstream of spec) | Verifies CQRS boundaries, actor hierarchy, classification fit, and harness module integration before spec compliance runs. Lifecycle correctness is the precondition for meaningful spec verification. This gate must have passed before either sibling runs. | Check `templates/evidence-report.md` Gate Triad Status table |
| `gate-spec-compliance` | Middle (direct upstream) | Verifies bidirectional traceability (SPEC → code, code → SPEC), EARS acceptance criteria, and gap detection. Routes to this gate on PASS. This gate receives from lifecycle, routes to evidence. | Check `templates/evidence-report.md` Gate Triad Status table |
| `gate-evidence-truth` | Terminal (this gate) | Receives only after BOTH lifecycle and spec compliance have passed. If this gate PASSES, all three gates are satisfied and work may proceed. | Self |
