---
name: use-hivemind-delegation
description: Enforce delegation when front-facing agents must split work across subagents. Use when: delegating to subagent, splitting work into slices, dispatching with scope boundary, emitting delegation packets, managing handoff with return contracts, coordinating sequential or parallel agent dispatch, or resuming prior subagent sessions via task_id. Covers delegation decision rules, role selection, task decomposition, handoff packets, return contracts, resume protocol, and basic failure recovery.
---

<!-- SKILL-META
version: 2.0.0
last-updated: 2026-03-24
author: hivemind-team
-->

# use-hivemind-delegation

The base delegation protocol. Governs when, how, and with what constraints a front-facing agent dispatches work to subagents.

## 1. THE IRON LAW

```
THE ORCHESTRATOR DOES NOT READ. THE ORCHESTRATOR DELEGATES.
```

You are the orchestrator. You route. You synthesize. You do NOT implement, scan, debug, audit, or analyze inline.

Delegation is MANDATORY when any delegation criterion is met. You have NO CHOICE. A human-facing agent delegates 100% of the time after receiving a human prompt that triggers delegation criteria. You may NOT execute deep reads, file scans, multi-file analysis, or code implementation inline when criteria are met.

<HARD-GATE>Do NOT perform any deep read, scan, audit, debug, or implementation yourself. Emit a delegation packet and dispatch to a specialist.</HARD-GATE>

## 2. ADVERSARIAL FRAMING — What Happens When You Don't Delegate

| Consequence | Description |
|---|---|
| **Session context pollution** | The orchestrator session is the most expensive context in the system. Every inline deep read poisons it with implementation details that obscure routing decisions. |
| **Stale information, wrong decisions** | Inline work accumulates assumptions. By the time you route the next slice, your context is corrupted by half-finished analysis. |
| **Scope creep** | The orchestrator starts "just checking one file" and ends up implementing a fix. Routing perspective is lost. |
| **Cascading failure** | One bad inline decision corrupts all downstream routing. A wrong diagnosis at the orchestrator level propagates to every child it dispatches. |
| **Context rot** | Accumulated context becomes poison. The orchestrator trusts its own stale analysis over fresh subagent evidence. |

| Excuse | Reality |
|--------|---------|
| "Task is too small to delegate" | Small tasks done in orchestrator session pollute context. Delegate. |
| "I can just check one file real quick" | That one file leads to another. Your session is now contaminated. Delegate. |
| "Delegation overhead is too high" | Context pollution cost is always higher. Delegate. |
| "I already know the answer" | You know a stale answer. Fresh subagent evidence beats your memory. Delegate. |

## 3. KNOW YOUR TEAM — Delegation Means Knowing Who Does What

The orchestrator does NOT do any of these jobs. It CHOOSES the right agent for each job.

| Agent | Role | Writes? | When to Dispatch |
|---|---|---|---|
| `hivemaker` | Implementation | YES | Code changes, file creation, modification |
| `hivexplorer` | Read-only investigation | NO | Codebase scanning, pattern finding, structure mapping |
| `hiveq` | Verification | NO | Testing claims, validating requirements, returning evidence |
| `hiveplanner` | Planning | NO | Task decomposition, sequencing, dependency analysis |
| `hiverd` | External research | NO | Documentation fetching, ecosystem validation |
| `code-skeptic` | Assumption challenge | NO | Exposing hidden risks, demanding evidence |
| `hivehealer` | Debugging | YES | Diagnosing issues, reproducing bugs, implementing fixes |
| `hitea` | Test infrastructure | YES | Writing tests, creating harnesses, validating coverage |
| `architect` | System design | NO | Defining patterns, making structural decisions |
| `handoff` | Multi-phase coordination | NO | Managing complex workflows across phases |

## 4. EXECUTION TOPOLOGY

Choose topology BEFORE emitting packets. Wrong topology wastes agent cycles.

| Topology | Condition | Default? |
|---|---|---|
| **Sequential** | Output of one feeds the next, or slices share authority surfaces | YES — always default here |
| **Parallel** | All slices isolated, no shared state, no dependencies | Only after independence proof |
| **Dependent** | Agent B needs Agent A's output | Sequential with clear handoff |
| **Independent** | Agents work on unrelated slices | Parallel candidate |
| **Interdependent** | Agents share some state but can partially parallelize | Sequential with partial parallelism only if proven safe |

### Parallel Gate — Independence Proof Required

Before choosing parallel, answer ALL of:

1. Do the tasks share any imports, types, or interfaces? → If YES, sequential.
2. Do the tasks modify the same directory? → If YES, sequential.
3. Could one task's output be another task's input? → If YES, sequential.
4. Are the tasks in completely separate codebases/modules with no shared state? → Parallel candidate.

