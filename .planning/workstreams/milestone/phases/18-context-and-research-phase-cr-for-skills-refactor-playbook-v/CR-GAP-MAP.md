# CR-GAP-MAP.md — Differential Cluster Gap Map

**Deliverable:** CR-04
**Date:** 2026-04-23
**Method:** Extract EXPOSED/PARTIAL cells from CR-AUDIT-ECOSYSTEM.md, organize by cluster priority

---

## Cluster Priority Order (per Playbook VI.CR.7)

1. **G-A:** Looping / Guardrails / Gatekeeping — HIGHEST
2. **G-B:** Spec-driven + Test-driven — HIGHEST
3. **G-C:** Research / Investigation / Synthesis — HIGH
4. **G-D:** Debug / Refactor / Planning / Execution — HIGH
5. **Non-cluster skills:** MEDIUM (rename/description only)

## Gap Map Table

| # | Cluster | Gap | Affected Skill(s) | NON Mode(s) | Severity | Owning Phase | Evidence | Recommended Action |
|---|---------|-----|--------------------|-------------|----------|--------------|----------|--------------------|
| 1 | G-A | No completion-looping skill | *(entire ecosystem)* | NON-1–NON-6 | CRITICAL | Phase 20 | `ls .opencode/skills/hm-completion-looping/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-completion-looping` from coordinating-loop + phase-loop patterns |
| 2 | G-A | phase-loop has no audit trail | `phase-loop` | NON-1, NON-5 | CRITICAL | Phase 19 | Probe: 0 audit hits, 0 evals | Add audit section + stacked eval in Phase 19 rewrite |
| 3 | G-A | agent-authorization lacks context mapping | `agent-authorization` | NON-2, NON-5 | CRITICAL | Phase 19 | Probe: 0 context-map hits, 0 evals | Add stacks/clashes section + eval in rename phase |
| 4 | G-A | harness-delegation-inspection lacks cycles + context | `harness-delegation-inspection` | NON-2, NON-3, NON-5 | CRITICAL | Phase 20 | Probe: 0 context-map, minimal cycles, 0 evals | Split into `hm-subagent-delegation-patterns` (G-A) + `hm-opencode-project-inspection` (G-D) |
| 5 | G-A | user-intent-interactive-loop missing evals | `user-intent-interactive-loop` | NON-5 | HIGH | Phase 20 | Probe: 2 evals exist but stacked scenario unverified | Verify stacked evals or add new stacked scenario |
| 6 | G-B | No spec-driven-authoring skill | *(entire ecosystem)* | NON-1–NON-6 | CRITICAL | Phase 20 | `ls .opencode/skills/hm-spec-driven-authoring/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-spec-driven-authoring` from GSD spec-verifier pattern (re-authored per I.6) |
| 7 | G-B | No test-driven-execution skill | *(entire ecosystem)* | NON-1–NON-6 | CRITICAL | Phase 20 | `ls .opencode/skills/hm-test-driven-execution/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-test-driven-execution` from TDD skill patterns (re-authored per I.6) |
| 8 | G-B | gsd-agent-composition lacks context + cycles | `gsd-agent-composition` | NON-2, NON-3 | HIGH | Phase 20 | Probe: 0 context-map, 0 cycle hits | Re-author as `hm-agent-composition` with full 6-NON defence |
| 9 | G-C | hm-deep-research missing evals + context | `hm-deep-research` | NON-2, NON-3, NON-5 | HIGH | Phase 21 | Probe: 0 context-map, 0 cycle hits, 0 evals | Add context-map, entry/exit gates, stacked eval with MCP matrix |
| 10 | G-C | hm-detective missing audit + context + evals | `hm-detective` | NON-1, NON-2, NON-5 | HIGH | Phase 21 | Probe: 0 audit, 0 context-map, 0 evals | Add audit evidence, stacks/clashes section, stacked eval for SCAN mode |
| 11 | G-C | hm-synthesis missing context + evals | `hm-synthesis` | NON-2, NON-5 | HIGH | Phase 21 | Probe: 0 context-map, 0 evals | Add context-map and stacked eval for compression tiers |
| 12 | G-C | oh-my-openagent-reference severely underbuilt | `oh-my-openagent-reference` | NON-1, NON-2, NON-3, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 cycles, 0 evals | Rename to `hm-omo-reference` and add full 6-NON defence or retire if patterns salvaged |
| 13 | G-C | hf-context-absorb missing audit + evals | `hf-context-absorb` | NON-1, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 evals | Rename to `hivefiver-context-absorb` and add audit section + eval |
| 14 | G-D | No debug skill | *(entire ecosystem)* | NON-1–NON-6 | HIGH | Phase 21 | `ls .opencode/skills/hm-debug/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-debug` from GSD systematic-debugging + parallel-debugging patterns (re-authored per I.6) |
| 15 | G-D | No refactor skill | *(entire ecosystem)* | NON-1–NON-6 | HIGH | Phase 21 | `ls .opencode/skills/hm-refactor/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-refactor` with surgical vs. structural taxonomy |
| 16 | G-D | No phase-execution skill | *(entire ecosystem)* | NON-1–NON-6 | HIGH | Phase 20 | `ls .opencode/skills/hm-phase-execution/SKILL.md 2>/dev/null || echo "MISSING"` → MISSING | Create `hm-phase-execution` from GSD execute-phase workflow pattern (re-authored per I.6) |
| 17 | G-D | planning-with-files missing audit + context + evals | `planning-with-files` | NON-1, NON-2, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 evals | Rename to `hm-planning-with-files` and add full 6-NON defence |
| 18 | G-D | command-dev severely underbuilt | `command-dev` | NON-1, NON-2, NON-3, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 1 cycle hit, 0 evals | Rename to `hivefiver-command-dev` and expand body with 6-NON defence |
| 19 | G-D | command-parser missing audit + context + cycles | `command-parser` | NON-1, NON-2, NON-3, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 cycles, 0 evals | Rename to `hm-command-parser` and add entry/exit gates |
| 20 | G-D | custom-tools-dev missing audit + context | `custom-tools-dev` | NON-1, NON-2, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 evals | Rename to `hivefiver-custom-tools-dev` and expand |
| 21 | G-D | agents-md-sync missing audit + context + evals | `agents-md-sync` | NON-1, NON-2, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 evals | Rename to `hm-agents-md-sync` and add 6-NON defence |
| 22 | G-D | harness-audit missing context + cycles + evals | `harness-audit` | NON-2, NON-3, NON-5 | HIGH | Phase 19 | Probe: 0 context-map, 0 cycles, 0 evals | Rename to `hm-opencode-project-audit` and add context-map + cycles |
| 23 | G-D | opencode-platform-reference has 20 unused refs | `opencode-platform-reference` | NON-6 | MEDIUM | Phase 19 | Probe: 79 LOC, 20 refs, 0 scripts | Rename to `hm-opencode-platform-reference` and prune unused refs |
| 24 | G-D | opencode-non-interactive-shell missing audit + context + cycles | `opencode-non-interactive-shell` | NON-1, NON-2, NON-3, NON-5 | HIGH | Phase 19 | Probe: 0 audit, 0 context-map, 0 cycles, 0 evals | Rename to `hm-opencode-non-interactive-shell` and add 6-NON defence |
| 25 | G-D | session-context-manager to merge | `session-context-manager` | ALL (merge target) | HIGH | Phase 19 | Decision (g): merge into planning-with-files | Absorb content into `hm-planning-with-files`, retire standalone |
| 26 | G-D | meta-builder needs cycle hardening | `meta-builder` | NON-3 | MEDIUM | Phase 19 | Probe: 2 cycle hits (minimal) | Rename to `hm-meta-builder` and strengthen entry/exit gates |

