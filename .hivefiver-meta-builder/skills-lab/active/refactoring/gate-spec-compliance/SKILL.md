---
name: gate-spec-compliance
description: >
  Spec compliance gate performing bidirectional traceability, gap detection (4 types),
  EARS acceptance criteria validation, and anti-pattern scanning. Use during code review
  gates, phase audits, milestone verification, and deployment readiness. Routes to
  gate-evidence-truth on PASS; STOPS with gap report on FAIL.
  Triggers on: "spec compliance", "verify against spec", "gap analysis", "compliance gate",
  "phase audit gate", "acceptance criteria check", "spec-to-code", "deployment readiness".
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  classification: internal-quality-gate
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Gate: Spec Compliance

## Overview

Internal quality gate that evaluates whether built implementations match their specifications. Operates within the Hivemind gate chain: receives from `gate-lifecycle-integration` after lifecycle check passes; routes to `gate-evidence-truth` on PASS or STOPS with implementation gap on FAIL.

Applies contextual perspective activation — selects PM, Architect, or Dev lenses based on the gate context (code review, phase audit, milestone verification, integration check, deployment readiness).

## On Load

1. Read `references/evaluation-checklist.md` — per-dimension audit criteria
2. Read `references/perspective-rubrics.md` — contextual activation rules and rubrics
3. Read `references/anti-patterns.md` — seven lethal anti-patterns to detect
4. Read `references/adopted-patterns.md` — DO-178C traceability, EARS templates, falsifiable AC patterns

## Do NOT Load

Skip this skill when:

- Performing implementation work (not a gate/audit workflow)
- No SPEC.md exists for the current phase — route to `hm-spec-driven-authoring` instead
- Running research or exploration workflows (not verification)
- The calling workflow has not passed `gate-lifecycle-integration` yet

## Entry Gate

Proceed only when these preconditions hold:

- SPEC.md (or equivalent specification) exists and contains falsifiable requirements
- Implementation artifacts exist (code files, modules, or deployable units)
- The calling workflow provides gate context (code-review, phase-audit, milestone-verification, integration-check, or deployment-readiness)

Block and return if SPEC.md has no falsifiable requirements — route to `hm-spec-driven-authoring` to lock requirements first.

## Core Evaluation Workflow

Execute this decision tree. Every node must produce evidence; do not skip nodes.

```text
START
  ├─ [1] Does SPEC.md have falsifiable requirements?
  │    └─ NO → BLOCK: route to hm-spec-driven-authoring
  ├─ [2] Each requirement maps to PLAN.md task?
  │    └─ NO → GAP: spec-without-plan
  ├─ [3] Each plan task maps to code artifact?
  │    └─ NO → GAP: plan-without-code
  ├─ [4] Each requirement maps to test case?
  │    └─ NO → GAP: spec-without-test
  ├─ [5] All tests pass?
  │    └─ NO → FAIL: failing tests block compliance
  ├─ [6] No orphan code (code without spec origin)?
  │    └─ NO → WARNING: code-without-spec (document, do not block)
  ├─ [7] Acceptance criteria all met?
  │    └─ NO → FAIL: incomplete acceptance
  └─ PASS → route to gate-evidence-truth
```

## Contextual Perspective Activation

Activate evaluation lenses based on gate context. Load `references/perspective-rubrics.md` for full rubrics.

| Context | Primary Lens | Secondary Lens | Emphasis |
|---------|-------------|----------------|---------|
| Code review | Dev | Architect | Interface contracts, testability |
| Phase audit | Architect | PM | Traceability, gap analysis |
| Milestone verification | PM | Architect | Deliverable completeness, scope retention |
| Integration check | Architect | Dev | Behavioral compliance, interface matching |
| Deployment readiness | All three | — | Full compliance verification |

Activation rules:
1. Identify gate context from the calling workflow or command.
2. Load primary lens rubric; apply secondary lens for cross-checks.
3. For deployment readiness, apply all three lenses sequentially.
4. Record which lens produced each finding.

## Gap Detection Algorithm

Detect four gap types using bidirectional sweeps:

| Gap Type | Severity | Detection Method |
|----------|----------|-----------------|
| SPEC-WITHOUT-CODE | HIGH | Forward sweep: each SPEC requirement → grep for implementation artifact |
| CODE-WITHOUT-SPEC | MEDIUM | Backward sweep: each code file → check for SPEC requirement origin |
| SPEC-WITHOUT-TEST | HIGH | Forward sweep: each SPEC requirement → grep for test case |
| TEST-WITHOUT-SPEC | LOW | Backward sweep: each test case → check for SPEC requirement linkage |

Execution:
1. Parse SPEC.md into requirement list (REQ-ID, description, source section).
2. Parse PLAN.md into task list (task ID, requirement ref, code file refs).
3. Forward sweep: for each REQ-ID, find corresponding code artifact and test case.
4. Backward sweep: for each code file, find corresponding REQ-ID.
5. Produce gap matrix using `references/traceability-matrix-template.md`.

## EARS Acceptance Criteria Validation

Validate acceptance criteria against EARS (Easy Approach to Requirements Syntax) templates:

| EARS Type | Pattern | Example |
|-----------|---------|---------|
| Ubiquitous | "The system shall response" | "The system shall persist delegation records to disk" |
| State-driven | "While precondition, the system shall response" | "While session is active, the system shall queue tasks" |
| Event-driven | "When trigger, the system shall response" | "When delegation completes, the system shall emit notification" |
| Unwanted | "If trigger, then the system shall response" | "If context budget exceeds 70%, then the system shall warn" |
| Optional | "Where feature, the system shall response" | "Where bun-pty is available, the system shall use PTY integration" |
| Complex | "While precondition, when trigger, the system shall response" | "While in auto-loop, when a task fails 3 times, the system shall escalate" |

