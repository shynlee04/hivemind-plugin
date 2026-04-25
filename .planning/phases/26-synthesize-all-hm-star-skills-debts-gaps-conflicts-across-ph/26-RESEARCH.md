# Phase 26: Synthesize hm-* Skill Debts into Unified Quality Requirements - Research

**Researched:** 2026-04-25  
**Domain:** Soft meta-concept quality synthesis, OpenCode skill ecosystem governance, GSD-comparable quality standards  
**Confidence:** HIGH for local ecosystem facts; MEDIUM for cross-ecosystem quality recommendations

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** hm-* skills must be standalone-superior — independently valuable without GSD dependency, comparable in quality to GSD's battle-tested skill ecosystem (gsd-spec-phase, gsd-add-tests, gsd-verify-work). Designed as an opt-in cohesive "quality assurance" lineage that works in any project regardless of what other frameworks exist.
- **D-02:** Benchmark quality bar = GSD skill ecosystem output quality. Each hm-* skill must produce artifacts as concrete and actionable as GSD counterparts (SPEC.md with falsifiable REQ-*, verification reports with pass/fail gates, eval bundles with stacked scenarios).
- **D-03:** Phase 26 delivers a unified quality PLAYBOOK.md covering ALL hm-* skills across all lineages (G-A through G-D). This is the canonical quality standard — every future hm-* skill improvement is measured against it.
- **D-04:** The G-B cluster (hm-spec-driven-authoring, hm-test-driven-execution) receives full SPEC files as the demonstration template. These SPECs prove the PLAYBOOK standards are actionable and serve as the pattern for G-C, G-D, and remaining lineages.
- **D-05:** Phase 26 also produces: (a) an ecosystem audit catalog (all 24+ hm-* skills scored against PLAYBOOK dimensions), (b) a Phase 27-30 execution roadmap sequencing the remaining improvement waves, (c) updated `.planning/REQUIREMENTS.md` entries for hm-* skill quality standards.
- **D-06:** Skills are runtime components, not standalone `.md` files. Each PLAYBOOK quality dimension must address: agent integration (allowed-tools, permissions, temperature), command integration (!bash injection, $ARGUMENTS parsing), tool integration (Zod schema alignment), plugins SDK hooks (PreToolUse, PostToolUse), and runtime state routers (continuity, lifecycle-manager).
- **D-07:** Skills must be platform-agnostic — designed for OpenCode native, Hivemind harness runtime, and arbitrary end-user project environments. No hardcoded assumptions about available tools, file paths, or project structure.
- **D-08:** Phase 22 (Script Hardening + 6-NON tables) is ARCHIVED as NOT SUBSTANTIATED. STATE.md confirms the commit doesn't match claims. Its intended scope (6-NON defence tables) is absorbed into the PLAYBOOK.md quality standards with proper evidence requirements.
- **D-09:** Phase 23 (Body Quality + Eval) scope is ABSORBED. Its eval bundle work (only 1/9 skills has stacked scenarios) is subsumed into PLAYBOOK standards that require complete eval bundles with stacked scenarios for every skill. No separate Phase 23 re-execution needed.
- **D-10:** Full hm-* ecosystem scope for audit (all 24+ skills across Phases 17-24). G-B cluster is the first improvement wave and demonstration template. G-C (research lineage) and G-D (execution lineage) are deferred to Phases 27-30 with explicit dependency on the PLAYBOOK standards.
- **D-11:** Two lineages identified: the "Quality Assurance" lineage (G-B: spec-driven + test-driven + hm-phase-loop + hm-planning-with-files) forms a self-contained unit users can opt into independently. The "Research + Execution" lineage (G-C + G-D) forms the complementary set.

### the agent's Discretion
- Exact PLAYBOOK structure and dimension count (minimum: trigger accuracy, body depth, 6-NON, eval coverage, reference completeness, integration wiring, cross-platform compatibility)
- Benchmark comparison methodology (side-by-side output quality vs. GSD equivalents)
- Phase 27-30 sequencing order and phase count
- Archive metadata format for Phase 22 and Phase 23 closure

### Deferred Ideas (OUT OF SCOPE)
- Full hm-* skill rewrites (G-B execution) — Phase 27
- G-C lineage (research chain: hm-deep-research, hm-detective, hm-synthesis, hm-research-chain) improvement — Phase 28
- G-D lineage (execution: hm-debug, hm-refactor, hm-phase-execution, hm-planning-with-files) improvement — Phase 29
- G-A lineage (guardrails: hm-completion-looping, hm-subagent-delegation-patterns, hm-user-intent-interactive-loop) improvement — Phase 30
- Cross-lineage integration testing and end-to-end meta-concept validation — Phase 31
- Third-party skill registry benchmarking beyond GSD ecosystem — deferred until PLAYBOOK baseline is established
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYN-01 | Produce unified `PLAYBOOK.md` with measurable hm-/hivefiver-* quality dimensions. | Quality Dimensions, Artifact Recommendations, Validation Architecture |
| SYN-02 | Produce G-B demonstration SPECs without mutating `SKILL.md` files. | G-B Demonstration Strategy, Don't Hand-Roll, Validation Architecture |
| SYN-03 | Produce ecosystem audit catalog from current canonical `.opencode/skills/` state. | Standard Stack, Architecture Patterns, Risk Register |
| SYN-04 | Produce Phase 27+ dependency and sequencing roadmap. | Dependency Map, Planning Implications |
| SYN-05 | Update project requirements with hm-* quality requirements. | Artifact Recommendations, Validation Architecture |
| SYN-06 | Archive Phase 22 and absorb Phase 23 scope without losing valid evidence. | Phase 22/23 Absorption Strategy, Risk Register |
</phase_requirements>

