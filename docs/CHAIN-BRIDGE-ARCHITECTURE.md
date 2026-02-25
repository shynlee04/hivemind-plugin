# Chain & Bridge Architecture Specification

**Status:** SPEC DRAFT  
**Version:** 1.0  
**Purpose:** Define the execution linking model (Chain) and dynamic context injection model (Bridge) for the HiveMind framework ecosystem  
**Synthesized From:** GSD command orchestration + BMAD step-file discipline + HiveMind 4-layer architecture  
**Audience:** Framework contributors, agent authors, module builders  

---

## 1. Chain & Bridge Philosophy

### Why Chain & Bridge

Traditional agentic frameworks rely on static agent profiles — each agent is a fixed bundle of instructions, tools, and personality. When a new domain or phase arises, you create another agent. This leads to agent sprawl, duplicated governance rules, and maintenance overhead that scales linearly with complexity.

HiveMind replaces this with two complementary mechanisms:

**Chain** is the sequential execution linking model. When a user invokes a command, it triggers a specific workflow, which loads required skills, applies templates, and produces structured output. The chain is deterministic — same input produces the same execution path. Every link in the chain has an explicit contract: what it receives, what it produces, what governance hook guards it, and how it fails.

**Bridge** is the dynamic context injection model. Instead of creating 10 agent variants for 10 phases, a Bridge Pack dynamically shifts an agent's operating context by injecting phase-specific assets (workflow overrides, templates, prompts, references, skills). The agent identity stays stable — `hivefiver` remains `hivefiver` — but its loaded knowledge, templates, and workflow bindings change per phase. This is persona switching without agent duplication.

Together, Chain & Bridge deliver composable, governable, extensible automation. Chains ensure every execution is traceable and auditable. Bridges ensure agents adapt to context without proliferating identities.

### Synthesis Lineage

These patterns are not copied from their sources. They are deconstructed and recombined:

- **From GSD:** Commands carry `execution_context` pointers in YAML frontmatter linking to workflows. Workflows define ordered steps with `depends_on` metadata and wave-based parallelism. This becomes HiveMind's Chain contract.
- **From BMAD:** Step-files use JIT loading — only the current step's context is loaded. Persona switching via team CSV files changes agent behavior without duplicating agent definitions. Append-only artifact evolution ensures auditability. This becomes HiveMind's Bridge mechanism.
- **From HiveMind native:** The 4-layer architecture (Hooks → Tools → SDK → TUI) provides the execution substrate. Hooks enforce governance at each chain link. Tools perform mutations. CQRS contracts ensure read/write separation. The Chain runs through these layers; the Bridge augments what each layer sees.

### Execution Flow

```
User invokes command
       │
       ▼
┌──────────────────┐
│  Command Entry   │─── resolve execution_context, required_skills
│  (commands/*.md) │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  H07 Preflight   │─── governance gate: session declared? entity checklist pass?
│  (hook gate)     │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Workflow Steps  │─── sequential step execution, entry/exit criteria per step
│  (workflows/*.y) │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Skill Loading   │─── domain knowledge injection (read-only context)
│  (skills/*/.)    │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Template Apply  │─── structured output scaffolding with variable substitution
│  (templates/*.md)│
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  H08 Tool Gate   │─── mutation authorization before any state change
│  (hook gate)     │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Tool Mutation   │─── durable state write via hivemind_* tools
│  (tools layer)   │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Output Artifact │─── structured result with evidence metadata
└──────────────────┘
```

### Static Agent Profiles vs Chain & Bridge

| Dimension | Static Agent Profiles | Chain & Bridge Dynamic |
|-----------|----------------------|----------------------|
| Context freshness | Stale — baked at definition time | Fresh — injected per invocation via Bridge Packs |
| Reusability | Low — each phase needs a new agent | High — same agent, different Bridge Packs |
| Governance | Duplicated across agents | Centralized in chain hooks, inherited by all |
| Maintenance burden | O(n) with agent count | O(1) — maintain packs, not agents |
| Extensibility | Fork agent definition | Compose new Bridge Pack from existing assets |
| Composability | Monolithic agent prompts | Modular: command + workflow + skill + template |
| Auditability | Opaque — agent internals hidden | Transparent — every chain link logged with evidence |

---

## 2. Workflow Chaining Model

### Chain Link Contracts

Every link in a chain has a typed contract defining what enters, what exits, how failures propagate, and which governance hook guards the transition.

| Link Type | Input Contract | Output Contract | Failure Posture | Governance Hook |
|-----------|---------------|-----------------|-----------------|-----------------|
| Command | User arguments + prompt context | Resolved `execution_context` pointer + `required_skills` list | Hard-fail: missing workflow reference blocks execution | H11 `command.pre` |
| Workflow | Resolved command context + step index | Step-by-step execution results with state metadata | Step-fail: halt chain, emit blocked status, no skip | H07 `chat.preflight` |
| Skill | Workflow step context + domain query | Domain knowledge payload (read-only) | Soft-fail: warn if skill missing, continue with degraded context | None (passive load) |
| Template | Workflow output variables + skill knowledge | Structured document with populated placeholders | Hard-fail: unresolved `{{variables}}` block output | None (static validation) |
| Output Artifact | Populated template + tool mutation results | Final artifact with evidence metadata + chain_id | Fail-open: partial output saved with incomplete flag | H09 `tool.call.post` |

### Command Frontmatter Schema

Commands declare their chain bindings in YAML frontmatter:

```yaml
---
description: "Distill requirements into structured specification"
execution_context: "workflows/hivefiver-floppy-engineer.yaml"
required_skills:
  - "hivefiver-spec-distillation"
  - "requirements-clarity"
required_templates:
  - "templates/spec-output-template.md"
chain_group: "hivefiver"
entry_gate: "session_declared"
---
```

The `execution_context` field is the critical chain link — it points to the workflow YAML that orchestrates the multi-step execution. Without it, the command is a standalone prompt with no chain governance.

### Workflow Step Schema

Workflows define ordered steps with dependency metadata and entry/exit criteria:

