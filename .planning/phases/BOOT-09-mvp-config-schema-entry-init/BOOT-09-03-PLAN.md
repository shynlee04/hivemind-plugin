---
phase: BOOT-09
plan: 03
type: execute
wave: 2
depends_on:
  - BOOT-09-01
files_modified:
  - src/hooks/guards/tool-guard-hooks.ts
autonomous: true
requirements:
  - REQ-03
user_setup: []

must_haves:
  truths:
    - "tool.execute.before injects language reminder for Write tool targeting .md at document_paths"
    - "tool.execute.before injects language reminder for Edit tool targeting .md at document_paths"
    - "tool.execute.before injects generic language reminder for apply_patch tool"
    - "Language reminder contains the document language value from config"
    - "Reminder is a pre-execution instruction (NOT content validation) per D-12"
    - "ToolGuardDependencies includes hivemindConfig"
    - "Non-.md files at document_paths still get language reminder"
    - ".md files outside document_paths do NOT get language reminder"
  artifacts:
    - path: "src/hooks/guards/tool-guard-hooks.ts"
      provides: "Document language tool guard logic + hivemindConfig in ToolGuardDependencies"
      contains: "hivemindConfig"
  key_links:
    - from: "tool-guard-hooks.ts"
      to: "HivemindConfigsSchema.document_paths"
      via: "deps.hivemindConfig.document_paths"
      pattern: "document_paths"
    - from: "tool.execute.before handler"
      to: "output.args.filePath"
      via: "Write/Edit args extraction"
      pattern: "filePath"
---

<objective>
Add a document language tool guard in `tool-guard-hooks.ts` that injects a language reminder when Write/Edit/apply_patch tools target files under `document_paths`.

**Purpose:** Layer 2 enforcement for `documents_and_artifacts_language` — pre-execution instruction reminder that supplements the Layer 1 system prompt.
**Output:** Modified `tool.execute.before` handler + `ToolGuardDependencies` update + tests.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-CONTEXT.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-RESEARCH.md

<interfaces>
<!-- Key types and patterns the executor needs -->

From `src/hooks/guards/tool-guard-hooks.ts:26-30` — ToolGuardDependencies:
```typescript
export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
}
```

From `src/hooks/guards/tool-guard-hooks.ts:66-111` — Current tool.execute.before handler:
```typescript
"tool.execute.before": async (input: BeforeInput, output: BeforeOutput): Promise<void> => {
  classifyHookEffect("tool.execute.before")
  const sessionID = asString(getNestedValue(input, ["sessionID"]))
  const toolName = asString(getNestedValue(input, ["tool"]))
  const rawArgs = getNestedValue(output, ["args"])
  if (!sessionID || !toolName) return
  // ... budget + circuit breaker logic ...
  lifecycleManager?.noteObservedActivity(sessionID, "tool.execute.before")
},
```

**Write tool args shape (verified via zread anomalyco/opencode):**
```typescript
// Write tool args
{ filePath: string, content: string }
```

**Edit tool args shape (verified via zread anomalyco/opencode):**
```typescript
// Edit tool args
{ filePath: string, oldString: string, newString: string, replaceAll?: boolean }
```

**apply_patch tool args shape (verified via zread anomalyco/opencode):**
```typescript
// apply_patch args — NO filePath field
{ patchText: string }
```

Path matching logic needed:
- Extract `args.filePath` for Write/Edit (absolute path, e.g. `/Users/user/project/.hivemind/planning/doc.md`)
- File is under `document_paths` if the path contains any of the configured path prefixes
- Config paths are relative to project root (e.g. `.hivemind/planning/`)
- The absolute path will contain the relative path segment
- Match: check if the absolute filePath contains the relative document_path segment
- Example: `filePath = "/project/.hivemind/planning/notes.md"` matches `document_paths = [".hivemind/planning/"]` because path contains `".hivemind/planning/"`

