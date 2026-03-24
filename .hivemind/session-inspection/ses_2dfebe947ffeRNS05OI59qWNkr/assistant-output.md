# Session Inspection Export

- ses_id: `ses_2dfebe947ffeRNS05OI59qWNkr`
- prepared_at: `2026-03-24T13:44:01.342Z`

## Assistant Output

Now let me compile the full audit report:

---

## Codebase Investigation Report — `src/control-plane/` Dead Code Audit

**Scope:** `src/control-plane/` directory
**Question:** Identify dead code, orphaned re-exports, and test coverage

---

### Files in `src/control-plane/`

| File | Status | Imports | Tests |
|-------|--------|---------|-------|
| `index.ts` | ORPHANED_REEXPORT | N/A | NO |
| `control-plane-types.ts` | LIVE | 9 consumers | NO |
| `control-plane-registry.ts` | LIVE | 5 consumers | YES |
| `control-plane-handler.ts` | LIVE | 2 consumers | NO |
| `control-plane-intake.ts` | LIVE | 6 consumers | NO |
| `sdk-runtime.ts` | LIVE | 2 consumers | YES |
| `AGENTS.md` | DOCUMENTATION | N/A | NO |

---

### Per-File Analysis

#### 1. `src/control-plane/index.ts`
- **Status:** ORPHANED (pure re-export barrel file)
- **Imports:** None (this IS the export surface)
- **Tests:** NO
- **Notes:** This file is a pure barrel re-export with no implementation. All exports come from the 4 submodules it re-exports. The file itself is healthy as a public API surface but contributes to import depth.

```typescript
// Actual content - pure re-export
export * from './control-plane-types.js'
export * from './control-plane-registry.js'
export * from './control-plane-intake.js'
export * from './control-plane-handler.js'
```

---

#### 2. `src/control-plane/control-plane-types.ts`
- **Status:** LIVE
- **Imports:** 
  - `src/features/session-entry/settings-delta.ts` (type import)
  - `src/features/session-entry/profile-resolution.ts` (type + value import)
  - `src/features/session-entry/intake.types.ts` (type import)
  - `src/features/session-entry/intake.gates.ts` (type import)
  - `src/features/session-entry/intake.constants.ts` (type import)
  - `src/features/runtime-entry/init.types.ts` (type import)
  - `src/control-plane/index.ts` (re-export)
  - `src/control-plane/control-plane-registry.ts` (internal import)
- **Tests:** NO (no direct test file)
- **Notes:** Core type definitions. Imported by 7+ modules via the barrel `index.ts`. No orphan type re-exports detected — all types are actually used in consuming modules.

---

#### 3. `src/control-plane/control-plane-registry.ts`
- **Status:** LIVE
- **Imports:** 
  - `tests/runtime-resilience.test.ts` (direct test import)
  - `src/features/runtime-entry/settings.ts`
  - `src/features/runtime-entry/init.handler.ts`
  - `src/features/runtime-entry/init-project.ts`
  - `src/control-plane/index.ts` (re-export)
- **Tests:** YES — `tests/runtime-resilience.test.ts`
- **Notes:** Houses 4 control plane primitives (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`) and gate resolution logic. Well-tested with dedicated resilience regression tests. Exports: `CONTROL_PLANE_CLI_COMMANDS`, `discoverControlPlanePrimitives`, `findControlPlanePrimitive`, `findControlPlanePrimitiveByCliCommand`, `resolveControlPlaneGate`, `isControlPlanePrimitiveId`.

---

#### 4. `src/control-plane/control-plane-handler.ts`
- **Status:** LIVE
- **Imports:** 
  - `src/features/runtime-entry/command.ts` (line 2, 98)
  - `src/commands/slash-command/command-runner.ts` (line 5, 32)
  - `src/control-plane/index.ts` (re-export)
- **Tests:** NO (no direct test file)
- **Notes:** Thin dispatcher that maps primitive IDs to handler functions (`runInitHandler`, `runDoctorHandler`, `runHarnessHandler`, `runSettingsHandler`). Acts as the execution bridge for CLI commands. Only 2 direct consumers, both healthy.

---

#### 5. `src/control-plane/control-plane-intake.ts`
- **Status:** LIVE (but see note)
- **Imports:** 
  - `src/features/runtime-entry/snapshot-loader.ts` (value import)
  - `src/features/runtime-entry/settings.ts` (value import)
  - `src/features/runtime-entry/init.handler.ts` (value import)
  - `src/features/runtime-entry/init-project.ts` (value import)
  - `src/features/runtime-entry/handler-shared.ts` (TYPE ONLY import)
  - `src/features/runtime-entry/attachment.builder.ts` (value import)
  - `src/control-plane/index.ts` (re-export)
- **Tests:** NO (no direct test file)
- **Notes:** **This is a pure pass-through re-export file.** It simply does `export * from '../features/session-entry/intake.js'`. The actual implementation lives in `src/features/session-entry/intake.ts` and its decomposed modules. This is a "forwarding barrel" pattern — healthy but adds indirection. The `handler-shared.ts` only uses `resolveControlPlaneIntakeGate` as a type annotation (`typeof resolveControlPlaneIntakeGate` on line 59), not as a runtime value.

---

#### 6. `src/control-plane/sdk-runtime.ts`
- **Status:** LIVE
- **Imports:** 
  - `tests/runtime-authority-live-sanity.test.ts` (direct test import)
  - `src/features/runtime-entry/init.handler.ts` (value import)
- **Tests:** YES — `tests/runtime-authority-live-sanity.test.ts`
- **Notes:** Phase 1 helper for SDK lifecycle management. Exports `createManagedRuntime` and `attachManagedRuntime`. Small surface area (91 lines), well-tested with live sanity tests that exercise real SDK behavior.

---

#### 7. `src/control-plane/AGENTS.md`
- **Status:** DOCUMENTATION
- **Tests:** NO
- **Notes:** Governance document defining sector boundaries and design notes. Not code.

---

### Index Re-export Verification

| Exported Module | Exists? | Notes |
|------------------|---------|-------|
| `control-plane-types.js` | ✅ YES | Real module |
| `control-plane-registry.js` | ✅ YES | Real module |
| `control-plane-intake.js` | ✅ YES | Pass-through re-export, but file exists |
| `control-plane-handler.js` | ✅ YES | Real module |

**No phantom re-exports detected.** All `index.ts` re-exports correspond to real files.

---

### Summary

| Category | Count |
|----------|-------|
| **LIVE** | 5 files |
| **ORPHANED** (pure barrel) | 1 file (`index.ts`) |
| **DOCUMENTATION** | 1 file (`AGENTS.md`) |
| **DEAD** | 0 files |

**Test Coverage:**
- `control-plane-registry.ts`: ✅ Covered by `runtime-resilience.test.ts`
- `sdk-runtime.ts`: ✅ Covered by `runtime-authority-live-sanity.test.ts`
- `control-plane-types.ts`: ❌ No direct tests (but types are used in tested modules)
- `control-plane-handler.ts`: ❌ No direct tests
- `control-plane-intake.ts`: ❌ No direct tests (but re-exported functions are indirectly tested)

**Key Findings:**
1. **No dead code detected** — all 5 code files are imported and used
2. **No phantom index re-exports** — all barrel exports correspond to real modules
3. `control-plane-intake.ts` is a pure forwarding re-export (not dead code, but adds indirection)
4. `handler-shared.ts` has a **type-only import** of `resolveControlPlaneIntakeGate` — it only uses it for type inference, not runtime value