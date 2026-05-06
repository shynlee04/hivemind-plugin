# hm-* Skills RICH Gate Audit Report

**Audit Date:** 2026-04-27
**Auditor:** gsd-code-reviewer (subagent)
**Scope:** All 24 hm-* skills in .opencode/skills/
**Methodology:** Read every SKILL.md file from disk, verified bundled resources via filesystem, evaluated against RICH-1 through RICH-8 criteria from .planning/RICH-SKILL-QUALITY-GATE.md

---

## Summary

| Metric | Count |
|--------|-------|
| Total hm-* skills audited | 24 |
| RICH-PASS | **0** |
| RICH-FAIL | **0** |
| RICH-BLOCKED | **0** |
| RICH-PARTIAL | **8** (have some explicit evidence but incomplete) |
| RICH-UNEVALUATED | **16** (no explicit RICH evidence beyond what is inferred) |

**Key finding:** No hm-* skill achieves full RICH-PASS across all 8 gates. Eight skills have partial, self-documented RICH evidence. The remaining 16 have no explicit RICH gate evidence packet per the format specified in RICH-SKILL-QUALITY-GATE.md (lines 36-81). Most skills have cross-references, bundled resources, and some third-party lineage mentions in their SKILL.md body, but these are not structured as formal RICH evidence packets.

---

## Per-Skill Details

### hm-agent-composition
**RICH Classification:** Reference (teaches composition patterns; no third-party sources reviewed)
**SKILL.md lines:** 158 | **Bundled Resources:** 6 references, 1 assets/templates, 1 examples, 2 scripts, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | No third-party source review. No skills.sh/GitHub search evidence. No mention of inspected third-party sources. |
| RICH-2 | FAIL | metadata.pattern = "P2" declared but no documented alternatives or adoption decisions. No Pattern-1/2/3 decision record. |
| RICH-3 | PASS | Cross-refs to other agents (24 GSD agent names at lines 43-59). References `.opencode/agents/` and `.claude/skills/` discovery chain. |
| RICH-4 | FAIL | No routing across how-to-process/hierarchy groups. No handoff/refusal rules. |
| RICH-5 | PASS | Non-generic bundled resources: 6 domain-specific references (xml-markup.md, step-protocols.md, etc.), 2 scripts, worked example. |
| RICH-6 | BLOCKED | Heavy dependency on GSD patterns (24 GSD agent names). Discovery chain references `.claude/skills/` which may not exist in arbitrary OpenCode projects. |
| RICH-7 | FAIL | No gap documentation section. Missing skills/agents not documented. |
| RICH-8 | FAIL | No skill-judge scorecard with D1-D8 scores. No bundled `metrics/` directory. |

**Missing:** Third-party source review, pattern decision record, gap documentation, independent scorecard.
**Cross-references to other skills:** None (references agents, not other skills).

---

### hm-agents-md-sync
**RICH Classification:** Rich (domain-execution workflow; produces structured drift reports)
**SKILL.md lines:** 155 | **Bundled Resources:** 1 reference, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | No third-party source evidence. No skills.sh/GitHub search results cited. |
| RICH-2 | FAIL | metadata.pattern = "scan-diff-apply" is a custom pattern. No P1/P2/P3 third-party alternatives documented. |
| RICH-3 | PASS | Cross-refs at line 36: references `create-agentsmd` skill. Domain-scoped to AGENTS.md files. |
| RICH-4 | FAIL | No routing table or handoff/refusal rules. No sibling skill coordination. |
| RICH-5 | FAIL | Minimal bundled resources: 1 reference (rich-resource-rationale.md), 1 eval json, 1 validate script. Reference file appears to be placeholder. |
| RICH-6 | BLOCKED | Phase 1 scan targets hardcode `src/lib/*.ts`, `src/tools/`, `src/hooks/` — these are specific to this harness repo (lines 48-55). Assumes this project's structure. |
| RICH-7 | FAIL | No gap documentation. Missing meta-concepts not documented. |
| RICH-8 | FAIL | No skill-judge scorecard metrics. |

**Missing:** Third-party review, independence from this repo, bundled resources, gap documentation, scorecard.
**Severity:** This skill is heavily hardcoded to the harness project structure. It cannot function in arbitrary OpenCode projects.

---

### hm-command-parser
**RICH Classification:** Rich (domain-execution; parses $ARGUMENT strings)
**SKILL.md lines:** 114 | **Bundled Resources:** 2 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | No third-party source review. |
| RICH-2 | FAIL | metadata.pattern = "P2" declared but no alternatives documented. |
| RICH-3 | PASS | Integrates with OpenCode command architecture ($ARGUMENTS, non-interactive shell compliance at line 114). |
| RICH-4 | FAIL | No routing to/from other skills. |
| RICH-5 | FAIL | 2 references (parsing-rules.md, rich-resource-rationale.md), 1 eval json, 1 validate script. Limited domain-specific depth. |
| RICH-6 | PASS | Self-contained parsing logic. No GSD/BMAD/OMO dependencies. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Third-party review, pattern decision, routing, gap docs, scorecard.

