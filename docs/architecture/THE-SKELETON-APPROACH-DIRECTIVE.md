# The "Skeleton First" Directive: Building the HiveMind Frame

**Date:** 2026-03-17
**Target Audience:** Agent Development Team (and non-technical project owners guiding them)
**Purpose:** Translate the conceptual architecture and visual sketches into a concrete, step-by-step execution blueprint.

---

## 1. Introduction: Why "Skeleton First"?

When building a meta-framework with multiple AI agents, it is tempting to start by tweaking their prompts or giving them advanced tools right away. This leads to chaos: agents get confused, loops run infinitely, and the system breaks under stress. 

To achieve an **architecturally stable stage**, we must build the **Skeleton** (the pipes and boundaries) before we add the **Muscles** (advanced tools like AST Code-Intel) or the **Personality** (prompts and skills). 

**The Golden Rule:** The framework must work deterministically *even if the AI agent makes a mistake*. The code protects the project from the AI.

---

## 2. The Three Pillars (Where Things Belong)

To keep the architecture clean, the development team must strictly classify every new feature into one of three pillars:

### A. The Brains (Instructions & Logic)
This is how the agent knows *what* it is supposed to do.
*   **What lives here:** `AGENTS.md`, Claude/Gemini system prompts, `.md` Skill files.
*   **Rule:** These are just instructions. They cannot execute code or enforce rules. If an agent ignores an instruction here, the system must not break; it must catch the error in the "Hands" layer.

### B. The Hands (Tools & SDK Plugins)
This is how the agent *interacts* with the world. 
*   **What lives here:** The OpenCode SDK plugin (`src/plugin/opencode-plugin.ts`), Custom Tools (`src/tools/`), and advanced engines like `code-intel` (TreeSitter/AST parsing).
*   **Rule:** Tools must use strict Zod schemas (`tool.schema`). This layer must enforce governance. If the "Brain" asks to delete a file it shouldn't, the "Hands" (the tool code) must programmatically block it.

### C. The Memory (Context Engine & State)
This is how the agent *remembers* where it is in the workflow.
*   **What lives here:** `.hivemind/state/`, Trajectory Engine, and the OpenCode Context Harness (`experimental.chat.system.transform`).
*   **Rule:** Agents should never have to manually read a `state.json` file. The Context Engine must dynamically summarize the state and inject it into the agent's prompt automatically before every turn.

---

## 3. The Delegation Harness (How Agents Talk)

The sketches (`the-trajectory-*` and `harness-agents-*`) envision a system where a manager agent (`hiveminder`) delegates work to a worker agent (`hivemaker`), and the output feels native and reliable.

To build this structurally, the dev team must implement the **Zero-Trust Delegation Loop**:

1.  **The Ask:** The Manager uses the OpenCode `task` tool to spin up a Worker.
2.  **The Work:** The Worker executes the task.
3.  **The Interceptor (The Missing Link):** Instead of the Manager blindly accepting the Worker's output, the plugin must use the `tool.execute.after` SDK hook to intercept the return packet.
4.  **The QA Gate:** The interceptor runs a deterministic script (e.g., a TypeScript compiler check or a linter). 
5.  **The Result:** If it fails, the code auto-rejects the work back to the Worker. The Manager only sees the result once the code proves it is correct.

---

## 4. Stacking Advanced Tools (Like `code-intel`)

You asked how the team should classify advanced tools like the proposed `ADVANCED-TOOLS-CODE-INTEL.md` (which uses AST/TreeSitter for byte-perfect code editing) when stacking them into the architecture.

**How to classify them:**
Advanced engines belong entirely in **The Hands** (Pillar B). 

**How to stack them safely without breaking the system:**
1.  **Build the Engine in Isolation:** Build `src/intelligence/code/` as pure TypeScript functions first. Do not expose them to the AI yet.
2.  **Expose as a Read-Only Tool:** Create a custom tool (`hivemind_inspect`) that uses the engine to read code. Let the AI get used to the new data format.
3.  **Expose the Patcher:** Once the read tool is stable, create the write tool (`ast_patch`). Because the framework's "Skeleton" (the Context Engine and Governance hooks) is already enforcing safety, introducing this powerful tool is safe. 
4.  **Add the Skill:** Finally, write a `.md` Skill file teaching the AI *when* to use the new AST tool versus standard text replacement.

---

## 5. The Execution Blueprint (The "Works First" Approach)

To get to a stable stage immediately, instruct the agent dev team to execute this exact sequence:

### Step 1: Wire the Abort Signals (Stability First)
*   **Directive:** Update all tools in `src/tools/` to use the OpenCode SDK's `context.abort`. Ensure no agent can hang the terminal by running infinitely. 

### Step 2: Enforce Governance in Code (Safety Second)
*   **Directive:** Move `governanceMode` out of the text prompts. Implement the `permission.ask` hook in `opencode-plugin.ts` to programmatically deny `write` or `bash` actions if the mode is set to 'strict' and the action is out-of-bounds.

### Step 3: Build the Delegation Interceptor (Trust Third)
*   **Directive:** Implement the `tool.execute.after` hook for the native `task` tool to programmatically verify sub-agent returns before merging their state.

### Step 4: Templatic Adjustments (The Fun Part)
*   **Directive:** *Only after Steps 1-3 are complete* should the team focus on refining prompts, adjusting `AGENTS.md`, and writing new Skills. Because the structural skeleton is now bulletproof, tweaking prompts will no longer break the system.

---

## Summary for Non-Technical Managers

Think of the framework like a house:
1.  **Steps 1-3** are pouring the concrete foundation and installing the plumbing (The Skeleton). It isn't visible to the user, but without it, the house collapses.
2.  **Advanced Tools (`code-intel`)** are installing high-end appliances. They plug cleanly into the plumbing you already built.
3.  **Prompts and Skills** are painting the walls and arranging the furniture. You can change them as often as you want, and the house will remain perfectly stable.