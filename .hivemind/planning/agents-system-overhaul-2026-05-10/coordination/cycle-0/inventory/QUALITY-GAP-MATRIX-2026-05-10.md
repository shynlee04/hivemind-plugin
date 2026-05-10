# Quality Gap Matrix — Shipped Agent Bodies Audit

**Date:** 2026-05-10
**Auditor:** hm-l2-investigator (L2 deep investigation specialist)
**Scope:** 56 shipped agent bodies (45 hm-* + 11 hf-*)
**Baseline:** 33 gsd-* agents + OMO reference patterns
**Method:** Line count analysis, schema tag enumeration, body content reading, GSD counterpart comparison

## Executive Summary

**Overall finding: FAIL.** The shipped agent bodies are structurally sound (32 of 45 hm-* agents have full schema tags) but critically deficient in **expert depth** and **execution specificity**. When compared to GSD counterparts, hm-* agents average **65% fewer lines** and contain **zero concrete grep patterns, zero language-specific checks, and zero depth-level specifications**. 13 hm-* agents (29%) have **no schema tags at all** and are essentially stub definitions.

**Severity:** The gap between hm-* body quality and GSD body quality is systemic — not an outlier. GSD agents contain domain-specific expert knowledge (regex patterns, anti-pattern catalogs, language-specific checklists, depth-level execution flows). HM agents contain generic descriptions of what the agent should do, but not **how** or **with what expertise**.

### Key Metrics

| Metric | hm-* | hf-* | gsd-* |
|--------|------|------|-------|
| Agent count | 45 | 11 | 33 |
| Mean line count | 203 | 318 | 363 |
| Median line count | 211 | 333 | 308 |
| Min line count | 56 | 140 | 104 |
| Max line count | 374 | 390 | 1445 |
| Agents with full schema (15 tags) | 31 (69%) | 11 (100%) | 0 (different format) |
| Agents with zero schema | 13 (29%) | 0 (0%) | N/A |
| Concrete grep patterns | 0 | 0 | 15+ |
| Language-specific checks | 0 | 0 | 10+ |
| Depth-level specifications | 0 | 0 | 6 |

---

## Section 1: Per-Agent Quality Scores

### Scoring Criteria

| Dimension | 1 (Worst) | 3 (Average) | 5 (Best) |
|-----------|-----------|-------------|----------|
| Expert Depth | No domain knowledge, generic role description | Some domain terms, basic analysis steps | Concrete patterns, regex, language-specific, anti-pattern catalogs |
| Execution Flow | No execution steps or only high-level | Has numbered steps but vague actions | Concrete grep/read commands, depth levels, per-language checks |
| Schema Completeness | 0-5 schema tags | 10-14 tags | All 15+ tags with meaningful content |
| Skill/Command Refs | No skill references | Lists skill names without context | Specific skill loading order, command routing, workflow participation |
| GSD Parity | <30% of GSD depth | 50-70% of GSD depth | >=90% of GSD depth |
| OMO Alignment | Flat prompt, no structure | Has role/task sections | Multi-section with behavioral contracts, anti-patterns, output contracts |

### HM-* Agents (45)