## Summary

Phase 26 is a synthesis and standards phase, not an implementation phase: it must convert locked decisions D-01 through D-11 into durable planning artifacts while leaving `.opencode/skills/**/SKILL.md` and `src/` untouched. [VERIFIED: `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-CONTEXT.md`:7-24,28-58]

The current canonical soft meta-concept inventory contains 31 `hm-*` / `hivefiver-*` skill directories under `.opencode/skills/`; 13 have at least one eval JSON file, 18 have zero eval JSON files, and only `hm-completion-looping` currently contains a `stacked_scenario` key. [VERIFIED: local Python inventory command, 2026-04-25; `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37]

The planning recommendation is prescriptive: make `PLAYBOOK.md` the root quality contract, create two G-B SPECs as read-only demonstration contracts, create an ecosystem audit catalog scored against the playbook, create explicit archive records for Phase 22/23, then use these artifacts as the only allowed inputs for Phase 27+ skill rewrites. [VERIFIED: `26-CONTEXT.md`:35-50,145-154]

**Primary recommendation:** Use an 8-dimension PLAYBOOK: Trigger Accuracy, Body Depth, 6-NON Defence, Eval Coverage, Reference Completeness, Integration Wiring, Cross-Platform Compatibility, and Self-Correction. [VERIFIED: `26-CONTEXT.md`:52-56; `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`:3-21,89-108]

## Project Constraints (from AGENTS.md)

- Phase 26 must not confuse the harness project with arbitrary user projects; standards must generalize across languages, frameworks, task types, and project states. [VERIFIED: `AGENTS.md`:80-83]
- Canonical project skills live in `.opencode/skills/`; IDE-managed skill directories are sync artifacts and must not be committed as deliverables. [VERIFIED: `AGENTS.md`:271-275]
- The product is a runtime composition engine, not a skill-pack project; skill standards must account for the hard harness (`src/`) and soft meta-concepts (`.opencode/`). [VERIFIED: `AGENTS.md`:121-130]
- Generated folders must be navigable and tracked; new directories require `.gitkeep` where otherwise empty. [VERIFIED: `AGENTS.md`:9-13]
- Documentation artifacts must be evidence-backed; agents must not skip validation, verification, review, or gatekeeping. [VERIFIED: `AGENTS.md`:76-80]
- No `src/` changes are in scope for Phase 26 because the locked context excludes hard harness changes. [VERIFIED: `26-CONTEXT.md`:19-24]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PLAYBOOK quality contract | Soft Meta-Concept / Planning Artifacts | OpenCode Skill Runtime | The playbook governs skills as runtime-loaded components, but the Phase 26 deliverable is a planning artifact. [VERIFIED: `26-CONTEXT.md`:35-43] |
| G-B demonstration SPECs | Soft Meta-Concept / Planning Artifacts | Test Validation | SPECs define falsifiable requirements for future skill rewrites; Phase 26 does not execute those rewrites. [VERIFIED: `26-CONTEXT.md`:35-38,145-149] |
| Ecosystem audit catalog | Soft Meta-Concept / Audit Artifacts | OpenCode Skill Runtime | The audit reads `.opencode/skills/` and scores skills; it does not mutate skill content. [VERIFIED: `26-CONTEXT.md`:11-18,19-24] |
| Agent/command/tool integration standards | OpenCode Runtime Configuration | Hard Harness Plugin | OpenCode docs define skills, agents, commands, tools, and plugins as runtime surfaces; the local harness plugin registers tools and hooks. [CITED: https://opencode.ai/docs/skills/; https://opencode.ai/docs/agents/; https://opencode.ai/docs/commands/; https://opencode.ai/docs/custom-tools/; https://opencode.ai/docs/plugins/] [VERIFIED: `src/plugin.ts`:79-123] |
| Phase 22/23 archival | Planning Artifacts | Roadmap / State | STATE and phase plans mark Phase 22 as not substantiated and Phase 23 as partial; Phase 26 must preserve evidence while absorbing scope. [VERIFIED: `.planning/STATE.md`:91-112; `22-PLAN.md`:1-21; `23-PLAN.md`:1-28] |

## Standard Stack

### Core

| Library / Surface | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Markdown planning artifacts | n/a | `PLAYBOOK.md`, `SPEC-*.md`, `ECOSYSTEM-AUDIT.md`, archive records | Existing GSD and project phase artifacts are Markdown-based planning contracts. [VERIFIED: `.planning/ROADMAP.md`:395-433; `26-CONTEXT.md`:35-39] |
| `.opencode/skills/SKILL.md` | OpenCode current docs | Canonical skill package entry point | OpenCode documents skills as `SKILL.md` packages loaded by the `skill` tool. [CITED: https://opencode.ai/docs/skills/] |
| OpenCode agents / commands / tools / plugins | `@opencode-ai/plugin` 1.14.24 current registry; project peer `^1.14.20` | Runtime integration surfaces for skill quality dimensions | Phase D-06 requires agent, command, tool, plugin hook, and state-router coverage. [VERIFIED: `package.json`:29-38; `npm view @opencode-ai/plugin version` → `1.14.24`; `26-CONTEXT.md`:40-43] |
| Zod | 4.3.6 | Schema-aligned tool/config contracts | OpenCode custom tools use Zod schemas, and the harness already uses Zod in `src/schema-kernel/`. [CITED: https://opencode.ai/docs/custom-tools/] [VERIFIED: `package.json`:29-35; `src/schema-kernel/prompt-enhance.schema.ts`:1-31] |

### Supporting

| Library / Surface | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| Vitest | project `^1.0.0`; current registry 4.1.5 | Validation of hard harness code when future phases touch `src/` | Phase 26 should not run code tests as proof of skill artifact quality, but validation architecture can cite project commands. [VERIFIED: `package.json`:20-27,39-44; `npm view vitest version` → `4.1.5`] |
| TypeScript | project `^5.0.0`; current registry 6.0.3 | Hard harness compile/type verification | Only relevant to future `src/` integration work, not Phase 26 artifacts. [VERIFIED: `package.json`:20-27,39-44; `npm view typescript version` → `6.0.3`] |
| Node.js / npm / git | Node v25.9.0, npm 11.13.0, git 2.54.0 available locally | Local artifact verification and inventory scripts | Use for non-mutating counts and grep-like artifact checks. [VERIFIED: local environment audit command, 2026-04-25] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown artifact contracts | JSON-only score manifests | JSON is easier to parse, but current GSD planning and user review workflows consume Markdown. [VERIFIED: `.planning/ROADMAP.md`:395-433] |
| Existing eval JSON pattern | New eval runner format | New format would create Phase 26 tooling scope; existing eval files already use `trigger_queries` and `stacked_scenario`. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/evals/evals.json`:1-10; `.opencode/skills/hm-completion-looping/evals/evals.json`:1-38] |
| GSD-only benchmark | OpenCode + GSD + project exemplar benchmark | D-01 requires standalone-superior skills independent of GSD, so the quality bar must compare to GSD while remaining OpenCode-native. [VERIFIED: `26-CONTEXT.md`:31-43] |

