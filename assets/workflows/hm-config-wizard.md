---
description: "14-turn guided wizard for configuring ALL fields in `.hivemind/configs.json`. Each turn covers one field group with spoon-feeding explanations, example values, defaults, and skip-to-default options. Produces a complete, validated configs.json."
agent: hm-orchestrator
arguments: "[--scope project|user] [--dry-run] [--from-file <path>]"
---

# hm-config-wizard — Comprehensive Config Wizard

Guided 14-turn TUI wizard that walks through **every field** in `.hivemind/configs.json`
(73+ fields across 13 groups). Each turn explains what the field does, shows example
values and their effects, states the default and why it's recommended, and lets the
user skip (accept default) or customize.

Entry point: `hm-config-wizard` command or `/hm-config --wizard`.
Reference: `assets/references/hm-configs-field-reference.md` for detailed field docs.

## Wizard Protocol

For each turn:

1. **Explain** — What this field group controls and why it matters
2. **Show current** — Display existing value (if any) from configs.json
3. **Present options** — List choices with descriptions and effects
4. **Collect input** — Accept user choice or "skip" (use default)
5. **Store** — Save to in-memory candidate config (do NOT write to disk yet)

After all 14 turns: validate → diff preview → confirm → atomic write → suggest commit.

---

## Turn 1: Language & Communication

**Fields:** `conversation_language`, `documents_and_artifacts_language`, `behavioral.communication_style`

### What this controls

Language settings determine how agents communicate with you and what language
generated documents use. You can converse in one language while producing
documentation in another — useful for multilingual teams.

### Fields explained

| Field | What it does | Example |
|-------|-------------|---------|
| `conversation_language` | Agent responses, prompts, error messages | `"vi"` → agent responds in Vietnamese |
| `documents_and_artifacts_language` | Generated docs, summaries, artifacts | `"en"` → all PLAN.md, SUMMARY.md in English |
| `behavioral.communication_style` | Response verbosity | `"mixed"` → context-dependent verbosity |

### Options

```
? Conversation language?
  1) en  — English (default, international teams)
  2) vi  — Vietnamese
  3) zh  — Simplified Chinese
  4) Other (fr, ja, ko, de, es, th, id)
  > Type number or language code: _

? Documents & artifacts language?
  1) en  — English (default, most common for deliverables)
  2) Same as conversation language
  3) Other (vi, zh, fr, ja, ko, de, es, th, id)
  > Type number or language code: _

? Communication style?
  1) mixed (Recommended) — Context-dependent: concise for simple, detailed for complex
  2) concise             — Short answers, minimal elaboration
  3) detailed            — Full explanations with context
  > Type number [1-3] or "skip" for default: _
```

### Defaults & rationale

- `conversation_language`: `"en"` — universal default
- `documents_and_artifacts_language`: `"en"` — documentation standard
- `communication_style`: `"mixed"` — adapts to context complexity

---

## Turn 2: Expertise & Mode

**Fields:** `user_expert_level`, `mode`

### What this controls

Your expertise level affects how agents communicate — higher levels get concise,
jargon-rich responses; lower levels get more explanation. The mode controls
guardrail intensity and agent autonomy.

### Fields explained

| Field | What it does | Effect |
|-------|-------------|--------|
| `user_expert_level` | Agent output style and elaboration depth | `absolute-expert` → terse, technical; `beginner-friendly` → verbose, explained |
| `mode` | Operation mode controlling guardrail intensity | `hivemind-powered` → full tracking; `expert-advisor` → TDD/spec workflows; `free-style` → minimal guardrails |

### Options

```
? Your expertise level?
  1) intermediate-high-level (Recommended) — Balanced: technical but explained
  2) architecture-driven                   — System design focus, assumes patterns knowledge
  3) absolute-expert                       — Terse, maximum jargon, no hand-holding
  4) beginner-friendly                     — Detailed explanations, step-by-step guidance
  5) clumsy-vibecoder                      — Maximum guidance, simple language
  > Type number [1-5] or "skip" for default: _

? Operation mode?
  1) hivemind-powered (Recommended) — Full hierarchical tracking, session governance
  2) expert-advisor                 — TDD/spec-driven workflows, lighter tracking
  3) free-style                     — Minimal guardrails, quick experiments
  > Type number [1-3] or "skip" for default: _
```

