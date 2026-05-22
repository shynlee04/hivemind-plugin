---
name: hm-l3-injection-delivery-patterns
description: Documents 4 notification delivery patterns in the Hivemind engine — Silent Injection, Urgent Notification, Stream Reactivation, and Direct Session Injection/TUI Dispatch. Covers synthetic message injection, TUI queuing, session body injection, and the decision matrix for selecting the correct pattern. Use when implementing notification delivery, delegation state transitions, parent-session context injection, or any inter-session communication inside the harness. NOT for external API notification patterns, webhook delivery, or user-facing notification systems.
metadata:
  layer: "3"
  role: "reference"
  pattern: REFERENCE
  version: "1.0.0"
  context-bomb: true
  requires: Q1-Q6-validation-decisions, D2-D3-23
allowed-tools:
  - Read
  - Grep
  - Glob
consumed-by:
  - hm-l2-coordinating-loop
  - hm-l2-phase-execution
  - hm-l2-debug
---

## Overview

Documents the 4 notification delivery patterns used by the Hivemind engine for inter-session communication, delegation state notification, and system-context injection. All patterns are grounded in the actual OpenCode SDK surfaces (`session.prompt`, `session.promptAsync`, `tui.appendPrompt`, `tui.showToast`) and the Hivemind notification handler at `src/coordination/completion/notification-handler.ts` (after the Phase 23 P23-01 fix).

These patterns solve one core problem: **how to deliver a structured notification from a child session (or background process) to a parent session without corrupting the parent's message history or disrupting the user's interaction flow.**

The key insight is the `synthetic: true` flag on text parts — this tells OpenCode's session tracker and message capture that the message is system-generated, not human-authored. Without `synthetic: true`, notifications are captured as user-role messages, corrupting the session body with what appears to be human input.

**SDK version verified:** `@opencode-ai/sdk` v1.x (TextPartInput.synthetic at `dist/gen/types.gen.d.ts:1235`, SessionPromptData.noReply at `dist/gen/types.gen.d.ts:2252`).

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using SDK `session.prompt` signatures | Steps 2-4 minimum |
| Code review | When verifying `synthetic:true` or `noReply` usage | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on delivery pattern claims | Steps 1-5 full |
| Research | When synthesizing patterns from bundled examples | Steps 4-5 minimum |

---

## The 4 Delivery Patterns

### Pattern 1 — Silent Injection

**Purpose:** Deliver non-terminal notification to parent session body context without expecting or triggering an AI response. Used for status updates, progress notifications, and context enrichment.

**Mechanism:** `synthetic: true` + `noReply: true` → body context injection as `SessionEvent.Synthetic`.

**SDK call:**
```typescript
await sendPrompt(client, parentSessionID, {
  noReply: true,
  parts: [{ type: "text", text: notificationMessage, synthetic: true }],
})
```

**When to use:**
- Non-terminal delegation state transitions (e.g., "delegation started")
- Status updates that the agent can optionally check
- Context enrichment (e.g., metadata injection)
- Periodic progress notifications during long running tasks

**Key behaviors:**
- `synthetic: true` → session tracker at `message-capture.ts:356` already filters these: `.filter((part) => getNestedValue(part, ["synthetic"]) !== true)`. The notification text is delivered to the session but never captured as human-authored content.
- `noReply: true` → SDK does NOT wait for or trigger an assistant response. The prompt is fire-and-forget.
- The `sendPrompt()` wrapper in `session-api.ts:145` casts the body through `SessionPromptRequest["body"]`, which accepts `synthetic?: boolean` on `TextPartInput`.

**Real code from `notification-handler.ts` (after P23-01 fix):**
```typescript
// Line 223-229 in notifyParentSession()
const body = {
  noReply: !isUrgent,    // true for silent (non-urgent)
  parts: [{ type: "text", text: message, synthetic: true }],
}

try {
  await sendPrompt(client, parentSessionID, body)
} catch {
  delivered = false
  queuePendingNotification(parentSessionID, task)
}
```

---

### Pattern 2 — Urgent Notification

