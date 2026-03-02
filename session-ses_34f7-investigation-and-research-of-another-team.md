# hivefiver agent architecture

**Session ID:** ses_34f7db2b2ffeqd3uNkCymkVl8l
**Created:** 3/3/2026, 4:44:15 AM
**Updated:** 3/3/2026, 4:52:24 AM

---

## User

## The `hivefiver` agent’s + its module’s flow

### CORE FIRST-ROWER KNOWLEDGE FOR A META BUILDER

1. Not building the project → build the agentic meta concepts (its components + in advanced of both individuals and across + inter agents - prompts - commands - templates- workflows - rules -- tools - custom tools -plugins - delegation and handoff - planning artifacts - scripts - agents skills - permissions 
2. architecture of OpenCode when use as meta concept → so there are
    1. the landscape or addressing users’ needs →  solve with improvement when use OpenCode use as meta concept → use the custom tools + plugins are the max capabilities
    2. Understand opencode architecture of SDK + servers → to help heal this project meta concepts → to have the means to address the project
    3. the run-time load → 
        1. 2 level of runtime of main and sub sessions
        2. 3 entry moments of user vs agent → first entry ; during - addressed as turn (a turn = the message of user  and cn

---

## Must address the new session with these in mind

- deterministic → of any agents → switch to correct primary agents →  we have hiveminder and hivefiver
- delegation within a session
- the start new session can not grounded into simply a task and stale → during a process of development  there will be:
    - halt one → start new
    - tasks are multiple entries
    - the opencode system can revert
    - there are multiple team addressing in parallel can not jus state task as individual so does planning

## Some instantaneous easy-approach-solutions

Ok I know though we are handling the planning artifact and the run-time loader but by doing the below we can improve quality of the context substantially → to enhance quality of the healing process to heal the “healer” aka meta builder → many of which needs to correctly approach - though fine-tuning and improving of these are must be by phases - but try the first-time with most accuracy first to easily handle the rest - when it comes to schema, machine parsable, readable and quick search  - you are handle with very complex and flooded of poisoning context → frontier in delegator - using skill - keep this session hierarchically  main →  ready to traverse and routed back very further away → the lessen tool pruning and action as main session - the lessen the context drift

- understand the intricate variants of each of the following entities and aware when these are crossed and stacked schema registered is not a one-time-shot it is going to be gradual adjust - and when adjust all entities, cross-domains, slices and hierarchy, of which models and state pipelines and properties too of groups and classifications:
    - users develop the project of various complexity, types, stacks, languages - vs the green and brown field
    - though get them into spec-drive, test-driven development → there still
        - planning variants - the system and hierarchy - SOT - which control what
        - the diff of code in batches - these files in codebase
    - the meta framework
    - the meta builder
    - the session in which as said above
    - the definition of smallest absolute controlled unit → harsh

So let’s try what can be the good start 

# The auto mechanism → the “dumb” approach to context-intelligence  - “The valid context auto new session or new session”

- Use in combination of these  1. Some opencode nuances of knowledge → always start new session with sweeping context purification + connection by using subagent → collect → hiearrchy → validate illogical → showing turn-based and hierarchy turns and decisions →  synthesized context

```markdown
```markdown
# OpenCode Nuances of Knowledge

## Innate tools that may not be combined to use correctly https://opencode.ai/docs/tools/

- though all common knowledge like permissions level and those of write, read, edit, glob, bash etc… are all known. The following may not be applied to either use them within the group together, or stack them with outer concepts, and use them with plugin and custom tools
- delve more into these: https://opencode.ai/docs/tools#lsp-experimental ; patch vs edit and work them out with `atomic gitcomitt` http://opencode.ai/docs/tools#patch ; lsp tools Supported operations include **`goToDefinition`**, **`findReferences`**, **`hover`**, **`documentSymbol`**, **`workspaceSymbol`**, **`goToImplementation`**, **`prepareCallHierarchy`**, **`incomingCalls`**, and **`outgoingCalls`**.

## Configuring of the Agents ++ https://opencode.ai/docs/agents

- .agents/#use-summary -> a hidden agent by innate - with the below more configurations of other concepts to introduce cleaner approaches - fronted with

```markdown
Example uses: twist this one to become mode = all + stack with commands  + $ARGUMENT bash templates + other agents such as `hivexplorer` + instructed step-workflow through chaining propositional $ARGUMENT chains → 
```

- look for opportunity to chain prompts and step-prompt vs. Commands for bashing fast-action and coordination

## Command ++ `https://opencode.ai/docs/commands/` (paired with agents, permissions, $ARGUMENT uses, including prompts and templates)

- https://opencode.ai/docs/agents/
## I. Core Tool Nuances and Constraint Architecture

Reference the OpenCode tool specifications at `https://opencode.ai/docs/tools/` with particular attention to experimental LSP implementations and atomic operation constraints.

### A. Tool Separation Principles
The following tool categories possess innate incompatibility when combined in synchronous operations:
- **Permission-bound tools** (write, read, edit) maintain isolation from **execution tools** (bash, glob) when operating within the same context window
- **LSP Experimental Tools** (`goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, `outgoingCalls`) require isolated context frames and cannot be stacked with standard file manipulation operations

### B. Patch vs. Edit Distinction
Implement strict differentiation between:
- **Patch operations**: Atomic git-commit-style modifications utilizing the patch tool (`http://opencode.ai/docs/tools#patch`) for version-controlled, reversible changes
- **Edit operations**: Direct file mutations without version control scaffolding
- **Constraint**: Never nest patch operations within glob patterns or combine with bash command substitution in single execution frames

### C. LSP Tool Chain Isolation
When invoking LSP experimental operations:
1. Execute symbol resolution (`workspaceSymbol`, `documentSymbol`) as discrete pre-flight operations
2. Isolate reference tracing (`findReferences`, `goToDefinition`) from implementation discovery (`goToImplementation`, `prepareCallHierarchy`)
3. Maintain call hierarchy analysis (`incomingCalls`, `outgoingCalls`) in separate execution threads from hover documentation retrieval

## II. Agent Configuration Hierarchy

Reference agent documentation at `https://opencode.ai/docs/agents` and `https://opencode.ai/docs/agents/`.

### A. Base Agent Architecture
- **Summary Agent**: The innate hidden agent (`.agents/#use-summary`) serves as the context compression layer for all subsequent agent chains
- **Mode Configuration**: Implement `mode = all` to enable parallel agent execution across tool boundaries
- **Stacking Protocol**: Layer agents with command templates, bash execution contexts, and specialized agents (e.g., `hivexplorer`) using propositional argument chains

### B. Advanced Agent Chaining Patterns
Configure multi-step workflows through:
1. **Step-Prompt Chaining**: Sequential prompt execution where output of step $N$ becomes $ARGUMENT for step $N+1$
2. **Command Coordination**: Bash template integration (`$ARGUMENT` substitution) for fast-action coordination between agent boundaries
3. **Context Preservation**: Maintain atomic context isolation when transitioning between primary agents and subagents

## III. Command Configuration and Template Engineering

Reference command documentation at `https://opencode.ai/docs/commands/`.

### A. Command Definition Architecture
Implement dual-path configuration:

**JSON Schema Path** (`opencode.jsonc`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "[command-name]": {
      "template": "[prompt-template with $ARGUMENTS]",
      "description": "[TUI display text]",
      "agent": "[agent-assignment]",
      "model": "[provider/model-specifier]",
      "subtask": [boolean]
    }
  }
}
```

**Markdown Path** (Global: `~/.config/opencode/commands/`; Per-project: `.opencode/commands/`):
- Filename determines command trigger (e.g., `test.md` → `/test`)
- Frontmatter YAML headers specify agent, model, and metadata
- Body contains template logic with variable interpolation

### B. Variable Interpolation and Templating
Implement hierarchical argument substitution:

**Positional Parameters**:
- `$ARGUMENTS` or `$@` : Complete argument string
- `$1`, `$2`, `$3`... : Positional argument mapping
- Implementation example: Create file commands utilizing `$1` (filename), `$2` (directory), `$3` (content)

**Shell Integration**:
- Syntax: `!`command`` (backtick-wrapped bash commands)
- Execution context: Project root directory
- Output injection: Command stdout appends to prompt context before LLM processing
- Use cases: Dynamic test coverage analysis (`!npm test`), git history inspection (`!git log --oneline -10`)

**File Reference Protocol**:
- Syntax: `@filepath` (e.g., `@src/components/Button.tsx`)
- Resolution: Automatic file content injection into prompt context
- Constraint: Paths resolve relative to project root; glob patterns prohibited in file references

### C. Configuration Options Specification

**Template Field** (Required):
The LLM prompt template supporting:
- Natural language instructions
- Variable interpolation (`$ARGUMENTS`, positional parameters)
- Shell command injection (`!command`)
- File references (`@filepath`)

**Agent Assignment** (Optional):
- Default: Current active agent
- Subagent invocation: Specify subagent name to trigger context-isolated execution
- Override: Set `subtask: false` to prevent automatic subagent invocation when agent is specified

**Subtask Enforcement** (Optional):
- Boolean flag forcing subagent invocation regardless of agent `mode` configuration
- Purpose: Context isolation for non-polluting operations
- Default: Inherits from agent configuration

**Model Override** (Optional):
- Provider-specific model selection (e.g., `anthropic/claude-3-5-sonnet-20241022`)
- Scope: Limited to individual command execution

## IV. Integration Patterns and Workflow Architecture

### A. Cross-Tool Orchestration
Construct workflows respecting tool isolation boundaries:
1. **Discovery Phase**: LSP tools (`workspaceSymbol`, `documentSymbol`) for codebase mapping
2. **Analysis Phase**: File references (`@filepath`) and bash commands (`!git diff`) for state assessment
3. **Modification Phase**: Atomic patch operations for version-controlled changes, or direct edit for temporary modifications
4. **Verification Phase**: Bash execution for test validation (`!npm test`, `!cargo test`)

### B. Agent-Command Hybrid Workflows
Implement the following stacking pattern:
- **Base Layer**: Summary agent for context compression
- **Coordination Layer**: Custom commands with `$ARGUMENT` chaining for step-wise execution
- **Execution Layer**: Specialized agents (e.g., `hivexplorer`) for domain-specific analysis
- **Integration Layer**: Bash templates for system-level operations and git atomicity

### C. Propositional Argument Chains
Design step-workflows where:
- Step 1 output → `$1` for Step 2
- Step 2 analysis → `$2` for Step 3
- Final step synthesizes accumulated `$ARGUMENT` chain into atomic commit via patch tool

## V. Execution Constraints and Anti-Patterns

**Prohibited Combinations**:
- LSP experimental tools nested within glob operations
- Patch tool combined with edit tool in single execution frame
- File references (`@`) inside bash command substitution
- Agent subtask invocation without context isolation when using `mode = all`

**Required Isolations**:
- Separate read operations from write operations when using LSP tools
- Isolate bash execution from file editing when employing atomic patch workflows
- Maintain distinct context windows when stacking multiple agents with conflicting permission levels

Implement this architecture to achieve deterministic, version-controlled, and contextually isolated code operations within the OpenCode environment.
```
```

## The approach of auto-export → that reduction in prune obsoletes

1. 

1. The removing prune from obsoletes - learn from this plugin DO NOT COPY -  MUST IMPROVE → synthesize and improve https://github.com/Opencode-DCP/opencode-dynamic-context-pruning - we can improve with our system of schema and tools, making auto-parse of these context + the auto export into more coherent flow  
    1. harness with the insights from our framework + relevant context → regulate the output of last message of each agent type differently - so that the coordinator is high-level view, symlinks and hierarchy → making it launch to read consume and synthesize the `only-on-demand-artifact` 
    2. make the auto export more holistic when schema models are more linked and robust → auto parse these into contentful pices of injectable to prompting 
        1. we are aware of delegation - aware of which context piece should be taken , we have tools to make these excerpt
        2. seeing the role responses clearer by seeing the session in turn-based and hierarchy rather than being clouded with chunk of tools execution and nonsensical id text
        3. change the session export is more hierarchy and regulated in naming , id, date-time-order + auto update with new entries - since these in local - these regulation should be easy to make happen
    3. tighten our end game with these 3 LEARN-AND-IMPROVE-WITH-SYNTHESIS Plugins → to tighten our GAME-CHANGING APPROACHES:
        1. https://github.com/JRedeker/opencode-shell-strategy → Now you can  make shell commands interactive
        2. here come the background agents swarms that investigate in background survive compact and save investigations or session purification with markdown save to disk https://github.com/kdcokenny/opencode-background-agents 
        3. and last but not least to granular control our subtasks https://github.com/spoons-and-mirrors/subtask2 

---

## Assistant (Hivefiver · gpt-5.3-codex · 32.1s)

_Thinking:_

**Planning multi-agent research**

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Return cycle-based next actions requiring explicit user authorization before execution",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Return cycle-based next actions requiring explicit user authorization before execution",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Hivefiver · gpt-5.3-codex · 415.4s)

_Thinking:_

**Planning parallel multi-task exploration**

**Tool: task**

**Input:**
```json
{
  "description": "Map local hivefiver flow",
  "subagent_type": "explore",
  "prompt": "Very thorough exploration. Do NOT modify files. Investigate /Users/apple/hivemind-plugin for all artifacts related to hivefiver/hiveminder flow and meta-builder runtime governance.\n\nFocus areas:\n- agent files, skills, commands, workflows, templates\n- session lifecycle, context integrity, delegation contracts, handoff/export/checkpoint\n- SOT artifacts, hierarchy rules, gate enforcement\n- runtime model: main vs sub session boundaries\n\nDeliver exactly:\n1) Key files list (path + one-line role)\n2) Current end-to-end flow (new session -> turn processing -> delegation -> export/checkpoint)\n3) Top 5 structural gaps or ambiguities\n4) Suggested first 5 low-risk improvements (no code changes, architecture only)\n\nUse quick snippets from relevant files as evidence where useful."
}
```

**Output:**
```
task_id: ses_34f7cf4c3ffeeie9tUL4NZofEo (for resuming to continue this task if needed)

<task_result>
1) Key files list (path + one-line role)

- `/Users/apple/hivemind-plugin/opencode.json` — active runtime config; loads governance plugin from singular path and defines MCP/provider runtime.
- `/Users/apple/hivemind-plugin/agents/hivefiver.md` — meta-builder agent contract (scope, stage flow, gates, delegation, runtime governance).
- `/Users/apple/hivemind-plugin/agents/hiveminder.md` — top-level orchestrator contract (main vs sub-session behavior, delegation policy, evidence discipline).
- `/Users/apple/hivemind-plugin/commands/hivefiver.md` — root router command for `/hivefiver <action>` with pre-turn enforcement block.
- `/Users/apple/hivemind-plugin/.opencode/commands/hivefiver-start.md` — session bootstrap command (intent classify, pipeline init, state update).
- `/Users/apple/hivemind-plugin/.opencode/commands/hivefiver-continue.md` — deterministic fresh-session continuation command and handoff launch.
- `/Users/apple/hivemind-plugin/.opencode/commands/hivefiver-build.md` — build-stage command with schema guard + post-turn/export runtime gates.
- `/Users/apple/hivemind-plugin/.opencode/workflows/hivefiver/router.md` — stage routing workflow spec (keyword/intent/pipeline resume logic).
- `/Users/apple/hivemind-plugin/.opencode/workflows/hivefiver/continue.md` — formal handoff workflow for cross-session continuation.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-mode/SKILL.md` — per-turn stage detection and command/workflow routing rules.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/SKILL.md` — mandatory runtime gate protocol (pre-turn/checkpoint/post-turn/export).
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-prime/SKILL.md` — session-type/boundary meta-skill (main/sub/recovery behavior contracts).
- `/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle/SKILL.md` — declare_intent → map_context → compact_session lifecycle model.
- `/Users/apple/hivemind-plugin/.opencode/skills/context-integrity/SKILL.md` — drift/post-compaction recovery procedures.
- `/Users/apple/hivemind-plugin/.opencode/skills/delegation-packet-contract/SKILL.md` — required fields for typed delegation payloads.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/references/governance-rules.md` — SOT/parity hierarchy and blocked anti-pattern rules.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/references/handoff-payload.md` — handoff structure and auto-continue semantics.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh` — unified enforcer script for lifecycle gate execution.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/scripts/session-continue.sh` — writes handoff + composes/executes next-session prompt.
- `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/scripts/state-update.sh` — machine-parseable state read/write for pipeline table in STATE.md.
- `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/index.ts` — SDK-aligned plugin entry (active path in `opencode.json`).
- `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/events.ts` — session/todo/file event hook wiring.
- `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/delegation.ts` — task delegation and write-scope enforcement hook.
- `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/context-injection.ts` — per-turn governance context injection (`system.transform`).
- `/Users/apple/hivemind-plugin/.opencode/tool/hiveops_export.ts` — handoff/checkpoint tool (`.hivemind/handoffs`, `.hivemind/checkpoints`).
- `/Users/apple/hivemind-plugin/.opencode/tool/hiveops_sot.ts` — SOT artifact index/search/staleness/export tool.
- `/Users/apple/hivemind-plugin/.opencode/tool/hiveops_gate.ts` — gate state management and evidence-backed pass/fail recording.
- `/Users/apple/hivemind-plugin/.opencode/tool/hiveops_todo.ts` — hierarchical TODO state machine with dependency graph + HARD STOP rule.
- `/Users/apple/hivemind-plugin/.hivemind/hive-modules/hivefiver-v2/STATE.md` — live pipeline state bus for HiveFiver.
- `/Users/apple/hivemind-plugin/.hivemind/state/hierarchy.json` — current trajectory/tactic/action tree.
- `/Users/apple/hivemind-plugin/.hivemind/state/runtime-profile.json` — live role envelope/capability/depth constraints snapshot.
- `/Users/apple/hivemind-plugin/.hivemind/state/sot-index.json` — current SOT registry state persisted by tooling.

2) Current end-to-end flow (new session -> turn processing -> delegation -> export/checkpoint)

- New session bootstrap:
  - Plugin is loaded from `/Users/apple/hivemind-plugin/opencode.json:5` (`file://.opencode/plugin/hiveops-governance/index.ts`).
  - On `session.created`, events hook triggers entry scripts (`gx-entry-guard.sh`, `gx-first-turn-refresh.sh`) per `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/events.ts:32-54`.
  - Runtime profile/hierarchy/TODO become available for per-turn injection from state files (`todo.json`, `runtime-profile.json`, `hierarchy.json`) via `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/context-injection.ts:187-190`.

- Turn processing (hivefiver/hiveminder command execution):
  - `/hivefiver` command enforcement preloads routing and governance checks (`route-stage.sh`, `pipeline-orchestrator.sh`, `classify-intent.sh`, `runtime-gate.sh pre-turn`) in `/Users/apple/hivemind-plugin/.opencode/commands/hivefiver.md:8-27`.
  - Stage command (e.g., start/build) runs gate-check + state-read + runtime pre-turn and then mutates pipeline state via `state-update.sh` (see `/Users/apple/hivemind-plugin/.opencode/commands/hivefiver-start.md:81-95`).
  - Unified runtime gate script defines lifecycle checkpoints and tool-chain obligations (`pre-turn`, `checkpoint`, `post-turn`, `export`) in `/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh:3-10`.

- Delegation and boundaries:
  - Delegation policy and packet requirements are defined in agent/skill contracts (`hiveminder`, `delegation-packet-contract`) and checked at runtime by plugin hook.
  - `tool.execute.before` intercepts `task` calls, validates delegation topology, then runs `gx-enforce.sh check-delegation` + `gx-trace-check.sh` in `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/delegation.ts:39-77`.
  - Same hook enforces write scope (`check-path`) for write/edit/patch/bash before file operations in `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/delegation.ts:97-145`.

- Export/checkpoint/handoff:
  - Mid-work checkpoint: `runtime-gate.sh checkpoint` + `state-update.sh set-checkpoint` (`runtime-gate.sh:326-338`).
  - End-turn: `runtime-gate.sh post-turn` runs full quality check + pipeline status + checkpoint (`runtime-gate.sh:284-321`).
  - Pipeline/session export: `runtime-gate.sh export` writes `export-*.json` into `/Users/apple/hivemind-plugin/.hivemind/hive-modules/hivefiver-v2/handoffs/` (`runtime-gate.sh:343-375`).
  - Fresh-session continuation: `session-continue.sh` writes `handoff-*.md` and builds `opencode run --agent hivefiver ...` (`/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-coordination/scripts/session-continue.sh:170-231`).
  - Generic tool-based checkpoint/handoff path also exists via `hiveops_export` (`.hivemind/checkpoints` + `.hivemind/handoffs`) in `/Users/apple/hivemind-plugin/.opencode/tool/hiveops_export.ts:157-180` and `:85-154`.

3) Top 5 structural gaps or ambiguities

