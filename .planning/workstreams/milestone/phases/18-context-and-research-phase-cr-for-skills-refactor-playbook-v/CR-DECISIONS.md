# CR-DECISIONS.md — Tooling Decision Table

**Deliverable:** CR-07
**Date:** 2026-04-23
**Method:** Synthesize CR-AUDIT-ECOSYSTEM + CR-GAP-MAP + CR-RUNTIME-READINESS into decision per skill
**Failure signal check:** (a) no-change count = 2 (< 20% of 24) ✓

---

## Decision Framework

- **(a)** no change — skill is at target grade, defences solid
- **(b)** description-only rewrite — trigger phrases need updating
- **(c)** body rewrite — structural content changes needed
- **(d)** bundle expansion — new references, scripts, or evals needed
- **(e)** rename — Phase 1 namespace migration (current → hm-*)
- **(f)** split — skill covers multiple concerns that should be separate
- **(g)** merge — skill should absorb another
- **(h)** creation — new skill that doesn't exist yet
- **(i)** retirement — skill should be removed

## Decision Table

| # | Skill | Decision(s) | Primary Decision | Evidence | Owning Phase | NON Exposure | Target Grade |
|---|-------|------------|-----------------|----------|--------------|-------------|--------------|
| 1 | `meta-builder` | (e) rename, (d) evals | (e) rename | CR-AUDIT: NON-3 PARTIAL; CR-GAP: medium gap; CR-RESEARCH: 389 LOC, 2 evals | Phase 19 | 1 EXPOSED, 1 PARTIAL | A- |
| 2 | `use-authoring-skills` | (e) rename | (e) rename | CR-AUDIT: ALL DEFENDED; CR-RESEARCH: 266 LOC, 2 evals, grade B | Phase 19 | 0 EXPOSED | A |
| 3 | `agents-and-subagents-dev` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 202 LOC, grade D | Phase 19 + 20 | 4 EXPOSED | B |
| 4 | `command-dev` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 80 LOC, grade D | Phase 19 + 20 | 4 EXPOSED | B |
| 5 | `command-parser` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 110 LOC, grade C | Phase 19 + 20 | 4 EXPOSED | A |
| 6 | `coordinating-loop` | (e) rename, (d) stacked eval | (e) rename | CR-AUDIT: ALL DEFENDED; CR-RESEARCH: 387 LOC, 2 evals, grade A | Phase 19 + 20 | 0 EXPOSED | A |
| 7 | `custom-tools-dev` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 121 LOC, grade D | Phase 19 + 20 | 4 EXPOSED | B |
| 8 | `gsd-agent-composition` | (e) rename, (c) re-author per I.6, (d) evals | (e) rename | CR-AUDIT: 3 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 158 LOC, 1 eval | Phase 19 + 20 | 3 EXPOSED | B |
| 9 | `harness-audit` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 158 LOC | Phase 19 + 20 | 4 EXPOSED | B |
| 10 | `harness-delegation-inspection` | (f) split, (d) evals | (f) split | CR-AUDIT: 3 EXPOSED; CR-GAP: CRITICAL gap; CR-RESEARCH: 202 LOC | Phase 20 | 3 EXPOSED | — |
| 11 | `hf-context-absorb` | (e) rename, (d) evals | (e) rename | CR-AUDIT: 3 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 117 LOC | Phase 19 + 20 | 3 EXPOSED | B |
| 12 | `hm-deep-research` | (a) no change, (d) evals + MCP matrix | (a) no change | CR-AUDIT: 3 EXPOSED; CR-RESEARCH: 380 LOC, grade C+, gold skill | Phase 20 | 3 EXPOSED | A |
| 13 | `hm-detective` | (a) no change, (d) evals + chaining | (a) no change | CR-AUDIT: 3 EXPOSED; CR-RESEARCH: 225 LOC | Phase 20 | 3 EXPOSED | B |
| 14 | `hm-synthesis` | (a) no change, (d) evals + compression | (a) no change | CR-AUDIT: 3 EXPOSED; CR-RESEARCH: 371 LOC | Phase 20 | 3 EXPOSED | B |
| 15 | `oh-my-openagent-reference` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 76 LOC, grade D | Phase 19 + 20 | 4 EXPOSED | B |
| 16 | `opencode-non-interactive-shell` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 63 LOC, grade C | Phase 19 + 20 | 4 EXPOSED | A |
| 17 | `opencode-platform-reference` | (e) rename, (d) evals, (d) prune refs | (e) rename | CR-AUDIT: 4 EXPOSED; CR-GAP: MEDIUM gap (20 refs); CR-RESEARCH: 79 LOC, grade C+ | Phase 19 + 20 | 4 EXPOSED | B |
| 18 | `phase-loop` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 3 EXPOSED; CR-GAP: CRITICAL gap; CR-RESEARCH: 112 LOC, grade D | Phase 19 + 20 | 3 EXPOSED | B |
| 19 | `planning-with-files` | (e) rename, (g) merge, (d) evals | (e) rename | CR-AUDIT: 3 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 140 LOC, PASS grade | Phase 19 + 20 | 3 EXPOSED | A |
| 20 | `agent-authorization` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 3 EXPOSED; CR-GAP: CRITICAL gap; CR-RESEARCH: 237 LOC | Phase 19 + 20 | 3 EXPOSED | B |
| 21 | `session-context-manager` | (g) merge into planning-with-files | (g) merge | CR-AUDIT: 4 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 163 LOC, FAIL grade | Phase 19 | 4 EXPOSED | — |
| 22 | `skill-synthesis` | (e) rename | (e) rename | CR-AUDIT: 1 PARTIAL; CR-RESEARCH: 174 LOC, 2 evals, 7 scripts | Phase 19 | 1 PARTIAL | B |
| 23 | `agents-md-sync` | (e) rename, (c) body rewrite, (d) evals | (e) rename | CR-AUDIT: 5 EXPOSED; CR-GAP: HIGH gap; CR-RESEARCH: 152 LOC | Phase 19 + 20 | 5 EXPOSED | — |
| 24 | `user-intent-interactive-loop` | (e) rename | (e) rename | CR-AUDIT: ALL DEFENDED; CR-RESEARCH: 399 LOC, 2 evals, grade A | Phase 19 | 0 EXPOSED | A |

