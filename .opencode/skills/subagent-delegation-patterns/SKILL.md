---
name: subagent-delegation-patterns
description: >
  Framework-agnostic subagent delegation patterns for OpenCode. Use when deciding
  which delegation tool to use: "task tool", "delegate-task", "execute-slash-command",
  "subagent dispatch", "parent session stacking", "delegation status check",
  "attach work to existing session", "child session delegation", "WaiterModel dispatch",
  "session stacking", "delegation monitoring", "check delegation status",
  "how to delegate to an agent", "subagent vs delegate-task", "async delegation",
  "stack onto session", "delegation anti-patterns", "permission-aware dispatch".
  Also triggers on: parallel tasks, complex async work, command dispatch with agent override,
  monitoring running delegations, or when the agent needs to choose between task tool
  and delegate-task for subagent work. NOT for simple one-step tool calls or single-file edits.
metadata:
  layer: "2"
  role: "delegation-specialist"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - delegate-task
  - delegation-status
  - execute-slash-command
  - session-tracker
  - session-hierarchy
  - session-context
  - hivemind-session-view
  - hivemind-command-engine
  - session-journal-export
  - hivemind-sdk-supervisor
  - configure-primitive
---

# Subagent Delegation Patterns

## The Iron Law

```
Delegate scope, not trust. Stack context, not sessions.
```

## Overview

Subagent delegation is the mechanism for distributing work across agent sessions in OpenCode. Three primary dispatch tools exist — `task` (native subagent), `delegate-task` (WaiterModel SDK), and `execute-slash-command` (command dispatch + agent override) — each suited to different patterns of work. This skill documents when to use each tool, how to stack delegations onto existing sessions, how to monitor running delegations, and what anti-patterns to avoid.

This skill is framework-agnostic: it describes delegation using OpenCode runtime concepts (session, tool, agent, prompt, task). No project-specific or framework-specific prefixes are referenced.

## On Load

1. Read the **Differentiation Matrix** below — the core decision tool for choosing between `task`, `delegate-task`, and `execute-slash-command`
2. If stacking onto an existing session, read `references/session-stacking-protocol.md`
3. If checking delegation status, read `references/status-checking-protocol.md`

**Do NOT load** `references/delegation-tools-comparison.md` unless you need the extended comparison table with edge cases.

## The Differentiation Matrix

| Dimension | `task` tool (PREFERRED & STANDARD) | `delegate-task` (ON MAINTENANCE) | `execute-slash-command` |
|-----------|----------------------------------|----------------------------------|------------------------|
| **Mechanism** | Native OpenCode subagent dispatch | WaiterModel SDK child-session dispatch | Command dispatch + synthetic parent prompt |
| **When to use** | **All tasks** (Code editing, plans, artifacts, research, audit, review, verification) | Deprecated/maintenance — do not use | Command execution, agent override, one-shot dispatch |
| **Monitoring** | User-visible progress (click to view); runtime manages lifecycle | Manual polling via `delegation-status` tool | Return value + synthetic response from agent |
| **Stacking** | Automatic via `task_id` parameter (completed, failed, active sessions) | Explicit via `parentSessionId` in context JSON | N/A — one-shot, no session attachment |
| **Limitations** | Synchronous/blocking per call | Maintenance status — disabled on some agents | Agent override must exist as a definition |
| **Output** | Final message from subagent to caller | Pollable via `delegation-status` — returns state + output | Command result + optional synthetic prompt output |
| **Use case profile** | Standard tool for all subagent tasks (handles 40+ tool calls) | Maintenance fallback only | Agent override, discover commands, proxy dispatch |
| **Budget control** | Inherits from parent session | Explicit turn/token limits via config | Inherits from target agent definition |

### Quick Decision Flow

```
Is the work a one-shot command or agent override?
  YES → execute-slash-command (command, agent parameter)

Is the work a multi-step task (code editing, planning, research, audit, review, or verification)?
  YES → task tool (PREFERRED for all work; delegate-task is on maintenance)

Do you need to attach work to an existing completed, failed, or active session?
  YES → ALWAYS use task tool with task_id (session stacking)

Are you unsure which agent has the right tools?
  → Use hivemind-command-engine to discover commands
  → Use configure-primitive or hivemind-sdk-supervisor to verify agent readiness
```

## Pattern 1: Task Tool — Code & Artifact Dispatch (HIGH CONTROL)

**Use for ALL code editing, governance documents, and artifact modifications** (state, roadmap, architecture, requirements, planning). The task tool handles 40+ consecutive tool calls perfectly with user-visible progress — the user can click to view subagent progress at any time.

**Why task tool for code/artifacts:**
- **Full control** — user can see every tool call, every file edit
- **High capacity** — handles 40+ consecutive tool calls without degradation
- **Direct lineage** — auto-chained by runtime, preserving session hierarchy
- **User-visible** — click-through progress means no "black box" execution

**Example:**

```
# Code editing — task tool for full visibility
# Governance document modification — task tool for full control
# State/roadmap/plan artifact changes — task tool for audit trail
```

