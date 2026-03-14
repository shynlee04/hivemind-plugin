# HiveFiver V2 Meta-Builder Module — Phase-Implementation Planning Artifact (Revised)

> **Date**: 2026-03-01
> **Status**: ACTIVE
> **Revision**: 2.0 — incorporates all 10 user feedback points (FB-1 through FB-10)
> **Base**: Original planning artifact from prior session + user comments + GSD command research

---

## I. CURRENT STATE ASSESSMENT (What We Have, What's Broken)

### Inventory Summary

| Asset Type | Count | Working | Polluted/Stub | Broken References |
| --- | --- | --- | --- | --- |
| Commands | 19 | 12 | 7 hollow aliases | 0 |
| Skills | 11 | 9 functional | 1 stub (19L) | 15 missing ref files |
| Workflows (YAML) | 5 | 5 | 0 | 5 broken skill refs |
| Agent profile | 1 | 1 (361L, bloated) | — | — |
| Templates | 0 hivefiver-specific | — | — | — |
| References | 0 hivefiver-specific | — | — | — |
| **TOTALS** | **36** | **27** | **8** | **20** |

### Chain Health: 72% working, 19% polluted aliases, 3% stub, 6% broken references

### Critical Structural Problems Found

**Problem 1 — Skill Avalanche (Anti-Pattern D-02)**

`meta-builder-governance` (191L, ~4,500 tokens) is in `required_skills` of **every utility command**. Even a simple `/hivefiver tutor` loads 4,500 tokens of governance context. This violates the progressive disclosure principle — governance context should load ONLY when modifying framework assets.

**Problem 2 — `subtask: true` Breaks Skill Inheritance**

All utility commands have `subtask: true`, creating isolated child sessions. The root router's skills are NOT inherited. Each command must redundantly declare its own `required_skills`. If a skill is added to the router but not to a sub-command → silent chain break.

**Problem 3 — 7 Hollow Alias Commands**

`hivefiver-build`, `hivefiver-deploy`, `hivefiver-validate`, `hivefiver-audit`, `hivefiver-architect`, `hivefiver-spec`, `hivefiver-workflow` — all have frontmatter but **empty bodies**. They exist as OpenCode command files but execute nothing beyond what the root router already does.

**Problem 4 — 15 Missing Reference Files**

Skills reference files like `references/persona-matrix.md`, `templates/evidence-table.md`, `references/domain-pack-matrix.md` that **don't exist**. This means progressive disclosure has no depth to disclose.

**Problem 5 — 5 Broken Workflow Skill References**

All 4 persona workflows reference `source-evaluation` and `research-methodology` as skill bundles — neither exists. The MCP fallback workflow references `systematic-debugging-hivemind` — also doesn't exist.

**Problem 6 — No Templates or References**

Zero delegation templates. Zero HiveFiver-specific references. Subagents receive unstructured context. No consistent output formats.

**Problem 7 — Agent Profile Bloat**

`hivefiver.md` agent profile is 361L, mixing process instructions (belongs in workflows), governance rules (belongs in skills), and reference data (belongs in references). The agent body loads ONCE at session init, so 361L is permanently consuming context.

---

## II. REQUIREMENTS: Pain Points → Use Cases → Acceptance Criteria → Success Metrics

### Pain Point Matrix

| ID | Pain Point | Evidence | Impact |
| --- | --- | --- | --- |
| P1 | Skills load unnecessary context at runtime — they fetch everything regardless of what stage the user is in | `meta-builder-governance` (4,500 tokens) loaded for EVERY command | Context pollution, slower responses, reduced effective working memory |
| P2 | Skills are scattered and don't chain — invoking one doesn't lead to the next | 11 isolated skills with no routing logic between them | User must manually invoke each skill, no flow |
| P3 | Commands are hollow — 7 aliases with empty bodies | Frontmatter-only files that duplicate root router actions | Namespace pollution, confusing `/hivefiver` experience |
| P4 | No progressive disclosure — either all context loads or none | No templates, no references, no depth layers | Agents either starve for context or drown in it |
| P5 | Agent profile is a monolith — 361L of mixed concerns | Process steps, governance, references all in agent body | Permanent context cost, can't update individual concerns |
| P6 | Delegation is unstructured — subagents get ad-hoc prompts | Zero delegation templates | Inconsistent subagent behavior, context loss |
| P7 | Chain integrity is unverifiable — no deterministic validation | No scripts, no automated checks | Broken chains discovered only at runtime |
| P8 | **(NEW — FB-8)** Investigation/research/synthesis artifacts evaporate between sessions | No persistent artifact store, no relational context graph, no STATE tracking | Re-investigation wastes tokens, gaps compound, hallucination risk increases |
| P9 | **(NEW — FB-5)** No deterministic turn-start protocol — agents jump to implementing without verifying alignment | No Gate 0 in any workflow or command | Drift, misalignment, wasted execution on wrong intent |

### Use Cases (What Framework Operators Actually Do)

| UC | Use Case | Entry Point | Chain Path | Expected Result |
| --- | --- | --- | --- | --- |
| UC-1 | **Start a new meta-building engagement** | `/hivefiver start` | command → start workflow → persona detection → intake questions → CONTEXT.md written | Operator has a scanned project context, detected persona, and locked decisions |
| UC-2 | **Gather and lock requirements** | `/hivefiver intake` | command → intake workflow → question loops → decision locking → requirement artifacts | Structured requirements with decision log and ambiguity map |
| UC-3 | **Distill spec from requirements** | `/hivefiver spec` | command → spec workflow → spec distillation → acceptance criteria derivation | Structured spec with testable acceptance criteria |
| UC-4 | **Design module architecture** | `/hivefiver architect` | command → architect workflow → dependency graph → wave plan → asset manifest | Architecture doc with dependency graph and implementation waves |
| UC-5 | **Build framework assets** | `/hivefiver build` | command → build workflow → wave execution → contract validation → parity sync | Created/modified assets validated against contracts |
| UC-6 | **Audit framework health** | `/hivefiver audit` | command → audit workflow → scan → contract checks → drift detection → report | Health report with severity-ranked findings |
| UC-7 | **Diagnose and fix issues** | `/hivefiver doctor` | command → doctor workflow → diagnosis → fix proposals → execution → verification | Fixed issues with verification evidence |

