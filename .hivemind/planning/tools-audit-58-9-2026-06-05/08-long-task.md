[LANGUAGE: Write this file in en per Language Governance.]
# Long-Form Tool Audit — 9 Tool Files (Phase 58.9 UAT Pass)

**Date:** 2026-06-05
**Subagent:** hm-codebase-mapper (delegated as long-task auditor)
**Scope:** All nine runtime tools under `src/tools/` that this project ships through the OpenCode plugin surface
**Prior audit artifacts in this folder:** `01-tools-surface.md` (22-tool table), `02-schema-overlap-audit.md`, `03-flaw-elaboration.md`, `05-real-case-test.md` — this report is the *deep* read, complementing the table with per-file actions/args/status/integration/flaw analysis.

## 0. Executive Summary

Total audited LOC: **3,094** across nine files. All nine are registered in `src/plugin.ts` and bound to the OpenCode SDK `tool()` factory. They split cleanly into three roles:

| Role | Files | Mutation? |
|---|---|---|
| **CQRS read-side** session/coordination discovery | `session-tracker`, `session-hierarchy`, `session-context`, `session-delegation-query`, `hivemind-session-view` | NO |
| **Write-side** delegation lifecycle | `delegate-task`, `delegation-status` (both create OR mutate delegation records) | YES (delegation + session-tracker projection) |
| **Operator/tmux affordance** | `tmux-copilot`, `tmux-state-query` | Mixed (mostly read; some state mutations through `setManualOverrideState`) |

Two of the nine tools (`delegate-task`, `tmux-state-query`) export their factory/pre-built tool as the default; the other seven are `createXxxTool` factories that take a `projectRoot` or dependency. All seven factories are invoked exactly once from `src/plugin.ts` at lines 138, 139, 161, 162, 163, 183, 186, and the two singletons (`tmuxCopilotTool`, `tmuxStateQueryTool`) at lines 923-930.

The nine tools share four integration seams that recur as defect hot-spots:
1. `safeSessionPath` + `isValidSessionID` (path-traversal guard) — used by 4 session tools.
2. `resolveSessionFile` (main/child session resolver) — used by 4 tools, including a copy-paste of the same function in `session-context.ts:79-93` and `session-hierarchy.ts:61-75` (DRY violation; see §12.2).
3. `renderToolResult` + `success`/`error` envelope — used by every tool; `tmux-copilot.ts` and `tmux-state-query.ts` opt out of `success`/`error` and return raw discriminated-union envelopes, which is a structural inconsistency (see §12.1).
4. `getSessionManagerAdapter()` (module-level mutable bridge) — used only by the two tmux tools. The bridge null-return is the single most-defensive code path in the codebase.

The two Phase-58.9 focus tools (`tmux-copilot.ts`, `tmux-state-query.ts`) together contain **11 actions**, **26 typed result union variants**, and **3 distinct permission tiers** (originally 4, narrowed in P59 R1). They are the most-busy mutation surface in the project and the highest-risk for the UAT pass.

---

# PHASE 58.9 UAT FOCUS — DETAILED DEEP DIVE

## 1. `src/tools/tmux-copilot.ts` (470 LOC)

### 1.1 File purpose and provenance
Phase 43-58 evolution. Co-pilot affordance for the tmux visual-orchestration layer. The file is the single mutation point for the *manual-override* state of a delegated session (P58 G5). Despite its name, the tool is **not** an LLM co-pilot — it is the operator-side control surface that an LLM agent invokes on behalf of a human operator (or, in `peek`/`list-panes`, autonomously).

### 1.2 Actions (9 total)

| # | Action | Discriminator literal | Required args | Optional args | Mutates state? | Tier |
|---|---|---|---|---|---|---|
| 1 | `send-keys` | `send-keys` | `paneId`, `text` | `literal: boolean` | No (sends tmux keys) | All |
| 2 | `list-panes` | `list-panes` | — | `mainPaneId` | No | All |
| 3 | `compute-grid` | `compute-grid` | `tree: PaneTreeNode` | — | No (returns `SplitCommand[]`) | All |
| 4 | `respawn` | `respawn` | `sessionId` | — | Yes (respawns closed pane) | All |
| 5 | `forward-prompt` | `forward-prompt` | `paneId`, `text` | `literal: boolean` | No (sends keys with sentinel) | orchestrator-only (D-58-22 DEFER) |
| 6 | `take-over` | `take-over` | `sessionId`, `paneId` | `prompt`, `promptMode: "steer" \| "respond"` | **YES** — `setManualOverrideState` + SDK `sendPrompt` | All (P58.8 S2) |
| 7 | `release` | `release` | `sessionId` | — | **YES** — clears manualOverride | All |
| 8 | `peek` | `peek` | `paneId` | `maxBytes` | No (reads adapter cache) | All (P58.8 S2) |
| 9 | `peek-by-session` | `peek-by-session` | `sessionId` | `maxBytes` | No (resolves paneId then peeks) | All (P59 A2) |

The Zod `discriminatedUnion("action", [...])` schema at lines 147-157 is the single source of truth for action shape; the `args` object on the `tool({...})` factory at lines 205-214 is a *structural hint only* and is documented in the comment at lines 200-204 as a workaround for the framework's requirement. All canonical parsing happens at line 229 via `TmuxCopilotActionSchema.safeParse(rawArgs)`.

### 1.3 Args detail

`args` is intentionally permissive (everything `.optional()`) because the framework uses it for hint-generation, not validation. Validation is delegated to Zod at execute time, which lets the tool return `{ error: { kind: "invalid-input", issues } }` instead of throwing. This is a *graceful-error* pattern the file explicitly designs for (line 16-17, 203-204, 229-234).

### 1.4 Status values

The tool does **not** return traditional status strings. Instead it returns a 13-variant discriminated result union (lines 163-179):

```ts
export type TmuxCopilotResult =
  | { available: false; reason: "tmux-not-wired" | "tmux-not-installed" | "tmux-timeout" }
  | { available: false; reason: "tmux-error"; error: { message: string } }
  | { sent: true; paneId: string }
  | { sent: false; paneId: string; error: { message: string } }
  | { panes: PaneState[] }
  | { commands: SplitCommand[] }
  | { respawned: true; paneId: string }
  | { respawned: false; error: { reason: string } }
  | { paneId: string; deliveredAt: string; byteLength: number }
  | { suppressed: true; reason: "manualOverride" | "session-not-found"; paneId: string; textPreview: string; evaluatedAt: string }
  | { sessionId: string; paneId: string; takenBy: string; takenAt: string }
  | { sessionId: string; releasedAt: string }
  | { paneId: string; content: string; capturedAt: string; byteLength: number }
  | { sessionId: string; paneId: string; content: string; capturedAt: string; byteLength: number }
  | { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
  | { error: { kind: "permission-denied"; agent: string } }
```

This is a **shape-only** status (no `status: "ok" | "error"` field). Callers must discriminate by *key presence*. This is the project's only tool that bypasses the `success`/`error` envelope from `src/shared/tool-response.js`. **Flaw-1.1.**

### 1.5 Integration points

- `getSessionManagerAdapter()` from `src/features/tmux/types.js:160-161` (line 35-40) — the module-level bridge populated by the integration factory at plugin-init.
- `setSessionManagerAdapter()` for the BATS test seam (`__setTmuxMultiplexerForTesting` at line 468-470).
- `getManualOverrideState` / `setManualOverrideState` from `src/features/session-tracker/index.js` (line 42) — for `take-over`/`release`/`forward-prompt` suppression check.
- `resolveSessionToPaneId` from `src/features/tmux/types.js` (line 43) — for `peek-by-session`.
- `getSendPrompt` from `src/features/tmux/types.js` (line 43) — wired from `src/plugin.ts` using `client.session.prompt`, used in `take-over` to inject the optional `prompt` into the child session.
- `renderToolResult` from `src/shared/tool-helpers.js` (line 41).
- `PaneState`, `PaneTreeNode`, `SplitCommand` types from `src/features/tmux/types.js`.
- `tool` factory and `tool.schema` helpers from `@opencode-ai/plugin/tool` (line 32).

### 1.6 Permission gate (T-43-05 mitigation, P59 A1/R1/R2)

**Current state (P59 R1):** *Every* agent is allowed every action. The historical 4-agent whitelist (`hm-l0-orchestrator`, `hm-orchestrator`, `gsd-orchestrator`, `hm-coordinator`) was removed in P59 R1 because the main session agent (e.g. `build`, `hm-executor`) needs to take-over, peek, and intervene on its own child panes (lines 67-70, 216-226). The only rejection is a *missing/null `callerAgent`* in the context (line 222-226), which returns `{error: {kind: "permission-denied", agent: "unknown"}}`.

**Historical orphan code:** Lines 49-65 contain a 17-line "P59 A1: Tier-based permission model" doc-block describing the *intended* three-tier model (orchestrator / observer / user). That model was never implemented — the comment at line 67-70 confirms the hardcoded denial was removed. **Flaw-1.2:** Doc-block contradicts code.

### 1.7 Per-action flaws and risks

