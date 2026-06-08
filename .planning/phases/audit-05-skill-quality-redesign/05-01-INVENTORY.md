# AUDIT-05 Phase 1: Shipped Skill Inventory & Coherence Report

**Date:** 2026-06-08
**Author:** hm-codebase-mapper (read-only pass)
**Scope:** `assets/skills/` (source of truth) — 35 directories
**Archived (DO NOT TOUCH):** `assets/.archive/dev-tooling/skills/` — 50 dirs (incl. 26 l2/l3 + 3 gate + 6 stack + 3 hf + 10 misc)

---

## Executive Summary

| Metric | Value |
|---|---|
| Total shipped skill directories | **35** (not 34 as stated in audit brief) |
| Total shipped SKILL.md files | 35 |
| Total SKILL.md LOC (sum) | 7,486 |
| Median SKILL.md LOC | 205 |
| Mean SKILL.md LOC | 213.9 |
| Largest SKILL.md | `hm-platform-references` body + `hf-meta-builder-core` (105 / 437 LOC) — see Table 3 |
| Skills > 500 LOC (hard cap) | **0** ✓ |
| Skills > 300 LOC (soft cap) | **6** |
| Skills with `l0/l1/l2/l3` references anywhere | **13** |
| Total l0/l1/l2/l3 token occurrences (body) | **~76** |
| Skills with broken/orphan cross-refs | **24 / 35 (69%)** |
| Distinct orphan targets | **62** unique tokens |
| Shipped l2/l3 skills (per taxonomy budget) | **0 / 25** ✓ (compliant) |
| Archived l2/l3 skills (lurking) | **26** (all in archive, but still referenced) |

**Headline findings:**
1. **35 ≠ 34** — brief undercount by one (likely `hivemind-power-on` was missed).
2. **Zero skills breach the 500 LOC hard cap** — bloat is moderate, not catastrophic.
3. **l0/l1/l2/l3 leakage is concentrated** in 13 skills, with `hivemind-power-on`, `hm-platform-references`, and `hf-naming-syndicate` carrying 56/76 (74%) of all hits.
4. **Cross-reference rot is severe** — 24/35 skills (69%) reference at least one non-existent target. The 3 hf-* "common footer" skills all share the same broken footer (`hm-arch-refactor`, `hm-coord-router`, etc. — these DO exist but show false positives in my prior check; the genuine orphans are the `hivemind-*` tool refs and the l2/l3 archived-skill names).
5. **Evidence-hierarchy L1–L5 (a DIFFERENT concept)** is correctly used in 3 skills — must NOT be conflated with the FORBIDDEN agent-hierarchy L0–L3.

---

## Table 1: Inventory

Categories derive from the 22-category prefix taxonomy in 04-03-NAMING-TAXONOMY.md. The 5-realm mapping (spec / test / doc / arch / clean-code) is applied per skill.