---

### hm-completion-looping
**RICH Classification:** Rich (domain-execution; guardrail/verification enforcement)
**SKILL.md lines:** 149 | **Bundled Resources:** 3 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | "Rich Guardrail Lineage" (lines 47-55) cites LangGraph, AutoGen, and OpenAI guardrails as third-party patterns. Names sources with local adaptations. |
| RICH-2 | PARTIAL | Adapts LangGraph durable execution, AutoGen termination predicates, and OpenAI guardrails — documented decision per source. |
| RICH-3 | PASS | Cross-references hm-coordinating-loop, hm-phase-loop, hm-planning-with-files (lines 143-149). |
| RICH-4 | PASS | Explicit boundary clarifications with related skills (lines 143-149). Defines handoff rules. |
| RICH-5 | PASS | 3 references (verification-checklist.md, loop-patterns.md, durable-completion-cursors.md), 1 eval. Non-generic, domain-specific content. |
| RICH-6 | FAIL | No independence notes. Assumes task_plan.md from planning-with-files. No adapter for non-GSD projects. |
| RICH-7 | FAIL | No gap documentation section. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Independence audit, gap documentation, scorecard.

---

### hm-coordinating-loop
**RICH Classification:** Rich (coordinator; multi-agent orchestration)
**SKILL.md lines:** 438 | **Bundled Resources:** 5 references, 9 scripts, 2 evals

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | "Rich Coordination Guardrails" (lines 70-82) cites deterministic workflow agent, per-edge guardrails, handoff metadata, and trace/evidence span patterns. Adapts from third-party patterns but specific source repos not cited. |
| RICH-2 | PARTIAL | Documents adaptation patterns but doesn't name specific source repos. |
| RICH-3 | PASS | Extensive cross-references (lines 413-421) to dispatching-parallel-agents, user-intent-interactive-loop, planning-with-files, phase-loop, agents-and-subagents-dev, hm-subagent-delegation-patterns. |
| RICH-4 | PASS | Strong routing: hierarchy enforcement (LAYER 3), prerequisite loading chain, handoff protocols, gate enforcement scripts. |
| RICH-5 | PASS | Heavy bundled resources: 5 references, 9 scripts (all functional: check-gate.sh, coordination-check.sh, validate-envelope.sh, etc.). No placeholder scripts. |
| RICH-6 | BLOCKED | Uses `.coordination/` directories, `.opencode/state/loaded-skills.json`, references `.opencode/get-shit-done/references/` (GSD-specific path at line 43). Strongly coupled to GSD/planning-with-files framework. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Specific third-party source citations, independence from GSD, gap docs, scorecard.

---

### hm-debug
**RICH Classification:** Rich (domain-execution; systematic debugging)
**SKILL.md lines:** 169 | **Bundled Resources:** 2 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | "RICH Gate Source Decisions" (lines 134-140) explicitly cites NousResearch/hermes-agent and addyosmani/agent-skills. Documents ADOPT/ADAPT decisions with local transformations. |
| RICH-2 | PASS | Three explicit source decisions: ADOPT (NousResearch), ADAPT (addyosmani), ADAPT (GitHub resource model). |
| RICH-3 | PASS | Cross-refs hm-detective, hm-synthesis, hm-planning-with-files (lines 163-169). |
| RICH-4 | PASS | Boundary clarifications with each related skill. |
| RICH-5 | PASS | 2 references (debug-state-machine.md, evidence-framework.md), 1 eval. Domain-specific debugging protocol with stop-the-line entry gate. |
| RICH-6 | PASS | "Independence Notes" (lines 142-144) explicitly states default path is `.debug/<bug-id>.md` in end-user project, with adapter notes for existing conventions. "Do not assume GSD, BMAD." |
| RICH-7 | FAIL | No explicit gap documentation section. |
| RICH-8 | FAIL | No skill-judge scorecard. Evals/evals.json exists but no D1-D8 + RICH scorecard. |

**Missing:** Gap documentation, RICH-8 scorecard. This is one of the strongest hm-* skills.

---

