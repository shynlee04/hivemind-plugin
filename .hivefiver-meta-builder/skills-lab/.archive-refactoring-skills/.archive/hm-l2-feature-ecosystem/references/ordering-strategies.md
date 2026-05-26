# Feature Delivery Ordering Strategies

## Overview

After building the dependency graph and resolving cycles, features must be ordered for delivery. Pure topological sort gives a technically valid order, but business and risk factors often override the topological sequence.

## Strategy Selection Decision Tree

```
What is the primary constraint on delivery?
  ├── High uncertainty / technical risk → Risk-First
  ├── Tight deadline / business pressure → Value-First
  ├── Multiple teams with different capacities → Team-Constrained
  └── No overriding constraint → Dependency-First (default)
```

## Strategy 1: Dependency-First (Default)

**When to use:** Stable requirements, known technology, standard delivery timeline.

**Algorithm:**
1. Topological sort the DAG (features with no dependencies first)
2. Group features at the same topological depth
3. Within each group, order by impact score (highest first — build foundation features early)

**Advantages:**
- Minimizes blocked work (no team waiting on dependencies)
- Cleanest technical sequence
- Least integration risk (foundations are solid before dependents built)

**Disadvantages:**
- May delay high-value features that have many dependencies
- Team utilization may be uneven (one team builds foundations while others wait)

### Example
```
Wave 1: [auth, data-layer]          ← Foundation: impact scores 8, 7
Wave 2: [user-profile, permissions]  ← Depends on auth
Wave 3: [dashboard, admin-panel]     ← Depends on user-profile, permissions
Wave 4: [reports, notifications]     ← Depends on everything above
```

## Strategy 2: Risk-First

**When to use:** Novel technology, unproven architecture, uncertain requirements, high technical risk.

**Algorithm:**
1. Assign each feature a risk score from `references/dependency-graph-guide.md` (1=proven, 5=speculative)
2. Promote high-risk features to earlier waves, reordering around them
3. Re-validate that promoted features don't break the dependency graph (may need stub/contract approaches)