### Acceptance Criteria (Per Use Case)

**UC-1 (Start):**

- [ ] `/hivefiver start` scans project, detects persona lane, writes initial CONTEXT.md
- [ ] Persona detection uses structured questions, not guessing
- [ ] CONTEXT.md contains: project type, detected stack, operator persona, initial scope
- [ ] Chain proceeds to intake automatically

**UC-2 (Intake):**

- [ ] `/hivefiver intake` runs structured question loops
- [ ] Each decision gets locked with timestamp and rationale
- [ ] Ambiguity map generated for unresolved items
- [ ] Output follows spec-output template

**UC-3 (Spec):**

- [ ] `/hivefiver spec` takes intake output, distills structured spec
- [ ] Every requirement has at least one acceptance criterion
- [ ] Ambiguity map tags unresolved items for escalation
- [ ] Spec format follows architecture-output template

**UC-4 (Architect):**

- [ ] `/hivefiver architect` produces dependency graph
- [ ] Wave plan orders assets by dependency (no forward references)
- [ ] Each wave has entry/exit criteria
- [ ] Asset manifest lists every file to create/modify/delete

**UC-5 (Build):**

- [ ] `/hivefiver build` executes waves sequentially
- [ ] Each wave validates contracts before proceeding
- [ ] Parity sync runs after each wave
- [ ] Evidence collected for each asset created

**UC-6 (Audit):**

- [ ] `/hivefiver audit` scans all `.opencode/` assets
- [ ] Contract validation runs for agents, commands, workflows, skills
- [ ] Drift detection compares `.opencode/` vs root parity
- [ ] Report follows audit-report template with severity ranking

**UC-7 (Doctor):**

- [ ] `/hivefiver doctor` diagnoses issues from audit findings
- [ ] Fix proposals presented before execution
- [ ] Each fix verified with evidence (test pass, contract valid, etc.)
- [ ] Report shows before/after state

### Success Metrics

| Metric | Target | How Measured |
| --- | --- | --- |
| **Chain Completeness** | 100% of commands reach their workflow end-state | Manual chain walk-through for all 7 use cases |
| **Context Efficiency** | No command loads >2,000 tokens of skill context at entry | Token count of `required_skills` per command |
| **Progressive Disclosure** | 3 depth levels (metadata → SKILL.md → references) operational | Verify loading triggers in skill body |
| **Broken Links** | 0 references to non-existent files | Grep for `@path` and `references/` across all assets |
| **Parity Sync** | 100% match between `.opencode/` and root mirrors | Diff check |
| **Delegation Consistency** | 100% of subagent calls use delegation templates | Manual review of delegation points in workflows |
| **Contract Compliance** | All commands have valid frontmatter, all skills have description + triggers | Schema validation pass |

---

## III. MODULE ARCHITECTURE — What Each Asset Type Does, How Chains Work

### The Deterministic Chain Model (From OpenCode Source Code Analysis)