- Gap 1: Duplicate governance plugin trees with conflicting runtime API assumptions
  - Evidence:
    - Active config points to singular path: `/Users/apple/hivemind-plugin/opencode.json:5`.
    - Parallel duplicate exists under plural path and still references old hook style: `/Users/apple/hivemind-plugin/.opencode/plugins/hiveops-governance/index.ts:114` (`experimental.chat.messages.transform`).
    - Singular path uses SDK-aligned `experimental.chat.system.transform`: `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/index.ts:127`.
  - Risk: audits/docs may inspect wrong tree and produce false governance conclusions.

- Gap 2: Delegation depth/recursion policy conflict between agent frontmatter and runtime enforcement topology
  - Evidence:
    - Agent says `max_delegation_depth: 1`, `recursive_delegation: false` in `/Users/apple/hivemind-plugin/agents/hiveminder.md:130-131`.
    - Plugin topology allows hiveminder `maxDepth: 3`, `recursive: true` in `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/types.ts:66-68`.
  - Risk: declared behavior vs enforced behavior diverges during sub-session chaining.

- Gap 3: Session boundary behavior conflict (sub-session determinism vs “always ask confirmation”)
  - Evidence:
    - Hiveminder main/sub contract: sub-session should not ask human confirmation (`/Users/apple/hivemind-plugin/agents/hiveminder.md:178-180`).
    - Governance skill says before any file change “WAIT yes/proceed” universally (`/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance/SKILL.md:143-148`).
  - Risk: delegated child sessions can deadlock or violate deterministic delegation contract.

