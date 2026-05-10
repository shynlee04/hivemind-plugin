# PRD-01: HiveMind V3 Platform Harness

**Status:** Draft
**Version:** 2.0
**Date Created:** 2026-04-03
**Last Updated:** 2026-04-04
**Author:** Coordinator Agent
**SYS-Ready Score:** Target >=90%

**Document Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-03 | Coordinator | Initial draft — skill ecosystem only |
| 2.0 | 2026-04-04 | Coordinator | Expanded to full platform harness scope |

---

## 2. Executive Summary

HiveMind V3 is a complete runtime framework for building, composing, and executing AI agent meta-concepts on OpenCode. It covers agents, commands, permissions, tools, hooks, plugins, configs, rules, MCP/LSP servers, a centralized CLI substrate, eval harness, and a runtime composition engine. The project is NOT a collection of static `.md` skill files — it is build-on-demand infrastructure where agents call agents to compose prompts, parse commands, and build configurations dynamically at runtime.

This PRD defines the product requirements for the full harness, synthesizing validated patterns from the oh-my-openagent runtime (background agents, auto-loop, delegation chains, task queuing, category system, session recovery) and the GSD CLI architecture (centralized Node.js router with domain modules).

---

## 3. Problem Statement

**Current State:** The harness-experiment repo contains 5 skill packs with strong enforcement gates, a 56-flaw audit, and an eval harness — but it is organized as a skill-pack-only project. It lacks a CLI substrate, runtime composition engine, background execution, category presets, and dual-packaging distribution. The PRD was scoped too narrowly (skills only, not the full platform).

**Business Impact:** Without the full platform harness, HiveMind cannot serve as a superior alternative to either GSD (which has a CLI substrate) or oh-my-openagent (which has runtime features like background agents and category presets).

**Opportunity:** Transform the validated skill enforcement foundation into a complete runtime framework that surpasses both predecessors.

---

## 4. Target Audience & User Personas

| Persona | Role | Primary Needs |
|---------|------|---------------|
| **Platform Engineer** | Primary | Configure agents, tools, plugins, permissions for team projects |
| **Skill Author** | Secondary | Create, audit, and improve skills with TDD workflows |
| **DevOps Engineer** | Secondary | CLI-driven automation, eval harness, CI/CD integration |
| **Team Lead** | Secondary | Multi-agent workflows, category presets, session recovery |
| **New User** | Primary | Guided onboarding via natural language configuration |

---

## 5. Success Metrics (KPIs)

| KPI | Target | Measurement |
|-----|--------|-------------|
| Skill trigger accuracy | >95% positive, <5% false positive | Eval harness |
| Routing correctness | 100% clear intent, >80% ambiguous | preflight.sh eval |
| End-to-end chain success | >90% for LAYER 0→4 | Chain eval |
| CLI command coverage | 100% of domain modules exposed | CLI test suite |
| Eval pass rate | >95% across all packs | Eval harness |
| Runtime composition latency | <500ms p95 for prompt assembly | Timing benchmarks |
| Package install success | Zero errors on npm install + npx | CI smoke test |

---

## 6. Goals & Objectives

**Primary:** Deliver a complete platform harness that is measurably superior to both GSD and oh-my-openagent across CLI substrate, runtime features, eval quality, and OpenCode concept coverage.

**Objectives:**
1. Build centralized CLI router with 6 domain modules
2. Implement runtime build-on-demand composition engine
3. Port runtime features from oh-my-openagent (background agents, auto-loop, delegation, categories, session recovery)
4. Achieve >95% eval pass rate across the full ecosystem
5. Dual-packaging distribution (npm SDK + npx git-based)

---

## 7. Scope & Requirements

### Feature Matrix

