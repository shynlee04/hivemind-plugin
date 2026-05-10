# OpenCode Interface Research — SDK / Server / Plugin / Tool / Hook Contracts

**Date:** 2026-04-26  
**Researcher:** gsd-phase-researcher subagent  
**Scope:** Current OpenCode runtime interfaces relevant to auditing this Hivemind harness repository.  
**Non-scope:** No implementation fixes proposed; no Markdown files audited as target code.

## Evidence Legend

- **[DOCS-PROVEN]** — confirmed in official OpenCode documentation at `opencode.ai/docs/*`.
- **[SOURCE-PROVEN]** — confirmed in OpenCode official GitHub source linked from docs or package source.
- **[NPM-VERIFIED]** — confirmed via `npm view` during this research session.
- **[CODE-INFERRED]** — inferred from this repository's TypeScript source.
- **[UNVERIFIED]** — plausible but not proven by current docs/source in this session.

## Executive Summary

OpenCode's current public integration surface is a server/client architecture: `opencode serve` exposes an OpenAPI 3.1 HTTP API, and `@opencode-ai/sdk` is generated from that API. [DOCS-PROVEN: https://opencode.ai/docs/server/] [DOCS-PROVEN: https://opencode.ai/docs/sdk/]

Plugins are JavaScript/TypeScript modules exporting a `Plugin` function that receives `{ project, client, $, directory, worktree }` in docs, while current plugin package source additionally includes `serverUrl` and `experimental_workspace`. [DOCS-PROVEN: https://opencode.ai/docs/plugins/] [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/index.ts]

The Hivemind harness depends on these external contracts in `src/plugin.ts`, `src/lib/session-api.ts`, `src/lib/delegation-manager.ts`, `src/lib/sdk-delegation.ts`, `src/lib/spawner/session-creator.ts`, `src/hooks/*`, and `src/tools/*`. [CODE-INFERRED: repository source scan]

The highest-value audit focus is not generic TypeScript compilation alone. Review agents should flag code that is only validated through local mocks while depending on real OpenCode runtime behavior: plugin hook names and payload shapes, SDK method names and response envelopes, custom tool context injection, session create/prompt request bodies, and event names/properties. [CODE-INFERRED] [SOURCE-PROVEN]

## Current OpenCode Interface Contracts Relevant to Audit

### SDK and Server

1. `@opencode-ai/sdk` is installed from npm and provides `createOpencode()` and `createOpencodeClient()`. `createOpencode()` starts both server and client; `createOpencodeClient({ baseUrl })` connects to an existing server. [DOCS-PROVEN: https://opencode.ai/docs/sdk/]
2. The server command is `opencode serve [--port <number>] [--hostname <string>] [--cors <origin>]`; defaults are port `4096` and hostname `127.0.0.1`. [DOCS-PROVEN: https://opencode.ai/docs/server/]
3. Server auth is enabled with `OPENCODE_SERVER_PASSWORD`; username defaults to `opencode` unless `OPENCODE_SERVER_USERNAME` is set. [DOCS-PROVEN: https://opencode.ai/docs/server/]
4. The server publishes an OpenAPI 3.1 spec at `http://<hostname>:<port>/doc`; docs state this spec generates the SDK. [DOCS-PROVEN: https://opencode.ai/docs/server/]
5. The SDK current npm `latest` version for `@opencode-ai/sdk` is `1.14.25`, modified `2026-04-26T16:32:45.737Z`; this repo pins `^1.14.20`. [NPM-VERIFIED: `npm view @opencode-ai/sdk version time.modified dist-tags --json`] [CODE-INFERRED: `package.json`]
6. The SDK generated client currently exposes `client.session.status()`, `client.session.create()`, `client.session.prompt()`, `client.session.promptAsync()`, `client.session.messages()`, `client.event.subscribe()`, `client.app.log()`, `client.app.agents()`, `client.tool.ids()`, and `client.tool.list()`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/sdk.gen.ts]
7. `SessionCreateData` currently has `body?: { parentID?: string; title?: string }`, optional `query.directory`, and URL `/session`; no `body.permission` field appears in the generated type. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/types.gen.ts]
8. `SessionPromptData` and `SessionPromptAsyncData` currently accept `body.messageID`, `body.model`, `body.agent`, `body.noReply`, `body.system`, `body.tools`, and `body.parts`, plus optional `query.directory`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/types.gen.ts]
9. `session.prompt()` maps to `POST /session/{id}/message` and returns `{ info: AssistantMessage, parts: Part[] }`; `session.promptAsync()` maps to `POST /session/{id}/prompt_async` and returns immediately. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/sdk.gen.ts] [DOCS-PROVEN: https://opencode.ai/docs/server/]

### Plugin and Hook Interfaces

1. A plugin is a JavaScript/TypeScript module that exports one or more plugin functions; a plugin function receives a context object and returns a hooks object. [DOCS-PROVEN: https://opencode.ai/docs/plugins/]
2. Docs show `import type { Plugin } from "@opencode-ai/plugin"` and `export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => { return { ...hooks } }`. [DOCS-PROVEN: https://opencode.ai/docs/plugins/]
3. The current plugin package source defines `PluginInput` as `{ client, project, directory, worktree, experimental_workspace, serverUrl, $ }`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/index.ts]
4. Official docs list event names including `command.executed`, `file.edited`, `file.watcher.updated`, `installation.updated`, `lsp.client.diagnostics`, `lsp.updated`, `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`, `permission.asked`, `permission.replied`, `server.connected`, `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated`, `todo.updated`, `shell.env`, `tool.execute.after`, `tool.execute.before`, `tui.prompt.append`, `tui.command.execute`, and `tui.toast.show`. [DOCS-PROVEN: https://opencode.ai/docs/plugins/]
5. Current plugin package source defines hook keys including `event`, `config`, `tool`, `auth`, `provider`, `chat.message`, `chat.params`, `chat.headers`, `permission.ask`, `command.execute.before`, `tool.execute.before`, `shell.env`, `tool.execute.after`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.session.compacting`, `experimental.compaction.autocontinue`, `experimental.text.complete`, and `tool.definition`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/index.ts]
6. There is a docs/source naming divergence: docs list `permission.asked`/`permission.replied` events, while current generated SDK source includes `permission.updated` and `permission.replied`, and plugin package source includes `permission.ask` as a hook. Treat permission hook/event naming as an audit uncertainty requiring runtime verification. [DOCS-PROVEN] [SOURCE-PROVEN] [UNVERIFIED runtime behavior]
7. Docs include `messages.transform` examples historically only indirectly; current plugin source uses `experimental.chat.messages.transform`, not plain `messages.transform`. Code using non-source hook names should be runtime-verified. [SOURCE-PROVEN] [CODE-INFERRED]

### Custom Tool Interfaces

1. Custom tools can live in `.opencode/tools/` or `~/.config/opencode/tools/`; TypeScript/JavaScript files define the tool definition, and the filename becomes the tool name. [DOCS-PROVEN: https://opencode.ai/docs/custom-tools/]
2. Custom tools can also be returned from plugins under a `tool` object. [DOCS-PROVEN: https://opencode.ai/docs/plugins/]
3. The `tool()` helper is imported from `@opencode-ai/plugin` in docs and from `@opencode-ai/plugin/tool` is an exported subpath in npm metadata. [DOCS-PROVEN: https://opencode.ai/docs/custom-tools/] [NPM-VERIFIED: `npm view @opencode-ai/plugin exports --json`]
4. Current `@opencode-ai/plugin` npm `latest` version is `1.14.25`, modified `2026-04-26T16:32:50.592Z`; this repo declares peer `^1.14.20`. [NPM-VERIFIED] [CODE-INFERRED: `package.json`]
5. The current tool package source defines `ToolContext` with required `sessionID`, `messageID`, `agent`, `directory`, `worktree`, `abort`, `metadata(...)`, and `ask(...)`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/tool.ts]
6. The current tool package source defines `ToolResult = string | { output: string; metadata?: Record<string, any> }`. [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/tool.ts]
7. Tool arguments use `tool.schema`, which is Zod. [DOCS-PROVEN: https://opencode.ai/docs/custom-tools/] [SOURCE-PROVEN: https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/tool.ts]

### Built-in Tool and Permission Interfaces

1. Built-in tool IDs documented in current docs include `bash`, `edit`, `write`, `read`, `grep`, `glob`, `lsp`, `apply_patch`, `skill`, `todowrite`, `webfetch`, `websearch`, and `question`. [DOCS-PROVEN: https://opencode.ai/docs/tools/]
2. Tool permissions are configured through the `permission` field in config with values `allow`, `ask`, or `ask`; wildcard matching is supported. [DOCS-PROVEN: https://opencode.ai/docs/tools/] [DOCS-PROVEN: https://opencode.ai/docs/permissions linked from tools docs]
3. Docs explicitly warn that `tool.execute.before`/`after` checks should use `input.tool === "apply_patch"`, not `"patch"`, and that `apply_patch` uses `output.args.patchText`. [DOCS-PROVEN: https://opencode.ai/docs/tools/]

## Repository Code Paths Depending on External OpenCode Contracts

| Code path | External contract dependency | Evidence |
|---|---|---|
| `src/plugin.ts` | Imports `Plugin` from `@opencode-ai/plugin`; returns hooks and plugin tools under `tool`; receives `client` and `directory`. | [CODE-INFERRED: `src/plugin.ts:8`, `src/plugin.ts:52`, `src/plugin.ts:109-128`] |
| `src/plugin.ts` | Observes `session.idle` and `session.deleted` events; synthesizes `tool.execute.after` event tracker records. | [CODE-INFERRED: `src/plugin.ts:83-99`, `src/plugin.ts:131-172`] |
| `src/lib/session-api.ts` | Wraps `client.session.create/get/status/abort/messages/prompt/promptAsync`; unwraps SDK response data. | [CODE-INFERRED: `src/lib/session-api.ts:37-189`] |
| `src/lib/spawner/session-creator.ts` | Calls `createSession` with `parentID`, `title`, `directory`, and `permission`. `permission` is not in current generated `SessionCreateData.body`. | [CODE-INFERRED: `src/lib/spawner/session-creator.ts:30-35`] [SOURCE-PROVEN: SDK `SessionCreateData`] |
| `src/lib/delegation-manager.ts` | Creates child session, then calls `client.session.prompt({ path: { id }, body: { parts, agent } })`. | [CODE-INFERRED: `src/lib/delegation-manager.ts:106-132`] [SOURCE-PROVEN: SDK `SessionPromptData`] |
| `src/lib/sdk-delegation.ts` | Uses `client.session.status()` and `client.session.messages()` to infer recovery/final result. | [CODE-INFERRED: `src/lib/sdk-delegation.ts:83-90`, `src/lib/sdk-delegation.ts:193-199`] [SOURCE-PROVEN: SDK generated client] |
| `src/hooks/create-core-hooks.ts` | Returns `event`, `system.transform`, `experimental.chat.system.transform`, `messages.transform`, and `shell.env`. Current plugin source proves `event`, `experimental.chat.system.transform`, and `shell.env`; `system.transform` and `messages.transform` need runtime verification. | [CODE-INFERRED: `src/hooks/create-core-hooks.ts:27-36`, `src/hooks/create-core-hooks.ts:80-132`] [SOURCE-PROVEN: plugin `Hooks`] |
| `src/hooks/create-session-hooks.ts` | Returns `event` and `experimental.session.compacting`, and mutates `output.context` array. | [CODE-INFERRED: `src/hooks/create-session-hooks.ts:38-44`, `src/hooks/create-session-hooks.ts:204-267`] [SOURCE-PROVEN: plugin `Hooks`] |
| `src/hooks/create-tool-guard-hooks.ts` | Returns `tool.execute.before` and `tool.execute.after`; expects `input.sessionID`, `input.tool`, and `output.args`/`output.metadata`. | [CODE-INFERRED: `src/hooks/create-tool-guard-hooks.ts:40-43`, `src/hooks/create-tool-guard-hooks.ts:64-151`] [SOURCE-PROVEN: plugin `Hooks`] |
| `src/tools/*` | Use `tool()` helper from `@opencode-ai/plugin` and `@opencode-ai/plugin/tool`; return strings via `renderToolResult`. | [CODE-INFERRED: `src/tools/delegate-task.ts:1-42`, `src/tools/configure-primitive.ts:1-87`] [SOURCE-PROVEN: plugin `tool.ts`] |

## Interface Mismatch Checklist for Review Agents

Review agents should flag these classes of mismatch. This checklist is for audit planning only.

### SDK / Server Contract Mismatches

- [ ] Calls to SDK methods not present in current generated client (`@opencode-ai/sdk` `1.14.25`), especially `session.status`, `session.promptAsync`, PTY methods, MCP methods, or experimental tool methods. [SOURCE-PROVEN]
- [ ] Request bodies that include fields absent from generated request types, especially `session.create({ body: { permission } })`. [SOURCE-PROVEN] [CODE-INFERRED]
- [ ] Tests that mock `client.session.prompt()` as returning a bare string or empty string without also testing the docs/source response envelope `{ data: { info, parts } }`. [DOCS-PROVEN] [SOURCE-PROVEN]
- [ ] Code paths assuming `response.data` always exists without exercising SDK `responseStyle`, `throwOnError`, and error return behavior. [DOCS-PROVEN: SDK options]
- [ ] Session ID assumptions such as requiring IDs to start with `ses` without proving current server ID format from runtime. [CODE-INFERRED] [UNVERIFIED]
- [ ] Missing verification against live `/doc` OpenAPI output from an installed `opencode serve`. [DOCS-PROVEN]

### Plugin / Hook Contract Mismatches

- [ ] Hook keys not present in current plugin package source, especially `system.transform` and `messages.transform` versus `experimental.chat.system.transform` and `experimental.chat.messages.transform`. [SOURCE-PROVEN] [CODE-INFERRED]
- [ ] Event names that match docs but not generated SDK source, especially permission events (`permission.asked` vs `permission.updated`) and hook key `permission.ask`. [DOCS-PROVEN] [SOURCE-PROVEN]
- [ ] Hook payload shape assumptions not covered by live runtime tests: `input.sessionID`, `input.callID`, `output.args`, `output.metadata`, `output.context`, and event `properties.info`. [SOURCE-PROVEN] [CODE-INFERRED]
- [ ] Hooks that mutate outputs with shapes different from plugin source (`tool.execute.after` output expects `{ title, output, metadata }`, not arbitrary object). [SOURCE-PROVEN]
- [ ] Tests that instantiate hook factories directly but never load the compiled plugin through OpenCode. [CODE-INFERRED]

### Custom Tool Contract Mismatches

- [ ] Tool factory imports from unsupported subpaths. `@opencode-ai/plugin/tool` is currently exported, but audit should enforce package export validation rather than assuming all subpaths work. [NPM-VERIFIED]
- [ ] Tool `execute` context typed optional in repo while official `ToolContext` requires `sessionID`, `messageID`, `agent`, `directory`, `worktree`, `abort`, `metadata`, and `ask`; tests should prove behavior in real OpenCode runtime context. [SOURCE-PROVEN] [CODE-INFERRED]
- [ ] Tool return shape not accepted by runtime: official return is `string | { output, metadata? }`; repo string-envelope helpers should be checked in the LLM/tool UI. [SOURCE-PROVEN] [CODE-INFERRED]
- [ ] Custom tool names containing hyphens (`delegate-task`, `delegation-status`) should be verified through `/experimental/tool/ids` or SDK `client.tool.ids()`, not just assumed from plugin object keys. [SOURCE-PROVEN] [CODE-INFERRED]

### Primitive Loading / Config Mismatches

- [ ] Hard-coded primitive locations or schema assumptions that diverge from OpenCode docs: project plugins in `.opencode/plugins/`, project tools in `.opencode/tools/`, config `$schema` at `https://opencode.ai/config.json`. [DOCS-PROVEN]
- [ ] Permission schema mismatch: this repo's `.opencode/opencode.json` uses nested path-scoped permission entries; current docs show simple tool-permission keys and wildcard patterns. This may be valid but was not proven by docs in this session. [CODE-INFERRED] [UNVERIFIED]
- [ ] Audits that treat `.md` agent/skill/command files as runtime contract targets instead of focusing on plugin/tool/hook/server source code. [SCOPE]

## Recommended Verification Commands / Minimal Runtime Checks

These commands are audit checks, not fixes.

### Static / Package Contract Checks

```bash
npm view @opencode-ai/sdk version time.modified dist-tags --json
npm view @opencode-ai/plugin version time.modified dist-tags exports --json
npm run typecheck
npm test
```

### Generated SDK Shape Checks

```bash
node --input-type=module -e 'import { createOpencodeClient } from "@opencode-ai/sdk"; const c=createOpencodeClient({baseUrl:"http://127.0.0.1:4096"}); console.log(Object.keys(c.session)); console.log(Object.keys(c.tool ?? {})); console.log(Object.keys(c.event ?? {}));'
```

Expected proof target: `session.create`, `session.status`, `session.prompt`, `session.promptAsync`, `session.messages`, `event.subscribe`, and `tool.ids`/`tool.list` exist at runtime. [SOURCE-PROVEN]

### Live Server / OpenAPI Checks

```bash
OPENCODE_SERVER_PASSWORD=devtest opencode serve --hostname 127.0.0.1 --port 4096
curl -u opencode:devtest http://127.0.0.1:4096/global/health
curl -u opencode:devtest http://127.0.0.1:4096/doc
curl -u opencode:devtest http://127.0.0.1:4096/session/status
```

Expected proof target: local server starts; health returns `{ healthy: true, version }`; `/doc` serves OpenAPI 3.1; session status endpoint exists. [DOCS-PROVEN]

### Plugin Load / Tool Registration Smoke Check

```bash
npm run build
# From a disposable fixture project that references this package's dist/plugin.js through .opencode/plugins/:
opencode serve --hostname 127.0.0.1 --port 4096
node --input-type=module - <<'NODE'
import { createOpencodeClient } from '@opencode-ai/sdk'
const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' })
console.log(await client.global.health())
console.log(await client.tool.ids())
NODE
```

Expected proof target: registered tool IDs include `delegate-task`, `delegation-status`, `prompt-skim`, `prompt-analyze`, `session-patch`, `session-journal-export`, `configure-primitive`, and `validate-restart`; optionally `run-background-command` if PTY support is available. [CODE-INFERRED]

### Hook Payload Probe Check

```bash
# Install a tiny probe plugin in a disposable project that logs all input/output keys for:
# event, tool.execute.before, tool.execute.after, shell.env, experimental.session.compacting,
# experimental.chat.system.transform, experimental.chat.messages.transform.
# Then run a simple session prompt that invokes read/glob and inspect the log.
```

Expected proof target: actual runtime hook names and payload keys match package source before review agents trust local unit mocks. [SOURCE-PROVEN] [UNVERIFIED runtime payload details]

### Session Delegation Contract Probe

```bash
# In a disposable project with the harness plugin loaded:
# 1. Create a session via SDK.
# 2. Call session.prompt with a text part that invokes delegate-task.
# 3. Poll delegation-status.
# 4. Subscribe to client.event.subscribe() and capture session.created/session.idle/session.status events.
```

Expected proof target: parent session ID is injected into tool context, child session creation accepts intended fields, prompt dispatch reaches requested agent, events contain resolvable session IDs, and completion can be observed through `session.idle` plus message stability. [CODE-INFERRED] [SOURCE-PROVEN]

## Sources Consulted

### Official OpenCode docs

- `https://opencode.ai/docs/sdk/` — SDK creation, client options, response style, session APIs, file APIs, event subscription. [DOCS-PROVEN]
- `https://opencode.ai/docs/server/` — `opencode serve`, auth env vars, `/doc` OpenAPI 3.1, HTTP endpoints including sessions, messages, tools, events. [DOCS-PROVEN]
- `https://opencode.ai/docs/plugins/` — plugin loading, plugin context, event names, plugin tools, hook examples, compaction hook. [DOCS-PROVEN]
- `https://opencode.ai/docs/custom-tools/` — custom tool location, `tool()` helper, Zod args, tool context, filename naming, multiple exports. [DOCS-PROVEN]
- `https://opencode.ai/docs/tools/` — built-in tools, permission config, `apply_patch` hook detail. [DOCS-PROVEN]

### Official package/source surfaces

- `https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/sdk.gen.ts` — generated SDK methods and endpoint mapping. [SOURCE-PROVEN]
- `https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/sdk/js/src/gen/types.gen.ts` — generated event/session/tool/config types. [SOURCE-PROVEN]
- `https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/index.ts` — `PluginInput`, `Hooks`, hook names and payload shapes. [SOURCE-PROVEN]
- `https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/plugin/src/tool.ts` — `ToolContext`, `ToolResult`, `tool()` helper. [SOURCE-PROVEN]
- `npm view @opencode-ai/sdk version time.modified dist-tags --json` — current SDK package version. [NPM-VERIFIED]
- `npm view @opencode-ai/plugin version time.modified dist-tags exports --json` — current plugin package version and exports. [NPM-VERIFIED]

### Repository code inspected

- `package.json` — package versions, exports, peer dependency, OpenCode engine. [CODE-INFERRED]
- `.opencode/opencode.json` — project OpenCode config shape. [CODE-INFERRED]
- `src/plugin.ts` — plugin composition root, hooks, tool registration. [CODE-INFERRED]
- `src/lib/session-api.ts` — SDK wrapper call shapes. [CODE-INFERRED]
- `src/lib/delegation-manager.ts` — child session prompt dispatch. [CODE-INFERRED]
- `src/lib/sdk-delegation.ts` — status/message polling. [CODE-INFERRED]
- `src/lib/spawner/session-creator.ts` — session creation request fields. [CODE-INFERRED]
- `src/hooks/create-core-hooks.ts`, `src/hooks/create-session-hooks.ts`, `src/hooks/create-tool-guard-hooks.ts` — hook keys and payload assumptions. [CODE-INFERRED]
- `src/tools/delegate-task.ts`, `src/tools/delegation-status.ts`, `src/tools/configure-primitive.ts`, `src/shared/tool-response.ts` — custom tool helper usage and return shapes. [CODE-INFERRED]

## Unresolved Uncertainties

1. Runtime hook key support for `system.transform` and `messages.transform` is not proven by current plugin package source; current source proves `experimental.chat.system.transform` and `experimental.chat.messages.transform`. [SOURCE-PROVEN] [UNVERIFIED runtime compatibility]
2. Runtime permission event naming is inconsistent across docs/source: docs list `permission.asked`, generated SDK source includes `permission.updated`, and plugin source includes `permission.ask`. [DOCS-PROVEN] [SOURCE-PROVEN] [UNVERIFIED runtime behavior]
3. The current generated `SessionCreateData` type does not include `permission`; whether OpenCode server tolerates extra `permission` in `session.create` body at runtime was not tested. [SOURCE-PROVEN] [CODE-INFERRED] [UNVERIFIED runtime behavior]
4. Docs prove custom tool names from filenames and plugin `tool` object registration generally, but hyphenated plugin tool keys should be verified with `client.tool.ids()` in a live OpenCode server. [DOCS-PROVEN] [UNVERIFIED runtime behavior]
5. The repository uses path-scoped/nested permission config in `.opencode/opencode.json`; current docs fetched in this session did not prove that exact nested shape. [CODE-INFERRED] [UNVERIFIED]
6. No live `opencode serve` smoke test was run in this research session; recommended commands above are required before declaring real integration conformance. [UNVERIFIED]
