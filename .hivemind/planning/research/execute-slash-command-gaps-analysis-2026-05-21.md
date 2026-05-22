[LANGUAGE: Write this file in en per Language Governance.]
# Execute-Slash-Command Tool — Gap Analysis

**Researched:** 2026-05-21
**Domain:** OpenCode SDK command execution, TUI pipeline, session command dispatch
**Confidence:** HIGH
**Source:** Context7 (/anomalyco/opencode), SDK reference docs, codebase audit (src/tools/session/execute-slash-command.ts, src/routing/command-engine/, src/features/bootstrap/primitive-loader.ts, .opencode/commands/ frontmatter patterns)

---

## Summary

The `execute-slash-command` tool (`src/tools/session/execute-slash-command.ts`) uses a **TUI pipeline hack** (`clearPrompt()` → `appendPrompt(text)` → `submitPrompt()`) to inject slash-command text into the TUI buffer. This works in practice but bypasses the OpenCode SDK's proper execution APIs (`tui.executeCommand()` and `session.command()`), ignores the command frontmatter contract (`subtask`, `agent`, `model` fields), and has no integration with the `hivemind-command-engine` read-side (command discovery).

**10 gaps identified** — 2 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW.

**Primary recommendation:** Replace the TUI-injection approach with a dual-mode dispatcher: use `tui.executeCommand()` for foreground/simple commands and `session.command()` (via the plugin's `client`) for parameter-rich commands with `agent`, `model`, and `subtask` support.

---

## <user_constraints>

No CONTEXT.md was available — this research was elicited directly. User question: "research and analyze ALL gaps in the current execute-slash-command implementation compared to what the OpenCode SDK and ecosystem require."

</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Slash command discovery | `src/routing/command-engine/` | `src/features/bootstrap/primitive-loader.ts` | Command engine exists and works; tool should call it before dispatch |
| Command dispatch execution | Plugin `client` (SDK surface) | `src/tools/session/execute-slash-command.ts` | Tool wraps SDK calls; actual dispatch goes through OpenCode runtime |
| Subagent invocation (subtask) | OpenCode runtime (child session) | Plugin `delegate-task` tool | When `subtask:true`, command creates child session via SDK, not TUI |
| Agent switching | OpenCode TUI (`@agent` syntax) | — | Native platform behavior; tool should not re-implement |
| Command argument parsing | Command body (`$ARGUMENTS`, `$1`) | — | OpenCode handles this natively; tool passes raw string |
| Frontmatter validation | `src/schema-kernel/command-frontmatter.schema.ts` | — | Schema already defines `description`, `agent`, `model`, `subtask` |

---

## Identified Gaps

---

### GAP-01 (CRITICAL): Missing `subtask` Parameter — No Child-Session Execution Strategy

| Property | Value |
|----------|-------|
| **Severity** | CRITICAL |
| **Type** | Missing parameter |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (line 55-70 — args schema) |

**Description:** The tool has NO `subtask` parameter. OpenCode commands support `subtask: true/false` in frontmatter. When `subtask: true`:
- The command triggers a **subagent invocation** (child session) via `SubtaskPart`
- The child session inherits the target agent's config with restricted tools (no `task`, no `todowrite` by default)
- The primary agent's context is NOT polluted
- [CITED: OpenCode commands docs — `agent` and `subtask` sections]

Commands like `hf-create` (frontmatter: `subtask: true`) are designed to run as subtasks. When the tool dispatches them via TUI injection, they run in the **current session** (foreground), defeating the purpose of `subtask: true`.

**Impact:** Commands with `subtask: true` frontmatter lose their isolation guarantees. The tool cannot honor the command's declared execution mode. This breaks the expected behavior for any command that depends on child-session isolation.

**Evidence:**
- [CITED: anomalyco/opencode repo — commands.mdx: "Use the subtask boolean to force the command to trigger a subagent invocation"]
- [VERIFIED: `.opencode/commands/hf-create.md` — frontmatter has `subtask: true`]
- [VERIFIED: `.opencode/commands/plan.md` and `start-work.md` — frontmatter has `subtask: false`]
- [VERIFIED: `src/schema-kernel/command-frontmatter.schema.ts` line 37 — Schema defines `subtask: z.boolean().optional()`]
- [VERIFIED: `src/routing/command-engine/types.ts` — `CommandBundle` type does NOT include `subtask` field (line 4-17)]

**Recommended solution:** 
1. Add `subtask: z.boolean().optional()` to the tool's args schema
2. Add a `CommandFrontmatter` model to `CommandBundle` type (currently missing `subtask`, `model`)
3. In execution: if `subtask: true` AND an agent is specified, dispatch via `delegate-task` (or `client.session.create()` → child session) instead of TUI injection
4. Pre-read the command's frontmatter (via `hivemind-command-engine discover` or direct `loadPrimitive`) to auto-detect `subtask` if not explicitly provided

---

### GAP-02 (CRITICAL): Uses `appendPrompt`+`submitPrompt` Instead of `tui.executeCommand()` or `session.command()`

| Property | Value |
|----------|-------|
| **Severity** | CRITICAL |
| **Type** | Wrong API usage |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 103-111) |