```yaml
name: hivefiver-floppy-engineer
description: "Floppy engineer persona workflow for spec-driven development"
target_agent: hivefiver
steps:
  - id: gather-context
    description: "Scan codebase and load planning artifacts"
    entry_criteria: "Session declared with plan_driven mode"
    exit_criteria: "Codebase topology mapped, planning artifacts indexed"
    skills_loaded:
      - "context-integrity"
    wave: 1

  - id: distill-requirements
    description: "Extract and structure requirements from user input"
    entry_criteria: "Context scan complete"
    exit_criteria: "Structured requirements document with acceptance criteria"
    depends_on:
      - gather-context
    skills_loaded:
      - "hivefiver-spec-distillation"
    wave: 2

  - id: validate-spec
    description: "Cross-check spec against codebase constraints"
    entry_criteria: "Requirements document exists"
    exit_criteria: "Validation report with no P0 conflicts"
    depends_on:
      - distill-requirements
    skills_loaded:
      - "evidence-discipline"
    wave: 3

  - id: produce-output
    description: "Generate final specification artifact"
    entry_criteria: "Validation passed"
    exit_criteria: "Spec document written to planning directory"
    depends_on:
      - validate-spec
    templates_applied:
      - "templates/spec-output-template.md"
    wave: 4
```

### Sequential Determinism

Workflow steps are NEVER skipped. This is adapted from BMAD's step-file discipline:

1. Steps execute in `wave` order (wave 1 before wave 2, etc.)
2. Within the same wave, steps without mutual `depends_on` may execute in parallel
3. A step's `entry_criteria` must be satisfied before execution begins
4. A step's `exit_criteria` must be verified before the next step starts
5. State flows as metadata in step results, not in prompt memory — preventing context pollution

### Example Chains

**Chain A: Specification Creation**

```
/hivefiver spec "Define auth module requirements"
  → Command: commands/hivefiver-spec.md
    → execution_context: workflows/hivefiver-floppy-engineer.yaml
      → Step 1 (wave 1): gather-context
        → Skill: context-integrity
        → Output: codebase topology + planning artifact index
      → Step 2 (wave 2): distill-requirements
        → Skill: hivefiver-spec-distillation
        → Output: structured requirements with acceptance criteria
      → Step 3 (wave 3): validate-spec
        → Skill: evidence-discipline
        → Output: validation report
      → Step 4 (wave 4): produce-output
        → Template: templates/spec-output-template.md
        → Output: final spec document in .hivemind/planning/
```

**Chain B: Codebase Scanning**

```
/hivemind-scan
  → Command: commands/hivemind-scan.md
    → execution_context: (inline — single-step chain)
      → Skill: context-integrity
      → Tool: hivemind_inspect (scan action)
      → Output: hierarchy status + drift score + entity checklist
```

---

## 3. Dynamic Profile Switching — Bridge Packs

### The Problem Bridges Solve

Consider `hivefiver` — it operates across research, specification, building, auditing, and tutoring phases. Without Bridges, you'd need separate agents or massive conditional prompts. With Bridges, `hivefiver` loads a phase-specific asset pack that shifts its workflow bindings, loaded skills, available templates, and injected prompts — without changing its core identity, governance rules, or tool access.

### Bridge Pack Directory Structure

```
bridges/
├── hivefiver-research-bridge/
│   ├── pack.yaml              # Manifest: target agent, phase, loaded assets
│   ├── workflow.yaml          # Phase-specific workflow override
│   ├── prompts/
│   │   └── research-framing.md
│   ├── templates/
│   │   └── research-report.md
│   ├── references/
│   │   └── source-evaluation-rubric.md
│   └── skills/
│       └── mcp-research-loop/
│           └── SKILL.md
│
├── hivefiver-spec-bridge/
│   ├── pack.yaml
│   ├── workflow.yaml
│   ├── prompts/
│   │   └── requirement-extraction.md
│   ├── templates/
│   │   └── spec-template.md
│   └── skills/
│       └── spec-distillation/
│           └── SKILL.md
│
├── hivefiver-build-bridge/
│   ├── pack.yaml
│   ├── workflow.yaml
│   ├── templates/
│   │   ├── scaffolding-template.md
│   │   └── implementation-checklist.md
│   └── skills/
│       └── code-patterns/
│           └── SKILL.md
│
└── hivefiver-audit-bridge/
    ├── pack.yaml
    ├── workflow.yaml
    ├── prompts/
    │   └── compliance-criteria.md
    ├── templates/
    │   └── audit-report.md
    └── skills/
        └── gate-enforcement/
            └── SKILL.md
```

### Pack Manifest Schema

```yaml
# pack.yaml
name: hivefiver-research-bridge
version: "1.0"
target_agent: hivefiver
phase: research
domain: knowledge-acquisition
description: "Augments hivefiver with MCP-backed research capabilities, source evaluation, and synthesis patterns"

assets:
  workflow: workflow.yaml
  prompts:
    - prompts/research-framing.md
  templates:
    - templates/research-report.md
  references:
    - references/source-evaluation-rubric.md
  skills:
    - skills/mcp-research-loop

entry_criteria:
  - "Research question or topic defined"
  - "MCP servers accessible (Tavily, Context7, DeepWiki)"
exit_criteria:
  - "Structured research report produced"
  - "All claims cite sources"
  - "Confidence scores assigned to findings"

replaces_workflow: false    # true = override agent's default workflow; false = augment
priority: 100               # higher = loaded first when multiple packs match
```

### Bridge Loading Sequence

```
1. Command invocation resolves target agent + phase
2. Bridge resolver scans bridges/ for matching pack.yaml
   (match on: target_agent + phase/domain)
3. Entry criteria validated against current session state
4. Pack assets injected into agent context:
   - workflow.yaml merged/overridden into execution_context
   - prompts/ content prepended to agent system prompt
   - templates/ registered as available output scaffolds
   - references/ loaded as read-only knowledge context
   - skills/ activated for domain expertise
5. Chain executes with augmented context
6. On chain completion, exit criteria verified
7. Pack assets unloaded — agent returns to base profile
```

### Bridge Pack Registry

| Pack Name | Target Agent | Phase | Key Assets | Purpose |
|-----------|-------------|-------|------------|---------|
| `hivefiver-research-bridge` | hivefiver | research | MCP research loop skill, source evaluation rubric, research report template | Structured multi-source research with confidence scoring |
| `hivefiver-spec-bridge` | hivefiver | specification | Spec distillation skill, requirement extraction prompt, spec template | Transform ambiguous requirements into structured specs |
| `hivefiver-build-bridge` | hivefiver | implementation | Code patterns skill, scaffolding template, implementation checklist | Scaffold and build framework modules |
| `hivefiver-audit-bridge` | hivefiver | verification | Gate enforcement skill, compliance criteria prompt, audit report template | Verify deliverables against acceptance criteria |
| `hiverd-web-research-bridge` | hiverd | web-research | Tavily/web-search skills, web source templates | Internet-based research and trend analysis |
| `hiverd-codebase-research-bridge` | hiverd | code-research | Repomix/grep skills, code analysis templates | Deep codebase investigation and pattern extraction |
| `hiveq-unit-test-bridge` | hiveq | unit-testing | Test methodology skill, test report template | Automated unit test execution and coverage analysis |
| `hiveq-release-gate-bridge` | hiveq | release | Release checklist skill, gate compliance template | Pre-release quality gate enforcement |

