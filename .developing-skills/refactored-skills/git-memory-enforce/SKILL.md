---
name: git-memory-enforce
description: "Use when commits must carry decision context as semantic memory — enforces that every commit links to delegation packets, plan phases, and decision hierarchy so git history becomes a queryable knowledge network."
---

# git-memory-enforce

Enforcement methodology for git-as-memory discipline. Ensures every commit carries decision context, links to delegation packets, and is retrievable as semantic memory — turning git history from a code log into a knowledge network.

## Purpose

- Enforce that every commit carries decision context (not just code changes)
- Link commits to delegation packets, plan phases, and decision hierarchy
- Establish git history as a queryable knowledge network
- Provide methodology for memory-first commit messages
- Enable git-based knowledge retrieval across sessions

## Use This For

- Enforcing memory-carrying commits in any workflow
- Setting up commit-message templates with decision context
- Linking commits to delegation packets and plan phases
- Retrieving decisions from git history
- Any workflow where git must serve as long-term memory
- Auditing commits for missing decision context
- Building a retrievable decision chain from git history

## Do Not Use This For

- Commit mechanics and gates (use `hivemind-atomic-commit`)
- Git-based session continuity (use `git-continuity-memory`)
- Commit classification and activity mapping (use `hivemind-atomic-commit`)
- Rebasing, cherry-picking, or history rewriting (use `git-advanced-workflows`)

## Prerequisites

| Skill | Required | Why |
|-------|----------|-----|
| `hivemind-atomic-commit` | Yes | Commit mechanics — gates, classification, staging — this skill enforces memory discipline on top |
| `git-continuity-memory` | Yes | Continuity infrastructure — session state, anchors — this skill adds retrieval methodology |

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `hivemind-atomic-commit` | Produces the commits; this skill enforces memory metadata on each commit |
| `git-continuity-memory` | Owns session continuity; this skill adds commit-level memory enforcement |
| `use-hivemind-git-memory` | Entry router for git memory; this skill is the downstream enforcement layer |
| `hivemind-codemap` | Codemap seams inform surface ownership; this skill validates commit memory against surface boundaries |

## Memory Commit Protocol

### Step 1: Context Capture

Before committing, capture the decision context that this commit encodes.

**Required fields:**

| Field | Description | Example |
|-------|-------------|---------|
| `what` | What changed (code, config, docs) | "Added memory schema to commit records" |
| `why` | Why this change was made | "Needed to link commits to delegation packets for retrieval" |
| `who_decided` | Agent or human who made the decision | "orchestrator / hivemaker / user:alice" |
| `evidence` | Supporting evidence for the decision | "ADR-2026-03-23, delegation packet batch_001" |
| `alternatives_considered` | What was rejected and why | "Inline commit messages only — rejected: not queryable" |

**Capture method:** Before staging files, run the context capture step:

```bash
# Agent workflow: capture context into commit memory record
echo '{
  "what": "<what changed>",
  "why": "<why it changed>",
  "who_decided": "<decision maker>",
  "evidence": ["<evidence items>"],
  "alternatives_considered": ["<rejected option>: <reason>"]
}'
```

Read `references/context-capture.md` for the full capture protocol and validation rules.

### Step 2: Packet Linkage

Link the commit to the delegation packets, plan phases, and decision hierarchy that produced it.

**Linkage targets:**

| Target | Source | Format |
|--------|--------|--------|
| `packet_id` | Delegation packet that spawned this work | `batch_{id}` or `delegation_{id}` |
| `plan_phase` | Phase in the plan this commit advances | `entry`, `implementation`, `verification`, `stabilization` |
| `decision_id` | Decision hierarchy node | `decision_{timestamp}_{hash}` |
| `delegation_chain` | Full chain from orchestrator to executor | `["orchestrator", "hivemaker", "hiveq"]` |
| `task_id` | OpenCode task identifier if applicable | SDK `task_id` |
| `pass_id` | Multi-pass iteration identifier | `pass_001`, `pass_002` |

**Linkage validation:** Every non-trivial commit must link to at least one of: `packet_id`, `decision_id`, or `plan_phase`. Commits without linkage are flagged as `memory_orphan`.

Read `references/packet-linkage.md` for the linkage schema and validation rules.

### Step 3: Memory-First Message Format

Commit messages must carry semantic memory, not just code description.

**Extended format:**

```
<type>(<scope>): <description>

[body: what changed and why — 2-3 sentences max]

[footer]
memory_context: <one-line decision summary>
packet_id: <linked packet or "none">
plan_phase: <phase or "none">
decision_id: <linked decision or "none">
who_decided: <agent or user>
evidence: <comma-separated evidence refs>
alternatives: <brief rejected alternative>
retrieval_tags: <comma-separated tags for search>
activity_classes: [<class>, ...]
rollback_method: <method>
gate_passed: <timestamp>
```