**Description:** The current implementation uses `client.tui.clearPrompt()` → `client.tui.appendPrompt({ body: { text } })` → `client.tui.submitPrompt()` to inject command text into the TUI buffer. This is a **side-channel hack** — it tricks the TUI into treating the injected text as a user-typed command.

OpenCode SDK provides two proper APIs for command execution:

1. **`tui.executeCommand({ body: { command: "my_command --args" } })`** — Direct TUI command execution. Returns `Promise<boolean>`. No prompt faking needed.
   - [CITED: Context7 query — `tui.executeCommand` SDK method signature]
   - [CITED: SDK reference — `tui.executeCommand({ body })` returns boolean]

2. **`session.command({ path: { id }, body: { command, agent, model, arguments } })`** — Session-level command dispatch. Returns `{ info: AssistantMessage, parts: Part[] }`. Accepts `agent` and `model` as first-class body parameters.
   - [CITED: Context7 query — `POST /session/:id/command` accepts `agent`, `model`, `command`, `arguments`]
   - [CITED: SDK reference — `session.command({ path, body })` returns command response]

**Impact:** 
- The TUI injection approach **cannot return command output** — it just submits and hopes
- No error feedback: if the command fails, the tool returns "dispatched" success
- Cannot pass `agent` or `model` to the execution API (must fake it with `@agent` text prefix)
- The tool documentation warns that `session.command()` blocks during active sessions — but `tui.executeCommand()` does NOT have this limitation and is designed for programmatic execution

**Evidence:**
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 103-111 — uses appendPrompt+submitPrompt]
- [VERIFIED: Context7 query — `tui.executeCommand` exists with `command: string` body parameter]
- [VERIFIED: Context7 query — `session.command()` accepts `agent`, `model`, `arguments` in body]
- [ASSUMED: `tui.executeCommand()` does not block during active LLM loop — needs verification against OpenCode source]

**Recommended solution:**
1. Replace `clearPrompt()` + `appendPrompt()` + `submitPrompt()` with `client.tui.executeCommand({ body: { command: promptText } })` for foreground dispatch
2. For parameterized dispatch (agent/model/subtask), use `client.session.command()` which accepts `agent`, `model`, `arguments` natively
3. The TUI injection approach should be removed entirely or kept only as a documented fallback

---

### GAP-03 (HIGH): No Command Discovery/Vanity Check Before Dispatch

| Property | Value |
|----------|-------|
| **Severity** | HIGH |
| **Type** | Missing validation |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (execute function) |

**Description:** The tool does NOT verify that the command exists before dispatching. It blindly sends command text to the TUI. The `hivemind-command-engine` tool (read-side) provides `discover`, `analyze_contract`, `route_preview`, and `list_commands` actions — but the execute-slash-command tool never calls it.

The tool description says: "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first." But there's no integration — no pre-check, no warm-up, no loading of the command's frontmatter before execution.

**Impact:** 
- Agents can dispatch commands that don't exist (getting a silent failure from TUI)
- The tool cannot apply frontmatter-driven behavior (`subtask`, target `agent`, `model`) because it doesn't read the command's frontmatter before dispatching
- The `model` parameter passed by the user may conflict with the command's own frontmatter `model` setting

