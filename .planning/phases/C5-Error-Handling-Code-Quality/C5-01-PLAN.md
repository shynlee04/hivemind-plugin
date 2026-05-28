---
phase: C5-Error-Handling-Code-Quality
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/coordination/delegation/coordinator.ts
autonomous: true
requirements: [REQ-02]
must_haves:
  truths:
    - "coordinator.ts error extraction uses typed Zod schema instead of triple-fallback"
    - "No `as any` or `as Record<string, unknown>` casts remain in the error extraction path"
    - "JSON.stringify(errorField) fallback is removed — replaced with concise string extraction"
    - "Role extraction uses typed function instead of inline fallback"
    - "TypeScript typecheck passes with zero errors"
  artifacts:
    - path: "src/coordination/delegation/coordinator.ts"
      provides: "Zod-schematized SdkMessageShape union + typed extraction functions"
      contains: "z.object, extractSdkMessageError, extractSdkMessageRole"
      min_lines: 20
  key_links:
    - from: "coordinator.ts (new extraction functions)"
      to: "coordinator.ts lines 235-244 (old triple-fallback)"
      via: "replacement — old pattern removed, typed extraction used"
      pattern: "extractSdkMessageError|extractSdkMessageRole"
---

<objective>
Replace the triple-fallback pattern in coordinator.ts lines 235-244 with a typed, Zod-schematized `SdkMessageShape` extraction.

**Purpose:** The current code uses ad-hoc `as SdkMessage` casts and `as Record<string, unknown>` with `JSON.stringify(errorField)` fallback that produces unhelpful long error strings. A typed Zod schema + extraction functions will provide clean, predictable error data without relying on type casts.

**Output:** Modified `src/coordination/delegation/coordinator.ts` with:
1. Zod `sdkMessageSchema` union covering both `info.*` and top-level shapes
2. `extractSdkMessageError(msg)` — returns concise error string or `undefined`
3. `extractSdkMessageRole(msg)` — returns role string or `undefined`
4. Lines 235-244 rewritten to use typed extraction instead of inline fallback
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/C5-Error-Handling-Code-Quality/C5-SPEC.md
@.planning/C5-Error-Handling-Code-Quality/C5-RESEARCH.md

The Zod version is `^4.4.3`. In Zod v4, `z.object()` and `z.union()` are used. `z.union()` accepts an array of schemas. See RESEARCH.md line 115 for the API compatibility note.

The existing `SdkMessage` and `SdkMessageInfo` interfaces at coordinator.ts lines 18-33 serve as the shape reference for the Zod schema. See RESEARCH.md lines 169-197 for the conceptual extract function pattern.

