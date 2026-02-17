# PRD: hivemind-v3 Master Roadmap

## Overview

**hivemind-context-governance v3.0** - A Context-Aware Governance Layer for OpenCode. Provides session lifecycle management, drift detection, hierarchy tracking, and cognitive context preservation. Architecture: In-Process Event Engine with native EventEmitter + fs.watch.

## Current State Summary

| Metric | Value |
|--------|-------|
| Total Files | 97 |
| Test Suite | 126/126 PASSING |
| TypeScript | Clean |
| Architecture | In-Process (NO HTTP/WebSocket) |

## Quality Gates

These commands must pass for every user story:
- `npx tsc --noEmit` - Type checking
- `npm test` - All 126 tests must pass
- File Registry: AGENTS.md and AGENT_RULES.md must be updated for any file changes

---

## Phase Status

### ✅ Phase 1-4: COMPLETE
- Graph Schemas & Tool Diet
- Cognitive Packer
- SDK Hook Injection
- Graph Migration & Session Swarms

### ✅ Phase 5: COMPLETE
- 6 Canonical tools wired
- 13 Legacy tools deleted
- Tool consolidation done

### ✅ Phase 6: COMPLETE
- Test suite 126/126 passing
- All integration tests passing

### ✅ Phase 7: COMPLETE
- In-Process Event Engine (event-bus.ts, watcher.ts, events.ts)
- File Registry enforcement in AGENTS.md and AGENT_RULES.md

---

## Phase 8: Dashboard Integration (PENDING)

### US-08-001: Wire event-bus to dashboard
**Description:** As a developer, I want the dashboard to receive real-time events from the event-bus so that UI updates reflect file system changes.

**Acceptance Criteria:**
- [ ] Dashboard subscribes to event-bus events
- [ ] File changes trigger UI refresh
- [ ] No HTTP/WebSocket required (in-process)

### US-08-002: Migrate Ink TUI to OpenTUI
**Description:** As a user, I want a modern GUI with tabs and panels instead of terminal UI.

**Acceptance Criteria:**
- [ ] Replace Ink components with OpenTUI/SolidJS
- [ ] Implement tabbed navigation
- [ ] Add property panels and toggles

### US-08-003: IPC Bridge for detached dashboard
**Description:** As a system, I need cmd_queue.jsonl IPC for when dashboard runs as detached process.

**Acceptance Criteria:**
- [ ] Atomic JSONL queue with rename pattern
- [ ] File.edited hook triggers queue processing
- [ ] Zero data loss guarantee

---

## Phase 9: Documentation & Polish (PENDING)

### US-09-001: Update README.md
**Description:** As a new user, I want clear documentation on how to use hivemind-v3.

**Acceptance Criteria:**
- [ ] Installation instructions
- [ ] Architecture diagram
- [ ] Tool reference

### US-09-002: Create API documentation
**Description:** As a developer, I want auto-generated API docs for all tools and hooks.

**Acceptance Criteria:**
- [ ] JSDoc comments on all public functions
- [ ] TypeDoc output generated
- [ ] Published to docs/ folder

---

## Non-Goals

- NO idumb-v2 (wrong project name - corrected)
- NO HTTP/WebSocket servers (in-process only)
- NO external daemon processes
- NO port binding
- NO React for OpenTUI (use SolidJS)

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Pass Rate | 100% | 100% ✅ |
| TypeScript Clean | 0 errors | 0 ✅ |
| File Registry Sync | 100% | 100% ✅ |
| Architecture Violations | 0 | 0 ✅ |

---

## Open Questions

1. Should dashboard migrate fully to OpenTUI or keep Ink for CLI mode?
2. Should we implement vi-VN localization now or later?
3. Priority for cmd_queue.jsonl IPC - needed for detached dashboard?
