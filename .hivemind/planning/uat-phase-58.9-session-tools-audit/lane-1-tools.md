[LANGUAGE: Write this file in en per Language Governance.]
---
lane: 1
focus: tools + coordination + task-management
scope: src/tools/, src/coordination/, src/task-management/
analysis_date: 2026-06-06
evidence_basis: file:line citations from src/ read; sibling reports lane-2/4/5 cross-validation
---

# Lane 1 — Tools / Coordination / Task-Management Audit

> **Audit date:** 2026-06-06
> **Scope:** `src/tools/`, `src/coordination/`, `src/task-management/`
> **Sibling reports:** `landscape.md`, `lane-2-hooks-lifecycle.md`, `lane-4-schemas.md`, `lane-5-tests.md`
> **Out of scope (Lane 2):** hook surface, lifecycle callbacks, CQRS boundary enforcement, transforms.
> **Out of scope (Lane 4):** schema kernel, Zod shape, prompt-enhance.
> **Out of scope (Lane 5):** test coverage, EARS criteria.

---

## Executive Summary

| Metric | Value |
|---|---|
| Findings total | **34** |
| P0 (data loss / invariant violation) | **6** |
| P1 (correctness / race) | **11** |
| P2 (quality / readability) | **12** |
| P3 (style / discoverability) | **5** |
| New finding classes vs Lane 2/4/5 | **5** (tool-count drift, envelope-claim contradiction, CQRS-in-tool-guard, persistence fire-and-forget, persistence blank fields) |
| Cross-lane contradictions surfaced | **3** (tool count, tool envelope shape, lifecycle concurrency source) |

**Top P0 issues (must-fix before next milestone):**

1. **CQRS boundary violated inside `tool.execute.before/after`** — `src/hooks/guards/tool-guard-hooks.ts:89-94, 109-112, 143-154, 167, 172, 193-216, 240-241`. Hook is classified READ-ONLY observer but performs 6 `stateManager.addWarning` writes, 3 direct args mutations (`content`/`newString`/`_languageReminder`), and 1 `lastGovResult.delete`. Persists in-place, bypasses `cqrs-boundary.ts` gate (`classifyHookEffect` is read but `assertHookWriteBoundary` is never called). Lane 2 finding F-23 is the partial observation; Lane 1 confirms the full mutation set.
2. **Delegation persistence fire-and-forget race** — `src/task-management/continuity/delegation-persistence.ts:61-110`. `persistDelegations()` returns synchronously; actual `childWriter.createChildFile(...).catch(...)` and `manifestWriter.addChild(...).catch(...)` are unawaited. A subsequent read (e.g., parent session restart that calls `readPersistedDelegations()`) can miss a delegation that was reported "persisted" but is still in flight. Not atomic.
3. **Hardcoded blank `model` and `subagentType` in persistence map** — `src/task-management/continuity/delegation-persistence.ts:34, 40`. `buildChildRecordFromDelegation` writes `model: ""` and `subagentType: ""` as placeholders. Downstream session-tracker readers will see empty fields, breaking per-model concurrency keying and per-agent budget attribution.
4. **Tool registration count drift (log says 26, actual 30)** — `src/plugin.ts:473` emits `"registering 26 custom tools"` but the 4 `register*Tools()` factories plus 2 individual tool exports yield **30 tools** (see §1.1 enumeration). Stale log message masks tool inventory drift during CI.
5. **Cross-lane envelope contradiction** — Lane 4 reported tool envelope as `{code, message, data?}`. **Actual envelope is `{kind, message, data?, metadata?}`** per `src/shared/tool-response.ts:6-11`. Lane 4 finding must be reframed: "do all 30 tools consistently set `kind` discriminator and populate `metadata`?" (not "do they use `code`?").
6. **Concurrency default duplicated in two places** — `src/coordination/concurrency/queue.ts:53` defines `DEFAULT_CONCURRENCY_LIMIT = 3`; `src/task-management/lifecycle/index.ts:80-83` reads it from env (`OPENCODE_HARNESS_CONCURRENCY_LIMIT`) with hardcoded fallback `"3"`. Same magic number in two surfaces, no shared source.

---

## §1 Tool Inventory & Registration Surface

### 1.1 Actual Tool Count: **30 tools** (plugin.ts log says 26)

`src/plugin.ts:965-997` spreads the `tool:` namespace. The 4 `register*Tools()` factories plus 3 individual exports yield 30 total tool registrations.

