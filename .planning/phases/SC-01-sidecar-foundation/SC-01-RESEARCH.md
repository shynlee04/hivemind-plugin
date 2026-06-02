# Phase SC-01: Sidecar Foundation — Research

**Researched:** 2026-06-02
**Domain:** Plugin-side HTTP/WS server, lazy dependency binding, SSE connection pool, canonical state extension
**Confidence:** HIGH

## Summary

SC-01 establishes the foundational infrastructure for the Hivemind Sidecar GUI: a lightweight embedded HTTP/WS server in the plugin process (no Express/Fastify), lazy dependency binding so the server can start before all modules are constructed, SSE connection primitives with heartbeat, extended canonical state prefixes for session-tracker and opencode access, and required package bumps (json-render 0.18→0.19, ws added).

The two-server model is locked by architecture decision: plugin HTTP server (localhost random port) + Next.js standalone app (port 3099). SC-01 builds **only** the plugin side — all REST routing, tool proxy, and SSE event observer wiring are deferred to SC-02.

**Primary recommendation:** Use raw Node.js `http.createServer` (zero framework deps), `SidecarDependencyRegistry` with `import type` for lazy bindings, SSE via `ReadableStreamDefaultController`, and `ws` as optional dependency for future WebSocket streaming.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP server creation | Plugin (src/sidecar/server/) | — | Embedded in plugin process; localhost-only |
| Lazy dependency registry | Plugin (src/sidecar/server/) | — | Modules register post-construction |
| SSE connection pool | Plugin (src/sidecar/server/) | — | Manages SSE clients for event push |
| State prefix extension | Plugin (src/sidecar/) | — | Extends CANONICAL_PREFIXES in readonly-state.ts |
| Port file discovery | Filesystem (.hivemind/state/) | — | sidecar-port.json written by plugin, read by Next.js |
| JSON-render bump | Dependencies (package.json) | — | Playwright major issues resolved; v0.19.0 safe upgrade |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `http` | built-in | HTTP server creation | Zero framework deps; raw `http.createServer` matches project philosophy |
| Node.js `fs` | built-in | Port file write, directory listing | Built-in; no additional deps |
| `ws` | ^8.18.0 | WebSocket server | Industry-standard WS for Node.js; optional dep |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @json-render/core | 0.18.0→0.19.0 | json-render runtime | Bump for SC-03 compatibility |
| @json-render/react | 0.18.0→0.19.0 | React bindings | Bump for SC-03 compatibility |
| @json-render/next | 0.18.0→0.19.0 | Next.js integration | Bump for SC-03 compatibility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `http.createServer` | Express / Fastify | Adds 30KB+ dep weight. No routing needed in SC-01 (single `/health` endpoint). Defer framework to SC-02 if complexity warrants. |
| Synchronous factory | Async factory with separate `.start()` | Async pattern keeps factory testable without network; caller controls start timing |

**Installation:**
```bash
npm install ws@^8.18.0
npm install @json-render/core@^0.19.0 @json-render/react@^0.19.0 @json-render/next@^0.19.0 @json-render/ink@^0.19.0 @json-render/react-pdf@^0.19.0
```

## Architecture Patterns

### System Architecture Diagram

```
Browser (Operator)
     │
     │ HTTP (localhost:3099)
     ▼
┌──────────────────────────────┐
│  Next.js 16 App (sidecar/)   │
│  • Standalone mode (port 3099)│
│  • json-render + shadcn/ui   │
│  • API routes proxy to plugin │
└──────────┬───────────────────┘
           │ HTTP (localhost:RANDOM)
           ▼
┌──────────────────────────────┐
│  Plugin HTTP/WS Server        │  ◄── SC-01
│  (src/sidecar/server/)        │
│                               │
│  • createSidecarServer()      │
│  • SidecarDependencyRegistry  │
│  • SseConnectionPool          │
│  • GET /health                │
│  • 501 for all other routes   │
└──────────┬───────────────────┘
           │ lazy binds via registry
           ▼
┌──────────────────────────────┐
│  Plugin Modules               │
│  (SessionTracker, Delegation, │
│   Trajectory, Pressure, etc.) │
└──────────────────────────────┘

Startup order:
  Step 5:  tmux integration
  Step 5.5: Sidecar server starts (FIRE-AND-FORGET)
  Step 6:  SessionTracker created → registry.setSessionTracker()
  Step 7:  Delegation modules → registry.setDelegationManager()
  Steps 8-15: Remaining modules bind to registry
```

