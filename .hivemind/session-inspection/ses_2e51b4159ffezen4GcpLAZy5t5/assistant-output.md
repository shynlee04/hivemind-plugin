# Session Inspection Export

- ses_id: `ses_2e51b4159ffezen4GcpLAZy5t5`
- prepared_at: `2026-03-23T13:35:00.502Z`

## Assistant Output

Now I have all the context needed. Let me compile the validation report.

---

## Interface Contract Validation Report: Session-Journal System Design

**Date:** 2026-03-23
**Status:** VALIDATION COMPLETE — BLOCKED ROUTES IDENTIFIED
**Validator:** architect

---

### 1. Hook Integration Points Analysis

#### 1.1 Existing Hook Registration (from `opencode-plugin.ts`)

| Hook | Handler | Purpose | Lines |
|------|---------|---------|-------|
| `event` | `eventHandler` | Records trajectory events | 62-63 |
| `experimental.chat.messages.transform` | `messagesTransform` | Injects HiveMind context | 203 |
| `experimental.session.compacting` | `compactionHandler` | Injects context into compaction | 204 |
| `experimental.text.complete` | Inline (lines 165-201) | Diagnostic log + session inspection | 165-201 |

#### 1.2 Proposed Hook Integration vs. Existing

| Proposed Handler | Target Hook | Current Behavior | Compatibility |
|-----------------|-------------|------------------|---------------|
| `transform-handler.ts` | `messages.transform` | Calls `setInjectionPayload()` → store | ✅ **COMPATIBLE** |
| `text-complete-handler.ts` | `text.complete` | Calls `writeDiagnosticLog()` + `upsertSessionInspectionExport()` | ⚠️ **NEEDS MIGRATION PATH** |
| `event-hook-handler.ts` | `event` | Calls `recordTrajectoryEvent()` → trajectory ledger | ✅ **COMPATIBLE** (coexists) |
| `compaction-handler.ts` | `session.compacting` | Calls `createCompactionHandler()` → context injection | ✅ **COMPATIBLE** (coexists) |

**Key Finding:** The `messages.transform` integration is fully compatible — the `injection-store.ts` already provides the store-and-retrieve pattern that `transform-handler.ts` would need.

---

### 2. SDK Dependency Audit

#### 2.1 Standalone Rule Compliance

The event-tracker design document claims:
> "The `src/feature/event-tracker/` module does NOT import from `@opencode-ai/sdk`. It uses: `node:fs/promises`, `node:path`, Its own types (no SDK types)."

**Verification against current diagnostic log implementation (`src/sdk-supervisor/diagnostic-log.ts`):**

```typescript
import * as fs from 'node:fs/promises'  // ✅ Node.js only
import * as path from 'node:path'       // ✅ Node.js only
import { getErrorLogPath } from '../shared/paths.js'  // ✅ No SDK import
```

**Verification against `session-inspection.ts`:**
```typescript
import * as fs from 'node:fs/promises'  // ✅ Node.js only
import * as path from 'node:path'       // ✅ Node.js only
```

**Verification against `injection-store.ts`:**
```typescript
// No imports at all — pure TypeScript
```

**✅ VERIFIED:** The current diagnostic infrastructure IS already standalone (no SDK imports). A replacement module can maintain this property.

#### 2.2 Data Dependencies (Non-SDK)

To read current runtime state, the module would need:

| Dependency | Location | Type | SDK Dependency |
|------------|----------|------|----------------|
| `RuntimeBindingsSnapshot` | `src/features/runtime-entry/attachment.types.ts` | Local interface | None |
| `loadRuntimeBindingsSnapshot` | `src/features/runtime-entry/snapshot-loader.ts` | Local function | None |
| `TurnSnapshotLoader` | `src/plugin/runtime-snapshot.ts` | Local interface | None |
| `InjectionPayload` | `src/plugin/injection-store.ts` | Local interface | None |

**✅ VERIFIED:** All required runtime data is accessible without SDK imports.

---

### 3. Module Placement Per AGENTS.md

#### 3.1 Architecture Directory Rules

From `src/AGENTS.md`:
```
src/
├── plugin/          Assembly + enforcement wiring (NO business logic)
├── hooks/           Read-side/intercept — inject context
├── tools/           Write-side — 6 structured agent-callable tools
├── sdk-supervisor/  Additive Phase 1 orchestration control
├── schema-kernel/   Additive Phase 1 contract authority
├── core/            State — trajectory and workflow authority
├── features/        [existing - session-entry, workflow, handoff, etc.]
├── shared/          Utilities
```