The file is 505 LOC. The affected region is lines 230-260.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create Zod schema + typed extraction functions</name>
  <files>src/coordination/delegation/coordinator.ts</files>
  <read_first>
    - src/coordination/delegation/coordinator.ts (lines 1-50 for imports + interface definitions, lines 230-260 for the target code)
  </read_first>
  <behavior>
    - `extractSdkMessageError(msg)`: Given a parsed message object, returns a concise error string from `info.error` or `error` field, or `undefined` if no error. For object errors, extracts `.message` property; falls back to `String(errorField)` — NOT `JSON.stringify()`.
    - `extractSdkMessageRole(msg)`: Given a parsed message object, returns the role string from `info.role ?? role`, or `undefined`.
    - The Zod schema `sdkMessageSchema` validates objects with optional `role`, `info.role`, `info.error`, and `error` fields.
    - Edge case: `{ info: { error: { message: "fail" } } }` → "fail" (not JSON stringified object).
    - Edge case: `{ error: "string error" }` → "string error".
    - Edge case: `{ info: { role: "assistant" }, role: "user" }` → role is "assistant" (info takes priority).
    - Edge case: `{}` → error is `undefined`, role is `undefined`.
  </behavior>
  <action>
    Import `z` from an existing Zod import path used elsewhere in the codebase (search for `import.*zod` in `src/` to find the correct import style — do NOT add a new dependency).

    After the existing `SdkMessage` and `SdkMessageInfo` interfaces at lines 18-33, add:

    1. A `sdkMessageSchema` Zod object schema covering the same shape as `SdkMessageInfo` + `SdkMessage`:
       - `role?: z.string().optional()`
       - `info?: z.object({ role: z.string().optional(), error: z.unknown().optional() }).optional()`
       - `error?: z.unknown().optional()`

    2. A function `extractSdkMessageRole(msg: z.infer<typeof sdkMessageSchema>): string | undefined` that returns `msg?.info?.role ?? msg?.role`.

    3. A function `extractSdkMessageError(msg: z.infer<typeof sdkMessageSchema>): string | undefined` that returns `undefined` if no error field, otherwise extracts a concise string:
       - If `errorField` is an object with `.message` string property → return `.message`
       - If `errorField` is an object without `.message` → return `String(errorField)` (NOT `JSON.stringify`)
       - If `errorField` is a string/primitive → return `String(errorField)`

    **Key constraints:**
    - Do NOT add `z.union()` — a single `z.object()` with optional fields suffices since both shapes are merged
    - Do NOT use `zod@^3` API patterns (Zod v4 uses `z.string().optional()`, not `z.string().optional()` — actually same API for basics)
    - Do NOT use `as any`, `as Record<string, unknown>`, or `as SdkMessage` anywhere in the new code
    - Functions must be `export`-ed (may be used by tests or other modules)
    - Place functions right after `sdkMessageSchema` definition, before the `DelegationCoordinator` class
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
    <automated>grep -n 'as Record<unknown' src/coordination/delegation/coordinator.ts; test $? -eq 1 || echo "FAIL: as Record still present"</automated>
  </verify>
  <done>
    Zod schema defined, both extraction functions exported, typecheck clean, zero type casts in new code
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace triple-fallback with typed extraction</name>
  <files>src/coordination/delegation/coordinator.ts</files>
  <read_first>
    - src/coordination/delegation/coordinator.ts (lines 230-260 for the exact triple-fallback code, lines 18-50 for the new schema/functions from Task 1)
  </read_first>
  <action>
    Replace lines 235-244 in the `handlePossibleStall` method (inside `find()` callback and `if (lastAssistantMessage)` block):

    **Before (lines 235-244):**
    ```typescript
    const lastAssistantMessage = [...messages].reverse().find(m => {
      const role = (m as SdkMessage)?.info?.role ?? (m as SdkMessage)?.role
      return role === "assistant"
    })
    if (lastAssistantMessage) {
      const errorField = (lastAssistantMessage as SdkMessage)?.info?.error ?? (lastAssistantMessage as SdkMessage)?.error
      if (errorField) {
        const errorMsg = typeof errorField === "object" && errorField !== null
          ? (((errorField as Record<string, unknown>)?.message) || JSON.stringify(errorField))
          : String(errorField)
        record.error = `[Harness] Child session assistant error: ${errorMsg}`
    ```

    **After:**
    ```typescript
    const lastAssistantMessage = [...messages].reverse().find(m => {
      // Per D-02: typed extraction via Zod-schematized body; fallback semantics preserved
      const parsed = sdkMessageSchema.safeParse(m)
      return parsed.success && extractSdkMessageRole(parsed.data) === "assistant"
    })
    if (lastAssistantMessage) {
      const parsed = sdkMessageSchema.safeParse(lastAssistantMessage)
      const errorMsg = parsed.success ? extractSdkMessageError(parsed.data) : undefined
      if (errorMsg) {
        record.error = `[Harness] Child session assistant error: ${errorMsg}`
    ```

    **Critical details:**
    - Keep `!record || record.executionState === "confirmed"` guard and outer try/catch structure unchanged
    - Keep `this.failDispatch(delegationId, new Error(record.error))` logic unchanged
    - Keep `record.executionState = "stalled"` unchanged
    - The `JSON.stringify(errorField)` fallback must be COMPLETELY removed — replaced by `String(errorField)` in `extractSdkMessageError`
    - Verify no `as any`, `as SdkMessage`, or `as Record<string, unknown>` remains in the modified region
    - Type assertion on `m` (line 236) is removed since `sdkMessageSchema.safeParse(m)` handles the typing
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
    <automated>grep -n 'JSON\.stringify.*errorField' src/coordination/delegation/coordinator.ts; test $? -eq 1 || echo "FAIL: JSON.stringify still present"</automated>
    <automated>! grep -n 'as SdkMessage' src/coordination/delegation/coordinator.ts | head -5</automated>
    <automated>! grep -n 'as Record<' src/coordination/delegation/coordinator.ts</automated>
  </verify>
  <done>
    Triple-fallback removed, typed extraction used, zero `as any`/`as SdkMessage`/`as Record` in error path, typecheck clean
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| SDK message data → coordinator | External message shapes cross from OpenCode SDK into harness code |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-C5-01 | Tampering | coordinator.ts typed extraction | mitigate | `safeParse` validates SDK messages at runtime; malformed messages return `success: false` and fall through gracefully (role not found → stall timeout) |
| T-C5-02 | Information Disclosure | extractSdkMessageError | mitigate | Error message is bounded via `String(errorField)` (not full JSON.stringify); no raw SDK message shapes leaked into error strings |
</threat_model>

<verification>
- [ ] `grep -n 'as SdkMessage' src/coordination/delegation/coordinator.ts` returns zero matches in the error extraction path
- [ ] `grep -n 'as Record<' src/coordination/delegation/coordinator.ts` returns zero matches
- [ ] `grep -n 'JSON.stringify.*errorField' src/coordination/delegation/coordinator.ts` returns zero matches
- [ ] `grep -n 'extractSdkMessageError\|extractSdkMessageRole\|sdkMessageSchema' src/coordination/delegation/coordinator.ts` shows both functions + schema defined and used
- [ ] `npm run typecheck` passes with zero errors
</verification>

<success_criteria>
- coordinator.ts error extraction uses typed Zod schema + extraction functions
- Zero inline type casts in the extraction path
- JSON.stringify(errorField) fallback eliminated
- Typecheck clean
- Existing test suite passes (no behavioral change — error extraction equivalent to before)
</success_criteria>

<output>
Create `.planning/phases/C5-Error-Handling-Code-Quality/C5-01-SUMMARY.md` when done
</output>