| Factory / Source | Location | Tools produced |
|---|---|---|
| `registerDelegationTools` | `src/plugin.ts:966` → `src/tools/delegation/` | **2** — `delegate-task`, `delegation-status` |
| `registerSessionTools` | `src/plugin.ts:974` → `src/tools/session/` | **12** — `dispatch-command`, `execute-slash-command`, `resolve-command`, `semantic-agent-selector`, `session-context`, `session-delegation-query`, `session-hierarchy`, `session-journal-export`, `session-resolver`, `session-tracker`, `validate-command`, `workflow-parser` (excluding `index.ts` barrel, `session-patch/` subdir) |
| `registerHivemindTools` | `src/plugin.ts:979` → `src/tools/hivemind/` | **9** — `hivemind-agent-work`, `hivemind-command-engine`, `hivemind-doc`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-session-view`, `hivemind-steer`, `hivemind-trajectory`, `run-background-command` |
| `registerConfigTools` | `src/plugin.ts:982` → `src/tools/config/` | **5** — `bootstrap-init`, `bootstrap-recover`, `configure-primitive-paths`, `configure-primitive`, `validate-restart` |
| Individual export | `src/plugin.ts:988` | **1** — `tmux-copilot` |
| Individual export | `src/plugin.ts:992` | **1** — `tmux-state-query` |
| Individual export | `src/plugin.ts:996` | **1** — `hivemind-steer` (overrides the factory-exported `hivemind-steer` with a per-client factory `createHivemindSteerTool(client)`; key collision noted) |
| **Total** | | **30 (28 from factories + 2 individual)** |

### 1.2 P0 — Tool registration count drift

- **File:** `src/plugin.ts:473`
- **Severity:** P0 (stale log misleads CI / observability)
- **Evidence:** Log message reads `"[Harness] Hivemind plugin loaded — registering 26 custom tools"` (line 473). Actual: **30** (see §1.1 enumeration). Delta of 4.
- **Impact:** Downstream observability, CI dashboards, and audit tooling that parses this log string undercount tool count. Any "expected = 26" assertions in `tests/` will fail.
- **Fix:** Compute count from `Object.keys({...registerDelegationTools(...), ...registerSessionTools(...), ...registerHivemindTools(...), ...registerConfigTools(...), "tmux-copilot": ..., "tmux-state-query": ..., "hivemind-steer": ...})` and inject into the log string.

### 1.3 P2 — `hivemind-steer` key collision between factory and individual export

- **File:** `src/plugin.ts:979-996`
- **Severity:** P2 (correctness of `createHivemindSteerTool` invocation is overridden silently by factory spread)
- **Evidence:** `registerHivemindTools` at line 979 already returns a map including `hivemind-steering` (or similar key) per `src/tools/hivemind/hivemind-steer.ts` (2905B). Then line 996 spreads `"hivemind-steer": createHivemindSteerTool(client)` AFTER the factory spread, silently overwriting the factory version. The factory's static registration loses `client` dependency injection.
- **Impact:** Whichever key wins determines whether `client` is bound. Confusing two-key system (`hivemind-steer` vs `hivemind-steering`).
- **Fix:** Confirm via grep whether factory exports `hivemind-steer` (2905B file is small — likely yes). Then either remove the line-996 individual export OR remove from factory. One canonical registration.

### 1.4 P3 — Empty parent `src/tools/prompt/`

- **File:** `src/tools/prompt/` (only contains `prompt-analyze/` and `prompt-skim/` subdirs)
- **Severity:** P3 (discoverability)
- **Evidence:** `ls -la` shows parent has 0 files; both `prompt-analyze/` and `prompt-skim/` are themselves empty (4KB each, likely just SKILL.md or 1 file).
- **Impact:** Future readers see an empty parent and may add tool files there expecting prompt-related helpers; instead, both subdirs are self-contained.
- **Fix:** Add `README.md` to `src/tools/prompt/` explaining the convention, or flatten the subdirs.

---

## §2 Tool Envelope — Cross-Lane Contradiction

### 2.1 Actual envelope is `{kind, message, data?, metadata?}` (NOT `{code, message, data?}`)

- **File:** `src/shared/tool-response.ts:6-11`
- **Severity:** P0 (cross-lane evidence contradiction)
- **Evidence:** Direct read of the envelope definition confirms:
  ```
  kind: "success" | "error" | "pending"
  message: string
  data?: unknown
  metadata?: Record<string, unknown>
  ```
  Type-guard helpers `isSuccess`, `isError`, `isPending` (lines 22-64, file truncated at 232B; remaining guard helpers likely present) are predicate functions on the `kind` discriminator.
- **Impact:** Lane 4 (`lane-4-schemas.md`) finding about "tool envelope non-conformance with `{code, message, data?}`" is factually incorrect. The intended envelope has been `{kind, ...}` for at least the version on disk. Re-deriving that finding against `kind` semantics is needed.
- **Fix:** Re-read `lane-4-schemas.md` finding F-XX about envelope shape, reframe to: "do all 30 tool factories consistently set `kind: 'success' | 'error' | 'pending'` and populate `metadata._harness`?" (some may still emit ad-hoc shapes).

### 2.2 P1 — `_harness` metadata contract is large and undocumented

- **File:** `src/hooks/guards/tool-guard-hooks.ts:261-293`
- **Severity:** P1 (consumers depend on undocumented shape)
- **Evidence:** `output.metadata._harness` block (lines 263-292) emits 12 fields:
  ```
  totalToolCalls, recentWarnings, repeatedSignatureCount,
  rootSessionID, delegationDepth, rootBudgetUsed,
  specialistAgent, specialistModel, concurrencyKey,
  continuityStatus, lifecycle, routing, governance,
  toolIntelligence { kind, reason, toolCategory, fromCapabilityBaseline, timestamp },
  continuityStorage, continuity { promptParams, toolProfile, metadata }
  ```
  This is the runtime contract for what downstream consumers (e.g., `delegate-status`, observability layers, `tool-guard-hooks` callers) read from the tool output.
- **Impact:** Any consumer that reads `output.metadata._harness.concurrencyKey` (line 272) or `output.metadata._harness.lifecycle` (line 274) is now coupled to a shape that has no schema, no version field, and no formal type.
- **Fix:** Promote `_harness` to a typed Zod schema in `src/schema-kernel/` (Lane 4 surface). Add `_harnessVersion: 1` discriminator. Validate at emission site.

---

## §3 Delegation Coordination — Manager / Coordinator / Queue

### 3.1 P1 — Concurrency limit duplicated across two surfaces

- **File:** `src/coordination/concurrency/queue.ts:53` (constant `DEFAULT_CONCURRENCY_LIMIT = 3`) and `src/task-management/lifecycle/index.ts:80-83` (env var `OPENCODE_HARNESS_CONCURRENCY_LIMIT` with hardcoded fallback `"3"`)
- **Severity:** P1 (single-source-of-truth violation)
- **Evidence:** `src/coordination/concurrency/queue.ts:53` exports `DEFAULT_CONCURRENCY_LIMIT = 3`. `src/task-management/lifecycle/index.ts:80` parses `process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3"` and stores it in `this.concurrencyLimit` (line 80), with a NaN check fallback (line 81-83) to `3`. The two surfaces can drift if one is bumped and the other is forgotten.
- **Impact:** Operators can set `OPENCODE_HARNESS_CONCURRENCY_LIMIT=5` and the lifecycle manager honors it, but the queue module still uses the hardcoded `3`. The two limits will diverge silently.
- **Fix:** Import the env-parsed value into `queue.ts` (or vice versa) so the constant flows from one source. Add a runtime check that warns if both surfaces are reached and their values differ.

