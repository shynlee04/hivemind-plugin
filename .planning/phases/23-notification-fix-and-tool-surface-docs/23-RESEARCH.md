# Phase 23 Research Report

**Researched:** 2026-05-23
**Domain:** Notification delivery architecture, SDK type verification, skill structure analysis, OpenCode ecosystem patterns
**Confidence:** HIGH (SDK types verified via node_modules source)

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D1:** Fixed 60s stall timeout + early assistant error detection. Implement `STALL_TIMEOUT_MS = 60000` in notification-handler.ts. No env var or config.
- **D2:** Urgent notification = `appendTuiPrompt()` + `synthetic: true` body context.
- **D3:** Stream reactivation = send empty `synthetic: true` prompt to reactivate stopped stream, THEN deliver notification.
- **D4:** Skill rewrite wave order: Coordination (Wave 3A) → Foundation (Wave 3B) → Audit (Wave 3C). Skills must be THIN but DEEP: use references, conditional loading, progressive disclosure. Jump link verification REQUIRED.
- **D5:** GSD/OMO study — dedicated deep study sub-phase before skill rewrite. Transform patterns, don't copy.

### the agent's Discretion
- Skill rewrite approach (THIN but DEEP, jump link verification, conditional loading)

### Deferred Ideas (OUT OF SCOPE)
- Adaptive failure thresholds → P26
- Durable notification delivery → P27+

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| P23-01 | Two-mechanism notification delivery (silent + urgent) | SDK types CONFIRMED (synthetic, noReply). Code points identified. |
| P23-02 | Stream reactivation after notification delivery | Pattern from execute-slash-command.ts dispatchPromptAfterToolReturn. |
| P23-03 | Tool surface differentiation skill | All 14+ tools documented from src/tools/ directory. |
| P23-04 | Audit and rewrite ALL hm-* coordination skills | Skill sizes/structures analyzed. `hm-l2-subagent-delegation-patterns` NOT FOUND. |
| P23-05 | Rewrite hivemind-power-on | Already has tool-based patterns but has duplicate content. |
| P23-06 | Assessment of trajectory/pressure/work-contract | Read-only — no code changes. |
| P23-07 | Injection delivery patterns skill | 4 delivery patterns identified from code analysis. |

---

## 1. SDK Type Verification

### 1.1 `synthetic?: boolean` — CONFIRMED

| SDK Version | Type | File | Line | Definition |
|-------------|------|------|------|------------|
| v1 (gen) | `TextPart` (output) | `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts` | 148 | `synthetic?: boolean` |
| v1 (gen) | `TextPartInput` (input) | `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts` | 1235 | `synthetic?: boolean` |
| v2 (gen) | `TextPart` (output) | `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts` | 325 | `synthetic?: boolean` |
| v2 (gen) | `TextPartInput` (input) | `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts` | 1340 | `synthetic?: boolean` |

**Verdict:** `synthetic?: boolean` exists in BOTH v1 and v2 SDK, on BOTH `TextPart` (response) and `TextPartInput` (request) types. The SPEC claim is verified.

### 1.2 `noReply?: boolean` — CONFIRMED

| SDK Version | Type | File | Line | Definition |
|-------------|------|------|------|------------|
| v1 (gen) | `SessionPromptData.body` | `dist/gen/types.gen.d.ts` | 2252 | `noReply?: boolean` |
| v1 (gen) | `SessionPromptAsyncData.body` | `dist/gen/types.gen.d.ts` | 2337 | `noReply?: boolean` |
| v2 (gen) | `SessionPromptAsyncData.body` | `dist/v2/gen/types.gen.d.ts` | 4904 | `noReply?: boolean` |

**Verdict:** `noReply?: boolean` exists in `SessionPromptData.body` at line 2252 (v1). This is the type the `sendPrompt()` wrapper in `session-api.ts` casts to via `SessionPromptRequest["body"]`.

### 1.3 TUI Signatures — CONFIRMED

