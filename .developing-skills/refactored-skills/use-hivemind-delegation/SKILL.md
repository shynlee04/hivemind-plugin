---
name: use-hivemind-delegation
description: |
  Enforce delegation when front-facing agents must split work across subagents. Use when: delegating to subagent, splitting work into slices, dispatching with scope boundary, emitting delegation packets, managing handoff with return contracts, coordinating sequential or parallel agent dispatch, or resuming prior subagent sessions via task_id. Covers delegation decision rules, role selection, task decomposition, handoff packets, return contracts, resume protocol, and basic failure recovery.
---

# use-hivemind-delegation

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

## Do Not Use This For

- Normal single-slice execution with fresh context and ≤3 files
- Vague delegation with no scope or return contract — clarify scope first, then delegate
- Recursive delegation when the parent scope is already unclear — decompose the parent before re-delegating
- Tasks completable in <3 inline actions unless session freshness requires a fresh context

**If delegation criteria are not met, execute inline.** If the user requested delegation but scope is unclear, emit a scope-clarification question rather than a delegation packet.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-detox-refactor` | Router that triggers this skill — delegates slices here |
| `hivemind-codemap` | Codescan mode — this skill owns handoff discipline; codemap owns scan mechanics |
| `hivemind-system-debug` | Debug mode — debug delegation dispatches through this protocol |
| `spec-distillation` | Planning mode — distillation outputs feed into planning delegation |
| `context-intelligence-entry` | Stale session probe — delegate this when orchestrator context is suspect |
| `git-continuity-memory` | Git-aware continuity — commit SHAs and branch state recorded in packets |
| `hivemind-gatekeeping-delegation` | Iterative loops, synthesis gates, cascading failure — extracted from this skill |

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

## Orchestrator Protection

When delegation is triggered from the detox router or any polluted-context session:

1. **The orchestrator emits the packet; the subagent does the work.** The orchestrator must not perform deep reads, scans, or audits itself.
2. **Return contracts must include a compressed carry-forward** (≤5 findings + blocked routes + next action). The orchestrator does NOT read full output files — only summary fields and output paths.
3. **If the orchestrator finds itself doing multi-file reads after dispatching a delegation,** it is violating session freshness discipline. Stop and wait for the subagent return.
4. **Stale context is a delegation trigger.** If the orchestrator's accumulated context becomes unreliable, delegate a fresh `context-intelligence-entry` probe instead of continuing with suspect information.
5. **Delegation is mandatory when criteria are met.** The orchestrator may not choose to do deep work itself when the decision rules above indicate delegation is required.

## Core Protocol

1. **Confirm delegation is needed** — delegation costs context-switching overhead; use the decision rules above. (See `references/delegation-decision.md` for extended criteria.)
2. **Write the slice boundary** — scope, out-of-scope, constraints, success metrics. Decompose by authority surface, then concern type, then file cluster. (See Task Decomposition Rules above.)
3. **Choose the mode** — `research`, `execution`, `verification`, or `planning`. Each mode has different success tests and return expectations.
4. **Choose execution mode** — `sequential` by default; allow `parallel` only for isolated slices. (See `references/delegation-modes.md` for the parallel gate.)
5. **Tag the work** with `activity_type` and `phase_type` before dispatch. These tags link delegation to the development storyline and enable cross-skill continuity.
6. **Emit a delegation packet and handoff brief** before dispatch. The packet is the contract. The brief is the human-readable summary. (See `templates/delegation-packet.md` and `templates/handoff-brief.md`.)
7. **Require a structured return** with findings, evidence, blocked routes, and next action. (See Shared Return Contract below and `references/failure-recovery.md`.)

## Shared Return Contract

Every meaningful delegation return must include:

| Category | Fields | Purpose |
|----------|--------|---------|
| **Routing** | `activity_type`, `phase_type`, `mode`, `execution_mode` | Links return to storyline |
| **Identity** | `packet_id`, `task_id`, `pass_id`, `batch_id`, `slice_id` | Enables resume and deduplication |
| **Scope tracking** | `files_checked`, `clean_files`, `blocked_files`, `coverage_gaps` | Proves coverage |
| **Evidence** | `confirmed`, `inferred`, `unverified`, `confidence`, `artifacts_written` | Evidence before assertions |
| **Control** | `blocked_routes`, `recommended_next_action`, `open_loop_ids`, `open_packet_ids` | Enables orchestrator routing |

If a child cannot produce this shape, return a bounded partial result rather than pretending the slice is complete. A partial return with `status: "partial"` and populated `blocked_routes` is always better than a fabricated `status: "complete"`.

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

For cascading failure and parallel-slice isolation at scale, see `hivemind-gatekeeping-delegation`.

Read `references/failure-recovery.md` for detailed recovery procedures, timeout heuristics, and blocked-route resolution patterns.

## Codescan Delegation

For code scanning work, use structured delegation with specific agent selection:
- **`explore` first** for all read-only scans (structure, exports, imports, seams, hotspots).
- **`general` only when** cross-file synthesis or deeper reasoning is needed.
- Track each scan pass through JSON checkpoints at `{activity}/codescan/{pass_id}/`.
- Support multi-pass chaining: `high-level-map` → `pipeline-map` → `journey-map` → `low-level-proof` → `cross-pass-synthesis`, each with its own `pass_id`.

Each deeper scan phase must read the previous phase synthesis artifact first. Do not skip straight to low-level proof while the high-level or pipeline model is still unresolved.

Read `references/codescan-delegation.md` for agent selection table, scan pass structure, resumable scan protocol, and bash helper integration.

## Iterative Loop Control

For iterative loop control, carry-forward compression, synthesis gates, and integration verification, see `hivemind-gatekeeping-delegation`.

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

**Scenario:** The orchestrator detects 3 unrelated test failures in 3 different modules after a refactor.

**Step 1 — Decision:** Work touches 3 independent modules, each needing deep reads. Delegation criteria met. Choose `parallel` — modules share no imports.

**Step 2 — Decompose:** Three slices: module A tests, module B tests, module C tests. Each ≤3 files. Clean boundaries.

**Step 3 — Packets:** Emit 3 delegation packets with `mode: verification`, `execution_mode: parallel`. Each packet specifies the failing test file, error messages, and constraints ("fix tests only, do not change production code unless the test proves a real bug").

**Step 4 — Dispatch:** Dispatch 3 subagents in parallel. Each gets a self-contained prompt with full context.

**Step 5 — Returns:** Two return `status: "complete"`, one returns `status: "partial"` with `blocked_routes: ["requires shared/types.ts change"]`.

**Step 6 — Synthesis:** Integrate the 2 successful fixes. Re-delegate the blocked slice with expanded authority (`shared/types.ts` added to `authority_surfaces`).

**Step 7 — Integration:** After the third return, run the full test suite. All pass. Mark workflow complete.

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/delegation-modes.md` | Sequential-first rules, parallel gate, mode fit |
| `references/delegation-decision.md` | Extended decision criteria, cost/benefit, when-not-to-delegate |
| `references/role-boundaries.md` | Parent/child responsibilities, invalid delegation examples |
| `references/codescan-delegation.md` | Agent selection, scan pass structure, resumable protocol |
| `references/failure-recovery.md` | Partial return, timeout, escalation |
| `templates/delegation-packet.md` | Full packet JSON template |
| `templates/handoff-brief.md` | Human-readable brief template |
| `templates/codescan-delegation-packet.md` | Codescan-specific packet template |
| `hivemind-gatekeeping-delegation` | Iterative loops, synthesis gates, cascading failure |
| `tests/direct-invocation.md` | Basic delegation scenario with validation |
| `tests/parallel-delegation.md` | Parallel dispatch scenario with validation |
| `tests/failure-recovery.md` | Blocked-route recovery scenario with validation |

## Independence Rules

- This package is self-contained for normal delegation flow.
- It does not require old router-to-router chains.
- It may be selected directly or from `use-hivemind-detox-refactor`.
- Delegation artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime.