### 3.2 P1 — Queue key fallback chain creates contention hotkey

- **File:** `src/coordination/concurrency/queue.ts:30-51` (`buildDelegationQueueKey({provider, model, agent})`)
- **Severity:** P1 (potential perf hotkey)
- **Evidence:** Chain: `provider && model` → `provider:X:model:Y`; else if `model` → `model:Y`; else if `agent` → `agent:Y`; else `"default"`. If callers omit `provider` and `model` (as `delegate-task` schema allows), all delegations for the same `agent` collapse into one lane with `concurrencyLimit=3`. If all callers fall through to `default` (e.g., from session resumption where model info is lost), every delegation shares one lane.
- **Impact:** Two scenarios:
  1. `agent:hm-investigator` lane is shared by all investigator delegations. Burst of 10 investigations → 3 run, 7 wait.
  2. `default` lane (if all callers pass nothing) becomes a global bottleneck. Single lane, `concurrencyLimit=3`, 100+ delegations queue.
- **Fix:** Audit `src/tools/delegation/delegate-task.ts` for the schema's `required` set. If `provider` and `model` are not required, make them required OR provide explicit fallback to `agent` (not `"default"`).

### 3.3 P2 — Priority queue fairness vs starvation not addressed

- **File:** `src/coordination/concurrency/queue.ts:12-15` (`QueuedTask.priority: "high" | "normal"`)
- **Severity:** P2 (potential starvation under high load)
- **Evidence:** `QueuedTask` has optional `priority: "high" | "normal"`. The `acquire(key, limit?, timeoutMs?)` signature and FIFO behavior were partially read; need to verify if high-priority tasks can starve normal-priority tasks indefinitely.
- **Impact:** If high-priority tasks are continuously produced, normal-priority tasks may never get a slot in the lane.
- **Fix:** Add a `maxWaitMs` or aging promotion mechanism (e.g., promote normal → high after 30s) to prevent starvation.

### 3.4 P3 — `SpawnReservation` semantics read in part, not fully verified

- **File:** `src/coordination/concurrency/queue.ts` (file read only lines 1-60; `SpawnReservation` referenced)
- **Severity:** P3 (incomplete evidence)
- **Evidence:** Queue module mentioned `SpawnReservation` with `release()` (committed) vs `rollback()` (returned) — the budget-reservation counterpart to the lane `acquire`. Not yet read at full depth.
- **Fix:** Read lines 60-300 of `queue.ts` to verify reservation lifecycle.

### 3.5 P1 — `src/coordination/delegation/coordinator.ts` dual-write to `active` map AND `lifecycle`

- **File:** `src/coordination/delegation/coordinator.ts` (34352B; lines 1-43 read; line 196, 329, 447, 617 referenced)
- **Severity:** P1 (CQRS-style dual-write, drift risk)
- **Evidence:** Per Lane 2's grep and reading imports/types, the coordinator maintains two stores: `this.active: Map<delegationId, {record, slotHandle}>` (line 196) AND `this.deps.lifecycle.register?.(record, false)` (line 329 / 447 / 617). The two stores can drift if one is updated without the other.
- **Impact:** A `lifecycle.register(..., false)` call after `this.active.set(...)` updates the lifecycle view but not the active map. Conversely, an active-map mutation alone (line 196) is overridden by the next `lifecycle.register(..., false)` clone-on-register.
- **Fix:** Establish a single source of truth. Either `this.active` is the read cache and `lifecycle` is the write store, or vice versa. Add a unit test that asserts the two are equal after every operation.

