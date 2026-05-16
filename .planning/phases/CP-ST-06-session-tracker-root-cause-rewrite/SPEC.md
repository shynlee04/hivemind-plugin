# SPEC: CP-ST-06 — Session Tracker Root Cause Rewrite

```yaml
phase: CP-ST-06
title: Session Tracker Root Cause Rewrite
status: spec-complete
depends_on: CP-ST-05
plans: 0
created: 2026-05-16
author: hm-l2-scout (subagent)
ambiguity_score: 0.11
```

---

## 1. Problem Statement

Session-tracker regressions have compounded across CP-ST-04, CP-ST-05, and prior phases. Each phase patched symptoms rather than fixing root causes. The result: **30 failing tests** (12 test files), **6 unfixed root causes** in source, and stale mock tests that test dead logic.

**Evidence baseline:** 2165 passed / 30 failed / 2197 total (`npx vitest run` 2026-05-16).

### Failing test files (12)

| # | Test file | Fail count | Root cause link |
|---|-----------|-----------|-----------------|
| 1 | `tests/features/session-tracker/persistence/hierarchy-index.test.ts` | 2 | RC-2, RC-3 |
| 2 | `tests/features/session-tracker/persistence/session-index-writer.test.ts` | 1 | RC-2 |
| 3 | `tests/features/session-tracker/persistence/child-writer.test.ts` | 2 | RC-5 |
| 4 | `tests/features/session-tracker/injection-builder.test.ts` | — | Stale mock |
| 5 | `tests/features/session-tracker/plugin-event-observers.test.ts` | — | Stale mock |
| 6 | `tests/features/session-tracker/bootstrap-tools-registration.test.ts` | — | Stale mock |
| 7 | `tests/features/session-tracker/execute-slash-command.test.ts` | — | Stale mock |
| 8 | `tests/features/session-tracker/ensure-session-ready-classification.test.ts` | — | RC-3 |
| 9 | `tests/features/session-tracker/index.test.ts` | — | Multiple |
| 10 | `tests/features/session-tracker/hierarchy-index.test.ts` (duplicate path) | — | RC-2 |
| 11 | `tests/features/session-tracker/session-index-writer.test.ts` (duplicate) | — | RC-2 |
| 12 | `tests/lib/session-tracker/*.test.ts` (legacy) | ~15 | Stale, wrong paths |

---

## 2. Root Causes

### RC-1: `HierarchyIndex` cannot resolve root main for reverse-order registration

**File:** `src/features/session-tracker/persistence/hierarchy-index.ts`

**Bug:** `getRootMain()` returns wrong ancestor when children are registered before their parents. The `registerChild()` method only stores forward links (parent→child) without reverse-link verification.

**Evidence:** Test `getRootMain() with direct parent registration > should resolve root correctly when registering reverse order` fails — expected `"ses_root"`, received `"ses_level1"`.

**Acceptance criteria:**
- AC-RC1-01: `getRootMain("ses_level2")` returns `"ses_root"` regardless of registration order.
- AC-RC1-02: `getDepth("ses_l3")` returns `3` (not capped at 2).
- AC-RC1-03: After registering L0→L1→L2→L3 in any order, all depth/ancestry queries are consistent.

### RC-2: `updateChildStatus()` loses nested hierarchy for L2+ children

**File:** `src/features/session-tracker/persistence/session-index-writer.ts`

**Bug:** When updating a deeply-nested child (L2 or deeper), the write targets the wrong directory or the hierarchy tree in `session-continuity.json` is flattened, losing the nested structure.

**Evidence:** Test `updateChildStatus > should update nested child status in root-owned hierarchy` fails — `Cannot read properties of undefined (reading 'status')` at `l1.children["ses_l2child123456"].status`.

**Acceptance criteria:**
- AC-RC2-01: `updateChildStatus()` writes to the root main directory for all depth levels.
- AC-RC2-02: Nested children (L2, L3) are correctly located within the hierarchy tree, not flattened.
- AC-RC2-03: The `session-continuity.json` hierarchy preserves the full tree structure after any status update.

### RC-3: Classification gate fallback `"none"` should default to sub, not main

**File:** `src/features/session-tracker/classification.ts`

**Bug:** When all 3 gates (SDK, hierarchy, pending) fail to classify, the result is `{ parentID: undefined, gate: "none" }`, which downstream code treats as a main session. This is incorrect — when classification is uncertain, the session should default to sub (child) to avoid creating rogue root directories.

**Evidence:** Test `ensure-session-ready-classification.test.ts` fails because the "none" gate path creates directories and files as if the session were a root main.

**Acceptance criteria:**
- AC-RC3-01: When `gate: "none"`, the system treats the session as a sub session (no directory, no `.md` file).
- AC-RC3-02: Only sessions classified by Gate 1 (SDK) with `parentID: undefined` or explicitly by the user as root are treated as main sessions.
- AC-RC3-03: `gate: "none"` sessions write a `.json` file in the FIRST KNOWN root main directory (discovered via disk scan or previous hierarchy state).

### RC-4: `lastMessage` is not captured for all session levels

**File:** `src/features/session-tracker/persistence/child-writer.ts` line 297-299

**Bug:** `lastMessage` is only set when `turn.actor !== "user" && turn.content` — but for L0/L1/L2 sessions, `lastMessage` should contain the FULL content of the last assistant/tool message without any pruning. The current implementation works for child sessions but the main session writer (`session-writer.ts`) may have different truncation logic.

