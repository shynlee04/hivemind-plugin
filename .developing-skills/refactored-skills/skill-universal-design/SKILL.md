---
name: skill-universal-design
description: Design skills that work universally across platforms, frameworks, and agent systems without runtime lock-in
---

# skill-universal-design

## Purpose

- Define patterns for platform-agnostic skill design that work across any agent runtime
- Ensure skills use framework-independent terminology and concepts
- Provide validation criteria for universal applicability
- Establish abstraction layers that decouple from specific runtimes, SDKs, or tool conventions
- Create reusable skill templates consumable by any agent system (OpenCode, Claude Code, Cursor, Gemini CLI, custom runtimes)
- Prevent framework-specific assumptions from leaking into skill design

## Use This For

- Designing new skills that must work across multiple platforms and agent frameworks
- Auditing existing skills for platform lock-in and runtime dependencies
- Refactoring HiveMind-specific skills to be universally applicable
- Creating skill templates for cross-framework consumption
- Validating that a skill does not depend on runtime-specific features, tool names, or SDK patterns

## Do Not Use This For

- Skill conflict detection (use `skill-conflict-detect`)
- Skill quality scoring (use `hivemind-skill-doctor`)
- Skill creation mechanics (use `use-hivemind-skill-writer`)
- Skill authoring conventions (use `hivemind-skill-write`)
- Agent role boundary enforcement (use `agent-role-boundary`)

## Prerequisites

- Understanding of at least 2 agent frameworks (OpenCode, Claude Code, Cursor, etc.)
- `hivemind-skill-write` loaded for base authoring conventions
- Familiarity with the target skill's domain (delegation, research, debugging, etc.)

## Universal Design Principles

### Principle 1: Terminology Abstraction

Use generic, cross-platform terms that any agent framework can interpret.

| HiveMind-Specific | Universal Equivalent | Why |
|---|---|---|
| "Claude" or "OpenCode agent" | **agent** | Generic runtime-independent term |
| "Task tool" | **subagent invocation** | Not tied to a specific tool name |
| "delegation packet" | **task specification** | Avoids framework-specific JSON formats |
| `tool.schema` (Zod) | **schema definition** | Generic, not SDK-bound |
| "plugin hook" | **lifecycle event handler** | Abstract, platform-neutral |
| "OpenCode session" | **agent session** | Works in any framework |
| `hivemind_runtime_*` | **runtime command** | Not branded to a specific ecosystem |
| "Skill tool invocation" | **capability activation** | Framework-agnostic description |

**Rule:** If removing the brand name changes the meaning, the term is too specific. Replace it.

### Principle 2: Capability Contract

Define **WHAT** the skill needs, not **HOW** the platform provides it.

```markdown
# BAD (platform-bound):
"Use the `task` tool to spawn a subagent with subagent_type='hivexplorer'"

# GOOD (capability contract):
"Delegate a read-only investigation subagent that:
- Receives a scope description and context
- Returns findings with file paths and evidence
- Does not mutate state"
```

Capability contracts specify:
1. **Inputs** — what the subagent receives
2. **Constraints** — what it must/must not do
3. **Outputs** — what it returns
4. **Verification** — how the caller validates success

Each framework maps these to its own primitives.

### Principle 3: Framework-Agnostic Workflow

Workflow steps use generic cognitive concepts, not tool-specific verbs.

| Bad (Platform-Specific) | Good (Generic) |
|---|---|
| "Call `bash` tool with `npm test`" | "Execute the test suite" |
| "Use `Read` tool to load file" | "Read the target file" |
| "Use `Edit` tool to modify" | "Apply the change to the file" |
| "Use `Grep` tool to search" | "Search file contents for pattern" |
| "Use `Glob` tool to find files" | "Discover files matching pattern" |
| "Load the `tdd` skill" | "Activate the TDD methodology" |
| "Run `npx tsc --noEmit`" | "Run type checking" |

**Pattern:** Generic verb + generic object. "Execute test suite" not "Run `npm test` with Bash tool."

### Principle 4: Portable Evidence Format

Evidence uses JSON or Markdown — never platform-specific output formats.

```json
{
  "_meta": {
    "format": "universal-evidence-v1",
    "created_at": "2026-03-24T10:00:00Z",
    "framework": "any"
  },
  "verification": {
    "type_check": { "command": "type check", "passed": true },
    "test_suite": { "command": "test runner", "passed": true, "total": 42, "failed": 0 },
    "build": { "command": "build", "passed": true }
  },
  "files_modified": ["src/example.ts"],
  "evidence_artifacts": ["tests/output.log"]
}
```