## Missing Skills Summary

| New Skill | Cluster | Severity | Owning Phase | Re-author Source |
|-----------|---------|----------|--------------|------------------|
| `hm-completion-looping` | G-A | CRITICAL | Phase 20 | coordinating-loop + phase-loop patterns |
| `hm-spec-driven-authoring` | G-B | CRITICAL | Phase 20 | GSD spec-verifier pattern (re-authored) |
| `hm-test-driven-execution` | G-B | CRITICAL | Phase 20 | TDD skill patterns (re-authored) |
| `hm-eval-driven-development` | G-B | HIGH | Phase 21 | Existing eval scaffolding in skill-synthesis |
| `hm-debug` | G-D | HIGH | Phase 21 | GSD systematic-debugging + parallel-debugging (re-authored) |
| `hm-refactor` | G-D | HIGH | Phase 21 | GSD improve-codebase-architecture (re-authored) |
| `hm-phase-execution` | G-D | HIGH | Phase 20 | GSD execute-phase workflow (re-authored) |
| `hm-research-chain` | G-C | MEDIUM | Phase 21 | Canonical chain: detective → deep-research → synthesis → artifact |

## Severity Distribution

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 18 |
| MEDIUM | 4 |
| LOW | 0 |

## Cluster Gap Summary

| Cluster | Gaps | Missing Skills | Critical? |
|---------|------|----------------|-----------|
| G-A | 5 | 1 (hm-completion-looping) | YES |
| G-B | 3 | 2 (hm-spec-driven-authoring, hm-test-driven-execution) | YES |
| G-C | 5 | 1 (hm-research-chain) | NO |
| G-D | 13 | 3 (hm-debug, hm-refactor, hm-phase-execution) | NO |

---

*Deliverable: CR-04*
*Date: 2026-04-23*
