# Meta-Concept *-dev Skills: Complete Inventory & Classification

**Generated:** 2026-05-10
**Coordinator:** hm-l1-coordinator
**Researchers:** hm-l2-researcher (project skills), hm-l2-researcher (global skills + OpenCode docs)
**Total Skills Inventoried:** 32

---

## Part A: Project Skills (hf-* + hm-* + unprefixed) — 17 skills

Source: `.opencode/skills/` in `/Users/apple/hivemind-plugin-private/`

### Project Skills Classification

| # | Skill Name | Lineage | Primitive Type | L-Level | Teaches | Naming | Triggers | ProgDisc | Key Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | hf-l2-agent-composition | hf | agents | L2 | compose, design | ✅ | ✅ | ✅ | XML grammar, step protocols, 14+ XML blocks. 5 non-negotiables. |
| 2 | hf-l2-agents-and-subagents-dev | hf | agents, subagents | L2 | create, configure, delegate | ✅ | ✅ | ✅ | WaiterModel, worktree isolation, fork sessions. Iron Law: "No subagent without constructed context." |
| 3 | hf-l2-agents-md-sync | hf | docs, AGENTS.md | L2 | sync, doctor, fix | ✅ | ✅ | ✅ | Scan→Diff→Apply. 7-step scan protocol. Never regenerates from scratch. |
| 4 | hf-l2-command-dev | hf | commands | L2 | create, update, validate | ✅ | ✅ | ✅ | CI=true shell safety, banned commands, YAML frontmatter, $ARGUMENTS, agent binding, subtask. |
| 5 | hf-l2-command-parser | hf | commands | ⚠️ L3 (meta l3) | parse, validate | ⚠️ L-mismatch | ✅ | ✅ | $ARGUMENT propositional parsing: named args, flags, quoted values. 5-step procedure. |
| 6 | hf-l2-context-absorb | hf | workflows, state | L2 | absorb, append, synthesize | ✅ | ✅ | ✅ | 5-wave swarm protocol for session-context-prompt.md. Cross-loads hm-detective + hm-synthesis. |
| 7 | hf-l2-custom-tools-dev | hf | custom-tools, plugins | L2 | create, build, validate | ✅ | ✅ | ✅ | Zod schema-first, plugin lifecycle, CQRS, script rule. |
| 8 | hf-l2-delegation-gates | hf | workflows, permissions | L2 | validate, authorize, gate | ✅ | ✅ | ✅ | 4-gate sequence + 4 boundary checks. Phase 30 guardrails. |
| 9 | hf-l2-meta-builder-core | hf | multi-primitive | ⚠️ L0 (meta l0) | route, classify, navigate | ⚠️ L-mismatch | ✅ | ✅ | 389-line router. "Edit in labs, test via symlinks." Max 3 skills per stack. |
| 10 | hf-l2-naming-syndicate | hf | governance | L2 | validate, verify | ✅ | ✅ | ❌ | Validates all prefix rules. Machine-verifiable. No references/ dir. |
| 11 | hf-l2-skill-router | hf | routing | L2 | route, classify, map | ✅ | ✅ | ✅ | 8 domains, max 3 skills/bundle. FLEXIBLE cross-routing to hm-*. |
| 12 | hf-l2-skill-synthesis | hf | skills, evals | ⚠️ L3 (meta l3) | synthesize, classify, scaffold | ⚠️ L-mismatch | ✅ | ✅ | INGEST→CLASSIFY→SCAFFOLD→VALIDATE. >=3 evals, >=20 triggers. Iron Law: "No skill without evals." |
| 13 | hf-l2-use-authoring-skills | hf | skills | L2 | create, audit, doctor, refactor, score | ✅ | ✅ | ✅ | Comprehensive authoring. Iron Law: "No skill without trigger phrases." |
| 14 | opencode-config-workflow | unprefixed | multi-primitive | L2 | configure, setup, batch | ✅ (intentional) | ✅ | ❌ | 8-turn workflow. Framework-agnostic. Uses configure-primitive. 196 lines inline. |
| 15 | hm-l3-opencode-project-audit | hm | multi-primitive | L3 | audit, verify, map | ✅ | ✅ | ✅ | 7-phase parallel audit. Iron Law: "Audit reports facts. Never blocks. Never fixes." |
| 16 | hm-l2-spec-driven-authoring | hm | specifications | L2 | derive, lock, validate | ✅ | ✅ | ✅ | Source Audit→Ambiguity Gate→Requirement Table→Acceptance Matrix→Handoff. |
| 17 | hm-l2-refactor | hm | code | L2 | decide, plan, scope | ✅ | ✅ | ✅ | Surgical vs structural. Iron Law: "Refactoring without tests is restructuring." |

---

## Part B: Global Skills (third-party, orphan, Superpowers) — 15 skills

Source: `/Users/apple/.agents/skills/`

### Global Skills Classification