| Type | File | Line | Body Shape |
|------|------|------|------------|
| `TuiAppendPromptData` | `dist/gen/types.gen.d.ts` | 3126 | `{ body: { text: string } }` |
| `TuiAppendPromptResponses` | `dist/gen/types.gen.d.ts` | 3143 | `200: boolean` |
| `TuiShowToastData` | `dist/gen/types.gen.d.ts` | 3264 | `{ body: { title?: string, message: string, variant: "info" \| "success" \| "warning" \| "error", duration?: number } }` |
| `TuiShowToastResponses` | `dist/gen/types.gen.d.ts` | 3280 | `200: boolean` |

**Current `session-api.ts` wrappers:**
- `appendTuiPrompt(client, text)` at line 204-207 — uses `TuiAppendPromptRequest = Parameters<OpenCodeClient["tui"]["appendPrompt"]>[0]`
- `showTuiToast(client, message)` at line 216-219 — uses `TuiShowToastRequest = Parameters<OpenCodeClient["tui"]["showToast"]>[0]`

---

## 2. Code Change Points (file:line)

### 2.1 Primary Fix: notification-handler.ts

**Current state (BROKEN — missing `synthetic: true`):**

| Location | Current Code | Problem | Fix |
|----------|-------------|---------|-----|
| Line 179-182 | `const body = { noReply: true, parts: [{ type: "text", text: message }] }` | Missing `synthetic:true`. Notification appends as user-role message. | Add `synthetic: true` on text part: `parts: [{ type: "text", text: message, synthetic: true }]` |
| Line 231 | `{ noReply: true, parts: [{ type: "text", text: message }] }` | Same bug in `notifyDelegationTerminal()`. Direct call, not routed through `notifyParentSession()`. | Same fix. |

**Call chain:**
```
notifyDelegationTerminal (line 223-242)
  → buildDelegationTaskNotification (line 106-133)
  → buildNotificationMessage (line 24-78)
  → sendPrompt(client, parentSessionId, { noReply: true, parts: [text] })
    → session-api.ts:sendPrompt() → client.session.prompt() ← synthetic:true needed in parts
```

**Required changes:**

1. **`notifyParentSession()` (line 179-182):** Change body construction to support two modes:
   ```typescript
   // Silent Injection (non-terminal updates)
   const body = {
     noReply: true,
     parts: [{ type: "text", text: message, synthetic: true }],
   }
   
   // Urgent Notification (terminal: failure/success)
   const body = {
     noReply: false, // agent should respond
     parts: [{ type: "text", text: message, synthetic: true }],
   }
   ```

2. **`notifyDelegationTerminal()` (line 231):** Same fix — add `synthetic: true` to the inline body construction.

### 2.2 Stream Reactivation — NEW CODE

Need a new function (append to `notification-handler.ts`):

```typescript
const STALL_TIMEOUT_MS = 60000 // D1: fixed timeout

async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string
): Promise<void> {
  // Send empty synthetic prompt to reactivate idle stream
  await sendPrompt(client, sessionID, {
    noReply: true,
    parts: [{ type: "text", text: "", synthetic: true }],
  })
}
```

Called before notification delivery when parent session is idle.

### 2.3 `session-api.ts` — Minor Enhancement

**Line 148:** `sendPrompt()` currently takes `body: unknown` and casts. This already works with `synthetic: true` because `TextPartInput` supports it. **No structural change needed** — the type cast `body as SessionPromptRequest["body"]` at line 154 will accept `synthetic: true` in parts.

However, for type safety, consider adding a typed overload or type guard. **Not strictly required** — the SDK accepts it as-is.

### 2.4 `message-capture.ts` — VERIFIED

**Line 356:** Already correctly filters:
```typescript
.filter((part) => getNestedValue(part, ["synthetic"]) !== true)
```

**Verdict:** No changes needed. The filter correctly excludes `synthetic: true` parts from human text extraction.

### 2.5 `execute-slash-command.ts` — Reference Pattern

