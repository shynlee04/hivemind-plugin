# Phase 19: Non-Destructive Remediation — Research

**Researched:** 2026-05-21
**Domain:** Dead code verification, schema bugfix, dist cleanup, hook trimming
**Confidence:** HIGH

## Summary

This research audits every item claimed as "dead" in the Phase 19 ROADMAP scope against actual source code, test files, and dist artifacts. **Three ROADMAP claims are incorrect** — the phase planner must account for these corrections before executing.

**Key corrections to ROADMAP:**
1. **prompt-packet/ is NOT dead** — `session-hooks.ts` actively imports `compaction-preservation` and `kernel-packet`. Cannot blanket-delete.
2. **tool-definition.schema.ts HAS consumers** — `ToolFile` type is used by `primitive-loader.ts` and `cross-primitive-validator.ts`. Cannot simply delete; types must be inlined first.
3. **concurrency-key.ts HAS a consumer** — `manager-runtime.ts` imports `resolveDelegationConcurrencyKey`. Can be deleted only if the call is inlined.
4. **"13 stale dist files" should be "11"** — actual Phase 18 orphan .js files = 11, not 13.

**Primary recommendation:** Fix ROADMAP scope before planning. See correction table below.

### ROADMAP Correction Table

| ROADMAP Claim | Actual Verdict | Action Required |
|---------------|---------------|-----------------|
| Delete permission.schema.ts | **CONFIRMED_DEAD** after barrel cleanup | Delete + remove 12 barrel re-exports |
| Fix enum bug | **CONFIRMED** `["allow","ask","ask"]` | Fix to `["allow","ask","auto"]` |
| Delete tool-definition.schema.ts | **HAS_CONSUMERS** | Inline ToolFile/ToolDefinition types first, then delete |
| Delete skill-metadata.schema.ts | **CONFIRMED_DEAD** after barrel cleanup | Delete + remove barrel re-exports |
| Delete prompt-packet/ (5 files) | **PARTIALLY WRONG** | Keep compaction-preservation.ts + kernel-packet.ts; CAN delete delegation-packet.ts + index.ts |
| Delete session-classification-hook.ts | **CONFIRMED_DEAD** | Delete source + test file |
| Delete schema-normalizer.ts | **CONFIRMED_DEAD** | Delete source + test file |
| Delete concurrency-key.ts | **HAS_CONSUMER** | Inline the wrapper in manager-runtime.ts, then delete |
| Delete deprecated profile methods | **CONFIRMED no-ops** | Delete from source + barrel + update tests |
| Remove messages.transform + duplicate system.transform | **CONFIRMED no-op hooks** | Remove messages.transform; keep system.transform for test compat, or update tests |
| Delete empty dirs | **CONFIRMED empty** | Delete src/kernel/, src/harness/ (with .gitkeep) |
| Rebuild dist/ — "13 stale" | **Actual: 11 stale .js** + Phase 19 deletion artifacts | Rebuild after source deletions |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema validation | Schema-Kernel | Config compiler | Schemas define shapes — compiler instantiates them |
| Permission enforcement | Runtime policy | Config compiler | Permission schemas feed runtime guards |
| Session compaction | Lifecycle hooks | Prompt-packet | Compaction preservation uses prompt-packet types |
| Behavioral profiling | Routing layer | — | Deprecated methods are no-ops reading fresh config |

---

## Detailed Dead Code Verification

### Item 1: permission.schema.ts (168 LOC)

**Claim:** Zero consumers
**Verification method:** `rg "from.*permission\.schema" src/ --type ts`
**Result:** Re-exported from `schema-kernel/index.ts` barrel. NO runtime or test code imports the barrel's permission exports.
**Evidence:**
- Barrel has 12 re-export lines for permission types/schemas
- `rg "PermissionActionSchema\|PermissionRuleSchema\|PermissionRulesetSchema" src/ --type ts` (excluding schema file and barrel) → **zero hits**
- Runtime `PermissionAction`/`PermissionRule` live in `src/shared/types.ts` — independent file
- Zero test imports from this file
**Verdict: CONFIRMED_DEAD** — Must also remove the 12 barrel re-exports from `schema-kernel/index.ts`

### Item 2: Enum Bug in permission.schema.ts

**Claim:** `z.enum(["allow", "ask", "ask"])` should be `["allow", "ask", "auto"]`
**Verification method:** `grep -n "allow.*ask.*ask" src/schema-kernel/permission.schema.ts`
**Result:** Line 10 — **BUG CONFIRMED [VERIFIED: source code]**
- Line 9 comment says: "Three-state permission action: allow, ask for approval, or ask outright."
- Line 10: `export const PermissionActionSchema = z.enum(["allow", "ask", "ask"])`
- Third value `"ask"` duplicates second value instead of the intended `"auto"`
- The runtime type `PermissionAction` in `src/shared/types.ts` correctly uses `"auto"` — the schema does not match the runtime type
**Verdict: CONFIRMED BUG** — Fix `["allow", "ask", "auto"]`