- Gap 4: Inconsistent hierarchy state path references
  - Evidence:
    - Session lifecycle references `.hivemind/hierarchy.json` (`/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle/SKILL.md:174`).
    - Most runtime/agent docs and hooks use `.hivemind/state/hierarchy.json` (`/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-mode/SKILL.md:19`, `/Users/apple/hivemind-plugin/.opencode/plugin/hiveops-governance/hooks/context-injection.ts:189`).
    - Actual file present: `/Users/apple/hivemind-plugin/.hivemind/state/hierarchy.json`.
  - Risk: tools/skills depending on older path can silently miss hierarchy state.

- Gap 5: “Mandatory first-load” skill contract not aligned with primary agent startup instructions
  - Evidence:
    - Prime says load `hivefiver-prime` before any other skill/action (`/Users/apple/hivemind-plugin/.opencode/skills/hivefiver-prime/SKILL.md:4-5`).
    - Hivefiver agent says start with `hivefiver-mode` + `hivefiver-coordination` first (`/Users/apple/hivemind-plugin/agents/hivefiver.md:94`).
  - Risk: startup chain is ambiguous; different sessions may initialize with different governance depth.

4) Suggested first 5 low-risk improvements (no code changes, architecture only)

- Improvement 1: Publish a single “Runtime Canonicality ADR”
  - Define canonical plugin location (`.opencode/plugin/...`), canonical hook set (`system.transform`), and mark `.opencode/plugins/...` as archive-only.
  - Keep it as one authoritative architecture note referenced by agents/skills/workflows.

