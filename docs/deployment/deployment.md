<!-- generated-by: gsd-doc-writer -->

# Deployment

## Deployment Targets

`opencode-harness` is an npm package — deployment means publishing to the npm registry and consuming it in an OpenCode project.

| Target | Mechanism | Config |
|--------|-----------|--------|
| **npm registry** | `npm publish` | `package.json` `files` field: `["dist", "bin"]` |
| **OpenCode project** | `npm install opencode-harness` | Plugin entry in `.opencode/plugins/` |
| **Container / platform** | Not applicable | No `Dockerfile`, `docker-compose.yml`, `vercel.json`, `netlify.toml`, `fly.toml`, or `railway.json` present |

The harness is a library and runtime plugin, not a standalone service. It runs **within** the OpenCode process — there is no server to deploy, no database to provision, and no infrastructure to manage.

### Published Package Surface

The `package.json` `files` field limits published content to:

| Directory / File | Purpose |
|------------------|---------|
| `dist/` | Compiled TypeScript output (`.js`, `.d.ts`, `.map`) |
| `bin/` | CLI entry (`hivemind-tools.cjs`) |

Source files (`src/`), tests (`tests/`), and development configs are excluded from the published tarball.

### Package Entrypoints

| Import path | Exported file | Consumer |
|-------------|---------------|----------|
| `opencode-harness` | `dist/index.js` | Public API re-exports |
| `opencode-harness/plugin` | `dist/plugin.js` | OpenCode plugin loader |
| `opencode-harness/cli` | `dist/cli/index.js` | CLI dispatch |

## Build Pipeline

### Local Build

The build produces the `dist/` directory from TypeScript sources:

```bash
npm run build        # Clean + compile TypeScript → dist/
npm run typecheck    # Type-check without emitting
npm test             # Run all tests (vitest)
npm run test:coverage # Coverage report (src/**/*.ts)
```

The `prepack` lifecycle hook defined in `package.json` runs `npm run build` automatically before `npm pack` or `npm publish`:

```json
"scripts": {
  "build": "npm run clean && tsc",
  "prepack": "npm run build"
}
```

**Build requirements:**
- Node.js `>=20.0.0`
- TypeScript `^5.0.0` (devDependency)
- Build target: ES2022, NodeNext module resolution, strict mode

### Publishing

Publishing to npm is a manual process:

```bash
# 1. Build and test
npm install
npm run typecheck
npm test

# 2. Publish (prepack runs build automatically)
npm publish
```

### CI/CD

No automated CI/CD pipeline exists for testing, building, or publishing the harness. The GitHub workflows in this repository serve different purposes:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `opencode.yml` | `/oc` or `/opencode` comment on issues/PRs | Run OpenCode agent action |
| `qwen-dispatch.yml` | `@qwen-code` comment or issue open/reopen | Route Qwen Code requests to triage/invoke |
| `qwen-triage.yml` | Reusable (called by dispatch) | Qwen Code issue triage |
| `qwen-invoke.yml` | Reusable (called by dispatch) | Qwen Code CLI invocation |
| `qwen-scheduled-triage.yml` | Cron schedule | Scheduled issue triage |

These workflows are community-engagement and QA automation, not build/deploy pipelines. No workflow contains `npm test`, `npm run build`, or `npm publish` steps.

<!-- VERIFY: npm publish workflow may exist as a separate repository action not captured in this codebase. -->

## Environment Setup

### For Publishing (Maintainers)

No environment variables are required to build or publish. The publishing process requires standard npm authentication:

- An npm account with publish access to the `opencode-harness` package
- `npm login` or a `NPM_TOKEN` configured in the publishing environment

<!-- VERIFY: The npm publish token and npm registry URL are managed outside the repository. -->

### For Consumers (OpenCode Projects)

After installing `opencode-harness`, the harness is loaded by OpenCode via a plugin file. See [README.md](../../README.md) and [Configuration](../configuration/settings.md) for full details.

Minimum setup:

1. Install: `npm install opencode-harness`
2. Build: `npm run build`
3. Register in `.opencode/plugins/harness.ts`:
   ```ts
   export { HarnessControlPlane as default } from "opencode-harness/plugin"
   ```

All harness environment variables are **optional** — the system operates with sensible defaults. See [Configuration — Environment Variables](../configuration/settings.md#environment-variables) for the full list.

**Peer dependency:** `@opencode-ai/plugin` >= 1.14.28 must be installed in the consumer project.

**Optional dependency:** `bun-pty` >= 0.4.8 enables PTY-backed background command sessions. The harness gracefully falls back to headless `node:child_process` when `bun-pty` is absent.

## Rollback Procedure

Since deployment means publishing to the npm registry, rolling back a release follows standard npm practices:

1. **Identify the previous stable version** from the npm registry:
   ```bash
   npm view opencode-harness versions
   ```

2. **Republish the previous version** if the current release must be fully reverted:
   ```bash
   npm publish opencode-harness@<previous-version>
   ```
   Note: npm typically does not allow republishing the exact same version; this requires a version bump. For critical rollbacks, publish the previous code with an incremented patch version.

3. **Deprecate the broken version** (optional but recommended):
   ```bash
   npm deprecate opencode-harness@<broken-version> "Rolled back due to ..."
   ```

4. **For consumer projects**: Downgrade the installed version:
   ```bash
   npm install opencode-harness@<previous-version>
   ```

No deployment platform rollback is needed — there are no servers, containers, or cloud infrastructure to revert.

## Monitoring

The harness does not include third-party monitoring integrations. No Sentry (`@sentry/*`), Datadog (`dd-trace`), New Relic (`newrelic`), or OpenTelemetry (`@opentelemetry/*`) packages are present in `package.json` dependencies.

### Built-in Diagnostics

The harness provides internal observability through its own tool surface:

| Tool | Purpose |
|------|---------|
| `hivemind-sdk-supervisor` | Inspect SDK wrapper health, heartbeat, bounded diagnostics, and readiness |
| `hivemind-pressure` | Classify runtime pressure, detect pure control-plane outcomes, inspect tool authority |
| `hivemind-trajectory` | Inspect and update the execution trajectory ledger |
| `session-journal-export` | Export bounded Session Journal and Execution Lineage summaries as JSON or Markdown |

Runtime state is persisted to `.hivemind/state/` and can be inspected directly:

| File | What to monitor |
|------|-----------------|
| `session-continuity.json` | Session lifecycle state, delegation records, budget usage |
| `checkpoints.json` | Compaction checkpoints for long-running sessions |

### Logging

The harness uses console logging with a `[Harness]` prefix for all thrown errors. For runtime-embedded monitoring, enable observability in the consumer's OpenCode environment or integrate the `.hivemind/state/` persistence files with external monitoring tools.

<!-- VERIFY: External monitoring dashboard URLs, alert webhook endpoints, and production-specific logging configurations are managed by individual consumer deployments, not by this package. -->
