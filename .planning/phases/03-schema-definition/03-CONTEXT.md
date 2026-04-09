# Phase 3: Schema Definition & Runtime Configurability - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning — scope expanded from YAML schemas to full runtime configurability

<domain>
## Phase Boundary

Phase 3 originally scoped as "YAML schema for Agent/Command/Skill frontmatter + TypeScript types + event emitters."

**Scope expanded:** The user has explicitly rejected patch-level fixes. The root problem is that the harness has hardcoded compile-time constants everywhere — agents, categories, thresholds, routing rules, tool profiles — with no mechanism for users to discover, register, or configure them at runtime. The product-detox architecture (200+ files across features, hooks, tools, plugin) is the blueprint for the future system. Every hardcoded value must become derivable from config, discovery, or user registration.

This phase must deliver a **configuration architecture** that makes the harness user-oriented and user-friendly, where agents, categories, thresholds, and routing are discoverable and configurable, not compile-time constants.

</domain>

<decisions>
## Implementation Decisions

### Agent Discovery & Registration
- **D-01:** Valid agents must be discovered at plugin load time from two sources:
  1. `opencode.json` → `agent` section (JSON-parsed)
  2. `.opencode/agents/*.md` → YAML frontmatter (markdown-parsed)
- **D-02:** No hardcoded `VALID_AGENTS` array. The list is the union of discovered agents + built-in fallbacks (build, plan, general, explore).
- **D-03:** Agent tool profiles (required/mustNot tools) must be derivable from agent permissions config, not hardcoded in `AGENT_TOOLS` switch statement.
- **D-04:** Agent aliases (build→builder, review→critic) must be a configurable normalization layer, not ad-hoc patches.

### Category Discovery & Routing
- **D-05:** Valid categories must be configurable, not the 6 hardcoded values in `types.ts`.
- **D-06:** Unknown categories must NOT throw — they must fall back to signal-based routing with a warning. Current behavior (`normalizeCategory` throws) breaks all orchestrators that use custom taxonomies.
- **D-07:** Category configs (model, temperature, toolProfile) must be loadable from `opencode.json` harness section, not just `CATEGORY_DEFAULTS` hardcoded map.

### Tool Description Sync
- **D-08:** Tool arg descriptions (e.g., `delegate-task` category/agent descriptions) must be generated at load time from discovered agents/categories, not static strings.
- **D-09:** When an agent loads, the tool it uses must reflect the currently available agents/categories — the description is a snapshot of the discovery result at plugin initialization.

### Threshold & Constant Configurability
- **D-10:** `MAX_DESCENDANTS_PER_ROOT` (10), `MAX_DEPTH` (3), `DEFAULT_CONCURRENCY_LIMIT` (3) — all must be overridable via `opencode.json` harness section or env vars.
- **D-11:** Circuit breaker threshold, tool budget limits — already partially addressed by Phase 02 runtime policy, but need user-facing config UI.

### Governance Rule Discovery
- **D-12:** Governance rules must be loadable from config files, not just created programmatically at runtime.
- **D-13:** Rule scopes, conditions, and actions must be YAML/JSON-definable.

### Architecture Pattern
- **D-14:** Follow the product-detox pattern: `src/features/` for domain features, `src/hooks/` for event handlers, `src/tools/` for tool definitions, `src/intelligence/` for doc parsing, `src/plugin/` for composition. Current `src/lib/` monolith must eventually split (Phase 6/7).
- **D-15:** Configuration loading happens once at plugin init, cached in memory, reloaded on file change (watcher pattern from product-detox `runtime-loader`).

### Claude's Discretion
- Exact schema format for agent registration (YAML vs JSON vs both)
- Whether to support hot-reload of config without restart
- Visual dashboard implementation (deferred — out of scope for this phase)

</decisions>

<specifics>
## Specific Ideas

