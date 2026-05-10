---
name: stack-l3-opencode
  version: "1.14.44"
  description: "OpenCode SDK v1.14.44 + Plugin internals for feature development, architecture, auditing, quality checking, test building, TUI development, ACP IDE integration, and gatekeeping. Use when you need to: create an OpenCode tool, register a plugin hook, understand chat.params or shell.env, work with the TUI keymap API, implement ACP agent client protocol, debug hook composition chains, validate tool schemas with Zod, handle session compaction, build TUI plugins with keybindings, integrate OpenCode with an IDE via ACP, or understand the SDK client/server architecture. Contains BEYOND-DOCS expert knowledge extracted from anomalyco/opencode source. Triggers on: opencode sdk, opencode plugin, definePlugin, tool registration, hook registration, session management, delegate task, opencode api, plugin development, opencode tool, opencode hook, tool.execute, chat.params, chat.headers, shell.env, permission.ask, session.compacting, ToolContext, ToolResult, PluginInput, Hooks, AuthHook, ProviderHook, createOpencodeClient, BunShell, hook composition, tool schema validation, opencode sse, opencode abort signal, acp protocol, agent client protocol, TUI keymap, workspace adapter, api.keymap, TUI plugin, ACP integration, IDE integration, keybinding, keymap registerLayer, opencode ACP, opencode TUI v2, stack opencode, opencode reference, opencode API docs."
metadata:
  layer: "3"
  role: "reference"
  lineage: "stack"
---

# Stack: OpenCode SDK + Plugin

