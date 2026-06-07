# AUDIT-04 Cycle 4 — Stage 4 APPLY

**Cycle ID**: 04-skill-04

## 1. Operations

### 1.1 `git mv`

```bash
git mv assets/skills/hm-l2-cross-cutting-change → assets/.archive/dev-tooling/skills/hm-l2-cross-cutting-change
git mv assets/skills/cross-cutting-change-mgmt → assets/.archive/dev-tooling/skills/cross-cutting-change-mgmt
```

### 1.2 Mirror deletion

```bash
rm -rf assets/.hivemind/skills/hm-l2-cross-cutting-change
rm -rf assets/.hivemind/skills/cross-cutting-change-mgmt
```

### 1.3 Cross-ref sweep (18 files, 46 occurrences)

| Surface | Files | Phase |
|---|---|---|
| `assets/agents/` | 1 | A |
| `assets/skills/` | 6 | B |
| `assets/.hivemind/agents/` | 4 | E |
| `assets/.hivemind/skills/` | 4 | E |
| **Total** | **15 unique files** | (1 commit per user override) |

## 2. Pre-commit state

| Check | Result |
|---|---|
| `rg -c "hm-l2-cross-cutting-change" assets/` (excl archive) | 1 (intentional in new) ✓ |
| `rg -c "cross-cutting-change-mgmt" assets/` (excl archive) | 1 (intentional in new) ✓ |
| `test -d assets/skills/hm-cross-change` | true ✓ |
| `test -d assets/skills/hm-l2-cross-cutting-change` | false ✓ |
| `test -d assets/skills/cross-cutting-change-mgmt` | false ✓ |
| `rg -l "hm-cross-change" assets/` (excl archive) | 19 ✓ |

## 3. Sync verification

```bash
node scripts/sync-assets.js → exit 0
```
