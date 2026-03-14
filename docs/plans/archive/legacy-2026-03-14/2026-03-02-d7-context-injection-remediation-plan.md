# D7 Context Injection Remediation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate dual-channel context injection (session-lifecycle.ts + messages-transform.ts) into a single canonical channel (messages-transform.ts), eliminating token waste from duplicated content.

**Architecture:** Strip duplicated signal injections from `session-lifecycle.ts` (system.transform hook), consolidate all governance/bootstrap/evidence signals into `messages-transform.ts` (messages.transform hook). Update 4 test files to assert signals in messages-transform output instead of system prompt output.

**Tech Stack:** TypeScript, Node.js test runner, Zod schemas

**Branch:** `v-2.9-harness-dev` (3 commits ahead of origin, clean working tree)

**Prior Commit:** `bd569a5 feat(D7): add governance signals to messages-transform canonical channel`

---

## Acceptance Criteria (from validated plan lines 285-291)

| # | Criterion | Current Status |
|---|-----------|----------------|
| AC-1 | Single context delivery channel | 🔴 NOT MET — session-lifecycle.ts still has 10+ signal injection calls |
| AC-2 | Token footprint < 1200 tokens/turn | 🔴 NOT MET — no instrumentation exists |
| AC-3 | Zero P0 duplication | 🔴 NOT MET — 7 duplication points identified, zero removed |
| AC-4 | `npm test` passes (0 new failures) | 🟡 PARTIAL — 212 pass, 2 pre-existing fail (`be_skeptical` in entry-chain + evidence-gate) |
| AC-5 | `npx tsc --noEmit` passes | ✅ MET |
| AC-6 | soft-governance/compaction/detection functional | ✅ MET |

---

## Root Blocker

**12+ test assertions check content exists in system prompt** (output of `session-lifecycle.ts`). D7 requires moving that content to `messages-transform.ts`. If you strip session-lifecycle.ts → tests fail. If you don't strip → AC-1 and AC-3 remain unmet.

**Solution:** Update tests FIRST (test-first), THEN strip session-lifecycle.ts.

---

## 7 Duplication Points Between Hooks

| # | Content | session-lifecycle.ts (system prompt) | messages-transform.ts (messages) |
|---|---------|--------------------------------------|----------------------------------|
| 1 | Session boundary warnings | `buildGovernanceSignals()` via session-governance.ts | Lines 651-664 `shouldCreateNewSession()` |
| 2 | Pending failure ack | `buildGovernanceSignals()` → session-governance.ts:282 | Lines 570-573 |
| 3 | Hierarchy missing | `buildGovernanceSignals()` → session-governance.ts:70 | Line 566 |
| 4 | First-turn context | `compileFirstTurnContext()` line 179 | `buildTransformedPrompt()` Phase 1 lines 335-408 |
| 5 | First-turn confirmation | `generateFirstTurnConfirmationBlock()` line 182 | Lines 357-361 |
| 6 | Entity checklist | `appendChecklistFailureReminder()` line 66-71 | Lines 576-590 |
| 7 | Task block | `buildTaskBlock()` lines 203-210 — references DELETED skills | N/A (only in session-lifecycle) |

---

## Test Assertions That Must Migrate

### File 1: `tests/session-lifecycle-boundary.test.ts` (87 lines)

| Line | Current Assertion (system prompt) | Signal |
|------|-----------------------------------|--------|
| 71 | `text.includes("Natural boundary")` | Session boundary warning |
| 72 | `text.includes("Run /hivemind-compact")` | Compact instruction |

