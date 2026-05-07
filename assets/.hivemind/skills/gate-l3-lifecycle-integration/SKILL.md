---
name: gate-l3-lifecycle-integration
description: >
  Internal quality gate that evaluates whether Hivemind harness implementations
  correctly participate in the runtime lifecycle — covering 9-surface mutation
  authority, CQRS boundaries, actor hierarchy, event-driven wiring, classification
  fit (src/ vs .opencode/ vs .hivemind/), and OpenCode SDK surface compliance.
  Synthesized from .planning/codebase/ARCHITECTURE.md (9-surface authority table)
  and ingested @opencode-ai/plugin SDK v1.14.28 docs (tool(), hook() signatures).
  Use when performing a lifecycle gate check, auditing harness module integration,
  verifying CQRS boundary compliance, checking delegation hierarchy constraints,
  evaluating tool/hook registration correctness, running a harness quality gate,
  validating plugin composition integrity, or running phase audit on src/ modules.
  Activates during code review of src/ files, phase audit, milestone verification,
  integration check, and deployment readiness workflows.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "2.0.0"
  classification: internal-quality-gate
  synthesis-source: ARCHITECTURE.md + @opencode-ai/plugin SDK docs
  triad-position: entry
  triad-siblings: [gate-spec-compliance, gate-evidence-truth]
  triad-flow: "lifecycle → spec compliance → evidence truth"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Gate: Lifecycle Integration

Internal quality gate for Hivemind harness architecture compliance. Not for end-user
shipping. Activates during every gatekeeping workflow related to harness or OpenCode
integration work.

## Activation Detection

Load this skill when:
- Code review of files in `src/` (any subdirectory)
- Phase audit or milestone verification touching harness modules
- Integration check after tool/hook/delegation changes
- Deployment readiness for `hivemind` npm package
- Any workflow referencing `gate-lifecycle-integration`

## Do NOT Load

Skip when working on `.opencode/` soft meta-concept authoring, end-user feature
development, non-Hivemind code reviews, documentation, or artifacts in
`src/shared/`/`src/schema-kernel/` (use lighter classification check instead).

## Two-Halves Classification (Q6)

Every artifact must land in exactly one of three roots:

| Root | Contents | State Authority |
|------|----------|-----------------|
| `src/` (Hard Harness) | Tools, hooks, plugin, shared, lib | Writes to `.hivemind/` via managers only |
| `.opencode/` (Soft Meta-Concepts) | Skills, agents, commands, rules | No persistent state — OpenCode primitives only |
| `.hivemind/` (Deep Module State) | Journals, continuity, delegation records | Canonical state root (Q6) |

Cross-contamination between roots is a **BLOCK** finding. Tools never write to
`.opencode/`. Hooks never write to `.hivemind/` directly — they route through
`DelegationManager` or `continuity.ts`.

## 9-Surface Mutation Authority

The architecture defines 9 surfaces across write-side (4), read-side (3), and
assembly (1). Each artifact must conform to its surface's authority boundaries.

> **Full table with constraints**: `references/nine-surface-authority.md`
>
> Source: `.planning/codebase/ARCHITECTURE.md` § "9-Surface Mutation Authority"

Quick summary — write-side: `continuity.ts`, `delegation-persistence.ts`,
`session-journal.ts`, `DelegationManager`. Read-side: hooks, tools, sidecar.
Assembly: `plugin.ts`.

## OpenCode SDK Surface Compliance

Validate against the real `@opencode-ai/plugin` v1.14.28 API surface. Three areas:

1. **tool() factory**: `description`, `args` (Zod), `execute` → string. Registered in plugin.ts.
2. **Hook handlers**: Exactly 4 hooks (`tool.execute.before/after`, `experimental.session.compacting`, `shell.env`).
3. **Plugin composition**: Async function, type-only imports, no inline business logic, lazy PTY.

> **Full checklists with real signatures**: `references/sdk-compliance.md`
>
> Additional context: `stack-opencode` skill for broader SDK reference.

## CQRS Boundary Enforcement

Write-side (tools) mutate state via managers. Read-side (hooks) observe events.
Events flow write→read, never reverse. 7 BLOCK-level anti-patterns detect violations
(e.g., `AP-WRITE-FROM-READ`, `AP-CROSS-ROOT-WRITE`, `AP-BYPASS-MANAGER`).

> **Full write/read checklists + anti-pattern table**: `references/cqrs-boundaries.md`
>
> Expanded anti-pattern catalog: `references/anti-patterns.md`

## Delegation Hierarchy Constraints

Validate against runtime constants from `src/lib/types.ts`:

| Constant | Value | Meaning |
|----------|-------|---------|
| `MAX_DELEGATION_DEPTH` | 3 | Max nested delegation depth |
| `MAX_DESCENDANTS_PER_ROOT` | 10 | Max child delegations per root session |
| `STABLE_POLLS_REQUIRED` | 3 | Consecutive unchanged polls for completion |
| `TASK_CLEANUP_DELAY_MS` | 600000 | Grace period before cleanup (10 min) |

Check: uses `DelegationManager.dispatch()`, valid category, depth ≤ 3, WaiterModel
dispatch, dual-signal completion, recovery guarantee via `recoverPending()`.

