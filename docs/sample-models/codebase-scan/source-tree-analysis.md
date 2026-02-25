# Source Tree Analysis

- Generated: 2026-02-24T22:37:15+0700
- Scan scope: full `src` traversal + key root/deploy/config paths

## Annotated Tree (Critical Paths)

```text
project-alpha-master/
├── src/                          # Primary application source
│   ├── routes/                   # TanStack Router routes (UI + API)
│   ├── presentation/             # React UI, layout, component inventory
│   ├── domain/                   # Business schemas/types/services/interfaces
│   ├── infrastructure/           # Persistence, filesystem, sync, events, AI adapters
│   ├── plugins/                  # Feature plugin implementations
│   ├── modules/                  # Module wrappers/composition boundaries
│   ├── lib/                      # Legacy/shared services and utilities
│   └── styles/                   # Styling entry points and design layers
├── api/                          # Vercel adapter entry (`api/index.js`)
├── public/                       # Static assets + localization payloads
├── e2e/                          # Playwright journey tests
├── .github/workflows/            # CI/CD and automation workflows
├── vite.config.ts                # Build/runtime plugin configuration
├── package.json                  # Scripts, dependencies, project metadata
└── tsconfig*.json                # TypeScript configuration variants
```

## Critical Folder Summary

- `src/presentation` (506 files): largest UI/composition surface.
- `src/infrastructure` (386 files): persistence/sync/platform integration center.
- `src/lib` (331 files): legacy and shared utility/service layer.
- `src/domain` (62 files): canonical schema/type domain core.
- `src/routes` (25 files): application + API route entry points.

## Entry Points

- Server entry: `src/server.ts`
- Router bootstrap: `src/router.tsx`
- Root route shell: `src/routes/__root.tsx`
- API route family: `src/routes/api/*`
- Vercel adapter: `api/index.js`
