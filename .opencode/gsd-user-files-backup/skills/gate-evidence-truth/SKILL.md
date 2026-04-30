---
name: gate-evidence-truth
description: >
  Evaluates whether implementation evidence is sufficient to pass quality gates. Enforces an
  evidence hierarchy from live runtime proof (L1) down to documentation summaries (L5), and
  refuses gate passage when evidence is missing, mocked where integration is claimed, or
  insufficient for the gate type. Use during code review gates, phase audits, milestone
  verification, integration checks, and deployment readiness. Activates after gate-spec-compliance
  clears spec alignment — this is the terminal gate in the triad (spec → lifecycle → evidence).
  Triggers: "evidence check", "gate evidence", "verify runtime proof", "evidence truth",
  "is there proof this works", "evidence hierarchy", "gate truth", "runtime evidence",
  "integration evidence", "mock-only detection", "completion honesty", "gate passed",
  "gate failed". Terminal skill in the quality gate triad — if evidence PASSES, all 3 gates clear.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  triad-position: terminal
  triad-siblings: [gate-spec-compliance, gate-lifecycle-integration]
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
No gate passes on documentation alone. Evidence must be classified, honest, and runtime-verified.
```

# Gate Evidence Truth

Terminal gate in the quality-gate triad. Receives from `gate-spec-compliance` after spec alignment clears. If evidence truth PASSES, all three gates (spec, lifecycle, evidence) are satisfied and work may proceed to merge/release.

## On Load

1. Read `references/evaluation-checklist.md` — per-dimension audit criteria
2. Read `references/anti-patterns.md` — known evidence anti-patterns and detection
3. Read `references/harness-verification-trees.md` — module-specific verification protocols

## Do NOT Load

Skip this skill when:

- Performing spec alignment checks — use `gate-spec-compliance` instead
- Checking lifecycle coverage — use `gate-lifecycle-integration` instead
- Running research or exploration workflows (not gate verification)
- The calling workflow has not passed `gate-spec-compliance` yet
- No implementation artifacts exist to evaluate

## Evidence Hierarchy

Classify every evidence artifact into exactly one level:

| Level | Source | Example |
|-------|--------|---------|
| **L1** | Live OpenCode runtime session | Feature exercised in actual OpenCode instance |
| **L2** | Continuity record from live run | Delegation/session record captured from real execution |
| **L3** | Integration test passing | Tests hitting real SDK boundaries (not mocked) |
| **L4** | Unit test passing | Tests that mock SDK boundaries |
| **L5** | Documentation/historical summary | Specs, design docs, conversation summaries |

**L5 alone never passes any gate.**

## Gate Type → Minimum Evidence Level

| Gate Type | Minimum Level | Required Evidence |
|-----------|---------------|-------------------|
| PR review | L3 | At least integration tests hitting real boundaries |
| Phase completion | L2 | Continuity record from real run |
| Merge | L2 | Continuity record from real run |
| Milestone completion | L2 + one L1 | Continuity record plus at least one live session proof |
| Release/deployment | L1 | Live runtime proof required |

## Contextual Perspective Activation

Determine the current context, then activate the appropriate evaluation lens:

| Context | Primary Lens | Secondary Lens | Emphasis |
|---------|-------------|----------------|---------|
| Code review | Dev | Architect | Test integrity, mock coverage |
| Phase audit | Architect | PM | Evidence hierarchy compliance, regression |
| Milestone verification | PM | Architect | Runtime proof, completion honesty |
| Integration check | Architect | Dev | Live verification, cross-boundary testing |
| Deployment readiness | All three | — | Full evidence verification across all dimensions |

Load `references/perspective-rubrics.md` for per-lens evaluation criteria.

## Core Evaluation Workflow

Follow this checklist in order:

```
- [ ] STEP 1: GATHER — Collect all evidence artifacts for the claim
- [ ] STEP 2: CLASSIFY — Assign L1–L5 to each artifact using evidence hierarchy
- [ ] STEP 3: CHECK MINIMUM — Does highest evidence level meet gate-type minimum?
- [ ] STEP 4: DETECT MOCKS — Any mock-only claims for integration surfaces?
- [ ] STEP 5: CHECK COMPLETION HONESTY — Any completion claims without backing evidence?
- [ ] STEP 6: REGRESSION CHECK — Any cross-phase regression risk from dependency graph?
- [ ] STEP 7: ANTI-PATTERN SCAN — Match evidence against anti-pattern catalog
- [ ] STEP 8: VERDICT — Render PASS or FAIL with remediation plan
```

### STEP 1: GATHER

Identify the gate type. Collect all artifacts that claim to prove the implementation works: test results, continuity records, live session logs, design docs, conversation summaries. Include negative evidence (failing tests, missing records).

### STEP 2: CLASSIFY

Map each artifact to its evidence level. Be conservative: if a test mocks an SDK boundary, classify as L4 regardless of the test name. If a continuity record references a real session with actual dispatch, classify as L2. If a developer ran the feature in OpenCode and captured output, classify as L1.

Run `scripts/run-evidence-check.sh <module-path>` to automate mock pattern detection and continuity record scanning. If the script is unavailable, manually grep for mock patterns (`vi.mock(`, `jest.mock(`, `sinon.stub(`) and classify evidence using the hierarchy table above.

### STEP 3: CHECK MINIMUM

Compare highest evidence level against gate-type minimum from the table above. If insufficient, verdict is FAIL with the specific gap documented.

### STEP 4: DETECT MOCKS

Scan test files for patterns indicating mocked SDK boundaries:

- `vi.mock(`, `jest.mock(`, `sinon.stub(` — SDK boundary mocks
- Test names containing "integration" but mocking external calls
- Import paths that mock `src/lib/session-api.ts`, `src/lib/continuity.ts`, or `src/lib/delegation-manager.ts`

Load `references/harness-verification-trees.md` for module-specific mock detection rules.

### STEP 5: CHECK COMPLETION HONESTY

Verify every "done", "complete", "working", or "verified" claim has at least one L3+ artifact backing it. Claims without evidence are dishonest by definition.

### STEP 6: REGRESSION CHECK

Using the dependency graph (`.hivemind/state/` or `src/` imports), identify modules that transitively depend on the changed module. Verify that regression tests exist for at least the direct-dependency boundary.

### STEP 7: ANTI-PATTERN SCAN

Match gathered evidence against the 7 anti-patterns in `references/anti-patterns.md`. Flag any match as a deduction in the evidence report.

### STEP 8: VERDICT

Produce an evidence truth report using `templates/evidence-report.md`. If any dimension fails, verdict is FAIL. Include remediation plan specifying what evidence is needed and how to produce it.

## Cross-Skill Routing

```
gate-spec-compliance (PASSED)
    ↓
gate-lifecycle-integration (PASSED)
    ↓
gate-evidence-truth ← YOU ARE HERE
    ↓
    ├─ PASS → ALL 3 GATES CLEAR → proceed to merge/release
    └─ FAIL → STOP → produce remediation plan → return to implementor
```

| Related Skill | Boundary |
|---------------|----------|
| `gate-spec-compliance` | Checks spec alignment before this gate runs |
| `gate-lifecycle-integration` | Checks lifecycle state machine coverage before this gate runs |
| `hm-completion-looping` | Uses this gate's verdict to determine loop-back |
| `hm-coordinating-loop` | Orchestrates re-dispatch when evidence gate fails |

## Adopted Patterns

This skill synthesizes three proven methodologies:

1. **Anthropic Gather→Act→Verify** — evidence collection, classification, gate decision
2. **Google Testing Pyramid (70-20-10)** — unit:integration:e2e ratio targets
3. **GRADE Evidence Framework** — hierarchical evidence quality classification

See `references/adopted-patterns.md` for full synthesis and rationale.

## Self-Correction

### When No Evidence Exists

If no L3+ evidence exists for the gate type, do not downgrade the gate minimum. Report FAIL with explicit instructions: "Produce [L2/L1] evidence by [running integration test / capturing live session / verifying in OpenCode instance]."

### When Evidence Is Ambiguous

If an artifact could be classified at two levels, classify at the lower level. A test that mocks some but not all SDK boundaries is L4, not L3. A continuity record that may or may not be from a live session is L5, not L2.

### When the User Overrides

If a user explicitly waives a failed evidence gate, document the waiver in the evidence report with: which gate failed, what evidence was missing, and the user's rationale. The override must be explicit — never silently waive.

## Reference Files

| File | Content |
|------|---------|
| `references/evaluation-checklist.md` | Per-dimension audit criteria |
| `references/perspective-rubrics.md` | PM/Architect/Dev rubrics with contextual activation |
| `references/anti-patterns.md` | Full anti-pattern catalog with severity and detection |
| `references/adopted-patterns.md` | Synthesized patterns from Anthropic, Google, GRADE |
| `references/harness-verification-trees.md` | Module-specific verification trees |
| `templates/evidence-report.md` | Standardized report template |
| `scripts/run-evidence-check.sh` | Deterministic evidence classification checker |
| `evals/evals.json` | Test scenarios for this skill |
