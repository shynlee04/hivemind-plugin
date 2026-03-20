---
name: use-hivemind-context-verify
description: Entry router for context truth verification. Routes to build gates, test gates, git state checks, and truth anchor verification. P0 verification skill for completion claims and project truth validation.
---

# use-hivemind-context-verify

Entry router for context truth verification. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Before execution, at gate checkpoints, verifying completion claims, after critical operations.

**Primary Triggers:** "verify context", "truth check", "validate state", "completion claim", "gate checkpoint"

**Secondary Triggers:** "verify build", "verify tests", "check git state", "truth anchor", "proof of completion"

## Do NOT Activate When

| Condition | Action |
|-----------|--------|
| Deep implementation needed | Delegate to context-entry-verify |
| Context health check needed | Delegate to use-hivemind-context-integrity |
| Active skills ≥3 | Skip activation (stack budget) |
| User requests specific gate | Route directly to that gate |

## Routing Decision Matrix

| Detected Need | Route To | Priority |
|---------------|----------|----------|
| Build verification | context-entry-verify `project build` | HIGH |
| Test verification | context-entry-verify `project tests` | HIGH |
| Git state verification | context-entry-verify `git branch-state` | HIGH |
| Truth anchor verification | context-entry-verify `gate-chain` | MEDIUM |
| Completion claim enforcement | context-entry-verify gate-chain + await user | HIGH |
| Full landscape report | context-entry-verify `landscape` | LOW |

## Detection Keywords

| Keyword Pattern | Need Type | Route |
|-----------------|-----------|-------|
| "verify build", "compile check", "type check" | Build | context-entry-verify |
| "verify tests", "test check", "test gate" | Tests | context-entry-verify |
| "git state", "branch clean", "no uncommitted" | Git | context-entry-verify |
| "truth anchor", "hard proof", "deterministic" | Truth | context-entry-verify |
| "completion claim", "done", "finished" | Completion | context-entry-verify |

## Routing Protocol

1. **DETECT** — Parse verification type from context or request
2. **MATCH** — Apply detection keywords to routing matrix
3. **ROUTE** — Invoke context-entry-verify with appropriate gate
4. **ENFORCE** — If gate fails, block and report; do NOT proceed

## Specialist Skills (Implementation)

| Skill | Purpose |
|-------|---------|
| `context-entry-verify` | Deterministic gate-chain execution |
| `git-atomic-memory` | Git anchor verification |
| `use-hivemind-context-integrity` | Context health (drift/rot) |

## What This Skill Does NOT Do

| ❌ Not Allowed | Reason |
|----------------|--------|
| Execute gates | Delegate to context-entry-verify |
| Implement verification logic | Routing layer only |
| Bypass failed gates | Must block and report |
| Check context health/rot | Delegate to use-hivemind-context-integrity |

## Completion Claim Enforcement

When user claims completion:

1. **RUN** `gate-chain --raw` before approval
2. **PARSE** `blocked_at` and `delegation_trigger`
3. **REPORT** gate status with full evidence
4. **AWAIT** user instruction
5. **NEVER** proceed past failure autonomously

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `context-entry-verify` | Implementation for truth gates |
| `use-hivemind-context-integrity` | Entry for context health |
| `use-hivemind` | Master entry point (parent) |

## NO-LOAD Rules

Active skills ≥3 → Skip activation. User specifies gate directly → Route directly. Context health issue → Route to use-hivemind-context-integrity first.

---

**Pattern:** P1 (Entry Routing) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget