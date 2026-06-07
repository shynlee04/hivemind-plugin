# AUDIT-04 Cycle 4 — Stage 2 DESIGN

**Cycle ID**: 04-skill-04

## 1. Sources

- `hm-l2-cross-cutting-change/SKILL.md` (337 LOC) — pan-classification taxonomy (interface/deep_module/test/config/consumer), lifecycle-impact matrix, 6-gate system (G1-G6), decision tree. F01.
- `cross-cutting-change-mgmt/SKILL.md` (232 LOC) — framework-agnostic methodology, 7-phase workflow (Scan→Classify→Impact→Red-First→Implement→Verify→Handoff), rollback governance, anti-patterns. F03.

## 2. Composition

### 2.1 Foundation (from `cross-cutting-change-mgmt`)

- 7-phase workflow
- Universal layer taxonomy (Interface / Deep Module / Test / Config / Consumer)
- 3-pillar methodology (red-first + ordering + consumer tracing)
- Anti-patterns (8 patterns; consolidate with 8 from hm-l2-)
- Verification checklist (12 items)

### 2.2 Mechanics layer (from `hm-l2-cross-cutting-change`)

- Pan-classification (interface → deep_module → test → config → consumer with 5-row table)
- 6-gate system (G1 Scan, G2 Impact, G3 Red, G4 Order, G5 Honesty, G6 Handoff)
- Lifecycle-impact matrix schema (YAML)
- Handoff packet schema (change_id, pans_affected, files_changed, red/green evidence, rollback_steps)
- Decision tree for reference loading

### 2.3 Hivemind binding layer (NEW)

- `execute-slash-command` for child-skill dispatch
- `hivemind-agent-work` for durable change contracts
- `hivemind-trajectory` for change tracking
- `hm-platform-contracts` for pan-to-skill lookup (loaded by name)

### 2.4 GSD Compatibility (G.4)

`## GSD Compatibility` mapping `gsd-debug` (closest) → `hm-cross-change`. Note: GSD has no direct counterpart; Hivemind adds preventive governance.

### 2.5 Consumed-by re-binding

| Old | New |
|---|---|
| `hm-l2-executor` | `hm-executor` (CORRECT) |
| `hm-l2-builder` | `hm-builder` (phantom ABOLISH; keep for traceability) |
| `hm-l2-connector` | ABOLISH (P11) |
| `hm-l2-architect` | `hm-architect` (CORRECT, P5) |
| (add) | `hm-coord-loop` (C1 output) |
| (add) | `hm-platform-contracts` (central registry, future cycle) |

### 2.6 Items REMOVED

- Cross-references to `hm-test-driven-execution` (future cycle) and `hm-spec-driven-authoring` (future cycle) — keep as-is (still accurate; will be updated in those cycles)
- `references/terminology-map.md` (gsd-pause-work reference) — drop
- `layer: "2"` frontmatter (F01 implicit)

## 3. New SKILL.md skeleton

- frontmatter with `consumed-by` (5 names)
- `## GSD Compatibility` (G.4 — closest: gsd-debug)
- `## Overview`, `## When This Skill Loads`, `## Iron Law`, `## Three Pillars`
- `## Core Workflow (7 Phases)` with 6 gates
- `## Rollback Governance`
- `## Hivemind Runtime Bindings`
- `## Anti-Patterns` (consolidated 13+ patterns)
- `## Decision Tree`
- `## Self-Correction`, `## Verification Checklist`, `## Cross-References`

## 4. Length

~340 lines.

## 5. Naming validation

```bash
bash assets/.hivemind-config/validate-name.sh "hm-cross-change" skill
# Expected: exit 0
```

## 6. Sweep plan

20 unique files: 1 agents (hm-l0-orchestrator), 6 skills (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs, hivemind-power-on ref), 4 .hivemind/agents (hm-l2-connector, hm-l2-executor, hm-l2-integrator, hm-l2-optimizer), 4 .hivemind/skills (hm-l2-skill-router+2refs+evals, hm-l3-integration-contracts+2refs). Plus delete 2 mirror dirs.

## 7. Gate plan

Same 3-gate triad.

## 8. Done when

- [x] 6/6 sub-sections.
- [x] Composition strategy complete.
- [x] New SKILL.md written.
- [x] Naming plan.
- [x] Sweep plan.
- [x] Gate plan.
