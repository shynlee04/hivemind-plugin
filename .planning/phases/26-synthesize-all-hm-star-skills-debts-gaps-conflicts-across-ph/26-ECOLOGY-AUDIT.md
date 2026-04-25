# Phase 26 Ecology Audit

## Audit Method

This audit inventories the current canonical `.opencode/skills/` directory and includes only skill package basenames that begin with `hm-` or `hivefiver-`. Rows are sorted by basename and deduplicated by basename so stale Phase 18 names cannot inflate coverage.

The audit is read-only against skill packages. Phase 26 writes only planning artifacts. It does not mutate `.opencode/skills/**/SKILL.md`, `src/**`, or IDE sync directories.

Scoring is governed by `26-PLAYBOOK.md` dimensions D1-D8:

- D1 Trigger Accuracy
- D2 Body Depth
- D3 6-NON Defence
- D4 Eval Coverage
- D5 Reference Completeness
- D6 Integration Wiring
- D7 Platform Compatibility
- D8 Self-Correction

## Canonical Inventory

Current canonical inventory command output reports 31 unique `hm-*` / `hivefiver-*` skill directories, 18 directories with zero eval JSON files, and one stacked scenario carrier: `hm-completion-looping`.

| Prefix | Count | Notes |
|--------|-------|-------|
| `hm-` | 25 | Primary Hivemind quality, research, execution, guardrail, and platform skills. |
| `hivefiver-` | 6 | Support authoring/configuration skills that integrate with the hm-* ecosystem. |
| Total | 31 | Deduplicated by current directory basename. |

## Research Count Reconciliation

Phase 26 research reports 31 canonical directories. Old Phase 18 artifacts must not inflate closure because several rows were pre-rename names, merged names, split names, or missing-skill placeholders at that time.

The reconciliation rule for downstream phases is: current directory existence is inventory evidence only. It is not quality evidence and does not close Phase 18 gaps without D1-D8 scoring.

## Summary Statistics

| Metric | Count | Interpretation |
|--------|-------|----------------|
| Canonical `hm-*` rows | 25 | Primary skill ecosystem scope. |
| Canonical `hivefiver-*` rows | 6 | Support skill ecosystem scope. |
| Total canonical rows | 31 | Current deduplicated baseline. |
| Rows with zero eval JSON files | 18 | D4 remains the dominant ecosystem gap. |
| Rows with stacked scenarios | 1 | Only `hm-completion-looping` currently carries stacked-scenario evidence. |
| Rows with scripts | 14 | Script-bearing rows need deterministic helper checks in later phases. |

## Full Skill Inventory

