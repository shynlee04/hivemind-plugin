# Test: Plan Decomposition

## Scenario
Decompose "Add user authentication" into phases.

## Steps
1. Spec distillation: functional ✓, non-functional ✓, integration ✓, risk ✓, operations ✓
2. Validate: src/core/ exists, src/shared/types.ts exists ✓
3. Decompose: Phase 01 (types), Phase 02 (logic), Phase 03 (API), Phase 04 (tests)
4. Dependencies: 02→01, 03→02, 04→03
5. Critical path: 01→02→03→04

## Expected
4 phases, acyclic dependencies, critical path identified.
