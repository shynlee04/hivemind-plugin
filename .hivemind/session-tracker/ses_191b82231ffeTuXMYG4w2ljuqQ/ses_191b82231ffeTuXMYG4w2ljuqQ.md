---
sessionID: ses_191b82231ffeTuXMYG4w2ljuqQ
created: 2026-05-28T11:11:04.277Z
updated: 2026-05-28T11:20:00.008Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_191aff4d0ffed6pTHn2113qnjd
    childFile: ses_191aff4d0ffed6pTHn2113qnjd.json
  - sessionID: ses_191aff154ffeMxA3ZqWAjAHm25
    childFile: ses_191aff154ffeMxA3ZqWAjAHm25.json
  - sessionID: ses_191aeeb07ffec923bFODl2W12L
    childFile: ses_191aeeb07ffec923bFODl2W12L.json
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-05-28T11:11:04.142Z
lastMessage: "Tools: task"
---

## USER (turn 1)

**source:** real-human

route autonomous gsd to tackle @.planning/codebase/CONCERNS.md but having check point at each phase now at C3. Only auto on each phase with very strict gatekeeping, planning following TDD and spec driven using specialist agents from GSD and commands of GSD too. At each phase must be the checkpoint and ask for my validation at each phase; do not self decide of thier pass or not. Following all steps do not skip anything 
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md"}
<path>/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md</path>
<type>file</type>
<content>
1: # Codebase Concerns
2: 
3: **Analysis Date:** 2026-05-28
4: 
5: This document catalogs every actionable concern discovered during deep scan of the `hivemind-plugin-private` codebase. Issues are organized by severity (P0–P2) with exact file:line references to enable direct navigation. Each concern includes impact assessment and recommended remediation.
6: 
7: ---
8: 
9: ## 1. Critical Issues (P0)
10: 
11: ### 1.1 Duplicate Union Member in PermissionAction Type
12: 
13: - **File:** `src/shared/types.ts:42`
14: - **Code:** `export type PermissionAction = "allow" | "ask" | "ask"`
15: - **Impact:** The `"ask"` value is duplicated in the union, making it appear to have three valid states when there are only two. This is a silent TypeScript defect — no compiler error is raised, but downstream switch/if statements may have dead branches or incorrect narrowing. Any permission evaluation logic that checks `action === "ask"` works by coincidence but the intent is unclear (was a third action like `"deny"` intended?).
16: - **Fix:** Remove the duplicate: `export type PermissionAction = "allow" | "ask"`. Audit all `switch(action)` blocks in `src/tools/delegation/delegate-task.ts`, `src/coordination/spawner/agent-primitive-policy.ts`, and `src/config/compiler.ts` to verify they handle only the expected values.
17: 
18: ### 1.2 Silent Error Swallowing via `.catch(() => {})`
19: 
20: - **Files:**
21:   - `src/features/session-tracker/capture/event-capture.ts:325` — `backfillChildTurnsFromSdk` errors silently discarded
22:   - `src/features/session-tracker/capture/event-capture.ts:373` — `appendAssistantTurn` errors silently discarded
23:   - `src/features/session-tracker/capture/event-capture.ts:443` — `backfillChildTurnsFromSdk` errors silently discarded
24:   - `src/features/session-tracker/capture/event-capture.ts:500` — `backfillChildTurnsFromSdk` errors silently discarded
25:   - `src/features/session-tracker/persistence/child-writer.ts:223` — Write queue errors silently discarded via `next.catch(() => {})`
26:   - `src/features/session-tracker/initialization.ts:151` — Recovery/orphan cleanup errors silently discarded
27: - **Impact:** These are fire-and-forget patterns where failures are completely invisible. In production, if `backfillChildTurnsFromSdk` or `appendAssistantTurn` consistently fail, the session-tracker will silently produce incomplete data with no observability signal. The child-writer queue at line 223 is particularly dangerous because it means failed writes vanish without entering the retry queue.
28: - **Fix:** Replace `.catch(() => {})` with `.catch((err) => { void client.app?.log?.({ body: { service: "session-tracker", level: "warn", message: `[Harness] <operation> failed`, extra: { error: err instanceof Error ? err.message : String(err) } } }) })` — at minimum log the error. For the child-writer queue at line 223, the catch is intentional (the error is already re-thrown at line 221 and captured by the retry queue), but the `catch(() => {})` on the queued promise should still log at debug level.
29: 
30: ### 1.3 `ClientLike = any` Type Erasure in Session Tracker
31: 
32: - **File:** `src/features/session-tracker/initialization.ts:36-37`
33: - **Code:**
34:   ```typescript
35:   // eslint-disable-next-line @typescript-eslint/no-explicit-any
36:   type ClientLike = any
37:   ```
38: - **Impact:** The entire session-tracker initialization module operates on a fully untyped client reference. This means any call to `this.client.app?.log?.(...)`, `this.client.session.*`, or any SDK surface method is unchecked at compile time. A typo in a method name or incorrect argument shape will only fail at runtime.
39: - **Fix:** Define a minimal `ClientLike` interface matching the actual SDK surface used by session-tracker (approximately: `{ app?: { log?: (entry: LogEntry) => void }; session?: { get: (...args: any[]) => Promise<unknown>; messages: (...args: any[]) => Promise<unknown> } }`). Remove the `eslint-disable` and `any` annotation.
40: 
41: ---
42: 
43: ## 2. Technical Debt (P1)
44: 
45: ### 2.1 Type Safety Gaps — 12 `as any` Casts
46: 
47: **File group A: `src/tools/delegation/delegation-status.ts`**
48: 
49: | Line | Code | Reason |
50: |------|------|--------|
51: | 148 | `(childRecord.status as any)` | Status string cast to `any` for terminal kind mapping |
52: | 169 | `JSON.parse(raw) as any` | Manifest JSON parsed without schema validation |
53: | 174 | `child as any` | Manifest child entry untyped |
54: | 250 | `JSON.parse(raw) as any` | Second manifest parse without schema |
55: | 266 | `child as any` | Second manifest child untyped |
56: | 279 | `child as any` | Third manifest child untyped |
57: | 292 | `child as any` | Fourth manifest child untyped |
58: 
59: **File group B: `src/coordination/delegation/coordinator.ts`**
60: 
61: | Line | Code | Reason |
62: |------|------|--------|
63: | 92 | `(msg as any)?.info ?? msg` | SDK message shape not typed |
64: | 212 | `(m as any)?.info?.role ?? (m as any)?.role` | Dual fallback for role extraction |
65: | 216 | `(lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error` | Error shape not typed |
66: | 219 | `(errorField as any).message \|\| JSON.stringify(errorField)` | Error field type unknown |
67: 
68: **File group C: `src/shared/session-api.ts`**
69: 
70: | Line | Code | Reason |
71: |------|------|--------|
72: | 235 | `} as any))` | SDK showToast body shape mismatch |
73: 
74: - **Impact:** The hierarchy-manifest.json parsing in `delegation-status.ts` is the highest risk — a malformed manifest file will produce silently incorrect delegation status results because all field access goes through `any`. The coordinator `as any` casts on SDK message objects mean that if the SDK changes its message shape, the error only surfaces at runtime.
75: - **Fix:** Create a `HierarchyManifest` interface and a `ChildEntry` interface in `src/features/session-tracker/types.ts` and use them for all manifest parsing. For SDK message objects, create a `SdkMessageLike` type. Eliminate all 12 casts within one phase.
76: 
77: ### 2.2 ESLint Suppressions
78: 
79: - `src/shared/session-api.ts:234` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
80: - `src/features/session-tracker/initialization.ts:36` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
81: - **Impact:** Two explicit eslint-disable comments reduce lint enforcement. The tsconfig has `noUnusedLocals` and `noUnusedParameters` set to `true` (strict mode), but `as any` bypasses all type safety that those rules provide.
82: - **Fix:** Resolve the underlying type mismatches (see 2.1 above) and remove both suppressions.
83: 
84: ### 2.3 Module Size Violations (Max 500 LOC Rule)
85: 
86: | File | LOC | Limit | Over By |
87: |------|-----|-------|---------|
88: | `src/features/session-tracker/capture/event-capture.ts` | 1062 | 500 | +562 (112%) |
89: | `src/tools/session/execute-slash-command.ts` | 629 | 500 | +129 |
90: | `src/features/session-tracker/index.ts` | 622 | 500 | +122 |
91: | `src/features/session-tracker/persistence/child-writer.ts` | 603 | 500 | +103 |
92: | `src/tools/delegation/delegation-status.ts` | 590 | 500 | +90 |
93: | `src/plugin.ts` | 554 | 500 | +54 |
94: | `src/features/session-tracker/tool-delegation.ts` | 502 | 500 | +2 |
95: | `src/features/session-tracker/capture/tool-capture.ts` | 502 | 500 | +2 |
96: | `src/coordination/delegation/manager-runtime.ts` | 491 | 500 | — (within) |
97: | `src/tools/config/configure-primitive.ts` | 490 | 500 | — (within) |
98: | `src/coordination/delegation/coordinator.ts` | 481 | 500 | — (within) |
99: | `src/task-management/continuity/index.ts` | 467 | 500 | — (within) |
100: 
101: - **Impact:** `event-capture.ts` at 1062 LOC is the most severe — it handles `session.idle`, `session.error`, `session.deleted`, `session.next.text.ended`, `session.status`, SDK fallback logic, child session routing, backfill, and pending registry management all in one class. This makes it extremely difficult to test in isolation and nearly impossible to refactor safely.
102: - **Fix:** Extract event handlers into dedicated handler classes: `SessionIdleHandler`, `SessionErrorHandler`, `SessionDeletedHandler`. Extract SDK fallback logic into `SdkFallbackResolver`. Extract backfill logic into `BackfillService`. Target: `event-capture.ts` → 4 handler files averaging ~200 LOC each.
103: 
104: ### 2.4 Deprecated Callback Pattern in `ChildWriter.enqueueWrite`
105: 
106: - **File:** `src/features/session-tracker/persistence/child-writer.ts:200-224`
107: - **Code:** The `enqueueWrite` method uses `.then().catch().then()` promise chaining and manually manages a `writeQueues` Map. Line 223: `this.writeQueues.set(queueKey, next.catch(() => {}))` — the queue entry is set to a promise that swallows errors.
108: - **Impact:** The queue chaining pattern is fragile: if the initial `current` promise is `undefined` (Map miss), it defaults to `Promise.resolve()`, but the subsequent `.catch()` on line 223 replaces the entry with a new chain that discards errors. This means if a write fails and is re-enqueued, the original error is lost from the queue tracking.
109: - **Fix:** Replace with a dedicated `SerialWriteQueue` class that exposes `enqueue(fn, retryData)` with proper error propagation and retry queue integration. The `SessionIndexWriter` has a similar pattern at `src/features/session-tracker/persistence/session-index-writer.ts:112-128`.
110: 
111: ---
112: 
113: ## 3. Security Concerns (P1)
114: 
115: ### 3.1 Console Logging in Production Code
116: 
117: - **Files and Lines:**
118:   - `src/tools/session/execute-slash-command.ts:486` — `console.error(\`[Harness] session.command dispatch failed: ${message}\`)`
119:   - `src/tools/session/dispatch-command.ts:112` — `console.error(\`[Harness] Slash command dispatch failed: ${message}\`)`
120:   - `src/tools/session/resolve-command.ts:23` — `console.log(...)` (in JSDoc but actual code)
121:   - `src/features/session-tracker/persistence/retry-queue.ts:326` — `console.error(...)` with session ID and error details
122:   - `src/features/session-tracker/persistence/session-index-writer.ts:120` — `console.error(...)` with session ID
123:   - `src/features/session-tracker/persistence/session-index-writer.ts:225` — `console.warn(...)` with session ID
124: - **Impact:** Production `console.error`/`console.warn` output may include session IDs, file paths, delegation IDs, and error stack traces that could be captured by log aggregation systems or exposed in terminal output. The `dispatch-command.ts:112` case includes the full error message which may contain file paths from `node:fs` errors.
125: - **Fix:** Replace all `console.error`/`console.warn` in non-test code with the structured logger pattern: `void client.app?.log?.({ body: { service: "<module-name>", level: "warn", message: "[Harness] ..." } })`. For files that don't have access to the `client` reference, thread it through dependencies or use the existing `getConfig()` pattern for service-level logging.
126: 
127: ### 3.2 Unsanitized Session ID in File Paths
128: 
129: - **Files:**
130:   - `src/features/session-tracker/index.ts:132` — `resolve(sessionTrackerRoot(this.projectRoot), sessionID, \`${sessionID}.md\`)`
131:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:47` — `join(this.trackerRoot, sessionID)`
132:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:60` — `join(this.quarantineDir, sessionID)`
133:   - `src/tools/delegation/delegation-status.ts:168` — `safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")`
134: - **Impact:** If a `sessionID` value containing `../` or absolute path segments is injected into the system (via a malicious or malformed delegation record), it could read or write files outside the expected directory tree. While session IDs are typically SDK-generated UUIDs, the codebase does not validate this assumption at the file I/O boundary.
135: - **Fix:** Add a `validateSessionId(id: string): boolean` utility that checks for `^[a-zA-Z0-9_-]+$` (no slashes, dots, or special characters) and call it before any file path construction that includes a session ID. Place the utility in `src/shared/helpers.ts`.
136: 
137: ### 3.3 Synchronous `readFileSync` in Sidecar Module
138: 
139: - **File:** `src/sidecar/readonly-state.ts:93`
140: - **Code:** `return readFileSync(absolutePath, "utf8")`
141: - **Impact:** The sidecar module enforces read-only access, but uses blocking synchronous file I/O. If this is called from an async context (e.g., a Next.js route handler), it blocks the event loop. The `isCanonicalStatePath` guard at line 55 is also synchronous and relies on `path.relative()` which is safe from traversal, but the `readFileSync` at line 93 means a large file read blocks the entire thread.
142: - **Fix:** Add an async version `readCanonicalStateAsync` using `fs.promises.readFile` and prefer it in all async call sites. Keep the sync version as fallback for initialization contexts only.
143: 
144: ### 3.4 Full `process.env` Spread in Governance Session Git Commit
145: 
146: - **File:** `src/features/governance-engine/create-governance-session.ts:114-117`
147: - **Code:**
148:   ```typescript
149:   execSync(
150:     `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
151:     { cwd, env: { ...process.env } },
152:   )
153:   ```
154: - **Impact:** The full `process.env` is passed to `execSync` for a git commit. While git itself doesn't read sensitive env vars, the `execSync` call could be intercepted or the environment could be logged. The `--no-verify` flag also bypasses git hooks, which may be intentional but removes an additional safety layer.
155: - **Fix:** Use a minimal env: `env: { ...process.env, GIT_AUTHOR_NAME: "HiveMind", GIT_AUTHOR_EMAIL: "hivemind@local" }` or better yet, extract git operations to a dedicated utility that doesn't inherit the full parent environment.
156: 
157: ---
158: 
159: ## 4. Performance Issues (P2)
160: 
161: ### 4.1 Repeated JSON.parse Without Memoization
162: 
163: - **File:** `src/tools/delegation/delegation-status.ts:169,250`
164: - **Code:** `const manifest = JSON.parse(raw) as any` — called multiple times for the same `rootSessionId` when resolving children from both session-tracker and legacy persistence.
165: - **Impact:** When checking delegation status for a parent with many children, the same `hierarchy-manifest.json` file is read from disk and parsed multiple times. Each parse allocates new objects and triggers GC pressure.
166: - **Fix:** Add a per-invocation LRU cache keyed by `(projectRoot, rootSessionId)` that returns the parsed manifest. Clear after each tool execution. Alternatively, consolidate the two `getSessionTrackerChildren` and `getLegacyChildren` methods into a single method that parses the manifest once.
167: 
168: ### 4.2 Synchronous File I/O in Bootstrap Init/Recover
169: 
170: - **Files:**
171:   - `src/tools/config/bootstrap-init.ts:1` — Uses `readFileSync`, `writeFileSync`, `mkdirSync`, `cpSync`, `rmSync`
172:   - `src/tools/config/bootstrap-recover.ts:1` — Uses `accessSync`, `cpSync`, `mkdirSync`, `renameSync`, `rmSync`
173:   - `src/tools/config/bootstrap-init.ts:113-136` — `mkdirSync` + `writeFileSync` in loops
174: - **Impact:** Bootstrap/init operations use entirely synchronous file system APIs. While these run once per session startup, they block the event loop during a critical initialization window. The `cpSync` at `bootstrap-init.ts:1` and `bootstrap-recover.ts:1` may copy entire directory trees synchronously.
175: - **Fix:** This is acceptable for CLI commands (`init`, `recover`, `doctor`) since they run synchronously by design. However, `bootstrap-init` is also registered as a plugin tool (line 56 of `plugin.ts`: `createBootstrapInitTool`). When invoked as a tool, it should use async APIs. Split the tool-exposed path to use `fs.promises`.
176: 
177: ### 4.3 Unbounded Timer Accumulation in CompletionDetector
178: 
179: - **File:** `src/coordination/completion/detector.ts:35`
180: - **Code:** `private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()`
181: - **Impact:** Each `recordEvent` call (line 76) creates a new `setTimeout` for stability detection. If many delegations are active simultaneously, the `stabilityTimers` map grows without bound. The timer is only cleared in the `cancel` method (line 165) and the timeout handler (line 185). If a delegation's session events stop arriving (e.g., SDK connection drops), the timer for that delegation remains in memory until the 120s timeout fires.
182: - **Fix:** Add a `pruneStaleTimers(maxAgeMs: number)` method that removes timers older than `maxAgeMs` and call it periodically from the monitor loop.
183: 
184: ### 4.4 `execSync` Blocking in Governance Session Creation
185: 
186: - **File:** `src/features/governance-engine/create-governance-session.ts:114`
187: - **Code:** `execSync(\`git add -A && git commit ...\`)`
188: - **Impact:** The governance session creation uses `execSync` for a git commit, which blocks the entire event loop during the git add + commit operation. In large repositories, this could take several seconds, blocking all other operations in the OpenCode runtime.
189: - **Fix:** Replace with `execFile` (async) from `node:child_process` and wrap in a try/catch that returns the error to the caller. Or use `simple-git` library for a non-blocking API.
190: 
191: ---
192: 
193: ## 5. Code Quality Issues (P2)
194: 
195: ### 5.1 Empty Catch Blocks Hiding Real Errors
196: 
197: 14 locations where `catch { }` or `catch { /* comment */ }` discards errors without logging:
198: 
199: | File | Line | Context |
200: |------|------|---------|
201: | `src/features/session-tracker/persistence/child-writer.ts` | 223 | Queue promise chain |
202: | `src/features/session-tracker/capture/event-capture.ts` | 325 | backfillChildTurnsFromSdk |
203: | `src/features/session-tracker/capture/event-capture.ts` | 373 | appendAssistantTurn |
204: | `src/features/session-tracker/capture/event-capture.ts` | 422 | session fetch failed |
205: | `src/features/session-tracker/capture/event-capture.ts` | 443 | backfillChildTurnsFromSdk |
206: | `src/features/session-tracker/capture/event-capture.ts` | 500 | backfillChildTurnsFromSdk |
207: | `src/features/session-tracker/initialization.ts` | 151 | Recovery/orphan cleanup |
208: | `src/tools/session/session-tracker.ts` | 105 | Unreadable child file |
209: | `src/tools/session/session-tracker.ts` | 107 | No hierarchy manifest |
210: | `src/tools/session/session-tracker.ts` | 311 | Skip unreadable |
211: | `src/tools/session/session-hierarchy.ts` | 280 | Fallback failed |
212: | `src/tools/session/session-context.ts` | 225 | Frontmatter optional |
213: | `src/coordination/delegation/state-machine.ts` | 441 | Abort session failure |
214: | `src/config/compiler.ts` | 359 | Rollback errors |
215: 
216: - **Impact:** These empty catches are categorized into two groups: (a) "acceptable" where the fallback is a read-only operation that failing is expected (e.g., `session-tracker.ts:105` — file doesn't exist yet), and (b) "concerning" where a write or critical operation fails silently (e.g., `event-capture.ts:373` — assistant turn append fails, `child-writer.ts:223` — queue error disappears). The concerning group means production data loss is possible without any signal.
217: - **Fix:** For the "acceptable" group, add a comment explaining why the error is intentionally discarded. For the "concerning" group, add `console.warn` or structured logging. Minimum target: zero silent catches on write operations.
218: 
219: ### 5.2 Inconsistent Error Shape Handling
220: 
221: - **File:** `src/coordination/delegation/coordinator.ts:212-219`
222: - **Code:**
223:   ```typescript
224:   const role = (m as any)?.info?.role ?? (m as any)?.role
225:   // ...
226:   const errorField = (lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error
227:   if (errorField) {
228:     const errorMsg = typeof errorField === "object" && errorField !== null
229:       ? ((errorField as any).message || JSON.stringify(errorField))
230:       : String(errorField)
231:   ```
232: - **Impact:** This triple-fallback pattern (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(error)`) indicates the SDK message shape has changed at least once, and the code has been patched with new fallbacks rather than updating the old code. The `JSON.stringify(errorField)` fallback at line 219 means that if the error is a complex object, the stringified version is used as the error message — potentially producing very long, unhelpful error strings.
233: - **Fix:** Create a `SdkMessageShape` type union that covers all known SDK message formats. Use `zod` to validate at the boundary (the project already has `zod` as a dependency). Replace the chain with a single typed extraction.
234: 
235: ### 5.3 Command Delegation Env Propagation (Partially Fixed)
236: 
237: - **File:** `src/coordination/command-delegation/handler.ts:375-381`
238: - **Code:** The `buildMinimalEnv` method now uses an allowlist: `const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]`
239: - **Status:** PARTIALLY FIXED. The allowlist is correct and safe for the `buildMinimalEnv` path. However, the `doctor.ts:244` still passes `{ ...process.env, CI: "true" }` to `spawnSync` — acceptable for a diagnostic tool but not for production delegation paths.
240: - **Remaining risk:** The `create-governance-session.ts:116` still passes `{ ...process.env }` to `execSync` (see concern 3.4 above).
241: 
242: ---
243: 
244: ## 6. Architectural Fragility (P2)
245: 
246: ### 6.1 Session Tracker as a God Module
247: 
248: - **Files:** `src/features/session-tracker/` (entire directory, 6+ files exceeding 500 LOC)
249: - **Why fragile:** The session-tracker handles event capture, child session routing, backfill from SDK, hierarchy indexing, persistence (write queues, retry queues, orphan quarantine), and recovery — all tightly coupled. A change to event capture (`event-capture.ts:1062 LOC`) risks breaking persistence (`child-writer.ts:603 LOC`) because they share the same `pendingRegistry`, `sessionIndexWriter`, and `childWriter` references.
250: - **What could break:** Adding a new event type (e.g., `session.message.updated`) requires modifying `event-capture.ts` which is already over capacity. The event handler methods (`handleSessionIdle`, `handleSessionError`, `handleSessionDeleted`) each have 100+ LOC with 5-10 `await` calls and multiple catch blocks.
251: - **How to improve:** Apply the Single Responsibility Principle — extract each event handler into its own class, inject the shared writers via dependency injection, and reduce `event-capture.ts` to an event router that delegates to handler classes.
252: 
253: ### 6.2 Delegation Status Tool Depends on Two Persistence Formats
254: 
255: - **File:** `src/tools/delegation/delegation-status.ts` (590 LOC)
256: - **Why fragile:** The tool reads delegation status from both the new session-tracker format (`hierarchy-manifest.json`) and the legacy persistence format (`delegations.json`). Each format has different JSON shapes, parsed via `as any`. The tool also has a third code path for direct delegation records.
257: - **What could break:** If either persistence format changes shape, the `as any` casts silently produce incorrect delegation status. There is no integration test that validates the end-to-end flow from delegation creation → persistence → status read.
258: - **How to improve:** Create a `DelegationStatusReader` interface with two implementations: `SessionTrackerStatusReader` and `LegacyPersistenceStatusReader`. Add Zod schemas for each format and validate at the boundary.
259: 
260: ### 6.3 Plugin.ts as Monolithic Composition Root
261: 
262: - **File:** `src/plugin.ts` (554 LOC)
263: - **Why fragile:** This file imports 60+ modules and wires them together. Adding a new tool requires modifying this file, which increases merge conflict risk and cognitive load. The `deps` object at line 377 is a single mega-object with 12+ properties.
264: - **What could break:** The order of initialization matters (e.g., `delegationManager.setCompletionDetector` at line 328 must happen after lifecycle manager creation at line 306). Reordering any initialization step can break the runtime.
265: - **How to improve:** Group tool registrations by domain (delegation, session, config, hivemind) into separate `registerXxxTools()` functions. Group hook factories similarly. Reduce the `deps` object to domain-specific sub-objects.
266: 
267: ---
268: 
269: ## 7. Test Coverage Gaps (P2)
270: 
271: ### 7.1 Untested Core Modules
272: 
273: | Module | Source Files | Tests | Risk |
274: |--------|-------------|-------|------|
275: | `src/hooks/guards/governance-block.ts` | 1 file | None | **High** — governance blocking logic is untested |
276: | `src/hooks/lifecycle/core-hooks.ts` | 1 file | None | **High** — core lifecycle hooks untested |
277: | `src/hooks/lifecycle/session-hooks.ts` | 1 file | None | **High** — session event handling untested |
278: | `src/hooks/observers/event-observers.ts` | 1 file | None | **Medium** — observer factories untested |
279: | `src/hooks/observers/session-entry-consumer.ts` | 1 file | None | **Medium** — session entry consumer untested |
280: | `src/hooks/observers/session-main-consumer.ts` | 1 file | None | **Medium** — session main consumer untested |
281: | `src/hooks/observers/delegation-consumer.ts` | 1 file | None | **Medium** — delegation consumer untested |
282: | `src/hooks/observers/session-tracker-consumer.ts` | 1 file | None | **Medium** — session tracker consumer untested |
283: | `src/hooks/transforms/tool-after-workflow.ts` | 1 file | None | **Medium** — workflow transform untested |
284: | `src/hooks/composition/cqrs-boundary.ts` | 1 file | None | **Low** — boundary guard untested |
285: | `src/config/compiler.ts` | 1 file | `tests/lib/config-compiler.test.ts` | **Low** — has tests |
286: 
287: ### 7.2 Total Coverage Gap Analysis
288: 
289: - **Source files:** 228 TypeScript files in `src/`
290: - **Test files:** ~203 test files in `tests/`
291: - **Estimated source files without direct test coverage:** ~80-100 files
292: - **Highest risk untested paths:**
293:   1. All hooks modules (`src/hooks/`) — 0 test files for 10+ source files
294:   2. `src/coordination/spawner/` — only 3 of 7+ files have tests
295:   3. `src/features/governance-engine/` — only 2 test files for 4+ source files
296:   4. `src/task-management/journal/` — only `journal-query.test.ts` and `journal-replay.test.ts` cover 4 source files
297: 
298: ### 7.3 Missing Integration Tests for Session Tracker Race Conditions
299: 
300: - **Context:** The existing CONCERNS.md documents BUG-3 and BUG-5 fixes in the session-tracker (race conditions in child session registration and SDK message fallback).
301: - **File:** `src/features/session-tracker/tool-delegation.ts:276,332,348` — race condition fixes
302: - **File:** `src/features/session-tracker/persistence/session-index-writer.ts:222` — BUG-5 fix
303: - **Risk:** These fixes are verified by unit tests but lack integration tests that exercise the full delegation → event capture → persistence → status read flow with timing-dependent operations.
304: - **Fix:** Create `tests/integration/session-tracker-race-conditions.test.ts` that uses `vi.useFakeTimers()` to simulate concurrent `session.idle` and `recordChildTaskDelegation` events.
305: 
306: ---
307: 
308: ## 8. Dependency Concerns (P2)
309: 
310: ### 8.1 `bun-pty` in dependencies (not optionalDependencies)
311: 
312: - **Package:** `bun-pty@^0.4.8` listed under `dependencies` in `package.json:44`
313: - **Risk:** `bun-pty` is a Bun-specific PTY library. The project targets `node >= 20.0.0` (package.json:94). While the runtime gracefully falls back to headless `node:child_process` (per AGENTS.md Phase 16.2.1), `bun-pty` in `dependencies` means `npm install` on Node will attempt to install it and may fail or produce warnings. The type declarations at `src/features/background-command/pty/bun-pty.d.ts` exist to handle this, but it's a fragile arrangement.
314: - **Fix:** Move `bun-pty` from `dependencies` to `optionalDependencies` in `package.json`. This is already the intent per the AGENTS.md documentation but was not reflected in the actual manifest.
315: 
316: ### 8.2 `bun-types` in dependencies
317: 
318: - **Package:** `bun-types@^1.3.14` listed under `dependencies` in `package.json:45`
319: - **Risk:** `bun-types` provides TypeScript types for Bun-specific APIs. It should be a devDependency (used only at compile time for type-checking), not a runtime dependency. Shipping it in the published npm package increases install size unnecessarily.
320: - **Fix:** Move `bun-types` from `dependencies` to `devDependencies`.
321: 
322: ### 8.3 Zod v4 Upgrade
323: 
324: - **Package:** `zod@^4.4.3` in `package.json:48`
325: - **Risk:** The project uses Zod v4 which is a major version upgrade from v3. While the codebase has been updated, some patterns like `z.prettifyError(parsed.error)` at `src/tools/delegation/delegate-task.ts:35` are Zod v4-specific. If the Zod team introduces breaking changes in v4.x minor releases, multiple schema files would need updates.
326: - **Fix:** Pin to a specific minor version (e.g., `zod@~4.4.3`) instead of using caret range. The `stack-l3-zod` skill documents the full v4 API for reference.
327: 
328: ### 8.4 Peer Dependency Alignment
329: 
330: - **Package:** `@opencode-ai/plugin@^1.15.10` as both peer and dev dependency, `@opencode-ai/sdk@^1.15.10` as a dependency
331: - **Risk:** The peer dependency version must match the host OpenCode version. If a user installs Hivemind with an older OpenCode version that has a different SDK surface, the `as any` casts in `coordinator.ts` (see 2.1) will mask the incompatibility at compile time but fail at runtime.
332: - **Fix:** Add a runtime version check in `plugin.ts` that validates the SDK version matches expectations at initialization time.
333: 
334: ---
335: 
336: ## 9. Priority Summary
337: 
338: | # | Issue | Severity | Effort | Files Affected |
339: |---|-------|----------|--------|----------------|
340: | 1.1 | Duplicate PermissionAction union member | P0 | XS | `src/shared/types.ts` |
341: | 1.2 | Silent error swallowing `.catch(() => {})` | P0 | S | `src/features/session-tracker/capture/event-capture.ts`, `child-writer.ts`, `initialization.ts` |
342: | 1.3 | `ClientLike = any` type erasure | P0 | M | `src/features/session-tracker/initialization.ts` |
343: | 2.1 | 12 `as any` casts (type safety gaps) | P1 | L | `delegation-status.ts`, `coordinator.ts`, `session-api.ts` |
344: | 2.2 | ESLint suppressions | P1 | S | `session-api.ts`, `initialization.ts` |
345: | 2.3 | Module size violations (8 files >500 LOC) | P1 | L | `event-capture.ts`, `execute-slash-command.ts`, `index.ts`, `child-writer.ts`, etc. |
346: | 2.4 | Fragile promise chain in ChildWriter | P1 | M | `src/features/session-tracker/persistence/child-writer.ts` |
347: | 3.1 | Console logging in production code | P1 | S | `execute-slash-command.ts`, `dispatch-command.ts`, `retry-queue.ts`, `session-index-writer.ts` |
348: | 3.2 | Unsanitized session ID in file paths | P1 | S | `session-tracker/index.ts`, `orphan-quarantine.ts`, `delegation-status.ts` |
349: | 3.3 | Synchronous readFileSync in sidecar | P1 | S | `src/sidecar/readonly-state.ts` |
350: | 3.4 | Full process.env spread in governance git commit | P1 | S | `src/features/governance-engine/create-governance-session.ts` |
351: | 4.1 | Repeated JSON.parse without memoization | P2 | S | `delegation-status.ts` |
352: | 4.2 | Synchronous FS in bootstrap-init tool | P2 | M | `bootstrap-init.ts` |
353: | 4.3 | Unbounded timer accumulation | P2 | S | `src/coordination/completion/detector.ts` |
354: | 4.4 | execSync blocking in governance session creation | P2 | S | `src/features/governance-engine/create-governance-session.ts` |
355: | 5.1 | 14 empty catch blocks | P2 | S | `event-capture.ts`, `child-writer.ts`, `session-tracker.ts`, etc. |
356: | 5.2 | Inconsistent error shape handling | P2 | M | `src/coordination/delegation/coordinator.ts` |
357: | 6.1 | Session tracker god module | P2 | XL | `src/features/session-tracker/` |
358: | 6.2 | Dual persistence format dependency | P2 | L | `src/tools/delegation/delegation-status.ts` |
359: | 6.3 | Plugin.ts monolithic composition | P2 | L | `src/plugin.ts` |
360: | 7.1 | Untested hooks modules (0 coverage) | P2 | L | `src/hooks/` (10+ files) |
361: | 7.2 | ~80-100 source files without tests | P2 | XL | Various |
362: | 7.3 | Missing integration tests for race conditions | P2 | M | `src/features/session-tracker/` |
363: | 8.1 | bun-pty in dependencies (not optional) | P2 | XS | `package.json` |
364: | 8.2 | bun-types in dependencies (should be dev) | P2 | XS | `package.json` |
365: | 8.3 | Zod v4 pinned with caret range | P2 | S | `package.json` |
366: | 8.4 | No runtime SDK version validation | P2 | S | `src/plugin.ts` |
367: 
368: **Legend:** XS = <1 hour, S = 1-4 hours, M = 4-8 hours, L = 1-3 days, XL = 3+ days
369: 
370: ---
371: 
372: *Concerns audit: 2026-05-28*

(End of file - total 372 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>

## USER (turn 2)

**source:** real-human

route autonomous gsd to tackle @.planning/codebase/CONCERNS.md but having check point at each phase now at C3. Only auto on each phase with very strict gatekeeping, planning following TDD and spec driven using specialist agents from GSD and commands of GSD too. At each phase must be the checkpoint and ask for my validation at each phase; do not self decide of thier pass or not. Following all steps do not skip anything 
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md"}
<path>/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md</path>
<type>file</type>
<content>
1: # Codebase Concerns
2: 
3: **Analysis Date:** 2026-05-28
4: 
5: This document catalogs every actionable concern discovered during deep scan of the `hivemind-plugin-private` codebase. Issues are organized by severity (P0–P2) with exact file:line references to enable direct navigation. Each concern includes impact assessment and recommended remediation.
6: 
7: ---
8: 
9: ## 1. Critical Issues (P0)
10: 
11: ### 1.1 Duplicate Union Member in PermissionAction Type
12: 
13: - **File:** `src/shared/types.ts:42`
14: - **Code:** `export type PermissionAction = "allow" | "ask" | "ask"`
15: - **Impact:** The `"ask"` value is duplicated in the union, making it appear to have three valid states when there are only two. This is a silent TypeScript defect — no compiler error is raised, but downstream switch/if statements may have dead branches or incorrect narrowing. Any permission evaluation logic that checks `action === "ask"` works by coincidence but the intent is unclear (was a third action like `"deny"` intended?).
16: - **Fix:** Remove the duplicate: `export type PermissionAction = "allow" | "ask"`. Audit all `switch(action)` blocks in `src/tools/delegation/delegate-task.ts`, `src/coordination/spawner/agent-primitive-policy.ts`, and `src/config/compiler.ts` to verify they handle only the expected values.
17: 
18: ### 1.2 Silent Error Swallowing via `.catch(() => {})`
19: 
20: - **Files:**
21:   - `src/features/session-tracker/capture/event-capture.ts:325` — `backfillChildTurnsFromSdk` errors silently discarded
22:   - `src/features/session-tracker/capture/event-capture.ts:373` — `appendAssistantTurn` errors silently discarded
23:   - `src/features/session-tracker/capture/event-capture.ts:443` — `backfillChildTurnsFromSdk` errors silently discarded
24:   - `src/features/session-tracker/capture/event-capture.ts:500` — `backfillChildTurnsFromSdk` errors silently discarded
25:   - `src/features/session-tracker/persistence/child-writer.ts:223` — Write queue errors silently discarded via `next.catch(() => {})`
26:   - `src/features/session-tracker/initialization.ts:151` — Recovery/orphan cleanup errors silently discarded
27: - **Impact:** These are fire-and-forget patterns where failures are completely invisible. In production, if `backfillChildTurnsFromSdk` or `appendAssistantTurn` consistently fail, the session-tracker will silently produce incomplete data with no observability signal. The child-writer queue at line 223 is particularly dangerous because it means failed writes vanish without entering the retry queue.
28: - **Fix:** Replace `.catch(() => {})` with `.catch((err) => { void client.app?.log?.({ body: { service: "session-tracker", level: "warn", message: `[Harness] <operation> failed`, extra: { error: err instanceof Error ? err.message : String(err) } } }) })` — at minimum log the error. For the child-writer queue at line 223, the catch is intentional (the error is already re-thrown at line 221 and captured by the retry queue), but the `catch(() => {})` on the queued promise should still log at debug level.
29: 
30: ### 1.3 `ClientLike = any` Type Erasure in Session Tracker
31: 
32: - **File:** `src/features/session-tracker/initialization.ts:36-37`
33: - **Code:**
34:   ```typescript
35:   // eslint-disable-next-line @typescript-eslint/no-explicit-any
36:   type ClientLike = any
37:   ```
38: - **Impact:** The entire session-tracker initialization module operates on a fully untyped client reference. This means any call to `this.client.app?.log?.(...)`, `this.client.session.*`, or any SDK surface method is unchecked at compile time. A typo in a method name or incorrect argument shape will only fail at runtime.
39: - **Fix:** Define a minimal `ClientLike` interface matching the actual SDK surface used by session-tracker (approximately: `{ app?: { log?: (entry: LogEntry) => void }; session?: { get: (...args: any[]) => Promise<unknown>; messages: (...args: any[]) => Promise<unknown> } }`). Remove the `eslint-disable` and `any` annotation.
40: 
41: ---
42: 
43: ## 2. Technical Debt (P1)
44: 
45: ### 2.1 Type Safety Gaps — 12 `as any` Casts
46: 
47: **File group A: `src/tools/delegation/delegation-status.ts`**
48: 
49: | Line | Code | Reason |
50: |------|------|--------|
51: | 148 | `(childRecord.status as any)` | Status string cast to `any` for terminal kind mapping |
52: | 169 | `JSON.parse(raw) as any` | Manifest JSON parsed without schema validation |
53: | 174 | `child as any` | Manifest child entry untyped |
54: | 250 | `JSON.parse(raw) as any` | Second manifest parse without schema |
55: | 266 | `child as any` | Second manifest child untyped |
56: | 279 | `child as any` | Third manifest child untyped |
57: | 292 | `child as any` | Fourth manifest child untyped |
58: 
59: **File group B: `src/coordination/delegation/coordinator.ts`**
60: 
61: | Line | Code | Reason |
62: |------|------|--------|
63: | 92 | `(msg as any)?.info ?? msg` | SDK message shape not typed |
64: | 212 | `(m as any)?.info?.role ?? (m as any)?.role` | Dual fallback for role extraction |
65: | 216 | `(lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error` | Error shape not typed |
66: | 219 | `(errorField as any).message \|\| JSON.stringify(errorField)` | Error field type unknown |
67: 
68: **File group C: `src/shared/session-api.ts`**
69: 
70: | Line | Code | Reason |
71: |------|------|--------|
72: | 235 | `} as any))` | SDK showToast body shape mismatch |
73: 
74: - **Impact:** The hierarchy-manifest.json parsing in `delegation-status.ts` is the highest risk — a malformed manifest file will produce silently incorrect delegation status results because all field access goes through `any`. The coordinator `as any` casts on SDK message objects mean that if the SDK changes its message shape, the error only surfaces at runtime.
75: - **Fix:** Create a `HierarchyManifest` interface and a `ChildEntry` interface in `src/features/session-tracker/types.ts` and use them for all manifest parsing. For SDK message objects, create a `SdkMessageLike` type. Eliminate all 12 casts within one phase.
76: 
77: ### 2.2 ESLint Suppressions
78: 
79: - `src/shared/session-api.ts:234` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
80: - `src/features/session-tracker/initialization.ts:36` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
81: - **Impact:** Two explicit eslint-disable comments reduce lint enforcement. The tsconfig has `noUnusedLocals` and `noUnusedParameters` set to `true` (strict mode), but `as any` bypasses all type safety that those rules provide.
82: - **Fix:** Resolve the underlying type mismatches (see 2.1 above) and remove both suppressions.
83: 
84: ### 2.3 Module Size Violations (Max 500 LOC Rule)
85: 
86: | File | LOC | Limit | Over By |
87: |------|-----|-------|---------|
88: | `src/features/session-tracker/capture/event-capture.ts` | 1062 | 500 | +562 (112%) |
89: | `src/tools/session/execute-slash-command.ts` | 629 | 500 | +129 |
90: | `src/features/session-tracker/index.ts` | 622 | 500 | +122 |
91: | `src/features/session-tracker/persistence/child-writer.ts` | 603 | 500 | +103 |
92: | `src/tools/delegation/delegation-status.ts` | 590 | 500 | +90 |
93: | `src/plugin.ts` | 554 | 500 | +54 |
94: | `src/features/session-tracker/tool-delegation.ts` | 502 | 500 | +2 |
95: | `src/features/session-tracker/capture/tool-capture.ts` | 502 | 500 | +2 |
96: | `src/coordination/delegation/manager-runtime.ts` | 491 | 500 | — (within) |
97: | `src/tools/config/configure-primitive.ts` | 490 | 500 | — (within) |
98: | `src/coordination/delegation/coordinator.ts` | 481 | 500 | — (within) |
99: | `src/task-management/continuity/index.ts` | 467 | 500 | — (within) |
100: 
101: - **Impact:** `event-capture.ts` at 1062 LOC is the most severe — it handles `session.idle`, `session.error`, `session.deleted`, `session.next.text.ended`, `session.status`, SDK fallback logic, child session routing, backfill, and pending registry management all in one class. This makes it extremely difficult to test in isolation and nearly impossible to refactor safely.
102: - **Fix:** Extract event handlers into dedicated handler classes: `SessionIdleHandler`, `SessionErrorHandler`, `SessionDeletedHandler`. Extract SDK fallback logic into `SdkFallbackResolver`. Extract backfill logic into `BackfillService`. Target: `event-capture.ts` → 4 handler files averaging ~200 LOC each.
103: 
104: ### 2.4 Deprecated Callback Pattern in `ChildWriter.enqueueWrite`
105: 
106: - **File:** `src/features/session-tracker/persistence/child-writer.ts:200-224`
107: - **Code:** The `enqueueWrite` method uses `.then().catch().then()` promise chaining and manually manages a `writeQueues` Map. Line 223: `this.writeQueues.set(queueKey, next.catch(() => {}))` — the queue entry is set to a promise that swallows errors.
108: - **Impact:** The queue chaining pattern is fragile: if the initial `current` promise is `undefined` (Map miss), it defaults to `Promise.resolve()`, but the subsequent `.catch()` on line 223 replaces the entry with a new chain that discards errors. This means if a write fails and is re-enqueued, the original error is lost from the queue tracking.
109: - **Fix:** Replace with a dedicated `SerialWriteQueue` class that exposes `enqueue(fn, retryData)` with proper error propagation and retry queue integration. The `SessionIndexWriter` has a similar pattern at `src/features/session-tracker/persistence/session-index-writer.ts:112-128`.
110: 
111: ---
112: 
113: ## 3. Security Concerns (P1)
114: 
115: ### 3.1 Console Logging in Production Code
116: 
117: - **Files and Lines:**
118:   - `src/tools/session/execute-slash-command.ts:486` — `console.error(\`[Harness] session.command dispatch failed: ${message}\`)`
119:   - `src/tools/session/dispatch-command.ts:112` — `console.error(\`[Harness] Slash command dispatch failed: ${message}\`)`
120:   - `src/tools/session/resolve-command.ts:23` — `console.log(...)` (in JSDoc but actual code)
121:   - `src/features/session-tracker/persistence/retry-queue.ts:326` — `console.error(...)` with session ID and error details
122:   - `src/features/session-tracker/persistence/session-index-writer.ts:120` — `console.error(...)` with session ID
123:   - `src/features/session-tracker/persistence/session-index-writer.ts:225` — `console.warn(...)` with session ID
124: - **Impact:** Production `console.error`/`console.warn` output may include session IDs, file paths, delegation IDs, and error stack traces that could be captured by log aggregation systems or exposed in terminal output. The `dispatch-command.ts:112` case includes the full error message which may contain file paths from `node:fs` errors.
125: - **Fix:** Replace all `console.error`/`console.warn` in non-test code with the structured logger pattern: `void client.app?.log?.({ body: { service: "<module-name>", level: "warn", message: "[Harness] ..." } })`. For files that don't have access to the `client` reference, thread it through dependencies or use the existing `getConfig()` pattern for service-level logging.
126: 
127: ### 3.2 Unsanitized Session ID in File Paths
128: 
129: - **Files:**
130:   - `src/features/session-tracker/index.ts:132` — `resolve(sessionTrackerRoot(this.projectRoot), sessionID, \`${sessionID}.md\`)`
131:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:47` — `join(this.trackerRoot, sessionID)`
132:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:60` — `join(this.quarantineDir, sessionID)`
133:   - `src/tools/delegation/delegation-status.ts:168` — `safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")`
134: - **Impact:** If a `sessionID` value containing `../` or absolute path segments is injected into the system (via a malicious or malformed delegation record), it could read or write files outside the expected directory tree. While session IDs are typically SDK-generated UUIDs, the codebase does not validate this assumption at the file I/O boundary.
135: - **Fix:** Add a `validateSessionId(id: string): boolean` utility that checks for `^[a-zA-Z0-9_-]+$` (no slashes, dots, or special characters) and call it before any file path construction that includes a session ID. Place the utility in `src/shared/helpers.ts`.
136: 
137: ### 3.3 Synchronous `readFileSync` in Sidecar Module
138: 
139: - **File:** `src/sidecar/readonly-state.ts:93`
140: - **Code:** `return readFileSync(absolutePath, "utf8")`
141: - **Impact:** The sidecar module enforces read-only access, but uses blocking synchronous file I/O. If this is called from an async context (e.g., a Next.js route handler), it blocks the event loop. The `isCanonicalStatePath` guard at line 55 is also synchronous and relies on `path.relative()` which is safe from traversal, but the `readFileSync` at line 93 means a large file read blocks the entire thread.
142: - **Fix:** Add an async version `readCanonicalStateAsync` using `fs.promises.readFile` and prefer it in all async call sites. Keep the sync version as fallback for initialization contexts only.
143: 
144: ### 3.4 Full `process.env` Spread in Governance Session Git Commit
145: 
146: - **File:** `src/features/governance-engine/create-governance-session.ts:114-117`
147: - **Code:**
148:   ```typescript
149:   execSync(
150:     `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
151:     { cwd, env: { ...process.env } },
152:   )
153:   ```
154: - **Impact:** The full `process.env` is passed to `execSync` for a git commit. While git itself doesn't read sensitive env vars, the `execSync` call could be intercepted or the environment could be logged. The `--no-verify` flag also bypasses git hooks, which may be intentional but removes an additional safety layer.
155: - **Fix:** Use a minimal env: `env: { ...process.env, GIT_AUTHOR_NAME: "HiveMind", GIT_AUTHOR_EMAIL: "hivemind@local" }` or better yet, extract git operations to a dedicated utility that doesn't inherit the full parent environment.
156: 
157: ---
158: 
159: ## 4. Performance Issues (P2)
160: 
161: ### 4.1 Repeated JSON.parse Without Memoization
162: 
163: - **File:** `src/tools/delegation/delegation-status.ts:169,250`
164: - **Code:** `const manifest = JSON.parse(raw) as any` — called multiple times for the same `rootSessionId` when resolving children from both session-tracker and legacy persistence.
165: - **Impact:** When checking delegation status for a parent with many children, the same `hierarchy-manifest.json` file is read from disk and parsed multiple times. Each parse allocates new objects and triggers GC pressure.
166: - **Fix:** Add a per-invocation LRU cache keyed by `(projectRoot, rootSessionId)` that returns the parsed manifest. Clear after each tool execution. Alternatively, consolidate the two `getSessionTrackerChildren` and `getLegacyChildren` methods into a single method that parses the manifest once.
167: 
168: ### 4.2 Synchronous File I/O in Bootstrap Init/Recover
169: 
170: - **Files:**
171:   - `src/tools/config/bootstrap-init.ts:1` — Uses `readFileSync`, `writeFileSync`, `mkdirSync`, `cpSync`, `rmSync`
172:   - `src/tools/config/bootstrap-recover.ts:1` — Uses `accessSync`, `cpSync`, `mkdirSync`, `renameSync`, `rmSync`
173:   - `src/tools/config/bootstrap-init.ts:113-136` — `mkdirSync` + `writeFileSync` in loops
174: - **Impact:** Bootstrap/init operations use entirely synchronous file system APIs. While these run once per session startup, they block the event loop during a critical initialization window. The `cpSync` at `bootstrap-init.ts:1` and `bootstrap-recover.ts:1` may copy entire directory trees synchronously.
175: - **Fix:** This is acceptable for CLI commands (`init`, `recover`, `doctor`) since they run synchronously by design. However, `bootstrap-init` is also registered as a plugin tool (line 56 of `plugin.ts`: `createBootstrapInitTool`). When invoked as a tool, it should use async APIs. Split the tool-exposed path to use `fs.promises`.
176: 
177: ### 4.3 Unbounded Timer Accumulation in CompletionDetector
178: 
179: - **File:** `src/coordination/completion/detector.ts:35`
180: - **Code:** `private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()`
181: - **Impact:** Each `recordEvent` call (line 76) creates a new `setTimeout` for stability detection. If many delegations are active simultaneously, the `stabilityTimers` map grows without bound. The timer is only cleared in the `cancel` method (line 165) and the timeout handler (line 185). If a delegation's session events stop arriving (e.g., SDK connection drops), the timer for that delegation remains in memory until the 120s timeout fires.
182: - **Fix:** Add a `pruneStaleTimers(maxAgeMs: number)` method that removes timers older than `maxAgeMs` and call it periodically from the monitor loop.
183: 
184: ### 4.4 `execSync` Blocking in Governance Session Creation
185: 
186: - **File:** `src/features/governance-engine/create-governance-session.ts:114`
187: - **Code:** `execSync(\`git add -A && git commit ...\`)`
188: - **Impact:** The governance session creation uses `execSync` for a git commit, which blocks the entire event loop during the git add + commit operation. In large repositories, this could take several seconds, blocking all other operations in the OpenCode runtime.
189: - **Fix:** Replace with `execFile` (async) from `node:child_process` and wrap in a try/catch that returns the error to the caller. Or use `simple-git` library for a non-blocking API.
190: 
191: ---
192: 
193: ## 5. Code Quality Issues (P2)
194: 
195: ### 5.1 Empty Catch Blocks Hiding Real Errors
196: 
197: 14 locations where `catch { }` or `catch { /* comment */ }` discards errors without logging:
198: 
199: | File | Line | Context |
200: |------|------|---------|
201: | `src/features/session-tracker/persistence/child-writer.ts` | 223 | Queue promise chain |
202: | `src/features/session-tracker/capture/event-capture.ts` | 325 | backfillChildTurnsFromSdk |
203: | `src/features/session-tracker/capture/event-capture.ts` | 373 | appendAssistantTurn |
204: | `src/features/session-tracker/capture/event-capture.ts` | 422 | session fetch failed |
205: | `src/features/session-tracker/capture/event-capture.ts` | 443 | backfillChildTurnsFromSdk |
206: | `src/features/session-tracker/capture/event-capture.ts` | 500 | backfillChildTurnsFromSdk |
207: | `src/features/session-tracker/initialization.ts` | 151 | Recovery/orphan cleanup |
208: | `src/tools/session/session-tracker.ts` | 105 | Unreadable child file |
209: | `src/tools/session/session-tracker.ts` | 107 | No hierarchy manifest |
210: | `src/tools/session/session-tracker.ts` | 311 | Skip unreadable |
211: | `src/tools/session/session-hierarchy.ts` | 280 | Fallback failed |
212: | `src/tools/session/session-context.ts` | 225 | Frontmatter optional |
213: | `src/coordination/delegation/state-machine.ts` | 441 | Abort session failure |
214: | `src/config/compiler.ts` | 359 | Rollback errors |
215: 
216: - **Impact:** These empty catches are categorized into two groups: (a) "acceptable" where the fallback is a read-only operation that failing is expected (e.g., `session-tracker.ts:105` — file doesn't exist yet), and (b) "concerning" where a write or critical operation fails silently (e.g., `event-capture.ts:373` — assistant turn append fails, `child-writer.ts:223` — queue error disappears). The concerning group means production data loss is possible without any signal.
217: - **Fix:** For the "acceptable" group, add a comment explaining why the error is intentionally discarded. For the "concerning" group, add `console.warn` or structured logging. Minimum target: zero silent catches on write operations.
218: 
219: ### 5.2 Inconsistent Error Shape Handling
220: 
221: - **File:** `src/coordination/delegation/coordinator.ts:212-219`
222: - **Code:**
223:   ```typescript
224:   const role = (m as any)?.info?.role ?? (m as any)?.role
225:   // ...
226:   const errorField = (lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error
227:   if (errorField) {
228:     const errorMsg = typeof errorField === "object" && errorField !== null
229:       ? ((errorField as any).message || JSON.stringify(errorField))
230:       : String(errorField)
231:   ```
232: - **Impact:** This triple-fallback pattern (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(error)`) indicates the SDK message shape has changed at least once, and the code has been patched with new fallbacks rather than updating the old code. The `JSON.stringify(errorField)` fallback at line 219 means that if the error is a complex object, the stringified version is used as the error message — potentially producing very long, unhelpful error strings.
233: - **Fix:** Create a `SdkMessageShape` type union that covers all known SDK message formats. Use `zod` to validate at the boundary (the project already has `zod` as a dependency). Replace the chain with a single typed extraction.
234: 
235: ### 5.3 Command Delegation Env Propagation (Partially Fixed)
236: 
237: - **File:** `src/coordination/command-delegation/handler.ts:375-381`
238: - **Code:** The `buildMinimalEnv` method now uses an allowlist: `const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]`
239: - **Status:** PARTIALLY FIXED. The allowlist is correct and safe for the `buildMinimalEnv` path. However, the `doctor.ts:244` still passes `{ ...process.env, CI: "true" }` to `spawnSync` — acceptable for a diagnostic tool but not for production delegation paths.
240: - **Remaining risk:** The `create-governance-session.ts:116` still passes `{ ...process.env }` to `execSync` (see concern 3.4 above).
241: 
242: ---
243: 
244: ## 6. Architectural Fragility (P2)
245: 
246: ### 6.1 Session Tracker as a God Module
247: 
248: - **Files:** `src/features/session-tracker/` (entire directory, 6+ files exceeding 500 LOC)
249: - **Why fragile:** The session-tracker handles event capture, child session routing, backfill from SDK, hierarchy indexing, persistence (write queues, retry queues, orphan quarantine), and recovery — all tightly coupled. A change to event capture (`event-capture.ts:1062 LOC`) risks breaking persistence (`child-writer.ts:603 LOC`) because they share the same `pendingRegistry`, `sessionIndexWriter`, and `childWriter` references.
250: - **What could break:** Adding a new event type (e.g., `session.message.updated`) requires modifying `event-capture.ts` which is already over capacity. The event handler methods (`handleSessionIdle`, `handleSessionError`, `handleSessionDeleted`) each have 100+ LOC with 5-10 `await` calls and multiple catch blocks.
251: - **How to improve:** Apply the Single Responsibility Principle — extract each event handler into its own class, inject the shared writers via dependency injection, and reduce `event-capture.ts` to an event router that delegates to handler classes.
252: 
253: ### 6.2 Delegation Status Tool Depends on Two Persistence Formats
254: 
255: - **File:** `src/tools/delegation/delegation-status.ts` (590 LOC)
256: - **Why fragile:** The tool reads delegation status from both the new session-tracker format (`hierarchy-manifest.json`) and the legacy persistence format (`delegations.json`). Each format has different JSON shapes, parsed via `as any`. The tool also has a third code path for direct delegation records.
257: - **What could break:** If either persistence format changes shape, the `as any` casts silently produce incorrect delegation status. There is no integration test that validates the end-to-end flow from delegation creation → persistence → status read.
258: - **How to improve:** Create a `DelegationStatusReader` interface with two implementations: `SessionTrackerStatusReader` and `LegacyPersistenceStatusReader`. Add Zod schemas for each format and validate at the boundary.
259: 
260: ### 6.3 Plugin.ts as Monolithic Composition Root
261: 
262: - **File:** `src/plugin.ts` (554 LOC)
263: - **Why fragile:** This file imports 60+ modules and wires them together. Adding a new tool requires modifying this file, which increases merge conflict risk and cognitive load. The `deps` object at line 377 is a single mega-object with 12+ properties.
264: - **What could break:** The order of initialization matters (e.g., `delegationManager.setCompletionDetector` at line 328 must happen after lifecycle manager creation at line 306). Reordering any initialization step can break the runtime.
265: - **How to improve:** Group tool registrations by domain (delegation, session, config, hivemind) into separate `registerXxxTools()` functions. Group hook factories similarly. Reduce the `deps` object to domain-specific sub-objects.
266: 
267: ---
268: 
269: ## 7. Test Coverage Gaps (P2)
270: 
271: ### 7.1 Untested Core Modules
272: 
273: | Module | Source Files | Tests | Risk |
274: |--------|-------------|-------|------|
275: | `src/hooks/guards/governance-block.ts` | 1 file | None | **High** — governance blocking logic is untested |
276: | `src/hooks/lifecycle/core-hooks.ts` | 1 file | None | **High** — core lifecycle hooks untested |
277: | `src/hooks/lifecycle/session-hooks.ts` | 1 file | None | **High** — session event handling untested |
278: | `src/hooks/observers/event-observers.ts` | 1 file | None | **Medium** — observer factories untested |
279: | `src/hooks/observers/session-entry-consumer.ts` | 1 file | None | **Medium** — session entry consumer untested |
280: | `src/hooks/observers/session-main-consumer.ts` | 1 file | None | **Medium** — session main consumer untested |
281: | `src/hooks/observers/delegation-consumer.ts` | 1 file | None | **Medium** — delegation consumer untested |
282: | `src/hooks/observers/session-tracker-consumer.ts` | 1 file | None | **Medium** — session tracker consumer untested |
283: | `src/hooks/transforms/tool-after-workflow.ts` | 1 file | None | **Medium** — workflow transform untested |
284: | `src/hooks/composition/cqrs-boundary.ts` | 1 file | None | **Low** — boundary guard untested |
285: | `src/config/compiler.ts` | 1 file | `tests/lib/config-compiler.test.ts` | **Low** — has tests |
286: 
287: ### 7.2 Total Coverage Gap Analysis
288: 
289: - **Source files:** 228 TypeScript files in `src/`
290: - **Test files:** ~203 test files in `tests/`
291: - **Estimated source files without direct test coverage:** ~80-100 files
292: - **Highest risk untested paths:**
293:   1. All hooks modules (`src/hooks/`) — 0 test files for 10+ source files
294:   2. `src/coordination/spawner/` — only 3 of 7+ files have tests
295:   3. `src/features/governance-engine/` — only 2 test files for 4+ source files
296:   4. `src/task-management/journal/` — only `journal-query.test.ts` and `journal-replay.test.ts` cover 4 source files
297: 
298: ### 7.3 Missing Integration Tests for Session Tracker Race Conditions
299: 
300: - **Context:** The existing CONCERNS.md documents BUG-3 and BUG-5 fixes in the session-tracker (race conditions in child session registration and SDK message fallback).
301: - **File:** `src/features/session-tracker/tool-delegation.ts:276,332,348` — race condition fixes
302: - **File:** `src/features/session-tracker/persistence/session-index-writer.ts:222` — BUG-5 fix
303: - **Risk:** These fixes are verified by unit tests but lack integration tests that exercise the full delegation → event capture → persistence → status read flow with timing-dependent operations.
304: - **Fix:** Create `tests/integration/session-tracker-race-conditions.test.ts` that uses `vi.useFakeTimers()` to simulate concurrent `session.idle` and `recordChildTaskDelegation` events.
305: 
306: ---
307: 
308: ## 8. Dependency Concerns (P2)
309: 
310: ### 8.1 `bun-pty` in dependencies (not optionalDependencies)
311: 
312: - **Package:** `bun-pty@^0.4.8` listed under `dependencies` in `package.json:44`
313: - **Risk:** `bun-pty` is a Bun-specific PTY library. The project targets `node >= 20.0.0` (package.json:94). While the runtime gracefully falls back to headless `node:child_process` (per AGENTS.md Phase 16.2.1), `bun-pty` in `dependencies` means `npm install` on Node will attempt to install it and may fail or produce warnings. The type declarations at `src/features/background-command/pty/bun-pty.d.ts` exist to handle this, but it's a fragile arrangement.
314: - **Fix:** Move `bun-pty` from `dependencies` to `optionalDependencies` in `package.json`. This is already the intent per the AGENTS.md documentation but was not reflected in the actual manifest.
315: 
316: ### 8.2 `bun-types` in dependencies
317: 
318: - **Package:** `bun-types@^1.3.14` listed under `dependencies` in `package.json:45`
319: - **Risk:** `bun-types` provides TypeScript types for Bun-specific APIs. It should be a devDependency (used only at compile time for type-checking), not a runtime dependency. Shipping it in the published npm package increases install size unnecessarily.
320: - **Fix:** Move `bun-types` from `dependencies` to `devDependencies`.
321: 
322: ### 8.3 Zod v4 Upgrade
323: 
324: - **Package:** `zod@^4.4.3` in `package.json:48`
325: - **Risk:** The project uses Zod v4 which is a major version upgrade from v3. While the codebase has been updated, some patterns like `z.prettifyError(parsed.error)` at `src/tools/delegation/delegate-task.ts:35` are Zod v4-specific. If the Zod team introduces breaking changes in v4.x minor releases, multiple schema files would need updates.
326: - **Fix:** Pin to a specific minor version (e.g., `zod@~4.4.3`) instead of using caret range. The `stack-l3-zod` skill documents the full v4 API for reference.
327: 
328: ### 8.4 Peer Dependency Alignment
329: 
330: - **Package:** `@opencode-ai/plugin@^1.15.10` as both peer and dev dependency, `@opencode-ai/sdk@^1.15.10` as a dependency
331: - **Risk:** The peer dependency version must match the host OpenCode version. If a user installs Hivemind with an older OpenCode version that has a different SDK surface, the `as any` casts in `coordinator.ts` (see 2.1) will mask the incompatibility at compile time but fail at runtime.
332: - **Fix:** Add a runtime version check in `plugin.ts` that validates the SDK version matches expectations at initialization time.
333: 
334: ---
335: 
336: ## 9. Priority Summary
337: 
338: | # | Issue | Severity | Effort | Files Affected |
339: |---|-------|----------|--------|----------------|
340: | 1.1 | Duplicate PermissionAction union member | P0 | XS | `src/shared/types.ts` |
341: | 1.2 | Silent error swallowing `.catch(() => {})` | P0 | S | `src/features/session-tracker/capture/event-capture.ts`, `child-writer.ts`, `initialization.ts` |
342: | 1.3 | `ClientLike = any` type erasure | P0 | M | `src/features/session-tracker/initialization.ts` |
343: | 2.1 | 12 `as any` casts (type safety gaps) | P1 | L | `delegation-status.ts`, `coordinator.ts`, `session-api.ts` |
344: | 2.2 | ESLint suppressions | P1 | S | `session-api.ts`, `initialization.ts` |
345: | 2.3 | Module size violations (8 files >500 LOC) | P1 | L | `event-capture.ts`, `execute-slash-command.ts`, `index.ts`, `child-writer.ts`, etc. |
346: | 2.4 | Fragile promise chain in ChildWriter | P1 | M | `src/features/session-tracker/persistence/child-writer.ts` |
347: | 3.1 | Console logging in production code | P1 | S | `execute-slash-command.ts`, `dispatch-command.ts`, `retry-queue.ts`, `session-index-writer.ts` |
348: | 3.2 | Unsanitized session ID in file paths | P1 | S | `session-tracker/index.ts`, `orphan-quarantine.ts`, `delegation-status.ts` |
349: | 3.3 | Synchronous readFileSync in sidecar | P1 | S | `src/sidecar/readonly-state.ts` |
350: | 3.4 | Full process.env spread in governance git commit | P1 | S | `src/features/governance-engine/create-governance-session.ts` |
351: | 4.1 | Repeated JSON.parse without memoization | P2 | S | `delegation-status.ts` |
352: | 4.2 | Synchronous FS in bootstrap-init tool | P2 | M | `bootstrap-init.ts` |
353: | 4.3 | Unbounded timer accumulation | P2 | S | `src/coordination/completion/detector.ts` |
354: | 4.4 | execSync blocking in governance session creation | P2 | S | `src/features/governance-engine/create-governance-session.ts` |
355: | 5.1 | 14 empty catch blocks | P2 | S | `event-capture.ts`, `child-writer.ts`, `session-tracker.ts`, etc. |
356: | 5.2 | Inconsistent error shape handling | P2 | M | `src/coordination/delegation/coordinator.ts` |
357: | 6.1 | Session tracker god module | P2 | XL | `src/features/session-tracker/` |
358: | 6.2 | Dual persistence format dependency | P2 | L | `src/tools/delegation/delegation-status.ts` |
359: | 6.3 | Plugin.ts monolithic composition | P2 | L | `src/plugin.ts` |
360: | 7.1 | Untested hooks modules (0 coverage) | P2 | L | `src/hooks/` (10+ files) |
361: | 7.2 | ~80-100 source files without tests | P2 | XL | Various |
362: | 7.3 | Missing integration tests for race conditions | P2 | M | `src/features/session-tracker/` |
363: | 8.1 | bun-pty in dependencies (not optional) | P2 | XS | `package.json` |
364: | 8.2 | bun-types in dependencies (should be dev) | P2 | XS | `package.json` |
365: | 8.3 | Zod v4 pinned with caret range | P2 | S | `package.json` |
366: | 8.4 | No runtime SDK version validation | P2 | S | `src/plugin.ts` |
367: 
368: **Legend:** XS = <1 hour, S = 1-4 hours, M = 4-8 hours, L = 1-3 days, XL = 3+ days
369: 
370: ---
371: 
372: *Concerns audit: 2026-05-28*

(End of file - total 372 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>

## USER (turn 3)

**source:** real-human

route autonomous gsd to tackle @.planning/codebase/CONCERNS.md but having check point at each phase now at C3. Only auto on each phase with very strict gatekeeping, planning following TDD and spec driven using specialist agents from GSD and commands of GSD too. At each phase must be the checkpoint and ask for my validation at each phase; do not self decide of thier pass or not. Following all steps do not skip anything 
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md"}
<path>/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md</path>
<type>file</type>
<content>
1: # Codebase Concerns
2: 
3: **Analysis Date:** 2026-05-28
4: 
5: This document catalogs every actionable concern discovered during deep scan of the `hivemind-plugin-private` codebase. Issues are organized by severity (P0–P2) with exact file:line references to enable direct navigation. Each concern includes impact assessment and recommended remediation.
6: 
7: ---
8: 
9: ## 1. Critical Issues (P0)
10: 
11: ### 1.1 Duplicate Union Member in PermissionAction Type
12: 
13: - **File:** `src/shared/types.ts:42`
14: - **Code:** `export type PermissionAction = "allow" | "ask" | "ask"`
15: - **Impact:** The `"ask"` value is duplicated in the union, making it appear to have three valid states when there are only two. This is a silent TypeScript defect — no compiler error is raised, but downstream switch/if statements may have dead branches or incorrect narrowing. Any permission evaluation logic that checks `action === "ask"` works by coincidence but the intent is unclear (was a third action like `"deny"` intended?).
16: - **Fix:** Remove the duplicate: `export type PermissionAction = "allow" | "ask"`. Audit all `switch(action)` blocks in `src/tools/delegation/delegate-task.ts`, `src/coordination/spawner/agent-primitive-policy.ts`, and `src/config/compiler.ts` to verify they handle only the expected values.
17: 
18: ### 1.2 Silent Error Swallowing via `.catch(() => {})`
19: 
20: - **Files:**
21:   - `src/features/session-tracker/capture/event-capture.ts:325` — `backfillChildTurnsFromSdk` errors silently discarded
22:   - `src/features/session-tracker/capture/event-capture.ts:373` — `appendAssistantTurn` errors silently discarded
23:   - `src/features/session-tracker/capture/event-capture.ts:443` — `backfillChildTurnsFromSdk` errors silently discarded
24:   - `src/features/session-tracker/capture/event-capture.ts:500` — `backfillChildTurnsFromSdk` errors silently discarded
25:   - `src/features/session-tracker/persistence/child-writer.ts:223` — Write queue errors silently discarded via `next.catch(() => {})`
26:   - `src/features/session-tracker/initialization.ts:151` — Recovery/orphan cleanup errors silently discarded
27: - **Impact:** These are fire-and-forget patterns where failures are completely invisible. In production, if `backfillChildTurnsFromSdk` or `appendAssistantTurn` consistently fail, the session-tracker will silently produce incomplete data with no observability signal. The child-writer queue at line 223 is particularly dangerous because it means failed writes vanish without entering the retry queue.
28: - **Fix:** Replace `.catch(() => {})` with `.catch((err) => { void client.app?.log?.({ body: { service: "session-tracker", level: "warn", message: `[Harness] <operation> failed`, extra: { error: err instanceof Error ? err.message : String(err) } } }) })` — at minimum log the error. For the child-writer queue at line 223, the catch is intentional (the error is already re-thrown at line 221 and captured by the retry queue), but the `catch(() => {})` on the queued promise should still log at debug level.
29: 
30: ### 1.3 `ClientLike = any` Type Erasure in Session Tracker
31: 
32: - **File:** `src/features/session-tracker/initialization.ts:36-37`
33: - **Code:**
34:   ```typescript
35:   // eslint-disable-next-line @typescript-eslint/no-explicit-any
36:   type ClientLike = any
37:   ```
38: - **Impact:** The entire session-tracker initialization module operates on a fully untyped client reference. This means any call to `this.client.app?.log?.(...)`, `this.client.session.*`, or any SDK surface method is unchecked at compile time. A typo in a method name or incorrect argument shape will only fail at runtime.
39: - **Fix:** Define a minimal `ClientLike` interface matching the actual SDK surface used by session-tracker (approximately: `{ app?: { log?: (entry: LogEntry) => void }; session?: { get: (...args: any[]) => Promise<unknown>; messages: (...args: any[]) => Promise<unknown> } }`). Remove the `eslint-disable` and `any` annotation.
40: 
41: ---
42: 
43: ## 2. Technical Debt (P1)
44: 
45: ### 2.1 Type Safety Gaps — 12 `as any` Casts
46: 
47: **File group A: `src/tools/delegation/delegation-status.ts`**
48: 
49: | Line | Code | Reason |
50: |------|------|--------|
51: | 148 | `(childRecord.status as any)` | Status string cast to `any` for terminal kind mapping |
52: | 169 | `JSON.parse(raw) as any` | Manifest JSON parsed without schema validation |
53: | 174 | `child as any` | Manifest child entry untyped |
54: | 250 | `JSON.parse(raw) as any` | Second manifest parse without schema |
55: | 266 | `child as any` | Second manifest child untyped |
56: | 279 | `child as any` | Third manifest child untyped |
57: | 292 | `child as any` | Fourth manifest child untyped |
58: 
59: **File group B: `src/coordination/delegation/coordinator.ts`**
60: 
61: | Line | Code | Reason |
62: |------|------|--------|
63: | 92 | `(msg as any)?.info ?? msg` | SDK message shape not typed |
64: | 212 | `(m as any)?.info?.role ?? (m as any)?.role` | Dual fallback for role extraction |
65: | 216 | `(lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error` | Error shape not typed |
66: | 219 | `(errorField as any).message \|\| JSON.stringify(errorField)` | Error field type unknown |
67: 
68: **File group C: `src/shared/session-api.ts`**
69: 
70: | Line | Code | Reason |
71: |------|------|--------|
72: | 235 | `} as any))` | SDK showToast body shape mismatch |
73: 
74: - **Impact:** The hierarchy-manifest.json parsing in `delegation-status.ts` is the highest risk — a malformed manifest file will produce silently incorrect delegation status results because all field access goes through `any`. The coordinator `as any` casts on SDK message objects mean that if the SDK changes its message shape, the error only surfaces at runtime.
75: - **Fix:** Create a `HierarchyManifest` interface and a `ChildEntry` interface in `src/features/session-tracker/types.ts` and use them for all manifest parsing. For SDK message objects, create a `SdkMessageLike` type. Eliminate all 12 casts within one phase.
76: 
77: ### 2.2 ESLint Suppressions
78: 
79: - `src/shared/session-api.ts:234` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
80: - `src/features/session-tracker/initialization.ts:36` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
81: - **Impact:** Two explicit eslint-disable comments reduce lint enforcement. The tsconfig has `noUnusedLocals` and `noUnusedParameters` set to `true` (strict mode), but `as any` bypasses all type safety that those rules provide.
82: - **Fix:** Resolve the underlying type mismatches (see 2.1 above) and remove both suppressions.
83: 
84: ### 2.3 Module Size Violations (Max 500 LOC Rule)
85: 
86: | File | LOC | Limit | Over By |
87: |------|-----|-------|---------|
88: | `src/features/session-tracker/capture/event-capture.ts` | 1062 | 500 | +562 (112%) |
89: | `src/tools/session/execute-slash-command.ts` | 629 | 500 | +129 |
90: | `src/features/session-tracker/index.ts` | 622 | 500 | +122 |
91: | `src/features/session-tracker/persistence/child-writer.ts` | 603 | 500 | +103 |
92: | `src/tools/delegation/delegation-status.ts` | 590 | 500 | +90 |
93: | `src/plugin.ts` | 554 | 500 | +54 |
94: | `src/features/session-tracker/tool-delegation.ts` | 502 | 500 | +2 |
95: | `src/features/session-tracker/capture/tool-capture.ts` | 502 | 500 | +2 |
96: | `src/coordination/delegation/manager-runtime.ts` | 491 | 500 | — (within) |
97: | `src/tools/config/configure-primitive.ts` | 490 | 500 | — (within) |
98: | `src/coordination/delegation/coordinator.ts` | 481 | 500 | — (within) |
99: | `src/task-management/continuity/index.ts` | 467 | 500 | — (within) |
100: 
101: - **Impact:** `event-capture.ts` at 1062 LOC is the most severe — it handles `session.idle`, `session.error`, `session.deleted`, `session.next.text.ended`, `session.status`, SDK fallback logic, child session routing, backfill, and pending registry management all in one class. This makes it extremely difficult to test in isolation and nearly impossible to refactor safely.
102: - **Fix:** Extract event handlers into dedicated handler classes: `SessionIdleHandler`, `SessionErrorHandler`, `SessionDeletedHandler`. Extract SDK fallback logic into `SdkFallbackResolver`. Extract backfill logic into `BackfillService`. Target: `event-capture.ts` → 4 handler files averaging ~200 LOC each.
103: 
104: ### 2.4 Deprecated Callback Pattern in `ChildWriter.enqueueWrite`
105: 
106: - **File:** `src/features/session-tracker/persistence/child-writer.ts:200-224`
107: - **Code:** The `enqueueWrite` method uses `.then().catch().then()` promise chaining and manually manages a `writeQueues` Map. Line 223: `this.writeQueues.set(queueKey, next.catch(() => {}))` — the queue entry is set to a promise that swallows errors.
108: - **Impact:** The queue chaining pattern is fragile: if the initial `current` promise is `undefined` (Map miss), it defaults to `Promise.resolve()`, but the subsequent `.catch()` on line 223 replaces the entry with a new chain that discards errors. This means if a write fails and is re-enqueued, the original error is lost from the queue tracking.
109: - **Fix:** Replace with a dedicated `SerialWriteQueue` class that exposes `enqueue(fn, retryData)` with proper error propagation and retry queue integration. The `SessionIndexWriter` has a similar pattern at `src/features/session-tracker/persistence/session-index-writer.ts:112-128`.
110: 
111: ---
112: 
113: ## 3. Security Concerns (P1)
114: 
115: ### 3.1 Console Logging in Production Code
116: 
117: - **Files and Lines:**
118:   - `src/tools/session/execute-slash-command.ts:486` — `console.error(\`[Harness] session.command dispatch failed: ${message}\`)`
119:   - `src/tools/session/dispatch-command.ts:112` — `console.error(\`[Harness] Slash command dispatch failed: ${message}\`)`
120:   - `src/tools/session/resolve-command.ts:23` — `console.log(...)` (in JSDoc but actual code)
121:   - `src/features/session-tracker/persistence/retry-queue.ts:326` — `console.error(...)` with session ID and error details
122:   - `src/features/session-tracker/persistence/session-index-writer.ts:120` — `console.error(...)` with session ID
123:   - `src/features/session-tracker/persistence/session-index-writer.ts:225` — `console.warn(...)` with session ID
124: - **Impact:** Production `console.error`/`console.warn` output may include session IDs, file paths, delegation IDs, and error stack traces that could be captured by log aggregation systems or exposed in terminal output. The `dispatch-command.ts:112` case includes the full error message which may contain file paths from `node:fs` errors.
125: - **Fix:** Replace all `console.error`/`console.warn` in non-test code with the structured logger pattern: `void client.app?.log?.({ body: { service: "<module-name>", level: "warn", message: "[Harness] ..." } })`. For files that don't have access to the `client` reference, thread it through dependencies or use the existing `getConfig()` pattern for service-level logging.
126: 
127: ### 3.2 Unsanitized Session ID in File Paths
128: 
129: - **Files:**
130:   - `src/features/session-tracker/index.ts:132` — `resolve(sessionTrackerRoot(this.projectRoot), sessionID, \`${sessionID}.md\`)`
131:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:47` — `join(this.trackerRoot, sessionID)`
132:   - `src/features/session-tracker/persistence/orphan-quarantine.ts:60` — `join(this.quarantineDir, sessionID)`
133:   - `src/tools/delegation/delegation-status.ts:168` — `safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")`
134: - **Impact:** If a `sessionID` value containing `../` or absolute path segments is injected into the system (via a malicious or malformed delegation record), it could read or write files outside the expected directory tree. While session IDs are typically SDK-generated UUIDs, the codebase does not validate this assumption at the file I/O boundary.
135: - **Fix:** Add a `validateSessionId(id: string): boolean` utility that checks for `^[a-zA-Z0-9_-]+$` (no slashes, dots, or special characters) and call it before any file path construction that includes a session ID. Place the utility in `src/shared/helpers.ts`.
136: 
137: ### 3.3 Synchronous `readFileSync` in Sidecar Module
138: 
139: - **File:** `src/sidecar/readonly-state.ts:93`
140: - **Code:** `return readFileSync(absolutePath, "utf8")`
141: - **Impact:** The sidecar module enforces read-only access, but uses blocking synchronous file I/O. If this is called from an async context (e.g., a Next.js route handler), it blocks the event loop. The `isCanonicalStatePath` guard at line 55 is also synchronous and relies on `path.relative()` which is safe from traversal, but the `readFileSync` at line 93 means a large file read blocks the entire thread.
142: - **Fix:** Add an async version `readCanonicalStateAsync` using `fs.promises.readFile` and prefer it in all async call sites. Keep the sync version as fallback for initialization contexts only.
143: 
144: ### 3.4 Full `process.env` Spread in Governance Session Git Commit
145: 
146: - **File:** `src/features/governance-engine/create-governance-session.ts:114-117`
147: - **Code:**
148:   ```typescript
149:   execSync(
150:     `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
151:     { cwd, env: { ...process.env } },
152:   )
153:   ```
154: - **Impact:** The full `process.env` is passed to `execSync` for a git commit. While git itself doesn't read sensitive env vars, the `execSync` call could be intercepted or the environment could be logged. The `--no-verify` flag also bypasses git hooks, which may be intentional but removes an additional safety layer.
155: - **Fix:** Use a minimal env: `env: { ...process.env, GIT_AUTHOR_NAME: "HiveMind", GIT_AUTHOR_EMAIL: "hivemind@local" }` or better yet, extract git operations to a dedicated utility that doesn't inherit the full parent environment.
156: 
157: ---
158: 
159: ## 4. Performance Issues (P2)
160: 
161: ### 4.1 Repeated JSON.parse Without Memoization
162: 
163: - **File:** `src/tools/delegation/delegation-status.ts:169,250`
164: - **Code:** `const manifest = JSON.parse(raw) as any` — called multiple times for the same `rootSessionId` when resolving children from both session-tracker and legacy persistence.
165: - **Impact:** When checking delegation status for a parent with many children, the same `hierarchy-manifest.json` file is read from disk and parsed multiple times. Each parse allocates new objects and triggers GC pressure.
166: - **Fix:** Add a per-invocation LRU cache keyed by `(projectRoot, rootSessionId)` that returns the parsed manifest. Clear after each tool execution. Alternatively, consolidate the two `getSessionTrackerChildren` and `getLegacyChildren` methods into a single method that parses the manifest once.
167: 
168: ### 4.2 Synchronous File I/O in Bootstrap Init/Recover
169: 
170: - **Files:**
171:   - `src/tools/config/bootstrap-init.ts:1` — Uses `readFileSync`, `writeFileSync`, `mkdirSync`, `cpSync`, `rmSync`
172:   - `src/tools/config/bootstrap-recover.ts:1` — Uses `accessSync`, `cpSync`, `mkdirSync`, `renameSync`, `rmSync`
173:   - `src/tools/config/bootstrap-init.ts:113-136` — `mkdirSync` + `writeFileSync` in loops
174: - **Impact:** Bootstrap/init operations use entirely synchronous file system APIs. While these run once per session startup, they block the event loop during a critical initialization window. The `cpSync` at `bootstrap-init.ts:1` and `bootstrap-recover.ts:1` may copy entire directory trees synchronously.
175: - **Fix:** This is acceptable for CLI commands (`init`, `recover`, `doctor`) since they run synchronously by design. However, `bootstrap-init` is also registered as a plugin tool (line 56 of `plugin.ts`: `createBootstrapInitTool`). When invoked as a tool, it should use async APIs. Split the tool-exposed path to use `fs.promises`.
176: 
177: ### 4.3 Unbounded Timer Accumulation in CompletionDetector
178: 
179: - **File:** `src/coordination/completion/detector.ts:35`
180: - **Code:** `private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()`
181: - **Impact:** Each `recordEvent` call (line 76) creates a new `setTimeout` for stability detection. If many delegations are active simultaneously, the `stabilityTimers` map grows without bound. The timer is only cleared in the `cancel` method (line 165) and the timeout handler (line 185). If a delegation's session events stop arriving (e.g., SDK connection drops), the timer for that delegation remains in memory until the 120s timeout fires.
182: - **Fix:** Add a `pruneStaleTimers(maxAgeMs: number)` method that removes timers older than `maxAgeMs` and call it periodically from the monitor loop.
183: 
184: ### 4.4 `execSync` Blocking in Governance Session Creation
185: 
186: - **File:** `src/features/governance-engine/create-governance-session.ts:114`
187: - **Code:** `execSync(\`git add -A && git commit ...\`)`
188: - **Impact:** The governance session creation uses `execSync` for a git commit, which blocks the entire event loop during the git add + commit operation. In large repositories, this could take several seconds, blocking all other operations in the OpenCode runtime.
189: - **Fix:** Replace with `execFile` (async) from `node:child_process` and wrap in a try/catch that returns the error to the caller. Or use `simple-git` library for a non-blocking API.
190: 
191: ---
192: 
193: ## 5. Code Quality Issues (P2)
194: 
195: ### 5.1 Empty Catch Blocks Hiding Real Errors
196: 
197: 14 locations where `catch { }` or `catch { /* comment */ }` discards errors without logging:
198: 
199: | File | Line | Context |
200: |------|------|---------|
201: | `src/features/session-tracker/persistence/child-writer.ts` | 223 | Queue promise chain |
202: | `src/features/session-tracker/capture/event-capture.ts` | 325 | backfillChildTurnsFromSdk |
203: | `src/features/session-tracker/capture/event-capture.ts` | 373 | appendAssistantTurn |
204: | `src/features/session-tracker/capture/event-capture.ts` | 422 | session fetch failed |
205: | `src/features/session-tracker/capture/event-capture.ts` | 443 | backfillChildTurnsFromSdk |
206: | `src/features/session-tracker/capture/event-capture.ts` | 500 | backfillChildTurnsFromSdk |
207: | `src/features/session-tracker/initialization.ts` | 151 | Recovery/orphan cleanup |
208: | `src/tools/session/session-tracker.ts` | 105 | Unreadable child file |
209: | `src/tools/session/session-tracker.ts` | 107 | No hierarchy manifest |
210: | `src/tools/session/session-tracker.ts` | 311 | Skip unreadable |
211: | `src/tools/session/session-hierarchy.ts` | 280 | Fallback failed |
212: | `src/tools/session/session-context.ts` | 225 | Frontmatter optional |
213: | `src/coordination/delegation/state-machine.ts` | 441 | Abort session failure |
214: | `src/config/compiler.ts` | 359 | Rollback errors |
215: 
216: - **Impact:** These empty catches are categorized into two groups: (a) "acceptable" where the fallback is a read-only operation that failing is expected (e.g., `session-tracker.ts:105` — file doesn't exist yet), and (b) "concerning" where a write or critical operation fails silently (e.g., `event-capture.ts:373` — assistant turn append fails, `child-writer.ts:223` — queue error disappears). The concerning group means production data loss is possible without any signal.
217: - **Fix:** For the "acceptable" group, add a comment explaining why the error is intentionally discarded. For the "concerning" group, add `console.warn` or structured logging. Minimum target: zero silent catches on write operations.
218: 
219: ### 5.2 Inconsistent Error Shape Handling
220: 
221: - **File:** `src/coordination/delegation/coordinator.ts:212-219`
222: - **Code:**
223:   ```typescript
224:   const role = (m as any)?.info?.role ?? (m as any)?.role
225:   // ...
226:   const errorField = (lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error
227:   if (errorField) {
228:     const errorMsg = typeof errorField === "object" && errorField !== null
229:       ? ((errorField as any).message || JSON.stringify(errorField))
230:       : String(errorField)
231:   ```
232: - **Impact:** This triple-fallback pattern (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(error)`) indicates the SDK message shape has changed at least once, and the code has been patched with new fallbacks rather than updating the old code. The `JSON.stringify(errorField)` fallback at line 219 means that if the error is a complex object, the stringified version is used as the error message — potentially producing very long, unhelpful error strings.
233: - **Fix:** Create a `SdkMessageShape` type union that covers all known SDK message formats. Use `zod` to validate at the boundary (the project already has `zod` as a dependency). Replace the chain with a single typed extraction.
234: 
235: ### 5.3 Command Delegation Env Propagation (Partially Fixed)
236: 
237: - **File:** `src/coordination/command-delegation/handler.ts:375-381`
238: - **Code:** The `buildMinimalEnv` method now uses an allowlist: `const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]`
239: - **Status:** PARTIALLY FIXED. The allowlist is correct and safe for the `buildMinimalEnv` path. However, the `doctor.ts:244` still passes `{ ...process.env, CI: "true" }` to `spawnSync` — acceptable for a diagnostic tool but not for production delegation paths.
240: - **Remaining risk:** The `create-governance-session.ts:116` still passes `{ ...process.env }` to `execSync` (see concern 3.4 above).
241: 
242: ---
243: 
244: ## 6. Architectural Fragility (P2)
245: 
246: ### 6.1 Session Tracker as a God Module
247: 
248: - **Files:** `src/features/session-tracker/` (entire directory, 6+ files exceeding 500 LOC)
249: - **Why fragile:** The session-tracker handles event capture, child session routing, backfill from SDK, hierarchy indexing, persistence (write queues, retry queues, orphan quarantine), and recovery — all tightly coupled. A change to event capture (`event-capture.ts:1062 LOC`) risks breaking persistence (`child-writer.ts:603 LOC`) because they share the same `pendingRegistry`, `sessionIndexWriter`, and `childWriter` references.
250: - **What could break:** Adding a new event type (e.g., `session.message.updated`) requires modifying `event-capture.ts` which is already over capacity. The event handler methods (`handleSessionIdle`, `handleSessionError`, `handleSessionDeleted`) each have 100+ LOC with 5-10 `await` calls and multiple catch blocks.
251: - **How to improve:** Apply the Single Responsibility Principle — extract each event handler into its own class, inject the shared writers via dependency injection, and reduce `event-capture.ts` to an event router that delegates to handler classes.
252: 
253: ### 6.2 Delegation Status Tool Depends on Two Persistence Formats
254: 
255: - **File:** `src/tools/delegation/delegation-status.ts` (590 LOC)
256: - **Why fragile:** The tool reads delegation status from both the new session-tracker format (`hierarchy-manifest.json`) and the legacy persistence format (`delegations.json`). Each format has different JSON shapes, parsed via `as any`. The tool also has a third code path for direct delegation records.
257: - **What could break:** If either persistence format changes shape, the `as any` casts silently produce incorrect delegation status. There is no integration test that validates the end-to-end flow from delegation creation → persistence → status read.
258: - **How to improve:** Create a `DelegationStatusReader` interface with two implementations: `SessionTrackerStatusReader` and `LegacyPersistenceStatusReader`. Add Zod schemas for each format and validate at the boundary.
259: 
260: ### 6.3 Plugin.ts as Monolithic Composition Root
261: 
262: - **File:** `src/plugin.ts` (554 LOC)
263: - **Why fragile:** This file imports 60+ modules and wires them together. Adding a new tool requires modifying this file, which increases merge conflict risk and cognitive load. The `deps` object at line 377 is a single mega-object with 12+ properties.
264: - **What could break:** The order of initialization matters (e.g., `delegationManager.setCompletionDetector` at line 328 must happen after lifecycle manager creation at line 306). Reordering any initialization step can break the runtime.
265: - **How to improve:** Group tool registrations by domain (delegation, session, config, hivemind) into separate `registerXxxTools()` functions. Group hook factories similarly. Reduce the `deps` object to domain-specific sub-objects.
266: 
267: ---
268: 
269: ## 7. Test Coverage Gaps (P2)
270: 
271: ### 7.1 Untested Core Modules
272: 
273: | Module | Source Files | Tests | Risk |
274: |--------|-------------|-------|------|
275: | `src/hooks/guards/governance-block.ts` | 1 file | None | **High** — governance blocking logic is untested |
276: | `src/hooks/lifecycle/core-hooks.ts` | 1 file | None | **High** — core lifecycle hooks untested |
277: | `src/hooks/lifecycle/session-hooks.ts` | 1 file | None | **High** — session event handling untested |
278: | `src/hooks/observers/event-observers.ts` | 1 file | None | **Medium** — observer factories untested |
279: | `src/hooks/observers/session-entry-consumer.ts` | 1 file | None | **Medium** — session entry consumer untested |
280: | `src/hooks/observers/session-main-consumer.ts` | 1 file | None | **Medium** — session main consumer untested |
281: | `src/hooks/observers/delegation-consumer.ts` | 1 file | None | **Medium** — delegation consumer untested |
282: | `src/hooks/observers/session-tracker-consumer.ts` | 1 file | None | **Medium** — session tracker consumer untested |
283: | `src/hooks/transforms/tool-after-workflow.ts` | 1 file | None | **Medium** — workflow transform untested |
284: | `src/hooks/composition/cqrs-boundary.ts` | 1 file | None | **Low** — boundary guard untested |
285: | `src/config/compiler.ts` | 1 file | `tests/lib/config-compiler.test.ts` | **Low** — has tests |
286: 
287: ### 7.2 Total Coverage Gap Analysis
288: 
289: - **Source files:** 228 TypeScript files in `src/`
290: - **Test files:** ~203 test files in `tests/`
291: - **Estimated source files without direct test coverage:** ~80-100 files
292: - **Highest risk untested paths:**
293:   1. All hooks modules (`src/hooks/`) — 0 test files for 10+ source files
294:   2. `src/coordination/spawner/` — only 3 of 7+ files have tests
295:   3. `src/features/governance-engine/` — only 2 test files for 4+ source files
296:   4. `src/task-management/journal/` — only `journal-query.test.ts` and `journal-replay.test.ts` cover 4 source files
297: 
298: ### 7.3 Missing Integration Tests for Session Tracker Race Conditions
299: 
300: - **Context:** The existing CONCERNS.md documents BUG-3 and BUG-5 fixes in the session-tracker (race conditions in child session registration and SDK message fallback).
301: - **File:** `src/features/session-tracker/tool-delegation.ts:276,332,348` — race condition fixes
302: - **File:** `src/features/session-tracker/persistence/session-index-writer.ts:222` — BUG-5 fix
303: - **Risk:** These fixes are verified by unit tests but lack integration tests that exercise the full delegation → event capture → persistence → status read flow with timing-dependent operations.
304: - **Fix:** Create `tests/integration/session-tracker-race-conditions.test.ts` that uses `vi.useFakeTimers()` to simulate concurrent `session.idle` and `recordChildTaskDelegation` events.
305: 
306: ---
307: 
308: ## 8. Dependency Concerns (P2)
309: 
310: ### 8.1 `bun-pty` in dependencies (not optionalDependencies)
311: 
312: - **Package:** `bun-pty@^0.4.8` listed under `dependencies` in `package.json:44`
313: - **Risk:** `bun-pty` is a Bun-specific PTY library. The project targets `node >= 20.0.0` (package.json:94). While the runtime gracefully falls back to headless `node:child_process` (per AGENTS.md Phase 16.2.1), `bun-pty` in `dependencies` means `npm install` on Node will attempt to install it and may fail or produce warnings. The type declarations at `src/features/background-command/pty/bun-pty.d.ts` exist to handle this, but it's a fragile arrangement.
314: - **Fix:** Move `bun-pty` from `dependencies` to `optionalDependencies` in `package.json`. This is already the intent per the AGENTS.md documentation but was not reflected in the actual manifest.
315: 
316: ### 8.2 `bun-types` in dependencies
317: 
318: - **Package:** `bun-types@^1.3.14` listed under `dependencies` in `package.json:45`
319: - **Risk:** `bun-types` provides TypeScript types for Bun-specific APIs. It should be a devDependency (used only at compile time for type-checking), not a runtime dependency. Shipping it in the published npm package increases install size unnecessarily.
320: - **Fix:** Move `bun-types` from `dependencies` to `devDependencies`.
321: 
322: ### 8.3 Zod v4 Upgrade
323: 
324: - **Package:** `zod@^4.4.3` in `package.json:48`
325: - **Risk:** The project uses Zod v4 which is a major version upgrade from v3. While the codebase has been updated, some patterns like `z.prettifyError(parsed.error)` at `src/tools/delegation/delegate-task.ts:35` are Zod v4-specific. If the Zod team introduces breaking changes in v4.x minor releases, multiple schema files would need updates.
326: - **Fix:** Pin to a specific minor version (e.g., `zod@~4.4.3`) instead of using caret range. The `stack-l3-zod` skill documents the full v4 API for reference.
327: 
328: ### 8.4 Peer Dependency Alignment
329: 
330: - **Package:** `@opencode-ai/plugin@^1.15.10` as both peer and dev dependency, `@opencode-ai/sdk@^1.15.10` as a dependency
331: - **Risk:** The peer dependency version must match the host OpenCode version. If a user installs Hivemind with an older OpenCode version that has a different SDK surface, the `as any` casts in `coordinator.ts` (see 2.1) will mask the incompatibility at compile time but fail at runtime.
332: - **Fix:** Add a runtime version check in `plugin.ts` that validates the SDK version matches expectations at initialization time.
333: 
334: ---
335: 
336: ## 9. Priority Summary
337: 
338: | # | Issue | Severity | Effort | Files Affected |
339: |---|-------|----------|--------|----------------|
340: | 1.1 | Duplicate PermissionAction union member | P0 | XS | `src/shared/types.ts` |
341: | 1.2 | Silent error swallowing `.catch(() => {})` | P0 | S | `src/features/session-tracker/capture/event-capture.ts`, `child-writer.ts`, `initialization.ts` |
342: | 1.3 | `ClientLike = any` type erasure | P0 | M | `src/features/session-tracker/initialization.ts` |
343: | 2.1 | 12 `as any` casts (type safety gaps) | P1 | L | `delegation-status.ts`, `coordinator.ts`, `session-api.ts` |
344: | 2.2 | ESLint suppressions | P1 | S | `session-api.ts`, `initialization.ts` |
345: | 2.3 | Module size violations (8 files >500 LOC) | P1 | L | `event-capture.ts`, `execute-slash-command.ts`, `index.ts`, `child-writer.ts`, etc. |
346: | 2.4 | Fragile promise chain in ChildWriter | P1 | M | `src/features/session-tracker/persistence/child-writer.ts` |
347: | 3.1 | Console logging in production code | P1 | S | `execute-slash-command.ts`, `dispatch-command.ts`, `retry-queue.ts`, `session-index-writer.ts` |
348: | 3.2 | Unsanitized session ID in file paths | P1 | S | `session-tracker/index.ts`, `orphan-quarantine.ts`, `delegation-status.ts` |
349: | 3.3 | Synchronous readFileSync in sidecar | P1 | S | `src/sidecar/readonly-state.ts` |
350: | 3.4 | Full process.env spread in governance git commit | P1 | S | `src/features/governance-engine/create-governance-session.ts` |
351: | 4.1 | Repeated JSON.parse without memoization | P2 | S | `delegation-status.ts` |
352: | 4.2 | Synchronous FS in bootstrap-init tool | P2 | M | `bootstrap-init.ts` |
353: | 4.3 | Unbounded timer accumulation | P2 | S | `src/coordination/completion/detector.ts` |
354: | 4.4 | execSync blocking in governance session creation | P2 | S | `src/features/governance-engine/create-governance-session.ts` |
355: | 5.1 | 14 empty catch blocks | P2 | S | `event-capture.ts`, `child-writer.ts`, `session-tracker.ts`, etc. |
356: | 5.2 | Inconsistent error shape handling | P2 | M | `src/coordination/delegation/coordinator.ts` |
357: | 6.1 | Session tracker god module | P2 | XL | `src/features/session-tracker/` |
358: | 6.2 | Dual persistence format dependency | P2 | L | `src/tools/delegation/delegation-status.ts` |
359: | 6.3 | Plugin.ts monolithic composition | P2 | L | `src/plugin.ts` |
360: | 7.1 | Untested hooks modules (0 coverage) | P2 | L | `src/hooks/` (10+ files) |
361: | 7.2 | ~80-100 source files without tests | P2 | XL | Various |
362: | 7.3 | Missing integration tests for race conditions | P2 | M | `src/features/session-tracker/` |
363: | 8.1 | bun-pty in dependencies (not optional) | P2 | XS | `package.json` |
364: | 8.2 | bun-types in dependencies (should be dev) | P2 | XS | `package.json` |
365: | 8.3 | Zod v4 pinned with caret range | P2 | S | `package.json` |
366: | 8.4 | No runtime SDK version validation | P2 | S | `src/plugin.ts` |
367: 
368: **Legend:** XS = <1 hour, S = 1-4 hours, M = 4-8 hours, L = 1-3 days, XL = 3+ days
369: 
370: ---
371: 
372: *Concerns audit: 2026-05-28*

(End of file - total 372 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-new-milestone"
}
```

**Output:** (pruned)
```
# Skill: gsd-new-milestone
```


### Tool: skill

**Input:**
```json
{
  "name": "quality-gate-orchestration"
}
```

**Output:** (pruned)
```
# Skill: quality-gate-orchestration
```


### Tool: skill

**Input:**
```json
{
  "name": "multi-agent-coordination"
}
```

**Output:** (pruned)
```
# Skill: multi-agent-coordination
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_ZpYfz2EKszoT3hzMdRFo3658"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_U8uvAdBkmojq3MdFHwbs5830"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_0fWOAXphV08VXkcusTJh4491"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_kMx4PDt9j9D6RQkmUdt34892"
}
```


## USER (turn 3)

**source:** real-human



### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_00_VCbgtuD4GTnz3jIBu7LB0945"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Gather phase context through adaptive questioning before planning.",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_191aff4d0ffed6pTHn2113qnjd"
}
```

**Output:** (pruned)
```
task_id: ses_191aff4d0ffed6pTHn2113qnjd
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_02_5zfJcY1LR6OsQ0hiVEVW8497"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_SmGVpBmhffriqO8P5qZs4144"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_MtLvSM2votCEy7lhXHMS0981"
}
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_Clo4d2PVFsb42KGSDzmw9955"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_1HbZrRGgIrMWeYx8ZvZC8018"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_7GA51y6XPW4X8ioDp9AT2637"
}
```


## USER (turn 4)

**source:** real-human



## ASSISTANT (turn 1)

Tools: task
