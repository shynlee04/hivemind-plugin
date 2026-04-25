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

Score labels are restricted to `PASS`, `PARTIAL`, and `FAIL`. Evidence summarizes the current package metrics plus Phase 18 gap lineage where applicable; existence alone is never treated as quality closure.

| Skill | D1 Trigger | D2 Body | D3 6-NON | D4 Eval | D5 Refs | D6 Integration | D7 Platform | D8 Self-Correction | Evidence |
|-------|------------|---------|----------|---------|---------|----------------|-------------|--------------------|----------|
| `hivefiver-agents-and-subagents-dev` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 202 LOC, 2 refs, 0 evals; Phase 18 predecessor had 4 EXPOSED modes. |
| `hivefiver-command-dev` | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | 80 LOC, 2 refs, 0 evals; Phase 18 command-dev gap remains body/eval-heavy. |
| `hivefiver-context-absorb` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 117 LOC, 4 refs, 0 evals; Phase 18 hf-context-absorb lacked audit/evals. |
| `hivefiver-custom-tools-dev` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 121 LOC, 2 refs, 0 evals; D6 subject matter exists but proof is incomplete. |
| `hivefiver-delegation-gates` | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 249 LOC, 1 ref, 2 scripts, 0 evals; gate behavior lacks stacked validation. |
| `hivefiver-use-authoring-skills` | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | 266 LOC, 12 refs, 2 evals, 8 scripts; strong authoring bundle but no stacked scenario. |
| `hm-agent-composition` | PARTIAL | PARTIAL | FAIL | PARTIAL | PASS | PARTIAL | PARTIAL | PARTIAL | 158 LOC, 6 refs, 1 eval; Phase 18 gsd-agent-composition had context/cycle gaps. |
| `hm-agents-md-sync` | PARTIAL | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | 155 LOC, 0 refs, 0 evals; G-D gap persists without bundle evidence. |
| `hm-command-parser` | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | 114 LOC, 1 ref, 0 evals; Phase 18 command-parser had audit/context/cycle/eval gaps. |
| `hm-completion-looping` | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PARTIAL | PASS | 119 LOC, 2 refs, 1 eval, 1 script; only current `stacked_scenario` carrier. |
| `hm-coordinating-loop` | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | 411 LOC, 4 refs, 2 evals, 8 scripts; Phase 18 predecessor was fully defended but stacked status still needs current proof. |
| `hm-debug` | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 136 LOC, 2 refs, 1 eval, 1 script; post-Phase-18 created skill still needs D1-D8 proof. |
| `hm-deep-research` | PASS | PASS | FAIL | FAIL | PASS | PARTIAL | PARTIAL | PARTIAL | 380 LOC, 6 refs, 0 evals; Phase 18 listed context/cycle/eval gaps. |
| `hm-detective` | PASS | PARTIAL | FAIL | FAIL | PASS | PARTIAL | PARTIAL | PARTIAL | 225 LOC, 6 refs, 0 evals; Phase 18 listed audit/context/eval gaps. |
| `hm-meta-builder` | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PARTIAL | 389 LOC, 8 refs, 2 evals, 6 scripts; Phase 18 cycle hardening remained medium gap. |
| `hm-omo-reference` | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | 76 LOC, 5 refs, 0 evals; reference skill remains thin. |
| `hm-opencode-non-interactive-shell` | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | 65 LOC, 4 refs, 0 evals; portability subject exists but evidence is absent. |
| `hm-opencode-platform-reference` | PARTIAL | FAIL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | 79 LOC, 20 refs, 0 evals; reference-heavy and eval-empty. |
| `hm-opencode-project-audit` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 161 LOC, 1 ref, 2 scripts, 0 evals; audit workflow lacks eval proof. |
| `hm-opencode-project-inspection` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 125 LOC, 3 refs, 1 script, 0 evals; split-lineage validation pending. |
| `hm-phase-execution` | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | 151 LOC, 2 refs, 1 eval, 1 script; recovery guidance exists but D6 proof incomplete. |
| `hm-phase-loop` | PASS | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 127 LOC, 1 ref, 0 evals; Phase 18 critical G-A gap remains quality-open. |
| `hm-planning-with-files` | PASS | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 158 LOC, 3 refs, 0 evals; merged session-context quality not proved. |
| `hm-refactor` | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 121 LOC, 2 refs, 1 eval, 1 script; post-Phase-18 created skill needs deeper proof. |
| `hm-research-chain` | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 113 LOC, 2 refs, 1 eval, 1 script; chain behavior needs stacked eval proof. |
| `hm-skill-synthesis` | PASS | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PARTIAL | 177 LOC, 5 refs, 2 evals, 7 scripts; bundle exists but stacked eval absent. |
| `hm-spec-driven-authoring` | PARTIAL | PARTIAL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 107 LOC, 2 refs, 1 eval, 1 script; G-B existence closed, quality open. |
| `hm-subagent-delegation-patterns` | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 160 LOC, 3 refs, 1 script, 0 evals; split-lineage eval proof missing. |
| `hm-synthesis` | PASS | PASS | FAIL | FAIL | PASS | PARTIAL | PARTIAL | PARTIAL | 371 LOC, 7 refs, 0 evals; Phase 18 context/eval gaps remain. |
| `hm-test-driven-execution` | PARTIAL | PARTIAL | FAIL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 119 LOC, 2 refs, 1 eval, 1 script; G-B existence closed, quality open. |
| `hm-user-intent-interactive-loop` | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | 422 LOC, 5 refs, 2 evals, 5 scripts; strong body, stacked scenario verification pending. |

