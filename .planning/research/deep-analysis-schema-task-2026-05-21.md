# Deep Analysis: Schema Kernel & Task Management

**Analysis Date:** 2026-05-21

**Scope:** `src/schema-kernel/` (validation authority, 20 schema files) + `src/task-management/` (durable state, 12 files across 4 submodules)

---

## 1. Schema-Kernel Overview

### 1.1 What It Is

`src/schema-kernel/` is the **Zod v4 validation contract layer** for the Hard Harness. It provides:
- Type definitions (inferred via `z.infer<>`) for tools and runtime modules
- `safeParse` / `parse` functions for validating tool inputs at runtime
- A `validateWithFallback()` helper for strict-first + lenient-strip parsing with warnings
- A `generate-config-json-schema.ts` that derives a JSON Schema from the `HivemindConfigsSchema` for IDE integration

**Location:** `src/schema-kernel/` — 21 directory entries (20 `.ts` files + `AGENTS.md`)

### 1.2 Current File Inventory

| File | LOC | Purpose | Has Consumer? | Has Test? |
|------|-----|---------|---------------|-----------|
| `index.ts` | 337 | Barrel + `validateWithFallback()` helper | 2 consumers (`config/compiler.ts`, `config/subscriber.ts`) | Via opencode-config test (validateWithFallback) |
| `agent-frontmatter.schema.ts` | 168 | Agent YAML frontmatter validation | Barrel only | Yes (opencode-config) |
| `agent-work-contract.schema.ts` | 148 | Agent work contract tool inputs | `tools/hivemind/hivemind-agent-work.ts`, `features/agent-work-contracts/store.ts` | No dedicated schema test |
| `bootstrap.schema.ts` | 109 | Bootstrap init/recover input/output | `tools/config/bootstrap-init.ts`, `tools/config/bootstrap-recover.ts`, `cli/commands/init.ts`, `cli/commands/recover.ts` | No dedicated schema test |
| `command-engine.schema.ts` | 32 | hivemind-command-engine input | Barrel only | No test |
| `command-frontmatter.schema.ts` | 104 | Command YAML frontmatter | Barrel only | Yes (opencode-config) |
| `config-precedence.schema.ts` | 76 | Config precedence level + opencode.json | Barrel only | Partial (ConfigPrecedenceLevelSchema) |
| `doc-intelligence.schema.ts` | 16 | hivemind-doc tool input | `tools/hivemind/hivemind-doc.ts` | No test |
| `generate-config-json-schema.ts` | 149 | JSON Schema generation from Zod | `index.ts` barrel | Yes (134 LOC test) |
| `hivemind-configs.schema.ts` | 446 | Full `.hivemind/configs.json` schema + read/write helpers | `config/subscriber.ts`, `hooks/types.ts`, `config/compiler.ts` | Yes (640 LOC test) |
| `mcp-server.schema.ts` | 124 | MCP server registry schemas | Barrel only | Partial (MCPServerConfigSchema) |
| `permission.schema.ts` | 168 | OpenCode permission rulesets | Barrel only — **DEAD** | Partial (PermissionActionSchema, PermissionRuleSchema, PatternBasedPermissionSchema) |
| `prompt-enhance.schema.ts` | 169 | Skim/analyze/patch pipeline output | `index.ts` barrel | Yes (457 LOC test) |
| `runtime-pressure.schema.ts` | 55 | hivemind-pressure tool input | Barrel only | No test |
| `sdk-supervisor.schema.ts` | 16 | hivemind-sdk-supervisor input | Barrel only | No test |
| `session-tracker.schema.ts` | 141 | Three tool inputs: tracker, hierarchy, context | `tools/hivemind/session-tracker.ts`, `session-hierarchy.ts`, `session-context.ts` | Tested through tool tests |
| `session-view.schema.ts` | 37 | hivemind-session-view tool input + delegation filter | `tools/hivemind/hivemind-session-view.ts` | No test |
| `skill-metadata.schema.ts` | 111 | Skill metadata/frontmatter validation | Barrel only — **DEAD** | Partial (SkillNameSchema etc.) |
| `tool-definition.schema.ts` | 74 | Custom tool definition schema | Barrel only — **DEAD** | Partial (ToolDefinitionSchema) |
| `trajectory.schema.ts` | 49 | hivemind-trajectory tool input + parse helper | `tools/hivemind/hivemind-trajectory.ts` | No test |

### 1.3 Dead Schema Classification

**Definition:** A schema file exported from `index.ts` barrel but with **zero consumers** outside `schema-kernel/` itself.

| Schema | Status | Consumer Check |
|--------|--------|----------------|
| `permission.schema.ts` | **CONFIRMED DEAD** | No source file imports it (outside barrel + `agent-frontmatter.schema.ts` comment reference) |
| `tool-definition.schema.ts` | **CONFIRMED DEAD** | No source file imports it outside barrel |
| `skill-metadata.schema.ts` | **CONFIRMED DEAD** | No source file imports it outside barrel |
| `mcp-server.schema.ts` | **LIVING-AS-BARREL** | Barrel only; `opencode.json` MCP section is opaque in `config-precedence` schema |
| `config-precedence.schema.ts` | **LIVING-AS-BARREL** | Barrel only; referenced by type imports only |
| `command-engine.schema.ts` | **LIVING-AS-BARREL** | Barrel only |
| `runtime-pressure.schema.ts` | **LIVING-AS-BARREL** | Barrel only |
| `sdk-supervisor.schema.ts` | **LIVING-AS-BARREL** | Barrel only |

**Implication:** 3 files (permission, tool-definition, skill-metadata) consume maintenance effort but serve no runtime purpose. They remain because they map to OpenCode meta-concepts that *might* have consumers in the future. However, they bloat the barrel and add complexity to the type exports without usage.

---

## 2. Schema → Tool Mapping Table

| Tool / Tool Group | Schema File(s) | Relationship |
|-------------------|----------------|--------------|
| `hivemind-doc` | `doc-intelligence.schema.ts` | 1:1 — single schema, single tool |
| `hivemind-trajectory` | `trajectory.schema.ts` | 1:1 — single schema, single tool |
| `hivemind-pressure` | `runtime-pressure.schema.ts` | 1:1 — single schema, single tool |
| `hivemind-sdk-supervisor` | `sdk-supervisor.schema.ts` | 1:1 — single schema, single tool |
| `hivemind-command-engine` | `command-engine.schema.ts` | 1:1 — single schema, single tool |
| `hivemind-agent-work-create/export` | `agent-work-contract.schema.ts` | 1:1 — two tool inputs from one schema |
| `hivemind-session-view` | `session-view.schema.ts` | 1:1 |
| `session-tracker`, `session-hierarchy`, `session-context` | `session-tracker.schema.ts` | 1:3 — one schema file serving 3 tools (discriminated unions per action group) |
| `bootstrap-init`, `bootstrap-recover` | `bootstrap.schema.ts` | 1:2 — one schema serving 2 tools |
| `prompt-skim`, `prompt-analyze`, `session-patch` | `prompt-enhance.schema.ts` | 1:N — one schema for 3 tools (output contracts) |
| `configure-primitive` | Barrel (`index.ts`) | N:N — multiple schemas re-exported |
| `validate-restart` | Barrel (`index.ts`) | N:N — multiple schemas re-exported |
| No tool (dead) | `permission.schema.ts` | **Orphaned** — no consuming tool |
| No tool (dead) | `tool-definition.schema.ts` | **Orphaned** — no consuming tool |
| No tool (dead) | `skill-metadata.schema.ts` | **Orphaned** — no consuming tool |

**Pattern assessment:** The 1:1 mapping is the dominant pattern (7 of 11 alive schemas). The `session-tracker.schema.ts` 1:3 pattern and `prompt-enhance.schema.ts` 1:N pattern are exceptions. The dead schemas have no tool mapping at all.

---

## 3. Schema Test Coverage Matrix

