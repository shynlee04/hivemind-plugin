# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**None** - HiveMind is a self-contained plugin with no external API dependencies.

All functionality runs inside the OpenCode plugin host process.

## Data Storage

**Databases:**
- None - Uses filesystem-based JSON storage
- Location: `.hivemind/` directory in project root
- Files: `brain.json`, `hierarchy.json`, `mems.json`, `anchors.json`

**File Storage:**
- Local filesystem only
- Path: `.hivemind/` directory
- Uses atomic writes with file locking (`proper-lockfile`)

**Caching:**
- None - All state persisted to disk
- In-memory caching only during hook execution

## Authentication & Identity

**Auth Provider:**
- None - Runs inside OpenCode plugin context
- Inherits authentication from OpenCode host

## Monitoring & Observability

**Error Tracking:**
- None - Errors logged to `.hivemind/logs/`
- Hook errors caught and logged, never break session

**Logs:**
- Location: `.hivemind/logs/`
- Format: Structured text logs
- Logger: `src/lib/logging.ts`

## CI/CD & Deployment

**Hosting:**
- OpenCode plugin host (local or cloud)
- npm package distribution

**CI Pipeline:**
- npm scripts for validation:
  - `npm run typecheck` - TypeScript validation
  - `npm run lint:boundary` - SDK boundary check
  - `npm test` - Run all tests
  - `npm run guard:public` - Pre-master push guard

**Deployment:**
- `npm publish` for public release
- `npm run prepublishOnly` runs full validation

## Environment Configuration

**Required env vars:**
- None - Configuration via `.hivemind/config.json`

**Secrets location:**
- None required - No external API keys

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Plugin Host Integration

**OpenCode SDK:**
- Package: `@opencode-ai/plugin`
- Version: ^1.1.53 (devDependency, required peer)
- Used for:
  - `tool()` - Tool definition helper
  - `hook()` - Hook registration
  - SDK context via `initSdkContext()`

**Plugin Lifecycle:**
1. OpenCode loads plugin
2. `src/index.ts` exports tools and hooks
3. Hooks register for events (chat system transform)
4. Tools become available to agent

## Optional Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ink` | >=5.0.0 | Dashboard TUI (optional) |
| `react` | >=18.0.0 | Dashboard UI (optional) |

These are only needed if using the dashboard feature.

## File System Integration

**Watched Directories:**
- Project root (via `fs.watch` in `watcher.ts`)
- Excludes: node_modules, .git, .hivemind, dist, build

**Lock Files:**
- Uses `proper-lockfile` for atomic writes
- Prevents race conditions in concurrent access

---

*Integration audit: 2026-02-18*
