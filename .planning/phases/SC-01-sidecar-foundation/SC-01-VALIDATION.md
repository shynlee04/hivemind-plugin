---
phase: SC-01
slug: sidecar-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase SC-01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (project standard) |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run tests/sidecar/server/` |
| **Full suite command** | `npm run typecheck && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/sidecar/server/factory.test.ts -x`
- **After every plan wave:** Run `npx vitest run tests/sidecar/`
- **Before `/gsd-verify-work`:** Full suite must be green (typecheck + all tests)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 01 | 1 | REQ-01 (prefixes) | T-SC01-02 | Prefixes only extend to canonical paths | unit | `npx vitest run tests/sidecar/readonly-state.test.ts -x` | ✅ | ⬜ pending |
| T1 | 01 | 1 | REQ-02 (dir listing) | — | N/A | unit | `npx vitest run tests/sidecar/readonly-state.test.ts -x` | ✅ | ⬜ pending |
| T2 | 01 | 1 | REQ-03 (types) | — | N/A | unit | `npx vitest run tests/sidecar/server/types.test.ts -x` | ❌ W0 | ⬜ pending |
| T2 | 01 | 1 | REQ-04 (registry) | T-SC01-03 | Unbound getters throw error | unit | `npx vitest run tests/sidecar/server/registry.test.ts -x` | ❌ W0 | ⬜ pending |
| T2 | 01 | 1 | REQ-05 (server) | — | N/A | unit | `npx vitest run tests/sidecar/server/factory.test.ts -x` | ❌ W0 | ⬜ pending |
| T3 | 01 | 1 | REQ-06 (SSE pool) | — | N/A | unit | `npx vitest run tests/sidecar/server/sse/pool.test.ts -x` | ❌ W0 | ⬜ pending |
| T3 | 01 | 1 | REQ-07 (deps + wiring) | T-SC01-SC | Package install verified | integration | `npm run typecheck && npm ls @json-render/core` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/sidecar/server/types.test.ts` — type definitions (SidecarEventType, SidecarEvent)
- [ ] `tests/sidecar/server/registry.test.ts` — registry binding lifecycle (isReady, throws)
- [ ] `tests/sidecar/server/factory.test.ts` — server creation, port > 0, close cleanup
- [ ] `tests/sidecar/server/sse/pool.test.ts` — add/remove/broadcast, heartbeat timing, max clients

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin startup sequence (step 5.5) | REQ-07 | Requires full plugin runtime; not unit-testable | Start OpenCode with plugin, verify sidecar-port.json exists |
| Server actually serves /health | REQ-05 | HTTP integration test | `curl localhost:{port}/health` returns 200 |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