**Installation:** No packages should be installed in Phase 26. [VERIFIED: `26-CONTEXT.md`:19-24]

**Version verification:** `npm view @opencode-ai/plugin version`, `npm view @opencode-ai/sdk version`, `npm view zod version`, `npm view vitest version`, and `npm view typescript version` were run on 2026-04-25. [VERIFIED: npm registry command output]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 18 evidence + Phase 22/23 reality + current .opencode/skills inventory
        |
        v
  Phase 26 Research Synthesis
        |
        +--> PLAYBOOK.md quality contract (D1-D8)
        |        |
        |        v
        |   ECOSYSTEM-AUDIT.md scores every canonical hm-/hivefiver-* skill
        |
        +--> SPEC-hm-spec-driven-authoring.md
        +--> SPEC-hm-test-driven-execution.md
        |        |
        |        v
        |   Phase 27 G-B rewrite plan inputs only (no Phase 26 mutation)
        |
        +--> ARCHIVE-22.md / ARCHIVE-23.md
        |        |
        |        v
        |   Roadmap/state evidence preserved; scope absorbed into PLAYBOOK D3/D4
        |
        v
  ROADMAP-27-30.md + REQUIREMENTS.md HMQUAL entries
```

### Recommended Project Structure

```text
.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/
├── 26-RESEARCH.md              # This research artifact
├── PLAYBOOK.md                 # Canonical hm-* quality standard
├── ECOSYSTEM-AUDIT.md          # Deduplicated skill scoring catalog
├── SPEC-hm-spec-driven-authoring.md
├── SPEC-hm-test-driven-execution.md
├── ROADMAP-27-30.md            # Sequenced improvement waves
├── ARCHIVE-22.md               # Formal NOT SUBSTANTIATED closure
└── ARCHIVE-23.md               # Formal PARTIAL absorption closure
```

### Pattern 1: Evidence-First Quality Dimension

**What:** Each PLAYBOOK dimension must define `Description`, `PASS Criteria`, `FAIL Criteria`, `Verification Command`, and runtime integration coverage. [VERIFIED: `26-CONTEXT.md`:52-56]  
**When to use:** Use for all D1-D8 dimensions so Phase 27+ plans can create task-level verification gates. [VERIFIED: `gsd-validate-phase/SKILL.md`:16-22]

### Pattern 2: SPEC as Future Rewrite Contract

**What:** G-B SPECs should define `REQ-*` items with acceptance criteria and verification methods, mirroring `hm-spec-driven-authoring`'s own requirement format. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:77-84]  
**When to use:** Use for `hm-spec-driven-authoring` and `hm-test-driven-execution` only in Phase 26; do not apply rewrites until Phase 27. [VERIFIED: `26-CONTEXT.md`:145-149]

### Pattern 3: Scope Absorption Archive

**What:** Preserve historical claims, verified reality, absorbed scope, and closure decision in `ARCHIVE-22.md` and `ARCHIVE-23.md`. [VERIFIED: `.planning/STATE.md`:91-112]  
**When to use:** Use when a phase contains valid intent but invalid or partial evidence, as with Phase 22/23. [VERIFIED: `22-PLAN.md`:13-17; `23-PLAN.md`:13-18]

### Anti-Patterns to Avoid

- **Mutating skills during synthesis:** Phase 26 explicitly excludes skill file mutations. [VERIFIED: `26-CONTEXT.md`:19-24]
- **Counting existence as quality closure:** Phase 20 created G-B skills, but current G-B skills are 107/119-line skeletons with one eval JSON each. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:1-107; `.opencode/skills/hm-test-driven-execution/SKILL.md`:1-119]
- **Standalone 6-NON tables as proof:** Phase 24 context removed 6-NON tables as process guidance, and Phase 26 D-08 requires proper evidence requirements instead. [VERIFIED: `26-CONTEXT.md`:44-47; `.planning/ROADMAP.md`:611-629]
- **GSD-only assumptions:** D-07 requires arbitrary project compatibility, so artifact language must include non-GSD validation equivalents. [VERIFIED: `26-CONTEXT.md`:40-43]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill quality rubric | A new subjective rubric from scratch | Phase 18 6-NON audit + hivefiver quality matrix + GSD benchmark patterns | Existing evidence already defines trigger accuracy, action coherence, reference integrity, eval coverage, and 6-NON failure modes. [VERIFIED: `CR-AUDIT-ECOSYSTEM.md`:9-18; `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`:3-21] |
| Eval format | A new eval runner or schema | Existing `evals/evals.json`, `trigger_queries`, and `stacked_scenario` pattern | Current skills already use this shape; creating a new runner would violate Phase 26 synthesis scope. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/evals/evals.json`:1-10; `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37] |
| Integration taxonomy | Hardcoded local-only paths | OpenCode docs + project integration surfaces | OpenCode supports project/global skills, agents, commands, custom tools, and plugins; local harness plugin registers tools and hooks. [CITED: https://opencode.ai/docs/skills/; https://opencode.ai/docs/plugins/] [VERIFIED: `src/plugin.ts`:79-123] |
| Phase 22/23 repair | Re-run Phase 22/23 separately | Archive + absorb into PLAYBOOK D3/D4 | D-08 and D-09 explicitly select archival and absorption, not re-execution. [VERIFIED: `26-CONTEXT.md`:44-47] |

**Key insight:** Phase 26 should standardize what counts as evidence, not create new runtime machinery. [VERIFIED: `26-CONTEXT.md`:19-24,35-43]

## Current Evidence Inventory

| Evidence | Finding | Planning Implication |
|----------|---------|----------------------|
| Phase 18 6-NON audit | Only 3 of 24 audited skills were fully DEFENDED across all 6 NON dimensions. [VERIFIED: `CR-AUDIT-ECOSYSTEM.md`:49-57] | PLAYBOOK D3 must require source-backed DEFENDED/PARTIAL/EXPOSED scoring. |
| Phase 18 gap map | G-B originally had missing spec-driven and test-driven skills; these now exist but remain thin. [VERIFIED: `CR-GAP-MAP.md`:26-28; `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:1-107; `.opencode/skills/hm-test-driven-execution/SKILL.md`:1-119] | SPECs must target quality uplift, not existence. |
| Current inventory | 31 canonical hm-/hivefiver-* skill dirs; 18 zero-eval skills; 1 stacked scenario. [VERIFIED: local Python inventory command, 2026-04-25] | ECOSYSTEM-AUDIT.md must deduplicate by actual directory basename and avoid old 32-row duplication. |
| GSD benchmark skills | `gsd-spec-phase` has ambiguity scoring and falsifiable SPEC output; `gsd-add-tests` preserves classification/test-plan/RED-GREEN gates; `gsd-verify-work` produces UAT tracking; eval/validate skills produce audit remediation artifacts. [VERIFIED: `/Users/apple/.claude/skills/gsd-spec-phase/SKILL.md`:15-28,56-62; `/Users/apple/.agents/skills/gsd-add-tests/SKILL.md`:16-21,35-38; `/Users/apple/.agents/skills/gsd-verify-work/SKILL.md`:15-20; `/Users/apple/.claude/skills/gsd-eval-review/SKILL.md`:15-18; `/Users/apple/.agents/skills/gsd-validate-phase/SKILL.md`:16-22] | GSD-comparable means artifacts with gates, not merely longer skill bodies. |

