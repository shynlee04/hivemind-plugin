# Dashboard-v2 Comprehensive Inventory & Phase Plan

> **Document Type**: Corporate-Level Investigation Report
> **Created**: 2026-02-26
> **Status**: INVESTIGATION COMPLETE
> **Source**: 8 Parallel Deep-Research Agents

---

## Executive Summary

This document inventories **ALL** features, functionalities, logics, use-cases, and user-journeys of the HiveMind project for dashboard integration.

### Key Findings

| Category | Count | Dashboard Integration Potential |
|----------|-------|-------------------------------|
| **Tools** | 14 tools, 37 actions | HIGH - 10 tools dashboard-ready |
| **Hooks** | 8 hooks | MEDIUM - 3 can be subscribed |
| **Engines** | 25+ engines | HIGH - 15 visualization opportunities |
| **Events** | 14 event types | HIGH - Real-time updates possible |
| **V1 Components** | 6 components, 4 views | MIGRATION NEEDED |
| **OpenTUI Components** | 20+ components | BUILD READY |
| **OpenCode APIs** | 40+ endpoints | FULL INTEGRATION |
| **Agents** | 8 agents | SWARM MONITOR POSSIBLE |

---

## Part 1: Tools Inventory

### Session Management Tools

| Tool | Actions | Dashboard CRUD | Real-Time | Priority |
|------|---------|----------------|-----------|----------|
| `hivemind_session` | start, update, close, status, resume | ✅ Full CRUD | ✅ Yes | P0 |
| `hivemind_inspect` | scan, deep, drift | ✅ Read-only | ✅ Yes | P0 |
| `hivemind_cycle` | export, list, prune | ✅ Full CRUD | ❌ No | P1 |

### Knowledge Management Tools

| Tool | Actions | Dashboard CRUD | Real-Time | Priority |
|------|---------|----------------|-----------|----------|
| `hivemind_memory` | save, recall, list | ✅ Full CRUD | ❌ No | P0 |
| `hivemind_anchor` | save, list, get | ✅ Full CRUD | ❌ No | P1 |
| `hivemind_session_memory` | scratch, debug_log, research_cache, retro, todo_pending | ✅ Full CRUD | ✅ Yes | P1 |

### Governance Tools

| Tool | Actions | Dashboard CRUD | Real-Time | Priority |
|------|---------|----------------|-----------|----------|
| `hivemind_hierarchy` | prune, migrate, status | ✅ Full CRUD | ✅ Yes | P0 |
| `hivemind_context` | validate, purge, doctor, resume | ✅ Read + Trigger | ✅ Yes | P0 |
| `hivemind_ideate` | evaluate, validate_schema | ✅ Read + Trigger | ❌ No | P2 |

### Code Intelligence Tools

| Tool | Actions | Dashboard CRUD | Real-Time | Priority |
|------|---------|----------------|-----------|----------|
| `hivemind_codemap` | scan, compress, status, search, inject, commit | ✅ Full CRUD | ✅ Yes | P1 |
| `hivemind_read_skeleton` | extract | ✅ Read-only | ❌ No | P2 |
| `hivemind_precision_patch` | patch | ✅ Trigger | ❌ No | P2 |
| `hivemind_mesh_pull` | blast_radius, aggregate | ✅ Read-only | ❌ No | P2 |
| `hivemind_doc_weaver` | patch_markdown | ✅ Trigger | ❌ No | P2 |

---

## Part 2: Hooks & Events Inventory

### Subscribable Hooks (Dashboard Can Listen)

| Hook | Events | Dashboard Use |
|------|--------|---------------|
| `event-handler` | session.created, session.idle, session.compacted, file.edited, todo.updated | Real-time session status |
| `event-bus` | file:created/modified/deleted, codemap:updated, context:purged, memory:classified | File activity monitor |
| `watcher` | File system changes (300ms debounce) | Live file indicator |

