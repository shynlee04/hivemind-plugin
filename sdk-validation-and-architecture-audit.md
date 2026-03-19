# SDK Validation & Architecture Audit Report

> Audit Date: 2026-03-20 | SDK Version: `@opencode-ai/plugin@1.2.27` | `@opencode-ai/sdk@^1.2.27`

---

## Part 1: Planning Artifact Validation Against SDK

Validated [the-agent-work-contract-planning-artifact.md](file:///Users/apple/hivemind-plugin/.experimental-planning/the-agent-work-contract-planning-artifact.md) against the three packed SDK references.

### ✅ Confirmed Accurate

| Artifact Claim | SDK Evidence | Verdict |
|---|---|---|
| [event](file:///Users/apple/hivemind-plugin/src/plugin/opencode-plugin.ts#67-70) hook delivers `session.created` | `event?: (input: { event: Event }) => Promise<void>` in SDK `Hooks` interface | ✅ Correct |
| `chat.message` hook for per-turn reset | `"chat.message"?: (input: { sessionID, agent?, model?, messageID?, variant? }, output: { message, parts })` | ✅ Correct |
| `tool()` from `@opencode-ai/plugin` for tool creation | Confirmed in SDK — `tool.schema` is Zod re-export | ✅ Correct |
| `client.session.create()` for delegation | Multiple examples in SDK: `client.session.create({ workspaceID })` | ✅ Correct |
| `client.tui.showToast()` for user-facing alerts | Used in codebase and documented in SDK client API | ✅ Correct |
| JSON as schema format with Zod validation | Already used for all `.hivemind/` state files | ✅ Correct |
| [TurnSnapshotLoader](file:///Users/apple/hivemind-plugin/src/plugin/runtime-snapshot.ts#6-10) caches per-turn | [runtime-snapshot.ts](file:///Users/apple/hivemind-plugin/src/plugin/runtime-snapshot.ts) — lazy `Promise` cache, reset on `chat.message` | ✅ Correct |

### ⚠️ Naming Discrepancies (Not Wrong, But Imprecise)

| Artifact Uses | Actual SDK Name | Impact |
|---|---|---|
| `session.compacting` | `"experimental.session.compacting"` | **Must use full name in code** |
| `messages.transform` | `"experimental.chat.messages.transform"` | **Must use full name in code** |
| `system.transform` | `"experimental.chat.system.transform"` | **Must use full name in code** |
| `text.complete` | `"experimental.text.complete"` | **Must use full name in code** |

> [!IMPORTANT]
> The artifact's Section 4 references `session.compacting` and `messages.transform` as shorthand. The plugin entry [opencode-plugin.ts](file:///Users/apple/hivemind-plugin/src/plugin/opencode-plugin.ts) already uses the correct `experimental.*` names (lines 147, 187). The **artifact should be corrected** to use canonical SDK names.

### ⚠️ Partial Accuracy / Aspirational Claims

| Claim | Reality |
|---|---|
| "Use SDK client to read session state via `client.session.get()`" | SDK has `client.session.get()` but the codebase doesn't use it — still reads `.hivemind/` files directly. This is **aspirational**, not current. |
| "Chain actions as hook registrations" | No such mechanism exists in SDK. This is a **custom abstraction** the artifact proposes building. |
| `import { tool } from '@opencode-ai/plugin/tool'` | SDK export is `import { tool } from '@opencode-ai/plugin'`. The `/tool` subpath doesn't exist. |

### ✅ json-render & octto Validation

| Claim | SDK Evidence |
|---|---|
| `defineSchema` from `@json-render/core` | Confirmed: `export function defineSchema<TDef>()` at [schema.ts](file:///Users/apple/hivemind-plugin/.repo-sdk-packed/json-render.xml) line 82291 |
| `SpecStream` uses RFC 6902 JSON Patches | Confirmed: `createSpecStreamCompiler`, `compileSpecStream`, `parseSpecStreamLine`, `applySpecStreamPatch` all exported |
| octto branch-based exploration with `SessionStore` | Confirmed: `src/session/`, `src/state/`, `src/tools/` — bootstrapper → probe → orchestrator pattern |
| octto uses `@opencode-ai/sdk` `AgentConfig` type | Confirmed: `import type { AgentConfig } from "@opencode-ai/sdk"` |

> [!NOTE]
> The artifact's json-render example code on line 303-328 is **inspirational pseudocode** — `s.ref('catalog.workTypes')` and `s.map({ props: s.zod() })` are not real json-render API. The actual `defineSchema` API uses a builder pattern with `s.string()`, `s.object()`, `s.array()` etc.

---

## Part 2: Codebase Audit — Shared Interfaces & Cross-Module Coupling

### God-Function: `loadRuntimeBindingsSnapshot`

**11 files** consume this across 5 domains:

| Consumer | Domain |
|---|---|
| [event-handler.ts](file:///Users/apple/hivemind-plugin/src/hooks/event-handler.ts) | hooks |
| [tool-governance.ts](file:///Users/apple/hivemind-plugin/src/hooks/runtime-loader/tool-governance.ts) | hooks |
| [runtime-snapshot.ts](file:///Users/apple/hivemind-plugin/src/plugin/runtime-snapshot.ts) | plugin |
| [attachment.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/attachment.ts) | features (definition + consumers) |
| [settings.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/settings.ts) | features |
| [harness.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/harness.ts) | features |
| [handler-shared.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/handler-shared.ts) | features |
| [init.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/init.ts) | features |
| [doctor.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/doctor.ts) | features |
| [status.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-observability/status.ts) | features |
| [settings.ts](file:///Users/apple/hivemind-plugin/src/cli/settings.ts) | cli |

> [!CAUTION]
> The `TurnSnapshotLoader` in `runtime-snapshot.ts` is the **only** per-turn cache. All other consumers call `loadRuntimeBindingsSnapshot` independently, causing **7+ I/O ops per call site**. The plugin itself routes through `TurnSnapshotLoader`, but CLI, features, and hooks do not.

### `inspectWorkflowAuthority` — 6 Files, 4 Domains

| Consumer | Domain |
|---|---|
| [start-work-router.ts](file:///Users/apple/hivemind-plugin/src/hooks/start-work/start-work-router.ts) | hooks |
| [task.ts](file:///Users/apple/hivemind-plugin/src/features/workflow/task.ts) | features |
| [attachment.ts](file:///Users/apple/hivemind-plugin/src/features/runtime-entry/attachment.ts) | features |
| [entry-kernel-state.ts](file:///Users/apple/hivemind-plugin/src/shared/entry-kernel-state.ts) | shared |
| [workflow-authority.ts](file:///Users/apple/hivemind-plugin/src/core/workflow-management/workflow-authority.ts) | core (definition) |
| [recovery-engine.ts](file:///Users/apple/hivemind-plugin/src/recovery/recovery-engine.ts) | recovery |

### LOC Violations & Type Monoliths

| File | LOC | Issue |
|---|---|---|
| [start-work-router.ts](file:///Users/apple/hivemind-plugin/src/hooks/start-work/start-work-router.ts) | **305** | Exceeds 300 LOC. `resolveStartWork()` is a single 150-line function doing purpose classification, lineage routing, trajectory assessment, workflow authority inspection, readiness gating, pressure signal resolution, and entry kernel building. |
| [intake-record.ts](file:///Users/apple/hivemind-plugin/src/shared/intake-record.ts) | **333** | Exceeds 300 LOC. `CreateIntakeRecordInput` has **15 fields** violating the 10-field decomposition principle. Manual validation instead of Zod. |
| [pressure-contract.ts](file:///Users/apple/hivemind-plugin/src/shared/pressure-contract.ts) | **270** | Within limit but carries a massive static library. `RuntimePressureContract` is 5 interfaces totaling 14 fields composed. |

### Barrel Re-export Chain

[src/index.ts](file:///Users/apple/hivemind-plugin/src/index.ts) re-exports from **11 domains** with zero boundary enforcement:

```typescript
export * from './core/index.js'
export * from './shared/index.js'
export * from './context/index.js'
export * from './control-plane/index.js'
export * from './delegation/index.js'
export * from './governance/index.js'
export * from './hooks/index.js'
export * from './commands/index.js'
export { HiveMindPlugin } from './plugin/opencode-plugin.js'
export * from './intelligence/index.js'
export * from './recovery/index.js'
export * from './tools/index.js'
```

### Multiple Writers to Same State

| State File | Writers |
|---|---|
| `trajectory-ledger.json` | trajectory tool, event handler, recovery engine, init, harness |
| `runtime-attachment.json` | init, settings, doctor, runtime command tool |
| `entry-kernel-state.json` | init, doctor, harness, entry-kernel-state module |

> No locking or coordination between writers — confirmed by examining code (no lock files, no mutex, no `proper-lockfile` usage in these hot paths).

---

## Part 3: Architecture Recommendations

### 1. Single Snapshot Authority (Highest Priority)

**Problem**: `loadRuntimeBindingsSnapshot` called from 11 files creating 7+ I/O ops per call.

**Recommendation**: Extend `TurnSnapshotLoader` to be the **sole** snapshot provider. All consumers receive the cached snapshot via dependency injection, not direct import.

```
Pattern: Provider → Consumer (no direct disk reads)

Plugin init → TurnSnapshotLoader (singleton per-turn)
├── hooks/ receive snapshot via closure
├── tools/ receive snapshot via context.metadata()
├── features/ receive snapshot as parameter
└── cli/ has its own separate loader (CLI ≠ plugin)
```

### 2. Decompose `start-work-router.ts` (Strategy Pattern)

**Problem**: 305 LOC single function doing 7 responsibilities in one pass.

**Recommendation**: Apply the **Chain of Responsibility** pattern:

```
src/hooks/start-work/
├── start-work-router.ts        # Thin orchestrator (~50 LOC)
├── resolvers/
│   ├── lineage-resolver.ts     # Already exists as lineage-router.ts ✅
│   ├── purpose-resolver.ts     # Already exists as purpose-classifier.ts ✅
│   ├── trajectory-resolver.ts  # Extract trajectory assessment
│   ├── workflow-resolver.ts    # Extract workflow authority check
│   ├── readiness-resolver.ts   # Already exists as readiness-gates.ts ✅
│   ├── pressure-resolver.ts    # Extract pressure signal resolution
│   └── risk-resolver.ts        # Extract risk level calculation
└── start-work-types.ts         # Already exists ✅
```

### 3. Zod-First Validation for All Serialized State

**Problem**: `intake-record.ts` uses 80+ lines of manual validation. `entry-kernel-state.ts` uses hand-parsed JSON with manual defaults.

**Recommendation**: Move to Zod schemas (already a dependency via `@json-render/core` and direct `zod@^4.3.6`). This aligns with the agent-work-contract schema approach in the planning artifact:

```typescript
// Pattern: Schema-first state management
const EntryKernelStateSchema = z.object({
  version: z.literal('v1'),
  state: z.enum(['uninitialized', 'repair-required', 'qa-pending', 'ready', 'blocked']),
  // ... fields with defaults via .default()
})

// Single parse+validate replaces 80 lines of manual checks
const parsed = EntryKernelStateSchema.safeParse(raw)
```

### 4. Interface Decomposition for Type Monoliths

**Problem**: `CreateIntakeRecordInput` (15 fields), `StartWorkDecision` (20+ fields).

**Recommendation**: Already partially applied in `intake-record.ts` with `IntakeRecordCore & IntakeRecordLineage & IntakeRecordWorkflow & IntakeRecordProfile`. Extend this pattern consistently:

```typescript
// Good pattern (already in intake-record.ts):
type IntakeRecord = IntakeRecordCore & IntakeRecordLineage & IntakeRecordWorkflow & IntakeRecordProfile

// Apply same to StartWorkDecision:
type StartWorkDecision = StartWorkSession & StartWorkRouting & StartWorkSafety & StartWorkContext
```

### 5. CQRS Write Boundary Enforcement

**Problem**: Multiple writers to the same `.hivemind/` files with no coordination.

**Recommendation**: Apply the **Repository Pattern** — one write authority per state file:

| State File | Single Writer | All Others |
|---|---|---|
| `trajectory-ledger.json` | `core/trajectory/trajectory-store.ts` | Read via snapshot |
| `runtime-attachment.json` | `features/runtime-entry/attachment.ts` | Read via snapshot |
| `entry-kernel-state.json` | `shared/entry-kernel-state.ts` | Read via snapshot |

Use `proper-lockfile` (already a dependency) for the write paths to prevent concurrent corruption.

### 6. Scoped Barrel Exports

**Problem**: `src/index.ts` exposes everything from 11 domains with zero encapsulation.

**Recommendation**: Replace `export *` with explicit named exports, organized by consumer need:

```typescript
// Plugin consumers only need:
export { HiveMindPlugin } from './plugin/opencode-plugin.js'
export type { RuntimeBindingsSnapshot } from './features/runtime-entry/attachment.js'

// CLI consumers need:
export { runInit, runDoctor, runHarness } from './cli/index.js'

// Shared types for tools:
export type { StartWorkDecision } from './features/session-entry/start-work-types.js'
```

### 7. `json-render` Integration Path

The planning artifact's proposal to use `defineSchema` + `SpecStream` for planning artifacts is architecturally sound. The correct API surface is:

```typescript
import { defineSchema, defineCatalog, createSpecStreamCompiler } from '@json-render/core'

// Schema defines structure
const contractSchema = defineSchema((s) => ({
  spec: s.object({ /* fields */ }),
  catalog: s.object({ /* enums */ }),
}))

// SpecStream for progressive building
const compiler = createSpecStreamCompiler<ContractSpec>()
compiler.push(jsonlChunk)  // → { result, newPatches }
```

> [!TIP]
> The artifact's pseudocode example (lines 303-328) needs to be rewritten to use the **actual** `defineSchema` API — `s.ref()` and `s.map()` are not real json-render primitives. Use `s.enum()`, `s.union()`, or `s.literal()` instead.

---

## Summary Matrix

| Dimension | Current State | Recommended Target |
|---|---|---|
| Snapshot access | 11 direct callers | 1 provider (TurnSnapshotLoader) |
| Router complexity | 305 LOC monolith | 7 focused resolvers + thin orchestrator |
| Validation | Manual 80-line checks | Zod schema `.safeParse()` |
| State writes | Multiple uncoordinated writers | Repository pattern + `proper-lockfile` |
| Type decomposition | 15-20 field monoliths | ≤10 fields, composed via intersection |
| Module boundary | `export *` from 11 domains | Scoped named exports |
| Hook naming | Shorthand in docs | Use canonical `experimental.*` names |
