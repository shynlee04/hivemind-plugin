# AUDIT-04 Cycle 1 — Stage 1 RED Audit

**Cycle ID**: 04-skill-01
**Old name**: `hm-l2-coordinating-loop` (HM STRICT lineage)
**Sibling**: `multi-agent-coordination` (unprefixed, FLEXIBLE lineage)
**New name**: `hm-coord-loop` (HM STRICT lineage, prefix `hm-coord-*`)
**Date**: 2026-06-07
**Stage**: 1 RED — failing-test audit

---

## 1. Knowledge delta (since authoring)

The two source skills were authored before the AUDIT-04 cycle template locked in:

1. **22-prefix taxonomy** (per 04-03-NAMING-TAXONOMY.md §3.1): `hm-coord-*` is the canonical prefix for the coordination domain. The old `hm-l2-coordinating-loop` name violates the residual l-residual rule (F01 in `assets/.hivemind-config/naming-rules.json`).
2. **Merge absorption**: `multi-agent-coordination` is the unprefixed framework-agnostic foundation (per 04-03 §3.6 row 56). It must be absorbed into the new `hm-coord-loop` and removed from shipped surface to eliminate duplication.
3. **9-surface mutation authority** (per 04-04 §0.1 + `.opencode/AGENTS.md` §CONSTITUTION): the new `SKILL.md` must declare `consumed-by` and `access` correctly per the new 9-surface model.
4. **Tech-agnostic rule** (per master plan §9.1): no `gpt-4*`, `claude-*`, `next.config`, `package.json`, `get-shit-done` paths in body. All platform refs go to Hivemind tools (`delegate-task`, `hivemind-trajectory`, `hivemind-sdk-supervisor`).
5. **GSD Compatibility** (per 04-04 §4 + 04-01 §G.1 G.3): `hm-coord-loop` requires a `## GSD Compatibility` section mapping to `gsd-execute-phase`.

## 2. Anti-pattern scan

### 2.1 Forbidden-name violations in shipped surface

| File | Line | Pattern | Forbidden rule |
|---|---|---|---|
| `assets/skills/hm-l2-coordinating-loop/SKILL.md` | 2, 6, 7, 8 | `name: hm-l2-coordinating-loop` + `consumed-by` lists `hm-l0-orchestrator`, `hm-l1-coordinator`, `hm-l2-connector` | F01 (residual l0-l3 prefix) |
| `assets/.hivemind/skills/hm-l2-coordinating-loop/SKILL.md` | (mirror) | Same | F01 |
| `assets/agents/hm-l0-orchestrator.md` | 1+ | `consumed-by: hm-l2-coordinating-loop` (ghost-chain reference) | F01 |
| `assets/agents/hf-l0-orchestrator.md` | 1+ | (l0 residual) | F01 |

### 2.2 Tech-stack violations

