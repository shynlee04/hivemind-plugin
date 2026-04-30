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
| 26-01-01 | 01 | 1 | SYN-01 / D-01..D-07 | T-26-01..03 | No source or skill mutation while creating the playbook contract | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md && grep -q "## D8: Self-Correction" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md && test $(grep -c "PASS Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md) -ge 8` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | SYN-01 / D-01..D-07 | T-26-01..03 | False closure prevented through evidence schema and anti-regression rules | artifact/content | `grep -q "## Evidence Requirements" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md && grep -q "No template-only skills" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 2 | SYN-03 / D-05 / D-10 | T-26-04..06 | Audit reads canonical skills without mutating packages | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md && grep -q "## Full Skill Inventory" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md && grep -q "hm-spec-driven-authoring" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md` | ❌ W0 | ⬜ pending |
| 26-02-02 | 02 | 2 | SYN-03 / D-05 / D-10 | T-26-04..06 | Score matrix requires evidence-backed PASS/PARTIAL/FAIL labels | artifact/content | `grep -q "## 8-Dimension Score Matrix" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md && grep -q "0 fully resolved by quality evidence" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md` | ❌ W0 | ⬜ pending |
| 26-03-01 | 03 | 2 | SYN-02 / D-04 / D-10 / D-11 | T-26-07..09 | SPEC contract documents current state without mutating `hm-spec-driven-authoring` | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md && grep -q "REQ-SDA-08" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md && test $(grep -c "Acceptance Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md) -ge 8` | ❌ W0 | ⬜ pending |
| 26-03-02 | 03 | 2 | SYN-02 / D-04 / D-10 / D-11 | T-26-07..09 | SPEC contract documents current state without mutating `hm-test-driven-execution` | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md && grep -q "REQ-TDE-08" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md && test $(grep -c "Acceptance Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md) -ge 8` | ❌ W0 | ⬜ pending |
| 26-04-01 | 04 | 2 | SYN-06 / D-08 | T-26-10..12 | Phase 22 false completion claims are archived, not repaired by source mutation | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md && grep -q "## Phase 22 Archive Record" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md && grep -q "NOT SUBSTANTIATED" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md` | ❌ W0 | ⬜ pending |
| 26-04-02 | 04 | 2 | SYN-06 / D-09 | T-26-10..12 | Phase 23 partial eval scope is absorbed with explicit closure rules | artifact/content | `grep -q "## Phase 23 Absorption Record" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md && grep -q "PLAYBOOK D4: Eval Coverage" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md` | ❌ W0 | ⬜ pending |
| 26-05-01 | 05 | 3 | SYN-04 / D-05 / D-11 | T-26-13..15 | Roadmap sequences downstream work only after Phase 26 artifacts exist | artifact/content | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md && grep -q "## Phase 27: G-B Quality Assurance Demonstration" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md && test $(grep -c "Verification Gate" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md) -ge 4` | ❌ W0 | ⬜ pending |
| 26-05-02 | 05 | 3 | SYN-05 / D-05 | T-26-13..15 | Requirements registry receives HMQUAL entries without Phase 31 overreach | content | `grep -q "## Phase 26: hm-* Skill Quality Standards" .planning/REQUIREMENTS.md && grep -q "HMQUAL-08" .planning/REQUIREMENTS.md && test $(grep -c "HMQUAL-" .planning/REQUIREMENTS.md) -ge 16` | ❌ W0 | ⬜ pending |
| 26-05-03 | 05 | 3 | SYN-04 / SYN-05 | T-26-13..15 | Readiness checks guard against source mutation and missing deliverables before closure | artifact/content | `grep -q "26-PLAYBOOK.md" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md && grep -q "26-ECOLOGY-AUDIT.md" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md && grep -q "HMQUAL-08" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md` | ❌ W0 | ⬜ pending |

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
