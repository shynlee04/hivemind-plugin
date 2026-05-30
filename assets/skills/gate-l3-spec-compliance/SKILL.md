---
name: gate-l3-spec-compliance
description: >
  Spec compliance gate performing bidirectional traceability, gap detection (4 types),
  EARS acceptance criteria validation, and anti-pattern scanning. Use during code review
  gates, phase audits, milestone verification, and deployment readiness. Middle gate in
  the quality triad (lifecycle → spec → evidence). Routes to gate-evidence-truth on PASS;
  STOPS with gap report on FAIL. Includes remediation routing to hm-spec-driven-authoring,
  hm-test-driven-execution, and hm-debug for fix workflows.
  Triggers on: "spec compliance", "verify against spec", "gap analysis", "compliance gate",
  "phase audit gate", "acceptance criteria check", "spec-to-code", "deployment readiness",
  "triad gate", "spec gate middle", "quality triad".
metadata:
  layer: "3"
  role: "domain-execution"
  pattern: P2
  version: "1.1.0"
  classification: internal-quality-gate
  triad-position: middle
  triad-siblings: [gate-lifecycle-integration, gate-evidence-truth]
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

Internal quality gate evaluating whether implementations match specifications. **Middle gate** in the quality triad (lifecycle → spec → evidence). Receives from `gate-lifecycle-integration` after lifecycle check passes; routes to `gate-evidence-truth` on PASS, STOPS with gap report on FAIL. Uses contextual perspective activation (PM, Architect, or Dev lenses) based on gate context.

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## On Load

1. Read `references/evaluation-checklist.md` — per-dimension audit criteria
2. Read `references/perspective-rubrics.md` — contextual activation rules and rubrics
3. Read `references/anti-patterns.md` — seven lethal anti-patterns to detect
4. Read `references/adopted-patterns.md` — EARS templates, gap detection algorithm, falsifiable AC patterns

## Do NOT Load / Preconditions

Skip when: performing implementation (not gate/audit), no SPEC.md exists (route to `hm-spec-driven-authoring`), running research/exploration, or `gate-lifecycle-integration` hasn't passed yet.

Entry preconditions: SPEC.md with falsifiable requirements exists, implementation artifacts exist, calling workflow provides gate context (code-review, phase-audit, milestone-verification, integration-check, deployment-readiness). Block and return if SPEC.md lacks falsifiable requirements.

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

## Gap Detection

Four gap types detected via bidirectional sweeps (full algorithm in `references/adopted-patterns.md` Pattern 4):

- **SPEC-WITHOUT-CODE** (HIGH, blocks PASS) — forward sweep: each REQ-ID → grep for implementation
- **CODE-WITHOUT-SPEC** (MEDIUM, document only) — backward sweep: each code file → check REQ-ID origin
- **SPEC-WITHOUT-TEST** (HIGH, blocks PASS) — forward sweep: each REQ-ID → grep for test case
- **TEST-WITHOUT-SPEC** (LOW, document only) — backward sweep: each test → check REQ-ID linkage

Produce gap matrix using `references/traceability-matrix-template.md`.

## EARS Acceptance Criteria Validation

Validate each AC against EARS templates (full catalog in `references/adopted-patterns.md` Pattern 2). Each AC must satisfy the GIVEN/WHEN/THEN/MEASURE/PASS/FAIL structure. Reject any AC missing these fields. EARS types: Ubiquitous, State-driven, Event-driven, Unwanted, Optional, Complex — match each AC to at least one type and verify all placeholders contain specific, measurable content.

## Anti-Pattern Detection

Scan for seven lethal anti-patterns (full catalog with detection methods in `references/anti-patterns.md`). Critical/High patterns block PASS; Medium patterns require documentation. Key signals: coverage theater (high count, shallow assertions), trust without evidence (claims without runnable verification), orphan artifact drift (SPEC updated but PLAN/TEST not regenerated), self-certification (implementer verifies own work).

## Cross-Skill Routing

```text
gate-lifecycle-integration ──PASS──→ gate-spec-compliance (this skill)
                                        ├─ PASS → gate-evidence-truth
                                        └─ FAIL → STOP (produce gap report via templates/compliance-report.md)
```

| Route | Condition | Action |
|-------|-----------|--------|
| Incoming | `gate-lifecycle-integration` passes | Begin evaluation |
| Pass | All 7 decision nodes pass | Route to `gate-evidence-truth` |
| Fail | Any HIGH/CRITICAL gap found | STOP, produce gap report |
| Block | No SPEC or no implementation | Return blocked state |
| Warning | CODE-WITHOUT-SPEC only | Document and continue |

## Remediation Routing (on FAIL)