### hm-deep-research
**RICH Classification:** Rich (research; evidence gathering)
**SKILL.md lines:** 406 | **Bundered Resources:** 6 references, 2 templates, 1 workflow, 1 script, 1 eval, 1 metrics/rich-gate-scorecard.md

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | metrics/rich-gate-scorecard.md: "Phase 28 research reviewed parallel-deep-research, qodex deep-research-agent, lingzhi deep-research; skills.volces remains blocked." Specific sources named. |
| RICH-2 | PARTIAL | Scorecard: "Sequential gates, source evaluation, contradiction matrix, provenance added." |
| RICH-3 | PASS | Strong cross-references: hm-detective via execution_context (line 32), hm-synthesis via execution_context (line 35). Tool matrix and version matching. |
| RICH-4 | PASS | Loads hm-detective for reading modes, hm-synthesis for export; clear chain orchestration. |
| RICH-5 | PASS | Substantial bundled resources: 6 domain-specific references, 2 templates (source-evaluation.md, contradiction-matrix.md), workflow, eval. `scripts/.gitkeep` is placeholder but overall package is rich. |
| RICH-6 | BLOCKED | No independence notes section. Tool Quick Reference uses OpenCode/harness-specific tool names (tavily-*, context7, repomix). Tech-registry.json path assumed. |
| RICH-7 | FAIL | Source gap acknowledged (skills.volces.com inaccessible) in scorecard, but no comprehensive gap documentation in SKILL.md. |
| RICH-8 | PARTIAL | metrics/rich-gate-scorecard.md exists but only covers RICH-1, RICH-2, RICH-5, RICH-7. Missing D1-D8 scores. Exit decision: "BLOCKED/PARTIAL, pending independent RICH + D1-D8 scoring." |

**Existing self-assessment:** "BLOCKED/PARTIAL, pending independent RICH + D1-D8 scoring."

---

### hm-detective
**RICH Classification:** Rich (investigation; codebase navigation)
**SKILL.md lines:** 238 | **Bundled Resources:** 6 references, 1 template, 1 script, 1 eval, 1 metrics/rich-gate-scorecard.md

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | metrics/rich-gate-scorecard.md: "Phase 28 research reviewed investigating-a-codebase, investigate, error-detective/debugger." |
| RICH-2 | PARTIAL | Scorecard: "Added assumption verification and scoped not-found reporting." |
| RICH-3 | PASS | Cross-refs hm-synthesis, hm-deep-research; document pipeline (lines 187-207); swarm recovery references 5 parallel agents. |
| RICH-4 | PASS | Three reading modes (SKIM/SCAN/DEEP) with escalation rules. Mode selection decision tree (lines 53-68). |
| RICH-5 | PASS | 6 domain-specific references, template, eval. Strong domain material (token-budget.md, reading-modes.md, swarm-recovery.md). |
| RICH-6 | PARTIAL | No explicit independence notes. Tech-registry references (`.tech-registry.json`) are project-relative. LSP-aware edit protocol is general but some paths may be project-specific. |
| RICH-7 | FAIL | Scorecard says "Log/debug-specific patterns deferred as narrower than baseline detective scope" — not comprehensive. |
| RICH-8 | PARTIAL | metrics/rich-gate-scorecard.md: "PARTIAL, pending independent RICH + D1-D8 scoring." |

---

### hm-meta-builder
**RICH Classification:** Rich (router; intent classification and delegation)
**SKILL.md lines:** 389 | **Bundered Resources:** 8 references, 3 assets, 3 workflows, 6 scripts, 2 evals, graph + state files

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | References "agentskills.io specification" (line 35) and deferred "Pattern Research" (line 371) but no third-party skill review as evidence. |
| RICH-2 | FAIL | metadata.pattern = "Navigation" declared but no documented alternatives. |
| RICH-3 | PASS | Excellent cross-references: extensive routing table (lines 291-311), stacking recipes (lines 316-324), reference map (lines 349-365). |
| RICH-4 | PASS | Strong routing: exact specialist skill-to-agent mapping for each intent. Clear handoff points (lines 291-311). |
| RICH-5 | PASS | Heavy bundled resources: 8 references, 3 frontmatter assets, 3 workflows, 6 scripts (functional: graph-traverse.sh, route-check.sh, validate-graph.sh), evals, graph state. |
| RICH-6 | BLOCKED | Entirely coupled to this project: `.hivefiver-meta-builder/**-lab/` paths (lines 37-41), `.hivefiver-meta-builder/` directory structure (lines 80-89), specific agent names (hivefiver-skill-author, hivefiver-agent-builder, etc.). |
| RICH-7 | FAIL | "Pattern Research (Deferred)" (line 371) but no comprehensive gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Third-party evidence, independence from this repo, gap docs, scorecard.
**Severity:** Most tightly coupled to this repository's structure and agent ecosystem.

---

