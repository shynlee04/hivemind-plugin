---
name: context-entry-verify
description: Deterministic verification skill. Use when starting work, before execution, at gate checkpoints, or when verifying completion claims. Runs hard-proof JSON gates against real project state.
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
- If all gates pass → proceed with work
- If any gate fails → delegate report to user, wait for instruction

## Commands

| Command | Purpose | Blocks On Fail? |
|---------|---------|-----------------|
| `gate-chain` | Sequential fail-fast verification | YES |
| `landscape` | Full landscape report (all gates) | NO |
| `project build` | TypeScript compile check | YES |
| `project tests` | Run npm test | YES |
| `git branch-state` | Check for uncommitted changes | YES |

## Delegation Protocol

When `gate-chain` fails:

1. Parse `blocked_at` and `delegation_trigger` from JSON
2. Report to user: "Gate [X] failed"
3. Provide evidence (full gate result JSON)
4. Await user instruction
5. Do NOT proceed past failure autonomously

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
