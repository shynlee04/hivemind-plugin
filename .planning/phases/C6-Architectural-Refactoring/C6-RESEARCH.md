# Phase C6: Architectural Refactoring (Concern-Remediation Phase) - Research

**Researched:** 2026-05-28
**Domain:** Internal refactoring — session-tracker decomposition, delegation-status persistence abstraction, plugin.ts modularization
**Confidence:** HIGH

## Summary

This phase addresses three architectural fragility concerns (6.1–6.3) identified in CONCERNS.md. All three are internal refactoring targets — no new external packages required. The work reduces coupling, improves testability, and lowers merge conflict risk by decomposing monolithic modules into focused units with clear interfaces.

**Primary recommendation:** Extract event handlers into handler classes, introduce a `DelegationStatusReader` interface with Zod-validated format readers, and group plugin.ts tool registrations by domain into separate `registerXxxTools()` functions.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session lifecycle event handling | `src/features/session-tracker/capture/` | `src/hooks/` (event observers) | EventCapture owns routing; hooks observe and delegate |
| Child session persistence | `src/features/session-tracker/persistence/child-writer.ts` | `event-capture.ts` (calls childWriter) | child-writer owns JSON file I/O; event-capture owns lifecycle decisions |
| Delegation status reads | `src/tools/delegation/delegation-status.ts` | `src/features/session-tracker/persistence/hierarchy-manifest.ts` | Tool is the public surface; hierarchy-manifest is the new persistence format |
| Plugin composition wiring | `src/plugin.ts` | Domain-specific `registerXxxTools()` (new) | Composition root owns initialization order; domain functions own registration |

## Standard Stack

### Core (no new packages — pure internal refactoring)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `^4.4.3` | Schema validation for dual persistence formats | Already a project dependency; validates at boundaries |

### Supporting (existing project infrastructure)

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `src/shared/tool-response.ts` | Standard response envelope | All tool output rendering |
| `src/features/session-tracker/types.ts` | `HierarchyManifest`, `ChildSessionRecord` types | Type contracts for persistence formats |
| `src/shared/types.ts` | `Delegation`, `DelegationStatus` types | Type contracts for delegation records |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Handler class extraction | Keep as private methods | No improvement in testability; LOC stays over capacity |
| `DelegationStatusReader` interface | Keep `as any` casts | Silent type errors; no boundary validation |
| Domain-grouped registration | Keep monolithic tool object | Higher merge conflict risk; no separation of concerns |

## Package Legitimacy Audit

> No new external packages installed in this phase. All work uses existing project dependencies (`zod`, `vitest`).

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### Pattern 1: Event Handler Extraction (6.1)

**What:** Extract `handleSessionCreated`, `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError`, `handleSessionCompacted`, `handleSessionNextTextEnded` from `EventCapture` into dedicated handler classes.

**When to use:** Each handler has 100+ LOC, multiple `await` calls, and separate error handling — classic god method.

**Example structure:**
```typescript
// src/features/session-tracker/capture/handlers/session-idle-handler.ts
export class SessionIdleHandler {
  constructor(
    private readonly client: OpenCodeClient,
    private readonly sessionWriter: SessionWriter,
    private readonly childWriter: ChildWriter,
    private readonly sessionIndexWriter: SessionIndexWriter,
    private readonly manifestWriter: HierarchyManifestWriter | undefined,
    private readonly backfiller: ChildBackfiller,
    private readonly lastMessageCapture: LastMessageCapture | undefined,
    private readonly assistantTurnCounters: Map<string, number>,
  ) {}

  async handle(sessionID: string): Promise<void> {
    // ... extracted from event-capture.ts:316-437
  }
}
```

**EventCapture becomes a thin router:**
```typescript
// src/features/session-tracker/capture/event-capture.ts
export class EventCapture {
  private handlers: Record<string, (sessionID: string, event?: Record<string, unknown>) => Promise<void>>

  constructor(deps: EventCaptureDeps) {
    this.handlers = {
      "session.created": new SessionCreatedHandler(deps).handle,
      "session.idle": new SessionIdleHandler(deps).handle,
      "session.deleted": new SessionDeletedHandler(deps).handle,
      "session.error": new SessionErrorHandler(deps).handle,
      "session.compacted": new SessionCompactedHandler(deps).handle,
      "session.next.text.ended": new SessionNextTextEndedHandler(deps).handle,
    }
  }

  async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void> {
    const handler = this.handlers[event.eventType]
    if (handler) await handler(event.sessionID, event.event as Record<string, unknown>)
  }
}
```

