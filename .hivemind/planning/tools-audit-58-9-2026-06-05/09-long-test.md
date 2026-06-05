[LANGUAGE: Write this file in en per Language Governance.]
# Long-Form Tool Audit — 9 files (`src/tools/`)
**Date:** 2026-06-05  
**Phase:** 58.9 UAT (tmux priority)  
**Auditor:** hm-codebase-mapper  
**Scope:** `src/tools/session/{session-tracker, session-hierarchy, session-context, session-delegation-query}.ts`, `src/tools/hivemind/hivemind-session-view.ts`, `src/tools/{tmux-copilot, tmux-state-query}.ts`, `src/tools/delegation/{delegate-task, delegation-status}.ts`

> **Section ordering (per P58.9 UAT steer):** Section 1 is the tmux-copilot pair, the focus of the live UAT. Sections 2-9 cover the remaining 7 tools. The Cross-Tool Overlap Matrix is appended at the end.

---

## Section 1 — `tmux-copilot.ts` (PRIORITY: P58.9 UAT)

**File:** `src/tools/tmux-copilot.ts` (470 LOC)  
**Purpose:** Co-pilot affordance for the tmux visual orchestration layer. 9 actions across 4 phases (43, 51, 58, 58.8, 58.9, 59). Most action-rich single file in the tool surface.

### 1.1 Actions

| # | Action | Phase | Schema | Purpose |
|---|--------|-------|--------|---------|
| 1 | `send-keys` | P43 (REQ-04) | `SendKeysActionSchema` | Type text into a tmux pane via `sendKeys` adapter call |
| 2 | `list-panes` | P43 (REQ-04) | `ListPanesActionSchema` | Enumerate live panes scoped to optional `mainPaneId` |
| 3 | `compute-grid` | P43 (REQ-04) | `ComputeGridActionSchema` | Pure computation: `PaneTreeNode → SplitCommand[]` (no I/O) |
| 4 | `respawn` | P43 (REQ-04) | `RespawnActionSchema` | Recreate a closed-pane session by `sessionId` |
| 5 | `forward-prompt` | P58 G4 (REQ-58-04) | `ForwardPromptActionSchema` | Main→delegate prompt with `[orchestrator-forward ISO]` sentinel; respects `manualOverride` |
| 6 | `take-over` | P58 G5 (REQ-58-05), P59 R2 | `TakeOverActionSchema` | Set `manualOverride=true`; optionally inject prompt via SDK `sendPrompt` (steer/respond modes) |
| 7 | `release` | P58 G5 (REQ-58-05) | `ReleaseActionSchema` | Clear `manualOverride=false` |
| 8 | `peek` | P58.8 S2 (REQ-58-08) | `PeekActionSchema` | Read most-recent `capture-pane` for a paneId; zero-byte envelope when no capture cached |
| 9 | `peek-by-session` | P59 A2 | `PeekBySessionActionSchema` | `sessionId → paneId` registry resolution, then same peek logic; honours `maxBytes` tail-truncation |

Zod wiring: 9 individual schemas fed into `z.discriminatedUnion("action", [...])` (line 147). Discriminator is the only `action: z.literal("…")` field — schema-level switching is canonical.

### 1.2 Args

The `tool.schema` args object (lines 205-214) is a **structural-shape hint** for the framework; the canonical parse happens via `TmuxCopilotActionSchema.safeParse(rawArgs)` at line 229. The mismatch between these two surfaces is intentional (lines 201-204 comment).

| Arg | Type | Used by |
|-----|------|---------|
| `action` | string (describe-only; canonical parse via Zod) | All |
| `paneId` | string? | send-keys, forward-prompt, peek |
| `text` | string? | send-keys, forward-prompt |
| `literal` | boolean? | send-keys (default `false`), forward-prompt (default `true`) |
| `mainPaneId` | string? | list-panes |
| `tree` | unknown? (P59+ lazy Zod ref) | compute-grid |
| `sessionId` | string? | respawn, take-over, release, peek-by-session |
| `maxBytes` | number? | peek, peek-by-session |
| `prompt` | string? (P59 R2) | take-over |
| `promptMode` | enum["steer","respond"]? (P59 R2) | take-over |

### 1.3 Status Values (Result Union — `TmuxCopilotResult`, lines 163-179)

13 distinct result shapes, all return-wrapped by `renderToolResult`:

- **Unavailability (3):** `{ available: false, reason: "tmux-not-wired" | "tmux-not-installed" | "tmux-timeout" }` + `{ available: false, reason: "tmux-error", error: { message } }`
- **Send-keys (2):** `{ sent: true, paneId }` / `{ sent: false, paneId, error: { message } }`
- **Read (1):** `{ panes: PaneState[] }`
- **Pure (1):** `{ commands: SplitCommand[] }`
- **Respawn (2):** `{ respawned: true, paneId }` / `{ respawned: false, error: { reason: "session-not-closed" } }`
- **Forward-prompt (1):** `{ paneId, deliveredAt, byteLength }`
- **Suppression (1):** `{ suppressed: true, reason: "manualOverride", paneId, textPreview, evaluatedAt }` — P58 G5 mitigation
- **Take-over (1):** `{ sessionId, paneId, takenBy, takenAt, promptDelivered?, promptMode?, promptError? }` — P59 R2 optional fields
- **Release (1):** `{ sessionId, releasedAt }`
- **Peek (2):** `{ paneId, content, capturedAt, byteLength }` / `{ sessionId, paneId, content, capturedAt, byteLength }` (peek-by-session variant)
- **Errors (2):** `{ error: { kind: "invalid-input", issues } }` / `{ error: { kind: "permission-denied", agent } }`

### 1.4 Integration Points

| Import | File / Module | Purpose |
|--------|---------------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | Tool factory |
| `z` from `zod` | SDK | Discriminated-union schema |
| `getSessionManagerAdapter`, `setSessionManagerAdapter`, `PaneState`, `PaneTreeNode`, `SplitCommand` from `../features/tmux/types.js` | Adapter contract (P51) | I/O surface |
| `getManualOverrideState`, `setManualOverrideState` from `../features/session-tracker/index.js` | P58 G5 | Manual-override ledger |
| `resolveSessionToPaneId`, `getSendPrompt` from `../features/tmux/types.js` | P59 A2, R2 | sessionId→paneId registry + SDK prompt injection |
| `renderToolResult` from `../shared/tool-helpers.js` | Shared | Response envelope |

**Consumers of tmux-copilot's `TmuxCopilotResult` type:** No files import the result union as a type (the type is exported for tests). The tool is consumed exclusively through the `tool()` factory registration in `src/plugin.ts`.

**Test seam:** `__setTmuxMultiplexerForTesting(mux)` at line 468 — wraps `setSessionManagerAdapter` for BATS-style test injection. Module-level mutable state populated by the integration factory at plugin-init.