```
USER INVOKES /command
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  COMMAND (orchestration hub ~40-80L)                        │
│  ├── YAML frontmatter: agent, allowed-tools, argument-hint  │
│  ├── <objective>: what this does, orchestrator role          │
│  ├── <execution_context>: @path symlinks to workflow +      │
│  │    references + templates (stacked, appended, chained)   │
│  ├── <context>: $ARGUMENTS, flags, state resolution         │
│  ├── <process>: execute workflow end-to-end, preserve gates │
│  └── <success_criteria>: what must be true on completion    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW (progressive process script ~150-500L)            │
│  ├── Step 1: Gate 0 — alignment verification (FB-5)        │
│  ├── Step 2: Load context (skill, reference, template)      │
│  ├── Step 3: Execute with delegation                        │
│  │   └── Delegation uses TEMPLATE to structure subagent     │
│  ├── Step 4: Validate output against contract               │
│  ├── Step 5: Persist artifacts (FB-8)                       │
│  ├── Step 6: Exit gate → handoff to next command            │
│  └── Each step has: entry_criteria, action, exit_criteria   │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  TEMPLATE    │ │  REFERENCE   │ │    SKILL     │
│  (structure) │ │  (deep know) │ │  (memory)    │
│  delegation  │ │  loaded when │ │  persists    │
│  packets,    │ │  workflow    │ │  across      │
│  output      │ │  step needs  │ │  compaction  │
│  formats     │ │  depth       │ │  NEVER       │
│  ~50-100L    │ │  ~100-300L   │ │  pruned      │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Command Design Pattern — Orchestration Hubs (REVISED per FB, per GSD evidence)

The original plan called for "thin ~40L" commands. **This was wrong.** Research into GSD's command architecture reveals that commands are **orchestration hubs** — they:

1. **Stack `@path` symlinks** to workflows, references, and templates in `<execution_context>` — these all get appended into the command's context
2. **Define structured sections**: `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>`
3. **Assign dedicated agents** via `agent:` frontmatter for domain-specific framing
4. **Declare explicit `allowed-tools`** for fine-grained permission control
5. **Parse arguments and flags** with routing logic
6. **Regulate artifact flow** — they are the connectors that enforce what documents get read, what templates get used, what patterns get followed

**GSD Evidence** (from `commands/gsd/plan-phase.md`):
```yaml
---
name: gsd:plan-phase
description: Create detailed phase plan (PLAN.md) with verification loop
argument-hint: "[phase] [--auto] [--research] [--skip-research] [--gaps]"
agent: gsd-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
<objective>
Create executable phase prompts (PLAN.md files) with integrated research and verification.
**Orchestrator role:** Parse arguments, validate phase, research domain, spawn planner, verify, iterate.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/plan-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<process>
Execute the plan-phase workflow end-to-end. Preserve all workflow gates.
</process>
```

**GSD Evidence** (from `commands/gsd/new-project.md`):
```yaml
<execution_context>
@~/.claude/get-shit-done/workflows/new-project.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/requirements.md
</execution_context>
```

This means our HiveFiver commands must follow the same pattern — they're NOT thin wrappers, they're **regulatory gateways** that stack workflows + references + templates.

### How Progressive Disclosure Works (5 Layers)

| Layer | What Loads | When | Token Cost | Mechanism |
| --- | --- | --- | --- | --- |
| **L0 — Discovery** | Skill name + description only | Always (all skills scanned) | ~100/skill | OpenCode skill registry |
| **L1 — Triage** | SKILL.md body | When LLM matches description to task | ~500-2K | `skill("name")` tool call |
| **L2 — Command** | Command body + all `@path` symlinks (workflow, refs, templates) | When command executes | ~2K-8K | Stacked `@path` interpolation |
| **L3 — Reference** | Additional reference files | When workflow step says "MANDATORY — READ" | ~1K-5K | Explicit `Read` tool call by agent |
| **L4 — Deep** | Full reference bundle | Full audit/doctor mode only | ~5K-15K | Agent reads multiple reference files |

**Key Insight**: Skills are the ONLY asset type that survives compaction. Everything else (commands, workflows, templates, references) is ephemeral. This means skills should contain **what to remember**, not **what to do**.

### What Each Asset Type Does in This Module

### 1. Commands (8 total: 1 router + 7 orchestration hubs)

**Purpose**: Orchestration hubs. Parse user intent. Stack `@path` symlinks to workflows + references + templates. Regulate artifact flow. Assign agents. Enforce tool permissions. Define success criteria.

**Design Rule**: Commands are orchestration hubs (~40-80L). They contain:

- YAML frontmatter: `name`, `description`, `argument-hint`, `agent` (optional), `allowed-tools`
- `<objective>`: what this command does, orchestrator role, what gets created
- `<execution_context>`: `@path` symlinks stacked — workflow + references + templates
- `<context>`: `$ARGUMENTS`, flags, state file resolution, context file paths
- `<process>`: execute workflow end-to-end, preserve all gates
- `<success_criteria>`: what must be true on completion

**Why orchestration hubs?** Commands are the regulatory gateway. They determine: which agent runs, which tools are available, which workflow drives the process, which references and templates are loaded into context, what flags control behavior. The workflow handles step-by-step logic, but the command handles **what gets loaded and who drives it**.

| Command | Agent | Stacked @paths | Delegation |
| --- | --- | --- | --- |
| `/hivefiver` | hivefiver | router logic only | Dispatches to sub-commands |
| `/hivefiver start` | hivefiver | workflow/start.md + ref/persona-matrix.md + tpl/delegation-investigation.md | hivexplorer (project scan) |
| `/hivefiver intake` | hivefiver | workflow/intake.md + ref/questioning-patterns.md + tpl/spec-output.md | None (interactive) |
| `/hivefiver spec` | hivefiver | workflow/spec.md + tpl/spec-output.md + tpl/delegation-research.md | hiverd (research) |
| `/hivefiver architect` | hivefiver | workflow/architect.md + ref/asset-contracts.md + tpl/architecture-output.md + tpl/delegation-planning.md | hiveplanner (planning) |
| `/hivefiver build` | hivefiver | workflow/build.md + ref/governance-rules.md + ref/asset-contracts.md | hivefiver (self-checkpoint) |
| `/hivefiver audit` | hivefiver | workflow/audit.md + ref/governance-rules.md + ref/asset-contracts.md + tpl/audit-report.md + tpl/delegation-investigation.md | hivexplorer (scan) |
| `/hivefiver doctor` | hivefiver | workflow/doctor.md + ref/governance-rules.md + tpl/audit-report.md + tpl/delegation-investigation.md | hivehealer (remediation) |

### 2. Workflows (7 markdown files)

**Purpose**: Progressive process scripts. The BRAIN of each operation. Contain step-by-step instructions with entry/exit criteria, delegation prompts using templates, and explicit reference loading triggers.

**Design Rule**: Workflows are MEDIUM-LARGE (~150-500L). They contain:

- **Gate 0: Alignment Verification** (FB-5) — EVERY workflow starts with this
- Numbered steps with `entry_criteria` and `exit_criteria`
- `MANDATORY — READ @reference` triggers (progressive disclosure L3)
- `DO NOT LOAD @reference` anti-triggers (prevent skill avalanche)
- Delegation blocks that reference template files
- Artifact persistence instructions (FB-8) — what to save, where to save it
- Handoff instructions to next command

**Why markdown, not YAML?** YAML workflows are rigid step-lists. Markdown workflows support:

- Conditional branching ("If persona is vibecoder → skip step 3")
- Inline decision trees
- Template references with context framing
- Human-readable process documentation

### 3. Templates (6 files)

**Purpose**: Structure delegation context for subagents. Ensure consistent output formats. Prevent context loss across delegation boundaries.

**Design Rule**: Templates are STRUCTURAL (~50-100L). They contain:

- Delegation packet fields (objective, in_scope, out_scope, constraints, return_schema)
- Output format definitions (sections, fields, required evidence)
- Nothing else — no process logic, no governance rules.

| Template | Used By | Structures What |
| --- | --- | --- |
| `delegation-research.md` | spec, architect workflows | hiverd subagent prompt |
| `delegation-planning.md` | architect, build workflows | hiveplanner subagent prompt |
| `delegation-investigation.md` | start, audit, doctor workflows | hivexplorer subagent prompt |
| `spec-output.md` | spec workflow | Structured spec format |
| `architecture-output.md` | architect workflow | Architecture decision record |
| `audit-report.md` | audit, doctor workflows | Health report format |

### 4. Skill (1 orchestrator skill — Navigation pattern)

**Purpose**: Context amplifier that PERSISTS across compaction. Contains what agents need to REMEMBER, not what they need to DO. Routes to specialized sub-files when depth is needed.

**Design Rule**: Navigation pattern (~30L SKILL.md + references/). Contains:

- Mode router table (which reference to load for which operation)
- Anti-patterns with NEVER list
- Persona memory markers
- Stage awareness markers
- Gate 0 alignment protocol (FB-5) — this survives compaction
- Skill-first mandate (FB-2) — always find-skill before building

**Skill-first approach (FB-2)**: Before creating any new skill, the orchestrator must check:
1. Is there an existing skill in the library? (`skill-creator`, `skill-judge`, `writing-skills`)
2. Can `find-skill` locate one? (external repos, skills.sh)
3. If external, validate against OpenCode docs before installing
4. Only synthesize custom if nothing exists

**What goes IN the SKILL.md (~30L):**

- Mode router table: `{ guard → governance-rules.md, audit → asset-contracts.md, route → persona-matrix.md }`
- 5-item NEVER list (critical anti-patterns only)
- Stage markers (start → intake → spec → architect → build → audit → doctor)
- Persona memory slot (vibecoder/floppy/enterprise)
- Gate 0 reminder: "Before ANY execution, verify intent + context 100%"

**What goes in `references/` (loaded on demand):**

- `governance-rules.md` — contract checks, blocked anti-patterns, parity protocol
- `asset-contracts.md` — agent/command/workflow/skill contract schemas
- `persona-matrix.md` — persona detection scoring, lane profiles, domain mappings

### 5. References (1 new + keep existing 5)

**Purpose**: Deep knowledge loaded ONLY when a workflow step explicitly triggers it or when a command stacks it via `@path` in `<execution_context>`. Contain domain knowledge, contract schemas, pattern libraries.

**Design Rule**: References are DEEP (~100-300L). They contain domain-specific knowledge, contract schemas, pattern libraries. Line count noted in loading triggers so agents know context cost.

### 6. Agent Profile (1, simplified)

**Purpose**: Identity + permissions + delegation topology. Loads ONCE at session init.

**Design Rule**: Agent body should be ~150L (down from 361L). Contains:

- What this agent does (3-5 sentences)
- Delegation topology (which subagents, when)
- Permission boundaries (deny-by-default)
- **Agent team design rules (FB-9)**:
  - `mode: all` for downstream delegation with explicit constraints
  - `hidden: true` for agents not user-initiated
  - Anti-infinite-delegation: explicit `delegate_targets` list, no recursive delegation
  - Anti-shallow body: agent body must contain enough context to frame the agent's role without relying solely on skills
- Nothing else — process goes in workflows, governance goes in skill, reference data goes in references

### How Delegation Steering Works

```
hivefiver (orchestrator)
    │
    ├── hivexplorer (investigation)
    │   ├── Triggered by: start, audit, doctor workflows
    │   ├── Template: delegation-investigation.md
    │   ├── Returns: findings, file references, broken links
    │   └── No further delegation allowed
    │
    ├── hiverd (research)
    │   ├── Triggered by: spec, architect workflows
    │   ├── Template: delegation-research.md
    │   ├── Returns: evidence table, confidence score, sources
    │   └── No further delegation allowed
    │
    ├── hiveplanner (planning)
    │   ├── Triggered by: architect, build workflows
    │   ├── Template: delegation-planning.md
    │   ├── Returns: dependency graph, wave plan, risk assessment
    │   └── No further delegation allowed
    │
    └── hivefiver (self-checkpoint)
        ├── Triggered by: build workflow (checkpoint-resume pattern ONLY)
        ├── Template: none (uses checkpoint state)
        └── Returns: wave completion status, evidence
