# ses_2bbb

**Session ID:** ses_2bbb
**Created:** 3/31/2026, 9:20:26 PM
**Updated:** 3/31/2026, 9:24:16 PM

---

## Table of Contents

| # | Timestamp | Actor | Tools | Summary |
|---|-----------|-------|-------|---------|

---
## User



---
## User



---
## User



---
**Tool:** skill

**Input:**
```json
{"name":"use-hivemind-delegation"}
```

**Output:**
```
<skill_content name="use-hivemind-delegation">
# Skill: use-hivemind-delegation

# use-hivemind-delegation


**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/` for Hivemind, `.claude/` for Claude Code, `.cursor/` for Cursor)
- `{activity_dir}` — Activity artifacts directory (e.g., `{runtime_state_dir}/activity/`)
- `{session_state_file}` — Session continuity state file (e.g., `{activity_dir}/sessions/continuity.json`)
- `{delegation_dir}` — Delegation artifacts directory (e.g., `{activity_dir}/delegation/`)
- `{pathing_config}` — Pathing configuration file (e.g., `{runtime_state_dir}/pathing/active-paths.json`)
- `{delegation_registry}` — Delegation registry file (e.g., `{delegation_dir}/registry.json`)

Local delegation family for the refactored pack. Governs when, how, and with what constraints a front-facing agent dispatches work to subagents.

## Purpose

- Decide whether delegation is actually needed — delegation is mandatory when criteria are met
- Bound scope before any handoff
- Choose sequential vs parallel mode deterministically
- Emit reusable delegation packets and handoff briefs
- Recover from failures, partial returns, and blocked routes

## Use This For

- User explicitly asks to delegate or split work
- Router stages produce multiple bounded slices
- Role or authority boundaries must be explicit before handoff
- Verification, research, planning, and execution need different packets
- Work spans >3 files or requires deep reads the orchestrator must not do
- Session context is stale or suspect and fresh subagent context is needed

## Table of Contents