**Purpose:** Deliver terminal-state delegation notification (success/failure/cancelled) with immediate agent visibility. Agent sees urgency via TUI prompt, and the notification is also injected as synthetic body context.

**Mechanism:** `appendTuiPrompt()` + `synthetic: true` body context + `noReply: false`.

**SDK calls (two-part delivery):**
```typescript
// Part 1: Append to TUI prompt for immediate agent visibility
await appendTuiPrompt(client, formatToastMessage(task))

// Part 2: Inject into session body as synthetic context
await sendPrompt(client, parentSessionID, {
  noReply: false,  // agent should be aware (but no forced response)
  parts: [{ type: "text", text: buildNotificationMessage(task), synthetic: true }],
})
```

**When to use:**
- Delegation terminal states: `completed`, `failed`, `cancelled`
- Error conditions requiring immediate attention
- Any notification where the agent must know NOW (not when they next poll)

**Key behaviors:**
- `appendTuiPrompt()` displays the notification text in the TUI's prompt input buffer — the agent literally sees it next to the input cursor.
- `showTuiToast()` (optional) provides a toast popup — but toast-only delivery is too easy to miss, which is why the pattern also uses `appendTuiPrompt`.
- The `synthetic: true` body injection ensures the notification is in session context for the session tracker, even if the agent doesn't see the TUI prompt (headless/CI mode).

**Real code from `notification-handler.ts` (after P23-01 fix):**
```typescript
// Line 206-221 in notifyParentSession()
if (isUrgent) {
  // Reactivate stream if needed (D3)
  try {
    await reactivateSessionStream(client, parentSessionID)
  } catch {
    // Best-effort: notification still delivered
  }

  // Urgent: append to TUI prompt so agent sees it immediately
  try {
    if (toastFn) toastFn(formatToastMessage(task))
    await appendTuiPrompt(client, formatToastMessage(task))
  } catch {
    // Best-effort
  }
}
```

**Toast format (`notification-handler.ts:82-93`):**
```typescript
export function formatToastMessage(task: TaskNotification): string {
  const icon = task.status === "started" ? "▶"
    : task.status === "completed" ? "✓"
    : task.status === "failed" ? "✗" : "⊘"
  const duration = task.duration !== undefined ? ` [${formatDuration(task.duration)}]` : ""
  return `${icon} ${task.description} ${task.status} (${task.agent})${duration}`
}
```

---

### Pattern 3 — Stream Reactivation

**Purpose:** Wake up a stopped parent session stream before delivering a notification. Without reactivation, the notification silently fails on stopped streams.

**Mechanism:** Send empty `synthetic: true` prompt to reactivate → THEN deliver notification.

**SDK call:**
```typescript
await sendPrompt(client, sessionID, {
  noReply: true,
  parts: [{ type: "text", text: "", synthetic: true }],
})
```

**When to use:**
- BEFORE any notification delivery to a parent session that may be idle/stopped
- As a wake-up call before Pattern 1 or Pattern 2 delivery
- When resuming from session recovery

**Key behaviors:**
- Empty text + `synthetic: true` + `noReply: true` → does NOT trigger an AI assistant response (per D3 decision).
- Best-effort: if reactivation fails (e.g., session is gone), notification delivery still proceeds.
- This is NOT a notification delivery pattern by itself — it's a prerequisite step.

**Real code from `notification-handler.ts` (after P23-01 fix):**
```typescript
// Lines 104-116
export async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string,
): Promise<void> {
  try {
    await sendPrompt(client, sessionID, {
      noReply: true,
      parts: [{ type: "text", text: "", synthetic: true }],
    })
  } catch {
    // Best-effort: if reactivation fails, notification still delivered
  }
}
```

---

### Pattern 4 — Direct Session Injection / TUI Queue Dispatch

**Purpose:** Two sub-patterns for delivering complex payloads — one for direct SDK dispatch, one for TUI-queued dispatch.

#### 4a — Direct Session Injection

**Mechanism:** `sendPrompt()` with full parts payload — immediate SDK dispatch.

