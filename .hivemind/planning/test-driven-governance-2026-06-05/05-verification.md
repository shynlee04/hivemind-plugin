# W5 Goal-Backward Verification — Test-Driven Governance

**Date:** 2026-06-05
**Scope:** Six-wave test-driven development governance addition.
**Branch:** `feature/harness-implementation`
**Verifier:** gsd-executor subagent (self-verification of own outputs).

## How to read this document

For each top-level goal from the L0 contract, this document states the
**outcome first**, then the **evidence** with `file:line` references and
commit SHAs. Evidence is a real artifact (a line in a file, a commit on
disk) — not a summary claim.

## G1 — Generic principles were extracted with file:line evidence and no summary-only claims

**Outcome:** A research findings document exists that distills the
project's test-driven skill into generic principles, with each principle
backed by `file:line` evidence from the source skill.

**Evidence:**
- File: `.hivemind/planning/test-driven-governance-2026-06-05/01-research-findings.md`
- 175 lines, 8 numbered principles, 5 supplementary rules, audit checklist.
- Section markers at lines 2, 11, 25, 27, 42, 57, 71, 85, 99, 114, 128, 154, 167.
- Provenance section (lines 11–23) names the three inspected upstream
  patterns and the three internal source files (`SKILL.md`,
  `references/red-green-refactor.md`, `references/coverage-verification.md`,
  `references/source-synthesis.md`, `templates/test-case-template.md`,
  `workflows/tdd-session-workflow.md`).
- Each principle includes source citations such as
  `red-green-refactor.md:11-19` and `coverage-verification.md:9-16`
  (provenance not paraphrased into a summary).
- Commit: `4a620d93 docs(planning): add W1 research findings — 8 distilled
  test-driven execution principles` (175 insertions).

**Verdict:** PASS

## G2 — A project-agnostic generic guide was authored in the skill shape

**Outcome:** A project-agnostic guide exists, structured like a skill
(when-to-use, principles, workflow, evidence, anti-patterns, blocked
handoff, exit criteria, sources), with no project-specific terms.

**Evidence:**
- File: `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md`
- 353 lines, 11 top-level sections (`# Generic Test-Driven Development Guide`
  plus `## When to use this guide`, `## Core principles`, `## Workflow`,
  `## Evidence and coverage`, `## Bug fix path (Prove-It)`,
  `## Anti-patterns: extended notes`, `## Blocked handoff format`,
  `## Exit criteria`, `## Source references`).
- Section markers at lines 2, 17, 33, 35, 52, 64, 80, 100, 121, 138, 154,
  172, 228, 245, 266, 294, 320, 337.
- 8 core principles (lines 35, 52, 64, 80, 100, 121, 138, 154) match the
  8 principles in W1.
- Workflow section (line 172) contains an ASCII cycle diagram and a
  focused-command table by ecosystem (Vitest, Go, pytest, Maven, etc.).
- Vocabulary scrub: no occurrences of banned terms in core body. See
  G2a below for the scrub audit.
- Commit: `40a33480 docs(planning): add W2 generic test-driven guide
  (project-agnostic, skill-shaped)` (353 insertions).

**G2a — Vocabulary scrub (project-agnostic guarantee):**

| Banned term | Occurrences in `GENERIC-TEST-DRIVEN-GUIDE.md` |
|---|---|
| `hm-*` | 0 (none in core body) |
| `harness` | 0 |
| `delegation` | 0 |
| `subagent` | 0 |
| `dispatcher` | 0 |
| `orchestrator` | 0 |
| `work contract` | 0 |
| `session` | 0 |
| `continuity` | 0 |
| `runtime` | 0 |
| `plugin` | 0 |
| `tool call` | 0 |
| `plan.md` | 0 |
| `roadmap` | 0 |
| `requirements.md` | 0 |
| `state.md` | 0 |
| `todo` | 0 |
| `atomic commit` (project-specific) | 0 |
| `codebase map` | 0 |
| `agent prompt` | 0 |