| Agent | Lines | Expert | ExecFlow | Schema | SkillRef | GSDParity | OMO | Total | Status |
|-------|-------|--------|----------|--------|----------|-----------|-----|-------|--------|
| hm-l0-orchestrator | 374 | 2 | 3 | 5 | 3 | N/A | 3 | 16 | REWRITE |
| hm-l1-coordinator | 360 | 2 | 3 | 5 | 2 | N/A | 3 | 15 | REWRITE |
| hm-l2-analyst | 172 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-architect | 175 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-assessor | 267 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-auditor | 259 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | REWRITE |
| hm-l2-brainstormer | 176 | 2 | 2 | 5 | 1 | 1 | 3 | 14 | REWRITE |
| hm-l2-build | 75 | 1 | 1 | 1 | 1 | N/A | 1 | 5 | **ELIMINATE** |
| hm-l2-conductor | 124 | 2 | 3 | 1 | 2 | N/A | 2 | 10 | MERGE→coordinator |
| hm-l2-connector | 271 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-context-mapper | 86 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-context-purifier | 85 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-critic | 145 | 2 | 3 | 1 | 2 | 1 | 2 | 11 | MERGE→reviewer |
| hm-l2-curator | 252 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | REWRITE |
| hm-l2-debugger | 188 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-ecologist | 266 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-executor | 211 | 2 | 2 | 5 | 2 | 1 | 3 | 15 | REWRITE |
| hm-l2-finisher | 277 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-general | 69 | 1 | 1 | 3 | 1 | N/A | 1 | 7 | **ELIMINATE** |
| hm-l2-guardian | 267 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | KEEP (rewrite) |
| hm-l2-integrator | 172 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-intent-loop | 236 | 2 | 3 | 1 | 2 | N/A | 2 | 10 | REWRITE |
| hm-l2-investigator | 260 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | KEEP (rewrite) |
| hm-l2-mentor | 262 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-meta-synthesis | 268 | 3 | 2 | 1 | 3 | 2 | 2 | 13 | REWRITE |
| hm-l2-operator | 273 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-optimizer | 247 | 1 | 2 | 5 | 3 | N/A | 3 | 14 | REWRITE |
| hm-l2-persistor | 239 | 1 | 2 | 5 | 3 | N/A | 3 | 14 | REWRITE |
| hm-l2-phase-guardian | 282 | 3 | 3 | 1 | 2 | N/A | 3 | 12 | REWRITE |
| hm-l2-planner | 197 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-prompt-analyzer | 81 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-prompt-repackager | 104 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-prompt-skimmer | 82 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-researcher | 264 | 1 | 2 | 5 | 3 | 1 | 3 | 15 | REWRITE |
| hm-l2-reviewer | 179 | 2 | 2 | 5 | 2 | 1 | 3 | 15 | REWRITE |
| hm-l2-risk-assessor | 80 | 2 | 2 | 1 | 1 | N/A | 2 | 8 | MERGE→prompt-pipeline |
| hm-l2-router | 255 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | KEEP (rewrite) |
| hm-l2-scout | 257 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | REWRITE |
| hm-l2-spec-verifier | 174 | 2 | 3 | 1 | 2 | N/A | 2 | 10 | REWRITE |
| hm-l2-strategist | 253 | 1 | 2 | 5 | 3 | N/A | 3 | 14 | REWRITE |
| hm-l2-synthesizer | 175 | 1 | 2 | 5 | 2 | 1 | 3 | 14 | REWRITE |
| hm-l2-technician | 268 | 2 | 2 | 5 | 3 | N/A | 3 | 15 | REWRITE |
| hm-l2-test-router | 56 | 1 | 2 | 1 | 1 | N/A | 1 | 6 | **ELIMINATE** |
| hm-l2-validator | 262 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | REWRITE |
| hm-l2-writer | 257 | 2 | 2 | 5 | 3 | 1 | 3 | 16 | REWRITE |

### HF-* Agents (11)