### Bridge vs Agent: Decision Matrix

| Scenario | Create New Agent? | Create Bridge Pack? |
|----------|:-:|:-:|
| Need fundamentally different governance rules | ✅ | ❌ |
| Need different tool access patterns | ✅ | ❌ |
| Same agent, different phase of work | ❌ | ✅ |
| Same agent, different domain knowledge | ❌ | ✅ |
| Need different model (e.g., faster for gates) | ✅ | ❌ |
| Need different templates/prompts for output | ❌ | ✅ |

---

## 4. Guardrails & Validation Gates

### Gate Enforcement Matrix

Every chain link and bridge transition passes through a governance gate. Gates are typed by severity and enforcement owner.

| Gate Point | Gate Type | Trigger Condition | Enforcement Owner | Recovery Action | Evidence Required |
|------------|-----------|-------------------|-------------------|-----------------|-------------------|
| Chain entry (command invocation) | Hard-gate | Missing `execution_context` or undeclared session | H11 `command.pre` + H07 `chat.preflight` | Block execution, prompt user to declare intent | Command frontmatter validation result |
| Workflow step transition | Hard-gate | Previous step `exit_criteria` not met | Workflow engine | Halt chain, emit step-blocked status | Step output vs exit criteria comparison |
| Skill load validation | Soft-gate | Referenced skill directory not found | Skill resolver | Warn and continue with degraded context | Skill path existence check result |
| Template application | Hard-gate | Unresolved `{{variable}}` placeholders remain | Template engine | Block output, list missing variables | Variable resolution audit |
| Bridge pack loading | Hard-gate | `target_agent` mismatch or `entry_criteria` not met | Bridge resolver | Reject pack, fall back to base agent profile | Pack manifest validation result |
| Bridge pack unloading | Soft-gate | `exit_criteria` partially met | Bridge resolver | Warn, unload pack, flag incomplete status | Exit criteria evaluation report |
| Output artifact validation | Auto-gate | Artifact missing required metadata (chain_id, evidence) | H09 `tool.call.post` | Auto-inject metadata from chain context | Metadata completeness check |
| Tool mutation authorization | Hard-gate | Tool call outside agent's permitted scope | H08 `tool.call.pre` | Block tool call, suggest alternative | Tool permission matrix lookup |

### Static Guardrails (Checkable Without Execution)

These rules can be validated by linting asset files before any chain runs:

1. **Chain completeness:** Every command with `execution_context` must point to an existing workflow YAML file
2. **Step contract:** Every workflow step must define both `entry_criteria` and `exit_criteria`
3. **Bridge integrity:** Every `pack.yaml` must reference only asset paths that exist within the pack directory
4. **Template consistency:** Every `{{variable}}` in a template must have a corresponding output field in the workflow step that applies it
5. **Skill existence:** Every `required_skills` entry in a command must correspond to a `skills/{name}/SKILL.md` directory
6. **Naming compliance:** No date-stamps in filenames; all assets follow `{prefix}-{purpose}` kebab-case convention
7. **Module self-containment:** No implicit cross-module asset references without explicit `extends` declaration

### Runtime Guardrails (Enforced During Execution)

These rules are enforced by hooks during chain execution:

1. **NEVER skip a workflow step** — steps execute in wave order; if a step blocks, the chain halts (adapted from BMAD sequential determinism)
2. **NEVER execute without declared intent** — `declare_intent()` must precede any chain invocation (HiveMind session governance)
3. **ALWAYS verify entry criteria** before step execution — the workflow engine checks conditions, not the agent's judgment
4. **ALWAYS emit evidence events** at gate checkpoints — every allow/block decision is recorded with timestamp, chain_id, and verdict
5. **NEVER allow bridge pack loading if target agent mismatches** — a pack for `hivefiver` cannot load into `hivemaker`
6. **ALWAYS produce atomic commit** at chain completion — completed chains result in a git commit with chain_id in the message (adapted from GSD commit semantics)
7. **NEVER mutate state in hooks** — chain governance observes and gates but does not write; mutations happen only in tool layer (CQRS preservation)

### Audit Trail Record Format

Every gate checkpoint emits an audit record:

```json
{
  "timestamp": "2026-02-25T10:30:00Z",
  "chain_id": "chain_hivefiver_spec_a1b2c3",
  "step_id": "distill-requirements",
  "gate_type": "hard-gate",
  "gate_point": "workflow_step_transition",
  "verdict": "pass",
  "evidence": {
    "entry_criteria_checked": ["Context scan complete"],
    "entry_criteria_met": true,
    "previous_step_exit_verified": true
  },
  "enforcement_owner": "workflow_engine",
  "agent": "hivefiver",
  "bridge_pack": "hivefiver-spec-bridge",
  "session_id": "c0b1fb7d-9f8e-4504-a0de-81bc21e18c03"
}
```

### Dual-Layer Guardrail Architecture

Adapted from BMAD's dual-layer validation model:

```
┌─────────────────────────────────────────┐
│  Layer A: Static Lint (pre-execution)   │
│  - Asset file validation                │
│  - Frontmatter schema checks            │
│  - Cross-reference integrity            │
│  - Naming convention compliance         │
│  → Runs: on asset sync, on commit hook  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Layer B: Runtime Gates (during exec)   │
│  - Entry/exit criteria enforcement      │
│  - CQRS boundary monitoring            │
│  - Bridge pack permission checks        │
│  - Evidence emission verification       │
│  → Runs: at every chain link transition │
└─────────────────────────────────────────┘
```

---

## 5. Module Composition Patterns

### What Is a Module

A module is a self-contained unit of framework functionality: one agent definition plus all the assets (commands, workflows, skills, templates, prompts, scripts, references, bridges) that give that agent its capabilities. Modules are the unit of composition, distribution, and versioning.

### Module Definition Schema

