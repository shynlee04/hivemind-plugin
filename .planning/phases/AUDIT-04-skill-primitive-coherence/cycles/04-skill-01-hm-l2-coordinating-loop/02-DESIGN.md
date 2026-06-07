# AUDIT-04 Cycle 1 — Stage 2 DESIGN

**Cycle ID**: 04-skill-01
**Stage**: 2 DESIGN — merged SKILL.md composition rationale
**Date**: 2026-06-07

---

## 1. Source inventory

### 1.1 Primary source (HM STRICT)

- **Path**: `assets/skills/hm-l2-coordinating-loop/SKILL.md`
- **Line count**: 441
- **Status**: F01 violation (residual `l2` prefix) per `naming-rules.json` §3.1.
- **Content shape**: Hivemind-specific coordinator; consumed-by lists `hm-l0-orchestrator`, `hm-l1-coordinator`, `hm-l2-connector`; references to `.opencode/get-shit-done/...` paths (F06 violation); GSD-thinking style anti-pattern table; ralph-loop integration.

### 1.2 Sibling source (FLEXIBLE, unprefixed)

- **Path**: `assets/skills/multi-agent-coordination/SKILL.md`
- **Line count**: 197
- **Status**: F03 violation (unprefixed whitelist violation — not in 10-name whitelist in `naming-rules.json`).
- **Content shape**: Framework-agnostic foundation; decision matrix with 3 patterns (parallel / wave / pipeline); handoff envelope; max-iteration enforcement; ralph-loop integration; verification protocol; self-correction protocol; minimal `references/terminology-map.md` (197-line, GSD/OMO comparison — borderline tech-ref).

### 1.3 Disposition (per 04-03 §3.6)

| Source | Disposition | New name | Lineage | Reason |
|---|---|---|---|---|
| `hm-l2-coordinating-loop` | MERGE | `hm-coord-loop` | HM STRICT | F01 residual; merge with sibling |
| `multi-agent-coordination` | ABSORB | (removed) | n/a | F03 unprefixed; absorbed into `hm-coord-loop` |

## 2. Composition strategy

### 2.1 Foundation (from `multi-agent-coordination`)

Adopt wholesale as the structural backbone because it is **already tech-agnostic** and matches 04-04 §9.1 "no tech-stack-specific refs in body":

- **Decision Matrix** (3 patterns: parallel / wave / pipeline + 2 simpler patterns: do-inline / parallel-2)
- **Decision Flowchart** (ASCII tree, framework-neutral)
- **3 Dispatch Protocols** (parallel / wave / pipeline) with explicit entry/exit criteria
- **Handoff Protocol — Minimum Viable Envelope** (5 required sections + YAML metadata block)
- **Checkpoint Protocol** (when to insert + format)
- **Max-Iteration Enforcement + Escalation Triggers** (≤5 budget, hard stop, 5 escalation triggers)
- **Ralph-Loop Integration** (validate → fix → re-dispatch; cycle < 3 fix, cycle = 3 escalate)
- **Anti-Patterns Table** (10 patterns: over-delegation, orphan subagents, merge-conflict batching, infinite retry, silent wave drift, checkpoint theater, dependency graph denial, context exhaustion, The Coordinator Executor, The Infinite Retry)
- **Verification Protocol** (7-item checklist)
- **Self-Correction** (3 sub-protocols: failing-task, unsure-step, user-contradicts-guidance)

### 2.2 Adaptation layer (Hivemind-specific bindings)

Add a **`## Platform Adaptation`** section that names the Hivemind-specific tools (custom `delegate-task`, `hivemind-trajectory`, `hivemind-sdk-supervisor`, the `.hivemind/state/` state root) as the **canonical Hivemind binding**, with a pointer to load the platform reference skill when needed. This keeps the body tech-agnostic while giving Hivemind consumers a concrete entry point.

### 2.3 GSD Compatibility section (per 04-04 §4 + 04-01 §G.1 G.3)

Add `## GSD Compatibility` table mapping the canonical GSD skill (`gsd-execute-phase`) to `hm-coord-loop`, documenting the **behavior diff** (GSD = sequential plan execution with hardcoded checkboxes; Hivemind = decision-matrix dispatch with validation gates + explicit lifecycle tools).