```

---

## IV. REMOVAL RATIONALE — Because-We-Have-This → These-Are-Removed

### Commands to Remove (11)

| Remove | Lines | Reason | Replaced By |
| --- | --- | --- | --- |
| `hivefiver-init.md` | 36 | Backward-compat alias → root router already handles `init` action | Root router action table maps `init` → `/hivefiver start` |
| `hivefiver-validate.md` | 29 | Empty body alias | Root router + audit/doctor commands handle validation |
| `hivefiver-deploy.md` | 28 | Empty body alias | Not a meta-builder concern (deployment = product scope) |
| `hivefiver-workflow.md` | 28 | Alias to skillforge with no added value | Root router + architect command |
| `hivefiver-ideate.md` | 47 | Creative ideation is a general capability, not meta-builder specific | General `/ideate` or brainstorming skill |
| `hivefiver-tutor.md` | 72 | Teaching is not meta-building | General skill or reference document |
| `hivefiver-skillforge.md` | 75 | Skill composition already covered by `skill-creator` ecosystem | Standard skill-creator + skill-judge patterns |
| `hivefiver-specforge.md` | 93 | Replaced by `/hivefiver spec` with proper workflow | New spec workflow handles this better |
| `hivefiver-gsd-bridge.md` | 59 | GSD concepts explicitly banned from import | Remove GSD dependency entirely |
| `hivefiver-ralph-bridge.md` | 70 | Ralph integration not part of meta-builder core | Optional separate module if needed |
| `hivefiver-research.md` | 95 | References polluted skills, has `subtask: true` | Research is a delegation target (hiverd), not a command |

**Evidence**: The root router (`hivefiver.md`, 126L) already contains a Pre-Gate Matrix and action routing table that covers `init → start+intake`, `build → gsd-bridge`, `validate → ralph-bridge`. The 7 hollow aliases add no behavior — they're frontmatter-only files that the router already handles. The 4 specialized commands (tutor, skillforge, specforge, research) handle concerns that belong in general-purpose skills or delegation targets, not in the meta-builder command surface.

### Skills to Remove (11)

| Remove | Lines | Reason | Useful Content Merged To |
| --- | --- | --- | --- |
| `hivefiver-persona-routing` | 176 | Inline scoring algorithm + MCQ rules + lane profiles = context pollution | Persona matrix → `references/persona-matrix.md`; routing table → orchestrator SKILL.md |
| `meta-builder-governance` | 191 | 10 anti-patterns + 4 contract tables + parity protocol = ~4,500 tokens loaded EVERY command | Governance → `references/governance-rules.md`; contracts → `references/asset-contracts.md`; NEVER list (5 items) → orchestrator SKILL.md |
| `hivefiver-bilingual-tutor` | 35 | Stub, insufficient for task, not meta-builder concern | Remove entirely |
| `hivefiver-domain-pack-router` | 36 | References non-existent `domain-pack-matrix.md` and `domain-pack-output.md` | Domain routing logic → start workflow conditional |
| `hivefiver-gsd-compat` | 28 | GSD concepts banned, references non-existent `gsd-lifecycle-map.md` | Remove entirely |
| `hivefiver-mcp-research-loop` | 52 | Stub, references non-existent `provider-matrix.md` and `evidence-table.md` | Research delegation → `templates/delegation-research.md` |
| `hivefiver-ralph-tasking` | 42 | Ralph integration not core, references non-existent `prd-json-rules.md` | Remove entirely |
| `hivefiver-skill-auditor` | 37 | Skill auditing covered by standard `skill-judge` | Use standard skill-judge directly |
| `hivefiver-spec-distillation` | 37 | Replaced by spec workflow with proper progressive disclosure | Spec logic → `workflows/hivefiver/spec.md` |
| `agent-role-boundary` | 19 | Stub (4 sentences), no enforcement logic | Role boundaries → agent profile permissions |
| `verification-methodology` | 61 | Verification logic belongs in workflow exit criteria, not standalone skill | Exit criteria in each workflow step |

**Evidence**: The total token cost of loading all 11 skills is ~16,000 tokens. The replacement architecture loads ~700 tokens (orchestrator SKILL.md) by default and loads references ONLY when a specific workflow step or command `<execution_context>` requires depth. That's a **95% reduction** in default context load.

---

## V. COMPOUND + ATOMIC CYCLE ARCHITECTURE (NEW — FB-1, FB-4)

### The Compound Cycle Protocol

Every phase (except Phase 0) follows this compound cycle. This is modeled after GSD's lifecycle but adapted for meta-builder operations — NOT importing GSD semantics, synthesizing the approach.

```
┌─ COMPOUND CYCLE (per phase) ──────────────────────────────────────┐
│                                                                    │
│  1. VERIFY PRIOR (if not Phase 0)                                 │
│     └─ Integration check: prior phase outputs exist and valid     │
│     └─ Grep for broken refs introduced by prior phase             │
│     └─ Parity spot-check on changed files                         │
│                                                                    │
│  2. GATE 0: ALIGNMENT (FB-5 — non-negotiable)                    │
│     └─ Intent + context 100% clarified                            │
│     └─ If ANY ambiguity → STOP, surface grey areas, QA            │
│     └─ No "hold on, the user meant..." — that = drift             │
│     └─ TODO spawned and active                                    │
│                                                                    │
│  3. INVESTIGATE + RESEARCH → SYNTHESIZE (FB-3)                    │
│     └─ Audit meta concepts relevant to this phase                 │
│     └─ Find-skill before building (FB-2, FB-10)                   │
│     └─ Research if needed → synthesize findings                   │
│     └─ Context verification: do we have everything needed?        │
│                                                                    │
│  4. PLAN (atomic or compound) (FB-6)                              │
│     └─ Plan traces up to UCs, down to files, across to deps      │
│     └─ Plans are SOTO — living iterative documents                │
│     └─ If atomic exists but no compound → compound first          │
│                                                                    │
│  5. EXECUTE (atomic cycles)                                       │
│     └─ Each file creation = one atomic cycle                      │
│     └─ Atomic: write → validate contract → evidence               │
│     └─ TODO update after each atomic completion                   │
│                                                                    │
│  6. VALIDATE                                                      │
│     └─ Exit gate checks per phase                                 │
│     └─ Parity sync where applicable                               │
│     └─ Chain walk for affected UCs                                │
│                                                                    │
│  7. PERSIST ARTIFACTS (FB-8)                                      │
│     └─ Update this plan file with completion status               │
│     └─ Investigation/research outputs saved to docs/plans/        │
│     └─ Traceability matrix updated                                │
│     └─ State persisted for next session recovery                  │
│                                                                    │
│  8. HARD STOP checkpoint                                          │
│     └─ Phase complete or blocked                                  │
│     └─ Next phase entry conditions documented                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Traceability Matrix (FB-6)

