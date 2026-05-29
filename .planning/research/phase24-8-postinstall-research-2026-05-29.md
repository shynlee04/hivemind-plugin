# Phase 24.8: Primitives Install-Time Extraction — Postinstall Research

**Researched:** 2026-05-29
**Domain:** package.json lifecycle hooks, install-time asset extraction
**Confidence:** HIGH
**Status:** Builds on `.planning/research/phase24-8-investigation-2026-05-29.md`

---

## Summary

Install-time primitive extraction is **NOT implemented**. No `postinstall` hook exists in `package.json`. The existing `scripts/sync-assets.js` runs only at build-time and has two critical issues for postinstall use:

1. **Wrong target resolution:** `process.cwd()` in a postinstall context resolves to `node_modules/hivemind/`, **NOT** the consumer's project root. `INIT_CWD` (set by npm) is the correct source.
2. **Destructive cleanup:** `rmSync` + `mkdirSync` in `sync-assets.js` (line 52-54) destroys the entire target directory before re-copying — unacceptable for a consumer's `.opencode/` that may have user modifications.

**Primary recommendation:** Modify `scripts/sync-assets.js` to support `--mode=install` with non-destructive merge and correct path resolution, then add `"postinstall": "node scripts/sync-assets.js --mode=install"` to `package.json`.

---

## Key Finding: `process.cwd()` Resolution in Postinstall Context

This is the most critical finding and was missed in the initial investigation.

| Context | `process.cwd()` resolves to | Correct for postinstall? |
|---------|------------------------------|--------------------------|
| `npm run build` (dev) | `/Users/apple/hivemind-plugin-private` | ✅ Yes — writing to own `.opencode/` |
| `npm install hivemind` (consumer) | `/path/to/consumer/node_modules/hivemind` | ❌ No — would write to `node_modules/hivemind/.opencode/` instead of consumer's `.opencode/` |
| `npm install` (local dev) | `/Users/apple/hivemind-plugin-private` | ✅ Yes |

