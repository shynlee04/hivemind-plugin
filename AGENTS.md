# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-02
**Commit:** 446b20ca
**Branch:** harness-experiment

## OVERVIEW

OpenCode plugin implementing a **hierarchical delegation control plane** — manages parent→child agent sessions with budgets, concurrency semaphores, durable file-based continuity, and runtime guardrails (circuit breaker, tool restrictions, permission profiles).

**Stack:** TypeScript 5.3+ (strict ESM), `@opencode-ai/plugin` SDK ≥1.1.0, Vitest, Node ≥20. Zero runtime deps.

## STRUCTURE

```
src/
├── plugin.ts          # Composition root — hook handlers + delegate-task tool (483 LOC)
├── index.ts           # Barrel re-exports only (12 LOC)
└── lib/
    ├── continuity.ts      # Durable JSON file store + normalizers (635 LOC ⚠️)
    ├── lifecycle-manager.ts # Session state machine: create→queue→dispatch→observe (628 LOC ⚠️)
    ├── session-api.ts     # SDK adapter with multi-path fallback (473 LOC ⚠️)
    ├── types.ts           # Shared types + constants — leaf node, no imports (155 LOC)
    ├── runtime.ts         # Effective prompt state resolution (154 LOC)
    ├── helpers.ts         # Utilities + tool restriction maps (141 LOC ⚠️ mixed)
    ├── routing.ts         # Category→agent/model/temperature routing table (113 LOC)
    ├── state.ts           # In-memory Maps: stats, budgets, delegation meta (106 LOC)
    └── concurrency.ts     # Keyed semaphore — fully self-contained (98 LOC)

tests/lib/                  # Vitest test files (mirrors src/lib/)
.opencode/                  # Harness config: agents, commands, skills, rules, plugins
docs/                       # Implementation plans, architecture notes
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a new hook handler | `src/plugin.ts:104` (HarnessControlPlane factory) | Add key to returned object |
| Add a new specialist agent | `src/lib/types.ts:3` (VALID_AGENTS) + `src/lib/helpers.ts:88-98` (tools) + `src/plugin.ts:67-102` (permissions) + `src/lib/routing.ts:22-55` (category) | Must update 4 locations |
| Add a delegation category | `src/lib/types.ts:4-9` (VALID_DELEGATION_CATEGORIES) + `src/lib/routing.ts:22-55` (CATEGORY_CONFIGS) | |
| Change durability format | `src/lib/continuity.ts` | Single JSON file at `.opencode/state/opencode-harness/session-continuity.json` |
| Change concurrency limits | `src/lib/concurrency.ts` | Semaphore per (model, agent, category) key |
| Change circuit breaker | `src/plugin.ts:42` CIRCUIT_BREAKER_THRESHOLD | Loop detection on tool signature |
| Change tool budgets | `src/plugin.ts:43` MAX_TOOL_CALLS_PER_SESSION | |
| Change delegation depth | `src/plugin.ts:39` MAX_DEPTH | Max parent→child chain length |
| Modify SDK call patterns | `src/lib/session-api.ts` | Multi-path fallback — must update all variants |
| State hydration on restart | `src/lib/lifecycle-manager.ts` → `hydrateFromContinuity()` | Reads disk → populates in-memory maps |

## CONVENTIONS

- **ESM only** — `"type": "module"`, all imports use `.js` extension (`./lib/types.js`)
- **`[Harness]` prefix** on all thrown errors — flow control mechanism, not bugs
- **Dual-layer state**: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`), hydrated on startup
- **Deep-clone-on-read** in continuity store to prevent mutation aliasing
- **Warning accumulation** via `state.ts:addWarning()` — capped at 25 per session
- **Multi-path SDK fallback** in `session-api.ts` — tries multiple call signatures, throws last error only
- **No `any` type aliases** — `client` flows as `any` (known tech debt, SDK lacks types)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** put business logic in `src/index.ts` — re-exports only
- **NEVER** import from `dist/` in source — use relative `src/` paths
- **NEVER** catch and swallow errors silently without a `// intentional: <reason>` annotation
- **NEVER** add runtime dependencies — this package is zero-dep by design
- **NEVER** modify the continuity JSON file manually — always go through `continuity.ts` functions
- **NEVER** use `isRecord()` (continuity.ts private) when `isObject()` (helpers.ts) exists — prefer the shared version

## CODE SMELL REGISTER

| File | LOC | Issue | Recommended Split |
|------|-----|-------|-------------------|
| `continuity.ts` | 635 | Mixed: normalization + clone + CRUD | → `continuity-normalizer.ts` + `continuity-clone.ts` + `continuity.ts` |
| `lifecycle-manager.ts` | 628 | `launchDelegatedSession` alone ~210 LOC | → `session-launcher.ts` + `lifecycle-manager.ts` |
| `session-api.ts` | 473 | Multi-path fallback copy-pasted 5x | → `session-waiter.ts` for polling/SSE functions |
| `plugin.ts` | 483 | Compaction handler 112 LOC + permission factory | → `compaction-formatter.ts` + `permissions.ts` |
| `helpers.ts` | 141 | Mixes generic utils + agent-specific business logic | → `tool-restrictions.ts` for agent config maps |

## ARCHITECTURE: DEPENDENCY GRAPH

```
plugin.ts (composition root)
├── lifecycle-manager.ts
│   ├── concurrency.ts (leaf)
│   ├── continuity.ts → types.ts (leaf)
│   ├── state.ts → types.ts
│   ├── runtime.ts → continuity + helpers + routing + state + types
│   └── session-api.ts → helpers + types
├── routing.ts → types.ts
├── helpers.ts → types.ts
└── state.ts → types.ts
```

**Max depth:** 4 levels. `types.ts` is the shared leaf (imported by 8/10 modules). `concurrency.ts` is fully self-contained.

## COMMANDS

```bash
npm run build          # clean + tsc
npm run typecheck      # tsc --noEmit
npm run test           # vitest run
npm run test:coverage  # vitest run --coverage
npm run test:watch     # vitest (interactive)
```

## NOTES

- **No write-locking** on continuity JSON — concurrent processes could corrupt. Single-process assumption.
- **Module-level singleton** `storeCache` in `continuity.ts:26` prevents isolated unit testing — requires monkey-patching.
- **`asString` duplicated** in `helpers.ts:48` and `continuity.ts:110` (as `isRecord`/`asString` pair) — use shared version.
- **Tool restriction tables overlap**: `RESTRICTED_TOOLS_PER_AGENT` in `helpers.ts` and `getPermissionRulesForAgent()` in `plugin.ts` encode overlapping restrictions. Consolidate.
- **`client: any`** flows through the entire SDK boundary — a minimal `OpenCodeClient` interface would catch API misuse at compile time.
- Tests use Vitest globals (no explicit imports needed). Test files mirror `src/lib/` structure in `tests/lib/`.
