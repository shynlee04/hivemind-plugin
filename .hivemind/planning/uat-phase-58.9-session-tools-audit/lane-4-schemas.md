[LANGUAGE: Write this file in en per Language Governance.]
# Lane 4 — Schema, SDK & Tool-Envelope Audit

**Analysis Date:** 2026-06-06
**Lane:** 4 of 5 (parallel UAT, Phase 58.9)
**Scope:** Zod schema inventory, tool envelope conformance, SDK surface compliance, config subscriber/compiler determinism, command-engine discovery, generated JSON-Schema idempotency, prompt-enhance schema coverage
**Method:** Read-only. No rebuild, no schema regeneration, no edits. Every claim cites `path:LINE`; SDK claims cite `node_modules/@opencode-ai/{plugin,sdk}/dist/...`. No mocks.

---

## 1. Zod Schema Inventory

### 1.1 Zod runtime version

- **Project pin:** `zod ^4.4.3` (`package.json:65`)
- **Plugin transitive pin:** `zod 4.1.8` (`node_modules/@opencode-ai/plugin/package.json:55`)
- **Installed actual:** 4.x (Zod v4 syntax observed: `.strict()`, `.strip()`, `z.record(z.string(), z.unknown())`, `ZodError.issues[].code: "unrecognized_keys"`)
- **Compatibility:** 4.4.3 ≥ 4.1.8 — backward-compatible range. **P3:** drift is small but transitively affects every consumer of `@opencode-ai/plugin` types.

### 1.2 Schema inventory (definitions vs. consumers vs. parse mode)

| Schema | File:Line | `.strict()`? | Lenient sibling | Used by `safeParse` | Used by `parse` (throws) | Consumer surface |
|---|---|---|---|---|---|---|
| `ToolNameSchema` | `src/schema-kernel/tool.schema.ts:49` | yes (inside `ToolDefinitionSchema`) | via `.strip()` at `:49` | n/a (composed) | n/a | `ToolDefinitionSchema` consumers |
| `ToolDefinitionSchema` | `src/schema-kernel/tool.schema.ts:49` | yes | lenient `.strip()` at `:49` | n/a | n/a | (not observed imported elsewhere — **P3: possible dead code**) |
| `validateWithFallback` | `src/schema-kernel/index.ts:24,37` | — | — | n/a (helper) | n/a | Used by `src/config/compiler.ts` (compile + decompile of agent/command/skill) and `src/config/...` |
| `AgentFrontmatterSchema` + `AgentFrontmatterSchemaLenient` | `src/config/compiler.ts:22-25` (implied) | strict + lenient pair | yes (lenient strips unknown keys) | `validateWithFallback` at `compiler.ts:93-98` | n/a | `compileAgent`, `decompileAgent` |
| `CommandFrontmatterSchema` + `CommandFrontmatterSchemaLenient` | `src/config/compiler.ts` (import) | strict + lenient pair | yes | `validateWithFallback` at `:121-126, :199-204` | n/a | `compileCommand`, `decompileCommand` |
| `SkillFrontmatterSchema` + `SkillFrontmatterSchemaLenient` | `src/config/compiler.ts` (import) | strict + lenient pair | yes | `validateWithFallback` at `:148-153, :219-224` | n/a | `compileSkill`, `decompileSkill` |
| `PromptSkimResultSchema` | `src/schema-kernel/prompt-enhance.schema.ts:65-71` | yes (`.strict()`) | n/a (no lenient pair) | inherited via tool | n/a | prompt-skim tool |
| `PromptAnalysisResultSchema` (inferred, contains `findings[]`) | `src/schema-kernel/prompt-enhance.schema.ts:70` (used at) | yes | n/a | inherited via tool | n/a | prompt-analyze tool |
| `PromptAnalysisFindingSchema` | `src/schema-kernel/prompt-enhance.schema.ts:43-55` | yes (`.strict()`) | n/a | inherited via tool | n/a | prompt-analyze tool (per-finding shape) |
| `ContextBudgetRecordSchema` | `src/schema-kernel/prompt-enhance.schema.ts:83-91` | yes (`.strict()`) | n/a | inherited via tool | n/a | context-budget tool |
| `SessionPatchRecordSchema` | `src/schema-kernel/prompt-enhance.schema.ts:103-113` | yes (`.strict()`) | n/a | inherited via tool | n/a | session-patch tool |
| `EnhancedPromptOutputSchema` | `src/schema-kernel/prompt-enhance.schema.ts:125-138` | yes (`.strict()`) | n/a | inherited via tool | n/a | prompt-enhance pipeline terminal output |
| `PipelineStateSchema` | `src/schema-kernel/prompt-enhance.schema.ts:150-167` | yes (`.strict()`) | n/a | inherited via tool | n/a | pipeline progress tracker (6 modes: `skim / bridge / investigation / clarification / repackage / report`) |
| `SupportedLanguageSchema` | `src/schema-kernel/hivemind-configs.schema.ts:20-31` | no (plain enum) | n/a | `HivemindConfigsSchema` uses defaults | n/a | `HivemindConfigsSchema` |
| `HivemindModeSchema` | `src/schema-kernel/hivemind-configs.schema.ts:52-56` | no | n/a | inherited | n/a | `HivemindConfigsSchema` |
| `UserExpertLevelSchema` | `src/schema-kernel/hivemind-configs.schema.ts:73-79` | no | n/a | inherited | n/a | `HivemindConfigsSchema` |
| `DiscussModeSchema` | `src/schema-kernel/hivemind-configs.schema.ts:100-104` | no | n/a | inherited | n/a | `WorkflowConfigSchema` |
| `WorkflowConfigInnerSchema` | `src/schema-kernel/hivemind-configs.schema.ts:133-154` | no (uses defaults) | n/a | via factory default at `:160-162` | n/a | `WorkflowConfigSchema` |
| `WorkflowConfigSchema` | `src/schema-kernel/hivemind-configs.schema.ts:160-162` | no | n/a | `readConfigs` at `:460` | n/a | runtime config |
| `DelegationSystemsSchema` | `src/schema-kernel/hivemind-configs.schema.ts:187-197` | no (uses default) | n/a | inherited | n/a | `HivemindConfigsSchema` |
| `DepthConditionSchema` | `src/schema-kernel/hivemind-configs.schema.ts:273-276` | no | n/a | inherited | n/a | `GovernanceRuleSchema` |
| `GovernanceRuleSchema` | `src/schema-kernel/hivemind-configs.schema.ts:278-290` | no, uses `catchall(z.unknown())` | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `NamingStandardsSchema` | `src/schema-kernel/hivemind-configs.schema.ts:296-301` | no | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `AgentConfigSchema` | `src/schema-kernel/hivemind-configs.schema.ts:307-312` | no | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `CommandConfigSchema` | `src/schema-kernel/hivemind-configs.schema.ts:318-322` | no | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `TemplateConfigSchema` | `src/schema-kernel/hivemind-configs.schema.ts:328-331` | no | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `ToolRegistryItemSchema` | `src/schema-kernel/hivemind-configs.schema.ts:337-341` | no | n/a | inherited | n/a | `GovernanceConfigsSchema` |
| `GovernanceConfigsSchema` | `src/schema-kernel/hivemind-configs.schema.ts:343-350` | no, default `{ rules: [] }` | n/a | `readConfigs` at `:460` | n/a | `HivemindConfigsSchema` |
| `GuardrailLevelSchema` | `src/schema-kernel/hivemind-configs.schema.ts:358` | no | n/a | inherited (optional) | n/a | `HivemindConfigsSchema` |
| `DelegationModeSchema` | `src/schema-kernel/hivemind-configs.schema.ts:359` | no | n/a | inherited (optional) | n/a | `HivemindConfigsSchema` |
| `ToolAccessPatternSchema` | `src/schema-kernel/hivemind-configs.schema.ts:360` | no | n/a | inherited (optional) | n/a | `HivemindConfigsSchema` |
| `SkillFilterSchema` | `src/schema-kernel/hivemind-configs.schema.ts:361` | no | n/a | inherited (optional) | n/a | `HivemindConfigsSchema` |
| `HivemindConfigsSchema` | `src/schema-kernel/hivemind-configs.schema.ts:363-389` | no (uses defaults) | n/a | `readConfigs` at `:460`, `validateConfigsFile` at `:505` | `getDefaultConfigs` at `:411`, `writeConfigs` at `:545` | top-level config |