```typescript
// Source: session-api.ts:145-178
await sendPrompt(client, sessionID, {
  noReply: boolean,
  parts: [
    { type: "text", text: "Notification body", synthetic: true },
    { type: "text", text: "Additional content", synthetic: true },
  ],
})
```

**When to use:**
- Complex multi-part payloads
- When you need the `waitForAssistantResponse` fallback in `sendPrompt()`
- Non-TUI hosts (headless/CI) where `appendTuiPrompt` may not be available

#### 4b — TUI Queue Dispatch

**Mechanism:** `appendPrompt + submitPrompt` — queued until current turn completes.

```typescript
// Source: execute-slash-command.ts dispatchPromptAfterToolReturn pattern
function dispatchPromptAfterToolReturn(client, request): void {
  setTimeout(() => {
    void client.session.prompt(request).catch((err) => {
      // Deferred dispatch with error logging
    })
  }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)
}
```

**When to use:**
- User-facing command dispatch that should appear after the current tool response
- Deferred synthetic dispatch where timing matters
- Commands that should not interrupt the current interaction flow

**When NOT to use:**
- For system notifications (use Pattern 1 or Pattern 2 instead)
- When immediate delivery is required

---

## Pattern Comparison Table

| Pattern | Delivery Mechanism | Response Expected | Urgency | Use Case |
|---------|-------------------|-------------------|---------|----------|
| **1 — Silent Injection** | `sendPrompt` + `synthetic: true` + `noReply: true` | No (agent polls) | Low | Status updates, context enrichment, progress |
| **2 — Urgent Notification** | `appendTuiPrompt()` + `sendPrompt` + `synthetic: true` | Yes (agent sees immediately) | High | Delegation terminal states (failed/completed) |
| **3 — Stream Reactivation** | `sendPrompt` + empty synthetic | No (wake only) | N/A | Prerequisite: wake before delivery |
| **4a — Direct Injection** | `sendPrompt()` with full parts | Configurable | Medium | Complex multi-part payloads |
| **4b — TUI Queue** | `appendPrompt` + `submitPrompt` | User action | Immediate | User-facing command dispatch |

## Delivery Mechanism Reference

| Mechanism | SDK Surface | Function | Effect |
|-----------|------------|----------|--------|
| Session prompt | `client.session.prompt()` | `sendPrompt()` in `session-api.ts:145` | Injects text into session body context. Blocks for response unless `noReply: true`. |
| Async session prompt | `client.session.promptAsync()` | `sendPromptAsync()` in `session-api.ts:187` | Fire-and-forget. Returns 204 immediately. Use when the caller should not wait. |
| TUI prompt append | `client.tui.appendPrompt()` | `appendTuiPrompt()` in `session-api.ts:208` | Appends text to the TUI prompt input buffer. Visible to the agent immediately. |
| TUI toast | `client.tui.showToast()` | `showTuiToast()` in `session-api.ts:220` | Shows a compact toast notification in the TUI. Easy to miss — not a primary delivery path. |

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Missing `synthetic: true` on system notifications** | Session tracker captures notification as user-role text → corrupts session body | Always set `synthetic: true` on parts for any system-generated notification. See `notification-handler.ts:225`. |
| **Using `noReply: false` for trivial progress updates** | Every status update triggers an unnecessary AI assistant response | Use `noReply: true` (Pattern 1) for non-terminal updates. Reserve `noReply: false` for terminal-state notifications that the agent should process. |
| **Using `appendTuiPrompt` for non-urgent notifications** | TUI prompt buffer fills with noise → prompts become unreadable | Use `appendTuiPrompt` only for urgent notifications (Pattern 2). Non-urgent updates go through Pattern 1. |
| **Delivering notification without reactivating stream** | Notification silently fails on stopped/ idle streams | Always call `reactivateSessionStream()` (Pattern 3) before Pattern 1 or Pattern 2 delivery when the parent session may be idle. |
| **Direct SDK calls bypassing `sendPrompt()` wrapper** | Missing baseline tracking, type safety, and error handling from `session-api.ts` | Always use the typed `sendPrompt()` wrapper — it provides message count tracking, assistant response fallback, and consistent error handling. |
| **Toast-only delivery for urgent notifications** | Agent may miss the notification — toasts are easy to overlook | Combine `appendTuiPrompt()` with `sendPrompt()` for dual-surface delivery (TUI + session body). |

