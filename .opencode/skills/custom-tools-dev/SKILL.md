---
name: custom-tools-dev
description: This skill should be used when the user asks to "create a custom tool", "build an OpenCode plugin", "write a tool with Zod schema", "add a plugin hook", "create CLI script", "build a tool for agent", mentions tool() helper, Zod validation, plugin lifecycle, hooks (PreToolUse, PostToolUse), bin/ scripts, or needs guidance on OpenCode plugin SDK and custom tool architecture.
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

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Schema Dodger** — using z.any() | Tool parameters are z.any() or any type | Zod schema IS the interface. Define it properly. |
| **The Swiss Army Tool** — one tool does many things | Tool description says "does many things" | One tool = one thing. Split into multiple tools. |
| **The Fat Plugin** — business logic in plugin layer | Plugin layer >100 LOC, has business logic | Plugin layer is assembly only. Business logic in tools. |
| **The State Mutator** — scripts mutate state directly | Script writes to state files, modifies config | Scripts report facts. Tools mutate state. Never the reverse. |
| **The Path Hardcoder** — hardcoded directory paths | Script has `/Users/apple/...` or absolute paths | Use environment variables or config. No hardcoded paths. |