```yaml
# module.yaml
module:
  name: hivefiver-meta
  version: "1.0.0"
  description: "Meta-builder module for creating framework assets"
  extends: null
  agent: agents/hivefiver.md

  assets:
    commands:
      - commands/hivefiver-init.md
      - commands/hivefiver-spec.md
      - commands/hivefiver-research.md
      - commands/hivefiver-build.md
      - commands/hivefiver-audit.md
      - commands/hivefiver-doctor.md
      - commands/hivefiver-validate.md
      - commands/hivefiver-deploy.md
      - commands/hivefiver-intake.md
      - commands/hivefiver-tutor.md
      - commands/hivefiver-skillforge.md
      - commands/hivefiver-specforge.md
      - commands/hivefiver-workflow.md
      - commands/hivefiver-architect.md
      - commands/hivefiver-start.md
      - commands/hivefiver-gsd-bridge.md
      - commands/hivefiver-ralph-bridge.md
    workflows:
      - workflows/hivefiver-floppy-engineer.yaml
      - workflows/hivefiver-vibecoder.yaml
      - workflows/hivefiver-enterprise-architect.yaml
      - workflows/hivefiver-enterprise.yaml
      - workflows/hivefiver-mcp-fallback.yaml
    skills:
      - skills/hivefiver-persona-routing
      - skills/hivefiver-spec-distillation
      - skills/hivefiver-mcp-research-loop
      - skills/hivefiver-bilingual-tutor
      - skills/hivefiver-skill-auditor
      - skills/hivefiver-domain-pack-router
      - skills/hivefiver-ralph-tasking
      - skills/hivefiver-gsd-compat
    templates: []
    prompts: []
    scripts: []
    references: []
    bridges:
      - bridges/hivefiver-research-bridge
      - bridges/hivefiver-spec-bridge
      - bridges/hivefiver-build-bridge
      - bridges/hivefiver-audit-bridge
```

### Module Composition Rules

