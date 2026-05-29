# HM Assets Bootstrap Flow: sync-assets.js Analysis

**Date:** 2026-05-29
**Context:** Phase 24.7 — Verify the `assets/` → `.opencode/` sync flow for correctness and completeness.
**Method:** Read `scripts/sync-assets.js`, compare `assets/` and `.opencode/` directories.

---

## Source Analysis

### sync-assets.js (43 lines)

```javascript
const PRIMITIVE_MAP = {
  agents:     join(projectRoot, ".opencode", "agents"),
  skills:     join(projectRoot, ".opencode", "skills"),
  commands:   join(projectRoot, ".opencode", "commands"),
  workflows:  join(projectRoot, ".opencode", "workflows"),
  references: join(projectRoot, ".opencode", "references"),
  templates:  join(projectRoot, ".opencode", "templates"),
};
```

### Sync Algorithm
1. For each primitive kind in PRIMITIVE_MAP:
   - Check if `assets/{kind}/` exists
   - If not: skip with log message
   - If yes: `rm -rf` target directory, `mkdir -p` target, then copy each entry
2. Filter out `.gitkeep` files (skip)
3. Filter out `gsd-*` and `gsd` entries (skip — GSD primitives excluded from HM sync)
4. Use `cpSync` with `recursive: true` for directories

---

## Dimension 1: What Gets Synced

| Primitive | assets/ | .opencode/ (target) | Status |
|-----------|---------|---------------------|--------|
| agents | ✅ 43 files (in assets/agents/) | ✅ agents/ | ✅ |
| skills | ✅ 34 files | ✅ skills/ | ✅ |
| commands | ✅ ~100 files | ✅ commands/ | ✅ |
| workflows | ✅ ~106 files | ✅ workflows/ | ✅ |
| references | ✅ 71 entries (70 files + .gitkeep) | ✅ references/ | ✅ |
| templates | ✅ 41 entries (40 files + .gitkeep) | ✅ templates/ | ✅ |

All 6 primitive kinds have source directories, and all are copied to target.

---

## Dimension 2: NOT Synced — The `command/` (Singular) Gap

The sync script only writes to `.opencode/commands/` (plural). It does NOT write to `.opencode/command/` (singular).

Per AGENTS.md:
> "All command files MUST be duplicated identically to both `.opencode/command/` and `.opencode/commands/` directories to prevent installation version incompatibilities."

This requirement is **not enforced** by the sync script. While `scripts/sync-assets.js` may have an upstream duplication step before it, the sync itself does not produce the required dual-path output.

### Impact

If OpenCode is installed on a host that checks the singular `command/` directory, command discovery will find 0 `hm-*` commands — only whatever was manually placed there (likely the GSD commands from get-shit-done).

---

## Dimension 3: GSD Primitive Exclusion (Correct Behavior)

The sync script explicitly skips `gsd-*` prefixed entries:
```javascript
if (entry.startsWith("gsd-") || entry === "gsd") continue;
```

This is correct per the architecture:
- GSD primitives are internal developer tooling, tracked in `gsd-file-manifest.json`
- HM syncs only `hm-*`, `hf-*`, and unprefixed non-gsd primitives
- GSD primitives have their own sync path through `get-shit-done/`

**Verdict: Correct behavior.** GSD exclusion prevents namespace pollution.

---

## Dimension 4: Overwrite Behavior — No Conflict Detection

The sync script performs a **destructive overwrite**:
```javascript
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });  // ⚠️ Always destroys target first
}
```

### Issues
1. **No diff check** — any manual edits in `.opencode/` are silently destroyed
2. **No backup** — previous versions are not preserved
3. **No conflict detection** — if an asset was modified in both `assets/` and `.opencode/`, the assets version always wins silently

Per AGENTS.md:
> "User-modified files are backed up (`.backup` suffix) before overwrite during updates."

This backup mechanism is **not implemented** in `sync-assets.js`. The AGENTS.md claim is aspirational, not functional.

### Impact

If a user manually edits a command file in `.opencode/commands/hm-execute.md` and then runs `sync-assets.js`, their edits are permanently lost with no warning.

---

## Dimension 5: Path Symmetry Check

| assets/ path | .opencode/ path (target) | Symmetric? |
|-------------|-------------------------|------------|
| `assets/agents/` | `.opencode/agents/` | ✅ |
| `assets/skills/` | `.opencode/skills/` | ✅ |
| `assets/commands/` | `.opencode/commands/` | ✅ |
| `assets/workflows/` | `.opencode/workflows/` | ✅ |
| `assets/references/` | `.opencode/references/` | ✅ |
| `assets/templates/` | `.opencode/templates/` | ✅ |
| `assets/agents/` | `.opencode/agents/` | ✅ |

All paths are symmetric. No mapping surprises.

---

## Dimension 6: `assets/.hivemind/` and `assets/agent-instructions/`

The assets directory contains two additional entries:

```
assets/
├── .hivemind/         # NOT in PRIMITIVE_MAP → not synced
├── agent-instructions/ # NOT in PRIMITIVE_MAP → not synced
├── agents/
├── commands/
├── references/
├── skills/
├── templates/
└── workflows/
```

These directories exist in `assets/` but are not processed by `sync-assets.js`. This may be intentional (they have their own sync path) or an oversight. If they contain content intended for `.opencode/` or `.hivemind/`, the sync script is incomplete.

---

## Summary of Findings

| Issue | Severity | Details |
|-------|----------|---------|
| `command/` (singular) NOT synced | **HIGH** | Per AGENTS.md, all commands must duplicate to both `command/` and `commands/` |
| No backup before overwrite | **MEDIUM** | AGENTS.md claims `.backup` behavior — not implemented |
| No conflict detection | **MEDIUM** | Silent overwrite of manual edits |
| GSD exclusion correct | ✅ OK | |
| All 6 primitives synced | ✅ OK | agents, skills, commands, workflows, references, templates |
| Path symmetry | ✅ OK | assets/ → .opencode/ mapping is 1:1 |
| `assets/.hivemind/` unsynced | ⚠️ UNKNOWN | May be intentional or an omission |
| `assets/agent-instructions/` unsynced | ⚠️ UNKNOWN | May be intentional or an omission |

---

## Recommendations

1. **Add command/ (singular) duplication** — After writing to `commands/`, iterate files and copy to `command/` with identical content
2. **Add backup before overwrite** — Before `rmSync`, move the target to `{path}.backup-{timestamp}` or per AGENTS.md's `.backup` suffix pattern
3. **Add diff warning** — If the target exists and differs from source, log a warning before overwriting
4. **Document unsynced directories** — Either add `assets/.hivemind/` and `assets/agent-instructions/` to PRIMITIVE_MAP or remove them from `assets/` to avoid confusion