| Action | Flaw | Severity | Notes |
|---|---|---|---|
| `send-keys` | `paneId` is passed verbatim to `adapter.sendKeys`; the schema only requires `.min(1)`. No pattern check for `tmux`'s `%N` format. | LOW | Adapter is expected to validate. |
| `list-panes` | `mainPaneId` optional. If supplied and not a known pane, the adapter call still happens; we trust the adapter. | LOW | Adapter is expected to return `[]` for unknown. |
| `compute-grid` | Pure function on `PaneTreeNode`. No flaw — no I/O. | — | — |
| `respawn` | If `adapter.respawnIfKnown(input.sessionId)` returns `null`, the tool returns `{respawned: false, error: {reason: "session-not-closed"}}`. The reason string is the only error discriminator. **Flaw-1.3:** callers can't tell "session doesn't exist" from "session is still alive". | MED | Hard-coded string is brittle. |
| `forward-prompt` | Suppression check (lines 314-324) returns `{suppressed: true, reason: "manualOverride" | "session-not-found"}`. Only `manualOverride` is actually returned (line 317); `session-not-found` is *typed* but never produced. **Flaw-1.4:** Dead reason literal. | LOW | Type lies. |
| `forward-prompt` | The 80-char `textPreview` is `input.text.slice(0, 80)` — UTF-16 char count, not byte count. Multibyte characters will be sliced mid-grapheme. **Flaw-1.5.** | LOW | Cosmetic. |
| `forward-prompt` | Comment block (lines 297-313) is 17 lines of DEFER documentation explaining why `forward-prompt` is NOT in `USER_SESSION_ALLOWED_ACTIONS` per D-58-22 LOCKED. This is a *deliberately* permanent restriction, not a TODO. | — | Intentional. |
| `take-over` | Two side effects are interleaved: `setManualOverrideState` (synchronous, line 349-353) then optional `sendPrompt` (async, line 360-372). If `sendPrompt` throws, the `manualOverride=true` is already set. **Flaw-1.6:** Partial-failure leaves a stuck take-over. | MED | The success envelope reports `promptDelivered: false` and `promptError`, but a retry must re-invoke `take-over` (which is idempotent for the override) or `release` first. |
| `take-over` | `promptMode` default is `"steer"` (line 123), which sets `noReply: true`. If the operator types a follow-up prompt via the same `take-over` action, the child absorbs context without responding. | INFO | Documented in D-58-12. |
| `release` | `setManualOverrideState(input.sessionId, { manualOverride: false })` at line 383. No timestamp. Subsequent `forward-prompt` suppression check will return the suppressed envelope only if the operator took-over *then* released *then* the agent forwarded. Race window is microseconds; risk is the inverse: a `forward-prompt` already evaluated that is now sent to a pane the operator released. **Flaw-1.7:** No CAS on the override state. | LOW | Acceptable for now. |
| `peek` | When `adapter.getLatestCapture?.(input.paneId)` returns `null`, the tool returns `{content: "", byteLength: 0, capturedAt: now()}`. This is the **correct** graceful behavior per the S1 mitigation comment (lines 391-397) — but `capturedAt: now()` is *misleading* because no actual capture happened. **Flaw-1.8:** `capturedAt` lies when content is empty. | MED | Distinguish "captured at" from "queried at". |
| `peek-by-session` | When `resolveSessionToPaneId(input.sessionId)` returns undefined, the tool returns `{error: {kind: "invalid-input", issues: [...]}}` with a *forged* `z.ZodIssue` (line 418, `path: ["sessionId"]`). **Flaw-1.9:** A non-Zod validation path constructs a ZodIssue by `as unknown as z.ZodIssue` cast. If Zod changes its `ZodIssue` shape, this lies. | MED | Cast is the smell. |

### 1.8 Test seam

`__setTmuxMultiplexerForTesting(mux)` (line 468-470) is the BATS test seam. The comment block (lines 444-467) is exemplary: it explains the seam, the BATS usage pattern, the `__` prefix convention, and explicitly says it must NOT be used in production. **No test files were found in `tests/tools/tmux-*.test.ts`** — the seam is unused as of this audit. The file's own docstring at lines 444-467 cites `delegate-task-e2e.test.ts` patterns; the e2e test is for a different tool. **Flaw-1.10:** Test seam with no consumer in the current repo.

### 1.9 Architectural position

This file is the **operator-side mutation authority** for the manual-override state. It is the only tool outside of the `delegation/` directory that writes to any state that *all* other tools (session-hierarchy, session-delegation-query, hivemind-session-view) read. A defect in this file's `setManualOverrideState` call propagates to:
- `tmux-copilot.forward-prompt` suppression check (line 315)
- `tmux-copilot.peek/peek-by-session` (no impact, these are read-only)
- Anything in the project that *consumes* `getManualOverrideState` (the `tmux-copilot` tool is currently the only consumer in `src/tools/`, per grep)

This is a **fan-in-of-zero / fan-out-of-two** file. Single point of truth; safe today, but if `forward-prompt` is ever split out into a separate tool, the suppression check will need its own copy.

---

## 2. `src/tools/tmux-state-query.ts` (162 LOC)

### 2.1 File purpose

Read-only session metadata tool for the observability layer. Phase 52 (REQ-04, REQ-05). 3 actions: `list-sessions`, `get-session`, `get-summary`. Permission-gated (mirror of tmux-copilot gate, but P59 R1 also removed all denial here). The "graceful unavailable" pattern is identical to `tmux-copilot.ts`: when the bridge is not wired, returns `{available: false, reason: "tmux-not-wired"}`.

### 2.2 Actions (3 total)

| # | Action | Required args | Optional args | Result |
|---|---|---|---|---|
| 1 | `list-sessions` | — | — | `{ sessions: SessionSummary[] }` (always `[]` today) |
| 2 | `get-session` | — | `sessionId` | `{ session: SessionSummary \| null }` (always `null` today) |
| 3 | `get-summary` | — | — | `{ summary: { total: 0; active: 0; spawning: 0 } }` (always zeros today) |

The Zod schema (lines 50-67) requires `action` literal and (for `get-session`) optional `sessionId`. The `tool` factory `args` (lines 104-112) follows the same structural-hint pattern as `tmux-copilot`.

### 2.3 Status values

`TmuxStateQueryResult` (lines 73-79) is a 6-variant union:

```ts
| { available: false; reason: "tmux-not-wired" }
| { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
| { error: { kind: "permission-denied"; agent: string } }
| { sessions: SessionSummary[] }
| { session: SessionSummary | null }
| { summary: { total: number; active: number; spawning: number } }
```

**Note the absence of `tmux-not-installed` and `tmux-timeout`** which `tmux-copilot.ts:164` includes. This tool's list-panes call (which is the only one that surfaces those error kinds) is not exposed here because the list-panes call is encapsulated in `tmux-copilot.ts`. **Flaw-2.1:** Asymmetric error vocabulary across the two tmux tools.

### 2.4 Integration points

- `getSessionManagerAdapter()` (line 19) — same bridge as `tmux-copilot`.
- `renderToolResult` (line 20).
- `tool.schema` (line 97).
- **No** `getManualOverrideState` / `setManualOverrideState` — pure read.
- Exports `tmuxStateQueryToolName = "tmux-state-query"` (line 91) for external consumers.
- Exports `SessionSummary` interface (line 37-44) for type consumers.

### 2.5 Per-action flaws and risks (CRITICAL for Phase 58.9 UAT)

This is the **single most-defective file in the audit**. The 3 actions are documented as read-only, but their actual behavior is *return a constant placeholder*. Specifically:

| Action | Lines | Actual behavior | Documented behavior |
|---|---|---|---|
| `list-sessions` | 136-142 | Returns `{ sessions: [] }` | "Returns tracked session information" |
| `get-session` | 144-150 | Returns `{ session: null }` | "Session id to query" (implies it returns the session) |
| `get-summary` | 152-160 | Returns `{ summary: { total: 0, active: 0, spawning: 0 } }` | Implies counts are derived from the adapter's session map |

The inline comments at lines 137-142, 144-149, 153-159 explicitly admit this:

> "We cannot enumerate sessions from the adapter surface directly (`SessionManagerAdapter` exposes only `onSessionCreated`, `sendKeys`, `listPanes`, etc.). Return a placeholder indicating the adapter is wired — consumers can derive session info from the observer's event stream."

> "Session-level queries require the internal `SessionManager`'s sessions map which is intentionally not exposed through the adapter contract. For now, responds with `{session: null}` to indicate the adapter is wired but session-level details are not enumerable through the public surface."

> "For the summary, we return the adapter is wired but we do not have exact session counts without access to the internal sessions map. In a future phase, the `SessionManagerAdapter` can be extended with a `getSessions()` method."

**Flaw-2.2 (CRITICAL):** The tool advertises 3 actions but provides 0 useful data. A UAT pass that exercises this tool will see all three actions return null/empty/zero with no failure signal. This is a **silent-failure** anti-pattern: the tool reports "success" while returning no information. Tests in `tests/tools/tmux-*.test.ts` (glob returned no files) are absent, so the broken behavior is unverified.

**Flaw-2.3 (HIGH):** The `description` (line 101-103) is misleading. It says "Returns tracked session information without mutating any state." A user invoking the tool with reasonable expectations will receive `[]` or `null` and may not realize the tool is unimplemented. The description should say "Currently returns placeholder values; use the observer's event stream for actual session tracking" or similar.