**When it works best:**
- Code editing (file creation, modification, deletion)
- Core governance documents (roadmap, requirements, architecture, planning artifacts)
- State modifications requiring user visibility and audit trail
- Multi-step code changes with high tool call volume (40+ calls)
- Any task where the user needs to monitor what is happening

**When NOT to use:**
- Research tasks (use `task` tool)
- Audit/review tasks (use `task` tool)
- Verification against specifications (use `task` tool)
- Purely informational lookups (use `task` tool)

**Stacking onto an existing session:** Pass `task_id` parameter to resume the same subagent session. This continues the previous session rather than creating a new one.

## Pattern 2: Delegate-Task — On Maintenance (DO NOT USE)

Per project rules in AGENTS.md, the `delegate-task` tool is on maintenance. Use the native `task` tool for all delegations instead.

Why delegate-task is avoided:
- Maintenance status — disabled on primary product developer agents (e.g., `hm-l0-orchestrator`).
- Mismatched permissions — causes routing confusion and LLM hallucinations.

Example:

```
# DO NOT use delegate-task
# Always use the native task tool with task_id for stacking
```

When to use task tool instead:
- Research, planning, implementation, review, debug, quality, documentation.
- Any task requiring subagent dispatch. The native `task` tool is fully verified.

**Session stacking:** See Pattern 4.

## Pattern 3: Execute-Slash-Command — Command Dispatch

Use when dispatching a registered OpenCode command, optionally overriding the target agent. This tool sends the expanded command body as either:
- A **synthetic parent prompt** (when `subtask: false` + `agent` set) — the target agent runs one turn, then control is restored
- A **subtask dispatch** (when `subtask: true`) — dispatched as a SubtaskPartInput
- A **simple command execution** (no overrides) — appended to the current session

**Example:**

```
# Execute a command with agent override
# The agent runs, returns result, control returns to caller
#
# Or: execute command directly without agent override
```

**When it works best:**
- Executing registered slash commands (discovered via `hivemind-command-engine`)
- One-shot agent override — need a different agent to handle a single request
- Proxy dispatch — front-facing agent routes work to a specialist for one turn
- Commands with defined behavior (`/gsd-stats`, `/hf-create`, `/plan`, etc.)

**When NOT to use:**
- Multi-turn task delegation (use `delegate-task` or `task` tool)
- Work needing progress monitoring (command dispatch is one-shot)
- Work needing session stacking (commands are one-shot, no parent session attachment)

**Agent override rules:**
- Without `subtask` parameter → defaults to `subtask: false` (parent session prompt)
- With `subtask: true` → dispatches as SubtaskPartInput to the target agent
- The target agent must exist as a registered agent definition

## Pattern 4: Session Stacking — Attaching to Existing Sessions

Session stacking attaches new work as a child of an existing session — not just resuming an aborted task. This works with **both completed and incomplete sessions**. The new subagent attaches as a child of that session, preserving the delegation hierarchy chain.

**Two use cases:**

| Scenario | Approach | How |
|----------|----------|-----|
| **Resume** | Continue an incomplete session | Pass existing session ID to `task_id` (task tool) or `parentSessionId` (delegate-task) |
| **Stack on** | Add new work as child of completed session | Pass completed session ID to `parentSessionId` (delegate-task) |

**For `task` tool:**
- Set `task_id` parameter to any existing session ID
- The new subagent attaches as a child of that session
- Use when the subagent needs context from a previous session without re-describing the whole task

**For `delegate-task`:**
- Pass context as JSON: `{"parentSessionId": "<session-id>"}`
- Do NOT inject the session ID into the prompt text — that creates a new independent session
- The correct approach is passing it as a parameter so the runtime hierarchy tracking properly chains the sessions

**Critical rule:** Prompt stays simple. Context from the target session is preserved through the session chain. Do not re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.

For the detailed protocol, read `references/session-stacking-protocol.md`.

## Pattern 5: Status Checking — Monitoring Delegations

Delegations dispatched via `delegate-task` run asynchronously (WaiterModel). The caller must check their status using the `delegation-status` tool. Delegations dispatched via `task` tool are managed automatically by the OpenCode runtime.

**Status values:**

| Status | Meaning | Action |
|--------|---------|--------|
| `dispatched` | Delegation sent, subagent not yet started | Wait, then check again |
| `running` | Subagent actively working | Wait, check after estimated completion time |
| `completed` | Subagent finished successfully | Read output, proceed |
| `error` | Subagent encountered a fatal error | Read error, re-delegate with fixes |
| `timeout` | Subagent exceeded budget or time limit | Re-delegate with larger budget or split task |

**Checking a specific delegation:**
```
Provide the delegation ID returned by `delegate-task`
```

**Listing all delegations:**
```
Optionally filter by status to see only running, completed, or failed delegations
```

**Supplementary monitoring tools:**

| Tool | Purpose |
|------|---------|
| `session-tracker` | Query session state; search/filter/export session tracker data |
| `session-hierarchy` | Navigate delegation hierarchy — get children, parent chain, depth |
| `session-context` | Cross-session synthesis — find related, cross-reference, aggregate |
| `hivemind-session-view` | Unified session view across session-tracker, delegations, and trajectory |
| `session-journal-export` | Export delegation lineage as bounded quick-read summary |

