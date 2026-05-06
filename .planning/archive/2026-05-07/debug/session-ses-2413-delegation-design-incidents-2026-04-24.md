---
status: open
trigger: "delegate-task UAT session ses_2413"
created: 2026-04-24T16:47:00Z
updated: 2026-04-24T16:47:00Z
phase: "16.3-delegation-subsystem-hardening-fix-critical-gaps-in-parent-r"
source: "session-ses_2413.md"
---

# Debug Incident Report: delegate-task UAT Session Design Flaws

**Session ID:** ses_2413f823effeyQ5LQ2HCOECftG
**Date:** 2026-04-24
**Duration:** ~38 minutes (4:09 PM – 4:47 PM)
**Scope:** delegate-task + delegation-status tool UAT validation
**Model:** GLM-5.1 (Build agent)

---

## Executive Summary

A UAT test of `delegate-task` exposed **8 design incidents** — not implementation bugs, but architectural gaps in how the harness manages delegation lifecycle, notification delivery, inter-turn context, and user-facing conversation flow. The core finding: **delegate-task works correctly as an orchestration primitive, but leaks raw background noise into human-facing conversations with no reconciliation layer.**

---

## Incident Classification

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| INC-01 | HIGH | UX/Notification | system_reminder firehose disrupts conversation flow |
| INC-02 | MEDIUM | Tool Bug | delegation-status list view returns empty array with non-zero total |
| INC-03 | HIGH | Architecture | No inter-turn delegation awareness across agent instances |
| INC-04 | MEDIUM | Context/LLM | Unprocessed delegation results become context poison |
| INC-05 | LOW | Recovery | Safety ceiling timeout recovery path not demonstrable |
| INC-06 | HIGH | Architecture | Stream lifecycle mismatch with delegation lifecycle |
| INC-07 | MEDIUM | Context/LLM | Agent role confusion across conversation turns |
| INC-08 | LOW | UX/Feature | No save-to-disk mechanism for delegation results |

---

## INC-01: system_reminder firehose disrupts conversation flow

**Severity:** HIGH
**Category:** UX / Notification Delivery
**Phase 16.3 Decision Relevance:** D-08 (notification-first), D-10 (human-readable summary + structured metadata)

### Evidence

- **Turn 1:** Agent fires 5 delegate-task calls. Returns 5 delegation IDs. Stream ends.
- **Turn 2 (user: "practical workflow?"):** Agent writes theoretical comparison. Meanwhile, system_reminder arrives for `coordinator` completion (line 376-387). Agent acknowledges inline but continues.
- **Turn 3 (user: "real use cases"):** Agent writes real-world comparison. system_reminder arrives for `build` completion (line 1372-1394) and `critic` completion (line 1400-1436). User says: "see again these are the last round launch and I have no ideas they are still running" (line 1671).
- **Turn 4 (user: "this is disruptive"):** User explicitly names the problem: "the latest task have arrived while I have no ideas what you have launched and it is very disruptive infact" (line 1442).
- **Turn 5 (user: "how to make them practical"):** User proposes solutions: stream-holding, turn-based handoff, pipeline categorization (line 1705).
- **Turn 6 (system_reminder for gsd-code-reviewer):** Still arriving 10+ minutes after original dispatch (line 1645-1665). User: "see again these are the last round launch and I have no ideas they are still running" (line 1671).

### What Happened

The harness delivered delegation completion notifications as raw `system_reminder` messages injected directly into the conversation stream. There was:
- No batching — each completion arrived individually
- No correlation to conversation context — notifications arrived during unrelated topic discussions
- No user consent — agent fired 5 background tasks without asking
- No notification management — no way to suppress, batch, or defer notifications

### Design Flaw

The notification system (D-08: "notification-first") delivers to the **conversation surface** without awareness of conversation cadence. This is correct for orchestrator-to-orchestrator communication but wrong for human-facing conversations. The harness needs a **notification mediation layer** that can:
1. Batch notifications until the agent is ready to present them
2. Suppress notifications during active user-agent exchange
3. Provide a "delegation briefing" at turn start instead of interrupting mid-turn

### User's Own Diagnosis (line 1562-1578)

> "delegate-task has no connection to the conversation cadence. It was designed for: Orchestrator Agent → 'I need 5 things done in parallel' → Fires all 5 → Collects results → Synthesizes into ONE response to the user. NOT for: Human → Agent → 'I'll fire tasks and let you know when they... oh wait, they're already interrupting you mid-sentence.'"

---

## INC-02: delegation-status list view returns empty array with non-zero total

**Severity:** MEDIUM
**Category:** Tool Bug
**Phase 16.3 Decision Relevance:** D-09 (poll/status surfaces as secondary control)

### Evidence

- **Line 746-763:** Agent calls `delegation-status` with `status: "all"`.
- **Response:** `{ "kind": "success", "message": "0 delegation(s) with status \"all\"", "data": [], "metadata": { "total": 6 } }`
- The `metadata.total` field acknowledges 6 delegations exist, but `data` array is empty.

### What Happened

