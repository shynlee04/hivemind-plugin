---
name: use-hivemind-context-verify
description: Entry router for context truth verification. Routes to build gates,
  test gates, git state checks, and truth anchor verification. P0 verification
  skill for completion claims and project truth validation.
---

# use-hivemind-context-verify

Entry router for context truth verification. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Before execution, at gate checkpoints, verifying completion claims, after critical operations.

**Primary Triggers:** "verify context", "truth check", "validate state", "completion claim", "gate checkpoint"

**Secondary Triggers:** "verify build", "verify tests", "check git state", "truth anchor", "proof of completion"

## Two HiveMind Lineages

| Lineage | Purpose | Confusion Pattern |
|---------|---------|-------------------|
| **hivefiver** | Meta-builder: framework verification, skill audits | Confusing framework verification with project verification |
| **hiveminder** | Project-oriented: product verification, completion gates | Confusing project verification with framework work |

**Rule:** Verification scope must match lineage. Framework gates for framework work, project gates for project work.

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route verification requests | Execute gate chains |
| **Reading** | Parse verification type | Run deterministic checks |
| **Execution** | Delegate, don't run gates | Implement gate execution |
| **Monitoring** | Gatekeep completion claims | Report gate results |

**Never** run gates directly. Always delegate to context-entry-verify.

## Do NOT Activate When

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery first |
| Session state | `interrupted`/`degraded` | Skip activation |
| Active skills | ≥3 | Wait for slot |
| Context health issue | Any | Route to context-integrity first |

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
| `use-hivemind` | Parent master entry |
| `use-hivemind-context-integrity` | Sibling context health entry |
| `context-entry-verify` | Implementation for gate execution |
| `evidence-discipline` | Supporting evidence patterns |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about verification scope
- Present gate alternatives

### Degree 2: Medium Freedom (Teaching Mode)
- Explain verification protocol
- Show gate-chain mapping

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit routing when verification type is clear
- Mandatory gate enforcement for completion claims

## Hard Behavior Rules

1. **Verification before completion.** No completion claims without passing gates. Block and report on failure.
2. **Truth is deterministic.** Use hard-proof JSON gates, not soft assertions. Gate-chain output is truth.
3. **Routing to gates, not execution.** Delegate to context-entry-verify for implementation. Never run gates directly.
4. **Never bypass failure.** When gate fails, await user instruction. Do NOT proceed autonomously.

---

**Pattern:** P1 (Entry Routing) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget
## NO-LOAD Rules

Do NOT activate this skill when:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to `use-hivemind-context-integrity` first |
| Session state is degraded | `interrupted` or `degraded` | Skip activation entirely |
| Stack budget exhausted | Active skills ≥3 | Wait for slot |
| Authority unclear | Conflicting SOT | Escalate first |
| Verification already in progress | Active verification | Skip duplicate verification |