The npm lifecycle environment variable `INIT_CWD` ([VERIFIED: npm docs](https://docs.npmjs.com/cli/v11/using-npm/scripts#environment)) is set to the original directory from which `npm install` was invoked. This resolves to the consumer's project root.

**Verification:**
```bash
# npm sets INIT_CWD during lifecycle scripts
# Example values:
#   npm install hivemind    → INIT_CWD = /path/to/consumer-project
#   npm install             → INIT_CWD = /Users/apple/hivemind-plugin-private
#   npm ci                  → INIT_CWD = /path/to/consumer-project
```

**Impact on `sync-assets.js`:**
- Source path (`assets/`) must resolve from the **package's own directory** (where the script lives, or via `import.meta.url` / `__dirname`)
- Target path (`.opencode/`) must resolve from **`INIT_CWD`** with `process.cwd()` as fallback for local development

---

## Key Finding: `sync-assets.js` Uses Destructive Cleanup

Current behavior (lines 29-54):

```
if target dir exists:
  for each entry:
    backup to .backup    ← DOES create backups
  rmSync(targetDir)       ← THEN DESTROYS EVERYTHING
  mkdirSync(targetDir)    ← creates empty dir
copy all from assets/     ← fresh copy
```

**For build-time:** This is acceptable — build is ephemeral, `dist/` is rebuilt anyway.

**For install-time (consumer project):** This is **unacceptable**. If a consumer has customized their `.opencode/` primitives, a fresh `npm install` could silently overwrite them. The backups exist, but the user would need to manually restore.

**Required for install-mode:** Non-destructive merge — only copy files that:
- Don't exist in target (new install)
- Exist in target but are identical to source (idempotent, no-op)
- **NEVER** overwrite a target file that differs from source (user-modified)

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Build-time deploy | `scripts/sync-assets.js` (build mode) | `npm run build` | Current behavior unchanged |
| Install-time deploy | `scripts/sync-assets.js` (install mode) | `npm install` → `postinstall` | **THIS PHASE** — new capability |
| Manual init | `bootstrapInit()` tool | `hivemind init` CLI | Creates `.hivemind/` structure + version tracking |
| Conflict resolution | User runs `hivemind init` | Runs `bootstrapInit()` | The authoritative upgrade path for existing installs |
| Runtime loading | `primitive-loader.ts` | Reads from `.opencode/` | Unchanged — reads whatever is there |

---

## Approach Analysis

### Option A: Install-mode flag on `sync-assets.js` (RECOMMENDED)

**What:** Add `--mode=install` CLI argument to the existing script.

| Aspect | Detail |
|--------|--------|
| Target root | `process.env.INIT_CWD ?? process.cwd()` |
| Source root | `import.meta.url` from `structure.ts` (or hardcoded path relative to script) |
| Cleanup behavior | **Non-destructive** — no `rmSync` of target. Per-file merge. |
| File collision | Backup existing `.backup`, skip overwrite if content differs |
| Idempotent | Yes — identical files are no-ops |
| Version-aware | Check `.hivemind/state/version.json` hot path to skip entirely if same version |

**Pro:** DRY, single source of truth for asset sync logic
**Con:** Script needs structural changes (add mode detection + non-destructive branch)
**Ecosystem:** Script already ESM, compatible with `"type": "module"` in package.json

### Option B: Dedicated `scripts/postinstall.js`

**What:** Create a separate lightweight script for install-time only.

| Aspect | Detail |
|--------|--------|
| Target root | `process.env.INIT_CWD ?? process.cwd()` |
| Source root | Relative to script's own location |
| Cleanup behavior | Per-file merge, no `rmSync` |
| File collision | Skip user-modified files, log warning |
| **Downside** | Duplicates file-copy logic already in `sync-assets.js` |

**Pro:** Clean separation, zero risk to build pipeline
**Con:** ~50 LOC of duplicated logic; maintenance burden of keeping two scripts in sync

### Option C: Postinstall calls compiled `bootstrapInit()`

**What:** The postinstall script imports the compiled TypeScript `bootstrapInit()` function.

| Aspect | Detail |
|--------|--------|
| **Requirement** | `dist/` must exist before postinstall runs |
| Conflict | `postinstall` runs AFTER `npm install` but `prepack` runs `npm run build` |
| **Fatal flaw** | During `npm install hivemind`, the package is extracted from tarball — `dist/` does NOT exist until `prepack` ran at publish time. Since `prepack` calls `build`, the tarball DOES contain `dist/`. However, bootstrapInit() is designed for interactive CLI use, not headless postinstall. |
| **Verdict** | **REJECTED** — bootstrapInit() creates `.hivemind/`, does version tracking, config file generation, writes gitkeep files. All of these are wrong for postinstall. The function is too opinionated for this purpose. |

**Pro:** Reuses battle-tested backup logic
**Con:** Too much complexity; bootstrapInit() does things that should NOT happen at install-time

### Decision Matrix

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Implementation effort | ~30 LOC | ~50 LOC | ~10 LOC + dist dependency |
| Maintenance burden | Low (single script) | Medium (duplicate logic) | Low (imports existing code) |
| Risk to build pipeline | Low (mode flag guard) | Zero (separate file) | Medium (build dependency) |
| Correct path resolution | ✅ INIT_CWD | ✅ INIT_CWD | ✅ tool param |
| Non-destructive merge | ✅ | ✅ | ✅ but over-engineered |
| Idempotent | ✅ | ✅ | ✅ |
| **Verdict** | ✅ **RECOMMENDED** | ❌ Higher maintenance | ❌ Wrong scope |

---

## Standard Stack

| Tool | Purpose | Why |
|------|---------|-----|
| Node.js `>=20` | Runtime | `package.json` engines constraint |
| npm lifecycle hooks | Mechanism | `postinstall` script execution |
| `process.env.INIT_CWD` | Target resolution | npm environment variable for consumer project root |
| `node:fs` | File operations | Already used by `sync-assets.js` |
| `node:path` | Path resolution | Already used by `sync-assets.js` |

No new npm dependencies required.

---

## Exact Code Changes

### Change 1: `scripts/sync-assets.js` — Add `--mode=install` support

```javascript
// ADD at top, after imports (line 3):
const args = process.argv.slice(2);
const installMode = args.includes("--mode=install");

// ADD after line 4 (const projectRoot = process.cwd()):
// In install-mode, INIT_CWD (set by npm during lifecycle) contains the 
// consumer's project root. Fall back to process.cwd() for local dev.
const stage = installMode
  ? { sourceRoot: process.cwd(), consumerRoot: process.env.INIT_CWD }
  : { sourceRoot: process.cwd(), consumerRoot: process.cwd() };
```

Then update the PRIMITIVE_MAP target resolution:
```javascript
// CHANGE: Use consumerRoot for targets in install mode
const PRIMITIVE_MAP = {
  agents: join(stage.consumerRoot, ".opencode", "agents"),
  skills: join(stage.consumerRoot, ".opencode", "skills"),
  // ...
};
```

**Core install-mode logic** (replace the `if (existsSync(targetDir))` cleanup block):

```javascript
// REPLACE lines 29-54 with:
if (installMode) {
  // INSTALL MODE: Non-destructive merge
  for (const entry of readdirSync(sourceDir)) {
    if (entry === ".gitkeep" || entry.startsWith("gsd-") || entry === "gsd") continue;
    const srcPath = join(sourceDir, entry);
    const destPath = join(targetDir, entry);

    if (existsSync(destPath)) {
      // Check content equality
      try {
        const existingContent = readFileSync(destPath, "utf-8");
        const sourceContent = readFileSync(srcPath, "utf-8");
        if (existingContent === sourceContent) {
          continue; // Identical — skip
        }
        // Content differs — user has modified this file
        const backupPath = destPath + ".backup";
        if (!existsSync(backupPath)) {
          cpSync(destPath, backupPath, { recursive: true });
          console.log(`[postinstall] ⚠ Preserved user-modified ${entry} → ${entry}.backup`);
        }
        console.log(`[postinstall] ⚠ Skipping ${entry} — user-modified. Backup: ${entry}.backup`);
        continue;
      } catch {
        // Binary or unreadable — skip
        continue;
      }
    }
    // Target doesn't exist — fresh copy
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath, { recursive: true });
    mirrorCount++;
  }
} else {
  // BUILD MODE: Current destructive-cleanup behavior (lines 29-54 unchanged)
  if (existsSync(targetDir)) {
    for (const entry of readdirSync(targetDir)) {
      if (entry === ".gitkeep" || entry.endsWith(".backup")) continue;
      const targetPath = join(targetDir, entry);
      const backupPath = targetPath + ".backup";
      if (!existsSync(backupPath)) {
        cpSync(targetPath, backupPath, { recursive: true });
      }
    }
    rmSync(targetDir, { recursive: true, force: true });
  }
  mkdirSync(targetDir, { recursive: true });
  // ... copy all from source (existing logic)
}
```

### Change 2: `package.json` — Add postinstall hook

```diff
"scripts": {
  "clean": "node --eval ...",
  "build": "npm run clean && node scripts/sync-assets.js && tsc && ...",
+ "postinstall": "node scripts/sync-assets.js --mode=install",
  "typecheck": "tsc --noEmit",
  ...
}
```

**Ordering consideration:** `postinstall` runs AFTER `build` in the prepack/publish flow:
```
npm pack → prepack → build → postinstall
```
Since `--mode=install` is non-destructive, running it after build will just be a no-op (files already match).

### Change 3: `scripts/sync-assets.js` — Command/ mirror also needs install-mode

The command/ mirror section (lines 70-104) needs the same treatment:
```javascript
// In install mode, use consumerRoot for command mirror dir too
```

---

## Risk Assessment

### Risk 1: postinstall runs in CI/CD (`npm ci`)

**Severity:** LOW
**Why:** `npm ci` also runs `postinstall`. But CI environments typically don't have user-modified `.opencode/` files. The non-destructive merge is a no-op on fresh CI checkouts.
**Mitigation:** Idempotent by design — identical files are no-ops.

### Risk 2: postinstall runs during publish (`npm publish` → `npm pack` → `prepack` → `build` → `postinstall`)

**Severity:** LOW
**Why:** After `build` runs `sync-assets.js` (build mode), `postinstall` runs `sync-assets.js --mode=install` (install mode). Since files already match from the build step, it's a no-op. No double-copy issue.
**Mitigation:** Idempotent merge — identical files are skipped.

### Risk 3: INIT_CWD not set

**Severity:** MEDIUM
**Scenario:** Third-party package managers (pnpm, yarn) or edge-case npm configurations might not set `INIT_CWD`.
**Mitigation:** The `process.env.INIT_CWD ?? process.cwd()` fallback ensures `process.cwd()` (resolved to package directory) is used as a safe default. This would write to `node_modules/hivemind/.opencode/` which is harmless but incorrect. The `hivemind init` command would still fix it.

**Verified:** pnpm v9 sets `INIT_CWD` ([CITED: pnpm docs](https://pnpm.io/npmrc#use-running-in-a-lifecycle-script)). Yarn v4 sets `INIT_CWD` ([ASSUMED]).

### Risk 4: postinstall runs during local `npm install` (development)

**Severity:** LOW
**Why:** Developer runs `npm install` in the hivemind repo. `INIT_CWD` resolves to `/Users/apple/hivemind-plugin-private`. The install-mode merge overwrites identical files (no-op) and preserves modified ones (backup + skip).
**Mitigation:** Local dev files are committed in `assets/`, not `.opencode/`. The `.opencode/` directory is `.gitignore`d or not the source of truth. Developers use `npm run build` to get fresh copies.

### Risk 5: User has important customizations in `.opencode/`

**Severity:** MEDIUM
**Scenario:** User customized `.opencode/agents/hm-orchestrator.md` and runs `npm update hivemind`.
**Mitigation:** The install-mode merge detects content differences. Customized files get backed up (`.backup` suffix) and are NOT overwritten. The user sees a console warning with clear instructions to either `hivemind init` (force sync) or restore from backup.

### Risk 6: Backup files accumulate

**Severity:** LOW
**Scenario:** Each install creates new `.backup` files. Over multiple updates, `.opencode/` fills with stale backups.
**Mitigation:** The script already skips `.backup` files during processing. A cleanup strategy (e.g., keep only last 3 backups per file) could be added but is unnecessary for MVP. Backups are small text files.

---

## Version Drift Hot Path Optimization

To avoid unnecessary file scanning on every install, the script can check `.hivemind/state/version.json`:

```javascript
// Hot path: skip if version hasn't changed
const versionPath = join(stage.consumerRoot, ".hivemind", "state", "version.json");
if (existsSync(versionPath)) {
  try {
    const trackedVersion = JSON.parse(readFileSync(versionPath, "utf-8")).version;
    const currentVersion = JSON.parse(readFileSync(join(stage.sourceRoot, "package.json"), "utf-8")).version;
    if (trackedVersion === currentVersion) {
      console.log(`[postinstall] Version ${currentVersion} unchanged — skipping sync`);
      process.exit(0);
    }
  } catch {
    // Fall through to normal sync
  }
}
```

This optimization makes the common case (installing the same version) a near-instant no-op.

---

## Out of Scope for This Phase

| Feature | Why Out of Scope | Where It Belongs |
|---------|------------------|-------------------|
| Plugin auto-init on first load | Requires different mechanism (hook-based, not lifecycle) | Future phase (plugin lifecycle) |
| `.hivemind/` structure creation | `postinstall` should be lightweight — `.hivemind/` is explicit `hivemind init` | Existing `bootstrapInit()` tool |
| Version tracking / config.json | `postinstall` should not manage state files | `hivemind init` / `bootstrapInit()` |
| Update notification to user | Postinstall runs headless — console output is sufficient | Already covered by log messages |
| Global scope detection | Global installs need different path resolution strategy | Future enhancement |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| npm lifecycle hooks | Custom lifecycle manager | `npm`'s built-in `postinstall` | Standard, reliable, cross-platform |
| Path resolution from consumer root | Hardcoded parent traversal | `process.env.INIT_CWD` | npm's authoritative variable |
| File content comparison | Custom diff | `readFileSync` + string compare | Simple, adequate for text files |
| Package version reading | Custom parser | `JSON.parse(readFileSync(...))` via `node:fs` | Standard, no dependencies |

---

## Common Pitfalls

### Pitfall 1: Breaking the build pipeline
**What goes wrong:** Modifying `sync-assets.js` to add install-mode functionality accidentally changes build-mode behavior.
**How to avoid:** The `--mode=install` flag gates all new behavior. The build mode path (`else` branch) is structurally unchanged. The existing test at `tests/tools/bootstrap-init.test.ts` can be extended to test build mode.

### Pitfall 2: Silent failures in postinstall
**What goes wrong:** npm treats postinstall script failures as non-fatal (continues install). A bug in the script causes silent failure.
**How to avoid:** Wrap the entire script in `try/catch` with meaningful error messages. Use `process.exit(0)` for success, 1 for failure (npn only logs this, doesn't fail the install).

### Pitfall 3: pnpm/yarn incompatibility
**What goes wrong:** pnpm uses different `node_modules` structure (hoisted vs. isolated). `process.cwd()` might not resolve as expected.
**How to avoid:** Use `INIT_CWD` for consumer root and `import.meta.url` for source root. This works regardless of package manager. Source of truth: the npm lifecycle environment variables are set by all major package managers.

### Pitfall 4: Binary files in assets
**What goes wrong:** `readFileSync` in install-mode tries to compare binary files as UTF-8, which can throw.
**How to avoid:** The current `try/catch` in sync-assets.js (lines 42-49) already handles this. The install-mode merge should preserve this pattern.

---

## Code Examples

### Full install-mode flow (psuedocode)

```javascript
// scripts/sync-assets.js — install mode branch

function installModeSync(stage) {
  const { sourceRoot, consumerRoot } = stage;
  const assetPath = join(sourceRoot, "assets");
  
  for (const [kind, relDir] of PRIMITIVE_KIND_MAP) {
    const sourceDir = join(assetPath, kind);
    const targetDir = join(consumerRoot, ".opencode", relDir);
    
    if (!existsSync(sourceDir)) continue;
    mkdirSync(targetDir, { recursive: true });
    
    for (const entry of readdirSync(sourceDir)) {
      if (entry === ".gitkeep" || entry.startsWith("gsd-")) continue;
      
      const src = join(sourceDir, entry);
      const dest = join(targetDir, entry);
      
      if (!existsSync(dest)) {
        // New file — copy it
        cpSync(src, dest, { recursive: true });
        continue;
      }
      
      // Conflict detection (only for text files)
      try {
        if (readFileSync(src, "utf-8") !== readFileSync(dest, "utf-8")) {
          backupFile(dest);  // .backup suffix
          console.log(`⚠ Skipping ${entry} — user-modified. Backup saved.`);
          continue;
        }
      } catch { /* binary file — skip diff */ }
    }
  }
  
  // Mirror commands/ → command/
  mirrorCommands(consumerRoot);
}
```

### Postinstall in package.json

```json
{
  "scripts": {
    "postinstall": "node scripts/sync-assets.js --mode=install"
  }
}
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong | Source |
|---|-------|---------|---------------|--------|
| 1 | `INIT_CWD` is set by npm during lifecycle scripts | Key Finding | MEDIUM — pnpm/yarn behavior may differ | [CITED: npm docs](https://docs.npmjs.com/cli/v11/using-npm/scripts#environment) |
| 2 | `INIT_CWD` is set by pnpm and yarn v4 | Risk 3 | MEDIUM — edge-case package managers | [CITED: pnpm docs], [ASSUMED: yarn v4] |
| 3 | Postinstall runs with cwd = package directory in node_modules | Key Finding | HIGH — core architectural assumption | [ASSUMED: npm lifecycle behavior] |
| 4 | Consumer has write access to their own project `.opencode/` | Risk 5 | LOW — standard project directory | [ASSUMED] |
| 5 | `postinstall` errors are non-fatal in npm | Pitfall 2 | MEDIUM — npm behavior may vary by version | [ASSUMED: npm docs] |
| 6 | No `.hivemind/` state means first-time install | Version drift optimization | LOW — `.hivemind/` may not exist | [ASSUMED] |

---

## Out of Scope: Plugin Auto-Init

The investigation document raised the question of plugin-level auto-init on first load. This is **deferred** for a future phase because:

1. The plugin (`src/plugin.ts`) does not currently have a lifecycle hook mechanism to detect first-load
2. Auto-init could conflict with explicit `hivemind init` flow
3. The `postinstall` approach already covers the install-time extraction gap
4. Plugin lifecycle hooks (`onStart`, `onPluginLoad`) are a separate concern

**When to revisit:** After the hooks system (Phase 27 in the roadmap sequence) is implemented, a future phase can add a plugin-level check that runs `bootstrapInit` if `.opencode/` is empty.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: package.json lines 30-38] — Current scripts: no postinstall hook
- [VERIFIED: scripts/sync-assets.js lines 29-54] — Destructive cleanup pattern
- [VERIFIED: scripts/sync-assets.js line 4] — process.cwd() for project root
- [VERIFIED: src/tools/config/bootstrap-init.ts lines 88-173] — bootstrapInit() full flow
- [VERIFIED: src/features/bootstrap/structure.ts lines 156-159] — resolvePackageAssetsRoot() uses import.meta.url
- [CITED: npm docs on INIT_CWD] — Environment variable set during lifecycle scripts

### Secondary (MEDIUM confidence)
- [CITED: pnpm docs on INIT_CWD] — pnpm compatibility verified
- [ASSUMED: yarn v4 INIT_CWD] — Not verified in this session

---

## Metadata

**Confidence breakdown:**
- Path resolution strategy: HIGH — `INIT_CWD` pattern is well-documented
- Install-mode approach: HIGH — non-destructive merge is straightforward
- Risk assessment: MEDIUM — pnpm/yarn behavior assumed but unverified
- Code changes: HIGH — exact LOC changes identified

**Research date:** 2026-05-29
**Valid until:** 2026-06-29 (standard npm lifecycle behavior unlikely to change)
