# OpenCode Agent YAML Schema Research

**Date:** 2026-05-10 | **Source:** anomalyco/opencode (active repo) | **Status:** COMPLETED
**Researcher:** hm-l2-researcher (L2 specialist, hm-* lineage)

---

## Source Files Examined

| File | Purpose |
|------|---------|
| `packages/opencode/src/config/agent.ts` | Agent YAML frontmatter schema definition (`AgentSchema`), parsing, normalization, and file loading |
| `packages/opencode/src/agent/agent.ts` | Runtime `Agent.Info` type — the resolved agent structure after config merge |
| `packages/opencode/src/config/permission.ts` | `ConfigPermission.Info` schema — how permission blocks are parsed from YAML |
| `packages/opencode/src/permission/index.ts` | Runtime `Permission.Ruleset`, `Permission.fromConfig()`, `Permission.merge()`, `Permission.evaluate()` |
| `packages/opencode/src/permission/evaluate.ts` | `evaluate()` function — rule matching logic (`findLast` strategy) |
| `packages/opencode/src/util/wildcard.ts` | `Wildcard.match()` — glob-to-regex pattern matching engine |
| `packages/opencode/src/tool/task.ts` | `task` tool — delegation dispatch, permission inheritance for child sessions |

---

## Valid Frontmatter Fields

The authoritative schema is `AgentSchema` in `packages/opencode/src/config/agent.ts` (uses Effect Schema `Schema.StructWithRest`).