### Defaults & rationale

- `user_expert_level`: `"intermediate-high-level"` — works for most developers
- `mode`: `"expert-advisor"` — balanced governance without overhead

---

## Turn 3: Behavioral Profile

**Fields:** `behavioral.guardrail_level`, `behavioral.delegation_mode`,
`behavioral.tool_access_pattern`, `behavioral.skill_filter`,
`behavioral.decision_speed`, `behavioral.expertise`

### What this controls

The behavioral profile is the **highest-priority** override layer. Resolution
order: `behavioral.*` > root-level overrides > static profile default. These
settings shape how strictly agents follow rules, how they dispatch subagents,
which tools they see, and how quickly they make decisions.

### Fields explained

| Field | What it does | Values |
|-------|-------------|--------|
| `guardrail_level` | Rule enforcement strictness | `strict` (block-by-default), `moderate` (balanced), `permissive` (allow-by-default) |
| `delegation_mode` | How subagents are dispatched | `waiter` (sync-block), `direct` (fire-and-forget), `autonomous` (self-directed) |
| `tool_access_pattern` | Which tools are surfaced | `restricted` (essential-only), `standard` (normal), `full` (everything) |
| `skill_filter` | Which skills are loaded | `curated` (essential), `domain` (project-relevant), `full` (all) |
| `decision_speed` | Decision-making pace | `fast` (quick execution), `deliberate` (thorough analysis) |
| `expertise` | Agent self-model confidence | `junior` (asks more), `mid` (balanced), `senior` (executes confidently) |

### Options

```
? Guardrail level?
  1) strict (Recommended for enterprise) — Block-by-default, maximum safety
  2) moderate                            — Balanced: warn on suspicious, allow known-good
  3) permissive                          — Allow-by-default, minimal friction
  > Type number [1-3] or "skip" for default: _

? Delegation mode?
  1) waiter (Recommended) — Parent blocks until subagent completes
  2) direct               — Fire-and-forget, parent continues
  3) autonomous           — Subagent self-directs, reports when done
  > Type number [1-3] or "skip" for default: _

? Tool access pattern?
  1) restricted (Recommended for governance) — Essential tools only
  2) standard                                — Normal tool set
  3) full                                    — All available tools
  > Type number [1-3] or "skip" for default: _

? Skill filter?
  1) curated (Recommended) — Essential skills only, lower context usage
  2) domain                — Project-relevant skills loaded
  3) full                  — All available skills loaded
  > Type number [1-3] or "skip" for default: _

? Decision speed?
  1) fast (Recommended)      — Quick execution, less deliberation
  2) deliberate              — Thorough analysis before each decision
  > Type number [1-2] or "skip" for default: _

? Agent expertise?
  1) mid (Recommended) — Balanced confidence
  2) junior            — Asks more questions, cautious
  3) senior            — Executes confidently, fewer questions
  > Type number [1-3] or "skip" for default: _
```

### Defaults & rationale

- `guardrail_level`: `"moderate"` — balanced safety
- `delegation_mode`: `"waiter"` — predictable execution
- `tool_access_pattern`: `"standard"` — normal tool visibility
- `skill_filter`: `"curated"` — minimal context overhead
- `decision_speed`: `"fast"` — efficient execution
- `expertise`: `"mid"` — balanced confidence

---

## Turn 4: Workflow Core

**Fields:** `workflow.research`, `workflow.plan_check`, `workflow.verifier`,
`workflow.discuss_mode`

### What this controls

Core workflow toggles that control the planning and verification pipeline.
These are the most impactful workflow settings — they determine whether
research happens before planning, whether plans are validated, and whether
execution is verified.

### Fields explained

| Field | What it does | Impact |
|-------|-------------|--------|
| `research` | Research before planning | Better-informed plans, +10-30s overhead per phase |
| `plan_check` | Validate plans before execution | Catches plan gaps early, +5-15s per plan |
| `verifier` | Verify execution against must-haves | Catches implementation gaps, +10-20s per phase |
| `discuss_mode` | Discussion intensity before planning | `intensive` = deep exploration, `sufficient` = enough context, `skip` = go straight to planning |

