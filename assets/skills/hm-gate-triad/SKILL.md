---
name: hm-gate-triad
description: >
  Run the 3-gate quality sequence in fixed order. Use when the user wants
  to validate a change, run quality gates on a phase output, or audit a
  skill/agent/command for compliance. Triggers on verbs like "validate",
  "gate", "audit", "check quality", "verify". Pattern 3 Process — multi-step
  with strict ordering. The 3 gates: lifecycle-integration → spec-compliance
  → evidence-truth. Tech-agnostic + stack-agnostic. NOT for the gate
  themselves (load individual gate skills), NOT for spec authoring (load
  `hm-spec-authoring`).
metadata:
  consumed-by:
    - "hm-verifier"
    - "hm-orchestrator"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "gate-orchestrator"
  pattern: "P3-Process"
  realm: "spec,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - delegate-task
---

# Gate Triad

Run the 3 quality gates in fixed order. Halt on any failure. Replace
the per-gate-orchestrator skill with this one.

## The 3 Gates (in fixed order)

### Gate 1: gate-lifecycle-integration

Internal governance. Checks:
- 9-surface mutation authority (does the change respect surface boundaries?)
- CQRS write/read boundaries
- Classification fit (correct surface for the artifact)
- OpenCode SDK surface compliance (kebab-case, no reserved prefixes)

**Halt rule:** If Gate 1 fails, do NOT proceed to Gate 2. Fix the
lifecycle issues first.

### Gate 2: gate-spec-compliance

Spec alignment. Checks:
- Bidirectional traceability (requirement ↔ implementation)
- EARS acceptance criteria
- 4 gap types: missing / phantom / contradictory / underspecified
- Anti-patterns (test-after, mock-heavy, refactor-before-green)

**Halt rule:** If Gate 2 fails, do NOT proceed to Gate 3. Fix the
spec issues first.

### Gate 3: gate-evidence-truth

Terminal gate. Checks:
- Evidence hierarchy: L1 (runtime-truthful) > L2 (transport-mocked) > L3
  (mock-heavy) > L4 (manual-only) > L5 (docs)
- Coverage state: PASS / PARTIAL / MISSING / BLOCKED
- Fresh evidence (from current session, not cached)
- L3 + L4 cannot close L1 acceptance criteria

**Halt rule:** If Gate 3 fails, the work is not shippable. Gather
better evidence or downgrade the claim.

## The 3-Gate Sequence

```
Start
  │
  ▼
Gate 1: lifecycle-integration
  │ PASS? ─── NO ──→ Halt. Output remediation.
  │                    File:line for each issue.
  │                    Re-run after fix.
  │ YES
  ▼
Gate 2: spec-compliance
  │ PASS? ─── NO ──→ Halt. Output gap report.
  │                    Gap type per finding.
  │                    Re-run after fix.
  │ YES
  ▼
Gate 3: evidence-truth
  │ PASS? ─── NO ──→ Halt. Output evidence gap.
  │                    What's needed to upgrade evidence level.
  │                    Re-run after evidence added.
  │ YES
  ▼
ALL 3 PASS → Output VERIFICATION.md with status: passed
```

## Output: VERIFICATION.md

The triad produces a single VERIFICATION.md with:

```markdown
# VERIFICATION — <phase-or-skill-name>

**Date:** YYYY-MM-DD
**Verifier:** hm-verifier (via hm-gate-triad)

## Gate 1: lifecycle-integration
- Verdict: PASS | FAIL
- Findings: [list with file:line]

## Gate 2: spec-compliance
- Verdict: PASS | FAIL
- Findings: [list with gap type]

## Gate 3: evidence-truth
- Verdict: PASS | FAIL
- Findings: [list with evidence level + what's needed]

## Aggregate
- 3/3 PASS → status: passed
- Any FAIL → status: gaps_found (or human_needed)

## Remediation
[for any FAIL: what to fix, where, expected re-run]
```

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Skipping Gate 1 to "save time" | Lifecycle issues surface in Gate 2/3 as confusing failures | Always start with Gate 1 |
| Running gates in parallel | A failure in Gate 1 cascades into Gate 2/3 as false positives | Strict sequential order |
| "Gate 3 is just documentation" | Evidence-truth is the terminal gate; without it, nothing ships | Gate 3 is mandatory |
| Skipping on "trivial" changes | Trivial changes have lifecycle issues too | Always run all 3 |
| Bundling gates as "passed" without sub-checks | Masks which sub-check failed | Always emit per-gate + per-sub-check verdict |

## Cross-References

| Skill | Boundary |
|---|---|
| Individual gate skills (when they exist) | Run the gate; this skill runs the triad |
| `hm-spec-authoring` | Source of the EARS acceptance criteria that Gate 2 checks |
| `hm-test-driven` | Source of the L1 evidence that Gate 3 requires |
| `hm-coord-router` | Routes here when intent class is "validate" / "audit" |

## Additional Resources

### Reference Files
- **`references/gate-1-checklist.md`** — 9 sub-checks for lifecycle-integration
- **`references/gate-2-gap-types.md`** — missing/phantom/contradictory/underspecified
- **`references/gate-3-evidence-hierarchy.md`** — L1-L5 with examples

### Templates
- **`templates/verification-report.md`** — VERIFICATION.md template

### Workflows
- **`workflows/triad-execution.md`** — detailed sequence

### Evaluation
- **`evals/evals.json`** — 5 triad cases (3 gates, 1 fail, 1 human_needed)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
