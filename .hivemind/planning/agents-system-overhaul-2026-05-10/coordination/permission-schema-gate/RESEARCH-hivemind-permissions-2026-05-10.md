# Hivemind Permission Enforcement Research

**Date:** 2026-05-10 | **Source:** `src/` codebase | **Agent:** hm-l2-researcher
**Status:** COMPLETED

---

## Executive Summary

The Hivemind harness implements a **delegation-time permission resolution** model — permissions are NOT enforced in real-time at the OpenCode level by Hivemind. Instead, the harness resolves agent permissions from YAML frontmatter at delegation dispatch time, computes a conservative tool allowlist for the child session, and injects it as prompt-time tool configuration. OpenCode's native `permission:` frontmatter field is read but Hivemind does not implement its own runtime permission interceptor for `task:`, `skill:`, or `bash:` pattern matching.

**Critical finding:** Hivemind does NOT implement pattern-based permission resolution for `task:`, `skill:`, or `bash:`. The `permission:` field in agent YAML is passed through to OpenCode as a raw record. Hivemind only resolves **tool-level** permissions (edit, write, bash, read, glob, grep) for delegated child sessions. All pattern-based enforcement (e.g., `task: { '*': ask, hm-l2-*: allow }`) is done by OpenCode's native permission system, NOT by Hivemind.

---

## 1. Permission Loading Pipeline

**File → Parse → Compile → Enforce**

### Step 1: YAML Frontmatter Parsing
- **File:** `src/features/bootstrap/primitive-loader.ts:107-161`
- **Mechanism:** `gray-matter` parses the `.md` file, splitting frontmatter from body
- **Schema:** `AgentFrontmatterSchemaLenient` validates the parsed frontmatter
- **Permission field:** Parsed as `z.record(z.string(), z.unknown()).optional()` — a raw dictionary
- **Evidence:** `primitive-loader.ts:113` calls `matter(content)`, then `AgentFrontmatterSchemaLenient.safeParse(parsed.data)` at line 118

### Step 2: Schema Validation of Permission Structure
- **File:** `src/schema-kernel/agent-frontmatter.schema.ts:122`
- **Schema definition:** `permission: z.record(z.string(), z.unknown()).optional()`
- **Important:** This is a **passthrough** — it accepts any key-value structure without deep validation
- The full permission schema exists at `src/schema-kernel/permission.schema.ts` but is NOT applied during agent primitive loading — it's used by `configure-primitive` tool instead

### Step 3: Agent Primitive Enrichment
- **File:** `src/coordination/spawner/agent-primitive-policy.ts:37-51`
- **Function:** `enrichAgentFromPrimitives()` loads `.opencode/agents/` primitives and fills in missing `permission`, `tools`, and `description` fields from local primitive metadata
- **Priority:** SDK metadata takes precedence; local primitive is fallback (`agent.permission ?? primitive.frontmatter.permission`)
- **Evidence:** Line 45: `permission: agent.permission ?? primitive.frontmatter.permission`

### Step 4: Permission Resolution at Delegation Time
- **File:** `src/coordination/spawner/spawn-request-builder.ts:70-95`
- **Function:** `resolveDelegationPermissionProfile()` — the core permission resolver
- **What it does:**
  1. Checks `agent.tools` (legacy boolean map) → if present, uses those
  2. Checks `agent.permission` (pattern-based map) → extracts tool allow/deny
  3. Falls back to task-intent heuristic (review-only vs read-only)
  4. Computes `mode: "read-only" | "review-only" | "write-capable"`

### Step 5: Tool Allowlist Injection
- **File:** `src/coordination/delegation/manager.ts:56-60`
- **Function:** `buildDelegationPromptTools()` constructs a tool map:
  ```typescript
  {
    "read": true,    // from allowed tools
    "glob": true,
    "delegate-task": false,  // recursive delegation blocked
    "task": false,           // recursive task blocked
  }
  ```
- This map is injected into the child session prompt at dispatch time
- **Evidence:** `manager.ts:237`: `tools: buildDelegationPromptTools(child.allowedTools)`

---

## 2. Task Permission Resolution

### How `delegate-task` Controls Delegation
- **Tool:** `src/tools/delegation/delegate-task.ts`
- **Entry point:** `delegationManager.dispatch()` at line 56
- **Validation:** Agent name is validated against available agents (`manager.ts:425-461`)