### Pattern 2: DelegationStatusReader Interface (6.2)

**What:** Abstract the two persistence formats behind a common interface.

**When to use:** Tool reads from both `hierarchy-manifest.json` (new) and `delegations.json` (legacy), with `as any` casts.

**Example structure:**
```typescript
// src/tools/delegation/readers/delegation-status-reader.ts
import { z } from "zod"

/** Zod schema for hierarchy-manifest.json children entries. */
export const HierarchyManifestChildSchema = z.object({
  parentSessionID: z.string(),
  status: z.string(),
  subagentType: z.string().optional(),
  delegationDepth: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  childFile: z.string().optional(),
})

/** Zod schema for legacy delegations.json entries. */
export const LegacyDelegationRecordSchema = z.object({
  id: z.string(),
  parentSessionId: z.string().optional(),
  childSessionId: z.string().optional(),
  agent: z.string().optional(),
  status: z.string(),
  createdAt: z.number().optional(),
  completedAt: z.number().optional(),
})

export interface DelegationStatusReader {
  readChildren(parentSessionId: string): Promise<Delegation[]>
  readDelegation(delegationId: string): Promise<Delegation | null>
}

export class SessionTrackerStatusReader implements DelegationStatusReader {
  async readChildren(parentSessionId: string): Promise<Delegation[]> {
    // Read from hierarchy-manifest.json, validate with HierarchyManifestChildSchema
  }
  async readDelegation(delegationId: string): Promise<Delegation | null> {
    // Read from hierarchy-manifest.json
  }
}

export class LegacyPersistenceStatusReader implements DelegationStatusReader {
  async readChildren(parentSessionId: string): Promise<Delegation[]> {
    // Read from delegations.json, validate with LegacyDelegationRecordSchema
  }
  async readDelegation(delegationId: string): Promise<Delegation | null> {
    // Read from delegations.json
  }
}
```

### Pattern 3: Domain-Grouped Tool Registration (6.3)

**What:** Group tool registrations in plugin.ts by domain into separate functions.

**When to use:** plugin.ts imports 60+ modules and has a flat tool registration block.

**Example structure:**
```typescript
// src/plugin.ts — extracted functions
function registerDelegationTools(deps: DelegationToolDeps) {
  return {
    "delegate-task": createDelegateTaskTool(deps.delegationManager, deps.hivemindConfig),
    "delegation-status": createDelegationStatusTool(deps.delegationManager, {
      getChildMessageCount: deps.getChildMessageCount,
      terminateChild: deps.terminateChild,
      getEscalationLevel: deps.getEscalationLevel,
      projectRoot: deps.projectRoot,
    }),
    "run-background-command": createRunBackgroundCommandTool({ delegationManager: deps.delegationManager, ptyManager: deps.ptyManager }),
  }
}

function registerSessionTools(deps: SessionToolDeps) {
  return {
    "execute-slash-command": createExecuteSlashCommandTool(deps.client, deps.sessionTracker),
    "session-patch": createSessionPatchTool(deps.projectRoot),
    "session-journal-export": createSessionJournalExportTool(),
    "session-tracker": createSessionTrackerTool(deps.projectRoot),
    "session-hierarchy": createSessionHierarchyTool(deps.projectRoot),
    "session-context": createSessionContextTool(deps.projectRoot),
  }
}

function registerHivemindTools(deps: HivemindToolDeps) {
  return {
    "hivemind-doc": createHivemindDocTool(deps.projectRoot),
    "hivemind-trajectory": createHivemindTrajectoryTool(deps.projectRoot),
    // ... etc
  }
}

function registerConfigTools() {
  return {
    "configure-primitive": createConfigurePrimitiveTool(),
    "validate-restart": createValidateRestartTool(),
    "bootstrap-init": createBootstrapInitTool(),
    "bootstrap-recover": createBootstrapRecoverTool(),
  }
}
```

### Anti-Patterns to Avoid

- **God method in EventCapture:** Each handler should be ≤200 LOC. If a handler exceeds this, split further (e.g., `handleSessionIdle` → child routing + main session update + lastMessage capture).
- **`as any` casts at persistence boundary:** Always validate with Zod before casting. The `child as HierarchyManifestChild` pattern (delegation-status.ts:201, 291, 304, 317) is exactly what Zod schemas should replace.
- **Mega `deps` object in plugin.ts:** The current `deps` object (line 377) has 12+ properties. Split into domain-specific sub-objects (`delegationDeps`, `sessionDeps`, `hivemindDeps`).
- **Initialization order fragility:** The comment at line 326-327 of plugin.ts documents that `delegationManager.setCompletionDetector` must happen after lifecycle manager creation. Domain-grouped functions should document their ordering constraints explicitly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON format validation | Manual property checks | Zod schemas | Runtime validation + type inference |
| Event routing | Custom middleware chain | Simple `Record<string, Handler>` map | 6 event types don't need middleware complexity |
| Interface abstraction | `as any` type assertions | TypeScript interface + implementations | Compile-time safety + testability |

