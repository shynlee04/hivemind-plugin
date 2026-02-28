# External Integrations

> Generated: 2026-02-28 | Source: src/ (134 core files, 23 dashboard-v2 files)

## APIs & External Services

**OpenCode SDK (Primary Integration):**
- The plugin's sole external service dependency is the OpenCode platform itself
- SDK Client: `@opencode-ai/plugin` (peer dependency, required)
- SDK Types: `OpencodeClient`, `Project`, `PluginInput` from `@opencode-ai/sdk`
- Access pattern: Singleton stored in `src/lib/sdk-access.ts`, initialized once in `src/hooks/sdk-context.ts` via `initSdkContext()`
- Client capabilities consumed:
  - `client.session.create()` — session spawning (`src/lib/session-split.ts:138`, `src/lib/compaction-engine.ts:388`, `src/hooks/swarm-executor.ts:50`)
  - `client.session.prompt()` — sub-agent prompting (`src/hooks/swarm-executor.ts:73`)
  - `client.tui.showToast()` — UI notifications (`src/hooks/soft-governance.ts:105`)
- BunShell (`$`): Template-tag shell executor for git operations (`src/lib/auto-commit.ts`)
- Server URL: Stored but only actively used by dashboard-v2 (`src/dashboard-v2/src/api.ts`)

**No Other External APIs:**
- No third-party SaaS integrations (no Stripe, Supabase, AWS, etc.)
- No external HTTP calls from core `src/` — only the dashboard-v2 sub-project calls the local OpenCode server
- This is a self-contained governance plugin that operates entirely on the local filesystem

## Data Storage

**Databases:**
- None. All persistence is file-based on the local filesystem.

**Primary Data Store: `.hivemind/` directory tree**
- Path resolver: `src/lib/paths.ts` (530 lines, single source of truth for ALL `.hivemind/` paths)
- Structure version: `2.0.0` (from `src/lib/paths.ts:34`)
- Layout:

```
.hivemind/
├── config.json              # Governance configuration
├── INDEX.md                 # Human-readable index
├── manifest.json            # Root manifest
├── state/                   # Hot state (updated every turn)
│   ├── brain.json           # Session state machine
│   ├── hierarchy.json       # Trajectory → Tactic → Action tree
│   ├── anchors.json         # Immutable decision anchors
│   └── tasks.json           # Graph task nodes
├── memory/                  # Warm state (cross-session)
│   └── mems.json            # Persistent memories
├── sessions/                # Session lifecycle
│   ├── manifest.json
│   ├── active/              # Current session files
│   └── archive/exports/     # Exported session archives
├── plans/                   # Planning artifacts
├── graph/                   # V3.0 relational graph
│   ├── trajectory.json
│   ├── plans.json
│   ├── tasks.json
│   └── mems.json
├── codemap/                 # Code intelligence cache
├── system/                  # Daemon runtime files
│   ├── daemon.pid
│   ├── cmd_queue.jsonl
│   └── processing.jsonl
├── logs/                    # Application logs
└── templates/               # Session templates
```

**Persistence Layer:**
- Atomic writes: `src/lib/persistence.ts` (376 lines) — uses `rename()` for atomic file replacement
- File locking: `src/lib/file-lock.ts` — uses `proper-lockfile` for cross-process safety
- Graph I/O: `src/lib/graph-io.ts` + `src/lib/graph/` (reader, writer, shared, fk-validator)
- Session I/O: `src/lib/fs/session-io.ts` — YAML-based session files
- Planning I/O: `src/lib/fs/planning-ops.ts` + `src/lib/fs/planning-paths.ts`

**File Storage:**
- Local filesystem only. No cloud storage, no S3, no blob stores.

**Caching:**
- Codemap cache: `.hivemind/codemap/` — compressed code intelligence snapshots
- Knowledge commits: `src/lib/code-intel/knowledge-commits.ts` — persists codemap + summary as JSON
- No in-memory cache layer (all state is read from disk each invocation per Rule 6: config persistence)

## Authentication & Identity

**Auth Provider:**
- None. The plugin inherits authentication from the OpenCode platform.
- SDK client is pre-authenticated when passed to the plugin factory in `src/index.ts:80-87`
- No API keys, tokens, or credentials managed by this plugin directly

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service (no Sentry, Datadog, etc.)
- Errors are logged to local `.hivemind/logs/` directory

**Logging:**
- Custom logger: `src/lib/logging.ts`
- Factory: `createLogger(logDir, prefix)` — returns async `Logger` interface
- Noop logger available: `noopLogger` for test/silent contexts
- Log destination: `.hivemind/logs/` directory (file-based)
- No structured logging, no log aggregation, no remote log shipping

**Governance Telemetry:**
- Drift score tracking: `src/lib/inspect-engine.ts`
- Session metrics: turn count, violation count, tool usage — tracked in `brain.json`
- Entity checklist: `src/lib/entity-checklist.ts` — validates required state entities each turn
- All telemetry is local-only (no external reporting)

## CI/CD & Deployment

**Hosting:**
- Published to npm registry as `hivemind-context-governance` (public package)
- `publishConfig.access: "public"` in `package.json`

**CI Pipeline:**
- No CI configuration files detected (no `.github/workflows/`, no `.gitlab-ci.yml`, no `Jenkinsfile`)
- Pre-publish gate: `npm run prepublishOnly` → typecheck + test + build
- Manual branch protection via `scripts/guard-public-branch.sh`

**Branch Policy:**
- `dev-v3`: Development branch (allows `.opencode/`, planning docs, secrets references)
- `master`: Public release branch (stripped of sensitive content)
- Guard script: `scripts/guard-public-branch.sh` (103 lines) — blocks sensitive dev-only content from master

