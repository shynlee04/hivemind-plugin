---
name: git-continuity-memory
description: Use when work must be resumed from git history, traced back to earlier decisions, or anchored for future recovery through commit-based continuity rather than remembered chat context.
---

# git-continuity-memory

This package is the local git-memory family for the refactored pack.

## Purpose
- recover the current task from commit history
- trace why a change exists
- extract stable decisions and rationale from git evidence
- emit small continuity outputs for future recovery

## Modes

| Mode | Use When | Output |
| --- | --- | --- |
| `resume` | continue prior work after interruption or compaction | continuity result |
| `trace` | understand why a commit or file changed | continuity result |
| `retrieve` | collect relevant decisions from a history slice | continuity result |
| `anchor` | prepare the next checkpoint for easier future recovery | anchor notes |

## Core Process
1. Confirm the repo and target history are readable.
2. Choose the narrowest evidence source first: recent commits, target commit, or file history.
3. Extract only stable memory fields: intent, decision, rationale, continuity markers, affected scope.
4. Separate confirmed evidence from inference.
5. Attach typed continuity markers: `activity_type`, `phase_type`, `branch`, `worktree`, `worktree_role`, and brief commit tags.
6. Emit a concise continuity result instead of a large knowledge graph.
7. End with one recommended next step.

## Session Continuity

This package also owns the convention for carrying session identity and state across turns.

- **At turn start:** read `{project}/.hivemind/activity/sessions/continuity.json` to recover session identity, active subsessions, and output paths from the prior turn.
- **At turn end:** update `continuity.json` with the current `ses_id`, `turn_count`, `last_turn_at`, `branch`, `worktree`, `worktree_role`, and any new subsession or output path entries.
- **Subagent resume:** use `task_id` from the SDK to resume a prior subagent context. Without `task_id`, a fresh subagent starts with no memory.
- **Long-haul tasks:** update `{project}/.hivemind/activity/longhaul/task-state.json` at each significant checkpoint so multi-turn work survives interruptions.
- **Commit anchors:** when a slice meaningfully changes planning, delegation, verification, or refactor state, record a brief commit anchor with tags rather than relying on freeform memory.

Use these shared enums when writing continuity state:

- `activity_type`: `distill`, `context-probe`, `planning`, `delegation`, `codescan`, `verification`, `debug`, `refactor`, `cleanup-review`, `continuity-anchor`, `handoff`, `documentation`
- `phase_type`: `entry`, `high-level-map`, `pipeline-map`, `journey-map`, `low-level-proof`, `cross-pass-synthesis`, `verification-gate`, `stabilization`

Read `references/session-continuity.md` for the full protocol and JSON schemas.

## Activity Pathing

All continuity artifacts (continuity state, handoff records, delegation results, scan outputs) are stored in a deterministic folder under `{project}/.hivemind/activity/`.

Read `references/activity-pathing.md` for the full folder structure, naming conventions, and path resolution rules.

## Do Not Use This For
- ordinary git operations like rebase or bisect
- commit message styling alone
- claims about history that are not backed by git evidence
- session state that should live in the platform SDK (do not reinvent `context.sessionID`; mirror it into internal continuity state only when you need durable local recovery)

## Bundled Resources
- `references/memory-fields.md`
- `references/retrieval-playbook.md`
- `references/anchor-format.md`
- `references/session-continuity.md`
- `references/activity-pathing.md`
- `templates/continuity-result.md`
- `tests/direct-invocation.md`

## Orchestrator Integration

When the orchestrator (front agent) uses this skill:
- **At session start:** the orchestrator reads `sessions/continuity.json` and `longhaul/task-state.json` to determine where to resume. This is a lightweight read — allowed in the main session.
- **For deep retrieval:** delegate `resume`, `trace`, or `retrieve` modes to a subagent rather than loading commit history into the orchestrator session.
- **At turn end:** the orchestrator updates the continuity state directly — this is a small write, not deep work.
- **Before destructive or branch-sensitive work:** verify branch/worktree control from continuity state and current git evidence before trusting any stored anchor.
- **If context feels stale:** delegate a fresh `context-intelligence-entry` probe and use the result to update continuity state, rather than trusting accumulated session memory.

## Independence Rules
- This package must work without old HiveMind memory routers.
- It is advisory and evidence-based.
- It does not mutate git state by itself.
- Session continuity state is stored in deterministic project-local paths, not remembered in chat context.
