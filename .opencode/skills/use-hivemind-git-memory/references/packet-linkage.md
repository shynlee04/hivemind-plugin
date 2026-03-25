# Packet Linkage

## Linkage Targets

Every non-trivial commit must link to at least one of these targets.

| Target | Source | Format | Required |
|--------|--------|--------|----------|
| `packet_id` | Delegation packet that spawned this work | `batch_{id}` or `delegation_{id}` | At least one of these three |
| `plan_phase` | Phase in the plan this commit advances | see Phase Values | At least one of these three |
| `decision_id` | Decision hierarchy node | `decision_{YYYYMMDD}_{hash}` | At least one of these three |

### Phase Values

| Phase | Description |
|-------|-------------|
| `entry` | Initial setup, scaffolding, imports |
| `high-level-map` | Architecture-level changes |
| `implementation` | Core feature/fix implementation |
| `verification` | Tests, validation, gate checks |
| `stabilization` | Cleanup, refactoring, documentation |
| `post-completion` | Retroactive fixes, follow-up adjustments |

## Optional Linkage Fields

| Field | Description | Format |
|-------|-------------|--------|
| `delegation_chain` | Full chain from orchestrator to executor | `["orchestrator", "hivemaker", "hiveq"]` |
| `task_id` | OpenCode task identifier | SDK `task_id` value |
| `pass_id` | Multi-pass iteration identifier | `pass_001`, `pass_002`, etc. |
| `parent_commit` | Prior commit this builds on | commit SHA |
| `related_commits` | Other commits in the same batch | array of commit SHAs |

## Linkage Validation

### Orphan Detection

A commit is `memory_orphan` if ALL of these are true:
- `packet_id` is empty or absent
- `decision_id` is empty or absent
- `plan_phase` is empty or absent
- Commit is not classified as `chore` or trivial

### Orphan Resolution

If a commit is flagged as `memory_orphan`:
1. Check if the commit is truly standalone (no delegation context exists)
2. If standalone, add `plan_phase: post-completion` and `memory_context: "standalone fix, no active delegation"`
3. If linked to active work, find the correct `packet_id` from `.hivemind/activity/delegation/`
4. If no delegation record exists, create a minimal decision ID: `decision_{today}_{first8chars_of_sha}`

## Stale Linkage Detection

A commit has `stale_linkage` if:
- `packet_id` references a packet with status `completed` or `closed`
- `decision_id` references a decision marked `resolved` in the hierarchy

Stale linkage is a warning, not a block. It indicates the commit is post-hoc to the original decision chain.

## Chain Reconstruction

To reconstruct a full delegation chain from a commit:

```bash
# 1. Extract packet_id from commit
PACKET_ID=$(git log -1 --format='%B' <sha> | grep -oP 'packet_id: \K\S+')

# 2. Find all commits linked to this packet
git log --all --grep="packet_id: ${PACKET_ID}" --oneline

# 3. Sort by timestamp to get the chain order
git log --all --grep="packet_id: ${PACKET_ID}" --format='%H %ai %s' | sort -k2
```
