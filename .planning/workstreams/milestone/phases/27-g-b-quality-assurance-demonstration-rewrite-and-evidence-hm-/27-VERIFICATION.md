---
phase: 27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-
verified: 2026-04-25T12:34:33Z
status: human_needed
score: 12/12 must-haves verified by non-interactive evidence
overrides_applied: 0
human_verification:
  - test: "OpenCode trigger routing for hm-spec-driven-authoring"
    expected: "Activates for spec-to-requirement work, rejects exploratory coding, and hands locked tests to hm-test-driven-execution."
    why_human: "Runtime skill activation/model routing cannot be proven by static file checks."
  - test: "OpenCode trigger routing for hm-test-driven-execution"
    expected: "Activates for locked TDD work, rejects manual-only/test-after/ambiguous requirements, and routes ambiguity to hm-spec-driven-authoring."
    why_human: "Runtime skill activation/model routing cannot be proven by static file checks."
---

# Phase 27: G-B Quality Assurance Demonstration Verification Report

**Phase Goal:** Rewrite and evidence the first quality-assurance demonstration pair so the Phase 26 playbook becomes executable, not merely aspirational. Target skills: `hm-spec-driven-authoring` and `hm-test-driven-execution`.  
**Verified:** 2026-04-25T12:34:33Z  
**Status:** human_needed  
**Re-verification:** No — initial post-execution gate verification.

## Goal Achievement

Phase 27 achieved its static/package goal for the two target G-B skills. Both packages now contain substantive workflows, references, eval bundles, validators, and Phase 27 evidence records across HMQUAL-01 through HMQUAL-08. The only remaining verification need is live OpenCode runtime trigger routing.

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Current G-B target skill quality is scored against all eight HMQUAL dimensions before package edits begin. | ✓ VERIFIED | `27-G-B-BASELINE-SCORECARD.md` exists and references both target skills and HMQUAL-08. |
| 2 | Evidence records require current path, command, eval, reference, integration, platform, and self-correction proof instead of file existence claims. | ✓ VERIFIED | `27-G-B-EVIDENCE-SCHEMA.md` contains `dimension_scores`, `eval_bundle_status`, and `integration_wiring_notes`. |
| 3 | `hm-spec-driven-authoring` activates for spec-to-requirement work and rejects exploratory coding. | ✓ VERIFIED (static), ? HUMAN runtime | Description and evals include positive, negative, and boundary trigger cases; runtime routing remains UAT. |
| 4 | SDA body derives falsifiable requirements, acceptance criteria, verification methods, integration notes, and blocked handoffs without GSD dependency. | ✓ VERIFIED | `SKILL.md` contains Entry Gate, Spec-Lock Workflow, Requirement Extraction, Acceptance-Test Derivation, Integration Wiring, Cross-Platform Adapters, and Self-Correction; no local absolute path found. |
| 5 | SDA package includes positive, negative, boundary, and stacked eval scenarios linked to sibling skills. | ✓ VERIFIED | `evals/evals.json` parses and includes assertions plus `stacked_scenario` with `hm-test-driven-execution` and `hm-planning-with-files`. |
| 6 | `hm-test-driven-execution` activates for test-first work and rejects manual-only or test-after requests. | ✓ VERIFIED (static), ? HUMAN runtime | Description and evals include positive trigger, negative manual QA, and boundary ambiguous-requirements cases; runtime routing remains UAT. |
| 7 | TDE enforces RED, GREEN, REFACTOR, coverage verification, invalid-test handling, and runtime-truthful boundaries. | ✓ VERIFIED | `SKILL.md` contains RED/GREEN/REFACTOR gates, Runtime-Truthful Testing, Coverage Claims, Invalid RED handling, and Self-Correction. |
| 8 | TDE package includes language adapters and honest coverage fallback behavior for Node, Python, Go, and projects without coverage tooling. | ✓ VERIFIED | Coverage table includes `npm run test:coverage`, `pytest --cov`, `go test ./... -cover`, and no-coverage fallback. |
| 9 | Both G-B target skills have final D1-D8 scoring backed by current evidence. | ✓ VERIFIED | `27-G-B-FINAL-EVIDENCE.md`, `27-SDA-EVIDENCE.md`, and `27-TDE-EVIDENCE.md` list PASS for HMQUAL-01 through HMQUAL-08. |
| 10 | Positive, negative, boundary, and stacked eval scenarios are present and gradeable for both packages. | ✓ VERIFIED | Python structural eval check passed for both bundles. |
| 11 | Any non-PASS result is recorded as explicit blocker and not hidden behind quality-complete wording. | ✓ VERIFIED | Final evidence says no non-PASS cells remain and keeps blocker section explicit. |
| 12 | Phase 31 cross-lineage end-to-end validation remains excluded from Phase 27 completion. | ✓ VERIFIED | `27-G-B-FINAL-EVIDENCE.md` and `27-G-B-VERIFICATION.md` explicitly exclude Phase 31 scope. |

