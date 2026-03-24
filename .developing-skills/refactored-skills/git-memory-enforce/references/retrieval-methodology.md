# Retrieval Methodology

## Query Operations

### Git Grep Retrieval

| Operation | Command | Returns |
|-----------|---------|---------|
| By decision | `git log --all --grep="decision_id: decision_X" --oneline` | All commits linked to decision X |
| By packet | `git log --all --grep="packet_id: batch_X" --oneline` | All commits in delegation batch X |
| By phase | `git log --all --grep="plan_phase: implementation" --oneline` | All implementation-phase commits |
| By agent | `git log --all --grep="who_decided: hivemaker" --oneline` | All commits decided by hivemaker |
| By tag | `git log --all --grep="retrieval_tags:.*git-memory" --oneline` | All commits tagged with git-memory |
| By date | `git log --after="2026-03-20" --before="2026-03-25" --oneline` | Commits in date range |
| Full-text | `git log -S "knowledge network" --oneline` | Commits adding/removing "knowledge network" |
| Chain trace | `git log --all --grep="packet_id: batch_X" --format='%H %ai %s' \| sort -k2` | Ordered commit chain for packet X |

### Index-Based Retrieval (Preferred)

When `.hivemind/activity/memory-index/index.json` exists:

| Operation | Command | Returns |
|-----------|---------|---------|
| By tag | `grep -r "git-memory" .hivemind/activity/memory-index/` | Files referencing the tag |
| By packet | `jq '.by_packet["batch_007"]' .hivemind/activity/memory-index/index.json` | Commit SHAs for packet |
| By decision | `jq '.by_decision["decision_X"]' .hivemind/activity/memory-index/index.json` | Commit SHAs for decision |
| By phase | `jq '.by_phase["implementation"]' .hivemind/activity/memory-index/index.json` | Commit SHAs in phase |
| By agent | `jq '.by_agent["hivemaker"]' .hivemind/activity/memory-index/index.json` | Commit SHAs by agent |
| Full record | `cat .hivemind/activity/memory-index/{sha}.json` | Complete memory record |

## Chain Reconstruction

### Up-Chain (commit → decision → packet → phase)

```bash
# Starting from a commit SHA
SHA="abc1234"

# Step 1: Extract linkage from commit message
DECISION=$(git log -1 --format='%B' $SHA | grep -oP 'decision_id: \K\S+')
PACKET=$(git log -1 --format='%B' $SHA | grep -oP 'packet_id: \K\S+')
PHASE=$(git log -1 --format='%B' $SHA | grep -oP 'plan_phase: \K\S+')

# Step 2: Look up decision in hierarchy
cat .hivemind/activity/hierarchy/${DECISION}.json

# Step 3: Look up packet in delegation records
cat .hivemind/activity/delegation/${PACKET}.json

echo "Commit $SHA → Decision $DECISION → Packet $PACKET → Phase $PHASE"
```

### Down-Chain (packet → all commits)

```bash
PACKET="batch_007"

# All commits linked to this packet, ordered by time
git log --all --grep="packet_id: ${PACKET}" --format='%H %ai %s' | sort -k2

# Or via index
jq -r '.commits[] | select(.packet_id == "'$PACKET'") | .sha' \
  .hivemind/activity/memory-index/index.json
```

### Peer-Find (commit + tag → related commits)

```bash
SHA="abc1234"

# Extract tags from this commit
TAGS=$(git log -1 --format='%B' $SHA | grep -oP 'retrieval_tags: \K.*' | tr ',' '|')

# Find all commits sharing any of these tags
git log --all --grep="retrieval_tags:.*\(${TAGS}\)" --oneline
```

## Cross-Session Retrieval

When resuming work across sessions:

1. Read `{project}/.hivemind/activity/sessions/continuity.json` for session state
2. Check `longhaul/task-state.json` for multi-turn task context
3. Use the packet ID from continuity state to find related commits
4. Reconstruct the decision chain from those commits
5. Present a 3-5 bullet summary to the agent, not the full history

## Retroactive Memory

For commits that predate this skill:

1. Parse existing conventional commit format
2. Infer `memory_context` from subject line
3. Search `.hivemind/activity/delegation/` for matching packets by date range
4. Flag as `memory_retrofit` with `confidence: low`
5. Do NOT rewrite commit messages — add retrofit records to the index with a note

## Confidence Levels

| Level | Meaning | When |
|-------|---------|------|
| `high` | Memory fields present and verified against git evidence | Memory-enforced commit with all fields |
| `medium` | Some fields inferred from commit message or context | Partially-enforced commit |
| `low` | Most fields inferred, minimal evidence | Retroactive memory or orphan commit |