### Non-Subscribable Hooks (Polling Required)

| Hook | Data Available | Poll Method |
|------|-----------------|-------------|
| `session-lifecycle` | brain.json state | `hivemind_inspect` |
| `soft-governance` | violation_count, tool ratios | Read brain.json.metrics |
| `tool-gate` | drift_score, session_locked | Read brain.json |
| `compaction` | compaction_count | Read brain.json |
| `messages-transform` | checklist items | Read brain.json |

---

## Part 3: Engines Inventory

### Real-Time Engines (Dashboard Should Monitor)

| Engine | Metrics | Visualization |
|--------|---------|---------------|
| `session-engine` | Duration, turns, files touched | Timer, counters |
| `hierarchy-tree` | Depth, node count, cursor position | Tree view |
| `detection` | Drift score, signals, tool ratios | Gauge, signal feed |
| `complexity` | Files touched, turn count | Histogram |
| `event-bus` | Event counts by type | Event feed |
| `watcher` | File change rate | Activity indicator |

### Processing Engines (Dashboard Can Trigger)

| Engine | Trigger | Output |
|--------|---------|--------|
| `cognitive-packer` | On-demand | Context size, compression ratio |
| `compaction-engine` | compact_session | Turning points, pruned count |
| `session-swarm` | spawnHeadlessResearcher | Swarm status, findings |
| `session-export` | export_cycle | Session archive |

### Code Intelligence Engines

| Engine | Purpose | Dashboard Panel |
|--------|---------|-----------------|
| `file-scanner` | Scan project files | Scan button |
| `compressed-codemap` | Compress signatures | Compression stats |
| `pattern-search` | Search symbols | Search interface |
| `knowledge-commits` | Git commits for state | Commit history |

---

## Part 4: Dashboard V1 Features (Need Migration)

### Components to Migrate

| Component | V1 File | V2 Status | Priority |
|-----------|---------|-----------|----------|
| TelemetryHeader | components/TelemetryHeader.tsx | ✅ Complete | - |
| TrajectoryPane | components/TrajectoryPane.tsx | ⚠️ Partial | P1 |
| AutonomicLog | components/AutonomicLog.tsx | ⚠️ Merged | P2 |
| SwarmMonitor | components/SwarmMonitor.tsx | ❌ Missing | P0 |
| MemCreationModal | components/MemCreationModal.tsx | ❌ Missing | P1 |
| InteractiveFooter | components/InteractiveFooter.tsx | ✅ Complete | - |

### Views to Implement

| View | Purpose | V1 Status | V2 Priority |
|------|---------|-----------|-------------|
| SwarmOrchestratorView | Agent dispatch & status | ❌ Skeleton | P0 |
| TimeTravelDebuggerView | Session history/timeline | ❌ Skeleton | P1 |
| ToolRegistryView | Tool catalog & execution | ❌ Skeleton | P1 |

### V1 Features Missing in V2

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Language toggle (`l` key) | Press `l` to switch EN/VI | Add to keyboard handler |
| Swarm monitor | Real-time agent status | New panel + SSE |
| Time travel | Session timeline navigation | New view |
| Tool registry | List/execute tools | New view |

---

## Part 5: OpenTUI Capabilities

### Available Components

| Category | Components | Dashboard Use |
|----------|------------|---------------|
| **Layout** | box, scrollbox | Panel containers |
| **Display** | text, code, diff, ascii-font | Content display |
| **Input** | input, textarea, select, tab-select | User interaction |
| **Mouse** | onMouseDown/Up/Move/Scroll | Click interactions |

### NOT Available (Must Build Custom)

| Feature | Solution |
|---------|----------|
| Charts (bar, line, pie) | FrameBufferRenderable custom |
| Diagrams | FrameBufferRenderable custom |
| Progress bars | Box with dynamic width |
| Drag-drop | Mouse events + state |

### Mouse Support

