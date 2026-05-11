# Phase 11 — Truth Matrix

**Generated:** 2026-05-11
**Status:** Committed deliverable per D-13
**Purpose:** Every verifiable claim across 13 governance files, cross-referenced against live evidence.

---

## Claims Register

### STATE.md Claims

| # | Claim | File:Line | Source Artifact | Claimed Value | Live Evidence | Command | Verdict | Correction Needed |
|---|-------|-----------|-----------------|---------------|---------------|---------|---------|-------------------|
| S-01 | "125 test files" | STATE.md:52 | STATE.md | 125 | 149 | `find tests -name '*.test.ts' -o -name '*.spec.ts' \| wc -l` | STALE | Update to 149 |
| S-02 | "1767 tests" | STATE.md:52 | STATE.md | 1767 | 1978 | `grep -rh '^\s*it(\|test(' tests/ \| grep -c 'it(\|test('` | STALE | Update to 1978 |
| S-03 | "19 commands" | STATE.md:62 | STATE.md | 19 | 19 | `ls -1 .opencode/commands/*.md \| wc -l` | CONFIRMED | — |
| S-04 | "plugin.ts at 447 LOC" | STATE.md:77 | STATE.md | 447 | 242 | `wc -l src/plugin.ts` | STALE | Update to 242 |
| S-05 | "123 active skill directories" | STATE.md:61 | STATE.md | 123 | 125 | `ls -1d .opencode/skills/*/ \| wc -l` | STALE | Update to 125 |
| S-06 | "17/19 dirs no typed module" | STATE.md:82 | STATE.md | 19 dirs | 11 subdirs | `find .hivemind -maxdepth 1 -type d \| grep -v '^\.hivemind$' \| wc -l` | STALE | 11 subdirs, not 19. Update to "9/11 dirs no typed module" |
| S-07 | "messages-transform.ts dead code" | STATE.md:76 | STATE.md | Exists | DELETED | `test -f src/lib/messages-transform.ts; find src -name '*messages-transform*'` | CONFIRMED | File deleted. Remove claim from STATE.md (action completed). Verify: `find src -name '*messages-transform*'` returns nothing |
| S-08 | "9 sector AGENTS.md files" | STATE.md:39 | STATE.md | 9 files | 7 files | `for f in AGENTS.md src/ AGENTS.md .opencode/AGENTS.md .planning/AGENTS.md .hivemind/AGENTS.md .hivefiver-meta-builder/AGENTS.md tests/AGENTS.md; do test -f "$f" && echo "EXISTS" \|\| echo "MISSING"; done` | STALE | Update to 7 (all 7 exist, none missing) |
| S-09 | "total_phases: 31" | STATE.md:9 | STATE.md frontmatter | 31 | 31 | `find .planning/phases -maxdepth 1 -mindepth 1 -type d \| wc -l` | CONFIRMED | — |
| S-10 | "completed_phases: 1" | STATE.md:10 | STATE.md frontmatter | 1 | 2 (have SUMMARY); 1 (has VERIFICATION) | Audit phase SUMMARY.md + VERIFICATION.md per dir | STALE | 2 phases have SUMMARY.md (BOOT-02: 6, CP-ST-01: 3); only CP-PTY-00 has VERIFICATION.md. Recommend 2 completed_phases based on SUMMARY evidence |
| S-11 | "total_plans: 10" | STATE.md:11 | STATE.md frontmatter | 10 | 28 | `find .planning/phases -name '*PLAN.md' \| wc -l` | STALE | Update to 28 |
| S-12 | "completed_plans: 9" | STATE.md:12 | STATE.md frontmatter | 9 | 9 | `find .planning/phases -name '*SUMMARY.md' \| wc -l` | CONFIRMED | — (9 SUMMARY.md files found: BOOT-02 has 6, CP-ST-01 has 3) |
| S-13 | "percent: 90" | STATE.md:13 | STATE.md frontmatter | 90 | ~32% | (completed_plans/total_plans)×100 = 9/28×100 | STALE | Recalculate: 9/28 ≈ 32% |

### PROJECT.md Claims