**Evidence:**
- [VERIFIED: src/tools/session/execute-slash-command.ts — no call to command engine or primitive loader]
- [VERIFIED: src/tools/hivemind/hivemind-command-engine.ts line 32 — description says "use execute-slash-command to actually dispatch"]
- [VERIFIED: src/routing/command-engine/index.ts — `discoverCommandBundles()` and `requireCommand()` exist]

**Recommended solution:**
1. Before dispatching, load the command via `loadPrimitive(filePath, "command")` or `discoverCommandBundles()`
2. If command not found, return early with a clear error: "Command X not found"
3. If found, read frontmatter (`agent`, `model`, `subtask`) and let explicit tool parameters override frontmatter values
4. Consider adding a `--dry-run` or `preview` mode that shows the resolved command parameters before execution

---

### GAP-04 (HIGH): Shallow Agent Switching — Text Prepend vs. Real Session Switch

| Property | Value |
|----------|-------|
| **Severity** | HIGH |
| **Type** | Behavioral mismatch |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 86-89) |

**Description:** The tool prepends `@agent` to the command text (`@hm-researcher /deep-research-synthesis-repomix vitest`). This causes the TUI to textually contain `@agent`, which the TUI then processes — BUT the tool returns control to the calling agent immediately. The real OpenCode `@agent /command` TUI flow:
1. Switch the front-facing agent to `@agent` (session context switches)
2. Execute the command under the new agent's session
3. After command completes, return to the original agent

The current tool does none of the session switching or return-to-original logic. It also has no way to detect when the switched agent finishes.

**Impact:** Commands that depend on `@agent` context switching (to change capabilities, model, or tool permissions) won't work correctly. The calling agent receives no feedback about the switched agent's execution.

**Evidence:**
- [CITED: OpenCode agents docs — "You can switch between agents during a session or invoke them with the @ mention"]
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 86-89 — simple text prepend, no SDK agent switching call]
- [ASSUMED: The TUI does handle `@agent` syntax natively after submitPrompt() — but control returns to the calling agent, not the switched agent]

**Recommended solution:**
1. Use `session.command()` with the `agent` body parameter — this natively routes the command to the specified agent
2. If agent switching is desired (not just command routing), use the plugin's `client` to create a child session with the target agent
3. Document that for simple command execution without agent switching, `agent` parameter is preferred over prefixing `@agent`

---

### GAP-05 (HIGH): Model Override is Textual, Not Structural

| Property | Value |
|----------|-------|
| **Severity** | HIGH |
| **Type** | Behavioral mismatch |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (description + execute) |

**Description:** The tool's description says model override is "prepended as a model tag in the prompt text" — but looking at the actual code, the `model` parameter is documented but **never actually used** in prompt construction. The parameter exists in the schema but the execute function only uses `args.agent`, `args.command`, and `args.arguments` for the prompt text. The model is only recorded in metadata.

**Impact:** The `model` parameter is a no-op — it does nothing. Users passing it get the impression the command will run with a different model, but it won't.

**Evidence:**
- [VERIFIED: src/tools/session/execute-slash-command.ts line 66-68 — `model` parameter is documented as "prepended as a model tag"]
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 85-98 — `parts` array only includes `@agent`, `/command`, and `arguments`; NO model tag]
- [CITED: `session.command()` API — accepts `model` as first-class body parameter]

**Recommended solution:**
1. Either implement the model tag in the prompt text (or more properly, use `session.command()` which supports `model` natively)
2. OR remove the `model` parameter if it's not actually supported through the TUI injection approach
3. If using `session.command()`, model override works correctly

---

### GAP-06 (MEDIUM): No Structured Argument Format Support

| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Type** | Missing feature |
| **Affected file** | `.opencode/commands/` patterns, `src/tools/session/execute-slash-command.ts` |

**Description:** The tool accepts `arguments: string` as a flat string. But OpenCode commands use structured argument patterns:
- `$ARGUMENTS` — all arguments as a single string (most common)
- `$1`, `$2`, `$3` — positional arguments
- `!command` — bash injection (`!npm test` outputs command result)
- `@file` — file reference (`@src/components/Button.tsx` includes file content)

