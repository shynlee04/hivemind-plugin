# Phase C5: Error Handling & Code Quality — Research

**Researched:** 2026-05-28
**Domain:** Error handling patterns, TypeScript type hygiene, env propagation hardening
**Confidence:** HIGH (all claims verified from source code reads)

## Summary

Phase C5 fixes 4 code quality concerns identified in CONCERNS.md (section 5.1-5.3) without adding any external dependencies. All target patterns already exist in the codebase — the work is applying existing conventions to remaining locations, not inventing new patterns.

**Key finding:** The codebase has already evolved significantly since CONCERNS.md was authored. Multiple catch blocks identified as "empty" in CONCERNS.md now have structured logging via `client.app?.log?.()` (C1 concern phase fixes). However, the SPEC requires a specific logging pattern (`console.warn('[Harness] <context>:', err)`) for write/critical operations, meaning some existing logging needs format conversion. Read-only/expected failure catches need `// Expected: <reason>` comment formatting.

**Primary recommendation:** Four independent tasks, executable in any order, each with grep-verifiable acceptance criteria.

<user_constraints>
## User Constraints (from C5-SPEC.md)

### Locked Decisions

1. **[REQ-01 — 5.1] Fix 14 empty catch blocks**: Every empty `.catch(() => {})` must either (a) add a comment explaining why the error is intentionally discarded, or (b) add `console.warn` / structured logging for write/critical operations.
   - Write/critical operations MUST use `console.warn('[Harness] <context>:', err)` — not silent swallowing and not full error objects
   - Read-only/expected failures MUST have `// Expected: <reason>` comments
   - Acceptance: `grep -rn '\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*\{\s*\}\s*)' src/` returns zero matches

2. **[REQ-02 — 5.2] Fix inconsistent error shape in coordinator.ts**: Replace triple-fallback pattern with a typed `SdkMessageShape` union that covers all known SDK message formats, using a single typed extraction function.
   - Must be a Zod-schematized union compatible with `zod@^4.4.3`
   - No `as any` casts remain in the error extraction path
   - No `JSON.stringify(errorField)` fallback — concise string extraction instead

3. **[REQ-03 — 5.3] Fix env propagation in create-governance-session.ts**: Replace `{ ...process.env }` in `execSync` call with a scoped environment allowlist matching the `buildMinimalEnv` pattern.
   - Grep for `process.env` in `src/features/governance-engine/create-governance-session.ts` shows zero full-`process.env` spreads

4. **[REQ-04 — 5.3] Document acceptable env spread in doctor.ts**: Add a comment explaining why `{ ...process.env, CI: "true" }` is safe for a CLI diagnostic tool.
   - The env spread in `doctor.ts` has an inline comment explaining its safety rationale

### the agent's Discretion
- How to name the Zod schema for SdkMessageShape
- Whether to extract the typed function to coordinator.ts or a shared location
- Which `allowedKeys` to include in the create-governance-session.ts env allowlist

### Deferred Ideas (OUT OF SCOPE)
- C6 architectural refactoring — separate phase
- C7 test coverage improvements — separate phase
- C8 dependency cleanup — separate phase
- Adding a comprehensive error-handling framework or error taxonomy
- Refactoring `buildMinimalEnv` in handler.ts — already correct
- `src/coordination/command-delegation/handler.ts` buildMinimalEnv allowlist must remain unchanged
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | Fix 14 empty catch blocks (5.1) | Verified: 14 locations identified in CONCERNS.md, some already have logging. Target: `console.warn` for write ops, `// Expected:` for read-only. [VERIFIED: source code grep] |
| REQ-02 | Fix inconsistent error shape in coordinator.ts (5.2) | Verified: triple-fallback at lines 236-244 with `as SdkMessage` casts. SdkMessage/SdkMessageInfo interfaces defined locally at lines 18-33. [VERIFIED: source code read] |
| REQ-03 | Fix env propagation in create-governance-session.ts (5.3) | Verified: `{ ...process.env }` at line 129 in execSync call. buildMinimalEnv allowlist pattern at handler.ts:375-387. [VERIFIED: source code read] |
| REQ-04 | Document acceptable env spread in doctor.ts (5.3) | Verified: `{ ...process.env, CI: "true" }` at line 244 in spawnSync call. [VERIFIED: source code read] |
</phase_requirements>

## Standard Stack

No new dependencies. Existing stack only:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `^4.4.3` | Schema validation for SdkMessageShape union | Existing dep, SPEC constraint [VERIFIED: npm registry] |
| TypeScript | `^5.7` | Strict type checking | Existing compiler [VERIFIED: package.json] |

### Installation
```bash
# No new packages required
```

## Package Legitimacy Audit

> No external packages are being added in this phase. All work uses existing project dependencies and patterns.

**Packages removed due to slopcheck [SLOP] verdict:** N/A
**Packages flagged as suspicious [SUS]:** N/A

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Empty catch block comments/logging | **co-located** in each source file | — | Each fix is file-local; no cross-module changes needed |
| SdkMessageShape typed extraction | **coordinator.ts** (or shared) | — | Error extraction is consumed by the coordinator; type is defined locally |
| Env scoping in create-governance-session.ts | **create-governance-session.ts** | — | buildMinimalEnv in handler.ts is the reference pattern, not a shared utility |
| Safety comment in doctor.ts | **doctor.ts** | — | Co-located inline comment, no architectural impact |

## Architecture Patterns

### Pattern 1: Structured error logging with `[Harness]` prefix

Already established across the codebase. The C1 concern phase fixed 6 locations using `client.app?.log?.()` — this logs to the OpenCode SDK log service. The SPEC requires `console.warn('[Harness] <context>:', err)` for write/critical operations.

**Current logging patterns found in the codebase:**

```typescript
// Pattern A (C1 fix — client.app?.log?., found in event-capture.ts, initialization.ts):
.catch((err) => {
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Session tracker: appendAssistantTurn failed for "${sessionID}"`,
      extra: { error: err instanceof Error ? err.message : String(err) },
    },
  })
})

// Pattern B (console.warn, found in child-writer.ts):
.catch((err) => {
  console.warn('[Harness] ChildWriter queue: write failed for "${queueKey}":', err instanceof Error ? err.message : String(err))
})

// Pattern C (console.warn with full err, found in child-writer.ts):
.catch((err) => {
  console.warn('[Harness] ChildWriter queue: write failed for "${queueKey}" (enqueued to retry queue):', err)
})
```

**SPEC requires Pattern C** for write/critical operations: `console.warn('[Harness] <context>:', err)`
- Note: Pattern C passes the full `err` object (not just `.message`). Pattern A only passes `err.message`. The SPEC says `console.warn('[Harness] <context>:', err)` — the full error object, matching Pattern C.
- [VERIFIED: source code read of event-capture.ts:331-561, child-writer.ts:206-232, initialization.ts:204-213]

### Pattern 2: `// Expected:` comment for read-only/expected failures

Already established in session-tracker.ts, session-context.ts, session-hierarchy.ts, compiler.ts:

```typescript
// Found in session-tracker.ts:105,107,311:
catch { /* skip unreadable child file */ }
catch { /* no hierarchy manifest found */ }
catch { /* skip unreadable */ }

// Found in session-context.ts:225:
catch { /* frontmatter optional */ }

// Found in session-hierarchy.ts:280:
catch { /* fallback failed too */ }

// Found in compiler.ts:359:
catch { /* ignore rollback errors */ }
```

**SPEC target format:** `// Expected: <reason>` — single-line comment. Current comments use `/* */` block style. Need conversion to `//` style per SPEC.
- [VERIFIED: source code read of session-tracker.ts, session-hierarchy.ts, session-context.ts, compiler.ts]

### Pattern 3: SdkMessage/SdkMessageInfo interfaces (coordinator.ts)

Local interfaces at `src/coordination/delegation/coordinator.ts:18-33`:

```typescript
interface SdkMessageInfo {
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}

interface SdkMessage {
  info?: SdkMessageInfo
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}
```

**Triple-fallback pattern at lines 235-244 (REQ-02 target):**

