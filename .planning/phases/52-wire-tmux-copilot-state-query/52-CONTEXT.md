# Phase 52: Wire tmux-copilot + State Query API - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-locked, implementation decisions only)

<domain>
## Phase Boundary

Keep the public contract of `src/tools/tmux-copilot.ts` **identical** (4 actions: send-keys, capture-pane, list-panes, kill-session; `TmuxCopilotResult` union widened in P49 pass-2 fix at L100-112). Swap only the factory: from `buildNoopForkSessionManager()` to `buildInTreeSessionManager()`. Add a new `src/tools/tmux-state-query.ts` read-only tool (no mutation) that exposes session metadata for the observability layer. Expand `src/features/tmux/observers.ts` (93 LOC) with 2 new event subscriptions: `session-state-changed` and `pane-captured`. Deliverables: **1 factory swap, 1 new tool, 1 expanded observer**. Tests: 3 BATS scenarios, 11+ vitest cases (6 state-query + 5 observer). L1 evidence: BATS 3/3, vitest 11+ pass, tsc exit 0, manual smoke test.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**4 requirements are locked.** See `52-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `52-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- `buildNoopForkSessionManager` → `buildInTreeSessionManager` rename in `plugin.ts` (function name only — no behavior change)
- `src/tools/tmux-state-query.ts` creation (read-only, 3 actions, permission-gated)
- `src/features/tmux/observers.ts` expansion (2 new event types + listener registry)
- Test suites: `tests/lib/tmux-state-query.test.ts` (6+ vitest), `tests/lib/tmux-observers.test.ts` (5+ vitest), BATS scenarios (3)

**Out of scope (from SPEC.md):**
- P53 live pane monitoring hook (`src/hooks/pane-monitor.ts`) — subscribes to expanded observer events, that is Phase 53
- Writing journal entries to `.hivemind/journal/` — that is Phase 53
- Rewriting P42 UAT.md or P43 VERIFICATION.md — that is Phase 53
- Any behavioral change to `tmux-copilot.ts` actions — contract must remain identical
- TMUX integration beyond observer events — installation, version detection, port persistence already handled by `integration.ts`

</spec_lock>

<decisions>
## Implementation Decisions

> **Auto-mode audit trail** — `--auto` selected all gray areas and auto-picked recommended defaults. See discussion log for full trace.

### State query tool schema design (REQ-52-02)
- **D-01:** Single `tmux-state-query` tool with discriminated-union Zod schema supporting 3 actions (`list-sessions`, `get-session`, `get-summary`). Matches the existing `tmux-copilot.ts` pattern (single tool, multi-action discriminated union). Do NOT create three separate tools — that fragments the permission gate and creates unnecessary registration surface.
  - `[auto] State query schema — Q: "Single discriminated-union tool or three separate tools?" → Selected: "Single tool with discriminated union" (matches tmux-copilot.ts pattern).`

### Observer listener registry (REQ-52-03)
- **D-02:** Simple callback collection — internal `Set<Listener>` per event type on the observer instance. Registration methods (`onSessionStateChanged`, `onPaneCaptured`) accept callbacks and return an unsubscribe function. Follows the existing internal callback collection pattern already used by `session.created` forwarding — no new EventEmitter dependency.
  - `[auto] Observer pattern — Q: "Simple callback collection or EventEmitter-style pattern?" → Selected: "Simple callback collection" (matches existing observer internals, zero new deps).`

### SessionManagerAdapter method for state query (REQ-52-02)
- **D-03:** Add `getTrackedSessions(): TrackedSession[]` and `getTrackedSession(id: string): TrackedSession | undefined` to the `SessionManagerAdapter` interface in `src/features/tmux/types.ts`. The state query tool reads session metadata exclusively through the adapter bridge — do NOT import `SessionManager` directly into tools (violates the bridge pattern established in P49).
  - `[auto] Session metadata access — Q: "New adapter method or direct SessionManager import?" → Selected: "New adapter method" (preserves bridge pattern per P49 D-04).`

