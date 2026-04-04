# Cross-Dependency Analysis

## Table of Contents

- [Cross-Dependency Analysis Methodology](#cross-dependency-analysis-methodology)
- [Multi-Stack Analysis](#multi-stack-analysis)
- [Dependency Graph Construction](#dependency-graph-construction)
- [Conflict Detection](#conflict-detection)
- [Validation Protocol](#validation-protocol)

## Cross-Dependency Analysis Methodology

Four steps. Each builds on the prior.

| Step | Action | Output |
|------|--------|--------|
| **1. Identify shared interfaces** | Grep for imports between modules, find shared type definitions | Interface inventory |
| **2. Map dependency chains** | Trace from entry points through layers | Dependency graph |
| **3. Detect conflicts** | Find duplicate exports, conflicting type definitions | Conflict report |
| **4. Validate with Repomix** | Pack each dependency chain → grep for import patterns | Validation evidence |

**Rules:**
- Step 1 must complete before Step 2 (need interfaces before tracing chains)
- Step 3 requires Step 2 output (need chains before detecting conflicts)
- Step 4 validates Steps 1-3 against actual code

## Multi-Stack Analysis

For projects spanning TypeScript + Python + Shell scripts:

**Boundary contracts to identify:**
- JSON schemas (data interchange between stacks)
- REST APIs (HTTP interfaces between services)
- CLI interfaces (command-line contracts)
- Environment variables (shared configuration)

**Cross-stack validation:**
1. Pack each stack independently
2. Grep for boundary contract references (schema names, API endpoints, CLI commands)
3. Verify that contract definitions match across stacks
4. Report: matching contracts, mismatched contracts, missing implementations

## Dependency Graph Construction

1. Use Repomix compress on each module/stack
2. Extract interfaces, exports, imports from compressed output
3. Build dependency graph from import chains
4. Identify problematic patterns:

| Pattern | Severity | Detection |
|---------|----------|-----------|
| Circular dependencies | High | Module A imports B, B imports A |
| Unused exports | Low | Export defined but never imported elsewhere |
| Missing implementations | High | Import referenced but no export found |
| Deep dependency chains | Medium | Chain depth > 5 levels |

## Conflict Detection

| Conflict Type | Detection Method | Severity |
|--------------|-----------------|----------|
| Same symbol exported from multiple modules | Grep for export names, check for duplicates | High |
| Same type name with different definitions | Grep for type definitions, compare signatures | High |
| Version mismatches between packages | Check package.json / requirements.txt | Medium |
| Interface breaking changes between modules | Compare interface signatures across versions | High |

## Validation Protocol

1. Pack each module/stack independently
2. Grep packed outputs for import patterns
3. Cross-reference export lists between modules
4. Report:

```
Found dependencies: {list}
Potential conflicts: {list}
Validation status: PASS | FAIL | WARNING
Evidence: {grep output, pack references}
```

**Validation output format:**
```json
{
  "validation_id": "cross-dep-001",
  "modules_analyzed": ["module-a", "module-b", "module-c"],
  "dependencies_found": 42,
  "conflicts_detected": 3,
  "status": "WARNING",
  "conflicts": [
    {
      "type": "duplicate_export",
      "symbol": "formatDate",
      "modules": ["utils/date.ts", "helpers/time.ts"]
    }
  ]
}
```
