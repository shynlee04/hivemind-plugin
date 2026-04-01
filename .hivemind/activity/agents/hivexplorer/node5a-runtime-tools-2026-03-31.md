---
title: "NODE 5a: Runtime Tools — Schema and Structure"
date: 2026-03-31
agent: hivexplorer
node: 5a
scope: "hivemind_runtime_status and hivemind_runtime_command tool definitions"
git_commit: "85f8cbe7"
branch: "v2.9.5-detox-dev"
status: complete
---

# NODE 5a: Runtime Tools — Schema and Structure

**Scope:** Extract schema and structure of both runtime tools sharing a single file
**Question:** How do hivemind_runtime_status (0 args) and hivemind_runtime_command (13 args) share one file, and what is the dispatch mechanism?

---

## FINDING 1: hivemind_runtime_status — schema, purposeClass, structure

**Schema:** Zero args — `args: {}` (L24 of `src/tools/runtime/tools.ts`)
**Description:** "Inspect active HiveMind runtime attachment, trajectory, workflow, and command availability." (L23)
**PurposeClass:** Not declared at the tool level — the tool delegates to `buildHivemindRuntimeStatus()` which inspects runtime state. The `purposeClass` is not a field on this tool definition itself.
**Structure:** Factory function `createHivemindRuntimeStatusTool(projectRoot: string)` returns `ReturnType<typeof tool>` (L21). The execute handler calls `buildHivemindRuntimeStatus(projectRoot, { sessionID, agent })` (L26-29), passes metadata via `context.metadata(result.metadata)` (L30), and returns `renderToolResult(payload)` (L32).

**Evidence:**
- `src/tools/runtime/tools.ts:21-34` — full tool definition
- `src/tools/runtime/tools.ts:24` — `args: {}` confirms zero arguments

---

## FINDING 2: hivemind_runtime_command — all schema fields with Zod types

13 schema fields total. All defined via `tool.schema.*` in `src/tools/runtime/tools.ts:46-72`:

| # | Field | Zod Type | Required | Line |
|---|-------|----------|----------|------|
| 1 | `command` | `tool.schema.string()` | **Required** | L47 |
| 2 | `arguments` | `tool.schema.string().optional()` | Optional | L48 |
| 3 | `userMessage` | `tool.schema.string().optional()` | Optional | L49 |
| 4 | `preferredUserName` | `tool.schema.string().optional()` | Optional | L50 |
| 5 | `language` | `tool.schema.string().optional()` | Optional | L51 |
| 6 | `artifactLanguage` | `tool.schema.string().optional()` | Optional | L52 |
| 7 | `governanceMode` | `tool.schema.string().optional()` | Optional | L53 |
| 8 | `automationLevel` | `tool.schema.string().optional()` | Optional | L54 |
| 9 | `expertLevel` | `tool.schema.string().optional()` | Optional | L55 |
| 10 | `outputStyle` | `tool.schema.string().optional()` | Optional | L56 |
| 11 | `presetId` | `tool.schema.enum(['guided-onboarding']).optional()` | Optional | L57 |
| 12 | `requestedSettingsGroups` | `tool.schema.array(tool.schema.enum([...])).optional()` | Optional | L58-60 |
| 13 | `intakeEvidence` | `tool.schema.object({...}).optional()` | Optional | L61-71 |

The `intakeEvidence` nested object has 5 sub-fields:
- `source`: enum `['question-tool', 'cli-flags', 'runtime-tool', 'preset']` (L62)
- `questionnaireId`: enum `['bootstrap-profile-v1', 'settings-profile-v1']` (L63)
- `displayLanguage`: `tool.schema.string()` (L64)
- `completedGroups`: array of enum `['identity-language', 'expertise-style', 'governance-automation']` (L65-67)
- `usedRecommendedPresetGroups`: optional array of same enum (L68-70)

**Evidence:** `src/tools/runtime/tools.ts:46-72`

---

## FINDING 3: How two tools share one file

The file `src/tools/runtime/tools.ts` (82 LOC) exports **two factory functions**, each returning a separate `tool()` call:

1. `createHivemindRuntimeStatusTool(projectRoot)` — L21-34
2. `createHivemindRuntimeCommandTool(projectRoot)` — L41-81