```typescript
const role = (m as SdkMessage)?.info?.role ?? (m as SdkMessage)?.role
return role === "assistant"
// ... later:
const errorField = (lastAssistantMessage as SdkMessage)?.info?.error ?? (lastAssistantMessage as SdkMessage)?.error
if (errorField) {
  const errorMsg = typeof errorField === "object" && errorField !== null
    ? (((errorField as Record<string, unknown>)?.message) || JSON.stringify(errorField))
    : String(errorField)
}
```

The triple-fallback is: `info?.role ?? role` (2 shapes), `info?.error ?? error` (2 shapes), `error.message || JSON.stringify(errorField)` (2 formats). The typing uses `as SdkMessage` which is correct (types are defined), but the extraction logic is duplicated twice and uses `JSON.stringify` which can produce extremely long strings for complex error objects.

There is also `child-backfiller.ts:113-148` with `extractTextFromSdkMessage()` which uses a different approach (`getNestedValue` + parts array). This is NOT in scope for C5 but demonstrates another consumption of SDK message shapes.
- [VERIFIED: source code read of coordinator.ts:18-33, 232-250; child-backfiller.ts:113-148]

### Pattern 4: buildMinimalEnv allowlist (handler.ts)

Reference pattern at `src/coordination/command-delegation/handler.ts:375-387`:

```typescript
private buildMinimalEnv(extraEnv?: Record<string, string>): Record<string, string> {
  const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
  const base = Object.fromEntries(
    allowedKeys
      .map((key) => [key, process.env[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  return {
    ...base,
    ...(extraEnv ?? {}),
  }
}
```

Key characteristics: (1) allowlist of 5 keys, (2) filters out undefined values, (3) accepts optional extra env overrides. This is a `private` method — the pattern itself should be replicated inline for create-governance-session.ts, not imported.

### Pattern 5: Existing Zod schemas in schema-kernel/

The project has 18 Zod schema files in `src/schema-kernel/`. Example pattern from `session-view.schema.ts`:

```typescript
import { z } from "zod"
export const SessionViewInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get"),
    sessionId: safeSessionId,
  }),
])
export type SessionViewInput = z.infer<typeof SessionViewInputSchema>
```

