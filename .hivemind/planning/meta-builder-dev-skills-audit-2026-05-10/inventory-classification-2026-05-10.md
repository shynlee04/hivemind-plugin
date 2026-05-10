# Meta-Concept *-dev Skills: Complete Inventory & Classification

**Generated:** 2026-05-10  
**Coordinator:** hm-l1-coordinator  
**Researchers:** hm-l2-researcher (project skills), hm-l2-researcher (global skills + OpenCode docs)  
**Total Skills Inventoried:** 32

---

## Part A: Project Skills (hf-* + hm-* + unprefixed) — 17 skills

Source: `.opencode/skills/` in `/Users/apple/hivemind-plugin-private/`

| # | Skill Name | Lineage | Primitive Type | L-Level | Teaches | Naming Compliant | Has Trigger Phrases | Has Progressive Disclosure | Key Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | hf-l2-agent-composition | hf | agents | L2 | compose, design | ✅ | ✅ | ✅ (references/ + assets/ + examples/ + evals/) | Teaches agent composition using XML markup grammar, step protocols, structured return formats. 14+ XML blocks. Five non-negotiables. `metadata.layer: "2"`. |
| 2 | hf-l2-agents-and-subagents-dev | hf | agents, subagents, worktree | L2 | create, configure, delegate | ✅ | ✅ | ✅ (references/) | OpenCode agent architecture: delegation (WaiterModel), worktree isolation, fork sessions, parallel tasks. Iron Law: "No subagent without constructed context." |
| 3 | hf-l2-agents-md-sync | hf | docs, AGENTS.md | L2 | sync, doctor, fix | ✅ | ✅ | ✅ (references/ + scripts/) | Detects/fixes drift between AGENTS.md and codebase. Scan→Diff→Apply workflow. 7-step scan protocol. |
| 4 | hf-l2-command-dev | hf | commands | L2 | create, update, validate | ✅ | ✅ | ✅ (references/) | OpenCode command creation: CI=true shell safety, banned commands list, YAML frontmatter, $ARGUMENTS, agent binding, subtask flag. |
| 5 | hf-l2-command-parser | hf | commands | ⚠️ L3 (file says l2, meta says l3) | parse, validate | ⚠️ L-mismatch | ✅ | ✅ (references/ + scripts/) | Parses $ARGUMENT propositional commands: named args, flags, quoted values, entity:action. Five-step procedure. |
| 6 | hf-l2-context-absorb | hf | workflows, state | L2 | absorb, append, synthesize | ✅ | ✅ | ✅ (references/) | Multi-wave swarm protocol for absorbing context into session-context-prompt.md. 5-wave protocol (0-4). Cross-loads hm-detective + hm-synthesis + hm-deep-research. |
| 7 | hf-l2-custom-tools-dev | hf | custom-tools, plugins | L2 | create, build, validate | ✅ | ✅ | ✅ (references/) | OpenCode plugin/tool creation: Zod schema-first, plugin lifecycle, CQRS (tools=write, hooks=read), script rule. |
| 8 | hf-l2-delegation-gates | hf | workflows, permissions | L2 | validate, authorize, gate | ✅ | ✅ | ✅ (references/ + scripts/) | Pre-delegation authorization: 4-gate sequence + 4 boundary checks. Phase 30 boundary guardrails. |
| 9 | hf-l2-meta-builder-core | hf | agents, skills, commands, tools | ⚠️ L0 (file says l2, meta says l0) | route, classify, navigate | ⚠️ L-mismatch | ✅ | ✅ (references/ + assets/ + scripts/ + workflows/) | Routes meta-concept requests to specialists. 389-line router. "Edit in labs, test via symlinks" policy. Max 3 skills per stack. |
| 10 | hf-l2-naming-syndicate | hf | governance, validation | L2 | validate, verify | ✅ | ✅ | ❌ (no references/ dir) | Defines canonical naming for ALL meta-concepts. Validates hm-*/hf-*/gate-*/stack-* prefixes. Machine-verifiable. |
| 11 | hf-l2-skill-router | hf | routing, dispatch | L2 | route, classify, map | ✅ | ✅ | ✅ (references/) | Maps meta-builder domains to hf-* skill bundles. 8 domains, max 3 skills per bundle. FLEXIBLE — cross-routes to hm-*. |
| 12 | hf-l2-skill-synthesis | hf | skills, evals | ⚠️ L3 (file says l2, meta says l3) | synthesize, classify, scaffold | ⚠️ L-mismatch | ✅ | ✅ (references/ + scripts/ + templates/) | Synthesizes skills from GitHub repos. INGEST→CLASSIFY→SCAFFOLD→VALIDATE. ≥3 evals, ≥20 trigger queries per skill. Iron Law: "No skill without evals." |
| 13 | hf-l2-use-authoring-skills | hf | skills | L2 | create, audit, doctor, refactor, score | ✅ | ✅ | ✅ (references/ + scripts/ + templates/ + hooks/) | Comprehensive skill authoring. Iron Law: "No skill without trigger phrases in the description." Preflight validator gate. |
| 14 | opencode-config-workflow | unprefixed | agents, commands, skills | L2 | configure, setup, batch | ✅ (intentionally unprefixed per naming syndicate) | ✅ | ❌ (no references/ dir) | Framework-agnostic 8-turn configuration: Discover→Investigate→Collect→Proposal→Validate→Compile→Test→Save. Uses configure-primitive tool. 196 lines inline. |
| 15 | hm-l3-opencode-project-audit | hm | agents, skills, commands, tools, permissions | L3 | audit, verify, map | ✅ | ✅ | ✅ (references/ + assets/ + scripts/) | 7-phase parallel audit of OpenCode projects. Iron Law: "Audit reports facts. Never blocks. Never fixes." |
| 16 | hm-l2-spec-driven-authoring | hm | specifications, requirements | L2 | derive, lock, validate | ✅ | ✅ | ✅ (references/ + scripts/ + templates/ + workflows/) | PRD/spec→requirements + acceptance criteria. Source Audit→Ambiguity Gate→Requirement Table→Acceptance Matrix→Handoff. |
| 17 | hm-l2-refactor | hm | code | L2 | decide, plan, scope | ✅ | ✅ | ✅ (references/ + scripts/) | Surgical vs. structural refactoring with gated protocol. Iron Law: "Refactoring without tests is restructuring." |

