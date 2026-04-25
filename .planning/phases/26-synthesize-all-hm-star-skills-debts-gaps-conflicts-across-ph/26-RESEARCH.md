# Phase 26: Synthesize hm-* Skill Debts into Unified Quality Requirements — Research

**Researched:** 2026-04-25
**Domain:** Soft meta-concept quality audit, skill ecosystem synthesis, playbook derivation
**Confidence:** HIGH (based on direct file reads of all 32 skills + Phase 18 audit artifacts)

## Summary

The hm-* skill ecosystem contains 26 hm-* prefixed skills and 6 hivefiver-* prefixed skills (32 total soft meta-concepts). Phase 18's CR-AUDIT-ECOSYSTEM.md scored only 3 of 24 original skills as fully DEFENDED across all 6-NON dimensions. The G-B cluster (hm-spec-driven-authoring, hm-test-driven-execution) was created in Phase 20 as minimum-viable skeletons — 107 and 119 LOC respectively — with trigger-query-only evals and zero 6-NON defence. Phase 22 was archived as NOT SUBSTANTIATED (no verifiable 6-NON tables exist in skill files). Phase 23 delivered only 1/9 skills with stacked eval scenarios.

The core problem: template-driven creation in Phase 20 produced structurally valid but substantively hollow skills. The "minimum viable" pattern became the ceiling, not the floor. Phase 24 removed 6-NON tables (process guidance, not skill content) and added onboarding headings, but the body-depth and eval-coverage gaps remain open.

Phase 26 must produce: (1) a unified quality PLAYBOOK.md with measurable dimensions, (2) G-B demonstration SPECs proving the playbook is actionable, (3) an ecosystem audit catalog scoring all 32 skills, and (4) a Phase 27-30 execution roadmap.

**Primary recommendation:** Derive PLAYBOOK dimensions from the 3 fully-DEFENDED skills (hm-coordinating-loop, hm-user-intent-interactive-loop, hivefiver-use-authoring-skills) as exemplar patterns, then measure all others against that bar.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** hm-* skills must be standalone-superior — independently valuable without GSD dependency
- **D-02:** Benchmark quality bar = GSD skill ecosystem output quality
- **D-03:** Phase 26 delivers a unified quality PLAYBOOK.md covering ALL hm-* skills across all lineages
- **D-04:** G-B cluster receives full SPEC files as the demonstration template
- **D-05:** Phase 26 also produces: ecosystem audit catalog, Phase 27-30 roadmap, updated REQUIREMENTS.md entries
- **D-06:** Each PLAYBOOK dimension must address agent/command/tool/plugin-hook/runtime-state integration
- **D-07:** Skills must be platform-agnostic — no hardcoded assumptions about tools, paths, or project structure
- **D-08:** Phase 22 is ARCHIVED as NOT SUBSTANTIATED — its scope absorbed into PLAYBOOK standards
- **D-09:** Phase 23 scope is ABSORBED into PLAYBOOK standards — no separate re-execution needed
- **D-10:** Full hm-* ecosystem scope for audit (all 24+ skills). G-B is first improvement wave. G-C/G-D deferred to Phases 27-30
- **D-11:** Two lineages: "Quality Assurance" (G-B) and "Research + Execution" (G-C + G-D)

### Agent's Discretion
- Exact PLAYBOOK structure and dimension count
- Benchmark comparison methodology
- Phase 27-30 sequencing order and phase count
- Archive metadata format for Phase 22 and Phase 23 closure

### Deferred Ideas (OUT OF SCOPE)
- Full hm-* skill rewrites (G-B execution) — Phase 27
- G-C lineage improvement — Phase 28
- G-D lineage improvement — Phase 29
- G-A lineage improvement — Phase 30
- Cross-lineage integration testing — Phase 31
- Third-party skill registry benchmarking beyond GSD
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 26 requirements are derived from the synthesis process itself (not from REQUIREMENTS.md). The phase must deliver:

| ID | Description | Research Support |
|----|-------------|------------------|
| SYN-01 | Unified quality PLAYBOOK.md with measurable dimensions | Quality Dimension Framework section below |
| SYN-02 | G-B demonstration SPECs for hm-spec-driven-authoring and hm-test-driven-execution | G-B Cluster Analysis section below |
| SYN-03 | Ecosystem audit catalog scoring all 32 hm-*/hivefiver-* skills | Ecosystem Audit section below |
| SYN-04 | Phase 27-30 execution roadmap with sequencing rationale | Phase 27-30 Roadmap Basis section below |
| SYN-05 | Updated REQUIREMENTS.md entries for hm-* skill quality standards | Gap Consolidation section below |
| SYN-06 | Phase 22/23 formal closure with scope absorption | Gap Consolidation section below |
</phase_requirements>

