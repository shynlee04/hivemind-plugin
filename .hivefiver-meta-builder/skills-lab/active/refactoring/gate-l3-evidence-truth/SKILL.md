---
name: gate-l3-evidence-truth
description: >
  Evaluates whether implementation evidence is sufficient to pass quality gates. Enforces an
  evidence hierarchy from live runtime proof (L1) down to documentation summaries (L5), and
  refuses gate passage when evidence is missing, mocked where integration is claimed, or
  insufficient for the gate type. Use during code review gates, phase audits, milestone
  verification, integration checks, and deployment readiness. Activates after gate-spec-compliance
  clears spec alignment — this is the terminal gate in the triad (lifecycle → spec → evidence).
  Triggers: "evidence check", "gate evidence", "verify runtime proof", "evidence truth",
  "is there proof this works", "evidence hierarchy", "gate truth", "runtime evidence",
  "integration evidence", "mock-only detection", "completion honesty", "gate passed",
  "gate failed". Terminal skill in the quality gate triad — if evidence PASSES, all 3 gates clear.
metadata:
  layer: "3"
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

See `references/evaluation-workflow-detail.md` for detailed step procedures, mock detection commands, and classification guidance.

## Cross-Skill Routing

### Triad Flow (lifecycle → spec → evidence)

```
gate-lifecycle-integration (ENTRY — checks lifecycle correctness)
    ↓ PASS
gate-spec-compliance (MIDDLE — checks spec alignment)
    ↓ PASS
gate-evidence-truth ← YOU ARE HERE (TERMINAL)
    ↓
    ├─ PASS → ALL 3 GATES CLEAR → proceed to merge/release
    └─ FAIL → STOP → produce remediation plan → route to appropriate fix skill
```

Triad backward references, evidence collection handoff from `hm-production-readiness`, and full remediation routing are in `references/cross-skill-routing-detail.md`.

### Related Skills

| Related Skill | Role | Interaction |
|---------------|------|-------------|
| `gate-lifecycle-integration` | Entry gate | Must pass before spec compliance runs |
| `gate-spec-compliance` | Middle gate | Routes to this gate on PASS |
| `hm-production-readiness` | Evidence collector | Feeds structured L1-L5 evidence into this gate |
| `hm-cross-cutting-change` | Mock honesty | Remediation target for mock-only failures |
| `hm-debug` | Root-cause investigation | Remediation for insufficient evidence level |
| `hm-completion-looping` | Loop-back control | Uses this gate's verdict for loop-back decisions |
| `hm-coordinating-loop` | Orchestration re-dispatch | Re-dispatches when evidence or regression gaps found |
| `hm-gate-orchestrator` | Triad lifecycle manager | Orchestrates triad sequencing, state persistence, cross-gate handoff |

## Adopted Patterns

Synthesizes three proven methodologies: **Anthropic Gather→Act→Verify**, **Google Testing Pyramid (70-20-10)**, **GRADE Evidence Framework**. See `references/adopted-patterns.md` for full synthesis.

## Self-Correction

### Mode 1: When No Evidence Exists

Do not downgrade the gate minimum. Report FAIL with explicit instructions: "Produce [L2/L1] evidence by [running integration test / capturing live session / verifying in OpenCode instance]."

### Mode 2: When Evidence Is Ambiguous

Classify at the lower level. A test that mocks some but not all SDK boundaries is L4, not L3. A continuity record that may or may not be from a live session is L5, not L2.

### Mode 3: When the User Overrides

Document the waiver in the evidence report with: which gate failed, what evidence was missing, and the user's rationale. The override must be explicit — never silently waive.

### Mode 4: When Evidence Contradicts Itself

If two artifacts provide conflicting evidence for the same claim (e.g., a passing test but a failing continuity record), treat the contradiction as a regression signal. Classify both artifacts at their individual levels, mark the claim as UNVERIFIED, and require reconciliation before rendering PASS. Never average or weight conflicting evidence — resolve the contradiction or FAIL.

## Gate Orchestrator Integration

This gate participates in the triad orchestrated by `hm-gate-orchestrator`. The orchestrator manages triad sequencing, state persistence, and cross-gate handoff. When invoked within an orchestrator workflow, this skill receives a pre-built evidence bundle and returns a structured verdict. See `hm-gate-orchestrator` for full triad lifecycle management.

## Reference Files

| File | Content |
|------|---------|
| `references/evaluation-checklist.md` | Per-dimension audit criteria |
| `references/evaluation-workflow-detail.md` | Detailed STEPS 1-8 procedures and detection commands |
| `references/cross-skill-routing-detail.md` | Triad backward refs, evidence handoff, remediation routing |
| `references/perspective-rubrics.md` | PM/Architect/Dev rubrics with contextual activation |
| `references/anti-patterns.md` | Full anti-pattern catalog with severity and detection |
| `references/adopted-patterns.md` | Synthesized patterns from Anthropic, Google, GRADE |
| `references/harness-verification-trees.md` | Module-specific verification trees |
| `templates/evidence-report.md` | Standardized report template |
| `scripts/run-evidence-check.sh` | Deterministic evidence classification checker |
| `metrics/rich-gate-scorecard.md` | RICH-8 quality scorecard |
| `evals/evals.json` | Test scenarios for this skill |
