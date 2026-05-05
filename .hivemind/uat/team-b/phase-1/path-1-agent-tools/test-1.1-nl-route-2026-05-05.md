# UAT Test Log — Phase 1, Batch 1: Task Management Tools
**Date:** 2026-05-05
**Team:** Team B
**Status:** IN PROGRESS

---

## Test 1.1: nl-route — Natural Language Routing
**Tool:** nl-route (harness-native)
**Hypothesis:** nl-route correctly classifies NL requests into test-echo, test-list, or test-status commands.
**Method:** Invoke with diverse phrasings for each target command.

### Results Table

| # | Input | Routed To | Success | Confidence | Args Extracted |
|---|-------|-----------|---------|------------|----------------|
| 1.1.1 | "echo hello world" | test-echo | ✅ | 0.33 | "hello world" |
| 1.1.2 | "repeat what I say" | test-echo | ✅ | 0.67 | "" |
| 1.1.3 | "send a test message" | NONE | ❌ | N/A | N/A — no match |
| 1.1.4 | "show me the status" | test-status | ✅ | 0.33 | "" |
| 1.1.5 | "what's the current state of things" | NONE | ❌ | N/A | N/A — no match |
| 1.1.6 | "list available items" | test-list | ✅ | 0.33 | "available items" |
| 1.1.7 | "show all the tests" | NONE | ❌ | N/A | N/A — no match |
| 1.1.8 | "" (empty) | NONE | ❌ | N/A | N/A — no match |
| 1.1.9 | "test-status --verbose" | test-status | ✅ | 0.33 | "verbose" |
| 1.1.10 | "echo \"hello world\" with quotes" | test-echo | ✅ | 0.33 | "\"hello world\" with quotes" |
| 1.1.11 | "list all delegations that are running" | test-list | ✅ | 0.33 | "all delegations that are running" |

### Findings

**PASS (7/11 routed correctly):**
- ✅ Keyword matching works for "echo", "status", "list"
- ✅ Args extraction preserves quoted strings
- ✅ Empty input returns graceful failure
- ✅ Command flags (--verbose) passed as args

**FAIL/GAP (4/11 unmatched):**
- ❌ "send a test message" → should match test-echo (semantic gap)
- ❌ "what's the current state of things" → should match test-status (semantic gap)
- ❌ "show all the tests" → should match test-list (semantic gap)
- ❌ "show me the status" → matched but low confidence (0.33)

**VERDICT:** Keyword-based routing works. Semantic routing (paraphrases without keywords) fails. Confidence scores are consistently low (0.33-0.67). This is a **known limitation** — nl-route uses keyword matching, not LLM-based intent classification.

---

## Test 1.2: delegate-task — Agent Delegation Dispatch
**Tool:** delegate-task (src/tools/delegate-task.ts)
**Hypothesis:** delegate-task dispatches work to specialist agents, returns delegation ID, supports background WaiterModel.