## Common Pitfalls

### Pitfall 1: Breaking handler shared state during extraction
**What goes wrong:** `assistantTurnCounters` (Map<string, number>) is shared across handlers in EventCapture. Extracting handlers without sharing this state breaks turn counting.
**Why it happens:** The Map is a class field, not a constructor param.
**How to avoid:** Pass `assistantTurnCounters` as a constructor parameter to each handler, or extract it into a shared `TurnCounterService`.
**Warning signs:** Tests showing wrong `turnNumber` values after handler extraction.

### Pitfall 2: Zod schema drift from actual persistence format
**What goes wrong:** The Zod schema for `hierarchy-manifest.json` doesn't match the actual JSON shape written by `HierarchyManifestWriter`.
**Why it happens:** The writer and schema are defined in different files.
**How to avoid:** Add a roundtrip test: write a manifest → read it back through the Zod schema → assert equality.
**Warning signs:** `ZodError` at runtime when reading manifests written by the current code.

### Pitfall 3: plugin.ts initialization order breaks
**What goes wrong:** Extracting tool registration into domain functions changes the order of side effects (e.g., `delegationManager.recoverPending()` must run after delegation module setup).
**Why it happens:** Some initialization has implicit ordering dependencies not enforced by types.
**How to avoid:** Keep side-effecting calls (recoverPending, sessionTracker.initialize) in the main composition root. Only extract pure tool registration into domain functions.
**Warning signs:** "recoverPending" or "hydrateFromContinuity" errors at plugin startup.

### Pitfall 4: Child writer retry queue coupling
**What goes wrong:** Event handlers call `childWriter.enqueueWrite()` which has retry logic. Extracting handlers without understanding the retry queue contract causes silent data loss.
**Why it happens:** The retry queue is a shared singleton; handlers assume it exists.
**How to avoid:** Verify that `ChildWriter` is injected (not created per-handler) and that retry queue lifecycle is managed at the composition root level.
**Warning signs:** `.hivemind/session-tracker/` files missing after handler extraction.

## Code Examples

### Extracted handler with shared deps

```typescript
// Source: Pattern from src/features/session-tracker/capture/event-capture.ts:316-437
// Extracted into: src/features/session-tracker/capture/handlers/session-idle-handler.ts

import type { OpenCodeClient } from "../../../../shared/session-api.js"
import type { SessionWriter } from "../../persistence/session-writer.js"
import type { ChildWriter } from "../../persistence/child-writer.js"
import type { SessionIndexWriter } from "../../persistence/session-index-writer.js"
import type { HierarchyManifestWriter } from "../../persistence/hierarchy-manifest.js"
import { ChildBackfiller } from "../child-backfiller.js"
import type { LastMessageCapture } from "../last-message-capture.js"
import { getSessionMessages } from "../../../../shared/session-api.js"

interface SessionIdleHandlerDeps {
  client: OpenCodeClient
  sessionWriter: SessionWriter
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  manifestWriter?: HierarchyManifestWriter
  backfiller: ChildBackfiller
  lastMessageCapture?: LastMessageCapture
  assistantTurnCounters: Map<string, number>
}

export class SessionIdleHandler {
  constructor(private readonly deps: SessionIdleHandlerDeps) {}

  async handle(sessionID: string): Promise<void> {
    try {
      const childRoute = await this.resolveChildLifecycleRoute(sessionID)
      if (childRoute) {
        if (!(await this.deps.childWriter.childFileExists(childRoute.parentID, sessionID))) return
        await this.deps.childWriter.updateChildStatus(childRoute.parentID, sessionID, "completed")
        await this.deps.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        if (this.deps.manifestWriter) {
          await this.deps.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        }
        await this.deps.backfiller.backfillChildTurnsFromSdk(childRoute.parentID, sessionID).catch(() => {})
        return
      }
      // ... main session path
    } catch (err) {
      // best-effort logging
    }
  }
}
```

### Zod-validated persistence reader