## Tier Distribution

| Tier | Count | Skills |
|------|-------|--------|
| EXEMPLAR | 0 | None yet; no row currently proves all D1-D8 with stacked eval evidence. |
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

| Gap Group | Phase 18 Finding | Current Phase 26 Evidence | Reconciliation | Future Owner |
|-----------|------------------|---------------------------|----------------|--------------|
| G-A | Guardrail/looping lineage had missing or under-defended completion, phase-loop, delegation, and intent-loop capabilities. | `hm-completion-looping`, `hm-phase-loop`, `hm-subagent-delegation-patterns`, and `hm-user-intent-interactive-loop` now exist, but D4 stacked/eval proof is mostly absent. | Existence is partially closed; quality remains open. | Phase 30 |
| G-B | Spec-driven and test-driven skills were missing. | `hm-spec-driven-authoring` and `hm-test-driven-execution` now exist with 1 eval each, but both remain THIN. | G-B existence is closed, quality is not closed. | Phase 27 |
| G-C | Research/investigation/synthesis lineage lacked context maps, evals, and chained proof. | `hm-deep-research`, `hm-detective`, `hm-synthesis`, and `hm-research-chain` exist, but three of four have zero evals and no stacked proof. | Current inventory does not close research-lineage quality gaps. | Phase 28 |
| G-D | Execution/refactor/debug/platform/configuration lineage had body, cycle, integration, and eval gaps. | `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-planning-with-files`, `hm-command-parser`, and platform skills exist with mixed refs/evals. | Current inventory does not close execution-lineage quality gaps. | Phase 29 |

Phase 22 6-NON scope is absorbed into PLAYBOOK D3.

Phase 23 eval scope is absorbed into PLAYBOOK D4.

existence does not equal quality closure.

## Open Gap Register

| Gap Register Item | Count / Owner | Evidence and Handling |
|-------------------|---------------|-----------------------|
| Phase 18 gaps tracked | 26 Phase 18 gaps tracked | `CR-GAP-MAP.md` contains 26 gap rows across G-A through G-D. |
| Fully resolved by quality evidence | 0 fully resolved by quality evidence | No canonical row currently proves PASS across D1-D8 with stacked eval evidence. |
| G-B ownership | Phase 27 owns G-B quality uplift | G-B existence is closed through current directories, but D1-D8 quality remains open. |
| G-C ownership | Phase 28 owns G-C | Research lineage needs chained evals, context mapping, and reference integration proof. |
| G-D ownership | Phase 29 owns G-D | Execution lineage needs runtime-truthful verification, recovery, and integration proof. |
| G-A ownership | Phase 30 owns G-A | Guardrail lineage needs loop termination, false-completion, and stacked delegation evidence. |

Downstream closure rule: a future phase may mark a gap resolved only when the target skill has current D1-D8 evidence, eval status, reference status, integration notes, platform notes, self-correction notes, and a verification command result in its summary.
