# HIVEMIND Framework Audit Criteria & Development Guides

> **Version**: 1.0.0
> **Baseline**: Sector-2 hardened (1363 PASS / 0 FAIL / 0 WARN), Sector-1 master plan at Wave 0
> **Scope**: Criteria for auditing, validating, and improving the HIVEMIND framework itself

---

## Part 1: Audit Criteria — What "Working" Means

### 1.1 Structural Integrity (Static)

Every entity must pass these checks **before** any runtime evaluation:

| Criterion | Pass Condition | Gate Command | Severity |
|-----------|---------------|--------------|----------|
| **S-01** Agent YAML | All 8 agents have `mode`, `tools`, `permissions`, `tasks`, `workflows`, `prompts` in frontmatter | `grep -c "^tasks:" agents/*.md` | P0 |
| **S-02** Command Wiring | Every `kind: router` command has `execution_context` pointing to an existing workflow | `validate-framework.sh` R03 | P0 |
| **S-03** Workflow V2 | Every workflow has `contract_version: 2`, `target_agent`, `steps` with `wave`/`entry_criteria`/`exit_criteria`/`skill_bundles`, `guards` | `validate-framework.sh` R03 | P0 |
| **S-04** Skill Registry | Every skill in `skills/*/SKILL.md` exists in `skills/registry.yaml` with `bundle`, `disclosure_level`, `status` | `validate-framework.sh` R02 | P0 |
| **S-05** Parity Sync | Root assets byte-match `.opencode/` assets after sync | `diff -rq agents/ .opencode/agents/` | P1 |
| **S-06** Template Coverage | Every workflow step that produces output has a matching `templates/*.md` | manual audit | P1 |
| **S-07** Reference Coverage | Every prompt that cites domain knowledge has a matching `references/*.md` | manual audit | P2 |
| **S-08** No Orphan Skills | No skill exists outside registry; no registry entry lacks a `SKILL.md` | `validate-framework.sh` R02 | P1 |
| **S-09** TypeScript Clean | `npx tsc --noEmit` exits 0 | CI gate | P0 |
| **S-10** Full Test Pass | `npm test` exits 0, all tests pass | CI gate | P0 |

### 1.2 Behavioral Integrity (Runtime)

These criteria require **actual session execution** to verify:

| Criterion | Pass Condition | How to Verify | Severity |
|-----------|---------------|---------------|----------|
| **B-01** Session Init | `declare_intent` / `map_context(trajectory)` fires before any write operation | Run `/hiveminder status` after fresh session | P0 |
| **B-02** Delegation Packet | Every `Task()` delegation produces a well-formed packet with `intent_id`, `target_agent`, `scope`, `constraints`, `success_metrics` | Intercept delegation output in session log | P0 |
| **B-03** Skill Loading | Only step-declared `skill_bundles` are loaded per workflow step, not all skills | Check session token count after workflow step | P1 |
| **B-04** Context Rot Detection | `think_back` or `scan_hierarchy` detects drift_score > 60 and triggers recovery | Intentionally inject contradictory context, observe recovery | P1 |
| **B-05** Memory Classification | Session outputs are auto-classified into schema: discovery/research/planning/implementing/debug/testing | Check `.hivemind/memory/` after diverse task execution | P2 |
| **B-06** Guard Enforcement | Workflow guards halt execution on check failure (not silently skip) | Deliberately violate a guard condition | P0 |
| **B-07** Chain Trace | Command→Workflow→Skill→Agent execution path is traceable from output | Review session logs for chain continuity | P2 |
| **B-08** Return Format | Delegated sub-agents return structured results matching delegation packet expectations | Review completed task outputs | P1 |

### 1.3 Non-Destructive Co-existence (Sector-1 ↔ Sector-2)

| Criterion | Pass Condition | Severity |
|-----------|---------------|----------|
| **C-01** Sector-2 Independence | Removing all `src/` (Sector-1) still allows Sector-2 framework to function as static config | P0 |
| **C-02** No Overwrite | Sector-1 init never overwrites user-modified `.opencode/agents/*.md` without backup | P0 |
| **C-03** Schema Compatibility | Sector-1 Zod schemas validate all Sector-2 YAML without errors | P1 |
| **C-04** Config Respect | User's `opencode.json` and global config are never overwritten by framework installation | P0 |
| **C-05** AGENTS.md Preservation | Existing `AGENTS.md` and `CLAUDE.md` (if user has them) are appended, not replaced | P0 |