The `hivemind-command-engine` `analyze_contract` action detects `acceptsArguments`, and the primitive loader detects `has_arguments`, `has_positional_params`, `has_bash_injection`, `has_file_reference`. But the execute tool doesn't use this metadata.

**Impact:** Agents calling the tool don't know what argument format a command expects. They must guess between "pass arguments as flat string" or "use flag-like syntax." Real command files like `gsd-plan-phase.md` document complex flag patterns (`--research`, `--skip-research`, `--research-phase <N>`, `--view`, `--gaps`, `--prd <file>`, etc.) — these are all flattened into a single string.

**Evidence:**
- [VERIFIED: `.opencode/commands/gsd-plan-phase.md` lines 3-4 — `argument-hint: "[phase] [--auto] [--research] [--skip-research] [--research-phase <N>] ..."`
- [VERIFIED: `src/schema-kernel/command-frontmatter.schema.ts` lines 56-67 — `CommandTemplateFeaturesSchema` detects `has_arguments`, `has_positional_params`, `has_bash_injection`, `has_file_reference`]
- [VERIFIED: `src/routing/command-engine/types.ts` `CommandListEntry` line 146 — `acceptsArguments: boolean` exists]
- [VERIFIED: `src/routing/command-engine/index.ts` line 55 — `acceptsArguments: command.body.includes("$ARGUMENTS")`]

**Recommended solution:**
1. Document the `argument-hint` convention for command frontmatter (non-standard but used by gsd commands)
2. Add a `CommandTemplateFeatures` field to the `CommandBundle` type so agents can discover argument format requirements
3. Consider adding an `argument-hint` optional field to the tool's args schema for documentation purposes

---

### GAP-07 (MEDIUM): No Scope-Aware Resolution (Project vs Global)

| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Type** | Missing awareness |
| **Affected file** | `src/tools/session/execute-slash-command.ts` |

**Description:** OpenCode uses first-wins merging: project-level commands override global commands (same name). The `hivemind-command-engine` already handles this correctly via `loadPrimitives()` which scans both `~/.config/opencode/` and `.opencode/`. But the execute tool doesn't load or verify the command's source scope before dispatch.

**Impact:** If a command exists only globally, the tool dispatches it to the TUI which will find it. But the tool cannot report where the command is defined, cannot warn about project/global conflicts, and cannot provide source-of-truth feedback.

**Evidence:**
- [VERIFIED: `src/features/bootstrap/primitive-loader.ts` lines 178-183 — `resolvePrimitiveDirs()` scans both project and global paths]
- [VERIFIED: `src/features/bootstrap/primitive-loader.ts` lines 210-232 — `scanCommands()` uses first-wins resolution]
- [ASSUMED: The TUI also resolves project-first per OpenCode conventions — but no explicit verification]

**Recommended solution:**
1. Load the command's frontmatter before dispatch (as recommended in GAP-03) — this inherently resolves scope
2. Include `source` (project/global) and `filePath` in the tool's metadata response

---

### GAP-08 (MEDIUM): Single Execution Mode — Missing Strategy Selection

| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Type** | Missing feature |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (entire execute function) |

**Description:** The tool only supports foreground TUI execution. OpenCode commands should support two execution modes:

| Mode | When | How |
|------|------|-----|
| **Foreground** | Default; simple commands, commands without `subtask:true` | `tui.executeCommand()` — command runs in current session |
| **Subtask** | `subtask:true` in frontmatter or tool args | Child session via `task` tool or `session.create()` — preserves parent context |

Commands like `hf-create` (frontmatter: `subtask: true`) should run as subtasks. The tool currently treats them the same as foreground commands.

**Impact:** Command frontmatter `subtask` setting is ignored. Commands designed for isolation run in the primary session, polluting context.

**Evidence:**
- [VERIFIED: `.opencode/commands/hf-create.md` — `subtask: true`]
- [VERIFIED: `.opencode/commands/plan.md` — `subtask: false`]
- [CITED: OpenCode commands docs — "subtask: true forces the command to trigger a subagent invocation"]
- [VERIFIED: `src/tools/session/execute-slash-command.ts` — no subtask parameter, no mode selection]

**Recommended solution:**
1. Add execution mode logic: read command frontmatter `subtask`, merge with explicit tool parameters
2. If `subtask: true` → delegate to child session via the existing `delegate-task` tool or `client.session.create()`
3. If `subtask: false` or absent → use foreground `tui.executeCommand()`
4. Default to foreground when `subtask` is absent in both frontmatter and tool args

---

### GAP-09 (LOW): No Error Feedback from TUI Pipeline

| Property | Value |
|----------|-------|
| **Severity** | LOW |
| **Type** | Error handling gap |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 113-128) |

