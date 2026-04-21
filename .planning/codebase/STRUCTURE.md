# Codebase Structure

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (arch-focus)

## Directory Layout

```
harness-experiment/
├── src/                          # Hard Harness — TypeScript plugin source
│   ├── plugin.ts                 # Composition root (77 LOC)
│   ├── index.ts                  # Public API re-exports (14 LOC)
│   ├── lib/                      # Core library modules
│   │   ├── types.ts              # Shared types + constants — LEAF (378 LOC)
│   │   ├── delegation-manager.ts # Delegation orchestrator — WaiterModel (450 LOC)
│   │   ├── continuity.ts         # Durable JSON persistence (401 LOC)
│   │   ├── concurrency.ts        # Keyed semaphore + SpawnReservation (298 LOC)
│   │   ├── state.ts              # In-memory Maps — TaskStateManager (251 LOC)
│   │   ├── runtime-policy.ts     # Policy loading, validation, resolution (237 LOC)
│   │   ├── session-api.ts        # Typed OpenCode SDK wrappers (230 LOC)
│   │   ├── helpers.ts            # Pure utilities (175 LOC)
│   │   ├── notification-handler.ts # Async completion notification (169 LOC)
│   │   ├── lifecycle-manager.ts  # Session lifecycle — STUB (135 LOC)
│   │   ├── completion-detector.ts # Two-signal completion detection (126 LOC)
│   │   ├── runtime.ts            # Event→status inference (95 LOC)
│   │   └── task-status.ts        # Status transition guards (22 LOC)
│   ├── hooks/                    # Event hook factories (read-side)
│   │   ├── types.ts              # Hook dependency types (28 LOC)
│   │   ├── create-core-hooks.ts  # event, system.transform, shell.env (136 LOC)
│   │   ├── create-session-hooks.ts # Auto-loop, compaction (295 LOC)
│   │   ├── create-tool-guard-hooks.ts # Circuit breaker, budget, metadata (153 LOC)
│   │   └── messages-transform.ts  # Prompt-enhance context injection (92 LOC)
│   ├── tools/                    # Plugin tools (write-side)
│   │   ├── delegate-task.ts      # Delegation dispatch tool (60 LOC)
│   │   ├── delegation-status.ts  # Delegation status polling (71 LOC)
│   │   ├── prompt-skim/          # Prompt skimming tool
│   │   │   ├── index.ts          # Factory (6 LOC)
│   │   │   ├── tools.ts          # Implementation (85 LOC)
│   │   │   └── types.ts          # Types (18 LOC)
│   │   ├── prompt-analyze/       # Prompt analysis tool
│   │   │   ├── index.ts          # Factory (6 LOC)
│   │   │   ├── tools.ts          # Implementation (155 LOC)
│   │   │   └── types.ts          # Types (17 LOC)
│   │   └── session-patch/        # Session patching tool
│   │       ├── index.ts          # Factory (6 LOC)
│   │       ├── tools.ts          # Implementation (103 LOC)
│   │       └── types.ts          # Types (19 LOC)
│   ├── shared/                   # Cross-cutting tool utilities
│   │   ├── tool-response.ts      # Standard response envelope (71 LOC)
│   │   └── tool-helpers.ts       # Tool result rendering (9 LOC)
│   └── schema-kernel/            # Zod schemas for prompt-enhance pipeline
│       ├── index.ts              # Barrel re-exports (24 LOC)
│       └── prompt-enhance.schema.ts # Schema definitions (169 LOC)
├── tests/                        # Test files (vitest)
│   ├── lib/                      # Unit tests for lib/ modules
│   │   ├── delegation-manager.test.ts  (1099 LOC)
│   │   ├── session-api.test.ts         (478 LOC)
│   │   ├── helpers.test.ts             (452 LOC)
│   │   ├── concurrency.test.ts         (375 LOC)
│   │   ├── completion-detector.test.ts (326 LOC)
│   │   ├── notification-handler.test.ts (262 LOC)
│   │   ├── runtime-policy.test.ts      (253 LOC)
│   │   ├── completion-detector-crash.test.ts (238 LOC)
│   │   ├── state.test.ts               (207 LOC)
│   │   ├── task-status.test.ts         (199 LOC)
│   │   └── helpers/
│   │       └── in-memory-client.ts     (58 LOC) — test helper
│   ├── tools/                    # Tool-focused tests
│   │   ├── delegation-status.test.ts   (264 LOC)
│   │   ├── delegate-task.test.ts       (253 LOC)
│   │   ├── session-patch.test.ts       (193 LOC)
│   │   ├── prompt-analyze.test.ts      (129 LOC)
│   │   └── prompt-skim.test.ts         (120 LOC)
│   ├── schema-kernel/
│   │   └── prompt-enhance.schema.test.ts (457 LOC)
│   ├── integration/
│   │   └── prompt-enhance-pipeline.test.ts (250 LOC)
│   └── plugins/
│       └── prompt-enhance-compaction.test.ts (10 LOC)
├── .opencode/                    # Soft Meta-Concepts (user-configurable)
│   ├── plugins/                  # Plugin loader
│   ├── agents/                   # Agent definitions
│   ├── skills/                   # Skill definitions
│   ├── commands/                 # Slash commands
│   └── rules/                    # Governance rules
├── dist/                         # Compiled output (generated)
├── docs/                         # Documentation
├── bin/                          # CLI scripts
├── templates/                    # Template files
├── package.json                  # npm package manifest
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
└── opencode.json                 # OpenCode runtime configuration
```

