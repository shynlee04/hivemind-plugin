---
phase: 27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-
tested: 2026-04-25T12:34:33Z
status: partial
equivalent_gate: /gsd-verify-work 27
automated_checks: passed
human_checks_required: 2
---

# Phase 27 UAT Gate

**Equivalent gate:** `/gsd-verify-work 27` as far as non-interactive evidence allows.  
**Tested:** 2026-04-25T12:34:33Z  
**Status:** PARTIAL — automated evidence passed; runtime trigger behavior needs human/OpenCode-session confirmation.

## Automated User-Acceptance Evidence

| User-facing claim | Non-interactive evidence | Status |
|---|---|---|
| `hm-spec-driven-authoring` is a substantive spec-to-requirements skill | Validator PASS, required sections present, eval JSON gradeable, references resolve. | PASS |
| `hm-test-driven-execution` is a substantive runtime-truthful TDD skill | Validator PASS, required sections present, eval JSON gradeable, references resolve. | PASS |
| Both skills avoid local repository path assumptions in shipped skill bodies | Static scan found no `/Users/apple` or `.worktrees/harness-experiment` in `SKILL.md`. | PASS |
| Phase 31 scope is not claimed as Phase 27 completion evidence | `27-G-B-FINAL-EVIDENCE.md` and `27-G-B-VERIFICATION.md` explicitly exclude Phase 31 cross-lineage E2E validation. | PASS |
| `.opencode/skills` persistence/visibility is understood | Symlink resolves to `.hivefiver-meta-builder/skills-lab/active/refactoring`; symlink and target files are tracked. | PASS |

## Human / Runtime UAT Required

### 1. OpenCode trigger routing for `hm-spec-driven-authoring`

**Test:** In a fresh OpenCode session, ask for a PRD/spec to be converted into falsifiable requirements, then ask for exploratory coding without a spec.  
**Expected:** The skill activates for spec-to-requirement work and does not activate for exploratory coding; it should route TDD execution to `hm-test-driven-execution`.  
**Why human/runtime:** Static eval files are gradeable, but actual skill trigger selection depends on OpenCode runtime discovery and model routing.

### 2. OpenCode trigger routing for `hm-test-driven-execution`

**Test:** In a fresh OpenCode session, ask for TDD against locked requirements, then ask for manual-only QA or ambiguous requirements.  
**Expected:** The skill activates for test-first work, rejects manual-only QA/test-after claims, and routes ambiguous requirements to `hm-spec-driven-authoring`.  
**Why human/runtime:** Static package checks cannot prove live trigger behavior or model-level boundary decisions.

## UAT Decision

Automated UAT evidence passes. Overall UAT remains PARTIAL until the two runtime trigger checks are confirmed.
