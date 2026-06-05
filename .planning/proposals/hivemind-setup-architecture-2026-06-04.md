# Hivemind End-User Setup Architecture

**Date:** 2026-06-04
**Status:** Proposed (L5 design — no code changes)
**Scope:** End-user setup flow for the Hivemind harness plugin (`.opencode/opencode.json`, `mcp.json`, `.env`, `/hivemind-setup` command, port 4096 client-server model).

---

## 1. Executive Summary

### 1.1 Decisions

| # | Decision | Rationale | Authority |
|---|----------|-----------|-----------|
| D1 | LLM providers are **OPTIONAL at user space** — `opencode.json` ships with **NO** `provider` block, **NO** `model` field | The harness is a runtime composition engine, not an LLM. Users opt-in via `/connect` (OpenCode built-in) or by adding their own `provider` block. | User requirement #1; OpenCode `/connect` docs (https://opencode.ai/docs/config) |
| D2 | 8 MCP servers are **REQUIRED** for harness: `context7`, `repomix`, `exa`, `tavily`, `deepwiki`, `gitmcp`, `brave-search`, `github` | The harness has skills that depend on these (`hm-l3-deep-research`, `hm-l3-tech-stack-ingest`, `hm-l3-detective`, etc.) | User requirement #2; existing `mcp.json` (lines 43-140) |
| D3 | `.env` is **REQUIRED for harness overrides**; **most "experimental" flags in current `.env` are OBSOLETE** | Authoritative review of `packages/core/src/flag/flag.ts` shows OpenCode has migrated most `OPENCODE_EXPERIMENTAL_*` env vars to `opencode.json` `experimental.*` config keys. The shipped `.env.example` must reflect ACTUAL env vars, not legacy. | https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/flag/flag.ts |
| D4 | Default port **4096** with explicit override path | Confirmed in two OpenCode docs (https://opencode.ai/docs/config, https://opencode.ai/docs/server). The user requirement (NOT 4069) is correct. | User requirement #4; OpenCode server docs |
| D5 | **Client-server is the right pattern** — every parallel session gets a dedicated port via `OPENCODE_SERVER_PORT` env | OpenCode already exposes `opencode serve --port N` (https://opencode.ai/docs/server); mDNS discovery (`server.mdnsDomain`) for cluster detection. | OpenCode server docs |
| D6 | Ship a **`/hivemind-setup`** interactive command (NEW) that walks users through config + MCP opt-in | Existing `hm-config` is for *Hivemind runtime toggles*; this new command is for *one-time project bootstrap*. Mirrors `harness-doctor` health-check style. | Existing `assets/commands/harness-doctor.md`, `assets/commands/hm-config.md` |
| D7 | **Gitignore user secrets**, ship `.example` templates for everything user-local | `.gitignore` already excludes `.env` (line 32), but does **NOT** exclude `.opencode/`. New pattern: ship `opencode.json.example` and `mcp.json.example` and `.env.example`; bootstrap copies them on first run. | `.gitignore` lines 30-37 |

### 1.2 File Inventory (what ships vs. user-local)

**SHIPS via npm package** (in `package.json` files field, lines 10-24):

```
assets/templates/setup/
├── opencode.json.example          # NEW: minimal user-opencode.json template
├── mcp.json.example               # NEW: 8 required MCPs, all disabled, env-var placeholders
├── .env.example                   # NEW: only ACTUALLY-VALID env vars
├── README-setup.md                # NEW: explains the .example → .local copy flow
└── port-matrix.md                 # NEW: parallel-session port allocation table
```

**SHIPS as OpenCode command**:

```
assets/commands/hivemind-setup.md  # NEW: /hivemind-setup command (interactive)
```

**USER-LOCAL, gitignored** (created by `/hivemind-setup` or by hand):

```
.opencode/opencode.json            # Created from .example on first run
.opencode/mcp.json                 # Created from .example; user fills API keys
.env                               # Created from .example; user fills secrets
```

`.opencode/` is **NOT** gitignored (`.gitignore:34` is a `!.opencode/` negation). But we treat `opencode.json` and `mcp.json` as user-local config that the project commits only as `.example` templates. The `.env` is gitignored per `.gitignore:31-32`.

### 1.3 Commands (new)

| Command | Purpose | Files |
|---------|---------|-------|
| `/hivemind-setup` | One-time interactive bootstrap: detect missing config, walk through MCPs, generate user-local files | `assets/commands/hivemind-setup.md` (NEW) |
| `/harness-doctor` (existing) | Health check on an existing install | `assets/commands/harness-doctor.md:1-18` |
| `/hm-config` (existing) | Adjust Hivemind runtime toggles, NOT bootstrap | `assets/commands/hm-config.md:1-65` |

### 1.4 Triggers for L0 escalation

- Q-A: Should `opencode.json.example` ship with the harness's `compaction` defaults, or leave it 100% empty so OpenCode uses built-in defaults?
- Q-B: For the 8 required MCPs, should they default to `enabled: true` (with optional API-key gating) or `enabled: false` (opt-in)?
- Q-C: When the user runs `/hivemind-setup` in a project that already has `.opencode/opencode.json`, should it (a) refuse, (b) merge, (c) backup+overwrite?

---

## 2. OpenCode Experimental Flags Analysis

### 2.1 Source of truth

The authoritative source for OpenCode env vars is:
- **`packages/core/src/flag/flag.ts`** (https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/flag/flag.ts)
- **`packages/core/src/v1/config/config.ts`** (https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/config.ts) — defines `experimental.*` CONFIG keys (NOT env vars)

I reviewed both files on 2026-06-04. Findings:

### 2.2 Flags table (12 flags from the request)

| # | Flag | Status in current OpenCode | Critical for harness? | In `.env.example`? | Source |
|---|------|---------------------------|----------------------|-------------------|--------|
| 1 | `OPENCODE_EXPERIMENTAL` | **NOT in `flag.ts`** — appears to be a meta-gate. `enabledByExperimental(key)` reads it to gate `OPENCODE_EXPERIMENTAL_WORKSPACES`, `OPENCODE_EXPERIMENTAL_SESSION_SWITCHER`, `OPENCODE_EXPERIMENTAL_REFERENCES` (line 12, 56-58 of flag.ts). Acts as a "master switch" but is only consulted lazily. | NO (auto-derived) | NO — explain in README that setting it true is harmless but does nothing on its own | `flag.ts` lines 11-12, 56-58 |
| 2 | `OPENCODE_EXPERIMENTAL_ICON_DISCOVERY` | **REMOVED** — not in `flag.ts` or `config.ts`. Was a V0-era flag. | NO | NO | (not found) |
| 3 | `OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS` | **REMOVED** — not in current source. The replacement is the `provider.options.timeout` config key (default 300000 ms; set `false` to disable). See https://opencode.ai/docs/config (`Provider-Specific Options` section). | NO | NO — document `provider.options.timeout` as the new location | `config.ts` provider section; docs |
| 4 | `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX` | **REMOVED** — not in current source. The replacement is per-model `limit.output` in `opencode.json` (`config.ts` schema). | NO | NO — document `model.limit.output` | `config.ts` model schema; docs |
| 5 | `OPENCODE_EXPERIMENTAL_FILEWATCHER` | **VALID** — `flag.ts:18-20`. `Config.boolean(...).pipe(Config.withDefault(false))`. Default false. | NO (harness doesn't depend on it) | NO (opt-in only) | `flag.ts` line 18-20 |
| 6 | `OPENCODE_EXPERIMENTAL_LSP_TOOL` | **REMOVED** — not in current source. The replacement is the `lsp` config block in `opencode.json`. The `lsp` config supports a `boolean` OR a `Record<string, Entry>` where `Entry = { command, extensions, disabled, env, initialization }`. See `config/lsp.ts`. | NO | NO — document `lsp` config | `config/lsp.ts` |
| 7 | `OPENCODE_EXPERIMENTAL_LSP_TY` | **REMOVED** — not in current source. The `ty` LSP server is now in the **builtin list** (`config/lsp.ts:18-45`). To enable, set `lsp.ty = { command: [...], extensions: [".py", ".pyi"] }` or use the `lsp: true` shorthand. | NO | NO — document `lsp.ty` | `config/lsp.ts` lines 18, 45 |
| 8 | `OPENCODE_EXPERIMENTAL_MARKDOWN` | **REMOVED** — not in current source. Markdown handling is now built-in. | NO | NO | (not found) |
| 9 | `OPENCODE_EXPERIMENTAL_PLAN_MODE` | **REMOVED** — not in current source. Plan mode is now a first-class concept: `agent.plan`, `default_agent: "plan"`, and the `<TAB>` keybinding toggle. See https://opencode.ai/docs/config (`Agents` section). | NO | NO | docs |
| 10 | `OPENCODE_EXPERIMENTAL_EXA` | **REMOVED** — not in current source. Exa is now an MCP server (the `exa` MCP we ship). | NO | NO — Exa is the `exa` MCP | (not found); mcp.json line 61-70 |
| 11 | `OPENCODE_DISABLE_AUTOCOMPACT` | **VALID** — `flag.ts:25`. `truthy("OPENCODE_DISABLE_AUTOCOMPACT")`. | YES — **HARNESS RELEVANT**. The harness has its own session continuity layer (`src/task-management/continuity/`) and the config schema already exposes `compaction.auto: true` (current `opencode.json:13`). We do NOT want OpenCode to auto-compact; the harness manages it. Recommended: `true` (disabled) so OpenCode leaves compaction to the harness. | **YES** — required, default `true` | `flag.ts` line 25; current `opencode.json:12-16`; `.env:59` (already set) |
| 12 | `OPENCODE_DISABLE_TERMINAL_TITLE` | **VALID** — `flag.ts:24`. `truthy("OPENCODE_DISABLE_TERMINAL_TITLE")`. | NO (cosmetic) | NO (opt-in only) | `flag.ts` line 24 |

### 2.3 Other valid OpenCode env vars worth knowing

From `flag.ts` (full list, cited by line number):

| Var | Purpose | Critical for harness? | In `.env.example`? |
|-----|---------|----------------------|-------------------|
| `OPENCODE_AUTO_HEAP_SNAPSHOT` | Auto heap-snapshot on OOM (line 14) | NO | NO |
| `OPENCODE_GIT_BASH_PATH` | Override `git-bash` path on Windows (line 15) | NO (Windows-only) | NO |
| `OPENCODE_CONFIG` | Custom config file path (line 16) | NO (advanced) | NO (mention in README) |
| `OPENCODE_CONFIG_CONTENT` | Inline JSON config (line 17) | NO | NO |
| `OPENCODE_CONFIG_DIR` | Custom `.opencode`-style directory (line 70) | NO (advanced) | NO (mention in README) |
| `OPENCODE_TUI_CONFIG` | Custom `tui.json` (line 68) | NO | NO |
| `OPENCODE_DISABLE_AUTOUPDATE` | Disable auto-update (line 18) | NO (user preference) | NO (opt-in) |
| `OPENCODE_ALWAYS_NOTIFY_UPDATE` | Always notify update (line 19) | NO | NO |
| `OPENCODE_DISABLE_PRUNE` | Disable session pruning (line 20) | NO (compaction) | NO (mention in compaction config) |
| `OPENCODE_SHOW_TTFD` | Show time-to-first-display (line 23) | NO (debug) | NO (debug-only) |
| `OPENCODE_DISABLE_MODELS_FETCH` | Disable model-list fetch (line 26) | NO | NO |
| `OPENCODE_DISABLE_MOUSE` | Disable mouse capture (line 27) | NO (terminal) | NO |
| `OPENCODE_FAKE_VCS` | Fake VCS for tests (line 28) | NO (test) | NO |
| `OPENCODE_SERVER_PASSWORD` | HTTP basic auth for `opencode serve` (line 29) | NO (security) | NO (advanced) |
| `OPENCODE_SERVER_USERNAME` | HTTP basic auth username (line 30) | NO (security) | NO (advanced) |
| `OPENCODE_MODELS_URL` | Override model registry URL (line 37) | NO (advanced) | NO (advanced) |
| `OPENCODE_MODELS_PATH` | Override model registry path (line 38) | NO (advanced) | NO (advanced) |
| `OPENCODE_DB` | Override database path (line 39) | NO (advanced) | NO (advanced) |
| `OPENCODE_WORKSPACE_ID` | Workspace ID (line 42) | NO (advanced) | NO |
| `OPENCODE_DISABLE_PROJECT_CONFIG` | Skip project config (line 61) | NO (debug) | NO (debug) |
| `OPENCODE_PURE` | Pure mode (no side effects) (line 74) | NO (test) | NO (test) |
| `OPENCODE_PERMISSION` | Inline permission (line 76) | NO (advanced) | NO (advanced) |
| `OPENCODE_PLUGIN_META_FILE` | Plugin metadata file (line 80) | NO (advanced) | NO (advanced) |
| `OPENCODE_CLIENT` | Client identifier (line 84, default `cli`) | NO | NO |
| `OPENCODE_EXPERIMENTAL_WORKSPACES` | Enable workspaces (gated by `OPENCODE_EXPERIMENTAL`) | NO (harness has its own) | NO |
| `OPENCODE_EXPERIMENTAL_SESSION_SWITCHER` | Session switcher UI (gated) | NO (harness has its own) | NO |
| `OPENCODE_EXPERIMENTAL_REFERENCES` | Reference aliases (gated) | NO (advanced) | NO |
| `OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER` | Disable file watcher (default false) | NO | NO |
| `OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT` | Disable copy-on-select (Win32 default true) | NO (terminal) | NO |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel exporter endpoint (line 8) | NO (observability) | NO (advanced) |
| `OTEL_EXPORTER_OTLP_HEADERS` | OTel exporter headers (line 9) | NO (observability) | NO (advanced) |

### 2.4 Harness-specific env vars (Hivemind-defined, not OpenCode)

Found by grep in `src/`:

| Var | Purpose | In `.env.example`? | Source |
|-----|---------|-------------------|--------|
| `OPENCODE_HARNESS_STATE_DIR` | Override `.hivemind/state/` location (Q6 root) | YES — required, with default comment | `src/tools/delegation/delegation-status.ts:1`, `src/task-management/continuity/index.ts:1`, `src/features/governance/persistence.ts:1` |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Override continuity file path | YES — required, with default comment | `src/task-management/continuity/index.ts:1` |

### 2.5 Critical experimental flags — FINAL LIST (for `.env.example`)

After the table, only **TWO** env vars are truly required for the harness to function:

1. **`OPENCODE_DISABLE_AUTOCOMPACT=true`** — Disables OpenCode's auto-compaction so the harness's `src/task-management/continuity/` layer owns session context.
2. **`OPENCODE_HARNESS_STATE_DIR`** (optional override) — Default is `.hivemind/state/` per Q6; documented in `.env.example` as an advanced override.
3. **`OPENCODE_HARNESS_CONTINUITY_FILE`** (optional override) — Default is `.hivemind/state/session-continuity.json`; documented as an advanced override.

Everything else in the current `.env` is either (a) obsolete/migrated to `opencode.json` config keys, or (b) a user-preference opt-in.

---

## 3. Template Scaffolding Strategy

### 3.1 The `.example` convention

Standard convention in the Node/npm ecosystem:
- Ship `<file>.example` as a **template with placeholders** (e.g., `$TAVILY_API_KEY`)
- `.gitignore` excludes `<file>` but NOT `<file>.example` (see `.gitignore:31-32` for `.env`)
- On first run, copy `.example` → real file, then user fills in secrets

### 3.2 File tree (what ships, what is user-local, what is gitignored)

```
hivemind-plugin/                       (the npm package)
├── assets/
│   ├── templates/setup/                [NEW — SHIPS]
│   │   ├── opencode.json.example       # minimal server + compaction + plugin
│   │   ├── mcp.json.example            # 8 required MCPs, all `enabled: false`
│   │   ├── .env.example                # minimal — see §4
│   │   ├── README-setup.md             # 1-page quickstart
│   │   └── port-matrix.md              # parallel-session port allocation table
│   ├── commands/
│   │   ├── hivemind-setup.md           [NEW — SHIPS]
│   │   ├── harness-doctor.md           [EXISTING — keep]
│   │   ├── hm-config.md                [EXISTING — keep]
│   │   └── ... (other commands)
│   └── ... (other assets)
├── package.json                        (files field at lines 10-24, add `assets/templates/setup/`)
└── .gitignore                          (line 31-32 gitignores .env, line 34 negates .opencode/)
```

**At USER PROJECT ROOT** (after `/hivemind-setup`):

```
my-project/
├── .env                                [USER-LOCAL, gitignored]
├── .env.example                        [OPTIONAL — only if user wants to track it]
├── mcp.json                            [USER-LOCAL, gitignored, contains API keys]
├── mcp.json.example                    [OPTIONAL — only if user wants to track it]
├── opencode.json                       [USER-LOCAL, contains user's provider config]
└── .opencode/
    ├── opencode.json                   [USER-LOCAL, contains plugin + server + compaction]
    ├── agents/, skills/, ...           [SHIPS from assets/, copied by bootstrap]
    └── mcp.json                        [OPTIONAL — same as root mcp.json]
```

**Recommendation:** Use `.opencode/opencode.json` and `.opencode/mcp.json` to keep harness config co-located with `.opencode/agents/`, `.opencode/skills/`, etc. (OpenCode's canonical pattern, see https://opencode.ai/docs/config: "Per project: Add `opencode.json` in your project root. … This is also safe to be checked into Git"). The root `mcp.json` is also valid (OpenCode discovers both).

### 3.3 What goes in `.gitignore` (additions needed)

Current `.gitignore` (lines 30-37):

```gitignore
# Environment files
.env
!.env.*
```

This already excludes `.env` but allows `.env.example`. **No change needed for `.env`**.

**New additions required** (proposed lines 39-46):

```gitignore
# User-local OpenCode + MCP config (secrets + provider config)
mcp.json
opencode.json
.opencode/mcp.json
.opencode/opencode.json
!.env.example
!mcp.json.example
!opencode.json.example
.opencode/mcp.json.example
.opencode/opencode.json.example
```

Wait — this is a problem. The current `opencode.json` at the project root is **committed** (lines 1-190) and contains the harness's compiled plugin reference (`./dist/plugin.js`, line 7) plus server/compaction config and the harness maintainer's CrofAI provider. If we gitignore `opencode.json`, the harness maintainer's own dev setup breaks.

**Resolution:** The shipped `opencode.json` stays committed for the **maintainer's own dev project** (hivemind-plugin-private). The `.example` template is the **end-user version**, with a different name `opencode.json.example`. End users copy `.example → opencode.json` and modify.

For the `.gitignore` change, we only need:

```gitignore
# NEW (proposed): MCP + OpenCode user-local config (only relevant in user projects that adopt Hivemind)
mcp.json
.opencode/mcp.json
```

The `opencode.json` is project-local config that may or may not be sensitive; project owners decide. For the Hivemind harness repo itself, `opencode.json` IS committed and used.

### 3.4 Naming convention decision

| Filename | Purpose | Gitignored? | In `package.json` files field? |
|----------|---------|-------------|-------------------------------|
| `opencode.json` (committed) | Harness maintainer's own dev config | NO | NO — generated by maintainer |
| `opencode.json.example` | Template shipped to end users | NO | YES — `assets/templates/setup/opencode.json.example` |
| `mcp.json` (user-local) | End-user's MCP config with API keys | YES (NEW) | NO |
| `mcp.json.example` | Template with placeholder env vars | NO | YES — `assets/templates/setup/mcp.json.example` |
| `.env` (user-local) | End-user's secrets | YES (existing) | NO |
| `.env.example` | Template with documented keys | NO | YES — `assets/templates/setup/.env.example` |

The convention is `.example` (NOT `.template`). This matches `dotenv` ecosystem (`dotenv-flow`, `direnv`, `dotenv-vault`) and is the de-facto Node.js standard.

---

## 4. `.env.example` Content

### 4.1 Categorization

**A. REQUIRED for harness features** (must be set or use defaults — defaults are documented in the comment)

**B. REQUIRED for end-user functionality** (MCP API keys — at least one LLM provider is required, but the harness itself doesn't mandate any specific provider)

**C. OPTIONAL** (user preferences, experimental flags)

### 4.2 Full `.env.example` (recommended)

```dotenv
# ============================================
# Hivemind End-User Setup — .env.example
# Copy this file to `.env` and fill in values.
#   cp .env.example .env
# ============================================

# ============================================
# A. REQUIRED for harness features
# ============================================

# Disable OpenCode's auto-compaction. The harness owns session
# continuity via .hivemind/state/session-continuity.json.
# Required: true. Do NOT change unless you know what you're doing.
# Source: OpenCode flag.ts:25, harness src/task-management/continuity/index.ts
OPENCODE_DISABLE_AUTOCOMPACT=true

# Optional override: Hivemind state directory (Q6 root).
# Default: <project>/.hivemind/state/
# Set this if you want to relocate .hivemind/state/ (e.g., shared volume).
# OPENCODE_HARNESS_STATE_DIR=/custom/path/to/state

# Optional override: continuity JSON file path.
# Default: <OPENCODE_HARNESS_STATE_DIR>/session-continuity.json
# OPENCODE_HARNESS_CONTINUITY_FILE=/custom/path/to/continuity.json

# ============================================
# B. REQUIRED for end-user functionality (MCP API keys)
# At minimum, set the keys for MCPs you want to enable in mcp.json.
# All keys are passed via OpenCode's ${VAR} substitution in mcp.json.
# ============================================

# Brave Search (web search)
# Get a key: https://api.search.brave.com/
BRAVE_API_KEY=

# Tavily (AI-powered web search + extraction)
# Get a key: https://tavily.com/
TAVILY_API_KEY=

# Exa (neural search)
# Get a key: https://exa.ai/
EXA_API_KEY=

# GitHub (Personal Access Token, for repository ops)
# Create a PAT: https://github.com/settings/tokens (scopes: repo, read:org)
GITHUB_PAT=

# ============================================
# C. OPTIONAL — MCP API keys (only if you enable these MCPs)
# ============================================

# Notion (only if you add the notion MCP)
NOTION_API_TOKEN=

# Netlify (only if you add the netlify MCP)
NETLIFY_PAT=

# Smithery CLI (only if you add desktop-commander via Smithery)
SMITHERY_CLI_KEY=

# Z.AI / Zhipu (only if you add the web-search-prime / web-reader / zread MCPs)
ZAI_API_KEY=

# ============================================
# D. OPTIONAL — LLM provider keys (skip if using /connect)
# OpenCode's /connect command stores these in ~/.local/share/opencode/auth.json
# and you don't need them here. Only set below if you want a project-scoped
# provider config (e.g., for CI or shared team keys).
# ============================================

# OpenCode Go (low-cost plan)
# OPENCODE_GO_API_KEY=

# CrofAI (custom provider used in this project's own dev setup)
# CROFAI_API_KEY=

# ============================================
# E. OPTIONAL — Advanced overrides (rarely changed)
# ============================================

# Custom OpenCode config file path (rare)
# OPENCODE_CONFIG=/path/to/custom-opencode.json

# Custom OpenCode config directory (rare; used for isolated dev setups)
# OPENCODE_CONFIG_DIR=/path/to/custom-config-dir

# Server basic-auth (set both to enable)
# OPENCODE_SERVER_PASSWORD=
# OPENCODE_SERVER_USERNAME=opencode

# Disable mouse capture in TUI (rare)
# OPENCODE_DISABLE_MOUSE=false

# Disable terminal title updates (cosmetic; performance-impact is negligible)
# OPENCODE_DISABLE_TERMINAL_TITLE=false

# ============================================
# F. DO NOT USE — DEPRECATED / migrated flags
# (Kept here as a comment for reference; setting them does nothing.)
# ============================================

# OPENCODE_EXPERIMENTAL=true                  # Migrated to experimental.* config keys in opencode.json
# OPENCODE_EXPERIMENTAL_ICON_DISCOVERY=true   # REMOVED in current OpenCode
# OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS=24000  # Use provider.options.timeout in opencode.json
# OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=200000         # Use per-model limit.output in opencode.json
# OPENCODE_EXPERIMENTAL_LSP_TOOL=true                   # Use lsp config block in opencode.json
# OPENCODE_EXPERIMENTAL_LSP_TY=true                     # Use lsp.ty config (ty is in builtin list)
# OPENCODE_EXPERIMENTAL_MARKDOWN=true                   # REMOVED — markdown handling is built-in
# OPENCODE_EXPERIMENTAL_PLAN_MODE=true                  # Plan mode is first-class; use default_agent: "plan"
# OPENCODE_EXPERIMENTAL_EXA=true                        # REMOVED — Exa is now the `exa` MCP
# OPENCODE_EXPERIMENTAL_MODELS=true                     # REMOVED
# OPENCODE_EXPERIMENTAL_OXFMT=true                      # Use formatter config in opencode.json
# OPENCODE_ENABLE_EXA=true                              # REMOVED — use the `exa` MCP instead
# OPENCODE_EXPERIMENTAL_FILEWATCHER=true                # Valid but optional; not harness-critical
# OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER=true        # Use this if you want to disable file watcher
```

### 4.3 Rationale (key choices)

- **No `provider` keys in `.env.example`.** OpenCode stores auth in `~/.local/share/opencode/auth.json` via `/connect` (https://opencode.ai/docs/providers, "Credentials" section). We document this in the comment but do not include them.
- **`OPENCODE_DISABLE_AUTOCOMPACT=true` is the ONLY required non-optional harness key.** This is the only env var where the harness has a documented runtime dependency (`src/task-management/continuity/`).
- **The DEPRECATED section (F)** is a comment-only block so future maintainers don't reintroduce the old flags. The maintainer's current `.env:31-42, 80, 92-96` has these and they're dead.
- **No `OPENCODE_EXPERIMENTAL` flag in section A.** The `enabledByExperimental()` helper in `flag.ts:12` does check it, but only for the three flags listed (`WORKSPACES`, `SESSION_SWITCHER`, `REFERENCES`), all of which are not needed by the harness. Setting it true is harmless but does nothing useful for the harness.

---

## 5. `mcp.json.example` Template

### 5.1 The 8 required MCPs (in alphabetical order)

Per user requirement #2:

| Server | Type | Requires API key? | Source/URL | Recommended auth |
|--------|------|------------------|-----------|-----------------|
| `brave-search` | `local` (npx) | YES — `BRAVE_API_KEY` | `@brave/brave-search-mcp-server` (current `mcp.json:131-140`) | env var |
| `context7` | `remote` (http) | NO (public) | `https://mcp.context7.com/mcp` (current `mcp.json:43-45`) | none |
| `deepwiki` | `remote` (http) | NO (public) | `https://mcp.deepwiki.com/mcp` (current `mcp.json:46-49`) | none |
| `exa` | `local` (npx + mcp-remote) | YES — `EXA_API_KEY` | `https://mcp.exa.ai/mcp` (current `mcp.json:61-70`) | env var via mcp-remote |
| `github` | `local` (npx) | YES — `GITHUB_PAT` | `@modelcontextprotocol/server-github` (current `mcp.json:78-87`) | env var |
| `gitmcp` | `remote` (http) | NO (public) | `https://gitmcp.io` (current `mcp.json:12-15`) | none |
| `repomix` | `local` (npx) | NO (public) | `repomix --mcp` (current `mcp.json:112-119`) | none |
| `tavily` | `remote` (http) | YES — `TAVILY_API_KEY` | `https://mcp.tavily.com/mcp/` (current `mcp.json:127-130`) | query-string in URL |

### 5.2 Recommended `mcp.json.example` (final)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "brave-search": {
      "type": "local",
      "command": ["npx", "-y", "@brave/brave-search-mcp-server"],
      "environment": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      },
      "enabled": false,
      "timeout": 30000
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": false,
      "timeout": 15000
    },
    "deepwiki": {
      "type": "remote",
      "url": "https://mcp.deepwiki.com/mcp",
      "enabled": false,
      "timeout": 15000
    },
    "exa": {
      "type": "local",
      "command": ["npx", "-y", "mcp-remote", "https://mcp.exa.ai/mcp"],
      "environment": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      },
      "enabled": false,
      "timeout": 30000
    },
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      },
      "enabled": false,
      "timeout": 30000
    },
    "gitmcp": {
      "type": "remote",
      "url": "https://gitmcp.io",
      "enabled": false,
      "timeout": 35000
    },
    "repomix": {
      "type": "local",
      "command": ["npx", "-y", "repomix", "--mcp"],
      "enabled": false,
      "timeout": 60000
    },
    "tavily": {
      "type": "remote",
      "url": "https://mcp.tavily.com/mcp/?tavilyApiKey=${TAVILY_API_KEY}",
      "enabled": false,
      "timeout": 35000
    }
  }
}
```

### 5.3 Key design decisions

1. **All MCPs default to `enabled: false`.** User explicitly opts in during `/hivemind-setup` by entering the API key. The schema field `enabled: Schema.optional(Schema.Boolean)` is per `packages/core/src/v1/config/mcp.ts:18, 33` — the harness can use it.
2. **Use the new `mcp` block, NOT the legacy `mcpServers` block.** The current `mcp.json` (lines 1-141) uses the deprecated `mcpServers` key. The current OpenCode config schema (`config.ts:91-93`) uses `mcp: { [name]: McpLocalConfig | McpRemoteConfig | { enabled: boolean } }`. **Migration note: rename `mcpServers` → `mcp` and use `type: "local" | "remote"` discriminator.**
3. **Use `${VAR}` substitution, not literal `$VAR`.** OpenCode supports env var substitution in config values (per the docs: "Substitute environment variables"). This is more robust than the current `mcp.json:6` which uses `Bearer $NOTION_API_TOKEN` (literal `$`, not `${}`).
4. **Discriminator field is `type: "local" | "remote"`.** Per `config/mcp.ts:5, 27`. The current `mcp.json` does NOT use the `type` field (it relies on httpUrl vs command). This is the same information; the new schema is more explicit and validation-friendly.
5. **Auth handling:**
   - **Public (no auth):** `context7`, `deepwiki`, `gitmcp`, `repomix` — no env var needed; can be `enabled: true` by default in the future.
   - **API key (env var):** `brave-search`, `exa`, `github` — `enabled: false` until the user provides the key.
   - **API key in URL (Tavily):** `tavily` — key in the query string. Same gating.
   - **OAuth (not used by the 8 required):** would use `oauth: { clientId, clientSecret, scope, callbackPort, redirectUri }` per `config/mcp.ts:39-50`. Not applicable to the 8 required.

### 5.4 What is NOT in the shipped `mcp.json.example`

The current `mcp.json` (142 lines) has **18** servers. The new `.example` ships **8** (per user requirement #2). Servers NOT in the 8-required list:

- `notion` (line 3-9) — optional
- `stitch` (line 10-11) — optional
- `fetcher` (line 17-23) — optional
- `web-search-prime` (line 25-30) — Z.AI specific
- `web-reader` (line 31-36) — Z.AI specific
- `zread` (line 37-42) — Z.AI specific
- `desktop-commander` (line 50-60) — Smithery-specific
- `fetch` (line 72-77) — redundant with built-in
- `mcp-playwright` (line 88-94) — optional
- `memory` (line 95-101) — optional
- `netlify` (line 102-111) — optional
- `sequential-thinking` (line 120-126) — optional

These can be added by the user manually or via `/hm-config --integrations` (existing command, see `assets/commands/hm-config.md:35`).

---

## 6. `opencode.json.example` Template

### 6.1 Recommended `opencode.json.example` (final)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // Project instructions — universal rules apply to all sessions
  "instructions": [
    ".opencode/rules/universal-rules.md"
  ],

  // Plugin — load the Hivemind harness
  "plugin": [
    "./node_modules/hivemind/dist/plugin.js"
  ],

  // Server — port 4096 default (OpenCode convention)
  // Override via OPENCODE_SERVER_PORT env or --port CLI flag
  "server": {
    "port": 4096,
    "hostname": "127.0.0.1",
    "mdns": false,
    "mdnsDomain": "opencode.local",
    "cors": []
  },

  // Compaction — harness owns this; disable OpenCode's auto-compact
  // (also requires OPENCODE_DISABLE_AUTOCOMPACT=true in .env)
  "compaction": {
    "auto": false,
    "prune": false,
    "reserved": 5000
  },

  // Tools — none disabled by default; harness adds its own
  "tools": {},

  // MCP servers — see mcp.json (kept separate for clarity)
  // Loaded from the .opencode/mcp.json file or root mcp.json automatically

  // LLM provider — INTENTIONALLY OMITTED. The harness is provider-agnostic.
  // To add a provider, use the /connect command in the TUI, or add a
  // `provider` block here (see https://opencode.ai/docs/providers).
  //
  // Recommended pattern:
  //   1. Run /connect in the TUI
  //   2. Pick a provider (Anthropic, OpenAI, OpenCode Zen, ...)
  //   3. Enter your API key (stored in ~/.local/share/opencode/auth.json)
  //   4. Run /models to select a model
  //
  // To configure a custom provider in the project (e.g., for a team-shared
  // proxy or local model), add a `provider` block here. Example:
  //
  // "provider": {
  //   "anthropic": {
  //     "options": {
  //       "baseURL": "https://api.anthropic.com",
  //       "timeout": 600000,
  //       "chunkTimeout": 30000
  //     }
  //   }
  // }
}
```

