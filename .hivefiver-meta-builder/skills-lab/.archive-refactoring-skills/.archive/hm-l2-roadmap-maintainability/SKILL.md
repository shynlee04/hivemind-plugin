---
name: hm-l2-roadmap-maintainability
description: >
  Evaluate and plan product roadmaps with maintainability as a first-class concern. Use when the user
  asks about "product roadmap", "maintainability", "feature ordering", "technical debt tracking",
  "architecture evolution", "extensibility", "long-term planning", "product health", "maintenance scoring",
  "codebase health", "debt prioritization", "milestone planning", "breaking change forecasting",
  "architecture runway", "refactoring roadmap", or when planning features across multiple milestones
  with dependency and maintainability constraints. NOT for near-term feature interdependence design
  (use hm-feature-ecosystem) or initial ideation (use hm-brainstorm).
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Roadmap Maintainability

## Overview

This skill teaches systematic evaluation of product roadmaps through a maintainability lens. It addresses long-term product evolution: ordering features across milestones so dependencies are always built before dependents, scoring codebase health, detecting architecture constraints that block future work, and tracking technical debt impact on roadmap velocity.

**This skill owns:** maintainability scoring, feature ordering by dependency, extensibility verification, technical debt tracking, product health monitoring, breaking change forecasting, and capacity planning.

**Entry state:** An existing feature backlog, roadmap draft, or milestone plan to evaluate.
**Exit state:** A maintainability-rated roadmap with debt-aware milestone ordering and extensibility verification.

---

## Third-Party Source References

This skill synthesizes patterns from inspected third-party sources and established industry practices:

| Source | Adopt / Adapt Decision | Local Transformation |
|--------|------------------------|----------------------|
| `skillmd.ai/roadmap-planner` | Adopt milestone dependency ordering and capacity estimation patterns; adapt away from Scrum-specific sprint concepts. | Use milestone-based ordering with generic time buckets. |
| `AdamPaternostro/agent-skills@maintainability-scorer` | Adopt hex-dimension scoring (complexity, coupling, coverage, docs, freshness, arch-debt); adapt scoring thresholds to agent workflow context. | Use the Maintainability Scorecard with agent-aware weights. |
| `phodal/tech-debt` | Adopt technical debt quadrant model (deliberate/inadvertent × prudent/reckless) and interest calculation; adapt repayment prioritization to roadmap milestones. | Use debt quadrant + interest-on-principal for milestone impact. |
| Architecture Runway (SAFe concept) | Adopt the concept of architecture runway as prerequisite capabilities; adapt away from SAFe-specific ceremony to generic pre-enablement planning. | Use "pre-enablement features" as dependency chain roots. |

---

## Boundary Rules

| Nearby Workflow | Boundary |
|-----------------|----------|
| `hm-feature-ecosystem` | Handles CROSS-DEPENDENCY between features being built NOW (e.g., "Feature A needs Feature B's API contract"). This skill handles LONG-TERM evolution across milestones (e.g., "Milestone 3's database sharding must precede Milestone 4's multi-tenancy"). |
| `hm-brainstorm` | Consumes the ideation output and informs it with roadmap constraints. This skill applies maintainability lenses to brainstormed requirements. |
| `hm-requirements-analysis` | Informs requirement gap analysis with long-term maintainability constraints. Route detected architectural gaps here for validation. |
| `hm-production-readiness` | Production readiness addresses deploy-time concerns (monitoring, scaling, SLOs). This skill addresses design-time concerns (architecture, coupling, debt). |
| `hm-gate-orchestrator` | May route to this skill during milestone planning gates. |
| `hm-spec-driven-authoring` | Consumes maintainability-scored requirements as spec input for implementation. |
| `hm-tech-context-compliance` | Provides tech stack constraints that influence maintainability scoring (e.g., "React 19 is required, so all components must be compatible"). |

---

## Entry Gate

Proceed when any of these conditions is true:
- User asks about "product roadmap", "milestone plan", "feature ordering", "long term"
- User asks to "evaluate maintainability", "score codebase health", "track technical debt"
- User presents a feature backlog and wants ordering guidance
- User asks "will this architecture support our roadmap?"
- A coordinator skill routes planning work to this skill

