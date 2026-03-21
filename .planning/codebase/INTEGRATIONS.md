# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**OpenCode Platform:**
- OpenCode Plugin SDK - Hooks (`event`, `chat.message`, `permission.ask`, `tool.execute.before/after`, `command.execute.before`, `shell.env`, `messages.transform`, `session.compacting`)
- OpenCode SDK - Client/Server runtime (`createOpencode`, `createOpencodeClient`)
- Server URL: configurable via `OPENCODE_SERVER_URL` env var (default: `http://127.0.0.1:4096`)
- Client connection: SSE via `client.event.subscribe()`

## Data Storage

**Local Filesystem Only:**
- No external databases detected
- State stored in `.hivemind/` directory
- Session state: `.hivemind/session.json`
- Trajectory state: `.hivemind/trajectory/{id}.json`
- Workflow state: `.hivemind/workflow/{id}.json`
- Profile/settings: `.opencode/` user-local projection

**File Locking:**
- `proper-lockfile` ^4.1.2 - Concurrent access protection

## Authentication & Identity

**OpenCode Session Identity:**
- Session IDs managed by OpenCode SDK
- `context.sessionID` from `ToolContext`
- Agent name resolution via `context.agent`

**Runtime Attachment:**
- Managed via `HIVEMIND_RUNTIME_ATTACHED` env var
- Attachment mode tracked in snapshot

## Monitoring & Observability

**Logging:**
- `client.app.log()` - Structured logging (SDK)
- `console.log/error` - CLI output
- `shared/logging.ts` - Custom logging wrapper with `HIVEMIND_DEBUG` flag

**Runtime Status:**
- `hivemind_runtime_status` tool - Inspection of active runtime
- `hivemind_runtime_command` tool - Command execution against runtime

## CI/CD & Deployment

**GitHub Actions:**
- CI workflow: `.github/workflows/ci.yml`
- Build matrix: Node.js 18.x, 20.x
- Gates: TypeScript check → Lint boundary → Tests → Build
- Publish workflow: `.github/workflows/publish.yml`

**npm Package:**
- Package: `hivemind-context-governance`
- Registry: npm public (`publishConfig.access: public`)
- Binaries: `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`

## Environment Configuration

**CLI Flags:**
- `--project-root <path>` - Project directory
- `--server-url <url>` - OpenCode server URL
- `--name`, `--lang`, `--artifact-lang` - User preferences
- `--governance`, `--automation`, `--expert-level` - Runtime settings
- `--preset guided-onboarding` - Non-interactive preset
- `--json` - JSON output format

**Runtime Environment Variables:**
- `HIVEMIND_DEBUG` - Enable debug logging (from `process.env.HIVEMIND_DEBUG`)
- `OPENCODE_SERVER_URL` - OpenCode server endpoint (default: `http://127.0.0.1:4096`)
- `HIVEMIND_RUNTIME_ATTACHED` - Set by `shell.env` hook
- `HIVEMIND_ATTACHMENT_MODE` - Current attachment mode
- `HIVEMIND_ACTIVE_TRAJECTORY` - Active trajectory ID
- `HIVEMIND_ACTIVE_WORKFLOW` - Active workflow ID

## Webhooks & Callbacks

**OpenCode Hooks (Incoming):**
| Hook | Purpose |
|------|---------|
| `event` | All lifecycle events |
| `chat.message` | Message interception |
| `permission.ask` | Permission requests |
| `tool.execute.before` | Pre-tool validation |
| `tool.execute.after` | Post-tool observation |
| `command.execute.before` | Pre-command context |
| `shell.env` | Environment injection |
| `messages.transform` | Message history transformation |
| `session.compacting` | Compaction customization |

**CLI Commands (Outgoing):**
| Command | Handler |
|---------|---------|
| `hm-init` | Bootstrap runtime entry surfaces |
| `hm-doctor` | Repair runtime entry and recovery |
| `hm-settings` | Persist runtime attachment defaults |
| `hm-harness` | Validate runtime attachment health |

## No External Database/Auth Providers

This codebase does NOT integrate with:
- No MongoDB, PostgreSQL, Redis, or other databases
- No OAuth providers (GitHub, Google, etc.)
- No external auth services
- No cloud storage (AWS S3, etc.)
- No messaging/notification services (Slack, Discord, SendGrid)

**Data is stored entirely in local filesystem** under `.hivemind/` and `.opencode/` directories.

---

*Integration audit: 2026-03-21*
