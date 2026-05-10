# Phase CP-ST-01: Session Tracker Revamp - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the broken event tracker (`src/task-management/journal/event-tracker/`) with a clean session tracker module (`src/features/session-tracker/`) that captures hierarchical, searchable, agent-reconsumable session knowledge files under `.hivemind/session-tracker/`. The tracker uses OpenCode SDK hooks for real-time capture and REST API for disconnection recovery. It produces one subdir per main session containing a primary .md knowledge file, child .json delegation files, and dual continuity indices.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**13 requirements are locked.** See `01-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `01-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- New session tracker module under `src/features/session-tracker/` (owning typed module)
- Hook integration via existing `createCoreHooks()` observer pipeline
- File structure: `.hivemind/session-tracker/{main-session-id}/` with MD + JSON outputs
- Project-level index: `.hivemind/session-tracker/project-continuity.json` (cross-session connections)
- Session-local index: `.hivemind/session-tracker/{main-session-id}/session-continuity.json` (parent-child hierarchy within session)
- Recovery/reconsumption via OpenCode SDK REST API (`client.session.*`)
- Up to 3 levels of delegation depth, up to 6 concurrent sessions
- Conservative cleanup of contaminated `.hivemind/event-tracker/` state files

**Out of scope (from SPEC.md):**
- Sidecar dashboard integration (Q2, separate project)
- SSE-based real-time streaming (plugin receives events directly via hooks)
- Changes to delegation manager, concurrency queue, or completion detector
- Changes to `.opencode/` primitives
- Removal of old event-tracker module code (kept as safety net)

</spec_lock>

<decisions>
## Implementation Decisions

### Hook Wiring
- **D-01: Deps injection pattern.** SessionTracker receives callbacks via constructor. `createCoreHooks()` passes them as hook deps. `plugin.ts` adds one instantiation line. Matches existing DelegationManager wiring pattern. Avoids bloating plugin.ts (already 447 LOC).

### Tool Surface
- **D-02: Single extensible session-tracker tool + TODO for expansion.** Start with one tool per CUSTOM-TOOLS-CRITERIA (C2: Governance & State). Designed for extensibility from day one. TODO recorded for future expansion into hierarchy context retrieval toolset connecting to doc-intelligence, agent classifications, and coordination realms.

### Write Safety
- **D-03: Atomic rename + serialize queue.** All file writes use write-to-temp + `fs.rename()`. Index files use a promise-chain queue so only one write is in-flight at a time. No external dependencies. Crash-safe by design.

### MD Update Pattern + Child Session Recognition
- **D-04: Append-per-event with task-tool as authoritative delegation signal.**
  - Each hook event (chat.message, tool.execute.after) appends to the main session .md immediately. Combined with D-03's atomic rename, each append is crash-safe.
  - The `task` tool output provides the child session ID directly — no separate parent-check needed. When `tool.execute.after` fires with `tool === "task"`, the output `task_id` IS the child session ID.
  - Root session recognition: `session.created` event + one `client.session.get()` call to check `parentID === null` → creates subdir.
  - No complex parent-resolution caches. Clean, direct logic.
  - Main session .md grows incrementally. No batching, no accumulation-then-write.

### Recovery Trigger Timing
- **D-05: No separate recovery — hook flow IS recovery.**
  - On plugin load: read `project-continuity.json` to discover existing sessions and build session map. This is initialization, not recovery.
  - When a user resumes a main session, `chat.message` fires and the tracker appends to the existing .md. Normal hook flow handles it.
  - Child session disconnection: tracker marks child `.json` with `status: "error"` via `session.error` or `session.deleted` event. The parent's task loop handles re-dispatch.
  - No explicit recovery action needed — the hook pipeline naturally resumes.

### Agent's Discretion
- Exact internal module structure within `src/features/session-tracker/` is up to the planner/researcher as long as it follows the SPEC.md placement guide (Section 9).
- Exact field naming for internal schemas (beyond what SPEC.md specifies) is up to the implementer following camelCase convention per REQ-ST-12.
- Error handling granularity for hook callbacks (log-and-continue vs structured error tracking) is up to the implementer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Specification
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked requirements (13 REQs), architecture, file formats, SDK API surface, acceptance matrix. MUST read before planning.

