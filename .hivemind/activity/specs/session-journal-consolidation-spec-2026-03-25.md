# Spec: Session Journal Consolidation

**ID:** SPEC-2026-03-25-001
**Created:** 2026-03-25
**Status:** Draft
**Phase:** Spec Definition

---

## 1. Problem Statement

The current session journal implementation has the following issues:

1. **Session pollution** — 76+ folders with raw session IDs (non-semantic naming)
2. **Multiple files per session** — `events.md`, `session.json`, `diagnostics.log` (3 files when 1 would suffice)
3. **Broken counters** — `userMessageCount`, `agentOutputCount`, `delegationCount` always 0
4. **Missing event types** — 8 of 10 event types never written (`user_message`, `tool_invocation`, `delegation_created`, etc.)
5. **No user message capture** — Only assistant output is captured
6. **No sub-session linking** — `parentSessionId` always null, `childSessionIds` always empty
7. **No semantic naming** — Sessions named `ses_<opaqueHex>` instead of meaningful names
8. **CQRS violations** — Hooks directly call writers (fixed in P0/P1)

---

## 2. Requirements

### R1: Consolidated Single-File Session Format
**Priority:** P0 (Critical)
**Acceptance Criteria:**
- [ ] Each session produces ONE file: `{semantic-name}.json`
- [ ] File contains all session data: metadata, turns, events, diagnostics
- [ ] No more `events.md`, `session.json`, `diagnostics.log` triplets
- [ ] File path: `.hivemind/sessions/{semantic-name}.json`

**Evidence:** `ls .hivemind/sessions/*.json | wc -l` equals number of sessions

### R2: Semantic Session Naming
**Priority:** P0 (Critical)
**Acceptance Criteria:**
- [ ] Session files named: `ses_<ISO-date>_<purpose>_<agent>.json`
- [ ] Example: `ses_2026-03-25T143000_planning_hiveminder.json`
- [ ] No opaque hex identifiers in file names
- [ ] Session ID inside file matches file name

**Evidence:** `grep -r "^ses_" .hivemind/sessions/*.json | head -5` shows semantic IDs

### R3: User Message Capture
**Priority:** P0 (Critical)
**Acceptance Criteria:**
- [ ] `chat.message` hook captures user messages
- [ ] `userMessageCount` incremented correctly
- [ ] User message text stored in turn structure
- [ ] Works for both initial messages and follow-up messages

**Evidence:** `userMessageCount > 0` in at least one test session

### R4: Turn-Based Structure
**Priority:** P1 (High)
**Acceptance Criteria:**
- [ ] Sessions organized by turns, not flat event lists
- [ ] Each turn has: userMessage, assistantContent, toolCalls, delegations
- [ ] turnCount matches actual number of turns
- [ ] Turn timestamps are sequential

**Evidence:** Turn structure validated by unit tests

### R5: Sub-Session Linking
**Priority:** P1 (High)
**Acceptance Criteria:**
- [ ] When delegation occurs, sub-session gets `parentSessionId`
- [ ] Parent session gets `childSessionIds` appended
- [ ] Delegation packets tracked in turn structure
- [ ] Cross-session navigation possible

**Evidence:** `parentSessionId !== null` in at least one delegation session

### R6: Tool Invocation Tracking
**Priority:** P1 (High)
**Acceptance Criteria:**
- [ ] `tool.execute.after` hook captures tool calls
- [ ] `toolCallCount` incremented correctly
- [ ] Tool name, args, timestamp stored per call
- [ ] Tool selection filtering available (isHivemindManagedTool)

**Evidence:** `toolCallCount > 0` in at least one test session

### R7: Counter Accuracy
**Priority:** P0 (Critical)
**Acceptance Criteria:**
- [ ] All counters computed from actual data, not hardcoded 0
- [ ] `userMessageCount` = number of user messages
- [ ] `agentOutputCount` = number of assistant outputs
- [ ] `toolCallCount` = number of tool calls
- [ ] `delegationCount` = number of delegations
- [ ] Counters incremented on each addition, not recomputed