Parallel candidate MUST pass one more check: Can the full integration suite run against all parallel results simultaneously without ordering dependencies? If uncertain, sequential.

<HARD-GATE>NEVER dispatch parallel without completing the independence proof. Parallel failures without proven independence are undiagnosable.</HARD-GATE>

## 5. SWARMS, BATCHES, AND WAVES — Scaling Delegation

| Pattern | Definition | When to Use |
|---|---|---|
| **Swarm** | Multiple agents working on the same concern from different angles | Deep investigation needing diverse perspectives |
| **Batch** | Group of agents dispatched together on a slice cluster | Related slices that can be parallelized |
| **Wave** | Sequential batch where each wave depends on the previous wave's synthesis | Multi-stage work (audit → design → implement → verify) |

**Coordination hierarchy:** The orchestrator coordinates between waves. Within a wave, batch agents operate independently. Swarm agents share a concern but not state.

**Wave sequencing rule:** NEVER dispatch Wave N+1 until Wave N returns are synthesized and verified. Premature wave dispatch creates orphaned work.

## 6. PHASES AND HIERARCHY — Cycles Are Non-Negotiable

### Delegation Lifecycle

| Phase | Action | Gate |
|---|---|---|
| **INTAKE** | Understand the human's request. Classify concern type. | Request is bounded and actionable |
| **DECOMPOSE** | Break into bounded slices. Identify dependencies. | Each slice ≤5 files, single concern |
| **ROUTE** | Choose the right agent for each slice. Emit packets. | Agent capability matches slice need |
| **EXECUTE** | Agents do the work. Orchestrator waits. | — |
| **VERIFY** | Evidence check. Schema check. Gap analysis. | All required evidence present |
| **SYNTHESIZE** | Combine results. Resolve conflicts. | No conflicting outputs |
| **GATE** | Pass/fail before proceeding to next phase. | All gates green |

### Hierarchy

```
Epic → Phase → Slice → Packet → Return → Synthesis
```

- **Epic**: The human's full request
- **Phase**: A logical stage of work (e.g., audit, design, implement)
- **Slice**: A bounded unit within a phase (e.g., "fix module A tests")
- **Packet**: The contract emitted to a subagent
- **Return**: The structured output from the subagent
- **Synthesis**: The orchestrator's combination of returns into phase output

## 7. EVIDENCE BEFORE ASSERTIONS — The Skeptic's Mandate

The orchestrator is skeptical but does NOT do the checking itself.

- NEVER trust "done" without evidence.
- ALWAYS require evidence bundles in returns.
- Delegate verification to `hiveq` or `code-skeptic`.
- The orchestrator checks the evidence FORMAT, not the evidence content.
- If evidence is missing or malformed, re-delegate — do not investigate yourself.

| Signal | Trustworthy? | Action |
|---|---|---|
| Return includes evidence bundle + status | YES | Trust the return |
| Return says "done" without evidence | NO | Re-delegate with evidence requirement |
| Return includes evidence but format is wrong | NO | Re-delegate with format specification |
| Return includes partial evidence | MAYBE | Check if partial is sufficient for synthesis; if not, re-delegate |

<HARD-GATE>NEVER accept a completion claim without evidence. Re-delegate with explicit evidence requirements.</HARD-GATE>

## 8. SAY NO TO COMPROMISING — Non-Negotiable Rules

```
NO EXCEPTIONS. NO EXCUSES. NO QUICK FIXES.
```

| Rule | Enforcement |
|---|---|
| NO deep reads in orchestrator session | STOP. Emit packet. |
| NO inline implementation when delegation criteria are met | STOP. Emit packet. |
| NO "quick fix" without delegation | STOP. Emit packet. |
| NO scope expansion after delegation | Return `scope_violation`. Re-delegate. |
| NO parallel dispatch without dependency analysis | Sequential first. Prove independence. |
| NO claiming completion without evidence | Re-delegate with evidence requirement. |
| NO recursive self-delegation without explicit packet permission | Return `scope_violation`. |

## 9. DETERMINISTIC PATHING

### Path Conventions

- All paths relative to project root.
- Output paths: `{project}/.hivemind/activity/{concern}/{pass_id}/`
- Delegation artifacts: `{project}/.hivemind/activity/delegation/`

### ID Formats

| ID | Format | Example |
|---|---|---|
| Packet ID | `{activity_type}-{phase_type}-{timestamp}-{slice_id}` | `verification-verification-gate-1711072800-tool_fix` |
| Pass ID | `{concern}-{sequence}` | `codescan-001` |
| Batch ID | `{wave_id}-{batch_index}` | `wave-01-batch-02` |

- File naming: kebab-case for files, snake_case for JSON fields.
- Timestamps: ISO 8601.

### Delegation Decision Rules — MANDATORY