---

## Part B: Global Skills (third-party, orphan, Superpowers) — 15 skills

Source: `/Users/apple/.agents/skills/`

| # | Skill Name | Lineage | Primitive Type | Teaches | Has Trigger Phrases | Has Progressive Disclosure | Key Notes |
|---|---|---|---|---|---|---|---|
| 1 | Agent Development | Third-party (Claude Code plugin) | agents | create, validate | ✅ 9 phrases | ✅ (references/ + examples/ + scripts/) | Claude Code plugin agent format. YAML frontmatter. 415 lines. NOT OpenCode-native. |
| 2 | Command Development | Third-party (Claude Code plugin) | commands | create, validate | ✅ 9 phrases | ✅ (references/ + examples/) | Claude Code slash command format. `allowed-tools`, `argument-hint`, `CLAUDE_PLUGIN_ROOT`. 834 lines. NOT OpenCode-native. |
| 3 | Skill Development | Third-party (Claude Code plugin) | skills | create, validate | ✅ 5 phrases | ✅ (references/) | Skills for Claude Code plugins. 637 lines. |
| 4 | create-skill | Third-party/Orphan (GSD) | skills | create, audit, verify, upgrade | ⚠️ Implicit | ✅ (references/ + workflows/ + templates/ + scripts/) | GSD skill builder. Pure XML structure. Router pattern. 186 lines. |
| 5 | skill-creator | Third-party/Orphan (Official Anthropic) | skills | create, evaluate, iterate, benchmark | ⚠️ Implicit | ✅ (references/ + agents/ + scripts/ + eval-viewer/) | Official Anthropic. TDD approach: draft→test→evaluate→iterate. Evals framework. 485 lines. |
| 6 | skill-judge | Third-party/Orphan | skills | audit, evaluate, score | ⚠️ Implicit | ❌ Self-contained | 8-dimension scoring (120 pts). 752 lines. |
| 7 | writing-skills | Third-party (Superpowers) | skills | create, edit, verify | ⚠️ Implicit | ✅ (references/) | TDD for skills. RED-GREEN-REFACTOR. CSO. 655 lines. |
| 8 | find-skills | Third-party | skills | discover, install | ✅ 4 phrases | ❌ Self-contained | Uses `npx skills` CLI. 142 lines. |
| 9 | create-gsd-extension | Third-party (GSD) | extensions, tools, commands | create, debug | ✅ 8 phrases | ✅ (workflows/ + references/) | GSD extension TypeScript modules. Uses pi-ai, TypeBox. 89 lines. |
| 10 | create-workflow | Third-party (GSD) | workflows | create | ✅ 6 phrases | ✅ (references/ + templates/ + workflows/) | GSD YAML workflow definitions. V1 schema. 130 lines. |
| 11 | create-mcp-server | Third-party (GSD) | MCP servers | create, test, evaluate | ✅ 5 phrases | ❌ Self-contained | 6-step MCP server authoring. 121 lines. |
| 12 | create-agentsmd | Third-party/Orphan | AGENTS.md file | create (generate) | ❌ None | ❌ Self-contained | Template-based AGENTS.md generator. 249 lines. |
| 13 | agent-md-refactor | Third-party | AGENTS.md, CLAUDE.md | refactor | ✅ 7 phrases | ❌ Self-contained | 5-phase refactor for agent instruction files. 287 lines. |
| 14 | agent-orchestrator | Third-party | agent orchestration | orchestrate, coordinate | ❌ None | ❌ Self-contained | Phase-gated multi-agent loop. 94 lines. |
| 15 | dispatching-parallel-agents | Third-party (Superpowers) | agent dispatch | dispatch, coordinate | ⚠️ Vague | ❌ Self-contained | Parallel agent dispatch pattern. 182 lines. |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total skills inventoried** | 32 |
| **hf-* lineage (project)** | 13 |
| **hm-* lineage (project)** | 3 |
| **Unprefixed (project)** | 1 |
| **Third-party (global)** | 9 |
| **Third-party/Orphan (global)** | 4 |
| **Superpowers (global)** | 2 |
| **Skills with progressive disclosure** | 25 |
| **Skills without progressive disclosure** | 7 |
| **Skills with explicit trigger phrases** | 25 |
| **Skills with implicit/vague triggers** | 5 |
| **Skills with no triggers** | 2 |
| **L-level mismatches detected** | 3 (hf-l2-meta-builder-core, hf-l2-command-parser, hf-l2-skill-synthesis) |