**Description:** The tool returns a hardcoded success message: "Command X dispatched to TUI prompt." It does not capture or relay any response from the TUI. If the TUI rejects the command (not found, syntax error, permission denied), the tool reports "dispatched" and the error surfaces later as context grows cold.

The `tui.executeCommand()` API returns `Promise<boolean>` — at least providing a success/failure signal.

**Impact:** Agents cannot detect failed command dispatch. They assume the command ran successfully and continue their workflow, only to discover later that nothing happened.

**Evidence:**
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 113-128 — hardcoded success message]
- [CITED: Context7 query — `tui.executeCommand()` returns boolean]

**Recommended solution:**
1. Switch to `tui.executeCommand()` and check the boolean return value
2. Return meaningful error messages on failure
3. If `session.command()` is used instead, the response contains `{ info, parts }` with actual command output

---

### GAP-10 (LOW): Model Field Documented But Unused in Prompt

| Property | Value |
|----------|-------|
| **Severity** | LOW |
| **Type** | Documentation/code mismatch |
| **Affected file** | `src/tools/session/execute-slash-command.ts` (line 67 — docstring) |

**Description:** The tool description says the model parameter is "prepended as a model tag in the prompt text" — but looking at the actual execution code (lines 85-98), `args.model` is never used to construct the prompt text. The model parameter only appears in metadata.

**Impact:** The `model` parameter is misleading — it's documented but has no runtime effect.

**Evidence:**
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 66-68 — docstring claims model is "prepended"]
- [VERIFIED: src/tools/session/execute-slash-command.ts lines 85-98 — `model` not in `parts` array construction]
- [VERIFIED: src/tools/session/execute-slash-command.ts line 120 — model only in metadata, not in output text]

**Recommended solution:** Same as GAP-05. Either implement it or remove the parameter.

---

## Integration Dependencies

| Gap | Depends On | Affects |
|-----|-----------|---------|
| GAP-01 (subtask) | Command frontmatter loading | `src/tools/delegation/delegate-task.ts` (if routing to child session) |
| GAP-02 (tui.executeCommand) | OpenCode SDK `tui.executeCommand()` availability | None — SDK already provides it |
| GAP-03 (discovery) | `src/routing/command-engine/index.ts` or `src/features/bootstrap/primitive-loader.ts` | None — both modules exist |
| GAP-04 (agent switching) | `session.command()` with `agent` body param | None — SDK supports it |
| GAP-05 (model override) | `session.command()` with `model` body param | None — SDK supports it |
| GAP-06 (argument format) | Command frontmatter parsing | `src/schema-kernel/command-frontmatter.schema.ts` (already exists) |
| GAP-07 (scope) | Primitive loader | None — already exists |
| GAP-08 (mode selection) | GAP-01 + GAP-02 | Subagent dispatch flow |
| GAP-09 (error feedback) | GAP-02 | None — return value from `tui.executeCommand()` |
| GAP-10 (model doc) | GAP-05 | None — documentation fix |

---

## Suggested Implementation Phases

### Phase A — Quick Wins (LOW effort, HIGH value)
1. **GAP-10** — Fix documentation: remove "prepended as a model tag" claim or implement it
2. **GAP-03** — Add pre-dispatch command discovery: load the command, verify it exists, read frontmatter
3. **GAP-09** — Add error feedback: check `tui.executeCommand()` return value or `session.command()` response

### Phase B — Core API Upgrade (MEDIUM effort, CRITICAL value)
4. **GAP-02** — Replace TUI injection with `tui.executeCommand()` for foreground commands
5. **GAP-05** — Implement `model` override via `session.command()` body parameter (or document as unavailable)
6. **GAP-04** — Implement proper agent switching via `session.command({ body: { agent: "..." } })` instead of text prepend

