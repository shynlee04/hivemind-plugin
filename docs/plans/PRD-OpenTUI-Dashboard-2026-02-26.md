# PRD: OpenTUI Dashboard & OpenCode SDK Integration

**Date:** 2026-02-26
**Domain Pack:** `dev`
**Persona:** `floppy_engineer`
**Status:** Q.U.A.N.T validated and Approved

## 1. Executive Summary
Build an interactive, multi-tab terminal dashboard using OpenTUI's React Reconciler to visualize OpenCode SDK events, execution hierarchies, and agent workflows in real-time. This UX/UI is a critical front-facing artifact demonstrating HiveMind's intelligence, workflows, tools, and subagent depth delegations.

## 2. Q.U.A.N.T Ideation Matrix Validation
*   **QAI (Quantifiable Ambiguity Index):** 0 weasel words. Performance and SLAs mapped strictly (e.g., `< 16ms` debounce, `< 500ms` connection).
*   **UPS (Unhappy Path Saturation):** 100% MECE coverage for Ideal, Empty, Latency, Partial Failure, and Destructive states.
*   **AGS (Architectural Grounding Score):** DeepWiki and Tavily MCP research validated OpenTUI Yoga flexbox limits and OpenCode Event Stream boundaries.
*   **NR (Noun Resolution):** Core entities (`OpencodeClient`, `EventStreamState`, `useOpencodeEvents`, `HierarchyTreeViewer`) firmly grounded.
*   **TDD-M (TDD Materialization):** 100% vector mappings mapped directly to features.

## 3. Architecture & Tech Stack
*   **Framework:** OpenTUI React (`@opentui/react`) + Bun runtime.
*   **State Management:** React `useReducer` for event ingestion; Context API for theme/focus propagation.
*   **Data Source:** `@opencode-ai/sdk` (`client.event.subscribe()`, `client.session.get()`).
*   **Layout Engine:** Yoga Flexbox via `<box flexDirection="row/column">`.

## 4. UI/UX Layout Specs

### 4.1 Global Container
Responsive grid dynamically updating via `useTerminalDimensions`.
```tsx
<box flexDirection="column" width="100%" height="100%">
  <Header />
  <box flexDirection="row" flexGrow={1}>
    <SidebarNavigation width={30} />
    <MainContentArea flexGrow={1} />
  </box>
  <FooterStatusBar height={1} />
</box>
```

### 4.2 Sidebar Navigation (Multi-Tab)
*   **Views:** Session Monitor, Hierarchy Tree, Tool Logs, Configuration.
*   **Interaction:** Focus cycles via `Tab` / `Shift+Tab`. Active item navigation via `j`/`k` or arrows. `<tab-select>` component highlights current active lane.

### 4.3 Main Content Area
*   **Session Monitor:** Streams `message.created` utilizing `<scrollbox>` and syntax highlighting for `<code>`.
*   **Hierarchy Tree:** Renders `tool.started` and `tool.completed` nested nodes via indentation blocks (`<box paddingLeft={level * 2}>`).

### 4.4 Status Bar
*   Displays real-time connectivity status to `127.0.0.1:4096`.
*   Displays active agent lane (`hiveminder`, `hiveplanner`, `hivehealer`), drift score, and mode.

## 5. Execution Plan (Implementation Roadmap)

### Phase 1: Core Foundation & SDK Wiring
*   **Task 1.1:** Scaffold project structure in `src/dashboard-v2/` utilizing `bunx create-tui@latest -t react`.
*   **Task 1.2:** Implement `useOpencodeEvents` custom hook to consume `client.event.subscribe()`.
*   **Task 1.3:** Build global `useReducer` to categorize SSE events (`SESSION_UPDATE`, `TOOL_START`, `TOOL_END`, `MESSAGE_ADD`).

### Phase 2: OpenTUI Component Skeletons
*   **Task 2.1:** Implement `<SidebarNavigation>` with keyboard trap `useKeyboardFocus`.
*   **Task 2.2:** Implement `<FooterStatusBar>` with ping status.
*   **Task 2.3:** Implement static `<MainContentArea>` routing based on sidebar state.

### Phase 3: Real-Time Data Integration
*   **Task 3.1:** Connect the Hierarchy Tree to `TOOL_START/END` state. Implement virtual scrolling for `> 100` nodes.
*   **Task 3.2:** Connect the Session Monitor to `MESSAGE_ADD` state. Auto-scroll `<scrollbox>` to bottom.
*   **Task 3.3:** Add unhappy path handlers (reconnect logic, SIGINT capture, debounce rendering).

## 6. Quality Gates
*   `npm run typecheck && npm run lint` must pass across dashboard components.
*   No direct `process.exit()` calls (must use `renderer.destroy()`).
*   Nested text styling uses standard OpenTUI modifiers without invalid prop injections.