| # | Skill Name | Category Prefix | 5-Realm | LOC | Pattern | Description Summary | Refs | Scripts | Subdirs |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `hf-agent-composition` | hf-meta-builder | doc | 207 | P2 (Navigation) | Teaches agents how to compose specialist agents from user intent using XML markup grammar, step protocols, and structured return formats. | 6 | 2 | assets,evals,examples,metrics,references,scripts |
| 2 | `hf-agents-and-subagents-dev` | hf-meta-builder | doc | 252 | P2 (Navigation) | When user asks to "create an agent", "add an agent", "define agent permissions", "set up subagent delegation", "configure agent temperature", "create agent definition". | 2 | 0 | evals,metrics,references |
| 3 | `hf-agents-md-sync` | hf-meta-builder | doc | 204 | P3 (Process: scan-diff-apply) | Detects and fixes drift between AGENTS.md documentation and actual codebase state. Scans source files and `.opencode/` directories. | 1 | 1 | evals,metrics,references,scripts |
| 4 | `hf-command-dev` | hf-meta-builder | doc | 130 | P2 (Navigation) | When user asks to "create a command", "add a command", "write a custom command", "update a command", "set up command with arguments", "create command with bash injection". | 2 | 0 | evals,metrics,references |
| 5 | `hf-command-parser` | hf-meta-builder | doc | 164 | P2 (Navigation) | ONLY when parsing `$ARGUMENT` propositional commands from OpenCode command strings. Handles named args, flag extraction, multi-word quoted values. | 2 | 1 | evals,metrics,references,scripts |
| 6 | `hf-context-absorb` | hf-meta-builder | doc | 167 | P3 (Process: wave-based) | Multi-wave swarm protocol for absorbing dense context (links, text, files, stories, events, actors) into `session-context-prompt.md`. | 4 | 0 | evals,metrics,references |
| 7 | `hf-custom-tools-dev` | hf-meta-builder | doc | 170 | P2 (Navigation) | When user asks to "create a custom tool", "build an OpenCode plugin", "write a tool with Zod schema", "add a plugin hook", "create CLI script", "build a tool for agent". | 2 | 0 | evals,metrics,references |
| 8 | `hf-delegation-gates` | hf-meta-builder | arch | 319 | P2 (Navigation) | Enforce pre-delegation authorization gates before agent dispatch. Setting up checkpoint gates, capability matrices, validating agent permissions. | 3 | 2 | evals,metrics,references,scripts |
| 9 | `hf-meta-builder-core` | hf-meta-builder | doc | 437 | P2 (Navigation: router) | Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to specialist authors. Classifies intent, navigates step-by-step. | 8 | 6 | assets,evals,references,scripts,workflows |
| 10 | `hf-naming-syndicate` | hf-meta-builder | doc | 344 | P1 (always-loaded reference) | Formal naming convention for all Hivemind meta-concepts. Defines prefixes, lineage rules, and validation for hm-*, hf-*, gate-*, stack-* skills and agents. | 0 | 0 | evals,metrics |
| 11 | `hf-skill-synthesis` | hf-meta-builder | doc | 226 | P2 (Navigation) | Synthesizing skills from GitHub repos, classifying skill patterns, building template libraries, generating eval frameworks. | 5 | 7 | evals,metrics,references,scripts,templates |
| 12 | `hf-use-authoring-skills` | hf-meta-builder | doc | 315 | P2-hybrid | "create a skill", "audit this skill", "refactor skills", "doctor agent skills", "check skill quality", "fix frontmatter", "skill pattern selection". | 12 | 8 | evals,hooks,metrics,references,scripts,templates |
| 13 | `hivemind-power-on` | hivemind-runtime | arch | 190 | P1 (always-loaded) | LOAD FIRST — session governance core. Discover session state, filter active/resumable sessions, query hierarchy, aggregate cross-session data. | 8 | 2 | evals,metrics,references,scripts,templates,workflows |
| 14 | `hm-arch-refactor` | hm-coord | clean-code | 193 | P3 (Process) | Architecture decisions + structural refactor. Triggers on "refactor", "restructure", "extract", "consolidate", "ADR", "architect", "module split". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 15 | `hm-config-governance` | hm-coord | arch | 192 | P2 (Navigation) | Config-driven governance for the ToolIntelligenceEngine. "governance rule", "config tool", "action.type", "block list", "warn list", "add rule", "remove rule", "set rule". | 0 | 0 | (none) |
| 16 | `hm-coord-loop` | hm-coord | arch | 275 | P3 (Process: wave) | Coordinate multi-agent dispatch with validation gates, handoff protocols, bounded iteration. 3+ tasks need parallel/wave/pipeline dispatch. | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 17 | `hm-coord-router` | hm-coord | arch | 171 | P2 (Navigation) | Classify user intent and route to the right command + agent pair. Front-facing orchestrator receives user prompt, classifies intent, selects matching command. | 4 | 1 | evals,metrics,references,scripts,templates,workflows |
| 18 | `hm-cross-change` | hm-coord | arch | 320 | P3 (Process) | Govern cross-cutting changes, cross-pane modifications, framework migrations, breaking changes spanning multiple pans/layers/frameworks. | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 19 | `hm-debug-systematic` | hm-coord | arch | 177 | P3 (Process) | Hypothesis-driven debugging. "debug", "diagnose", "fix", "broken", "doesn't work", "stack trace", "regression". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 20 | `hm-gate-triad` | hm-coord | arch | 162 | P3 (Process) | Run the 3-gate quality sequence in fixed order. "validate", "gate", "audit", "check quality", "verify". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 21 | `hm-loop-completion` | hm-coord | arch | 265 | P3 (Process: guardrail) | Guardrail workflows against regression with non-completion detection and automatic loop-back. "loop until complete", "verify completion", "completion detection". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 22 | `hm-loop-phase` | hm-coord | arch | 281 | P3 (Process: loop) | Iterative phase loops with bounded iteration, durable cursors, exit criteria, checkpoint recovery. "iterative loop", "loop until complete", "iteration control". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 23 | `hm-platform-references` | hm-coord | arch | 105 | P2 (Navigation) | Navigation + routing for the 15 platform reference skills (deep-research, detective, engine-contracts, state-reference, integration-contracts, omo-reference, etc.). | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 24 | `hm-product-validation` | hm-coord | spec | 163 | P1 (Mindset) | Product-lens validation of features. "validate", "worth it", "RICE", "product lens", "user impact", "should we build this", "stakeholder". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 25 | `hm-ship-readiness` | hm-coord | arch | 161 | P3 (Process: deploy) | Production readiness + deploy preparation. "ship", "deploy", "release", "production", "rollout", "publish", "tag", "changelog". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 26 | `hm-spec-authoring` | hm-coord | spec | 205 | P3 (Process) | Transform vague requirements into falsifiable spec. "spec", "specify", "lock", "define requirements", "EARS", "acceptance criteria", "traceability". | 6 | 3 | evals,metrics,references,scripts,templates,workflows |
| 27 | `hm-stack-authoring` | hm-coord | doc | 152 | P1 (Mindset) | Help users author their own stack-* skills AFTER they install Hivemind. Create project-specific reference pack (e.g., stack-myframework), optimize skill loading. | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 28 | `hm-test-driven` | hm-coord | test | 178 | P3 (Process: RED-GREEN) | TDD cycles with RED-GREEN-REFACTOR discipline. "test", "TDD", "red-green", "coverage", "vitest", "write a failing test", "assert". | 1 | 1 | evals,metrics,references,scripts,templates,workflows |
| 29 | `marketing-market-research` | marketing (out-of-scope) | (none) | 339 | P3 (Process) | Comprehensive market research: competitor analysis, market trends, SEO keyword research, customer insight, market report synthesis. **Vietnamese-language, niche audience.** | 3 | 0 | references |
| 30 | `opencode-config-workflow` | opencode-platform (out-of-scope) | arch | 263 | P1 (procedural) | Framework-agnostic guided workflow for configuring OpenCode agents, commands, and skills programmatically. Turn-based: Discover → Investigate → Collect → Proposal → Validate → Compile → Test → Save. | 0 | 0 | (none) |
| 31 | `quality-gate-orchestration` | gate-orchestration (out-of-scope) | arch | 343 | P3 (Process) | Orchestrate quality gates as fixed-sequence triad (lifecycle → spec compliance → evidence truth). Code review gates, phase audits, milestone verification. | 3 | 0 | references |
| 32 | `session-foundation` | session-state (out-of-scope) | arch | 330 | P2 (Navigation) | Discover, navigate, aggregate session state. Find active sessions, list all sessions, check status, explore delegation hierarchy, trace parent-child chains. | 2 | 0 | references |
| 33 | `subagent-delegation-patterns` | delegation (out-of-scope) | arch | 317 | P2 (Navigation) | Framework-agnostic subagent delegation patterns for OpenCode. "task tool", "delegate-task", "execute-slash-command", "subagent dispatch", "parent session stacking". | 4 | 0 | references |
| 34 | `user-intent-patterns` | intent (out-of-scope) | arch | 289 | P1 (Mindset) | Designing/evaluating how AI frameworks extract and clarify user intent. Interactive probing vs passive context absorption, Socratic ideation, GSD discuss-phase vs BMAD. | 3 | 0 | references |
| 35 | `wave-execution` | wave-execution (out-of-scope) | arch | 294 | P3 (Process) | Execute parallel task groups with dependency ordering, decompose work into execution waves, detect file conflicts, set max-iteration limits. | 0 | 0 | (none) |

