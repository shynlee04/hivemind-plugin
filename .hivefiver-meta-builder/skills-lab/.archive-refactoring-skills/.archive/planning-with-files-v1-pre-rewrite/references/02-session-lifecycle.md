# Session Lifecycle — States and Enforcement

## Session States

A planning session moves through these states. Each state has entry conditions, exit conditions, and enforcement mechanisms.

```
IDLE → INIT → PLANNING → EXECUTING → VERIFYING → COMPLETE
  ↑         ↓                ↓
  └── RECOVER ←──────── INTERRUPTED
```

## State Definitions

### IDLE

No planning files exist. No active task.

- **Entry:** Default state
- **Exit:** User requests planning OR task requires >5 tool calls
- **Enforcement:** `scripts/init-session.sh` creates files → transitions to INIT

### INIT

Planning files are being created. Skeletons exist but Goal is not yet filled.

- **Entry:** `init-session.sh` runs
- **Exit:** `task_plan.md` has a Goal and at least 1 phase → transitions to PLANNING
- **Enforcement:** Gate check — no Write/Edit/Bash (beyond init) until Goal is set

### PLANNING

Goal is defined. Phases are generated. Agent is filling in the plan.

- **Entry:** Goal section is populated in `task_plan.md`
- **Exit:** First phase marked `in_progress` → transitions to EXECUTING
- **Enforcement:** `scripts/check-complete.sh` returns "0/N phases complete"

### EXECUTING

Work is happening. Phases are being completed.

- **Entry:** First phase is `in_progress`
- **Exit:** All phases `complete` → transitions to VERIFYING
- **Enforcement:** 
  - Goal-refresh: Read `task_plan.md` every 5 tool calls
  - 2-Action Rule: Update `findings.md` after 2 view/search operations
  - Error logging: Every error goes in Errors Encountered table

### VERIFYING

All phases marked complete. Agent is confirming nothing was missed.

- **Entry:** All phases show `**Status:** complete`
- **Exit:** `scripts/check-complete.sh` confirms all complete → transitions to COMPLETE
- **Enforcement:** `check-complete.sh` must return "ALL PHASES COMPLETE"

### COMPLETE

Task is done. Planning files are finalized.

- **Entry:** `check-complete.sh` confirms completion
- **Exit:** User starts new task → transitions to IDLE (new files) or INIT (reuse)
- **Enforcement:** Stop hook runs `check-complete.sh`

### INTERRUPTED

Session ended unexpectedly. Context was lost.

- **Entry:** `/clear`, crash, or new session with existing planning files
- **Exit:** Recovery protocol completes → transitions to EXECUTING (resume) or PLANNING (re-plan)
- **Enforcement:** `scripts/session-catchup.py` + `git diff` reconciliation

### RECOVER

Recovery protocol is running. Agent is reconciling file state with actual work.

- **Entry:** INTERRUPTED state detected
- **Exit:** Planning files match actual state → transitions back to previous active state
- **Enforcement:** Recovery protocol (see below)

## Recovery Protocol

When a session resumes after interruption:

### Step 1: Detect State

```bash
# Check if planning files exist
if [ -f task_plan.md ]; then
  # Read all three files
  cat task_plan.md
  cat findings.md 2>/dev/null
  cat progress.md 2>/dev/null
fi
```

### Step 2: Run Catchup

```bash
python3 scripts/session-catchup.py
```

This detects unsynced context from previous sessions.

### Step 3: Cross-Reference with Git

```bash
git diff --stat
git log --oneline -5
```

Compare actual code changes against what the plan says was done.

### Step 4: Reconcile

For each phase in `task_plan.md`:
1. Check if phase checkboxes are marked
2. Check if `**Status:**` matches actual work
3. If git shows changes not reflected in plan → update plan
4. If plan shows work not in git → investigate (was it committed elsewhere?)

### Step 5: Resume

- Set `## Current Phase` to the last `in_progress` phase (or next `pending` if all prior are complete)
- Re-read `task_plan.md` before the next action
- Log the recovery in `progress.md`

## Enforcement Mechanisms

### Hook-Based Enforcement

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `pre-tool-use.json` | Before Write/Edit | Injects plan state into context |
| `post-tool-use.json` | After Write/Edit | Reminds to update progress |
| `stop.json` | Session stop | Runs `check-complete.sh` |

### Script-Based Enforcement

| Script | What It Checks | Failure Behavior |
|--------|---------------|-----------------|
| `check-complete.sh` | Phase status + content | Reports incomplete phases to stdout |
| `session-catchup.py` | Unsynced context | Prints catchup report |
| `init-session.sh` | File existence | Creates clean skeletons |

### Manual Enforcement (Agent Discipline)

| Rule | Trigger | Action |
|------|---------|--------|
| Goal-refresh | Every 5 tool calls | Read `task_plan.md` |
| 2-Action Rule | Every 2 view/search | Update `findings.md` |
| Error logging | Every error | Log in Errors Encountered |
| Phase update | Phase completion | Update status + log in progress.md |

## State Transition Table

| From | To | Trigger | Gate Check |
|------|----|---------|-----------|
| IDLE | INIT | User requests planning | None |
| INIT | PLANNING | Goal + phases defined | `task_plan.md` has Goal section |
| PLANNING | EXECUTING | First phase starts | Phase 1 status = `in_progress` |
| EXECUTING | VERIFYING | All phases complete | `check-complete.sh` confirms |
| VERIFYING | COMPLETE | Verification passes | All checkboxes checked |
| EXECUTING | INTERRUPTED | Session ends | None (involuntary) |
| INTERRUPTED | RECOVER | Session resumes | Planning files exist |
| RECOVER | EXECUTING | Reconciliation done | Plan matches git state |
| COMPLETE | IDLE | New task requested | None |
