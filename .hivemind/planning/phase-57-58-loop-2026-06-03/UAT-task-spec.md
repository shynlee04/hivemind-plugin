[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
You are hm-integration-checker. Conduct a REAL-LIFE UAT (User Acceptance Test) of Phase 58 implementation.

# Mission

Verify the Phase 58 features work in real-world tmux orchestration scenarios — NOT by re-running BATS unit tests, but by exercising the system end-to-end with real tmux sessions.

# Available Tools (OpenCode primitives)

You have access to:
- `tmux-copilot` tool — actions: send-keys, list-panes, compute-grid, respawn, forward-prompt, take-over, release
- `delegation-status` tool — actions: list, status, find-stackable, pool (G2)
- `session-tracker` tool — query session state
- `hivemind-session-view` — get session tree
- Bash for tmux CLI (tmux new-session, tmux send-keys, tmux capture-pane, etc.)

# Phase 58 Features to UAT (6 gaps)

## G1 — delegate-task guard-rail
Verify `src/tools/delegation/delegate-task.ts` has the POLICY comment block AND grep guard from BATS slot 67.
- Action: `grep -c "POLICY (P58, G1)" src/tools/delegation/delegate-task.ts` (expect >= 1)
- Action: `grep -rE "from ['\"]@opencode-ai/plugin['\"]" src/tools/delegation/ | grep -E "\btask\b"` (expect exit 1, no matches)
- Action: `grep -rE "createTaskTool" src/tools/delegation/` (expect exit 1, no matches)

## G2 — Programmatic pool status API
- Spawn 2-3 real tmux sessions
- Use `tmux-copilot` to set up sessions (or use tmux CLI directly)
- Then call `delegation-status` with `action: "pool"` and verify the JSON output:
  - schemaVersion: 1 (numeric literal)
  - capturedAt present
  - delegations array with entries (id, agent, status, depth, parentId, startedAt, promptPreview)
  - promptPreview truncated <= 200 chars, no \n
  - Top-level frozen (try to mutate, expect throw or no-op)

## G3 — Abort+resume cycle preserving tmux pane state
- Spawn tmux session via `tmux new-session -d -s p58-uat-g3 'sleep 600'`
- Discover paneId via `tmux list-panes`
- Call abortDelegation (or use delegation-status action that surfaces abort)
- Verify persistence file at `.hivemind/state/tmux-sessions/<sid>.json` has `state: "paused"`
- Call resume
- Verify pane survives (same paneId, capture-pane shows process still running)

## G4 — Forward-prompt with sentinel
- Spawn tmux session with `cat` as command (reads stdin, keeps pane alive)
- Discover paneId
- Call `tmux-copilot` with action `forward-prompt`, paneId, text="UAT-P58-G4-PROBE-2026-06-04"
- Verify in pane buffer: `tmux capture-pane -t <paneId> -p | grep -c 'orchestrator-forward'`
- Verify text delivered: `tmux capture-pane -t <paneId> -p | grep -c 'UAT-P58-G4-PROBE-2026-06-04'`
- Both should be >= 1

## G5 — Take-over + release + manualOverride
- Spawn tmux session with `cat`
- Call `tmux-copilot` action `take-over` with sessionId + paneId
- Verify record has manualOverride: true
- Call `forward-prompt` to the same paneId with text "SHOULD-BE-SUPPRESSED-UAT"
- Verify response has `suppressed: true` AND pane buffer does NOT contain the text
- Call `release` 
- Verify record has manualOverride: false
- Call `forward-prompt` with text "SHOULD-BE-DELIVERED-UAT"
- Verify response has `deliveredAt` AND pane buffer DOES contain the text

## G6 — 3-event lifecycle (queued/dispatched/terminal)
- Trigger a delegation that produces the 3 events
- Query session-tracker for events of type `delegation-queued`, `delegation-dispatched`, `delegation-terminal`
- Verify all 3 event types are present
- Verify `tmuxSessionId: string | null` field on each event

# UAT Script Design

Produce a single executable bash script `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-57-58-loop-2026-06-03/UAT-PHASE-58.sh` that:

1. **Setup section**: Check prerequisites (tmux installed, npm install complete, dist/ built)
2. **G1 section**: Run 3 grep assertions, expect pass
3. **G2 section**: Create 2 tmux sessions, call delegation-status pool, verify JSON shape
4. **G3 section**: Create session, abort, verify paused state, resume, verify pane survival
5. **G4 section**: Create cat session, forward-prompt, verify sentinel in pane buffer
6. **G5 section**: Create cat session, take-over, forward-prompt (suppress), release, forward-prompt (deliver)
7. **G6 section**: Trigger delegation, query session-tracker for 3 events
8. **Teardown section**: Kill all P58 test tmux sessions

The script should:
- Use `set -e` (fail-fast)
- Print pass/fail per scenario
- Return exit 0 if all 6 pass, exit 1 if any fail
- Capture all tmux session names with prefix `p58-uat-*` for teardown
- Log all output to `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-57-58-loop-2026-06-03/UAT-PHASE-58.log`

# Execute the UAT

After writing the script, EXECUTE it via `bash` tool. The script will:
- Verify each G1-G6 scenario
- Report per-scenario PASS/FAIL
- Clean up tmux sessions

If a scenario fails, capture the error output and provide diagnosis.

# UAT Report

Write `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-57-58-loop-2026-06-03/UAT-PHASE-58-REPORT.md` with:

# Phase 58: Real-Life UAT Report

**Date:** 2026-06-04
**Tester:** hm-integration-checker (automated)
**Environment:** real tmux daemon + Node.js + npm package

## Summary

| Gap | Scenario | Result | Evidence |
|-----|----------|--------|----------|
| G1 | grep-guard | PASS/FAIL | file:line + grep count |
| G2 | pool API | PASS/FAIL | delegation-status output |
| G3 | abort+resume | PASS/FAIL | persistence file state |
| G4 | forward-prompt | PASS/FAIL | pane buffer capture |
| G5 | take-over/release | PASS/FAIL | suppression + delivery |
| G6 | 3-event lifecycle | PASS/FAIL | event log inspection |

**Overall:** X/6 PASS

## Detailed Results

### G1 — delegate-task guard-rail
[Output of 3 grep assertions]

### G2 — Programmatic pool API
[delegation-status pool output]

### G3 — Abort+resume pane survival
[Persistence file state, pane status]

### G4 — Forward-prompt sentinel delivery
[Pane buffer captures]

### G5 — Take-over/release suppression
[Suppression + delivery evidence]

### G6 — 3-event lifecycle
[Event log entries]

## Issues Found (if any)

[Per-issue file:line + reproduction + suggested fix]

## Recommendation

[READY FOR SHIP | FIX [N] ISSUES]

# Boundary Rules

- USE bash, tmux CLI freely
- DO NOT modify src/ or tests/ (this is UAT, not implementation)
- DO NOT touch .hivemind/ runtime state beyond what the system writes
- Real tmux daemon required (use `tmux -V` to verify)
- DO NOT use mocks — real subprocesses only

# Atomic Commit

After UAT report:
- phase-58: UAT — UAT-PHASE-58.sh + UAT-PHASE-58-REPORT.md + UAT-PHASE-58.log

# Return Format

- Script path + LOC
- UAT report path + LOC
- Log file path
- Atomic commit SHA
- Overall pass rate (X/6)
- Issue list (if any)
- Gate triad verdict (lifecycle/spec/evidence)

Execute end-to-end. Real tmux. Real assertions. No shortcuts.