| # | Claim | File:Line | Source Artifact | Claimed Value | Live Evidence | Command | Verdict | Correction Needed |
|---|-------|-----------|-----------------|---------------|---------------|---------|---------|-------------------|
| P-01 | "125 test files, 1767 tests" | PROJECT.md:23 | PROJECT.md | 125/1767 | 149/1978 | `find tests -name '*.test.ts' -o -name '*.spec.ts' \| wc -l` + `grep -rh 'it(\|test(' tests/ \| grep -c` | STALE | Update to 149 test files, 1978 tests |
| P-02 | "@opencode-ai/sdk ^1.14.28" | PROJECT.md:56 | PROJECT.md | ^1.14.28 | ^1.14.41 | `grep '@opencode-ai/sdk' package.json` | STALE | Update to ^1.14.41 |
| P-03 | "@opencode-ai/plugin ^1.14.28" | PROJECT.md:56 | PROJECT.md | ^1.14.28 | ^1.14.41 | `grep '@opencode-ai/plugin' package.json` | STALE | Update to ^1.14.41 |
| P-04 | "34 Lib modules" | PROJECT.md:58 | PROJECT.md | 34 modules | REMOVED | `test -d src/lib` | STALE | Remove claim entirely. `src/lib/` no longer exists post-SR restructuring |
| P-05 | "plugin.ts at 447 LOC" | PROJECT.md:36 | PROJECT.md | 447 | 242 | `wc -l src/plugin.ts` | STALE | Update to 242 |
| P-06 | "89 agents" | PROJECT.md:26 | PROJECT.md | 89 | 89 | `ls -1 .opencode/agents/*.md \| wc -l` | CONFIRMED | — |
| P-07 | "123 active skill directories" | PROJECT.md:26 | PROJECT.md | 123 | 125 | `ls -1d .opencode/skills/*/ \| wc -l` | STALE | Update to 125 |
| P-08 | "19 commands" | PROJECT.md:26 | PROJECT.md | 19 | 19 | `ls -1 .opencode/commands/*.md \| wc -l` | CONFIRMED | — |
| P-09 | "71 milestone phases" | PROJECT.md:59 | PROJECT.md | 71 | 31 | `find .planning/phases -maxdepth 1 -mindepth 1 -type d \| wc -l` | STALE | 31 phase directories exist. "71" may refer to a different counting method (individual milestone phases within workstreams) — clarify source [UNVERIFIED] |
| P-10 | "6 hook types registered" | PROJECT.md:21 | PROJECT.md | 6 hook types | ~7 hook factories | `grep 'hook' src/plugin.ts` | UNVERIFIED | 7 hook factories imported in plugin.ts (createCoreHooks, createSessionHooks, createToolGuardHooks, createDelegationEventObserver, createSessionEntryEventObserver, createSessionJourneyEventObserver, createToolExecuteAfterHook). Claim of exactly 6 types needs reconciliation with actual registration count |

### ROADMAP.md Claims

| # | Claim | File:Line | Source Artifact | Claimed Value | Live Evidence | Command | Verdict | Correction Needed |
|---|-------|-----------|-----------------|---------------|---------------|---------|---------|-------------------|
| R-01 | "GOV-01 (Phase 11) + CP-ST-02 (Phase 12) added" | ROADMAP.md:361 | ROADMAP footer | Added to roadmap | MISSING rows | `grep 'GOV-01\|CP-ST-02' ROADMAP.md` | FALSE | Only in footer (line 361), no actual table rows with phase definition, status, depends_on, blocks columns. Add proper rows for GOV-01 and CP-ST-02 to the phase table |
| R-02 | "19 subdirectories" (BOOT-03 .hivemind/ creation) | ROADMAP.md:155 | ROADMAP BOOT-03 | 19 | 11 | `find .hivemind -maxdepth 1 -type d \| grep -v '^\.hivemind$' \| wc -l` | STALE | Update to 11 |
| R-03 | "1767 tests pass" (BOOT-07 E2E) | ROADMAP.md:180 | ROADMAP BOOT-07 | 1767 | 1978 | `grep -rh 'it(\|test(' tests/ \| grep -c 'it(\|test('` | STALE | Update to 1978 |

### REQUIREMENTS.md Claims

| # | Claim | File:Line | Source Artifact | Claimed Value | Live Evidence | Command | Verdict | Correction Needed |
|---|-------|-----------|-----------------|---------------|---------------|---------|---------|-------------------|
| Q-01 | "123 active skill directories" | REQ.md:19 | REQUIREMENTS.md | 123 | 125 | `ls -1d .opencode/skills/*/ \| wc -l` | STALE | Update to 125 |

---

## Phase Evidence Audit