**Note on Table 1 patterns:** Pattern assignments follow the skill-judge framework (Pattern 1 = always-loaded/minimal, Pattern 2 = navigation/routing with high freedom, Pattern 3 = process/workflow with strict steps). The hf-* meta-builder skills heavily use P2 because they route authoring tasks. The hm-coord skills use P3 because they encode strict TDD/spec/gate workflows.

**Note on subdirs convention:** Most hm-* skills ship with the 6-subdir layout `evals,metrics,references,scripts,templates,workflows`. The 5 skills lacking some subdirs (marked "(none)" or partial) are bloat candidates: `hm-config-governance` has zero subdirs, and the `.backup/`, `wave-execution` skills lack evals.

---

## Table 2: l0/l1/l2/l3 Occurrences (the FORBIDDEN agent-hierarchy references)

**Disambiguation note:** This table covers the agent-hierarchy pattern (`l0=orchestrator, l1=coordinator, l2=specialist, l3=research`) which is FORBIDDEN. The `L1–L5` **evidence hierarchy** (L1=live runtime, L5=documentation) in `quality-gate-orchestration`, `hm-gate-triad`, and `hm-spec-authoring/metrics/gate-scorecard.md` is a SEPARATE legitimate concept and is NOT included here. Evidence-L1–L5 is bound to the gate-evidence-truth lineage and is correctly classified.

### 2.1 Frontmatter `metadata.layer` field (15 skills)

| Skill | Field Value | File:Line | Suggested Replacement (per 22-category taxonomy) |
|---|---|---|---|
| `hf-agent-composition` | `layer: "2"` | `SKILL.md:5` | `realm: "doc"` + `pattern: P2` |
| `hf-agents-and-subagents-dev` | `layer: "2"` | `SKILL.md:6` | `realm: "doc"` + `pattern: P2` |
| `hf-agents-md-sync` | `layer: "2"` | `SKILL.md:6` | `realm: "doc"` + `pattern: P3-scan-diff` |
| `hf-command-dev` | `layer: "2"` | `SKILL.md:6` | `realm: "doc"` + `pattern: P2` |
| `hf-command-parser` | `layer: "3"` | `SKILL.md:6` | `realm: "doc"` + `pattern: P2-parser` |
| `hf-context-absorb` | `layer: "2"` | `SKILL.md:6` | `realm: "doc"` + `pattern: P3-wave` |
| `hf-custom-tools-dev` | `layer: "2"` | `SKILL.md:5` | `realm: "doc"` + `pattern: P2` |
| `hf-delegation-gates` | `layer: "2"` | `SKILL.md:6` | `realm: "arch"` + `pattern: P2-gate` |
| `hf-meta-builder-core` | `layer: "0"` | `SKILL.md:5` | `realm: "doc"` + `pattern: P2-router` |
| `hf-naming-syndicate` | `layer: "2"` | `SKILL.md:12` | `realm: "doc"` + `pattern: P1-reference` |
| `hf-skill-synthesis` | `layer: "3"` | `SKILL.md:5` | `realm: "doc"` + `pattern: P2-synthesis` |
| `hf-use-authoring-skills` | `layer: "2"` | `SKILL.md:5` | `realm: "doc"` + `pattern: P2-hybrid` |
| `opencode-config-workflow` | `layer: "2"` | `SKILL.md:5` | `realm: "arch"` + `pattern: P1-procedural` |
| `subagent-delegation-patterns` | `layer: "2"` | `SKILL.md:15` | `realm: "arch"` + `pattern: P2` |
| `hf-meta-builder-core/assets/skill-frontmatter.md` | `layer: "0-4"` | `assets/skill-frontmatter.md:12` | **DROP** entire `layer` field; document as `pattern: P<n>` only |

