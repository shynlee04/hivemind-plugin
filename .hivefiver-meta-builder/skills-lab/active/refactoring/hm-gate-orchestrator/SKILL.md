---
name: hm-gate-orchestrator
description: >
  Route phase validation through the quality gate triad (lifecycle → spec → evidence) in fixed order.
  Use during code-review gates, phase audits, milestone verification, integration checks, and deployment
  readiness. Triggers: "gate orchestration", "quality triad", "route gates", "phase audit gate",
  "verify against gates", "run the gates", "gate sequence", "full gate pass", "quality gate pipeline",
  "triad verification", "run quality gates", "gate check before deploy".
  Coordinates gate-lifecycle-integration → gate-spec-compliance → gate-evidence-truth in strict sequence.
  HALTS on any gate failure with structured remediation. NOT for individual gate execution — each gate
  skill operates independently. This skill orchestrates the triad as a pipeline.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["gate-lifecycle-integration", "gate-spec-compliance", "gate-evidence-truth"]
  input-from: ["hm-production-readiness", "hm-requirements-analysis", "hm-roadmap-maintainability"]
  consumed-by: ["hm-production-readiness", "hm-requirements-analysis", "hm-roadmap-maintainability", "hm-lineage-router"]
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## The Iron Law

```
Gates execute in fixed order: lifecycle → spec → evidence. No gate is skipped. No gate runs out of order.
```

# Gate Orchestrator

## Overview

Orchestrate the quality gate triad as a fixed-order pipeline. Each gate is an independent skill that produces a PASS/FAIL verdict. This skill sequences them, propagates results, and renders a unified verdict. It does NOT perform gate logic — it routes to the gate skills and enforces ordering.

**Three gates in strict sequence:**

| Gate | Skill | Checks | Duration |
|------|-------|--------|----------|
| Gate 1 | `gate-lifecycle-integration` | 9-surface mutation authority, CQRS boundaries, actor hierarchy, event-driven wiring | ~2 min |
| Gate 2 | `gate-spec-compliance` | Bidirectional traceability, gap detection (4 types), EARS acceptance criteria | ~3 min |
| Gate 3 | `gate-evidence-truth` | L1-L5 evidence hierarchy, mock detection, runtime proof verification | ~2 min |

**HALT rule:** If any gate returns FAIL, stop the pipeline. Produce a remediation report. Do NOT proceed to the next gate.

## On Load

1. Read `references/gate-flow.md` — the complete gate flow diagram with decision points
2. Identify the target: which files, modules, or phases to validate
3. Determine the gate context: code-review, phase-audit, milestone-verification, or deployment-readiness

## Trigger Phrases

- "run the gates" / "run quality gates"
- "gate orchestration" / "orchestrate the triad"
- "quality triad" / "full gate pass"
- "route gates" / "gate sequence"
- "phase audit gate" / "verify against gates"
- "gate check before deploy" / "triad verification"
- "quality gate pipeline" / "gate pipeline"

## Gate Flow

Follow this pipeline in strict order. Each gate receives the target artifacts and context from the previous gate.

```
- [ ] STEP 1: PREPARE — Identify target artifacts, load gate context
- [ ] STEP 2: GATE 1 — Route to gate-lifecycle-integration
  → If FAIL: STOP → remediation report → exit
  → If PASS: continue
- [ ] STEP 3: GATE 2 — Route to gate-spec-compliance (receives Gate 1 verdict)
  → If FAIL: STOP → remediation report → exit
  → If PASS: continue
- [ ] STEP 4: GATE 3 — Route to gate-evidence-truth (receives Gate 1 + 2 verdicts)
  → If FAIL: STOP → remediation report → exit
  → If PASS: unified verdict
- [ ] STEP 5: VERDICT — Render unified PASS/FAIL with evidence summary
- [ ] STEP 6: REMEDIATION — If any gate failed, produce structured fix plan
```

### STEP 1: Prepare

Identify what to validate:

- **Target artifacts:** List specific files, modules, or phase directories
- **Gate context:** One of: code-review, phase-audit, milestone-verification, deployment-readiness
- **Prior gate results:** If resuming from a failed gate, load previous results

### STEP 2: Gate 1 — Lifecycle Integration

Route to `gate-lifecycle-integration`. Pass:

- Target artifacts (file paths)
- Gate context (code-review / phase-audit / milestone / deployment)
- Any prior phase context (PLAN.md, SPEC.md)

**On PASS:** Record verdict. Continue to Gate 2.
**On FAIL:** Record failure mode. Skip Gates 2-3. Produce remediation report.

### STEP 3: Gate 2 — Spec Compliance