### Item 3: tool-definition.schema.ts (74 LOC)

**Claim:** Zero consumers
**Verification method:** `rg "from.*tool-definition\.schema" src/ --type ts`
**Result:** **HAS CONSUMERS** — ROADMAP statement is incorrect
**Evidence:**
- `src/features/bootstrap/primitive-loader.ts` imports `ToolFile` type from barrel
- `src/features/bootstrap/cross-primitive-validator.ts` imports `ToolFile` type from barrel
- `tests/lib/cross-primitive-validator.test.ts` imports `ToolFile` type from barrel
- `tests/schema-kernel/opencode-config.schemas.test.ts` directly imports `ToolDefinitionSchema`, `ToolDefinitionSchemaLenient`, `ToolFileSchema`, `ToolFileSchemaLenient`
**Verdict: CANNOT DELETE AS-IS** — The `ToolFile`, `ToolDefinition`, and `ToolName` types must be inlined into another schema file (e.g., `src/schema-kernel/hivemind-configs.schema.ts` or a new combined file) before this file can be removed.

### Item 4: skill-metadata.schema.ts (111 LOC)

**Claim:** Zero consumers
**Verification method:** `rg "from.*skill-metadata\.schema" src/ --type ts` + `rg "SkillMetadata\|SkillCategory\|SkillDefinition" src/ --type ts`
**Result:** **CONFIRMED_DEAD**
**Evidence:**
- Re-exported from barrel (`schema-kernel/index.ts`)
- `rg "SkillMetadata\|SkillCategory\|SkillDefinition" src/ --type ts` (excluding the schema file and barrel) → **zero hits**
- Zero test imports
**Verdict: CONFIRMED_DEAD** — Must also remove barrel re-exports

### Item 5: prompt-packet/ (5 files, 348 LOC)

**Claim:** "Designed never wired, superseded by session-tracker compaction"
**Verification method:** `rg "from.*prompt-packet" src/ --type ts`
**Result:** **PARTIALLY WRONG** — Has an active runtime consumer
**Evidence:**
- `src/hooks/lifecycle/session-hooks.ts` line 19: `import { toCompactionPacket, type CompactionExtras } from "../../features/prompt-packet/compaction-preservation.js"`
- `src/hooks/lifecycle/session-hooks.ts` line 20: `import type { KernelPacket } from "../../features/prompt-packet/kernel-packet.js"`
- Lines 286-334 of session-hooks.ts use `KernelPacket` and `toCompactionPacket` to preserve intake data across session compaction
- 4 test files exist: `compaction-preservation.test.ts`, `delegation-packet.test.ts`, `kernel-packet.test.ts`, `index.test.ts`

**Per-file breakdown:**
| File | Runtime Consumer | Can Delete? |
|------|----------------|-------------|
| `compaction-preservation.ts` | **YES** — session-hooks.ts | NO |
| `kernel-packet.ts` | **YES** — session-hooks.ts (type-only import) | NO |
| `delegation-packet.ts` | **NO** — only re-exported by index.ts (zero consumers) | YES |
| `index.ts` | **NO** — barrel with zero consumers | YES |
| `AGENTS.md` | Documentation only | YES |

**Verdict: PARTIALLY DEAD** — Keep `compaction-preservation.ts` and `kernel-packet.ts`. Delete `delegation-packet.ts`, `index.ts`, and `AGENTS.md`.

### Item 6: session-classification-hook.ts (76 LOC)

**Claim:** "Never connected"
**Verification method:** `rg "from.*session-classification-hook" src/ --type ts`
**Result:** **CONFIRMED_DEAD** — zero runtime consumers
**Evidence:**
- Located at `src/features/session-tracker/hooks/session-classification-hook.ts`
- NO runtime code imports it
- Test file exists: `tests/features/session-tracker/hooks/session-classification-hook.test.ts` (must also be deleted)
- Stale dist: 4 files (`session-classification-hook.d.ts`, `.d.ts.map`, `.js`, `.js.map`)
**Verdict: CONFIRMED_DEAD** — Delete source + test + stale dist will be handled by rebuild

### Item 7: schema-normalizer.ts (155 LOC)

**Claim:** "Never imported"
**Verification method:** `rg "from.*schema-normalizer" src/ --type ts`
**Result:** **CONFIRMED_DEAD** — zero runtime consumers
**Evidence:**
- Located at `src/features/session-tracker/transform/schema-normalizer.ts`
- NO runtime code imports it
- Test file exists: `tests/features/session-tracker/transform/schema-normalizer.test.ts` (must also be deleted)
- Stale dist: 4 files
**Verdict: CONFIRMED_DEAD** — Delete source + test