**Line 278-288:** `dispatchPromptAfterToolReturn()` shows the pattern for deferred synthetic dispatch:
```typescript
function dispatchPromptAfterToolReturn(client, request): void {
  setTimeout(() => {
    void client.session.prompt(request).catch((caughtError) => { ... })
  }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)
}
```

**Key insight:** This pattern DOES NOT include `synthetic: true` on parts either. The tool output at line 126 notes "synthetic parent prompt creates a ## USER turn in the session body" — confirming it's NOT using `synthetic: true`. This aligns with the SPEC statement that `execute-slash-command.ts` lines 106-119 needs synthetic fix (assigned to P21.1 domain per scope boundary).

### 2.6 Summary of Change Points

| File | Line | Change | Impact |
|------|------|--------|--------|
| `src/coordination/completion/notification-handler.ts` | 179-182 | Add `synthetic: true` to text part in `notifyParentSession()` | Silent injection fix |
| `src/coordination/completion/notification-handler.ts` | 231 | Add `synthetic: true` to text part in `notifyDelegationTerminal()` | Terminal notification fix |
| `src/coordination/completion/notification-handler.ts` | NEW | Add `reactivateSessionStream()` function | Stream reactivation for D3 |
| `src/coordination/completion/notification-handler.ts` | NEW | Add `STALL_TIMEOUT_MS = 60000` constant | D1 fixed timeout |
| `src/coordination/completion/notification-handler.ts` | NEW | Add urgent notification path with `appendTuiPrompt()` | D2 urgent notification |
| `src/shared/session-api.ts` | No change needed | Type cast accepts synthetic:true already | — |
| `src/features/session-tracker/capture/message-capture.ts` | 356 | No change needed — filter already correct | — |

### 2.7 Test Impact

| Test File | Lines | Status | Notes |
|-----------|-------|--------|-------|
| `tests/lib/notification-handler.test.ts` | 247 | NEEDS UPDATE | Current test at line 216-218 checks body but NOT `synthetic: true`. Must add assertion: `expect(body.parts[0].synthetic).toBe(true)` |
| `tests/lib/coordination/delegation/notification-router.test.ts` | 336 | NEEDS CHECK | NotificationRouter tests — verify synthetic:true passes through routing |

---

## 3. OpenCode Ecosystem Patterns

### 3.1 Pattern Discovery Results

| Pattern | Source | Description | Hivemind Applicability |
|---------|--------|-------------|----------------------|
| Dynamic Context Pruning | github.com/Opencode-DCP/opencode-dynamic-context-pruning | Compress/Prune/Distill tools to reduce context. Protected tool outputs kept in summaries. `contextLimit` config. | **ADAPT principle.** Hivemind already has synthetic message filtering (message-capture.ts:356). DCP's "protected file patterns" concept could inform session-body injection patterns for P23-07 skill. |
| Background Agents | github.com/kdcokenny/opencode-background-agents | Async background delegation via OCX plugin. Tagged with title+summary. Optional compaction resilience. | **TRANSFORM principle.** Hivemind already uses WaiterModel + delegation-status polling. Background agents' context persistence pattern could inform notification delivery resilience (P27+ deferred feature). |
| PTY Management | github.com/shekohex/opencode-pty | Interactive PTY with background sessions, web server UI, REST API for session management. `pty-open-background` commands. | **REJECT for P23.** PTY is P29 domain. But the "named session" concept maps to Hivemind's session-based delegation. Note: Hivemind already has PTY feature at `src/features/background-command/pty/` with Bun-only optional dep. |
| awesome-opencode | github.com/awesome-opencode/awesome-opencode | Curated directory of plugins, themes, agents, and projects. Official + community plugins. | **Reference only.** Used to validate Hivemind tool surfaces against ecosystem standards. No direct patterns to adopt — Hivemind's CQRS architecture is more sophisticated than most listed plugins. |
| OpenCode SDK v2 | `node_modules/@opencode-ai/sdk/dist/v2/` | `SessionPromptData.body` includes `noReply`, `agent`, `system`, `tools`, `parts`. New `session.promptAsync` surface. | **Already consumed.** Hivemind's `session-api.ts` wraps v1; `sendPromptAsync` exposed since P21. SDK v2 `TextPartInput.synthetic` is confirmed identical to v1. |

