# Session Foundation — Design Philosophy

## 1. The Read-Side CQRS Principle

Session governance follows CQRS (Command Query Responsibility Segregation):

```
READ SIDE (this skill)              WRITE SIDE (other skills/tools)
─────────────────────              ──────────────────────────────
Discover sessions                   Create delegations
Navigate hierarchy                  Dispatch subagents
Aggregate context                   Execute commands
Poll delegation status              Resume sessions
Build unified views                 Stack work onto sessions

PRINCIPLE: Read NEVER mutates.     PRINCIPLE: Write provides read-back.
```

This separation means:
- **Session discovery tools do not alter state.** They are safe to call at any
  time, in any order, as many times as needed.
- **Write-side tools create state.** They produce session records, delegation
  entries, and hierarchy manifests that the read side then consumes.
- **No circular dependency.** Read tools never call write tools. Write tools
  write to storage that read tools later query.

## 2. Why Progressive Disclosure Matters

Session governance uses progressive disclosure in two ways:

**At the skill level:** The SKILL.md body teaches the core workflow
(Discover→Navigate→Aggregate→Act). Reference files provide deeper detail
only when needed. This prevents context pollution — agents do not load
3000 words of tool reference tables unless they actually need to.

**At the session level:** Session tools provide progressive disclosure of
session data:
- `get-status` → single session metadata (lightweight)
- `get-summary` → structured overview (moderate)
- `export-session` → complete session data (heavy)

Use the lightest tool that answers your question. Reserve full exports for
when you need the complete picture.

## 3. Session as the Unit of Work

Every delegation, every subagent launch, every command execution creates
a session. Sessions are the atomic units of agent work. Understanding the
session landscape means understanding what work has been done, is in
progress, or was abandoned.

**Key properties of sessions:**
- **Identity**: Each session has a unique ID (typically `ses_` prefix or UUID)
- **Status**: active, completed, error, timeout — reflects lifecycle state
- **Depth**: 0 = root session, 1 = first delegation, 2 = sub-delegation, etc.
- **Parent**: The session that spawned this session (null for root)
- **Agent type**: The specialist agent that runs in this session
- **Timestamp**: When the session was created and last updated

## 4. Hierarchy Is the Hidden Structure

The most important insight about session governance: **hierarchy matters more
than individual sessions.** A session in isolation tells you little. The
parent-child chain tells you the flow of work, the delegation pattern, and
what to resume or extend.

**Why hierarchy matters:**
- **Context flows down** — a child session inherits the parent's context
- **Results flow up** — a child's output feeds back to the parent
- **Depth reveals patterns** — shallow trees = simple work, deep trees = complex orchestration
- **Stacking requires hierarchy** — you cannot stack work without knowing the chain

## 5. Honesty Over Aspiration

This skill documents only **operational tools** — tools with passing tests,
registered in the plugin, and validated through production evidence. It does
not reference tools that are partially implemented, pending redesign, or
whose state machines are untested.

**Why this matters:** Agents reading this skill must make real decisions about
which sessions exist, which are resumable, and how to navigate the hierarchy.
Recommending a tool that does not work produces cascading failures — the
agent tries the tool, it fails, the agent retries, context burns. Worse:
agents may hallucinate capabilities the tool does not have.

When a tool is not yet operational, this skill acknowledges its absence
rather than pretending it works. See `references/future-tools-tbd.md`
for tools in development.

## 6. Tool Names Are Contracts

This skill refers to tools by their **registered name** — the string used to
call them at runtime. These names are contracts between the plugin layer
(tool registration in the source code) and the agent layer (tool invocation
from a session). Never guess a tool name. Always use the registered name.

**Currently registered session governance tools:**
- `session-tracker` — query and export session state
- `session-hierarchy` — navigate parent-child relationships
- `session-context` — aggregate and synthesize cross-session data
- `hivemind-session-view` — unified view from multiple data roots
- `delegation-status` — poll delegation state and progress
- `delegate-task` — create child sessions via SDK dispatch
- `execute-slash-command` — dispatch registered slash commands
- `hivemind-command-engine` — discover commands and preview routing
