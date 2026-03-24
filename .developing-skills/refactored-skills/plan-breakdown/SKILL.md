---
name: plan-breakdown
description: Step-by-step methodology for decomposing complex plans into executable slices with proper dependency ordering. Use when: breaking down multi-concern plans into slices, re-planning after decomposition failure, ordering slices for sequential or parallel execution, sizing slices for single-subagent completion, or defining gate criteria per slice. Extends use-hivemind-delegation's decomposition rules with depth.
---

# plan-breakdown

Systematic methodology for decomposing complex plans into bounded, executable slices with proper dependency ordering. Fills the gap between having a structured spec (from `spec-distillation`) and dispatching sliced work (via `use-hivemind-delegation`).

## Purpose

- Decompose complex plans into bounded, executable slices
- Apply systematic decomposition methodology: authority surface, concern separation, file-cluster grouping
- Produce dependency-ordered slice sequences with gates
- Ensure each slice is completable in one subagent pass
- Provide re-decomposition protocol when initial breakdown fails

## Use This For

- Breaking down multi-concern plans into executable slices
- Re-planning when initial decomposition produces blocked slices
- Decomposition for parallel-safe execution with independence proof
- Ordering slices by dependency to find critical path and parallel candidates
- Sizing slices to stay within single-subagent complexity limits
- Any task requiring systematic breakdown before delegation

## Do Not Use This For

- Plan lifecycle management — use `plan-engineering` (future sibling)
- Single-slice delegation — use `use-hivemind-delegation` directly
- Requirements extraction — use `spec-distillation`
- Codebase structure mapping — use `hivemind-codemap`
- Test-driven implementation — use `tdd-delegation`

## Prerequisites

- `use-hivemind-delegation` MUST be loaded — this skill extends its decomposition rules
- A structured spec or plan must exist (from `spec-distillation`, user input, or `plan-engineering`)
- If codebase structure is needed, run `hivemind-codemap` first to produce a seam inventory

## Sibling Skills

| Skill | Relationship |
|---|---|
| `use-hivemind-delegation` | Base delegation protocol — this skill extends its decomposition rules with depth |
| `spec-distillation` | Upstream — produces structured specs that this skill breaks into slices |
| `hivemind-codemap` | Reference — codebase structure and seam inventory inform decomposition boundaries |
| `plan-engineering` | Sibling (future) — plan lifecycle management; this skill handles the decomposition step |
| `tdd-delegation` | Downstream — when slices require TDD, pair with this skill's slice structure |

## Decomposition Methodology

Six steps, executed in order. Never skip a step. Each step produces artifacts that the next step consumes.

### Step 1: Authority Surface Analysis

Classify every target by its authority surface. This determines which agent can touch it and what mutations are allowed.

| Surface | Definition | Mutation Rules |
|---|---|---|
| `tool` | LLM-facing tool definitions | Write-capable; requires Zod schema |
| `hook` | Read-side interception (events, params, env) | Read-only; no durable writes |
| `core` | State management modules | Write-capable; owns internal state |
| `shared` | Transitional utilities, helpers, paths | Write-capable; no authority duplication |
| `test` | Test files, fixtures, harnesses | Write-capable; must pass gate |
| `schema` | Contract authority (schemas, types) | Write-capable; additive only; requires agreement |
| `config` | Configuration files, env | Write-capable; requires user approval |
| `docs` | Documentation, guides | Write-capable; no behavioral claims |

**Rule:** Never mix surfaces in a single slice unless they share a concern. A slice that modifies both a tool and a hook is two slices.

### Step 2: Concern Separation

Split by concern type. Each slice handles exactly one concern.

| Concern | Definition | Evidence |
|---|---|---|
| `read` | Inspect, scan, map, analyze | File paths read, patterns found |
| `write` | Create, modify, delete, rename | Files written, diffs produced |
| `verify` | Test, validate, type-check, build | Command output, pass/fail counts |