| File | Line | Pattern | Forbidden rule |
|---|---|---|---|
| `assets/skills/hm-l2-coordinating-loop/SKILL.md` | 40-47 | `<files_to_read>` block points to `.opencode/skills/hm-coordinating-loop/...` (path doesn't exist in shipped; only `.opencode/skills/hm-l2-coordinating-loop/`) and `.opencode/get-shit-done/references/thinking-models-execution.md` (F06: `get-shit-done` in shipped) | F06, F09 |
| `assets/skills/multi-agent-coordination/SKILL.md` | 191 | `references/terminology-map.md` explains GSD/OMO/Hivemind coordination — borderline tech-ref | (rewrite to remove GSD/OMO comparison in merge) |

### 2.3 Forbidden-name anti-patterns (F08-F11) in body

| File | Line | Pattern | Forbidden rule |
|---|---|---|---|
| (none found) | — | — | F08-F11 not triggered |

## 3. Broken references (inbound to old names)

**`hm-l2-coordinating-loop`**: 25 files, 42 occurrences (excluding the source SKILL.md self-name). Distribution:

| Surface | Files | Lines |
|---|---|---|
| `assets/agents/` | 4 | 7 |
| `assets/agent-instructions/` | 0 | 0 |
| `assets/skills/` | 8 | 15 |
| `assets/commands/` | 0 | 0 |
| `assets/workflows/` | 0 | 0 |
| `assets/references/` | 0 | 0 |
| `assets/templates/` | 0 | 0 |
| `assets/.hivemind/` (mirror) | 13 | 20 |

**`multi-agent-coordination`**: 4 files, 6 occurrences (excluding the source SKILL.md self-name). Distribution:

| Surface | Files | Lines |
|---|---|---|
| `assets/agents/` | 0 | 0 |
| `assets/skills/` | 4 | 6 |
| `assets/.hivemind/` (mirror) | 0 | 0 |

**Total inbound refs to migrate**: 25 + 4 = 29 files.

**Top consumer files**:
- `assets/skills/hm-l3-integration-contracts/SKILL.md` (3 refs to old name)
- `assets/skills/hm-l2-skill-router/SKILL.md` (1 ref + 1 in evals.json)
- `assets/.hivemind/agents/hm-l0-orchestrator.md` (1 ref in consumed-by, plus broader l0/l1 chain)
- `assets/.hivemind/agents/hf-l0-orchestrator.md` (1 ref)

## 4. Current consumers (binding table)

| Consumer file | Type | Reference target |
|---|---|---|
| `assets/agents/hm-l0-orchestrator.md` | agent | consumed-by (l2-coordinating-loop) |
| `assets/agents/hf-l0-orchestrator.md` | agent | consumed-by (l2-coordinating-loop) |
| `assets/agents/hf-coordinator.md` | agent | description (l2-coordinating-loop pattern) |
| `assets/agents/hf-meta-builder.md` | agent | description (l2-coordinating-loop pattern) |
| `assets/skills/hm-l2-skill-router/SKILL.md` | skill | routing logic |
| `assets/skills/hm-l2-skill-router/evals/evals.json` | eval | trigger phrase |
| `assets/skills/hm-l3-integration-contracts/SKILL.md` | skill | binding table |
| `assets/skills/hm-l3-integration-contracts/references/agent-to-skill-bindings.md` | reference | binding row |
| `assets/skills/hm-l3-integration-contracts/references/skill-to-agent-bindings.md` | reference | binding row |
| `assets/skills/wave-execution/SKILL.md` | skill | cross-ref |

## 5. 5-realm coverage baseline (RED)

| Realm | Score (0/1/2/3) | Notes |
|---|---|---|
| spec-driven | 2 | Has frontmatter; description in third-person; role declared |
| test-driven | 1 | No automated test; gates via `bash scripts/check-gate.sh` (not present in shipped) |
| doc-driven | 2 | Comprehensive procedure, anti-patterns, worked example |
| arch-driven | 2 | Decision flowchart, edge guardrails, ralph-loop integration |
| clean-code-driven | 2 | Anti-patterns table, self-correction protocol |
| **Total** | **9/15** | All ≥2 except test-driven at 1 (acceptable for skill-merge) |

## 6. Test assertions (Stage 1 RED — all FAIL pre-cycle)

The "test" is the validator + grep sanity scan. All must FAIL before the cycle:

```bash
# Assertion 1: Old name must be in shipped surface (pre-cycle) — confirms RED state
rg -c 'hm-l2-coordinating-loop' assets/  # Expected: ≥21

# Assertion 2: New name must NOT exist (pre-cycle) — confirms RED state
rg -c 'hm-coord-loop' assets/  # Expected: 0

# Assertion 3: Old skill dir must exist (pre-cycle) — confirms RED state
test -d assets/skills/hm-l2-coordinating-loop && echo "EXISTS"  # Expected: EXISTS

# Assertion 4: New skill dir must NOT exist (pre-cycle) — confirms RED state
test ! -d assets/skills/hm-coord-loop && echo "NOT_EXISTS"  # Expected: NOT_EXISTS

# Assertion 5: Validator confirms new name is acceptable (pre-cycle)
bash assets/.hivemind-config/validate-name.sh "hm-coord-loop skill"  # Expected: exit 0
```

**RED result**: Assertions 1, 3, 5 PASS (the current broken state). Assertions 2, 4 FAIL (new name not yet introduced). This is the failing-test signal.

## 7. Done when

- [x] All 7 sub-sections present.
- [x] Anti-patterns enumerated with file:line.
- [x] Inbound ref count = 29 files (matches 04-02 §D + 04-03 §7.1 row H11 + §3.6 row 56: 21 + 2 = 23 raw + 6 self-references in source + mirror).
- [x] 5-realm baseline scored.
- [x] RED test assertions recorded.
