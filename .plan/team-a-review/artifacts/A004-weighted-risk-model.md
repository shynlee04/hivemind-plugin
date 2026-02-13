# A004 - Weighted Risk Model

## Formula

`DecisionScore = 0.35*Retention + 0.30*Risk + 0.20*IntegrationCost + 0.15*EcosystemImpact`

- Retention: 0 (removed) to 3 (fully retained)
- Risk: 0 (none) to 3 (high)
- IntegrationCost: 0 (trivial) to 3 (high conflict)
- EcosystemImpact: 0 (low) to 3 (high)

## High-priority-by-risk PRs

- PR #12: high security impact with regression in fallback path resolution.
- PR #11: lock semantics + responsiveness tradeoff; wrong restoration could break atomic behavior.
- PR #14: unbounded concurrency risk if restored naively.

## High-priority-by-traceability PRs

- PR #9, #16: merged history exists but artifacts are removed at HEAD.
