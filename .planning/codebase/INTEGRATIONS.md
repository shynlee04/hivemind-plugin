# External Integrations

**Analysis Date:** 2024-05-24

## APIs & External Services

**OpenCode Platform:**
- OpenCode AI Core - Provides runtime context, logging, and state management for the plugin.
  - SDK/Client: `@opencode-ai/sdk`, `@opencode-ai/plugin`
  - Auth: Handled natively by the OpenCode AI host environment.

## Data Storage

**Databases:**
- None detected.

**File Storage:**
- Local filesystem only - Primarily manages local project `.hivemind/` and `.planning/` files. Uses `proper-lockfile` to ensure safe concurrent operations on local files.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Custom - Handled by the OpenCode AI host environment context. No explicit authentication implementations exist within the plugin codebase.

## Monitoring & Observability

**Error Tracking:**
- None detected. Relies on OpenCode AI platform logging.

**Logs:**
- Standard console logging and OpenCode AI plugin context logging (`sdk.logger`).

## CI/CD & Deployment

**Hosting:**
- npm Registry (published as `hivemind-context-governance`)

**CI Pipeline:**
- GitHub Actions - Automated testing, boundary checks, and publishing.
  - Configurations: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/dev-v3.yml`

## Environment Configuration

**Required env vars:**
- None explicitly required by the plugin itself.

**Secrets location:**
- Not applicable. No internal secrets required.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2024-05-24*