---

## 1. Ecosystem Audit

### Complete Skill Inventory

**Total skills:** 32 (26 hm-* + 6 hivefiver-*)

| # | Skill | LOC | Refs | Evals | Scripts | Cluster | Quality Tier |
|---|-------|-----|------|-------|---------|---------|-------------|
| 1 | hm-coordinating-loop | 411 | 4 | 2 (evals.json + trigger-queries.json) | 8 | G-A | **EXEMPLAR** |
| 2 | hm-user-intent-interactive-loop | 422 | 5 | 2 (evals.json + trigger-queries.json) | 5 | G-A | **EXEMPLAR** |
| 3 | hm-meta-builder | 389 | 8 | 2 (evals.json + trigger-queries.json) | 6 | G-D | **EXEMPLAR** |
| 4 | hm-deep-research | 380 | 6 | 0 | 0 | G-C | SUBSTANTIVE |
| 5 | hm-synthesis | 371 | 7 | 0 | 0 | G-C | SUBSTANTIVE |
| 6 | hm-detective | 225 | 6 | 0 | 0 | G-C | SUBSTANTIVE |
| 7 | hm-skill-synthesis | 177 | 5 | 2 (evals.json + trigger-queries.json) | 7 | G-C | SUBSTANTIVE |
| 8 | hm-subagent-delegation-patterns | 160 | 3 | 0 | 0 | G-A | THIN |
| 9 | hm-planning-with-files | 158 | 3 | 0 | 0 | G-A/G-D | THIN |
| 10 | hm-agent-composition | 158 | 6 | 1 (evals.json only) | 0 | G-D | THIN |
| 11 | hm-opencode-project-audit | 161 | 1 | 0 | 0 | G-D | THIN |
| 12 | hm-agents-md-sync | 155 | 0 | 0 | 0 | G-D | THIN |
| 13 | hm-phase-execution | 151 | 2 | 1 (evals.json only) | 0 | G-D | THIN |
| 14 | hm-debug | 136 | 2 | 1 (evals.json only) | 0 | G-D | THIN |
| 15 | hm-phase-loop | 127 | 1 | 0 | 0 | G-A | THIN |
| 16 | hm-opencode-project-inspection | 125 | 3 | 0 | 0 | G-D | THIN |
| 17 | hm-refactor | 121 | 2 | 1 (evals.json only) | 0 | G-D | THIN |
| 18 | hm-completion-looping | 119 | 2 | 1 (evals.json only) | 0 | G-A | THIN |
| 19 | hm-test-driven-execution | 119 | 2 | 1 (evals.json only) | 0 | G-B | THIN |
| 20 | hm-command-parser | 114 | 1 | 0 | 0 | G-D | THIN |
| 21 | hm-research-chain | 113 | 2 | 1 (evals.json only) | 0 | G-C | THIN |
| 22 | hm-spec-driven-authoring | 107 | 2 | 1 (evals.json only) | 0 | G-B | THIN |
| 23 | hm-opencode-platform-reference | 79 | 20 | 0 | 0 | G-D | HOLLOW |
| 24 | hm-omo-reference | 76 | 5 | 0 | 0 | G-C | HOLLOW |
| 25 | hm-opencode-non-interactive-shell | 65 | 4 | 0 | 0 | G-D | HOLLOW |
| 26 | hm-command-parser | 114 | 1 | 0 | 0 | G-D | THIN |
| 27 | hivefiver-use-authoring-skills | 266 | 12 | 2 (evals.json + trigger-queries.json) | 8 | G-D | **EXEMPLAR** |
| 28 | hivefiver-delegation-gates | 249 | 0 | 0 | 0 | G-A | THIN |
| 29 | hivefiver-agents-and-subagents-dev | 202 | 2 | 0 | 0 | G-D | THIN |
| 30 | hivefiver-custom-tools-dev | 121 | 2 | 0 | 0 | G-D | THIN |
| 31 | hivefiver-context-absorb | 117 | 4 | 0 | 0 | G-C | THIN |
| 32 | hivefiver-command-dev | 80 | 2 | 0 | 0 | G-D | HOLLOW |

### Quality Tier Distribution

