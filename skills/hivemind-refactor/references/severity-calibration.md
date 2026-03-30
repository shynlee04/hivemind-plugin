# Severity Calibration

Scoring framework for code review findings. Calibrate before reporting to ensure consistent, fair assessment across reviewers and dimensions.

## Why Calibrate

Without calibration:
- Security reviewers call everything P0
- Performance reviewers call everything "critical optimization"
- Style issues get inflated to block merge
- Real blockers get lost in noise

Calibration ensures severity reflects actual impact, not reviewer enthusiasm.

## Severity Levels

### P0 — Critical

**Definition:** Must fix before merge. No exceptions. No overrides without written justification from tech lead.

| Category | Examples | Why Critical |
|----------|---------|-------------|
| Security vulnerability | SQL injection, XSS, auth bypass, exposed secrets | Exploitable in production |
| Data loss | Unprotected destructive operation, missing rollback, corrupt writes | Data cannot be recovered |
| Production outage | Deploy-blocking bug, infinite loop on startup, OOM | Service is down |
| Silent corruption | Wrong data written without error; corrupt state propagates | Bug is invisible until too late |

**Required action:** Block merge. Fix immediately. Do not create a tracking issue — the PR stays open until resolved.

### P1 — High

**Definition:** Should fix before merge. Override requires written justification from PR author explaining risk acceptance.

| Category | Examples | Why High |
|----------|---------|---------|
| Correctness bug | Wrong calculation, missing validation, incorrect logic | Produces wrong results |
| Performance regression | 10× slower than baseline, N+1 on hot path, unbounded memory | Degrades user experience |
| Breaking change | API contract violated, consumers break, migration missing | Downstream systems break |
| Test regression | Existing test now fails, test deleted to "fix" build | Lost safety net |

**Required action:** Fix in this PR or create tracking issue with deadline (next sprint max).

### P2 — Medium

**Definition:** Fix within current sprint. Track but don't block merge.

| Category | Examples | Why Medium |
|----------|---------|-----------|
| Code smell | God function, duplicated logic, bloated class | Increases future maintenance cost |
| Architectural violation | Layer skip, tight coupling, circular dependency | Compounds over time |
| Missing error handling | No catch on async, no null check, swallowed errors | Will cause production issue eventually |
| Incomplete coverage | New branch untested, edge case not covered | Safety net has holes |

**Required action:** Create tracking issue. Assign to current sprint backlog.

### P3 — Low

**Definition:** Nice to have. Track in backlog if author wants.

| Category | Examples | Why Low |
|----------|---------|---------|
| Style issue | Inconsistent naming, wrong indentation, unused import | No functional impact |
| Naming improvement | Unclear variable/function name, misleading abbreviation | Readability only |
| Documentation gap | Missing JSDoc, outdated comment, missing README | Knowledge only |
| Minor optimization | Premature allocation, minor inefficiency, micro-perf | Negligible impact |

**Required action:** Comment on PR. No tracking required. Author can address or defer.

## Scoring Rubric

When severity is borderline between two levels, evaluate these factors:

| Factor | Push Up (Higher Severity) | Push Down (Lower Severity) |
|--------|--------------------------|---------------------------|
| User impact | Data loss, corruption, or security breach | Cosmetic, internal-only, or logged-only |
| Blast radius | Affects multiple modules or consumers | Single function, single call site |
| Fix complexity | < 1 hour to fix, straightforward | Requires architectural change, high risk |
| Reversibility | Cannot undo (deletes data, sends email) | Easily reverted (rename, reorder) |
| Frequency | Hit on every execution, common path | Edge case, rare input, unlikely scenario |
| Test coverage | Untested path, no regression test | Well-tested with specific assertions |

## Borderline Calibration Rules

1. **P0 vs P1 — If it could be P0, it's P0.** Security and correctness have zero tolerance. Don't downgrade a security finding because "it's unlikely to be exploited."
2. **P1 vs P2 — Does it block other work?** If the issue prevents other PRs from merging or features from shipping, bump to P1. If it's self-contained, P2.
3. **P2 vs P3 — Is it systemic or isolated?** One style issue is P3. 20 style issues across 10 files is P2 — it signals a systemic problem that will compound.
4. **Trending smells — bump one level.** A P3 naming issue that causes confusion across 5 call sites becomes P2. A P2 architectural violation that blocks a planned feature becomes P1.
5. **Multiple low findings in one area — aggregate up.** 5 P3 findings in the same file indicate a P2 quality problem.

## Severity Override Protocol

When overriding a calibrated severity:

1. **P0 override:** Requires tech lead written approval. Record in PR comment.
2. **P1 override:** Requires PR author written risk acceptance. Create tracking issue with deadline.
3. **P2 → P3 downgrade:** At reviewer's discretion. Document reasoning.
4. **P3 → P2 upgrade:** At reviewer's discretion. Must cite evidence of systemic pattern.

## Calibration Output Format

After calibration, each finding should be formatted as:

```
[Severity][Category][location]
Observation: what was found
Action: block-merge | fix-this-pr | track-sprint | track-backlog
```

### Examples

```
[P0][Security][src/api/auth.ts:89]
Observation: JWT secret hardcoded as string literal in source code
Action: block-merge

[P1][Correctness][src/utils/calculate.ts:42]
Observation: Division by zero not guarded when input array is empty
Action: fix-this-pr

[P2][Architecture][src/services/order.ts:15]
Observation: OrderService directly imports database driver instead of using repository interface
Action: track-sprint

[P3][Readability][src/components/Header.tsx:23]
Observation: Variable `d` should be `daysSinceLastLogin` for clarity
Action: track-backlog
```

## Batch Calibration

When a review produces multiple findings:

1. **Sort by severity.** P0 first, P3 last.
2. **Check for patterns.** Multiple P3s in one area = bump to P2.
3. **Count totals.** Report: N P0, M P1, K P2, L P3.
4. **Overall verdict.** Any P0 = fail. 3+ P1 = fail. Otherwise = pass with tracking.