## Quality Dimensions for PLAYBOOK.md

| # | Dimension | PASS Standard | Evidence Source |
|---|-----------|---------------|-----------------|
| D1 | Trigger Accuracy | Positive and negative trigger cases exist, and description contains explicit exclusions. | [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/evals/evals.json`:3-9; `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`:25-40] |
| D2 | Body Depth | Skill body has clear entry, process, exit, decision points, and non-trivial operational guidance. | [VERIFIED: `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`:41-57] |
| D3 | 6-NON Defence | Audit grid can score all six failure modes as DEFENDED with cited evidence. | [VERIFIED: `CR-AUDIT-ECOSYSTEM.md`:9-18] |
| D4 | Eval Coverage | Eval bundle includes realistic prompts, assertions, and at target level a stacked multi-step scenario. | [VERIFIED: `.opencode/skills/hivefiver-use-authoring-skills/references/10-eval-lifecycle.md`:13-44,46-54; `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37] |
| D5 | Reference Completeness | References deepen workflow guidance and are cited from the skill body. | [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:95-100] |
| D6 | Integration Wiring | Skill states agent, command, tool, plugin-hook, and runtime-state implications. | [VERIFIED: `26-CONTEXT.md`:40-43; `src/plugin.ts`:79-123] |
| D7 | Cross-Platform Compatibility | Skill avoids GSD-only, path-only, or tool-only assumptions and provides adaptation notes. | [VERIFIED: `26-CONTEXT.md`:40-43; `AGENTS.md`:80-83] |
| D8 | Self-Correction | Skill includes failure handling, loop-back, and escalation criteria. | [VERIFIED: `.opencode/skills/hm-test-driven-execution/SKILL.md`:52-74,98-105; `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`:89-104] |

## G-B Demonstration Strategy

Phase 26 should use `hm-spec-driven-authoring` and `hm-test-driven-execution` as demonstration SPEC subjects, not mutation targets. [VERIFIED: `26-CONTEXT.md`:35-38,145-149]

| Skill | Current Evidence | Demonstration SPEC Focus |
|-------|------------------|--------------------------|
| `hm-spec-driven-authoring` | 107-line SKILL.md, 2 reference files, one `evals.json`, no stacked scenario. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:1-107; `.opencode/skills/hm-spec-driven-authoring/evals/evals.json`:1-10] | `REQ-SDA-*` requirements for D1-D8, with hard requirement for falsifiable REQ format and acceptance-test mapping. |
| `hm-test-driven-execution` | 119-line SKILL.md, 2 reference files, one `evals.json`, no stacked scenario. [VERIFIED: `.opencode/skills/hm-test-driven-execution/SKILL.md`:1-119; `.opencode/skills/hm-test-driven-execution/evals/evals.json`:1-10] | `REQ-TDE-*` requirements for D1-D8 plus coverage-claim verification and runtime-truthful vs mock-heavy guidance. |