### hm-omo-reference
**RICH Classification:** Reference (packed oh-my-openagent architecture reference)
**SKILL.md lines:** 76 | **Bundled Resources:** 5 references (repomix-generated)

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | References oh-my-openagent but this is a repomix pack of a known repo, not a third-party skills review. No skills.sh/GitHub search evidence. |
| RICH-2 | FAIL | metadata.pattern = "P2" but no alternatives documented. |
| RICH-3 | FAIL | No cross-references to other skills. Standalone reference with no integration wiring. |
| RICH-4 | FAIL | No routing. Pure reference material. |
| RICH-5 | PASS | 5 repomix-generated references (summary, project-structure, tech-stack, files, full XML). Content is non-trivial original packed source. |
| RICH-6 | UNKNOWN | Metadata `context-bomb: true` (line 9). As a reference skill it's inherently portable, but no explicit independence audit. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Third-party synthesis, pattern decisions, integration, gaps, scorecard.
**Note:** As a pure reference skill, many RICH gates are inherently not applicable (no workflow behavior).

---

### hm-opencode-non-interactive-shell
**RICH Classification:** Rich (reference/domain-execution; shell safety)
**SKILL.md lines:** 89 | **Bundled Resources:** 5 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | "RICH Gate Source Decisions" (lines 73-79) explicitly cites: garagon/nanostack (ADAPT), Hermes OpenCode search evidence (REPLACED — not inspectable), OpenCode official docs (ADAPT). Replacement evidence path documented. |
| RICH-2 | PASS | Three explicit decisions: ADAPT nanostack, REPLACED Hermes, ADAPT OpenCode docs. Each with local transformation described. |
| RICH-3 | PASS | Cross-refs: command-dev, opencode-platform-reference (lines 86-89). |
| RICH-4 | PASS | Boundaries with command-dev and opencode-platform-reference clearly stated. |
| RICH-5 | PASS | 5 references (command-tables.md, env-variables.md, cognitive-patterns.md, prompt-handling.md, source-evidence.md), 1 eval. Domain-specific, non-generic content. |
| RICH-6 | PASS | "Independence Notes" (lines 81-82): "This skill applies to arbitrary shell-capable OpenCode projects. Must not assume GNU-only flags on macOS/BSD. Do not assume HiveMind state paths." |
| RICH-7 | FAIL | No gap documentation section. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Gap documentation, scorecard. One of the stronger skills overall.

---

### hm-opencode-platform-reference
**RICH Classification:** Reference (OpenCode platform documentation index)
**SKILL.md lines:** 104 | **Bundled Resources:** 24 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | "RICH Gate Source Decisions" (lines 59-65): ADOPT OpenCode official docs, ADAPT GitHub agent skill resource model, ADAPT local repomix OpenCode pack. Source freshness gate at lines 20-22. |
| RICH-2 | PASS | Three source decisions documented. |
| RICH-3 | PASS | Cross-refs: command-dev, opencode-non-interactive-shell, meta-builder (lines 100-104). "Source Freshness Gate" at line 20. |
| RICH-4 | PASS | Routing by topic via reference table (lines 27-48). Integration with meta-builder for platform lookups. |
| RICH-5 | PASS | 24 reference files covering all OpenCode platform surfaces. Content sourced from official docs and repomix source pack. Non-trivial. |
| RICH-6 | PASS | "Independence Notes" (lines 68-69): "This reference skill must work outside this repository. Avoid local project paths in guidance except examples marked as examples." |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Gap documentation, scorecard. Strong reference skill.

---

### hm-opencode-project-audit
**RICH Classification:** Rich (auditor; project configuration audit)
**SKILL.md lines:** 175 | **Bundled Resources:** 7 asset profiles, 2 scripts, 1 reference, 7 compiled profiles

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | "RICH Gate Source Decisions" (lines 140-147): ADOPT OpenCode official agents/commands/config/rules docs. No external third-party skill review beyond official docs. |
| RICH-2 | PARTIAL | Four source decisions documented (ADOPT/ADAPT) but all from same source (OpenCode official docs). No competing alternatives considered. |
| RICH-3 | PASS | Strong integration: 7-phase audit with per-phase specialist skills (use-authoring-skills, command-dev, custom-tools-dev, etc.). |
| RICH-4 | PASS | Parallel dispatch protocol (Phases 1-6), sequential synthesis (Phase 7). Clear handoff and phase ordering. |
| RICH-5 | PASS | 7 audit profile templates (phase-1 through phase-7), 2 scripts (compile-bundle.sh, validate-skill.sh), reference pointers. Non-generic audit-specific resources. |
| RICH-6 | FAIL | Phases 1-6 route to hivefiver-specific specialist skills (use-authoring-skills, command-dev, custom-tools-dev) that may not exist in arbitrary projects. "Independence Notes" (lines 149-151) claim audits arbitrary projects, but profiles reference hivefiver ecosystem. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Full third-party review, independence clarifications, gap docs, scorecard.

---

