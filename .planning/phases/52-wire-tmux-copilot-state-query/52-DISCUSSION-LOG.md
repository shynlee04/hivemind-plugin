# Phase 52: Wire tmux-copilot + State Query API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 52-wire-tmux-copilot-state-query
**Mode:** `--auto` (fully autonomous — all decisions auto-selected per `workflows/discuss-phase/modes/auto.md`)
**Areas discussed:** State query schema design, Observer listener pattern, SessionManagerAdapter method, Tool file placement

---

## State query tool schema design (REQ-52-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Single tool with discriminated union | One `tmux-state-query` tool, `z.discriminatedUnion('action', ...)` with 3 branches (list-sessions, get-session, get-summary). Matches existing `tmux-copilot.ts` pattern. | ✓ (auto) |
| Three separate tools | Independent tools per action. Fragments permission gate and registration surface. | |

**Auto-selected:** Single tool with discriminated union (recommended default — matches tmux-copilot.ts pattern).
**Rationale:** Consistency with existing tool pattern; single permission gate; single registration point in plugin.ts.

---

## Observer listener registry pattern (REQ-52-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Simple callback collection | Internal `Set<Listener>` per event type. Registration returns unsubscribe function. Matches existing observer internals. | ✓ (auto) |
| EventEmitter-style | Add `emit`/`on`/`off` with EventEmitter pattern. Requires new dependency or custom implementation. | |

**Auto-selected:** Simple callback collection (recommended default — zero new dependencies, matches existing pattern).
**Rationale:** Only 2 new event types; full EventEmitter is over-engineered. Simple callbacks match how `session.created` already works internally.

---

## SessionManagerAdapter method for state query (REQ-52-02)

| Option | Description | Selected |
|--------|-------------|----------|
| New adapter methods | Add `getTrackedSessions()` and `getTrackedSession(id)` to `SessionManagerAdapter` interface. | ✓ (auto) |
| Direct SessionManager import | Import SessionManager into tools directly, bypassing adapter bridge. | |

**Auto-selected:** New adapter methods (recommended default — preserves bridge pattern per P49 D-04).
**Rationale:** The adapter bridge (`setSessionManagerAdapter`/`getSessionManagerAdapter` in `types.ts`) is the sole injection path for all tmux features. Direct import would violate this established contract.

---

## Tool file placement

| Option | Description | Selected |
|--------|-------------|----------|
| `src/tools/tmux-state-query.ts` | Matches existing `src/tools/tmux-copilot.ts` convention. | ✓ (auto) |
| `src/features/tmux/tmux-state-query.ts` | Placed alongside feature implementation. | |

**Auto-selected:** `src/tools/tmux-state-query.ts` (recommended default — matches SPEC wording and tool convention).
**Rationale:** All plugin-registered tools live in `src/tools/`. Feature modules live in `src/features/`. This tool is registered in `plugin.ts` alongside `tmux-copilot`, so it goes in `src/tools/`.

---

## Folded Todos (auto-folded, score >= 0.4)

- **`fork-opencode-tmux-audit.md`** (score 0.6) — Integrated into scope. The audit's findings about session manager integration points and fallback strategy are consumed by P52's state query tool and observer expansion.

## Pre-existing Context Carried Forward

- P51 decisions D-01 through D-07 (instantiation order, type co-location, error boundaries, ORIGIN annotations) constrain P52 implementation
- P50 D-04 graceful-fallback contract (no tmux binary → return null from factory)
- SPEC.md 4 locked requirements (REQ-52-01 through REQ-52-04)

## the agent's Discretion

- Exact parameter shapes for state query action branches
- `SessionSummary` field composition beyond minimums
- Observer listener type signatures
- Event interface field details beyond SPEC-mandated minimums
- BATS assertion style and vitest organization
- Private helper naming and JSDoc depth

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Log generated: 2026-06-02*