### Where Permission Check Happens
- **File:** `src/coordination/delegation/manager.ts:163-198` (`dispatch()` method)
- **Checks performed:**
  1. **Nesting depth:** `resolveNestingDepth()` — MAX_DELEGATION_DEPTH (defined in `shared/types.ts`)
  2. **Agent validation:** `validateAgent()` — confirms agent exists in OpenCode registry
  3. **Permission profile resolution:** `resolveDelegationPermissionProfile()` — derives tool allowlist
  4. **Category gate:** `resolveCategoryGateDecision()` — checks category write-read alignment
- **Evidence:** Lines 169-198

### Does Hivemind Match `task:` Patterns?
**NO.** Hivemind does NOT interpret the `task:` permission key from agent frontmatter. The `permission` field is a raw `Record<string, unknown>` that gets passed through. There is no code in `src/` that:
- Matches target agent names against `task:` patterns
- Resolves `'*': ask` vs `'hm-l2-*': allow` specificity
- Implements glob/wildcard matching for delegation targets

**This is entirely OpenCode's native behavior.** OpenCode reads the `permission:` frontmatter field and enforces `task:` patterns at its runtime level.

### Recursive Delegation Prevention
- **File:** `src/coordination/delegation/manager.ts:56-60`
- **Mechanism:** `buildDelegationPromptTools()` sets `delegate-task: false` and `task: false` in child sessions
- This prevents delegated agents from further delegating

---

## 3. Skill Permission Resolution

### How Skill Loading Is Authorized
- **File:** `src/coordination/delegation/category-gates.ts:76-84`
- **Function:** `checkSkillFilterAdvisory()` — currently **advisory only**, NOT enforced
- **Status:** Returns an advisory message when `skillFilter === "curated"` but does NOT block skill loading
- **Evidence:** Lines 63-75 — explicitly documented as "NOT called from any hook or tool yet"

### Does Hivemind Enforce `skill:` Permission Patterns?
**NO.** There is no code in `src/` that:
- Intercepts `skill()` calls at runtime
- Matches skill names against `skill:` permission patterns
- Blocks or allows skill loading based on agent frontmatter

**The `skill:` permission in agent YAML is enforced by OpenCode natively.** Hivemind's `checkSkillFilterAdvisory()` is prepared API surface for future use but is currently not wired into any enforcement path.

### What Hivemind Does for Skills
- The behavioral profile (`src/routing/behavioral-profile/types.ts:38`) defines `SkillFilter = "all" | "curated"` but this is a routing-level classification, not a runtime permission check
- The `skillFilter` is resolved per-session from config mode but not enforced at tool-call time

---

## 4. Bash Permission Resolution

### Does Hivemind Enforce `bash:` Patterns?
**NO.** There is no code in `src/` that:
- Intercepts `bash` tool calls
- Matches bash command strings against `bash:` patterns like `'git *': allow`
- Implements glob or regex matching for bash commands

**The `bash:` permission in agent YAML is enforced by OpenCode natively.**

### What Hivemind Does for Bash
- Hivemind resolves `bash` as a tool-level permission at delegation time
- If `permission.bash` resolves to `deny` at the top level, the child session won't have bash in its tool allowlist
- **File:** `src/coordination/spawner/spawn-request-builder.ts:33` — `WRITE_TOOLS = new Set(["edit", "write", "bash"])`
- If bash is denied, it's excluded from the tool allowlist → the child session cannot use bash at all

### Pattern Matching Specificity
- **File:** `src/schema-kernel/permission.schema.ts:34-38`
- **Documentation:** "Keys are glob-style patterns (`"git *"`, `"*"`, `"internal-*"`); last (most specific) match wins"
- **Reality:** This documentation describes the *schema contract* for the permission format. Hivemind validates the structure but does NOT implement the matching logic. OpenCode implements pattern specificity.

---

## 5. Hidden Field Behavior

### Is `hidden` Used by Hivemind?
**Not directly for runtime behavior.** The `hidden` field is defined in the agent frontmatter schema:
- **File:** `src/schema-kernel/agent-frontmatter.schema.ts:107`
- **Definition:** `hidden: z.boolean().optional()`
- **Purpose:** "Hide from @ autocomplete" — this is an **OpenCode-native** field

### How Hivemind Uses `hidden`
- Hivemind reads the agent frontmatter and passes it through to OpenCode
- The primitive loader validates the field exists but does not act on it
- **No code in `src/` checks `hidden` for delegation decisions** — agent validation only checks agent name existence, not hidden status

### Tab Selection Impact
- `hidden` controls whether an agent appears in OpenCode's `@` autocomplete
- Hivemind's `delegate-task` tool specifies the agent by name explicitly — it doesn't use autocomplete
- **Therefore:** Hidden agents CAN still be delegated to via `delegate-task` if the caller knows the agent name

---