**Flaw-2.4 (HIGH):** The tool exports `tmuxStateQueryToolName` and registers with the OpenCode framework (`src/plugin.ts:930`), so it is callable by any agent. An agent that calls it will receive useless data and may make downstream decisions on the absence of information. The right fix is to either (a) implement the queries against the adapter, or (b) **remove the tool from the plugin registration** until it is implemented, leaving the schema/types in place for a future PR.

**Flaw-2.5 (MED):** The `SessionSummary` interface is exported and consumed by tests (it would be, if tests existed), but its fields (`agent`, `delegationId`, `paneId`, `directory`, `spawnTime`) are not actually used by the tool's own code. The interface is purely speculative — the only place `SessionSummary` is referenced is the result union at line 77. The shape is not validated against any real `SessionManager` data.

**Flaw-2.6 (LOW):** The `args.sessionId` on `get-session` is `.optional()` in the Zod schema (line 56) and in the tool `args` (line 110-112). When the action is `get-session` and `sessionId` is omitted, the tool returns `{ session: null }` — but the action branch doesn't check that `sessionId` was provided. **Flaw-2.6:** Missing validation that `get-session` requires a `sessionId`.

### 2.6 Architectural position

`tmux-state-query` is a **read-only observability facade** that, by design, exposes nothing observability-related. The bridge (`getSessionManagerAdapter`) is the only seam; the adapter surface does not include session enumeration, so the tool cannot work. The right architectural fix is:

1. Extend `SessionManagerAdapter` with `getSessions(): SessionSummary[]` and `getSession(id: string): SessionSummary | null` and `getSummary(): { total, active, spawning }` methods.
2. Or, drop the tool from the plugin registry (`src/plugin.ts:930`) and replace with a TODO comment.

**Recommendation for Phase 58.9 UAT:** Mark this tool as a known stub in the UAT report; the operator must NOT rely on its outputs. Either implement or remove before the milestone ships.

---

# NON-58.9 TOOLS (continued coverage)

## 3. `src/tools/session/session-tracker.ts` (423 LOC)

### 3.1 Purpose
CQRS read-side. Query/export session knowledge files. 6 actions.

### 3.2 Actions

| # | Action | Required | Optional | Result shape |
|---|---|---|---|---|
| 1 | `export-session` | `sessionId` | `format: "markdown" | "json"` | `{sessionId, content | frontmatter, filePath}` |
| 2 | `get-status` | `sessionId` | — | `{sessionId, status, lastUpdated, turnCount, childCount, toolSummary}` |
| 3 | `get-summary` | `sessionId` | — | `{sessionId, frontmatter}` |
| 4 | `list-sessions` | — | `limit` | `{total, sessions: [{sessionId, metadata}], hasMore, indexLastUpdated}` |
| 5 | `search-sessions` | `query` | `limit` | `{totalMatches, sessions: [{sessionId, file, snippet, matchLine}], hasMore, fileWarnings?}` |
| 6 | `filter-sessions` | — | `status, agentType, minDepth, maxDepth, timeRange, limit` | `{totalMatches, sessions: [{sessionId, status, agentType, depth, lastUpdated}], hasMore}` |

### 3.3 Args
`sessionId` is the only discriminator for actions 1-3; for action 4 it's omitted. Schema is `SessionTrackerInputSchema` (Zod `discriminatedUnion` in `src/schema-kernel/session-tracker.schema.ts:38-73`).

### 3.4 Status values used
`"unknown"` is the fallback for missing status (line 175, 193, 238). For child records, status comes from the resolved `childRecord.status`; for main sessions, from `session-continuity.json`'s `status` field. The tool does **not** validate status strings against a known set; the values in the wild are `"active"`, `"completed"`, `"error"`, `"aborted"`, `"cancelled"`, `"unknown"`.

### 3.5 Integration points
- `resolveSessionFile` (line 20) — main/child resolution.
- `safeSessionPath` + `isValidSessionID` from `src/features/session-tracker/persistence/atomic-write.js` and `src/features/session-tracker/types.js` (line 16-17).
- `matter` (gray-matter) for frontmatter parsing (line 14, 118, 211).
- `SessionTrackerInputSchema` from `src/schema-kernel/session-tracker.schema.js` (line 15).
- `sessionTrackerRoot` (line 16) — root of `.hivemind/sessions/`.
- `renderToolResult`, `success`, `error` (line 18-19).
- `tool` factory (line 11, 26).

### 3.6 Per-action flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `export-session` returns `error: "Session not found"` in *two* places: line 113 and line 162 (the catch). A caller can't distinguish "not found" from "file system error". **Flaw-3.1.** | LOW | Two return paths. |
| 2 | `get-status` for a child session computes `toolSummary` by walking `turn.tools` (line 184-189), but the main session path reads `json.toolSummary` directly (line 179). **Inconsistency-3.2:** the main-session tool summary comes from a precomputed field, child-session tool summary is computed on every call. Performance trade-off; documented in `01-tools-surface.md`. | INFO | Intentional. |
| 3 | `list-sessions` falls back to directory scan (lines 261-274) when the index is missing — GAP-06. The fallback returns `{total: sessionDirs.length, sessions: [{sessionId}], ...}` with `metadata: null` for every entry. **Flaw-3.3:** callers that expect `metadata` will get `null`. | LOW | Documented GAP. |
| 4 | `search-sessions` MAX_QUERY_LENGTH is 1000 chars (line 22, 278-280). No max result count *before* slicing — line 325 paginates with `limit` but `matches.length` is unbounded up to slice. For a project with 100+ sessions, the search can OOM. **Flaw-3.4.** | MED | Should add a hard cap. |
| 5 | `search-sessions` truncates per-child snippets to 200 chars (line 100). Good. But the per-line snippet from the markdown file is `lines.slice(start, end).join("\n")` (line 305) with no char cap. A single very-long line becomes a 3-line snippet that may be 100KB. **Flaw-3.5.** | MED | No cap on snippet output. |
| 6 | `filter-sessions` line 354: `if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue` — the directory must start with `ses_` AND pass `isValidSessionID` (line 356). Two filters, the first being a fast pre-check. **Flaw-3.6 (LOW):** the pre-check accepts any `ses_` prefix, the second is the real validator. If `isValidSessionID` is ever loosened, the pre-check is the only effective gate. | LOW | Defense in depth, slight DRY violation. |
| 7 | `filter-sessions` calls `manifestPath` (line 357) but **never** checks if the file is within the project root. Trust is implicit through `safeSessionPath` — fine. | INFO | — |
| 8 | All 6 actions swallow catch blocks with `/* skip unreadable */` or `/* no manifest found */` (lines 105-107, 311, 395-397, 322-324, 399-401). These are silently logged-to-nothing. **Flaw-3.7:** errors are not surfaced to the caller even as a count or warning. | MED | Should collect `warnings[]` like `search-sessions` does. |
| 9 | `MAX_QUERY_LENGTH` is module-local (line 22). The schema enforces 1-1000 for `search-sessions` and 1-100 for `limit`, but the tool's own validation at line 278 duplicates the schema's check. **DRY-3.8:** schema and handler both validate. The handler check is the only one that actually returns a friendly error; the schema throws a Zod issue. | LOW | Defense in depth. |
| 10 | `handleFilterSessions` input cast at line 344: `const inputAny = input as { ...; limit: number }`. **Flaw-3.9 (LOW):** Type cast. The real type is `SessionTrackerInput` (a discriminated union); cast loses the discriminant. | LOW | — |
| 11 | `handleFilterSessions` `timeRange` is parsed via `new Date(inputAny.timeRange.after).getTime()` (line 347-348). If `after` is an invalid date string, `getTime()` returns `NaN`. The comparison at line 412 `updated < afterDate` with `afterDate = NaN` is always `false`, so no records match. **Flaw-3.10:** silent failure on bad ISO 8601. | MED | Should validate. |

### 3.7 Test coverage
No test files at `tests/tools/session/session-tracker*.test.ts`. This is the project's largest session tool (423 LOC) and most-flaws file among the session tools, and is untested.

---

## 4. `src/tools/session/session-hierarchy.ts` (283 LOC)

### 4.1 Purpose
CQRS read-side. Navigate session delegation trees. 4 actions.

### 4.2 Actions

| # | Action | Required | Optional | Result |
|---|---|---|---|---|
| 1 | `get-children` | `sessionId` | `includeStatus: boolean` | `{sessionId, childCount, children: [{sessionId, childFile, status, delegationDepth}]}` |
| 2 | `get-parent-chain` | `sessionId` | — | `{sessionId, chainLength, chain: [{sessionId, status, depth}]}` |
| 3 | `get-delegation-depth` | `sessionId` | — | `{sessionId, delegationDepth}` |
| 4 | `get-manifest` | `sessionId` | — | `{sessionId, rootMainSessionID, childCount, totalChildren, maxDepth, lastUpdated, children: [...]}` |

### 4.3 Status values
- `"unknown"` fallback (line 171, 238, 270).
- For child session resolution (line 99-101), `found.entry.status` is taken verbatim from the hierarchy tree.
- For manifest fallback (line 269-276), `c.status ?? "unknown"`.

