# OpenCode SDK Alignment Audit Report

**Date:** 2026-03-17
**Scope:** Validation of HiveMind framework implementation against OpenCode SDK primitives (`@opencode-ai/sdk` and `@opencode-ai/plugin`) and 2026 best-in-class agentic architectures.
**Context:** This audit follows the STRESS-TEST evaluation to identify where the framework's implementation of `AGENTS.md`, `MASTER.active.md`, and `task_plan.active.md` diverges from true machine-enforced OpenCode capabilities.

## Executive Summary

The recent refactoring effort has successfully adopted several best-in-class patterns for OpenCode plugin development, notably the Context-on-Demand harness (`experimental.chat.system.transform`) and robust custom tool construction via `tool.schema` (Zod). 

However, the framework currently suffers from a **"Prompt-Driven Architecture facade"**. Several constraints declared in `AGENTS.md`—such as governance modes, delegation rules, and safety bounds—are merely injected into LLM prompts as string interpolations rather than being programmatically enforced via OpenCode plugin hooks. 

**Important Note on `AGENTS.md`:** Not everything currently documented in `AGENTS.md` has been empirically verified as an implemented best practice. Many rules are currently "aspirational" directives given to the LLM. We must "start working to start trusting" by moving these rules out of text prompts and into deterministic TypeScript execution boundaries.

---

## 1. Where HiveMind Succeeds (Verified OpenCode Alignment)

The following architectural choices correctly leverage the OpenCode SDK and represent best-in-class patterns:

*   **Context-on-Demand (The Context Harness):** 
    Instead of forcing agents to read/write a monolithic `state.md` file (which leads to context rot), the framework correctly wires into OpenCode's `experimental.chat.system.transform` and `chat.message` hooks. Injecting the `EntryKernelStateV1` dynamically ensures the agent always operates on fresh runtime state.
*   **Custom Tool Construction:** 
    Tools (e.g., `src/tools/task/tools.ts`) correctly utilize the `@opencode-ai/plugin` API. They strictly use `tool.schema` (Zod) for argument validation, return stringified JSON, and properly consume `ToolContext` properties (`context.sessionID`, `context.agent`).
*   **Agent Projection vs. Direct Mutation:** 
    Treating `.opencode/agents/` as a generated runtime projection rather than the source of truth is a mature pattern. It prevents OpenCode's runtime from accidentally mutating agent contracts and strictly enforces the boundary between the framework's source code and the user's workspace.

---

## 2. Critical Flaws (SDK Misalignment & Architectural Drift)

The following areas violate the master plan and fail to utilize available OpenCode SDK capabilities, directly causing the failures observed in the recent STRESS-TEST.

### A. The Delegation "Blind Trust" Loop (Fails STRESS-TEST P0-005)
*   **Observation:** Orchestrators (`hiveminder`, `hivefiver`) use OpenCode's native `task` tool to delegate to sub-agents. When the sub-agent returns, the orchestrator implicitly trusts the result.
*   **SDK Misalignment:** The system does not utilize the `tool.execute.after` plugin hook to intercept the return of the native `task` tool.
*   **Impact:** Sub-agents can return broken code or invalid schemas, which the orchestrator blindly accepts into the parent session state.
*   **Required Action:** Implement a `tool.execute.after` interceptor that parses the `TurnOutputEnvelopeV1` and runs programmatic verification (e.g., `tsc --noEmit` or AST checks). If verification fails, the hook must reject the tool output and force the sub-agent into a correction loop.

### B. Complete Ignorance of `context.abort` (Fails STRESS-TEST P0-004)
*   **Observation:** Workflow deadlocks are inevitable because execution paths lack deterministic timeouts.
*   **SDK Misalignment:** The OpenCode SDK provides an `AbortSignal` via `context.abort` in every tool execution. A codebase audit reveals this signal is completely unused.
*   **Impact:** Long-running or circular delegation chains will hang the terminal indefinitely without triggering a state preservation dump.
*   **Required Action:** Wire `context.abort` to a timeout (e.g., 15 seconds) for all asynchronous tool operations and delegation chains. If the signal fires, trigger a `state-dump.json` checkpoint and abort the thread cleanly.

### C. Declarative vs. Programmatic Governance
*   **Observation:** Governance settings (e.g., `governanceMode: 'strict'`) gathered during `hm-init` are pushed into the prompt packet (`prompt-packet-renderers.ts`).
*   **SDK Misalignment:** OpenCode provides the `permission.ask` hook for programmatic access control. Telling an LLM to "be strict" in a prompt is a suggestion, not a governance constraint.
*   **Impact:** The LLM can still hallucinate or ignore the strictness directive and execute destructive `bash` or `write` commands.
*   **Required Action:** Move governance logic into the `permission.ask` hook. If `governanceMode === 'strict'`, the TypeScript code must programmatically return `"deny"` for unauthorized mutations, regardless of the LLM's intent.

### D. MCP Orchestration Gap
*   **Observation:** The `opencode.json` registers powerful MCP servers (`repomix`, `deepwiki`, `context7`), but their invocation is left entirely to the LLM's intuition.
*   **SDK Misalignment:** Best-in-class frameworks orchestrate context programmatically before the agent asks for it.
*   **Impact:** Inconsistent context gathering; agents may attempt to plan without fully understanding the codebase.
*   **Required Action:** The `TrajectoryEngineV1` should programmatically orchestrate MCPs. For example, during `hm-plan`, the framework should automatically inject a `repomix` codebase pack into the context harness before the planning agent begins its turn.

---

## 3. Redirection Strategy for the Development Team

To achieve the "Auto-recovering single kernel" vision and pass the STRESS-TEST matrix, the development team must shift focus from **prompt generation** to **plugin hook interception**.

### Immediate Directives

1. **Audit `AGENTS.md` Claims:** Review all constraints listed in `AGENTS.md`. Identify which are currently prompt-based assumptions and schedule them for programmatic enforcement.
2. **Wire Abort Signals:** Update all custom tools in `src/tools/` to respect and utilize `context.abort`.
3. **Implement Zero-Trust Delegation:** Build the `tool.execute.after` interceptor to enforce programmatic QA gates on sub-agent returns.
4. **Enforce Hard Governance:** Refactor the `permission.ask` hook in `opencode-plugin.ts` to actively deny operations based on the session's `governanceMode` and `automationLevel` variables, stripping this responsibility from the LLM prompt.

## Conclusion

The structural foundation—the Lifecycle Spine and the context harness—is highly capable and aligns with OpenCode best practices. By migrating governance, validation, and lifecycle controls out of textual prompts and into the SDK's programmatic hooks, HiveMind will mature from a fragile prompt-wrapper into a robust, deterministic autonomous framework.