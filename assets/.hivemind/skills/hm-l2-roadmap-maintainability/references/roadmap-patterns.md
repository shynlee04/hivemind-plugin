# Roadmap Patterns

## Overview

Feature ordering strategies, milestone planning patterns, and parallelization heuristics for dependency-aware product roadmaps. This reference provides the detailed mechanics behind Phase 3 (Order Features by Dependency) and Phase 7 (Capacity Plan) of the main skill.

## Dependency Types

Every feature relationship falls into one of three dependency strengths:

| Type | Definition | Example | Ordering Rule |
|------|------------|---------|---------------|
| **Hard Dependency** | Feature B literally cannot function without Feature A | "Data export (B) requires authentication (A)" | A must precede B. Non-negotiable. |
| **Soft Dependency** | Feature B benefits from Feature A but can proceed without it | "Dashboards (B) look better with design system (A)" | Schedule A first if feasible, but don't block B. |
| **Enabling Dependency** | Feature A is infrastructure/architecture that unblocks multiple features | "API gateway (A) enables all service features (B, C, D)" | Treat as pre-enablement feature. Schedule A first. |

### Dependency Detection Questions

For each feature pair (A, B), ask:
1. "Can B be built and tested without A's code running?" → If NO: Hard dependency.
2. "Would B's developer need to understand A's implementation?" → If YES: Soft dependency.
3. "Does A provide platform/infrastructure that B, C, D all consume?" → If YES: Enabling dependency.

When uncertain, classify as Soft and allow the user to reclassify.

## Feature Ordering Strategies

### Strategy 1: Strict Topological (Default)

**When to use:** High-certainty roadmap, well-understood dependencies, risk-averse environment.

**Algorithm:**
1. Build the full dependency graph: nodes = features, edges = hard dependencies
2. Run Kahn's algorithm for topological sort:
   - Find all nodes with zero incoming edges (root features)
   - Add them to the next available milestone
   - Remove them from the graph
   - Repeat until graph is empty
3. If graph has remaining nodes → deadlock detected

**Pros:** No dependency violations possible. Safe for critical systems.
**Cons:** Can be rigid. May delay high-value features that wait on low-value enablers.

### Strategy 2: Value-Weighted Ordering

**When to use:** Pressure to deliver business value early; some dependencies can be softened.

**Algorithm:**
1. Assign each feature a Business Value score (1-10) and a Technical Risk score (1-10)
2. Compute Priority Score = (Business Value × 2) - Technical Risk
3. Apply hard dependency constraints: a feature cannot be scheduled before its hard dependencies
4. Within each dependency level, order by Priority Score descending
5. Allow soft dependencies to be deferred if they block high-value features

**Pros:** Maximizes early value delivery.
**Cons:** Risk of technical debt accumulation if enablers are consistently deferred.

### Strategy 3: Risk-First Ordering

**When to use:** High technical uncertainty; architecture is evolving; multiple unknowns.

**Algorithm:**
1. Classify features by uncertainty: Known (well-understood), Exploratory (requires spike), Unknown (market/tech unvalidated)
2. Schedule Known features in early milestones to establish stable foundation
3. Schedule Exploratory spikes early (M1-M2) — NOT the full feature, only the spike
4. Defer Unknown features until spikes return data
5. Architecture runway items go first regardless of business value

**Pros:** Reduces risk of late-stage architecture pivots.
**Cons:** May delay visible progress. Requires stakeholder buy-in on exploration value.

## Milestone Structuring Patterns

### Pattern A: Thematic Milestones

Each milestone has a clear user-facing theme. Features within a milestone collectively deliver a coherent capability.

```
M1: "User Management" → auth, profiles, roles
M2: "Content Platform" → posts, comments, search
M3: "Analytics" → dashboards, reports, exports
```

**When to use:** Stakeholder communication matters. Each milestone tells a story.
**Avoid:** When features are deeply cross-cutting and can't be grouped thematically.

### Pattern B: Layer Cake Milestones

Milestones build architectural layers bottom-up. Each milestone adds a new architectural tier.

```
M1: "Platform Foundation" → API gateway, auth, database
M2: "Business Logic Layer" → domain services, workflows
M3: "Presentation Layer" → UI components, dashboards
M4: "Integration Layer" → third-party integrations, webhooks
```

**When to use:** Greenfield projects with clear architectural tiers.
**Avoid:** When users need end-to-end value in early milestones. Layer cake delays visible features.

### Pattern C: Thin Vertical Slices

Each milestone delivers a complete, thin vertical slice of functionality — end-to-end but narrow.

```
M1: "Create & View Posts" → full stack for basic post operations
M2: "Comment & React" → full stack for engagement
M3: "Search & Discover" → full stack for content discovery
```

**When to use:** Need to validate assumptions early; product-market fit exploration.
**Avoid:** When architecture requires up-front investment (complex distributed systems).