**Evidence:** Users report truncated context when resuming sessions — the `lastMessage` field in `.md` files or `.json` records does not contain the full assistant response.

**Acceptance criteria:**
- AC-RC4-01: `lastMessage` in ALL session records (L0 main `.md`, L1 `.json`, L2 `.json`, L3 `.json`) contains the FULL content of the last non-user message.
- AC-RC4-02: No truncation, no pruning, no summarization of `lastMessage` at any level.
- AC-RC4-03: When a turn is appended, if the turn is from the assistant or a tool result, `lastMessage` is updated to the complete content.

### RC-5: `ChildWriter.enqueueWrite()` silently swallows errors

**File:** `src/features/session-tracker/persistence/child-writer.ts` lines 139, 143

**Bug:** `next.catch(() => {})` at line 143 swallows all write errors silently. Similarly, `current.catch(() => {})` at line 139 swallows previous queue errors. This means failed writes are invisible to callers and to the developer.

**Evidence:** Tests fail with ENOENT errors but the code proceeds as if writes succeeded. `createChildFile()` for non-existent parent path throws ENOENT but the error is caught and discarded.

**Acceptance criteria:**
- AC-RC5-01: Write errors propagate to callers (no silent swallowing).
- AC-RC5-02: Per-child queues track the last error state and surface it on the next write attempt.
- AC-RC5-03: When a write fails, the error is logged with `[Harness]` prefix and the child session ID.

### RC-6: Stale mock tests test dead logic from pre-CP-ST-04

**Files:** `tests/features/session-tracker/*.test.ts`, `tests/lib/session-tracker/*.test.ts`

**Bug:** ~30 tests mock internal APIs that were restructured in CP-ST-04 and CP-ST-05. The mocks import from paths that no longer exist, test methods that were renamed, and assert behaviors that were intentionally changed.

**Evidence:** 12 test files fail with TypeError, ENOENT, or assertion mismatches on restructured internals.

**Acceptance criteria:**
- AC-RC6-01: Delete all tests that mock private/internal methods of `SessionTracker`, `ChildWriter`, `SessionIndexWriter`, `HierarchyIndex`.
- AC-RC6-02: Replace deleted tests with integration tests that exercise the public API surface only.
- AC-RC6-03: All new tests use real file system (temp directories) — no mocks for persistence.
- AC-RC6-04: Test count after rewrite: ≥ 30 tests, all passing, covering the 6 root cause acceptance criteria.

---

## 3. Architecture Constraints

| Constraint | Source | Enforcement |
|-----------|--------|-------------|
| CQRS: hooks read-only, tools write | `.planning/codebase/ARCHITECTURE.md` | Gate review |
| Atomic writes (write-to-tmp → rename) | D-03 | Code pattern + test |
| `.hivemind/session-tracker/` is state root | Q6, ARCHITECTURE.md | Path validation |
| Max 500 LOC per module | CONVENTIONS.md | `wc -l` gate |
| No `any` types | Code style | `npm run typecheck` |
| All functions JSDoc-documented | AGENTS.md | Review gate |
| `verbatimModuleSyntax` | tsconfig.json | `npm run typecheck` |

---

## 4. Scope Boundaries

### In scope
- Fix RC-1 through RC-5 in source code
- Delete/rewrite RC-6 stale tests
- Ensure `npm run typecheck` passes
- Ensure `npm test` passes with 0 failures

### Out of scope
- PTY/background-command features (CP-PTY runway)
- Orphan quarantine logic (working correctly in CP-ST-05)
- `.opencode/` primitive changes
- Plugin composition (`src/plugin.ts`)

---

## 5. Verification Commands

```bash
npm run typecheck                                          # Must pass: 0 errors
npx vitest run tests/features/session-tracker/             # Must pass: 0 failures
npm test                                                   # Must pass: 0 failures (all 2197+ tests)
wc -l src/features/session-tracker/persistence/child-writer.ts        # ≤ 500 LOC
wc -l src/features/session-tracker/persistence/session-index-writer.ts # ≤ 500 LOC
wc -l src/features/session-tracker/persistence/hierarchy-index.ts     # ≤ 500 LOC
wc -l src/features/session-tracker/classification.ts                  # ≤ 500 LOC
```

---

## 6. Key Files

| File | Role | Root cause |
|------|------|-----------|
| `src/features/session-tracker/persistence/hierarchy-index.ts` | Parent-child tree index | RC-1 |
| `src/features/session-tracker/persistence/session-index-writer.ts` | Per-session continuity file | RC-2 |
| `src/features/session-tracker/classification.ts` | 3-gate session classifier | RC-3 |
| `src/features/session-tracker/persistence/child-writer.ts` | Child `.json` file manager | RC-4, RC-5 |
| `src/features/session-tracker/persistence/session-writer.ts` | Main session `.md` writer | RC-4 |
| `src/features/session-tracker/index.ts` | SessionTracker orchestrator | Integration |
| `tests/features/session-tracker/**/*.test.ts` | Test suite | RC-6 |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Test failures | 0 (down from 30) |
| Root causes fixed | 6/6 |
| Stale tests deleted | ≥ 25 |
| New integration tests added | ≥ 30 |
| `npm run typecheck` | PASS |
| LOC per module | ≤ 500 |
| Regression risk | 0 — no behavior changes outside session-tracker |