### 4.4 Integration points
- `resolveSessionFile` (line 16).
- `isValidSessionID` (line 13).
- `readContinuity` (line 78) — local helper.
- `findHierarchyEntry` (line 61) — local recursive helper.
- `normalizeChildren` (line 126) — local helper for Record/Array polymorphism.
- `computeDepth` (line 192) — local recursive helper with cycle detection.
- `SessionHierarchyInputSchema` (line 12) from `src/schema-kernel/session-tracker.schema.js:87-105`.
- `success`, `error`, `renderToolResult` (line 14-15).

### 4.5 Per-action flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `get-children` at line 150-155: `delegationDepth: c.delegationDepth ?? (record.delegationDepth ?? 0) + 1` — if the child record lacks `delegationDepth` and the parent lacks `delegationDepth`, depth becomes `0+1 = 1`. **Inconsistency-4.1:** depth can be reported as 1 when the actual delegation tree has the child at depth 2. | LOW | Edge case. |
| 2 | `get-children` returns `status: includeStatus !== false ? c.status ?? record.status : undefined`. The `record.status` is the **parent's** status used as fallback. **Inconsistency-4.2:** a child without a status field inherits the parent's status, which is semantically wrong (children can complete while parents are still running). | MED | Should default to `"unknown"` not parent. |
| 3 | `get-parent-chain` MAX_DEPTH = 50 (line 167). Reasonable. But if a chain is broken (parent not in any manifest), the loop breaks silently at line 170. **Flaw-4.3:** partial chain returned without warning. | LOW | — |
| 4 | `get-delegation-depth` uses recursive `computeDepth` with `visited: Set<string>` and a `COMPUTE_DEPTH_MAX = 100` cap (line 190). The cap is hit when `visited.size >= COMPUTE_DEPTH_MAX` (line 194) which returns 0. **Flaw-4.4:** if the cap is reached, the depth is reported as 0 — the caller cannot distinguish "depth is 0" from "tree is too deep to compute". | MED | Should report a "max depth exceeded" indicator. |
| 5 | `computeDepth` re-reads the same record (line 196) for every child — N+1 read pattern. For a tree with 100 nodes and 10 children per node, that's 1000 reads. **Flaw-4.5 (LOW):** no memoization. | LOW | — |
| 6 | `get-manifest` fallback at line 256-281: when the manifest is missing, it tries to build a manifest from `record.hierarchy.children`. But the fallback manifest's `maxDepth: 0` is hard-coded (line 266). **Flaw-4.6:** fallback over-reports `maxDepth` as 0. | MED | Should compute. |
| 7 | All 4 actions silently swallow errors with `/* ignore */` or `return null` in helpers (line 86, 105-106, 119-121, 254-281). The user-facing tool surfaces `renderToolResult(error(...))` only at the boundary. **Inconsistency-4.7:** error verbosity is asymmetric across actions. | LOW | — |
| 8 | `findHierarchyEntry` (line 61-75) uses `any` for `children` and `entry` (line 62, 65). **Flaw-4.8:** type safety lost. | LOW | — |
| 9 | `normalizeChildren` (line 126-143) returns Array, but the function name says "normalize" not "toArray". The Record vs Array polymorphism is undocumented in the function comment. | INFO | — |
| 10 | All 4 actions check `isValidSessionID` (lines 147, 163, 183, 210). But the schema ALSO validates via `safeSessionId` (the `safeSessionId` Zod refinement in the schema file). **DRY-4.9:** triple check (schema + tool guard + `resolveSessionFile` which also calls `isValidSessionID`). | LOW | Defense in depth, intentional. |

### 4.6 Test coverage
No test files at `tests/tools/session/session-hierarchy*.test.ts`. The file's recursive helpers (`findHierarchyEntry`, `computeDepth`) are prime candidates for unit tests but have none.

---

## 5. `src/tools/session/session-context.ts` (301 LOC)

### 5.1 Purpose
CQRS read-side. Cross-session synthesis and discovery. 4 actions.

### 5.2 Actions

| # | Action | Required | Optional | Result |
|---|---|---|---|---|
| 1 | `find-related` | `sessionId` | `maxRelated: number` | `{sessionId, totalRelated, related: [{sessionId, score, sharedTools, timeProximity}], hasMore}` |
| 2 | `cross-reference` | `sessionId` | `query: string` | `{sessionId, query, totalRefs, refs: [{sessionId, toolMatches}]}` |
| 3 | `synthesize-context` | `sessionId` | — | `{sessionId, context: <markdown>}` |
| 4 | `aggregate` | `groupBy: "subagentType" | "status"` | — | `{groupBy, totalSessions, counts: Record<string, number>, timestamp}` |

### 5.3 Status values
- For `aggregate(groupBy: "status")` (line 263): `status` is read from `project-continuity.json` index entry; fallback `"unknown"`.
- For `aggregate(groupBy: "subagentType")` (line 270-285): every root session is counted as `"opencode-session"`, and child agents get their `subagentType ?? "unknown-subagent"`.

### 5.4 Integration points
- `resolveSessionFile` (line 19).
- `safeSessionPath` + `isValidSessionID` + `sessionTrackerRoot` (line 15-16).
- `matter` (gray-matter, line 13).
- `readProjectIndex` (line 70) — local helper, similar to `session-tracker.handleListSessions` but lighter.
- `readContinuity` (line 96) — *duplicates* `session-hierarchy.ts:78-123` (DRY-5.1, see §12.2).
- `findHierarchyEntry` (line 79) — *duplicates* `session-hierarchy.ts:61-75` (DRY-5.1, see §12.2).
- `SessionContextInputSchema` (line 14) from `src/schema-kernel/session-tracker.schema.js:119-138`.

### 5.5 Per-action flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `find-related` uses `TIME_PROXIMITY_MS = 30 * 60 * 1000` (line 38, hard-coded). **Flaw-5.1:** no way to tune the window without code change. | LOW | Could be a tool arg. |
| 2 | `find-related` score formula at line 161: `score = toolScore * 2 + (timeProximity ? 1 : 0)`. Tool-score is `sharedTools.length` (line 158). So a session sharing 0 tools but in the 30-min window scores 1; a session sharing 1 tool but not in the window scores 2. The tool-match weight is reasonable; the `timeProximity` weight is suspiciously low. **Inconsistency-5.2:** weight choice is undocumented. | LOW | — |
| 3 | `find-related` requires `index.sessions[sessionId]` (line 149-150). If the session is in the directory but not in the index (because the index is stale), `find-related` returns `error: "Session not found in index"`. **Flaw-5.3:** does not fall back to directory scan like `list-sessions` does. | MED | Should fall back. |
| 4 | `cross-reference` `searchQuery` is `(query ?? sessionId).trim()` (line 177). The comment at line 175-176 says "query is a tool/agent name (e.g. 'bash', 'delegate') — NOT a session ID". But the fallback uses `sessionId` as the query. **Inconsistency-5.4:** the comment contradicts the fallback. | LOW | Comment is correct; fallback is the smell. |
| 5 | `cross-reference` reads `record.toolSummary` (line 187) for every session directory (line 181-192). For 1000 sessions, this is 1000 file reads. **Flaw-5.5 (LOW):** no batching, no parallelism. | LOW | — |
| 6 | `cross-reference` `refs.slice(0, 50)` at line 195 is a hard cap with no `hasMore` indicator. **Flaw-5.6:** caller cannot tell if there were more than 50. | MED | Should add `hasMore: refs.length > 50`. |
| 7 | `synthesize-context` builds markdown with object spread (line 232-245). The order of fields is hard-coded; not configurable. The `Object.entries(frontmatter).map(...)` at line 241 stringifies objects with `JSON.stringify` (line 241) — long values are dumped raw. **Flaw-5.7:** no truncation on frontmatter values. | LOW | — |
| 8 | `synthesize-context` line 228: `Object.entries(tools).sort(([, a], [, b]) => (b as number) - (a as number))` — the `as number` cast is needed because `tools` is `Record<string, number>` but TS doesn't know that. **Flaw-5.8:** cast smell. | LOW | — |
| 9 | `aggregate` `groupBy: "subagentType"` logic at line 268-286: every root session gets counted as `"opencode-session"` (line 270). But the function name says "by subagentType" — counting root sessions as "opencode-session" is a category, not a type. **Inconsistency-5.9:** the label `"opencode-session"` is conflated with the per-child `subagentType` enum. | MED | Should be a separate count or documented. |
| 10 | `aggregate` `groupBy: "subagentType"` does NOT read from `index.sessions` — it reads from the hierarchy manifest. If a root session has no manifest, it counts the root only (line 270), missing any children. **Flaw-5.10:** children of un-manifested roots are invisible. | LOW | — |
| 11 | `aggregate` `timestamp` is `new Date().toISOString()` (line 299). **Flaw-5.11:** returned on every call, makes each response unique (similar to P59 C5 entropy in delegation-status). If two agents aggregate at the same wall-clock millisecond, they get the same string. | INFO | — |
| 12 | `readProjectIndex` and `handleListSessions` in `session-tracker.ts` both read the same `project-continuity.json`. **DRY-5.12:** two implementations. | LOW | — |
| 13 | `readContinuity` and `findHierarchyEntry` are byte-identical copies between `session-context.ts` and `session-hierarchy.ts`. **DRY-5.1 (HIGH):** this is the largest cross-file duplication in the audit. | HIGH | Extract to `src/tools/session/continuity-reader.ts`. |

