# Phase 24.8: Primitives Install-Time Extraction — Investigation Report

**Researched:** 2026-05-29
**Domain:** Bootstrap / Install-Time Primitive Extraction
**Confidence:** HIGH
**Status:** Phase directory `.planning/phases/24.8-primitives-install-extraction/` is **EMPTY** (only `.gitkeep`)

---

## Executive Summary

Install-time primitive extraction is **NOT fully implemented**. There is NO `postinstall` script in `package.json`. What exists is a **fragmented** deployment strategy:

| Mechanism | When It Runs | What It Does | Status |
|-----------|-------------|---------------|--------|
| `scripts/sync-assets.js` | `npm run build` (build-time) | Copies `assets/` → `.opencode/` | ✅ IMPLEMENTED |
| `bootstrapInit()` | `hivemind init` (manual CLI) | Creates `.hivemind/` + copies `assets/` → `.opencode/` | ✅ IMPLEMENTED |
| `bootstrapRecover()` | `hivemind recover` (manual CLI) | Repairs missing/broken primitives | ✅ IMPLEMENTED |
| `postinstall` hook | `npm install` (install-time) | **MISSING — does not exist** | ❌ GAP |
| Plugin auto-init | Plugin load in OpenCode | **MISSING** — plugin at `src/plugin.ts` never calls bootstrap | ❌ GAP |

**Primary recommendation:** Add a `"postinstall": "node scripts/sync-assets.js"` script to `package.json` to trigger primitive extraction at install-time.

---

## Detailed Findings

### 1. NO postinstall hook exists

**Evidence:** `package.json` lines 30-38

```json
"scripts": {
  "clean": "node --eval ...",
  "build": "npm run clean && node scripts/sync-assets.js && tsc && ...",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  ...
  "prepack": "npm run build"
}
```

The only lifecycle script is `prepack`. There is no `postinstall`, `postinstall`, or any `install` lifecycle hook. The `sync-assets.js` script runs **only** during `npm run build`, not during `npm install`.

---

### 2. Build-time mechanism: `scripts/sync-assets.js`

**Source:** `scripts/sync-assets.js` (43 lines)

**How it works:**
- Called from `npm run build` (`package.json` line 32)
- Maps `assets/` subdirectories → `.opencode/` subdirectories (line 7-14):
  ```
  agents   → .opencode/agents
  skills   → .opencode/skills
  commands → .opencode/commands
  workflows → .opencode/workflows
  references → .opencode/references
  templates → .opencode/templates
  ```
- Cleans the target directory completely (`rmSync` then `mkdirSync`, lines 27-30)
- Copies every entry **except** `.gitkeep` and entries starting with `gsd-` or named `gsd` (lines 33-34)
- Uses `cpSync()` — **regular file copies, NOT symlinks** (line 39)

**Key limitation:** Only runs at build-time. Not triggered by `npm install`.

---

### 3. Init-time mechanism: `bootstrapInit()` tool + CLI

**Tool source:** `src/tools/config/bootstrap-init.ts` (324 lines)
**CLI command:** `src/cli/commands/init.ts` (314 lines)
**CLI entrypoint:** `bin/hivemind.cjs` (41 lines)

The `bootstrapInit()` function (line 88-173) does:
1. Creates `.hivemind/` Tier-1 directories (state, delegation, journal, etc.) — lines 114-129
2. Writes `.gitkeep` files in each — lines 124-129
3. Writes `configs.json` and `configs.schema.json` — lines 136-145
4. Writes version tracking to `.hivemind/state/version.json` — lines 147-149
5. **Copies all primitives** from `assets/` to `.opencode/` — lines 151-160
6. Backs up existing user files before overwriting — lines 132-134, 307-323

**Primitive copy logic** (`copyPrimitive`, lines 307-323):
- Creates parent directories
- If target is a symlink → removes it
- If target is a real file → renames to `.backup` suffix
- Copies from `assets/` via `cpSync()` — **NOT symlinks**