| Feature | Priority | Description |
|---------|----------|-------------|
| **F01: Agent Authoring** | P0 | Primary/subagent creation, permission patterns, model selection |
| **F02: Command Authoring** | P0 | Markdown/JSON commands, $ARGUMENTS, shell injection |
| **F03: Permission Authoring** | P0 | Granular rules, wildcards, agent overrides |
| **F04: Skill Authoring** | P0 | Cross-concept stacking, TDD workflows |
| **F05: Custom Tool Authoring** | P0 | tool() helper, Zod schemas, factory functions |
| **F06: Hook Authoring** | P1 | Lifecycle hooks, read-only enforcement |
| **F07: Plugin Assembly** | P1 | <100 LOC assembly, npm packaging |
| **F08: Config Authoring** | P1 | opencode.json, variable substitution, precedence |
| **F09: Rule Authoring** | P1 | AGENTS.md patterns, custom instructions |
| **F10: MCP Server Authoring** | P2 | Local/remote servers, OAuth, per-agent enablement |
| **F11: LSP Server Authoring** | P2 | Custom LSP config, env vars |
| **F12: Migration Workflow** | P0 | Feature flags, rollback, parallel implementations |
| **F13: Boundary Enforcement** | P1 | Executable scripts for LOC, circular deps, tool count |
| **F14: Cross-Concept Stacking** | P0 | Max 3 skills, conflict detection |
| **F15: Eval & QA Ecosystem** | P1 | Module evals, integration tests, regression |
| **F16: TypeScript Module Authoring** | P0 | 500 LOC limits, CQRS, import boundaries |
| **F17: CLI Substrate** | P0 | bin/hivemind-tools.cjs + bin/lib/ domain modules (--raw, --cwd, --pick flags) |
| **F18: Runtime Composition Engine** | P0 | Build-on-demand: compose prompts, parse commands, assemble meta-concepts at execution time |
| **F19: Background Agent Execution** | P1 | Run agents in background, retrieve results when ready |
| **F20: Category System** | P1 | Domain-specific agent presets (visual-engineering, deep, quick, ultrabrain) |
| **F21: Session Recovery** | P1 | Auto-recovery from tool failures, context overflow, empty messages |
| **F22: Dual Packaging** | P0 | npm SDK (@hivemind/hivemind-plugin) + npx git-based skill installs |

### Out of Scope

- OpenCode core platform development
- LLM model training or fine-tuning
- UI/UX design for OpenCode TUI

### Dependencies

- OpenCode platform v1.1.1+
- Node.js/Bun runtime environment
- Existing 5 skill packs as foundation

---

## 8. User Stories

| ID | Role | Summary | Acceptance |
|----|------|---------|------------|
| US-01 | Platform Engineer | Create agent with restricted permissions | Agent created with ask rules; eval confirms |
| US-02 | Skill Author | Convert markdown command into skill pack | SKILL.md + references + evals generated |
| US-03 | DevOps Engineer | Run eval harness from CLI | `hivemind-tools eval run` produces benchmark |
| US-04 | Team Lead | Configure MCP per-agent | MCP enabled for specific agents only |
| US-05 | New User | Guided first-project setup | Meta-builder routes to guided workflow |
| US-06 | Platform Engineer | Create TypeScript tool with Zod validation | Tool passes type checks and runtime tests |
| US-07 | DevOps Engineer | Install via npm and git | Both install paths work without errors |

---

## 9. Functional Requirements

### 9.1 CLI Substrate (F17)

| ID | Description | Priority |
|----|-------------|----------|
| FR-17.01 | Central router: bin/hivemind-tools.cjs dispatches to domain modules | P0 |
| FR-17.02 | Domain modules: core, state, skill, eval, scaffold, config | P0 |
| FR-17.03 | CLI flags: --raw (JSON), --cwd (sandbox), --pick (field extraction) | P0 |
| FR-17.04 | `hivemind-tools eval run` executes eval harness | P1 |

### 9.2 Runtime Composition (F18)

| ID | Description | Priority |
|----|-------------|----------|
| FR-18.01 | Compose prompts from template fragments + context at execution time | P0 |
| FR-18.02 | Parse commands dynamically via CLI router | P0 |
| FR-18.03 | Assemble meta-concepts (agents calling agents) at runtime | P0 |
| FR-18.04 | Clean context windows: load SKILL.md + dependency summaries + relevant snippets only | P0 |

### 9.3 Runtime Features (F19-F21)