### hm-opencode-project-inspection
**RICH Classification:** Rich (domain-execution; project state inspection)
**SKILL.md lines:** 140 | **Bundled Resources:** 4 references, 1 script

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | No explicit third-party source review. Official scope matrix sourced from OpenCode docs but not framed as RICH evidence. |
| RICH-2 | FAIL | No documented pattern alternatives. |
| RICH-3 | PASS | Cross-refs hm-opencode-project-audit, hm-detective, hm-meta-builder (lines 136-140). MCP tool matrix references Context7, Repomix, GitHub MCP. |
| RICH-4 | PASS | "Official Scope Gate" (lines 38-53) with surface classification. |
| RICH-5 | PASS | 4 references (inspection-checklist.md, mcp-tool-matrix.md, ecosystem-structure.md, opencode-scope-matrix.md). Domain-specific inspection content. |
| RICH-6 | FALSE | No explicit independence audit section. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Third-party review, pattern decision, independence audit, gap docs, scorecard.

---

### hm-phase-execution
**RICH Classification:** Rich (orchestrator; wave-based phase execution)
**SKILL.md lines:** 191 | **Bundled Resources:** 3 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | "RICH Gate Source Decisions" (lines 136-143): ADAPT garagon/nanostack conductor, ADAPT github/awesome-copilot create-implementation-plan, ADAPT GitHub agent skill resource model. |
| RICH-2 | PASS | Three source decisions with specific local adaptations described. |
| RICH-3 | PASS | Cross-refs hm-coordinating-loop, hm-planning-with-files, hm-phase-loop, hm-subagent-delegation-patterns (lines 184-191). |
| RICH-4 | PASS | Explicit wave dependency management and checkpoint recovery. State machine with claims/artifacts/done/failures. |
| RICH-5 | PASS | 3 references (wave-protocol.md, checkpoint-recovery.md, execution-state-template.md), 1 eval. Domain-specific phase execution content. |
| RICH-6 | PARTIAL | "Independence Notes" (lines 145-147): "This skill does not require GSD. For non-GSD projects, treat any directory of plan files as the phase graph." But hardcodes `.opencode/state/opencode-harness/` and `.planning/phases/` paths. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Full independence, gap docs, scorecard.

---

### hm-phase-loop
**RICH Classification:** Rich (domain-execution; iterative phase loop management)
**SKILL.md lines:** 151 | **Bundled Resources:** 1 reference, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | "Phase 30 rich-lineage hardening" mentioned (line 26) but no specific third-party sources cited by name. |
| RICH-2 | FAIL | No documented pattern alternatives. |
| RICH-3 | PASS | Agent integration matrix (lines 114-119): intent-loop, phase-guardian, critic, builder. |
| RICH-4 | PASS | Loop definition with stall detection and exit criteria. Durable phase cursor format. |
| RICH-5 | FAIL | 1 reference (revision-loop.md), 1 eval, 1 script. Very light bundled resources for a domain-execution skill. |
| RICH-6 | FAIL | No independence notes. Cursor path default is `.opencode/state/...` or `.planning/phases/.../STATE.md` — assumes GSD/HiveMind state conventions. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Third-party review, pattern decision, bundled resources depth, independence, gap docs, scorecard.

---

### hm-refactor
**RICH Classification:** Rich (domain-execution; refactoring decision framework)
**SKILL.md lines:** 151 | **Bundled Resources:** 3 references, 1 script, 1 eval

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | "RICH Gate Source Decisions" (lines 116-122): ADOPT github/awesome-copilot refactor-plan, ADAPT addyosmani/agent-skills incremental implementation, ADAPT GitHub resource model. |
| RICH-2 | PASS | Three source decisions with local transformations described. |
| RICH-3 | PASS | Cross-refs hm-test-driven-execution, hm-debug, hm-planning-with-files (lines 146-151). |
| RICH-4 | PASS | Gated refactor protocol with 5 gates: scope map, sequence, safety net, rollback, verification. |
| RICH-5 | PASS | 3 references (refactor-taxonomy.md, safety-checklist.md, refactor-runbook.md), 1 eval. Domain-specific refactoring content. |
| RICH-6 | PASS | "Independence Notes" (lines 124-126): "Works in any Git-backed end-user project. If no git, replace commit rollback with copied-file checkpoints. Do not assume GSD, BMAD, or HiveMind phase state." |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Gap documentation, scorecard. Very strong skill otherwise.

---

### hm-research-chain
**RICH Classification:** Rich (orchestrator; research pipeline orchestration)
**SKILL.md lines:** 140 | **Bundled Resources:** 2 references, 1 template, 1 script, 1 eval, 1 metrics/rich-gate-scorecard.md

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | metrics/rich-gate-scorecard.md: "Phase 28 research adapted parallel-deep-research continuation and lingzhi sequential phase gates." |
| RICH-2 | PARTIAL | Scorecard: "Added gated stage artifacts and continuation metadata." |
| RICH-3 | PASS | Canonical chain: hm-detective → hm-deep-research → hm-synthesis → artifact. Explicit handoff formats. |
| RICH-4 | PASS | 4-stage orchestration with gates per stage. Continuation metadata for cross-session work. |
| RICH-5 | PASS | 2 references (chain-stages.md, tool-matrix.md), 1 template (chain-continuation.md), 1 eval. Domain-specific chain orchestration content. |
| RICH-6 | BLOCKED | Uses `.tech-registry.json` path which is harness-specific. No independence notes. |
| RICH-7 | FAIL | Scorecard says "blocked third-party source remains documented at phase level" — not comprehensive. |
| RICH-8 | PARTIAL | metrics/rich-gate-scorecard.md: "PARTIAL, pending independent RICH + D1-D8 scoring." |

