---
name: use-hivemind-planning
description: The planning domain. From vague requirements to executable phases with numbered steps and dependency maps. Covers requirement distillation, feasibility validation, slice decomposition, and progress tracking.
---

# use-hivemind-planning

You've got a thing to build. Maybe the requirements are clear. Maybe they're a mess. Either way, you need a structured path from "what the human wants" to "here's what each subagent does." This skill is that path. It handles the full arc: distilling noisy specs, validating feasibility, decomposing into bounded slices, mapping dependencies, and tracking progress through to done.

Consolidates: `use-hivemind-planning`, `use-hivemind-planning`, `hivemind-spec-driven`, `hivemind-codemap` (feasibility section).

## Load Position

**Layer: Domain — planning**. `use-hivemind` must be loaded first.

## When to Load

- You have vague or contradictory requirements and need to turn them into something actionable
- You need to break a multi-concern task into phases and slices
- You want to validate feasibility before committing to a plan
- You're tracking execution across phases with evidence gates
- You need dependency maps to find what can run in parallel

## The Planning Flow

Five steps. Don't skip around — each one feeds the next.

**1. Spec** — What does the human actually want? Extract requirement atoms, classify them, map what's clear vs ambiguous vs contradictory. If there's noise, distill first.

**2. Validate** — Can we actually do this? Check that target files exist, constraints hold, and no HIGH-IMPACT ambiguity is lurking. If feasibility fails, stop before decomposing.

**3. Decompose** — Break the validated plan into phases. Number them. Each phase is a bounded unit: ≤5 files, single concern, explicit gate.

**4. Dependencies** — What depends on what? Build the DAG, find the critical path, identify parallel candidates. No circular deps.

**5. Track** — Where are we right now? What's done, what's blocked, what's next? Carry forward ≤5 key findings between phases.

## Spec Distillation

When requirements are messy, start here. Don't plan on top of ambiguity.

### Five-Bucket Classification

Every requirement atom goes into exactly one bucket:

| Bucket | What Goes Here | Example |
|--------|----------------|---------|
| **Functional** | What the system does | Features, behaviors, user stories |
| **Non-functional** | How well it performs | Performance, scalability, security |
| **Integration** | How it connects | APIs, data contracts, dependencies |
| **Risk/Compliance** | What could go wrong | Regulatory, security, audit |
| **Operations** | How it's deployed | Monitoring, incident response, deployment |

### Ambiguity Map

For each requirement atom, tag it:

- **Clear** → add to spec draft
- **Ambiguous** → unresolved queue
- **Contradictory** → conflict register

### Clarification Rules

- MCQ-first — multiple choice before free text, reduces vague answers
- One question at a time — don't overwhelm
- Block on HIGH-IMPACT ambiguity — better to clarify now than refactor later
- Max 10 rounds with progressive hints — don't loop forever

### Terminal States

- Spec complete → proceed to validation
- Ambiguity unresolved → BLOCK, continue clarifying
- Contradiction detected → document both sides, escalate to user

## Feasibility Validation

Before you decompose, check reality. Three checks, all must pass:

| Check | What It Does | Evidence Needed |
|-------|-------------|-----------------|
| **Target exists** | Verify files/modules/paths are real | File paths from `glob`/`grep` |
| **Constraints hold** | Resource limits, timeline, dependency availability | JSON proof |
| **Ambiguity residual** | No HIGH-IMPACT ambiguity remaining | Ambiguity map is clear |

Use `quick` scan depth for feasibility — you don't need exhaustive analysis, just enough to confirm the plan isn't built on ghosts.

**Gate**: All 3 checks produce evidence. No claim without proof.

## Phase Numbering

Two-digit scheme with optional sub-phases:

| Range | Purpose | Example |
|-------|---------|---------|
| `01`–`09` | Standard phases | `01-foundation`, `02-core-logic` |
| `10`–`19` | Extended phases | `10-integration`, `11-edge-cases` |
| `20`+ | Emergency / unplanned | `20-hotfix-path` |
| Sub-phases | Child work within a phase | `01.1-types`, `01.2-wiring` |

Use 2-digit padding (`01`, not `1`) for sorting and deterministic ordering.

## Decomposition Steps

Six steps. Authority surface first, concern type second, file cluster third. Never decompose by directory alone — that misses cross-cutting concerns.

**Step 1 — Authority Surface Analysis.** Classify every target: `tool` (LLM-facing, Zod required), `hook` (read-only), `core` (state management), `shared` (utilities), `schema` (contract authority, additive only), `config` (needs user approval). Never mix surfaces in one slice unless they share a concern.