| Phase Dir | Has SUMMARY.md | Has VERIFICATION.md | Status in ROADMAP | Consistent? |
|-----------|----------------|---------------------|-------------------|-------------|
| 11-governance-reconciliation-update-all-core-artifacts-state-md | 0 | 0 | In Progress (Phase 11) | ✓ (active execution) |
| 12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02- | 0 | 0 | Not in table | ✗ Missing row |
| BOOT-01-dependency-audit-architecture | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-02-cli-framework-entry-point | 6 | 0 | ✅ COMPLETE | ✓ |
| BOOT-02R-governance-reconciliation | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-03-state-init | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-04-primitives-recovery | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-05-config-bootstrap-defaults | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-06-validation-health-check | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-07-end-to-end-proof | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| BOOT-08-agent-skill-integration | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| CP-PTY-00-shell-pty-control-plane-spike | 0 | 1 | ✅ COMPLETE | ✓ (has VERIFICATION) |
| CP-PTY-01-background-shell-control-plane-mvp | 0 | 0 | 🔵 READY | ✓ |
| CP-PTY-02-sdk-session-delegation-integration | 0 | 0 | ⬜ NOT PLANNED | ✓ |
| CP-PTY-03-agent-subagent-background-task-coordination | 0 | 0 | ⬜ NOT PLANNED | ✓ |
| CP-PTY-04-cross-cutting-shell-integration | 0 | 0 | ⬜ NOT PLANNED | ✓ |
| CP-ST-01-session-tracker-revamp | 3 | 0 | 🔵 PLANNED | ✓ |
| MCM-01-agent-migration | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| MCM-02-skill-migration | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SC-PTY-01-read-only-terminal-projection | 0 | 0 | ⬜ DEFERRED | ✓ |
| SR-00-preparation-safety-net | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-01-leaf-modules-to-shared | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-02-persistence-journal-to-task-management | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-03-delegation-concurrency-to-coordination | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-04-features-to-features-plane | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-05-config-to-config-realm | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-06-routing-to-routing-plane | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-07-hooks-reorganization | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-08-tools-reorganization | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-09-plugin-composition-root-update | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |
| SR-10-cleanup-agents-md-updates | 0 | 0 | ✅ COMPLETE | ⚠ No SUMMARY |

---

## AGENTS.md Existence Audit

| Path | Exists | Stale References Found | Action |
|------|--------|----------------------|--------|
| AGENTS.md | YES | Claims "src/lib/ has been removed" — confirmed accurate. Claims 31 phases, 89 agents, 59 skills — needs audit against live counts. | Verify agent/skill counts (89 agents CONFIRMED; skills count needs update to ~58 shipped) |
| src/AGENTS.md | YES | Post-SR: references `src/lib/` removal confirmed | Verify SR restructuring references accurate |
| .opencode/AGENTS.md | YES | "89 agents", "59 skills", "19 commands" — agents=89 CONFIRMED, skills=125, commands=19 CONFIRMED | Update skills count (125 dirs, ~58 shipped) |
| .planning/AGENTS.md | YES | References SR restructuring complete — confirmed | Verify phase context section up to date |
| .hivemind/AGENTS.md | YES | Needs audit for state directory count (11 not 19) | Update state dir references |
| .hivefiver-meta-builder/AGENTS.md | YES | Needs audit | Verify meta-builder source references |
| tests/AGENTS.md | YES | Needs audit for test count (149 files, 1978 cases) | Update test count claims |

---

## Summary

- **Total claims verified:** 27 (S-01 through S-13, P-01 through P-10, R-01 through R-03, Q-01)
- **STALE claims (correction needed):** 18 (S-01, S-02, S-04, S-05, S-06, S-08, S-10, S-11, S-13, P-01, P-02, P-03, P-04, P-05, P-07, P-09, R-02, R-03, Q-01)
- **CONFIRMED claims (accurate):** 6 (S-03, S-07, S-09, S-12, P-06, P-08)
- **FALSE claims:** 1 (R-01 — GOV-01/CP-ST-02 not actually in ROADMAP table)
- **UNVERIFIED claims (per D-06):** 1 (P-10 — hook types count needs deeper analysis)
- **ROADMAP missing rows:** GOV-01 (Phase 11), CP-ST-02 (Phase 12)
- **Files with no VERIFICATION.md:** 30 out of 31 phase dirs (only CP-PTY-00 has one)
- **Files with no SUMMARY.md:** 22 out of 31 phase dirs have 0; only BOOT-02 (6) and CP-ST-01 (3) have them
- **Key finding:** STATE.md frontmatter progress bar is severely stale (90% claimed vs ~32% actual)

*Generated by Phase 11 Plan 01 Task 2. Per D-14: live evidence wins over artifact claims.*