---

### hm-skill-synthesis
**RICH Classification:** Rich (synthesis; skill creation from repos)
**SKILL.md lines:** 177 | **Bundled Resources:** 5 references, 2 templates, 7 scripts, 2 evals

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | FAIL | References agentskills.io/llms.txt (line 29) as canonical spec. Searches GitHub for SKILL.md patterns. No formal third-party skill source review documented. |
| RICH-2 | FAIL | Pipeline phases (INGEST→CLASSIFY→SCAFFOLD→VALIDATE) are internally derived. No P1/P2/P3 third-party alternatives documented. |
| RICH-3 | PASS | Integration with meta-builder (routes "synthesize skills"), use-authoring-skills, skill-judge, repomix-exploration-guide, opencode-platform-reference (lines 171-176). |
| RICH-4 | PASS | Decision tree routing by user intent (lines 117-127). |
| RICH-5 | PASS | 5 references, 7 scripts (ingest-repo.sh, classify-pattern.sh, grade-outputs.sh, etc.), 2 templates, 2 evals. Heavy domain-specific tooling. |
| RICH-6 | BLOCKED | Scripts use hardcoded paths (`/tmp/skill-ingest-<timestamp>.xml`) and assume specific tool availability (repomix --remote, webfetch). No independence audit. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard despite having eval framework. |

**Missing:** Third-party review, pattern decisions, independence, gap docs, scorecard.

---

### hm-spec-driven-authoring
**RICH Classification:** Rich (domain-execution; spec-driven requirement authoring)
**SKILL.md lines:** 237 | **Bundled Resources:** 3 references, 1 template, 1 workflow, 2 scripts, 1 eval, 1 metrics/rich-eval-rubric.json

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | SKILL.md lines 27-31: Three inspected third-party patterns with explicit adopt/adapt decisions. references/source-synthesis.md lines 9-13: Full source table with materials reviewed, decisions, and transformations. |
| RICH-2 | PASS | Source synthesis documents Pattern 1 (addyosmani — adopt), Pattern 2 (proffesor-for-testing — adopt), Pattern 3 (kw12121212 — adapt/defer) with rejected/deferred patterns. |
| RICH-3 | PASS | Boundary rules with hm-test-driven-execution, hm-planning-with-files (lines 47-51). Integration wiring for agents, commands, tools, hooks, runtime state (lines 163-169). |
| RICH-4 | PASS | Entry gate → boundary rules → spec-lock workflow with 5 gates → 6-NON defence table. |
| RICH-5 | PASS | 3 references, 1 template (requirement-traceability-matrix.md), 1 workflow, metrics/rich-eval-rubric.json, scripts/validate-rich-package.sh. |
| RICH-6 | PASS | Cross-Platform Adapters (lines 186-190): OpenCode-native, Hivemind harness, arbitrary user project. Handoff text: "Do not assume GSD, BMAD, OMO, Spec-kit, `.planning/`, or this repository path" (line 141). |
| RICH-7 | FAIL | No explicit gap documentation. |
| RICH-8 | PARTIAL | metrics/rich-eval-rubric.json exists as a scoring hook but no completed skill-judge scorecard with D1-D8 scores. |

**Missing:** Gap documentation, completed RICH-8 scorecard. **Strongest hm-* skill overall.**

---

### hm-subagent-delegation-patterns
**RICH Classification:** Rich (domain-execution; delegation patterns)
**SKILL.md lines:** 191 | **Bundled Resources:** 4 references, 1 script

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | "Rich Handoff Lineage" (lines 40-41) cites OpenAI Agents SDK handoffs/guardrails, AutoGen HandoffMessage, Claude Code subagent lifecycle hooks. No specific repos/source materials cited. |
| RICH-2 | PARTIAL | Documents adapted patterns from three sources. |
| RICH-3 | PASS | Cross-refs hivefiver-agents-and-subagents-dev, hm-coordinating-loop, hm-planning-with-files (lines 186-191). |
| RICH-4 | PASS | Handoff edge guardrails table: parent→child, child→tool, child→parent, parent→next child. |
| RICH-5 | PASS | 4 references (delegation-envelopes.md, checkpoint-protocols.md, wave-execution.md, handoff-edge-guardrails.md). Domain-specific delegation content. |
| RICH-6 | BLOCKED | Hardcodes `.planning/STATE.md`, `.planning/phases/` paths (lines 63-164). No independence notes. Assumes GSD planning structure. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No evals/ directory or skill-judge scorecard. |