**Coverage gaps (P3):**

- `ToolDefinitionSchema` at `src/schema-kernel/tool.schema.ts:49` is defined but **no `safeParse`/`parse` call was found in the audit scan**. It is either dead code, or wired in a way the scan did not surface.
- The prompt-enhance pipeline has **6 modes** (`skim / bridge / investigation / clarification / repackage / report` per `PipelineStateSchema` at `prompt-enhance.schema.ts:152-159`) but **only 4 schemas** represent tool outputs (`PromptSkimResultSchema`, `PromptAnalysisResultSchema`, `ContextBudgetRecordSchema`, `SessionPatchRecordSchema`). The `EnhancedPromptOutputSchema` is the terminal pipeline output. **P3:** bridge/clarification/repackage phases do not have explicit per-phase output schemas.

### 1.3 `parse` vs `safeParse` audit (P0–P3)

| File:Line | Function | Uses `parse` (throws) | Uses `safeParse` (returns result) |
|---|---|---|---|
| `src/schema-kernel/hivemind-configs.schema.ts:411` | `getDefaultConfigs` | `HivemindConfigsSchema.parse({})` — **P3:** trusted internal call, throw is acceptable | n/a |
| `src/schema-kernel/hivemind-configs.schema.ts:460` | `readConfigs` | n/a | `HivemindConfigsSchema.safeParse(parsed)` — falls back to defaults on failure — **P2:** silent fallback hides user config errors |
| `src/schema-kernel/hivemind-configs.schema.ts:505` | `validateConfigsFile` | n/a | `HivemindConfigsSchema.safeParse(parsed)` — **explicit failure path for diagnostics** — correct pattern |
| `src/schema-kernel/hivemind-configs.schema.ts:545` | `writeConfigs` | `HivemindConfigsSchema.parse(config)` — **P0:** throws if user writes invalid config; should use `safeParse` and return result with explicit error |
| `src/schema-kernel/hivemind-configs.schema.ts:160-162` | `WorkflowConfigSchema` default factory | `WorkflowConfigInnerSchema.parse({})` — internal, OK | n/a |
| `src/config/compiler.ts:99-102, 127-130, 155-158` | `compileAgent/Command/Skill` failure branches | n/a | `validateWithFallback` — returns result, compiler returns `success: false` with `errors: formatCompileError(...)` — correct |
| `src/config/compiler.ts:185-187, 205-207, 226-228` | `decompileAgent/Command/Skill` failure branches | n/a | `validateWithFallback` — returns result, decompiler returns `success: false` with `warnings: formatCompileError(...)` — correct |

**`safeParse` is the dominant pattern** for untrusted input (configs, frontmatter). **`parse` is used for trusted internal defaults and `writeConfigs`** — the latter is a `P0` (caller may pass partially-valid config and crash without explanation).

---

## 2. Tool Envelope Conformance

### 2.1 The four envelope shapes in the boundary stack

The audit brief mandates `{code, message, data?}`. Three other shapes exist in the codebase:

| Shape | Defined at | Used by | Audit-spec match |
|---|---|---|---|
| `{code, message, data?}` | (audit brief — not defined in code) | n/a | **n/a — this is the SPEC, not implemented** |
| `{kind: "success" \| "error" \| "pending", message: string, data?: T, metadata?: Record<string, unknown>}` | `src/shared/tool-response.ts:6-11` | imported by prompt-enhance tools only (inferred from import patterns) | **NO** — `kind` instead of `code`, no `code` field |
| `{ok: boolean, data?: T, error?: {code: string, message: string}}` | `src/sidecar/server/tool-proxy/router.ts:29, :74` + `src/sidecar/server/routes/types.ts:22` | all `src/sidecar/server/tool-proxy/handlers/*.ts` | **NO** — wrapped shape, `code` is nested inside `error` |
| `string \| {title?: string, output: string, metadata?: Record<string, unknown>, attachments?: ToolAttachment[]}` | `node_modules/@opencode-ai/plugin/dist/tool.d.ts:54` (SDK contract) | every `tool()` factory in `src/tools/**` (must return `ToolResult`) | **NO** — SDK contract is fundamentally different from any project wrapper |

### 2.2 Tool factory inventory (`src/tools/**`)

40 tool files identified. Envelope-shape classifier is the SDK contract (`ToolResult`), not any project wrapper. **None of the local tool factories return `{code, message, data?}`** as required by the audit brief.

| Tool | File | Envelope returned | Conforms to `{code, message, data?}`? |
|---|---|---|---|
| `bootstrap-init` | `src/tools/config/bootstrap-init.ts` | SDK `ToolResult` (`string \| {output, metadata?}`) | NO |
| `bootstrap-recover` | `src/tools/config/bootstrap-recover.ts` | SDK `ToolResult` | NO |
| `validate-restart` | `src/tools/config/validate-restart.ts` | SDK `ToolResult` | NO |
| `configure-primitive` | `src/tools/config/configure-primitive.ts` | SDK `ToolResult` | NO |
| `configure-primitive-paths` | `src/tools/config/configure-primitive-paths.ts` | SDK `ToolResult` | NO |
| `delegate-task` | `src/tools/delegation/delegate-task.ts` | SDK `ToolResult` | NO |
| `delegation-status` | `src/tools/delegation/delegation-status.ts` | SDK `ToolResult` | NO |
| `hivemind-agent-work` | `src/tools/hivemind/hivemind-agent-work.ts` | SDK `ToolResult` | NO |
| `hivemind-command-engine` | `src/tools/hivemind/hivemind-command-engine.ts` | SDK `ToolResult` | NO |
| `hivemind-doc` | `src/tools/hivemind/hivemind-doc.ts` | SDK `ToolResult` | NO |
| `hivemind-pressure` | `src/tools/hivemind/hivemind-pressure.ts` | SDK `ToolResult` | NO |
| `hivemind-sdk-supervisor` | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | SDK `ToolResult` | NO |
| `hivemind-session-view` | `src/tools/hivemind/hivemind-session-view.ts` | SDK `ToolResult` | NO |
| `hivemind-steer` | `src/tools/hivemind/hivemind-steer.ts` | SDK `ToolResult` | NO |
| `hivemind-trajectory` | `src/tools/hivemind/hivemind-trajectory.ts` | SDK `ToolResult` | NO |
| `run-background-command` | `src/tools/hivemind/run-background-command.ts` | SDK `ToolResult` | NO |
| `prompt-skim/tools` | `src/tools/prompt/prompt-skim/tools.ts` | **Likely `{kind, message, data?, metadata?}`** (uses `src/shared/tool-response.ts`) | NO — `kind` instead of `code` |
| `prompt-analyze/tools` | `src/tools/prompt/prompt-analyze/tools.ts` | **Likely `{kind, message, data?, metadata?}`** | NO — same |
| `session/session-patch/tools` | `src/tools/session/session-patch/tools.ts` | **Likely `{kind, message, data?, metadata?}`** | NO — same |
| `session/session-context` | `src/tools/session/session-context.ts` | SDK `ToolResult` | NO |
| `session/session-delegation-query` | `src/tools/session/session-delegation-query.ts` | SDK `ToolResult` | NO |
| `session/session-hierarchy` | `src/tools/session/session-hierarchy.ts` | SDK `ToolResult` | NO |
| `session/session-journal-export` | `src/tools/session/session-journal-export.ts` | SDK `ToolResult` | NO |
| `session/session-resolver` | `src/tools/session/session-resolver.ts` | SDK `ToolResult` | NO |
| `session/session-tracker` | `src/tools/session/session-tracker.ts` | SDK `ToolResult` | NO |
| `session/semantic-agent-selector` | `src/tools/session/semantic-agent-selector.ts` | SDK `ToolResult` | NO |
| `session/dispatch-command` | `src/tools/session/dispatch-command.ts` | SDK `ToolResult` | NO |
| `session/execute-slash-command` | `src/tools/session/execute-slash-command.ts` | SDK `ToolResult` | NO |
| `session/resolve-command` | `src/tools/session/resolve-command.ts` | SDK `ToolResult` | NO |
| `session/validate-command` | `src/tools/session/validate-command.ts` | SDK `ToolResult` | NO |
| `session/workflow-parser` | `src/tools/session/workflow-parser.ts` | SDK `ToolResult` | NO |
| `session/index` | `src/tools/session/index.ts` | SDK `ToolResult` (barrel re-export) | NO |
| `tmux-copilot` | `src/tools/tmux-copilot.ts` | SDK `ToolResult` (line 441 uses ZodIssue `code: "custom"` internally, not envelope) | NO |
| `tmux-state-query` | `src/tools/tmux-state-query.ts` | SDK `ToolResult` | NO |
| `delegation/readers/types` (types-only) | `src/tools/delegation/readers/types.ts` | n/a (type module) | n/a |
| `delegation/readers/session-tracker-reader` (internal) | `src/tools/delegation/readers/session-tracker-reader.ts` | helper — not a `tool()` factory | n/a |
| `delegation/readers/legacy-reader` (internal) | `src/tools/delegation/readers/legacy-reader.ts` | helper | n/a |
| `delegation/types` (types-only) | `src/tools/delegation/types.ts` | n/a | n/a |
| `prompt/prompt-skim/types` (types-only) | `src/tools/prompt/prompt-skim/types.ts` | n/a | n/a |
| `prompt/prompt-analyze/types` (types-only) | `src/tools/prompt/prompt-analyze/types.ts` | n/a | n/a |
| `session/session-patch/types` (types-only) | `src/tools/session/session-patch/types.ts` | n/a | n/a |

**Violators of audit-spec `{code, message, data?}`: 0 conformant / ~32 tool factories non-conformant.** All return `SDK ToolResult`; the 3 prompt-* tools additionally wrap in `{kind, message, ...}`. **P0:** the audit-spec envelope is not implemented anywhere in the codebase. Either the brief is mis-stated, or every tool factory needs a wrapper layer.

### 2.3 P0 envelope contract violation — primary finding

`src/shared/tool-response.ts:6-11` defines `{kind, message, data?, metadata?}` — this is **NOT** the audit-spec `{code, message, data?}`. The spec is `code` (a string error code like `INVALID_ARGS`, `TOOL_ERROR_DELEGATE_TASK`), not `kind` (an enum of `success`/`error`/`pending`).

The only place in the codebase that uses a `code` field in tool responses is the **sidecar** layer (`src/sidecar/server/tool-proxy/router.ts:29, :74`, `src/sidecar/server/routes/types.ts:22`) — but that layer is HTTP-oriented with `{ok, error: {code, message}}`, also not matching the audit spec.

**Fix recommendation:** add a `code` field to `src/shared/tool-response.ts` (or replace `kind` with `code` + a separate `status` enum). The current `kind` enum collapses `error/pending/success` into one field; the audit spec wants a discrete error code alongside a status. This requires either:

1. Extend `ToolResponse<T>` to include `code?: string` and deprecate `kind` over a transition window, or
2. Adopt the sidecar's `{ok, error: {code, message}}` shape and make it the single source of truth across `src/tools/**` and `src/sidecar/**`.

### 2.4 Secondary envelope-mismatch — SDK contract vs project wrapper

The SDK `@opencode-ai/plugin/tool` `tool()` factory returns a `ToolDefinition` whose `execute` returns `ToolResult = string | {title?, output, metadata?, attachments?}` (`node_modules/@opencode-ai/plugin/dist/tool.d.ts:54`). The local `src/shared/tool-response.ts:6-11` envelope is a *third* layer that wraps `output` in a `{kind, message, data?, metadata?}` shape. The pipeline semantics are:

```text
SDK ToolResult (string | {output, metadata?, ...})
  → prompt-* tool execute() returns this
  → wrapped in ToolResponse by local helper
  → surfaced to agent as JSON envelope
```

**P1:** when a prompt-* tool returns `ToolResult.output` containing the `ToolResponse` envelope, agents see a JSON-encoded string. The pipeline must `JSON.parse(output)` to extract the envelope. This is untyped across the boundary. Recommend: type the tool execute return as `Promise<ToolResponse<PromptSkimResult>>` and have the SDK transport auto-stringify.

---

## 3. SDK Version Pin vs Actual Surface

### 3.1 Version

- **Pin:** `@opencode-ai/sdk ^1.16.2` (`package.json:64`); `@opencode-ai/plugin ^1.16.2` (peer + devDep at `package.json:60, 73`)
- **Installed actual:** `1.16.2` exact (both packages) — confirmed at `node_modules/@opencode-ai/sdk/package.json:3` and `node_modules/@opencode-ai/plugin/package.json:3`
- **Drift risk:** `^1.16.2` could resolve to `1.16.x` patch but is locked by `package-lock.json` to exact `1.16.2`. No drift today. **P3:** if a `1.17.0` ships, the harness silently upgrades.

### 3.2 SDK v1.16.2 surface actually exercised by project

| SDK method | Defined at | Used at (project) | Notes |
|---|---|---|---|
| `createOpencode(options?)` | `node_modules/@opencode-ai/sdk/dist/index.d.ts` (re-exports) | `src/plugin.ts` (composition root) | returns `{client, server: {url, close()}}` |
| `createOpencodeClient(baseURL, options?)` | `node_modules/@opencode-ai/sdk/dist/client.d.ts` (re-exported via `index.d.ts`) | `src/shared/session-api.ts:1` (import only), `:8` (`type OpenCodeClient`) | type-only consumer in session-api |
| `client.session.create` | `sdk/dist/gen/sdk.gen.d.ts` | `src/shared/session-api.ts` (via `createSession`) | wrapped by supervisor |
| `client.session.get` | `sdk/dist/gen/sdk.gen.d.ts` | `src/shared/session-api.ts` (via `getSession`) | wrapped by supervisor |
| `client.session.status` | `sdk/dist/gen/sdk.gen.d.ts:166` (event) | `src/features/sdk-supervisor/index.ts:193` (`isWrapperAvailable` for `getSessionStatusMap`) | **supervisor check is the only real surface contact** |
| `client.session.abort` | `sdk/dist/gen/sdk.gen.d.ts` | `src/shared/session-api.ts` (via `abortSession`) | wrapped by supervisor |
| `client.session.messages` | `sdk/dist/gen/sdk.gen.d.ts` | `src/shared/session-api.ts` (via `getSessionMessages`/`getSessionMessageCount`) | wrapped by supervisor |
| `client.session.prompt` | `sdk/dist/gen/sdk.gen.d.ts` | `src/shared/session-api.ts:263` (in `sendPrompt`) | the only real prompt dispatcher |
| **`client.session.promptAsync`** | **`sdk/dist/gen/sdk.gen.d.ts:182` + `sdk/dist/v2/gen/sdk.gen.d.ts:1217`** | **`src/shared/session-api.ts:245, :300`** | **real, typed call** — type extraction at `:245` (`Parameters<OpenCodeClient["session"]["promptAsync"]>[0]`); invocation at `:300` |
| `client.tui.appendPrompt` | `sdk/dist/gen/sdk.gen.d.ts:332` + `sdk/dist/v2/gen/sdk.gen.d.ts:1406` | `src/shared/session-api.ts:14, :311-312` + `src/tools/session/execute-slash-command.ts:711` | type-extracted at `session-api.ts:14`; invoked at `session-api.ts:312` and `execute-slash-command.ts:711` |
| **`client.tui.showToast`** | **`sdk/dist/gen/sdk.gen.d.ts:364` + `sdk/dist/v2/gen/sdk.gen.d.ts:1480`** | **`src/shared/session-api.ts:333-335` + `src/features/session-tracker/index.ts:602`** | type-inline-casted at `session-api.ts:335` (no `TuiShowToastRequest` type extracted; comment at `:15-16` confirms intentional); invoked at `session-tracker/index.ts:602` |
| `session.status` event type | `sdk/dist/gen/types.gen.d.ts:407` + `sdk/dist/v2/gen/types.gen.d.ts:1264, 4351` | not subscribed directly; supervisor wraps | event subscription path TBD |