### Item 8: concurrency-key.ts (12 LOC)

**Claim:** "Single-line delegating wrapper" — implied as deletable
**Verification method:** `rg "from.*concurrency-key" src/ --type ts`
**Result:** **HAS CONSUMER** — ROADMAP omits this dependency
**Evidence:**
- Source: `src/coordination/spawner/concurrency-key.ts`
  - Function `resolveDelegationConcurrencyKey(args)` simply calls `buildDelegationQueueKey(args)`
- `src/coordination/delegation/manager-runtime.ts` line 16: `import { resolveDelegationConcurrencyKey } from "../spawner/concurrency-key.js"` — used at line 49
- Test: `tests/lib/delegation-manager.test.ts` line: `import * as spawnerConcurrencyKey from "../../src/coordination/spawner/concurrency-key.js"`
**Verdict: CAN DELETE IF INLINED** — The single call in manager-runtime.ts must be changed to call `buildDelegationQueueKey` directly. The test import referencing the module must be updated.

### Item 9: Deprecated profile methods

**Claim:** Listed in scope — `invalidateBehavioralProfile`, `clearAllBehavioralProfiles`
**Verification method:** `rg "invalidateBehavioralProfile|clearAllBehavioralProfiles" src/ --type ts`
**Result:** **CONFIRMED no-ops with test coverage**
**Evidence:**
- Defined in `src/routing/behavioral-profile/resolve-behavioral-profile.ts` — both are no-ops that just clear a cache
- Re-exported from `src/routing/behavioral-profile/index.ts` (barrel)
- The barrel has **zero runtime consumers** — all modules import directly from individual files
- Test file `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` has extensive test coverage for these methods (15+ references)
**Verdict: DEAD** — Delete function definitions from resolve-behavioral-profile.ts, remove barrel re-exports from index.ts, update test file to remove tests for these methods

### Item 10: messages.transform + duplicate system.transform in core-hooks.ts

**Claim:** No-op hooks to remove
**Verification method:** `cat -n src/hooks/lifecycle/core-hooks.ts`
**Result:** **CONFIRMED no-ops**
**Evidence:**
- `messages.transform` (lines 189-196): Calls `classifyHookEffect("messages.transform")` then echoes `output.messages = input.messages ?? []`. Comment: "Messages transformation stripped in Phase 35"
- `system.transform` and `experimental.chat.system.transform` (lines 175-187): Both call the same `handleSystemTransform()` handler. Comment (line 10-12): `system.transform` is kept for backward compat with tests.
- Test: `tests/hooks/create-core-hooks.test.ts` uses `hooks["system.transform"]` in 4 test cases
**Verdict:**
- `messages.transform` — **CAN DELETE** from `CoreHooks` interface and factory return object
- `system.transform` — **CAN DELETE** if the test file is updated to use `experimental.chat.system.transform`. The SDK only dispatches `experimental.chat.system.transform` anyway (comment at line 10-12 confirms this).

### Item 11: Empty dirs: src/kernel/, src/harness/

**Claim:** Empty directories
**Verification:** `ls -la src/kernel/` and `ls -la src/harness/`
**Result:** **CONFIRMED EMPTY** — Each contains only `.gitkeep` (0 bytes)
**Verdict:** Delete both dirs (with their `.gitkeep` files)

### Item 12: Rebuild dist/ — stale files

**Claim:** "13 stale .js files from Phase 18 deleted modules"
**Verification:** Find files in dist/ with no corresponding src/ .ts file
**Result:** **Actual count: 11 stale .js files** [VERIFIED: filesystem audit]

**Phase 18 orphans (11 .js files):**
```
task-management/recovery/index.js
task-management/recovery/failure-classes.js
task-management/recovery/repair-state.js
task-management/recovery/assess-state.js
task-management/recovery/create-checkpoint.js
features/bootstrap/runtime-detection/index.js
features/bootstrap/runtime-detection/stack-synthesizer.js
features/steering-engine/types.js
features/steering-engine/steering-state.js
features/steering-engine/schema/steering-policy.schema.js
hooks/transforms/toggle-gates.js
```

**Phase 19 deletion will add stale .js files for each source file deleted.** A full `npm run build` after all source deletions will clean all stale dist artifacts automatically.

---

## Standard Stack

### Core
| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| TypeScript | ^5.8.0 | Type-checking | [VERIFIED: package.json] |
| Node.js | >=20.0.0 | Runtime | [VERIFIED: package.json; available: v26.0.0] |
| zod | ^4.x | Runtime schema validation | [VERIFIED: package.json] |

