# Forensic Report — Session-Tracker Regressions After C1-C3

**Generated:** 2026-05-28T18:15:00+07:00
**Problem:** Session-tracker regressions after C1-C3 changes — assistant messages not recorded for n-turns; frontmatter writer ENOENT errors leaking to TUI.

---

## Evidence Summary

### Git Activity
- **Last commit:** 2026-05-28 17:57:48 +07 — `fix(session-tracker): check file existence before updating session status or journey to prevent ENOENT warnings`
- **Commits (last 30):** 30
- **Time span:** 2026-05-28 04:03 → 2026-05-28 17:57 (same day)
- **Uncommitted changes:** Yes — 120+ deleted session files, modified state files, untracked session directories
- **Active worktrees:** 1 (main only)

### C1-C3 Commit Chain
| Commit | Description | Files Changed |
|--------|-------------|---------------|
| `a6f2bef1` | fix(C1): critical type safety & error handling | 5 files (+90/-29) |
| `2f3f25c5` | fix(C2): eliminate 11 `as any` casts | session-intelligence.ts |
| `43a51ed6` | fix(C2): remaining type safety, security, env | multi-file |
| `81bf7a93` | refactor(C3): extract ChildBackfiller | 2 files (+161/-103) |
| `7aa8f171` | fix(security): redact secrets | delegation-status.ts |
| `41314cf2` | fix(session-tracker): support nested sessionID paths | multi-file |
| `0e035f1c` | fix(session-tracker): check file existence before ENOENT | multi-file |

### Planning State
- **Current milestone:** Concern-remediation phases (C1-C8)
- **C1-C3 marked complete** in ROADMAP.md and STATE.md (commit `aafcd732`)
- **C1-C3 artifacts:** No PLAN.md, SUMMARY.md, or VERIFICATION.md found — committed directly without phase artifact trail

---

## Anomalies Detected

### Anomaly 1 — N-Turn Assistant Recording Broken (Main Sessions) — ARCHITECTURAL
**Confidence: HIGH**
**Evidence:**
- `event-capture.ts:316-421` — `handleSessionIdle()` writes exactly ONE `## ASSISTANT (turn N)` block per session lifecycle. No mechanism captures n-turns mid-session.
- `message-capture.ts:207-235` — `handleAssistantMessage()` is **dead code** (SDK only delivers `UserMessage` role:"user" via `chat.message` hook)
- `event-capture.ts:763-793` — `handleSessionNextTextEnded()` is **dead code** (SDK does not dispatch `session.next.text.ended`)
- `last-message-capture.ts:180` — `onLastMessageUpdate` only updates frontmatter `lastMessage` (single field overwrite), never appends body turns

**Interpretation:** Main sessions can only record ONE assistant turn (at session.idle). There is no event pathway delivering intermediate assistant messages. The SDK event types (`message.updated`, `message.part.updated`) tracked by `LastMessageCapture` write only to frontmatter, not to body turns.

### Anomaly 2 — Child Session Backfill Silently Skipped (C1 Regression)
**Confidence: HIGH**
**Evidence:**
- `event-capture.ts:321-323` — New `childFileExists` guard (from commit `0e035f1c`) blocks `backfillChildTurnsFromSdk()` if file not found
- `child-writer.ts:155-162` — `resolveWriteParent()` resolves via `hierarchyIndex.getRootMain()` — returns `undefined` if hierarchy index hasn't mapped the child yet (race)
- `child-writer.ts:262-274` — `childFileExists` uses `resolveWriteParent()` for directory resolution → wrong directory → `false` → early return
- `child-backfiller.ts:51-99` — `backfillChildTurnsFromSdk()` is the ONLY mechanism for recording child assistant turns — when skipped, ALL child assistant turns are lost

**Interpretation:** The `childFileExists` guard added in commit `0e035f1c` causes silent false-negatives when the hierarchy index hasn't resolved the root main parent yet. `resolveWriteParent()` falls back to immediate parent dir, while `writeImmediateChildFile()` writes to root main dir — mismatch causes file-not-found, skipping the backfill entirely.

### Anomaly 3 — Frontmatter Writer ENOENT — Unguarded Callback (C1 INCOMPLETE FIX)
**Confidence: HIGH**
**Evidence:**
- `initialization.ts:153-166` — `onLastMessageUpdate` callback calls `sessionWriter.updateFrontmatter()` **WITHOUT** any `sessionFileExists` guard
- `last-message-capture.ts:179-180` — Fires for EVERY `message.part.updated` event, including child sessions (which have no `.md` files)
- `session-writer.ts:235-253` — `updateFrontmatter()` calls `readFile(filePath, "utf-8")` at line 240 — throws ENOENT if file doesn't exist
- `plugin.ts:411-416` — Event observer pipeline routes ALL events through `LastMessageCapture`
- `initialization.ts:161` — Uses `console.warn()` → leaks to TUI stderr (vs `client.app.log()` used elsewhere)

**Interpretation:** Commit `0e035f1c` added `sessionFileExists` guards to 6 locations in `event-capture.ts` but MISSED the most frequently triggered path — the `onLastMessageUpdate` callback in `initialization.ts`. This fires on every text part update for EVERY session (including child sessions with only `.json` files). Additionally uses `console.warn()` instead of `client.app.log()`, making errors visible in TUI.

