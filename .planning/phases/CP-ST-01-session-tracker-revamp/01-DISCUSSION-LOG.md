# Phase CP-ST-01: Session Tracker Revamp - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** CP-ST-01-Session Tracker Revamp
**Areas discussed:** Hook Wiring, Tool Surface, Write Safety, MD Update + Child Recognition, Recovery Timing

---

## D-01: Hook Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Deps injection | SessionTracker receives callbacks via constructor, createCoreHooks() passes as hook deps, plugin.ts adds one line | ✓ |
| Direct hook registration | SessionTracker registers its own hooks directly in plugin.ts | |
| Observer pattern | Hooks emit events, SessionTracker subscribes to an event bus | |

**User's choice:** Deps injection (matches existing DelegationManager pattern)
**Notes:** Avoids bloating plugin.ts (already 447 LOC). One-line addition to plugin.ts to instantiate SessionTracker and pass to createCoreHooks().

---

## D-02: Tool Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Single extensible tool | One session-tracker tool per CUSTOM-TOOLS-CRITERIA, designed for extensibility | ✓ |
| Multi-tool family | Separate tools for read, write, recover, query | |
| Tool + MCP server | session-tracker tool plus MCP server for sidecar access | |

**User's choice:** Single extensible tool + TODO for future expansion
**Notes:** Follows CUSTOM-TOOLS-CRITERIA-2026-05-05.md (8 criteria). Seed for broader context retrieval toolset. Must be designed for extensibility from day one. Falls under C2 (Governance & State) initially with expansion toward C1 (Coordination) and C3 (Inspection).

---

## D-03: Write Safety

| Option | Description | Selected |
|--------|-------------|----------|
| Atomic rename + serialize queue | write-to-temp + fs.rename() for all files, promise-chain queue for index files | ✓ |
| File locking (flock) | Use file locks for concurrent access | |
| Append-only log | Write-only append, compact periodically | |

**User's choice:** Atomic rename + serialize queue
**Notes:** No external dependencies. Crash-safe by design. Promise-chain queue ensures only one index write in-flight at a time. All file writes go through temp + rename.

---

## D-04: MD Update Pattern + Child Session Recognition

| Option | Description | Selected |
|--------|-------------|----------|
| Append per event | Each hook event appends to .md immediately. Task tool output provides child ID directly. | ✓ |
| Batch + flush timer | Buffer events, flush every N seconds | |
| Accumulate + write on end | Build in-memory model, write on session end | |

| Parent Resolution | | |
| Cache on first sight | One client.session.get() on session.created, cache in Map | ✓ (simplified) |
| Lazy check per event | Each hook event calls client.session.get() | |
| Pre-seed from session.list() | On plugin load, call session.list() for all relationships | |

**User's choice:** Clean, non-over-engineered logic. Task tool is the authoritative delegation signal. Append-per-event. No complex parent-resolution caches.
**Notes:** User emphasized: "go for a cleaned logics and do not over engineer the root indexing should immediately write these as task-tool correctly spawn the session with returned id." The task tool output contains the child session ID — that IS the delegation relationship. session.created + one client.session.get() for root recognition only.

---

## D-05: Recovery Trigger Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Hook flow IS recovery | No separate recovery. On plugin load read project-continuity.json. Hook events naturally resume. | ✓ |
| On first hook event | Lazy recovery when first event fires | |
| Explicit tool call only | Recovery only when session-tracker tool called with 'recover' action | |

**User's choice:** Hook flow IS recovery. No separate recovery trigger.
**Notes:** User specified two paths: (1) Main session: user sends next message → chat.message hook fires → tracker appends to existing .md. (2) Child session: disconnection = ERROR → tracker marks child .json as errored → parent task loop handles re-dispatch. On plugin load: read project-continuity.json for session map (initialization, not recovery).

---

## Agent's Discretion

- Internal module structure within `src/features/session-tracker/` (planner/researcher decides)
- Exact field naming for internal schemas beyond SPEC.md specification
- Error handling granularity for hook callbacks

## Deferred Ideas

- Hierarchy context retrieval toolset (future phase)
- Sidecar dashboard integration (Q2, separate project)
- Real-time SSE streaming (out of scope — hooks provide events directly)
