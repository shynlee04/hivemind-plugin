---
phase: SC-01
slug: sidecar-foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-02
---

# Phase SC-01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Plugin HTTP server ↔ host process | Localhost-only HTTP server accessible to any process on the machine | Sidecar state JSON over local TCP |
| CANONICAL_PREFIXES extension | Adding `.opencode/` exposes agent/command definitions via state API | File paths, directory listings (read-only) |
| HTTP request path → filesystem | Raw path from request URL passed to state reading functions | File system paths, directory contents |
| Server start failure | Uncaught start failure can block entire plugin init | Plugin initialization control flow |
| Lazy dependency registry | Modules bound after server start; unbound access could expose half-init state | Module references (types only, no runtime payloads) |
| SSE connection pool | External SSE clients connect to the embedded HTTP server | Sidecar event payloads over SSE |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-SC01-01 | Tampering | `sidecar-port.json` write | mitigate | `writeFileSync` inside plugin init wrapped in try-catch per D-SC01-04. Only the plugin process writes this file. See `src/sidecar/server/factory.ts:83-95`. | closed |
| T-SC01-02 | Info Disclosure | CANONICAL_PREFIXES extended to `.opencode/` | accept | `.opencode/` contains agent/command definitions only — no secrets, credentials, or user data. Server is localhost-only. | closed |
| T-SC01-03 | Elevation of Privilege | Lazy dependency registry bindings | mitigate | Getter methods throw `[Harness]` error if accessed before binding — no silent `undefined`. 6 getters guarded. See `src/sidecar/server/registry.ts:74,81,88,95,103,111`. | closed |
| T-SC01-04 | Tampering | Path traversal via state API | mitigate | `isCanonicalStatePath()` restricts to 4 canonical prefixes; non-canonical paths return empty `DirectoryEntry[]`. See `src/sidecar/readonly-state.ts:56`. | closed |
| T-SC01-05 | DoS | Server start failure exposes half-init state | mitigate | Try-catch at step 5.5 in plugin init; log warning; continue without sidecar per D-SC01-03. See `src/plugin.ts:428-444`. | closed |
| T-SC01-06 | DoS | SSE dead connection accumulation | mitigate | Dead clients cleaned up during `broadcast()` when `controller.enqueue()` throws. Max 50 concurrent connections (configurable). 30s heartbeat. See `src/sidecar/server/sse/pool.ts:41,53-55,86,114`. | closed |
| T-SC01-SC | Tampering | npm package installs (`ws`, `@json-render/*`) | mitigate | slopcheck verification + blocking human checkpoint for `[ASSUMED]` packages per GSD standard practice. `ws@8.18.0` and `@json-render/*@0.19.0` in optionalDependencies only. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-SC01-A01 | T-SC01-02 | `.opencode/` directory exposed via CANONICAL_PREFIXES extension contains only agent/command definitions (no secrets, credentials, or user data). Access limited to localhost. Risk of information disclosure is minimal — an attacker with localhost access already has file system access. | Plan-time decision in `<threat_model>` | 2026-06-02 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-02 | 7 | 7 | 0 | `/gsd-secure-phase SC-01` — automated audit |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-02

---

## Implementation Verification Notes

Mitigations confirmed via code inspection:

- **T-SC01-01**: `writeFileSync` at `src/sidecar/server/factory.ts:88-91` wrapped in try-catch at `:83-95` — port file write failure is non-fatal
- **T-SC01-03**: `[Harness] Sidecar: DelegationManager not bound yet` at `registry.ts:74`; similar guards for SessionTracker (`:81`), Client (`:88`), Trajectory (`:95`), Pressure (`:103`), ConfigSubscriber (`:111`)
- **T-SC01-04**: `isCanonicalStatePath()` at `readonly-state.ts:56` restricts to CANONICAL_PREFIXES array (4 entries); `listCanonicalDirectory()` at `readonly-state-extensions.ts:51` gates access through it
- **T-SC01-05**: try-catch block at `plugin.ts:428-444` — server start failure logged as warning, plugin continues
- **T-SC01-06**: `maxClients: 50` default at `pool.ts:41`; connection limit enforcement at `:53-55`; dead cleanup during `broadcast()` at `:86` (catch on enqueue → `removeClient`); heartbeat at `:114`
- **T-SC01-SC**: Standard GSD package verification — `ws@8.18.0` and `@json-render/*@0.19.0` in optionalDependencies only