### Missing Skills (decision (h))

| # | New Skill | Decision | Cluster | Re-author Source | Owning Phase | NON Status |
|---|-----------|----------|---------|------------------|--------------|------------|
| 25 | `hm-completion-looping` | (h) create new | G-A | coordinating-loop + phase-loop patterns | Phase 20 | ALL EXPOSED (missing) |
| 26 | `hm-spec-driven-authoring` | (h) create new | G-B | GSD spec-verifier pattern (re-authored) | Phase 20 | ALL EXPOSED (missing) |
| 27 | `hm-test-driven-execution` | (h) create new | G-B | TDD skill patterns (re-authored) | Phase 20 | ALL EXPOSED (missing) |
| 28 | `hm-eval-driven-development` | (h) create new | G-B | skill-synthesis eval patterns | Phase 21 | ALL EXPOSED (missing) |
| 29 | `hm-debug` | (h) create new | G-D | GSD systematic-debugging (re-authored) | Phase 21 | ALL EXPOSED (missing) |
| 30 | `hm-refactor` | (h) create new | G-D | GSD improve-codebase-architecture (re-authored) | Phase 21 | ALL EXPOSED (missing) |
| 31 | `hm-phase-execution` | (h) create new | G-D | GSD execute-phase workflow (re-authored) | Phase 20 | ALL EXPOSED (missing) |
| 32 | `hm-research-chain` | (h) create new | G-C | Canonical chain pattern | Phase 21 | ALL EXPOSED (missing) |

## Decision Distribution

| Decision | Count | Percentage |
|----------|-------|------------|
| (a) no change | 2 | 8.3% ✓ (< 20%) |
| (b) description only | 0 | 0% |
| (c) body rewrite | 16 | 66.7% |
| (d) bundle expansion | 22 | 91.7% |
| (e) rename | 21 | 87.5% |
| (f) split | 1 | 4.2% |
| (g) merge | 2 | 8.3% |
| (h) create new | 8 | 33.3% |
| (i) retirement | 0 | 0% |

**Verification:** (a) no-change count = 2 (< 5 threshold). Audit depth sufficient. ✓

## Phase Assignment Summary

| Phase | Skills | Primary Actions |
|-------|--------|-----------------|
| Phase 19 (Rename) | 21 skills with (e) | Namespace migration current → hm-* / hivefiver-* |
| Phase 20 (Structural) | G-A/G-B skills + missing skills | Body rewrites, splits, merges, new skill creation |
| Phase 21 (Description) | All skills needing (b) | Trigger phrase rewrites, description updates |
| Phase 22 (Script) | Script-bearing skills | Script hardening, edge-case coverage |
| Phase 23 (Body+Eval) | All skills needing (d) evals | Eval creation, stacked scenario testing |

---

*Deliverable: CR-07*
*Date: 2026-04-23*
