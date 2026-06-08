---
name: hf-agents-and-subagents-dev
description: >
  This skill should be used when the user asks to "create an agent", "add an agent", "define agent permissions", "set up subagent delegation", "configure agent temperature", "create agent definition", mentions agent: in command context, subtask: flag, delegation patterns, worktree isolation, fork sessions, parallel tasks, or needs guidance on OpenCode agent architecture and subagent dispatch protocols.
metadata:
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
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

## OpenCode Agent Configuration

Every agent definition is a `.md` file with YAML frontmatter. The frontmatter controls how OpenCode routes, displays, and executes the agent.

### Required Frontmatter Fields

```yaml
---
name: hf-agents-and-subagents-dev
description: "One-line role description with trigger context"  # REQUIRED
mode: "all"                          # REQUIRED — "all" = can be main AND subagent
tools: Read, Write, Edit, Bash, Grep, Glob, Task  # REQUIRED — comma-separated
color: "#hex or name"                # REQUIRED — visual identifier in UI
---
```

### Optional Frontmatter Fields

```yaml
hidden: true                         # Hides agent from user Tab-key selection surface
temperature: 0.2                     # 0.0-1.0. Lower = deterministic, higher = creative
```

### Mode: "all" — Dual-Role Agents

Setting `mode: "all"` means the agent can operate as BOTH:
- **Main agent** — user selects it directly via Tab key
- **Subagent** — dispatched by another agent via `Task` tool

Agents with `mode: "all"` can also delegate further downstream. A researcher agent can spawn a builder subagent, which can spawn a critic subagent.

**When to use `mode: "all"`:** Specialist agents that serve multiple roles (researcher, builder, critic, explore). These are the workhorses of delegation chains.

**When NOT to use `mode: "all"`:** Narrow-scope agents that should only run as subagents (e.g., a validator that only runs after build tasks).

### Hidden: true — Removing From User Selection

Setting `hidden: true` removes the agent from the user's Tab-key selection surface. The agent still exists and can be dispatched by other agents — users just can't select it directly.

**When to use `hidden: true`:**
- Internal utility agents (validators, formatters, checkers)
- Agents that only make sense as part of a delegation chain
- Agents that would confuse users if exposed directly

**When NOT to use `hidden: true`:**
- Primary agents users interact with (orchestrator, coordinator, conductor)
- Agents that solve common user requests directly

### Subtask: True/False — Command-Level Delegation

Commands control agent dispatch via the `subtask:` field in command frontmatter:

```yaml
agent: gsd-executor     # Which agent handles this command
subtask: true           # Spawn as subagent (isolated session)
```

| Value | Behavior |
|-------|----------|
| `subtask: true` | Spawns the agent as a subagent in an isolated session. Returns results when done. |
| `subtask: false` | Switches the main session to the targeted agent. Agent takes over the conversation. |
| (omitted) | Command runs inline without agent switching. |

**Use `subtask: true`** for discrete tasks with clear completion (research, code generation, audits).

**Use `subtask: false`** when the user needs to continue working with the agent interactively (orchestration, planning, debugging).

### Session ID Tracking (ses_idxxxxx)

When agents delegate and the delegation fails, they sometimes create new sessions instead of resuming. To track and resume delegated sessions:

1. Search for `ses_` patterns in the session state directory:
   ```bash
   grep -r "ses_" .opencode/state/ 2>/dev/null
   ```
2. Session IDs follow the pattern `ses_xxxxxxxx` (8 hex characters).
3. Use the session ID to resume the delegated session and continue work.

**Why this matters:** Long delegation chains can lose context if intermediate sessions fail. Session ID tracking lets you pick up where the delegation left off instead of starting over.

## Validation Gate

Before an agent definition or delegation pattern is done:
- [ ] Agent has clear role (one sentence)
- [ ] Permissions are explicit (read/edit/write/bash/task/skill)
- [ ] Temperature and model are specified
- [ ] No overlap with existing agents' responsibilities
- [ ] Delegation envelope pattern is documented
- [ ] Status protocol is embedded (not referenced externally)
- [ ] Worktree control is addressed

## Worked Example: Full Delegation Cycle

**Scenario:** User asks "research the best auth library for our Next.js app"

