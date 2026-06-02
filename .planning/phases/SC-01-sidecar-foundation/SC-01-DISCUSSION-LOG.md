# Phase SC-01: Sidecar Foundation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** SC-01-Sidecar-Foundation
**Mode:** --auto (all decisions auto-selected by agent based on architecture docs and SPEC)
**Areas discussed:** Server Factory API Shape, Error Handling Strategy, Server Healthcheck, SSE Heartbeat Format, Registry Type Safety, P39 Dependency Resolution, Test Approach

---

## Server Factory API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Synchronous factory + manual listen | `createServer()` returns raw http.Server, caller does `.listen()` separately | |
| Async start pattern | `createServer(deps)` returns `{ port, close }`, internal `start()` binds to random port | ✓ |
| Factory with port option | Pass port to factory, factory starts immediately | |

**Selection:** Async start pattern — `createServer()` returns `{ port, close }` with internal async `start()` that resolves after `listening` event.

---

## Error Handling Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fail plugin init on server error | Server start failure throws, propagating up to crash plugin init | |
| Log and continue | Server start failure logs `[Harness]` warning, plugin continues without sidecar | ✓ |
| Retry with backoff | Server start failure retries 3 times with exponential backoff before giving up | |

**Selection:** Log and continue — server failure must not block plugin initialization. The sidecar is a peripheral feature.

---

## Server Healthcheck

| Option | Description | Selected |
|--------|-------------|----------|
| No healthcheck in SC-01 | All routing deferred entirely to SC-02 | |
| Minimal `/health` endpoint | Single endpoint returning `200 OK { status: "ok" }` | ✓ |
| Full routing skeleton | All endpoint stubs with 501 responses | |

**Selection:** Minimal `/health` endpoint — enables verification and Next.js connectivity check.

---

## SSE Heartbeat Format

| Option | Description | Selected |
|--------|-------------|----------|
| Raw text ping | Heartbeat is a bare `:\n` comment line (SSE comment ping) | |
| Standard SSE event | `event: heartbeat\ndata: {}\n\n` | ✓ |
| No heartbeat | No keepalive — rely on TCP timeout | |

**Selection:** Standard SSE event format — more explicit and debuggable.

---

## Registry Type Safety

| Option | Description | Selected |
|--------|-------------|----------|
| `any` typed setters | Setter accepts `any`, getter returns `any` with runtime check | |
| `import type` with typed interfaces | Setter/getter types from `import type`, getter throws if unbound | ✓ |
| Generic registry | `set<T>(key, value)` pattern | |

**Selection:** `import type` with typed interfaces — compile-time safety without runtime circular deps.

---

## P39 Dependency Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Block on P39 | Wait until P39 completes before starting SC-01 | |
| Proceed independently | SC-01 is isolated code, proceed regardless | ✓ |
| Partial dependency | Start SC-01 implementation but gate merge on P39 | |

**Selection:** Proceed independently — SC-01 files are new and isolated. Planner will verify plugin.ts merge compatibility.

---

## Test Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Implementation-first | Write code, then add tests | |
| TDD (Wave 0 first) | Write tests before implementation files | ✓ |
| Integration-only | Skip unit tests, write only integration smoke tests | |

**Selection:** TDD approach — write Wave 0 test files before implementation.

---

*Log generated: 2026-06-02*
*Mode: --auto*
