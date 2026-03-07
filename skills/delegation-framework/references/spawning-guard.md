# Spawning Guard Reference

**MANDATORY LOAD**: Before any delegation dispatch in the delegation-framework.

> This reference is shared content that entry-resolution also bundles independently.
> If already loaded via entry-resolution, do NOT re-load.

## Pre-Spawn Checklist

**ALL 7 items must be verified before spawning:**

| # | Gate | Check | Fail Action |
|---|------|-------|-------------|
| 1 | Intent verified | Is the user's goal 100% clear? | Ask ONE question |
| 2 | Lineage confirmed | Correct orchestrator for this domain? | Flag mismatch |
| 3 | Target agent identified | Specific subagent type (not "any")? | Identify type |
| 4 | Scope bounded | Explicit in-scope AND out-of-scope? | Define boundaries |
| 5 | Acceptance criteria set | How to verify subagent output? | Set criteria |
| 6 | Context budget checked | Will delegation fit in token limits? | Reduce scope |
| 7 | Intelligence export planned | How will results be captured? | Plan capture |

## Execution Model Decision Tree

```
Can subtask N succeed independently of subtask M?
  │
  ├─ YES for ALL pairs AND no shared state mutation:
  │    → PARALLEL allowed
  │
  ├─ YES for ALL pairs BUT shared state mutation exists:
  │    → SEQUENTIAL required (state conflict risk)
  │
  └─ NO for ANY pair:
       → SEQUENTIAL required (dependency chain)

Default: SEQUENTIAL. Parallel is an optimization you earn.
```

## Post-Return Validation

After every subagent return:
1. Check for failure signals: "failed", "error", "couldn't", "unable", "blocked"
2. Verify result specificity: not just "done" — requires concrete details
3. Verify independently: run a test, check a file, grep for evidence
4. Record accurate outcome: success with evidence, or failure with details
