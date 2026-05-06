# CR-AUDIT-ECOSYSTEM.md — Per-Skill 6-NON Audit Grid

**Deliverable:** CR-03
**Date:** 2026-04-23
**Method:** Per-skill body + frontmatter + refs + scripts + evals review against Playbook I.5 criteria

---

## 6-NON Defence Criteria (from Playbook I.5)

| NON | Failure Mode | What to Check |
|-----|-------------|---------------|
| NON-1 | Non-audit | Does skill body cite a pre-authoring audit or parent→child→state→stage map? |
| NON-2 | Non-contextual | Does skill have "stacks with / clashes with" section or delta-map vs nearest sibling? |
| NON-3 | Non-cycles | Does skill body include entry trigger, exit criterion, loop-back path? |
| NON-4 | Non-hierarchy | Does frontmatter declare metadata.layer AND does description contain exclusion? |
| NON-5 | Non-ecosystem-eval | Does skill have stacked eval scenario (not just isolated trigger-query evals)? |
| NON-6 | Non-systematic-pattern | Is pattern decision documented? Body size appropriate? Scripts deterministic? |

## Audit Grid

| # | Skill | NON-1 | NON-2 | NON-3 | NON-4 | NON-5 | NON-6 | Cluster(s) | Grade | Decision |
|---|-------|-------|-------|-------|-------|-------|-------|------------|-------|----------|
| 1 | `agent-authorization` | DEFENDED [2 hits: audit refs] | EXPOSED [0 hits: no stacks/clashes] | DEFENDED [5 hits: exit/handoff] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [237 LOC, 1 ref, 2 scripts] | G-A | — | (e) rename |
| 2 | `agents-and-subagents-dev` | DEFENDED [1 hit: audit] | DEFENDED [1 hit: contextual] | DEFENDED [4 hits: entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [202 LOC, 2 refs] | G-D | D | (e) rename |
| 3 | `agents-md-sync` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [152 LOC, 0 refs, 0 scripts] | G-D | — | (e) rename |
| 4 | `command-dev` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [1 hit: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [80 LOC, 2 refs] | G-D | D | (e) rename |
| 5 | `command-parser` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [110 LOC, 1 ref] | G-D | C | (e) rename |
| 6 | `coordinating-loop` | DEFENDED [4 hits: audit evidence] | DEFENDED [4 hits: stacks/clashes] | DEFENDED [23 hits: entry/exit/loop-back] | DEFENDED [layer declared] | DEFENDED [2 evals] | DEFENDED [387 LOC, 4 refs, 8 scripts] | G-A | A | (e) rename |
| 7 | `custom-tools-dev` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [121 LOC, 2 refs] | G-D | D | (e) rename |
| 8 | `gsd-agent-composition` | DEFENDED [7 hits: audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | PARTIAL [1 eval, unverified stacked] | DEFENDED [158 LOC, 6 refs, 2 scripts] | G-D | — | (e) rename + (c) body re-author |
| 9 | `harness-audit` | DEFENDED [15 hits: audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [158 LOC, 1 ref, 2 scripts] | G-D | — | (e) rename |
| 10 | `harness-delegation-inspection` | DEFENDED [2 hits: audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [202 LOC, 5 refs] | G-A, G-D | — | (f) split |
| 11 | `hf-context-absorb` | EXPOSED [0 hits: no audit evidence] | DEFENDED [4 hits: contextual] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [117 LOC, 4 refs] | G-C | — | (e) rename |
| 12 | `hm-deep-research` | DEFENDED [3 hits: audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [380 LOC, 6 refs, 0 scripts] | G-C | C+ | (a) no-change |
| 13 | `hm-detective` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [1 hit: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [225 LOC, 6 refs, 0 scripts] | G-C | — | (a) no-change |
| 14 | `hm-synthesis` | DEFENDED [3 hits: audit evidence] | EXPOSED [0 hits: no context map] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [371 LOC, 7 refs, 0 scripts] | G-C | — | (a) no-change |
| 15 | `meta-builder` | DEFENDED [14 hits: audit evidence] | DEFENDED [2 hits: contextual] | PARTIAL [2 hits: minimal cycles] | DEFENDED [layer declared] | DEFENDED [2 evals] | DEFENDED [389 LOC, 8 refs, 6 scripts] | G-D | B+ | (e) rename |
| 16 | `oh-my-openagent-reference` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [76 LOC, 5 refs] | G-C | D | (e) rename |
| 17 | `opencode-non-interactive-shell` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [63 LOC, 4 refs] | G-D | C | (e) rename |
| 18 | `opencode-platform-reference` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | EXPOSED [0 hits: no entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [79 LOC, 20 refs — excessive refs] | G-D | C+ | (e) rename |
| 19 | `phase-loop` | EXPOSED [0 hits: no audit evidence] | DEFENDED [2 hits: contextual] | DEFENDED [7 hits: entry/exit/loop-back] | DEFENDED [layer declared] | EXPOSED [0 evals] | PARTIAL [112 LOC, 1 ref, 0 scripts] | G-A | D | (e) rename |
| 20 | `planning-with-files` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | DEFENDED [5 hits: entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [140 LOC, 2 refs] | G-A, G-D | PASS | (e) rename |
| 21 | `session-context-manager` | EXPOSED [0 hits: no audit evidence] | EXPOSED [0 hits: no context map] | DEFENDED [5 hits: entry/exit] | DEFENDED [layer declared] | EXPOSED [0 evals] | DEFENDED [163 LOC, 2 refs, 1 script] | G-A | FAIL | (g) merge into #20 |
| 22 | `skill-synthesis` | EXPOSED [0 hits: no audit evidence] | DEFENDED [4 hits: contextual] | DEFENDED [5 hits: entry/exit] | DEFENDED [layer declared] | DEFENDED [2 evals] | DEFENDED [174 LOC, 5 refs, 7 scripts] | G-C | — | (e) rename |
| 23 | `use-authoring-skills` | DEFENDED [6 hits: audit evidence] | DEFENDED [8 hits: stacks/clashes] | DEFENDED [13 hits: entry/exit/loop-back] | DEFENDED [layer declared] | DEFENDED [2 evals] | DEFENDED [266 LOC, 12 refs, 8 scripts] | G-D | B | (e) rename |
| 24 | `user-intent-interactive-loop` | DEFENDED [3 hits: audit evidence] | DEFENDED [2 hits: contextual] | DEFENDED [11 hits: entry/exit/loop-back] | DEFENDED [layer declared] | DEFENDED [2 evals] | DEFENDED [399 LOC, 5 refs, 5 scripts] | G-A | A | (e) rename |

## Summary

| Status | Count | Skills |
|--------|-------|--------|
| DEFENDED across all 6 NONs | 3 | coordinating-loop, use-authoring-skills, user-intent-interactive-loop |
| PARTIAL (1-2 EXPOSED) | 8 | meta-builder, skill-synthesis, phase-loop, planning-with-files, agent-authorization, agents-and-subagents-dev, harness-delegation-inspection, session-context-manager |
| EXPOSED (3+ EXPOSED) | 13 | agents-md-sync, command-dev, command-parser, gsd-agent-composition, harness-audit, hf-context-absorb, hm-deep-research, hm-detective, hm-synthesis, oh-my-openagent-reference, opencode-non-interactive-shell, opencode-platform-reference, session-context-manager |

**Note:** Session-context-manager appears in both PARTIAL and EXPOSED due to merge decision (g) — it will be absorbed into planning-with-files.

## Highest-Priority Gaps (by Cluster Priority)

| Rank | Skill | Cluster | Primary NON Gaps | Severity |
|------|-------|---------|-------------------|----------|
| 1 | `phase-loop` | G-A | NON-1 (no audit), NON-5 (no evals) | CRITICAL |
| 2 | `agent-authorization` | G-A | NON-2 (no context map), NON-5 (no evals) | CRITICAL |
| 3 | `harness-delegation-inspection` | G-A | NON-2 (no context map), NON-3 (minimal cycles), NON-5 (no evals) | CRITICAL |
| 4 | `gsd-agent-composition` | G-B-adjacent | NON-2 (no context map), NON-3 (no cycles) | HIGH |
| 5 | `hm-deep-research` | G-C | NON-2 (no context map), NON-3 (no cycles), NON-5 (no evals) | HIGH |
| 6 | `hm-detective` | G-C | NON-1 (no audit), NON-2 (no context map), NON-5 (no evals) | HIGH |
| 7 | `hm-synthesis` | G-C | NON-2 (no context map), NON-3 (minimal cycles), NON-5 (no evals) | HIGH |
| 8 | `planning-with-files` | G-D | NON-1 (no audit), NON-2 (no context map), NON-5 (no evals) | HIGH |
| 9 | `meta-builder` | G-D | NON-3 (minimal cycles) | MEDIUM |
| 10 | `command-parser` | G-D | NON-1 (no audit), NON-2 (no context map), NON-3 (no cycles), NON-5 (no evals) | HIGH |

---

*Deliverable: CR-03*
*Date: 2026-04-23*