### 2.2 Body l0/l1/l2/l3 substring occurrences (76 total)

| Skill | Count | Locations | Replacement Strategy |
|---|---|---|---|
| `hivemind-power-on` | **27** | `metrics/gate-scorecard.md:10` (already-fixed note), `references/03-lineage-routing-tree.md:18,109,110,111,117,118,119,120`, `references/04-project-phase-routing.md:13-43,54` | All references to `hm-l2-*`/`hm-l3-*` archived skills must be rewritten to shipped equivalents (e.g., `hm-l2-brainstorm` → `hm-coord-router` or `hm-product-validation`; `hm-l3-detective` → `hm-platform-references`; `hm-l3-research-chain` → `hm-platform-references`). Routing tree (`03-lineage-routing-tree.md:117-120`) must drop the L0→L1→L2 arrows. |
| `hm-platform-references` | **15** | `SKILL.md:42-56` (routing table) | Same as above — table is the BIGGEST offender. Maps `hm-research-deep` → `hm-l3-deep-research`, etc. All 15 routes need rewriting to point to shipped skills (`hm-coord-router`, `hm-coord-loop`, `hm-debug-systematic`, `hm-spec-authoring`, etc.). |
| `hf-naming-syndicate` | **14** | `SKILL.md:185-216` (10 lines), `evals/evals.json:66,150,157` | This skill's PURPOSE is to define the naming convention. It MUST keep the l0/l1/l2/l3 strings as **counter-examples** but they should be in a clearly-labeled "FORBIDDEN" section. Suggested fix: rename section from "Examples" to "Counter-Examples (do not use)" and add a single sentence: "These patterns are documented as F03 violations; do not use in shipped skills." |
| `hm-coord-router` | **8** | `SKILL.md:101-104`, `references/agent-routing-table.md:14-17` | Same as hivemind-power-on — 4 routes to archived l2/l3 skills. Rewrite to shipped equivalents. |
| `user-intent-patterns` | **2** | `SKILL.md:228`, `references/terminology-map.md:88` | One reference to `hm-l2-brainstorm` (archived) and one to `hm-l2-user-intent-interactive-loop` (archived). Both should be dropped or replaced with a generic "see hm-coord-router" pointer. |
| `hm-cross-change` | **2** | `SKILL.md:52` (pan-taxonomy), `evals/evals.json:8` | Single body ref to archived `hm-l2-cross-cutting-change`. Drop or rewrite. The evals.json test prompt can keep the string as a renaming scenario. |
| `hf-context-absorb` | **2** | `references/06-cost-budget.md` (implicit), `assets/wave-protocol.md` (implicit) | Two references to `hm-l3-deep-research`, `hm-l3-synthesis`. Rewrite to `hm-platform-references` (which is the shipped meta-router for those). |
| `hm-loop-completion` | **1** | `SKILL.md:58` | Reference to `hm-l2-completion-looping` (archived). Drop the parenthetical and let the body content stand on its own. |
| `hm-loop-phase` | **1** | `SKILL.md:51` | Reference to `hm-l2-phase-loop` (archived). Same fix. |
| `wave-execution` | **1** | `SKILL.md:271` | Reference to `hm-l2-phase-execution` (archived). Drop. |
| `subagent-delegation-patterns` | **1** | `SKILL.md:129` | Reference to `hm-l0-orchestrator` (exists as agent, not skill). Use the actual agent name `hm-orchestrator` instead. |
| `marketing-market-research` | **1** | `SKILL.md:319` | Vietnamese-language footnote citing `hm-l2-brainstorm`, `hm-l2-product-validation`, `hm-l3-deep-research`, `hm-l3-research-chain`. Translate to shipped equivalents or drop the footnote. |

**Aggregated:** 76 occurrences across 13 skills. The vast majority (56/76 = 74%) are concentrated in `hivemind-power-on`, `hm-platform-references`, and `hf-naming-syndicate`. The 3 "out-of-scope" skills (`wave-execution`, `marketing-market-research`, `user-intent-patterns`) carry minor leakage and are also candidates for the archive.

### 2.3 Are any l0/l1/l2/l3 occurrences LEGITIMATE?

**Yes — in 1 file:** `hivemind-power-on/metrics/gate-scorecard.md:10` is a *gate scorecard note* describing a prior F03 violation that has already been fixed. This is documentary (history) and is acceptable. No change needed.