| Schema | Unit Test | Test File | Coverage Quality |
|--------|-----------|-----------|------------------|
| `agent-frontmatter.schema.ts` | ✅ Full | `opencode-config.schemas.test.ts` | Good — name, frontmatter, file, lenient variants |
| `command-frontmatter.schema.ts` | ✅ Full | `opencode-config.schemas.test.ts` | Good — name, frontmatter, features, file |
| `permission.schema.ts` | ✅ Partial | `opencode-config.schemas.test.ts` | Only action, rule, pattern-based tested. Ruleset union, combination, and override NOT tested |
| `skill-metadata.schema.ts` | ✅ Partial | `opencode-config.schemas.test.ts` | Name, frontmatter, file, discovery location tested. Lenient variants covered |
| `tool-definition.schema.ts` | ✅ Partial | `opencode-config.schemas.test.ts` | ToolDefinitionSchema, ToolFileSchema, lenient variants tested |
| `config-precedence.schema.ts` | ✅ Partial | `opencode-config.schemas.test.ts` | ConfigPrecedenceLevelSchema only. ConfigSource and OpenCodeConfig NOT tested |
| `mcp-server.schema.ts` | ✅ Partial | `opencode-config.schemas.test.ts` | MCPServerConfigSchema only. Individual local/remote NOT tested in isolation |
| `prompt-enhance.schema.ts` | ✅ Full | `prompt-enhance.schema.test.ts` | All result schemas tested independently |
| `hivemind-configs.schema.ts` | ✅ Full | `hivemind-configs.schema.test.ts` | 640 LOC — comprehensive, all fields, defaults, edge cases |
| `generate-config-json-schema.ts` | ✅ Full | `generate-config-json-schema.test.ts` | Good — schema generation and normalization |
| `session-tracker.schema.ts` | ⚠️ Tool-test only | `tests/tools/hivemind/session-*.test.ts` | Used/integration-tested via tool parsing, but no isolated unit tests |
| `session-view.schema.ts` | ❌ None | — | No dedicated test |
| `runtime-pressure.schema.ts` | ❌ None | — | No dedicated test |
| `sdk-supervisor.schema.ts` | ❌ None | — | No dedicated test |
| `command-engine.schema.ts` | ❌ None | — | No dedicated test |
| `trajectory.schema.ts` | ❌ None | — | No dedicated test |
| `bootstrap.schema.ts` | ❌ None | — | No dedicated test |
| `doc-intelligence.schema.ts` | ❌ None | — | No dedicated test |
| `agent-work-contract.schema.ts` | ❌ None | — | No dedicated test |

**Key gaps:**
- 9 of 19 schemas have zero test coverage
- The dead schemas (permission, tool-definition, skill-metadata) ARE partially tested, while live schemas like trajectory, bootstrap, agent-work-contract have no tests
- `session-tracker.schema.ts` is the largest untested schema (141 LOC)

---

## 4. The `index.ts` Barrel (337 LOC) — What It Actually Does

The `index.ts` is a **re-export barrel** with one piece of real logic: `validateWithFallback()`.

### `validateWithFallback()` (lines 18-51)

```typescript
function validateWithFallback<T>(
  strictSchema: z.ZodSchema<T>,
  lenientSchema: z.ZodSchema<T>,
  data: unknown,
  context: string,
): { success: true; data: T; warnings: string[] } | { success: false; error: z.ZodError }
```

**Logic:**
1. Try strict schema `safeParse`
2. If strict fails AND all errors are "unrecognized keys", try lenient schema
3. If lenient succeeds, return data + warnings about stripped keys
4. Otherwise return the strict error

**Quality assessment:** This is a useful pattern for handling forward-compatible configs. However, the message check `issue.message.includes("Unrecognized key")` is fragile — it depends on Zod v4's English error message format. The `issue.code === "unrecognized_keys"` check is the more reliable approach and is present as an OR condition.

### Barrel re-exports pattern

The barrel exports 19 schema modules + 1 generated function module + the helper function. Each schema module follows the same two-step pattern:
1. Export schemas (Zod objects)
2. Export types (inferred types)

