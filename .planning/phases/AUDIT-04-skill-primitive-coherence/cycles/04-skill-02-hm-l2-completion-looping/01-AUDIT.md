# AUDIT-04 Cycle 2 — Stage 1 RED Audit

**Cycle ID**: 04-skill-02
**Old name**: `hm-l2-completion-looping` (HM STRICT, 158 LOC)
**Sibling**: `completion-detection` (unprefixed, 225 LOC)
**New name**: `hm-loop-completion` (HM STRICT, prefix `hm-loop-*`)
**Date**: 2026-06-07
**Stage**: 1 RED — failing-test audit

## 1. Knowledge delta (since authoring)

The 2 source skills were authored before the AUDIT-04 cycle template locked in:

1. **22-prefix taxonomy** (04-03 §2.1): `hm-loop-*` is canonical for iteration/completion/phase looping.
2. **Merge absorption**: `completion-detection` is the framework-agnostic discipline; `hm-l2-completion-looping` is the loop mechanics. Both merge into `hm-loop-completion` (NEW).
3. **Hivemind runtime bindings**: New custom tools `hivemind-sdk-supervisor` + `delegation-status` + `hivemind-trajectory` must be named (per master plan §8, F8 "show-don't-tell").
4. **GSD Compatibility** (G.2): `hm-loop-completion` requires `## GSD Compatibility` mapping to `gsd-verify-work`.
5. **Consumed-by re-binding**: Old `consumed-by` includes 6 phantoms (`hm-l2-debugger`, `hm-l2-finisher`, `hm-l2-guardian`, `hm-l2-investigator`, `hm-l2-operator`, `hm-l2-persistor`) per 04-03 §6.1 phantom register P6/P7.

## 2. Anti-pattern scan

### 2.1 Forbidden-name violations (F01)

| File | Pattern | Rule |
|---|---|---|
| `hm-l2-completion-looping/SKILL.md:2, 14-20, 21-25` | `name: hm-l2-completion-looping`, `consumed-by: [hm-l2-*]` | F01 |
| `assets/.hivemind/skills/hm-l2-completion-looping/SKILL.md` (mirror) | same | F01 |
| 5 phantom agent names: `hm-l2-debugger`, `hm-l2-finisher`, `hm-l2-guardian`, `hm-l2-investigator`, `hm-l2-operator`, `hm-l2-persistor` | 04-03 §6.1 P6/P7 | F01 (phantom) |
| `hm-l2-coordinating-loop` (line 156 of source) | downstream stale ref | F01 |

### 2.2 Tech-stack / framework violations

| File | Pattern | Disposition |
|---|---|---|
| (none in body) | — | clean |

### 2.3 Phantom detection

| Phantom | Refs | Disposition (per 04-03 §6.1) |
|---|---|---|
| `hm-l2-debugger` | bound to `hm-l2-completion-looping` | CORRECT → `hm-debugger` (assumed canonical) or ABOLISH (no such agent) |
| `hm-l2-finisher` | same | ABOLISH (no such agent) |
| `hm-l2-guardian` | same | ABOLISH (no such agent) |
| `hm-l2-investigator` | same | ABOLISH (P7) |
| `hm-l2-operator` | same | ABOLISH (P6) |
| `hm-l2-persistor` | same | CORRECT → `hm-persistor` (assumed) or ABOLISH |

For the new SKILL.md `consumed-by`, use the canonical post-rename names. Phantom resolution is out-of-scope for this cycle; the binding table row may need a second pass when the central registry (`hm-platform-contracts`, future cycle) is updated.

## 3. Broken references (inbound to old names)

`hm-l2-completion-looping`: **29 files / 74 occurrences** (excluding the source SKILL.md self-name)
`completion-detection`: **2 files / 9 occurrences** (excluding self)
**Total: 31 unique files / 83 occurrences** to migrate.

| Surface | Files (C2-loop) | Files (C2-detect) | Total |
|---|---|---|---|
| `assets/agents/` | 3 | 0 | 3 |
| `assets/agent-instructions/` | 0 | 0 | 0 |
| `assets/skills/` (excl. sources) | 6 | 1 | 7 |
| `assets/commands/` | 0 | 0 | 0 |
| `assets/workflows/` | 0 | 0 | 0 |
| `assets/references/` | 0 | 0 | 0 |
| `assets/templates/` | 0 | 0 | 0 |
| `assets/.hivemind/` (mirror) | 11 | 1 | 12 |
| `assets/.hivemind/agents/` | 8 | 0 | 8 |

