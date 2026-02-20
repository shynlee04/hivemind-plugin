# Requirements: HiveMind v3.0

**Defined:** 2026-02-18
**Core Value:** Every turn, the agent has pristine context.

## v1 Requirements

### Foundation Validation

- [ ] **FOUND-01**: All 126 tests pass
  - **Test:** `npm test`
  - **Expected:** All 126 tests pass, 0 fail, 0 skipped
  
- [ ] **FOUND-02**: TypeScript compiles without errors
  - **Test:** `npx tsc --noEmit`
  - **Expected:** No type errors, clean exit

- [ ] **FOUND-03**: SDK boundary check passes
  - **Test:** `npm run lint:boundary`
  - **Expected:** All tools ≤100 lines, no business logic in tools

- [ ] **FOUND-04**: Cognitive packer produces valid XML
  - **Test:** `node -e "import('./dist/lib/cognitive-packer.js').then(m => console.log(m.packCognitiveState('.').substring(0,100)))"`
  - **Expected:** XML string starting with `<hivemind_state`

- [ ] **FOUND-05**: Session lifecycle hooks inject context
  - **Test:** Check `.hivemind/state/brain.json` exists after session start
  - **Expected:** File exists with valid JSON containing session.id, governance_status, mode

- [ ] **FOUND-06**: Graph nodes have FK constraints enforced
  - **Test:** Try to save orphaned node via graph-io.ts
  - **Expected:** Node rejected or quarantined to orphans.json

- [ ] **FOUND-07**: Event bus emits and receives events
  - **Test:** Subscribe to event, emit event, verify callback fires
  - **Expected:** Callback invoked with correct event payload

### TUI OpenTUI Migration

- [ ] **TUI-01**: OpenTUI dependencies installed
  - **Test:** Check package.json for @opentui/core, @opentui/react (or @opentui/solid)
  - **Expected:** Dependencies present with valid versions

- [ ] **TUI-02**: Dashboard entry point uses OpenTUI
  - **Test:** Check src/dashboard/bin.ts imports from @opentui
  - **Expected:** `createCliRenderer` or `createRoot` from OpenTUI

- [ ] **TUI-03**: Dashboard renders without crashing
  - **Test:** `bun run dist/dashboard/bin.js --projectRoot .`
  - **Expected:** TUI displays, no errors, exits cleanly

- [ ] **TUI-04**: TelemetryHeader shows session metrics
  - **Test:** Start TUI, verify metrics display
  - **Expected:** Shows turn_count, drift_score, files_touched

- [ ] **TUI-05**: Hierarchy tree displays correctly
  - **Test:** Start TUI with active session, check trajectory pane
  - **Expected:** Shows trajectory → tactic → action tree with status dots

- [ ] **TUI-06**: Memory pane shows saved mems
  - **Test:** Save a mem, check TUI displays it
  - **Expected:** Mem appears with correct shelf, tags, content preview

- [ ] **TUI-07**: Tool execution log updates in real-time
  - **Test:** Execute a tool, check autonomic log
  - **Expected:** Log entry appears within 1 second

- [ ] **TUI-08**: Language toggle switches EN/VI
  - **Test:** Press 'L' key in TUI
  - **Expected:** All labels switch language, state preserved

### Integration Tests

- [ ] **INT-01**: Full session lifecycle works
  - **Test:** Start session → update hierarchy → save mem → inspect → compact
  - **Expected:** All operations succeed, state persisted correctly

- [ ] **INT-02**: Dashboard reflects live state
  - **Test:** Run TUI, perform operations in another terminal
  - **Expected:** TUI updates within 2 seconds to reflect changes

## v2 Requirements

Deferred to future release.

### Advanced TUI Features

- **TUI-ADV-01**: Time Travel Debugger (state history replay)
- **TUI-ADV-02**: Swarm Monitor (agent status grid)
- **TUI-ADV-03**: Tool Registry (capability toggles)

## Out of Scope

| Feature | Reason |
|---------|--------|
| HTTP/WebSocket server | In-process architecture only |
| External database | Filesystem persistence only |
| Mobile app | Terminal UI only |
| React runtime | OpenTUI requires Bun |
| OAuth authentication | Runs inside OpenCode context |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 2 | Pending |
| FOUND-05 | Phase 3 | Pending |
| FOUND-06 | Phase 4 | Pending |
| FOUND-07 | Phase 4 | Pending |
| TUI-01 | Phase 5 | Pending |
| TUI-02 | Phase 5 | Pending |
| TUI-03 | Phase 5 | Pending |
| TUI-04 | Phase 5 | Pending |
| TUI-05 | Phase 5 | Pending |
| TUI-06 | Phase 5 | Pending |
| TUI-07 | Phase 5 | Pending |
| TUI-08 | Phase 5 | Pending |
| INT-01 | Phase 6 | Pending |
| INT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after GSD initialization*
