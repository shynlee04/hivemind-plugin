# Functional Code Audit — 2026-04-06

**Scope:** Every `.ts` file in `src/`. Does the code work? Does it create noise? Does it block agent workflows? Is it genuinely superior to OpenCode built-in?

**Verdict: 13 PASS, 6 NEEDS FIX, 3 FAIL**

---

## Pass/Fail Matrix

| Module | Works | Noise | Blocks | vs Built-in | Verdict |
|--------|-------|-------|--------|-------------|---------|
| `lib/types.ts` | ⚠️ deceptive type | Low | No | **Superior** — OpenCode has no delegation types | **NEEDS FIX** |
| `lib/task-status.ts` | ✅ | None | No | **Superior** — OpenCode has no state machine | **PASS** |
| `lib/state.ts` | ✅ | None | No | **Superior** — OpenCode has no budget tracking | **PASS** |
| `lib/helpers.ts` | ✅ | ⚠️ empty REQUIRED TOOLS | No | **Superior** — SDK unwrapping, loop detection, prompt building | **PASS** |
| `lib/runtime.ts` | ✅ | None | No | **Superior** — event normalization OpenCode doesn't provide | **PASS** |
| `lib/session-api.ts` | ✅ | None | No | **Superior** — typed SDK wrappers, parent chain walking | **PASS** |
| `lib/concurrency.ts` | ✅ | None | No | **Superior** — OpenCode has no concurrency control | **PASS** |
| `lib/completion-detector.ts` | ✅ | None | No | **Superior** — OpenCode has no completion detection | **PASS** |
| `lib/notification-handler.ts` | ✅ | None | No | **Superior** — OpenCode has no parent notification | **PASS** |
| `lib/continuity.ts` | ⚠️ route clone gap, silent errors | Low | Singleton blocks tests | **Superior** — OpenCode has no durable persistence | **NEEDS FIX** |
| `lib/lifecycle-manager.ts` | ⚠️ race in cancel, phase bypass | Low | Low | **Superior** — OpenCode has no lifecycle/queue system | **NEEDS FIX** |
| `lib/agent-registry.ts` | Dead code | N/A | N/A | **Redundant** — OpenCode handles agents natively | **FAIL** |
| `tools/prompt-skim/` | ⚠️ weak regex | Fictional lanes | No | **Marginal** — LLMs can self-assess prompts | **NEEDS FIX** |
| `tools/prompt-analyze/` | ❌ broken contradiction detection | HIGH false positives | No | **Marginal** — LLMs self-analyze better | **NEEDS FIX** |
| `tools/context-budget/` | ✅ | Minor | No | **Marginal** — OpenCode tracks compaction natively | **PASS** |
| `tools/session-patch/` | ❌ double-write race | Patch file accumulation | Crash-corruption window | **Conditional** — only with prompt-enhance | **NEEDS FIX** |
| `hooks/messages-transform.ts` | ⚠️ trigger too broad | Injects context unnecessarily | Possible API rejection | **Marginal** | **NEEDS FIX** |
| `hooks/system-transform.ts` | Works | **CRITICAL**: pollutes every session | Confuses non-enhance agents | **Inferior** — pure noise | **FAIL** |
| `plugin.ts` | ❌ double compaction context, failing test | **HIGH**: metadata on every tool output | Circuit breaker not configurable | `delegate-task` is **essential** | **FAIL** |
| `plugins/prompt-enhance.ts` | ⚠️ event handler doesn't track compaction | Moderate | No | **Marginal** — pipeline not fully built | **NEEDS FIX** |
| `shared/tool-helpers.ts` | ✅ | None | No | Convention anchor | **PASS** |
| `shared/tool-response.ts` | ✅ | None | No | Utility | **PASS** |

---

## What Genuinely Works (Keep)

These 9 modules are **production-quality** — no bugs, no noise, no blocking, genuinely superior to OpenCode:

1. **`task-status.ts`** — 7-state machine with transition guards. Zero bugs, 21 LOC, pure value.
2. **`state.ts`** — In-memory Maps for budget/descendant tracking. Two-phase commit (reserve → commit/rollback). Clean.
3. **`helpers.ts`** — SDK unwrapping, loop detection via `makeToolSignature`, prompt construction. Solid.
4. **`runtime.ts`** — Event→status normalization with 8-path fallback. Handles SDK format variations.
5. **`session-api.ts`** — Typed SDK wrappers, `walkParentChain()` for depth enforcement. Essential.
6. **`concurrency.ts`** — FIFO keyed semaphore with idempotent release. No race conditions.
7. **`completion-detector.ts`** — Two-signal (event + message stability). Correct in Node.js event loop.
8. **`notification-handler.ts`** — Best-effort parent notification. Clean error handling.
9. **`context-budget/`** — Functional, if marginal. Reads compaction state correctly.

---

## FAIL — Must Fix or Remove

### F1: `agent-registry.ts` — Dead Code

**Evidence:** Not imported by any production file. Not re-exported from `index.ts`. Only imported by its own test. 112 LOC doing nothing.

**Why it fails:** OpenCode handles agent definitions natively via `.opencode/agents/*.md`. This module's hand-rolled YAML parser (lines 16-93) is fragile and handles only a subset of YAML. The `isToolDenied` function checks for `{ "*": "ask" }` objects that no code path creates.

**Fix:** Delete the file and its test. Or wire it into `plugin.ts` if it's intended for future use — but right now it's dead weight.

---

### F2: `system-transform.ts` — Unconditional System Prompt Pollution

**Evidence:** Line 45 injects a 36-line YAML contract template into **every session's** system prompt. This contract (`TOOL_OUTPUT_CONTRACT`) describes prompt-enhance output format — irrelevant for 95% of sessions.

**Why it fails:**
- Wastes ~200 tokens of context budget per session
- Uses phrases like "you MUST follow this structure" which confuse agents doing code review, debugging, or implementation
- Only relevant for prompt-enhance operations but applied unconditionally

**Fix:** Gate injection by delegation metadata — only inject for sessions where prompt-enhance is active:
```typescript
// system-transform.ts — make conditional
export function systemTransform(args: any): string {
  if (!isPromptEnhanceSession(args)) return args.systemPrompt
  return `${args.systemPrompt}\n\n${CONTRACT_TEMPLATE}`
}
```
Or remove entirely and inject via `messages-transform` only when triggers are detected.

---

### F3: `plugin.ts` — Three Interconnected Failures

**Evidence:**
1. **Double compaction context** (lines 314-316 + prompt-enhance.ts:84-104) — Every compaction gets TWO large context injections (harness state snapshot + raw session file)
2. **Unconditional metadata noise** (lines 182-208) — `_harness` blob injected into EVERY tool output, even non-delegated sessions where all fields are empty/0/[]
3. **Failing test** — `event hook fires compaction via session.compacted event type` expects `compaction_count: 1` but gets `0`

**Why it fails:**
- Double context injection wastes ~40+ lines of context per compaction
- Metadata noise on every tool output trains agents to ignore the harness
- The test failure indicates the event handler in `prompt-enhance.ts` doesn't handle `session.compacted` events to increment the counter

**Fix:**
```typescript
// Fix 1: Remove duplicate compaction context — pick ONE handler
// Either plugin.ts handles it (remove prompt-enhance forward at line 314-316)
// OR prompt-enhance.ts handles it (remove plugin.ts lines 226-311)

// Fix 2: Conditional metadata — only for delegated sessions
tool: {
  execute: {
    after: async (ctx) => {
      const meta = getDelegationMeta(ctx.sessionID)
      if (!meta) return ctx.result  // ← skip non-delegated sessions
      // ... inject _harness metadata
    }
  }
}

// Fix 3: Fix the event handler in prompt-enhance.ts
event: async (ctx) => {
  ensurePromptEnhanceState(process.cwd())
  if (ctx.event?.type === "session.compacted") {
    recordCompaction(process.cwd())  // ← add this
  }
}
```