- Improvement 2: Create one source-of-truth “Delegation Contract Matrix”
  - Include per-agent: allowed targets, max depth, recursion, main vs sub behavior, required packet fields.
  - Treat this matrix as normative for both frontmatter and plugin topology reviews.

- Improvement 3: Add a “Session Boundary Policy” spec
  - Explicitly separate rules for main session vs sub-session vs recovery (confirmation, escalation, user-interaction expectations).
  - Make governance language conditional by boundary type to remove contradictory mandates.

- Improvement 4: Normalize state-path vocabulary
  - Define one canonical hierarchy path (`.hivemind/state/hierarchy.json`) and list deprecated aliases.
  - Add a docs-only migration table (“old path -> canonical path”) for all lifecycle/governance docs.

- Improvement 5: Consolidate handoff/checkpoint architecture map
  - Document when to use `runtime-gate export` vs `hiveops_export handoff/checkpoint`, including artifact locations and retention semantics.
  - This avoids split-brain persistence between module handoffs and generic state handoffs.

If you want, I can next produce a compact dependency graph of these artifacts (agents/skills/commands/workflows/tools/hooks/state files) with explicit edge types (loads, enforces, mutates, exports).
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Validate OpenCode architecture",
  "subagent_type": "opencode-tool-architect",
  "prompt": "Research and validate, against current OpenCode documentation, the architecture constraints relevant to this design:\n- tools behavior and isolation boundaries\n- patch vs edit and atomic change strategy\n- agents configuration, subtask/session boundaries\n- commands templating ($ARGUMENTS, positional params, shell injection)\n- safe orchestration for deterministic primary-agent switching\n\nReturn:\n1) Validated principles (must-vs-optional)\n2) Incorrect assumptions in the provided note, if any\n3) Recommended architecture primitives for building a context-intelligence bootstrap module in this repo\n4) URLs used as evidence."
}
```

**Output:**
```
task_id: ses_34f7cf4a4ffeRCukz5bvSkL0aN (for resuming to continue this task if needed)

<task_result>
Validated against current OpenCode docs and upstream code (`anomalyco/opencode`), here are the constraints for your design.

**1) Validated principles (must vs optional)**
- **Must:** `edit`, `write`, `patch` are one permission domain (`edit`) for policy and gating; you cannot isolate `patch` separately at permission level.  
- **Must:** tool boundaries are permission-driven (`allow|ask|deny`), with `external_directory` as a separate guard for path access outside workspace.  
- **Must:** primary vs subagent are different execution modes; subagents run via Task/`subtask` and create child sessions (context isolation), but not filesystem isolation by default.  
- **Must:** command templates support `$ARGUMENTS` and positional `$1..$N`; commands can run inline shell via `!`command`` and include files via `@path`.  
- **Must:** deterministic primary-agent choice is done by explicit agent selection (`default_agent`, command `agent`, CLI `--agent`), not by Tab cycling behavior.  
- **Optional (strategy):** use `edit` for precise local rewrites; use `patch` when applying precomputed diffs/multi-hunk changes; both are still governed by the same permission policy.  
- **Optional (strategy):** force heavy research/analysis commands to `subtask: true` to keep parent context clean and deterministic.