---

## Part 2: OpenCode Session Mechanics — How Agents "See" the World

### 2.1 Session Lifecycle (What Loads When)

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION START                            │
│                                                             │
│  1. opencode.json loaded                                    │
│     → agent defined? → load agent .md frontmatter           │
│     → YAML fields (mode, tools, permissions) → ACTIVE       │
│     → MD body → loaded BUT volatile (lost mid-session)      │
│                                                             │
│  2. AGENTS.md → loaded into system prompt (if exists)       │
│     → This is the ONLY persistent "body" text all agents    │
│       see every turn throughout the session                 │
│                                                             │
│  3. Skills → NOT loaded yet                                 │
│     → Only metadata (name + description) is in context      │
│     → Body loads ONLY when skill triggers                   │
│     → References/scripts load ONLY when skill reads them    │
│                                                             │
│  4. Commands → DISCOVERED by filename in commands/          │
│     → Frontmatter parsed when user invokes command          │
│     → Body (prompt) injected into that turn's context       │
│                                                             │
│  5. Workflows → NOT loaded                                  │
│     → Only accessed when command's execution_context fires  │
│                                                             │
│  6. Prompts/References → NOT loaded                         │
│     → Only pulled in when skill/command/workflow asks       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 What Survives vs. What Dies

| Entity | Survives Session? | Survives Compact? | Where It Lives |
|--------|-------------------|-------------------|----------------|
| Agent YAML frontmatter | ✅ Always | ✅ Always | `.opencode/agents/*.md` header |
| Agent MD body | ⚠️ Volatile | ❌ Lost | `.opencode/agents/*.md` body |
| AGENTS.md | ✅ Always | ✅ Always | Project root |
| Skills metadata | ✅ Always | ✅ Always | `skills/*/SKILL.md` header |
| Skills body | ⚠️ On trigger | ❌ Lost | `skills/*/SKILL.md` body |
| Command frontmatter | ✅ On invoke | ✅ Always | `commands/*.md` header |
| Conversation history | ✅ In session | ❌ Lost | OpenCode runtime |
| `.hivemind/` state | ✅ Always | ✅ Always | Filesystem |
| `STATE.md` (planned) | ✅ Always | ✅ Always | `.hivemind/project/planning/` |

### 2.3 The Delegation Problem

When `hiveminder` delegates to (say) `hivemaker`:

```
hiveminder context
├── Full conversation history up to this point
├── Its own agent YAML (mode/tools/permissions)
├── AGENTS.md content
└── Whatever skills triggered during conversation

       │ Task() delegation
       ▼

hivemaker context (FRESH — 200K tokens clean)
├── ONLY the Task() prompt text
├── Its own agent YAML (mode/tools/permissions)
├── AGENTS.md content
└── NOTHING ELSE — no parent history, no skills, no state
```

**Critical implication**: Everything the sub-agent needs must be IN the delegation packet or DISCOVERABLE via file reads. The sub-agent does NOT inherit the parent's:
- Conversation history
- Loaded skills
- Memory of previous turns
- Understanding of the project's current state

### 2.4 What Agents CANNOT Do

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No deductive traversal | Agents don't naturally explore dependency chains | Provide explicit scope_paths in delegation |
| Context rot mid-session | After ~15-20 turns, early context degrades | Use `think_back` / `scan_hierarchy` checks |
| Happy-path bias | Agents skip edge cases unless told | Include explicit failure_policy in packets |
| No cross-session memory | Each session starts blank | STATE.md + `.hivemind/memory/` persistence |
| Token ceiling | 200K context fills fast with skill-loading | Progressive disclosure L0→L3, token budgets |
| No awareness of delegation depth | Sub-agents don't know they're sub-agents | Include `delegation_depth` and `parent_agent` in packet |

---

## Part 3: Anti-Pattern Catalog — Agent "Dumbness" Observable Behaviors

### 3.1 Token-Wasting Anti-Patterns

