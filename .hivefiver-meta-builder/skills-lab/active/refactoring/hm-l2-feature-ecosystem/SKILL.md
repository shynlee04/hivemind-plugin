---
name: hm-l2-feature-ecosystem
description: >
  Use when the user says "feature ecosystem", "cross-dependency between features",
  "dependency graph", "feature ordering", "what order should I build these features",
  "circular dependency in features", "feature impact analysis", "orphan feature",
  "interdependent features", "ecosystem design", "feature delivery order",
  "how do these features depend on each other", "trace feature dependencies",
  "feature interface contract", "design interface between features",
  "feature dependency chain", or when multiple features interact and need
  coordinated delivery sequencing. This skill bridges feature ideas (from hm-brainstorm)
  and validated requirements (from hm-requirements-analysis) to an ordered, validated
  dependency graph ready for implementation planning. NOT for single-feature design,
  code-level dependency analysis, or long-term product roadmapping — those belong to
  hm-brainstorm, hm-cross-cutting-change, and hm-roadmap-maintainability respectively.
metadata:
  consumed-by:
    - "hm-l2-ecologist"
    - "hm-l2-strategist"
  lineage-scope: "hm-*"
  access: "STRICT"
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

# Feature Ecosystem: Interdependence Design

Design and validate a set of features as an interdependent ecosystem — not isolated units. This skill owns cross-feature dependency mapping, cycle detection, impact analysis, delivery ordering, and interface contract design. It does NOT define single-feature requirements or implement changes — it designs the relationships BETWEEN features.

This package synthesizes patterns from inspected third-party sources:

| Source | Adopt / adapt decision | Local transformation |
|--------|------------------------|----------------------|
| `dependency-audit@agensi.io` | Adopt dependency cross-referencing and unused-check patterns; adapt from package-level to feature-level graph. | Feature dependency graph with data, interface, temporal, and deployment edge types. |
| `topological-sort / DAG delivery patterns` (general CS) | Adopt topological ordering and parallelizable-group identification. | Adapted for feature delivery with risk/value/blocking overrides. |
| `interface contract patterns` (general API design) | Adopt contract-first design between feature owners. | Transformed to agent-team contract design with version locking. |

## HARD GATE — No Implementation Without Validated Ecosystem

```
DO NOT begin implementing any feature until the ecosystem dependency
graph is validated: no circular dependencies, no missing interfaces,
no orphan features, and delivery order confirmed.
```

## Entry Gate

Proceed when any of these are true:
- User describes 2+ features that interact or depend on each other
- User asks about "what order" to build features
- User mentions "dependency between features" or "feature X needs feature Y"
- User asks for impact analysis of a feature change
- A coordinator skill routes multiple feature ideas to ecosystem design
- A requirements brief lists features with cross-references to other features

Do NOT proceed when:
- Only one feature is in scope → route to `hm-brainstorm` or `hm-spec-driven-authoring`
- The question is about code-level dependencies (imports, `package.json`) → route to `hm-detective`
- The question is about long-term roadmap strategy (quarters, epics) → route to `hm-roadmap-maintainability`
- Features are already ordered and implemented → route to `hm-cross-cutting-change` for impact analysis

## Checklist

Create a task for each item and complete them in order. Do not skip phases.

- [ ] Phase 1: Build Dependency Graph — identify all features, map their dependency types
- [ ] Phase 2: Validate Graph — detect cycles, missing interfaces, orphan features
- [ ] Phase 3: Analyze Impact Propagation — trace downstream effects when features change
- [ ] Phase 4: Determine Delivery Order — topological sort, identify parallelizable groups
- [ ] Phase 5: Design Interface Contracts — contracts between features owned by different teams
- [ ] Phase 6: Handoff — route to next skill with validated ecosystem

## Phase 1: Build Dependency Graph

### 1.1 Gather Feature Inputs

Before constructing the graph, collect all feature descriptions:

1. If features come from `hm-brainstorm`, read the requirements briefs
2. If features come from `hm-requirements-analysis`, read the validated requirement tables
3. If features are described in the current conversation, list each one with its stated purpose
4. Check for any existing architecture documents, ADRs, or technical specs that define feature boundaries

### 1.2 Identify Feature Nodes