### 5.6 Test coverage
No test files at `tests/tools/session/session-context*.test.ts`.

---

## 6. `src/tools/session/session-delegation-query.ts` (284 LOC)

### 6.1 Purpose
CQRS read-side. Progressive-disclosure query of delegation history. 2 actions.

### 6.2 Actions

| # | Action | Required | Optional | Result |
|---|---|---|---|---|
| 1 | `list` | — | `rootSessionId, status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore, offset, limit` | `{delegations: DelegationSummary[], total, offset, limit, hasMore}` |
| 2 | `get` | `sessionId` | — | `{sessionID, parentSessionID, delegationDepth, delegatedBy, mainAgent, created, updated, status, turnCount, turnSummary, journeyEntryCount, lastMessage, children, ...P41-B fields}` |

### 6.3 Status values
The `list` action filters by `child.status` directly (line 241). The values are whatever the manifest records — typically `"active"`, `"completed"`, `"error"`, `"aborted"`, `"cancelled"`, `"unknown"`. The schema's `status: tool.schema.string().optional()` (line 45) does not constrain to a known set.

The `get` action returns `record.status` (line 213) without validation.

### 6.4 Integration points
- `safeSessionPath` + `sessionTrackerRoot` (line 20).
- `resolveSessionFile` (line 21).
- `isValidSessionID` (line 22).
- `success`, `error`, `renderToolResult` (line 23-24).
- `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord` types (line 26).
- `SessionDelegationQueryInputSchema` is **dynamically imported** at line 60 — *different* from the other tools which import statically at the top. **Inconsistency-6.1:** the dynamic import is a code smell. It works because the file is also the schema's first consumer in plugin-init order, but a static import is cleaner.

### 6.5 Per-action flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `list` MAX_TOTAL_RESULTS = 1000 (line 97). Once the cap is hit, the loop breaks early (line 118, 126) — silently dropping delegations from later root sessions. **Flaw-6.1:** the cap is a hard ceiling; a project with 50 roots × 30 children = 1500 will silently lose 500. | HIGH | Should paginate at the root-session level or warn. |
| 2 | `list` sort at line 149: `b.updatedAt.localeCompare(a.updatedAt)` — descending by string compare. ISO 8601 strings are lexicographically sortable, so this works. But `child.updatedAt ?? ""` (line 139) means records without an updatedAt sort as empty strings, which sort *first* in descending order (since `""` < anything). **Inconsistency-6.2:** records without updatedAt appear at the top of "most recent first". | MED | Should sort missing to the end. |
| 3 | `list` `matchesFilters` (line 240-252) does `child.status !== filters.status` — case-sensitive exact match. But `session-tracker.filter-sessions` does `meta.status?.toLowerCase() !== statusLower` (case-insensitive). **Inconsistency-6.3:** two read-side tools with different case-sensitivity for status filtering. | MED | Pick one. |
| 4 | `list` `filters.updatedAfter` and `updatedBefore` (line 248-249) use string `<` and `>`, which is correct for ISO 8601. But the schema accepts `tool.schema.string().optional()` (line 49-50) — *any* string, not validated. **Flaw-6.4:** a malformed `updatedAfter` like `"yesterday"` will silently match nothing. | MED | Should validate ISO 8601. |
| 5 | `get` does `resolveSessionFile` then checks `resolved.type !== "child"` (line 173). If the session is a *root* session, the tool returns `error: "Session ID ... not found in any hierarchy-manifest. Try 'list' to discover available sessions."` — but the root session may legitimately have no children. **Flaw-6.5:** the message implies the session is invalid; the actual reason is "no children". | MED | Should return `null` with a different message. |
| 6 | `get` `toolSummary` is built from `turn.tools` (line 190-194), but `lastMessage` is `record.lastMessage?.slice(0, 500)` (line 221) — hard-coded 500 char cap. **Flaw-6.6:** no parameter for cap. | LOW | — |
| 7 | `get` P41-B gap fields at line 227-231 are conditionally spread — only present if defined. **Flaw-6.7:** the response shape varies. Consumers must check before reading. | INFO | Intentional per "P41-B gap fields". |
| 8 | `get` does NOT include `turns` or `journey` (intentional, line 232 comment). To get those, the user must call `session-tracker export-session`. **Inconsistency-6.8:** "delegation detail" is not a superset of "session export". | INFO | Intentional progressive disclosure. |
| 9 | `discoverRootSessions` (line 263-284) duplicates the discovery logic in `session-tracker.handleListSessions` (line 236-275) and `session-resolver.ts:50-67`. **DRY-6.9 (HIGH):** three implementations of "find root sessions". | HIGH | Extract to a `discoverRootSessions(projectRoot)` helper. |

### 6.6 Test coverage
No test files at `tests/tools/session/session-delegation-query*.test.ts`.

---

## 7. `src/tools/hivemind/hivemind-session-view.ts` (155 LOC)

### 7.1 Purpose
CQRS read-side. Cross-root unified session query. Single action: `get`. Returns a merged view from 3 data roots: session-tracker, delegations, trajectory.

### 7.2 Action

| Action | Required | Optional | Result |
|---|---|---|---|
| `get` | `sessionId` | — | `{session, delegations: {total, active, entries}, trajectory, queriedAt}` |

### 7.3 Status values
- `delegations[].status === "running" | "dispatched"` is the *active* count (line 149).
- `session.status` is taken verbatim from the session record (line 136), default `"unknown"`.

### 7.4 Integration points
- `resolveSessionFile` from `../session/session-resolver.js` (line 16) — note the relative path crosses the `hivemind/` subdir.
- `SessionViewInputSchema` from `src/schema-kernel/session-view.schema.js` (line 13).
- `readFile` from `node:fs/promises` (line 11).
- `resolve` from `node:path` (line 12) — used for `.hivemind/state/delegations.json` and `trajectory-ledger.json`.

### 7.5 Per-action flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `readDelegationsForSession` (line 69-102) tries session-tracker first, then falls back to `delegations.json`. The fallback filters by `d.childSessionId === sessionId || d.id === sessionId` (line 98-99). **Flaw-7.1 (MED):** the filter is exact-match; if a delegation was created with a different ID scheme, it's missed. | MED | — |
| 2 | `readDelegationsForSession` slices to 20 (line 81, 100) with no `hasMore` indicator. **Flaw-7.2 (LOW):** silent truncation. | LOW | — |
| 3 | `readTrajectoryForSession` (line 105-116) reads the *entire* `trajectory-ledger.json` and filters in memory. **Flaw-7.3 (MED):** the ledger is unbounded; for a long-running project it can be megabytes. The slice to 50 (line 114) is a soft cap. | MED | Should use a streaming/JSONL layout or index by session. |
| 4 | `readSessionData` (line 55-66) returns `resolved.childRecord as unknown as Record<string, unknown>` (line 64). **Flaw-7.4:** double cast `as unknown as`. | LOW | — |
| 5 | `buildUnifiedView` (line 119-154) reads all 3 data sources in parallel via `Promise.all` (line 120). If one source is corrupted, the whole promise rejects, and the catch at line 47-49 returns the error. **Flaw-7.5 (LOW):** one bad source fails the whole view. Should use `Promise.allSettled`. | LOW | — |
| 6 | The enriched session at line 134-143 manually pulls 8 fields from the raw session. If the schema adds new fields, they are silently dropped. **Flaw-7.6 (LOW):** schema drift. | LOW | — |
| 7 | The file is in `src/tools/hivemind/` but its only sibling is `hivemind-session-view.ts`. The other hivemind-prefixed tools don't exist. **Naming-inconsistency-7.7:** the directory is for "hivemind-*" tools but only one tool lives there. | INFO | — |
| 8 | The schema file `src/schema-kernel/session-view.schema.ts` ALSO defines `SessionViewDelegationFilterSchema` (line 31-35) which is for `delegation-status`, not `session-view`. The file's own comment at line 24-30 admits: "This schema is defined here but consumed by the delegation-status tool. It is orphaned from the delegation-status schema boundaries. A future refactor should move it to its own schema file". **Flaw-7.8 (LOW):** orphan schema in the wrong file. | LOW | — |

### 7.6 Test coverage
No test files at `tests/tools/hivemind/*.test.ts`.

---

## 8. `src/tools/delegation/delegate-task.ts` (110 LOC)

### 8.1 Purpose
Write-side. **The only** tool that creates new delegations. Routes through `coordinator.dispatch` (NOT the native `task` tool — see line 7-9 policy comment).

### 8.2 Action
A single "execute" — no `action` discriminator. The tool itself is the action.

| Required | Optional | Result |
|---|---|---|
| `agent`, `prompt` | `context`, `stackOnSessionId` | `{delegationId, status, ...resultRecord, agent, stackedOn}` |

### 8.3 Status values
The tool *forwards* whatever `coordinator.dispatch` returns. The handler interprets:
- `resultRecord.status === "error"` → error envelope
- `resultRecord.status === "timeout"` → error envelope
- otherwise → success envelope with `agent` and `stackedOn` merged in