| Tier | Count | Criteria | Skills |
|------|-------|----------|--------|
| **EXEMPLAR** | 4 | ≥250 LOC, ≥4 refs, ≥2 evals (with trigger-queries.json), ≥5 scripts, all 6-NON DEFENDED | hm-coordinating-loop, hm-user-intent-interactive-loop, hm-meta-builder, hivefiver-use-authoring-skills |
| **SUBSTANTIVE** | 4 | ≥175 LOC, ≥5 refs, body has real workflow steps, but missing evals or scripts | hm-deep-research, hm-synthesis, hm-detective, hm-skill-synthesis |
| **THIN** | 18 | 100-175 LOC, 0-3 refs, minimal body depth, skeleton workflows | hm-spec-driven-authoring, hm-test-driven-execution, hm-phase-execution, hm-debug, hm-refactor, hm-completion-looping, hm-phase-loop, hm-planning-with-files, hm-subagent-delegation-patterns, hm-agent-composition, hm-agents-md-sync, hm-opencode-project-audit, hm-opencode-project-inspection, hm-command-parser, hm-research-chain, hivefiver-delegation-gates, hivefiver-agents-and-subagents-dev, hivefiver-custom-tools-dev |
| **HOLLOW** | 3 | <80 LOC, body is mostly reference pointers or shell | hm-opencode-platform-reference, hm-omo-reference, hm-opencode-non-interactive-shell, hivefiver-command-dev |

### Eval Coverage Status

| Evals Present | Count | Skills |
|---------------|-------|--------|
| evals.json + trigger-queries.json (stacked) | 4 | hm-coordinating-loop, hm-meta-builder, hm-skill-synthesis, hm-user-intent-interactive-loop |
| evals.json only (trigger queries, no stacked) | 9 | hm-spec-driven-authoring, hm-test-driven-execution, hm-completion-looping, hm-debug, hm-refactor, hm-phase-execution, hm-research-chain, hm-agent-composition, hivefiver-use-authoring-skills (has both) |
| No evals | 19 | All remaining skills |

**Key finding:** Only 4/32 skills have stacked eval scenarios (evals.json + trigger-queries.json). 9 have trigger-query-only evals. 19 have zero evals.

---

## 2. G-B Cluster Analysis

### hm-spec-driven-authoring vs. GSD gsd-spec-phase

| Dimension | hm-spec-driven-authoring | GSD gsd-spec-phase |
|-----------|--------------------------|-------------------|
| LOC | 107 | ~300+ (estimated from agent prompt complexity) |
| Workflow steps | 5 (Lock → Derive → Red → Green → Refactor) | Ambiguity scoring → requirement extraction → falsifiable REQ-* → verification loop |
| Reference files | 2 (spec-to-req-mapping.md, acceptance-test-patterns.md) | Embedded in agent prompt, references GSD planning artifacts |
| Evals | 1 (trigger queries only: 4 positive, 1 negative) | N/A (agent, not skill) |
| Scripts | 1 (validate-skill.sh) | N/A |
| Anti-patterns | 4 (Vague Spec, Untestable Req, Green Before Red, Missing Negative) | Embedded in workflow |
| Entry/Exit gates | None explicit | Check-Revise-Escalate cycle |
| 6-NON defence | 0/6 EXPOSED | N/A (agent definition, not skill) |
| Integration points | Cross-references hm-test-driven-execution, hm-planning-with-files | Wired into gsd-executor, gsd-verifier agents |

