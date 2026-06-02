# Harness Terminology Map

Clarifies runtime concepts used across session governance and delegation. This reference resolves naming ambiguities when navigating tools, skills, and session data.

## Core Concepts

| Term | Definition | Key Distinction |
|------|-----------|-----------------|
| **Session** | A single agent execution instance with its own ID, state, and lifecycle | A session runs one agent at a time. Sessions form delegation hierarchies (parent→child) |
| **Delegation** | The act of dispatching work from one session (parent) to another (child) via a tool | Distinguish from "session" — delegation is the action; session is the container |
| **Agent** | A specialist definition (system prompt + tool permissions) that runs within a session | An agent is configured; a session is where it runs |
| **Tool** | An executable capability exposed to agents (read file, run bash, dispatch delegation) | Tools are registered by the harness plugin and permissioned per agent |
| **Prompt** | The text instruction sent to an agent in a session | A prompt starts or continues a session; delegation prompt is the child session's instruction |
| **Task** | A bounded unit of work described in a prompt, dispatched to a subagent | A task becomes a delegation when dispatched; the delegation runs as a child session |

## Tool Dispatching Terms

| Term | Meaning |
|------|---------|
| **WaiterModel** | Async dispatch model — `delegate-task` returns immediately with a delegation ID; caller polls `delegation-status` for completion |
| **Synthetic prompt** | A system-generated prompt piece (marked `synthetic: true`) that does not appear to the user |
| **Subtask dispatch** | Running a command or prompt as a SubtaskPartInput — the subagent handles one turn, then control returns |
| **Session stacking** | Attaching new work as a child of an existing (completed or incomplete) session via `parentSessionId` |
| **Task resume** | Continuing an incomplete session using `task_id` parameter on the `task` tool |

## Session State Terms

| Term | Meaning |
|------|---------|
| **Active** | Session still has an agent running or waiting for input |
| **Completed** | Agent finished its work and produced output |
| **Error** | Agent encountered a fatal error |
| **Timeout** | Agent exceeded budget or time limit |
| **Dispatched** | Delegation sent but subagent not yet started |
| **Running** | Subagent actively working in a child session |

## Hivemind Internal Terms

| Term | Meaning |
|------|---------|
| **Session-tracker** | The internal registry of all sessions at `.hivemind/session-tracker/` — queried through the `session-tracker` tool |
| **Continuity** | Persistent session state files (`.hivemind/state/session-continuity.json`) |
| **Delegation records** | Persistent delegation records (`.hivemind/state/delegations.json`) |
| **Trajectory ledger** | Execution checkpoint ledger (`.hivemind/state/trajectory-ledger.json`) — PARTIAL (P24) |
| **Hierarchy manifest** | Flattened child list per session (`.hivemind/session-tracker/{id}/hierarchy-manifest.json`) |

## Quality Gate Terms

| Term | Meaning |
|------|---------|
| **Gate triad** | The 3-gate quality pipeline: lifecycle-integration → spec-compliance → evidence-truth |
| **L1-L5 evidence** | Evidence hierarchy: L1 (live runtime) → L2 (integration test) → L3 (unit test) → L4 (static analysis) → L5 (documentation) |
| **HALT rule** | If any gate FAILS, stop execution — do not proceed until remediation |

## Lineage Routing Terms

| Term | Meaning |
|------|---------|
| **Lineage** | The prefix-based classification system for agents and skills that determines routing rules |
| **Cross-lineage bridge** | Authorized access from one lineage to another (e.g., reading another lineage's reference for cross-validation) |
| **Depth limit** | Maximum delegation depth before escalation — fixed at depth = 3 |
