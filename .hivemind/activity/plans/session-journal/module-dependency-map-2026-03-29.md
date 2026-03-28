# Module Dependency Map: Session Journal Refactor

**Date:** 2026-03-29
**Status:** proposed

---

## Current Module Structure (What Exists Now)

```
src/
├── features/
│   └── event-tracker/
│       ├── types.ts                    ← SessionV2, SessionV3, EventType, all interfaces
│       ├── consolidated-writer.ts      ← JSON writer (session/v2 + v3), atomic writes
│       ├── markdown-writer.ts          ← events.md generator (TOC, turns, diagnostics)
│       ├── paths.ts                    ← Path builders (events.md, diagnostics.log, delegation.md, etc.)
│       ├── consolidated-writer.test.ts ← Tests for JSON writer
│       ├── consolidated-writer-v3.test.ts
│       ├── markdown-writer.test.ts
│       ├── paths.test.ts
│       ├── types.test.ts
│       ├── session-structure.test.ts
│       └── session-v3-types.test.ts
│
├── hooks/
│   ├── event-handler.ts                ← event hook: session.idle → consolidated, others → trajectory
│   ├── text-complete-handler.ts        ← text.complete hook: primary journal writer
│   ├── compaction-handler.ts           ← session.compacting hook: compaction events
│   ├── chat-message-handler.ts         ← chat.message hook: user message capture [NOT WIRED]
│   ├── tool-execution-handler.ts       ← tool.execute.after hook: tool tracking [NOT WIRED]
│   ├── transform-handler.ts            ← system.transform hook: injection payload capture
│   ├── compaction-handler.test.ts      ← (referenced in hooks/index.ts export)
│   ├── event-handler.test.ts
│   ├── sdk-context.ts                  ← SDK client singleton
│   ├── soft-governance.ts              ← Toast notifications
│   └── index.ts                        ← Barrel export
│
├── plugin/
│   ├── opencode-plugin.ts              ← Plugin entry: hook registration + tool assembly
│   ├── injection-store.ts              ← In-memory injection payload store
│   ├── compaction-adapter.ts           ← Compaction handler adapter
│   ├── messages-transform-adapter.ts   ← Messages transform adapter
│   ├── runtime-snapshot.ts             ← Turn snapshot loader
│   ├── synthetic-parts.ts              ← Synthetic part creation
│   ├── context-renderer.ts             ← Tool precedence rendering
│   └── skill-exposure-map.ts           ← Skill injection
│
├── sdk-supervisor/
│   ├── session-inspection.ts           ← Legacy: .hivemind/session-inspection/ writer
│   ├── diagnostic-log.ts               ← Legacy: .hivemind/error-log/ writer [@deprecated]
│   ├── instance-registry.ts
│   ├── health.ts
│   ├── runtime-status.ts
│   └── index.ts                        ← Barrel export (includes deprecated modules)
│
├── shared/
│   └── paths.ts                        ← Path constants: HIVEMIND_DIR, SESSIONS_DIR, session-inspection, error-log
│
└── tools/
    └── hivemind-journal.ts             ← hivemind_journal tool (agent-facing journal tool)
```

### Dependency Flow (Current)

```
opencode-plugin.ts
  ├─→ event-handler.ts
  │     ├─→ consolidated-writer.ts (session.idle only)
  │     ├─→ core/trajectory/ (most events)
  │     └─→ features/agent-work-contract/
  │
  ├─→ text-complete-handler.ts
  │     └─→ consolidated-writer.ts (primary writer)
  │
  ├─→ compaction-handler.ts
  │     └─→ consolidated-writer.ts
  │
  ├─→ transform-handler.ts
  │     └─→ injection-store.ts
  │
  ├─→ [LEGACY] upsertSessionInspectionExport
  │     └─→ session-inspection.ts → .hivemind/session-inspection/
  │
  └─→ [LEGACY] writeDiagnosticLog
        └─→ diagnostic-log.ts → .hivemind/error-log/

chat-message-handler.ts          ← EXISTS, NOT IMPORTED by plugin
tool-execution-handler.ts        ← EXISTS, NOT IMPORTED by plugin
```

### Identified Issues

1. **5x session resolution duplication**: `findSessionBySdkId → loadSession → initSession` pattern in:
   - `text-complete-handler.ts` (lines 80-98)
   - `event-handler.ts` (lines 121-134)
   - `compaction-handler.ts` (lines 53-66)
   - `chat-message-handler.ts` (lines 51-75)
   - `tool-execution-handler.ts` (lines 42-67)

2. **Path resolution inconsistency**: Some handlers use `join(directory, '.hivemind', 'sessions')` directly; others could use `getEffectivePaths()`.

3. **Legacy writes active**: `writeDiagnosticLog` and `upsertSessionInspectionExport` are called in `opencode-plugin.ts` lines 234-262.

4. **Two parallel output formats**: `consolidated-writer.ts` writes JSON; `markdown-writer.ts` writes markdown. They are not coordinated.