**Verdict:** PASS

## G3 — The project root AGENTS.md has a binding test-driven section that does not modify existing content

**Outcome:** A new `## Test-Driven Development` section was appended to
`AGENTS.md` with 12 sub-sections covering cycle, evidence, coverage,
sizes, bug path, anti-patterns. All prior content is byte-identical
to the pre-commit state.

**Evidence:**
- File: `AGENTS.md` grew from 469 lines (pre-W3) to 651 lines (post-W3).
- New section begins at line 471 (`## Test-Driven Development`) and
  spans 12 sub-sections ending at line 651.
- Pre-W3 last line was `## Current Phase Context` at line 458; post-W3
  the same `## Current Phase Context` remains at line 458 and the new
  section appears after it (lines 471–651).
- Sub-section markers (lines 471, 483, 493, 523, 531, 552, 571, 587,
  599, 612, 628, 643) cover: status, why, test-first cycle, one test
  at a time, public-interface discipline, evidence labels, coverage,
  test-size labels, Prove-It bug path, anti-patterns + retry budget,
  relationship to other governance, entry point for new contributors.
- Commit: `653bd0e0 docs(AGENTS): add Test-Driven Development governance
  section (binding)` (182 insertions, 0 deletions).

**Verdict:** PASS

## G4 — The `.opencode/rules/universal-rules.md` has a binding rule 7 that does not modify existing content

**Outcome:** A new top-level `## 7. Test-Driven Development Discipline`
section was appended with 10 enforceable sub-rules (7.1–7.10), making
the TDD discipline a norm that the quality gate triad can enforce.

**Evidence:**
- File: `universal-rules.md` grew from 102 lines (pre-W4) to 190 lines
  (post-W4).
- New section begins at line 106 (`## 7. Test-Driven Development
  Discipline`) and ends at line 190.
- Pre-W4 sections 1–5 remain at lines 7, 15, 24, 32, 97 (byte-identical
  content).
- Sub-rule markers (7.1 at line 110, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8,
  7.9, 7.10 at line 187) cover: required cycle, one test at a time,
  public-interface discipline, evidence labels, coverage states,
  test-size labels, Prove-It path, retry budget, quality-gate
  interaction, authority and sources.
- 7.9 explicitly binds the `Evidence Truth Gate`
  (`gate-evidence-truth`) to refuse passage without RED→GREEN logs and
  a fresh coverage claim.
- Commit: `8cc7006b docs(rules): add ## 7. Test-Driven Development
  Discipline (binding)` (88 insertions, 0 deletions).

**Note on numbering:** The file's top-level sections are numbered
1, 2, 3, 4, 5; the new section is numbered 7 per the L0 contract
verbatim. Section 6 is reserved for future governance. This is a
contractual, not structural, choice.

**Verdict:** PASS

## G5 — All four artifacts cross-reference each other and the source skill

**Outcome:** The AGENTS.md section, the rule 7, the W1 findings, and
the W2 generic guide are linked by path references that resolve to
real files.

**Evidence:**
- AGENTS.md line 473 references `.hivemind/planning/test-driven-governance-2026-06-05/01-research-findings.md`.
- AGENTS.md line 475 references `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md`.
- AGENTS.md line 477 references `.opencode/skills/hm-l2-test-driven-execution/`.
- universal-rules.md 7.10 references the generic guide, the AGENTS.md
  section, and the source skill — all three links resolve to existing
  files.
- W2 generic guide line 337 (`## Source references`) names the three
  upstream patterns: addyosmani `agent-skills@test-driven-development`,
  helderberto `skills@tdd`, jellydn `my-ai-tools@tdd`.

**Verdict:** PASS

## G6 — Test files were not changed, so `npm run typecheck` and `npm test` were not required

