# Hivemind Sidecar — Phase Overview

**Created:** 2026-06-02
**Status:** Planning complete, ready for sequential execution
**Total phases:** 6
**Execution waves:** 4

---

## Architecture Summary

The Hivemind Sidecar is a **two-server architecture**:
- **Plugin HTTP Server** (`src/sidecar/server/`) — lightweight Node `http` + `ws` server embedded in the Hivemind plugin, binding to localhost on a random port
- **Next.js 16 App** (`sidecar/`) — standalone Next.js application rendering 4 GUI panels via `@json-render/react` v0.19.0 with shadcn/ui

Communication flows through REST (state reads), SSE (live events), WebSocket (delegation streaming), and a port-discovery sentinel file (`.hivemind/state/sidecar-port.json`).

## Phase Dependency Graph

```
SC-01 (Foundation)
  │
  ▼
SC-02 (REST API + Tool Proxy)
  │
  ▼
SC-03 (Next.js 16 App)
  │
  ├────────────────────┐
  ▼                    ▼
SC-04 (Session        SC-05 (Delegation
 Explorer Panel)       Dashboard Panel)
  │                    │
  └────────┬───────────┘
           ▼
      SC-06 (MEMS Browser +
             Control Panel)
```

## Execution Waves

| Wave | Phases | Description |
|------|--------|-------------|
| 1 | SC-01 | Foundation — plugin server, state bridge, deps |
| 2 | SC-02 | REST API endpoints, tool proxy, SSE/WS wiring |
| 3 | SC-03 | Next.js app scaffold, catalog, panels base |
| 4 | SC-04, SC-05 | Panel implementation (parallel — no file overlap) |
| 4→5 gate | SC-06 dep | Both panels must be complete |
| 5 | SC-06 | MEMS browser + control panel (depends on both panels) |

## Phase Details

| Phase | Deliverables | New Files | Risk |
|-------|-------------|-----------|------|
| SC-01 | SidecarServer, SidecarDependencyRegistry, extended CANONICAL_PREFIXES, package bumps, SseConnectionPool | ~10 files | Plugin startup ordering (step 5.5) |
| SC-02 | REST routes, tool proxy (12 handlers), WS delegation stream, SSE endpoint, catalog endpoint, cache | ~20 files | Lazy deps not yet bound → 503 responses |
| SC-03 | Next.js 16 app, catalog.ts, state-store.ts, plugin-client.ts, 4 panel stubs, shadcn/ui, Tailwind v4 | ~15 files | json-render v0.19.0 peer dep compatibility |
| SC-04 | SessionTree, Timeline, delegation hierarchy, SSE client, search/filter | ~8 files | Session tracker data shape mismatch |
| SC-05 | Metric cards, ConcurrencySlots, completion status, KPIs | ~6 files | Real-time data freshness |
| SC-06 | Graph visualization, PressureGauge, TrajectoryTimeline, CommandInput, ConfigEditor | ~8 files | Graph visualization complexity (D3/vis) |

## Key Architectural Decisions (from architecture)

1. **Two-server model** — Plugin HTTP server + standalone Next.js, not embedded
2. **Single unified json-render catalog** — 36 shadcn + 8 custom components
3. **Lazy dependency binding** — `SidecarDependencyRegistry` for deferred module wiring
4. **SSE for push, WebSocket for delegation streaming** — Two protocols, each serving its purpose
5. **Extended CANONICAL_PREFIXES** — Add `.hivemind/session-tracker` + `.opencode` to readonly state

## Integration Points

| Module | Phase | Connection |
|--------|-------|------------|
| `src/plugin.ts` | SC-01 | Server starts at step 5.5, deps bound at steps 6-15 |
| `src/sidecar/readonly-state.ts` | SC-01 | CANONICAL_PREFIXES extended, directory listing added |
| Event observer pipeline | SC-02 | Sidecar observer registered in hook chain |
| DelegationManager | SC-02 | Tool proxy wraps 12 delegation/session tools |
| DelegationMonitor | SC-05 | Completion status polling |
| ConfigSubscriber | SC-06 | Config editor binding |
| Trajectory | SC-06 | Trajectory timeline + decision anchors |

## Package Dependency Changes

| Package | Current | Target | Phase |
|---------|---------|--------|-------|
| `@json-render/core` | ^0.18.0 | ^0.19.0 | SC-01 |
| `@json-render/react` | ^0.18.0 | ^0.19.0 | SC-01 |
| `@json-render/next` | ^0.18.0 | ^0.19.0 | SC-01 |
| `@json-render/shadcn` | Not installed | ^0.19.0 | SC-03 |
| `@json-render/directives` | Not installed | ^0.19.0 | SC-03 |
| `ws` | Not in deps | Add to optionalDeps | SC-01 |
| `next` | ^15.0.0 (sidecar) | ^16.0.0 (sidecar) | SC-03 |
| `tailwindcss` | Not installed | ^4.0.0 (sidecar) | SC-03 |

---

## Gate Conditions (per phase)

Every phase must pass the 3-gate triad before advancing:
1. **Lifecycle Integration Gate** — CQRS boundaries, 9-surface authority, event wiring
2. **Spec Compliance Gate** — Bidirectional traceability, EARS criteria, anti-pattern scan
3. **Evidence Truth Gate** — L1-L3 runtime proof, not L5 docs-only claims