**Specific gaps:**
1. No entry trigger gate (when exactly does this skill activate?)
2. No exit criterion (when is the skill's work done?)
3. No stacked eval scenario (only trigger queries)
4. No audit trail section (NON-1 EXPOSED)
5. No context map / stacks-with section (NON-2 EXPOSED)
6. Body is a linear pipeline, not a decision tree with loop-back paths
7. No integration with hard harness tools (Zod schemas, prompt-skim, session-patch)

### hm-test-driven-execution vs. GSD gsd-add-tests + gsd-verify-work

| Dimension | hm-test-driven-execution | GSD gsd-add-tests + gsd-verify-work |
|-----------|--------------------------|-------------------------------------|
| LOC | 119 | ~400+ combined |
| Workflow steps | 3 (Red → Green → Refactor) | UAT criteria derivation → test generation → verification loop → pass/fail gate |
| Reference files | 2 (red-green-refactor.md, coverage-verification.md) | Embedded in agent prompts |
| Evals | 1 (trigger queries only) | N/A |
| Coverage claims | Has "Valid Claim" vs "Invalid Claim" pattern | gsd-verify-work produces VERIFICATION.md with pass/fail |
| Anti-patterns | 4 (Test-After, Fake Green, Refactor-First, Coverage Lie) | Embedded |
| Integration | Cross-references hm-spec-driven-authoring, hm-planning-with-files | Wired into gsd-executor pipeline |

**Specific gaps:**
1. No coverage threshold enforcement (what percentage is "enough"?)
2. No integration with `npm run test:coverage` output parsing
3. No stacked eval scenario
4. No connection to hard harness test infrastructure (vitest, 771 tests)
5. Missing: how to handle flaky tests, how to handle test isolation, how to handle mock-heavy vs. runtime-truthful

### G-B Cluster as Demonstration Template

The G-B cluster must prove the PLAYBOOK standards are actionable. Current state:
- Both skills are THIN tier (107-119 LOC)
- Both have trigger-query-only evals (no stacked scenarios)
- Both reference each other and hm-planning-with-files (good cross-referencing)
- Both have clear Iron Law statements (good)
- Both have anti-pattern tables (good)
- Both missing: entry/exit gates, audit trail, context map, integration wiring

**Demonstration SPEC requirements (D-04):**
Each G-B SPEC must define falsifiable REQ-* items covering: trigger accuracy, body depth, 6-NON defence, eval coverage, reference completeness, integration wiring, cross-platform compatibility.

---

## 3. Quality Dimension Framework

### Derived Dimensions

From the 4 EXEMPLAR skills and Phase 18 audit criteria, 8 measurable quality dimensions emerge:

| # | Dimension | What It Measures | PASS Criteria | FAIL Criteria | Exemplar Skill |
|---|-----------|-----------------|---------------|---------------|----------------|
| D1 | **Trigger Accuracy** | Does the skill activate on correct queries and reject incorrect ones? | ≥4 positive trigger queries + ≥1 negative in evals.json; description contains explicit "NOT for" clause | Missing evals.json or no negative triggers | hm-coordinating-loop |
| D2 | **Body Depth** | Does the skill body contain substantive procedural guidance, not just outlines? | ≥200 LOC body (excluding frontmatter); contains worked example or step-by-step workflow with decision points | <120 LOC; body is mostly headers and bullet points | hm-user-intent-interactive-loop |
| D3 | **6-NON Defence** | Does the skill defend against all 6 non-failure modes? | All 6 NON cells DEFENDED in audit grid | ≥3 EXPOSED cells | hm-coordinating-loop |
| D4 | **Eval Coverage** | Does the skill have stacked eval scenarios (not just trigger queries)? | evals.json + trigger-queries.json present; stacked scenario tests multi-step workflow | No evals/ directory or only trigger queries | hm-meta-builder |
| D5 | **Reference Completeness** | Does the skill reference supporting documents that deepen its guidance? | ≥3 reference files in references/ directory; each referenced from SKILL.md body | 0 reference files or references not cited in body | hm-deep-research |
| D6 | **Integration Wiring** | Does the skill connect to agents, commands, tools, and plugin hooks? | Cross-references section lists ≥2 related skills; allowed-tools matches workflow needs; no hardcoded paths | No cross-references; hardcoded file paths; assumes specific tools | hm-coordinating-loop |
| D7 | **Cross-Platform Compatibility** | Does the skill work across OpenCode, Hivemind harness, and arbitrary projects? | Platform Adaptation section present; no GSD/harness-specific assumptions in body | References `.hivemind/` paths, assumes GSD commands, hardcodes project structure | hm-coordinating-loop |
| D8 | **Self-Correction** | Does the skill handle failure modes and edge cases explicitly? | Self-Correction section with "When X fails" patterns; escalation criteria defined | No failure handling guidance; assumes happy path only | hm-completion-looping |

### Dimension Scoring Matrix

Each skill receives a score per dimension: **PASS** (meets criteria), **PARTIAL** (partially meets), **FAIL** (does not meet).

**Minimum viable skill:** D1 PASS + D2 PASS + D3 ≥4 DEFENDED + D4 PARTIAL + D5 PASS + D6 PASS
**Target quality skill:** All 8 dimensions PASS
**Exemplar skill:** All 8 dimensions PASS + worked example + scripts + ≥2 stacked evals

### Patterns Extracted from EXEMPLAR Skills

From hm-coordinating-loop (411 LOC, all 6-NON DEFENDED):
1. **Script-backed gates:** 8 scripts enforce behavioral contracts, not just documentation
2. **Worked example:** Full 5-phase walkthrough with real file paths and gate checks
3. **Platform adaptation:** Explicit sections for OpenCode, Claude.ai, Cowork, No-Subagent fallback
4. **Anti-pattern table:** 8 anti-patterns with Detection + Correction columns
5. **Self-Correction blocks:** 4 failure scenarios with explicit escalation paths
6. **Kit Bundle Contents:** Table listing every file in the skill package with purpose

From hm-user-intent-interactive-loop (422 LOC, all 6-NON DEFENDED):
1. **Hierarchical workflow:** Clear entry → process → exit with loop-back paths
2. **Cross-references with boundary clarification:** Each related skill has explicit boundary statement
3. **Metadata completeness:** layer, role, pattern, version all declared

From hm-meta-builder (389 LOC, 2 evals with stacked scenarios):
1. **Routing logic:** Classifies intent before acting
2. **Stacked eval scenarios:** Tests multi-step workflows, not just trigger matching
3. **Reference depth:** 8 reference files covering all operational modes

---

## 4. Integration Architecture

### Agent Integration (57 agents)

Agents reference skills via `allowed-tools: [Skill]` in YAML frontmatter. Key patterns:

| Agent Category | Count | hm-* Skill References | Pattern |
|----------------|-------|----------------------|---------|
| GSD specialists (gsd-*) | 30 | Indirect (via orchestrator routing) | Agent prompt references GSD workflow, not hm-* skills directly |
| Hivefiver specialists (hivefiver-*) | 6 | Direct (allowed-tools includes Skill) | hivefiver-orchestrator routes to hm-* skills |
| Core agents (coordinator, conductor, etc.) | 8 | Some reference hm-* skills | coordinator.md references hm-coordinating-loop |
| Meta agents (orchestrator, intent-loop, etc.) | 13 | Varies | orchestrator.md references hm-phase-execution |

**Integration gap:** Most GSD agents don't reference hm-* skills. The hm-* ecosystem is opt-in — agents must explicitly load skills. D-06 mandates each PLAYBOOK dimension address agent integration.

### Command Integration (16 commands)

Commands invoke skills via `Skill(skill="...", args="...")` in command bodies:

| Command | hm-* Skills Referenced | Pattern |
|---------|----------------------|---------|
| hf-create | hm-meta-builder, hm-agent-composition | Routes creation requests to specialist skills |
| hf-audit | hm-opencode-project-audit | Routes audit requests |
| plan | hm-planning-with-files (indirect) | GSD planning workflow |
| ultrawork | hm-spec-driven-authoring, hm-test-driven-execution (indirect) | Full workflow orchestration |

**Integration gap:** Most commands don't directly reference hm-* skills. The wiring is indirect through orchestrator agents.

### Tool Integration (src/tools/)

Hard harness tools that skills can use:

| Tool | Purpose | hm-* Alignment |
|------|---------|---------------|
| delegate-task | Dispatch subagent tasks | hm-coordinating-loop, hm-subagent-delegation-patterns |
| delegation-status | Poll delegation results | hm-completion-looping |
| prompt-skim | Fast prompt analysis | hm-spec-driven-authoring (could use for spec decomposition) |
| prompt-analyze | Deep prompt analysis | hm-debug (could use for failure analysis) |
| session-patch | Patch session sections | hm-planning-with-files (could use for plan updates) |
| configure-primitive | Configure OpenCode primitives | hm-meta-builder, hivefiver-* skills |
| validate-restart | Validate after restart | hm-completion-looping (verification) |

**Integration gap:** No hm-* skill currently references hard harness tools in its workflow. D-06 requires skills to address tool integration.

### Plugin Hook Integration (src/plugin.ts)

Plugin composition root wires:
- `createCoreHooks` — session lifecycle events
- `createSessionHooks` — session state transitions
- `createToolGuardHooks` — tool call budget enforcement
- `DelegationManager` — delegation dispatch + dual-signal completion
- `PtyManager` — background PTY execution

**Integration gap:** Skills don't reference plugin hooks. hm-phase-execution could integrate with DelegationManager. hm-completion-looping could integrate with tool-guard hooks.

### Runtime State Integration

| State Path | Purpose | hm-* Relevance |
|------------|---------|---------------|
| `.opencode/state/opencode-harness/` | Continuity, delegations | hm-planning-with-files could reference |
| `.hivemind/state/` | Session context | hm-planning-with-files already references |
| `.coordination/` | Multi-agent coordination state | hm-coordinating-loop owns this |

---

## 5. Gap Consolidation

### Phase 22 (NOT SUBSTANTIATED) — Absorption Plan

**Claimed:** 6-NON defence tables added to 7 core skills
**Reality:** STATE.md confirms "no phase directory, commit scope doesn't match claims"
**Evidence:** CR-AUDIT-ECOSYSTEM.md shows all skills still EXPOSED on multiple NON dimensions

**Absorption into PLAYBOOK:**
- PLAYBOOK D3 (6-NON Defence) becomes the measurable standard
- Each skill improvement phase must produce verifiable 6-NON evidence
- Evidence format: audit grid cell with hit count (e.g., "DEFENDED [4 hits: audit evidence]")
- No more "6-NON tables" as standalone sections — defence must be woven into skill body

### Phase 23 (PARTIAL) — Absorption Plan

**Claimed:** Eval expansion with trigger queries for 6 new skills
**Reality:** Only 1/9 skills has stacked scenario (hm-completion-looping per CONTEXT.md, but current state shows it only has evals.json, not trigger-queries.json)
**Actual state:** 4 skills have stacked evals (hm-coordinating-loop, hm-meta-builder, hm-skill-synthesis, hm-user-intent-interactive-loop). 9 have trigger-query-only evals. 19 have zero.

**Absorption into PLAYBOOK:**
- PLAYBOOK D4 (Eval Coverage) becomes the measurable standard
- Minimum: evals.json with ≥4 positive + ≥1 negative trigger queries
- Target: evals.json + trigger-queries.json with stacked multi-step scenario
- Each skill improvement phase must deliver eval bundles

### CR-GAP-MAP Closure Status

| Gap # | Severity | Status | Notes |
|-------|----------|--------|-------|
| 1 (hm-completion-looping missing) | CRITICAL | **CLOSED** — skill exists (119 LOC, created Phase 20) | Body still THIN tier |
| 2 (phase-loop no audit) | CRITICAL | **OPEN** — 0 audit hits in current skill | Needs body rewrite |
| 3 (agent-authorization lacks context) | CRITICAL | **OPEN** — renamed to hm-subagent-delegation-patterns, still 0 context-map | Needs body rewrite |
| 4 (harness-delegation-inspection split) | CRITICAL | **CLOSED** — split into hm-subagent-delegation-patterns + hm-opencode-project-inspection | Both still THIN |
| 5 (user-intent evals unverified) | HIGH | **PARTIAL** — has trigger-queries.json but stacked scenario unverified | Needs verification |
| 6 (hm-spec-driven-authoring missing) | CRITICAL | **CLOSED** — skill exists (107 LOC, created Phase 20) | Body still THIN |
| 7 (hm-test-driven-execution missing) | CRITICAL | **CLOSED** — skill exists (119 LOC, created Phase 20) | Body still THIN |
| 8 (gsd-agent-composition lacks context) | HIGH | **OPEN** — renamed to hm-agent-composition, still 3 EXPOSED | Needs body rewrite |
| 9-13 (G-C cluster gaps) | HIGH | **OPEN** — hm-deep-research, hm-detective, hm-synthesis all missing evals + context | Phase 28 scope |
| 14-22 (G-D cluster gaps) | HIGH | **OPEN** — hm-debug, hm-refactor, hm-phase-execution all THIN | Phase 29 scope |
| 23-26 (remaining gaps) | MEDIUM-HIGH | **OPEN** | Various |

**Summary:** 4/26 CRITICAL gaps closed (skills exist). 0/26 gaps fully resolved (all skills still below EXEMPLAR quality). 18 HIGH gaps remain open. 4 MEDIUM gaps remain open.

---

## 6. Phase 27-30 Roadmap Basis

### Natural Sequencing

```
Phase 26 (this phase): PLAYBOOK + G-B SPECs + ecosystem audit + roadmap
  └─→ Phase 27: G-B execution — rewrite hm-spec-driven-authoring + hm-test-driven-execution to EXEMPLAR
       └─→ Phase 28: G-C execution — rewrite hm-deep-research + hm-detective + hm-synthesis + hm-research-chain
            └─→ Phase 29: G-D execution — rewrite hm-debug + hm-refactor + hm-phase-execution + remaining G-D
                 └─→ Phase 30: G-A execution — rewrite hm-completion-looping + hm-phase-loop + hm-subagent-delegation-patterns
                      └─→ Phase 31: Cross-lineage integration testing
```

### Prerequisites for Phase 27

1. **PLAYBOOK.md must exist** with all 8 dimensions defined and PASS/FAIL criteria
2. **G-B SPECs must exist** with falsifiable REQ-* items per skill
3. **Exemplar patterns documented** — what a "done" skill looks like (from hm-coordinating-loop, hm-user-intent-interactive-loop)
4. **Eval bundle template** — standard format for evals.json + trigger-queries.json

### Phase 17-24 Pattern Harvest

**What worked:**
- Phase 17 (Critical Fixes): Targeted 5 specific issues, each with verifiable fix — HIGH quality
- Phase 18 (Audit): Produced 8 evidence-based deliverables — HIGH quality, reusable
- Phase 24 (Fix 22 Failed): 3 focused plans, 8/8 must-haves verified — HIGH quality

**What regressed:**
- Phase 20 (Structural Changes): Created 7 new skills but all THIN tier — template-driven creation produced hollow skeletons
- Phase 21 (Description Rewrite): Only touched descriptions, not body — surface-level fix
- Phase 22 (Script Hardening): Claimed but unsubstantiated — integrity failure
- Phase 23 (Body Quality + Eval): Only 1/9 stacked evals — incomplete execution

**Lesson:** Focused, verifiable phases (17, 18, 24) produce quality. Broad, template-driven phases (20, 21, 22, 23) produce hollow results. Phase 27-30 should follow the focused pattern: one cluster per phase, with EXEMPLAR as the target and verifiable evidence per skill.

### Deferred Tooling Decisions (from CR-DECISIONS.md)

| Decision | Deferred To | Impact on 27-30 |
|----------|-------------|-----------------|
| (c) body rewrites | Phase 20+ | 16 skills need body rewrites — spread across Phases 27-30 |
| (d) bundle expansion | Phase 20+ | 22 skills need eval/reference expansion — every improvement phase |
| (f) split | Phase 20 | Already executed (harness-delegation-inspection split) |
| (g) merge | Phase 20 | Already executed (session-context-manager merged into hm-planning-with-files) |
| (h) create new | Phase 20-21 | 8 new skills created, all need quality improvement |

---

## 7. Research Conclusions

### Key Findings

1. **The ecosystem is 87.5% below EXEMPLAR quality.** Only 4/32 skills meet the target bar. 18 are THIN (skeleton workflows). 3 are HOLLOW (<80 LOC).

2. **Eval coverage is the deepest gap.** 19/32 skills have zero evals. Only 4 have stacked scenarios. The PLAYBOOK must make eval bundles mandatory.

3. **The G-B cluster is the weakest link in the "Quality Assurance" lineage.** hm-spec-driven-authoring (107 LOC) and hm-test-driven-execution (119 LOC) are the thinnest skills in the G-B group. They must become the strongest to serve as demonstration templates.

4. **Phase 22 integrity failure is confirmed.** No 6-NON tables exist in any skill file. The PLAYBOOK must not repeat this pattern — defence must be woven into body content, not added as standalone tables.

5. **Integration wiring is completely absent.** No hm-* skill references hard harness tools, plugin hooks, or Zod schemas. D-06 requires this dimension.

6. **The 4 EXEMPLAR skills provide a clear quality pattern.** hm-coordinating-loop, hm-user-intent-interactive-loop, hm-meta-builder, and hivefiver-use-authoring-skills demonstrate: script-backed gates, worked examples, platform adaptation, anti-pattern tables, self-correction blocks, and kit bundle contents.

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| PLAYBOOK becomes another unsubstantiated artifact (like Phase 22) | CRITICAL | Every dimension must have measurable PASS/FAIL criteria and verification command |
| G-B SPECs are too abstract to guide implementation | HIGH | SPECs must reference exemplar skills as concrete templates |
| Phase 27-30 become another template-driven creation wave | HIGH | Each phase targets 2-4 skills with EXEMPLAR quality, not 10+ skills at THIN quality |
| Eval bundles are created but never run | MEDIUM | PLAYBOOK must require eval execution evidence (command output) |
| Integration wiring is specified but never tested | MEDIUM | Phase 31 (cross-lineage integration) must verify wiring |

### Recommendations for the Planner

1. **Structure PLAYBOOK as a checklist, not a narrative.** Each dimension gets: definition, PASS criteria, FAIL criteria, verification command, exemplar reference.

2. **G-B SPECs should be per-skill, not per-cluster.** hm-spec-driven-authoring and hm-test-driven-execution each get their own SPEC with REQ-* items.

3. **Phase 27 scope: 2 skills only.** Rewrite hm-spec-driven-authoring and hm-test-driven-execution to EXEMPLAR quality. This proves the PLAYBOOK before scaling.

4. **Phase 28-30 scope: 3-5 skills each.** Focused improvement waves, not bulk rewrites.

5. **Include a "Quality Gate" in each improvement phase.** Before moving to the next phase, verify: all target skills score PASS on all 8 PLAYBOOK dimensions.

6. **Archive Phase 22/23 with explicit closure records.** Document what was claimed, what was verified, and what scope was absorbed into PLAYBOOK.

---

## Validation Architecture

### Post-Planning Verification (PLAN.md quality gates)

| Check | Command | Expected |
|-------|---------|----------|
| PLAYBOOK.md exists with 8 dimensions | `ls .planning/phases/26-*/PLAYBOOK.md` | File exists |
| Each dimension has PASS/FAIL criteria | `grep -c "PASS Criteria" .planning/phases/26-*/PLAYBOOK.md` | ≥8 |
| G-B SPECs exist for both skills | `ls .planning/phases/26-*/SPEC-hm-spec-driven-authoring.md .planning/phases/26-*/SPEC-hm-test-driven-execution.md` | Both exist |
| Ecosystem audit catalog exists | `ls .planning/phases/26-*/ECOSYSTEM-AUDIT.md` | File exists |
| Phase 27-30 roadmap exists | `ls .planning/phases/26-*/ROADMAP-27-30.md` | File exists |
| Phase 22/23 closure records exist | `ls .planning/phases/26-*/ARCHIVE-22.md .planning/phases/26-*/ARCHIVE-23.md` | Both exist |

### Post-Execution Verification (artifact existence + dimension coverage)

| Check | Method | Expected |
|-------|--------|----------|
| All 32 skills scored in audit catalog | Count entries in ECOSYSTEM-AUDIT.md | ≥32 |
| Each G-B SPEC has ≥5 REQ-* items | Count REQ-* in SPEC files | ≥10 total |
| Each PLAYBOOK dimension has exemplar reference | Verify each dimension cites a skill name | 8 citations |
| PLAYBOOK dimensions are measurable | Each dimension has a verification command | 8 commands |
| No vague language in PLAYBOOK | Grep for "improve", "enhance", "consider" | 0 matches (use "must", "shall", "verify") |

### Dimension Measurability Verification

| Dimension | How to Verify It's Measurable |
|-----------|------------------------------|
| D1 Trigger Accuracy | Has evals.json with expected_loaded field per query |
| D2 Body Depth | LOC count excluding frontmatter (automatable) |
| D3 6-NON Defence | CR-AUDIT-ECOSYSTEM grid cell status (EXPOSED/PARTIAL/DEFENDED) |
| D4 Eval Coverage | ls evals/ directory — count files present |
| D5 Reference Completeness | ls references/ directory — count files; grep SKILL.md for citations |
| D6 Integration Wiring | Grep SKILL.md for cross-references and related skill names |
| D7 Cross-Platform Compatibility | Grep SKILL.md for platform-specific paths or assumptions |
| D8 Self-Correction | Grep SKILL.md for "Self-Correction" or "When.*fails" patterns |

---

## Sources

### Primary (HIGH confidence)
- CR-AUDIT-ECOSYSTEM.md — Phase 18 deliverable, direct file read, 24 skills scored
- CR-GAP-MAP.md — Phase 18 deliverable, 26 gaps identified with severity
- CR-DECISIONS.md — Phase 18 deliverable, 32 skill decisions documented
- All 32 SKILL.md files — direct reads of current state
- CONTEXT.md — 11 locked decisions from user
- STATE.md — Phase 22 NOT SUBSTANTIATED, Phase 23 PARTIAL confirmation

### Secondary (MEDIUM confidence)
- ROADMAP.md — Phase lineage and dependency chain
- plugin.ts — composition root integration patterns

### Tertiary (LOW confidence)
- GSD skill quality estimates (gsd-spec-phase LOC is estimated, not measured)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all 32 skills directly read and measured
- Architecture: HIGH — integration points verified against source files
- Pitfalls: HIGH — Phase 22/23 failures confirmed by STATE.md evidence
- GSD benchmark comparison: MEDIUM — GSD skills not directly measured (estimated from agent prompt complexity)

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 days — stable domain, soft meta-concepts change slowly)
