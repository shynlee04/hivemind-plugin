---
name: hivemind-delegation-protocol
description: Use when work must be delegated, split into subagent slices, or handed off with explicit scope, role boundaries, constraints, and return contracts.
---

# hivemind-delegation-protocol

This package is the local delegation family for the refactored pack.

## Purpose
- decide whether delegation is actually needed
- bound scope before any handoff
- choose sequential vs parallel mode deterministically
- emit reusable delegation packets and handoff briefs

## Use This For
- user explicitly asks to delegate or split work
- router stages produce multiple bounded slices
- role or authority boundaries must be explicit before handoff
- verification, research, planning, and execution need different packets

## Do Not Use This For
- normal single-slice execution
- vague delegation with no scope or return contract
- recursive delegation when the parent scope is already unclear

## Orchestrator Protection

When delegation is triggered from the detox router or any polluted-context session:

1. **The orchestrator emits the packet; the subagent does the work.** The orchestrator must not perform deep reads, scans, or audits itself.
2. **Return contracts must include a compressed carry-forward** (≤5 findings + blocked routes + next action). The orchestrator does NOT read full output files — only summary fields and output paths.
3. **If the orchestrator finds itself doing multi-file reads after dispatching a delegation,** it is violating session freshness discipline. Stop and wait for the subagent return.
4. **Stale context is a delegation trigger.** If the orchestrator's accumulated context becomes unreliable, delegate a fresh `context-intelligence-entry` probe instead of continuing with suspect information.

## Core Protocol
1. Confirm the work is true delegation, not ordinary execution.
2. Write the slice boundary: scope, out-of-scope, constraints, success metrics.
3. Choose the mode: `research`, `execution`, `verification`, or `planning`.
4. Choose `sequential` by default; allow `parallel` only for isolated slices.
5. Tag the work with `activity_type` and `phase_type` before dispatch.
6. Emit a delegation packet and handoff brief before dispatch.
7. Require a structured return with findings, evidence, blocked routes, and next action.

## Shared Return Contract

Every meaningful delegation return should include:

- routing: `activity_type`, `phase_type`, `mode`, `execution_mode`
- identity: `packet_id`, `task_id`, `pass_id`, `batch_id`, `slice_id`
- scope tracking: `files_checked`, `clean_files`, `blocked_files`, `coverage_gaps`
- evidence: `confirmed`, `inferred`, `unverified`, `confidence`, `artifacts_written`
- control: `blocked_routes`, `recommended_next_action`, `open_loop_ids`, `open_packet_ids`

If a child cannot produce this shape, it should return a bounded partial result rather than pretending the slice is complete.

## Delegation Modes

| Mode | Use When | Primary Output |
| --- | --- | --- |
| `research` | evidence or discovery is still missing | handoff brief + findings |
| `execution` | the slice is bounded and implementation-ready | handoff brief + slice result |
| `verification` | the output must be hard proof, not a fix | handoff brief + verification result |
| `planning` | the child should return stages, not edits | handoff brief + bounded plan |

Read `references/delegation-modes.md` and `references/role-boundaries.md`.

## Codescan Delegation

For code scanning work, use structured delegation with specific agent selection:
- **`explore` first** for all read-only scans (structure, exports, imports, seams, hotspots).
- **`general` only when** cross-file synthesis or deeper reasoning is needed.
- Track each scan pass through JSON checkpoints at `{activity}/codescan/{pass_id}/`.
- Support multi-pass chaining: `high-level-map` -> `pipeline-map` -> `journey-map` -> `low-level-proof` -> `cross-pass-synthesis`, each with its own pass_id.

Each deeper scan phase must read the previous phase synthesis artifact first. Do not skip straight to low-level proof while the high-level or pipeline model is still unresolved.

Read `references/codescan-delegation.md` for agent selection table, scan pass structure, resumable scan protocol, and bash helper integration.

## Iterative Loop Control

For multi-pass or iterative delegation:
- Set `max_iterations` before starting (default: 10).
- Each iteration produces a compressed `carry_forward` summary — not full output.
- The checkpoint file is the loop's memory — read it before deciding the next iteration.
- Stop when any stop condition fires. Never iterate past `max_iterations`.
- For fine-grained tracking within an iteration, use bead-style progress records.
- `cleanup_allowed` stays `no` while any active loop or packet remains open.

Read `references/iterative-loop-control.md` for checkpoint schema, carry-forward compression, bead-style tracking, and storage conventions.

## Session Resume in Delegation

When delegating across turns or resuming prior delegations:
- Use `task_id` to resume a subagent that has prior context. Without it, the subagent starts fresh.
- Record `task_id` and `pass_id` in the delegation output for future resume.
- Record `branch`, `worktree`, `worktree_role`, `activity_type`, and `phase_type` so resume stays linked to current control context.
- Read `{activity}/delegation/{packet_id}-return.json` to check if a prior delegation completed before re-delegating.

## Bundled Resources
- `references/delegation-modes.md`
- `references/role-boundaries.md`
- `references/codescan-delegation.md`
- `references/iterative-loop-control.md`
- `templates/delegation-packet.md`
- `templates/handoff-brief.md`
- `tests/direct-invocation.md`

## Independence Rules
- This package is self-contained for normal delegation flow.
- It does not require old router-to-router chains.
- It may be selected directly or from `use-hivemind-detox-refactor`.
- Delegation artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime.
