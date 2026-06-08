---
name: quality-gate-orchestration
description: >
  Orchestrate quality gates as a fixed-sequence triad (lifecycle → spec compliance → evidence truth).
  Use during code review gates, phase audits, milestone verification, integration checks, and deployment
  readiness. Triggers on: "run quality gates", "gate orchestration", "quality triad", "full gate pass",
  "gate check before deploy", "pipeline gate", "gate sequence", "verify against gates",
  "phase audit gate", "triad verification", "quality gate pipeline", "route gates",
  "evidence hierarchy check", "gate decision matrix", "which gate to run first",
  "PASS FAIL routing", "gate remediation". Framework-agnostic — applies to any gate system
  with ordered quality stages. NOT for individual gate execution, coordination dispatch,
  or completion detection.
metadata:
  pattern: P2
  version: "1.0.0"
  classification: how-to-implement
  scope: quality-gate-orchestration
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
Gates execute in fixed order. No gate is skipped. No gate runs out of order.
```

# Quality Gate Orchestration

## Overview

Orchestrate quality gates as a fixed-sequence pipeline. Each gate is an independent check producing a PASS/FAIL verdict. This framework sequences them, propagates results, and renders a unified verdict. Do NOT perform individual gate logic — route to gate-level skills or checks and enforce ordering.

Gate orchestration answers three questions:
1. **Which gates run and in what order?**
2. **What happens when a gate fails?**
3. **How do gate results compose into a final verdict?**

It does NOT teach how to write individual gates, how to coordinate multi-agent dispatch, or how to detect task completion.

### When to use this framework

Load this skill when:
- Planning a quality gate pipeline for a phase, milestone, or release
- Running the gate triad (lifecycle → spec → evidence) in sequence
- Deciding which gates apply to a specific context
- A gate fails and remediation routing is needed
- Establishing a gate baseline for a new project
- Auditing whether existing gates run in the correct order

### When NOT to use

Skip this skill when:
- Running a single gate in isolation — use the gate skill directly
- Dispatching subagents or coordinating parallel work — use coordination patterns
- Detecting whether a task is complete — use completion detection patterns
- Authoring new gate definitions — this is orchestration, not gate design

## On Load

1. Read `references/terminology-map.md` — gate concepts across frameworks (GSD, Hivemind, general)
2. Read `references/philosophy.md` — why triad order matters, evidence hierarchy rationale
3. Identify the gate context: code-review, phase-audit, milestone-verification, or deployment-readiness

## The Triad: Three Gates in Fixed Order

| Position | Gate Domain | Checks | Critical Question |
|----------|------------|--------|-------------------|
| **Gate 1** | Lifecycle / Structure | Correct placement, boundaries intact, architecture rules followed | "Is this built in the right place?" |
| **Gate 2** | Spec Compliance | Requirements traceability, acceptance criteria met, no orphan code | "Does this meet the spec?" |
| **Gate 3** | Evidence Truth | Runtime proof exists, evidence level sufficient, no mocked claims | "Can we prove it works?" |

### Why This Order (Non-Negotiable)

```
lifecycle → spec → evidence
```

- **Lifecycle first**: If code is in the wrong place or violates architecture boundaries, spec compliance is meaningless. Fix structure before checking content.
- **Spec second**: Spec compliance verifies WHAT was built. Evidence verifies HOW WELL. Checking evidence before spec produces false confidence — tests passing on the wrong feature.
- **Evidence last**: Evidence is the terminal gate. It checks runtime truth AFTER structure and spec are confirmed. If evidence passes, all gates clear.

See `references/philosophy.md` for detailed rationale.

## Trigger Phrases

- "run the gates" / "run quality gates" / "run quality gate"
- "gate orchestration" / "orchestrate the triad"
- "quality triad" / "full gate pass"
- "route gates" / "gate sequence"
- "phase audit gate" / "verify against gates"
- "gate check before deploy" / "triad verification"
- "quality gate pipeline" / "gate pipeline"
- "gate decision matrix" / "which gate to run"
- "evidence hierarchy check" / "PASS FAIL routing"
- "gate remediation" / "remediation route"

## Gate Decision Matrix

Not every context needs all three gates. Use this matrix to determine which gates apply:

| Context | Gate 1 (Lifecycle) | Gate 2 (Spec) | Gate 3 (Evidence) | Minimum Evidence Level |
|---------|:---:|:---:|:---:|:---:|
| **Code review (PR)** | ✅ | ✅ | Optional | L3 (integration test) |
| **Phase completion** | ✅ | ✅ | ✅ | L2 (continuity record) |
| **Milestone verification** | ✅ | ✅ | ✅ | L2 + one L1 (live proof) |
| **Integration check** | ✅ | ✅ | ✅ | L3 (real boundaries) |
| **Deployment readiness** | ✅ | ✅ | ✅ | L1 (live runtime proof) |
| **Quick patch / hotfix** | Skip | ✅ | ✅ | L3 |
| **Documentation-only change** | Skip | Skip | Skip | N/A |
| **Structural refactor** | ✅ | Optional | ✅ | L3 |

**Rules for skipping:**
- Skip Gate 1 only when zero structural changes are made (no file moves, no new modules, no architecture changes).
- Skip Gate 2 only when zero behavioral changes are made (formatting-only, doc-only, import reorganization without logic change).
- Skip Gate 3 only when the gate context explicitly waives runtime proof (e.g., draft PR with note "will add tests").
- Never skip all three gates on a change that modifies runtime behavior. Minimum: at least one gate must run.

## Gate Execution Pipeline

Follow this pipeline in strict order:

```
- [ ] STEP 1: PREPARE — Identify target artifacts, determine gate context
- [ ] STEP 2: GATE 1 — Route to lifecycle/structure gate
  → If FAIL: STOP → produce remediation report → exit
  → If PASS: continue