**Retrieval tags** are the key innovation — they make commits searchable by decision context, not just code diff. Tags should include: topic keywords, phase names, agent names, and affected surfaces.

**Example:**

```
feat(tools): add memory-enforce commit metadata schema

Extended commit record format to capture decision context, delegation
packet linkage, and retrieval tags. This makes git history queryable
as a knowledge network rather than a flat code log.

memory_context: commits must carry decision context for cross-session retrieval
packet_id: batch_007
plan_phase: implementation
decision_id: decision_20260324_a3f2
who_decided: hivemaker
evidence: ADR-2026-03-23, delegation packet batch_007
alternatives: inline metadata only — rejected: not queryable without structured fields
retrieval_tags: git-memory,commit-metadata,knowledge-network,tools
activity_classes: [code]
rollback_method: revert-commit
gate_passed: 2026-03-24T10:00:00Z
```

Read `references/memory-message-format.md` for the full specification, field constraints, and validation rules.

### Step 4: Index Registration

After committing, register the commit in the hierarchy index for retrieval.

**Registration record:**

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:00:00Z"
  },
  "commit_sha": "abc1234",
  "memory_context": "commits must carry decision context for cross-session retrieval",
  "packet_id": "batch_007",
  "plan_phase": "implementation",
  "decision_id": "decision_20260324_a3f2",
  "who_decided": "hivemaker",
  "retrieval_tags": ["git-memory", "commit-metadata", "knowledge-network", "tools"],
  "activity_classes": ["code"],
  "affected_surfaces": ["tools"],
  "timestamp": "2026-03-24T10:00:00Z",
  "branch": "feature/git-memory-enforce",
  "worktree": "product-detox"
}
```

**Storage:** `{project}/.hivemind/activity/memory-index/{commit_sha}.json`

**Index aggregation:** `{project}/.hivemind/activity/memory-index/index.json` — a rolling index of all memory-enforced commits with their retrieval tags, linked packets, and decision chains.

Read `references/index-registration.md` for the registration schema, index structure, and aggregation rules.

### Step 5: Retrieval Methodology

How to query git history for decisions and knowledge.

**Retrieval operations:**

| Operation | Command Pattern | Use When |
|-----------|----------------|----------|
| Find by decision | `git log --grep="decision_id: decision_X"` | You know the decision ID |
| Find by packet | `git log --grep="packet_id: batch_X"` | You know the delegation packet |
| Find by phase | `git log --grep="plan_phase: implementation"` | You want all commits in a phase |
| Find by agent | `git log --grep="who_decided: hivemaker"` | You want all decisions by an agent |
| Find by tag | `git log --grep="retrieval_tags:.*git-memory"` | You want commits by topic |
| Find by date range | `git log --after="2026-03-20" --before="2026-03-25"` | Time-bounded search |
| Trace chain | `git log --grep="packet_id: batch_X" --oneline` | Full delegation chain for a packet |
| Full-text search | `git log -S "knowledge network" --oneline` | Searching commit body for concepts |

**Index-based retrieval** (preferred when index exists):

```bash
# Search memory index by tag
grep -r "git-memory" .hivemind/activity/memory-index/

# Search by packet
grep -r "batch_007" .hivemind/activity/memory-index/

# Search by decision
grep -r "decision_20260324" .hivemind/activity/memory-index/

# Get full chain for a packet
grep -rl "batch_007" .hivemind/activity/memory-index/ | xargs cat | jq -s 'sort_by(.timestamp)'
```

Read `references/retrieval-methodology.md` for advanced query patterns, cross-session retrieval, and chain reconstruction.

## Commit Memory Schema

Extended metadata stored alongside each commit:

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:00:00Z"
  },
  "commit_sha": "abc1234",
  "memory": {
    "what": "Added memory-enforce commit metadata schema",
    "why": "Needed to link commits to delegation packets for retrieval",
    "who_decided": "hivemaker",
    "evidence": ["ADR-2026-03-23", "delegation packet batch_007"],
    "alternatives_considered": ["Inline metadata only — rejected: not queryable"]
  },
  "linkage": {
    "packet_id": "batch_007",
    "plan_phase": "implementation",
    "decision_id": "decision_20260324_a3f2",
    "delegation_chain": ["orchestrator", "hivemaker"],
    "task_id": null,
    "pass_id": "pass_001"
  },
  "retrieval": {
    "tags": ["git-memory", "commit-metadata", "knowledge-network", "tools"],
    "memory_context": "commits must carry decision context for cross-session retrieval"
  },
  "classification": {
    "activity_classes": ["code"],
    "affected_surfaces": ["tools"]
  },
  "provenance": {
    "branch": "feature/git-memory-enforce",
    "worktree": "product-detox",
    "timestamp": "2026-03-24T10:00:00Z",
    "gate_passed": "2026-03-24T10:00:00Z"
  }
}
```