**Planning implication:** The G-B SPECs should be scoped to future Phase 27 changes and should include `Current State`, `Target State`, `Requirements`, `Integration Contract`, `Eval Contract`, `Verification Commands`, and `Phase 27 Execution Notes`. [VERIFIED: `gsd-spec-phase/SKILL.md`:15-28,56-62]

## Phase 22/23 Absorption Strategy

| Phase | Verified Status | Keep | Absorb Into | Planning Action |
|-------|-----------------|------|-------------|-----------------|
| 22 | NOT SUBSTANTIATED; phase directory exists now but prior work was not supported by matching evidence. [VERIFIED: `.planning/STATE.md`:91-99; `22-PLAN.md`:1-17] | The intended concern: 6-NON defence. | PLAYBOOK D3, plus `ARCHIVE-22.md`. | Do not re-run Phase 22; produce closure record with original claim, verified reality, absorbed scope, evidence, closure decision. |
| 23 | PARTIAL; eval files expanded for some skills but coverage is incomplete. [VERIFIED: `.planning/STATE.md`:91-99; `23-PLAN.md`:1-18] | Valid concern: eval bundle and stacked scenario coverage. | PLAYBOOK D4, plus `ARCHIVE-23.md`. | Do not re-run Phase 23; produce closure record and make Phase 27-30 responsible for per-skill eval completion. |

## Artifact Recommendations

| Artifact | Required Content | Why Planner Needs It |
|----------|------------------|----------------------|
| `PLAYBOOK.md` | D1-D8 quality dimensions, quality tiers, evidence requirements, integration wiring requirements, cross-platform rules. [VERIFIED: `26-CONTEXT.md`:35-43,52-56] | Provides the canonical standard for all future hm-/hivefiver-* quality work. |
| `ECOSYSTEM-AUDIT.md` | Current canonical inventory, deduplicated skill rows, D1-D8 score matrix, open gap register. [VERIFIED: local inventory command, 2026-04-25; `CR-AUDIT-ECOSYSTEM.md`:20-47] | Prevents Phase 27+ from relying on stale Phase 18 names or existence-only closure. |
| `SPEC-hm-spec-driven-authoring.md` | Current state, target state, `REQ-SDA-*`, integration contract, eval contract, verification commands. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:77-84] | Makes Phase 27 rewrite requirements falsifiable without touching the skill in Phase 26. |
| `SPEC-hm-test-driven-execution.md` | Current state, target state, `REQ-TDE-*`, coverage verification, runtime-truthful testing guidance, cross-platform coverage adapters. [VERIFIED: `.opencode/skills/hm-test-driven-execution/SKILL.md`:76-105] | Makes Phase 27 testing-quality requirements concrete and GSD-comparable. |
| `ROADMAP-27-30.md` | Phase 27 G-B, Phase 28 G-C, Phase 29 G-D, Phase 30 G-A sequencing with entry/exit gates. [VERIFIED: `26-CONTEXT.md`:145-154] | Converts synthesis into ordered future work while keeping Phase 31 deferred. |
| `ARCHIVE-22.md` / `ARCHIVE-23.md` | Original claim, verified reality, absorbed scope, evidence, closure decision. [VERIFIED: `.planning/STATE.md`:91-112; `22-PLAN.md`:1-21; `23-PLAN.md`:1-28] | Preserves valid historical evidence while preventing stale closure claims from being reused. |
| `.planning/REQUIREMENTS.md` HMQUAL entries | `HMQUAL-01` through `HMQUAL-08`, mapped to D1-D8. [VERIFIED: `26-CONTEXT.md`:35-39] | Makes the quality standards project-level requirements, not a one-off phase note. |

## Planning Implications

- Plan 26 tasks should be artifact-first and read-only against `.opencode/skills/**/SKILL.md` and `src/`. [VERIFIED: `26-CONTEXT.md`:19-24]
- Plan 26 should reconcile already-existing 26 plan artifacts against this research because `init phase-op 26` reported `has_plans: true` and `plan_count: 4`. [VERIFIED: GSD init command output, 2026-04-25]
- Plan 26 verification should prioritize content checks over code tests because this phase writes planning artifacts, not TypeScript runtime code. [VERIFIED: `26-CONTEXT.md`:19-24; `package.json`:20-27]
- Phase 27 should not begin until PLAYBOOK, ECOSYSTEM-AUDIT, and both G-B SPEC files exist and pass the Validation Architecture checks. [VERIFIED: `26-CONTEXT.md`:35-50]
- Phase 27+ should treat a skill as complete only when it passes all D1-D8 dimensions with cited evidence, not when files merely exist. [VERIFIED: `CR-GAP-MAP.md`:48-78; local inventory command, 2026-04-25]