For each acceptance criterion, verify:
- GIVEN: precondition state is observable
- WHEN: trigger/action is testable
- THEN: expected outcome is measurable
- MEASURE: verification method exists
- PASS: specific pass criteria defined
- FAIL: specific fail criteria defined

Reject any AC that lacks GIVEN/WHEN/THEN/MEASURE/PASS/FAIL structure.

## Anti-Pattern Detection

Scan for seven lethal anti-patterns during evaluation. Load `references/anti-patterns.md` for full catalog.

| # | Anti-Pattern | Severity | Detection Signal |
|---|-------------|----------|-----------------|
| 1 | Coverage Theater | HIGH | High test count but shallow assertions |
| 2 | Stale Matrix | HIGH | Traceability matrix not updated in current sprint |
| 3 | Single-Source Verification | MEDIUM | Only one evidence type per requirement |
| 4 | Trust Without Evidence | CRITICAL | Claims without runnable verification |
| 5 | Measuring Without Acting | MEDIUM | Gap reports exist but no fix commits |
| 6 | Orphan Artifact Drift | HIGH | SPEC updated but PLAN/TEST not regenerated |
| 7 | Self-Certification | CRITICAL | Implementer verifies own work without independent review |

Detection method: grep for evidence patterns, check file timestamps, verify cross-references exist.

## Cross-Skill Routing

```text
gate-lifecycle-integration ──PASS──→ gate-spec-compliance (this skill)
                                        │
                                        ├─ PASS → gate-evidence-truth
                                        └─ FAIL → STOP
                                              │
                                              └─ Produce gap report using
                                                 templates/compliance-report.md
```

| Route | Condition | Action |
|-------|-----------|--------|
| Incoming | `gate-lifecycle-integration` passes | Begin evaluation |
| Pass | All 7 decision nodes pass | Route to `gate-evidence-truth` |
| Fail | Any HIGH/CRITICAL gap found | STOP, produce gap report |
| Block | No SPEC or no implementation | Return blocked state |
| Warning | CODE-WITHOUT-SPEC only | Document and continue |

## Boundary Rules

| Nearby Skill | Boundary |
|-------------|----------|
| `hm-spec-driven-authoring` | Authors requirements and acceptance criteria. This skill verifies they are met. |
| `gate-lifecycle-integration` | Precedes this gate. This skill receives only after lifecycle check passes. |
| `gate-evidence-truth` | Succeeds this gate. Receives only after spec compliance passes. |
| `hm-test-driven-execution` | Executes RED/GREEN/REFACTOR. This skill checks the result, not the process. |
| `hm-completion-looping` | Loops until completion. This skill provides the compliance predicates for that loop. |

## Bundled Resource Map

| Resource | Purpose |
|----------|---------|
| `references/evaluation-checklist.md` | Per-dimension audit criteria |
| `references/perspective-rubrics.md` | PM/Architect/Dev contextual rubrics |
| `references/anti-patterns.md` | Seven lethal anti-patterns with detection methods |
| `references/adopted-patterns.md` | DO-178C traceability, EARS templates, Trail of Bits patterns |
| `references/traceability-matrix-template.md` | GSD-specific RTM template with V-Model mapping |
| `evals/evals.json` | Test scenarios and assertions |
| `templates/compliance-report.md` | Standardized spec compliance report |
| `scripts/run-compliance-check.sh` | Deterministic compliance checker script |

## Exit Criteria

The skill completes when one of:

- **PASS**: All 7 decision nodes pass. Route to `gate-evidence-truth` with evidence bundle.
- **FAIL**: Any HIGH/CRITICAL gap detected. STOP and produce gap report using `templates/compliance-report.md`.
- **BLOCK**: No specification or no implementation exists. Return blocked state with exact missing artifact.

Do not claim PASS if any requirement lacks traceability, any acceptance criterion is untestable, or any HIGH-severity gap is unresolved.

## Self-Correction

### When SPEC and implementation disagree

Check which is authoritative: if SPEC was locked before implementation began, the implementation must conform. If implementation was built first, flag as spec-first violation and recommend retroactive spec authoring. Never silently modify SPEC to match implementation.

### When gap detection finds only warnings

CODE-WITHOUT-SPEC gaps are MEDIUM severity. Document them in the compliance report but do not block PASS. Flag for architectural review to determine if the orphan code serves an undocumented requirement or should be removed.

### When acceptance criteria are vague

Reject the AC and flag the requirement as `blocked`. Do not invent precision — route back to `hm-spec-driven-authoring` for AC re-derivation. A vague AC is worse than a missing AC because it creates false confidence.

### When tests pass but behavior differs from spec

Run behavioral compliance check: compare actual runtime output against SPEC success criteria. Test pass != spec compliance. Tests may assert wrong behavior. Trust the spec over the test when they conflict, and flag the test for correction.

## Integration Wiring

| Surface | Contract |
|---------|----------|
| Agents | Agents using this skill must state their gate context (code-review, phase-audit, milestone-verification, integration-check, deployment-readiness). Subagents receive SPEC path, code paths, and gate context. |
| Commands | Commands must provide SPEC path, code root, and gate context. Quote all paths. No interactive prompts. |
| Tools | Use `prompt-skim` for SPEC shape analysis. Use `prompt-analyze` for ambiguity detection. Use `session-patch` for bounded artifact updates. |
| Plugin hooks | Hooks may trigger this skill during phase transitions. Hooks report compliance facts; they do not modify specifications. |
| Runtime state | Persist gate result, gap matrix, and compliance verdict in project planning state. In Hivemind sessions, store in continuity/lifecycle records. |