| Anti-Pattern | Description | Detection | Fix |
|--------------|-------------|-----------|-----|
| **D-01** Lint-on-docs | Running `eslint`/`tsc` on markdown/yaml updates that have zero code changes | Session log shows lint commands after doc edits | Add `file_type_gate` to workflow steps: skip lint for non-code changes |
| **D-02** Skill avalanche | Loading 5+ skill bodies in one turn, filling 50K+ tokens with governance text | Token usage spike in single turn | Progressive disclosure: L0 only at session start, L1+ on demand |
| **D-03** Redundant research | Investigating the same codebase area or tech stack pattern multiple times across turns | Grep session logs for duplicate `grep`/`read` patterns | Require `recall_mems` check before any new investigation |
| **D-04** Planning artifact dump | Creating 10+ markdown/yaml/json files without hierarchical or relational ordering | `find .hivemind/ -name "*.md" -newer session-start` returns unrelated files | Enforce `trajectory` → `tactic` → `action` hierarchy before file creation |
| **D-05** Unrouted execution | Agent starts coding without checking what command/workflow they're supposed to follow | No `execution_context` or `workflow` reference in turn | Every write-operation turn must trace to a workflow step |

### 3.2 Context-Poisoning Anti-Patterns

| Anti-Pattern | Description | Detection | Fix |
|--------------|-------------|-----------|-----|
| **D-06** Hallucinated options | Presenting choices that are disconnected from conversation or project state | User reports "none of these match what we're doing" | Require options to cite specific files/artifacts/prior-turns |
| **D-07** Upstream amnesia | Sub-agent doesn't know delegation source was another agent (not human) | Sub-agent asks user for info that parent already provided | Include `delegation_source: agent` and `parent_context_summary` in packet |
| **D-08** Ghost connections | Creating cross-references to files/artifacts that don't exist | `find` for referenced paths returns empty | Pre-validate all references with `[ -f path ]` bash checks |
| **D-09** Context echo | Re-reading the same file multiple times in one session | Session log shows 3+ reads of same file | Cache file contents in session-scoped memory |
| **D-10** Scope creep in delegation | Delegated task expands beyond its declared `scope` and modifies unexpected files | `git diff --name-only` shows files outside `in_scope_paths` | Workflow guards check modified files against scope before commit |

### 3.3 Governance-Failure Anti-Patterns

| Anti-Pattern | Description | Detection | Fix |
|--------------|-------------|-----------|-----|
| **D-11** Unaware of depth | Sub-agent doesn't distinguish user messages from parent delegation instructions | Sub-agent starts new trajectory instead of continuing parent's | Set `is_delegated: true` + `delegation_depth: N` in Task packet |
| **D-12** No return format | Sub-agent completes work but returns unstructured prose instead of structured result | Parent can't parse result → re-investigates | Define explicit `return_schema` in delegation packet |
| **D-13** Broken chain | Workflow steps execute without checking entry_criteria from previous step | Step 3 produces nonsense because Step 2 failed silently | Guard enforcement must HALT, not skip on guard failure |
| **D-14** Session rot ignored | Agent continues working after 20+ turns without context health check | Later turns contradict earlier decisions | Auto-trigger `scan_hierarchy` every N turns (configurable) |
| **D-15** Skill without routing | Agent loads a skill but doesn't follow its instructions — just has it in context | Skill body consumed tokens but agent used default behavior | Skill loader must inject skill as `<system>` instruction, not passive context |

---

## Part 4: Development Guide — How to Build HIVEMIND Entities That Work

### 4.1 Command Design Pattern (GREEN-FLAG Example)

Based on GSD's `gsd:debug` and HIVEMIND's Diamond Architecture:

```yaml
---
name: hivemind:example-command
description: One-line: what this command does and when to use it
argument-hint: [what the user provides]
owner_agent: hiveminder               # Who owns this command
kind: router                          # ALWAYS router for core commands
execution_context: workflows/example-workflow.yaml
required_skills:
  - relevant-skill-bundle
required_templates:
  - templates/example-output.md       # Output format
required_references:
  - references/domain-knowledge.md    # Domain context
required_prompts:
  - prompts/example-instruction.md    # Formatted instructions
chain_group: hiveminder
group: hiveminder
entry_gate: session_declared
---

<objective>
WHAT this command achieves in 2-3 lines.
WHY it uses subagent isolation (context burn reason).
</objective>

<context>
User's input: $ARGUMENTS

```bash
# Deterministic context check FIRST
HIERARCHY_STATUS=$(scan_hierarchy --action status --json)
ACTIVE_PLAN=$(recall_mems --query "active plan" --limit 1)
```
</context>

<process>
## 0. Initialize Context (DETERMINISTIC)

```bash
# Always: check hierarchy before any action
if [ -z "$HIERARCHY_STATUS" ]; then
  declare_intent --trajectory "Command: example-command"