#### 3.2 Proposed Placement Analysis

**Document claims:** `src/feature/session-journal/` (singular `feature`)

**Current reality:**
- `src/feature/` exists as EMPTY directory
- `src/features/` exists with 10 subdirectories (session-entry, workflow, handoff, agent-work-contract, etc.)

**AGENTS.md has NO entry for `src/feature/`** — only `src/features/`.

**Finding:** The proposed path `src/feature/session-journal/` does NOT align with existing architecture. The correct path following established patterns would be `src/features/session-journal/` or `src/features/event-tracker/`.

---

### 4. Sub-Session Resumption Compatibility

#### 4.1 Existing Trajectory Ledger Model

From `src/core/trajectory/`:
- `trajectory-store.ts` maintains `TrajectoryLedger` with `trajectories[].sessionIds[]`
- `delegationReceiptSchema` (in `schema-kernel`) tracks parent-child session relationships
- `runtimeInvocationSchema` has `parentSessionId?: string`

#### 4.2 Proposed Delegation.json Model

The event-tracker design proposes:
```markdown
## Turn 004 — 2026-03-23T18:01:35Z → CREATED
sub_session: ses_2e5b_sub1
delegated_to: hivemaker

## Turn 005 — 2026-03-23T18:03:00Z ← RETURNED
sub_session: ses_2e5b_sub1
status: completed
```

#### 4.3 Compatibility Analysis

| Aspect | Existing (Trajectory Ledger) | Proposed (delegation.json) | Compatible? |
|--------|---------------------------|---------------------------|-------------|
| Parent→Child linkage | ✅ `parentSessionId` in `runtimeInvocationSchema` | ✅ `sub_session` field | ✅ YES |
| Child→Parent backlink | ✅ `delegationReceiptSchema` has both IDs | ✅ Same event shows both | ✅ YES |
| Session folder per sub-session | ✅ Each session has own folder | ✅ Per-session `delegation.json` | ✅ YES |
| Cross-session query | ✅ Trajectory ledger queries sessionIds | ⚠️ Requires parsing all `delegation.json` | ⚠️ PARTIAL |

**Finding:** The delegation.json model is compatible with the existing trajectory ledger for parent↔child linkage. However, the event-tracker stores delegation events in markdown (human-readable) while the trajectory ledger uses JSON (machine-queriable). These serve different purposes and should coexist.

---

### 5. Blocked Routes and Incompatibilities

#### 5.1 CRITICAL BLOCKERS

| # | Blocker | Impact | Resolution Required |
|---|---------|--------|---------------------|
| 1 | **Missing design document** | `time-machine-design-2026-03-23.md` does not exist | Authorize or discard time-machine design |
| 2 | **Module path conflict** | Event-tracker doc proposes `src/feature/event-tracker/`, synthesized design proposes `src/feature/session-journal/` | Choose ONE canonical path |
| 3 | **Hook wiring gap** | `text-complete-handler.ts` doesn't exist; current inline handler must be migrated | Implement handler OR keep current wiring |
| 4 | **Migration of existing error-log** | `writeDiagnosticLog()` still references `.hivemind/error-log/` | Update path builder in `shared/paths.ts` or migrate existing files |

#### 5.2 ARCHITECTURE CONCERNS

| # | Concern | Detail |
|---|---------|--------|
| A | **Session-inspection overlap** | Current `upsertSessionInspectionExport()` writes to `.hivemind/session-inspection/{sessionId}/` — the event-tracker design doesn't address this parallel system |
| B | **Path authority fragmentation** | Event-tracker would create `.hivemind/event-log/` but `shared/paths.ts` only has `getErrorLogPath()` — new path builder needed |
| C | **Coexisting diagnostic systems** | Event-tracker (per-session, 4 files) + session-inspection (per-session, 2 files) + error-log (per-turn, N files) = 3 parallel systems during transition |
| D | **Hook event deduplication** | `event-hook-handler.ts` would record to trajectory ledger AND event-tracker — need to confirm `event-handler.ts` filters appropriately |

---

### 6. Recommended Module Structure

Based on AGENTS.md rules and validation findings:

