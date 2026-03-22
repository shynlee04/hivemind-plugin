# Refactored Skills Pack

This directory is the main local skill pack.

Treat the skills here as the reusable pack for most framework-facing work:
- `spec-distillation` for noisy or contradictory requests
- `context-intelligence-entry` for session/context diagnostics, rot detection, distrust handling
- `context-entry-verify` for hard project proof
- `use-hivemind-delegation` for bounded delegation, handoff packets, codescan delegation, iterative loop control
- `git-continuity-memory` for recovery from git history, continuity anchors, session carry-forward, activity pathing
- `hivemind-codemap` for repo mapping, seam discovery, structured bash scanning
- `hivemind-system-debug` for reproduction, containment, and debug-to-refactor transitions
- `use-hivemind-detox-refactor` as the thin advanced router across the pack

## Pack Shape

1. `spec-distillation` if the request is still vague.
2. `context-intelligence-entry` if current context trust is unclear.
3. `context-entry-verify` if you need hard build/test/git proof.
4. `use-hivemind-detox-refactor` when the task becomes multi-stage and needs routing.
5. From the router, branch into:
   - `use-hivemind-delegation`
   - `git-continuity-memory`
   - `hivemind-codemap`
   - `hivemind-system-debug`

## Pollution Posture

When `use-hivemind-detox-refactor` is active, the workspace is **POLLUTED until proven otherwise.** Every skill in this pack enforces:

1. Documents are advisory, code is truth.
2. Prior session memory is suspect — verify from code, git, or build output.
3. The orchestrator (front agent) routes and synthesizes. It does NOT scan, debug, or audit inline.
4. Deep work is delegated. Only compressed carry-forward (≤5 findings, blocked routes, next action, output paths) returns to the orchestrator.
5. At turn boundaries, emit a continuity checkpoint so the next turn resumes without re-deriving state.

Each skill's SKILL.md includes an **Orchestrator Integration** section defining exactly what the orchestrator loads vs delegates.

## Boundary Vocabulary

Use these terms consistently across the pack:

- `source authority`: repo-owned source of truth for behavior or content.
- `official boundary`: platform or SDK-facing interface such as OpenCode runtime fields, plugin/tool contracts, or live repo behavior.
- `internal-only artifact`: pack-owned JSON, schema, template, or helper used to coordinate work inside this pack.
- `runtime projection`: generated mirror of an authority surface; useful evidence, never primary truth by itself.
- `local config`: user- or workspace-managed config that may be local but is not disposable projection.
- `runtime state artifact`: generated operational state written during execution.
- `isolated authoring artifact`: local drafting or refactor material not yet promoted to an authority surface.
- `advisory document`: prose, report, or history that informs decisions but does not override code or official interfaces.

## Cleanup Gate

Cleanup, deletion, or restoration is prohibited by default.

Before any cleanup-like action, the active skill flow must record all of the following:

1. `surface_class` as one of `authority`, `projection`, `local-config`, `runtime-state`, `isolated-authoring`, or `advisory-history`.
2. `ownership_evidence` showing why that classification is true.
3. `open_loop_ids` and `open_packet_ids`, proving no active delegation, codescan, debug, or verification loop still depends on the surface.
4. `projection_safety`, explaining whether the target is a generated mirror, source authority, or mixed local config.
5. `cleanup_allowed`, which stays `no` until the prior fields are complete.

If the target is destructive cleanup, require explicit user approval after the pack records the prior evidence.

## Typed Activity Taxonomy

Every persistent record in this pack should carry an `activity_type` and, when applicable, a `phase_type`.

- `activity_type`: `distill`, `context-probe`, `planning`, `delegation`, `codescan`, `verification`, `debug`, `refactor`, `cleanup-review`, `continuity-anchor`, `handoff`, `documentation`
- `phase_type`: `entry`, `high-level-map`, `pipeline-map`, `journey-map`, `low-level-proof`, `cross-pass-synthesis`, `verification-gate`, `stabilization`

These types apply to planning, delegation, codescan, continuity, and commit-anchor records so the next session can recover intent without replaying full chat history.

## AGENTS.md — Injection Content

`AGENTS.md` in this directory is **not read automatically by the skills themselves.** It is the notice text meant to be injected into the consumer workspace's governance file (`AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`) during activity preparation. Once injected, that notice becomes an active runtime rule set for the consumer workspace.

## Cross-Cutting Conventions

### Activity Folder

All skills in this pack use a shared `{project}/.hivemind/activity/` folder for persistent operational state. The folder structure and naming conventions are defined in `git-continuity-memory/references/activity-pathing.md`.

### Session Continuity

Session identifiers (`ses_id`, `task_id`, `pass_id`, `batch_id`) are carried across turns through `{project}/.hivemind/activity/sessions/continuity.json`. The continuity file is an internal pack artifact that mirrors selected official identifiers such as OpenCode `sessionID`; it is not a competing platform session authority. The protocol is defined in `git-continuity-memory/references/session-continuity.md`.

Each continuity record should also carry `branch`, `worktree`, `worktree_role`, `activity_type`, `phase_type`, and a brief `commit_anchor` tag set so planning, delegation, verification, and recovery work stay linked to session, branch, and worktree control.

### Context Distrust

When documents, frameworks, or tests cannot be trusted, the distrust protocol in `context-intelligence-entry/references/context-distrust-protocol.md` applies. False signal detection rules are in `context-intelligence-entry/references/false-signal-detection.md`.

### Codescan Delegation

Code scanning delegation follows the agent selection and scan pass patterns in `use-hivemind-delegation/references/codescan-delegation.md`. Iterative loop control uses `use-hivemind-delegation/references/iterative-loop-control.md`.

Codescan must run by phases: `high-level-map` -> `pipeline-map` -> `journey-map` -> `low-level-proof` -> `cross-pass-synthesis`. Each deeper phase must read the prior phase synthesis artifact first rather than restarting from raw low-level reads.

### Bash Scan Tooling

`hivemind-codemap/scripts/hm-codescan.sh` provides structured JSON output for code scanning. See the codemap SKILL.md for usage examples.

## Rule

- This pack is intended to stand on its own.
- Do not require deleted sibling skills outside this directory for the normal path.
- References to old root-only skills should be treated as migration history, not active dependencies.
- Planning, delegation, continuity, and codescan artifacts should prefer shared typed JSON contracts over freeform notes when the workflow needs resumability or loop enforcement.