| Agent | Lines | Expert | ExecFlow | Schema | SkillRef | GSDParity | OMO | Total | Status |
|-------|-------|--------|----------|--------|----------|-----------|-----|-------|--------|
| hf-l0-orchestrator | 390 | 3 | 3 | 5 | 4 | N/A | 4 | 19 | KEEP (rewrite) |
| hf-l1-coordinator | 389 | 3 | 3 | 5 | 4 | N/A | 4 | 19 | KEEP (rewrite) |
| hf-l2-agent-builder | 333 | 3 | 3 | 5 | 4 | N/A | 4 | 19 | KEEP (rewrite) |
| hf-l2-auditor | 366 | 3 | 3 | 5 | 5 | N/A | 4 | 20 | KEEP |
| hf-l2-command-builder | 287 | 3 | 3 | 5 | 3 | N/A | 4 | 18 | KEEP (rewrite) |
| hf-l2-meta-builder | 140 | 2 | 2 | 3 | 3 | N/A | 2 | 12 | REWRITE |
| hf-l2-prompter | 339 | 3 | 3 | 5 | 3 | N/A | 4 | 18 | KEEP |
| hf-l2-refactorer | 356 | 3 | 3 | 5 | 5 | N/A | 4 | 20 | KEEP |
| hf-l2-skill-builder | 305 | 3 | 3 | 5 | 5 | N/A | 4 | 20 | KEEP |
| hf-l2-synthesizer | 390 | 3 | 3 | 5 | 5 | N/A | 4 | 20 | KEEP |
| hf-l2-tool-builder | 304 | 3 | 3 | 5 | 3 | N/A | 4 | 18 | KEEP (rewrite) |

### Score Distribution Summary

| Score Range | hm-* Count | hf-* Count | Description |
|-------------|-----------|-----------|-------------|
| 5-10 (Critical) | 11 | 0 | Non-functional stubs |
| 11-14 (Poor) | 17 | 1 | Structurally present but shallow |
| 15-16 (Acceptable) | 15 | 2 | Has schema but lacks expert depth |
| 17-20 (Good) | 2 | 7 | Well-structured, some expert depth |
| 21+ (Excellent) | 0 | 1 | Rich, domain-expert content |

---

## Section 2: GSD Counterpart Comparison

### Critical Comparison: Code Review Domain

| Dimension | gsd-code-reviewer (368 lines) | hm-l2-reviewer (179 lines) | Gap |
|-----------|-------------------------------|---------------------------|-----|
| Adversarial stance | 15 lines of explicit "assume defects" framing | 1 line in `<iron_law>` | 93% gap |
| Depth levels | 3 explicit levels (quick/standard/deep) with concrete grep patterns per level | 1 depth level mentioned in execution flow | 90% gap |
| Grep patterns | 8+ concrete regex patterns (secrets, eval, console.log, empty catch) | 0 concrete patterns | 100% gap |
| Language-specific checks | JS/TS, Python, Go, C/C++, Shell with specific patterns per language | None | 100% gap |
| Severity classification | BLOCKER/WARNING with explicit classification criteria | CRITICAL/HIGH/MEDIUM/LOW with thresholds | Partial gap |
| File scoping | Explicit git diff commands, exclusion rules, file type grouping | "Scan target files" generic instruction | 90% gap |
| Output format | Complete REVIEW.md template with YAML frontmatter | Basic table template | 80% gap |
| Project context loading | AGENTS.md + .claude/skills/ discovery | No project context loading | 100% gap |

### Critical Comparison: Debugger Domain

| Dimension | gsd-debugger (1445 lines) | hm-l2-debugger (188 lines) | Gap |
|-----------|--------------------------|---------------------------|-----|
| Line count ratio | 1445 | 188 (13% of GSD) | 87% gap |
| Hypothesis framework | Full hypothesis-driven methodology | Generic "investigate bugs" | 95% gap |
| Evidence gathering | Concrete commands per hypothesis type | None | 100% gap |
| Debug state persistence | task_plan.md, findings.md, progress.md | "L1 manages session state" | 100% gap |
| Self-correction loops | Explicit stall/loop detection and recovery | None | 100% gap |

### Critical Comparison: Planner Domain

| Dimension | gsd-planner (1248 lines) | hm-l2-planner (197 lines) | Gap |
|-----------|-------------------------|--------------------------|-----|
| Line count ratio | 1248 | 197 (16% of GSD) | 84% gap |
| Plan structure | Complete PLAN.md template with verification steps | Generic "create plan" | 95% gap |
| Dependency analysis | Explicit dependency graph methodology | Not mentioned | 100% gap |
| Verification criteria | Complete acceptance criteria framework | Not mentioned | 100% gap |

### Side-by-Side: All Counterparts