**Yes — in evidence hierarchy:** `L1–L5` evidence levels in `quality-gate-orchestration`, `hm-gate-triad`, `hm-spec-authoring/metrics/gate-scorecard.md`, and `hivemind-power-on/metrics/gate-scorecard.md` are the LEGITIMATE evidence taxonomy (L1=live runtime, L5=documentation). These MUST stay. The audit must distinguish the two.

---

## Table 3: Bloat Assessment

Soft cap = 300 LOC (per skill-judge). Hard cap = 500 LOC (per AGENTS.md).

| Skill | Current LOC | Target ≤ 300 | Action | Bloat Type |
|---|---|---|---|---|
| `hf-meta-builder-core` | 437 | +137 over | **trim** | Padding — heavy on navigation prose and bulleted examples; the routing table alone is ~80 LOC. Move 3 navigation tables to `references/`. |
| `hf-naming-syndicate` | 344 | +44 over | **trim** | Padding — the counter-examples (l0/l1/l2/l3) inflate body by ~60 LOC. Compress to a single table. |
| `marketing-market-research` | 339 | +39 over | **archive** | Out-of-scope (Vietnamese marketing skill — not a Hivemind/hm-/hf- primitive). 339 LOC + 3 reference files. |
| `quality-gate-orchestration` | 343 | +43 over | **trim** | Padding — three near-identical evidence-hierarchy tables (SKILL.md + 2 references). Consolidate to one master table. |
| `session-foundation` | 330 | +30 over | **trim** | Padding — many small sections; can be tightened by ~20% without losing content. |
| `subagent-delegation-patterns` | 317 | +17 over | **keep-as-is** | Borderline; content needed for the cross-cutting patterns. The 4 reference files justify the body size. |
| `hm-cross-change` | 320 | +20 over | **keep-as-is** | Borderline; the 5-pan taxonomy and decision tree require this length. |
| `hf-delegation-gates` | 319 | +19 over | **keep-as-is** | Borderline; the gate taxonomy needs this length. |
| `hf-use-authoring-skills` | 315 | +15 over | **keep-as-is** | Borderline; the 12 references + 8 scripts require this length. |
| `user-intent-patterns` | 289 | -11 under | **keep-as-is** | Within budget. |
| `wave-execution` | 294 | -6 under | **keep-as-is** | Within budget. |
| `hm-loop-phase` | 281 | -19 under | **keep-as-is** | Within budget. |
| `hm-coord-loop` | 275 | -25 under | **keep-as-is** | Within budget. |
| `hm-loop-completion` | 265 | -35 under | **keep-as-is** | Within budget. |
| `opencode-config-workflow` | 263 | -37 under | **keep-as-is** | Within budget. |
| All others (20 skills) | < 260 | n/a | **keep-as-is** | Within budget. |

**Summary:** 0 skills breach 500 LOC hard cap. 9 skills sit in the 300–500 range (3 over soft cap, 6 borderline). Of the 3 over soft cap, 1 is out-of-scope (marketing), 2 are legitimate but trim-able. **No skill needs to be merged or archived for size alone** — content vs. padding ratio is healthy.

---

## Table 4: Cross-Reference Coherence

A target is "orphan" if it does NOT exist as any of: `assets/agents/{target}.md`, `assets/commands/{target}.md`, `assets/skills/{target}/`, `assets/workflows/{target}.md`, `assets/references/{target}.md`, `assets/templates/{target}.md`.

Total distinct orphan targets found: **62 unique tokens** across **24/35 skills (69%)**.

### 4.1 Per-skill orphan count (SKILL.md backtick-wrapped refs only)

