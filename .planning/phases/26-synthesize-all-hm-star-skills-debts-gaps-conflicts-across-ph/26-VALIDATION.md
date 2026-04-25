---
phase: 26
slug: synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — synthesis phase, artifact-based validation |
| **Config file** | none |
| **Quick run command** | `ls .planning/phases/26-*/{PLAYBOOK,ECOSYSTEM-AUDIT,SPEC-*,ROADMAP-27-30,ARCHIVE-22,ARCHIVE-23}.md 2>/dev/null | wc -l` |
| **Full suite command** | `grep -c "PASS Criteria" .planning/phases/26-*/PLAYBOOK.md && grep -c "FAIL Criteria" .planning/phases/26-*/PLAYBOOK.md` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run artifact existence check (6 target files)
- **After every plan wave:** Run full PLAYBOOK dimension count check
- **Before `/gsd-verify-work`:** All 6 artifacts must exist, PLAYBOOK must have ≥8 dimensions with PASS/FAIL criteria
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | D-03 | — | N/A | artifact | `test -f .planning/phases/26-*/PLAYBOOK.md` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | D-05a | — | N/A | artifact | `test -f .planning/phases/26-*/ECOSYSTEM-AUDIT.md` | ❌ W0 | ⬜ pending |
| 26-01-03 | 01 | 1 | D-04 | — | N/A | artifact | `test -f .planning/phases/26-*/SPEC-hm-spec-driven-authoring.md && test -f .planning/phases/26-*/SPEC-hm-test-driven-execution.md` | ❌ W0 | ⬜ pending |
| 26-01-04 | 01 | 1 | D-05c | — | N/A | artifact | `test -f .planning/phases/26-*/ROADMAP-27-30.md` | ❌ W0 | ⬜ pending |
| 26-01-05 | 01 | 1 | D-08/D-09 | — | N/A | artifact | `test -f .planning/phases/26-*/ARCHIVE-22.md && test -f .planning/phases/26-*/ARCHIVE-23.md` | ❌ W0 | ⬜ pending |
| 26-01-06 | 01 | 1 | D-01/D-03 | — | N/A | quality | `grep -c "PASS Criteria" .planning/phases/26-*/PLAYBOOK.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test infrastructure needed — this is an artifact-based synthesis phase
- All artifacts are created by planner tasks, not by test scaffolding
- Verification uses file existence + content pattern checks

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PLAYBOOK quality dimension measurability | D-03 | Requires semantic review of PASS/FAIL criteria | Read each dimension in PLAYBOOK.md; verify each has a concrete verification command, not vague language |
| G-B SPEC falsifiability | D-04 | Falsifiability requires human judgment | Read SPEC files; verify each REQ-* item can be objectively verified as PASS or FAIL |
| Cross-platform compatibility check | D-07 | Platform-specific assumptions require context | Read all artifacts; verify no hardcoded paths, tool assumptions, or environment-specific language |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
