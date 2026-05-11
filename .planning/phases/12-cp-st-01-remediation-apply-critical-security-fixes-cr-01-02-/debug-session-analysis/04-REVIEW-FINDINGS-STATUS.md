# Phase 12: CP-ST-01 Remediation — Review Findings Status

**Date:** 2026-05-12
**Source:** `CP-ST-01-REVIEW.md` (14 findings: 3 critical, 6 warning, 5 info)
**Verification method:** Source code inspection + disk evidence audit

---

## Critical Issues

| ID | Finding | File:line | Status | Evidence |
|----|---------|-----------|--------|----------|
| **CR-01** | Path Traversal in `readSessionFile` — Recovery Module | `session-recovery.ts:264-268` | ❌ UNRESOLVED | Source code unchanged. `resolve(trackerRoot, sessionID, ...)` still raw — no `safeSessionPath` import. |
| **CR-02** | Path Traversal in Session-Tracker Tool — `handleExportSession` | `session-tracker.ts:107-108` | ❌ UNRESOLVED | Source code unchanged. `resolve(trackerRoot, input.sessionId, ...)` still raw. No `isValidSessionID` guard. |
| **CR-03** | REQ-ST-05 Violation — `handleRead` Can Leak File Content | `tool-capture.ts:170-187` | ❌ UNRESOLVED | Source code unchanged. Substring-matching on `"error"`/`"not found"` still present. Full output captured as error parameter. |

**All 3 critical review findings remain unresolved.** No code changes applied.

---

## Warnings

| ID | Finding | File:line | Status | Evidence |
|----|---------|-----------|--------|----------|
| **WR-01** | `childCount: undefined` Can Corrupt Project Index Entry | `tool-capture.ts:251-253` | ❌ UNRESOLVED | `childCount: undefined` still present. Confirmed by L1 evidence: 13 sessions missing `childCount` field. |
| **WR-02** | Race Condition in `updateFrontmatter` — Double-Read + Write | `session-writer.ts:175-189` | ❌ UNRESOLVED | `atomicAppendMarkdown` still re-reads file internally. Dynamic import on line 179 still present. |
| **WR-03** | `isValidSessionID` Regex Is an Assumption | `types.ts:270` | ❌ UNRESOLVED | Regex `/^ses_[a-zA-Z0-9]{6,}$/` unchanged. No loosening or format verification. |
| **WR-04** | Turn Counter Reset on Plugin Restart | `message-capture.ts:65` | ❌ UNRESOLVED | `turnCounters` Map still in-memory only. No seeding from existing .md files. |
| **WR-05** | `SessionTracker.cleanup()` Never Called | `index.ts:324` + `plugin.ts` | ❌ UNRESOLVED | Confirmed by L1 evidence: 1.4MB legacy event-tracker state persists. No call chain to `cleanup()`. |
| **WR-06** | `addChild` Increments `turnCount` Semantically Incorrectly | `session-index-writer.ts:137` | ❌ UNRESOLVED | `index.turnCount++` still present. Confirmed by L1: ses_1e8826b7 has turnCount=8 (8 children, but only 2 actual turns). |

**All 6 warnings remain unresolved.** No code changes applied.

---

## Info

| ID | Finding | File:line | Status | Evidence |
|----|---------|-----------|--------|----------|
| **IN-01** | Dynamic Import on Every `updateFrontmatter` Call | `session-writer.ts:179` | ❌ UNRESOLVED | `await import("node:fs/promises")` still present. |
| **IN-02** | `let` Instead of `const` for Non-Reassigned Variables | `tool-capture.ts:174-178` | ❌ UNRESOLVED | Variables still declared with `let`. |
| **IN-03** | Non-Null Assertion in `extractTextContent` | `message-capture.ts:207` | ❌ UNRESOLVED | `p.text!` non-null assertion still present. |
| **IN-04** | Synchronous `statSync`/`existsSync` in Read-Side Tool | `session-tracker.ts:21,198,202` | ❌ UNRESOLVED | `statSync`/`existsSync` still used. |
| **IN-05** | `console.log` Debug Artifact on Initialization | `index.ts:247` | ❌ UNRESOLVED | `console.log("[Harness] Session tracker: initialized")` still present. |

**All 5 info findings remain unresolved.** No code changes applied.

---

## Summary

| Category | Total | Resolved | Unresolved | Regressed |
|----------|-------|----------|------------|-----------|
| Critical | 3 | 0 | 3 | 0 |
| Warning | 6 | 0 | 6 | 0 |
| Info | 5 | 0 | 5 | 0 |
| **Total** | **14** | **0** | **14** | **0** |

**100% of review findings remain unresolved.** The review was filed but no remediation plan or fix commit followed the review. All 14 findings are live in the current codebase and confirmed by fresh source inspection.

### New Findings Beyond Review

The disk evidence audit discovered 8 additional systemic issues not caught by the code review:

| ID | Description | Severity |
|----|-------------|----------|
| DEFECT-02 | Project index serial queue frozen — no updates in 7+ hours | 🔴 CRITICAL |
| DEFECT-03 | Child records write-once, never updated | 🔴 CRITICAL |
| DEFECT-07 | toolSummary never populated | 🟡 HIGH |
| DEFECT-08 | Child session lifecycle events completely lost | 🔴 CRITICAL |
| DEFECT-09 | Lazy bootstrap gap in event handler | 🟡 HIGH |
| DEFECT-11 | computeThinkingDuration returns hardcoded "present" | 🟢 MEDIUM |
| SYS-03 | project-continuity.json lastUpdated frozen | 🔴 CRITICAL |
| SYS-04 | No child-to-parent status back-propagation | 🟡 HIGH |

The code review was thorough on surface-level issues (path traversal, race conditions, type safety) but missed systemic architecture gaps that only manifest in live hook event sequencing — specifically, the loss of child session lifecycle events, the frozen index queue, and the write-once child record pattern.