**Block if:**
- The user asks about individual feature design → route to `hm-feature-ecosystem`
- The user is still in ideation phase → route to `hm-brainstorm`
- There is no feature backlog, roadmap draft, or milestone plan to evaluate → surface what exists and ask for minimum input

---

## Quick Jump

| Need | Load |
|------|------|
| How to score maintainability dimensions | [references/maintainability-scoring.md](references/maintainability-scoring.md) |
| How to order features across milestones | [references/roadmap-patterns.md](references/roadmap-patterns.md) |
| How to track and prioritize technical debt | [references/debt-tracking.md](references/debt-tracking.md) |
| How to check architecture extensibility | [references/extensibility-checks.md](references/extensibility-checks.md) |

---

## Checklist

Create a task for each item and complete them in order. Do not skip phases.

- [ ] Phase 1: Intake — load existing roadmap artifacts, feature backlog, milestone drafts
- [ ] Phase 2: Score Maintainability — apply hex-dimension scoring to current codebase
- [ ] Phase 3: Order by Dependency — topological sort of features into milestones
- [ ] Phase 4: Check Extensibility — verify architecture supports future roadmap items
- [ ] Phase 5: Track Debt — catalog debt items and calculate milestone impact
- [ ] Phase 6: Assess Product Health — compute and present health dashboard
- [ ] Phase 7: Capacity Plan — estimate complexity and identify parallelization opportunities
- [ ] Phase 8: Produce Roadmap Report — structured maintainability-rated roadmap output

---

## Phase 1: Intake — Load Existing Artifacts

Before evaluating, gather all planning artifacts:

1. **Glob for roadmap files:** `glob **/*roadmap*`, `glob **/*milestone*`, `glob **/*release*`, `glob <project-root>/.planning/roadmap/**`
2. **Read the project context:** `AGENTS.md`, `README.md`, `package.json`, architecture docs
3. **Load dependency context:** If `hm-feature-ecosystem` has produced a dependency graph, read it
4. **Identify gap:** Determine what artifact type is available:

| Available | Action |
|-----------|--------|
| Full roadmap with features per milestone | Skip to Phase 2 |
| Feature backlog (unordered) | Proceed: prioritize then order |
| Milestone plan (no features) | Proceed: ask for feature list |
| Nothing | Present template. Block until minimal input exists |

5. **Classify roadmap maturity:**
   - **Incomplete:** Fewer than 3 milestones or no feature per milestone
   - **Draft:** 3-5 milestones with feature assignments but no dependency rationale
   - **Formal:** 5+ milestones with dependency chains and maintainability considerations

---

## Phase 2: Score Maintainability

Score the current or planned codebase across six maintainability dimensions. Load `references/maintainability-scoring.md` for complete scoring methodology.

### Quick Scoring Overview

| Dimension | What It Measures | Score Range | Red Flag Threshold |
|-----------|-----------------|-------------|---------------------|
| **Complexity** | Cyclomatic complexity, depth, LOC per module | 1 (highest) – 10 (simplest) | Score ≤ 3 |
| **Coupling** | Inter-module dependencies, fan-in/fan-out | 1 (tight) – 10 (loose) | Score ≤ 3 |
| **Test Coverage** | Line/branch coverage, test quality | 1 (none) – 10 (excellent) | Score ≤ 4 |
| **Documentation** | API docs, architecture decisions, onboarding | 1 (none) – 10 (comprehensive) | Score ≤ 3 |
| **Dependency Freshness** | Package version currency, CVE status | 1 (stale) – 10 (current) | Score ≤ 4 |
| **Architectural Debt** | Violated patterns, workarounds, drift | 1 (severe) – 10 (clean) | Score ≤ 3 |

**Procedure:**

1. Run available tooling to gather metrics:
   - Complexity: `npx eslint --rule 'complexity: [error, 10]'` or equivalent
   - Coupling: `npx dependency-cruiser` or manual module-graph inspection
   - Test coverage: `npx vitest run --coverage` or equivalent
   - Dependency freshness: `npx npm-check-updates` or `npx yarn outdated`
   - Documentation/arch-debt: Manual assessment against codebase

2. Score each dimension 1-10 using the rubric in `references/maintainability-scoring.md`.

3. Compute the Maintainability Index:

```
MI = (Complexity × 0.25) + (Coupling × 0.20) + (Coverage × 0.20) + (Docs × 0.10) + (Freshness × 0.10) + (ArchDebt × 0.15)
```

