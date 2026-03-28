---
name: use-hivemind-git-memory
description: Git-based semantic memory operations for session recovery, continuity state, decision retrieval, and hierarchy indexing across multi-turn workflows.
parent: use-hivemind
---

# use-hivemind-git-memory

Monolithic implementation guide for all git-based semantic memory operations. This skill handles session recovery, continuity state management, decision rationale retrieval, and hierarchy index registration — all directly, without routing to non-existent sub-specialists.

## Purpose

- Recover session state from `.hivemind/activity/sessions/continuity.json` after interruptions
- Retrieve decisions and context from git history using indexed or grep-based queries
- Register memory-enforced commits in the hierarchy index for future retrieval
- Manage long-haul task checkpoints spanning multiple turns
- Maintain deterministic path resolution for all git-memory artifacts

## Table of Contents

- [Load Position](#load-position)
- [When to Activate](#when-to-activate)
- [Prerequisites](#prerequisites)
- [Bundled Resources](#bundled-resources)
- [Implementation Operations](#implementation-operations)
- [Sibling Skills](#sibling-skills)
- [Anti-Patterns](#anti-patterns)
- [Independence Rules](#independence-rules)
- [Return Contract](#return-contract)

## Load Position

| Attribute | Value |
|-----------|-------|
| Layer | Domain |
| Requires | `use-hivemind` (entry router) |
| Activates When | Session recovery, decision tracing, hierarchy indexing, long-haul resume |

## When to Activate

| Operation | Context | Output |
|-----------|---------|--------|
| Resume after interruption | `continuity.json` exists, `sessionID` known | Continuity result with confirmed state, inferred gaps |
| Trace decision rationale | Git commit with `decision_id` in footer | Decision chain with who/what/why |
| Query hierarchy index | `index.json` populated | Commit SHAs filtered by packet/decision/phase |
| Register memory commit | Post-commit SHA + memory fields | Index record + tag updates |
| Handle long-haul task | Multi-turn refactor with active checkpoint | Task state with progress and next step |

## Prerequisites

- `use-hivemind` loaded (parent entry router provides session context)
- Git repository initialized with commit history
- `.hivemind/activity/` directory structure present (created by runtime)
- For retrieval: index files or grep-accessible commit messages with memory-footer

## Bundled Resources

### Reference Files (12)

| File | Purpose |
|------|---------|
| `references/activity-pathing.md` | Deterministic path resolution for activity outputs |
| `references/anchor-format.md` | Commit anchor schema and tagging conventions |
| `references/commit-memory-schema.md` | Memory-enforced commit footer schema |
| `references/context-capture.md` | Context capture during session transitions |
| `references/index-registration.md` | Hierarchy index registration and maintenance |
| `references/knowledge-network.md` | Knowledge graph linking decisions to commits |
| `references/memory-fields.md` | Field definitions for memory context |
| `references/memory-message-format.md` | Commit message format with memory footer |
| `references/packet-linkage.md` | Delegation packet to commit linkage |
| `references/retrieval-methodology.md` | Git grep and index-based retrieval commands |
| `references/retrieval-playbook.md` | Step-by-step retrieval playbooks |
| `references/session-continuity.md` | Session continuity state schema and turn protocol |

### Template Files (6)

| File | Purpose |
|------|---------|
| `templates/commit-memory-record.md` | Memory-enforced commit record template |
| `templates/continuity-result.md` | Resume result with confirmed decisions |
| `templates/longhaul-task-state.md` | Long-haul task checkpoint state |
| `templates/memory-gate-result.md` | Memory enforcement gate result |
| `templates/memory-index-entry.md` | Hierarchy index entry template |
| `templates/session-continuity-state.md` | Continuity state JSON template |

### Test Files (2)

| File | Purpose |
|------|---------|
| `tests/direct-invocation.md` | Resume-after-interruption test scenario |
| `tests/git-memory-enforce-direct-invocation.md` | Memory enforcement test scenario |

## Implementation Operations

### 1. Session Recovery (resume mode)

```
Input: sessionID from context.sessionID
Action:
  1. Read {project}/.hivemind/activity/sessions/continuity.json
  2. Verify last_turn_at age < 24h (stale check)
  3. Extract current_session.ses_id, task_id, activity_type, phase_type
  4. Check subsessions[] for active task_id to resume
  5. Output: ContinuityResult {
       confirmed_state: sessionID, branch, worktree, activity_type,
       inferred_gaps: open_loop_ids, open_packet_ids,
       next_step: activity_type from last checkpoint
     }
```

### 2. Decision Retrieval (retrieve/trace mode)

```
Input: decision_id | packet_id | plan_phase | agent identity
Action:
  1. Check if {project}/.hivemind/activity/git-memory/index/index.json exists
  2. If index exists: jq query for matching commits by decision/packet/phase
  3. If no index: git log --grep="<identifier>" with formatted output
  4. For each commit SHA, extract memory_context from footer
  5. Chain reconstruction: commit → decision → packet → phase
  6. Output: 3-5 bullet summary (not full history), with confidence level
```

### 3. Hierarchy Indexing (index mode)

```
Input: commit SHA + memory fields (decision_id, packet_id, retrieval_tags)
Action:
  1. Validate required fields: commit_sha, decision_id, packet_id
  2. Write {project}/.hivemind/activity/git-memory/index/{sha}.json
  3. Update index.json: append to commits[], update by_* aggregates
  4. For each retrieval_tag, update tags/{tag}.json
  5. Output: Registration confirmation with registered tags
```

### 4. Long-Haul Task Handling

```
Input: task_id from continuity.json subsessions[] or direct query
Action:
  1. Read {project}/.hivemind/activity/{domain}/task-state.json
  2. Extract active_task.checkpoint for turn/phase state
  3. Identify blocking_issues and open_loop_ids
  4. Output: TaskState snapshot with next_step and blocking issues
```

## Sibling Skills

| Skill | Relationship | Role |
|-------|--------------|------|
| `use-hivemind` | Parent | Entry router providing session context |
| `hivemind-atomic-commit` | Sibling | Commit discipline, git gates, typed activity classification |
| `use-hivemind-context` | Sibling | Session continuity context health verification |
| `use-hivemind-delegation` | Sibling | Delegation packets with git-aware continuity tracking |

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|--------------|--------------|------------------|
| Querying index without checking existence | Index may not exist; git fallback required | Check for index.json first, fall back to grep |
| Assuming continuity state is current | `last_turn_at` may be >24h old, session effectively lost | Verify timestamp before trusting state |
| Using grep retrieval on large repos | Linear scan is slow; prefer indexed lookup | Build index during commit, use for retrieval |
| Returning full commit history | Caller needs 3-5 bullet summary, not raw data | Synthesize into summary with confidence level |
| Registering without required fields | Incomplete records break retrieval | Validate decision_id + packet_id before write |

## Independence Rules

```
IMPLEMENTATION SKILL (not a router). This skill executes git-memory
operations directly using the reference implementations in references/.

Dependency chain:
  use-hivemind (session entry)
    → use-hivemind-git-memory (this implementation)
      → .hivemind/activity/sessions/continuity.json (read)
      → .hivemind/activity/git-memory/index/ (read/write)
      → hivemind-atomic-commit (sibling, for commit-side gates)

Direct file operations: reads continuity.json, writes index entries
Git operations: git log --grep, git rev-parse, git log -1 --format=%B
```

## Return Contract

Returns structured results with evidence references:

| Operation | Return Type | Fields |
|-----------|-------------|--------|
| Resume | `ContinuityResult` | confirmed_state, inferred_gaps, next_step |
| Retrieve | `DecisionSummary` | summary[], confidence, evidence_refs[] |
| Index | `RegistrationConfirm` | sha, tags[], index_updated |
| LongHaul | `TaskStateSnapshot` | checkpoint, blocking_issues, next_step |

Each result includes `_meta.timestamp` and reaches into specific files in `.hivemind/activity/` as evidence.