| Failure Condition | Route To |
|-------------------|----------|
| No SPEC or non-falsifiable requirements | `hm-spec-driven-authoring` |
| SPEC-WITHOUT-CODE (HIGH) | `hm-spec-driven-authoring` (review spec → update plan) |
| SPEC-WITHOUT-TEST (HIGH) | `hm-test-driven-execution` (RED/GREEN/REFACTOR) |
| CODE-WITHOUT-SPEC (MEDIUM) | Architectural review (remove or document) |
| Vague acceptance criteria | `hm-spec-driven-authoring` (re-derive ACs) |
| Coverage Theater (AP-01) | `hm-test-driven-execution` (deepen assertions) |
| Self-Certification (AP-07) | Independent reviewer (re-run gate with different agent) |
| Behavioral mismatch (tests pass ≠ spec) | `hm-debug` (investigate assertion vs spec conflict) |
| Requirement gap (unclear spec) | `hm-requirements-analysis` or human clarification |
| All remediation exhausted | Human (escalate with gap report) |

On successful remediation, re-run full triad: `gate-lifecycle-integration` → this gate → `gate-evidence-truth`.

## Boundary Rules

| Nearby Skill | Boundary |
|-------------|----------|
| `hm-spec-driven-authoring` | Authors requirements/ACs. This skill verifies they are met. |
| `gate-lifecycle-integration` | Precedes this gate. Receives only after lifecycle check passes. |
| `gate-evidence-truth` | Succeeds this gate. Receives only after spec compliance passes. |
| `hm-test-driven-execution` | Executes RED/GREEN/REFACTOR. This skill checks the result. |
| `hm-completion-looping` | Loops until completion. This skill provides compliance predicates. |

## Bundled Resource Map

| Resource | Purpose |
|----------|---------|
| `references/evaluation-checklist.md` | Per-dimension audit criteria |
| `references/perspective-rubrics.md` | PM/Architect/Dev contextual rubrics |
| `references/anti-patterns.md` | Seven lethal anti-patterns with detection methods |
| `references/adopted-patterns.md` | DO-178C traceability, EARS templates, gap detection algorithm |
| `references/traceability-matrix-template.md` | GSD-specific RTM template with V-Model mapping |
| `templates/compliance-report.md` | Standardized spec compliance report |
| `metrics/rich-gate-scorecard.md` | RICH-8 skill-judge scorecard |
| `evals/evals.json` | Test scenarios for this skill |
| `scripts/run-compliance-check.sh` | Deterministic compliance checker script |

## Exit Criteria

The skill completes when one of:

- **PASS**: All 7 decision nodes pass. Route to `gate-evidence-truth` with evidence bundle.
- **FAIL**: Any HIGH/CRITICAL gap detected. STOP and produce gap report using `templates/compliance-report.md`.
- **BLOCK**: No specification or no implementation exists. Return blocked state with exact missing artifact.

Do not claim PASS if any requirement lacks traceability, any acceptance criterion is untestable, or any HIGH-severity gap is unresolved.

## Self-Correction

- **SPEC vs implementation disagree:** If SPEC was locked first, implementation must conform. If implementation came first, flag spec-first violation and recommend retroactive spec authoring. Never silently modify SPEC to match implementation.
- **Only warnings found:** CODE-WITHOUT-SPEC (MEDIUM) — document in compliance report but do not block PASS. Flag for architectural review.
- **Vague acceptance criteria:** Reject and flag as `blocked`. Do not invent precision — route to `hm-spec-driven-authoring` for re-derivation. A vague AC is worse than missing AC (creates false confidence).
- **Tests pass but behavior differs from spec:** Compare runtime output against SPEC success criteria. Test pass != spec compliance. Trust spec over test when they conflict; flag test for correction.

## Gate Orchestrator Integration

This gate participates in the triad orchestrated by `hm-gate-orchestrator`. The orchestrator manages triad sequencing, state persistence, and cross-gate handoff. When invoked within an orchestrator workflow, this skill is the MIDDLE gate. It receives a lifecycle-passed context from the orchestrator and returns a structured compliance verdict. See `hm-gate-orchestrator` for full triad lifecycle management.

## Integration Wiring

| Surface | Contract |
|---------|----------|
| Agents | Must state gate context. Subagents receive SPEC path, code paths, and gate context. |
| Commands | Must provide SPEC path, code root, and gate context. Quote all paths. No interactive prompts. |
| Tools | `prompt-skim` for SPEC shape, `prompt-analyze` for ambiguity, `session-patch` for bounded updates. |
| Hooks | May trigger during phase transitions. Report compliance facts only — never modify specifications. |
| Runtime state | Persist gate result, gap matrix, and compliance verdict in planning state or continuity records. |
