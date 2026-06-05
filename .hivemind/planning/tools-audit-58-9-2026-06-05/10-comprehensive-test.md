[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Comprehensive Test — 9-Tool Deep Audit (UAT Phase 58.9)

**Date:** 2026-06-05
**Subagent:** hm-codebase-mapper
**Scope:** 9 tools (3 session, 1 hivemind, 2 tmux, 2 delegation, 1 session-delegation)
**Method:** Direct source read (lines 1-end of each file), cross-referenced with shared helpers and integration owners
**Phase 58.9 UAT Focus:** `src/tools/tmux-copilot.ts` and `src/tools/tmux-state-query.ts` (covered in §1 and §2; audit also includes the remaining 7 tools for cross-cutting context)

---

## 0. Reading Convention

For every tool I report:
1. **Actions** — discriminated union values the tool exposes, with the dispatch site (file:line).
2. **Args** — the Zod schema in TS terms; what is required vs optional; what defaults apply.
3. **Status values** — every status enum literal the tool can return, accept, or filter on. Includes fallback values when parsing fails.
4. **Integration points** — every module the tool calls into, with file:line where the import or call site lives.
5. **Flaws** — what the source actually does that is wrong, dangerous, lossy, undocumented, or contradicting the contracts of the things it depends on.

All line numbers reference the file paths I read on 2026-06-05. File totals are from the same reads.

**Severity legend for flaws:**
- **CRITICAL** — security or correctness break; requires immediate fix
- **HIGH** — silent data loss or wrong result; can mislead users without error
- **MEDIUM** — subtle bugs, drift, or missing docs; not an emergency
- **LOW** — code smell, polish, or stylistic issues

---

## 1. `src/tools/tmux-copilot.ts` (563 lines) — Phase 58.9 UAT PRIORITY

### 1.1 Tool entry point

- Constant export: `tmuxCopilotTool: ReturnType<typeof tool>` at `:198` — this is a constant, not a factory. Compare with `createSessionTrackerTool(projectRoot)` and `createDelegationStatusTool(manager, deps)`. The tmux tool is parameterized via the bridge (`setSessionManagerAdapter`) rather than a factory closure.
- Zod schema: 9-action discriminated union at `:152-162`.
- 4 actions at module top (P43), then P58 added 4 more (forward-prompt, take-over, release, peek), then P59 added peek-by-session.
- Module doc at `:1-31` documents the full phase history (P43 → P51 → P58 → P58.8 → P59).

### 1.2 Actions (full set, dispatch at `:249-465`)

| Action | Schema line | Handler line | Status values returned |
|--------|-------------|--------------|-----------------------|
| `send-keys` | `:83-88` | `:250-261` | `{ sent: true }` / `{ sent: false, error: { message } }` |
| `list-panes` | `:90-93` | `:262-286` | `{ panes: PaneState[] }` / `{ available: false, reason: "tmux-not-installed" \| "tmux-timeout" \| "tmux-error", error: { message } }` |
| `compute-grid` | `:95-98` | `:287-290` | `{ commands: SplitCommand[] }` |
| `respawn` | `:100-103` | `:291-300` | `{ respawned: true, paneId }` / `{ respawned: false, error: { reason: "session-not-closed" } }` |
| `forward-prompt` | `:106-111` | `:301-348` | `{ paneId, deliveredAt, byteLength }` / `{ suppressed: true, reason: "manualOverride" \| "session-not-found", paneId, textPreview, evaluatedAt }` / `{ sent: false, error }` |
| `take-over` | `:118-124` | `:349-385` | `{ sessionId, paneId, takenBy, takenAt, promptDelivered, promptMode, promptError? }` |
| `release` | `:127-130` | `:386-393` | `{ sessionId, releasedAt }` |
| `peek` | `:133-141` | `:394-432` | `{ paneId, format, content, capturedAt, byteLength }` (raw mode) / `{ paneId, format, activity: {...} }` (summary mode) / `{ paneId, format, activity: { note: "No session registered..." } }` |
| `peek-by-session` | `:145-150` | `:433-464` | Same as peek, but with `sessionId` field and `paneId` resolved internally |

### 1.3 Args schema (framework-side, `:210-219`)

```ts
args: {
  action: string
  paneId?: string
  text?: string
  literal?: boolean
  mainPaneId?: string
  tree?: unknown  // PaneTreeNode recursive
  sessionId?: string
  maxBytes?: number
}
```

Note that this is a structural hint; the canonical Zod parse happens inside `execute()` via `TmuxCopilotActionSchema.safeParse` (`:234`).

### 1.4 Permission gate (P59 R1, `:67-71, :221-231`) — CRITICAL FOCUS

- **No agent-name check.** Every agent (including `build`, `hm-executor`, gsd-debugger, the `user` agent, and the `__user__` agent) can call any action.
- The only denial is `!callerAgent` at `:227`, which returns `{ error: { kind: "permission-denied", agent: "unknown" } }`.
- The `:67-71` comment block documents the P59 R1 decision explicitly: "Tier-based agent-name restrictions removed in P59 R1."
- This is a **SECURITY-DEFINING change documented in source.** The risk is that any future agent (even one running untrusted user code) can `send-keys` to a tmux pane if it has the tool loaded. See FLAW-1.1.
- The module doc at `:10-12` mentions `REQUIRES_PERMISSIONS` as a previously-exported const that future harness-level enforcement layers could consume, but the export is no longer present in the file. The mitigation has been removed without a replacement.

### 1.5 Status values

The tool does not use a canonical `DelegationStatus` enum. The "status-like" values are:

| Status | Where | Notes |
|--------|-------|-------|
| `tmux-not-wired` | `:245` | Adapter is null — graceful unavailable |
| `tmux-not-installed` | `:275` | ENOENT/enoent error code or message match |
| `tmux-timeout` | `:278` | ETIMEDOUT/timeout error code or message match |
| `tmux-error` | `:282` | Any other adapter error |
| `invalid-input` | `:237` | Zod parse failure |
| `permission-denied` | `:229` | callerAgent is null/undefined |
| `manualOverride` | `:322` | forward-prompt suppression |
| `session-not-found` | declared in `TmuxCopilotResult` at `:178` but never returned — dead code (FLAW-1.10) |
| `session-not-closed` | `:296` | respawn pre-condition failure |
| `sent: true \| false` | `:253, :257` | send-keys result flag |

### 1.6 Integration points

| Call | Target |
|------|--------|
| `getSessionManagerAdapter` (`:243`) | `src/features/tmux/types.ts` — returns null if not wired |
| `setSessionManagerAdapter` (via `__setTmuxMultiplexerForTesting` at `:562`) | Same module — test seam |
| `getManualOverrideState`, `setManualOverrideState` (`:42, :320, :354, :388`) | `src/features/session-tracker/index.ts` |
| `resolveSessionToPaneId`, `getSendPrompt`, `getSessionMessagesFetcher`, `getSessionPaneRegistryEntries` (`:43, :363, :416, :436, :478`) | `src/features/tmux/types.ts` |
| `renderToolResult` (`:41, :226, :228, :236, :244, :253, :262, :275, :278, :281, :289, :294, :299, :322, :336, :343, :378, :389, :403, :419, :440, :449, :481, :520`) | `src/shared/tool-helpers.js` |
| `Buffer.byteLength` (`:333, :402, :448`) | Node.js stdlib |

### 1.7 Flaws

- **FLAW-1.1 — [CRITICAL] Permission gate is now advisory only (P59 R1).** The comment at `:67-71` declares the previous tier system "removed." A null `agent` is the only failure. If the OpenCode runtime ever instantiates this tool with a `context` that lacks `agent`, the tool refuses. But ANY agent name in `context.agent` is allowed, including `"untrusted-eval-target"` or arbitrary user-provided strings. There is no allowlist or denylist. The export `REQUIRES_PERMISSIONS` mentioned in the module doc (`:10-12`) is no longer defined — the comment block says it WAS exported but the file no longer has that export. The mitigation has been removed without a replacement. **Phase 58.9 UAT should validate this is intentional and document the threat model.**
- **FLAW-1.2 — [MEDIUM] `forward-prompt` writes the timestamp sentinel into the pane (`:331-332`).** The `[orchestrator-forward <ISO>]` prefix is prepended to every forwarded prompt. This sentinel "contaminates the delegate's transcript with an automation-source marker" (per the comment at `:309-310`). There is no way to opt out. The sentinel is hard-coded.
- **FLAW-1.3 — [HIGH] `take-over` always sets `takenBy: "human-operator"` (`:357, :381`).** The schema accepts any caller via the agent check at `:227`, and `setManualOverrideState` is called with `takenBy: "human-operator"` regardless of the actual caller. If an automated agent (e.g., a CI runner that happens to have this tool loaded) takes over, the audit record says "human-operator." The caller identity is not recorded. The session-tracker downstream cannot tell whether a human or an agent took over.
- **FLAW-1.4 — [HIGH] `take-over` injects a prompt via the module-level `sendPrompt` function (`:365-372`).** `getSendPrompt()` is wired from `plugin.ts`. If it is not wired, `promptError: "sendPrompt not wired"` is returned (`:374`), but `setManualOverrideState` is still set to `manualOverride: true` (`:354`). The take-over succeeds even when the prompt injection fails. The caller has to inspect `promptError` to know the prompt was lost.
- **FLAW-1.5 — [MEDIUM] `peek` summary heuristic is fragile (`:494-519`).** "files" is computed by inspecting `t.args` for any string that contains `/` or `.`. This matches ANY tool argument that has a path-looking string, including false positives like a tool message that includes a URL `"https://example.com/foo"`. The "files touched" set is a heuristic, not a real file-list diff.
- **FLAW-1.6 — [MEDIUM] `peek` returns a default-formatted note when no session is registered (`:419-429`).** The note `"No session registered for this paneId. Use peek-by-session if you have a sessionId."` is included in the `activity` field. Consumers parsing `activity` programmatically will get a `note` string mixed with structured data. The `note` field is not documented in `TmuxCopilotResult` (`:168-184`).
- **FLAW-1.7 — [MEDIUM] `peek` summary mode is async but `peek` raw mode is sync (`:399-412`).** Raw mode calls `adapter.getLatestCapture?.(input.paneId)` directly. If the adapter is async-only, this will block. The `?.` optional-chaining suggests the adapter interface is still in flux.
- **FLAW-1.8 — [MEDIUM] `list-panes` error classification is heuristic (`:271-279`).** `code === "ENOENT"` and `/enoent/i.test(message)` are matched. But Node.js does not always set `code = "ENOENT"` for tmux installation issues — sometimes the failure is a `spawn` error without a code. The string match is a fallback. A tmux-not-installed error from a custom build of tmux with a different error message would be classified as a generic `tmux-error`.
- **FLAW-1.9 — [LOW] `respawn` returns `{respawned: false, error: {reason: "session-not-closed"}}` but does not surface WHY the session is not closed (`:293-298`).** The user gets a reason but no diagnostic. If the session is closed but the manifest is stale, the user has no way to know.
- **FLAW-1.10 — [LOW] `peek-by-session` resolves via `resolveSessionToPaneId` (`:436`).** If the resolution fails, the error envelope is `{error: {kind: "invalid-input", issues: [{code: "custom", message: "..."}]}}` at `:439-443`. But the `issues` field is typed as `z.ZodIssue[]` (`:441`), and the issue is constructed with `as unknown as z.ZodIssue` (`:442`). This is a type lie — the issue is not a real `ZodIssue`, just a structurally similar object.
- **FLAW-1.11 — [LOW] `buildSessionSummary` returns an empty `activity.toolCallCount: 0` when fetcher is unwired (`:486-491`).** The `toolCallCount` field is documented in `activity` but is missing in the unwired-fetcher branch (only `messageCount: 0, toolCalls: [], lastAssistantMessage: null, files: []` — no `toolCallCount`). Consumers expecting the same shape across wired/unwired states will get an undefined field.
- **FLAW-1.12 — [HIGH] `tmuxCopilotTool` is module-level state (`:198`).** There is no factory function, so the tool is shared across all consumers that import it. If two plugins want different adapters, they conflict. Compare with `createSessionTrackerTool(projectRoot)` which produces per-call instances.
- **FLAW-1.13 — [LOW] Hard-coded text slice on forward-prompt (`:326`).** `textPreview: input.text.slice(0, 80)` is fixed at 80 chars. The schema does not allow overriding the preview length. If a consumer wants a longer or shorter preview, they cannot.
- **FLAW-1.14 — [LOW] `peek-by-session` raw mode slices `input.maxBytes` from the END (`:453-455`).** `input.maxBytes && sessionContent.length > input.maxBytes ? sessionContent.slice(-input.maxBytes) : sessionContent`. This is a "tail" slice, not a "head" slice. The peek action in `delegation-status.ts:855-857` does the same. But raw `peek` at `:399-411` does NOT slice at all — it returns the full content. Three peek implementations, three truncation semantics. Inconsistent.
- **FLAW-1.15 — [LOW] `session-not-found` reason declared but never returned (`:178`).** `TmuxCopilotResult` union at `:178` includes `{ suppressed: true; reason: "manualOverride" | "session-not-found"; ... }` but the handler at `:320-329` only ever returns `"manualOverride"`. The `"session-not-found"` branch is dead code.
- **FLAW-1.16 — [LOW] `peek` summary mode fetcher wiring is fragile (`:480-493`).** The "summary" mode requires both `resolveSessionToPaneId` (`:478`) and `getSessionMessagesFetcher` (`:479`) to be wired. If only one is wired (e.g., the registry has the pane but no fetcher), the function returns the "fetcher not wired" note. But it does so after first resolving the paneId successfully — a wasted lookup.

---

## 2. `src/tools/tmux-state-query.ts` (162 lines) — Phase 58.9 UAT PRIORITY

### 2.1 Tool entry point

- Constant export: `tmuxStateQueryTool: ReturnType<typeof tool>` at `:99`.
- 3 actions via Zod discriminated union (`:63-67`).
- Module doc at `:1-16` describes the tool as "read-only session metadata" with "permission-gated: only orchestrator-tier agents may invoke." But the implementation at `:26-27` says "Agent-name permission gate removed in P59 R1 — all agents allowed." This is a documentation drift (FLAW-2.1).

### 2.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `list-sessions` | inline at `:136-142` | — | — |
| `get-session` | inline at `:144-150` | — | sessionId |
| `get-summary` | inline at `:152-159` | — | — |

### 2.3 Args schema

```ts
args: {
  action: enum["list-sessions","get-session","get-summary"]
  sessionId?: string
}
```

### 2.4 Status values (none of substance)

| Status | Where | Notes |
|--------|-------|-------|
| `tmux-not-wired` | `:131` | Returned when adapter is null |
| `invalid-input` | `:123` | Zod parse failure |
| `permission-denied` | declared in `TmuxStateQueryResult` at `:76` but never returned | Dead code (FLAW-2.2) |
| `sessions: []`, `session: null`, `summary: {total: 0, active: 0, spawning: 0}` | `:142, :150, :158` | All return zero/empty data — the tool is a no-op stub |

### 2.5 Integration points

| Call | Target |
|------|--------|
| `getSessionManagerAdapter` (`:129`) | `src/features/tmux/types.ts` |
| `renderToolResult` (`:20`) | `src/shared/tool-helpers.js` |

That is the complete integration surface. The tool is a single dependency on the adapter, which is the only way to get real session data — and the adapter does not expose session enumeration. So the tool returns empty results by design (per comments at `:137-141, :145-149, :152-156`).

### 2.6 Flaws

- **FLAW-2.1 — [MEDIUM] Module doc lies about permission model (`:1-16`).** Doc says "Permission-gated: only orchestrator-tier agents may invoke." Code comment at `:26-27` says the gate was removed. Consumers reading the doc will assume a gate exists; the actual behavior is "all agents allowed." The doc was not updated when the gate was removed in P59 R1. **Phase 58.9 UAT should either update the doc to match the implementation, or reinstate the gate as documented.**
- **FLAW-2.2 — [MEDIUM] `permission-denied` is in the result union but never returned (`:76, :99-161`).** `TmuxStateQueryResult` includes `{ error: { kind: "permission-denied"; agent: string } }` (`:76`). The handler at `:113-160` never constructs or returns this. The `agent` field is `_context.agent` discarded. The type union advertises a behavior the implementation does not provide.
- **FLAW-2.3 — [CRITICAL] All three actions return empty data (`:142, :150, :158`).** The comments at `:137-141, :145-149, :152-156` admit the adapter does not expose session enumeration, list, or summary. The tool is a documented facade that returns zero data. A consumer calling `tmux-state-query` for live data is misled by the description: "Read-only session metadata query ... Returns tracked session information." The information returned is `[]`, `null`, and `{total: 0, active: 0, spawning: 0}`. **Phase 58.9 UAT should decide: implement the adapter extension, or remove the tool from the surface.**
- **FLAW-2.4 — [LOW] `SessionSummary` type is exported but never constructed (`:37-44, :99-161`).** The interface at `:37-44` has fields: `sessionId, agent, delegationId, paneId, directory, spawnTime`. None of the action handlers create or return a `SessionSummary`. The exported type is unused except as documentation.
- **FLAW-2.5 — [LOW] `get-session` accepts `sessionId` but the type is optional (`:54-57`).** Schema says `sessionId: z.string().min(1).optional()`. If absent, the action returns `{session: null}`. But the user provided no argument, so the meaning is unclear. A user requesting `get-session` without a `sessionId` is calling the action wrong; the action should refuse, not return `null`.
- **FLAW-2.6 — [LOW] `tmuxStateQueryToolName` export is unused (`:91`).** `export const tmuxStateQueryToolName = "tmux-state-query"`. There is no consumer in the file. There is a similar `tmuxCopilotTool` constant. The `ToolName` export pattern is not used by any consumer. It is a code smell.
- **FLAW-2.7 — [LOW] No factory pattern (`:99`).** Like `tmux-copilot.ts`, the tool is a module-level constant. The single `getSessionManagerAdapter()` lookup happens at execute-time, so the tool is "late-bound" to the adapter. This means the tool cannot be instantiated with a different adapter for testing — there is no `__setTmuxMultiplexerForTesting` equivalent. Tests must use the global adapter.

### 2.7 Net Assessment for Phase 58.9 UAT

The two tmux tools together represent the **lowest-value, highest-flaw** subset of the 9-tool surface:

1. **`tmux-copilot.ts`** has the most complex behavior (9 actions, sentinel-injecting forward-prompt, take-over/release/peek triplet) but ships with **no permission gate** and a **hand-coded "human-operator" attribution** that doesn't match the actual caller.
2. **`tmux-state-query.ts`** is documented as a session metadata query but returns empty data for every action.

Phase 58.9 UAT should validate the P59 R1 permission-gate removal is intentional (FLAW-1.1) and decide whether `tmux-state-query` should be implemented or removed (FLAW-2.3). Both questions are P0 because they affect the user-visible security and utility of the tmux surface.

---

## 3. `src/tools/session/session-tracker.ts` (423 lines)

### 3.1 Tool entry point

- Factory: `createSessionTrackerTool(projectRoot: string)` at `:25`.
- Returns a `tool({...})` (OpenCode SDK) with 6 actions.
- Zod schema source: `SessionTrackerInputSchema` from `../../schema-kernel/session-tracker.schema.js` at `:15`.
- Path-safety helpers: `safeSessionPath`, `sessionTrackerRoot`, `isValidSessionID` at `:16-17`.
- Result envelope: `renderToolResult(success|error(...))` at `:18-19`.
- Resolver: `resolveSessionFile` at `:20`.

### 3.2 Actions (dispatch at `:47-55`)

| Action | Handler | Required args | Optional args |
|--------|---------|---------------|---------------|
| `export-session` | `handleExportSession` at `:111` | sessionId | format ("markdown"\|"json") |
| `get-status` | `handleGetStatus` at `:166` | sessionId | — |
| `get-summary` | `handleGetSummary` at `:205` | sessionId | — |
| `list-sessions` | `handleListSessions` at `:236` | (limit) | — |
| `search-sessions` | `handleSearchSessions` at `:277` | query | limit |
| `filter-sessions` | `handleFilterSessions` at `:339` | (filters) | status, agentType, minDepth, maxDepth, timeRange |

Note: `limit` is declared optional in the args schema (`:33`) but the code reads `input.limit` without a fallback for `list-sessions` and `filter-sessions` — see FLAW-3.1.

### 3.3 Args schema

```ts
args: {
  action: string                  // not enum — see FLAW-3.1.1
  sessionId?: string
  query?: string                  // 1..1000 chars enforced inside handler at :278
  limit?: number
  format?: "markdown" | "json"
  status?: string                 // free-form, lowercased inside :345
  agentType?: string              // free-form, lowercased inside :346
  minDepth?: number
  maxDepth?: number
  timeRange?: { after?: string; before?: string }
}
```

### 3.4 Status values (read or filter)

| Status | Where | Notes |
|--------|-------|-------|
| `"active"` | Injected at `:377` for every root session | Hard-coded — does NOT come from any child record |
| `"unknown"` | `:175, :193` | Fallback when continuity JSON omits `status` |
| child statuses: `"completed"`, `"error"`, `"aborted"`, `"cancelled"` | Filtered via `childMeta.status` at `:386` | Read directly from `hierarchy-manifest.json` children map |

The `"active"` literal here is a `hivemind-tool` invention — the canonical `DelegationStatus` does not contain `"active"` (see `src/coordination/delegation/types.ts:1-8`). This is a lossy renaming performed silently. See FLAW-3.2.

### 3.5 Integration points (file:line)

| Call | Target |
|------|--------|
| `SessionTrackerInputSchema.parse` (`:46`) | `schema-kernel/session-tracker.schema.js` (Zod runtime) |
| `resolveSessionFile` (`:112, :167, :206`) | `src/tools/session/session-resolver.ts` (file enumeration) |
| `safeSessionPath` (`:290, :357`) | `src/features/session-tracker/persistence/atomic-write.js` |
| `sessionTrackerRoot` (`:239, :262, :281, :343, :352`) | same atomic-write module |
| `isValidSessionID` (`:289, :356`) | `src/features/session-tracker/types.js` |
| `matter` from `gray-matter` (`:14, :118, :211`) | frontmatter parser for main `.md` files |
| `readFile` / `readdir` / `access` from `node:fs/promises` (`:12`) | filesystem reads |
| `resolve` from `node:path` (`:13`) | path construction for project-continuity.json at `:239` |
| `renderToolResult`, `success`, `error` | `src/shared/tool-helpers.js`, `src/shared/tool-response.js` |

### 3.6 Flaws

- **FLAW-3.1 — [HIGH] Limit is required but typed optional.** `args.limit` at `:33` is `tool.schema.number().optional()`, and the schema at `SessionTrackerInputSchema` may also allow it to be missing. But `handleListSessions` slices with `allSessions.slice(0, limit)` (`:248`) and `handleFilterSessions` slices with `filtered.slice(0, inputAny.limit)` (`:418`) without a default. If the Zod schema ever lets `limit` through as `undefined`, both handlers will pass `undefined` to `Array.prototype.slice`, returning `[]`. The tool will silently report "Found 0 sessions" for valid input. The same omission exists in `handleSearchSessions` (`:325`) where `matches.slice(0, limit)` will be `[]` if `limit` is undefined.
- **FLAW-3.2 — [HIGH] Hard-coded "active" status (line `:377`).** Every root session is reported with `status: "active"` regardless of whether it has children, has been completed, or has been archived. The schema at `.hivemind/state/session-continuity.json` (or the local MD's frontmatter) may carry a real status. This is fabricated data.
- **FLAW-3.3 — [LOW] `get-status` for child sessions does not use manifest data (`:181-198`).** For a child session, the handler reads `resolved.childRecord.status` but the `turnCount` and `childCount` come from the in-file child record, not the manifest. The manifest is the source of truth for cross-session aggregation; the two will diverge.
- **FLAW-3.4 — [HIGH] `search-sessions` is unindexed and unbounded (`:282-330`).** It walks every `ses_*` directory, reads every `${sessionId}.md` and every child `.json` file. There is no parallelism, no short-circuit by `limit`, and the inner loop breaks at the first match per file (`:308`) but the outer loop continues until the directory is fully scanned. With many sessions and large `.md` files (the warning at `:295` is emitted but not enforced), this is O(sessions × file_size).
- **FLAW-3.5 — [MEDIUM] `filter-sessions` timeRange may produce false positives.** `timeRange.after` and `timeRange.before` are parsed via `new Date(input).getTime()` (`:347-348`). If the strings are invalid dates, `getTime()` returns `NaN`. The comparisons `updated < afterDate` and `updated > beforeDate` will be `false` for `NaN` comparisons, but `if (updated === undefined) return false` (`:411`) will reject every match lacking a `lastUpdated` — meaning most root sessions with no `manifest.lastUpdated` will be filtered OUT. This is a silent behavior, not surfaced as a warning.
- **FLAW-3.6 — [MEDIUM] `searchChildJsonFiles` swallows errors silently (`:105, :107`).** Both inner and outer `catch {}` blocks discard information. A user searching for content in a session whose `.json` is corrupt will see no error and no result. There is no `fileWarnings` for unreadable child files (unlike the `.md` warning at `:295`).
- **FLAW-3.7 — [LOW] `export-session` does not validate format values (`:115-160`).** If `format` is anything other than `"json"`, the handler returns the markdown path. The Zod schema at `tool.schema` allows only `"markdown" | "json"` (`:34`), so this is enforced at parse time. But the inner `handleExportSession` does not re-validate, and if called directly via test seams it will accept any string. This is a leaky abstraction.
- **FLAW-3.8 — [LOW] `get-summary` builds a "frontmatter" object that includes `delegatedBy` and `mainAgent` (`:217-226`) but the data shape is `delegatedBy: { agentName, model, tool, description, subagentType }` whereas `get-status` does NOT include these. Two sibling actions return different shapes. Consumers must special-case by action.

---

## 4. `src/tools/session/session-hierarchy.ts` (283 lines)

### 4.1 Tool entry point

- Factory: `createSessionHierarchyTool(projectRoot: string)` at `:33`.
- 4 actions via `tool.schema.enum` (`:38`) — first tool in the audit set to use the framework enum, not a free string.
- Schema source: `SessionHierarchyInputSchema` at `:12`.
- Type imports: `ChildRef` from `src/features/session-tracker/types.js` at `:18`.

### 4.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `get-children` | `handleGetChildren` at `:146` | sessionId | includeStatus |
| `get-parent-chain` | `handleGetParentChain` at `:162` | sessionId | — |
| `get-delegation-depth` | `handleGetDelegationDepth` at `:182` | sessionId | — |
| `get-manifest` | `handleGetManifest` at `:209` | sessionId | — |

### 4.3 Args schema

```ts
args: {
  action: enum["get-children","get-parent-chain","get-delegation-depth","get-manifest"]
  sessionId: string  // required, validated inside each handler
  includeStatus?: boolean  // default-false behavior at :153
}
```

### 4.4 Status values

| Status | Source | Where |
|--------|--------|-------|
| `"unknown"` | Default for missing `record.status` | `:171, :238, :273` |
| Per-child statuses from hierarchy manifest (`status` field on `HierarchyManifestChild`) | Read at `:238` | Map output |
| No terminal state filtering | All statuses pass through; no validation against VALID_DELEGATION_STATUSES | — |

The `includeStatus` flag (`:153`) introduces a subtle bug: when `true`, children without a status inherit `record.status` (the parent's). When `false`, status is omitted. When `undefined` (the default), `includeStatus !== false` evaluates to `true`, so status is included by default. This is consistent but non-obvious.

### 4.5 Integration points

| Call | Target |
|------|--------|
| `SessionHierarchyInputSchema.parse` (`:44`) | `schema-kernel/session-tracker.schema.js` |
| `isValidSessionID` (`:147, :163, :183, :210`) | `src/features/session-tracker/types.js` |
| `resolveSessionFile` (`:79, :172, :212`) | `src/tools/session/session-resolver.ts` |
| `readFile` from `node:fs/promises` (`:11`) | continuity JSON + manifest JSON reads |
| `findHierarchyEntry` (`:61, :94, :112`) | Internal recursive helper, identical to the one in `session-context.ts:79` and `session-tracker.ts` (lacks a unit-test seam) |
| `normalizeChildren` (`:126`) | Shared by all four actions; tolerates both array and object children formats |

### 4.6 Flaws

- **FLAW-4.1 — [HIGH] `handleGetChildren` `delegationDepth` calc is wrong (`:154`).** When the child entry has no `delegationDepth`, the handler computes `(record.delegationDepth ?? 0) + 1`. But `record.delegationDepth` is the depth of the session being queried, not the root. A child at depth 2 of a session at depth 1 will be reported as depth 2 (correct), but a child at depth 0 of a session at depth 0 will be reported as depth 1. This conflates "depth of this session" with "depth of the child" and silently lies when the child record is missing depth metadata. The compute-depth path at `:192-206` does this correctly; the get-children path does not.
- **FLAW-4.2 — [MEDIUM] `computeDepth` MAX_DEPTH is per-process state, not per-call (`:190, :193-195`).** The `COMPUTE_DEPTH_MAX = 100` constant is checked against the running `visited.size` and halts. But `visited: Set<string>` is passed by reference to recursive calls. This means sibling branches share the same `visited` set and the cap is global to one call. This is the correct behavior for cycle protection, but the cap is 100 across the entire tree, not 100 per branch. A wide tree with 100 siblings will appear as "depth 0" because the next recursive call sees `visited.size >= 100` and returns 0 (`:194`). This is a subtle and never-noticed bug.
- **FLAW-4.3 — [MEDIUM] `handleGetParentChain` does not include root metadata (`:165-178`).** The chain walks up via `record.parentSessionID`, but it only includes `sessionId`, `status`, `depth`. The caller cannot recover `parentSessionID` of the parent from this list. A consumer wanting to know "is the third link in the chain a sibling of another child" has to re-call `get-children` for each.
- **FLAW-4.4 — [MEDIUM] `handleGetManifest` fallback path is silent (`:255-281`).** When the manifest file is missing AND the continuity record has no `hierarchy.children`, the function returns a generic `error("Manifest not found...")`. The caller cannot tell whether this is "session exists but has no children" vs "session does not exist." The function is structured to attempt a fallback (continuity-based) but the fallback's `childCount: 0` would have been a valid response, so erroring is too strong.
- **FLAW-4.5 — [LOW] `findHierarchyEntry` uses `any` (`:62, :66`).** The function signature is `Record<string, any> | undefined` and `entry: any; parentId: string | null`. This bypasses the `ChildRef` type that is imported at `:18`. The intended type safety is lost. A test seam is not provided, so the function is unit-test uncovered by the type system.
- **FLAW-4.6 — [MEDIUM] `readContinuity` is duplicated three times (this file, `session-context.ts:96`, and `delegation-status.ts:289-398`).** Three near-identical implementations of "read a session, find it in its root's manifest, return a normalized record." They drift: this file at `:95-105` does NOT use `safeSessionPath` — it uses `resolved.continuityPath`. The other two do the same. But the `findHierarchyEntry` helper inside each is independently copy-pasted. A schema change to `HierarchyManifestChild` requires editing three places.

---

## 5. `src/tools/session/session-context.ts` (301 lines)

### 5.1 Tool entry point

- Factory: `createSessionContextTool(projectRoot: string)` at `:40`.
- 4 actions via `tool.schema.enum` (`:45`).
- Schema source: `SessionContextInputSchema` at `:14`.

### 5.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `find-related` | `handleFindRelated` at `:144` | sessionId | maxRelated |
| `cross-reference` | `handleCrossReference` at `:172` | sessionId | query |
| `synthesize-context` | `handleSynthesizeContext` at `:200` | sessionId | — |
| `aggregate` | `handleAggregate` at `:252` | (groupBy) | groupBy |

### 5.3 Args schema

```ts
args: {
  action: enum["find-related","cross-reference","synthesize-context","aggregate"]
  sessionId?: string  // optional at the schema level — required by some handlers
  query?: string
  maxRelated?: number
  groupBy?: enum["subagentType","status"]
}
```

### 5.4 Status values

| Status | Where | Notes |
|--------|-------|-------|
| `"unknown"` | `:146, :200, :264` | Default for missing fields |
| `"unknown-subagent"` | `:279` | Fallback for child records with no subagentType |
| `"opencode-session"` | `:270` | Hard-coded label for every root session in aggregate-by-subagentType |
| Real child statuses (from `child.subagentType` and `metaRecord.status`) | `:264, :279` | Read from project-continuity.json index |

### 5.5 Integration points

| Call | Target |
|------|--------|
| `SessionContextInputSchema.parse` (`:53`) | `schema-kernel/session-tracker.schema.js` |
| `readProjectIndex` (`:70`) | Reads `project-continuity.json` index (canonical session index) |
| `resolveSessionFile` (`:97, :204`) | `src/tools/session/session-resolver.ts` |
| `readContinuity` (`:96`) | Local function, duplicates `session-hierarchy.ts:78` and `delegation-status.ts:289` |
| `findHierarchyEntry` (`:79`) | Local function, duplicates `session-hierarchy.ts:61` |
| `safeSessionPath` (`:273`) | `src/features/session-tracker/persistence/atomic-write.js` |
| `matter` from `gray-matter` (`:13, :210`) | frontmatter parser |
| `readFile`, `readdir` from `node:fs/promises` (`:11`) | filesystem reads |

### 5.6 Flaws

- **FLAW-5.1 — [CRITICAL] `find-related` is heuristic-only and low-signal (`:144-169`).** Score = `sharedTools.length * 2 + (timeProximity ? 1 : 0)`. Two sessions that share NO tools are returned with score 0 only if they were created within 30 minutes of each other. Two sessions that share 5 tools but are 2 hours apart get score 10. There is no semantic or topical scoring. The function is O(N²) over all sessions in the index; for a 10,000-session project this is 100M comparisons with a single shared-tool object intersection. No parallelism, no short-circuit.
- **FLAW-5.2 — [HIGH] `cross-reference` matches by `toolSummary` keys only (`:185-196`).** The comment at `:175` says "query is a tool/agent name (e.g. 'bash', 'delegate')". But the implementation matches by `t.toLowerCase().includes(searchQuery.toLowerCase())` on tool names. A query like "hm-verifier" (an agent name) will only match if some tool name CONTAINS that string — agent names and tool names are different namespaces. The cross-reference is effectively just "search all tool summary keys for a substring."
- **FLAW-5.3 — [HIGH] `cross-reference` is unbounded (`:194-196`).** `refs: refs.slice(0, 50)` caps the result, but the loop reads every session directory and every continuity JSON to compute matches. There is no pagination. For a project with thousands of sessions, this is slow.
- **FLAW-5.4 — [LOW] `synthesize-context` is markdown-only with no JSON alternative (`:200-249`).** Every other action supports `format: "json"`. This one returns only `{ sessionId, context: markdown }`. The JSON path in `handleGetSummary` (`:205`) and `handleExportSession` is not exposed here.
- **FLAW-5.5 — [CRITICAL] `aggregate(subagentType)` overcounts (`:268-287`).** Every root session is counted as `"opencode-session"` at `:270`, then for each root session, every child in its manifest is counted under its `subagentType`. But a root session that is ALSO a child of another root session (multi-root scenario) will be counted twice: once as `"opencode-session"` and once as its real subagentType. The `for (const rootId of Object.keys(sessions))` loop iterates ALL sessions in the index, including those that are children of other roots. This produces an inflated count.
- **FLAW-5.6 — [MEDIUM] `TIME_PROXIMITY_MS` is 30 minutes, hard-coded (`:38`).** This is a magic number, not configurable. A 45-minute gap will not register as "related by time" even though the user may want it to. No env override.
- **FLAW-5.7 — [LOW] `aggregate` mutates `counts` and returns sorted object (`:289-292`).** `Object.fromEntries(Object.entries(counts).sort(...))` is fine, but the sort comparator `(a, b) => b - a` works on numeric values; if any value is `undefined` or `NaN` the sort is unspecified. Since the incrementing pattern is `(counts[k] ?? 0) + 1`, values are always numbers. This is safe but fragile.
- **FLAW-5.8 — [MEDIUM] `findHierarchyEntry` is duplicated from `session-hierarchy.ts` (`:79-93`).** Same `any` types, same recursion, same parent tracking. Three copies across the codebase (also in `session-hierarchy.ts` and `delegation-status.ts`). The drift risk is real.

---

## 6. `src/tools/session/session-delegation-query.ts` (284 lines)

### 6.1 Tool entry point

- Factory: `createSessionDelegationQueryTool(projectRoot: string)` at `:35`.
- 2 actions: `list` and `get`.
- Schema source: dynamic import at `:60` — `await import("../../schema-kernel/session-delegation-query.schema.js")` is loaded inside `execute()` rather than at module top. See FLAW-6.1.
- Module-doc at `:1-14` claims "Does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory delegation state (REQ-P41E-03)." This is a hard contract.

### 6.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `list` | `handleList` at `:99` | (filters) | rootSessionId, status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore, offset, limit |
| `get` | `handleGet` at `:167` | sessionId | — |

### 6.3 Args schema

```ts
args: {
  action: enum["list","get"]
  // list filters
  rootSessionId?: string
  status?: string
  agentType?: string
  delegatedBy?: string
  minDepth?: number
  maxDepth?: number
  updatedAfter?: string
  updatedBefore?: string
  offset?: number    // default assumed
  limit?: number
  // get drill-down
  sessionId?: string
}
```

### 6.4 Status values

| Status | Where | Notes |
|--------|-------|-------|
| `"unknown"` | `:134, :135` | Fallback for missing `child.subagentType` and `child.status` |
| Canonical delegation statuses (from `HierarchyManifestChild.status`) | `:135` | Read directly from manifest, not validated against VALID_DELEGATION_STATUSES |

The `matchesFilters` helper at `:240-252` does exact equality match (`child.status !== filters.status`). If a consumer passes `"active"` (which is NOT a valid `DelegationStatus`) they will match NO children, because the manifest stores `"dispatched"` or `"running"`, never `"active"`. This is a silent mismatch — see FLAW-6.2.

### 6.5 Integration points

| Call | Target |
|------|--------|
| `await import("...session-delegation-query.schema")` (`:60`) | Dynamic Zod schema import |
| `safeSessionPath` (`:121`) | hierarchy-manifest.json path construction |
| `resolveSessionFile` (`:172`) | child .json resolution for `get` action |
| `isValidSessionID` (`:117, :168`) | sessionId validation |
| `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord` types | `src/features/session-tracker/types.js` |
| `readFile`, `readdir` from `node:fs/promises` (`:17`) | filesystem reads |
| `join` from `node:path` (`:18`) | project-continuity.json path |

### 6.6 Flaws

- **FLAW-6.1 — [LOW] Dynamic Zod import inside `execute()` (`:60`).** `await import("...schema.js")` runs every time the tool is invoked. This adds latency to every call and makes the tool's behavior dependent on the schema module being lazy-loadable. The other 8 tools in this audit import their schemas statically at module top. The reason given (the comment says "Dynamic parse: Zod discriminatedUnion validates shape per action") is implementation detail, not a justification for a dynamic import. A static import is just as capable of running `discriminatedUnion.parse()` per call.
- **FLAW-6.2 — [HIGH] `list` silently filters out everything when consumer uses non-canonical status (`:241`).** A consumer reading `delegation-status` output (which uses `DelegationStatus`: `dispatched, running, completed, error, timeout, aborted, cancelled`) will pass `status: "dispatched"`. That works. But a consumer reading `session-tracker` output (which uses `"active"`) will pass `status: "active"` and get zero results. The `list` action accepts any string and does exact match — there is no mapping layer.
- **FLAW-6.3 — [MEDIUM] `list` has no default `offset` or `limit` (`:152`).** `allDelegations.slice(input.offset, input.offset + input.limit)` will produce `[]` if either is `undefined`. The default in the Zod schema is not visible in the file (relies on the schema module). The handler does not guard.
- **FLAW-6.4 — [MEDIUM] `get` truncates `lastMessage` to 500 chars silently (`:221`).** `record.lastMessage?.slice(0, 500)`. There is no `truncated: true` flag in the response, so consumers cannot tell if the message was full or cut. `export-session` returns the full content; `get` returns a clipped excerpt. A consumer who wants the full message must call `export-session`.
- **FLAW-6.5 — [LOW] `get` is dependent on `resolveSessionFile` succeeding, but if the child record has been moved/archived, the tool reports "not found in any hierarchy-manifest" (`:174-176`).** This is a generic error that does not help the consumer distinguish "child was never created" from "child was archived" from "manifest is corrupt." The error also instructs the user to "Try 'list' to discover available sessions" — but the user already has a sessionId, suggesting the user knows what they are looking for. The error message is unhelpful.
- **FLAW-6.6 — [LOW] Sort by `updatedAt` may fail for empty strings (`:149`).** `b.updatedAt.localeCompare(a.updatedAt)` — if `updatedAt` is `""` (which is the case when `child.updatedAt` is missing per `:139`), all empty strings sort to the front (or back, locale-dependent). The sort is unstable. A `delegations.sort` after collecting all entries means a pagination request may see different orderings across calls if manifests update mid-pagination.
- **FLAW-6.7 — [MEDIUM] Pagination is offset-based on an unbounded collection (`:151-152, :159`).** `offset: input.offset, limit: input.limit` is the interface, but the entire `allDelegations` array is materialized before slicing. There is no streaming, no cursor. For a project with thousands of delegations, every call materializes the full list. Memory is the limit, not the pagination semantics.
- **FLAW-6.8 — [LOW] `discoverRootSessions` is duplicated (`:263-284`).** Same pattern as in `session-tracker.ts:236-275` (read project-continuity.json, fall back to directory scan). The two implementations are similar enough that one is likely a refactor of the other. They should share a helper.
- **FLAW-6.9 — [LOW] `MAX_TOTAL_RESULTS = 1000` is undocumented (`:97`).** The constant is set silently. If a consumer's `offset + limit > 1000`, they will get fewer results than expected with no error or warning. The constant is internal, not surfaced in args or response.

---

## 7. `src/tools/hivemind/hivemind-session-view.ts` (155 lines)

### 7.1 Tool entry point

- Factory: `createHivemindSessionViewTool(projectRoot: string)` at `:26`.
- Single action: `get` (via `tool.schema.enum(["get"])` at `:35`).
- Schema source: `SessionViewInputSchema` at `:13`.
- Tool-context: `{ sessionID?: string }` (note: NO `agent` field — see FLAW-7.1).

### 7.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `get` | `buildUnifiedView` at `:119` | sessionId | — |

### 7.3 Args schema

```ts
args: {
  action: enum["get"]
  sessionId: string
}
```

### 7.4 Status values

| Status | Where | Notes |
|--------|-------|-------|
| `"unknown"` | `:136` | Fallback for missing `session.status` |
| `"running"`, `"dispatched"` | `:149` | Used to compute the `active` count in `delegations.active` |
| Real child/root statuses (from `childRecord.status`, `manifest.children[*].status`) | `:74-86` | Read for delegation list |

### 7.5 Integration points

| Call | Target |
|------|--------|
| `SessionViewInputSchema.parse` (`:40`) | `schema-kernel/session-view.schema.js` |
| `resolveSessionFile` (`:56, :72`) | `src/tools/session/session-resolver.ts` |
| `readFile` from `node:fs/promises` (`:11`) | manifest, continuity, delegations.json, trajectory-ledger.json reads |
| `resolve` from `node:path` (`:12`) | `.hivemind/state/delegations.json` and `.hivemind/state/trajectory-ledger.json` (NOT under session-tracker root — see FLAW-7.2) |
| `Promise.all` (`:120-123`) | Concurrent fetch from 3 data roots |

### 7.6 Flaws

- **FLAW-7.1 — [LOW] `ToolContext` does not include `agent` (`:18`).** Other tools (`tmux-copilot.ts:190`, `tmux-state-query.ts:85`, `delegation-status.ts:47`) have `{ sessionID?: string; agent?: string }`. This tool only has `sessionID`. If a future revision wants to add an `agent`-based filter (e.g., "show me all delegations from `build`"), the type will need to be widened.
- **FLAW-7.2 — [MEDIUM] Mixed path authority (`:94, :107`).** `delegations.json` and `trajectory-ledger.json` are read from `resolve(projectRoot, ".hivemind", "state", ...)`. This is the canonical Q6 state root. The session-tracker data is read from `safeSessionPath` (via resolver). The two roots are different — there is no `safeStatePath` helper for the `.hivemind/state/` writes/reads. If `.hivemind/state/` moves (per `OPENCODE_HARNESS_STATE_DIR` env var), this tool will not respect the override, while `delegation-status.ts:470` DOES respect it. See FLAW-7.3.
- **FLAW-7.3 — [MEDIUM] Ignores `OPENCODE_HARNESS_STATE_DIR` (`:94, :107`).** `delegation-status.ts:470` derives projectRoot from `process.env.OPENCODE_HARNESS_STATE_DIR` if set. This tool does not. So a runtime with a non-default state dir will return `{ delegations: [], trajectory: null }` even when the files exist elsewhere. This is an undocumented env-var coupling.
- **FLAW-7.4 — [MEDIUM] `readDelegationsForSession` filters by parentSessionID only for main sessions (`:75-80`).** For main sessions, the filter is `(meta as Record<string, unknown>).parentSessionID === sessionId`. But `sessionId` for a main session IS its own root, and a root is not the parent of any of its children (children have `parentSessionID` pointing to the parent of the child, which may be the root or another child). The filter at `:79` will return children whose `parentSessionID === rootSessionId`, which is only the FIRST level of children. A root with grandchildren will report only its direct children in this view, missing the deeper tree.
- **FLAW-7.5 — [LOW] `readDelegationsForSession` uses `childSessionId` OR `id` for the legacy fallback filter (`:99`).** A delegation record in `delegations.json` uses `id` (which equals `childSessionId` in the canonical case, but may diverge in legacy records). The OR-mask is correct as a safety, but the comment at `:97-98` says "delegations may use childSessionId or parentSessionId" — but the code only checks `childSessionId`, not `parentSessionId`. The comment is wrong.
- **FLAW-7.6 — [MEDIUM] `readTrajectoryForSession` filters by `rootSessionId` OR `sessionId` (`:111-112`).** A trajectory record with `rootSessionId` set to a parent root is returned for the CHILD sessionId request. This means a child query returns its root's trajectory. The semantic depends on whether the trajectory record was written for the root or the child. The contract is unclear; consumers must inspect `entries[*].rootSessionId` to disambiguate.
- **FLAW-7.7 — [MEDIUM] `slice(0, 20)` and `slice(0, 50)` are hard-coded caps (`:81, :100, :114`).** No `limit` arg exists. A session with 200 delegations in its tree will return the first 20 with no `hasMore` flag. A trajectory with 5000 events will return the first 50. The tool looks "complete" but is lossy.
- **FLAW-7.8 — [LOW] `Promise.all` does not short-circuit on first error (`:120-123`).** If `readSessionData` throws (it doesn't currently, but it could), the entire `Promise.all` rejects, and the catch at `:46` returns the error message. The other two data sources (delegations, trajectory) are lost. A `Promise.allSettled` would be more graceful.

---

## 8. `src/tools/delegation/delegate-task.ts` (110 lines)

### 8.1 Tool entry point

- Factory: `createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } })` at `:27`.
- Single action (execute).
- Schema source: local `DelegateTaskV2Schema` at `:10-15` (NOT imported from schema-kernel — see FLAW-8.1).

### 8.2 Actions

Single implicit action: `execute` — dispatch via `coordinator.dispatch` at `:79-87`.

### 8.3 Args schema

```ts
args: {
  agent: string
  prompt: string
  context?: string
  stackOnSessionId?: string
}
```

### 8.4 Status values (result envelope)

| Status | Where | Notes |
|--------|-------|-------|
| `"error"` | `:89` | coordinator returned error |
| `"timeout"` | `:89` | coordinator returned timeout |
| (other statuses from coordinator) | implicit | The result is spread into the response, so the coordinator's status flows through |

### 8.5 Integration points

| Call | Target |
|------|--------|
| `coordinator.dispatch` (`:79-87`) | `CoordinatorLike` interface — wraps `src/coordination/delegation/coordinator.ts` (real) or test seam |
| `config.delegation_systems.delegate_task === false` (`:51-53`) | Honor system-level disable flag |
| `context.sessionID` (`:55`) | OpenCode framework context (caller's session) |
| `context.directory ?? context.worktree` (`:86`) | OpenCode framework working directory |

### 8.6 Flaws

- **FLAW-8.1 — [LOW] Local Zod schema, not from schema-kernel (`:10-15`).** The comment at `:6-9` says "This tool MUST route via coordinator.dispatch only." The local schema is minimal (4 fields). Compare with `delegation-status.ts:34-44` which uses `DelegationStatusInputSchema` from a schema-kernel module. The discrepancy is consistent with this tool's relative simplicity but means a future schema-kernel refactor will need to update this file separately.
- **FLAW-8.2 — [MEDIUM] `context` is overloaded (3 meanings) (`:62-75`).**
  1. If `stackOnSessionId` is set, `context` is IGNORED entirely (the `else if` branch is not reached).
  2. If `context` parses as JSON with `{parentSessionId: "ses_xxx"}`, the `parentSessionId` is extracted, the rest of the JSON is prepended to `prompt`, and the `parentSessionId` field is removed.
  3. If `context` does not parse as JSON (or parses but has no `parentSessionId`), it is prepended to `prompt` as free-text.
  
  Three behaviors, no docs in the args schema, the `context` arg description at `:43` says "Legacy stacking: pass JSON `{\"parentSessionId\": \"ses_xxx\"}`. Otherwise treated as free-text prepended to prompt." The first behavior (ignore `context` when `stackOnSessionId` is set) is NOT mentioned in the description. A user passing BOTH `stackOnSessionId` and a JSON `context` will be surprised that `context` is silently dropped.
- **FLAW-8.3 — [LOW] Coordinator interface is `any` (`:17-19`).** `interface CoordinatorLike { dispatch(params: Record<string, unknown>): Promise<unknown> }`. The real `DelegationCoordinator.dispatch` has a typed signature with `agent, currentDepth, parentSessionId, prompt, queueKey, surface, workingDirectory, model` (per `01-tools-surface.md:19`). The `Record<string, unknown>` type loses all of this. A typo in the call site at `:79-87` (e.g., `parentSessoinId` misspelled) will be silently accepted and the coordinator will see `undefined` for the real field.
- **FLAW-8.4 — [LOW] Config gate is a graceful error, not a denial (`:51-53`).** When `config.delegation_systems.delegate_task === false`, the tool returns an error envelope. But the agent (caller) does not know that the tool is disabled until they call it. There is no "tool not exposed" mechanism at the OpenCode plugin layer. The error is informative but late.
- **FLAW-8.5 — [MEDIUM] `queueKey: "agent:${args.agent}"` (`:84`).** The queue key is hard-coded to a single string per agent name. Two concurrent delegations to the same agent with different prompts will serialize on the same queue. The tool description at `:32-39` says "WaiterModel" semantics (true-fire-and-forget). The queue key is a serialization point that contradicts fire-and-forget. See FLAW-8.6.
- **FLAW-8.6 — [MEDIUM] `currentDepth: 0` is hard-coded (`:81`).** The depth is passed to the coordinator as 0. The coordinator will increment it via its own tracking. But this means a caller cannot pass an explicit depth — the tool ignores any depth that the caller's session-tracker knows. A nested delegation that already knows its depth will be reported as depth 0 to the coordinator, which then increments based on its own internal counter. There are two depth-tracking systems: the caller knows one, the coordinator knows another. They will drift if the caller's view is wrong.
- **FLAW-8.7 — [LOW] `surface: "agent-delegation"` is the only surface (`:85`).** This is hard-coded. There is no `args.surface` option. A consumer that wants to dispatch via a different surface (e.g., `"code-review"`, `"data-analysis"`) must not use this tool — they have to use the coordinator directly. The tool description does not mention this constraint.
- **FLAW-8.8 — [LOW] The `asRecord` helper is unsafe (`:105-107`).** `value && typeof value === "object" ? value as Record<string, unknown> : { result: value }`. If the coordinator returns `null`, `value && ...` short-circuits to `null`, and `asRecord(null)` is `{ result: null }`. But if the coordinator returns `0` or `""` or `false`, `value && ...` short-circuits to `0`/`""`/`false`, and `asRecord(0)` is `{ result: 0 }`. The result has the correct value but the wrapping `{ result: ... }` is misleading.
- **FLAW-8.9 — [LOW] The config flag is `config.delegation_systems.delegate_task`, but the type is `boolean` (`:27`).** There is no doc explaining the difference between `undefined`, `false`, and `true`. The check at `:51` is `=== false`, so `undefined` means "enabled by default." This is a sensible default but undocumented.
- **FLAW-8.10 — [LOW] No `sessionId` in args, only `stackOnSessionId` (`:40-45`).** A user who wants to specify which session this delegation "belongs to" (for tracking purposes) must use `stackOnSessionId`. There is no separate "track this delegation under session X" arg. The conflation of "stack" and "track" is implicit.

---

## 9. `src/tools/delegation/delegation-status.ts` (906 lines)

### 9.1 Tool entry point

- Factory: `createDelegationStatusTool(delegationManager: ManagerLike, deps: StatusDeps = {})` at `:464`.
- 8 actions: `status` (default), `get`, `list`, `control`, `find-stackable`, `pool`, `peek`, `progress` — declared in the Zod enum at `:37` and dispatched at `:502-520`.
- Schema source: `DelegationStatusInputSchema` (local) at `:34-44`, plus `DelegationControlSchema` at `:24-32`.
- Tool-context: `{ sessionID?: string }` at `:47` (no `agent` field — see FLAW-9.1).

### 9.2 Actions

| Action | Handler | Required | Optional |
|--------|---------|----------|----------|
| `status` (default) | falls through to `renderList` (`:645`) | — | delegationId, status, action (override) |
| `get` | falls through to `renderList` if no delegationId, or the inline status branch (`:522-643`) | — | delegationId, status |
| `list` | `renderList` at `:654` | — | status |
| `control` | `handleControl` at `:693` | delegationId, control | — |
| `find-stackable` | `handleFindStackable` at `:765` | — | agentFilter |
| `pool` | inline at `:514-520` | — | — |
| `peek` | `handlePeek` at `:835` | paneId OR delegationId | maxBytes |
| `progress` | `handleProgress` at `:875` | delegationId | — |

### 9.3 Args schema

```ts
args: {
  delegationId?: string
  status?: string
  action?: enum["status","get","list","control","find-stackable","pool","peek","progress"]  // default "status"
  control?: { action: enum[...]; chainParentSessionId?, restartPrompt?, agent? }  // nested
  agentFilter?: string
  paneId?: string
  maxBytes?: number
}
```

The `args` schema at the framework level (`:478-486`) types `control: s.object({}).optional().describe("Control action payload")` — a generic `object` rather than a refined `DelegationControlSchema`. See FLAW-9.2.

### 9.4 Status values

| Status | Where | Notes |
|--------|-------|-------|
| `VALID_DELEGATION_STATUSES = {dispatched, running, completed, error, timeout, aborted, cancelled}` | `:134` | The canonical set |
| `validateDelegationStatus` (`:137-140`) | — | Returns `"running"` as fallback for unknown |
| `Delegation.terminalKind` includes `completed, error, timeout, cancelled, restarted, runtime-dispatch-unsupported, interrupted-by-signal, non-resumable-after-restart` | type import at `:10` | Read for terminal output |
| `isTerminal = completed \| error \| timeout` | `:81, :616, :711` | Used for control-flow gating |
| `lifecycle.isTerminal` (deps) | `:60` | External terminal detection |

### 9.5 Integration points

| Call | Target |
|------|--------|
| `readPersistedDelegations` (`:6, :469`) | `src/task-management/continuity/delegation-persistence.ts` |
| `redactTextSecrets` (`:7, :87, :88, :96, :106, :631, :634`) | `src/shared/security/redaction.js` |
| `resolveSessionFile` (`:11, :144, :212, :266, :267, :596`) | `src/tools/session/session-resolver.ts` |
| `safeSessionPath` (`:12, :197`) | `src/features/session-tracker/persistence/atomic-write.js` |
| `HierarchyManifest` types (`:13`) | `src/features/session-tracker/types.js` |
| `findStackableSessions`, `findResumableSessions`, `getRetryRecommendation`, `buildStackingGuidanceBanner` (`:14, :668, :669, :670, :617, :782, :783, :784`) | `src/coordination/delegation/session-intelligence.ts` |
| `HierarchyManifestChildSchema`, `HierarchyManifestChildValidated` (`:15, :221, :313, :328, :343, :356`) | `./readers/types.js` |
| `delegationManager.getStatus`, `getAllDelegations`, `canSessionAccessDelegation`, `controlDelegation`, `getPoolSnapshot` (delegated through `ManagerLike`) | `src/coordination/delegation/manager.ts` |
| `coordinator.dispatch` (deps) | `src/coordination/delegation/coordinator.ts` |
| `deps.getChildMessageCount`, `getEscalationLevel`, `lifecycle.markAborted/markCancelled`, `terminateChild`, `getPaneContent`, `getLastChildEvent` | All injected by the plugin |
| `process.env.OPENCODE_HARNESS_STATE_DIR` (`:470, :655, :695, :772`) | Env-var coupling for state-dir override |

### 9.6 Flaws

- **FLAW-9.1 — [LOW] `ToolContext` does not include `agent` (`:47`).** Like `hivemind-session-view.ts`, the context is just `{ sessionID?: string }`. If the framework injects an `agent` field, this tool discards it. Permission-gating by agent (which the comment block at `:27-28` of `tmux-copilot.ts` suggests was once considered) cannot be done here without a type change.
- **FLAW-9.2 — [LOW] `args.control` is typed as a plain `object` (`:482`).** The framework-side schema is `s.object({}).optional()`. The refined Zod validation is `DelegationControlSchema` (`:24-32`) but that is applied at runtime in the execute function via... actually, no, the inner refinement is applied via `safeParse` of the whole `DelegationStatusInputSchema` (`:494`). So the framework-side `s.object({})` is a placeholder; the real validation happens via Zod. But the type info is lost. Tools that surface a JSON schema for the agent will not see the refined control structure.
- **FLAW-9.3 — [MEDIUM] `manifestCache` is global and shared across calls (`:19-21, :200-205`).** Keyed by `${projectRoot}::${rootSessionId}`. TTL 5 seconds. Max 10 entries. The cache is per-process and is cleared at the start of every execute call at `:492`. So the cache is effectively useless — it gets cleared on every call. The author likely meant to clear at end-of-call or not at all, but the intent is unclear. The eviction policy at `:201-204` is "oldest entry" but Map iteration order is insertion order, so this is "first inserted" not "least recently used." A LRU would need a different data structure.
- **FLAW-9.4 — [CRITICAL] `validateDelegationStatus` silently maps unknown to `"running"` (`:137-140`).** An unknown status from a malformed child record is treated as "non-terminal, currently running." This means a corrupted record with `status: "garbage"` will appear as a live, in-progress delegation. The user will think the agent is still working when it is actually in an undefined state. The safer default would be `"error"`.
- **FLAW-9.5 — [HIGH] `mergeAllDelegations` re-maps active delegations to "cancelled" (`:443-451`).** When a delegation is found in persistence or session-tracker but not in the manager's in-memory map, its status is set to "cancelled" if it was "dispatched" or "running." This is the right behavior for "the manager doesn't know about it anymore, so it's not actually running." But the user has no way to distinguish a "cancelled because manager forgot" from a "cancelled because user explicitly cancelled" — the `explicitCancellation` flag is set in the manager but not in the merged record.
- **FLAW-9.6 — [MEDIUM] `getSessionTrackerDelegation` always sets `recoveryGuarantee: "resumable"` (`:171`).** The session-tracker data does not carry a `recoveryGuarantee` field. The handler hard-codes it. A child session that was explicitly non-resumable (e.g., PTY session that died) will be reported as resumable if the session-tracker record exists. The truth is in `terminalKind: "non-resumable-after-restart"`, which IS preserved at `:177`. So the two fields can conflict.
- **FLAW-9.7 — [CRITICAL] `renderDelegation` always sets `resume` field for terminal delegations (`:109`).** `resume: isTerminal ? { childSessionId: delegation.childSessionId, mode: "continue-child-session" } : undefined`. This implies ALL terminal delegations are resumable. But `terminalKind: "non-resumable-after-restart"` exists for a reason. The `resume` field should be `undefined` for non-resumable terminal kinds.
- **FLAW-9.8 — [MEDIUM] `getHierarchyContext` O(N²) cycle detection (`:341-360`).** For every child in the manifest, it walks the parent chain up to the root. With M children and average depth D, this is O(M × D). The `visited: Set<string>()` per child is created fresh each iteration, so cross-child cycle protection is absent. A cycle that spans siblings would not be detected.
- **FLAW-9.9 — [LOW] `handlePeek` with `delegationId` but no `paneId` returns an error message about future wiring (`:836-850`).** This is a documented gap. A consumer who reads the tool description and tries `peek({ delegationId: "del_123" })` will get `"[Harness] peek action: delegationId→paneId resolution not yet wired; pass paneId explicitly"`. The description at `:474-477` advertises the action but does not mention the wiring gap.
- **FLAW-9.10 — [HIGH] `handleProgress` does not check `canAccessDelegation` (`:875-905`).** The other status actions (`:578-582, :709`) check `canAccessDelegation`. `handleProgress` does not. A caller can request progress on a delegation they should not have access to. The action is read-only so the security impact is low (no state mutation), but it leaks the existence of other delegations.
- **FLAW-9.11 — [MEDIUM] `managerActiveIds` is computed inside `mergeAllDelegations` (`:443`).** It calls `managerDelegations.map(d => d.id)` which is O(M) per call. The `byId` map iteration at `:444` is O(N) where N is the total record count. So `mergeAllDelegations` is O(N×M). For 10,000 delegations, this is 100M operations per status query.
- **FLAW-9.12 — [LOW] `renderDelegationV2` calls `deps.getChildMessageCount?.(...)` which is a `?.` optional call (`:130`).** If `deps.getChildMessageCount` is undefined (older managers), the field is silently `undefined` in the output. Consumers cannot distinguish "message count is 0" from "message count is unknown." The schema should be `messageCount: number | null` for clarity.
- **FLAW-9.13 — [LOW] `handleControl` for `restart`/`resume`/`chain`/`adjust-prompt`/`change-agent` falls through to the `manager.controlDelegation` call (`:732-742`).** If `manager.controlDelegation` is not defined (older managers), the function falls through to the `if (args.control.action === "abort" | "cancel")` block at `:744-757`, which handles only those two actions. For `restart` etc., the function returns `"[Harness] restart/redirect requires coordinator-backed manager control API"` (`:758`). This is a graceful error but a user with an older manager will be told "the tool can't do this" rather than "your manager is outdated."
- **FLAW-9.14 — [LOW] `UNSUPPORTED_REPLACEMENT_MESSAGE` is exported but never used (`:71-72, :823`).** The constant is defined at `:71-72` and re-exported at `:823`. No internal call site uses it. A future implementer might use it but the message is currently dead.
- **FLAW-9.15 — [MEDIUM] `delegationStatusInvocationCounter` is a module-level mutable (`:462, :489, :688, :790, :817`).** A process-wide counter that is not thread-safe and not session-scoped. Two parallel agent runs will increment the same counter. The counter's purpose (P59 C5: cache-busting entropy) is to prevent identical-output loops. The counter does its job, but a session-scoped counter would be more correct (a parent session's status query and a child session's status query should not share entropy).
- **FLAW-9.16 — [LOW] `delegate-task.ts:81` `currentDepth: 0`** is a downstream contract for `delegation-status.ts` too. When `getSessionTrackerDelegation` reads a child record from disk, it reads `childRecord.delegationDepth` (`:176`). But the `delegate-task` tool passes `0` to the coordinator at `:81`. So the in-memory manager and the on-disk session-tracker have different depth values for the same child session. The status tool will see two different depths depending on which source it queries.
- **FLAW-9.17 — [LOW] `paneId` and `maxBytes` are in args but not validated for `peek` (`:478-486, :835-863`).** `peek` requires `paneId` (or `delegationId` per the comment). The args schema declares both as optional. The Zod refinement does not require either. The handler at `:836-838` returns an error envelope. A consumer who reads the args schema and assumes "paneId optional" will be surprised by the runtime error.
- **FLAW-9.18 — [HIGH] `canAccessDelegation` is async but called in a loop (`:660-663, :775-779`).** The list and find-stackable paths iterate every delegation and call `canAccessDelegation` per delegation. Each call may invoke `manager.canSessionAccessDelegation` (synchronous) OR fall through to `resolveSessionFile` (async, file I/O). For a list of 100 delegations where half require file I/O, this is 50 sequential `await` calls. No `Promise.all` parallelism.
- **FLAW-9.19 — [MEDIUM] `handleControl` abort path: `await deps.terminateChild?.(delegation.childSessionId)` (`:725, :740, :749`).** The optional chaining means if `terminateChild` is not provided, the call is silently skipped. A caller who expects the child to actually be terminated will see a successful "aborted" response with no guarantee the child process is gone.

---

## 10. Cross-Cutting Observations

### 10.1 Schema-Kernel Inconsistency

| Tool | Schema source |
|------|---------------|
| session-tracker | `schema-kernel/session-tracker.schema.js` |
| session-hierarchy | `schema-kernel/session-tracker.schema.js` |
| session-context | `schema-kernel/session-tracker.schema.js` |
| session-delegation-query | dynamic import of `schema-kernel/session-delegation-query.schema.js` |
| hivemind-session-view | `schema-kernel/session-view.schema.js` |
| tmux-copilot | local Zod schemas (no schema-kernel) |
| tmux-state-query | local Zod schemas (no schema-kernel) |
| delegate-task | local Zod schema (no schema-kernel) |
| delegation-status | local Zod schema (no schema-kernel) |

The session tools use the schema-kernel; the delegation and tmux tools do not. The schema-kernel appears to be the canonical home for input validation, but the lineage split is undocumented. The result is six distinct Zod schemas, each subject to drift.

### 10.2 Read-Only vs Mutation Boundary

Per the 9-surface authority in `ARCHITECTURE.md`, all 9 tools are "read-side" or "read-side with optional mutation." The mutation authority is:

| Tool | Mutations |
|------|-----------|
| session-tracker | None |
| session-hierarchy | None |
| session-context | None |
| session-delegation-query | None |
| hivemind-session-view | None |
| tmux-copilot | `setManualOverrideState` (take-over, release) |
| tmux-state-query | None |
| delegate-task | `coordinator.dispatch` (creates a child session) |
| delegation-status | `markAborted`, `markCancelled`, `terminateChild` (via control action) |

The mutation paths are clearly localized and gated. There is no hidden mutation in the read-side tools.

### 10.3 File:Line Citation Summary

| Tool | File | Critical lines |
|------|------|----------------|
| **tmux-copilot** | `src/tools/tmux-copilot.ts` | 152-162 (schema), 198 (export), 220-466 (execute), 477-532 (buildSessionSummary) |
| **tmux-state-query** | `src/tools/tmux-state-query.ts` | 63-67 (schema), 99-161 (execute) |
| session-tracker | `src/tools/session/session-tracker.ts` | 25-62 (factory), 236-275 (list fallback), 339-422 (filter) |
| session-hierarchy | `src/tools/session/session-hierarchy.ts` | 33-58 (factory), 146-206 (actions) |
| session-context | `src/tools/session/session-context.ts` | 40-67 (factory), 144-301 (actions) |
| session-delegation-query | `src/tools/session/session-delegation-query.ts` | 35-74 (factory), 99-234 (handlers) |
| hivemind-session-view | `src/tools/hivemind/hivemind-session-view.ts` | 26-52 (factory), 119-155 (buildUnifiedView) |
| delegate-task | `src/tools/delegation/delegate-task.ts` | 10-15 (schema), 27-103 (factory) |
| delegation-status | `src/tools/delegation/delegation-status.ts` | 24-44 (schemas), 134 (VALID set), 462-652 (execute), 654-905 (handlers) |

### 10.4 Severity Triage (full set, in priority order)

| Severity | Flaws |
|----------|-------|
| **CRITICAL** | FLAW-1.1 (tmux-copilot no permission gate), FLAW-2.3 (tmux-state-query empty data), FLAW-5.1 (find-related O(N²) heuristic), FLAW-5.5 (aggregate overcounts), FLAW-9.4 (silent fallback to "running"), FLAW-9.7 (always-resumable) |
| **HIGH** | FLAW-1.3 (take-over audit trail), FLAW-1.4 (take-over silent prompt failure), FLAW-1.12 (module-level state), FLAW-3.1 (limit optional → empty), FLAW-3.2 (hard-coded "active"), FLAW-3.4 (unindexed search), FLAW-4.1 (delegation depth calc), FLAW-5.2 (cross-reference tool-only), FLAW-5.3 (cross-reference unbounded), FLAW-6.2 (status mismatch), FLAW-9.5 (status remap loses `explicitCancellation`), FLAW-9.10 (handleProgress no access check), FLAW-9.18 (sequential canAccess) |
| **MEDIUM** | FLAW-1.2 (forward-prompt sentinel), FLAW-1.5 (peek summary heuristic), FLAW-1.6 (peek note field), FLAW-1.7 (peek sync/async), FLAW-1.8 (list-panes error heuristic), FLAW-2.1 (state-query doc drift), FLAW-2.2 (state-query dead permission-denied), FLAW-3.5 (filter timeRange NaN), FLAW-3.6 (silent error swallow), FLAW-4.2 (computeDepth per-process), FLAW-4.3 (parent-chain no parentSessionID), FLAW-4.4 (manifest fallback error), FLAW-4.6 (readContinuity duplicated), FLAW-5.6 (TIME_PROXIMITY hard-coded), FLAW-5.8 (findHierarchyEntry duplicated), FLAW-6.3 (no offset/limit default), FLAW-6.4 (get lastMessage truncated), FLAW-6.7 (pagination offset-based unbounded), FLAW-7.2 (mixed path authority), FLAW-7.3 (ignores state dir env), FLAW-7.4 (delegations filter shallow), FLAW-7.6 (trajectory filter unclear), FLAW-7.7 (hard-coded slice caps), FLAW-8.2 (context overloaded), FLAW-8.5 (queueKey single string), FLAW-8.6 (currentDepth hard-coded), FLAW-9.3 (manifestCache cleared every call), FLAW-9.6 (recoveryGuarantee always resumable), FLAW-9.8 (hierarchy O(N²) cycle), FLAW-9.11 (mergeAllDelegations O(N×M)), FLAW-9.15 (counter module-level), FLAW-9.19 (terminateChild optional) |
| **LOW** | FLAW-1.9, FLAW-1.10, FLAW-1.11, FLAW-1.13, FLAW-1.14, FLAW-1.15, FLAW-1.16, FLAW-2.4, FLAW-2.5, FLAW-2.6, FLAW-2.7, FLAW-3.3, FLAW-3.7, FLAW-3.8, FLAW-4.5, FLAW-5.4, FLAW-5.7, FLAW-6.1, FLAW-6.5, FLAW-6.6, FLAW-6.8, FLAW-6.9, FLAW-7.1, FLAW-7.5, FLAW-7.8, FLAW-8.1, FLAW-8.3, FLAW-8.4, FLAW-8.7, FLAW-8.8, FLAW-8.9, FLAW-8.10, FLAW-9.1, FLAW-9.2, FLAW-9.9, FLAW-9.12, FLAW-9.13, FLAW-9.14, FLAW-9.16, FLAW-9.17 |

---

## 11. Net Assessment

**Strong points (across all 9 tools):**
- Path-safety helpers (`safeSessionPath`, `isValidSessionID`) are consistently used in the read-side tools. No path traversal vulnerabilities found.
- `renderToolResult` and the `success|error` envelope are used uniformly. The output shape is predictable.
- The CQRS boundary is intact — read tools do not mutate.
- The `redactTextSecrets` call in `delegation-status.ts` is applied to `result`, `error`, `fallbackReason`, `finalMessageExcerpt`, and the retry recommendation. Secret leak risk is mitigated.
- The `manifestCache` in `delegation-status.ts` shows intent to optimize, even if its implementation is questionable (FLAW-9.3).
- The `discriminatedUnion` Zod pattern in `tmux-copilot.ts` and `tmux-state-query.ts` is the most type-safe of the input-validation approaches.
- Phase-tagged comments (P58, P58.8, P59) document the evolution of the permission model. The history is preserved in source.

**Weak points:**
- 3 copies of `readContinuity` and 3 copies of `findHierarchyEntry` (FLAW-4.6, FLAW-5.8). Every change to the child record schema requires editing 3+ files.
- Status enums drift silently (FLAW-3.2, FLAW-6.2, FLAW-9.4). The canonical `DelegationStatus` is not enforced at the type level; runtime fallback is "running" which is dangerous.
- The schema-kernel is partially used. 6 of 9 tools have local Zod schemas. There is no contract that the schema-kernel is the canonical home.
- The "no permission gate" change in P59 R1 is a security regression (FLAW-1.1) that has no replacement.
- `tmux-state-query` is a documented facade that returns empty data (FLAW-2.3). It is dead code that should either be implemented (extend the adapter) or removed.
- The `delegate-task` tool's `currentDepth: 0` hard-code (FLAW-8.6) means the coordinator and the session-tracker disagree on depth.
- Hard-coded magic numbers (MAX_TOTAL_RESULTS=1000, COMPUTE_DEPTH_MAX=100, TIME_PROXIMITY_MS=30min) are undocumented and unconfigurable.

**Recommended follow-up actions (prioritized):**
1. **P0 (CRITICAL):** Re-instate a permission gate in `tmux-copilot.ts` (FLAW-1.1). The P59 R1 removal is a security regression. Phase 58.9 UAT must validate the threat model.
2. **P0 (CRITICAL):** Either implement `tmux-state-query` (extend the adapter with `getSessions()`) or remove the tool from the surface (FLAW-2.3). It is currently a misleading facade.
3. **P0 (CRITICAL):** Fix `validateDelegationStatus` to return `"error"` instead of `"running"` for unknown statuses (FLAW-9.4). Treat unknown as bad data, not as in-progress.
4. **P0 (CRITICAL):** Fix `aggregate(subagentType)` overcounting (FLAW-5.5). Filter to root sessions only.
5. **P0 (CRITICAL):** Make `resume` field respect `terminalKind: "non-resumable-after-restart"` (FLAW-9.7).
6. **P1 (HIGH):** Add `limit` default to `session-tracker`, `session-context`, `session-delegation-query` handlers (FLAW-3.1).
7. **P1 (HIGH):** Map non-canonical statuses (FLAW-3.2, FLAW-6.2) at the boundary, not silently.
8. **P1 (HIGH):** Add parallel `canAccessDelegation` in `renderList` (FLAW-9.18).
9. **P1 (HIGH):** Add `canAccessDelegation` to `handleProgress` (FLAW-9.10).
10. **P2 (MEDIUM):** Extract `readContinuity` and `findHierarchyEntry` to a shared module (FLAW-4.6, FLAW-5.8).
11. **P2 (MEDIUM):** Sync the tmux-state-query module doc with the actual permission behavior (FLAW-2.1).
12. **P3 (LOW):** Add `peek` action delegationId→paneId resolution to remove the documented gap (FLAW-9.9).
13. **P3 (LOW):** Document magic numbers in env-var-overridable constants.

---

*End of comprehensive test document. Generated 2026-06-05 by hm-codebase-mapper for UAT phase 58.9.*