## 6. Mode Enforcement

### How `mode` Affects Behavior
- **File:** `src/schema-kernel/agent-frontmatter.schema.ts:35`
- **Definition:** `AgentModeEnum = z.enum(["primary", "subagent", "all"])`
- **Purpose:** "Determines when the agent is available: primary (top-level), subagent (delegated only), all (both)"

### Does Hivemind Enforce Mode-Based Delegation Direction?
**Partially.** Hivemind validates mode during cross-primitive checks but does NOT block delegation at runtime:

1. **Static validation:** `src/features/bootstrap/runtime-validator.ts:280-294` — `validatePipelinePosition()` checks mode consistency and warns about primary agents with similar descriptions
2. **Runtime enforcement:** There is NO code in the `dispatch()` method or `validateAgent()` that checks the target agent's `mode` before allowing delegation

### Can `mode: subagent` Agents Delegate?
- **Yes.** The `mode` field does NOT prevent delegation at the Hivemind level
- Recursive delegation is prevented by `buildDelegationPromptTools()` setting `delegate-task: false` in child sessions
- This is a **tool-level** restriction, not a mode-based one

### Mode Detection in Pipeline Validation
- **File:** `src/features/bootstrap/runtime-validator.ts:286-289`
- Agents with `mode === "primary"` are collected for overlap checking
- No runtime gate prevents a `primary` agent from being delegated to, or a `subagent` agent from being used in top-level conversations

---

## 7. Cross-Lineage Rules

### Where Does Hivemind Enforce hm→hf Forbidden?
**It doesn't.** There is NO code in `src/` that enforces cross-lineage restrictions:

- **Not in permission schemas:** `permission.schema.ts` accepts any string as permission key
- **Not in primitive loader:** No lineage prefix checking during agent/skill loading
- **Not in delegation manager:** No agent-name-prefix-based restrictions
- **Not in category gates:** No lineage-based category filtering
- **Not in tool guard hooks:** No lineage interception

### Where IS Cross-Lineage Enforcement?
Cross-lineage rules (hm→hf forbidden, hf→hm allowed) exist ONLY in:
1. **Agent system prompts** (`.opencode/agents/*.md`) — instructional enforcement, not code
2. **Skill content** (`.opencode/skills/hm-*/SKILL.md`) — behavioral directives to the LLM
3. **Project-level AGENTS.md** — governance documentation

**This is a prompt-level constraint, not a code-level enforcement.** The LLM is instructed to follow lineage rules but there is no programmatic prevention.

### Cross-Primitive Validation
- **File:** `src/features/bootstrap/cross-primitive-validator.ts`
- Checks: agent→command references, permission deadlocks, role overlaps, missing skill dependencies, MCP server gaps
- **Does NOT check:** lineage prefix compliance, cross-lineage references

---

## 8. Key Findings / Surprises

### Finding 1: Hivemind Does NOT Implement Runtime Permission Enforcement
The harness resolves tool-level permissions at delegation dispatch time and injects them as prompt-time tool maps. All pattern-based permission enforcement (`task:`, `skill:`, `bash:` patterns) is delegated to OpenCode's native runtime.

### Finding 2: Permission Schema Exists But Is Only Used by configure-primitive
The comprehensive permission schema at `src/schema-kernel/permission.schema.ts` (168 lines) defines:
- `PermissionActionSchema` (allow/ask/deny)
- `PatternEntrySchema` (glob→action mapping)
- `PermissionRuleSchema` (structured rules)
- `PermissionRulesetSchema` (union format)
- `AgentPermissionOverrideSchema`

But this schema is only consumed by `configure-primitive` tool and `validate-restart` tool — NOT by the delegation runtime.

### Finding 3: Recursive Delegation Is Tool-Level, Not Permission-Level
Child sessions get `delegate-task: false` and `task: false` injected into their tool map. This is prompt-level prevention, not a hard permission gate.

### Finding 4: Permission Inheritance Validation Is Boot-Time Only
`validateInheritanceChain()` at `runtime-validator.ts:230-257` checks that agents don't broaden global denies — but this runs only during bootstrap validation, not at delegation dispatch time.

### Finding 5: `isPermissionAllowed()` Uses Recursive Deep Check
- **File:** `spawn-request-builder.ts:114-125`
- The function recursively checks if ANY nested value in the permission map resolves to `allow`
- `isPermissionDenied()` requires ALL nested values to be `deny` (strict AND logic)
- This means `{ bash: { '*': 'ask', 'git *': 'allow' } }` would resolve to `allowed` because `git *` has `allow`

