# Phase C5: Error Handling & Code Quality — Research

**Created:** 2026-05-28
**Status:** Complete
**Confidence:** HIGH (source-verified from codebase reads)

---

## Standard Stack

No new dependencies needed. Existing project stack:

| Dependency | Version | Purpose |
|------------|---------|---------|
| `zod` | `^4.4.3` | Schema validation — used for `SdkMessageShape` union |
| TypeScript | `^5.7` | Strict mode, ES2022 target |

The project already has Zod v4 and all necessary primitives. The `SdkMessageShape` union must use Zod schemas per SPEC constraint.

---

## Architecture Patterns

### Pattern 1: Error logging convention (`[Harness]` prefix)

The codebase uses a consistent `[Harness]` prefix for structured error logging:

```typescript
// Write/critical operations (from execute-slash-command.ts, dispatch-command.ts):
console.error(`[Harness] session.command dispatch failed: ${message}`)
console.error(`[Harness] Slash command dispatch failed: ${message}`)

// Warning pattern (from child-writer.ts):
console.warn('[Harness] <context>:', err)
```

**Rule for C5:** All write/critical empty catches must use `console.warn('[Harness] <context>:', err)` with descriptive context string. Read-only/expected catches get `// Expected: <reason>` comments.

### Pattern 2: SdkMessage interface (existing definition)

Defined in `src/coordination/delegation/coordinator.ts:18-33`:

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

**Triple-fallback target:** `coordinator.ts:236-244`:
```typescript
const role = (m as SdkMessage)?.info?.role ?? (m as SdkMessage)?.role
// ...
const errorField = (lastAssistantMessage as SdkMessage)?.info?.error ?? (lastAssistantMessage as SdkMessage)?.error
if (errorField) {
  const errorMsg = typeof errorField === "object" && errorField !== null
    ? (((errorField as Record<string, unknown>)?.message) || JSON.stringify(errorField))
    : String(errorField)
}
```

There is also `child-backfiller.ts:113` with `extractTextFromSdkMessage()` which uses a different pattern but reads the same SDK message shapes. This function is NOT in scope for C5 but serves as a reference for how SDK message content is extracted.

### Pattern 3: buildMinimalEnv (allowlist pattern)

Defined in `src/coordination/command-delegation/handler.ts:375-387`:

```typescript
private buildMinimalEnv(extraEnv?: Record<string, string>): Record<string, string> {
  const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
  const base = Object.fromEntries(
    allowedKeys
      .map((key) => [key, process.env[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
  return { ...base, ...(extraEnv ?? {}) }
}
```