| Field | Type | Required | Valid Values | YAML Key | Notes |
|-------|------|----------|-------------|----------|-------|
| `name` | string | **Derived** | Any string | (not in frontmatter) | Derived from filename by `configEntryNameFromPath()`. **Not parsed from YAML frontmatter.** Present in KNOWN_KEYS for normalization but set by `load()`. |
| `model` | `{modelID: string, providerID: string}` | No | Any valid model/provider ID | `model` | Optional model override |
| `variant` | string | No | Any string | `variant` | Default model variant for this agent (only when using agent's configured model) |
| `temperature` | Finite number | No | 0.0–2.0 (model-dependent) | `temperature` | Controls LLM randomness |
| `top_p` | Finite number | No | 0.0–1.0 | `top_p` | Nucleus sampling. **NOTE:** YAML uses `top_p` (snake_case), runtime uses `topP` (camelCase) |
| `prompt` | string | No | Any string | `prompt` | System instructions. Also populated from markdown body content |
| `tools` | Record\<string, boolean\> | No | **DEPRECATED** | `tools` | Replaced by `permission` field. Normalized to permission rules during parse |
| `disable` | boolean | No | true/false | `disable` | If true, agent is removed from registry entirely |
| `description` | string | No | Any string | `description` | When-to-use description |
| `mode` | literal | No | `"subagent"` \| `"primary"` \| `"all"` | `mode` | Defaults to `"all"` if not specified. Determines agent availability scope |
| `hidden` | boolean | No | true/false | `hidden` | If true, hides from `@` autocomplete and primary selection. **Only meaningful for `mode: subagent`** |
| `options` | Record\<string, any\> | No | Any key-value | `options` | Arbitrary options passed to agent. Unknown frontmatter keys are auto-promoted into options |
| `color` | string | No | `#RRGGBB` hex OR theme literal | `color` | Theme literals: `"primary"`, `"secondary"`, `"accent"`, `"success"`, `"warning"`, `"error"`, `"info"` |
| `steps` | PositiveInt | No | Positive integer | `steps` | Maximum agentic iterations before forcing text-only response. **Replaces deprecated `maxSteps`** |
| `maxSteps` | PositiveInt | No | **DEPRECATED** | `maxSteps` | Use `steps` instead. Normalized: `steps ?? maxSteps` |
| `permission` | ConfigPermission.Info | No | See Permission Model below | `permission` | Tool access rules |

### Additional known keys (in KNOWN_KEYS but not in schema fields)
These are recognized during normalization to prevent them from being auto-promoted to `options`:
- `name` — set from filename, not parsed from YAML
- `tools` — deprecated, normalized to permission

### Fields NOT recognized by OpenCode (Hivemind-internal)
The following fields are **NOT** part of OpenCode's schema. They are Hivemind-internal concepts:
- `depth` — Hivemind L0/L1/L2/L3 hierarchy classification
- `lineage` — Hivemind hm-*/hf-*/gate-*/stack-* lineage prefix
- `domain` — Hivemind task domain classification
- `instruction` / `instructions` — **NOT valid OpenCode fields**. OpenCode uses `prompt` or markdown body content
- `skills` — **NOT an OpenCode frontmatter field**. Skills are loaded at runtime by the skill tool, not listed in agent config

**Why these are Hivemind-internal:** None appear in `AgentSchema` or `Agent.Info` in the OpenCode source. They are added by Hivemind's agent definitions for internal routing/classification purposes. OpenCode silently promotes them into `options` via the `StructWithRest` catch-all.

---

## Permission Model

### Schema Definition (config/permission.ts)

The `ConfigPermission.Info` type is defined as:
```
Info = InputObject  // after normalization
```

Where `InputObject` is:
```
StructWithRest({
  read: optional(Rule),
  edit: optional(Rule),
  glob: optional(Rule),
  grep: optional(Rule),
  list: optional(Rule),
  bash: optional(Rule),
  task: optional(Rule),
  external_directory: optional(Rule),
  todowrite: optional(Action),
  question: optional(Action),
  webfetch: optional(Action),
  websearch: optional(Action),
  lsp: optional(Rule),
  doom_loop: optional(Action),
  skill: optional(Rule),
}, [Record<String, Rule>])  // <-- additional custom keys allowed
```

### Tool Permissions

| Permission Key | Tools Gated | Rule Type | Notes |
|---------------|-------------|-----------|-------|
| `read` | `read` | Rule (action or object) | Can use glob patterns for file paths |
| `edit` | `write`, `edit`, `apply_patch` | Rule (action or object) | **Collapsed**: all three tools map to `edit` permission |
| `glob` | `glob` | Rule (action or object) | |
| `grep` | `grep` | Rule (action or object) | |
| `list` | `list` | Rule (action or object) | |
| `bash` | `bash` | Rule (action or object) | Can use command patterns |
| `task` | `task` (delegation) | Rule (action or object) | Patterns match agent names (subagent_type) |
| `external_directory` | Any file I/O outside worktree | Rule (action or object) | Patterns are directory/file paths |
| `todowrite` | `todowrite`, `todoread` | Action only | Shorthand only |
| `question` | `question` | Action only | Shorthand only |
| `webfetch` | `webfetch` | Action only | Shorthand only |
| `websearch` | `websearch` | Action only | Shorthand only |
| `lsp` | `lsp` | Rule (action or object) | |
| `doom_loop` | Recovery prompts when stuck | Action only | Shorthand only |
| `skill` | `skill` | Rule (action or object) | Patterns match skill names |
| `plan_enter` | Plan mode entry | Action only | |
| `plan_exit` | Plan mode exit | Action only | |

**Custom keys:** Any additional key is accepted and treated as a `Rule` type (action or pattern→action object). This allows MCP tools and custom tools to have their own permission entries.

### Valid Actions

Three possible actions (defined in `ConfigPermission.Action`):
- `"allow"` — Tool executes without user confirmation
- `"ask"` — Tool is blocked entirely
- `"ask"` — User is prompted for permission before execution

### Rule Types

Each permission key accepts one of two forms:

1. **Shorthand (Action string):** Applies to all patterns
   ```yaml
   permission:
     bash: allow        # all bash commands allowed
     websearch: ask    # websearch blocked
   ```

2. **Pattern object (Record<string, Action>):** Fine-grained per-pattern control
   ```yaml
   permission:
     read:
       "*": allow           # default: allow all reads
       "*.env": ask         # .env files require approval
       "*.env.*": ask       # .env.local, .env.production etc require approval
     edit:
       "*": ask            # default: ask all edits
       "src/**": allow      # except src/ directory
     task:
       "*": ask            # ask delegation to all agents by default
       "general": allow     # allow delegation to general agent
       "explore": allow     # allow delegation to explore agent
   ```

### Wildcard Behavior

Source: `packages/opencode/src/util/wildcard.ts`

The `*` character in patterns is **glob-based**, not regex:

| Pattern | Behavior |
|---------|----------|
| `*` | Matches anything (zero or more characters) |
| `?` | Matches exactly one character |
| `*.env` | Matches any string ending in `.env` |
| `src/**` | Matches `src/` followed by any path |
| `git *` | **Special:** Matches `git` with optional trailing arguments. Pattern ending with ` *` (space + star) makes the trailing part optional |

Implementation detail: `*` → `.*` regex, `?` → `.` regex, with anchoring (`^...$`). Backslashes are normalized to forward slashes. Case-insensitive on Windows, case-sensitive on Unix.

### Cascading/Override Rules

Source: `packages/opencode/src/permission/evaluate.ts`

**Critical:** The evaluation uses `findLast` — **the LAST matching rule wins**.

```typescript
const match = rules.findLast(
  (rule) => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern),
)
return match ?? { action: "ask", permission, pattern: "*" }
```

This means:
1. Rules are evaluated in order
2. The last rule that matches both the permission name AND the pattern wins
3. If no rule matches, the default action is `"ask"`

**Implication for YAML ordering:** Order matters! More specific rules should come AFTER general rules. For example:
```yaml
permission:
  read:
    "*": allow         # first rule: allow everything
    "*.env": ask       # second rule: ask for .env files (OVERRIDES for .env)
```

### Permission Merge Strategy

Source: `packages/opencode/src/permission/index.ts` — `merge()` function

```typescript
export function merge(...rulesets: Ruleset[]): Ruleset {
  return rulesets.flat()
}
```

Permission rulesets are **flat-concatenated**, not deep-merged. This means:
- Defaults are applied first
- User config is appended after defaults
- Agent-specific config is appended last
- Since `findLast` wins, later rules override earlier ones

The merge order in `agent.ts` is: `defaults → user config → agent-specific config`

---

## Mode Semantics

Source: `packages/opencode/src/agent/agent.ts`

### `mode: primary`
- Agent appears as a selectable tab in the TUI
- Can be set as the default agent (`default_agent` config)
- **Cannot** be delegated to via the `task` tool (it's not listed in `@` autocomplete for delegation)
- The `defaultAgent()` function validates: primary agent must NOT be `mode: subagent` and must NOT be `hidden: true`
- Examples: `build`, `plan`

### `mode: subagent`
- Agent does NOT appear as a selectable tab
- Available for delegation via the `task` tool
- Appears in `@` autocomplete menu (unless `hidden: true`)
- **Can delegate to other agents** if `task` permission allows it — mode does NOT restrict delegation ability
- If target agent doesn't have `task` in its permission ruleset, the task tool is removed from its available tools
- Examples: `general`, `explore`

### `mode: all`
- Agent can function as BOTH primary and subagent
- This is the **default** if no mode is specified (see new agent creation in `agent.ts`)
- Appears both as a tab AND in delegation autocomplete
- Examples: user-defined custom agents

### Delegation chain behavior

Source: `packages/opencode/src/tool/task.ts`

- A subagent CAN delegate to another agent if its `task` permission allows it
- The task tool checks `patterns: [params.subagent_type]` against the calling agent's task permission rules
- Child sessions inherit `external_directory` rules and `ask` rules from parent
- If the target agent has no `task` rule in its permission ruleset, the task tool is explicitly denied in the child session
- If the target agent has no `todowrite` rule, todowrite is denied in the child session

---

## Hidden Field

Source: `packages/opencode/src/config/agent.ts` line 24-26

```typescript
hidden: Schema.optional(Schema.Boolean).annotate({
  description: "Hide this subagent from the @ autocomplete menu (default: false, only applies to mode: subagent)",
}),
```

- **Type:** Optional boolean
- **Default:** false (not hidden)
- **Effect:** When true, agent is excluded from `@` autocomplete menu AND cannot be selected as primary agent
- **Scope:** Only meaningful for `mode: subagent` agents. For primary agents, being hidden prevents them from being set as default
- **Use case:** Internal utility agents (compaction, title, summary) that should not be user-visible

---

## Key Findings / Surprises

### 1. `name` is NOT a frontmatter field
The agent name is derived from the filename, not from YAML frontmatter. The `load()` function extracts the name from the file path using `configEntryNameFromPath()` with patterns like `/.opencode/agent/`, `/.opencode/agents/`, `/agent/`, `/agents/`.

### 2. `top_p` vs `topP` — snake_case in YAML, camelCase in runtime
YAML frontmatter uses `top_p` (snake_case). The runtime `Agent.Info` schema uses `topP` (camelCase). The normalization in `agent.ts` maps `value.top_p` → `item.topP`.

### 3. Unknown keys are auto-promoted to `options`
The `AgentSchema` uses `Schema.StructWithRest` with `[Record<String, Any>]`, meaning any unrecognized key is collected and preserved in the `options` field. This means Hivemind-internal fields like `depth`, `lineage`, `domain` silently survive parsing but are not used by OpenCode itself.

### 4. `tools` (deprecated) is auto-converted to `permission`
The old `tools: { name: boolean }` map is normalized: enabled tools become `"allow"`, disabled become `"ask"`. Write-adjacent tools (`write`, `edit`, `patch`) all collapse into `permission.edit`.

### 5. `disable` field exists but is not in the Agent.Info runtime schema
The `disable` field is in the config schema but used only during agent loading — disabled agents are deleted from the registry entirely. It does not appear in the runtime `Agent.Info`.

### 6. LAST matching rule wins (not first)
This is counter-intuitive. More specific rules must appear AFTER general rules in the YAML. The `findLast` strategy combined with flat-concatenation of rulesets means later config layers override earlier ones.

### 7. `task` permission patterns match agent names
When an agent calls the task tool, the permission check uses `patterns: [params.subagent_type]` — the target agent's name is the pattern matched against. This means task permission can control exactly which agents can be delegated to.

### 8. `edit` permission gates 3 tools
The `edit` permission key gates `write`, `edit`, AND `apply_patch` tools. This is done via the `EDIT_TOOLS` array in `permission/index.ts`.

### 9. Modes directory
Agents can also be defined in `{mode,modes}/*.md` directories, which are automatically given `mode: "primary"`. This is the "modes" feature — primary agents loaded from mode files.

### 10. Default agent cannot be subagent or hidden
The `defaultAgent()` function explicitly validates that the default agent must be `mode !== "subagent"` and `hidden !== true`.

---

## Schema Reference (for YAML authors)

```yaml
---
# Required-derived fields (set from filename)
# name: derived from filename

# Optional fields
description: "Description of when to use this agent"
mode: subagent | primary | all    # default: all
hidden: true | false              # default: false
temperature: 0.05                 # LLM temperature
top_p: 0.9                        # nucleus sampling (snake_case in YAML!)
color: "#FF5733"                  # hex or theme literal
steps: 50                         # max agentic iterations
variant: "default"                # model variant
disable: false                    # remove agent from registry

# Model override
model:
  modelID: "claude-sonnet-4-20250514"
  providerID: "anthropic"

# Permission rules (task, skill accept pattern objects)
permission:
  read: allow                     # shorthand
  edit:                           # pattern object
    "*": ask
    "src/**": allow
  task:                           # controls delegation
    "*": ask
    "general": allow
    "explore": allow
  skill:                          # controls skill loading
    "*": allow
  bash: allow
  webfetch: ask
  websearch: ask
  question: ask
  doom_loop: ask

# Deprecated (use permission instead)
# tools:
#   read: true
#   edit: false
# maxSteps: 50   # use steps instead
---

Agent system prompt goes here as markdown body content.
```

---

## Evidence Chain

| Finding | Source File | Evidence |
|---------|-----------|----------|
| Valid frontmatter fields | `packages/opencode/src/config/agent.ts` | `AgentSchema = Schema.StructWithRest(...)` definition |
| Mode values | `packages/opencode/src/config/agent.ts` | `mode: Schema.optional(Schema.Literals(["subagent", "primary", "all"]))` |
| Hidden semantics | `packages/opencode/src/config/agent.ts` | `.annotate({ description: "Hide this subagent from the @ autocomplete menu..." })` |
| Permission actions | `packages/opencode/src/config/permission.ts` | `Action = Schema.Literals(["ask", "allow", "ask"])` |
| Rule vs Action types | `packages/opencode/src/config/permission.ts` | Known keys with `Rule` vs `Action` type in `InputObject` |
| findLast evaluation | `packages/opencode/src/permission/evaluate.ts` | `rules.findLast(...)` |
| Glob pattern matching | `packages/opencode/src/util/wildcard.ts` | `*` → `.*`, space+star optional trailing |
| Task delegation control | `packages/opencode/src/tool/task.ts` | `ctx.ask({ permission: id, patterns: [params.subagent_type] })` |
| Name from filename | `packages/opencode/src/config/agent.ts` | `const name = configEntryNameFromPath(item, patterns)` |
| top_p snake_case | `packages/opencode/src/config/agent.ts` | `top_p: Schema.optional(Schema.Finite)` vs runtime `topP` |
| Unknown keys → options | `packages/opencode/src/config/agent.ts` | `StructWithRest` + normalization loop |
| tools → permission conversion | `packages/opencode/src/config/agent.ts` | `normalize()` function |
| Default mode = "all" | `packages/opencode/src/agent/agent.ts` | `mode: "all"` in new agent creation |
| Subagent can delegate | `packages/opencode/src/tool/task.ts` | No mode check in task tool — only permission check |