1. **One agent per module** — a module is scoped to exactly one agent definition. Multi-agent orchestration happens at the framework level, not within modules.
2. **Command-to-workflow linkage** — every command in a module must have an `execution_context` pointing to a workflow within the same module (or an explicitly declared dependency on another module's workflow).
3. **Skill self-containment** — skills referenced by workflows must exist within the module's `skills` list or be declared as framework-level shared skills.
4. **Cross-module dependencies via `extends`** — if module B depends on module A's assets, module B must declare `extends: module-a` in its definition. Implicit cross-references are forbidden.
5. **Asset naming scoping** — all assets in a module use the module's agent name as prefix: `hivefiver-*.md` for commands, `hivefiver-*.yaml` for workflows, etc.
6. **Bridge packs are module-internal** — a bridge pack targets exactly one agent and belongs to that agent's module. Cross-agent bridge packs are not permitted.

### Existing Module Inventory

| Module | Agent | Commands | Workflows | Skills | Bridges | Status |
|--------|-------|----------|-----------|--------|---------|--------|
| `hivemind-core` | hiveminder | 12 (`hivemind-*`, `hiveminder-*`) | 2 (`hivemind-brownfield-bootstrap`, `sequential-delegation-workflow`) | 5 (`hivemind-governance`, `session-lifecycle`, `delegation-intelligence`, `evidence-discipline`, `context-integrity`) | 0 | Active — needs bridge packs |
| `hivefiver-meta` | hivefiver | 17 (`hivefiver-*`) | 5 (`hivefiver-*`) | 8 (`hivefiver-*`) | 0 → 4 planned | Active — bridges not yet created |
| `hiveplanner-strategy` | hiveplanner | 0 | 0 | 0 | 0 | Minimal — agent definition only |
| `hivemaker-build` | hivemaker | 0 | 0 | 0 | 0 | Minimal — agent definition only |
| `hivexplorer-investigate` | hivexplorer | 0 | 0 | 0 | 0 | Minimal — agent definition only |
| `hivehealer-fix` | hivehealer | 0 | 0 | 0 | 0 | Minimal — agent definition only |
| `hiverd-research` | hiverd | 0 → 6 planned | 0 → 4 planned | 0 → 4 planned | 0 → 3 planned | **New — blueprint in §6** |
| `hiveq-quality` | hiveq | 0 → 6 planned | 0 → 4 planned | 0 → 4 planned | 0 → 3 planned | **New — blueprint in §7** |

---

## 6. HiveRD Module Blueprint

### Agent Definition

| Field | Value |
|-------|-------|
| Name | `hiverd` |
| File | `agents/hiverd.md` |
| Mode | `all` (can be primary, delegate, and be delegated to) |
| Role | Research & Development specialist — structured research, brainstorming, comparative analysis, synthesis, documentation |
| Model preference | High-capability model (needs strong reasoning for synthesis) |
| Tool access | Read-heavy: `glob`, `grep`, `read`, `webfetch`, `google_search`, `tavily_*`, `context7_*`, `deepwiki_*`, `repomix_*`, `hivemind_memory`, `hivemind_inspect` |
| Write access | Limited: `write` (for reports only), `hivemind_session`, `hivemind_anchor` |

### Asset Manifest (19 assets)

**Commands (6):**

| Command | File | Purpose | Execution Context |
|---------|------|---------|-------------------|
| `/hiverd-research` | `commands/hiverd-research.md` | Run structured multi-source research on a topic | `workflows/hiverd-deep-research.yaml` |
| `/hiverd-brainstorm` | `commands/hiverd-brainstorm.md` | Divergent ideation session with convergent evaluation | `workflows/hiverd-brainstorm-session.yaml` |
| `/hiverd-analyze` | `commands/hiverd-analyze.md` | Deep analysis of a codebase, architecture, or domain | `workflows/hiverd-comparative-analysis.yaml` |
| `/hiverd-synthesize` | `commands/hiverd-synthesize.md` | Synthesize multiple research outputs into unified report | `workflows/hiverd-synthesis-pipeline.yaml` |
| `/hiverd-document` | `commands/hiverd-document.md` | Generate structured documentation from analysis | `workflows/hiverd-synthesis-pipeline.yaml` |
| `/hiverd-compare` | `commands/hiverd-compare.md` | Comparative analysis of technologies, patterns, or approaches | `workflows/hiverd-comparative-analysis.yaml` |

**Workflows (4):**

| Workflow | File | Steps | Wave Structure |
|----------|------|-------|----------------|
| Deep Research | `workflows/hiverd-deep-research.yaml` | question-framing → source-discovery → evidence-gathering → synthesis → report-generation | 5 waves, sequential |
| Brainstorm Session | `workflows/hiverd-brainstorm-session.yaml` | problem-definition → divergent-ideation → convergent-evaluation → decision-documentation | 4 waves, sequential |
| Comparative Analysis | `workflows/hiverd-comparative-analysis.yaml` | criteria-definition → candidate-investigation → matrix-scoring → recommendation | 4 waves, sequential |
| Synthesis Pipeline | `workflows/hiverd-synthesis-pipeline.yaml` | input-indexing → pattern-extraction → cross-reference → unified-output | 4 waves, sequential |

**Skills (4):**

| Skill | Directory | Purpose |
|-------|-----------|---------|
| Research Methodology | `skills/research-methodology/` | Structured research process: question framing, source evaluation, evidence grading, confidence scoring |
| Source Evaluation | `skills/source-evaluation/` | Rubric for assessing source reliability, recency, authority, and bias |
| Synthesis Patterns | `skills/synthesis-patterns/` | Techniques for combining multiple sources: thematic analysis, contradiction resolution, gap identification |
| Comparative Analysis | `skills/comparative-analysis/` | Framework for structured comparison: criteria definition, weighted scoring, sensitivity analysis |

**Templates (3):**

| Template | File | Variables |
|----------|------|-----------|
| Research Report | `templates/research-report-template.md` | `{{topic}}`, `{{sources_count}}`, `{{findings}}`, `{{confidence_scores}}`, `{{gaps}}`, `{{recommendations}}` |
| Brainstorm Session | `templates/brainstorm-session-template.md` | `{{problem_statement}}`, `{{ideas}}`, `{{evaluation_criteria}}`, `{{selected_ideas}}`, `{{rationale}}` |
| Analysis Matrix | `templates/analysis-matrix-template.md` | `{{candidates}}`, `{{criteria}}`, `{{scores}}`, `{{winner}}`, `{{tradeoffs}}` |

**Prompts (2):**

| Prompt | File | Purpose |
|--------|------|---------|
| Research Question Framing | `prompts/research-question-framing.md` | Transform vague topics into structured, answerable research questions |
| Synthesis Instruction | `prompts/synthesis-instruction.md` | Guide for combining multiple evidence sources into coherent narrative |

**Bridge Packs (3):**

| Pack | Directory | Phase | Key Augmentation |
|------|-----------|-------|------------------|
| Web Research Bridge | `bridges/hiverd-web-research-bridge/` | web-research | Tavily/Google search tools, web source evaluation rubric, citation templates |
| Codebase Research Bridge | `bridges/hiverd-codebase-research-bridge/` | code-research | Repomix/grep/glob tools, code pattern extraction skill, architecture analysis templates |
| Domain Analysis Bridge | `bridges/hiverd-domain-analysis-bridge/` | domain-analysis | DeepWiki/Context7 tools, domain mapping skill, comparative framework templates |

**References (1):**

| Reference | File | Purpose |
|-----------|------|---------|
| Research Quality Criteria | `references/research-quality-criteria.md` | Standards for evidence quality, citation requirements, confidence thresholds |

### Example Chain: Deep Research

```
/hiverd-research "How does OpenCode SDK handle session compaction?"
  → Command: commands/hiverd-research.md
    → execution_context: workflows/hiverd-deep-research.yaml
      → Step 1 (wave 1): question-framing
        → Prompt: prompts/research-question-framing.md
        → Output: 3 specific sub-questions with scope boundaries
      → Step 2 (wave 2): source-discovery
        → Skill: research-methodology
        → Tools: tavily_search, deepwiki_ask_question, grep, glob
        → Output: 8-12 relevant sources indexed with reliability scores
      → Step 3 (wave 3): evidence-gathering
        → Skill: source-evaluation
        → Tools: read, webfetch, tavily_extract
        → Output: evidence cards with citations and confidence levels
      → Step 4 (wave 4): synthesis
        → Skill: synthesis-patterns
        → Prompt: prompts/synthesis-instruction.md
        → Output: unified findings with contradiction resolution
      → Step 5 (wave 5): report-generation
        → Template: templates/research-report-template.md
        → Output: structured research report in docs/
```

---

## 7. HiveQ Module Blueprint

### Agent Definition

| Field | Value |
|-------|-------|
| Name | `hiveq` |
| File | `agents/hiveq.md` |
| Mode | `subagent` (only delegated to — never primary) |
| Role | Quality & Verification enforcer — testing, gate enforcement, compliance checking, regression detection |
| Model preference | Fast/efficient model (gate checks need speed over depth) |
| Tool access | Read-heavy: `glob`, `grep`, `read`, `bash` (for test execution), `hivemind_inspect`, `hivemind_hierarchy` |
| Write access | Minimal: `write` (for reports only), `hivemind_memory` (for saving verification results) |

### Asset Manifest (19 assets)

**Commands (6):**

| Command | File | Purpose | Execution Context |
|---------|------|---------|-------------------|
| `/hiveq-verify` | `commands/hiveq-verify.md` | Verify phase/task completion against acceptance criteria | `workflows/hiveq-verification-pipeline.yaml` |
| `/hiveq-audit` | `commands/hiveq-audit.md` | Comprehensive audit of codebase or module against standards | `workflows/hiveq-audit-workflow.yaml` |
| `/hiveq-lint` | `commands/hiveq-lint.md` | Static analysis of framework assets (commands, workflows, skills) | `workflows/hiveq-gate-enforcement.yaml` |
| `/hiveq-gate-check` | `commands/hiveq-gate-check.md` | Run specific quality gate (type check, test suite, guard:public) | `workflows/hiveq-gate-enforcement.yaml` |
| `/hiveq-compliance` | `commands/hiveq-compliance.md` | Check compliance with framework conventions and naming rules | `workflows/hiveq-audit-workflow.yaml` |
| `/hiveq-regression` | `commands/hiveq-regression.md` | Detect regressions across recent changes | `workflows/hiveq-regression-suite.yaml` |

**Workflows (4):**

| Workflow | File | Steps | Wave Structure |
|----------|------|-------|----------------|
| Verification Pipeline | `workflows/hiveq-verification-pipeline.yaml` | criteria-extraction → evidence-collection → goal-backward-analysis → verdict-production | 4 waves, sequential |
| Audit Workflow | `workflows/hiveq-audit-workflow.yaml` | scope-definition → standard-loading → finding-collection → severity-classification → report-generation | 5 waves, sequential |
| Gate Enforcement | `workflows/hiveq-gate-enforcement.yaml` | gate-identification → command-execution → result-parsing → verdict-emission | 4 waves, sequential |
| Regression Suite | `workflows/hiveq-regression-suite.yaml` | baseline-loading → test-execution → diff-analysis → regression-reporting | 4 waves, sequential |

**Skills (4):**

| Skill | Directory | Purpose |
|-------|-----------|---------|
| Verification Methodology | `skills/verification-methodology/` | Goal-backward analysis: start from acceptance criteria, trace evidence backward to implementation |
| Gate Enforcement | `skills/gate-enforcement/` | Quality gate definitions, pass/fail logic, escalation rules for each gate type |
| Compliance Checking | `skills/compliance-checking/` | Framework convention rules, naming validation, asset cross-reference integrity |
| Regression Detection | `skills/regression-detection/` | Baseline comparison, delta analysis, impact assessment for code changes |

**Templates (3):**

| Template | File | Variables |
|----------|------|-----------|
| Verification Report | `templates/verification-report-template.md` | `{{phase}}`, `{{acceptance_criteria}}`, `{{evidence}}`, `{{verdict}}`, `{{gaps}}` |
| Audit Report | `templates/audit-report-template.md` | `{{scope}}`, `{{standards}}`, `{{findings}}`, `{{severity_counts}}`, `{{recommendations}}` |
| Gate Checklist | `templates/gate-checklist-template.md` | `{{gate_type}}`, `{{commands_run}}`, `{{results}}`, `{{pass_fail}}`, `{{blocking_issues}}` |

**Prompts (2):**

| Prompt | File | Purpose |
|--------|------|---------|
| Verification Criteria | `prompts/verification-criteria.md` | How to extract and evaluate acceptance criteria from planning artifacts |
| Compliance Rules | `prompts/compliance-rules.md` | Framework-specific rules for asset naming, structure, and cross-referencing |

**Bridge Packs (3):**

| Pack | Directory | Phase | Key Augmentation |
|------|-----------|-------|------------------|
| Unit Test Bridge | `bridges/hiveq-unit-test-bridge/` | unit-testing | Test execution bash commands, coverage analysis templates, test failure diagnosis skill |
| Integration Test Bridge | `bridges/hiveq-integration-test-bridge/` | integration-testing | Cross-module test templates, dependency graph validation, E2E flow verification |
| Release Gate Bridge | `bridges/hiveq-release-gate-bridge/` | release | `guard:public` script integration, pre-release checklist template, changelog verification |

**References (1):**

| Reference | File | Purpose |
|-----------|------|---------|
| Quality Gate Definitions | `references/quality-gate-definitions.md` | Standard definitions for each gate type, pass/fail thresholds, and escalation procedures |

### Integration with Existing Quality Gates

HiveQ wraps HiveMind's existing quality commands into structured verification chains:

| Existing Command | HiveQ Wrapping | Added Value |
|-----------------|----------------|-------------|
| `npm test` | `/hiveq-gate-check unit-tests` | Structured result parsing, failure diagnosis, regression comparison |
| `npx tsc --noEmit` | `/hiveq-gate-check type-check` | Error categorization, impact analysis, fix suggestions |
| `npm run guard:public` | `/hiveq-gate-check release-safety` | Public branch policy verification, secret detection, asset sync validation |
| Manual code review | `/hiveq-audit codebase` | Automated LOC checking, CQRS compliance, orphan detection |
| Manual acceptance check | `/hiveq-verify phase-completion` | Goal-backward analysis against planning artifacts |

### Example Chain: Phase Verification

```
/hiveq-verify "Phase B session intelligence"
  → Command: commands/hiveq-verify.md
    → execution_context: workflows/hiveq-verification-pipeline.yaml
      → Step 1 (wave 1): criteria-extraction
        → Reads: .hivemind/planning/ phase plan for Phase B
        → Output: list of acceptance criteria with IDs
      → Step 2 (wave 2): evidence-collection
        → Tools: bash (npm test), bash (npx tsc --noEmit), grep, glob
        → Output: test results, type check results, code evidence
      → Step 3 (wave 3): goal-backward-analysis
        → Skill: verification-methodology
        → Output: criteria-to-evidence mapping with coverage gaps
      → Step 4 (wave 4): verdict-production
        → Template: templates/verification-report-template.md
        → Output: structured verification report with PASS/FAIL per criterion
```

---

## 8. Asset Naming & Organization Conventions

### Naming Convention Table

| Asset Type | Pattern | Location | Example |
|------------|---------|----------|---------|
| Agents | `{name}.md` | `agents/` | `hiverd.md` |
| Commands | `{agent-prefix}-{action}.md` | `commands/` | `hiverd-research.md` |
| Workflows | `{agent-prefix}-{purpose}.yaml` | `workflows/` | `hiverd-deep-research.yaml` |
| Skills | `{domain-name}/SKILL.md` | `skills/{domain-name}/` | `research-methodology/SKILL.md` |
| Templates | `{purpose}-template.md` | `templates/` | `research-report-template.md` |
| Prompts | `{purpose}.md` | `prompts/` | `research-question-framing.md` |
| Scripts | `{purpose}.sh` or `{purpose}.ts` | `scripts/` | `validate-assets.sh` |
| References | `{topic}.md` | `references/` | `research-quality-criteria.md` |
| Bridge Packs | `{agent}-{phase}-bridge/` | `bridges/` | `hiverd-web-research-bridge/` |
| Module Defs | `module.yaml` | `modules/{module-name}/` | `modules/hiverd-research/module.yaml` |

### File Content Conventions

**Commands (`.md`):**
```yaml
---
description: "One-line purpose"
execution_context: "workflows/{workflow-file}.yaml"
required_skills:
  - "skill-name"
required_templates:
  - "templates/{template-file}.md"
chain_group: "{agent-prefix}"
entry_gate: "session_declared"
---

<objective>
What this command accomplishes in 2-3 sentences.
</objective>

<process>
Step-by-step execution instructions for the agent.
</process>
```

**Workflows (`.yaml`):**
```yaml
name: workflow-name
description: "Purpose"
target_agent: agent-name
steps:
  - id: step-id
    description: "What this step does"
    entry_criteria: "Condition that must be true before starting"
    exit_criteria: "Condition that must be true after completing"
    depends_on: []
    skills_loaded: []
    templates_applied: []
    wave: 1
```

**Skills (`SKILL.md`):**
```markdown
# Skill: skill-name

<description>
When to use this skill and what it provides.
</description>

## Instructions
Domain-specific knowledge and procedures.

## References
Links to bundled reference files in references/ subdirectory.
```

**Templates (`.md`):**
```markdown
# {{title}}

## Summary
{{summary}}

## Findings
{{findings}}

## Recommendations
{{recommendations}}
```

### Complete Framework Directory Tree

```
hivemind-plugin/               # Root — all assets synced to user projects
├── agents/                    # Agent definitions (1 per module)
│   ├── hiveminder.md
│   ├── hivefiver.md
│   ├── hiveplanner.md
│   ├── hivemaker.md
│   ├── hivexplorer.md
│   ├── hivehealer.md
│   ├── hiverd.md              # NEW
│   └── hiveq.md               # NEW
├── commands/                  # Command entry points (flat, prefixed by agent)
│   ├── hivemind-*.md          # Core governance commands (12)
│   ├── hiveminder-*.md        # Orchestrator commands
│   ├── hivefiver-*.md         # Meta-builder commands (17)
│   ├── hiverd-*.md            # Research commands (6) — NEW
│   └── hiveq-*.md             # Quality commands (6) — NEW
├── workflows/                 # Workflow step definitions (YAML)
│   ├── hivefiver-*.yaml       # Meta-builder workflows (5)
│   ├── hivemind-*.yaml        # Core workflows (2)
│   ├── hiverd-*.yaml          # Research workflows (4) — NEW
│   └── hiveq-*.yaml           # Quality workflows (4) — NEW
├── skills/                    # Domain knowledge modules
│   ├── hivefiver-*/           # Meta-builder skills (8)
│   ├── hivemind-*/            # Core governance skills (5)
│   ├── research-*/            # Research skills (4) — NEW
│   ├── verification-*/        # Verification skills (2) — NEW
│   ├── compliance-*/          # Compliance skills (1) — NEW
│   └── regression-*/          # Regression skills (1) — NEW
├── templates/                 # Output scaffolding templates
│   ├── *-template.md          # Existing (3) + new (6)
├── prompts/                   # Prompt fragments for context injection
│   ├── *.md                   # Existing (1) + new (4)
├── scripts/                   # Automation scripts
│   ├── *.sh / *.ts            # Existing (2) + new validation scripts
├── references/                # Read-only knowledge documents
│   ├── *.md                   # Existing (3) + new (2)
├── bridges/                   # Bridge Packs — NEW directory
│   ├── hivefiver-*-bridge/    # Hivefiver bridge packs (4)
│   ├── hiverd-*-bridge/       # HiveRD bridge packs (3)
│   └── hiveq-*-bridge/       # HiveQ bridge packs (3)
└── modules/                   # Module definitions — NEW directory
    ├── hivemind-core/
    │   └── module.yaml
    ├── hivefiver-meta/
    │   └── module.yaml
    ├── hiverd-research/
    │   └── module.yaml
    └── hiveq-quality/
        └── module.yaml
```

### Asset Sync Rules

| Asset Source | Sync Target | Mechanism |
|-------------|-------------|-----------|
| `agents/` | `.opencode/agents/` (project) | `sync-assets.ts` — bidirectional overwrite |
| `commands/` | `.opencode/commands/` (project) | `sync-assets.ts` — bidirectional overwrite |
| `workflows/` | `.opencode/workflows/` (project) | `sync-assets.ts` — bidirectional overwrite |
| `skills/` | `.opencode/skills/` (project) OR `~/.config/opencode/skills/` (global) | `sync-assets.ts` — scope-dependent |
| `templates/` | `.opencode/templates/` (project) | `sync-assets.ts` — bidirectional overwrite |
| `prompts/` | `.opencode/prompts/` (project) | `sync-assets.ts` — bidirectional overwrite |
| `bridges/` | `.opencode/bridges/` (project) | `sync-assets.ts` — NEW sync path needed |
| `modules/` | Not synced — internal organizational metadata | N/A |

### Governance Rules

- **NO date-stamps in filenames** — assets use `{prefix}-{purpose}` naming only
- **NO orphan assets** — every asset must be referenced by at least one module definition
- **Atomic git commits** — asset creation/modification results in a single commit per logical change
- **Version control** — all assets under `dev-v3` branch; `master` only via `guard:public` gate

---

## 9. Integration with Existing HiveMind Systems

### Layer Integration Map

Chain & Bridge executes through HiveMind's existing 4-layer architecture without modifying it:

```
                     Chain Execution Flow
                           │
    ┌──────────────────────┼──────────────────────────┐
    │  Layer 1: Hooks      │                          │
    │                      ▼                          │
    │  H01/H02 ──► Session context loaded             │
    │  H05/H06 ──► Bridge Pack context injected       │
    │  H07     ──► Chain entry gate evaluated          │
    │  H08     ──► Tool mutation gate checked          │
    │  H11/H12 ──► Command chain link traced           │
    │  H13/H14 ──► Bridge agent transitions logged     │
    │  H16     ──► Chain health + drift monitored      │
    ├─────────────────────────────────────────────────┤
    │  Layer 2: Tools      │                          │
    │                      ▼                          │
    │  hivemind_session ──► Chain session tracking     │
    │  hivemind_memory  ──► Chain evidence storage     │
    │  hivemind_anchor  ──► Chain decision anchoring   │
    │  hivemind_hierarchy ► Chain task tree updates    │
    │  hivemind_cycle   ──► Chain export archival      │
    ├─────────────────────────────────────────────────┤
    │  Layer 3: SDK        │                          │
    │                      ▼                          │
    │  ctx.client.session ► Bridge pack loading        │
    │  ctx.client.tui     ► Chain progress display     │
    │  ctx.client.event   ► Gate event streaming       │
    ├─────────────────────────────────────────────────┤
    │  Layer 4: TUI        │                          │
    │                      ▼                          │
    │  Chain execution timeline visualization         │
    │  Gate pass/fail indicators                       │
    │  Bridge pack status display                      │
    └─────────────────────────────────────────────────┘
```

### Hook-to-Chain Point Mapping

| Hook | Chain Point | Fires When | Data Consumed |
|------|------------|------------|---------------|
| H01 `session.init` | Chain initialization | Session starts, chain context needs loading | Previous chain state, active bridge packs |
| H02 `session.resume` | Chain resumption | Resumed session has active chain | Chain checkpoint data |
| H05 `system.transform` | Bridge context injection | Every turn — injects bridge pack prompts into system message | Active bridge pack manifest, loaded skill summaries |
| H06 `messages.transform` | Chain task mapping | Every turn — maps user prompt to active chain step | Current chain step, entry criteria, expected output |
| H07 `chat.preflight` | Chain entry gate | Before LLM processes prompt | Entity checklist, session declaration status, chain validity |
| H08 `tool.call.pre` | Chain mutation gate | Before any tool executes | Tool permission scope, chain step authorization |
| H09 `tool.call.post` | Chain evidence capture | After tool returns | Tool result for audit trail emission |
| H11 `command.pre` | Chain command link | Command invocation starts chain | Command frontmatter, execution_context resolution |
| H12 `command.post` | Chain command completion | Command chain finishes | Chain completion status, output artifact reference |
| H13 `agent.delegate.pre` | Bridge agent transition | Subagent delegation with bridge | Target agent, bridge pack selection |
| H14 `agent.delegate.post` | Bridge return processing | Subagent returns | Delegation result, bridge pack unload trigger |
| H16 `governance.audit.tick` | Chain health monitoring | Periodic governance check | Chain drift score, step staleness, bridge pack validity |

### Entity Model Integration

Chain executions map to HiveMind's graph entity model:

| Chain Event | Graph Entity Created | Parent FK | Purpose |
|-------------|---------------------|-----------|---------|
| Chain starts | `TaskNode` | `PlanNode.id` | Tracks chain as a task with acceptance criteria |
| Step completes | `SubtaskNode` (A-G type) | `TaskNode.id` | Records step completion with evidence |
| Bridge loads | `DelegationNode` | `TaskNode.id` | Records context switch with bridge pack reference |
| Chain output produced | `VerificationNode` | `TaskNode.id` | Links output artifact to verification status |
| Gate verdict emitted | `MemNode` | `TrajectoryNode.session_id` | Persists gate decision for audit replay |

### CQRS Preservation

Chain & Bridge does NOT violate HiveMind's CQRS contract:

| Concern | Who Handles | CQRS Role |
|---------|-------------|-----------|
| Chain governance (gates, checks) | Hooks (Layer 1) | **Read-only** — observe and gate, never mutate |
| Bridge pack loading/unloading | Hooks + SDK (Layer 1 + 3) | **Read-only** — inject context, never persist |
| Chain state mutations | Tools (Layer 2) | **Write-path** — all durable changes go through tools |
| Chain evidence storage | Tools (Layer 2) | **Write-path** — audit records persisted via tools |
| Chain progress display | TUI (Layer 4) | **Read-only** — display only, no mutation |

### Migration Path

Migrating from current flat assets to full Chain & Bridge:

| Phase | Action | Files Affected | Risk |
|-------|--------|---------------|------|
| **Phase 1** | Add `execution_context` to existing command frontmatter | `commands/*.md` (30 files) | Low — additive metadata only |
| **Phase 2** | Add `entry_criteria` and `exit_criteria` to existing workflows | `workflows/*.yaml` (7 files) | Low — additive metadata only |
| **Phase 3** | Create `bridges/` directory with 4 hivefiver bridge packs | New directory + 4 pack.yaml files | Low — new assets, no modifications |
| **Phase 4** | Create `modules/` directory with module definitions | New directory + module.yaml files | Low — organizational metadata only |
| **Phase 5** | Implement HiveRD agent + 19 assets | `agents/hiverd.md` + 18 new files | Medium — new functionality |
| **Phase 6** | Implement HiveQ agent + 19 assets | `agents/hiveq.md` + 18 new files | Medium — new functionality |
| **Phase 7** | Update `sync-assets.ts` to handle `bridges/` and `modules/` | `src/cli/sync-assets.ts` | Medium — code change to existing file |
| **Phase 8** | Wire hook integration for chain governance | `src/hooks/event-handler.ts`, `src/hooks/tool-gate.ts` | High — runtime behavior change |
| **Phase 9** | Full module composition validation | All module.yaml files | Low — validation only |

### Backward Compatibility

Chain & Bridge is fully additive:

- Existing commands without `execution_context` continue to work as standalone prompts — no chain governance applied
- Existing workflows without `entry_criteria`/`exit_criteria` execute without step-level gating
- Agents without bridge packs use their base profile exclusively
- The `bridges/` and `modules/` directories are new — no existing files modified
- Hook integration (Phase 8) is the only runtime change, and it degrades gracefully when chain metadata is absent

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Chain** | Sequential execution linking: Command → Workflow → Skill → Template → Output. Deterministic path. |
| **Bridge** | Dynamic context injection: asset pack that augments an agent's operating context for a specific phase/domain. |
| **Bridge Pack** | A directory containing `pack.yaml` manifest + phase-specific workflows, prompts, templates, references, and skills. |
| **Chain Link** | A single step in a chain with typed input/output contracts and governance hook bindings. |
| **Chain ID** | Unique identifier for a chain execution, used for traceability across audit records and entity graph. |
| **Gate** | A governance checkpoint at a chain link transition. Types: auto-gate, soft-gate, hard-gate, human-gate. |
| **Module** | A self-contained unit: one agent + all its commands, workflows, skills, templates, prompts, scripts, references, and bridges. |
| **Wave** | A dependency tier in workflow execution. Steps in the same wave may execute in parallel if independent. |
| **Pack Manifest** | The `pack.yaml` file declaring a bridge pack's target agent, phase, assets, and entry/exit criteria. |

---

## Appendix B: Related Documents

| Document | Path | Relationship |
|----------|------|-------------|
| HiveMind Framework System Prompt | `HIVEMIND-FRAMEWORK.md` | Constitutional foundation — agent roster, command groups, GSD/BMAD synthesis mandate |
| 4-Layer Architecture & Hook Taxonomy | `docs/planning-draft/forming-the-own-framework.md` | Technical substrate — hook classification, CQRS contracts, layer responsibility contracts |
| Entity Model & Task Taxonomy | `.planning/SYSTEM-DATA-ENTITIES-DATA-FLOW.md` | Data model — 8 entities, 18 task types, wave execution, delegation hierarchy |
| Source Architecture Audit | `docs/audit/2026-02-25-source-architecture-audit.md` | Current state — LOC violations, CHIMERA-1, CQRS gaps, spec coverage |
| Audit Integration Document | `docs/audit/2026-02-25-audit-integration-document.md` | Plan alignment — audit findings mapped to v2.9 phases |