---

## Target Module Structure (What It Should Be)

```
src/
├── features/
│   └── session-journal/                ← RENAMED from event-tracker (clearer purpose)
│       ├── types.ts                    ← KEEP: SessionV3, EventType, all interfaces
│       ├── consolidated-writer.ts      ← KEEP: JSON writer (canonical data layer)
│       ├── session-resolver.ts         ← NEW: Extracted from 5 handler copies
│       │   └─ SessionResolver interface
│       ├── journey-events-writer.ts    ← RENAME from markdown-writer.ts
│       │   └─ JourneyEventsWriter interface
│       │   └─ TOC generation
│       │   └─ Turn rendering
│       │   └─ Tool batch rendering
│       │   └─ Delegation rendering
│       ├── error-log-writer.ts         ← NEW: Replaces sdk-supervisor/diagnostic-log.ts
│       │   └─ ErrorLogWriter interface
│       │   └─ Writes to .hivemind/sessions/error-logs/
│       ├── paths.ts                    ← MODIFY: Add journey-events and error-logs paths
│       ├── index.ts                    ← NEW: Barrel export
│       └── *.test.ts                   ← KEEP: All existing tests
│
├── hooks/
│   ├── event-handler.ts                ← MODIFY: Wire session.created, session.ended, session.error
│   ├── text-complete-handler.ts        ← MODIFY: Inject SessionResolver, remove duplication
│   ├── compaction-handler.ts           ← MODIFY: Inject SessionResolver, remove duplication
│   ├── chat-message-handler.ts         ← MODIFY: Inject SessionResolver, remove duplication
│   ├── tool-execution-handler.ts       ← MODIFY: Inject SessionResolver, remove duplication
│   ├── transform-handler.ts            ← KEEP: No changes
│   ├── sdk-context.ts                  ← KEEP: No changes
│   ├── soft-governance.ts              ← KEEP: No changes
│   └── index.ts                        ← MODIFY: Add chat-message-handler, tool-execution-handler exports
│
├── plugin/
│   └── opencode-plugin.ts              ← MODIFY:
│       ├─ Wire chat-message-handler in chat.message hook
│       ├─ Wire tool-execution-handler in tool.execute.after hook
│       ├─ Wire event-handler for session.created/ended/error
│       ├─ REMOVE writeDiagnosticLog call
│       └─ REMOVE upsertSessionInspectionExport call
│
├── sdk-supervisor/
│   ├── session-inspection.ts           ← DEPRECATE (Phase 1), REMOVE (Phase 2)
│   ├── diagnostic-log.ts               ← DEPRECATE (already @deprecated), REMOVE (Phase 2)
│   ├── instance-registry.ts            ← KEEP
│   ├── health.ts                       ← KEEP
│   ├── runtime-status.ts               ← KEEP
│   └── index.ts                        ← MODIFY: Remove deprecated exports
│
├── shared/
│   └── paths.ts                        ← MODIFY:
│       ├─ REMOVE getSessionInspectionPath (after Phase 2)
│       ├─ REMOVE getErrorLogPath (after Phase 2)
│       └─ ADD getJourneyEventsPath, getErrorLogsPath
│
└── tools/
    └── hivemind-journal.ts             ← KEEP: Agent-facing tool unchanged
```

---

## Migration Path

### Phase 1: Wire Existing Handlers (Low Risk, High Impact)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 1.1 | Import `handleChatMessage` in plugin | `opencode-plugin.ts` | Low |
| 1.2 | Register in `chat.message` hook | `opencode-plugin.ts` | Low |
| 1.3 | Import `handleToolExecution` in plugin | `opencode-plugin.ts` | Low |
| 1.4 | Register in `tool.execute.after` hook | `opencode-plugin.ts` | Low |
| 1.5 | Verify `userMessageCount > 0` | Test | — |
| 1.6 | Verify `toolCallCount > 0` | Test | — |

**Impact**: Solves R3 (user message capture), R6 (tool invocation tracking), R7 (counter accuracy).

### Phase 2: Extract Session Resolver (Refactor)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 2.1 | Create `session-resolver.ts` with `SessionResolver` interface | NEW file | Low |
| 2.2 | Implement `resolve()` and `resolveOrCreate()` | NEW file | Low |
| 2.3 | Refactor `text-complete-handler.ts` to use resolver | MODIFY | Medium |
| 2.4 | Refactor `event-handler.ts` to use resolver | MODIFY | Medium |
| 2.5 | Refactor `compaction-handler.ts` to use resolver | MODIFY | Medium |
| 2.6 | Refactor `chat-message-handler.ts` to use resolver | MODIFY | Medium |
| 2.7 | Refactor `tool-execution-handler.ts` to use resolver | MODIFY | Medium |
| 2.8 | Run all tests, verify no regressions | Test | — |

**Impact**: Eliminates 5 copies of session resolution logic. No behavior change.

