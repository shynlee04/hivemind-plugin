---
name: hivemind-gatekeeping
description: Loop control and synthesis gates — checkpoints, carry-forward compression, cascading failure recovery, and iterative loop governance.
---

# hivemind-gatekeeping


**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/` for Hivemind, `.claude/` for Claude Code, `.cursor/` for Cursor)
- `{activity_dir}` — Activity artifacts directory (e.g., `{runtime_state_dir}/activity/`)
- `{session_state_file}` — Session continuity state file (e.g., `{activity_dir}/sessions/continuity.json`)
- `{delegation_dir}` — Delegation artifacts directory (e.g., `{activity_dir}/delegation/`)
- `{pathing_config}` — Pathing configuration file (e.g., `{runtime_state_dir}/pathing/active-paths.json`)
- `{delegation_registry}` — Delegation registry file (e.g., `{delegation_dir}/registry.json`)

## Table of Contents

- [Load Position](#load-position)
- [When to Activate](#when-to-activate)
- [Loop Setup](#loop-setup)
- [Iteration Rules](#iteration-rules)
- [Synthesis Gates](#synthesis-gates)
  - [The Four Checks](#the-four-checks)
  - [When a Gate Fails](#when-a-gate-fails)
- [Evidence-Based Gatekeeping](#evidence-based-gatekeeping)
  - [Claim vs. Evidence](#claim-vs-evidence)
  - [Excuse Prevention](#excuse-prevention)
  - [Gate Evidence Record](#gate-evidence-record)
- [Incremental Gatekeeping](#incremental-gatekeeping)
  - [Gate Granularity](#gate-granularity)
  - [File-Level Gate](#file-level-gate)
  - [Module-Level Gate](#module-level-gate)
  - [Phase-Level Gate](#phase-level-gate)
- [Cross-Team Boundary Gatekeeping](#cross-team-boundary-gatekeeping)
  - [Pre-Commit Boundary Check](#pre-commit-boundary-check)
  - [Post-Implementation Contract Check](#post-implementation-contract-check)
  - [Scope Violation Detection](#scope-violation-detection)
- [Bead Tracking](#bead-tracking)
- [Integration Verification](#integration-verification)
- [Review Gates](#review-gates)
- [Cascading Failure](#cascading-failure)
  - [Parallel Collapse (>50% Fail)](#parallel-collapse-50-fail)
  - [Same Failure, 3+ Iterations](#same-failure-3-iterations)
  - [Decision Matrix](#decision-matrix)
- [Anti-Patterns](#anti-patterns)
- [Storage](#storage)
- [Bundled Resources](#bundled-resources)

## Load Position

Layer: Depth. Requires `use-hivemind-delegation` loaded first.

## When to Activate

Activate this skill for workflow loops. Not one-shot delegation — actual multi-pass iteration where each pass depends on what the last one found. Think audits that go deeper each round, debug sessions that narrow findings, research that synthesizes across passes.

Load it when any of these show up:

- A workflow has `max_iterations` and `stop_conditions`
- Parallel slices need integration verification after they return
- A checkpoint is needed to track what happened across iterations
- Carry-forward compression matters because context is tight
- Cascading failures risk blowing up the whole pass

Don't load it for single-pass delegation — that's `use-hivemind-delegation` territory. Don't load it for domain-specific loops (TDD, debug, refactor, research) — those domain skills handle their own loop control.

## Loop Setup

Every multi-pass delegation starts with a loop checkpoint. Before dispatching anything:

1. **Set `max_iterations`** — default 10, tighten for simple scopes, loosen for complex audits
2. **Define `stop_conditions`** — at least 2 conditions required, never fewer. Examples: "all files scanned," "no new findings in last pass," "coverage above 90%"
3. **Initialize the checkpoint** at `{activity}/delegation/{loop_id}-checkpoint.json`
4. **Set `cleanup_allowed: "no"`** — stays no while the loop is active, only the orchestrator can flip it

The checkpoint is the loop's memory. Not chat history, not operator notes — the JSON file. That's what survives compaction.

## Iteration Rules

Each iteration is a contract. It must deliver:

**Carry-forward** — ≤5 items max. These are the key findings, discovered blockers, and paths to detailed output files. Not the full scan results. Those live in their own output files. The carry-forward is a compressed summary for the next iteration's context.

The rules are simple but non-negotiable:

- Read the checkpoint before deciding what the next iteration does
- Stop when any stop condition fires — never push past `max_iterations`
- If blocked, record `blocked_reason` and set `status: "blocked"`
- Never run parallel iterations — each one depends on the previous carry-forward
- If carry-forward exceeds 5 items, merge related findings until hitting the limit

## Synthesis Gates

After each iteration, output passes through a gate. No gate pass, no next iteration. Period.

### The Four Checks

| Check | Pass Condition |
|-------|----------------|
| `carry_forward_populated` | carry_forward array has 1–5 items |
| `coverage_status_updated` | coverage_status reflects actual progress, not last iteration's status |
| `no_contradictions` | findings don't contradict what prior carry-forwards said |
| `output_written` | output_path points to a file that actually exists |

### When a Gate Fails

Don't push through. Don't "fix it next iteration." Stop.

1. Set gate result to `fail` or `conditional`
2. Pause the loop — `status: "paused"`
3. Emit a gate failure report listing exactly which checks failed
4. Wait for orchestrator decision: `continue`, `pause`, or `abort`
5. Do not proceed until the gate passes

Gate results live at `{activity}/delegation/{loop_id}-gate-{iteration}.json`.

## Evidence-Based Gatekeeping

<HARD-GATE>
Every gate check must point to specific evidence, not claims. A claim is an assertion without proof. Evidence is command output, file content, or a verifiable artifact. Gates that pass on claims alone are theater — they create false confidence.
</HARD-GATE>

### Claim vs. Evidence

| Claim | Required Evidence | Not Sufficient |
|-------|-------------------|----------------|
| "Tests pass" | Output of running the test suite (e.g., `npm test`, `pytest`, `cargo test`) with all green | Agent saying "tests pass" |
| "Code is clean" | Output of type checking (e.g., `npx tsc --noEmit`, `mypy`, `go vet`) with zero errors | "No errors found" in chat |
| "Agent completed" | Diff showing actual changes (e.g., `git diff`) | "Done" status message |
| "Build succeeds" | Output of building the project (e.g., `npm run build`, `cargo build`, `make`) with exit code 0 | "Build looks fine" |
| "No lint violations" | Output of linting (e.g., `npm run lint`, `ruff check`, `golangci-lint`) with zero warnings | "Code style is good" |
| "Types are correct" | Output of type checking (e.g., `npx tsc --noEmit`, `mypy`) | "Types check out" |

### Excuse Prevention

| Excuse | Reality |
|--------|---------|
| "It should compile" | Should ≠ does. Run the command. |
| "Tests take too long" | Faster to run them now than debug failures in production. |
| "I'll verify at the end" | End-of-sprint verification is a death march, not a workflow. |
| "The change is trivial" | Trivial changes break trivially. Test them. |
| "I'm confident it works" | Confidence ≠ evidence. Period. |

### Gate Evidence Record

Every gate result must include an `evidence` object:

```json
{
  "gate_id": "synthesis-3",
  "checks": {
    "type_check_clean": { "passed": true, "evidence": "Type checker output (e.g., npx tsc --noEmit — 0 errors)" },
    "tests_green": { "passed": true, "evidence": "Test suite output (e.g., npm test — 42/42 passed)" },
    "build_ok": { "passed": true, "evidence": "Build output (e.g., npm run build — exit 0)" }
  }
}
```

If a check has no evidence field, it fails. No exceptions.

## Incremental Gatekeeping

Gates aren't just per-iteration. They're per-file, per-module, per-phase. Catching a failure at the file level takes seconds. Catching it at the project level takes minutes and hides which change caused it.

### Gate Granularity

| Level | When | Verification | Pass Condition |
|-------|------|--------------|----------------|
| **File** | After each file is modified | Targeted test for that file's module | Module test passes |
| **Module** | After each module is complete | Module integration tests | All module tests pass |
| **Phase** | After each phase is complete | Full test suite + lint + type check | All checks green |
| **Project** | Before handoff | Run test suite, type checking, lint, and build (adapt to project toolchain) | All gates pass |

### File-Level Gate

After modifying `src/tools/trajectory/handler.ts`:

```bash
# Run targeted test for the modified file (e.g., npx tsx --test tests/trajectory-handler.test.ts or equivalent)
```

If the targeted test fails, stop. Fix before moving to the next file.

### Module-Level Gate

After completing all files in `src/tools/trajectory/`:

```bash
# Run all tests for the completed module (e.g., npx tsx --test tests/trajectory-*.test.ts or equivalent)
```

All trajectory-related tests must pass before the module is considered done.

### Phase-Level Gate

After completing a phase (e.g., "implement trajectory tool"):

```bash
# Run full verification suite (e.g., npm test && npx tsc --noEmit && npm run lint — adapt to project toolchain)
```

Full suite. No shortcuts.

<HARD-GATE>
Never skip file-level gates to "save time." A file-level failure caught in 5 seconds becomes a phase-level debugging session in 5 minutes. Run targeted tests after every file change.
</HARD-GATE>

## Cross-Team Boundary Gatekeeping

When multiple agents work on the same codebase, gates must check for cross-boundary violations. An agent touching files outside its authority surface is a scope violation — and it won't show up in a single-agent gate.

### Pre-Commit Boundary Check

Before committing, always run:

```bash
# Check working tree status (e.g., git status or equivalent)
# Review staged and unstaged changes (e.g., git diff --stat or equivalent)
```

Check for:
- Uncommitted changes from other agents (files not modified by this agent)
- Changes to files outside the delegated scope
- Shared files (`src/shared/types.ts`, `src/schema-kernel/`) modified by multiple agents

### Post-Implementation Contract Check

After implementation, dispatch a verification agent to check:

1. **Import compatibility** — do adjacent modules still import the exported symbols?
2. **Type compatibility** — did type changes break downstream consumers?
3. **API contract** — do tool schemas still match what hooks expect?

### Scope Violation Detection

| Check | When | Fails If |
|-------|------|----------|
| `git diff --stat` against delegated paths | Before commit | Modified files outside `authority_surfaces` |
| Import analysis on adjacent modules | After implementation | Broken imports in consuming modules |
| Type compatibility check | After type changes | Downstream type errors |
| Shared-state mutation check | After parallel slices | Multiple agents mutated same file |

<HARD-GATE>
Scope violations are caught at the gate, not after merge. If an agent touched `src/core/` when its scope was `src/tools/`, the gate fails. Fix the scope or revert the changes — don't push forward.
</HARD-GATE>

## Bead Tracking

Finer grain than "iteration done" is sometimes needed. Beads track file-by-file, batch-by-batch progress inside a single iteration:

```json
{
  "bead_id": "audit_batch_2",
  "total_items": 20,
  "completed": 14,
  "remaining": 6,
  "blocked": 0,
  "items": [
    { "path": "src/tools/runtime/tools.ts", "status": "done", "findings": 2 }
  ]
}
```

Use beads when an iteration touches many files and exact progress tracking is needed. Skip them for small iterations — don't over-engineer.

## Integration Verification

When parallel slices come back, do not just merge and move on. Verify they actually work together.

1. Run integration tests against all results simultaneously
2. Check for import conflicts — same symbol, different sources
3. Check for type collisions — same type name, different definitions
4. Check for shared-state races — concurrent mutations to the same state
5. Pinpoint which specific slice caused each conflict
6. Re-delegate only the conflicting slice — don't nuke all of them

If two slices both modify `src/shared/types.ts` and produce incompatible definitions, re-delegate the one that's wrong. Don't re-run both.

## Review Gates

Review gates sit between phases. After a batch completes, before verification begins, a review gate checks output completeness, cross-reference validity, and pattern compliance. Unlike synthesis gates (which control iteration loops), review gates control phase transitions.

For full review gate protocol, see `references/review-gate.md`.

For integration checkpoints that verify parallel batch composition, see `references/integration-checkpoint.md`.

## Cascading Failure

When things go wrong at scale, a plan is needed.

### Parallel Collapse (>50% Fail)

Stop everything. The slices aren't the problem — the decomposition is. Reassess how the work was split before trying again.

### Same Failure, 3+ Iterations

If the same type of failure keeps showing up across iterations, the loop approach is wrong. Not the iterations — the approach. Stop the loop, escalate to the orchestrator with the failure pattern, and consider re-planning from scratch.

### Decision Matrix

| Situation | Action |
|-----------|--------|
| Same slice fails twice, different errors | Re-delegate with tighter constraints |
| Same slice fails twice, same error | Re-plan — slice boundary is wrong |
| >50% parallel failure | Re-plan — decomposition is wrong |
| Iteration produces contradictions | Re-plan — loop structure is wrong |

## Anti-Patterns

**Running without max_iterations.** This builds an infinite loop. Session exhaustion is not a feature.

**Stuffing full output into carry_forward.** Context bloat kills subagents. Reference the file path instead.

**Ignoring stop conditions.** Diminishing returns produce contradictory findings. Stop when the conditions say stop.

**Starting an iteration without reading the checkpoint.** Duplicates work and breaks the evidence chain. The checkpoint exists for a reason.

**Relying on chat memory for loop state.** Compaction erases it. The checkpoint file is the only durable record.

**Re-delegating all slices on one integration failure.** Waste of resources. Isolate the conflicting slice and fix that one.

**Skipping the synthesis gate.** Gate failures exist to catch problems before they cascade. Skipping them is skipping safety.

**Running parallel iterations.** Iterations are sequential by design. Each one reads the previous carry-forward. Parallel iterations means duplicate context and conflicting decisions.

**Trusting agent success reports without evidence.** Agent says "done" — gate passes without running a verification command. This is the most dangerous anti-pattern because it looks like progress. It's not. It's a lie discovered in production.

**Gate without output.** Checking boxes without running actual commands. "Tests pass" checked but the test suite never ran. A gate with no output is a gate that doesn't exist.

**Incremental skip.** Running only the full suite, not targeted module tests. Hides where the failure was introduced. A failing test in `src/tools/trajectory/` could have been caused by a change in `src/shared/types.ts` — but this never surfaces if only the full suite runs without bisecting.

**Cross-team blind spot.** Not checking for other agents' changes before committing. A clean diff merges, but the agent working on `src/hooks/` also touched the same file. Now a conflict shows up 3 commits later when it's 10x harder to trace.

## Storage

Loop checkpoints: `{activity}/delegation/{loop_id}-checkpoint.json`
Gate results: `{activity}/delegation/{loop_id}-gate-{iteration}.json`
Scan-specific loops: `{activity}/codescan/{pass_id}/loop-checkpoint.json`

## External Verification MCP Matrix

| Verification Need | Preferred MCP Tool | Why |
| --- | --- | --- |
| validate library behavior | `context7_query-docs` | current versioned docs |
| validate public repo patterns | `deepwiki_ask_question` | repository-grounded answers |
| gather external supporting evidence | `tavily_tavily_search` | current web discovery |

## Cross-Skill Verification Chain

1. `use-hivemind-delegation` dispatches bounded slices.
2. `hivemind-synthesis` compresses multi-slice findings.
3. `hivemind-gatekeeping` checks evidence, contradictions, and carry-forward quality.
4. `hivemind-atomic-commit` is loaded only after gates truly pass and a commit is requested.

## Gate Escalation Decision Tree

1. **IF** a gate lacks command evidence, **THEN** fail the gate immediately.
2. **IF** one slice fails integration while others pass, **THEN** isolate the failing slice instead of restarting the whole batch.
3. **IF** the same gate fails repeatedly with no new evidence, **THEN** stop the loop and escalate.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Delegation protocol that triggers this skill |
| `hivemind-synthesis` | Pre-gatekeeping on synthesized SDK — feeds into synthesis gates |
| `hivemind-codemap` | Scan results that pass through gate checks |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/iterative-loop-control.md` | Checkpoint schema, loop rules, carry-forward compression, bead tracking |
| `references/synthesis-gates.md` | Gate checks, failure handling, gate result format |
| `references/integration-verification.md` | Parallel integration verification procedures |
| `references/cascading-failure.md` | Cascading failure detection and recovery |
| `templates/loop-checkpoint.md` | Loop checkpoint JSON template |
| `templates/synthesis-gate-result.md` | Gate result JSON template |
| `tests/iterative-loop.md` | Iterative loop scenario with validation |
| `tests/cascading-failure.md` | Cascading failure scenario with validation |
| `references/evidence-based-gatekeeping.md` | Evidence requirements for every gate check, excuse prevention |
| `references/review-gate.md` | Review gate checkpoints between phases |
| `references/integration-checkpoint.md` | Integration verification for parallel batch completion |

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run the artifact validation script (e.g., `bash scripts/hm-artifact-validate.sh {path}` or equivalent) to confirm compliance.