For each feature, record:
- **Feature name** — unique identifier (kebab-case, max 48 chars)
- **Purpose** — 1 sentence: what it provides to users/the system
- **Owner/team** — who owns it (if known; otherwise mark "unowned")
- **Requirements source** — pointer to requirements brief, spec, or conversation

```markdown
### Feature Node: `user-authentication`
- **Purpose:** Provides login, logout, session management for end users
- **Owner:** Auth Team
- **Source:** `.planning/requirements/auth-brief.md`
```

### 1.3 Map Dependency Types

For each pair of features (A, B), classify the dependency using four types:

| Dependency Type | Question | Example |
|----------------|----------|---------|
| **Data** | Does A need data that B produces? | `checkout` needs `user-authentication` for user identity |
| **Interface** | Does A call B's API/endpoint/function? | `dashboard` calls `analytics` API for metrics |
| **Temporal** | Must B exist before A can function? | `migration-tool` must run before `new-schema` can be used |
| **Deployment** | Can A and B deploy independently? | `payment-gateway` and `notification-service` deploy together |

For each dependency found, record as: `A → B [type, rationale]`

Use `references/dependency-graph-guide.md` for graph construction algorithms and edge type details.

### 1.4 Create the Dependency Matrix

Produce a scored dependency matrix:

```markdown
| From \ To | auth | checkout | dashboard | analytics |
|-----------|------|----------|-----------|-----------|
| auth      | —    |          | D(1)      | D(2)      |
| checkout  | D(3) | —        |           |           |
| dashboard | D(4) |          | —         | I(5)      |
| analytics |      |          |           | —         |

Legend: D = data, I = interface, T = temporal, P = deployment
Number in parens = dependency priority (1=highest risk)
```

### 1.5 Pause for Graph Review

Present the graph and dependency matrix to the user. Ask:

> "This is my understanding of how these features depend on each other. Are there any missing dependencies, or any I've captured that don't actually exist?"

Wait for confirmation before proceeding to Phase 2.

## Phase 2: Validate Graph

### 2.1 Detect Circular Dependencies

Run cycle detection using the algorithm in `references/dependency-graph-guide.md`:

1. Build a directed graph from the dependency matrix (A → B means A depends on B)
2. Run DFS with a recursion stack to detect back edges
3. For each cycle found, report the cycle and its severity:

```markdown
### Cycle Detected: `auth` → `user-profile` → `permissions` → `auth`
- **Severity:** HIGH — blocks all three features from independent delivery
- **Resolution options:**
  1. Merge into a single feature with sub-components
  2. Extract the shared dependency into a new foundational feature
  3. Break the cycle by removing the weakest dependency edge
```

**Any cycle is BLOCKING.** Do not proceed to Phase 3 until all cycles are resolved.

### 2.2 Detect Missing Interfaces

For every Interface-type dependency A → B, verify that B's intended API exposes what A needs:

1. List all interface dependencies from the matrix
2. For each, check: does B's requirements brief or spec mention the capability A needs?
3. If not found, flag as a missing interface:

```markdown
### Missing Interface: `dashboard` depends on `analytics.getMetrics()`
- **Consumer:** `dashboard` needs aggregated metrics for display
- **Provider:** `analytics` requirements do not mention a `getMetrics` endpoint
- **Impact:** `dashboard` cannot be built until `analytics` commits to this interface
- **Resolution:** Add `getMetrics(orgId, dateRange) → MetricSummary[]` to `analytics` requirements
```

### 2.3 Detect Orphan Features

Identify features that nothing depends on and serve no external consumer:

1. For each node in the graph, count incoming edges (features that depend on it)
2. For each feature with zero incoming edges, ask: "Does this feature serve a user-facing purpose or external consumer?"
3. If no, flag as orphan:

```markdown
### Orphan Feature: `admin-audit-log`
- **Incoming dependencies:** 0
- **User-facing value:** None stated — no user story references audit log
- **Recommendation:** Remove from scope, defer to future release, or integrate into feature that needs it
```

### 2.4 Pause for Validation Confirmation

Present all validation findings (cycles, missing interfaces, orphans) to the user with resolution options. Resolve before continuing.

## Phase 3: Analyze Impact Propagation

### 3.1 Trace Downstream Effects

For each feature, trace what changes if it's modified or delayed.