| hm-* Agent | Lines | GSD Counterpart | GSD Lines | Ratio | Verdict |
|------------|-------|-----------------|-----------|-------|---------|
| hm-l2-reviewer | 179 | gsd-code-reviewer | 368 | 49% | hm-* lacks all concrete patterns |
| hm-l2-debugger | 188 | gsd-debugger | 1445 | 13% | hm-* is skeleton vs. comprehensive |
| hm-l2-planner | 197 | gsd-planner | 1248 | 16% | hm-* is skeleton vs. comprehensive |
| hm-l2-executor | 211 | gsd-executor | 629 | 34% | hm-* lacks execution methodology |
| hm-l2-validator | 262 | gsd-verifier | 823 | 32% | hm-* lacks verification criteria |
| hm-l2-scout | 257 | gsd-codebase-mapper | 846 | 30% | hm-* lacks scan methodology |
| hm-l2-strategist | 253 | gsd-roadmapper | 681 | 37% | hm-* lacks roadmap methodology |
| hm-l2-writer | 257 | gsd-doc-writer | 608 | 42% | hm-* lacks doc authoring method |
| hm-l2-integrator | 172 | gsd-integration-checker | 469 | 37% | hm-* lacks integration checks |
| hm-l2-researcher | 264 | gsd-phase-researcher | 833 | 32% | hm-* lacks research methodology |
| hm-l2-synthesizer | 175 | gsd-doc-synthesizer | 197 | 89% | Closest parity, still shallow |
| hm-l2-curator | 252 | gsd-doc-classifier | 161 | 156% | hm-* is longer but less specific |
| hm-l2-ecologist | 266 | gsd-pattern-mapper | 328 | 81% | Similar size, hm-* less specific |
| hm-l2-auditor | 259 | gsd-nyquist-auditor | 196 | 132% | hm-* is longer but less specific |
| hm-l2-persistor | 239 | gsd-doc-verifier | 210 | 114% | Similar parity |

---

## Section 3: Overlap & Conflict Map

### Overlap Category 1: Review/Critic/Auditor Domain

**Agents:** hm-l2-reviewer, hm-l2-critic, hm-l2-auditor, hm-l2-validator

**Overlap severity:** HIGH — All four agents perform quality verification on code. The distinction is unclear:
- **reviewer**: "Code review specialist for security, performance, bug, and quality analysis"
- **critic**: "The ruthless verifier. You never approve without verification"
- **auditor**: "Quality audit specialist for scoring production readiness"
- **validator**: "Validation specialist for verifying implementations against specifications"

**Conflict:** reviewer and critic have nearly identical scopes (both review code for bugs/security/quality). The difference is supposed to be reviewer=code-review vs critic=acceptance-testing, but neither body makes this distinction concrete.

**Recommendation:** Merge critic → reviewer (single code review agent with depth levels). Keep auditor for production readiness scoring. Keep validator for spec compliance.

### Overlap Category 2: Coordinator/Conductor/Router Domain

**Agents:** hm-l1-coordinator, hm-l2-conductor, hm-l2-router, hm-l2-operator

**Overlap severity:** HIGH — All four perform task routing and delegation:
- **coordinator**: "Delegation coordinator for wave-based L2 specialist execution"
- **conductor**: "Delegation routing specialist. Receives tasks, classifies intent, delegates to specialists"
- **router**: "Task routing specialist. Classifies incoming tasks by domain"
- **operator**: "Phase execution operator for managing plan execution"

**Conflict:** conductor and router have near-identical descriptions. Both classify intent and route to specialists. The conductor references a "wisdom system" (`.harness/wisdom/`) that doesn't exist in this project. The operator manages plan execution but overlaps with coordinator's phase management.

**Recommendation:** Merge conductor → coordinator (single L1 coordination agent). Merge operator → coordinator as execution sub-protocol. Keep router as L2 intent classifier.

### Overlap Category 3: Prompt Pipeline Agents

