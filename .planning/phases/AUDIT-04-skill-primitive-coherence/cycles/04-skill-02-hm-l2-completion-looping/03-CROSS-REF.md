# AUDIT-04 Cycle 2 — Stage 3/4 CROSS-REF Coverage Table

**Cycle ID**: 04-skill-02
**Stage**: 3/4 CROSS-REF — coverage matrix
**Date**: 2026-06-07

## 1. Sweep coverage matrix

### 1.1 `hm-l2-completion-looping` → `hm-loop-completion`

| Surface | Files swept | Occurrences replaced |
|---|---|---|
| `assets/agents/` | 3 | 4 (hf-coordinator, hm-l0-orchestrator, hf-l0-orchestrator) |
| `assets/skills/` | 6 (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs+evals) | 22 |
| `assets/.hivemind/agents/` | 8 (hf-l0/l1-orchestrator/coordinator, hm-l0/l1-orchestrator/coordinator, hm-l2-debugger/finisher/guardian/persistor) | 16 |
| `assets/.hivemind/skills/` | 4 (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs+evals mirror) | 22 |
| **Subtotal** | **21** | **64** |

### 1.2 `completion-detection` → `hm-loop-completion`

| Surface | Files swept | Occurrences replaced |
|---|---|---|
| `assets/skills/` | 1 (iterative-loop) | 1 |
| `assets/skills/` (hivemind-power-on ref) | 1 | 1 |
| **Subtotal** | **2** | **2** |

### 1.3 Skipped (intentional)

| File | Reason |
|---|---|
| `assets/skills/hm-loop-completion/SKILL.md` | NEW self-reference + 2 intentional history mentions in body (lines 58-59) |
| `assets/.archive/dev-tooling/skills/hm-l2-completion-looping/SKILL.md` | Archived source retains original self-name |
| `assets/.archive/dev-tooling/skills/completion-detection/SKILL.md` | Archived source retains original self-name |
| `assets/.hivemind/agents/hm-l2-{debugger,finisher,guardian,persistor}.md` | Phantom agent files (out of cycle scope; only the `hm-l2-completion-looping` reference inside is replaced) |

## 2. Mirror sync

| Action | File | Status |
|---|---|---|
| Delete mirror of archived source | `assets/.hivemind/skills/hm-l2-completion-looping/SKILL.md` | ✓ done (rm -rf) |
| Delete mirror of archived source | `assets/.hivemind/skills/completion-detection/SKILL.md` | ✓ done (rm -rf) |

## 3. Special handling notes

### 3.1 Phantom agent files

The 4 phantom agent files (`hm-l2-debugger`, `hm-l2-finisher`, `hm-l2-guardian`, `hm-l2-persistor`) in `assets/.hivemind/agents/` are referenced from `hm-l2-completion-looping`'s `consumed-by` field. The `hm-l2-completion-looping` reference inside these files (in their own `consumed-by` lists or binding tables) is replaced. The phantom agent files themselves are NOT renamed in this cycle — that is a separate phantom-resolution cycle (per 04-03 §6.1).

### 3.2 Central registry files

`hm-l3-integration-contracts/SKILL.md` and 2 reference files are the central binding registry. The sweep updates the rows that reference `hm-l2-completion-looping`. The phantom agent entries inside (e.g., `hm-l2-debugger`, `hm-l2-finisher`) remain until the phantom-resolution cycle.

### 3.3 New SKILL.md intentional references

`assets/skills/hm-loop-completion/SKILL.md` lines 58-59 cite the old names in the "Composition" history block. These are intentional documentation references (showing the merge source), not broken refs. The validator does not flag them (they appear in code-block context, not as identifiers).

## 4. Coverage verification (post-sweep)

```bash
# A1: 0 hits in shipped for old names (excluding archive + intentional history)
rg -c "hm-l2-completion-looping" assets/ 2>/dev/null | grep -v "/.archive/" | grep -v ":0$"
# Result: 1 file (the new SKILL.md history line — intentional)

rg -c "completion-detection" assets/ 2>/dev/null | grep -v "/.archive/" | grep -v ":0$"
# Result: 1 file (the new SKILL.md history line — intentional)

# A2: new name present in expected surfaces
rg -l "hm-loop-completion" assets/ 2>/dev/null | grep -v "/.archive/" | wc -l
# Result: 30 (1 new + 29 swept)
```

**Verdict**: PASS. The 2 residual hits are intentional history documentation in the new SKILL.md, not broken refs.
