# Session Start Checklist

The 8-step checklist to run at the start of every session. Goal: ensure the
agent has full situational awareness before any user prompt.

## Step 1: Confirm runtime state is intact

Run:

```bash
bash assets/skills/hivemind-power-on/scripts/validate-state.sh
```

Expected: state root exists, session-tracker has sessions, delegations
subdir (if present) has records.

## Step 2: Discover active/resumable sessions

Use the `session-tracker` tool:

```
session-tracker({ action: "filter-sessions", status: "active" })
session-tracker({ action: "list-sessions" })
```

Expected: a list of session IDs with their status, agent, and last activity.

## Step 3: Query hierarchy for current session

```
session-hierarchy({ action: "get-manifest", sessionId: "<current-session-id>" })
```

Expected: a tree showing parent → child sessions, with depth and state.

## Step 4: Decide resume vs stack vs create

| Situation | Approach | Tool |
|---|---|---|
| Session active, same agent type | Resume | `task` with `task_id` |
| Session completed, add work | Stack | `task` with `task_id` |
| No relevant session exists | Create | `task` (no `task_id`) |
| Not sure if resumable | Check first | `delegation-status` before dispatch |

## Step 5: Verify resume target (if resuming)

Run:

```bash
bash assets/skills/hivemind-power-on/scripts/validate-resume.sh <session-id>
```

Expected: session dir exists, continuity + manifest present (with caveats
if missing).

## Step 6: Initialize or update the session resume pointer

Use `templates/session-resume-pointer-template.md`. Save to
`.hivemind/session-tracker/<session-id>/resume-pointer.md`.

## Step 7: Load the bundle

The 3 skills at session start (per the user):

1. `hivemind-power-on` (this skill)
2. `hm-coord-router` (intent classification + routing)
3. `hm-spec-authoring` (or another specialist appropriate to the domain)

Plus 1 orchestrator focus + 1 specialist, per the user's "no more than 3
per load" rule.

## Step 8: Confirm with the user

Briefly state:
- Number of resumable sessions
- Current state
- Loaded skills
- Ready to receive user prompt

## Stop conditions

- State root missing → escalate; the runtime is not configured
- All sessions are stale (>24h no activity) → do not resume; create fresh
- More than 3 skills already loaded → unload the lowest-priority