## Deadlock Resolution

When topological sort detects a cycle (A → B → A):

### Detection
```bash
# If using a graph, detect cycles manually:
# 1. List all features and their dependencies
# 2. Walk each path. If you return to a visited node, cycle detected.
# 3. Record the path A → B → C → ... → A
```

### Resolution Strategies

| Strategy | When to Use | Action |
|----------|------------|--------|
| **Merge features** | A and B are small and tightly coupled | Combine A and B into a single feature AB. Build together. |
| **Introduce enabling feature** | A and B are conceptually separate but share a mutual dependency | Create F-ENB-NNN that provides shared infrastructure. Both A and B depend on it. |
| **Split the dependency** | The cycle exists only for one aspect of A's dependency on B | Refactor: A depends on B-interface (extracted from B). B-interface has no B dependencies. |
| **Accept and serialize carefully** | Low risk, small cycle | Plan A and B in the same milestone. Build simultaneously with shared understanding. |

## Parallelization Heuristics

### When Features Can Be Parallelized

| Condition | Example |
|-----------|---------|
| Same dependency level (both depend only on M1, neither depends on the other) | F-003 and F-004 both depend only on F-001 (in M1) |
| Modify different modules/files with no shared code paths | F-005 changes `src/auth/`, F-006 changes `src/payments/` |
| Independent domain boundaries | F-007 adds notification service, F-008 adds reporting service (no shared logic) |

### When Features Must Be Serialized

| Condition | Example |
|-----------|---------|
| Direct dependency chain (A → B → C) | F-001 must complete before F-002, which must complete before F-003 |
| Shared module modification — risk of merge conflicts | Both F-009 and F-010 change `src/shared/utils.ts` extensively |
| Architectural gate — the first feature defines a pattern the second must follow | F-011 establishes the plugin system, F-012 adds a plugin using that system |
| Knowledge dependency — team must learn from building A to build B effectively | F-013 is a new technology, F-014 also uses it but benefits from lessons learned |

## Capacity Estimation

### Complexity Bands

| Band | Days | Characteristics |
|------|------|-----------------|
| **S (Small)** | 1-3 | Single module, well-understood pattern, no new dependencies, limited test surface |
| **M (Medium)** | 3-10 | Cross-module changes, some new patterns, moderate test surface, 1 review cycle |
| **L (Large)** | 10-30 | Multiple modules, new architecture decisions, significant test surface, 2+ review cycles |
| **XL (Extra Large)** | 30+ | Platform feature, cross-cutting impact, new infrastructure, multiple review cycles, migration required |

### Capacity Formula

```
Milestone_Capacity = Team_Throughput × Milestone_Length

where:
  Team_Throughput = total available developer-days per week (account for meetings, reviews, onboarding)
  Milestone_Length = weeks allocated to the milestone

Example: 2 developers × 3.5 effective days/week × 4 weeks = 28 developer-days
```

### Overload Resolution

When milestone capacity < sum of feature estimates:

1. **Defer:** Move lowest-priority features to the next milestone.
2. **Split:** Break large features into partial deliveries across milestones.
3. **Simplify:** Reduce scope of features in the overloaded milestone.
4. **Re-estimate:** If all estimates are L/XL, check for optimism bias. Recalibrate.

### Capacity Buffer

Always reserve 20% of milestone capacity for:
- Unexpected complexity
- Bug fixes from previous milestone
- Dependency update overhead
- Code review lag
- Onboarding/knowledge transfer

Effective capacity = Total capacity × 0.8

## Milestone Health Checklist

Before finalizing any milestone assignment, verify:

- [ ] No feature appears before its hard dependencies
- [ ] At least one enabling feature precedes features that need it
- [ ] Total complexity + 20% buffer ≤ milestone capacity
- [ ] Milestone has a clear, communicable theme or outcome
- [ ] No dependency deadlocks remain unresolved
- [ ] Parallelization opportunities are identified and scheduled
- [ ] Debt repayment items are integrated (from Phase 5)
- [ ] Architecture runway items precede dependent features
- [ ] Each milestone delivers standalone value (no "depends on next milestone to be usable")

## Anti-Patterns

| Anti-Pattern | Correction |
|-------------|------------|
| **Big Bang milestones** — all features in M1 | Split into thin slices. Deliver incremental value. |
| **Deadlock denial** — ignoring dependency cycles | Every cycle must be resolved. No "we'll figure it out" deferrals. |
| **Capacity fantasy** — scheduling 100 days of work in a 40-day milestone | Apply the 20% buffer rule. Cut ruthlessly. |
| **Parallelization overestimate** — assuming all same-level features can be parallelized | Check module overlap. Modifying same files = serialized. |
| **Stakeholder ordering** — ordering by who asked loudest, not by dependency | Topological sort is objective. Business value weights are subjective but transparent. |