### 1.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F1.1 | **HIGH** | `args.action` is typed `s.string()` (line 206) — the SDK-level `args` does **not** validate the discriminator. A wrong `action` string is only caught by the Zod safeParse at line 229, which returns the graceful `{error: {kind: "invalid-input"}}` envelope. The framework receives no advance signal. | line 206 | Acceptable (graceful path), but means a misconfigured caller (e.g. an LLM emitting `"send_key"` instead of `"send-keys"`) gets the same envelope shape as a deep type error. Caller cannot easily distinguish typo from structural mismatch. |
| F1.2 | **MED** | PaneTreeNodeSchema uses `z.lazy()` (line 76) but is **not** exported, so the structural `args.tree: s.unknown()` is a deliberate punt (line 211). A consumer passing an invalid tree shape (e.g. `{}` missing `id`) gets caught only inside `computeSplitSequence`. | lines 76-81, 211 | Behaviour is correct (compute-grid never throws — line 282-285 unwraps no try/catch but the planner is pure), but error attribution is lost. Recommend exporting PaneTreeNodeSchema for caller-side validation. |
| F1.3 | **MED** | `forward-prompt` deliberately omits from USER_SESSION allowed set (lines 300-313 comment), but **the runtime check is `context.agent` (line 221) returning `{permission-denied}` only for null/undefined agent (line 222)**. The P58.8 S2 "tier" model is *only* documented in the comment block lines 67-70 — it says "Every agent… has access to ALL copilot actions". The hardcoded tier gating has been **removed in P59 R1** per the comment. | lines 67-70, 199, 221-226 | This is a **deliberate widening**, not a bug. However, the "forward-prompt" restriction comment (300-313) is now historically inaccurate — there is no USER_SESSION set anymore. Future maintainers reading only the inline comment may be confused. Recommend: update the lines 300-313 comment to point at the P59 R1 widening, or remove it. |
| F1.4 | **MED** | `take-over` always sets `takenBy: "human-operator"` (lines 352, 376) — hardcoded string. The OpenCode SDK `context.agent` is available but ignored. If a programmatic agent (not a human) calls take-over, the audit trail lies. | lines 349-353, 376 | Audit-log integrity. The fix is `takenBy: context.agent ?? "human-operator"`, but the design intent (per the S2 comment) is to enforce operator-only, which is contradicted by F1.3. |
| F1.5 | **LOW** | `peek` (line 398) and `peek-by-session` (line 422) both use `adapter.getLatestCapture?.(input.paneId)` with optional chaining. If the adapter lacks `getLatestCapture` (e.g. legacy BATS mock), the tool returns a zero-byte envelope with `capturedAt = now()`. This is correct per the lines 391-397 comment, but it conflates "no capture" with "no adapter support" — both produce identical envelopes. | lines 398, 422 | Distinguishable to callers only by the `capturedAt` timestamp proximity to invocation time, which is fragile. Recommend adding `{ captureAvailable: false }` discriminator when `getLatestCapture` is missing. |
| F1.6 | **LOW** | `peek-by-session` returns `{ error: { kind: "invalid-input", issues: [...] } }` when `resolveSessionToPaneId` returns falsy (lines 414-421), but the Zod issue is **synthesised** (`{ code: "custom", message: ..., path: ["sessionId"] } as unknown as z.ZodIssue`) — this cast bypasses Zod's normal validation. Downstream consumers expecting real `z.ZodIssue` shape may mis-handle. | lines 416-420 | Type-honesty issue. Use `z.ZodIssue` constructor or a custom error variant. |
| F1.7 | **LOW** | Module-level mutable state in `setSessionManagerAdapter`/`getSessionManagerAdapter` (via `../features/tmux/types.js`). The `__setTmuxMultiplexerForTesting` (line 468) is the only seam; BATS test runs that forget to call `__setTmuxMultiplexerForTesting(null)` in teardown will leak state into subsequent tests. | lines 468-470 | Test isolation. Not a production bug. |
| F1.8 | **LOW** | The `description` (line 195-199) says "All agents may invoke all actions. Agent-name-based denial removed in P59 R1." but the description still lists actions including `take-over`, `release`, `peek` that conceptually imply operator intent. The P58.8 S2 mitigation in the comment block (lines 24-31) is no longer enforced at runtime. | lines 195-199, 24-31 | Documentation vs runtime drift. Either re-introduce tier gating (breaks F1.3 design) or update the description to remove the operator-only framing. |
| F1.9 | **INFO** | The `compute-grid` switch case (line 282) has **no try/catch**. If `createPaneGridPlanner()` returns a malformed planner (production bug), this throws uncaught into the framework. Every other action wraps in try/catch. | line 282 | Consistency gap. Not a real bug in current state (planner is pure) but defensive hardening is asymmetric. |
| F1.10 | **INFO** | The "schema structural hint" pattern (lines 201-214) means the `args` field exists primarily for type contract; the real validation is in execute(). A consumer writing docs from the SDK type alone will not see Zod refinements (e.g. `maxBytes: number().int().positive()` on peek schemas line 136 — but this is in the Zod schema, not the SDK args). | lines 205-214 | Documentation contract drift. |
| F1.11 | **INFO** | `compute-grid` is the only action that does not require the adapter (line 282) — it can be called even with `adapter === null` because `createPaneGridPlanner()` is on the adapter. Wait — it IS on the adapter. So if adapter is null, line 239-241 returns early, and compute-grid is unreachable. The pure-function claim is true only when adapter is wired. | lines 239-241, 282 | Subtle. Worth a code comment. |

---

## Section 1.5 — `tmux-state-query.ts` (PRIORITY: P58.9 UAT)

**File:** `src/tools/tmux-state-query.ts` (162 LOC)  
**Purpose:** Read-only session metadata query for the tmux visual orchestration layer. **This file is essentially a stub for 3 of its 3 actions.**

### 1.5.1 Actions

| # | Action | Phase | Schema | Actual Behaviour |
|---|--------|-------|--------|------------------|
| 1 | `list-sessions` | P52 (REQ-04) | `ListSessionsActionSchema` | **Returns `{ sessions: [] }` always** (line 142). Comment lines 137-141 admits the adapter doesn't expose session enumeration. |
| 2 | `get-session` | P52 (REQ-05) | `GetSessionActionSchema` | **Returns `{ session: null }` always** (line 150). Comment lines 144-149 admits internal `SessionManager.sessions` map is not exposed. |
| 3 | `get-summary` | P52 (REQ-05) | `GetSummaryActionSchema` | **Returns `{ summary: { total: 0, active: 0, spawning: 0 } }` always** (line 158). Comment lines 152-156 admits no access to internal counts. |

This file is the **mirror** of `tmux-copilot.ts` per the phase 52 design (line 12-15 comment) but **delivers zero read functionality** for any of its 3 actions.

### 1.5.2 Args

```ts
args: {
  action: s.string().describe("One of: list-sessions, get-session, get-summary"),
  sessionId: s.string().optional().describe("(get-session) session id to query"),
}
```

The SDK-level `args` does not constrain `action` to the 3 literals — same graceful pattern as `tmux-copilot.ts`. The `sessionId` arg is accepted for `get-session` but **never used** in the dispatch (line 144-150).

### 1.5.3 Status Values (`TmuxStateQueryResult`, lines 73-79)

6 result shapes — 3 useful, 3 stubs:

- **Stub (1):** `{ available: false, reason: "tmux-not-wired" }`
- **Error (2):** `{ error: { kind: "invalid-input", issues } }` / `{ error: { kind: "permission-denied", agent } }` — `permission-denied` shape is **defined but unreachable** (line 26 comment "all agents allowed" — the gate is a no-op).
- **Stub (3):** `{ sessions: SessionSummary[] }` (always `[]`), `{ session: SessionSummary | null }` (always `null`), `{ summary: { total, active, spawning } }` (always `0, 0, 0`).

### 1.5.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | Tool factory |
| `z` from `zod` | SDK | Discriminated union |
| `getSessionManagerAdapter` from `../features/tmux/types.js` | P51 adapter | Bridge check only — no method calls |
| `renderToolResult` from `../shared/tool-helpers.js` | Shared | Response envelope |

The `SessionSummary` interface (lines 37-44) is exported and **never used** outside this file. No file in `src/` imports it.