### 6.2 What is NOT in the shipped `opencode.json.example`

| Field | Status | Why |
|-------|--------|-----|
| `provider` | **OMITTED** | LLM providers are optional (user requirement #1). Use `/connect` to add interactively. |
| `model` | **OMITTED** | User chooses at runtime via `/models`. |
| `small_model` | **OMITTED** | Same as above. |
| `default_agent` | **OMITTED** | Defaults to `build`; harness agents are loaded from `.opencode/agents/`. |
| `mcp` | **OMITTED** | Kept in `mcp.json` for separation of concerns. OpenCode reads both. |
| `experimental` | **OMITTED** | The `experimental.*` config keys (`mcp_timeout`, `policies`, `batch_tool`, `openTelemetry`, `primary_tools`, `continue_loop_on_deny`, `disable_paste_summary`) are not needed by the harness at the project-config level. If a user needs one, they can add it. |
| `lsp` | **OMITTED** | Defaults to `true` (built-in LSPs). If user wants custom LSPs, they add to their local `opencode.json`. |
| `formatter` | **OMITTED** | Same as LSP. |
| `permission` | **OMITTED** | User can set per-session via TUI. |
| `tools` | **EMPTY `{}`** | Don't disable any tools by default. |

### 6.3 What the maintainer's own `opencode.json` has (and why we don't ship it)

The current `opencode.json:17-188` contains the maintainer's `CrofAI` provider with 18+ models. This is **personal dev config**, NOT something to ship to end users. The end-user version strips all of this out and documents the `/connect` workflow instead.

### 6.4 `compaction` block — alignment with `.env`

| Key | `.env.example` | `opencode.json.example` | Why both? |
|-----|----------------|------------------------|-----------|
| Auto-compaction | `OPENCODE_DISABLE_AUTOCOMPACT=true` | `"compaction": { "auto": false }` | Belt + suspenders. The env var is the harness's contract (`flag.ts:25`); the config is the user's view. **Both must agree.** |
| Prune | (no env var) | `"compaction": { "prune": false }` | OpenCode-only setting; `flag.ts:20` has `OPENCODE_DISABLE_PRUNE` if user wants to override. |

The harness's design intent: **harness owns session state** (continuity in `.hivemind/state/`, events in `.hivemind/event-tracker/`), OpenCode is forbidden from auto-compacting or pruning. The `compaction.reserved: 5000` matches the current `opencode.json:15` and is the "headroom" buffer to avoid overflow.

---

## 7. `/hivemind-setup` Command Design

### 7.1 Why a new command (not extending `hm-config` or `harness-doctor`)

| Command | Purpose | Stage | Reuse? |
|---------|---------|-------|--------|
| `harness-doctor` (`assets/commands/harness-doctor.md:1-18`) | **Health check** of existing install — verifies plugin load, agents parse, etc. | Read-only diagnostic | NO — different lifecycle stage |
| `hm-config` (`assets/commands/hm-config.md:1-65`) | **Hivemind runtime toggles** — workflow flags, model profile | Post-install configuration | NO — different scope (runtime vs. bootstrap) |
| **`hivemind-setup`** (NEW) | **One-time bootstrap** — create `.env`, `mcp.json`, `opencode.json` from `.example` templates | Pre-install / first install | YES — primary purpose |

### 7.2 Interactive vs. declarative — RECOMMENDATION: interactive

**Interactive** wins because:

1. **API key prompts need user input** — Cannot be declarative.
2. **MCP opt-in is a per-user choice** — `context7` (free) vs. `brave-search` (paid) — only the user knows what they have.
3. **Matches OpenCode's own UX** — `/connect`, `/init`, `/connect` are all interactive.
4. **Validation is iterative** — User pastes key, setup tests `GET /global/health`, if it fails prompt to retry.

The harness already has `@clack/prompts` in `package.json:51` (^1.4.0) which is the de-facto interactive prompt library for Node CLIs.

### 7.3 Workflow steps (proposed)

**Step 1: Detect missing config**

```bash
# Pseudo-code
[ -f .env ]                  || MISSING_ENV=1
[ -f opencode.json ]         || MISSING_OPENCODE=1
[ -f .opencode/mcp.json ]    || MISSING_MCP_ROOT=1
[ -f opencode.json ]         || MISSING_MCP_LOCAL=1
```

If everything exists, ask: "Config already exists. [R]euse / [B]ackup-and-overwrite / [Q]uit?" Default: `R`.

**Step 2: Copy `.example` templates**

```bash
[ -f .env ]                  || cp assets/templates/setup/.env.example .env
[ -f opencode.json ]         || cp assets/templates/setup/opencode.json.example opencode.json
[ -f .opencode/mcp.json ]    || cp assets/templates/setup/mcp.json.example .opencode/mcp.json
```

**Step 3: Walk through MCPs (the meat of the setup)**

For each of the 8 required MCPs, prompt:

```
? Enable Brave Search? (web search)
  > ❯ Yes (provide API key)
    No (skip — can enable later)
    Learn more → https://api.search.brave.com/

? Enter BRAVE_API_KEY: (input is masked)
> BSAoe1zO-z-9yeDLJ__8L4n11Y8EL7V
```

After entering the key, the setup **validates** by reading `.env` and checking the substitution produces a non-empty string. It does NOT make a network call (out of scope for a CLI).

For the 4 public MCPs (`context7`, `deepwiki`, `gitmcp`, `repomix`), the prompt is just "Enable?" with no key entry.

**Step 4: Optional sections**

- **LLM Provider:** "Add a custom provider to `opencode.json`? (yes/no) — if yes, walk through provider name, base URL, API key, model list."
- **Extra MCPs:** "Add any optional MCPs from the catalog? (notion, netlify, playwright, memory, ...)"
- **TUI config:** "Create `tui.json`? (rarely needed)"

**Step 5: Validate setup works**

Run the OpenCode TUI in `--headless` mode (or just the server in foreground for 2 seconds) and:

```bash
# 1. Check server is up
curl -fsS http://127.0.0.1:4096/global/health | jq '.healthy' # expect: true

# 2. Check MCPs loaded
curl -fsS http://127.0.0.1:4096/mcp | jq 'keys' # expect: list of enabled servers

# 3. Check plugin loaded
# (no direct API; check by looking at logs)
```

If any check fails, print the error and offer to retry or skip.

**Step 6: Print summary**

```
✓ .env created (1 keys set, 0 missing)
✓ opencode.json created (1 plugin, 0 providers)
✓ mcp.json created (4 of 8 MCPs enabled)
✓ Server health: healthy
✓ Server version: 1.15.x

Next steps:
  1. Run /connect in the TUI to add an LLM provider
  2. Run /models to pick a model
  3. Run your first task!

Re-run this setup anytime: /hivemind-setup
Diagnose issues: /harness-doctor
```

### 7.4 File locations

The command file lives at `assets/commands/hivemind-setup.md` (mirrors the location of `harness-doctor.md`). After `node scripts/sync-assets.js`, it lands at both `.opencode/command/` and `.opencode/commands/` (per the `command/commands` plurality convention in AGENTS.md).

### 7.5 Frontmatter

```yaml
---
description: "One-time interactive setup for Hivemind. Creates .env, opencode.json, and mcp.json from templates; walks through MCP opt-in; validates the install."
agent: hm-onboarding
subtask: false
argument-hint: "[--reconfigure | --validate-only | --no-mcp]"
---
```

### 7.6 Agent binding (NEW agent: `hm-onboarding`)

This is the first command that would benefit from a dedicated **onboarding agent** (not `hm-l0-orchestrator`, not `hm-config`). The new agent would:
- Hold no LLM context (it's mostly a state machine with clack prompts)
- Have `read`, `write`, `bash` tools only
- Delegate to `hm-doctor` for validation
- Be lifecycle-only (not invoked during regular work)

Alternative: make `/hivemind-setup` an `hm-l0-orchestrator` command (current `hm-config.md:3` uses `hm-orchestrator`). The onboarding flow is small enough that a dedicated agent is overkill. **Recommend: bind to `hm-l0-orchestrator` for v1, extract to `hm-onboarding` later if the workflow grows.**

### 7.7 Integration with BOOT-02 bootstrap

`BOOT-02` is the existing bootstrap workflow (referenced in `assets/commands/harness-doctor.md` and elsewhere). It currently:
1. Creates local `.hivemind/` surfaces (Q6 root)
2. Installs project/global OpenCode primitive symlinks

**New integration: BOOT-02 calls `/hivemind-setup` if no `.opencode/opencode.json` exists.** Sequence:

```
BOOT-02 (existing)
  ↓ creates .hivemind/ state roots
  ↓ installs primitive symlinks
  ↓ checks for .opencode/opencode.json
    ├─ EXISTS → /harness-doctor (read-only health check)
    └─ MISSING → /hivemind-setup (interactive bootstrap)
```

### 7.8 Error states

| Error | Recovery |
|-------|----------|
| `.env.example` not found (template missing) | Print error, point to GitHub issue tracker. STOP. |
| `opencode.json` exists but malformed (JSON parse error) | Offer to back up as `opencode.json.backup` and re-copy from `.example`. WARN user. |
| `mcp.json` exists but has invalid `mcpServers` key (legacy) | Offer to migrate `mcpServers` → `mcp` with `type: "local" | "remote"`. If user accepts, write a migration report. |
| User provides empty API key | Re-prompt. Do not write empty env var. |
| Validation step (`curl /global/health`) fails | Print server log tail, offer to skip validation and continue (user may want to fix manually). |
| Port 4096 already in use | Print which process (`lsof -i :4096 -P -n | grep LISTEN`). Offer to use a different port and update both `.env` and `opencode.json`. |
| User Ctrl-C mid-flow | All partial writes are atomic. The setup leaves a `.partial-setup.json` checkpoint and offers to resume. |

---

## 8. Port Architecture (4096 default)

### 8.1 Why port 4096 is correct

The user requirement (NOT 4069) is **verified** in two OpenCode sources:

1. **`https://opencode.ai/docs/config`** — example block: `"server": { "port": 4096 }`
2. **`https://opencode.ai/docs/server`** — `opencode serve` flag table: `--port | Port to listen on | 4096`

### 8.2 Port resolution priority order (highest to lowest)

| Priority | Source | Override |
|----------|--------|----------|
| 1 | `OPENCODE_SERVER_PORT` env var | Per-shell |
| 2 | `--port` CLI flag (`opencode serve --port 4097`) | Per-invocation |
| 3 | `opencode.json` `server.port` (in project or `OPENCODE_CONFIG`) | Per-project |
| 4 | Built-in default `4096` | Last resort |

This matches the standard OpenCode precedence (CLI > env > config > default).

### 8.3 Parallel-session isolation via dedicated ports

The user requirement mentions "tmux isolation" and "parallel sessions". The pattern:

**Option A (recommended for dev): explicit port assignment**

```bash
# Terminal 1 (harness session A)
OPENCODE_SERVER_PORT=4096 opencode

# Terminal 2 (harness session B)
OPENCODE_SERVER_PORT=4097 opencode

# Terminal 3 (harness session C — for tmux pane)
OPENCODE_SERVER_PORT=4098 opencode
```

The harness layer (WaiterModel in `src/coordination/delegation/manager.ts`) is already port-aware. Each child session knows its parent session's port and can address sibling servers.

**Option B (recommended for cluster discovery): mDNS**

OpenCode's `server.mdnsDomain` setting (https://opencode.ai/docs/config, "Server" section) enables mDNS service discovery. The shipped default in `opencode.json.example` is `"mdnsDomain": "opencode.local"`. To run multiple instances on the same network:

```jsonc
"server": {
  "port": 4096,
  "mdns": true,
  "mdnsDomain": "alice-laptop.opencode.local"  // unique per machine
}
```

**Option C (recommended for tmux): port-per-pane**

When using tmux with the `tmux-copilot` tool (existing in tools), each pane can run its own `opencode serve` on a dedicated port. The `tmux-state-query` tool can discover all running servers by scanning known port ranges.

### 8.4 Port allocation table (shipped as `port-matrix.md`)

A static allocation table ships at `assets/templates/setup/port-matrix.md`:

| Port range | Purpose | Default binding |
|-----------|---------|----------------|
| 4096-4099 | Primary dev sessions (1 user) | `127.0.0.1` |
| 4100-4199 | Parallel worker sessions (auto-assigned) | `127.0.0.1` |
| 4200-4299 | tmux pane isolation (visual layer) | `127.0.0.1` |
| 4300-4399 | CI / headless sessions (no TUI) | `0.0.0.0` (with `OPENCODE_SERVER_PASSWORD`) |
| 4400+ | Reserved for ad-hoc | user choice |

### 8.5 Override mechanism in `opencode.json.example`

```jsonc
"server": {
  "port": 4096,                              // default
  "hostname": "127.0.0.1",                   // localhost only (default for security)
  "mdns": false,                             // off by default (no LAN discovery)
  "mdnsDomain": "opencode.local",            // standard
  "cors": []                                 // no CORS by default
}
```

User can change `"port": 4096` to any value; env var `OPENCODE_SERVER_PORT` overrides at runtime.

### 8.6 Client-server architecture verification

The "client-server is the right pattern" claim is verified by OpenCode's own architecture (https://opencode.ai/docs/server):

> When you run `opencode` it starts a TUI and a server. Where the TUI is the client that talks to the server. The server exposes an OpenAPI 3.1 spec endpoint. This endpoint is also used to generate an SDK. This architecture lets opencode support multiple clients and allows you to interact with opencode programmatically.

The harness's existing tools (`delegate-task`, `delegation-status`, `hivemind`) all communicate with the OpenCode server via the SDK (`@opencode-ai/sdk` in `package.json:53`). No new HTTP server is needed in the harness; we just bind to OpenCode's existing server on 4096.

---

## 9. Migration Plan

### 9.1 For existing users (already running the harness)

**Step 1: Backward-compatible window.** The current `opencode.json` keeps working as-is. The new `.example` templates are ADDITIVE — they don't replace the user's existing config.

**Step 2: Deprecation warning.** In `/harness-doctor` and `/hivemind-setup`, add a one-line note:

```
Note: Your opencode.json still has the legacy CrofAI provider.
Consider running /hivemind-setup to migrate to a cleaner config with
provider managed via /connect.
```

**Step 3: Phased cutover.**

| Phase | What | When | Reversible? |
|-------|------|------|-------------|
| 1 | Ship `.example` templates and `/hivemind-setup` command | Next release | YES — additive |
| 2 | Document in CHANGELOG | Same release | YES |
| 3 | `/harness-doctor` flags `mcpServers` (legacy) → recommend `mcp` | +1 release | YES |
| 4 | `.gitignore` excludes `mcp.json` (user-local) | +1 release | YES — user can `git add -f mcp.json` |
| 5 | Remove CrofAI provider from shipped `opencode.json` (keep only for maintainer's own dev) | +2 releases | NO — but doesn't affect end users |

### 9.2 For new users (clean install)

1. `npm install hivemind` (or install via tap/brew)
2. Run `hivemind setup` (the CLI tool at `bin/hivemind.cjs`, see `package.json:8`)
3. OR run `/hivemind-setup` in the TUI

The CLI tool does the same thing as the slash command but runs in the user's shell, not inside OpenCode. Both are valid; the slash command is recommended for first-time users because it can show the TUI screenshots in-place.

### 9.3 For the harness maintainer (us)

The current `opencode.json` (190 lines) at the project root is **maintained as the maintainer's personal dev config**. It is **NOT** shipped to end users via the npm package. The shipped `package.json` files field (lines 10-24) does NOT include the root `opencode.json` — it only includes `assets/`. So the end-user `opencode.json.example` is what's in the npm package, not our `opencode.json`.

The maintainer should:
1. Keep their personal `opencode.json` (CrofAI provider, etc.) at the project root
2. NOT commit a `mcp.json` (it's gitignored; they use `.opencode/mcp.json` for personal MCPs)
3. NOT commit `.env` (already gitignored)
4. Use the same `.example` files as end users for their own dev setup (with their own secrets filled in)

### 9.4 For users with existing custom MCPs

If a user has an existing `mcp.json` with custom MCPs (e.g., `notion`, `memory`, `playwright`), `/hivemind-setup` will:
1. Read their existing `mcp.json` (if any)
2. Offer to add the 8 required MCPs WITHOUT removing existing ones
3. Migrate `mcpServers` → `mcp` if needed
4. Write a backup of the original as `mcp.json.backup.YYYY-MM-DD`

---

## 10. Open Questions for L0

These require human-in-the-loop decisions before L4 (implementation) begins:

**Q-A: Compaction defaults in `.example`**
- **Option A1:** Ship `compaction.auto: false, compaction.prune: false, compaction.reserved: 5000` (harness owns it).
- **Option A2:** Ship an empty `compaction` block (let OpenCode use its built-in defaults, which are `auto: true, prune: false` per `config.ts:130-145`).
- **Recommendation:** A1 — the harness's whole design depends on it.

**Q-B: MCP default state**
- **Option B1:** All 8 default to `enabled: false`. User opts in.
- **Option B2:** Public ones (`context7`, `deepwiki`, `gitmcp`, `repomix`) default to `enabled: true`; key-required ones default to `false`.
- **Option B3:** All default to `enabled: true`; key-required ones simply fail to start until key is provided.
- **Recommendation:** B1 — explicit is safer; the user has shown intent to set up.

**Q-C: Conflict resolution when config exists**
- **Option C1:** Refuse to overwrite.
- **Option C2:** Backup-and-overwrite.
- **Option C3:** Merge (deep) — new `mcp` keys added, existing keys preserved.
- **Recommendation:** C2 for `mcp.json` (rare merges cause confusion), C3 for `opencode.json` (a missing plugin entry is critical).

**Q-D: Should `OPENCODE_EXPERIMENTAL` be set in `.env.example` for safety?**
- **Option D1:** Not set (default behavior — only the 3 gated flags change).
- **Option D2:** Set to `true` to enable `WORKSPACES`, `SESSION_SWITCHER`, `REFERENCES` (none used by harness currently).
- **Recommendation:** D1 — the harness has its own workspace/session system; OpenCode's experimental workspaces would be redundant.

**Q-E: Should the `compaction.auto: false` in `opencode.json.example` match the `OPENCODE_DISABLE_AUTOCOMPACT=true` in `.env.example`?**
- Both are required for the harness's design. If a user sets ONE but not the other, the harness partially works.
- **Recommendation:** Document the dependency clearly in both files; add a sanity check in `/harness-doctor`.

**Q-F: Where to mount `mcp.json` — root or `.opencode/`?**
- **Option F1:** Root `mcp.json` (current convention; widely used).
- **Option F2:** `.opencode/mcp.json` (co-located with harness config).
- **Recommendation:** F2 — keeps the `.opencode/` namespace the canonical config root. OpenCode reads both anyway.

**Q-G: Should the harness ship a Docker Compose for tmux-isolated dev?**
- Out of scope for v1, but mentioned in `assets/templates/setup/port-matrix.md` as a future option.

---

## Appendix A: File Diff Summary (what changes in the repo)

| Action | Path | Type |
|--------|------|------|
| NEW | `assets/templates/setup/opencode.json.example` | File |
| NEW | `assets/templates/setup/mcp.json.example` | File |
| NEW | `assets/templates/setup/.env.example` | File |
| NEW | `assets/templates/setup/README-setup.md` | File |
| NEW | `assets/templates/setup/port-matrix.md` | File |
| NEW | `assets/commands/hivemind-setup.md` | File |
| MODIFY | `package.json` (add `assets/templates/setup/` to `files` field) | Line edit |
| MODIFY | `.gitignore` (add `mcp.json`, `.opencode/mcp.json`) | Line edit |
| MODIFY | `assets/commands/harness-doctor.md` (note about legacy `mcpServers`) | Line edit |
| MODIFY | `assets/commands/hm-config.md` (cross-link `/hivemind-setup` in description) | Line edit |
| NEW | `.planning/proposals/hivemind-setup-architecture-2026-06-04.md` | This file |

## Appendix B: Citations Map

| Claim | Source |
|-------|--------|
| Port 4096 is OpenCode default | https://opencode.ai/docs/config (server example block), https://opencode.ai/docs/server (CLI flag table) |
| `OPENCODE_EXPERIMENTAL_*` env vars in current OpenCode | https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/flag/flag.ts (lines 8-86) |
| `experimental.*` config keys in `opencode.json` | https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/config.ts (lines 130-145) |
| MCP config schema (local/remote, enabled, timeout, oauth) | https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/mcp.ts (lines 1-65) |
| LSP config schema (ty in builtin list) | https://raw.githubusercontent.com/sst/opencode/dev/packages/core/src/v1/config/lsp.ts (lines 18-45) |
| Config precedence (remote → global → project → .opencode) | https://opencode.ai/docs/config (Precedence order section) |
| Provider config (baseURL, timeout, chunkTimeout) | https://opencode.ai/docs/config (Provider-Specific Options section) |
| LLM auth via /connect stores in `~/.local/share/opencode/auth.json` | https://opencode.ai/docs/providers (Credentials section) |
| Harness state env vars (`OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`) | `src/tools/delegation/delegation-status.ts:1`, `src/task-management/continuity/index.ts:1`, `src/features/governance/persistence.ts:1` (grep) |
| Current 8 required MCPs in `mcp.json` | `/Users/apple/hivemind-plugin-private/mcp.json` lines 43-140 |
| `.env` currently has 10+ API keys | `/Users/apple/hivemind-plugin-private/.env` lines 1-20 |
| `opencode.json` currently has CrofAI provider with 18 models | `/Users/apple/hivemind-plugin-private/opencode.json` lines 17-188 |
| `package.json` `files` field (what ships) | `/Users/apple/hivemind-plugin-private/package.json` lines 10-24 |
| `.gitignore` patterns for `.env` and `.opencode/` | `/Users/apple/hivemind-plugin-private/.gitignore` lines 30-37 |
| Existing `harness-doctor` and `hm-config` commands | `/Users/apple/hivemind-plugin-private/assets/commands/harness-doctor.md:1-18`, `hm-config.md:1-65` |
| Harness plugin reference (current) | `opencode.json:7` (`./dist/plugin.js`) |
| 8-MCP requirement (user) | User requirement #2 (prompt verbatim) |
| Port 4096 verification (user) | User requirement #4 (prompt verbatim) |
| LLM providers optional (user) | User requirement #1 (prompt verbatim) |
| `.env` required for experimental features (user) | User requirement #3 (prompt verbatim) |

## Appendix C: Glossary

- **Q6 root** — `.hivemind/` is the canonical internal state root per Q6 governance decision (see `.planning/codebase/ARCHITECTURE.md:247-255`).
- **P0 mutation gates** — Per `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`, source planes (`.opencode/`) have mutation gates; runtime state (`.hivemind/`) does not.
- **CQRS** — Command-Query Responsibility Segregation; the harness enforces hooks (read-side) never write state, only tools (write-side) do.
- **L5 design doc** — Pure documentation/decision artifact, NOT runtime code. Per AGENTS.md (project root) and `.hivemind/AGENTS.md` ("L5 documentation guidance only. This file does not prove runtime readiness").
- **WaiterModel** — The harness's delegation pattern: parent dispatches, child runs, parent waits for dual-signal completion (doer + verifier agree).
- **Stackable session** — A delegation pattern where new work is attached to an existing (completed, failed, or active) session to preserve context.