Use the algorithm from `references/impact-propagation.md`:

1. Select a feature node
2. Traverse all outgoing edges (features that depend on it)
3. For each dependent, assess the impact level (CRITICAL, HIGH, MEDIUM, LOW)
4. Continue recursively until all transitive dependents are covered

```markdown
### Impact Chain: `user-authentication` change
1. **user-authentication** (root change)
   ├── **checkout** [CRITICAL] — needs user identity; checkout breaks without auth
   │   └── **order-history** [HIGH] — depends on checkout for order records
   ├── **dashboard** [HIGH] — user context required for personalized view
   └── **admin-panel** [HIGH] — admin login depends on auth service
```

### 3.2 Compute Impact Scores

Assign each feature an impact score = 1 + number of transitive dependents:

| Feature | Direct Dependents | Transitive Dependents | Impact Score |
|---------|-------------------|----------------------|--------------|
| `user-authentication` | 3 | 4 | **5** |
| `checkout` | 1 | 1 | **2** |
| `order-history` | 0 | 0 | **1** |

Higher impact scores = higher risk if changed; build these earlier and more carefully.

## Phase 4: Determine Delivery Order

### 4.1 Topological Sort

Apply topological ordering on the DAG (guaranteed acyclic after Phase 2):

1. Compute in-degree for each node
2. Queue nodes with in-degree 0 (no dependencies on other features)
3. Process queue: remove node, decrement in-degrees of its dependents
4. Add newly in-degree-0 nodes to queue
5. Result is a valid build order respecting all dependencies

### 4.2 Identify Parallelizable Groups

Features at the same topological depth with no dependencies on each other can be built in parallel:

```markdown
### Delivery Wave Plan
**Wave 1 (Foundation):** `user-authentication`, `data-migration`
**Wave 2 (Core):** `checkout`, `product-catalog`  ← parallelizable
**Wave 3 (Integration):** `order-history`, `dashboard`, `analytics`  ← parallelizable
**Wave 4 (Polish):** `admin-audit-log`, `notification-service`
```

### 4.3 Apply Ordering Overrides

Use `references/ordering-strategies.md` to override pure topological ordering:

| Strategy | When to Apply | Example |
|----------|--------------|---------|
| **Risk-first** | High uncertainty features should be built early | Prototype new ML model before dependent UI |
| **Value-first** | High-value features regardless of dependency position | Build `checkout` before internal tooling |
| **Dependency-first** | Default (topological order) | Foundation features before dependent features |
| **Team-constrained** | Parallel features need same team | Resequence if 3 features need the same 2-person team |

Present the wave plan with a clear recommendation and ask:

> "Here is the proposed delivery order with [X] waves. I recommend [risk-first | dependency-first | value-first] because [rationale]. Does this order work for you?"

## Phase 5: Design Interface Contracts

### 5.1 Identify Cross-Team Interfaces

From the dependency matrix, extract interface-type dependencies where features have different owners:

```markdown
| Consumer Feature | Owner | Provider Feature | Owner | Required Interface |
|-----------------|-------|-----------------|-------|-------------------|
| `dashboard` | Frontend Team | `analytics` | Data Team | `getMetrics(orgId, dateRange)` |
| `checkout` | Payments Team | `user-authentication` | Auth Team | `getCurrentUser()`, `validateSession()` |
```

### 5.2 Design Each Contract

Use `references/interface-contracts.md` for contract design guidance. For each cross-team interface, define:

```markdown
### Contract: `checkout` ↔ `user-authentication`

**Version:** 1.0.0 (locked until both teams agree to rev)

**Provider API (user-authentication must expose):**
- `getCurrentUser()` → `{ userId: string, orgId: string, role: string }`
- `validateSession(sessionToken: string)` → `{ valid: boolean, expiresAt: ISO8601 }`

**Consumer API (checkout will call):**
- Blocking: checkout cannot complete without valid session
- Error contract: if auth returns `{ valid: false }`, checkout redirects to login
- SLA: auth must respond within 200ms p95

**Change protocol:**
- Provider proposes change → consumer has 48h to object
- Breaking changes require version bump and migration window
- Non-breaking additions allowed without consumer sign-off
```

### 5.3 Lock Contracts

Present all contracts to relevant teams/agents. Once confirmed:

- Write contracts to `<project-root>/.planning/contracts/<provider>-<consumer>-v1.md`
- Reference them in each feature's requirements brief
- Any future change that breaks a contract must go through change protocol

## Phase 6: Handoff

Present clear routing options:

1. **Proceed to spec-driven authoring** → For each feature in Wave 1, load `hm-spec-driven-authoring` with requirements brief + validated contract
2. **Plan implementation waves** → Load `hm-phase-execution` with the wave plan for orchestrated delivery
3. **Start implementation** → Load `hm-test-driven-execution` for each feature, respecting dependency order
4. **Ecosystem change detected** → If a feature's scope changes, return to Phase 2 (validate graph) and Phase 3 (impact propagation)
5. **All features delivered** → Route to `hm-roadmap-maintainability` for long-term evolution tracking

## Decision Tree

```
Is this a single feature or 2+ interdependent features?
  SINGLE → Route to hm-brainstorm or hm-spec-driven-authoring
  2+ FEATURES → Has the dependency graph been built?
    NO → Start Phase 1 (Build Dependency Graph)
    YES → Are there circular dependencies?
      YES → Resolve cycles → return to Phase 2
      NO → Are there missing interfaces or orphan features?
        YES → Resolve → return to Phase 2
        NO → Is delivery order determined?
          NO → Phase 4 (Determine Delivery Order)
          YES → Are all cross-team interfaces contracted?
            NO → Phase 5 (Design Interface Contracts)
            YES → Handoff (Phase 6)
```

## Routing Table

| Situation | Skill to Load |
|-----------|---------------|
| Single feature, no dependencies on others | `hm-brainstorm` → `hm-spec-driven-authoring` |
| Requirements brief needed for a feature | `hm-brainstorm` |
| Validate requirements against tech constraints | `hm-tech-context-compliance` |
| Lock requirements into falsifiable contracts | `hm-spec-driven-authoring` |
| Code-level dependency analysis (imports, packages) | `hm-detective` |
| Cross-pan implementation changes | `hm-cross-cutting-change` |
| Orchestrated wave-based delivery | `hm-phase-execution` |
| RED/GREEN/REFACTOR implementation cycle | `hm-test-driven-execution` |
| Long-term product roadmap and evolution | `hm-roadmap-maintainability` |

## Boundary Rules

| Nearby workflow | Boundary |
|----------------|----------|
| `hm-brainstorm` | Produces single-feature requirements briefs. This skill consumes MULTIPLE briefs and designs the relationships between them. |
| `hm-requirements-analysis` | Produces validated, traceable requirements per feature. This skill consumes those tables for dependency identification. |
| `hm-tech-context-compliance` | Validates individual features against tech constraints. This skill's dependency graph may reveal cross-feature constraint violations (e.g., two features compete for the same resource). |
| `hm-spec-driven-authoring` | Consumes the validated ecosystem + contracts to lock requirements. This skill produces the graph; spec-driven-authoring locks each feature. |
| `hm-cross-cutting-change` | Governs code-level pan-impact when a change spans layers. This skill governs feature-level ecosystem impact BEFORE implementation begins. |
| `hm-test-driven-execution` | Executes RED/GREEN/REFACTOR with ordered features from the wave plan. |
| `hm-phase-execution` | Consumes the wave plan for orchestrated multi-feature delivery. |
| `hm-roadmap-maintainability` | Owns long-term product evolution (quarters, epics). This skill handles current-release feature interdependence design. |

## Dependency Type Reference