| Skill | Prefix | LOC | References | Evals | Scripts | Cluster | Current Tier | Open Gaps | Priority |
|-------|--------|-----|------------|-------|---------|---------|--------------|-----------|----------|
| `hivefiver-agents-and-subagents-dev` | hivefiver | 202 | 2 | 0 | 0 | G-D support | THIN | D3/D4/D6 evidence gaps; no evals | HIGH |
| `hivefiver-command-dev` | hivefiver | 80 | 2 | 0 | 0 | G-D support | HOLLOW | Thin body, no evals, weak recovery evidence | HIGH |
| `hivefiver-context-absorb` | hivefiver | 117 | 4 | 0 | 0 | G-C support | THIN | No evals; audit/context evidence incomplete | HIGH |
| `hivefiver-custom-tools-dev` | hivefiver | 121 | 2 | 0 | 0 | G-D support | THIN | No evals; integration claims need evidence | HIGH |
| `hivefiver-delegation-gates` | hivefiver | 249 | 1 | 0 | 2 | G-A support | THIN | No evals; gate behavior lacks stacked validation | HIGH |
| `hivefiver-use-authoring-skills` | hivefiver | 266 | 12 | 2 | 8 | G-D support | SUBSTANTIVE | Strong references/scripts; stacked eval still absent | MEDIUM |
| `hm-agent-composition` | hm | 158 | 6 | 1 | 2 | G-D | THIN | Phase 18 context/cycle gaps remain quality risks | HIGH |
| `hm-agents-md-sync` | hm | 155 | 0 | 0 | 0 | G-D | HOLLOW | No refs, no evals, weak ecosystem evidence | HIGH |
| `hm-command-parser` | hm | 114 | 1 | 0 | 0 | G-D | HOLLOW | No evals; cycle/audit/context gaps | HIGH |
| `hm-completion-looping` | hm | 119 | 2 | 1 | 1 | G-A | SUBSTANTIVE | Only stacked-scenario carrier; body depth still modest | HIGH |
| `hm-coordinating-loop` | hm | 411 | 4 | 2 | 8 | G-A | SUBSTANTIVE | Strong body/scripts; verify stacked eval depth | MEDIUM |
| `hm-debug` | hm | 136 | 2 | 1 | 1 | G-D | THIN | Created after Phase 18; quality evidence incomplete | HIGH |
| `hm-deep-research` | hm | 380 | 6 | 0 | 0 | G-C | THIN | No evals; Phase 18 context/cycle gaps remain | HIGH |
| `hm-detective` | hm | 225 | 6 | 0 | 0 | G-C | THIN | No evals; audit/context gaps remain | HIGH |
| `hm-meta-builder` | hm | 389 | 8 | 2 | 6 | G-D | SUBSTANTIVE | Needs stronger cycle/self-correction evidence | MEDIUM |
| `hm-omo-reference` | hm | 76 | 5 | 0 | 0 | G-C | HOLLOW | Thin body; no evals; reference-heavy without proof | HIGH |
| `hm-opencode-non-interactive-shell` | hm | 65 | 4 | 0 | 0 | G-D | HOLLOW | Thin body; no evals; portability needs proof | HIGH |
| `hm-opencode-platform-reference` | hm | 79 | 20 | 0 | 0 | G-D | HOLLOW | Excessive refs, no evals, shallow body | HIGH |
| `hm-opencode-project-audit` | hm | 161 | 1 | 0 | 2 | G-D | THIN | No evals; audit workflow needs stacked proof | HIGH |
| `hm-opencode-project-inspection` | hm | 125 | 3 | 0 | 1 | G-D | THIN | No evals; split-lineage validation pending | HIGH |
| `hm-phase-execution` | hm | 151 | 2 | 1 | 1 | G-D | THIN | Has eval file but needs richer D6/D8 evidence | HIGH |
| `hm-phase-loop` | hm | 127 | 1 | 0 | 0 | G-A | THIN | No evals; Phase 18 critical G-A gap remains quality-open | CRITICAL |
| `hm-planning-with-files` | hm | 158 | 3 | 0 | 0 | G-B/G-D | THIN | No evals; merged-session context quality not proved | HIGH |
| `hm-refactor` | hm | 121 | 2 | 1 | 1 | G-D | THIN | Created after Phase 18; eval depth and integration evidence incomplete | HIGH |
| `hm-research-chain` | hm | 113 | 2 | 1 | 1 | G-C | THIN | Created after Phase 18; chained eval quality incomplete | HIGH |
| `hm-skill-synthesis` | hm | 177 | 5 | 2 | 7 | G-C | SUBSTANTIVE | Good bundle shape; stacked scenario still absent | MEDIUM |
| `hm-spec-driven-authoring` | hm | 107 | 2 | 1 | 1 | G-B | THIN | Existence closed, D1-D8 quality not closed | CRITICAL |
| `hm-subagent-delegation-patterns` | hm | 160 | 3 | 0 | 1 | G-A | THIN | No evals; split-lineage validation pending | HIGH |
| `hm-synthesis` | hm | 371 | 7 | 0 | 0 | G-C | THIN | No evals; Phase 18 context/eval gaps remain | HIGH |
| `hm-test-driven-execution` | hm | 119 | 2 | 1 | 1 | G-B | THIN | Existence closed, D1-D8 quality not closed | CRITICAL |
| `hm-user-intent-interactive-loop` | hm | 422 | 5 | 2 | 5 | G-A | SUBSTANTIVE | Strong body; stacked scenario still needs verification | MEDIUM |

## 8-Dimension Score Matrix

Task 2 will replace this placeholder with the D1-D8 PASS/PARTIAL/FAIL matrix. This section exists in Task 1 so the artifact shell matches the required ecology-audit structure before scoring is populated.

## Tier Distribution

| Tier | Count | Skills |
|------|-------|--------|
| EXEMPLARY | 0 | None yet; no row currently proves all D1-D8 with stacked eval evidence. |
| SUBSTANTIVE | 6 | `hivefiver-use-authoring-skills`, `hm-completion-looping`, `hm-coordinating-loop`, `hm-meta-builder`, `hm-skill-synthesis`, `hm-user-intent-interactive-loop` |
| THIN | 19 | Most current packages have useful structure but lack complete D1-D8 proof. |
| HOLLOW | 6 | `hivefiver-command-dev`, `hm-agents-md-sync`, `hm-command-parser`, `hm-omo-reference`, `hm-opencode-non-interactive-shell`, `hm-opencode-platform-reference` |

## Priority Queue

| Rank | Skill(s) | Reason | Owning Future Phase |
|------|----------|--------|---------------------|
| 1 | `hm-spec-driven-authoring`, `hm-test-driven-execution` | G-B demonstration skills exist but quality closure is still open. | Phase 27 |
| 2 | `hm-phase-loop`, `hm-completion-looping`, `hm-subagent-delegation-patterns`, `hm-user-intent-interactive-loop` | Guardrail lineage controls loop termination and false-completion prevention. | Phase 30 |
| 3 | `hm-deep-research`, `hm-detective`, `hm-synthesis`, `hm-research-chain` | Research lineage needs evals and context-chain evidence. | Phase 28 |
| 4 | `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-planning-with-files` | Execution lineage needs runtime-truthful verification and recovery evidence. | Phase 29 |
| 5 | `hivefiver-*` support rows | Authoring/configuration support must align with the same D1-D8 standard. | Phase 27-30 support work |

## Phase 18 Decision Reconciliation

Task 2 will populate this section with G-A through G-D reconciliation details.

## Open Gap Register

Task 2 will populate this section with Phase 18 gap counts and future ownership.
