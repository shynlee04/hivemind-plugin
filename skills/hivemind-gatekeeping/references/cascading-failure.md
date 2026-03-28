# Cascading Failure Recovery

## Purpose

Detect and recover from cascading failure patterns where multiple parallel slices or iterations fail simultaneously.

## Cascading Failure Detection

### Definition

Cascading failure: >50% of parallel slices fail, OR the same failure type appears across 3+ iterations.

### Detection Rules

| Pattern | Threshold | Action |
|---------|-----------|--------|
| Parallel slice failure rate | >50% | Stop all, reassess decomposition |
| Same failure type across iterations | 3+ iterations | Stop loop, re-plan approach |
| Shared root cause across failures | Any 2+ failures with same root | Re-plan decomposition |

## Recovery Procedures

### >50% Parallel Failure

1. Stop all remaining slices immediately
2. Collect failure reports from all slices
3. Categorize failures by type
4. Identify shared root cause (if any)
5. Re-plan decomposition before re-delegating
6. If no shared cause, re-delegate failed slices individually with tighter constraints

### Multi-Iteration Failure Pattern

1. Stop the loop — `status: "blocked"`
2. Compare failure types across iterations
3. If failures are diverse → individual iterations are the problem → re-delegate with guidance
4. If failures are similar → the loop structure is wrong → escalate to orchestrator for re-planning

### Shared Root Cause Detection

When multiple failures share a root cause:
- All failures reference the same file/component
- All failures involve the same interface/contract
- All failures stem from the same missing dependency

If shared root cause found:
- Re-plan at the root cause level — do not re-delegate symptom slices
- Fix the root cause first, then re-delegate dependent slices

## Re-Planning vs Re-Delegation

| Condition | Action |
|-----------|--------|
| Same slice fails twice with different errors | Re-delegate with tighter constraints |
| Same slice fails twice with same error | Re-plan — slice boundary is wrong |
| >50% parallel failure | Re-plan — decomposition is wrong |
| Iteration produces contradictions | Re-plan — loop structure is wrong |

## Escalation

If re-planning fails or the root cause is unclear:
1. Escalate to user with full failure evidence
2. Include: failure reports, attempted re-delegation, root cause analysis
3. Await user decision before proceeding