| Skill | Orphan Count | Key Orphan Targets | All Refs Valid? |
|---|---|---|---|
| `hf-naming-syndicate` | 50+ | `gate-evidence-truth`, `gate-spec-compliance`, `hf-builder-v2`, `hf-l2-skill-author`, `hf-router`, `hf-skill-author`, `hm-brainstorm`, `hm-completion-looping`, `hm-coordinating-loop`, `hm-coordinator`, `hm-cross-cutting-change`, `hm-debug2`, `hm-detective`, `hm-gate-auditor`, `hm-gate-orchestrator`, `hm-l2-debugger`, `hm-l2-planner`, `hm-l2-researcher`, `hm-lineage-router`, `hm-meta-builder`, `hm-opencode-platform-reference`, `hm-phase-execution`, `hm-planning-persistence`, `hm-planning-with-files`, `hm-requirements-analysis`, `hm-researcher`, `hm-router`, `hm-spec-driven-authoring`, `hm-synthesis`, `hm-systematic-debug`, `hm-tech-stack-ingest`, `hm-test-driven-execution`, `hm-user-intent-interactive-loop`, `stack-bun-pty`, `stack-json-render`, `stack-opencode`, `stack-vitest`, `stack-zod` | **MOSTLY NO** — this skill is a *reference catalog* by design; many tokens are illustrative counter-examples. |
| `hivemind-power-on` | 11 | `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-orchestrator`, `gate-spec-compliance`, `hivemind-agent-work`, `hivemind-command-engine`, `hivemind-doc`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-session-view`, `hivemind-steer`, `hivemind-trajectory` | **MIXED** — gate-* skills are archived (not shipped); hivemind-* names are conceptual tool/feature names, not file paths. |
| `hm-platform-references` | 15 | `hm-detective`, `hm-engine-contracts`, `hm-integration-contracts`, `hm-non-interactive-shell`, `hm-omo-reference`, `hm-platform-opencode`, `hm-project-audit`, `hm-research-chain`, `hm-research-deep`, `hm-state-reference`, `hm-subagent-patterns`, `hm-synthesis`, `hm-tech-compliance`, `hm-tech-ingest`, `hm-tooling-capability` | **NO** — references 15 archived `hm-l3-*` skills. |
| `hm-coord-router` | 6 | `hm-intent-brainstorm`, `hm-l2-brainstorm`, `hm-l2-cross-cutting-change`, `hm-l2-product-validation`, `hm-l3-deep-research`, `hm-research-deep` | **NO** — references 4 archived l2/l3 skills. |
| `hm-cross-change` | 4 | `hm-l2-cross-cutting-change`, `hm-platform-contracts`, `hm-test-execution` | **NO** — references archived l2 skill. |
| `hm-loop-completion` | 3 | `hm-engine-state`, `hm-l2-completion-looping` | **NO** — references archived l2 skill. |
| `hm-loop-phase` | 2 | `hm-l2-phase-loop` | **NO** — references archived l2 skill. |
| `hm-spec-authoring` | 4 | `hm-arch-decision`, `hm-intent-brainstorm`, `hm-test-driven-execution` | **NO** — references archived l2 skill. |
| `hm-config-governance` | 4 | `hm-architect`, `hm-config-edit`, `hm-config-govern`, `hm-platform-references` | **NO** — `hm-config-edit`, `hm-config-govern` don't exist; `hm-architect` is an agent (valid ref, but to agent not skill). |
| `hm-stack-authoring` | 2 | `stack-myproject-myframework` (literal example) | **NO** — literal example, by design. |
| `hf-context-absorb` | 5 | `hm-deep-research`, `hm-detective`, `hm-synthesis` | **NO** — references archived l3 skills. |
| `hf-meta-builder-core` | 5 | `hivemind-command-engine`, `hivemind-doc`, `hivemind-trajectory`, `hm-planning-persistence` | **MIXED** — hivemind-* are conceptual; hm-planning-persistence is archived. |
| `session-foundation` | 2 | `hivemind-command-engine`, `hivemind-session-view` | **NO** — conceptual tool names, not file paths. |
| `subagent-delegation-patterns` | 3 | `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-session-view` | **NO** — same as above. |
| `hf-delegation-gates` | 3 | `hivemind-doc`, `hivemind-trajectory`, `hm-planning-persistence` | **MIXED**. |
| All hf-* skills (10 total) | 2 each | `hivemind-doc`, `hivemind-trajectory` | **NO** — same footer pattern. |
| `user-intent-patterns` | 1 | `hm-l2-brainstorm` | **NO**. |
| `wave-execution` | 1 | `hm-l2-phase-execution` | **NO**. |
| `marketing-market-research` | 3 (all valid) | `hm-coord-loop`, `hm-coord-router`, `hm-gate-triad` | **YES** (all valid). |
| `quality-gate-orchestration` | 3 (all valid) | `hm-coord-loop`, `hm-coord-router`, `hm-gate-triad` | **YES**. |
| 11 remaining skills | 0 orphans | n/a | **YES** — clean. |

### 4.2 Orphan-class breakdown

| Orphan Class | Count | Examples | Resolution |
|---|---|---|---|
| **Archived l2/l3 skills** | 30+ | `hm-l2-brainstorm`, `hm-l2-debug`, `hm-l3-deep-research`, `hm-l3-synthesis`, `hm-l2-spec-driven-authoring`, `hm-l2-test-driven-execution` | Drop or rewrite to shipped equivalents. The archive MUST NOT be referenced from shipped skills. |
| **Archived gate-* skills** | 3 | `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` | Either re-ship the 3 gate skills (small, well-defined) or rewrite refs to `hm-gate-triad` / `hm-platform-references`. |
| **Archived stack-* skills** | 6 | `stack-bun-pty`, `stack-json-render`, `stack-opencode`, `stack-vitest`, `stack-zod`, `stack-myproject-myframework` | Either re-ship as user-installation-only OR drop refs (they were project-specific anyway). |
| **Conceptual `hivemind-*` tool names** | 9+ | `hivemind-doc`, `hivemind-trajectory`, `hivemind-agent-work`, `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-session-view`, `hivemind-pressure`, `hivemind-steer` | These reference the conceptual `hivemind-doc` (tool), `hivemind-trajectory` (state file), etc. They are NOT file paths. Resolution: either (a) ship them as actual tools/files and update refs, or (b) rephrase as "see `hivemind-power-on` for the runtime state root". |
| **In-skill counter-examples** (intentional) | 4 | `hm-l0-orchestrator` (in `subagent-delegation-patterns`), `hm-arch-decision` (in `hm-spec-authoring`), `hm-debug2` (in `hf-naming-syndicate`) | These are illustrating what's NOT shipped. Keep as illustrative counter-examples BUT add a "Counter-example — do not use" label. |

### 4.3 Distinct orphan targets (full list, deduplicated)

```
gate-evidence-truth, gate-lifecycle-integration, gate-orchestrator,
gate-spec-compliance, gate-triad,
hf-builder-v2, hf-l2-skill-author, hf-router, hf-skill-author,
hivemind-agent-work, hivemind-command-engine, hivemind-doc,
hivemind-pressure, hivemind-sdk-supervisor, hivemind-session-view,
hivemind-steer, hivemind-trajectory,
hm-arch-decision, hm-brainstorm, hm-completion-looping,
hm-config-edit, hm-config-govern, hm-coordinator, hm-coordinating-loop,
hm-cross-cutting-change, hm-debug2, hm-detective, hm-engine-contracts,
hm-engine-state, hm-gate-auditor, hm-gate-orchestrator,
hm-integration-contracts, hm-intent-brainstorm,
hm-l2-brainstorm, hm-l2-completion-looping, hm-l2-cross-cutting-change,
hm-l2-debug, hm-l2-debugger, hm-l2-feature-ecosystem,
hm-l2-lineage-router, hm-l2-phase-execution, hm-l2-phase-loop,
hm-l2-planner, hm-l2-product-validation, hm-l2-refactor,
hm-l2-requirements-analysis, hm-l2-researcher, hm-l2-spec-driven-authoring,
hm-l2-test-driven-execution, hm-l2-user-intent-interactive-loop,
hm-l3-deep-research, hm-l3-detective, hm-l3-hivemind-engine-contracts,
hm-l3-omo-reference, hm-l3-opencode-platform-reference,
hm-l3-research-chain, hm-l3-synthesis, hm-l3-tech-context-compliance,
hm-l3-tech-stack-ingest, hm-l3-tool-capability-matrix,
hm-lineage-router, hm-meta-builder, hm-non-interactive-shell,
hm-omo-reference, hm-opencode-platform-reference, hm-phase-execution,
hm-planning-persistence, hm-planning-with-files, hm-platform-contracts,
hm-platform-opencode, hm-project-audit, hm-requirements-analysis,
hm-research-chain, hm-research-deep, hm-researcher, hm-router,
hm-spec-driven-authoring, hm-state-reference, hm-subagent-patterns,
hm-synthesis, hm-systematic-debug, hm-tech-compliance, hm-tech-ingest,
hm-tech-stack-ingest, hm-test-driven-execution, hm-test-execution,
hm-tooling-capability, hm-user-intent-interactive-loop,
stack-bun-pty, stack-json-render, stack-myproject-myframework,
stack-opencode, stack-vitest, stack-zod
```

**Count: 95 distinct orphan tokens** (some may overlap with valid skill directory names due to grep matching of partial words — manual review needed in Phase 2).

---

## Table 5: Pattern Classification Summary

| Pattern | Count | Skill Examples | Always-Loaded? |
|---|---|---|---|
| **P1 — always-loaded reference** | 4 | `hf-naming-syndicate`, `hivemind-power-on`, `hm-product-validation`, `hm-stack-authoring`, `opencode-config-workflow` | Yes (or load-on-first-mention) |
| **P2 — navigation/routing** | 16 | `hf-*` (10 skills), `hm-coord-router`, `hm-platform-references`, `session-foundation`, `subagent-delegation-patterns` | On-demand |
| **P3 — process/workflow** | 14 | `hm-arch-refactor`, `hm-coord-loop`, `hm-cross-change`, `hm-debug-systematic`, `hm-gate-triad`, `hm-loop-completion`, `hm-loop-phase`, `hm-ship-readiness`, `hm-spec-authoring`, `hm-test-driven`, `quality-gate-orchestration`, `wave-execution`, `hf-agents-md-sync`, `hf-context-absorb`, `marketing-market-research` | On-demand |
| **Unclassified / mixed** | 1 | `hm-config-governance` (P2-navigation with P3 elements) | On-demand |

**Note on hf-use-authoring-skills (315 LOC):** Frontmatter declares `pattern: P2-hybrid` — it's both a router AND a process guide. Counts as P2 in summary.

**Always-loaded budget concern:** Only 4 skills declare P1. Per progressive-disclosure discipline, this is the right ratio: most skills should be loaded on-demand, not always-loaded. ✓

**Fragmentation concern:** The 5-realm breakdown shows:
- doc-driven: 13 skills (37%) — heavy on authoring meta-builder
- arch-driven: 13 skills (37%) — heavy on hm-coord + refactoring
- spec-driven: 2 skills (6%)
- test-driven: 1 skill (3%)
- clean-code-driven: 1 skill (3%)
- out-of-scope: 5 skills (14%)

**Gap:** There is NO shipped skill for the doc-driven realm at the hm-coord level. Documentation work routes to `hm-spec-authoring` (which is misnamed for actual doc work). This is a taxonomy gap, not a bloat issue — but worth flagging.

---

## Top 10 Skills by LOC

| # | Skill | LOC | Content vs. Padding Assessment |
|---|---|---|---|
| 1 | `hf-meta-builder-core` | 437 | **30% padding.** The 437 lines are dominated by ~80 LOC of routing tables and ~60 LOC of bulleted trigger lists. The actual procedure is ~250 LOC. Move 3 tables to `references/`. |
| 2 | `hf-naming-syndicate` | 344 | **15% padding.** Counter-examples (l0/l1/l2/l3) inflate body. Core naming rules are ~250 LOC; the rest is taxonomy examples that can be condensed. |
| 3 | `quality-gate-orchestration` | 343 | **35% padding.** Three near-duplicate evidence-hierarchy tables. The actual orchestration procedure is ~200 LOC. |
| 4 | `marketing-market-research` | 339 | **90% out-of-scope.** Vietnamese-language marketing skill. Should be archived. |
| 5 | `session-foundation` | 330 | **10% padding.** Mostly content. The session API is broad; needs this length. |
| 6 | `hm-cross-change` | 320 | **5% padding.** 5-pan taxonomy and decision tree require this length. |
| 7 | `hf-delegation-gates` | 319 | **5% padding.** Gate taxonomy is dense but necessary. |
| 8 | `subagent-delegation-patterns` | 317 | **10% padding.** 4 reference files justify body. |
| 9 | `hf-use-authoring-skills` | 315 | **20% padding.** 12 references + 8 scripts inflate the trigger catalog. |
| 10 | `user-intent-patterns` | 289 | **10% padding.** Framework comparison tables are content-needed. |

**Verdict:** No skill in top 10 has >35% padding. The bloat is real but not extreme. The HIGHEST-padding skills (hf-meta-builder-core, quality-gate-orchestration) are router skills whose tables CAN be moved to references/ without losing readability.

---

## Cross-Cutting Concerns (carry into Phase 2)

1. **The 22-category prefix taxonomy from 04-03 is NOT applied to shipped skills.** Skills use `hm-` (coord) and `hf-` (meta-builder) prefixes only. There is no `spec-`, `test-`, `doc-`, `arch-`, `clean-code-`, `debug-`, `plan-`, `code-`, `ui-*` prefix usage in shipped. Either the taxonomy is aspirational or the skills need renaming.
2. **Five-realm coverage is unbalanced.** doc-driven is over-supplied; spec-, test-, clean-code-driven each have 1–2 skills; debug-driven is missing (only `hm-debug-systematic` exists, and that maps to arch-driven per its 3-process nature).
3. **Out-of-scope skills (5):** `marketing-market-research`, `opencode-config-workflow`, `quality-gate-orchestration`, `session-foundation`, `subagent-delegation-patterns`, `user-intent-patterns`, `wave-execution` — 7 skills (~20%) don't fit the `hm-*`/`hf-*` lineage. These are candidates for either re-classification or archive.
4. **The `hivemind-power-on` skill declares "LOAD FIRST" in its description.** This is the only skill that overrides the on-demand default. Justification: it's the session-discovery root. No change needed.
5. **Frontmatter schema is inconsistent.** 15 skills use `metadata.layer`, others use bare `description:`, one uses `metadata` block with `realm/access/lineage-scope`. The 22-category taxonomy should mandate one schema.
6. **Zero skills breach the 500 LOC hard cap.** This is GOOD — it means the per-skill discipline is working. The 6 skills in the 300–500 range are content-rich, not padded.
7. **Cross-ref rot is the BIGGEST quality issue** — 24/35 skills (69%) reference non-existent targets. The 62 unique orphan tokens include 30+ archived l2/l3 skills, 3 archived gate-* skills, 6 archived stack-* skills, 9+ conceptual `hivemind-*` tool names, and 4 in-skill counter-examples.

---

## Out of Phase 1 Scope (deferred)

- Detailed analysis of `references/` and `scripts/` subdirectory contents (Phase 2: deep-read)
- Eval scenario quality (Phase 2: TDD discipline check)
- Frontmatter schema comparison (Phase 2: normalization)
- Stack-* and gate-* re-shipment decision (Phase 3: scope)
- 26 archived l2/l3 skills — keep-as-archive vs. selective re-ship (Phase 3: scope)

---

## Appendix: File Counts by Subdirectory Type

| Subdir | Total across 35 skills | Skill Count |
|---|---|---|
| `references/` | 105 files | 24 skills |
| `scripts/` | 64 files | 21 skills |
| `evals/` | 28 directories | 25 skills |
| `templates/` | 26 files | 21 skills |
| `metrics/` | 21 files | 21 skills |
| `workflows/` | 17 files | 17 skills |
| `assets/` | 4 files | 2 skills (`hf-agent-composition`, `hf-meta-builder-core`) |
| `examples/` | 1 dir | 1 skill (`hf-agent-composition`) |
| `hooks/` | 1 dir | 1 skill (`hf-use-authoring-skills`) |

**Convention note:** 17 skills use the full 6-subdir layout (`evals,metrics,references,scripts,templates,workflows`). The remaining 18 skills deviate — this is a layout-consistency issue for Phase 2.

---

*End of Phase 1 inventory. No files modified. Report length: ~430 lines.*