This is clean and consistent. The types are exported as-is (no renaming or transformation needed).

---

## 5. Schema Quality Assessment

### 5.1 Strengths

**Consistent pattern:** Every schema file follows the same structure:
- Named `kebab-case.schema.ts`
- `strict()` + `.strip()` lenient variant
- Named exports with clear prefixes
- Inferred types exported separately
- `safeSessionId` cross-schema guard in session-tracker.schema.ts (reused by session-view.schema.ts)

**Bootstrap schema: well-factored** — clean separation of input/output contracts with shared types (BootstrapScope)

**HivemindConfigsSchema: production-quality** — 446 LOC with read/write helpers, legacy key migration, and explicit error handling. The `readConfigs()` function gracefully degrades to defaults on corrupt/missing files. The `validateConfigsFile()` diagnostic variant provides non-fallback validation.

**WorkflowConfigSchema: well-designed** — uses `WorkflowConfigInnerSchema` with `.default(() => WorkflowConfigInnerSchema.parse({}))` to satisfy Zod v4 default type requirements. Every field has a `@future-consumer` annotation.

**Discriminated unions in session-tracker schema:** Clean action-based discriminated unions for all three tool inputs (tracker, hierarchy, context). The `safeSessionId` refinement prevents path traversal at the Zod boundary.

### 5.2 Issues Found

