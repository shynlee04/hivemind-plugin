# UAT Test Log — Phase 1, Batch 1: Task Management Tools
**Date:** 2026-05-05
**Team:** Team B
**Status:** IN PROGRESS

---

## Test 1.1: nl-route — Natural Language Routing ✅ COMPLETE
**Tool:** nl-route (harness-native)

### Results Table

| # | Input | Routed To | Success | Confidence | Notes |
|---|-------|-----------|---------|------------|-------|
| 1.1.1 | "echo hello world" | test-echo | ✅ | 0.33 | Args: "hello world" |
| 1.1.2 | "repeat what I say" | test-echo | ✅ | 0.67 | No args extracted |
| 1.1.3 | "send a test message" | NONE | ❌ | N/A | Semantic gap — no keyword match |
| 1.1.4 | "show me the status" | test-status | ✅ | 0.33 | Keyword "status" matched |
| 1.1.5 | "what's the current state of things" | NONE | ❌ | N/A | Semantic gap — no keyword match |
| 1.1.6 | "list available items" | test-list | ✅ | 0.33 | Args: "available items" |
| 1.1.7 | "show all the tests" | NONE | ❌ | N/A | Semantic gap — no keyword match |
| 1.1.8 | "" (empty) | NONE | ❌ | N/A | Graceful failure |
| 1.1.9 | "test-status --verbose" | test-status | ✅ | 0.33 | Args: "verbose" — flags preserved |
| 1.1.10 | "echo \"hello world\" with quotes" | test-echo | ✅ | 0.33 | Args: full string with quotes |
| 1.1.11 | "list all delegations that are running" | test-list | ✅ | 0.33 | Args: full sentence |

### Verdict: PASS (7/11 routed, 4 semantic gaps expected)
- Keyword matching ✅
- Args extraction ✅
- Graceful failure on empty ✅
- Semantic routing not supported (by design) — NOT a bug

---

## Test 1.2: delegate-task — Agent Delegation Dispatch ✅ COMPLETE
**Tool:** delegate-task (src/tools/delegate-task.ts)

### Test 1.2.1: Basic delegation to hm-l2-general
- **Delegation ID:** 7bbc7ba2-efa4-4ab5-b7a1-b0ab1a08069b
- **Agent:** hm-l2-general
- **Status:** completed
- **Result:** "TEAM-B UAT DELEGATION ECHO: SUCCESS"
- **Duration:** 25.3s
- **Execution Mode:** sdk
- **Surface:** agent-delegation
- **Recovery Guarantee:** resumable
- **Nesting Depth:** 1
- **Grace Period Expires:** 1777916862042
- **VERDICT:** ✅ PASS — Basic delegation lifecycle complete

### Test 1.2.2: Parallel delegation to hm-l2-researcher
- **Delegation ID:** 85b4f491-c526-4a63-b238-43a3ebd9b77f
- **Agent:** hm-l2-researcher
- **Status:** completed
- **Result:** "TEAM-B UAT RESEARCHER ECHO: SUCCESS"
- **Duration:** 26.5s
- **Session:** ses_20bee8aeeffeFwiGmsoEj3Ziem
- **VERDICT:** ✅ PASS — Parallel dispatch works

### Test 1.2.3: Parallel delegation to hm-l2-auditor
- **Delegation ID:** 7766a002-b21f-4a8d-b0a3-88f0ba0cc3e8
- **Agent:** hm-l2-auditor
- **Status:** completed
- **Result:** "TEAM-B UAT AUDITOR ECHO: SUCCESS"
- **Duration:** 26.4s
- **Session:** ses_20bee8513ffeZbG6pLp8F9z6UJ
- **VERDICT:** ✅ PASS — Parallel dispatch works

### Test 1.2.4: Non-existent agent (error case)
- **Agent:** nonexistent-agent-xyz
- **Result:** Error: `[Harness] Invalid agent: "nonexistent-agent-xyz". Available: [...]`
- **Available agents listed:** 86 agents in full list
- **VERDICT:** ✅ PASS — Error handling works, informative message with all available agents

### Test 1.2.5: Safety ceiling validation
- **safetyCeilingMs:** 5000
- **Result:** Zod validation error: `Too small: expected number to be >=60000`
- **VERDICT:** ✅ PASS — Minimum 60s safety ceiling enforced by schema

### Key Observations
1. **WaiterModel dispatch:** All delegations return immediately with delegation ID (background)
2. **Dual-signal completion:** Both polling AND system notification confirmed completion
3. **Parallel safety:** 2 delegations dispatched simultaneously, both completed independently
4. **Queue keys:** Different per agent (agent:hm-l2-general, agent:hm-l2-researcher, etc.)
5. **Average delegation duration:** ~26s for echo tasks

---

## Test 1.2b: delegation-status — Status Polling ✅ COMPLETE
**Tool:** delegation-status (src/tools/delegation-status.ts)

### Test Results

| # | Query | Result | Verdict |
|---|-------|--------|---------|
| 1.2b.1 | By ID (completed) | Full record with result, timestamps | ✅ |
| 1.2b.2 | By ID (running) | Record with status=running, no result yet | ✅ |
| 1.2b.3 | By status=completed | 1 delegation returned, metadata.total=3 | ✅ |
| 1.2b.4 | By status=running | 2 delegations returned, metadata.total=3 | ✅ |
| 1.2b.5 | By status=all | All 3 delegations with full details | ✅ |
| 1.2b.6 | No params | All 3 delegations (default=all) | ✅ |
| 1.2b.7 | Non-existent ID | Error: `[Harness] Delegation "..." not found` | ✅ |

### Key Observations
1. **metadata.total** always reflects total delegation count (not filtered count)
2. **Grace period** set on completed delegations (~600s from completion)
3. **Result field** only present on completed delegations
4. **Error messages** use `[Harness]` prefix consistently
