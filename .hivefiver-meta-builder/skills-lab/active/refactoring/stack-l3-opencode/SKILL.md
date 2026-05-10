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

> ⚠️ **Validation Gate:** These gotchas are behavioral claims verified at v1.14.44. Before relying on any gotcha in production code, perform live verification via MCP tools (see Constitutional Compliance section). SDK updates may invalidate these claims.

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

## Constitutional Compliance: Two-Tier Trust Model

> **This skill enforces a strict two-tier authority model.** Bundled references provide orientation context; live sources provide truth.

### Trust Tiers

| Tier | Role | Sources | When to Trust |
|------|------|---------|---------------|
| **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live GitHub, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
| **Reference Tier** (SUPPLEMENTARY) | Provide context | Bundled source pack, local cached assets | For architecture orientation, pattern understanding, historical context |

### Staleness Severity Scale

| Severity | Age | Action |
|----------|-----|--------|
| CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
| HIGH | > 7 days | SHOULD re-verify; bundled data acceptable for orientation only |
| STANDARD | > 30 days | Re-verify before finalizing findings |
| LOW | > 90 days | Treat as potentially outdated; note in findings |

### Version Drift Detection (MANDATORY GATE)

**Before using ANY bundled reference for production code, perform this check:**

1. Read the `version` field in `metadata.json` (currently: `1.14.44`)
2. Compare against the consumer's installed versions:
   ```bash
   npm list @opencode-ai/plugin @opencode-ai/sdk
   ```
3. If versions differ:
   - **WARN** the consumer that bundled references may be stale
   - **REQUIRE** live verification via MCP tools before proceeding
   - **NOTE** the version gap in any findings or code comments
4. If versions match: bundled references are valid for orientation but still require live verification for production decisions

### MCP Live Verification Tools

When live verification is required (which is always before production use), use these C5 tools:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `context7_resolve_library_id` → `context7_query_docs` | API documentation lookup | Verifying API signatures, hook shapes, type definitions |
| `deepwiki_ask_question` | Architecture pattern queries | Understanding design decisions, composition patterns |
| `gitmcp_search_github_com_code` | Source code search | Finding specific implementations, verifying behavioral claims |
| `github_get_file_contents` | Read specific files from `anomalyco/opencode` | Checking exact source for a function, type, or constant |
| `repomix_pack_remote_repository` | Full repo analysis | When comprehensive source review is needed |

### Constitutional Gate Rule

> **Before any bundled pattern is used in production code, at least ONE live verification source must confirm the pattern is still valid for the installed version.**

This means:
- Gotchas (Section "Key Gotchas") are version-sensitive behavioral claims — verify before trusting
- Zod reliability matrix is source-verified at v1.14.44 — re-verify if SDK version changes
- Hook ordering rules are derived from specific source — validate against live code
- Tool schema patterns may evolve — check current `tool()` implementation before use

## Self-Correction

> Reference documents provide orientation context, not terminal truth. When facts conflict with reality, this section guides resolution through live verification.

### When Information May Be Outdated
1. **Check staleness:** Read `metadata.json` `ingest_date` field. If > 7 days, bundled data is HIGH severity staleness — treat as orientation only.
2. **Run version drift detection** (see above). Compare bundled version against installed `@opencode-ai/plugin` and `@opencode-ai/sdk` versions.
3. **Mandatory live verification:** Use MCP tools (`context7_query_docs`, `deepwiki_ask_question`, or `github_get_file_contents` on `anomalyco/opencode`) to verify the specific claim against the installed version.
4. **Run `scripts/update.sh`** to re-download source when a version mismatch is confirmed.
5. **Key gotchas are version-sensitive:** The `context.ask()` returning Effect (not Promise) and `tool()` being an identity function are behavioral claims — MUST be verified via live source.

### When Unsure About API Accuracy
1. **Live verification first:** Use `context7_resolve_library_id` with query `"@opencode-ai/plugin"` or `"@opencode-ai/sdk"`, then `context7_query_docs` for the specific API.
2. **Fall back to bundled source** for orientation: `references/expert/tool-internals.md` for tool behavior, `references/expert/hook-composition.md` for hook ordering.
3. **Cross-reference with GitHub:** Use `github_get_file_contents` on `anomalyco/opencode` at the matching version tag.
4. **The Zod reliability matrix is source-verified at v1.14.44 only.** If `z.transform()` behavior changes in a newer SDK, the matrix MUST be re-verified via live source.

### When the User Contradicts Reference Content
1. **Acknowledge the version gap:** "Bundled references are at v1.14.44 (ingested `ingest_date`). Your installed version may differ."
2. **Verify via live source immediately:** Use MCP tools to check the current behavior at the user's version.
3. **User's runtime wins:** If live verification confirms the user's observation, update the finding and note the version where behavior changed.
4. **Do not override with stale data:** Bundled references never override live-verified behavior.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes hook composition with 3+ plugins, ToolContext timeout behavior, SSE event ordering guarantees, session state machine edge cases (retry→idle transition), and permission inheritance across nested delegations.
2. **Search bundled references first** — expert docs (`references/expert/`) cover deep internals for orientation.
3. **Verify via live source:** Use `deepwiki_ask_question` on `anomalyco/opencode` or `github_get_file_contents` to check current behavior.
4. **Check GitHub issues:** `anomalyco/opencode` repo for known SDK bugs.
5. **Escalate to skill maintainer:** File an update request with SDK version, hook/tool chain, observed behavior, and live verification results.
