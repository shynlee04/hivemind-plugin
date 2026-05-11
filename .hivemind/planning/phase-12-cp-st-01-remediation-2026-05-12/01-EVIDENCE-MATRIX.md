# Phase 12: CP-ST-01 Remediation — Evidence Truth Matrix

**Date:** 2026-05-12
**Auditor:** gsd-debug-session-manager (subagent)
**Evidence hierarchy:** L1 (live disk) + L2 (continuity records) + source code analysis
**Method:** SPEC vs Reality cross-reference for all 13 requirements (REQ-ST-01 through REQ-ST-13)

---

## Evidence Legend

| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Requirement satisfied with L1/L2 evidence |
| ⚠️ PARTIAL | Partially implemented, has gaps |
| ❌ FAIL | Not satisfied, requires remediation |
| 🔴 CRITICAL | Blocks core functionality |
| 🟡 HIGH | Degrades data quality |
| 🟢 MEDIUM | Non-blocking quality issue |
| 🔵 LOW | Cosmetic |

---

## REQ-ST-01: Session Directory Manifestation

**CLAIMED (CP-ST-01-02-SUMMARY.md):** "Root sessions → `sessionWriter.createSessionDir()` + `initializeSessionFile()`. Child sessions → skipped (handled by tool-capture)."

**EVIDENCE:**
- ✅ 83 session directories exist under `.hivemind/session-tracker/` (L1 — `ls` confirms)
- ✅ Each directory contains `{sessionID}.md` with YAML frontmatter (L1)
- ✅ Child `.json` files exist under parent directories (L1 — confirmed in multiple subdirs)
- ❌ project-continuity.json lists 83 sessions but `lastUpdated` is `2026-05-11T17:04:29.708Z` — frozen for ~7 hours (L1)
- ❌ `childCount: 0` for ALL entries, even sessions with 8+ child .json files (L1 — WR-01)
- ❌ All 83 sessions have `status: "active"` — none transition to "completed"/"idle" (L1)
- ❌ 13 sessions missing `childCount` field entirely — `undefined` was spread over the field (WR-01)

**GAP:** Project index is stale/static. Session status never transitions. Child count never tracked. The index writer appears to have a frozen serial queue.

**SEVERITY:** 🔴 CRITICAL — Core index data is incorrect/static.

**Source references:**
- `src/features/session-tracker/capture/tool-capture.ts:251-253` — `childCount: undefined` bug
- `src/features/session-tracker/persistence/project-index-writer.ts:166-172` — spread of undefined
- `.hivemind/session-tracker/project-continuity.json` — all 83 entries childCount=0, all status=active

---

## REQ-ST-02: User Message Capture

**CLAIMED:** "User message captured with turn counter"

**EVIDENCE:**
- ✅ Main .md files contain `## USER (turn N)` sections (L1 — confirmed in sampled .md files)
- ✅ Turn numbers are sequential (observed turns 1, 2 in sampled file)
- ✅ Full user text content is captured (L1 — confirmed)
- ⚠️ Turn counters are in-memory only — reset on restart (WR-04) (L5 — source code analysis)
- ⚠️ No mechanism to seed turn counter from existing .md file on restart (WR-04)

**GAP:** Restart resets turn counters → duplicate turn numbers in persisted .md files.

**SEVERITY:** 🟡 HIGH — Data quality degradation across restarts.

**Source references:**
- `src/features/session-tracker/capture/message-capture.ts:65` — turnCounters Map
- `src/features/session-tracker/capture/message-capture.ts:190-194` — nextTurnNumber()

---

## REQ-ST-03: Agent Metadata Transform

**CLAIMED:** "Assistant metadata transformed into structured `main_l0_agent` fields"

