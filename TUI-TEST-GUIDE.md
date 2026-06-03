# Hivemind P50-P55 — Live TUI Test Guide

**How to use this file**: Open OpenCode in this repo. Then paste each prompt below into the TUI one at a time. After each prompt, the system should produce the listed evidence on disk.

```bash
# Start OpenCode (the plugin registers automatically)
cd /Users/apple/hivemind-plugin-private
opencode
```

The TUI loads with the 27 tool set + 5+ hooks wired (P51-P55). Then paste the prompts below.

---

## Test 1 — Basic spawn + tmux wiring (P51 + P52 + P53)

**Paste this prompt into OpenCode TUI:**

```
Use the delegate-task tool to spawn 3 sub-agents in parallel. Each
sub-agent should be a "test agent" that runs `sleep 120` so I can
verify the tmux wiring. Then list the active tmux sessions with
the tmux-state-query tool. Then send "echo P55-VERIFIED" via the
tmux-copilot send-keys action to pane %0 of session 0, %0 of
session 1, and %0 of session 2. Then list the files in
.hivemind/journal/ to confirm the pane-monitor hook captured the
sessions.
```

**Expected evidence on disk**:
```bash
# After the prompt completes, you should see:
tmux list-sessions
# → 3 sessions named like "subagent-0", "subagent-1", "subagent-2"

ls -la .hivemind/journal/
# → 3 directories, one per sessionId

# Each journal directory should have 1+ .json files like:
# 2026-06-03T10-30-15-123Z-pane.json

# Each file should be valid JSON with 7 fields:
cat .hivemind/journal/subagent-0/2026-06-03T*.json | jq .
# {
#   "schemaVersion": 1,
#   "eventType": "pane-captured",
#   "sessionId": "subagent-0",
#   "paneId": "%0",
#   "contentLength": ...,
#   "capturedAt": ...,
#   "retryCount": 0
# }
```

---

## Test 2 — Session persistence (P54)

**Paste this prompt:**

```
Spawn 1 sub-agent via delegate-task that runs `sleep 300`. After it
spawns, use the tmux-state-query tool to get its sessionId. Then
use the tmux-copilot kill-session action on a DIFFERENT test
session (NOT the one you just spawned — create another first) to
prove the kill-session action works. Then list the journal
entries to confirm the kill was captured by the pane-monitor
hook. Finally, list .hivemind/state/tmux-sessions/ to confirm
the persistence file exists for the surviving session.
```

**Expected evidence on disk**:
```bash
# After the prompt completes:
tmux list-sessions
# → 2 sessions: 1 alive (the spawn target), 1 killed (the test target)

ls -la .hivemind/state/tmux-sessions/
# → 1+ files like:
# <UUIDv7-from-persistence>.json

# Each file should be valid JSON with 9 fields:
cat .hivemind/state/tmux-sessions/*.json | jq .
# {
#   "schemaVersion": 1,
#   "sessionId": "...",
#   "agent": "test-agent",
#   "delegationId": "...",
#   "directory": "...",
#   "paneId": "%0",
#   "spawnTime": ...,
#   "state": "ready",  # or "active", "paused", "detached", "failed"
#   "lastTransitionAt": ...
# }
```

---

## Test 3 — All 4 seed success criteria (P55)

**Paste this prompt:**

```
Verify the 4 seed success criteria end-to-end:
1. Live pane monitoring — show me the current content of all agent
   tmux panes (use tmux capture-pane via tmux-copilot or directly).
2. Orchestrator intervention — send "echo P55-VERIFIED" to each
   pane and confirm it appears in the captured pane content.
3. Session persistence — list .hivemind/state/tmux-sessions/ to
   show that all spawned sessions have persistence files.
4. Visual dependency graph — render the delegation tree as a pane
   grid using grid-planner.computeSplitSequence for a tree with
   3 children of a root node.
```