Route to `gate-spec-compliance`. Pass:

- Target artifacts
- Gate 1 verdict (lifecycle compliance evidence)
- SPEC.md or requirements document for traceability

**On PASS:** Record verdict. Continue to Gate 3.
**On FAIL:** Record failure mode (gap type, missing criteria). Skip Gate 3. Produce remediation report.

### STEP 4: Gate 3 — Evidence Truth

Route to `gate-evidence-truth`. Pass:

- Target artifacts
- Gate 1 + 2 verdicts (lifecycle + spec evidence)
- Implementation evidence (test results, runtime output, deployment artifacts)

**On PASS:** Record verdict. All three gates clear.
**On FAIL:** Record failure mode (insufficient evidence, mock detection). Produce remediation report.

### STEP 5: Verdict

Render a unified verdict:

| Outcome | Condition | Report |
|---------|-----------|--------|
| **PASS** | All 3 gates PASS | Summary: lifecycle ✅ spec ✅ evidence ✅ |
| **FAIL** | Any gate FAILS | Detailed remediation with gate-specific fixes |
| **PARTIAL** | Gate halted mid-execution | Context: which gate, why halted, what to resume |

### STEP 6: Remediation

If any gate failed, produce a structured remediation report:

```markdown
## Gate Remediation Report

**Failed Gate:** [Gate 1/2/3]
**Failure Mode:** [lifecycle-breach / spec-gap / evidence-insufficient]
**Affected Files:** [list]
**Remediation Steps:**
1. [specific fix action]
2. [specific fix action]
**Re-run Command:** Route to hm-gate-orchestrator after fixes applied
```

## Usage Protocol

### For Agents

When an agent needs to validate work through the quality triad:

1. Load this skill (`hm-gate-orchestrator`)
2. Call this skill with the target artifacts and gate context
3. Follow the 6-step pipeline exactly
4. Return the verdict to the calling agent

### For Integration Points

Three skills consume this orchestrator:

| Consumer | When | Expected Outcome |
|----------|------|-----------------|
| `hm-production-readiness` | After deployment safety verification | Unified gate verdict for deployment approval |
| `hm-requirements-analysis` | When gate validation reveals requirement insufficiency | Requirement gap remediation |
| `hm-roadmap-maintainability` | During milestone planning gates | Milestone approval with gate evidence |

## Self-Correction

### Anti-Pattern 1: Skipped Gate

**Detection:** Pipeline completes in fewer than 3 gate invocations.
**Correction:** Re-run from the skipped gate. Document why the skip occurred and whether it was intentional (it should never be).

### Anti-Pattern 2: Wrong Order

**Detection:** Gate 2 or Gate 3 runs before Gate 1, or Gate 3 runs before Gate 2.
**Correction:** Discard results. Restart from Gate 1. The ordering is mandatory because each gate's evidence feeds the next.

### Anti-Pattern 3: Mock as Evidence

**Detection:** Gate 3 (evidence-truth) reports L1/L2 evidence but investigation reveals mocked data flows.
**Correction:** Do not lower the evidence level. Mark as FAIL with remediation: "Replace mock with live integration test or runtime proof."

### Anti-Pattern 4: Gate Shopping

**Detection:** Pipeline stops at a failed gate, then the caller tries to re-run only the passing gates while skipping the failed one.
**Correction:** All three gates MUST pass. A failed gate means the work is not ready. Fix the failure, then re-run the full pipeline from Gate 1.

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥7 in description | 12 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Skipped Gate, Wrong Order, Mock as Evidence, Gate Shopping |
| HMQUAL-03 | Cross-references to sibling skills | 6 cross-references (3 gate skills + 3 consumer skills) |
| HMQUAL-04 | Progressive disclosure | SKILL.md (this file) + references/gate-flow.md |
| HMQUAL-05 | Evals with 3 scenarios | evals/evals.json — 3 trigger scenarios |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Gates execute in fixed order. No gate is skipped." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `gate-lifecycle-integration` | Gate 1 — 9-surface mutation authority. This skill routes to it. |
| `gate-spec-compliance` | Gate 2 — Bidirectional traceability. This skill routes to it. |
| `gate-evidence-truth` | Gate 3 — L1-L5 evidence hierarchy. This skill routes to it. |
| `hm-production-readiness` | Consumer — calls this orchestrator for deployment gates |
| `hm-requirements-analysis` | Consumer — calls this orchestrator for requirement validation gates |
| `hm-roadmap-maintainability` | Consumer — calls this orchestrator for milestone planning gates |
| `hm-lineage-router` | Routes quality tasks to this skill via the quality bundle |