### Recommended Project Structure
```
src/sidecar/
├── types.ts                        # SidecarEventType, SidecarEvent
├── readonly-state.ts               # EXISTING — CANONICAL_PREFIXES extended
├── readonly-state-extensions.ts    # NEW — listCanonicalDirectory()
└── server/
    ├── factory.ts                  # NEW — createSidecarServer()
    ├── registry.ts                 # NEW — SidecarDependencyRegistry
    └── sse/
        └── pool.ts                 # NEW — SseConnectionPool
```

### Pattern 1: Lazy Dependency Registry
**What:** A dependency container that accepts typed lazy bindings after server construction. Getters throw `[Harness]` errors if accessed before binding.
**When to use:** When the server must start before all its dependencies are constructed (plugin startup ordering constraint).
**Example:**
```typescript
// Source: CONTEXT.md D-SC01-09, D-SC01-10
import type { SessionTracker } from '../../features/session-tracker'

class SidecarDependencyRegistry {
  private _sessionTracker?: SessionTracker

  setSessionTracker(s: SessionTracker): void {
    this._sessionTracker = s
  }

  get sessionTracker(): SessionTracker {
    if (!this._sessionTracker) throw new Error('[Harness] Sidecar: SessionTracker not bound yet')
    return this._sessionTracker
  }

  isReady(): boolean {
    return !!this._sessionTracker && !!this._delegationManager && !!this._client
  }
}
```

### Pattern 2: SSE Connection Pool
**What:** Manages SSE client connections with configurable heartbeat and max connection limit.
**When to use:** Any feature pushing real-time events to browser clients.
**Example:**
```typescript
// Source: ARCHITECTURE.md §3.4
class SseConnectionPool {
  private clients = new Map<string, ReadableStreamDefaultController>()
  private heartbeatInterval: number
  private maxClients: number

  constructor(opts?: { heartbeatIntervalMs?: number; maxClients?: number }) { ... }

  addClient(id: string, controller: ReadableStreamDefaultController): void { ... }
  removeClient(id: string): void { ... }

  broadcast(event: SidecarEvent): void {
    const encoder = new TextEncoder()
    for (const [id, controller] of this.clients) {
      try {
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`))
      } catch {
        this.removeClient(id)  // dead connection cleanup
      }
    }
  }

  clientCount(): number { return this.clients.size }
}
```

### Anti-Patterns to Avoid
- **Blocking plugin init on server start:** Server start must be fire-and-forget (try-catch with warning log). Blocking would prevent the plugin from loading if the port is unavailable.
- **Framework dependencies (Express/Fastify):** SC-01 has a single route (`/health`). A framework adds unnecessary weight. Defer to SC-02 if routing complexity grows.
- **Hardcoded ports:** Always use port `0` (random). Fixed ports cause conflicts in multi-instance or CI environments.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP server | Full framework (Express) | Node.js `http.createServer` | Only 1 route in SC-01; raw http handles it |
| WebSocket | Custom WS protocol | `ws` npm package | Industry standard; 18M weekly downloads |
| SSE parsing | Re-implement SSE protocol | Native `ReadableStreamDefaultController` | Built-in Web API; no additional deps |
| Port file discovery | Custom IPC | Well-known file path `.hivemind/state/sidecar-port.json` | Simple, debuggable, works cross-process |

**Key insight:** SC-01's responsibilities are deliberately narrow (server creation, registry, SSE pool, state extension). Every complex concern (routing, tool proxy, event wiring) is deferred to SC-02. Resist the temptation to "just add one more endpoint."

## Common Pitfalls

### Pitfall 1: Port File Race Condition
**What goes wrong:** Next.js starts before the plugin server has written `sidecar-port.json`, causing blank panels.
**Why it happens:** Two-server model means independent start sequences.
**How to avoid:** Next.js route handler reads port file with retry (3 attempts, 500ms backoff). Plugin writes port file synchronously within step 5.5.
**Warning signs:** Panels show "Sidecar not available" state on first load.

### Pitfall 2: Unbound Registry Access
**What goes wrong:** A module accesses `registry.delegationManager` before it's been set, getting `undefined`.
**Why it happens:** Server starts at step 5.5 but delegation modules aren't constructed until step 7.
**How to avoid:** Getters throw `[Harness]` error on unbound access. Tests verify `isReady()` transitions.
**Warning signs:** Runtime `TypeError: Cannot read properties of undefined` — catch early via registry type safety.

### Pitfall 3: SSE Client Leak
**What goes wrong:** Disconnected SSE clients accumulate in the pool, consuming memory.
**Why it happens:** Browser tab closes without sending `close()` event.
**How to avoid:** Clean up dead clients during `broadcast()` (catch `controller.enqueue()` errors → call `removeClient`). Heartbeat acts as dead-client detector.
**Warning signs:** `clientCount()` grows over time without active panels.

## Code Examples

### Server Factory (complete pattern)
```typescript
// Source: ARCHITECTURE.md §3.2
import { createServer, Server as HttpServer } from 'node:http'