## Module Sizes

### Source Files (`src/`) — Total: 4,581 LOC

| File | LOC | Category |
|------|-----|----------|
| `src/lib/delegation-manager.ts` | 450 | Core Library |
| `src/lib/continuity.ts` | 401 | Core Library |
| `src/lib/types.ts` | 378 | Core Library (LEAF) |
| `src/lib/concurrency.ts` | 298 | Core Library |
| `src/hooks/create-session-hooks.ts` | 295 | Hooks |
| `src/lib/state.ts` | 251 | Core Library |
| `src/lib/runtime-policy.ts` | 237 | Core Library |
| `src/lib/session-api.ts` | 230 | Core Library |
| `src/lib/helpers.ts` | 175 | Core Library |
| `src/schema-kernel/prompt-enhance.schema.ts` | 169 | Schema Kernel |
| `src/lib/notification-handler.ts` | 169 | Core Library |
| `src/tools/prompt-analyze/tools.ts` | 155 | Tools |
| `src/hooks/create-tool-guard-hooks.ts` | 153 | Hooks |
| `src/hooks/create-core-hooks.ts` | 136 | Hooks |
| `src/lib/lifecycle-manager.ts` | 135 | Core Library (STUB) |
| `src/lib/completion-detector.ts` | 126 | Core Library |
| `src/tools/session-patch/tools.ts` | 103 | Tools |
| `src/lib/runtime.ts` | 95 | Core Library |
| `src/hooks/messages-transform.ts` | 92 | Hooks |
| `src/tools/prompt-skim/tools.ts` | 85 | Tools |
| `src/plugin.ts` | 77 | Plugin Assembly |
| `src/tools/delegation-status.ts` | 71 | Tools |
| `src/shared/tool-response.ts` | 71 | Shared |
| `src/tools/delegate-task.ts` | 60 | Tools |
| `src/hooks/types.ts` | 28 | Hooks |
| `src/schema-kernel/index.ts` | 24 | Schema Kernel |
| `src/lib/task-status.ts` | 22 | Core Library |
| `src/tools/session-patch/types.ts` | 19 | Tools |
| `src/tools/prompt-skim/types.ts` | 18 | Tools |
| `src/tools/prompt-analyze/types.ts` | 17 | Tools |
| `src/index.ts` | 14 | Public API |
| `src/shared/tool-helpers.ts` | 9 | Shared |
| `src/tools/session-patch/index.ts` | 6 | Tools |
| `src/tools/prompt-skim/index.ts` | 6 | Tools |
| `src/tools/prompt-analyze/index.ts` | 6 | Tools |

### Size Breakdown by Layer

| Layer | LOC | % of Total |
|-------|-----|-----------|
| Core Library (`src/lib/`) | 2,817 | 61.5% |
| Hooks (`src/hooks/`) | 704 | 15.4% |
| Tools (`src/tools/`) | 546 | 11.9% |
| Schema Kernel (`src/schema-kernel/`) | 193 | 4.2% |
| Shared (`src/shared/`) | 80 | 1.7% |
| Plugin Assembly (`src/plugin.ts`) | 77 | 1.7% |
| Public API (`src/index.ts`) | 14 | 0.3% |
| AGENTS.md notes (`src/lib/AGENTS.md`) | — | — |

## Test Coverage Map

### Test Files — Total: 5,623 LOC

