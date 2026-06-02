# Sidecar Phase Dependency Graph

**Generated:** 2026-06-02

---

## Full Dependency Matrix

```
SC-01 (Wave 1)
  ├── depends on: nothing (Phase 42 foundation complete)
  ├── creates: SidecarServer, SidecarDependencyRegistry, extended prefixes
  │
  ▼
SC-02 (Wave 2)
  ├── depends on: SC-01 (server running, registry ready)
  ├── requires: registry.delegationManager + registry.sessionTracker bound
  ├── creates: REST routes, tool proxy, SSE/WS handlers
  │
  ▼
SC-03 (Wave 3)
  ├── depends on: SC-02 (API endpoints available)
  ├── requires: plugin HTTP server serving /api/catalog, /api/state/*
  ├── creates: Next.js 16 app, catalog.ts, state-store.ts, panels/
  │
  ├───────────────────────────────────────┐
  ▼                                       ▼
SC-04 (Wave 4)                   SC-05 (Wave 4)
  ├── depends on: SC-03              ├── depends on: SC-03
  ├── parallel with: SC-05           ├── parallel with: SC-04
  ├── no file overlap with SC-05     ├── no file overlap with SC-04
  ├── uses: session-tracker API      ├── uses: delegation API + SSE
  ├── creates: SessionTree,           ├── creates: Metric cards,
  │   Timeline, search/filter         │   ConcurrencySlots, KPIs
  │                                   │
  └─────────────────┬─────────────────┘
                    ▼
              SC-06 (Wave 5)
                ├── depends on: SC-04 + SC-05 (both panels complete)
                ├── requires: trajectory + pressure modules bound in registry
                ├── creates: Graph, PressureGauge, TrajectoryTimeline,
                │   CommandInput, ConfigEditor
                └── no file overlap with SC-04 or SC-05
```

## Wave Assignment Algorithm

```yaml
# Phase → wave mapping
SC-01: wave 1     # No deps → Wave 1
SC-02: wave 2     # Depends on SC-01 → Wave 2
SC-03: wave 3     # Depends on SC-02 → Wave 3
SC-04: wave 4     # Depends on SC-03, parallel with SC-05
SC-05: wave 4     # Depends on SC-03, parallel with SC-04
SC-06: wave 5     # Depends on SC-04 + SC-05 → Wave 5
```

## File Ownership (For Parallel Safety)

### Wave 4 Parallel Execution (SC-04 + SC-05)

Files modified by SC-04:
```
sidecar/src/panels/session-explorer/*     ← SC-04 owns exclusively
sidecar/src/components/panels/*           ← SC-04 owns session-panel components
```

Files modified by SC-05:
```
sidecar/src/panels/delegation-dashboard/* ← SC-05 owns exclusively
sidecar/src/components/*                  ← SC-05 owns metric/concurrency components
```

**Zero overlap** — SC-04 and SC-05 modify disjoint file sets. They can execute in parallel.

Files shared (read-only, both consume):
```
sidecar/src/lib/catalog.ts                ← Created by SC-03, read by both
sidecar/src/lib/state-store.ts            ← Created by SC-03, read by both
sidecar/src/lib/plugin-client.ts           ← Created by SC-03, read by both
```

## Dependency Justification

| Edge | Why |
|------|-----|
| SC-02 → SC-01 | Tool handlers need `SidecarDependencyRegistry` with bound modules |
| SC-03 → SC-02 | Next.js proxy routes forward to plugin HTTP server endpoints; server must exist first |
| SC-04 → SC-03 | Panel needs Next.js app scaffold, catalog, and state-store to exist |
| SC-05 → SC-03 | Panel needs same foundation as SC-04 |
| SC-06 → SC-04+SC-05 | MEMS browser needs both session/delegation infrastructure and the dashboard shell |

## Cross-Cutting Concerns

| Concern | Affects | Mitigation |
|---------|---------|------------|
| Plugin startup ordering | SC-01 | Server starts at step 5.5, deps bound by step 15. Tests use mock registry. |
| Port file race condition | SC-01→SC-03 | Write-ahead + read-retry in plugin-client.ts (3 attempts, 500ms backoff) |
| json-render version mismatch | SC-01→SC-03 | All 0.18→0.19 bumps in SC-01; SC-03 installs shadcn/directives at 0.19.0 |
| SSE event schema drift | SC-02→SC-04, SC-05 | Shared TypeScript types in `sidecar/src/lib/types.ts` |
| WebSocket reconnection | SC-02→SC-04, SC-05 | Exponential backoff in plugin-client.ts WS wrapper |