export interface SidecarServer {
  port: number
  close: () => Promise<void>
}

export interface SidecarServerDeps {
  projectDirectory: string
}

export function createSidecarServer(deps: SidecarServerDeps): SidecarServer {
  const server: HttpServer = createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() * 1000 }))
    } else {
      res.writeHead(501)
      res.end('Not Implemented')
    }
  })

  return {
    port: 0,  // assigned after start
    close: () => new Promise(resolve => server.close(() => resolve())),
  }
}
```

### Registry Binding Lifecycle
```typescript
// In plugin.ts steps 6-15:
const registry = getRegistry()

// Step 6: SessionTracker created
registry.setSessionTracker(sessionTracker)

// Step 7: Delegation modules created
registry.setDelegationManager(delegationManager)

// Step 8+: Other modules
registry.setTrajectory(trajectory)
registry.setPressure(pressure)
registry.setConfigSubscriber(configSubscriber)

// Verification
console.assert(registry.isReady() === true) // core 3 deps bound
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No sidecar — all interaction via terminal | Embedded plugin HTTP server with GUI panels | SC-01 | Enables visual panels for session/delegation/trajectory browsing |
| @json-render 0.18.x | @json-render 0.19.0 | SC-01 | Safe minor bump; no breaking changes per RESEARCH-json-render.md |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js http | Server factory | ✓ | built-in | — |
| Node.js fs | Port file + directory listing | ✓ | built-in | — |
| ws | WebSocket (future SC-02) | ✗ | Not installed | Will install as optionalDependency |
| @json-render/core | Sidecar panels (SC-03+) | ✓ | 0.18.0 | Bump to 0.19.0 in SC-01 |

**Missing dependencies with no fallback:** None — all dependencies are standard library or are being added by this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard) |
| Quick run | `npx vitest run tests/sidecar/server/` |
| Full suite | `npm run typecheck && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| REQ-01 | CANONICAL_PREFIXES has 4 entries | unit | `npx vitest run tests/sidecar/readonly-state.test.ts -x` |
| REQ-02 | listCanonicalDirectory returns entries | unit | `npx vitest run tests/sidecar/readonly-state.test.ts -x` |
| REQ-03 | SidecarEventType is 11 members | unit | `npx vitest run tests/sidecar/server/types.test.ts -x` |
| REQ-04 | Registry isReady transitions + throws | unit | `npx vitest run tests/sidecar/server/registry.test.ts -x` |
| REQ-05 | Server starts on port > 0 | unit | `npx vitest run tests/sidecar/server/factory.test.ts -x` |
| REQ-06 | SSE pool add/remove/broadcast/heartbeat | unit | `npx vitest run tests/sidecar/server/sse/pool.test.ts -x` |
| REQ-07 | Package bumps applied + typecheck passes | integration | `npm run typecheck && npm ls @json-render/core` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Localhost-only binding; no auth needed |
| V5 Input Validation | yes | Path traversal guard via `isCanonicalStatePath()` |
| V6 Cryptography | no | Localhost-only traffic; no TLS needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via state API | Tampering | `isCanonicalStatePath()` restricts to 4 prefixes; non-canonical paths return empty |
| Server start failure exposes half-init state | DoS | Try-catch at step 5.5; log warning; continue without sidecar |
| SSE dead connection accumulation | DoS | Cleanup on broadcast error; max 50 clients |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | @json-render 0.18→0.19 has no breaking changes | Standard Stack | Low — confirmed by RESEARCH-json-render.md (Context7 + npm registry verification) |
| A2 | Plugin startup step numbering (steps 1-17) is current | Architecture Patterns | Medium — P39 may have shifted step numbers; planner must re-verify |
| A3 | ws can be lazy-loaded without build issues | Standard Stack | Low — ws is pure JS; optional dep pattern matches PTY manager |

## Sources

### Primary (HIGH confidence)
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` (1113 LOC) — Complete system architecture, startup sequence, API design
- `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` (337 LOC) — json-render v0.19.0 compatibility, API stability confirmed
- `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` (615 LOC) — Next.js 16 standalone mode patterns
- `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` (453 LOC) — Ecosystem research
- `SC-01-SPEC.md` — 7 locked requirements with acceptance criteria
- `SC-01-CONTEXT.md` — 14 locked implementation decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All deps are built-in Node.js or well-established (ws, json-render)
- Architecture: HIGH — Fully documented in ARCHITECTURE.md (1113 LOC) with startup sequence
- Pitfalls: HIGH — Based on established SSE/registry patterns and architecture decisions

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (architecture stable; plugin.ts startup steps may shift)
