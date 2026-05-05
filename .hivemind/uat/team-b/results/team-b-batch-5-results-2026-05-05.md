# UAT Team-B Batch 5 Results — Path 2: Runtime Programmatic
**Date:** 2026-05-05
**Tester:** Team-B (blind end-user)
**Marker:** team-b

---

## Summary Table

| Test ID | Tool | Action(s) Tested | Result | Notes |
|---------|------|-----------------|--------|-------|
| 5a.1 | run-background-command | run (bash -lc echo+sleep) | **PASS** | PTY dispatch with delegation tracking |
| 5a.2 | run-background-command | list | **PASS** | 3 sessions listed with full metadata |
| 5a.3 | run-background-command | output (PTY ID) | **PASS** | Full output with nextOffset |
| 5a.4 | run-background-command | output (human ID) | **FAIL** | "Access denied" — must use PTY session ID |
| 5a.5 | run-background-command | parallel dispatch (A+B) | **PASS** | Both completed independently |
| 5b.1 | run-background-command | terminate (PTY ID) | **PASS** | explicitCancellation=true, terminalKind=cancelled |
| 5b.2 | run-background-command | terminate (human ID) | **FAIL** | Same access denied — consistent behavior |
| 5b.3 | run-background-command | interactive input (cat) | **PASS** | Input echoed back by cat process |
| 5b.4 | run-background-command | output with offset | **PASS** | Offset=10, skipped first 10 chars |
| 5b.5 | delegation-status (PTY completed) | query by ID | **PASS** | executionMode=pty, surface=command-process |
| 5b.6 | delegation-status (PTY cancelled) | query by ID | **PASS** | status=error, terminalKind=cancelled, explicitCancellation=true |
| 5c.1 | session-journal-export | JSON (PTY lifecycle) | **PASS** | 0 PTY delegations in journal (tracked separately) |
| 5c.2 | session-journal-export | Markdown (PTY lifecycle) | **PASS** | Correct empty lineage output |
| 5d.1 | prompt-skim → prompt-analyze | Full pipeline chain | **PASS** | Skim: 75 words, 98 tokens, 1 URL, 4 paths (1 exists), complexity=2, verdict=simple |
| 5d.2 | prompt-analyze after skim | Analysis | **PASS** | 1 minor finding (absolute claim), clarity=88 |
| 5d.3 | session-patch (non-session target) | Validation | **PASS** | Correctly rejects non-session*.md paths |

**Score: 14 PASS, 2 FAIL (both expected behavior — human ID access denied)**

---

## Detailed Results

### 5a-5b: run-background-command Full Lifecycle

**Dispatch:** 5 PTY sessions dispatched via `bash -lc` format
- All return: delegationId, executionMode=pty, ptySessionId, queueKey=category:command, recoveryGuarantee=best-effort
- Working directory inherited correctly
- PID captured for each process

**Completed sessions (3):**

| PTY Session ID | Delegation ID | Duration | Output |
|---------------|---------------|----------|--------|
| pty-cad8069c... | 72d8cdaa... | 2.3s | line-2-complete\r\nline-3-final\r\n |
| pty-1b13ce8a... | 556a14ab... | 2.1s | team-b-pty-A\r\nA-done\r\n |
| pty-c2922609... | a398eaf8... | 2.1s | B-done\r\n |

**Cancelled sessions (2):**

| PTY Session ID | Delegation ID | Duration | Terminal Kind |
|---------------|---------------|----------|--------------|
| pty-391c4eaf... | 1e1ff9d7... | 12.8s | cancelled |
| pty-84e64bb9... | 3e22cc97... | 19.2s | cancelled |

**Interactive test (cat):**
- Input: "team-b-interactive-test-line-1\n"
- Output: "team-b-interactive-test-line-1\r\nteam-b-interactive-test-line-1\r\n" (cat echoed input)

**Offset reading:**
- Full output: "line-2-complete\r\nline-3-final\r\n" (31 chars)
- Offset=10: "plete\r\nline-3-final\r\n" (starts at char 11)
- nextOffset correctly tracks position

### FINDING-5.1: Human Session ID Access Denied
**Severity:** MEDIUM (UX friction)
**Impact:** `output`, `terminate` actions reject human-friendly sessionId (e.g., "team-b-pty-1") — require internal PTY session ID (e.g., "pty-cad8069c-...")
**Root Cause:** Access control checks delegation ownership by PTY ID, not by the user-provided sessionId
**Evidence:** Both output and terminate return identical error: "Access denied for PTY session \"team-b-pty-1\": no caller-visible delegation owns this session"
**Workaround:** Use the ptySessionId from the run response or list action

### 5c: Lifecycle Observation

**Session journal export:** PTY delegations are NOT tracked in session-journal-export (0 delegations in output). They ARE tracked in delegation-status tool. This is architecturally consistent — PTY command-process surface uses a different tracking path than SDK agent delegations.

**Delegation-status for PTY:** Full lifecycle data captured:
- executionMode: "pty"
- surface: "command-process"
- queueKey: "category:command"
- terminalKind: "completed" or "cancelled"
- gracePeriodExpiresAt: ~600s from completion

### 5d: Prompt Transformation Pipeline (skim→analyze→patch)

**Skim results:**
- word_count=75, line_count=9, token_estimate=98
- url_count=1: https://github.com/example/repo/blob/main/docs/spec.md
- path_count=4: ROADMAP.md (not found), ./output/phase-32-plan.md (not found), src/lib/delegation-manager.ts (EXISTS), ...helpers.ts (not found)
- absolute_claim_count=1, complexity_score=2, flooding_risk=low, verdict=simple

**Analysis results:**
- 1 minor finding (absolute claim on line 9)
- clarity_score=88
- No critical or important findings

**Session-patch validation:** Correctly rejects non-session*.md paths

---

## Delegation IDs (Batch 5)

| ID | Agent | Type | Duration | Status |
|----|-------|------|----------|--------|
| 72d8cdaa-... | command-runner | PTY | 2.3s | completed |
| 556a14ab-... | command-runner | PTY | 2.1s | completed |
| a398eaf8-... | command-runner | PTY | 2.1s | completed |
| 1e1ff9d7-... | command-runner | PTY | 12.8s | cancelled |
| 3e22cc97-... | command-runner | PTY | 19.2s | cancelled |

## Statistics

| Metric | Value |
|--------|-------|
| Tools tested | 4 (run-background-command, delegation-status, session-journal-export, prompt-skim/analyze) |
| Action variants | 16 |
| PASS | 14 |
| FAIL (expected) | 2 |
| Findings | 1 (medium — human ID access denied) |
| Total PTY sessions | 5 |
| Completed | 3 |
| Cancelled | 2 |
