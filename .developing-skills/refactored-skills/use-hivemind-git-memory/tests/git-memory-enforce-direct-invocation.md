# Direct Invocation Tests

## Scenario 1: Full Memory-Enforced Commit

**Given:** Agent has staged changes for a feature implementation linked to `batch_007`.

**When:** Agent runs memory-enforce protocol.

**Then:**
1. Context capture produces valid `what`, `why`, `who_decided`, `evidence`
2. Packet linkage binds commit to `batch_007` and `plan_phase: implementation`
3. Commit message includes all memory footer fields
4. Memory gates pass: context present, linkage valid, tags valid
5. Index registration creates `.hivemind/activity/memory-index/{sha}.json`
6. Index aggregation updates `index.json` with by_packet, by_decision, by_phase, by_agent

**Validation:**
```bash
# Verify commit message contains memory fields
git log -1 --format='%B' | grep -q "memory_context:" || echo "FAIL: missing memory_context"
git log -1 --format='%B' | grep -q "packet_id:" || echo "FAIL: missing packet_id"
git log -1 --format='%B' | grep -q "retrieval_tags:" || echo "FAIL: missing retrieval_tags"

# Verify index record exists
SHA=$(git rev-parse HEAD)
test -f ".hivemind/activity/memory-index/${SHA}.json" || echo "FAIL: no index record"

# Verify index aggregation
jq -e '.by_packet["batch_007"] | index("'"$SHA"'")' .hivemind/activity/memory-index/index.json || echo "FAIL: not in by_packet"
```

## Scenario 2: Orphan Detection

**Given:** Agent stages changes with no delegation context.

**When:** Agent runs memory-enforce protocol.

**Then:**
1. Memory gate `linkage_minimum` fails
2. Commit is blocked
3. Agent receives `gate_failed` with reason: "no packet_id, decision_id, or plan_phase"
4. Agent adds `plan_phase: post-completion` and `memory_context: "standalone fix"`
5. Memory gate passes
6. Commit proceeds with `orphan_status: linked`

**Validation:**
```bash
# Initial gate should fail
grep -q "packet_id:" <<< "$COMMIT_MSG" || echo "PASS: gate correctly blocked orphan"

# After resolution
grep -q "plan_phase: post-completion" <<< "$COMMIT_MSG" || echo "FAIL: resolution missing"
```

## Scenario 3: Retrieval by Packet

**Given:** Multiple commits linked to `batch_007` exist in history.

**When:** Agent queries by packet.

**Then:**
1. `git log --all --grep="packet_id: batch_007" --oneline` returns all linked commits
2. `jq '.by_packet["batch_007"]' index.json` returns commit SHA list
3. Commits are ordered by timestamp

**Validation:**
```bash
# Git grep retrieval
RESULT=$(git log --all --grep="packet_id: batch_007" --oneline | wc -l)
[ "$RESULT" -ge 2 ] || echo "FAIL: expected ≥2 commits, got $RESULT"

# Index retrieval
SHAS=$(jq -r '.by_packet["batch_007"] | length' .hivemind/activity/memory-index/index.json)
[ "$SHAS" -ge 2 ] || echo "FAIL: expected ≥2 index entries, got $SHAS"
```

## Scenario 4: Knowledge Network Traversal

**Given:** Commit chain: commit → decision → packet → phase.

**When:** Agent traverses up-chain from commit.

**Then:**
1. Extract `decision_id` from commit message
2. Look up decision in `.hivemind/activity/hierarchy/`
3. Extract `packet_id` from commit message
4. Look up packet in `.hivemind/activity/delegation/`
5. Full chain reconstructed: commit → decision → packet → phase

**Validation:**
```bash
# Up-chain traversal
SHA="abc1234"
DECISION=$(git log -1 --format='%B' $SHA | grep -oP 'decision_id: \K\S+')
PACKET=$(git log -1 --format='%B' $SHA | grep -oP 'packet_id: \K\S+')
PHASE=$(git log -1 --format='%B' $SHA | grep -oP 'plan_phase: \K\S+')

[ -n "$DECISION" ] || echo "FAIL: no decision_id"
[ -n "$PACKET" ] || echo "FAIL: no packet_id"
[ -n "$PHASE" ] || echo "FAIL: no plan_phase"
echo "Chain: $SHA → $DECISION → $PACKET → $PHASE"
```

## Scenario 5: Cross-Session Resume via Git Memory

**Given:** New session starts, continuity.json has `last_packet_id: batch_007`.

**When:** Agent uses git-memory-enforce to resume context.

**Then:**
1. Read `continuity.json` for packet_id
2. Query index for all commits in batch_007
3. Reconstruct decision chain
4. Present 3-5 bullet summary to agent

**Validation:**
```bash
# Cross-session retrieval
PACKET=$(jq -r '.last_packet_id' .hivemind/activity/sessions/continuity.json)
SHAS=$(jq -r '.by_packet["'"$PACKET"'"][]' .hivemind/activity/memory-index/index.json)

for sha in $SHAS; do
  CONTEXT=$(git log -1 --format='%B' $sha | grep -oP 'memory_context: \K.*')
  echo "- $sha: $CONTEXT"
done
```