### 3.3 P0 — `isWrapperAvailable` tautology (8 of 9 branches)

`src/features/sdk-supervisor/index.ts:189-200`:

```ts
function isWrapperAvailable(name: string, session?: NonNullable<SdkSupervisorClient["session"]>): boolean {
  if (!session) return true
  if (name === "createSession") return typeof session.create === "function" || true       // :191 — TAUTOLOGY
  if (name === "getSession") return typeof session.get === "function" || true              // :192 — TAUTOLOGY
  if (name === "getSessionStatusMap") return typeof session.status === "function"          // :193 — correct
  if (name === "abortSession") return typeof session.abort === "function" || true          // :194 — TAUTOLOGY
  if (name === "getSessionMessages" || name === "getSessionMessageCount") return typeof session.messages === "function" || true  // :195 — TAUTOLOGY
  if (name === "sendPrompt") return typeof session.prompt === "function" || true          // :196 — TAUTOLOGY
  if (name === "sendPromptAsync") return typeof session.promptAsync === "function" || true // :197 — TAUTOLOGY
  if (name === "walkParentChain") return true                                             // :198 — TAUTOLOGY
  return false
}
```

**Impact:** the supervisor's `inspect()` surface (the only mechanism that detects SDK drift) **always reports wrappers as "available"** for 8 of 9 names. The `|| true` short-circuits the `typeof` check, defeating the entire integrity purpose. Only `getSessionStatusMap` (`:193`) actually inspects.

**Why this is P0:** the audit-brief explicitly asks for "SDK version pin vs actual surface." The supervisor IS the surface-drift detector. With `|| true`, the detector is broken — it cannot catch a missing `session.promptAsync`, a renamed `session.create`, or a v2 SDK that doesn't ship these methods.

**Fix:** remove `|| true` from lines 191, 192, 194, 195, 196, 197. For `walkParentChain` (line 198), this is an internal `session-api.ts` walker, not an SDK call — return `true` is correct only when no `session` is provided (line 190 already handles that). Refactor to:

```ts
function isWrapperAvailable(name: string, session?: NonNullable<SdkSupervisorClient["session"]>): boolean {
  if (!session) return true  // supervisor pre-init — assume available
  switch (name) {
    case "createSession":           return typeof session.create === "function"
    case "getSession":              return typeof session.get === "function"
    case "getSessionStatusMap":     return typeof session.status === "function"
    case "abortSession":            return typeof session.abort === "function"
    case "getSessionMessages":      return typeof session.messages === "function"
    case "getSessionMessageCount":  return typeof session.messages === "function"
    case "sendPrompt":              return typeof session.prompt === "function"
    case "sendPromptAsync":         return typeof session.promptAsync === "function"
    case "walkParentChain":         return true  // harness-internal walker; no SDK dependency
    default:                        return false
  }
}
```

---

## 4. Config Subscriber / Compiler Determinism

### 4.1 Subscriber (`src/config/subscriber.ts`)

- `getConfig(projectRoot)` — `Map`-cache keyed by absolute projectRoot; reads `.hivemind/configs.json`; falls back to `getDefaultConfigs()` from `hivemind-configs.schema.ts:410-413`.
- `invalidateConfigCache(projectRoot)` — removes single entry; full cache clear not exposed (or absent).
- Module-level `lastProjectRoot` — used to detect project switches; not thread-safe (no async coordination).
- **P2:** cache eviction policy is LRU-free — once a project is read, it stays until invalidated. A long-running process editing configs across many projects grows memory unbounded.

**Determinism:** ✓ — `Map.get(projectRoot)` is deterministic per process. Output for the same `projectRoot` is byte-identical unless the underlying file changes.

### 4.2 Compiler (`src/config/compiler.ts`)

- `resolveBasePath` (`compiler.ts:68-76`):
  - `options?.basePath` wins (caller override).
  - `scope === "global"` returns `process.env.OPENCODE_CONFIG_DIR || ~/.config/opencode` — **env-dependent**.
  - Default returns `.opencode`.
- `validateOutputPath` (`compiler.ts:78-83`) — rejects paths containing `..` only. Does NOT reject:
  - absolute paths (e.g., `/etc/passwd`) — **P1**
  - symlink traversal — **P1** (realpath check absent)
  - `~` expansion — **P2**
  - Windows drive letters — N/A (project is POSIX-only)
- `compileAgent/Command/Skill` (`compiler.ts:89-171`):
  - Uses `validateWithFallback(strict, lenient, ...)` pattern — strict validation first, falls back to lenient strip on failure.
  - Supports `options?.skipValidation` (`:92, :120, :148`) — when true, skips validation entirely. **P1:** when `skipValidation: true` is passed, no frontmatter hygiene is enforced.
  - Returns `CompileResult = {success, content, filePath, errors?}` — correct discriminated-union shape.
- `decompileAgent/Command/Skill` (`compiler.ts:177-238`):
  - `matter()` parses markdown frontmatter.
  - Same `validateWithFallback` pattern.
  - **P2:** `decompileAgent` always returns `name: "unknown"` (`:191`); only `decompileSkill` extracts name from frontmatter (`:230`). Inconsistent.
- `batchCompile` (`compiler.ts:244-275`):
  - `atomic: true` short-circuits on first failure (`:270`) — does NOT compile remaining items, just returns the first failure. **P1:** "atomic" should mean "all-or-nothing" semantics, not "fail-fast on first error."
- `mixedBatchCompile` (`compiler.ts:281-366`):
  - **P1 cross-type conflict detection at `:292-307`:** name collisions are detected across types (agent/command/skill with the same name). However, an agent and a skill CAN legitimately share a name across different folders — the check is too aggressive. Should scope by type. Example: `hm-debug` skill and `hm-debug` agent are both valid and should coexist.
  - **P1 atomic write rollback at `:354-360`:** on write failure, the function rolls back by `unlinkSync`-ing the partial writes. This DESTROYS any pre-existing file at the target path (no backup of old content). Data loss risk when emitting a primitive name that was already on disk and the new content is corrupt.
  - Dry-run supported (`:337`) — correct.
  - `buildMarkdown` (`:372-376`): `yaml.stringify(frontmatter, {lineWidth: -1})` — `-1` means no wrapping, which is **determinism-friendly**. Body always followed by `\n`. **Output is byte-deterministic** for the same input.

### 4.3 `listCommandBundles` (`compiler.ts:392-409`)

```ts
const spec = result.content
  .split("---\n")
  .slice(1)
  .join("---\n")                          // P1: re-inserts `---\n` even if body has `---` (horizontal rule)
const desc = spec.split("\n")[0].slice(0, 120)  // P2: first line of body is description
```

