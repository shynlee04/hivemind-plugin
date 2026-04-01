# Scenario: Basic Decomposition

## Input

Structured spec: "Add three new tools to the runtime layer. Each tool has its own
schema, implementation, and test file. No shared types between them."

## Expected Decomposition

### Step 1: Authority Surface

All targets are `tool` surface.

### Step 2: Concern Separation

- `write`: 3 tool implementation files
- `write`: 3 test files
- `verify`: type check + test suite

### Step 3: File Clusters

| Cluster | Files |
|---|---|
| tool-alpha | `src/tools/alpha.ts`, `tests/alpha.test.ts` |
| tool-beta | `src/tools/beta.ts`, `tests/beta.test.ts` |
| tool-gamma | `src/tools/gamma.ts`, `tests/gamma.test.ts` |

### Step 4: Slice Sizing

| Slice ID | Files | Concern |
|---|---|---|
| `tool-alpha-impl` | 1 | write |
| `tool-alpha-test` | 1 | write |
| `tool-beta-impl` | 1 | write |
| `tool-beta-test` | 1 | write |
| `tool-gamma-impl` | 1 | write |
| `tool-gamma-test` | 1 | write |
| `verify-all` | 0 | verify |

All ≤5 files. All pass.

### Step 5: Dependency Ordering

No cross-dependencies between tools. All implementation slices are parallel.
Test slices depend on their respective implementation slices.

```
Wave 0: [tool-alpha-impl, tool-beta-impl, tool-gamma-impl] (parallel)
Wave 1: [tool-alpha-test, tool-beta-test, tool-gamma-test] (parallel)
Wave 2: [verify-all] (sequential — depends on all tests)
```

### Step 6: Gate Definition

| Slice | Gate |
|---|---|
| Each impl slice | `npx tsc --noEmit` |
| Each test slice | `npx jest --testPathPattern={tool-name}` |
| verify-all | `npx tsc --noEmit && npm test` |

## Validation

- [ ] 7 slices total
- [ ] 3 waves
- [ ] All slices ≤5 files
- [ ] No mixed concerns
- [ ] Parallel independence proven for Wave 0 and Wave 1
- [ ] Every write slice has a gate
