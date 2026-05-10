# Skill Lineage Groups

**Generated:** 2026-05-10  
**Coordinator:** hm-l1-coordinator  
**Total Skills Grouped:** 32

---

## Group 1: hf-* Lineage (FLEXIBLE) — 13 skills

All located under `/Users/apple/hivemind-plugin-private/.opencode/skills/`

### By Primitive Type

#### Agents (2)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-agent-composition** | L2 | compose, design | XML markup grammar, step protocols, structured returns |
| **hf-l2-agents-and-subagents-dev** | L2 | create, configure, delegate | OpenCode agent architecture, WaiterModel, worktree isolation |

#### Commands (2)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-command-dev** | L2 | create, update, validate | CI=true shell safety, YAML frontmatter, $ARGUMENTS, subtask |
| **hf-l2-command-parser** | ⚠️ L3 (mismatch) | parse, validate | $ARGUMENT propositional parsing, 5-step procedure |

#### Custom Tools / Plugins (1)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-custom-tools-dev** | L2 | create, build, validate | Zod schema-first, plugin lifecycle, CQRS boundaries |

#### Skills — Authoring & Synthesis (3)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-use-authoring-skills** | L2 | create, audit, doctor, refactor, score | Comprehensive authoring. Iron Law: trigger phrases required |
| **hf-l2-skill-synthesis** | ⚠️ L3 (mismatch) | synthesize, classify, scaffold | INGEST→CLASSIFY→SCAFFOLD→VALIDATE from GitHub repos |
| **hf-l2-skill-router** | L2 | route, classify, map | Maps domains to hf-* bundles, 8 domains, max 3 per bundle |

#### Routing & Coordination (1)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-meta-builder-core** | ⚠️ L0 (mismatch) | route, classify, navigate | 389-line router, "Edit in labs, test via symlinks" |

#### Workflows & Gates (2)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-delegation-gates** | L2 | validate, authorize, gate | 4-gate sequence + 4 boundary checks |
| **hf-l2-context-absorb** | L2 | absorb, append, synthesize | 5-wave swarm protocol for session context |

#### Governance (2)
| Skill | L-Level | Teaches | Notes |
|-------|---------|---------|-------|
| **hf-l2-naming-syndicate** | L2 | validate, verify | Validates hm-*/hf-*/gate-*/stack-* prefixes. ❌ No references/ |
| **hf-l2-agents-md-sync** | L2 | sync, doctor, fix | Scan→Diff→Apply for AGENTS.md drift detection |

---

## Group 2: hm-* Lineage (STRICT) — 3 skills

All located under `/Users/apple/hivemind-plugin-private/.opencode/skills/`

| Skill | Primitive Type | L-Level | Teaches | Notes |
|-------|---------------|---------|---------|-------|
| **hm-l3-opencode-project-audit** | agents, skills, commands, tools, permissions | L3 | audit, verify, map | 7-phase parallel audit. Iron Law: "Never blocks. Never fixes." |
| **hm-l2-spec-driven-authoring** | specifications, requirements | L2 | derive, lock, validate | PRD→spec→acceptance criteria. Source Audit→Ambiguity Gate. |
| **hm-l2-refactor** | code | L2 | decide, plan, scope | Surgical vs. structural refactoring with gated protocol. |

**Note:** hm-* skills are product-development lineage — they teach HOW to build the product using established methodologies, not HOW to author OpenCode primitives. These three were included because they are "dev-adjacent" (teach development workflows relevant to meta-concept creation).

---

## Group 3: Unprefixed (Framework-Agnostic) — 1 skill

Located under `/Users/apple/hivemind-plugin-private/.opencode/skills/`

| Skill | Primitive Type | Teaches | Notes |
|-------|---------------|---------|-------|
| **opencode-config-workflow** | agents, commands, skills | configure, setup, batch | 8-turn configuration: Discover→Investigate→Collect→Proposal→Validate→Compile→Test→Save. Framework-agnostic. ❌ No references/. |

**Note:** Intentionally unprefixed per the naming syndicate taxonomy for framework-agnostic skills. Coexists with GSD, BMAD, Speckit.

---

## Group 4: Third-Party — Claude Code Plugin Skills — 3 skills

Located under `/Users/apple/.agents/skills/`

| Skill | Primitive Type | Teaches | Notes |
|-------|---------------|---------|-------|
| **Agent Development** | agents | create, validate | Claude Code plugin agent format. YAML frontmatter. 415 lines. **NOT OpenCode-native.** |
| **Command Development** | commands | create, validate | Claude Code slash commands. `CLAUDE_PLUGIN_ROOT`, `allowed-tools`. 834 lines. **NOT OpenCode-native.** |
| **Skill Development** | skills | create, validate | Claude Code plugin skills. 637 lines. **NOT OpenCode-native.** |

**Critical Gap:** These three skills form the canonical "how to build primitives" triad for Claude Code, but they teach Claude Code's plugin format. OpenCode has different APIs (permission system vs. allowed-tools, `@opencode-ai/plugin` SDK vs. Claude Code plugin hooks). No OpenCode-native equivalents of these three exist in the global ecosystem.

---

## Group 5: Third-Party — GSD Ecosystem Skills — 3 skills

Located under `/Users/apple/.agents/skills/`