- [Use This For](#use-this-for)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Sibling Skills](#sibling-skills)
- [Delegation Decision Rules](#decision-rules)
- [Topology Decision Rules](#topology-decision-rules)
- [Task Decomposition Rules](#task-decomposition-rules)
- [Agent Selection](#agent-selection)
- [Task Extraction from Plan](#task-extraction-from-plan)
- [Orchestrator Protection](#orchestrator-protection)
- [How-To-Process vs How-To-Implement in Packets](#how-to-process-vs-how-to-implement)
- [Core Protocol](#core-protocol)
- [Shared Return Contract](#shared-return-contract)
- [Post-Return Protocol](#post-return-protocol)
- [Delegation Modes](#delegation-modes)
- [Role Boundaries](#role-boundaries)
- [Failure and Recovery](#failure-and-recovery)
- [Codescan Delegation](#codescan-delegation)
- [Investigation Swarm Delegation](#investigation-swarm-delegation) *(detailed: references/investigation-swarm.md)*
- [Hierarchical Consumption](#hierarchical-consumption) *(detailed: references/hierarchical-consumption.md)*
- [Multi-Wave Dispatch Protocol](#multi-wave-dispatch-protocol)
- [Granularity Enforcement](#granularity-enforcement)
- [Context Window Management](#context-window-management)
- [Iterative Loop Control](#iterative-loop-control)
- [Session Resume in Delegation](#session-resume)
- [Workflow Example](#workflow-example)
- [Bundled Resources](#bundled-resources)
- [Independence Rules](#independence-rules)

## Anti-Patterns to Avoid

**NEVER dispatch without checking the active delegation registry.** Before creating a new delegation packet, read `{delegation_registry}`. If a prior delegation covers the same scope and is still active or pending, do not create a duplicate. Re-use or resume the existing one.

**NEVER create packets without verifying parent workflow state.** If dispatched by an orchestrator, check the parent's planning documents, governance files, and workflow phase before emitting sub-delegations. A child that doesn't know the parent's goals will fragment the workflow.

**NEVER delegate recursively without consuming carry-forward.** If the delegation packet includes carry-forward from a parent wave, read and integrate that carry-forward (≤5 findings, blocked routes, next action) before dispatching children. Skipping parent context is a context integrity failure.

**NEVER assume the user's next prompt resets the delegation chain.** The next agent in the sequence may receive a user message that appears disconnected from prior work. That agent must check the delegation registry, workflow state, and the session continuity file before acting — not assume the user's message means "start fresh."

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Router that triggers this skill — delegates slices here |
| `hivemind-codemap` | Codescan mode — this skill owns handoff discipline; codemap owns scan mechanics |
| `hivemind-system-debug` | Debug mode — debug delegation dispatches through this protocol |
| `hivemind-spec-driven` | Planning mode — distillation outputs feed into planning delegation |
| `use-hivemind-context` | Stale session probe — delegate this when orchestrator context is suspect |
| `use-hivemind-git-memory` | Git-aware continuity — commit SHAs and branch state recorded in packets |
| `hivemind-gatekeeping` | Iterative loops, synthesis gates, cascading failure — extracted from this skill |
| `hivemind-synthesis` | Investigation swarm orchestration — coordinates parallel hivexplorer waves through this protocol |

`activity_type` and `phase_type` enum values are defined in the pack-level AGENTS.md under Typed Activity Contract.

## Delegation Decision Rules

Delegate when **any** of:
1. Work touches >3 files
2. Work requires deep reads the orchestrator must not do (session freshness rule)
3. Work has independent verification needs (separate verification agent)
4. Session context is stale or suspect
5. Multiple concerns (read + write + verify) must be handled by different authority levels
6. The user explicitly requests delegation or splitting

Do NOT delegate when:
1. Single-file edit with clear scope and fresh context
2. Task completable in <3 inline actions
3. Scope is unclear — clarify first, then decide

**Delegation has overhead**: packet creation, subagent dispatch, return synthesis. For small tasks, overhead may exceed inline execution cost. But session freshness always wins — if context is suspect, delegate regardless of task size.

**Delegation is mandatory, not optional.** If criteria are met, the orchestrator MUST emit a packet. Failure to delegate when required is a session discipline violation.

### Granularity Enforcement (MANDATORY)

| Rule | Threshold | Action |
|------|-----------|--------|
| File count | >3 files | MUST decompose into sub-tasks |
| LOC written | >500 LOC | NEVER in one task — split by concern or file cluster |
| Parallel writes | Same domain | FORBIDDEN — sequential only |
| Parallel dispatch | Independent READ-only | RECOMMENDED for deep investigation or token-heavy research |

If a slice exceeds 500 LOC, reject the packet and re-plan decomposition. No exceptions.

## Topology Decision Rules

Choose the dispatch topology before emitting packets:

| Topology | When | Independence |
|----------|------|-------------|
| **Single agent** | Simple, isolated task | N/A |
| **Parallel** | Independent slices, no shared state | Must prove independence |
| **Sequential** | Output of agent A feeds agent B | Ordered dependency |
| **Wave** | Sequential batches of parallel agents | See Multi-Wave Dispatch Protocol |

**Decision:** If slices share files or mutable state → sequential. If isolated → parallel. If multi-phase → wave.

## Task Decomposition Rules

Decompose large tasks before delegating. Use this priority order:

1. **Authority surface boundaries first** — separate tools from hooks from core from shared
2. **Concern type second** — split read-only from write-capable from verification
3. **File cluster third** — group files that share imports or interfaces

Each slice should be:
- Completable in one subagent pass (≤5 files per slice)
- Self-contained (does not depend on another slice's output unless sequential is chosen)
- Bounded by explicit out-of-scope (what the slice must NOT touch)

If a slice needs >5 files, split further. If a slice mixes read and write, split by concern.

## Agent Selection

Match task type to agent. Fallbacks exist when the primary agent is unavailable:

| Task | Agent | Fallback |
|------|-------|----------|
| Implementation | hivemaker | build |
| Testing | hitea | build |
| Verification | hiveq | explore |
| Debugging | hivehealer | general |
| Planning | hiveplanner | plan |
| Architecture | architect | plan |
| Code review | code-skeptic | general |
| Research | hiverd | explore |
| Scanning/Investigation | hivexplorer | explore |
| Complex coordination | handoff | general |

## Task Extraction from Plan

When consuming a plan for delegation:

- Each plan phase → delegation packet
- Each slice → one subagent task
- Each gate → verification before next phase
- Plan phases feed waves: investigation → research → planning → implementation → verification

## Orchestrator Protection

When delegation is triggered from the detox router or any polluted-context session:

1. **The orchestrator emits the packet; the subagent does the work.** The orchestrator must not perform deep reads, scans, or audits itself.
2. **Return contracts must include a compressed carry-forward** (≤5 findings + blocked routes + next action + output paths). The orchestrator does NOT read full output files — only summary fields and output paths.
3. **If the orchestrator catches itself doing multi-file reads after dispatching a delegation,** STOP immediately and wait for the subagent return. This is a session discipline violation — not a minor one.
4. **Stale context is always a delegation trigger** regardless of task size. If the orchestrator's accumulated context becomes unreliable, delegate a fresh `use-hivemind-context` probe instead of continuing with suspect information.
5. **Delegation is mandatory when criteria are met.** The orchestrator may not choose to do deep work itself when the decision rules above indicate delegation is required.

<HARD-GATE>
The orchestrator must never do deep work when delegation criteria are met. Reading more than 2 code files sequentially after dispatching violates the mandate. STOP. Wait for the subagent. The orchestrator that investigates is the orchestrator that stops orchestrating.
</HARD-GATE>

## How-To-Process vs How-To-Implement in Packets

Delegation packets tell the subagent **what process to follow**, never **how to write the code**. This is the single most common delegation mistake.

**HOW-TO-PROCESS (correct):**
- What skills to load (e.g., "load `hivemind-codemap` before scanning")
- Coordination with other agents (e.g., "wait for research return before implementing")
- Expected output format (e.g., "return findings as JSON with file:line refs")
- Success metrics (e.g., "all tests pass, no type errors")
- Pre/post workflows (e.g., "run type checking before returning" — e.g., `npx tsc --noEmit` for TypeScript)
- Self-verification requests (e.g., "verify build succeeds before claiming complete")
- Evidence output paths to correct domain-specific activity paths

**NOT HOW-TO-IMPLEMENT (never do this):**
- Never specify the actual code to write
- Never prescribe the specific algorithm
- Never dictate the exact function signature
- Never write pseudocode the child must follow

**Correct packet excerpt:**
```json
{
  "scope": "Investigate test failures in src/tools/trajectory/",
  "constraints": ["read-only", "no file mutations"],
  "skills_to_load": ["hivemind-codemap"],
  "success_metrics": "All failing tests identified with file:line references",
  "output_path": "{activity_dir}/codescan/pass-01/",
  "return_format": "JSON with findings array, each item has file, line, reason"
}
```

**Incorrect packet excerpt:**
```json
{
  "scope": "Fix the tests",
  "instructions": "Open trajectory.test.ts, change line 42 to use mockSession instead of realSession, then add a beforeEach that calls setupMocks()"
}
```

The orchestrator says **what** (process). The subagent figures out **how** (implementation).

<HARD-GATE>
If a delegation packet contains specific code to write, algorithms to use, or exact function signatures to implement — the packet is INVALID. The orchestrator says WHAT process to follow. The subagent figures out HOW to implement. Re-write the packet before dispatching.
</HARD-GATE>

## Core Protocol

1. **Confirm delegation is needed** — delegation costs context-switching overhead; use the decision rules above. (See `references/delegation-decision.md` for extended criteria.)
2. **Write the slice boundary** — scope, out-of-scope, constraints, success metrics. Decompose by authority surface, then concern type, then file cluster. (See Task Decomposition Rules above.)
3. **Choose the mode** — `research`, `execution`, `verification`, or `planning`. Each mode has different success tests and return expectations.
4. **Choose execution mode** — `sequential` by default; allow `parallel` only for isolated slices. (See `references/delegation-modes.md` for the parallel gate.)
5. **Tag the work** with `activity_type` and `phase_type` before dispatch. These tags link delegation to the development storyline and enable cross-skill continuity.
6. **Emit a delegation packet and handoff brief** before dispatch. The packet is the contract. The brief is the human-readable summary. (See `templates/delegation-packet.md` and `templates/handoff-brief.md`.)
7. **Require a structured return** with findings, evidence, blocked routes, and next action. (See Shared Return Contract below and `references/failure-recovery.md`.)
8. **Include parent governance** — Always attach references to ongoing planning documents, governance files, and parent workflow state. The subagent must know it was delegated, what the parent's goals are, and how this slice fits the larger picture.
9. **Include stop_conditions** — Every delegation packet MUST include a `stop_conditions` array (see below). A packet without stop_conditions is invalid.

### Stop Conditions (Required in Every Packet)

Every delegation packet MUST include a `stop_conditions` array:

```json
{
  "stop_conditions": [
    "max_iterations_reached: 3",
    "same_failure_twice: escalate to orchestrator",
    "scope_violation: return partial with blocked_routes",
    "token_exhaustion_imminent: return compressed summary",
    "contradiction_with_prior_findings: pause and report"
  ]
}
```

Stop conditions are non-negotiable. Each condition must specify a trigger and the action to take. See `references/hard-stop-conditions.md` for extended stop trigger definitions.

## Shared Return Contract

Every meaningful delegation return must include:

| Category | Fields | Purpose |
|----------|--------|---------|
| **Routing** | `activity_type`, `phase_type`, `mode`, `execution_mode` | Links return to storyline |
| **Identity** | `packet_id`, `task_id`, `pass_id`, `batch_id`, `slice_id` | Enables resume and deduplication |
| **Scope tracking** | `files_checked`, `clean_files`, `blocked_files`, `coverage_gaps` | Proves coverage |
| **Evidence** | `confirmed`, `inferred`, `unverified`, `confidence`, `artifacts_written` | Evidence before assertions |
| **Output** | `output_paths` | Where detailed output lives (orchestrator reads summary only) |
| **Control** | `blocked_routes`, `recommended_next_action`, `open_loop_ids`, `open_packet_ids` | Enables orchestrator routing |

If a child cannot produce this shape, return a bounded partial result rather than pretending the slice is complete. A partial return with `status: "partial"` and populated `blocked_routes` is always better than a fabricated `status: "complete"`.

## Post-Return Protocol

After agents return, follow this 5-step protocol before advancing:

1. **Read evidence bundle** — not just claims. Inspect the actual output files, test results, and artifacts the agent produced.
2. **Check return contract compliance** — does the evidence match the expected return shape (fields, output paths, status)?
3. **Run verification gate** — if code changed → run type checking and tests (e.g., `npx tsc --noEmit` + `npm test` for TypeScript, or equivalent for your language). Do not skip this even if the agent claims tests pass.
4. **Synthesize into compressed carry-forward** — ≤5 findings, blocked routes, recommended next action, output paths. The orchestrator does NOT retain full agent output.
5. **Decide next action** — advance wave, re-dispatch with tighter scope, or gate-fail and escalate.

**No evidence = not done. Period.**

## Delegation Modes

| Mode | Use When | Primary Output | Success Test |
| --- | --- | --- | --- |
| `research` | Evidence or discovery is still missing | handoff brief + findings | All required evidence collected |
| `execution` | The slice is bounded and implementation-ready | handoff brief + slice result | Code compiles, tests pass, scope respected |
| `verification` | The output must be hard proof, not a fix | handoff brief + verification result | All verification checks pass with evidence |
| `planning` | The child should return stages, not edits | handoff brief + bounded plan | Plan covers all known requirements |

Read `references/delegation-modes.md` for sequential-first rules and parallel gate conditions.

## Role Boundaries

**Front-facing agent (orchestrator):**
- Chooses the slice, sets constraints, decides whether child may mutate files
- Emits the delegation packet before dispatch
- Synthesizes returns — does NOT read full output files
- Decides sequential vs parallel
- Handles failures and escalation

**Delegated agent (child):**
- Stays inside scope — never exceeds `authority_surfaces` or `out_of_scope`
- Reports blocked routes instead of improvising new authority
- Returns evidence before conclusions
- Stops when the packet says stop
- Does NOT recursively self-delegate unless the packet explicitly permits it

**Enforcement:** If a child exceeds scope or mutates files outside `authority_surfaces`:
1. Mark the return as `scope_violation`
2. Do NOT merge the child's output
3. Re-delegate with tighter constraints or escalate to user

Read `references/role-boundaries.md` for invalid delegation examples.

## Failure and Recovery

When a delegation fails, returns partial results, or is blocked:

### Partial Return Handling
- Read `status` field: `complete` | `partial` | `blocked`
- If `partial`: check `blocked_routes` and `recommended_next_action` — resume from the action, not from scratch
- If `blocked`: check if the blocker is resolvable; if not, decompose the slice further

### Timeout Protocol
- Set an expected completion window per slice complexity
- If the subagent does not return within 2x the expected window, emit a status probe or abort and re-delegate
- Log timeout events for pattern detection

### Escalation Ladder
1. **Re-delegate** with tighter constraints and more specific guidance
2. **Decompose** the slice if blocked twice — the slice was too large
3. **Escalate to user** with evidence if decomposition still fails
4. **Abort** only if the slice is no longer needed

### Parallel-Slice Failure Isolation
- One failure does NOT abort other parallel slices unless a dependency exists
- Collect all returns before deciding on integration
- If a parallel slice fails and others succeed, integrate successes and re-delegate only the failed slice

For cascading failure and parallel-slice isolation at scale, see `hivemind-gatekeeping`.

Read `references/failure-recovery.md` for detailed recovery procedures, timeout heuristics, and blocked-route resolution patterns.

## Codescan Delegation

For code scanning work, use structured delegation with specific agent selection:
- **`explore` first** for all read-only scans (structure, exports, imports, seams, hotspots).
- **`general` only when** cross-file synthesis or deeper reasoning is needed.
- Track each scan pass through JSON checkpoints at `{activity}/codescan/{pass_id}/`.
- Support multi-pass chaining: `high-level-map` → `pipeline-map` → `journey-map` → `low-level-proof` → `cross-pass-synthesis`, each with its own `pass_id`.

Each deeper scan phase must read the previous phase synthesis artifact first. Do not skip straight to low-level proof while the high-level or pipeline model is still unresolved.

Read `references/codescan-delegation.md` for agent selection table, scan pass structure, resumable scan protocol, and bash helper integration.

## Investigation Swarm Delegation

Use `references/investigation-swarm.md` for full swarm dispatch rules, packet shape, orchestrator discipline, synthesis protocol, and wave-to-wave handoff format.

**Summary:** Launch parallel investigation agents (e.g., `hivexplorer` in Hivemind, or the equivalent subagent in your framework) with one concern per agent. Each returns ≤5 findings with `file:line` refs. The orchestrator reads ONLY compressed synthesis. Parallel within a wave; sequential between waves.

## Hierarchical Consumption

Use `references/hierarchical-consumption.md` for full wave sequencing, between-wave escalation rules, and merge-vs-split decision table.

**Summary:** Wave outputs feed forward. Never skip to implementation without consuming investigation + research synthesis. Carry-forward ≤5 items between waves. Orchestrator reads summary fields and output path only.

## Iterative Loop Control

For iterative loop control, carry-forward compression, synthesis gates, and integration verification, see `hivemind-gatekeeping`.

## Session Resume in Delegation

When delegating across turns or resuming prior delegations:
- Use `task_id` to resume a subagent that has prior context. Without it, the subagent starts fresh.
- Record `task_id` and `pass_id` in the delegation output for future resume.
- Record `branch`, `worktree`, `worktree_role`, `activity_type`, and `phase_type` so resume stays linked to current control context.

### Checking Prior Completion

To determine if a prior delegation completed before re-delegating:
1. Read `{activity}/delegation/{packet_id}-return.json`
2. Check `status` field: `complete` | `partial` | `blocked`
3. If `complete`: compare `scope` to current needs — re-delegate only if scope changed
4. If `partial`: resume from `recommended_next_action` — do not restart from scratch
5. If `blocked`: check `blocked_routes` — if resolvable, re-delegate with the blocker addressed; if not, decompose further
6. If file does not exist: the prior delegation never returned — treat as timeout and re-delegate

### Git-Aware Continuity

When the child must commit:
- Use a worktree — record `worktree` and `worktree_role` in the packet
- Name branches per project convention
- Return artifacts must include commit SHAs if the child committed
- If the child only reads, `worktree` field may be empty

At runtime, delegation packets and handoff briefs may be persisted via the `hivemind_handoff` tool. See the tool's documentation for persistence mechanics.

### Delegation Audit Trail

Append delegation events to `{activity}/delegation/registry.json` with:
- `packet_id`, `concern`, `dispatched_at`, `returned_at`, `status`
- This enables the orchestrator to query active/completed delegations

## Workflow Example

**Scenario:** 3 independent test failures → decompose into 3 slices (each ≤3 files) → dispatch parallel `verification` packets → 2 complete, 1 partial (`blocked: shared/types.ts`) → integrate successes, re-delegate blocked slice with expanded authority.

## Multi-Wave Dispatch Protocol

Complex tasks require multi-wave dispatch, not single-shot delegation.

### Standard Investigation → Research → Planning Flow

**Initial Checkpoint:**
- Packet 1: 3 parallel investigation agent dispatches (e.g., `hivexplorer`) to investigate codebase, dependencies, test coverage → SYNTHESIZE → ≤5 findings output
- Packet 2 (sequential to Packet 1): Combine user prompt + synthesis → dispatch 2 parallel waves (investigation + research agents) for internal cross-validation + external research → SYNTHESIZE → ≤5 findings output
- From Packet 1 + 2 output → decision checkpoint to build master planning

**Checkpoint 2 (Planning):**
- The planning agent (e.g., `hiveplanner`) decomposes into phases with dependency DAG
- architect validates architecture decisions → SYNTHESIZE → plan with gates

### Wave Sequencing

Wave 1 (investigation) → synthesis → Wave 2 (research/planning) → synthesis → Wave 3 (implementation) → synthesis → Wave 4 (verification)

Skip a wave only if the previous wave's synthesis explicitly confirms no gaps remain.

### When to Merge Waves vs Keep Separate

| Scenario | Action |
|----------|--------|
| Waves cover independent domains | Keep separate — parallel dispatch |
| Wave 2 depends on Wave 1's specific findings | Sequential — merge only after synthesis |
| Both waves ask the same agent type | Merge into one wave with combined scope |

Full protocol: `references/multi-wave-dispatch.md`

## Context Window Management

Each subagent session has ~200k context window. Plan dispatches accordingly.

**Token-heavy operations** (plan for parallel to divide load):
- Deep research: tavily, webfetch, context7, repomix, deepwiki
- Deep investigation: "depth" and "variants" analysis
- Multi-source comparison: cross-referencing multiple documentation sets

**Token-efficient operations** (can run inline or in single dispatch):
- Targeted file reads with grep
- Single-file verification
- Quick status checks

**Budget rule**: If estimated token usage exceeds 100k for a single dispatch, split into parallel independent slices.

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/delegation-modes.md` | Sequential-first rules, parallel gate, mode fit |
| `references/delegation-decision.md` | Extended decision criteria, cost/benefit, when-not-to-delegate |
| `references/role-boundaries.md` | Parent/child responsibilities, invalid delegation examples |
| `references/codescan-delegation.md` | Agent selection, scan pass structure, resumable protocol |
| `references/failure-recovery.md` | Partial return, timeout, escalation |
| `references/multi-wave-dispatch.md` | Multi-wave dispatch flow, investigation swarms, hierarchical consumption |
| `references/architecture-audit-delegation.md` | Architecture audit delegation packet pattern |
| `references/debug-delegation.md` | Debug workflow delegation patterns |
| `references/domain-escalation.md` | Domain escalation rules and triggers |
| `references/evidence-collection.md` | Evidence collection methodology for delegation |
| `references/parallel-dispatch.md` | Parallel dispatch coordination and safety |
| `references/rb-role-platform-mapping.md` | Role-based role-to-platform mapping |
| `references/refactor-delegation.md` | Refactor workflow delegation patterns |
| `references/research-thread-management.md` | Research thread lifecycle management |
| `references/role-platform-mapping.md` | Role-to-platform agent mapping |
| `references/source-validation.md` | Source validation for delegated work |
| `references/subagent-driven-development.md` | Subagent-driven development workflow |
| `references/multi-reviewer-protocol.md` | Multi-agent review dispatch, dimension ownership, synthesis |
| `references/hard-stop-conditions.md` | Immediate delegation stop triggers and recovery protocol |
| `templates/delegation-packet.md` | Full packet JSON template |
| `templates/handoff-brief.md` | Human-readable brief template |
| `templates/codescan-delegation-packet.md` | Codescan-specific packet template |
| `templates/audit-delegation-packet.md` | Architecture audit packet template |
| `templates/debug-delegation-packet.md` | Debug workflow packet template |
| `templates/evidence-table.md` | Evidence table template for returns |
| `templates/implementer-prompt.md` | Implementer agent prompt template |
| `templates/rb-role-declaration.md` | Role-based role declaration template |
| `templates/refactor-delegation-packet.md` | Refactor workflow packet template |
| `templates/research-delegation-packet.md` | Research delegation packet template |
| `templates/role-declaration.md` | Role declaration template |
| `templates/spec-reviewer-prompt.md` | Spec reviewer prompt template |
| `tests/direct-invocation.md` | Basic delegation scenario with validation |
| `tests/parallel-delegation.md` | Parallel dispatch scenario with validation |
| `tests/failure-recovery.md` | Blocked-route recovery scenario with validation |
| `tests/course-correction.md` | Course correction scenario with validation |
| `tests/research-delegation.md` | Research delegation scenario with validation |

## Independence Rules

- This package is self-contained for normal delegation flow.
- It does not require old router-to-router chains.
- It may be selected directly or from `use-hivemind`.
- Delegation artifacts are stored in `{delegation_dir}` at runtime.

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run the artifact validation script (e.g., `bash scripts/hm-artifact-validate.sh {path}` or equivalent) to confirm compliance.

## OpenCode Tool Matrix

| Need | Tool | Why |
|------|------|-----|
| delegate bounded work | `task` | launches clean subagent session |
| persist handoff state | `hivemind_handoff` | stores resumable packet metadata |
| track workflow linkage | `hivemind_task` | ties packets to workflow/task IDs |
| record trajectory checkpoints | `hivemind_trajectory` | preserves phase transitions |
| inspect delegation docs | `hivemind_doc` | read-only doc access |
| verify current runtime | `hivemind_runtime_status` | confirm attached workflow state |

Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/DEBT.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/handoff-brief.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/debug-delegation-packet.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/refactor-delegation-packet.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/delegation-packet.json</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/evidence-table.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/artifact-meta.json</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/codescan-delegation-packet.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/evidence-return.json</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-delegation/templates/research-delegation-packet.md</file>
</skill_files>
</skill_content>
```

---
## Assistant (Assistant · unknown)

_Thinking:_

I'll save the plan document and then delegate Phase 0 (regression tests) to subagents. Let me start by persisting the plan and then executing the test-writing phase.

---
**Tool:** write

**Input:**
```json
{"content":"# Tool Refactoring Plan — HiveMind Plugin\n\n**Created:** 2026-03-31\n**Status:** Planning Complete — Awaiting Execution Authorization\n**Branch:** v2.9.5-detox-dev (worktree)\n\n---\n\n## Context\n\nRefactoring the 12 custom tools system following an 8-principle evaluation framework. Goal: consolidate, clean up, and enhance tools to be architecturally sound while keeping doc-intelligence read-only and ensuring tools are superior utilities for AI agents.\n\n## 8-Principle Framework\n\n1. Tools must have clear descriptions showing distinct use cases and superiority\n2. Serve many high-frequency use cases, not niche ones\n3. No conflicts/overlap; no cumbersome preconditions\n4. Low friction — usable mid-run, not too many required fields\n5. Well-designed granularity with routing and combinations\n6. Linked with HiveMind concepts (trajectory, delegation, workflow, contracts)\n7. Don't replace innate tools unless clearly superior\n8. Tools = utilities of superiority that make agents think like human experts\n\n## Final Tool Taxonomy (12 → 11 tools)\n\n| # | Tool | Actions | Directory | Change |\n|---|------|---------|-----------|--------|\n| 1 | `hivemind_trajectory` | 6 | `src/tools/trajectory/` | CANONICAL — no changes |\n| 2 | `hivemind_task` | 7 | `src/tools/task/` | Fix redundant async |\n| 3 | `hivemind_handoff` | 6 | `src/tools/handoff/` | Group Zod args (20 flat → 6 grouped) |\n| 4 | `hivemind_doc` | 6 | `src/tools/doc/` | Add `search_symbols`, fix routing/security/glob bugs |\n| 5 | `hivemind_runtime` | 2 | `src/tools/runtime/` | MERGED from status+command tools |\n| 6 | `hivemind_journal` | 6 | `src/tools/journal/` | MOVED from flat file to directory |\n| 7 | `hivemind_agent_work` | 4 | `src/tools/agent-work/` | MERGED contracts+classify |\n| 8 | `hivemind_hm_init` | 1 | `src/tools/hm-init/` | Renamed from hivefiver-init |\n| 9 | `hivemind_hm_doctor` | 1 | `src/tools/hm-doctor/` | Renamed from hivefiver-doctor |\n| 10 | `hivemind_hm_setting` | 1 | `src/tools/hm-setting/` | SPLIT (1,121 LOC → ~150 tool + ~350 features) |\n\n## Key Decisions\n\n| Decision | Verdict | Rationale |\n|----------|---------|-----------|\n| Doc writes | NO — stay read-only | P7: Don't replace innate write/edit tools |\n| `search_symbols` action | YES — add to doc tool | P7: Superior to innate grep (structured extraction) |\n| Handoff 6 interfaces | KEEP as-is | Proper ≤10-field decomposition |\n| Handoff Zod args | GROUP from 20 flat → 6 grouped | Better agent comprehension |\n| Runtime tools | MERGE → single tool (2 actions) | P3: Same domain, no overlap |\n| Contract tools | MERGE → single tool (4 actions) | P3: Same domain |\n| Journal | MOVE to `src/tools/journal/` directory | P6: Harmonize with canonical pattern |\n| Task async | FIX — remove redundant async | Consistency |\n| `hm_setting` | SPLIT aggressively | ≤300 LOC rule violated (1,121 LOC) |\n| Dead code | DELETE `doc-surface-router.ts` | P2: No zombie code |\n| Upward imports | FIX — move pressure contracts to `src/shared/` | Architecture violation |\n| Legacy recovery | SKIP entirely | Archive = re-exported schemas, not dropped features |\n\n## Execution Phases\n\n### Phase 0 (CRITICAL — TDD First)\nWrite regression tests for 5 untested core tools BEFORE any structural changes.\n- `hivemind_task` — test registration, action routing, feature dispatch\n- `hivemind_trajectory` — test registration, action routing, feature dispatch\n- `hivemind_handoff` — test registration, action routing, feature dispatch\n- `hivemind_doc` — test registration, action routing, feature dispatch\n- `hivemind_runtime` — test registration, action routing, feature dispatch\n\n**Gate:** `npm test` passes for all new tests.\n\n### Phase 1 (Safe Structural Cleanup)\n- Move `hivemind-journal.ts` → `src/tools/journal/` directory structure\n- Fix `task/tools.ts` redundant async\n- Delete `doc-surface-router.ts` (dead code)\n- Merge runtime tools: `status` + `command` → single `hivemind_runtime` tool\n- Merge contract tools: create+export+classify → `hivemind_agent_work`\n- Fix upward imports: move pressure contracts to `src/shared/`\n- Rename directories: `hivefiver-*` → `hm-*`\n- Update `src/tools/index.ts` catalog (12 → 11 entries)\n- Update `src/plugin/opencode-plugin.ts` import paths\n\n**Gate:** `npx tsc --noEmit` + `npm test` pass.\n\n### Phase 2 (Doc Intelligence Enhancements)\n- Add `search_symbols` action to doc tool\n- Fix regex injection in `read-ops.ts`\n- Fix glob filtering in `read-ops.ts`\n- Fix case-insensitive heading lookup in `formats/md.ts`\n- Fix frontmatter parsing\n- Switch if-chain → switch/case routing\n- Enhance tool descriptions for agent clarity\n\n**Gate:** `npx tsc --noEmit` + `npm test` pass.\n\n### Phase 3 (hm_setting Split)\n- Extract business logic from `hm_setting` (1,121 LOC → ~150 tool + ~350 features)\n- Create `src/features/hm-setting/` with:\n  - `dashboard-builder.ts`\n  - `language-selector.ts`\n  - `config-reader.ts`\n- Update tool to delegate to feature modules\n\n**Gate:** `npx tsc --noEmit` + `npm test` pass.\n\n### Phase 4 (Documentation)\n- Update AGENTS.md tool count (7 → 11)\n- Update tool descriptions in `agentToolCatalog`\n- Fix phantom test references\n- Update `tool-audit-reconciled.md` with final state\n\n**Gate:** Manual review of documentation accuracy.\n\n## Files to Modify\n\n### Source files\n- `src/tools/index.ts` — tool catalog\n- `src/tools/trajectory/` — NO CHANGES (canonical)\n- `src/tools/task/tools.ts` — fix async\n- `src/tools/handoff/tools.ts` — group Zod args\n- `src/tools/doc/` — add search_symbols, fix bugs\n- `src/tools/runtime/` — merge tools\n- `src/tools/hivemind-journal.ts` — move to directory\n- `src/tools/hivefiver-init/` → rename\n- `src/tools/hivefiver-doctor/` → rename\n- `src/tools/hivefiver-setting/` → split + rename\n- `src/features/agent-work-contract/tools/` — merge into agent-work\n- `src/intelligence/doc/doc-surface-router.ts` — DELETE\n- `src/intelligence/doc/read-ops.ts` — fix security bugs\n- `src/intelligence/doc/formats/md.ts` — fix heading lookup\n- `src/plugin/opencode-plugin.ts` — update imports\n\n### New files to create\n- `src/tools/journal/` directory structure\n- `src/tools/agent-work/` directory structure\n- `src/features/hm-setting/` directory structure\n- `src/shared/tool-schema-helpers.ts`\n- `src/shared/action-types.ts`\n- Phase 0 test files for 5 untested tools\n\n## Dependencies Flow (Enforced)\n\n```\nTool → Feature → Intelligence → stdlib\n```\n\nNEVER reverse. Tools depend only on SDK and Tier 1 (features/intelligence).\n\n## Risk Assessment\n\n| Risk | Mitigation |\n|------|------------|\n| Breaking existing tool consumers | Phase 0 tests catch regressions |\n| hm_setting split too aggressive | Extract incrementally, verify each extraction |\n| Doc tool changes break search | Test search_symbols against real codebase |\n| Import path updates miss references | `npx tsc --noEmit` catches all |\n| Worktree npm link issues | Verify with `npm run build` before each phase |\n","filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/plans/tool-refactoring-plan-2026-03-31.md"}
```

**Output:**
```
Wrote file successfully.
```

---
## Assistant (Assistant · unknown)

_Thinking:_

I hear you clearly. This is a **strategic architecture briefing**, not an execution request. You're articulating the vision for what this harness system should become, and you want me to:

1. **Understand your design philosophy** (runtime concepts, plugins vs tools, modular shipping)
2. **Delegate verification** — have expert agents validate your assumptions against the actual codebase and OpenCode SDK
3. **Keep this session clean** — all investigation output goes to disk for later consumption

Let me first persist the plan document that was never saved, then dispatch the investigation swarm.

---
**Tool:** todowrite

**Input:**
```json
{"todos":[{"content":"Dispatch hivexplorer to verify runtime concepts against actual codebase","status":"pending","priority":"high"},{"content":"Dispatch hivexplorer to map plugin vs tool boundaries and stacking patterns","status":"pending","priority":"high"},{"content":"Dispatch hivexplorer to investigate session lifecycle hooks and runtime events","status":"pending","priority":"high"},{"content":"Dispatch hiverd to research OpenCode SDK patterns for modular shipping","status":"pending","priority":"high"},{"content":"Dispatch architect to evaluate design philosophy tradeoffs","status":"pending","priority":"medium"},{"content":"Synthesize all findings into structured report on disk","status":"pending","priority":"high"}]}
```

**Output:**
```
[
  {
    "content": "Dispatch hivexplorer to verify runtime concepts against actual codebase",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch hivexplorer to map plugin vs tool boundaries and stacking patterns",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch hivexplorer to investigate session lifecycle hooks and runtime events",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch hiverd to research OpenCode SDK patterns for modular shipping",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch architect to evaluate design philosophy tradeoffs",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Synthesize all findings into structured report on disk",
    "status": "pending",
    "priority": "high"
  }
]
```

---
## Assistant (Assistant · unknown)

_Thinking:_

Now I'll dispatch the investigation swarm to verify your architectural assumptions against the actual codebase and OpenCode SDK. This is **research only** — no execution.

---
**Tool:** todowrite

**Input:**
```json
{"todos":[{"content":"Dispatch hivexplorer to verify runtime concepts against actual codebase","status":"in_progress","priority":"high"},{"content":"Dispatch hivexplorer to map plugin vs tool boundaries and stacking patterns","status":"pending","priority":"high"},{"content":"Dispatch hivexplorer to investigate session lifecycle hooks and runtime events","status":"pending","priority":"high"},{"content":"Dispatch hiverd to research OpenCode SDK patterns for modular shipping","status":"pending","priority":"high"},{"content":"Dispatch architect to evaluate design philosophy tradeoffs","status":"pending","priority":"medium"},{"content":"Synthesize all findings into structured report on disk","status":"pending","priority":"high"}]}
```

**Output:**
```
[
  {
    "content": "Dispatch hivexplorer to verify runtime concepts against actual codebase",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Dispatch hivexplorer to map plugin vs tool boundaries and stacking patterns",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch hivexplorer to investigate session lifecycle hooks and runtime events",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch hiverd to research OpenCode SDK patterns for modular shipping",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Dispatch architect to evaluate design philosophy tradeoffs",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Synthesize all findings into structured report on disk",
    "status": "pending",
    "priority": "high"
  }
]
```

---
## User



---
