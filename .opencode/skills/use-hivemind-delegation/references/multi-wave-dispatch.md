# Multi-Wave Dispatch Reference

Reference for orchestrating complex multi-agent dispatches through sequential waves of parallel work.

## Multi-Wave Dispatch Overview

Waves are sequential batches of parallel agents. Each wave builds on the prior wave's compressed synthesis — not raw output. Gates sit between waves, and no wave proceeds without the prior synthesis passing its gate.

The pattern surfaces when a task is too large for a single agent but too interconnected for one-shot parallel dispatch. Decomposition into waves keeps context bounded while enabling multi-concern work.

## The Full Dispatch Flow

```
Wave 1: Parallel investigation swarms
  ├─ hivexplorer (codebase structure)
  ├─ hivexplorer (dependency map)
  └─ hivexplorer (test coverage)
        └─ SYNTHESIZE → ≤5 items
Wave 2: Parallel research (sequential to Wave 1)
  ├─ hiverd (external: API docs, patterns)
  └─ hivexplorer (internal: cross-validate)
        └─ SYNTHESIZE → ≤5 items
Checkpoint: Master plan
  ├─ hiveplanner (decompose)
  └─ architect (validate)
        └─ SYNTHESIZE → plan with phases
Wave 3: Parallel implementation
  ├─ hivemaker (Phase 01)
  └─ hitea (tests for Phase 01)
        └─ GATE → hiveq
Wave 4: Verification + review
  ├─ hiveq (integration)
  └─ code-skeptic (adversarial review)
        └─ GATE → commit
```

### Wave Breakdown

**Wave 1** — Investigation. Three parallel hivexplorer agents map the codebase from different angles: structural layout, dependency graph, and test coverage. Each returns findings with `file:line` evidence. Orchestrator synthesizes into ≤5 key items.

**Wave 2** — Research. External research (API docs, known patterns) runs in parallel with internal cross-validation. Synthesis produces ≤5 validated findings.

**Checkpoint** — Planning gate. Hiveplanner decomposes findings into phased tasks. Architect validates feasibility. Synthesis produces the master plan.

**Wave 3** — Implementation. Hivemaker implements the first phase while hitea writes tests concurrently. Gate: hiveq verifies integration before proceeding.

**Wave 4** — Verification and adversarial review. Hiveq runs integration checks. Code-skeptic attacks the implementation. Gate: both pass before commit.

## Wave Rules

<HARD-GATE>
**Rule 1: Wave 1 always starts with investigation.**
No implementation, no research, no planning — until the codebase has been mapped. Skipping Wave 1 means building on assumptions.
</HARD-GATE>

<HARD-GATE>
**Rule 2: Each wave consumes prior wave's synthesis — not full output.**
Car-forward is compressed: ≤5 findings, blocked routes, next action, output paths. Full output stays in agent activity folders.
</HARD-GATE>

<HARD-GATE>
**Rule 3: Waves are sequential. Parallel happens WITHIN a wave.**
Wave 2 cannot start until Wave 1 synthesis passes. No overlap, no "optimistic" early dispatch.
</HARD-GATE>

<HARD-GATE>
**Rule 4: Gates between waves are mandatory.**
Each synthesis step is a gate. If synthesis fails or produces unclear output, the wave re-runs — not the next wave.
</HARD-GATE>

<HARD-GATE>
**Rule 5: Carry-forward max is ≤5 items.**
Five findings. Five blocked routes. Five output paths. If you need more, the wave scope is too broad — split it.
</HARD-GATE>

## Investigation Swarm Pattern

The orchestrator launches N parallel hivexplorer agents. Each receives a bounded slice:

- **One module** or **one concern** or **one pipeline**
- Slices must share no files or state
- No cross-talk between agents during execution

Each agent returns:
- Findings with `file:line` references
- Evidence (command output, file snippets, type-check results)
- Output paths (where their full report lives)

The orchestrator reads **only** the compressed synthesis. Full output stays in `.hivemind/activity/agents/{agent_name}/{pass_id}/` for audit.

## Hierarchical Consumption

```
Wave 1 output → feeds Wave 2 decision
Wave 2 output → feeds Checkpoint planning
Checkpoint output → feeds Wave 3 implementation
Wave 3 output → feeds Wave 4 verification
```

**Never skip waves.** A planning checkpoint without investigation synthesis produces plans built on sand. An implementation wave without research validation produces code that may fight the existing architecture.

**Compressed carry-forward template:**
- ≤5 key findings
- Blocked routes (what was tried and failed)
- Recommended next action
- Output paths (where full evidence lives)

## Parallel Dispatch Gate

Parallel dispatch within a wave is allowed **only when** all conditions hold:

1. Slices share no files or state
2. Each slice is self-contained (no imports from other slices)
3. No import conflicts across agents
4. Integration verification is planned for post-wave

If **any** condition fails → sequential dispatch. No exceptions.

## Dynamic Skill Assignment During Waves

The orchestrator composes skill batches per wave, rotating depth skills as the task enters new phases:

| Wave       | Entry                 | Domain                    | Depth(s)                       |
| ---------- | --------------------- | ------------------------- | ------------------------------ |
| Wave 1     | use-hivemind          | use-hivemind-delegation   | hivemind-codemap               |
| Wave 2     | use-hivemind          | use-hivemind-delegation   | use-hivemind-research          |
| Checkpoint | use-hivemind          | use-hivemind-planning     | hivemind-spec-driven           |
| Wave 3     | use-hivemind          | use-hivemind-tdd          | hivemind-gatekeeping           |
| Wave 4     | use-hivemind          | use-hivemind-delegation   | hivemind-gatekeeping           |

**Rules:**
- Drop skills that are no longer relevant before loading replacements
- Depth skills may accumulate if the task needs multiple complementary methodologies
- Load in dependency order (prerequisites first)
- The orchestrator decides batch composition based on workflow state

## Cross-Team Dispatch Considerations

Before dispatching in a shared repository:

1. **Check `git status`** — identify uncommitted work from other agents or teams
2. **Scope boundaries** — account for other teams' active branches and files
3. **Shared files** — sequential dispatch only; never parallel agents editing the same file
4. **Post-implementation** — verification agent checks contract compatibility (types, exports, API surface)

## Anti-Patterns

| Anti-Pattern | What Happens | Correct Behavior |
|---|---|---|
| **Skipping Wave 1** | Implementation dispatches without codebase map. Agents discover dependencies mid-task, scope explodes. | Always start with investigation swarm. No exceptions. |
| **Full output in carry-forward** | Orchestrator context window fills with raw agent output. Next wave starts bloated, makes worse decisions. | Synthesize to ≤5 items. Full output stays in activity folders. |
| **Parallel iterations** | Two hivemakers edit the same file simultaneously. Merge conflicts, lost work, broken builds. | Iterations are sequential by design. One agent modifies, next agent verifies. |
| **No integration verification** | Parallel wave completes, each slice works in isolation, combined state is broken. | Every parallel wave must have a post-wave integration gate (hiveq). |
| **Stale synthesis** | Wave 2 runs on Wave 1 synthesis from a prior session. Files have changed, findings are outdated. | Re-verify context between waves. If >1 hour gap, re-run investigation. |
