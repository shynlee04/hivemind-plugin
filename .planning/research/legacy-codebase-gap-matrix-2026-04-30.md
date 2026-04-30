# Legacy Codebase Gap Matrix — harness-experiment vs product-detox
**Date:** 2026-04-30
**Quick-reference gap analysis for porting decisions.**

## Gap Matrix: Feature-by-Feature

| # | Feature | product-detox Path | LOC | harness-experiment Status | Priority | Phase |
|---|---------|-------------------|-----|--------------------------|----------|-------|
| 1 | Session Entry Intake | `src/features/session-entry/` | ~1.2K | **MISSING** | CRITICAL | 48 |
| 2 | Control Plane | `src/control-plane/` | ~1K | **MISSING** | CRITICAL | 48 |
| 3 | Trajectory Ledger | `src/core/trajectory/` | ~1.5K | **MISSING** | CRITICAL | 49 |
| 4 | Doc Intelligence Engine | `src/intelligence/doc/` | ~350 | **MISSING** | HIGH | 50 |
| 5 | Hivemind Doc Tool | `src/tools/doc/` | ~100 | **MISSING** | HIGH | 50 |
| 6 | Enhanced Event Tracker | `src/features/event-tracker/` | ~3K | Partial (basic journal) | HIGH | 50 |
| 7 | Prompt Packet Compiler | `src/context/prompt-packet/` | ~200 | Partial (messages-transform) | HIGH | 50 |
| 8 | Recovery Engine | `src/recovery/` | ~200 | **MISSING** | HIGH | 49 |
| 9 | Agent Work Contract | `src/features/agent-work-contract/` | ~3K | **MISSING** | MEDIUM | 51 |
| 10 | CLI | `src/cli/` + `src/cli.ts` | ~6 files | Placeholder (.gitkeep) | LOW | 52 |
| 11 | Runtime Observability | `src/features/runtime-observability/` | ~500 | **MISSING** | LOW | 51 |
| 12 | SDK Supervisor | `src/sdk-supervisor/` | ~8 files | **MISSING** | LOW | 52 |

## Already Covered (No Action)

| Feature | In harness-experiment |
|---------|----------------------|
| CQRS Architecture | `src/plugin.ts`, `hook-cqrs-boundary.ts` |
| Delegation (WaiterModel) | `src/lib/delegation-manager.ts` (656 LOC) |
| Continuity Persistence | `src/lib/continuity.ts` (401 LOC) |
| Schema Kernel (Zod) | `src/schema-kernel/` (10+ schemas) |
| Framework Detector | `src/lib/framework-detector.ts` |
| Concurrency (Keyed Semaphore) | `src/lib/concurrency.ts` |
| PTY Background Commands | `src/lib/pty/` |
| Security (Path-scope, Redaction) | `src/lib/security/` |
| 30 hm-* Skills | `.opencode/skills/hm-*` |
| 3 gate-* Skills | `.opencode/skills/gate-*` |