### Options

```
? Enable research before planning?
  1) Yes (Recommended) — Agent investigates domain + codebase before planning
  2) No                — Skip research, plan directly (faster but less informed)
  > Type number [1-2] or "skip" for default: _

? Enable plan validation?
  1) Yes (Recommended) — hm-plan-checker verifies goal coverage before execution
  2) No                — Skip plan validation (faster but riskier)
  > Type number [1-2] or "skip" for default: _

? Enable execution verification?
  1) Yes (Recommended) — hm-verifier validates must-haves after execution
  2) No                — Skip verification (faster but no gap detection)
  > Type number [1-2] or "skip" for default: _

? Discussion mode?
  1) sufficient-phase-discussion (Recommended) — Enough context to plan
  2) intensive-phase-discussion                — Deep exploration, more questions
  3) skip-phase-discussion                     — Go directly to planning
  > Type number [1-3] or "skip" for default: _
```

### Defaults & rationale

- `research`: `true` — better plans justify overhead
- `plan_check`: `true` — catches issues early
- `verifier`: `true` — validates completeness
- `discuss_mode`: `"sufficient-phase-discussion"` — balanced context gathering

---

## Turn 5: Workflow Advanced

**Fields:** `workflow.cross_session_tasks_dependencies_validation`,
`workflow.trajectory_control`, `workflow.advanced_continuity_validation`,
`workflow.task_plus_enabled`, `workflow.research_before_questions`

### What this controls

Advanced workflow settings for enterprise-grade reliability. These add overhead
but provide stronger guarantees about cross-session correctness, audit trails,
and state integrity.

### Fields explained

| Field | What it does | Overhead |
|-------|-------------|----------|
| `cross_session_tasks_dependencies_validation` | Verify cross-session task deps | +5-10s per dependent task |
| `trajectory_control` | Session execution audit trail | +2-5s per phase transition |
| `advanced_continuity_validation` | Deep state checks across compaction | +3-5s per session restore |
| `task_plus_enabled` | Extended progress tracking | +1-3s per task update |
| `research_before_questions` | Investigate before asking | Reduces unnecessary questions |

### Options

```
? Cross-session dependency validation?
  1) No (Recommended)      — Standard within-session validation only
  2) Yes                   — Verify tasks from prior sessions before dependents start
  > Type number [1-2] or "skip" for default: _

? Trajectory control (audit trail)?
  1) No (Recommended)      — No execution ledger tracking
  2) Yes                   — Record every phase transition for compliance
  > Type number [1-2] or "skip" for default: _

? Advanced continuity validation?
  1) No (Recommended)      — Standard continuity checks
  2) Yes                   — Deep validation on session restore
  > Type number [1-2] or "skip" for default: _

? Extended task tracking (task+)?
  1) No (Recommended)      — Standard task status only
  2) Yes                   — Sub-task breakdown with progress percentages
  > Type number [1-2] or "skip" for default: _

? Research before asking questions?
  1) Yes (Recommended) — Investigate codebase first, ask only what can't be inferred
  2) No                — Ask questions directly without investigation
  > Type number [1-2] or "skip" for default: _
```

### Defaults & rationale

- `cross_session_tasks_dependencies_validation`: `false` — overhead not justified for most projects
- `trajectory_control`: `false` — compliance-heavy only
- `advanced_continuity_validation`: `false` — standard checks sufficient
- `task_plus_enabled`: `false` — standard tracking sufficient
- `research_before_questions`: `true` — reduces unnecessary questions

---

## Turn 6: Workflow UI & AI

**Fields:** `workflow.ui_phase`, `workflow.ui_safety_gate`,
`workflow.ai_integration_phase`

### What this controls

Specialized phase types for frontend and AI work. Enable these when your project
involves user interfaces or AI/ML components.

### Fields explained

| Field | What it does | When to enable |
|-------|-------------|----------------|
| `ui_phase` | Generate UI-SPEC.md before frontend implementation | Building user interfaces |
| `ui_safety_gate` | Validate accessibility + visual correctness | When `ui_phase` is enabled |
| `ai_integration_phase` | Generate AI-SPEC.md for LLM/ML components | Building AI-powered features |