| Type | Code | Question | Impact If Misidentified |
|------|------|----------|------------------------|
| **Data** | D | Does A need data B produces? | A blocked; B's data model changes break A |
| **Interface** | I | Does A call B's API? | A blocked; B's API contract changes break A |
| **Temporal** | T | Must B exist before A? | A cannot start until B is deployed |
| **Deployment** | P | Must A and B deploy together? | Coupled release risk; rollback complexity |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Single-feature scope** — applying ecosystem analysis to one feature | Dependency matrix is 1x1 | Redirect to `hm-brainstorm` or `hm-spec-driven-authoring` |
| **Hidden dependency** — dependency not declared but exists in practice | Feature A references B's data type in conversation but not in the matrix | Add to matrix before proceeding. Interview both feature owners. |
| **Fake independence** — claiming features are independent when they share a database or auth layer | Multiple features reference "user" or "organization" without declaring it | Extract shared concepts as foundational features in Wave 1. |
| **Delivery ordering by intuition** — ordering features by "what feels right" instead of graph analysis | No topological sort, no impact scores | Always run Phase 4. Intuition is a useful sanity check, not a substitute. |
| **Skipping contract design** — assuming teams will "figure out" the interface | Cross-team interface dependencies with no written contract | Write contracts in Phase 5. Verbal agreements are the #1 source of integration failures. |
| **Ignoring transitive impact** — only assessing direct dependents | Impact analysis stops after one hop | Continue recursively until leaf nodes. Changes propagate. |
| **Treating all dependencies as equal** — no distinction between data, interface, temporal, deployment | All edges labeled "depends on" | Use the four dependency types. Each implies different resolution strategies. |
| **Circular dependency workaround** — "we'll just build both at the same time" | Cycle detected but resolved by "parallel development" | Parallel development of mutually dependent features is a recipe for integration hell. Break the cycle structurally. |

## Framework Adapter Notes

This skill is framework-agnostic. When loaded in a project that uses a specific methodology, adapt as follows:

| Framework | Adaptation |
|-----------|------------|
| **GSD** (Get Shit Done) | Write dependency graph and contracts to `<project-root>/.planning/` directory. Map waves to GSD phases. |
| **BMAD** | Align feature nodes with BMAD's architecture decisions. Use BMAD's cross-cutting concern taxonomy for dependency types. |
| **OpenCode native** | Write contracts to `<project-root>/.planning/contracts/`. Use `session-patch` to link contracts to requirement files. |
| **None / generic** | Write all artifacts to `<project-root>/.planning/ecosystem/YYYY-MM-DD-<ecosystem-name>`. Use plain markdown for everything. |

## Validation Before Handoff

Before routing to the next skill, verify:

- [ ] Dependency matrix exists and covers all features (no feature is missing)
- [ ] All dependency types (D/I/T/P) are classified for every edge
- [ ] No circular dependencies remain unresolved
- [ ] All missing interfaces are either resolved or documented as accepted gaps
- [ ] All orphan features are either removed, integrated, or explicitly deferred
- [ ] Impact propagation trace exists for every feature (direct + transitive)
- [ ] Delivery wave plan is produced with parallelizable groups identified
- [ ] All cross-team interface contracts are written and referenced
- [ ] User confirmed the ecosystem design in Phase 6
- [ ] Routing recommendation is clear and actionable

## Self-Correction

### When a cycle won't break easily

If circular dependencies persist after attempting all three resolution options (merge, extract, break weakest edge), do NOT force a solution. Escalate with a decision packet listing the cycle, the attempted resolutions, and the trade-offs. Let the user pick the least-worst break.

### When features lack requirements

If a feature node has no requirements source (no brief, no spec, no conversation context), do NOT invent its purpose or dependencies. Mark it `blocked: missing-requirements` and exclude it from the dependency graph until clarification arrives.

### When the ecosystem is too large

If the feature count exceeds 15, the graph becomes unreadable and wave planning loses precision. Group features into sub-domains (e.g., "Billing", "Onboarding"), design intra-domain graphs, then an inter-domain graph. Report sub-domain results before the full ecosystem.

### When the user rejects the wave plan

If the proposed delivery order is rejected, do NOT override the user's preference. Document the override reason, re-run impact propagation against the new ordering, and flag any features that will be built before their dependencies as `risk: dependency-not-satisfied`. Present the risk-adjusted plan for confirmation.

## Quick Reference

| Phase | Input | Output | Key Validation |
|-------|-------|--------|----------------|
| Phase 1: Graph | Feature descriptions | Dependency matrix | All features + edges captured |
| Phase 2: Validate | Dependency matrix | Resolved cycles, interfaces, orphans | No blocking issues remain |
| Phase 3: Impact | Validated graph | Impact scores + propagation chains | Transitive coverage |
| Phase 4: Order | DAG + impact scores | Wave plan | Topologically valid + parallelizable |
| Phase 5: Contracts | Cross-team interfaces | Locked interface contracts | All contracts written |
| Phase 6: Handoff | Validated ecosystem | Route to next skill | User confirmed |
