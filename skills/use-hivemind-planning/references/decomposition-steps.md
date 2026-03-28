# Decomposition Steps — Detailed Walkthrough

## Overview

Decomposition transforms a structured spec into an ordered sequence of executable slices.
Six steps execute in order. Each step's output feeds the next.

## Step-by-Step Example

**Input spec:** "Migrate all tools from raw TypeScript interfaces to `tool.schema` (Zod).
Update 12 tool files, fix 8 test files, run full type check and test suite."

### Step 1: Authority Surface Analysis

| Target | Surface | Reason |
|---|---|---|
| `src/tools/runtime/*.ts` | `tool` | LLM-facing tool definitions |
| `src/tools/doc/*.ts` | `tool` | LLM-facing tool definitions |
| `src/tools/trajectory/*.ts` | `tool` | LLM-facing tool definitions |
| `tests/tools/*.test.ts` | `test` | Test files |
| `tests/setup.ts` | `shared` | Test infrastructure shared across tests |

Surface count: 3 tool directories, 1 test directory, 1 shared file.

### Step 2: Concern Separation

| Concern | Targets | Count |
|---|---|---|
| `read` | None needed (spec is clear) | 0 |
| `write` | All tool files (migrate schema) | 12 files |
| `write` | All test files (update assertions) | 8 files |
| `verify` | Type check + test suite | 1 gate |

### Step 3: File Cluster Grouping

| Cluster | Files | Shared Types |
|---|---|---|
| `runtime-tools` | `status.ts`, `command.ts` | `RuntimeStatus`, `RuntimeCommand` |
| `doc-tools` | `doc.ts` | `DocQuery` |
| `trajectory-tools` | `trajectory.ts`, `handoff.ts` | `TrajectoryRecord`, `HandoffPayload` |
| `test-runtime` | `status.test.ts`, `command.test.ts` | — |
| `test-doc` | `doc.test.ts` | — |
| `test-trajectory` | `trajectory.test.ts`, `handoff.test.ts` | — |

### Step 4: Slice Sizing

| Slice ID | Files | Concern | Size |
|---|---|---|---|
| `runtime-schema-migration` | 2 files | write | small |
| `doc-schema-migration` | 1 file | write | small |
| `trajectory-schema-migration` | 2 files | write | small |
| `test-runtime-update` | 2 files | write | small |
| `test-doc-update` | 1 file | write | small |
| `test-trajectory-update` | 2 files | write | small |
| `verify-full-suite` | — | verify | gate only |

All slices ≤5 files. All pass sizing constraint.

### Step 5: Dependency Ordering

Dependencies:

```
runtime-schema-migration  → test-runtime-update
doc-schema-migration      → test-doc-update
trajectory-schema-migration → test-trajectory-update
test-runtime-update       → verify-full-suite
test-doc-update           → verify-full-suite
test-trajectory-update    → verify-full-suite
```

**Wave 0:** `runtime-schema-migration`, `doc-schema-migration`, `trajectory-schema-migration` (parallel)
**Wave 1:** `test-runtime-update`, `test-doc-update`, `test-trajectory-update` (parallel)
**Wave 2:** `verify-full-suite` (sequential — depends on all test updates)

### Step 6: Gate Definition

| Slice | Gate | Pass Condition |
|---|---|---|
| `runtime-schema-migration` | `npx tsc --noEmit` | No type errors |
| `doc-schema-migration` | `npx tsc --noEmit` | No type errors |
| `trajectory-schema-migration` | `npx tsc --noEmit` | No type errors |
| `test-runtime-update` | `npx jest --testPathPattern=tools/runtime` | All pass |
| `test-doc-update` | `npx jest --testPathPattern=tools/doc` | All pass |
| `test-trajectory-update` | `npx jest --testPathPattern=tools/trajectory` | All pass |
| `verify-full-suite` | `npx tsc --noEmit && npm test` | Type clean + all tests pass |

## When Steps Fail

- **Step 1 fails** (cannot classify surface): The spec is ambiguous. Return to `hivemind-spec-driven`.
- **Step 2 fails** (concerns are entangled): The plan has mixed concerns. Split the spec first, then re-decompose.
- **Step 3 fails** (clusters exceed 5 files): Subdivide by sub-directory or sub-concern.
- **Step 4 fails** (no valid split found): The plan is too coarse. Escalate to user.
- **Step 5 fails** (cycles in dependency graph): Circular dependency detected. Break the cycle by extracting a shared slice.
- **Step 6 fails** (no gate possible): The slice has no verifiable output. Make it a `read` slice with evidence instead.