**Expected evidence on disk + TUI output**:
```bash
# After the prompt completes:

# 1. Pane contents visible in TUI (from capture-pane)
# Expected: each pane shows the last command run

# 2. Keys received
# Expected: each captured pane contains "P55-VERIFIED"

# 3. Persistence files
ls -la .hivemind/state/tmux-sessions/
# → 3 files (one per spawned session)

# 4. DFS grid layout
# Expected TUI output: split sequence like
#   [
#     { parentPaneId: "root", direction: "h" },
#     { parentPaneId: "root", direction: "h" },
#     { parentPaneId: "root", direction: "h" }
#   ]
```

---

## Test 4 — Stress test (all features together)

**Paste this prompt:**

```
Spawn 5 sub-agents via delegate-task in parallel, each running
`sleep 180`. Then:
1. Use tmux-copilot send-keys to send a unique message to each
   pane ("agent-0-ready" through "agent-4-ready").
2. Verify the pane-monitor hook captured all 5 panes (check
   .hivemind/journal/ for 5 directories).
3. Use tmux-state-query get-summary to get the total session count.
4. Verify the 27 tool keys are still registered (the test should
   NOT add any new tools).
5. Use grid-planner.computeSplitSequence to render a 5-child
   DFS layout for the delegation tree.
6. Final summary: confirm 5 tmux sessions, 5 journal directories,
   5 persistence files, 27 tool keys, 1 DFS layout.
```

**Expected final state**:
```bash
tmux list-sessions | wc -l
# → 5

ls .hivemind/journal/ | wc -l
# → 5

ls .hivemind/state/tmux-sessions/ | wc -l
# → 5

grep -c "Tool," src/plugin.ts
# → 27 (or more if you added tools)
```

---

## Verification commands (run these in a separate terminal, NOT through the LLM)

```bash
cd /Users/apple/hivemind-plugin-private

# 1. Source modules present (P51 + P52 + P53 + P54)
ls src/features/tmux/{types,tmux-multiplexer,session-manager,grid-planner,persistence}.ts
ls src/tools/{tmux-copilot,tmux-state-query}.ts
ls src/hooks/pane-monitor.ts

# 2. Built dist/ present
ls dist/features/tmux/{persistence,grid-planner}.js
ls dist/hooks/pane-monitor.js
ls dist/tools/{tmux-copilot,tmux-state-query}.js

# 3. Typecheck clean
npx tsc --noEmit && echo "typecheck OK"

# 4. BATS slots 55-60 exist (P53 + P54 + P55)
ls tests/scripts/tmux/{55,56,57,58,59,60}-*.bats

# 5. Recent commits (P50-P55)
git log --oneline 5b49030f..d23658b5 | head -10

# 6. No opencode-tmux fork refs in active code
grep -rE "from .*fork-bridge" src/ 2>/dev/null | wc -l
# → 0 (only JSDoc comments allowed)

# 7. 27 tool keys registered in plugin.ts
grep -cE "^\s+\w+Tool," src/plugin.ts
# → 27
```

If all 7 checks pass, the system is live and ready for TUI testing.

---

## If something fails

| Failure | Fix |
|---------|-----|
| "Tool not found: tmux-copilot" | `npm run build` and restart OpenCode |
| "tmux not found" | `brew install tmux` |
| "Permission denied" on `.hivemind/journal/` | `mkdir -p .hivemind/journal && chmod 755 .hivemind` |
| 0 journal entries after Test 1 | The pane-monitor hook may not be wired — check `src/plugin.ts:610` |
| Session persistence file missing | The persistence module may not be wired into SessionManager — check `src/features/tmux/session-manager.ts` for 7th optional ctor param |
| 27 tool keys broken | Re-run P52 EXECUTE: `git checkout dbf260b5 -- src/plugin.ts` and rebuild |
| BATS scenarios fail | `bats --jobs 1 tests/scripts/tmux/<file>.bats` to get specific failure |

---

## Cleanup after testing

```bash
# Kill all tmux sessions spawned during testing
for s in $(tmux list-sessions -F '#{session_name}' 2>/dev/null); do
  tmux kill-session -t "$s" 2>/dev/null
done

# Clear runtime state (NOT committed, in .gitignore)
rm -rf .hivemind/journal/*
rm -rf .hivemind/state/tmux-sessions/*

# Verify clean
tmux list-sessions 2>&1 | head -3
# → "no server running on /private/tmp/tmux-501/default" (expected)
```