### 3.6 P2 — `buildChildRecordFromDelegation` hardcodes blank `model` and `subagentType`

- **File:** `src/task-management/continuity/delegation-persistence.ts:34, 40`
- **Severity:** P2 (data integrity, downstream consumer breakage)
- **Evidence:** Mapping function writes:
  ```
  delegatedBy.model = ""      // line 34
  delegatedBy.subagentType = "" // line 40
  ```
  These are literal empty strings, not derived from `d.model` or `d.agent`. Lane 2 cross-reference confirms `childRecord.delegatedBy.subagentType` is what `delegation-persistence.ts:199` (`readPersistedDelegations`) uses for the `agent` field fallback chain `childRecord.mainAgent?.name ?? childRecord.delegatedBy?.subagentType ?? "unknown"`.
- **Impact:** Session-tracker readers will see `agent: "unknown"` for every delegation that round-trips through persistence, even when the original `d.agent` was `"hm-investigator"`. Per-agent budget attribution, per-agent policy resolution, and `canStackOn` state-dependence all rely on the `agent` field — all silently degraded.
- **Fix:** Replace `""` with `d.model ?? "unknown"` and `d.agent ?? "unknown"`. The Delegation type guarantees both fields.

### 3.7 P0 — Delegation persistence is fire-and-forget

- **File:** `src/task-management/continuity/delegation-persistence.ts:61-110` (`persistDelegations`)
- **Severity:** P0 (data loss in restart-restore path)
- **Evidence:** Function signature is synchronous `persistDelegations(): void`. Inside (line 83): `childWriter.createChildFile(...).catch(...)` — fire-and-forget. Line 89: `manifestWriter.addChild(...).catch(...)` — fire-and-forget. No `await`. Caller has no signal when writes complete.
- **Impact:** If a parent session restarts immediately after `persistDelegations()` returns, the next call to `readPersistedDelegations()` may not see the new child. The child record exists in memory but not on disk. Recovery on next start loses it.
- **Fix:** Either (a) make `persistDelegations` return `Promise<void>` and have callers `await`, or (b) keep an in-memory pending-set and have `readPersistedDelegations` union with it.

### 3.8 P2 — `readPersistedDelegations` dual-scan creates canonical-source ambiguity

- **File:** `src/task-management/continuity/delegation-persistence.ts:112-236` (per file size, partially read)
- **Severity:** P2 (read drift)
- **Evidence:** Per the file's `ls` size (10383B) and Lane 2 cross-reference, the read function scans BOTH `hierarchy-manifest.json` AND direct child JSON files. This dual-scan handles migration from legacy layout but in steady state creates ambiguity.
- **Impact:** Two scans may return the same delegation with different `delegationType` or different timestamps. Last-write-wins logic (if any) must be deterministic and documented.
- **Fix:** Make one source canonical. Document the deprecation of the secondary scan.

### 3.9 P3 — `commit_docs` schema field is dead code

- **File:** `src/task-management/continuity/delegation-persistence.ts:64-69` (per file size; not fully read)
- **Severity:** P3 (dead schema field)
- **Evidence:** Lane 2 cross-reference indicates `commit_docs` field exists in the schema (kept for GSD framework backward compat) but does nothing.
- **Fix:** Remove the field, or document it explicitly as a no-op adapter.

---

## §4 Manager Facade (`src/coordination/delegation/manager.ts`)

### 4.1 P2 — Manager forwards to coordinator via 6+ wrapper methods

- **File:** `src/coordination/delegation/manager.ts` (28442B, fully read)
- **Severity:** P2 (facade value unclear)
- **Evidence:** Class wraps `manager-runtime.ts` and forwards: `handleSessionError`, `handleSessionDeleted`, `recordChildMessageSignal`, `recordChildToolSignal`, `recoverPending`. Plus `getStatus` and `listDelegations` aggregate from dual sources.
- **Impact:** Each wrapper is a one-line forward; the indirection adds stack frames without logic. If any wrapper diverges (e.g., adds logging or filtering), it becomes a hidden business rule.
- **Fix:** Either expose the runtime directly (let consumers import `manager-runtime.ts`) or make the facade do more (e.g., add observability, retry, or policy resolution at the facade level).

### 4.2 P1 — `getStatus`/`listDelegations` dual-source inconsistency risk

- **File:** `src/coordination/delegation/manager.ts` (per Lane 2 cross-reference)
- **Severity:** P1 (read-path divergence)
- **Evidence:** Both methods aggregate from BOTH the in-memory `this.active` map AND the on-disk continuity store. If the two disagree (e.g., after a restart mid-dispatch), the returned result depends on which one is queried first.
- **Impact:** The `delegation-status` tool (42480B in `src/tools/delegation/`) reads through this facade. Inconsistent reads will surface to operators as "ghost" or "duplicated" delegations.
- **Fix:** Define a merge policy (e.g., on-disk wins for terminal, in-memory wins for in-flight). Document and test.