### Phase 3: Journey-Events Markdown (New Feature)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 3.1 | Rename `markdown-writer.ts` → `journey-events-writer.ts` | RENAME | Low |
| 3.2 | Add `ToolBatchEntry` and `DelegationRecord` rendering | MODIFY | Medium |
| 3.3 | Add actors extraction (from session metadata) | MODIFY | Medium |
| 3.4 | Add artifact/evidence link rendering | MODIFY | Medium |
| 3.5 | Wire `journeyEventsWriter.appendTurn()` in text-complete handler | MODIFY | Medium |
| 3.6 | Wire `journeyEventsWriter.appendToolBatch()` in tool-execution handler | MODIFY | Medium |
| 3.7 | Update path to `.hivemind/sessions/journey-events/` | MODIFY | Low |

**Impact**: Solves new journey-events markdown requirement.

### Phase 4: Error-Logs Subfolder (New Feature)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 4.1 | Create `error-log-writer.ts` | NEW file | Low |
| 4.2 | Write error events to `.hivemind/sessions/error-logs/{sessionId}.log` | NEW file | Low |
| 4.3 | Wire in `event-handler.ts` for error events | MODIFY | Medium |
| 4.4 | Add `getErrorLogsPath()` to `shared/paths.ts` | MODIFY | Low |

**Impact**: Solves new error-logs requirement.

### Phase 5: Remove Legacy (Breaking Change)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 5.1 | Remove `writeDiagnosticLog` call from `opencode-plugin.ts` | MODIFY | High |
| 5.2 | Remove `upsertSessionInspectionExport` call from `opencode-plugin.ts` | MODIFY | High |
| 5.3 | Mark `session-inspection.ts` as `@deprecated` | MODIFY | Low |
| 5.4 | Remove exports from `sdk-supervisor/index.ts` | MODIFY | Medium |
| 5.5 | Remove `getSessionInspectionPath` from `shared/paths.ts` | MODIFY | Medium |
| 5.6 | Remove `getErrorLogPath` from `shared/paths.ts` | MODIFY | Medium |

**Impact**: Solves R8 (legacy cleanup). Breaking for consumers of old paths.

### Phase 6: Module Rename (Cosmetic)

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 6.1 | Rename `features/event-tracker/` → `features/session-journal/` | RENAME | Medium |
| 6.2 | Update all imports referencing `event-tracker` | MULTI-FILE | Medium |
| 6.3 | Update barrel exports | MODIFY | Low |

**Impact**: Clearer module naming. Purely cosmetic.

---

## Dependency Graph (Target)

```
opencode-plugin.ts
  ├─→ hooks/event-handler.ts
  │     ├─→ features/session-journal/session-resolver.ts
  │     ├─→ features/session-journal/consolidated-writer.ts
  │     ├─→ features/session-journal/error-log-writer.ts    [NEW]
  │     └─→ core/trajectory/
  │
  ├─→ hooks/text-complete-handler.ts
  │     ├─→ features/session-journal/session-resolver.ts
  │     ├─→ features/session-journal/consolidated-writer.ts
  │     └─→ features/session-journal/journey-events-writer.ts
  │
  ├─→ hooks/compaction-handler.ts
  │     ├─→ features/session-journal/session-resolver.ts
  │     └─→ features/session-journal/consolidated-writer.ts
  │
  ├─→ hooks/chat-message-handler.ts          [NOW WIRED]
  │     ├─→ features/session-journal/session-resolver.ts
  │     └─→ features/session-journal/consolidated-writer.ts
  │
  ├─→ hooks/tool-execution-handler.ts        [NOW WIRED]
  │     ├─→ features/session-journal/session-resolver.ts
  │     └─→ features/session-journal/consolidated-writer.ts
  │
  └─→ [REMOVED] sdk-supervisor/session-inspection.ts
  └─→ [REMOVED] sdk-supervisor/diagnostic-log.ts
```

---

## Modules Staying, Moving, Deleting

| Module | Action | Reason |
|--------|--------|--------|
| `features/event-tracker/types.ts` | STAY (rename dir) | Core type definitions |
| `features/event-tracker/consolidated-writer.ts` | STAY (rename dir) | Canonical JSON writer |
| `features/event-tracker/markdown-writer.ts` | RENAME → `journey-events-writer.ts` | Enhanced for journey format |
| `features/event-tracker/paths.ts` | MODIFY | Add new path builders |
| `features/session-journal/session-resolver.ts` | CREATE | Extract duplicated logic |
| `features/session-journal/error-log-writer.ts` | CREATE | Replaces diagnostic-log.ts |
| `hooks/chat-message-handler.ts` | STAY (wire) | Already implemented |
| `hooks/tool-execution-handler.ts` | STAY (wire) | Already implemented |
| `sdk-supervisor/session-inspection.ts` | DELETE (Phase 2) | Replaced by consolidated |
| `sdk-supervisor/diagnostic-log.ts` | DELETE (Phase 2) | Replaced by error-log-writer |
| `shared/paths.ts` | MODIFY | Remove legacy path builders |
