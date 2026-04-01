# Risk-Based Testing

Prioritize test effort based on risk assessment. Not all code deserves equal test coverage.

## Risk Matrix

Risk Score = Likelihood × Impact

|  | Low Impact | Medium Impact | High Impact |
|--|-----------|--------------|-------------|
| **High Likelihood** | Medium (3) | High (6) | Critical (9) |
| **Medium Likelihood** | Low (2) | Medium (4) | High (6) |
| **Low Likelihood** | Low (1) | Low (2) | Medium (3) |

### Scoring

**Likelihood:** How likely is this code to contain bugs?
- High: New code, complex logic, external integrations, recently refactored
- Medium: Existing code with moderate complexity, partial test coverage
- Low: Stable code, simple logic, well-tested previously

**Impact:** What happens if this code fails?
- High: Data loss, security breach, session corruption, user-facing failure
- Medium: Degraded functionality, poor UX, non-critical feature broken
- Low: Cosmetic issue, internal tooling, development-only impact

## Test Allocation Formula

```
test_effort ∝ risk_score

Risk 1-2: Smoke test only (function exists, basic happy path)
Risk 3-4: Standard coverage (equivalence partitioning, key boundaries)
Risk 6-9: Deep coverage (all techniques, edge cases, failure modes)
```

## Decision Table: Risk → Test Depth

| Risk Score | Test Depth | Techniques to Apply |
|-----------|-----------|---------------------|
| 1-2 (Low) | Smoke | Happy path test, one error case |
| 3-4 (Medium) | Standard | Equivalence Partitioning + Boundary Value Analysis |
| 6 (High) | Thorough | + Decision Tables for complex logic |
| 9 (Critical) | Exhaustive | + State Transition + Fuzzing + Failure injection |

## HiveMind Risk Classification

### Critical Risk (Score 9) — Exhaustive Testing

| Area | Why Critical |
|------|-------------|
| `permission.ask` hook | Security boundary — wrong decision = unauthorized access |
| Session compaction | Data loss risk — wrong compaction = lost context |
| Schema validation | Data integrity — wrong schema = corrupted records |
| Trajectory state transitions | Workflow integrity — wrong state = broken workflow |

### High Risk (Score 6) — Thorough Testing

| Area | Why High |
|------|----------|
| Tool arg validation | Input surface — invalid args = runtime errors |
| Hook event handlers | Lifecycle integration — wrong handler = broken plugin |
| Cross-session state | Persistence layer — corruption = unrecoverable |
| SDK API calls | External dependency — wrong call = plugin failure |

### Medium Risk (Score 3-4) — Standard Testing

| Area | Why Medium |
|------|-----------|
| Configuration parsing | Important but recoverable, default fallbacks exist |
| Message formatting | User-visible but non-destructive |
| Logging and telemetry | Observability — wrong logs = poor debugging |

### Low Risk (Score 1-2) — Smoke Testing

| Area | Why Low |
|------|---------|
| Type definitions | Compile-time checked, no runtime risk |
| Constants and enums | Static values, no logic |
| Documentation generation | Non-functional, development-only |
| Test utilities | Meta-code, self-validating |

## Risk Reassessment

Risk levels change. Reassess when:

- Code is refactored → Re-evaluate complexity
- New dependencies added → Re-evaluate integration risk
- Security advisory filed → Escalate affected areas to Critical
- Bug found in area → Increase likelihood score by 1
- Code stabilizes over 30+ days → Decrease likelihood by 1

## Risk-Based TDD Integration

Apply risk scores during RED phase planning:

```
During test planning:
1. Classify each component by risk score
2. Allocate test techniques per the decision table
3. Write tests highest-risk-first
4. Verify that critical areas have multiple technique coverage
```

| Risk | RED Phase Action |
|------|-----------------|
| Critical | Write tests using ALL techniques before any implementation |
| High | Write tests using 2+ techniques before implementation |
| Medium | Write tests using 1-2 techniques before implementation |
| Low | Write smoke test before implementation |

## Risk Register Template

Track risk assessments in phase checkpoint:

```json
{
  "risk_register": [
    {
      "component": "permission-ask-hook",
      "risk_score": 9,
      "likelihood": "high",
      "impact": "high",
      "techniques": ["equivalence-partitioning", "decision-tables", "state-transition", "fuzzing"],
      "test_count": 12,
      "last_assessed": "2026-03-24"
    },
    {
      "component": "config-parser",
      "risk_score": 4,
      "likelihood": "medium",
      "impact": "medium",
      "techniques": ["equivalence-partitioning", "boundary-value-analysis"],
      "test_count": 4,
      "last_assessed": "2026-03-24"
    }
  ]
}
```