**Score:** 12/12 must-haves verified by non-interactive evidence.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `27-G-B-BASELINE-SCORECARD.md` | Baseline D1-D8 scoring | ✓ VERIFIED | File exists and includes both target skills/HMQUAL. |
| `27-G-B-EVIDENCE-SCHEMA.md` | Evidence record schema | ✓ VERIFIED | Required fields present. |
| `.opencode/skills/hm-spec-driven-authoring/SKILL.md` | Standalone spec-driven authoring workflow | ✓ VERIFIED | 174 lines; required sections present; no local absolute path. |
| `.opencode/skills/hm-spec-driven-authoring/evals/evals.json` | SDA eval coverage | ✓ VERIFIED | JSON parses; positive/negative/boundary/stacked checks pass. |
| `.opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh` | SDA package validator | ✓ VERIFIED | `bash -n` and execution pass. |
| `27-SDA-EVIDENCE.md` | REQ-SDA/HMQUAL evidence | ✓ VERIFIED | Lists REQ-SDA/HMQUAL mapping through REQ-SDA-08. |
| `.opencode/skills/hm-test-driven-execution/SKILL.md` | Standalone TDD execution workflow | ✓ VERIFIED | 205 lines; required sections present; no local absolute path. |
| `.opencode/skills/hm-test-driven-execution/evals/evals.json` | TDE eval coverage | ✓ VERIFIED | JSON parses; positive/negative/boundary/failure/stacked checks pass. |
| `.opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh` | TDE package validator | ✓ VERIFIED | `bash -n` and execution pass. |
| `27-TDE-EVIDENCE.md` | REQ-TDE/HMQUAL evidence | ✓ VERIFIED | Lists REQ-TDE/HMQUAL mapping through REQ-TDE-08. |
| `27-G-B-FINAL-EVIDENCE.md` | Final evidence catalog | ✓ VERIFIED | Includes both final records and Phase 31 exclusion. |
| `27-G-B-VERIFICATION.md` | Original execution verification report | ✓ VERIFIED | Contains command evidence and PASS statement. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `.opencode/skills/hm-spec-driven-authoring/SKILL.md` | `hm-test-driven-execution` | Handoff boundary after requirements lock | ✓ WIRED | Skill body names `hm-test-driven-execution`; eval stack includes it. |
| `.opencode/skills/hm-spec-driven-authoring/SKILL.md` | `hm-planning-with-files` | Durable progress boundary | ✓ WIRED | Skill body and eval stack include it. |
| `.opencode/skills/hm-test-driven-execution/SKILL.md` | `hm-spec-driven-authoring` | Ambiguous requirements handoff | ✓ WIRED | Skill body and eval boundary include it. |
| `.opencode/skills/hm-test-driven-execution/SKILL.md` | `hm-planning-with-files` | Multi-session progress persistence | ✓ WIRED | Skill body and eval stack include it. |
| `27-SDA-EVIDENCE.md` | `27-G-B-FINAL-EVIDENCE.md` | SDA D1-D8 final scoring | ✓ WIRED | Final evidence includes SDA final record. |
| `27-TDE-EVIDENCE.md` | `27-G-B-FINAL-EVIDENCE.md` | TDE D1-D8 final scoring | ✓ WIRED | Final evidence includes TDE final record. |