**Missing:** Specific source evidence, independence from GSD, gap docs, evals, scorecard.

---

### hm-synthesis
**RICH Classification:** Rich (compression; research findings compression)
**SKILL.md lines:** 384 | **Bundled Resources:** 7 references, 1 template, 1 script, 1 eval, 1 metrics/rich-gate-scorecard.md

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | metrics/rich-gate-scorecard.md: "Phase 28 research reviewed research-synthesis, synthesizer, and agent-studio research-synthesis." |
| RICH-2 | PARTIAL | Scorecard: "Added contradiction/consensus scoring and limitations gate." |
| RICH-3 | PASS | Loads hm-detective via execution_context (line 29). Strong integration with Context7, repomix MCP tools. |
| RICH-4 | PASS | Three compression tiers (Snapshot/Focused/Signature) with decision table (lines 57-71). Progressive disclosure loading triggers (lines 375-376). |
| RICH-5 | PASS | 7 references, 1 template, 1 eval. Heavy domain-specific synthesis content. |
| RICH-6 | FAIL | References `.tech-registry.json` (harness-specific). No independence notes. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | PARTIAL | metrics/rich-gate-scorecard.md: "PARTIAL, pending independent RICH + D1-D8 scoring." |

---

### hm-test-driven-execution
**RICH Classification:** Rich (domain-execution; TDD execution)
**SKILL.md lines:** 277 | **Bundled Resources:** 3 references, 1 template, 1 workflow, 2 scripts, 1 eval, 1 metrics/rich-eval-rubric.json

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | SKILL.md lines 27-31: Three third-party patterns with adopt/adapt decisions: addyosmani/agent-skills@test-driven-development, helderberto/skills@tdd, jellydn/my-ai-tools@tdd. references/source-synthesis.md provides full source audit. |
| RICH-2 | PASS | Three sources with explicit adopt/adapt/reject decisions. Rejected patterns documented (hard-coded slash-command wrappers). |
| RICH-3 | PASS | Boundary rules with hm-spec-driven-authoring, hm-planning-with-files (lines 47-53). Integration wiring for agents, commands, tools, hooks, runtime state (lines 190-197). |
| RICH-4 | PASS | RED/GREEN/REFACTOR gates with entry gate prerequisites. 6-NON defence table. |
| RICH-5 | PASS | 3 references, 1 template, 1 workflow, metrics/rich-eval-rubric.json, scripts/validate-rich-package.sh. |
| RICH-6 | PASS | Cross-Platform Adapters (lines 211-215): OpenCode-native, Hivemind harness, arbitrary user project. Explicit: "Do not assume Node, `.planning/`, GSD, or this repository paths." |
| RICH-7 | FAIL | No explicit gap documentation. |
| RICH-8 | PARTIAL | metrics/rich-eval-rubric.json exists (RICH/D1-D8 scoring hooks) but no completed scorecard. |

**Missing:** Gap documentation, completed RICH-8 scorecard. **Second-strongest hm-* skill.**

---

### hm-user-intent-interactive-loop
**RICH Classification:** Rich (front-agent; intent clarification and delegation)
**SKILL.md lines:** 445 | **Bundled Resources:** 6 references, 6 scripts, 2 evals

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PARTIAL | "Phase 30 rich-lineage hardening models every user question or checkpoint as a durable human interrupt" (line 28). Adapts LangGraph interrupts, AutoGen user handoff, and Temporal reentrant workflow state — names sources but no specific repos cited. |
| RICH-2 | PARTIAL | Three pattern adaptations described but no explicit adopt/adapt/reject decision table. |
| RICH-3 | PASS | Strong cross-refs: coordinating-loop, planning-with-files, dispatching-parallel-agents, deep-research, gcc (lines 393-400). Ecosystem loading order enforced. |
| RICH-4 | PASS | 6-phase interactive loop (PROBE→UNDERSTAND→PLAN→DELEGATE→UPDATE→DELIVER). 5 hard gates with checkable artifacts. Durable human interrupt protocol. |
| RICH-5 | PASS | 6 references, 6 scripts (intent-verify.sh, verify-hierarchy.sh, session-checkpoint.sh, etc.), 2 evals. Heavy domain-specific bundled resources. |
| RICH-6 | BLOCKED | Strongly coupled to `.opencode/state/` paths (`question-count.json`, `intent.json`, `loaded-skills.json`), specific hivefiver skill names, and GSD workflow conventions. References `opencode/get-shit-done/references/` (GSD path at line 107). Platform adaptation section exists (lines 425-432) but skill behavior is inextricably tied to OpenCode state paths. |
| RICH-7 | FAIL | No gap documentation. |
| RICH-8 | FAIL | No skill-judge scorecard. |