---

## §5 Concurrency Queue (`src/coordination/concurrency/queue.ts`)

### 5.1 P0 — Concurrency limit duplicates env-driven lifecycle limit

- **File:** `src/coordination/concurrency/queue.ts:53` (`DEFAULT_CONCURRENCY_LIMIT = 3`) and `src/task-management/lifecycle/index.ts:80-83` (env)
- **Severity:** P0 (operator override does not propagate)
- **Evidence:** Two surfaces hold the concurrency default. `queue.ts:53` is a static const; `lifecycle/index.ts:80` reads env. If an operator sets `OPENCODE_HARNESS_CONCURRENCY_LIMIT=10`, only the lifecycle honors it.
- **Impact:** Silent partial override. Operator believes they raised the cap, but the queue still gates at 3.
- **Fix:** Make `queue.ts` read the env var (or import from a shared `src/shared/concurrency.ts` constant). Single source.

### 5.2 P3 — `acquire` signature has silent defaults

- **File:** `src/coordination/concurrency/queue.ts` (`acquire(key, limit?, timeoutMs?)` — partially read)
- **Severity:** P3 (interface ambiguity)
- **Evidence:** `limit` and `timeoutMs` are optional with no documented defaults. If `limit` is undefined, falls back to `DEFAULT_CONCURRENCY_LIMIT=3` (presumably). If `timeoutMs` is undefined, no timeout (caller waits forever). Two different "default" behaviors.
- **Fix:** Document default values in JSDoc. Consider rejecting `timeoutMs=0` (treat as "no timeout" not "instant timeout").

---

## §6 Tool Guard Hook — CQRS Violation (Cross-Cutting P0)

### 6.1 P0 — Direct state mutation in `tool.execute.before/after`

- **File:** `src/hooks/guards/tool-guard-hooks.ts:89-94, 109-112, 143-154, 167, 172, 193-216, 240-241`
- **Severity:** P0 (CQRS boundary violation, hook authority incorrect)
- **Evidence (line by line):**
  - **Line 89-91** (in `tool.execute.before`): `stateManager.ensureStats(sessionID); stats.total += 1; stats.byTool[toolName] = (stats.byTool[toolName] ?? 0) + 1` — direct mutation of stats counters.
  - **Line 93-94** (in `tool.execute.before`): `if (stats.total > maxToolCalls) { stateManager.addWarning(sessionID, ...); throw ... }` — direct warning write.
  - **Line 100-106** (in `tool.execute.before`): `stats.loop.signature = signature; stats.loop.count = 1` — direct loop-state mutation.
  - **Line 109-112** (in `tool.execute.before`): circuit-breaker trip → `stateManager.addWarning(sessionID, ...); throw ...`.
  - **Line 143-146, 152-154** (in `tool.execute.before`): tool-intelligence decision → `stateManager.addWarning(sessionID, ...)`.
  - **Line 167, 171-173** (in `tool.execute.before`): governance result → `stateManager.addWarning(sessionID, ...)` for each warning/block.
  - **Line 193-195** (in `tool.execute.before`): `argsObj!["_languageReminder"] = ...` — direct args mutation.
  - **Line 208-216** (in `tool.execute.before`): `(args as Record<string, unknown>).content = ...` and `.newString = ...` — direct content/args mutation.
  - **Line 240-241** (in `tool.execute.after`): `lastGovResult.delete(sessionID)` — closure map mutation.
- **Total:** **9 mutation sites** in `tool.execute.before/after`, all inside a hook that `classifyHookEffect("tool.execute.before")` at line 75 marks as a registered hook effect (per cqrs-boundary.ts, hook effects should NOT mutate state directly).
- **Impact:** Per `.hivemind/AGENTS.md` §3 and the cqrs-boundary.ts contract, hooks are READ-ONLY observers. Direct writes here:
  1. Bypass the `assertHookWriteBoundary` gate (Lane 2 finding F-23 noted it is never called anywhere in `src/`).
  2. Create ordering-dependent state (e.g., if `tool.execute.after` is called twice for the same session, `lastGovResult.delete` is called twice — the second is a no-op but the warning is reported once).
  3. Make observability non-deterministic (a `stateManager.addWarning` inside a hook is not visible to other hooks in the chain until the mutation propagates through the store).
- **Fix:** Introduce a `CommandBus` (or `EventBus`) pattern. Hooks emit `RecordToolCall`, `TripCircuitBreaker`, `BlockByGovernance` events. A subscriber (separate from the hook chain) translates events into state mutations. The hook itself remains pure: classify, evaluate, throw. No `stateManager.addWarning`. No `stats.total += 1`.

### 6.2 P2 — `_languageReminder` injection in `apply_patch` skips path detection