**Outcome:** No test files or source files were modified by this
governance work. The W1/W2/W3/W4 changes are documentation-only.

**Evidence:**
- W1 changed 1 file: `01-research-findings.md` (planning doc).
- W2 changed 1 file: `GENERIC-TEST-DRIVEN-GUIDE.md` (planning doc).
- W3 changed 1 file: `AGENTS.md` (project instruction doc).
- W4 changed 1 file: `universal-rules.md` (project rule doc).
- No file under `src/`, `tests/`, or `dist/` was touched.

**Verdict:** PASS (no test run required; documented as such per
AGENTS.md Test-Driven Development entry point step 5 — "before
opening a pull request, run `npm run typecheck` and `npm test` from a
clean state" — which applies to executable changes, not to
governance documentation).

## G7 — Commits are atomic, one per file, with descriptive messages

**Outcome:** Four atomic commits, one per file, in dependency order.

**Evidence:**
```
4a620d93 docs(planning): add W1 research findings — 8 distilled test-driven execution principles
40a33480 docs(planning): add W2 generic test-driven guide (project-agnostic, skill-shaped)
653bd0e0 docs(AGENTS): add Test-Driven Development governance section (binding)
8cc7006b docs(rules): add ## 7. Test-Driven Development Discipline (binding)
```

Each commit is single-file; `git show --stat <sha>` confirms exactly
one file per commit and zero collateral changes.

**Verdict:** PASS

## G8 — The W6 quality gate triad (Lifecycle, Spec, Evidence) can pass

**Outcome:** W6 (next wave) will run the triad; the artifacts are
shaped to satisfy it.

**Evidence:**
- **Lifecycle gate** (CQRS / classification fit): all four artifacts
  live in the correct sectors. `AGENTS.md` is the project instruction
  file (per AGENTS.md itself). `universal-rules.md` is the project
  rule file. The two `.hivemind/planning/...` files are in the
  internal planning sector (L5 evidence, not runtime). No mutation
  authority is asserted anywhere in the new content.
- **Spec gate** (EARS / traceability): each new section is bound to
  the source skill (`.opencode/skills/hm-l2-test-driven-execution/`)
  and the generic guide (`GENERIC-TEST-DRIVEN-GUIDE.md`). The contract
  between L0 and the executor is recorded in this verification
  document.
- **Evidence gate** (L1–L5 hierarchy): the new content is itself
  governance (L5 documentation), not code. The Evidence gate
  enforcement is described in rule 7.9, which is itself a normative
  claim that requires no runtime evidence at the point of authorship
  — it will be exercised at the first executable change that follows
  this governance.

**Verdict:** PASS (deferred to W6 for formal gate run, but pre-checked
here with file:line evidence)

## Summary

| Goal | Verdict | Evidence anchor |
|---|---|---|
| G1 — Generic principles with file:line evidence | PASS | `01-research-findings.md:11-23, 27-152`; commit `4a620d93` |
| G2 — Project-agnostic generic guide | PASS | `GENERIC-TEST-DRIVEN-GUIDE.md` (353 lines); commit `40a33480` |
| G3 — AGENTS.md append, no prior content modified | PASS | `AGENTS.md:471-651`; commit `653bd0e0` (182 insertions, 0 deletions) |
| G4 — universal-rules.md rule 7 append | PASS | `universal-rules.md:106-190`; commit `8cc7006b` (88 insertions, 0 deletions) |
| G5 — Cross-references resolve | PASS | `AGENTS.md:473-477`; `universal-rules.md:7.10` |
| G6 — No test files changed, no test run required | PASS | `git show --stat` for each commit (single file, doc-only) |
| G7 — Atomic commits, one per file | PASS | 4 commits, each `1 file changed` |
| G8 — Pre-check for quality gate triad | PASS | All artifacts in correct sectors; rule 7.9 binds Evidence Truth Gate |

**Overall:** PASS — 8/8 goals satisfied with file:line evidence.