4. Classify overall health:
   - **Healthy (MI ≥ 7.0):** Sustainable velocity. Monitor quarterly.
   - **Moderate (MI 5.0–6.9):** Actionable gaps. Address before next milestone.
   - **At Risk (MI 3.0–4.9):** Velocity will degrade. Must address before feature work.
   - **Critical (MI < 3.0):** Immediate intervention required. Block new features.

5. Record scores in a Maintainability Scorecard. This becomes the baseline for roadmap health tracking.

---

## Phase 3: Order Features by Dependency

Order features across milestones so dependencies are always built before dependents. Load `references/roadmap-patterns.md` for complete ordering strategies.

### Procedure:

1. **Extract features** from the backlog or roadmap artifact. Assign each feature a unique ID (`F-001`, `F-002`, ...).

2. **Identify dependencies** for each feature:
   - **Hard dependency:** Feature B cannot function without Feature A → A must precede B
   - **Soft dependency:** Feature B benefits from Feature A but can proceed without → schedule A first if feasible
   - **Enabling dependency:** Feature A is an infrastructure/architecture change that enables multiple features → treat as pre-enablement feature

3. **Build the dependency graph.** For each feature, list: `depends_on: [F-XXX, ...]` and `enables: [F-YYY, ...]`.

4. **Topological sort** — order features so no feature appears before any of its hard dependencies:
   - Start with features that have zero hard dependencies (root features)
   - Add each root to Milestone 1
   - For each subsequent milestone: add only features whose hard dependencies are satisfied by prior milestones
   - If a cycle exists → flag as **dependency deadlock** — break the cycle by merging features or introducing an intermediate enabling feature

5. **Assign to milestones:**
   - Group ordered features into logical milestone buckets
   - Each milestone should have a clear deliverable theme
   - Apply the **Milestone Independence Rule:** each milestone should produce value independently — no milestone should require a subsequent milestone to be usable

6. **Validate ordering:**
   - Walk each dependency chain from root to leaf
   - Confirm no eager feature appears before its enablers
   - Check that no milestone is overloaded (use capacity planning from Phase 7)

### Dependency Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Hidden dependency** | Feature B is scheduled before A but B's code imports from A's module | Reassign B to after A or extract shared code into a pre-enablement feature |
| **Dependency deadlock** | A → B and B → A cycle | Break cycle with an intermediate pre-enablement feature that both can consume |
| **Orphan feature** | Feature has no dependencies and enables nothing — exists in isolation | Verify necessity; may be a candidate for removal or milestone padding |
| **God milestone** | Single milestone contains 40%+ of all features | Split into smaller milestones with incremental value |
| **Architecture bottleneck** | Multiple high-value features all depend on one pre-enablement feature | Escalate that pre-enablement to highest priority; assess if it should itself be split |

---

## Phase 4: Check Extensibility

Verify that current architecture supports planned future features. Load `references/extensibility-checks.md` for complete methodology.

### Key Questions

1. Does the current architecture have extension points (interfaces, plugin systems, events) where roadmap features will need them?
2. Will the planned data model support features 2-3 milestones out without migration?
3. Are there known ceilings (API rate limits, database scaling limits, monolith bottlenecks) that the roadmap will hit?

### Procedure:

1. **For each feature in milestones 2+, ask:** "Where in the current architecture would this feature attach?" If no clear attachment point exists, flag as an **architecture gap**.

