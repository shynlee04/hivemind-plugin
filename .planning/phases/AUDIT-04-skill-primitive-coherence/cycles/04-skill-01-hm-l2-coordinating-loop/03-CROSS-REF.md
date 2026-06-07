# AUDIT-04 Cycle 1 — Stage 3/4 CROSS-REF Coverage Table

**Cycle ID**: 04-skill-01
**Stage**: 3/4 CROSS-REF — coverage matrix
**Date**: 2026-06-07

---

## 1. Sweep coverage matrix

### 1.1 `hm-l2-coordinating-loop` → `hm-coord-loop` (old → new)

| # | File | Surface | Phase | Pre-sweep hits | Post-sweep hits | Replacement verified |
|---|---|---|---|---|---|---|
| 1 | `assets/agents/hm-l0-orchestrator.md` | agents | A | 2 | 0 | ✓ |
| 2 | `assets/agents/hf-meta-builder.md` | agents | A | 1 | 0 | ✓ |
| 3 | `assets/agents/hf-l0-orchestrator.md` | agents | A | 3 | 0 | ✓ |
| 4 | `assets/agents/hf-coordinator.md` | agents | A | 1 | 0 | ✓ |
| 5 | `assets/skills/hf-skill-router/SKILL.md` | skills | B | 2 | 0 | ✓ |
| 6 | `assets/skills/hm-l3-integration-contracts/SKILL.md` | skills | B | 4 | 0 | ✓ |
| 7 | `assets/skills/hm-l3-integration-contracts/references/agent-to-skill-bindings.md` | skills | B | 3 | 0 | ✓ |
| 8 | `assets/skills/hm-l3-integration-contracts/references/skill-to-agent-bindings.md` | skills | B | 1 | 0 | ✓ |
| 9 | `assets/skills/hm-l2-skill-router/SKILL.md` | skills | B | 2 | 0 | ✓ |
| 10 | `assets/skills/hm-l2-skill-router/evals/evals.json` | skills | B | 1 | 0 | ✓ |
| 11 | `assets/skills/wave-execution/SKILL.md` | skills | B | 1 | 0 | ✓ |
| 12 | `assets/.hivemind/agents/hf-l0-orchestrator.md` | .hivemind | E | 1 | 0 | ✓ |
| 13 | `assets/.hivemind/agents/hf-l1-coordinator.md` | .hivemind | E | 1 | 0 | ✓ |
| 14 | `assets/.hivemind/agents/hf-l2-meta-builder.md` | .hivemind | E | 1 | 0 | ✓ |
| 15 | `assets/.hivemind/agents/hm-l0-orchestrator.md` | .hivemind | E | 1 | 0 | ✓ |
| 16 | `assets/.hivemind/agents/hm-l1-coordinator.md` | .hivemind | E | 1 | 0 | ✓ |
| 17 | `assets/.hivemind/agents/hm-l2-connector.md` | .hivemind | E | 1 | 0 | ✓ |
| 18 | `assets/.hivemind/skills/hf-l2-skill-router/SKILL.md` | .hivemind | E | 2 | 0 | ✓ |
| 19 | `assets/.hivemind/skills/hm-l2-skill-router/SKILL.md` | .hivemind | E | 2 | 0 | ✓ |
| 20 | `assets/.hivemind/skills/hm-l2-skill-router/evals/evals.json` | .hivemind | E | 1 | 0 | ✓ |
| 21 | `assets/.hivemind/skills/hm-l3-integration-contracts/SKILL.md` | .hivemind | E | 4 | 0 | ✓ |
| 22 | `assets/.hivemind/skills/hm-l3-integration-contracts/references/agent-to-skill-bindings.md` | .hivemind | E | 3 | 0 | ✓ |
| 23 | `assets/.hivemind/skills/hm-l3-integration-contracts/references/skill-to-agent-bindings.md` | .hivemind | E | 1 | 0 | ✓ |
| | **Subtotal** | | | **42** | **0** | **23/23 ✓** |

### 1.2 `multi-agent-coordination` → `hm-coord-loop` (sibling → absorbed)