Both are re-exported via the barrel file `src/tools/runtime/index.ts:5`:
```typescript
export { createHivemindRuntimeStatusTool, createHivemindRuntimeCommandTool } from './tools.js'
```

Both are wired independently in `src/plugin/opencode-plugin.ts:123-124`:
```typescript
tool: {
  hivemind_runtime_status: createHivemindRuntimeStatusTool(directory),
  hivemind_runtime_command: createHivemindRuntimeCommandTool(directory),
  // ... other tools
}
```

The shared file pattern works because:
- Both tools share the same `projectRoot` injection point (passed from `directory` in the plugin)
- Both import from the same backend module: `../../features/runtime-observability/status.js` (L10-13)
- Both use the same result renderer: `renderToolResult` from `../../shared/tool-helpers.js` (L14)
- Both pass `context.sessionID` and `context.agent` to their backend functions

**Evidence:**
- `src/tools/runtime/tools.ts:1-82` — both definitions in single file
- `src/tools/runtime/index.ts:5-9` — barrel export
- `src/plugin/opencode-plugin.ts:123-124` — independent wiring
- `src/tools/runtime/types.ts:1-111` — shared type definitions (111 LOC)

LOC counts:
- `src/tools/runtime/tools.ts`: 82 lines
- `src/tools/runtime/types.ts`: 111 lines
- `src/tools/runtime/index.ts`: 9 lines

---

## FINDING 4: Dispatch mechanism for runtime_command

The `hivemind_runtime_command` tool uses a **command-based dispatch** (not action-based):

1. **Tool receives args** → `execute(args, context)` at L73-80 of `src/tools/runtime/tools.ts`
2. **Delegates to backend** → `executeHivemindRuntimeCommand(projectRoot, args, context)` at L74
3. **Backend dispatch logic** in `src/features/runtime-observability/status.ts:204-298`:
   - **Special case for `hm-init`** (L217-253): If runtime is already attached (`attached-sdk`), redirects with `withRuntimeEntryDecision()` instead of executing the bundle
   - **Command lookup** (L255): `findSlashCommandBundle(args.command)` — looks up the command by ID from the slash command registry
   - **Error on unknown** (L256-258): Throws `Error('Unknown HiveMind command: ${args.command}')` if no bundle found
   - **Bundle execution** (L260-283): `executeSlashCommandBundle(bundle, { ... })` — passes all 13 args mapped to the command execution context
   - **Entry command wrapping** (L284-286): If command is in `runtimeEntryCommands` set (`hm-init`, `hm-doctor`, `hm-harness` — defined at L25), wraps result with `withRuntimeEntryDecision()`

The dispatch is **command-ID driven**: the `command` arg (string) is the router key that selects which slash command bundle to execute. This is fundamentally different from an action-based pattern where the tool itself contains branching logic — here the tool is a thin pass-through to the slash command bundle system.

**Evidence:**
- `src/features/runtime-observability/status.ts:25` — `runtimeEntryCommands` set definition
- `src/features/runtime-observability/status.ts:255` — `findSlashCommandBundle(args.command)`
- `src/features/runtime-observability/status.ts:260-283` — `executeSlashCommandBundle(bundle, {...})`
- `src/features/runtime-observability/status.ts:284-286` — entry command decision wrapping
- `src/commands/slash-command/command-discovery.ts:8` — `findSlashCommandBundle` definition
- `src/commands/slash-command/command-runner.ts:20` — `executeSlashCommandBundle` definition

---

## Gaps

- No `purposeClass` field is declared on either tool definition. The `purposeClass` concept appears in the trajectory/handoff tools, not the runtime tools.
- The `types.ts` file defines `HivemindRuntimeCommandArgs` (L22-42) which mirrors the Zod schema, but there is no runtime validation that the TypeScript interface and Zod schema stay in sync — they are maintained separately.

---

## Git Context

Investigation conducted at commit `85f8cbe7` on branch `v2.9.5-detox-dev`. The runtime tools file was extracted from inline definitions in `opencode-plugin.ts` per the file header comment (L2: "extracted from inline definitions in opencode-plugin.ts (L4 cutover)"). This extraction is recent — the tools were previously defined inline in the plugin file.