### Options

```
? Enable UI Phase (design contracts for frontend)?
  1) No (Recommended for backend) — Skip UI-SPEC generation
  2) Yes                          — Generate UI-SPEC.md before frontend phases
  > Type number [1-2] or "skip" for default: _

? Enable UI Safety Gate?
  1) Yes (Recommended if UI Phase enabled) — Validate accessibility before shipping
  2) No                                    — Skip UI validation
  > Type number [1-2] or "skip" for default: _

? Enable AI Integration Phase?
  1) No (Recommended for non-AI) — Skip AI-SPEC generation
  2) Yes                         — Generate AI-SPEC.md for AI/ML phases
  > Type number [1-2] or "skip" for default: _
```

### Defaults & rationale

- `ui_phase`: `false` — only needed for frontend work
- `ui_safety_gate`: `false` — only meaningful with `ui_phase`
- `ai_integration_phase`: `false` — only needed for AI features

---

## Turn 7: Workflow Git & Execution

**Fields:** `workflow.use_worktrees`, `workflow.intent_lock.enabled`,
`parallelization`, `atomic_commit`, `commit_docs`

### What this controls

Git and execution settings that control how code changes are isolated,
committed, and tracked. These affect your git workflow directly.

### Fields explained

| Field | What it does | Effect |
|-------|-------------|--------|
| `use_worktrees` | Git worktrees for parallel task isolation | Each wave gets its own worktree |
| `intent_lock.enabled` | 4-step governance gate for root sessions | Intent → trajectory → roadmap → manifest before file mutation |
| `parallelization` | Wave-based parallel task execution | Independent tasks run concurrently |
| `atomic_commit` | One commit per task | Each change independently revertable |
| `commit_docs` | Include docs in execution commits | Code and docs stay in sync |

### Options

```
? Use git worktrees for parallel isolation?
  1) No (Recommended)      — Standard branch workflow
  2) Yes                   — Each parallel wave gets its own worktree
  > Type number [1-2] or "skip" for default: _

? Enable intent-lock governance gate?
  1) No (Recommended)      — Standard tool access
  2) Yes                   — 4-step gate before file mutation tools unlock
  > Type number [1-2] or "skip" for default: _

? Enable parallel task execution?
  1) Yes (Recommended) — Independent tasks run in parallel waves
  2) No                — Sequential-only execution
  > Type number [1-2] or "skip" for default: _

? Require atomic commits (one per task)?
  1) Yes (Recommended) — Each task = one revertable commit
  2) No                — Bulk commits allowed
  > Type number [1-2] or "skip" for default: _

? Include documentation in commits?
  1) Yes (Recommended) — Code + docs committed together
  2) No                — Code-only commits, docs managed separately
  > Type number [1-2] or "skip" for default: _
```

### Defaults & rationale

- `use_worktrees`: `false` — requires git worktree support
- `intent_lock.enabled`: `false` — enterprise governance only
- `parallelization`: `true` — faster multi-task phases
- `atomic_commit`: `true` — clean git history
- `commit_docs`: `true` — keeps code and docs in sync

---

## Turn 8: Delegation Systems

**Fields:** `delegation_systems.native_task`, `delegation_systems.delegate_task`,
`delegation_systems.background_delegation`

### What this controls

Three delegation mechanisms with different capabilities. Most projects keep
all three enabled; disable individual toggles to restrict delegation paths.

### Fields explained

| Field | What it does | Capabilities |
|-------|-------------|-------------|
| `native_task` | OpenCode built-in task tool | Simple dispatch, always available |
| `delegate_task` | Harness-controlled delegation | Session stacking, trajectory tracking, context preservation |
| `background_delegation` | Async delegation | Long-running tasks without blocking parent |

### Options

```
? Enable native task tool?
  1) Yes (Recommended) — Simple subagent dispatch, always available
  2) No                — Force all delegation through harness path
  > Type number [1-2] or "skip" for default: _

? Enable harness-controlled delegate-task?
  1) Yes (Recommended) — Session stacking + trajectory tracking
  2) No                — Disable advanced delegation
  > Type number [1-2] or "skip" for default: _

? Enable background delegation?
  1) Yes (Recommended) — Async execution for long-running tasks
  2) No                — All work synchronous
  > Type number [1-2] or "skip" for default: _
```