### Architecture & Governance
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph. Hooks must NOT directly write to `.hivemind/` — route through typed owning module.
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract, L0-L3 hierarchy.
- `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 8 criteria for custom tool design (discoverability, determinism, composability, granularity, schema validation, non-conflict, ergonomics, purpose-driven design). Tool classification matrix.

### Audit Evidence
- `.hivemind/audit/flaw-register-2026-05-10.json` — 12 flaws (F1-F12) with file:line evidence that the new module must resolve.
- `.hivemind/audit/state-persistence-audit-2026-05-10.md` — Source+state inventory of existing event tracker.

### Reference Implementation
- `session-ses_1ed9.md` — 7321-line manual export showing exact capture format, field hierarchy, actor transforms, and pruning rules the user expects.

### User Intent
- `.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md` — User's original specification (116 lines) with detailed capture rules.

### SDK Reference
- `node_modules/@opencode-ai/plugin/dist/index.d.ts` — Installed SDK types. Hooks interface: `event`, `chat.message`, `tool.execute.after` all provide `sessionID` but NOT `parentID`. Must use `client.session.get()` for parent resolution.

### Prior Phase Contexts (pattern reference)
- `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-CONTEXT.md` — Prior CONTEXT.md for format/structure reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/index.ts` — `createCoreHooks()` observer pipeline. Session tracker hooks attach here via deps injection (same pattern as DelegationManager).
- `src/shared/session-api.ts` — SDK wrapper functions. Session tracker reuses `client.session.get()`, `client.session.list()` for session metadata.
- `src/shared/tool-response.ts` — Standard response wrapper for tool results.
- `src/plugin.ts` lines 44, 110-113 — Current event-tracker wiring location. Session tracker replaces this with one instantiation line.

### Established Patterns
- **Deps injection in hooks:** DelegationManager receives SDK client via constructor, hooks call its methods. Session tracker follows the same pattern.
- **Atomic file writes:** Existing harness modules use write-to-temp patterns. Session tracker formalizes this with `fs.rename()`.
- **Feature module structure:** `src/features/` modules own their persistence logic. No direct filesystem writes from hooks (REQ-ST-11).

### Integration Points
- `src/hooks/index.ts` — Hook registration point. Session tracker's hooks attach via deps injection into `createCoreHooks()`.
- `src/plugin.ts` — Plugin composition root. One new line to instantiate SessionTracker and pass to hooks.
- `src/shared/types.ts` — Shared type definitions. New session tracker types may be added here.
- `.hivemind/session-tracker/` — New persistence root. Must NOT write to `.hivemind/event-tracker/` (legacy).

</code_context>

<specifics>
## Specific Ideas

- User emphasized: "do not over engineer" — clean, direct logic. The task tool output IS the delegation signal. No complex parent-resolution caches needed.
- User specified: main session .md files use YAML frontmatter + Markdown content. Child sessions use JSON only. No XML/YAML for child files.
- User specified: "as long as the main session of this is on going the following captured parts appended and the updated time updated" — append-per-event, no batching.
- User specified: up to 6 concurrent sessions (parent + children). Must be write-isolated.
- User specified: capture rules are selective — skip thinking blocks, prune tool output to metadata only, transform `##USER` in child sessions to `main_l0_agent`.
- User specified: child session recognition is critical — when OpenCode's `task` tool creates a new session, it fires `session.created` as a separate session. The tracker must recognize it as a child (not a new root) and write to `.json` under the parent's subdir.

</specifics>

<deferred>
## Deferred Ideas

- **Hierarchy context retrieval toolset** — Expansion of session-tracker tool into a family of tools connecting to doc-intelligence, agent classifications, and coordination realms. This is a TODO for a future phase. The current tool must be designed for extensibility.
- **Sidecar dashboard integration** (Q2) — Out of scope. The session tracker produces files that the sidecar CAN read, but no sidecar-specific code.
- **Real-time SSE streaming** — Out of scope. Plugin receives events directly via hooks, not via HTTP.

</deferred>

---

*Phase: CP-ST-01-Session Tracker Revamp*
*Context gathered: 2026-05-11*