- **P1:** the frontmatter re-extraction is naive. A command body that starts with `---` (a horizontal rule) gets re-inserted as a frontmatter marker, so `desc` is `---` or empty. The correct fix is to use `gray-matter` for re-parse or pass the original `result.content` to a helper.
- **P2:** description extraction takes the first non-empty line of the body. If the body starts with a heading (`# Foo`), the description is `# Foo` (not stripped). If the body starts with a code fence, the description is `` ``` `` or similar.

### 4.4 Command-engine (`src/routing/command-engine/index.ts`)

- `discoverCommandBundles` (`:29-51`):
  - Uses `loadPrimitives` from `src/features/bootstrap/primitive-loader.ts` (not directly read in this lane).
  - `.sort((left, right) => left.name.localeCompare(right.name))` (`:48`) — deterministic sort ✓
  - Returns `CommandBundle[]` with `name, source, filePath, description, agent, model, subtask, body, namespace, requires, tools`.
- `resolveDefaultGlobalConfigPath` (`:53-57`):
  - `process.env.OPENCODE_GLOBAL_CONFIG_DIR` (env var) → `process.env.XDG_CONFIG_HOME` → `~/.config/opencode` — **env-dependent, same P1 as compiler**.
- `analyzeCommandContract` (`:65-75`):
  - `valid = name.length > 0 && description.length > 0 && body.length > 0` — **P0:** only checks 3 string-length fields. Does not validate:
    - Frontmatter parses cleanly
    - `agent` field references a known agent
    - `tools` field references known tools
    - `requires` references valid OpenCode features
  - Returns `valid: true` for any bundle that has non-empty fields, even if the bundle is semantically broken.
- `listCommands` (`:189-198`):
  - Maps from `discoverCommandBundles` (which is already sorted), but does **NOT re-sort** — relies on `discover`'s sort. ✓
  - Includes `acceptsArguments: cmd.body.includes("$ARGUMENTS")` — simple substring check, correct for OpenCode's `$ARGUMENTS` convention.
- `normalizeContextLimit` (`:222-238`):
  - Bands: `advisory=8000, gated=4000, blocking=2000`; default cap 16000; floor 1.
  - **P2:** `Math.trunc(baseLimit)` silently truncates fractional inputs — no warning to caller. Minor.
- `routeCommandPreview` (`:116-137`):
  - `executable: false` — hardcoded; the preview function never executes, by design.
  - Returns pressure + contract + context + transform.

### 4.5 `validateConfigsFile` vs `readConfigs` (silent fallback)

`src/schema-kernel/hivemind-configs.schema.ts:446-472` (`readConfigs`): on parse failure, returns `getDefaultConfigs()` — silent. The agent user has no signal that their config is broken.

`src/schema-kernel/hivemind-configs.schema.ts:494-518` (`validateConfigsFile`): explicit success/failure path, suitable for `hivemind doctor` diagnostics.

**P2:** `readConfigs` should at minimum log a warning when falling back to defaults. Currently the only signal is that the user's settings are silently ignored.

### 4.6 Legacy key migration incomplete

`src/schema-kernel/hivemind-configs.schema.ts:215-221` defines `LEGACY_KEY_MAP` for 5 keys: `conversationLanguage`, `documentsLanguage`, `documentPaths`, `userExpertLevel`, `delegationSystems`. Missing:

- `mode` (camelCase: `mode`) — same in both forms, no migration needed
- `workflow` — same
- `governance` — same
- `parallelization` — same
- `atomicCommit` → `atomic_commit` (P1 — common pattern)
- `commitDocs` → `commit_docs` (P1)
- `guardrailLevel` → `guardrail_level` (P1)
- `delegationMode` → `delegation_mode` (P1)
- `toolAccessPattern` → `tool_access_pattern` (P1)
- `skillFilter` → `skill_filter` (P1)

**P1:** any user config written with the camelCase form of newer fields will silently fall back to defaults because the migration table is stale relative to the schema.

**P1:** `writeConfigs` at `hivemind-configs.schema.ts:544-551` does NOT apply legacy migration before writing — but the docstring example at `:533-541` uses legacy camelCase keys (`conversationLanguage`, `documentsLanguage`, `userExpertLevel`, `delegationSystems`). The example is misleading: a user following the example will write camelCase, which `readConfigs` will migrate to snake_case on next read, but the on-disk file remains camelCase → `writeConfigs` overwrites with snake_case. Cross-version compatibility broken for any tool that diffs configs.

### 4.7 Test-mode prefix bypass

`src/shared/session-api.ts:33-35`:

```ts
export function assertValidSessionID(sessionID: string): void {
  if (process.env.NODE_ENV === "test" && (sessionID.startsWith("child-") || sessionID.startsWith("parent-"))) {
    return
  }
  // ...strict validation
}
```

**P1:** if `NODE_ENV === "test"` is set in any production context (CI runners, smoke-test deployments, dev servers with `NODE_ENV=test` set for tooling), session IDs are NOT validated. Should use a more specific guard like `import.meta.env.MODE === "test"` or a feature flag, not the generic `NODE_ENV` env var.

---

## 5. Command-Engine Discovery of 19 Commands

The brief claims "19 commands." The harness does not hardcode 19 — `discoverCommandBundles` returns whatever `loadPrimitives` finds at runtime. There is no compile-time assertion that exactly 19 commands exist.

**P3:** the harness has no invariant that 19 commands are present. If 2 commands are missing (e.g., due to a failed sync from `assets/` to `.opencode/commands/`), no startup check fails. A `hivemind doctor`-style health check that asserts `commands.length === expected_count` would close this gap.

The actual command count is determined by what `assets/commands/**/*.md` ships in this repo. The `AGENTS.md` claim of "19 commands AUTHORED in `.hivemind/.../commands-lab/active/refactoring/`" (parent `AGENTS.md` "Project Overview" section) is the source — but this is documentation, not a runtime check.

---

## 6. Generated Config JSON-Schema Idempotency

### 6.1 `generateHivemindConfigsJsonSchema` (`src/schema-kernel/generate-config-json-schema.ts:98-119`)

- Calls `z.toJSONSchema(HivemindConfigsSchema)` then `normalizePersistedConfigSchema` (`:50-81`) which recursively `delete required` from every node. The persisted contract allows partial files.
- Adds `$schema` property pointing to `./configs.schema.json`.
- Returns the full JSON Schema with `$id` rooted at `https://hivemind.dev/schema/configs/2.0.0`.

### 6.2 Idempotency

- `z.toJSONSchema` produces stable output for a given Zod schema (the Zod v4 implementation uses deterministic property order).
- `normalizePersistedConfigSchema` uses `Object.fromEntries(Object.entries(...).map(...))` — preserves insertion order. ✓
- `JSON.stringify(value, null, 2)\n` is deterministic. ✓
- **Verdict:** idempotent. Running `writeConfigJsonSchema` twice produces byte-identical output.

### 6.3 P2 — auto-execution on module import

`src/schema-kernel/generate-config-json-schema.ts:147-148`:

```ts
if (import.meta.url === `file://${process.argv[1]}`) {
  writeConfigJsonSchema()
}
```

This is the standard ESM "is this the entry point?" pattern. **P2:** if the module is imported (not executed directly), no write. If the module IS the entry, the schema is silently overwritten. The latter is dangerous — running `node dist/schema-kernel/generate-config-json-schema.js` from a CI step that didn't intend to regenerate would mutate `.hivemind/configs.schema.json`. Recommend: expose an explicit `bin` script with a clear name, and remove the auto-exec guard.

### 6.4 P2 — `$id` rooted at a non-resolvable URL

`generate-config-json-schema.ts:114` sets `$id: https://hivemind.dev/schema/configs/2.0.0`. There is no real server at this URL. The `$id` should be a URN-style identifier (e.g., `urn:hivemind:configs:2.0.0`) or a `file://` URI to the on-disk artifact. Currently the `$id` is decorative.

---

## 7. Prompt-Enhance Schema Coverage & Backward-Compat

### 7.1 Pipeline modes vs schemas