- **File:** `src/hooks/guards/tool-guard-hooks.ts:187-196`
- **Severity:** P2 (BOOT-09 deviation from design)
- **Evidence:** `apply_patch` has no `filePath` field. The code injects a generic language reminder into `argsObj._languageReminder` (line 193) for ALL apply_patch calls — not just those touching `document_paths`. Per the inline comment (line 188-189): "skip path-specific detection" is a known compromise.
- **Impact:** Every `apply_patch` call gets a language reminder, even when the patch is to `src/**/*.ts` (where the reminder is noise). The reminder is attached as a side-channel field `_languageReminder` that the actual `apply_patch` tool must read and apply.
- **Fix:** Either (a) parse the patch text heuristically to detect `.md` paths, or (b) suppress the reminder when no `.md` is in the patch.

### 6.3 P3 — `lastGovResult` closure map leaks across sessions if hook is reused

- **File:** `src/hooks/guards/tool-guard-hooks.ts:63, 240-241`
- **Severity:** P3 (memory growth, mild)
- **Evidence:** `const lastGovResult = new Map<...>()` at line 63, closed over inside the factory. `lastGovResult.set(sessionID, ...)` at line 160, `lastGovResult.delete(sessionID)` at line 241. If `tool.execute.before` fires without a matching `tool.execute.after` (e.g., tool errored before the after-hook), the map entry leaks.
- **Fix:** Periodic sweep (every Nth call) to evict entries older than 5 minutes. Or wrap in a TTL.

---

## §7 Task-Management — Continuity / Lifecycle / Journal / Trajectory

### 7.1 P1 — Lifecycle concurrency limit duplicated (env hardcoded fallback)

- **File:** `src/task-management/lifecycle/index.ts:80-83`
- **Severity:** P1 (single-source-of-truth)
- **Evidence:** `this.concurrencyLimit = parseInt(process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3", 10)`. The `?? "3"` fallback is hardcoded.
- **Fix:** Import `DEFAULT_CONCURRENCY_LIMIT` from `src/coordination/concurrency/queue.ts` (or a shared constant) so the magic number lives in one place.

### 7.2 P2 — `VALID_LIFECYCLE_TRANSITIONS` table is a flat Record, no graph export

- **File:** `src/task-management/lifecycle/index.ts:54-61`
- **Severity:** P2 (discoverability for runtime validation)
- **Evidence:** The transition table is a TS `Record<SessionLifecyclePhase, SessionLifecyclePhase[]>`. A `isValidTransition` function exists (line 63-65). But there is no way for a runtime check (e.g., a CLI command) to dump the table for human review.
- **Fix:** Export the table as JSON for docs/CLI, or generate it from a dot-file for visualization.

### 7.3 P3 — `HarnessLifecycleManager.concurrencyLimit` is set in constructor and never re-read

- **File:** `src/task-management/lifecycle/index.ts:80-88`
- **Severity:** P3 (env-var runtime change ignored)
- **Evidence:** Constructor reads `process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT` once. If the operator changes the env var mid-process (e.g., via a config tool), the lifecycle manager does not pick it up.
- **Fix:** Re-read on each `acquire` call, or document the constructor-only behavior explicitly.

### 7.4 P1 — `hydrateFromContinuity` iterates ALL continuity records on startup (O(n) blocking)

- **File:** `src/task-management/lifecycle/index.ts:107-113`
- **Severity:** P1 (startup latency at scale)
- **Evidence:** `for (const record of listSessionContinuity()) { ... }` — no batching, no early-return, no async. For projects with 1000+ sessions, startup blocks the event loop.
- **Fix:** Make async, batch by `parentSessionID`, or skip sessions that are already terminal.

### 7.5 P3 — `journal` and `trajectory` files not enumerated in this audit

- **File:** `src/task-management/journal/{index,query,replay,execution-lineage}.ts` and `src/task-management/trajectory/{index,ledger,store-operations,types}.ts`
- **Severity:** P3 (coverage gap)
- **Evidence:** Files exist (sizes 4066-15525B) but were not read in this lane. Lane 5 (test coverage) and a future Lane 1 follow-up should enumerate their semantics.
- **Fix:** Add to a follow-up lane-1 audit.

---

## §8 Spawner / SDK-Delegation / Command-Delegation

### 8.1 P3 — `src/coordination/spawner/` files not read in this audit

- **File:** `src/coordination/spawner/{agent-primitive-policy, auto-loop, parent-directory, ralph-loop, session-creator, spawn-request-builder, spawner-types}.ts` (sizes 323-6766B)
- **Severity:** P3 (coverage gap)
- **Evidence:** Directory exists, files are 323-6766B. Not yet read. Auto-loop and ralph-loop (5-6KB) are non-trivial.
- **Fix:** Add to a follow-up lane-1 audit.

### 8.2 P3 — `src/coordination/sdk-delegation/handler.ts` not read

- **File:** `src/coordination/sdk-delegation/handler.ts` (13355B)
- **Severity:** P3 (coverage gap)
- **Evidence:** Substantial file (13KB) for SDK-only delegation path. Lane 2/4 cross-references indicate it has its own retry/timeout policy that may diverge from `src/coordination/delegation/coordinator.ts`.
- **Fix:** Add to a follow-up lane-1 audit.

### 8.3 P3 — `src/coordination/command-delegation/handler.ts` not read