**`listPrimitiveSources()`** (lines 258-281):
- Reads from `assets/agents/` — expects `.md` files
- Reads from `assets/skills/` — expects directories containing `SKILL.md`
- Reads from `assets/commands/` — expects `.md` files
- Supports `agents`, `skills`, `commands`, `workflows`, `references`, `templates`

**CLI invocation:**
```
hivemind init [--yes|-y] [--root=<path>] [--scope=project|global]
```

---

### 4. Recovery mechanism: `bootstrapRecover()` tool + CLI

**Tool source:** `src/tools/config/bootstrap-recover.ts` (239 lines)
**CLI command:** `src/cli/commands/recover.ts` (147 lines)

The `bootstrapRecover()` function (lines 82-121):
- Walks all expected primitives from `assets/`
- Classifies each as `ok` / `missing` / `broken` / `file`
- **Replaces only missing or broken entries**
- Does NOT touch real files or symlinks that are already correct

**`classifyPrimitiveTarget()`** (lines 207-220):
- Missing → file doesn't exist
- Broken → exists but is a symlink (this function assumes symlinks = broken)
- Ok → exists as regular file

**Note:** In the current environment, ALL primitives are regular files (not symlinks), verified at `.opencode/agents/hm-orchestrator.md`:
```
-rw-r--r--@ 1 apple  staff  8925 May 28 23:18 .opencode/agents/hm-orchestrator.md
```
No symlinks present.

---

### 5. Plugin composition root: `src/plugin.ts`

**Source:** `src/plugin.ts` (653 lines)

The plugin **registers** the bootstrap tools (lines 57-58, 184-185):
```typescript
import { createBootstrapInitTool } from "./tools/config/bootstrap-init.js"
import { createBootstrapRecoverTool } from "./tools/config/bootstrap-recover.js"
```

And registers them in `registerConfigTools()`:
```typescript
"bootstrap-init": createBootstrapInitTool(),
"bootstrap-recover": createBootstrapRecoverTool(),
```

However, the plugin's `HarnessControlPlane` composition root (starting line 367) **NEVER calls** `bootstrapInit()` automatically. There is no auto-init at plugin load time. The tools are registered but never invoked by the plugin itself.

---

### 6. Bootstrap feature module: `src/features/bootstrap/`

The directory contains:

| File | Purpose |
|------|---------|
| `structure.ts` | Directory constants and path resolvers (159 lines) |
| `primitive-loader.ts` | Runtime loader — reads + validates .opencode files at runtime (361 lines) |
| `primitive-registry.ts` | Catalog + dependency graph builder (282 lines) |
| `primitive-scanners.ts` | Low-level directory scanners |
| `cross-primitive-validator.ts` | Cross-type validation |
| `runtime-validator.ts` | Runtime config validation |
| `framework-detector.ts` | Framework detection |
| `control-plane/` | Gatekeeper control plane |

**Key insight:** The bootstrap feature module handles **runtime loading** (primitive-loader reads from `.opencode/`), not **install-time extraction**. The `structure.ts` module provides:
- `resolvePackageAssetsRoot()` (line 156-159) — resolves the `assets/` directory from the installed package
- `PRIMITIVE_TYPES` constant (line 87) — defines all primitive types

These are used by both `bootstrapInit` (install-time copy) and `sync-assets.js` (build-time copy).

---

### 7. Asset inventory

| Primitive Type | File Count | Location |
|----------------|------------|----------|
| Agents (`.md` files) | 42 (excl. `build.json`) | `assets/agents/` |
| Commands (`.md` files) | 137 | `assets/commands/` |
| Skills (SKILL.md dirs) | 34 | `assets/skills/` |
| Workflows (`.md` files) | 106 | `assets/workflows/` |
| References (`.md` files) | 71 | `assets/references/` |
| Templates (files) | 41 | `assets/templates/` |

**Total shipped assets:** ~431 files

**Package.json includes `assets` in `"files"` field** (line 13), ensuring all assets are shipped with the npm package.

---

### 8. Symlinks vs. Copies