### 1.5.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F1.5.1 | **CRITICAL** | All 3 actions are **pure stubs** — `list-sessions` returns `[]`, `get-session` returns `null`, `get-summary` returns `{ total: 0, active: 0, spawning: 0 }`. Consumers expecting useful read data get nothing. | lines 142, 150, 158 | This tool is **non-functional for its stated purpose**. The file should either (a) be wired to a real session map via the adapter, or (b) be removed/deprecated. The exported `tmuxStateQueryToolName` const (line 91) and the `tmuxStateQueryTool` export both register a tool that lies. |
| F1.5.2 | **HIGH** | `sessionId` arg is **declared but never read** — the `get-session` action ignores it (line 144-150). An LLM that calls `get-session` with `sessionId: "ses_xxx"` will get `{ session: null }` regardless of whether the session exists. | lines 54-57, 144-150 | Silent failure. The function should at least check the registry (e.g. via `resolveSessionToPaneId` from `../features/tmux/types.js`, which tmux-copilot uses) and return a different envelope. |
| F1.5.3 | **MED** | `permission-denied` is in the result union (line 76) but **unreachable** — the gate logic was removed in P59 R1 (line 26 comment). Dead code in the type. | lines 26, 76 | Type-honesty. |
| F1.5.4 | **MED** | `getSessionManagerAdapter()` is called at line 129-132 but **none of its methods are invoked** in any action branch. The bridge check is dead-weight: if adapter is null, the tool reports "tmux-not-wired", but if adapter IS wired, the result is still empty. The check is *misleading*: it suggests "wired" implies useful data. | lines 129-132 | Misleading. Either remove the bridge check (since the tool doesn't use the adapter) or wire the actions to use it. |
| F1.5.5 | **LOW** | `exported SessionSummary` (lines 37-44) is dead — no consumer in `src/`. Either remove or document an intended consumer. | lines 37-44 | Dead code. |
| F1.5.6 | **LOW** | `_context: ToolContext` parameter (line 115) is unused — `_` prefix correctly signals intent, but the typing is broader than needed. | line 115 | Minor. |
| F1.5.7 | **LOW** | The tool description (lines 100-103) advertises "Actions: list-sessions, get-session, get-summary" and "Orchestrator-tier only", but the latter is no longer enforced (F1.5.3). Stale description. | lines 100-103 | Doc drift. |
| F1.5.8 | **INFO** | The file was clearly a placeholder for the P52 design that **was never completed**. The comments at lines 137-141, 144-149, 152-156 explicitly admit "in a future phase, the SessionManagerAdapter can be extended with a getSessions() method" — that future phase is the P58.9 UAT. **This is the gap the user is asking UAT to close.** | lines 137-156 | Phase gap. The audit identifies the missing implementation contract: `SessionManagerAdapter` needs `getSessions(): SessionSummary[]` and `getSummary(): { total, active, spawning }`. |

---

## Section 2 — `session-tracker.ts`

**File:** `src/tools/session/session-tracker.ts` (423 LOC)  
**Purpose:** Read-only query/export of session knowledge files. 6 actions. CQRS read-side. No mutation authority.

### 2.1 Actions

| # | Action | Schema branch | Purpose |
|---|--------|---------------|---------|
| 1 | `export-session` | default | Export full session content (markdown or JSON frontmatter-only) |
| 2 | `get-status` | default | Status snapshot (status, lastUpdated, turnCount, childCount, toolSummary) |
| 3 | `get-summary` | default | Frontmatter-only summary |
| 4 | `list-sessions` | default | List with optional `limit`; index-first with directory-scan fallback (GAP-06) |
| 5 | `search-sessions` | default | Substring search across `ses_*/ses_*.md` AND child .json files (per D-02) |
| 6 | `filter-sessions` | default | Multi-criteria filter (status, agentType, minDepth, maxDepth, timeRange) |

The `action` field in `args` is `tool.schema.string()` (line 30) — no enum constraint at SDK level; validation happens via `SessionTrackerInputSchema.parse` (line 46).

### 2.2 Args

| Arg | Schema | Used by |
|-----|--------|---------|
| `action` | string (SDK); enum at Zod layer | All |
| `sessionId` | string? | export-session, get-status, get-summary |
| `query` | string? (max 1000 chars per MAX_QUERY_LENGTH) | search-sessions |
| `limit` | number? | list-sessions, search-sessions, filter-sessions |
| `format` | enum["markdown","json"]? | export-session |
| `status` | string? | filter-sessions |
| `agentType` | string? | filter-sessions |
| `minDepth` | number? | filter-sessions |
| `maxDepth` | number? | filter-sessions |
| `timeRange` | object { after?, before? }? | filter-sessions |

### 2.3 Status Values

All paths return either `success(...)` or `error(...)` via `renderToolResult`/`renderToolResult(error(...))` (lines 117-273, 277-330, 339-422). The success envelope embeds the data; error envelope embeds the message. No additional discriminated union.

### 2.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | Tool factory |
| `readFile`, `readdir`, `access` from `node:fs/promises` | Node | All I/O is async (line 7 comment) |
| `resolve` from `node:path` | Node | Index path construction |
| `matter` from `gray-matter` | Markdown frontmatter parser |
| `SessionTrackerInputSchema`, `SessionTrackerInput` from `../../schema-kernel/session-tracker.schema.js` | Zod | Discriminated-union contract |
| `sessionTrackerRoot`, `safeSessionPath` from `../../features/session-tracker/persistence/atomic-write.js` | Path safety | All path construction routed through `safeSessionPath` (line 7 comment) |
| `isValidSessionID` from `../../features/session-tracker/types.js` | ID validation | Pre-validation before path use |
| `renderToolResult`, `success`, `error` from `../../shared/tool-*` | Response envelope |
| `resolveSessionFile` from `./session-resolver.js` | Internal | Resolve sessionId → file path / child record |

### 2.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F2.1 | **MED** | `MAX_QUERY_LENGTH = 1000` (line 22) is a magic constant — should be in the Zod schema (`SessionTrackerInputSchema`). Validation happens in `handleSearchSessions` (line 278) but the SDK-level `args.query` is unbounded. | lines 22, 32, 278 | Inconsistent validation layers. |
| F2.2 | **MED** | `filter-sessions` accepts `status` as a free-form string (line 35) and lowercases for comparison (line 345). No enum constraint at SDK or Zod layer — typos silently match nothing. | lines 35, 345 | Silent typo-fail. The valid status set is well-known (from `VALID_DELEGATION_STATUSES` in delegation-status.ts:134 — `dispatched|running|completed|error|timeout|aborted|cancelled`). |
| F2.3 | **LOW** | `list-sessions` fallback (line 261-274) ignores `timeRange` and other filter args (none of which are accepted by `list-sessions` — so this is correct, but the GAP-06 path is bare-bones). | lines 261-274 | Documented GAP; not a bug. |
| F2.4 | **LOW** | `search-sessions` uses `.toLowerCase()` for matching (line 299) but the `query` field is stored verbatim in the result (line 305-307). Case-insensitive search but case-preserving output. | lines 299, 305-307 | Cosmetic. |
| F2.5 | **LOW** | `search-sessions` returns at most 1 match per session's `.md` (line 308 `break`). A 5000-line session with 100 matches returns 1 — the `totalMatches` field (line 326) is misleading. | lines 300-310 | Total under-count. The D-02 child search complements this but a single match per .md is a hard limit. |
| F2.6 | **LOW** | `export-session` (line 154) sets `isUser = turn.role === "user" || turn.actor === "user"` and renders with `## USER (turn N)`. For non-user turns, the actor is used. This is fine, but the actor string is **not sanitized** — a malicious child session could inject markdown via `turn.actor`. | lines 151-155 | XSS-in-markdown (only meaningful if a downstream renderer trusts the export). |
| F2.7 | **INFO** | `get-status` for a `main` session (line 171-180) reads `resolved.continuityPath` and assumes fields. The shape is `Record<string, unknown>` with optional fields. No schema validation. | lines 171-180 | Type drift risk; main session continuity is the legacy data root. |
| F2.8 | **INFO** | `searchChildJsonFiles` (line 65-109) is called per session in `search-sessions` (line 314) — O(N×C) where C is children per session. For a project with 1000 sessions × 5 children, that's 5000 file reads. No batching. | line 314 | Performance under load. |

---

## Section 3 — `session-hierarchy.ts`

**File:** `src/tools/session/session-hierarchy.ts` (283 LOC)  
**Purpose:** Read-only navigation of session delegation trees. 4 actions.

### 3.1 Actions

| # | Action | Purpose |
|---|--------|---------|
| 1 | `get-children` | Direct children of a session |
| 2 | `get-parent-chain` | Walk parent chain up to root (max 50 hops) |
| 3 | `get-delegation-depth` | Recursive max-depth computation (max 100 visited nodes) |
| 4 | `get-manifest` | Read `hierarchy-manifest.json` for a session; fallback to continuity (line 256-280) |

`action` is an enum at SDK level (line 38): `["get-children", "get-parent-chain", "get-delegation-depth", "get-manifest"]` — one of the few tools with an SDK-level enum.

### 3.2 Args

| Arg | Schema | Used by |
|-----|--------|---------|
| `action` | enum (SDK) | All |
| `sessionId` | string | All |
| `includeStatus` | boolean? | get-children |

### 3.3 Status Values

Standard `success/error` via `renderToolResult`. No discriminated union.

### 3.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | |
| `readFile` from `node:fs/promises` | Node | |
| `SessionHierarchyInputSchema`, `SessionHierarchyInput` from `../../schema-kernel/session-tracker.schema.js` | Zod | |
| `isValidSessionID` from `../../features/session-tracker/types.js` | Validation | |
| `renderToolResult`, `success`, `error` from `../../shared/tool-*` | Envelope | |
| `resolveSessionFile` from `./session-resolver.js` | Path resolution | |
| `ChildRef` type from `../../features/session-tracker/types.js` | Types | |

### 3.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F3.1 | **HIGH** | `get-children` (line 150-159) computes `delegationDepth: c.delegationDepth ?? (record.delegationDepth ?? 0) + 1`. This is wrong when a child's stored depth is **less than** parent's depth (data corruption or re-org). The fallback assumes a child is always parent+1, but in a manifest with explicit per-child depth, the explicit value should be authoritative. The `??` operator only fires on `undefined` — so a stored 0 or 1 would be used. The bug surfaces only when manifest data is missing depth on some children. | line 154 | Edge-case data loss; not a normal-state bug. |
| F3.2 | **MED** | `get-children` (line 153) uses `c.status ?? record.status` — the child's `record.status` is the parent's status when child status is absent. This is semantically odd: a child without status should be reported as `unknown`, not inherit parent. | line 153 | Status over-attribution. |
| F3.3 | **MED** | `findHierarchyEntry` (line 61-75) uses `any` for the entry type and `Record<string, any>` for children (line 62). Loses type safety. Same pattern in `session-context.ts` line 79-93. | lines 61-75 | Type drift between the two files (duplicate function with different signatures). |
| F3.4 | **LOW** | `get-parent-chain` has `MAX_DEPTH = 50` (line 167) as a hard cap. A genuinely deep delegation chain (rare but possible in recursive agent setups) silently truncates. | line 167 | Silent truncation. Recommend returning `chainTruncated: true` flag. |
| F3.5 | **LOW** | `computeDepth` (line 192-206) has `COMPUTE_DEPTH_MAX = 100` (line 190) — silent on truncation, returns 0. Same complaint as F3.4. | lines 190, 194 | Silent truncation. |
| F3.6 | **LOW** | `get-manifest` fallback (line 256-280) returns a degraded manifest with `maxDepth: 0` and `turnCount: 0` even when the underlying continuity has these. The two surfaces diverge. | lines 268-275 | Manifest vs continuity drift. |
| F3.7 | **LOW** | `normalizeChildren` (line 126-143) accepts both Record and Array shapes, but the `childFile` fallback (`entry.file`) is undocumented and likely never exercised. | lines 132-141 | Dead-code-adjacent. |
| F3.8 | **INFO** | `readContinuity` (line 78-123) is duplicated **almost verbatim** in `session-context.ts` line 96-141. Same pattern in `hivemind-session-view.ts` line 55-66. Three near-identical implementations. | session-context.ts:96, hivemind-session-view.ts:55 | DRY violation. Extract to a shared `readSessionContinuity(projectRoot, sessionId)` helper. |

---

## Section 4 — `session-context.ts`

**File:** `src/tools/session/session-context.ts` (301 LOC)  
**Purpose:** Cross-session synthesis and discovery. 4 actions. Read-only.

### 4.1 Actions

| # | Action | Purpose |
|---|--------|---------|
| 1 | `find-related` | Score-based related-session discovery (tool overlap × 2 + time proximity) |
| 2 | `cross-reference` | Tool/agent name search across all sessions |
| 3 | `synthesize-context` | Compact markdown context dump for a session |
| 4 | `aggregate` | Count sessions grouped by `status` or `subagentType` |

`action` enum at SDK level (line 45): `["find-related", "cross-reference", "synthesize-context", "aggregate"]`.

### 4.2 Args

| Arg | Schema | Used by |
|-----|--------|---------|
| `action` | enum (SDK) | All |
| `sessionId` | string? | find-related, cross-reference, synthesize-context |
| `query` | string? | cross-reference |
| `maxRelated` | number? | find-related |
| `groupBy` | enum["subagentType","status"]? | aggregate |

### 4.3 Status Values

Standard success/error.

### 4.4 Integration Points

Same import set as `session-hierarchy.ts` (see Section 3.4) + `safeSessionPath`, `sessionTrackerRoot` from atomic-write, and `readContinuity` (duplicate, see F3.8).

### 4.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F4.1 | **HIGH** | `find-related` (line 144-169) requires `source.toolSummary` (line 151) which comes from the **project-continuity.json** index (line 146-147). If the index is missing or stale, the action returns `{error: "No project index found."}`. This is the same GAP-06 fallback that `session-tracker.ts:list-sessions` handles, but `find-related` does not. Inconsistent fallback policy. | lines 146-150 | Inconsistent failure modes across the read tool surface. |
| F4.2 | **MED** | `cross-reference` (line 172-197) uses `(query ?? sessionId).trim()` (line 177) — if no `query` and no `sessionId` is provided at the Zod level (it's optional), the function would still proceed with empty string. The validation at line 178 catches this, but the dual-purpose arg is confusing: `sessionId` is used as a search term here, not as an ID. | lines 172-178 | API contract confusion. The comment at line 175-176 acknowledges this but the arg names are misleading. |
| F4.3 | **MED** | `cross-reference` ignores `isValidSessionID` on `sessionId` (line 173 validation is for `sessionId` even though `sessionId` is treated as a search term). If a caller passes a malformed `sessionId` expecting it to be validated as an ID, no error is raised. | line 173 | API contract confusion (same as F4.2). |
| F4.4 | **MED** | `aggregate` (line 252-301) for `groupBy: "subagentType"` (line 266-287) silently assigns `counts["opencode-session"]` for every root session (line 270). This conflates "root session count" with "agent type", since a root session is always an `opencode-session` regardless of which model it actually used. | line 270 | Misleading aggregation. A user querying subagent types will see `opencode-session: N` and think there are N such agents, when actually those are root sessions that are not delegations. |
| F4.5 | **LOW** | `synthesize-context` (line 200-249) caps top tools at 15 (line 229) but the markdown header says `${Object.keys(tools).length} total` (line 243). If a session has 50 distinct tools, the markdown shows "50 total" but only 15 are listed — confusing. | lines 229, 243 | Minor UX. |
| F4.6 | **LOW** | `find-related` `TIME_PROXIMITY_MS = 30 * 60 * 1000` (line 38) — magic constant. Same for the `score = toolScore * 2 + (timeProximity ? 1 : 0)` (line 161). Weights are implicit. | lines 38, 161 | Score weights not exposed. |
| F4.7 | **LOW** | `find-related` scans all sessions in O(N²) (line 154 `for of Object.entries`) — fine for 100s, problematic for 10K+ sessions. | line 154 | Performance under load. |
| F4.8 | **INFO** | `readContinuity` duplicates session-hierarchy.ts:78-123 — see F3.8. | line 96 | DRY violation. |
| F4.9 | **INFO** | `findHierarchyEntry` (line 79-93) duplicates session-hierarchy.ts:61-75 — see F3.8. | line 79 | DRY violation. |

---

## Section 5 — `session-delegation-query.ts`

**File:** `src/tools/session/session-delegation-query.ts` (284 LOC)  
**Purpose:** Progressive-disclosure read-only query of delegation history from session-tracker data. 2 actions. Read-only.

### 5.1 Actions

| # | Action | Purpose |
|---|--------|---------|
| 1 | `list` | Paginated, filterable delegation summaries from `hierarchy-manifest.json` |
| 2 | `get` | Full delegation detail from child `.json` file via `resolveSessionFile()` |

`action` enum at SDK level (line 41): `["list", "get"]`. The Zod schema is **dynamically imported** inside `execute()` (line 60) — unusual pattern that adds 1 await per call.

### 5.2 Args

`list` args: `rootSessionId?`, `status?`, `agentType?`, `delegatedBy?`, `minDepth?`, `maxDepth?`, `updatedAfter?`, `updatedBefore?`, `offset?`, `limit?` (defaults applied at Zod layer).

`get` args: `sessionId` (required at Zod layer; the SDK allows `.optional()` but Zod would reject `undefined`).

### 5.3 Status Values

Standard success/error. The `get` action returns an enriched object with `sessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy { agentName, model, tool, description, subagentType }`, `mainAgent`, `turnCount`, `turnSummary { toolSummary, firstTurnAt, lastTurnAt }`, `journeyEntryCount`, `lastMessage` (truncated to 500 chars), `children { count, ids }`, plus optional P41-B gap fields (`queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`, `lifecycle`).

### 5.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | |
| `readFile`, `readdir` from `node:fs/promises` | Node | |
| `join` from `node:path` | Node | |
| `safeSessionPath`, `sessionTrackerRoot` from `../../features/session-tracker/persistence/atomic-write.js` | Path safety | |
| `resolveSessionFile` from `./session-resolver.js` | Path resolution | |
| `isValidSessionID` from `../../features/session-tracker/types.js` | ID validation | |
| `success`, `error` from `../../shared/tool-response.js` | Envelope | |
| `renderToolResult` from `../../shared/tool-helpers.js` | Envelope | |
| `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord` types | Types | |
| `SessionDelegationQueryInput` type + dynamic `SessionDelegationQueryInputSchema` (line 60) | Zod | |

### 5.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F5.1 | **MED** | Dynamic import of `SessionDelegationQueryInputSchema` inside `execute()` (line 60) — adds one async hop per call. The comment says "Zod discriminatedUnion validates shape per action" but there's no `discriminatedUnion` in the file; this is a misleading comment. | line 60 | Performance + comment inaccuracy. Move the import to the top of the file. |
| F5.2 | **MED** | `MAX_TOTAL_RESULTS = 1000` (line 97) — hard cap with **no truncation flag** in the response. If 5000 delegations exist, the function silently discards 4000 and returns `total: 1000` (line 151). | lines 97, 118, 126, 151 | Silent truncation. Recommend `hasMore: true` flag. |
| F5.3 | **LOW** | `list` action sorts by `updatedAt` descending (line 149) using `localeCompare` on ISO date strings. This works because ISO 8601 strings sort lexicographically = chronologically, but it's a subtle invariant. | line 149 | Subtle. |
| F5.4 | **LOW** | `get` action's `lastMessage` is sliced to 500 chars (line 221) — the slice is from the start, not the end. Long messages are truncated at the beginning, losing the conclusion. | line 221 | UX. Consider `slice(-500)` for tail-truncation. |
| F5.5 | **LOW** | `matchesFilters` (line 240-252) uses `child.status !== filters.status` — exact string match, not case-insensitive. `session-tracker.ts:filter-sessions` is case-insensitive (line 345). Inconsistent. | line 241 | Inconsistent filtering. |
| F5.6 | **LOW** | `delegationDepth ?? 0` (line 136) — assumes 0 for missing depth. A missing depth is semantically different from "depth 0" (a root). | line 136 | Data integrity. |
| F5.7 | **INFO** | `discoverRootSessions` (line 263-284) is duplicated from `session-tracker.ts:handleListSessions` (line 236-275) with minor naming differences. | line 263 | DRY violation. |
| F5.8 | **INFO** | The tool description (line 38) lists it as "Complementary to delegation-status, session-tracker, session-hierarchy, and hivemind-session-view" — explicitly notes overlap. This is the right architectural framing. | line 38 | Intentional. |

---

## Section 6 — `hivemind-session-view.ts`

**File:** `src/tools/hivemind/hivemind-session-view.ts` (155 LOC)  
**Purpose:** Cross-root unified session query (3 data roots: session-tracker, delegations, trajectory). 1 action.

### 6.1 Actions

| # | Action | Purpose |
|---|--------|---------|
| 1 | `get` | Build unified view from 3 data roots concurrently (line 120-124 `Promise.all`) |

`action` enum at SDK level (line 35): `["get"]` — single action.

### 6.2 Args

| Arg | Schema | Required |
|-----|--------|----------|
| `action` | enum["get"] (SDK) | Yes |
| `sessionId` | string (SDK) | Yes |

### 6.3 Status Values

Standard success/error. The success path returns `{ session: { enriched }, delegations: { total, active, entries }, trajectory: { total, entries } | null, queriedAt: ISO }`. The error path returns `{ error: "Session not found: ${sessionId}", session: null, delegations: [], trajectory: null }` (line 127-130) — **but the result is wrapped in `renderToolResult(error(...))` (line 43)**, which means callers get the standard error envelope shape.

### 6.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | |
| `readFile` from `node:fs/promises` | Node | |
| `resolve` from `node:path` | Node | |
| `SessionViewInputSchema`, `SessionViewInput` from `../../schema-kernel/session-view.schema.js` | Zod | |
| `renderToolResult`, `success`, `error` from `../../shared/tool-*` | Envelope | |
| `resolveSessionFile` from `../session/session-resolver.js` | Path resolution | |

**Note:** The file imports from `../session/session-resolver.js` (parent directory of `hivemind/` → `session/`) — correct relative path.

### 6.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F6.1 | **MED** | `readDelegationsForSession` (line 69-102) is **non-deterministic** in which data root it picks. For a root session with a manifest, it filters children by `meta.parentSessionID === sessionId` (line 79) — but the filter is asymmetric: a `child` session (line 84) returns just `[childRecord]` without filtering. The two paths can return different counts for the same sessionId depending on whether it's resolved as `main` or `child`. | lines 74-87 | Subtle inconsistency. |
| F6.2 | **MED** | `readDelegationsForSession` filter (line 79) is `(meta as Record<string, unknown>).parentSessionID === sessionId`. For a root sessionId (which has no parent), this filter is `undefined === sessionId` which is always false. So delegations for the root session itself are never returned. The query "show me delegations of root session X" returns empty. | line 79 | Root session delegation queries silently fail. |
| F6.3 | **MED** | `readTrajectoryForSession` (line 105-116) uses `(r.rootSessionId === sessionId || r.sessionId === sessionId)` (line 110-112) — but for the trajectory ledger, `rootSessionId` is the root, not the parent. Filtering by `rootSessionId === sessionId` returns trajectory events for sessions that are roots *of* `sessionId`, not events **about** `sessionId`. Semantically inverted. | lines 110-112 | Trajectory filter wrong direction. |
| F6.4 | **LOW** | `readDelegationsForSession` and `readTrajectoryForSession` use `as Record<string, unknown>` casts throughout (lines 76, 79, 80, 85, 96, 98, 99, 109, 110-112). No schema validation. | many | Type drift risk. |
| F6.5 | **LOW** | `readSessionData` (line 55-66) for a `child` session returns `resolved.childRecord as unknown as Record<string, unknown>` (line 64) — a triple cast. The `unknown` intermediate signals type uncertainty that the cast hides. | line 64 | Type safety. |
| F6.6 | **LOW** | The `delegations.active` count (line 149) uses `d.status === "running" || d.status === "dispatched"` — hardcoded status values. The same set is defined in `delegation-status.ts:134` as `VALID_DELEGATION_STATUSES`. Duplication. | line 149 | DRY violation. |
| F6.7 | **INFO** | The `Promise.all` (line 120) is **fail-fast**: any reject propagates. But each `readX` function has its own try/catch that returns `null`/`[]` on failure (lines 62, 88, 101, 115). So in practice, no rejection occurs and the Promise.all is well-behaved. The fail-fast is theoretical. | line 120 | Defensive. |
| F6.8 | **INFO** | `readDelegationsForSession` slice `(0, 20)` (line 81) — hardcoded limit. No `hasMore` flag returned. | line 81 | Pagination missing. |
| F6.9 | **INFO** | The tool has only 1 action (`get`), making the `action` enum redundant. Could be implicit. | line 35 | Redundancy (cosmetic). |

---

## Section 7 — `delegate-task.ts`

**File:** `src/tools/delegation/delegate-task.ts` (110 LOC)  
**Purpose:** Delegate work to a specialist agent via SDK child-session dispatch. **Single action (delegate), via factory function `createDelegateTaskTool(coordinator, config)`.**

### 7.1 Actions

Only one logical action: **delegate**. The function name is `createDelegateTaskTool` and the input shape is `DelegateTaskV2Schema`:

```ts
{
  agent: string,
  prompt: string,
  context?: string,
  stackOnSessionId?: string,
}
```

### 7.2 Args

| Arg | Schema | Required |
|-----|--------|----------|
| `agent` | string, min 1 | Yes |
| `prompt` | string, min 1 | Yes |
| `context` | string? | No — legacy JSON `{parentSessionId}` for stacking |
| `stackOnSessionId` | string? | No — first-class stacking (PREFERRED) |

### 7.3 Status Values

The output is the `coordinator.dispatch` result, wrapped via `renderToolResult(success|error)`. Errors:
- `error: "[Harness] Invalid delegate-task input: ..."` (line 48) — Zod parse failure
- `error: "[Harness] delegate-task is disabled by config ..."` (line 52) — feature flag off
- `error: resultMessage` or `error: message` (lines 90-91, 99) — dispatch failure

Success: returns the entire `resultRecord` plus `agent` and `stackedOn` fields (line 95). The shape of `resultRecord` is opaque — it's whatever `coordinator.dispatch` returns (typed as `Record<string, unknown>` in the `CoordinatorLike` interface line 18).

### 7.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool` from `@opencode-ai/plugin/tool` | SDK | |
| `z` from `zod` | SDK | |
| `renderToolResult` from `../../shared/tool-helpers.js` | Envelope | |
| `error`, `success` from `../../shared/tool-response.js` | Envelope |
| `CoordinatorLike` interface (line 17) | Internal | `dispatch(params)` only — narrow contract |
| `createDelegateTaskTool(coordinator, config?)` factory | Internal | The tool is **not** a single export — it's a factory. The plugin wires the coordinator. |

**External consumers:** `src/plugin.ts` (or similar) instantiates the factory with the live `Coordinator`. No file in `src/tools/` imports `createDelegateTaskTool` (the tools/ subtree has no self-references for delegate-task).

### 7.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F7.1 | **MED** | `config?.delegation_systems?.delegate_task === false` (line 51) is the **only** runtime gate. When disabled, the tool returns a graceful error envelope (line 52), but the **tool is still registered** with the framework. LLMs can still attempt to call it; they just get a graceful error. There's no SDK-level hide. | lines 51-53 | Discoverability — LLMs waste a tool call. Recommend conditional registration in plugin.ts. |
| F7.2 | **MED** | The `CoordinatorLike` interface (line 17-19) declares only `dispatch(params): Promise<unknown>`. The actual coordinator likely has many methods; the narrow contract hides failure modes. The tool's error handling assumes the coordinator either succeeds (returns a record with `status: "error" | "timeout" | success) or throws. Other failure modes (e.g. coordinator internal error) surface as the generic catch at line 99. | lines 17-19, 97-100 | Opaque failure mode. |
| F7.3 | **LOW** | `currentDepth: 0` is **hardcoded** (line 81). The caller is always depth-0. But this tool is the dispatch point, so the tool itself IS depth-0 by definition. The hardcoding is correct but the field's name suggests it should be derived from `context.sessionID`. | line 81 | Minor confusion. |
| F7.4 | **LOW** | `queueKey: "agent:${args.agent}"` (line 84) — one queue key per agent. This means **all delegations to the same agent serialize** through the same queue. This may be intentional (concurrency control) but is undocumented. | line 84 | Concurrency policy is implicit. |
| F7.5 | **LOW** | `context` arg with legacy JSON parsing (line 63-75) — if the JSON parses but `parentSessionId` is missing, the code still concatenates `remaining` (which may be empty) with `args.prompt`. If `args.context` is malformed JSON, it falls back to `${context}\n\n${prompt}`. Two paths, slightly different. | lines 63-75 | Subtle. The `prompt` field is used as a free-text suffix in the fallback, which can pollute the prompt. |
| F7.6 | **LOW** | `asRecord` (line 105-107) accepts any value — even `null` or primitives. `null && typeof null === "object"` is `null`, so the function returns `{ result: null }` for null. Reasonable, but the type signature `Record<string, unknown>` lies. | lines 105-107 | Type honesty. |
| F7.7 | **INFO** | The comment at line 6-9 is a critical policy: "This tool MUST route via coordinator.dispatch only. Do NOT import the native `task` tool from `@opencode-ai/plugin`". This is a hard rule. The codebase honors it (no `task` imports), but the rule is not enforced by lint or schema. | lines 6-9 | Governance by comment. |

---

## Section 8 — `delegation-status.ts`

**File:** `src/tools/delegation/delegation-status.ts` (906 LOC)  
**Purpose:** Check delegation status, discover stackable sessions, and retrieve results. 8 actions. The most feature-rich tool in the read-side surface.

### 8.1 Actions

| # | Action | Purpose |
|---|--------|---------|
| 1 | `status` (default) | Render delegation record with hierarchy, options, retry recommendation |
| 2 | `list` | List delegations accessible to caller; surfaces stackable/resumable count |
| 3 | `control` | Lifecycle control: abort, cancel, restart, resume, chain, adjust-prompt, change-agent |
| 4 | `find-stackable` | Discover terminal sessions available for stacking (PREFERRED pre-dispatch) |
| 5 | `pool` | Frozen DelegationPool JSON snapshot (P58 G2) |
| 6 | `peek` | Read latest capture-pane content for a `paneId` (P58.8 S1) |
| 7 | `progress` | Live counters + last child event (P58.8 S4) |
| 8 | `get` | (Zod default) — alias of `status` |

### 8.2 Args

```ts
{
  delegationId?: string,
  status?: string,
  action: enum["status","get","list","control","find-stackable","pool","peek","progress"].default("status"),
  control?: object (DelegationControlSchema),
  agentFilter?: string,
  paneId?: string (peek),
  maxBytes?: number (peek),
}
```

### 8.3 Status Values (effective)

`DelegationStatus` enum (validated via `validateDelegationStatus`, line 137-140):
- `dispatched`, `running`, `completed`, `error`, `timeout`, `aborted`, `cancelled`
- Unknown values fall back to `"running"` (line 139) — silent normalization.

`UNSUPPORTED_REPLACEMENT_MESSAGE` (line 71-72): constant for the "restart/redirect is runtime-blocked" error path (used implicitly by callers).

### 8.4 Integration Points

| Import | Module | Purpose |
|--------|--------|---------|
| `tool`, `z` from SDK | Tool factory + Zod |
| `readFile` from `node:fs/promises` | I/O |
| `dirname` from `node:path` | projectRoot derivation |
| `readPersistedDelegations` from `../../task-management/continuity/delegation-persistence.js` | Disk-fallback |
| `redactTextSecrets` from `../../shared/security/redaction.js` | Secret redaction in outputs |
| `renderToolResult`, `error`, `success` from `../../shared/tool-*` | Envelope |
| `Delegation`, `DelegationStatus`, `DelegationTerminalKind` types from `../../shared/types.js` | Domain types |
| `resolveSessionFile` from `../session/session-resolver.js` | Path resolution |
| `safeSessionPath` from `../../features/session-tracker/persistence/atomic-write.js` | Path safety |
| `HierarchyManifest` type from `../../features/session-tracker/types.js` | Manifest type |
| `findStackableSessions`, `findResumableSessions`, `getRetryRecommendation`, `buildStackingGuidanceBanner` from `../../coordination/delegation/session-intelligence.js` | P58 stacking intelligence |
| `HierarchyManifestChildSchema`, `HierarchyManifestChildValidated` from `./readers/types.js` | Zod parsing of manifest children |

**Module-level state:**
- `manifestCache: Map<string, {data, ts}>` (line 19) — per-invocation cache, **cleared at line 492 every execute() call**. So the comment "per-invocation cache" is accurate but the cache is functionally useless (cleared on every call). **This is F8.1 below.**
- `delegationStatusInvocationCounter` (line 462) — P59 C5 entropy counter.

### 8.5 Flaws & Findings

| # | Severity | Flaw | Location | Impact |
|---|----------|------|----------|--------|
| F8.1 | **HIGH** | `manifestCache` is **cleared at the start of every execute()** (line 492). The 5s TTL (line 20) and 10-entry cap (line 21) are **dead code** — the cache is empty when `readManifest` is first called. The entire `manifestCache` infrastructure is inert. | lines 19-21, 191-207, 492 | The cache was probably designed for cross-invocation caching, but the per-invocation clear defeats it. Either remove the cache or remove the clear. |
| F8.2 | **HIGH** | `manifestCache` uses `Map` without a max-size eviction policy beyond the simple "evict oldest" (line 201-204). This is the **Map insertion-order** eviction, not LRU. The "oldest" is whichever key was inserted first, not the least-recently-used. | lines 201-204 | Cache policy is FIFO, not LRU, despite the intent. |
| F8.3 | **MED** | `validateDelegationStatus` (line 137-140) silently maps unknown statuses to `"running"`. This is the "Safe fallback" but **masks data corruption**. If a child record has `status: "weird-state"`, the tool reports it as running. | line 139 | Silent data masking. Should at minimum log a warning. |
| F8.4 | **MED** | `mergeAllDelegations` (line 400-454) is **complex precedence logic** (lines 415-441) that picks between manager/persisted/tracker records. The two branches (lines 417-426, 427-437) are mirror-images — easy to mis-edit. | lines 415-441 | High maintenance burden. Unit test coverage critical. |
| F8.5 | **MED** | `mergeAllDelegations` mutates `delegation` objects (line 447, 449, 572, 574) — sets status to "cancelled" if the manager doesn't know about a "dispatched"/"running" delegation. Mutation of input data is surprising. | lines 447, 449, 572, 574 | Mutation bug class. The objects come from `manager.getAllDelegations()` and `readPersisted()` — mutating them can corrupt upstream state. |
| F8.6 | **MED** | `handleControl` (line 693-759) for `restart`/`resume`/`chain`/`adjust-prompt`/`change-agent` returns `"restart/redirect requires coordinator-backed manager control API"` (line 758) when `manager.controlDelegation` is absent. The error is misleading — the function also fails for `abort`/`cancel` if `manager.controlDelegation` is absent, falling through to the manual `markAborted`/`markCancelled` path. So `abort`/`cancel` are not blocked, but the error message implies they are. | line 758 | Misleading error. |
| F8.7 | **MED** | `handlePeek` (line 835-864) cannot resolve `delegationId → paneId` (line 848-850 admits it). Callers must pass `paneId` explicitly. This **inverts the natural usage**: a user asks "what's happening in delegation X?" but the API forces them to know the paneId. | lines 843-850 | UX gap. The fix is to extend the manager API with a `getPaneId(delegationId): string` method. |
| F8.8 | **LOW** | `UNSUPPORTED_REPLACEMENT_MESSAGE` (line 71-72) is **exported but never used in this file**. It is intended for callers (other tools, tests) that need a stable error string. The const is correct but unverified as the canonical source. | lines 71-72, 823 | Dead export. |
| F8.9 | **LOW** | `renderDelegationV2` (line 126-132) includes `escalationLevel: deps.getEscalationLevel?.(delegation.id) ?? null` (line 131). The escalation module is not imported or referenced. | line 131 | External coupling assumption. |
| F8.10 | **LOW** | `getHierarchyContext` (line 289-398) for `descendantCount` (line 341-360) walks all children and follows parent chains. The cycle detection (line 347-350) is per-iteration, not per-traversal. If two children share a parent (common case), the second walk re-encounters the same parents. | lines 341-360 | Performance under deep manifests. |
| F8.11 | **LOW** | `getStatus` for a `delegationId` (line 522) falls back to `readPersisted` only if not found in manager (line 525). But `mergeAllDelegations` is used for the `list` action (line 656). The two paths have different merge semantics — `get` uses ad-hoc merge at lines 535-562, `list` uses the full `mergeAllDelegations`. | lines 535-562, 656 | Inconsistent merge policy between `get` and `list`. |
| F8.12 | **LOW** | `handleControl` is **declared `async` but returns synchronously** (line 693 → no `await` until line 733). Mixed sync/await. | line 693 | Cosmetic. |
| F8.13 | **LOW** | The `progress` action (line 875-906) does **not** include `prompt` or any other PII; it's safe. But `find-stackable` and `list` include `taskCommand` and `delegateTaskCommand` (line 685, 804-805) which may embed user prompts. These pass through `redactTextSecrets` only for `retryRecommendation` (line 633) — the stackable commands themselves are **not** redacted. | lines 685, 804-805, 633 | Secret leak risk. The `taskCommand` includes `prompt: "..."` from the user. |
| F8.14 | **LOW** | The hardcoded message (line 71-72) is duplicated in spirit across at least 3 places: `handleControl` line 758 (`"restart/redirect requires..."`), this constant, and possibly the `control` action response. | many | DRY violation. |
| F8.15 | **INFO** | The `find-stackable` action (line 765-820) returns a `banner` as the success message (line 794). The `banner` is a human-readable string from `buildStackingGuidanceBanner` (line 784). Mixing human-readable banners with structured data in the success message is non-standard. | line 794 | UX. |

---

## Section 9 — `session-delegation-query.ts` (covered in Section 5)

Covered above.

---

## Section 10 — `hivemind-session-view.ts` (covered in Section 6)

Covered above.

---

# Cross-Tool Overlap Matrix

This matrix shows which tools call which other tools or share dependencies. **"Imported by"** indicates that tool A's source code imports from tool B's source file (a direct cross-tool call). **"Same deps"** indicates that A and B both import a shared library, not each other.

| Tool A | Imports Tool B Directly? | Shared Internal Deps | Notes |
|--------|--------------------------|----------------------|-------|
| `tmux-copilot.ts` | **No** (no other tool imports it; no other tool file is in its imports) | `getSessionManagerAdapter`/`setSessionManagerAdapter` from `../features/tmux/types.js` (P51 adapter), `getManualOverrideState`/`setManualOverrideState` from `../features/session-tracker/index.js`, `resolveSessionToPaneId`/`getSendPrompt` from `../features/tmux/types.js` | Self-contained. The `__setTmuxMultiplexerForTesting` seam is the only external entry. |
| `tmux-state-query.ts` | **No** | `getSessionManagerAdapter` from `../features/tmux/types.js` (only the bridge check — never used) | Self-contained. **Stub tool — see F1.5.1.** |
| `session-tracker.ts` | **No** | `SessionTrackerInputSchema` (Zod), `safeSessionPath`/`sessionTrackerRoot`, `isValidSessionID`, `resolveSessionFile` | Imports from the schema-kernel and session-tracker persistence modules — **not** from other tool files. |
| `session-hierarchy.ts` | **No** | `SessionHierarchyInputSchema`, `isValidSessionID`, `resolveSessionFile`, `ChildRef` | Same internal pattern. Duplicates `findHierarchyEntry` (F3.8). |
| `session-context.ts` | **No** | `SessionContextInputSchema`, `safeSessionPath`/`sessionTrackerRoot`, `isValidSessionID`, `resolveSessionFile` | Duplicates `findHierarchyEntry` and `readContinuity` from session-hierarchy (F3.8, F4.8, F4.9). |
| `session-delegation-query.ts` | **No** | `safeSessionPath`/`sessionTrackerRoot`, `resolveSessionFile`, `isValidSessionID`, `HierarchyManifest` types, dynamic `SessionDelegationQueryInputSchema` | Self-contained. |
| `hivemind-session-view.ts` | **No** | `SessionViewInputSchema`, `resolveSessionFile` | Self-contained. |
| `delegate-task.ts` | **No** | `renderToolResult`, `error`/`success` | Self-contained. **Wired via `coordinator.dispatch`** — the only tool that uses an injected dependency (Coordinator). |
| `delegation-status.ts` | **No** (imports `readPersistedDelegations` from `../../task-management/continuity/delegation-persistence.js`, not from another tool) | `resolveSessionFile`, `safeSessionPath`, `findStackableSessions`/`findResumableSessions`/`getRetryRecommendation`/`buildStackingGuidanceBanner` from `session-intelligence.js`, `HierarchyManifestChildSchema` from `./readers/types.js` | The most-decorated tool — uses 6 distinct internal modules. **Has its own validation (F8.3) and merge logic (F8.4, F8.5).** |

### Functional Overlap (tools that could be used interchangeably for a given query)

| Query Intent | Primary Tool | Fallback / Complementary | Notes |
|--------------|--------------|--------------------------|-------|
| "List all delegations" | `session-delegation-query` (list) | `delegation-status` (list) | The two have **different merge semantics** (F8.11). session-delegation-query is session-tracker-only; delegation-status merges manager+persisted+session-tracker. |
| "Get a delegation by id" | `delegation-status` (get/status) | `session-delegation-query` (get) | session-delegation-query returns **session-tracker shape**; delegation-status returns **Delegation shape**. Callers must know which one. |
| "List all sessions" | `session-tracker` (list-sessions) | `session-hierarchy` (get-children for root) | session-tracker uses index-first + directory fallback (F2.3); session-hierarchy works from continuity files. |
| "Find a session" | `session-tracker` (search-sessions) | `session-context` (cross-reference) | session-tracker matches in markdown content; session-context matches in tool summary names. Different lexical domains. |
| "Get session metadata" | `session-tracker` (get-status) | `session-context` (synthesize-context) | get-status returns structured JSON; synthesize-context returns a markdown dump (F4.5). |
| "Find related sessions" | `session-context` (find-related) | None | Unique. Requires project-continuity.json index (F4.1). |
| "Get children of a session" | `session-hierarchy` (get-children) | `hivemind-session-view` (get → delegations) | session-hierarchy returns per-child status; hivemind-session-view returns the full unified view. session-hierarchy has F3.1, F3.2 bugs. |
| "Navigate to root" | `session-hierarchy` (get-parent-chain) | None | Unique. |
| "Compute max depth" | `session-hierarchy` (get-delegation-depth) | None | Unique. |
| "Get manifest" | `session-hierarchy` (get-manifest) | None | Unique. |
| "Stack on prior session" | `delegation-status` (find-stackable) | None | Drives the P58 stacking intelligence. |
| "Live peek at pane" | `tmux-copilot` (peek / peek-by-session) | `delegation-status` (peek) | tmux-copilot is **adapter-based** (live); delegation-status is **deps-based** (`getPaneContent` callback). Two parallel peek surfaces — F1.5.4 is the inverse, where tmux-state-query is a stub but no other tool covers its purpose. |
| "Forward prompt to delegate" | `tmux-copilot` (forward-prompt) | None | Unique. |
| "Manual override session" | `tmux-copilot` (take-over / release) | None | Unique. P58 G5. |
| "List tmux sessions" | `tmux-state-query` (list-sessions) | **None — STUB** (F1.5.1) | tmux-state-query returns `[]`. No fallback exists. **P58.9 UAT gap.** |
| "Get tmux session" | `tmux-state-query` (get-session) | **None — STUB** (F1.5.1) | Returns `null`. No fallback. |
| "Get tmux summary" | `tmux-state-query` (get-summary) | **None — STUB** (F1.5.1) | Returns zeros. No fallback. |
| "Unified session view" | `hivemind-session-view` (get) | None | Unique by design (D-11). Has F6.1-F6.3. |
| "Delegate a task" | `delegate-task` | None | Unique. |
| "List live tmux panes" | `tmux-copilot` (list-panes) | None | Adapter-based. |
| "Send keys to pane" | `tmux-copilot` (send-keys) | None | Adapter-based. |

### Code-Level Cross-Tool Coupling

Grep result (June 5 2026, this audit):

- **No two tool files import each other directly.** Every tool imports from `../../shared/`, `../../features/session-tracker/`, `../../features/tmux/`, `../../coordination/`, `../../schema-kernel/`, or `../../task-management/` — never from another file in `src/tools/`. This is **good CQRS discipline**: the tool layer is a thin shell over shared domain modules.
- **Internal duplication (DRY violations):** `findHierarchyEntry` is duplicated in `session-hierarchy.ts:61-75` and `session-context.ts:79-93`. `readContinuity` is duplicated in `session-hierarchy.ts:78-123` and `session-context.ts:96-141`. `discoverRootSessions` is duplicated in `session-tracker.ts:236-275` and `session-delegation-query.ts:263-284`. Recommend extracting to `src/tools/session/_helpers.ts` or similar.
- **The `session-resolver.ts` module is the de facto shared library** — imported by 7 of 9 tools (the 2 tmux tools and `delegate-task` do not need it). This is the only `src/tools/`-internal file that is shared across siblings, and it is correctly factored.
- **Zod schemas live in `../../schema-kernel/`** — referenced by all 4 session tools and the hivemind-session-view tool. The `session-delegation-query.ts` uses a **dynamic import** (F5.1) while the rest use static imports — inconsistent.

### Summary Statistics

- **Total LOC across 9 files:** ~3,092 (session-tracker 423 + session-hierarchy 283 + session-context 301 + session-delegation-query 284 + hivemind-session-view 155 + tmux-copilot 470 + tmux-state-query 162 + delegate-task 110 + delegation-status 906)
- **Total actions:** 32 distinct (6 + 4 + 4 + 2 + 1 + 9 + 3 + 1 + 8 = 38 if counting `tmux-copilot` as 9 and `delegation-status` as 8; 32 unique by deduplication since some are aliases like `status`/`get`)
- **Total flaws found:** 70+ (range severity INFO → CRITICAL)
- **Critical flaws:** 1 (F1.5.1 — tmux-state-query is a stub)
- **High flaws:** 5 (F1.1, F1.5.2, F3.1, F4.1, F8.1, F8.2 — overlap on some)
- **Files with stub or non-functional actions:** `tmux-state-query.ts` (3 of 3 actions are stubs)
- **Files with dynamic imports:** `session-delegation-query.ts` (1 dynamic import)
- **Files using factory pattern:** `session-tracker.ts`, `session-hierarchy.ts`, `session-context.ts`, `session-delegation-query.ts`, `hivemind-session-view.ts`, `delegate-task.ts` — all session tools and `delegate-task` use `createXxxTool(projectRoot, ...)`. **The 2 tmux tools and `delegation-status.ts` export single tool instances** (`tmuxCopilotTool`, `tmuxStateQueryTool`, `createDelegationStatusTool`).

---

# Audit Complete

**Priority for P58.9 UAT:** Address F1.5.1, F1.5.2, F1.5.4, F1.5.8 — `tmux-state-query.ts` is the only tool in the 9-file scope that is fundamentally non-functional. The UAT likely needs to wire `SessionManagerAdapter.getSessions()` and `getSummary()` to deliver real data.

**Secondary priorities:**
- F8.1: Inert `manifestCache` in `delegation-status.ts` — remove or restore.
- F8.5: Mutation of delegation records in `mergeAllDelegations` — clone before mutating.
- F6.2, F6.3: `hivemind-session-view.ts` filter directions — review against D-11.
- F3.8, F4.8, F4.9, F5.7: DRY violations across session tools.

**No CRITICAL blockers outside tmux-state-query.** The other 8 tools are functional; the flaws are quality-of-life and edge-case.
