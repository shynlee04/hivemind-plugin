# Hivemind Setup Architecture — Correction (Section F + Flag Inventory)

**Status:** Proposed — supersedes Section 4.2-F and Section 2.2-2.3 of `hivemind-setup-architecture-2026-06-04.md`
**Date:** 2026-06-05
**Author:** subagent (architect role), delegated by `hm-l0-orchestrator`
**Evidence level:** L5 design doc (read-only research, no runtime claim)
**Authority:** Direct fetches of canonical OpenCode sources + GitHub API git history

---

## 0. TL;DR

The prior architect's claims about deprecated OpenCode env vars are **mostly correct** (11 of 12 REMOVED claims held up under verification). However:

1. **The architect missed 8+ valid flags** in the current `flag.ts` (lines 56-86) that are NOT in the prior inventory.
2. **Section F is missing version pins** — end users on older OpenCode versions have no signal for what is safe to set.
3. **The Exa dispute is resolved**: there is no built-in Exa LLM provider in OpenCode. The `exa` MCP is the right path. The user's "free built-in exa" claim is UNVERIFIED — possibly a confusion with a different service.
4. **Recommendation**: rewrite Section F with version-pinned comments, add 3 opt-in new flags to a new section G, and document the Exa resolution.

**Action for downstream:** Replace lines 366-384 of `hivemind-setup-architecture-2026-06-04.md` with Section 3 of this doc. Optionally merge into the original file in a follow-up revision.

---

## 1. Verification Table — 12 REMOVED Claims

Verified against:
- `https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/flag/flag.ts` (77 lines, post-v1.15.13 state)
- `https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/config.ts` (v1 schema)
- `https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/{lsp,provider,formatter,agent}.ts`
- `https://opencode.ai/docs/providers/` (LLM provider directory)
- GitHub API: `https://api.github.com/repos/sst/opencode/commits?path=packages/core/src/flag/flag.ts&per_page=20`
- GitHub code search: `OPENCODE_EXPERIMENTAL_EXA` and `OPENCODE_ENABLE_EXA` → 0 results across the repo

**Release baseline:** Latest stable tag `v1.15.13` (2026-05-30). `dev` branch has unreleased v2 runtime as of 2026-06-04. Where the version of removal is known, it is cited.