| Source Module | Test File | Test LOC | Status |
|--------------|-----------|----------|--------|
| `src/lib/delegation-manager.ts` | `tests/lib/delegation-manager.test.ts` | 1099 | ✅ Covered |
| `src/lib/session-api.ts` | `tests/lib/session-api.test.ts` | 478 | ✅ Covered |
| `src/lib/helpers.ts` | `tests/lib/helpers.test.ts` | 452 | ✅ Covered |
| `src/lib/concurrency.ts` | `tests/lib/concurrency.test.ts` | 375 | ✅ Covered |
| `src/lib/completion-detector.ts` | `tests/lib/completion-detector.test.ts` | 326 | ✅ Covered |
| `src/lib/completion-detector.ts` | `tests/lib/completion-detector-crash.test.ts` | 238 | ✅ Covered (crash scenarios) |
| `src/lib/notification-handler.ts` | `tests/lib/notification-handler.test.ts` | 262 | ✅ Covered |
| `src/lib/runtime-policy.ts` | `tests/lib/runtime-policy.test.ts` | 253 | ✅ Covered |
| `src/lib/state.ts` | `tests/lib/state.test.ts` | 207 | ✅ Covered |
| `src/lib/task-status.ts` | `tests/lib/task-status.test.ts` | 199 | ✅ Covered |
| `src/lib/continuity.ts` | — | — | ❌ No dedicated test file |
| `src/lib/runtime.ts` | — | — | ❌ No dedicated test file |
| `src/lib/lifecycle-manager.ts` | — | — | ❌ No dedicated test file (stub) |
| `src/tools/delegate-task.ts` | `tests/tools/delegate-task.test.ts` | 253 | ✅ Covered |
| `src/tools/delegation-status.ts` | `tests/tools/delegation-status.test.ts` | 264 | ✅ Covered |
| `src/tools/session-patch/` | `tests/tools/session-patch.test.ts` | 193 | ✅ Covered |
| `src/tools/prompt-analyze/` | `tests/tools/prompt-analyze.test.ts` | 129 | ✅ Covered |
| `src/tools/prompt-skim/` | `tests/tools/prompt-skim.test.ts` | 120 | ✅ Covered |
| `src/schema-kernel/` | `tests/schema-kernel/prompt-enhance.schema.test.ts` | 457 | ✅ Covered |
| Integration | `tests/integration/prompt-enhance-pipeline.test.ts` | 250 | ✅ Covered |
| Plugin | `tests/plugins/prompt-enhance-compaction.test.ts` | 10 | ⚠️ Minimal |

### Coverage Gaps

| Module | Risk | Priority |
|--------|------|----------|
| `continuity.ts` (401 LOC) | HIGH — persistence layer has no direct tests | High |
| `runtime.ts` (95 LOC) | MEDIUM — event→status mapping untested | Medium |
| `lifecycle-manager.ts` (135 LOC) | LOW — stub, will need tests when restored | Low |

## Public API Surface

`src/index.ts` re-exports the following for external consumers:

```typescript
// Primary export
export { HarnessControlPlane } from "./plugin.js"
export { HarnessControlPlane as default } from "./plugin.js"

// Core library re-exports
export * from "./lib/concurrency.js"          // DelegationConcurrencyQueue, SpawnReservation, reserveSubagentSpawn
export * from "./lib/continuity.js"           // getSessionContinuity, recordSessionContinuity, patchSessionContinuity, etc.
export * from "./lib/helpers.js"              // isObject, asString, getNestedValue, unwrapData, buildPromptText, etc.
export * from "./lib/lifecycle-manager.js"    // HarnessLifecycleManager, createHarnessLifecycleManager
export * from "./lib/runtime.js"              // inferContinuityStatusFromEvent
export * from "./lib/session-api.js"          // createSession, getSession, sendPrompt, getSessionID, etc.
export * from "./lib/state.js"                // taskState, ensureSessionStats, getDelegationMeta, etc.
export * from "./lib/types.js"                // All types, constants, status enums
export * from "./lib/task-status.js"          // VALID_TRANSITIONS, canTransition, isTerminal
export * from "./lib/completion-detector.js"  // CompletionDetector, CompletionSignal, CompletionResult
export * from "./lib/runtime-policy.js"       // DEFAULT_RUNTIME_POLICY, loadRuntimePolicy, getRuntimePolicyForSession
```

**NOT re-exported (internal only):**
- `src/lib/delegation-manager.ts` — accessed via tools, not direct API
- `src/lib/notification-handler.ts` — internal hook consumer
- `src/hooks/*` — registered by plugin, not exposed
- `src/tools/*` — registered by plugin as named tools
- `src/shared/*` — tool-internal utilities
- `src/schema-kernel/*` — pipeline-internal schemas

## File Ownership

