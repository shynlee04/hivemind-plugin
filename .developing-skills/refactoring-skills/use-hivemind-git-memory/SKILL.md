---
name: use-hivemind-git-memory
description: Git-based semantic memory operations for session recovery, continuity state, decision retrieval, and hierarchy indexing across multi-turn workflows.
---

# use-hivemind-git-memory


**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/` for Hivemind, `.claude/` for Claude Code, `.cursor/` for Cursor)
- `{activity_dir}` — Activity artifacts directory (e.g., `{runtime_state_dir}/activity/`)
- `{session_state_file}` — Session continuity state file (e.g., `{activity_dir}/sessions/continuity.json`)
- `{delegation_dir}` — Delegation artifacts directory (e.g., `{activity_dir}/delegation/`)
- `{pathing_config}` — Pathing configuration file (e.g., `{runtime_state_dir}/pathing/active-paths.json`)
- `{delegation_registry}` — Delegation registry file (e.g., `{delegation_dir}/registry.json`)

Monolithic implementation guide for all git-based semantic memory operations. This skill handles session recovery, continuity state management, decision rationale retrieval, and hierarchy index registration — all directly, without routing to non-existent sub-specialists.

## Purpose

- Recover session state from `{session_state_file}` after interruptions
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
| Resume after interruption | Session continuity file exists, `sessionID` known | Continuity result with confirmed state, inferred gaps |
| Trace decision rationale | Git commit with `decision_id` in footer | Decision chain with who/what/why |
| Query hierarchy index | Index file populated | Commit SHAs filtered by packet/decision/phase |
| Register memory commit | Post-commit SHA + memory fields | Index record + tag updates |
| Handle long-haul task | Multi-turn refactor with active checkpoint | Task state with progress and next step |

## Prerequisites

- `use-hivemind` loaded (parent entry router provides session context)
- Git repository initialized with commit history
- `{activity_dir}` directory structure present (created by runtime)
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
  1. Read {session_state_file}
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
  1. Check if {activity_dir}/git-memory/index/index.json exists
  2. If index exists: jq query for matching commits by decision/packet/phase
  3. If no index: search commit history by identifier (e.g., git log --grep="<identifier>" or equivalent)
  4. For each commit SHA, extract memory_context from footer
  5. Chain reconstruction: commit → decision → packet → phase
  6. Output: 3-5 bullet summary (not full history), with confidence level
```

### 3. Hierarchy Indexing (index mode)

```
Input: commit SHA + memory fields (decision_id, packet_id, retrieval_tags)
Action:
  1. Validate required fields: commit_sha, decision_id, packet_id
  2. Write {activity_dir}/git-memory/index/{sha}.json
  3. Update the master index file: append to commits[], update by_* aggregates
  4. For each retrieval_tag, update tags/{tag}.json
  5. Output: Registration confirmation with registered tags
```

### 4. Long-Haul Task Handling

```
Input: task_id from session continuity file subsessions[] or direct query
Action:
  1. Read {activity_dir}/{domain}/task-state.json
  2. Extract active_task.checkpoint for turn/phase state
  3. Identify blocking_issues and open_loop_ids
  4. Output: TaskState snapshot with next_step and blocking issues
```

## OpenCode Tool Matrix

| Git-Memory Need | Preferred Tool | Why |
| --- | --- | --- |
| inspect continuity artifacts | `read` | exact state recovery |
| locate matching packet IDs or tags | `grep` | cheap indexed lookup |
| collect git evidence | `bash` | authoritative commit output |

## Concrete Bash Examples

```bash
# Search commits by decision label (e.g., git log --oneline --grep "decision:" -10)
# Show latest commit details (e.g., git show --stat --summary HEAD)
# Confirm current branch (e.g., git branch --show-current)
```

## Retrieval Decision Tree

1. **IF** a commit SHA is already known, **THEN** start with `git show`.
2. **IF** only a keyword or decision label is known, **THEN** use `git log --grep` first.
3. **IF** branch context is unclear, **THEN** confirm `git branch --show-current` before summarizing history.
4. **IF** session state and git disagree, **THEN** trust git and mark the continuity artifact stale.

## Git Command Reference

Use `references/git-command-reference.md` for retrieval, diff, branch, and stash examples.

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
| Querying index without checking existence | Index may not exist; git fallback required | Check for the index file first, fall back to grep |
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
      → {session_state_file} (read)
      → {activity_dir}/git-memory/index/ (read/write)
      → hivemind-atomic-commit (sibling, for commit-side gates)

Direct file operations: reads session continuity file, writes index entries
Git operations: search commit history, resolve references, extract messages (adapt to your VCS)
```

## Return Contract

Returns structured results with evidence references:

| Operation | Return Type | Fields |
|-----------|-------------|--------|
| Resume | `ContinuityResult` | confirmed_state, inferred_gaps, next_step |
| Retrieve | `DecisionSummary` | summary[], confidence, evidence_refs[] |
| Index | `RegistrationConfirm` | sha, tags[], index_updated |
| LongHaul | `TaskStateSnapshot` | checkpoint, blocking_issues, next_step |

Each result includes `_meta.timestamp` and reaches into specific files in `{activity_dir}` as evidence.

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run the artifact validation script (e.g., `bash scripts/hm-artifact-validate.sh {path}` or equivalent) to confirm compliance.