| Asset | Traces To UC | Traces To Pain Point | Phase |
|-------|-------------|---------------------|-------|
| `/hivefiver` router | All UCs | P3 (hollow aliases) | 2 |
| `/hivefiver start` + start.md workflow | UC-1 | P1, P4, P5 | 1, 2 |
| `/hivefiver intake` + intake.md workflow | UC-2 | P1, P4, P6 | 2, 4 |
| `/hivefiver spec` + spec.md workflow | UC-3 | P1, P4, P6 | 2, 4 |
| `/hivefiver architect` + architect.md workflow | UC-4 | P1, P4, P6 | 2, 4 |
| `/hivefiver build` + build.md workflow | UC-5 | P1, P4, P6 | 2, 4 |
| `/hivefiver audit` + audit.md workflow | UC-6 | P1, P4, P7 | 1, 2 |
| `/hivefiver doctor` + doctor.md workflow | UC-7 | P1, P4, P7 | 1, 2 |
| Orchestrator skill | All UCs | P1 (avalanche), P2 (no routing) | 0 |
| Delegation templates | UC-1,3,4,5,6,7 | P6 (unstructured delegation) | 1 |
| Output templates | UC-2,3,4,6 | P4 (no progressive disclosure) | 1 |
| 11 command deletions | — | P3 (hollow aliases) | 3 |
| 11 skill deletions | — | P1 (avalanche), P5 (bloat) | 3 |
| Agent profile rewrite | All UCs | P5 (monolith agent) | 3 |
| Artifact persistence model | All UCs | P8 (evaporating artifacts) | 0 |
| Gate 0 in all workflows | All UCs | P9 (no alignment check) | 1, 4 |