**Bug in `permission.schema.ts` (line 10):**
```typescript
export const PermissionActionSchema = z.enum(["allow", "ask", "ask"])
```
The enum contains `"ask"` twice instead of `"allow"`, `"ask"`, `"auto"`. This is a clear copy-paste bug — the third value should be `"auto"` (matching the [OpenCode permission specification](https://opencode.ai/docs/permissions) which has three states: allow, ask, auto). The test at `opencode-config.schemas.test.ts:197` confirms this gap: `it('rejects "block"')` passes, but no test asserts that `"auto"` is valid.

**Also in `permission.schema.ts` (line 116-123):**
```typescript
export const PermissionRulesetSchema = z.union([
  PatternBasedPermissionSchema,
  RulesBasedPermissionSchema,
  // Combination: pattern-based keys + optional "rules" array + optional compatibility version
  z.object({
    rules: z.array(PermissionRuleSchema).optional(),
    compatibilityVersion: z.string().optional(),
  }).catchall(PatternEntrySchema),
])
```
The `catchall()` allows `PatternEntrySchema` (which is `z.record(z.string(), PermissionActionSchema)`) as a catch-all for arbitrary keys. However, the `PatternEntrySchema` does NOT validate against the action enum properly — it accepts any string key mapping to "allow"/"ask"/"ask" (the duplicate). This combination variant is untested.

**`validateWithFallback` fragility (line 32-33):**
```typescript
const hasOnlyUnrecognizedKeys = issues.every((issue) =>
  issue.message.includes("Unrecognized key") ||
  issue.code === "unrecognized_keys",
)
```
The `issue.message.includes("Unrecognized key")` check depends on Zod v4's English error message format. If Zod changes locale or message format, this silently produces false negatives (falling through to strict error return instead of stripping unknown keys).

**Bootstrap schema imports from hivemind-configs:**
Bootstrap schema imports `SupportedLanguageSchema`, `HivemindModeSchema`, `UserExpertLevelSchema`, and `DelegationSystemsSchema` from hivemind-configs. This creates a schema-to-schema dependency — bootstrap cannot exist without hivemind-configs. While this is a legitimate reuse pattern, it couples the bootstrap schema to the config schema without going through the barrel.

**No circular dependencies detected:** All imports flow one direction: tool schemas → hivemind-configs.schema.ts (for bootstrap) or session-tracker.schema.ts → (for session-view). The barrel has no internal circular references.

### 5.3 Dead Schema Review

**`permission.schema.ts` (168 LOC):** Well-structured schema for OpenCode permission rulesets. Defines 3 formats (pattern-based, rules-based, combination) and agent overrides. Despite being structurally sound, it is completely unused at runtime. The `agent-frontmatter.schema.ts:122` line `permission: z.record(z.string(), z.unknown()).optional()` references permissions as an opaque placeholder, not using the PermissionRulesetSchema.

**`tool-definition.schema.ts` (74 LOC):** Clean schema for custom tool definitions (name, description, args, exports). No consumers.

**`skill-metadata.schema.ts` (111 LOC):** Comprehensive skill metadata schema with name/directory name matching via `.refine()`. No consumers.

**Recommendation:** These should be either (a) removed to reduce maintenance surface, or (b) explicitly marked as "future-schema" with a `@future` JSDoc tag. Currently they masquerade as active schemas through barrel exports.

---

## 6. Task-Management Analysis

### 6.1 Module Overview

| Submodule | Files | LOC | Purpose |
|-----------|-------|-----|---------|
| `continuity/` | 3 source + 1 AGENTS.md | ~697 | Dual-layer session state (in-memory + JSON) |
| `journal/` | 4 source + 1 AGENTS.md | ~540 | Append-only event journal + query/replay |
| `lifecycle/` | 1 source + 1 AGENTS.md | ~242 | Session lifecycle state machine |
| `trajectory/` | 3 source + 1 AGENTS.md | ~421 | Execution lineage + evidence tracking |
| **Total** | **11 source** | **~1,900** | |

### 6.2 Continuity (`src/task-management/continuity/`)

**Files:**
- `index.ts` (467 LOC) — Core ContinuityStoreFile operations
- `delegation-persistence.ts` (196 LOC) — Delegation record I/O
- `store-cache.ts` (34 LOC) — Module-level in-memory cache

**Architecture:**

```
┌─────────────────────────────────────────┐
│            In-Memory Cache              │
│         store-cache.ts (singleton)      │
├─────────────────────────────────────────┤
│            ContinuityStoreFile           │
│   { version, updatedAt, sessions{},     │
│     governance }                        │
├─────────────────────────────────────────┤
│          .hivemind/state/               │
│  session-continuity.json (durable)      │
│  delegations.json (durable)             │
└─────────────────────────────────────────┘
```

**The `storeCache` layer** (`store-cache.ts`):
- A simple singleton: `let storeCache: ContinuityStoreFile | undefined`
- Three functions: `getStoreCache()`, `setStoreCache()`, `resetStoreCache()`
- Extracted from `continuity/index.ts` specifically to allow test reset (`resetStoreCache()`) without `vi.resetModules()`
- The cache is populated on first `ensureStoreLoaded()` call, then used for all subsequent reads until the module is reset

**Key API (11 public functions):**

| Function | Purpose | Mutates Disk? |
|----------|---------|---------------|
| `listSessionContinuity()` | Returns all records (deep-cloned) | No |
| `getSessionContinuity(sessionID)` | Single record lookup | No |
| `getSessionToolProfile(sessionID)` | Convenience getter | No |
| `getSessionPromptParams(sessionID)` | Convenience getter | No |
| `getSessionContinuityMetadata(sessionID)` | Convenience getter | No |
| `recordSessionContinuity(record)` | Create/replace record | Yes (via persistStore) |
| `patchSessionContinuity(sessionID, patch)` | Partial update metadata | Yes |
| `patchSessionDelegationPacket(sessionID, patch)` | Partial update delegation packet | Yes |
| `deleteSessionContinuity(sessionID)` | Remove record | Yes |
| `getGovernancePersistenceState()` | Read governance state | No |
| `recordGovernancePersistenceState(state)` | Write governance state | Yes |

**Is the 3-function API complete?** The `store-cache.ts` exposes exactly 3 functions: get, set, reset. This is complete for its purpose. The cache acts as a transparent performance layer — it never writes, only caches reads from disk. The `persistStore()` function in `index.ts` always writes through to disk, bypassing the cache for writes.

**Quality observations:**
- Deep-clone-on-read is enforced for every public getter. All nested objects (DelegationMeta, CompactionCheckpointData, DelegationPacket, etc.) are manually cloned per field — no spread shortcuts that would create aliasing.
- Atomic writes via temp file + `renameSync` prevent partial-write corruption.
- Redaction of sensitive fields (`prompt`, `result`, `error`, etc.) before disk write via `redactBoundaryFields()`.
- Legacy path compatibility bridge (`.opencode/state/hivemind/`) is preserved.
- `delegation-persistence.ts` has robust `normalizePersistedDelegation()` with backward-compatible field parsing.
- The `commit_docs` config gate (CA-03) controls whether delegation writes actually hit disk.
- The `atomic_commit` config gate controls whether continuity writes hit disk (in-memory batching otherwise).

### 6.3 Journal (`src/task-management/journal/`)

**Files:**
- `index.ts` (119 LOC) — Entry creation, append, serialization
- `execution-lineage.ts` (122 LOC) — Derived lineage projections
- `query.ts` (168 LOC) — Read-side journal queries
- `replay.ts` (131 LOC) — Time-machine state reconstruction

**Data flow:**

```
                    ┌──────────────────┐
                    │  Journal File     │
                    │  .hivemind/journal│
                    │  /YYYY-MM-DD.jsonl│
                    └────────┬─────────┘
                             │ read
                 ┌───────────▼───────────┐
                 │    query.ts            │
                 │  readJournalEntries()  │
                 │  queryBySession()      │
                 │  queryByEventType()    │
                 │  queryByTimeRange()    │
                 │  queryJournal()        │
                 └───────────┬───────────┘
                             │ entries
                 ┌───────────▼───────────┐
                 │    replay.ts           │
                 │  replayChronological() │
                 │  reconstructStateAt()  │
                 │  reduceJournalEntries()│
                 └───────────────────────┘
```

**Is it actually used?** The grep results show:
- `tests/lib/session-journal.test.ts` tests `appendJournalEntry`, `createJournalEntry`, `buildJournalId`
- `tests/lib/journal-query.test.ts` tests all query functions
- `tests/lib/journal-replay.test.ts` tests replay/reconstruct functions
- `tests/lib/execution-lineage.test.ts` tests `buildExecutionLineage`

**BUT:** No `src/` source file imports from `journal/` other than within the journal module itself and tests. The journal is **designed but not wired** into the runtime. It's a fully implemented, well-tested append-only audit trail that no living code path triggers.

**Execution lineage** (`execution-lineage.ts`) is also **unwired** — it creates derived projection records from continuity + delegation + journal data but has no runtime caller that invokes `buildExecutionLineage()`.

**The `idempotencyKey` mechanism:** Journal entries are deduplicated by idempotency key — `appendJournalEntry()` reads all existing keys from the JSONL file and skips duplicates. This is a read-and-check pattern that scales poorly (O(n) per append), but for the expected volume (hundreds, not millions of entries) it's acceptable.

### 6.4 Lifecycle (`src/task-management/lifecycle/`)

**File:** `index.ts` (242 LOC)

**Lifecycle State Machine:**

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ created  │────▶│  queued  │────▶│  dispatching  │────▶│ running  │
└────┬─────┘     └────┬─────┘     └──────┬────────┘     └──┬───────┘
     │                │                   │                │
     └───▶ failed ◀───┴───────────────────┴───▶ completed ◀┘
                      │                   
                      └───▶ all paths can reach failed
```

**Events handled (3 types via `handleEvent()`):**
1. `session.idle` → feeds `CompletionDetector` with idle signal
2. `session.error` → feeds `CompletionDetector` with error + error message
3. `session.deleted` → feeds `CompletionDetector` with deleted signal

**How many states?** 6 lifecycle phases: `created`, `queued`, `dispatching`, `running`, `completed`, `failed`

**Valid transitions (from `VALID_LIFECYCLE_TRANSITIONS`):**
- created → queued, dispatching, running, failed
- queued → dispatching, running, failed
- dispatching → running, completed, failed
- running → completed, failed
- completed → (terminal — no outgoing)
- failed → (terminal — no outgoing)

**Key capabilities:**
- `hydrateFromContinuity()` — rebuilds delegation state from persisted records at startup
- `noteObservedActivity()` — timestamps activity observations for stalled detection
- `replayPendingNotificationsForEvent()` — replays queued notifications when parent session events fire
- `cancelDelegatedSession()` — aborts via SDK, cancels completion detector, patches state to "failed"
- `requestAutoLoopRetry()` — sends prompt text for auto-loop retry
- `recordCompactionCheckpoint()` — captures checkpoint data + resets task stats
- `launchDelegatedSession()` — facades to DelegationManager.dispatch()

**Consumer check:** `hooks/types.ts` imports `HarnessLifecycleManager` type. `tests/plugins/plugin-lifecycle.test.ts` and `tests/lib/lifecycle-manager.test.ts` use it. In `src/`, it's used by `plugin.ts` at composition time (wire-only).

### 6.5 Trajectory (`src/task-management/trajectory/`)

**Files:**
- `types.ts` (128 LOC) — Type contracts
- `ledger.ts` (93 LOC) — File I/O for `.hivemind/state/trajectory-ledger.json`
- `store-operations.ts` (190 LOC) — CRUD operations
- `index.ts` (3 LOC) — Barrel (star re-export)

**Relationship to `hivemind-trajectory tool`:**

```
 hivemind-trajectory tool
 (src/tools/hivemind/hivemind-trajectory.ts)
        │
        │ imports schema from trajectory.schema.ts
        │ uses parseTrajectoryToolInput()
        ▼
 src/task-management/trajectory/
 ├── types.ts         (data contracts)
 ├── ledger.ts        (read/write ledger file)
 └── store-operations.ts  (CRUD: inspect, attach, checkpoint, event, close, traverse)
        │
        ▼
 .hivemind/state/trajectory-ledger.json
```

The trajectory module IS used by the `hivemind-trajectory` tool. The tool calls `parseTrajectoryToolInput()` from the schema kernel, then routes to the appropriate `store-operations.ts` function.

**Operations exposed:**
- `inspectTrajectoryLedger()` — read with optional single-trajectory focus
- `attachTrajectoryEvidence()` — upsert + append evidence refs
- `checkpointTrajectory()` — add checkpoint to upserted trajectory
- `eventTrajectory()` — add event to upserted trajectory
- `closeTrajectory()` — set status to "closed"
- `traverseTrajectory()` — filter by root session / session / trajectory, return edges

**Quality notes:**
- `boundText()` in store-operations is a safety valve — strips control characters, collapses whitespace, truncates to 2000 chars
- Evidence refs are deduplicated via `Set` merge
- `quarantineCorruptLedger()` provides audit trail for corrupt persisted data
- The `upsertTrajectory()` pattern (create-or-update) is clean and consistent

---

## 7. Task-Management Data Flow Diagram

```
                    OpenCode Runtime
                          │
                          │ events (session.created, session.idle, etc.)
                          ▼
                    ┌─────────────┐
                    │   Hooks     │
                    │ (src/hooks/)│
                    └──────┬──────┘
                           │ routes events via DI
                           ▼
              ┌──────────────────────────┐
              │  HarnessLifecycleManager │◄──── CompletionDetector
              │  (lifecycle/index.ts)    │      (dual-signal completion)
              └──────┬───────────┬───────┘
                     │           │
          patchSession│          │ calls DelegationManager.dispatch()
          Continuity()│          ▼
                     │   ┌──────────────────────┐
                     │   │  DelegationManager   │
                     │   │  (coordination/)     │
                     │   └──────────┬───────────┘
                     │              │
                     │        persistDelegations()
                     │              │
                     ▼              ▼
              ┌──────────────────────────┐
              │   Continuity Store        │
              │   (continuity/index.ts)   │
              │                           │
              │   In-Memory Cache ◄──────►│
              │   (store-cache.ts)        │
              │         │                 │
              │         ▼                 │
              │  .hivemind/state/         │
              │  session-continuity.json  │
              │  delegations.json         │
              └──────────────────────────┘

              ┌──────────────────────────┐
              │   Session Journal         │◄──── (designed but NOT wired)
              │   (journal/index.ts)      │
              │   .hivemind/journal/      │
              │   YYYY-MM-DD.jsonl        │
              └──────────────────────────┘

              ┌──────────────────────────┐
              │   Trajectory Ledger       │◄──── hivemind-trajectory tool
              │   (trajectory/)           │
              │   .hivemind/state/        │
              │   trajectory-ledger.json  │
              └──────────────────────────┘
```

### Data Flow Summary

| Flow | Active? | Path |
|------|---------|------|
| Session lifecycle transitions | ✅ ACTIVE | Hooks → LifecycleManager → patchSessionContinuity() → continuity store |
| Delegation persistence | ✅ ACTIVE | DelegationManager → persistDelegations() → delegations.json |
| Trajectory reads/writes | ✅ ACTIVE | hivemind-trajectory tool → store-operations.ts → trajectory-ledger.json |
| Journal append | ⚠️ UNWIRED | `appendJournalEntry()` exists but no runtime code calls it |
| Execution lineage | ⚠️ UNWIRED | `buildExecutionLineage()` exists but no runtime code calls it |
| Journal query/replay | ⚠️ UNWIRED | `queryJournal()`, `reconstructStateAt()` exist but no runtime code calls them |

---

## 8. Critical Findings Summary

### Bug
1. **`permission.schema.ts:10` — Duplicate enum value**: `z.enum(["allow", "ask", "ask"])` — third value should be `"auto"`. Both `"ask"` entries produce identical Zod behavior at runtime, but the missing `"auto"` means agent configurations using auto-mode permissions will be rejected.

### Dead Code
2. **3 dead schema files**: `permission.schema.ts`, `tool-definition.schema.ts`, `skill-metadata.schema.ts` have zero consumers outside the barrel. They account for 353 LOC of maintenance surface.
3. **Journal module is unwired**: `journal/index.ts`, `query.ts`, `replay.ts`, and `execution-lineage.ts` are fully implemented but no production code invokes them. 540 LOC of append-only audit trail with no runtime trigger.

### Coverage Gaps
4. **9 of 19 schemas lack dedicated tests**: Most critically, `trajectory.schema.ts` (used by live hivemind-trajectory tool), `bootstrap.schema.ts` (used by 2 CLI commands + 2 tools), and `agent-work-contract.schema.ts` have zero test coverage.
5. **`validateWithFallback` has fragile locale-dependent check**: The message string match `"Unrecognized key"` is brittle.

### Quality Issues
6. **`replayPendingNotificationsForEvent()` swallows errors silently**: `catch { // Best-effort replay` — errors during notification replay are invisible.
7. **Journal idempotency is O(n) per append**: `existingIdempotencyKeys()` reads the entire file and splits by lines on every append. Acceptable at low volume but doesn't scale.
8. **`CANONICAL_STATE_DIR` hardcoded**: `continuity/index.ts:22` hardcodes `process.cwd()` — this works for single-project OpenCode sessions but will break if OpenCode changes the working directory between sessions.

---

## 9. Recommendations

### Phase 19 (Non-Destructive Remediation) Scope
1. **Fix `permission.schema.ts:10`**: Change `"ask"` duplicate to `"auto"` — 1-line fix
2. **Mark dead schemas**: Add `@future` JSDoc tags to `permission.schema.ts`, `tool-definition.schema.ts`, `skill-metadata.schema.ts` — or remove them if the project decides they'll never ship

### Post-Phase-19
3. **Wire journal into lifecycle**: Add `appendJournalEntry()` calls in `HarnessLifecycleManager.handleEvent()` for session state transitions
4. **Add unit tests for all alive schemas**: Priority on `bootstrap.schema.ts`, `agent-work-contract.schema.ts`, `trajectory.schema.ts`
5. **Harden `validateWithFallback`**: Remove the message-string check, rely only on `issue.code === "unrecognized_keys"`
6. **Replace hardcoded `process.cwd()`**: Make the continuity state directory configurable via the existing `OPENCODE_HARNESS_STATE_DIR` env var

---

*Research analysis: 2026-05-21*
