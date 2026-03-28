---
name: use-hivemind-delegation
description: Enforce delegation when front-facing agents must split work across subagents. Covers delegation decision rules, role selection, task decomposition, handoff packets, return contracts, resume protocol, and failure recovery.
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
| `use-hivemind` | Router that triggers this skill — delegates slices here |
| `hivemind-codemap` | Codescan mode — this skill owns handoff discipline; codemap owns scan mechanics |
| `hivemind-system-debug` | Debug mode — debug delegation dispatches through this protocol |
| `hivemind-spec-driven` | Planning mode — distillation outputs feed into planning delegation |
| `use-hivemind-context` | Stale session probe — delegate this when orchestrator context is suspect |
| `use-hivemind-git-memory` | Git-aware continuity — commit SHAs and branch state recorded in packets |
| `hivemind-gatekeeping` | Iterative loops, synthesis gates, cascading failure — extracted from this skill |

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
2. **Return contracts must include a compressed carry-forward** (≤5 findings + blocked routes + next action + output paths). The orchestrator does NOT read full output files — only summary fields and output paths.
3. **If the orchestrator catches itself doing multi-file reads after dispatching a delegation,** STOP immediately and wait for the subagent return. This is a session discipline violation — not a minor one.
4. **Stale context is always a delegation trigger** regardless of task size. If the orchestrator's accumulated context becomes unreliable, delegate a fresh `use-hivemind-context` probe instead of continuing with suspect information.
5. **Delegation is mandatory when criteria are met.** The orchestrator may not choose to do deep work itself when the decision rules above indicate delegation is required.

<HARD-GATE>
The orchestrator must never do deep work when delegation criteria are met. If you find yourself reading more than 2 code files sequentially after dispatching, you have violated the mandate. STOP. Wait for the subagent. The orchestrator that investigates is the orchestrator that stops orchestrating.
</HARD-GATE>

## How-To-Process vs How-To-Implement in Packets

Delegation packets tell the subagent **what process to follow**, never **how to write the code**. This is the single most common delegation mistake.

**HOW-TO-PROCESS (correct):**
- What skills to load (e.g., "load `hivemind-codemap` before scanning")
- Coordination with other agents (e.g., "wait for research return before implementing")
- Expected output format (e.g., "return findings as JSON with file:line refs")
- Success metrics (e.g., "all tests pass, no type errors")
- Pre/post workflows (e.g., "run `npx tsc --noEmit` before returning")
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
  "output_path": ".hivemind/activity/codescan/pass-01/",
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
| **Output** | `output_paths` | Where detailed output lives (orchestrator reads summary only) |
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

When the orchestrator needs broad codebase coverage fast, it launches an **investigation swarm** — parallel `hivexplorer` agents, each with a bounded slice.

### Swarm Dispatch Rules

1. **One concern per agent.** Each hivexplorer gets one module, one pipeline, or one question. Never hand an agent "look at everything."
2. **Parallel within a wave.** All swarm agents in a wave run concurrently. No dependencies between them.
3. **Bounded slices.** Each agent returns: findings with `file:line` references, evidence, and output paths. Nothing else.
4. **Orchestrator reads ONLY the compressed synthesis** (≤5 items per agent), not full scan output.

### Swarm Packet Shape

Each swarm packet must include:
- `slice_id` — unique identifier for this investigation slice
- `scope` — the bounded question (e.g., "map all exports in src/tools/trajectory/")
- `constraints` — always includes `read-only` for hivexplorer
- `output_path` — where the agent writes detailed findings
- `return_format` — compressed summary ≤5 items

### Orchestrator Discipline

After dispatching a swarm, the orchestrator must **wait**. If the orchestrator catches itself doing multi-file reads while agents are running, STOP immediately. The orchestrator that investigates alongside its swarm is the orchestrator that loses the thread.

### Swarm Synthesis

When all agents return:
1. Read each agent's compressed summary (≤5 items)
2. Merge into a unified finding set
3. Identify cross-slice patterns (shared root causes, dependency chains)
4. Feed synthesis into the next wave or into implementation delegation

## Hierarchical Consumption

Wave outputs feed forward — never skip to implementation without consuming investigation and research synthesis.

| Rule | Detail |
|------|--------|
| Wave feeding | Each wave's output feeds the next wave's decision. Investigation → research → implementation → verification. |
| No skipping | Never skip to implementation without consuming investigation + research synthesis first. Discipline violation otherwise. |
| Carry-forward | ≤5 findings, blocked routes, recommended next action, output paths between waves. |
| Orchestrator reads | Summary fields and output path only. If detail needed, delegate another agent to read the output. |

### Wave Sequencing

`Wave 1 (investigation) → synthesis → Wave 2 (research/planning) → synthesis → Wave 3 (implementation) → synthesis → Wave 4 (verification)`

Skip a wave only if the previous wave's synthesis explicitly confirms no gaps remain.

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