---

## VI. PHASE-IMPLEMENTATION PLAN

### Phase 0 — Foundation (No Behavior Change)

**Goal**: Create directory structure, the orchestrator skill that replaces 11 scattered skills, and the artifact persistence structure.

| Step | Action | Creates | Validates |
| --- | --- | --- | --- |
| 0.1 | Create workflow directory | `.opencode/workflows/hivefiver/` | Directory exists |
| 0.2 | Create template directory | `.opencode/templates/hivefiver/` | Directory exists |
| 0.3 | Create orchestrator skill | `.opencode/skills/hivefiver-orchestrator/SKILL.md` (~30L) | Description triggers correctly, references/ folder exists |
| 0.4 | Create orchestrator references | `references/governance-rules.md`, `references/asset-contracts.md`, `references/persona-matrix.md` | Content merged from deleted skills |
| 0.5 | Create `references/opencode-patterns.md` | Verified OpenCode patterns from SDK docs synthesis | Content accurate per doc analysis |

**Entry Gate**: This planning artifact approved.

**Exit Gate**: Directory structure exists, orchestrator skill loads correctly, references readable.

**Quality Check**: `skill("hivefiver-orchestrator")` returns content with correct description.

### Phase 1 — Core Chain (Build Core Workflows + Templates)

**Goal**: Create the workflow and template layer that gives commands their behavior. Start with the 3 most immediately useful chains (start, audit, doctor) per UC-1, UC-6, UC-7.

**Compound cycle applies**: Verify Phase 0 outputs → Gate 0 align → find-skill for workflow patterns → plan → execute atomic cycles → validate chain walks → persist.

| Step | Action | Creates | Validates |
| --- | --- | --- | --- |
| 1.1 | Build `start.md` workflow | `workflows/hivefiver/start.md` (~200L) | Steps have entry/exit criteria, Gate 0 present, delegation uses template, artifact persistence instructions |
| 1.2 | Build `audit.md` workflow | `workflows/hivefiver/audit.md` (~200L) | Scan + validation + report generation chain works, Gate 0 present |
| 1.3 | Build `doctor.md` workflow | `workflows/hivefiver/doctor.md` (~200L) | Diagnosis + fix + verification chain works, Gate 0 present |
| 1.4 | Build delegation templates | 3 delegation templates (~50-80L each) | Templates have all required packet fields |
| 1.5 | Build output templates | 3 output templates (~50L each) | Output formats cover spec, architecture, audit |

**Entry Gate**: Phase 0 complete.

**Exit Gate**: 3 workflows load via `@path`, 6 templates have required fields, chain walk-through passes for UC-1, UC-6, UC-7.

**Quality Check**: Manual chain walk for start → intake handoff, audit → report, doctor → fix.

### Phase 2 — Command Layer (Rewrite Commands as Orchestration Hubs)

**Goal**: Rewrite the 8 kept commands to be orchestration hubs that stack `@path` symlinks to workflows + references + templates.

**Compound cycle applies**: Verify Phase 1 outputs → Gate 0 align → research command patterns (GSD, command-creator skill) → plan → execute → validate → persist.

| Step | Action | Modifies | Validates |
| --- | --- | --- | --- |
| 2.1 | Rewrite root router | `hivefiver.md` (126L → ~60-80L) | Action table maps to sub-commands, unknown-action handling present |
| 2.2 | Rewrite `start` command | `hivefiver-start.md` (91L → ~50-70L) | `<execution_context>` stacks workflow + persona ref + delegation template |
| 2.3 | Rewrite `audit` command | `hivefiver-audit.md` (29L → ~50-70L) | `<execution_context>` stacks workflow + governance ref + contracts ref + audit template |
| 2.4 | Rewrite `doctor` command | `hivefiver-doctor.md` (70L → ~50-70L) | `<execution_context>` stacks workflow + governance ref + audit template |
| 2.5 | Create `intake` command | `hivefiver-intake.md` (~50-70L) | Stacks workflow + spec-output template |
| 2.6 | Create `spec` command | `hivefiver-spec.md` (~50-70L) | Stacks workflow + spec-output template + delegation-research template |
| 2.7 | Create `architect` command | `hivefiver-architect.md` (~50-70L) | Stacks workflow + architecture-output template + delegation-planning template |
| 2.8 | Create `build` command | `hivefiver-build.md` (~50-70L) | Stacks workflow + governance ref + contracts ref |