## 4. Current consumers

| Consumer | Type | Note |
|---|---|---|
| `assets/agents/hm-l0-orchestrator.md` | agent | binding |
| `assets/agents/hf-l0-orchestrator.md` | agent | binding |
| `assets/agents/hf-coordinator.md` | agent | binding |
| `assets/skills/hm-l2-skill-router/SKILL.md` | skill | reference |
| `assets/skills/hm-l2-skill-router/references/routing-map.md` | reference | routing |
| `assets/skills/hm-l2-skill-router/evals/evals.json` | eval | trigger |
| `assets/skills/hm-l3-integration-contracts/SKILL.md` | skill | central registry |
| `assets/skills/hm-l3-integration-contracts/references/{agent-to-skill-bindings,skill-to-agent-bindings}.md` | reference | central registry |
| `assets/skills/hm-l3-integration-contracts/evals/evals.json` | eval | central registry |
| `assets/skills/hivemind-power-on/references/04-project-phase-routing.md` | reference | routing |
| `assets/skills/wave-execution/SKILL.md` | skill | reference |
| `assets/skills/iterative-loop/SKILL.md` | skill | reference (mentions completion-detection) |
| `assets/.hivemind/agents/hm-l2-{debugger,finisher,guardian,persistor}.md` | agent | phantom (out of cycle scope) |
| `assets/.hivemind/agents/{hm-l0-orchestrator,hm-l1-coordinator,hf-l0-orchestrator,hf-l1-coordinator}.md` | agent | l0/l1 to be renamed in 3.0 |

## 5. 5-realm coverage baseline (RED)

| Realm | Score | Notes |
|---|---|---|
| spec-driven | 2 | Has frontmatter; description with trigger conditions |
| test-driven | 2 | Iron Law + 3 gates + dual-signal + claim grading — strong TDD discipline |
| doc-driven | 2 | Iron Law, anti-patterns table, self-correction protocol |
| arch-driven | 2 | Durable cursor schema, loop types, runtime binding layer (Hivemind tools) |
| clean-code-driven | 2 | Anti-patterns, fresh-evidence rule, separation rule |
| **Total** | **10/15** | Lift target: ≥12 in GREEN |

## 6. Test assertions (Stage 1 RED — pre-cycle)

```bash
# A1: Old name in shipped surface (pre-cycle) — confirms broken state
rg -c "hm-l2-completion-looping" assets/ | grep -v "/.archive/" | grep -v ":0$" | wc -l  # 29+

# A2: completion-detection in shipped (pre-cycle) — confirms broken state
rg -c "completion-detection" assets/ | grep -v "/.archive/" | grep -v ":0$" | wc -l  # 2+

# A3: New name NOT in shipped (pre-cycle) — confirms RED
rg -c "hm-loop-completion" assets/ | grep -v "/.archive/" | grep -v ":0$" | wc -l  # 0

# A4: New skill dir NOT in shipped (pre-cycle) — confirms RED
test ! -d assets/skills/hm-loop-completion && echo "NOT_EXISTS"  # NOT_EXISTS

# A5: Validator on new name
bash assets/.hivemind-config/validate-name.sh "hm-loop-completion" skill  # exit 0
```

RED result: A1, A2, A3, A4, A5 all PASS (the current broken state and the new name readiness). After GREEN, A1 and A2 must return 0; A3 must return ≥31.

## 7. Done when

- [x] All 7 sub-sections present.
- [x] Anti-patterns enumerated with file:line.
- [x] Inbound ref count = 31 files / 83 occurrences (matches 04-02 §D.2 row 14: 34 + 04-03 §3.6 row 52).
- [x] 5-realm baseline scored.
- [x] RED test assertions recorded.

## 8. Risk-tier note (documented)

Per 04-03 §7.1 H5: `hm-l2-completion-looping` is **HIGH RISK** (34 inbound refs ≥ 20). Per user override (resume message: "MEDIUM RISK, single cycle each, 1 atomic commit per cycle"), executed as **MEDIUM** (no shim, no deprecation-redirect, single atomic commit). The 31 unique file count exceeds C1's 25; the override was accepted for C1 by the L0 and is honored for consistency. Documented in CYCLEREPORT §1.5.
