# Phase Verification Template

Template for `.planning/phases/XX-name/{phase_num}-VERIFICATION.md` — final acceptance record produced by the `gsd-verify-work` workflow.

**Purpose:** Capture independent verification evidence (BATS + vitest + tsc + integration) AND a human-driven UAT verdict for every user-facing symptom enumerated in the phase's `## User-Pain Coverage` section. A phase cannot ship with `FAIL` on any symptom verdict.

**Key principle:** BATS-only verification is NOT sufficient. The Human-Driven UAT gate (P58-META-04) is the FINAL gate. The `gsd-verify-work` workflow MUST fail if the `## Human-Driven UAT` section is missing or contains `FAIL`.

**Downstream consumers:**
- `gsd-shipper` — uses Human-Driven UAT verdict to decide ship readiness
- `gsd-audit-milestone` — references UAT verdicts in milestone audit
- Future agents diagnosing regressions — uses BATS evidence + UAT verdict to scope investigation

---

## File Template

```markdown
---
phase: [X]-[name]
verified: [ISO timestamp]
status: passed | failed
score: [N] of [M] must-haves verified
overrides_applied: [N] (list any scope-override justifications)
---

# Phase [X]: [Name] — Final Verification Report

**Verifier:** gsd-verifier (automated checks) + human tester (UAT)
**Date:** [date]
**Phase:** [X-name]
**Plan under verification:** [plan-id]

## Verdict

## [VERIFIED | FAILED] — [1-line summary]

All [N] gaps closed with code-level evidence. All [M]/[M] acceptance
criteria verified by independent re-execution. All cross-cutting
invariants preserved. TypeScript typecheck clean. Vitest
[N-passed] passed / [0-failed] failed. BATS [N-passed] passed /
[0-failed] failed.

**OR** for failed phases: list which AC failed and which symptom
verdict is FAIL.

## Test Results (independently re-run)

| Suite | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | PASS | exit 0; zero type errors; [N] new `any` types in [files] |
| `npx vitest run` | [N] passed / [0] skipped / [0] failed | [test-file-count] passed, [N] skipped |
| BATS regression | [N]/[N] PASS | [list slot files] |
| BATS new (this phase) | [N]/[N] PASS | [list new slot files] |
| 27-tool-key invariant | PASS | [N] tool keys (preserve project-wide invariant) |
| P20 no-new-deps | PASS | no package.json changes |
| AC#10/AC#11 manualOverride regression | PASS | [if applicable; cite lines] |

## Human-Driven UAT

> **The FINAL gate per P58-META-04.** A human tester (NOT
> `gsd-verifier` or `gsd-executor`) signs off on every user-facing
> symptom enumerated in the phase's `## User-Pain Coverage` section.
> BATS-only verification is NOT sufficient. The phase does NOT
> ship with any `FAIL` verdict.

**Date:** [date]
**Tester:** [human user name — e.g., the front-facing operator who filed the original complaint]
**Surfaces tested:** [list of user-facing surfaces from the phase's `## User-Pain Coverage` section]
**Procedure:** [numbered steps the tester actually performed — what they typed, what they saw, what they clicked]

### Symptom Verdicts

For each symptom enumerated in `## User-Pain Coverage`, list a
verdict. Required: `PASS`, `PARTIAL`, or `FAIL`. `FAIL` is a
HARD FAIL (the phase does not ship). `PARTIAL` requires an
explicit follow-up phase link.

| Symptom | Verdict | Reason |
|---------|---------|--------|
| S[N] ([label from USER-PAIN-BACKLOG]) | PASS / PARTIAL / FAIL | {1-line reason + evidence} |
| ... | ... | ... |

### Verifier Enforcement

The `gsd-verify-work` workflow is updated to enforce the following
gate sequence (P58-META-04):

1. All BATS slots (regression + new) PASS.
2. `npx tsc --noEmit` exits 0.
3. `npx vitest run` exits 0.
4. `## Human-Driven UAT` section is present in this file.
5. Tester is a real human (NOT `gsd-verifier` or `gsd-executor`).
6. Every symptom enumerated in `## User-Pain Coverage` has a
   verdict of `PASS` or `PARTIAL`-with-follow-up.
7. No `FAIL` verdict (HARD FAIL).

Missing any of (1)-(7) = HARD FAIL.

## Gap Closure (independently re-verified)

[For each gap (G1-Gn) listed in the SPEC, list the code-level
evidence that closes it. Each entry includes: file:line, BATS
slot, or vitest test name.]

| Gap | Evidence |
|-----|----------|
| G1 | `src/foo.ts:42` implements X; BATS slot 71 asserts Y |
| G2 | ... |

## Cross-Cutting Invariants

[For each invariant listed in the SPEC, confirm preservation or
document any change.]

| Invariant | Status | Evidence |
|-----------|--------|----------|
| 27-tool-key count | preserved | `grep -cE '^\s*"[a-z-]+":\s+create' src/plugin.ts` returns 25 + 2 inline = 27 |
| P20 no-new-deps | preserved | `git diff package.json` returns empty |
| AC#10 appendTuiPrompt | preserved | `src/plugin.ts:940-947` check-FIRST ordering |
| AC#11 forward-prompt | preserved | `src/tools/tmux-copilot.ts:263-278` check-FIRST ordering |

## Out-of-Scope Findings (NOT a P[N] regression)

[Findings discovered during verification that are inherited debt
from prior phases. Flagged for a future phase to address, NOT a
block on this phase's ship.]

## Test Artifacts (paths)

[List the paths to the BATS test files, vitest test files, and
any other verification artifacts. This lets the next phase's
planner find them via grep.]

- BATS: `tests/scripts/tmux/[slot]-[name].bats`
- vitest: `tests/lib/[name].test.ts`
- Unit: `tests/tools/[name].test.ts`

---

*Verifier: gsd-verifier + human UAT tester*
*Verified: [date]*
*Phase: [X-name]*
*Next step: /gsd-ship [X] — or hold for follow-up if any PARTIAL/FAIL verdict*
```