**Entry Gate**: Phase 1 complete.

**Exit Gate**: All 8 commands have valid frontmatter with `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>` sections. All `@path` refs resolve to existing files.

**Quality Check**: `/hivefiver start` → loads start workflow with all stacked refs → proceeds to Gate 0.

### Phase 3 — Cleanup (Remove Rot, Simplify Agent)

**Goal**: Remove all deprecated assets and simplify the agent profile.

**Compound cycle applies**: Verify Phase 2 outputs → Gate 0 align → investigate all refs to deleted assets → plan deletion order → execute → validate zero broken refs → persist → parity sync.

| Step | Action | Removes/Modifies | Validates |
| --- | --- | --- | --- |
| 3.1 | Delete 11 deprecated commands | 11 files in `.opencode/commands/` + 11 root mirrors | No broken references from remaining assets |
| 3.2 | Delete 11 deprecated skills | 11 directories in `.opencode/skills/` + 11 root mirrors | No broken `required_skills` references |
| 3.3 | Simplify agent profile | `hivefiver.md` (361L → ~150L) | Agent body contains identity + delegation + permissions + team design rules (FB-9) |
| 3.4 | Update command `required_skills` | All 8 commands reference only `hivefiver-orchestrator` | No references to deleted skills |
| 3.5 | Root parity sync | All deletions mirrored to root | Diff clean |

**Commands to delete**: `hivefiver-init`, `hivefiver-validate`, `hivefiver-deploy`, `hivefiver-workflow`, `hivefiver-ideate`, `hivefiver-tutor`, `hivefiver-skillforge`, `hivefiver-specforge`, `hivefiver-gsd-bridge`, `hivefiver-ralph-bridge`, `hivefiver-research`

**Skills to delete**: `hivefiver-persona-routing`, `meta-builder-governance`, `hivefiver-bilingual-tutor`, `hivefiver-domain-pack-router`, `hivefiver-gsd-compat`, `hivefiver-mcp-research-loop`, `hivefiver-ralph-tasking`, `hivefiver-skill-auditor`, `hivefiver-spec-distillation`, `agent-role-boundary`, `verification-methodology`

**Entry Gate**: Phase 2 complete.

**Exit Gate**: Zero broken references, zero hollow stubs, agent profile ≤150L.

**Quality Check**: Grep for all deleted skill/command names across `.opencode/` — zero matches.

### Phase 4 — Remaining Workflows + Parity Sync

**Goal**: Build the remaining 4 workflows and sync everything to root parity.

**Compound cycle applies**: Verify Phase 3 outputs → Gate 0 align → investigate what intake/spec/architect/build workflows need (find-skill first) → plan → execute → validate all 7 UCs → persist → full parity sync.

| Step | Action | Creates | Validates |
| --- | --- | --- | --- |
| 4.1 | Build `intake.md` workflow | `workflows/hivefiver/intake.md` (~250L) | Question loops, decision locking, output template, Gate 0, artifact persistence |
| 4.2 | Build `spec.md` workflow | `workflows/hivefiver/spec.md` (~250L) | Distillation, acceptance criteria, ambiguity map, Gate 0, artifact persistence |
| 4.3 | Build `architect.md` workflow | `workflows/hivefiver/architect.md` (~300L) | Dependency graph, wave plan, asset manifest, Gate 0, artifact persistence |
| 4.4 | Build `build.md` workflow | `workflows/hivefiver/build.md` (~250L) | Wave execution, contract validation, evidence collection, Gate 0, artifact persistence |
| 4.5 | Root parity sync | Mirror ALL `.opencode/` changes to root dirs | Diff check: `.opencode/` ≡ root mirrors |

**Entry Gate**: Phase 3 complete.

**Exit Gate**: All 7 workflows exist, all 7 use cases chain-walkable, parity 100%.

**Quality Check**: Full chain walk for all 7 use cases (UC-1 through UC-7).

### Phase 5 — Integration Validation (HARD STOP)

**Goal**: Verify everything works end-to-end. No execution beyond this — report and get approval.

| Check | Method | Pass Criteria |
| --- | --- | --- |
| Chain completeness | Walk all 7 use cases manually | Every command reaches workflow end-state |
| Context efficiency | Count tokens per command's stacked `@path` refs | No command >5,000 tokens at L2 entry (workflow + refs + templates) |
| Progressive disclosure | Verify MANDATORY/DO NOT LOAD triggers in skill | 3 depth levels operational |
| Broken links | Grep for `@path` to non-existent files | Zero matches |
| Parity sync | Diff `.opencode/` vs root mirrors | Zero diff |
| Gate 0 present | Check every workflow has alignment verification step | 7/7 workflows have Gate 0 |
| Contract compliance | All frontmatter validates against schema | All 8 commands + 1 skill pass |
| Delegation consistency | Review delegation points in workflows | All use templates |
| Artifact persistence | Verify workflows have persistence instructions | All workflows reference artifact storage |
| Command structure | All commands have `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` | All 7 sub-commands (router excluded) have structured sections |

**Entry Gate**: Phase 4 complete.

**Exit Gate**: ALL checks pass.

---

## VII. LIFECYCLE MAPPING

| Phase | Lifecycle Stage | Inputs | Outputs | Quality Gate |
| --- | --- | --- | --- | --- |
| 0 | **Foundation** | This planning artifact | Dirs + skill + references | Skill loads, refs readable |
| 1 | **Chain Build** | Skill + refs | 3 workflows + 6 templates | Chain walks pass for 3 UCs |
| 2 | **Command Layer** | Workflows + templates | 8 orchestration hub commands | Commands parse, stack @paths, resolve to existing files |
| 3 | **Cleanup** | Working new assets | Removed deprecated assets | Zero broken refs, zero stubs |
| 4 | **Complete** | All assets | 4 remaining workflows + parity | All 7 UCs chain-walkable |
| 5 | **Validation** | Full module | Verification report | All 10 checks pass |