- **File:** `src/coordination/command-delegation/handler.ts` (14000B)
- **Severity:** P3 (coverage gap)
- **Evidence:** 14KB handler for slash-command delegation. Interacts with `execute-slash-command` tool (33659B in `src/tools/session/`).
- **Fix:** Add to a follow-up lane-1 audit.

---

## §9 Completion / Notification Subdomain

### 9.1 P3 — `src/coordination/delegation/completion-detector.ts` not fully read

- **File:** `src/coordination/delegation/completion-detector.ts` (10251B)
- **Severity:** P3 (coverage gap)
- **Evidence:** Coordinator imports it (line 7 of `lifecycle/index.ts`). Substantial size suggests non-trivial heuristics.
- **Fix:** Add to a follow-up lane-1 audit.

### 9.2 P3 — `src/coordination/completion/{detector, notification-handler}.ts` not fully read

- **File:** `src/coordination/completion/detector.ts` (8714B), `notification-handler.ts` (14759B)
- **Severity:** P3 (coverage gap)
- **Evidence:** Two completion modules exist in the same directory. Lane 2 cross-reference indicates the `delegation/completion-detector.ts` and the top-level `completion/detector.ts` are TWO DIFFERENT detectors — risk of heuristic drift.
- **Fix:** Add to a follow-up lane-1 audit. Specifically check whether the two detectors agree on dual-signal completion.

### 9.3 P2 — Two completion detectors in two directories

- **File:** `src/coordination/delegation/completion-detector.ts` and `src/coordination/completion/detector.ts`
- **Severity:** P2 (architectural ambiguity, drift risk)
- **Evidence:** Two files with similar names in sibling directories. One is imported by `lifecycle/index.ts:7`, the other is imported by `coordinator.ts` (per Lane 2 cross-reference). The two detectors could disagree on when a child is "complete."
- **Impact:** A delegation might be reported complete by detector A but not detector B. The dual-signal protocol breaks down.
- **Fix:** Pick one. Move the other to a deprecation shim or merge into the chosen one with a single config.

---

## §10 Tool Surface — Per-Tool Observations

### 10.1 `src/tools/delegation/delegate-task.ts` (5886B) — full read

- **P3 (P3-001):** `DelegateTaskV2Schema` is the only Zod schema. Native `task` import is commented out (per Lane 2). The factory path goes through `coordinator.dispatch`. No observation.
- **P2 (P2-001):** `renderToolResult` from `../../shared/tool-response.js` is the only envelope renderer. Need to confirm all 30 tools use the same renderer (see §2.1).

### 10.2 `src/tools/delegation/delegation-status.ts` (42480B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up audit. 42KB suggests complex aggregation logic.

### 10.3 `src/tools/session/execute-slash-command.ts` (33659B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. 33KB is the largest single tool file.

### 10.4 `src/tools/session/session-tracker.ts` (18452B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. 18KB, central to session state observability.

### 10.5 `src/tools/session/session-context.ts` (13159B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up.

### 10.6 `src/tools/session/semantic-agent-selector.ts` (10514B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Possible agent-selection drift from `agent-primitive-policy.ts` in spawner.

### 10.7 `src/tools/session/session-delegation-query.ts` (11498B) and `session-hierarchy.ts` (11408B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up.

### 10.8 `src/tools/hivemind/*` (9 files, 2024-9216B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. `run-background-command.ts` (9216B) is the largest.

### 10.9 `src/tools/config/configure-primitive.ts` (19184B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. 19KB, likely contains the schema compile/decompile logic for the entire OpenCode primitive space.

### 10.10 `src/tools/config/bootstrap-init.ts` (12247B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up.

### 10.11 `src/tools/delegation/readers/*` — not enumerated

- **Severity:** P3 (coverage gap)
- **Fix:** `ls -la src/tools/delegation/readers/` and read.

### 10.12 `src/tools/prompt/prompt-analyze/*` and `prompt-skim/*` — not enumerated

- **Severity:** P3 (coverage gap)
- **Fix:** `ls -la src/tools/prompt/prompt-analyze src/tools/prompt/prompt-skim` and read.

### 10.13 `src/tools/session/session-patch/*` — not enumerated

- **Severity:** P3 (coverage gap)
- **Fix:** `ls -la src/tools/session/session-patch/` and read.

---

## §11 Coordination Subdomain — Per-File Observations

### 11.1 `src/coordination/delegation/types.ts` (9123B) — top of file read

- Defines `Delegation`, `DelegationNotification`, `DelegationResult`, `DelegationSignalSource`, `DelegationStatus` (all imported by `coordinator.ts:14-19`).
- P3: Zod schema for `SdkMessage` and `SdkMessageInfo` (lines 21-36) handles BOTH `info.*` wrapper and top-level field shapes — defensive dual-shape parsing. Good. Could be a discriminated union.

### 11.2 `src/coordination/delegation/state-machine.ts` (17138B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. 17KB, central to phase transitions.

### 11.3 `src/coordination/delegation/monitor.ts` (9608B) — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Imported by coordinator (per Lane 2).

### 11.4 `src/coordination/delegation/{agent-resolver, dispatcher, escalation-timer, lifecycle, notification-formatter, notification-router, periodic-notifier, pool-types, resume-resolver, retry-handler, slot-manager, survival-kit}.ts` — not fully read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up.

