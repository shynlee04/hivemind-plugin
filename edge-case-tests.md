# Edge Case Test Scenarios

These tests verify the system's resilience under stress and edge case conditions.

## 1. Concurrent Tool Calls (Race Condition)

**Goal**: Verify if parallel tool execution causes state inconsistency (lost updates).

**Setup**:
1. Initialize a session: `declare_intent({ mode: "quick_fix", focus: "Race test" })`
2. Note initial turn count: `scan_hierarchy`

**Test**:
Run two tools simultaneously in bash:

```bash
# Run in parallel
(node bin/run-tool.js map_context --level action --content "Race 1" &)
(node bin/run-tool.js map_context --level action --content "Race 2" &)
wait
```

**Verification**:
- Check `brain.json` or `scan_hierarchy`.
- **Expected**: Turn count increases by 2. Both actions appear in `hierarchy.json` and `active.md`.
- **Failure**: Turn count increases by only 1. One action is missing.

## 2. Corrupted brain.json (Recovery)

**Goal**: Verify behavior when state file is corrupted.

**Setup**:
1. Initialize session.
2. Corrupt the file: `echo "{ broken json" > .hivemind/brain.json`

**Test**:
Run any tool:
```bash
node bin/run-tool.js scan_hierarchy
```

**Verification**:
- **Expected**: Tool should fail or warn, but NOT crash. Ideally, it should attempt to recover from `.bak` or warn the user.
- **Actual Behavior (Current)**: It likely resets the session to a new empty state ("fail-open"). Verify if this results in data loss (previous session gone).

## 3. Large Hierarchy (Performance & Rendering)

**Goal**: Verify system behavior with a large hierarchy tree.

**Test**:
Script to add 100 nodes:
```bash
for i in {1..100}; do
  node bin/run-tool.js map_context --level action --content "Node $i"
done
```

**Verification**:
- Check `active.md` size.
- Run `scan_hierarchy`. Does it render correctly? Is it slow?
- Check system prompt injection (via logs). Is the tree truncated?

## 4. Session File Growth

**Goal**: Verify handling of very large session logs.

**Test**:
Script to append many entries:
```bash
for i in {1..500}; do
  node bin/run-tool.js map_context --level action --content "Log entry $i"
done
```

**Verification**:
- Check `active.md` size.
- Check if `session-lifecycle` hook warns about file size.
- Check editor performance (simulated by opening file).

## 5. Rapid Tool Calls (Drift Detection)

**Goal**: Verify drift detection under rapid fire.

**Test**:
Run a loop of read-only tools:
```bash
for i in {1..20}; do
  node bin/run-tool.js scan_hierarchy
done
```

**Verification**:
- Check `brain.json`. `turn_count` should be +20.
- `drift_score` should decrease significantly.
- Warnings should appear in logs/output.

## 6. Missing .hivemind Directory

**Goal**: Verify initialization guidance.

**Setup**:
`rm -rf .hivemind`

**Test**:
Run any tool or open a session.

**Verification**:
- System should inject "Setup Required" guidance block.
- Tools should fail with "Run setup first" message.

## 7. Backup Failure (Simulated)

**Goal**: Verify resilience when backup fails.

**Setup**:
Make `brain.json.bak` read-only or a directory.
`touch .hivemind/brain.json.bak && chmod 000 .hivemind/brain.json.bak`

**Test**:
Run a state-modifying tool:
`node bin/run-tool.js map_context --level action --content "Backup fail test"`

**Verification**:
- Tool should succeed (primary write succeeds).
- Error about backup failure might be logged but should not block.