The status values surfaced are dictated by `coordinator.dispatch` (see `src/coordination/delegation/coordinator.ts` per the prior audit `01-tools-surface.md`).

### 8.4 Integration points
- `coordinator.dispatch` (line 79) — the only outbound call.
- `DelegateTaskV2Schema` (line 10) — Zod schema (named V2 to distinguish from V1; V1 is `DelegateTaskInputSchema` aliased at line 109).
- `success`, `error`, `renderToolResult` (line 4-5).

### 8.5 Per-call flaws

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `stackOnSessionId` is first-class but `context` is also accepted as a JSON-stuffed parentSessionId. The comment at line 62 explains this is for backward compat. The implementation at line 64-69 is a multi-step JSON parse + object spread. **Flaw-8.1 (LOW):** legacy path is convoluted. | LOW | — |
| 2 | `args.context` JSON parse failure at line 73-75 falls through to treating `context` as free-text. **Inconsistency-8.2:** the user gets the free-text behavior with no warning that their JSON was malformed. | LOW | — |
| 3 | `coordinator.dispatch` is called with `queueKey: \`agent:${args.agent}\`` (line 84). All delegations to the same agent share a queue key. **Inconsistency-8.3:** no per-prompt or per-session queue key option. | INFO | Intentional. |
| 4 | The dispatch call (line 79-87) sets `surface: "agent-delegation"`. This is the only place in the entire codebase that uses this surface. **Flaw-8.4 (LOW):** magic string, no shared constant. | LOW | — |
| 5 | `currentDepth: 0` (line 81) is hard-coded. **Flaw-8.5:** the coordinator should derive depth from the parent session, not from the caller. If a child delegate-task is invoked from a sub-agent, the depth will be wrong. | HIGH | Should use `context.sessionID` to look up parent depth. |
| 6 | The tool description (line 31-39) is excellent — it documents stacking, `find-stackable`, and the `delegation_systems.delegate_task` config flag. **No flaw — exemplary.** | — | — |
| 7 | `asRecord` helper (line 105-107) returns `{ result: value }` if value is not an object. **Flaw-8.6 (LOW):** callers expect `delegationId` etc.; getting `{result: ...}` will fail. | LOW | — |
| 8 | When `coordinator.dispatch` throws, the catch at line 97-99 returns the error with the raw message. **Flaw-8.7 (LOW):** no `[Harness]` prefix on the thrown error message (only on Zod-parse errors at line 48 and config errors at line 52). Inconsistent. | LOW | — |
| 9 | `config?.delegation_systems?.delegate_task === false` check at line 51-53 returns an error *before* parsing, but the Zod parse at line 47 runs first. If the input is invalid, the user gets the parse error, not the config error. **Inconsistency-8.8:** ordering of guards. | LOW | — |
| 10 | The schema has `error: "agent is required"` (line 11) but the actual error envelope at line 48 is `[Harness] Invalid delegate-task input: ${z.prettifyError(...)}`. The `error` option in Zod is for *the message format*, not the final envelope. **No flaw**, but the Zod `error` option requires Zod v4 — confirm version (this is Zod v4 syntax). | INFO | Confirm Zod version. |

### 8.6 Test coverage
- `tests/tools/delegation/delegate-task-v2.test.ts` — 7 tests covering dispatch, validation, legacy compatibility, plugin context shape. **Good coverage** of the happy path and 2 error paths.
- `tests/tools/delegation/delegate-task-e2e.test.ts` — e2e test exists (per glob).

The two main test gaps are:
- Stacking via `stackOnSessionId` (no test).
- `context` JSON legacy path (no test).

---

## 9. `src/tools/delegation/delegation-status.ts` (906 LOC)

### 9.1 Purpose
Read-side *and* control-side (it has a `control` action that mutates delegation state). The largest and most complex tool in the audit.

### 9.2 Actions

| # | Action | Discriminator | Required | Optional | Result |
|---|---|---|---|---|---|
| 1 | `status` (default) | `status` | — | `delegationId` | Single delegation detail with hierarchy, options, retry recommendation |
| 2 | `get` | `get` | — | `delegationId` | Alias of `status` per the comment at line 37; not explicitly handled — falls through to `args.delegationId ? handleStatus : renderList`. **Inconsistency-9.1:** `get` and `status` are both listed in the enum but the switch has no case for `get`. | — | — |
| 3 | `list` | `list` | — | `status`, `agentFilter` | Array of delegations + stackable/resumable banner |
| 4 | `control` | `control` | `delegationId`, `control.action` | `control.{chainParentSessionId, restartPrompt, agent}` | Per-control-action result |
| 5 | `find-stackable` | `find-stackable` | — | `agentFilter` | Stackable + resumable sessions with `taskCommand` / `delegateTaskCommand` |
| 6 | `pool` | `pool` | — | — | Frozen DelegationPool JSON snapshot |
| 7 | `peek` | `peek` | `paneId` or `delegationId` | `maxBytes` | Capture-pane content |
| 8 | `progress` | `progress` | `delegationId` | — | Live counters + last event |

### 9.3 Status values
`VALID_DELEGATION_STATUSES` (line 134) is the closed set: `dispatched, running, completed, error, timeout, aborted, cancelled`. `validateDelegationStatus` (line 137) returns `"running"` for any unknown value (safe fallback, line 139). This is the only tool with a closed status set.

### 9.4 Integration points
- `readPersistedDelegations` from `src/task-management/continuity/delegation-persistence.js` (line 6).
- `redactTextSecrets` from `src/shared/security/redaction.js` (line 7).
- `resolveSessionFile` from `../session/session-resolver.js` (line 11).
- `safeSessionPath` from `src/features/session-tracker/persistence/atomic-write.js` (line 12).
- `findStackableSessions`, `findResumableSessions`, `getRetryRecommendation`, `buildStackingGuidanceBanner` from `src/coordination/delegation/session-intelligence.js` (line 14).
- `HierarchyManifestChildSchema`, `HierarchyManifestChildValidated` from `./readers/types.js` (line 15).
- `Manifest` cached in `manifestCache` (line 19-22), 5s TTL, max 10 entries.
- `StatusDeps` (line 56-69) is a 12-property injection bag.

### 9.5 Per-action flaws

This file is too long to enumerate every flaw. Highlights:

| # | Flaw | Severity | Notes |
|---|---|---|---|
| 1 | `get` and `status` are listed in the enum (line 37) but the switch statement at line 502-520 has no case for `get` — it falls through to `args.delegationId ? handleStatus : renderList`. **Flaw-9.1 (MED):** undocumented alias; the description (line 481) says "status (default), list, control, find-stackable" but the schema accepts "get". | MED | Either remove `get` from enum or add a case. |
| 2 | `manifestCache.clear()` at line 492 clears the cache at the start of every execute call. **Inconsistency-9.2:** the comment at line 491 says "prevent stale data across rapid tool calls" but the TTL is 5s and the cache is module-level. The clearing defeats the TTL. **Flaw-9.3:** the cache is effectively never used. | HIGH | Either remove the cache or remove the clear(). |
| 3 | `delegationStatusInvocationCounter` (line 462) increments on every call. The comment explains "prevents identical tool output loop trap". This is a hack — adding entropy to make the response unique. **Flaw-9.4 (MED):** the loop trap is a real problem, but the fix is at the wrong layer. The session/agent that polls should detect no-progress, not the tool. | MED | — |
| 4 | `mergeAllDelegations` (line 400-454) merges from 3 sources: persisted, session-tracker children, manager in-memory. The merge is O(n²) due to the byId Map re-assignment logic. **Flaw-9.5 (LOW):** performance, not correctness. | LOW | — |
| 5 | `mergeAllDelegations` line 446-449: if a delegation is not in the manager's active set, its status is forced to `"cancelled"`. **Flaw-9.6 (HIGH):** a session-tracker record showing `status: "running"` will be downgraded to `"cancelled"` if the manager has lost it (e.g. after restart). This is a *data integrity* issue. | HIGH | Should differentiate "lost from manager" from "actually cancelled". |
| 6 | `canAccessDelegation` (line 256-275) checks the manager's `canSessionAccessDelegation`, then falls back to a root-session comparison. **Flaw-9.7:** the fallback can return `true` for sessions in the same root tree even if the caller is a sibling that should not see them. The access model is hierarchical, not strict-ancestor. | MED | — |
| 7 | `handleControl` (line 693-759) has 3 control actions handled locally (abort, cancel) and delegates the rest to `manager.controlDelegation`. The local abort/cancel paths at line 745-757 invoke `deps.lifecycle?.markAborted` and `markCancelled` (line 747, 754) — **Flaw-9.8 (LOW):** `markAborted` and `markCancelled` are called WITHOUT `?.()` in the SECOND branch (line 747, 754), so if `deps.lifecycle` is undefined, the local paths throw whereas the same calls in the first branch (line 717, 723) use `?.()`. | LOW | Inconsistency. |
| 8 | `handleControl` "restart/resume/chain/adjust-prompt/change-agent" all go through `manager.controlDelegation`. The schema at line 24-32 has `.refine()` constraints for each. **Flaw-9.9:** if `manager.controlDelegation` is undefined (older manager), the path at line 732-742 returns the result. The fallback at line 744-757 only handles `abort` and `cancel`. **Flaw-9.10 (HIGH):** for `restart/resume/chain/adjust-prompt/change-agent` with an older manager, the user gets the error message at line 758 (`restart/redirect requires coordinator-backed manager control API`) which is generic. | HIGH | Should list the specific unsupported action. |
| 9 | `UNSUPPORTED_REPLACEMENT_MESSAGE` (line 71-72) is exported but not used inside the file. It is a constant meant for external callers. **Flaw-9.11 (LOW):** the message is committed but no caller uses it. | LOW | — |
| 10 | `handlePeek` (line 835-864) returns `[Harness] peek action: delegationId→paneId resolution not yet wired; pass paneId explicitly` (line 849) when `paneId` is absent. **Flaw-9.12:** the message says "not yet wired" which is a TODO leak. | MED | Either wire it or change the message. |
| 11 | `handleProgress` (line 875-906) uses `manager.getStatus(args.delegationId)` to find the delegation. If the delegation is only in the session-tracker (not the manager), `handleProgress` returns `error: "Delegation ... not found"` — **Flaw-9.13 (HIGH):** the manager-only lookup misses tracker-only delegations. The `status` and `control` paths DO merge manager+tracker; `progress` does not. | HIGH | Should use `mergeAllDelegations` or `getSessionTrackerDelegation`. |
| 12 | `renderDelegation` at line 80-114 returns `finalMessageExcerpt` truncated. The truncation is at the source (`delegation.finalMessageExcerpt`), not in the tool. **Flaw-9.14 (LOW):** field size depends on upstream. | LOW | — |
| 13 | `canAccessDelegation` (line 256-275) does TWO `resolveSessionFile` calls when manager check fails (line 266-270). **Flaw-9.15 (LOW):** 2x filesystem reads. | LOW | — |
| 14 | `renderList` (line 654-691) has a `for` loop with `await` (line 660) — N+1 read pattern. **Flaw-9.16:** sequential awaits. | LOW | — |
| 15 | `renderList` builds `stackableSessions` and `resumable` outside the `accessible` filter (line 668-670). The `accessible` is the post-filter set; `stackable` is computed from `accessible` (line 668) — correct. But the count in the success message is `filtered.length` (line 674), not `accessible.length`. **Inconsistency-9.17:** the count is filtered but the `total` in metadata (line 678) is `accessible.length`. Caller confusion likely. | LOW | — |
| 16 | The `control` action is checked first (line 504), but `control` requires both `delegationId` and `control.action`. If `control` is the action but `control` is missing from args, the handler returns `error: "control action requires delegationId and control"` (line 694). The error path is fine. **No flaw.** | — | — |
| 17 | `pool` action: if `delegationManager.getPoolSnapshot` is not a function, returns error (line 515-517). If it IS a function but returns `undefined`, the `success` envelope gets `undefined` as the data (line 519). **Flaw-9.18 (LOW):** undefined handling. | LOW | — |
| 18 | `peek` action with `delegationId` (no `paneId`) at line 848-850 returns the unwired message. This means the documented `peek` action via `delegationId` is **non-functional** today. **Flaw-9.19 (HIGH):** advertised feature doesn't work. | HIGH | Either remove `delegationId` from `peek` or wire it. |
| 19 | The `description` (line 473-477) only lists 4 actions: `status (default), list, control, find-stackable`. The Zod schema at line 37 accepts 8. **Flaw-9.20 (MED):** description-skill mismatch. | MED | Update description. |
| 20 | `redactTextSecrets` is called on `result`, `error`, `fallbackReason`, `finalMessageExcerpt` (line 87, 88, 96, 106) and on `retryRecommendation.taskCommand` and `guidance` (line 631, 634). **No flaw** — exemplary coverage. | — | — |

### 9.6 Test coverage
- `tests/tools/delegation/delegation-status-v2.test.ts` (per glob) — V2 tests exist.

The V2 tests likely cover the `progress`, `peek`, `pool` actions. The gap is:
- `control` action paths (abort, cancel, restart, resume, chain, adjust-prompt, change-agent) — no test evident.
- `find-stackable` with `agentFilter` — no test evident.
- `mergeAllDelegations` 3-source merge — no unit test.
- The "downgrade to cancelled" path at line 446-449 — no test evident.

---

# CROSS-CUTTING OBSERVATIONS

## 10. Cross-tool integration matrix

| Caller → Callee | session-tracker | session-hierarchy | session-context | session-delegation-query | hivemind-session-view | delegate-task | delegation-status | tmux-copilot | tmux-state-query |
|---|---|---|---|---|---|---|---|---|---|
| `resolveSessionFile` | ✓ (line 20) | ✓ (line 16) | ✓ (line 19) | ✓ (line 21) | ✓ (line 16) | — | ✓ (line 11) | — | — |
| `safeSessionPath` | ✓ (line 16) | — | ✓ (line 15) | ✓ (line 20) | — | — | ✓ (line 12) | — | — |
| `isValidSessionID` | ✓ (line 17) | ✓ (line 13) | ✓ (line 16) | ✓ (line 22) | — | — | — | — | — |
| `sessionTrackerRoot` | ✓ (line 16) | — | ✓ (line 15) | ✓ (line 20) | — | — | — | — | — |
| `getSessionManagerAdapter` | — | — | — | — | — | — | — | ✓ (line 35) | ✓ (line 19) |
| `setManualOverrideState` | — | — | — | — | — | — | — | ✓ (line 42) | — |
| `getManualOverrideState` | — | — | — | — | — | — | — | ✓ (line 42) | — |
| `coordinator.dispatch` | — | — | — | — | — | ✓ (line 79) | — | — | — |
| `success`/`error` envelope | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗ (raw union)** | **✗ (raw union)** |
| `redactTextSecrets` | — | — | — | — | — | — | ✓ (line 7) | — | — |

**Observations:**
- 5 tools use the `success`/`error` envelope; 2 use a raw discriminated union; 2 use both (`tmux-copilot` uses `renderToolResult` but bypasses `success`/`error`).
- The `resolveSessionFile` and `safeSessionPath` + `isValidSessionID` triad is the *de facto* CQRS read-side API; 4 tools depend on it.
- The tmux tools are deliberately isolated from the session-tracker read-side.

## 11. Status vocabulary across the 9 tools

| Tool | Status field | Closed set? | Where |
|---|---|---|---|
| session-tracker | `status` from record | NO (wildcard) | n/a |
| session-hierarchy | `status` from record | NO | n/a |
| session-context | `status` from `project-continuity.json` | NO | n/a |
| session-delegation-query | `status` from manifest child | NO | n/a |
| hivemind-session-view | `status` from session record + `"running"\|"dispatched"` for active count | NO | n/a |
| delegate-task | forwards `coordinator.dispatch` result status | Implicit (coord sets) | n/a |
| delegation-status | `VALID_DELEGATION_STATUSES` | **YES (8 values)** | line 134 |
| tmux-copilot | discriminated result union | NO (shape-only) | n/a |
| tmux-state-query | discriminated result union | NO (shape-only) | n/a |

The closed set in `delegation-status.ts:134` is the only canonical status vocabulary. The other tools freely accept any string. **Recommendation:** export `VALID_DELEGATION_STATUSES` (and the `DelegationStatus` type) from `src/shared/types.ts` and have the schema-kernel schemas reference it.

## 12. Recurring anti-patterns

### 12.1 Envelope inconsistency (HIGH)
- 7 tools: `success(...)` / `error(...)` envelope from `src/shared/tool-response.js`.
- 2 tools (`tmux-copilot`, `tmux-state-query`): raw discriminated unions.

The reason documented in `tmux-copilot.ts` is that the SDK's parse-failure path throws; the tool wants to return `{error: {kind: "invalid-input", issues}}` instead. This is a valid design choice, but it makes the 9 tools *incompatible at the type level*. A consumer that writes a generic dispatcher must handle 2 response shapes.

**Recommendation:** Either:
1. Extend `success`/`error` to accept a `kind: "invalid-input" | "permission-denied" | ...` discriminator; or
2. Document in `src/shared/tool-response.js` that tools may return raw unions and consumers must be shape-tolerant.

### 12.2 `readContinuity` and `findHierarchyEntry` are duplicated (HIGH)
- `session-hierarchy.ts:61-75` and `session-hierarchy.ts:78-123` are the originals.
- `session-context.ts:79-93` and `session-context.ts:96-141` are byte-identical copies.

Both files independently maintain these helpers. If a future refactor updates the logic in one, the other will silently drift.

**Recommendation:** Extract to `src/tools/session/continuity-reader.ts` and import in both.

### 12.3 `discoverRootSessions` is triplicated (HIGH)
- `session-tracker.ts:236-275` (in `handleListSessions`).
- `session-delegation-query.ts:263-284` (in `discoverRootSessions`).
- `session-resolver.ts:50-67` (in `resolveSessionFile`).

All three read `project-continuity.json` with a `chronologicalOrder` fallback, then fall back to `readdir` of directories starting with `ses_`. Same algorithm, different implementations.

**Recommendation:** Extract to `src/features/session-tracker/discovery.ts` and import.

