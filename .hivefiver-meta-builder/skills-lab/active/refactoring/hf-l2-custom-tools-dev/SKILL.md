---
name: hf-l2-custom-tools-dev
description: This skill should be used when the user asks to "create a custom tool", "build an OpenCode plugin", "write a tool with Zod schema", "add a plugin hook", "create CLI script", "build a tool for agent", mentions tool() helper, Zod validation, plugin lifecycle, hooks (PreToolUse, PostToolUse), bin/ scripts, or needs guidance on OpenCode plugin SDK and custom tool architecture.
metadata:
  consumed-by:
    - "hf-l2-tool-builder"
  lineage-scope: "hf-*"
  access: "STRICT"
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# custom-tools-dev

Build OpenCode plugins, custom tools, and CLI scripts. Tools are write-side (mutate state), hooks are read-side (observe events). Plugin layer is thin assembly only — no business logic.

## The Iron Law

```
NO TOOL WITHOUT A ZOD SCHEMA
```

Every custom tool validates arguments with Zod. No `any` types. No unvalidated input. Schema first, implementation second. If you can't define the schema, you don't understand the tool.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use z.any() and validate in the function" | Type safety lost. Agent can't see what the tool expects. | Zod schema IS the interface. If it's z.any(), there's no interface. |
| "The tool does many things, one schema won't cover it" | Tool is too broad. Split it. | One tool = one thing. Multiple things = multiple tools. |
| "I'll put business logic in the plugin layer" | Plugin layer becomes the app. Violates architecture. | Plugin layer is assembly only (<100 LOC). Business logic goes in tools. |
| "The script can mutate state directly" | State mutation outside CQRS tools = unpredictable behavior. | Scripts report facts. Tools mutate state. Never the reverse. |
| "I'll hardcode the state directory path" | Breaks on different machines, different users. | Use environment variables or config. No hardcoded paths. |

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`plugin-lifecycle.md`](references/plugin-lifecycle.md) for init → register → event loop → shutdown pattern.
2. **MANDATORY - READ ENTIRE FILE**: Read [`zod-patterns.md`](references/zod-patterns.md) for Zod schema patterns, Good/Bad examples, and common mistakes.
3. **Do NOT load** other skills unless the tool specifically needs them.

## Plugin Lifecycle

```
init → register tools/hooks → event loop → shutdown
```

- Tools are write-side (mutate state)
- Hooks are read-side (observe events)
- Plugin layer is thin (<100 LOC assembly only)
- No business logic in plugin layer

For the full lifecycle with code examples, load `references/plugin-lifecycle.md`.

## The Script Rule

```
A script should REPORT FACTS and LEAVE JUDGMENT TO THE AGENT.
```

Pure helpers only (exit 0, no governance). No hardcoded paths. No state mutation outside CQRS tools. If a script makes decisions, it's not a script — it's an agent, and agents belong in SKILL.md.

## Validation Gate

Before a tool or plugin is done:
- [ ] Tool has Zod schema for all parameters
- [ ] No `any` types in tool definition
- [ ] Tool does one thing (name matches behavior)
- [ ] Plugin layer is thin (<100 LOC)
- [ ] No business logic in plugin layer
- [ ] CLI scripts report facts only (exit 0, no governance)
- [ ] No hardcoded paths in scripts

## Worked Example: Complete Tool with Zod Schema

**Scenario:** Create a tool that validates file paths before deletion

```typescript
import { tool } from '@opencode-ai/plugin'
const s = tool.schema

export default tool({
  description: 'Safely delete files with validation',
  args: {
    paths: s.array(s.string()).min(1).describe('Files to delete'),
    dryRun: s.boolean().default(false).describe('Preview without deleting'),
  },
  async execute(args, context) {
    const results = []
    for (const path of args.paths) {
      if (args.dryRun) {
        results.push({ path, status: 'would_delete' })
      } else {
        // context.ask() for permission
        const confirmed = await context.ask({ message: `Delete ${path}?` })
        if (!confirmed) {
          results.push({ path, status: 'skipped' })
          continue
        }
        // ... delete logic
        results.push({ path, status: 'deleted' })
      }
    }
    return JSON.stringify({ results })
  }
})
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Schema Dodger** — using z.any() | Tool parameters are z.any() or any type | Zod schema IS the interface. Define it properly. |
| **The Swiss Army Tool** — one tool does many things | Tool description says "does many things" | One tool = one thing. Split into multiple tools. |
| **The Fat Plugin** — business logic in plugin layer | Plugin layer >100 LOC, has business logic | Plugin layer is assembly only. Business logic in tools. |
| **The State Mutator** — scripts mutate state directly | Script writes to state files, modifies config | Scripts report facts. Tools mutate state. Never the reverse. |
| **The Path Hardcoder** — hardcoded directory paths | Script has `/Users/apple/...` or absolute paths | Use environment variables or config. No hardcoded paths. |

## Self-Correction

### When the Task Keeps Failing
[Detection] Zod schema validation keeps rejecting valid input shapes. Tool execution fails because context object doesn't have expected methods. Plugin registration fails with the SDK despite correct-looking code.
[Recovery] STOP adding code. For schema issues: simplify — start with a minimal Zod schema that validates only the essential fields, then add optional fields incrementally. For context issues: check the OpenCode SDK version and verify the context API matches. For registration failures: verify the plugin follows the init→register→event loop→shutdown lifecycle in order. Check that tool names are unique across all registered tools.

### When Unsure About the Next Step
[Detection] Unclear whether logic belongs in a tool (write-side) or a hook (read-side). Not sure if the tool should be split into multiple tools. Unsure which Zod schema type to use for a complex parameter shape.
[Recovery] For CQRS decisions: if it mutates state → tool. If it observes events → hook. If it does both → split into a tool + hook pair. For splitting: one tool = one thing (name matches behavior). If the tool does multiple things, split it. For Zod types: consult `references/zod-patterns.md` for Good/Bad examples. When in doubt, use the most specific type (z.string().min(1) over z.string(), z.enum() over z.string()).

### When the User Contradicts Skill Guidance
[Detection] User says "use z.any(), I'll validate in the function" (violating "NO TOOL WITHOUT A ZOD SCHEMA" iron law). User says "put the logic in the plugin layer, it's simpler" (violating thin plugin rule). User says "hardcode the path, it only runs on my machine."
[Recovery] Explain: "The Zod schema IS the interface. Without it, the agent can't see what the tool expects. z.any() means no interface. Business logic in the plugin layer violates the architecture — plugin should be <100 LOC of assembly only. Hardcoded paths break on different machines." If the user insists on z.any(), document it as a deliberate deviation. If they insist on fat plugin, suggest extracting business logic into a separate tool file while keeping the plugin thin.

### When an Edge Case Is Encountered
[Detection] Tool needs to call an external API (not covered by existing SDK). Hook needs to intercept an event that the SDK doesn't expose. Tool requires async initialization before it can be registered. Script needs to read a file that might not exist yet.
[Recovery] For external APIs: wrap the API call in the tool's execute function with proper error handling. The tool is the integration point. For missing SDK events: check if the event can be synthesized from available hooks. If not, document the gap and suggest an SDK feature request. For async init: perform initialization lazily on first execute() call rather than at registration time. For missing files: the script should report "file not found" as a fact (exit 0) and let the agent decide what to do — never crash or exit non-zero on missing optional files.