> **Version:** 1.14.44 | **Source:** [anomalyco/opencode](https://github.com/anomalyco/opencode) | **Bundled:** 22,771 lines

## ⚠️ Key Gotchas (Read Before Coding)

1. **`tool()` is an identity function** — zero runtime validation, pure TypeScript branding
2. **`context.ask()` returns Effect, not Promise** — `await` does nothing; use `Effect.runPromise()`
3. **Hook output is mutable pass-through** — last-write-wins at field level; always spread
4. **`z.transform()`/`.refine()`/`z.lazy()` silently break** in tool schemas — only use primitives
5. **Abort signal is cooperative** — runtime doesn't force-kill your async operations
6. **Session has no "completed" state** — only idle/busy/retry; sessions live until deleted
7. **No hook priority system** — ordering determined by `Config.plugin[]` array position

## Quick Navigation

| Document | What You'll Find | When to Load |
|----------|-----------------|--------------|
| **[Expert: Hook Composition](references/expert/hook-composition.md)** | Multi-plugin ordering, output mutation, compaction flow, event types (32-40+), permission override | Writing hooks, debugging hook chains, compaction recovery |
| **[Expert: Tool Internals](references/expert/tool-internals.md)** | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, ToolState machine | Creating tools, debugging tool errors, schema design |
| **[Expert: Client-Server](references/expert/client-server.md)** | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences | SDK integration, delegation, session recovery |
| [API: Plugin](references/api/plugin.md) | Hook signatures, PluginInput shape, auth/provider hooks | Looking up exact TypeScript signatures |
| [API: SDK](references/api/sdk.md) | Session CRUD, messaging, client setup | SDK client usage |
| [API: Types](references/api/types.md) | All exported TypeScript types | Type lookup |
| [Patterns: Dev](references/patterns/dev.md) | Tool creation, hook wiring, plugin assembly | Feature development |
| [Patterns: Testing](references/patterns/testing.md) | Mock SDK, tool testing, hook testing | Writing tests |
| [Patterns: Gatekeeping](references/patterns/gatekeeping.md) | Quality gates, type safety, hook correctness | Code review |
| **[API: ACP](references/api/acp.md)** | Agent Client Protocol — JSON-RPC over stdio for IDE integration | Building IDE plugins, Zed/VS Code integration |
| **[API: TUI v2](references/api/tui-v2.md)** | TUI keymap API, keybinding layers, command dispatch | TUI plugin development, custom keybindings |
| **[Pipeline Patterns](references/pipeline-patterns.md)** | How stack-opencode composes with other skills in development workflows | Architecture design, workflow composition |
| **[Stack Chains](references/stack-chains.md)** | Dependency ordering between stack-* skills | Skill loading order, dependency resolution |
| **[Department Bundles](references/department-bundles.md)** | Role-based skill loading bundles | Team configuration, agent setup |

## Decision Trees

### "Should I use a tool or a hook?"

```
Need the LLM to call it?           → TOOL (tool.execute flow)
Need to modify LLM behavior?       → HOOK (chat.params, tool.definition)
Need to observe events?            → EVENT hook (fire-and-forget)
Need to inject env vars?           → SHELL.ENV hook (not tool args!)
Need to auto-approve permissions?  → PERMISSION.ASK hook
Need to recover from compaction?   → SESSION.COMPACTING + AUTOCONTINUE hooks
```

### "Which Zod types work in tool schemas?"

```
z.string/number/boolean/array/object/enum/optional → ✅ Reliable
z.record/tuple/union/default                        → ⚠️ Partial conversion
z.transform/refine/lazy/any                         → ❌ Silent failure
```

### "Which SDK version should I use?"

```
Need workspace isolation or session restore? → v2 (createOpencodeClient v2)
Just basic session/message CRUD?             → v1 works fine
Writing a plugin (hooks/tools)?              → Plugin API is version-independent
```

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Tool schemas with Zod | `stack-zod` | Zod→JSON Schema conversion has silent failures |
| Testing plugin behavior | `stack-vitest` | SDK mocking patterns, ToolContext mock setup |
| Next.js sidecar dashboard | `stack-nextjs` | Sidecar reads SSE events, consumes SDK client |
| Quality gate for plugin code | `gate-lifecycle-integration` | 9-surface mutation authority table, CQRS boundaries |
| Evidence for tool outputs | `gate-evidence-truth` | L1-L5 hierarchy, ToolStateCompleted as evidence |
| Spec compliance for features | `gate-spec-compliance` | Traceability between specs and tool/hook implementations |

## Source Files (for grep in bundled/)

| Package | Key Files |
|---------|-----------|
| `@opencode-ai/plugin` | `index.ts` (types), `tool.ts` (helper), `shell.ts` (BunShell), `tui.ts` (TUI API) |
| `@opencode-ai/sdk` | `index.ts`, `client.ts`, `server.ts`, `gen/sdk.gen.ts`, `gen/types.gen.ts` |

## Updating

Run `scripts/update.sh` to re-download source when OpenCode version changes.

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 1.14.44) — OpenCode SDK updates frequently; verify against installed version.
2. **Run `scripts/update.sh`** to re-download source from `anomalyco/opencode` and refresh bundled references.
3. **Verify against live source:** The bundled 22,771-line source pack is the ground truth. If runtime behavior differs from gotchas, the source has changed.
4. **Key gotchas are version-sensitive:** The `context.ask()` returning Effect (not Promise) and `tool()` being an identity function are behavioral claims — verify against source if the version changes.

### When Unsure About API Accuracy
1. **Grep the bundled source:** `references/expert/tool-internals.md` for tool behavior, `references/expert/hook-composition.md` for hook ordering.
2. **Read actual source:** The source files at `anomalyco/opencode` on GitHub are canonical. Check the tag matching the installed version.
3. **The Zod reliability matrix (lines 78-84) is source-verified at v1.14.44:** If `z.transform()` behavior changes in a newer SDK, the matrix must be re-verified.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-opencode reference (v1.14.44) documents behavior extracted from source. Your installed version may differ — check `@opencode-ai/plugin` version in `node_modules`."
2. **Offer verification:** Run `npm list @opencode-ai/plugin @opencode-ai/sdk` to compare installed versions.
3. **Do not override:** Source-extracted behavioral claims are version-specific. User's runtime takes precedence.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes hook composition with 3+ plugins, ToolContext timeout behavior, SSE event ordering guarantees, session state machine edge cases (retry→idle transition), and permission inheritance across nested delegations.
2. **Search bundled references** — expert docs (`references/expert/`) cover deep internals.
3. **Check GitHub issues:** `anomalyco/opencode` repo for known SDK bugs.
4. **Escalate to skill maintainer:** File an update request with SDK version, hook/tool chain, and observed behavior.