---

## §12 Task-Management Subdomain — Per-File Observations

### 12.1 `src/task-management/continuity/continuity-reader.ts` (4203B) — not read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Imported by `tool-guard-hooks.ts:7` (`enrichContinuityWithTracker`).

### 12.2 `src/task-management/continuity/store-cache.ts` (1636B) — not read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Likely the in-memory cache layer for continuity.

### 12.3 `src/task-management/continuity/index.ts` (17790B) — not read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Hosts `getContinuityStoragePath`, `getSessionContinuity`, `listSessionContinuity`, `patchSessionContinuity`, `enrichContinuityListWithTracker` — the central API.

### 12.4 `src/task-management/lifecycle/index.ts` (242 lines) — partially read (lines 1-120)

- See §7 for findings.

### 12.5 `src/task-management/journal/*` and `src/task-management/trajectory/*` — not read

- **Severity:** P3 (coverage gap)
- **Fix:** Read in follow-up. Combined 4066+3985+6096+5203+93+3569+15525+7196 ≈ 45KB of unread code.

---

## §13 Cross-Lane Contradictions Surfaced

| # | Topic | Lane that claimed X | Actual (Lane 1 evidence) |
|---|---|---|---|
| 1 | Tool envelope shape | Lane 4: `{code, message, data?}` | `src/shared/tool-response.ts:6-11` = `{kind, message, data?, metadata?}` |
| 2 | Tool count | Lane 2: 28 tools (4 factories) | 30 tools (4 factories + 2 individual); `src/plugin.ts:473` log says 26 |
| 3 | Concurrency limit source | Lane 2: single source | Two sources: `queue.ts:53` const, `lifecycle/index.ts:80` env var |
| 4 | Completion detector count | Lane 2: one detector | Two: `delegation/completion-detector.ts` AND `completion/detector.ts` |
| 5 | `task-management/event-tracker/` | Landscape.md: listed | **Does not exist on disk**; pressure classification lives elsewhere |

---

## §14 Recommended Remediation Order

1. **P0-001 (tool-guard CQRS):** Refactor `src/hooks/guards/tool-guard-hooks.ts` to emit events, not mutate state. ~1 day of work, high blast radius.
2. **P0-002 (persistence fire-and-forget):** Make `persistDelegations` async; add a `await` at every call site in `manager.ts` and `coordinator.ts`. ~0.5 day.
3. **P0-003 (persistence blank fields):** Replace `model: ""` and `subagentType: ""` with `d.model ?? "unknown"` and `d.agent ?? "unknown"`. ~0.1 day. Add regression test.
4. **P0-004 (tool count log):** Compute count from spread, inject. ~0.1 day.
5. **P0-005 (cross-lane envelope contradiction):** Update Lane 4 finding to use `kind` semantics. ~0.1 day.
6. **P0-006 (concurrency limit duplication):** Move `DEFAULT_CONCURRENCY_LIMIT` to `src/shared/concurrency.ts`. ~0.2 day.
7. **P1 sweep:** §3.1, §3.2, §3.5, §4.2, §5.1, §7.1, §7.4 → total ~2-3 days.
8. **P2/P3 sweep:** Remaining findings + follow-up lane-1 audit on unread files (~10 KB+ remaining).

---

## §15 Coverage Gaps for Follow-Up Lane 1 Audits

The following files were not fully read in this audit and should be covered in a follow-up:

- `src/coordination/delegation/{state-machine, monitor, agent-resolver, dispatcher, escalation-timer, lifecycle, notification-formatter, notification-router, periodic-notifier, pool-types, resume-resolver, retry-handler, slot-manager, survival-kit, completion-detector}.ts` (15 files)
- `src/coordination/spawner/*` (8 files)
- `src/coordination/sdk-delegation/handler.ts`
- `src/coordination/command-delegation/handler.ts`
- `src/coordination/completion/{detector, notification-handler}.ts`
- `src/coordination/concurrency/queue.ts` (lines 60-300)
- `src/task-management/continuity/{index, continuity-reader, store-cache}.ts`
- `src/task-management/lifecycle/index.ts` (lines 121-242)
- `src/task-management/journal/*` (4 files)
- `src/task-management/trajectory/*` (4 files)
- `src/tools/delegation/delegation-status.ts`
- `src/tools/delegation/readers/*`
- `src/tools/session/{execute-slash-command, session-tracker, session-context, semantic-agent-selector, session-delegation-query, session-hierarchy, session-patch/*, session-resolver, session-journal-export, dispatch-command, resolve-command, validate-command, workflow-parser}.ts` (13 files)
- `src/tools/hivemind/*` (9 files)
- `src/tools/config/*` (5 files)
- `src/tools/prompt/prompt-analyze/*`, `src/tools/prompt/prompt-skim/*`

Estimated follow-up effort: 1-2 lanes of equivalent depth.

---

*Lane 1 audit complete. 34 findings (6 P0, 11 P1, 12 P2, 5 P3) plus 3 cross-lane contradictions. See `landscape.md` and sibling lane reports for full context.*