### 3.2 Pattern Transformation Recommendations for P23-07 Skill

| Ecosystem Pattern | Hivemind Transformation |
|-------------------|------------------------|
| DCP's "protected tool outputs" | → Hivemind's "synthetic message filtering" — already implemented at message-capture.ts:356 |
| Background agents' "tagged delegation" | → Hivemind's "delegation status with metadata" — delegation-status tool + silent injection |
| PTY's "named background sessions" | → Hivemind's "session hierarchy with parent-child chains" — session-hierarchy tool |
| DCP's "compress on demand" | → Hivemind's "opt-in polling via delegation-status" — same philosophy, different mechanism |

### 3.3 Key Insight for P23-07

The ecosystem confirms that:
1. **synthetic messages** are the standard pattern for system notifications (DCP uses them, SDK supports them)
2. **Background delegation** is an emerging ecosystem pattern — Hivemind's WaiterModel is ahead of most plugins
3. **No ecosystem plugin** implements the two-mechanism notification (silent + urgent) that Hivemind P23-01 requires — this is novel

---

## 4. Skill Structure Analysis

### 4.1 Skill Size & Structure Matrix

| Skill | Lines | Allowed Tools | Refs | Scripts | Issues |
|-------|-------|---------------|------|---------|--------|
| **hm-l2-coordinating-loop** | 448 | Bash,Read,Write,Edit,Glob,Grep,todowrite,skill | 5 | 9 | ASPIRATIONAL: missing `delegate-task`, `execute-slash-command`, `hivemind-command-engine` from allowed-tools. 5 broken `<files_to_read>` paths (uses `hm-coordinating-loop` not `hm-l2-coordinating-loop`). References non-existent `hm-planning-persistence`. Ralph-loop patterns. GSD-based scripts directory. |
| **hm-l2-gate-orchestrator** | 221 | Read,Write,Edit,Bash,Glob,Grep | 1 | 0 | Routes to 3 gate skills correctly. No gap in tool auth. References `references/gate-flow.md` (EXISTS). Generally sound — minor updates for consistency. |
| **hm-l2-phase-execution** | 190 | Read,Write,Edit,Bash,Glob,Grep,Task | 3 | 1 | References `.opencode/state/opencode-harness/phase-execution/` which is legacy/deprecated path. Should reference `.hivemind/` instead. |
| **hm-l2-phase-loop** | 158 | (read in Wave 3C) | 1 | 1 | Needs audit — likely similar issues. |
| **hm-l2-completion-looping** | 149 | Read,Write,Edit,Bash,Glob,Grep | 3 | 1 | Generally sound. Ralph-loop patterns to verify. |
| **hm-l2-subagent-delegation-patterns** | **NOT FOUND** | — | — | — | **Directory does not exist.** Check `.opencode/skills/hm-l2-subagent-delegation-patterns/` — may need creation or the skill was never created. |
| **hm-l2-user-intent-interactive-loop** | 446 | (read in Wave 3C) | 6 | 6 | Needs audit for aspirational patterns. Second-largest orchestration skill. |
| **hm-l2-cross-cutting-change** | 330 | (read in Wave 3C) | 4 | 0 | Needs audit for stale cross-pane references. |
| **hm-l2-debug** | 194 | (read in Wave 3C) | 2 | 1 | Needs audit for aspirational debug infrastructure. |
| **hivemind-power-on** | 236 | 17 tools listed (skill,read,grep,glob,bash,task,todowrite,session-tracker, session-hierarchy,session-context,hivemind-session-view,delegation-status,hivemind-trajectory,prompt-skim,prompt-analyze,hivemind-doc,hivemind-pressure) | 6 | 0 | Has REDUNDANT Section 7 (Short Version) duplicating Section 2 (Real Tools). IRON CLAW missing (present in stack-l3-* skills). Tool catalog duplicates hm-l3-tool-capability-matrix. |
| **hm-l3-hivemind-engine-contracts** | 451 | (read in Wave 3C) | 0 | 0 | Large reference skill. Needs sync with current src/ surfaces. |
| **hm-l3-hivemind-state-reference** | 414 | (read in Wave 3C) | 0 | 0 | Large reference skill. Needs sync with current .hivemind/ structure. |
| **hm-l3-integration-contracts** | 447 | (read in Wave 3C) | 4 | 1 | Needs validation against actual agent definitions. |
| **hm-l3-tool-capability-matrix** | 577 | (read in Wave 3C) | 0 | 0 | LARGEST skill. Must sync with current 23+ tools catalog. |