**Evidence:** Unit tests verify counter increment behavior

### R8: Clean Legacy Directories
**Priority:** P2 (Medium)
**Acceptance Criteria:**
- [ ] `.hivemind/session-inspection/` cleared or migrated
- [ ] `.hivemind/error-log/` cleared or migrated
- [ ] No orphaned files from old format

**Evidence:** `find .hivemind/session-inspection .hivemind/error-log -type f | wc -l` returns 0

---

## 3. Architecture Constraints

### C1: CQRS Compliance
- Hooks are READ-ONLY (intercept, classify, read)
- Writers are called ONLY through internal facade (`sessionWriters`)
- Tool (`hivemind_journal`) wraps facade for agent sessions

### C2: Backward Compatibility
- New consolidated writer coexists with old writers initially
- Migration path for existing session data available
- No data loss during transition

### C3: Atomic Writes
- File writes use temp file + rename pattern
- No partial writes on crash
- Concurrent access handled (read-modify-write)

### C4: SDK Compliance
- Tool uses `tool.schema` (Zod) for args
- Tool uses `ToolContext` for session info
- Hooks use `PluginInput` for client access

---

## 4. Test Strategy

### T1: Unit Tests
- Consolidated writer unit tests (RED → GREEN → REFACTOR)
- Counter increment tests
- Semantic naming tests
- File format validation tests

### T2: Integration Tests
- Hook → Writer → File end-to-end tests
- User message capture tests
- Tool invocation tests
- Delegation tracking tests

### T3: Regression Tests
- Existing `event-handler.test.ts` must pass
- TypeScript compiles (`npx tsc --noEmit`)
- Build succeeds (`npm run build`)

---

## 5. Phase Gates

### Gate G0: Spec Complete
- [ ] Spec document written
- [ ] Requirements traceable to acceptance criteria
- [ ] Test strategy defined
- [ ] Phase gates defined

### Gate G1: Plan Complete
- [ ] Phase breakdown documented
- [ ] Dependencies mapped
- [ ] Rollback steps defined
- [ ] Registry initialized

### Gate G2: Consolidated Writer (P2-A)
- [ ] Writer creates single JSON file
- [ ] Semantic naming works
- [ ] Turn structure correct
- [ ] Counters accurate
- [ ] Unit tests pass

### Gate G3: Hook Migration (P2-B)
- [ ] Hooks use consolidated writer
- [ ] No more 3-file triplets created
- [ ] Integration tests pass

### Gate G4: User Message Capture (P2-C)
- [ ] `chat.message` hook implemented
- [ ] User messages captured
- [ ] `userMessageCount > 0`

### Gate G5: Tool Invocation (P2-D)
- [ ] `tool.execute.after` hook implemented
- [ ] Tool calls captured
- [ ] `toolCallCount > 0`

### Gate G6: Sub-Session Linking (P2-E)
- [ ] Delegation tracking works
- [ ] Parent/child linking works
- [ ] `parentSessionId` populated

### Gate G7: Final Verification
- [ ] All acceptance criteria met
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Registry complete

---

## 6. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| `use-hivemind-delegation` | Skill | Loaded |
| `hivemind-gatekeeping-delegation` | Skill | Loaded |
| `@opencode-ai/plugin` | SDK | Available |
| `@opencode-ai/sdk` | SDK | Available |
| Session format assessment | Evidence | Completed |
| Internal writer facade | Code | Completed (P1-A) |

---

## 7. Rollback Plan

### RB1: Phase Fails
- Stop at failing phase
- Document blocker in registry
- Revert to last known good state
- Escalate to user with evidence

### RB2: Data Loss
- Backup `.hivemind/sessions/` before migration
- Old format files preserved until new format verified
- Migration script can revert to old format

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Sessions with user messages | ≥1 |
| Sessions with tool calls | ≥1 |
| Sessions with sub-session links | ≥1 |
| Counter accuracy | 100% |
| TypeScript errors | 0 |
| Test pass rate | 100% |
| Build success | Yes |

---

**Next:** Create Phase Plan with TDD gates and delegation registry.