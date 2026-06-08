# Impact Propagation Analysis

## Overview

When a feature changes (scope shift, delay, removal, or scope expansion), the impact propagates through the dependency graph. Impact propagation analysis traces these downstream effects so the ecosystem remains coherent.

## Impact Propagation Algorithm

### Step 1: Select the Root Change
Identify the feature that is changing and the nature of the change:

| Change Type | Description | Propagation Behavior |
|-------------|-------------|---------------------|
| **Scope expansion** | Feature adds new capabilities | May REDUCE dependencies on other features (can absorb what others provided) |
| **Scope reduction** | Feature removes planned capabilities | May INCREASE dependencies on other features (must get capability elsewhere) |
| **Delay** | Feature timeline shifts right | All dependents delayed; check for re-ordering opportunities |
| **Removal** | Feature is cut from scope | All dependents must find alternatives or be cut too |
| **Interface change** | Feature changes its API/data contract | All interface dependents must be updated |

### Step 2: Traverse Outgoing Edges
Starting from the changed feature, follow all outgoing edges (features that depend on it):

```python
def propagate_impact(graph, changed_feature, change_type):
    visited = set()
    impact_chain = []

    def dfs(feature, depth, path):
        if feature in visited:
            return
        visited.add(feature)

        for (dependent, dep_type) in graph.get_incoming(feature):
            impact_level = assess_impact(dep_type, change_type, depth)
            impact_chain.append({
                "feature": dependent,
                "depth": depth,
                "dependency_type": dep_type,
                "impact_level": impact_level,
                "path": path + [feature, dependent]
            })
            dfs(dependent, depth + 1, path + [feature])

    dfs(changed_feature, 0, [])
    return impact_chain
```

### Step 3: Assess Impact Level

| Dependency Type | Scope Expansion | Scope Reduction | Delay | Removal |
|----------------|----------------|-----------------|-------|---------|
| **Data (D)** | LOW — new data may be additive | HIGH — data schema change may break consumer | MEDIUM — data can be stubbed | CRITICAL — data source must be replaced |
| **Interface (I)** | LOW — new endpoints are backward-compatible | HIGH — API contract shrinks | MEDIUM — interface can be mocked | CRITICAL — API must be replicated |
| **Temporal (T)** | MEDIUM — existing dependents may need to wait longer | HIGH — rebuild of dependency needed | HIGH — dependents blocked | CRITICAL — dependents cannot operate |
| **Deployment (P)** | MEDIUM — deployment scope changes | HIGH — decoupling needed | HIGH — coordinated delay | CRITICAL — coordinated removal |

### Step 4: Compute Impact Scores

```python
def compute_impact_scores(graph):
    scores = {}
    for feature in graph:
        transitive_dependents = count_transitive_dependents(graph, feature)
        scores[feature] = 1 + transitive_dependents
    return scores

def count_transitive_dependents(graph, feature):
    visited = set()
    def dfs(node):
        count = 0
        for (dependent, _) in graph.get_incoming(node, []):
            if dependent not in visited:
                visited.add(dependent)
                count += 1 + dfs(dependent)
        return count
    return dfs(feature)
```

## Impact Chain Documentation Template

For any feature that changes, produce an impact chain report:

```markdown
## Impact Chain: `{feature-name}` — {change-type}

**Root Change:** {description of what changed}
**Date:** YYYY-MM-DD
**Assessor:** {agent name}

### Direct Impacts (Depth 1)

| Dependent Feature | Dep Type | Impact Level | Action Required |
|-------------------|----------|-------------|-----------------|
| {feature-a} | {D/I/T/P} | {level} | {what needs to happen} |
| {feature-b} | {D/I/T/P} | {level} | {what needs to happen} |

### Transitive Impacts (Depth 2+)

| Dependent Feature | Depth | Path | Impact Level | Action Required |
|-------------------|-------|------|-------------|-----------------|
| {feature-c} | 2 | root → a → c | {level} | {what needs to happen} |

### Total Impact Summary
- **Features directly affected:** {N}
- **Features transitively affected:** {M}
- **Critical actions required:** {K}
- **Recommended response:** {mitigation strategy}
```

## Impact Classification Guidelines

| Impact Level | Criteria | Response |
|-------------|----------|----------|
| **CRITICAL** | Dependent feature cannot function without immediate intervention | Stop all work on dependent; escalate; replan immediately |
| **HIGH** | Dependent feature requires significant rework or re-planning | Schedule re-planning within 24h; notify dependent feature owner |
| **MEDIUM** | Dependent feature needs adjustment but can continue with workaround | Document workaround; schedule fix in current planning cycle |
| **LOW** | Dependent feature is aware of the change and needs minor tuning | Note in feature brief; address in next refinement pass |

## Special Cases

### Backward-Compatible Interface Changes
If a feature adds new endpoints without changing existing ones, interface dependents have LOW impact. If a feature marks endpoints as deprecated, dependents have MEDIUM impact (they have a migration window).

### Data Schema Evolution
Additive schema changes (new columns, new tables) are LOW impact for data dependents. Destructive schema changes (column removal, type changes) are CRITICAL for all data dependents.

### Shared Infrastructure Changes
When two features share deployment infrastructure and one changes its infrastructure requirements:
1. Check if the change is backward-compatible (e.g., adding a new environment variable)
2. If incompatible, assess whether the second feature must also change its deployment
3. Treat shared-infra changes as Deployment (P) dependency propagation

### Foundation Feature Changes
Foundation features (auth, data layer, routing) have the highest impact scores. When they change:
- Run impact propagation for ALL dependents, not just direct ones
- Consider extending the change window to allow dependents to adapt
- If the foundation change is breaking, treat it as a new Ecosystem Design session — restart from Phase 1

## Anti-Patterns in Impact Analysis

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **One-hop analysis** | Impact chain stops after direct dependents | Continue recursively until leaf nodes |
| **"It'll be fine" assumption** | No written impact assessment | Always produce a written chain. Intuition ≠ analysis. |
| **Ignoring transitive loops** | Feature A → B → C → A (via different paths) | Transitive paths are not the same as direct cycles, but they amplify impact. Flag them. |
| **Delay as non-impact** | "Feature is just delayed, no impact" | Delay changes the delivery schedule. All dependents are time-shifted. |
| **Overestimating LOW impact** | Calling everything "LOW" without criteria | Use the impact classification table strictly. |

## Integration with Ordering

After impact analysis, re-run Phase 4 (ordering) if:
- Any feature's impact score changed by ≥2 points
- A new dependency was discovered during impact tracing
- A feature was removed or its scope changed significantly
