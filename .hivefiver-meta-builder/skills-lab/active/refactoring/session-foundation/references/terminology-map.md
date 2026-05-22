# Session Terminology Map — Cross-Framework Concepts

## Purpose

Different frameworks and projects use different words for the same session concepts.
This map translates between them so agents can recognize patterns regardless of
which framework originated the concept.

## Session Concept Translation

| Concept | OpenCode Native | Agent Ecosystem | General Meaning |
|---------|-----------------|-----------------|-----------------|
| **Session** | session | session, conversation, thread, run | A unit of agent execution with its own context window, tool access, and state |
| **Subagent** | subagent | specialist, worker, delegate, child-agent | An agent launched by another agent to perform bounded work |
| **Delegation** | delegation | dispatch, task assignment, handoff | One agent assigning work to a subagent session |
| **Parent session** | parent session | orchestrator, main session, root, caller | The session that launched a subagent |
| **Child session** | child session | subagent session, worker session, delegate session | The session created by a delegation dispatch |
| **Session hierarchy** | delegation tree | parent-child chain, dispatch graph | The tree structure of which session spawned which |
| **Stacking** | session stacking | attach-to-parent, context chaining | Adding new work as a child of an existing (possibly completed) session |
| **Resume** | resume | continue, rehydrate, recover | Continuing an interrupted or incomplete session with preserved context |
| **Session status** | status | state, lifecycle phase | The current state of a session: active, completed, error, etc. |
| **Session context** | context | conversation history, state, memory | The accumulated text and decisions within a session window |

## Data Storage Concepts

| Concept | Location | Format | Description |
|---------|----------|--------|-------------|
| **Session tracker** | `.hivemind/session-tracker/` | Per-session JSON files | Records every session that ran: ID, status, depth, agent type, timestamps |
| **Session continuity** | `.hivemind/state/session-continuity.json` | Single JSON aggregate | Session metadata and lifecycle state across all sessions |
| **Delegation records** | `.hivemind/state/delegations.json` | Single JSON array | Records of delegations: IDs, parent sessions, status, results |
| **Hierarchy manifest** | `hierarchy-manifest.json` per session | Flattened child list | Fast lookup of all child sessions without recursive traversal |
| **Session journal** | `.hivemind/session-tracker/` per session | Append-only event timeline | Every event in a session's lifecycle |

## CQRS Boundaries

| Read Side | Write Side |
|-----------|-----------|
| `session-tracker` — query, filter, search, export | `delegate-task` — create child sessions |
| `session-hierarchy` — navigate parents, children, depth | `task` tool — native subagent dispatch |
| `session-context` — aggregate, find-related, synthesize | `execute-slash-command` — command dispatch |
| `hivemind-session-view` — unified cross-root query | Agent lifecycle manager — status transitions |
| `delegation-status` — poll delegation state | DelegationManager — completion detection, signal routing |

**This skill operates on the READ SIDE only.** It discovers, reads, and
aggregates session state. It does not mutate sessions or create delegations.

## State Root (Q6 Canonical)

Per architectural decision Q6 (2026-04-25), `.hivemind/` is the **internal state root**
for session persistence. `.opencode/` is reserved for OpenCode primitives
(agents, skills, commands, rules) — no runtime state is stored there.

Key Q6 rules:
- `.hivemind/` = internal state (journals, lineage, runtime state)
- `.opencode/` = OpenCode primitives only (NOT state storage)
- One-way migration: legacy `.opencode/state/` → `.hivemind/`

## Evidence Hierarchy

Session governance operates at different evidence levels:

| Level | Description | Example |
|-------|-------------|---------|
| **L1** | Live runtime proof | `session-tracker list-sessions` returns current state |
| **L2** | Fresh tool output | Session data fetched within the current conversation turn |
| **L3** | Verified schema | Session data conforming to known JSON schema |
| **L4** | Historical record | Journal entry from a past session |
| **L5** | Documentation | This reference file — describes what should exist |