fi
```

## 1. Gate Check
Verify prerequisites are met. If not, STOP with actionable message.

## 2. Prepare Delegation (if sub-agent needed)
Read required context files. Construct delegation packet with:
- scope (exact file paths)
- constraints (what NOT to do)
- success_metrics (measurable outcomes)
- return format (structured result schema)

## 3. Execute or Delegate
Either execute inline or delegate via Task().

## 4. Handle Result
Process structured return. Update hierarchy. Report to user.
</process>

<success_criteria>
- [ ] Hierarchy verified before action
- [ ] Context loaded from STATE.md / recall_mems before work
- [ ] Delegation packet has explicit scope + constraints + return format
- [ ] Result updates trajectory / planning artifacts
</success_criteria>
```

### 4.2 Workflow Design Pattern

Two tiers, matching the master plan's architecture:

**Tier 1 — Orchestration** (hiveminder only): 7-10 steps with domains, hierarchy, gatekeeping, result_handling, timeouts. See `sequential-delegation-workflow.yaml` as reference.

**Tier 2 — Persona/Utility** (all other agents): 4-6 steps, minimal schema:

```yaml
contract_version: 2
name: example-workflow
target_agent: hivemaker              # Agent that executes this
description: "One-line: what this workflow does"
version: 1
steps:
  - name: step-name
    description: "What this step does — specific enough to verify"
    tool: tool-name
    wave: 1                          # Execution order (same wave = parallel)
    skill_bundles:
      - relevant-bundle              # ONLY what this step needs
    args:
      action: do_thing
    entry_criteria: "Precondition that MUST be true"
    exit_criteria: "Postcondition that MUST be verifiable"

guards:
  - rule: guard_name
    check: condition_to_verify       # Deterministic check
```

### 4.3 Skill Design Pattern (Progressive Disclosure)

```
skill-name/
├── SKILL.md                         # REQUIRED: <500 lines
│   ├── frontmatter: name + description (ALWAYS in context, ~100 words)
│   └── body: Core workflow + when to load references
├── scripts/                         # Deterministic bash/python
│   └── check-something.sh           # Executed without reading into context
├── references/                      # Domain knowledge
│   ├── patterns.md                  # Loaded ONLY when skill says "read this"
│   └── edge-cases.md                # Loaded ONLY for escalation
└── assets/                          # Templates for output
    └── output-template.md           # Used in output, not read into context
```

**Key principles**:
1. **Description = trigger**: This is ALL agents see until skill activates. Be specific about WHEN to use it
2. **Body = minimal instructions**: Core workflow only. If >500 lines, split into references
3. **References = on-demand**: Include grep patterns in SKILL.md so agent knows HOW to find what it needs
4. **Scripts = deterministic**: Never rely on agent to "write the same bash every time" — bundle it

### 4.4 Delegation Packet Contract

Every `Task()` call MUST include:

```yaml
delegation_packet:
  intent_id: "UUID linking to trajectory"
  source_command: "command that initiated this"
  delegation_source: "agent"           # vs "human" — sub-agent MUST know
  delegation_depth: 1                  # How many levels deep
  parent_agent: "hiveminder"           # Who delegated
  target_agent: "hivemaker"
  target_workflow: "workflows/example.yaml"
  skills_to_load:
    - specific-skill-bundle            # NOT "all skills"
  scope:
    in_scope_paths:
      - "src/lib/specific-module.ts"
    out_of_scope_paths:
      - "src/**"                       # Everything else is OFF LIMITS
  constraints:
    - "Do NOT modify any file outside in_scope_paths"
    - "Do NOT run npm install"
    - "Do NOT create new files without explicit path"
  success_metrics:
    - "File X exists with function Y exported"
    - "npx tsc --noEmit passes"
    - "npm test passes"
  acceptance_criteria: "One-sentence: what MUST be true when done"
  required_evidence:
    - "git diff showing changes"
    - "test output showing pass"
  failure_policy: "STOP and return error — do NOT attempt workaround"
  return_schema:
    format: "structured"
    fields:
      - status: "success | partial | failure"
      - files_modified: "string[]"
      - evidence: "string"
      - issues: "string[]"
```

