# External Integrations

**Analysis Date:** 2026-05-26

## Overview

Hivemind is a **runtime composition engine** for the OpenCode platform. It does not integrate with traditional web services, databases, or external APIs in the conventional sense. Instead, it provides an **agent orchestration framework** that communicates primarily through:

1. **OpenCode SDK** — Plugin SDK for tool/hook/agent operations
2. **Model Context Protocol (MCP)** — Standard protocol for AI context sharing
3. **AI SDK** — LLM provider integration for AI capabilities
4. **File System** — JSON/YAML/Markdown persistence for state and artifacts

This is a **library/plugin** architecture designed to work within the OpenCode environment, not a standalone web service.

## Databases

### No Traditional Database

Hivemind does **not** use traditional databases (SQL, NoSQL, document stores). Instead, it uses **file-based persistence**:

**State Storage:**
- `.hivemind/state/` — JSON file-based state management
  - `session-continuity.json` — Session persistence and recovery
  - `delegations.json` — Delegation records
  - `task-status.json` — Task state tracking

**Artifacts:**
- `.hivemind/journal/` — Session journals (append-only event timeline)
- `.hivemind/lineage/` — Execution lineage tracking
- `.hivemind/artifacts/` — Phase artifacts and outputs
- `.planning/` — Planning and governance artifacts (Markdown files)

**Data Format:**
- JSON — Primary format for state and delegation records
- Markdown — Documentation and planning artifacts
- YAML — Configuration files

## External APIs

### SDK Integrations (Primary Integration Points)

#### OpenCode SDK (@opencode-ai/sdk)
- **Purpose:** Core plugin SDK for interacting with OpenCode runtime
- **Usage:** Tool definitions, hook registration, agent dispatch
- **Documentation:** https://github.com/opencode-ai/plugin
- **Files:** `src/shared/session-api.ts`, `src/tools/**/*.ts`

#### Model Context Protocol (MCP) SDK (@modelcontextprotocol/sdk)
- **Purpose:** Standard protocol for AI model context sharing and tool registration
- **Usage:** MCP server/client communication, tool discovery
- **Documentation:** https://modelcontextprotocol.io
- **Files:** `src/tools/hivemind/**/*.ts`

#### AI SDK (@ai-sdk/openai-compatible)
- **Purpose:** AI provider integration for LLM interactions
- **Usage:** LLM inference via OpenAI-compatible endpoints
- **Documentation:** https://sdk.vercel.ai/providers/ai-sdk-providers
- **Files:** `src/features/**/*.ts` (AI-related features)

### Web APIs (None)

Hivemind does **not** make HTTP requests to external web APIs for:
- Data fetching
- Authentication
- Webhook subscriptions
- CDN content delivery

All persistent state is managed locally via file system.

## Authentication & Identity

### No External Auth Provider

Hivemind does **not** implement traditional authentication providers (OAuth, JWT, API keys for external services).

**Security Model:**
- **Plugin-based** — Runs within OpenCode environment with inherited permissions
- **File-based secrets** — Environment variables in `.env` (not documented here per security policy)
- **Local state** — No remote auth state management

**Environment Variables (Present):**
- `.env` file exists with environment configuration
- **Contents not exposed** — Per security policy, secrets files are never quoted

## Webhooks & Event Sources

### No Webhook System

Hivemind does **not** implement webhook receivers or event subscription systems.

**Event-Driven Pattern:**
- **Internal events** — Session journal captures all runtime events (append-only)
- **Tool hooks** — OpenCode hooks provide lifecycle events
- **No external event sources** — All events are internal to the OpenCode environment

## File Storage

### Local File System Only

Hivemind uses **only** the local file system for storage:

**Primary Storage Locations:**