---

## NEEDS FIX — Functional But Broken

### N1: `types.ts:24` — Deceptive Type

```typescript
// CURRENT — looks constrained but accepts ANY string
export type SessionStatusType = "idle" | "busy" | "retry" | string

// FIX — choose one:
export type SessionStatusType = "idle" | "busy" | "retry"  // true constraint
// OR
export type SessionStatusType = string  // honest about being open
```

---

### N2: `continuity.ts` — Two Bugs

**Bug 1: `route` field not deep-cloned** (line 605-618)
`DelegationRouteResolution` contains `warnings: string[]` — a mutable array. `delegation`, `constraints`, `lifecycle` are all explicitly deep-cloned. `route` is not. Callers can corrupt internal state.

```typescript
// FIX — add explicit clone for route
route: patch.route
  ? { ...patch.route, warnings: [...(patch.route.warnings ?? [])] }
  : current.metadata.route
    ? { ...current.metadata.route, warnings: [...(current.metadata.route.warnings ?? [])] }
    : undefined,
```

**Bug 2: Silent error swallowing** (lines 85-87, 90-96)
- `loadStoreFromDisk` silently returns `emptyStore()` on parse errors — user loses all history with zero feedback
- `persistStore` silently swallows I/O errors — in-memory and on-disk states diverge with no detection

```typescript
// FIX — at minimum, log errors
} catch (err) {
  console.warn("[Harness] Failed to parse continuity file, starting fresh:", err)
  return emptyStore()
}
```

---

### N3: `lifecycle-manager.ts` — Two Issues

**Issue 1: `noteObservedActivity` bypasses `mapStatusToPhase`** (line 164)
Hardcodes phase to `"running"`. If a session is in `queued`/`dispatching` phase and a tool-activity observation comes in, phase incorrectly jumps to `running`.

```typescript
// FIX
phase: this.mapStatusToPhase(
  record.metadata.status === "error" ? "error" : "running",
  record.metadata.lifecycle?.phase
),
```

**Issue 2: Race between `cancelDelegatedSession` and `observeBackgroundCompletion`** (lines 242-263 vs 695-697)
If `releaseQueue` reads state before cancel's patch is persisted, it overwrites with stale state. Currently safe because `patchSessionContinuity` is synchronous, but fragile.

```typescript
// FIX — in releaseQueue, skip status/phase update if already terminal
if (existing?.metadata.status && isTerminal(existing.metadata.status)) {
  // Only update cleanup/queue fields, not status/phase
}
```

---

### N4: `prompt-skim/tools.ts` — Fictional Output

**Bug:** `recommended_lanes` (lines 62-77) outputs lane names like `"analyzer"`, `"context-mapper"`, `"risk-assessor"` that reference a non-existent pipeline. Agents consuming this output have no idea what to do with these lanes.

**Fix:** Remove `recommended_lanes` entirely. Or replace with actionable output (e.g., "consider using prompt-analyze tool for deeper analysis").

---

### N5: `prompt-analyze/tools.ts` — Broken Contradiction Detection

**Bug:** Contradiction detection (lines 17-20) checks if a SINGLE LINE matches BOTH regexes. Real contradictions happen ACROSS lines — line 5 says "use X", line 20 says "do not use X". Per-line approach produces both false negatives (misses cross-line) and false positives (flags "use foo but do not use bar").

**Fix:**
```typescript
// Replace per-line contradiction check with cross-line comparison
function findContradictions(lines: string[]): Finding[] {
  const findings: Finding[] = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      for (const [posRe, negRe] of CONTRADICTION_PAIRS) {
        const iPos = posRe.test(lines[i]) && negRe.test(lines[j])
        const jPos = posRe.test(lines[j]) && negRe.test(lines[i])
        if (iPos || jPos) {
          findings.push({ /* contradiction between lines i and j */ })
        }
      }
    }
  }
  return findings
}
```