Read `references/commit-memory-schema.md` for the full JSON schema, field constraints, and validation rules.

## Knowledge Network

Commits form a graph when linked through memory metadata:

```
commit → decision → packet → phase → epic
  ↓
retrieval_tags → related_commits (by shared tags)
  ↓
delegation_chain → agent_history (by who_decided)
```

**Graph traversal operations:**

| Operation | Input | Output |
|-----------|-------|--------|
| Up-chain | commit_sha | decision → packet → phase → epic |
| Down-chain | packet_id | all commits linked to this packet |
| Peer-find | commit_sha + tag | all commits sharing this tag |
| Agent-trace | who_decided | all decisions by this agent |
| Phase-view | plan_phase | all commits in this phase |

Read `references/knowledge-network.md` for graph construction, traversal algorithms, and visualization guidance.

## Anti-Patterns

| Anti-Pattern | Symptom | Enforcement |
|-------------|---------|-------------|
| Context-free commit | No `memory_context` in message | Gate blocks: require at least `memory_context` |
| Orphaned commit | No `packet_id`, `decision_id`, or `plan_phase` | Flag as `memory_orphan`; require justification or linkage |
| Ghost tag | Retrieval tag that matches no existing concept | Tag must exist in project taxonomy or be a deliberate new entry |
| Stale linkage | `packet_id` references a completed/closed packet | Warn: commit is post-hoc; may need `plan_phase: post-completion` |
| Duplicate context | Same `memory_context` on multiple commits | Warn: consider if commits should be merged |
| Tag-spray | >10 retrieval tags on a single commit | Limit to 5-8 tags; enforce tag relevance |
| Empty evidence | `evidence: []` on a non-trivial commit | Gate blocks: non-trivial commits require at least one evidence ref |

## Enforcement Gates

Three additional gates beyond `hivemind-atomic-commit`:

| Gate | Check | Fail Condition |
|------|-------|----------------|
| Memory context | `memory_context` present in commit message | Empty or missing `memory_context` field |
| Linkage minimum | At least one of: `packet_id`, `decision_id`, `plan_phase` | All three missing — commit is `memory_orphan` |
| Tag validity | Retrieval tags match project taxonomy or are deliberate new entries | Tags contain typos, duplicates, or nonsense |

These gates run AFTER `hivemind-atomic-commit` gates pass. If memory gates fail, the commit is blocked until memory metadata is added.

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/context-capture.md` | Context capture protocol, required fields, validation rules |
| `references/packet-linkage.md` | Linkage schema, validation, orphan detection |
| `references/memory-message-format.md` | Commit message format specification, field constraints |
| `references/index-registration.md` | Registration schema, index structure, aggregation rules |
| `references/retrieval-methodology.md` | Query patterns, chain reconstruction, cross-session retrieval |
| `references/commit-memory-schema.md` | Full JSON schema for commit memory records |
| `references/knowledge-network.md` | Graph construction, traversal, visualization |
| `templates/commit-memory-record.md` | JSON template for a single commit memory record |
| `templates/memory-index-entry.md` | JSON template for an index entry |
| `templates/memory-gate-result.md` | JSON template for memory gate check results |
| `tests/direct-invocation.md` | Basic scenario with validation |

## .opencode/ Write Prohibition

**DIRECT_WRITE_BAN**: This skill must NOT write to `.opencode/` directory.

- Memory records are stored in `.hivemind/activity/memory-index/`
- Index aggregations are stored alongside memory records
- `.opencode/` is the user's project configuration space — read-only access for context gathering is permitted

## Orchestrator Integration

When an orchestrator uses this skill:

1. The orchestrator declares the intent and passes the commit scope (files, decision context, packet linkage)
2. A subagent runs: context capture → packet linkage → memory message formatting → commit → index registration
3. The orchestrator receives: commit SHA, memory context, linked packet/decision, retrieval tags, gate result
4. The orchestrator does NOT format commit messages directly — the subagent executes

If memory gates fail, the subagent returns `gate_failed` with blocked reasons. The orchestrator decides whether to fix context and retry or escalate.

**Workflow integration with `hivemind-atomic-commit`:**

```
hivemind-atomic-commit gates pass
  → git-memory-enforce memory gates run
    → if pass: commit proceeds with memory metadata
    → if fail: commit blocked, memory context required
      → index registration after successful commit
```

## Independence Rules

- This package is self-contained for memory enforcement.
- It does not require old HiveMind memory routers.
- It may be selected directly or from any orchestrator workflow.
- Memory records are stored in `{project}/.hivemind/activity/memory-index/` at runtime.
- Enforcement rules are message-format-based with git grep for retrieval.
- This skill operates ON TOP of `hivemind-atomic-commit` — it does not replace commit mechanics.
