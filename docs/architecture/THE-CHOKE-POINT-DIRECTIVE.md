# The "Choke Point" Directive: Securing the HiveMind Frame

**Date:** 2026-03-17
**Target Audience:** Agent Development Team
**Context:** The current `src/` directory has 44 directories and 145 files. The logic is too diffuse. To support the "Pattern Weaver" vision, the framework must become highly tolerant of experimental, ambiguous, or sudden shifts in intent. 

To achieve this, the team must implement a **Strict Choke Point Architecture** before writing any new features, tools, or skills.

---

## 1. The Strategy: Isolate the "Hands" from the "Brain"

Currently, the framework trusts the LLM (the Brain) too much. If the LLM decides to write to a file, the system generally lets it. This means every time we tweak a prompt or add a tool, we risk breaking the system.

**The Directive:** The system must no longer trust the agents. All agent actions must pass through a programmatic, deterministic "Choke Point" in the OpenCode plugin layer.

## 2. The Implementation Plan (Execute in this Order)

Instruct the AI agents to execute these three steps. Do not allow them to proceed to Step 2 until Step 1 is verified.

### Step 1: The Execution Choke Point (`tool.execute.before`)
The OpenCode SDK provides a `tool.execute.before` hook. This is our primary shield.
*   **The Task:** The dev team must implement this hook in `src/plugin/opencode-plugin.ts`.
*   **The Logic:** Before *any* tool executes (especially `bash`, `write`, `edit`), the hook must inspect the `EntryKernelStateV1`. 
*   **The Rule:** If the current `governanceMode` is `strict`, and the tool is attempting to mutate a file outside the current `SotRegistryV1` (Source of Truth) boundary, the hook MUST throw an error and block execution.
*   **Why this changes the game:** Once this is built, you (the Pattern Weaver) can give the agents the craziest, most experimental prompts imaginable. If they hallucinate and try to delete your project, the Choke Point will silently block them. You are now safe to experiment.

### Step 2: The Delegation Interceptor (`tool.execute.after`)
The vision requires a Manager agent (`hiveminder`) to delegate to Worker agents (`hivemaker`) seamlessly.
*   **The Task:** The dev team must implement the `tool.execute.after` hook specifically to intercept the native `task` tool.
*   **The Logic:** When a sub-agent finishes a task and returns its `TurnOutputEnvelopeV1`, this hook intercepts the payload.
*   **The Rule:** The hook must run a programmatic check (e.g., `npm run typecheck:core` or a linting script). If the check fails, the hook automatically rejects the payload back to the sub-agent.
*   **Why this changes the game:** The Manager agent never sees broken code. You no longer have to micromanage the workers. The code governs the workers.

### Step 3: The Universal Abort (`context.abort`)
Advanced tools (like AST parsers) can hang if they hit a massive, minified file. 
*   **The Task:** The dev team must wire the `context.abort` signal into every custom tool in `src/tools/`.
*   **The Logic:** If a tool runs longer than 15 seconds, the abort signal fires.
*   **The Rule:** The tool must catch the abort, dump the current state to `.hivemind/state/recovery-dump.json`, and exit cleanly.
*   **Why this changes the game:** Your terminal will never freeze again. If you trigger a massive recursive search during an "Aha!" moment, the system will gracefully timeout instead of crashing.

---

## 3. The Stable State (What Happens Next)

Once the team completes these three steps, you will have achieved **Architectural Stability**. 

*   **You can now use templates:** You can rewrite `AGENTS.md` a hundred times. If you write a bad prompt, the Choke Point will catch the bad behavior.
*   **You can add advanced tools:** When the team is ready to add the `code-intel` (TreeSitter AST) engine, they simply drop it into the `src/tools/` directory. Because the Choke Point and the Abort signals are already running, the new tool is instantly governed by the same strict safety rules.
*   **You can "Weave":** You can switch from backend planning to frontend execution instantly. The Context Engine handles the memory, and the Choke Point prevents the agents from crossing the streams.

**Your Command to the Team:** 
> "Stop all feature work. We are implementing the Choke Point Architecture. Your only tasks are to implement `tool.execute.before`, `tool.execute.after`, and `context.abort` as defined in `docs/architecture/THE-CHOKE-POINT-DIRECTIVE.md`. Do not touch prompts or skills until the SDK hooks are passing tests."