**Requirements:**
- `_meta.format` identifies the evidence schema version
- All timestamps are ISO 8601
- Commands are described generically ("type check", not "npx tsc --noEmit")
- File paths use forward slashes (POSIX-compatible)
- No framework-specific serialization (no SDK objects, no tool output wrappers)

### Principle 5: Progressive Enhancement

The core workflow works everywhere. Platform-specific features are opt-in extensions.

```markdown
## Core Workflow (universal)
1. Read the delegation specification
2. Load context from target files
3. Implement the change
4. Verify (type check, test, build)
5. Return evidence

## OpenCode Extensions (opt-in)
- Use `tool.schema` (Zod) for tool argument definitions
- Use `context.sessionID` for session-aware operations
- Use `client.app.log()` for structured logging

## Claude Code Extensions (opt-in)
- Use slash command format for user-facing commands
- Use subagent spawning via Task tool
- Use MCP servers for extended capabilities
```

**Rule:** The skill MUST describe a complete workflow in the Core section. Extensions add value but never gate functionality.

## Platform Abstraction Matrix

| Concept | OpenCode Implementation | Claude Code Implementation | Generic Description |
|---|---|---|---|
| Agent invocation | `tool({ ... })` plugin SDK | Claude as the agent | An agent processes tasks |
| Subagent delegation | Workflow + agents | `Task` tool with subagent_type | Spawn a specialized subagent |
| Schema validation | `tool.schema` (Zod) | Manual validation or Zod | Type-safe argument validation |
| Session context | `context.sessionID` | Conversation session | Agent session identifier |
| File operations | `client.file.*` | File system tools | Read/write/search files |
| Test execution | `npx tsx --test` | `npm test` via Bash | Execute the test suite |
| Type checking | `npx tsc --noEmit` | `npx tsc --noEmit` | Run the type checker |
| Build | `npm run build` | `npm run build` | Build the project |
| Tool definition | `tool({ description, args, execute })` | Function definition | Define a capability with inputs and execution |
| Permission gating | `permission.ask` / `context.ask()` | Permission mode | Gate state mutations with consent |
| Structured logging | `client.app.log()` | `console.log` | Emit structured log entries |
| Hook system | Plugin hooks (17 available) | Not available | Lifecycle event interception |
| Skill loading | `skill()` tool | SKILL.md in context | Activate domain methodology |
| Agent roles | AGENTS.md frontmatter | Agent profiles | Define agent capabilities and constraints |

## Validation Checklist

A skill achieves universal applicability when it passes all 20 checks.

### Terminology (5 checks)

| # | Check | Pass Criteria |
|---|---|---|
| 1 | No framework-specific brand names in workflow steps | Zero occurrences of "OpenCode", "Claude", "Cursor", "Gemini" in step descriptions |
| 2 | Generic tool references | No direct references to tool names (`bash`, `Read`, `Edit`, `Grep`, `Glob`) |
| 3 | Generic subagent terminology | Uses "subagent" or "specialized agent", not "Task tool" or specific spawn mechanism |
| 4 | Generic schema terminology | Uses "schema definition", not "tool.schema" or "Zod" |
| 5 | Generic verification terminology | Uses "type check", "test suite", "build" — not specific CLI commands |

### Workflow (5 checks)

| # | Check | Pass Criteria |
|---|---|---|
| 6 | Steps are platform-neutral | Any agent in any framework can follow the steps |
| 7 | No SDK imports required | Core workflow does not require importing a framework-specific SDK |
| 8 | No runtime API assumptions | Workflow does not assume a specific runtime API exists |
| 9 | Verification is generic | Verification steps describe outcomes, not commands |
| 10 | Delegation is capability-based | Subagent delegation specifies capabilities needed, not tool invocations |

### Evidence (5 checks)

| # | Check | Pass Criteria |
|---|---|---|
| 11 | Evidence uses JSON or Markdown | No proprietary output formats |
| 12 | Evidence includes `_meta` with format version | Schema is versioned and identifiable |
| 13 | Timestamps are ISO 8601 | All dates in `YYYY-MM-DDTHH:MM:SSZ` format |
| 14 | File paths are POSIX-compatible | Forward slashes, relative to project root |
| 15 | No SDK objects in evidence output | Evidence is pure data, not serialized SDK types |

### Structure (5 checks)