**Missing:** Specific third-party source citations, independence, gap docs, scorecard.

---

## Consolidated Gap Patterns

### Pattern 1: Missing RICH-8 Scorecards (23 of 24 skills)
Only 4 skills have any form of RICH gate scorecard (hm-deep-research, hm-detective, hm-research-chain, hm-synthesis), and all of those are self-assessed as **PARTIAL**, incomplete, and explicitly say "pending independent RICH + D1-D8 scoring." The remaining 19 skills have no metrics/ directory or scorecard at all.

### Pattern 2: Missing Gap Documentation — RICH-7 (24 of 24 skills)
**No hm-* skill** has a dedicated gap documentation section. None document missing skills, missing meta-concepts, missing agent definitions, or missing hard-harness tools. This is a universal failure.

### Pattern 3: Independence Assumptions — RICH-6 (15 of 24 skills are FAIL or BLOCKED)
Most hm-* skills assume one or more of: `.planning/phases/` paths, `.opencode/state/opencode-harness/` paths, GSD workflow conventions, HiveMind-specific agent names, hivefiver-specific skill names, or this repository's `src/lib/` structure. Only hm-debug, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hm-refactor, hm-spec-driven-authoring, and hm-test-driven-execution have explicit independence notes.

### Pattern 4: Incomplete Third-Party Synthesis — RICH-1 (9 of 24 skills have any evidence)
Skills with explicit third-party source citations (hm-debug, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hm-phase-execution, hm-refactor, hm-spec-driven-authoring, hm-test-driven-execution) are clustered in Phase 27-30 hardening work. The remaining 15 skills have zero third-party source evidence.

### Pattern 5: Cross-References Present But Routing Incomplete (RICH-3 vs RICH-4)
Most skills have cross-reference sections (RICH-3), but few define explicit routing rules (RICH-4) specifying when to handoff, when to refuse work, and how to navigate between sibling skills. Notable exceptions: hm-meta-builder, hm-coordinating-loop, hm-research-chain, hm-user-intent-interactive-loop.

### Pattern 6: Metadata Pattern Fields Are Declarative, Not Evidenced
Many skills declare `pattern: P2` or similar in frontmatter metadata, but only 2 skills (hm-spec-driven-authoring, hm-test-driven-execution) have `references/source-synthesis.md` documents that actually explain why that pattern was chosen, what alternatives were considered, and what third-party patterns informed the decision.

### Pattern 7: `scripts/validate-skill.sh` Exists But Is Generic
Nearly all skills have a `scripts/validate-skill.sh`, but examination of the bundled resource listings reveals most are the same boilerplate validate script. This indicates placeholder resources rather than domain-specific validation.

### Pattern 8: Strong Skills Clustered in Hardening Phases
The 6-7 strongest skills (hm-spec-driven-authoring, hm-test-driven-execution, hm-debug, hm-refactor, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hm-completion-looping) are concentrated in the Phase 27-30 hardening sprints. Earlier-phase skills lack RICH evidence almost entirely.

### Pattern 9: Reference Skills Inherently Limited
hm-omo-reference and hm-command-parser are classified as reference skills by their content pattern. The RICH gate criteria are designed for skills "that tell an agent how to implement, execute, debug, refactor, research, plan, validate, configure, inspect, or compose work." Pure reference skills may not be capable of passing all RICH gates, and this classification gap is not documented in the RICH criteria.

---

## Recommendations

1. **Create RICH-8 scorecards for all skills.** Each skill needs a `metrics/rich-gate-scorecard.md` with D1-D8 scores plus RICH gate evidence.
2. **Add gap documentation (RICH-7) for all skills.** Each skill should document what related skills are missing, what meta-concepts are needed, and what hard-harness tools would complement it.
3. **Add independence notes (RICH-6) to all skills.** Explicitly document adapter paths for non-GSD, non-HiveMind projects.
4. **Complete third-party synthesis (RICH-1) for all skills.** Run `npx skills find` or GitHub searches against each skill's domain and document the top 3 sources reviewed.
5. **Clarify RICH classification for reference skills.** hm-omo-reference and hm-command-parser may be "Reference" not "Rich" — this classification should officially exempt them from some gates.
6. **Update RICH-SKILL-QUALITY-GATE.md** to acknowledge that reference/navigation skills need adapted criteria (e.g., RICH-4 modification for pure reference material).

---

_Reviewed: 2026-04-27T00:00:00Z_
_Reviewer: gsd-code-reviewer (subagent)_
_Depth: deep (cross-file analysis, 24 SKILL.md files + bundled resource audit)_