For the detailed monitoring protocol, read `references/status-checking-protocol.md`.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/delegation-tools-comparison.md` | Need extended edge case comparison across all 3 tools |
| `references/session-stacking-protocol.md` | Before attaching work to an existing session |
| `references/status-checking-protocol.md` | Before polling delegation status or monitoring running work |

| `references/future-delegation-tools-tbd.md` | 🟡 Need to know about TBD delegation tools: trajectory (P25), pressure (P26), agent-work-contract (P25), background-command (CP-PTY-01) |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Orphan Dispatch** — delegating without `parentSessionId` | Subagent creates new independent session; no hierarchy linkage | Always pass `parentSessionId` or `task_id` to maintain hierarchy |
| **Delegate-task for Code Editing** — using WaiterModel for code changes | Agent modifies code files via async delegate-task | Use `task` tool for ALL code editing. Delegate-task is ONLY for research, audit, review, verification |
| **Context Dumping** — injecting full session history into prompt | Prompt contains "earlier in conversation" or wall of previous context | Construct bounded intent: what to do + why + scope. Never raw session history |
| **No Success Criteria** — subagent completes but output is unusable | You receive a result but cannot verify if it satisfies the goal | Include explicit success criteria in the prompt: what output looks like when done |
| **Budget Starvation** — no turn/token limit, subagent runs indefinitely | Subagent produces excessive output or runs to timeout | Set explicit turn limits and token budgets in the delegate-task config |
| **Permission Mismatch** — agent lacks required tools for its task | Agent tries to use a tool and gets a permission error | Verify agent permissions via `configure-primitive read/list` or `hivemind-sdk-supervisor` before dispatching |
| **Wrong Tool Choice** — using `task` for research or `delegate-task` for code | Code changes happening in background (no visibility) or trivial research blocking the caller | Use the Differentiation Matrix above. Code/artifacts = task tool. Research/audit/review = delegate-task. Command = execute-slash-command |
| **Stale Parent Session** — stacking onto a session that no longer exists | Session ID passed but session is expired or purged | Verify session existence via `session-tracker` before stacking. Use `hivemind-session-view` for unified check |
| **Synchronous Wait on Async** — blocking on delegate-task return | Caller waits for delegation-status in a loop instead of continuing work | Design async workflow: dispatch → continue own work → check status when needed |
| **Prompt Session ID Injection** — passing session ID in prompt text | New independent session created instead of attaching to parent | Put session ID in `task_id` parameter (task tool) or `parentSessionId` in context JSON (delegate-task) |

## Self-Correction

### When the Delegation Keeps Failing

**Detection:** Subagent returns errors, timeouts, or unusable output repeatedly.

**Recovery:** First, verify the target agent has the required tools via `hivemind-sdk-supervisor` readiness check or `configure-primitive` read. Second, simplify the prompt — remove context noise, be explicit about success criteria. Third, if the task keeps failing, split it into smaller delegations and sequence them. If 3 delegations fail despite fixing prompts and permissions, escalate with evidence: which delegations failed, what errors occurred, and what budget was allocated.

### When Unsure Which Tool to Use

**Detection:** You cannot decide between `task`, `delegate-task`, and `execute-slash-command`.

**Recovery:** Re-read the Differentiation Matrix. The quick decision flow covers the common cases:
- One-shot command → `execute-slash-command`
- Code/artifacts → `task` tool (code editing, governance docs, state modifications)
- Research/audit/review → `delegate-task` (async background, low-risk read-mostly tasks)
- When in doubt, consider the work TYPE: code/artifacts → task tool; research/audit/review → delegate-task

### When the User Contradicts Skill Guidance

**Detection:** The user wants to batch delegations without session stacking, skip status checking, or use the wrong tool.

**Recovery:** Explain the consequence of the shortcut — orphan sessions lose hierarchy context, no status checking loses visibility into progress. If the user insists, apply their approach but document the trade-off. If the user asks for a different delegation pattern mid-work, complete or checkpoint the current delegation before switching.

### When an Edge Case Is Encountered

**Detection:** The delegation target is a multi-session chain (depth > 3), the parent session is stale or expired, or the target agent is not registered.

**Recovery:** For depth > 3, consider flattening the hierarchy — dispatch directly rather than chaining through intermediate agents. For stale sessions, use `session-tracker` to find the latest active session. For unregistered agents, check the agent definition via `configure-primitive list` or `hivemind-command-engine discover` — the agent may need to be created or the name may be misspelled. If the delegation status endpoint returns no data, verify the delegation ID is correct and the delegation was not dispatched via `task` tool (which is not tracked by `delegation-status`).

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| coordinating-loop | Coordinates multi-agent dispatch. This skill provides the delegation tool selection. |
| phase-execution | Dispatches wave-based parallel work. This skill documents per-wave tool choice. |
| user-intent-interactive-loop | Captures intent before delegation. Use before this skill if requirements are ambiguous. |
| tool-capability-matrix | Documents per-agent tool permissions. Use before dispatch to match agent to task. |
| hivemind-engine-contracts | Documents session API contracts. Use when integrating delegation at the SDK level. |