**Agents:** hm-l2-prompt-skimmer, hm-l2-prompt-analyzer, hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-risk-assessor, hm-l2-prompt-repackager

**Overlap severity:** MEDIUM — These are all read-and-report agents in the prompt enhancement pipeline. They're designed to work sequentially, but individually they're all stubs (56-104 lines, zero schema tags).

**No conflict** — they have distinct roles in the pipeline. But they're all severely underdeveloped.

**Recommendation:** Merge into a single `hm-l2-prompt-engineer` agent with pipeline phases as execution steps. Alternatively, keep them as thin pipeline agents but rewrite with expert depth.

### Overlap Category 4: Build/General

**Agents:** hm-l2-build, hm-l2-general

**Overlap severity:** CRITICAL — Both are catch-all implementation agents:
- **build**: "The default primary agent with all tools enabled for development work"
- **general**: "General-purpose fallback subagent for simple tasks"

**Conflict:** build lists 33 GSD agents as delegation targets but has zero body content beyond that list. general is even more sparse. Neither provides any actual implementation guidance.

**Recommendation:** ELIMINATE both. Replace with a single `hm-l2-implementer` agent that actually contains coding patterns, clean-code principles, and TDD workflow instructions.

### Overlap Category 5: Guardian/Phase-Guardian

**Agents:** hm-l2-guardian, hm-l2-phase-guardian

**Overlap severity:** MEDIUM — Both manage phase discipline:
- **guardian**: "Phase loop specialist for managing iterative phase execution"
- **phase-guardian**: "Specialist for phase guardrails and loop termination"

**Distinction:** guardian manages the loop, phase-guardian enforces gates within the loop. Legitimate separation but both need schema tags and expert depth.

**Recommendation:** Keep both but rewrite. Guardian = loop lifecycle. Phase-guardian = gate enforcement within loops.

---

## Section 4: Missing Agent Types

### Agents that exist in GSD but have no hm-* equivalent

| GSD Agent | Function | Missing hm-* equivalent | Priority |
|-----------|----------|------------------------|----------|
| gsd-code-fixer | Applies fixes to code review findings, commits atomically | **hm-l2-fixer** | HIGH |
| gsd-domain-researcher | Researches business domain for requirements | Partially covered by hm-l2-researcher but lacks domain expertise | MEDIUM |
| gsd-ai-researcher | Researches AI frameworks and patterns | Not covered — critical for AI integration phases | HIGH |
| gsd-security-auditor | Threat model and security review | hm-l2-reviewer mentions security but no dedicated agent | MEDIUM |
| gsd-user-profiler | Developer behavioral profiling | Not covered | LOW |
| gsd-eval-planner | Evaluation strategy design for AI features | Not covered | MEDIUM |
| gsd-eval-auditor | Audit evaluation coverage | Not covered | MEDIUM |

### Agent capabilities missing from existing hm-* bodies

| Capability | Which agents need it | Current state |
|------------|---------------------|---------------|
| Concrete grep/regex patterns | reviewer, debugger, auditor, scout, validator | Zero patterns in any agent |
| Language-specific analysis | reviewer, auditor, validator | Zero language-specific content |
| Depth-level specifications | reviewer, debugger, scout, auditor | Zero depth levels |
| Project context loading | All agents that read code | Only GSD agents load AGENTS.md + skills |
| File-type specific workflows | reviewer, auditor, scout | Generic "read files" only |
| Debug state persistence | debugger, investigator | "L1 manages state" — no persistence protocol |
| Error pattern catalogs | reviewer, debugger, critic | Zero catalogs |

---

## Section 5: Merge/Eliminate Recommendations

### ELIMINATE Candidates (3)

1. **hm-l2-build** (75 lines, score 5) — Contains only a list of 33 GSD agents and no body content. No schema tags. No execution flow. No expert knowledge. A routing list is not an agent.