The list/filter logic in `delegation-status` has a mismatch between the total count (which reads from the full delegation registry) and the filtered results (which returns empty for `status: "all"`). The `"all"` status string is not a valid filter value — it should either be omitted (to list all) or the tool should handle `"all"` as a wildcard.

### Impact

Users and agents cannot get a consolidated view of all delegations in a session. They must poll each delegation individually by ID. This is a usability gap for the "delegation briefing" use case (INC-03).

---

## INC-03: No inter-turn delegation awareness across agent instances

**Severity:** HIGH
**Category:** Architecture / Session Continuity
**Phase 16.3 Decision Relevance:** D-04 (surface-specific honesty), D-08 (notification-first)

### Evidence

- **Turn 1 (Agent Instance #1):** Fires 5 delegate-tasks. Stream ends.
- **Turn 2 (Agent Instance #2):** Receives system_reminder about coordinator completion. Has NO context about what was launched or why. User asks about practical workflow — agent responds without referencing the in-flight delegations.
- **Turn 3 (Agent Instance #3):** More system_reminders arrive. Agent still has no delegation manifest. User is confused.
- **LLM self-diagnosis (line 2073-2077):** "delegations are launched in one cognitive context (UAT testing) but resolve in a different cognitive context (workflow design discussion). The LLM doesn't have a persistent 'delegation tracker' running in the background. It has whatever's in the current attention window."

### What Happened

When the front-facing agent's stream ends after firing delegate-tasks, the next agent instance in the same session has **zero awareness** of:
- What delegations were launched
- Their IDs, agents, or purposes
- Their current status (running, completed, timeout)
- Whether results have been retrieved

The harness persists delegation records internally (`.opencode/state/opencode-harness/delegations.json`) but provides no mechanism for the next agent instance to discover or read them.

### Design Flaw

The harness has durable persistence (continuity.ts, delegation-persistence.ts) but no **session-scoped delegation manifest** that:
1. Records which delegations were launched in which conversation turn
2. Is automatically read by the next agent instance at turn start
3. Tracks whether results have been retrieved (`retrieved: false`)
4. Groups delegations by pipeline or purpose

### User's Proposed Solution (line 1863-1926)

The user designed "Approach 2: Delegation Manifest + Turn-Based Handoff":
- Session-scoped manifest file tracking all delegations
- Each turn reads manifest first before responding
- `retrieved` flag prevents double-reporting
- Pipeline categorization gives context

---

## INC-04: Unprocessed delegation results become context poison

**Severity:** MEDIUM
**Category:** Context Management / LLM Behavior
**Phase 16.3 Decision Relevance:** D-10 (human-readable summary + structured metadata)

### Evidence

- **LLM self-report (line 2079-2083):** "The build agent did a race condition analysis. The gsd-code-reviewer did a code quality review. The coordinator researched TypeScript 5.8. I have not read any of these results in full. I saw the truncated summary previews in system reminders — maybe 200 characters each — and moved on."
- **LLM self-report (line 2098-2103):** "Every system_reminder that arrived during a different topic cost attention without providing value in the current context. When I was writing about 'save to disk' workflows and a system reminder about the build agent's race condition analysis arrived, it didn't help the conversation — it just consumed tokens and forced me to acknowledge it."
- **Context layers compressed (line 2086-2096):** "Right now, Layers 1 and 2 feel 'distant' to me. I know they happened. I could summarize them. But the granularity is gone."

### What Happened

Delegation results arrived as system_reminders but were never consumed or synthesized by the agent. They accumulated as "dead weight" in the context window — present but unprocessed. Each new topic shift pushed the delegation results further from active attention.

### Design Flaw

The harness delivers results but has no **consumption tracking**:
- No mechanism to mark results as "read" or "processed"
- No mechanism to force the agent to synthesize results before proceeding
- No mechanism to summarize unprocessed results at turn start

---

## INC-05: Safety ceiling timeout recovery path not demonstrable

**Severity:** LOW
**Category:** Recovery Semantics
**Phase 16.3 Decision Relevance:** D-04 (surface-specific honesty), D-05 (resumable SDK surface)

### Evidence

- **Line 376-387:** Researcher delegation timed out at 120000ms. system_reminder shows `terminalState: "timeout"`, `recoveryGuarantee: "resumable"`.
- **Line 646-664:** delegation-status confirms status: "timeout" with `recoveryGuarantee: "resumable"` and `gracePeriodExpiresAt` present.
- **No resume demonstrated:** The agent never attempted to resume the timed-out delegation. The user asked about practical usage but the agent couldn't show a resume flow.

### What Happened

The safety ceiling mechanism works correctly — it terminates long-running delegations at the configured timeout. The `recoveryGuarantee: "resumable"` field is preserved even after timeout. However, the session never demonstrated the actual resume path:
- No tool or API for resuming a timed-out delegation
- No documentation of how `gracePeriodExpiresAt` relates to resume
- No example of a resumed delegation in the UAT

### Impact

The "resumable" claim is unverified in live UAT. It may be a promise without a delivery mechanism, or the mechanism may exist but wasn't exercised.

---

## INC-06: Stream lifecycle mismatch with delegation lifecycle

**Severity:** HIGH
**Category:** Architecture / Lifecycle
**Phase 16.3 Decision Relevance:** D-08 (notification-first), D-11 (terminal states)

### Evidence

- **User (line 1705):** "front facing launch them background they must not end the stream unless all launched tasks resolved"
- **User (line 1705):** "it is ok for me to receive Queue notification, but the streaming of the front agent must not ended unless all the tasks completed"
- **User (line 1705):** "having any more practical approach to how even when the stream ends, users still know there are tasks running"

### What Happened

The front-facing agent's stream ends immediately after firing delegate-tasks. The delegations continue running in the background. The user has no visibility into:
- Whether tasks are still running
- How many are pending vs completed
- When to expect results

This creates a **lifecycle mismatch**: the conversation lifecycle (stream open → stream close) is decoupled from the delegation lifecycle (dispatched → running → completed). The user experiences this as "the agent left but the work is still happening somewhere I can't see."

### Design Flaw

The harness needs one of:
1. **Stream-holding:** Agent keeps stream open until all delegations resolve
2. **Delegation briefing:** Agent presents delegation status at turn start
3. **Pipeline progress:** User sees pipeline-level progress, not individual task noise

---

## INC-07: Agent role confusion across conversation turns

**Severity:** MEDIUM
**Category:** Context / LLM Behavior
**Phase 16.3 Decision Relevance:** Indirect — affects how delegation results are consumed

### Evidence

- **LLM self-report (line 2108-2111):** "The first turn was clear: I'm an end-user tester executing UAT. By turn 3, I was a product evaluator. By turn 5, I was an architect designing solutions. These are different roles with different contexts."
- **LLM self-report (line 2116-2123):** "Which delegations are 'mine' vs 'the test'? I fired 5 delegations as a TEST. They produced REAL results. Are those results part of the test evidence, or are they useful work product?"

### What Happened

The conversation moved through 4 distinct layers:
1. UAT execution (turns 1-2)
2. Practical evaluation (turns 2-3)
3. Problem diagnosis (turns 3-4)
4. Solution design (turns 5-6)

Each layer shift happened without explicit state transition. The agent had to reconstruct its role from conversation context on each turn, leading to confusion about:
- Whether delegation results were test evidence or useful work
- Whether the agent was testing, evaluating, or designing
- What state the UAT was in (complete? in progress?)

### Design Flaw

This is not a harness bug but a conversation management gap. The harness could help by:
- Providing a session state machine that tracks conversation phases
- Associating delegations with the conversation phase that launched them
- Providing phase-aware delegation briefing

---

## INC-08: No save-to-disk mechanism for delegation results

**Severity:** LOW
**Category:** UX / Feature Gap
**Phase 16.3 Decision Relevance:** D-10 (human-readable summary + structured metadata)

### Evidence

- **User (line 1147):** "what if I want to retrieve back these result to human readable in my local disk?"
- **Agent response (line 1300-1324):** Neither delegate-task nor native task has a built-in "save to file" path. Both require manual poll + write.

### What Happened

The harness persists delegation records internally (`.opencode/state/opencode-harness/delegations.json`) as machine-readable JSON. There is no:
- `delegate-task --save-to-file` option
- Automatic result persistence to human-readable markdown
- Tool or command to export delegation results to disk

### Impact

Users who want to collect delegation results for offline review must manually poll each delegation and write the result to disk. This is a friction point for the "fire and forget" use case.

---

## Cross-Incident Dependencies

```
INC-01 (firehose) ←──┐
                      ├──→ INC-03 (no inter-turn awareness)
INC-06 (lifecycle) ←──┘         │
                                ├──→ INC-04 (context poison)
                                │
INC-02 (list view bug) ←────────┘
                                │
INC-07 (role confusion) ←───────┘
                                │
INC-05 (resume path) ←─────────┘
                                │
INC-08 (save-to-disk) ←────────┘
```

**Root cause cluster:** INC-01, INC-03, INC-06 all stem from the same architectural gap: **no reconciliation layer between delegation lifecycle and conversation lifecycle.** The harness dispatches and tracks delegations correctly but has no mechanism to present them coherently to a human user across conversation turns.

---

## Recommendations for Phase 16.3 Routing

| Priority | Incident | Recommended Action |
|----------|----------|-------------------|
| P0 | INC-01 + INC-03 + INC-06 | Design delegation manifest + turn-based briefing (user's Approach 2) |
| P1 | INC-02 | Fix delegation-status list view filter logic |
| P1 | INC-04 | Add consumption tracking for delegation results |
| P2 | INC-05 | Demonstrate resume path in live UAT |
| P2 | INC-07 | Consider session state machine for conversation phases |
| P3 | INC-08 | Design save-to-file convenience wrapper |

---

## GSD Routing

**Recommended next command:** `/gsd-plan-phase 16.3` — specifically to scope the delegation manifest and notification mediation layer as new plans within the existing phase.

**Alternative:** `/gsd-discuss-phase 16.3 --auto` to surface assumptions about notification delivery before planning.

**Do NOT:** Attempt to fix INC-01/03/06 as isolated bugs. They are a design cluster that requires architectural planning.