| Skill | Primitive Type | Teaches | Notes |
|-------|---------------|---------|-------|
| **create-gsd-extension** | extensions, tools, commands | create, debug | GSD TypeScript extension modules. Uses pi-ai, TypeBox. 89 lines. |
| **create-workflow** | workflows | create | GSD YAML workflow definitions. V1 schema. 130 lines. |
| **create-mcp-server** | MCP servers | create, test, evaluate | 6-step MCP server authoring. 121 lines. |

**Note:** GSD-specific tools are NOT shipped with the Hivemind harness. They are project-internal build tools.

---

## Group 6: Third-Party/Orphan — Skill Authoring Meta-Skills — 4 skills

Located under `/Users/apple/.agents/skills/`

| Skill | Primitive Type | Teaches | Notes |
|-------|---------------|---------|-------|
| **create-skill** | skills | create, audit, verify, upgrade | GSD skill builder. XML structure. Router pattern. |
| **skill-creator** | skills | create, evaluate, iterate, benchmark | Official Anthropic. TDD approach. Evals framework. |
| **skill-judge** | skills | audit, evaluate, score | 8-dimension scoring (120 pts). 752 lines. |
| **writing-skills** | skills | create, edit, verify | Superpowers TDD. RED-GREEN-REFACTOR. CSO. |

---

## Group 7: Third-Party/Orphan — Documentation & Coordination — 5 skills

Located under `/Users/apple/.agents/skills/`

| Skill | Primitive Type | Teaches | Notes |
|-------|---------------|---------|-------|
| **find-skills** | skills | discover, install | `npx skills` CLI. 142 lines. |
| **create-agentsmd** | AGENTS.md | create (generate) | Template-based. 249 lines. ❌ No trigger phrases. |
| **agent-md-refactor** | AGENTS.md, CLAUDE.md | refactor | 5-phase refactor. 287 lines. |
| **agent-orchestrator** | agent orchestration | orchestrate, coordinate | Phase-gated loop. 94 lines. ❌ No trigger phrases. |
| **dispatching-parallel-agents** | agent dispatch | dispatch, coordinate | Superpowers pattern. 182 lines. ⚠️ Vague triggers. |

---

## Cross-Lineage Observations

### Skills That Cross-Load hm-* Skills (FLEXIBLE lineage behavior)

| hf-* Skill | hm-* Skills Loaded | Purpose |
|-----------|-------------------|---------|
| hf-l2-context-absorb | hm-detective, hm-synthesis, hm-deep-research | Context extraction and compression |
| hf-l2-skill-router | hm-gate-orchestrator (for cross-validation) | Gate validation during meta-builder dispatch |
| hf-l2-agent-composition | (may load hm-* for validation) | Cross-validation of agent structure |
| hf-l2-skill-synthesis | hm-synthesis | Compression of synthesized skills |
| hf-l2-use-authoring-skills | hm-spec-driven-authoring, hm-test-driven-execution | Spec-driven skill authoring with TDD validation |
| hf-l2-custom-tools-dev | hm-tech-context-compliance | Stack validation for custom tools |
| hf-l2-command-dev | hm-opencode-non-interactive-shell | Shell safety validation |

### Orphan/Unbound Skills (no agent declares these in integration contracts)

| Skill | Issue |
|-------|-------|
| opencode-config-workflow | Unprefixed — no lineage-based agent binding |
| create-skill | GSD — no hm/hf agent declares loading it |
| skill-creator | Official Anthropic — no integration contract |
| skill-judge | Orphan — no agent binding declared |
| writing-skills | Superpowers — no hm/hf agent binding |
| find-skills | Third-party — no agent binding |
| create-agentsmd | Orphan — no agent binding, no triggers |
| agent-md-refactor | Third-party — no agent binding |
| agent-orchestrator | Third-party — no agent binding, no triggers |
| dispatching-parallel-agents | Superpowers — no agent binding |

---

## Remediation Suggestions

### High Priority
1. **Create OpenCode-native command-development skill** — Port structure from global `Command Development` but align with OpenCode's permission system, subtask flag, JSON/Markdown dual-config paradigm, and `@opencode-ai/plugin` SDK
2. **Create OpenCode-native agent-development skill** — Align with OpenCode agent config (mode: primary|subagent, permission system, steps, hidden, color)
3. **Fix L-level mismatches** in 3 project skills (meta-builder-core → L0, command-parser → L3, skill-synthesis → L3)

### Medium Priority
4. **Add progressive disclosure** to naming-syndicate, opencode-config-workflow
5. **Add trigger phrases** to create-agentsmd, agent-orchestrator, dispatching-parallel-agents
6. **Create OpenCode-native plugin-development skill** — Based on `tool()` helper from `@opencode-ai/plugin` SDK
7. **Document command stacking/chaining patterns** — Not covered in any skill or official docs

### Low Priority
8. **Add integration contracts** for orphan/unbound skills
9. **Audit and deduplicate trigger phrases** across overlapping skills
10. **Create cross-lineage reference map** showing which global skills cover which OpenCode primitive types

---

**Evidence chains:** All lineage classifications backed by file reads of SKILL.md frontmatter. Cross-lineage loading data from skill body references to hm-* skill names. Integration contract data from `hm-l3-integration-contracts` reference.
