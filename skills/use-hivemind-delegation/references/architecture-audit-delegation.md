# Architecture Audit Delegation

## Purpose

Delegate architecture audits with the scan→analyze→recommend pattern.

## Phase Breakdown

### Scan Phase

**Goal:** Map the architecture.

**Child must:**
- Identify directory structure and module boundaries
- Map entry points and exports
- Trace dependency chains
- Identify shared vs isolated modules

**Return:** Structure map, dependency graph, entry point list.

### Analyze Phase

**Goal:** Identify architectural issues.

**Child must:**
- Find hotspots (high-change, high-dependency areas)
- Detect violations (circular dependencies, broken boundaries)
- Assess technical debt areas
- Identify coupling and cohesion issues

**Return:** Hotspot list, violation report, debt areas, coupling analysis.

### Recommend Phase

**Goal:** Suggest improvements.

**Child must:**
- Prioritize recommendations by impact and effort
- Provide evidence for each recommendation
- Suggest specific actions (not vague advice)
- Estimate effort for each recommendation

**Return:** Prioritized recommendation list with evidence and effort estimates.

## Cross-Reference

Scan methodology: `hivemind-codemap`
Delegation mechanics: `use-hivemind-delegation`
Loop gating: `hivemind-gatekeeping`
