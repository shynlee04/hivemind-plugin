---
name: use-hivemind-context-verify
description: "When user claims 'done', 'verify', or 'check': runs build/test/git gates against project state. Returns pass/fail with evidence. NOTE: This is a verification router - it runs scripts and reports results, it does not block or enforce."
---

# use-hivemind-context-verify

Verification router for completion claims. Runs build/test/git gates and reports results.

## When to Activate

| Trigger | Action |
|---------|--------|
| "done" | Run verification gates |
| "verify" | Run verification gates |
| "check" | Run verification gates |
| "is it complete" | Run verification gates |

## Scripts

This skill has its own verification scripts:

- `scripts/gate-runner.cjs` — Executes build/test/git gates

### Gate Commands

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| build | `npx tsc --noEmit` | Exit code 0 |
| test | `npm test` | Exit code 0 |
| git | `git status --porcelain` | Empty output |

## Process Flow

```
User claims "done" → Run gate-runner.cjs → Report results
```

## Step-by-Step Protocol

1. **DETECT** — Did user claim completion or request verification?
2. **RUN GATES** — Execute `node scripts/gate-runner.cjs` or specific gate
3. **REPORT** — Return pass/fail with evidence
4. **RECOMMEND** — Based on results, suggest next steps

## Terminal State

- **Gates pass**: Completion verified, recommend proceeding
- **Gates fail**: Report failures with evidence, recommend fixes

## No Enforcement

> This skill RUNS verification and REPORTS results. It does NOT block or enforce. Actual enforcement must be implemented by the calling context via permission hooks or user consent.