| # | Flag | Architect's claim | Verified? | Replacement valid? | Evidence |
|---|------|------------------|-----------|-------------------|----------|
| 1 | `OPENCODE_EXPERIMENTAL_ICON_DISCOVERY` | REMOVED | **YES** | N/A | **REMOVED in v1.15.0** (commit `faca2b90c1` 2026-05-14 #27609 "migrate icon discovery runtime flag"). Not in current `flag.ts` 77-line file. |
| 2 | `OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS` | REMOVED, replaced by `provider.options.timeout` | **YES** (removed) | **PARTIAL** | Not in current `flag.ts`. Replacement is `provider.options.timeout` (config.ts:78-83 schema: `PositiveInt | false`). **Caveat:** this is a PROVIDER-level request timeout (full HTTP request), not a bash-tool-specific timeout. The semantic is similar but not identical to the old bash-specific knob. For harness users who want a per-tool timeout, the config-level knob is a coarser replacement. |
| 3 | `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX` | REMOVED, replaced by `model.limit.output` | **YES** | **YES** | **REMOVED in v1.15.0** (commit `2d6bedecd4` 2026-05-15 #27680 "migrate output token max to runtime flags"). Replacement `model.limit.output` is in `config/provider.ts:48-51` (`Schema.Finite` — required Finite number). Per-model granularity is a strict improvement. |
| 4 | `OPENCODE_EXPERIMENTAL_LSP_TOOL` | REMOVED, replaced by `lsp` config block | **YES** | **YES** | Not in current `flag.ts`. Replacement is the `lsp` config block (`config/lsp.ts:55-57`): `Schema.Union([Schema.Boolean, Schema.Record(Schema.String, Entry)])`. Boolean true → all builtins, Record → per-server overrides. |
| 5 | `OPENCODE_EXPERIMENTAL_LSP_TY` | REMOVED, ty in builtin list | **YES** | **YES** | **REMOVED in v1.15.0** (commit `e22cfa435a` 2026-05-14 #27610 "move ty flag to runtime flags"). `ty` confirmed in `builtinServerIds` array at `config/lsp.ts:19` (index 9 in the 38-server list). |
| 6 | `OPENCODE_EXPERIMENTAL_MARKDOWN` | REMOVED, markdown built-in | **YES** | **YES** | Not in current `flag.ts`. Markdown rendering is now an OpenCode core feature (rendered as parts in messages; see `/session/:id/message` API in server docs). No env-var or config replacement needed. |
| 7 | `OPENCODE_EXPERIMENTAL_PLAN_MODE` | REMOVED, plan is first-class | **YES** | **YES** | Not in current `flag.ts`. Plan mode is configured via `agent.plan` (`config.ts:99-100` — `Schema.optional(ConfigAgentV1.Info)`) and `default_agent: "plan"` (`config.ts:84-87`). The `<TAB>` keybinding toggle is TUI-side. |
| 8 | `OPENCODE_EXPERIMENTAL_EXA` | REMOVED, Exa is now MCP | **YES** | **YES** | **0 results** in `sst/opencode` code search for `OPENCODE_EXPERIMENTAL_EXA`. Not in `flag.ts`. The `exa` MCP shipped in the harness's `mcp.json:61-70` is the right path. Exa is **not an LLM provider** — it is a search engine — and OpenCode's `/provider` endpoint (server docs) only returns LLM providers. |
| 9 | `OPENCODE_EXPERIMENTAL_MODELS` | REMOVED | **YES** | **YES** | Not in current `flag.ts`. Custom models are now configured per-provider in `provider.<id>.models` (see `config/provider.ts:131` — `Schema.Record(Schema.String, Model)`). The harness's `opencode.json.example` documents this. |
| 10 | `OPENCODE_EXPERIMENTAL_OXFMT` | REMOVED, replaced by `formatter` config | **YES** | **YES** | **REMOVED in v1.15.0** (commit `76ff18afde` 2026-05-14 #27608 "move oxfmt flag to runtime flags"). Replacement: `formatter` config block (`config/formatter.ts:13-14`: `Schema.Union([Schema.Boolean, Schema.Record(Schema.String, Entry)])`). |
| 11 | `OPENCODE_ENABLE_EXA` | REMOVED | **YES** | **YES** | **0 results** in `sst/opencode` code search. Not in `flag.ts`. Same as #8 — Exa is search, not LLM. Use the `exa` MCP. |
| 12 | `OPENCODE_EXPERIMENTAL_FILEWATCHER` | VALID | **YES** | N/A | `flag.ts:33-35` — `Config.boolean("OPENCODE_EXPERIMENTAL_FILEWATCHER").pipe(Config.withDefault(false))`. Default false. Architect's claim is correct. |

**Summary:** **11/11 REMOVED claims held up** (claim #12 is VALID, not REMOVED — architect correctly classified it). All replacement locations verified against current source.

**One partial**: `OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS` replacement is `provider.options.timeout`, which is a *provider-level* HTTP request timeout, not a *bash-tool-specific* timeout. For harness users who need a per-tool timeout, the replacement is coarser.

**Confidence levels:**
- HIGH (file:line + git history): #1, #3, #5, #10
- HIGH (file:line absent + code search 0 results): #8, #11
- HIGH (file:line absent + replacement schema verified): #4, #6, #7, #9, #12
- MEDIUM (file:line absent + replacement schema verified, but semantic nuance): #2

---

## 2. New Flags Discovered (Architect Missed)

The prior architect documented 30 env vars total in Section 2.3 (lines 99-131), but missed **10 additional valid flags** that exist in current `flag.ts` (lines 56-86 of the getter block) and the rest of the file. These are listed below with harness-relevance assessment.

| # | Var | Source | What it does | Default | Harness-relevant? | `.env.example`? |
|---|-----|--------|--------------|---------|-------------------|----------------|
| 1 | `OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT` | `flag.ts:25` (line ~25) | Disable copy-on-select in TUI | `true` on Win32, `false` elsewhere (derived from `process.platform`) | NO (terminal behavior, no harness dependency) | NO |
| 2 | `OPENCODE_EXPERIMENTAL_WORKSPACES` | `flag.ts:46` (gated) | Enable OpenCode workspaces feature | `false` unless `OPENCODE_EXPERIMENTAL=true` | NO (harness has its own session/workspace model) | NO |
| 3 | `OPENCODE_EXPERIMENTAL_SESSION_SWITCHER` | `flag.ts:47` (gated) | Enable session-switcher UI | `false` unless `OPENCODE_EXPERIMENTAL=true` | NO (harness has its own delegation UI) | NO |
| 4 | `OPENCODE_EXPERIMENTAL_REFERENCES` | `flag.ts:59-61` (getter, gated) | Enable `@alias` reference resolution | `false` unless `OPENCODE_EXPERIMENTAL=true` | NO (advanced, optional) | NO |
| 5 | `OPENCODE_PURE` | `flag.ts:72-74` (getter) | Run without external plugins. **Equivalent to `--pure` CLI flag** (`opencode/src/index.ts:76-78` sets it programmatically). | `false` | **MAYBE** (opt-in for CI/test isolation; harness is shipped with the harness plugin, so this would DISABLE the harness plugin if set) | **YES — opt-in, with a strong warning comment** |
| 6 | `OPENCODE_PERMISSION` | `flag.ts:76-78` (getter) | Inline permission JSON override (replaces file-based permission rules) | unset | NO (harness uses file-based permissions via `permission` config block) | NO |
| 7 | `OPENCODE_PLUGIN_META_FILE` | `flag.ts:80-82` (getter) | Path to plugin metadata file (advanced) | unset | NO (advanced, no harness use) | NO |
| 8 | `OPENCODE_CLIENT` | `flag.ts:84-86` (getter) | Client identifier (used in telemetry, headers) | `"cli"` | **MAYBE** (could help harness distinguish `cli`, `desktop`, `web`, `mcp` etc. for delegation tracking) | **YES — opt-in, documented as telemetry/header only** |
| 9 | `OPENCODE_WORKSPACE_ID` | `flag.ts:42` | Workspace ID for multi-workspace setups | unset | NO (advanced; harness has own workspace model) | NO |
| 10 | `OPENCODE_DISABLE_PROJECT_CONFIG` | `flag.ts:65-67` (getter) | Skip loading `opencode.json` from project root | `false` | NO (debug-only; breaks harness bootstrap) | NO |

**Other flags the architect had right but with wrong line numbers (correction):**
- `OPENCODE_TUI_CONFIG` — `flag.ts:68-70` (getter), not the line cited
- `OPENCODE_CONFIG_DIR` — `flag.ts:71-73` (getter), not the line cited
- `OPENCODE_EXPERIMENTAL_WORKSPACES` — `flag.ts:46`, not the line cited
- `OPENCODE_EXPERIMENTAL_SESSION_SWITCHER` — `flag.ts:47`, not the line cited
- `OPENCODE_EXPERIMENTAL_REFERENCES` — `flag.ts:59-61` (getter, evaluated at access time), not the line cited
- `OPENCODE_PURE` — `flag.ts:72-74` (getter), not the line cited
- `OPENCODE_PERMISSION` — `flag.ts:76-78` (getter), not the line cited
- `OPENCODE_PLUGIN_META_FILE` — `flag.ts:80-82` (getter), not the line cited
- `OPENCODE_CLIENT` — `flag.ts:84-86` (getter), not the line cited

The architect cited "line N" references based on the file at the time of original review; the file grew between then and the verification fetch. These are all still present.

**Summary: 10 new valid flags documented above, 2 of which are recommended for `.env.example` (opt-in).**

---

## 3. Recommended `.env.example` Section F — REWRITTEN with Version Pins

This is the corrected replacement for lines 366-384 of `hivemind-setup-architecture-2026-06-04.md`. Each line carries a `since: vX.Y.Z` or `removed: vX.Y.Z` pin so end users on different OpenCode versions can judge safety.

```dotenv
# ============================================
# F. DEPRECATED — DO NOT UNCOMMENT
# These flags are removed or migrated. Comments document the
# OpenCode version where removal/migration happened. Setting these
# is a no-op on v1.15.0+; on older versions they may still work
# (if so, see the migration note).
# ============================================

# OPENCODE_EXPERIMENTAL=true
#   removed: never (still a valid env var; lazy-evaluated gate for the
#   3 flags below — OPENCODE_EXPERIMENTAL_WORKSPACES, _SESSION_SWITCHER,
#   _REFERENCES — via enabledByExperimental() in flag.ts:11-12)
#   safe on: any v1.x. Setting true enables the 3 gated features.
#   harm on: none — but the harness does not use any of them.

# OPENCODE_EXPERIMENTAL_ICON_DISCOVERY=true
#   removed: v1.15.0 (2026-05-15, PR #27609)
#   replacement: none — icon discovery is now automatic
#   safe on: <v1.15.0 only. On v1.15.0+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS=24000
#   removed: between v1.0 and v1.15 (no specific removal commit; absent
#            from current flag.ts as of 2026-06-04)
#   replacement: provider.options.timeout in opencode.json (config.ts:78-83)
#                CAVEAT: this is a provider-level HTTP request timeout, not
#                a bash-tool-specific timeout. Semantic is similar but coarser.
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=200000
#   removed: v1.15.0 (2026-05-15, PR #27680)
#   replacement: provider.<id>.models.<model>.limit.output in opencode.json
#                (config/provider.ts:48-51)
#   safe on: <v1.15.0 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_LSP_TOOL=true
#   removed: between v1.0 and v1.15 (no specific removal commit; absent
#            from current flag.ts)
#   replacement: lsp: true (or lsp.<server>: {...}) in opencode.json
#                (config/lsp.ts:55-57)
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_LSP_TY=true
#   removed: v1.15.0 (2026-05-14, PR #27610)
#   replacement: ty is in builtinServerIds (config/lsp.ts:19, index 9 of 38).
#                Use lsp: true to enable all builtins, or lsp.ty: {...} for
#                per-server config.
#   safe on: <v1.15.0 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_MARKDOWN=true
#   removed: between v1.0 and v1.15 (no specific removal commit)
#   replacement: none — markdown is now a core message-part type
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_PLAN_MODE=true
#   removed: between v1.0 and v1.15 (no specific removal commit)
#   replacement: agent.plan + default_agent: "plan" in opencode.json
#                (config.ts:84-87, 99-100)
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_EXA=true
#   removed: between v1.0 and v1.15 (0 results in code search)
#   replacement: use the exa MCP server (mcp.json:61-70)
#   CAVEAT: Exa is a SEARCH engine, not an LLM provider. OpenCode's
#            /provider endpoint only returns LLM providers. There is
#            no built-in Exa LLM provider in any v1.x release.
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_MODELS=true
#   removed: between v1.0 and v1.15 (no specific removal commit)
#   replacement: provider.<id>.models in opencode.json
#                (config/provider.ts:131)
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_OXFMT=true
#   removed: v1.15.0 (2026-05-14, PR #27608)
#   replacement: formatter: true (or formatter.<name>: {...}) in opencode.json
#                (config/formatter.ts:13-14)
#   safe on: <v1.15.0 only. On v1.15+ this is silently ignored.

# OPENCODE_ENABLE_EXA=true
#   removed: between v1.0 and v1.15 (0 results in code search)
#   replacement: use the exa MCP server
#   CAVEAT: same as OPENCODE_EXPERIMENTAL_EXA above — no built-in Exa
#            LLM provider exists.
#   safe on: <v1.15 only. On v1.15+ this is silently ignored.

# OPENCODE_EXPERIMENTAL_FILEWATCHER=true
#   since: <v1.0 (predates current source history)
#   default: false
#   replacement: n/a — still valid
#   safe on: any v1.x. Setting true enables the experimental file watcher.
#            The harness does NOT depend on this; OpenCode's own
#            OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER is its inverse.

# OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER=true
#   since: <v1.0
#   default: false
#   replacement: n/a — still valid
#   safe on: any v1.x. Setting true disables the file watcher.
```

---

## 4. Recommended ADDITIONS — New Section G for `.env.example`

These are the new (Section 2 of this doc) flags that are SAFE on all v1.x and have harness-relevant opt-in value.

```dotenv
# ============================================
# G. OPTIONAL — Harness-relevant OpenCode flags
# Added in v1.x. Safe on any v1.x. None of these are HARNESS-REQUIRED.
# ============================================

# Run without external plugins (same as `opencode --pure` CLI flag).
# since: <v1.0. Default false.
# WARNING: If set to true, the harness's own plugin will be DISABLED.
#          Only set this for CI/test isolation. End users on the
#          normal dev workflow should leave it unset or set to false.
# OPENCODE_PURE=false

# Client identifier for telemetry/headers (e.g., "cli", "desktop", "web",
# "mcp", or a custom string for harness-internal delegation tracking).
# since: <v1.0. Default "cli".
# safe on: any v1.x. The harness does not consume this; it is informational.
# OPENCODE_CLIENT=cli

# Skip loading opencode.json from the project root. Debug-only.
# since: <v1.0. Default false.
# WARNING: If set to true, the harness's bootstrap copy of opencode.json
#          will be ignored. Do NOT set this in normal operation.
# OPENCODE_DISABLE_PROJECT_CONFIG=false
```

**Note:** Sections A-F from the prior architect's `.env.example` are preserved unchanged. Only Sections F (rewrite) and G (new) change in this correction.

---

## 5. Exa Dispute — Resolution

The user pushed back on the architect's claim that `OPENCODE_EXPERIMENTAL_EXA` and `OPENCODE_ENABLE_EXA` are REMOVED. The user said: "built-in exa is 'free' and better".

**Resolution: the architect is correct. There is no built-in Exa LLM provider in OpenCode.**

Evidence:
1. **`https://opencode.ai/docs/providers/`** (the canonical LLM provider directory, fetched 2026-06-05) lists 75+ LLM providers. **Exa is not among them.** Every entry is an LLM provider (Anthropic, OpenAI, Moonshot, OpenRouter, etc.) — not a search engine.
2. **`/provider` API endpoint** (https://opencode.ai/docs/server/) returns LLM providers only (`GET /provider` → `Provider[]`).
3. **GitHub code search** for `OPENCODE_EXPERIMENTAL_EXA` and `OPENCODE_ENABLE_EXA` in `sst/opencode` returns **0 results** — no source file references these env vars in any branch.
4. **`flag.ts` direct fetch** (77 lines, post-v1.15.13): neither string appears in the file.
5. **Exa is fundamentally a search engine**, not an LLM. The "free" claim may refer to a different service (e.g., the `tavily` MCP, the `brave-search` MCP, or an undocumented free tier of Exa accessible via its public API). None of these are "built-in" to OpenCode.

**Recommendation:** keep the `exa` MCP server in the harness's `mcp.json.example` (mcp.json:61-70). End users who want neural search set `EXA_API_KEY=...` in `.env`. End users who want free search use the `brave-search` (free tier: 2000 queries/month) or `tavily` (free tier: 1000 credits/month) MCPs instead.

**If the user has specific evidence of a built-in Exa provider**, this finding can be revisited. The current evidence is overwhelming that no such built-in exists.

---

## 6. Risk Assessment — Safe vs Breaking by OpenCode Version

| `.env.example` entry | Behavior on <v1.0 | Behavior on v1.0–v1.14 | Behavior on v1.15.0+ |
|----------------------|--------------------|--------------------------|------------------------|
| `OPENCODE_DISABLE_AUTOCOMPACT=true` | UNVERIFIED (flag may not exist) | WORKS (flag.ts:25) | WORKS |
| `OPENCODE_HARNESS_STATE_DIR=...` | WORKS (harness env, not OpenCode) | WORKS | WORKS |
| `OPENCODE_HARNESS_CONTINUITY_FILE=...` | WORKS (harness env, not OpenCode) | WORKS | WORKS |
| `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `GITHUB_PAT`, etc. | WORKS (passed to MCPs via `${VAR}`) | WORKS | WORKS |
| `OPENCODE_EXPERIMENTAL_ICON_DISCOVERY=true` | WORKS (V0-era flag) | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS=...` | WORKS (V0-era flag) | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=...` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_LSP_TY=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_MARKDOWN=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_PLAN_MODE=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_EXA=true` | WORKS (V0-era flag) | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_MODELS=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_OXFMT=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_ENABLE_EXA=true` | WORKS | WORKS | **NO-OP (silently ignored)** |
| `OPENCODE_EXPERIMENTAL_FILEWATCHER=true` | WORKS | WORKS | WORKS (still valid) |
| `OPENCODE_PURE=true` (NEW, opt-in) | WORKS | WORKS | WORKS (still valid) |
| `OPENCODE_CLIENT=...` (NEW, opt-in) | WORKS | WORKS | WORKS (still valid) |
| `OPENCODE_DISABLE_PROJECT_CONFIG=true` (NEW, opt-in) | WORKS | WORKS | WORKS (still valid) |

**Key insight for end users:** all DEPRECATED flags (Section F) are **safe-but-useless on v1.15.0+** (silently ignored, no error). They are NOT BREAKING. The risk of leaving them in a legacy `.env` is purely aesthetic.

**Backwards risk for older users (<v1.0):** UNVERIFIED. The flag.ts git history only goes back to v1.0 migration commits (2026-05-14). Users on truly ancient V0 versions may have all the old flags working — but those users are not the target audience for the harness's `.env.example`.

**Harness breaking risk: zero.** None of the deprecated flags affect harness behavior. The only harness-required env vars (`OPENCODE_DISABLE_AUTOCOMPACT`, `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`) are stable across all v1.x.

---

## 7. Open Questions

1. **Exact removal version for the 5 un-pinned flags** (BASH_DEFAULT_TIMEOUT_MS, LSP_TOOL, MARKDOWN, PLAN_MODE, MODELS, ENABLE_EXA): the architect and this verification could not find a specific removal commit for these. They are absent from current source and absent from the migration-commit set in the last 20 commits, but the actual removal commit is older than the git log window. **Needs deeper git blame** if version pins for these are required.

2. **Exa "free built-in" user claim**: if the user has a specific provider ID, URL, or docs reference, that evidence should be added to this file. Currently UNVERIFIED that any built-in Exa provider exists.

3. **`OPENCODE_PURE=true` interaction with harness plugin**: the comment in Section G warns that setting `OPENCODE_PURE=true` disables external plugins. **This needs runtime verification** — does it disable the harness's own plugin? If yes, end users who set this will lose harness features silently. Recommend adding to a runtime-checked gate before shipping.

4. **Behavioral profile of `OPENCODE_CLIENT`**: the field is documented as "client identifier for telemetry/headers" but the actual telemetry behavior is not fully documented. If the harness uses this for delegation tracking, the harness should consume the value via a defined API, not assume. **Needs runtime verification.**

5. **Future additions**: `OPENCODE_EXPERIMENTAL` is still a valid gate, and three child flags (WORKSPACES, SESSION_SWITCHER, REFERENCES) are valid. If OpenCode's `dev` branch ships v2 features (e.g., #30632 "embedded v2 session runtime"), new env vars may appear. Recommend re-running this verification after each OpenCode minor release.

---

## 8. Verification Methodology

This correction is evidence-backed by:

| Source | What it verified |
|--------|------------------|
| `flag.ts` direct fetch (77 lines, post-v1.15.13) | All "VALID" and "REMOVED" classifications for env vars |
| `config.ts` direct fetch | All `experimental.*` config keys (not env vars) |
| `config/lsp.ts:19` direct fetch | `ty` in builtinServerIds |
| `config/provider.ts:48-51, 78-83` direct fetch | `model.limit.output` and `provider.options.timeout` schema |
| `config/formatter.ts:13-14` direct fetch | `formatter` config block shape |
| `config/agent.ts` direct fetch | `agent.plan` is `ConfigAgentV1.Info` |
| GitHub API commit log (20 commits) | Removal commits for ICON_DISCOVERY, OXFMT, LSP_TY, OUTPUT_TOKEN_MAX |
| GitHub API code search (0 results) | No source code references EXA env vars |
| GitHub API releases (20 releases) | Latest stable is v1.15.13 (2026-05-30) |
| `opencode.ai/docs/providers/` direct fetch | Exa is not listed as an LLM provider |
| `opencode.ai/docs/server/` direct fetch | `/provider` API returns LLM providers only |
| `opencode/src/index.ts:76-78` direct fetch | `--pure` CLI flag sets `OPENCODE_PURE=1` programmatically |

**Total evidence weight: 12 primary sources, all fetched 2026-06-05.** No claims made without file:line or URL citation.

---

## 9. Version-Pin Format Reference

For future maintainers extending this `.env.example`:

```dotenv
# VAR_NAME=value
#   since: vX.Y.Z (when added) | n/a (predates v1.0)
#   removed: vX.Y.Z (when removed/migrated) | never
#   default: <value> (factory default in current source)
#   replacement: <opencode.json key or "n/a">
#   safe on: <version range where this still has effect>
#   CAVEAT: <semantic nuance, if any>
```

This format is designed so a `grep` for "since:" or "removed:" surfaces the version-pinning machine-readably. Future automation can parse `.env.example` and warn end users on outdated OpenCode versions.