```typescript
// Enable mouse
const renderer = await createCliRenderer({
  useMouse: true,
  enableMouseMovement: true,
})

// Use on components
<box onMouseDown={(e) => handleClick(e)} onMouseMove={(e) => trackMouse(e)}>
```

---

## Part 6: OpenCode Server APIs

### Session Management

| Endpoint | Dashboard Feature |
|----------|-------------------|
| GET /session | Session list panel |
| POST /session | Create session modal |
| DELETE /session/:id | Delete session button |
| GET /session/:id/todo | Todo panel |

### Real-Time (SSE)

| Event | Dashboard Use |
|-------|---------------|
| session.created | Update session list |
| message.part.updated | Live message stream |
| todo.updated | Refresh todo panel |
| tool.started/completed | Tool execution indicator |

### File Operations

| Endpoint | Dashboard Feature |
|----------|-------------------|
| GET /file | File browser |
| GET /file/content | File viewer |
| GET /find | Search panel |
| GET /find/symbol | Symbol search |

---

## Part 7: Agent & Swarm System

### Available Agents

| Agent | Role | Dashboard Control |
|-------|------|-------------------|
| hiveminder | Orchestrator | Agent selector |
| hivemaker | Builder | Dispatch button |
| hivehealer | Debugger | Debug trigger |
| hivexplorer | Scanner | Investigation button |
| hiveplanner | Planner | Plan generation |
| hiveq | Quality | Verification trigger |
| hiverd | Research | Research dispatch |
| hivefiver | Meta-builder | Workflow trigger |

### Swarm Features

| Feature | Description | Dashboard |
|---------|-------------|-----------|
| Parallel execution | Multiple agents simultaneously | Swarm grid |
| Headless research | Background investigation | Progress indicator |
| Status tracking | spawned/completed/error | Status badges |

---

## Part 8: 5-Phase Implementation Plan

### Phase 1: Foundation (COMPLETED ✅)

| Task | Status | Evidence |
|------|--------|----------|
| Fix data flow bug | ✅ | snapshot.ts uses serverData |
| Wire keyboard shortcuts | ✅ | c/m/x/t call apiClient |
| Server connection status | ✅ | Header shows ONLINE/OFFLINE |
| TypeScript compilation | ✅ | 0 errors |
| Root tests | ✅ | 197/197 pass |

### Phase 2: Input Modal System (COMPLETED ✅)

| Task | Status | Evidence |
|------|--------|----------|
| Fix InputModal errors | ✅ | borderBottom removed |
| Add modal state | ✅ | modal: null in AppState |
| Wire c/m/x to modals | ✅ | Keys open InputModal |
| Add i18n keys | ✅ | modal.title_* in EN/VI |

### Phase 3: SSE Real-Time Updates

| Task ID | Task | Dependencies |
|---------|------|--------------|
| 3.1 | Add `subscribeToEvents()` to api.ts | None |
| 3.2 | Define event type handlers | 3.1 |
| 3.3 | Add `sseConnected` to AppState | 3.1 |
| 3.4 | Wire SSE in App useEffect | 3.2, 3.3 |
| 3.5 | Add "🔴 LIVE" indicator in footer | 3.4 |
| 3.6 | Handle reconnection (3 retries, backoff) | 3.4 |
| 3.7 | Update snapshot on events | 3.2 |

### Phase 4: Complete Feature Migration

| Task ID | Task | Dependencies |
|---------|------|--------------|
| 4.1 | Add language toggle (`l` key) | None |
| 4.2 | Implement SwarmMonitor component | Phase 3 |
| 4.3 | Implement SwarmOrchestratorView | 4.2 |
| 4.4 | Implement ToolRegistryView | None |
| 4.5 | Implement MemCreationModal | Phase 2 |
| 4.6 | Add TimeTravelDebuggerView | None |
| 4.7 | Add mouse click handlers | None |

### Phase 5: Polish & Production