---

## Self-Correction

### When `synthetic: true` Is Not Working

[Detection] Session tracker captures system notifications as user-role text, or the notification appears in session history as a `## USER (turn N)` entry.

[Recovery] Verify that `synthetic: true` is set on each text part object, not on the body object:
```typescript
// CORRECT — synthetic on the part
{ parts: [{ type: "text", text: message, synthetic: true }] }

// WRONG — synthetic on the body does nothing
{ synthetic: true, parts: [{ type: "text", text: message }] }
```
Also verify `synthetic` property name matches SDK casing (check `TextPartInput` in `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`).

### When `noReply` Behavior Is Wrong

[Detection] Agent receives unwanted assistant responses for status updates, or urgent notifications don't trigger awareness.

[Recovery] Check the `noReply` value:
- `noReply: true` → silent, fire-and-forget. No assistant response.
- `noReply: false` → SDK may trigger an assistant response. Use for terminal-state notifications only.
- The `sendPrompt()` wrapper at `session-api.ts:148` overloads `noReply` at the body level: `...(noReply !== undefined ? { noReply } : {})`.

### When TUI Append Fails Silently

[Detection] Urgent notifications (Pattern 2) don't appear in the TUI prompt, but the session body injection succeeds.

[Recovery] Verify the host supports TUI operations: `client.tui.appendPrompt` may not be available on headless/CI hosts. The current code wraps this in try/catch — rely on Pattern 1's body injection for headless mode. `appendTuiPrompt` uses `unwrapData(await client.tui.appendPrompt(...))` — check if the SDK call throws or the response format changed.

### When Stream Reactivation Fails

[Detection] Notifications are not delivered to parent sessions. The `reactivateSessionStream` call does not throw (caught silently) but notification delivery also fails.

[Recovery] Verify the parent session ID is valid and the session still exists. If the session is fully destroyed (not just stopped), reactivation cannot succeed. In this case, the notification is queued via `queuePendingNotification()` for later replay when the session resumes. Check `session-continuity.json` for pending notifications.

---

## Cross-References

| Resource | Purpose |
|----------|---------|
| `hm-l3-hivemind-engine-contracts` | SDK integration context, plugin load order, tool registration contracts |
| `hm-l3-tool-surface-documentation` | Tool surface patterns for cross-referencing notification tool surfaces |
| `src/coordination/completion/notification-handler.ts` | Concrete implementation of all 4 patterns (after P23-01 fix) |
| `src/shared/session-api.ts` | `sendPrompt`, `sendPromptAsync`, `appendTuiPrompt`, `showTuiToast` wrappers |
| `src/features/session-tracker/capture/message-capture.ts` | `synthetic: true` filter at line 356 — verifies synthetic messages are excluded from human-text capture |
| `src/tools/session/execute-slash-command.ts` | `dispatchPromptAfterToolReturn` pattern at lines 278-288 (TUI queue dispatch) |
| `references/injection-patterns-catalog.md` | Expanded catalog of all injection patterns with code examples |
| `references/delivery-mechanisms.md` | Low-level comparison of delivery mechanisms with OpenCode SDK types |
| `23-CONTEXT.md` | Locked decisions D2 (urgent notification), D3 (stream reactivation) |
| `23-RESEARCH.md` | SDK type verification, code change points, ecosystem pattern analysis |

**Source verification:** All patterns verified against `src/coordination/completion/notification-handler.ts`, `src/shared/session-api.ts`, `src/features/session-tracker/capture/message-capture.ts` (2026-05-23).
**SDK version:** `@opencode-ai/sdk` v1.x — `TextPartInput.synthetic` confirmed at `dist/gen/types.gen.d.ts:1235`, `SessionPromptData.noReply` at `dist/gen/types.gen.d.ts:2252`.
**Q1-Q6 Validation:** Hivemind-convention compliant — CQRS boundaries preserved (tools own mutation, hooks observe). State root references `.hivemind/` not `.opencode/`.
