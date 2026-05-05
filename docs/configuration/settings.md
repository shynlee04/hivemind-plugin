<!-- generated-by: gsd-doc-writer -->

# Configuration

## Environment Variables

The harness runtime reads environment variables at startup. All harness-specific variables are **optional** — the system operates with sensible defaults when they are absent.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENCODE_HARNESS_STATE_DIR` | Optional | `.hivemind/state/` (project-root-relative) | Override the directory where the harness writes its persistent state files (session continuity, delegation records, runtime state). |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Optional | `{stateDir}/session-continuity.json` | Override the exact path to the session continuity JSON file. Takes precedence over `OPENCODE_HARNESS_STATE_DIR`. |
| `OPENCODE_HARNESS_CONCURRENCY_LIMIT` | Optional | `3` | Maximum concurrent delegated sessions the lifecycle manager will allow. Must be a positive integer. Values below 1 are clamped to 3. |
| `OPENCODE_CONFIG_DIR` | Optional | `~/.config/opencode` | Directory path for global (non-project) primitive configuration. Used by the `configure-primitive` tool when scope is `"global"`. |
| `NODE_ENV` | Optional | — | When set to `"test"`, the SDK session ID sanitizer relaxes its prefix-stripping rules to allow `child-` and `parent-` prefixed session IDs for test isolation. |

### Required Peer Dependencies

The harness requires `opencode.json` at project root (or an equivalent OpenCode configuration file) with the following minimum structure:

```json
{
  "plugin": ["./dist/plugin.js"]
}
```

No environment variables are **required** for the harness to build, test, or run. All runtime values fall back to hardcoded defaults within the `src/lib/runtime-policy.ts` module.

## Config File Format

### `opencode.json` — OpenCode Project Configuration

The project root `opencode.json` defines the OpenCode runtime environment: plugin loading, model providers, permissions, and compaction behavior. The harness loads as a plugin via the `plugin` array.

```json
{
  "instructions": [".opencode/rules/universal-rules.md"],
  "plugin": [
    "./dist/plugin.js"
  ],
  "model": "osiris/claude-opus-4-6",
  "provider": { /* ... */ },
  "permission": {
    "read": "allow",
    "edit": "allow",
    "bash": { "*": "allow" },
    "task": "allow",
    "skill": "allow",
    "glob": "allow",
    "grep": "allow"
  },
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  }
}
```

Key harness-relevant fields:

| Key | Description |
|-----|-------------|
| `plugin` | Array of plugin sources. Must include `"./dist/plugin.js"` (or equivalent path) to load the harness. |
| `model` | Default model ID in `provider/model-name` format. Passed to child delegation sessions. |
| `permission` | OpenCode permission model. The harness supplements these with its own runtime policy; it does not broaden permissions beyond this file. |
| `compaction` | Auto-compaction settings. The harness depends on auto-compaction for long-running delegated sessions. `reserved` controls the context budget reserved during compaction. |

### `hivemind.runtime-policy.json` — Workspace Runtime Policy (Optional)

Located at `.hivemind/state/hivemind.runtime-policy.json`. A project-local JSON object that **narrows** the harness runtime limits without broadening OpenCode-native permission scopes. All fields are optional — missing fields fall back to the `DEFAULT_RUNTIME_POLICY` in `src/lib/runtime-policy.ts`.

```json
{
  "concurrency": {
    "globalLimit": 3,
    "perKey": {
      "research": { "limit": 2, "acquireTimeoutMs": 60000 }
    }
  },
  "budget": {
    "maxToolCallsPerSession": 400,
    "repeatedSignatureThreshold": 16,
    "warningCap": 25,
    "resetOnCompact": true
  },
  "trustedRuntime": {
    "builtinAsyncBackgroundChildSessions": false
  },
  "categoryGate": {
    "denyUnknownCategories": true,
    "readonlyCategories": ["review", "research"],
    "commandCategory": "command"
  },
  "maxDelegationDepth": 3
}
```

**Path:** `.hivemind/state/hivemind.runtime-policy.json` (resolved from the active OpenCode project directory).

Throws `[Harness]`-prefixed errors on invalid JSON or non-object values.

## Required vs Optional Settings

### Required

No environment variables or config files are **required** for the harness to operate. If `opencode.json` is absent or does not reference the harness plugin, the harness simply will not load.

### Optional

All settings listed in the [Environment Variables](#environment-variables) and [Config File Format](#config-file-format) tables are optional. The harness follows a strict "default-first" philosophy: every runtime parameter is initialized from hardcoded defaults in `src/lib/runtime-policy.ts` and `src/lib/delegation-types.ts`, then overridden by `hivemind.runtime-policy.json` at the workspace level, then further overridden per-session via delegation metadata (from trusted continuity/delegation sources only — not arbitrary tool args).

Settings that will cause validation errors if present but invalid:

- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — must be a valid positive integer; non-numeric or zero values are clamped to `3`.
- `hivemind.runtime-policy.json` — must be a valid JSON object; non-object or array values throw `[Harness]`.
- `concurrency.globalLimit` — must be positive.
- `concurrency.perKey[*].limit` — must be positive.
- `budget.maxToolCallsPerSession` — must be positive.
- `budget.repeatedSignatureThreshold` — must be positive.
- `budget.warningCap` — must be positive.

## Defaults

The harness default constants are defined in two source files:

### `src/lib/runtime-policy.ts` — Runtime Policy Defaults

| Setting | Default | Source |
|---------|---------|--------|
| `concurrency.globalLimit` | `3` | `DEFAULT_RUNTIME_POLICY` |
| `budget.maxToolCallsPerSession` | `400` | `DEFAULT_RUNTIME_POLICY` |
| `budget.repeatedSignatureThreshold` | `16` | `DEFAULT_RUNTIME_POLICY` |
| `budget.warningCap` | `25` | `DEFAULT_RUNTIME_POLICY` |
| `budget.resetOnCompact` | `true` | `DEFAULT_RUNTIME_POLICY` |
| `trustedRuntime.builtinAsyncBackgroundChildSessions` | `false` | `DEFAULT_RUNTIME_POLICY` |
| `categoryGate.denyUnknownCategories` | `true` | `src/lib/category-gates.ts` |
| `categoryGate.readonlyCategories` | `["review", "research"]` | `src/lib/category-gates.ts` |
| `categoryGate.commandCategory` | `"command"` | `src/lib/category-gates.ts` |

### `src/lib/delegation-types.ts` — Delegation Constants

| Setting | Default | Description |
|---------|---------|-------------|
| `DEFAULT_SAFETY_CEILING_MS` | `1800000` (30 min) | Maximum runtime for a delegation. Not a deadline — tasks may complete faster. |
| `MAX_DELEGATION_DEPTH` | `3` | Maximum nesting depth of delegation trees. Overridable via `RuntimePolicy.maxDelegationDepth`. |
| `TASK_CLEANUP_DELAY_MS` | `600000` (10 min) | Grace period before in-memory cleanup of terminal delegations. |
| `MAX_DELEGATIONS_BEFORE_PRUNE` | `50` | Threshold before batch pruning of terminal delegations begins. |
| `POLL_INTERVAL_ACTIVE_MS` | `2000` (2 s) | Delegation polling interval when child is actively producing messages. |
| `POLL_INTERVAL_BASE_MS` | `5000` (5 s) | Base polling interval when child is stable for < 30 s. |
| `POLL_INTERVAL_IDLE_MS` | `10000` (10 s) | Polling interval when child is idle for 30 s–5 min. |
| `POLL_INTERVAL_DEEP_IDLE_MS` | `30000` (30 s) | Polling interval when child is deeply idle (> 5 min). |
| `DEFAULT_STALE_TIMEOUT_MS` | `2700000` (45 min) | Activity-based stale timeout. No message change for this duration triggers stale termination. |
| `MIN_STABILITY_TIME_MS` | `10000` (10 s) | Minimum elapsed time since last message change before stability is declared. |
| `STABLE_POLLS_REQUIRED` | `3` | Consecutive stable polls required to confirm completion. |

### `src/plugin.ts` — Plugin Constants

| Setting | Default | Description |
|---------|---------|-------------|
| `WATCH_TIMEOUT_MS` | `1800000` (30 min) | Polling timeout for lifecycle-managed session watches. |

## Per-Environment Overrides

The harness does not ship `.env.development`, `.env.production`, or `.env.test` files. Environment-specific configuration is handled through two mechanisms:

### 1. `NODE_ENV` Detection

When `NODE_ENV` is `"test"`, the SDK session ID helper in `src/lib/session-api.ts` relaxes its prefix-stripping rules. Test suites use `child-` and `parent-` prefixed session IDs for test isolation; these would normally be stripped as SDK-internal prefixes. This override only affects the `getSessionID` sanitizer and has no bearing on runtime policy or concurrency limits.

### 2. Workspace Policy File

The optional `.hivemind/state/hivemind.runtime-policy.json` is the primary mechanism for environment-specific overrides. Different environments (development, CI, staging) can use different policy files checked into their respective configs or generated during environment setup.

### 3. Environment Variable Overrides

For deployment scenarios where file-based config is impractical, the following environment variables provide direct overrides:

- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — override the global concurrency limit at startup.
- `OPENCODE_HARNESS_STATE_DIR` — point state storage to a deployment-specific path.
- `OPENCODE_HARNESS_CONTINUITY_FILE` — isolate continuity data from other deployments sharing a state directory.