**Finding:** ALL primitives in `.opencode/` are **regular file copies**, not symlinks. Verified:
- `bootstrapInit` → `copyPrimitive()` uses `cpSync()` (not symlinks)
- `sync-assets.js` uses `cpSync()` (not symlinks)
- Filesystem shows `-rw-r--r--` (not `lrwxr-xr-x`)

The `bootstrapRecover` `classifyPrimitiveTarget()` (line 215-218) incorrectly classifies existing symlinks as "broken" — suggesting the code was designed expecting symlinks but the actual deployment uses copies.

---

### 9. Current Deployment State

```json
// .hivemind/state/version.json
{ "version": "0.1.0" }
```

The bootstrap has been run (version file exists, Tier-1 directories exist, primitives are deployed). Agent counts match:
- `assets/agents/` = 42 `.md` files
- `.opencode/agents/` = 42 `.md` files

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Primitive source of truth | `assets/` directory | — | Shipped with npm package, declared in `package.json "files"` |
| Build-time deploy | `scripts/sync-assets.js` | `npm run build` | Called during build step |
| Install-time deploy | **MISSING** | `postinstall` hook | **Needs to be built** — no mechanism exists |
| Manual init | `bootstrapInit()` tool | `hivemind init` CLI | Fully implemented, requires user to run manually |
| Repair/recover | `bootstrapRecover()` tool | `hivemind recover` CLI | Fully implemented |
| Runtime loading | `primitive-loader.ts` | `.opencode/` directory | Reads already-extracted primitives at runtime |
| Plugin auto-init | **MISSING** | Plugin `HarnessControlPlane` | Plugin registers tools but never calls bootstrap automatically |

---

## Gaps to Address for Phase 24.8

### Gap 1: Missing postinstall hook

**Current state:** No `postinstall` script in `package.json`

**Required:** Add to `package.json`:
```json
"scripts": {
  "postinstall": "node scripts/sync-assets.js"
}
```

**Risk:** Assets that are `.ts` files (like `configs.schema.json` generation) would need compilation first. However, `sync-assets.js` only copies static MD files — no compilation needed.

### Gap 2: sync-assets.js needs to be a standalone CJS script

**Current state:** `scripts/sync-assets.js` uses ESM `import` syntax (line 1), which requires `"type": "module"` in `package.json`. This is fine for `postinstall` since the package already uses `"type": "module"`.

**Compatibility check:** The script only uses `node:fs` and `node:path` modules (line 1). No TypeScript compilation needed. Runs correctly as ESM.

### Gap 3: Optional — Plugin-level auto-init on first load

**Current state:** The plugin at `src/plugin.ts` never calls bootstrap automatically. No state detection for first-run scenario.

**Option:** Add a lightweight check at the plugin's `HarnessControlPlane` function (line 367) that detects whether `.opencode/` primitives exist and calls `bootstrapInit` if not. However, this may conflict with the user's explicit `hivemind init` flow.

### Gap 4: No install-time environment availability check

**Current state:** `bootstrapInit()` checks write access to global config directory (line 200-217). A `postinstall` script would run in the context of the consuming project, which should always have write access to its own `.opencode/` directory.

---

## Code Change Targets

| File | Line(s) | Change |
|------|---------|--------|
| `package.json` | 30-38 | Add `"postinstall": "node scripts/sync-assets.js"` |
| `scripts/sync-assets.js` | 4 | Already uses `process.cwd()` — will resolve to consumer's project root during `npm install`. This is correct. |

---

## Common Pitfalls

### Pitfall 1: postinstall script running during development
**What goes wrong:** `postinstall` runs on EVERY `npm install`, including during local development. This could overwrite user modifications in `.opencode/`.
**Mitigation:** The existing user file preservation logic in `sync-assets.js` could be enhanced. Currently it cleans the target dir completely (`rmSync` then `mkdirSync`, line 27-30). **This would destroy user modifications.** The `bootstrapInit()` approach (backup via `.backup` suffix) is safer but `sync-assets.js` does NOT implement this.

