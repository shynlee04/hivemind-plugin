# Deep Analysis: Tool Surface (`src/tools/`)

**Analysis Date:** 2026-05-21

## 1. Overview

`src/tools/` is the Hard Harness write-side sector — CQRS mutation authority for the Hivemind OpenCode plugin. It contains **24 registered tools** across 5 subdirectories. This document analyzes every tool's factory signature, Zod schema, `tool()` call pattern, dependency shape, return envelope, `ToolContext` usage, test coverage, and quality issues.

### Directory Inventory

```
src/tools/
├── AGENTS.md                    # Sector guidance (L5)
├── config/                      # 5 source files → 4 tools
│   ├── bootstrap-init.ts
│   ├── bootstrap-recover.ts
│   ├── configure-primitive.ts
│   ├── configure-primitive-paths.ts  # Helper — NOT a tool
│   └── validate-restart.ts
├── delegation/                  # 3 source files → 2 tools
│   ├── delegate-task.ts
│   ├── delegation-status.ts
│   └── types.ts
├── hivemind/                    # 10 source files → 11 tools
│   ├── hivemind-agent-work.ts          # → 2 tools (create + export)
│   ├── hivemind-command-engine.ts
│   ├── hivemind-doc.ts
│   ├── hivemind-pressure.ts
│   ├── hivemind-sdk-supervisor.ts
│   ├── hivemind-session-view.ts
│   ├── hivemind-trajectory.ts
│   ├── run-background-command.ts
│   ├── session-context.ts              # MISPLACED — should be under session/
│   ├── session-hierarchy.ts            # MISPLACED — should be under session/
│   └── session-tracker.ts              # MISPLACED — should be under session/
├── prompt/                      # 5 source files → 2 tools
│   ├── prompt-analyze/{index,tools,types}.ts
│   └── prompt-skim/{index,tools,types}.ts
└── session/                     # 4 source files → 2 tools
    ├── execute-slash-command.ts
    ├── session-journal-export.ts
    └── session-patch/{index,tools,types}.ts
```

**Total: 27 source files producing 24 tool registrations in `plugin.ts`.**

---

## 2. Per-Tool Analysis

### 2.1 Config Tools

#### 2.1.1 `configure-primitive`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/config/configure-primitive.ts` (490 LOC) |
| **Factory sig** | `createConfigurePrimitiveTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
| **Zod schema** | `ConfigurePrimitiveInputSchema` — inline in tool file, ~54 lines with `.refine()` |
| **tool() call** | Standard `tool({ description, args, async execute })` with `tool.schema` helpers |
| **Dependency shape** | Self-contained: imports compiler, workflow, path-scope, primitive-loader internally |
| **Return shape** | `renderToolResult(success(...))` / `renderToolResult(error(...))` — standard envelope |
| **ToolContext usage** | Yes — `context` is typed `unknown`, then cast to `{ directory?: string; worktree?: string }` |
| **Test coverage** | `tests/tools/configure-primitive.test.ts` — exists |
| **Quality** | Mixed. 490 LOC exceeds the 500 LOC cap by 10 lines (including imports). `handleCompile()` is 103 lines alone. Uses dynamic `import()` in handleResume. Inline Zod for batch items duplicates type knowledge. |
| **Grade** | NEEDS_REFACTOR — too large, inline schema duplicates |

#### 2.1.2 `validate-restart`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/config/validate-restart.ts` (116 LOC) |
| **Factory sig** | `createValidateRestartTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
| **Zod schema** | `ValidateRestartInputSchema` — inline, 4 lines |
| **tool() call** | Standard pattern |
| **Dependency shape** | Imports `loadPrimitives`, `detectFrameworks`, `validateCrossPrimitive`, `validateRuntime` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context` — unused (prefix `_`) |
| **Test coverage** | `tests/tools/validate-restart.test.ts` — exists |
| **Quality** | Clean. Well-structured. Under 500 LOC. |
| **Grade** | GOOD |