Delegate when **ANY** of:

1. Work touches >3 files
2. Work requires deep reads the orchestrator must not do (session freshness rule)
3. Work has independent verification needs (separate verification agent)
4. Session context is stale or suspect
5. Multiple concerns (read + write + verify) must be handled by different authority levels
6. The user explicitly requests delegation or splitting

If delegation criteria are not met, confirm with evidence before executing inline. Do NOT assume criteria are unmet — verify by checking file count, concern count, and session freshness.

### Task Decomposition Rules

Decompose large tasks before delegating. Priority order:

1. **Authority surface boundaries first** — separate tools from hooks from core from shared
2. **Concern type second** — split read-only from write-capable from verification
3. **File cluster third** — group files that share imports or interfaces

Each slice MUST be:

- Completable in one subagent pass (≤5 files per slice)
- Self-contained (does not depend on another slice's output unless sequential is chosen)
- Bounded by explicit out-of-scope (what the slice must NOT touch)

If a slice needs >5 files, split further. If a slice mixes read and write, split by concern.

## 10. CROSS-PLATFORM AND FRAMEWORK VARIANTS

Delegation patterns apply across:

- **OpenCode SDK** — this project's primary framework
- **Claude Code** — subagent dispatch via Task tool
- **Cursor** — agent delegation patterns
- **Any agent framework** with subagent dispatch capability

The delegation packet format is framework-agnostic. The routing logic adapts to platform capabilities. The return contract is universal — every child must return the same structured shape regardless of framework.

## 11. SIBLING SKILLS — Complete Reference

### Delegation Family

| Skill | Relationship |
|---|---|
| `use-hivemind-delegation` | This skill — base protocol for all delegation |
| `hivemind-gatekeeping-delegation` | Iterative loops, synthesis gates, cascading failure recovery |
| `research-delegation` | Evidence collection, source validation, research thread management |
| `tdd-delegation` | Red-green-refactor loop enforcement, test gate enforcement |
| `course-correction-delegation` | Debug loops, refactor dispatch, architecture audit delegation |

### Referencing Skills

| Skill | Relationship |
|---|---|
| `use-hivemind-detox-refactor` | Router that triggers this skill — delegates slices here |
| `hivemind-codemap` | Codescan mode — this skill owns handoff discipline; codemap owns scan mechanics |
| `hivemind-system-debug` | Debug mode — debug delegation dispatches through this protocol |
| `spec-distillation` | Planning mode — distillation outputs feed into planning delegation |
| `context-intelligence-entry` | Stale session probe — delegate this when orchestrator context is suspect |
| `git-continuity-memory` | Git-aware continuity — commit SHAs and branch state recorded in packets |
| `hivemind-atomic-commit` | Commit discipline — delegation packets track commit-ready state |
| `context-entry-verify` | Pre-work verification — gates before delegation proceeds |

`activity_type` and `phase_type` enum values are defined in the pack-level AGENTS.md under Typed Activity Contract.

## 12. BUNDLED RESOURCES

| Resource | Purpose |
|---|---|
| `references/delegation-modes.md` | Sequential-first rules, parallel gate, mode fit |
| `references/delegation-decision.md` | Extended decision criteria, cost/benefit, when-not-to-delegate |
| `references/role-boundaries.md` | Parent/child responsibilities, invalid delegation examples |
| `references/codescan-delegation.md` | Agent selection, scan pass structure, resumable protocol |
| `references/failure-recovery.md` | Partial return, timeout, escalation |
| `templates/delegation-packet.md` | Full packet JSON template |
| `templates/handoff-brief.md` | Human-readable brief template |
| `templates/codescan-delegation-packet.md` | Codescan-specific packet template |
| `tests/direct-invocation.md` | Basic delegation scenario with validation |
| `tests/parallel-delegation.md` | Parallel dispatch scenario with validation |
| `tests/failure-recovery.md` | Blocked-route recovery scenario with validation |

## Shared Return Contract

Every delegation return MUST include:

| Category | Fields | Purpose |
|---|---|---|
| **Routing** | `activity_type`, `phase_type`, `mode`, `execution_mode` | Links return to storyline |
| **Identity** | `packet_id`, `task_id`, `pass_id`, `batch_id`, `slice_id` | Enables resume and deduplication |
| **Scope tracking** | `files_checked`, `clean_files`, `blocked_files`, `coverage_gaps` | Proves coverage |
| **Evidence** | `confirmed`, `inferred`, `unverified`, `confidence`, `artifacts_written` | Evidence before assertions |
| **Control** | `blocked_routes`, `recommended_next_action`, `open_loop_ids`, `open_packet_ids` | Enables orchestrator routing |

If a child cannot produce this shape, return a bounded partial result rather than pretending the slice is complete. A partial return with `status: "partial"` and populated `blocked_routes` is ALWAYS better than a fabricated `status: "complete"`.

## Role Boundaries

**Orchestrator (front-facing agent):**

- Chooses the slice, sets constraints, decides whether child may mutate files
- Emits the delegation packet before dispatch
- Synthesizes returns — does NOT read full output files
- Decides sequential vs parallel
- Handles failures and escalation

**Child (delegated agent):**

- Stays inside scope — NEVER exceeds `authority_surfaces` or `out_of_scope`
- Reports blocked routes instead of improvising new authority
- Returns evidence before conclusions
- Stops when the packet says stop
- Does NOT recursively self-delegate unless the packet explicitly permits it

**Enforcement:** If a child exceeds scope or mutates files outside `authority_surfaces`:

1. Mark the return as `scope_violation`
2. Do NOT merge the child's output
3. Re-delegate with tighter constraints or escalate to user

## Failure and Recovery

### Status Handling

| Status | Meaning | Orchestrator Action |
|---|---|---|
| `complete` | All success metrics met, evidence provided | Integrate. Proceed. |
| `partial` | Some work done, blockers exist | Check `blocked_routes`, resume from `recommended_next_action` |
| `blocked` | Cannot proceed, blocker not resolvable by child | Decompose slice further or escalate |
| `scope_violation` | Child exceeded boundaries | Do NOT merge. Re-delegate with tighter constraints. |

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

## Codescan Delegation

For code scanning work:

- **`hivexplorer` first** for all read-only scans (structure, exports, imports, seams, hotspots).
- **`general` only when** cross-file synthesis or deeper reasoning is needed.
- Track each scan pass through JSON checkpoints at `{activity}/codescan/{pass_id}/`.
- Support multi-pass chaining: `high-level-map` → `pipeline-map` → `journey-map` → `low-level-proof` → `cross-pass-synthesis`, each with its own `pass_id`.

Each deeper scan phase MUST read the previous phase synthesis artifact first. Do NOT skip straight to low-level proof while the high-level or pipeline model is still unresolved.

## Session Resume in Delegation

When delegating across turns or resuming prior delegations:

- Use `task_id` to resume a subagent that has prior context. Without it, the subagent starts fresh.
- Record `task_id` and `pass_id` in the delegation output for future resume.
- Record `branch`, `worktree`, `worktree_role`, `activity_type`, and `phase_type` so resume stays linked to current control context.

### Checking Prior Completion

1. Read `{activity}/delegation/{packet_id}-return.json`
2. Check `status` field: `complete` | `partial` | `blocked`
3. If `complete`: compare `scope` to current needs — re-delegate only if scope changed
4. If `partial`: resume from `recommended_next_action` — do NOT restart from scratch
5. If `blocked`: check `blocked_routes` — if resolvable, re-delegate with blocker addressed; if not, decompose further
6. If file does not exist: the prior delegation never returned — treat as timeout and re-delegate

### Git-Aware Continuity

When the child must commit:

- Use a worktree — record `worktree` and `worktree_role` in the packet
- Name branches per project convention
- Return artifacts MUST include commit SHAs if the child committed
- If the child only reads, `worktree` field may be empty

## Delegation Audit Trail

Append delegation events to `{activity}/delegation/registry.json` with:

- `packet_id`, `concern`, `dispatched_at`, `returned_at`, `status`
- This enables the orchestrator to query active/completed delegations

## Workflow Example

**Scenario:** The orchestrator detects 3 unrelated test failures in 3 different modules after a refactor.

**Step 1 — INTAKE:** Work touches 3 independent modules, each needing deep reads. Delegation criteria met. Choose `parallel` — modules share no imports.

**Step 2 — DECOMPOSE:** Three slices: module A tests, module B tests, module C tests. Each ≤3 files. Clean boundaries.

**Step 3 — ROUTE:** Emit 3 delegation packets with `mode: verification`, `execution_mode: parallel`. Each packet specifies the failing test file, error messages, and constraints.

**Step 4 — EXECUTE:** Dispatch 3 subagents in parallel. Each gets a self-contained prompt with full context.

**Step 5 — VERIFY:** Two return `status: "complete"`, one returns `status: "partial"` with `blocked_routes: ["requires shared/types.ts change"]`.

**Step 6 — SYNTHESIZE:** Integrate the 2 successful fixes. Re-delegate the blocked slice with expanded authority (`shared/types.ts` added to `authority_surfaces`).

**Step 7 — GATE:** After the third return, run the full test suite. All pass. Mark workflow complete.

## Independence Rules

- This package is self-contained for normal delegation flow.
- It does not require old router-to-router chains.
- It may be selected directly or from `use-hivemind-detox-refactor`.
- Delegation artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime.
