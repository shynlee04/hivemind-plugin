---
phase: AS-2
plan: lineage-classification-schema-design
workstream: agent-synthesis
status: COMPLETE
created: 2026-04-29
author: gsd-executor
depends_on:
  - AS-1 (AGENT-ARCHITECTURE-SYNTHESIS.md)
requirements:
  - D-AD-01
  - D-AD-02
  - D-AD-04
  - AQUAL-01
  - AQUAL-03
  - AQUAL-04
  - AQUAL-05
  - AQUAL-08
---

# Lineage Classification Schema

> **AS-2 Deliverable** — Formal 2-lineage taxonomy (hm-*, hf-*), YAML frontmatter schema extending schema-kernel, depth level definitions (L0/L1/L2), permission model templates, domain routing rules, frontmatter validation rules, and 59-agent migration map. This is the definitive schema that all subsequent agent authoring phases (AS-3 through AS-11) follow.

---

## 1. YAML Frontmatter Schema

### 1.1 Required Fields

Every hm-* and hf-* agent MUST declare these fields in its YAML frontmatter. The schema extends the base `AgentFrontmatterSchema` from `src/schema-kernel/agent-frontmatter.schema.ts` with Hivemind-specific fields.

| # | Field | Type | Constraint | Example |
|---|-------|------|------------|---------|
| 1 | `name` | `string` | Pattern: `<lineage>-<domain>-<role>` (lowercase alphanumeric, single hyphens, 1–64 chars). Must start with `hm-` or `hf-`. | `hm-research-detective`, `hf-agent-builder` |
| 2 | `description` | `string` | 10–200 chars. One sentence describing what this agent does, what spawns it, and its boundaries. Ends with period. | `"Terminal repository investigator for read-only codebase research, evidence collection, and synthesis. Spawned by L1 coordinators. Never mutates files."` |
| 3 | `mode` | `enum` | `primary` or `subagent`. L0 agents are `primary`; L1 and L2 agents are `subagent`. | `subagent` |
| 4 | `temperature` | `float` | Depth-bound: L0 = 0.2–0.3, L1 = 0.1–0.2, L2 = 0.0–0.15. Exception: L2 creative agents (documentation, UI design) may use 0.15–0.25 with justification comment. | `0.05` |
| 5 | `depth` | `enum` | `L0`, `L1`, or `L2`. Immutable after declaration (non-regression rule #3). | `L2` |
| 6 | `lineage` | `enum` | `hm` or `hf`. Immutable after declaration (non-regression rule #4). | `hm` |

### 1.2 Permission Block (Required)

Every agent MUST declare a `permission:` block following the ask-all + explicit allow principle (AS-1 Section 4). The permission block contains:

```yaml
permission:
  # Native OpenCode tools
  read: allow | ask
  edit: allow | ask | { scope: pattern }
  write: allow | ask | { scope: pattern }
  bash: allow | ask | { pattern: value }
  glob: allow | ask
  grep: allow | ask

  # Hivemind custom tools
  task: allow | ask | { pattern: value }
  delegate-task: allow | ask
  delegation-status: allow | ask
  session-journal-export: allow | ask
  prompt-skim: allow | ask
  prompt-analyze: allow | ask
  session-patch: allow | ask

  # Skill loading (ask-all base required)
  skill:
    "*": ask
    "hm-detective": allow
    # ... domain-specific skills
```

### 1.3 Optional Fields

| # | Field | Type | Constraint | Default |
|---|-------|------|------------|---------|
| 7 | `tools` | `string[]` | Array of native tool names allowed. Prefer `permission:` block for granular control. This field is for backward compatibility only. | `undefined` |
| 8 | `skills` | `string[]` | Array of skill names this agent may load. Must be lineage-scoped (hm agents → hm + gate + stack; hf agents → hf + hm + gate + stack). Every entry must resolve to an existing `.opencode/skills/<name>/SKILL.md`. | `[]` |
| 9 | `domain` | `string` | For hm-*: one of 11 categories (Research, Planning, Implementation, Quality, Domain, Documentation, Phase Lifecycle, Audit, UI, Intelligence, Debug). For hf-*: one of 7 categories (Orchestration, Agent Building, Command Building, Skill Authoring, Tool Building, Context/Audit, Prompt Engineering). | `undefined` |
| 10 | `instruction` | `string[]` | Array of file paths to load as supplemental instructions (e.g., project rules). | `[]` |
| 11 | `model` | `string` | Provider/model-id for this agent. Inherits from parent/runtime if unset. | `undefined` |
| 12 | `color` | `string` | Display color: hex (#RGB, #RRGGBB) or theme name. Inherits from OpenCode base schema. | `undefined` |
| 13 | `steps` | `integer` | Max agentic iteration steps (OpenCode base field). | `undefined` |

### 1.4 Zod Schema Extension (Pseudocode)

The existing `AgentFrontmatterSchema` in `src/schema-kernel/agent-frontmatter.schema.ts` must be extended with:

```typescript
// Hivemind lineage enum
export const LineageEnum = z.enum(["hm", "hf"])
export type Lineage = z.infer<typeof LineageEnum>

// Hivemind depth enum
export const DepthEnum = z.enum(["L0", "L1", "L2"])
export type Depth = z.infer<typeof DepthEnum>

// Agent name with lineage prefix
export const AgentNameWithLineageSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^(hm|hf)-[a-z0-9]+(-[a-z0-9]+)*$/,
    "Agent name must start with lineage prefix (hm- or hf-) followed by lowercase alphanumeric with single hyphen separators",
  )
  .refine(
    (name) => {
      // Must have at least 2 segments after prefix: <lineage>-<domain>-<role>
      const parts = name.split("-")
      return parts.length >= 3
    },
    { message: "Agent name must follow pattern: <lineage>-<domain>-<role> (minimum 3 segments)" },
  )

// Temperature by depth validation
export const TemperatureByDepthSchema = z.number().min(0).max(2).refine(
  (temp, ctx) => {
    // Depth context must be provided via superRefine or external validation
    // This is a placeholder — real validation merges depth + temperature
    return true
  },
)

// Permission arrays
export const PermissionArraySchema = z.array(z.string()).default([])

// Hivemind agent frontmatter extension
export const HivemindAgentFrontmatterSchema = AgentFrontmatterSchema.extend({
  name: AgentNameWithLineageSchema,
  mode: z.enum(["primary", "subagent"]),   // Narrower than OpenCode base "all"
  depth: DepthEnum,
  lineage: LineageEnum,
  skills: z.array(z.string()).default([]),
  domain: z.string().optional(),
  instruction: z.array(z.string()).default([]),
  permission: z.object({
    read: z.union([z.enum(["allow", "ask"]), z.record(z.string())]),
    edit: z.union([z.enum(["allow", "ask"]), z.record(z.string())]),
    write: z.union([z.enum(["allow", "ask"]), z.record(z.string())]),
    bash: z.union([z.enum(["allow", "ask"]), z.record(z.string())]),
    glob: z.enum(["allow", "ask"]),
    grep: z.enum(["allow", "ask"]),
    task: z.union([z.enum(["allow", "ask"]), z.record(z.string())]),
    delegate-task: z.enum(["allow", "ask"]),
    delegation-status: z.enum(["allow", "ask"]),
    session-journal-export: z.enum(["allow", "ask"]),
    prompt-skim: z.enum(["allow", "ask"]),
    prompt-analyze: z.enum(["allow", "ask"]),
    session-patch: z.enum(["allow", "ask"]),
    skill: z.record(z.enum(["allow", "ask"])),
  }),
}).strict()
```

### 1.5 Example Frontmatters (6 Combinations)

#### hm-L0: Orchestrator

```yaml
---
name: hm-orchestrator
description: "Front-facing session orchestrator. Routes user intent to L1 coordinators, enforces workflow gates, and validates phase completion. Never implements or delegates to L2 directly."
mode: primary
temperature: 0.25
depth: L0
lineage: hm
domain: Phase Lifecycle
skills:
  - hm-coordinating-loop
  - hm-phase-loop
  - hm-user-intent-interactive-loop
  - gate-lifecycle-integration
  - gate-spec-compliance
  - gate-evidence-truth
instruction:
  - .opencode/rules/universal-rules.md
  - AGENTS.md
color: blue
steps: 100
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
  glob: allow
  grep: allow
  task:
    "*": allow
    "L2-*": ask
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: allow
  prompt-analyze: allow
  session-patch: ask
  skill:
    "*": ask
    "hm-*": allow
    "gate-*": allow
    "stack-*": allow
    "hf-*": ask
---
```

#### hm-L1: Coordinator

```yaml
---
name: hm-coordinator
description: "Delegation coordinator for wave-based execution. Dispatches L2 specialists for parallel tasks, manages checkpoint gates, and collects structured results. Spawned by L0 orchestrator."
mode: subagent
temperature: 0.15
depth: L1
lineage: hm
domain: Phase Lifecycle
skills:
  - hm-coordinating-loop
  - hm-subagent-delegation-patterns
  - hm-completion-looping
  - gate-lifecycle-integration
instruction:
  - AGENTS.md
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
  glob: allow
  grep: allow
  task:
    "*": ask
    "hm-*": allow
    "hf-*": ask
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  skill:
    "*": ask
    "hm-coordinating-loop": allow
    "hm-subagent-delegation-patterns": allow
    "hm-completion-looping": allow
    "gate-lifecycle-integration": allow
---
```

#### hm-L2: Specialist (Researcher)

```yaml
---
name: hm-research-detective
description: "Terminal repository investigator for read-only codebase research, evidence collection, and synthesis. Spawned by L1 coordinators. Never mutates files or delegates further."
mode: subagent
temperature: 0.05
depth: L2
lineage: hm
domain: Research
skills:
  - hm-detective
  - hm-deep-research
  - hm-synthesis
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
  glob: allow
  grep: allow
  task: ask
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  skill:
    "*": ask
    "hm-detective": allow
    "hm-deep-research": allow
    "hm-synthesis": allow
---
```

#### hf-L0: Meta-Builder Orchestrator

```yaml
---
name: hf-orchestrator
description: "Meta-builder root orchestrator. Routes meta-concept creation requests (agents, skills, commands, tools) to L1 coordinators. Enforces quality gates and cross-lineage skill access. Never implements."
mode: primary
temperature: 0.25
depth: L0
lineage: hf
domain: Orchestration
skills:
  - hf-meta-builder
  - hm-coordinating-loop
  - hm-user-intent-interactive-loop
  - gate-lifecycle-integration
  - gate-spec-compliance
instruction:
  - .opencode/rules/universal-rules.md
  - AGENTS.md
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
  glob: allow
  grep: allow
  task:
    "*": allow
    "L2-*": ask
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: allow
  prompt-analyze: allow
  session-patch: ask
  skill:
    "*": ask
    "hf-*": allow
    "hm-*": allow
    "gate-*": allow
    "stack-*": allow
---
```

#### hf-L1: Category Coordinator

```yaml
---
name: hf-agent-coordinator
description: "Agent-building category coordinator. Receives agent creation/audit tasks from hf-orchestrator, dispatches hf-agent-builder specialists, and validates agent quality against AQUAL standards."
mode: subagent
temperature: 0.15
depth: L1
lineage: hf
domain: Agent Building
skills:
  - hf-agents-and-subagents-dev
  - hf-delegation-gates
  - hm-completion-looping
  - gate-lifecycle-integration
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
  glob: allow
  grep: allow
  task:
    "*": ask
    "hf-*": allow
    "hm-*": allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  skill:
    "*": ask
    "hf-agents-and-subagents-dev": allow
    "hf-delegation-gates": allow
    "hm-completion-looping": allow
    "gate-lifecycle-integration": allow
---
```

#### hf-L2: Specialist (Agent Builder)

```yaml
---
name: hf-agent-builder
description: "Creates, audits, and repairs OpenCode agent definitions. Produces agent .md files with YAML frontmatter, permissions, temperature, and XML-tagged execution flows. Spawned by L1 coordinators. Cannot delegate."
mode: subagent
temperature: 0.05
depth: L2
lineage: hf
domain: Agent Building
skills:
  - hf-agents-and-subagents-dev
  - hf-agent-composition
  - hm-detective
  - hm-deep-research
  - stack-opencode
  - stack-zod
  - stack-vitest
permission:
  read: allow
  edit:
    scope: ".opencode/agents/"
  write:
    scope: ".opencode/agents/"
  bash:
    "*": ask
    "git *": allow
  glob: allow
  grep: allow
  task: ask
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  skill:
    "*": ask
    "hf-agents-and-subagents-dev": allow
    "hf-agent-composition": allow
    "hm-detective": allow
    "hm-deep-research": allow
    "stack-opencode": allow
    "stack-zod": allow
    "stack-vitest": allow
---
```

---

## 2. Two-Lineage Taxonomy

### 2.1 Overview

The Hivemind agent system uses exactly two lineages:

| Lineage | Purpose | Skill Binding | Cross-Lineage |
|---------|---------|--------------|---------------|
| **hm-*** (Hivemind Product) | Execute product development workflows: research, planning, implementation, testing, review, deployment, and quality assurance | **STRICT**: hm-skills + gate-* + stack-* only | Cannot access hf-* skills |
| **hf-*** (Hivefiver Meta) | Build OpenCode meta-concepts: agents, skills, commands, tools, and context pipelines | **FLEXIBLE**: hf-skills + hm-skills + gate-* + stack-* | May access hm-* skills for codebase investigation |

### 2.2 hm-* Lineage — Product Development

Agents that execute product workflows. They are the operational backbone of the harness: they research, plan, implement, test, review, and deploy features.

**Skill Binding (STRICT):** `hm-skills + gate-* + stack-*`. No hf-* skill access.

**Depth Distribution:**

| Level | Count | Role |
|-------|-------|------|
| L0 Orchestrator | 1–2 | Top-level workflow orchestrators (hm-orchestrator, hm-conductor) |
| L1 Coordinator | 3–5 | Phase/wave coordinators with gate management |
| L2 Specialist | 20–25 | Single-domain executors, no delegation |

**11 Domain Categories:**

| # | Domain | Purpose | Example Agent Names | Key Skills |
|---|--------|---------|---------------------|------------|
| 1 | **Research** | Codebase investigation, evidence gathering, multi-source synthesis | hm-research-detective, hm-research-deep, hm-research-synthesizer | hm-detective, hm-deep-research, hm-synthesis |
| 2 | **Planning** | Phase planning, roadmap creation, dependency analysis | hm-plan-planner, hm-plan-checker, hm-plan-roadmapper | hm-spec-driven-authoring, hm-phase-execution |
| 3 | **Implementation** | Code writing, feature development, refactoring, fix application | hm-impl-executor, hm-impl-fixer, hm-impl-builder | hm-test-driven-execution, hm-cross-cutting-change, clean-code |
| 4 | **Quality** | Code review, testing, verification, validation | hm-quality-reviewer, hm-quality-verifier, hm-quality-nyquist | hm-debug, gate-spec-compliance, gate-evidence-truth |
| 5 | **Domain** | Domain-specific research, framework selection, AI evaluation | hm-domain-researcher, hm-domain-framework, hm-domain-eval | hm-deep-research, hm-tech-context-compliance |
| 6 | **Documentation** | Doc writing, classification, verification | hm-doc-writer, hm-doc-classifier, hm-doc-verifier | jsdoc-typescript-docs, write-docs |
| 7 | **Phase Lifecycle** | Phase execution, loop management, checkpoint recovery, intent clarification | hm-lifecycle-coordinator, hm-lifecycle-guardian, hm-lifecycle-intent | hm-phase-execution, hm-phase-loop, hm-completion-looping |
| 8 | **Audit** | Milestone audit, UAT audit, evaluation review, security audit | hm-audit-milestone, hm-audit-uat, hm-audit-security | gsd-audit-milestone, gsd-secure-phase, gsd-eval-review |
| 9 | **UI** | UI research, UI checking, UI audit | hm-ui-researcher, hm-ui-checker, hm-ui-auditor | gsd-ui-phase, gsd-ui-review, frontend-design |
| 10 | **Intelligence** | Codebase mapping, pattern detection, intel updates | hm-intel-mapper, hm-intel-pattern, hm-intel-updater | gsd-map-codebase, gsd-intel, gsd-pattern-mapper |
| 11 | **Debug** | Systematic debugging, debug session management | hm-debug-session, hm-debug-analyzer | hm-debug, systematic-debugging, debug-like-expert |

### 2.3 hf-* Lineage — Meta Builder

Agents that build OpenCode meta-concepts: skills, agents, commands, tools. They create the configuration layer that other agents and workflows use.

**Skill Binding (FLEXIBLE):** `hf-skills + hm-skills + gate-* + stack-*`. May access hm-* skills (e.g., hm-detective for codebase investigation, hm-deep-research for library analysis) when their meta-concept building task requires understanding the existing codebase.

**Depth Distribution:**

| Level | Count | Role |
|-------|-------|------|
| L0 Orchestrator | 1 | Meta-builder root orchestrator (hf-orchestrator) |
| L1 Coordinator | 1–2 | Category coordinators (agent/skill/tool) |
| L2 Specialist | 4–6 | Single-meta-concept builders |

**7 Domain Categories:**

| # | Domain | Purpose | Example Agent Names | Key Skills |
|---|--------|---------|---------------------|------------|
| 1 | **Orchestration** | Meta-builder workflow routing, category dispatch | hf-orchestrator | hf-meta-builder, hm-coordinating-loop |
| 2 | **Agent Building** | Agent definition creation, audit, repair | hf-agent-builder | hf-agents-and-subagents-dev, hf-agent-composition |
| 3 | **Command Building** | Command definition creation, argument parsing | hf-command-builder | hf-command-dev, hf-command-parser |
| 4 | **Skill Authoring** | Skill creation, quality audit, pattern extraction | hf-skill-author | hf-use-authoring-skills, hf-skill-synthesis |
| 5 | **Tool Building** | Custom tool creation with Zod schemas | hf-tool-builder | hf-custom-tools-dev, stack-zod |
| 6 | **Context/Audit** | Context absorption, AGENTS.md sync, project audit | hf-context-audit | hf-context-absorb, hf-agents-md-sync |
| 7 | **Prompt Engineering** | Prompt analysis, optimization, repackaging | hf-prompt-analyzer, hf-prompt-repackager | prompt-optimizer, hf-prompter |

### 2.4 Cross-Lineage Access Matrix

```
┌──────────┬───────────────────────────────────────┬──────────────────────────────────────────────────┐
│ Lineage  │ Skills Access                         │ Tools Access                                      │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┤
│ hm-*     │ hm-* + gate-* + stack-*               │ Native + Hivemind custom (depth-scoped)           │
│          │ hf-*: DENIED                          │ delegate-task: L0/L1 only                         │
│          │                                       │ task: L0 → L1, L1 → L2                             │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┤
│ hf-*     │ hf-* + hm-* + gate-* + stack-*        │ Native + Hivemind custom (depth-scoped)           │
│          │ Full cross-lineage hm access           │ delegate-task: L0/L1 only                         │
│          │ allowed for codebase investigation     │ task: L0 → L1, L1 → L2                             │
└──────────┴───────────────────────────────────────┴──────────────────────────────────────────────────┘
```

### 2.5 Lineage Membership Rules

An agent qualifies as **hm-*** when:
- Its primary task is executing product development workflows (research, planning, implementing, testing, reviewing, deploying)
- It operates within one of the 11 hm-* domains
- It does NOT build or modify OpenCode meta-concepts
- It follows the STRICT skill binding rule (no hf-* access)

An agent qualifies as **hf-*** when:
- Its primary task is creating or modifying OpenCode meta-concepts (agents, skills, commands, tools)
- It operates within one of the 7 hf-* domains
- It may need hm-* skills for codebase investigation (FLEXIBLE binding)
- It produces `.opencode/` artifacts as its primary output

**Tiebreaker:** If an agent both produces product code AND creates meta-concepts, it is hm-* (product code takes precedence). If an agent creates meta-concepts AND may incidentally edit source code, it is hf-* (meta-concept creation is the defining task).

---

## 3. Depth Level Definitions (L0/L1/L2)

### 3.1 Level Comparison

| Property | L0 Orchestrator | L1 Coordinator | L2 Specialist |
|----------|----------------|----------------|---------------|
| **Mode** | `primary` | `subagent` | `subagent` |
| **Temperature** | 0.2–0.3 | 0.1–0.2 | 0.0–0.15 |
| **Delegates to** | L1 only | L2 only | Nobody |
| **Implements** | Never | Never | Always |
| **Manages** | Workflow routing, gate decisions, user intent classification | Wave dispatch, checkpoint gates, result collection, phase management | Single-domain execution, structured output |
| **Returns** | Workflow completion summary with gate verdicts | Wave results + gate verdicts + escalation flags | Structured domain results with file:line evidence |
| **XML Tags** | All 10 required + `<execution_flow>` + `<behavioral_contract>` + `<delegation_boundary>` | All 10 required + `<execution_flow>` + `<delegation_boundary>` | All 10 required; `<behavioral_contract>` recommended |
| **Body LOC (min)** | ≥ 200 | ≥ 150 | ≥ 50 |
| **Body LOC (target)** | 300–500 | 200–400 | 100–300 |

### 3.2 Delegation Rules

1. **L0 → L1 only.** An orchestrator dispatches work to L1 coordinators. It never delegates directly to L2 specialists.
2. **L1 → L2 only.** A coordinator dispatches tasks to L2 specialists. It never delegates to another L1 or back to L0.
3. **L2 cannot delegate.** A specialist executes its task and returns results. It never spawns subagents. The `task: ask` and `delegate-task: ask` permissions are mandatory.
4. **Temperature decreases with depth.** Lower depth = more deterministic. L0 needs flexibility for routing decisions and intent classification. L2 needs precision for implementation correctness.
5. **Permission scope narrows with depth.** L0 has broad read access and delegation rights. L1 has scoped read and delegation. L2 has domain-scoped write and no delegation.

### 3.3 Temperature Guidelines

| Depth | Range | Rationale | Creative Exception |
|-------|-------|-----------|-------------------|
| **L0** | 0.2–0.3 | Needs flexibility for routing decisions and user intent classification. Too low → brittle routing. Too high → unpredictable delegation. | N/A — L0 always needs flexibility |
| **L1** | 0.1–0.2 | Balances structured workflow management with adaptive problem-solving. Must follow procedures precisely but adapt to edge cases. | N/A — L1 is workhorse precision |
| **L2** | 0.0–0.15 | Maximum determinism for well-defined tasks with clear inputs/outputs. No creativity needed — precision and reliability are paramount. | 0.15–0.25 for creative work: documentation writing, UI design, planning. Must include `# temperature: <value> — creative exception for <reason>` comment. |

**Temperature enforcement rules:**
- Every agent must have `temperature:` explicitly set in YAML frontmatter. No reliance on runtime defaults.
- Temperature outside depth range = AQUAL-08 violation (MUST NOT PASS quality gate).
- Creative exceptions must be documented with inline YAML comment.

### 3.4 Permission Scope by Depth

| Permission Category | L0 | L1 | L2 |
|--------------------|----|----|-----|
| Read (read, glob, grep) | Broad — entire repo | Broad — entire repo | Domain-scoped |
| Write (edit, write) | Denied | Denied | Allowed (domain-scoped) |
| Shell (bash) | git + node only | git + node only | git only |
| Delegate (task, delegate-task) | Allowed (L1 only) | Allowed (L2 only) | Denied |
| Status (delegation-status) | Allowed | Allowed | Denied |
| Session (session-journal-export) | Allowed | Allowed | Denied |
| Prompt (prompt-skim, prompt-analyze) | Allowed | Denied | Denied |
| Web (webfetch, websearch) | Allowed | Allowed | Denied |
| Skills | hm-* + gate-* + stack-* (lineage-aware) | Specific domain skills | Domain-specific skills |

---

## 4. Permission Model Templates

### 4.1 Core Principle: ask-All, Allow-Explicit

Every agent's permission block MUST start with `"*": ask` for each category. No implicit access — every tool access must be explicitly granted.

### 4.2 Tool Categories Reference

| Category | Tools | Description |
|----------|-------|-------------|
| **Native Read** | read, glob, grep | File system inspection |
| **Native Write** | edit, write | File mutation |
| **Native Shell** | bash | Command execution |
| **Hivemind Delegate** | task, delegate-task | Subagent dispatch |
| **Hivemind Status** | delegation-status | Delegation monitoring |
| **Hivemind Session** | session-journal-export, session-patch | Session persistence |
| **Hivemind Prompt** | prompt-skim, prompt-analyze | Prompt pipeline |
| **MCP/Web** | webfetch, websearch, mcp-* | External tools |
| **Skills** | skill | Skill loading |

### 4.3 Template: hm-L0 (Primary Orchestrator)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
    "npx *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task:
    "*": ask
    "hm-*": allow
    "hf-*": allow    # L0 orchestrator may dispatch to any L1
    "L2-*": ask      # Never delegate directly to L2
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: allow
  prompt-analyze: allow
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: allow
  websearch: allow

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hm-*": allow      # All product-dev skills
    "gate-*": allow    # Quality gate triad
    "stack-*": allow   # Tech stack references
    "hf-*": ask       # hm STRICT: no meta-builder skills
```

### 4.4 Template: hm-L1 (Coordinator)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task:
    "*": ask
    "hm-*": allow
    "hf-*": ask      # hm STRICT
    "L0-*": ask       # Never delegate upward
    "L1-*": ask       # Never delegate laterally
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: allow
  websearch: allow

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hm-coordinating-loop": allow
    "hm-subagent-delegation-patterns": allow
    "hm-completion-looping": allow
    "hm-phase-execution": allow
    "hm-phase-loop": allow
    "gate-lifecycle-integration": allow
    "gate-spec-compliance": allow
```

### 4.5 Template: hm-L2 (Specialist — Researcher Example)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit: ask           # Read-only specialist
  write: ask
  bash:
    "*": ask
    "git *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task: ask            # L2 never delegates
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: ask
  websearch: ask

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hm-detective": allow
    "hm-deep-research": allow
    "hm-synthesis": allow
    "hm-research-chain": allow
```

### 4.6 Template: hf-L0 (Meta-Builder Orchestrator)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
    "npx *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task:
    "*": ask
    "hf-*": allow      # Dispatch to hf L1 coordinators
    "hm-*": allow      # May dispatch to hm L1 for cross-cutting work
    "L2-*": ask        # Never delegate directly to L2
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: allow
  prompt-analyze: allow
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: allow
  websearch: allow

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hf-*": allow       # All meta-builder skills
    "hm-*": allow       # hf FLEXIBLE: cross-lineage access
    "gate-*": allow     # Quality gate triad
    "stack-*": allow    # Tech stack references
```

### 4.7 Template: hf-L1 (Category Coordinator — Agent Building Example)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git *": allow
    "node *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task:
    "*": ask
    "hf-agent-builder": allow
    "hf-skill-author": allow
    "hivefiver-*": allow
    "L0-*": ask        # Never delegate upward
    "L1-*": ask         # Never delegate laterally
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: allow
  websearch: allow

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hf-agents-and-subagents-dev": allow
    "hf-delegation-gates": allow
    "hm-coordinating-loop": allow
    "hm-completion-looping": allow
    "gate-lifecycle-integration": allow
```

### 4.8 Template: hf-L2 (Specialist — Agent Builder Example)

```yaml
permission:
  # ── Native OpenCode ───────────────────────
  read: allow
  edit:
    scope: ".opencode/agents/"
  write:
    scope: ".opencode/agents/"
  bash:
    "*": ask
    "git *": allow
    "node *": allow
    "npx *": allow
  glob: allow
  grep: allow

  # ── Hivemind Custom ───────────────────────
  task: ask             # L2 never delegates
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask

  # ── MCP / Web ─────────────────────────────
  webfetch: ask
  websearch: ask

  # ── Skills ────────────────────────────────
  skill:
    "*": ask
    "hf-agents-and-subagents-dev": allow
    "hf-agent-composition": allow
    "hm-detective": allow
    "hm-deep-research": allow
    "stack-opencode": allow
    "stack-zod": allow
    "stack-vitest": allow
```

### 4.9 Permission Inheritance Rules

1. L2 specialists inherit default read permissions from their L1 coordinator (read, glob, grep).
2. Explicit permission in the agent's own frontmatter always overrides inherited defaults.
3. Pattern-matched bash permissions follow glob semantics: `"git *"` matches `git status`, `git log`, etc.
4. `"*": ask` is the mandatory base for all permission categories — no implicit access ever.
5. Write permission on L2 specialists MUST be scope-bound: `{ scope: ".opencode/agents/" }` or `{ scope: "src/" }`. Blanket `write: allow` is an AQUAL-05 violation.

---

## 5. Domain Routing Rules

### 5.1 hm-* Domain Task Mapping

| Domain | Task Keywords | Delegated When | Example Dispatch |
|--------|--------------|----------------|-----------------|
| **Research** | investigate, find, trace, evidence, codebase, pattern, locate, scan | User asks "how does X work?", "find Y", "trace Z" | L0 → hm-research-detective |
| **Planning** | plan, roadmap, phase, dependency, design, architecture | User asks "plan X", "create roadmap", "design Y" | L0 → hm-plan-planner |
| **Implementation** | implement, write, build, create, fix, refactor | User asks "implement X", "build Y", "fix Z" | L1 → hm-impl-executor |
| **Quality** | review, test, verify, validate, check, audit code | After implementation phase completes, before merge | L1 → hm-quality-reviewer |
| **Domain** | framework, library, SDK, API, technology, evaluate | User asks "what framework for X?", "evaluate Y" | L0 → hm-domain-researcher |
| **Documentation** | document, doc, write doc, classify, verify doc | User asks "document X", "write docs for Y" | L1 → hm-doc-writer |
| **Phase Lifecycle** | execute phase, run phase, checkpoint, resume, loop | User asks "execute phase", "run plan", "continue" | L0 → hm-lifecycle-coordinator |
| **Audit** | audit, milestone, UAT, security audit, evaluate | Milestone end, phase completion, security review | L0 → hm-audit-milestone |
| **UI** | UI, frontend, design, visual, sketch, style | User asks "design UI", "review frontend", "sketch" | L1 → hm-ui-researcher |
| **Intelligence** | map codebase, intel, pattern, codebase analysis | Initial project onboarding, periodic updates | L0 → hm-intel-mapper |
| **Debug** | debug, investigate bug, trace error, root cause | User reports bug, test failure, unexpected behavior | L0 → hm-debug-session |

### 5.2 hf-* Domain Task Mapping

| Domain | Task Keywords | Delegated When | Example Dispatch |
|--------|--------------|----------------|-----------------|
| **Orchestration** | create/set up meta, configure ecosystem, build tooling | User asks "build agent/skill/command/tool system" | Routes to hf-agent-coordinator / hf-skill-coordinator |
| **Agent Building** | create agent, build agent, fix agent, audit agent | User asks "create an agent", "fix agent definition" | hf-orchestrator → hf-agent-builder |
| **Command Building** | create command, build command, fix command | User asks "create a command", "add slash command" | hf-orchestrator → hf-command-builder |
| **Skill Authoring** | create skill, write skill, audit skill | User asks "create a skill", "write SKILL.md" | hf-orchestrator → hf-skill-author |
| **Tool Building** | create tool, build tool, build plugin | User asks "create a tool", "build custom tool" | hf-orchestrator → hf-tool-builder |
| **Context/Audit** | audit agents md, sync docs, absorb context | User asks "sync AGENTS.md", "audit project" | hf-orchestrator → hf-context-audit |
| **Prompt Engineering** | optimize prompt, analyze prompt, repackage prompt | User asks "optimize this prompt", "improve prompt" | hf-orchestrator → hf-prompt-analyzer |

### 5.3 Cross-Domain Routing

When a task spans multiple domains:

1. **L0 Orchestrator** classifies the primary domain from user intent.
2. If secondary domains are detected, L0 dispatches to the **primary domain coordinator** with cross-domain notes.
3. The L1 coordinator may dispatch **parallel L2 specialists** for different domains (e.g., research + implement).
4. The L1 coordinator **merges results** from parallel specialists into a unified response.
5. If a domain conflict arises (e.g., implement vs. audit), the L0 makes the **gate decision** — audit runs after implement.

**Multi-domain example:** "Research the bug and fix it"
1. L0 classifies: primary = Debug, secondary = Implementation
2. L0 → hm-debug-session (L1 coordinator)
3. hm-debug-session → hm-debug-analyzer (L2, research phase)
4. After root cause found: hm-debug-session → hm-impl-fixer (L2, implementation phase)
5. hm-debug-session collects, merges, returns unified result

### 5.4 Routing Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Direct-to-L2 dispatch** — L0 dispatches to L2 without L1 coordination | L0's `task:` has `"L2-*": ask` but dispatches to an L2-named agent | Route through L1 coordinator |
| **Cross-lineage confusion** — hm-L0 dispatches to hf-* agents for product work | hm agent task list includes hf-* names | hm agents route to hm coordinators only; hf tasks go through hf-orchestrator |
| **Specialist overload** — L2 agent receives task outside its domain | L2 agent tries to load skills outside its domain | L1 coordinator validates domain match before dispatch |
| **Cycle delegation** — L1-A delegates to L1-B which delegates back to L1-A | Circular `task:` permission chain | L1 never delegates laterally; depth hierarchy is strict tree |

---

## 6. Frontmatter Validation Rules

### 6.1 AQUAL Compliance Checklist

| ID | Requirement | Check | Machine-Verifiable | Pass Criteria |
|----|-------------|-------|--------------------|---------------|
| **AQUAL-01** | YAML frontmatter present with all required fields | Parse YAML block, check keys | Yes | name, description, mode, temperature, depth, lineage all present and non-empty |
| **AQUAL-02** | 10 XML sections in body | Count XML closing tags | Yes | `</role>`, `</depth>`, `</lineage>`, `</task>`, `</scope>`, `</context>`, `</expected_output>`, `</verification>`, `</iron_law>`, `</output_contract>` all present |
| **AQUAL-03** | Lineage match | Compare declared lineage vs skill list | Yes | hm-* agent has zero hf-* skills; hf-* agent may have hm-* skills |
| **AQUAL-04** | Valid depth declared | Verify depth field | Yes | depth is exactly "L0", "L1", or "L2" |
| **AQUAL-05** | Granular permissions | Check permission block | Partial | read, write, delegate arrays are explicit; no blanket `"*": allow` without ask base |
| **AQUAL-06** | Max 500 lines | Line count | Yes | `wc -l` (frontmatter + body) ≤ 500 |
| **AQUAL-07** | Skill references resolve | Verify each skill exists | Yes | Every skill in `skills:` maps to `.opencode/skills/<name>/SKILL.md` (or recognized installed skill) |
| **AQUAL-08** | Temperature within depth range | Numeric check | Yes | L0: 0.2–0.3, L1: 0.1–0.2, L2: 0.0–0.15 (or 0.15–0.25 with `# creative exception` comment) |

### 6.2 Name Format Validation

```
Pattern: ^(hm|hf)-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)?$
```

| Component | Rule | Example |
|-----------|------|---------|
| Lineage prefix | `hm-` or `hf-` | `hm-`, `hf-` |
| Domain segment | Lowercase alphanumeric, single hyphen, 2–20 chars | `research`, `agent`, `impl`, `quality` |
| Role segment | Lowercase alphanumeric, single hyphen, 2–20 chars | `detective`, `builder`, `executor`, `fixer` |
| Optional sub-role | Lowercase alphanumeric, single hyphen, 2–20 chars | `session`, `deep`, `nyquist` |

**Valid:** `hm-research-detective`, `hf-agent-builder`, `hm-impl-executor`, `hm-quality-reviewer`, `hf-skill-author`, `hm-plan-planner`, `hm-debug-session`, `hm-lifecycle-coordinator`

**Invalid:** `hm-research_detective` (underscore), `hm--research` (double hyphen), `Research-detective` (uppercase, no prefix), `hf-tool-builder-extra-long-segment` (exceeds 3-4 segments preference), `xyz-researcher` (no hm/hf prefix)

### 6.3 Lineage-Skill Binding Validation

```typescript
function validateLineageSkillBinding(agent: AgentFrontmatter): ValidationResult {
  const errors: string[] = []

  if (agent.lineage === "hm" && agent.skills) {
    const hfSkills = agent.skills.filter(s => s.startsWith("hf-"))
    if (hfSkills.length > 0) {
      errors.push(`AQUAL-03 VIOLATION: hm agent includes hf- skills: ${hfSkills.join(", ")}`)
    }
  }

  // hf agents may include hm- skills — this is valid (FLEXIBLE binding)

  if (agent.skills) {
    const gateSkills = agent.skills.filter(s => s.startsWith("gate-"))
    const stackSkills = agent.skills.filter(s => s.startsWith("stack-"))
    // gate-* and stack-* are always allowed for both lineages
    // No error needed here
  }

  return { valid: errors.length === 0, errors }
}
```

### 6.4 Temperature-Depth Validation

```typescript
function validateTemperatureDepth(agent: AgentFrontmatter): ValidationResult {
  const errors: string[] = []
  const temp = agent.temperature
  const depth = agent.depth

  const ranges: Record<string, { min: number; max: number; creativeMax?: number }> = {
    L0: { min: 0.2, max: 0.3 },
    L1: { min: 0.1, max: 0.2 },
    L2: { min: 0.0, max: 0.15, creativeMax: 0.25 },
  }

  const range = ranges[depth]
  if (!range) {
    errors.push(`AQUAL-04 VIOLATION: unknown depth "${depth}"`)
    return { valid: false, errors }
  }

  if (temp < range.min || temp > (range.creativeMax || range.max)) {
    errors.push(`AQUAL-08 VIOLATION: temperature ${temp} outside ${depth} range [${range.min}-${range.max}]`)
  } else if (temp > range.max && range.creativeMax) {
    // Check for creative exception comment
    errors.push(`AQUAL-08 WARNING: temperature ${temp} exceeds ${depth} standard range. Requires # creative exception comment.`)
  }

  return { valid: errors.length === 0, errors: errors.filter(e => !e.includes("WARNING")) }
}
```

### 6.5 Permission Validation

```typescript
function validatePermissions(agent: AgentFrontmatter): ValidationResult {
  const errors: string[] = []
  const perm = agent.permission

  if (!perm) {
    errors.push("AQUAL-05 VIOLATION: permission block missing")
    return { valid: false, errors }
  }

  // Check ask-all base for skills
  if (perm.skill && !perm.skill["*"]) {
    errors.push("AQUAL-05 WARNING: skill block missing '*' ask base. Add 'skill: {\"*\": \"ask\"}'")
  }

  // Check delegation rules by depth
  if (agent.depth === "L2") {
    if (perm.task !== "ask" || perm["delegate-task"] !== "ask") {
      errors.push("AQUAL-05 VIOLATION: L2 specialist must have task: ask and delegate-task: ask")
    }
  }

  // Check write scope on L2
  if (agent.depth === "L2" && perm.write === "allow") {
    errors.push("AQUAL-05 WARNING: L2 write should be scope-bound, not blanket 'allow'. Use { scope: 'path/' }")
  }

  return { valid: errors.length === 0, errors }
}
```

### 6.6 Validation Checklist (Manual + Automated)

```
[ ] AQUAL-01: All 6 required YAML fields present (name, description, mode, temperature, depth, lineage)
[ ] AQUAL-02: All 10 XML closing tags present in body
[ ] AQUAL-03: hm agent has zero hf-* skills (automated)
[ ] AQUAL-04: depth is exactly L0, L1, or L2 (automated)
[ ] AQUAL-05: permission block has ask-all base, L2 has task:ask (semi-automated)
[ ] AQUAL-06: `wc -l` ≤ 500 (automated)
[ ] AQUAL-07: Every skill in skills: array resolves to existing skill file (automated)
[ ] AQUAL-08: Temperature within depth range (automated)
[ ] NAME-01: Name matches lineage-domain-role pattern (automated regex)
[ ] NAME-02: Name prefix matches declared lineage (automated)
[ ] LINEAGE-01: Cross-lineage skill binding enforced (automated via AQUAL-03)
[ ] PERM-01: `"*": ask` base for skill loading (semi-automated)
[ ] PERM-02: L2 has task: ask, delegate-task: ask (automated)
```

---

## 7. Old → New Agent Mapping

### 7.1 GSD → hm-* (33 Agents)

GSD agents are internal-only build tools that serve as quality benchmarks for hm-* authoring. All 33 are mapped to the hm-* lineage.

| # | Current (gsd-*) | Target (hm-*) | Domain | Depth | Action |
|---|-----------------|---------------|--------|-------|--------|
| 1 | gsd-advisor-researcher | hm-research-advisor | Research | L2 | Author from GSD benchmark |
| 2 | gsd-ai-researcher | hm-research-ai | Research | L2 | Author from GSD benchmark |
| 3 | gsd-assumptions-analyzer | hm-quality-assumptions | Quality | L2 | Author from GSD benchmark |
| 4 | gsd-code-fixer | hm-impl-fixer | Implementation | L2 | Author from GSD benchmark |
| 5 | gsd-code-reviewer | hm-quality-reviewer | Quality | L2 | Author from GSD benchmark |
| 6 | gsd-codebase-mapper | hm-intel-mapper | Intelligence | L2 | Author from GSD benchmark |
| 7 | gsd-debug-session-manager | hm-debug-session | Debug | L1 | Author from GSD benchmark |
| 8 | gsd-debugger | hm-debug-analyzer | Debug | L2 | Author from GSD benchmark |
| 9 | gsd-doc-classifier | hm-doc-classifier | Documentation | L2 | Author from GSD benchmark |
| 10 | gsd-doc-synthesizer | hm-doc-synthesizer | Documentation | L2 | Author from GSD benchmark |
| 11 | gsd-doc-verifier | hm-doc-verifier | Documentation | L2 | Author from GSD benchmark |
| 12 | gsd-doc-writer | hm-doc-writer | Documentation | L2 | Author from GSD benchmark |
| 13 | gsd-domain-researcher | hm-domain-researcher | Domain | L2 | Author from GSD benchmark |
| 14 | gsd-eval-auditor | hm-audit-eval | Audit | L2 | Author from GSD benchmark |
| 15 | gsd-eval-planner | hm-domain-eval | Domain | L2 | Author from GSD benchmark |
| 16 | gsd-executor | hm-impl-executor | Implementation | L2 | Author from GSD benchmark |
| 17 | gsd-framework-selector | hm-domain-framework | Domain | L2 | Author from GSD benchmark |
| 18 | gsd-integration-checker | hm-quality-integration | Quality | L2 | Author from GSD benchmark |
| 19 | gsd-intel-updater | hm-intel-updater | Intelligence | L2 | Author from GSD benchmark |
| 20 | gsd-nyquist-auditor | hm-quality-nyquist | Quality | L2 | Author from GSD benchmark |
| 21 | gsd-pattern-mapper | hm-intel-pattern | Intelligence | L2 | Author from GSD benchmark |
| 22 | gsd-phase-researcher | hm-research-phase | Research | L2 | Author from GSD benchmark |
| 23 | gsd-plan-checker | hm-plan-checker | Planning | L2 | Author from GSD benchmark |
| 24 | gsd-planner | hm-plan-planner | Planning | L2 | Author from GSD benchmark |
| 25 | gsd-project-researcher | hm-research-project | Research | L2 | Author from GSD benchmark |
| 26 | gsd-research-synthesizer | hm-research-synthesizer | Research | L2 | Author from GSD benchmark |
| 27 | gsd-roadmapper | hm-plan-roadmapper | Planning | L2 | Author from GSD benchmark |
| 28 | gsd-security-auditor | hm-audit-security | Audit | L2 | Author from GSD benchmark |
| 29 | gsd-ui-auditor | hm-ui-auditor | UI | L2 | Author from GSD benchmark |
| 30 | gsd-ui-checker | hm-ui-checker | UI | L2 | Author from GSD benchmark |
| 31 | gsd-ui-researcher | hm-ui-researcher | UI | L2 | Author from GSD benchmark |
| 32 | gsd-user-profiler | hm-research-profiler | Research | L2 | Author from GSD benchmark |
| 33 | gsd-verifier | hm-quality-verifier | Quality | L2 | Author from GSD benchmark |

### 7.2 Hivefiver → hf-* (6 Agents)

| # | Current (hivefiver-*) | Target (hf-*) | Domain | Depth | Action |
|---|---------------------|---------------|--------|-------|--------|
| 1 | hivefiver | hf-orchestrator | Orchestration | L0 | Rename + enrich with XML tags |
| 2 | hivefiver-agent-builder | hf-agent-builder | Agent Building | L2 | Rename + enrich with XML tags |
| 3 | hivefiver-command-builder | hf-command-builder | Command Building | L2 | Rename + enrich with XML tags |
| 4 | hivefiver-orchestrator | (merged into hf-orchestrator) | Orchestration | L0 | Absorbed — logic merged |
| 5 | hivefiver-skill-author | hf-skill-author | Skill Authoring | L2 | Rename + enrich with XML tags |
| 6 | hivefiver-tool-builder | hf-tool-builder | Tool Building | L2 | Rename + enrich with XML tags |

### 7.3 Core → hm-* (18 Agents)

| # | Current (unprefixed) | Target (hm-*) | Domain | Depth | Action |
|---|---------------------|---------------|--------|-------|--------|
| 1 | build | hm-impl-build | Implementation | L2 | Rename + enrich with XML tags + permissions |
| 2 | conductor | hm-lifecycle-conductor | Phase Lifecycle | L0 | Rename + enrich |
| 3 | context-mapper | hm-research-context-map | Research | L2 | Rename + enrich + permissions |
| 4 | context-purifier | hm-research-context-purify | Research | L2 | Rename + enrich + permissions |
| 5 | coordinator | hm-lifecycle-coordinator | Phase Lifecycle | L1 | Rename + enrich |
| 6 | critic | hm-quality-critic | Quality | L2 | Rename + enrich + permissions |
| 7 | general | hm-impl-general | Implementation | L2 | Rename + enrich + permissions |
| 8 | intent-loop | hm-lifecycle-intent | Phase Lifecycle | L1 | Rename + enrich |
| 9 | meta-synthesis-agent | hm-research-meta-synthesis | Research | L2 | Rename + enrich + permissions |
| 10 | orchestrator | hm-lifecycle-orchestrator | Phase Lifecycle | L0 | Rename + enrich |
| 11 | phase-guardian | hm-lifecycle-guardian | Phase Lifecycle | L1 | Rename + enrich |
| 12 | prompt-analyzer | hm-research-prompt-analyze | Research | L2 | Rename + enrich + permissions |
| 13 | prompt-repackager | hm-research-prompt-repack | Research | L2 | Rename + enrich + permissions |
| 14 | prompt-skimmer | hm-research-prompt-skim | Research | L2 | Rename + enrich + permissions |
| 15 | researcher | hm-research-detective | Research | L2 | Rename + enrich + permissions |
| 16 | risk-assessor | hm-quality-risk | Quality | L2 | Rename + enrich + permissions |
| 17 | spec-verifier | hm-quality-spec-verify | Quality | L2 | Rename + enrich + permissions |
| 18 | test-router | hm-quality-test-route | Quality | L2 | Rename + enrich + permissions |

### 7.4 Ghost Agent (1)

| # | Status | Target (hm-*) | Domain | Depth | Action |
|---|--------|---------------|--------|-------|--------|
| 1 | explore (missing from disk) | hm-research-explore | Research | L2 | Create new file from scratch |

### 7.5 Unchanged Agent (1)

| # | Current | Target | Domain | Depth | Action |
|---|---------|--------|--------|-------|--------|
| 1 | hf-prompter | hf-prompter (unchanged) | Prompt Engineering | L0 | Already correct lineage — validate, optionally enrich |

### 7.6 Migration Summary

| Source | Count | Target Lineage | Action |
|--------|-------|---------------|--------|
| gsd-* | 33 | hm-* | Author from scratch using GSD body content as quality benchmark |
| hivefiver-* | 6 | hf-* | Rename + enrich with XML tags + add missing permissions |
| Core (unprefixed) | 18 | hm-* | Rename + enrich with XML tags + add permissions |
| Ghost | 1 | hm-* | Create new file (hm-research-explore) |
| Unchanged | 1 | hf-* | Validate, optionally enrich |
| **Total** | **59** | — | — |

### 7.7 Lineage Distribution

| Lineage | Count | L0 | L1 | L2 |
|---------|-------|----|----|-----|
| hm-* | 52 | 2 (hm-lifecycle-orchestrator, hm-lifecycle-conductor) | 4 (hm-lifecycle-coordinator, hm-lifecycle-intent, hm-lifecycle-guardian, hm-debug-session) | 46 |
| hf-* | 7 | 2 (hf-orchestrator, hf-prompter) | 0 | 5 (hf-agent-builder, hf-command-builder, hf-skill-author, hf-tool-builder, and 1 planned coordinator) |
| **Total** | **59** | **4** | **4** | **51** |

> **Note:** The hf-* L1 coordinator slot (category coordinator for agent/skill/command routing) is planned but not yet assigned from the current agent inventory. It will be created during AS-6 (HF-CREATE).

---

## Appendix A: Quick Reference Card

### A.1 Agent Frontmatter Template (Minimal)

```yaml
---
name: <lineage>-<domain>-<role>
description: "<what> <who spawns> <boundaries>"
mode: subagent              # primary (L0) | subagent (L1, L2)
temperature: <depth-range>  # L0: 0.2-0.3, L1: 0.1-0.2, L2: 0.0-0.15
depth: <L0|L1|L2>
lineage: <hm|hf>
permission:
  read: allow
  edit: ask
  write: ask
  bash: { "*": ask }
  glob: allow
  grep: allow
  task: ask
  delegate-task: ask
  delegation-status: ask
  skill:
    "*": ask
    "<skill-name>": allow
---
```

### A.2 Depth Decision Tree

```
Can this agent route work to other agents?
├── YES → Does it implement anything itself?
│   ├── NO → L0 Orchestrator (temperature: 0.2-0.3)
│   └── YES → L1 Coordinator (temperature: 0.1-0.2)
└── NO → L2 Specialist (temperature: 0.0-0.15)
```

### A.3 Lineage Decision Tree

```
What does this agent PRODUCE?
├── Product code, research, plans, reviews, docs → hm-* (STRICT: no hf-* skills)
└── OpenCode meta-concepts (agents, skills, commands, tools) → hf-* (FLEXIBLE: hm-* skills allowed)
```

### A.4 Validation Quick Commands

```bash
# AQUAL-01: Check required YAML fields
grep -E "^(name|description|mode|temperature|depth|lineage):" agent.md | wc -l
# Expected: 6

# AQUAL-02: Check XML tags
grep -c "</\(role\|depth\|lineage\|task\|scope\|context\|expected_output\|verification\|iron_law\|output_contract\)>" agent.md
# Expected: 10

# AQUAL-03: Check lineage-skill binding (hm agent)
grep "^lineage: hm" agent.md && grep "hf-" agent.md && echo "AQUAL-03 FAIL" || echo "AQUAL-03 PASS"

# AQUAL-06: Line count
wc -l < agent.md
# Expected: ≤ 500

# AQUAL-08: Temperature range check
grep "^temperature:" agent.md
# L0: 0.2-0.3, L1: 0.1-0.2, L2: 0.0-0.15
```

---

## Appendix B: Decision Traceability

| Decision ID | Source | Section | Timestamp |
|-------------|--------|---------|-----------|
| D-AD-01 (STRICT/FLEXIBLE) | REQUIREMENTS.md §4 | §2 (Two-Lineage Taxonomy) | 2026-04-29 |
| D-AD-02 (3-level depth) | REQUIREMENTS.md §5 | §3 (Depth Level Definitions) | 2026-04-29 |
| D-AD-04 (XML body) | AGENT-ARCHITECTURE-SYNTHESIS.md §3 | §1 (YAML Frontmatter Schema, references XML) | 2026-04-29 |
| Permission ask-all principle | AGENT-ARCHITECTURE-SYNTHESIS.md §4 | §4 (Permission Model Templates) | 2026-04-29 |
| Temperature ranges by depth | AGENT-ARCHITECTURE-SYNTHESIS.md §8 | §3.3 (Temperature Guidelines) | 2026-04-29 |
| Migration map (59 agents) | AGENT-ARCHITECTURE-SYNTHESIS.md §7 | §7 (Old→New Agent Mapping) | 2026-04-29 |
| Anti-pattern catalog (AP-01–AP-07) | AGENT-ARCHITECTURE-SYNTHESIS.md §6 | §5.4 (Routing Anti-Patterns) | 2026-04-29 |
| AQUAL-01 through AQUAL-08 | REQUIREMENTS.md §8 | §6 (Frontmatter Validation Rules) | 2026-04-29 |