---

## Primitive Type Distribution

| Primitive Type | Count | Skills |
|---------------|-------|--------|
| **Skills** (authoring, evaluating, synthesizing) | 8 | hf-l2-skill-synthesis, hf-l2-skill-router, hf-l2-use-authoring-skills, create-skill, skill-creator, skill-judge, writing-skills, find-skills |
| **Agents** (creating, composing, configuring) | 4 | hf-l2-agent-composition, hf-l2-agents-and-subagents-dev, Agent Development, agent-md-refactor |
| **Commands** (creating, parsing, configuring) | 3 | hf-l2-command-dev, hf-l2-command-parser, Command Development |
| **Custom Tools / Plugins** | 1 | hf-l2-custom-tools-dev |
| **Multi-primitive** (routing, auditing, configuring across primitives) | 4 | hf-l2-meta-builder-core, opencode-config-workflow, hm-l3-opencode-project-audit, create-gsd-extension |
| **Workflows / Orchestration** | 4 | hf-l2-delegation-gates, hf-l2-context-absorb, create-workflow, agent-orchestrator |
| **MCP Servers** | 1 | create-mcp-server |
| **Governance / Naming** | 2 | hf-l2-naming-syndicate, hf-l2-agents-md-sync |
| **Specifications / Requirements** | 1 | hm-l2-spec-driven-authoring |
| **Refactoring** | 2 | hm-l2-refactor, agent-md-refactor |
| **Docs / AGENTS.md** | 1 | create-agentsmd |
| **Dispatch / Coordination** | 1 | dispatching-parallel-agents |