**Rule:** If a plan asks you to "inspect module A then fix module B," that is two slices: one `read` on A, one `write` on B (possibly preceded by a `read` on B that bundles with the write if the child is trusted).

**Verification is always its own concern.** Do not embed `verify` in a `write` slice. A slice that writes code AND runs tests is two slices: write + verify.

### Step 3: File Cluster Grouping

Group files by import relationships, shared interfaces, and co-change frequency.

1. **Identify import graph** — which files import from which
2. **Find shared types** — interfaces, enums, types used across files
3. **Detect co-change pairs** — files that typically change together (check git log if needed)
4. **Form clusters** — 2-5 files that form a tight dependency group

**Cluster rules:**

- Maximum 5 files per cluster
- If a cluster exceeds 5 files, split by sub-concern or sub-directory
- If two clusters share a type/interface, the type file belongs to the cluster that owns it (or is its own 1-file slice if both need it)
- Circular imports are a smell — split the cluster at the circular edge

### Step 4: Slice Sizing

Each slice must satisfy ALL constraints:

| Constraint | Rule | Rationale |
|---|---|---|
| File count | ≤5 files per slice | Single subagent pass limit |
| Concern purity | Exactly one concern (read OR write OR verify) | Agent role enforcement |
| Scope bounded | Explicit `in_scope` and `out_of_scope` | Prevents scope creep |
| Completable | Finishable in one subagent session | No resume dependency within a slice |
| Self-contained | Does not need another slice's output (unless sequential) | Enables parallel dispatch |

**Splitting heuristic — when a slice is too large:**

1. Split by authority surface first
2. If still too large, split by concern
3. If still too large, split by file cluster
4. If still too large after all three, the plan itself is too coarse — escalate to re-distillation

### Step 5: Dependency Ordering

Build a dependency graph, then topological sort.

#### Building the Graph

For each pair of slices (A, B), ask:

1. Does A's output feed B's input? → A → B
2. Do A and B modify the same file? → Order by concern: read before write, write before verify
3. Does B import from A's target module? → A → B (if A modifies the module)
4. Are A and B completely independent? → No edge (parallel candidate)

#### Critical Path

The longest chain of dependent slices. This determines minimum sequential execution time.

#### Parallel Candidates

Slices with no incoming edges from other slices in the current wave. After removing completed slices, the next wave's candidates are slices whose dependencies are now satisfied.

#### Ordering Algorithm

```
1. Build adjacency list from dependency graph
2. Compute in-degree for each slice
3. Wave 0: all slices with in-degree 0 (no dependencies)
4. For each wave: dispatch all candidates, collect returns
5. After synthesis: reduce in-degree of dependent slices
6. Next wave: slices now at in-degree 0
7. Repeat until all slices processed
```

### Step 6: Gate Definition

Every slice must have a gate — a verification command that proves completion.

| Gate Type | Command Pattern | Pass Condition |
|---|---|---|
| Type check | `npx tsc --noEmit` | No type errors |
| Unit test | `npx jest --testPathPattern=<files>` | All tests pass |
| Build | `npm run build` | Exit code 0 |
| Lint | `npm run lint` | No errors |
| Integration | `npx jest --testPathPattern=integration` | All pass |
| Schema validate | Project-specific | Schema contracts verified |

**Gate rules:**

1. Every `write` slice MUST have at least one gate
2. `verify` slices are themselves gates
3. `read` slices return evidence (file paths, patterns) — no gate command needed
4. Gate failure → slice returns `status: "partial"` with output as evidence
5. The orchestrator does NOT run the gate — the child runs it and returns output

## Slice Template

Each slice is a structured JSON object:

```json
{
  "slice_id": "tool-schemas-zod-migration",
  "order": 3,
  "wave": 1,
  "concern": "write",
  "authority_surfaces": ["tool"],
  "in_scope": [
    "src/tools/runtime/status.ts",
    "src/tools/runtime/command.ts"
  ],
  "out_of_scope": [
    "src/hooks/**",
    "src/core/**"
  ],
  "description": "Migrate tool arg definitions to use tool.schema (Zod)",
  "depends_on": ["codemap-tool-analysis"],
  "blocks": ["verify-tool-migration"],
  "parallel_safe": false,
  "gate": {
    "command": "npx tsc --noEmit && npm test -- --testPathPattern=tools",
    "expected_pass": true
  },
  "evidence_required": [
    "files_modified",
    "diff_output",
    "type_check_result"
  ],
  "estimated_complexity": "low | medium | high"
}
```

## Re-Decomposition Protocol

When a slice fails more than once, do not retry. Re-decompose.

### Trigger

A slice returns `status: "partial"` or `status: "blocked"` **twice** on the same slice_id.

### Procedure

1. **Collect failure evidence** — gather both return packets, identify the actual blocker
2. **Re-run decomposition** — apply all 6 steps to the failed slice alone
3. **Split further** — the slice was too large; use the splitting heuristic from Step 4
4. **Re-emit** — new slice_ids, updated dependency graph
5. **Log** — record the re-decomposition in the activity folder with reason

### Re-Decomposition Decision Tree

```
Slice failed 2x
  │
  ├── Blocker is external dependency?
  │     → Add dependency slice, update graph
  │
  ├── Blocker is scope too large?
  │     → Split by surface → concern → cluster
  │
  ├── Blocker is missing context?
  │     → Add a read slice before the write slice
  │
  ├── Blocker is conflicting with another slice?
  │     → Merge slices into sequential pair
  │
  └── Blocker is architectural (needs new structure)?
        → STOP. Escalate to user. Return blocked.
```

## Anti-Patterns

| Anti-Pattern | Why Dangerous | Correct Approach |
|---|---|---|
| Mixing read and write in one slice | Agent cannot enforce role boundaries | Split into read slice + write slice |
| Slices larger than 5 files | Exceeds single-subagent pass limit | Split by surface → concern → cluster |
| Skipping dependency analysis | Parallel dispatch fails unpredictably | Build graph before dispatching |
| No gate on write slices | No proof of completion | Every write slice needs a gate command |
| Decomposing by directory alone | Misses cross-cutting concerns | Decompose by authority + concern + cluster (in that order) |
| Retrying the same slice without re-decomposition | Same failure repeated | Apply re-decomposition protocol after 2 failures |
| Parallel dispatch without independence proof | Unmergeable conflicts | Prove isolation (no shared imports, files, types) before parallel |
| Verification bundled with implementation | Hides failures; scope creep | Verification is always its own slice |

## Bundled Resources

| Resource | Purpose |
|---|---|
| `references/decomposition-steps.md` | Detailed walkthrough of each decomposition step with examples |
| `references/dependency-ordering.md` | Graph construction, topological sort, wave sequencing |
| `references/slice-splitting-heuristics.md` | When and how to split oversized slices |
| `references/re-decomposition-protocol.md` | Full re-decomposition procedure with decision tree |
| `templates/slice-template.json` | JSON template for a single slice definition |
| `templates/decomposition-plan.json` | JSON template for the full decomposition output |
| `tests/basic-decomposition.md` | Scenario: decompose a 15-file refactor into slices |
| `tests/parallel-candidates.md` | Scenario: identify parallel-safe slices from a graph |
| `tests/re-decomposition.md` | Scenario: handle repeated slice failure |

## Independence Rules

- This skill extends `use-hivemind-delegation` — it does not replace it
- It must be loaded after `use-hivemind-delegation` (or composed with it)
- It can be invoked standalone for planning purposes (no delegation needed for decomposition analysis)
- It does NOT perform implementation — it produces slice definitions that delegation consumes
- Decomposition artifacts are stored in `{project}/.hivemind/activity/delegation/` alongside delegation packets
- If `hivemind-codemap` has run, its seam inventory should inform Step 3 (file cluster grouping)