**2) Incorrect assumptions in the note (if any)**
- If your note assumes **`patch` can be permissioned separately from `edit`**, that is incorrect in current architecture (shared `edit` permission bucket).  
- If it assumes **subtasks are fully sandboxed from repo effects**, that is incorrect; they are session-isolated, but can still mutate the same workspace unless permissions deny edits/bash.  
- If it assumes **`!`command`` in templates is inherently shell-injection safe for interpolated user args**, that is unsafe as an assumption; docs describe capability, but safety depends on template authoring/quoting and trust boundaries.

**3) Recommended architecture primitives for a context-intelligence bootstrap module**
- **Deterministic router primitive:** one primary orchestrator agent (`default_agent`) + explicit `permission.task` allowlist + no implicit switching.  
- **Session-isolated worker primitive:** all discovery/synthesis executed as subagents (`task` or command `subtask: true`) with child-session boundaries and resumable `task_id`.  
- **Policy envelope primitive:** central permission matrix (`edit`, `bash`, `webfetch`, `external_directory`, `task`) with deny-first for risky tools in planner/research agents.  
- **Command safety primitive:** templated commands use `$1..$N`/`$ARGUMENTS`, but shell injection points are constrained to fixed scripts (no direct user arg interpolation into `!`command``).  
- **Hook guardrail primitive (plugin):** `tool.execute.before/after` checks for forbidden command patterns, path boundaries, and agent-mode invariants; logs deterministic decisions.

**4) URLs used as evidence**
- https://opencode.ai/docs/tools/  
- https://opencode.ai/docs/permissions/  
- https://opencode.ai/docs/agents/  
- https://opencode.ai/docs/commands/  
- https://opencode.ai/docs/config/  
- https://opencode.ai/docs/cli/  
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/prompt.ts  
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/task.ts  
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/permission/next.ts  
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/command/index.ts  
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/markdown.ts

If you want, I can convert this into a concrete `opencode.json` + `.opencode/agents/*.md` + `.opencode/commands/*.md` bootstrap skeleton tailored to this repo.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Analyze referenced plugins",
  "subagent_type": "hiverd",
  "prompt": "Research these repositories and extract implementable patterns for a 'context-intelligence auto new session' system:\n- https://github.com/Opencode-DCP/opencode-dynamic-context-pruning\n- https://github.com/JRedeker/opencode-shell-strategy\n- https://github.com/kdcokenny/opencode-background-agents\n- https://github.com/spoons-and-mirrors/subtask2\n\nTask:\n- Summarize each plugin's core mechanism\n- Identify adopt/avoid decisions for this hivemind-plugin repo\n- Propose synthesis approach that improves on all 4 (not copy)\n- Highlight integration risks and compatibility concerns with hierarchical session export and schema-linked artifacts\n- Provide concise evidence links/quotes where possible.\n\nNo code changes; research only."
}
```

**Output:**
```
task_id: ses_34f7cf49dffeBXKXa7Yoy1zxuZ (for resuming to continue this task if needed)

<task_result>
# Research Report: Context-Intelligence Auto Session Systems

**Date**: 2026-03-03
**Researcher**: hiverd
**Query**: Extract implementable patterns for context-intelligence auto new session system
**Confidence**: HIGH (direct code analysis via Repomix)

---

## Executive Summary

I analyzed 4 OpenCode plugins that implement context management and delegation patterns. Key findings:

1. **opencode-dynamic-context-pruning (DCP)** - Token-centric context pruning with LLM-driven compression tools
2. **opencode-shell-strategy** - Non-interactive shell behavioral patterns (instruction-only)
3. **opencode-background-agents** - Async delegation with waiter model and persistent storage
4. **subtask2** - Complex state machine for command chaining, returns, and parallel execution

**Critical Pattern**: The combination of DCP's token tracking + background-agents' persistent storage + subtask2's return chaining offers a complete context-intelligence system.

---

## 1. Repository Analysis

### 1.1 opencode-dynamic-context-pruning (DCP)

**Core Mechanism**: Token-aware context management with LLM-driven tools

**Architecture**:
```
lib/
├── tools/           # prune, distill, compress tools
├── strategies/      # deduplication, purge-errors, supersede-writes
├── state/           # session state, persistence, tool-cache
├── messages/        # inject, prune, sync
└── prompts/         # system.md, compress.md, distill.md, prune.md
```

**Key Patterns**:

| Pattern | Implementation | Evidence |
|---------|---------------|----------|
| **Token Tracking** | Uses `@anthropic-ai/tokenizer` for exact counts | `lib/strategies/utils.ts:countTokens()` |
| **LLM-Driven Tools** | `prune`, `distill`, `compress` as first-class tools | `lib/tools/*.ts` |
| **Message ID Injection** | `<dcp-message-id>mNNNN</dcp-message-id>` tags | `lib/message-ids.ts` |
| **Prunable Tools List** | `<prunable-tools>` XML injection for tool targeting | `lib/messages/inject.ts:buildPrunableToolsList()` |
| **Compression Summaries** | Block-based compression with `(bN)` placeholders | `lib/tools/compress-utils.ts` |
| **Auto-Strategies** | Deduplication, error purging, write superseding | `lib/strategies/*.ts` |

**State Structure** [CONFIDENCE: HIGH]:
```typescript
// lib/state/types.ts
interface SessionState {
  sessionId: string | null
  isSubAgent: boolean
  manualMode: boolean
  prune: {
    tools: Map<string, number>      // toolId -> token count
    messages: Map<string, number>   // msgId -> token count
    origins: Map<string, PruneOrigin>
  }
  compressSummaries: CompressSummary[]
  stats: { pruneTokenCounter: number; totalPruneTokens: number }
  toolParameters: Map<string, ToolParameterEntry>
  messageIds: { byRawId: Map<string, string>; byRef: Map<string, string>; nextRef: number }
}
```

**Adopt Decision**:
- ✅ Token-aware context management
- ✅ Message ID injection for precise targeting
- ✅ Compression with block placeholders
- ✅ Auto-strategies (deduplication, supersede-writes)

**Avoid Decision**:
- ❌ Manual mode toggle (adds complexity)
- ❌ Nudge injection (redundant with proper tools)
- ⚠️ Tool cache may have memory issues at scale

---

### 1.2 opencode-shell-strategy

**Core Mechanism**: Instruction-only behavioral patterns for non-interactive shells

**Architecture**:
```
shell_strategy.md  # Single instruction file (8.8KB)
```

**Key Patterns**:

| Pattern | Implementation | Evidence |
|---------|---------------|----------|
| **Positive Constraints** | BAD vs GOOD pattern for shell commands | `shell_strategy.md:§3` |
| **Environment Variables** | `CI=true`, `DEBIAN_FRONTEND=noninteractive` | `shell_strategy.md:§2` |
| **Banned Commands** | Explicit list: `vim`, `nano`, `less`, `git add -p` | `shell_strategy.md:§4` |
| **Process Continuity** | "Never stop after tool execution" rule | `shell_strategy.md:§Cognitive Standards` |