| Location | Purpose | Committed |
|----------|---------|-----------|
| `.hivemind/state/` | Runtime state (JSON) | No (gitignored) |
| `.hivemind/journal/` | Session journals (Markdown) | No (gitignored) |
| `.hivemind/artifacts/` | Phase artifacts | No (gitignored) |
| `.hivemind/planning/` | Planning documents | No (gitignored) |
| `.planning/` | Planning artifacts | Yes (committed) |
| `src/` | Source code | Yes (committed) |
| `dist/` | Build output | No (gitignored) |
| `node_modules/` | Dependencies | No (gitignored) |

**File Types:**
- `.json` — State, configuration, delegation records
- `.md` — Session journals, planning documents, artifacts
- `.yaml` — Configuration schemas
- `.ts` — TypeScript source files

## Monitoring & Observability

### No External Monitoring Services

Hivemind does **not** integrate with external monitoring services:

**No Integration With:**
- Sentry — Error tracking
- Datadog — Monitoring
- New Relic — APM
- Prometheus — Metrics
- Grafana — Dashboards

**Internal Observability:**

| Component | Location | Purpose |
|-----------|----------|---------|
| Session Tracker | `.hivemind/session-tracker/` | Real-time session event tracking |
| Journal | `.hivemind/journal/` | Append-only event timeline |
| Lineage | `.hivemind/lineage/` | Execution lineage and provenance |
| Logs | `.hivemind/logs/` | Runtime logs |

**Observability Approach:**
- **File-based persistence** — All observability data written to `.hivemind/`
- **Append-only journal** — Event timeline for session recovery
- **No remote shipping** — All data stays local unless manually exported

## CI/CD & Deployment

### No CI/CD Integration

Hivemind does **not** integrate with CI/CD platforms:
- GitHub Actions — No workflow files
- GitLab CI — No .gitlab-ci.yml
- CircleCI — No config files

**Build Pipeline:**
```bash
npm run build          # Clean + compile TypeScript
npm run typecheck      # Type-checking
npm test              # Run tests
npm run test:coverage # Coverage report
```

**Package Distribution:**
- `npm publish` — Publish to npm registry
- GitHub repository: https://github.com/shynlee04/hivemind-plugin

## Environment Configuration

### Required Environment Variables

Based on `package.json` and `.env` presence:

**Critical Variables (Not Listed):**
- Environment-specific configuration
- Authentication tokens (if any)
- API keys for external services (none detected)

**Location:**
- `.env` file at project root
- **Contents not documented** — Per security policy

### Secrets Management

**No secrets management integration:**
- No AWS Secrets Manager
- No Azure Key Vault
- No HashiCorp Vault
- No 1Password integration

**Secrets Approach:**
- Local `.env` file
- Environment variables in shell
- **Never committed** to git

## Webhooks & Callbacks

### No Webhook Endpoints

Hivemind does **not** expose webhook endpoints:
- No incoming webhooks
- No outgoing webhooks
- No event subscription system

**Internal Events Only:**
- Session lifecycle events
- Delegation completion events
- Tool execution events
- All captured in `.hivemind/journal/`

## External Service Summary

| Category | Integration | Status |
|----------|-------------|--------|
| Database | None | N/A |
| External API | OpenCode SDK | Active |
| External API | MCP SDK | Active |
| External API | AI SDK | Active |
| Auth Provider | None | N/A |
| Webhooks | None | N/A |
| File Storage | Local filesystem only | Active |
| Monitoring | None | N/A |
| CI/CD | None | N/A |

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenCode Runtime                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   User Input    │  │  Tool Execution │  │   Session   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hivemind Plugin                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Tools         │  │   Hooks         │  │    Agents   │  │
│  │   (src/tools/)  │  │   (src/hooks/)  │  │   (src/)    │  │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘  │
└───────────┼────────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   @opencode-ai  │   │   @modelcontext│   │   File System    │
│   /plugin       │   │   /sdk         │   │   (.hivemind/)  │
│                 │   │                 │   │                 │
│   - tool()      │   │   - MCP tools   │   │   - JSON state  │
│   - hook()      │   │   - context     │   │   - Markdown    │
│   - agent()     │   │   - events      │   │   - YAML config │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

*Integration audit: 2026-05-26*