### Data-Flow Trace (Level 4)

Not applicable: Phase 27 changed skill packages, markdown references, JSON eval bundles, shell validators, and planning evidence. There are no runtime data-rendering components or API/database flows in scope.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| SDA validator succeeds | `bash .opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh` | `PASS: hm-spec-driven-authoring validation` | ✓ PASS |
| TDE validator succeeds | `bash .opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh` | `PASS: hm-test-driven-execution validation` | ✓ PASS |
| Eval bundles are valid JSON | `python3 -m json.tool ...` | exit 0 for both bundles | ✓ PASS |
| Validators are shell-syntax valid | `bash -n .../validate-skill.sh` | exit 0 for both validators | ✓ PASS |
| Phase evidence artifacts exist | `test -f ...` for baseline/schema/SDA/TDE/final/original verification artifacts | exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| HMQUAL-01 | Plans 27-01..04 | Trigger Accuracy | ✓ SATISFIED | Positive/negative/boundary evals and trigger boundaries for both skills. |
| HMQUAL-02 | Plans 27-01..04 | Body Depth | ✓ SATISFIED | Entry gates, workflows, decision gates, exits, blocked handoffs. |
| HMQUAL-03 | Plans 27-01..04 | 6-NON Defence | ✓ SATISFIED | `6-NON Defence Table` in both skills. |
| HMQUAL-04 | Plans 27-01..04 | Eval Coverage | ✓ SATISFIED | JSON eval bundles parse and include assertions plus stacked scenarios. |
| HMQUAL-05 | Plans 27-01..04 | Reference Completeness | ✓ SATISFIED | Reference maps and one-level reference files resolve. |
| HMQUAL-06 | Plans 27-01..04 | Integration Wiring | ✓ SATISFIED | Agents/commands/tools/hooks/runtime-state sections present. |
| HMQUAL-07 | Plans 27-01..04 | Cross-Platform Compatibility | ✓ SATISFIED | OpenCode/Hivemind/arbitrary-project adapters; no local path dependency in skill bodies. |
| HMQUAL-08 | Plans 27-01..04 | Self-Correction | ✓ SATISFIED | Retry, blocked, escalation, rollback/handoff states documented. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| — | — | None found in reviewed Phase 27 target runtime skill files | — | Placeholder/TODO/local-path scan passed. |

### Symlink Persistence Assessment

`.opencode/skills` is a tracked symlink:

```text
.opencode/skills -> ../.hivefiver-meta-builder/skills-lab/active/refactoring
realpath: /Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/refactoring
```

`git ls-files -s` confirms the symlink itself is tracked as mode `120000`, and the target skill files are tracked as normal files under `.hivefiver-meta-builder/...`. Therefore Phase 27 changes made through `.opencode/skills/...` are visible to OpenCode through the symlink and persist in tracked target files. The coordinator should commit the target paths and the new Phase 27 artifacts together when ready.

### Human Verification Required

1. **OpenCode trigger routing for `hm-spec-driven-authoring`**
   - **Test:** In a fresh OpenCode session, ask for a PRD/spec to be converted into falsifiable requirements, then ask for exploratory coding without a spec.
   - **Expected:** The skill activates for spec-to-requirement work and rejects exploratory coding.
   - **Why human:** Runtime skill activation/model routing cannot be proven by static file checks.

2. **OpenCode trigger routing for `hm-test-driven-execution`**
   - **Test:** In a fresh OpenCode session, ask for TDD against locked requirements, then ask for manual-only QA or ambiguous requirements.
   - **Expected:** The skill activates for locked TDD work, rejects manual-only/test-after/ambiguous requirements, and routes ambiguity to `hm-spec-driven-authoring`.
   - **Why human:** Runtime skill activation/model routing cannot be proven by static file checks.

### Gaps Summary

No implementation gaps were found in the Phase 27 static/package evidence. Overall verification status is `human_needed` solely because live OpenCode skill-routing behavior requires runtime/human UAT.

---

_Verified: 2026-04-25T12:34:33Z_  
_Verifier: the agent (gsd-verifier)_
