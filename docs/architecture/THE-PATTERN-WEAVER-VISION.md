# The Pattern Weaver's HiveMind: Translating Vision to Architecture

**Date:** 2026-03-17
**Target Audience:** Founder, Project Owner, and the Agent Development Team
**Context:** This document synthesizes the founder's vision of the "Pattern Weaver" with the strict architectural requirements of the HiveMind framework. It bridges the gap between the high-level philosophy and the low-level implementation.

---

## 1. The Vision: The "Pattern Weaver" vs. The "Spec Follower"

The current agentic landscape (e.g., GSD, oh-my-openagent) assumes the user is either a "Spec Follower" or a "Spec Dictator." These tools demand rigid, fully articulated Product Requirements Documents (PRDs) before they allow agents to do meaningful work. 

**Your Vision (The Pattern Weaver):**
You are building HiveMind for a different kind of creator. The "Pattern Weaver" explores, digs into depths, spots connections, and *then* weaves them together. You don't want to be locked out of experimenting with a tech stack just because you haven't written the final spec. You need a framework that can handle ambiguity, context-switching, and sudden "Aha!" moments without the context rotting or the agents getting confused.

**The Architectural Challenge:**
How do we build a system that is flexible enough for the Pattern Weaver to scout and pivot freely, but deterministic enough that the AI agents don't hallucinate or break the codebase when given ambiguous commands?

---

## 2. The Solution: The "Granular Control Plane"

To allow flexible weaving, the framework must manage the *state* of the weaving perfectly. If you pivot from backend to frontend, the system must freeze the backend context and load the frontend context. 

We achieve this through the **Granular Control Plane**:

### A. Eradicate "One-Shot" Assumptions
*   **The Flaw:** Current agents try to solve the whole prompt at once.
*   **The Fix:** HiveMind must break every intent down to the **SMALLEST** unit. 
*   **How to Build It:** The `TrajectoryEngineV1` must force the agent to categorize the user's prompt. Is this research? Is this planning? Is this execution? The framework must block execution if the required prior step (e.g., research) hasn't been validated.

### B. The Context Harness (Protecting the "Aha!" Moment)
*   **The Flaw:** When you have an "Aha!" moment and pivot, standard agents lose track of the original goal.
*   **The Fix:** The `TurnOutputEnvelopeV1`.
*   **How to Build It:** After *every single turn*, the framework must programmatically export a YAML summary of what was just done and what is pending. If you pivot, the `LineageSessionGraphV1` isolates the previous workstream. When you return to it, the OpenCode `experimental.chat.system.transform` hook instantly injects the exact state you left off at. You weave; the framework remembers.

### C. Zero-Trust Upstream Governance
*   **The Flaw:** Agents executing code based on their own "understanding" of relationships.
*   **The Fix:** SOT (Source of Truth) Governance.
*   **How to Build It:** The `SotRegistryV1`. If an agent wants to modify a file, it must query the registry to find the "parents" of that file. If the modification breaks the upstream governance rules, the `permission.ask` hook programmatically denies the write.

---

## 3. How to Structure the Work for the Dev Team (The Non-Technical Guide)

Because you are managing an AI development team, you cannot just hand them your philosophy. AI agents are literal. You must translate your vision into a sequence of architectural constraints. 

Give the agent team this exact sequence to lay the frame that works *first*:

### Phase 1: Establish the State Machine (The Memory)
*   **Goal:** The system must know where it is at all times.
*   **Dev Task:** Build the `EntryKernelStateV1` and `TurnOutputEnvelopeV1` schemas. Ensure the OpenCode plugin (`src/plugin/opencode-plugin.ts`) writes this state after every turn and injects it before every turn.
*   **Why it matters to you:** This is what allows you to pivot and experiment without losing your place.

### Phase 2: Establish the Boundaries (The Rules)
*   **Goal:** The system must protect the codebase from the AI's hallucinations.
*   **Dev Task:** Implement the `permission.ask` hook. It must read the `governanceMode` from the state. If the mode is strict, it must hard-deny unauthorized writes. Implement `context.abort` to prevent infinite loops.
*   **Why it matters to you:** This ensures that when you do something exploratory, the AI doesn't accidentally overwrite your stable architecture.

### Phase 3: Establish the Delegation Loop (The Teamwork)
*   **Goal:** Agents must be able to hand off work safely.
*   **Dev Task:** Implement the `tool.execute.after` interceptor. When `hiveminder` delegates to `hivemaker`, the interceptor must validate the output before `hiveminder` accepts it.
*   **Why it matters to you:** This handles the "nuances and impacts" you mentioned. It isolates noisy, rot-infectious entities in sub-sessions until they are proven clean.

### Phase 4: Integrate Advanced Tools (The Tools)
*   **Goal:** Give the agents surgical precision.
*   **Dev Task:** *Only after Phases 1-3 are stable*, integrate `code-intel` (AST parsing) and MCPs (Repomix, Deepwiki). 
*   **Why it matters to you:** Because the rules and state are already locked in (Phases 1-3), introducing these powerful tools won't break the system.

---

## 4. The Golden Rule for the Project Owner

As the "Pattern Weaver," your job is to define the strategy and spot the connections. 

**When instructing your AI agents:**
1.  **Do not ask them to write prompts or skills yet.** 
2.  **Ask them to build deterministic TypeScript interfaces.** 
3.  **Force them to use OpenCode plugin hooks.** 

Tell them: *"We are building the Granular Control Plane. I need you to implement Phase 1: The State Machine using the OpenCode `experimental.chat.system.transform` hook. Do not guess the implementation; read the OpenCode SDK documentation first."*

Once the frame is laid, you will have a stable, non-breaking environment where you can endlessly tweak prompts, add skills, and weave patterns to your heart's content.