## Risk Register

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|------------|
| Existing Phase 26 plans may reflect the older research artifact rather than this revised source-provenance version. | HIGH | `init phase-op 26` reported existing plans and research. [VERIFIED: GSD init command output, 2026-04-25] | Planner must reconcile plans against this revised `26-RESEARCH.md` before execution. |
| Audit count drift can create false coverage claims. | HIGH | Current canonical count is 31, while older research counted 32 due a duplicate row. [VERIFIED: local inventory command, 2026-04-25] | ECOSYSTEM-AUDIT.md must derive inventory from actual directories and dedupe by basename. |
| Phase 26 could accidentally become Phase 27 implementation. | CRITICAL | Locked scope excludes skill mutations and full rewrites. [VERIFIED: `26-CONTEXT.md`:19-24,145-149] | Restrict Phase 26 writes to planning artifacts plus requirements update. |
| Eval coverage could remain trigger-only. | HIGH | G-B eval files contain only `trigger_queries`; only `hm-completion-looping` has `stacked_scenario`. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/evals/evals.json`:1-10; `.opencode/skills/hm-test-driven-execution/evals/evals.json`:1-10; `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37] | PLAYBOOK D4 and G-B SPECs must require stacked scenario definitions for target quality. |
| Integration wiring could remain theoretical. | MEDIUM | D-06 requires integration across agents, commands, tools, plugin hooks, and runtime state routers. [VERIFIED: `26-CONTEXT.md`:40-43] | D6 must include explicit fields for every integration surface and cite `src/plugin.ts`/OpenCode docs. |

## OpenCode / Hivemind Integration Planning

