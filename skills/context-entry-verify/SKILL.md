---
name: context-entry-verify
description: Deterministic verification skill. Use when starting work, before execution, at gate checkpoints, or when verifying completion claims. Runs hard-proof JSON gates against real project state. NOTE: This skill RUNS verification and REPORTS results - it does not block or enforce.
triggers:
  - starting work
  - before execution
  - gate checkpoints
  - verifying completion claims
auto_run: before-work-execution
---

# Context-Entry Verify

**Purpose:** Provides deterministic JSON-verified proof of project reality.

**Different from context-intelligence-entry:** That skill checks agent session health (rot, trust, action gates). This skill checks project truth (build, tests, git state, architecture).

## Auto-Run Behavior

Runs `hm-verify.cjs gate-chain --raw` **before** any work execution:
- If all gates pass → report success, recommend proceeding
- If any gate fails → report failure with evidence, await user instruction

## Commands

| Command | Purpose | Reports |
|---------|---------|---------|
| `gate-chain` | Sequential verification | Pass/Fail with evidence |
| `landscape` | Full landscape report (all gates) | All results |
| `project build` | TypeScript compile check | Pass/Fail |
| `project tests` | Run npm test | Pass/Fail |
| `git branch-state` | Check for uncommitted changes | Pass/Fail |

## Delegation Protocol

When `gate-chain` fails:

1. Parse `blocked_at` and `delegation_trigger` from JSON
2. Report to user: "Gate [X] failed"
3. Provide evidence (full gate result JSON)
4. Await user instruction

## Usage Examples

```bash
# Quick gate check before work
node skills/context-entry-verify/scripts/hm-verify.cjs gate-chain --raw

# Full landscape report
node skills/context-entry-verify/scripts/hm-verify.cjs landscape --raw

# Individual gates
node skills/context-entry-verify/scripts/hm-verify.cjs project build --raw
node skills/context-entry-verify/scripts/hm-verify.cjs git branch-state --raw
```

## Gate Layers

| Layer | Gates | Type |
|-------|-------|------|
| 1. Project Reality | contracts, dependencies, sdk-surface, build, tests | Hard |
| 2. Planning Integrity | exists, health, consistency | Hard |
| 3. Git Evidence | branch-state, last-commit, diff-stat | Hard |
| 4. Architecture | src-domains, dead-exports, circular-deps | Soft (warnings) |

## References

- [gate-definitions.md](references/gate-definitions.md) - What each gate checks
- [gate-chain-order.md](references/gate-chain-order.md) - Why this order matters