| # | Check | Pass Criteria |
|---|---|---|
| 16 | Progressive enhancement model | Core workflow is complete without extensions |
| 17 | Extensions are opt-in and labeled | Platform-specific additions are clearly marked |
| 18 | Prerequisites are framework-neutral | No prerequisite requires a specific framework |
| 19 | Anti-patterns are generic | Anti-pattern descriptions use generic terms |
| 20 | Independence rules present | Skill declares what it does NOT cover |

## Anti-Patterns

| Anti-Pattern | Example | Universal Alternative |
|---|---|---|
| **Platform-branded steps** | "Use the Task tool to spawn hivexplorer" | "Delegate a read-only investigation subagent" |
| **SDK-bound imports** | `import { tool } from '@opencode-ai/plugin'` | Describe capability contract; let platform map it |
| **Hardcoded CLI commands** | "Run `npx tsc --noEmit`" | "Run the type checker" |
| **Tool name references** | "Use Bash tool for npm test" | "Execute the test suite" |
| **Runtime API assumptions** | `context.sessionID` in workflow steps | "Use the current session identifier" |
| **Format-specific evidence** | OpenCode tool output JSON | `_meta` versioned evidence JSON |
| **Framework-specific validation** | "Verify tool.schema is Zod" | "Verify schema definition is present and valid" |
| **Branded terminology** | "Hiveminder delegates to Hivemaker" | "Orchestrator delegates to executor agent" |
| **Missing abstraction layer** | Direct SDK usage in skill steps | Describe in terms of capabilities and contracts |
| **Monolithic platform coupling** | Skill only works if OpenCode hooks exist | Core works standalone; hooks are enhancement |

## Independence Rules

This skill covers:

- Designing skills for universal applicability
- Auditing skills for platform lock-in
- Creating abstraction layers and terminology mappings
- Providing validation criteria for cross-framework compatibility

This skill does NOT cover:

- Skill creation mechanics (use `hivemind-skill-write` / `use-hivemind-skill-writer`)
- Skill quality scoring (use `hivemind-skill-doctor`)
- Skill conflict detection (use `skill-conflict-detect`)
- Agent role boundaries (use `agent-role-boundary`)
- Specific framework implementation (use framework-specific skills)

## Workflow

When designing or auditing a skill for universal applicability:

### Step 1: Terminology Audit

Scan the skill for platform-specific terms. Replace with universal equivalents from the abstraction matrix.

**Input:** Skill SKILL.md file
**Process:** Line-by-line scan for branded terms, tool names, SDK references
**Output:** List of replacements needed

### Step 2: Capability Extraction

Identify each capability the skill needs. Express as generic contracts (inputs, constraints, outputs, verification).

**Input:** Skill workflow steps
**Process:** Extract WHAT is needed, remove HOW it is provided
**Output:** Capability contract list

### Step 3: Workflow Generalization

Rewrite workflow steps using generic verbs and objects. Remove tool-specific invocations.

**Input:** Capability contracts + original workflow
**Process:** Map each step to generic cognitive concept
**Output:** Platform-neutral workflow

### Step 4: Evidence Portability

Ensure evidence output uses versioned JSON or Markdown. Remove SDK-specific serialization.

**Input:** Evidence sections and verification commands
**Process:** Replace specific commands with generic descriptions; add `_meta` format marker
**Output:** Portable evidence specification

### Step 5: Progressive Enhancement

Separate core workflow from platform-specific extensions. Core must be complete standalone.

**Input:** Full skill definition
**Process:** Partition into core + labeled extensions
**Output:** Skill with clear core/enhancement boundary

### Step 6: Validate

Run the 20-point validation checklist. All checks must pass.

**Input:** Generalized skill
**Process:** Apply each checklist item
**Output:** Validation report with pass/fail per check

## Extension Pattern

When a skill must include platform-specific guidance, use this pattern:

```markdown
## Core Workflow
[universal steps that work everywhere]

## Extensions

<details>
<summary>OpenCode Extension</summary>

### OpenCode-Specific Features
- Use `tool.schema` for Zod-based argument validation
- Use `context.sessionID` for session-aware operations
- Use plugin hooks for lifecycle interception

</details>

<details>
<summary>Claude Code Extension</summary>

### Claude Code-Specific Features
- Use slash commands for user-facing operations
- Use Task tool for subagent spawning
- Use MCP servers for extended capabilities

</details>
```

This keeps the core scannable while platform details are available on demand.