**Step 2 — Concern Separation.** Each slice handles exactly one: `read` (inspect), `write` (modify), or `verify` (test). A slice that writes code AND runs tests is two slices. Always.

**Step 3 — File Cluster Grouping.** Group by import relationships and shared interfaces. Max 5 files per cluster. If a cluster exceeds 5, split by sub-concern. Circular imports at cluster edges = split signal.

**Step 4 — Slice Sizing.** ≤5 files per slice. Single concern. Explicit `in_scope` and `out_of_scope`. Finishable in one subagent pass. If too large, split by surface → concern → cluster. If still too large after all three, the plan is too coarse — re-distill.

**Step 5 — Dependency Ordering.** Build the graph. A depends on B if A needs B's output or they share files (read before write, write before verify). Topological sort. Critical path = longest chain. Parallel candidates = zero in-degree.

**Step 6 — Gate Definition.** Every write slice needs a gate: `npx tsc --noEmit`, `npm test`, `npm run build`. Verify slices ARE gates. Read slices return evidence, no gate needed.

## Plan Record Schema

```json
{
  "_meta": {
    "created_at": "ISO 8601",
    "updated_at": "ISO 8601",
    "plan_id": "plan-{timestamp}-{concern}",
    "source_spec": "path to spec candidate"
  },
  "status": "validated | decomposing | executing | complete | blocked",
  "validation": {
    "completeness": { "functional": true, "non_functional": true, "integration": true, "risk": true, "operations": true },
    "feasibility": { "target_exists": true, "evidence": "file:line references" },
    "constraints": { "resource_limits": "...", "timeline": "..." },
    "ambiguity_residual": []
  },
  "phases": [
    {
      "phase_id": "01-foundation",
      "concerns": ["types"],
      "files": ["src/shared/types.ts"],
      "dependencies": [],
      "parallel_safe": true,
      "status": "pending",
      "gate": "npx tsc --noEmit && npm test",
      "linked_commits": []
    }
  ],
  "dependency_graph": {
    "critical_path": ["01", "03", "05"],
    "parallel_waves": [["01", "02"], ["03"]],
    "edges": [{ "from": "03", "to": "01", "type": "depends-on" }]
  },
  "carry_forward": []
}
```

## Slice Template

Each slice is a bounded unit. This is what gets handed to delegation.

```json
{
  "slice_id": "tool-schemas-zod-migration",
  "order": 3,
  "wave": 1,
  "concern": "write",
  "authority_surfaces": ["tool"],
  "in_scope": ["src/tools/runtime/status.ts"],
  "out_of_scope": ["src/hooks/**"],
  "description": "Migrate tool arg definitions to use tool.schema",
  "depends_on": ["01-types"],
  "parallel_safe": false,
  "gate": {
    "command": "npx tsc --noEmit && npm test -- --testPathPattern=tools",
    "expected_pass": true
  },
  "evidence_required": ["files_modified", "diff_output", "type_check_result"],
  "estimated_complexity": "low | medium | high"
}
```

## Re-Decomposition

When a slice fails twice on the same `slice_id`, don't retry. Re-decompose.

1. **Collect failure evidence** — gather both return packets, find the real blocker
2. **Re-run decomposition** — apply all 6 steps to the failed slice alone
3. **Split further** — the slice was too large; use the splitting heuristic from Step 4
4. **Re-emit** — new slice_ids, updated dependency graph
5. **Log** — record reason in the activity folder

**Decision tree:**

```
Slice failed 2x
  ├── External dependency blocker?  → add dependency slice
  ├── Scope too large?              → split by surface → concern → cluster
  ├── Missing context?              → add a read slice before the write
  ├── Conflicting with another?     → merge into sequential pair
  └── Architectural blocker?        → STOP. Escalate to user.
```

## Handoff Paths

```
.hivemind/activity/planning/       ← plan records, phase state
.hivemind/activity/delegation/     ← slice definitions, packets
```

Plan records are stored at `{project}/.hivemind/activity/planning/` at runtime. Resolve via `pathing/active-paths.json`, not ad-hoc paths.

## Anti-Patterns

You think the spec is clear enough. It's not. If you skipped the ambiguity map, you'll find out mid-implementation when the requirements contradict themselves.

You think 8 files per slice is fine. It's not — the child can't hold that context in one pass. Split it.

You think parallel dispatch without independence proof is safe. It's not. Two slices modifying the same type file will collide, and you won't know which one's output to trust.

You're decomposing by directory. Stop. Directories don't map to concerns. Decompose by authority surface first, then concern, then cluster.

You're bundling verification with implementation. A slice that writes code and runs tests hides failures. Verification is always its own slice.