---

## Part 5: Deviation Classification (Adapted from GSD)

When agents encounter unplanned situations during execution:

| Rule | Trigger | Action | Permission |
|------|---------|--------|------------|
| **R1: Bug** | Broken behavior, type errors, crashes, security holes | Fix → test → verify → track `[R1-Bug]` | Auto |
| **R2: Missing Critical** | Missing error handling, validation, auth, rate limiting | Add → test → verify → track `[R2-Critical]` | Auto |
| **R3: Blocking** | Missing deps, wrong types, broken imports, missing config | Fix blocker → verify → track `[R3-Blocking]` | Auto |
| **R4: Architectural** | New schema, switching libs, breaking API, new service | **STOP → present decision → get approval** | Ask user |

**Priority**: R4 (STOP) > R1-R3 (auto) > unsure → R4

---

## Part 6: Session Governance Checklist

### New Session Start
- [ ] `declare_intent` fired with trajectory description
- [ ] `map_context(trajectory)` set
- [ ] `STATE.md` read (if exists) for cross-session continuity
- [ ] Active plan/task identified from `.hivemind/` state
- [ ] Agent confirms alignment with user before executing

### Mid-Session Health
- [ ] Every 10 turns: `scan_hierarchy` drift check
- [ ] Every delegation: full packet with scope + constraints + return format
- [ ] Every file creation: traces to active plan/task
- [ ] Every skill load: traces to workflow step's `skill_bundles`

### Session End / Compact
- [ ] Temporary exports consolidated into trajectory
- [ ] Session memory classified (discovery/research/planning/implementing/debug/testing)
- [ ] STATE.md updated with decisions, blockers, session position
- [ ] Off-track intentions saved to TODO-Pending
- [ ] Planning artifacts (ROADMAP, REQUIREMENTS) updated if applicable

### Delegation Health
- [ ] Packet includes `delegation_source: agent` + `delegation_depth`
- [ ] Packet includes `in_scope_paths` + `out_of_scope_paths`
- [ ] Packet includes measurable `success_metrics`
- [ ] Packet includes explicit `return_schema`
- [ ] Sub-agent result matches `return_schema` format
- [ ] Parent validates result against `acceptance_criteria` before proceeding

---

## Part 7: Alignment Check — Master Plan vs. Current State

| Master Plan Gap | Status | What Sector-2 Provides | What Sector-1 Must Build |
|-----------------|--------|------------------------|--------------------------|
| GAP-1: Command Chaining (3/10) | 🟡 Partially addressed | 43 commands have `group` + `required_skills` | `execution_context` + `kind: router` wiring (Wave 2A-2B) |
| GAP-2: SOT Planning Layer (0/10) | 🔴 Not started | N/A | `.hivemind/project/planning/` hierarchy (Wave 1B) |
| GAP-3: Progressive Disclosure (0/10) | 🔴 Not started | skill_bundles declared per workflow step | `skill-loader.ts` runtime (Wave 4) |
| GAP-4: Code Intelligence (1/10) | 🔴 Not started | codemap/codewiki manifests exist (empty) | Population + planning integration (Wave 5) |
| GAP-5: Auto-Session (0/10) | 🔴 Not started | N/A | session-classifier + materializer (Wave 2C) |

### Sector-2 Readiness for Sector-1 Integration

Sector-2 has laid the **structural foundation** that Sector-1 can wire into:

1. **All 20 workflows are v2-compliant** → Sector-1's `execution_context` routing has valid targets
2. **All 43 commands have `required_skills`** → Sector-1's skill-loader knows what to load per step
3. **All 8 agents have `tasks`/`workflows`/`prompts`** → Sector-1's delegation knows agent capabilities
4. **Guards exist on all workflows** → Sector-1's gate enforcement has checks to verify
5. **Skill bundles are mapped** → Sector-1's progressive disclosure has bundle boundaries

**The contract is clear**: Sector-1 builds the RUNTIME (code, loaders, routers). Sector-2 provides the CONFIGURATION (YAML, templates, references). Neither touches the other's domain.