### 2.4 Consumed-by re-binding

Replace old `consumed-by: hm-l0-orchestrator, hm-l1-coordinator, hm-l2-connector` (all F01) with:

```yaml
consumed-by:
  - "hm-orchestrator"
  - "hm-coordinator"
  - "hf-coordinator"
```

These three are the canonical STRICT-lineage coordinator agents per 04-01 §F.2 (post-rename; the old `hm-l[0-3]-*` orchestrators are themselves slated for rename in a separate cycle outside this sub-wave).

### 2.5 Items REMOVED from merge

- **`references/terminology-map.md` (GSD/OMO/Hivemind comparison)** — borderline tech-ref (F06 risk). The skill is tech-agnostic; tech comparisons belong in `stack-` lineage, not `hm-` lineage. Drop entirely. (If a future cycle needs it, it can be re-created under `assets/references/`.)
- **Path references to `.opencode/get-shit-done/...`** — F06 violation. Replaced with Hivemind tool names.
- **Path references to `.opencode/skills/hm-coordinating-loop/...`** — these paths don't exist in shipped (only `.opencode/skills/hm-l2-coordinating-loop/` exists). Removed.
- **`consumed-by: hm-l[0-3]-*`** — F01 violations. Replaced with canonical STRICT lineage.

### 2.6 Items KEPT verbatim

- The 5-section Handoff Envelope (universally applicable).
- The 5-trigger Escalation Triggers table (universally applicable).
- The 10-row Anti-Patterns table (universally applicable).
- The 7-item Verification checklist (universally applicable).
- The 3-sub-protocol Self-Correction (universally applicable).

## 3. New SKILL.md skeleton

```
---
name: hm-coord-loop                              # §3.1 prefix: hm-coord-*
description: <275 chars third-person trigger>    # trigger conditions (auto-derive from old + new)
metadata:
  consumed-by: [hm-orchestrator, hm-coordinator, hf-coordinator]  # §2.4
  lineage-scope: "hm-*"
  access: "STRICT"                               # HM STRICT (was FLEXIBLE in old unprefixed)
  role: "coordinator"
  realm: "arch,clean-code"
  min-tasks: 2
allowed-tools: skill
---

## Overview                                      # §2.1
## GSD Compatibility                             # §2.3 (required by 04-04 §4)
## When This Skill Loads — Do This First        # §2.1 (4 steps)
## Decision Matrix: Task Complexity → Coordination Pattern  # §2.1
## Pattern 1: Parallel Dispatch                   # §2.1
## Pattern 2: Wave-Based Dispatch                 # §2.1
## Pattern 3: Pipeline (Sequential Dispatch)     # §2.1
## Handoff Protocol — Minimum Viable Envelope    # §2.1
## Checkpoint Protocol: Human-Gate Checkpoints in Agent Loops  # §2.1
## Max-Iteration Enforcement + Escalation        # §2.1
## Ralph-Loop Integration — Validate → Fix → Re-dispatch      # §2.1
## Anti-Patterns                                  # §2.1
## Verification Protocol                          # §2.1
## Self-Correction                                # §2.1
## Platform Adaptation                            # §2.2
## Cross-References                               # §2.1
```

## 4. Length and budget

- Target: 240–280 lines (well under 500 LOC hard cap, below 300-line target per master plan §2.3).
- New SKILL.md actual: 275 lines.
- Description: 251 chars (under 1024 cap).

## 5. Naming validation

```bash
bash assets/.hivemind-config/validate-name.sh "hm-coord-loop" skill
# Expected: exit 0
```

Pass condition:
- prefix `hm-coord-` in 22-prefix allowed list ✓
- name pattern `[a-z][a-z0-9-]*` ✓
- no F01–F12 forbidden pattern ✓
- lineage-scope `hm-*` matches STRICT ✓

## 6. Cross-ref sweep plan (Stage 4)

### 6.1 Replace mapping

| Old name | New name | Files affected |
|---|---|---|
| `hm-l2-coordinating-loop` | `hm-coord-loop` | 25 files (4 agents + 8 skills + 13 .hivemind mirror) |
| `multi-agent-coordination` | `hm-coord-loop` | 4 files (3 self-removed after archive + 1 wave-execution) |

