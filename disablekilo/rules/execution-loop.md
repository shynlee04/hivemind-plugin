# Execution Loop — Mandatory Order

Every agent working on this project follows this cycle. No exceptions.

```
1. USER INTENT → Extract what the user wants (one sentence)
2. GATHER CONTEXT → Read planning files, skill hierarchy, current state
3. INVESTIGATE → Deep dive into the problem domain (not surface reading)
4. VALIDATE IN ISOLATION → Each finding verified independently
5. PRESENT TO USER → Show findings, design, plan in sections
6. WAIT FOR APPROVAL → Do NOT proceed until user confirms
7. DELEGATE → Dispatch subagents for implementation (NEVER execute directly)
8. VALIDATE EVERYTHING → Run scripts, loop until pass
9. REPORT → Update planning files, commit, inform user
```

Skipping any step = immediate stop. Re-align and resume from the missed step.
