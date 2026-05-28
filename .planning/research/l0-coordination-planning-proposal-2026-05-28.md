# L0 Agent Coordination, Orchestration, and Governance Proposal

**Date:** 2026-05-28 | **Status:** PROPOSAL FOR REVIEW
**Evidence:** L5 — docs-only proposal. Formulated by the model acting as `hm-planner` to address L0 agent design and routing architecture across Phases 21.2, 24.3, and 27.

---

## 1. Executive Summary & Core Challenges

This proposal outlines the strategy to govern L0 (front-facing) agents and coordinates their execution behavior. L0 agents are prone to several cognitive failures that degrade coordination reliability:

1. **Forgetfulness & Inline Work:** As LLMs, L0 agents default to resolving user requests inline (writing code, debugging, planning) rather than executing their primary role: routing, coordinating, and delegating to specialist subagents.
2. **Granularity & Sequential Chaining:** In long-haul, multi-phase tasks, L0 agents fail to maintain a mental map of what command to run, what workflow to trigger, and what specialist agent to dispatch. They lack just-in-time, conditional routing intelligence.
3. **Framework Oneness:** L0 agents cross boundaries between the `gsd-*` developer tooling suite and the `hm-*` harness module under development. Once a framework is selected at session start (e.g. `gsd-*`), the session must consistently maintain that namespace throughout.
4. **Tool Governance:** L0 agents lack context-sensitive tool authority, often invoking file-writing or modification tools directly instead of delegating to executors or using read-only/routing tools.
5. **Turn Anchor Points & Intent Drift:** Across multiple conversation turns, L0 agents drift from the user's targeted intent, skip steps, cross boundaries, fail to create planning documents, and violate directory organization structures.

To address these challenges, we propose a two-layered solution:
* **The Soft Approach:** Utilizing native OpenCode configurations, strict `AGENTS.md` prompting, directory rules, and behavioral profiles.
* **The Code Approach:** Harnessing hard-coded TypeScript lifecycle hooks (`PreToolUse`, `PostToolUse`), dynamic namespace routers, session trajectory tracking, and tool pressure circuit breakers.

---

## 2. The Soft Approach: OpenCode Primitives & Configurations

The soft approach utilizes OpenCode's native configuration files, markdown primitives, and folder rules to guide the model's in-context behavior.

### 2.1. Hierarchical AGENTS.md Directives
Enforce "The Absolute Order" via root and directory-level `AGENTS.md` instructions. The prompt parser in OpenCode automatically injects these instructions into the agent's context.

* **L0 Agent instructions (`.opencode/agents/hm-l0-orchestrator.md`):**
  Explicitly list forbidden actions as hard constraints. 
  ```markdown
  ## FORBIDDEN ACTIONS (L0 ORCHESTRATOR)
  - Do NOT modify any project source files (src/**/*.ts).
  - Do NOT write or editPLAN.md or SUMMARY.md files directly.
  - Do NOT run tests or diagnostic commands directly.
  - ALWAYS delegate these tasks to the corresponding gsd-* or hm-* specialist.
  ```

### 2.2. Namespace Command Frontmatter
OpenCode command files (under `.opencode/commands/`) support YAML frontmatter. We can leverage command-level namespaces to enforce framework oneness.

```yaml
---
namespace: gsd
agent: gsd-planner
subtask: true
requires: ["gsd-config"]
---
```
By enforcing strict command registration, OpenCode's command engine can automatically resolve the required agent type and refuse execution if a `gsd-*` session attempts to call an `hm-*` command (or vice versa) without an explicit bridging adapter.

### 2.3. Workspace Rules & Folder Constraints
Use `.opencode/rules/` directory to store universal constraints. These rules are injected into all subagent contexts, enforcing:
* **Directory registration:** Registering folders using `.gitkeep` files.
* **JSDoc compliance:** Enforcing JSDoc validation on all created files.
* **Lineage conventions:** Enforcing naming Syndicate rules (`hm-*` for product, `hf-*` for authoring, `gsd-*` for internal developer tools).

---

## 3. The Code Approach: Hard Harness Hooks & Runtime Controls

The soft approach relies on model compliance, which can fail under context pressure. The code approach implements programmatic constraints in the TypeScript hard harness (`src/`) to intercept, validate, and redirect actions.

```mermaid
graph TD
    User([User Prompt]) --> Intake[Intake Gate: src/routing/session-entry]
    Intake --> Classifier{Intent Classifier}
    Classifier -- "Investigatory / Ad-hoc" --> L0[L0 Orchestrator]
    Classifier -- "Work Command" --> Router[Namespace Router]
    
    L0 --> HookCheck{PreToolUse Hook}
    HookCheck -- "File Write / Modify" --> Block[Block + Throw [Harness] Error]
    HookCheck -- "Read / Delegate" --> Allow[Allow Tool Execution]
    
    Router --> FrameCheck{Framework Oneness check}
    FrameCheck -- "Namespace Drift" --> Reject[Reject / Align Namespace]
    FrameCheck -- "OK" --> Dispatch[Delegate-Task / Task spawner]
```

### 3.1. Message/Intent Intake Gate (`src/routing/session-entry/`)
Implement a message intake gate that intercepts user inputs before they are passed to the active agent.
* **Intent Classification:** The intake gate runs the prompt through a lightweight regex/heuristic classifier to detect if the user's intent is to run a command or start a new workflow.
* **Framework Oneness Check:** If an active session is in progress, the intake gate reads the session journal from `.hivemind/state/session-continuity.json`. If the session was initiated with a `gsd-*` command, it enforces that any command in the prompt matches the `gsd` namespace. If it detects a drift (e.g. user invokes `/hm-progress` in a `gsd` session), it blocks execution or injects a namespace-alignment warning into the prompt.

