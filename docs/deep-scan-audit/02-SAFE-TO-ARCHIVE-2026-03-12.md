# Safe to Archive

**Generated**: 2026-03-12
**Total Files**: 15+
**Risk Level**: LOW (all have no active consumers)

---

## 🔴 DEAD CODE - NO CONSUMERS (6 files)

> These files have no imports, requires, or runtime references. Safe to archive with rollback capability.

| File | Reason | Risk | Recommended Action |
|------|--------|------|-------------------|
| `src/lib/file-lock.ts` | No consumers found | LOW | Archive to `.archive/dead-code/` |
| `src/lib/orphan-quarantine.ts` | Schema exists but no integration | LOW | Archive — schema may be reused |
| `src/lib/project-snapshot.ts` | Extracted but never imported | LOW | Archive to `.archive/dead-code/` |
| `src/lib/session-memory-classifier.ts` | Schema exists but no tool/hook | LOW | Archive — schema may be reused |
| `src/lib/skill-registry.ts` | Superseded by `skill-loader.ts` | LOW | Archive after verifying skill-loader coverage |
| `src/lib/tool-activation.ts` | No consumers + corrupted content | LOW | Archive — content appears corrupted |

### Verification Commands

```bash
# Verify no consumers before archival
grep -r "file-lock" src/ --include="*.ts"
grep -r "orphan-quarantine" src/ --include="*.ts"
grep -r "project-snapshot" src/ --include="*.ts"
grep -r "session-memory-classifier" src/ --include="*.ts"
grep -r "skill-registry" src/ --include="*.ts"
grep -r "tool-activation" src/ --include="*.ts"
```

### Archive Command

```bash
mkdir -p .archive/dead-code/2026-03-12
mv src/lib/file-lock.ts .archive/dead-code/2026-03-12/
mv src/lib/orphan-quarantine.ts .archive/dead-code/2026-03-12/
mv src/lib/project-snapshot.ts .archive/dead-code/2026-03-12/
mv src/lib/session-memory-classifier.ts .archive/dead-code/2026-03-12/
mv src/lib/skill-registry.ts .archive/dead-code/2026-03-12/
mv src/lib/tool-activation.ts .archive/dead-code/2026-03-12/
```

---

## 🟢 DEPRECATED COMPATIBILITY SURFACES (8+ items)

> These files exist for backward compatibility only. No new code should reference them.

### State Files

| File | Status | Replacement | Action |
|------|--------|-------------|--------|
| `.hivemind/state/runtime-profile.json` | Deprecated | `profile.json` per-session | Archive |
| `.hivemind/state/context-recovery.json` | Deprecated | Session-based recovery | Archive |
| `.hivemind/state/health-metrics.json` | Deprecated | `detection.ts` counters | Archive |

### Directories

| Directory | Status | Replacement | Action |
|-----------|--------|-------------|--------|
| `.hivemind/anchors/` | Deprecated | `anchors.json` in state | Archive |
| `.hivemind/mems/` | Deprecated | `mems.json` in state | Archive |

### Index Files

| File | Status | Replacement | Action |
|------|--------|-------------|--------|
| `.hivemind/INDEX.md` | Deprecated | Hierarchy navigation | Archive |
| `.hivemind/sessions/index.md` | Deprecated | Session list tool | Archive |

### Wrapper Files

| File | Status | Replacement | Action |
|------|--------|-------------|--------|
| `src/tools/hivemind-doc-weaver.ts` | Compatibility-only | `src/lib/code-intel/doc-weaver.ts` | Archive |

### Archive Command

```bash
mkdir -p .archive/deprecated/2026-03-12

# State files
mv .hivemind/state/runtime-profile.json .archive/deprecated/2026-03-12/ 2>/dev/null || true
mv .hivemind/state/context-recovery.json .archive/deprecated/2026-03-12/ 2>/dev/null || true
mv .hivemind/state/health-metrics.json .archive/deprecated/2026-03-12/ 2>/dev/null || true

# Directories
mv .hivemind/anchors/ .archive/deprecated/2026-03-12/ 2>/dev/null || true
mv .hivemind/mems/ .archive/deprecated/2026-03-12/ 2>/dev/null || true

# Index files
mv .hivemind/INDEX.md .archive/deprecated/2026-03-12/ 2>/dev/null || true
mv .hivemind/sessions/index.md .archive/deprecated/2026-03-12/ 2>/dev/null || true

# Wrapper
mv src/tools/hivemind-doc-weaver.ts .archive/deprecated/2026-03-12/ 2>/dev/null || true
```

---

## 🔴 DELETED 2026-03-09 (9 files)

> Already removed from repository. Listed here for audit trail.

| Path | Reason |
|------|--------|
| `.opencode/plugins/hiveops-governance/` | Plugin removed from `opencode.json` |
| `.opencode/plugins/hiveops-governance/plugin.json` | Dual-injector conflict resolved |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | System 1 injection disabled |
| `.opencode/plugins/hiveops-governance/hooks/*.ts` | All plugin hooks |
| `.opencode/plugins/hiveops-governance/schemas/*.ts` | All plugin schemas |

### Resolution

- Plugin was the source of dual-injector conflict (HM-01)
- Removed from `opencode.json` plugins list
- All files marked `@deprecated` before deletion
- `src/hooks/` is now sole governance owner

---

## Rollback Procedure

If archived files are needed:

```bash
# Restore from archive
cp .archive/dead-code/2026-03-12/<file> src/lib/
cp .archive/deprecated/2026-03-12/<file> .hivemind/state/

# Run tests
npm test
npx tsc --noEmit
```

---

## Pre-Archive Checklist

- [ ] Run verification commands for each dead code file
- [ ] Confirm no dynamic imports (`await import()`)
- [ ] Check for string-based requires (`require('...')`)
- [ ] Verify no CLI entry points reference these files
- [ ] Run full test suite after archival
- [ ] Update any documentation references

---

## Summary

| Category | Count | Risk | Status |
|----------|-------|------|--------|
| Dead Code | 6 | LOW | Ready to archive |
| Deprecated State Files | 3 | LOW | Ready to archive |
| Deprecated Directories | 2 | LOW | Ready to archive |
| Deprecated Index Files | 2 | LOW | Ready to archive |
| Compatibility Wrappers | 1 | LOW | Ready to archive |
| Already Deleted | 9 | NONE | Audit trail only |
| **TOTAL** | **23** | **LOW** | — |

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
