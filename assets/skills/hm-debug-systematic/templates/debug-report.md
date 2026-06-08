# Debug Report Template

Output structure for the 6-step systematic debug protocol.

```markdown
# Debug Report: <issue-id>

**Symptom:** <verbatim user report>
**Date:** <ISO timestamp>
**Debugger:** <agent name>

## Step 1: Reproduction
- **Reproduction command:** <cmd>
- **Output:** <output>
- **Matches user env?** yes / no
- **Reliable?** yes / no (1/10 runs)

## Step 2: Minimization
- **Minimized input:** <minimal trigger>
- **What was removed:**
  - <removed dep 1>
  - <removed dep 2>

## Step 3: Hypotheses (ranked)

### H1: <hypothesis> (most likely)
- Supporting evidence: <evidence>
- Refuting evidence: <evidence>
- Test: <cheapest way to test>

### H2: <hypothesis>
- ...

### H3: <hypothesis>
- ...

## Step 4: Instrumentation
- **Top hypothesis:** H<n>
- **Instrument added:** <log line / debugger / etc.>
- **Output:** <output>
- **Conclusion:** H<n> supported / refuted

## Step 5: Fix
- **Root cause:** <one-sentence>
- **Diff:** <diff>
- **Why this addresses cause, not symptom:** <explanation>

## Step 6: Regression Test
- **Test added:** <test path>
- **Test fails before fix:** <output>
- **Test passes after fix:** <output>
- **In test suite forever:** yes

## Lessons
- <what to remember for next time>
```

## Storage

Save as `cycles/04-skill-XX-<name>/<issue-id>-debug.md`. Reference from
the related cycle card.