| File | Owns | Responsibility |
|------|------|----------------|
| `src/plugin.ts` | Plugin lifecycle | Wires all dependencies, returns Plugin object |
| `src/index.ts` | Public API | Barrel re-exports for npm package |
| `src/lib/types.ts` | Type authority | All shared types and constants |
| `src/lib/delegation-manager.ts` | Delegation lifecycle | WaiterModel dispatch, dual-signal completion, persistence |
| `src/lib/continuity.ts` | Durable state | JSON file I/O, normalization, deep cloning |
| `src/lib/concurrency.ts` | Concurrency control | Keyed semaphore, priority queues, budget reservations |
| `src/lib/state.ts` | In-memory state | Session stats, root budgets, delegation metadata |
| `src/lib/runtime-policy.ts` | Policy resolution | Validation, workspace/session merge |
| `src/lib/session-api.ts` | SDK interface | Typed wrappers, session ID validation |
| `src/lib/helpers.ts` | Pure utilities | No side effects, no state |
| `src/lib/notification-handler.ts` | Notifications | Message formatting and delivery |
| `src/lib/lifecycle-manager.ts` | Session lifecycle | State machine (currently stub) |
| `src/lib/completion-detector.ts` | Completion signals | Watcher pattern, stability detection |
| `src/lib/runtime.ts` | Event mapping | Transport signal → continuity status |
| `src/lib/task-status.ts` | Status guards | Transition validation table |
| `src/hooks/create-core-hooks.ts` | Core event routing | event, system.transform, shell.env |
| `src/hooks/create-session-hooks.ts` | Session behavior | Auto-loop, compaction context |
| `src/hooks/create-tool-guard-hooks.ts` | Tool guards | Circuit breaker, budget, metadata |
| `src/hooks/messages-transform.ts` | Message transform | Prompt-enhance context injection |
| `src/hooks/types.ts` | Hook types | HookDependencies interface |
| `src/tools/delegate-task.ts` | Delegation tool | Agent dispatch via WaiterModel |
| `src/tools/delegation-status.ts` | Status tool | Delegation query/filter |
| `src/tools/prompt-skim/` | Prompt analysis | Word/token count, URL extraction |
| `src/tools/prompt-analyze/` | Prompt analysis | Contradiction/vagueness detection |
| `src/tools/session-patch/` | Session patching | File section replacement |
| `src/shared/tool-response.ts` | Response envelope | success/error/pending + type guards |
| `src/shared/tool-helpers.ts` | Tool utilities | JSON serialization helper |
| `src/schema-kernel/` | Schema contracts | Zod schemas for prompt-enhance pipeline |

## Where to Add New Code

### New Core Module
- **Location:** `src/lib/<module-name>.ts`
- **Rules:** Import from `types.ts` first; max 2-level dependency chain; max 500 LOC
- **Test:** `tests/lib/<module-name>.ts`
- **Export:** Add to `src/index.ts` if part of public API

### New Hook
- **Location:** `src/hooks/create-<hook-name>.ts`
- **Factory pattern:** Export function that takes `HookDependencies` and returns hook handlers
- **Registration:** Wire in `src/plugin.ts` within `HarnessControlPlane`
- **Test:** `tests/hooks/` (create directory if needed)

### New Tool
- **Location:** `src/tools/<tool-name>/index.ts` (factory), `tools.ts` (implementation), `types.ts` (types)
- **Use:** `import { tool } from "@opencode-ai/plugin/tool"` and `zod` for schemas
- **Response:** Use `success()`/`error()` from `src/shared/tool-response.ts`
- **Registration:** Add to `src/plugin.ts` → `tool: { ... }` object
- **Test:** `tests/tools/<tool-name>.ts`

### New Type/Constant
- **Location:** `src/lib/types.ts` (LEAF — no imports)
- **Rules:** If a type needs imports, put it in the module that owns it, not types.ts

### Change Existing Module
- **See:** File Ownership table above for which file owns what
- **Verify:** Run `npm run typecheck` and `npm test` after changes

## Special Directories

### `dist/`
- Purpose: Compiled TypeScript output
- Generated: Yes (by `npm run build`)
- Committed: Yes (for npm package resolution)
- Clean: `npm run build` does clean rebuild

### `.opencode/`
- Purpose: Soft meta-concepts — skills, agents, commands, rules
- Generated: Partially (some generated, some hand-written)
- Committed: Yes

### `.planning/`
- Purpose: GSD planning documents (ROADMAP.md, phase plans, codebase maps)
- Generated: Yes (by GSD commands)
- Committed: Yes

### `docs/`
- Purpose: Architecture proposals, design documents
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-21*