**EVIDENCE:**
- ✅ AgentTransform class exists and extracts name, model, thinkingDuration (L4 — unit tests pass)
- ⚠️ `computeThinkingDuration()` returns hardcoded `"present"` instead of actual duration (L5)
- ⚠️ No evidence of `main_l0_agent` blocks in sampled .md files — only skill tool blocks visible (L1)
- ⚠️ Need to verify assistant message capture is actually firing in live sessions

**GAP:** Thinking duration is a placeholder, not actual timing data. Need L1 verification of agent block capture.

**SEVERITY:** 🟢 MEDIUM — Core transform works but thinking duration is fake.

**Source references:**
- `src/features/session-tracker/transform/agent-transform.ts:117-118` — hardcoded "present"
- `src/features/session-tracker/capture/message-capture.ts:163-181` — handleAssistantMessage

---

## REQ-ST-04: Tool Capture — Skill

**CLAIMED:** "Skill name + 1 header captured"

**EVIDENCE:**
- ✅ Sampled .md files contain `### Tool: skill` blocks (L1 — confirmed)
- ✅ Input captures `{ name: "skill-name" }` (L1 — confirmed)
- ✅ Output is pruned to first `#` header line (L1 — confirmed, see `# Skill: hivemind-power-on`)
- ✅ extractFirstHeader() correctly matches `^# .+$` pattern

**GAP:** None identified. Skill capture is working correctly.

**SEVERITY:** ✅ PASS

**Source references:**
- `src/features/session-tracker/capture/tool-capture.ts:143-158` — handleSkill
- `src/features/session-tracker/capture/tool-capture.ts:304-310` — extractFirstHeader

---

## REQ-ST-05: Tool Capture — Read

**CLAIMED:** "Read path captured, no content"

**EVIDENCE:**
- ❌ CR-03: `handleRead()` inspects output for "error"/"not found" substrings and captures full output (which IS file content) when these words appear (L4 — code analysis confirmed)
- ❌ The heuristic error detection is fundamentally wrong — any file containing the word "error" triggers full content capture (CR-03)
- ⚠️ The code uses `let` for `outputStr` and `isError` (IN-02)
- ⚠️ Read tool blocks were not found in sampled .md files (need larger sample or confirmation of hook firing)

**GAP:** CR-03 is a direct violation of REQ-ST-05. Heuristic error detection captures file content when the output coincidentally contains "error" or "not found".

**SEVERITY:** 🔴 CRITICAL — Violation of a hard requirement. Captures file content against explicit spec.

**Source references:**
- `src/features/session-tracker/capture/tool-capture.ts:170-187` — handleRead (CR-03)
- Review finding CR-03 (confirmed unresolved)

---

## REQ-ST-06: Tool Capture — Task (Delegation)

**CLAIMED:** "Task delegation spawns child .json"

**EVIDENCE:**
- ✅ Child .json files ARE created under parent directories (L1 — confirmed, 8 children in ses_1e8826b7)
- ✅ Child files contain parentSessionID, delegatedBy, description (L1)
- ❌ Child .json files have `turns: []` — never populated with actual turn data (L1)
- ❌ Child .json files have `status: "active"` — never transitions to "completed" (L1)
- ❌ Child .json files have `mainAgent.model: "unknown"` — never populated (L1)
- ❌ Child .json files have `children: []` — grandchild support missing (L1)
- ❌ `projectIndexWriter.updateSession()` called with `childCount: undefined` (WR-01)
- ❌ `sessionIndexWriter.addChild()` increments `turnCount++` (WR-06)
- ⚠️ `handleTask` does NOT call `updateChildStatus()` or `appendChildTurn()` — child files are write-once

**GAP:** Child session data is skeletal. No turn capture, no status transitions, no model info, no grandchild support. The record is created but never updated.

**SEVERITY:** 🔴 CRITICAL — Child session capture is fundamentally incomplete. Write-once, never-updated.

**Source references:**
- `src/features/session-tracker/capture/tool-capture.ts:199-273` — handleTask
- `.hivemind/session-tracker/ses_1e8826b7fffe6rpXbScJR18btU/ses_1e85e857affefWZJzwX3WFBi1k.json` — skeletal child record