#### 2.1.3 `bootstrap-init`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/config/bootstrap-init.ts` (309 LOC) |
| **Factory sig** | `createBootstrapInitTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
| **Zod schema** | `BootstrapInitInputSchema` — imported from `schema-kernel/bootstrap.schema.ts` |
| **tool() call** | Standard pattern |
| **Dependency shape** | Pure function — all filesystem work happens in `bootstrapInit()` export |
| **Return shape** | Standard envelope |
| **ToolContext usage** | None — `execute(rawArgs)` has no context parameter |
| **Test coverage** | `tests/tools/bootstrap-init.test.ts` — exists |
| **Quality** | Good export strategy: `bootstrapInit()` is exported for testable unit testing. 309 LOC modular. JSDoc throughout. |
| **Grade** | GOOD |

#### 2.1.4 `bootstrap-recover`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/config/bootstrap-recover.ts` (219 LOC) |
| **Factory sig** | `createBootstrapRecoverTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
| **Zod schema** | `BootstrapRecoverInputSchema` — imported from `schema-kernel/bootstrap.schema.ts` |
| **tool() call** | Standard pattern |
| **Dependency shape** | Pure function — `bootstrapRecover()` exported separately |
| **Return shape** | Standard envelope |
| **ToolContext usage** | None — `execute(rawArgs)` has no context parameter |
| **Test coverage** | `tests/tools/bootstrap-recover.test.ts` — exists |
| **Quality** | Good. Same testable pattern as `bootstrap-init`. |
| **Grade** | GOOD |

#### 2.1.5 `configure-primitive-paths`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/config/configure-primitive-paths.ts` (45 LOC) |
| **Nature** | Helper module — NOT a tool, no `tool()` call |
| **Purpose** | Path resolution shared by `configure-primitive.ts` |
| **Quality** | Clean module. |
| **Grade** | N/A (helper) |

#### 2.1.6 Config Tools Import Source Issue

All 4 config tools import from `@opencode-ai/plugin` instead of `@opencode-ai/plugin/tool`. While this still exports `tool`, it also imports the entire plugin module. This is an ANTI-PATTERN compared to hivemind/delegation tools that use the narrow `/tool` subpath import.

---

### 2.2 Delegation Tools

#### 2.2.1 `delegate-task`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/delegation/delegate-task.ts` (93 LOC) |
| **Factory sig** | `createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } })` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `DelegateTaskV2Schema` — inline, 4 lines |
| **tool() call** | Uses `tool.schema` helpers (`s.string()`, `s.object({})`) |
| **Dependency shape** | Takes `coordinator` interface + optional config object |
| **Return shape** | Standard envelope via `renderToolResult()` |
| **ToolContext usage** | `context.sessionID`, `context.directory`, `context.worktree` — good |
| **Test coverage** | `tests/tools/delegate-task.test.ts`, `tests/tools/delegation/delegate-task-v2.test.ts`, `tests/tools/delegation/delegate-task-e2e.test.ts` — excellent |
| **Quality** | Clean. Well-structured. Proper session stacking via JSON context parsing. |
| **Grade** | GOOD |

#### 2.2.2 `delegation-status`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/delegation/delegation-status.ts` (208 LOC) |
| **Factory sig** | `createDelegationStatusTool(delegationManager: ManagerLike, deps: StatusDeps = {})` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `DelegationControlSchema` + `DelegationStatusInputSchema` — both inline, ~16 lines |
| **tool() call** | Uses `tool.schema` with `.string().optional().describe()` |
| **Dependency shape** | Manager interface + optional StatusDeps for DI |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `context.sessionID` — verified with error message if missing |
| **Test coverage** | `tests/tools/delegation-status.test.ts`, `tests/tools/delegation/delegation-status-v2.test.ts` — exists |
| **Quality** | Mixed. Complex `renderDelegationV2()` has 5 inline ternaries. `renderList` and `handleControl` are helper functions. 208 LOC is reasonable. Has `UNSUPPORTED_REPLACEMENT_MESSAGE` constant indicating known limitations. |
| **Grade** | NEEDS_REFACTOR — renderDelegationV2 too dense, control flow complex |

#### 2.2.3 `delegation/types.ts`

Just type re-exports. Clean.

---

### 2.3 Hivemind Tools