### Defaults & rationale

- `native_task`: `true` — always-available fallback
- `delegate_task`: `true` — recommended for multi-agent workflows
- `background_delegation`: `true` — essential for long-running tasks

---

## Turn 9: Governance Rules

**Fields:** `governance.rules[]`, `governance.default_action`

### What this controls

The governance rules engine evaluates every tool call against an ordered list
of rules. First matching rule wins. Rules can allow, warn, block, escalate,
or require JIT grant for specific tool/depth/session combinations.

### Rule structure

```json
{
  "id": "gov-bash-root-only",
  "condition": {
    "toolNames": ["bash"],
    "depth": { "max": 0 }
  },
  "action": {
    "type": "allow",
    "message": "Bash allowed at root level"
  },
  "enabled": true
}
```

### Condition fields

| Field | What it matches |
|-------|----------------|
| `toolNames` | Array of tool names (OR logic — any match triggers) |
| `depth.min` / `depth.max` | Delegation depth range (0 = root) |
| `sessionIDs` | Specific session IDs (rarely used) |

### Action types

| Type | Effect |
|------|--------|
| `allow` | Permit the tool call |
| `warn` | Permit + log warning |
| `block` | Hard-block the tool call |
| `escalate` | Require human approval |
| `needs_jit_grant` | Require explicit grant |

### Options

```
? Default action when no rule matches?
  1) allow (Recommended) — Permit all unmatched tool calls
  2) warn                — Permit + log all unmatched calls
  3) block               — Block all unmatched calls (deny-by-default)
  4) escalate            — Require human approval for unmatched calls
  > Type number [1-4] or "skip" for default: _

? Configure governance rules?
  1) Keep existing rules (Recommended) — No changes to current rules
  2) Start fresh                       — Clear all rules, add new ones
  3) Add a rule                        — Append a new rule interactively
  4) Skip                              — Leave rules unchanged
  > Type number [1-4] or "skip" for default: _
```

**If user chooses "Add a rule" (T9a):**

```
Rule id (e.g. gov-bash-root-only):           _
Tool names (comma-separated, e.g. bash,write): _
Action type [allow|warn|block|escalate|needs_jit_grant]: _
Depth min (blank for none):                  _
Depth max (blank for none):                  _
Enabled? [Y/n]:                              _
```

### Defaults & rationale

- `default_action`: `"allow"` — permissive by default
- `rules`: `[]` — no custom rules initially

---

## Turn 10: Governance Agents

**Fields:** `governance.agent_configs`, `governance.command_agent_mappings`

### What this controls

Per-agent configuration and command-to-agent routing. Agent configs let you
customize descriptions, allowed commands, tools, and temperature for each agent.
Command mappings route slash commands to specific agents.

### Agent config structure

```json
{
  "hm-executor": {
    "description": "Executes PLAN.md tasks atomically",
    "allowedCommands": ["/hm-execute-phase"],
    "tools": ["read", "write", "edit", "bash"],
    "temperature": 0.3
  }
}
```

### Command mapping structure

```json
{
  "hm-execute": {
    "agent": "hm-executor",
    "description": "Execute phase plans"
  }
}
```

### Options

```
? Configure agent overrides?
  1) Keep existing (Recommended) — No changes to agent configs
  2) Customize an agent          — Set description/tools/temperature for one agent
  3) Skip                        — Leave agent configs unchanged
  > Type number [1-3] or "skip" for default: _

? Configure command routing?
  1) Keep existing (Recommended) — No changes to command mappings
  2) Add/modify a mapping        — Route a command to a specific agent
  3) Skip                        — Leave command mappings unchanged
  > Type number [1-3] or "skip" for default: _
```

**If user chooses "Customize an agent" (T10a):**

```
Agent name (e.g. hm-executor):               _
Description:                                  _
Allowed commands (comma-separated, blank=all): _
Tools (comma-separated, blank=default):       _
Temperature (0.0-2.0, blank=default):         _
```

### Defaults & rationale

- `agent_configs`: `{}` — no per-agent overrides
- `command_agent_mappings`: `{}` — default routing