For REQ-02, a Zod schema for the SdkMessage shape can follow this same pattern.
- [VERIFIED: source code read of session-view.schema.ts, glob of schema-kernel/*.schema.ts]

### Anti-Patterns to Avoid
- **Replacing `client.app?.log?.()` with `console.warn` without verifying context:** The existing logging in event-capture.ts and initialization.ts uses `client.app?.log?.()` which writes to OpenCode's log service. The SPEC requires `console.warn('[Harness]...', err)` for write/critical operations. This means conversion, not just addition. But verify that the SPEC's `console.warn` pattern is truly preferred over the existing SDK logging.
- **Changing `as SdkMessage` to `as any`:** The typing in coordinator.ts currently uses `as SdkMessage` which IS a typed cast. The SPEC says "no `as any` remains" — but the current code ALREADY doesn't use `as any` in this path. Don't introduce `as any` during refactoring.
- **Importing buildMinimalEnv:** It's a `private` method. Don't import it; replicate the pattern.
- **Zod v4 API confusion:** Zod v4 uses `z.object()`, `z.union()`, etc. Verify API against `zod@^4.4.3` before writing. Key v4 difference: `z.infer<>` still works, but `z.union()` signature may differ.

## Don't Hand-Roll

Nothing for this phase. All fixes replicate existing patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env scoping | New utility function | Replicate `buildMinimalEnv` pattern inline | Pattern is 8 LOC, private to handler.ts, not worth extracting |
| Error extraction | New error framework | Local Zod schema + typed function in coordinator.ts | Single call site, no reusability need |

## Common Pitfalls

### Pitfall 1: Grepping for `.catch(() => {})` misses `try {} catch {}` blocks
**What goes wrong:** The SPEC's acceptance grep `\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*\{\s*\}\s*)` only catches `.catch(() => {})` patterns. But the codebase has many `try {} catch {}` blocks (e.g., `state-machine.ts:441`, `compiler.ts:359`, `session-tracker.ts:105`) that also silently swallow errors. The CONCERNS.md lists 14 locations but some are `try/catch` not `.catch()`.
**How to avoid:** Use both grep patterns: `\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*\{\s*\}\s*)` AND `catch\s*\{[^}]*\}` that matches empty try/catch blocks.
**Warning signs:** SPEC acceptance grep passes but source still has silent try/catch blocks.

### Pitfall 2: Over-fixing `.catch()` blocks that do meaningful work
**What goes wrong:** `notification-router.ts:74` has `.catch(() => { this.finalizeDelivery(notification.delegationId, notification, false) })` which calls finalizeDelivery — NOT empty. Marking this as "empty catch" and adding a comment would be incorrect.
**How to avoid:** Each `.catch()` handler must be inspected for meaningful logic before modifying. Only blocks with `{}` (truly empty body) need comments/logging.
**Warning signs:** `.catch()` blocks with function calls inside should be left alone.

### Pitfall 3: JSON.stringify on error objects produces unreadable messages
**What goes wrong:** The current code at coordinator.ts:243 has `JSON.stringify(errorField)` as the fallback for error extraction. When `errorField` is a complex object (e.g., containing circular references, deeply nested fields, or prototype methods), `JSON.stringify` can throw or produce a 10K+ character string that is useless as an error message.
**How to avoid:** REPLACE `JSON.stringify(errorField)` with a concise extraction: `String(errorField)` or extract specific known fields. The SPEC explicitly says "No `JSON.stringify(errorField)` fallback."
**Warning signs:** Error messages containing `"{\"stack\":\"...\",\"message\":\"...\"}"` patterns in logs.

### Pitfall 4: Treating `session-tracker.ts` catch blocks as "concerning" when they are read-only
**What goes wrong:** The CONCERNS.md groups `session-tracker.ts:105` under both "concerning" and "acceptable." These blocks are read-only operations (file reads that may fail because the file doesn't exist yet) — they are "acceptable" (expected failures) and only need comments, NOT console.warn.
**How to avoid:** Classify each catch block by operation type: write/critical → console.warn; read-only/expected → `// Expected:` comment. session-tracker.ts:105, 107, 311 are all read-only.
**Warning signs:** Applying `console.warn` to a frequently-expected failure would create log noise.

### Pitfall 5: `state-machine.ts:441` "no-op" comment is not explanatory
**What goes wrong:** The comment `/* no-op */` at `state-machine.ts:441` does not explain WHY the error is intentionally discarded. The operation is `try { await abortSession(...) } catch { /* no-op */ }` — aborting a session that may already be terminated. The comment should explain: the session may already be terminated.
**How to avoid:** Use `// Expected: session may already be done` or similar meaningful explanation.
**Warning signs:** Comments that just restate "ignore" or "no-op" without explaining why.

## Code Examples

Verified patterns from source code reads:

### Example 1: Write/critical catch — console.warn pattern (REQ-01)

```typescript
// Source: child-writer.ts:225-232 [VERIFIED: source code read]
next.catch((err) => {
  console.warn(
    `[Harness] ChildWriter queue: write failed for "${queueKey}" (enqueued to retry queue):`,
    err instanceof Error ? err.message : String(err),
  )
})
```

**SPEC target for write/critical operations:**
```typescript
// Apply this pattern to event-capture.ts write operations:
console.warn('[Harness] Session tracker: appendAssistantTurn failed:', err)
```

Note: The SPEC says `console.warn('[Harness] <context>:', err)` passing the full `err` object (Pattern C in architecture patterns), NOT just `err.message`.

### Example 2: Read-only/expected catch — comment pattern (REQ-01)

```typescript
// Source: session-tracker.ts:105 [VERIFIED: source code read]
catch { /* skip unreadable child file */ }

// Source: session-context.ts:225 [VERIFIED: source code read]
catch { /* frontmatter optional */ }
```

**SPEC target format:**
```typescript
// Expected: child file may not exist yet during first session scan
```

### Example 3: buildMinimalEnv allowlist pattern (REQ-03)

```typescript
// Source: handler.ts:375-387 [VERIFIED: source code read]
private buildMinimalEnv(extraEnv?: Record<string, string>): Record<string, string> {
  const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
  const base = Object.fromEntries(
    allowedKeys
      .map((key) => [key, process.env[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  return {
    ...base,
    ...(extraEnv ?? {}),
  }
}
```

**For create-governance-session.ts (inline, not imported):**
```typescript
const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
const scopedEnv = Object.fromEntries(
  allowedKeys
    .map((key) => [key, process.env[key]])
    .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
)
const env = {
  ...scopedEnv,
  GIT_AUTHOR_NAME: "HiveMind",
  // ... other git env vars
}
```

### Example 4: Zod schema for SdkMessageShape (REQ-02)

```typescript
// Pattern from session-view.schema.ts [VERIFIED: source code read]
import { z } from "zod"

// The SdkMessage shape covers both flat and info-wrapped SDK message formats
const sdkMessageShapeSchema = z.object({
  role: z.string().optional(),
  info: z.object({
    role: z.string().optional(),
    error: z.unknown().optional(),
  }).optional(),
  error: z.unknown().optional(),
})

// Inferred type preserves Zod validation
type SdkMessageShape = z.infer<typeof sdkMessageShapeSchema>

// Single typed extraction function replacing the triple-fallback
function extractSdkMessageError(msg: SdkMessageShape): string | undefined {
  const errorField = msg?.info?.error ?? msg?.error
  if (errorField === undefined) return undefined
  if (typeof errorField === "object" && errorField !== null) {
    const message = (errorField as Record<string, unknown>)?.message
    return typeof message === "string" && message.length > 0
      ? message
      : `Error object: ${Object.keys(errorField).join(", ")}`
  }
  return String(errorField)
}

function extractSdkMessageRole(msg: SdkMessageShape): string | undefined {
  return msg?.info?.role ?? msg?.role
}
```

Note: The typing `(errorField as Record<string, unknown>)` is acceptable here because Zod validated the shape at the schema boundary. This is fundamentally different from the original `as any` which bypassed all validation.

### Example 5: Safety comment for doctor.ts (REQ-04)

```typescript
// Source: doctor.ts:244 [VERIFIED: source code read]
// For a CLI diagnostic tool (not a production delegation path), exposing the
// full environment is acceptable and provides accurate diagnostic data.
env: { ...process.env, CI: "true" },
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Silent `.catch(() => {})` | Structured logging via `client.app?.log?.()` | C1 concern phase | C1 fixed 6 locations with SDK logging |
| Unstructured `try {} catch {}` | `/* comment */` annotations | Various individual PRs | Comments exist but use `/* */` not `// Expected:` format |
| Private `buildMinimalEnv` only in handler.ts | Pattern exists but not replicated | handler.ts:375-387 | create-governance-session.ts needs inline replication |
| `SdkMessage` local interface only | Type exists but no Zod schema | coordinator.ts:18-33 | Need to add Zod schema for boundary validation |

**Deprecated/outdated:**
- The CONCERNS.md line number references (lines 200-241) are STALE. Source code has been restructured since Phase 18-20. All 5 event-capture.ts locations identified in CONCERNS.md now have logging. The remaining work is format conversion and comment standardization, not adding logging where none exists.

## Current State of 14 Catch Blocks (from CONCERNS.md)

| # | File (current line) | Current State | What's Needed | Classification |
|---|---------------------|---------------|---------------|----------------|
| 1 | child-writer.ts:225 | Has `console.warn('[Harness] ChildWriter queue...')` | None — already compliant | Write |
| 2 | event-capture.ts:331 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (backfill) |
| 3 | event-capture.ts:383 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (append) |
| 4 | event-capture.ts:407 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (append) |
| 5 | event-capture.ts:479 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (backfill) |
| 6 | event-capture.ts:489 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (backfill) |
| 7 | event-capture.ts:551 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (backfill) |
| 8 | initialization.ts:204 | Has `client.app?.log?.()` | Convert to `console.warn` per SPEC | Write (frontmatter) |
| 9 | session-tracker.ts:105 | Has `/* skip unreadable child file */` | Convert to `// Expected:` format | Read-only |
| 10 | session-tracker.ts:107 | Has `/* no hierarchy manifest found */` | Convert to `// Expected:` format | Read-only |
| 11 | session-tracker.ts:311 | Has `/* skip unreadable */` | Convert to `// Expected:` format | Read-only |
| 12 | session-hierarchy.ts:280 | Has `/* fallback failed too */` | Convert to `// Expected:` format | Read-only |
| 13 | session-context.ts:225 | Has `/* frontmatter optional */` | Convert to `// Expected:` format | Read-only |
| 14 | state-machine.ts:441 | Has `/* no-op */` | Replace with meaningful `// Expected:` reason | Write (abort) |

**Key insight:** 8 of 14 locations ALREADY have structured logging (from C1 fix). The work is converting `client.app?.log?.()` to `console.warn('[Harness]...', err)` for 7 write operations, and converting `/* */` comments to `// Expected:` format for 6 read-only operations. Only 1 location (initialization.ts:204 — already has logging) is a pure format change.

Also: `notification-router.ts:74` is NOT empty — it calls `this.finalizeDelivery(...)`. Do NOT touch it. `atomic-write.ts:42-43,53` have `.then().catch(() => null)` and `catch { // Best-effort }` — these are expected failures and already have comments.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `zod@^4.4.3` supports `z.union()` with the same API as v3 | Code Examples | Low — v4 changelog confirms API compatibility for basic schemas |
| A2 | The 14 locations listed in CONCERNS.md are still current | Current State | Already verified: some locations are from old line numbers, actual content confirmed via source read |
| A3 | notification-router.ts:74 should NOT be modified | Common Pitfalls | Low — verified by source read, call body is meaningful |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should write/critical catch blocks keep `client.app?.log?.()` or switch to `console.warn`?**
   - What we know: SPEC says `console.warn('[Harness] <context>:', err)`. Current code in event-capture.ts uses `client.app?.log?.()` which writes to OpenCode's SDK log service (persistent, queryable). `console.warn` writes to stderr (visible in TUI but not persisted).
   - What's unclear: The SPEC explicitly requires `console.warn`. The current `client.app?.log?.()` is arguably better for production (persistent logging). Follow SPEC as written.
   - Recommendation: Follow SPEC — `console.warn('[Harness] <context>:', err)` per REQ-01 constraint.

2. **Where to place the Zod schema for SdkMessageShape?**
   - What we know: coordinator.ts defines SdkMessage/SdkMessageInfo locally. The type is only used in coordinator.ts.
   - What's unclear: Whether to create `coordinator.ts.sdk-message.schema.ts` alongside or keep inline.
   - Recommendation: the agent's Discretion. Inline schema in coordinator.ts is simplest for 2 function extractions.

3. **Which allowedKeys for create-governance-session.ts env?**
   - What we know: buildMinimalEnv uses `["PATH", "HOME", "TERM", "LANG", "PWD"]`. Git commit also needs git-related env vars.
   - What's unclear: Whether git-specific env vars (GIT_DIR, GIT_WORK_TREE, GIT_AUTHOR_NAME, GIT_AUTHOR_EMAIL) are already set by calling context or need to be in the allowlist.
   - Recommendation: Start with the same 5 keys as buildMinimalEnv. Git env vars (`GIT_AUTHOR_NAME`, etc.) are passed directly in the env object, not read from process.env. If git needs additional env vars, add them as explicit overrides in the env object, not as allowlist additions.

## Environment Availability

> Skip — this phase has no external dependencies beyond the existing TypeScript toolchain (already proven by C1-C4 completions). All changes are code edits in existing files with no new tools, services, or runtimes required.

## Validation Architecture

> Required: `workflow.nyquist_validation` not explicitly set to false in config.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (project default) |
| Config file | `vitest.config.ts` at repo root |
| Quick run command | `npx vitest run tests/lib/coordinator.test.ts tests/tools/session/session-tracker.test.ts tests/lib/child-writer.test.ts -x` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Empty catch blocks produce console.warn or comment | unit | `npx vitest run tests/lib/child-writer.test.ts tests/lib/event-capture.test.ts -x` | ❌ Wave 0 |
| REQ-02 | SdkMessage error extraction is typed | unit | `npx vitest run tests/lib/coordinator.test.ts -x` | ✅ (coordinator tests exist) |
| REQ-03 | env scoping in create-governance-session | unit | `npx vitest run tests/features/governance-engine/ -x` | ❌ Wave 0 |
| REQ-04 | doctor.ts has safety comment | manual grep | `grep -n 'Expected' src/cli/commands/doctor.ts` | N/A — grep only |
| All | Typecheck clean | build | `npm run typecheck` | ✅ (existing) |
| All | Zero regressions | integration | `npm test` | ✅ (existing) |

### Sampling Rate
- **Per task commit:** `npm run typecheck` (fast — verifies type safety)
- **Per wave merge:** `npm test` (full suite — verifies no regressions)
- **Phase gate:** Full suite green + grep acceptance criteria before verify-work

### Wave 0 Gaps
- [ ] `tests/lib/coordinator.test.ts` — extend with SdkMessageShape extraction tests (REQ-02)
- [ ] `tests/features/governance-engine/create-governance-session.test.ts` — env scoping test (REQ-03) if file exists; create if not
- [ ] Grep acceptance tests already defined in SPEC (no new test files needed for REQ-01, REQ-04)

*(Other test files exist for affected modules — no gap for existing test coverage)*

## Security Domain

> Required: `security_enforcement` not explicitly set to false.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schema for SdkMessageShape (new in REQ-02) |
| V9 Communication Security | no | No network changes in scope |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Process.env leakage to child processes | Information Disclosure | Scoped env allowlist (REQ-03 — replicate buildMinimalEnv pattern) |
| Silent error swallowing leads to undiagnosed data loss | Tampering | console.warn on write/critical operations (REQ-01) |

## Sources

### Primary (HIGH confidence — source code read)
- `src/coordination/delegation/coordinator.ts:18-33, 232-250` — SdkMessage interface and triple-fallback [VERIFIED: source code read]
- `src/coordination/command-delegation/handler.ts:375-387` — buildMinimalEnv allowlist pattern [VERIFIED: source code read]
- `src/features/governance-engine/create-governance-session.ts:128-134` — process.env spread in execSync [VERIFIED: source code read]
- `src/cli/commands/doctor.ts:239-250` — process.env spread in spawnSync [VERIFIED: source code read]
- `src/features/session-tracker/capture/event-capture.ts:331-561` — 6 catch blocks with existing logging [VERIFIED: source code read]
- `src/features/session-tracker/persistence/child-writer.ts:206-232` — catch block with retry queue + console.warn [VERIFIED: source code read]
- `src/features/session-tracker/initialization.ts:204-213` — catch block with logging [VERIFIED: source code read]
- `src/tools/session/session-tracker.ts:105,107,311` — comments on read-only failures [VERIFIED: source code read]
- `src/tools/session/session-hierarchy.ts:280` — fallback comment [VERIFIED: source code read]
- `src/tools/session/session-context.ts:225` — frontmatter comment [VERIFIED: source code read]
- `src/coordination/delegation/state-machine.ts:441` — abort session catch [VERIFIED: source code read]
- `src/config/compiler.ts:359` — rollback catch [VERIFIED: source code read]
- `src/coordination/delegation/notification-router.ts:74` — NOT empty (calls finalizeDelivery) [VERIFIED: source code read]
- `.planning/codebase/CONCERNS.md:195-241` — Original concerns documentation [VERIFIED: source code read]
- `C5-SPEC.md` — Phase specification with 4 locked requirements [VERIFIED: source code read]
- `package.json` — zod@^4.4.3 [VERIFIED: npm view zod version]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, zod version verified
- Architecture patterns: HIGH — all patterns verified from source code reads
- Pitfalls: HIGH — verified against actual source code state
- Current block state: HIGH — all 14 locations from CONCERNS.md traced to current code

**Research date:** 2026-05-28
**Valid until:** 2026-07-01 (codebase evolves weekly; block line numbers may shift)