You're retrying a failed slice. Stop. The slice was too large. Re-decompose it.

You're skipping dependency analysis. Parallel dispatch fails unpredictably when you don't know what depends on what. Build the graph first.

You're planning without a spec. Planning on ambiguous requirements is building on sand. Distill first, validate second, decompose third.

## TDD Integration

Planning outputs become TDD inputs. This section documents the handoff chain from validated plan to test-driven implementation.

### Handoff Flow

```
Planning (this skill)          TDD (use-hivemind-tdd)
─────────────────────          ──────────────────────
Spec distillation        →     Acceptance criteria extraction
Phase decomposition     →     Test suite scoping (per-slice)
Slice definition         →     RED phase (failing tests first)
Validation gate          →     GREEN phase (minimum passing code)
Re-decomposition         →     REFACTOR phase (clean while green)
Carry-forward            →     Verification gate evidence
```

### How Planning Outputs Map to TDD Inputs

| Planning Artifact | TDD Consumer | Purpose |
|-------------------|-------------|---------|
| Requirement atoms (Five-Bucket) | Acceptance criteria per test case | Each functional atom becomes ≥1 test |
| Phase gates (`npx tsc`, `npm test`) | TDD cycle gates | Same commands, different phase role |
| Slice `in_scope` / `out_of_scope` | Test boundary definition | In-scope = test must cover; out-of-scope = test must not assert |
| Dependency graph edges | Test execution order | Dependents run after their dependencies green |
| Ambiguity map (Clear tag) | Test assertion source | Clear requirements map to unambiguous assertions |
| Feasibility evidence | TDD pre-condition check | Target must exist before RED phase writes tests |

### Coordination Rules

1. **Spec must validate before TDD starts.** Never enter RED phase on ambiguous requirements. Return to Spec Distillation.
2. **One slice = one TDD cycle.** RED → GREEN → REFACTOR within slice boundaries. No cross-slice TDD.
3. **Re-decomposition triggers TDD reset.** When a slice re-decomposes, discard its test suite and start RED fresh on the new slices.
4. **Planning carries the what; TDD carries the how.** Planning says "this slice implements X." TDD says "here's the test proving X works."

## Sibling Skills

| Parent | This Skill | Depth Partner | TDD Partner |
|--------|-----------|---------------|-------------|
| use-hivemind | use-hivemind-planning | use-hivemind-delegation | use-hivemind-tdd |

This skill consolidates: `use-hivemind-planning` (lifecycle + retraceability), `use-hivemind-planning` (decomposition methodology), `hivemind-spec-driven` (requirement extraction), and `hivemind-codemap` (feasibility scanning). Detailed references, templates, and scan helpers live in the respective `references/` directories.

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Ambiguity Taxonomy | `references/ambiguity-taxonomy.md` | Classification of requirement ambiguity types |
| Decomposition Steps | `references/decomposition-steps.md` | Step-by-step task decomposition protocol |
| Dependency Ordering | `references/dependency-ordering.md` | Dependency graph construction and topological sort |
| Phase Numbering | `references/phase-numbering.md` | Phase numbering conventions and hierarchy |
| Plan Execution | `references/plan-execution.md` | Plan execution tracking and progress reporting |
| Plan Lifecycle | `references/plan-lifecycle.md` | Plan creation through completion lifecycle |
| Plan to Delegation | `references/plan-to-delegation.md` | Converting plans to delegation packets |
| Planning Lifecycle | `references/planning-lifecycle.md` | End-to-end planning process lifecycle |
| Re-Decomposition Protocol | `references/re-decomposition-protocol.md` | When and how to re-decompose failed slices |
| Slice Splitting Heuristics | `references/slice-splitting-heuristics.md` | Heuristics for splitting work into slices |
| Verification Before Completion | `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |
| Extract Requirements | `scripts/extract-requirements.sh` | Bash helper for requirement extraction |
| Decomposition Plan | `templates/decomposition-plan.json` | JSON template for decomposition plans |
| Plan Record | `templates/plan-record.md` | Template for plan record documentation |
| Slice Template | `templates/slice-template.json` | JSON template for work slices |
| Spec Candidate | `templates/spec-candidate.md` | Template for spec candidate documents |
| Basic Decomposition | `tests/basic-decomposition.md` | Test for basic decomposition scenario |
| Direct Invocation | `tests/direct-invocation.md` | Test for direct skill invocation |
| Parallel Candidates | `tests/parallel-candidates.md` | Test for parallel candidate handling |
| Plan Scenario | `tests/plan-scenario.md` | Test for full planning scenario |
| Re-Decomposition | `tests/re-decomposition.md` | Test for re-decomposition protocol |