```
Step 1: Construct context (NOT session history)
  Task: "Research auth libraries for Next.js. Compare: NextAuth, Lucia, Auth.js. 
  Criteria: SSR support, middleware patterns, TypeScript types, community adoption.
  Deliverable: Recommendation table with rationale."
  
Step 2: Dispatch envelope
  Task tool → researcher agent
  Context: "You are a researcher. Read-only access. Output markdown table."
  Scope: "Do NOT write code. Only compare libraries."
  
Step 3: After return → status = DONE_WITH_CONCERNS
  Concern: "Auth.js v5 has breaking changes not covered"
  Action: Note concern, proceed to review
  
Step 4: Two-stage review
  Stage 1 (Spec): Did it compare 3 libraries? Yes. Criteria covered? Yes.
  Stage 2 (Quality): Is the table readable? Yes. Citations present? Yes.
  Result: PASS
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Context Polluter** — passing session history to subagent | Subagent prompt includes "earlier in the conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path instead of getting task text | Paste full task text into the prompt. Always. |
| **The Parallel Crasher** — parallel tasks on shared files | Subagents conflict, one overwrites the other | Parallel only for independent tasks (no shared files) |
| **The Trusting Controller** — accepting DONE without review | Subagent missed edge cases | Two-stage review: spec compliance first, then quality |

## Self-Correction

### When the Task Keeps Failing
[Detection] Subagent returns NEEDS_CONTEXT or BLOCKED after 3 dispatch attempts with the same prompt. Same status protocol outcome persists after providing missing context. Subagent keeps missing edge cases in two-stage review.
[Recovery] STOP re-dispatching. Something fundamental needs to change — not just the prompt text. Options: (1) Split the task into smaller units, (2) Switch to a stronger model, (3) Re-examine the task scope (is it actually achievable?), (4) Add a discovery step before implementation. Never force the same model to retry without changes.

### When Unsure About the Next Step
[Detection] Unclear whether to use worktree isolation or main branch. Not sure if tasks can run in parallel or must be sequential. Subagent status is DONE_WITH_CONCERNS but the concern is ambiguous.
[Recovery] For worktree decisions: if the task mutates files → use worktree isolation. Main branch is for integration only. For parallelism: check if subagents share any files — if yes, run sequentially. If no shared files, run in parallel. For ambiguous DONE_WITH_CONCERNS: read the concerns carefully. If about correctness → address before review. If an observation → note and proceed to two-stage review.

### When the User Contradicts Skill Guidance
[Detection] User says "just run it in the main session, it's simple" (violating delegation mandate). User says "pass the file path, the subagent can read it" (violating constructed context mandate). User says "skip the two-stage review, I trust the output."
[Recovery] Acknowledge but warn: "The Iron Law states NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT. Passing a file path forces the subagent to guess context. Two-stage review catches edge cases that DONE doesn't guarantee." If the user insists, proceed but document the skipped safety measure and note: "User-authorized shortcut. Risk: [specific risk]."

### When an Edge Case Is Encountered
[Detection] Subagent needs a tool it doesn't have permission for. Parallel subagents produce merge conflicts despite different files. Delegation chain depth exceeds 3 levels. Session ID tracking can't find the ses_ pattern in state directory.
[Recovery] For missing tool permissions: either add the tool to the subagent's definition or split the task so the controller handles the tool-requiring step. For merge conflicts: run the conflicting subagents sequentially on the next attempt. For deep delegation chains: flatten — the controller should manage direct dispatch rather than chain. For missing session IDs: check both `.opencode/state/` and `.hivemind/state/` for session files. If not found, the delegation may have failed before creating a session — re-dispatch with a fresh task.

## Hivemind Tooling Alignment

This skill teaches the loading agent how to use Hivemind's custom toolings. The agent that loads this skill should declare the following tools in its frontmatter:

```yaml
tools:
  - configure-primitive,delegate-task,hivemind-doc
```

### Migration from GSD

If the loading agent has legacy `gsd-*` SDK references, replace with Hivemind equivalents:

| GSD tool | Hivemind equivalent |
|---|---|
| `gsd-tools` CLI | `configure-primitive` + `delegate-task` |
| `gsd-state` JSON manipulation | `hivemind-doc` (read/chunk/search) |
| `gsd-context-monitor` | `hivemind-trajectory` (record events) |
| `gsd-prompt-guard` | `prompt-analyze` (or manual review) |

### Cross-References

This skill aligns with the new tech-agnostic primitive ecosystem:
- Routing: `hm-coord-router` (intent classification + agent pairing)
- Coordination: `hm-coord-loop` (multi-agent dispatch)
- Specialist example: `hm-test-driven`, `hm-debug-systematic`, `hm-arch-refactor`
- Governance: `hivemind-power-on` (load first)
- Quality gates: `hm-gate-triad` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed for end-to-end workflows.