**Risk Score Factors:**
- Technology novelty (using new framework, language feature)
- Integration complexity (many external dependencies)
- Performance uncertainty (unproven at scale)
- Team experience (team hasn't built this before)
- Requirement stability (requirements likely to change)

### Example
```
Wave 1: [auth, ml-recommendation]   ← ML is high-risk (risk 4); auth is foundation
Wave 2: [data-layer]                ← Data layer can wait; ML is the uncertainty
Wave 3: [dashboard, checkout]       ← Everything else is standard
```

**Risk-first rule:** Never let a risk-4+ feature be in Wave 3+. If the dependency graph blocks this, redesign the graph — the risk is too high to delay.

## Strategy 3: Value-First

**When to use:** Tight deadline, MVP pressure, external launch commitment, investor demo.

**Algorithm:**
1. Assign each feature a business value score (1-5, where 5 = core differentiator, 1 = nice-to-have)
2. Topological sort, but within valid constraints, promote high-value features
3. Defer low-value features even if they have no dependencies

**Value Score Factors:**
- User impact (how many users benefit)
- Revenue impact (direct or indirect)
- Competitive differentiation (unique capability vs. table stakes)
- Strategic alignment (supports current business priority)
- Demo/showcase value (visible in product demos)

### Example
```
Wave 1: [auth, checkout]            ← Checkout is value 5 (revenue); auth is dependency
Wave 2: [dashboard]                 ← Dashboard is value 4 (demo visibility)
Wave 3: [admin-panel]               ← Admin is value 2 (internal tool)
Deferred: [audit-log]               ← Audit log is value 1 (nice to have)
```

**Value-first rule:** If a low-value feature blocks a high-value feature, ask "Can we stub the low-value feature or defer it?" If yes, promote the high-value feature.

## Strategy 4: Team-Constrained

**When to use:** Multiple features compete for the same team, or teams have different capacities.

**Algorithm:**
1. Topological sort
2. Group parallelizable features
3. Within each parallel group, assign to teams based on capacity
4. If a group has more features than the assigned team can handle, split the group into sub-waves

**Team Capacity Factors:**
- Team size (developers available)
- Team expertise (domain knowledge match)
- Team WIP limit (how many features in parallel)
- Team availability (vacations, other commitments)

### Example
```
Team Alpha (3 devs, WIP limit: 2): [auth, user-profile]
Team Beta (2 devs, WIP limit: 1):  [data-layer]
Team Gamma (4 devs, WIP limit: 2): [dashboard, reports]

Wave 1: Alpha: [auth], Beta: [data-layer]
Wave 2: Alpha: [user-profile], Gamma: [dashboard]
Wave 3: Alpha: [admin-panel], Gamma: [reports]
```

## Hybrid Strategies

Combine strategies when multiple constraints apply:

```
1. Start with Dependency-First (topological sort)
2. Apply Risk-First: promote any risk-4+ features to earlier waves
3. Apply Value-First: promote value-5 features if their dependencies allow
4. Apply Team-Constrained: adjust within each wave based on team capacity
5. Validate: no feature in Wave N+1 depends on a feature in Wave N+M (M > 1)
```

### Hybrid Example

```
Dependency-First baseline:
  Wave 1: [auth, data-layer]
  Wave 2: [user-profile, permissions, checkout]
  Wave 3: [dashboard, reports, admin-panel]
  Wave 4: [audit-log, notifications]

Risk-First promotion: ML-recommendation (risk 5) → Wave 1 with a stub contract
  Wave 1: [auth, data-layer, ml-recommendation]

Value-First promotion: checkout (value 5) → Wave 1 (it can with auth in Wave 1)
  Wave 1: [auth, data-layer, ml-recommendation, checkout]

Team-Constrained: Alpha team can only handle 2 features per wave
  Wave 1: Alpha:[auth, checkout], Beta:[data-layer, ml-recommendation]

Final:
  Wave 1: [auth, checkout, data-layer, ml-recommendation]
  Wave 2: [user-profile, permissions]
  Wave 3: [dashboard, reports, admin-panel]
  Wave 4: [audit-log, notifications]
```

## Wave Size Guidelines

| Team Size | Max features per wave | Rationale |
|-----------|----------------------|-----------|
| 1-2 devs | 2 | Avoid context switching |
| 3-5 devs | 4 | Balance parallelism with coordination |
| 6-10 devs | 6 | Coordination cost rises non-linearly |
| 10+ devs | Split into sub-teams | Each sub-team gets its own wave plan |

## When to Re-Order

Re-run the ordering analysis when:
1. A new feature is added to the ecosystem
2. A feature is removed from scope
3. A feature's risk score changes by ≥2 points
4. A feature's value score changes by ≥2 points
5. A team's capacity changes significantly
6. A dependency is discovered/removed during implementation
7. A cycle is found and resolved (triggers full re-ordering)

## Ordering Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Big Bang wave** | Wave 1 has 8+ features | Split into sub-waves. Large waves have high coordination risk. |
| **Everything-is-Wave-1** | All features in first wave | Apply dependency analysis. Some features MUST come after others. |
| **Serial-everything** | One feature per wave | Identify parallelizable groups. Sequential delivery wastes team capacity. |
| **Value-ignoring foundation** | Low-value foundation features built first, high-value features in Wave 5 | Apply Value-First override. High-value features justify stubbing their dependencies. |
| **Risk-deferral** | Risk-5 feature in final wave | Apply Risk-First. High risk discovered late = catastrophic rework. |
| **Team overcommit** | 6 features assigned to a 2-person team in one wave | Apply Team-Constrained. Overcommitted teams deliver nothing on time. |

## Documentation

Always produce a written wave plan:

```markdown
# Feature Delivery Wave Plan: {ecosystem-name}
**Date:** YYYY-MM-DD
**Strategy:** {dependency-first | risk-first | value-first | team-constrained | hybrid}
**Rationale:** {1-2 sentences on why this strategy was chosen}

## Wave 1: {wave-name} (Foundation)
**Target:** {date or sprint}
**Features:** [{feature-1}, {feature-2}]
**Parallelizable:** {yes | no — {reason}}
**Dependencies satisfied:** None (Wave 1) or [{external-dependency}]
**Team:** {team-name} ({N} developers)
**Risk:** {highest risk score in this wave}

## Wave 2: {wave-name} (Core)
...repeat for each wave...

## Deferred / Backlog
- {feature-name}: {reason for deferral}
```

Write the wave plan to:
```
.planning/ecosystem/YYYY-MM-DD-{ecosystem-name}-waves.md
```