| Step | Action | Output |
|------|--------|--------|
| Decision | 3 independent test failures → delegation → parallel (no shared imports) | `execution_mode: parallel` |
| Decompose | 3 slices (A, B, C), each ≤3 files, clean boundaries | 3 packets |
| Packets | `mode: verification`, constraints: "fix tests only" | Scope per agent |
| Dispatch | 3 subagents in parallel, self-contained prompts | 3 running |
| Returns | 2 complete, 1 partial (`blocked: shared/types.ts`) | Synthesize |
| Synthesis | Integrate 2 fixes, re-delegate blocked with expanded authority | Updated packet |
| Integration | Full test suite → all pass → workflow complete | Done |

## Granularity Gate

<HARD-GATE>
Before emitting a delegation packet, the orchestrator must pass through the granularity gate. Tasks exceeding these thresholds MUST be decomposed further.

| Threshold | Rule | Action if Exceeded |
|-----------|------|-------------------|
| >3 file changes | Break into sequential or parallel sub-tasks | Decompose by authority surface, then concern |
| >500 LOC write/edit/patch | Never in a single delegation | Split into ≤500 LOC slices with clear seams |
| Mixed read+write across domains | Separate read-only from write-capable | Different packets, different agents |

**Absolute rule:** NEVER dispatch parallel agents that edit/write/change/move/patch/update the same domain, same concerns, or dependent entities. Parallel is valid ONLY for independent READ at the smallest unit.
</HARD-GATE>

## Parallel Dispatch Safety

| Parallel is SAFE when | Parallel is FORBIDDEN when |
|----------------------|---------------------------|
| Deep investigation with multiple offset reads | Any agent will write/edit/patch the same file |
| Research via tavily/webfetch/context7/repomix/deepwiki | Slices share mutable state or imports |
| Nested knowledge synthesis across independent domains | Slices modify the same concern or domain |
| All agents are read-only (hivexplorer, hiverd) | Integration order matters (sequential dependency) |
| Token-exhaustive operations needing window isolation | One slice's output is another slice's input |

<HARD-GATE>
If ANY agent in a parallel wave will write, edit, or mutate — all write agents in that wave MUST be sequential. Parallel write is allowed only when slices touch completely disjoint file sets with zero shared imports. When in doubt, sequential wins.
</HARD-GATE>

## Hierarchical Packet Construction

Every delegation packet must include these elements — no exceptions:

| Packet Element | Requirement | Example |
|---------------|-------------|---------|
| Prerequisite context | Validated output artifacts with valid paths | `prerequisite_refs: [".hivemind/activity/codescan/wave-1a/audit.json"]` |
| Skills to load | What skills and how-to-process — NOT what-to-do | `skills: ["hivemind-codemap"]` |
| Parent planning refs | Links to active planning and governance docs | `parent_planning_ref: ".hivemind/activity/plans/plan-v2.md"` |
| Governance docs | Applicable AGENTS.md, ROADMAP, or sector charters | `governance_docs: ["AGENTS.md", "src/tools/AGENTS.md"]` |
| Boundaries | Success metrics, files to create/modify, explicit out-of-scope | `out_of_scope: ["src/core/*", "dist/*"]` |
| Stopping conditions | When to stop trying and return blocked/partial | `stop_on: ["3 failed fix attempts", "type errors persist"]` |
| Delegation awareness | Agent knows it is delegated, not user-facing | `delegated: true, lineage: "hivefiver"` |
| Overlap validation | Confirm no naming or implementation conflicts with other slices | `conflict_check: ["naming", "imports", "types"]` |

Evidence, review, and feedback artifacts must output to `.hivemind/activity/{domain}/{pass_id}/` hierarchy.

## Context Window Management

Each delegation operates within a ~200k token context window. Plan accordingly:

| Operation Type | Token Cost | Strategy |
|---------------|-----------|----------|
| Deep codebase scan (repomix, codemap) | High (50-100k) | Parallel breakdown by module |
| Multi-source research (tavily, webfetch, context7) | High (40-80k) | Parallel by source type |
| Implementation (write code, tests) | Medium (20-50k) | Sequential, bounded by LOC gate |
| Verification (type check, test run) | Low (5-20k) | Sequential after implementation |

**Rule:** If an operation is token-exhaustive (>50% window), break it into parallel independent slices. Research and investigation are highest-risk — plan parallel breakdown before dispatch.


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
| `hivemind-gatekeeping` | Iterative loops, synthesis gates, cascading failure |
| `references/multi-wave-dispatch.md` | Multi-wave dispatch flow, investigation swarms, hierarchical consumption, dynamic skill assignment |
| `tests/direct-invocation.md` | Basic delegation scenario with validation |
| `tests/parallel-delegation.md` | Parallel dispatch scenario with validation |
| `tests/failure-recovery.md` | Blocked-route recovery scenario with validation |

## Independence Rules

- This package is self-contained for normal delegation flow.
- It does not require old router-to-router chains.
- It may be selected directly or from `use-hivemind`.
- Delegation artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime.