## Decision Tree

```
START → Classify the artifact by file location:
  ├─ src/tools/*.ts → TOOL: tool() registration, Zod, response envelope,
  │     SDK mutation via session-api.ts, state via continuity.ts, LOC < 200
  ├─ src/hooks/*.ts → HOOK: factory pattern, real SDK signature, CQRS readonly
  ├─ src/lib/*.ts → LIBRARY: dependency ≤ 2 levels, LOC < 500, no `any`, tests
  ├─ src/plugin.ts → COMPOSITION: LOC < 200, all registered, no inline logic
  ├─ src/shared/*.ts, src/schema-kernel/*.ts → LEAF: cross-cutting utility
  └─ DELEGATION participant? → DelegationManager, category, depth, dual-signal
```

For each branch, execute the detailed checklist in `references/evaluation-checklist.md`.

## Self-Correction

### Mode 1: When Classification Is Ambiguous

If a file straddles two classification roots (e.g., a test helper in `src/shared/` that also reads `.hivemind/` state), classify by primary purpose. Helpers that are pure utility = LEAF (src/shared/). Helpers that read persistent state = suspect — check if they route through a manager. Never classify as LEAF to bypass the lifecycle gate.

### Mode 2: When CQRS Boundary Is Fuzzy

Some tools produce side effects that look like state reads (e.g., delegation-status.ts reads delegation records). This is correct CQRS: the tool reads through a query API, not by subscribing to events. Distinguish: direct event subscription in a tool = BLOCK; query API call in a tool = PASS.

### Mode 3: When Plugin.ts Exceeds LOC Limit

If plugin.ts exceeds 200 LOC but the excess is purely registration boilerplate (many tools/hooks), document the finding as WARNING rather than BLOCK. If the excess includes inline business logic, BLOCK. Registration-only LOC inflation is acceptable; logic inflation is not.

### Mode 4: When Delegation Depth Is At Limit

A delegation chain at exactly MAX_DELEGATION_DEPTH (3) is PASS — the limit is inclusive. However, if depth=3 and the chain also uses queue keys without buildDelegationQueueKey(), flag as WARNING. At-limit depth with correct queue key construction = PASS. At-limit depth with manual key construction = WARNING (fragile).

## Gate Orchestrator Integration

This gate participates in the triad orchestrated by `hm-gate-orchestrator`. The orchestrator manages triad sequencing, state persistence, and cross-gate handoff. When invoked within an orchestrator workflow, this skill is the ENTRY gate. It receives a gate context from the orchestrator and returns a structured lifecycle verdict. See `hm-gate-orchestrator` for full triad lifecycle management.

## Cross-Skill Routing

- **PASSES** → Route to `gate-spec-compliance` (spec-level verification)
- **FAILS (classification)** → STOP. Redesign required — root misplacement needs file move.
- **FAILS (other)** → Document in gate report, fix, re-run before routing to `gate-spec-compliance`.

### Triad Flow

```
gate-lifecycle-integration  →  gate-spec-compliance  →  gate-evidence-truth
  (entry — this skill)          (spec verification)       (terminal — evidence)
```

## Remediation Routing (on FAIL)

| Finding Type | Route To | Action |
|-------------|----------|--------|
| Classification violation | `hm-coordinating-loop` | Move file to correct root |
| Lifecycle wiring issue | `hm-phase-execution` | Fix registration wiring |
| Structural/architectural | `hm-refactor` | Split module, break cycle |
| CQRS boundary violation | `hm-phase-execution` | Fix CQRS wiring |
| Delegation hierarchy | `hm-coordinating-loop` | Redesign dispatch patterns |
| Unknown/unclear failure | `hm-debug` | Root-cause investigation |
| Completion verification | `hm-completion-looping` | Verification loop |
| Triad orchestration | `hm-gate-orchestrator` | Full triad lifecycle, state persistence, re-run |

> Full routing table: `references/remediation-paths.md`

## Evaluation Output

1. Fill `templates/gate-report.md` with findings per dimension
2. Record PASS/FAIL per anti-pattern check
3. Record which 9-surface authority boundary was checked
4. If PASS: note routing to `gate-spec-compliance`
5. If FAIL: list remediations with file:line references and routing target

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/evaluation-checklist.md` | Per-artifact-type audit criteria |
| `references/perspective-rubrics.md` | PM/Architect/Dev scoring rubrics |
| `references/anti-patterns.md` | Full anti-pattern catalog |
| `references/adopted-patterns.md` | Synthesized third-party patterns |
| `references/remediation-paths.md` | Per-finding routing to hm-* skills |
| `references/nine-surface-authority.md` | Full 9-surface mutation authority table |
| `references/sdk-compliance.md` | OpenCode SDK compliance checklists |
| `references/cqrs-boundaries.md` | CQRS boundary rules + BLOCK anti-patterns |
| `references/gap-documentation.md` | Full gap catalog |
| `references/triad-flow.md` | Inter-gate handoff contracts |
| `metrics/rich-gate-scorecard.md` | RICH-8 scorecard |
| `evals/evals.json` | Test scenarios |
| `templates/gate-report.md` | Standardized report template |
| `scripts/run-gate-eval.sh` | Deterministic evaluation runner |