### 3.2. PreToolUse Hook: Tool Pressure & Write Interceptors
The `PreToolUse` hook runs in `src/hooks/` and intercepts tool calls before execution.
* **Write Prevention for L0:** If the active agent is classified as L0/L1 (Orchestrator/Coordinator), the hook intercepts calls to modifying tools:
  * `write_to_file`
  * `replace_file_content`
  * `multi_replace_file_content`
* **Error Throwing:** Rather than silently failing, the hook throws a typed, structured error:
  `[Harness] L0 front-facing agent cannot perform inline file modifications. Please delegate this action to the appropriate specialist agent.`
  This forces the L0 agent to recover by executing a delegation tool (`task` or `delegate-task`) instead.

### 3.3. Turn Anchor & Trajectory Tracker (`src/task-management/continuity/`)
To prevent the agent from skipping steps or drifting across multiple turns, the harness tracks execution trajectory.
* **Pending Dispatch Registry:** Track all dispatched child tasks in `delegations.json` and map them to their parent session.
* **Goal-Backward Guard:** When a plan is created, its `must_haves` (artifacts, observable truths) are stored in `session-continuity.json`.
* **Turn Counter & Interceptor:** At the end of each turn, the `PostToolUse` hook validates whether the expected artifacts for that step were written to the correct folder. If a directory organization violation is detected, it flags it immediately in the `session-continuity.json` journal, which is injected into the next turn's context as a warning.

### 3.4. One-Shot Front-Agent Override (`execute-slash-command` Redesign)
Phase 21.2 addresses the need to execute a command with a `mode: subagent` specialist directly in the parent session (without spawning a child task) when override criteria are met.
* **Technical Seam:** OpenCode calculates subtask execution using:
  `isSubtask = (agent.mode === "subagent" && cmd.subtask !== false) || cmd.subtask === true`
* **Implementation:** When `execute-slash-command` is called, it overlays the command configuration. If a one-shot override is requested (e.g. `--subtask=false`), the harness intercepts the command dispatch, overrides `cmd.subtask` to `false` temporarily in memory, forcing OpenCode to run the specialist agent directly in the parent session. This preserves the turn context and prevents child session proliferation.

---

## 4. Phased Implementation Roadmap

The proposed changes are mapped to existing phase clusters to prevent regressions:

```
                  ┌─────────────────────────────────────┐
                  │ Phase 21.2: Front-Agent Switching   │
                  │ - Live UAT for subtask:false        │
                  │ - Override engine prototype         │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ Phase 24.3: Commands Infrastructure │
                  │ - Namespace routers                 │
                  │ - Workflow size budget              │
                  │ - Command drift guards              │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ Phase 27: Routing & Intent Loop     │
                  │ - Regex intent classification       │
                  │ - Turn anchor tracking in state     │
                  │ - Tool pressure blocker hooks       │
                  └─────────────────────────────────────┘
```

### Phase 21.2: One-Shot Front-Agent Override (Group 1, Active/Planned)
* **Goal:** Verify that a `mode: subagent` agent can run in the parent session without file mutation.
* **Action:** Run live UAT for the synthetic parent prompt path (`subtask:false` + `agent`). Document the final verdict (SUPPORTED / NOT SUPPORTED).

### Phase 24.3: Commands Infrastructure (Group 2, Pending)
* **Goal:** Implement the namespace command router and GSD/HM separation templates.
* **Action:** Build command-level validation schemas in `src/schema-kernel/` to ensure command namespaces map to the active workstream config.

### Phase 27: Routing & Intent Loop Foundation (Group 2, Pending)
* **Goal:** Build the runtime intent loop and hooks to block L0 inline writes.
* **Action:** Implement `PreToolUse` hooks in `src/hooks/` that inspect the active agent's lineage. If `L0` attempts a write, intercept and throw `[Harness]` error.

---

## 5. Verification & Testing Plan

### 5.1. Automated Unit & Integration Tests (Vitest)
Create unit tests to verify programmatic boundaries:
* **Hook Interceptor Test:**
  Verify that when an L0 orchestrator is set as the active session actor, calls to write tools throw the expected `[Harness]` error, while calls to read/delegate tools pass.
* **Namespace Routing Test:**
  Verify that the session entry gate rejects or flags namespace drift (e.g. `gsd` session attempting to run `hm` commands).
* **One-Shot Override Test:**
  Verify that passing `subtask:false` overrides subtask spawning in `execute-slash-command.ts`.

### 5.2. Manual UAT Matrix
Run live interactive tests to verify model behavior:
| Case | Input Prompt | Expected Output | Status |
|------|--------------|-----------------|--------|
| L0 Inline Write | "Write a helper function in src/shared/helpers.ts" | System blocks tool, L0 recovers and delegates task to `gsd-executor` | Awaiting Ph27 |
| Namespace Drift | `/gsd-ns-context` -> user inputs `/hm-progress` | intake gate warns user about namespace change or auto-aligns to gsd | Awaiting Ph24.3 |
| Turn Anchor Guard | User says "stop at plan-phase" | Executor stops after PLAN.md is created, does not auto-advance to execution | Awaiting Ph27 |