### Finding 6: No Glob/Regex Pattern Matching in src/
The harness never compiles or evaluates glob patterns from the `permission:` field. It reads the raw permission value and checks top-level truthiness or string matching (`=== "allow"`, `=== "deny"`, `=== true`, `=== false`).

### Finding 7: Hidden Agents Are Still Delegatable
The `hidden` field only affects OpenCode autocomplete. Hivemind's `validateAgent()` only checks agent name existence — hidden agents can be delegated to by name.

### Finding 8: Category Gates Are the Only Runtime Permission Gate
`resolveCategoryGateDecision()` at `category-gates.ts:23-50` is the only runtime permission gate that checks:
- Unknown categories (deny by default)
- Read-only categories with write-capable tools (deny)

---

## 9. Permission Resolution Flow Diagram

```
Agent YAML Frontmatter
  permission: { task: { '*': ask, 'hm-l2-*': allow }, bash: { '*': ask, 'git *': allow } }
       │
       ▼
gray-matter parse (primitive-loader.ts:113)
       │
       ▼
AgentFrontmatterSchemaLenient.safeParse (primitive-loader.ts:118)
  → permission: Record<string, unknown>  (passthrough, no deep validation)
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
At delegation time                      configure-primitive tool
(manager.ts:180)                        Uses full PermissionRulesetSchema
       │
       ▼
enrichAgentFromPrimitives (agent-primitive-policy.ts:37)
  → fills missing permission from local .opencode/agents/
       │
       ▼
resolveDelegationPermissionProfile (spawn-request-builder.ts:70)
  → checks agent.permission[key] for "allow"/"deny"/true/false
  → isPermissionAllowed() recursively checks nested values
  → produces { mode: "read-only"|"write-capable", tools: string[] }
       │
       ▼
buildDelegationPromptTools (manager.ts:56)
  → { read: true, edit: true, ..., "delegate-task": false, "task": false }
       │
       ▼
Injected into child session prompt (manager.ts:237)
  → OpenCode enforces these tool-level permissions natively
```

---

## 10. Gaps and Unanswered Questions

| Question | Status |
|----------|--------|
| Does OpenCode interpret `task:` patterns for delegate-task? | **GAP** — needs OpenCode source verification |
| Does OpenCode implement glob specificity ordering? | **GAP** — needs OpenCode source verification |
| Does OpenCode block `skill()` calls based on `skill:` permission? | **GAP** — needs OpenCode source verification |
| Can a delegated child session bypass `delegate-task: false`? | **GAP** — depends on OpenCode prompt enforcement |
| Is `hidden` enforced at OpenCode autocomplete level? | **GAP** — Hivemind doesn't enforce it |
| Does `mode: subagent` prevent top-level usage in OpenCode? | **GAP** — Hivemind doesn't enforce it |

---

## Source File Index

| File | Key Lines | Purpose |
|------|-----------|---------|
| `src/features/bootstrap/primitive-loader.ts` | 107-161 | YAML frontmatter parsing with gray-matter |
| `src/schema-kernel/agent-frontmatter.schema.ts` | 77-133 | Agent frontmatter validation (permission as passthrough) |
| `src/schema-kernel/permission.schema.ts` | 1-168 | Full permission schema (used by configure-primitive only) |
| `src/coordination/spawner/agent-primitive-policy.ts` | 37-51 | Agent enrichment from local primitives |
| `src/coordination/spawner/spawn-request-builder.ts` | 70-125 | Permission profile resolution and tool extraction |
| `src/coordination/spawner/spawner-types.ts` | 27-32 | DelegationPermissionProfile type |
| `src/coordination/delegation/manager.ts` | 56-60, 163-198, 425-461 | Delegation dispatch, agent validation, tool injection |
| `src/coordination/delegation/category-gates.ts` | 23-84 | Category gate decisions and skill filter advisory |
| `src/hooks/guards/tool-guard-hooks.ts` | 53-156 | Circuit breaker and budget enforcement (NOT permission) |
| `src/tools/delegation/delegate-task.ts` | 28-73 | Delegation tool wrapper |
| `src/shared/types.ts` | 31-48, 208-228 | Delegation categories, permission types |
| `src/shared/helpers.ts` | 129-142 | Permission rule → tool compatibility mapping |
| `src/features/bootstrap/runtime-validator.ts` | 230-270 | Permission inheritance validation (boot-time) |
| `src/features/bootstrap/cross-primitive-validator.ts` | 99-130 | Permission deadlock detection (boot-time) |
| `src/plugin.ts` | 52-187 | Composition root (no permission logic) |
| `src/config/subscriber.ts` | 1-78 | Config caching (no permission logic) |