#### 2.3.1 `hivemind-doc`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-doc.ts` (45 LOC) |
| **Factory sig** | `createHivemindDocTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `DocIntelligenceInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Uses `tool.schema` helpers |
| **Dependency shape** | Takes `projectRoot` — delegates to `executeDocIntelligenceAction` from features |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-doc.test.ts` — exists |
| **Quality** | Excellent. Small, focused, delegates to feature module. |
| **Grade** | GOOD |

#### 2.3.2 `hivemind-agent-work` (2 tools: create + export)

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-agent-work.ts` (152 LOC — 2 tools) |
| **Factory sig** | `createHivemindAgentWorkCreateTool(projectRoot: string)`, `createHivemindAgentWorkExportTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `AgentWorkCreateToolInputSchema`, `AgentWorkExportToolInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Both standard |
| **Dependency shape** | `projectRoot` only — delegates to `createAgentWorkContract` / `exportAgentWorkContract` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-agent-work.test.ts` — exists |
| **Quality** | Excellent. Clean separation of create/export into separate exported action functions for testability. |
| **Grade** | GOOD |

#### 2.3.3 `hivemind-trajectory`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-trajectory.ts` (112 LOC) |
| **Factory sig** | `createHivemindTrajectoryTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `TrajectoryToolInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Standard |
| **Dependency shape** | `projectRoot` — delegates to `inspectTrajectoryLedger`, `traverseTrajectory`, etc. |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-trajectory.test.ts` — exists |
| **Quality** | Excellent. Clean switch-based action dispatch. JSDoc throughout. |
| **Grade** | GOOD |

#### 2.3.4 `hivemind-pressure`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-pressure.ts` (94 LOC) |
| **Factory sig** | `createHivemindPressureTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `RuntimePressureToolInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Standard |
| **Dependency shape** | `projectRoot` — delegates to `classifyRuntimePressure`, `detectRuntimePressure`, etc. |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-pressure.test.ts` — exists |
| **Quality** | Excellent. Clean switch dispatch, delegates to features. |
| **Grade** | GOOD |

#### 2.3.5 `hivemind-sdk-supervisor`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-sdk-supervisor.ts` (53 LOC) |
| **Factory sig** | `createHivemindSdkSupervisorTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SdkSupervisorToolInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Standard |
| **Dependency shape** | No deps — delegates to `executeSdkSupervisorAction` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-sdk-supervisor.test.ts` — tests `executeSdkSupervisorToolAction` directly |
| **Quality** | Excellent. Small, focused. |
| **Grade** | GOOD |

#### 2.3.6 `hivemind-command-engine`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-command-engine.ts` (67 LOC) |
| **Factory sig** | `createHivemindCommandEngineTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `CommandEngineToolInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Standard |
| **Dependency shape** | `projectRoot` — delegates to `executeCommandEngineAction` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind-command-engine.test.ts` — tests `executeCommandEngineToolAction` |
| **Quality** | Excellent. Clean delegation to routing module. |
| **Grade** | GOOD |

#### 2.3.7 `hivemind-session-view`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/hivemind-session-view.ts` (127 LOC) |
| **Factory sig** | `createHivemindSessionViewTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionViewInputSchema` — imported from `schema-kernel/` |
| **tool() call** | Uses `tool.schema.enum()` and `tool.schema.string()` (WITHOUT `const s = tool.schema` pattern) |
| **Dependency shape** | `projectRoot` — reads continuity, delegations, trajectory directly via `readFile` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | **NONE** — no test file found for hivemind-session-view |
| **Quality** | Clean structure but has direct `readFile` I/O. No `safeSessionPath` usage in `readDelegationsForSession` — it resolves raw paths instead. |
| **Grade** | NEEDS_REFACTOR — no tests, direct I/O in tool |

