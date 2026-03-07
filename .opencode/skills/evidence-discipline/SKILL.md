---
name: "evidence-discipline"
description: "Use when making completion claims, accepting conflicting instructions, or validating subagent results. Enforces proof-before-claim: run verification, inspect output, update hierarchy."
---

# Evidence Discipline

**Core principle:** Never claim, always prove. Never accept, always validate.

## When to Use

- Claiming work is "done" or "fixed"
- Accepting user instructions that conflict with existing architecture
- Validating subagent results
- Deciding if a test, build, or deployment succeeded
- User says "it works" but no evidence shown

## Platform Adaptation

> Evidence collection tools differ by platform. The DISCIPLINE is universal:
> - **OpenCode**: `bash` tool for command execution, `recall_mems` for decisions
> - **Claude Code/Antigravity**: `run_command` for verification, file system for state
> - **Cursor/Windsurf**: Integrated terminal for command execution
>
> What matters: you RAN a verification, INSPECTED output, and RECORDED the result.

## The Evidence Chain

### Before Claiming Completion

Run verification commands appropriate to your context:
1. Does the code compile? (type checker)
2. Do tests pass? (test runner)
3. Is the work hierarchy consistent? (state validation)
4. Are all source files accounted for? (source audit)

### Before Accepting Conflicting Instructions

Check against existing state:
1. What does the current trajectory say you're doing?
2. What decisions were already made?
3. What does the active plan say?
4. What does version control history show?

### After Subagent Returns

```
Subagent says "Done"
    │
    ├── Contains failure signals?
    │   (failed, error, couldn't, unable, blocked, partially, skipped)
    │   YES → Record as FAILURE or PARTIAL
    │   NO  → Continue
    │
    ├── Describes what was ACTUALLY done?
    │   VAGUE → Ask for specifics
    │   SPECIFIC → Verify independently
    │
    └── Can you verify independently?
        RUN verification → Record accurate outcome
```

## The Minimum Evidence Bar

**Nothing is "done" without ALL of these:**
1. Verification command ran (test/build/lint — at least one)
2. Output inspected (not just exit code — read the output)
3. Work hierarchy updated with accurate status
4. If subagent was involved: cycle intelligence exported with accurate outcome

## Red Flags — You're About to Skip Evidence

| Thought | Reality |
|---------|---------|
| "The subagent said it works" | Subagents hallucinate success. Verify independently. |
| "The user confirmed it" | Users can be wrong. Run the verification commands. |
| "I tested it mentally" | Mental models miss edge cases. Run actual commands. |
| "It's obvious this is correct" | Obvious things break. One test run takes 3 seconds. |
| "I'll verify at the end" | Compaction may erase the context. Verify NOW. |
| "The error is unrelated" | Prove it's unrelated. Diff + test output = evidence. |

## TDD Verification Gate (Code Changes)

When the work involves code changes, this additional gate applies:

| Phase | Checkpoint | NEVER Skip |
|-------|-----------|------------|
| **RED** | Write test that fails for the expected reason | Writing code before test exists |
| **GREEN** | Write minimal code to make test pass | Over-engineering to get green |
| **REFACTOR** | Clean up AND re-run tests | Refactoring without re-running |

**Completion for code changes requires:**
1. Test output showing pass count (not "tests pass" — the actual output)
2. Build output showing 0 errors (not "it builds" — the actual output)
3. Full suite run (not just changed tests — catch regressions)

## PLAN.md Protocol Anchor

This skill activates at **Steps 7-8 (Execute, Gatekeeping)** — enforces proof-before-claim during execution and provides the minimum evidence bar at gatekeeping. Also activates at **Step 9 (Atomic Commit)** — commit only if evidence chain is complete.

## Bundled Resources

| Resource | Trigger | Content |
|----------|---------|---------|
| [evidence-catalogue.md](references/evidence-catalogue.md) | Need to identify evidence types or platform-specific tools | Evidence types, collection strategies, chain validation |
| [evidence-report.md](templates/evidence-report.md) | Producing evidence output | Fill-in report: claim → evidence → verdict |