### Testing
| Library | Version | Purpose |
|---------|---------|---------|
| vitest | 4.1.6 | Test runner |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| dist cleanup | Manual deletion | `npm run build` | Clean rebuild eliminates all stale orphans |
| Dead code detection | Manual grep | `rg "from.*<module>" src/ --type ts` | Standard tool, reliable results |

---

## Code Examples

### Pattern: Inline concurrency-key wrapper before deleting

```typescript
// BEFORE — manager-runtime.ts
import { resolveDelegationConcurrencyKey } from "../spawner/concurrency-key.js"
// ...usage:
const key = resolveDelegationConcurrencyKey({ provider, model, agent })

// AFTER — inline directly
import { buildDelegationQueueKey } from "../concurrency/queue.js"
// ...usage:
const key = buildDelegationQueueKey({ provider, model, agent })
```

### Pattern: Remove barrel re-exports when deleting schema file

`src/schema-kernel/index.ts` — remove the block(s) re-exporting from `"./permission.schema.js"` and `"./skill-metadata.schema.js"`. Each block is ~12 lines of `export { ... } from "./<file>.schema.js"` and `export type { ... } from "./<file>.schema.js"`.

### Pattern: Remove no-op messages.transform

`src/hooks/lifecycle/core-hooks.ts`:
1. Remove `MessagesInput` and `MessagesOutput` type aliases (lines 25-26)
2. Remove `"messages.transform"` from the `CoreHooks` interface (lines 35-38)
3. Remove the `"messages.transform"` key from the return object in `createCoreHooks()` (lines 189-196)

---

## Common Pitfalls

### Pitfall 1: Barrel re-exports mask dead code
**What goes wrong:** A schema file appears "dead" (no direct imports) but is re-exported from a barrel that has consumers. The re-export lines in the barrel must also be removed.
**How to avoid:** Always check both direct imports AND barrel re-exports. Use `rg "from.*<schema>" src/schema-kernel/index.ts` to find barrel exports.

### Pitfall 2: Test files survive source deletion
**What goes wrong:** After deleting dead source files, their test files remain with broken imports, causing test failures on next `npm test`.
**How to avoid:** Delete test files matching deleted source files. Items requiring test file deletion: `session-classification-hook.test.ts`, `schema-normalizer.test.ts`. Items requiring test file updates: `resolve-behavioral-profile.test.ts`, `create-core-hooks.test.ts`, `delegation-manager.test.ts`.

### Pitfall 3: system.transform has test consumers
**What goes wrong:** Simply removing `system.transform` from core-hooks.ts will break 4+ test cases in `create-core-hooks.test.ts`.
**How to avoid:** First update the test cases to use `"experimental.chat.system.transform"`, then remove `"system.transform"` from the interface and factory.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No Zod v4 breaking changes in schema value changes | Schema fix | LOW — changing enum values is a non-breaking structural change |
| A2 | Behavioral profile barrel (index.ts) has no runtime consumers | Item 9 | LOW — verified with `rg` |

**No unresolved assumptions** — all claims are verified with code evidence.

---

## Environment Availability

| Dependency | Required By | Available | Version |
|------------|------------|-----------|---------|
| Node.js | Build + typecheck | ✓ | v26.0.0 |
| npm | Build | ✓ | 11.14.1 |
| vitest | Tests | ✓ | 4.1.6 |
| TypeScript | Typecheck | ✓ | (via node_modules) |

No missing dependencies — all tools are available. Step 2.6: COMPLETE.

---

## Validation Architecture

> nyquist_validation is enabled (absent from config = enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.6 |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npx vitest run --changed` |
| Full suite command | `npm test` |

### Phase Requirements → Verification Map

| Verification | Command | Expected Result |
|-------------|---------|-----------------|
| Dead code removed | `rg "from.*<deleted-file>" src/ --type ts` | zero results |
| Enum bug fixed | `grep 'z.enum' src/schema-kernel/permission.schema.ts` | `"auto"` present, no duplicate `"ask"` |
| Typecheck passes | `npm run typecheck` | exit 0 |
| Tests pass | `npm test` | all tests pass, no broken imports |
| Dist cleaned | `npm run build && ls dist/...` | no orphan .js without .ts source |

### Wave 0 Gaps
- None — this is a cleanup phase; existing test infrastructure covers regression detection.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: source code audit 2026-05-21] — All rg/grep results from actual source files in `src/` and `tests/`
- [VERIFIED: package.json] — zod v4, vitest 4.1.6 confirmed

---

## Metadata

**Confidence breakdown:**
- Dead code verification: **HIGH** — All items verified with rg/grep against actual source
- ROADMAP corrections: **HIGH** — Evidence-based contradiction of 3 ROADMAP claims
- Pitfalls: **HIGH** — Based on actual test file dependencies found

**Research date:** 2026-05-21
**Valid until:** 2026-06-21
