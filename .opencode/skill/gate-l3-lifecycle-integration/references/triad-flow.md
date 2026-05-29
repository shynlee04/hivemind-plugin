# Triad Flow: Lifecycle → Spec → Evidence

Inter-gate handoff contracts for the Hivemind quality gate triad. This
document defines the data flow, responsibilities, and contracts between the
three quality gates.

## Triad Architecture

```
┌─────────────────────────────┐
│  gate-lifecycle-integration │  ← ENTRY GATE (this skill)
│  "Is the structure sound?"  │
└─────────────┬───────────────┘
              │ PASS: gate report + perspective scores
              │ FAIL: STOP — fix before downstream
              ▼
┌─────────────────────────────┐
│  gate-spec-compliance       │  ← MIDDLE GATE
│  "Does it match the spec?"  │
└─────────────┬───────────────┘
              │ PASS: spec compliance report + gap analysis
              │ FAIL: STOP with gap report
              ▼
┌─────────────────────────────┐
│  gate-evidence-truth        │  ← TERMINAL GATE
│  "Is there real proof?"     │
└─────────────────────────────┘
              │ PASS: all 3 gates clear — deployable
              │ FAIL: STOP — insufficient evidence
```

## Gate Responsibilities

### gate-lifecycle-integration (ENTRY)
- **Validates:** Runtime architecture correctness
- **Dimensions:** CQRS boundaries, classification fit, actor hierarchy, OpenCode surface, size/structure
- **Output:** Gate report with perspective scores (Dev, Architect, PM) + anti-pattern findings
- **Pass Condition:** No BLOCK findings + perspective scores ≥ 3.5
- **On PASS:** Route to `gate-spec-compliance` with gate report
- **On FAIL:** STOP — route to hm-* remediation skills

### gate-spec-compliance (MIDDLE)
- **Validates:** Specification alignment
- **Dimensions:** Bidirectional traceability, gap detection (4 types), EARS criteria, anti-pattern scan
- **Input:** Receives lifecycle gate report from entry gate
- **Pass Condition:** Full spec-to-code traceability + acceptance criteria met
- **On PASS:** Route to `gate-evidence-truth` with both lifecycle and spec reports
- **On FAIL:** STOP with gap report — do not route to evidence

### gate-evidence-truth (TERMINAL)
- **Validates:** Evidence sufficiency
- **Dimensions:** Evidence hierarchy (L1-L5), mock detection, runtime proof, integration proof
- **Input:** Receives lifecycle + spec compliance reports from upstream gates
- **Pass Condition:** Evidence at required level for the gate type
- **On PASS:** Terminal state — all 3 gates clear. Deployment-ready.
- **On FAIL:** STOP — insufficient evidence. Must produce real evidence before re-attempt.

## Handoff Contract

When routing from lifecycle to spec compliance, pass these artifacts:

1. **Lifecycle Gate Report** (`templates/gate-report.md`) — filled with scores and findings
2. **Perspective Scores** — Dev, Architect, PM weighted averages
3. **Anti-Pattern Finding List** — AP-IDs found, including WARN-level
4. **Artifact List** — All files evaluated and their classifications

The downstream gate (spec-compliance) uses the artifact list and classifications
to know which artifacts to trace against specifications.

When routing from spec compliance to evidence truth, pass:

1. **Both Gate Reports** — lifecycle + spec compliance
2. **Spec Compliance Report** — traceability matrix, gap analysis
3. **Acceptance Criteria Status** — which criteria are met/unmet

## Cross-Reference: gate-spec-compliance

```
Name: gate-spec-compliance
File: .opencode/skills/gate-spec-compliance/SKILL.md
Role: Middle gate — verifies spec-to-code alignment
Receives from: gate-lifecycle-integration (this skill)
Routes to: gate-evidence-truth
```

Key integration points:
- Lifecycle classification decisions determine which spec sections apply
- Tool/hook classifications from lifecycle gate feed spec traceability
- If lifecycle FAILS, spec compliance is NOT run — structural issues first

## Cross-Reference: gate-evidence-truth

```
Name: gate-evidence-truth
File: .opencode/skills/gate-evidence-truth/SKILL.md
Role: Terminal gate — verifies evidence sufficiency
Receives from: gate-spec-compliance
Terminal on: PASS — all 3 gates clear
```

Key integration points:
- Evidence level required depends on lifecycle classification (SDK tool needs runtime proof; shared utility needs test proof)
- Anti-pattern findings from lifecycle gate feed evidence-required list
- If lifecycle or spec FAIL, evidence gate is NOT run — upstream issues first

## Triad Invariants

These rules must hold across all three gates:

1. **No skipping:** Gates run in order. Lifecycle → Spec → Evidence. Never run evidence without spec. Never run spec without lifecycle.
2. **No silent failure:** Any FAIL in any gate stops the chain. Report what failed and why.
3. **Single artifact scope:** All three gates evaluate the same set of artifacts. Classification is shared.
4. **Three-signal confirmation:** A deployable artifact has passed all three gates. Two gates passing + one failing = NOT deployable.
5. **Independent execution:** Each gate is independently loadable and runnable. They share data through gate reports, not through in-memory state.