## Git Integration

**Auto-Commit:**
- `src/lib/auto-commit.ts` — generates conventional commit messages (`chore(auto-commit): persist N file changes after TOOL`)
- Uses BunShell (`$`) from SDK for git operations
- Conditional: only commits when `configEnabled` and task is `in_progress`/`active`

**Knowledge Commits:**
- `src/lib/code-intel/knowledge-commits.ts` — commits codemap snapshots to git
- Uses `execSync("git ...")` via `node:child_process` with shell escaping (`shellEscape()`)
- Git operations: `add`, `commit`, `diff --name-only`, `status --porcelain`
- Safety: 10-second timeout on all git commands

**Commit Advisor:**
- `src/lib/commit-advisor.ts` — generates commit message suggestions

## Webhooks & Callbacks

**Incoming:**
- None. The plugin receives events only via OpenCode SDK hooks (not HTTP webhooks).
- Event types handled (from `src/hooks/event-handler.ts`):
  - `session.created`, `session.idle`, `session.compacted`
  - `file.edited`, `session.diff`

**Outgoing:**
- None. No HTTP callbacks or webhook dispatches.

## Environment Configuration

**Required Environment Variables:**
- None required by core plugin. All configuration is in `.hivemind/config.json`.

**Optional Environment Variables:**
| Variable | Used In | Purpose |
|----------|---------|---------|
| `OPENCODE_SERVER_URL` | `src/dashboard-v2/src/api.ts:4` | Dashboard-v2 server URL (default: `http://localhost:4096`) |
| `HIVEMIND_DEBUG_FIRST_TURN` | `src/hooks/messages-transform.ts:392` | Debug flag for first-turn transformation (set to `"1"` to enable) |
| `XDG_CONFIG_HOME` | `src/cli/sync-assets.ts:145` | Linux config directory for OpenCode asset discovery |
| `APPDATA` | `src/cli/sync-assets.ts:141` | Windows config directory for OpenCode asset discovery |

**Secrets Location:**
- No secrets managed by this plugin. Authentication is delegated to the OpenCode platform.
- `.env` files are NOT read by the plugin (existence noted at `src/lib/project-snapshot.ts:121` and `src/hooks/session-lifecycle-helpers.ts:120` only as filenames for project scanning, never read).

## Internal Event System

**In-Process Event Bus:**
- `src/lib/event-bus.ts` — Node.js `EventEmitter`-based singleton
- Schema-validated events: `src/schemas/events.ts` (Zod schemas)
- Event types: `file:created`, `file:modified`, `file:deleted`, `artifact:spawned`, etc.
- Max listeners per event: 50

**File System Watcher:**
- `src/lib/watcher.ts` — native `fs.watch` with debouncing
- Watches project directory for file changes
- Emits `ArtifactEvent` objects to the event bus
- Wired in `src/index.ts:116-122`: `fileWatcher.on("event", (e) => eventBus.emitEvent(e))`

## Dashboard-v2 HTTP Integration

**OpenCode Server Client (dashboard-v2 only):**
- `src/dashboard-v2/src/api.ts` — `OpenCodeApiClient` class
- Base URL: `process.env.OPENCODE_SERVER_URL` || `http://localhost:4096`
- Uses native `fetch()` with 3-second timeout via `AbortController`
- Endpoints consumed: health, agents, sessions, commands, events, todos
- This is isolated to the dashboard sub-project — core plugin never makes HTTP calls

## Integration Topology

```
┌─────────────────────────────────────┐
│         OpenCode Platform           │
│  (provides client, shell, project)  │
└───────────────┬─────────────────────┘
                │ Plugin Factory
                ▼
┌─────────────────────────────────────┐
│      HiveMind Plugin (src/)         │
│                                     │
│  hooks/ ←→ OpenCode SDK hooks       │
│  tools/ ←→ OpenCode SDK tool()      │
│  lib/   ←→ Local filesystem only    │
│                                     │
│  ┌──────────┐  ┌──────────────┐     │
│  │ EventBus │  │ File Watcher │     │
│  └────┬─────┘  └──────┬───────┘     │
│       └───────┬────────┘            │
│               ▼                     │
│        .hivemind/ (disk)            │
└─────────────────────────────────────┘
                │
                │ (optional, dashboard only)
                ▼
┌─────────────────────────────────────┐
│   dashboard-v2 (Bun + React/Ink)   │
│   → HTTP fetch to localhost:4096    │
└─────────────────────────────────────┘
```

## Key Observations

1. **Zero External Dependencies:** The plugin makes zero outbound HTTP calls. All integrations are local: filesystem I/O, git CLI, and the OpenCode SDK singleton. This makes the plugin fully offline-capable.

2. **SDK Is the Only Integration Point:** The OpenCode SDK (`@opencode-ai/plugin`) is the sole external interface. The plugin receives context at init and communicates back through hooks and tool responses.

3. **Architecture Boundary Is Enforced:** `src/lib/` NEVER imports `@opencode-ai/*` — verified by `scripts/check-sdk-boundary.sh` which runs as part of `npm test`. Only `src/tools/` and `src/hooks/` touch the SDK.

4. **Git as Infrastructure:** Git operations are performed via `execSync` with shell escaping (not a git library). This is a lightweight approach but creates a hard dependency on `git` being available in `PATH`.

5. **No Cloud Services:** No databases, caches, queues, or cloud APIs. The entire state management layer is flat-file JSON/YAML on the local filesystem with atomic writes and file locking.

---

*Integration audit: 2026-02-28*