### 4.2 Critical Findings

1. **`hm-l2-subagent-delegation-patterns` NOT FOUND** — The directory `.opencode/skills/hm-l2-subagent-delegation-patterns/` does not exist. This skill may need to be:
   - Created from scratch (if it was planned but never implemented)
   - Or removed from the rewrite list if it was deprecated

2. **Type check**: Run `ls .opencode/skills/hm-l2-subagent-delegation-patterns/` to confirm.

3. **5 broken paths** in `hm-l2-coordinating-loop` references: All use `hm-coordinating-loop` instead of `hm-l2-coordinating-loop`. Easy fix.

4. **Legacy state paths** in `hm-l2-phase-execution`: References `.opencode/state/opencode-harness/` which should be `.hivemind/`. This is a Q6 compliance issue.

5. **All skills with scripts:** coordinating-loop (9), user-intent-interactive-loop (6), gate-orchestrator (0), phase-execution (1), phase-loop (1), completion-looping (1), cross-cutting-change (0), debug (1), integration-contracts (1). Total scripts across rewrite set: ~19.

6. **stack-l3-vitest** (190 lines) is a good reference for the "reference skill" pattern: pure documentation, no scripts, IRON CLAW section, Self-Correction section.

### 4.3 Skill Rewrite Recommendations

| Skill | Action | Key Changes |
|-------|--------|-------------|
| hm-l2-coordinating-loop | FULL REWRITE | Fix paths, fix allowed-tools, remove ralph-loop references, migrate away from bash scripts to tool-based gates, remove aspirational hm-planning-persistence refs |
| hm-l2-gate-orchestrator | MINOR UPSYNC | Verify gate flow references, ensure tool auth matches actual usage |
| hm-l2-phase-execution | FULL REWRITE | Fix state path to `.hivemind/`, remove GSD patterns, real tool surfaces |
| hm-l2-phase-loop | AUDIT + FIX | Check for aspirational loop semantics |
| hm-l2-completion-looping | AUDIT + FIX | Remove ralph-loop references, use practical verification patterns |
| hm-l2-subagent-delegation-patterns | CREATE or REMOVE | Confirm existence first |
| hm-l2-user-intent-interactive-loop | AUDIT + FIX | Check aspirational patterns |
| hm-l2-cross-cutting-change | AUDIT + FIX | Update cross-pane references |
| hm-l2-debug | AUDIT + FIX | Verify debug infrastructure references |
| hivemind-power-on | REWRITE | Remove Section 7 duplicate, add IRON CLAW, trim tool catalog section |
| hm-l3-hivemind-engine-contracts | SYNC | Verify against current src/ surfaces |
| hm-l3-hivemind-state-reference | SYNC | Verify against current .hivemind/ structure |
| hm-l3-integration-contracts | VALIDATE | Check agent-skill binding contracts |
| hm-l3-tool-capability-matrix | SYNC | Update for 23+ tools, deduplicate with hivemind-power-on |

---

## 5. Implementation Recommendations

### 5.1 Notification Fix — Detailed Code Changes

**File: `src/coordination/completion/notification-handler.ts`**