- [ ] STEP 3: GATE 2 — Route to spec compliance gate (receives Gate 1 verdict)
  → If FAIL: STOP → produce remediation report → exit
  → If PASS: continue
- [ ] STEP 4: GATE 3 — Route to evidence truth gate (receives Gate 1 + 2 verdicts)
  → If FAIL: STOP → produce remediation report → exit
  → If PASS: unified verdict
- [ ] STEP 5: VERDICT — Render unified PASS/FAIL with evidence summary
- [ ] STEP 6: REMEDIATION — If any gate failed, produce structured fix plan
```

### STEP 1: Prepare

Identify what to validate:

- **Target artifacts:** Specific files, modules, or phase directories to check
- **Gate context:** code-review | phase-audit | milestone-verification | deployment-readiness
- **Prior gate results:** If resuming from a failed gate, load previous verdicts

### STEP 2: Gate 1 — Lifecycle / Structure

Route to the lifecycle gate. Provide:
- Target artifacts (file paths)
- Gate context
- Any prior phase context (plan, architecture docs)

**On PASS:** Record verdict. Continue to Gate 2.
**On FAIL:** Record failure mode. Skip Gates 2-3. Produce remediation report.

### STEP 3: Gate 2 — Spec Compliance

Route to the spec compliance gate. Provide:
- Target artifacts
- Gate 1 verdict
- Specification or requirements document for traceability

**On PASS:** Record verdict. Continue to Gate 3.
**On FAIL:** Record failure mode (gap type, missing criteria). Skip Gate 3. Produce remediation report.

### STEP 4: Gate 3 — Evidence Truth

Route to the evidence truth gate. Provide:
- Target artifacts
- Gate 1 + 2 verdicts
- Implementation evidence (test results, runtime output, deployment artifacts)

**On PASS:** Record verdict. All three gates clear.
**On FAIL:** Record failure mode (insufficient evidence, mock detection). Produce remediation report.

### STEP 5: Verdict

Render a unified verdict:

| Outcome | Condition | Report |
|---------|-----------|--------|
| **PASS** | All required gates PASS | Summary: lifecycle ✅ spec ✅ evidence ✅ |
| **FAIL** | Any gate FAILS | Detailed remediation with gate-specific fixes |
| **PARTIAL** | Gate halted mid-execution | Context: which gate, why halted, what to resume |

### STEP 6: Remediation

If any gate failed, produce a structured remediation report:

```markdown
## Gate Remediation Report

**Failed Gate:** [Gate 1/2/3]
**Failure Mode:** [structure-breach / spec-gap / evidence-insufficient]
**Affected Artifacts:** [list]
**Remediation Steps:**
1. [specific fix action — what to change and why]
2. [specific fix action]
**Re-run:** Re-run full pipeline from Gate 1 after fixes applied
```

## Evidence Hierarchy

Classify every evidence claim into exactly one level:

| Level | Source | Example | Gates This Satisfies |
|-------|--------|---------|---------------------|
| **L1** | Live runtime session | Feature exercised in real environment | Gate 3 (terminal) |
| **L2** | Continuity/execution record | Session log from actual run | Gates 2-3 |
| **L3** | Integration test (real boundaries) | Test hitting actual SDK/DB/network | Gates 1-3 |
| **L4** | Unit test (mocked boundaries) | Test with mocked dependencies | Gates 1-2 only |
| **L5** | Documentation/summary | Specs, design docs, conversation summaries | Gate 1 only |

**L5 alone never passes Gate 3.** Documentation is not runtime proof.

### Gate Type → Minimum Evidence Level

| Gate Type | Minimum Level | Required Evidence |
|-----------|---------------|-------------------|
| PR review | L3 | Integration tests hitting real boundaries |
| Phase completion | L2 | Continuity record from real run |
| Merge | L2 | Continuity record from real run |
| Milestone completion | L2 + one L1 | Continuity record + at least one live session |
| Release/deployment | L1 | Live runtime proof required |

## PASS/FAIL Routing Logic

```
START
  │
  ├─ Gate 1 (Lifecycle)
  │    ├─ PASS → Gate 2
  │    └─ FAIL → STOP: Fix structure first. Remediation: move files, fix boundaries.
  │
  ├─ Gate 2 (Spec)
  │    ├─ PASS → Gate 3
  │    └─ FAIL → STOP: Fix spec gaps. Remediation: add traceability, fill gaps.
  │
  ├─ Gate 3 (Evidence)
  │    ├─ PASS → ALL GATES CLEAR
  │    └─ FAIL → STOP: Strengthen evidence. Remediation: run live tests, remove mocks.
  │
  └─ ALL CLEAR → Merge/Release/Deploy