```typescript
// Source: Pattern from src/tools/delegation/delegation-status.ts:170-231
// Refactored into: src/tools/delegation/readers/session-tracker-reader.ts

import { z } from "zod"
import { readFile } from "node:fs/promises"
import { safeSessionPath } from "../../../features/session-tracker/persistence/atomic-write.js"
import type { HierarchyManifest } from "../../../features/session-tracker/types.js"
import type { Delegation } from "../../../shared/types.js"

const HierarchyChildSchema = z.object({
  parentSessionID: z.string(),
  status: z.string(),
  subagentType: z.string().optional(),
  delegationDepth: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export class SessionTrackerStatusReader {
  async readManifest(projectRoot: string, rootSessionId: string): Promise<HierarchyManifest> {
    const path = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
    const raw = await readFile(path, "utf-8")
    const parsed = JSON.parse(raw)
    // Validate children entries at the boundary
    if (parsed.children) {
      for (const [id, child] of Object.entries(parsed.children)) {
        HierarchyChildSchema.parse(child) // throws on invalid shape
      }
    }
    return parsed as HierarchyManifest
  }
}
```

### Domain-grouped tool registration

```typescript
// Source: Pattern from src/plugin.ts:456-486
// Extracted into domain functions

type ToolDeps = {
  delegationManager: DelegationManager
  hivemindConfig: HivemindConfigs
  client: OpenCodeClient
  projectRoot: string
  ptyManager: ReturnType<typeof createPtyManagerIfSupported>
  sessionTracker: SessionTracker
  getChildMessageCount: (sessionId: string) => Promise<number | null>
  terminateChild: (sessionId: string) => Promise<unknown>
  getEscalationLevel: (id: string) => string | null
}

function registerDelegationTools(deps: ToolDeps) {
  return {
    "delegate-task": createDelegateTaskTool(deps.delegationManager, deps.hivemindConfig),
    "delegation-status": createDelegationStatusTool(deps.delegationManager, {
      getChildMessageCount: deps.getChildMessageCount,
      terminateChild: deps.terminateChild,
      getEscalationLevel: deps.getEscalationLevel,
      projectRoot: deps.projectRoot,
    }),
    "run-background-command": createRunBackgroundCommandTool({
      delegationManager: deps.delegationManager,
      ptyManager: deps.ptyManager,
    }),
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic EventCapture class (1050 LOC) | Handler extraction into dedicated classes | Phase C6 (this) | Each handler ≤200 LOC; EventCapture becomes router |
| `as any` casts for persistence formats | Zod-validated boundary reading | Phase C6 (this) | Runtime validation; no silent type errors |
| Flat 60+ import plugin.ts (554 LOC) | Domain-grouped `registerXxxTools()` | Phase C6 (this) | ≤150 LOC per domain group; lower merge conflict risk |

**Deprecated/outdated:**
- `as any` casts in delegation-status.ts (lines 144, 157, 201, 208, 219, 291, 304, 317) — replaced by Zod validation
- `child as HierarchyManifestChild` pattern — replaced by `HierarchyChildSchema.parse(child)`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No new external packages needed for this phase | Standard Stack | LOW — all work uses existing `zod` + internal modules |
| A2 | Zod v4 is compatible with the project's TypeScript strict mode | Standard Stack | LOW — already used in `src/schema-kernel/` |
| A3 | The `assistantTurnCounters` Map can be shared across extracted handlers | Common Pitfalls #1 | MEDIUM — if handlers need per-handler counters, extraction approach changes |
| A4 | `HierarchyManifestWriter` interface is stable enough to schema-validate | Common Pitfalls #2 | MEDIUM — if writer changes shape frequently, schema maintenance burden increases |
| A5 | Initialization order in plugin.ts is fully documented in comments | Common Pitfalls #3 | LOW — comments at lines 326-327 and 303-304 document ordering constraints |

## Open Questions

1. **Handler granularity for `handleSessionCreated`**
   - What we know: This method has 3 gates (pending dispatch, SDK parentID, hierarchy index) and creates both root directories and child .json files — ~120 LOC.
   - What's unclear: Whether to split into `SessionCreatedChildHandler` and `SessionCreatedRootHandler` or keep as one handler.
   - Recommendation: Keep as single handler for now. The gate logic is tightly coupled and splitting would require re-injecting shared state.

2. **Legacy format deprecation timeline for `delegations.json`**
   - What we know: `delegation-status.ts` reads from both formats via `mergeAllDelegations()`.
   - What's unclear: When `delegations.json` will be fully replaced by `hierarchy-manifest.json`.
   - Recommendation: Keep `LegacyPersistenceStatusReader` behind a feature flag. Add a `LEGACY_FORMAT_DEPRECATED` log warning.

3. **Test coverage for extracted handlers**
   - What we know: Current session-tracker tests are sparse (CONCERNS.md §7).
   - What's unclear: Whether handler extraction should include new unit tests per handler.
   - Recommendation: Yes — each handler gets a focused unit test file. This is the ideal time to add coverage since the handlers are being isolated.

## Environment Availability

> SKIPPED — no external dependencies. Pure internal refactoring.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.7 |
| Config file | none (vitest auto-discovers) |
| Quick run command | `npx vitest run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| C6.1-a | Event handlers extracted to separate classes | unit | `npx vitest run tests/lib/session-tracker/handlers/` | ❌ Wave 0 |
| C6.1-b | EventCapture delegates to handler classes | unit | `npx vitest run tests/lib/session-tracker/event-capture.test.ts` | ❌ Wave 0 |
| C6.2-a | Zod schemas validate hierarchy-manifest.json | unit | `npx vitest run tests/lib/delegation/readers/` | ❌ Wave 0 |
| C6.2-b | Zod schemas validate delegations.json | unit | `npx vitest run tests/lib/delegation/readers/` | ❌ Wave 0 |
| C6.2-c | `DelegationStatusReader` interface contract | unit | `npx vitest run tests/lib/delegation/readers/` | ❌ Wave 0 |
| C6.3-a | Domain-grouped registration produces correct tool map | unit | `npx vitest run tests/lib/plugin-tools.test.ts` | ❌ Wave 0 |
| C6.3-b | `deps` object split into domain sub-objects | typecheck | `npm run typecheck` | ✅ existing |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/session-tracker/handlers/session-idle-handler.test.ts` — covers C6.1-a
- [ ] `tests/lib/session-tracker/handlers/session-created-handler.test.ts` — covers C6.1-a
- [ ] `tests/lib/session-tracker/handlers/session-deleted-handler.test.ts` — covers C6.1-a
- [ ] `tests/lib/session-tracker/handlers/session-error-handler.test.ts` — covers C6.1-a
- [ ] `tests/lib/delegation/readers/session-tracker-reader.test.ts` — covers C6.2-a
- [ ] `tests/lib/delegation/readers/legacy-reader.test.ts` — covers C6.2-b
- [ ] `tests/lib/delegation/readers/delegation-status-reader.test.ts` — covers C6.2-c
- [ ] `tests/lib/plugin-tools.test.ts` — covers C6.3-a

## Security Domain

> Omit — this phase involves no new external surfaces, input handling, auth, or data access patterns. All changes are internal refactoring of existing code paths.

## Project Constraints (from AGENTS.md)

- **CQRS compliance:** hooks must NEVER write files directly (REQ-ST-11). Event handlers may call persistence writers but the hook layer itself must remain read-only.
- **500 LOC max per module:** extracted handler files must each stay ≤500 LOC.
- **Atomic commits:** each extraction (per concern) should be its own commit.
- **Type-check before commit:** `npm run typecheck` must pass after each extraction.
- **No circular dependencies:** handler classes must not import from `src/plugin.ts` or other feature modules outside `session-tracker/`.
- **`[Harness]` prefix on errors:** all thrown errors must use the `[Harness]` prefix convention.

## Sources

### Primary (HIGH confidence)
- [CITED: .planning/codebase/CONCERNS.md:244-266] — concerns 6.1-6.3 definitions and improvement guidance
- [CITED: .planning/ROADMAP.md:1562] — C6 phase definition and UAT criteria
- [CITED: .planning/codebase/ARCHITECTURE.md:1-80] — layered architecture, CQRS pattern, component boundaries
- [VERIFIED: src/features/session-tracker/capture/event-capture.ts:1-1050] — god module structure, handler methods, shared deps
- [VERIFIED: src/tools/delegation/delegation-status.ts:1-709] — dual format reading, `as any` casts (11 instances)
- [VERIFIED: src/plugin.ts:1-554] — 60+ imports, flat tool registration, deps mega-object

### Secondary (MEDIUM confidence)
- [CITED: src/features/session-tracker/persistence/child-writer.ts:1-658] — shared child writer, retry queue coupling
- [CITED: src/features/session-tracker/index.ts:1-625] — SessionTracker class, constructCoreDependencies pattern
- [CITED: src/task-management/continuity/delegation-persistence.ts:1-60] — legacy delegations.json format

### Tertiary (LOW confidence)
- None — all findings verified against source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; Zod already in project
- Architecture: HIGH — patterns derived from existing codebase conventions
- Pitfalls: HIGH — each pitfall documented with specific line references

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stable — internal refactoring, no external dependencies)