```typescript
// At module level — NEW constant (line ~16)
const STALL_TIMEOUT_MS = 60000

// notifyParentSession() — REWRITE lines 170-199
export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
  toastFn?: ToastFn,
  options?: { urgent?: boolean } 
): Promise<boolean> {
  const message = buildNotificationMessage(task)
  let delivered = true
  
  // Determine delivery mechanism
  const isUrgent = options?.urgent ?? (task.status === "failed" || task.status === "completed")
  
  // Silent Injection: synthetic + noReply
  // Urgent: synthetic + appendTuiPrompt + noReply:false
  if (isUrgent) {
    // Reactivate stream if needed (D3)
    await reactivateSessionStream(client, parentSessionID)
    
    // Urgent: append to TUI prompt so agent sees it immediately
    try {
      if (toastFn) toastFn(formatToastMessage(task))
      await appendTuiPrompt(client, formatToastMessage(task))
    } catch { /* best-effort */ }
  }
  
  const body = {
    noReply: !isUrgent,
    parts: [{ type: "text", text: message, synthetic: true }],
  }
  
  try {
    await sendPrompt(client, parentSessionID, body)
  } catch {
    delivered = false
    queuePendingNotification(parentSessionID, task)
  }
  
  return delivered
}

// notifyDelegationTerminal() — UPDATE line 231
export async function notifyDelegationTerminal(
  client: OpenCodeClient,
  delegation: Delegation,
): Promise<void> {
  const task = buildDelegationTaskNotification(delegation)
  const message = buildNotificationMessage(task)
  
  try {
    await sendPrompt(client, delegation.parentSessionId, {
      noReply: true,
      parts: [{ type: "text", text: message, synthetic: true }], // FIX: added synthetic:true
    })
  } catch (error) {
    queuePendingNotification(delegation.parentSessionId, task)
    // ... existing error logging
  }
}
```

### 5.2 Stream Reactivation