### Tool file placement
- **D-04:** Place at `src/tools/tmux-state-query.ts` — follows the existing tool convention (`src/tools/` for plugin-registered tools, feature modules under `src/features/tmux/` for internal logic).
  - `[auto] Tool placement — Q: "src/tools/ or src/features/tmux/?" → Selected: "src/tools/tmux-state-query.ts" (matches SPEC wording and existing tool convention).`

### the agent's Discretion

The implementer has flexibility for the following details:
- Exact parameter shapes for each action branch (must match `TrackedSession` record shape from `src/features/tmux/session-manager.ts`)
- `SessionSummary` result type fields (derived from `TrackedSession` — `sessionId`, `agent`, `directory`, `spawnTime`, `paneId` are minimum)
- Observer listener type signatures (callbacks receive the event interface as single param, return void)
- Event interface field details beyond the SPEC-mandated minimums (`sessionId`, `previousState`, `currentState`, `timestamp` for `SessionStateChangedEvent`; `sessionId`, `paneId`, `contentLength`, `timestamp` for `PaneCapturedEvent`)
- BATS assertion style and vitest test organization (within the 6+ / 5+ count floors)
- Private helper naming and JSDoc depth on non-public APIs

### Folded Todos

- **`fork-opencode-tmux-audit.md`** (priority: high, match score: 0.6, auto-folded)
  - **Original concern:** Track `opencode-tmux` fork codebase audit and integration points with session-tracker/fallback strategy.
  - **How it fits P52 scope:** All integration points were resolved by phases P49-P51. The `SessionManager` from P51 now provides the `TrackedSession` metadata that P52's state query tool reads; the observer patterns from P51's `integration.ts` factory are what P52's `observers.ts` expansion builds upon. The fork-audit findings are fully consumed by this phase's implementation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/52-wire-tmux-copilot-state-query/52-SPEC.md` — Locked spec: 4 requirements, in/out-of-scope boundaries, constraints, acceptance criteria. **MUST read before planning.**
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-CONTEXT.md` — Prior-phase decisions: D-01 type co-location (shared `types.ts`), D-02 forkSessionManager parameter removal, D-03 error boundaries (`[Harness]Tmux*` prefix), D-04 ORIGIN annotation granularity, D-05 dependency order instantiation. The `SessionManager` class produced by P51 is the data source for P52's state query tool.
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-SPEC.md` — P51 contract: 7 requirements REQ-51-01..07. The `SessionManager` interface, `TrackedSession` type, and observer integration points are defined here.
- `.planning/phases/50-cleanup-opencode-tmux-fork/50-CONTEXT.md` — Prior-phase decisions: D-04 graceful-fallback contract preserved in `integration.ts`.

### Roadmap and Requirements
- `.planning/ROADMAP.md` — Phase 52 entry (1 plan, depends on P51, requires REQ-04/05)
- `.planning/PROJECT.md` — Project identity: Hivemind Runtime Composition Engine
- `.planning/REQUIREMENTS.md` — Requirement registry (path-categorized features)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — System architecture: 9-surface CQRS model, plugin composition, tools/hooks/features separation
- `.planning/codebase/STRUCTURE.md` — File placement conventions, naming, folder registration
- `.planning/codebase/STACK.md` — Tech stack: TypeScript strict, Node.js >= 20, Zod v4, vitest
- `.planning/codebase/INTEGRATIONS.md` — External integrations: file-based state, OpenCode SDK
- `.planning/codebase/CONVENTIONS.md` — Code conventions: `[Harness]` prefix, deep-clone-on-read, max 500 LOC

### Source Code
- `src/tools/tmux-copilot.ts` (235 LOC) — **MUST remain unchanged.** The 4-action pattern (send-keys, capture-pane, list-panes, kill-session) is the template for P52's state query tool.
- `src/features/tmux/observers.ts` (93 LOC) — **TO BE EXPANDED.** Current `createTmuxEventObserver` handles `session.created` only. P52 adds `TmuxEventType` union, `SessionStateChangedEvent`, `PaneCapturedEvent`, and registration methods.
- `src/features/tmux/types.ts` — **TO BE MODIFIED** (add `getTrackedSessions`/`getTrackedSession` to `SessionManagerAdapter` interface per D-03).
- `src/features/tmux/session-manager.ts` — P51's `SessionManager` class with internal `Map<string, TrackedSession>` records. The data source for state query.
- `src/plugin.ts` — **TO BE MODIFIED** (factory rename at definition site + call site; register new tool).
- `src/tools/tmux-state-query.ts` — **NEW FILE** per D-04. Read-only tool with 3 actions, discriminated-union Zod schema, orchestrator-tier permission gate, graceful fallback.
- `tests/lib/tmux-state-query.test.ts` — **NEW FILE** (6+ vitest cases)
- `tests/lib/tmux-observers.test.ts` — **NEW FILE** (5+ vitest cases)

### Project-wide Governance
- `AGENTS.md` (repo root) — Hivemind project rules: atomic commits, JSDoc on all functions, `[Harness]` prefix on errors, TypeScript strict
- `.planning/AGENTS.md` — Planning/Governance sector rules
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/tools/tmux-copilot.ts`** (235 LOC) — Reference pattern for P52's state query tool (discriminated-union Zod schema, `tool({ description, args, execute })` registration, orchestrator-tier permission gate, `{available: false}` fallback pattern).
- **`src/features/tmux/observers.ts:createTmuxEventObserver`** (93 LOC) — Target for expansion. Currently exports `EnrichedSessionEvent` type, `ForkSessionManager` interface (`onSessionCreated`), and factory. P52 adds `TmuxEventType`, `SessionStateChangedEvent`, `PaneCapturedEvent`, and `onSessionStateChanged`/`onPaneCaptured` registration methods.
- **`src/features/tmux/session-manager.ts`** — P51's `SessionManager` with `Map<string, TrackedSession>` internal store. Public methods like `listSessions()` and `getSession(id)` are the backing for P52's state query tool actions.

