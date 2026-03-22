---
name: context-entry-verify
description: Use when verifying project health before work, at gate checkpoints, or when validating completion claims. Runs deterministic JSON gates against real project state — build, tests, git, dependencies, and optional planning integrity.
---

# Context-Entry Verify

**Purpose:** Deterministic JSON-verified proof of project state. Answers "is this project in a known-good state?" with machine-readable evidence.

## When to Use

- Before starting a work session, to baseline project health
- At gate checkpoints between implementation phases
- When validating completion claims with hard evidence
- When project state is uncertain after merges, dependency changes, or long gaps

Do NOT use for:
- Agent session health or context-rot detection (different concern)
- Generic code review or refactoring decisions
- Situations where a quick `tsc --noEmit && npm test` suffices

## Verification Script

The package includes `scripts/hm-verify.cjs` — a zero-dependency Node.js CLI that runs structured verification gates and returns JSON.

```bash
# Quick project health check (fail-fast)
node skills/context-entry-verify/scripts/hm-verify.cjs gate-chain --raw

# Full landscape report (runs all gates, never blocks)
node skills/context-entry-verify/scripts/hm-verify.cjs landscape --raw

# Individual gate checks
node skills/context-entry-verify/scripts/hm-verify.cjs project build --raw
node skills/context-entry-verify/scripts/hm-verify.cjs project tests --raw
node skills/context-entry-verify/scripts/hm-verify.cjs git branch-state --raw
```

## Gate Layers

| Layer | Gates | Type | Scope |
|-------|-------|------|-------|
| 1. Project Reality | contracts, dependencies, sdk-surface, build, tests | Hard | Universal |
| 2. Planning Integrity | exists, health, consistency | Hard | Project-specific — requires `.planning/` convention |
| 3. Git Evidence | branch-state, last-commit, diff-stat | Hard | Universal |
| 4. Architecture | src-domains, dead-exports, circular-deps | Soft (warnings) | Universal |

> **Note:** Layer 2 (Planning Integrity) assumes the project uses the `.planning/` directory convention with `STATE.md`, `ROADMAP.md`, and `REQUIREMENTS.md`. If your project does not use this convention, these gates will report failures that are not meaningful. Use `landscape` instead of `gate-chain` to see all results without blocking, or run individual gates from Layers 1, 3, and 4 directly.

## Interpreting Results

Every gate returns a JSON object:

```json
{
  "gate": "project build",
  "passed": true,
  "data": { "exit_code": 0, "stdout": "...", "stderr": "" }
}
```

- **`gate-chain`**: Runs gates sequentially, stops at first failure, includes `blocked_at` and `delegation_trigger` fields
- **`landscape`**: Runs all gates regardless of failures, returns unified verdict with `PASS`, `DEGRADED`, or `FAIL`

When a gate fails, the JSON output contains enough evidence to decide next steps without re-running the check.

## Bundled Resources

| Resource | Content |
|----------|---------|
| `scripts/hm-verify.cjs` | Standalone verification CLI (zero npm deps, pure Node.js) |
| [gate-definitions.md](references/gate-definitions.md) | What each gate checks and its pass criteria |
| [gate-chain-order.md](references/gate-chain-order.md) | Why the chain runs in this specific order |
| [direct-invocation.md](tests/direct-invocation.md) | Standalone validation scenario |

## Independence Rules

- This package can be invoked directly; it does not require a sibling routing skill.
- The verification script is self-contained with zero npm dependencies beyond Node.js built-ins.
- Local references document gate behavior, but none are required to run the script.
- If upstream triage exists, it may choose this skill, but the skill must remain usable without that upstream layer.

## Terminal State

- **If gates pass**: Project state is verified; proceed with work
- **If gates fail**: Report failure with JSON evidence, decide next steps based on which layer failed
