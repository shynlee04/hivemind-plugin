---
name: "evidence-discipline"
description: "Enforces evidence-based claims. Prove with command output before concluding. Run tests before claiming success."
triggers:
  - "Before making completion claims"
  - "When verification is needed"
  - "After running tests or builds"
version: "2.6.0"
---

# Evidence Discipline

**Core principle:** Never claim, always prove. Never accept, always validate.

## When to Use

- Claiming work is "done" or "fixed"
- Accepting user instructions that conflict with existing architecture
- Validating subagent results
- Deciding if a test, build, or deployment succeeded
- User says "it works" but no evidence shown

## The Evidence Chain

Every claim needs a verification path. HiveMind gives you concrete tools:

### Before Claiming Completion

```bash
# 1. Does the code compile?
npx tsc --noEmit

# 2. Do tests pass?
npm test

# 3. Is the hierarchy consistent?
node bin/hivemind-tools.cjs validate chain

# 4. Are all source files accounted for?
node bin/hivemind-tools.cjs source-audit

# 5. Does the full ecosystem check pass?
node bin/hivemind-tools.cjs ecosystem-check
```

### Before Accepting Conflicting Instructions

```bash
# What does the trajectory say we're doing?
node bin/hivemind-tools.cjs state hierarchy

# What decisions did we already make?
recall_mems({ shelf: "decisions" })

# What does the plan say?
# Read the active plan file from hierarchy cursor

# What does git history show?
git log --oneline -10
git log --grep="<stamp>" --oneline
```

### After Subagent Returns

```
Subagent says "Done"
    │
    ├── Does the result text contain failure signals?
    │   (failed, error, couldn't, unable, blocked, partially, skipped)
    │   YES → export_cycle({ outcome: "failure" | "partial", findings: "..." })
    │   NO  → continue
    │
    ├── Does the result describe what was ACTUALLY done?
    │   VAGUE → ask for specifics before proceeding
    │   SPECIFIC → verify independently
    │
    ├── Can you verify independently?
    │   RUN: npm test / tsc / grep for expected changes
    │   PASS → export_cycle({ outcome: "success", findings: "..." })
    │   FAIL → export_cycle({ outcome: "failure", findings: "..." })
    │
    └── Update hierarchy
        map_context({ level: "action", status: "complete" | "blocked" })
```

## Reward — What Evidence Gets You

| Action | Intelligence Gained |
|--------|-------------------|
| `export_cycle` after every subagent | Full decision trail in hierarchy tree + mems |
| `save_mem({ shelf: "decisions" })` | Any future agent can recall WHY you chose X over Y |
| `git log --grep="<stamp>"` | Commits linked to hierarchy nodes by timestamp |
| `grep -r "<stamp>" .hivemind/` | Full evidence chain: tree + mems + anchors + archives |
| `node bin/hivemind-tools.cjs session trace <stamp>` | One command, complete picture |

## Consequence — What Skipping Costs

| Skip | Cost |
|------|------|
| Claim "done" without `npm test` | Broken code deployed, trust lost |
| Accept instruction without checking trajectory | Architecture contradicted, rework needed |
| Ignore subagent failure signals | False completion, bug surfaces later at 10x cost |
| No `save_mem` for key decision | Next session re-debates the same choice |

## Red Flags — You're About to Skip Evidence

| Thought | Reality |
|---------|---------|
| "The subagent said it works" | Subagents hallucinate success. Verify independently. |
| "The user confirmed it" | Users can be wrong. Run the verification commands. |
| "I tested it mentally" | Mental models miss edge cases. Run actual commands. |
| "It's obvious this is correct" | Obvious things break. One `npm test` takes 3 seconds. |
| "I'll verify at the end" | Compaction may erase the context. Verify NOW. |
| "The error is unrelated" | Prove it's unrelated. `git diff` + test output = evidence. |

## The Minimum Evidence Bar

**Nothing is "done" without ALL of these:**
1. Verification command ran (test/build/lint — at least one)
2. Output inspected (not just "0 exit code" — read the output)
3. Hierarchy updated (`map_context status: "complete"`)
4. If subagent was involved: `export_cycle` called with accurate outcome
