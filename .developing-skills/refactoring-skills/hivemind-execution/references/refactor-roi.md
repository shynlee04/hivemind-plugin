# Refactoring ROI

Decision framework for when to refactor, when to rewrite, and when to leave code alone. Based on cost-of-change analysis and maintenance burden projection.

## Table of Contents

- [ROI Formula](#roi-formula)
- [Cost Factors](#cost-factors)
- [Break-Even Analysis](#break-even-analysis)
- [Decision Framework](#decision-framework)
- [Decision Table](#decision-table)
- [HiveMind-Specific Guidance](#hivemind-specific-guidance)

---

## ROI Formula

```
Refactoring ROI = (maintenance_cost_saved - refactor_cost) / refactor_cost
```

Where:
- **maintenance_cost_saved** = estimated cost of NOT refactoring over the next N months
- **refactor_cost** = estimated cost of performing the refactoring now

| ROI Value | Interpretation |
|-----------|---------------|
| ROI < 0 | Refactoring costs more than it saves — leave alone |
| ROI = 0 | Break-even — marginal benefit, defer unless other factors apply |
| ROI > 0 | Refactoring saves more than it costs — do it |
| ROI > 1.0 | Refactoring pays for itself more than twice — strong candidate |
| ROI > 3.0 | High-value refactoring — prioritize immediately |

---

## Cost Factors

### Refactoring Cost (numerator negative term)

| Factor | Weight | How to Estimate |
|--------|--------|----------------|
| Time to refactor | High | Hours × hourly rate (or opportunity cost) |
| Risk of introducing bugs | High | Probability × severity × test coverage gap |
| Test coverage | Medium | Low coverage = higher risk = higher cost |
| Team knowledge | Medium | Unfamiliar code = higher cost |
| Dependency complexity | Medium | More dependencies = more ripple risk |
| Documentation updates | Low | Docs, comments, ADR updates |

### Maintenance Cost Saved (numerator positive term)

| Factor | Weight | How to Estimate |
|--------|--------|----------------|
| Bug frequency | High | Bugs/month × avg fix time × hourly rate |
| Feature velocity impact | High | Time added per feature × features/month |
| Onboarding cost | Medium | New dev ramp-up time × dev count |
| Cognitive load | Medium | Time spent understanding code per session |
| Deployment risk | Medium | Failed deploys × rollback cost |

---

## Break-Even Analysis

Refactoring breaks even when `maintenance_cost_saved = refactor_cost`.

### Quick Formula

```
break_even_months = refactor_cost / monthly_maintenance_cost
```

If the code will be modified fewer than `break_even_months` times in the next year, refactoring may not pay off.

### Example

```
Refactor cost: 8 hours × $100/hr = $800
Monthly maintenance cost: $150/month (extra debugging, slower features)
Break-even: $800 / $150 = 5.3 months

If this code will be touched ≥6 times in the next year → refactor
If this code will be touched ≤3 times in the next year → leave alone
```

---

## Decision Framework

```
Is the code correct and tested?
├─ NO → Fix the bug first (not a refactoring decision)
└─ YES → Is the code causing measurable pain?
         ├─ NO → Leave alone (YAGNI)
         └─ YES → Calculate ROI
                  ├─ ROI > 1.0 → Refactor now
                  ├─ ROI 0-1.0 → Refactor if test coverage > 60%
                  └─ ROI < 0 → Leave alone, document the debt
```

### Rewrite vs Refactor

```
Is the code fundamentally wrong (wrong abstraction, wrong model)?
├─ NO → Refactor (surgical changes, preserve behavior)
└─ YES → Is the surface area small (<500 LOC)?
         ├─ YES → Rewrite (clean slate, delete old code)
         └─ NO → Incremental refactor (strangler fig pattern)
```

---

## Decision Table

| Condition | Test Coverage | ROI Estimate | Action |
|-----------|--------------|-------------|--------|
| Frequent bugs | Any | >1.0 | Refactor immediately |
| Slow features | >60% | >1.0 | Refactor immediately |
| Slow features | <60% | >1.0 | Add tests first, then refactor |
| Occasional bugs | >60% | 0-1.0 | Refactor opportunistically |
| Occasional bugs | <60% | 0-1.0 | Leave alone, add tests if touching |
| No bugs, no pain | Any | <0 | Leave alone (YAGNI) |
| Wrong abstraction | Any | Any | Rewrite if <500 LOC, strangler fig if larger |
| Constitution violation (>300 LOC) | Any | Any | Refactor — no ROI calculation needed |

---

## HiveMind-Specific Guidance

### Constitution Overrides

The HiveMind constitution mandates ≤300 LOC per module. This overrides ROI calculation — any module exceeding 300 lines must be refactored regardless of ROI.

### When ROI Calculation Applies

ROI calculation applies to:
- Extracting functions from complex logic (>10 cyclomatic complexity)
- Splitting interfaces that exceed 10 fields
- Reducing coupling between modules
- Improving naming for readability

### When ROI Calculation Does NOT Apply

Skip ROI calculation for:
- **Constitution violations** (module >300 LOC) — always refactor
- **Security fixes** — always fix, regardless of cost
- **SDK compliance** (using `tool.schema` instead of raw interfaces) — always fix
- **CQRS violations** (hooks that write) — always fix

### Integration with hivemind-refactor

When the refactoring scope is beyond a single function or module, load `hivemind-refactor` for the full surgical refactoring protocol. This reference provides the decision framework; `hivemind-refactor` provides the execution protocol.

### Tracking Refactoring Debt

Store refactoring debt observations in the activity folder:

```json
{
  "debt_id": "debt-2026-03-28-001",
  "file": "src/tools/legacy/old-tool.ts",
  "issue": "Cyclomatic complexity 15 in execute function",
  "roi_estimate": 0.8,
  "action": "deferred",
  "reason": "Low modification frequency, test coverage 40%"
}
```