---

### N6: `session-patch/tools.ts` — Double-Write Race Condition

**Bug:** Lines 71 and 81 write the file twice — first with the section patch, then with the patch_count increment. Crash between these writes = corrupted state.

```typescript
// FIX — single atomic write
const patchedSection = /* ... apply section patch ... */
const incremented = patchedSection.replace(
  /^patch_count:\s*(\d+)/m,
  (_, n) => `patch_count: ${parseInt(n, 10) + 1}`
)
writeFileSync(args.sessionFilePath, incremented)  // single write
```

---

### N7: `messages-transform.ts` — Over-Broad Trigger Detection

**Bug:** `PROMPT_ENHANCE_TRIGGERS` (lines 11-17) matches any mention of trigger phrases, including questions like "What does prompt-enhance do?". Also inserts `role: "system"` messages that may break OpenCode's message sequence validation.

**Fix:** Add word-boundary or intent detection. Only trigger on explicit command-like phrases, not mentions.

---

## Summary of Required Fixes

| Priority | File | Fix | Effort |
|----------|------|-----|--------|
| P0 | `system-transform.ts` | Gate by delegation metadata or remove | Small |
| P0 | `plugin.ts:314-316` | Remove duplicate compaction context | Small |
| P0 | `plugin.ts:182-208` | Conditional metadata — only for delegated sessions | Small |
| P0 | `prompt-enhance.ts` | Fix event handler to track `session.compacted` | Small |
| P1 | `prompt-analyze/tools.ts` | Cross-line contradiction detection | Medium |
| P1 | `session-patch/tools.ts` | Single atomic write | Small |
| P1 | `continuity.ts:605-618` | Deep-clone `route` field | Small |
| P1 | `continuity.ts:85-87` | Log parse errors | Small |
| P1 | `continuity.ts:26` | Export `_resetStoreCache()` for testability | Small |
| P1 | `lifecycle-manager.ts:164` | Use `mapStatusToPhase` in `noteObservedActivity` | Small |
| P2 | `types.ts:24` | Fix deceptive `SessionStatusType` | Trivial |
| P2 | `prompt-skim/tools.ts` | Remove fictional `recommended_lanes` | Small |
| P2 | `messages-transform.ts` | Narrow trigger detection | Small |
| P2 | `agent-registry.ts` | Delete or wire in | Small |

**Total estimated fix effort: ~3-4 hours for P0, ~6-8 hours for P1, ~2-3 hours for P2.**

---

## What OpenCode Already Does Better

These modules are **redundant or inferior** to OpenCode built-in:

| Module | Why Inferior | Recommendation |
|--------|-------------|----------------|
| `agent-registry.ts` | OpenCode handles agent definitions natively via `.opencode/agents/*.md` | Delete |
| `system-transform.ts` | OpenCode's system prompt is clean — this pollutes it | Gate or remove |
| `prompt-skim/` | LLMs can count words, find URLs, estimate complexity without a tool | Keep if `recommended_lanes` removed; marginal value |
| `prompt-analyze/` | LLMs self-analyze better than these regexes | Rebuild with cross-line detection or remove |
| `context-budget/` | OpenCode tracks compaction natively; 15% decrement is a guess | Keep — marginal awareness value |

---

## Zero Test Coverage (Danger Zones)

| Module | LOC | Tests | Risk |
|--------|-----|-------|------|
| `continuity.ts` | 638 | **0** | Highest — persistence layer with no verification |
| `lifecycle-manager.ts` | 705 | **0** | Highest — orchestration engine with no verification |
| `state.ts` | 106 | **0** | Medium — budget tracking with no verification |
| `concurrency.ts` | 98 | **0** | Medium — queue logic with no verification |
| `runtime.ts` | 69 | **0** | Low — event mapping with no verification |

These 5 modules total **1,616 LOC with zero test coverage** — 48% of the codebase is untested.