| Surface | Current Evidence | PLAYBOOK Requirement |
|---------|------------------|----------------------|
| Agents | 57 local agent files exist. [VERIFIED: local integration surface count command, 2026-04-25] OpenCode agents support tool/permission configuration and subagent modes. [CITED: https://opencode.ai/docs/agents/] | Every skill quality score should verify agent compatibility: when loaded directly, delegated, or restricted by permissions. |
| Commands | 16 local command files exist. [VERIFIED: local integration surface count command, 2026-04-25] OpenCode command docs support Markdown command files, arguments, agent binding, and subtask behavior. [CITED: https://opencode.ai/docs/commands/] | Every skill should state whether it is invoked directly, through a command, or only as a reference. |
| Tools | Harness plugin registers `delegate-task`, `delegation-status`, `run-background-command` when PTY is available, `prompt-skim`, `prompt-analyze`, `session-patch`, `configure-primitive`, and `validate-restart`. [VERIFIED: `src/plugin.ts`:86-97] | D6 should require tool integration analysis without requiring all tools to be used. |
| Plugin hooks | Harness plugin wires core/session/tool guard hooks and `tool.execute.after`; OpenCode docs list plugin events including `tool.execute.before`, `tool.execute.after`, and session events. [VERIFIED: `src/plugin.ts`:79-123] [CITED: https://opencode.ai/docs/plugins/] | PLAYBOOK should require hook-awareness for skills that affect runtime behavior. |
| Runtime state routers | Project runtime state path is `.opencode/state/opencode-harness/`; state overrides are documented as `OPENCODE_HARNESS_STATE_DIR` and `OPENCODE_HARNESS_CONTINUITY_FILE`. [VERIFIED: `AGENTS.md`:149-152,252-259] | Skill guidance must adapt to arbitrary user projects and not assume this repo's state paths exist. |

## Dependency Map and Phase 27+ Sequencing

```text
Phase 26: PLAYBOOK + audit + G-B SPECs + archive records + HMQUAL requirements
  └─ Phase 27: G-B Quality Assurance Demonstration
       Inputs: PLAYBOOK.md, ECOSYSTEM-AUDIT.md, SPEC-hm-spec-driven-authoring.md, SPEC-hm-test-driven-execution.md
       Scope: Rewrite/expand exactly hm-spec-driven-authoring + hm-test-driven-execution
       Exit: both pass D1-D8 and include stacked evals
  └─ Phase 28: G-C Research Lineage
       Depends on: Phase 27 proves PLAYBOOK is executable
       Scope: hm-deep-research, hm-detective, hm-synthesis, hm-research-chain
  └─ Phase 29: G-D Execution Lineage
       Depends on: G-B/G-C patterns for specs, tests, research
       Scope: hm-debug, hm-refactor, hm-phase-execution, hm-planning-with-files, remaining G-D gaps
  └─ Phase 30: G-A Guardrail Lineage
       Depends on: execution and research patterns stabilized
       Scope: hm-completion-looping, hm-phase-loop, hm-subagent-delegation-patterns, hm-user-intent-interactive-loop
  └─ Phase 31: deferred cross-lineage E2E integration validation
```

This sequence follows the locked deferred-scope ordering for G-B, G-C, G-D, G-A, and Phase 31. [VERIFIED: `26-CONTEXT.md`:145-154]

## Common Pitfalls

### Pitfall 1: Repeating Phase 22's unsubstantiated-claim failure
**What goes wrong:** A plan writes standards but does not require evidence. [VERIFIED: `.planning/STATE.md`:91-99]  
**How to avoid:** Every PLAYBOOK dimension must include verification commands and source-backed PASS/FAIL rules. [VERIFIED: `gsd-validate-phase/SKILL.md`:16-22]

### Pitfall 2: Treating G-B SPECs as implementation
**What goes wrong:** The planner mutates `SKILL.md` files in Phase 26, violating locked scope. [VERIFIED: `26-CONTEXT.md`:19-24]  
**How to avoid:** SPECs are contracts for Phase 27; Phase 26 only writes planning artifacts. [VERIFIED: `26-CONTEXT.md`:35-39,145-149]

### Pitfall 3: Auditing stale or duplicate skill names
**What goes wrong:** Old Phase 18 names or duplicated rows inflate counts. [VERIFIED: `CR-DECISIONS.md`:22-63]  
**How to avoid:** Inventory the current `.opencode/skills/` directory, filter `hm-*` and `hivefiver-*`, sort, and deduplicate by directory basename. [VERIFIED: local Python inventory command, 2026-04-25]

### Pitfall 4: GSD-only quality language
**What goes wrong:** Standards become unusable in arbitrary OpenCode user projects. [VERIFIED: `26-CONTEXT.md`:40-43]  
**How to avoid:** Pair each GSD comparison with OpenCode-native and generic fallback equivalents. [CITED: https://opencode.ai/docs/skills/]

## Code Examples

Verified artifact patterns from local sources:

### SPEC Requirement Shape
```markdown
### REQ-SDA-01: Trigger Accuracy
**Description:** The skill activates only for spec-to-requirement tasks.
**Acceptance Criteria:** Positive and negative trigger cases exist in evals/evals.json.
**Verification Method:** Inspect eval JSON for expected_loaded true and false cases.
**Maps To PLAYBOOK Dimension:** D1 Trigger Accuracy
```
Source pattern: `hm-spec-driven-authoring` requirement format. [VERIFIED: `.opencode/skills/hm-spec-driven-authoring/SKILL.md`:77-84]

### Eval Stacked Scenario Shape
```json
{
  "stacked_scenario": {
    "skills": ["hm-coordinating-loop", "hm-planning-with-files", "hm-completion-looping"],
    "query": "Plan and execute a multi-subagent task with completion verification",
    "expected_behavior": "..."
  }
}
```
Source pattern: `hm-completion-looping` eval bundle. [VERIFIED: `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static skill skeletons with minimal body text | Skill packages with frontmatter, references, evals, scripts, and self-correction | Phase 20 created skeletons; Phase 26 must define quality contract. [VERIFIED: `.planning/ROADMAP.md`:473-489; `26-CONTEXT.md`:126-131] | Future work must improve body depth and evidence, not just create files. |
| Standalone 6-NON tables | Embedded evidence-backed defenses scored by audit | Phase 24 removed 6-NON tables as skill content; Phase 26 D-08 absorbs real defense into PLAYBOOK. [VERIFIED: `.planning/ROADMAP.md`:611-629; `26-CONTEXT.md`:44-47] | PLAYBOOK D3 should require audit evidence, not visible table sections. |
| Trigger-query-only evals | Stacked eval scenarios with multi-skill workflow behavior | Existing stacked example appears in `hm-completion-looping`. [VERIFIED: `.opencode/skills/hm-completion-looping/evals/evals.json`:33-37] | D4 should distinguish basic trigger coverage from target stacked scenarios. |

**Deprecated/outdated:** Treating Phase 22 as complete is deprecated for planning because STATE marks it NOT SUBSTANTIATED and its scope is absorbed into Phase 26. [VERIFIED: `.planning/STATE.md`:91-99; `26-CONTEXT.md`:44-47]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 27 should target exactly the two G-B skills before G-C/G-D/G-A execution. [ASSUMED] | Dependency Map | Low: user context strongly implies G-B first, but exact phase count/order remains under agent discretion. |
| A2 | D8 Self-Correction should be a standalone PLAYBOOK dimension rather than folded into 6-NON. [ASSUMED] | Quality Dimensions | Medium: if the planner wants fewer dimensions, D8 can merge into D3/NON-3 without losing substance. |

## Open Questions

1. **Should `hivefiver-*` skills be scored in the same audit table as `hm-*` skills?**
   - What we know: The canonical directory contains both prefixes, and Phase 26 context says full hm-* ecosystem but also references hivefiver/meta integration. [VERIFIED: `.opencode/skills` directory read; `26-CONTEXT.md`:71-97]
   - What's unclear: Whether non-hm hivefiver support skills need HMQUAL requirements or a separate support tier.
   - Recommendation: Include both in ECOSYSTEM-AUDIT.md, but distinguish primary `hm-*` lineage from support `hivefiver-*` lineage. [ASSUMED]

2. **Should Phase 26 update existing already-created 26 PLAN/VALIDATION artifacts?**
   - What we know: `init phase-op 26` reported `has_plans: true`, `plan_count: 4`, and `has_research: true`. [VERIFIED: GSD init command output, 2026-04-25]
   - What's unclear: The orchestrator requested research-before-planning, but planning artifacts already exist in the phase directory.
   - Recommendation: Planner should treat this revised research as authoritative and reconcile any already-existing plans against it before execution. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | inventory scripts and npm package verification | ✓ | v25.9.0 | Use manual file reads if unavailable. [VERIFIED: environment audit command] |
| npm | package version verification | ✓ | 11.13.0 | Use package.json only, lower confidence. [VERIFIED: environment audit command] |
| git | artifact tracking / optional commit | ✓ | 2.54.0 | Write artifact without commit if git unavailable. [VERIFIED: environment audit command] |
| GSD tools | phase init and path resolution | ✓ | n/a | User-provided paths were sufficient. [VERIFIED: GSD init command output] |
| OpenCode runtime | future integration validation | not probed as live app | project package target `>=1.14.20` | Use docs/local config until live OpenCode verification. [VERIFIED: `package.json`:45-47] |

**Missing dependencies with no fallback:** None for research artifact writing. [VERIFIED: environment audit command]

**Missing dependencies with fallback:** Live OpenCode runtime verification was not required for Phase 26 research; future Phase 31 should test end-to-end runtime loading. [VERIFIED: `26-CONTEXT.md`:151-152]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Artifact validation through shell/file checks; project test framework is Vitest for code changes. [VERIFIED: `package.json`:20-27,39-44] |
| Config file | No Phase 26-specific test config required; `.planning/config.json` enables `workflow.nyquist_validation`. [VERIFIED: `.planning/config.json`:9-14] |
| Quick run command | `test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/PLAYBOOK.md && test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/ECOSYSTEM-AUDIT.md` |
| Full suite command | `grep -c "PASS Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/PLAYBOOK.md && grep -c "REQ-SDA-" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/SPEC-hm-spec-driven-authoring.md && grep -c "REQ-TDE-" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/SPEC-hm-test-driven-execution.md` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SYN-01 | PLAYBOOK exists with D1-D8 measurable dimensions | artifact/content | `grep -c "PASS Criteria" PLAYBOOK.md` expecting ≥8 | ❌ Wave 0 |
| SYN-02 | Two G-B SPEC files exist with falsifiable REQ IDs | artifact/content | `grep -c "REQ-SDA-" SPEC-hm-spec-driven-authoring.md && grep -c "REQ-TDE-" SPEC-hm-test-driven-execution.md` | ❌ Wave 0 |
| SYN-03 | Ecosystem audit scores current canonical skills once | artifact/content | `grep -q "Canonical Inventory" ECOSYSTEM-AUDIT.md` | ❌ Wave 0 |
| SYN-04 | Phase 27-30 roadmap exists and excludes Phase 31 execution | artifact/content | `grep -q "Deferred Scope" ROADMAP-27-30.md` | ❌ Wave 0 |
| SYN-05 | REQUIREMENTS.md has HMQUAL entries | content | `grep -c "HMQUAL-" .planning/REQUIREMENTS.md` expecting ≥8 | ❌ Wave 0 |
| SYN-06 | Phase 22/23 archive records exist | artifact/content | `grep -q "NOT SUBSTANTIATED" ARCHIVE-22.md && grep -q "PARTIAL" ARCHIVE-23.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run the specific artifact/content command for the artifact created in that task. [VERIFIED: `gsd-validate-phase/SKILL.md`:16-22]
- **Per wave merge:** Run the full suite command above. [VERIFIED: `.planning/config.json`:9-14]
- **Phase gate:** All six SYN requirements must have artifact evidence before `/gsd-verify-work`. [VERIFIED: `gsd-verify-work/SKILL.md`:15-20]

### Wave 0 Gaps
- [ ] `PLAYBOOK.md` — covers SYN-01 / D-01 through D-07.
- [ ] `ECOSYSTEM-AUDIT.md` — covers SYN-03.
- [ ] `SPEC-hm-spec-driven-authoring.md` — covers SYN-02 / G-B demonstration.
- [ ] `SPEC-hm-test-driven-execution.md` — covers SYN-02 / G-B demonstration.
- [ ] `ROADMAP-27-30.md` — covers SYN-04.
- [ ] `ARCHIVE-22.md` and `ARCHIVE-23.md` — cover SYN-06.
- [ ] `.planning/REQUIREMENTS.md` HMQUAL section — covers SYN-05.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No auth surface changes in Phase 26. [VERIFIED: `26-CONTEXT.md`:19-24] |
| V3 Session Management | no | No runtime session state mutation in Phase 26. [VERIFIED: `26-CONTEXT.md`:19-24] |
| V4 Access Control | yes | Preserve read-only synthesis boundary; no skill/src mutations. [VERIFIED: `26-CONTEXT.md`:19-24] |
| V5 Input Validation | yes | Validate artifact structure through grep/file checks and sourced evidence. [VERIFIED: `.planning/config.json`:9-14] |
| V6 Cryptography | no | No cryptographic operations in scope. [VERIFIED: `26-CONTEXT.md`:19-24] |

### Known Threat Patterns for Phase 26

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unsubstantiated quality claims | Repudiation | Require every finding to cite path/line or command output. [VERIFIED: Phase 22 failure in `.planning/STATE.md`:91-99] |
| Scope creep into skill rewrites | Tampering | Keep Phase 26 writes limited to planning artifacts and REQUIREMENTS.md update. [VERIFIED: `26-CONTEXT.md`:19-24,35-39] |
| Stale inventory | Information Disclosure / Integrity | Inventory current `.opencode/skills/`, not old Phase 18 names. [VERIFIED: local Python inventory command, 2026-04-25] |
| GSD-only coupling | Denial of Service | Require OpenCode-native and arbitrary-project adaptation notes. [VERIFIED: `26-CONTEXT.md`:40-43] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-CONTEXT.md` — locked decisions D-01 through D-11 and scope boundaries.
- `.planning/STATE.md` — Phase 22/23 status and current project state.
- `.planning/ROADMAP.md` — Phase lineage and dependencies.
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-AUDIT-ECOSYSTEM.md` — 6-NON criteria and original audit grid.
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-GAP-MAP.md` — G-A through G-D gap lineage.
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-DECISIONS.md` — per-skill decisions.
- `.opencode/skills/hm-spec-driven-authoring/SKILL.md` and `.opencode/skills/hm-test-driven-execution/SKILL.md` — G-B current state.
- Local inventory command over `.opencode/skills/` — canonical count/eval/script/reference facts.

### Secondary (MEDIUM confidence)
- OpenCode official docs: skills, agents, commands, custom tools, plugins. [CITED: https://opencode.ai/docs/skills/; https://opencode.ai/docs/agents/; https://opencode.ai/docs/commands/; https://opencode.ai/docs/custom-tools/; https://opencode.ai/docs/plugins/]
- npm registry version checks for `@opencode-ai/plugin`, `@opencode-ai/sdk`, `zod`, `vitest`, `typescript`.

### Tertiary (LOW confidence)
- None intentionally used as authoritative; assumptions are listed in Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via local `package.json`, npm registry checks, and official OpenCode docs.
- Architecture: HIGH — verified against `src/plugin.ts`, AGENTS.md, and OpenCode docs.
- Pitfalls: HIGH — verified against Phase 18 artifacts, Phase 22/23 plans, and STATE.md.
- Phase 27+ sequencing: MEDIUM — locked context names deferred lineages, but exact sequencing remains partly at agent discretion.

**Research date:** 2026-04-25  
**Valid until:** 2026-05-25 for local project facts; 2026-05-02 for OpenCode/npm version facts.