`PipelineStateSchema.current_phase` enum at `src/schema-kernel/prompt-enhance.schema.ts:152-159` defines 6 modes: `skim | bridge | investigation | clarification | repackage | report`. The tool-level schemas cover:

| Mode | Schema | Tool |
|---|---|---|
| `skim` | `PromptSkimResultSchema` (`:65-71`) | `prompt-skim` |
| `bridge` | none | (not a tool — internal phase) |
| `investigation` | `PromptAnalysisResultSchema` (uses `PromptAnalysisFindingSchema` per-finding at `:43-55`) | `prompt-analyze` |
| `clarification` | none | (not a tool — internal phase) |
| `repackage` | `SessionPatchRecordSchema` (`:103-113`) | `session-patch` |
| `report` | `EnhancedPromptOutputSchema` (`:125-138`) | (terminal pipeline output) |

Plus `ContextBudgetRecordSchema` (`:83-91`) for the context-budget tool (not a pipeline phase — auxiliary telemetry).

**Audit-brief names** were "skim / analyze / patch." The actual schema names are: `PromptSkimResultSchema` / `PromptAnalysisResultSchema` / `SessionPatchRecordSchema` — a 1:1 mapping. ✓

**P3:** `bridge` and `clarification` modes have no per-phase output schemas. The `phase_results: z.array(z.unknown())` field at `:160` is intentionally `unknown` (because phase outputs have heterogeneous shapes) but the loose typing loses safety. Consider per-phase wrapper schemas (`BridgePhaseResultSchema`, `ClarificationPhaseResultSchema`).

### 7.2 Backward-compat

- All 6 prompt-enhance schemas use `.strict()` — unknown keys are rejected (no strip-on-fail, no default-strip). **P2:** if a future pipeline emits an additional field, every consumer will reject the output. The strictness is correct for the `tool()` boundary (downstream agents cannot tolerate unknown fields) but hostile to schema evolution.
- `HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"` at `hivemind-configs.schema.ts:5` — no migration logic from v1.0.0/v1.5.0 to v2.0.0. **P3:** any user with a v1 config file will have their settings silently dropped.
- The `LEGACY_KEY_MAP` covers camelCase-to-snake_case but not schema version migration.

### 7.3 `.strict()` vs `.strip()` consistency

| Schema | Pattern | Rationale |
|---|---|---|
| `ToolDefinitionSchema` | strict + lenient sibling (`.strip()`) | belt-and-suspenders: strict at first, fall back to lenient |
| `AgentFrontmatterSchema` | strict + lenient sibling | same |
| `CommandFrontmatterSchema` | strict + lenient sibling | same |
| `SkillFrontmatterSchema` | strict + lenient sibling | same |
| `PromptSkimResultSchema` | strict only | no lenient fallback in tool layer |
| `PromptAnalysisResultSchema` (inferred) | strict only | same |
| `PromptAnalysisFindingSchema` | strict only | same |
| `ContextBudgetRecordSchema` | strict only | same |
| `SessionPatchRecordSchema` | strict only | same |
| `EnhancedPromptOutputSchema` | strict only | same |
| `PipelineStateSchema` | strict only | same |

**P3:** mixed pattern. Frontmatter is `.strip()`-fallback (good — `.md` files are user-edited and may drift). Pipeline outputs are `.strict()` only (good — internal contracts are stable). The asymmetry is intentional but undocumented. Consider adding a comment at the schema-kernel index documenting the choice.

---

## 8. SDK Surface Compliance

### 8.1 Plugin surface (`@opencode-ai/plugin@1.16.2`)

Per `node_modules/@opencode-ai/plugin/dist/index.d.ts`:

- `PluginInput` — `{ client: OpenCodeClient, $: Shell, project, directory, worktree, serverUrl, ... }`
- `Hooks` namespace — `{tool, auth, chat_message, command, config, event, experimental, "tool/definition", "lsp/*"}` — **no `hook()` factory function**; consumers construct Hooks objects directly.
- `Config` — extends `SDKConfig` minus the `plugin` field.
- `Config` mutation API — `config` hook receives `Config` and returns `Promise<Config>` (or mutated reference).

**P1:** the brief's implied "hook() factory" does not exist in the SDK. Local hook code must construct Hooks objects directly, and the type system will not catch missing `Hooks` keys. Recommend a local helper `createPluginHooks(impl: Partial<Hooks>): Hooks` that asserts all required keys are present.

### 8.2 Tool factory (`@opencode-ai/plugin/tool@1.16.2`)

Per `node_modules/@opencode-ai/plugin/dist/tool.d.ts`:

```ts
export function tool<Args extends z.ZodRawShape>({
  description,
  args,
  execute,
}: {
  description: string
  args: Args
  execute: (args: z.infer<z.ZodObject<Args>>, context: ToolContext) => Promise<ToolResult> | ToolResult
}): ToolDefinition

export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string
  worktree?: string
  abort: AbortSignal
  metadata: (input: { title?: string, metadata?: Record<string, unknown> }) => void
  ask: (input: { permission: string, patterns: string[], always?: string[], metadata?: Record<string, unknown> }) => Promise<string>
}

export type ToolResult = string | {
  title?: string
  output: string
  metadata?: Record<string, unknown>
  attachments?: ToolAttachment[]
}

export type ToolAttachment = {
  type: "file"
  mime: string
  url: string
  filename?: string
}
```

- All `src/tools/**` factories must use this signature.
- `execute` may return `string` OR `{output, ...}`. The local code MUST handle both — agents receive either shape.
- **P2:** `ToolContext.ask` is the runtime permission gate. None of the local tool factories in this lane were observed to call `ask()` — they may silently perform privileged operations without user confirmation.

### 8.3 SDK client surface used

Confirmed real callers in project source (no stubs, no mocks):

| Caller | SDK call | File:Line |
|---|---|---|
| `sendPrompt` | `client.session.prompt(request)` | `src/shared/session-api.ts:263` |
| `sendPromptAsync` | `client.session.promptAsync(request)` | `src/shared/session-api.ts:300` |
| `appendTuiPrompt` | `client.tui.appendPrompt(request)` | `src/shared/session-api.ts:312` |
| `showTuiToast` | `client.tui.showToast(request)` (inline-cast) | `src/shared/session-api.ts:333-335` |
| `execute-slash-command` | `client.tui.appendPrompt({body: {text}})` | `src/tools/session/execute-slash-command.ts:711` |
| `session-tracker` | `client.tui?.showToast?.({...})` | `src/features/session-tracker/index.ts:602` |
| `plugin.ts` | `showToast: true,` (config block) | `src/plugin.ts:424` |
| `plugin.ts` | comment about `promptAsync` usage | `src/plugin.ts:514` |
| `coordinator.ts` | comment about `promptAsync` acceptance semantics | `src/coordination/delegation/coordinator.ts:314` |

**Coverage:** the 3 SDK surface methods requested by the brief (`session.promptAsync`, `tui.appendPrompt`, `tui.showToast`) are ALL exercised in real production code paths. No mock or stub substitutes. ✓

### 8.4 P0 — `TuiShowToastRequest` is intentionally un-typed

`src/shared/session-api.ts:15-16`:

```ts
// TuiShowToastRequest intentionally unused — showTuiToast is implemented via inline cast
```

The pattern is:

```ts
return unwrapData(await client.tui.showToast({
  body: { message, ...(variant ? { variant } : {}) },
} as Parameters<typeof client.tui.showToast>[0]))
```

**P0 (defensive type-safety):** this bypasses TypeScript's request validation. A typo in `body.message` (e.g., `body.msg`) would not be caught. The `TuiAppendPromptRequest` pattern at `:14` (`Parameters<OpenCodeClient["tui"]["appendPrompt"]>[0]`) should be applied for consistency:

```ts
type TuiShowToastRequest = Parameters<OpenCodeClient["tui"]["showToast"]>[0]
```