```

**HALT rule:** If any gate returns FAIL, stop the pipeline. Do NOT proceed to the next gate. Every gate failure must be remediated before re-running.

## Remediation Routing

Route failed gates to appropriate fix workflows:

| Failure Type | Fix Route | Action |
|-------------|-----------|--------|
| Structure/Lifecycle | Refactor workflow | Move files, fix architecture boundaries |
| Spec gap (missing requirement) | Spec authoring | Add requirements, recreate acceptance criteria |
| Spec gap (vague criteria) | Spec clarification | Make criteria falsifiable and measurable |
| Evidence insufficient | Test authoring | Write integration tests, capture runtime proof |
| Mock-only evidence | Test hardening | Replace mocks with real boundary tests |
| Self-contradicting evidence | Root-cause investigation | Resolve conflict, fix failing check |

## Self-Correction

### Anti-Pattern 1: Skipped Gate

**Detection:** Pipeline completes with fewer gates than the decision matrix requires.
**Correction:** Re-run from the skipped gate. Document why the skip occurred. Gate skipping is only valid when the decision matrix explicitly allows it.

### Anti-Pattern 2: Wrong Order

**Detection:** Gate 2 or Gate 3 runs before Gate 1, or Gate 3 runs before Gate 2.
**Correction:** Discard results. Restart from Gate 1. Ordering is mandatory because each gate's evidence feeds the next.

### Anti-Pattern 3: Mock as Evidence

**Detection:** Gate 3 reports L1/L2 evidence but investigation reveals mocked data flows.
**Correction:** Do not lower the evidence level. Mark as FAIL with remediation: "Replace mock with live integration test or runtime proof."

### Anti-Pattern 4: Gate Shopping

**Detection:** Pipeline stops at a failed gate, then the caller tries to re-run only the passing gates while skipping the failed one.
**Correction:** All required gates MUST pass. A failed gate means the work is not ready. Fix the failure, then re-run the full pipeline from Gate 1.

### Anti-Pattern 5: Evidence Level Inflation

**Detection:** L4 unit test claimed as L3 integration evidence. L2 continuity record claimed as L1 live proof.
**Correction:** Classify evidence honestly. When evidence is ambiguous, classify at the lower level. Never upgrade evidence level without corresponding runtime proof.

### Anti-Pattern 6: Documentation-Only Gate Pass

**Detection:** All three gates pass but the only evidence is L5 documentation.
**Correction:** Gate 3 (evidence truth) must have real runtime proof. Documentation summarization is never sufficient for Gate 3. If no runtime evidence exists, Gate 3 FAILS.

## Boundary Rules

| Nearby Domain | Boundary |
|---------------|----------|
| **Coordination / Dispatch** | Gate orchestration sequences checks. Coordination dispatches subagents. Do not mix — this skill does not teach multi-agent coordination. |
| **Completion Detection** | Gate orchestration verifies quality. Completion detection verifies tasks are done. Distinct concerns — do not conflate. |
| **Individual Gate Execution** | This skill routes TO gates. Each gate skill operates independently. Do not inline gate logic here. |
| **Gate Authoring** | This skill orchestrates existing gates. Creating new gate definitions is a separate concern. |

## Cross-References

| Reference | Purpose |
|-----------|---------|
| `references/terminology-map.md` | Gate concepts across GSD, Hivemind, and general frameworks |
| `references/philosophy.md` | Why triad order matters, evidence hierarchy rationale |

## Usage Protocol

When an agent or workflow needs to validate work through quality gates:

1. Load this skill (`quality-gate-orchestration`)
2. Determine gate context using the decision matrix
3. Follow the 6-step pipeline in strict order
4. Route to individual gate skills for each gate check
5. Return unified verdict to the calling workflow
6. If any gate failed, provide structured remediation routing

## Hivemind Tooling Alignment

This skill aligns with Hivemind's custom toolings. The loading agent should declare:

```yaml
tools:
  - hivemind-doc
  - delegate-task
  - configure-primitive
```

### Cross-References

- Routing: `hm-coord-router` (intent classification)
- Coordination: `hm-coord-loop` (multi-agent dispatch)
- Governance: `hivemind-power-on` (load first)
- Quality gates: `hm-gate-triad` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed.