---

## Action/Teach Distribution

| Action | Count | Skills |
|--------|-------|--------|
| **create** / compose / build | 17 | hf-l2-agent-composition, hf-l2-agents-and-subagents-dev, hf-l2-command-dev, hf-l2-custom-tools-dev, hf-l2-skill-synthesis, hf-l2-use-authoring-skills, Agent Development, Command Development, Skill Development, create-skill, skill-creator, writing-skills, create-gsd-extension, create-workflow, create-mcp-server, create-agentsmd, opencode-config-workflow |
| **audit** / verify / validate | 8 | hf-l2-agents-md-sync, hf-l2-delegation-gates, hf-l2-naming-syndicate, hm-l3-opencode-project-audit, hm-l2-spec-driven-authoring, hm-l2-refactor, skill-judge, agent-md-refactor |
| **route** / classify / dispatch | 4 | hf-l2-meta-builder-core, hf-l2-skill-router, find-skills, dispatching-parallel-agents |
| **parse** / extract | 1 | hf-l2-command-parser |
| **absorb** / synthesize | 1 | hf-l2-context-absorb |
| **sync** / doctor / fix | 1 | hf-l2-agents-md-sync |
| **orchestrate** / coordinate | 1 | agent-orchestrator |
| **evaluate** / score / benchmark | 2 | skill-creator, skill-judge |

---

## L-Level Correctness Issues

| Skill | Filename L-Level | Metadata L-Level | Resolution Needed |
|-------|-----------------|-------------------|-------------------|
| hf-l2-meta-builder-core | L2 | L0 | Filename says L2 but role is router/classifier (L0/L1). Should be `hf-l0-meta-builder-core` or `hf-l1-meta-builder-coordinator` |
| hf-l2-command-parser | L2 | L3 | Filename says L2 but meta says L3. Parser as deep technical skill fits L3 better — rename to `hf-l3-command-parser` |
| hf-l2-skill-synthesis | L2 | L3 | Filename says L2 but meta says L3. Synthesis from repos is research-tier — rename to `hf-l3-skill-synthesis` |

---

## Progressive Disclosure Gaps

| Skill | Issue | Recommendation |
|-------|-------|----------------|
| hf-l2-naming-syndicate | No `references/` directory — 100% inline | Extract taxonomy rules and validation procedures to `references/` |
| opencode-config-workflow | No `references/` directory — 196 lines inline | Extract workflow turns to `references/turn-protocols.md` |
| skill-judge | Self-contained — all 752 lines in SKILL.md | Extract scoring dimensions to `references/scoring-dimensions.md` |
| skill-creator | Self-contained | Extract eval framework to `references/evals-framework.md` |
| find-skills | Self-contained — 142 lines | Acceptable for a thin discovery skill |
| create-mcp-server | Self-contained — 121 lines | Acceptable for a thin creation skill |
| agent-orchestrator | Self-contained — 94 lines | Acceptable for a thin orchestration skill |

---

## Trigger Phrase Gaps

| Skill | Gap | Recommendation |
|-------|-----|----------------|
| create-agentsmd | No trigger phrases listed | Add trigger phrases: "generate AGENTS.md", "create AGENTS.md file" |
| agent-orchestrator | No trigger phrases listed | Add trigger phrases or mark as orchestration-only (not user-facing) |
| dispatching-parallel-agents | Vague trigger only ("2+ independent tasks...") | Add explicit triggers: "dispatch parallel agents", "run in parallel" |
| create-skill | Implicit triggers only (router pattern) | Add explicit triggers to description |
| skill-creator | Implicit triggers only | Add explicit trigger phrases |
| skill-judge | Implicit triggers only | Add explicit trigger phrases |
| writing-skills | Implicit triggers only | Add explicit trigger phrases |

---

**Evidence chains:** All 32 skill files verified via read operations on May 10, 2026. All classifications extracted from SKILL.md frontmatter and description sections. L-level data verified against both filename prefix and metadata.layer field where present.
