# Comprehensive Analysis (project-alpha)

- Generated: 2026-02-24T22:37:15+0700
- Scan mode: exhaustive

## Configuration Management

- Core configs: `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `tsconfig*.json`
- Environment files: `.env.example`, `.env.local`
- Deployment manifests: `wrangler.jsonc`, `netlify.toml`, `vercel.json`

## Authentication and Security

- Credential + vault abstractions under `src/infrastructure/ai` and `src/lib/agent/providers`.
- Permission and guard logic in filesystem/tool permission modules.
- Security headers configured in server entry and Vite dev middleware.

## Entry Points

- `src/server.ts` (runtime server wrapper)
- `src/router.tsx` + generated `src/routeTree.gen.ts`
- Route shell in `src/routes/__root.tsx`
- API routes in `src/routes/api/*`

## Shared Code

- Shared utility layers are heavily represented in `src/lib`, with additional `src/shared` and `src/utils`.

## Async/Event Architecture

- Event buses under `src/infrastructure/events` and compatibility/legacy wrappers under `src/lib/events`.
- Worker usage includes note embedding worker and service worker registration flows.

## Quality and Testing Signals

- Test files discovered (`src` + `e2e`): 149
- CI workflows enforce governance/typecheck/tests/build before promotion.
