# Skill Lineage Groups

**Generated:** 2026-05-10 | **Coordinator:** hm-l1-coordinator | **Total:** 32 skills

---

## Group 1: hf-* Lineage (FLEXIBLE) — 13 skills

All under `/Users/apple/hivemind-plugin-private/.opencode/skills/`

### By Primitive Type

#### Agents
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-agent-composition | L2 | compose, design | XML grammar, step protocols, structured returns |
| hf-l2-agents-and-subagents-dev | L2 | create, configure, delegate | WaiterModel, worktree isolation, fork sessions |

#### Commands
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-command-dev | L2 | create, update, validate | CI=true shell safety, YAML frontmatter, $ARGUMENTS, subtask |
| hf-l2-command-parser | ⚠️ L3 | parse, validate | $ARGUMENT propositional parsing, 5-step procedure |

#### Custom Tools / Plugins
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-custom-tools-dev | L2 | create, build, validate | Zod schema-first, plugin lifecycle, CQRS |

#### Skills
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-use-authoring-skills | L2 | create, audit, doctor, refactor, score | Iron Law: trigger phrases required |
| hf-l2-skill-synthesis | ⚠️ L3 | synthesize, classify, scaffold | INGEST→CLASSIFY→SCAFFOLD→VALIDATE |
| hf-l2-skill-router | L2 | route, classify, map | 8 domains, max 3 per bundle, FLEXIBLE cross-routing |

#### Routing & Workflows
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-meta-builder-core | ⚠️ L0 | route, classify, navigate | 389-line router, "Edit in labs, test via symlinks" |
| hf-l2-delegation-gates | L2 | validate, authorize, gate | 4-gate sequence + 4 boundary checks |
| hf-l2-context-absorb | L2 | absorb, append, synthesize | 5-wave swarm protocol |

#### Governance
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| hf-l2-naming-syndicate | L2 | validate, verify | No references/ dir |
| hf-l2-agents-md-sync | L2 | sync, doctor, fix | Scan→Diff→Apply |

---

## Group 2: hm-* Lineage (STRICT) — 3 skills

| Skill | Primitive | L-Level | Teaches | Notes |
|-------|----------|---------|---------|-------|
| hm-l3-opencode-project-audit | multi-primitive | L3 | audit, verify, map | 7-phase parallel audit. Iron Law: "Never blocks. Never fixes." |
| hm-l2-spec-driven-authoring | specifications | L2 | derive, lock, validate | Source Audit→Ambiguity Gate→Requirement Table |
| hm-l2-refactor | code | L2 | decide, plan, scope | Surgical vs structural. Iron Law: "Refactoring without tests is restructuring." |

---

## Group 3: Unprefixed (Framework-Agnostic) — 1 skill

| Skill | Primitive | Teaches | Notes |
|-------|----------|---------|-------|
| opencode-config-workflow | multi-primitive | configure, setup, batch | 8-turn workflow. No references/. Intentional unprefix per naming syndicate. |

---

## Group 4: Third-Party — Claude Code Plugin Skills — 3 skills

Location: `/Users/apple/.agents/skills/`

| Skill | Primitive | Teaches | Notes |
|-------|----------|---------|-------|
| Agent Development | agents | create, validate | CC plugin format. 415 lines. NOT OpenCode-native. |
| Command Development | commands | create, validate | CC slash commands. 834 lines. NOT OpenCode-native. |
| Skill Development | skills | create, validate | CC plugin skills. 637 lines. NOT OpenCode-native. |

**Critical Gap:** No OpenCode-native equivalents of this triad exist in the global ecosystem.

---

## Group 5: Third-Party — GSD Ecosystem — 3 skills

| Skill | Teaches |
|-------|---------|
| create-gsd-extension | GSD TypeScript extensions |
| create-workflow | GSD YAML workflow definitions |
| create-mcp-server | 6-step MCP server authoring |

**Note:** Not shipped with Hivemind harness — project-internal build tools.

---

## Group 6: Third-Party/Orphan — Skill Meta-Skills — 4 skills

| Skill | Teaches |
|-------|---------|
| create-skill | GSD skill builder (XML) |
| skill-creator | Official Anthropic TDD skill creator |
| skill-judge | 8-dimension scoring (120 pts) |
| writing-skills | Superpowers TDD for skills |

---

## Group 7: Third-Party/Orphan — Docs & Coordination — 5 skills

| Skill | Teaches |
|-------|---------|
| find-skills | npx skills CLI |
| create-agentsmd | AGENTS.md template generator |
| agent-md-refactor | 5-phase AGENTS.md refactor |
| agent-orchestrator | Phase-gated multi-agent loop |
| dispatching-parallel-agents | Superpowers parallel dispatch pattern |

---

## Cross-Lineage Loading (FLEXIBLE hf-* skills loading hm-*)

| hf-* Skill | hm-* Skills Loaded |
|-----------|-------------------|
| hf-context-absorb | hm-detective, hm-synthesis, hm-deep-research |
| hf-skill-router | hm-gate-orchestrator |
| hf-use-authoring-skills | hm-spec-driven-authoring, hm-test-driven-execution |
| hf-custom-tools-dev | hm-tech-context-compliance |
| hf-command-dev | hm-opencode-non-interactive-shell |

## Orphan/Unbound Skills (no agent integration contract)

opencode-config-workflow, create-skill, skill-creator, skill-judge, writing-skills, find-skills, create-agentsmd, agent-md-refactor, agent-orchestrator, dispatching-parallel-agents

## Remediation Priorities

**HIGH:** Create OpenCode-native command-development + agent-development skills. Fix 3 L-level mismatches.
**MEDIUM:** Add progressive disclosure to naming-syndicate, opencode-config-workflow. Add trigger phrases to 3 skills. Document command stacking/chaining.
**LOW:** Add integration contracts for orphans. Deduplicate trigger phrases. Create cross-lineage reference map.