2. **Run the extensibility checklist** from `references/extensibility-checks.md`:
   - [ ] Domain boundaries are stable (bounded contexts won't shift within the roadmap window)
   - [ ] API contracts have versioning strategy
   - [ ] Data model supports planned entities without breaking changes to existing tables
   - [ ] Configuration/feature-flag system exists for phased rollouts
   - [ ] Plugin/extension points exist where third-party or late-binding behavior is planned
   - [ ] Scale ceiling has been estimated for each roadmap item's resource profile

3. **For each architecture gap detected:**
   - Classify: **BLOCKER** (cannot implement the feature without architectural change) vs. **RISK** (can implement but with added complexity)
   - Propose an **architecture runway item** — a pre-enablement feature that must be built before the dependent feature
   - Insert the runway item into the dependency graph (Phase 3) as a hard dependency

4. **Breaking change forecast:** Predict when radical architecture changes will be needed:
   - Mark on the roadmap where the current architecture will be strained
   - Flag "inflection milestones" where a significant architecture evolution is required
   - Estimate the cost of deferring architecture changes vs. doing them proactively

---

## Phase 5: Track Technical Debt

Catalog technical debt items and calculate their impact on roadmap velocity. Load `references/debt-tracking.md` for complete debt management methodology.

### Debt Classification Matrix

| | **Prudent** (conscious trade-off) | **Reckless** (uninformed / careless) |
|---|---|---|
| **Deliberate** | "We chose a monolith for speed knowing we'll need to split it by M3" | "We'll just copy-paste this module for now, fix it later" |
| **Inadvertent** | "We didn't know this pattern wouldn't scale — now we need to refactor" | "We never wrote tests for this critical path because we were in a hurry" |

### Procedure:

1. **Inventory debt items.** For each item, record:
   - Description
   - Quadrant (Deliberate-Prudent, Deliberate-Reckless, Inadvertent-Prudent, Inadvertent-Reckless)
   - Interest rate (how much does it slow velocity per milestone? Low/Medium/High)
   - Principal (estimated effort to resolve, in days)
   - Affected modules/features
   - Milestone impact (which roadmap items are blocked or slowed)

2. **Calculate interest-on-principal:**
   ```
   Cost_of_deferral = Principal × (1 + Interest_Rate)^(milestones_deferred)
   ```
   Example: A 5-day refactor deferred 3 milestones at Medium (0.3) interest costs 5 × 1.3³ = ~11 days of cumulative drag.

3. **Prioritize repayment:**
   | Priority | Criteria | Action |
   |----------|----------|--------|
   | **P0 — Immediate** | Blocks a current-milestone feature; quadrants: Deliberate-Reckless or Inadvertent-Reckless | Schedule in current milestone |
   | **P1 — This roadmap** | Slows velocity measurably; quadrants: any that affect 3+ features | Schedule in a milestone before affected features |
   | **P2 — When convenient** | Low interest; quadrants: Deliberate-Prudent | Schedule when natural refactoring opportunity arises |
   | **P3 — Monitor** | Negligible impact; Inadvertent-Prudent with low interest | Track, don't schedule |

4. **Integrate debt repayment into milestones.** Debt items scheduled for a milestone reduce that milestone's feature capacity.

---

## Phase 6: Assess Product Health

Compute a product health dashboard that combines maintainability scores, debt load, and roadmap feasibility.

### Health Dashboard

```markdown
## Product Health Dashboard — [Date]

### Maintainability Index: X.X/10 (Healthy | Moderate | At Risk | Critical)

### Dimension Scores
| Dimension | Score | Trend |
|-----------|-------|-------|
| Complexity | X.X | ↑ → ↓ |
| Coupling | X.X | ↑ → ↓ |
| Test Coverage | X.X | ↑ → ↓ |
| Documentation | X.X | ↑ → ↓ |
| Dependency Freshness | X.X | ↑ → ↓ |
| Architectural Debt | X.X | ↑ → ↓ |

### Debt Summary
| Type | Count | Total Principal | Cumulative Interest (3 milestones) |
|------|-------|----------------|--------------------------------------|
| P0 — Immediate | N | X days | X days |
| P1 — This roadmap | N | X days | X days |
| P2 — When convenient | N | X days | X days |
| P3 — Monitor | N | X days | X days |

### Roadmap Feasibility
| Metric | Value | Status |
|--------|-------|--------|
| Milestone Count | N | — |
| Features with satisfied dependencies | N/N (X%) | ✅ ≥ 90% / ⚠️ 70-89% / 🚫 < 70% |
| Architecture gaps with runway items | N | ✅ 0 / ⚠️ 1-3 / 🚫 > 3 |
| Milestones with capacity overflow | N | ✅ 0 / ⚠️ 1-2 / 🚫 > 2 |
| Unresolved dependency deadlocks | N | ✅ 0 / 🚫 > 0 |
```

---

## Phase 7: Capacity Plan

Estimate complexity of roadmap items and identify when parallelization is possible.

### Procedure:

1. **Assign complexity to each feature:**
   - **S (1-3 days):** Simple feature, well-understood domain, existing patterns
   - **M (3-10 days):** Moderate feature, some new patterns, cross-module changes
   - **L (10-30 days):** Complex feature, new architecture decisions, multiple modules
   - **XL (30+ days):** Platform feature, cross-cutting, significant infrastructure work

2. **For each milestone, sum complexity.** Flag milestones exceeding team capacity.

3. **Identify parallelization opportunities:**
   - Features with NO shared dependencies can be built in parallel
   - Features that modify different modules can be parallelized
   - Features on the same dependency level (all depend on M1, none depend on each other) can be parallelized

4. **Identify serialization constraints:**
   - Features in a dependency chain (A → B → C) must be serialized
   - Features modifying the same module may need serialization
   - Architecture runway items must precede all dependent features

5. **Produce a capacity-aware milestone map:**
   - Mark parallelizable groups
   - Flag overloaded milestones with capacity recommendations (split, defer, or add resources)
   - Estimate total roadmap duration based on parallel/serial mix

---

## Phase 8: Produce Roadmap Report

Compile findings into a structured maintainability-rated roadmap document:

```markdown
# Maintainability-Rated Product Roadmap

**Generated:** YYYY-MM-DD
**Maintainability Index:** X.X/10 (Classification)
**Roadmap Maturity:** Incomplete | Draft | Formal

## 1. Roadmap Timeline

| Milestone | Theme | Features | Complexity | Debt Repayment | Parallelizable | Dependencies |
|-----------|-------|----------|------------|---------------|----------------|--------------|
| M1: [Name] | [Theme] | F-001, F-002, ... | N days | N items (X days) | Yes/No | None |
| M2: [Name] | [Theme] | F-010, F-011, ... | N days | N items (X days) | Yes/No | M1 |
| ... | ... | ... | ... | ... | ... | ... |

## 2. Dependency Graph

[Text or mermaid diagram showing feature ordering]

## 3. Architecture Runway

| Pre-Enablement Feature | Enables | Milestone | Status |
|------------------------|---------|-----------|--------|
| F-ENB-001 | F-003, F-007, F-012 | M1 | Required |
| ... | ... | ... | ... |

## 4. Maintainability Scorecard

[Full dimension scores from Phase 2]

## 5. Technical Debt Register

| ID | Description | Quadrant | Principal | Interest | Priority | Target Milestone |
|----|-------------|----------|-----------|----------|----------|------------------|
| D-001 | ... | Deliberate-Prudent | 5 days | Medium | P1 | M2 |
| ... | ... | ... | ... | ... | ... | ... |

## 6. Health Dashboard

[From Phase 6]

## 7. Extensibility Assessment

| Future Feature | Architecture Gap | Runway Item | Status |
|----------------|-----------------|-------------|--------|
| F-020 (M4) | No event bus for async notifications | F-ENB-003 | Scheduled M2 |
| ... | ... | ... | ... |

## 8. Capacity Summary

| Milestone | Feature Days | Debt Days | Total | Capacity | Status |
|-----------|-------------|-----------|-------|----------|--------|
| M1 | XX | XX | XX | XX | ✅ Within / ⚠️ Over |
| ... | ... | ... | ... | ... | ... |

## 9. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Architecture strain at M3 inflection | Medium | High | Schedule runway items in M2 |
| ... | ... | ... | ... |
```

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Optimism bias** — assuming all features are S/M complexity and all dependencies are soft | Complexity estimates skew toward S; dependency graph has few hard edges | Review each estimate: "What's the hardest part? What if it goes wrong?" Force at least one L/XL per 5 features. |
| **Debt denial** — claiming no technical debt exists in the roadmap | Debt register is empty; maintainability scores are 8+ on all dimensions | Audit codebase. Every non-trivial project has debt. Score honestly. |
| **Milestone compression** — cramming too many features into early milestones | M1 has 40%+ of total features; no capacity headroom | Split M1 into M1a and M1b. Ruthlessly defer P2 features. |
| **Architecture blindness** — ignoring that the current architecture can't support roadmap | Extensibility check returns zero gaps; architecture runway is empty | Walk each M3+ feature through current architecture. Find the attachment point. |
| **Score inflation** — maintainability scores don't match observable codebase quality | MI is 7+ but test coverage tool shows 10% | Run actual tools. Cross-reference scores with tool output. |
| **Dependency wishful thinking** — scheduling features without verifying their dependency chain | Features queued that depend on unscheduled pre-enablements | Topologically sort before committing to milestone assignments. |

---

## Decision Tree

```
Does a roadmap artifact exist?
  YES → Is there a feature backlog?
    YES → Is there code to assess for maintainability?
      YES → Run full workflow: score → order → extensibility → debt → health → capacity → report
      NO → Run limited workflow: order by dependency → health → capacity → report (maintainability from design review)
    NO → Surface the gap. Ask for features. Block until provided.
  NO → Present roadmap template. Ask for milestone structure. Block until provided.
```

---

## Routing Table

| Situation | Route to |
|-----------|----------|
| Features need cross-dependency design (current features) | `hm-feature-ecosystem` |
| Need to brainstorm new features or requirements | `hm-brainstorm` |
| Need to diagnose gaps in specific requirements | `hm-requirements-analysis` |
| Need production deployment concerns (monitoring, SLOs) | `hm-production-readiness` |
| Tech stack constraints affect roadmap (e.g., React version requirements) | `hm-tech-context-compliance` |
| Roadmap ready for spec-locking of individual features | `hm-spec-driven-authoring` |
| Gate validation for milestone approval | `hm-gate-orchestrator` |

---

## Framework Adapter Notes

This skill is framework-agnostic. Adapt as follows:

| Framework | Adaptation |
|-----------|------------|
| **GSD** | Write roadmap to `<project-root>/.planning/roadmap/`. Align milestones with GSD phases. |
| **BMAD** | Align with BMAD's roadmap artifacts. Debt tracking → BMAD's backlog. |
| **OpenCode native** | Write report to `<project-root>/.planning/roadmap/YYYY-MM-DD-maintainability-roadmap.md`. Use `session-patch` for iterative refinement. |
| **Scrum** | Map milestones to program increments or release trains. Features → Epics → Stories. |
| **None / generic** | Use milestone terminology. No framework assumptions. |

---

## Self-Correction

### When maintainability scores are inconsistent with tool output

If manual scores differ significantly from tool-reported metrics (e.g., scoring complexity 8 but linting shows >100 warnings), re-score that dimension. The tool output is ground truth — adjust subjective scores to match. If tools are unavailable, explicitly mark that dimension as "estimated" and note the missing tool.

### When the debt register is empty

If zero technical debt items are found for a non-trivial codebase (MI < 8.0), the debt assessment is likely incomplete. Audit the codebase for: TODO/FIXME comments, known workarounds, skipped testing, stale dependencies, and architectural drift. Every `console.log` kept for debugging is a debt item.

### When roadmap artifacts are stale

If the roadmap or backlog was last updated more than 2 milestones ago, do NOT treat it as authoritative. Mark the roadmap maturity as "stale" and present a gap report: what the artifact claims vs what the current codebase suggests. Ask for confirmation before using stale data for dependency ordering.

### When capacity estimates are wildly optimistic

If every feature is classified as S (1-3 days) with no L or XL items, the estimate is likely an optimism-bias artifact. Force at least one L or XL per milestone by asking: "Which feature in this milestone has the most unknowns or the most cross-cutting impact?" Reclassify that feature and recalculate.

## Validation Before Handoff

Before routing to the next skill or reporting to the user:
- [ ] Maintainability Scorecard has scores for all 6 dimensions (no empty cells)
- [ ] Every feature has dependency declarations (hard/soft/enabling)
- [ ] The dependency graph has been topologically sorted (no deadlocks)
- [ ] Extensibility assessment covers all M3+ features
- [ ] Debt register has items classified by quadrant and prioritized
- [ ] Health dashboard has all 5 sections completed
- [ ] Capacity plan flags overloaded milestones
- [ ] Roadmap report file exists and has all 9 sections

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| "Evaluate our roadmap for maintainability" | Full workflow: all 8 phases |
| "What order should we build these features?" | Phases 1, 3, 7: intake → order → capacity |
| "How healthy is our codebase?" | Phases 1, 2, 6: intake → score → health dashboard |
| "What technical debt should we pay first?" | Phases 1, 5: intake → debt tracking |
| "Will our architecture support this roadmap?" | Phases 1, 4: intake → extensibility check |
| "Plan the next 3 milestones" | Phases 1, 3, 5, 7: intake → order → debt → capacity |
| "When will we need to refactor the architecture?" | Phases 1, 2, 4: intake → score → extensibility → breaking change forecast |
