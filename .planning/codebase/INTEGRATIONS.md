# External Integrations

**Analysis Date:** 2026-03-27

## OpenCode Platform (Primary)

**Plugin System:**
- HiveMind is an OpenCode plugin — the entire project IS the integration
- SDK: `@opencode-ai/plugin` for plugin definition; `@opencode-ai/sdk` for client access
- Plugin entry: `src/plugin/opencode-plugin.ts` — registers 12 tools and 14 hooks

**Tools Registered:**
| Tool | Location |
|------|----------|
| `hivemind_runtime_status` | `src/tools/runtime/tools.ts` |
| `hivemind_runtime_command` | `src/tools/runtime/tools.ts` |
| `hivemind_doc` | `src/tools/doc/tools.ts` |
| `hivemind_task` | `src/tools/task/tools.ts` |
| `hivemind_trajectory` | `src/tools/trajectory/tools.ts` |
| `hivemind_handoff` | `src/tools/handoff/tools.ts` |
| `hivemind_journal` | `src/tools/hivemind-journal.ts` |
| `hivemind_hm_init` | `src/tools/hivefiver-init/tools.ts` |
| `hivemind_hm_doctor` | `src/tools/hivefiver-doctor/tools.ts` |
| `hivemind_hm_setting` | `src/tools/hivefiver-setting/tools.ts` |
| `hivemind_agent_work_create_contract` | `src/features/agent-work-contract/tools/create-contract-tool.ts` |
| `hivemind_agent_work_export_contract` | `src/features/agent-work-contract/tools/export-contract-tool.ts` |

**Hooks Wired (14 active):**
| Hook | Purpose |
|------|---------|
| `event` | All OpenCode lifecycle events |
| `chat.message` | Turn boundary tracking, snapshot reset |
| `permission.ask` | Auto-allow managed tools, mutation gating |
| `tool.execute.before` | Trajectory pre-event recording |
| `tool.execute.after` | Trajectory post-event recording |
| `shell.env` | Inject `HIVEMIND_RUNTIME_ATTACHED`, trajectory/workflow env vars |
| `command.execute.before` | Slash command context injection |
| `experimental.text.complete` | Session journal writing, diagnostic logging |
| `experimental.chat.messages.transform` | NL-first dispatch, turn snapshot |
| `experimental.chat.system.transform` | System prompt transformation |
| `experimental.session.compacting` | Compaction context injection |
| `tool.definition` | (Available, not currently wired) |
| `config` | (Available, not currently wired) |
| `auth` | (Available, not currently wired) |

**SDK Client Surfaces Used:**
- `client.tui.showToast()` — Governance toasts via `src/hooks/soft-governance.ts`
- `client.session.*` — Session management (via SDK context in `src/hooks/sdk-context.ts`)
- `createOpencode()` / `createOpencodeClient()` — Runtime lifecycle in `src/control-plane/sdk-runtime.ts`

## Data Storage

**Databases:**
- None. All persistence is filesystem-based JSON files.

**File-Based State (`.hivemind/` directory):**
- Runtime state: `.hivemind/state/` — tasks.json, trajectory-ledger.json
- Session state: `.hivemind/sessions/` — per-session inspection exports
- Config: `.hivemind/config/` — runtime-attachment.json
- Session journal: `.hivemind/session-inspection/` — assistant output, diagnostics
- Project planning: `.hivemind/project/planning/`
- Error logs: `.hivemind/error-log/`

**Path Authority:**
- All paths resolved via `getEffectivePaths()` in `src/shared/paths.ts`
- Never hardcode `.hivemind/` paths — use the canonical path builders

**File Locking:**
- `proper-lockfile` used in `src/features/agent-work-contract/engine/contract-store.crud.ts` for concurrent-safe contract writes

**Document Intelligence Cache:**
- Markdown files parsed via `remark` pipeline in `src/intelligence/doc/formats/md.ts`
- Document surfaces routed via `src/intelligence/doc/doc-surface-router.ts`

## Authentication & Identity

**Auth Provider:**
- OpenCode handles authentication natively
- HiveMind uses the `auth` plugin hook (available but not currently wired)
- User profile managed through intake records (`src/shared/intake-record.ts`)