| # | File | Surface | Phase | Pre-sweep hits | Post-sweep hits | Replacement verified |
|---|---|---|---|---|---|---|
| 24 | `assets/skills/completion-detection/SKILL.md` | skills | B | 1 | 0 | ✓ |
| 25 | `assets/skills/iterative-loop/SKILL.md` | skills | B | 1 | 0 | ✓ |
| 11 | `assets/skills/wave-execution/SKILL.md` (re-shared) | skills | B | 1 | 0 | ✓ |
| | **Subtotal** | | | **3** | **0** | **3/3 ✓** |

**Total sweep coverage**: 25 unique files / 45 occurrences replaced. ZERO residual references to old names in shipped.

### 1.3 Skipped surfaces (intentional)

| Surface | Reason |
|---|---|
| `assets/commands/` | Pre-sweep `rg`: 0 hits — no commands reference the old names |
| `assets/workflows/` | Pre-sweep `rg`: 0 hits — no workflows reference the old names |
| `assets/references/` | Pre-sweep `rg`: 0 hits — no references reference the old names |
| `assets/templates/` | Pre-sweep `rg`: 0 hits — no templates reference the old names |
| `assets/agent-instructions/` | Pre-sweep `rg`: 0 hits — no agent instructions reference the old names |
| `assets/.archive/dev-tooling/skills/{hm-l2-coordinating-loop,multi-agent-coordination}/` | Archived sources retain their original self-name (intentional) |

## 2. Mirror sync

| Action | File | Status |
|---|---|---|
| Delete mirror of archived source | `assets/.hivemind/skills/hm-l2-coordinating-loop/SKILL.md` | ✓ done (force-rm) |
| Mirror dir cleanup | `assets/.hivemind/skills/hm-l2-coordinating-loop/` | ✓ done (rm -rf) |

The mirror deletion is appropriate because the source SKILL.md moved to `assets/.archive/`, which is excluded from `sync-assets.js` (per `EXCLUDED_ASSETS_SUBDIRS`).

## 3. Special handling notes

### 3.1 `evals/evals.json` (in 2 places)

The file `assets/skills/hm-l2-skill-router/evals/evals.json` had 1 reference to `hm-l2-coordinating-loop` in an evidence string. The replacement is text-only and does not affect the JSON schema. Post-sweep, the eval still describes the same skill router, just with updated `evidence` field content.

### 3.2 Consumed-by chain rebinding

The new `hm-coord-loop/SKILL.md` declares `consumed-by: [hm-orchestrator, hm-coordinator, hf-coordinator]` (canonical STRICT lineage). The 4 agents that previously had `consumed-by: [hm-l2-coordinating-loop, ...]` were not renamed in this cycle (out of scope per master plan §2.2 — separate `hm-l[0-3]-*` agent rename cycles are scheduled but outside this 5-cycle sub-wave). Result: those agent files now have a chain pointing to a renamed skill, which is the correct intermediate state.

### 3.3 Table-row references

The `hm-l3-integration-contracts/SKILL.md` and its 2 reference files contain table rows that include the old name in skill-to-agent binding rows. The replacement is text-only and preserves table structure.

### 3.4 `wave-execution` cross-ref

`wave-execution/SKILL.md` line 13 references `multi-agent-coordination` in prose, and line 272 references `hm-l2-coordinating-loop` in a comparison table. Both replaced with `hm-coord-loop`. The comparison-table context now reads: "`hm-coord-loop` — Coordinates multi-agent dispatch — owns the delegation mechanics. Wave execution uses dispatch mechanics but does not teach coordination patterns." (semantics preserved).

## 4. Coverage verification (post-sweep)

```bash
# Assertion: 0 hits in shipped for old names
rg -c "hm-l2-coordinating-loop" assets/ 2>/dev/null | grep -v "/.archive/" | grep -v ":0$"
# Result: 0 files

rg -c "multi-agent-coordination" assets/ 2>/dev/null | grep -v "/.archive/" | grep -v ":0$"
# Result: 0 files

# Assertion: new name present in expected surfaces
rg -l "hm-coord-loop" assets/ 2>/dev/null | grep -v "/.archive/" | wc -l
# Result: 26 (25 swept + 1 new SKILL.md self)
```

All assertions PASS.