### 12.4 N+1 filesystem reads in read-only tools (MED)
- `delegation-status.renderList` (line 660): `for (const d of all) { await canAccessDelegation(...) }` — sequential.
- `session-tracker.handleFilterSessions` (line 351-401): for every directory, reads manifest.
- `session-context.handleCrossReference` (line 181-192): for every directory, reads continuity.
- `session-hierarchy.handleGetParentChain` (line 162-179): for every ancestor, reads continuity.
- `session-hierarchy.computeDepth` (line 192-206): for every node in the tree, reads continuity.

These are all sequential `await` loops. A `Promise.all` parallelization would reduce latency proportional to the number of sessions.

**Recommendation:** Parallelize with `Promise.all` (the typical project has 10-100 sessions; 10x speedup is reasonable).

### 12.5 Status-string inconsistency (MED)
- `session-tracker.filter-sessions` (line 405): `meta.status?.toLowerCase() !== statusLower` — case-insensitive.
- `session-delegation-query.matchesFilters` (line 241): `child.status !== filters.status` — case-sensitive.
- `session-hierarchy.get-children` (line 171): `record.status ?? "unknown"` — pass-through.

A caller filtering by `status: "Active"` will get different results from different tools.

**Recommendation:** Normalize to lowercase in all three.

### 12.6 Cache-then-clear pattern in `delegation-status` (HIGH)
`manifestCache` is set up with a 5s TTL and 10-entry capacity (line 19-22), then immediately cleared at the start of every execute (line 492). The cache is never used.

**Recommendation:** Either remove the cache, or remove the `clear()` call.

### 12.7 Schema/enum/description drift (MED)
- `delegation-status.ts:37` enum: `["status", "get", "list", "control", "find-stackable", "pool", "peek", "progress"]` (8 values).
- `delegation-status.ts:473-477` description: lists only 4 actions.
- The switch statement has no case for `get` (line 502-520).

**Recommendation:** Add a case for `get` that aliases to `status`, or remove `get` from the enum.

### 12.8 Date parsing without validation (MED)
- `session-tracker.handleFilterSessions` (line 347-348): `new Date(...).getTime()` returns `NaN` for bad ISO.
- `session-delegation-query.matchesFilters` (line 248-249): string comparison on `updatedAt` only — bad ISO sorts lexically, which can be wrong.

**Recommendation:** Validate ISO 8601 with a schema refinement.

### 12.9 Stackability `find-stackable` consistency (LOW)
`tmux-copilot` and `delegation-status` both have "find stackable" affordances but with different shapes. The tmux one operates on session IDs only; the delegation-status one returns `stackCommand` / `taskCommand` ready to use.

**Recommendation:** Document the two as different surfaces (one is "which sessions exist" and the other is "what to type next").

### 12.10 Test coverage gaps (HIGH)
Of 9 tools, only 2 have test files in `tests/tools/`:
- `delegate-task` (v2 + e2e)
- `delegation-status` (v2)

The remaining 7 (`session-tracker`, `session-hierarchy`, `session-context`, `session-delegation-query`, `hivemind-session-view`, `tmux-copilot`, `tmux-state-query`) have **zero** direct unit tests.

For `tmux-state-query` in particular, the absence of tests is what allowed the silent-failure stub (Flaw-2.2) to ship.

**Recommendation:** Phase 58.9 UAT should include a "test the tests" pass — every tool must have at least one happy-path test and one error-path test.

---

# PRIORITIZED RECOMMENDATIONS FOR PHASE 58.9

## P0 (Block ship)
1. **Flaw-2.2/2.3/2.4 (CRITICAL):** `tmux-state-query` is a silent-failure stub. Either implement or remove from `src/plugin.ts:930` registration.
2. **Flaw-9.6 (HIGH):** `mergeAllDelegations` downgrades "running" to "cancelled" when the manager has lost the record. This corrupts session-tracker state semantics.
3. **Flaw-9.13 (HIGH):** `progress` action does not merge from session-tracker; manager-only delegations show correctly but tracker-only ones are invisible.
4. **Flaw-9.19 (HIGH):** `peek` action with `delegationId` is advertised but non-functional.

## P1 (Fix before next milestone)
5. **DRY-5.1/6.9:** Extract `readContinuity`/`findHierarchyEntry`/`discoverRootSessions` to shared helpers.
6. **Flaw-9.2/9.3:** Resolve the cache-then-clear pattern in `delegation-status`.
7. **Flaw-9.5 (HIGH):** The `list` action in `session-delegation-query` has a 1000-result cap that silently drops later records.
8. **Flaw-1.6:** `take-over` has a partial-failure window where `manualOverride` is set but `sendPrompt` failed.
9. **Inconsistency-9.17:** `renderList` returns `filtered.length` in the message but `accessible.length` in metadata.

## P2 (Quality of life)
10. **Flaw-12.1:** Envelope inconsistency between the 7 `success/error` tools and the 2 raw-union tmux tools.
11. **Flaw-9.20:** `delegation-status` description lists 4 actions, schema accepts 8.
12. **Flaw-3.5:** `search-sessions` per-line snippet has no char cap.
13. **Flaw-5.3:** `find-related` does not fall back to directory scan when index is stale.
14. **Flaw-8.5:** `delegate-task` hard-codes `currentDepth: 0`; should derive from `context.sessionID`.

## P3 (Documentation)
15. **Flaw-1.2:** `tmux-copilot.ts:49-65` doc-block describes an unimplemented tier model.
16. **Flaw-7.8:** `session-view.schema.ts:24-35` contains an orphan schema that should move to `delegation-status.schema.ts`.
17. **Flaw-9.11:** `UNSUPPORTED_REPLACEMENT_MESSAGE` is exported but unused internally.

---

# APPENDIX A — Phase 58.9 UAT Specific Checklist for tmux tools

For the Phase 58.9 UAT pass, here is the actionable test matrix:

## `tmux-copilot.ts` UAT cases

1. **Bridge not wired:** with `setSessionManagerAdapter(null)`, every action returns `{available: false, reason: "tmux-not-wired"}`.
2. **`send-keys` happy path:** mock adapter, assert `sendKeys(paneId, text, false)` was called.
3. **`send-keys` failure:** mock adapter that throws, assert `{sent: false, paneId, error: {message}}`.
4. **`list-panes` ENOENT:** mock adapter that throws `ENOENT`, assert `{available: false, reason: "tmux-not-installed"}`.
5. **`list-panes` timeout:** mock adapter that throws with code `ETIMEDOUT`, assert `{available: false, reason: "tmux-timeout"}`.
6. **`list-panes` unknown error:** mock that throws a generic Error, assert `{available: false, reason: "tmux-error", error: {message}}`.
7. **`compute-grid`:** pure function, validate input tree is preserved in command list.
8. **`respawn` success:** mock `respawnIfKnown` returns `{paneId: "%1"}`, assert `{respawned: true, paneId: "%1"}`.
9. **`respawn` session-not-closed:** mock returns `null`, assert `{respawned: false, error: {reason: "session-not-closed"}}`.
10. **`forward-prompt` no override:** `setManualOverrideState(sessionId, {manualOverride: false})`, assert sentinel prepended.
11. **`forward-prompt` with override:** `setManualOverrideState(sessionId, {manualOverride: true})`, assert `{suppressed: true, reason: "manualOverride", textPreview: input.text.slice(0,80)}`.
12. **`take-over` with prompt:** mock `getSendPrompt`, assert `manualOverride=true` set AND `sendPrompt(sessionId, prompt, {noReply: true})` called (default steer).
13. **`take-over` promptMode=respond:** assert `noReply: false`.
14. **`take-over` sendPrompt throws:** assert `promptDelivered: false, promptError: <message>` AND `manualOverride` still set.
15. **`take-over` sendPrompt unwired:** assert `promptError: "sendPrompt not wired"`.
16. **`release`:** assert `setManualOverrideState(sessionId, {manualOverride: false})` called.
17. **`peek` with cached capture:** mock `getLatestCapture` returns content, assert correct content + byteLength.
18. **`peek` with no capture:** mock returns `null`, assert `{content: "", byteLength: 0, capturedAt: now()}`.
19. **`peek-by-session` registered:** mock `resolveSessionToPaneId` returns paneId, assert content.
20. **`peek-by-session` not registered:** assert `{error: {kind: "invalid-input", issues: [...]}}`.
21. **Permission gate:** `context.agent = undefined` → `{error: {kind: "permission-denied", agent: "unknown"}}`.
22. **Zod parse failure:** `rawArgs = {action: "send-keys"}` (missing paneId/text) → `{error: {kind: "invalid-input", issues}}`.

## `tmux-state-query.ts` UAT cases

1. **Bridge not wired:** with `setSessionManagerAdapter(null)`, every action returns `{available: false, reason: "tmux-not-wired"}`.
2. **`list-sessions` returns empty array** (expected, see Flaw-2.2).
3. **`get-session` with sessionId returns null** (expected, see Flaw-2.2).
4. **`get-summary` returns zeros** (expected, see Flaw-2.2).
5. **Zod parse failure** → `{error: {kind: "invalid-input", issues}}`.
6. **No callers should rely on the tool's outputs** until Flaw-2.2 is fixed — the UAT report should mark this as a known stub.

---

**End of audit.**