**Profile Storage:**
- Runtime attachment settings: `.hivemind/config/runtime-attachment.json`
- User preferences (name, language, governance mode): persisted via `hm-settings` command
- Bootstrap profiles: `src/shared/bootstrap-profile.ts`

**Config Groups:**
- `src/shared/config-groups.ts` — language, expertise, governance, operation-mode

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service
- Diagnostic logs: `src/sdk-supervisor/diagnostic-log.ts` writes to `.hivemind/error-log/`
- Console.error used for critical failures (catch blocks in `src/plugin/opencode-plugin.ts`)

**Logging:**
- `src/shared/logging.ts` — Augments with `client.app.log()` when SDK client available
- Session journal: `src/features/event-tracker/` writes structured events to filesystem
- `hivemind_journal` tool writes `assistant_output`, `user_message`, `tool_call`, `compaction`, `trajectory`, `diagnostic` events to `events.md` and `diagnostics.log`

**Governance Telemetry:**
- Toast notifications via `client.tui.showToast()` with category-based throttling (5s cooldown)
- Tool execution events recorded for trajectory tracking

## CI/CD & Deployment

**Hosting (npm):**
- Package: `hivemind-context-governance` on npm
- Access: public
- Publish trigger: push to `master` with version bump
- Publish workflow: `.github/workflows/publish.yml`

**CI Pipelines (3 workflows):**
| Workflow | Trigger | Node | Steps |
|----------|---------|------|-------|
| `.github/workflows/ci.yml` | push/PR to `master` | 18.x, 20.x | Guard paths, typecheck, lint:boundary, test, build |
| `.github/workflows/dev-v3.yml` | push/PR to `dev-v3` | 20.x | Same steps as CI, preview publish commented out |
| `.github/workflows/publish.yml` | push to `master`, workflow_dispatch | 22 | Version check, typecheck, test, build, publish, GitHub release |

**CI Secrets:**
- `NPM_TOKEN` — npm publish authentication
- `GITHUB_TOKEN` — GitHub release creation

**Boundary Guarding:**
- `scripts/guard-public-branch.sh` prevents dev-only paths from reaching `master`
- All CI runs include `npm run lint:boundary` (12 boundary-check scripts)

## Environment Configuration

**Required env vars:**
- `MINIMAX_API_KEY` — Referenced in `opencode.json` for MiniMax provider
- No other required env vars for the plugin itself (filesystem-only state)

**OpenCode Configuration:**
- `opencode.json` at project root configures:
  - Default model: `minimax-coding-plan/MiniMax-M2.7`
  - Plugin registration: `.opencode/plugins/hivemind-context-governance.ts`
  - Provider config: MiniMax (env-var API key), OpenAI (model limits)

**Secrets location:**
- `.env` / `.env.local` files (gitignored)
- GitHub Actions secrets (`NPM_TOKEN`, `GITHUB_TOKEN`)

## Webhooks & Callbacks

**Incoming:**
- None. This is a local plugin with no HTTP server.

**Outgoing:**
- None. No external HTTP calls from the plugin.
- All communication happens through the OpenCode SDK client/server boundary.

## Cross-Session & Agent Integrations

**Agent Registry:**
- `src/shared/opencode-agent-registry.ts` — Reads agent definitions from YAML/Markdown
- `src/schema-kernel/default-agent-templates.ts` — Canonical agent templates
- Agents defined in `agents/*.deprecated.md` — Projected to `.opencode/agents/` at runtime

**Skill System:**
- `src/shared/skill-injection-loader.ts` — Loads SKILL.md files for session context injection
- `src/shared/tiered-injection.ts` — Tiered skill loading based on purpose class
- `src/plugin/skill-exposure-map.ts` — Maps skills to default agent
- Skills loaded from `.opencode/skills/` at runtime

**Delegation:**
- `src/delegation/delegation-store.ts` — File-based delegation packet storage
- `src/delegation/delegation-packet.ts` — Handoff/delegation data contracts
- `src/delegation/delegation-record.schema.ts` — Zod-validated delegation records

**Contract System:**
- `src/features/agent-work-contract/` — Agent work contract create/export tools
- Contract store with file locking for concurrent safety

---

*Integration audit: 2026-03-27*