| ID | Description | Priority |
|----|-------------|----------|
| FR-19.01 | Background agent execution with result retrieval | P1 |
| FR-20.01 | Category presets for domain-specific agent configurations | P1 |
| FR-21.01 | Auto-recovery from tool failures, context overflow, empty messages | P1 |
| FR-21.02 | Task persistence across sessions via planning triplet | P0 |

### 9.4 Specialist Authoring (F01-F11)

| ID | Description | Priority |
|----|-------------|----------|
| FR-02.01 | Agent, command, permission, tool, hook authoring skills | P0 |
| FR-02.02 | Plugin assembly, config, rule authoring skills | P1 |
| FR-02.03 | MCP/LSP server authoring skills | P2 |

### 9.5 Quality & Distribution (F15, F22)

| ID | Description | Priority |
|----|-------------|----------|
| FR-15.01 | Eval harness with 8+ test cases per skill | P1 |
| FR-22.01 | npm package with bin field, peerDependencies | P0 |
| FR-22.02 | npx git-based skill install (`npx skills add owner/repo --skill name`) | P0 |

---

## 10. Customer-Facing Messaging

**HiveMind V3** is the complete platform harness that transforms natural language into OpenCode configurations — with runtime build-on-demand, CLI automation, and enforced quality gates.

**Themes:**
1. "Configure OpenCode with conversation, not configuration files"
2. "Runtime composition, not static definitions"
3. "Enforced by scripts, not suggestions"
4. "CLI-first automation for every platform concept"

---

## 11. Acceptance Criteria

- [ ] All 22 features (F01-F22) implemented and tested
- [ ] CLI substrate passes all command tests
- [ ] Eval harness pass rate >95%
- [ ] Chain eval passes for LAYER 0→4
- [ ] Both npm and git install paths work
- [ ] Runtime composition engine assembles prompts in <500ms p95

---

## 12. Constraints

| Constraint | Value |
|------------|-------|
| OpenCode version | >=1.1.1 |
| Module LOC | <=500 per file |
| Plugin entry LOC | <100 |
| Skills per stack | <=3 |
| SKILL.md | <=500 lines |
| Runtime composition latency | <500ms p95 |
| Eval pass rate | >=95% |
| Distribution | npm + git dual |

---

## 13. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Runtime composition exceeds latency target | Medium | Medium | Profile early; cache composed prompts |
| CLI substrate scope creep | High | Medium | Strict 6-module limit; no ad-hoc commands |
| oh-my-openagent feature port breaks patterns | Medium | High | Port one feature at a time with eval validation |
| Eval harness doesn't catch real-world failures | Medium | Medium | Behavior-based assertions + end-to-end chain tests |

---

## 14. Success Definition

**Go-Live Criteria:**
- All 22 features implemented
- >95% eval pass rate
- CLI substrate operational
- Both packaging paths validated

**Active Plan:** `.skills-lab/task_plan.md` — 6-phase implementation plan.

---

## 15. Stakeholders

| Role | Responsibility |
|------|---------------|
| Coordinator Agent | Plan, delegate, verify |
| Builder Subagents | Implement features |
| Eval Harness | Automated validation |
| HiveMind Architecture Team | Architecture decisions |

---

## 16. Implementation Approach

See `.skills-lab/task_plan.md` for the active 6-phase plan. This PRD defines WHAT; the task plan defines HOW.

**Phase Summary:**
1. Foundation Reset — AGENTS.md, PRD, archive
2. CLI Substrate — Central router + domain modules
3. Runtime Composition Engine — Build-on-demand
4. Category System + Session Recovery
5. Eval Harness + Dual Packaging
6. Selective Migration

---

## 17. References

- `.skills-lab/task_plan.md` — Active 6-phase plan
- `docs/draft/architecture-proposal-hivemind-v3.md` — V3 architecture
- `.skills-lab/findings.md` — Locked decisions
- `AGENTS.md` — Project governance

---

## Cross-Linking Tags

@discoverability: architecture-proposal-hivemind-v3.md
@discoverability: task_plan.md