### Established Patterns
- **Discriminated-union tool schema** (`src/tools/tmux-copilot.ts`) — Single tool with Zod `z.discriminatedUnion('action', [...])` dispatching to action-specific handlers. P52's state query tool follows the exact same pattern.
- **Orchestrator-tier permission gate** — All tmux tools validate via: `if (!isOrchestratorAgent(input?.__agent)) return {available: false, reason: "permission-denied"}`. Applied in P52's new tool.
- **`{available: false, reason}` graceful fallback** — All tmux tools check `getSessionManagerAdapter()` before executing. When null, return `{available: false, reason: "tmux-not-wired"}`. No thrown exceptions.
- **`[Harness]` prefix on errors** — Per `AGENTS.md`. Observer methods and tool execute functions use `[Harness]` prefix for any thrown errors.
- **Adapter bridge pattern** — `setSessionManagerAdapter`/`getSessionManagerAdapter` in `types.ts` is the sole injection path. Tools never construct managers directly.

### Integration Points
- **`src/plugin.ts`** — Factory rename (L222 definition + L605-607 call site) + tool registration (new `tmux(stateQuery)` call). P49's registration pattern is the template.
- **`src/features/tmux/types.ts`** — Add `getTrackedSessions()` and `getTrackedSession(id)` to `SessionManagerAdapter` interface (D-03).
- **`src/features/tmux/session-manager.ts`** — The `SessionManager` class must implement the two new adapter methods. These delegate to its internal `Map<string, TrackedSession>`.
- **`src/features/tmux/observers.ts`** — P51's `SessionManager` already satisfies the `ForkSessionManager` interface. P52 adds the two new event types *within* `observers.ts` — expand the module, do not add a new file (matches existing pattern of observers.ts as the single observer module).

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC — open to standard approaches. The implementation follows well-established patterns from the existing `tmux-copilot.ts` tool and `observers.ts` module.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The single folded todo (`fork-opencode-tmux-audit.md`) was folded into scope rather than deferred. No other ideas surfaced that belong in a later phase.

</deferred>

---

*Phase: 52-wire-tmux-copilot-state-query*
*Context gathered: 2026-06-02*