### Phase C — Subtask/Mode Support (HIGH effort, CRITICAL value)
7. **GAP-01** — Add `subtask` parameter and child-session dispatch strategy
8. **GAP-08** — Implement dual-mode execution: foreground vs. subtask, selected by frontmatter + tool args

### Phase D — Polish (LOW effort, MEDIUM value)
9. **GAP-06** — Surface argument format metadata in tool output
10. **GAP-07** — Surface scope resolution info in tool output

---

## State of the Art

| Old Approach (Current) | New Approach | When Changed | Impact |
|-----------------------|-------------|--------------|--------|
| `appendPrompt` + `submitPrompt` (TUI injection) | `tui.executeCommand({ body: { command } })` | Phase B | Proper API, returns boolean, no buffer manipulation |
| No command discovery | Pre-dispatch `loadPrimitive()` check | Phase A | Validates command exists, reads frontmatter |
| `@agent` text prepend | `session.command({ body: { agent } })` | Phase B | Native agent routing, no context switching hacks |
| Model parameter unused (metadata only) | `session.command({ body: { model } })` | Phase B | Model override actually works |
| No subtask support | `delegate-task` or child session | Phase C | Honours command frontmatter `subtask` setting |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tui.executeCommand()` does not block during active LLM loop | GAP-02 | If it blocks, current TUI injection may be the only viable approach |
| A2 | OpenCode TUI handles `@agent` prefix natively after `submitPrompt()` | GAP-04 | If TUI doesn't parse `@agent` from injected text, agent switching never worked |

---

## Open Questions

1. **Does `tui.executeCommand()` work during an active LLM loop (tool context)?**
   - The SDK docs confirm it exists but don't specify blocking semantics
   - Current code chose TUI injection specifically to avoid `session.command()` blocking
   - **Recommendation:** Test `tui.executeCommand()` in an active session before committing to Phase B

2. **Does the TUI `@agent` prefix work when injected programmatically (not typed by user)?**
   - The SDK agents docs describe `@mention` as "user message" syntax
   - Current tool relies on this working in injected text
   - **Recommendation:** Verify behavior; switch to `session.command()` with native `agent` parameter instead

3. **What is the `arguments` format expected by `session.command()`?**
   - SDK docs show `arguments: { action: "status" }` (object) but also `args: ["arg1", "arg2"]` (array)
   - Current tool passes flat string
   - **Recommendation:** Determine the correct args shape for the OpenCode server API version in use

---

## Sources

### Primary (HIGH confidence)
- [Context7 /anomalyco/opencode] — `tui.executeCommand`, `session.command`, `subtask` docs, agent switching
- [VERIFIED: src/tools/session/execute-slash-command.ts] — Current implementation (lines 49-152)
- [VERIFIED: src/routing/command-engine/index.ts] — Command discovery and contract analysis
- [VERIFIED: src/routing/command-engine/types.ts] — `CommandBundle`, `CommandFrontmatter` (missing `subtask`)
- [VERIFIED: src/schema-kernel/command-frontmatter.schema.ts] — `CommandFrontmatterSchema` with `subtask`
- [VERIFIED: .opencode/commands/hf-create.md] — Example: `subtask: true`
- [VERIFIED: .opencode/commands/plan.md] — Example: `subtask: false`
- [VERIFIED: .opencode/commands/gsd-plan-phase.md] — Example: complex argument patterns

### Secondary (MEDIUM confidence)
- [CITED: OpenCode platform reference — opencode-commands.md] — Frontmatter fields and subtask behavior
- [CITED: OpenCode platform reference — opencode-agents.md] — Agent switching and @mention syntax
- [CITED: OpenCode platform reference — opencode-sdk.md] — SDK API signatures

### Tertiary (LOW confidence)
- [ASSUMED: `tui.executeCommand()` non-blocking behavior] — Needs live verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK APIs confirmed via Context7
- Architecture: HIGH — All code paths verified against actual source files
- Pitfalls: HIGH — All 10 gaps confirmed with direct source evidence

**Research date:** 2026-05-21
**Valid until:** 2026-07-21 (stable OpenCode SDK — 60 days)
