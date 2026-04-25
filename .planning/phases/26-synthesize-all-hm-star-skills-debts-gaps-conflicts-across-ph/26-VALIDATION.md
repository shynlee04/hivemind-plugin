---
phase: 26
slug: synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest for harness code; markdown/file-structure checks for planning artifacts |
| **Config file** | `vitest.config.ts`; phase-local artifact checks via shell/grep |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60-180 seconds |

---

## Sampling Rate

- **After every artifact-writing task:** Run artifact existence + required-section grep checks.
- **After every plan wave:** Run `npm run typecheck` and artifact coverage checks.
- **Before `$gsd-verify-work`:** Required Phase 26 artifacts must exist and pass section coverage checks.
- **Max feedback latency:** 180 seconds for automated checks; manual review required for content quality sign-off.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | Phase 26 D-01..D-11 | N/A | No source or skill mutation during audit | artifact | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 1 | G-B demonstration specs | N/A | SPECs are planning artifacts only | artifact | `ls .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-*-SPEC.md` | ❌ W0 | ⬜ pending |
| 26-03-01 | 03 | 2 | Phase 22 archive + Phase 23 absorption | N/A | Existing phase evidence preserved, false claims archived | grep | `grep -R "Phase 22" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph` | ❌ W0 | ⬜ pending |
| 26-04-01 | 04 | 2 | hm-* ecosystem roadmap | N/A | No hard harness mutation | git | `git diff --name-only | grep '^src/' && exit 1 || exit 0` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Establish artifact filenames in Phase 26 plans (`26-PLAYBOOK.md`, `26-ECOLOGY-AUDIT.md`, `26-ARCHIVE-REPORT.md`, G-B SPEC files).
- [ ] Define grep-verifiable section headings for every artifact.
- [ ] Ensure all plans include read-only constraints for `.opencode/skills/**/SKILL.md` and `src/**`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PLAYBOOK quality is actually useful, not template filler | D-03, D-06, D-07 | Requires semantic judgment against user mandate | Review `26-PLAYBOOK.md` for concrete examples, integration wiring, cross-platform applicability, and falsifiable skill-quality criteria |
| G-B SPECs are standalone-superior and GSD-comparable | D-01, D-02, D-04 | Requires comparison against benchmark skill outputs | Compare G-B SPEC requirements against GSD benchmark capabilities listed in CONTEXT canonical refs |

---

## Validation Sign-Off

- [ ] All Phase 26 artifacts exist with required section headings.
- [ ] All plan tasks have grep-verifiable acceptance criteria.
- [ ] No `src/` code changed.
- [ ] No `.opencode/skills/**/SKILL.md` files mutated during Phase 26.
- [ ] Phase 22 archive and Phase 23 absorption are explicit and source-cited.
- [ ] `nyquist_compliant: true` remains set in frontmatter.

**Approval:** pending