**Note on `multi-agent-coordination`**: 3 of the 4 referencing skills are themselves absorbing this skill (`hm-l2-completion-looping`+`completion-detection` will be its own cycle, `hm-l2-phase-loop`+`iterative-loop` will be its own cycle, `multi-agent-coordination` itself will be archived in this cycle). The 4th (`wave-execution`) needs a one-line cross-ref update pointing to `hm-coord-loop` since `wave-execution` is a sibling pattern (not a merge candidate).

### 6.2 Phase order (per 04-04 §6 + 04-03 §4)

1. **Phase A** — `assets/agents/` (4 files: hf-coordinator, hf-l0-orchestrator, hf-meta-builder, hm-l0-orchestrator)
2. **Phase B** — `assets/skills/` surviving only (8 files: hm-l2-skill-router + evals, hm-l3-integration-contracts + 2 refs, wave-execution, hf-skill-router)
3. **Phase C** — `assets/commands/` (0 files)
4. **Phase D** — `assets/workflows/`, `assets/references/`, `assets/templates/` (0 files)
5. **Phase E** — `assets/.hivemind/` runtime mirror (13 files)

### 6.3 Special handling

- **`assets/.hivemind/skills/hm-l2-coordinating-loop/SKILL.md`**: this is a mirror of the to-be-archived source. Strategy: do NOT migrate the mirror name (it gets deleted when source is git-mv'd). Confirm via `node scripts/sync-assets.js` after `git mv` that mirror deletion propagates.
- **`assets/.hivemind/skills/hm-l2-skill-router/SKILL.md` + `evals/evals.json`**: update both. Evals.json `trigger_phrases` may need refresh.
- **`assets/.hivemind/agents/hm-l0-orchestrator.md`**: update the `consumed-by` chain. The agent itself is a separate rename cycle (outside this sub-wave).
- **Self-references in source SKILL.md**: will be removed by `git mv` (file moves to archive, the replacement is the new `hm-coord-loop/SKILL.md`).

## 7. Gate plan (Stage 5)

| Gate | Skill | Method | Pass criteria |
|---|---|---|---|
| Lifecycle integration | `gate-lifecycle-integration` | 9-surface mutation authority, CQRS, classification fit, SDK surface | new SKILL.md in `assets/skills/`, archived old in `assets/.archive/dev-tooling/skills/`, no orphan references |
| Spec compliance | `gate-spec-compliance` | 5-realm matrix, EARS acceptance, anti-pattern scan | 5-realm ≥ 12/15 (target lift from 9 → 12), all F01–F12 forbidden patterns absent |
| Evidence truth | `gate-evidence-truth` | L1-L5 evidence hierarchy | `validate-name.sh` exit 0, `sync-assets.js` exit 0, grep evidence of cross-ref replacement |

Skip `npm run typecheck` + `npm test` (per master plan §11.3 MEDIUM RISK — no TS source changes).

## 8. Risk register entry

| Risk | Tier | Mitigation | Residual |
|---|---|---|---|
| 25-file sweep is large | MEDIUM | `git mv` first (atomic), then per-phase `sed -i '' 's/old/new/g'`, then grep verify | Low |
| Mirror deletion propagation | MEDIUM | `sync-assets.js` runs clean; manual `ls .opencode/skills/` confirms | Low |
| `consumed-by` chain breaks downstream agents | LOW | Out-of-scope rename of `hm-l[0-3]-*` agents documented; cross-ref points to canonical STRICT agents | Low |
| Self-reference pollution | LOW | `git mv` removes source; `rg -c "hm-l2-coordinating-loop" assets/` should return 0 post-sweep | Low |

## 9. Done when

- [x] 6/6 sub-sections present.
- [x] Source inventory complete (2 sources).
- [x] Composition strategy specified (foundation + adaptation + GSD + consumed-by + removals + kept).
- [x] New SKILL.md skeleton matches actual written file (275 lines).
- [x] Naming validation plan specified.
- [x] Cross-ref sweep plan (29 files, 5 phases).
- [x] Gate plan (3 gates).
- [x] Risk register with mitigations.
