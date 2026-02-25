# HiveMind Corporate OpenTUI Dashboard: UX/UI Specification & Prototype Plan

## 1. Executive Summary & Aesthetic Vision
**Project Name**: HiveMind Orbital Interface (HOI)
**Aesthetic Vision**: "Corporate Pensive" — A highly structured, data-dense, yet visually restrained terminal interface. Dark grays, muted blues, and precise ASCII/Unicode borders create an atmosphere of quiet, authoritative intelligence. No excessive animations; focus is on instantaneous data retrieval and cognitive clarity. 
**Objective**: Build a robust OpenTUI-based dashboard side-loaded with the OpenCode SDK to visualize HiveMind's intelligence pipelines, execution cycles, 4-level depth delegations, code-intel, and graph-context engines in real-time.

---

## 2. Core Architecture & OpenCode SDK Integration
The dashboard relies on the OpenCode SDK to sync state and the OpenTUI framework for rendering.

### 2.1 OpenCode SDK Data Hooks
- **Session & Message Sync**: Uses `@opencode-ai/sdk` `client.session.messages()` and `client.event.subscribe()` for real-time SSE streaming of agent thoughts and tool executions.
- **Context Injection**: Uses `client.tui.appendPrompt` to allow the user to interrupt or steer the active execution cycle directly from the terminal.
- **Plugin Integration**: Uses `@opencode-ai/plugin` hooks (`tool.execute.before`, `tool.execute.after`) to intercept and visualize tool arguments and returns (e.g., showing a diff viewer when the `edit` tool is used).

### 2.2 OpenTUI Component Mapping
- **Layout Engine**: `Flexbox` (Yoga) layout system for absolute and relative positioning, splitting the terminal into a 3-pane responsive grid.
- **Components**:
  - `Code & Diff Viewer`: Renders exact line changes when the Code-Intel Surgeon makes modifications.
  - `Scrollbox`: Used for the continuous stream of execution logs and cognitive packer output.
  - `Tab-Select & Select`: Navigational controls to switch between the 4-level hierarchy and memory shelves.
  - `Text-Display & Borders`: Styled with muted, precision-focused colors to frame the execution panes.

---

## 3. UI Layout & Module Specifications

The terminal is divided into three primary vertical panes: **The Sentinel (Left)**, **The Core (Center)**, and **The Nexus (Right)**.

### Pane 1: The Sentinel (Graph & Hierarchy Navigator)
**Width**: 25% | **Focus**: 4-Level Depth Delegation & Graph-Context
- **Hierarchy Tree View**: Visualizes the active chain: `[Trajectory] -> [Tactic] -> [Action] -> [Cycle/Subagent]`. Uses indentation and connection characters (├─, └─).
- **Status Indicators**: `[PENDING]`, `[ACTIVE]`, `[BLOCKED]`, `[DONE]` represented with minimal color (e.g., muted yellow for active, dim gray for pending).
- **Graph-Context Engine**: A sub-tab showing the active Memory Shelves (decisions, research, patterns) and Anchor states.

### Pane 2: The Core (Execution & Intelligence Pipeline)
**Width**: 50% | **Focus**: Real-time cycles, Code-Intel, and Diffs
- **Cognitive Stream**: A scrolling `Scrollbox` displaying the agent's internal thought process and tool execution.
- **Code-Intel Surgeon Viewer**: When code is touched, this pane dynamically splits horizontally. The bottom half opens an OpenTUI `Diff` component showing unified/split diffs of the target file, complete with line numbers and syntax highlighting.
- **Command Entry**: A persistent `Input` field at the absolute bottom for user steering (e.g., sending `/hivefiver validate` or `/commit`).

### Pane 3: The Nexus (Metrics & State)
**Width**: 25% | **Focus**: System health, Drift, and Context
- **Drift Score Gauge**: An ASCII progress bar tracking context alignment (0-100).
- **Token / Context Packer Stats**: Real-time stats of the `cognitive-packer.ts` (files touched, mems loaded, anchor count).
- **Active Tools & Subagents**: A dynamic list showing which plugins/MCPs are currently engaged.

---

## 4. User Journeys & Use Cases

### Journey 1: Deep Code Modification (Code-Intel Surgeon)
1. **Trigger**: User inputs a complex refactoring request via the Command Entry.
2. **Delegation Visualization**: The Sentinel pane updates, spawning a new `[Trajectory]` and cascading down to `[Action]`.
3. **Execution**: The Core pane streams the thought process. 
4. **Code-Intel Activation**: As the agent reads files, the Nexus pane updates the Context Packer stats. When a `write` or `edit` tool is called, the OpenTUI `Diff` viewer expands in the Core pane, showing the proposed changes.
5. **Validation**: User accepts via keyboard shortcut (handled by OpenTUI Keyboard events).

### Journey 2: Recovering from High Context Drift
1. **Trigger**: The Nexus pane flashes a muted warning: Drift Score < 40. 
2. **Intervention**: The UI pauses execution. A `Select` modal appears over the Core pane offering recovery skills (e.g., `context-integrity`, `think_back`).
3. **Resolution**: The user selects `context-integrity`, the system runs a compaction cycle, updates the Graph-Context, and resumes.

---

## 5. Requirements & Success Metrics

### 5.1 Technical Requirements
- **Performance**: Must render at 60fps within the terminal without blocking the Node.js event loop.
- **Resilience**: The OpenCode SSE connection must auto-reconnect gracefully.
- **Memory**: The UI must not exceed 100MB of RAM overhead above the core engine.

### 5.2 UX Requirements
- **Keyboard-First**: 100% navigable without a mouse using `Tab`, `Arrow Keys`, and custom bindings (e.g., `Ctrl+E` for diff expansion).
- **Legibility**: Syntax highlighting must use accessible, high-contrast (yet muted) color palettes suitable for long viewing sessions.

### 5.3 Success Metrics
- **Context Retention**: Reduces user context-switching by keeping execution logs, code diffs, and hierarchy visible on one screen.
- **Intervention Speed**: Time taken for a user to block a rogue delegation is reduced to < 2 seconds via instant visual feedback and keyboard interrupt hooks.
- **CLI Adoption**: Replaces `tail -f logs` and manual file checking during HiveMind executions.

---

## 6. Prototype Execution Plan

- **Phase 1 (Day 1-2): Scaffolding & SDK Bridge**
  - Use `bunx create-tui -t react dashboard`.
  - Instantiate `@opencode-ai/sdk` client and establish the `.subscribe()` SSE loop.
- **Phase 2 (Day 3-4): The Layout Engine**
  - Build the responsive 3-pane Flexbox structure.
  - Implement the `Sentinel` hierarchy tree using static mock data to perfect the visual density.
- **Phase 3 (Day 5-6): Code & Execution Views**
  - Integrate the OpenTUI `Diff` component.
  - Wire the SDK event stream to the `Scrollbox` for real-time thought rendering.
- **Phase 4 (Day 7): Polish & Polish**
  - Apply the "Corporate Pensive" color tokens.
  - Finalize keyboard event routing and focus management.