#### 2.3.8 `session-context` **(MISPLACED IN hivemind/)**

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/session-context.ts` (224 LOC) |
| **Factory sig** | `createSessionContextTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionContextInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
| **tool() call** | Uses `tool.schema.enum()` directly |
| **Dependency shape** | `projectRoot` — reads session tracker data directly |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind/session-context.test.ts` — exists |
| **Quality** | Good. Clean multi-action dispatch. But **MISLOCATED** — belongs in `src/tools/session/` not `src/tools/hivemind/`. |
| **Grade** | NEEDS_REFACTOR — mislocated |

#### 2.3.9 `session-hierarchy` **(MISPLACED IN hivemind/)**

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/session-hierarchy.ts` (228 LOC) |
| **Factory sig** | `createSessionHierarchyTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionHierarchyInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
| **tool() call** | Uses `tool.schema.enum()` directly |
| **Dependency shape** | `projectRoot` — reads continuity files directly |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind/session-hierarchy.test.ts` — exists |
| **Quality** | Good. Recursive depth computation. But **MISLOCATED** — belongs in `src/tools/session/`. |
| **Grade** | NEEDS_REFACTOR — mislocated |

#### 2.3.10 `session-tracker` **(MISPLACED IN hivemind/)**

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/session-tracker.ts` (373 LOC) |
| **Factory sig** | `createSessionTrackerTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionTrackerInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
| **tool() call** | Uses `tool.schema` directly |
| **Dependency shape** | `projectRoot` — reads session tracker data |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/hivemind/session-tracker.test.ts` — exists |
| **Quality** | Complex but well-organized. 373 LOC — close to 500 cap. But **MISLOCATED** — belongs in `src/tools/session/`. |
| **Grade** | NEEDS_REFACTOR — mislocated, approaches 500 LOC cap |

#### 2.3.11 `run-background-command`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/hivemind/run-background-command.ts` (228 LOC) |
| **Factory sig** | `createRunBackgroundCommandTool(args: { delegationManager: DelegationManager; ptyManager: PtyManager | null })` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `RunBackgroundCommandInputSchema` with `z.discriminatedUnion` — 5 variant schemas, inline |
| **tool() call** | Uses `tool.schema` helpers |
| **Dependency shape** | Object with `delegationManager` and `ptyManager` |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `context.sessionID`, `context.directory` — good |
| **Test coverage** | `tests/tools/run-background-command.test.ts` — exists |
| **Quality** | Excellent. Has explicit `requireCallerSessionId()`, `requireVisiblePtyDelegation()`, `parseRunBackgroundCommandInput()`, `assertExecutableCommandShape()` — comprehensive validation. Uses `z.discriminatedUnion` (best practice). |
| **Grade** | GOOD |

---

### 2.4 Prompt Tools

#### 2.4.1 `prompt-analyze`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/prompt/prompt-analyze/tools.ts` (169 LOC) |
| **Factory sig** | `createPromptAnalyzeTool(_projectRoot: string)` — takes `projectRoot` but ignores it |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `PromptAnalysisResultSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
| **tool() call** | Standard with `tool.schema` |
| **Dependency shape** | None (projectRoot unused) |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context` — unused |
| **Test coverage** | `tests/tools/prompt-analyze.test.ts` — exists |
| **Quality** | Good logic (contradiction detection, cross-line comparison). Result validated against schema. `_projectRoot` param unused but accepted for factory consistency. |
| **Grade** | GOOD |

#### 2.4.2 `prompt-skim`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/prompt/prompt-skim/tools.ts` (107 LOC) |
| **Factory sig** | `createPromptSkimTool(_projectRoot: string)` — same pattern |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `PromptSkimResultSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
| **tool() call** | Standard |
| **Dependency shape** | None (projectRoot unused) |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context` — unused |
| **Test coverage** | `tests/tools/prompt-skim.test.ts` — exists |
| **Quality** | Good. Complexity scoring, path verification, URL extraction. |
| **Grade** | GOOD |

---

### 2.5 Session Tools

#### 2.5.1 `execute-slash-command`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/session/execute-slash-command.ts` (152 LOC) |
| **Factory sig** | `createExecuteSlashCommandTool(client: PluginInput["client"])` |
| **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
| **Zod schema** | **NONE** — no schema validation. Args handled by `tool.schema` at the `tool()` level |
| **tool() call** | Uses `tool.schema.string().describe()` directly |
| **Dependency shape** | Takes the OpenCode SDK `client` object |
| **Return shape** | **DIFFERENT from all other tools** — returns `{ output, metadata }` raw object, NOT `renderToolResult(success(...))` |
| **ToolContext usage** | `ctx.metadata({...})` — uses context.metadata() for rich metadata |
| **Test coverage** | `tests/tools/execute-slash-command.test.ts` — exists |
| **Quality** | **CRITICAL ISSUE**: Breaks the standard response envelope. All other 23 tools use `renderToolResult()`. This tool returns `{ output, metadata }` directly. This works because OpenCode accepts both formats, but it's architecturally inconsistent. Also has no Zod schema for input validation — relies solely on `tool.schema.string()` which is a looser validation layer. |
| **Grade** | NEEDS_REFACTOR — return envelope inconsistency, no Zod schema |