### Anomaly 4 — Missing Artifact Completeness
**Confidence: MEDIUM**
**Evidence:**
- C1-C3 commits (a6f2bef1..0e035f1c) were committed without PLAN.md, SUMMARY.md, or VERIFICATION.md artifacts
- `aafcd732` marks C1-C3 complete but no phase artifact trail exists

**Interpretation:** C1-C3 bypassed the phase artifact process. Changes were committed directly. This is consistent with a concern-remediation fast-track but means no spec compliance or evidence gate was run.

### Anomaly 5 — childFileExists Guard Timing Race (C1 REGRESSION)
**Confidence: MEDIUM**
**Evidence:**
- `event-capture.ts:717-740` — `resolveChildLifecycleRoute()` resolves parent via SDK → hierarchyIndex → pendingRegistry
- `child-writer.ts:155-162` — `resolveWriteParent()` resolves via `hierarchyIndex.getRootMain()` only
- These two resolution paths can DISAGREE when hierarchy index is partially built
- Child .json written to root main dir (D-03), but `childFileExists` looks in wrong dir → false → blocks backfill

**Interpretation:** The `childFileExists` guard creates a timing-dependent regression. If `resolveChildLifecycleRoute()` runs before the hierarchy index has fully resolved the root main chain, the file existence check looks in the wrong directory and silently blocks ALL child turn backfill.

---

## Root Cause Hypothesis

Based on the evidence above, three distinct root causes explain all reported symptoms:

1. **Frontmatter ENOENT → TUI leak:** The `onLastMessageUpdate` callback in `initialization.ts:153-166` calls `sessionWriter.updateFrontmatter()` with no file-existence guard, firing for every `message.part.updated` event including child sessions (`.json` only). The `console.warn()` stderr output leaks to TUI as "frontmatter writer failure."

2. **Child session backfill skipped:** The `childFileExists` guard added in commit `0e035f1c` at `event-capture.ts:321-323` (and 5 other locations) uses `resolveWriteParent()` which can resolve to the wrong directory when the hierarchy index is partially built, causing silent false-negatives that block `backfillChildTurnsFromSdk()`.

3. **N-turn recording architectural gap:** No SDK event delivers assistant messages mid-session. `handleSessionIdle()` writes one turn. `LastMessageCapture` only updates frontmatter. Dead code paths (`handleAssistantMessage`, `handleSessionNextTextEnded`) confirm this is an architectural gap, not a regression.

---

## Recommended Actions

1. **Fix frontmatter ENOENT (HIGHEST PRIORITY):** Add `sessionFileExists` guard and replace `console.warn` with `client.app.log` in `initialization.ts:153-166`.
   - File: `src/features/session-tracker/initialization.ts` (lines 153-166)

2. **Fix child backfill skip (HIGH PRIORITY):** Make `childFileExists` scan all session-tracker subdirectories (like `readChildData` at child-writer.ts:331-371 already does), or remove early-return guards from backfill call paths.
   - File: `src/features/session-tracker/persistence/child-writer.ts` (lines 262-274)

3. **Fix n-turn recording (MEDIUM PRIORITY):** Wire `LastMessageCapture`'s live text updates to also call `sessionWriter.appendAssistantTurn()` with incrementing turn counters, not just frontmatter update.
   - Files: `src/features/session-tracker/capture/last-message-capture.ts`, `src/features/session-tracker/initialization.ts`

4. **Add phase artifacts for future C-phases:** Create PLAN.md, SUMMARY.md, VERIFICATION.md for remaining concern-remediation phases (C4-C8).

---

## Additional Spec Compliance Violations Found

During investigation, the following additional violations were identified:

1. **`console.warn` instead of `client.app.log`** (`initialization.ts:161`) — violates observability convention used everywhere else in `event-capture.ts`. All other error handlers use `void this.client.app?.log?.({... level: "warn" ...})`.

2. **Dead code retained** — `handleAssistantMessage()` (message-capture.ts:207-235) and `handleSessionNextTextEnded()` (event-capture.ts:763-793) are confirmed unreachable but retained for "forward compatibility" without documented SDK version/roadmap reference.

3. **`resolutionWriteParent` fallback ambiguity** — `child-writer.ts:155-162` silently falls back to immediate parent when `getRootMain()` returns `undefined`, creating silent data placement errors (child .json goes to wrong directory).

4. **No spec compliance gate evidence** — C1-C3 were committed without running the quality gate triad (no lifecycle, spec-compliance, or evidence-truth gate artifacts found).

---

*Report generated by forensic investigation. All paths relative to project root. No sensitive data exposed.*

---

## Interactive Investigation

Report saved to `.planning/forensics/report-session-tracker-regressions-2026-05-28.md`.

Tôi có thể đào sâu thêm bất kỳ phát hiện nào. Bạn muốn tôi:
- Trace cụ thể từng anomaly đến root cause?
- Đọc thêm file để xác nhận?
- Hay tiến hành fix ngay?
