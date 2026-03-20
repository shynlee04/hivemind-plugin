---
name: harness-architecture
description: Evaluate, design, and enforce OpenCode SDK Harness Architecture.
  Use when building CLI tools, creating Plugins, writing custom agent routing,
  or debugging session lifecycle state. MANDATORY when deciding whether to place
  code in the Control Plane (Client SDK) or Execution Plane (Plugin SDK).
---

# Harness Architecture Directives

You are modifying or creating features within the OpenCode SDK Harness. The previous generation of AI tools relied on "Prompt-Driven Architecture" (telling the LLM rules and hoping it obeyed). We have evolved to **Programmatic Governance**. 

## Core Axiom: The Dual-Plane SDK

OpenCode is powered by two distinct, mutually exclusive SDK APIs. The most fatal mistake a developer can make is confusing them. 

**MANDATORY - READ CAREFULLY:** 
Before assigning a task, executing a command, or creating a new tool, classify the intent into one of two planes:

1. **The Control Plane (`@opencode-ai/sdk`)**
   - **What it is**: The external JavaScript API driver.
   - **When to use**: Building CLIs, orchestrating CI/CD pipelines, spinning up headless servers (`createOpencodeServer`), managing high-level sessions (`client.session.create`). 
   - **Where it lives**: `src/cli/`, `src/control-plane/` 
   - **NEVER DO**: Do not write loops that interact with `.md` files directly. Do not implement internal agent logic. Use the SDK.

2. **The Execution Plane (`@opencode-ai/plugin`)**
   - **What it is**: The internal Server loop API. 
   - **When to use**: Registering custom native tools (`tool()`), intercepting behavior (`system.transform`), enforcing authorization (`permission.ask`), capturing lifecycle events (`event`).
   - **Where it lives**: `src/hooks/`, `src/plugins/`, `src/tools/`
   - **NEVER DO**: Do not spawn servers or `OpencodeClient` from inside a plugin—this causes infinite recursion. The session already exists.

For code examples of both SDKs, refer to [`references/sdk-surface.md`](references/sdk-surface.md).

## Mindset & Critical Procedures

### 1. Stop Prompting for Rules
"Tell the Subagent to never delete `index.ts`."
**WRONG.** LLMs hallucinate. If an operation is destructive, do not put it in a prompt. 
**CORRECT:** Write a plugin that binds to `permission.ask` and programmatically sets `output.status = "deny"` when the operation is `delete` for `index.ts`. 

### 2. Zero-Trust Delegation
When using `TaskTool` to spawn subagents, do not trust the subagent to return the correct format. A hallucinating subagent returning malformed JSON will poison the orchestrator agent's context window (the "doom loop").
**CORRECT:** Bind a plugin to `tool.execute.after`. Intercept the `task` tool output. If the string is invalid, replace `output.output` with an explicit failure string. This acts as a circuit breaker.

### 3. Context Window Management
Never dump entire files or monolithic configurations into the system prompt.
**CORRECT:** Start with a lean default prompt, then use the `experimental.chat.system.transform` hook to inject the precise snippet of configuration required *only* for that specific inference step. 

## Anti-Patterns (NEVER DO THIS)

**NEVER** use `@opencode-ai/sdk` to build custom native tools. Native tools must be built against `@opencode-ai/plugin` using `tool()` and `zod` for exact schema validation.

**NEVER** build custom subagent loops using `client.session.prompt` recursively. Use the native `TaskTool` (delegation) and let the engine handle process trees. Orchestrating subagents manually via the Control Plane is a massive reinvention of the wheel.

**NEVER** enforce rule `StrictMode` via system prompt injection. "You are in Strict Mode. Do not ask for help." will always fail eventually. `StrictMode` must map to `permission.ask` automatically returning "allow" or "deny" without prompting the LLM.
