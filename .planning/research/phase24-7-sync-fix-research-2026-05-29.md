# Phase 24.7: sync-assets.js missing `command/` (singular) sync — Research

**Researched:** 2026-05-29
**Domain:** Asset sync pipeline, OpenCode primitives reflection
**Confidence:** HIGH (all claims verified against code + filesystem)

## Summary

`scripts/sync-assets.js` is the build-time script that copies primitives from `assets/` to `.opencode/`. It correctly syncs to `.opencode/commands/` (plural) but has **no logic to duplicate to `.opencode/command/` (singular)**. Per AGENTS.md §4, both directories are primary roots and "ALL command schemas MUST be duplicated identically in both directories to prevent version drift across different OpenCode host releases."

The result: **87 `hm-*` commands exist in `commands/` but are missing from `command/`** — a direct violation of the dual-directory requirement. Additionally, the script has no backup mechanism (despite AGENTS.md claiming `.backup` suffix support) and no conflict detection.

**Primary recommendation:** Add a second target `command` to `PRIMITIVE_MAP` in sync-assets.js, mirroring the same sync logic as `commands` but writing to `.opencode/command/`. Also add pre-overwrite backup and diff-warning logic using the `.backup` pattern from `bootstrap-init.ts`.

---

## 1. Violation: Dual-Directory Requirement Not Enforced

### AGENTS.md Mandate (line 171)

> "Both `.opencode/command/` and `.opencode/commands/` folders are primary roots. All command schemas MUST be duplicated identically in both directories to prevent version drift across different OpenCode host releases."

### sync-assets.js Current State (line 10)

```javascript
const PRIMITIVE_MAP = {
  agents:     join(projectRoot, ".opencode", "agents"),
  skills:     join(projectRoot, ".opencode", "skills"),
  commands:   join(projectRoot, ".opencode", "commands"),   // ← PLURAL ONLY
  workflows:  join(projectRoot, ".opencode", "workflows"),
  references: join(projectRoot, ".opencode", "references"),
  templates:  join(projectRoot, ".opencode", "templates"),
};
```

**File:** `scripts/sync-assets.js`, lines 7-14
**Root cause:** Line 10 maps `commands` → `.opencode/commands/` only. No entry exists for `command` → `.opencode/command/`.

### What Needs to Change

The `PRIMITIVE_MAP` needs an additional entry:
```javascript
command: join(projectRoot, ".opencode", "command"),  // SINGULAR — mirror of commands
```

And the loop must handle this: the same `assets/commands/` source feeds both `commands/` and `command/` targets. The sync logic is identical — filter `.gitkeep`, skip `gsd-*` and `gsd`, `cpSync` each entry.

**But caution:** The loop at lines 18-42 iterates `Object.entries(PRIMITIVE_MAP)` which uses `assets/{kind}` as source. If we add `command` as a key, it will try to read `assets/command/` (singular), which does not exist. **The fix must handle the plural→singular mirroring** — either:
1. A dedicated post-loop duplication step (copy from `commands/` → `command/` after sync completes), OR
2. A secondary target list for the `commands` kind, OR
3. A `mirrorTargets` map for kinds that need multi-directory output.

---

## 2. File Count Divergence

| Directory | `.md` files | `.backup` files | Unique commands | Source |
|-----------|-------------|-----------------|-----------------|--------|
| `.opencode/command/` (singular) | **98** | 18 | 67 `gsd-*` (GSD tooling) | Not from sync-assets.js |
| `.opencode/commands/` (plural) | **118** | many | 87 `hm-*` (HM harness) | From sync-assets.js |
| **Intersection (both)** | **31** | — | Core commands | Mixed |

### Key Insight

The `command/` directory's 67 `gsd-*` commands come from GSD's own tooling (not from `sync-assets.js`, which explicitly skips `gsd-*`). These GSD commands are **internal developer tooling** (tracked in `gsd-file-manifest.json`) and are correctly excluded from HM sync.

The bug: **0 of the 87 `hm-*` commands from `assets/commands/` are synced to `command/`**. Any OpenCode host that checks `command/` (singular) for commands will discover 0 HM-harness commands.

---

## 3. No Backup Before Overwrite

### AGENTS.md Claim (line 344)

> "User-modified files in `.opencode/` are backed up (`.backup` suffix) before overwrite during updates."

### sync-assets.js Reality (lines 27-30)

```javascript
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });  // ⚠️ Silent destruction
}
mkdirSync(targetDir, { recursive: true });
```

**No backup. No diff check. No warning.** A user who manually edits a command file and then runs `npm run build` (which triggers `sync-assets.js`) will have their edits **permanently destroyed**.

### Existing Pattern: bootstrap-init.ts (line 314)

```javascript
const backupPath = targetPath + ".backup";
```

The bootstrap tools (`bootstrap-init.ts` and `bootstrap-recover.ts`) already implement the `.backup` suffix pattern correctly. `sync-assets.js` should reuse the same pattern.

---

## 4. No Conflict Detection

The script has no mechanism to detect conflicts between `assets/` and `.opencode/` versions. If both have diverged:
- **assets version always wins silently** (line 28: `rmSync` destroys target, then line 39: `cpSync` writes source)
- No diff is computed
- No warning is logged
- No merge happens

This is acceptable for `postinstall` (first-time install) and `build` (dev iteration where overwrite is expected), but **dangerous for a tool claiming backup support**.

---

## 5. Fix Plan

### Required Changes in `scripts/sync-assets.js`