From `src/shared/helpers.ts` — `asString` and `getNestedValue` are already imported in tool-guard-hooks.ts.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement document language tool guard with hivemindConfig + tests</name>
  <files>src/hooks/guards/tool-guard-hooks.ts</files>
  <read_first>src/hooks/guards/tool-guard-hooks.ts (full file, 156 lines)</read_first>
  <action>
    Two changes to `src/hooks/guards/tool-guard-hooks.ts`:

    **Change 1 — Add `hivemindConfig` to `ToolGuardDependencies` interface** (after line 29):
    ```typescript
    import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
    // Add to ToolGuardDependencies:
    hivemindConfig?: HivemindConfigs
    ```

    **Change 2 — Add document language tool guard logic** at the end of `tool.execute.before` handler, AFTER the existing budget/circuit-breaker logic (after line 108, before the lifecycle note at line 110):

    ```typescript
    // BOOT-09: Document Language Tool Guard (Layer 2 — D-11)
    // Pre-execution language reminder for Write/Edit/apply_patch at document_paths.
    // Per D-12: this is NOT content validation — it's a pre-execution instruction reminder.
    if (deps.hivemindConfig?.documents_and_artifacts_language && deps.hivemindConfig.document_paths) {
      const docLang = deps.hivemindConfig.documents_and_artifacts_language
      const docPaths = deps.hivemindConfig.document_paths
      const args = getNestedValue(output, ["args"]) as Record<string, unknown> | undefined
      let filePath: string | undefined

      if (toolName === "write" || toolName === "edit") {
        filePath = asString(getNestedValue(args, ["filePath"]))
      } else if (toolName === "apply_patch") {
        // apply_patch has no filePath field — inject generic reminder for MVP
        // Per RESEARCH.md Pitfall 3 + Open Question 1: skip path-specific detection
        const argsObj = args as Record<string, unknown> | undefined
        const patchText = argsObj?.patchText
        if (typeof patchText === "string") {
          argsObj!["_languageReminder"] = `REMINDER: All .md files in this patch MUST be written in ${docLang}.`
        }
      }

      if (filePath) {
        const isUnderDocPath = docPaths.some((p: string) => filePath!.includes(p))
        if (isUnderDocPath && filePath.endsWith(".md")) {
          // Prepend language instruction to content/newString
          const reminder = `[LANGUAGE: Write this file in ${docLang} per Language Governance.]`
          if (toolName === "write" && typeof (args as Record<string, unknown>)?.content === "string") {
            ;(args as Record<string, unknown>).content = `${reminder}\n${(args as Record<string, unknown>).content}`
          } else if (toolName === "edit" && typeof (args as Record<string, unknown>)?.newString === "string") {
            ;(args as Record<string, unknown>).newString = `${reminder}\n${(args as Record<string, unknown>).newString}`
          }
        }
      }
    }
    ```

    Key design decisions:
    - Path matching uses `.includes()` for prefix matching (absolute paths contain the relative config path)
    - Tool guard fires for ALL sessions (including child) — per SPEC: the tool guard is a reminder, not a main-session-only feature
    - Per D-12: this is NOT content validation — it's a pre-execution instruction reminder
    - Per RESEARCH.md Pitfall 3: `apply_patch` has no `filePath` — inject generic reminder without path-specific targeting for MVP
    - Per SPEC.md Boundary: `apply_patch` is still covered by Layer 1 (system prompt)

    **Add tests in `tests/hooks/create-tool-guard-hooks.test.ts`:**
    - Test tool guard injects reminder for Write when .md file is under document_paths
    - Test tool guard injects reminder for Edit when .md file is under document_paths
    - Test tool guard does NOT inject reminder for Write when file is outside document_paths
    - Test tool guard does NOT inject reminder for non-.md files under document_paths
    - Test tool guard injects generic reminder for apply_patch (no path-specific check)
    - Test apply_patch receives `_languageReminder` in args with the configured language
    - Test apply_patch skips reminder when documents_and_artifacts_language is not set (defensive)
    - Test tool guard does NOT inject reminder for non-matching tools (e.g., "read")
    - Test reminder contains the configured documents_and_artifacts_language value
    - Test tool guard works with default document_paths (`[".hivemind/planning/"]`)
    - Test tool guard works with custom document_paths
    - Test tool guard does NOT throw when hivemindConfig is undefined (defensive)
    - Test existing budget/circuit-breaker behavior is unchanged

    **Test pattern** — following the existing factory:
    ```typescript
    function createFakeStateManager() { /* existing pattern */ }
    // Build hooks with hivemindConfig
    const hooks = createToolGuardHooks({
      stateManager: fakeStateManager as never,
      hivemindConfig: HivemindConfigsSchema.parse({
        documents_and_artifacts_language: "en",
        document_paths: [".hivemind/planning/"],
      }),
    })
    ```
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/create-tool-guard-hooks.test.ts -t "language|Language|document|apply_patch"</automated>
  </verify>
  <acceptance_criteria>
    1. `ToolGuardDependencies` includes `hivemindConfig?: HivemindConfigs`
    2. Write tool at a .md file under `document_paths` gets language reminder prepended to `content`
    3. Edit tool at a .md file under `document_paths` gets language reminder prepended to `newString`
    4. Write/Edit at .md files OUTSIDE `document_paths` gets NO reminder
    5. Non-.md files under `document_paths` get NO reminder
    6. `apply_patch` gets generic `_languageReminder` without path-specific targeting (MVP scope per D-12 and RESEARCH.md Pitfall 3)
    7. `apply_patch` reminder is skipped when config has no `documents_and_artifacts_language` (defensive)
    8. Reminder contains the configured `documents_and_artifacts_language` value
    9. Non-matching tools (read/bash/etc) get NO reminder
    10. No throw when `hivemindConfig` is undefined
    11. Per D-12: the reminder is a pre-execution instruction — not post-hoc content validation
    12. All existing tool-guard tests pass without regression
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| tool.execute.before → output.args | Mutates tool arguments before execution — modifies content/newString, not access control |
| Config paths → file system check | Path prefix matching on absolute paths — no glob expansion in MVP |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-BOOT09-05 | T (Tampering) | output.args mutation | mitigate | Only prepends reminder to existing content — never overwrites or removes existing content |
| T-BOOT09-06 | I (Info Disclosure) | Path matching | accept | Paths come from config, comparison is substring-based on absolute paths — no traversal risk |
| T-BOOT09-07 | T (Tampering) | apply_patch generic reminder | accept | No path parsing for MVP — Layer 1 (system prompt) covers apply_patch language enforcement |
</threat_model>

<verification>
1. `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts` — all tool guard tests pass
2. `npm run typecheck` passes (requires Plan 02 to have passed hivemindConfig)
3. `npx vitest run` — no regressions in any tests
</verification>

<success_criteria>
- `ToolGuardDependencies` includes `hivemindConfig` for reading `documents_and_artifacts_language` and `document_paths`
- `tool.execute.before` injects language reminder for Write/Edit at .md files under configured paths
- `apply_patch` gets generic `_languageReminder` without path-specific targeting (MVP scope per D-12 and RESEARCH.md Pitfall 3)
- Per D-12: enforcement is via instruction, not post-hoc content validation
- Per D-11 Layer 2: tool guard supplements Layer 1 system prompt instruction
- All existing tests pass without regression
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-03-SUMMARY.md`
</output>
