# Index Registration

## Registration Schema

After a successful memory-enforced commit, register it in the hierarchy index.

### Single Record Schema

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

### Storage Layout

```
{project}/.hivemind/activity/memory-index/
├── index.json                  # Rolling index of all memory-enforced commits
├── abc1234.json               # Individual record by full SHA
├── def5678.json
└── tags/
    ├── git-memory.json         # Tag → commit mapping
    ├── commit-metadata.json
    └── knowledge-network.json
```

## Index Aggregation

### index.json Structure

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:00:00Z",
    "total_commits": 42
  },
  "commits": [
    {
      "sha": "abc1234",
      "memory_context": "commits must carry decision context for cross-session retrieval",
      "packet_id": "batch_007",
      "plan_phase": "implementation",
      "decision_id": "decision_20260324_a3f2",
      "retrieval_tags": ["git-memory", "commit-metadata"],
      "timestamp": "2026-03-24T10:00:00Z"
    }
  ],
  "by_packet": {
    "batch_007": ["abc1234", "def5678"]
  },
  "by_decision": {
    "decision_20260324_a3f2": ["abc1234"]
  },
  "by_phase": {
    "implementation": ["abc1234"],
    "verification": ["def5678"]
  },
  "by_agent": {
    "hivemaker": ["abc1234"],
    "hiveq": ["def5678"]
  }
}
```

### Tag Index Structure

Each tag gets its own file in `tags/`:

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:00:00Z"
  },
  "tag": "git-memory",
  "commits": ["abc1234", "def5678"],
  "first_seen": "2026-03-24T10:00:00Z",
  "last_seen": "2026-03-24T14:00:00Z"
}
```

## Registration Workflow

```
1. Commit succeeds (hivemind-atomic-commit gates + memory gates pass)
2. Extract commit SHA: git rev-parse HEAD
3. Build registration record from commit message footer
4. Write record to .hivemind/activity/memory-index/{sha}.json
5. Update index.json: append commit, update by_packet/by_decision/by_phase/by_agent
6. Update tag files: for each retrieval_tag, add commit SHA to tag file
7. Report: commit SHA, memory context, linked packet, tags registered
```

## Index Maintenance

### Pruning

When a branch is deleted or merged:
- Individual records remain (commits are immutable)
- `index.json` `by_phase` entries referencing deleted branches are flagged as `branch_deleted`
- Tag files are not pruned — tags are historical

### Rebuild

To rebuild the index from git history:

```bash
# Find all memory-enforced commits
git log --all --grep="memory_context:" --format='%H' | while read sha; do
  # Parse commit message and rebuild record
  # (implementation in scripts/hm-memory-index-rebuild.sh)
done
```

### Integrity Check

```bash
# Verify all index entries have corresponding commits
for sha in .hivemind/activity/memory-index/*.json; do
  base=$(basename "$sha" .json)
  [ "$base" = "index" ] && continue
  [ -d "$base" ] && continue
  git cat-file -t "$base" >/dev/null 2>&1 || echo "MISSING: $base"
done
```