#### 6.1 Corrected Placement

```
src/features/event-tracker/          ← NOT src/feature/
├── index.ts                         ← Barrel export
├── types.ts                         ← Event types, turn types
├── session-writer.ts                ← Write per-session files
├── event-classifier.ts              ← Classify incoming events
├── index-writer.ts                  ← Maintain master index
├── formatter.ts                     ← Format as .md section or .log line
├── paths.ts                         ← Path builders for .hivemind/event-log/
└── hooks/
    ├── transform-handler.ts         ← Wires to messages.transform
    ├── text-complete-handler.ts     ← Wires to text.complete
    ├── event-hook-handler.ts        ← Wires to event (optional - different purpose)
    └── compaction-handler.ts        ← Wires to session.compacting (optional)
```

**Rationale:** Using `src/features/event-tracker/` aligns with existing `src/features/` pattern (agent-work-contract, handoff, session-entry, workflow, etc.).

#### 6.2 Required Path Updates

In `src/shared/paths.ts`, add:
```typescript
export const EVENT_LOG_DIR = 'event-log'

export function getEventLogPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, EVENT_LOG_DIR)
}

export function getEventLogSessionPath(projectRoot: string, sessionId: string): string {
  return path.join(getEventLogPath(projectRoot), sessionId)
}
```

#### 6.3 Hook Wiring Specification

| Hook | Handler Factory | Registration Location |
|------|-----------------|----------------------|
| `experimental.chat.messages.transform` | `createTransformHandler()` | Already wired via `messagesTransform` |
| `experimental.text.complete` | `createTextCompleteHandler()` | Replace inline handler (lines 165-201) with call to new handler |
| `event` | `createEventHookHandler()` | Optional — different purpose than trajectory recording |
| `experimental.session.compacting` | `createSessionCompactionHandler()` | Already wired via `compactionHandler` |

---

### 7. Evidence Summary

| Item | File:Line | Finding |
|------|-----------|---------|
| Current error-log path | `src/shared/paths.ts:42-44` | `getErrorLogPath()` exists |
| Current text.complete handler | `opencode-plugin.ts:165-201` | Inline, calls `writeDiagnosticLog()` and `upsertSessionInspectionExport()` |
| Current messages.transform | `opencode-plugin.ts:203` | Wires to `messagesTransform` |
| Event hook integration | `src/hooks/event-handler.ts:87-124` | Records to trajectory ledger, checks active trajectory session |
| Injection payload store | `src/plugin/injection-store.ts:25-35` | Map-based store, cleared after read |
| Session inspection | `src/sdk-supervisor/session-inspection.ts:76-105` | Separate system writing to `.hivemind/session-inspection/` |
| SDK hook adoption map | `src/plugin/AGENTS.md` | `text.complete` was REJECTED for streaming use case but ADOPTED for diagnostic export |

---

### 8. Verification Checklist for hivemaker

Before implementation is considered complete, verify:

- [ ] Canonical module path chosen and documented (`src/features/event-tracker/` or other)
- [ ] `shared/paths.ts` updated with `getEventLogPath()` and `getEventLogSessionPath()`
- [ ] `text-complete-handler.ts` implemented and wired to `experimental.text.complete`
- [ ] Migration plan executed: existing `.hivemind/error-log/` parsed into new structure
- [ ] `writeDiagnosticLog()` in `sdk-supervisor/diagnostic-log.ts` either removed or replaced
- [ ] `session-inspection.ts` purpose clarified: event-tracker replaces it OR they coexist with different purposes
- [ ] `npx tsc --noEmit` passes
- [ ] Integration tests verify per-session files created on new session

---

### 9. Open Questions (Require User Authorization)

1. **Should `session-inspection/` be migrated into event-tracker or remain separate?**
   - Current: `session-inspection/` serves purification-command pipeline
   - Event-tracker: Human-readable session journal

2. **Which naming: `event-tracker` or `session-journal`?**
   - Event-tracker doc: Focus on diagnostic logging
   - Synthesized design: Focus on session journaling

3. **Delete or archive existing `.hivemind/error-log/`?**
   - Event-tracker design recommends delete after migration

---

**Validation Status:** COMPLETE with BLOCKED routes. The design is structurally sound but requires resolution of naming conflict, module path alignment, and migration clarity before hivemaker can implement.