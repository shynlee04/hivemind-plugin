---
name: agents-and-subagents-dev
description: This skill should be used when the user asks to "create an agent", "add an agent", "define agent permissions", "set up subagent delegation", "configure agent temperature", "create agent definition", mentions agent: in command context, subtask: flag, delegation patterns, worktree isolation, fork sessions, parallel tasks, or needs guidance on OpenCode agent architecture and subagent dispatch protocols.
---

# agents-and-subagents-dev

Define agents, configure delegation, and manage worktree isolation. Agents are role definitions with permissions, temperature, and model settings. Subagents are dispatched with constructed context — never session history.

## The Iron Law

```
NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT
```

Never pass session history to a subagent. Never say "read the plan file." Construct exactly what they need: full task text, scene-setting context, scope boundaries. Fresh context per task = no pollution.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll dispatch the subagent with the plan file path" | Subagent reads file, loses context, implements wrong thing | Paste full task text into the prompt. Always. |
| "The subagent can figure out the context" | Subagent guesses, guesses wrong, builds wrong thing | Scene-setting is the controller's job. |
| "I can run this in the main session, it's simple" | Main session context polluted, forgets original goal | Delegate. Always delegate. |
| "I'll run parallel subagents for speed" | They conflict on the same files, one overwrites the other | Parallel only for independent tasks (no shared files). |
| "The subagent said DONE, I'll trust it" | Subagent completed but missed edge cases | Two-stage review: spec compliance first, then quality. |
| "I don't need worktree isolation for this" | Changes bleed into main branch, can't rollback | Worktree is non-negotiable for implementation work. |

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`delegation-protocol.md`](references/delegation-protocol.md) for the dispatch envelope pattern, status handling, and two-stage review.
2. **MANDATORY - READ ENTIRE FILE**: Read [`worktree-control.md`](references/worktree-control.md) for git worktree isolation, fork sessions, and parallel task management.
3. **Do NOT load** other skills unless the agent specifically needs them.

## Delegation Protocol

The actual cycle:
1. Before dispatch: Extract full task text (not file path), construct context
2. Dispatch envelope: Task tool with role, task text, context, scope, output format
3. After return: Check status (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED), handle appropriately
4. Review (two-stage): Spec compliance first, then code quality. Stage 1 MUST pass before Stage 2.

For the full protocol with worked examples, load `references/delegation-protocol.md`.

## Status Protocol

| Status | What it means | Controller action |
|--------|--------------|-------------------|
| DONE | Task complete, verified | Proceed to spec review |
| DONE_WITH_CONCERNS | Complete but has doubts | Read concerns. If about correctness → address before review. If observation → note and proceed. |
| NEEDS_CONTEXT | Hit a knowledge gap | Provide missing context. Re-dispatch. |
| BLOCKED | Cannot proceed | Assess: context gap? needs stronger model? task too big? plan wrong? |

**Never** force the same model to retry without changes. If the subagent said it's stuck, something needs to change.

## Worktree Control

From session evidence, agents fail when they can't control isolation:
- Fork a session to multiple → start at any turn
- Start in parallel different kinds of task
- If not controlling git worktree → mostly failure

**The rule:** Implementation work happens in worktrees. Main branch is for integration only.

For worktree commands and patterns, load `references/worktree-control.md`.

## Validation Gate

Before an agent definition or delegation pattern is done:
- [ ] Agent has clear role (one sentence)
- [ ] Permissions are explicit (read/edit/write/bash/task/skill)
- [ ] Temperature and model are specified
- [ ] No overlap with existing agents' responsibilities
- [ ] Delegation envelope pattern is documented
- [ ] Status protocol is embedded (not referenced externally)
- [ ] Worktree control is addressed

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Context Polluter** — passing session history to subagent | Subagent prompt includes "earlier in the conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path instead of getting task text | Paste full task text into the prompt. Always. |
| **The Parallel Crasher** — parallel tasks on shared files | Subagents conflict, one overwrites the other | Parallel only for independent tasks (no shared files) |
| **The Trusting Controller** — accepting DONE without review | Subagent missed edge cases | Two-stage review: spec compliance first, then quality |