**Evidence Quote** [HIGH]:
```markdown
# shell_strategy.md
**Rule:** Never stop after a tool output to "wait for instructions" unless the task is complete.
**Why:** The environment is non-interactive. You must drive the workflow.
```

**Adopt Decision**:
- ✅ Positive constraint framing (GOOD over BAD)
- ✅ Environment variable presets
- ✅ Explicit banned command list

**Avoid Decision**:
- ❌ Not a plugin - just instruction file
- ❌ No runtime enforcement

---

### 1.3 opencode-background-agents

**Core Mechanism**: Async delegation with waiter model and persistent storage

**Architecture**:
```
src/plugin/
├── background-agents.ts    # Main plugin (13.8KB)
└── kdco-primitives/        # Shared utilities
    ├── get-project-id.ts   # Git root hash for project ID
    ├── mutex.ts            # Promise-based mutex
    ├── shell.ts            # Cross-platform escaping
    └── with-timeout.ts     # Timeout wrapper
```

**Key Patterns**:

| Pattern | Implementation | Evidence |
|---------|---------------|----------|
| **Waiter Model** | Fire-and-forget delegation with notification | `background-agents.ts:notifyParent()` |
| **Persistent Storage** | `~/.local/share/opencode/delegations/` markdown files | `background-agents.ts:persistOutput()` |
| **Readable IDs** | `unique-names-generator` for human IDs | `generateReadableId()` |
| **Small Model Metadata** | Uses `small_model` for title/description generation | `generateMetadata()` |
| **Project ID** | Git root commit SHA for cross-worktree consistency | `kdco-primitives/get-project-id.ts` |
| **Read-Only Enforcement** | Blocks delegate for write-capable agents | `parseAgentWriteCapability()` |
| **Compaction Recovery** | Injects delegation context on compaction | `experimental.chat.system.transform` |

**State Structure** [CONFIDENCE: HIGH]:
```typescript
// background-agents.ts
interface Delegation {
  id: string                    // Human-readable: "swift-amber-falcon"
  sessionID: string
  parentSessionID: string
  prompt: string
  agent: string
  status: "running" | "complete" | "error" | "cancelled" | "timeout"
  startedAt: Date
  completedAt?: Date
  progress: { toolCalls: number; lastUpdate: Date; lastMessage?: string }
  title?: string               // Generated by small_model
  description?: string         // Generated by small_model
  result?: string
}
```

**Evidence Quote** [HIGH]:
```typescript
// background-agents.ts:notifyParent()
// Uses batching: individual notifications are silent (noReply: true),
// but when ALL delegations for a parent session complete, triggers a response.
```

**Adopt Decision**:
- ✅ Persistent storage with markdown files
- ✅ Readable IDs for human reference
- ✅ Small model for metadata generation
- ✅ Project ID via git root hash
- ✅ Mutex for concurrency control
- ✅ Compaction context injection

**Avoid Decision**:
- ❌ 15-minute hard timeout (too rigid)
- ⚠️ Read-only enforcement may be too restrictive
- ⚠️ `session.idle` polling may be inefficient

---

### 1.4 subtask2

**Core Mechanism**: Complex state machine for command chaining, returns, and parallel execution

**Architecture**:
```
src/
├── core/
│   ├── state.ts          # Centralized state (16KB - massive!)
│   └── plugin.ts
├── features/
│   ├── returns.ts        # Return chain execution
│   ├── parallel.ts       # Parallel command flattening
│   ├── turns.ts          # $TURN[n] reference resolution
│   ├── results.ts        # $RESULT[name] resolution
│   └── inline-subtasks.ts
├── hooks/
│   ├── command-hooks.ts
│   ├── message-hooks.ts
│   ├── tool-hooks.ts
│   └── session-idle-hook.ts
├── parsing/
│   ├── overrides.ts      # {model:..., loop:..., until:...}
│   ├── commands.ts
│   └── turns.ts
└── loop.ts               # Retry loop state machine
```

**Key Patterns**:

| Pattern | Implementation | Evidence |
|---------|---------------|----------|
| **Return Chaining** | `return: [/cmd1, /cmd2, prompt]` syntax | `src/features/returns.ts` |
| **Loop Constructs** | `{loop:10, until:CONDITION}` for retries | `src/loop.ts` |
| **$TURN References** | `$TURN[5]`, `$TURN[:2:5:8]` for message injection | `src/features/turns.ts` |
| **$RESULT References** | `as:name` + `$RESULT[name]` for result capture | `src/features/results.ts` |
| **Return Stack** | Nested returns from inline subtasks | `src/core/state.ts:pushReturnStack()` |
| **Parallel Flattening** | Cycle detection for nested parallels | `src/features/parallel.ts` |
| **Frontmatter Parsing** | YAML config in command files | `src/parsing/frontmatter.ts` |
| **Session Idle Hook** | Authoritative return advancement | `src/hooks/session-idle-hook.ts` |

**State Structure** [CONFIDENCE: HIGH]:
```typescript
// src/core/state.ts (abbreviated - actual file is 16KB!)
// Session state maps
const callState = new Map<string, string>()
const returnState = new Map<string, string[]>()
const returnStack = new Map<string, string[][]>()  // Nested returns
const pipedArgsQueue = new Map<string, string[]>()
const pendingReturns = new Map<string, string>()
const subtaskResults = new Map<string, Map<string, string>>()
const pendingResultCapture = new Map<string, { parentSessionID: string; name: string }>()
const loopStates = new Map<string, LoopState>()
const pendingEvaluations = new Map<string, LoopState>()
```

**Evidence Quote** [HIGH]:
```typescript
// src/hooks/session-idle-hook.ts
/**
 * Hook: event handler for session.idle
 * Fires when a session is truly idle (all work done).
 * This is the authoritative signal to advance return chains and loop iterations.
 */
```

**Adopt Decision**:
- ✅ Return chaining pattern
- ✅ Loop constructs with conditions
- ✅ $TURN/$RESULT reference system
- ✅ Return stack for nested operations
- ✅ Session idle as authoritative trigger

**Avoid Decision**:
- ❌ Monolithic state.ts (16KB single file)
- ❌ Too many Map-based state containers
- ❌ Complex return stack logic
- ⚠️ Inline subtask parsing adds complexity

---

## 2. Comparative Matrix

| Criteria | DCP | Shell-Strategy | Background-Agents | Subtask2 |
|----------|-----|----------------|-------------------|----------|
| **Token Awareness** | ✅ Excellent | ❌ None | ❌ None | ⚠️ Partial |
| **Session Persistence** | ✅ JSON | ❌ None | ✅ Markdown | ❌ Memory only |
| **Delegation Model** | ❌ None | ❌ None | ✅ Waiter | ✅ Chained |
| **State Complexity** | ⚠️ Medium | ✅ None | ⚠️ Medium | ❌ High |
| **Compaction Recovery** | ✅ Block IDs | ❌ None | ✅ Context injection | ⚠️ Partial |
| **Parallel Execution** | ❌ None | ❌ None | ❌ None | ✅ Full |
| **Return Chaining** | ❌ None | ❌ None | ❌ None | ✅ Full |
| **Integration Risk** | ⚠️ Medium | ✅ Low | ⚠️ Medium | ❌ High |