2. **hm-l2-general** (69 lines, score 7) — "General-purpose fallback" with no domain expertise. 3 schema tags. No reason to exist as a separate agent — any specialist can handle simple tasks.

3. **hm-l2-test-router** (56 lines, score 6) — Routes to 3 test commands. This is a command handler, not an agent. Should be part of the command engine, not a standalone agent body.

### MERGE Candidates (8)

1. **hm-l2-critic → hm-l2-reviewer** — Merge into single code review agent with depth levels (quick/standard/deep). The critic's adversarial stance and the reviewer's structured output should be combined.

2. **hm-l2-conductor → hm-l1-coordinator** — Conductor's routing logic should be a sub-protocol of coordinator, not a separate agent. The "wisdom system" references a path (`.harness/wisdom/`) that doesn't exist.

3. **hm-l2-prompt-skimmer + prompt-analyzer + context-mapper + context-purifier + risk-assessor + prompt-repackager → hm-l2-prompt-engineer** — Six agents (464 lines total) in the prompt pipeline. All are stubs. Merge into one agent with pipeline phases as execution steps, or keep as thin pipeline but rewrite each with expert depth.

4. **hm-l2-optimizer + hm-l2-technician → hm-l2-technician** — Optimizer is described as "performance optimization specialist" but has zero optimization patterns. Technician is "technology stack specialist" but has zero stack validation content. Merge into one agent that handles both stack validation and optimization.

### Post-Merge Target Count

Current: 45 hm-* + 11 hf-* = 56
After eliminations: 42 hm-* + 11 hf-* = 53
After merges: 37 hm-* + 11 hf-* = 48
Target: ~40-42 total (allowing for new agents like fixer, security-auditor)

---

## Section 6: Priority Rewrite Order

### Tier 1: Critical — Most Referenced by Commands/Workflows (Rewrite First)

These agents are directly invoked by commands and skills. Their quality directly impacts every user interaction.

| Priority | Agent | Reason | Current Score | Target Score |
|----------|-------|--------|---------------|--------------|
| 1 | hm-l2-reviewer | Code review is the primary quality gate. Referenced by gsd-code-review, hm-l2-gate-orchestrator, and multiple workflows. GSD counterpart is 368 lines with concrete patterns. | 15 | 22+ |
| 2 | hm-l2-debugger | Debug is triggered by `/gsd-debug` and multiple error workflows. GSD counterpart is 1445 lines. Current is 188 lines — 87% content gap. | 14 | 22+ |
| 3 | hm-l2-planner | Planning is triggered by `/gsd-plan-phase` and all phase planning workflows. GSD counterpart is 1248 lines. Current is 197 lines — 84% gap. | 14 | 22+ |
| 4 | hm-l1-coordinator | Central delegation hub. All L2 specialists are spawned from here. 360 lines but lacks delegation patterns and wave management specifics. | 15 | 22+ |
| 5 | hm-l2-executor | Execution triggered by `/gsd-execute-phase` and phase workflows. GSD counterpart is 629 lines. Current is 211 lines — 66% gap. | 15 | 22+ |
| 6 | hm-l2-validator | Verification gate for all phase completions. GSD counterpart is 823 lines. Current is 262 lines — 68% gap. | 16 | 22+ |

### Tier 2: High — Frequently Used by Skills (Rewrite Second)

| Priority | Agent | Reason | Current Score | Target Score |
|----------|-------|--------|---------------|--------------|
| 7 | hm-l2-scout | Codebase scanning triggered by hm-l3-detective skill chain. | 16 | 20+ |
| 8 | hm-l2-writer | Documentation authoring triggered by multiple workflows. | 16 | 20+ |
| 9 | hm-l2-researcher | Research pipeline agent, triggered by hm-l3-research-chain. | 15 | 20+ |
| 10 | hm-l2-synthesizer | Artifact compression in research chain. | 14 | 20+ |
| 11 | hm-l2-router | Task routing for all incoming intents. | 15 | 20+ |
| 12 | hm-l2-integrator | Integration verification across phases. | 14 | 20+ |