| Task ID | Task | Dependencies |
|---------|------|--------------|
| 5.1 | Add ErrorBoundary component | None |
| 5.2 | Add keyboard help overlay (`?`) | None |
| 5.3 | Add command history (Up/Down) | Phase 2 |
| 5.4 | Add confirmation dialogs | 5.1 |
| 5.5 | Add session selector | Phase 3 |
| 5.6 | E2E test: Full workflow | All phases |
| 5.7 | Document keyboard shortcuts | 5.6 |
| 5.8 | Performance optimization | 5.6 |

---

## Part 9: New Dashboard Features (10x Improvement)

### Real-Time Monitoring

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Live session status | Real-time updates via SSE | Phase 3 |
| File activity monitor | Track file changes | event-bus |
| Tool execution feed | See tools running | SSE events |
| Drift gauge | Visual drift score | Poll brain.json |

### Management Panels

| Panel | Features |
|-------|----------|
| Session Manager | Create/Delete/Resume sessions |
| Memory Browser | CRUD by shelf, search |
| Hierarchy Tree | Visual tree, cursor highlight, prune |
| Anchor Editor | Key-value CRUD |
| Todo Board | Kanban with status |

### Agent & Swarm

| Feature | Description |
|---------|-------------|
| Agent selector | Choose agent for dispatch |
| Swarm grid | Visual agent topology |
| Progress indicator | Track headless research |
| Findings viewer | See research results |

### Code Intelligence

| Feature | Description |
|---------|-------------|
| Project scanner | Scan project files |
| Symbol search | Find functions/classes |
| Compression stats | Token counts, ratios |
| Knowledge commits | Git history |

### Visualization

| Feature | Description |
|---------|-------------|
| Progress bars | Dynamic width boxes |
| Status badges | Color-coded indicators |
| Tree view | ASCII hierarchy |
| Signal feed | Detection alerts |

---

## Part 10: Mouse Support Implementation

### Enable Mouse

```typescript
// In index.tsx
const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  useMouse: true,
  enableMouseMovement: true,
})
```

### Click Handlers

```tsx
<box
  onMouseDown={(e) => {
    if (e.button === MouseButton.LEFT) {
      dispatch({ type: "TAB_SET", value: clickedTab })
    }
  }}
  onMouseOver={() => setHovered(true)}
  onMouseOut={() => setHovered(false)}
>
```

### Mouse Use Cases

| Element | Interaction |
|---------|-------------|
| Tab buttons | Click to switch |
| Session list | Click to select |
| Tree nodes | Click to expand |
| Action buttons | Click to execute |

---

## Part 11: Validation Gates

### Per-Phase Gates

```bash
# TypeScript
cd src/dashboard-v2 && bunx tsc --noEmit

# Root tests
npm test

# Manual E2E
opencode serve  # Terminal 1
cd src/dashboard-v2 && bun run src/index.tsx  # Terminal 2
```

### Final Gate (Phase 5)

```bash
# All must pass
npm test                    # 197/197
npx tsc --noEmit            # 0 errors
npm run guard:public        # Branch protection

# E2E workflow
1. Press 'c' → Create session
2. Press 'm' → Send message
3. Press 'x' → Execute command
4. Press 'l' → Toggle language
5. Press '?' → Show help
6. Verify SSE live indicator
7. Test offline → online recovery
```

---

## Summary

This investigation inventoried **ALL** HiveMind capabilities for dashboard integration:

- **14 Tools** with 37 actions
- **8 Hooks** with event handling
- **25+ Engines** for processing
- **14 Event types** for real-time
- **6 V1 Components** needing migration
- **20+ OpenTUI components** available
- **40+ OpenCode APIs** for integration
- **8 Agents** for swarm management

The 5-phase plan transforms the dashboard from a read-only display into a **fully functional control panel** with real-time updates, CRUD operations, agent management, and complete OpenCode server integration.

---

*Document generated via 8 parallel deep-research agents following enterprise_architect persona lane*