---

## VIII. WHAT THE SDK DEBUG INTEGRATION DOC TEACHES US

From `docs/OPENCODE-SDK-DEBUG-INTEGRATION-2026-02-17.md`, the key mechanisms we incorporate:

1. **`noReply` prompt injection** — Inject context without waiting for response. Used in delegation templates: hivefiver agent can inject checkpoint state into subagent sessions without blocking.
2. **`tool.execute.before/after` hooks** — Pre/post-execution interception. Quality gates in workflows mirror this: entry_criteria = before hook, exit_criteria = after hook.
3. **Headless swarm debugging** — Spawn isolated sessions per hypothesis, collect and synthesize. Delegation model follows this: hivexplorer/hiverd/hiveplanner are isolated sessions with structured return schemas.
4. **Event-driven monitoring** — React to tool calls, file changes, test results. Workflow steps reference event conditions in entry/exit criteria.

---

## IX. SKILL-FIRST APPROACH (NEW — FB-2, FB-10)

### The Skill Discovery Protocol

Before creating ANY new skill or building any asset that requires domain expertise:

1. **Check existing library**: `skill-creator`, `skill-judge`, `writing-skills` are already installed
2. **Find-skill search**: Use find-skill to locate relevant skills from external sources
3. **External sources to check**:
   - `npx skills add https://github.com/obra/superpowers --skill verification-before-completion`
   - `npx skills add https://github.com/softaworks/agent-toolkit --skill command-creator`
   - Skills.sh catalog: `https://skills.sh/anthropics/claude-code/command-development`
4. **Validate against OpenCode**: Any external skill designed for Claude Code must be validated against OpenCode docs (`https://opencode.ai/docs/commands/`, `https://opencode.ai/docs/agents/`) — OpenCode has different patterns
5. **Synthesize if needed**: Only create custom skills when nothing exists. Use the combo pipeline: `skill-creator (design) → writing-skills (TDD safe) → skill-judge (evaluate)`

### Skills Used During Module Construction

| Phase | Skills Used | Purpose |
| --- | --- | --- |
| 0 | `skill-creator`, `writing-skills`, `skill-judge` | Synthesize orchestrator skill using proper pipeline |
| 1 | `command-creator` | Validate command patterns against best practices |
| 2 | `command-creator` | Structure commands as orchestration hubs |
| All | `find-skill` | Check for existing solutions before building |

---

## X. TURN PROTOCOL — DETERMINISTIC CONTEXT-FIRST GATE (NEW — FB-5)

### The Non-Negotiable Rule

At ANY point during meta-builder operation — session start, after agent stop, after compact, even when user cancels flow and sends a message:

**The first agentic executions MUST NOT be implementing or point handling.**

The first action must ALWAYS be:

1. **Verify intent alignment**: Is the user's intention 100% clarified? Is MY understanding of context 100% aligned?
2. **Detect drift signals**: If thinking surfaces "hold on, the user actually means..." — that's a CLEAR SYMPTOM of drift. STOP.
3. **Surface grey areas**: There is NEVER a case where requirements are 100% clear from a single prompt. QA to surface ambiguity. Brainstorm. Analyze. Investigate.
4. **Check planning hierarchy**: Does a plan exist? Is it atomic or compound? Does it trace up/down/across? If atomic exists but no compound → compound (phases) must be addressed first.
5. **TODO status**: Is TODO spawned? Is it current? Is HARD STOP present?

Only after ALL five checks pass → proceed to execution.

This protocol is embedded in:
- The orchestrator skill (survives compaction)
- Gate 0 of every workflow
- The agent profile

---

## XI. ARTIFACT PERSISTENCE MODEL (NEW — FB-8)

### The Problem

Investigation → research → synthesis → planning cycles produce artifacts that evaporate between sessions. Next session re-investigates from scratch, wasting tokens and stacking confusion.

### The Solution

Every workflow step that produces artifacts must persist them:

| Artifact Type | Persisted To | Format |
| --- | --- | --- |
| Investigation reports | `docs/plans/hivefiver/investigations/` | Markdown with findings + file refs |
| Research synthesis | `docs/plans/hivefiver/research/` | Markdown with evidence + sources |
| Planning artifacts | `docs/plans/hivefiver/` | This file and phase-specific plans |
| State snapshots | Updated in this plan's Status Log | Completion status + evidence |
| Audit reports | `docs/plans/hivefiver/audits/` | Following audit-report template |

### How It Works in Workflows

Each workflow includes persistence instructions in its exit gate:

```markdown
## Exit Gate
- [ ] All step outputs validated
- [ ] Artifacts persisted:
  - Investigation findings → docs/plans/hivefiver/investigations/{phase}-{date}.md
  - Decisions logged in this plan's Status Log
- [ ] Traceability matrix updated in this plan
- [ ] TODO updated with completion + next items
```

---

## XII. STATUS LOG

| Phase | Status | Started | Completed | Evidence |
|-------|--------|---------|-----------|----------|
| 0 | IN PROGRESS | 2026-03-01 | — | Dirs created. SKILL.md + governance-rules.md written. asset-contracts.md + persona-matrix.md + opencode-patterns.md pending. |
| 1 | PENDING | — | — | — |
| 2 | PENDING | — | — | — |
| 3 | PENDING | — | — | — |
| 4 | PENDING | — | — | — |
| 5 | PENDING | — | — | — |
