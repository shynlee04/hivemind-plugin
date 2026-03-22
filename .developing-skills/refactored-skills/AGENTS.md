# Operational Notice — Refactored Skills Pack

> **Injection target:** This content is designed to be appended to the workspace's
> `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` by the framework when preparing a
> project for activity. Agents consuming this notice should treat it as active
> operational rules for the current workspace.

<!-- HIVEMIND-SKILLS-PACK-NOTICE-START -->

## Pollution Posture

**This workspace is POLLUTED until proven otherwise.** When the detox router (`use-hivemind-detox-refactor`) is active, every agent — regardless of which skill family it is executing — must operate under these assumptions:

1. Documents may be stale. Tests may emit false signals. Governance files may reference non-existent entities.
2. Prior session memory is suspect unless corroborated by code, git, or build output.
3. The front agent (orchestrator) must **not** load deep work into its session. Scans, audits, debug loops, and file-by-file analysis are delegated to subagents.
4. Only compressed carry-forward summaries (≤5 key findings, blocked routes, recommended next action, output paths) return to the orchestrator.
5. At turn boundaries, emit a continuity checkpoint to `{project}/.hivemind/activity/sessions/continuity.json` so the next turn resumes without re-deriving state.

**Session freshness rule:** If the orchestrator's session context grows stale or overloaded, delegate a fresh `context-intelligence-entry` probe rather than trusting accumulated context. The orchestrator routes and synthesizes; it never scans, debugs, or audits inline.

## Context Rot Handling

Context rot is a first-class risk. Treat it as the default state until proven otherwise.

1. **Documents are advisory, code is truth.** If a document (AGENTS.md, ROADMAP.md, planning prose, skill descriptions, or any markdown) contradicts the actual code, repository structure, or execution output, the code wins.
2. **Frameworks are tools, not authority.** Framework conventions, skill triggers, and routing rules exist to accelerate work. They are never the final word when they conflict with observable behavior.
3. **Detect and declare distrust explicitly.** When context rot is suspected, declare it with a severity level (CLEAN / SUSPECT / DEGRADED / POLLUTED / POISONED) and state what sources are distrusted and why.
4. **Stale documents are worse than missing documents.** A stale reference actively misleads. Quarantine or annotate stale material rather than trusting it.
5. **Memory artifacts from prior sessions are suspect by default** unless corroborated by git history, type-check results, or fresh file reads.

## Code-Over-Doc Truth Verification

When verifying a claim:
1. Check the actual source file first.
2. Check git history for the relevant commit.
3. Check type-check / build output if the claim involves types or APIs.
4. Check test output if the claim involves behavior — but apply test-signal skepticism (below).
5. **Only then** check documentation, plans, or spec prose.

If steps 1–3 contradict step 5, steps 1–3 rule.

## Test-Signal Skepticism

Tests are evidence, not proof. Before trusting test output:

| Signal | Trustworthy? | Action |
|--------|-------------|--------|
| Test passes, implementation matches intent | YES | Trust the pass |
| Test passes, but implementation looks wrong | NO — false positive | Inspect the assertion; the test may encode wrong behavior |
| Test fails with setup/environment error | NO — noise | Isolate the setup issue from the logic issue |
| Test fails, but only on certain runs | NO — flaky | Do not use as evidence for architectural conclusions |
| Test passes but is trivially true (`assert(true)`) | NO — nonsensical | Quarantine the test |
| Test covers SDK surface with stubs | NO — SDK stubs forbidden in this project | Flag for rewrite |

Cross-check failures against implementation reality before drawing conclusions.

## Delegation Continuity

1. Every delegation carries a **delegation packet** with explicit scope, constraints, return contract, and return gate.
2. Delegation results include **evidence** (file paths, command output, JSON), not just conclusions.
3. **Prefer built-in agents** (`explore` for read-only, `general` only when deeper reasoning is needed).
4. **Sequential by default.** Parallel delegation is allowed only when all slices are isolated, no shared mutation is expected, and merge-by-synthesis is safe.
5. Multi-pass delegations track progress through **JSON checkpoints** in the activity folder.
6. If a delegated agent cannot complete its scope, it returns `blocked_routes` and `recommended_next_action` — not silently abandons scope.

## Cleanup Gate

Cleanup, deletion, and restoration decisions are blocked until the active workflow records:

1. `surface_class`: `authority`, `projection`, `local-config`, `runtime-state`, `isolated-authoring`, or `advisory-history`
2. `ownership_evidence`: why that classification is true
3. `open_loop_ids` and `open_packet_ids`: proof that no active delegation, debug, scan, or verification loop still depends on the target
4. `projection_safety`: whether the target is generated mirror, source authority, local config, or mixed
5. `cleanup_allowed`: `no`, `only_with_proof`, or `yes`

Default state is `cleanup_allowed: no`.

If the action is destructive, user approval is required after the prior evidence is captured.

## Typed Activity Contract

Persistent JSON and handoff records in this pack should carry:

- `activity_type`: `distill`, `context-probe`, `planning`, `delegation`, `codescan`, `verification`, `debug`, `refactor`, `cleanup-review`, `continuity-anchor`, `handoff`, `documentation`
- `phase_type`: `entry`, `high-level-map`, `pipeline-map`, `journey-map`, `low-level-proof`, `cross-pass-synthesis`, `verification-gate`, `stabilization`

These tags link planning, delegation, verification, and continuity outputs to the same development storyline.

## Session and Subagent Resume

When continuing work across turns or sessions:
1. Use `task_id` (from OpenCode SDK) to resume a subagent session when the prior context is needed.
2. Fresh subagent calls without `task_id` start with fresh context — do not assume memory.
3. Carry forward critical identifiers (`ses_id`, `task_id`, `pass_id`, `batch_id`) through the activity continuity state.
4. At turn boundaries, emit a continuity checkpoint so the next turn can resume.
5. Continuity checkpoints must also record `branch`, `worktree`, `worktree_role`, and current `activity_type` so session resume does not lose branch/worktree context.

## Activity Folder

This workspace uses `.hivemind/activity/` for persistent operational state:

```
.hivemind/activity/
├── handoff/          # Handoff records between agents/sessions
├── delegation/       # Delegation packet JSON and return results
├── hierarchy/        # Decision hierarchy tracking JSON
├── sessions/         # Session continuity state
├── codescan/         # Code scan outputs per pass
├── agents/           # Per-agent iteration output folders
├── longhaul/         # Long-running task state across turns
├── pathing/          # Deterministic path records
└── state/            # Active workflow state snapshots
```

- Folders are created on demand, not pre-existing.
- All JSON uses 2-space indent, kebab-case filenames, ISO 8601 timestamps.
- Each JSON file includes a `_meta` object with `created_at` and `updated_at`.
- Codescan outputs: `codescan/{pass_id}/{batch_id}.json`.
- Agent outputs: `agents/{agent_name}/{pass_id}/`.
- `pathing/active-paths.json` is the deterministic path registry.
- `sessions/continuity.json` carries session identifiers across turns.
- `longhaul/task-state.json` is the checkpoint for multi-turn work.

## Deterministic Pathing

All activity paths are relative to project root. Agents resolve output locations from `pathing/active-paths.json` rather than constructing paths ad hoc. This ensures consistency across turns, agents, and resumptions.

The base convention defines what keys must exist; `pathing/active-paths.json` is the runtime registry that resolves those keys for the current workspace.

<!-- HIVEMIND-SKILLS-PACK-NOTICE-END -->