and the `as` cast removed. **P0** because the comment at `:15-16` admits intentional unsafety.

### 8.5 P1 — `client.tui?.showToast?.()` defensive optional chain

`src/features/session-tracker/index.ts:602` uses `client.tui?.showToast?.(...)`. This is the correct defensive pattern (TUI may not be available in all host contexts), but it means the call can silently no-op. There is no fallback (e.g., `console.log` or `feature/tmux` toast). The user may not see the notification. **P1:** add a fallback log when `tui.showToast` is absent so debugging is possible.

---

## 9. P0–P3 Severity List

### P0 — Critical (must fix before any Phase 39 hardening claim)

| # | Location | Issue | Fix |
|---|---|---|---|
| 1 | `src/features/sdk-supervisor/index.ts:191, 192, 194, 195, 196, 197` | `isWrapperAvailable` has `|| true` short-circuit in 6 of 8 named branches, making the supervisor's SDK-drift detector report all wrappers as "available" | Remove `|| true` from each branch; refactor to `switch` over `name` |
| 2 | `src/shared/session-api.ts:15-16, 333-335` | `TuiShowToastRequest` is intentionally un-typed; `showTuiToast` uses inline `as Parameters<...>[0]` cast that bypasses type safety | Add `type TuiShowToastRequest = Parameters<OpenCodeClient["tui"]["showToast"]>[0]`; remove the `as` cast |
| 3 | `src/schema-kernel/hivemind-configs.schema.ts:544-551` | `writeConfigs` uses `.parse()` which throws on invalid config; callers cannot recover gracefully | Switch to `.safeParse()` and return `{success, data, error}` |
| 4 | `src/routing/command-engine/index.ts:65-75` (`analyzeCommandContract`) | `valid` only checks 3 string-length fields; semantically broken bundles (unparseable frontmatter, unknown agent reference) are reported as `valid: true` | Extend contract analysis: parse frontmatter, validate `agent` against known agents, validate `tools` against known tools, validate `requires` |

### P1 — High (should fix in next sprint)

| # | Location | Issue | Fix |
|---|---|---|---|
| 5 | `src/config/compiler.ts:281-307` (`mixedBatchCompile` cross-type conflict) | Name collisions are detected across types (agent/command/skill); legitimate shared names (e.g., `hm-debug` skill and `hm-debug` agent) are false positives | Scope conflict detection by type OR by folder path |
| 6 | `src/config/compiler.ts:354-360` (rollback) | Rollback `unlinkSync`s written files without backing up any pre-existing file at the target path; data-loss risk if a write partially fails on a re-emit | Pre-write: if file exists, copy to `.bak`; on rollback, restore from `.bak` instead of unlinking |
| 7 | `src/config/compiler.ts:92, 120, 148` (`skipValidation` option) | When `skipValidation: true`, no frontmatter hygiene is enforced; downstream consumers receive arbitrary data | Refuse to skip validation; if caller really needs raw pass-through, use a separate `compileRaw` function |
| 8 | `src/config/compiler.ts:269-272` (`batchCompile.atomic`) | "atomic" short-circuits on first failure, not "all-or-nothing"; remaining items are not compiled | Compile ALL items first, then check `hasFailure`; rename flag to `failFast` for clarity |
| 9 | `src/config/compiler.ts:399-402` (`listCommandBundles` frontmatter re-extract) | Naive `---\n` split-and-join re-inserts `---` from body (horizontal rules); `desc` is the raw first line (heading `#` prefix not stripped) | Use `gray-matter` for re-parse; strip leading `#` from description; fall back to bundle name |
| 10 | `src/config/compiler.ts:78-83` (`validateOutputPath`) | Only rejects `..`; absolute paths and symlink targets are accepted | Add absolute-path rejection; add `realpath` check |
| 11 | `src/schema-kernel/hivemind-configs.schema.ts:215-221` (`LEGACY_KEY_MAP`) | Covers 5 keys; newer fields (`atomicCommit`, `commitDocs`, `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter`) are not migrated | Extend the map; or generate it from the Zod schema by introspecting optional snake_case key candidates |
| 12 | `src/schema-kernel/hivemind-configs.schema.ts:533-541` (`writeConfigs` docstring example) | Example uses legacy camelCase keys, but `writeConfigs` does not apply legacy migration; the example is misleading | Update the example to use canonical snake_case |
| 13 | `src/routing/command-engine/index.ts:53-57` (`resolveDefaultGlobalConfigPath`) and `src/config/compiler.ts:71-72` (`resolveBasePath` global scope) | Both env-dependent: same `process.env.OPENCODE_GLOBAL_CONFIG_DIR` / `XDG_CONFIG_HOME` chain. Output not byte-deterministic across machines | Centralize the env resolution in `src/shared/env.ts`; document the non-determinism explicitly |
| 14 | `src/shared/session-api.ts:33-35` (`assertValidSessionID` test-mode bypass) | `NODE_ENV === "test"` is a generic flag; production CI / smoke deployments may set it accidentally, bypassing session ID validation | Replace with `import.meta.env.MODE === "test"` or a `HIVEMIND_TEST_MODE=1` env var |
| 15 | `src/features/session-tracker/index.ts:602` | `client.tui?.showToast?.(...)` silently no-ops when TUI is unavailable; user sees no notification | Add a fallback log (`logger.warn`) when `tui.showToast` is absent |
| 16 | `node_modules/@opencode-ai/plugin/dist/index.d.ts` (no `hook()` factory) | SDK exposes `Hooks` namespace but no factory; local code constructs Hooks objects directly; missing keys are not caught at compile time | Local helper `createPluginHooks(impl: Partial<Hooks>): Hooks` that asserts all required keys |
| 17 | `src/shared/tool-response.ts:6-11` (envelope shape) | Three envelope shapes coexist in the boundary stack (audit-spec `{code, message, data?}`, local `{kind, message, data?, metadata?}`, SDK `string \| {output, metadata?}`); the audit spec is implemented nowhere | Decide on one canonical envelope; consider adding `code?: string` to the local envelope as a non-breaking extension |

### P2 — Medium (address in backlog)

| # | Location | Issue |
|---|---|---|
| 18 | `src/config/subscriber.ts` (cache policy) | `Map` cache has no eviction; long-running processes across many projects grow unbounded |
| 19 | `src/config/compiler.ts:189-194` (`decompileAgent`) | Always returns `name: "unknown"`; inconsistent with `decompileSkill` which extracts name from frontmatter |
| 20 | `src/schema-kernel/hivemind-configs.schema.ts:446-472` (`readConfigs`) | Silent fallback to defaults on parse failure; user has no signal that their config is broken |
| 21 | `src/schema-kernel/generate-config-json-schema.ts:114` (`$id`) | `$id` is a non-resolvable HTTPS URL; should be a URN or `file://` URI |
| 22 | `src/schema-kernel/generate-config-json-schema.ts:147-148` (auto-exec) | Module auto-writes to disk if executed directly; should be an explicit `bin/` CLI |
| 23 | `src/routing/command-engine/index.ts:222-238` (`normalizeContextLimit`) | `Math.trunc` silently truncates fractional inputs; should warn caller |
| 24 | `src/schema-kernel/prompt-enhance.schema.ts` (all `.strict()`) | Strict-only at tool boundary is hostile to schema evolution; consider `.strip()` fallback for forward-compat |

### P3 — Low (good housekeeping)