**Legend**: ✅ Excellent | ⚠️ Partial/Medium | ❌ None/High

---

## 3. Integration Risks with hivemind-plugin

### 3.1 Hierarchical Session Export Compatibility

**Current hivemind-plugin**:
- `session-export.ts` exports `SessionExportData` with `hierarchy: { trajectory, tactic, action }`
- `hierarchy-tree.ts` uses timestamp-based stamps (`MiMiHrHrDDMMYYYY`)

**Risks**:

| Source | Risk | Severity | Evidence |
|--------|------|----------|----------|
| **DCP** | Message ID format collision (`mNNNN` vs `t_301411022026`) | HIGH | DCP uses numeric refs, hivemind uses timestamp-based |
| **Background-Agents** | Session tree vs flat delegations | MEDIUM | Delegations stored outside hierarchy tree |
| **Subtask2** | Return stack conflicts with hierarchy levels | HIGH | Both track "where to return" differently |

**Mitigation**:
```typescript
// Proposed: Unified ID namespace
type UnifiedId = 
  | { type: 'hierarchy'; stamp: string; level: 't'|'tc'|'a' }
  | { type: 'message'; ref: string }
  | { type: 'delegation'; readable: string }
```

### 3.2 Schema-Linked Artifacts Compatibility

**Current hivemind-plugin**:
- `brain.json` contains `BrainState` with `hierarchy`, `metrics`, `session`
- Artifacts reference brain state via JSON paths

**Risks**:

| Source | Risk | Severity | Evidence |
|--------|------|----------|----------|
| **DCP** | Compress summaries replace message ranges | HIGH | Block compression may break artifact references |
| **Subtask2** | $RESULT references need resolution before export | MEDIUM | Results stored in memory, not persisted |
| **Background-Agents** | Delegation files outside brain.json | MEDIUM | Parallel storage locations |

**Mitigation**:
```typescript
// Proposed: Artifact reference preservation during compression
interface CompressAwareArtifact {
  originalRange: { startId: string; endId: string }
  compressedBlockId?: number  // If range was compressed
  resolvedContent: string     // Current value
}
```

---

## 4. Synthesis Proposal: Context-Intelligence Auto Session

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Intelligence Engine               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Token Tracker│  │ Prune Engine │  │Compress Engine│       │
│  │   (from DCP) │  │  (from DCP)  │  │  (from DCP)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Session State Manager                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ Hierarchy   │  │ Delegations │  │ Return Chain│  │    │
│  │  │ Tree        │  │ (from BG)   │  │ (from S2)   │  │    │
│  │  │ (existing)  │  │             │  │             │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Persistent Storage Layer                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ brain.json  │  │ sessions/   │  │ delegations/│  │    │
│  │  │ (existing)  │  │ (from DCP)  │  │ (from BG)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Unified State Schema

```typescript
// Proposed: Unified context-intelligence state
interface ContextIntelligenceState {
  // === From hivemind-plugin (existing) ===
  hierarchy: HierarchyTree
  session: { id: string; date: string; mode: string; ... }
  metrics: { turn_count: number; drift_score: number; ... }
  
  // === From DCP (adopt) ===
  tokenTracking: {
    currentUsage: number
    limit: number
    byCategory: { system: number; user: number; assistant: number; tools: number }
  }
  pruneState: {
    tools: Map<string, { tokens: number; origin: PruneOrigin }>
    messages: Map<string, { tokens: number; origin: PruneOrigin }>
  }
  compressBlocks: Map<number, { anchorId: string; summary: string; tokens: number }>
  
  // === From Background-Agents (adapted) ===
  delegations: Map<string, {
    id: string              // Readable: "swift-amber-falcon"
    hierarchyNodeId: string // Links to hierarchy tree
    status: DelegationStatus
    resultPath?: string     // Points to markdown file
    tokens: number          // Token cost tracking
  }>
  
  // === From Subtask2 (simplified) ===
  returnChain: {
    current: string[]       // Current return items
    stack: string[][]       // Nested returns (simplified)
  }
  namedResults: Map<string, string>  // $RESULT[name] values
}

// Storage locations (unified)
const STORAGE = {
  brain: '.hivemind/brain.json',           // Main state
  sessions: '.hivemind/sessions/',         // Session exports
  delegations: '.hivemind/delegations/',   // Delegation results
  compress: '.hivemind/compress/',         // Compression blocks
}
```

### 4.3 Key Improvements Over Originals

| Feature | Original Limitation | Proposed Improvement |
|---------|--------------------|-----------------------|
| **State Complexity** | Subtask2's 16KB state.ts | Schema-separated modules |
| **Token Tracking** | BG/Subtask2 have none | Unified token accounting |
| **Persistence** | Subtask2 memory-only | All state persists to disk |
| **Hierarchy Integration** | DCP/BG ignore hierarchy | All ops respect hierarchy tree |
| **ID Collision** | Multiple ID formats | Unified ID namespace with type tags |
| **Compression** | Breaks artifact refs | Reference-preserving compression |
| **Delegation** | BG ignores hierarchy | Delegations link to hierarchy nodes |

---

## 5. Adopt/Avoid Summary

### ✅ ADOPT (High Confidence)

| Pattern | Source | Reason |
|---------|--------|--------|
| Token-aware context management | DCP | Essential for context limits |
| Message ID injection | DCP | Precise targeting for prune/compress |
| Compression with block placeholders | DCP | Preserves context while reducing tokens |
| Auto-strategies (dedup, supersede) | DCP | Reduces manual intervention |
| Persistent markdown storage | BG | Survives crashes/restarts |
| Readable delegation IDs | BG | Human-friendly references |
| Small model metadata generation | BG | Auto-summaries without main model cost |
| Project ID via git root hash | BG | Cross-worktree consistency |
| Return chaining (simplified) | Subtask2 | Command sequences |
| Session idle as authoritative trigger | Subtask2 | Clean state transitions |
| $TURN reference system | Subtask2 | Message injection |

### ⚠️ ADAPT (Medium Confidence)

| Pattern | Source | Adaptation Needed |
|---------|--------|-------------------|
| Waiter model | BG | Add hierarchy node linking |
| Loop constructs | Subtask2 | Simplify, add token awareness |
| $RESULT references | Subtask2 | Add persistence |
| Return stack | Subtask2 | Drastically simplify |

### ❌ AVOID (High Confidence)