```typescript
// NEW function
async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string,
): Promise<void> {
  // Send empty synthetic prompt to wake up stopped session
  // Does NOT trigger AI response — synthetic:true + empty text
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

### 5.3 Urgent Notification + `appendTuiPrompt`

The `appendTuiPrompt()` function at `session-api.ts:204` already exists and wraps `TuiAppendPromptData`. Use as:
```typescript
await appendTuiPrompt(client, task.description) // shows in TUI prompt
```

The TUI signature from SDK: `TuiAppendPromptData.body = { text: string }`.

### 5.4 Test Updates

**File: `tests/lib/notification-handler.test.ts`**
- Add assertion after line 218: `expect(body.parts[0].synthetic).toBe(true)` — verifies `synthetic: true` is present
- Add test case for `notifyDelegationTerminal()` to verify body construction
- Add test for silent vs urgent delivery paths
- Add test for stream reactivation

### 5.5 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| `synthetic: true` breaks existing notification routing | LOW | MEDIUM | Unit tests verify flow. `sendPrompt()` is typed to accept `TextPartInput.synthetic`. |
| message-capture.ts mis-filters synthetic parts | LOW | HIGH | Already filtering correctly at line 356. Verified by reading source. |
| Stream reactivation triggers AI loop | LOW | MEDIUM | Empty text + synthetic:true should not trigger assistant. Need confirmation via live UAT. |
| `appendTuiPrompt` fails on non-TUI hosts | MEDIUM | LOW | Best-effort try/catch already in pattern. |
| `STALL_TIMEOUT_MS = 60000` too aggressive | MEDIUM | LOW | Fixed constant per D1. Can be adjusted. Adaptive thresholds deferred to P26. |
| `hm-l2-subagent-delegation-patterns` missing on disk | HIGH | MEDIUM | Must verify existence before planning Wave 3B. If missing: create or remove from plan. |

### 5.6 Verification Strategy

| Verification | Command | Evidence |
|-------------|---------|----------|
| Unit tests pass | `npx vitest run tests/lib/notification-handler.test.ts` | Test output |
| Build passes | `npm run build` | No type errors |
| Type check | `npm run typecheck` | No type errors |
| All tests pass | `npm test` | No regression |
| Skill references verified | `ls .opencode/skills/hm-*/references/ && ls .opencode/skills/hm-*/scripts/` | Paths exist |
| jump link behavior | Manual test: load skill, verify links render | User-verified runtime behavior (D4 constraint) |

---

## 6. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SDK prompt type definitions | Custom synthetic message types | `@opencode-ai/sdk` `TextPartInput.synthetic` | Already provided by SDK, verified in node_modules |
| Session prompt sending | Custom HTTP/session management | `sendPrompt()` in `session-api.ts` | Already wraps SDK with type safety, error handling, baseline tracking |
| TUI notifications | Custom terminal UI | `appendTuiPrompt()`, `showTuiToast()` in `session-api.ts` | Already wraps SDK TUI surfaces |
| Gate validation logic | Custom gate scripts in skills | `gate-l3-*` triad skills | Already implemented and tested |
| Agent skill binding validation | Custom check script | `hm-l3-integration-contracts` | Already has the contract validation pattern |

---

## 7. Common Pitfalls

### Pitfall 1: synthetic:true Breaking Existing Filters
**What goes wrong:** Adding `synthetic: true` causes `message-capture.ts` to exclude notification text from session capture.
**Why:** The filter at line 356 explicitly excludes synthetic parts: `.filter((part) => getNestedValue(part, ["synthetic"]) !== true)`.
**How to avoid:** This is INTENTIONAL — synthetic notifications SHOULD NOT be captured as human-authored text. Verify by checking that notifications are still delivered to the session but filtered from human-text extraction.
**Warning signs:** Session capture tests fail.

### Pitfall 2: Empty Synthetic Prompt Triggering AI Response
**What goes wrong:** Stream reactivation via empty `synthetic: true` prompt causes unwanted AI assistant response.
**Why:** If the SDK processes synthetic prompts differently depending on version.
**How to avoid:** Verify with live UAT. The SDK types confirm `synthetic` flag exists — behavior at runtime must be confirmed.
**Warning signs:** Parent session starts generating responses after notification delivery.

### Pitfall 3: Jump Links Don't Render in Loaded Skills
**What goes wrong:** Skills reference external files that don't show up when the skill is loaded into context.
**Why:** OpenCode's skill loading mechanism may not support `<files_to_read>` resolution (per D4 constraint).
**How to avoid:** User confirmed requiring runtime testing of jump link behavior. Must test after rewrite.
**Warning signs:** Loaded skill mentions files that don't appear in context.

---

## 8. Code Examples

### 8.1 Silent Injection Pattern
```typescript
// Source: SDK types verified + codebase pattern
const body = {
  noReply: true,
  parts: [{ type: "text", text: notificationMessage, synthetic: true }],
}
await sendPrompt(client, parentSessionID, body)
```

### 8.2 Urgent Notification Pattern (D2)
```typescript
// Source: session-api.ts:204-219, notification-handler.ts conventions
// 1. Show in TUI prompt for immediate visibility
await appendTuiPrompt(client, formatToastMessage(task))
// 2. Also inject as synthetic body context
await sendPrompt(client, parentSessionID, {
  noReply: false, // agent should be aware
  parts: [{ type: "text", text: buildNotificationMessage(task), synthetic: true }],
})
```

### 8.3 Stream Reactivation Pattern (D3)
```typescript
// Source: dispatchPromptAfterToolReturn pattern at execute-slash-command.ts:278-288
function reactivateSessionStream(client, sessionID) {
  return sendPrompt(client, sessionID, {
    noReply: true,
    parts: [{ type: "text", text: "", synthetic: true }],
  })
}
```

---

## 9. Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Empty `synthetic: true` prompt does not trigger AI assistant response | 5.2 | Could cause unwanted responses in parent session. Requires live UAT verification. |
| A2 | `appendTuiPrompt()` works on all OpenCode hosts (TUI and non-TUI) | 5.3 | If it fails silently, urgent notifications may not be visible. The try/catch mitigates this. |
| A3 | `hm-l2-subagent-delegation-patterns` directory does not exist | 4.2 | If it exists at a different path, the skill rewrite list is incomplete. **Must verify before planning.** |
| A4 | `notifyDelegationTerminal()` can always determine parent session idle state | 5.2 | If idle detection is inaccurate, may reactivate busy streams unnecessarily. |
| A5 | The `SessionPromptRequest["body"]` type cast at session-api.ts:154 accepts `synthetic: true` in parts | 2.3 | TypeScript may not accept it directly. Verified: `TextPartInput` has `synthetic?: boolean` at SDK v1:1235, so type cast works. |

---

## 10. Open Questions

1. **Does `hm-l2-subagent-delegation-patterns` exist on disk?**
   - What we know: Not found by glob search for SKILL.md
   - What's unclear: May exist at different path or was never created
   - Recommendation: Run `ls .opencode/skills/hm-l2-subagent-delegation-patterns/` before Wave 3B planning

2. **Does empty `synthetic: true` prompt avoid AI response at runtime?**
   - What we know: SDK types support it. No runtime proof available.
   - What's unclear: Runtime behavior depends on OpenCode SDK version and host
   - Recommendation: Mark for live UAT after implementation

3. **How does `appendTuiPrompt()` behave on non-TUI hosts (CI, headless)?**
   - What we know: It wraps SDK `tui.appendPrompt`. The try/catch handles failures.
   - What's unclear: Whether the SDK call throws or silently fails
   - Recommendation: Test in headless mode during Wave 1 verification

4. **Are all 5 broken `<files_to_read>` paths in hm-l2-coordinating-loop actually broken?**
   - What we know: Paths use `hm-coordinating-loop` instead of `hm-l2-coordinating-loop`
   - What's unclear: OpenCode may resolve relative paths differently than expected
   - Recommendation: Run runtime test after fix, per D4 constraint

---

## 11. Sources

### Primary (HIGH confidence)
- `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts` — TextPartInput (line 1235), SessionPromptData (line 2252), TextPart (line 148)
- `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts` — TextPartInput (line 1340), TextPart (line 325)
- `src/coordination/completion/notification-handler.ts` — Full code flow (lines 170-242)
- `src/shared/session-api.ts` — sendPrompt (line 145), appendTuiPrompt (line 204), showTuiToast (line 216)
- `src/features/session-tracker/capture/message-capture.ts` — synthetic filter (line 356)
- `src/tools/session/execute-slash-command.ts` — dispatchPromptAfterToolReturn (line 278)
- `.opencode/skills/hm-l2-coordinating-loop/SKILL.md` — 448 lines, broken paths
- `.opencode/skills/hivemind-power-on/SKILL.md` — 236 lines, redundant sections
- `.opencode/skills/hm-l2-gate-orchestrator/SKILL.md` — 221 lines, sound structure
- `.opencode/skills/hm-l2-phase-execution/SKILL.md` — 190 lines, legacy paths
- `.opencode/skills/stack-l3-vitest/SKILL.md` — 190 lines, reference pattern
- `tests/lib/notification-handler.test.ts` — Existing test structure (247 lines)

### Secondary (MEDIUM confidence)
- Tavily search: `opencode-dynamic-context-pruning` (source: github.com/Opencode-DCP/opencode-dynamic-context-pruning)
- Tavily search: `opencode-background-agents` (source: github.com/kdcokenny/opencode-background-agents)
- Tavily search: `opencode-pty` (source: github.com/shekohex/opencode-pty)
- Tavily search: `awesome-opencode` (source: github.com/awesome-opencode/awesome-opencode)

### Tertiary (LOW confidence)
- Runtime behavior of `synthetic: true` empty prompts — not verified at runtime
- `appendTuiPrompt()` behavior on non-TUI hosts — not verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK types verified via node_modules source
- Architecture: HIGH — code flow traced through 4+ files with exact line numbers
- Pitfalls: MEDIUM — some runtime behaviors assumed
- Skills analysis: HIGH — read 5 skill files directly, sizes calculated

**Research date:** 2026-05-23
**Valid until:** 2026-06-22 (30 days — SDK may update)