#### 2.5.2 `session-journal-export`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/session/session-journal-export.ts` (117 LOC) |
| **Factory sig** | `createSessionJournalExportTool(): ReturnType<typeof tool>` — no deps |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionJournalExportInputSchema` — inline, 5 lines |
| **tool() call** | Uses `tool.schema` helpers |
| **Dependency shape** | No deps — calls `listSessionContinuity()`, `readPersistedDelegations()`, `buildExecutionLineage()` directly |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context: ToolContext` — unused |
| **Test coverage** | `tests/tools/session-journal-export.test.ts` — exists |
| **Quality** | Good. Clean, well-structured. Separates `markdownSummary()` renderer. |
| **Grade** | GOOD |

#### 2.5.3 `session-patch`

| Aspect | Finding |
|--------|---------|
| **File** | `src/tools/session/session-patch/tools.ts` (136 LOC) |
| **Factory sig** | `createSessionPatchTool(projectRoot: string)` |
| **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
| **Zod schema** | `SessionPatchRecordSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
| **tool() call** | Standard |
| **Dependency shape** | `projectRoot` — uses `assertPathWithinRoot` for security |
| **Return shape** | Standard envelope |
| **ToolContext usage** | `_context` — unused |
| **Test coverage** | `tests/tools/session-patch.test.ts` — exists |
| **Quality** | Good. Has path traversal protection (`assertPathWithinRoot`) and file name validation. Creates backups before patching. |
| **Grade** | GOOD |

---

## 3. Cross-Tool Analysis

### 3.1 Tool Registration Pattern (plugin.ts line 397-424)

All 24 tools are registered in a single `tool: { ... }` block in `plugin.ts`. There is ONE registration pattern, not multiple. 0 tools are "designed but never wired" — every exported factory is registered.

### 3.2 Import Source Divergence

**CRITICAL: Two different `tool()` import paths used:**

| Import | Tools Using It | Count |
|--------|---------------|-------|
| `@opencode-ai/plugin/tool` | Most hivemind, delegation, prompt, session-patch, session-journal-export | 18 |
| `@opencode-ai/plugin` | All 4 config tools + execute-slash-command | 5 |

The first import is the **narrow** subpath export. The second imports the **entire plugin module**. This is a quality inconsistency — tools in the config/ directory all use the wider import.

### 3.3 Return Envelope Divergence

**CRITICAL: execute-slash-command is the only tool that returns an unformatted `{ output, metadata }` object.** All other 23 tools use `renderToolResult(success(...))` / `renderToolResult(error(...))`.

### 3.4 Factory Signature Patterns

Three distinct patterns exist:

| Pattern | Count | Examples |
|---------|-------|----------|
| `(projectRoot: string)` | 12 | Most hivemind tools, prompt tools, session-patch |
| `()` no deps | 6 | configure-primitive, validate-restart, bootstrap-init, bootstrap-recover, sdk-supervisor, session-journal-export |
| `(specific deps)` | 6 | delegate-task, delegation-status, run-background-command, execute-slash-command |

### 3.5 Zod Schema Location

| Location | Count | Assessment |
|----------|-------|------------|
| Imported from `schema-kernel/` | 13 tools | ✓ Best practice |
| Inline in tool file | 7 tools | Needs_Refactor — duplicates type knowledge |
| No Zod schema (relies on tool.schema) | 1 tool (execute-slash-command) | Critical — no validation |

### 3.6 ToolContext Usage

| Usage | Count | Examples |
|-------|-------|----------|
| Unused (`_context`) | 17 | Most hivemind, prompt, session tools |
| `sessionID` only | 4 | delegation-status, delegate-task, run-background-command |
| `sessionID`, `metadata()` | 1 | execute-slash-command |
| `directory`, `worktree` cast | 2 | configure-primitive (via `as` cast) |

### 3.7 Location Inconsistency: 3 Session Tools Under hivemind/

Three tools that work with session state are located under `src/tools/hivemind/` instead of `src/tools/session/`:

| Tool | Current Location | Correct Location |
|------|-----------------|------------------|
| `session-context` | `src/tools/hivemind/session-context.ts` | `src/tools/session/` |
| `session-hierarchy` | `src/tools/hivemind/session-hierarchy.ts` | `src/tools/session/` |
| `session-tracker` | `src/tools/hivemind/session-tracker.ts` | `src/tools/session/` |

These don't follow the `hivemind-` naming convention (no `hivemind-` prefix). They also read from `.hivemind/` state directly rather than going through feature modules.

### 3.8 Test Coverage Summary

| Tool | Test File | Status |
|------|-----------|--------|
| delegate-task | `tests/tools/delegate-task.test.ts`, `delegation/delegate-task-v2.test.ts`, `delegation/delegate-task-e2e.test.ts` | ✅ Excellent |
| delegation-status | `tests/tools/delegation-status.test.ts`, `delegation/delegation-status-v2.test.ts` | ✅ Good |
| run-background-command | `tests/tools/run-background-command.test.ts` | ✅ Good |
| prompt-skim | `tests/tools/prompt-skim.test.ts` | ✅ Good |
| prompt-analyze | `tests/tools/prompt-analyze.test.ts` | ✅ Good |
| session-patch | `tests/tools/session-patch.test.ts` | ✅ Good |
| session-journal-export | `tests/tools/session-journal-export.test.ts` | ✅ Good |
| configure-primitive | `tests/tools/configure-primitive.test.ts` | ✅ Good |
| validate-restart | `tests/tools/validate-restart.test.ts` | ✅ Good |
| bootstrap-init | `tests/tools/bootstrap-init.test.ts` | ✅ Good |
| bootstrap-recover | `tests/tools/bootstrap-recover.test.ts` | ✅ Good |
| execute-slash-command | `tests/tools/execute-slash-command.test.ts` | ✅ Good |
| hivemind-doc | `tests/tools/hivemind-doc.test.ts` | ✅ Good |
| hivemind-trajectory | `tests/tools/hivemind-trajectory.test.ts` | ✅ Good |
| hivemind-pressure | `tests/tools/hivemind-pressure.test.ts` | ✅ Good |
| hivemind-sdk-supervisor | `tests/tools/hivemind-sdk-supervisor.test.ts` | ✅ Good |
| hivemind-command-engine | `tests/tools/hivemind-command-engine.test.ts` | ✅ Good |
| hivemind-agent-work | `tests/tools/hivemind-agent-work.test.ts` | ✅ Good |
| session-context | `tests/tools/hivemind/session-context.test.ts` | ✅ Good |
| session-hierarchy | `tests/tools/hivemind/session-hierarchy.test.ts` | ✅ Good |
| session-tracker | `tests/tools/hivemind/session-tracker.test.ts` | ✅ Good |
| **hivemind-session-view** | **NO TEST FILE FOUND** | ❌ **MISSING** |

**24 tools registered, 23 have test coverage.**

### 3.9 Module Size Analysis

| File | LOC | Cap (500) |
|------|-----|-----------|
| configure-primitive.ts | 490 | ⚠️ At limit |
| session-tracker.ts | 373 | OK |
| bootstrap-init.ts | 309 | OK |
| session-hierarchy.ts | 228 | OK |
| run-background-command.ts | 228 | OK |
| session-context.ts | 224 | OK |
| bootstrap-recover.ts | 219 | OK |
| delegation-status.ts | 208 | OK |
| prompt-analyze/tools.ts | 169 | OK |
| execute-slash-command.ts | 152 | OK |
| hivemind-agent-work.ts | 152 (2 tools) | OK |
| session-patch/tools.ts | 136 | OK |
| hivemind-session-view.ts | 127 | OK |
| validate-restart.ts | 116 | OK |
| hivemind-trajectory.ts | 112 | OK |
| prompt-skim/tools.ts | 107 | OK |
| hivemind-pressure.ts | 94 | OK |
| delegate-task.ts | 93 | OK |
| hivemind-command-engine.ts | 67 | OK |
| hivemind-sdk-supervisor.ts | 53 | OK |
| hivemind-doc.ts | 45 | OK |

`configure-primitive.ts` at 490 LOC is dangerously close to the 500 LOC module cap.

---

## 4. Tool Surface Quality Assessment

| Tool | Grade | Notes |
|------|-------|-------|
| `delegate-task` | **GOOD** | Clean factory, proper deps, good tests |
| `delegation-status` | **GOOD** | Complex but well-structured. renderDelegationV2 dense |
| `run-background-command` | **GOOD** | Excellent validation, z.discriminatedUnion, access control |
| `prompt-skim` | **GOOD** | Clean, deterministic, schema-validated |
| `prompt-analyze` | **GOOD** | Clean, deterministic, schema-validated |
| `session-patch` | **GOOD** | Security-conscious with path traversal protection |
| `session-journal-export` | **GOOD** | Clean, well-structured |
| `execute-slash-command` | **NEEDS_REFACTOR** | Return envelope divergence, no Zod schema, no renderToolResult |
| `configure-primitive` | **NEEDS_REFACTOR** | 490 LOC (at 500 cap), inline schema, handleCompile too large |
| `validate-restart` | **GOOD** | Clean, well-structured |
| `bootstrap-init` | **GOOD** | Testable export pattern |
| `bootstrap-recover` | **GOOD** | Testable export pattern |
| `hivemind-doc` | **GOOD** | Small, focused |
| `hivemind-agent-work` | **GOOD** | Excellent separation |
| `hivemind-trajectory` | **GOOD** | Clean switch dispatch |
| `hivemind-pressure` | **GOOD** | Clean switch dispatch |
| `hivemind-sdk-supervisor` | **GOOD** | Small, focused |
| `hivemind-command-engine` | **GOOD** | Clean delegation |
| `hivemind-session-view` | **NEEDS_REFACTOR** | No tests, direct I/O |
| `session-context` | **NEEDS_REFACTOR** | Mislocated in hivemind/ |
| `session-hierarchy` | **NEEDS_REFACTOR** | Mislocated in hivemind/ |
| `session-tracker` | **NEEDS_REFACTOR** | Mislocated in hivemind/, approaching 500 LOC |
| Config tools (import) | **NEEDS_REFACTOR** | All 4 use `@opencode-ai/plugin` instead of `/tool` |

### Summary

| Grade | Count |
|-------|-------|
| **GOOD** | 16 |
| **NEEDS_REFACTOR** | 7 |
| **BROKEN** | 0 |

---

## 5. Recommendations

### Critical (blocker)
1. **Fix `execute-slash-command` return envelope**: Add `renderToolResult()` wrapping and a proper Zod schema to match all other 23 tools.

### High priority
2. **Add tests for `hivemind-session-view`**: Currently the only tool with zero test coverage.
3. **Move `session-context`, `session-hierarchy`, `session-tracker`** from `src/tools/hivemind/` to `src/tools/session/`.
4. **Unify `tool()` import across all tools**: Standardize on `@opencode-ai/plugin/tool` (narrow import).

### Medium priority
5. **Refactor `configure-primitive.ts`** — split `handleCompile()` (103 lines) into smaller functions. Inline Zod schema should be moved to `schema-kernel/`.
6. **Refactor `delegation-status.ts` `renderDelegationV2()`** — 5 inline ternaries in the spread expression are unreadable.
7. **Refactor `session-tracker.ts`** — at 373 lines, it should be split or moved to a multi-file structure.

### Low priority
8. **Remove unused `_projectRoot` from prompt tools** — or make the parameter truly optional.
9. **Standardize ToolContext typing** — some tools use `type ToolContext = { sessionID?: string }`, others use `{ sessionID: string; directory?: string; worktree?: string }`, others cast from `unknown`.
10. **`hivemind-session-view.ts`** uses raw `readFile` for delegations — should use `safeSessionPath` consistently.

---

*Analysis performed: 2026-05-21 — all 24 tools read and analyzed.*
