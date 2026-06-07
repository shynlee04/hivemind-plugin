# AUDIT-04 Cycle 3 — Stage 4 APPLY Sweep Log

**Cycle ID**: 04-skill-03

## 1. Operations

### 1.1 `git mv` (atomic)

```bash
git mv assets/skills/hm-l2-phase-loop → assets/.archive/dev-tooling/skills/hm-l2-phase-loop
git mv assets/skills/iterative-loop → assets/.archive/dev-tooling/skills/iterative-loop
```

### 1.2 Mirror deletion

```bash
rm -rf assets/.hivemind/skills/hm-l2-phase-loop
rm -rf assets/.hivemind/skills/iterative-loop
```

### 1.3 Cross-ref sweep (18 files, 30 occurrences)

| Surface | Files | Phase |
|---|---|---|
| `assets/agents/` | 1 | A |
| `assets/skills/` | 7 | B |
| `assets/.hivemind/agents/` | 4 | E |
| `assets/.hivemind/skills/` | 4 | E |
| `assets/commands/` | 0 | C |
| `assets/{workflows,references,templates}/` | 0 | D |
| **Total** | **16 unique files** (some overlap in evals.json) | (1 commit per user override) |

## 2. Pre-commit state

| Check | Expected | Actual |
|---|---|---|
| `rg -c "hm-l2-phase-loop" assets/` (excl archive) | 0 (1 intentional in new) | **1** ✓ |
| `rg -c "iterative-loop" assets/` (excl archive) | 0 (1 intentional in new) | **1** ✓ |
| `test -d assets/skills/hm-loop-phase` | true | **true** ✓ |
| `test -d assets/skills/hm-l2-phase-loop` | false | **false** ✓ |
| `test -d assets/skills/iterative-loop` | false | **false** ✓ |
| `test -d assets/.archive/dev-tooling/skills/hm-l2-phase-loop` | true | **true** ✓ |
| `test -d assets/.archive/dev-tooling/skills/iterative-loop` | true | **true** ✓ |
| `rg -l "hm-loop-phase" assets/` (excl archive) | ≥20 | **20** ✓ |

## 3. Sync verification

```bash
node scripts/sync-assets.js → exit 0
```