---

## Turn 11: Governance Tools & Naming

**Fields:** `governance.tool_registry`, `governance.naming_standards`

### What this controls

Tool registry defines metadata for governance evaluation. Naming standards
enforce consistent prefixes and formats across agents, skills, and commands.

### Tool registry structure

```json
{
  "delegate-task": {
    "name": "delegate-task",
    "description": "Delegate work to specialist agents",
    "permissions": ["delegate"]
  }
}
```

### Naming standards structure

```json
{
  "allowed_frameworks": ["hm", "hf", "gate", "stack"],
  "allowed_classifications": ["root", "child", "grandchild", "fork"],
  "naming_format": "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
  "max_title_length": 80
}
```

### Options

```
? Configure tool registry?
  1) Keep existing (Recommended) — No changes to tool registry
  2) Add a tool entry            — Register a custom tool
  3) Skip                        — Leave tool registry unchanged
  > Type number [1-3] or "skip" for default: _

? Configure naming standards?
  1) Use Hivemind defaults (Recommended) — hm, hf, gate, stack prefixes
  2) Customize                           — Set your own frameworks and format
  3) Skip                                — No naming enforcement
  > Type number [1-3] or "skip" for default: _
```

**If user chooses "Customize" (T11a):**

```
Allowed frameworks (comma-separated, e.g. hm,hf,gate,stack): _
Allowed classifications (comma-separated, e.g. root,child):  _
Naming format (e.g. {framework}-{purpose}):                  _
Max title length (blank for no limit):                       _
```

### Defaults & rationale

- `tool_registry`: `{}` — empty, populated by harness
- `naming_standards`: Hivemind defaults (`hm`, `hf`, `gate`, `stack`)

---

## Turn 12: Governance Templates & Write Controls

**Fields:** `governance.templates`, `governance.write_denylist_override`

### What this controls

Templates provide reusable prompt patterns with `{{variable}}` interpolation.
Write denylist override controls which files the governance engine refuses
to write.

### Template structure

```json
{
  "governance-brief": {
    "content": "You are a governance {{role}}. Review the following: {{brief}}"
  },
  "audit-brief": {
    "content": "Audit the following against project standards: {{brief}}"
  }
}
```

### Write denylist options

| Value | Effect |
|-------|--------|
| `"disabled"` | Bypass all write restrictions |
| `[".env*", "*.key"]` | Custom denylist (replaces built-in) |
| *(unset)* | Built-in denylist applies |

### Options

```
? Configure prompt templates?
  1) Keep existing (Recommended) — Use default governance-brief and audit-brief
  2) Add a template              — Create a custom prompt template
  3) Skip                        — Leave templates unchanged
  > Type number [1-3] or "skip" for default: _

? Write denylist override?
  1) Use built-in denylist (Recommended) — Standard protection for .env, keys, etc.
  2) Disable denylist                    — Bypass all write restrictions (dangerous)
  3) Custom denylist                     — Provide your own glob patterns
  > Type number [1-3] or "skip" for default: _
```

**If user chooses "Add a template" (T12a):**

```
Template name (e.g. review-brief):           _
Template content (use {{variable}} for interpolation): _
```

**If user chooses "Custom denylist" (T12b):**

```
Glob patterns (comma-separated, e.g. .env*,*.key,*.secret): _
```

### Defaults & rationale

- `templates`: `{ governance-brief, audit-brief }` — standard governance patterns
- `write_denylist_override`: *(unset)* — built-in denylist applies

---

## Turn 13: Document Paths & Runtime

**Fields:** `document_paths`, `runtime.*` (communication_style, decision_speed, expertise)

### What this controls

Document paths tell the governance engine which directories to scan for
language enforcement. Runtime settings provide fine-grained overrides that
sit between behavioral and static profile defaults.

### Resolution order

```
runtime.* > behavioral.* > root-level > static profile default
```

### Fields explained

| Field | What it does |
|-------|-------------|
| `document_paths` | Directory prefixes for governance scanning |
| `runtime.communication_style` | Fine-grained verbosity override |
| `runtime.decision_speed` | Fine-grained decision pace override |
| `runtime.expertise` | Fine-grained confidence override |

### Options