- "I don't want the fix as patches" — user explicitly rejected the 3 quick-fix approach (aliases + pass-through + descriptions). Wants systemic solution.
- The HIVEMIND-PHILOSOPHY document states: "Agents are not magic — they are configurations with names." This is the guiding principle: everything configurable, nothing hardcoded.
- Product-detox has 200+ files already implementing this pattern — the user wants the harness to recognize and use those patterns, not reinvent them.
- User wants tools' descriptions and helpers to be synchronized to available agents "at the time the agents must use it" — meaning discovery happens at plugin load, tool descriptions reflect the discovered state.
- Philosophy document mentions "local-size vector database for cross-sessions and cross-project selectable excerpt" — this is the MEMS-BRAIN memory system (Phase 5+ concern, but architecture must预留 space for it).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Philosophy & Requirements
- `docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md` — Full philosophy document, especially Pillar 2 (Collaborative Domains) and Pillar 5 (Growing MEMS-BRAIN)
- `.planning/REQUIREMENTS.md` — Phase 3 Schema Definition requirements (lines 195-261), agent presets, circuit breaker config
- `.planning/ROADMAP.md` — Phase 3, 6, 7 descriptions and dependencies

### Current Codebase (what needs to change)
- `src/lib/types.ts` — VALID_AGENTS, VALID_DELEGATION_CATEGORIES, MAX_DESCENDANTS_PER_ROOT (lines 6-15)
- `src/lib/specialist-router.ts` — SPECIALIST_PRESETS hardcoded map, normalizeAgent/normalizeCategory functions
- `src/lib/categories.ts` — CATEGORY_DEFAULTS hardcoded map
- `src/tools/delegate-task.ts` — AGENT_TOOLS switch, permission rules per agent
- `src/lib/concurrency.ts` — DEFAULT_CONCURRENCY_LIMIT

### Blueprint Reference (product-detox)
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/` — 200+ file architecture blueprint
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/hooks/` — Hook patterns (22 files)
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/` — Plugin composition (23 files)

### OpenCode Config Reference
- `.claude/skills/opencode-platform-reference/references/opencode-agents.md` — Agent config format (JSON + Markdown)
- `.claude/skills/opencode-platform-reference/references/opencode-configs.md` — Full config schema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/types.ts` — Type definitions can be extended, no need to rewrite
- `src/lib/specialist-router.ts` — Routing logic is sound, just needs dynamic preset loading
- `src/lib/categories.ts` — Category config pattern is good, needs dynamic source
- `opencode.json` — Already has agent section format to parse

### Established Patterns
- Continuity store pattern (JSON persistence + in-memory Maps) — use for config cache too
- Env var override pattern (`OPENCODE_HARNESS_STATE_DIR`) — extend for `OPENCODE_HARNESS_VALID_AGENTS`
- Zod schema validation — use for config file validation

### Integration Points
- `src/plugin.ts` — Plugin init is where config loading must happen
- `createDelegateTaskTool()` — Must receive discovered agents/categories instead of importing constants
- `createCoreHooks()` — Hook factory must receive resolved config

### Constraints
- Must not break existing `opencode.json` agent definitions — backward compatible
- Must not require changes to OpenCode SDK — plugin-layer only
- Must support both JSON config and Markdown agent files

</code_context>

<deferred>
## Deferred Ideas

- **Visual dashboard** — "interactive panes of dev-together" — out of scope, Phase 5+
- **Vector database (LanceDB)** — MEMS-BRAIN memory system — Phase 5+
- **Git-notes knowledge graph** — Cross-session intelligence — Phase 5+
- **Cloud sync** — Cross-repository intelligence — Phase 5+
- **Full src/lib domain separation** — Phase 6/7 (already on roadmap)
- **Product-detox migration** — The 200+ file architecture is a blueprint, not something to migrate wholesale

### Reviewed Todos (not folded)
- Phase 3 architecture discussion - live steering protocols — folded into this phase's scope

</deferred>

---

*Phase: 03-schema-definition-runtime-configurability*
*Context gathered: 2026-04-10*
*Scope: Expanded from YAML schemas → full runtime configuration architecture*