### Tier 3: Medium — Supporting Agents (Rewrite Third)

| Priority | Agent | Reason |
|----------|-------|--------|
| 13 | hm-l2-phase-guardian | Phase gate enforcement — good structure but no schema |
| 14 | hm-l2-intent-loop | Phase 0 intent clarification — no schema tags |
| 15 | hm-l2-spec-verifier | Phase 1 verification — no schema tags |
| 16 | hm-l2-guardian | Phase loop management |
| 17 | hm-l2-investigator | Root cause analysis (this agent) |
| 18-26 | Remaining Tier 2 hm-* agents | Quality domain specialists |
| 27-37 | Tier 3 hm-* agents | Supporting specialists |

### Tier 4: Low — New Agents to Create

| Priority | New Agent | Based On | Function |
|----------|-----------|----------|----------|
| 38 | hm-l2-fixer | gsd-code-fixer (665 lines) | Atomic fix application with commit |
| 39 | hm-l2-security-auditor | gsd-security-auditor (148 lines) | STRIDE threat modeling |
| 40 | hm-l2-implementer | Replace build + general | TDD-first code implementation |

---

## Appendix A: Schema Tag Inventory

### Required Schema Tags (from OMO patterns + project conventions)

1. `<role>` — Agent identity and domain
2. `<depth>` — L0/L1/L2/L3 hierarchy level
3. `<lineage>` — hm/hf/gate/stack lineage binding
4. `<task>` — Ordered task list
5. `<scope>` — In-scope and out-of-scope
6. `<context>` — Domain knowledge the agent needs
7. `<expected_output>` — Output format specification
8. `<verification>` — How to verify the output
9. `<iron_law>` — Non-negotiable rule
10. `<output_contract>` — Structured output template
11. `<behavioral_contract>` — MUST/MUST NOT/SHOULD
12. `<anti_patterns>` — Detection/Correction table
13. `<delegation_boundary>` — When to escalate
14. `<skill_loading>` — Skills to load
15. `<session_continuity>` — State management
16. `<execution_flow>` — Step-by-step with priorities
17. `<workflow_awareness>` — Parent/peers/recovery
18. `<naming>` — Naming convention compliance

### Agents Missing ALL Schema Tags (13 agents)

1. hm-l2-build
2. hm-l2-conductor
3. hm-l2-context-mapper
4. hm-l2-context-purifier
5. hm-l2-critic
6. hm-l2-intent-loop
7. hm-l2-phase-guardian
8. hm-l2-prompt-analyzer
9. hm-l2-prompt-repackager
10. hm-l2-prompt-skimmer
11. hm-l2-risk-assessor
12. hm-l2-spec-verifier
13. hm-l2-test-router

---

## Appendix B: Evidence Chain

| Step | Finding | Source | Evidence Type |
|------|---------|--------|---------------|
| 1 (symptom) | User reports agent bodies are inferior quality | Task dispatch | Direct |
| 2 | 13 of 45 hm-* agents have zero schema tags | Line-by-line grep of all 45 files | Direct/code |
| 3 | hm-* agents average 203 lines vs GSD 363 lines | wc -l on all 89 agent files | Direct/metric |
| 4 | Zero concrete grep patterns in any hm-* agent body | Content analysis of reviewer, debugger, auditor | Direct/code |
| 5 | gsd-code-reviewer has 8+ regex patterns, 3 depth levels, language-specific checks; hm-l2-reviewer has none | Side-by-side file read | Direct/comparison |
| 6 | gsd-debugger is 1445 lines with full methodology; hm-l2-debugger is 188 lines (13%) | wc -l comparison | Direct/metric |
| 7 (root cause) | Agent bodies were generated with structure-first approach (schema templates) but never enriched with domain-expert content | Inferred from consistent pattern across all 45 agents | Analysis |

---

*Generated by hm-l2-investigator on 2026-05-10. This audit is read-only — no files were modified.*