```
? Document paths (directories for governance scanning)?
  1) [".planning/"] (Recommended) — Standard planning directory
  2) Add additional paths         — Include docs/ or other directories
  > Type number [1-2] or "skip" for default: _
```

**If user chooses "Add additional paths" (T13a):**

```
Additional paths (comma-separated, e.g. docs/,specs/): _
```

```
? Configure runtime overrides? (these override behavioral settings)
  1) No runtime overrides (Recommended) — Use behavioral settings as-is
  2) Set runtime overrides              — Fine-tune communication/speed/expertise
  > Type number [1-2] or "skip" for default: _
```

**If user chooses "Set runtime overrides" (T13b):**

```
Runtime communication style [concise|detailed|mixed] (blank=inherit): _
Runtime decision speed [fast|deliberate] (blank=inherit):             _
Runtime expertise [junior|mid|senior] (blank=inherit):               _
```

### Defaults & rationale

- `document_paths`: `[".planning/"]` — standard planning location
- `runtime.*`: *(unset)* — inherit from behavioral layer

---

## Turn 14: Review & Confirm

### What this does

Shows a complete diff preview of all changes, validates the candidate config
against the schema, and requires explicit confirmation before writing.

### Process

```bash
# 1. Validate candidate against schema
node -e "
  const { validateConfigsFile } = require('./dist/schema-kernel/hivemind-configs.schema.js');
  const result = validateConfigsFile(process.cwd());
  if (!result.success) {
    console.error('[Harness] Validation failed:', result.error);
    process.exit(2);
  }
  console.log('Schema validation: PASSED');
"

# 2. Show diff preview
diff -u .hivemind/configs.json <(echo "$CANDIDATE_JSON") | less -R

# 3. Confirmation gate
? Apply these changes to .hivemind/configs.json? [y/N]: _
```

### On confirmation

1. **Atomic write** — Write to temp file, fsync, rename
2. **Reset engine** — Invalidate ToolIntelligenceEngine singleton
3. **Suggest commit** — Print atomic commit suggestion

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hivemind ► CONFIG WIZARD COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes applied to .hivemind/configs.json

Summary:
  - Language: {conversation_lang} / {documents_lang}
  - Mode: {mode} ({expertise_level})
  - Guardrails: {guardrail_level} | Delegation: {delegation_mode}
  - Workflow: research={research} plan_check={plan_check} verifier={verifier}
  - Git: parallel={parallelization} atomic={atomic_commit} worktrees={use_worktrees}
  - Governance: {rule_count} rules, default_action={default_action}

Suggested commit:
  git add .hivemind/configs.json
  git commit -m "chore(config): update configs.json via wizard — {N} fields configured"

Reference: assets/references/hm-configs-field-reference.md
```

### On decline or `--dry-run`

Print "no changes written" and exit 0. The candidate config is discarded.

---

## Exit Criteria

- [ ] All 14 turns completed (or skipped with defaults)
- [ ] Candidate config passes schema validation
- [ ] User confirmed diff preview before write
- [ ] Atomic write + engine reset successful
- [ ] Commit suggestion printed

## Failure Modes

| Failure | Recovery |
|---------|----------|
| Schema validation fails (T14) | Print Zod issue path, do not write, offer to fix |
| JSON parse error in existing file | Quarantine to `.hivemind/quarantine/<ts>-configs.json` |
| Write fails (T14) | Leave original untouched, exit non-zero |
| Engine reset unavailable | Log warning, do not fail |
| User cancels mid-wizard | Discard candidate, no partial writes |

## Scope Handling

```bash
case "$SCOPE" in
  user)    CFG="$HOME/.hivemind/configs.json" ;;
  project) CFG="$PWD/.hivemind/configs.json" ;;
  *)       CFG="$PWD/.hivemind/configs.json" ;;
esac
```

## `--from-file` Import Mode

When `--from-file <path>` is provided, skip Turns 1-13 and load values from
the specified JSON file. Validate against schema (Turn 14) and proceed to
diff preview + confirmation.

## GSD Compatibility

This wizard replaces the legacy `gsd-settings` workflow for configs.json
governance. The `gsd-*` primitives are dev tooling only and are NOT part
of the config-wizard surface.