| # | Skill Name | Lineage | Primitive Type | Teaches | Triggers | ProgDisc | Key Notes |
|---|---|---|---|---|---|---|---|
| 1 | Agent Development | Third-party (CC plugin) | agents | create, validate | ✅ 9 phrases | ✅ | CC plugin format. YAML frontmatter. 415 lines. NOT OpenCode-native. |
| 2 | Command Development | Third-party (CC plugin) | commands | create, validate | ✅ 9 phrases | ✅ | CC slash commands. CLAUDE_PLUGIN_ROOT, allowed-tools. 834 lines. NOT OpenCode-native. |
| 3 | Skill Development | Third-party (CC plugin) | skills | create, validate | ✅ 5 phrases | ✅ | CC plugin skills. 637 lines. |
| 4 | create-skill | Third-party/Orphan (GSD) | skills | create, audit, upgrade | ⚠️ Implicit | ✅ | XML structure, router pattern. 186 lines. |
| 5 | skill-creator | Third-party/Orphan (Anthropic) | skills | create, evaluate, iterate | ⚠️ Implicit | ✅ | Official Anthropic. TDD: draft→test→evaluate→iterate. Evals framework. 485 lines. |
| 6 | skill-judge | Third-party/Orphan | skills | audit, evaluate, score | ⚠️ Implicit | ❌ | 8-dimension scoring (120 pts). 752 lines. |
| 7 | writing-skills | Third-party (Superpowers) | skills | create, edit, verify | ⚠️ Implicit | ✅ | TDD for skills. RED-GREEN-REFACTOR. CSO. 655 lines. |
| 8 | find-skills | Third-party | skills | discover, install | ✅ 4 phrases | ❌ | Uses npx skills CLI. 142 lines. |
| 9 | create-gsd-extension | Third-party (GSD) | extensions | create, debug | ✅ 8 phrases | ✅ | GSD extensions. TypeScript. Uses pi-ai, TypeBox. 89 lines. |
| 10 | create-workflow | Third-party (GSD) | workflows | create | ✅ 6 phrases | ✅ | GSD YAML workflow definitions. V1 schema. 130 lines. |
| 11 | create-mcp-server | Third-party (GSD) | MCP servers | create, test, evaluate | ✅ 5 phrases | ❌ | 6-step MCP server authoring. 121 lines. |
| 12 | create-agentsmd | Third-party/Orphan | AGENTS.md | create (generate) | ❌ None | ❌ | Template-based AGENTS.md generator. 249 lines. |
| 13 | agent-md-refactor | Third-party | AGENTS.md | refactor | ✅ 7 phrases | ❌ | 5-phase refactor for agent instruction files. 287 lines. |
| 14 | agent-orchestrator | Third-party | orchestration | orchestrate, coordinate | ❌ None | ❌ | Phase-gated multi-agent loop. 94 lines. |
| 15 | dispatching-parallel-agents | Third-party (Superpowers) | dispatch | dispatch, coordinate | ⚠️ Vague | ❌ | Parallel agent dispatch pattern. 182 lines. |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total skills inventoried | 32 |
| hf-* lineage (project) | 13 |
| hm-* lineage (project) | 3 |
| Unprefixed (project) | 1 |
| Third-party (global) | 9 |
| Third-party/Orphan | 4 |
| Superpowers (global) | 2 |
| Skills with progressive disclosure | 25 |
| Skills without progressive disclosure | 7 |
| Skills with explicit trigger phrases | 25 |
| Skills with implicit/vague/no triggers | 7 |
| L-level mismatches detected | 3 |

## L-Level Issues

| Skill | Filename | Metadata Layer | Resolution |
|-------|----------|---------------|------------|
| hf-l2-meta-builder-core | L2 | L0 (role: router) | Rename to hf-l0-meta-builder-core |
| hf-l2-command-parser | L2 | L3 | Rename to hf-l3-command-parser |
| hf-l2-skill-synthesis | L2 | L3 | Rename to hf-l3-skill-synthesis |

## Primitive Type Distribution

| Primitive Type | Count | Skills |
|---------------|-------|--------|
| Skills (authoring/evaluating) | 8 | hf-skill-synthesis, hf-skill-router, hf-use-authoring-skills, create-skill, skill-creator, skill-judge, writing-skills, find-skills |
| Agents | 4 | hf-agent-composition, hf-agents-and-subagents-dev, Agent Dev, agent-md-refactor |
| Commands | 3 | hf-command-dev, hf-command-parser, Command Dev |
| Custom Tools/Plugins | 1 | hf-custom-tools-dev |
| Multi-primitive (routing/auditing) | 4 | hf-meta-builder-core, opencode-config-workflow, hm-opencode-project-audit, create-gsd-extension |
| Workflows/Orchestration | 4 | hf-delegation-gates, hf-context-absorb, create-workflow, agent-orchestrator |
| MCP Servers | 1 | create-mcp-server |
| Governance/Naming | 2 | hf-naming-syndicate, hf-agents-md-sync |
| Docs/AGENTS.md | 1 | create-agentsmd |
| Specifications | 1 | hm-spec-driven-authoring |
| Refactoring | 2 | hm-refactor, agent-md-refactor |
| Dispatch/Coordination | 1 | dispatching-parallel-agents |

## Action/Teach Distribution

| Action | Count |
|--------|-------|
| create / compose / build | 17 |
| audit / verify / validate | 8 |
| route / classify / dispatch | 4 |
| parse / extract | 1 |
| absorb / synthesize | 1 |
| sync / doctor / fix | 1 |
| orchestrate / coordinate | 1 |
| evaluate / score / benchmark | 2 |

---

**Evidence:** All 32 skill files verified via read operations on 2026-05-10. Classifications extracted from SKILL.md frontmatter and description sections.