| Pattern | Source | Reason |
|---------|--------|--------|
| Manual mode toggle | DCP | Adds UI complexity |
| Nudge injection | DCP | Tools are sufficient |
| 15-minute hard timeout | BG | Too rigid |
| Read-only enforcement | BG | May be too restrictive |
| Monolithic state.ts | Subtask2 | Maintainability nightmare |
| Inline subtask parsing | Subtask2 | Too much complexity |
| Instruction-only approach | Shell-Strategy | No runtime enforcement |

---

## 6. Implementation Recommendations

### Phase 1: Token Tracking Layer (from DCP)
1. Add `tokenTracking` to `BrainState` schema
2. Implement `countTokens()` using `@anthropic-ai/tokenizer`
3. Add `token_type_counts` to metrics (partially exists)

### Phase 2: Prune/Compress Tools (from DCP)
1. Implement `prune` tool with hierarchy-aware targeting
2. Implement `compress` tool with block placeholders
3. Add auto-strategies: deduplication, supersede-writes

### Phase 3: Delegation System (from BG)
1. Add `delegations` to state schema
2. Implement waiter model with hierarchy linking
3. Add persistent markdown storage
4. Implement readable ID generation

### Phase 4: Return Chain (simplified from Subtask2)
1. Add simplified `returnChain` to state
2. Implement session.idle handler for return advancement
3. Add $RESULT reference resolution

---

## 7. References

- **DCP Repository**: https://github.com/Opencode-DCP/opencode-dynamic-context-pruning (accessed: 2026-03-03)
- **Shell-Strategy Repository**: https://github.com/JRedeker/opencode-shell-strategy (accessed: 2026-03-03)
- **Background-Agents Repository**: https://github.com/kdcokenny/opencode-background-agents (accessed: 2026-03-03)
- **Subtask2 Repository**: https://github.com/spoons-and-mirrors/subtask2 (accessed: 2026-03-03)
- **hivemind-plugin Session Export**: `/Users/apple/hivemindind-plugin/src/lib/session-export.ts`
- **hivemind-plugin Hierarchy Tree**: `/Users/apple/hivemind-plugin/src/lib/hierarchy-tree.ts`

---

## 8. Confidence Assessment

| Finding | Confidence | Justification |
|---------|------------|---------------|
| DCP token tracking mechanism | HIGH | Direct code analysis of `lib/strategies/utils.ts` |
| BG waiter model | HIGH | Direct code analysis of `background-agents.ts` |
| Subtask2 return chain | HIGH | Direct code analysis of `src/features/returns.ts` |
| Integration risks | MEDIUM | Inferred from schema comparison |
| Synthesis architecture | MEDIUM | Proposed design, not yet implemented |
| Performance impact | LOW | Not benchmarked |

---

**End of Report**
</task_result>
```

---

## Assistant (Hivefiver · gpt-5.3-codex · 7.7s)

_Thinking:_

**Updating task statuses**

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Return cycle-based next actions requiring explicit user authorization before execution",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Return cycle-based next actions requiring explicit user authorization before execution",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Hivefiver · gpt-5.3-codex · 10.0s)

_Thinking:_

**Structuring conceptual response plan**

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Return cycle-based next actions requiring explicit user authorization before execution",
      "status": "completed",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Frame user intent and deliver routed architecture-first plan for hivefiver flow",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Run parallel investigations: local hivefiver assets, OpenCode architecture constraints, and referenced plugin patterns",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Synthesize 3 solution paths with evidence-based recommendation and phased authorization gates",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Return cycle-based next actions requiring explicit user authorization before execution",
    "status": "completed",
    "priority": "medium"
  }
]
```

---

## Assistant (Hivefiver · gpt-5.3-codex · 23.7s)

_Thinking:_

**Crafting final comprehensive response**

You are targeting the right layer: heal the meta-builder runtime, not feature code. I ran parallel investigations on the local hivefiver stack, OpenCode architecture constraints, and the 4 reference plugins, then synthesized a deterministic flow direction.

**Current Reality (Evidence-Based)**
- Current runtime path is already close to your intent: bootstrap -> route -> gate -> delegate -> checkpoint/export via `opencode.json`, `.opencode/commands/hivefiver.md`, `.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh`, `.opencode/tool/hiveops_export.ts`.
- Live state backbone exists and is useful for your "session-aware hierarchy" goal: `.hivemind/hive-modules/hivefiver-v2/STATE.md`, `.hivemind/state/hierarchy.json`.
- Biggest blockers are consistency conflicts, not missing capability:
  - duplicate plugin trees: `.opencode/plugin/hiveops-governance/index.ts` vs `.opencode/plugins/hiveops-governance/index.ts`
  - delegation policy mismatch: `agents/hiveminder.md` vs `.opencode/plugin/hiveops-governance/types.ts`
  - boundary-policy mismatch (subsession behavior) between `agents/hiveminder.md` and `.opencode/skills/hivemind-governance/SKILL.md`
  - hierarchy path inconsistency in lifecycle docs vs actual runtime file path
  - startup precedence ambiguity between `agents/hivefiver.md` and `.opencode/skills/hivefiver-prime/SKILL.md`

**3 Solution Paths**
- 1) **Contract-First Canonicalization (Recommended)**: unify one canonical plugin path, one delegation matrix, one session-boundary policy, one hierarchy-path standard, then enforce via gates.
- 2) **Context Engine First**: immediately build token/prune/compress engine (DCP-inspired) + async delegation persistence (background-agents-inspired) + return-chain (subtask2-inspired).
- 3) **Command-Layer First**: prioritize command/router ergonomics and shell strategies, defer deep state/schema normalization.

Option 1 is the best first move because your observed failures are governance drift failures, not algorithmic limitations. You already have substantial machinery; contradictions between policies and runtime hooks are causing determinism loss. Canonicalizing contracts first reduces ambiguity at every turn boundary and makes later automation reliable. Evidence: the current stack already contains gate/checkpoint/export and hierarchy state primitives; the conflicts are mostly cross-file rule divergence.

Options 2 and 3 are valuable but risk amplifying drift if done first. Building advanced context automation on top of conflicting boundaries creates harder-to-debug behavior (especially across main/sub sessions). Improving commands without policy unification improves ergonomics but not correctness. So: normalize contracts, then layer automation.

**Routed Multi-Round Plan (Authorization Gates)**
- Cycle 1 (Audit-to-Canon): produce `governance-contract-matrix-2026-03-03.md` and `session-boundary-policy-2026-03-03.md` with explicit canonical decisions.
- Cycle 2 (Flow Refactor Plan): produce `hivefiver-runtime-flow-2026-03-03.md` mapping deterministic turn lifecycle and enforcement points.
- Cycle 3 (Automation Design): produce `context-intelligence-engine-2026-03-03.md` (token tracking, pruning, compression, delegation persistence, return chain).
- Cycle 4 (Implementation Packet): produce executable change packets (commands/skills/hooks/tools) with risk-sequenced rollout and rollback notes.

If you want, I’ll start **Cycle 1** now and deliver the two dated canonical artifacts first.

---