**Rule for C5:** `create-governance-session.ts` must adopt this same `allowedKeys` pattern. `doctor.ts` gets a safety comment (it's a diagnostic tool, the full env is acceptable).

### Pattern 4: Error type hierarchy

The project has `src/shared/errors/commands.ts` with typed error classes. However, for C5's scope, no new error classes are needed — only logging/warning injection into existing catch blocks.

---

## Don't Hand-Roll

Nothing for this phase. All fixes use existing patterns:
- `console.warn('[Harness]...')` — already established
- `buildMinimalEnv` — already implemented, just need to replicate
- `SdkMessage` types — already defined, need Zod-schematized union

---

## Common Pitfalls

1. **Over-aggressive grep patterns**: The SPEC's acceptance grep `\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*\{\s*\}\s*)` is specific to empty catch blocks. Some `.catch()` blocks that DO something (like `notification-router.ts:74` which calls `this.finalizeDelivery()`) should NOT be touched. Only truly empty `catch(() => {})` blocks.

2. **`as any` replacement risk**: Changing `as any` to typed casts in coordinator.ts must preserve the fallback semantics. The code handles SDK message shapes that may have changed across versions — `info.role ?? role` is intentional. The fix is to formalize this with a typed union, not to remove the fallback logic.

3. **Zod v4 API**: The project uses `zod@^4.4.3`. Zod v4 uses `z.object()` and `z.union()` (v4 uses `z.union()` which accepts an array of schemas). Verify API compatibility before writing the Zod schema.

4. **`create-governance-session.ts` execSync path**: The file at `src/features/governance-engine/create-governance-session.ts:129` uses `execSync` for git commit. The actual line numbers may have shifted since the CONCERNS.md audit. Verify current line numbers.

5. **doctor.ts file location**: `doctor.ts` is at `src/cli/commands/doctor.ts` (not in `src/features/`). The SPEC references `doctor.ts:244` — verify correct line number.

---

## Code Examples

### Example 1: Write/critical catch fix (event-capture.ts style)

```typescript
// Before (concerning — write operation, silent failure):
await this.sessionWriter.appendAssistantTurn(sessionID, turnNumber, trimmedText).catch((err) => {
  // error silently swallowed
})

// After:
await this.sessionWriter.appendAssistantTurn(sessionID, turnNumber, trimmedText).catch((err) => {
  console.warn('[Harness] appendAssistantTurn failed:', err)
})
```

### Example 2: Read-only/expected catch fix (session-tracker.ts style)

```typescript
// Before (acceptable — read operation, error expected):
.catch(() => {})

// After:
.catch(() => {
  // Expected: file may not exist yet during first session read
})
```

### Example 3: Scoped env pattern (replicate buildMinimalEnv)

```typescript
// Before (create-governance-session.ts):
const result = execSync(cmd, { env: { ...process.env } })

// After:
const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD", "GIT_DIR", "GIT_WORK_TREE"]
const scopedEnv = Object.fromEntries(
  allowedKeys
    .map((key) => [key, process.env[key]])
    .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
)
const result = execSync(cmd, { env: { ...scopedEnv } })
```

### Example 4: coordinator.ts typed extraction (conceptual)

```typescript
// Existing interfaces (already defined in coordinator.ts):
interface SdkMessageInfo { role?: string; error?: unknown }
interface SdkMessage { info?: SdkMessageInfo; role?: string; error?: unknown }

// New: Zod-schematized union for clean extraction
const sdkMessageSchema = z.object({
  role: z.string().optional(),
  info: z.object({
    role: z.string().optional(),
    error: z.unknown().optional(),
  }).optional(),
  error: z.unknown().optional(),
})

function extractSdkMessageError(msg: z.infer<typeof sdkMessageSchema>): string | undefined {
  const errorField = msg?.info?.error ?? msg?.error
  if (errorField === undefined) return undefined
  if (typeof errorField === 'object' && errorField !== null) {
    const msg = (errorField as Record<string, unknown>)?.message
    return typeof msg === 'string' ? msg : String(errorField)
  }
  return String(errorField)
}

function extractSdkMessageRole(msg: z.infer<typeof sdkMessageSchema>): string | undefined {
  return msg?.info?.role ?? msg?.role
}
```

---

## File Inventory (Affected Files)

| File | Concern | Fix Type | Priority |
|------|---------|----------|----------|
| `src/features/session-tracker/capture/event-capture.ts` | 5.1 (5 catch blocks) | console.warn | CRITICAL (write ops) |
| `src/features/session-tracker/persistence/child-writer.ts` | 5.1 (2 catch blocks) | console.warn | CRITICAL (write ops) |
| `src/features/session-tracker/initialization.ts` | 5.1 (1 catch block) | console.warn | MEDIUM |
| `src/features/session-tracker/persistence/session-index-writer.ts` | 5.1 (1 catch block) | console.warn | MEDIUM |
| `src/features/session-tracker/persistence/project-index-writer.ts` | 5.1 (1 catch block) | console.warn | MEDIUM |
| `src/features/session-tracker/persistence/atomic-write.ts` | 5.1 (2 .then().catch()) | comment | LOW (read-only) |
| `src/tools/session/session-tracker.ts` | 5.1 (3 catch blocks) | comment | LOW (read-only, expected failures) |
| `src/tools/session/session-hierarchy.ts` | 5.1 (1 catch block) | comment | LOW |
| `src/tools/session/session-context.ts` | 5.1 (1 catch block) | comment | LOW |
| `src/coordination/delegation/state-machine.ts` | 5.1 (1 catch block) | comment | LOW |
| `src/config/compiler.ts` | 5.1 (1 catch block) | comment | LOW (rollback) |
| `src/coordination/delegation/coordinator.ts` | 5.2 (triple-fallback) | Zod typed extraction | CRITICAL |
| `src/features/governance-engine/create-governance-session.ts` | 5.3 (process.env spread) | scoped env allowlist | HIGH |
| `src/cli/commands/doctor.ts` | 5.3 (process.env spread) | add safety comment | LOW |

**Total:** 14 empty catch blocks (REQ-01) + 1 error shape fix (REQ-02) + 1 env fix (REQ-03) + 1 doc comment (REQ-04)

---

## Verification Strategy

| Check | Command | Expected |
|-------|---------|----------|
| Empty catch blocks | `grep -rn '\.catch\s*(\s*(\(\s*\)\|_\s*)?\s*=>\s*{\s*}\s*)' src/` | Zero matches |
| TypeScript typecheck | `npm run typecheck` | Zero errors |
| Test suite | `npm test` | All pass, no regressions |
| coordinator.ts `as any` | `grep -n 'as any' src/coordination/delegation/coordinator.ts` | No `as any` in error extraction |
| create-governance-session.ts env | `grep -n 'process\.env' src/features/governance-engine/create-governance-session.ts` | No full `{ ...process.env }` spread |
| doctor.ts comment | Check `doctor.ts` for safety rationale comment | Comment present at env spread line |

---

## Confidence Assessment

| Domain | Confidence | Source |
|--------|-----------|--------|
| Empty catch block locations | HIGH | Verified by grep of `src/` |
| SdkMessage interface shape | HIGH | Read from coordinator.ts:18-33 |
| buildMinimalEnv pattern | HIGH | Read from handler.ts:375-387 |
| Zod version (^4.4.3) | HIGH | From package.json (SPEC constraint) |
| Doctor.ts env spread | HIGH | Grep confirmed `{ ...process.env }` at line 129 |
| create-governance-session.ts env | HIGH | Grep confirmed `{ ...process.env }` at line 244 |
| coordinator.ts triple-fallback | HIGH | Read from coordinator.ts:236-244 |