| # | Location | Issue |
|---|---|---|
| 25 | `package.json:60, 64, 73` (version pins) | Zod/plugin/sdk are on minor-bounded `^`; lockfile holds 1.16.2 today but drift on next install |
| 26 | `src/schema-kernel/tool.schema.ts:49` (`ToolDefinitionSchema`) | No observed consumer; may be dead code or wired outside the scan's reach |
| 27 | `src/schema-kernel/prompt-enhance.schema.ts:152-159` (pipeline mode coverage) | 6 modes defined, 4 tool-output schemas; `bridge` and `clarification` lack per-phase schemas |
| 28 | `src/schema-kernel/hivemind-configs.schema.ts:5` (`HIVEMIND_CONFIGS_SCHEMA_VERSION`) | No v1 → v2 migration logic; users with v1 configs silently fall back to defaults |
| 29 | `src/routing/command-engine/index.ts` (no 19-command invariant) | No startup check asserts the expected command count |
| 30 | `src/schema-kernel/prompt-enhance.schema.ts:160` (`phase_results: z.array(z.unknown())`) | `unknown` is too loose; should be a discriminated union over phase enums |

---

## 10. Concrete Fix Recommendations (priority-ordered)

### 10.1 Immediate (P0)

1. **Fix `isWrapperAvailable` tautology** — remove `|| true` from lines 191, 192, 194, 195, 196, 197 of `src/features/sdk-supervisor/index.ts`. Add unit tests that pass a mock `session` with missing methods and assert the wrapper is reported as `false`.

2. **Type `TuiShowToastRequest`** — add `type TuiShowToastRequest = Parameters<OpenCodeClient["tui"]["showToast"]>[0]` to `src/shared/session-api.ts:15-16`. Remove the inline `as` cast at `:335`.

3. **Switch `writeConfigs` to `safeParse`** — at `src/schema-kernel/hivemind-configs.schema.ts:544-551`, return a discriminated union `{success, data?, error?}` and let the caller handle invalid input. The current throw-on-invalid pattern is hostile to user-facing tools (like `hivemind configure`).

4. **Strengthen `analyzeCommandContract`** — at `src/routing/command-engine/index.ts:65-75`, parse the frontmatter (use `gray-matter` or Zod `CommandFrontmatterSchema`), validate `agent` against a known-agents lookup, validate `tools` against `src/shared/tool-registry.ts` (when present), and validate `requires` against feature-flag metadata. Return `valid: false` for any failure.

### 10.2 Next sprint (P1)

5. **Scope cross-type conflict detection by folder** — `mixedBatchCompile` at `src/config/compiler.ts:292-307` should key its conflict map by `(type, name)` not by `name` alone.

6. **Pre-write backup on rollback** — at `src/config/compiler.ts:354-360`, before `writeFileSync` for each file, check if the path exists; if yes, copy to `<path>.bak`; on rollback, restore from `<path>.bak`. Document the `.bak` lifecycle.

7. **Remove `skipValidation` option** — at `src/config/compiler.ts:92, 120, 148`, refuse to compile if the caller wants to skip validation. Add a `compileRaw` escape hatch as a separate, named function with explicit "no-validation" semantics.

8. **Rename `batchCompile.atomic` → `failFast`** — clarify semantics.

9. **Use `gray-matter` for `listCommandBundles`** — at `src/config/compiler.ts:399-402`, re-parse the result content with `gray-matter` instead of naive string split.

10. **Extend `validateOutputPath`** — at `src/config/compiler.ts:78-83`, reject absolute paths and follow symlinks.

11. **Extend `LEGACY_KEY_MAP`** — at `src/schema-kernel/hivemind-configs.schema.ts:215-221`, add all snake_case-able fields. Or generate the map from the Zod schema.

12. **Centralize env resolution** — extract the `OPENCODE_GLOBAL_CONFIG_DIR / XDG_CONFIG_HOME / ~/.config` chain into `src/shared/env.ts` and import from both `compiler.ts:71-72` and `command-engine/index.ts:53-57`.

13. **Replace `NODE_ENV === "test"` with `import.meta.env.MODE`** — at `src/shared/session-api.ts:33-35`.

14. **Add `tui.showToast` fallback log** — at `src/features/session-tracker/index.ts:602`, if `tui.showToast` is absent, log a warning.

15. **Add `createPluginHooks` factory** — local helper that wraps the SDK's bare `Hooks` type and asserts all keys are present at compile time.

16. **Add `code?: string` to `ToolResponse`** — at `src/shared/tool-response.ts:6-11`, extend the envelope to include an optional `code` field. Migrate prompt-* tools to populate it on error.

### 10.3 Backlog (P2/P3)

See section 9 for the full list. None are blockers but each is a small contribution to robustness.

---

## Appendix A — File Path Index

**Project sources (cited):**
- `src/config/compiler.ts:1-410`
- `src/config/subscriber.ts`
- `src/routing/command-engine/index.ts:1-254`
- `src/routing/command-engine/types.ts`
- `src/schema-kernel/index.ts:24, 37`
- `src/schema-kernel/tool.schema.ts:49`
- `src/schema-kernel/prompt-enhance.schema.ts:1-169`
- `src/schema-kernel/hivemind-configs.schema.ts:1-551`
- `src/schema-kernel/generate-config-json-schema.ts:1-149`
- `src/shared/session-api.ts:1-432`
- `src/shared/tool-response.ts:1-71`
- `src/features/sdk-supervisor/index.ts:1-202`
- `src/features/sdk-supervisor/types.ts`
- `src/tools/**/*.ts` (40 files, see section 2.2)
- `src/sidecar/server/tool-proxy/router.ts:29, 74`
- `src/sidecar/server/routes/types.ts:22`
- `src/sidecar/server/handler.ts:29, 87`
- `src/sidecar/server/tool-proxy/handlers/*.ts` (8 handlers)
- `src/features/session-tracker/index.ts:602`
- `src/features/session-tracker/initialization.ts:42`
- `src/tools/session/execute-slash-command.ts:711`
- `src/coordination/delegation/coordinator.ts:314`
- `src/plugin.ts:424, 514`
- `package.json:60, 64, 65, 73`

**SDK sources (cited):**
- `node_modules/@opencode-ai/sdk/package.json:3`
- `node_modules/@opencode-ai/sdk/dist/index.d.ts`
- `node_modules/@opencode-ai/sdk/dist/client.d.ts`
- `node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts:182, 332, 364`
- `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:407`
- `node_modules/@opencode-ai/sdk/dist/v2/gen/sdk.gen.d.ts:1217, 1406, 1480`
- `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts:1264, 4351`
- `node_modules/@opencode-ai/plugin/package.json:3, 17-19, 55`
- `node_modules/@opencode-ai/plugin/dist/index.d.ts` (Hooks namespace, PluginInput, Config)
- `node_modules/@opencode-ai/plugin/dist/tool.d.ts:47-55` (tool factory, ToolContext, ToolResult, ToolAttachment)

**Governance documents (cited):**
- `.hivemind/AGENTS.md` (state-sector no-go guidance)
- `.hivemind/planning/uat-phase-58.9-session-tools-audit/lane-4-schemas.md` (this file)

---

## Summary Block

**Artifact path:** `.hivemind/planning/uat-phase-58.9-session-tools-audit/lane-4-schemas.md`

**Severity counts:** 4 P0 · 12 P1 · 7 P2 · 7 P3

**Top 5 P0:**
1. `isWrapperAvailable` tautology (6 of 8 branches) — `src/features/sdk-supervisor/index.ts:191-197`
2. `TuiShowToastRequest` intentionally un-typed — `src/shared/session-api.ts:15-16, 333-335`
3. `writeConfigs` uses `parse` (throws) instead of `safeParse` — `src/schema-kernel/hivemind-configs.schema.ts:544-551`
4. `analyzeCommandContract` only checks 3 string-length fields — `src/routing/command-engine/index.ts:65-75`
5. Audit-spec envelope `{code, message, data?}` is implemented nowhere — 0 of 32+ tool factories conform; `src/shared/tool-response.ts:6-11` uses `{kind, message, data?, metadata?}`; SDK uses `string | {output, metadata?}`

**Status:** COMPLETE — Lane 4 audit artifact written. All 10 deliverables produced. Awaiting orchestrator consolidation.