---

## REQ-ST-07: Child Session Recognition and Transformation

**CLAIMED:** "Child ##USER → main_l0_agent transform"

**EVIDENCE:**
- ❌ Child .json files have `turns: []` — no turns to transform (L1)
- ❌ The `transformChildUserMessage()` method exists but is only called when turns are captured, which never happens (L4)
- ⚠️ `event-capture.ts` correctly checks `parentID` via `getSession()` for root detection (L4)
- ❌ Child session lifecycle events (session.created, session.idle) are handled by event-capture which only knows about main sessions — child status events are completely lost

**GAP:** Architecture flaw: child sessions generate independent lifecycle events but those events are either mistakenly routed to main session .md files (which don't exist for children) or silently dropped. The child capture pipeline is a one-shot creation at task tool time with zero lifecycle updates.

**SEVERITY:** 🔴 CRITICAL — Child session lifecycles are invisible. No transformation ever occurs because no turns are captured.

**Source references:**
- `src/features/session-tracker/capture/event-capture.ts:140-171` — handleSessionCreated (skips children)
- `src/features/session-tracker/capture/tool-capture.ts:199-273` — handleTask (creates but never updates child records)
- `src/features/session-tracker/transform/agent-transform.ts:98-106` — transformChildUserMessage (exists but never called)

---

## REQ-ST-08: Dual Continuity Indices

**CLAIMED:** "Both indices updated on write"

**EVIDENCE:**
- ✅ session-continuity.json exists inside session subdirectories (L1 — confirmed)
- ✅ Children are listed in session-continuity.json hierarchy (L1)
- ❌ All child entries have `status: "active"` — never updated (L1)
- ❌ `toolSummary` is always `{}` — `updateToolSummary()` never called (L1)
- ❌ `turnCount` conflated with child count (WR-06) — ses_1e8826b7 has 2 user turns but turnCount=8 (8 children)
- ❌ project-continuity.json `lastUpdated` is frozen at 2026-05-11T17:04:29 (7+ hours stale)
- ❌ All project entries have `childCount: 0` (WR-01)

**GAP:** Session-local index is structurally correct but never updated after creation. Project-level index is completely frozen/stale.

**SEVERITY:** 🔴 CRITICAL — Core index infrastructure is broken. Primary deliverable of CP-ST-01.

**Source references:**
- `.hivemind/session-tracker/project-continuity.json` — frozen at May 11 17:04, all childCount=0
- `.hivemind/session-tracker/ses_1e8826b7fffe6rpXbScJR18btU/session-continuity.json` — turnCount=8 (wrong), toolSummary={}
- `src/features/session-tracker/persistence/session-index-writer.ts:137` — WR-06: addChild increments turnCount
- `src/features/session-tracker/persistence/project-index-writer.ts:166-172` — WR-01: spread undefined deletes field

---

## REQ-ST-09: Concurrent Session Isolation

**CLAIMED:** "6 concurrent sessions, no corruption"

**EVIDENCE:**
- ⚠️ project-index-writer.ts has a `writeQueue` promise chain (serialized writes) (L4)
- ⚠️ session-writer.ts `updateFrontmatter` has a race condition (WR-02): reads file, then passes to atomicAppendMarkdown which re-reads — double-read creates window for lost updates
- ⚠️ No per-session write queue for .md appends — `atomicAppendMarkdown` reads the full file each time, and if two appends race, one can be lost
- ⚠️ Unit tests pass in isolation (L4) but no live concurrency evidence (no L1/L2 proof)

**GAP:** Race conditions in frontmatter updates (WR-02). MD appends not serialized per-session. No live concurrency proof.

**SEVERITY:** 🟡 HIGH — Data loss risk under concurrent writes.

**Source references:**
- `src/features/session-tracker/persistence/session-writer.ts:175-189` — WR-02: double-read race
- `src/features/session-tracker/persistence/atomic-write.ts:60-77` — atomicAppendMarkdown reads file again

---

## REQ-ST-10: Disconnection Recovery

**CLAIMED:** "Reconsumption from .md/.json files + SDK REST API"

**EVIDENCE:**
- ✅ SessionRecovery class exists and has `initialize()`, `reconsumeSession()`, `rebuildSessionContext()` methods (L4)
- ❌ CR-01: `readSessionFile()` in session-recovery.ts uses raw `resolve()` without `safeSessionPath()` — path traversal vulnerability (L4)
- ⚠️ Recovery depends on project-continuity.json which is frozen/stale (see REQ-ST-08)
- ⚠️ Recovery depends on session .md files which have stale frontmatter (children: [], status: active)
- ⚠️ Recovery depends on child .json files which have no turn data

**GAP:** Recovery infrastructure exists but the data it consumes is stale/incomplete due to failures in other requirements. Path traversal vulnerability (CR-01).

**SEVERITY:** 🟡 HIGH — Recovery works architecturally but operates on broken data. Has a path traversal vulnerability.

**Source references:**
- `src/features/session-tracker/recovery/session-recovery.ts:264-268` — CR-01: unvalidated path
- Review finding CR-01 (confirmed unresolved)

---

## REQ-ST-11: Hook-to-Persistence Architecture Compliance

**CLAIMED:** "Hooks route through SessionTracker, not direct fs writes"

**EVIDENCE:**
- ✅ plugin.ts wires event observer → `sessionTracker.handleSessionEvent()` (L4)
- ✅ plugin.ts wires chat.message → `sessionTracker.handleChatMessage()` (L4)
- ✅ plugin.ts wires tool.execute.after → `sessionTracker.handleToolExecuteAfter()` (L4)
- ✅ All capture handlers delegate to persistence writers
- ✅ Legacy event-tracker wiring preserved (as per deviation noted in CP-ST-01-03-SUMMARY.md)

**GAP:** None identified. CQRS boundary is correctly enforced.

**SEVERITY:** ✅ PASS

**Source references:**
- `src/plugin.ts` — SessionTracker wiring
- `src/features/session-tracker/index.ts:164-253` — handler methods

---

## REQ-ST-12: Schema Consistency

**CLAIMED:** "All fields camelCase"

**EVIDENCE:**
- ✅ All TypeScript interfaces in types.ts use camelCase (L4)
- ✅ schema-normalizer.ts has `toCamelCase()` and normalization functions (L4)
- ⚠️ WR-03: `isValidSessionID` regex is overly restrictive — `/^ses_[a-zA-Z0-9]{6,}$/` assumes format that may not match all OpenCode session IDs (L4)
- ⚠️ IN-03: Non-null assertion `p.text!` in message-capture.ts (minor lint issue)

**GAP:** isValidSessionID regex could reject valid session IDs if OpenCode changes format.

**SEVERITY:** 🟢 MEDIUM — Schema is internally consistent but external compatibility is fragile.

**Source references:**
- `src/features/session-tracker/types.ts:270` — WR-03: restrictive regex
- `src/features/session-tracker/capture/message-capture.ts:207` — IN-03: non-null assertion

---

## REQ-ST-13: Legacy Cleanup

**CLAIMED:** "Old state files removed"

**EVIDENCE:**
- ❌ Legacy event-tracker directory has 26 pairs of .json/.md files (L1 — `ls` confirms)
- ❌ Total ~1.4MB of legacy state persists (L1)
- ❌ `cleanup()` method exists in SessionTracker but is NEVER called (WR-05)
- ❌ `removeLegacyStateFiles()` method exists but is never invoked (WR-05)
- ✅ Old source code at `src/task-management/journal/event-tracker/` preserved (L1)

**GAP:** Legacy cleanup was implemented but never wired to startup. The `void sessionTracker.initialize()` in plugin.ts does NOT chain to `.then(() => cleanup())`.

**SEVERITY:** 🔴 CRITICAL — Legacy state files persist. Defeats the purpose of migration.

**Source references:**
- `.hivemind/event-tracker/` — 26 pairs of .json/.md files (1.4MB)
- `src/features/session-tracker/index.ts:324-334` — cleanup() method (exists, never called)
- `src/plugin.ts` — no call to cleanup()
- Review finding WR-05 (confirmed unresolved)

---

## Summary Matrix

| REQ | Status | Severity | Key Gap |
|-----|--------|----------|---------|
| REQ-ST-01 | ⚠️ PARTIAL | 🔴 CRITICAL | Project index frozen, status never transitions |
| REQ-ST-02 | ⚠️ PARTIAL | 🟡 HIGH | Turn counter reset on restart |
| REQ-ST-03 | ⚠️ PARTIAL | 🟢 MEDIUM | Thinking duration placeholder |
| REQ-ST-04 | ✅ PASS | — | — |
| REQ-ST-05 | ❌ FAIL | 🔴 CRITICAL | CR-03: file content capture via heuristic error check |
| REQ-ST-06 | ❌ FAIL | 🔴 CRITICAL | Child records write-once, never updated |
| REQ-ST-07 | ❌ FAIL | 🔴 CRITICAL | Child lifecycles invisible, no turn capture |
| REQ-ST-08 | ❌ FAIL | 🔴 CRITICAL | Project index frozen, indices never updated |
| REQ-ST-09 | ⚠️ PARTIAL | 🟡 HIGH | Race conditions in frontmatter update |
| REQ-ST-10 | ⚠️ PARTIAL | 🟡 HIGH | Consumes stale data, has path traversal (CR-01) |
| REQ-ST-11 | ✅ PASS | — | — |
| REQ-ST-12 | ✅ PASS | 🟢 MEDIUM | isValidSessionID regex fragility |
| REQ-ST-13 | ❌ FAIL | 🔴 CRITICAL | cleanup() never called, 1.4MB legacy state persists |

**VERDICT:** 7 of 13 requirements have critical or high-severity gaps. 2 pass clean, 4 are partially working. The session tracker creates files but the update pipeline (indices, status transitions, child lifecycle tracking) is fundamentally broken. This is consistent with a module that was unit-tested in isolation (163 passing tests) but never validated against live hook event sequencing.

---

## Additional Systemic Issues (Beyond REQ Coverage)

### SYS-01: Event Capture Ignores Child Sessions
The event-capture.ts module handles `session.created`, `session.idle`, `session.deleted`, `session.error` — but ONLY for main sessions. Child sessions generate their own lifecycle events that are silently dropped because:
- `session.created` for a child: `handleSessionCreated` sees `parentID !== null` and skips (correct)
- But `session.idle` for a child: `handleSessionIdle` calls `updateFrontmatter(childSessionID)` which looks for a .md file that doesn't exist → fails silently
- Child status transitions are completely lost

### SYS-02: Lazy Bootstrap Gap
`ensureSessionReady()` (index.ts:120-149) is called from `handleChatMessage` and `handleToolExecuteAfter` — but NOT from `handleSessionEvent`. If a `session.idle` event fires before any chat or tool activity, the session directory doesn't exist and the event is dropped.

### SYS-03: project-continuity.json Serial Queue Is Frozen
The `writeQueue` promise chain in `project-index-writer.ts` appears to have a stuck promise — `lastUpdated` hasn't changed in 7+ hours despite continuous session activity. This means no new session registrations are hitting the index.

### SYS-04: No Child-to-Parent Status Back-Propagation
When a child session completes or errors, the parent's `session-continuity.json` should update the child's status. This never happens because no handler listens for child session lifecycle events and routes them to the parent's index.