**Migration:** These signals come from `buildGovernanceSignals()` → `session-governance.ts`. After D7 they should be checked in messages-transform checklist output instead. Either rewrite test to call messages-transform hook, or keep session boundary in session-lifecycle (it's NOT duplicated — only in session-lifecycle).

**Expert Choice:** Session boundary warnings are already in messages-transform via `shouldCreateNewSession()` at lines 651-664. Remove from session-lifecycle, test via messages-transform.

### File 2: `tests/governance-stress.test.ts` (190 lines)

| Line | Current Assertion (system prompt) | Signal |
|------|-----------------------------------|--------|
| 66 | `prompt.includes("<hivemind-bootstrap>")` | Bootstrap block |
| 67 | `prompt.includes("<hivemind-evidence>") && prompt.includes("<hivemind-team>")` | Evidence + team blocks |
| 131 | `strictPromptText.includes("[FRAMEWORK CONFLICT]") && ...includes("Use GSD") && ...includes("Use Spec-kit")` | Framework conflict routing |
| 134 | `strictPromptText.includes("Pinned GSD goal:")` | GSD goal pin |

**Migration:** Bootstrap/evidence/team are first-turn-only blocks. Move to messages-transform Phase 1 (first-turn context). Framework conflict + GSD goal are governance signals — move to messages-transform Phase 7c.

### File 3: `tests/cycle-intelligence.test.ts` (433 lines)

| Line | Current Assertion (system prompt) | Signal |
|------|-----------------------------------|--------|
| 321 | `!normalPrompt.includes("SUBAGENT REPORTED FAILURE")` | No failure warning (normal) |
| 335 | `failurePrompt.includes("SUBAGENT REPORTED FAILURE")` | Failure warning present |
| 339 | `failurePrompt.includes("export_cycle") \|\| failurePrompt.includes("hivemind_cycle")` | Cycle tool mention |
| 352 | `!clearedPrompt.includes("SUBAGENT REPORTED FAILURE")` | No failure warning (cleared) |

**Migration:** `pending_failure_ack` is already in messages-transform at lines 570-573. Remove from session-lifecycle, test via messages-transform.

### File 4: `tests/integration.test.ts` (1300+ lines)

| Line | Current Assertion (system prompt) | Signal |
|------|-----------------------------------|--------|
| 448 | `output.system.some(s => s.includes("AUTO-ARCHIVE FAILED"))` | Stale archive failure |
| 490 | `systemText.includes("<hivemind-setup>")` | First-run setup block |
| 491 | `systemText.includes("First-Run Recon Protocol")` | First-run recon |
| 492 | `systemText.includes("Detected project: hm-first-run")` | Detected project |
| 493 | `systemText.includes("Framework context:")` | Framework context |
| 566 | `systemText.includes("Chain breaks:")` | Chain breaks |
| 569 | `systemText.includes("no parent tactic")` | Missing parent tactic |
| 595 | `systemText.includes("declare_intent")` | Declare intent suggestion |
| 598 | `systemText.includes("LOCKED")` | LOCKED status |
| 726 | `systemText.includes("compact_session")` | Compact suggestion |
| 1251 | `systemText.includes("<hivemind>") && systemText.includes("</hivemind>")` | Hivemind tags |
| 1255 | `!systemText.includes("<hivemind-governance>")` | No old governance tag |

**Migration strategy per assertion:**

- **Lines 448 (AUTO-ARCHIVE FAILED):** Keep in session-lifecycle. Stale archive is a lifecycle concern, not duplicated.
- **Lines 490-493 (setup guidance):** Keep in session-lifecycle. First-run setup is NOT duplicated — it fires when no config exists.
- **Lines 566-569 (chain breaks):** Already in messages-transform Phase 7c (lines 597-600). Remove from session-lifecycle.
- **Lines 595-598 (LOCKED + declare_intent):** Status block from session-lifecycle. Move to messages-transform.
- **Line 726 (compact_session):** Long session warning. Already in messages-transform Phase 7c (lines 608-611). Remove from session-lifecycle.
- **Lines 1251-1255 (<hivemind> tags):** Wrapper tag from session-lifecycle `assembleSections()`. Keep minimal wrapper in session-lifecycle, OR remove entirely.

---

## Task Sequence

### Task 1: Migrate governance signals to messages-transform

**Files:**
- Modify: `src/hooks/messages-transform.ts` — add bootstrap/evidence/team/framework-conflict/GSD-goal injection to Phase 7c or Phase 1
- Modify: `src/hooks/session-lifecycle-helpers.ts` — export helpers needed by messages-transform (already exports most)

**Step 1:** Add `buildGovernanceSignals()` call to messages-transform Phase 7c, inject framework conflict + GSD goal + session boundary as checklist items or prepended synthetic parts.

**Step 2:** Add bootstrap/evidence/team blocks to messages-transform Phase 1 (first-turn context injection path).

**Step 3:** Add pending_failure_ack "SUBAGENT REPORTED FAILURE" warning to messages-transform (already partially there at line 571, but needs the visible warning text).

**Step 4:** Run `npx tsc --noEmit` — must pass.

**Step 5:** Commit: `feat(D7): migrate governance signals to messages-transform canonical channel`

### Task 2: Update test file — governance-stress.test.ts

**Files:**
- Modify: `tests/governance-stress.test.ts`

**Step 1:** Change GOV-01/GOV-02 assertions (lines 66-67) to test messages-transform output instead of session-lifecycle system prompt. Create messages-transform hook, call it with mock messages, check synthetic parts for `<hivemind-bootstrap>`, `<hivemind-evidence>`, `<hivemind-team>`.

**Step 2:** Change GOV-06/GOV-07 assertions (lines 130-134) to test messages-transform output for `[FRAMEWORK CONFLICT]` and `Pinned GSD goal:`.

**Step 3:** Run test: `npx tsx --test tests/governance-stress.test.ts`
Expected: 13/13 PASS

**Step 4:** Commit: `test(D7): migrate governance-stress assertions to messages-transform channel`

### Task 3: Update test file — cycle-intelligence.test.ts

**Files:**
- Modify: `tests/cycle-intelligence.test.ts` (prompt injection section, lines 301-358)

**Step 1:** Change 4 assertions (lines 321, 335, 339, 352) from checking `output.system` to checking messages-transform synthetic parts for "SUBAGENT REPORTED FAILURE" and "export_cycle"/"hivemind_cycle".

**Step 2:** Run test: `npx tsx --test tests/cycle-intelligence.test.ts`
Expected: 29/29 PASS

**Step 3:** Commit: `test(D7): migrate cycle-intelligence prompt assertions to messages-transform channel`

### Task 4: Update test file — session-lifecycle-boundary.test.ts

**Files:**
- Modify: `tests/session-lifecycle-boundary.test.ts`

**Step 1:** Change 2 assertions (lines 71-72) from checking `output.system` to checking messages-transform synthetic parts for "Natural boundary" and "Run /hivemind-compact".

**Step 2:** Run test: `npx tsx --test tests/session-lifecycle-boundary.test.ts`
Expected: 2/2 PASS

**Step 3:** Commit: `test(D7): migrate boundary assertions to messages-transform channel`

### Task 5: Update test file — integration.test.ts

**Files:**
- Modify: `tests/integration.test.ts`

**Step 1:** Update assertions that check system prompt for content now in messages-transform:
- Lines 566-569 (chain breaks) — test via messages-transform
- Lines 595-598 (LOCKED + declare_intent) — test via messages-transform
- Line 726 (compact_session) — test via messages-transform
- Lines 1251-1255 (<hivemind> tags) — adjust or remove based on what stays in session-lifecycle

**Step 2:** Keep assertions for content that STAYS in session-lifecycle:
- Lines 448 (AUTO-ARCHIVE FAILED) — stays, it's lifecycle-specific
- Lines 490-493 (setup guidance) — stays, fires before config exists

**Step 3:** Run test: `npx tsx --test tests/integration.test.ts`
Expected: all pass

**Step 4:** Commit: `test(D7): migrate integration assertions to messages-transform channel`

### Task 6: Strip session-lifecycle.ts

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`

**Step 1:** Remove calls to: `buildGovernanceSignals()`, `buildBootstrapContext()`, `buildTaskBlock()`, `buildStatusBlock()`. Keep: stale session handling, setup guidance, governance instruction, `<hivemind>` wrapper (minimal), `appendChecklistFailureReminder()`.

**Step 2:** Remove `assembleSections()` budget logic — simplify to minimal output.

**Step 3:** Run `npx tsc --noEmit` — must pass.

**Step 4:** Run `npm test` — must have ≤2 failures (pre-existing only).

**Step 5:** Commit: `feat(D7): strip duplicated injections from session-lifecycle`

### Task 7: Clean up brain-state flag

**Files:**
- Modify: `src/schemas/brain-state.ts`

**Step 1:** Evaluate `first_turn_context_injected` flag. If messages-transform is now sole channel and handles its own gating (it does via `injectedSessionIds` Set + `markerInjected` flag), determine if the brain-state flag is still needed.

**Step 2:** If removable: delete from schema, remove 5 grep matches. If needed by messages-transform: keep but document why.

**Step 3:** Run `npx tsc --noEmit` + `npm test`.

**Step 4:** Commit: `refactor(D7): clean up first_turn_context_injected flag`

### Task 8: Token measurement instrumentation

**Files:**
- Modify: `src/hooks/session-lifecycle.ts` — add char count logging
- Modify: `src/hooks/messages-transform.ts` — add char count logging

**Step 1:** Add debug logging that estimates token count (chars / 4) for all injected content per turn.

**Step 2:** Verify AC-2: total injected content < 4800 chars (≈1200 tokens) per non-bootstrap turn.

**Step 3:** Run `npm test` — must pass.

**Step 4:** Commit: `feat(D7): add token footprint instrumentation`

### Task 9: Verify all 6 acceptance criteria

**Step 1:** Run `npm test` — capture output, count pass/fail.
**Step 2:** Run `npx tsc --noEmit` — must be clean.
**Step 3:** Verify AC-1: `grep -n "buildGovernanceSignals\|compileFirstTurnContext\|generateFirstTurnConfirmationBlock\|appendChecklistFailureReminder\|buildBootstrapContext\|buildTaskBlock\|buildStatusBlock" src/hooks/session-lifecycle.ts` — should show minimal/zero hits for duplicated functions.
**Step 4:** Verify AC-2: Token instrumentation log shows < 1200 tokens.
**Step 5:** Verify AC-3: Diff both hook outputs — zero overlap.
**Step 6:** Verify AC-6: `npx tsx --test tests/governance-stress.test.ts tests/cycle-intelligence.test.ts tests/session-lifecycle-boundary.test.ts` — all pass.

**Step 7:** Commit: `docs(D7): verification evidence for all 6 acceptance criteria`

---

## Pre-existing Failures (DO NOT FIX)

| Test | Reason |
|------|--------|
| `tests/entry-chain.test.ts` | Fails on `be_skeptical` config default — NOT caused by D7 |
| `tests/evidence-gate.test.ts` | Fails on `be_skeptical` config default — NOT caused by D7 |

---

## Collision Map (from validated plan)

| File | Risk | Constraint |
|------|------|------------|
| `src/hooks/session-lifecycle.ts` | 🔴 CRITICAL | 231 lines. Strip duplicated injections, keep stale/setup/governance-instruction |
| `src/hooks/messages-transform.ts` | 🔴 CRITICAL | 701 lines. Already has Phase 7c governance signals from commit `bd569a5` |
| `src/hooks/session-lifecycle-helpers.ts` | 🟡 HIGH | 479 lines. Exports used by both hooks — do NOT break exports |
| `src/schemas/brain-state.ts` | 🟢 LOW | `first_turn_context_injected` flag — 5 grep matches |
| `src/lib/session-governance.ts` | 🟢 LOW | `buildGovernanceSignals()` — still needed by messages-transform |

---

## Delegation Target

**Agent:** Any implementation agent with `src/**` and `tests/**` write permissions.

**NOT:** HiveFiver (meta-builder — `.opencode/**` scope only).

**Required skills for executing agent:**
- `executing-plans` — batch execution with checkpoints
- `verification-before-completion` — evidence before claims
- `test-driven-development` — test-first approach

**Verification commands:**
```bash
npx tsc --noEmit          # Must pass
npm test                   # ≤2 pre-existing failures
grep -c "buildGovernanceSignals\|buildBootstrapContext\|buildTaskBlock" src/hooks/session-lifecycle.ts  # Should be 0 or minimal
```