### Pitfall 2: postinstall running on `npm ci` in CI
**What goes wrong:** CI environments typically run `npm ci` which also triggers `postinstall`. The script should be idempotent.
**Mitigation:** The script already handles missing source dirs gracefully (line 22-24). Adding an `existsSync` check for target dirs would make it fully idempotent.

### Pitfall 3: Infinite loops with npm lifecycle scripts
**What goes wrong:** If `postinstall` calls `npm run build` or vice versa, it can cause infinite loops.
**Mitigation:** The `postinstall` should ONLY run `sync-assets.js`, not `npm run build`. The current `build` script already calls `sync-assets.js`, so this is safe.

---

## Code Examples

### Current: Build-time only deploy
```bash
npm run build   # → calls node scripts/sync-assets.js → copies assets/
```

### Target: Install-time deploy
```bash
npm install hivemind  # → triggers postinstall → calls node scripts/sync-assets.js → copies assets/
hivemind init          # → manual bootstrapInit (optional, for .hivemind/ setup)
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong | Source |
|---|-------|---------|---------------|--------|
| 1 | `sync-assets.js` runs correctly as ESM from `postinstall` | Gap 2 | LOW — package.json uses `"type": "module"` | [VERIFIED: package.json line 5] |
| 2 | `process.cwd()` resolves to consumer project root during `npm install` | Gap 4 | MEDIUM — if a monorepo manager sets cwd differently | [VERIFIED: npm docs] |
| 3 | `sync-assets.js` destructive cleanup (rmSync + mkdirSync) is acceptable for postinstall | Pitfall 1 | HIGH — destroys user customizations if they edit .opencode files | [VERIFIED: scripts/sync-assets.js lines 27-30] |
| 4 | No GSD agents in `assets/agents/` | Section 8 | LOW — confirmed via filesystem listing | [VERIFIED: assets/agents listing] |
| 5 | Primitives are deployed as copies, not symlinks | Section 8 | LOW — confirmed via `ls -la` output | [VERIFIED: .opencode/agents/hm-orchestrator.md] |

---

## Open Questions

1. **Should `postinstall` use `sync-assets.js` (build-time path) or `bootstrapInit()` (init path)?** The former is simpler but destructive (cleans target dir). The latter has backup logic but is more complex. Recommendation: Use `sync-assets.js` with added user-file preservation.

2. **Should the plugin (src/plugin.ts) auto-init on first load?** This would provide a zero-config experience but might conflict with users who want explicit `hivemind init` control.

3. **Should install-time extraction be a separate `scripts/postinstall.js` or reuse existing scripts?** A dedicated postinstall script would be cleaner than modifying `sync-assets.js` to handle two different modes (build vs. install).

---

## Environment Availability

| Dependency | Required By | Available | Version |
|------------|------------|-----------|---------|
| Node.js | postinstall script | ✅ Available | >=20.0.0 (per package.json engines) |
| npm | postinstall lifecycle | ✅ Available | — |
| `scripts/sync-assets.js` | postinstall | ✅ Exists | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest v4 |
| Config | `vitest.config.ts` |
| Quick run | `npm test` |
| Existing bootstrap tests | `tests/tools/bootstrap-init.test.ts` (210 lines, 6 tests) |
| Existing recovery tests | `tests/tools/bootstrap-recover.test.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| 24.8-R1 | postinstall triggers sync-assets | Integration | `npm test` | ❌ NEW needed |
| 24.8-R2 | User files preserved on postinstall | Integration | `npm test` | ❌ NEW needed |
| 24.8-R3 | Version drift detection | Unit | `npx vitest run -t "version drift"` | ✅ exists (bootstrap-init.test.ts) |

### Wave 0 Gaps

- No test for postinstall execution
- No test for install-time file preservation
- No test for `sync-assets.js` running standalone

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | YES — file path traversal in sync-assets.js | Validate paths resolve within project root |
| V6 Cryptography | NO — no cryptographic operations | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| postinstall script hijack | Tampering | Package integrity via npm registry + lockfile |
| postinstall writing outside project dir | Tampering | Constrain file writes to resolved project root |
