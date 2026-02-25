# Via-gent Architecture

- Generated: 2026-02-24T22:37:15+0700
- Architecture Pattern: Layered modular monolith with plugin-oriented presentation and domain/infrastructure separation

## System Shape

The application is organized as a single deployable web app with layered boundaries:

- Presentation: `src/presentation`, `src/routes`, `src/plugins`, `src/modules`
- Domain: `src/domain` (schemas, entities, services, interfaces)
- Infrastructure: `src/infrastructure` (persistence, filesystem, sync, AI adapters, events)
- Legacy/utility zones: `src/lib`, `src/utils`, `src/shared`

## Request and Runtime Flow

1. HTTP request enters TanStack Start server entry (`src/server.ts`) and security headers are injected.
2. Route matching is handled through generated route tree (`src/routeTree.gen.ts`).
3. API routes under `src/routes/api/*` execute server handlers for chat/provider workflows.
4. UI routes mount plugin-aware layouts and state providers (workspace/project context + Zustand stores).

## Core Architectural Decisions

- TanStack Router file-based routing for page and API paths.
- Zustand for app/store state, often persisted via Dexie-backed storage adapters.
- Dexie as primary browser persistence with explicit migration registration.
- Project-centric model in domain schemas (`projectId` anchors related entities).
- Multi-provider AI gateway abstraction in infrastructure/domain services.

## Data Architecture

- Primary persisted entities live in Dexie tables (projects, threads, notes, tool executions, snapshots, plugins, study data, etc.).
- Canonical domain schemas use Zod in `src/domain/schemas/*`.
- Sync/event services bridge file system operations, caches, and UI state updates.

## API Design

API endpoints are route-file handlers in `src/routes/api`:

- `/api/chat`
- `/api/providers`
- `/api/providers/$id`
- `/api/providers/$id/test`
- `/api/providers/$id/execute`
- `/api/provider-test` (phase-gated/disabled response)

See [API Contracts](./api-contracts.md) for details.

## Component and UI Architecture

- Main UI component surface is in `src/presentation/components`.
- Plugin-specific behavior is segmented in `src/plugins/*` and composed by layouts/modules.
- Cross-cutting UI state and coordination are mediated through context providers and typed store selectors.

## Testing Strategy

- Unit/integration tests in `src/**/*.{test,spec}.{ts,tsx}` via Vitest.
- End-to-end journeys in `e2e/journeys` via Playwright.
- CI runs governance + typecheck + tests + build pipelines.

## Deployment Architecture

- Cloudflare Workers target with custom server entry.
- Optional Vercel adapter (`api/index.js`) and Netlify integration via Vite plugin.
- CI/CD workflows in `.github/workflows/*`.
