# Escalation Workflow

When to STOP the route-and-delegate flow and ask the user.

## Triggers

| Trigger | Action |
|---|---|
| 3 consecutive gate failures on the same delegation | Stop. Summarize what was tried. Ask user to choose: change approach / re-authorize / accept partial. |
| Agent file MISSING | Do NOT dispatch. List the missing file. Ask user to create or rename. |
| User prompt is multi-intent | Stop. List the intents detected. Ask user to confirm split order. |
| Intent classification ambiguous (no class fits) | Stop. List 3 candidate classes considered. Ask user to pick. |
| Dispatch returned `BLOCKED` with no recoverable cause | Stop. Show the agent's blocked reason. Ask user for input. |
| User explicit override (says "use agent X instead") | Comply. Document the deviation in the intent summary. |

## Escalation format

Present the user with EXACTLY this structure:

```
# Escalation: <short title>

**What was tried:**
- <step 1>
- <step 2>
- <step 3>

**What failed / what is unclear:**
- <issue>

**What I need from you:**
- <decision> (yes/no/change-direction)
- <optional: context>

**If silent for 60s, I will:**
- <fallback action, e.g., "default to NO and skip this dispatch">
```

## Recovery

If the user provides guidance, integrate it into the route-and-delegate
workflow and re-dispatch. If the user says "skip", mark the prompt as
DEFERRED in `.planning/intent-deferred.md` and continue to the next user
prompt.