| Line(s) | Change | Reason |
|---------|--------|--------|
| 7-14 | Add `MIRROR_TARGETS` map: `commands` → `command` | Dual-directory requirement per AGENTS.md §4 |
| 18-42 | After syncing `commands/*.md` to `commands/`, duplicate same files to `command/` | Mirror without reading `assets/command/` (doesn't exist) |
| 27-30 | Before `rmSync`, create `.backup` copies of existing files | AGENTS.md line 344 guarantee |
| 33 | Add optional diff logging when existing file differs from source | Prevent silent data loss |
| End | Add summary: "X files synced to commands/, Y files mirrored to command/" | Operational visibility |

### Exact Code Change

In the `for...of` loop at line 18, AFTER the existing sync for `commands`:

```javascript
// NEW: Mirror commands/ → command/ for dual-directory compatibility
// Per AGENTS.md: "Both .opencode/command/ and .opencode/commands/ are primary roots.
// All command schemas MUST be duplicated identically in both directories."
const commandMirrorDir = join(projectRoot, ".opencode", "command");
if (kind === "commands" && existsSync(targetDir)) {
  // Create command/ mirror if it doesn't exist
  if (!existsSync(commandMirrorDir)) {
    mkdirSync(commandMirrorDir, { recursive: true });
  }
  for (const entry of readdirSync(targetDir)) {
    if (entry === ".gitkeep") continue;
    if (entry.startsWith("gsd-") || entry === "gsd") continue;  // Don't touch GSD files
    const srcPath = join(targetDir, entry);
    const destPath = join(commandMirrorDir, entry);
    // Backup existing file before overwrite
    if (existsSync(destPath)) {
      const backupPath = destPath + ".backup";
      if (!existsSync(backupPath)) {
        cpSync(destPath, backupPath);
        console.log(`[Harness Build] Backed up ${destPath} → ${backupPath}`);
      }
    }
    cpSync(srcPath, destPath, { recursive: true });
  }
  console.log(`[Harness Build] Mirrored commands to ${commandMirrorDir}`);
}
```

### Add backup before overwrite to the main sync loop (line 27-30):

```javascript
// Before rmSync, backup existing files
if (existsSync(targetDir)) {
  for (const entry of readdirSync(targetDir)) {
    if (entry.endsWith(".backup")) continue;
    const targetPath = join(targetDir, entry);
    const backupPath = targetPath + ".backup";
    if (!existsSync(backupPath)) {
      cpSync(targetPath, backupPath, { recursive: true });
    }
  }
  rmSync(targetDir, { recursive: true, force: true });
}
```

---

## 6. Impact Assessment

| Impact Type | Description | Severity |
|-------------|-------------|----------|
| **Missing HM commands** | 87 `hm-*` commands never reach `command/` — OpenCode hosts using singular-path lookup see 0 HM commands | **HIGH** |
| **AGENTS.md violation** | Policy requires dual-directory sync, but `sync-assets.js` only targets plural | **HIGH** |
| **User data loss** | No backup before `rmSync` — user edits silently destroyed | **MEDIUM** |
| **Inconsistent state** | `command/` has only GSD commands + stale copies of 31 shared files | **MEDIUM** |
| **GSD commands unaffected** | 67 `gsd-*` commands in `command/` are from GSD tooling, not HM sync — will not be touched by fix | ✅ OK |

### Who is affected

- **Package consumers** installing `hivemind` via npm (primary): `postinstall` → `sync-assets.js` → copies only to `commands/`. Users of OpenCode hosts that check `command/` singular get 0 HM commands.
- **Project developers** running `npm run build`: sync only to `commands/`, `command/` drifts further with every build.
- **Future: postinstall hook** (planned in Phase 24.8): when `postinstall: node scripts/sync-assets.js` is added, the bug becomes a shipping defect.

---

## 7. Related Research

An earlier research report (`.planning/research/hm-assets-bootstrap-flow-2026-05-29.md`) independently identified the same `command/` gap, backup absence, and conflict detection issues. That report also noted:
- `assets/commands/` has ~100 files (all `hm-*` and core, no `gsd-*`)
- `assets/.hivemind/` and `assets/agent-instructions/` are not in `PRIMITIVE_MAP` — may be intentional
- The `bootstrapInit()` path in `src/tools/config/bootstrap-init.ts` has `.backup` logic (line 314) that provide a pattern to reuse

---

## Sources

### Code (HIGH confidence)
- `scripts/sync-assets.js` lines 7-14 — PRIMITIVE_MAP definition
- `scripts/sync-assets.js` lines 27-30 — Destructive overwrite (rmSync + mkdirSync)
- `scripts/sync-assets.js` line 33-34 — `.gitkeep` and `gsd-*` filter
- `src/tools/config/bootstrap-init.ts` line 314 — `.backup` pattern
- `src/tools/config/bootstrap-recover.ts` line 229 — `.backup` pattern

### Policy (HIGH confidence)
- `AGENTS.md` line 171 — Dual-directory requirement (command/ AND commands/)
- `AGENTS.md` line 344 — Backup claim (`.backup` suffix before overwrite)

### Filesystem (HIGH confidence)
- `.opencode/command/` — 98 `.md` files (67 GSD, 31 shared)
- `.opencode/commands/` — 118 `.md` files (87 HM, 31 shared)
- `assets/commands/` — ~100 files (all HM/core, no GSD)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all findings verified against live code + filesystem
- Architecture: HIGH — sync flow is straightforward (43 lines)
- Pitfalls: HIGH — destructive overwrite confirmed by reading the code

**Research date:** 2026-05-29
**Valid until:** Next refactor of sync-assets.js (30 days)
